import { useCallback, useEffect, useRef, useState } from 'react';
import { eur } from './order-shared';

type Alert = {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  total_cents: number;
  item_count: number;
  created_at: string;
};

export default function AdminAlerts() {
  const [toasts, setToasts] = useState<Alert[]>([]);
  const known = useRef<Set<string>>(new Set());
  const booted = useRef(false);
  const autoPrintRef = useRef(false);
  const printedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        autoPrintRef.current = Boolean(d.settings?.auto_print_on_order);
      })
      .catch(() => undefined);
  }, []);

  const ack = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    await fetch('/api/admin/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  }, []);

  useEffect(() => {
    async function poll() {
      try {
        const r = await fetch('/api/admin/alerts');
        if (!r.ok) return;
        const data = await r.json();
        const alerts: Alert[] = data.alerts ?? [];

        if (!booted.current) {
          alerts.forEach((a) => known.current.add(a.id));
          booted.current = true;
          return;
        }

        const fresh = alerts.filter((a) => !known.current.has(a.id));
        if (!fresh.length) return;

        fresh.forEach((a) => known.current.add(a.id));
        setToasts((prev) => [...fresh, ...prev].slice(0, 4));
        void ack(fresh.map((a) => a.id));
        if (autoPrintRef.current) {
          for (const a of fresh) {
            if (!printedRef.current.has(a.id)) {
              printedRef.current.add(a.id);
              window.open(
                `/admin/impresion/ticket?order=${a.order_id}&autoprint=1`,
                `print-${a.id}`,
                'width=420,height=720',
              );
            }
          }
        }
      } catch {
        /* ignore */
      }
    }

    poll();
    const id = window.setInterval(poll, 3500);
    return () => window.clearInterval(id);
  }, [ack]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (!toasts.length) return null;

  return (
    <div className="admin-toast-stack" aria-live="assertive">
      {toasts.map((t) => (
        <article key={t.id} className="admin-toast animate-order-pop">
          <div className="admin-toast-glow" aria-hidden />
          <div className="flex items-start gap-3 relative z-10">
            <span className="admin-toast-icon" aria-hidden>
              🔔
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">Nuevo pedido</p>
              <p className="text-base font-bold text-white mt-0.5">{t.order_number}</p>
              <p className="text-sm text-white/80 mt-1">
                {t.customer_name} · {t.item_count} artículo{t.item_count !== 1 ? 's' : ''}
              </p>
              <p className="text-lg font-semibold text-bocado-lime mt-2">{eur(t.total_cents)}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <a href="/admin/pedidos" className="admin-toast-btn">
                Ver pedido
              </a>
              <a
                href={`/admin/impresion/ticket?order=${t.order_id}&autoprint=1`}
                target="_blank"
                rel="noreferrer"
                className="admin-toast-btn !bg-white/20 !text-white"
              >
                🖨️ Imprimir
              </a>
              <button type="button" className="admin-toast-dismiss" onClick={() => dismiss(t.id)}>
                Cerrar
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
