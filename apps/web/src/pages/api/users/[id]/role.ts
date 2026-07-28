import type { APIRoute } from 'astro';
import { listUsers, updateUserRole } from '../../../../server/user-service';
import type { Role } from '../../../../server/types';

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { role } = (await request.json().catch(() => ({}))) as { role?: Role };
  if (!role || !['admin', 'customer', 'courier'].includes(role)) {
    return new Response(JSON.stringify({ error: 'invalid_role' }), { status: 400 });
  }
  if (params.id === locals.user.id && role !== 'admin') {
    return new Response(JSON.stringify({ error: 'cannot_change_own_role' }), { status: 400 });
  }
  const users = await listUsers();
  const target = users.find((user) => user.id === params.id);
  if (!target) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  if (
    target.role === 'admin' &&
    role !== 'admin' &&
    users.filter((user) => user.role === 'admin').length <= 1
  ) {
    return new Response(JSON.stringify({ error: 'last_admin_required' }), { status: 409 });
  }
  const user = params.id ? await updateUserRole(params.id, role) : null;
  if (!user) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  return new Response(JSON.stringify({ user }));
};
