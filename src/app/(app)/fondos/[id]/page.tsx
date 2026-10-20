import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { dinero, fecha } from "@/lib/format";
import { hoyInput } from "@/lib/form";
import { mesFinal, nombreMes } from "@/lib/amortizacion";
import { mesesHasta, ritmoMensual } from "@/lib/metas";
import { Encabezado, Progreso, Tarjeta, Volver } from "@/components/ui";
import { Campo, Dos, FormEstado, Selector } from "@/components/form-estado";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { CamposFondo } from "../campos";
import { actualizarFondo, eliminarAporte, eliminarFondo, moverFondo } from "../actions";

export default async function FondoPage({ params }: PageProps<"/fondos/[id]">) {
  const { id } = await params;
  const f = await prisma.fondo.findUnique({ where: { id }, include: { aportes: { orderBy: { fecha: "desc" } } } });
  if (!f) notFound();
  const ritmo = ritmoMensual(f.aportes);
  const usar = ritmo > 0 ? ritmo : (f.aporteMensualPlan ?? 0);
  const meses = f.meta ? mesesHasta(f.meta - f.saldoActual, usar) : null;

  return (
    <div className="space-y-3">
      <Volver href="/fondos" texto="Fondos" />
      <Encabezado titulo={f.nombre} subtitulo={f.nota ?? undefined} />

      <Tarjeta>
        <p className="text-xs text-slate-500">Saldo</p>
        <p className="cifra text-3xl font-semibold text-emerald-700">{dinero(f.saldoActual, f.moneda)}</p>
        {f.meta ? (
          <div className="mt-3">
            <Progreso valor={f.saldoActual / f.meta} />
            <p className="mt-1 text-xs text-slate-500">
              {Math.round((f.saldoActual / f.meta) * 100)}% de {dinero(f.meta, f.moneda)} · faltan {dinero(Math.max(0, f.meta - f.saldoActual), f.moneda)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {f.saldoActual >= f.meta
                ? "Meta alcanzada. 🎉"
                : meses
                  ? `A ${dinero(usar, f.moneda)}/mes (${ritmo > 0 ? "ritmo real" : "plan"}) llegan en ${nombreMes(mesFinal(meses))}.`
                  : "Define un aporte mensual para ver cuándo llegan."}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Sin meta definida.</p>
        )}
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-3 font-semibold">Aportar o retirar</h2>
        <FormEstado accion={moverFondo.bind(null, id)} boton="Registrar">
          <Selector
            etiqueta="Movimiento"
            name="sentido"
            defaultValue="aporte"
            opciones={[
              { valor: "aporte", texto: "Aporte (+)" },
              { valor: "retiro", texto: "Retiro (−)" },
            ]}
          />
          <Dos>
            <Campo etiqueta="Monto" name="monto" inputMode="decimal" defaultValue={f.aporteMensualPlan ?? ""} required />
            <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={hoyInput()} required />
          </Dos>
          <Campo etiqueta="Nota" name="nota" placeholder="Opcional" />
        </FormEstado>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-2 font-semibold">Historial</h2>
        {f.aportes.length === 0 ? (
          <p className="text-sm text-slate-500">Sin movimientos.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {f.aportes.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className={`cifra font-medium ${x.monto < 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {x.monto < 0 ? "−" : "+"}
                    {dinero(Math.abs(x.monto), f.moneda)}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {fecha(x.fecha)}
                    {x.nota ? ` · ${x.nota}` : ""}
                  </span>
                </span>
                <BotonConfirmar accion={eliminarAporte.bind(null, x.id)} mensaje="¿Anular este movimiento?" className="text-xs text-red-600">
                  Anular
                </BotonConfirmar>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-semibold">Editar fondo</summary>
        <div className="mt-3">
          <FormEstado accion={actualizarFondo.bind(null, id)} boton="Guardar cambios">
            <CamposFondo f={f} />
          </FormEstado>
        </div>
        <div className="mt-4 text-center">
          <BotonConfirmar accion={eliminarFondo.bind(null, id)} mensaje={`¿Eliminar "${f.nombre}" y su historial?`}>
            Eliminar fondo
          </BotonConfirmar>
        </div>
      </details>
    </div>
  );
}
