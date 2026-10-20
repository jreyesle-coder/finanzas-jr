import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerConfig } from "@/lib/config";
import { resumenMensual } from "@/lib/resumen";
import { aDOP, dinero } from "@/lib/format";
import { nombreMes } from "@/lib/amortizacion";
import { mesesHasta, planBolaDeNieve, ritmoMensual, saldoAtraso } from "@/lib/metas";
import { EncabezadoAccion, Progreso, Tarjeta, Vacio, Volver } from "@/components/ui";

export default async function AtrasosPage() {
  const [config, atrasos, r] = await Promise.all([
    obtenerConfig(),
    prisma.atraso.findMany({ include: { abonos: true }, orderBy: [{ prioridad: "asc" }] }),
    resumenMensual(),
  ]);
  const t = config.tasaUSDtoDOP;
  const conSaldo = atrasos.map((a) => ({ ...a, saldo: aDOP(saldoAtraso(a), a.moneda, t) }));
  const total = conSaldo.reduce((s, a) => s + a.saldo, 0);
  const original = atrasos.reduce((s, a) => s + aDOP(a.montoOriginal, a.moneda, t), 0);
  const ritmoReal = atrasos.reduce((s, a) => s + aDOP(ritmoMensual(a.abonos), a.moneda, t), 0);
  const plan = atrasos.filter((a) => saldoAtraso(a) > 0).reduce((s, a) => s + aDOP(a.abonoMensualPlan ?? 0, a.moneda, t), 0);
  const ritmo = ritmoReal > 0 ? ritmoReal : plan;
  const pasos = planBolaDeNieve(conSaldo, ritmo);
  const sugerido = Math.max(0, Math.round((r.superavit * 0.5) / 1000) * 1000);
  const mesesSugerido = mesesHasta(total, sugerido);

  return (
    <>
      <Volver href="/mas" texto="Más" />
      <EncabezadoAccion titulo="Atrasos" subtitulo="Separados del flujo del mes" href="/atrasos/nuevo" texto="Atraso" />

      <Tarjeta className="mb-3 border-amber-200 bg-amber-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Pendiente total</p>
        <p className="cifra mt-1 text-3xl font-semibold text-amber-900">{dinero(total)}</p>
        {original > 0 && (
          <div className="mt-3">
            <Progreso valor={1 - total / original} color="bg-amber-500" />
            <p className="mt-1 text-xs text-amber-800">
              Pagado {dinero(original - total)} de {dinero(original)}
            </p>
          </div>
        )}
      </Tarjeta>

      {total > 0 && (
        <Tarjeta className="mb-3">
          <h2 className="font-semibold">¿Cuándo quedan limpios?</h2>
          {ritmo > 0 ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                A {dinero(ritmo)}/mes ({ritmoReal > 0 ? "ritmo real de los últimos 3 meses" : "abono planeado"}), en orden de prioridad:
              </p>
              <ol className="mt-2 space-y-1 text-sm">
                {pasos.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.concepto}</span>
                    <span className="font-medium">{nombreMes(p.fin)}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-600">Todavía no hay abonos ni plan mensual. Registra un abono o pon un abono planeado en cada atraso.</p>
          )}
          {sugerido > 0 && mesesSugerido && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Si destinan la mitad del superávit ({dinero(sugerido)}/mes), quedan limpios en {mesesSugerido} {mesesSugerido === 1 ? "mes" : "meses"}.
            </p>
          )}
        </Tarjeta>
      )}

      {atrasos.length === 0 && <Vacio texto="Sin atrasos. 🎉" />}
      <ul className="space-y-3">
        {conSaldo.map((a) => (
          <li key={a.id}>
            <Link href={`/atrasos/${a.id}`} className={`block rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50 ${a.saldo <= 0 ? "opacity-60" : ""}`}>
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-medium">{a.concepto}</p>
                  <p className="text-xs text-slate-500">Prioridad {a.prioridad}{a.saldo <= 0 ? " · liquidado" : ""}</p>
                </div>
                <p className="cifra font-semibold">{dinero(saldoAtraso(a), a.moneda)}</p>
              </div>
              <div className="mt-3">
                <Progreso valor={a.montoAbonado / a.montoOriginal} color="bg-amber-500" />
                <p className="mt-1 text-xs text-slate-500">
                  Abonado {dinero(a.montoAbonado, a.moneda)} de {dinero(a.montoOriginal, a.moneda)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
