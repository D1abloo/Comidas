import { useCallback, useEffect, useState } from 'react';
import {
  OrderTimeline,
  STATUS_LABEL,
  PAYMENT_LABEL,
  PAYMENT_STATUS_LABEL,
  eur,
  fmtDateTime,
  statusChipClass,
  statusFilterClass,
  type OrderStatus,
} from './order-shared';
import { onMobileSync } from '../../lib/mobile-sync';
import { onOrdersChanged, useOrderStream } from '../../lib/order-stream';
import { OrderCourierLocation } from './OrderCourierLocation';

const STATUS = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'] as const;

export default function MobileOrdersPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useOrderStream(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/orders', { credentials: 'include' });
      if (r.status === 401) {
        window.location.href = '/movil';
        return;
      }
      if (!r.ok) {
        setError('No se pudieron cargar los pedidos. Pulsa actualizar.');
        return;
      }
      const data = await r.json();
      setOrders(data.orders ?? []);
      setError(null);
    } catch {
      setError('Sin conexión. Los pedidos guardados se mantienen en pantalla.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const offSync = onMobileSync(() => void load());
    const offStream = onOrdersChanged(() => void load());
    return () => {
      offSync();
      offStream();
    };
  }, [load]);

  useEffect(() => {
    function onOrderUpdate(e: Event) {
      const detail = (e as CustomEvent<{ order_id: string; status: string; courier_name?: string }>).detail;
      if (!detail?.order_id) return;
      const patch = (o: any) =>
        o.id === detail.order_id
          ? { ...o, status: detail.status, courier_name: detail.courier_name ?? o.courier_name }
          : o;
      setOrders((prev) => prev.map(patch));
      setSelected((s: any) => (s?.id === detail.order_id ? patch(s) : s));
    }
    window.addEventListener('bocado-admin-order-update', onOrderUpdate);
    return () => window.removeEventListener('bocado-admin-order-update', onOrderUpdate);
  }, []);

  async function setStatus(id: string, status: string) {
    const prev = orders;
    const prevSelected = selected;
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    if (selected?.id === id) setSelected((s: any) => (s ? { ...s, status } : s));
    const r = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!r.ok) {
      setOrders(prev);
      setSelected(prevSelected);
      setError('No se pudo actualizar el estado del pedido.');
    }
  }

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="mobile-orders">
      {pendingCount > 0 && (
        <div className="mobile-orders-alert" role="status">
          <span aria-hidden>🔔</span>
          <span>
            <strong>{pendingCount}</strong> pedido{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {error && (
        <div className="mobile-orders-alert !bg-amber-500/15 !border-amber-400/40 !text-amber-100" role="alert">
          {error}
        </div>
      )}

      <div className="mobile-orders-filters">
        <button type="button" onClick={() => setFilter('')} className={statusFilterClass('', !filter)}>
          Todos ({orders.length})
        </button>
        {STATUS.map((s) => {
          const n = orders.filter((o) => o.status === s).length;
          if (!n) return null;
          return (
            <button key={s} type="button" onClick={() => setFilter(s)} className={statusFilterClass(s, filter === s)}>
              {STATUS_LABEL[s]} ({n})
            </button>
          );
        })}
      </div>

      {loading && <p className="mobile-orders-empty">Cargando pedidos…</p>}

      <div className="mobile-orders-list">
        {!loading &&
          filtered.map((o) => (
            <button key={o.id} type="button" className="mobile-order-card" onClick={() => setSelected(o)}>
              <div className="mobile-order-card-top">
                <div>
                  <p className="mobile-order-number">{o.number}</p>
                  <p className="mobile-order-customer">{o.customer.full_name}</p>
                </div>
                <span className={`chip text-[10px] ${statusChipClass(o.status)}`}>{STATUS_LABEL[o.status]}</span>
              </div>
              <div className="mobile-order-card-bottom">
                <span>{fmtDateTime(o.created_at)}</span>
                <span className="mobile-order-total">{eur(o.total_cents)}</span>
              </div>
            </button>
          ))}
        {!loading && filtered.length === 0 && (
          <p className="mobile-orders-empty">No hay pedidos en este estado.</p>
        )}
      </div>

      {selected && (
        <div className="mobile-order-sheet" role="dialog" aria-modal="true" aria-label={`Pedido ${selected.number}`}>
          <div className="mobile-order-sheet-backdrop" onClick={() => setSelected(null)} aria-hidden />
          <div className="mobile-order-sheet-panel">
            <div className="mobile-order-sheet-head">
              <div>
                <p className="label">{fmtDateTime(selected.created_at)}</p>
                <h2 className="text-lg font-bold">{selected.number}</h2>
              </div>
              <button type="button" className="mobile-sheet-close" onClick={() => setSelected(null)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <OrderTimeline status={selected.status as OrderStatus} />

            <div className="text-sm space-y-3">
              <p>
                <span className="label block">Cliente</span>
                {selected.customer.full_name}
                <br />
                <span className="text-bocado-mute">{selected.customer.email}</span>
              </p>
              <p>
                <span className="label block">Pago</span>
                {PAYMENT_LABEL[selected.payment_method]} · {PAYMENT_STATUS_LABEL[selected.payment_status]}
              </p>
              {selected.courier_name && (
                <p>
                  <span className="label block">Repartidor</span>
                  {selected.courier_name}
                </p>
              )}
            </div>

            <ul className="text-sm divide-y divide-bocado-line rounded-xl border border-bocado-line overflow-hidden">
              {selected.items?.map((it: any, i: number) => (
                <li key={i} className="flex justify-between px-3 py-2 bg-white/80">
                  <span>
                    {it.quantity}× {it.dish_name}
                  </span>
                  <span className="text-bocado-mute">{eur(it.unit_price_cents * it.quantity)}</span>
                </li>
              ))}
            </ul>

            {selected.status === 'delivering' && selected.courier_lat != null && selected.courier_lng != null && (
              <OrderCourierLocation
                lat={selected.courier_lat}
                lng={selected.courier_lng}
                locationAt={selected.courier_location_at}
                courierName={selected.courier_name}
              />
            )}

            <div className="mobile-order-sheet-actions">
              <label className="label">Cambiar estado</label>
              <select
                value={selected.status}
                onChange={(e) => setStatus(selected.id, e.target.value)}
                className="mobile-status-select"
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <p className="text-lg font-bold text-right">{eur(selected.total_cents)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
