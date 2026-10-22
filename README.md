# Finanzas JR

Tablero privado de salida de deuda y estabilización financiera para Julio y su esposa. Spec completo y plan por sprints en [SPEC.md](SPEC.md).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6 + PostgreSQL (Supabase) · sesión JWT en cookie httpOnly · Vercel.

## Estado

Los 7 sprints del spec están entregados (tags `s0`…`s6`).

| Sprint | Contenido |
|---|---|
| 0 | Esquema, login de 2 usuarios, layout móvil, configuración, Docker |
| 1 | Deudas: CRUD, progreso de cuotas, deuda consolidada, pagos regulares (interés + capital) y extraordinarios |
| 2 | Ingresos y gastos (bolsillo manejable vs auto-debitado), registro rápido, movimientos por mes con real vs presupuesto |
| 3 | Flujo de caja: calendario, saldo diario, tramos de iliquidez ("¿en qué días me quedo corto?"), próximos pagos |
| 4 | Atrasos con abonos y proyección (bola de nieve por prioridad); fondos con aportes, retiros y meta |
| 5 | Tablero con semáforo de fase, simulador de abono (límite 30% anual) y proyección de salida de deuda |
| 6 | Importador CSV del banco, exportación JSON/CSV, respaldo diario automático, avisos, seguridad y pulido |

El seed carga la situación real de octubre 2026. Pantallas principales: Inicio (tablero), Flujo, Registrar (+), Deudas y Más (ingresos, gastos, movimientos, atrasos, fondos, simulador, proyección, importar, respaldo, configuración).

### Supuestos del flujo de caja
- Ingresos **sin día de cobro** no entran al calendario (conservador). Asignarles día en Más → Ingresos.
- Gastos y cuotas sin día se cuentan el día 1.
- El bolsillo auto-debitado (CORPHOTELS → Banreservas) se muestra aparte.
- El saldo inicial de cada mes se ajusta en Flujo → "Ajustar saldo con que empieza el mes".

### Respaldo
- Copia JSON completa diaria (6:00 a. m. RD) en Supabase Storage, bucket privado `respaldos` (se crea solo), se conservan 30. La dispara el cron de Vercel (`vercel.json` → `/api/cron/respaldo`, protegido con `CRON_SECRET`).
- Más → Respaldo: crear copia ahora, descargarlas, exportar todo a JSON o cada tabla a CSV.

### Seguridad
Sesión firmada en cookie httpOnly (30 días), contraseñas con bcrypt, bloqueo de 15 min tras 5 intentos fallidos, cabeceras de seguridad, ninguna página ni API responde sin sesión. HTTPS lo da el proxy (ver abajo).

## Correr en la PC (desarrollo)

```bash
docker run -d --name finanzas-pg -e POSTGRES_PASSWORD=local -e POSTGRES_DB=finanzas -p 54329:5432 postgres:16-alpine
cp .env.example .env        # DATABASE_URL y DIRECT_URL = postgresql://postgres:local@localhost:54329/finanzas
npm install
npx prisma migrate dev      # crea las tablas
npx prisma db seed          # carga octubre 2026 y crea los usuarios
npm run dev
```

## En línea: Supabase + Vercel

1. **Supabase:** proyecto nuevo → Project Settings → Database → Connection string: copiar el pooler *Transaction* (6543) a `DATABASE_URL` (agregar `?pgbouncer=true&connection_limit=1`) y el *Session* (5432) a `DIRECT_URL`. Project Settings → API: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
2. **Cargar datos:** con esas variables en `.env`, correr `npx prisma migrate deploy` y `npx prisma db seed` (usa `CLAVE_INICIAL_JULIO` / `CLAVE_INICIAL_ESPOSA` si están definidas).
3. **Vercel:** importar el repo, agregar `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`. El build aplica migraciones solo (`prisma migrate deploy && next build`).
4. Cada `git push` despliega. HTTPS lo pone Vercel.
