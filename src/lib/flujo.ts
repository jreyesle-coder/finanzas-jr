// Flujo de caja por fecha del bolsillo manejable (SPEC §7 Sprint 3).
// Proyección a partir del presupuesto: ingresos/gastos recurrentes por día del mes,
// puntuales por fecha y cuotas de deudas por día de pago. Los atrasos NO entran aquí.
import { prisma } from "./db";
import { obtenerConfig } from "./config";
import { aDOP } from "./format";
import { diasDelMes, rangoMes } from "./mes";

export type Evento = {
  tipo: "ingreso" | "gasto" | "cuota";
  concepto: string;
  monto: number; // en DOP, positivo
  montoOriginal: number;
  moneda: string;
  href: string;
};

export type Dia = {
  dia: number;
  eventos: Evento[];
  entra: number;
  sale: number;
  saldo: number; // al cierre del día
};

export type Faltante = { desde: number; hasta: number; peor: number; diaPeor: number };

function diaEnMes(dia: number, total: number) {
  return Math.min(dia, total); // día 30/31 en febrero → último día
}

export async function flujoDelMes(mes: string) {
  const { desde, hasta } = rangoMes(mes);
  const total = diasDelMes(mes);
  const [config, ingresos, gastos, deudas, saldoMes] = await Promise.all([
    obtenerConfig(),
    prisma.ingreso.findMany({ where: { activo: true } }),
    prisma.gasto.findMany({ where: { activo: true } }),
    prisma.deuda.findMany({ where: { activa: true } }),
    prisma.saldoMes.findUnique({ where: { mes } }),
  ]);
  const t = config.tasaUSDtoDOP;
  const dias: Dia[] = Array.from({ length: total }, (_, i) => ({ dia: i + 1, eventos: [], entra: 0, sale: 0, saldo: 0 }));
  const sinDia: { ingresos: Evento[]; gastos: Evento[] } = { ingresos: [], gastos: [] };
  const autoDebitado: { dia: number | null; evento: Evento }[] = [];

  const poner = (dia: number, e: Evento) => dias[diaEnMes(dia, total) - 1].eventos.push(e);
  const enMes = (f: Date | null) => !!f && f >= desde && f < hasta;

  for (const i of ingresos) {
    const e: Evento = { tipo: "ingreso", concepto: i.nombre, monto: aDOP(i.monto, i.moneda, t), montoOriginal: i.monto, moneda: i.moneda, href: `/ingresos/${i.id}` };
    const dia = i.frecuencia === "puntual" ? (enMes(i.fecha) ? i.fecha!.getUTCDate() : null) : i.diaDelMes;
    if (i.frecuencia === "puntual" && !enMes(i.fecha)) continue;
    if (i.bolsillo === "auto_debitado") {
      autoDebitado.push({ dia, evento: e });
      continue;
    }
    if (dia) poner(dia, e);
    else sinDia.ingresos.push(e);
  }

  for (const g of gastos) {
    if (g.frecuencia === "puntual" && !enMes(g.fecha)) continue;
    const e: Evento = { tipo: "gasto", concepto: g.descripcion, monto: aDOP(g.monto, g.moneda, t), montoOriginal: g.monto, moneda: g.moneda, href: `/gastos/${g.id}` };
    const dia = g.frecuencia === "puntual" ? g.fecha!.getUTCDate() : g.diaDelMes;
    if (dia) poner(dia, e);
    else {
      // Gasto sin día fijo: se asume el día 1 (supuesto conservador)
      sinDia.gastos.push(e);
      poner(1, e);
    }
  }

  for (const d of deudas) {
    const e: Evento = { tipo: "cuota", concepto: d.nombre, monto: aDOP(d.cuotaMensual, d.moneda, t), montoOriginal: d.cuotaMensual, moneda: d.moneda, href: `/deudas/${d.id}` };
    if (d.autoDebito) {
      autoDebitado.push({ dia: d.diaPago, evento: e });
      continue;
    }
    // Cuota sin día de pago: día 1 (conservador)
    poner(d.diaPago ?? 1, e);
  }

  const saldoInicial = saldoMes?.saldoInicial ?? 0;
  let saldo = saldoInicial;
  for (const d of dias) {
    d.eventos.sort((a, b) => (a.tipo === "ingreso" ? -1 : 1) - (b.tipo === "ingreso" ? -1 : 1));
    d.entra = d.eventos.filter((e) => e.tipo === "ingreso").reduce((a, e) => a + e.monto, 0);
    d.sale = d.eventos.filter((e) => e.tipo !== "ingreso").reduce((a, e) => a + e.monto, 0);
    saldo += d.entra - d.sale;
    d.saldo = saldo;
  }

  // Tramos de iliquidez (días seguidos con saldo negativo)
  const faltantes: Faltante[] = [];
  for (const d of dias) {
    if (d.saldo >= 0) continue;
    const ult = faltantes.at(-1);
    if (ult && ult.hasta === d.dia - 1) {
      ult.hasta = d.dia;
      if (d.saldo < ult.peor) {
        ult.peor = d.saldo;
        ult.diaPeor = d.dia;
      }
    } else faltantes.push({ desde: d.dia, hasta: d.dia, peor: d.saldo, diaPeor: d.dia });
  }

  // Bolsillo auto-debitado: ¿llega el ingreso antes del débito?
  const autoIngresos = autoDebitado.filter((a) => a.evento.tipo === "ingreso");
  const autoCuotas = autoDebitado.filter((a) => a.evento.tipo === "cuota");
  const autoEntra = autoIngresos.reduce((a, x) => a + x.evento.monto, 0);
  const autoSale = autoCuotas.reduce((a, x) => a + x.evento.monto, 0);
  const ultimoIngresoAuto = Math.max(0, ...autoIngresos.map((a) => a.dia ?? 0));
  const primerDebitoAuto = Math.min(99, ...autoCuotas.map((a) => a.dia ?? 99));
  const alertasAuto: string[] = [];
  if (autoSale > autoEntra) alertasAuto.push("El ingreso auto-debitado no cubre las cuotas auto-debitadas.");
  if (autoCuotas.length && ultimoIngresoAuto > primerDebitoAuto) alertasAuto.push(`El débito del día ${primerDebitoAuto} ocurre antes de que entre el ingreso (día ${ultimoIngresoAuto}).`);

  const peorDia = dias.reduce((a, d) => (d.saldo < a.saldo ? d : a), dias[0]);

  return {
    mes,
    saldoInicial,
    dias,
    faltantes,
    peorDia,
    saldoFinal: saldo,
    entraTotal: dias.reduce((a, d) => a + d.entra, 0),
    saleTotal: dias.reduce((a, d) => a + d.sale, 0),
    sinDia,
    auto: { entra: autoEntra, sale: autoSale, eventos: autoDebitado, alertas: alertasAuto },
  };
}

