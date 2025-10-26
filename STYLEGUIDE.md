# Style Guide

This document outlines the coding standards, conventions, and best practices for sjg.io

## Naming Conventions

### Files and Directories
- **Components**: PascalCase (e.g., `Button.astro`, `LogoRow.astro`)
- **Pages**: kebab-case (e.g., `about.astro`, `work/index.astro`)
- **Content files**: kebab-case (e.g., `against-the-great-convergence.mdx`)
- **Directories**: kebab-case (e.g., `src/components/`, `src/content/posts/`)
- **Static assets**: kebab-case (e.g., `favicon.svg`, `robots.txt`)

### Variables and Functions
- **Variables**: camelCase (e.g., `currentPath`, `recentPosts`)
- **Functions**: camelCase (e.g., `getCollection`, `generateOgImage`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_POSTS`, `DEFAULT_THEME`)
- **Interfaces**: PascalCase (e.g., `Props`, `OgImageOptions`)

### CSS Classes
- **Tailwind utilities**: Use Tailwind's built-in classes
- **Custom classes**: kebab-case (e.g., `logo-container`, `logo-svg`)
- **Component variants**: Use descriptive names (e.g., `variant-primary`, `size-lg`)

### URLs and Routes
- **URLs**: lowercase with hyphens (e.g., `/writing/against-the-great-convergence/`)
- **Route parameters**: camelCase in code, kebab-case in URLs
- **API endpoints**: kebab-case (e.g., `/api/og-image`)

## Error Handling

### General Principles
- **Fail fast**: Validate inputs early and throw descriptive errors
- **User-friendly messages**: Don't expose internal implementation details
- **Graceful degradation**: Provide fallbacks for non-critical features

### Error Patterns

#### Content Collection Errors
```typescript
// Good: Specific error with context
if (!nowContent) {
  throw new Error('Now page content not found');
}

// Good: Validation with helpful message
const posts = await getCollection('posts', ({ data, slug }) => {
  if (!data.title) {
    throw new Error(`Post missing title: ${slug}`);
  }
  return !data.draft;
});
```

#### Component Props Validation
```typescript
// Good: Type-safe props with defaults
export interface Props {
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}

const { 
  href, 
  variant = 'primary',  // Default value
  size = 'md',          // Default value
  class: className 
} = Astro.props;
```

#### Build-time Error Handling
```typescript
// Good: Validate required data at build time
export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  
  if (posts.length === 0) {
    console.warn('No published posts found');
  }
  
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}
```

## Logging

### Logging Levels
Since this is a static site, logging is primarily for build-time debugging:

- **Error**: Build failures, missing required content
- **Warn**: Missing optional content, deprecated features
- **Info**: Build progress, successful operations
- **Debug**: Detailed build information (development only)

### Logging Patterns

#### Build-time Logging
```typescript
// Good: Informative build messages
console.log(`Building ${posts.length} posts`);
console.warn(`Post "${post.slug}" missing description`);
console.error(`Failed to generate OG image for ${post.slug}`);
```

#### Development Logging
```typescript
// Good: Debug information in development
if (import.meta.env.DEV) {
  console.debug('Rendering component with props:', props);
}
```

#### Content Validation Logging
```typescript
// Good: Log content issues during build
const posts = await getCollection('posts', ({ data }) => {
  if (data.draft) {
    console.debug(`Skipping draft post: ${post.slug}`);
    return false;
  }
  
  if (!data.description) {
    console.warn(`Post "${post.slug}" missing description`);
  }
  
  return true;
});
```

## Testing Conventions

### Test Structure
While this project doesn't currently have automated tests, here are the conventions for when they're added:

#### Unit Tests
- **Location**: `tests/` directory
- **Naming**: `*.test.ts` or `*.spec.ts`
- **Coverage**: Components, utilities, content validation

#### Integration Tests
- **Location**: `tests/integration/`
- **Coverage**: Page rendering, content collections, build process

#### E2E Tests
- **Location**: `tests/e2e/`
- **Coverage**: Critical user journeys, accessibility, performance

### Test Patterns

#### Component Testing
```typescript
// Example: Component prop validation
describe('Button Component', () => {
  it('should render with default props', () => {
    // Test default variant and size
  });
  
  it('should apply custom classes', () => {
    // Test className prop
  });
  
  it('should render as link when href provided', () => {
    // Test href prop behavior
  });
});
```

#### Content Testing
```typescript
// Example: Content collection validation
describe('Content Collections', () => {
  it('should have valid post frontmatter', async () => {
    const posts = await getCollection('posts');
    posts.forEach(post => {
      expect(post.data.title).toBeDefined();
      expect(post.data.date).toBeInstanceOf(Date);
    });
  });
});
```

#### Build Testing
```typescript
// Example: Build output validation
describe('Build Process', () => {
  it('should generate all expected pages', async () => {
    // Test static path generation
  });
  
  it('should include required meta tags', async () => {
    // Test SEO elements
  });
});
```

## Code Organization

### File Structure
```
src/
├── components/          # Reusable UI components
├── content/            # Content collections and schemas
├── layouts/            # Page layout templates
├── pages/              # Route handlers and static pages
├── styles/             # Global styles and Tailwind config
└── images/             # Static images and assets
```

### Import Organization
```typescript
// 1. Node modules
import { marked } from 'marked';
import readingTime from 'reading-time';

