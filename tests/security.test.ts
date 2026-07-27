import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveUnderRoot,
  safeRedirectPath,
  sanitizeDishImageUrl,
} from '../apps/web/src/server/security.ts';
import {
  createOrderAccessToken,
  verifyOrderAccessToken,
} from '../apps/web/src/server/order-tokens.ts';

process.env.SESSION_SECRET = 'test-session-secret-that-is-long-enough';
process.env.ORDER_TOKEN_SECRET = 'test-order-secret-that-is-distinct-and-long';

test('los redirects solo aceptan rutas internas', () => {
  assert.equal(safeRedirectPath('/perfil?tab=pedidos'), '/perfil?tab=pedidos');
  assert.equal(safeRedirectPath('//evil.example', '/'), '/');
  assert.equal(safeRedirectPath('https://evil.example', '/'), '/');
  assert.equal(safeRedirectPath('/\\evil.example', '/'), '/');
});

test('los tokens de acceso quedan ligados al pedido', () => {
  const token = createOrderAccessToken('order-a');
  assert.equal(verifyOrderAccessToken('order-a', token), true);
  assert.equal(verifyOrderAccessToken('order-b', token), false);
  assert.equal(verifyOrderAccessToken('order-a', `${token}x`), false);
});

test('las rutas y las imágenes bloquean escapes y protocolos inseguros', () => {
  assert.equal(resolveUnderRoot('/srv/assets', '../secret'), null);
  assert.equal(resolveUnderRoot('/srv/assets', 'menu/item.png'), '/srv/assets/menu/item.png');
  assert.equal(sanitizeDishImageUrl('http://example.com/image.jpg'), null);
  assert.equal(sanitizeDishImageUrl('/carta/item.jpg'), '/carta/item.jpg');
});
