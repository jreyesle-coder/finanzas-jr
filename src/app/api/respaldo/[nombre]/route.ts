import { obtenerSesion } from "@/lib/auth";
import { descargarRespaldo } from "@/lib/respaldo";

export async function GET(_req: Request, ctx: RouteContext<"/api/respaldo/[nombre]">) {
  if (!(await obtenerSesion())) return new Response("No autorizado", { status: 401 });
  const { nombre } = await ctx.params;
  const contenido = await descargarRespaldo(nombre);
  if (contenido === null) return new Response("No encontrado", { status: 404 });
  return new Response(contenido, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
