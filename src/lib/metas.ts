// Proyecciones de atrasos y fondos (SPEC §7 Sprint 4).
import type { AbonoAtraso, AporteFondo, Atraso } from "@prisma/client";
import { mesFinal } from "./amortizacion";

/** Ritmo real: promedio mensual de los movimientos de los últimos `meses` meses (incluido el actual). */
export function ritmoMensual(movs: (AbonoAtraso | AporteFondo)[], meses = 3, hoy = new Date()) {
  const desde = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - (meses - 1), 1));
  const recientes = movs.filter((m) => m.fecha >= desde);
  if (!recientes.length) return 0;
  // Si empezaron hace menos de `meses`, se divide entre los meses transcurridos desde el primero
  const primero = recientes.reduce((a, m) => (m.fecha < a ? m.fecha : a), recientes[0].fecha);
  const transcurridos = (hoy.getUTCFullYear() - primero.getUTCFullYear()) * 12 + hoy.getUTCMonth() - primero.getUTCMonth() + 1;
  return Math.max(0, recientes.reduce((a, m) => a + m.monto, 0) / Math.min(meses, Math.max(1, transcurridos)));
}

export function saldoAtraso(a: Pick<Atraso, "montoOriginal" | "montoAbonado">) {
  return Math.max(0, a.montoOriginal - a.montoAbonado);
}

/** Meses para llegar a cero a un ritmo dado (null si el ritmo es 0). */
export function mesesHasta(falta: number, ritmo: number) {
  if (falta <= 0) return 0;
  if (ritmo <= 0) return null;
  return Math.ceil(falta / ritmo);
}

export type PasoAtraso = { id: string; concepto: string; saldo: number; meses: number | null; fin: Date | null };

/**
 * Bola de nieve por prioridad: todo el abono mensual va al atraso más prioritario;
 * cuando se liquida, el abono completo pasa al siguiente.
 */
export function planBolaDeNieve(atrasos: (Atraso & { saldo: number })[], abonoMensual: number, hoy = new Date()): PasoAtraso[] {
  const orden = [...atrasos].filter((a) => a.saldo > 0).sort((a, b) => a.prioridad - b.prioridad);
  if (abonoMensual <= 0) return orden.map((a) => ({ id: a.id, concepto: a.concepto, saldo: a.saldo, meses: null, fin: null }));
  let acumulado = 0;
  return orden.map((a) => {
    acumulado += a.saldo;
    const meses = Math.ceil(acumulado / abonoMensual);
    return { id: a.id, concepto: a.concepto, saldo: a.saldo, meses, fin: mesFinal(meses, hoy) };
  });
}
