# Agent Guide

A machine-friendly primer for AI agents working on the sjg.io codebase.

## What This Repo Does

**sjg.io** is a personal website and blog for Simon Green, built as a statically generated site using:

- **Framework**: Astro 4.x with MDX support
- **Styling**: Tailwind CSS with custom components
- **Content**: Markdown/MDX files in Astro Content Collections
- **Deployment**: Cloudflare Workers (static hosting)
- **Domain**: sjg.io (production) + preview.sjg.io (PR previews)

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
/work/[slug]        → src/pages/work/[slug].astro
/writing            → src/pages/writing/index.astro
/writing/[slug]     → src/pages/writing/[...slug].astro
/now                → src/pages/now.astro
/contact            → src/pages/contact.astro
/colophon           → src/pages/colophon.astro
/media              → src/pages/media.astro
/mentors            → src/pages/mentors.astro
/rss.xml            → src/pages/rss.xml.js
/feed.json          → src/pages/feed.json.js
```

### Content Collections
- **Posts**: `src/content/posts/*.mdx` - Blog posts and essays
- **Pages**: `src/content/pages/*.mdx` - Static content pages (about, now, contact, colophon, media, mentors)
- **Work**: `src/content/pages/work/*.mdx` - Work experience pages

### Component System
- **Layouts**: `src/layouts/` - Base, Page, Post layout templates
- **Components**: `src/components/` - Reusable UI components (Button, Card, Header, etc.)
- **Styles**: `src/styles/globals.css` - Global styles and Tailwind imports

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
Currently no automated tests, but when added:
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Coverage: `npm run test:coverage`

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

const pageContent = await getCollection('pages', ({ slug }) => slug === 'new-page');
const { Content } = await pageContent[0].render();
---

<Page title={pageContent[0].data.title} description={pageContent[0].data.description}>
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

### Adding a New API Endpoint

```bash
# Create API endpoint
touch src/pages/api/new-endpoint.js
```

```javascript
export async function GET({ request, url }) {
  const searchParams = url.searchParams;
  const param = searchParams.get('param');
  
  return new Response(JSON.stringify({ 
    message: 'Hello from new endpoint',
    param 
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
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
1. Push to `main` branch → Production deployment to sjg.io
2. Create PR → Preview deployment to preview.sjg.io
3. No manual deployment steps required

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

This guide provides the essential information for AI agents to understand and contribute to the  codebase effectively.
