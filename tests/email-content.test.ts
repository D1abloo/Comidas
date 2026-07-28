import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOrderConfirmationEmail } from '../apps/web/src/server/email/order-confirmation.ts';
import type { Order } from '../apps/web/src/server/types.ts';

function order(paymentMethod: Order['payment_method']): Order {
  return {
    id: 'order-email',
    number: 'BOC-TEST-1',
    customer: {
      user_id: null,
      full_name: 'Cliente Prueba',
      email: 'cliente@example.test',
      phone: '+34600000000',
      tax_id: null,
    },
    delivery_address: {
      street: 'Calle Mayor',
      number: '1',
      floor: null,
      city: 'Madrid',
      postal_code: '28013',
      country: 'España',
      notes: null,
    },
    items: [
      {
        dish_id: 'dish',
        dish_name: 'Plato',
        unit_price_cents: 1_000,
        quantity: 1,
        vat_rate: 0.1,
      },
    ],
    subtotal_cents: 1_000,
    delivery_fee_cents: 0,
    vat_cents: 91,
    total_cents: 1_000,
    status: 'pending',
    payment_method: paymentMethod,
    payment_status: 'pending',
    notes: null,
    created_at: new Date().toISOString(),
  };
}

const options = {
  appUrl: 'https://bocado.example',
  deliveryEtaMin: 30,
  companyName: 'BocadO',
  accessToken: 'signed-token',
};

test('el correo de efectivo no presenta el seguimiento como un pago online', () => {
  const content = buildOrderConfirmationEmail(order('cash'), options);
  assert.match(content.html, /Pedido recibido/);
  assert.match(content.html, /Ver ticket y seguir pedido/);
  assert.doesNotMatch(content.html, /Ver ticket y pagar/);
  assert.match(content.text, /Ticket \/ seguimiento/);
});

test('el correo de pago online conserva la acción de pago', () => {
  const content = buildOrderConfirmationEmail(order('tpv'), options);
  assert.match(content.html, /Ver ticket y pagar/);
  assert.match(content.text, /Ticket \/ pago/);
});
