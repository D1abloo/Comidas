import pg from 'pg';
import { getDatabaseUrl, isDatabaseEnabled } from './env.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL no configurada');
  }
  if (!pool) {
    pool = new Pool({ connectionString: getDatabaseUrl(), max: 10 });
  }
  return pool;
}

export async function pgQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}
