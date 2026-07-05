import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { AdminAlert, CourierLocation, Order } from './types.js';
import type { Store } from './db.js';
import { getSupabaseAdmin } from './supabase.js';
import { isDatabaseEnabled, isSupabaseConfigured } from './env.js';

const STORE_KEY = 'bocado_operational_state';
const FILE_PATH = join(process.cwd(), '.data', 'bocado-store.json');

type OperationalState = {
  orders: Order[];
  courier_locations: CourierLocation[];
  admin_alerts: AdminAlert[];
  counters: { order: number; invoice: number };
};

let hydratedFromRemote = false;
let hydratePromise: Promise<void> | null = null;

function sliceState(store: Store): OperationalState {
  return {
    orders: store.orders,
    courier_locations: store.courier_locations ?? [],
    admin_alerts: store.admin_alerts,
    counters: store.counters,
  };
}

function applyState(store: Store, data: OperationalState) {
  if (data.orders?.length) store.orders = data.orders;
  if (data.courier_locations) store.courier_locations = data.courier_locations;
  if (data.admin_alerts) store.admin_alerts = data.admin_alerts;
  if (data.counters) store.counters = data.counters;
}

function hydrateFromFile(store: Store) {
  if (!existsSync(FILE_PATH)) return;
  try {
    const raw = readFileSync(FILE_PATH, 'utf8');
    applyState(store, JSON.parse(raw) as OperationalState);
  } catch (e) {
    console.error('[store] No se pudo leer .data/bocado-store.json:', e);
  }
}

function persistToFile(store: Store) {
  try {
    mkdirSync(dirname(FILE_PATH), { recursive: true });
    writeFileSync(FILE_PATH, JSON.stringify(sliceState(store), null, 2), 'utf8');
  } catch (e) {
    console.error('[store] No se pudo guardar .data/bocado-store.json:', e);
  }
}

async function hydrateFromSupabase(store: Store) {
  if (isDatabaseEnabled()) return;
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { data, error } = await sb.from('app_settings').select('value').eq('key', STORE_KEY).maybeSingle();
  if (error) {
    console.error('[store] Supabase hydrate error:', error.message);
    return;
  }
  if (data?.value) applyState(store, data.value as OperationalState);
}

async function persistToSupabase(store: Store) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const payload = sliceState(store);
  const { error } = await sb.from('app_settings').upsert({
    key: STORE_KEY,
    value: payload,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('[store] Supabase persist error:', error.message);
}

export function hydrateOperationalStateSync(store: Store) {
  if (hydratedFromRemote) return;
  hydrateFromFile(store);
  if (!isSupabaseConfigured()) hydratedFromRemote = true;
}

export async function ensureOperationalStateHydrated(store: Store) {
  if (hydratedFromRemote || isDatabaseEnabled()) return;
  if (!hydratePromise) {
    hydratePromise = (async () => {
      hydrateFromFile(store);
      if (isSupabaseConfigured()) await hydrateFromSupabase(store);
      hydratedFromRemote = true;
    })();
  }
  await hydratePromise;
}

export async function persistOperationalState(store: Store) {
  persistToFile(store);
  if (isSupabaseConfigured()) await persistToSupabase(store);
}
