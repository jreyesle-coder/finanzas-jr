"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { mesFinal, nombreMes, proyectar } from "@/lib/amortizacion";
import { dinero } from "@/lib/format";

export type DeudaSimulable = {
  id: string;
  nombre: string;
  saldo: number;
  cuota: number;
  tasaAnual: number | null;
  moneda: string;
  permitePrepago: boolean;
  condicionesPrepago: string | null;
  limiteAnualPct: number | null; // p. ej. 30 si "hasta 30% anual"
  abonadoEsteAnio: number;
};

function leer(v: string) {
  const n = Number(v.replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function Simulador({ deudas, inicial }: { deudas: DeudaSimulable[]; inicial?: string }) {
  const [id, setId] = useState(inicial && deudas.some((d) => d.id === inicial) ? inicial : deudas[0]?.id);
  const [abono, setAbono] = useState("");
  const [extra, setExtra] = useState("");
  const d = deudas.find((x) => x.id === id);

  const r = useMemo(() => {
    if (!d) return null;
    const base = proyectar(d.saldo, d.cuota, d.tasaAnual);
    const con = proyectar(d.saldo, d.cuota, d.tasaAnual, { abonoInicial: Math.min(leer(abono), d.saldo), extraMensual: leer(extra) });
    return { base, con };
  }, [d, abono, extra]);

  if (!d || !r) return <p className="text-sm text-slate-500">No hay deudas activas para simular.</p>;

  // Límite de prepago anual (ej. 30% del saldo) menos lo ya abonado este año
  const limite = d.limiteAnualPct ? Math.max(0, (d.saldo + d.abonadoEsteAnio) * (d.limiteAnualPct / 100) - d.abonadoEsteAnio) : null;
  const abonoN = leer(abono);
  const extraAnual = leer(extra) * 12;
  const excede = limite !== null && abonoN + extraAnual > limite + 0.5;
  const ahorro = r.base.interesTotal - r.con.interesTotal;
  const mesesMenos = r.base.meses - r.con.meses;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Préstamo</span>
        <select value={id} onChange={(e) => setId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base">
          {deudas.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nombre}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        <p>
          Saldo <span className="cifra font-semibold">{dinero(d.saldo, d.moneda)}</span> · cuota {dinero(d.cuota, d.moneda)} · tasa{" "}
          {d.tasaAnual != null ? `${d.tasaAnual}%` : "sin registrar"}
        </p>
        {d.permitePrepago ? (
          <p className="mt-1 text-xs text-emerald-700">
            Prepago: {d.condicionesPrepago ?? "permitido"}
            {limite !== null && ` · disponible este año ≈ ${dinero(limite, d.moneda)}`}
          </p>
        ) : (
          <p className="mt-1 text-xs text-amber-700">Prepago sin confirmar con el banco: verificar condiciones y penalidad.</p>
        )}
        {d.tasaAnual == null && <p className="mt-1 text-xs text-amber-700">Sin tasa registrada no hay intereses que ahorrar; solo se acorta el plazo.</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Abono único hoy</span>
          <input value={abono} onChange={(e) => setAbono(e.target.value)} inputMode="decimal" placeholder="0" className="cifra mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Extra cada mes</span>
          <input value={extra} onChange={(e) => setExtra(e.target.value)} inputMode="decimal" placeholder="0" className="cifra mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base" />
        </label>
      </div>
      <p className="-mt-1 text-xs text-slate-500">Todo va a capital manteniendo la cuota: se reduce el plazo.</p>

      {excede && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          Supera el límite de prepago del año ({dinero(limite!, d.moneda)}). Lo que pase de ahí podría tener penalidad.
        </p>
      )}

      <div className={`rounded-2xl border p-4 ${abonoN || leer(extra) ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
        {abonoN || leer(extra) ? (
          r.con.liquidable ? (
            <>
              <p className="text-sm text-emerald-900">
                Si abonas {abonoN ? dinero(abonoN, d.moneda) : ""}
                {abonoN && leer(extra) ? " y " : ""}
                {leer(extra) ? `${dinero(leer(extra), d.moneda)} extra al mes` : ""}:
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-emerald-800">Ahorras en intereses</dt>
                  <dd className="cifra text-xl font-semibold text-emerald-800">{Number.isFinite(ahorro) ? dinero(ahorro, d.moneda) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-emerald-800">Terminas en</dt>
                  <dd className="text-xl font-semibold text-emerald-800">{nombreMes(mesFinal(r.con.meses))}</dd>
                </div>
                <div>
                  <dt className="text-xs text-emerald-800">Cuotas menos</dt>
                  <dd className="cifra font-semibold">{Number.isFinite(mesesMenos) ? mesesMenos : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-emerald-800">Antes terminabas</dt>
                  <dd className="font-semibold">{r.base.liquidable ? nombreMes(mesFinal(r.base.meses)) : "nunca"}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-red-700">Con estos montos la cuota no cubre el interés.</p>
          )
        ) : (
          <p className="text-sm text-slate-600">
            Al ritmo actual terminas en <b>{r.base.liquidable ? nombreMes(mesFinal(r.base.meses)) : "—"}</b> y pagas{" "}
            <b className="cifra">{Number.isFinite(r.base.interesTotal) ? dinero(r.base.interesTotal, d.moneda) : "—"}</b> de intereses. Escribe un abono para comparar.
          </p>
        )}
      </div>
      <Link href={`/deudas/${d.id}`} className="block text-center text-sm font-medium text-emerald-700">
        Ir a la deuda para registrar el abono ›
      </Link>
    </div>
  );
}
