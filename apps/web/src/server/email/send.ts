import { getEmailConfig } from '../env.js';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  ok: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const cfg = getEmailConfig();
  if (!cfg.enabled) {
    return { ok: false, provider: 'disabled', error: 'EMAIL_ENABLED=false' };
  }

  if (cfg.provider === 'console') {
    const [name, domain] = input.to.split('@');
    const masked = domain ? `${name?.slice(0, 2) ?? ''}***@${domain}` : '[destinatario]';
    console.info('[email:console] Simulación enviada', { to: masked, subject: input.subject });
    return { ok: true, provider: 'console', messageId: `console-${Date.now()}` };
  }

  if (cfg.provider === 'resend') {
    if (!cfg.apiKey) {
      return { ok: false, provider: 'resend', error: 'Falta EMAIL_API_KEY' };
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: cfg.from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
          reply_to: cfg.replyTo,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const raw = await res.text();
      let data: { id?: string; message?: string } = {};
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        data = {};
      }
      if (!res.ok) {
        return { ok: false, provider: 'resend', error: data.message ?? res.statusText };
      }
      return { ok: true, provider: 'resend', messageId: data.id };
    } catch (e) {
      return { ok: false, provider: 'resend', error: e instanceof Error ? e.message : 'Error Resend' };
    }
  }

  return { ok: false, provider: 'unknown', error: 'Proveedor de email no válido.' };
}
