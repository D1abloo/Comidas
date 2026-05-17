import { useEffect, useState } from 'react';
import { PAYMENT_LABEL, eur } from './order-shared';

type TicketPayload = {
  order: {
    number: string;
    payment_method: string;
    payment_status: string;
    total_cents: number;
    subtotal_cents: number;
    delivery_fee_cents: number;
    created_at: string;
    customer: { full_name: string; phone: string };
    items: { dish_name: string; quantity: number; unit_price_cents: number }[];
    delivery_address: { street: string; number: string; city: string; postal_code: string };
  };
  payment:
    | { kind: 'paid' }
    | { kind: 'bizum'; dataUrl: string; phone: string; amount: string; concept: string }
    | { kind: 'ticket'; dataUrl: string };
  company: { trade_name: string; phone: string; tax_id: string };
  printer: { name: string; paper_mm: number };
};

export default function TicketPrint({
  orderId,
  autoPrint = false,
  paperMm = 80,
}: {
  orderId: string;
  autoPrint?: boolean;
  paperMm?: number;
}) {
  const [data, setData] = useState<TicketPayload | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}/ticket`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      });
  }, [orderId]);

  useEffect(() => {
    if (!autoPrint || !data) return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [autoPrint, data]);

  if (!data) {
    return <p className="p-8 text-center text-sm">Preparando ticket…</p>;
  }

  const o = data.order;
  const qr = data.payment.kind !== 'paid' ? (data.payment as { dataUrl: string }).dataUrl : null;
  const width = data.printer.paper_mm || paperMm;

  return (
    <>
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-bocado-ink text-white p-3 flex flex-wrap gap-2 justify-center shadow-lg">
        <button type="button" className="btn-lime text-sm" onClick={() => window.print()}>
          🖨️ Imprimir ticket
        </button>
        <button type="button" className="btn-ghost text-sm border-white/30 text-white" onClick={() => window.close()}>
          Cerrar
        </button>
        <span className="text-xs text-white/60 self-center">
          Impresora: {data.printer.name || 'Predeterminada del sistema'} · {width} mm
        </span>
      </div>

      <article className={`thermal-ticket thermal-${width} mx-auto`} data-paper-mm={width}>
        <header className="ticket-center">
          <p className="ticket-bold ticket-lg">{data.company.trade_name}</p>
          <p className="ticket-sm">CIF {data.company.tax_id}</p>
          <p className="ticket-sm">{data.company.phone}</p>
          <p className="ticket-divider">···················</p>
          <p className="ticket-bold">PEDIDO {o.number}</p>
          <p className="ticket-sm">{new Date(o.created_at).toLocaleString('es-ES')}</p>
        </header>

        <section className="ticket-section">
          <p className="ticket-bold">CLIENTE</p>
          <p>{o.customer.full_name}</p>
          <p>{o.customer.phone}</p>
          <p className="ticket-sm">
            {o.delivery_address.street} {o.delivery_address.number}
            <br />
            {o.delivery_address.postal_code} {o.delivery_address.city}
          </p>
        </section>

        <section className="ticket-section">
          <p className="ticket-bold">DETALLE</p>
          {o.items.map((it, i) => (
            <div key={i} className="ticket-line">
              <span>
                {it.quantity}x {it.dish_name}
              </span>
              <span>{eur(it.unit_price_cents * it.quantity)}</span>
            </div>
          ))}
          <p className="ticket-divider">···················</p>
          <div className="ticket-line">
            <span>Subtotal</span>
            <span>{eur(o.subtotal_cents)}</span>
          </div>
          <div className="ticket-line">
            <span>Envío</span>
            <span>{eur(o.delivery_fee_cents)}</span>
          </div>
          <p className="ticket-line ticket-bold ticket-lg">
            <span>TOTAL</span>
            <span>{eur(o.total_cents)}</span>
          </p>
          <p className="ticket-sm ticket-center mt-2">
            {PAYMENT_LABEL[o.payment_method]} · {o.payment_status}
          </p>
        </section>

        {qr && (
          <section className="ticket-section ticket-center">
            <p className="ticket-bold">PAGAR CON QR</p>
            {data.payment.kind === 'bizum' && (
              <p className="ticket-sm">
                Bizum {data.payment.phone}
                <br />
                {data.payment.amount} € — {data.payment.concept}
              </p>
            )}
            <img src={qr} alt="QR pago" className="ticket-qr" />
          </section>
        )}

        {data.payment.kind === 'paid' && (
          <p className="ticket-center ticket-bold">*** PAGADO ***</p>
        )}

        <footer className="ticket-section ticket-center ticket-sm">
          <p>Gracias por tu pedido</p>
          <p>bocado.app</p>
        </footer>
      </article>
    </>
  );
}
