import { obtenerSesion } from "@/lib/auth";
import { exportarTodo } from "@/lib/respaldo";

export async function GET() {
  if (!(await obtenerSesion())) return new Response("No autorizado", { status: 401 });
  const datos = await exportarTodo();
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(datos, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="finanzas-jr-${fecha}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
