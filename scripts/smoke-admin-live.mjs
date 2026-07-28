import assert from 'node:assert/strict';

const baseUrl = (process.env.BASE_URL ?? '').replace(/\/$/, '');
const adminEmail = process.env.ADMIN_EMAIL ?? '';
const adminPassword = process.env.ADMIN_PASSWORD ?? '';
const courierEmail = process.env.COURIER_EMAIL ?? '';
const courierPassword = process.env.COURIER_PASSWORD ?? '';
const testOrderId = process.env.TEST_ORDER_ID ?? '';

assert.ok(baseUrl.startsWith('https://'), 'BASE_URL debe ser HTTPS');
assert.ok(adminEmail && adminPassword, 'Faltan ADMIN_EMAIL o ADMIN_PASSWORD');

class Session {
  cookie = '';

  async request(path, init = {}) {
    const headers = new Headers(init.headers);
    if (this.cookie) headers.set('cookie', this.cookie);
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      redirect: 'manual',
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) this.cookie = setCookie.split(';', 1)[0];
    return response;
  }

  async login(path, email, password) {
    const response = await this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, password, _next: path.replace('/login', '') || '/' }),
    });
    assert.ok([302, 303].includes(response.status), `Login ${path}: ${response.status}`);
    assert.ok(this.cookie, `Login ${path}: no se recibió cookie`);
  }
}

async function json(response, expected, label) {
  assert.equal(response.status, expected, `${label}: HTTP ${response.status}`);
  return response.json();
}

async function jsonRequest(session, path, expected, init) {
  return json(await session.request(path, init), expected, `${init?.method ?? 'GET'} ${path}`);
}

function jsonInit(method, body) {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

const admin = new Session();
await admin.login('/admin/login', adminEmail, adminPassword);

const me = await jsonRequest(admin, '/api/auth/me', 200);
assert.equal(me.user?.role, 'admin');

const adminRoutes = [
  '/admin',
  '/admin/pedidos',
  '/admin/platos',
  '/admin/secciones',
  '/admin/imagenes',
  '/admin/pagos',
  '/admin/facturas',
  '/admin/avisos',
  '/admin/repartidores',
  '/admin/usuarios',
  '/admin/ajustes',
  '/admin/impresion',
];
for (const path of adminRoutes) {
  const response = await admin.request(path);
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/);
}

for (const path of [
  '/api/admin/orders',
  '/api/admin/alerts',
  '/api/admin/courier-locations',
  '/api/settings',
  '/api/sections',
  '/api/dishes',
]) {
  await jsonRequest(admin, path, 200);
}

await jsonRequest(
  admin,
  `/api/users/${encodeURIComponent(me.user.id)}/role`,
  400,
  jsonInit('PATCH', { role: 'customer' }),
);
await jsonRequest(admin, `/api/users/${encodeURIComponent(me.user.id)}`, 400, { method: 'DELETE' });
await jsonRequest(admin, '/api/payments/bizum-qr', 503, jsonInit('POST', { amount_cents: 100 }));

const settings = await jsonRequest(admin, '/api/settings', 200);
await jsonRequest(
  admin,
  '/api/settings',
  200,
  jsonInit('PATCH', { company: settings.company, settings: settings.settings }),
);

const suffix = Date.now().toString(36);
const createdSection = await jsonRequest(
  admin,
  '/api/sections',
  201,
  jsonInit('POST', {
    title: `Prueba VPS ${suffix}`,
    description: 'Validación automática temporal',
    emoji: '✓',
    sort_order: 999,
    is_active: false,
  }),
);
await jsonRequest(
  admin,
  '/api/sections',
  200,
  jsonInit('POST', { ...createdSection.section, title: `Prueba VPS ${suffix} validada` }),
);
await jsonRequest(admin, `/api/sections/${createdSection.section.id}`, 200, { method: 'DELETE' });
await jsonRequest(admin, `/api/sections/${createdSection.section.id}`, 404, { method: 'DELETE' });

const catalog = await jsonRequest(admin, '/api/dishes', 200);
const dish = catalog.dishes.find((candidate) => candidate.is_available) ?? catalog.dishes[0];
assert.ok(dish, 'El catálogo no contiene platos');

