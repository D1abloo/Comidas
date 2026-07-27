import type { SessionUser } from './auth.js';
import { acceptOrderForCourier, completeOrderDelivery } from './courier-orders.js';
import { isDatabaseEnabled } from './env.js';
import { getOrderById, saveOrder } from './order-service.js';
import { pgClaimOrderForCourier, pgCompleteOrderForCourier } from './orders-db.js';
import type { Order } from './types.js';

export async function claimOrder(orderId: string, courier: SessionUser): Promise<Order> {
  if (isDatabaseEnabled()) {
    const claimed = await pgClaimOrderForCourier(orderId, courier.id, courier.full_name);
    if (!claimed) throw new Error('El pedido ya no está disponible.');
    await acceptOrderForCourier(claimed, courier, true);
    return claimed;
  }
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Pedido no encontrado.');
  await acceptOrderForCourier(order, courier);
  return saveOrder(order);
}

export async function completeCourierOrder(orderId: string, courier: SessionUser): Promise<Order> {
  if (isDatabaseEnabled()) {
    const completed = await pgCompleteOrderForCourier(orderId, courier.id);
    if (!completed) throw new Error('El pedido no está asignado a este repartidor.');
    await completeOrderDelivery(completed, courier, true);
    return completed;
  }
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Pedido no encontrado.');
  await completeOrderDelivery(order, courier);
  return saveOrder(order);
}
