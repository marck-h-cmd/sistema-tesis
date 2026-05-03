#!/bin/sh
set -e

echo "🔄 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

if [ "$NODE_ENV" = "production" ]; then
  echo "🌱 Ejecutando seed de producción..."
  npx ts-node prisma/seed.ts
elif [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Ejecutando seed de desarrollo..."
  npx ts-node prisma/seed.ts
fi

echo "🚀 Iniciando aplicación..."
exec "$@"