import { useState } from 'react';
import {
  OrderTimeline,
  STATUS_LABEL,
  PAYMENT_LABEL,
  PAYMENT_STATUS_LABEL,
  eur,
  fmtDateTime,
  statusChipClass,
  type OrderStatus,
} from './order-shared';

const STATUS = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'] as const;

export default function OrdersBoard({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  async function setStatus(id: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (selected?.id === id) setSelected((s: any) => (s ? { ...s, status } : s));
    await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async function genInvoice(id: string) {
    const r = await fetch('/api/invoices/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ order_id: id }),
    });
    const data = await r.json();
    if (data.invoice) {
      const patch = (o: any) => (o.id === id ? { ...o, invoice_id: data.invoice.id } : o);
      setOrders((prev) => prev.map(patch));
      if (selected?.id === id) setSelected(patch(selected));
      window.open(`/api/invoices/${data.invoice.id}.pdf`, '_blank');
    }
  }

  function openOrder(o: any) {
    setSelected(o);
    setMobileDetail(true);
  }

  return (
    <section className="admin-content space-y-6 !py-0">
            <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFilter('')} className={`chip ${!filter ? '!bg-bocado-ink !text-white' : ''}`}>
          Todos ({orders.length})
        </button>
        {STATUS.map((s) => {
          const n = orders.filter((o) => o.status === s).length;
          return (
            <button key={s} type="button" onClick={() => setFilter(s)} className={`chip ${filter === s ? '!bg-bocado-ink !text-white' : ''}`}>
              {STATUS_LABEL[s]} ({n})
            </button>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="admin-frame">
                    <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bocado-paper2 text-bocado-mute">
                <tr className="text-left">
                  <th className="font-normal py-3 px-5">Pedido</th>
                  <th className="font-normal">Cliente</th>
                  <th className="font-normal">Total</th>
                  <th className="font-normal">Estado</th>
                  <th className="font-normal text-right pr-5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className={`border-t border-bocado-line cursor-pointer transition-colors ${selected?.id === o.id ? 'bg-bocado-lime/15' : 'hover:bg-bocado-paper2/60'}`}
                    onClick={() => openOrder(o)}
                  >
                    <td className="py-3 px-5">
                      <div className="font-medium">{o.number}</div>
                      <div className="text-xs text-bocado-mute">{fmtDateTime(o.created_at)}</div>
                    </td>
                    <td>
                      {o.customer.full_name}
                      <div className="text-xs text-bocado-mute">{o.customer.email}</div>
                    </td>
                    <td>{eur(o.total_cents)}</td>
                    <td>
                      <span className={`chip text-[10px] ${statusChipClass(o.status)}`}>{STATUS_LABEL[o.status]}</span>
                    </td>
                    <td className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                      <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="chip text-xs">
                        {STATUS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-bocado-mute">
                      No hay pedidos en este estado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-bocado-line">
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                className="w-full text-left p-4 hover:bg-bocado-paper2/50"
                onClick={() => openOrder(o)}
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-medium">{o.number}</div>
                    <div className="text-xs text-bocado-mute">{o.customer.full_name}</div>
                  </div>
                  <span className={`chip text-[10px] h-fit ${statusChipClass(o.status)}`}>{STATUS_LABEL[o.status]}</span>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-bocado-mute">{fmtDateTime(o.created_at)}</span>
                  <span className="font-semibold">{eur(o.total_cents)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <p className="p-8 text-center text-bocado-mute text-sm">Sin pedidos.</p>}
          </div>
        </div>

        <aside className={`card p-5 space-y-5 xl:sticky xl:top-24 ${mobileDetail ? 'fixed inset-0 z-50 xl:relative xl:inset-auto overflow-y-auto xl:max-h-[calc(100vh-120px)]' : 'hidden xl:block'}`}>
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="label">{fmtDateTime(selected.created_at)}</p>
                  <h3 className="text-lg font-semibold">{selected.number}</h3>
                </div>
                <button type="button" className="xl:hidden w-9 h-9 rounded-full hover:bg-bocado-ink/5" onClick={() => setMobileDetail(false)} aria-label="Cerrar">
                  ✕
                </button>
              </div>

              <OrderTimeline status={selected.status as OrderStatus} />

              <div className="text-sm space-y-2">
                <p>
                  <span className="label block">Cliente</span>
                  {selected.customer.full_name}
                  <br />
                  <span className="text-bocado-mute">{selected.customer.email}</span>
                </p>
                <p>
                  <span className="label block">Pago</span>
                  {PAYMENT_LABEL[selected.payment_method]} · {PAYMENT_STATUS_LABEL[selected.payment_status] ?? selected.payment_status}
                </p>
                <p>
                  <span className="label block">Dirección</span>
                  {selected.delivery_address.street} {selected.delivery_address.number}, {selected.delivery_address.city}
                </p>
              </div>

              <ul className="text-sm border-t border-bocado-line pt-3 space-y-2">
                {selected.items.map((it: any, i: number) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {it.quantity}× {it.dish_name}
                    </span>
                    <span>{eur(it.unit_price_cents * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-right font-semibold">{eur(selected.total_cents)}</p>

              <div className="flex flex-col gap-2 pt-2">
                <select value={selected.status} onChange={(e) => setStatus(selected.id, e.target.value)} className="input text-sm">
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-lime w-full text-sm" onClick={() => genInvoice(selected.id)}>
                  Generar factura
                </button>
                {selected.invoice_id && (
                  <a href={`/api/invoices/${selected.invoice_id}.pdf`} target="_blank" rel="noreferrer" className="btn-ghost text-sm text-center">
                    Ver PDF
                  </a>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-bocado-mute text-center py-12">Selecciona un pedido para ver el detalle.</p>
          )}
        </aside>
      </div>

      {mobileDetail && selected && <div className="fixed inset-0 bg-black/30 z-40 xl:hidden" onClick={() => setMobileDetail(false)} aria-hidden />}
    </section>
  );
}
