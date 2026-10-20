"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/auth";
import { fechaInput, numero, texto } from "@/lib/form";
import { dinero, redondear } from "@/lib/format";
import type { EstadoForm } from "@/components/form-estado";

function refrescar() {
  revalidatePath("/", "layout");
}

function leerFondo(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const meta = numero(fd, "meta");
  const aporteMensualPlan = numero(fd, "aporteMensualPlan");
  if (!nombre) return { error: "Escribe el nombre del fondo." };
  if (Number.isNaN(meta) || (meta !== null && meta <= 0)) return { error: "Meta inválida." };
  if (Number.isNaN(aporteMensualPlan) || (aporteMensualPlan !== null && aporteMensualPlan < 0)) return { error: "Aporte mensual inválido." };
  return {
    data: { nombre, meta, aporteMensualPlan, tipo: texto(fd, "tipo") ?? "otro", moneda: texto(fd, "moneda") ?? "DOP", nota: texto(fd, "nota") },
  };
}

export async function crearFondo(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerFondo(fd);
  if ("error" in r) return { error: r.error };
  const saldo = numero(fd, "saldoInicial");
  await prisma.fondo.create({
    data: {
      ...r.data,
      saldoActual: saldo && saldo > 0 ? saldo : 0,
      aportes: saldo && saldo > 0 ? { create: { monto: saldo, fecha: new Date(), nota: "Saldo inicial" } } : undefined,
    },
  });
  refrescar();
  redirect("/fondos");
}

export async function actualizarFondo(id: string, _p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerFondo(fd);
  if ("error" in r) return { error: r.error };
  await prisma.fondo.update({ where: { id }, data: r.data });
  refrescar();
  return { ok: "Fondo actualizado." };
}

export async function eliminarFondo(id: string) {
  await requerirSesion();
  await prisma.fondo.delete({ where: { id } });
  refrescar();
  redirect("/fondos");
}

export async function moverFondo(fondoId: string, _p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const monto = numero(fd, "monto");
  const fecha = fechaInput(fd, "fecha");
  const retiro = texto(fd, "sentido") === "retiro";
  if (monto === null || Number.isNaN(monto) || monto <= 0) return { error: "Monto inválido." };
  if (!fecha) return { error: "Fecha inválida." };
  const f = await prisma.fondo.findUnique({ where: { id: fondoId } });
  if (!f) return { error: "El fondo no existe." };
  if (retiro && monto > f.saldoActual + 0.005) return { error: `El retiro supera el saldo (${dinero(f.saldoActual, f.moneda)}).` };
  const delta = retiro ? -monto : monto;
  await prisma.$transaction([
    prisma.aporteFondo.create({ data: { fondoId, monto: delta, fecha, nota: texto(fd, "nota") } }),
    prisma.fondo.update({ where: { id: fondoId }, data: { saldoActual: { increment: delta } } }),
  ]);
  refrescar();
  const nuevo = redondear(f.saldoActual + delta);
  const metaOk = f.meta && nuevo >= f.meta && f.saldoActual < f.meta;
  return { ok: metaOk ? `¡Meta de ${f.nombre} alcanzada! 🎉` : `${retiro ? "Retiro" : "Aporte"} registrado. Saldo ${dinero(nuevo, f.moneda)}.` };
}

export async function eliminarAporte(aporteId: string) {
  await requerirSesion();
  const ap = await prisma.aporteFondo.findUnique({ where: { id: aporteId } });
  if (!ap) return;
  await prisma.$transaction([
    prisma.aporteFondo.delete({ where: { id: aporteId } }),
    prisma.fondo.update({ where: { id: ap.fondoId }, data: { saldoActual: { decrement: ap.monto } } }),
  ]);
  refrescar();
}
