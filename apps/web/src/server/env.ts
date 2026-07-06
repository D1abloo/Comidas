/** Variables de entorno (servidor). No incluir secretos en el cliente. */
function read(key: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env[key] : undefined;
  if (typeof fromProcess === 'string' && fromProcess.length > 0) return fromProcess;
  const v = import.meta.env[key];
  if (typeof v === 'string' && v.length > 0) return v;
  return undefined;
}

export function getEmailConfig() {
  const provider = (read('EMAIL_PROVIDER') ?? 'console') as 'console' | 'resend' | 'smtp';
  return {
    enabled: read('EMAIL_ENABLED') !== 'false',
    provider,
    from: read('EMAIL_FROM') ?? 'pedidos@bocado.app',
    apiKey: read('EMAIL_API_KEY'),
    replyTo: read('EMAIL_REPLY_TO'),
    smtp: {
      host: read('SMTP_HOST'),
      port: Number(read('SMTP_PORT') ?? '587'),
      user: read('SMTP_USER'),
      pass: read('SMTP_PASS'),
      secure: read('SMTP_SECURE') === 'true',
    },
  };
}

export function getAppUrl(): string {
  return read('PUBLIC_APP_URL') ?? 'http://localhost:4321';
}

export function isDatabaseEnabled(): boolean {
  return Boolean(read('DATABASE_URL'));
}

export function getDatabaseUrl(): string {
  return read('DATABASE_URL') ?? '';
}
