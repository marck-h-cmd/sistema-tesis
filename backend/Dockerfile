FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY nest-cli.json ./

# Instalar TODAS las dependencias (producción + desarrollo)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Eliminar dependencias de desarrollo para reducir tamaño
RUN npm prune --production

EXPOSE 3001

# Copiar y hacer ejecutable el entrypoint
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main"]