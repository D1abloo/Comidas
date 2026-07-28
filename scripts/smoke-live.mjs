const base = (process.env.BASE ?? 'http://127.0.0.1:4321').replace(/\/$/, '');

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, init = {}, expected = 200) {
  const headers = new Headers(init.headers);
  if (init.method && init.method !== 'GET' && init.method !== 'HEAD') {
    headers.set('origin', base);
    headers.set('sec-fetch-site', 'same-origin');
  }
  const response = await fetch(`${base}${path}`, { redirect: 'manual', ...init, headers });
  ensure(
    response.status === expected,
    `${init.method ?? 'GET'} ${path}: HTTP ${response.status}, esperado ${expected}`,
  );
  return response;
}

async function json(path, init = {}, expected = 200) {
  const response = await request(path, init, expected);
  return { response, data: await response.json() };
}

for (const route of ['/', '/restaurantes', '/ayuda', '/buscar?q=pizza', '/checkout', '/login', '/registro', '/pedidos']) {
  await request(route);
}

const home = await (await request('/')).text();
ensure(home.includes('aria-roledescription="carrusel"'), 'El carrusel principal no se renderiza');
ensure(!home.toLowerCase().includes('delivery premium · madrid'), 'El kicker eliminado sigue presente');

const health = await json('/api/health');
ensure(health.data.ok === true && health.data.checks?.configuration === true, 'Health/configuración inválido');

const pdf = await request('/api/carta.pdf');
ensure(pdf.headers.get('content-type')?.includes('application/pdf'), 'La carta no devuelve PDF');
ensure((await pdf.arrayBuffer()).byteLength > 1_000, 'La carta PDF está vacía');

await json('/api/admin/orders', {}, 401);
await json('/api/newsletter', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'incorrecto' }),
}, 400);

const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const email = `smoke-${unique}@example.test`;
const newsletter = await json('/api/newsletter', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email }),
}, 201);
ensure(newsletter.data.subscribed === true, 'La newsletter no confirmó la suscripción');
const duplicateNewsletter = await json('/api/newsletter', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email }),
});
ensure(duplicateNewsletter.data.created === false, 'La suscripción no es idempotente');

const registration = new FormData();
registration.set('full_name', 'Cliente Smoke');
registration.set('email', email);
registration.set('phone', '+34600000000');
registration.set('password', `Smoke-${unique}-Pass`);
const registered = await request('/registro', { method: 'POST', body: registration }, 302);
const session = registered.headers.get('set-cookie')?.split(';', 1)[0];
ensure(session?.startsWith('bocado_session='), 'El registro no creó una sesión');

const me = await json('/api/auth/me', { headers: { cookie: session } });
ensure(me.data.user?.email === email, 'La sesión del cliente no es válida');

await json('/api/orders', {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie: session },
  body: JSON.stringify({ items: [] }),
}, 400);

const orderPayload = {
  customer: {
    full_name: 'Cliente Smoke',
    email,
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
    notes: 'Prueba automatizada aislada',
  },
  items: [{ dish_id: 'd-ramen', quantity: 1 }],
  payment_method: 'cash',
};
const created = await json('/api/orders', {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie: session },
  body: JSON.stringify(orderPayload),
}, 201);
ensure(created.data.order?.total_cents > 0, 'El backend no calculó el total del pedido');
ensure(created.data.payment_token && created.data.access_token, 'El pedido no devolvió tokens de acceso');

const payment = await json('/api/payments/start', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    order_id: created.data.order.id,
    payment_token: created.data.payment_token,
  }),
});
ensure(payment.data.method === 'cash', 'El pago en efectivo no se inició');

const tracked = await json(`/api/orders/${created.data.order.id}?token=${encodeURIComponent(created.data.access_token)}`);
ensure(tracked.data.order?.id === created.data.order.id, 'El seguimiento privado no devuelve el pedido');

console.log(`Smoke live OK — ${base}`);
