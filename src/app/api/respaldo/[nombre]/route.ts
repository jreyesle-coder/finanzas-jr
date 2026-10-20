import { readFile } from "node:fs/promises";
import path from "node:path";
import { obtenerSesion } from "@/lib/auth";
import { DIR_RESPALDOS, nombreValido } from "@/lib/respaldo";

export async function GET(_req: Request, ctx: RouteContext<"/api/respaldo/[nombre]">) {
  if (!(await obtenerSesion())) return new Response("No autorizado", { status: 401 });
  const { nombre } = await ctx.params;
  if (!nombreValido(nombre)) return new Response("No encontrado", { status: 404 });
  try {
    const archivo = await readFile(path.join(DIR_RESPALDOS, nombre));
    return new Response(archivo, {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="${nombre}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
