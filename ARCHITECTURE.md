# sjg.io Architecture

This document describes the technical architecture and conventions of the site.

---

## Overview
- **Framework:** Astro + MDX
- **Styling:** Tailwind CSS
- **Hosting:** Cloudflare Workers (static assets)
- **CI/CD:** GitHub Actions (CI + deploy via Wrangler)
- **Analytics:** Plausible (EU-hosted, cookie-less)
- **Domain:** sjg.io (delegated to Cloudflare DNS)

---

## Content model
Astro [Content Collections](https://docs.astro.build/en/guides/content-collections/)
are used to type and validate frontmatter.

Collections:
- `posts` — essays and notes

- `projects` — work case studies
- `pages` — about, now, contact, colophon

---

## Deployment flow
1. Developer pushes to a branch → Pull request.
2. **CI (`ci.yml`):**  
   - Lint, type-check, build, link-check, Lighthouse CI.
3. Merge PR → `main`.
4. **Deploy (`deploy.yml`):**  
   - Build Astro project.  
   - Deploy `dist/` to Cloudflare Workers using Wrangler.  
   - Map to `sjg.io` via Cloudflare routes.

Secrets required in repo settings:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

## DNS
- Zone hosted on Cloudflare.
- Apex and `www` both routed to the Worker.

---

## Performance & a11y
- Target Lighthouse scores ≥ 95 across Performance, A11y, SEO, Best Practices.
- Images: AVIF/WebP, responsive sizes, lazy load.
- Supports dark mode and prefers-reduced-motion.

---

## Future growth
- Can migrate from static to server output with the `@astrojs/cloudflare` adapter
  if dynamic endpoints are needed (forms, APIs, etc.).
- Cloudflare KV, R2, or D1 can be bound into the Worker for persistence.

---

## Conventions
- Lowercase hyphenated slugs.
- Frontmatter `tags` field for taxonomy.
- Commit via PR to `main` (branch protection enabled).
- CI must pass before merge.
