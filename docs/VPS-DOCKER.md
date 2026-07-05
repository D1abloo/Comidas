# BocadO en VPS con Docker + PostgreSQL

## Arranque rápido

```bash
# 1. Clonar y configurar
cp apps/web/.env.example apps/web/.env.local
# Edita SESSION_SECRET y PUBLIC_APP_URL (IP o dominio de tu VPS)

# 2. Levantar PostgreSQL + API web
docker compose up -d --build

# 3. La API queda en http://TU_VPS:4321
# Login: admin@bocado.app / admin1234
# Repartidor: repartidor@bocado.app / repartidor1234
```

## APK apuntando a tu VPS

```bash
BOCADO_APP_URL=http://TU_VPS:4321 npm run mobile:config:prod
npm run mobile:sync && npm run mobile:apk
```

## Tiempo real admin ↔ repartidor

- **PostgreSQL** guarda pedidos, asignaciones y estados.
- **SSE** en `GET /api/events/orders` notifica cambios al instante.
- Cuando el admin cambia un pedido a **En reparto**, el repartidor lo ve en **Disponibles** sin recargar.

## Tablas creadas

`users`, `orders`, `order_items`, `courier_locations`, `admin_alerts`, `notification_events`, `invoices`, `company_settings`, `order_counters`

Script: `docker/postgres/init.sql`

## Variables de entorno (servicio web)

| Variable | Ejemplo |
|----------|---------|
| `DATABASE_URL` | `postgres://bocado:bocado@postgres:5432/bocado` |
| `SESSION_SECRET` | secreto largo aleatorio |
| `PUBLIC_APP_URL` | `http://tu-dominio:4321` |

Sin `DATABASE_URL` el servidor usa memoria (solo desarrollo).
