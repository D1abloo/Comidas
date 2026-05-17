# Prompt maestro — App de comida a domicilio

Actúa como arquitecto senior full-stack experto en Astro, React, Angular, TypeScript, Supabase, PostgreSQL, RLS, Redis, Tailwind CSS, pagos, facturación y notificaciones.

## Contexto

Estoy construyendo una aplicación de comida a domicilio llamada Bocado Delivery. La app debe permitir:

- Home pública premium.
- Catálogo de platos.
- Filtros por cocina, categoría, precio y tiempo.
- Carrito.
- Checkout.
- Métodos de pago: TPV, efectivo y Bizum QR.
- Panel admin para empresa/restaurante.
- Gestión de pedidos.
- Gestión de platos.
- Gestión de disponibilidad.
- Facturación automática.
- Envíos por email y WhatsApp de empresa.

## Stack obligatorio

- Astro con SSR.
- React Islands para carrito, filtros y checkout.
- Angular para el panel admin.
- TypeScript.
- Tailwind CSS.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Redis para caché y colas.
- API backend.
- Worker para emails, WhatsApp y facturas.

## Reglas

1. Usar Astro para web pública y SSR.
2. Usar React solo donde haya interacción.
3. Usar Angular para dashboard admin.
4. Mantener lógica sensible en servidor.
5. Nunca exponer claves privadas en cliente.
6. Usar Supabase con RLS.
7. Usar Redis para caché y jobs.
8. Generar factura por cada pedido.
9. Permitir envío de factura por email o WhatsApp.
10. Bizum QR debe usar el número configurado por la empresa.

## Estilo visual

UI premium, limpia, moderna, con fondo blanco cálido, negro y acento amarillo lima.
