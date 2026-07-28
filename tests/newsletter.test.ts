import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeNewsletterEmail } from '../apps/web/src/server/newsletter-service.ts';

test('normaliza emails válidos de newsletter', () => {
  assert.equal(normalizeNewsletterEmail('  Cliente@Example.COM '), 'cliente@example.com');
});

test('rechaza emails inválidos de newsletter', () => {
  for (const value of ['', 'sin-arroba', 'a@b', null, 42]) {
    assert.throws(() => normalizeNewsletterEmail(value), /invalid_email/);
  }
});
