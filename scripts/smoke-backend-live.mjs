import assert from 'node:assert/strict';

const baseUrl = (process.env.BASE_URL ?? '').replace(/\/$/, '');
const adminEmail = process.env.ADMIN_EMAIL ?? '';
const adminPassword = process.env.ADMIN_PASSWORD ?? '';
const courierEmail = process.env.COURIER_EMAIL ?? '';
const courierPassword = process.env.COURIER_PASSWORD ?? '';

assert.ok(baseUrl.startsWith('https://'), 'BASE_URL debe ser HTTPS');
assert.ok(adminEmail && adminPassword, 'Faltan credenciales de administrador');
assert.ok(courierEmail && courierPassword, 'Faltan credenciales de repartidor');

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

class Session {
  cookie = '';

  async request(path, init = {}) {
    const headers = new Headers(init.headers);
    if (this.cookie) headers.set('cookie', this.cookie);
    if (init.method && !['GET', 'HEAD'].includes(init.method)) {
      headers.set('origin', baseUrl);
      headers.set('sec-fetch-site', 'same-origin');
    }
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      redirect: 'manual',
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) this.cookie = setCookie.split(';', 1)[0];
    await delay(120);
    return response;
  }

  async login(path, email, password) {
    const response = await this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, password, _next: path.replace('/login', '') || '/' }),
    });
    assert.ok([302, 303].includes(response.status), `Login ${path}: ${response.status}`);
    assert.ok(this.cookie, `Login ${path}: falta cookie de sesión`);
  }
}

function jsonInit(method, body) {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

async function expectResponse(response, status, label, contentType) {
  assert.equal(response.status, status, `${label}: HTTP ${response.status}`);
  if (contentType) {
    assert.match(response.headers.get('content-type') ?? '', contentType, `${label}: content-type`);
  }
  assert.match(
    response.headers.get('cache-control') ?? '',
    /no-store|no-cache/,
    `${label}: cache-control`,
  );
  return response;
}

async function expectJson(session, path, status, init) {
  const label = `${init?.method ?? 'GET'} ${path}`;
  const response = await expectResponse(
    await session.request(path, init),
    status,
    label,
    /application\/json/,
  );
  return response.json();
}

const anonymous = new Session();
const admin = new Session();
const courier = new Session();

const health = await expectJson(anonymous, '/api/health', 200);
assert.equal(health.ok, true);
assert.equal(health.mode, 'production');
assert.equal(health.checks?.persistence, 'postgresql');

await admin.login('/admin/login', adminEmail, adminPassword);
await courier.login('/repartidor/login', courierEmail, courierPassword);
assert.equal((await expectJson(admin, '/api/auth/me', 200)).user?.role, 'admin');
assert.equal((await expectJson(courier, '/api/auth/me', 200)).user?.role, 'courier');

for (const path of ['/api/admin/orders', '/api/settings', '/api/dishes', '/api/courier/orders']) {
  await expectJson(anonymous, path, 401);
}
await expectJson(anonymous, '/api/invoices/generate', 401, jsonInit('POST', {}));

await expectJson(anonymous, '/api/newsletter', 400, jsonInit('POST', '{'));
await expectJson(anonymous, '/api/orders', 400, jsonInit('POST', '{'));
await expectJson(admin, '/api/settings', 400, jsonInit('PATCH', '{'));
await expectJson(admin, '/api/admin/alerts', 400, jsonInit('POST', {}));

const crossSite = await fetch(`${baseUrl}/api/newsletter`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: 'https://example.invalid',
    'sec-fetch-site': 'cross-site',
  },
  body: JSON.stringify({ email: 'blocked@example.test' }),
  redirect: 'manual',
});
await expectResponse(crossSite, 403, 'POST /api/newsletter cross-site', /application\/json/);

const catalog = await expectJson(admin, '/api/dishes', 200);
const dish = catalog.dishes.find((candidate) => candidate.is_available);
assert.ok(dish, 'No hay platos disponibles para probar pedidos');

