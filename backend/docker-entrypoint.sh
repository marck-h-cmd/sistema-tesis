#!/bin/sh
set -e

echo "🔄 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

if [ "$NODE_ENV" = "production" ]; then
  echo "🌱 Ejecutando seed de producción..."
  npm run prisma:seed
elif [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Ejecutando seed de desarrollo..."
  npm run prisma:seed
fi

echo "🚀 Iniciando aplicación..."
exec "$@"