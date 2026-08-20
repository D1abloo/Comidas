import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const deployTarget = process.env.DEPLOY_TARGET || 'node';
const site =
  process.env.PUBLIC_APP_URL ||
  (deployTarget === 'vercel'
    ? 'https://bocado.vercel.app'
    : 'https://bocado.82-223-54-195.sslip.io');

export default defineConfig({
  site,
  output: 'server',
  adapter: deployTarget === 'vercel' ? vercel() : node({ mode: 'standalone' }),
  integrations: [react()],
  server: { host: true, port: 4321 },
  // The application middleware validates the canonical PUBLIC_APP_URL origin,
  // including deployments behind a TLS-terminating reverse proxy.
  security: { checkOrigin: false },
});
