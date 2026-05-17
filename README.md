# BocadO Delivery — Demo unificada

Tienda online de comida a domicilio + panel admin en **una sola app** Astro corriendo en
**http://localhost:4321**. Sin Docker, sin servicios externos, sin Supabase. Todo en memoria.

## Arranque

```bash
cd /home/isaac/Escritorio/comidas
npm install
npm run dev
```

Abre <http://localhost:4321>.

## Cuentas de demo

| Rol | Email | Contraseña |
| --- | --- | --- |
| Cliente | `cliente@bocado.app` | `cliente1234` |
| Administrador | `admin@bocado.app` | `admin1234` |

Puedes crear nuevas cuentas en:

- `/registro` — clientes
- `/admin/registro` — administradores

## Modo demo

Toda la base de datos vive en memoria. **Se reinicia cada vez que se reinicia `npm run dev`.**
Cualquier cambio (nuevo plato, pedido, factura, cuenta) desaparece al parar el servidor.

## Mapa de la app (un solo localhost)

### Pública

| Ruta | Qué hace |
| --- | --- |
| `/` | Home con hero, filtros y catálogo |
| `/platos/[slug]` | Detalle de plato con **alérgenos, ingredientes y nutrición** |
| `/restaurantes` | Listado por restaurante |
| `/ayuda` | FAQ |
| `/checkout` | Checkout con TPV, **Bizum QR** y efectivo |
| `/checkout/ok` | Confirmación |

### Cuenta cliente

| Ruta | Qué hace |
| --- | --- |
| `/login` `/registro` | Acceso y alta de clientes |
| `/perfil` | Histórico de pedidos del cliente, descarga de facturas |

### Panel admin (mismo localhost)

| Ruta | Qué hace |
| --- | --- |
| `/admin/login` `/admin/registro` | Acceso y alta de administradores |
| `/admin` | Dashboard con KPIs y gráfico de 7 días |
| `/admin/pedidos` | Cambio de estado, generar factura PDF |
| `/admin/platos` | Tabla + drawer “Nuevo plato” con secciones (info, precio, **nutrición, ingredientes, alérgenos UE**, imágenes, disponibilidad, dietas) |
| `/admin/pagos` | Distribución y estados de pago |
| `/admin/facturas` | Listado y descarga de PDFs |
| `/admin/avisos` | Histórico de emails y WhatsApp enviados |
| `/admin/usuarios` | Gestión de roles cliente/admin |
| `/admin/ajustes` | Datos fiscales, **número Bizum**, métodos de pago, notificaciones, facturación |

### API interna (mismo proceso)

| Endpoint | Uso |
| --- | --- |
| `POST /api/auth/logout` · `GET /api/auth/me` | Sesión |
| `POST /api/orders` · `PATCH /api/orders/:id/status` | Pedidos |
| `POST /api/payments/start` · `POST /api/payments/bizum-confirm` | Pagos (genera QR Bizum real con el número configurado) |
| `POST /api/dishes` · `PATCH /api/dishes/:id/availability` · `POST /api/dishes/:id/duplicate` · `DELETE /api/dishes/:id` | Catálogo |
| `POST /api/invoices/generate` · `GET /api/invoices/:id.pdf` | Facturación PDF |
| `GET PATCH /api/settings` | Empresa + Bizum + notificaciones |
| `PATCH /api/users/:id/role` · `DELETE /api/users/:id` | Usuarios |

## Funcionalidad cubierta

- Autenticación de **clientes** y **administradores** con cookies firmadas (JWT HS256, bcryptjs).
- Catálogo con **14 alérgenos UE**, ingredientes, nutrición por ración, ración, tiempo, dietas (vegano, vegetariano, sin gluten), picante.
- Carrito persistente en cliente (`localStorage`) con drawer lateral.
- Checkout en 3 pasos: cliente, dirección, pago.
- Pagos:
  - **TPV** — confirma el pedido (simulado en demo).
  - **Bizum** — genera un **QR real** con el teléfono configurado por la empresa, importe y concepto. El cliente confirma desde su app.
  - **Efectivo** — pago al repartidor.
- Generación de **factura PDF** con `pdf-lib` (logo, datos fiscales, CIF/NIF, líneas, IVA, totales). Se descarga desde la página del cliente o del admin.
- Avisos automáticos de cambio de estado (registro en `/admin/avisos`).
- Panel admin completo: dashboard, pedidos, platos con drawer, pagos, facturas, avisos, usuarios, ajustes.
- Página `/admin/usuarios` para promocionar clientes a administradores o eliminar cuentas.
- Configuración desde admin de: datos fiscales, **número de Bizum**, métodos activos, notificaciones por email/WhatsApp, prefijo de factura, gastos y umbral de envío gratis.

## Estructura

```
apps/web/                       (única app)
  src/
    middleware.ts               (inyecta sesión + protege /admin y /perfil)
    server/
      types.ts                  (modelos: User, Dish, Order, Invoice, Allergen, …)
      db.ts                     (store en memoria + seed con imágenes reales)
      auth.ts                   (JWT + bcrypt)
      bizum.ts                  (QR)
      invoice-pdf.ts            (PDF con pdf-lib)
      format.ts
    components/
      Header.astro Footer.astro Hero.astro Filters.astro DishCard.astro
      AllergenBadges.astro Logo.astro DemoBanner.astro
      islands/                  (React: CartButton, CartDrawer, AddToCart,
                                 FavoriteHeart, CheckoutForm, OrdersBoard,
                                 DishesBoard, SettingsForm, UsersBoard)
    layouts/
      Base.astro                (web pública)
      Admin.astro               (panel)
    pages/
      index.astro restaurantes.astro ayuda.astro
      platos/[slug].astro
      login.astro registro.astro perfil.astro
      checkout.astro checkout/ok.astro
      admin/
        login.astro registro.astro
        index.astro pedidos.astro platos.astro pagos.astro
        facturas.astro avisos.astro usuarios.astro ajustes.astro
      api/
        auth/{logout,me}.ts
        orders/index.ts   orders/[id]/status.ts
        payments/{start,bizum-confirm}.ts
        dishes/index.ts   dishes/[id]/index.ts  dishes/[id]/availability.ts  dishes/[id]/duplicate.ts
        invoices/generate.ts  invoices/[id].pdf.ts
        users/[id]/index.ts  users/[id]/role.ts
        settings.ts
```

## Imágenes

Todas las fotos de platos provienen de **URLs reales de Unsplash**, seleccionadas por plato. Si vas a desplegar offline, descárgalas a `public/dishes/` y sustituye las URLs en `src/server/db.ts`.

## Más adelante (Supabase)

Cuando quieras pasar a Supabase, sustituye `src/server/db.ts` por un cliente Supabase y mapea las funciones que ya consumen `getStore()`. El resto del código (auth, api, UI) no necesita cambios.

## Build de producción

```bash
npm run build
npm run start    # node ./apps/web/dist/server/entry.mjs
```
