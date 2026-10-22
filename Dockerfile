# Finanzas JR — imagen de producción (Next.js standalone + Prisma/SQLite)
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/data/finanzas.db \
    SEED_CREDENCIALES=/app/data/credenciales-iniciales.txt \
    BACKUP_DIR=/app/data/backups
RUN npm i -g prisma@6.19.3 tsx@4 && groupadd -r app && useradd -r -g app app && mkdir -p /app/data && chown app:app /app/data
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/node_modules/.prisma ./node_modules/.prisma
# El seed corre fuera del bundle de Next: necesita bcryptjs como módulo
COPY --from=builder --chown=app:app /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --chown=app:app docker-entrypoint.sh ./
# Arranca como root solo para ajustar permisos del disco montado (Railway/NAS) y luego baja a "app".
# Sin instrucción VOLUME: Railway la prohíbe; el volumen se monta desde compose o la plataforma.
EXPOSE 3000
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
