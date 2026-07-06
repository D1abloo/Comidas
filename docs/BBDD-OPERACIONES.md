# Operaciones PostgreSQL — contraseñas y extracción de datos

Guía práctica para administrar **BocadO** en VPS o Docker local. La base de datos es **PostgreSQL 16** (`bocado` / usuario `bocado`).

## Conectar a la base de datos

### En la VPS (producción)

```bash
ssh root@31.70.114.94
cd /root/comidas

# Consola interactiva
docker compose exec postgres psql -U bocado -d bocado
```

La contraseña está en `/root/comidas/.env.deploy` (`POSTGRES_PASSWORD`). Si no la definiste, el default del compose es `bocado`.

### En local (Docker)

```bash
cd /ruta/a/comidas
docker compose up -d postgres
docker compose exec postgres psql -U bocado -d bocado
```

URL de conexión: `postgres://bocado:bocado@localhost:5432/bocado` (ajusta la contraseña si cambiaste `POSTGRES_PASSWORD`).

---

## Cambiar contraseñas de usuarios

Las contraseñas se guardan en `users.password_hash` con **bcrypt** (coste 10 en runtime; los usuarios demo del `init.sql` usan coste 8).

### 1. Generar el hash de la nueva contraseña

**En la VPS** (recomendado — usa el mismo Node del contenedor web):

```bash
cd /root/comidas
docker compose exec web node -e "const b=require('bcryptjs'); console.log(b.hashSync('TU_NUEVA_CONTRASEÑA', 10))"
```

**En local** (sin Docker):

```bash
cd apps/web
node -e "const b=require('bcryptjs'); console.log(b.hashSync('TU_NUEVA_CONTRASEÑA', 10))"
```

Copia la salida (empieza por `$2a$10$...`).

### 2. Actualizar en PostgreSQL

```sql
-- Por email (case-insensitive)
UPDATE users
SET password_hash = '$2a$10$PEGAR_HASH_AQUI'
WHERE lower(email) = lower('admin@bocado.app');

-- Comprobar
SELECT id, email, role, left(password_hash, 20) || '…' AS hash_preview
FROM users
WHERE email = 'admin@bocado.app';
```

### 3. Cambiar varios usuarios a la vez

```sql
-- Listar cuentas
SELECT id, email, full_name, role, created_at FROM users ORDER BY role, email;

-- Repartidor
UPDATE users SET password_hash = '$2a$10$…' WHERE email = 'repartidor@bocado.app';

-- Cliente
UPDATE users SET password_hash = '$2a$10$…' WHERE email = 'cliente@bocado.app';
```

> **Nota:** Tras cambiar la contraseña, las sesiones ya abiertas siguen válidas hasta que expire la cookie o el usuario cierre sesión. Para forzar re-login, reinicia el contenedor web: `docker compose restart web`.

### Crear un usuario nuevo por SQL

```sql
INSERT INTO users (id, email, full_name, role, phone, password_hash)
VALUES (
  'u-' || substr(md5(random()::text), 1, 8),
  'nuevo@empresa.com',
  'Nombre Apellido',
  'admin',  -- admin | courier | customer
  '+34600000000',
  '$2a$10$PEGAR_HASH_AQUI'
);
```

---

## Dónde están los datos de facturación

| Dato | Tabla | Notas |
|------|--------|--------|
| Pedidos completos | `orders` + `order_items` | **Siempre en PostgreSQL** en VPS |
| Referencia a factura | `orders.invoice_id` | UUID si se generó factura en la app |
| Facturas detalladas | `invoices` | Tabla creada en `init.sql`; la app puede tener líneas solo en memoria hasta reinicio del contenedor |
| Ajustes numeración | `company_settings.settings` | JSON con `invoice_prefix`, `invoice_next_number` |

Para **informes fiables en producción**, usa **`orders` + `order_items`** (totales, IVA, cliente, líneas). Si la tabla `invoices` tiene filas, puedes cruzar con `orders.invoice_id = invoices.id`.

