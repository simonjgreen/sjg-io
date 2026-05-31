import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  // `image()` resolves the frontmatter path (relative to the post file) to an
  // ImageMetadata object, so the build pipeline optimises the header image
  // (WebP, responsive srcset, intrinsic dimensions) when rendered via <Image>.
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.date(),
      updated: z.date().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      hero: z.string().optional(),
      image: image().optional(),
      canonical: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      previewTitle: z.string().optional(),
      previewDescription: z.string().optional(),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    updated: z.date().optional(),
    homepageSummary: z.string().optional(),
  }),
});

export const collections = {
  posts,
  pages,
};