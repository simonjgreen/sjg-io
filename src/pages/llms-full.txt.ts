import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import type { Root, RootContent, Paragraph, Text } from 'mdast';

/**
 * /llms-full.txt — the long companion to /llms.txt.
 *
 * Where /llms.txt is a curated index of links, this endpoint concatenates the
 * actual Markdown of every published article into a single file so an agent can
 * ingest the full corpus in one fetch. It reuses the same MDX-stripping pipeline
 * as the per-article `/writing/<slug>.md` endpoint, so MDX-only constructs are
 * resolved away rather than leaked:
 *   - `import`/`export` (ESM) statements are dropped,
 *   - <Callout> becomes a blockquote (keeping its prose + icon),
 *   - <ArticleLink slug="…" /> becomes a real Markdown link,
 *   - raw <img …/> becomes a Markdown image (so it survives the unwrap),
 *   - any other component is unwrapped to its children.
 * Sections are separated by horizontal rules with the canonical URL beside each
 * heading for citation, matching the curation/order of the writing index
 * (reverse chronological).
 */

interface MdxAttribute {
  type: 'mdxJsxAttribute';
  name: string;
  value?: string | unknown;
}

interface MdxJsxElement {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
  name: string | null;
  attributes: MdxAttribute[];
  children: RootContent[];
}

function stringAttr(node: MdxJsxElement, name: string): string | undefined {
  const attr = node.attributes?.find(
    (a) => a.type === 'mdxJsxAttribute' && a.name === name,
  );
  return typeof attr?.value === 'string' ? attr.value : undefined;
}

interface StripOptions {
  titleBySlug: Map<string, string>;
  site: URL;
}

/** unified transformer: turn MDX-specific nodes into plain Markdown. */
function remarkStripMdx({ titleBySlug, site }: StripOptions) {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (parent == null || index == null) return;

      if (
        node.type === 'mdxjsEsm' ||
        node.type === 'mdxFlowExpression' ||
        node.type === 'mdxTextExpression'
      ) {
        parent.children.splice(index, 1);
        return index;
      }

      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const el = node as unknown as MdxJsxElement;

        if (el.name === 'Callout') {
          const icon = stringAttr(el, 'icon');
          const children = el.children ?? [];
          const first = children[0] as Paragraph | undefined;
          if (icon && first?.type === 'paragraph') {
            first.children.unshift({ type: 'text', value: `${icon} ` } as Text);
          }
          parent.children[index] = { type: 'blockquote', children } as RootContent;
          return index;
        }

        if (el.name === 'ArticleLink') {
          const slug = stringAttr(el, 'slug');
          const url = slug
            ? new URL(`/writing/${slug}/`, site).toString()
            : new URL('/writing/', site).toString();
          const label = (slug && titleBySlug.get(slug)) || slug || 'Read next';
          parent.children[index] = {
            type: 'paragraph',
            children: [{ type: 'link', url, children: [{ type: 'text', value: label }] }],
          } as RootContent;
          return index;
        }

        // Raw HTML <img> elements are self-closing, so unwrapping them to
        // `el.children` would silently drop the image (and its alt text) from a
        // corpus advertised as full. Convert them to Markdown images instead.
        if (el.name === 'img') {
          const url = stringAttr(el, 'src');
          if (url) {
            const alt = stringAttr(el, 'alt') ?? '';
            const absolute = new URL(url, site).toString();
            parent.children[index] = {
              type: 'paragraph',
              children: [{ type: 'image', url: absolute, alt, title: null }],
            } as RootContent;
            return index;
          }
        }

        parent.children.splice(index, 1, ...(el.children ?? []));
        return index;
      }
    });
  };
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'UTC' }).format(date);

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://sjg.io');

  const allPosts = await getCollection('posts');
  const titleBySlug = new Map(allPosts.map((p) => [p.id, p.data.title]));

  const posts = allPosts
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const sections = await Promise.all(
    posts.map(async (post) => {
      const { data } = post;
      const canonical =
        data.canonical ?? new URL(`/writing/${post.id}/`, base).toString();

      const file = await unified()
        .use(remarkParse)
        .use(remarkMdx)
        .use(remarkGfm)
        .use(remarkStripMdx, { titleBySlug, site: base })
        .use(remarkStringify, { bullet: '-', fences: true, rule: '-' })
        .process(post.body ?? '');

      const meta = [
        `URL: ${canonical}`,
        `Published: ${formatDate(data.date)}`,
        data.updated ? `Updated: ${formatDate(data.updated)}` : null,
        data.description ? `Description: ${data.description}` : null,
      ]
        .filter(Boolean)
        .join('  \n');

      return `# ${data.title}\n\n${meta}\n\n${String(file).trim()}\n`;
    }),
  );

  const intro = [
    '# Simon Green — sjg.io (full text)',
    '',
    '> Full Markdown corpus of every published article on https://sjg.io,',
    '> concatenated for agents and tooling. This is the long companion to',
    '> https://sjg.io/llms.txt (the curated index). Articles appear in reverse',
    '> chronological order; each section carries its canonical URL for citation.',
    '> Views expressed are personal and do not necessarily represent any employer.',
    '',
  ].join('\n');

  const body = `${intro}\n${sections.join('\n---\n\n')}`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
