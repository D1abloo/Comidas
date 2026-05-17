# Deploy en Vercel

## Objetivo

Publicar la app en Vercel para pruebas antes de conectar el dominio final.

## Pasos

1. Sube el proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. Configura el proyecto web Astro.
4. Añade variables de entorno.
5. Ejecuta build.
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
