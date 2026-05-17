import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../../server/supabase';
import { isSupabaseConfigured } from '../../../server/env';

/** Comprueba conexión a Supabase (solo admin o en desarrollo). */
export const GET: APIRoute = async ({ locals }) => {
  if (locals.user?.role !== 'admin' && import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(
      JSON.stringify({ ok: false, configured: false, message: 'Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY' }),
      { headers: { 'content-type': 'application/json' } },
    );
  }

  const sb = getSupabaseAdmin()!;
  const { count, error } = await sb.from('orders').select('*', { count: 'exact', head: true });

  if (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        configured: true,
        message: error.message,
        hint: '¿Ejecutaste supabase/migrations/001_initial.sql en el SQL Editor?',
      }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, configured: true, orders_count: count ?? 0 }),
    { headers: { 'content-type': 'application/json' } },
  );
};
