import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import rehypeFootnoteClass from './src/plugins/rehype-footnote-class.mjs';

export default defineConfig({
  site: 'https://sjg.io',
  base: '/',
  output: 'static',
  integrations: [mdx({ 
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeFootnoteClass]
  }), tailwind(), sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeFootnoteClass],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});