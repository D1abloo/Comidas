import { useCallback, useState } from 'react';
import PrinterDetect from './PrinterDetect.tsx';

export default function SettingsForm({ initialCompany, initialSettings }: { initialCompany: any; initialSettings: any }) {
  const [company, setCompany] = useState(initialCompany);
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState<string | null>(null);

  const onPrinterSelect = useCallback((name: string, enable?: boolean) => {
    setSettings((prev: typeof initialSettings) => ({
      ...prev,
      printer_name: name,
      ...(enable ? { printer_enabled: true } : {}),
    }));
  }, []);

  async function save() {
    const r = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ company, settings }),
    });
    if (r.ok) {
      setSaved('Guardado correctamente.');
      setTimeout(() => setSaved(null), 2400);
    }
  }

  return (
    <section className="grid lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h3 className="font-semibold tracking-tight">Datos fiscales</h3>
        <p className="text-sm text-bocado-mute">Aparecerán en todas las facturas PDF.</p>
        <div className="mt-5 grid gap-3 text-sm">
          <F label="Nombre fiscal"><input className="input" value={company.legal_name} onChange={(e) => setCompany({ ...company, legal_name: e.target.value })} /></F>
          <F label="Nombre comercial"><input className="input" value={company.trade_name} onChange={(e) => setCompany({ ...company, trade_name: e.target.value })} /></F>
          <F label="CIF / NIF"><input className="input" value={company.tax_id} onChange={(e) => setCompany({ ...company, tax_id: e.target.value })} /></F>
          <F label="Dirección fiscal"><input className="input" value={company.fiscal_address} onChange={(e) => setCompany({ ...company, fiscal_address: e.target.value })} /></F>
          <div className="grid grid-cols-3 gap-3">
            <F label="CP"><input className="input" value={company.fiscal_postal_code} onChange={(e) => setCompany({ ...company, fiscal_postal_code: e.target.value })} /></F>
            <div className="col-span-2"><F label="Ciudad"><input className="input" value={company.fiscal_city} onChange={(e) => setCompany({ ...company, fiscal_city: e.target.value })} /></F></div>
          </div>
          <F label="Email contacto"><input className="input" value={company.contact_email} onChange={(e) => setCompany({ ...company, contact_email: e.target.value })} /></F>
          <F label="Teléfono contacto"><input className="input" value={company.contact_phone} onChange={(e) => setCompany({ ...company, contact_phone: e.target.value })} /></F>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold tracking-tight">Bizum</h3>
        <p className="text-sm text-bocado-mute">Este número se usa para generar el QR de pago Bizum en el checkout.</p>
        <div className="mt-5 grid gap-3 text-sm">
          <F label="Número Bizum (E.164)"><input className="input" placeholder="+34600000000" value={settings.bizum_phone ?? ''} onChange={(e) => setSettings({ ...settings, bizum_phone: e.target.value })} /></F>
          <F label="Concepto del QR"><input className="input" value={settings.bizum_concept_template} onChange={(e) => setSettings({ ...settings, bizum_concept_template: e.target.value })} /></F>
        </div>

        <h3 className="font-semibold tracking-tight mt-8">Métodos de pago</h3>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.tpv_enabled} onChange={(e) => setSettings({ ...settings, tpv_enabled: e.target.checked })} /> Tarjeta (TPV)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.cash_enabled} onChange={(e) => setSettings({ ...settings, cash_enabled: e.target.checked })} /> Efectivo</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.bizum_enabled} onChange={(e) => setSettings({ ...settings, bizum_enabled: e.target.checked })} /> Bizum</label>
        </div>

        <h3 className="font-semibold tracking-tight mt-8">Avisos automáticos</h3>
        <div className="mt-3 grid gap-3 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.email_notifications_enabled} onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked })} /> Email</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.whatsapp_notifications_enabled} onChange={(e) => setSettings({ ...settings, whatsapp_notifications_enabled: e.target.checked })} /> WhatsApp</label>
          <F label="Teléfono WhatsApp empresa"><input className="input" value={settings.whatsapp_business_phone ?? ''} onChange={(e) => setSettings({ ...settings, whatsapp_business_phone: e.target.value })} /></F>
        </div>

        <h3 className="font-semibold tracking-tight mt-8">Impresora de tickets</h3>
        <p className="text-sm text-bocado-mute mt-1">
          Imprime pedidos en impresora térmica desde el navegador.{' '}
          <a href="/admin/impresion" className="underline text-bocado-violet">
            Guía de instalación
          </a>
        </p>
        <div className="mt-3 grid gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.printer_enabled ?? false}
              onChange={(e) => setSettings({ ...settings, printer_enabled: e.target.checked })}
            />
            Activar impresión de tickets
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.auto_print_on_order ?? false}
              onChange={(e) => setSettings({ ...settings, auto_print_on_order: e.target.checked })}
            />
            Abrir ticket automáticamente al recibir pedido
          </label>
          <F label="Nombre de la impresora (referencia)">
            <input
              className="input"
              placeholder="Ej. Cocina EPSON TM-T20"
              value={settings.printer_name ?? ''}
              onChange={(e) => setSettings({ ...settings, printer_name: e.target.value })}
            />
          </F>
          <F label="Ancho del papel">
            <select
              className="input"
              value={settings.printer_paper_mm ?? 80}
              onChange={(e) =>
                setSettings({ ...settings, printer_paper_mm: parseInt(e.target.value, 10) as 58 | 80 })
              }
            >
              <option value={58}>58 mm (estrecho)</option>
              <option value={80}>80 mm (estándar)</option>
            </select>
          </F>
          <PrinterDetect
            paperMm={(settings.printer_paper_mm ?? 80) as 58 | 80}
            printerName={settings.printer_name ?? ''}
            onSelect={onPrinterSelect}
          />
        </div>

        <h3 className="font-semibold tracking-tight mt-8">Facturación</h3>
        <div className="mt-3 grid gap-3 text-sm">
          <F label="Prefijo de número de factura"><input className="input" value={settings.invoice_prefix} onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Gastos de envío (céntimos)"><input type="number" className="input" value={settings.delivery_fee_cents} onChange={(e) => setSettings({ ...settings, delivery_fee_cents: parseInt(e.target.value, 10) })} /></F>
            <F label="Envío gratis desde (céntimos)"><input type="number" className="input" value={settings.free_delivery_from_cents} onChange={(e) => setSettings({ ...settings, free_delivery_from_cents: parseInt(e.target.value, 10) })} /></F>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button className="btn-lime" onClick={save}>Guardar todo</button>
          {saved && <span className="text-sm text-emerald-600">{saved}</span>}
        </div>
      </div>
    </section>
  );
}

function F({ label, children }: { label: string; children: any }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
