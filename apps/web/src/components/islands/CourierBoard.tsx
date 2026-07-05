import { useCallback, useEffect, useState } from 'react';
import { eur, PAYMENT_LABEL, PAYMENT_STATUS_LABEL } from './order-shared';

interface CourierOrder {
  id: string;
  number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: {
    street: string;
    number: string;
    floor?: string | null;
    city: string;
    postal_code: string;
    notes?: string | null;
  };
  items: { dish_name: string; quantity: number }[];
  total_cents: number;
  payment_method: string;
  payment_status: string;
  notes?: string | null;
  courier_id?: string | null;
  delivered_at?: string | null;
}

function addressLine(o: CourierOrder) {
  const a = o.delivery_address;
  const floor = a.floor ? `, ${a.floor}` : '';
  return `${a.street} ${a.number}${floor} · ${a.postal_code} ${a.city}`;
}

function mapsUrl(o: CourierOrder) {
  const q = encodeURIComponent(addressLine(o));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function OrderCard({
  order,
  mode,
  busy,
  onAccept,
  onDeliver,
}: {
  order: CourierOrder;
  mode: 'available' | 'mine' | 'completed';
  busy: string | null;
  onAccept?: (id: string) => void;
  onDeliver?: (id: string) => void;
}) {
  const loading = busy === order.id;
  return (
    <article className="courier-card">
      <div className="courier-card-head">
        <div>
          <p className="courier-card-number">{order.number}</p>
          <p className="courier-card-customer">{order.customer_name}</p>
        </div>
        <span className="courier-card-total">{eur(order.total_cents)}</span>
      </div>

      <a href={mapsUrl(order)} target="_blank" rel="noopener noreferrer" className="courier-address">
        <span aria-hidden>📍</span>
        <span>{addressLine(order)}</span>
      </a>

      <ul className="courier-items">
        {order.items.map((it, i) => (
          <li key={i}>
            {it.quantity}× {it.dish_name}
          </li>
        ))}
      </ul>

      <div className="courier-meta">
        <span>{PAYMENT_LABEL[order.payment_method] ?? order.payment_method}</span>
        <span>·</span>
        <span>{PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status}</span>
        {order.notes && (
          <>
            <span>·</span>
            <span className="italic">"{order.notes}"</span>
          </>
        )}
      </div>

      <div className="courier-card-actions">
        <a href={`tel:${order.customer_phone}`} className="courier-btn-ghost">
          Llamar
        </a>
        {mode === 'available' && onAccept && (
          <button
            type="button"
            className="courier-btn-primary"
            disabled={loading}
            onClick={() => onAccept(order.id)}
          >
            {loading ? 'Aceptando…' : 'Aceptar pedido'}
          </button>
        )}
        {mode === 'mine' && onDeliver && (
          <button
            type="button"
            className="courier-btn-lime"
            disabled={loading}
            onClick={() => onDeliver(order.id)}
          >
            {loading ? 'Completando…' : '✓ Marcar completado'}
          </button>
        )}
        {mode === 'completed' && order.delivered_at && (
          <span className="courier-done-badge">Completado · {new Date(order.delivered_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        )}
      </div>
    </article>
  );
}

export default function CourierBoard({ courierName }: { courierName: string }) {
  const [available, setAvailable] = useState<CourierOrder[]>([]);
  const [mine, setMine] = useState<CourierOrder[]>([]);
  const [completed, setCompleted] = useState<CourierOrder[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<'available' | 'mine' | 'completed'>('mine');

  const load = useCallback(async () => {
    const r = await fetch('/api/courier/orders');
    if (!r.ok) return;
    const data = await r.json();
    setAvailable(data.available ?? []);
    setMine(data.mine ?? []);
    setCompleted(data.completed ?? []);
    if ((data.mine?.length ?? 0) > 0) setTab('mine');
    else if ((data.available?.length ?? 0) > 0) setTab('available');
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 8000);
    return () => window.clearInterval(id);
  }, [load]);

  async function accept(id: string) {
    setBusy(id);
    try {
      const r = await fetch(`/api/courier/orders/${id}/accept`, { method: 'PATCH' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Error');
      await load();
      setTab('mine');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'No se pudo aceptar');
    } finally {
      setBusy(null);
    }
  }

  async function deliver(id: string) {
    if (!confirm('¿Confirmas que el pedido ha sido entregado al cliente?')) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/courier/orders/${id}/deliver`, { method: 'PATCH' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Error');
      await load();
      setTab('completed');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'No se pudo completar');
    } finally {
      setBusy(null);
    }
  }

  const tabs = [
    { key: 'mine' as const, label: 'Mis repartos', count: mine.length },
    { key: 'available' as const, label: 'Disponibles', count: available.length },
    { key: 'completed' as const, label: 'Completados', count: completed.length },
  ];

  const list = tab === 'available' ? available : tab === 'mine' ? mine : completed;

  return (
    <div className="courier-app">
      <header className="courier-header">
        <div>
          <p className="courier-kicker">App repartidor</p>
          <h1 className="courier-title">Hola, {courierName.split(' ')[0]}</h1>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="courier-btn-ghost text-xs">
            Salir
          </button>
        </form>
      </header>

      <div className="courier-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`courier-tab ${tab === t.key ? 'courier-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count > 0 && <span className="courier-tab-badge">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="courier-list">
        {list.length === 0 && (
          <p className="courier-empty">
            {tab === 'available' && 'No hay pedidos disponibles. El admin debe marcar pedidos como «En reparto».'}
            {tab === 'mine' && 'No tienes repartos activos. Acepta un pedido de la pestaña Disponibles.'}
            {tab === 'completed' && 'Aún no has completado entregas hoy.'}
          </p>
        )}
        {list.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            mode={tab}
            busy={busy}
            onAccept={tab === 'available' ? accept : undefined}
            onDeliver={tab === 'mine' ? deliver : undefined}
          />
        ))}
      </div>
    </div>
  );
}
