import type { Store } from './db.js';
import { isDatabaseEnabled } from './env.js';
import { pgLoadCatalog, pgSaveCatalog } from './catalog-db.js';
import { persistOperationalState } from './store-persistence.js';

export async function hydrateCatalog(store: Store): Promise<void> {
  if (!isDatabaseEnabled()) return;
  const catalog = await pgLoadCatalog();
  if (!catalog) return;
  store.dishes = catalog.dishes;
  store.menu_sections = catalog.menu_sections;
}

export async function persistCatalog(store: Store): Promise<void> {
  if (isDatabaseEnabled()) {
    await pgSaveCatalog({
      dishes: store.dishes,
      menu_sections: store.menu_sections,
    });
  } else {
    await persistOperationalState(store);
  }
}
