import { prisma } from "@/lib/db";
import { obtenerConfig } from "@/lib/config";
import { aDOP, dinero, fecha } from "@/lib/format";
import { moverMes, rangoMes, tituloMes, validarMes } from "@/lib/mes";
import { EncabezadoAccion, SelectorMes, Tarjeta, Vacio, Volver } from "@/components/ui";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { eliminarMovimiento } from "../_presupuesto/actions";

export default async function MovimientosPage({ searchParams }: PageProps<"/movimientos">) {
  const mes = validarMes((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const [config, movs, gastosPresupuesto] = await Promise.all([
    obtenerConfig(),
    prisma.movimiento.findMany({
      where: { fecha: { gte: desde, lt: hasta } },
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { nombre: true } }, cuenta: { select: { nombre: true } } },
    }),
    prisma.gasto.findMany({ where: { activo: true, frecuencia: "recurrente" } }),
  ]);
  const t = config.tasaUSDtoDOP;
  const ingresos = movs.filter((m) => m.tipo === "ingreso").reduce((a, m) => a + aDOP(m.monto, m.moneda, t), 0);
  const gastos = movs.filter((m) => m.tipo === "gasto").reduce((a, m) => a + aDOP(m.monto, m.moneda, t), 0);

  // Real vs presupuesto por categoría de gasto
  const porCat = new Map<string, { real: number; presupuesto: number }>();
  for (const g of gastosPresupuesto) {
    const e = porCat.get(g.categoria) ?? { real: 0, presupuesto: 0 };
    e.presupuesto += aDOP(g.monto, g.moneda, t);
    porCat.set(g.categoria, e);
  }
  for (const m of movs.filter((m) => m.tipo === "gasto")) {
    const e = porCat.get(m.categoria) ?? { real: 0, presupuesto: 0 };
    e.real += aDOP(m.monto, m.moneda, t);
    porCat.set(m.categoria, e);
  }
  const categorias = [...porCat.entries()].filter(([, v]) => v.real > 0).sort((a, b) => b[1].real - a[1].real);

  return (
    <>
      <Volver href="/mas" texto="Más" />
      <EncabezadoAccion titulo="Movimientos" subtitulo="Registro real del día a día" href="/registrar" texto="Registrar" />
      <SelectorMes base="/movimientos" mes={mes} anterior={moverMes(mes, -1)} siguiente={moverMes(mes, 1)} titulo={tituloMes(mes)} />

      <Tarjeta className="mb-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-500">Entró</p>
            <p className="cifra text-sm font-semibold text-emerald-700">{dinero(ingresos)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Salió</p>
            <p className="cifra text-sm font-semibold text-red-600">{dinero(gastos)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Neto</p>
            <p className={`cifra text-sm font-semibold ${ingresos - gastos >= 0 ? "text-emerald-700" : "text-red-600"}`}>{dinero(ingresos - gastos)}</p>
          </div>
        </div>
      </Tarjeta>

      {categorias.length > 0 && (
        <Tarjeta className="mb-3">
          <h2 className="mb-2 text-sm font-semibold">Gastado vs presupuesto</h2>
          <ul className="space-y-2">
            {categorias.map(([cat, v]) => {
              const pct = v.presupuesto ? v.real / v.presupuesto : 1;
              return (
                <li key={cat}>
                  <div className="flex justify-between text-xs">
                    <span>{cat}</span>
                    <span className="cifra text-slate-500">
                      {dinero(v.real)} / {v.presupuesto ? dinero(v.presupuesto) : "sin presupuesto"}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full ${pct > 1 ? "bg-red-500" : pct > 0.85 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Tarjeta>
      )}

      {movs.length === 0 ? (
        <Vacio texto="Sin movimientos este mes." />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {movs.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.categoria}</p>
                <p className="truncate text-xs text-slate-500">
                  {fecha(m.fecha)}
                  {m.user ? ` · ${m.user.nombre}` : ""}
                  {m.cuenta ? ` · ${m.cuenta.nombre}` : ""}
                  {m.nota ? ` · ${m.nota}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`cifra text-sm font-semibold ${m.tipo === "gasto" ? "text-red-600" : "text-emerald-700"}`}>
                  {m.tipo === "gasto" ? "−" : "+"}
                  {dinero(m.monto, m.moneda)}
                </span>
                <BotonConfirmar accion={eliminarMovimiento.bind(null, m.id)} mensaje="¿Borrar este movimiento?" className="text-xs text-slate-400">
                  ✕
                </BotonConfirmar>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
