import type { APIRoute } from 'astro';
import { getStore } from '../../../../../server/db';
import { acceptOrderForCourier } from '../../../../../server/courier-orders';
import { persistOperationalState } from '../../../../../server/store-persistence';

export const PATCH: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'courier') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const store = getStore();
  const order = store.orders.find((o) => o.id === params.id);
  if (!order) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  }

  try {
    acceptOrderForCourier(store, order, locals.user);
    await persistOperationalState(store);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'No se pudo aceptar el pedido';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }

  return new Response(JSON.stringify({ order }), {
    headers: { 'content-type': 'application/json' },
  });
};
