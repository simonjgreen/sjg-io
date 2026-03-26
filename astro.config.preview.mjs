import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

const previewDomain = process.env.PREVIEW_DOMAIN || 'preview.sjg.io';

export default defineConfig({
  site: `https://${previewDomain}`,
  base: '/',
  output: 'static',
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
