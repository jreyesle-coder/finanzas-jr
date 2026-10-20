import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ahoraMs, dinero, fecha } from "@/lib/format";
import { hoyInput } from "@/lib/form";
import { mesFinal, nombreMes, proyectar } from "@/lib/amortizacion";
import { ETIQUETA_TIPO_DEUDA } from "@/lib/opciones";
import { Etiqueta, Progreso, Tarjeta, Volver } from "@/components/ui";
import { Campo, Dos, FormEstado, Selector } from "@/components/form-estado";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { eliminarPago, registrarPago } from "../actions";

function Dato({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="cifra text-sm font-medium">{v}</dd>
    </div>
  );
}

export default async function DeudaPage({ params }: PageProps<"/deudas/[id]">) {
  const { id } = await params;
  const d = await prisma.deuda.findUnique({
    where: { id },
    include: { pagos: { orderBy: [{ fecha: "desc" }, { createdAt: "desc" }] }, cuentaOrigen: true },
  });
  if (!d) notFound();

  const p = proyectar(d.saldoActual, d.cuotaMensual, d.tasaAnual);
  const progreso = d.plazoMeses ? d.cuotasPagadas / d.plazoMeses : null;
  const diasReajuste = d.tasaFijaHasta ? Math.ceil((d.tasaFijaHasta.getTime() - ahoraMs()) / 86_400_000) : null;
  const interesMes = d.tasaAnual ? (d.saldoActual * d.tasaAnual) / 100 / 12 : 0;
  const extraAnio = new Date().getUTCFullYear();
  const extraordinariosAnio = d.pagos
    .filter((x) => x.tipo === "extraordinario" && x.fecha.getUTCFullYear() === extraAnio)
    .reduce((a, x) => a + x.capital, 0);

  return (
    <div className="space-y-3">
      <Volver href="/deudas" texto="Deudas" />
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{d.nombre}</h1>
          <p className="text-sm text-slate-500">{d.acreedor}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Etiqueta>{ETIQUETA_TIPO_DEUDA[d.tipo] ?? d.tipo}</Etiqueta>
            {d.autoDebito && <Etiqueta tono="azul">Auto-débito</Etiqueta>}
            {!d.activa && <Etiqueta tono="verde">Saldada</Etiqueta>}
          </div>
        </div>
        <Link href={`/deudas/${id}/editar`} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium">
          Editar
        </Link>
      </header>

      <Tarjeta>
        <p className="text-xs text-slate-500">Saldo actual</p>
        <p className="cifra text-3xl font-semibold">{dinero(d.saldoActual, d.moneda)}</p>
        {progreso !== null && (
          <div className="mt-3">
            <Progreso valor={progreso} />
            <p className="mt-1 text-xs text-slate-500">
              {d.cuotasPagadas} de {d.plazoMeses} cuotas pagadas · faltan {Math.max(0, (d.plazoMeses ?? 0) - d.cuotasPagadas)}
            </p>
          </div>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <Dato k="Cuota mensual" v={dinero(d.cuotaMensual, d.moneda)} />
          <Dato k="Tasa anual" v={d.tasaAnual != null ? `${d.tasaAnual}%` : "—"} />
          <Dato k="Día de pago" v={d.diaPago ?? "—"} />
          <Dato k="Interés este mes" v={d.tasaAnual ? dinero(interesMes, d.moneda) : "—"} />
          <Dato k="Termina (al ritmo actual)" v={d.activa ? (p.liquidable ? nombreMes(mesFinal(p.meses)) : "No se liquida") : "Saldada"} />
          <Dato k="Interés por pagar" v={d.activa && p.liquidable && d.tasaAnual ? dinero(p.interesTotal, d.moneda) : "—"} />
          <Dato k="Cuenta" v={d.cuentaOrigen?.nombre ?? "—"} />
          <Dato k="Tasa fija hasta" v={d.tasaFijaHasta ? fecha(d.tasaFijaHasta) : "—"} />
        </dl>
        {diasReajuste !== null && diasReajuste <= 60 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {diasReajuste >= 0 ? `La tasa fija vence en ${diasReajuste} días: revisar reajuste.` : "La tasa fija ya venció: confirmar la nueva tasa."}
          </p>
        )}
        {d.permitePrepago && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Prepago: {d.condicionesPrepago ?? "permitido"}. Abonado a capital este año: {dinero(extraordinariosAnio, d.moneda)}.{" "}
            <Link href={`/simulador?deuda=${d.id}`} className="font-semibold underline">
              Simular abono
            </Link>
          </p>
        )}
        {d.nota && <p className="mt-3 text-xs text-slate-500">{d.nota}</p>}
      </Tarjeta>

      {d.activa && (
        <Tarjeta>
          <h2 className="mb-3 font-semibold">Registrar pago</h2>
          <FormEstado accion={registrarPago.bind(null, id)} boton="Registrar pago">
            <Dos>
              <Campo etiqueta="Monto" name="monto" inputMode="decimal" defaultValue={d.cuotaMensual} required />
              <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={hoyInput()} required />
            </Dos>
            <Selector
              etiqueta="Tipo"
              name="tipo"
              defaultValue="regular"
              opciones={[
                { valor: "regular", texto: "Cuota regular (interés + capital)" },
                { valor: "extraordinario", texto: "Extraordinario (todo a capital)" },
              ]}
            />
            <Campo etiqueta="Nota" name="nota" placeholder="Opcional" />
          </FormEstado>
        </Tarjeta>
      )}

      <Tarjeta>
        <h2 className="mb-2 font-semibold">Pagos registrados</h2>
        {d.pagos.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay pagos registrados en la app.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {d.pagos.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-2 py-2">
                <div>
                  <p className="cifra text-sm font-medium">
                    {dinero(x.monto, d.moneda)}{" "}
                    {x.tipo === "extraordinario" && <Etiqueta tono="verde">Extra</Etiqueta>}
                  </p>
                  <p className="cifra text-xs text-slate-500">
                    {fecha(x.fecha)} · capital {dinero(x.capital, d.moneda)}
                    {x.interes ? ` · interés ${dinero(x.interes, d.moneda)}` : ""}
                  </p>
                  {x.nota && <p className="text-xs text-slate-500">{x.nota}</p>}
                </div>
                <BotonConfirmar accion={eliminarPago.bind(null, x.id)} mensaje="¿Anular este pago? El saldo vuelve a subir." className="text-xs text-red-600">
                  Anular
                </BotonConfirmar>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
