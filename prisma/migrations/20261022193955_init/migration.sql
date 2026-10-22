-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "banco" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'corriente',
    "bolsillo" TEXT NOT NULL DEFAULT 'manejable',
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "nota" TEXT,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "frecuencia" TEXT NOT NULL DEFAULT 'recurrente',
    "diaDelMes" INTEGER,
    "fecha" TIMESTAMP(3),
    "bolsillo" TEXT NOT NULL DEFAULT 'manejable',
    "cuentaId" TEXT,
    "porVerificar" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "nota" TEXT,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "tipo" TEXT NOT NULL DEFAULT 'fijo',
    "frecuencia" TEXT NOT NULL DEFAULT 'recurrente',
    "diaDelMes" INTEGER,
    "fecha" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "nota" TEXT,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deuda" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "acreedor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'prestamo',
    "saldoActual" DOUBLE PRECISION NOT NULL,
    "cuotaMensual" DOUBLE PRECISION NOT NULL,
    "tasaAnual" DOUBLE PRECISION,
    "tasaFijaHasta" TIMESTAMP(3),
    "plazoMeses" INTEGER,
    "cuotasPagadas" INTEGER NOT NULL DEFAULT 0,
    "diaPago" INTEGER,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "autoDebito" BOOLEAN NOT NULL DEFAULT false,
    "cuentaOrigenId" TEXT,
    "permitePrepago" BOOLEAN NOT NULL DEFAULT false,
    "condicionesPrepago" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "nota" TEXT,

    CONSTRAINT "Deuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "deudaId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'regular',
    "capital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atraso" (
    "id" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "montoOriginal" DOUBLE PRECISION NOT NULL,
    "montoAbonado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "prioridad" INTEGER NOT NULL DEFAULT 1,
    "abonoMensualPlan" DOUBLE PRECISION,
    "nota" TEXT,

    CONSTRAINT "Atraso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbonoAtraso" (
    "id" TEXT NOT NULL,
    "atrasoId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nota" TEXT,

    CONSTRAINT "AbonoAtraso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fondo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'otro',
    "meta" DOUBLE PRECISION,
    "saldoActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "aporteMensualPlan" DOUBLE PRECISION,
    "nota" TEXT,

    CONSTRAINT "Fondo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AporteFondo" (
    "id" TEXT NOT NULL,
    "fondoId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nota" TEXT,

    CONSTRAINT "AporteFondo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "categoria" TEXT NOT NULL,
    "cuentaId" TEXT,
    "nota" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'inmueble',
    "rentaPotencial" DOUBLE PRECISION,
    "costoReparacion" DOUBLE PRECISION,
    "vendibleDesde" TIMESTAMP(3),
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "nota" TEXT,

    CONSTRAINT "Activo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "tasaUSDtoDOP" DOUBLE PRECISION NOT NULL DEFAULT 62,
    "diaInicioMes" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoMes" (
    "mes" TEXT NOT NULL,
    "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SaldoMes_pkey" PRIMARY KEY ("mes")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deuda" ADD CONSTRAINT "Deuda_cuentaOrigenId_fkey" FOREIGN KEY ("cuentaOrigenId") REFERENCES "Cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_deudaId_fkey" FOREIGN KEY ("deudaId") REFERENCES "Deuda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonoAtraso" ADD CONSTRAINT "AbonoAtraso_atrasoId_fkey" FOREIGN KEY ("atrasoId") REFERENCES "Atraso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AporteFondo" ADD CONSTRAINT "AporteFondo_fondoId_fkey" FOREIGN KEY ("fondoId") REFERENCES "Fondo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
