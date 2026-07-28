import type { APIRoute } from 'astro';
import { getEmailConfig, isDatabaseEnabled, isDemoMode, validateRuntimeConfig } from '../../server/env';
import { pgQuery } from '../../server/pg';

export const GET: APIRoute = async () => {
  try {
    const configurationIssues = validateRuntimeConfig();
    if (configurationIssues.length > 0) {
      return new Response(JSON.stringify({ ok: false, checks: { configuration: false }, issues: configurationIssues }), {
        status: 503,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
        },
      });
    }
    if (isDatabaseEnabled()) await pgQuery('SELECT 1');
    const email = getEmailConfig();
    return new Response(JSON.stringify({
      ok: true,
      mode: isDemoMode() ? 'demo' : 'production',
      checks: {
        configuration: true,
        persistence: isDatabaseEnabled() ? 'postgresql' : 'local',
        email: email.enabled ? email.provider : 'disabled',
      },
    }), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 503,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  }
};
