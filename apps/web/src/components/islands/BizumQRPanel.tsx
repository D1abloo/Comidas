import { useState } from 'react';

interface Props {
  phone: string;
  conceptTemplate: string;
  updatedAt?: string;
}

export default function BizumQRPanel({ phone, conceptTemplate, updatedAt }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [payload, setPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('12.50');
  const [concept, setConcept] = useState('BocadO pedido');
  const [lastUpdate, setLastUpdate] = useState(updatedAt ?? '');

  async function regenerate() {
    setLoading(true);
    try {
      const r = await fetch('/api/payments/bizum-qr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount_cents: Math.round(parseFloat(amount.replace(',', '.')) * 100) || 100,
          concept: concept || undefined,
        }),
      });
      const data = await r.json();
      if (data.qr_data_url) {
        setQr(data.qr_data_url);
        setPayload(data.qr_payload);
        setLastUpdate(data.updated_at);
      }
    } finally {
      setLoading(false);
    }
  }

  const telHref = phone ? `tel:${phone.replace(/\s/g, '')}` : undefined;

  return (
    <div className="admin-frame p-5 sm:p-8 font-admin bg-gradient-to-br from-white via-emerald-50/40 to-bocado-lime/10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Pagos Bizum</p>
          <h2 className="text-xl sm:text-2xl font-bold text-bocado-ink mt-1">QR con teléfono de cobro</h2>
          <p className="text-sm text-bocado-mute mt-2 max-w-lg">
            Genera un código QR escaneable con el móvil de la empresa. Los clientes pagan al instante sin escribir el
            número a mano.
          </p>
          {phone ? (
            <a href={telHref} className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-bocado-ink text-white font-semibold text-sm hover:bg-emerald-700 transition-colors">
              <span aria-hidden>📱</span>
              {phone}
            </a>
          ) : (
            <p className="text-sm text-red-600 mt-3">Configura el teléfono Bizum en Ajustes.</p>
          )}
          <p className="text-xs text-bocado-mute mt-3">
            Plantilla de concepto: <strong className="text-bocado-ink">{conceptTemplate}</strong>
          </p>
          {lastUpdate && (
            <p className="text-[10px] text-bocado-mute mt-1">Última regeneración: {new Date(lastUpdate).toLocaleString('es-ES')}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-end gap-3 w-full sm:w-auto">
          <label className="text-xs w-full sm:w-auto">
            <span className="label block mb-1">Importe (€)</span>
            <input className="input w-full sm:w-28 font-semibold" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="text-xs w-full sm:w-auto">
            <span className="label block mb-1">Concepto</span>
            <input className="input w-full sm:w-44" value={concept} onChange={(e) => setConcept(e.target.value)} />
          </label>
          <button type="button" className="btn-lime w-full sm:w-auto font-bold" onClick={regenerate} disabled={loading || !phone}>
            {loading ? 'Generando…' : 'Generar QR'}
          </button>
        </div>
      </div>

      {qr && (
        <div className="mt-8 flex flex-col lg:flex-row gap-8 items-center lg:items-start animate-fade-in">
          <div className="relative p-5 bg-white rounded-3xl border-2 border-emerald-400/50 shadow-[0_16px_48px_-12px_rgba(16,185,129,.35)]">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-bocado-lime/40 to-emerald-400/30 blur-lg -z-10 animate-pulse-soft" aria-hidden />
            <img src={qr} alt="QR Bizum para pagar" className="w-52 h-52 sm:w-56 sm:h-56" />
            <p className="text-center text-xs font-bold text-emerald-800 mt-3">Escanear para pagar</p>
          </div>
          <div className="text-sm max-w-md space-y-3">
            <div className="p-4 rounded-2xl bg-white/80 border border-bocado-line">
              <p className="label mb-1">Teléfono vinculado</p>
              <p className="font-bold text-lg">{phone}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 border border-bocado-line text-xs text-bocado-mute break-all">
              <p className="label mb-1">Payload QR</p>
              {payload}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
