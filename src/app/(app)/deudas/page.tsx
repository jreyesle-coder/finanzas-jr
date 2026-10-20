import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerConfig } from "@/lib/config";
import { aDOP, dinero } from "@/lib/format";
import { mesFinal, nombreMes, proyectar } from "@/lib/amortizacion";
import { ETIQUETA_TIPO_DEUDA } from "@/lib/opciones";
import { EncabezadoAccion, Etiqueta, Progreso, Tarjeta, Vacio } from "@/components/ui";

export default async function DeudasPage() {
  const [config, deudas] = await Promise.all([
    obtenerConfig(),
    prisma.deuda.findMany({ orderBy: [{ activa: "desc" }, { saldoActual: "desc" }] }),
  ]);
  const t = config.tasaUSDtoDOP;
  const activas = deudas.filter((d) => d.activa);
  const total = activas.reduce((a, d) => a + aDOP(d.saldoActual, d.moneda, t), 0);
  const cuotas = activas.reduce((a, d) => a + aDOP(d.cuotaMensual, d.moneda, t), 0);
  const cuotasAuto = activas.filter((d) => d.autoDebito).reduce((a, d) => a + aDOP(d.cuotaMensual, d.moneda, t), 0);

  return (
    <>
      <EncabezadoAccion titulo="Deudas" subtitulo={`${activas.length} activas`} href="/deudas/nueva" texto="Deuda" />

      <Tarjeta className="mb-3 border-slate-900 bg-slate-900 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-400">Deuda total consolidada</p>
        <p className="cifra mt-1 text-3xl font-semibold">{dinero(total)}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Cuotas al mes</p>
            <p className="cifra font-medium">{dinero(cuotas)}</p>
          </div>
          <div>
            <p className="text-slate-400">De eso auto-debitado</p>
            <p className="cifra font-medium">{dinero(cuotasAuto)}</p>
          </div>
        </div>
      </Tarjeta>

      {deudas.length === 0 && <Vacio texto="No hay deudas registradas." />}

      <ul className="space-y-3">
        {deudas.map((d) => {
          const p = proyectar(d.saldoActual, d.cuotaMensual, d.tasaAnual);
          const progreso = d.plazoMeses ? d.cuotasPagadas / d.plazoMeses : null;
          return (
            <li key={d.id}>
              <Link href={`/deudas/${d.id}`} className={`block rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50 ${d.activa ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{d.nombre}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Etiqueta>{ETIQUETA_TIPO_DEUDA[d.tipo] ?? d.tipo}</Etiqueta>
                      {d.autoDebito && <Etiqueta tono="azul">Auto-débito</Etiqueta>}
                      {d.permitePrepago && <Etiqueta tono="verde">Prepago</Etiqueta>}
                      {!d.activa && <Etiqueta tono="verde">Saldada</Etiqueta>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="cifra font-semibold">{dinero(d.saldoActual, d.moneda)}</p>
                    <p className="cifra text-xs text-slate-500">
                      {dinero(d.cuotaMensual, d.moneda)}/mes{d.diaPago ? ` · día ${d.diaPago}` : ""}
                    </p>
                  </div>
                </div>
                {progreso !== null && (
                  <div className="mt-3">
                    <Progreso valor={progreso} />
                    <p className="mt-1 text-xs text-slate-500">
                      {d.cuotasPagadas} de {d.plazoMeses} cuotas · {Math.round(progreso * 100)}%
                    </p>
                  </div>
                )}
                {d.activa && (
                  <p className="mt-2 text-xs text-slate-500">
                    {p.liquidable ? `Al ritmo actual termina en ${nombreMes(mesFinal(p.meses))}${d.tasaAnual == null ? " (sin tasa registrada)" : ""}` : "La cuota no cubre el interés: revisar"}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
