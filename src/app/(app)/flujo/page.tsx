import Link from "next/link";
import { flujoDelMes, proximosPagos } from "@/lib/flujo";
import { corto, dinero } from "@/lib/format";
import { mesActual, moverMes, rangoMes, tituloMes, validarMes } from "@/lib/mes";
import { Encabezado, Etiqueta, SelectorMes, Tarjeta } from "@/components/ui";
import { Campo, FormEstado } from "@/components/form-estado";
import { guardarSaldoInicial } from "./actions";

const SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

export default async function FlujoPage({ searchParams }: PageProps<"/flujo">) {
  const mes = validarMes((await searchParams).mes);
  const esActual = mes === mesActual();
  const [f, proximos] = await Promise.all([flujoDelMes(mes), esActual ? proximosPagos(7) : Promise.resolve([])]);
  const primerDia = (rangoMes(mes).desde.getUTCDay() + 6) % 7; // lunes = 0
  const sinDiaIngresos = f.sinDia.ingresos.reduce((a, e) => a + e.monto, 0);

  return (
    <div className="space-y-3">
      <Encabezado titulo="Flujo de caja" subtitulo="Bolsillo manejable, día a día" />
      <SelectorMes base="/flujo" mes={mes} anterior={moverMes(mes, -1)} siguiente={moverMes(mes, 1)} titulo={tituloMes(mes)} />

      {/* La pregunta clave del mes */}
      <Tarjeta className={f.faltantes.length ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">¿En qué días me quedo corto?</p>
        {f.faltantes.length === 0 ? (
          <p className="mt-1 text-sm font-medium text-emerald-800">
            Ningún día. El saldo más bajo es {dinero(f.peorDia.saldo)} el día {f.peorDia.dia}.
          </p>
        ) : (
          <>
            <ul className="mt-2 space-y-1">
              {f.faltantes.map((x) => (
                <li key={x.desde} className="text-sm text-red-800">
                  <a href={`#dia-${x.diaPeor}`} className="font-semibold underline">
                    {x.desde === x.hasta ? `Día ${x.desde}` : `Del ${x.desde} al ${x.hasta}`}
                  </a>
                  : faltan hasta <span className="cifra font-semibold">{dinero(-x.peor)}</span> (peor el día {x.diaPeor})
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-red-700">
              Para cubrir todo el mes necesitan arrancar con <span className="cifra font-semibold">{dinero(f.saldoInicial - f.peorDia.saldo)}</span> o mover pagos a después de un cobro.
            </p>
          </>
        )}
      </Tarjeta>

      {sinDiaIngresos > 0 && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {dinero(sinDiaIngresos)} de ingresos sin día de cobro no se cuentan en el calendario (supuesto conservador):{" "}
          {f.sinDia.ingresos.map((e, i) => (
            <span key={e.href}>
              {i > 0 && ", "}
              <Link href={e.href} className="font-semibold underline">
                {e.concepto}
              </Link>
            </span>
          ))}
          . Asígnales día para un flujo exacto.
        </p>
      )}

      <Tarjeta>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-500">Inicio</p>
            <p className="cifra text-sm font-semibold">{dinero(f.saldoInicial)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Neto del mes</p>
            <p className={`cifra text-sm font-semibold ${f.entraTotal - f.saleTotal >= 0 ? "text-emerald-700" : "text-red-600"}`}>{dinero(f.entraTotal - f.saleTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Cierre</p>
            <p className={`cifra text-sm font-semibold ${f.saldoFinal >= 0 ? "" : "text-red-600"}`}>{dinero(f.saldoFinal)}</p>
          </div>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-emerald-700">Ajustar saldo con que empieza el mes</summary>
          <div className="mt-3">
            <FormEstado accion={guardarSaldoInicial.bind(null, mes)} boton="Guardar saldo inicial">
              <Campo etiqueta="Saldo inicial del bolsillo manejable" name="saldoInicial" inputMode="decimal" defaultValue={f.saldoInicial} ayuda="Lo que tenían disponible el día 1 (sin contar fondos de emergencia)." />
            </FormEstado>
          </div>
        </details>
      </Tarjeta>

      {/* Calendario */}
      <Tarjeta className="p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
          {SEMANA.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: primerDia }, (_, i) => (
            <div key={`v${i}`} />
          ))}
          {f.dias.map((d) => {
            const neto = d.entra - d.sale;
            return (
              <a
                key={d.dia}
                href={`#dia-${d.dia}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs ${
                  d.saldo < 0 ? "bg-red-100 text-red-800" : d.eventos.length ? "bg-slate-50" : ""
                }`}
              >
                <span className="font-semibold">{d.dia}</span>
                {neto !== 0 && <span className={`cifra text-[10px] ${neto > 0 ? "text-emerald-700" : "text-slate-500"}`}>{corto(neto)}</span>}
              </a>
            );
          })}
        </div>
        <p className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-red-100" /> saldo negativo
          </span>
          <span>cifra = neto del día</span>
        </p>
      </Tarjeta>

      {esActual && proximos.length > 0 && (
        <Tarjeta>
          <h2 className="mb-2 font-semibold">Próximos 7 días</h2>
          <ul className="divide-y divide-slate-100">
            {proximos.map((p) => (
              <li key={p.href + p.fecha.toISOString()} className="flex items-center justify-between py-2 text-sm">
                <Link href={p.href}>
                  {p.concepto} {p.auto && <Etiqueta tono="azul">Auto</Etiqueta>}
                  <span className="block text-xs text-slate-500">{p.dias === 0 ? "Hoy" : p.dias === 1 ? "Mañana" : `En ${p.dias} días`}</span>
                </Link>
                <span className="cifra font-medium">{dinero(p.monto, p.moneda)}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      {/* Agenda día a día */}
      <Tarjeta>
        <h2 className="mb-2 font-semibold">Día a día</h2>
        <ol className="space-y-2">
          {f.dias
            .filter((d) => d.eventos.length)
            .map((d) => (
              <li key={d.dia} id={`dia-${d.dia}`} className={`scroll-mt-4 rounded-xl border p-3 ${d.saldo < 0 ? "border-red-200 bg-red-50" : "border-slate-100"}`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">Día {d.dia}</span>
                  <span className={`cifra text-xs font-semibold ${d.saldo < 0 ? "text-red-700" : "text-slate-600"}`}>Saldo {dinero(d.saldo)}</span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {d.eventos.map((e, i) => (
                    <li key={i} className="flex justify-between text-xs">
                      <Link href={e.href} className="truncate pr-2 text-slate-600">
                        {e.concepto}
                      </Link>
                      <span className={`cifra ${e.tipo === "ingreso" ? "text-emerald-700" : "text-slate-700"}`}>
                        {e.tipo === "ingreso" ? "+" : "−"}
                        {dinero(e.monto)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ol>
        {f.sinDia.gastos.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">Gastos sin día fijo ({f.sinDia.gastos.map((e) => e.concepto).join(", ")}) se cuentan el día 1.</p>
        )}
      </Tarjeta>

      <Tarjeta>
        <h2 className="font-semibold">Bolsillo auto-debitado</h2>
        <p className="mt-1 text-xs text-slate-500">Va aparte del flujo: entra y sale solo.</p>
        <ul className="mt-2 space-y-1 text-sm">
          {f.auto.eventos
            .sort((a, b) => (a.dia ?? 99) - (b.dia ?? 99))
            .map((a, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {a.dia ? `Día ${a.dia}` : "Sin día"} · {a.evento.concepto}
                </span>
                <span className={`cifra ${a.evento.tipo === "ingreso" ? "text-emerald-700" : ""}`}>
                  {a.evento.tipo === "ingreso" ? "+" : "−"}
                  {dinero(a.evento.monto)}
                </span>
              </li>
            ))}
        </ul>
        {f.auto.alertas.map((a) => (
          <p key={a} className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {a}
          </p>
        ))}
        {f.auto.alertas.length === 0 && f.auto.eventos.length > 0 && (
          <p className="mt-2 text-xs text-emerald-700">Cubre el débito y queda {dinero(f.auto.entra - f.auto.sale)}.</p>
        )}
      </Tarjeta>
    </div>
  );
}
