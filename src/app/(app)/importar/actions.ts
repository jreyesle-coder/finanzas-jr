"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/auth";

const Fila = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipo: z.enum(["ingreso", "gasto"]),
  monto: z.number().positive().max(1e10),
  categoria: z.string().min(1).max(60),
  nota: z.string().max(300),
});
const Lote = z.object({
  filas: z.array(Fila).min(1).max(2000),
  moneda: z.enum(["DOP", "USD"]),
  cuentaId: z.string().nullable(),
});

export type ResultadoImportar = { ok?: string; error?: string };

export async function importarMovimientos(datos: z.input<typeof Lote>): Promise<ResultadoImportar> {
  const s = await requerirSesion();
  const r = Lote.safeParse(datos);
  if (!r.success) return { error: "Datos inválidos: revisa el mapeo de columnas." };
  const { filas, moneda, cuentaId } = r.data;

  // Evita duplicar si suben el mismo archivo dos veces (misma fecha, tipo, monto y descripción)
  const fechas = filas.map((f) => new Date(`${f.fecha}T12:00:00Z`));
  const existentes = await prisma.movimiento.findMany({
    where: { fecha: { gte: new Date(Math.min(...fechas.map(Number))), lte: new Date(Math.max(...fechas.map(Number))) } },
    select: { fecha: true, tipo: true, monto: true, nota: true },
  });
  const clave = (f: Date, tipo: string, monto: number, nota: string | null) => `${f.toISOString().slice(0, 10)}|${tipo}|${monto.toFixed(2)}|${nota ?? ""}`;
  const vistos = new Set(existentes.map((e) => clave(e.fecha, e.tipo, e.monto, e.nota)));

  const nuevos = [];
  for (const f of filas) {
    const fecha = new Date(`${f.fecha}T12:00:00Z`);
    const nota = f.nota || null;
    const k = clave(fecha, f.tipo, f.monto, nota);
    if (vistos.has(k)) continue;
    vistos.add(k);
    nuevos.push({ fecha, tipo: f.tipo, monto: f.monto, categoria: f.categoria, nota, moneda, cuentaId, userId: s.userId });
  }
  if (nuevos.length) await prisma.movimiento.createMany({ data: nuevos });
  revalidatePath("/", "layout");
  const omitidos = filas.length - nuevos.length;
  return { ok: `${nuevos.length} movimiento(s) importado(s)${omitidos ? `; ${omitidos} omitido(s) por estar repetidos` : ""}.` };
}
