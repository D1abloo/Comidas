import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOrderInput, readOrderRequest } from '../apps/web/src/server/order-input.ts';

const validOrder = {
  customer: {
    full_name: 'Ana García',
    email: 'Ana@example.com',
    phone: '+34600111222',
    tax_id: null,
  },
  delivery_address: {
    street: 'Calle Mayor',
    number: '12',
    floor: null,
    city: 'Madrid',
    postal_code: '28013',
    country: 'España',
    notes: null,
  },
  items: [{ dish_id: 'd-ramen', quantity: 2 }],
  payment_method: 'cash',
};

test('normaliza un pedido válido sin confiar en precios del cliente', () => {
  const result = parseOrderInput(validOrder);
  assert.equal(result.customer.email, 'ana@example.com');
  assert.deepEqual(result.items, [{ dish_id: 'd-ramen', quantity: 2 }]);
  assert.equal('price_cents' in result.items[0]!, false);
});

test('rechaza cantidades fuera de los límites', () => {
  assert.throws(
    () => parseOrderInput({ ...validOrder, items: [{ dish_id: 'd-ramen', quantity: 21 }] }),
    /invalid_quantity/,
  );
});

test('rechaza cuerpos mayores de 64 KiB antes de parsearlos', async () => {
  const request = new Request('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'content-length': String(65 * 1024) },
    body: '{}',
  });
  await assert.rejects(() => readOrderRequest(request), /payload_too_large/);
});
