#!/bin/sh
set -e
DB_FILE="${DATABASE_URL#file:}"
DATA_DIR="$(dirname "$DB_FILE")"

# Si arrancamos como root (volumen montado con dueño root), ajustar permisos y bajar a "app"
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  chown -R app:app "$DATA_DIR"
  exec setpriv --reuid=app --regid=app --init-groups sh "$0" "$@"
fi

PRIMERA_VEZ=0
[ -f "$DB_FILE" ] || PRIMERA_VEZ=1

prisma migrate deploy --schema prisma/schema.prisma

if [ "$PRIMERA_VEZ" = "1" ]; then
  echo "Base de datos nueva: cargando datos iniciales…"
  tsx prisma/seed.ts
fi

exec node server.js
