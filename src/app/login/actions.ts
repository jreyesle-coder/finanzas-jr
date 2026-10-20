"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { abrirSesion, cerrarSesion } from "@/lib/auth";
import { bloqueado, exito, fallo } from "@/lib/limite";

// Hash ficticio para que un usuario inexistente tarde lo mismo que una clave incorrecta.
const HASH_FICTICIO = "$2b$12$RObuSNxtXUwcH.lskuow9eVXjq5MxttXMr/4ou05OjKe4JWSimOzC";

export type EstadoLogin = { error?: string };

export async function iniciarSesion(_prev: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  let usuario = String(formData.get("usuario") ?? "").trim().toLowerCase();
  const clave = String(formData.get("clave") ?? "");
  if (!usuario || !clave) return { error: "Escribe usuario y contraseña." };
  if (!usuario.includes("@")) usuario = `${usuario}@finanzas.local`;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "local";
  const llave = `${usuario}|${ip}`;
  const min = bloqueado(llave);
  if (min) return { error: `Demasiados intentos. Espera ${min} min.` };

  const user = await prisma.user.findUnique({ where: { email: usuario } });
  const ok = await bcrypt.compare(clave, user?.passwordHash ?? HASH_FICTICIO);
  if (!user || !ok) {
    fallo(llave);
    return { error: "Usuario o contraseña incorrectos." };
  }
  exito(llave);

  await abrirSesion({ userId: user.id, nombre: user.nombre });
  redirect("/");
}

export async function salir() {
  await cerrarSesion();
  redirect("/login");
}
