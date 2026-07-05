# BocadO — Design System

Dirección visual inspirada en **Uber** (delivery: jerarquía clara, pills, blanco/negro) y **Starbucks** (retail food: canvas cálido, elevación suave, CTAs pill).

## Atmósfera

- **Canvas cálido** (`#FAF8F3`, `#F1EEE6`) — referencia a materiales de restaurante, no blanco frío.
- **Ink** (`#0A0A0A`) — texto principal y CTAs primarios (estilo Uber).
- **Lime** (`#D6FF3D`) — acento de marca BocadO; badges, promo, hover.
- **House** (`#1A2421`) — bandas oscuras (footer, hero editorial).
- **Coral** (`#FF6B4A`) — acento secundario puntual (destacados, hover).

## Tipografía

| Rol | Familia | Uso |
|-----|---------|-----|
| Display | Fraunces | H1–H2, títulos de sección, hero |
| Body | Plus Jakarta Sans | UI, párrafos, nav, cards |

- Tracking display: `-0.03em` en titulares grandes.
- Tracking body: `-0.01em` en labels y chips.
- Peso lleva jerarquía: 600–700 en títulos, 400–500 en cuerpo.

## Forma

- **Pill** (`9999px`) — botones, chips, búsqueda, tabs de categoría.
- **Card** (`20–28px`) — platos, paneles.
- **Press** — `active:scale-[0.97]` en botones (micro-interacción tipo Starbucks).

## Componentes clave

- **Header**: fondo blanco, texto ink, barra promo lime.
- **Hero**: bloque oscuro `food-hero`, búsqueda pill integrada.
- **Category rail**: chips scroll horizontal, snap.
- **Food card**: imagen 4:3, precio pill lime, footer con rating + añadir.
- **FAB cesta** (móvil): círculo 56px, sombra en capas, lime sobre ink.

## Ritmo de página

1. Promo lime → header blanco  
2. Hero oscuro → categorías en cream  
3. Secciones blancas / cream alternadas  
4. Footer house green  

## Admin panel

- **Shell**: sidebar blanco + canvas `#f4f2ec`, topbar sticky con breadcrumbs.
- **Nav agrupada**: Resumen · Operaciones · Catálogo · Finanzas · Sistema.
- **Items activos**: fondo lime/20 + borde izquierdo lime.
- **Frames**: `admin-frame` con cabecera `admin-frame-header` unificada.
- **Dashboard**: KPIs compactos + acceso rápido a las 11 secciones.
