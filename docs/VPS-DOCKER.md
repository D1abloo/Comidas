# BocadO en VPS con Docker + PostgreSQL

## Despliegue automático (recomendado)

```bash
chmod +x scripts/deploy-vps.sh scripts/vps-nginx-ssl.sh scripts/smoke-orders.sh
./scripts/deploy-vps.sh
./scripts/smoke-orders.sh
```

Variables opcionales:

| Variable | Default |
|----------|---------|
| `VPS` | `root@31.70.114.94` |
| `DOMAIN` | `bocado.31-70-114-94.sslip.io` |

## URL y SSL

- **Dominio temporal:** https://bocado.31-70-114-94.sslip.io (sslip.io → IP VPS)
- **Certificado:** Let's Encrypt vía certbot + nginx
- Puerto **5432** de PostgreSQL **no** expuesto al exterior (solo red Docker)

## Arranque manual

```bash
touch .env.deploy
chmod 600 .env.deploy
# Define POSTGRES_PASSWORD, SESSION_SECRET, ORDER_TOKEN_SECRET y PUBLIC_APP_URL.

docker compose --env-file .env.deploy up -d --build
bash scripts/vps-nginx-ssl.sh
```

## Usuarios

PostgreSQL no crea credenciales demo. Crea las cuentas operativas de forma
explícita siguiendo `BBDD-OPERACIONES.md`. Las credenciales publicadas en el
README pertenecen solo al store local sin `DATABASE_URL`.

## APK apuntando a la VPS

```bash
BOCADO_APP_URL=https://bocado.31-70-114-94.sslip.io npm run mobile:config:prod
npm run mobile:sync && npm run mobile:apk
```

## Tiempo real admin ↔ repartidor

- **PostgreSQL** guarda pedidos, asignaciones y estados.
- **SSE** en `GET /api/events/orders` notifica cambios al instante.

## Seguridad

- Mantén distintos `POSTGRES_PASSWORD`, `SESSION_SECRET` y
  `ORDER_TOKEN_SECRET` en `.env.deploy`.
- Ejecuta `npm audit` y `npm run check` en CI.
- Web escucha solo en `127.0.0.1:4321`; nginx termina TLS en :443.

## Tablas PostgreSQL

`users`, `orders`, `order_items`, `courier_locations`, `admin_alerts`, `notification_events`, `invoices`, `company_settings`, `order_counters`

Script: `docker/postgres/init.sql`

**Operaciones manuales** (cambiar contraseñas, exportar ventas/facturas por día/semana/mes): ver [`docs/BBDD-OPERACIONES.md`](./BBDD-OPERACIONES.md).
