import { useEffect, useState, useCallback } from 'react';
import { STATUS_LABEL, STATUS_STEPS, customerOrderLabel, type OrderStatus } from './order-shared';
import CustomerLiveDelivery from './CustomerLiveDelivery';
import {
  TRACK_ORDER_KEY,
  clearOrderTracking,
  isOrderAlreadyFinalized,
  markOrderDone,
} from './order-track-storage';

interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  courier_accepted_at?: string | null;
}

type Phase = 'hidden' | 'active' | 'done';

function isFinished(status: OrderStatus) {
  return status === 'delivered' || status === 'cancelled';
}

export default function OrderTrackerBar() {
  const [order, setOrder] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('hidden');
  const [dismissing, setDismissing] = useState(false);

  const finalizeOrder = useCallback((o: Order) => {
    if (isOrderAlreadyFinalized(o.id)) {
      setPhase('hidden');
      setOrder(null);
      return;
    }
    markOrderDone(o.id);
    setOrder(o);
    setPhase('done');
    setOpen(false);
    setDismissing(false);

    const t = window.setTimeout(() => {
      setDismissing(true);
      window.setTimeout(() => {
        clearOrderTracking();
        setOrder(null);
        setPhase('hidden');
        setDismissing(false);
      }, 450);
    }, 4500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cleanupDone: (() => void) | undefined;

    async function load() {
      try {
        const stored = localStorage.getItem(TRACK_ORDER_KEY);
        let picked: Order | null = null;

        const r = await fetch('/api/orders?active=1', { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          const list = (data.orders ?? []) as Order[];
          picked = (stored ? list.find((o) => o.id === stored) : null) ?? list[0] ?? null;
        }
        if (!picked && stored) {
          const one = await fetch(`/api/orders/${stored}`);
          if (one.ok) {
            const data = await one.json();
            picked = data.order ?? null;
          }
        }

        if (cancelled) return;

        if (!picked) {
          if (!stored) {
            setPhase('hidden');
            setOrder(null);
          }
          return;
        }

        if (isFinished(picked.status)) {
          if (stored === picked.id) {
            cleanupDone = finalizeOrder(picked);
          } else {
            clearOrderTracking();
            setPhase('hidden');
            setOrder(null);
          }
          return;
        }

        if (isOrderAlreadyFinalized(picked.id)) {
          setPhase('hidden');
          setOrder(null);
          return;
        }

        setOrder(picked);
        setPhase('active');
        if (!stored) localStorage.setItem(TRACK_ORDER_KEY, picked.id);
      } catch {
        /* ignore */
      }
    }

    load();
    const t = setInterval(load, 12000);
    return () => {
      cancelled = true;
      clearInterval(t);
      cleanupDone?.();
    };
  }, [finalizeOrder]);

  useEffect(() => {
    document.body.classList.toggle('has-order-tracker', phase === 'active' || phase === 'done');
    return () => document.body.classList.remove('has-order-tracker');
  }, [phase]);

  if (phase === 'hidden' || !order) return null;

  const step = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const done = phase === 'done';

  return (
        <div
      className={`fixed bottom-0 inset-x-0 z-[45] px-3 pb-3 pointer-events-none transition-opacity duration-500 ${
        dismissing ? 'opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-lg mx-auto pointer-events-auto">
                <div
          className={`food-track-bar shadow-[0_-8px_40px_-12px_rgba(0,0,0,.25)] rounded-2xl border overflow-hidden backdrop-blur-md animate-slide-up ${
            done ? 'border-emerald-200 bg-emerald-50/95' : 'border-bocado-line bg-white/95'
          }`}
        >
          {done ? (
            <div className="flex items-center gap-3 p-4">
              <span className="w-10 h-10 rounded-full bg-emerald-500 text-white grid place-items-center text-lg shrink-0">
                ✓
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium">Pedido finalizado</p>
                <p className="font-semibold truncate text-emerald-950">{order.number}</p>
                <p className="text-xs text-emerald-700">
                  {order.status === 'cancelled' ? 'Pedido cancelado' : '¡Entregado! Gracias por tu confianza.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setOpen((v) => !v)}
              >
                <span className="w-10 h-10 rounded-full bg-bocado-lime grid place-items-center text-lg shrink-0 animate-pulse-soft">
                  🛵
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-bocado-mute">Tu pedido en curso</p>
                  <p className="font-semibold truncate">{order.number}</p>
                  <p className="text-xs text-bocado-mute">{customerOrderLabel(order)}</p>
                </div>
                <span className="text-bocado-mute text-sm">{open ? '▼' : '▲'}</span>
              </button>
              {open && (
                <div className="px-4 pb-4 border-t border-bocado-line animate-fade-in">
                  <CustomerLiveDelivery
                    orderId={order.id}
                    orderStatus={order.status}
                    courierAcceptedAt={order.courier_accepted_at}
                    compact
                  />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
