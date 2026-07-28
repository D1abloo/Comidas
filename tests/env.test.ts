import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  areManualBizumPaymentsEnabled,
  areSimulatedPaymentsEnabled,
  getDatabaseConfig,
  getEmailConfig,
  validateRuntimeConfig,
} from '../apps/web/src/server/env.ts';

const keys = [
  'NODE_ENV',
  'PUBLIC_APP_URL',
  'DATABASE_URL',
  'DATABASE_SSL',
  'DATABASE_SSL_REJECT_UNAUTHORIZED',
  'DB_POOL_MAX',
  'EMAIL_ENABLED',
  'EMAIL_PROVIDER',
  'EMAIL_API_KEY',
  'APP_DEMO_MODE',
  'ENABLE_SIMULATED_PAYMENTS',
] as const;

const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = original[key];
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
});

test('rechaza booleanos y límites de configuración inválidos', () => {
  process.env.DATABASE_URL = 'postgres://localhost/bocado';
  process.env.DATABASE_SSL = 'yes';
  assert.throws(() => getDatabaseConfig(), /DATABASE_SSL/);

  process.env.DATABASE_SSL = 'false';
  process.env.DB_POOL_MAX = '100';
  assert.throws(() => getDatabaseConfig(), /DB_POOL_MAX/);
});

test('valida la configuración necesaria de proveedores de email', () => {
  process.env.EMAIL_ENABLED = 'true';
  process.env.EMAIL_PROVIDER = 'resend';
  const issues = validateRuntimeConfig();
  assert.ok(issues.some((issue) => issue.includes('EMAIL_API_KEY')));

  process.env.EMAIL_API_KEY = 'test-key';
  assert.equal(getEmailConfig().provider, 'resend');
});

test('los pagos simulados requieren activación explícita y modo no productivo', () => {
  process.env.NODE_ENV = 'development';
  process.env.APP_DEMO_MODE = 'true';
  delete process.env.ENABLE_SIMULATED_PAYMENTS;
  assert.equal(areSimulatedPaymentsEnabled(), false);

  process.env.ENABLE_SIMULATED_PAYMENTS = 'true';
  assert.equal(areSimulatedPaymentsEnabled(), true);
  assert.equal(areManualBizumPaymentsEnabled(), true);

  process.env.NODE_ENV = 'production';
  assert.equal(areSimulatedPaymentsEnabled(), false);
  assert.equal(areManualBizumPaymentsEnabled(), false);
});

test('producción exige una base de datos persistente', () => {
  process.env.NODE_ENV = 'production';
  process.env.PUBLIC_APP_URL = 'https://bocado.example';
  delete process.env.DATABASE_URL;
  const issues = validateRuntimeConfig();
  assert.ok(issues.includes('DATABASE_URL is required in production'));
});
