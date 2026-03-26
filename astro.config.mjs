import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import rehypeFootnoteClass from './src/plugins/rehype-footnote-class.mjs';

export default defineConfig({
  site: 'https://sjg.io',
  base: '/',
  output: 'static',
  integrations: [mdx({
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeFootnoteClass]
  }), sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeFootnoteClass],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
