import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  server: { host: true, port: 4321 },
  // The application middleware validates the canonical PUBLIC_APP_URL origin,
  // including deployments behind a TLS-terminating reverse proxy.
  security: { checkOrigin: false },
});
