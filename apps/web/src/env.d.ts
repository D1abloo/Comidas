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
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
