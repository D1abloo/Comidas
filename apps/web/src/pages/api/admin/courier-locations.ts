import type { APIRoute } from 'astro';
import { listCourierLocations, listOrders } from '../../../server/order-service';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const all = await listOrders();
  const cutoff = Date.now() - 10 * 60 * 1000;
  const locations = (await listCourierLocations()).filter(
    (l) => new Date(l.updated_at).getTime() >= cutoff,
  );

  const orders = all
    .filter((o) => o.status === 'delivering' && o.courier_lat != null && o.courier_lng != null)
    .map((o) => ({
      id: o.id,
      number: o.number,
      courier_id: o.courier_id,
      courier_name: o.courier_name,
      lat: o.courier_lat,
      lng: o.courier_lng,
      location_at: o.courier_location_at,
      customer_name: o.customer.full_name,
      delivery_address: o.delivery_address,
    }));

  return new Response(JSON.stringify({ locations, orders }), {
    headers: { 'content-type': 'application/json' },
  });
};
