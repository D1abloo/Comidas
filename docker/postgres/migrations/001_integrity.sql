BEGIN;

ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS company JSONB;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,4) NOT NULL DEFAULT 0.1;

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

CREATE UNIQUE INDEX IF NOT EXISTS invoices_order_id_unique_idx ON invoices(order_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_status_check
      CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_method_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IN ('tpv', 'cash', 'bizum')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('pending', 'awaiting_confirmation', 'paid', 'failed', 'refunded')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_amounts_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_amounts_check
      CHECK (subtotal_cents >= 0 AND delivery_fee_cents >= 0 AND vat_cents >= 0 AND total_cents >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_coordinates_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_coordinates_check
      CHECK (
        (courier_lat IS NULL OR courier_lat BETWEEN -90 AND 90)
        AND (courier_lng IS NULL OR courier_lng BETWEEN -180 AND 180)
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_quantity_check_v2') THEN
    ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_check_v2
      CHECK (quantity BETWEEN 1 AND 20) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_price_check') THEN
    ALTER TABLE order_items ADD CONSTRAINT order_items_price_check
      CHECK (unit_price_cents >= 0 AND vat_rate BETWEEN 0 AND 1) NOT VALID;
  END IF;
END $$;

COMMIT;
