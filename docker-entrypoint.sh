#!/bin/sh
set -e
DB_FILE="${DATABASE_URL#file:}"
PRIMERA_VEZ=0
[ -f "$DB_FILE" ] || PRIMERA_VEZ=1

prisma migrate deploy --schema prisma/schema.prisma

if [ "$PRIMERA_VEZ" = "1" ]; then
  echo "Base de datos nueva: cargando datos iniciales…"
  tsx prisma/seed.ts
fi

exec node server.js
