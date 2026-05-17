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
    console.info('\n========== EMAIL (modo consola) ==========');
    console.info('Para:', input.to);
    console.info('Asunto:', input.subject);
    console.info('--- Texto ---\n', input.text);
    console.info('==========================================\n');
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
      });
      const data = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) {
        return { ok: false, provider: 'resend', error: data.message ?? res.statusText };
      }
      return { ok: true, provider: 'resend', messageId: data.id };
    } catch (e) {
      return { ok: false, provider: 'resend', error: e instanceof Error ? e.message : 'Error Resend' };
    }
  }

  return {
    ok: false,
    provider: cfg.provider,
    error: `Proveedor "${cfg.provider}" no implementado aún. Usa console o resend.`,
  };
}
