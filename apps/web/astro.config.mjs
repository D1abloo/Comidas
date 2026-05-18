import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel/serverless';

const isVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  output: 'server',
  adapter: isVercel
    ? vercel({
        webAnalytics: { enabled: false },
      })
    : node({ mode: 'standalone' }),
  integrations: [react(), tailwind({ applyBaseStyles: false })],
  server: { host: true, port: 4321 },
});
