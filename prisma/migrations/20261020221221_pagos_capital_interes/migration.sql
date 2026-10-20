-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deudaId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'regular',
    "capital" REAL NOT NULL DEFAULT 0,
    "interes" REAL NOT NULL DEFAULT 0,
    "nota" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pago_deudaId_fkey" FOREIGN KEY ("deudaId") REFERENCES "Deuda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pago" ("deudaId", "fecha", "id", "monto", "nota", "tipo") SELECT "deudaId", "fecha", "id", "monto", "nota", "tipo" FROM "Pago";
DROP TABLE "Pago";
ALTER TABLE "new_Pago" RENAME TO "Pago";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
