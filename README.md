# BocadO Delivery

Tienda de comida a domicilio con catálogo, carrito, checkout, seguimiento,
panel administrativo, reparto, facturas PDF y tres envoltorios Android
Capacitor.

## Requisitos

- Node.js 22.12 o superior
- npm 10 o superior
- Docker + Docker Compose para el entorno PostgreSQL
- JDK 21 y Android SDK para compilar los APK

## Desarrollo local

```bash
npm ci
npm run check
npm run dev
```

Abre `http://localhost:4321`. Sin `DATABASE_URL` se usa el modo demo local y
los cambios se conservan en `.data/bocado-store.json` (ignorado por Git).

Las cuentas de demostración existen únicamente en ese modo:

| Rol | Email | Contraseña |
| --- | --- | --- |
| Cliente | `cliente@bocado.app` | `cliente1234` |
| Admin | `admin@bocado.app` | `admin1234` |
| Repartidor | `repartidor@bocado.app` | `repartidor1234` |

Los pagos TPV/Bizum simulados solo pueden habilitarse en desarrollo. En
producción quedan desactivados hasta conectar un proveedor real; efectivo está
habilitado por defecto.

## Comandos

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run typecheck` | Diagnóstico Astro/TypeScript |
| `npm test` | Pruebas unitarias |
| `npm run build` | Build SSR Node |
| `npm run check` | Typecheck + tests + build |
| `npm run db:migrate` | Migraciones PostgreSQL aditivas |
| `npm run docker:up` | Build y arranque Docker |
| `npm run deploy:vps` | Despliegue Docker/nginx en el VPS configurado |
| `npm run mobile:sync` | Sincroniza la app unificada con Android |

## Configuración

Copia `.env.example` a `.env.local` para desarrollo. No subas secretos.

Variables principales:

- `PUBLIC_APP_URL`: origen público usado en enlaces.
- `SESSION_SECRET`: firma de sesión; mínimo 32 caracteres en producción.
- `ORDER_TOKEN_SECRET`: firma independiente de accesos a pedidos.
- `DATABASE_URL`: activa PostgreSQL.
- `EMAIL_ENABLED`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_API_KEY`: correo.
- `ALLOW_ADMIN_REGISTRATION`: desactivado en producción por defecto.
- `APP_DEMO_MODE`, `ENABLE_SIMULATED_PAYMENTS`: solo desarrollo.

Docker exige `POSTGRES_PASSWORD`, `SESSION_SECRET`, `ORDER_TOKEN_SECRET` y
`PUBLIC_APP_URL`. El despliegue genera los tres secretos en `.env.deploy` con
permisos `600` y ejecuta las migraciones antes de iniciar la web.

## Arquitectura

```text
apps/
  web/           Astro 7 SSR + React + Tailwind + API
  mobile-app/    app Android unificada (admin/repartidor)
  admin-app/     envoltorio Android admin heredado
  courier-app/   envoltorio Android repartidor heredado
docker/
  postgres/      esquema y migraciones
scripts/         migración, smoke test y despliegue
tests/           pruebas unitarias de entrada y seguridad
```

La persistencia de producción usa PostgreSQL para usuarios, pedidos, líneas,
facturas, avisos, catálogo y ajustes. El servidor recalcula precios, IVA y
envío: el cliente nunca decide importes.

## Android

Configura una URL HTTPS para producción:

```bash
BOCADO_APP_URL=https://tu-dominio.example npm run mobile:config:prod
npm run mobile:sync
npm run mobile:apk
```

La URL local usa `10.0.2.2` y permite HTTP solo para el emulador. Las builds de
producción bloquean tráfico en claro y copias de seguridad Android.

## Producción

El destino soportado es Node 22/Docker en VPS. Vercel no está habilitado porque
la aplicación necesita SSR Node, sesiones y migraciones PostgreSQL; consulta
`docs/DEPLOY_VERCEL.md`.

Antes de abrir tráfico real:

1. Sustituye datos fiscales y textos legales por los definitivos.
2. Conecta y valida TPV/Bizum mediante proveedor/webhook.
3. Configura el proveedor de email y verifica el dominio.
4. Crea administradores y repartidores en PostgreSQL.
5. Configura backups, restauración y monitorización.

Consulta `docs/AUDIT-2026-07-27.md` para el resultado de la auditoría y los
riesgos externos que aún requieren decisiones de negocio.
