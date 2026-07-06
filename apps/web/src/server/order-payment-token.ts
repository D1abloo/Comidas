import { createHmac, timingSafeEqual } from 'node:crypto';
import { getSessionSecretRaw } from './security.js';

const TTL_SEC = 60 * 60;

export function createOrderPaymentToken(orderId: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const payload = `${orderId}.${exp}`;
  const sig = createHmac('sha256', getSessionSecretRaw()).update(payload).digest('base64url');
  return `${exp}.${sig}`;
}

export function verifyOrderPaymentToken(orderId: string, token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac('sha256', getSessionSecretRaw())
    .update(`${orderId}.${expStr}`)
    .digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
