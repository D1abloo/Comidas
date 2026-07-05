export const MOBILE_SYNC_MS = 25_000;

export const MOBILE_SYNC_EVENT = 'bocado-mobile-sync';

export function dispatchMobileSync() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MOBILE_SYNC_EVENT));
}

export function formatSyncAge(iso: string | null) {
  if (!iso) return 'sin sincronizar';
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 5) return 'ahora';
  if (sec < 60) return `hace ${sec}s`;
  return `hace ${Math.round(sec / 60)} min`;
}

export function onMobileSync(handler: () => void) {
  window.addEventListener(MOBILE_SYNC_EVENT, handler);
  return () => window.removeEventListener(MOBILE_SYNC_EVENT, handler);
}
