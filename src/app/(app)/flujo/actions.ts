"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/auth";
import { numero } from "@/lib/form";
import type { EstadoForm } from "@/components/form-estado";

export async function guardarSaldoInicial(mes: string, _p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  if (!/^\d{4}-\d{2}$/.test(mes)) return { error: "Mes inválido." };
  const saldoInicial = numero(fd, "saldoInicial") ?? 0;
  if (Number.isNaN(saldoInicial)) return { error: "Monto inválido." };
  await prisma.saldoMes.upsert({ where: { mes }, update: { saldoInicial }, create: { mes, saldoInicial } });
  revalidatePath("/", "layout");
  return { ok: "Saldo inicial guardado." };
}
