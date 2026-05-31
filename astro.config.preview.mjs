// Preview build config. Identical to the production config (astro.config.mjs)
// except for `site`, which is the per-PR preview domain. Extending the base
// config rather than duplicating it keeps the two from drifting — previously
// this file omitted the `sitemap()` and `react()` integrations, so previews
// 404'd on /sitemap-0.xml and would not hydrate React islands.
import { defineConfig } from 'astro/config';
import baseConfig from './astro.config.mjs';

const previewDomain = process.env.PREVIEW_DOMAIN || 'preview.sjg.io';

export default defineConfig({
  ...baseConfig,
  site: `https://${previewDomain}`,
});
