# sjg.io Architecture

This document describes the technical architecture and conventions of the site.

---

## Overview
- **Framework:** Astro + MDX
- **Styling:** Tailwind CSS
- **Hosting:** Cloudflare Pages (static site hosting)
- **CI/CD:** GitHub Actions (CI + deploy via Pages)
- **Analytics:** Plausible (EU-hosted, cookie-less)
- **Domain:** sjg.io (delegated to Cloudflare DNS)
- **Preview:** preview.sjg.io (for PR previews)

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
3. **Preview (`preview.yml`):**  
   - Build Astro project with preview config.
   - Deploy `dist/` to Cloudflare Pages.
   - Map to `preview.sjg.io` via Cloudflare custom domain.
4. Merge PR → `main`.
5. **Deploy (`deploy.yml`):**  
   - Build Astro project.  
   - Deploy `dist/` to Cloudflare Pages.  
   - Map to `sjg.io` via Cloudflare custom domain.

Secrets required in repo settings:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

## DNS
- Zone hosted on Cloudflare.
- Apex and `www` both routed to the Pages deployment.
- `preview.sjg.io` routed to preview Pages deployment.

---

## Performance & a11y
- Target Lighthouse scores ≥ 95 across Performance, A11y, SEO, Best Practices.
- Images: AVIF/WebP, responsive sizes, lazy load.
- Supports dark mode and prefers-reduced-motion.

---

## Future growth
- Can migrate from static to server output with the `@astrojs/cloudflare` adapter
  if dynamic endpoints are needed (forms, APIs, etc.).
- Cloudflare KV, R2, or D1 can be bound into Pages Functions for persistence.

---

## Conventions
- Lowercase hyphenated slugs.
- Frontmatter `tags` field for taxonomy.
- Commit via PR to `main` (branch protection enabled).
- CI must pass before merge.
