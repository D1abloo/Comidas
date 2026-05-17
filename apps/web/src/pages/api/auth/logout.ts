import type { APIRoute } from 'astro';
import { clearSession } from '../../../server/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect('/');
};
