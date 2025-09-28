# sjg.io

Personal site for **Simon Green** — technology leader, builder, investor.

This repo contains the source for [sjg.io](https://sjg.io), a statically
generated site built with [Astro](https://astro.build), [MDX](https://mdxjs.com),
and [Tailwind CSS](https://tailwindcss.com).

## Goals
- Fast, lightweight, privacy-respecting site.
- Markdown/MDX driven content collections (posts, projects, pages).
- Automated build and deploy from GitHub to Cloudflare Workers.
- Minimal maintenance burden.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Content

Content is managed through Astro Content Collections in `src/content/`:

- `posts/` — essays and notes
- `projects/` — work case studies
- `pages/` — static pages (about, now, contact, colophon)

All content uses MDX with validated frontmatter schemas.

## Deployment

The site deploys automatically to Cloudflare Workers via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions builds the site
3. Deploys to Cloudflare Workers using Wrangler
4. Serves from `sjg.io` domain

## Performance

Target Lighthouse scores ≥ 95 across all categories. The site is optimised for:
- Fast loading with static generation
- Minimal JavaScript footprint
- Privacy-respecting analytics (Plausible)
- Dark mode and accessibility support

See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.
