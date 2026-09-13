/**
 * Pre-renders every route into dist/vercel for the Vercel design preview.
 *
 * The site's real server is the Express SSR app (dist/server.bundle.mjs), which
 * is what Airo runs. Vercel's static hosting cannot run it, so every route but
 * / returned 404 there. This script renders each route once, at build time,
 * with the same render function the Express server calls per request, and
 * writes plain HTML files Vercel can serve (vercel.json: cleanUrls). It writes
 * only to dist/prerender and dist/vercel, which the Express server never reads,
 * so the Airo build is unaffected.
 *
 * The preview is not the live site: every page carries noindex and robots.txt
 * disallows crawling, the same treatment src/server/entry.ts gives preview
 * hosts. The preview has no contact endpoint; the form reports an error there.
 *
 * Run after `npm run build`; `npm run build:vercel` does both.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const clientDir = join(root, 'dist/client');
const renderDir = join(root, 'dist/prerender');
const outDir = join(root, 'dist/vercel');

/** A path no route matches, rendered once to produce 404.html. */
const NOT_FOUND_PROBE = '/__preview-not-found__';

const NOINDEX = '<meta name="robots" content="noindex,nofollow">';

function siteOrigin() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (host) return `https://${host}`;
  return (process.env.VITE_PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function outputFile(path) {
  if (path === NOT_FOUND_PROBE) return '404.html';
  if (path === '/') return 'index.html';
  return `${path.slice(1)}.html`;
}

async function main() {
  const templatePath = join(clientDir, 'index.html');
  if (!existsSync(templatePath)) {
    throw new Error(`Missing ${templatePath}; run "npm run build" first.`);
  }
  const template = readFileSync(templatePath, 'utf-8');
  if (!template.includes('<!--app-head-->') || !template.includes('<!--app-html-->')) {
    throw new Error('dist/client/index.html is missing the <!--app-head--> / <!--app-html--> markers.');
  }

  // A small standalone SSR bundle of the render function and the route
  // registry, instead of reaching into dist/bin for a hashed chunk. vite.config
  // treats any build with build.ssr set as the server build, so the entry and
  // output are overridden here and ssr is `true` to let `input` take effect.
  await build({
    root,
    logLevel: 'warn',
    build: {
      ssr: true,
      outDir: renderDir,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          'entry-server': join(root, 'src/entry-server.tsx'),
          'seo-routes': join(root, 'src/lib/seo-routes.ts'),
        },
        output: {
          entryFileNames: '[name].mjs',
          chunkFileNames: 'chunks/[name]-[hash].mjs',
        },
      },
    },
  });

  const { render } = await import(pathToFileURL(join(renderDir, 'entry-server.mjs')).href);
  const { seoRoutes } = await import(pathToFileURL(join(renderDir, 'seo-routes.mjs')).href);

  rmSync(outDir, { recursive: true, force: true });
  cpSync(clientDir, outDir, { recursive: true });

  const origin = siteOrigin();
  const pages = [
    ...seoRoutes.map((route) => ({ path: route.path, status: 200 })),
    { path: NOT_FOUND_PROBE, status: 404 },
  ];

  for (const page of pages) {
    const result = await render(page.path, origin);
    if (result.redirect) throw new Error(`${page.path} redirected to ${result.redirect}`);
    if (result.status !== page.status || !result.html) {
      throw new Error(`${page.path} rendered status ${result.status}, expected ${page.status}`);
    }
    // Function replacements, as in entry.ts, so "$&" in content stays literal.
    const html = template
      .replace('<!--app-head-->', () => [NOINDEX, result.head].filter(Boolean).join('\n'))
      .replace('<!--app-html-->', () => result.html);
    const file = outputFile(page.path);
    const target = join(outDir, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html);
    console.log(`prerender ${page.path.padEnd(24)} dist/vercel/${file} (${result.status}, ${Buffer.byteLength(html)} B)`);
  }

  writeFileSync(join(outDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  console.log(`prerender origin ${origin}; robots.txt disallows crawling`);
}

// Exit explicitly: a timer left by an imported module must not hang the build.
main().then(
  () => process.exit(0),
  (error) => {
    console.error('[prerender] failed:', error);
    process.exit(1);
  },
);
