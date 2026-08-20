import type { APIRoute } from 'astro';
import {
  buildGoogleAuthorizeUrl,
  createGoogleOAuthState,
  getGoogleOAuthConfig,
} from '../../../server/google-oauth';
import { safeRedirectPath } from '../../../server/security';

export const GET: APIRoute = async ({ url, redirect }) => {
  const { enabled } = getGoogleOAuthConfig();
  if (!enabled) {
    return redirect('/login?error=google_disabled');
  }
  const next = safeRedirectPath(url.searchParams.get('next'), '/perfil');
  const state = await createGoogleOAuthState(next);
  return redirect(buildGoogleAuthorizeUrl(state));
};
