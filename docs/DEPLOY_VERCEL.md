# Despliegue BocadO

## Producción
- **App:** Vercel → https://bocado-olive.vercel.app
- **BBDD:** solo en VPS `82.223.54.195` (Docker project `bocado`, puerto host `5432`, volumen `bocado_pg`)

Variables Vercel: `DATABASE_URL` → `postgres://bocado:…@82.223.54.195:5432/bocado`,
`SESSION_SECRET`, `ORDER_TOKEN_SECRET`, `PUBLIC_APP_URL=https://bocado-olive.vercel.app`,
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `DEPLOY_TARGET=vercel`, `DATABASE_SSL=false`.

## VPS (solo DB)
```bash
npm run deploy:vps:82
```
No arranca `web` en la VPS. No hay vhost nginx de BocadO.

## Google OAuth
Redirect URI: `https://bocado-olive.vercel.app/api/auth/google/callback`
