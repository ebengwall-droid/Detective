// Development helper: drive the real game in headless Chromium.
//
//   node scripts/ui.mjs <scenario.mjs> [--mobile] [--out <dir>] [--local] [--quality low|medium|high]
//
// A scenario is a module whose default export is
//   async ({ page, shot, sleep, game, tapWorld, log }) => { ... }
// The server runs in scripted mode with a throwaway save directory.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

function startServer(extraEnv = {}) {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'greyhaven-'));
  const port = 4100 + Math.floor(Math.random() * 800);
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', GREYHAVEN_AI: 'off', GREYHAVEN_DATA: data, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => reject(new Error(`server did not start:\n${out}`)), 15000);
    const onData = (d) => {
      out += d;
      if (out.includes(`localhost:${port}`)) {
        clearTimeout(timer);
        resolve({ child, base: `http://127.0.0.1:${port}`, data });
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => reject(new Error(`server exited (${code}):\n${out}`)));
  });
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node scripts/ui.mjs <scenario.mjs> [--mobile] [--out dir] [--local]');
    process.exit(2);
  }
  const scenario = (await import(pathToFileURL(path.resolve(file)).href)).default;
  const outDir = path.resolve(arg('out', 'shots'));
  fs.mkdirSync(outDir, { recursive: true });
  const mobile = flag('mobile');
  const local = flag('local');
  const { chromium } = require('playwright');
  const server = await startServer(local ? { GREYHAVEN_SERVE_CORE: '1' } : {});
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const context = await browser.newContext({
    viewport: { width: Number(arg('w', mobile ? 390 : 1100)), height: Number(arg('h', mobile ? 780 : 620)) },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}\n${e.stack ?? ''}`));
  page.on('requestfailed', (r) => {
    if (!/fonts\.(googleapis|gstatic)/.test(r.url())) problems.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText ?? ''}`);
  });

  const sleep = (ms) => page.waitForTimeout(ms);
  const log = (...a) => console.log(...a);
  let n = 0;
  const shot = async (name) => {
    const f = path.join(outDir, `${String(++n).padStart(2, '0')}-${name}.png`);
    await page.screenshot({ path: f, timeout: 120000 });
    console.log(`  shot ${f}`);
    return f;
  };
  /** Run a function inside the page with the Game instance. */
  const game = (fn, ...args) => page.evaluate(`(${fn.toString()})(window.__game, ...${JSON.stringify(args)})`);
  /** Tap or click a point of the 3D view. */
  const tapWorld = async (x, y) => {
    if (mobile) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  };

  const query = new URLSearchParams({ quality: arg('quality', 'low') });
  if (local) query.set('mode', 'local');
  let failed = false;
  try {
    await page.goto(`${server.base}/?${query}`, { waitUntil: 'load' });
    await page.waitForFunction('!!window.__game && !document.getElementById("boot")', null, { timeout: 90000 });
    await scenario({ page, shot, sleep, game, tapWorld, log, mobile, base: server.base });
  } catch (err) {
    failed = true;
    console.error(`SCENARIO FAILED: ${err?.stack ?? err}`);
    await shot('failure').catch(() => {});
  }
  for (const p of problems.slice(0, 40)) console.log(p);
  await browser.close();
  server.child.kill();
  fs.rmSync(server.data, { recursive: true, force: true });
  if (failed || problems.some((p) => p.startsWith('[pageerror]'))) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
