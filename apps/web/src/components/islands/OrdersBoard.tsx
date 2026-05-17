import { useState } from 'react';

const eur = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100);
const STATUS = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación',
  delivering: 'En reparto', delivered: 'Entregado', cancelled: 'Cancelado',
};
const PAYMENT_LABEL: Record<string, string> = { tpv: 'Tarjeta', cash: 'Efectivo', bizum: 'Bizum' };

export default function OrdersBoard({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<string>('');

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  async function setStatus(id: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
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
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, invoice_id: data.invoice.id } : o)));
      window.open(`/api/invoices/${data.invoice.id}.pdf`, '_blank');
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter('')} className={`chip ${!filter ? '!bg-bocado-ink !text-white' : ''}`}>Todos</button>
        {STATUS.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`chip ${filter === s ? '!bg-bocado-ink !text-white' : ''}`}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bocado-paper2 text-bocado-mute">
            <tr className="text-left">
              <th className="font-normal py-3 px-5">Pedido</th>
              <th className="font-normal">Cliente</th>
              <th className="font-normal">Total</th>
              <th className="font-normal">Pago</th>
              <th className="font-normal">Estado</th>
              <th className="font-normal text-right pr-5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-bocado-line">
                <td className="py-3 px-5 font-medium">{o.number}</td>
                <td>
                  {o.customer.full_name}
                  <div className="text-xs text-bocado-mute">{o.customer.email}</div>
                </td>
                <td>{eur(o.total_cents)}</td>
                <td><span className="chip uppercase text-[10px]">{PAYMENT_LABEL[o.payment_method]}</span></td>
                <td>
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="chip">
                    {STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td className="text-right pr-5 space-x-1">
                  <button className="btn-ghost text-xs" onClick={() => genInvoice(o.id)}>Generar factura</button>
                  {o.invoice_id && (
                    <a href={`/api/invoices/${o.invoice_id}.pdf`} target="_blank" className="btn-ghost text-xs">PDF</a>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-bocado-mute">No hay pedidos en este estado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
