import { defineMiddleware } from 'astro:middleware';
import { getSessionFromCookies } from './server/auth.js';
import { getStore } from './server/db.js';

export const onRequest = defineMiddleware(async (context, next) => {
  getStore(); // garantiza inicialización del seed en el primer request
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
  if (path.startsWith('/perfil')) {
    if (!context.locals.user) {
      return context.redirect('/login?next=' + encodeURIComponent(path));
    }
  }
  return next();
});
