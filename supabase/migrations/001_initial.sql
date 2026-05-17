-- BocadO — esquema inicial (ejecutar en SQL Editor de Supabase)
-- Usa service_role desde el servidor Astro; RLS preparado para endurecer en PRO.

create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id uuid primary key,
  number text unique not null,
  customer jsonb not null,
  delivery_address jsonb not null,
  subtotal_cents integer not null,
  delivery_fee_cents integer not null,
  vat_cents integer not null,
  total_cents integer not null,
  status text not null default 'pending',
  payment_method text not null,
  payment_status text not null default 'pending',
  notes text,
  invoice_id uuid,
  delivery_eta_min integer,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  dish_id text not null,
  dish_name text not null,
  unit_price_cents integer not null,
  quantity integer not null check (quantity > 0),
  notes text
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_customer_email_idx on public.orders ((customer->>'email'));

create table if not exists public.notification_events (
  id uuid primary key,
  order_id uuid references public.orders (id) on delete set null,
  channel text not null check (channel in ('email', 'whatsapp')),
  kind text not null,
  recipient text not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  error_message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notification_events enable row level security;
alter table public.app_settings enable row level security;

-- Demo: el backend usa service_role. En PRO añade policies por empresa/usuario.
