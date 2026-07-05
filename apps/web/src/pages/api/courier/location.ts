import type { APIRoute } from 'astro';
import { getOrderById, listCourierLocations, listOrders, saveCourierLocation, saveOrder } from '../../../server/order-service';
import type { SessionUser } from '../../../server/auth';

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'courier') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const body = (await request.json()) as {
    lat?: number;
    lng?: number;
    accuracy_m?: number | null;
    active_order_id?: string | null;
  };

  if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return new Response(JSON.stringify({ error: 'invalid_coordinates' }), { status: 400 });
  }
  if (body.lat < -90 || body.lat > 90 || body.lng < -180 || body.lng > 180) {
    return new Response(JSON.stringify({ error: 'invalid_coordinates' }), { status: 400 });
  }

  const courier = locals.user as SessionUser;
  const now = new Date().toISOString();
  let activeOrder = body.active_order_id ? await getOrderById(body.active_order_id) : null;
  if (activeOrder?.courier_id && activeOrder.courier_id !== courier.id) {
    activeOrder = null;
  }

  await saveCourierLocation({
    courier_id: courier.id,
    courier_name: courier.full_name,
    lat: body.lat,
    lng: body.lng,
    accuracy_m: body.accuracy_m ?? null,
    active_order_id: activeOrder?.id ?? null,
    active_order_number: activeOrder?.number ?? null,
    updated_at: now,
  });

  if (activeOrder) {
    activeOrder.courier_lat = body.lat;
    activeOrder.courier_lng = body.lng;
    activeOrder.courier_location_at = now;
    await saveOrder(activeOrder);
  }

  const locations = await listCourierLocations();
  const loc = locations.find((l) => l.courier_id === courier.id);
  return new Response(JSON.stringify({ location: loc }), {
    headers: { 'content-type': 'application/json' },
  });
};
