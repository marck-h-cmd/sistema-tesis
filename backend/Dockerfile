FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY . .
RUN npm ci
RUN npx prisma generate
RUN rm -rf dist
RUN npm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl chromium

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist

COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 10000
EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]