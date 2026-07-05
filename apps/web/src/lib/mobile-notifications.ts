import { isBocadoMobileApp } from './capacitor-app';

let permissionAsked = false;

function alertIdToInt(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 2147480000) + 1;
}

export async function initMobileNotifications() {
  if (!isBocadoMobileApp() || permissionAsked) return;
  permissionAsked = true;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.requestPermissions();
  } catch {
    /* web or plugin unavailable */
  }
}

export async function notifyMobileDevice(opts: { id: string; title: string; body: string }) {
  if (!isBocadoMobileApp()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: alertIdToInt(opts.id),
          title: opts.title,
          body: opts.body,
          schedule: { at: new Date(Date.now() + 120) },
        },
      ],
    });
  } catch {
    /* ignore */
  }
}
