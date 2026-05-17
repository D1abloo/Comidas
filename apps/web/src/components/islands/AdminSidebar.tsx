interface NavItem {
  href: string;
  label: string;
  emoji: string;
  match: string;
  exact?: boolean;
  accent: string;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', emoji: '📊', match: '/admin', exact: true, accent: 'from-violet-500 to-indigo-600' },
  { href: '/admin/pedidos', label: 'Pedidos', emoji: '🛵', match: '/admin/pedidos', accent: 'from-orange-500 to-rose-500' },
  { href: '/admin/secciones', label: 'Secciones', emoji: '📑', match: '/admin/secciones', accent: 'from-cyan-500 to-blue-600' },
  { href: '/admin/platos', label: 'Platos', emoji: '🍽️', match: '/admin/platos', accent: 'from-amber-500 to-orange-500' },
  { href: '/admin/pagos', label: 'Pagos & QR', emoji: '💳', match: '/admin/pagos', accent: 'from-emerald-500 to-teal-600' },
  { href: '/admin/facturas', label: 'Facturas', emoji: '🧾', match: '/admin/facturas', accent: 'from-slate-500 to-zinc-600' },
  { href: '/admin/avisos', label: 'Avisos', emoji: '🔔', match: '/admin/avisos', accent: 'from-pink-500 to-fuchsia-600' },
  { href: '/admin/usuarios', label: 'Usuarios', emoji: '👥', match: '/admin/usuarios', accent: 'from-blue-500 to-violet-600' },
  { href: '/admin/ajustes', label: 'Ajustes', emoji: '⚙️', match: '/admin/ajustes', accent: 'from-neutral-500 to-neutral-700' },
];

export default function AdminSidebar({
  currentPath,
  userName,
  userEmail,
}: {
  currentPath: string;
  userName: string;
  userEmail: string;
}) {
  function isActive(item: NavItem) {
    return item.exact ? currentPath === item.match : currentPath === item.match || currentPath.startsWith(item.match + '/');
  }

  return (
    <>
      <a href="/admin" className="admin-brand shrink-0">
        <span className="admin-brand-icon">🍔</span>
        <div>
          <div className="text-[15px] font-bold tracking-tight leading-none">
            Bocad<span className="text-bocado-lime">O</span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">Panel admin</div>
        </div>
      </a>

      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto admin-nav-scroll">
        {NAV.map((item, i) => {
          const active = isActive(item);
          return (
            <a
              key={item.href}
              href={item.href}
              className={`admin-nav-card group ${active ? 'admin-nav-card--active' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className={`admin-nav-card-icon bg-gradient-to-br ${item.accent}`}>{item.emoji}</span>
              <span className="font-medium text-sm">{item.label}</span>
              {active && <span className="admin-nav-card-dot" aria-hidden />}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 shrink-0">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <div className="text-white font-medium truncate">{userName}</div>
            <div className="text-white/40 text-[10px] truncate">{userEmail}</div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="admin-logout-btn" aria-label="Cerrar sesión">
              Salir
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
