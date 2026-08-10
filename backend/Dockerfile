# syntax=docker/dockerfile:1
# ==========================================================================
# FIIM backend — production image (NestJS + Prisma + Puppeteer/Chromium)
# ==========================================================================

# ---- build stage ---------------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Puppeteer's bundled Chromium is skipped; we use the system chromium below.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime stage -------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# System Chromium + the libraries headless Chrome needs for PDF rendering.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
      libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
      libcairo2 libasound2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma

# Reports are written here; Render mounts an ephemeral disk by default.
RUN mkdir -p /app/storage/reports

EXPOSE 3000
# Apply pending migrations, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
