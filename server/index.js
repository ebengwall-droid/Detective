// Greyhaven server: serves the client and hosts the game core.
//
// The browser is a thin client in this mode. Every player action is an RPC to
// the GameSession living here, so the case file (who did it, who is lying)
// never leaves the server and the Anthropic API key stays private.
//
// Environment:
//   PORT, HOST               where to listen (default 0.0.0.0:3000)
//   ANTHROPIC_API_KEY        brings the characters to life (see README)
//   GREYHAVEN_MODEL          model override
//   GREYHAVEN_AI=off         force scripted mode
//   GREYHAVEN_DATA           where saves are written (default ./data/saves)
//   GREYHAVEN_SERVE_CORE=1   also serve the case file, for testing ?mode=local

import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GameSession, RPC_METHODS, STREAMING_METHODS, assertCaseValid } from '../core/engine.js';
import { META } from '../core/cases/lamplighter/story.js';
import { createAnthropicProvider } from './anthropic-provider.js';
import { SaveStore } from './store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const STATIC_ROOTS = [
  { prefix: '/vendor/three/', dir: path.join(root, 'node_modules', 'three') },
  { prefix: '/core/', dir: path.join(root, 'core') },
  { prefix: '/', dir: path.join(root, 'public') },
];

// The only parts of the case the page needs: set dressing and faces. The rest
// (the story, the facts, who is lying) is not served unless asked for.
const CORE_PUBLIC = new Set(['/core/cases/lamplighter/scenes.js', '/core/cases/lamplighter/looks.js', '/core/conditions.js']);
const SERVE_CORE = process.env.GREYHAVEN_SERVE_CORE === '1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

assertCaseValid();
const ai = createAnthropicProvider();
const store = new SaveStore(process.env.GREYHAVEN_DATA ? path.resolve(process.env.GREYHAVEN_DATA) : path.join(root, 'data', 'saves'));

/** Live sessions, keyed by save id. @type {Map<string, GameSession>} */
const sessions = new Map();
/** One action at a time per session, so two tabs cannot interleave state changes. @type {Map<string, Promise<unknown>>} */
const queues = new Map();

async function getSession(sid) {
  let session = sessions.get(sid);
  if (session) return session;
  const saved = await store.load(sid);
  session = new GameSession({ ai, state: saved ?? undefined });
  sessions.set(sid, session);
  return session;
}

function enqueue(sid, job) {
  const prev = queues.get(sid) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(job);
  queues.set(sid, next);
  next.finally(() => {
    if (queues.get(sid) === next) queues.delete(sid);
  }).catch(() => {});
  return next;
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(data);
}

async function readBody(req, limit = 256 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Request body too large'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Body must be JSON'), { status: 400 });
  }
}

const SID_RE = /^[a-z0-9]{8,40}$/;

async function handleRpc(req, res) {
  const body = await readBody(req);
  const { sid, method, args } = body;
  if (typeof sid !== 'string' || !SID_RE.test(sid)) {
    return sendJson(res, 400, { error: 'Missing or malformed session id' });
  }
  if (typeof method !== 'string' || !RPC_METHODS.has(method)) {
    return sendJson(res, 400, { error: `Unknown method: ${String(method)}` });
  }
  const params = Array.isArray(args) ? args : [];
  const streaming = STREAMING_METHODS.has(method);
  const abort = new AbortController();
  res.on('close', () => {
    if (res.writableEnded) return;
    // The player closed the tab or walked away mid-reply: stop paying for it.
    abort.abort();
    if (process.env.GREYHAVEN_DEBUG) console.warn(`[rpc ${method}] client went away before the reply finished`);
  });

  if (streaming) {
    res.writeHead(200, {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    });
  }
  const write = (obj) => res.write(JSON.stringify(obj) + '\n');

  try {
    const result = await enqueue(sid, async () => {
      const session = await getSession(sid);
      const hooks = streaming
        ? { onText: (text) => write({ t: 'text', text }), signal: abort.signal }
        : { signal: abort.signal };
      // "Is there a saved case?" is a normal question at the title screen, not an error.
      if (method === 'view' && !session.state) return null;
      const out = await session[method](params[0] && typeof params[0] === 'object' ? params[0] : {}, hooks);
      if (session.state) await store.save(sid, session.state);
      return out;
    });
    if (streaming) {
      write({ t: 'result', result });
      res.end();
    } else {
      sendJson(res, 200, { result });
    }
  } catch (err) {
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    const message = err?.expose ? err.message : status === 500 ? 'The game hit an internal error.' : err.message;
    if (status === 500) console.error(`[rpc ${method}]`, err);
    if (streaming) {
      write({ t: 'error', error: message });
      res.end();
    } else {
      sendJson(res, status, { error: message });
    }
  }
}

function serveStatic(req, res, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (decoded.startsWith('/core/') && !SERVE_CORE && !CORE_PUBLIC.has(decoded)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  for (const { prefix, dir } of STATIC_ROOTS) {
    if (!decoded.startsWith(prefix)) continue;
    let rel = decoded.slice(prefix.length);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(dir, rel);
    if (file !== dir && !file.startsWith(dir + path.sep)) break;
    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
        return;
      }
      res.writeHead(200, {
        'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
        'content-length': stat.size,
        // Development-friendly: always revalidate so edits show up on reload.
        'cache-control': prefix === '/vendor/three/' ? 'public, max-age=86400' : 'no-cache',
      });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    });
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (url.pathname === '/api/status' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, ai: ai.describe(), case: { title: META.title, series: META.series, tagline: META.tagline } });
    }
    if (url.pathname === '/api/rpc' && req.method === 'POST') {
      return await handleRpc(req, res);
    }
    if (url.pathname.startsWith('/api/')) {
      return sendJson(res, 404, { error: 'Not found' });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405).end('Method not allowed');
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (err) {
    const status = err?.status ?? 500;
    if (status === 500) console.error(err);
    if (!res.headersSent) sendJson(res, status, { error: status === 500 ? 'Internal error' : err.message });
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  const info = ai.describe();
  console.log(`\n  GREYHAVEN — The Lamplighter`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(
    info.live
      ? `  Characters are played by ${info.model}.`
      : `  No Anthropic credentials found — running in scripted mode.\n  Set ANTHROPIC_API_KEY (see README) to bring the characters to life.`,
  );
  console.log('');
});
