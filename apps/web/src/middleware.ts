import { defineMiddleware } from 'astro:middleware';
import { getSessionFromCookies } from './server/auth.js';
import { getStore } from './server/db.js';
import { ensureOperationalStateHydrated } from './server/store-persistence.js';

export const onRequest = defineMiddleware(async (context, next) => {
  const store = getStore();
  await ensureOperationalStateHydrated(store);
  context.locals.user = await getSessionFromCookies(context.cookies);

  // Proteger rutas /admin y /perfil
  const path = context.url.pathname;
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
  return next();
});
