// Lectura tolerante de FormData (montos con comas, fechas de <input type="date">).
export function texto(fd: FormData, k: string) {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
}

export function numero(fd: FormData, k: string) {
  const v = String(fd.get(k) ?? "").replace(/[,\s]/g, "").replace(/RD\$|US\$|\$/g, "");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function entero(fd: FormData, k: string) {
  const n = numero(fd, k);
  return n === null || Number.isNaN(n) ? n : Math.trunc(n);
}

export function casilla(fd: FormData, k: string) {
  return fd.get(k) === "on" || fd.get(k) === "true";
}

/** "2026-10-20" → Date al mediodía UTC (evita corrimientos de zona horaria). */
export function fechaInput(fd: FormData, k: string) {
  const v = String(fd.get(k) ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return new Date(`${v}T12:00:00Z`);
}

/** Date → "2026-10-20" para defaultValue de <input type="date">. */
export function aInputFecha(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function hoyInput() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo" }).format(new Date());
}
