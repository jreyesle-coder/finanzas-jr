"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/auth";
import { casilla, entero, fechaInput, numero, texto } from "@/lib/form";
import { dinero } from "@/lib/format";
import type { EstadoForm } from "@/components/form-estado";

function refrescar() {
  revalidatePath("/", "layout");
}

function validarComun(fd: FormData) {
  const monto = numero(fd, "monto");
  const frecuencia = texto(fd, "frecuencia") === "puntual" ? "puntual" : "recurrente";
  const diaDelMes = entero(fd, "diaDelMes");
  const fecha = fechaInput(fd, "fecha");
  if (monto === null || Number.isNaN(monto) || monto < 0) return { error: "Monto inválido." };
  if (Number.isNaN(diaDelMes) || (diaDelMes !== null && (diaDelMes < 1 || diaDelMes > 31))) return { error: "Día del mes entre 1 y 31." };
  if (frecuencia === "puntual" && !fecha) return { error: "Un movimiento puntual necesita fecha." };
  return {
    comun: {
      monto,
      moneda: texto(fd, "moneda") ?? "DOP",
      frecuencia,
      diaDelMes: frecuencia === "recurrente" ? diaDelMes : null,
      fecha: frecuencia === "puntual" ? fecha : null,
      activo: !casilla(fd, "inactivo"),
      nota: texto(fd, "nota"),
    },
  };
}

// ---------- Ingresos ----------
function leerIngreso(fd: FormData) {
  const nombre = texto(fd, "nombre");
  if (!nombre) return { error: "Escribe el nombre del ingreso." };
  const c = validarComun(fd);
  if ("error" in c) return { error: c.error };
  return {
    data: {
      ...c.comun,
      nombre,
      fuente: texto(fd, "fuente") ?? nombre,
      bolsillo: texto(fd, "bolsillo") === "auto_debitado" ? "auto_debitado" : "manejable",
      cuentaId: texto(fd, "cuentaId"),
      porVerificar: casilla(fd, "porVerificar"),
    },
  };
}

export async function crearIngreso(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerIngreso(fd);
  if ("error" in r) return { error: r.error };
  await prisma.ingreso.create({ data: r.data });
  refrescar();
  redirect("/ingresos");
}

export async function actualizarIngreso(id: string, _p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerIngreso(fd);
  if ("error" in r) return { error: r.error };
  await prisma.ingreso.update({ where: { id }, data: r.data });
  refrescar();
  redirect("/ingresos");
}

export async function eliminarIngreso(id: string) {
  await requerirSesion();
  await prisma.ingreso.delete({ where: { id } });
  refrescar();
  redirect("/ingresos");
}

// ---------- Gastos ----------
function leerGasto(fd: FormData) {
  const descripcion = texto(fd, "descripcion");
  if (!descripcion) return { error: "Escribe la descripción del gasto." };
  const c = validarComun(fd);
  if ("error" in c) return { error: c.error };
  return {
    data: {
      ...c.comun,
      descripcion,
      categoria: texto(fd, "categoria") ?? "Otros",
      tipo: texto(fd, "tipo") === "variable" ? "variable" : "fijo",
    },
  };
}

export async function crearGasto(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerGasto(fd);
  if ("error" in r) return { error: r.error };
  await prisma.gasto.create({ data: r.data });
  refrescar();
  redirect("/gastos");
}

export async function actualizarGasto(id: string, _p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerGasto(fd);
  if ("error" in r) return { error: r.error };
  await prisma.gasto.update({ where: { id }, data: r.data });
  refrescar();
  redirect("/gastos");
}

export async function eliminarGasto(id: string) {
  await requerirSesion();
  await prisma.gasto.delete({ where: { id } });
  refrescar();
  redirect("/gastos");
}

// ---------- Movimientos (registro del día a día) ----------
export async function registrarMovimiento(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const s = await requerirSesion();
  const monto = numero(fd, "monto");
  const tipo = texto(fd, "tipo") === "ingreso" ? "ingreso" : "gasto";
  const categoria = texto(fd, "categoria");
  const fecha = fechaInput(fd, "fecha");
  const moneda = texto(fd, "moneda") ?? "DOP";
  if (monto === null || Number.isNaN(monto) || monto <= 0) return { error: "Escribe el monto." };
  if (!categoria) return { error: "Elige una categoría." };
  if (!fecha) return { error: "Fecha inválida." };
  await prisma.movimiento.create({
    data: { monto, tipo, categoria, fecha, moneda, cuentaId: texto(fd, "cuentaId"), nota: texto(fd, "nota"), userId: s.userId },
  });
  refrescar();
  return { ok: `${tipo === "gasto" ? "Gasto" : "Ingreso"} de ${dinero(monto, moneda)} en ${categoria} registrado.` };
}

export async function eliminarMovimiento(id: string) {
  await requerirSesion();
  await prisma.movimiento.delete({ where: { id } });
  refrescar();
}
