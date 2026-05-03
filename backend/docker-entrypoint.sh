#!/bin/sh
set -e

echo "🔄 Sincronizando esquema con la base de datos..."
npx prisma db push --accept-data-loss --skip-generate

echo "✅ Esquema sincronizado"
echo "🚀 Iniciando aplicación..."
exec "$@"