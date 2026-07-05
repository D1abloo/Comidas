FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/mobile-app/package.json apps/mobile-app/
RUN npm ci
COPY apps/web apps/web
RUN npm run build -w @bocado/web

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev -w @bocado/web
COPY --from=build /app/apps/web/dist apps/web/dist
WORKDIR /app/apps/web
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
