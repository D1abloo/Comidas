import { defineMiddleware } from 'astro:middleware';
import { clearSession, getSessionFromCookies } from './server/auth.js';
import { getStore } from './server/db.js';
import { isDatabaseEnabled } from './server/env.js';
import { pgFindUserById } from './server/orders-db.js';
import { assertProductionSecrets, isAdminRegistrationAllowed } from './server/security.js';
import { ensureOperationalStateHydrated } from './server/store-persistence.js';
import type { Role } from './server/types.js';

export const onRequest = defineMiddleware(async (context, next) => {
  assertProductionSecrets();
  const store = getStore();
  await ensureOperationalStateHydrated(store);
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
      };
    }
  }

  const path = context.url.pathname;
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
  return response;
});
