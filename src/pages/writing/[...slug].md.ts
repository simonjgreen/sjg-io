import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import type { Root, RootContent, Paragraph, Text } from 'mdast';

/**
 * Markdown export endpoint for writing pages — the SECOND publishing path.
 *
 * The HTML path renders `post.body` (MDX) through Astro + the site components.
 * This path serves the SAME source as clean, portable Markdown for agents and
 * tooling, so MDX-only constructs must be resolved away rather than leaked:
 *   - `import`/`export` (ESM) statements are dropped,
 *   - <Callout> becomes a blockquote (keeping its prose + icon),
 *   - <ArticleLink slug="…" /> becomes a real Markdown link,
 *   - any other component is unwrapped to its children.
 * Working at the mdast level (not regex) means fenced code blocks and inline
 * HTML are preserved verbatim.
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

      // Drop ESM imports/exports and JS expressions entirely.
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

        // Unknown component: keep its content, drop the wrapper.
        parent.children.splice(index, 1, ...(el.children ?? []));
        return index;
      }
    });
  };
}

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'UTC' }).format(date);

export const GET: APIRoute = async ({ props, site }) => {
  const post = props.post as CollectionEntry<'posts'>;
  const { data } = post;
  const base = site ?? new URL('https://sjg.io');

  const allPosts = await getCollection('posts');
  const titleBySlug = new Map(allPosts.map((p) => [p.id, p.data.title]));

  const canonical = data.canonical ?? new URL(`/writing/${post.id}/`, base).toString();

  const file = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(remarkStripMdx, { titleBySlug, site: base })
    .use(remarkStringify, { bullet: '-', fences: true, rule: '-' })
    .process(post.body ?? '');

  const header = [
    '---',
    `title: ${JSON.stringify(data.title)}`,
    `description: ${JSON.stringify(data.description)}`,
    `pubDate: ${formatDate(data.date)}`,
    data.updated ? `updated: ${formatDate(data.updated)}` : null,
    `canonical: ${JSON.stringify(canonical)}`,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  const markdown = `${header}\n\n# ${data.title}\n\n${String(file).trim()}\n`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
