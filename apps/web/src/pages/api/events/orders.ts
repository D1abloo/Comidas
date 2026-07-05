import type { APIRoute } from 'astro';
import { subscribeOrderEvents } from '../../../server/order-events';

export const GET: APIRoute = async ({ locals, request }) => {
  if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'courier')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsub: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      unsub = subscribeOrderEvents((payload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, 20000);

      request.signal.addEventListener('abort', () => {
        if (heartbeat) clearInterval(heartbeat);
        unsub?.();
        controller.close();
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsub?.();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
};
