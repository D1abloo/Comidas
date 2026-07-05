/**
 * Seguimiento GPS unificado: navegador web y app Android (Capacitor).
 */
export type LocationPayload = {
  lat: number;
  lng: number;
  accuracy_m: number;
};

export type LocationSendFn = (coords: LocationPayload) => void | Promise<void>;

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export async function startCourierLocationTracking(
  onSend: LocationSendFn,
): Promise<() => void> {
  if (typeof window === 'undefined') return () => undefined;

  if (isCapacitorNative()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const perm = await Geolocation.requestPermissions();
      if (perm.location === 'denied') return () => undefined;

      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 25000, maximumAge: 8000 },
        (position, err) => {
          if (err || !position) return;
          void onSend({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy_m: position.coords.accuracy,
          });
        },
      );

      const interval = window.setInterval(async () => {
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 5000,
          });
          await onSend({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy_m: position.coords.accuracy,
          });
        } catch {
          /* ignore */
        }
      }, 20000);

      return () => {
        window.clearInterval(interval);
        void Geolocation.clearWatch({ id: watchId });
      };
    } catch {
      /* fallback */
    }
  }

  if (!navigator.geolocation) return () => undefined;

  const watchId = navigator.geolocation.watchPosition(
    (pos) =>
      void onSend({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      }),
    () => undefined,
    { enableHighAccuracy: true, maximumAge: 20000, timeout: 25000 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export function isCourierNativeApp(): boolean {
  return isCapacitorNative();
}
