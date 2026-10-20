import { obtenerSesion } from "@/lib/auth";
import { aCSV, TABLAS_CSV, type TablaCSV } from "@/lib/respaldo";

export async function GET(_req: Request, ctx: RouteContext<"/api/exportar/csv/[tabla]">) {
  if (!(await obtenerSesion())) return new Response("No autorizado", { status: 401 });
  const { tabla } = await ctx.params;
  if (!(tabla in TABLAS_CSV)) return new Response("Tabla desconocida", { status: 404 });
  const filas = (await TABLAS_CSV[tabla as TablaCSV]()) as Record<string, unknown>[];
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(aCSV(filas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tabla}-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
