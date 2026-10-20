"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { abrirSesion, requerirSesion } from "@/lib/auth";
import type { EstadoForm } from "@/components/form-estado";

const esquemaConfig = z.object({
  tasaUSDtoDOP: z.coerce.number().positive("La tasa debe ser mayor que 0").max(1000),
  diaInicioMes: z.coerce.number().int().min(1).max(28, "Usa un día entre 1 y 28"),
});

export async function guardarConfig(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = esquemaConfig.safeParse(Object.fromEntries(fd));
  if (!r.success) return { error: r.error.issues[0].message };
  await prisma.config.upsert({ where: { id: 1 }, update: r.data, create: { id: 1, ...r.data } });
  revalidatePath("/", "layout");
  return { ok: "Configuración guardada." };
}

export async function guardarNombre(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const s = await requerirSesion();
  const nombre = String(fd.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { error: "Escribe tu nombre." };
  await prisma.user.update({ where: { id: s.userId }, data: { nombre } });
  await abrirSesion({ userId: s.userId, nombre });
  revalidatePath("/", "layout");
  return { ok: "Nombre actualizado." };
}

export async function cambiarClave(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const s = await requerirSesion();
  const actual = String(fd.get("actual") ?? "");
  const nueva = String(fd.get("nueva") ?? "");
  const confirmar = String(fd.get("confirmar") ?? "");
  if (nueva.length < 10) return { error: "La nueva contraseña debe tener al menos 10 caracteres." };
  if (nueva !== confirmar) return { error: "Las contraseñas nuevas no coinciden." };
  const user = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!user || !(await bcrypt.compare(actual, user.passwordHash))) return { error: "La contraseña actual no es correcta." };
  await prisma.user.update({ where: { id: s.userId }, data: { passwordHash: await bcrypt.hash(nueva, 12) } });
  return { ok: "Contraseña cambiada." };
}
