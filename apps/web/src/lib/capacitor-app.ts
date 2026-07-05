/**
 * Detección de apps nativas Capacitor (unificada, admin y repartidor).
 */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function getCapacitorAppId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const cap = (window as unknown as {
    Capacitor?: { getConfig?: () => { appId?: string } };
  }).Capacitor;
  return cap?.getConfig?.()?.appId;
}

const MOBILE_APP_IDS = new Set([
  'app.bocado.mobile',
  'app.bocado.admin',
  'app.bocado.repartidor',
]);

export function isBocadoMobileApp(): boolean {
  const id = getCapacitorAppId();
  return isCapacitorNative() && Boolean(id && MOBILE_APP_IDS.has(id));
}

export function isMobileNativeApp(): boolean {
  return isCapacitorNative() && getCapacitorAppId() === 'app.bocado.mobile';
}

export function isAdminNativeApp(): boolean {
  const id = getCapacitorAppId();
  return isCapacitorNative() && (id === 'app.bocado.admin' || id === 'app.bocado.mobile');
}

export function isCourierNativeApp(): boolean {
  const id = getCapacitorAppId();
  return isCapacitorNative() && (id === 'app.bocado.repartidor' || id === 'app.bocado.mobile');
}

export function getNativeLogoutNext(): string {
  return isBocadoMobileApp() ? '/movil' : '/';
}
