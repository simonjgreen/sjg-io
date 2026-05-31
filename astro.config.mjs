import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import rehypeFootnoteClass from './src/plugins/rehype-footnote-class.mjs';
import rehypeAccessibleTables from './src/plugins/rehype-accessible-tables.mjs';
import { readdirSync, readFileSync } from 'node:fs';

// The Markdown export endpoint (src/pages/writing/[...slug].md.ts) emits a
// /writing/<slug>.md for every non-draft post, but @astrojs/sitemap does not
// enumerate non-HTML endpoints. List them explicitly so crawlers can find
// them. Slugs are post ids = filenames (the glob loader ignores frontmatter
// `slug`), so the post directory is the source of truth.
function markdownWritingUrls() {
  const dir = new URL('./src/content/posts/', import.meta.url);
  return readdirSync(dir)
    .filter((name) => /\.mdx?$/.test(name))
    .filter((name) => {
      const frontmatter = readFileSync(new URL(name, dir), 'utf8').match(
        /^---\r?\n([\s\S]*?)\r?\n---/,
      );
      return !frontmatter || !/^\s*draft:\s*true\s*$/m.test(frontmatter[1]);
    })
    .map((name) => `https://sjg.io/writing/${name.replace(/\.mdx?$/, '')}.md`);
}

export default defineConfig({
  site: 'https://sjg.io',
  base: '/',
  output: 'static',
  integrations: [mdx({
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeFootnoteClass, rehypeAccessibleTables]
  }), sitemap({ customPages: markdownWritingUrls() })],
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeFootnoteClass, rehypeAccessibleTables],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
