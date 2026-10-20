-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "banco" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'corriente',
    "bolsillo" TEXT NOT NULL DEFAULT 'manejable',
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "nota" TEXT
);

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "frecuencia" TEXT NOT NULL DEFAULT 'recurrente',
    "diaDelMes" INTEGER,
    "fecha" DATETIME,
    "bolsillo" TEXT NOT NULL DEFAULT 'manejable',
    "cuentaId" TEXT,
    "porVerificar" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "nota" TEXT,
    CONSTRAINT "Ingreso_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "tipo" TEXT NOT NULL DEFAULT 'fijo',
    "frecuencia" TEXT NOT NULL DEFAULT 'recurrente',
    "diaDelMes" INTEGER,
    "fecha" DATETIME,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "nota" TEXT
);

-- CreateTable
CREATE TABLE "Deuda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "acreedor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'prestamo',
    "saldoActual" REAL NOT NULL,
    "cuotaMensual" REAL NOT NULL,
    "tasaAnual" REAL,
    "tasaFijaHasta" DATETIME,
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
    CONSTRAINT "Deuda_cuentaOrigenId_fkey" FOREIGN KEY ("cuentaOrigenId") REFERENCES "Cuenta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deudaId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'regular',
    "nota" TEXT,
    CONSTRAINT "Pago_deudaId_fkey" FOREIGN KEY ("deudaId") REFERENCES "Deuda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Atraso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concepto" TEXT NOT NULL,
    "montoOriginal" REAL NOT NULL,
    "montoAbonado" REAL NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "prioridad" INTEGER NOT NULL DEFAULT 1,
    "nota" TEXT
);

-- CreateTable
CREATE TABLE "AbonoAtraso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "atrasoId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "nota" TEXT,
    CONSTRAINT "AbonoAtraso_atrasoId_fkey" FOREIGN KEY ("atrasoId") REFERENCES "Atraso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fondo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'otro',
    "meta" REAL,
    "saldoActual" REAL NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "nota" TEXT
);

-- CreateTable
CREATE TABLE "AporteFondo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fondoId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "nota" TEXT,
    CONSTRAINT "AporteFondo_fondoId_fkey" FOREIGN KEY ("fondoId") REFERENCES "Fondo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "categoria" TEXT NOT NULL,
    "cuentaId" TEXT,
    "nota" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Movimiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Movimiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'inmueble',
    "rentaPotencial" REAL,
    "costoReparacion" REAL,
    "vendibleDesde" DATETIME,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "nota" TEXT
);

-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "tasaUSDtoDOP" REAL NOT NULL DEFAULT 62,
    "diaInicioMes" INTEGER NOT NULL DEFAULT 1
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
