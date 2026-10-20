import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, DURACION_SESION_S, firmarSesion, verificarSesion, type Sesion } from "./session";

export async function obtenerSesion() {
  const store = await cookies();
  return verificarSesion(store.get(COOKIE_SESION)?.value);
}

/** Para páginas y server actions: corta si no hay sesión válida. */
export async function requerirSesion(): Promise<Sesion> {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  return s;
}

export async function abrirSesion(s: Sesion) {
  const store = await cookies();
  store.set(COOKIE_SESION, await firmarSesion(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_S,
  });
}

export async function cerrarSesion() {
  const store = await cookies();
  store.delete(COOKIE_SESION);
}