await expectJson(
  admin,
  '/api/dishes',
  400,
  jsonInit('POST', {
    name: 'Referencia inválida',
    restaurant_id: 'restaurant-does-not-exist',
    menu_section_id: catalog.sections[0]?.id,
    price_cents: 1_000,
  }),
);
await expectJson(
  admin,
  `/api/dishes/${dish.id}/images`,
  400,
  jsonInit('PATCH', { images: [dish.images[0], 'javascript:alert(1)'] }),
);
await expectJson(
  admin,
  `/api/dishes/${dish.id}/images`,
  415,
  jsonInit('POST', { image: 'not-a-file' }),
);

const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const customerEmail = `backend-smoke-${unique}@example.test`;
const customerPassword = `Smoke-${unique}-Pass`;
const customer = new Session();
const registration = new FormData();
registration.set('full_name', 'Cliente Backend Smoke');
registration.set('email', customerEmail);
registration.set('phone', '+34600000000');
registration.set('password', customerPassword);
const registered = await customer.request('/registro', { method: 'POST', body: registration });
assert.equal(registered.status, 302, `Registro: HTTP ${registered.status}`);
assert.ok(customer.cookie, 'El registro no creó una sesión');
const customerUser = (await expectJson(customer, '/api/auth/me', 200)).user;
assert.equal(customerUser?.email, customerEmail);

const newsletter = await expectJson(
  anonymous,
  '/api/newsletter',
  201,
  jsonInit('POST', { email: customerEmail }),
);
assert.equal(newsletter.created, true);
assert.equal(
  (await expectJson(
    anonymous,
    '/api/newsletter',
    200,
    jsonInit('POST', { email: customerEmail }),
  )).created,
  false,
);

const orderPayload = {
  customer: {
    full_name: 'Cliente Backend Smoke',
    email: customerEmail,
    phone: '+34600000000',
    tax_id: null,
  },
  delivery_address: {
    street: 'Calle Mayor',
    number: '12',
    floor: null,
    city: 'Madrid',
    postal_code: '28013',
    country: 'España',
    notes: 'Prueba backend temporal',
  },
  items: [{ dish_id: dish.id, quantity: 1 }],
  payment_method: 'cash',
};
const created = await expectJson(customer, '/api/orders', 201, jsonInit('POST', orderPayload));
const orderId = created.order?.id;
const paymentToken = created.payment_token;
const accessToken = created.access_token;
assert.ok(orderId && paymentToken && accessToken, 'El pedido no devolvió identificadores firmados');
assert.ok(created.order.total_cents > 0, 'El total del pedido no fue calculado por el servidor');

await expectJson(
  anonymous,
  '/api/payments/start',
  403,
  jsonInit('POST', { order_id: orderId, payment_token: 'invalid' }),
);
const payment = await expectJson(
  anonymous,
  '/api/payments/start',
  200,
  jsonInit('POST', { order_id: orderId, payment_token: paymentToken }),
);
assert.equal(payment.method, 'cash');

await expectJson(anonymous, `/api/orders/${orderId}?token=invalid`, 403);
await expectJson(anonymous, `/api/orders/${orderId}/tracking?token=invalid`, 403);
await expectJson(anonymous, `/api/orders/${orderId}/ticket-public?token=invalid`, 403);

const tokenQuery = `token=${encodeURIComponent(accessToken)}`;
assert.equal(
  (await expectJson(anonymous, `/api/orders/${orderId}?${tokenQuery}`, 200)).order.id,
  orderId,
);
assert.equal(
  (await expectJson(anonymous, `/api/orders/${orderId}/tracking?${tokenQuery}`, 200)).order.id,
  orderId,
);
assert.equal(
  (await expectJson(anonymous, `/api/orders/${orderId}/ticket-public?${tokenQuery}`, 200)).order.number,
  created.order.number,
);
assert.ok(
  (await expectJson(customer, '/api/orders', 200)).orders.some((order) => order.id === orderId),
  'El pedido no aparece en la cuenta del cliente',
);

