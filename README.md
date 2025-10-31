# sjg.io

Personal site for **Simon Green** — technology leader, builder, investor.

This repo contains the source for [sjg.io](https://sjg.io), a statically
generated site built with [Astro](https://astro.build), [MDX](https://mdxjs.com),
and [Tailwind CSS](https://tailwindcss.com).

## Goals
- Fast, lightweight, privacy-respecting site.
- Markdown/MDX driven content collections (posts, pages).
- Automated build and deploy from GitHub to Cloudflare Workers.
- Minimal maintenance burden.

## Development

### Initial Setup

This project uses sandboxed environments for development:

1. **Install system dependencies:**
   ```bash
   sudo apt update && sudo apt install -y \
     curl wget git build-essential \
     python3-venv python3-pip python3-dev python3-setuptools python3-wheel
   ```

2. **Install Node.js via nvm (Node Version Manager):**
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   nvm install --lts
   ```

3. **Set up Python virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

4. **Install project dependencies:**
   ```bash
   npm install
   ```

### Daily Development

**Option 1: Use the setup script (recommended):**
```bash
./setup-dev.sh
npm run dev
```

**Option 2: Manual activation:**
```bash
# Load Node.js via nvm
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Activate Python virtual environment
source venv/bin/activate

# Start development
npm run dev
```

**Option 3: Use direnv (if installed):**
```bash
direnv allow
npm run dev
```

### Available Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
```

## Content

Content is managed through Astro Content Collections in `src/content/`:

- `posts/` — essays and notes
- `pages/` — static pages (about, now, contact, colophon) and work case studies (`pages/work/`)

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
