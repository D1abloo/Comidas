import AdminMenu from './AdminMenu';
import { isAdminNativeApp } from '../../lib/capacitor-app';
import { useEffect, useState } from 'react';

function parseCrumb(crumb: string) {
  return crumb.split('/').map((s) => s.trim()).filter(Boolean);
}

export default function AdminTopbar({
  title,
  crumb,
}: {
  title: string;
  crumb: string;
}) {
  const parts = parseCrumb(crumb);
  const [nativeApp, setNativeApp] = useState(false);

  useEffect(() => {
    setNativeApp(isAdminNativeApp());
  }, []);

  return (
    <header className="admin-topbar">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="lg:hidden shrink-0">
          <AdminMenu />
        </div>
        <div className="min-w-0">
          <nav className="admin-breadcrumb" aria-label="Ruta">
            {parts.map((part, i) => {
              const isLast = i === parts.length - 1;
              return (
                <span key={`${part}-${i}`} className="inline-flex items-center gap-1.5">
                  {i > 0 && <span className="admin-breadcrumb-sep" aria-hidden>/</span>}
                  {isLast ? (
                    <span className="admin-breadcrumb-current" aria-current="page">
                      {part}
                    </span>
                  ) : part === 'Inicio' ? (
                    <a href="/admin" className="admin-breadcrumb-link">
                      {part}
                    </a>
                  ) : (
                    <span className="admin-breadcrumb-muted">{part}</span>
                  )}
                </span>
              );
            })}
          </nav>
          <h1 className="admin-page-title truncate">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {nativeApp && (
          <span className="admin-topbar-native inline-flex md:hidden">App</span>
        )}
        <a
          href="/admin/pedidos"
          className={`admin-topbar-chip ${nativeApp ? 'inline-flex' : 'hidden md:inline-flex'}`}
        >
          <span className="admin-topbar-chip-dot" aria-hidden />
          Pedidos en vivo
        </a>
        <a href="/" className="admin-store-link hidden sm:inline-flex">
          Tienda ↗
        </a>
      </div>
    </header>
  );
}
