import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerConfig } from "@/lib/config";
import { resumenMensual } from "@/lib/resumen";
import { simularCartera } from "@/lib/estrategia";
import { aDOP, dinero } from "@/lib/format";
import { mesFinal, nombreMes } from "@/lib/amortizacion";
import { mesActual } from "@/lib/mes";
import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { GraficaDeuda } from "./grafica";

export default async function ProyeccionPage({ searchParams }: PageProps<"/proyeccion">) {
  const sp = await searchParams;
  const [config, deudas, r] = await Promise.all([obtenerConfig(), prisma.deuda.findMany({ where: { activa: true }, orderBy: { saldoActual: "desc" } }), resumenMensual()]);
  const t = config.tasaUSDtoDOP;
  const sugerido = Math.max(0, Math.round((r.superavit * 0.5) / 1000) * 1000);
  const extraParam = Number(String(sp.extra ?? "").replace(/[,\s]/g, ""));
  const extra = Number.isFinite(extraParam) && String(sp.extra ?? "") !== "" ? Math.max(0, extraParam) : sugerido;

  const sim = deudas.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    saldo: aDOP(d.saldoActual, d.moneda, t),
    cuota: aDOP(d.cuotaMensual, d.moneda, t),
    tasaAnual: d.tasaAnual,
  }));
  const base = simularCartera(sim, 0, { bolaDeNieve: false }); // cada préstamo a su ritmo actual
  const con = simularCartera(sim, extra);
  const ahorro = base.interesTotal - con.interesTotal;

  return (
    <div className="space-y-3">
      <Volver href="/mas" texto="Más" />
      <Encabezado titulo="Proyección de salida" subtitulo="Cuándo se liquida cada préstamo" />

      <Tarjeta>
        <form className="flex items-end gap-2">
          <label className="block flex-1">
            <span className="text-sm font-medium text-slate-700">Extra mensual a deudas</span>
            <input name="extra" defaultValue={extra} inputMode="decimal" className="cifra mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base" />
          </label>
          <button className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">Calcular</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Sugerido: la mitad del superávit ({dinero(sugerido)}). Estrategia avalancha: el extra va a la deuda de mayor tasa y, al liquidarla, su cuota se suma a la siguiente.
        </p>
      </Tarjeta>

      <Tarjeta className="border-emerald-200 bg-emerald-50">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-emerald-800">Libres de deuda</dt>
            <dd className="text-lg font-semibold text-emerald-900">{con.meses !== null ? nombreMes(mesFinal(con.meses)) : "—"}</dd>
            <dd className="text-xs text-emerald-800">sin extra: {base.meses !== null ? nombreMes(mesFinal(base.meses)) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-emerald-800">Intereses ahorrados</dt>
            <dd className="cifra text-lg font-semibold text-emerald-900">{dinero(ahorro)}</dd>
            <dd className="text-xs text-emerald-800">{base.meses !== null && con.meses !== null ? `${base.meses - con.meses} meses antes` : ""}</dd>
          </div>
        </dl>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-2 font-semibold">Deuda total en el tiempo</h2>
        <GraficaDeuda base={base.serie} con={con.serie} inicio={mesActual()} />
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-2 font-semibold">Préstamo por préstamo</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="pb-1 font-medium">Deuda</th>
              <th className="pb-1 text-right font-medium">Sin extra</th>
              <th className="pb-1 text-right font-medium">Con extra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deudas.map((d) => {
              const b = base.porDeuda[d.id];
              const c = con.porDeuda[d.id];
              return (
                <tr key={d.id}>
                  <td className="py-2 pr-2">
                    <Link href={`/deudas/${d.id}`} className="font-medium">
                      {d.nombre}
                    </Link>
                    {d.tasaAnual == null && <span className="block text-[11px] text-amber-700">sin tasa registrada</span>}
                  </td>
                  <td className="py-2 text-right text-slate-500">{b.meses !== null ? nombreMes(mesFinal(b.meses)) : "—"}</td>
                  <td className="py-2 text-right font-medium text-emerald-700">{c.meses !== null ? nombreMes(mesFinal(c.meses)) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Tarjeta>
    </div>
  );
}
