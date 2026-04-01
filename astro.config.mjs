// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import alpinejs from '@astrojs/alpinejs';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.axiom-medical-transfer.de',
  output: 'static',
  compressHTML: true,
  vite: { plugins: [tailwindcss()] },
  integrations: [
    alpinejs({ entrypoint: '/src/entrypoint.ts' }),
    sitemap(),
  ],
});
