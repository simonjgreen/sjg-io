import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  const feedUrl = new URL('rss.xml', context.site).href;
  const lastBuildDate =
    posts.length > 0
      ? new Date(
          Math.max(...posts.map((post) => post.data.date.getTime())),
        ).toUTCString()
      : new Date().toUTCString();

  return rss({
    title: 'sjg.io',
    description: "Simon's personal website and blog",
    site: context.site,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      sy: 'http://purl.org/rss/1.0/modules/syndication/',
    },
    customData: [
      `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
      `<lastBuildDate>${lastBuildDate}</lastBuildDate>`,
      `<language>en-GB</language>`,
      `<sy:updatePeriod>weekly</sy:updatePeriod>`,
      `<sy:updateFrequency>1</sy:updateFrequency>`,
    ].join(''),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writing/${post.id}/`,
    })),
  });
}
