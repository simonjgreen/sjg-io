#!/usr/bin/env node
/**
 * Tag Analysis Script
 * 
 * Analyzes tag usage across posts to identify:
 * - Tags used multiple times (good for discoverability)
 * - Tags used only once (potential consolidation candidates)
 * - Similar tags that could be merged
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const postsDir = join(__dirname, '../content/posts');

function parseFrontmatter(content: string): { tags?: string[]; slug: string } {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { slug: 'unknown' };
  }

  const frontmatter = frontmatterMatch[1];
  const tagsMatch = frontmatter.match(/^tags:\s*\[(.*?)\]/m);
  const slugMatch = frontmatter.match(/^slug:\s*["']?([^"'\n]+)["']?/m);

  let tags: string[] = [];
  if (tagsMatch) {
    const tagsString = tagsMatch[1];
    const tagMatches = tagsString.matchAll(/"([^"]+)"/g);
    tags = Array.from(tagMatches, m => m[1]);
  }

  const slug = slugMatch ? slugMatch[1].trim() : 'unknown';
  return { tags, slug };
}

interface TagUsage {
  tag: string;
  count: number;
  posts: string[];
}

function analyzeTags(): void {
  const postFiles = readdirSync(postsDir).filter(f => f.endsWith('.mdx'));
  const tagMap = new Map<string, string[]>();

  for (const file of postFiles) {
    const filePath = join(postsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const { tags, slug } = parseFrontmatter(content);
    const postSlug = slug === 'unknown' ? file.replace('.mdx', '') : slug;

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, []);
        }
        tagMap.get(tag)!.push(postSlug);
      }
    }
  }

  // Convert to array and sort by usage
  const tagUsage: TagUsage[] = Array.from(tagMap.entries())
    .map(([tag, posts]) => ({
      tag,
      count: posts.length,
      posts,
    }))
    .sort((a, b) => b.count - a.count);

  // Statistics
  const totalTags = tagUsage.reduce((sum, t) => sum + t.count, 0);
  const uniqueTags = tagUsage.length;
  const singleUseTags = tagUsage.filter(t => t.count === 1).length;
  const multiUseTags = tagUsage.filter(t => t.count > 1).length;

  console.log('📊 Tag Usage Analysis\n');
  console.log(`Total posts: ${postFiles.length}`);
  console.log(`Total tag instances: ${totalTags}`);
  console.log(`Unique tags: ${uniqueTags}`);
  console.log(`Tags used once: ${singleUseTags} (${((singleUseTags / uniqueTags) * 100).toFixed(1)}%)`);
  console.log(`Tags used multiple times: ${multiUseTags} (${((multiUseTags / uniqueTags) * 100).toFixed(1)}%)\n`);

  // Tags used multiple times (good for discoverability)
  console.log('✅ Tags used multiple times (good for discoverability):');
  const multiUse = tagUsage.filter(t => t.count > 1);
  if (multiUse.length > 0) {
    multiUse.forEach(t => {
      console.log(`   ${t.tag} (${t.count} posts): ${t.posts.join(', ')}`);
    });
  } else {
    console.log('   None');
  }
  console.log('');

  // Tags used only once (potential consolidation candidates)
  console.log('⚠️  Tags used only once (consider consolidation):');
  const singleUse = tagUsage.filter(t => t.count === 1);
  if (singleUse.length > 0) {
    singleUse.forEach(t => {
      console.log(`   ${t.tag} → ${t.posts[0]}`);
    });
  }
  console.log('');

  // Potential consolidations
  console.log('💡 Potential tag consolidations:');
  const consolidations: Array<{ from: string; to: string; reason: string }> = [];

  // Check for similar tags
  const allTags = tagUsage.map(t => t.tag);
  
  // workflow vs workflow-engineering
  if (allTags.includes('workflow') && allTags.includes('workflow-engineering')) {
    consolidations.push({
      from: 'workflow-engineering',
      to: 'workflow',
      reason: 'More specific tag can be replaced with broader one',
    });
  }

  // operational-ai vs ai
  if (allTags.includes('operational-ai') && allTags.includes('ai')) {
    consolidations.push({
      from: 'operational-ai',
      to: 'ai',
      reason: 'Specific tag can use broader tag + context',
    });
  }

  // digital-skills vs skills
  if (allTags.includes('digital-skills') && allTags.includes('skills')) {
    consolidations.push({
      from: 'digital-skills',
      to: 'skills',
      reason: 'More specific tag can be replaced with broader one',
    });
  }

  // computer-literacy vs skills/education
  if (allTags.includes('computer-literacy') && (allTags.includes('skills') || allTags.includes('education'))) {
    consolidations.push({
      from: 'computer-literacy',
      to: 'skills',
      reason: 'Specific topic can use broader tag',
    });
  }

  if (consolidations.length > 0) {
    consolidations.forEach(c => {
      console.log(`   "${c.from}" → "${c.to}" (${c.reason})`);
    });
  } else {
    console.log('   No obvious consolidations found');
  }
  console.log('');

  // Recommendations
  console.log('📋 Recommendations:');
  console.log(`   - ${singleUseTags} tags are only used once. Consider:`);
  console.log('     • Using existing tags when possible');
  console.log('     • Consolidating similar tags');
  console.log('     • Creating a canonical tag list');
  console.log(`   - Average tags per post: ${(totalTags / postFiles.length).toFixed(1)}`);
  console.log(`   - Tag reuse rate: ${((multiUseTags / uniqueTags) * 100).toFixed(1)}%`);
  if ((multiUseTags / uniqueTags) < 0.3) {
    console.log('   ⚠️  Low tag reuse - consider consolidating tags for better discoverability');
  }
}

async function main() {
  analyzeTags();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('analyze-tags.ts')) {
  try {
    main().catch(console.error);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}



