# Bocado Delivery

Infraestructura base para una app de comida a domicilio.

## Stack

- Astro + React para la web pública.
- Angular para el panel admin.
- Supabase para Auth, PostgreSQL, Storage y Edge Functions.
- Redis para caché, sesiones y colas.
- API backend para pedidos, pagos, facturación y notificaciones.
- Worker para procesos asíncronos.

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy de pruebas

El deploy de pruebas se realiza en Vercel antes de conectar el dominio final.

```bash
npm run build
```

Después importa el repositorio en Vercel y añade las variables de entorno necesarias.
