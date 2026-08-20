# syntax=docker/dockerfile:1
# ---- Base ----
FROM node:22-slim AS base
WORKDIR /app
# OpenSSL: requerido por los engines de Prisma.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ---- Dependencias ----
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Genera el Prisma Client dentro de la imagen.
RUN npx prisma generate

EXPOSE 3000
# Aplica migraciones pendientes y arranca (tsx ejecuta TS directamente).
CMD ["sh", "-c", "npx prisma migrate deploy && node --import tsx src/server.ts"]
