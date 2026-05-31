#!/usr/bin/env node
/**
 * Feed / Sitemap / Schema Validation Script
 *
 * Runs AFTER `astro build`, against the generated `dist/` output. It guards the
 * site's machine-readable surface area and fails CI if anything is malformed:
 *
 *  - dist/feed.json parses as JSON and every item `url` is a valid absolute
 *    http(s) URL.
 *  - dist/rss.xml, dist/sitemap-0.xml and dist/sitemap-index.xml parse as XML
 *    and every contained URL (<loc>, <link>, <guid>, feed/atom links) is a
 *    valid absolute http(s) URL.
 *  - No generated URL anywhere in those files contains the literal substrings
 *    `undefined` or `null` (catches template interpolation bugs).
 *  - Any JSON-LD (`<script type="application/ld+json">`) embedded in a sample
 *    of built `dist/**\/index.html` pages parses as valid JSON.
 *
 * Internal/external broken links are intentionally NOT checked here; the
 * existing lychee step in CI already covers those.
 *
 * Exits nonzero on the first category of failure, printing clear messages.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../../dist');

const errors: string[] = [];

function fail(msg: string): void {
  errors.push(msg);
}

/** A URL is valid if it parses and uses an absolute http(s) scheme. */
function isValidAbsoluteHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Reject any string containing the literal "undefined" / "null" substrings. */
function hasBadLiteral(value: string): boolean {
  return /undefined|null/.test(value);
}

function checkUrl(context: string, value: unknown): void {
  if (typeof value !== 'string') {
    fail(`${context}: expected a string URL but got ${typeof value} (${JSON.stringify(value)})`);
    return;
  }
  if (hasBadLiteral(value)) {
    fail(`${context}: URL contains forbidden literal "undefined"/"null": ${value}`);
  }
  if (!isValidAbsoluteHttpUrl(value)) {
    fail(`${context}: not a valid absolute http(s) URL: ${value}`);
  }
}

function readDistFile(relPath: string): string | null {
  const full = join(distDir, relPath);
  if (!existsSync(full)) {
    fail(`Missing expected build artifact: dist/${relPath}`);
    return null;
  }
  return readFileSync(full, 'utf-8');
}

