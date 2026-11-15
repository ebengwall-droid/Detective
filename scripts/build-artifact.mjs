// Build the game as a page that needs no server of its own: three.js, the
// effects libraries, the game core, the case and the styles in one HTML file,
// with the models, textures and motion clips in an assets/ folder beside it.
//
//   node scripts/build-artifact.mjs [--out dist] [--mobile-url <url>] [--web-url <url>]
//
// With the two published addresses, each version can point a visitor on the
// wrong kind of device to the other one.
//
// Writes:
//   app/            the game as an installable web app: index.html, assets/,
//                   the manifest, icons and service worker. Host the folder
//                   anywhere and "Add to Home Screen" gives a full-screen app
//                   that also opens offline. Characters follow their script.
//   artifact-mobile.html, artifact-web.html
//                   the game as claude.ai artifact bodies (no <html>, <head>
//                   or <body>; the host supplies those), one made for phones
//                   and tablets and one for computers. Each is published with
//                   the files in artifact-files/ (listed in
//                   artifact-files.json; models are wrapped in JSON there,
//                   because that host serves only ordinary web file types).
//                   Opened on claude.ai, the page asks Claude to play the
//                   cast on the viewer's own account, so no API key is
//                   involved.
//   the-fold.html  the page alone. Without assets/ beside it the game draws
//                   its people and furniture in code instead: plainer, but it
//                   runs from a single file opened off a disk.

import { build, transform } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const outDir = path.resolve(outArg > 0 ? process.argv[outArg + 1] : path.join(root, 'dist'));
const argOf = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : '';
};
const URLS = { mobile: argOf('mobile-url'), web: argOf('web-url') };
for (const u of Object.values(URLS)) if (u && !/^https:\/\/[\w.-]+\/[\w/.-]*$/.test(u)) throw new Error(`not a plain https address: ${u}`);

const FONTS = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Cinzel:wght@500..900&family=Instrument+Sans:ital,wdth,wght@0,75..100,400..700;1,75..100,400..700&family=JetBrains+Mono:wght@400..600&family=Marcellus&family=Special+Elite&display=swap';
const TITLE = 'The Invigilator';

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

// The conversation screen and the title keep their styles in files of their own; ship them as one sheet.
const sheets = ['public/styles.css', 'public/talk.css', 'public/title.css'].map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const css = (await transform(sheets, { loader: 'css', minify: true })).code;

const page = (flags) => `<div id="app"><div id="boot"><div class="lamp"></div>The Fold</div></div>
<script>${flags}</script>
<script type="module">${js}</script>`;
const body = page("window.FOLD_MODE = 'local';");

// claude.ai serves only ordinary web file types beside a page, so there the models travel as JSON (see below).
// Two versions of the same game: FOLD_DEVICE sets it up for phones ('mobile') or computers ('web');
// FOLD_OTHER is where the other version lives, for a visitor on the wrong kind of device.
const artifact = (device, name) => {
  const other = URLS[device === 'mobile' ? 'web' : 'mobile'];
  return `<title>${TITLE} (${name})</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="${FONTS}">
<style>${css}
/* The artifact frame already keeps the page clear of the notch and the home bar, top and bottom. */
:root{--safe-t:0px;--safe-b:0px}</style>
${page(`window.FOLD_MODE = 'local'; window.FOLD_PACKED = true; window.FOLD_DEVICE = '${device}';${other ? ` window.FOLD_OTHER = ${JSON.stringify(other)};` : ''}`)}
`;
};
const artifacts = { 'artifact-mobile.html': artifact('mobile', 'Mobile'), 'artifact-web.html': artifact('web', 'Web') };

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
<meta name="apple-mobile-web-app-title" content="The Fold">
<title>The Fold: ${TITLE}</title>
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
for (const [file, html] of Object.entries(artifacts)) fs.writeFileSync(path.join(outDir, file), html);
fs.rmSync(path.join(outDir, 'artifact.html'), { force: true });
fs.writeFileSync(path.join(outDir, 'the-fold.html'), standalone);

// The installable app: the page plus what a phone needs to treat it as one.
const appDir = path.join(outDir, 'app');
fs.rmSync(appDir, { recursive: true, force: true });
fs.mkdirSync(path.join(appDir, 'icons'), { recursive: true });
fs.writeFileSync(path.join(appDir, 'index.html'), standalone);
for (const file of ['manifest.webmanifest', 'sw.js']) fs.copyFileSync(path.join(root, 'public', file), path.join(appDir, file));
for (const file of fs.readdirSync(path.join(root, 'public/icons'))) fs.copyFileSync(path.join(root, 'public/icons', file), path.join(appDir, 'icons', file));

// Models, textures and motion clips. Beside the app they are copied as they are.
// Beside the artifact a model cannot be: only ordinary web types are served there, and .glb is not
// one. So each model is wrapped in a JSON file holding it in base64, which the game unpacks.
const assetsDir = path.join(root, 'public/assets');
const hostedDir = path.join(outDir, 'artifact-files');
fs.rmSync(hostedDir, { recursive: true, force: true });
const published = [];
let assetBytes = 0;
let hostedBytes = 0;
if (fs.existsSync(assetsDir)) {
  for (const entry of fs.readdirSync(assetsDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const from = path.join(entry.parentPath ?? entry.path, entry.name);
    const rel = path.relative(assetsDir, from).split(path.sep).join('/');
    fs.mkdirSync(path.dirname(path.join(appDir, 'assets', rel)), { recursive: true });
    fs.copyFileSync(from, path.join(appDir, 'assets', rel));
    assetBytes += fs.statSync(from).size;

    const packed = rel.endsWith('.glb');
    const hosted = path.join(hostedDir, 'assets', packed ? `${rel}.json` : rel);
    fs.mkdirSync(path.dirname(hosted), { recursive: true });
    if (packed) fs.writeFileSync(hosted, JSON.stringify({ type: 'model/gltf-binary', base64: fs.readFileSync(from).toString('base64') }));
    else fs.copyFileSync(from, hosted);
    hostedBytes += fs.statSync(hosted).size;
    published.push(`assets/${packed ? `${rel}.json` : rel}`);
  }
}
fs.writeFileSync(path.join(outDir, 'artifact-files.json'), `${JSON.stringify(published.sort(), null, 1)}\n`);
const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`;
console.log(`script ${kb(js)}, styles ${kb(css)}`);
for (const [file, html] of Object.entries(artifacts)) console.log(`wrote ${path.join(outDir, file)} (${kb(html)})`);
console.log(`wrote ${path.join(outDir, 'the-fold.html')} (${kb(standalone)})`);
console.log(`wrote ${appDir}/ (installable app: index.html, manifest, icons, service worker, assets)`);
console.log(`assets: ${published.length} files, ${(assetBytes / 1048576).toFixed(1)} MB beside the app; ${(hostedBytes / 1048576).toFixed(1)} MB in ${hostedDir}/ to publish beside the artifact (listed in artifact-files.json)`);
