/** Variables de entorno (servidor). No incluir secretos en el cliente. */
export function readEnv(key: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env[key] : undefined;
  if (typeof fromProcess === 'string' && fromProcess.length > 0) return fromProcess;
  const v = import.meta.env?.[key];
  if (typeof v === 'string' && v.length > 0) return v;
  return undefined;
}

function booleanEnv(key: string, fallback = false): boolean {
  const value = readEnv(key);
  if (value == null) return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${key} must be "true" or "false"`);
}

function integerEnv(key: string, fallback: number, min: number, max: number): number {
  const raw = readEnv(key);
  if (raw == null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function isProductionRuntime(): boolean {
  return Boolean(import.meta.env?.PROD) || readEnv('NODE_ENV') === 'production';
}

export function getEmailConfig() {
  const rawProvider = readEnv('EMAIL_PROVIDER') ?? 'console';
  if (!['console', 'resend'].includes(rawProvider)) {
    throw new Error('EMAIL_PROVIDER must be "console" or "resend"');
  }
  const provider = rawProvider as 'console' | 'resend';
  return {
    enabled: booleanEnv('EMAIL_ENABLED'),
    provider,
    from: readEnv('EMAIL_FROM') ?? 'pedidos@bocado.app',
    apiKey: readEnv('EMAIL_API_KEY'),
    replyTo: readEnv('EMAIL_REPLY_TO'),
  };
}

export function getAppUrl(): string {
  return readEnv('PUBLIC_APP_URL') ?? 'http://localhost:4321';
}

export function isDatabaseEnabled(): boolean {
  return Boolean(readEnv('DATABASE_URL'));
}

export function getDatabaseUrl(): string {
  return readEnv('DATABASE_URL') ?? '';
}

export function getDatabaseConfig() {
  return {
    url: getDatabaseUrl(),
    ssl: booleanEnv('DATABASE_SSL'),
    rejectUnauthorized: booleanEnv('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
    poolMax: integerEnv('DB_POOL_MAX', 5, 1, 20),
  };
}

export function getBizumCompanyPhone(): string {
  return readEnv('BIZUM_COMPANY_PHONE') ?? '';
}

export function getLocalDataDirectory(): string | undefined {
  return readEnv('BOCADO_DATA_DIR');
}

export function isDemoMode(): boolean {
  return !isProductionRuntime() && booleanEnv('APP_DEMO_MODE', true);
}

export function areSimulatedPaymentsEnabled(): boolean {
  return isDemoMode() && booleanEnv('ENABLE_SIMULATED_PAYMENTS');
}

/** Bizum real: QR + confirmación admin. Independiente del TPV simulado de demo. */
export function areManualBizumPaymentsEnabled(): boolean {
  return booleanEnv('ENABLE_MANUAL_BIZUM', true) || areSimulatedPaymentsEnabled();
}

export function isEmailDeliveryConfigured(): boolean {
  const email = getEmailConfig();
  return email.enabled && email.provider === 'resend' && Boolean(email.apiKey);
}

export function validateRuntimeConfig(): string[] {
  const issues: string[] = [];
  let appUrl: URL | null = null;
  try {
    appUrl = new URL(getAppUrl());
  } catch {
    issues.push('PUBLIC_APP_URL must be a valid absolute URL');
  }
  if (appUrl && !['http:', 'https:'].includes(appUrl.protocol)) {
    issues.push('PUBLIC_APP_URL must use http or https');
  }

  if (isDatabaseEnabled()) {
    try {
      const databaseUrl = new URL(getDatabaseUrl());
      if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
        issues.push('DATABASE_URL must use postgres or postgresql');
      }
      getDatabaseConfig();
    } catch (error) {
      issues.push(error instanceof Error ? error.message : 'DATABASE_URL is invalid');
    }
  } else if (isProductionRuntime()) {
    issues.push('DATABASE_URL is required in production');
  }

  try {
    const email = getEmailConfig();
    if (email.enabled && email.provider === 'resend' && !email.apiKey) {
      issues.push('EMAIL_API_KEY is required when EMAIL_PROVIDER=resend');
    }
    if (isProductionRuntime() && email.enabled && email.provider === 'console') {
      issues.push('EMAIL_PROVIDER=console cannot deliver email in production');
    }
  } catch (error) {
    issues.push(error instanceof Error ? error.message : 'Email configuration is invalid');
  }

  try {
    areSimulatedPaymentsEnabled();
  } catch (error) {
    issues.push(error instanceof Error ? error.message : 'Payment configuration is invalid');
  }
  return Array.from(new Set(issues));
}

export function assertRuntimeConfig(): void {
  const issues = validateRuntimeConfig();
  if (issues.length > 0) throw new Error(`Invalid runtime configuration: ${issues.join('; ')}`);
}
