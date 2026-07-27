import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const migrationsDir = resolve(process.cwd(), 'docker/postgres/migrations');
const client = new pg.Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 60_000,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined,
});

try {
  await client.connect();
  await client.query('SELECT pg_advisory_lock($1)', [1_932_642_331]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const files = (await readdir(migrationsDir))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort();
  const { rows } = await client.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(resolve(migrationsDir, file), 'utf8');
    console.log(`Applying ${file}`);
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
  }
  console.log('Database migrations are up to date');
} finally {
  await client.query('SELECT pg_advisory_unlock($1)', [1_932_642_331]).catch(() => undefined);
  await client.end().catch(() => undefined);
}
