# Deploy en Vercel

## Objetivo

Publicar la app en Vercel para pruebas antes de conectar el dominio final.

## Error 404 NOT_FOUND

Si ves `404: NOT_FOUND` con un id tipo `cdg1::…`, suele ser porque Vercel no encuentra el servidor SSR:

1. El proyecto debe usar **`@astrojs/vercel`** (ya configurado en `astro.config.mjs` cuando `VERCEL=1`).
2. **No** uses solo el adaptador Node (`@astrojs/node`) en producción Vercel.
3. En el proyecto Vercel → **Settings → General**:
   - **Root Directory:** `apps/web` (recomendado; usa `apps/web/vercel.json`).
   - Alternativa: raíz del repo + `vercel.json` en la raíz.
   - **Framework Preset:** Astro.
4. **Build Command:** `npm run build` (con root = `apps/web`) o `npm run build -w @bocado/web` (con root = raíz).
5. **No** fijes `outputDirectory` a `dist` manualmente; el adaptador Vercel genera `.vercel/output`.
6. Añade todas las variables de `.env.example` en **Environment Variables**.
7. Tras cambiar el adaptador, haz **Redeploy** sin caché.

## Pasos

1. Sube el proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. Root Directory según arriba; Framework Astro.
4. Añade variables de entorno (`PUBLIC_APP_URL` = `https://tu-proyecto.vercel.app`).
5. Deploy (Vercel define `VERCEL=1` automáticamente).
6. Prueba la URL temporal de Vercel.
7. Cuando todo esté validado, conecta el dominio final.

## Comandos

Desarrollo local:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Variables de entorno

```txt
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PUBLIC_APP_URL
REDIS_URL
TPV_SECRET_KEY
BIZUM_COMPANY_PHONE
EMAIL_FROM
EMAIL_API_KEY
WHATSAPP_BUSINESS_PHONE
WHATSAPP_API_TOKEN
```

## Supabase Auth

En Supabase:

```txt
Authentication → URL configuration
```

Configura:

```txt
Site URL = https://TU_PROYECTO.vercel.app
Redirect URLs = https://TU_PROYECTO.vercel.app/**
```

## Nota

La URL de Vercel sirve para pruebas internas antes de activar el dominio definitivo.
