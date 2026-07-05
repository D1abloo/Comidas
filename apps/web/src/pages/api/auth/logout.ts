import type { APIRoute } from 'astro';
import { clearSession } from '../../../server/auth';

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
  clearSession(cookies);
  let next = '/';
  try {
    const fd = await request.formData();
    const value = fd.get('next');
    if (typeof value === 'string' && value.startsWith('/')) next = value;
  } catch {
    /* form vacío */
  }
  return redirect(next);
};
