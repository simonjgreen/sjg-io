# Agent Guide

A machine-friendly primer for AI agents working on the sjg.io codebase.

## What This Repo Does

**sjg.io** is a personal website and blog for Simon Green, built as a statically generated site using:

- **Framework**: Astro 6.x with MDX support
- **Styling**: Tailwind CSS with custom components
- **Content**: Markdown/MDX files in Astro Content Collections
- **Deployment**: Cloudflare Workers (static hosting)
- **Domain**: sjg.io (production) + preview{NUMBER}.sjg.io (PR previews, where NUMBER is the PR number)

The site serves as a portfolio, blog, and professional presence with content including:
- Personal essays and technical writing (`/writing/`)
- Work experience and case studies (`/work/`)
- Static pages (about, now, contact, colophon)
- RSS feed and JSON feed for content syndication

## Entry Points

### Main Application Entry
- **Primary**: `src/pages/index.astro` - Homepage with recent posts and work highlights
- **Config**: `astro.config.mjs` - Astro configuration with integrations
- **Content Schema**: `src/content/config.ts` - Content collection definitions

### Key Routes
```
/                    → src/pages/index.astro (homepage)
/about              → src/pages/about.astro
/work               → src/pages/work/index.astro
/work/wirehive      → src/pages/work/wirehive.astro (static pages, one per work item)
/writing            → src/pages/writing/index.astro
/writing/[slug]     → src/pages/writing/[...slug].astro (dynamic, uses getStaticPaths)
/writing/[slug].md  → src/pages/writing/[...slug].md.ts (clean Markdown export of the same post)
/now                → src/pages/now.astro
/contact            → src/pages/contact.astro
/colophon           → src/pages/colophon.astro
/media              → src/pages/media.astro
/mentors            → src/pages/mentors.astro
/rss.xml            → src/pages/rss.xml.js
/feed.json          → src/pages/feed.json.js
```

### Content Collections
- **Posts**: `src/content/posts/*.mdx` - Blog posts and essays (supports header images)
- **Pages**: `src/content/pages/*.mdx` - Static content pages (about, now, contact, colophon, media, mentors)
- **Work**: `src/content/pages/work/*.mdx` - Work experience pages

### Two Publishing Paths (HTML + Markdown)

⚠️ **Every writing post is published twice, from the same MDX source. Changes to how posts are authored or rendered must account for both paths.**

1. **HTML** — `src/pages/writing/[...slug].astro` renders `post.body` through Astro and the site's components (`Callout`, `ArticleLink`, etc.), wrapped in the `Post` layout. This is the human-facing page.
2. **Markdown** — `src/pages/writing/[...slug].md.ts` serves the *same* post as clean, portable Markdown at `/writing/<slug>.md`. It must be **plain Markdown** — no MDX leakage.

**Discoverability of the Markdown path** — the `.md` URLs are surfaced four ways:
- a per-article `<link rel="alternate" type="text/markdown">` in the page `<head>` (threaded as `markdownPath` through `Post.astro` → `Base.astro`),
- a human-readable note in the colophon,
- a line in `public/llms.txt` describing the `append .md` convention,
- a full enumeration in the sitemap — `astro.config.mjs` adds the `.md` URLs via `sitemap({ customPages: markdownWritingUrls() })`, because `@astrojs/sitemap` does not list non-HTML endpoints on its own.

Because MDX is a superset of Markdown, the `.md` endpoint cannot just emit `post.body` verbatim. It parses the body to an mdast tree (`remark-parse` + `remark-mdx`) and strips MDX-only constructs before serialising with `remark-stringify`:

- `import` / `export` (ESM) statements → removed
- `<Callout>` → blockquote (prose + icon preserved)
- `<ArticleLink slug="…" />` → a real Markdown link (title resolved from the collection)
- any other component → unwrapped to its children
- fenced code blocks and inline HTML → preserved verbatim (working at the AST level, never with regex, is what makes this safe — e.g. a literal `<Project or theme>` placeholder inside a code fence must survive)

**Maintenance rules:**
- When you introduce a **new MDX component for use in posts**, add a matching case to `remarkStripMdx` in `[...slug].md.ts` (map it to a Markdown equivalent, or rely on the default unwrap if its children are already Markdown). Verify after building with `grep -nE "^import [A-Za-z].*from " dist/writing/*.md` — this should find nothing (a leaked component always drags in its `import`, so the import line is the reliable signal). Do **not** grep for `<Capitalised>` tags: that false-positives on legitimate placeholders inside code fences, e.g. `<Project or theme>` in `cicd-for-communication.mdx`.
- `markdownWritingUrls()` in `astro.config.mjs` derives the sitemap entries from the post **filenames** and skips `draft: true`. This mirrors the `glob` loader's id logic; if post id derivation ever changes (e.g. nested folders, a custom slug field added to the schema), update that helper to match, or the sitemap and the real `.md` routes will diverge.

