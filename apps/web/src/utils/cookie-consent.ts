import { getCookie, setCookie } from './cookies';

export const CONSENT_COOKIE = 'bocado_cookie_consent';
export const CONSENT_VERSION = '1';
const MAX_AGE = 365 * 24 * 60 * 60;

export interface CookieConsentState {
  v: string;
  essential: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
}

export function parseConsent(raw: string | null): CookieConsentState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as CookieConsentState;
    if (data.v !== CONSENT_VERSION || data.essential !== true) return null;
    return {
      v: data.v,
      essential: true,
      analytics: Boolean(data.analytics),
      marketing: Boolean(data.marketing),
      ts: typeof data.ts === 'number' ? data.ts : Date.now(),
    };
  } catch {
    if (raw === 'all') {
      return { v: CONSENT_VERSION, essential: true, analytics: true, marketing: true, ts: Date.now() };
    }
    if (raw === 'essential') {
      return { v: CONSENT_VERSION, essential: true, analytics: false, marketing: false, ts: Date.now() };
    }
    return null;
  }
}

export function getConsent(): CookieConsentState | null {
  return parseConsent(getCookie(CONSENT_COOKIE));
}

export function hasConsentChoice(): boolean {
  return getConsent() !== null;
}

export function saveConsent(partial: { analytics: boolean; marketing: boolean }): CookieConsentState {
  const state: CookieConsentState = {
    v: CONSENT_VERSION,
    essential: true,
    analytics: partial.analytics,
    marketing: partial.marketing,
    ts: Date.now(),
  };
  setCookie(CONSENT_COOKIE, JSON.stringify(state), { maxAgeSeconds: MAX_AGE });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bocado-cookie-consent', { detail: state }));
  }
  return state;
}

export function acceptAllCookies(): CookieConsentState {
  return saveConsent({ analytics: true, marketing: true });
}

export function acceptEssentialOnly(): CookieConsentState {
  return saveConsent({ analytics: false, marketing: false });
}

export function canUseAnalytics(): boolean {
  return getConsent()?.analytics === true;
}

export function canUseMarketing(): boolean {
  return getConsent()?.marketing === true;
}
