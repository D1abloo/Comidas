import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type {
  AdminAlert,
  Company,
  CompanySettings,
  CourierLocation,
  Dish,
  Invoice,
  MenuSection,
  NotificationEvent,
  Order,
  User,
} from './types.js';
import type { Store } from './db.js';
import { getLocalDataDirectory, isDatabaseEnabled } from './env.js';

const FILE_PATH = resolve(getLocalDataDirectory() ?? join(process.cwd(), '.data'), 'bocado-store.json');

type OperationalState = {
  orders: Order[];
  courier_locations: CourierLocation[];
  admin_alerts: AdminAlert[];
  users: User[];
  company: Company;
  settings: CompanySettings;
  menu_sections: MenuSection[];
  dishes: Dish[];
  invoices: Invoice[];
  notifications: NotificationEvent[];
  counters: { order: number; invoice: number };
};

let hydratedFromFile = false;
let hydratePromise: Promise<void> | null = null;

function sliceState(store: Store): OperationalState {
  return {
    orders: store.orders,
    courier_locations: store.courier_locations ?? [],
    admin_alerts: store.admin_alerts,
    users: store.users,
    company: store.company,
    settings: store.settings,
    menu_sections: store.menu_sections,
    dishes: store.dishes,
    invoices: store.invoices,
    notifications: store.notifications,
    counters: store.counters,
  };
}

function applyState(store: Store, data: OperationalState) {
  if (data.orders?.length) store.orders = data.orders;
  if (data.courier_locations) store.courier_locations = data.courier_locations;
  if (data.admin_alerts) store.admin_alerts = data.admin_alerts;
  if (data.users) store.users = data.users;
  if (data.company) store.company = data.company;
  if (data.settings) store.settings = data.settings;
  if (data.menu_sections) store.menu_sections = data.menu_sections;
  if (data.dishes) store.dishes = data.dishes;
  if (data.invoices) store.invoices = data.invoices;
  if (data.notifications) store.notifications = data.notifications;
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

export function hydrateOperationalStateSync(store: Store) {
  if (hydratedFromFile || isDatabaseEnabled()) return;
  hydrateFromFile(store);
  hydratedFromFile = true;
}

export async function ensureOperationalStateHydrated(store: Store) {
  if (hydratedFromFile || isDatabaseEnabled()) return;
  if (!hydratePromise) {
    hydratePromise = Promise.resolve().then(() => {
      hydrateFromFile(store);
      hydratedFromFile = true;
    });
  }
  await hydratePromise;
}

export async function persistOperationalState(store: Store) {
  if (isDatabaseEnabled()) return;
  persistToFile(store);
}
