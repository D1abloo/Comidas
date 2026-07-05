# BocadO Delivery

Tienda online de comida a domicilio con panel admin, carta por secciones, pagos (TPV / Bizum / efectivo), facturas PDF y notificaciones por email.

## Requisitos

- Node.js **20+**
- npm **10+**

## Arranque rápido (modo DEMO)

```bash
cd /ruta/a/comidas
npm install
cp .env.example .env.local   # opcional: personaliza
npm run dev
```

Abre **http://localhost:4321**

| Rol | Email | Contraseña |
|-----|-------|------------|
| Cliente | `cliente@bocado.app` | `cliente1234` |
| Admin | `admin@bocado.app` | `admin1234` |

En DEMO los datos viven **en memoria** (se pierden al reiniciar `npm run dev`), salvo lo que guardes en Supabase si lo tienes configurado.

---

## Variables de entorno

Copia `.env.example` → `.env.local` (en la **raíz** del repo o en `apps/web/`).

| Variable | Uso |
|----------|-----|
| `PUBLIC_APP_URL` | URL pública (enlaces en emails y QR) |
| `SESSION_SECRET` | Firma de cookies de sesión |
| `BIZUM_COMPANY_PHONE` | Teléfono Bizum por defecto |
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Clave anon (cliente futuro / RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** — persistencia de pedidos |
| `EMAIL_ENABLED` | `true` / `false` |
| `EMAIL_PROVIDER` | `console` \| `resend` |
| `EMAIL_FROM` | Remitente |
| `EMAIL_API_KEY` | API key de Resend (si `provider=resend`) |

**Nunca subas `.env.local` a Git.** Rota las claves si se han expuesto.

---

## Email al hacer un pedido

Cuando un cliente confirma un pedido (`POST /api/orders`), el sistema:

1. Calcula el **tiempo estimado de entrega** según los platos.
2. Envía un **correo** con: número de pedido, líneas del ticket, totales, dirección, tiempo estimado y enlaces al **ticket** y a **Mis pedidos**.
3. Registra el evento en `/admin/avisos` y en Supabase (`notification_events`) si está conectado.

### Configuración por entorno

| Entorno | `EMAIL_PROVIDER` | Comportamiento |
|---------|------------------|----------------|
| Desarrollo | `console` | El email se imprime en la terminal donde corre `npm run dev` |
| Producción | `resend` | Envío real vía [Resend](https://resend.com) + `EMAIL_API_KEY` |

Activa o desactiva emails globalmente en **Admin → Ajustes → Notificaciones por email**.

Plantillas: `apps/web/src/server/email/order-confirmation.ts`  
Orquestación: `apps/web/src/server/order-emails.ts`

---

## Supabase

### 1. Crear proyecto

1. [supabase.com](https://supabase.com) → nuevo proyecto.
2. **Project Settings → API**: copia URL, `anon` y `service_role` a `.env.local`.

### 2. Ejecutar migración

En el **SQL Editor** del dashboard, pega y ejecuta:

`supabase/migrations/001_initial.sql`

Crea tablas: `orders`, `order_items`, `notification_events`, `app_settings`.

### 3. Comprobar conexión

Con el servidor en marcha y sesión admin:

```bash
curl -s http://localhost:4321/api/health/supabase \
  -H "Cookie: bocado_session=TU_COOKIE_ADMIN"
```

Respuesta esperada: `{"ok":true,"configured":true,"orders_count":N}`

Cada pedido nuevo se **upsert** en Supabase (además de memoria en DEMO).

### 4. Regenerar imágenes de carta (opcional)

```bash
bash apps/web/scripts/fetch-carta-images.sh
```

---

## Pasar de DEMO a PRO

Checklist ordenada:

### Datos y backend

- [ ] Proyecto Supabase en producción con `001_initial.sql` ejecutado.
- [ ] `.env.local` / variables en el hosting con `SUPABASE_SERVICE_ROLE_KEY` (secreto).
- [ ] Sustituir `getStore()` en memoria por lectura/escritura Supabase en todas las APIs (`dishes`, `orders`, `users`, `settings`). Hoy: **pedidos y notificaciones** ya escriben en Supabase; el catálogo sigue en seed hasta completar migración.
- [ ] Backups automáticos en Supabase.
- [ ] RLS y policies por `company_id` / usuario (ver `docs/DATABASE.md`).

### Auth

- [ ] Migrar de JWT+cookie propia a **Supabase Auth** (o mantener JWT con usuarios en tabla `profiles`).
- [ ] `SESSION_SECRET` fuerte y único por entorno.
- [ ] HTTPS obligatorio en producción.

### Pagos

- [ ] TPV real (Stripe / Redsys) en lugar de simulación en `POST /api/payments/start`.
- [ ] Bizum: validar pagos (webhook o confirmación manual admin).
- [ ] No marcar `paid` hasta confirmación real.

### Email y avisos

- [ ] `EMAIL_PROVIDER=resend`, dominio verificado en Resend, `EMAIL_FROM` con tu dominio.
- [ ] Probar pedido de prueba y revisar spam.
- [ ] WhatsApp Business API si activas `whatsapp_notifications_enabled`.

### Despliegue

- [ ] `npm run build` sin errores.
- [ ] `PUBLIC_APP_URL=https://tudominio.com`
- [ ] **Vercel:** adaptador `@astrojs/vercel` (automático con `VERCEL=1`). Ver `docs/DEPLOY_VERCEL.md` si aparece `404 NOT_FOUND`.
- [ ] **VPS/Node:** `npm run start` con adaptador `@astrojs/node` (sin variable `VERCEL`).
- [ ] PWA / `manifest.webmanifest` con tu dominio.

### Legal y operación

- [ ] Páginas `/privacidad`, `/cookies`, `/terminos` revisadas por asesoría.
- [ ] RGPD: base legal para emails transaccionales (pedido confirmado).
- [ ] Rotar claves expuestas en chats o repos.

### Seguridad post-configuración

- [ ] **Borrar** claves del historial de chat y rotar en Supabase (Settings → API → regenerate).
- [ ] Confirmar que `.env.local` no está en Git: `git status` no debe listarlo.

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo en http://localhost:4321 |
| `npm run build` | Build producción |
| `npm run start` | Servidor Node tras build |
| `bash apps/web/scripts/fetch-carta-images.sh` | Descarga fotos a `apps/web/public/carta/` |
| `npm run courier:config:prod` | URL de producción en app Android repartidor |
| `npm run courier:sync` | Sincronizar Capacitor → Android |
| `npm run courier:android` | Abrir proyecto en Android Studio |
| `npm run courier:apk` | Compilar APK debug |

### App Android repartidor

Proyecto en `apps/courier-app` (Capacitor). Carga `/repartidor` y envía GPS al panel admin.

```bash
BOCADO_APP_URL=https://tu-dominio.vercel.app npm run courier:config:prod
cd apps/courier-app && npm install && npx cap sync android
npm run courier:android
```

Cuenta demo: `repartidor@bocado.app` / `repartidor1234`. Ver `apps/courier-app/README.md`.

---

## Estructura principal

```
apps/web/src/
  server/
    db.ts                 # Store en memoria (DEMO)
    supabase.ts           # Cliente admin
    supabase-orders.ts    # Persistencia pedidos
    order-emails.ts       # Email + Supabase tras pedido
    email/                # Plantillas y envío
  pages/api/
    orders/               # Crear pedido → dispara email
    health/supabase.ts    # Test conexión
supabase/migrations/      # SQL inicial
docs/                     # DATABASE, deploy, etc.
```

---

## Mapa de rutas (resumen)

| Área | Rutas |
|------|--------|
| Tienda | `/`, `/carta/[slug]`, `/buscar`, `/platos/[slug]`, `/checkout` |
| Cliente | `/login`, `/registro`, `/perfil`, `/pedidos`, `/pedido/ticket` |
| Admin | `/admin`, `/admin/pedidos`, `/admin/platos`, `/admin/ajustes`, … |
| API | `/api/orders`, `/api/payments/*`, `/api/health/supabase` |

---

## Licencia y marcas

Logos de refrescos en `/public/carta/` pueden provenir de Wikimedia Commons (uso informativo en demo). En producción verifica derechos de marca con tu asesoría legal.
