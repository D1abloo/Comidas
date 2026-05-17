import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { generateBizumQR } from '../../../server/bizum';

/** Genera o regenera el QR Bizum de la empresa (admin). */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { amount_cents?: number; concept?: string };
  const store = getStore();
  const phone = store.settings.bizum_phone;
  if (!phone) {
    return new Response(JSON.stringify({ error: 'bizum_not_configured' }), { status: 400 });
  }

  const amount_cents = body.amount_cents ?? 100;
  const concept = body.concept ?? store.settings.bizum_concept_template.replace('{{order_number}}', 'DEMO-001');

  const qr = await generateBizumQR({ phone, amount_cents, concept });
  store.settings.bizum_qr_updated_at = new Date().toISOString();

  return new Response(
    JSON.stringify({
      qr_data_url: qr.dataUrl,
      qr_payload: qr.payload,
      phone: qr.phone,
      amount: qr.amount,
      concept,
      updated_at: store.settings.bizum_qr_updated_at,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};
