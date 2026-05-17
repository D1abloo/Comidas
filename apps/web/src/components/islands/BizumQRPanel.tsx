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
  const [amount, setAmount] = useState('1.00');
  const [lastUpdate, setLastUpdate] = useState(updatedAt ?? '');

  async function regenerate() {
    setLoading(true);
    try {
      const r = await fetch('/api/payments/bizum-qr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount_cents: Math.round(parseFloat(amount) * 100) || 100 }),
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

  return (
    
    <div className="admin-frame p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">QR Bizum de la empresa</p>
          <p className="text-sm text-bocado-mute mt-1 max-w-md">
            Si cambias el teléfono Bizum o el concepto, regenera el código para que los clientes escaneen el correcto.
          </p>
          <p className="text-xs text-bocado-mute mt-2">
            Teléfono: <strong className="text-bocado-ink">{phone || '—'}</strong> · Plantilla: {conceptTemplate}
          </p>
          {lastUpdate && (
            <p className="text-[10px] text-bocado-mute mt-1">Última regeneración: {new Date(lastUpdate).toLocaleString('es-ES')}</p>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs">
            <span className="label block mb-1">Importe demo (€)</span>
            <input className="input w-24 text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <button type="button" className="btn-lime" onClick={regenerate} disabled={loading || !phone}>
            {loading ? 'Generando…' : 'Regenerar QR'}
          </button>
        </div>
      </div>

      {qr && (
        <div className="mt-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start animate-fade-in">
          <div className="p-4 bg-white rounded-2xl border border-bocado-line shadow-card">
            <img src={qr} alt="QR Bizum" className="w-48 h-48" />
          </div>
          <div className="text-xs text-bocado-mute break-all max-w-md">
            <p className="label mb-1">Payload</p>
            {payload}
          </div>
        </div>
      )}
    </div>
  );
}