### Component System
- **Layouts**: `src/layouts/` - Base, Page, Post layout templates (Post supports header images)
- **Components**: `src/components/` - Reusable UI components (Button, Card, Header, etc.)
- **Styles**: `src/styles/globals.css` - Global styles and Tailwind imports (includes dark mode fixes)

## How to Run, Verify, and Test

### Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
# → Serves at http://localhost:4321

# 3. Alternative: Use setup script
./setup-dev.sh
npm run dev
```

### Available Commands
```bash
npm run dev        # Development server (port 4321)
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run lint       # ESLint code checking
npm run typecheck  # TypeScript type checking
npm run og:gen     # Generate OG images
```

### Verification Steps
1. **Build Check**: `npm run build` should complete without errors
2. **Type Check**: `npm run typecheck` should pass
3. **Lint Check**: `npm run lint` should pass
4. **Content Validation**: All content files should have valid frontmatter
5. **Preview Test**: `npm run preview` should serve the built site

### Testing (Future)
Currently no automated tests. When tests are added, they will follow the conventions outlined in [STYLEGUIDE.md](./STYLEGUIDE.md).

## How to Add a New Module or Endpoint

### Adding a New Page

#### 1. Static Page
```bash
# Create the page file
touch src/pages/new-page.astro
```

```astro
---
import Page from '../layouts/Page.astro';
---

<Page title="New Page" description="Description of the new page">
  <div class="prose">
    <h1>New Page</h1>
    <p>Content goes here...</p>
  </div>
</Page>
```

#### 2. Dynamic Page with Content
```bash
# Create content file
touch src/content/pages/new-page.mdx
```

```mdx
---
title: "New Page"
description: "Description of the new page"
---

# New Page

Content in MDX format...
```

```bash
# Create page handler
touch src/pages/new-page.astro
```

```astro
---
import Page from '../layouts/Page.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const pageContent = await getCollection('pages', ({ slug }) => slug === 'new-page');
  
  if (pageContent.length === 0) {
    throw new Error('New page content not found');
  }
  
  return [{
    params: {},
    props: { pageContent: pageContent[0] },
  }];
}

const { pageContent } = Astro.props;
const { Content } = await pageContent.render();
---

<Page title={pageContent.data.title} description={pageContent.data.description}>
  <Content />
</Page>
```

### Adding a New Component

```bash
# Create component file
touch src/components/NewComponent.astro
```

```astro
---
export interface Props {
  title: string;
  description?: string;
  class?: string;
}

const { title, description, class: className } = Astro.props;
---

<div class={`new-component ${className || ''}`}>
  <h2>{title}</h2>
  {description && <p>{description}</p>}
  <slot />
</div>
```

### Adding a New Content Collection

#### 1. Update Content Config
```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const newCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    category: z.string(),
  }),
});

export const collections = {
  posts,
  pages,
  newCollection, // Add to exports
};
```

#### 2. Create Content Files
```bash
mkdir src/content/new-collection
touch src/content/new-collection/example.mdx
```

#### 3. Create Page Handler
```bash
touch src/pages/new-collection/[...slug].astro
```

```astro
---
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const items = await getCollection('newCollection');
  return items.map((item) => ({
    params: { slug: item.slug },
    props: { item },
  }));
}

const { item } = Astro.props;
const { Content } = await item.render();
---

<Base title={item.data.title} description={item.data.description}>
  <Content />
</Base>
```

### Testing New Features

#### Manual Testing Checklist
- [ ] Page renders without errors
- [ ] Content displays correctly
- [ ] Navigation works properly
- [ ] SEO meta tags are present
- [ ] Responsive design works
- [ ] Dark mode compatibility
- [ ] Accessibility (keyboard navigation, screen readers)

#### Build Verification
```bash
# Test production build
npm run build
npm run preview

# Check for build errors
npm run typecheck
npm run lint
```

### Deployment

Changes are automatically deployed via GitHub Actions:
1. Push to `main` branch → Production deployment to sjg.io (via `deploy.yml`)
2. Create PR → Preview deployment to `preview{NUMBER}.sjg.io` (via `preview.yml`, where NUMBER is the PR number)
3. PR merged or closed → Preview deployment automatically cleaned up
4. No manual deployment steps required

### Common Patterns

#### Content Collection Usage
```typescript
// Get all published posts
const posts = await getCollection('posts', ({ data }) => !data.draft);

// Get posts by tag
const taggedPosts = await getCollection('posts', ({ data }) => 
  data.tags.includes('javascript')
);

// Sort by date
const sortedPosts = posts.sort((a, b) => 
  b.data.date.getTime() - a.data.date.getTime()
);
```

#### Component Props
```astro
---
export interface Props {
  required: string;
  optional?: string;
  variant?: 'primary' | 'secondary';
  class?: string;
}

const { 
  required, 
  optional = 'default', 
  variant = 'primary',
  class: className 
} = Astro.props;
---
```

#### Error Handling
```astro
---
try {
  const content = await getCollection('posts');
} catch (error) {
  console.error('Failed to load posts:', error);
  // Handle gracefully
}
---
```

This guide provides the essential information for AI agents to understand and contribute to the codebase effectively.
