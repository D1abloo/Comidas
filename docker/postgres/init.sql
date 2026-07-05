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
  subtotal_cents INT NOT NULL,
  delivery_fee_cents INT NOT NULL,
  vat_cents INT NOT NULL,
  total_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  invoice_id UUID,
  courier_id TEXT REFERENCES users(id),
  courier_name TEXT,
  courier_accepted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  courier_lat DOUBLE PRECISION,
  courier_lng DOUBLE PRECISION,
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
  unit_price_cents INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS courier_locations (
  courier_id TEXT PRIMARY KEY REFERENCES users(id),
  courier_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
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
  order_id UUID NOT NULL REFERENCES orders(id),
  order_number TEXT,
  customer_name TEXT NOT NULL,
  customer_tax_id TEXT,
  customer_address JSONB NOT NULL,
  lines JSONB NOT NULL,
  subtotal_cents INT NOT NULL,
  vat_cents INT NOT NULL,
  total_cents INT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_courier_id_idx ON orders(courier_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_dish_id_idx ON order_items(dish_id);
CREATE INDEX IF NOT EXISTS admin_alerts_seen_idx ON admin_alerts(seen, created_at DESC);

-- Demo users (passwords: admin1234, repartidor1234, cliente1234)
INSERT INTO users (id, email, full_name, role, phone, password_hash) VALUES
  ('u-admin', 'admin@bocado.app', 'Equipo BocadO', 'admin', '+34911234567', '$2a$08$tqPcOt4hk3SuQYgPV2cC0u8iovwdYVqOeWMCBYJjtqYyQz6cvFiJu'),
  ('u-courier', 'repartidor@bocado.app', 'Carlos Repartidor', 'courier', '+34600222333', '$2a$08$.liE8FJKiQBaiaIghJDVJ.wP0Qr2YUtVLC5dEWG/0YynFlOQ1U52W'),
  ('u-cliente', 'cliente@bocado.app', 'Cliente Demo', 'customer', '+34600111222', '$2a$08$0qwGWr7tTg.ewPX.iGX50eQ2M4dMWT11OFLVRagMOnnVKNrwajAJW')
ON CONFLICT (id) DO NOTHING;

INSERT INTO company_settings (id, settings) VALUES ('default', '{
  "bizum_phone": "+34600123456",
  "bizum_concept_template": "BocadO {{order_number}}",
  "tpv_enabled": true,
  "cash_enabled": true,
  "bizum_enabled": true,
  "invoice_prefix": "BOC-FACT",
  "invoice_next_number": 1,
  "email_notifications_enabled": true,
  "whatsapp_notifications_enabled": true,
  "whatsapp_business_phone": "+34600123456",
  "delivery_fee_cents": 199,
  "free_delivery_from_cents": 2500,
  "printer_enabled": false,
  "printer_name": "",
  "printer_paper_mm": 80,
  "auto_print_on_order": false
}'::jsonb) ON CONFLICT (id) DO NOTHING;

INSERT INTO order_counters (year, last_number) VALUES (2026, 1043) ON CONFLICT DO NOTHING;

-- Notify channel for real-time SSE (LISTEN order_updates)
-- App emits: SELECT pg_notify('order_updates', payload_json);
