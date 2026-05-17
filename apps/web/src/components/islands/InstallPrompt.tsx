import { useCallback, useEffect, useState } from 'react';

type Platform = 'ios' | 'android' | 'desktop';

const STORAGE_KEY = 'bocado-pwa-install-dismissed';
const DISMISS_DAYS = 14;

const STEPS: Record<Platform, { title: string; steps: string[]; note?: string }> = {
  ios: {
    title: 'iPhone / iPad',
    note: 'Debes usar Safari. En Chrome de iOS no se puede instalar.',
    steps: [
      'Abre esta web en Safari (si no lo estás ya).',
      'Pulsa el botón Compartir (cuadrado con flecha hacia arriba).',
      'Baja en el menú y elige «Añadir a la pantalla de inicio».',
      'Pulsa «Añadir» arriba a la derecha para confirmar.',
    ],
  },
  android: {
    title: 'Android',
    steps: [
      'Pulsa el menú del navegador (⋮ tres puntos).',
      'Elige «Instalar aplicación» o «Añadir a pantalla de inicio».',
      'Confirma con «Instalar» o «Añadir».',
      'El icono de BocadO aparecerá en tu inicio como una app.',
    ],
  },
  desktop: {
    title: 'Ordenador',
    steps: [
      'En Chrome o Edge: busca el icono de instalar (⊕ o monitor) en la barra de direcciones.',
      'Pulsa «Instalar» en el cuadro de diálogo.',
      'También puedes usar el menú ⋮ → «Instalar BocadO…» o «Instalar aplicación».',
      'En Mac con Safari: menú Archivo → «Añadir al Dock» (macOS Sonoma+).',
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

function shouldAutoOpen(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return true;
    return Date.now() - ts > DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
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
      return () => {
        window.clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onBip);
        window.removeEventListener('appinstalled', onInstalled);
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

  const dismiss = useCallback((remember: boolean) => {
    setOpen(false);
    if (remember) {
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }
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

  return (
    <div className="pwa-install-root" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
      <div className="pwa-install-backdrop" onClick={() => dismiss(false)} aria-hidden />
      <div className="pwa-install-panel animate-order-pop">
        <div className="pwa-install-glow" aria-hidden />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="" className="w-14 h-14 rounded-2xl shadow-glow ring-2 ring-bocado-lime/40" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-bocado-lime">Instalar app</p>
              <h2 id="pwa-install-title" className="font-display text-xl text-white mt-0.5">
                Añade BocadO a tu dispositivo
              </h2>
            </div>
          </div>
          <button type="button" className="pwa-install-close" onClick={() => dismiss(false)} aria-label="Cerrar">
            ×
          </button>
        </div>

        <p className="text-sm text-white/70 mt-4 relative z-10">
          Accede más rápido, como una app nativa, con seguimiento de pedidos y tu carta favorita a un toque.
        </p>

        <div className="flex gap-2 mt-5 relative z-10 flex-wrap">
          {(['ios', 'android', 'desktop'] as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTab(p)}
              className={`pwa-install-tab ${tab === p ? 'pwa-install-tab--active' : ''}`}
            >
              {p === 'ios' ? '📱 iPhone' : p === 'android' ? '🤖 Android' : '💻 PC'}
            </button>
          ))}
        </div>

        <div className="mt-5 relative z-10">
          <h3 className="text-sm font-bold text-white mb-3">{content.title}</h3>
          {content.note && (
            <p className="text-xs text-amber-200/90 mb-3 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-2">
              {content.note}
            </p>
          )}
          <ol className="pwa-install-steps">
            {content.steps.map((step, i) => (
              <li key={i}>
                <span className="pwa-install-step-num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 relative z-10">
          {deferred && tab !== 'ios' && (
            <button type="button" className="btn-lime flex-1 justify-center py-3" onClick={runNativeInstall}>
              Instalar ahora
            </button>
          )}
          <button type="button" className="pwa-install-secondary flex-1" onClick={() => dismiss(true)}>
            Recordar más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
