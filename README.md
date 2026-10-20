# Finanzas JR

Tablero privado de salida de deuda y estabilización financiera para Julio y su esposa. Spec completo y plan por sprints en [SPEC.md](SPEC.md).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6 + SQLite · sesión JWT en cookie httpOnly · Docker.

## Estado

| Sprint | Contenido | Estado |
|---|---|---|
| 0 | Fundación: esquema, login 2 usuarios, layout móvil, configuración, Docker | ✅ |
| 1 | Deudas y préstamos | Próximo |
| 2–6 | Ingresos/egresos, flujo de caja, atrasos/fondos, tablero/simuladores, importación/respaldo | Pendiente |

El seed ya carga **toda** la situación de octubre 2026 (ingresos, gastos, deudas, atrasos, fondos, activo), así que cada sprint solo construye pantallas sobre datos reales.

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

**Respaldo:** copiar `./data/finanzas.db` (respaldo automático y exportación JSON/CSV llegan en el Sprint 6).

## Alternativa PaaS (Railway / Render)

- Desplegar desde GitHub usando el `Dockerfile`.
- Agregar un **volumen persistente** montado en `/app/data` (sin volumen, SQLite se borra en cada deploy).
- Variable de entorno: `AUTH_SECRET`. HTTPS lo pone la plataforma.

## Migrar a PostgreSQL más adelante

En `prisma/schema.prisma` cambiar `provider = "sqlite"` por `"postgresql"`, apuntar `DATABASE_URL` al servidor y regenerar migraciones. El esquema no usa nada exclusivo de SQLite.
