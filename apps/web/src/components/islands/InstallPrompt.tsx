import { useCallback, useEffect, useState } from 'react';
import { deleteCookie, getCookie, setCookie } from '../../utils/cookies';

type Platform = 'ios' | 'android' | 'desktop';

const COOKIE_HIDE = 'bocado_pwa_hide';
const COOKIE_SNOOZE = 'bocado_pwa_snooze';
const LEGACY_STORAGE_KEY = 'bocado-pwa-install-dismissed';
const SNOOZE_DAYS = 14;
const SNOOZE_SECONDS = SNOOZE_DAYS * 24 * 60 * 60;
const HIDE_SECONDS = 10 * 365 * 24 * 60 * 60;

const STEPS: Record<Platform, { title: string; steps: string[]; note?: string }> = {
  ios: {
    title: 'iPhone / iPad',
    note: 'Debes usar Safari. En Chrome de iOS no se puede instalar.',
    steps: [
      'Abre esta web en Safari.',
      'Pulsa Compartir (cuadrado con flecha).',
      'Elige «Añadir a la pantalla de inicio».',
      'Confirma con «Añadir».',
    ],
  },
  android: {
    title: 'Android',
    steps: [
      'Menú del navegador (⋮).',
      '«Instalar aplicación» o «Añadir a inicio».',
      'Confirma «Instalar».',
      'El icono aparecerá en tu inicio.',
    ],
  },
  desktop: {
    title: 'Ordenador',
    steps: [
      'Chrome/Edge: icono instalar (⊕) en la barra de direcciones.',
      'Pulsa «Instalar» en el diálogo.',
      'O menú ⋮ → «Instalar BocadO…».',
      'Safari (Mac): Archivo → «Añadir al Dock».',
    ],
  },
};

function detectPlatform(): Platform | null {
  if (typeof window === 'undefined') return null;
  if (window.matchMedia('(display-mode: standalone)').matches) return null;
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return null;

  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function migrateLegacySnooze(): void {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw || getCookie(COOKIE_SNOOZE)) return;
    const ts = parseInt(raw, 10);
    if (!Number.isNaN(ts)) {
      setCookie(COOKIE_SNOOZE, String(ts), { maxAgeSeconds: SNOOZE_SECONDS });
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function shouldAutoOpen(): boolean {
  migrateLegacySnooze();
  if (getCookie(COOKIE_HIDE) === '1') return false;

  const snooze = getCookie(COOKIE_SNOOZE);
  if (!snooze) return true;
  const ts = parseInt(snooze, 10);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > SNOOZE_DAYS * 24 * 60 * 60 * 1000;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Platform>('android');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const platform = detectPlatform();
    if (!platform) return;

    setTab(platform);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    if (shouldAutoOpen()) {
      const t = window.setTimeout(() => setOpen(true), 1200);
      const onShow = () => setOpen(true);
      window.addEventListener('bocado-show-install', onShow);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onBip);
        window.removeEventListener('appinstalled', onInstalled);
        window.removeEventListener('bocado-show-install', onShow);
      };
    }

    const onShow = () => setOpen(true);
    window.addEventListener('bocado-show-install', onShow);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('bocado-show-install', onShow);
    };
  }, []);

  const snooze = useCallback(() => {
    setOpen(false);
    const ts = String(Date.now());
    setCookie(COOKIE_SNOOZE, ts, { maxAgeSeconds: SNOOZE_SECONDS });
  }, []);

  const hideForever = useCallback(() => {
    setOpen(false);
    setCookie(COOKIE_HIDE, '1', { maxAgeSeconds: HIDE_SECONDS });
    deleteCookie(COOKIE_SNOOZE);
  }, []);

  const runNativeInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'accepted') setOpen(false);
  }, [deferred]);

  if (!open || installed) return null;

  const content = STEPS[tab];
  const showNativeInstall = Boolean(deferred && tab !== 'ios');

  return (
    <div className="pwa-install-root" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
      <div className="pwa-install-backdrop" onClick={() => setOpen(false)} aria-hidden />

      <div className="pwa-install-panel animate-order-pop">
        <div className="pwa-install-glow" aria-hidden />

        <header className="pwa-install-header">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/icons/icon-192.png" alt="" className="pwa-install-logo" />
            <div className="min-w-0">
              <p className="pwa-install-kicker">Instalar app</p>
              <h2 id="pwa-install-title" className="pwa-install-title">
                Añade BocadO a tu dispositivo
              </h2>
            </div>
          </div>
          <button type="button" className="pwa-install-close shrink-0" onClick={() => setOpen(false)} aria-label="Cerrar">
            ×
          </button>
        </header>

        <p className="pwa-install-lead">
          Accede más rápido, con seguimiento de pedidos y tu carta favorita a un toque.
        </p>

        <div className="pwa-install-tabs" role="tablist" aria-label="Plataforma">
          {(['ios', 'android', 'desktop'] as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={tab === p}
              onClick={() => setTab(p)}
              className={`pwa-install-tab ${tab === p ? 'pwa-install-tab--active' : ''}`}
            >
              {p === 'ios' ? 'iPhone' : p === 'android' ? 'Android' : 'PC'}
            </button>
          ))}
        </div>

        <div className="pwa-install-body">
          <h3 className="pwa-install-platform-title">{content.title}</h3>
          {content.note && <p className="pwa-install-note">{content.note}</p>}
          <ol className="pwa-install-steps">
            {content.steps.map((step, i) => (
              <li key={i}>
                <span className="pwa-install-step-num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <footer className="pwa-install-footer">
          {showNativeInstall && (
            <button type="button" className="btn-lime w-full justify-center py-3" onClick={runNativeInstall}>
              Instalar ahora
            </button>
          )}
          <button type="button" className="pwa-install-secondary w-full" onClick={snooze}>
            Recordar más tarde
          </button>
          <button type="button" className="pwa-install-dismiss w-full" onClick={hideForever}>
            No mostrar más
          </button>
        </footer>
      </div>
    </div>
  );
}
