import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { MOBILE_SYNC_MS, dispatchMobileSync, formatSyncAge } from '../../lib/mobile-sync';
import { initMobileNotifications, notifyMobileDevice } from '../../lib/mobile-notifications';
import { isBocadoMobileApp } from '../../lib/capacitor-app';
import { eur } from './order-shared';

type Alert = {
  id: string;
  kind?: string;
  order_number: string;
  customer_name: string;
  total_cents: number;
};

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  role: 'admin' | 'courier';
  userName: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  children: ReactNode;
  onSyncAlerts?: (alerts: Alert[]) => void;
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`mobile-sync-icon ${spinning ? 'mobile-sync-icon--spin' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export default function MobileAppShell({
  role,
  userName,
  tabs,
  activeTab,
  onTabChange,
  children,
}: Props) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [native, setNative] = useState(false);
  const knownAlerts = useRef<Set<string>>(new Set());
  const knownOrders = useRef<Set<string>>(new Set());
  const booted = useRef(false);

  useEffect(() => {
    setNative(isBocadoMobileApp());
  }, []);

  const pollAlerts = useCallback(async () => {
    if (role === 'admin') {
      try {
        const r = await fetch('/api/admin/alerts');
        if (!r.ok) return;
        const data = await r.json();
        const alerts: Alert[] = data.alerts ?? [];

        if (!booted.current) {
          alerts.forEach((a) => knownAlerts.current.add(a.id));
          booted.current = true;
          return;
        }

        const fresh = alerts.filter((a) => !knownAlerts.current.has(a.id));
        for (const a of fresh) {
          knownAlerts.current.add(a.id);
          if (a.kind === 'new_order' || !a.kind) {
            void notifyMobileDevice({
              id: a.id,
              title: '🔔 Nuevo pedido',
              body: `${a.order_number} · ${a.customer_name} · ${eur(a.total_cents)}`,
            });
          } else if (a.kind === 'bizum_paid') {
            void notifyMobileDevice({
              id: a.id,
              title: '💳 Bizum recibido',
              body: `${a.order_number} · ${a.customer_name}`,
            });
          } else if (a.kind === 'order_accepted') {
            void notifyMobileDevice({
              id: a.id,
              title: '🛵 Repartidor asignado',
              body: `${a.order_number} aceptado`,
            });
          }
        }

        if (fresh.length) {
          await fetch('/api/admin/alerts', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ids: fresh.map((a) => a.id) }),
          });
        }
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      const r = await fetch('/api/courier/orders');
      if (!r.ok) return;
      const data = await r.json();
      const available: { id: string; number: string; customer_name: string }[] = data.available ?? [];

      if (!booted.current) {
        available.forEach((o) => knownOrders.current.add(o.id));
        booted.current = true;
        return;
      }

      for (const o of available) {
        if (knownOrders.current.has(o.id)) continue;
        knownOrders.current.add(o.id);
        void notifyMobileDevice({
          id: `avail-${o.id}`,
          title: '📦 Pedido disponible',
          body: `${o.number} · ${o.customer_name}`,
        });
      }
    } catch {
      /* ignore */
    }
  }, [role]);

  const runSync = useCallback(async () => {
    setSyncing(true);
    dispatchMobileSync();
    await pollAlerts();
    setLastSync(new Date().toISOString());
    setSyncing(false);
  }, [pollAlerts]);

  useEffect(() => {
    void initMobileNotifications();
    void runSync();
    const id = window.setInterval(() => void runSync(), MOBILE_SYNC_MS);
    return () => window.clearInterval(id);
  }, [runSync]);

  useEffect(() => {
    if (!native) return;
    void (async () => {
      try {
        const { App } = await import('@capacitor/app');
        await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) window.history.back();
          else void App.minimizeApp();
        });
      } catch {
        /* web */
      }
    })();
  }, [native]);

  const firstName = userName.split(' ')[0];

  return (
    <div className="mobile-native-app">
      <div className="mobile-native-bg" aria-hidden>
        <div className="mobile-native-glow mobile-native-glow--lime" />
        <div className="mobile-native-glow mobile-native-glow--coral" />
      </div>

      <header className="mobile-native-header">
        <div className="mobile-native-brand">
          <img src="/logo-bocado-mark.svg" alt="" className="mobile-native-mark" width={36} height={36} />
          <div>
            <p className="mobile-native-kicker">{role === 'admin' ? 'Panel admin' : 'Repartidor'}</p>
            <p className="mobile-native-user">Hola, {firstName}</p>
          </div>
        </div>
        <div className="mobile-native-actions">
          <button
            type="button"
            className="mobile-sync-btn"
            onClick={() => void runSync()}
            disabled={syncing}
            aria-label="Actualizar y sincronizar"
            title="Actualizar"
          >
            <RefreshIcon spinning={syncing} />
          </button>
          <form action="/api/auth/logout" method="POST" className="mobile-logout-form">
            <input type="hidden" name="next" value="/movil" />
            <button type="submit" className="mobile-logout-btn" aria-label="Cerrar sesión">
              Salir
            </button>
          </form>
        </div>
      </header>

      <p className="mobile-sync-status" role="status">
        <span className={`mobile-sync-dot ${syncing ? 'mobile-sync-dot--on' : ''}`} aria-hidden />
        {syncing ? 'Sincronizando…' : `Sincronizado ${formatSyncAge(lastSync)}`}
        <span className="mobile-sync-interval"> · cada 25 s</span>
      </p>

      <main className="mobile-native-main">{children}</main>

      {tabs && tabs.length > 1 && onTabChange && (
        <nav className="mobile-native-nav" aria-label="Secciones">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`mobile-native-nav-btn ${activeTab === t.id ? 'mobile-native-nav-btn--active' : ''}`}
              onClick={() => onTabChange(t.id)}
              aria-current={activeTab === t.id ? 'page' : undefined}
            >
              <span className="mobile-native-nav-icon" aria-hidden>
                {t.icon}
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
