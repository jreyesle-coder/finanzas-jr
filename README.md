# Finanzas JR

Tablero privado de salida de deuda y estabilización financiera para Julio y su esposa. Spec completo y plan por sprints en [SPEC.md](SPEC.md).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6 + SQLite · sesión JWT en cookie httpOnly · Docker.

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
- Copia automática diaria del SQLite en `backups/` (Docker: `/app/data/backups`), se guardan 14. Variables: `BACKUP_DIR`, `BACKUP_KEEP`, `BACKUP_AUTO=off`.
- Más → Respaldo: crear copia, descargarlas, exportar todo a JSON o cada tabla a CSV.
- Restaurar: detener la app y reemplazar `finanzas.db` por la copia.

### Seguridad
Sesión firmada en cookie httpOnly (30 días), contraseñas con bcrypt, bloqueo de 15 min tras 5 intentos fallidos, cabeceras de seguridad, ninguna página ni API responde sin sesión. HTTPS lo da el proxy (ver abajo).

## Correr en la PC (desarrollo)

```bash
npm install
cp .env.example .env        # y pon un AUTH_SECRET propio
npx prisma migrate dev      # crea prisma/dev.db y corre el seed
npm run dev
```

Abre http://localhost:3000. Las contraseñas iniciales quedan en `credenciales-iniciales.txt` (no se sube a git). Usuario: `julio` o `esposa`. Cambiarlas en **Más → Mi cuenta** y borrar ese archivo.

## Producción en un VPS o NAS (Docker)

1. Instalar Docker en el servidor y copiar el proyecto (git clone).
2. Crear `.env.production` a partir de `.env.production.example` con un `AUTH_SECRET` nuevo:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
3. `docker compose up -d --build`
4. La primera vez se crean la base (`./data/finanzas.db`) y las credenciales (`./data/credenciales-iniciales.txt`).
5. **HTTPS:** el contenedor solo escucha en `127.0.0.1:3000`. Publicarlo con un proxy con certificado automático, p. ej. Caddy:
   ```
   finanzas.tudominio.com {
     reverse_proxy 127.0.0.1:3000
   }
   ```
   (En un NAS sin dominio: Tailscale o Cloudflare Tunnel.)

**Respaldo:** automático cada día en `./data/backups`; además copiar esa carpeta fuera del servidor de vez en cuando.

## Alternativa PaaS (Railway / Render)

- Desplegar desde GitHub usando el `Dockerfile`.
- Agregar un **volumen persistente** montado en `/app/data` (sin volumen, SQLite se borra en cada deploy).
- Variable de entorno: `AUTH_SECRET`. HTTPS lo pone la plataforma.

## Migrar a PostgreSQL más adelante

En `prisma/schema.prisma` cambiar `provider = "sqlite"` por `"postgresql"`, apuntar `DATABASE_URL` al servidor y regenerar migraciones. El esquema no usa nada exclusivo de SQLite.
