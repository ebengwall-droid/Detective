// How the browser reaches the game.
//
// "remote": the game core runs on the Node server and every action is an HTTP
//           call. The page never loads the case file, the save lives on the
//           server, and the Anthropic key never leaves it.
// "local":  the game core runs right here in the page. Used for the hosted
//           build, where Claude is reached through the host page instead of a
//           server, and as a fallback when no server is present.
//
// Both expose the same thing: call(method, args, { onText, signal }).

const STREAMING = new Set(['say', 'present', 'laptopAsk', 'readLetter', 'think', 'finaleSay', 'epilogue']);
const SID_KEY = 'greyhaven.sid';
const SAVE_KEY = 'greyhaven.save.v3';

function store() {
  // Storage can be missing or throw (private windows, embedded previews).
  try {
    const s = window.localStorage;
    s.getItem('greyhaven.probe');
    return s;
  } catch {
    return null;
  }
}

function newSid() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
}

async function remoteClient() {
  const s = store();
  let sid = s?.getItem(SID_KEY);
  if (!sid || !/^[a-z0-9]{8,40}$/.test(sid)) {
    sid = newSid();
    try {
      s?.setItem(SID_KEY, sid);
    } catch {
      /* the session simply will not survive a reload */
    }
  }
  const status = await fetch('/api/status', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('no server'))));

  async function call(method, args = {}, hooks = {}) {
    const res = await fetch('/api/rpc', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sid, method, args: [args] }),
      signal: hooks.signal,
    });
    if (!STREAMING.has(method)) {
      const body = await res.json().catch(() => ({ error: 'The server sent something unreadable.' }));
      if (!res.ok) throw Object.assign(new Error(body.error ?? 'Request failed'), { status: res.status });
      return body.result;
    }
    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error(body.error ?? 'Request failed'), { status: res.status });
    }
    // Streaming replies arrive as newline-delimited JSON.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result;
    for (;;) {
      const { value, done } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        const msg = JSON.parse(line);
        if (msg.t === 'text') hooks.onText?.(msg.text);
        else if (msg.t === 'result') result = msg.result;
        else if (msg.t === 'error') throw new Error(msg.error);
      }
      if (done) break;
    }
    if (result === undefined) throw new Error('The connection dropped before the reply finished.');
    return result;
  }

  return {
    mode: 'remote',
    ai: status.ai,
    caseInfo: status.case,
    call,
    /** The saved case, or null if there is none. */
    resume: () => call('view'),
  };
}

async function localClient() {
  const [{ GameSession, assertCaseValid }, { createSampleProvider }] = await Promise.all([import('../../core/engine.js'), import('./sample-provider.js')]);
  assertCaseValid();
  const ai = await createSampleProvider();
  const s = store();
  let saved = null;
  try {
    saved = JSON.parse(s?.getItem(SAVE_KEY) ?? 'null');
  } catch {
    saved = null;
  }
  const session = new GameSession({ ai, state: saved ?? undefined });
  let warned = false;
  const persist = () => {
    try {
      s?.setItem(SAVE_KEY, JSON.stringify(session.state));
    } catch (err) {
      if (!warned) console.warn('Could not save progress in this browser:', err?.message);
      warned = true;
    }
  };
  // One action at a time, as on the server.
  let chain = Promise.resolve();
  function call(method, args = {}, hooks = {}) {
    const run = chain.then(async () => {
      const out = await session[method](args, hooks);
      persist();
      // Hand back a copy so the UI can never mutate game state by accident.
      return JSON.parse(JSON.stringify(out));
    });
    chain = run.catch(() => {});
    return run;
  }
  const meta = session.case.meta;
  return {
    mode: 'local',
    get ai() {
      return session.aiInfo();
    },
    caseInfo: { title: meta.title, series: meta.series, tagline: meta.tagline },
    setAiPreference: (pref) => ai?.setPreference?.(pref),
    /** Ask the viewer (once) whether Claude may play the cast. Resolves either way. */
    prepareAi: ai?.warmUp ? () => ai.warmUp() : undefined,
    call,
    async resume() {
      return session.state ? call('view') : null;
    },
    /** Snapshot for the host page's hot-reload hook. */
    snapshot: () => session.state,
  };
}

/**
 * @param {{ mode?: 'local' | 'remote' | 'auto' }} [opts]
 */
export async function connect({ mode = 'auto' } = {}) {
  if (mode === 'local') return localClient();
  if (mode === 'remote') return remoteClient();
  try {
    return await remoteClient();
  } catch {
    return localClient();
  }
}
