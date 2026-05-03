# ==================== STAGE 1: Builder ====================
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY nest-cli.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar código fuente
COPY src ./src

# ✅ Compilar — genera /app/dist/
RUN npm run build

# ==================== STAGE 2: Runner ====================
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl chromium

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar prisma (necesario para prisma db push en runtime)
COPY prisma ./prisma/

# Copiar Prisma Client generado desde el builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# ✅ Copiar el dist compilado desde el builder
COPY --from=builder /app/dist ./dist

# Copiar entrypoint
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 10000
EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main"]