#!/usr/bin/env node
/**
 * Tag Validation Script
 * 
 * Validates that all post tags follow the standardized conventions:
 * - All tags must be lowercase
 * - Multi-word tags must use kebab-case (hyphens, no spaces)
 * - Single-word tags should be lowercase
 * - No uppercase letters (except in brand names, which should still be lowercase)
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const postsDir = join(__dirname, '../content/posts');
const canonicalTagsPath = join(__dirname, '../data/canonical-tags.json');

interface CanonicalTags {
  canonicalTags: string[];
  consolidationMap: Record<string, string>;
}

let canonicalTags: CanonicalTags | null = null;

function loadCanonicalTags(): CanonicalTags | null {
  try {
    const content = readFileSync(canonicalTagsPath, 'utf-8');
    return JSON.parse(content) as CanonicalTags;
  } catch (error) {
    return null;
  }
}

interface TagIssue {
  post: string;
  tag: string;
  issue: string;
  suggestion?: string;
}

interface ValidationResult {
  valid: boolean;
  issues: TagIssue[];
  stats: {
    totalPosts: number;
    totalTags: number;
    uniqueTags: number;
  };
}

/**
 * Validates a single tag against the rules and canonical list
 */
function validateTag(tag: string): { valid: boolean; issue?: string; suggestion?: string } {
  // Load canonical tags if not already loaded
  if (!canonicalTags) {
    canonicalTags = loadCanonicalTags();
  }

  // Check if tag should be consolidated
  if (canonicalTags && canonicalTags.consolidationMap[tag]) {
    return {
      valid: false,
      issue: 'Tag should be consolidated',
      suggestion: canonicalTags.consolidationMap[tag],
    };
  }
  // Check for uppercase letters
  if (tag !== tag.toLowerCase()) {
    return {
      valid: false,
      issue: 'Contains uppercase letters',
      suggestion: tag.toLowerCase(),
    };
  }

  // Check for spaces (should use hyphens instead)
  if (tag.includes(' ')) {
    return {
      valid: false,
      issue: 'Contains spaces (should use hyphens)',
      suggestion: tag.replace(/\s+/g, '-'),
    };
  }

  // Check for underscores (should use hyphens)
  if (tag.includes('_')) {
    return {
      valid: false,
      issue: 'Contains underscores (should use hyphens)',
      suggestion: tag.replace(/_/g, '-'),
    };
  }

  // Check for multiple consecutive hyphens
  if (tag.includes('--')) {
    return {
      valid: false,
      issue: 'Contains multiple consecutive hyphens',
      suggestion: tag.replace(/-+/g, '-'),
    };
  }

  // Check for leading/trailing hyphens
  if (tag.startsWith('-') || tag.endsWith('-')) {
    return {
      valid: false,
      issue: 'Contains leading or trailing hyphens',
      suggestion: tag.replace(/^-+|-+$/g, ''),
    };
  }

  // Check for empty tag
  if (tag.trim() === '') {
    return {
      valid: false,
      issue: 'Empty tag',
      suggestion: undefined,
    };
  }

  return { valid: true };
}

/**
 * Parse frontmatter from MDX file
 */
function parseFrontmatter(content: string): { tags?: string[]; slug: string } {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { slug: 'unknown' };
  }

  const frontmatter = frontmatterMatch[1];
  const tagsMatch = frontmatter.match(/^tags:\s*\[(.*?)\]/m);
  const slugMatch = frontmatter.match(/^slug:\s*["']?([^"'\n]+)["']?/m) || 
                    content.match(/^---[\s\S]*?---\s*\n#+\s*(.+?)\n/m);

  let tags: string[] = [];
  if (tagsMatch) {
    // Parse array: ["tag1", "tag2", "tag3"]
    const tagsString = tagsMatch[1];
    const tagMatches = tagsString.matchAll(/"([^"]+)"/g);
    tags = Array.from(tagMatches, m => m[1]);
  }

  // Extract slug from filename if not in frontmatter
  let slug = slugMatch ? slugMatch[1].trim() : 'unknown';

  return { tags, slug };
}

/**
 * Main validation function
 */
function validateTags(): ValidationResult {
  const issues: TagIssue[] = [];
  const allTags = new Set<string>();
  const postFiles = readdirSync(postsDir).filter(f => f.endsWith('.mdx'));

  for (const file of postFiles) {
    const filePath = join(postsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const { tags, slug } = parseFrontmatter(content);
    
    // Use filename without extension as slug if not found
    const postSlug = slug === 'unknown' ? file.replace('.mdx', '') : slug;

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        allTags.add(tag);
        const validation = validateTag(tag);

        if (!validation.valid) {
          issues.push({
            post: postSlug,
            tag,
            issue: validation.issue!,
            suggestion: validation.suggestion,
          });
        }
      }
    }
  }

  const totalTags = postFiles.reduce((sum, file) => {
    const filePath = join(postsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const { tags } = parseFrontmatter(content);
    return sum + (tags?.length || 0);
  }, 0);

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      totalPosts: postFiles.length,
      totalTags,
      uniqueTags: allTags.size,
    },
  };
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Validating post tags...\n');

  const result = validateTags();

  // Load canonical tags for suggestions
  const canonicalTags = loadCanonicalTags();

  // Print statistics
  console.log('📊 Statistics:');
  console.log(`   Total posts: ${result.stats.totalPosts}`);
  console.log(`   Total tags: ${result.stats.totalTags}`);
  console.log(`   Unique tags: ${result.stats.uniqueTags}`);
  if (canonicalTags) {
    const nonCanonicalTags = result.issues
      .filter(i => canonicalTags.canonicalTags.includes(i.tag) === false)
      .map(i => i.tag);
    const uniqueNonCanonical = [...new Set(nonCanonicalTags)];
    if (uniqueNonCanonical.length > 0) {
      console.log(`   Non-canonical tags: ${uniqueNonCanonical.length}`);
    }
  }
  console.log('');

  // Print issues if any
  if (result.issues.length > 0) {
    console.log(`❌ Found ${result.issues.length} tag issue(s):\n`);

    // Group issues by post
    const issuesByPost = new Map<string, TagIssue[]>();
    for (const issue of result.issues) {
      if (!issuesByPost.has(issue.post)) {
        issuesByPost.set(issue.post, []);
      }
      issuesByPost.get(issue.post)!.push(issue);
    }

    // Print issues grouped by post
    for (const [post, postIssues] of issuesByPost.entries()) {
      console.log(`📝 ${post}:`);
      for (const issue of postIssues) {
        console.log(`   ❌ "${issue.tag}" - ${issue.issue}`);
        if (issue.suggestion) {
          console.log(`      💡 Suggestion: "${issue.suggestion}"`);
        }
      }
      console.log('');
    }

    console.log('💡 Tag Rules:');
    console.log('   - All tags must be lowercase');
    console.log('   - Multi-word tags must use kebab-case (hyphens, no spaces)');
    console.log('   - Single-word tags should be lowercase');
    console.log('   - No underscores or multiple consecutive hyphens');
    if (canonicalTags) {
      console.log('   - Use canonical tags when possible (see canonical-tags.json)');
      console.log('   - Consolidate tags according to consolidationMap');
    }
    console.log('');

    process.exit(1);
  } else {
    console.log('✅ All tags are valid!\n');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-tags.ts')) {
  try {
    main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

export { validateTags, validateTag };

