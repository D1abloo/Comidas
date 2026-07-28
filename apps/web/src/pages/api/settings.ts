import type { APIRoute } from 'astro';
import { getStore } from '../../server/db';
import { pickCompanyPatch, pickSettingsPatch } from '../../server/security';
import {
  areManualBizumPaymentsEnabled,
  areSimulatedPaymentsEnabled,
  isDatabaseEnabled,
  isEmailDeliveryConfigured,
} from '../../server/env';
import { pgSaveCompanyConfig } from '../../server/company-config-db';
import { persistOperationalState } from '../../server/store-persistence';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const store = getStore();
  return new Response(JSON.stringify({ company: store.company, settings: store.settings }), {
    headers: { 'content-type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  try {
    const body = (await request.json()) as { company?: Record<string, unknown>; settings?: Record<string, unknown> };
    const store = getStore();
    const companyPatch = body.company ? pickCompanyPatch(body.company) : {};
    const settingsPatch = body.settings ? pickSettingsPatch(body.settings) : {};
    const nextSettings = { ...store.settings, ...settingsPatch };
    if (!nextSettings.cash_enabled && !nextSettings.bizum_enabled && !nextSettings.tpv_enabled) {
      throw new Error('payment_method_required');
    }
    if (nextSettings.bizum_enabled && !nextSettings.bizum_phone) {
      throw new Error('bizum_phone_required');
    }
    if (nextSettings.bizum_enabled && !areManualBizumPaymentsEnabled()) {
      throw new Error('bizum_not_configured');
    }
    if (nextSettings.tpv_enabled && !areSimulatedPaymentsEnabled()) {
      throw new Error('tpv_not_configured');
    }
    if (nextSettings.email_notifications_enabled && !isEmailDeliveryConfigured()) {
      throw new Error('email_not_configured');
    }
    if (nextSettings.whatsapp_notifications_enabled) {
      throw new Error('whatsapp_not_configured');
    }
    Object.assign(store.company, companyPatch);
    Object.assign(store.settings, settingsPatch);
    if (isDatabaseEnabled()) await pgSaveCompanyConfig(store.company, store.settings);
    else await persistOperationalState(store);
    return new Response(JSON.stringify({ company: store.company, settings: store.settings }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    const allowed = new Set([
      'payment_method_required',
      'bizum_phone_required',
      'bizum_not_configured',
      'tpv_not_configured',
      'email_not_configured',
      'whatsapp_not_configured',
    ]);
    const message = error instanceof Error && allowed.has(error.message) ? error.message : 'invalid_settings';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
};
