// Seed — situación real a octubre 2026 (SPEC.md §6).
// Idempotente: crea usuarios si no existen y carga los datos financieros solo si la BD está vacía.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();

function generarClave() {
  return randomBytes(9).toString("base64url");
}

async function seedUsuarios() {
  // Contraseñas iniciales: de las variables CLAVE_INICIAL_JULIO / CLAVE_INICIAL_ESPOSA, o aleatorias
  const usuarios = [
    { nombre: "Julio", email: "julio@finanzas.local", clave: process.env.CLAVE_INICIAL_JULIO },
    { nombre: "Esposa", email: "esposa@finanzas.local", clave: process.env.CLAVE_INICIAL_ESPOSA },
  ];
  const creadas: string[] = [];
  for (const { clave: definida, ...u } of usuarios) {
    const existe = await prisma.user.findUnique({ where: { email: u.email } });
    if (existe) continue;
    const clave = definida || generarClave();
    await prisma.user.create({
      data: { ...u, passwordHash: await bcrypt.hash(clave, 12) },
    });
    if (!definida) creadas.push(`${u.nombre}: ${u.email} / ${clave}`);
  }
  if (creadas.length) {
    const archivo = process.env.SEED_CREDENCIALES ?? "credenciales-iniciales.txt";
    writeFileSync(
      archivo,
      "Credenciales iniciales (cámbialas en Más → Mi cuenta y borra este archivo)\n" +
        creadas.join("\n") +
        "\n",
    );
    console.log(`Usuarios creados. Credenciales guardadas en ${archivo}`);
  }
}

