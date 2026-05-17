import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  return new Response(JSON.stringify({ user: locals.user ?? null }), {
    headers: { 'content-type': 'application/json' },
  });
};