// 2. Astro imports
import { getCollection } from 'astro:content';

// 3. Local imports (components, layouts, utilities)
import Base from '../layouts/Base.astro';
import Button from '../components/Button.astro';
```

### Component Structure
```astro
---
// 1. Imports
// 2. Type definitions
// 3. Props destructuring with defaults
// 4. Data fetching/processing
// 5. Computed values
---

<!-- 1. HTML structure -->
<!-- 2. Conditional rendering -->
<!-- 3. Loops and dynamic content -->
```

## Performance Guidelines

### Image Optimization
- Use AVIF/WebP formats when possible
- Implement responsive images with multiple sizes
- Add lazy loading for below-the-fold images
- Include proper alt text for accessibility

### Header Images
- Place images in `public/` directory for direct serving
- Use descriptive filenames (e.g., `post-title-header.jpg`)
- Recommended dimensions: 1200×630px for optimal social media previews
- Images are automatically used for Open Graph meta tags
- Header images display above post title with rounded corners and shadow

### Code Splitting
- Keep components focused and single-purpose
- Use dynamic imports for large dependencies
- Minimize JavaScript in static pages

### SEO and Accessibility
- Include proper meta tags and structured data
- Use semantic HTML elements
- Ensure proper heading hierarchy
- Test with screen readers

### Dark Mode Support
- All components should support both light and dark themes
- Use Tailwind's `dark:` prefix for dark mode styles
- Test table headers and other elements for proper contrast
- Ensure text remains readable in both themes

## Content Guidelines

### Markdown/MDX
- Use consistent heading levels
- Include frontmatter for all content
- Validate required fields (title, description, date)
- Use descriptive alt text for images

#### Bullet Points and Lists
- **Main bullets**: Use dashes (`-`) at the start of the line
- **Sub-bullets**: Use dashes (`-`) with 2-space indentation (`  -`)
- **Never use bullet symbols** (`•`) - let the markdown renderer handle bullet display
- **Consistent indentation**: Always use 2 spaces for each indentation level

**Examples:**
```markdown
- Main bullet point
  - Sub-bullet with proper indentation
  - Another sub-bullet
- Another main bullet
  - Nested sub-bullet
    - Deeply nested bullet (4 spaces)
```

### Frontmatter Schema
```yaml
title: "Descriptive Title"
description: "Compelling description under 160 characters"
date: 2024-01-15
updated: 2024-01-20  # Optional
tags: ["tag1", "tag2"]  # Optional
draft: false  # Optional, defaults to false
image: "/path/to/header-image.jpg"  # Optional - header image for posts
canonical: "https://example.com"  # Optional
ogTitle: "Custom OG Title"  # Optional
ogDescription: "Custom OG Description"  # Optional
```

## Git Conventions

### Commit Messages
- **Format**: `type(scope): description`
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Examples**:
  - `feat(components): add Button component with variants`
  - `fix(content): validate required frontmatter fields`
  - `docs(readme): update development setup instructions`

### Branch Naming
- **Feature branches**: `feature/description`
- **Bug fixes**: `fix/description`
- **Documentation**: `docs/description`
- **Examples**: `feature/contact-form`, `fix/og-image-generation`

## Tools and Configuration

### Required Tools
- **Node.js**: LTS version via nvm
- **Package Manager**: npm
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier with Astro plugin
- **Type Checking**: Astro's built-in TypeScript checking

### Editor Configuration
- Use the provided ESLint and Prettier configurations
- Enable TypeScript checking in your editor
- Use the Astro VS Code extension for syntax highlighting
