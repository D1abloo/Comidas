# Database — Supabase

## Entidades principales

```txt
profiles
companies
restaurants
company_settings
dishes
dish_categories
dish_options
dish_images
customers
orders
order_items
payments
invoices
notification_events
audit_logs
```

## Multiempresa

Las tablas principales deben relacionarse con `company_id` o `restaurant_id`.

```txt
company_id → restaurants
company_id → company_settings
restaurant_id → dishes
restaurant_id → orders
restaurant_id → invoices
```

## Facturación

Cada pedido puede generar una factura con:

- Nombre fiscal de la empresa.
- CIF/NIF.
- Dirección fiscal.
- Datos del cliente.
- Número de pedido.
- Fecha y hora.
- Platos pedidos.
- Cantidades.
- Precio unitario.
- Subtotal.
- Gastos de envío.
- Total.
- Método de pago.
- Estado del pago.

## Pagos

Métodos soportados:

- TPV / tarjeta.
- Efectivo al recibir.
- Bizum QR usando el número configurado por la empresa.

## Seguridad

- RLS activado.
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
- Policies por empresa/restaurante.
- Validaciones en API.
- Logs de auditoría.
