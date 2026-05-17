import { useState } from 'react';
import {
  OrderTimeline,
  STATUS_LABEL,
  PAYMENT_LABEL,
  eur,
  fmtDateTime,
  statusChipClass,
  type OrderStatus,
} from './order-shared';

interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  payment_method: string;
  total_cents: number;
  created_at: string;
  items: { dish_name: string; quantity: number }[];
}

interface Props {
  userEmail?: string | null;
  initialOrders?: Order[];
}

export default function OrdersTracker({ userEmail, initialOrders = [] }: Props) {
  const [email, setEmail] = useState(userEmail ?? '');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Order | null>(initialOrders[0] ?? null);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const q = userEmail ? '' : `?email=${encodeURIComponent(email.trim())}`;
      const r = await fetch(`/api/orders${q}`);
      const data = await r.json();
      if (!r.ok) {
        setError(data.error === 'unauthorized' ? 'Introduce el email con el que hiciste el pedido.' : 'No se pudieron cargar los pedidos.');
        setOrders([]);
        setSelected(null);
        return;
      }
      const list = (data.orders ?? []) as Order[];
      setOrders(list);
      setSelected(list[0] ?? null);
      if (list.length === 0) setError('No hay pedidos para ese email.');
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {!userEmail && (
        <form onSubmit={search} className="card p-6 flex flex-col sm:flex-row gap-3 animate-fade-up">
          <div className="flex-1">
            <label className="label" htmlFor="track-email">
              Email del pedido
            </label>
            <input
              id="track-email"
              type="email"
              required
              className="input mt-1"
              placeholder="cliente@bocado.app"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
          </div>
          <button type="submit" className="btn-lime sm:self-end shrink-0" disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar pedidos'}
          </button>
        </form>
      )}

      {userEmail && orders.length === 0 && !loading && (
        <p className="text-sm text-bocado-mute text-center card p-8">
          No tienes pedidos aún.{' '}
          <a href="/" className="underline">
            Ver catálogo
          </a>
        </p>
      )}

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
                      {eur(o.total_cents)} · {STATUS_LABEL[o.status]}
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
                <span className={`chip ${statusChipClass(selected.status)}`}>{STATUS_LABEL[selected.status]}</span>
              </div>

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
