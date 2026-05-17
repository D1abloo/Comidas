# Infrastructure — Bocado Delivery

## Arquitectura

```txt
Cliente web
   ↓
Astro SSR + React Islands
   ↓
API backend
   ↓
Supabase Auth + PostgreSQL + Storage
   ↓
Redis cache / queues
   ↓
Worker: emails, WhatsApp, facturas y pagos
```

## Carpetas principales

```txt
apps/web       → tienda pública con Astro + React
apps/admin     → panel admin con Angular
apps/api       → backend de pedidos, pagos y facturas
apps/worker    → procesos asíncronos
packages       → código compartido
supabase       → base de datos, storage y policies
redis          → caché, colas y sesiones
infrastructure → docker, vercel, supabase, redis y CI/CD
docs           → documentación del proyecto
```

## Redis

Usos principales:

- Caché de menú.
- Caché de platos destacados.
- Sesiones.
- Colas de notificaciones.
- Colas de generación de facturas.

## Supabase

Usos principales:

- Autenticación.
- Base de datos PostgreSQL.
- Storage para imágenes de platos.
- Policies RLS.
- Edge Functions opcionales.

## Vercel

Se usa para el despliegue de pruebas de la web antes de conectar dominio.
