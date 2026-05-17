import { useEffect } from 'react';
import { TRACK_ORDER_KEY, isOrderAlreadyFinalized } from './order-track-storage';

export default function OrderTrackInit({ orderId }: { orderId: string }) {
  useEffect(() => {
    if (orderId && !isOrderAlreadyFinalized(orderId)) {
      localStorage.setItem(TRACK_ORDER_KEY, orderId);
    }
  }, [orderId]);
  return null;
}
