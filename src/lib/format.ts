// Formato es-DO: separador de miles, DOP/USD, fechas dd/mm/aaaa.
export type Moneda = "DOP" | "USD";

const formatos: Record<Moneda, Intl.NumberFormat> = {
  DOP: new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 0, maximumFractionDigits: 2 }),
  USD: new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }),
};

export function dinero(monto: number, moneda: string = "DOP") {
  return (formatos[moneda as Moneda] ?? formatos.DOP).format(monto);
}

/** Convierte a DOP con la tasa vigente. */
export function aDOP(monto: number, moneda: string, tasaUSD: number) {
  return moneda === "USD" ? monto * tasaUSD : monto;
}

export function fecha(d: Date | string) {
  return new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Santo_Domingo" }).format(new Date(d));
}

export function redondear(n: number) {
  return Math.round(n * 100) / 100;
}

/** Hora actual (centralizado para cálculos de días restantes en el servidor). */
export function ahoraMs() {
  return Date.now();
}

/** Formato corto para celdas: 52.3k, 1.6M */
export function corto(n: number) {
  const a = Math.abs(n);
  const s = n < 0 ? "−" : "";
  if (a >= 1_000_000) return `${s}${(a / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${s}${(a / 1_000).toFixed(a >= 100_000 ? 0 : 1)}k`;
  return `${s}${Math.round(a)}`;
}
