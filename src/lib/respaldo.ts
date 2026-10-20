import "server-only";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";

// Respaldos del archivo SQLite con VACUUM INTO (copia consistente aunque la app esté en uso).
export const DIR_RESPALDOS = path.resolve(process.env.BACKUP_DIR ?? "backups");
const CONSERVAR = Number(process.env.BACKUP_KEEP ?? 14);
const NOMBRE = /^finanzas-\d{4}-\d{2}-\d{2}_\d{6}\.db$/;

export function nombreValido(n: string) {
  return NOMBRE.test(n);
}

export async function crearRespaldo() {
  await mkdir(DIR_RESPALDOS, { recursive: true });
  const ts = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15); // 20261020_223015
  const nombre = `finanzas-${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}_${ts.slice(9, 15)}.db`;
  const destino = path.join(DIR_RESPALDOS, nombre);
  await prisma.$executeRawUnsafe(`VACUUM INTO '${destino.replace(/'/g, "''")}'`);
  await limpiarViejos();
  return nombre;
}

export async function listarRespaldos() {
  try {
    const archivos = (await readdir(DIR_RESPALDOS)).filter(nombreValido).sort().reverse();
    return Promise.all(
      archivos.map(async (nombre) => {
        const s = await stat(path.join(DIR_RESPALDOS, nombre));
        return { nombre, bytes: s.size, fecha: s.mtime };
      }),
    );
  } catch {
    return [];
  }
}

async function limpiarViejos() {
  const lista = await listarRespaldos();
  for (const r of lista.slice(CONSERVAR)) await unlink(path.join(DIR_RESPALDOS, r.nombre)).catch(() => {});
}

/** Respaldo automático: si el último tiene más de 24 h (o no hay ninguno). */
export async function respaldoSiToca() {
  const [ultimo] = await listarRespaldos();
  if (ultimo && Date.now() - ultimo.fecha.getTime() < 23.5 * 3_600_000) return null;
  return crearRespaldo();
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