---

## Consultas: facturación / ventas

Zona horaria usada en los ejemplos: **Europe/Madrid**. Ajusta si tu negocio opera en otra.

### Resumen del día (hoy)

```sql
SELECT
  count(*) AS num_pedidos,
  count(*) FILTER (WHERE payment_status = 'paid') AS pagados,
  round(sum(total_cents) FILTER (WHERE payment_status = 'paid') / 100.0, 2) AS total_eur,
  round(sum(subtotal_cents) FILTER (WHERE payment_status = 'paid') / 100.0, 2) AS subtotal_eur,
  round(sum(vat_cents) FILTER (WHERE payment_status = 'paid') / 100.0, 2) AS iva_eur,
  round(sum(delivery_fee_cents) FILTER (WHERE payment_status = 'paid') / 100.0, 2) AS envio_eur
FROM orders
WHERE (created_at AT TIME ZONE 'Europe/Madrid')::date = (now() AT TIME ZONE 'Europe/Madrid')::date;
```

### Resumen por semana (ISO, lunes–domingo)

```sql
SELECT
  date_trunc('week', created_at AT TIME ZONE 'Europe/Madrid')::date AS semana_inicio,
  count(*) FILTER (WHERE payment_status = 'paid') AS pedidos_pagados,
  round(sum(total_cents) FILTER (WHERE payment_status = 'paid') / 100.0, 2) AS total_eur
FROM orders
WHERE created_at >= date_trunc('week', now() AT TIME ZONE 'Europe/Madrid')
GROUP BY 1;
```

### Resumen por mes

```sql
SELECT
  to_char(created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM') AS mes,
  count(*) FILTER (WHERE payment_status = 'paid') AS pedidos_pagados,
  round(sum(total_cents) FILTER (WHERE payment_status = 'paid') / 100.0, 2) AS total_eur,
  round(avg(total_cents) FILTER (WHERE payment_status = 'paid') / 100.0, 2) AS ticket_medio_eur
FROM orders
WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'Europe/Madrid')
GROUP BY 1
ORDER BY 1;
```

### Listado completo del día (equivalente a facturas)

Una fila por pedido con cliente, totales y método de pago:

```sql
SELECT
  o.number AS numero_pedido,
  o.invoice_id,
  o.created_at AT TIME ZONE 'Europe/Madrid' AS fecha_madrid,
  o.customer->>'full_name' AS cliente,
  o.customer->>'email' AS email,
  o.customer->>'tax_id' AS nif_cif,
  o.delivery_address->>'line1' AS direccion,
  o.delivery_address->>'city' AS ciudad,
  o.payment_method,
  o.payment_status,
  o.status AS estado_pedido,
  round(o.subtotal_cents / 100.0, 2) AS subtotal_eur,
  round(o.delivery_fee_cents / 100.0, 2) AS envio_eur,
  round(o.vat_cents / 100.0, 2) AS iva_eur,
  round(o.total_cents / 100.0, 2) AS total_eur
FROM orders o
WHERE (o.created_at AT TIME ZONE 'Europe/Madrid')::date = (now() AT TIME ZONE 'Europe/Madrid')::date
ORDER BY o.created_at;
```

### Detalle con líneas de cada pedido (factura completa)

```sql
SELECT
  o.number AS numero_pedido,
  o.created_at AT TIME ZONE 'Europe/Madrid' AS fecha,
  o.customer->>'full_name' AS cliente,
  oi.dish_name AS concepto,
  oi.quantity AS cantidad,
  round(oi.unit_price_cents / 100.0, 2) AS precio_unit_eur,
  round(oi.unit_price_cents * oi.quantity / 100.0, 2) AS importe_linea_eur,
  o.payment_method,
  o.payment_status,
  round(o.total_cents / 100.0, 2) AS total_pedido_eur
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE (o.created_at AT TIME ZONE 'Europe/Madrid')::date = (now() AT TIME ZONE 'Europe/Madrid')::date
  AND o.payment_status = 'paid'
ORDER BY o.created_at, oi.dish_name;
```

