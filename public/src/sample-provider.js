// AI provider for the hosted build: when the game is opened as a page on
// claude.ai, the host lets it ask Claude directly on the viewer's own account
// (the "sample" capability). No server and no API key are involved.
//
// The host has no system-prompt channel, so the character sheet travels as a
// leading user turn that is kept at the top of every request.

const MODEL = 'claude-opus-5-5';
const PREFS_KEY = 'greyhaven.ai';
/** Codes that mean "not in this view, do not ask again". */
const GONE = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed']);

function readPref() {
  try {
    return localStorage.getItem(PREFS_KEY) === 'quick' ? 'quick' : 'opus';
  } catch {
    return 'opus';
  }
}

export async function createSampleProvider() {
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
      throw Object.assign(new Error(`Claude: ${code}`), { code });
    }
  }

  return {
    describe() {
      const label = off ? 'Scripted' : pref === 'quick' ? 'Claude, fast replies' : namedAnswered === false ? 'Claude' : 'Claude Opus';
      return { live: !off, model: off ? null : pref === 'quick' ? 'quick' : MODEL, label, reason, hosted: true, pref };
    },

    /** 'opus' for the best acting, 'quick' for the fastest replies. */
    setPreference(next) {
      pref = next === 'quick' ? 'quick' : 'opus';
      namedAnswered = null;
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
      if (off) throw new Error('Claude is not available');
      const format = req.schema ? '\n\nReply with the JSON object only: no code fence, no commentary before or after it.' : '';
      const input = [{ role: 'user', content: req.system + format }, ...req.messages.map((m) => ({ role: m.role, content: m.content }))];
      const effort = req.effort === 'high' ? 'high' : req.effort === 'medium' ? 'medium' : 'low';
      const options = {
        cache: false,
        signal: req.signal,
        onText: req.onText ? ({ text }) => req.onText(text) : undefined,
        ...(pref === 'quick' ? { modelTier: 'quick' } : { model: MODEL, modelTier: 'default', effort }),
      };
      try {
        const { text } = await run(input, options);
        return { text, refused: false };
      } catch (err) {
        if (err.code === 'refused') return { text: '', refused: true };
        throw err;
      }
    },
  };
}
