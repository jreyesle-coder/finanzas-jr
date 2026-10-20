import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { dinero, fecha } from "@/lib/format";
import { hoyInput } from "@/lib/form";
import { mesFinal, nombreMes } from "@/lib/amortizacion";
import { mesesHasta, ritmoMensual, saldoAtraso } from "@/lib/metas";
import { Encabezado, Progreso, Tarjeta, Volver } from "@/components/ui";
import { Campo, Dos, FormEstado } from "@/components/form-estado";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { CamposAtraso } from "../campos";
import { abonarAtraso, actualizarAtraso, eliminarAbono, eliminarAtraso } from "../actions";

export default async function AtrasoPage({ params }: PageProps<"/atrasos/[id]">) {
  const { id } = await params;
  const a = await prisma.atraso.findUnique({ where: { id }, include: { abonos: { orderBy: { fecha: "desc" } } } });
  if (!a) notFound();
  const saldo = saldoAtraso(a);
  const ritmo = ritmoMensual(a.abonos);
  const usar = ritmo > 0 ? ritmo : (a.abonoMensualPlan ?? 0);
  const meses = mesesHasta(saldo, usar);

  return (
    <div className="space-y-3">
      <Volver href="/atrasos" texto="Atrasos" />
      <Encabezado titulo={a.concepto} subtitulo={`Prioridad ${a.prioridad}`} />

      <Tarjeta>
        <p className="text-xs text-slate-500">Saldo</p>
        <p className="cifra text-3xl font-semibold">{dinero(saldo, a.moneda)}</p>
        <div className="mt-3">
          <Progreso valor={a.montoAbonado / a.montoOriginal} color="bg-amber-500" />
          <p className="mt-1 text-xs text-slate-500">
            Abonado {dinero(a.montoAbonado, a.moneda)} de {dinero(a.montoOriginal, a.moneda)}
          </p>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {saldo <= 0
            ? "Liquidado. 🎉"
            : meses
              ? `A ${dinero(usar, a.moneda)}/mes (${ritmo > 0 ? "ritmo real" : "plan"}) quedas limpio en ${nombreMes(mesFinal(meses))}.`
              : "Sin ritmo de abono todavía: registra un abono o define un plan mensual."}
        </p>
      </Tarjeta>

      {saldo > 0 && (
        <Tarjeta>
          <h2 className="mb-3 font-semibold">Abonar</h2>
          <FormEstado accion={abonarAtraso.bind(null, id)} boton="Registrar abono">
            <Dos>
              <Campo etiqueta="Monto" name="monto" inputMode="decimal" defaultValue={a.abonoMensualPlan ?? ""} required />
              <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={hoyInput()} required />
            </Dos>
            <Campo etiqueta="Nota" name="nota" placeholder="Opcional" />
          </FormEstado>
        </Tarjeta>
      )}

      <Tarjeta>
        <h2 className="mb-2 font-semibold">Abonos</h2>
        {a.abonos.length === 0 ? (
          <p className="text-sm text-slate-500">Sin abonos todavía.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {a.abonos.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="cifra font-medium">{dinero(x.monto, a.moneda)}</span>
                  <span className="block text-xs text-slate-500">
                    {fecha(x.fecha)}
                    {x.nota ? ` · ${x.nota}` : ""}
                  </span>
                </span>
                <BotonConfirmar accion={eliminarAbono.bind(null, x.id)} mensaje="¿Anular este abono?" className="text-xs text-red-600">
                  Anular
                </BotonConfirmar>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-semibold">Editar atraso</summary>
        <div className="mt-3">
          <FormEstado accion={actualizarAtraso.bind(null, id)} boton="Guardar cambios">
            <CamposAtraso a={a} />
          </FormEstado>
        </div>
        <div className="mt-4 text-center">
          <BotonConfirmar accion={eliminarAtraso.bind(null, id)} mensaje={`¿Eliminar "${a.concepto}" y sus abonos?`}>
            Eliminar atraso
          </BotonConfirmar>
        </div>
      </details>
    </div>
  );
}
