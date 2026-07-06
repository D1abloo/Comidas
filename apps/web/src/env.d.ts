/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./server/auth').SessionUser | null;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_APP_URL: string;
  readonly SESSION_SECRET: string;
  readonly BIZUM_COMPANY_PHONE: string;
  readonly DATABASE_URL?: string;
  readonly EMAIL_ENABLED?: string;
  readonly EMAIL_PROVIDER?: string;
  readonly EMAIL_FROM?: string;
  readonly EMAIL_REPLY_TO?: string;
  readonly EMAIL_API_KEY?: string;
  readonly SMTP_HOST?: string;
  readonly SMTP_PORT?: string;
  readonly SMTP_USER?: string;
  readonly SMTP_PASS?: string;
  readonly SMTP_SECURE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
