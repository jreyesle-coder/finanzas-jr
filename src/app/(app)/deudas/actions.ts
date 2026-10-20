"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/auth";
import { casilla, entero, fechaInput, numero, texto } from "@/lib/form";
import { dividirPago } from "@/lib/amortizacion";
import { dinero, redondear } from "@/lib/format";
import type { EstadoForm } from "@/components/form-estado";

function leerDeuda(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const saldoActual = numero(fd, "saldoActual");
  const cuotaMensual = numero(fd, "cuotaMensual");
  const tasaAnual = numero(fd, "tasaAnual");
  const plazoMeses = entero(fd, "plazoMeses");
  const cuotasPagadas = entero(fd, "cuotasPagadas") ?? 0;
  const diaPago = entero(fd, "diaPago");

  if (!nombre) return { error: "Escribe el nombre de la deuda." };
  if (saldoActual === null || Number.isNaN(saldoActual) || saldoActual < 0) return { error: "Saldo inválido." };
  if (cuotaMensual === null || Number.isNaN(cuotaMensual) || cuotaMensual < 0) return { error: "Cuota inválida." };
  if (Number.isNaN(tasaAnual) || (tasaAnual !== null && (tasaAnual < 0 || tasaAnual > 200))) return { error: "Tasa inválida (en % anual)." };
  if (Number.isNaN(plazoMeses) || (plazoMeses !== null && plazoMeses <= 0)) return { error: "Plazo inválido." };
  if (Number.isNaN(cuotasPagadas) || cuotasPagadas < 0) return { error: "Cuotas pagadas inválidas." };
  if (Number.isNaN(diaPago) || (diaPago !== null && (diaPago < 1 || diaPago > 31))) return { error: "Día de pago entre 1 y 31." };

  return {
    data: {
      nombre,
      acreedor: texto(fd, "acreedor") ?? "—",
      tipo: texto(fd, "tipo") ?? "prestamo",
      saldoActual,
      cuotaMensual,
      tasaAnual,
      tasaFijaHasta: fechaInput(fd, "tasaFijaHasta"),
      plazoMeses,
      cuotasPagadas,
      diaPago,
      moneda: texto(fd, "moneda") ?? "DOP",
      autoDebito: casilla(fd, "autoDebito"),
      cuentaOrigenId: texto(fd, "cuentaOrigenId"),
      permitePrepago: casilla(fd, "permitePrepago"),
      condicionesPrepago: texto(fd, "condicionesPrepago"),
      activa: !casilla(fd, "saldada"),
      nota: texto(fd, "nota"),
    },
  };
}

function refrescar() {
  revalidatePath("/", "layout");
}

export async function crearDeuda(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerDeuda(fd);
  if ("error" in r) return { error: r.error };
  const d = await prisma.deuda.create({ data: r.data });
  refrescar();
  redirect(`/deudas/${d.id}`);
}

export async function actualizarDeuda(id: string, _p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const r = leerDeuda(fd);
  if ("error" in r) return { error: r.error };
  await prisma.deuda.update({ where: { id }, data: r.data });
  refrescar();
  redirect(`/deudas/${id}`);
}

export async function eliminarDeuda(id: string) {
  await requerirSesion();
  await prisma.deuda.delete({ where: { id } });
  refrescar();
  redirect("/deudas");
}

export async function registrarPago(deudaId: string, _p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await requerirSesion();
  const monto = numero(fd, "monto");
  const fecha = fechaInput(fd, "fecha");
  const tipo = texto(fd, "tipo") === "extraordinario" ? "extraordinario" : "regular";
  if (monto === null || Number.isNaN(monto) || monto <= 0) return { error: "Monto inválido." };
  if (!fecha) return { error: "Fecha inválida." };

  const deuda = await prisma.deuda.findUnique({ where: { id: deudaId } });
  if (!deuda) return { error: "La deuda no existe." };

  // Regular: primero el interés del mes y el resto a capital. Extraordinario: todo a capital.
  const { interes, capital } =
    tipo === "regular" ? dividirPago(deuda.saldoActual, monto, deuda.tasaAnual) : { interes: 0, capital: Math.min(monto, deuda.saldoActual) };
  const nuevoSaldo = redondear(deuda.saldoActual - capital);

  await prisma.$transaction([
    prisma.pago.create({ data: { deudaId, monto, fecha, tipo, capital, interes, nota: texto(fd, "nota") } }),
    prisma.deuda.update({
      where: { id: deudaId },
      data: {
        saldoActual: nuevoSaldo,
        cuotasPagadas: tipo === "regular" ? { increment: 1 } : undefined,
        activa: nuevoSaldo > 0.005,
      },
    }),
  ]);
  refrescar();
  const detalle = interes ? ` y ${dinero(interes, deuda.moneda)} de interés` : "";
  return { ok: `Pago registrado: ${dinero(capital, deuda.moneda)} a capital${detalle}. Nuevo saldo ${dinero(nuevoSaldo, deuda.moneda)}.` };
}

export async function eliminarPago(pagoId: string) {
  await requerirSesion();
  const pago = await prisma.pago.findUnique({ where: { id: pagoId } });
  if (!pago) return;
  await prisma.$transaction([
    prisma.pago.delete({ where: { id: pagoId } }),
    prisma.deuda.update({
      where: { id: pago.deudaId },
      data: {
        saldoActual: { increment: pago.capital },
        cuotasPagadas: pago.tipo === "regular" ? { decrement: 1 } : undefined,
        activa: true,
      },
    }),
  ]);
  refrescar();
}
