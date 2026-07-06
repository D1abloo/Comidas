import { useEffect, useState } from 'react';
import {
  OrderTimeline,
  PAYMENT_LABEL,
  customerOrderLabel,
  eur,
  fmtDateTime,
  statusChipClass,
  type OrderStatus,
} from './order-shared';
import CustomerLiveDelivery from './CustomerLiveDelivery';
import { loadGuestOrders, type SavedGuestOrder } from './order-track-storage';

interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  payment_method: string;
  total_cents: number;
  created_at: string;
  courier_accepted_at?: string | null;
  items: { dish_name: string; quantity: number }[];
  accessToken?: string;
}

interface Props {
  userEmail?: string | null;
  initialOrders?: Order[];
}

async function fetchOrderWithToken(id: string, token: string): Promise<Order | null> {
  const r = await fetch(`/api/orders/${id}?token=${encodeURIComponent(token)}`);
  if (!r.ok) return null;
  const data = await r.json();
  return { ...data.order, accessToken: token } as Order;
}

export default function OrdersTracker({ userEmail, initialOrders = [] }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(!userEmail);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Order | null>(initialOrders[0] ?? null);

  useEffect(() => {
    if (userEmail) return;
    let cancelled = false;
    async function loadGuest() {
      setLoading(true);
      setError('');
      const saved = loadGuestOrders();
      if (!saved.length) {
        if (!cancelled) {
          setOrders([]);
          setSelected(null);
          setLoading(false);
        }
        return;
      }
      const loaded = (
        await Promise.all(saved.map((s: SavedGuestOrder) => fetchOrderWithToken(s.id, s.accessToken)))
      ).filter((o): o is Order => Boolean(o));
      if (!cancelled) {
        setOrders(loaded);
        setSelected(loaded[0] ?? null);
        if (!loaded.length) setError('No se encontraron pedidos guardados en este dispositivo.');
        setLoading(false);
      }
    }
    void loadGuest();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  return (
    <div className="space-y-8">
      {!userEmail && !loading && orders.length === 0 && (
        <p className="text-sm text-bocado-mute text-center card p-8">
          Los pedidos que hagas desde este navegador aparecerán aquí automáticamente.{' '}
          <a href="/" className="underline">
            Ver catálogo
          </a>
        </p>
      )}

      {userEmail && orders.length === 0 && !loading && (
        <p className="text-sm text-bocado-mute text-center card p-8">
          No tienes pedidos aún.{' '}
          <a href="/" className="underline">
            Ver catálogo
          </a>
        </p>
      )}

      {loading && <p className="text-sm text-bocado-mute text-center card p-8 animate-pulse">Cargando pedidos…</p>}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      {orders.length > 0 && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 animate-fade-up">
          <aside className="card p-3 max-h-[480px] overflow-y-auto">
            <p className="label px-3 py-2">Tus pedidos ({orders.length})</p>
            <ul className="space-y-1">
              {orders.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(o)}
                    className={`w-full text-left rounded-xl px-3 py-3 transition-colors ${
                      selected?.id === o.id ? 'bg-bocado-ink text-white' : 'hover:bg-bocado-paper2'
                    }`}
                  >
                    <div className="font-medium text-sm mt-0.5">{o.number}</div>
                    <div className={`text-xs mt-1 ${selected?.id === o.id ? 'text-white/70' : 'text-bocado-mute'}`}>
                      {eur(o.total_cents)} · {customerOrderLabel(o)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {selected && (
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="label">{fmtDateTime(selected.created_at)}</p>
                  <h2 className="text-2xl font-semibold tracking-tight mt-1">{selected.number}</h2>
                  <p className="text-sm text-bocado-mute mt-1">
                    {PAYMENT_LABEL[selected.payment_method]} · {selected.items.length} platos
                  </p>
                </div>
                <span className={`chip ${statusChipClass(selected.status)}`}>
                  {customerOrderLabel(selected)}
                </span>
              </div>

              <CustomerLiveDelivery
                orderId={selected.id}
                orderStatus={selected.status}
                courierAcceptedAt={selected.courier_accepted_at}
                accessToken={selected.accessToken}
              />

              <div>
                <p className="label mb-3">Seguimiento</p>
                <OrderTimeline status={selected.status} />
              </div>

              <div>
                <p className="label mb-2">Contenido</p>
                <ul className="text-sm space-y-2">
                  {selected.items.map((it, i) => (
                    <li key={i} className="flex justify-between py-2 border-b border-bocado-line last:border-0">
                      <span>
                        {it.quantity}× {it.dish_name}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-right font-semibold text-lg mt-4">{eur(selected.total_cents)}</p>
              </div>

              {!userEmail && (
                <p className="text-xs text-bocado-mute">
                  <a href="/login" className="underline">
                    Inicia sesión
                  </a>{' '}
                  para ver todos tus pedidos en el perfil.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
