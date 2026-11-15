// The hosted build's provider: the game asking Claude through the page it is
// published on. Exercised against a stand-in for the host; it checks what we
// send and how we behave when the host says no, not what the real host accepts.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createSampleProvider } from '../public/src/sample-provider.js';
import { GameSession } from '../core/engine.js';

/** A stand-in host. `answer` decides what each call does. */
function host(answer) {
  const calls = [];
  const sample = async (input, options) => {
    calls.push({ input, options });
    return answer({ input, options, n: calls.length });
  };
  globalThis.claude = { use: async (name) => (name === 'sample' ? sample : null) };
  return calls;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (text) => JSON.stringify({ say: text, mood: 'calm', told: [], acts: [], threads: [] });

test('with no host there is no provider, and the game keeps to its script', async () => {
  delete globalThis.claude;
  assert.equal(await createSampleProvider(), null);
});

test('the character sheet leads, the detective has the last word, and Opus is asked for by name', async () => {
  const calls = host(async ({ options }) => {
    options.onText({ text: say('Good morning.'), delta: say('Good morning.') });
    return { text: say('Good morning.'), truncated: false, modelApplied: options.model, modelTierApplied: 'complex' };
  });
  const ai = await createSampleProvider();
  const session = new GameSession({ ai });
  await session.newGame({ name: 'Sam' });
  await session.talk({ id: 'kit' });
  const res = await session.say({ id: 'kit', text: 'good morning' });
  assert.equal(res.reply.degraded, false);
  assert.equal(res.reply.say, 'Good morning.');
  const { input, options } = calls.at(-1);
  assert.equal(input[0].role, 'user');
  assert.match(input[0].content, /Reply with the JSON object only/);
  assert.equal(input.at(-1).role, 'user', 'the list ends on the detective');
  assert.match(input.at(-1).content, /good morning/);
  assert.ok(input.every((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length > 0));
  assert.equal(options.model, 'claude-opus-5-5');
  assert.equal(options.effort, 'low');
  assert.equal(options.cache, false);
  assert.equal(typeof options.onText, 'function');
  assert.equal(ai.describe().label, 'Claude Opus');
  assert.equal(ai.describe().pref, 'auto');
});

test('when the best model keeps people waiting, talk moves to the fast one and the rest does not', async () => {
  const calls = host(async ({ options }) => {
    // A named model thinks first; the quick tier does not.
    if (options.model) await sleep(45);
    const text = say('Well.');
    options.onText({ text, delta: text });
    return { text, truncated: false, modelApplied: options.model, modelTierApplied: options.model ? 'complex' : 'quick' };
  });
  const ai = await createSampleProvider({ slowMs: 30 });
  const ask = (tag) => ai.complete({ system: 'sheet', messages: [{ role: 'user', content: 'hello' }], schema: {}, effort: 'low', tag });
  await ask('npc:kit');
  assert.equal(ai.describe().eased, false, 'one slowish answer is not a pattern');
  await ask('npc:kit');
  assert.equal(ai.describe().eased, true);
  await ask('npc:marsh');
  assert.equal(calls.at(-1).options.modelTier, 'quick');
  assert.ok(!('model' in calls.at(-1).options), 'the fast tier is not asked for by model');
  assert.equal(ai.describe().label, 'Claude, fast replies');
  await ask('letter');
  assert.equal(calls.at(-1).options.model, 'claude-opus-5-5', 'a letter is worth the wait');
  await ask('finale');
  assert.equal(calls.at(-1).options.model, 'claude-opus-5-5');
  const pace = ai.describe().pace;
  assert.ok(pace.opus >= 30 && pace.quick !== null && pace.quick < pace.opus);
  // Choosing Opus outright is respected, however slow.
  ai.setPreference('opus');
  await ask('npc:kit');
  await ask('npc:kit');
  await ask('npc:kit');
  assert.equal(calls.at(-1).options.model, 'claude-opus-5-5');
  assert.equal(ai.describe().eased, false);
  ai.setPreference('quick');
  await ask('finale');
  assert.equal(calls.at(-1).options.modelTier, 'quick');
});

test('one very slow answer is enough', async () => {
  host(async ({ options }) => {
    if (options.model) await sleep(60);
    const text = say('Hm.');
    options.onText({ text, delta: text });
    return { text, truncated: false, modelApplied: options.model, modelTierApplied: 'complex' };
  });
  const ai = await createSampleProvider({ slowMs: 20 });
  await ai.complete({ system: 's', messages: [{ role: 'user', content: 'q' }], tag: 'npc:kit' });
  assert.equal(ai.describe().eased, true);
});

test('a quick best model is left alone', async () => {
  host(async ({ options }) => {
    const text = say('Yes.');
    options.onText({ text, delta: text });
    return { text, truncated: false, modelApplied: options.model, modelTierApplied: 'complex' };
  });
  const ai = await createSampleProvider({ slowMs: 500 });
  for (let i = 0; i < 4; i++) await ai.complete({ system: 's', messages: [{ role: 'user', content: 'q' }], tag: 'npc:kit' });
  assert.equal(ai.describe().eased, false);
});

test('a viewer who says no is never asked again, and the game says why it is scripted', async () => {
  const calls = host(async () => {
    throw { code: 'not_granted', message: 'viewer declined' };
  });
  const ai = await createSampleProvider();
  assert.equal(await ai.warmUp(), false);
  assert.equal(ai.describe().live, false);
  assert.match(ai.describe().reason, /not allowed/);
  await assert.rejects(ai.complete({ system: 's', messages: [{ role: 'user', content: 'q' }] }));
  assert.equal(calls.length, 1, 'no second request leaves the page');
  const session = new GameSession({ ai });
  await session.newGame({ name: 'Sam' });
  await session.talk({ id: 'kit' });
  const res = await session.say({ id: 'kit', text: 'why is the gate locked' });
  assert.equal(res.reply.degraded, false, 'nothing is "degraded" when there is no model to begin with');
  assert.match(res.reply.say, /letter-lock/);
});

test('only a passing failure is tried again; a usage limit is not, and the reply says why it is scripted', async () => {
  let mode = 'limit';
  const calls = host(async ({ options }) => {
    if (mode === 'limit') throw { code: 'rate_limited', message: 'slow down' };
    if (mode === 'blip') {
      mode = 'fine';
      throw { code: 'upstream_error', message: 'connection reset' };
    }
    const text = say('It is a letter-lock, that is all I may say.');
    options.onText({ text, delta: text });
    return { text, truncated: false, modelApplied: options.model, modelTierApplied: 'complex' };
  });
  const ai = await createSampleProvider();
  const session = new GameSession({ ai });
  session.brain.retryMs = 1;
  await session.newGame({ name: 'Sam' });
  await session.talk({ id: 'kit' });
  const limited = await session.say({ id: 'kit', text: 'why is the gate locked' });
  assert.equal(calls.length, 1, 'a usage limit is not hammered');
  assert.equal(limited.reply.degraded, true);
  assert.equal(limited.reply.why, 'rate_limited');
  assert.match(limited.reply.say, /letter-lock/, 'and the script still answers the question');
  assert.equal(ai.describe().live, true, 'Claude is still there for the next line');
  mode = 'blip';
  const after = await session.say({ id: 'kit', text: 'what is this place' });
  assert.equal(calls.length, 3, 'a dropped connection gets one more try');
  assert.equal(after.reply.degraded, false);
  assert.equal(after.reply.why, null);
});

test('when the best model hits a usage limit, the next thing said goes to the fast one', async () => {
  const calls = host(async ({ options }) => {
    if (options.model) throw { code: 'rate_limited', message: 'opus is at its limit' };
    const text = say('Go on.');
    options.onText({ text, delta: text });
    return { text, truncated: false, modelTierApplied: 'quick' };
  });
  const ai = await createSampleProvider();
  const session = new GameSession({ ai });
  session.brain.retryMs = 1;
  await session.newGame({ name: 'Sam' });
  await session.talk({ id: 'kit' });
  const first = await session.say({ id: 'kit', text: 'why is the gate locked' });
  assert.equal(first.reply.degraded, true);
  assert.equal(first.reply.why, 'rate_limited');
  assert.equal(calls.length, 1, 'the limited call is not repeated');
  assert.equal(ai.describe().eased, true);
  assert.equal(ai.describe().easedWhy, 'limit');
  const next = await session.say({ id: 'kit', text: 'what is this place' });
  assert.equal(calls.at(-1).options.modelTier, 'quick');
  assert.equal(next.reply.degraded, false);
  assert.equal(next.reply.say, 'Go on.');
});

test('a refusal is final and is not retried', async () => {
  const calls = host(async () => {
    throw { code: 'refused', message: 'no' };
  });
  const ai = await createSampleProvider();
  const session = new GameSession({ ai });
  session.brain.retryMs = 1;
  await session.newGame({ name: 'Sam' });
  await session.talk({ id: 'kit' });
  const res = await session.say({ id: 'kit', text: 'who died?' });
  assert.equal(calls.length, 1);
  assert.equal(res.reply.degraded, true);
  assert.equal(res.reply.why, 'declined');
  assert.match(res.reply.say, /Pendry/);
});

test.after(() => {
  delete globalThis.claude;
});
