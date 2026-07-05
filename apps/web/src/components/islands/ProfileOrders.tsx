import { useState } from 'react';
import {
  OrderTimeline,
  STATUS_LABEL,
  PAYMENT_LABEL,
  PAYMENT_STATUS_LABEL,
  customerOrderLabel,
  eur,
  fmtDateTime,
  statusChipClass,
  type OrderStatus,
} from './order-shared';
import CustomerLiveDelivery from './CustomerLiveDelivery';

interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  total_cents: number;
  subtotal_cents: number;
  delivery_fee_cents: number;
  created_at: string;
  invoice_id?: string | null;
  items: { dish_name: string; quantity: number; unit_price_cents: number }[];
  delivery_address: { street: string; number: string; city: string; postal_code: string };
  notes?: string | null;
  courier_accepted_at?: string | null;
}

export default function ProfileOrders({ orders }: { orders: Order[] }) {
  const [expanded, setExpanded] = useState<string | null>(orders[0]?.id ?? null);

  if (orders.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-bocado-mute animate-fade-up">
        Aún no has hecho ningún pedido.
        <br />
        <a href="/" className="underline mt-2 inline-block">
          Explorar el catálogo →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o, idx) => {
        const open = expanded === o.id;
        return (
          <article
            key={o.id}
            className="card overflow-hidden animate-fade-up"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <button
              type="button"
              className="w-full text-left p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 hover:bg-bocado-paper2/50 transition-colors"
              onClick={() => setExpanded(open ? null : o.id)}
              aria-expanded={open}
            >
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-bocado-mute">{fmtDateTime(o.created_at)}</p>
                <p className="font-semibold text-lg mt-1">{o.number}</p>
                <p className="text-sm text-bocado-mute mt-0.5">
                  {o.items.length} platos · {PAYMENT_LABEL[o.payment_method]}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold">{eur(o.total_cents)}</span>
                <span className={`chip ${statusChipClass(o.status)}`}>{customerOrderLabel(o)}</span>
                <span className="text-bocado-mute text-lg w-6 text-center" aria-hidden>
                  {open ? '−' : '+'}
                </span>
              </div>
            </button>

            {open && (
              <div className="border-t border-bocado-line px-5 sm:px-6 pb-6 pt-5 space-y-6 animate-fade-in">
                <div>
                  <p className="label mb-3">Estado del pedido</p>
                  <OrderTimeline status={o.status} />
                </div>

                <CustomerLiveDelivery
                  orderId={o.id}
                  orderStatus={o.status}
                  courierAcceptedAt={o.courier_accepted_at}
                />

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="card-static p-4">
                    <p className="label">Pago</p>
                    <p className="mt-2 font-medium">{PAYMENT_LABEL[o.payment_method]}</p>
                    <p className="text-bocado-mute text-xs mt-1">{PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status}</p>
                  </div>
                  <div className="card-static p-4">
                    <p className="label">Entrega</p>
                    <p className="mt-2">
                      {o.delivery_address.street} {o.delivery_address.number}
                      <br />
                      {o.delivery_address.postal_code} {o.delivery_address.city}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="label mb-2">Tu pedido</p>
                  <ul className="space-y-2">
                    {o.items.map((it, i) => (
                      <li key={i} className="flex justify-between text-sm py-2 border-b border-bocado-line last:border-0">
                        <span>
                          {it.quantity}× {it.dish_name}
                        </span>
                        <span className="font-medium">{eur(it.unit_price_cents * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-bocado-line text-sm space-y-1">
                    <div className="flex justify-between text-bocado-mute">
                      <span>Subtotal</span>
                      <span>{eur(o.subtotal_cents)}</span>
                    </div>
                    <div className="flex justify-between text-bocado-mute">
                      <span>Envío</span>
                      <span>{o.delivery_fee_cents ? eur(o.delivery_fee_cents) : 'Gratis'}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-1">
                      <span>Total</span>
                      <span>{eur(o.total_cents)}</span>
                    </div>
                  </div>
                </div>

                {o.notes && (
                  <p className="text-sm text-bocado-mute bg-bocado-paper2 rounded-xl px-4 py-3">
                    <span className="label block mb-1">Notas</span>
                    {o.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {o.payment_status !== 'paid' && (
                    <a href={`/pedido/ticket?order=${o.id}`} className="btn-lime text-sm">
                      Pagar · ver QR
                    </a>
                  )}
                  {o.invoice_id && (
                    <a href={`/api/invoices/${o.invoice_id}.pdf`} target="_blank" rel="noreferrer" className="btn-ghost text-sm">
                      Factura PDF
                    </a>
                  )}
                  <a href={`/pedido/ticket?order=${o.id}`} className="btn-ghost text-sm">
                    Ver ticket
                  </a>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