export type Proximo = { fecha: Date; dias: number; concepto: string; monto: number; moneda: string; tipo: "gasto" | "cuota"; auto: boolean; href: string };

/** Pagos (cuotas y gastos fijos con día) en los próximos `ventana` días, contando desde hoy (hora RD). */
export async function proximosPagos(ventana = 7, hoy = new Date()) {
  const [gastos, deudas] = await Promise.all([
    prisma.gasto.findMany({ where: { activo: true } }),
    prisma.deuda.findMany({ where: { activa: true, diaPago: { not: null } } }),
  ]);
  const base = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo" }).format(hoy) + "T12:00:00Z");
  const lista: Proximo[] = [];

  const siguienteFecha = (dia: number) => {
    for (let k = 0; k <= 1; k++) {
      const a = base.getUTCFullYear();
      const m = base.getUTCMonth() + k;
      const ultimo = new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
      const f = new Date(Date.UTC(a, m, Math.min(dia, ultimo), 12));
      if (f >= base) return f;
    }
    return null;
  };
  const agregar = (f: Date | null, x: Omit<Proximo, "fecha" | "dias">) => {
    if (!f) return;
    const dias = Math.round((f.getTime() - base.getTime()) / 86_400_000);
    if (dias >= 0 && dias <= ventana) lista.push({ ...x, fecha: f, dias });
  };

  for (const d of deudas) {
    agregar(siguienteFecha(d.diaPago!), { concepto: d.nombre, monto: d.cuotaMensual, moneda: d.moneda, tipo: "cuota", auto: d.autoDebito, href: `/deudas/${d.id}` });
  }
  for (const g of gastos) {
    const f = g.frecuencia === "puntual" ? g.fecha : g.diaDelMes ? siguienteFecha(g.diaDelMes) : null;
    if (g.tipo !== "fijo" && g.frecuencia === "recurrente") continue; // variables (comida) no son "pagos"
    agregar(f, { concepto: g.descripcion, monto: g.monto, moneda: g.moneda, tipo: "gasto", auto: false, href: `/gastos/${g.id}` });
  }
  return lista.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}
