// Proyección de salida de deuda de toda la cartera (SPEC §7 Sprint 5).
// Avalancha con efecto bola de nieve: el extra mensual va a la deuda de mayor tasa;
// cuando una se liquida, su cuota se suma al extra y pasa a la siguiente.
import { tasaMensual } from "./amortizacion";

export type DeudaSim = { id: string; nombre: string; saldo: number; cuota: number; tasaAnual: number | null };

export type ResultadoCartera = {
  porDeuda: Record<string, { meses: number | null; interes: number }>;
  serie: number[]; // saldo total al final de cada mes (índice 0 = hoy)
  meses: number | null; // meses hasta quedar sin deudas
  interesTotal: number;
};

/** `bolaDeNieve` = reasignar las cuotas de deudas ya liquidadas (false → cada deuda a su ritmo). */
export function simularCartera(deudas: DeudaSim[], extraMensual = 0, { bolaDeNieve = true, maxMeses = 480 } = {}): ResultadoCartera {
  const est = deudas.map((d) => ({ ...d, s: d.saldo, interes: 0, fin: null as number | null }));
  const serie = [est.reduce((a, d) => a + d.s, 0)];
  // Orden avalancha: mayor tasa primero; empate → menor saldo
  const orden = [...est].sort((a, b) => (b.tasaAnual ?? 0) - (a.tasaAnual ?? 0) || a.s - b.s);
  let mes = 0;
  while (est.some((d) => d.s > 0.005) && mes < maxMeses) {
    mes++;
    let libre = extraMensual;
    // 1) interés y cuota normal de cada deuda
    for (const d of est) {
      if (d.s <= 0.005) {
        if (bolaDeNieve) libre += d.cuota; // cuota liberada
        continue;
      }
      const i = d.s * tasaMensual(d.tasaAnual);
      d.interes += i;
      const pago = Math.min(d.s + i, d.cuota);
      d.s = d.s + i - pago;
      if (bolaDeNieve) libre += d.cuota - pago; // sobrante si la cuota excedió el saldo
    }
    // 2) el dinero libre va a capital en orden avalancha
    for (const d of orden) {
      if (libre <= 0) break;
      if (d.s <= 0.005) continue;
      const abono = Math.min(d.s, libre);
      d.s -= abono;
      libre -= abono;
    }
    for (const d of est) if (d.s <= 0.005 && d.fin === null) d.fin = mes;
    serie.push(Math.max(0, est.reduce((a, d) => a + Math.max(0, d.s), 0)));
  }
  const porDeuda: ResultadoCartera["porDeuda"] = {};
  for (const d of est) porDeuda[d.id] = { meses: d.fin, interes: d.interes };
  const todas = est.every((d) => d.fin !== null);
  return { porDeuda, serie, meses: todas ? Math.max(0, ...est.map((d) => d.fin ?? 0)) : null, interesTotal: est.reduce((a, d) => a + d.interes, 0) };
}
