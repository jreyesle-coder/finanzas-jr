import { crearRespaldo } from "@/lib/respaldo";

// Vercel Cron (vercel.json) llama esta ruta una vez al día con "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return new Response("No autorizado", { status: 401 });
  }
  try {
    const nombre = await crearRespaldo();
    return Response.json({ ok: true, nombre });
  } catch (e) {
    console.error("[respaldo] falló:", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
