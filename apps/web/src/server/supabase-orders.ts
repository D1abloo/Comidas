import type { Order } from './types.js';
import { getSupabaseAdmin } from './supabase.js';

export async function persistOrderToSupabase(order: Order, deliveryEtaMin: number): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error: orderErr } = await sb.from('orders').upsert({
    id: order.id,
    number: order.number,
    customer: order.customer,
    delivery_address: order.delivery_address,
    subtotal_cents: order.subtotal_cents,
    delivery_fee_cents: order.delivery_fee_cents,
    vat_cents: order.vat_cents,
    total_cents: order.total_cents,
    status: order.status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    notes: order.notes ?? null,
    invoice_id: order.invoice_id ?? null,
    delivery_eta_min: deliveryEtaMin,
    created_at: order.created_at,
  });

  if (orderErr) throw new Error(orderErr.message);

  await sb.from('order_items').delete().eq('order_id', order.id);

  const rows = order.items.map((line) => ({
    order_id: order.id,
    dish_id: line.dish_id,
    dish_name: line.dish_name,
    unit_price_cents: line.unit_price_cents,
    quantity: line.quantity,
    notes: line.notes ?? null,
  }));

  const { error: itemsErr } = await sb.from('order_items').insert(rows);
  if (itemsErr) throw new Error(itemsErr.message);
}

export async function logNotificationToSupabase(event: {
  id: string;
  order_id: string;
  channel: 'email' | 'whatsapp';
  kind: string;
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  payload?: Record<string, unknown>;
  created_at: string;
}): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb.from('notification_events').upsert({
    id: event.id,
    order_id: event.order_id,
    channel: event.channel,
    kind: event.kind,
    recipient: event.recipient,
    status: event.status,
    error_message: event.error_message ?? null,
    payload: event.payload ?? null,
    created_at: event.created_at,
  });
  if (error) throw new Error(error.message);
}
