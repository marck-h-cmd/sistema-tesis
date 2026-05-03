#!/bin/sh
set -e

echo "🔄 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

echo "✅ Migraciones completadas"

# Verificar si ya hay datos en la base de datos
USER_COUNT=$(npx prisma query --execute "SELECT count(*) FROM usuario" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ] || [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Ejecutando seed de datos..."
  npx ts-node prisma/seed.ts
else
  echo "✅ La base de datos ya contiene datos, omitiendo seed"
fi

echo "🚀 Iniciando aplicación..."
exec "$@"