// Development helper: drive the real game in headless Chromium.
//
//   node scripts/ui.mjs <scenario.mjs> [--mobile] [--out <dir>] [--local] [--quality low|medium|high]
//                                      [--url <page>] [--fake-claude [deny]] [--server-log]
//
//   --local        run the game core in the page (?mode=local) instead of on the server
//   --url          open this page instead of the dev server, e.g. file:///.../dist/greyhaven.html
//   --fake-claude  pretend to be the claude.ai host: the page finds a `claude.use('sample')`
//                  that streams canned replies ("deny" makes it refuse, as a viewer might)
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
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', GREYHAVEN_AI: 'off', GREYHAVEN_DATA: data, GREYHAVEN_DEBUG: '1', ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => reject(new Error(`server did not start:\n${out}`)), 15000);
    const onData = (d) => {
      out += d;
      if (out.includes(`localhost:${port}`)) {
        clearTimeout(timer);
        resolve({ child, base: `http://127.0.0.1:${port}`, data, log: () => out });
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => reject(new Error(`server exited (${code}):\n${out}`)));
  });
}

/**
 * Runs in the page before anything else: a stand-in for the claude.ai host's
 * `sample` capability. It streams a plausible reply of the right shape so the
 * hosted code path (consent on Begin, streaming into the conversation, model
 * labels, refusal) can be exercised without the real host.
 */
function fakeClaude(mode) {
  const calls = [];
  window.__sampleCalls = calls;
  const sample = (input, options = {}) =>
    new Promise((resolve, reject) => {
      const turns = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
      const brief = turns[0].content;
      const last = turns[turns.length - 1].content;
      calls.push({ turns: turns.length, model: options.model ?? null, tier: options.modelTier ?? null, effort: options.effort ?? null, chars: turns.reduce((n, t) => n + t.content.length, 0) });
      if (mode === 'deny') {
        setTimeout(() => reject({ code: 'not_granted', message: 'The viewer declined.' }), 300);
        return;
      }
      const said = (last.match(/DETECTIVE: "([^"]*)"/) ?? [])[1] ?? '';
      let text;
      if (/single word: ready/.test(last)) text = 'ready';
      else if (brief.includes('"stance"')) text = JSON.stringify({ say: `*She does not turn round.* [live] You came all this way to say "${said}"?`, stance: 'wavering', landed: [], end: null });
      else if (brief.includes('"told"')) text = JSON.stringify({ say: `*A pause, the rain filling it.* [live] You want to know about "${said}". Ask me something I can answer, Detective.`, mood: 'guarded', told: [], acts: [] });
      else if (brief.includes('"open"')) text = JSON.stringify({ answer: 'LIVE // NO MATCHING RECORD.\nTry a surname or a plate.', open: [] });
      else text = '[live] The rain has not stopped since Tuesday, and neither have you. Something on that desk has not been read.';
      let i = 0;
      const tick = () => {
        if (options.signal?.aborted) return reject({ code: 'cancelled', message: 'aborted' });
        i = Math.min(text.length, i + 14);
        options.onText?.({ text: text.slice(0, i), delta: text.slice(Math.max(0, i - 14), i) });
        if (i < text.length) setTimeout(tick, 70);
        else resolve({ text, truncated: false, modelTierApplied: options.modelTier ?? 'default', modelApplied: options.model });
      };
      setTimeout(tick, 400);
    });
  window.claude = { use: (name) => new Promise((r) => setTimeout(() => r(name === 'sample' ? sample : null), 50)) };
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
  const url = arg('url', null);
  const server = url ? null : await startServer(local ? { GREYHAVEN_SERVE_CORE: '1' } : {});
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
    if (/fonts\.(googleapis|gstatic)/.test(r.url())) return;
    // Chromium's devtools layer reports some fully delivered streamed replies as
    // "aborted". The page gets every byte and the server never sees a
    // disconnect (it logs one if it does), so these are noise.
    if (r.url().includes('/api/rpc') && r.failure()?.errorText === 'net::ERR_ABORTED') return;
    problems.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText ?? ''} ${(r.postData() ?? '').slice(0, 90)}`);
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
  if (flag('fake-claude')) await page.addInitScript(fakeClaude, arg('fake-claude', 'allow'));
  let failed = false;
  try {
    await page.goto(`${url ?? `${server.base}/`}?${query}`, { waitUntil: 'load' });
    await page.waitForFunction('!!window.__game && !document.getElementById("boot")', null, { timeout: 90000 });
    await scenario({ page, shot, sleep, game, tapWorld, log, mobile, base: server?.base });
  } catch (err) {
    failed = true;
    console.error(`SCENARIO FAILED: ${err?.stack ?? err}`);
    await shot('failure').catch(() => {});
  }
  for (const p of problems.slice(0, 40)) console.log(p);
  if (flag('server-log') && server) console.log(`--- server output ---\n${server.log().split('\n').slice(8).join('\n')}`);
  await browser.close();
  if (server) {
    server.child.kill();
    fs.rmSync(server.data, { recursive: true, force: true });
  }
  if (failed || problems.some((p) => p.startsWith('[pageerror]'))) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
