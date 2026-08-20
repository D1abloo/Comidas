import assert from 'node:assert/strict';
import test from 'node:test';
import { SignJWT, jwtVerify } from 'jose';

// Lightweight mirror of oauth state contract (no app boot / env needed).
const secret = new TextEncoder().encode('test-secret-for-google-oauth-state-32b');

test('google oauth state round-trip keeps next path', async () => {
  const token = await new SignJWT({ next: '/perfil' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('bocado-google-oauth')
    .setAudience('bocado-google-state')
    .setExpirationTime('10m')
    .sign(secret);
  const { payload } = await jwtVerify(token, secret, {
    issuer: 'bocado-google-oauth',
    audience: 'bocado-google-state',
  });
  assert.equal(payload.next, '/perfil');
});
