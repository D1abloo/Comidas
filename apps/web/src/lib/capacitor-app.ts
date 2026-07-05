/**
 * Detección de apps nativas Capacitor (repartidor vs admin).
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

export function isAdminNativeApp(): boolean {
  return isCapacitorNative() && getCapacitorAppId() === 'app.bocado.admin';
}

export function isCourierNativeApp(): boolean {
  return isCapacitorNative() && getCapacitorAppId() === 'app.bocado.repartidor';
}
