import type { APIRoute } from 'astro';
import { deleteUser } from '../../../../server/user-service';

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  if (params.id === locals.user.id) {
    return new Response(JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }), { status: 400 });
  }
  if (!params.id || !(await deleteUser(params.id))) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ ok: true }));
};
