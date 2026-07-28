FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/mobile-app/package.json apps/mobile-app/
COPY apps/admin-app/package.json apps/admin-app/
COPY apps/courier-app/package.json apps/courier-app/
RUN npm ci
COPY apps/web apps/web
RUN npm run build -w @bocado/web

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/mobile-app/package.json apps/mobile-app/
COPY apps/admin-app/package.json apps/admin-app/
COPY apps/courier-app/package.json apps/courier-app/
RUN npm ci --omit=dev -w @bocado/web --include-workspace-root
COPY --from=build /app/apps/web/dist apps/web/dist
COPY scripts/migrate-db.mjs scripts/migrate-db.mjs
COPY docker/postgres/migrations docker/postgres/migrations
RUN mkdir -p /app/apps/web/dist/client/uploads && chown -R node:node /app
USER node
WORKDIR /app/apps/web
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1
CMD ["node", "./dist/server/entry.mjs"]
