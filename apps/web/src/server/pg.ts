import pg from 'pg';
import { getDatabaseUrl, isDatabaseEnabled } from './env.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL no configurada');
  }
  if (!pool) {
    const useSsl = process.env.DATABASE_SSL === 'true';
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: Math.max(1, Math.min(20, Number(process.env.DB_POOL_MAX ?? '5'))),
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 15_000,
      application_name: 'bocado-web',
      ssl: useSsl
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : undefined,
    });
  }
  return pool;
}

export async function pgQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}

export async function withPgTransaction<T>(
  run: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
