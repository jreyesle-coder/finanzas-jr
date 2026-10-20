"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/auth";
import { crearRespaldo } from "@/lib/respaldo";
import type { EstadoForm } from "@/components/form-estado";

export async function respaldarAhora(): Promise<EstadoForm> {
  await requerirSesion();
  try {
    const n = await crearRespaldo();
    revalidatePath("/respaldo");
    return { ok: `Respaldo creado: ${n}` };
  } catch (e) {
    console.error(e);
    return { error: "No se pudo crear el respaldo." };
  }
}