### Rango de fechas personalizado

Sustituye las fechas:

```sql
-- Del 1 al 7 de julio de 2026
SELECT o.number, o.created_at, o.total_cents / 100.0 AS total_eur
FROM orders o
WHERE o.created_at >= '2026-07-01'::timestamptz
  AND o.created_at <  '2026-07-08'::timestamptz
  AND o.payment_status = 'paid'
ORDER BY o.created_at;
```

### Desde la tabla `invoices` (si tiene datos)

```sql
SELECT
  i.number AS numero_factura,
  i.order_number,
  i.customer_name,
  i.customer_tax_id,
  i.payment_method,
  i.payment_status,
  round(i.subtotal_cents / 100.0, 2) AS subtotal_eur,
  round(i.vat_cents / 100.0, 2) AS iva_eur,
  round(i.total_cents / 100.0, 2) AS total_eur,
  i.issued_at AT TIME ZONE 'Europe/Madrid' AS emitida,
  i.lines AS lineas_json
FROM invoices i
WHERE (i.issued_at AT TIME ZONE 'Europe/Madrid')::date = (now() AT TIME ZONE 'Europe/Madrid')::date
ORDER BY i.issued_at;
```

---

## Exportar a CSV

Desde la VPS, sin entrar en `psql`:

```bash
cd /root/comidas

docker compose exec -T postgres psql -U bocado -d bocado -c "
COPY (
  SELECT
    o.number,
    o.created_at,
    o.customer->>'full_name',
    o.customer->>'email',
    o.payment_method,
    o.payment_status,
    o.subtotal_cents / 100.0,
    o.vat_cents / 100.0,
    o.total_cents / 100.0
  FROM orders o
  WHERE (o.created_at AT TIME ZONE 'Europe/Madrid')::date = (now() AT TIME ZONE 'Europe/Madrid')::date
) TO STDOUT WITH (FORMAT CSV, HEADER true)
" > ~/facturas-$(date +%F).csv
```

Descargar el CSV a tu PC:

```bash
scp root@31.70.114.94:~/facturas-2026-07-07.csv .
```

---

## Otras consultas útiles

### Pedidos por estado

```sql
SELECT status, payment_status, count(*), round(sum(total_cents)/100.0, 2) AS total_eur
FROM orders
GROUP BY status, payment_status
ORDER BY count(*) DESC;
```

### Top platos (últimos 30 días)

```sql
SELECT oi.dish_name, sum(oi.quantity) AS unidades, round(sum(oi.unit_price_cents * oi.quantity)/100.0, 2) AS ingresos_eur
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.created_at >= now() - interval '30 days'
  AND o.payment_status = 'paid'
GROUP BY oi.dish_name
ORDER BY unidades DESC
LIMIT 20;
```

### Backup manual de la base de datos

```bash
cd /root/comidas
docker compose exec -T postgres pg_dump -U bocado -d bocado --no-owner > ~/bocado-backup-$(date +%F).sql
```

Restaurar (¡sobrescribe datos!):

```bash
docker compose exec -T postgres psql -U bocado -d bocado < ~/bocado-backup-2026-07-07.sql
```

---

## Esquema rápido

```
users              → login (email, password_hash, role)
orders             → pedido (customer JSON, totales, invoice_id, fechas)
order_items        → líneas del pedido
invoices           → factura emitida (lines JSON, totales)
company_settings   → ajustes tienda (JSONB)
order_counters     → numeración BOC-YYYY-NNNNNN
courier_locations  → GPS repartidores
admin_alerts       → avisos panel admin
notification_events → emails/WhatsApp registrados
```

Script completo: `docker/postgres/init.sql`

---

## Despliegue tras cambios en el repo

```bash
npm run deploy:vps
# o manualmente:
./scripts/deploy-vps.sh
```

URL producción: https://bocado.31-70-114-94.sslip.io
