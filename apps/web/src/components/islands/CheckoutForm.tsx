import { useState } from 'react';
import { useCart } from './cart-store';

const eur = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100);

type PM = 'tpv' | 'cash' | 'bizum';

interface Props { defaultName?: string; defaultEmail?: string }

export default function CheckoutForm({ defaultName = '', defaultEmail = '' }: Props) {
  const { lines, total, clear } = useCart();
  const [payment, setPayment] = useState<PM>('tpv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bizum, setBizum] = useState<null | {
    qr: string;
    phone: string;
    concept: string;
    amount: string;
    order_id: string;
    payment_token: string;
    access_token: string;
  }>(null);

  const subtotal = total();
  const free = subtotal >= 2500;
  const fee = free ? 0 : 199;
  const grand = subtotal + fee;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lines.length) return;
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const body = {
        customer: {
          full_name: String(fd.get('name') ?? ''),
          email: String(fd.get('email') ?? ''),
          phone: String(fd.get('phone') ?? ''),
          tax_id: (String(fd.get('tax_id') ?? '') || null) as any,
        },
        delivery_address: {
          street: String(fd.get('street') ?? ''),
          number: String(fd.get('number') ?? ''),
          floor: String(fd.get('floor') ?? '') || null,
          city: String(fd.get('city') ?? ''),
          postal_code: String(fd.get('postal_code') ?? ''),
          country: 'España',
          notes: String(fd.get('notes') ?? '') || null,
        },
        items: lines.map((l) => ({ dish_id: l.dish_id, quantity: l.quantity })),
        payment_method: payment,
      };
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Error creando pedido');
      const order = data.order;
      const paymentToken = data.payment_token as string;
      const accessToken = data.access_token as string;

      const pay = await fetch('/api/payments/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, payment_token: paymentToken }),
      });
      const payData = await pay.json();
      if (!pay.ok) throw new Error(payData.error ?? 'Error iniciando pago');

      if (payData.method === 'bizum') {
        setBizum({
          qr: payData.qr_data_url,
          phone: payData.phone,
          concept: payData.concept,
          amount: payData.amount,
          order_id: order.id,
          payment_token: paymentToken,
          access_token: accessToken,
        });
      } else if (payData.method === 'cash') {
        clear();
        location.href = `/checkout/ok?order=${order.id}&token=${encodeURIComponent(accessToken)}`;
      } else if (payData.method === 'tpv') {
        clear();
        location.href = `${payData.redirect_url}${payData.redirect_url.includes('?') ? '&' : '?'}token=${encodeURIComponent(accessToken)}`;
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  if (bizum) {
    return (
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="card p-8 text-center">
          <h3 className="font-semibold text-xl tracking-tight">Paga con Bizum</h3>
          <p className="text-sm text-bocado-mute mt-1">Escanea el código con tu app bancaria</p>
          <img src={bizum.qr} alt="QR Bizum" className="mx-auto mt-6 w-64 h-64" />
          <p className="mt-4 text-sm">Importe: <b>{bizum.amount} €</b></p>
          <p className="text-sm">Teléfono empresa: <b>{bizum.phone}</b></p>
          <p className="text-sm">Concepto: <b>{bizum.concept}</b></p>
        </div>
        <div className="card p-8">
          <h4 className="font-semibold">Confirmar pago</h4>
          <p className="text-sm text-bocado-mute mt-1">
            Cuando hayas enviado el Bizum, pulsa el botón para que la empresa marque tu pedido como pagado.
          </p>
          <button
            onClick={async () => {
              const r = await fetch('/api/payments/bizum-confirm', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ order_id: bizum.order_id, payment_token: bizum.payment_token }),
              });
              const data = await r.json();
              clear();
              const sep = data.redirect_url.includes('?') ? '&' : '?';
              location.href = `${data.redirect_url}${sep}token=${encodeURIComponent(bizum.access_token)}`;
            }}
            className="btn-lime mt-6 w-full"
          >
            He enviado el Bizum
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid md:grid-cols-[1.4fr_1fr] gap-8">
      <div className="space-y-8">
        <section className="card p-8">
          <h2 className="font-semibold tracking-tight">1. Datos del cliente</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <label className="col-span-2"><span className="label">Nombre completo</span><input required name="name" defaultValue={defaultName} className="input mt-1" /></label>
            <label><span className="label">Email</span><input required type="email" name="email" defaultValue={defaultEmail} className="input mt-1" /></label>
            <label><span className="label">Teléfono</span><input required name="phone" className="input mt-1" /></label>
            <label className="col-span-2"><span className="label">CIF / NIF (opcional, para factura)</span><input name="tax_id" className="input mt-1" /></label>
          </div>
        </section>

        <section className="card p-8">
          <h2 className="font-semibold tracking-tight">2. Dirección de entrega</h2>
          <div className="mt-6 grid grid-cols-6 gap-4 text-sm">
            <label className="col-span-4"><span className="label">Calle</span><input required name="street" className="input mt-1" /></label>
            <label className="col-span-2"><span className="label">Número</span><input required name="number" className="input mt-1" /></label>
            <label className="col-span-2"><span className="label">Piso</span><input name="floor" className="input mt-1" /></label>
            <label className="col-span-2"><span className="label">CP</span><input required name="postal_code" className="input mt-1" /></label>
            <label className="col-span-2"><span className="label">Ciudad</span><input required name="city" defaultValue="Madrid" className="input mt-1" /></label>
            <label className="col-span-6"><span className="label">Notas para el repartidor</span><textarea name="notes" rows={2} className="input mt-1" /></label>
          </div>
        </section>

        <section className="card p-8">
          <h2 className="font-semibold tracking-tight">3. Método de pago</h2>
          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            {(['tpv', 'bizum', 'cash'] as const).map((m) => (
              <button
                type="button" key={m}
                onClick={() => setPayment(m)}
                className={`rounded-2xl border p-4 text-left transition ${payment === m ? 'border-bocado-ink bg-bocado-ink/[0.04]' : 'border-bocado-line hover:border-bocado-ink/40'}`}
              >
                <div className="text-xs uppercase tracking-wider text-bocado-mute">{m === 'tpv' ? 'Tarjeta' : m === 'bizum' ? 'Bizum' : 'Efectivo'}</div>
                <div className="mt-1 font-medium">
                  {m === 'tpv' && 'Pago con TPV (demo)'}
                  {m === 'bizum' && 'QR con número de empresa'}
                  {m === 'cash' && 'Al recibir el pedido'}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className="card p-8 h-fit md:sticky md:top-24">
        <h3 className="font-semibold tracking-tight">Resumen</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.dish_id} className="flex justify-between gap-3">
              <span className="truncate">{l.quantity}× {l.dish_name}</span>
              <span>{eur(l.unit_price_cents * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <hr className="my-4 hairline" />
        <div className="flex justify-between text-sm"><span className="text-bocado-mute">Subtotal</span><span>{eur(subtotal)}</span></div>
        <div className="flex justify-between text-sm">
          <span className="text-bocado-mute">Envío</span>
          <span>{free ? <span className="text-emerald-600">Gratis</span> : eur(fee)}</span>
        </div>
        <div className="flex justify-between mt-3 font-semibold"><span>Total</span><span>{eur(grand)}</span></div>
        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        <button disabled={loading || lines.length === 0} className="btn-primary w-full mt-6 disabled:opacity-40">
          {loading ? 'Procesando…' : 'Pagar y confirmar pedido'}
        </button>
        <p className="text-xs text-bocado-mute mt-3 text-center">
          Recibirás aviso por email cuando se actualice tu pedido.
        </p>
      </aside>
    </form>
  );
}