// ---------------------------------------------------------------------------
// 1. feed.json (JSON Feed)
// ---------------------------------------------------------------------------
function validateJsonFeed(): void {
  const raw = readDistFile('feed.json');
  if (raw === null) return;

  let feed: unknown;
  try {
    feed = JSON.parse(raw);
  } catch (err) {
    fail(`dist/feed.json: invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  const f = feed as { feed_url?: unknown; home_page_url?: unknown; items?: unknown };
  if (typeof f.home_page_url === 'string') checkUrl('feed.json home_page_url', f.home_page_url);
  if (typeof f.feed_url === 'string') checkUrl('feed.json feed_url', f.feed_url);

  if (!Array.isArray(f.items)) {
    fail('dist/feed.json: "items" is missing or not an array');
    return;
  }
  f.items.forEach((item, i) => {
    const it = item as { url?: unknown };
    checkUrl(`feed.json items[${i}].url`, it.url);
  });
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

/** Recursively collect every string value from a parsed-XML object tree. */
function collectStrings(node: unknown, out: string[]): void {
  if (typeof node === 'string') {
    out.push(node);
  } else if (typeof node === 'number' || typeof node === 'boolean') {
    out.push(String(node));
  } else if (Array.isArray(node)) {
    for (const child of node) collectStrings(child, out);
  } else if (node && typeof node === 'object') {
    for (const value of Object.values(node)) collectStrings(value, out);
  }
}

// Element names whose text content is required to be an absolute URL,
// regardless of scheme. Used to catch non-URL junk (e.g. <loc>not-a-url</loc>)
// that the broad http(s)-prefix scan would otherwise skip.
const URL_BEARING_ELEMENTS = new Set(['loc', 'link', 'guid']);

/**
 * Get the text content of an element, ignoring attributes. With
 * `attributeNamePrefix: '@_'`, an element with attributes is parsed as an
 * object carrying a `#text` key; a bare element is a string/number.
 */
function elementText(value: unknown): string[] {
  const out: string[] = [];
  const visit = (v: unknown): void => {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out.push(String(v));
    } else if (Array.isArray(v)) {
      for (const c of v) visit(c);
    } else if (v && typeof v === 'object' && '#text' in v) {
      visit((v as Record<string, unknown>)['#text']);
    }
  };
  visit(value);
  return out;
}

/** Walk the parsed tree, validating text of known URL-bearing elements. */
function collectUrlElements(node: unknown, out: string[]): void {
  if (Array.isArray(node)) {
    for (const child of node) collectUrlElements(child, out);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (URL_BEARING_ELEMENTS.has(key)) {
        for (const t of elementText(value)) out.push(t);
      }
      collectUrlElements(value, out);
    }
  }
}

/** Parse XML, returning the parsed tree or null (recording a failure). */
function parseXml(relPath: string, raw: string): unknown | null {
  try {
    return xmlParser.parse(raw);
  } catch (err) {
    fail(`dist/${relPath}: invalid XML: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * Validate every URL-looking string in a parsed XML document. We treat any
 * string beginning with http:// or https:// as a URL to assert on, and also
 * scan all strings for the forbidden literals.
 */
function validateXmlUrls(relPath: string, raw: string): void {
  const parsed = parseXml(relPath, raw);
  if (parsed === null) return;

  // 1. Strictly validate text of known URL-bearing elements (<loc>, <link>,
  //    <guid>). These MUST be valid absolute http(s) URLs.
  const urlElements: string[] = [];
  collectUrlElements(parsed, urlElements);
  for (const u of urlElements) {
    checkUrl(`dist/${relPath} <loc>/<link>/<guid>`, u);
  }

  // 2. Defensively scan every string in the document for anything that looks
  //    like an absolute http(s) URL and validate it. This catches stray URLs
  //    that live outside the known URL-bearing elements (e.g. atom:link hrefs
  //    surfaced as attributes). The forbidden-literal check is intentionally
  //    NOT applied to arbitrary text here: free-text fields such as RSS
  //    <title>/<description> may legitimately contain words like "undefined
  //    behavior" or "null hypothesis". checkUrl() still enforces the
  //    forbidden-literal rule on every URL-bearing value (including relative
  //    paths such as "/writing/undefined/") via step 1.
  const strings: string[] = [];
  collectStrings(parsed, strings);
  for (const s of strings) {
    if (/^https?:\/\//i.test(s)) {
      checkUrl(`dist/${relPath} URL`, s);
    }
  }

  if (urlElements.length === 0) {
    fail(`dist/${relPath}: parsed as XML but contained no <loc>/<link>/<guid> URLs (unexpected)`);
  }
}

// ---------------------------------------------------------------------------
// 2 + 3. rss.xml, sitemap-0.xml, sitemap-index.xml
// ---------------------------------------------------------------------------
function validateXmlFeeds(): void {
  for (const relPath of ['rss.xml', 'sitemap-0.xml', 'sitemap-index.xml']) {
    const raw = readDistFile(relPath);
    if (raw === null) continue;
    validateXmlUrls(relPath, raw);
  }
}

// ---------------------------------------------------------------------------
// 4. JSON-LD in a sample of built pages
// ---------------------------------------------------------------------------
function findIndexHtml(dir: string, acc: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      findIndexHtml(full, acc);
    } else if (entry === 'index.html') {
      acc.push(full);
    }
  }
}

const JSON_LD_RE =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function validateJsonLd(): void {
  if (!existsSync(distDir)) return;

  const pages: string[] = [];
  findIndexHtml(distDir, pages);
  pages.sort();

  // Sample: cap the number of pages we open to keep this fast, but always
  // include the homepage if present.
  const SAMPLE_SIZE = 40;
  const homepage = join(distDir, 'index.html');
  const sample = new Set<string>();
  if (pages.includes(homepage)) sample.add(homepage);
  for (const p of pages) {
    if (sample.size >= SAMPLE_SIZE) break;
    sample.add(p);
  }

  let blockCount = 0;
  for (const page of sample) {
    const html = readFileSync(page, 'utf-8');
    let match: RegExpExecArray | null;
    JSON_LD_RE.lastIndex = 0;
    while ((match = JSON_LD_RE.exec(html)) !== null) {
      blockCount++;
      const jsonText = match[1].trim();
      const rel = page.slice(distDir.length + 1);
      try {
        JSON.parse(jsonText);
      } catch (err) {
        fail(
          `dist/${rel}: invalid JSON-LD (<script type="application/ld+json">): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }

  console.log(
    `   JSON-LD: scanned ${sample.size} page(s), found ${blockCount} ld+json block(s).`,
  );
}

// ---------------------------------------------------------------------------
function main(): void {
  console.log('🔍 Validating built feeds, sitemap, and schema (dist/)...\n');

  if (!existsSync(distDir)) {
    console.error(`❌ dist/ not found at ${distDir}. Run "npm run build" first.`);
    process.exit(1);
  }

  validateJsonFeed();
  validateXmlFeeds();
  validateJsonLd();

  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} validation issue(s):\n`);
    for (const e of errors) console.error(`   ❌ ${e}`);
    console.error('');
    process.exit(1);
  }

  console.log('\n✅ feed.json, rss.xml, sitemaps, and JSON-LD are all valid.\n');
  process.exit(0);
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('validate-feeds.ts')
) {
  try {
    main();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

export { isValidAbsoluteHttpUrl, hasBadLiteral };
