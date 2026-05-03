# ==================== STAGE 1: Builder ====================
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copiar TODO primero (para que nest build tenga todo lo que necesita)
COPY . .

# Instalar TODAS las dependencias
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Compilar
RUN npm run build

# Verificar que el dist existe (debug)
RUN ls -la dist/ && echo "✅ dist generado" || echo "❌ dist NO encontrado"
RUN ls -la dist/main.js && echo "✅ main.js existe" || echo "❌ main.js NO existe"

# ==================== STAGE 2: Runner ====================
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl chromium

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

# Copiar Prisma Client generado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copiar dist compilado
COPY --from=builder /app/dist ./dist

# Debug en runner también
RUN ls -la dist/ && ls -la dist/main.js

COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 10000
EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main"]