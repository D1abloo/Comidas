import { resolve } from 'node:path';
import type { Company, CompanySettings, OrderStatus, PaymentMethod } from './types.js';

const DEFAULT_SESSION_SECRET = 'bocado-demo-secret-change-me';
const INSECURE_SESSION_SECRETS = new Set([
  DEFAULT_SESSION_SECRET,
  'cambia-este-secreto-en-produccion',
  'genera-un-secreto-largo-aleatorio',
]);

function readEnv(key: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env[key] : undefined;
  if (typeof fromProcess === 'string' && fromProcess.length > 0) return fromProcess;
  const v = import.meta.env[key];
  if (typeof v === 'string' && v.length > 0) return v;
  return undefined;
}

let secretsChecked = false;

export function getSessionSecretRaw(): string {
  return readEnv('SESSION_SECRET') ?? DEFAULT_SESSION_SECRET;
}

export function getSessionSecretBytes(): Uint8Array {
  return new TextEncoder().encode(getSessionSecretRaw());
}

export function assertProductionSecrets(): void {
  if (secretsChecked) return;
  secretsChecked = true;
  if (!import.meta.env.PROD) return;
  const secret = getSessionSecretRaw();
  if (INSECURE_SESSION_SECRETS.has(secret) || secret.length < 32) {
    throw new Error('SESSION_SECRET must be a unique value of at least 32 characters in production');
  }
}

/** Evita open redirects: solo rutas internas relativas. */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback;
  if (path.includes('://') || path.includes('@')) return fallback;
  return path;
}

export function isAdminRegistrationAllowed(): boolean {
  const flag = readEnv('ALLOW_ADMIN_REGISTRATION');
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return !import.meta.env.PROD;
}

const ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'pending',
  'confirmed',
  'preparing',
  'delivering',
  'delivered',
  'cancelled',
]);

export function parseOrderStatus(raw: unknown): OrderStatus | null {
  return typeof raw === 'string' && ORDER_STATUSES.has(raw as OrderStatus) ? (raw as OrderStatus) : null;
}

const PAYMENT_METHODS: ReadonlySet<PaymentMethod> = new Set(['tpv', 'cash', 'bizum']);

export function parsePaymentMethod(raw: unknown): PaymentMethod | null {
  return typeof raw === 'string' && PAYMENT_METHODS.has(raw as PaymentMethod)
    ? (raw as PaymentMethod)
    : null;
}

const COMPANY_KEYS: ReadonlySet<keyof Company> = new Set([
  'legal_name',
  'trade_name',
  'tax_id',
  'fiscal_address',
  'fiscal_city',
  'fiscal_postal_code',
  'fiscal_country',
  'contact_email',
  'contact_phone',
]);

const SETTINGS_KEYS: ReadonlySet<keyof CompanySettings> = new Set([
  'bizum_phone',
  'bizum_concept_template',
  'bizum_qr_updated_at',
  'tpv_enabled',
  'cash_enabled',
  'bizum_enabled',
  'invoice_prefix',
  'invoice_next_number',
  'email_notifications_enabled',
  'whatsapp_notifications_enabled',
  'whatsapp_business_phone',
  'delivery_fee_cents',
  'free_delivery_from_cents',
  'printer_enabled',
  'printer_name',
  'printer_paper_mm',
  'auto_print_on_order',
]);

export function pickCompanyPatch(raw: Record<string, unknown>): Partial<Company> {
  const out: Partial<Company> = {};
  for (const key of COMPANY_KEYS) {
    if (key in raw) (out as Record<string, unknown>)[key] = raw[key];
  }
  return out;
}

export function pickSettingsPatch(raw: Record<string, unknown>): Partial<CompanySettings> {
  const out: Partial<CompanySettings> = {};
  for (const key of SETTINGS_KEYS) {
    if (key in raw) (out as Record<string, unknown>)[key] = raw[key];
  }
  return out;
}

const DISH_IMAGE_PREFIXES = ['/carta/', '/uploads/', '/images/'];

export function sanitizeDishImageUrl(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith('/')) {
    if (u.includes('..')) return null;
    if (!DISH_IMAGE_PREFIXES.some((p) => u.startsWith(p))) return null;
    return u;
  }
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local')) return null;
    if (/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Resuelve un path bajo `root` o devuelve null si escapa del directorio. */
export function resolveUnderRoot(root: string, relativePath: string): string | null {
  const rel = relativePath.replace(/^\//, '');
  if (!rel || rel.includes('\0')) return null;
  const abs = resolve(root, rel);
  const rootResolved = resolve(root);
  if (abs !== rootResolved && !abs.startsWith(rootResolved + '/')) return null;
  return abs;
}
