import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCustomerTracking } from '../apps/web/src/server/order-tracking.ts';
import type { Order } from '../apps/web/src/server/types.ts';

function trackedOrder(locationAt: string): Order {
  return {
    id: 'tracked',
    number: 'BOC-TRACK',
    customer: {
      user_id: null,
      full_name: 'Cliente',
      email: 'cliente@example.test',
      phone: '+34600000000',
      tax_id: null,
    },
    delivery_address: {
      street: 'Calle',
      number: '1',
      floor: null,
      city: 'Madrid',
      postal_code: '28013',
      country: 'España',
      notes: null,
      lat: 40.4168,
      lng: -3.7038,
    },
    items: [],
    subtotal_cents: 0,
    delivery_fee_cents: 0,
    vat_cents: 0,
    total_cents: 0,
    status: 'delivering',
    payment_method: 'cash',
    payment_status: 'pending',
    notes: null,
    courier_id: 'courier',
    courier_name: 'Repartidor',
    courier_accepted_at: new Date().toISOString(),
    courier_lat: 40.417,
    courier_lng: -3.704,
    courier_location_at: locationAt,
    created_at: new Date().toISOString(),
  };
}

test('muestra ubicación reciente únicamente cuando el repartidor está cerca', () => {
  const tracking = buildCustomerTracking(trackedOrder(new Date().toISOString()));
  assert.equal(tracking.en_reparto, true);
  assert.equal(tracking.courier_near, true);
  assert.equal(tracking.show_courier_map, true);
  assert.equal(typeof tracking.distance_m, 'number');
});

test('oculta coordenadas antiguas aunque el repartidor esté cerca', () => {
  const stale = new Date(Date.now() - 10 * 60_000).toISOString();
  const tracking = buildCustomerTracking(trackedOrder(stale));
  assert.equal(tracking.show_courier_map, false);
  assert.equal(tracking.courier_lat, null);
  assert.equal(tracking.courier_lng, null);
});
