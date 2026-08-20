import type { APIRoute } from 'astro';
import { setSession } from '../../../../server/auth';
import {
  exchangeGoogleCode,
  upsertGoogleUser,
  verifyGoogleOAuthState,
} from '../../../../server/google-oauth';
import { safeRedirectPath } from '../../../../server/security';

export const GET: APIRoute = async ({ url, cookies, redirect, request }) => {
  const err = url.searchParams.get('error');
  if (err) return redirect('/login?error=google_denied');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return redirect('/login?error=google_invalid');

  try {
    const next = await verifyGoogleOAuthState(state);
    const info = await exchangeGoogleCode(code);
    const user = await upsertGoogleUser(info);
    await setSession(
      cookies,
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
      },
      request,
    );
    const dest =
      user.role === 'admin' ? '/admin' : user.role === 'courier' ? '/repartidor' : safeRedirectPath(next, '/perfil');
    return redirect(dest);
  } catch {
    return redirect('/login?error=google_failed');
  }
};
