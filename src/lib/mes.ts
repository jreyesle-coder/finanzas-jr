// Utilidades de mes ("2026-10"). Las fechas se guardan al mediodía UTC, así que basta con UTC.
import { hoyInput } from "./form";

export function mesActual() {
  return hoyInput().slice(0, 7);
}

export function validarMes(m: string | string[] | undefined) {
  return typeof m === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : mesActual();
}

export function rangoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return { desde: new Date(Date.UTC(a, m - 1, 1)), hasta: new Date(Date.UTC(a, m, 1)) };
}

export function diasDelMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

export function moverMes(mes: string, delta: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function tituloMes(mes: string) {
  const { desde } = rangoMes(mes);
  const t = new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric", timeZone: "UTC" }).format(desde);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
