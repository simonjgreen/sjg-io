import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

// Get the preview domain from environment variable, fallback to default
const previewDomain = process.env.PREVIEW_DOMAIN || 'preview.sjg.io';

export default defineConfig({
  site: `https://${previewDomain}`,
  base: '/',
  output: 'static',
  integrations: [mdx(), tailwind()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
