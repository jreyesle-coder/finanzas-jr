import { prisma } from "./db";
import { obtenerConfig } from "./config";
import { aDOP } from "./format";

export type Fase = "rescate" | "estabilizacion" | "crecimiento";

/** Resumen mensual consolidado en DOP a partir de los recurrentes activos. */
export async function resumenMensual() {
  const [config, ingresos, gastos, deudas, atrasos, fondos] = await Promise.all([
    obtenerConfig(),
    prisma.ingreso.findMany({ where: { activo: true, frecuencia: "recurrente" } }),
    prisma.gasto.findMany({ where: { activo: true, frecuencia: "recurrente" } }),
    prisma.deuda.findMany({ where: { activa: true } }),
    prisma.atraso.findMany(),
    prisma.fondo.findMany(),
  ]);
  const t = config.tasaUSDtoDOP;
  const suma = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

  const ingresosTotal = suma(ingresos, (i) => aDOP(i.monto, i.moneda, t));
  const ingresosManejables = suma(ingresos.filter((i) => i.bolsillo === "manejable"), (i) => aDOP(i.monto, i.moneda, t));
  const ingresosAuto = ingresosTotal - ingresosManejables;

  const gastosTotal = suma(gastos, (g) => aDOP(g.monto, g.moneda, t));
  const cuotasTotal = suma(deudas, (d) => aDOP(d.cuotaMensual, d.moneda, t));
  const cuotasAuto = suma(deudas.filter((d) => d.autoDebito), (d) => aDOP(d.cuotaMensual, d.moneda, t));

  const egresosTotal = gastosTotal + cuotasTotal;
  const superavit = ingresosTotal - egresosTotal;
  // Disponible real: lo que entra al bolsillo manejable menos lo que sale de él
  const disponibleManejable = ingresosManejables - gastosTotal - (cuotasTotal - cuotasAuto);

  const deudaTotal = suma(deudas, (d) => aDOP(d.saldoActual, d.moneda, t));
  const atrasosSaldo = suma(atrasos, (a) => aDOP(a.montoOriginal - a.montoAbonado, a.moneda, t));
  const emergencia = fondos.find((f) => f.tipo === "emergencia");
  const fondoCompleto = !!emergencia?.meta && emergencia.saldoActual >= emergencia.meta;

  const fase: Fase = superavit < 0 ? "rescate" : atrasosSaldo > 0 || !fondoCompleto ? "estabilizacion" : "crecimiento";

  return {
    tasa: t,
    ingresosTotal,
    ingresosManejables,
    ingresosAuto,
    gastosTotal,
    cuotasTotal,
    cuotasAuto,
    egresosTotal,
    superavit,
    disponibleManejable,
    sobranteAuto: ingresosAuto - cuotasAuto,
    deudaTotal,
    atrasosSaldo,
    fase,
    porVerificar: ingresos.filter((i) => i.porVerificar).length,
  };
}
