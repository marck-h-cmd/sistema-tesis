#!/bin/sh
set -e

echo "🔄 Sincronizando esquema con la base de datos..."
npx prisma db push --accept-data-loss

echo "✅ Esquema sincronizado"

echo "🌱 Ejecutando seed de datos..."
node dist/prisma/seed.js || echo "⚠️ Seed omitido (puede que ya existan datos)"

echo "🚀 Iniciando aplicación..."
exec "$@"