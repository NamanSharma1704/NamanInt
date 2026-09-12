/**
 * Generates responsive, modern-format variants for the photographs in
 * public/assets/images.
 *
 * These live in public/ rather than src/, so Vite copies them verbatim and the
 * asset pipeline never sees them. That is deliberate — the filenames are
 * referenced as literal strings and in og:image meta tags, which need stable
 * URLs — but it means width and format variants have to be produced ahead of
 * time and committed, rather than derived at build time.
 *
 * Run: npm run images:optimize
 *
 * Idempotent. Sources are the *.jpg/*.png files directly in the images
 * directory; output goes to the `r/` subdirectory so a re-run never treats its
 * own output as input.
 */
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC_DIR = path.join(process.cwd(), 'public', 'assets', 'images');
const OUT_DIR = path.join(SRC_DIR, 'r');

/** Widths to emit. A source is never upscaled past its intrinsic width. */
const WIDTHS = [480, 768, 1200];

/** Quality per format, tuned so 1200px output stays visually clean at ~1/10 the original weight. */
const QUALITY = { avif: 50, webp: 72, jpeg: 78 };

/** The logo is line art on transparency: it keeps an alpha channel and needs different widths. */
const LOGO_WIDTHS = [220, 440];

function fmtBytes(n) {
  return n >= 1048576 ? `${(n / 1048576).toFixed(2)} MB` : `${(n / 1024).toFixed(0)} KB`;
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  const entries = (await readdir(SRC_DIR, { withFileTypes: true }))
    .filter((e) => e.isFile() && /\.(jpe?g|png)$/i.test(e.name));

  let beforeTotal = 0;
  let afterTotal = 0;
  const rows = [];
  const manifest = {};

  for (const entry of entries) {
    const srcPath = path.join(SRC_DIR, entry.name);
    const base = entry.name.replace(/\.(jpe?g|png)$/i, '');
    const isLogo = /logo/i.test(base);
    const before = (await stat(srcPath)).size;
    beforeTotal += before;

    const image = sharp(srcPath);
    const meta = await image.metadata();
    const widths = (isLogo ? LOGO_WIDTHS : WIDTHS).filter((w) => w <= meta.width);
    if (widths.length === 0) widths.push(meta.width);

    let after = 0;
    const variants = { widths: [], intrinsic: { w: meta.width, h: meta.height } };

    for (const w of widths) {
      // Lanczos3 (sharp's default) keeps the container/rigging detail in these
      // photographs from turning to mush at 480px.
      const resized = sharp(srcPath).resize({ width: w, withoutEnlargement: true });

      const avif = await resized.clone().avif({ quality: QUALITY.avif, effort: 6 }).toBuffer();
      await writeFile(path.join(OUT_DIR, `${base}-${w}.avif`), avif);

      const webp = await resized.clone().webp({ quality: QUALITY.webp, effort: 5 }).toBuffer();
      await writeFile(path.join(OUT_DIR, `${base}-${w}.webp`), webp);

      // Fallback keeps the source's own container: PNG for the alpha-bearing
      // logo, JPEG for the photographs.
      let fallback;
      let ext;
      if (isLogo) {
        fallback = await resized.clone().png({ compressionLevel: 9, palette: true }).toBuffer();
        ext = 'png';
      } else {
        fallback = await resized
          .clone()
          .jpeg({ quality: QUALITY.jpeg, mozjpeg: true, progressive: true })
          .toBuffer();
        ext = 'jpg';
      }
      await writeFile(path.join(OUT_DIR, `${base}-${w}.${ext}`), fallback);

      after += avif.length + webp.length + fallback.length;
      variants.widths.push({ w, avif: avif.length, webp: webp.length, fallback: fallback.length, ext });
    }

    manifest[base] = variants;
    afterTotal += after;
    rows.push({ name: entry.name, before, after, widths });
  }

  await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  const pad = Math.max(...rows.map((r) => r.name.length));
  console.log('\nfile'.padEnd(pad + 2) + 'before'.padStart(10) + 'all variants'.padStart(14) + '   widths');
  console.log('-'.repeat(pad + 2 + 10 + 14 + 12));
  for (const r of rows) {
    console.log(
      r.name.padEnd(pad + 2) +
        fmtBytes(r.before).padStart(10) +
        fmtBytes(r.after).padStart(14) +
        '   ' +
        r.widths.join(', ')
    );
  }
  console.log('-'.repeat(pad + 2 + 10 + 14 + 12));
  console.log(
    'TOTAL'.padEnd(pad + 2) + fmtBytes(beforeTotal).padStart(10) + fmtBytes(afterTotal).padStart(14)
  );
  console.log(
    `\nNote: "all variants" is every width x every format summed. What a single\n` +
      `visitor downloads is one width in one format — see the per-request figures\n` +
      `the build report prints.\n`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
