/**
 * validate-images — CI sanity check for committed image assets.
 *
 * Inspects every raster image committed under the scanned roots and enforces
 * the project's image budget (see specification.website / Image optimisation,
 * tracked in issue #176). Run in CI via `npm run validate:images`; exits
 * non-zero on any violation so a regression (e.g. dropping a 4 MB PNG into
 * `public/`) fails the build before it ships.
 *
 * Budget:
 *   - Max dimension (width or height): 2048px — never serve images larger than
 *     ~2x the widest layout container.
 *   - Max file size: 600 KB for photographic formats.
 *   - PNG is only permitted for small UI assets (icons/logos/diagrams), capped
 *     at 150 KB; larger photographic PNGs must be WebP/AVIF.
 *   - SVG (vector) is exempt from the raster checks.
 *
 * The optimisation pipeline itself lives in Astro's `<Image>` / build step;
 * this script guards the *source* assets that feed it.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const MAX_DIMENSION = 2048;
const MAX_BYTES = 600 * 1024;
const PNG_MAX_BYTES = 150 * 1024;

// Directories (relative to repo root) whose committed images are checked.
const SCAN_ROOTS = ['public', 'src/assets'];

const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']);

interface Violation {
  file: string;
  reason: string;
}

function fmtKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function walk(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function main(): Promise<void> {
  const violations: Violation[] = [];
  let checked = 0;

  for (const root of SCAN_ROOTS) {
    const files = await walk(root);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!RASTER_EXT.has(ext)) continue;
      checked++;

      const { size } = await fs.stat(file);
      let meta;
      try {
        meta = await sharp(file).metadata();
      } catch (err) {
        violations.push({ file, reason: `unreadable image (${(err as Error).message})` });
        continue;
      }

      const width = meta.width ?? 0;
      const height = meta.height ?? 0;
      const format = meta.format ?? ext.slice(1);

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        violations.push({
          file,
          reason: `dimensions ${width}x${height} exceed ${MAX_DIMENSION}px cap — downscale it`,
        });
      }

      if (format === 'png') {
        if (size > PNG_MAX_BYTES) {
          violations.push({
            file,
            reason: `PNG is ${fmtKB(size)} (> ${fmtKB(PNG_MAX_BYTES)} cap for PNG) — re-encode photos as WebP`,
          });
        }
      } else if (size > MAX_BYTES) {
        violations.push({
          file,
          reason: `${fmtKB(size)} exceeds ${fmtKB(MAX_BYTES)} budget — compress or downscale`,
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error(`\n✖ Image budget violations (${violations.length}):\n`);
    for (const v of violations) {
      console.error(`  ${v.file}\n      ${v.reason}`);
    }
    console.error(
      `\nBudget: max ${MAX_DIMENSION}px, ${fmtKB(MAX_BYTES)} (PNG ${fmtKB(PNG_MAX_BYTES)}). ` +
        `Convert large/oversized images to WebP (e.g. via the Astro <Image> pipeline) before committing.\n`,
    );
    process.exit(1);
  }

  console.log(`✓ ${checked} image asset(s) checked, all within budget (≤${MAX_DIMENSION}px, ≤${fmtKB(MAX_BYTES)}).`);
}

main().catch((err) => {
  console.error('validate-images failed:', err);
  process.exit(1);
});
