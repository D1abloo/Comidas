import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { getAppUrl, isDatabaseEnabled, readEnv } from './env.js';
import { getStore } from './db.js';
import { pgFindUserByEmail, pgInsertUser } from './orders-db.js';
import { getSessionSecretBytes, safeRedirectPath } from './security.js';
import { persistOperationalState } from './store-persistence.js';
import type { User } from './types.js';

const STATE_ISSUER = 'bocado-google-oauth';
const STATE_AUDIENCE = 'bocado-google-state';

export function getGoogleOAuthConfig() {
  const clientId = readEnv('GOOGLE_CLIENT_ID')?.trim() ?? '';
  const clientSecret = readEnv('GOOGLE_CLIENT_SECRET')?.trim() ?? '';
  const redirectUri = `${getAppUrl().replace(/\/$/, '')}/api/auth/google/callback`;
  return { clientId, clientSecret, redirectUri, enabled: Boolean(clientId && clientSecret) };
}

export async function createGoogleOAuthState(next: string): Promise<string> {
  return await new SignJWT({ next: safeRedirectPath(next, '/perfil') })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(STATE_ISSUER)
    .setAudience(STATE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('10m')
    .setJti(randomUUID())
    .sign(getSessionSecretBytes());
}

export async function verifyGoogleOAuthState(state: string): Promise<string> {
  const { payload } = await jwtVerify(state, getSessionSecretBytes(), {
    algorithms: ['HS256'],
    issuer: STATE_ISSUER,
    audience: STATE_AUDIENCE,
  });
  return safeRedirectPath(typeof payload.next === 'string' ? payload.next : '/perfil', '/perfil');
}

export function buildGoogleAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  given_name?: string;
};

export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || 'No se pudo completar el acceso con Google.');
  }
  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!infoRes.ok) throw new Error('No se pudo leer el perfil de Google.');
  return (await infoRes.json()) as GoogleUserInfo;
}

export async function upsertGoogleUser(info: GoogleUserInfo): Promise<User> {
  const email = String(info.email ?? '')
    .toLowerCase()
    .trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Google no devolvió un email válido.');
  }
  const verified = info.email_verified === true || info.email_verified === 'true';
  if (!verified) throw new Error('Verifica tu email en Google e inténtalo de nuevo.');

  const fullName = String(info.name || info.given_name || email.split('@')[0] || 'Cliente').trim().slice(0, 100);

  if (isDatabaseEnabled()) {
    const existing = await pgFindUserByEmail(email);
    if (existing) {
      return {
        id: existing.id,
        email: existing.email,
        full_name: existing.full_name,
        role: existing.role as User['role'],
        phone: existing.phone ?? undefined,
        tax_id: existing.tax_id,
        password_hash: existing.password_hash,
        created_at: existing.created_at,
      };
    }
    const user: User = {
      id: randomUUID(),
      email,
      full_name: fullName,
      role: 'customer',
      phone: undefined,
      tax_id: null,
      // ponytail: OAuth users have no password; random hash blocks password login until they register one
      password_hash: await bcrypt.hash(randomUUID(), 12),
      created_at: new Date().toISOString(),
    };
    await pgInsertUser(user);
    return user;
  }

  const store = getStore();
  const existing = store.users.find((u) => u.email === email);
  if (existing) return existing;
  const user: User = {
    id: randomUUID(),
    email,
    full_name: fullName,
    role: 'customer',
    phone: undefined,
    tax_id: null,
    password_hash: await bcrypt.hash(randomUUID(), 12),
    created_at: new Date().toISOString(),
  };
  store.users.push(user);
  await persistOperationalState(store);
  return user;
}
