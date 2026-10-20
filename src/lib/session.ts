// Sesión firmada (JWT HS256) en cookie httpOnly. Sin acceso a BD: se usa también en proxy.ts.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESION = "fjr_sesion";
export const DURACION_SESION_S = 60 * 60 * 24 * 30; // 30 días

export type Sesion = { userId: string; nombre: string };

function clave() {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error("AUTH_SECRET no configurado (mínimo 32 caracteres)");
  }
  return new TextEncoder().encode(secreto);
}

export async function firmarSesion(s: Sesion) {
  return new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_S}s`)
    .sign(clave());
}

export async function verificarSesion(token: string | undefined): Promise<Sesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.nombre !== "string") return null;
    return { userId: payload.userId, nombre: payload.nombre };
  } catch {
    return null;
  }
}