await expectJson(
  admin,
  `/api/orders/${orderId}/status`,
  200,
  jsonInit('PATCH', { status: 'confirmed' }),
);
await expectJson(
  admin,
  `/api/orders/${orderId}/status`,
  409,
  jsonInit('PATCH', { status: 'delivered' }),
);
const generated = await expectJson(
  admin,
  '/api/invoices/generate',
  200,
  jsonInit('POST', { order_id: orderId }),
);
const invoiceId = generated.invoice?.id;
assert.ok(invoiceId, 'No se generó la factura');
assert.equal(
  (await expectJson(
    admin,
    '/api/invoices/generate',
    200,
    jsonInit('POST', { order_id: orderId }),
  )).invoice.id,
  invoiceId,
  'La factura no es idempotente',
);

await expectResponse(
  await anonymous.request(`/api/invoices/${invoiceId}.pdf`),
  403,
  'GET factura sin token',
);
const invoicePdf = await expectResponse(
  await anonymous.request(`/api/invoices/${invoiceId}.pdf?${tokenQuery}`),
  200,
  'GET factura con token',
  /application\/pdf/,
);
assert.ok((await invoicePdf.arrayBuffer()).byteLength > 1_000, 'La factura PDF está vacía');

for (const status of ['preparing', 'delivering']) {
  await expectJson(
    admin,
    `/api/orders/${orderId}/status`,
    200,
    jsonInit('PATCH', { status }),
  );
}

const available = await expectJson(courier, '/api/courier/orders', 200);
assert.ok(available.available.some((order) => order.id === orderId), 'El pedido no llegó al reparto');
await expectJson(courier, `/api/courier/orders/${orderId}/accept`, 200, { method: 'PATCH' });
await expectJson(
  courier,
  '/api/courier/location',
  400,
  jsonInit('PATCH', { lat: 100, lng: 0, active_order_id: orderId }),
);
await expectJson(
  courier,
  '/api/courier/location',
  200,
  jsonInit('PATCH', {
    lat: 40.4168,
    lng: -3.7038,
    accuracy_m: 10,
    active_order_id: orderId,
  }),
);
await expectJson(courier, `/api/courier/orders/${orderId}/deliver`, 200, { method: 'PATCH' });
await expectJson(courier, `/api/courier/orders/${orderId}/deliver`, 400, { method: 'PATCH' });

const completed = (await expectJson(admin, '/api/admin/orders', 200)).orders.find(
  (order) => order.id === orderId,
);
assert.equal(completed?.status, 'delivered');
assert.equal(completed?.payment_status, 'paid');
assert.equal(completed?.invoice_id, invoiceId);
assert.equal(
  (await expectJson(anonymous, `/api/orders/${orderId}/ticket-public?${tokenQuery}`, 200)).payment.kind,
  'paid',
);

const alerts = await expectJson(admin, '/api/admin/alerts', 200);
const orderAlertIds = alerts.alerts
  .filter((alert) => alert.order_id === orderId)
  .map((alert) => alert.id);
if (orderAlertIds.length) {
  await expectJson(admin, '/api/admin/alerts', 200, jsonInit('POST', { ids: orderAlertIds }));
}

const streamController = new AbortController();
const stream = await admin.request('/api/events/orders', { signal: streamController.signal });
await expectResponse(stream, 200, 'GET /api/events/orders', /text\/event-stream/);
streamController.abort();
await stream.body?.cancel().catch(() => undefined);
assert.equal((await expectJson(anonymous, '/api/health', 200)).ok, true);

await expectJson(admin, `/api/users/${customerUser.id}`, 200, { method: 'DELETE' });
const logout = await customer.request('/api/auth/logout', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ next: '/' }),
});
assert.ok([302, 303].includes(logout.status), `Logout: HTTP ${logout.status}`);
assert.match(logout.headers.get('cache-control') ?? '', /no-store/, 'Logout: cache-control');

console.log(
  JSON.stringify({
    ok: true,
    order_id: orderId,
    invoice_id: invoiceId,
    test_email: customerEmail,
    customer_deleted: true,
  }),
);
