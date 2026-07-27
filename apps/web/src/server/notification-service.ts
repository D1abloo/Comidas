import { randomUUID } from 'node:crypto';
import { getStore } from './db.js';
import { isDatabaseEnabled } from './env.js';
import { pgInsertNotification, pgUpdateNotification } from './notifications-db.js';
import { persistOperationalState } from './store-persistence.js';
import type { NotificationEvent } from './types.js';

export async function queueNotification(input: {
  orderId: string;
  channel: NotificationEvent['channel'];
  kind: string;
  recipient: string;
}): Promise<NotificationEvent> {
  const event: NotificationEvent = {
    id: randomUUID(),
    order_id: input.orderId,
    channel: input.channel,
    kind: input.kind,
    recipient: input.recipient,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  if (isDatabaseEnabled()) {
    await pgInsertNotification(event);
  } else {
    const store = getStore();
    store.notifications.unshift(event);
    await persistOperationalState(store);
  }
  return event;
}

export async function setNotificationResult(
  id: string,
  status: Extract<NotificationEvent['status'], 'sent' | 'failed'>,
  errorMessage?: string,
): Promise<void> {
  const safeError = errorMessage?.slice(0, 500);
  if (isDatabaseEnabled()) {
    await pgUpdateNotification(id, status, safeError);
    return;
  }
  const store = getStore();
  const event = store.notifications.find((item) => item.id === id);
  if (event) {
    event.status = status;
    event.error_message = safeError;
  }
  await persistOperationalState(store);
}
