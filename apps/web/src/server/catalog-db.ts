import { pgQuery } from './pg.js';
import type { Dish, MenuSection } from './types.js';

export interface CatalogState {
  dishes: Dish[];
  menu_sections: MenuSection[];
}

export async function pgLoadCatalog(): Promise<CatalogState | null> {
  const { rows } = await pgQuery<{ state: CatalogState }>(
    'SELECT state FROM application_state WHERE id = $1',
    ['catalog'],
  );
  return rows[0]?.state ?? null;
}

export async function pgSaveCatalog(state: CatalogState): Promise<void> {
  await pgQuery(
    `INSERT INTO application_state (id, state, updated_at)
     VALUES ('catalog', $1, NOW())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
    [JSON.stringify(state)],
  );
}
