import { pgQuery } from './pg.js';
import type { Company, CompanySettings } from './types.js';

export async function pgLoadCompanyConfig(): Promise<{
  company?: Company;
  settings?: CompanySettings;
}> {
  const { rows } = await pgQuery<{ company: Company | null; settings: CompanySettings | null }>(
    'SELECT company, settings FROM company_settings WHERE id = $1',
    ['default'],
  );
  return {
    company: rows[0]?.company ?? undefined,
    settings: rows[0]?.settings ?? undefined,
  };
}

export async function pgSaveCompanyConfig(
  company: Company,
  settings: CompanySettings,
): Promise<void> {
  await pgQuery(
    `INSERT INTO company_settings (id, company, settings, updated_at)
     VALUES ('default', $1, $2, NOW())
     ON CONFLICT (id) DO UPDATE SET
       company = EXCLUDED.company,
       settings = EXCLUDED.settings,
       updated_at = NOW()`,
    [JSON.stringify(company), JSON.stringify(settings)],
  );
}
