import type { APIRoute } from 'astro';
import { subscribeNewsletter } from '../../server/newsletter-service';

export const POST: APIRoute = async ({ request }) => {
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > 4_096) {
    return new Response(JSON.stringify({ error: 'payload_too_large' }), {
      status: 413,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as { email?: unknown };
    const result = await subscribeNewsletter(body.email);
    return new Response(JSON.stringify({ ok: true, subscribed: true, created: result.created }), {
      status: result.created ? 201 : 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    const code = error instanceof SyntaxError
      ? 'invalid_json'
      : error instanceof Error
        ? error.message
        : 'invalid_request';
    return new Response(JSON.stringify({ error: code }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
};
