import { defineMiddleware } from 'astro:middleware';
import { clearSession, getSessionFromCookies } from './server/auth.js';
import { getStore } from './server/db.js';
import { isDatabaseEnabled } from './server/env.js';
import { pgFindUserById } from './server/orders-db.js';
import { assertProductionSecrets, isAdminRegistrationAllowed } from './server/security.js';
import { ensureOperationalStateHydrated } from './server/store-persistence.js';
import type { Role } from './server/types.js';
import { checkRateLimit, requestClientKey } from './server/rate-limit.js';
import { pgLoadCompanyConfig } from './server/company-config-db.js';
import { hydrateCatalog } from './server/store-service.js';

let databaseHydration: Promise<void> | null = null;

export const onRequest = defineMiddleware(async (context, next) => {
  assertProductionSecrets();
  const path = context.url.pathname;
  const method = context.request.method;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const fetchSite = context.request.headers.get('sec-fetch-site');
    const origin = context.request.headers.get('origin');
    if (fetchSite === 'cross-site' || (origin && origin !== context.url.origin)) {
      return new Response(
        path.startsWith('/api/') ? JSON.stringify({ error: 'cross_site_request' }) : 'Solicitud no permitida.',
        {
          status: 403,
          headers: {
            'content-type': path.startsWith('/api/')
              ? 'application/json'
              : 'text/plain; charset=utf-8',
          },
        },
      );
    }
  }
  const store = getStore();
  await ensureOperationalStateHydrated(store);
  if (isDatabaseEnabled()) {
    databaseHydration ??= (async () => {
      const config = await pgLoadCompanyConfig();
      if (config.company) store.company = config.company;
      if (config.settings) store.settings = { ...store.settings, ...config.settings };
      await hydrateCatalog(store);
    })().catch((error) => {
      databaseHydration = null;
      throw error;
    });
    await databaseHydration;
  }
  context.locals.user = await getSessionFromCookies(context.cookies);

  if (context.locals.user && isDatabaseEnabled()) {
    const row = await pgFindUserById(context.locals.user.id);
    if (!row) {
      clearSession(context.cookies);
      context.locals.user = null;
    } else {
      context.locals.user = {
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role as Role,
        phone: row.phone ?? undefined,
      };
    }
  }

  if (context.request.method === 'POST') {
    const isLogin = ['/login', '/admin/login', '/repartidor/login', '/movil'].includes(path);
    const isRegistration = ['/registro', '/admin/registro'].includes(path);
    const isOrder = path === '/api/orders';
    const isPayment = path.startsWith('/api/payments/');
    if (isLogin || isRegistration || isOrder || isPayment) {
      const scope = isLogin ? 'login' : isRegistration ? 'registration' : isOrder ? 'order' : 'payment';
      const limit = isLogin ? 10 : isRegistration ? 5 : isOrder ? 20 : 30;
      const result = checkRateLimit(
        `${scope}:${requestClientKey(context.request)}`,
        limit,
        isLogin || isRegistration ? 15 * 60_000 : 60_000,
      );
      if (!result.allowed) {
        return new Response(
          path.startsWith('/api/') ? JSON.stringify({ error: 'rate_limited' }) : 'Demasiados intentos. Prueba más tarde.',
          {
            status: 429,
            headers: {
              'content-type': path.startsWith('/api/') ? 'application/json' : 'text/plain; charset=utf-8',
              'retry-after': String(result.retryAfterSeconds),
            },
          },
        );
      }
    }
  }
  if (path === '/admin/registro' && !isAdminRegistrationAllowed()) {
    return context.redirect('/admin/login');
  }
  if (path.startsWith('/admin') && !['/admin/login', '/admin/registro'].includes(path)) {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
      return context.redirect('/admin/login?next=' + encodeURIComponent(path));
    }
  }
  if (path.startsWith('/repartidor') && path !== '/repartidor/login') {
    if (!context.locals.user || context.locals.user.role !== 'courier') {
      return context.redirect('/repartidor/login?next=' + encodeURIComponent(path));
    }
  }
  if (path.startsWith('/movil/admin')) {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
      return context.redirect('/movil');
    }
  }
  if (path.startsWith('/movil/repartidor')) {
    if (!context.locals.user || context.locals.user.role !== 'courier') {
      return context.redirect('/movil');
    }
  }
  if (path.startsWith('/perfil')) {
    if (!context.locals.user) {
      return context.redirect('/login?next=' + encodeURIComponent(path));
    }
  }

  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; worker-src 'self' blob:; manifest-src 'self'",
  );
  return response;
});
