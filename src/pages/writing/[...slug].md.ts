import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'UTC' }).format(date);

export const GET: APIRoute = ({ props, site }) => {
  const post = props.post as CollectionEntry<'posts'>;
  const { data } = post;

  const canonical =
    data.canonical ?? new URL(`/writing/${post.id}/`, site ?? 'https://sjg.io').toString();

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

  const body = post.body ?? '';
  const markdown = `${header}\n\n# ${data.title}\n\n${body}`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
