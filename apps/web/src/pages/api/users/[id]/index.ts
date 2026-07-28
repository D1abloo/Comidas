import type { APIRoute } from 'astro';
import { deleteUser, listUsers } from '../../../../server/user-service';

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  if (params.id === locals.user.id) {
    return new Response(JSON.stringify({ error: 'cannot_delete_self' }), { status: 400 });
  }
  const users = await listUsers();
  const target = users.find((user) => user.id === params.id);
  if (!target) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  }
  if (
    target.role === 'admin' &&
    users.filter((user) => user.role === 'admin').length <= 1
  ) {
    return new Response(JSON.stringify({ error: 'last_admin_required' }), { status: 409 });
  }
  if (!params.id || !(await deleteUser(params.id))) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ ok: true }));
};