async function seedDatos() {
  if ((await prisma.deuda.count()) > 0) {
    console.log("Datos financieros ya cargados; se omite.");
    return;
  }

  await prisma.config.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, tasaUSDtoDOP: 62, diaInicioMes: 1 },
  });

  const banreservas = await prisma.cuenta.create({
    data: {
      nombre: "Banreservas (nómina CORPHOTELS)",
      banco: "Banreservas",
      tipo: "corriente",
      bolsillo: "auto_debitado",
      nota: "Recibe CORPHOTELS y se va completo en el auto-débito del préstamo consolidado",
    },
  });
  const manejable = await prisma.cuenta.create({
    data: {
      nombre: "Cuenta principal",
      banco: "Por definir",
      tipo: "corriente",
      bolsillo: "manejable",
      nota: "Recibe CBS, asesorías y CODIA",
    },
  });

  // Ingresos recurrentes
  await prisma.ingreso.createMany({
    data: [
      { nombre: "CBS (quincena 1)", fuente: "CBS", monto: 52300, diaDelMes: 15, cuentaId: manejable.id },
      { nombre: "CBS (quincena 2)", fuente: "CBS", monto: 39644, diaDelMes: 30, cuentaId: manejable.id },
      {
        nombre: "CORPHOTELS (neto)",
        fuente: "CORPHOTELS",
        monto: 62374,
        diaDelMes: 25,
        bolsillo: "auto_debitado",
        cuentaId: banreservas.id,
        nota: "Entra entre el 20 y el 25 por Banreservas; se va en el préstamo consolidado",
      },
      { nombre: "CODIA", fuente: "CODIA", monto: 50000, porVerificar: true, cuentaId: manejable.id, nota: "Configurar día; verificar recurrencia" },
      { nombre: "Asesoría A", fuente: "Asesoría A", monto: 12000, cuentaId: manejable.id, nota: "Mensual; configurar día" },
      { nombre: "Asesoría B", fuente: "Asesoría B", monto: 65000, porVerificar: true, cuentaId: manejable.id, nota: "Mensual; verificar recurrencia y día" },
      { nombre: "Ingreso extra (chofer)", fuente: "Chofer", monto: 25000, diaDelMes: 30, cuentaId: manejable.id, nota: "Se netea con el gasto del chofer" },
    ],
  });

  // Gastos recurrentes
  const comidaSemanal = [1, 8, 15, 22].map((dia, i) => ({
    categoria: "Comida",
    descripcion: `Comida — semana ${i + 1}`,
    monto: 13750,
    tipo: "variable",
    diaDelMes: dia,
  }));
  await prisma.gasto.createMany({
    data: [
      ...comidaSemanal,
      { categoria: "Vivienda", descripcion: "Alquiler", monto: 35000, diaDelMes: 15 },
      { categoria: "Educación", descripcion: "Colegio niña", monto: 9500, diaDelMes: 30 },
      { categoria: "Educación", descripcion: "Colegio niños", monto: 20000, diaDelMes: 30 },
      { categoria: "Hogar", descripcion: "Servicio doméstico (1ra quincena)", monto: 11000, diaDelMes: 15 },
      { categoria: "Hogar", descripcion: "Servicio doméstico (2da quincena)", monto: 11000, diaDelMes: 30 },
      { categoria: "Transporte", descripcion: "Chofer", monto: 25000, diaDelMes: 30, nota: "Neteado con ingreso extra" },
      { categoria: "Servicios", descripcion: "Luz", monto: 5407, diaDelMes: 15 },
      { categoria: "Servicios", descripcion: "Teléfonos (3 líneas)", monto: 3949, diaDelMes: 15 },
      { categoria: "Servicios", descripcion: "Internet", monto: 4731, diaDelMes: 15 },
      { categoria: "Digital", descripcion: "Claude", monto: 1240 },
      { categoria: "Digital", descripcion: "Google One", monto: 620 },
      { categoria: "Digital", descripcion: "YouTube Premium", monto: 990 },
      { categoria: "Digital", descripcion: "Disney+", monto: 990 },
      { categoria: "Digital", descripcion: "Netflix", monto: 930 },
    ],
  });

  // Deudas (todas al día)
  await prisma.deuda.create({
    data: {
      nombre: "Préstamo consolidado Banreservas",
      acreedor: "Banreservas",
      tipo: "prestamo",
      saldoActual: 1646884,
      cuotaMensual: 46875,
      tasaAnual: 21.95,
      plazoMeses: 60,
      diaPago: 26,
      autoDebito: true,
      cuentaOrigenId: banreservas.id,
      permitePrepago: true,
      condicionesPrepago: "Hasta 30% anual sin penalidad",
      nota: "Tasa fija 12 meses: revisar reajuste al mes 12. Verificar cuotas pagadas y fecha de reajuste.",
    },
  });
  await prisma.deuda.create({
    data: {
      nombre: "Préstamo Santa Cruz #348518",
      acreedor: "Banco Santa Cruz",
      tipo: "prestamo",
      saldoActual: 507052,
      cuotaMensual: 15508.67,
      tasaAnual: 20,
      plazoMeses: 48,
      cuotasPagadas: 2,
      diaPago: 23,
      cuentaOrigenId: manejable.id,
      nota: "Activo desde jul 2026; vence jun 2030. Verificar condiciones de prepago y cuotas pagadas.",
    },
  });
  await prisma.deuda.create({
    data: {
      nombre: "Hipoteca apartamento (Hato Nuevo)",
      acreedor: "Por definir",
      tipo: "hipoteca",
      saldoActual: 1300000,
      cuotaMensual: 13500,
      diaPago: 20,
      cuentaOrigenId: manejable.id,
      nota: "Saldo aproximado. Propiedad separada; no vendible hasta 2028 por normativa.",
    },
  });
  await prisma.deuda.create({
    data: {
      nombre: "TC esposa → préstamo",
      acreedor: "Por definir",
      tipo: "tarjeta",
      saldoActual: 75000,
      cuotaMensual: 3000,
      cuentaOrigenId: manejable.id,
      nota: "En proceso de conversión a préstamo. Cuota estimada; actualizar al cerrar.",
    },
  });

  // Atrasos (separados del flujo)
  await prisma.atraso.createMany({
    data: [
      { concepto: "Alquiler (casa)", montoOriginal: 55000, prioridad: 1 },
      { concepto: "Colegio", montoOriginal: 60000, prioridad: 2 },
    ],
  });

  // Fondos / metas
  await prisma.fondo.createMany({
    data: [
      { nombre: "Emergencia", tipo: "emergencia", meta: 160000, nota: "1 mes de gastos" },
      { nombre: "Procedimiento quirúrgico", tipo: "medico", nota: "Meta por confirmar" },
    ],
  });

  await prisma.activo.create({
    data: {
      nombre: "Apartamento Hato Nuevo",
      tipo: "inmueble",
      rentaPotencial: 15750,
      costoReparacion: 70000,
      vendibleDesde: new Date("2028-01-01T12:00:00Z"),
      nota: "Renta potencial 13,500–18,000/mes. Hoy genera 0 y cuesta 13,500/mes de hipoteca.",
    },
  });

  console.log("Datos financieros de octubre 2026 cargados.");
}

async function main() {
  await seedUsuarios();
  await seedDatos();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
