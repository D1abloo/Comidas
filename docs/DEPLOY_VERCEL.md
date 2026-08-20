# Vercel

Despliegue SSR con `@astrojs/vercel` cuando `DEPLOY_TARGET=vercel`.

- Build: `DEPLOY_TARGET=vercel npm run build -w @bocado/web`
- Proyecto Vercel: conectado al repo GitHub `D1abloo/Comidas`
- Variables: `DATABASE_URL` (Postgres en VPS `82.223.54.195:5432`), `SESSION_SECRET`,
  `ORDER_TOKEN_SECRET`, `PUBLIC_APP_URL`, `DATABASE_SSL=false`

La BBDD de producción vive en la VPS (compose project `bocado`, volumen
`bocado_pg`), separada de cloudops/Spendlyx. El puerto host `5432` publica solo
BocadO; cloudops Postgres queda en red Docker interna.

Limitaciones: SSE/realtime y procesos largos pueden degradarse en serverless.
El destino principal sigue siendo Docker en VPS (`npm run deploy:vps:82`).
