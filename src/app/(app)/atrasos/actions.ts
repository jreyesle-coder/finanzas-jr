"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/auth";
import { entero, fechaInput, numero, texto } from "@/lib/form";
import { dinero, redondear } from "@/lib/format";
import type { EstadoForm } from "@/components/form-estado";

function refrescar() {
  revalidatePath("/", "layout");
}

function leerAtraso(fd: FormData) {
  const concepto = texto(fd, "concepto");
  const montoOriginal = numero(fd, "montoOriginal");
  const prioridad = entero(fd, "prioridad") ?? 1;
  const abonoMensualPlan = numero(fd, "abonoMensualPlan");
  if (!concepto) return { error: "Escribe el concepto." };
  if (montoOriginal === null || Number.isNaN(montoOriginal) || montoOriginal <= 0) return { error: "Monto original inválido." };
  if (Number.isNaN(prioridad) || prioridad < 1) return { error: "Prioridad: 1 es la más urgente." };
  if (Number.isNaN(abonoMensualPlan) || (abonoMensualPlan !== null && abonoMensualPlan < 0)) return { error: "Abono mensual inválido." };
  return { data: { concepto, montoOriginal, prioridad, abonoMensualPlan, moneda: texto(fd, "moneda") ?? "DOP", nota: texto(fd, "nota") } };
}

export async function crearAtraso(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerAtraso(fd);
  if ("error" in r) return { error: r.error };
  await prisma.atraso.create({ data: r.data });
  refrescar();
  redirect("/atrasos");
}

export async function actualizarAtraso(id: string, _p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerAtraso(fd);
  if ("error" in r) return { error: r.error };
  await prisma.atraso.update({ where: { id }, data: r.data });
  refrescar();
  return { ok: "Atraso actualizado." };
}

export async function eliminarAtraso(id: string) {
  await requerirSesion();
  await prisma.atraso.delete({ where: { id } });
  refrescar();
  redirect("/atrasos");
}

export async function abonarAtraso(atrasoId: string, _p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const monto = numero(fd, "monto");
  const fecha = fechaInput(fd, "fecha");
  if (monto === null || Number.isNaN(monto) || monto <= 0) return { error: "Monto inválido." };
  if (!fecha) return { error: "Fecha inválida." };
  const a = await prisma.atraso.findUnique({ where: { id: atrasoId } });
  if (!a) return { error: "El atraso no existe." };
  const saldo = a.montoOriginal - a.montoAbonado;
  if (monto > saldo + 0.005) return { error: `El abono supera el saldo (${dinero(saldo, a.moneda)}).` };
  await prisma.$transaction([
    prisma.abonoAtraso.create({ data: { atrasoId, monto, fecha, nota: texto(fd, "nota") } }),
    prisma.atraso.update({ where: { id: atrasoId }, data: { montoAbonado: { increment: monto } } }),
  ]);
  refrescar();
  const nuevo = redondear(saldo - monto);
  return { ok: nuevo <= 0.005 ? `¡${a.concepto} quedó en cero! 🎉` : `Abono registrado. Queda ${dinero(nuevo, a.moneda)}.` };
}

export async function eliminarAbono(abonoId: string) {
  await requerirSesion();
  const ab = await prisma.abonoAtraso.findUnique({ where: { id: abonoId } });
  if (!ab) return;
  await prisma.$transaction([
    prisma.abonoAtraso.delete({ where: { id: abonoId } }),
    prisma.atraso.update({ where: { id: ab.atrasoId }, data: { montoAbonado: { decrement: ab.monto } } }),
  ]);
  refrescar();
}
