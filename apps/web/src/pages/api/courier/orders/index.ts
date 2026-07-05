import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';

function requireCourier(locals: { user?: { id: string; full_name: string; role: string } | null }) {
  if (!locals.user || locals.user.role !== 'courier') {
    return null;
  }
  return locals.user;
}

export const GET: APIRoute = async ({ locals }) => {
  const courier = requireCourier(locals);
  if (!courier) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const store = getStore();
  const available = store.orders.filter((o) => o.status === 'delivering' && !o.courier_id);
  const mine = store.orders.filter((o) => o.status === 'delivering' && o.courier_id === courier.id);
  const completed = store.orders
    .filter((o) => o.status === 'delivered' && o.courier_id === courier.id)
    .sort((a, b) => (b.delivered_at ?? '').localeCompare(a.delivered_at ?? ''))
    .slice(0, 20);

  const mapOrder = (o: (typeof store.orders)[0]) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    customer_name: o.customer.full_name,
    customer_phone: o.customer.phone,
    delivery_address: o.delivery_address,
    items: o.items,
    total_cents: o.total_cents,
    payment_method: o.payment_method,
    payment_status: o.payment_status,
    notes: o.notes,
    courier_id: o.courier_id,
    courier_name: o.courier_name,
    courier_accepted_at: o.courier_accepted_at,
    delivered_at: o.delivered_at,
    created_at: o.created_at,
  });

  return new Response(
    JSON.stringify({
      courier: { id: courier.id, full_name: courier.full_name },
      available: available.map(mapOrder),
      mine: mine.map(mapOrder),
      completed: completed.map(mapOrder),
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};
