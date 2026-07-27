import { pgQuery } from './pg.js';
import type { NotificationEvent } from './types.js';

export async function pgInsertNotification(event: NotificationEvent): Promise<void> {
  await pgQuery(
    `INSERT INTO notification_events
      (id, order_id, channel, kind, recipient, status, error_message, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO NOTHING`,
    [
      event.id,
      event.order_id,
      event.channel,
      event.kind,
      event.recipient,
      event.status,
      event.error_message ?? null,
      event.created_at,
    ],
  );
}

export async function pgUpdateNotification(
  id: string,
  status: NotificationEvent['status'],
  errorMessage?: string,
): Promise<void> {
  await pgQuery(
    'UPDATE notification_events SET status = $2, error_message = $3 WHERE id = $1',
    [id, status, errorMessage ?? null],
  );
}
