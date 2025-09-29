import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'sjg.io',
    description: "Simon's personal website and blog",
    home_page_url: 'https://sjg.io',
    feed_url: 'https://sjg.io/feed.json',
    language: 'en',
    items: posts.map((post) => ({
      id: post.slug,
      title: post.data.title,
      content_text: post.data.description,
      url: `https://sjg.io/writing/${post.slug}/`,
      date_published: post.data.date.toISOString(),
      tags: post.data.tags,
    })),
  };
  
  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
