import { createHmac, timingSafeEqual } from 'node:crypto';
import { getSessionSecretRaw } from './security.js';

type TokenScope = 'pay' | 'access';

const TTL: Record<TokenScope, number> = {
  pay: 60 * 60,
  access: 60 * 60 * 24 * 7,
};

function signToken(scope: TokenScope, orderId: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL[scope];
  const payload = `${scope}:${orderId}.${exp}`;
  const sig = createHmac('sha256', getSessionSecretRaw()).update(payload).digest('base64url');
  return `${exp}.${sig}`;
}

function verifyToken(scope: TokenScope, orderId: string, token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac('sha256', getSessionSecretRaw())
    .update(`${scope}:${orderId}.${expStr}`)
    .digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function createOrderPaymentToken(orderId: string): string {
  return signToken('pay', orderId);
}

export function verifyOrderPaymentToken(orderId: string, token: string | undefined): boolean {
  return verifyToken('pay', orderId, token);
}

export function createOrderAccessToken(orderId: string): string {
  return signToken('access', orderId);
}

export function verifyOrderAccessToken(orderId: string, token: string | undefined): boolean {
  return verifyToken('access', orderId, token);
}
