// Recordatorios dentro de la app (SPEC §7 Sprint 6): se calculan en vivo, no se guardan.
import { prisma } from "./db";
import { flujoDelMes, proximosPagos } from "./flujo";
import { ahoraMs, dinero } from "./format";
import { mesActual } from "./mes";

export type Aviso = { nivel: "urgente" | "atencion" | "logro"; titulo: string; detalle: string; href: string };

export async function calcularAvisos(): Promise<Aviso[]> {
  const ahora = ahoraMs();
  const hace14 = new Date(ahora - 14 * 86_400_000);
  const [proximos, flujo, atrasos, fondos, deudas, porVerificar] = await Promise.all([
    proximosPagos(3),
    flujoDelMes(mesActual()),
    prisma.atraso.findMany({ include: { abonos: { orderBy: { fecha: "desc" }, take: 1 } } }),
    prisma.fondo.findMany({ include: { aportes: { orderBy: { fecha: "desc" }, take: 1 } } }),
    prisma.deuda.findMany({ where: { activa: true, tasaFijaHasta: { not: null } } }),
    prisma.ingreso.count({ where: { activo: true, porVerificar: true } }),
  ]);
  const avisos: Aviso[] = [];

  for (const p of proximos) {
    if (p.auto) continue; // los auto-débitos no requieren acción
    avisos.push({
      nivel: p.dias <= 1 ? "urgente" : "atencion",
      titulo: `${p.concepto}: ${p.dias === 0 ? "vence hoy" : p.dias === 1 ? "vence mañana" : `vence en ${p.dias} días`}`,
      detalle: dinero(p.monto, p.moneda),
      href: p.href,
    });
  }

  const hoy = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo", day: "numeric" }).format(new Date(ahora)));
  const futuro = flujo.faltantes.find((f) => f.hasta >= hoy);
  if (futuro) {
    avisos.push({
      nivel: "urgente",
      titulo: `Descalce de flujo ${futuro.desde === futuro.hasta ? `el día ${futuro.desde}` : `del ${futuro.desde} al ${futuro.hasta}`}`,
      detalle: `Faltarían hasta ${dinero(-futuro.peor)}. Revisen el calendario.`,
      href: "/flujo",
    });
  }

  for (const a of atrasos) {
    const ultimo = a.abonos[0];
    if (a.montoOriginal - a.montoAbonado <= 0.005 && ultimo && ultimo.fecha >= hace14) {
      avisos.push({ nivel: "logro", titulo: `¡${a.concepto} quedó en cero!`, detalle: "Un atraso menos. 🎉", href: `/atrasos/${a.id}` });
    }
  }
  for (const f of fondos) {
    const ultimo = f.aportes[0];
    if (f.meta && f.saldoActual >= f.meta && ultimo && ultimo.fecha >= hace14) {
      avisos.push({ nivel: "logro", titulo: `¡Meta de ${f.nombre} alcanzada!`, detalle: dinero(f.saldoActual, f.moneda), href: `/fondos/${f.id}` });
    }
  }
  for (const d of deudas) {
    const dias = Math.ceil((d.tasaFijaHasta!.getTime() - ahora) / 86_400_000);
    if (dias <= 60) {
      avisos.push({
        nivel: "atencion",
        titulo: `Tasa fija de ${d.nombre}`,
        detalle: dias >= 0 ? `Vence en ${dias} días: negociar o confirmar el reajuste.` : "Ya venció: actualizar la tasa.",
        href: `/deudas/${d.id}`,
      });
    }
  }
  if (porVerificar) {
    avisos.push({ nivel: "atencion", titulo: `${porVerificar} ingreso(s) por verificar`, detalle: "Confirmar recurrencia o día de cobro.", href: "/ingresos" });
  }

  const orden = { urgente: 0, atencion: 1, logro: 2 };
  return avisos.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
}
