export interface AdminNavItem {
  href: string;
  label: string;
  emoji: string;
  match: string;
  exact?: boolean;
  description?: string;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Resumen',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        emoji: '📊',
        match: '/admin',
        exact: true,
        description: 'Métricas y actividad del día',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operaciones',
    items: [
      { href: '/admin/pedidos', label: 'Pedidos', emoji: '🛵', match: '/admin/pedidos', description: 'Cola, estados y pagos' },
      { href: '/admin/impresion', label: 'Impresión', emoji: '🖨️', match: '/admin/impresion', description: 'Tickets y impresora térmica' },
      { href: '/admin/avisos', label: 'Avisos', emoji: '🔔', match: '/admin/avisos', description: 'Alertas de pedidos nuevos' },
    ],
  },
  {
    id: 'catalog',
    label: 'Catálogo',
    items: [
      { href: '/admin/secciones', label: 'Secciones', emoji: '📑', match: '/admin/secciones', description: 'Bloques del menú en home' },
      { href: '/admin/platos', label: 'Platos', emoji: '🍽️', match: '/admin/platos', description: 'Precios, stock y alérgenos' },
      { href: '/admin/imagenes', label: 'Imágenes', emoji: '🖼️', match: '/admin/imagenes', description: 'Fotos de la carta' },
    ],
  },
  {
    id: 'finance',
    label: 'Finanzas',
    items: [
      { href: '/admin/pagos', label: 'Pagos & QR', emoji: '💳', match: '/admin/pagos', description: 'Bizum, TPV y códigos QR' },
      { href: '/admin/facturas', label: 'Facturas', emoji: '🧾', match: '/admin/facturas', description: 'Historial y exportación' },
    ],
  },
  {
    id: 'system',
    label: 'Sistema',
    items: [
      { href: '/admin/usuarios', label: 'Usuarios', emoji: '👥', match: '/admin/usuarios', description: 'Clientes y equipo admin' },
      { href: '/admin/ajustes', label: 'Ajustes', emoji: '⚙️', match: '/admin/ajustes', description: 'Envío, tienda y email' },
    ],
  },
];

export const ADMIN_NAV_FLAT = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export function isAdminNavActive(item: AdminNavItem, path: string) {
  return item.exact ? path === item.match : path === item.match || path.startsWith(item.match + '/');
}

export function adminPageMeta(path: string): { title: string; crumb: string } {
  const item = ADMIN_NAV_FLAT.find((n) => isAdminNavActive(n, path));
  if (!item) return { title: 'Admin', crumb: 'Inicio' };
  const group = ADMIN_NAV_GROUPS.find((g) => g.items.some((i) => i.href === item.href));
  const crumb = group && group.id !== 'overview' ? `Inicio / ${group.label} / ${item.label}` : `Inicio / ${item.label}`;
  return { title: item.label, crumb };
}
