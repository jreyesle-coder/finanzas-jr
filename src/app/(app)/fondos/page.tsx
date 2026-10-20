import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerConfig } from "@/lib/config";
import { aDOP, dinero } from "@/lib/format";
import { mesFinal, nombreMes } from "@/lib/amortizacion";
import { mesesHasta, ritmoMensual } from "@/lib/metas";
import { EncabezadoAccion, Etiqueta, Progreso, Tarjeta, Vacio, Volver } from "@/components/ui";

export default async function FondosPage() {
  const [config, fondos] = await Promise.all([obtenerConfig(), prisma.fondo.findMany({ include: { aportes: true }, orderBy: { tipo: "asc" } })]);
  const t = config.tasaUSDtoDOP;
  const total = fondos.reduce((s, f) => s + aDOP(f.saldoActual, f.moneda, t), 0);

  return (
    <>
      <Volver href="/mas" texto="Más" />
      <EncabezadoAccion titulo="Fondos y metas" subtitulo="El colchón de la familia" href="/fondos/nuevo" texto="Fondo" />
      <Tarjeta className="mb-3">
        <p className="text-xs text-slate-500">Total ahorrado</p>
        <p className="cifra text-2xl font-semibold text-emerald-700">{dinero(total)}</p>
      </Tarjeta>
      {fondos.length === 0 && <Vacio texto="Sin fondos todavía." />}
      <ul className="space-y-3">
        {fondos.map((f) => {
          const ritmo = ritmoMensual(f.aportes);
          const usar = ritmo > 0 ? ritmo : (f.aporteMensualPlan ?? 0);
          const meses = f.meta ? mesesHasta(f.meta - f.saldoActual, usar) : null;
          return (
            <li key={f.id}>
              <Link href={`/fondos/${f.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium">{f.nombre}</p>
                    <Etiqueta tono={f.tipo === "emergencia" ? "rojo" : f.tipo === "medico" ? "azul" : "gris"}>
                      {f.tipo === "emergencia" ? "Emergencia" : f.tipo === "medico" ? "Médico" : "Otro"}
                    </Etiqueta>
                  </div>
                  <div className="text-right">
                    <p className="cifra font-semibold">{dinero(f.saldoActual, f.moneda)}</p>
                    <p className="cifra text-xs text-slate-500">{f.meta ? `meta ${dinero(f.meta, f.moneda)}` : "sin meta"}</p>
                  </div>
                </div>
                {f.meta && (
                  <div className="mt-3">
                    <Progreso valor={f.saldoActual / f.meta} />
                    <p className="mt-1 text-xs text-slate-500">
                      {Math.round((f.saldoActual / f.meta) * 100)}%
                      {f.saldoActual >= f.meta ? " · meta alcanzada" : meses ? ` · a ${dinero(usar, f.moneda)}/mes llegan en ${nombreMes(mesFinal(meses))}` : " · define un aporte mensual"}
                    </p>
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
