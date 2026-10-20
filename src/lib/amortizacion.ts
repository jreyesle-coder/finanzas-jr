// Cálculos de préstamos con cuota fija (sistema francés), tasa nominal anual en %.
import { redondear } from "./format";

export function tasaMensual(tasaAnual: number | null | undefined) {
  return tasaAnual ? tasaAnual / 100 / 12 : 0;
}

/** Divide un pago regular en interés del mes y capital. */
export function dividirPago(saldo: number, monto: number, tasaAnual: number | null | undefined) {
  const interes = redondear(Math.min(monto, saldo * tasaMensual(tasaAnual)));
  const capital = redondear(Math.min(saldo, monto - interes));
  return { interes, capital };
}

export type Proyeccion = {
  meses: number; // cuotas hasta liquidar
  interesTotal: number;
  pagadoTotal: number;
  liquidable: boolean; // false si la cuota no cubre ni el interés
  saldos: number[]; // saldo al final de cada mes (para gráficas)
};

/**
 * Proyecta la deuda mes a mes. `extraMensual` se suma a la cuota y `abonoInicial`
 * se aplica a capital hoy (reduce plazo, mantiene cuota).
 */
export function proyectar(
  saldo: number,
  cuota: number,
  tasaAnual: number | null | undefined,
  { extraMensual = 0, abonoInicial = 0, maxMeses = 600 } = {},
): Proyeccion {
  const i = tasaMensual(tasaAnual);
  let s = Math.max(0, saldo - abonoInicial);
  let interesTotal = 0;
  let pagado = abonoInicial > 0 ? Math.min(abonoInicial, saldo) : 0;
  const saldos: number[] = [];
  const pago = cuota + extraMensual;
  if (s > 0 && pago <= s * i) return { meses: Infinity, interesTotal: Infinity, pagadoTotal: Infinity, liquidable: false, saldos: [] };
  let meses = 0;
  while (s > 0.005 && meses < maxMeses) {
    const interes = s * i;
    const abono = Math.min(s + interes, pago);
    s = s + interes - abono;
    interesTotal += interes;
    pagado += abono;
    meses++;
    saldos.push(Math.max(0, s));
  }
  return { meses, interesTotal: redondear(interesTotal), pagadoTotal: redondear(pagado), liquidable: s <= 0.005, saldos };
}

/** Fecha (mes) en que termina, contando desde el mes actual. */
export function mesFinal(meses: number, desde = new Date()) {
  if (!Number.isFinite(meses)) return null;
  return new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() + meses, 1, 12));
}

export function nombreMes(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}
