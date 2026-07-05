import { useEffect } from 'react';
import { isBocadoMobileApp } from '../../lib/capacitor-app';

const STOREFRONT_PREFIXES = ['/', '/menu', '/carrito', '/checkout', '/login', '/perfil', '/seccion'];

function isStorefrontPath(path: string) {
  if (path === '/') return true;
  return STOREFRONT_PREFIXES.some((p) => p !== '/' && path.startsWith(p));
}

export default function MobileRouteGuard({
  role,
}: {
  role?: 'admin' | 'courier';
}) {
  useEffect(() => {
    if (!isBocadoMobileApp()) return;

    const home = role === 'admin' ? '/movil/admin' : role === 'courier' ? '/movil/repartidor' : '/movil';
    const path = window.location.pathname;

    if (path.startsWith('/movil')) return;

    if (role === 'admin' && path.startsWith('/admin')) {
      window.location.replace('/movil/admin');
      return;
    }
    if (role === 'courier' && path.startsWith('/repartidor')) {
      window.location.replace('/movil/repartidor');
      return;
    }
    if (isStorefrontPath(path)) {
      window.location.replace(home);
    }
  }, [role]);

  return null;
}
