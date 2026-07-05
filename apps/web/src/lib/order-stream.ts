import { useEffect } from 'react';
import { dispatchMobileSync } from './mobile-sync';

type OrderStreamEvent = {
  type: string;
  order_id?: string;
  status?: string;
  courier_id?: string | null;
  courier_name?: string | null;
};

export function useOrderStream(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const es = new EventSource('/api/events/orders');

    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as OrderStreamEvent;
        if (data.type === 'connected') return;

        dispatchMobileSync();

        if (data.order_id) {
          window.dispatchEvent(
            new CustomEvent('bocado-admin-order-update', {
              detail: {
                order_id: data.order_id,
                status: data.status,
                courier_name: data.courier_name,
              },
            }),
          );
        }
      } catch {
        /* ignore */
      }
    };

    return () => es.close();
  }, [enabled]);
}
