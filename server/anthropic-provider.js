// The server's AI provider: every character in the game is played by Claude
// through the official Anthropic SDK.
//
// Choices made here:
// - Model: Claude Opus 5.5 unless FOLD_MODEL says otherwise.
// - Thinking is always on for this model; `effort` is the latency/depth dial.
//   Dialogue runs at "low" so characters answer in a couple of seconds.
// - Replies are streamed, and constrained to a JSON schema (structured
//   outputs) so the engine can always parse them.
// - The system prompt is marked cacheable and the growing conversation uses
//   automatic caching, so each new line only pays for what is new.
// - Server-side refusal fallback is on: this is a murder mystery, and if a
//   safety classifier ever declines a line the API retries it on its
//   recommended fallback model instead of the character going silent.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = 'claude-opus-5-5';
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

const LABELS = {
  'claude-opus-5-5': 'Claude Opus 5.5',
  'claude-opus-5': 'Claude Opus 5',
  'claude-fable-5-2': 'Claude Fable 5.2',
  'claude-sonnet-5-5': 'Claude Sonnet 5.5',
  'claude-haiku-5-5': 'Claude Haiku 5.5',
};

function credentialsPresent(env) {
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN) return true;
  // `ant auth login` stores a profile the SDK picks up with no env var set.
  try {
    return fs.readdirSync(path.join(os.homedir(), '.config', 'anthropic')).length > 0;
  } catch {
    return false;
  }
}

export function createAnthropicProvider(env = process.env) {
  const model = env.FOLD_MODEL || DEFAULT_MODEL;
  const debug = !!env.FOLD_DEBUG;
  let live = env.FOLD_AI !== 'off' && credentialsPresent(env);
  let reason = live ? null : env.FOLD_AI === 'off' ? 'AI switched off (FOLD_AI=off)' : 'no Anthropic credentials found';
  let useFallbacks = env.FOLD_FALLBACKS !== 'off';
  /** @type {Anthropic | null} */
  let client = null;

  const getClient = () => (client ??= new Anthropic({ maxRetries: 1, timeout: 90_000 }));

  async function run(req, withFallbacks) {
    const body = {
      model,
      max_tokens: req.maxTokens ?? 4000,
      system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      output_config: {
        effort: req.effort ?? 'low',
        ...(req.schema ? { format: { type: 'json_schema', schema: req.schema } } : {}),
      },
      // Caches the conversation so far; the next turn reads it back cheaply.
      cache_control: { type: 'ephemeral' },
      ...(withFallbacks ? { betas: [FALLBACK_BETA], fallbacks: 'default' } : {}),
    };
    const stream = withFallbacks
      ? getClient().beta.messages.stream(body, { signal: req.signal })
      : getClient().messages.stream(body, { signal: req.signal });
    if (req.onText) stream.on('text', (_delta, snapshot) => req.onText(snapshot));
    const message = await stream.finalMessage();
    if (debug) {
      const u = message.usage;
      console.log(`[ai ${req.tag ?? ''}] ${message.model} in=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} out=${u.output_tokens} stop=${message.stop_reason}`);
    }
    // A refusal arrives as a normal response; check before reading content.
    if (message.stop_reason === 'refusal') return { text: '', refused: true };
    const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return { text, refused: false, truncated: message.stop_reason === 'max_tokens' };
  }

  return {
    describe() {
      return { live, model: live ? model : null, label: live ? (LABELS[model] ?? model) : 'Scripted', reason };
    },

    /**
     * @param {{ system: string, messages: {role: 'user'|'assistant', content: string}[], schema?: object,
     *           effort?: 'low'|'medium'|'high', maxTokens?: number, onText?: (soFar: string) => void,
     *           signal?: AbortSignal, tag?: string }} req
     */
    async complete(req) {
      if (!live) throw new Error('AI is not available');
      try {
        return await run(req, useFallbacks);
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
          live = false;
          reason = 'the Anthropic credentials were rejected';
          console.error(`\n  Anthropic rejected the credentials (${err.status}). Falling back to scripted mode.\n  Check ANTHROPIC_API_KEY and restart.\n`);
          throw err;
        }
        if (err instanceof Anthropic.NotFoundError) {
          live = false;
          reason = `model "${model}" is not available to this account`;
          console.error(`\n  Model "${model}" is not available to this account. Falling back to scripted mode.\n  Set FOLD_MODEL to a model you can use and restart.\n`);
          throw err;
        }
        if (err instanceof Anthropic.BadRequestError && useFallbacks) {
          // Most likely this account or platform does not have the refusal
          // fallback beta. Drop it and carry on without.
          useFallbacks = false;
          console.warn('  Refusal fallback is not available on this account; continuing without it.');
          return run(req, false);
        }
        if (err instanceof Anthropic.RateLimitError) {
          console.warn('  Anthropic rate limit hit; this line will use the scripted fallback.');
        }
        throw err;
      }
    },
  };
}
