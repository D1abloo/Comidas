import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { role } = (await request.json()) as { role: 'admin' | 'customer' };
  const store = getStore();
  const user = store.users.find((u) => u.id === params.id);
  if (!user) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  user.role = role;
  return new Response(JSON.stringify({ user }));
};
