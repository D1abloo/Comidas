import { useEffect } from 'react';
import { isOrderAlreadyFinalized, saveGuestOrder, saveOrderTracking } from './order-track-storage';

export default function OrderTrackInit({
  orderId,
  accessToken,
  orderNumber,
}: {
  orderId: string;
  accessToken?: string;
  orderNumber?: string;
}) {
  useEffect(() => {
    if (!orderId || isOrderAlreadyFinalized(orderId)) return;
    if (accessToken) {
      saveOrderTracking(orderId, accessToken);
      saveGuestOrder({
        id: orderId,
        number: orderNumber ?? orderId.slice(0, 8),
        accessToken,
        createdAt: new Date().toISOString(),
      });
    } else {
      localStorage.setItem('bocado_track_order', orderId);
    }
  }, [orderId, accessToken, orderNumber]);
  return null;
}
