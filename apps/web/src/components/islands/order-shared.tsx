export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Recibido' },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'preparing', label: 'Cocinando' },
  { key: 'delivering', label: 'En reparto' },
  { key: 'delivered', label: 'Completado' },
];

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  delivering: 'En reparto',
  delivered: 'Completado',
  cancelled: 'Cancelado',
};

export const PAYMENT_LABEL: Record<string, string> = {
  tpv: 'Tarjeta',
  cash: 'Efectivo',
  bizum: 'Bizum',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pago pendiente',
  awaiting_confirmation: 'Bizum por confirmar',
  paid: 'Pagado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
};

export function eur(cents: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function fmtDateTime(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function stepIndex(status: OrderStatus) {
  if (status === 'cancelled') return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
        Este pedido fue cancelado.
      </p>
    );
  }

  const current = stepIndex(status);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <ol className="flex min-w-[520px] sm:min-w-0 items-start justify-between gap-1">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= current;
          const active = i === current;
          const connectorDone = i < current;
          return (
            <li key={step.key} className="flex flex-1 flex-col items-center text-center min-w-0 relative">
              {i > 0 && (
                <span
                  className={`absolute top-[18px] right-1/2 w-full h-0.5 -translate-y-1/2 -z-0 ${
                    connectorDone ? 'bg-bocado-ink' : 'bg-bocado-line'
                  }`}
                  style={{ width: 'calc(100% - 36px)', right: '50%' }}
                  aria-hidden
                />
              )}
              <div
                className={`relative z-10 w-9 h-9 rounded-full grid place-items-center text-xs font-semibold border-2 transition-all duration-300 ${
                  done ? 'bg-bocado-ink border-bocado-ink text-white' : 'bg-white border-bocado-line text-bocado-mute'
                } ${active ? 'ring-4 ring-bocado-lime/40' : ''}`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`mt-2 text-[11px] leading-tight px-0.5 ${active ? 'font-semibold text-bocado-ink' : 'text-bocado-mute'}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function customerOrderLabel(order: {
  status: OrderStatus;
  courier_accepted_at?: string | null;
}): string {
  if (order.status === 'delivering' && order.courier_accepted_at) return 'En reparto';
  return STATUS_LABEL[order.status] ?? order.status;
}

export function statusChipClass(status: string) {
  if (status === 'delivered') return '!bg-emerald-400/20 !text-emerald-900 !border-emerald-400 font-semibold';
  if (status === 'cancelled') return '!bg-red-400/20 !text-red-800 !border-red-300 font-semibold';
  if (status === 'delivering') return '!bg-orange-400/25 !text-orange-950 !border-orange-400 font-semibold';
  if (status === 'preparing') return '!bg-amber-300/35 !text-amber-950 !border-amber-400 font-semibold';
  if (status === 'confirmed') return '!bg-sky-400/20 !text-sky-950 !border-sky-400 font-semibold';
  if (status === 'pending') return '!bg-violet-400/20 !text-violet-950 !border-violet-400 font-semibold';
  return '';
}

export function statusFilterClass(status: string, active: boolean) {
  const base = active ? 'admin-filter-chip admin-filter-chip--active' : 'admin-filter-chip';
  if (!active) return base;
  if (status === '') return `${base} !bg-bocado-ink`;
  if (status === 'delivered') return `${base} !bg-emerald-500`;
  if (status === 'cancelled') return `${base} !bg-red-500`;
  if (status === 'delivering') return `${base} !bg-orange-500`;
  if (status === 'preparing') return `${base} !bg-amber-500 !text-bocado-ink`;
  if (status === 'confirmed') return `${base} !bg-sky-500`;
  if (status === 'pending') return `${base} !bg-violet-500`;
  return `${base} !bg-bocado-ink`;
}
