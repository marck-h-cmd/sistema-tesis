FROM node:20-alpine

# Instalar dependencias necesarias
RUN apk add --no-cache openssl chromium

# Configurar Puppeteer para usar Chromium del sistema
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY nest-cli.json ./

# Instalar TODAS las dependencias
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Eliminar dependencias de desarrollo
RUN npm prune --production

# ⚠️ IMPORTANTE: Exponer el puerto 10000 (por defecto en Render)
# También exponer 3001 para desarrollo local
EXPOSE 10000
EXPOSE 3001

# Copiar y hacer ejecutable el entrypoint
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main"]