/** Variables de entorno (servidor). No incluir secretos en el cliente. */
function read(key: string): string | undefined {
  const v = import.meta.env[key];
  if (typeof v === 'string' && v.length > 0) return v;
  return undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(read('PUBLIC_SUPABASE_URL') && read('SUPABASE_SERVICE_ROLE_KEY'));
}

export function getSupabaseConfig() {
  return {
    url: read('PUBLIC_SUPABASE_URL')!,
    serviceRoleKey: read('SUPABASE_SERVICE_ROLE_KEY')!,
    anonKey: read('PUBLIC_SUPABASE_ANON_KEY'),
  };
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
