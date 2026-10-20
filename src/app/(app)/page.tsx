import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { resumenMensual, type Fase } from "@/lib/resumen";
import { flujoDelMes, proximosPagos } from "@/lib/flujo";
import { aDOP, ahoraMs, dinero } from "@/lib/format";
import { mesActual, rangoMes } from "@/lib/mes";
import { Etiqueta, Progreso, Tarjeta } from "@/components/ui";

const FASES: { clave: Fase; texto: string; color: string; criterio: string }[] = [
  { clave: "rescate", texto: "Rescate", color: "bg-red-500", criterio: "Gastan más de lo que entra" },
  { clave: "estabilizacion", texto: "Estabilización", color: "bg-amber-400", criterio: "Superávit, pero con atrasos o sin colchón completo" },
  { clave: "crecimiento", texto: "Crecimiento", color: "bg-emerald-500", criterio: "Sin atrasos y fondo de emergencia completo" },
];

function Seccion({ titulo, href, children }: { titulo: string; href?: string; children: React.ReactNode }) {
  return (
    <Tarjeta>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</h2>
        {href && (
          <Link href={href} className="text-xs font-medium text-emerald-700">
            Ver ›
          </Link>
        )}
      </div>
      {children}
    </Tarjeta>
  );
}

export default async function InicioPage() {
  const mes = mesActual();
  const { desde, hasta } = rangoMes(mes);
  const [sesion, r, flujo, proximos, fondos, atrasos, movs, deudasReajuste] = await Promise.all([
    obtenerSesion(),
    resumenMensual(),
    flujoDelMes(mes),
    proximosPagos(7),
    prisma.fondo.findMany({ orderBy: { tipo: "asc" } }),
    prisma.atraso.findMany({ orderBy: { prioridad: "asc" } }),
    prisma.movimiento.findMany({ where: { fecha: { gte: desde, lt: hasta } } }),
    prisma.deuda.findMany({ where: { activa: true, tasaFijaHasta: { not: null } } }),
  ]);
  const fase = FASES.find((f) => f.clave === r.fase)!;
  const atrasoOriginal = atrasos.reduce((a, x) => a + aDOP(x.montoOriginal, x.moneda, r.tasa), 0);
  const entro = movs.filter((m) => m.tipo === "ingreso").reduce((a, m) => a + aDOP(m.monto, m.moneda, r.tasa), 0);
  const salio = movs.filter((m) => m.tipo === "gasto").reduce((a, m) => a + aDOP(m.monto, m.moneda, r.tasa), 0);
  const ahora = ahoraMs();
  const reajustes = deudasReajuste.filter((d) => (d.tasaFijaHasta!.getTime() - ahora) / 86_400_000 <= 60);
  const proximoFaltante = flujo.faltantes[0];

  return (
    <div className="space-y-3">
      <header>
        <p className="text-sm text-slate-500">Hola, {sesion?.nombre}</p>
        <h1 className="text-xl font-semibold">Tablero</h1>
      </header>

      {/* Semáforo de fase */}
      <Tarjeta>
        <div className="flex gap-1.5">
          {FASES.map((f) => (
            <div key={f.clave} className={`h-2 flex-1 rounded-full ${f.clave === r.fase ? f.color : "bg-slate-100"}`} />
          ))}
        </div>
        <p className="mt-2 text-sm">
          Fase actual: <b>{fase.texto}</b>
        </p>
        <p className="text-xs text-slate-500">{fase.criterio}.</p>
      </Tarjeta>

      {/* Superávit */}
      <Tarjeta className="border-slate-900 bg-slate-900 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-400">{r.superavit >= 0 ? "Superávit mensual" : "Déficit mensual"}</p>
        <p className={`cifra mt-1 text-3xl font-semibold ${r.superavit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {r.superavit >= 0 ? "+" : ""}
          {dinero(r.superavit)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Ingresos</p>
            <p className="cifra font-medium">{dinero(r.ingresosTotal)}</p>
          </div>
          <div>
            <p className="text-slate-400">Egresos (gastos + cuotas)</p>
            <p className="cifra font-medium">{dinero(r.egresosTotal)}</p>
          </div>
        </div>
        <div className="mt-3 border-t border-slate-700 pt-3">
          <p className="text-slate-400 text-xs">Disponible manejable real</p>
          <p className={`cifra text-lg font-semibold ${r.disponibleManejable >= 0 ? "text-white" : "text-red-400"}`}>{dinero(r.disponibleManejable)}</p>
          <p className="text-[11px] text-slate-400">Sin contar CORPHOTELS → auto-débito Banreservas (sobran {dinero(r.sobranteAuto)} ahí).</p>
        </div>
      </Tarjeta>

      {/* Iliquidez */}
      {proximoFaltante ? (
        <Link href="/flujo" className="block rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">⚠ Descalce de fechas este mes</p>
          <p className="mt-1 text-sm text-red-700">
            {proximoFaltante.desde === proximoFaltante.hasta ? `El día ${proximoFaltante.desde}` : `Del ${proximoFaltante.desde} al ${proximoFaltante.hasta}`} les faltan hasta{" "}
            <b className="cifra">{dinero(-proximoFaltante.peor)}</b>
            {flujo.faltantes.length > 1 ? ` (y ${flujo.faltantes.length - 1} tramo(s) más)` : ""}.
          </p>
          {flujo.sinDia.ingresos.length > 0 && <p className="mt-1 text-xs text-red-700">Incluye ingresos sin día de cobro fuera del cálculo: asignarles día lo corrige.</p>}
        </Link>
      ) : (
        <Link href="/flujo" className="block rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          ✓ Sin días de iliquidez este mes. Saldo mínimo {dinero(flujo.peorDia.saldo)} el día {flujo.peorDia.dia}.
        </Link>
      )}

      {/* Próximos pagos */}
      <Seccion titulo="Próximos pagos (7 días)" href="/flujo">
        {proximos.length === 0 ? (
          <p className="text-sm text-slate-500">Nada en la próxima semana.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {proximos.map((p) => (
              <li key={p.href + p.fecha.toISOString()} className="flex items-center justify-between py-1.5 text-sm">
                <Link href={p.href} className="min-w-0 truncate pr-2">
                  {p.concepto} {p.auto && <Etiqueta tono="azul">Auto</Etiqueta>}
                  <span className="block text-xs text-slate-500">{p.dias === 0 ? "Hoy" : p.dias === 1 ? "Mañana" : `En ${p.dias} días`}</span>
                </Link>
                <span className="cifra font-medium">{dinero(p.monto, p.moneda)}</span>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/deudas" className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Deuda total</p>
          <p className="cifra mt-1 text-lg font-semibold">{dinero(r.deudaTotal)}</p>
          <p className="cifra text-[11px] text-slate-500">{dinero(r.cuotasTotal)}/mes en cuotas</p>
        </Link>
        <Link href="/atrasos" className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Atrasos</p>
          <p className={`cifra mt-1 text-lg font-semibold ${r.atrasosSaldo > 0 ? "text-amber-700" : "text-emerald-700"}`}>{dinero(r.atrasosSaldo)}</p>
          {atrasoOriginal > 0 && (
            <div className="mt-1.5">
              <Progreso valor={1 - r.atrasosSaldo / atrasoOriginal} color="bg-amber-500" />
            </div>
          )}
        </Link>
      </div>

      {/* Fondos */}
      <Seccion titulo="Fondos" href="/fondos">
        <ul className="space-y-2">
          {fondos.map((f) => (
            <li key={f.id}>
              <div className="flex justify-between text-sm">
                <span>{f.nombre}</span>
                <span className="cifra font-medium">
                  {dinero(f.saldoActual, f.moneda)}
                  {f.meta ? <span className="text-xs font-normal text-slate-500"> / {dinero(f.meta, f.moneda)}</span> : null}
                </span>
              </div>
              {f.meta ? (
                <div className="mt-1">
                  <Progreso valor={f.saldoActual / f.meta} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Seccion>

      {/* Real del mes */}
      <Seccion titulo="Registrado este mes" href="/movimientos">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-xs text-slate-500">Entró</p>
            <p className="cifra font-semibold text-emerald-700">{dinero(entro)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Salió</p>
            <p className="cifra font-semibold text-red-600">{dinero(salio)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Movimientos</p>
            <p className="cifra font-semibold">{movs.length}</p>
          </div>
        </div>
      </Seccion>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/simulador" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          Simular abono extra ›
        </Link>
        <Link href="/proyeccion" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          Proyección de salida ›
        </Link>
      </div>

      {(r.porVerificar > 0 || reajustes.length > 0) && (
        <div className="space-y-2">
          {reajustes.map((d) => (
            <Link key={d.id} href={`/deudas/${d.id}`} className="block rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              La tasa fija de {d.nombre} vence pronto: revisar reajuste.
            </Link>
          ))}
          {r.porVerificar > 0 && (
            <Link href="/ingresos" className="block rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {r.porVerificar} ingreso(s) marcados &ldquo;por verificar&rdquo; (recurrencia o día de cobro).
            </Link>
          )}
        </div>
      )}
      <p className="text-center text-xs text-slate-400">Montos consolidados en DOP · tasa USD {r.tasa}</p>
    </div>
  );
}
