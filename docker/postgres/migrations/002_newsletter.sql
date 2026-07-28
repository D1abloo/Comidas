BEGIN;

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_status_idx
  ON newsletter_subscriptions(status, created_at DESC);

COMMIT;
