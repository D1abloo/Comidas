import { useEffect, useState } from 'react';
import { STATUS_LABEL, STATUS_STEPS, type OrderStatus } from './order-shared';

interface Order {
  id: string;
  number: string;
  status: OrderStatus;
}

export default function OrderTrackerBar() {
  const [order, setOrder] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const stored = localStorage.getItem('bocado_track_order');
        const r = await fetch('/api/orders?active=1', { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          const list = (data.orders ?? []) as Order[];
          const pick = list.find((o) => o.id === stored) ?? list[0] ?? null;
          if (!cancelled) setOrder(pick);
          return;
        }
        if (stored) {
          const one = await fetch(`/api/orders/${stored}`);
          if (one.ok) {
            const data = await one.json();
            if (!cancelled && data.order) setOrder(data.order);
          }
        }
      } catch {
        /* ignore */
      }
    }
    load();
    const t = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (!order || order.status === 'delivered' || order.status === 'cancelled') return null;

  const step = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="fixed bottom-0 inset-x-0 z-[45] px-3 pb-3 pointer-events-none">
            <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="food-track-bar shadow-[0_-8px_40px_-12px_rgba(0,0,0,.25)] rounded-2xl border border-bocado-line bg-white/95 backdrop-blur-md overflow-hidden animate-slide-up">
          <button
            type="button"
            className="w-full flex items-center gap-3 p-4 text-left"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="w-10 h-10 rounded-full bg-bocado-lime grid place-items-center text-lg shrink-0 animate-pulse-soft">🛵</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-bocado-mute">Tu pedido en curso</p>
              <p className="font-semibold truncate">{order.number}</p>
              <p className="text-xs text-bocado-mute">{STATUS_LABEL[order.status]}</p>
            </div>
            <span className="text-bocado-mute text-sm">{open ? '▼' : '▲'}</span>
          </button>
          {open && (
            <div className="px-4 pb-4 border-t border-bocado-line animate-fade-in">
              <div className="flex gap-1 mt-3">
                {STATUS_STEPS.map((s, i) => (
                                    <div
                    key={s.key}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-bocado-ink' : 'bg-bocado-line'}`}
                    title={s.label}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-bocado-mute">
                {STATUS_STEPS.map((s) => (
                  <span key={s.key} className={s.key === order.status ? 'font-semibold text-bocado-ink' : ''}>
                    {s.label}
                  </span>
                ))}
              </div>
              <a href="/pedidos" className="btn-lime w-full mt-3 text-sm justify-center">
                Ver seguimiento completo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
