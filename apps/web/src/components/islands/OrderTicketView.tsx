import { useEffect, useState } from 'react';
import { PAYMENT_LABEL, PAYMENT_STATUS_LABEL, eur } from './order-shared';

type TicketData = {
  order: {
    number: string;
    payment_method: string;
    payment_status: string;
    total_cents: number;
    items: { dish_name: string; quantity: number; unit_price_cents: number }[];
  };
  invoice: { number: string; pdf_url: string } | null;
  payment:
    | { kind: 'paid' }
    | { kind: 'bizum'; dataUrl: string; phone: string; amount: string; concept: string }
    | { kind: 'ticket'; dataUrl: string };
  company: { trade_name: string; phone: string };
  formatted_total: string;
};

export default function OrderTicketView({
  orderId,
  publicMode = true,
  accessToken,
}: {
  orderId: string;
  publicMode?: boolean;
  accessToken?: string;
}) {
  const [data, setData] = useState<TicketData | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token =
      accessToken ??
      (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null);
    const q = token ? `?token=${encodeURIComponent(token)}` : '';
    const url = publicMode ? `/api/orders/${orderId}/ticket-public${q}` : `/api/orders/${orderId}/ticket`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr('Pedido no encontrado');
        else setData(d);
      })
      .catch(() => setErr('No se pudo cargar el ticket'));
  }, [orderId, publicMode, accessToken]);

  if (err) return <p className="text-center text-red-600 py-12">{err}</p>;
  if (!data) return <p className="text-center text-bocado-mute py-12 animate-pulse">Cargando ticket…</p>;

  const paid = data.payment.kind === 'paid';
  const qrUrl = data.payment.kind === 'bizum' || data.payment.kind === 'ticket' ? data.payment.dataUrl : null;

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <p className="premium-eyebrow">{data.company.trade_name}</p>
        <h1 className="font-display text-3xl mt-1">Ticket de pedido</h1>
        <p className="text-2xl font-bold mt-2">{data.order.number}</p>
        <p className="text-sm text-bocado-mute mt-1">
          {PAYMENT_LABEL[data.order.payment_method]} ·{' '}
          {PAYMENT_STATUS_LABEL[data.order.payment_status] ?? data.order.payment_status}
        </p>
      </div>

      {!paid && qrUrl && (
        <div className="premium-panel text-center border-2 border-bocado-lime/40 shadow-glow">
          <p className="text-sm font-bold text-bocado-ink">Escanea para pagar</p>
          {data.payment.kind === 'bizum' && (
            <p className="text-xs text-bocado-mute mt-1">
              Bizum a {data.payment.phone} · {data.payment.amount} €
              <br />
              Concepto: {data.payment.concept}
            </p>
          )}
          <img src={qrUrl} alt="QR de pago" className="mx-auto mt-4 w-52 h-52 rounded-2xl border border-bocado-line" />
          <p className="text-lg font-bold mt-4">{data.formatted_total}</p>
        </div>
      )}

      {paid && (
        <div className="rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-center py-4 font-bold">
          ✓ Pedido pagado
        </div>
      )}

      <div className="premium-panel text-sm space-y-2">
        {data.order.items.map((it, i) => (
          <div key={i} className="flex justify-between">
            <span>
              {it.quantity}× {it.dish_name}
            </span>
            <span>{eur(it.unit_price_cents * it.quantity)}</span>
          </div>
        ))}
        <div className="border-t border-bocado-line pt-2 flex justify-between font-bold text-base">
          <span>Total</span>
          <span>{data.formatted_total}</span>
        </div>
      </div>

      {data.invoice && (
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={data.invoice.pdf_url} target="_blank" rel="noreferrer" className="btn-lime flex-1 text-center">
            Descargar factura PDF
          </a>
          <a href="/pedidos" className="btn-ghost flex-1 text-center">
            Mis pedidos
          </a>
        </div>
      )}
    </div>
  );
}
