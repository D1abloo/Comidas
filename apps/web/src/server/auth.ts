import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { getStore } from './db.js';
import { isDatabaseEnabled } from './env.js';
import { pgFindUserByEmail, pgInsertUser } from './orders-db.js';
import { getSessionSecretBytes } from './security.js';
import type { Role, User } from './types.js';
import { persistOperationalState } from './store-persistence.js';
const COOKIE = 'bocado_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días
const ISSUER = 'bocado-web';
const AUDIENCE = 'bocado-session';

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone?: string;
}

export async function signSession(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(user.role === 'customer' ? '7d' : '12h')
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setJti(randomUUID())
    .sign(getSessionSecretBytes());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecretBytes(), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!['admin', 'customer', 'courier'].includes(String(payload.role))) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      full_name: String(payload.full_name),
      role: payload.role as Role,
      phone: typeof payload.phone === 'string' ? payload.phone : undefined,
    };
  } catch {
    return null;
  }
}

function isSecureRequest(request?: Request): boolean {
  if (!request) return process.env.NODE_ENV === 'production';
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (proto) return proto === 'https';
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

export async function setSession(cookies: AstroCookies, user: SessionUser, request?: Request) {
  const token = await signSession(user);
  cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSession(cookies: AstroCookies) {
  cookies.delete(COOKIE, { path: '/' });
}

export async function getSessionFromCookies(cookies: AstroCookies): Promise<SessionUser | null> {
  const token = cookies.get(COOKIE)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export function getSessionFromRequest(req: Request): Promise<SessionUser | null> {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!match) return Promise.resolve(null);
  const token = decodeURIComponent(match.slice(COOKIE.length + 1));
  return verifySession(token);
}

export async function registerUser(input: {
  email: string;
  password: string;
  full_name: string;
  role: Role;
  phone?: string;
  tax_id?: string | null;
}): Promise<User> {
  const store = getStore();
  const email = input.email.toLowerCase().trim();
  const fullName = input.full_name.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Introduce un email válido.');
  }
  if (fullName.length < 2 || fullName.length > 100) {
    throw new Error('Introduce un nombre válido.');
  }
  if (
    store.users.some((u) => u.email === email) ||
    (isDatabaseEnabled() && (await pgFindUserByEmail(email)))
  ) {
    throw new Error('Ya existe una cuenta con ese email.');
  }
  if (input.password.length < 10 || input.password.length > 128) {
    throw new Error('La contraseña debe tener entre 10 y 128 caracteres.');
  }
  const user: User = {
    id: randomUUID(),
    email,
    full_name: fullName,
    role: input.role,
    phone: input.phone,
    tax_id: input.tax_id ?? null,
    password_hash: await bcrypt.hash(input.password, 12),
    created_at: new Date().toISOString(),
  };
  if (isDatabaseEnabled()) {
    await pgInsertUser(user);
  } else {
    store.users.push(user);
    await persistOperationalState(store);
  }
  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  if (isDatabaseEnabled()) {
    const row = await pgFindUserByEmail(email);
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      throw new Error('Email o contraseña incorrectos.');
    }
    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: row.role as Role,
      phone: row.phone ?? undefined,
      tax_id: row.tax_id,
      password_hash: row.password_hash,
      created_at: row.created_at,
    };
  }
  const store = getStore();
  const user = store.users.find((u) => u.email === email.toLowerCase().trim());
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error('Email o contraseña incorrectos.');
  }
  return user;
}

export function requireAdmin(user: SessionUser | null): asserts user is SessionUser {
  if (!user || user.role !== 'admin') {
    throw new Response('No autorizado', { status: 401 });
  }
}
