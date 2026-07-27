import type { APIRoute } from 'astro';
import { updateUserRole } from '../../../../server/user-service';
import type { Role } from '../../../../server/types';

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { role } = (await request.json().catch(() => ({}))) as { role?: Role };
  if (!role || !['admin', 'customer', 'courier'].includes(role)) {
    return new Response(JSON.stringify({ error: 'invalid_role' }), { status: 400 });
  }
  const user = params.id ? await updateUserRole(params.id, role) : null;
  if (!user) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  return new Response(JSON.stringify({ user }));
};
