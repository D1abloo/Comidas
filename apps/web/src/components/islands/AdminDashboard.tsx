import { useEffect, useState } from 'react';
import { ADMIN_NAV_FLAT } from '../../config/admin-nav';
import { statusChipClass, STATUS_LABEL, eur, fmtDateTime } from './order-shared';
import type { DashboardData } from './AdminDashboard.types';

export type { DashboardData } from './AdminDashboard.types';

const PIPELINE = [
  { key: 'pending', label: 'Pendiente', color: 'bg-violet-500', emoji: '📥' },
  { key: 'confirmed', label: 'Confirmado', color: 'bg-sky-500', emoji: '✓' },
  { key: 'preparing', label: 'Cocinando', color: 'bg-amber-400', emoji: '👨‍🍳' },
  { key: 'delivering', label: 'En reparto', color: 'bg-orange-500', emoji: '🛵' },
] as const;

function AnimatedNumber({ value, format = 'eur' }: { value: number; format?: 'eur' | 'int' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const end = value;
    const t0 = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  if (format === 'int') return <>{display}</>;
  return <>{eur(display)}</>;
}

export default function AdminDashboard({ data }: { data: DashboardData }) {
  const maxSeries = Math.max(...data.series.map((s) => s.total), 1);
  const maxPay = Math.max(data.payments.bizum, data.payments.tpv, data.payments.cash, 1);
  const pipelineMax = Math.max(...PIPELINE.map((p) => data.pipeline[p.key as keyof typeof data.pipeline]), 1);

  const statCards = [
    { label: 'Ventas hoy', value: data.stats.salesToday, fmt: 'eur' as const, accent: 'bg-emerald-400', text: 'text-emerald-800', emoji: '💶' },
    { label: 'Pedidos hoy', value: data.stats.ordersToday, fmt: 'int' as const, accent: 'bg-sky-400', text: 'text-sky-800', emoji: '📦' },
    { label: 'Ticket medio', value: data.stats.avgTicket, fmt: 'eur' as const, accent: 'bg-violet-400', text: 'text-violet-800', emoji: '🧾' },
    { label: 'En cocina / reparto', value: data.stats.activeOrders, fmt: 'int' as const, accent: 'bg-orange-400', text: 'text-orange-700', emoji: '🔥' },
    { label: 'Bizum por confirmar', value: data.stats.pendingBizum, fmt: 'int' as const, accent: 'bg-amber-400', text: 'text-amber-900', emoji: '📱' },
    { label: 'Platos agotados', value: data.stats.outOfStock, fmt: 'int' as const, accent: 'bg-red-400', text: 'text-red-700', emoji: '⚠️' },
  ];

  const shortcuts = ADMIN_NAV_FLAT.filter((n) => n.href !== '/admin');

  return (
    <section className="space-y-7 sm:space-y-8 font-admin admin-dashboard">
      {(data.stats.pendingBizum > 0 || data.stats.activeOrders > 0) && (
        <div className="admin-alert-banner animate-slide-down">
          <span className="text-xl">🚨</span>
          <div className="flex-1 text-sm">
            {data.stats.activeOrders > 0 && (
              <strong>
                {data.stats.activeOrders} pedido{data.stats.activeOrders !== 1 ? 's' : ''} activo
                {data.stats.activeOrders !== 1 ? 's' : ''}
              </strong>
            )}
            {data.stats.activeOrders > 0 && data.stats.pendingBizum > 0 && ' · '}
            {data.stats.pendingBizum > 0 && (
              <span className="text-amber-900">{data.stats.pendingBizum} Bizum esperando confirmación</span>
            )}
          </div>
          <a href="/admin/pedidos" className="admin-alert-cta">
            Gestionar →
          </a>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((c, i) => (
          <div
            key={c.label}
            className="admin-stat-card admin-stat-pop"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-25 blur-2xl pointer-events-none ${c.accent}`} aria-hidden />
            <span className="admin-stat-icon">{c.emoji}</span>
            <div className="label mt-3">{c.label}</div>
            <div className={`mt-1 text-lg sm:text-xl font-bold ${c.text}`}>
              <AnimatedNumber value={c.value} format={c.fmt} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="admin-frame lg:col-span-2 admin-panel-enter">
          <div className="admin-frame-header">
            <div>
              <h3 className="admin-frame-title">Flujo de pedidos en curso</h3>
              <p className="admin-frame-sub">Estado operativo de cocina y reparto</p>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PIPELINE.map((step, i) => {
                const n = data.pipeline[step.key];
                const pct = Math.round((n / pipelineMax) * 100);
                return (
                  <div key={step.key} className="text-center admin-pipeline-step" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="relative h-24 rounded-2xl bg-bocado-paper2 overflow-hidden border border-bocado-line">
                      <div
                        className={`absolute bottom-0 left-0 right-0 ${step.color} transition-all duration-700 ease-out admin-pipeline-fill`}
                        style={{ height: `${Math.max(12, pct)}%` }}
                      />
                      <span className="absolute inset-0 grid place-items-center text-2xl">{step.emoji}</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{n}</p>
                    <p className="text-[11px] font-semibold text-bocado-mute uppercase tracking-wide">{step.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-frame admin-panel-enter" style={{ animationDelay: '0.1s' }}>
          <div className="admin-frame-header">
            <div>
              <h3 className="admin-frame-title">Entrega y pagos</h3>
              <p className="admin-frame-sub">Configuración activa de la tienda</p>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-bocado-line">
                <dt className="text-bocado-mute">Envío estándar</dt>
                <dd className="font-bold">{eur(data.settings.delivery_fee_cents)}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-bocado-line">
                <dt className="text-bocado-mute">Envío gratis desde</dt>
                <dd className="font-bold">{eur(data.settings.free_delivery_from_cents)}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-bocado-line">
                <dt className="text-bocado-mute">Bizum empresa</dt>
                <dd className="font-bold text-xs">{data.settings.bizum_phone || '—'}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-bocado-mute">Facturación mes</dt>
                <dd className="font-bold text-emerald-700">{eur(data.stats.salesMonth)}</dd>
              </div>
            </dl>
            <a href="/admin/ajustes" className="mt-4 inline-flex text-xs font-bold text-bocado-ink hover:text-bocado-coral transition-colors">
              Editar ajustes →
            </a>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-5 sm:gap-6">
        <div className="admin-frame admin-panel-enter" style={{ animationDelay: '0.15s' }}>
          <div className="admin-frame-header">
            <h3 className="admin-frame-title">Ventas últimos 7 días</h3>
            <span className="chip text-xs">EUR</span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-end gap-2 h-44">
              {data.series.map((s, i) => (
                <div key={s.d} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-bocado-mute opacity-0 group-hover:opacity-100 transition-opacity">
                    {eur(s.total)}
                  </span>
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-bocado-lime/80 to-bocado-lime admin-bar-grow origin-bottom"
                    style={{
                      height: `${Math.max(8, (s.total / maxSeries) * 140)}px`,
                      animationDelay: `${i * 70}ms`,
                    }}
                    title={s.label}
                  />
                  <span className="text-[10px] font-semibold text-bocado-mute">{s.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-frame admin-panel-enter" style={{ animationDelay: '0.2s' }}>
          <div className="admin-frame-header">
            <h3 className="admin-frame-title">Forma de pago (mes)</h3>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            {[
              { key: 'bizum', label: 'Bizum', color: 'bg-sky-500', n: data.payments.bizum },
              { key: 'tpv', label: 'Tarjeta', color: 'bg-violet-500', n: data.payments.tpv },
              { key: 'cash', label: 'Efectivo', color: 'bg-emerald-500', n: data.payments.cash },
            ].map((p) => (
              <div key={p.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{p.label}</span>
                  <span className="font-bold">{p.n}</span>
                </div>
                <div className="h-2.5 rounded-full bg-bocado-paper2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.color} admin-bar-grow`}
                    style={{ width: `${(p.n / maxPay) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="admin-frame admin-panel-enter" style={{ animationDelay: '0.25s' }}>
          <div className="admin-frame-header">
            <div>
              <h3 className="admin-frame-title">Platos más vendidos</h3>
              <p className="admin-frame-sub">Por unidades en todos los pedidos</p>
            </div>
          </div>
          <ul className="p-4 sm:p-5 space-y-2">
            {data.topDishes.length === 0 && <li className="text-sm text-bocado-mute py-4 px-1">Sin datos aún.</li>}
            {data.topDishes.map((d, i) => (
              <li
                key={d.name}
                className="flex items-center gap-3 p-3 rounded-xl bg-bocado-paper2/60 hover:bg-bocado-lime/10 transition-colors admin-list-item"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="w-8 h-8 rounded-lg bg-bocado-house text-white text-sm font-bold grid place-items-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{d.name}</p>
                  <p className="text-xs text-bocado-mute">
                    {d.qty} uds · {eur(d.revenue_cents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-frame admin-panel-enter" style={{ animationDelay: '0.3s' }}>
          <div className="admin-frame-header">
            <h3 className="admin-frame-title">Últimos pedidos</h3>
            <a href="/admin/pedidos" className="text-xs font-bold text-bocado-ink hover:text-bocado-coral transition-colors">
              Ver todos →
            </a>
          </div>
          <div className="overflow-x-auto p-2 sm:p-3">
            <table className="w-full text-sm admin-table">
              <thead>
                <tr className="text-left">
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o, i) => (
                  <tr key={o.id} className="admin-list-item" style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <div className="font-medium">{o.number}</div>
                      <div className="text-[10px] text-bocado-mute">{fmtDateTime(o.created_at)}</div>
                    </td>
                    <td className="max-w-[100px] truncate">{o.customer_name}</td>
                    <td className="font-semibold">{eur(o.total_cents)}</td>
                    <td>
                      <span className={`chip text-[10px] ${statusChipClass(o.status)}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-panel-enter" style={{ animationDelay: '0.35s' }}>
        <p className="admin-section-title mb-4">Acceso rápido a todas las secciones</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {shortcuts.map((item) => (
            <a key={item.href} href={item.href} className="admin-quick-action group">
              <span className="admin-quick-action-icon group-hover:scale-105 transition-transform">{item.emoji}</span>
              <span>
                <span className="admin-quick-action-label">{item.label}</span>
                {item.description && <span className="admin-quick-action-desc">{item.description}</span>}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
