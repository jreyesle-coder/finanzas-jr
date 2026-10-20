import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/session";

// Barrera de entrada: sin sesión válida no se sirve ninguna página con datos.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sesion = await verificarSesion(request.cookies.get(COOKIE_SESION)?.value);

  if (pathname === "/login") {
    return sesion ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (!sesion) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|manifest.webmanifest|.*\.(?:png|svg|ico|webp)$).*)"],
};
