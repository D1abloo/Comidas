import { ADMIN_NAV_GROUPS, isAdminNavActive } from '../../config/admin-nav';

function closeMobileNav() {
  document.body.classList.remove('admin-nav-open');
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function AdminSidebar({
  currentPath,
  userName,
  userEmail,
}: {
  currentPath: string;
  userName: string;
  userEmail: string;
}) {
  return (
    <>
      <div className="admin-brand shrink-0">
        <a href="/admin" className="admin-brand-link" onClick={closeMobileNav}>
          <span className="admin-brand-mark" aria-hidden>
            B
          </span>
          <div className="min-w-0">
            <div className="admin-brand-title">
              Bocad<span className="text-[#5a8f00]">O</span>
            </div>
            <div className="admin-brand-sub">Panel de gestión</div>
          </div>
        </a>
      </div>

      <nav className="admin-nav flex-1 overflow-y-auto admin-nav-scroll" aria-label="Navegación admin">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.id} className="admin-nav-group">
            <p className="admin-nav-group-label">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isAdminNavActive(item, currentPath);
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={`admin-nav-link ${active ? 'admin-nav-link--active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={closeMobileNav}
                      title={item.description}
                    >
                      <span className="admin-nav-icon" aria-hidden>
                        {item.emoji}
                      </span>
                      <span className="admin-nav-text">
                        <span className="admin-nav-label">{item.label}</span>
                        {item.description && (
                          <span className="admin-nav-desc">{item.description}</span>
                        )}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-foot shrink-0">
        <div className="admin-user-card">
          <span className="admin-user-avatar" aria-hidden>
            {initials(userName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="admin-user-name truncate">{userName}</div>
            <div className="admin-user-email truncate">{userEmail}</div>
          </div>
        </div>
        <div className="admin-sidebar-actions">
          <a href="/" className="admin-foot-link" onClick={closeMobileNav}>
            Ver tienda ↗
          </a>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="admin-foot-btn">
              Salir
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
