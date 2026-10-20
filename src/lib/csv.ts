// Lectura de estados de cuenta en CSV (Banreservas, Santa Cruz u otro). Funciona en el navegador.

/** Parser CSV con comillas; detecta separador ; , o tabulador. */
export function parsearCSV(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, "");
  const primera = limpio.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const sep = [";", "\t", ","].map((s) => ({ s, n: primera.split(s).length })).sort((a, b) => b.n - a.n)[0].s;
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let comillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (comillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) {
      fila.push(campo.trim());
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(campo.trim());
      if (fila.some((x) => x !== "")) filas.push(fila);
      fila = [];
      campo = "";
    } else campo += c;
  }
  fila.push(campo.trim());
  if (fila.some((x) => x !== "")) filas.push(fila);
  return filas;
}

/** "1,234.56" · "1.234,56" · "(500.00)" · "-RD$ 1,200" → número (null si no es número). */
export function leerMonto(v: string | undefined): number | null {
  if (!v) return null;
  let s = v.trim();
  if (!s) return null;
  const negativo = /^\(.*\)$/.test(s) || /^-/.test(s) || /-$/.test(s) || /\bDB\b/i.test(s);
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return null;
  const ultPunto = s.lastIndexOf(".");
  const ultComa = s.lastIndexOf(",");
  if (ultPunto >= 0 && ultComa >= 0) {
    s = ultComa > ultPunto ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (ultComa >= 0) {
    // Solo comas: decimal si hay exactamente 2 dígitos al final
    s = /,\d{2}$/.test(s) ? s.replace(/,(?=\d{3})/g, "").replace(",", ".") : s.replace(/,/g, "");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

export type FormatoFecha = "dmy" | "ymd" | "mdy";

/** Devuelve "aaaa-mm-dd" o null. */
export function leerFecha(v: string | undefined, formato: FormatoFecha): string | null {
  if (!v) return null;
  const partes = v.trim().split(/[^\d]+/).filter(Boolean).map(Number);
  if (partes.length < 3) return null;
  let [a, m, d] = [0, 0, 0];
  if (formato === "ymd") [a, m, d] = partes;
  else if (formato === "dmy") [d, m, a] = partes;
  else [m, d, a] = partes;
  if (a < 100) a += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCMonth() !== m - 1) return null;
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Adivina el formato mirando las primeras fechas. */
export function detectarFormatoFecha(valores: string[]): FormatoFecha {
  const p = valores.map((v) => v.trim().split(/[^\d]+/).filter(Boolean).map(Number)).filter((x) => x.length >= 3);
  if (p.some((x) => x[0] > 31)) return "ymd";
  if (p.some((x) => x[1] > 12)) return "mdy";
  return "dmy";
}

const REGLAS: [RegExp, string][] = [
  [/SUPERMERC|SIRENA|NACIONAL|BRAVO|JUMBO|PLAZA LAMA|OLE|COLMADO|CARREFOUR|PRICESMART/i, "Comida"],
  [/EDENORTE|EDESUR|EDEESTE|CLARO|ALTICE|VIVA|WIND|CAASD|CORAASAN|INAPA/i, "Servicios"],
  [/NETFLIX|DISNEY|SPOTIFY|YOUTUBE|GOOGLE|APPLE\.COM|ANTHROPIC|CLAUDE|AMAZON PRIME|HBO|MAX\b/i, "Digital"],
  [/COLEGIO|ESCUELA|UNIVERSIDAD|LIBRERIA/i, "Educación"],
  [/SHELL|TEXACO|ESSO|SUNIX|ISLA|GASOLIN|UBER|PEAJE|PASO RAPIDO/i, "Transporte"],
  [/FARMACIA|CLINICA|HOSPITAL|LABORATORIO|SEGURO|ARS\b|MEDIC/i, "Salud"],
  [/RESTAUR|CAFE|PIZZA|BURGER|KFC|MCDONALD|PEDIDOSYA|UBER EATS/i, "Ocio"],
  [/PRESTAMO|CUOTA|TARJETA|PAGO TC/i, "Deudas"],
  [/NOMINA|SALARIO|PAYROLL/i, "Salario"],
];

export function sugerirCategoria(descripcion: string, tipo: "ingreso" | "gasto") {
  for (const [re, cat] of REGLAS) if (re.test(descripcion)) return cat;
  return tipo === "ingreso" ? "Otros" : "Otros";
}
