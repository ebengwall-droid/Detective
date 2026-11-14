// Build the game as a page that needs no server of its own: three.js, the
// effects libraries, the game core, the case and the styles in one HTML file,
// with the models, textures and motion clips in an assets/ folder beside it.
//
//   node scripts/build-artifact.mjs [--out dist]
//
// Writes:
//   app/            the game as an installable web app: index.html, assets/,
//                   the manifest, icons and service worker. Host the folder
//                   anywhere and "Add to Home Screen" gives a full-screen app
//                   that also opens offline. Characters follow their script.
//   artifact.html   the same page as a claude.ai artifact body (no <html>,
//                   <head> or <body>; the host supplies those), to be
//                   published with the files listed in artifact-files.json.
//                   Opened on claude.ai, the page asks Claude to play the
//                   cast on the viewer's own account, so no API key is
//                   involved.
//   greyhaven.html  the page alone. Without assets/ beside it the game draws
//                   its people and furniture in code instead: plainer, but it
//                   runs from a single file opened off a disk.

import { build, transform } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const outDir = path.resolve(outArg > 0 ? process.argv[outArg + 1] : path.join(root, 'dist'));

const FONTS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400..600&family=Marcellus&family=Special+Elite&display=swap';
const TITLE = 'The Lamplighter';

const bundle = await build({
  entryPoints: [path.join(root, 'public/src/main.js')],
  bundle: true,
  format: 'esm',
  minify: true,
  target: 'es2022',
  write: false,
  legalComments: 'none',
  logLevel: 'warning',
});
let js = bundle.outputFiles[0].text;
// The script is inlined, so nothing in it may look like the end of a script element.
js = js.replace(/<\/(script)/gi, '<\\/$1');
if (js.includes('<!--')) throw new Error('bundle contains "<!--", which is not safe to inline');

const css = (await transform(fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8'), { loader: 'css', minify: true })).code;

const body = `<div id="app"><div id="boot"><div class="lamp"></div>Greyhaven</div></div>
<script>window.GREYHAVEN_MODE = 'local';</script>
<script type="module">${js}</script>`;

const artifact = `<title>${TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="${FONTS}">
<style>${css}
/* The artifact frame already keeps the page clear of the notch and the home bar, top and bottom. */
:root{--safe-t:0px;--safe-b:0px}</style>
${body}
`;

const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#05080d">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Greyhaven">
<title>Greyhaven: ${TITLE}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'artifact.html'), artifact);
fs.writeFileSync(path.join(outDir, 'greyhaven.html'), standalone);

// The installable app: the page plus what a phone needs to treat it as one.
const appDir = path.join(outDir, 'app');
fs.rmSync(appDir, { recursive: true, force: true });
fs.mkdirSync(path.join(appDir, 'icons'), { recursive: true });
fs.writeFileSync(path.join(appDir, 'index.html'), standalone);
for (const file of ['manifest.webmanifest', 'sw.js']) fs.copyFileSync(path.join(root, 'public', file), path.join(appDir, file));
for (const file of fs.readdirSync(path.join(root, 'public/icons'))) fs.copyFileSync(path.join(root, 'public/icons', file), path.join(appDir, 'icons', file));

// Models, textures and motion clips: copied beside the app, and listed for publishing beside the artifact.
const assetsDir = path.join(root, 'public/assets');
const TYPES = { '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json' };
const published = {};
let assetBytes = 0;
if (fs.existsSync(assetsDir)) {
  for (const entry of fs.readdirSync(assetsDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const from = path.join(entry.parentPath ?? entry.path, entry.name);
    const rel = path.relative(assetsDir, from).split(path.sep).join('/');
    fs.mkdirSync(path.dirname(path.join(appDir, 'assets', rel)), { recursive: true });
    fs.copyFileSync(from, path.join(appDir, 'assets', rel));
    published[`assets/${rel}`] = { from: path.relative(root, from).split(path.sep).join('/'), contentType: TYPES[path.extname(rel)] ?? 'application/octet-stream' };
    assetBytes += fs.statSync(from).size;
  }
}
fs.writeFileSync(path.join(outDir, 'artifact-files.json'), `${JSON.stringify(published, null, 1)}\n`);
const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`;
console.log(`script ${kb(js)}, styles ${kb(css)}`);
console.log(`wrote ${path.join(outDir, 'artifact.html')} (${kb(artifact)})`);
console.log(`wrote ${path.join(outDir, 'greyhaven.html')} (${kb(standalone)})`);
console.log(`wrote ${appDir}/ (installable app: index.html, manifest, icons, service worker, assets)`);
console.log(`assets: ${Object.keys(published).length} files, ${(assetBytes / 1048576).toFixed(1)} MB (listed in artifact-files.json for publishing beside the artifact)`);
