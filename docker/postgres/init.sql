-- BocadO PostgreSQL schema (Docker / VPS)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer', 'courier')),
  phone TEXT,
  tax_id TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL,
  company JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_counters (
  year INT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  customer JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  subtotal_cents INT NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents INT NOT NULL CHECK (delivery_fee_cents >= 0),
  vat_cents INT NOT NULL CHECK (vat_cents >= 0),
  total_cents INT NOT NULL CHECK (total_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('tpv', 'cash', 'bizum')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'awaiting_confirmation', 'paid', 'failed', 'refunded')),
  notes TEXT,
  invoice_id UUID,
  courier_id TEXT REFERENCES users(id),
  courier_name TEXT,
  courier_accepted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  courier_lat DOUBLE PRECISION CHECK (courier_lat BETWEEN -90 AND 90),
  courier_lng DOUBLE PRECISION CHECK (courier_lng BETWEEN -180 AND 180),
  courier_location_at TIMESTAMPTZ,
  delivery_eta_min INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id TEXT NOT NULL,
  dish_name TEXT NOT NULL,
  unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
  quantity INT NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  vat_rate NUMERIC(5,4) NOT NULL DEFAULT 0.1 CHECK (vat_rate >= 0 AND vat_rate <= 1),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS courier_locations (
  courier_id TEXT PRIMARY KEY REFERENCES users(id),
  courier_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  accuracy_m DOUBLE PRECISION CHECK (accuracy_m IS NULL OR accuracy_m >= 0),
  active_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  active_order_number TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total_cents INT NOT NULL,
  item_count INT NOT NULL,
  seen BOOLEAN NOT NULL DEFAULT FALSE,
  courier_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  kind TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  order_number TEXT,
  customer_name TEXT NOT NULL,
  customer_tax_id TEXT,
  customer_address JSONB NOT NULL,
  lines JSONB NOT NULL,
  subtotal_cents INT NOT NULL CHECK (subtotal_cents >= 0),
  vat_cents INT NOT NULL CHECK (vat_cents >= 0),
  total_cents INT NOT NULL CHECK (total_cents >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('tpv', 'cash', 'bizum')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'awaiting_confirmation', 'paid', 'failed', 'refunded')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_counters (
  year INT NOT NULL,
  prefix TEXT NOT NULL,
  last_number INT NOT NULL DEFAULT 0 CHECK (last_number >= 0),
  PRIMARY KEY (year, prefix)
);

CREATE TABLE IF NOT EXISTS application_state (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_courier_id_idx ON orders(courier_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_dish_id_idx ON order_items(dish_id);
CREATE INDEX IF NOT EXISTS admin_alerts_seen_idx ON admin_alerts(seen, created_at DESC);

INSERT INTO company_settings (id, settings) VALUES ('default', '{
  "bizum_phone": "",
  "bizum_concept_template": "BocadO {{order_number}}",
  "tpv_enabled": false,
  "cash_enabled": true,
  "bizum_enabled": false,
  "invoice_prefix": "BOC-FACT",
  "invoice_next_number": 1,
  "email_notifications_enabled": false,
  "whatsapp_notifications_enabled": false,
  "whatsapp_business_phone": "",
  "delivery_fee_cents": 199,
  "free_delivery_from_cents": 2500,
  "printer_enabled": false,
  "printer_name": "",
  "printer_paper_mm": 80,
  "auto_print_on_order": false
}'::jsonb) ON CONFLICT (id) DO NOTHING;

-- Notify channel for real-time SSE (LISTEN order_updates)
-- App emits: SELECT pg_notify('order_updates', payload_json);
