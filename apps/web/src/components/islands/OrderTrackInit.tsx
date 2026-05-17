import { useEffect } from 'react';

export default function OrderTrackInit({ orderId }: { orderId: string }) {
  useEffect(() => {
    if (orderId) localStorage.setItem('bocado_track_order', orderId);
  }, [orderId]);
  return null;
}
