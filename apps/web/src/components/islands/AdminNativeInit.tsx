import { useEffect, useState } from 'react';
import { isAdminNativeApp, isMobileNativeApp } from '../../lib/capacitor-app';

export default function AdminNativeInit() {
  const [native, setNative] = useState(false);
  const [label, setLabel] = useState('App Android · conectada al panel');

  useEffect(() => {
    const isNative = isAdminNativeApp();
    setNative(isNative);
    if (isMobileNativeApp()) setLabel('App BocadO · panel admin');
    if (!isNative) return;

    void (async () => {
      try {
        const { App } = await import('@capacitor/app');
        await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            void App.minimizeApp();
          }
        });
      } catch {
        /* web fallback */
      }
    })();
  }, []);

  if (!native) return null;

  return (
    <div className="admin-native-banner" role="status">
      {label}
    </div>
  );
}
