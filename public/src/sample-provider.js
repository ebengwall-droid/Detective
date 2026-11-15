// AI provider for the hosted build: when the game is opened as a page on
// claude.ai, the host lets it ask Claude directly on the viewer's own account
// (the "sample" capability). No server and no API key are involved.
//
// The host has no system-prompt channel, so the character sheet travels as a
// leading user turn that is kept at the top of every request.
//
// Who plays the cast:
//   'opus'  Claude Opus, always. The best acting; it thinks before it speaks.
//   'quick' The fastest model, always. Words start almost at once.
//   'auto'  Opus, unless it keeps people waiting: if two replies in a row are
//           slow to start (or one is very slow), everyday conversation moves
//           to the fast model and Opus keeps the parts worth waiting for (the
//           letters, the Lectern, the last scene).

const MODEL = 'claude-opus-5-5';
const PREFS_KEY = 'fold.ai';
const PREFS = new Set(['auto', 'opus', 'quick']);
/** Codes that mean "not in this view, do not ask again". */
const GONE = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed']);
/** How long the first words of a conversational reply may take before it counts as slow. Twice this is slow enough to act on at once. */
const SLOW_FIRST_MS = 6000;
/** Requests that are a line of conversation, where a quick answer matters more than a deep one. */
const TALK = /^(npc:|think$)/;

function readPref() {
  try {
    const v = localStorage.getItem(PREFS_KEY);
    return PREFS.has(v) ? v : 'auto';
  } catch {
    return 'auto';
  }
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const median = (list) => {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  return Math.round(s[Math.floor(s.length / 2)]);
};

/** @param {{ slowMs?: number }} [opts] how long the first words may take before a reply counts as slow */
export async function createSampleProvider({ slowMs = SLOW_FIRST_MS } = {}) {
  const host = /** @type {any} */ (globalThis).claude;
  if (!host?.use) return null;
  let sample = null;
  try {
    sample = await host.use('sample');
  } catch {
    sample = null;
  }
  if (!sample) return null;

  let off = false;
  let reason = null;
  let pref = readPref();
  /** Whether the named model actually answered the last call, once we know. */
  let namedAnswered = null;
  /** In 'auto': conversation has moved to the fast model, because Opus kept people waiting ('slow') or ran into a usage limit ('limit'). */
  let eased = false;
  let easedWhy = null;
  let slowRuns = 0;
  /** How long recent replies took to start, by who answered: for the diagnostics. */
  const pace = { opus: [], quick: [] };

  async function run(input, options) {
    try {
      const out = await sample(input, options);
      if (options.model) namedAnswered = !!out.modelApplied;
      return out;
    } catch (err) {
      const code = err?.code ?? 'upstream_error';
      if (GONE.has(code)) {
        // The viewer said no, or Claude is not available here. Never re-ask.
        off = true;
        reason = code === 'not_granted' ? 'Claude was not allowed for this page' : 'Claude is not available in this view';
      }
      // Only a passing service failure is worth one more try; everything else is final.
      throw Object.assign(new Error(`Claude: ${code}`), { code, transient: code === 'upstream_error', final: code !== 'upstream_error' });
    }
  }

  return {
    describe() {
      const fast = pref === 'quick' || (pref === 'auto' && eased);
      const label = off ? 'Scripted' : fast ? 'Claude, fast replies' : namedAnswered === false ? 'Claude' : 'Claude Opus';
      return {
        live: !off,
        model: off ? null : fast ? 'quick' : MODEL,
        label,
        reason,
        hosted: true,
        pref,
        eased,
        easedWhy,
        pace: { opus: median(pace.opus), quick: median(pace.quick) },
      };
    },

    /** 'auto' (the default), 'opus' for the best acting, 'quick' for the fastest replies. */
    setPreference(next) {
      pref = PREFS.has(next) ? next : 'auto';
      namedAnswered = null;
      eased = false;
      easedWhy = null;
      slowRuns = 0;
      try {
        localStorage.setItem(PREFS_KEY, pref);
      } catch {
        /* not remembered across reloads */
      }
    },

    /**
     * The host asks the viewer's permission on the first call. Make that call
     * at a moment that makes sense (pressing Begin), not mid-conversation.
     * Resolves to whether Claude will be playing the cast.
     */
    async warmUp() {
      try {
        await run('Reply with the single word: ready', { modelTier: 'quick' });
      } catch {
        /* declined or unavailable: the game carries on with its script */
      }
      return !off;
    },

    async complete(req) {
      if (off) throw Object.assign(new Error('Claude is not available'), { final: true });
      const format = req.schema ? '\n\nReply with the JSON object only: no code fence, no commentary before or after it.' : '';
      const input = [{ role: 'user', content: req.system + format }, ...req.messages.map((m) => ({ role: m.role, content: m.content }))];
      const effort = req.effort === 'high' ? 'high' : req.effort === 'medium' ? 'medium' : 'low';
      const talk = TALK.test(req.tag ?? '');
      const fast = pref === 'quick' || (pref === 'auto' && eased && talk);
      const started = now();
      let first = null;
      const options = {
        cache: false,
        signal: req.signal,
        onText: ({ text }) => {
          if (first === null) first = now() - started;
          req.onText?.(text);
        },
        ...(fast ? { modelTier: 'quick' } : { model: MODEL, modelTier: 'default', effort }),
      };
      try {
        const { text } = await run(input, options);
        const took = first ?? now() - started;
        const list = fast ? pace.quick : pace.opus;
        list.push(took);
        if (list.length > 9) list.shift();
        if (pref === 'auto' && !fast && talk) {
          slowRuns = took > slowMs ? slowRuns + 1 : 0;
          if (slowRuns >= 2 || took > slowMs * 2) {
            eased = true;
            easedWhy = 'slow';
          }
        }
        return { text, refused: false };
      } catch (err) {
        if (err.code === 'refused') return { text: '', refused: true };
        // The best model has had enough for now (a usage limit). Nothing is retried, but the next
        // thing said goes to the fast model, which is counted separately and far more generously.
        if (err.code === 'rate_limited' && pref === 'auto' && !fast && !eased) {
          eased = true;
          easedWhy = 'limit';
        }
        throw err;
      }
    },
  };
}
