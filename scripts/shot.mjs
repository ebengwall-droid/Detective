// Development helper: render a page in headless Chromium and save a screenshot.
//
//   node scripts/shot.mjs "/dev.html?loc=precinct" out.png [--w 1280 --h 720] [--wait 1500] [--mobile]
//
// Starts a throwaway static server on a free port unless --base is given.

import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
}
const flag = (name) => process.argv.includes(`--${name}`);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream' };
const ROOTS = [
  ['/vendor/three/', path.join(root, 'node_modules', 'three')],
  ['/vendor/postprocessing/', path.join(root, 'node_modules', 'postprocessing')],
  ['/vendor/n8ao/', path.join(root, 'node_modules', 'n8ao')],
  ['/core/', path.join(root, 'core')],
  ['/', path.join(root, 'public')],
];

export function startStatic() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = decodeURIComponent(url.pathname);
    for (const [prefix, dir] of ROOTS) {
      if (!p.startsWith(prefix)) continue;
      let rel = p.slice(prefix.length);
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      const file = path.resolve(dir, rel);
      if (!file.startsWith(dir)) break;
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
        return;
      }
    }
    res.writeHead(404).end('not found');
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })));
}

async function main() {
  const target = process.argv[2];
  const out = process.argv[3] ?? 'shot.png';
  if (!target) {
    console.error('usage: node scripts/shot.mjs <path-or-url> <out.png> [--w N --h N --wait ms --mobile --dpr N]');
    process.exit(2);
  }
  const { chromium } = require('playwright');
  let base = arg('base', null);
  let server = null;
  if (!base && !/^https?:/.test(target)) {
    const s = await startStatic();
    server = s.server;
    base = s.base;
  }
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mobile = flag('mobile');
  const context = await browser.newContext({
    viewport: { width: Number(arg('w', mobile ? 390 : 1280)), height: Number(arg('h', mobile ? 844 : 720)) },
    deviceScaleFactor: Number(arg('dpr', 1)),
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  const logs = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText ?? ''}`));
  const url = /^https?:/.test(target) ? target : base + target;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  try {
    await page.waitForFunction('window.__ready === true || window.__error', null, { timeout: Number(arg('timeout', 45000)) });
  } catch {
    logs.push('[shot] timed out waiting for window.__ready');
  }
  await page.waitForTimeout(Number(arg('wait', 600)));
  const err = await page.evaluate('window.__error || null');
  if (err) logs.push(`[page error] ${err}`);
  // --cams "x,z,yaw,pitch;x,z,yaw,pitch" takes one screenshot per camera
  // (dev viewer only) without rebuilding the scene.
  const cams = arg('cams', null);
  if (cams) {
    const list = cams.split(';').map((c) => c.split(',').map(Number));
    for (let i = 0; i < list.length; i++) {
      await page.evaluate((c) => window.__dev.setCam(...c), list[i]);
      await page.waitForTimeout(150);
      const file = out.replace(/\.png$/, `-${i + 1}.png`);
      await page.screenshot({ path: file, timeout: 120000 });
      console.log(`saved ${file}`);
    }
  } else {
    await page.screenshot({ path: out, timeout: 120000 });
    console.log(`saved ${out}`);
  }
  const info = await page.evaluate('document.getElementById("info")?.textContent ?? ""');
  if (info) console.log(info);
  for (const l of logs.slice(0, 30)) console.log(l);
  await browser.close();
  server?.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
