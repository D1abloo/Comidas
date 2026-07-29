import { useEffect } from 'react'
import { isBocadoMobileApp } from '../../lib/capacitor-app'

/** Rutas de tienda que no deben usarse en la app nativa de equipo. */
const STOREFRONT_PREFIXES = [
  '/menu',
  '/carrito',
  '/checkout',
  '/login',
  '/registro',
  '/perfil',
  '/buscar',
  '/carta',
  '/platos',
  '/restaurantes',
]

function isStorefrontPath(path: string) {
  if (path === '/') return true
  return STOREFRONT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export default function MobileRouteGuard({
  role,
}: {
  role?: 'admin' | 'courier'
}) {
  useEffect(() => {
    if (!isBocadoMobileApp()) return

    const path = window.location.pathname

    // Admin nativo = mismo panel web completo
    if (role === 'admin') {
      if (path.startsWith('/admin') || path === '/movil') return
      if (path.startsWith('/movil/admin')) {
        window.location.replace('/admin')
        return
      }
      if (isStorefrontPath(path)) {
        window.location.replace('/admin')
      }
      return
    }

    if (role === 'courier') {
      if (path.startsWith('/movil/repartidor') || path.startsWith('/repartidor')) return
      if (isStorefrontPath(path) || path.startsWith('/admin')) {
        window.location.replace('/movil/repartidor')
      }
    }
  }, [role])

  return null
}
