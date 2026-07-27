import type { APIRoute } from 'astro';
import { completeCourierOrder } from '../../../../../server/courier-service';

export const PATCH: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'courier') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  try {
    const saved = await completeCourierOrder(String(params.id), locals.user);
    return new Response(JSON.stringify({ order: saved }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'No se pudo completar la entrega';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
};