await jsonRequest(
  admin,
  `/api/dishes/${dish.id}/availability`,
  200,
  jsonInit('PATCH', { available: !dish.is_available }),
);
await jsonRequest(
  admin,
  `/api/dishes/${dish.id}/availability`,
  200,
  jsonInit('PATCH', { available: dish.is_available }),
);

const duplicate = await jsonRequest(admin, `/api/dishes/${dish.id}/duplicate`, 201, { method: 'POST' });
await jsonRequest(admin, `/api/dishes/${duplicate.dish.id}`, 200, { method: 'DELETE' });

const png = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
    'base64',
  ),
);
const form = new FormData();
form.set('image', new Blob([png], { type: 'image/png' }), 'smoke.png');
const uploaded = await jsonRequest(admin, `/api/dishes/${dish.id}/images`, 201, {
  method: 'POST',
  body: form,
});
const uploadedUrl = uploaded.dish.images[0];
const uploadedResponse = await admin.request(uploadedUrl);
assert.equal(uploadedResponse.status, 200, `Archivo subido: HTTP ${uploadedResponse.status}`);
await jsonRequest(
  admin,
  `/api/dishes/${dish.id}/images`,
  200,
  jsonInit('PATCH', { images: dish.images }),
);
assert.equal((await admin.request(uploadedUrl)).status, 404, 'La subida temporal no se eliminó');

const streamController = new AbortController();
const streamTimer = setTimeout(() => streamController.abort(), 3_000);
const stream = await admin.request('/api/events/orders', { signal: streamController.signal });
clearTimeout(streamTimer);
assert.equal(stream.status, 200, `SSE: HTTP ${stream.status}`);
assert.match(stream.headers.get('content-type') ?? '', /text\/event-stream/);
await stream.body?.cancel();

if (testOrderId) {
  assert.ok(courierEmail && courierPassword, 'Faltan credenciales del repartidor');
  await jsonRequest(
    admin,
    `/api/orders/${testOrderId}/status`,
    200,
    jsonInit('PATCH', { status: 'confirmed' }),
  );
  await jsonRequest(
    admin,
    `/api/orders/${testOrderId}/status`,
    409,
    jsonInit('PATCH', { status: 'delivered' }),
  );
  await jsonRequest(
    admin,
    `/api/orders/${testOrderId}/status`,
    200,
    jsonInit('PATCH', { status: 'preparing' }),
  );
  await jsonRequest(
    admin,
    `/api/orders/${testOrderId}/status`,
    200,
    jsonInit('PATCH', { status: 'delivering' }),
  );

  const courier = new Session();
  await courier.login('/repartidor/login', courierEmail, courierPassword);
  await jsonRequest(courier, '/api/courier/orders', 200);
  await jsonRequest(courier, `/api/courier/orders/${testOrderId}/accept`, 200, { method: 'PATCH' });
  await jsonRequest(
    courier,
    '/api/courier/location',
    200,
    jsonInit('PATCH', {
      lat: 40.4168,
      lng: -3.7038,
      accuracy_m: 10,
      active_order_id: testOrderId,
    }),
  );
  await jsonRequest(courier, `/api/courier/orders/${testOrderId}/deliver`, 200, { method: 'PATCH' });

  const orders = await jsonRequest(admin, '/api/admin/orders', 200);
  const completed = orders.orders.find((order) => order.id === testOrderId);
  assert.equal(completed?.status, 'delivered');
  assert.equal(completed?.payment_status, 'paid');
  assert.ok(completed?.invoice_id, 'El pedido entregado no tiene factura');

  const pdf = await admin.request(`/api/invoices/${completed.invoice_id}.pdf`);
  assert.equal(pdf.status, 200, `PDF: HTTP ${pdf.status}`);
  assert.match(pdf.headers.get('content-type') ?? '', /application\/pdf/);

  const ticket = await jsonRequest(admin, `/api/orders/${testOrderId}/ticket`, 200);
  assert.equal(ticket.payment.kind, 'paid');
}

const anonymous = new Session();
const adminRedirect = await anonymous.request('/admin');
assert.equal(adminRedirect.status, 302);
assert.match(adminRedirect.headers.get('cache-control') ?? '', /no-store/);
await jsonRequest(anonymous, '/api/admin/orders', 401);

console.log(
  JSON.stringify({
    ok: true,
    admin_routes: adminRoutes.length,
    catalog_operations: 7,
    order_lifecycle: Boolean(testOrderId),
  }),
);
