import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerConfig } from "@/lib/config";
import { aDOP, dinero, fecha } from "@/lib/format";
import { EncabezadoAccion, Etiqueta, Tarjeta, Vacio, Volver } from "@/components/ui";

export default async function GastosPage() {
  const [config, gastos] = await Promise.all([
    obtenerConfig(),
    prisma.gasto.findMany({ orderBy: [{ activo: "desc" }, { categoria: "asc" }, { diaDelMes: "asc" }] }),
  ]);
  const t = config.tasaUSDtoDOP;
  const activos = gastos.filter((g) => g.activo && g.frecuencia === "recurrente");
  const total = activos.reduce((a, g) => a + aDOP(g.monto, g.moneda, t), 0);
  const fijos = activos.filter((g) => g.tipo === "fijo").reduce((a, g) => a + aDOP(g.monto, g.moneda, t), 0);
  const categorias = Array.from(new Set(gastos.map((g) => g.categoria)));

  return (
    <>
      <Volver href="/mas" texto="Más" />
      <EncabezadoAccion titulo="Gastos" subtitulo="Presupuesto mensual del hogar" href="/gastos/nuevo" texto="Gasto" />

      <Tarjeta className="mb-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500">Total recurrente</p>
            <p className="cifra text-lg font-semibold">{dinero(total)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Fijos / variables</p>
            <p className="cifra text-sm font-medium">
              {dinero(fijos)} / {dinero(total - fijos)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">Las cuotas de préstamos se manejan en Deudas y no se repiten aquí.</p>
      </Tarjeta>

      {gastos.length === 0 && <Vacio texto="No hay gastos registrados." />}

      {categorias.map((cat) => {
        const lista = gastos.filter((g) => g.categoria === cat);
        const sub = lista.filter((g) => g.activo && g.frecuencia === "recurrente").reduce((a, g) => a + aDOP(g.monto, g.moneda, t), 0);
        return (
          <section key={cat} className="mb-4">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">{cat}</h2>
              <span className="cifra text-xs text-slate-500">{dinero(sub)}</span>
            </div>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {lista.map((g) => (
                <li key={g.id}>
                  <Link href={`/gastos/${g.id}`} className={`flex items-center justify-between gap-2 px-4 py-3 active:bg-slate-50 ${g.activo ? "" : "opacity-50"}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{g.descripcion}</p>
                      <p className="text-xs text-slate-500">
                        {g.frecuencia === "puntual" ? (g.fecha ? `Puntual · ${fecha(g.fecha)}` : "Puntual") : g.diaDelMes ? `Día ${g.diaDelMes}` : "Sin día fijo"}{" "}
                        <Etiqueta tono={g.tipo === "fijo" ? "gris" : "azul"}>{g.tipo === "fijo" ? "Fijo" : "Variable"}</Etiqueta>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="cifra text-sm font-semibold">{dinero(g.monto, g.moneda)}</p>
                      {g.moneda === "USD" && <p className="cifra text-xs text-slate-500">≈ {dinero(aDOP(g.monto, g.moneda, t))}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
