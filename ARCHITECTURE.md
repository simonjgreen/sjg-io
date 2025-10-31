# sjg.io Architecture

This document describes the technical architecture and conventions of the site.

---

## Overview
- **Framework:** Astro + MDX
- **Styling:** Tailwind CSS
- **Hosting:** Cloudflare Workers (static assets)
- **CI/CD:** GitHub Actions (CI + deploy via Wrangler)
- **Analytics:** Cloudflare Web Analytics (privacy-focused, auto-injected)
- **Domain:** sjg.io (delegated to Cloudflare DNS)
- **Preview:** preview{NUMBER}.sjg.io (for PR previews, where NUMBER is the PR number)

---

## Content model
Astro [Content Collections](https://docs.astro.build/en/guides/content-collections/)
are used to type and validate frontmatter.

Collections:
- `posts` — essays and notes
- `pages` — about, now, contact, colophon, and work case studies (`pages/work/`)

---

## Deployment flow
1. Developer pushes to a branch → Pull request.
2. **CI (`ci.yml`):**  
   - Lint, type-check, build, link-check.
3. **Preview (`preview.yml`):  
   - Build Astro project with preview config.
   - Deploy `dist/` to Cloudflare Workers using Wrangler.
   - Map to `preview{NUMBER}.sjg.io` via Cloudflare routes (where NUMBER is the PR number).
   - Automatically cleaned up when PR is merged or closed.
4. Push to `main` branch.
5. **Deploy (`deploy.yml`):**  
   - Build Astro project.  
   - Deploy `dist/` to Cloudflare Workers using Wrangler.  
   - Map to `sjg.io` via Cloudflare routes.

Secrets required in repo settings:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

## DNS
- Zone hosted on Cloudflare.
- Apex (`sjg.io`) routed to the Worker.
- `www.sjg.io` redirects to `sjg.io`.
- `preview{NUMBER}.sjg.io` subdomains routed to preview Workers (created per PR).

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
- Branch naming: `feature/description`, `fix/description`, or `docs/description`.
- Commit via PR to `main` (branch protection enabled).
- CI must pass before merge.
