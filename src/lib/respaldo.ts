import "server-only";
import { prisma } from "./db";

// Respaldos: copia JSON completa guardada en Supabase Storage (bucket privado "respaldos").
// Se crea una al día con el cron de Vercel (/api/cron/respaldo) y a mano desde Más → Respaldo.
const URL_SB = process.env.SUPABASE_URL?.replace(/\/$/, "");
const CLAVE_SB = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "respaldos";
const CONSERVAR = Number(process.env.BACKUP_KEEP ?? 30);
const NOMBRE = /^finanzas-\d{4}-\d{2}-\d{2}_\d{6}\.json$/;

export const respaldosConfigurados = !!(URL_SB && CLAVE_SB);

export function nombreValido(n: string) {
  return NOMBRE.test(n);
}

async function storage(ruta: string, init: RequestInit = {}) {
  if (!URL_SB || !CLAVE_SB) throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  return fetch(`${URL_SB}/storage/v1/${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${CLAVE_SB}`, apikey: CLAVE_SB, ...init.headers },
    cache: "no-store",
  });
}

async function asegurarBucket() {
  const r = await storage(`bucket/${BUCKET}`);
  if (r.ok) return;
  const c = await storage("bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
  });
  if (!c.ok && c.status !== 409) throw new Error(`No se pudo crear el bucket: ${c.status} ${await c.text()}`);
}

export async function crearRespaldo() {
  await asegurarBucket();
  const ts = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15); // 20261020_223015
  const nombre = `finanzas-${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}_${ts.slice(9, 15)}.json`;
  const r = await storage(`object/${BUCKET}/${nombre}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-upsert": "true" },
    body: JSON.stringify(await exportarTodo()),
  });
  if (!r.ok) throw new Error(`No se pudo subir el respaldo: ${r.status} ${await r.text()}`);
  await limpiarViejos();
  return nombre;
}

export async function listarRespaldos(): Promise<{ nombre: string; bytes: number; fecha: Date }[]> {
  if (!respaldosConfigurados) return [];
  const r = await storage(`object/list/${BUCKET}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 200, sortBy: { column: "name", order: "desc" } }),
  });
  if (!r.ok) return [];
  const lista = (await r.json()) as { name: string; created_at: string; metadata?: { size?: number } }[];
  return lista
    .filter((o) => nombreValido(o.name))
    .map((o) => ({ nombre: o.name, bytes: o.metadata?.size ?? 0, fecha: new Date(o.created_at) }));
}

export async function descargarRespaldo(nombre: string) {
  if (!nombreValido(nombre)) return null;
  const r = await storage(`object/${BUCKET}/${nombre}`);
  return r.ok ? r.text() : null;
}

async function limpiarViejos() {
  const viejos = (await listarRespaldos()).slice(CONSERVAR).map((r) => r.nombre);
  if (!viejos.length) return;
  await storage(`object/${BUCKET}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: viejos }),
  });
}

/** Todos los datos (sin contraseñas) para exportar a JSON. */
export async function exportarTodo() {
  const [usuarios, cuentas, ingresos, gastos, deudas, pagos, atrasos, abonos, fondos, aportes, movimientos, activos, config, saldosMes] = await Promise.all([
    prisma.user.findMany({ select: { id: true, nombre: true, email: true, createdAt: true } }),
    prisma.cuenta.findMany(),
    prisma.ingreso.findMany(),
    prisma.gasto.findMany(),
    prisma.deuda.findMany(),
    prisma.pago.findMany(),
    prisma.atraso.findMany(),
    prisma.abonoAtraso.findMany(),
    prisma.fondo.findMany(),
    prisma.aporteFondo.findMany(),
    prisma.movimiento.findMany(),
    prisma.activo.findMany(),
    prisma.config.findMany(),
    prisma.saldoMes.findMany(),
  ]);
  return {
    app: "finanzas-jr",
    exportado: new Date().toISOString(),
    datos: { usuarios, cuentas, ingresos, gastos, deudas, pagos, atrasos, abonos, fondos, aportes, movimientos, activos, config, saldosMes },
  };
}

function celda(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function aCSV(filas: Record<string, unknown>[]) {
  if (!filas.length) return "";
  const cols = Object.keys(filas[0]);
  return "﻿" + [cols.join(","), ...filas.map((f) => cols.map((c) => celda(f[c])).join(","))].join("\r\n");
}

export const TABLAS_CSV = {
  movimientos: () => prisma.movimiento.findMany({ orderBy: { fecha: "asc" }, select: { fecha: true, tipo: true, monto: true, moneda: true, categoria: true, nota: true } }),
  ingresos: () => prisma.ingreso.findMany({ omit: { id: true, cuentaId: true } }),
  gastos: () => prisma.gasto.findMany({ omit: { id: true } }),
  deudas: () => prisma.deuda.findMany({ omit: { id: true, cuentaOrigenId: true } }),
  pagos: () => prisma.pago.findMany({ orderBy: { fecha: "asc" }, include: { deuda: { select: { nombre: true } } } }).then((ps) => ps.map((p) => ({ deuda: p.deuda.nombre, fecha: p.fecha, tipo: p.tipo, monto: p.monto, capital: p.capital, interes: p.interes, nota: p.nota }))),
  atrasos: () => prisma.atraso.findMany({ omit: { id: true } }),
  fondos: () => prisma.fondo.findMany({ omit: { id: true } }),
} as const;

export type TablaCSV = keyof typeof TABLAS_CSV;
