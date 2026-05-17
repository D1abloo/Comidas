export function formatEUR(cents: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso));
}

export function statusLabel(s: string): string {
  return ({
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'En preparación',
    delivering: 'En reparto',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    paid: 'Pagado',
    awaiting_confirmation: 'Bizum por confirmar',
    failed: 'Fallido',
    refunded: 'Reembolsado',
  } as Record<string, string>)[s] ?? s;
}

export function paymentLabel(m: string): string {
  return ({ tpv: 'Tarjeta', cash: 'Efectivo', bizum: 'Bizum' } as Record<string, string>)[m] ?? m;
}
