import { prisma } from "@/lib/db";
import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { Simulador, type DeudaSimulable } from "./simulador";

/** "Hasta 30% anual sin penalidad" → 30 */
function limitePct(condiciones: string | null) {
  const m = condiciones?.match(/(\d+(?:[.,]\d+)?)\s*%/);
  return m ? Number(m[1].replace(",", ".")) : null;
}

export default async function SimuladorPage({ searchParams }: PageProps<"/simulador">) {
  const { deuda } = await searchParams;
  const anio = new Date().getUTCFullYear();
  const deudas = await prisma.deuda.findMany({
    where: { activa: true },
    include: { pagos: { where: { tipo: "extraordinario", fecha: { gte: new Date(Date.UTC(anio, 0, 1)) } } } },
    orderBy: [{ permitePrepago: "desc" }, { saldoActual: "desc" }],
  });
  const datos: DeudaSimulable[] = deudas.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    saldo: d.saldoActual,
    cuota: d.cuotaMensual,
    tasaAnual: d.tasaAnual,
    moneda: d.moneda,
    permitePrepago: d.permitePrepago,
    condicionesPrepago: d.condicionesPrepago,
    limiteAnualPct: d.permitePrepago ? limitePct(d.condicionesPrepago) : null,
    abonadoEsteAnio: d.pagos.reduce((a, p) => a + p.capital, 0),
  }));

  return (
    <>
      <Volver href="/mas" texto="Más" />
      <Encabezado titulo="Simulador de abono" subtitulo="¿Cuánto ahorras si abonas a capital?" />
      <Tarjeta>
        <Simulador deudas={datos} inicial={typeof deuda === "string" ? deuda : undefined} />
      </Tarjeta>
    </>
  );
}
