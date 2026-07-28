import { randomUUID } from 'node:crypto';
import { isDatabaseEnabled } from './env.js';
import { pgQuery } from './pg.js';

const memorySubscriptions = new Set<string>();

export function normalizeNewsletterEmail(raw: unknown): string {
  if (typeof raw !== 'string') throw new Error('invalid_email');
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('invalid_email');
  }
  return email;
}

export async function subscribeNewsletter(rawEmail: unknown): Promise<{ email: string; created: boolean }> {
  const email = normalizeNewsletterEmail(rawEmail);
  if (!isDatabaseEnabled()) {
    const created = !memorySubscriptions.has(email);
    memorySubscriptions.add(email);
    return { email, created };
  }
  const { rowCount } = await pgQuery(
    `INSERT INTO newsletter_subscriptions (id, email, status, created_at, updated_at)
     VALUES ($1, $2, 'active', NOW(), NOW())
     ON CONFLICT (email) DO NOTHING
     RETURNING email`,
    [randomUUID(), email],
  );
  if (rowCount === 1) return { email, created: true };
  await pgQuery(
    `UPDATE newsletter_subscriptions
     SET status = 'active', updated_at = NOW()
     WHERE email = $1`,
    [email],
  );
  return { email, created: false };
}
