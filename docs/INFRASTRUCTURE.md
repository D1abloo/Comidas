# Infraestructura — BocadO Delivery

## Arquitectura soportada

```text
Navegador / PWA / Capacitor
            ↓ HTTPS
nginx (TLS, límites y proxy)
            ↓ 127.0.0.1:4321
Astro 7 SSR + API Node
            ↓ red privada Docker
PostgreSQL 16
```

El despliegue actual no usa Supabase, Redis, Vercel, Angular ni un worker
independiente. Las referencias anteriores eran diseño aspiracional y no
correspondían al código ejecutable.

## Componentes

- `apps/web`: tienda, paneles, API, sesiones, facturas y SSE.
- `apps/mobile-app`: envoltorio Android unificado.
- `apps/admin-app`, `apps/courier-app`: envoltorios heredados.
- `docker/postgres`: esquema y migraciones.
- `docker-compose.yml`: PostgreSQL, migrador one-shot y web.
- `scripts/vps-nginx-ssl.sh`: TLS, rate limiting y proxy.

## Persistencia y procesos

PostgreSQL conserva usuarios, pedidos, líneas, facturas, catálogo, ajustes,
ubicaciones y eventos de notificación. `migrate` obtiene un advisory lock,
aplica archivos nuevos y termina antes de iniciar `web`.

No existe una cola distribuida: el email inmediato se procesa en el proceso web
y los demás eventos se guardan con estado `pending`. Para varias réplicas se
requieren sesiones y rate limiting compartidos, además de un worker/outbox.

## Red y seguridad

- PostgreSQL no publica puertos.
- La web publica solo `127.0.0.1:4321`.
- nginx termina TLS y separa el timeout largo de SSE.
- Los contenedores usan `no-new-privileges`; la web se ejecuta como `node`.
- Compose exige secretos de sesión, pedido y base de datos.
