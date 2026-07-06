import type { APIRoute } from 'astro';
import { clearSession } from '../../../server/auth';
import { safeRedirectPath } from '../../../server/security';

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
  clearSession(cookies);
  let next = '/';
  try {
    const fd = await request.formData();
    const value = fd.get('next');
    if (typeof value === 'string') next = safeRedirectPath(value, '/');
  } catch {
    /* form vacío */
  }
  return redirect(next);
};
