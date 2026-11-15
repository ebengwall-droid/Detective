// The Anthropic provider, exercised through the real SDK against a local
// stand-in for the Messages API. This checks our side of the conversation
// (what we send, how we read the stream, what we do when refused or
// rejected); it cannot check what the real API accepts.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createAnthropicProvider } from '../server/anthropic-provider.js';

/** @type {{url: string, headers: http.IncomingHttpHeaders, body: any}[]} */
const seen = [];
/** What the stand-in does next: a queue of handlers, one per request. */
const script = [];
let server;
const saved = { key: process.env.ANTHROPIC_API_KEY, base: process.env.ANTHROPIC_BASE_URL };

function stream(res, chunks, stop = 'end_turn') {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  const send = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
  send('message_start', { message: { id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 12, output_tokens: 0 } } });
  if (chunks.length) {
    send('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
    for (const text of chunks) send('content_block_delta', { index: 0, delta: { type: 'text_delta', text } });
    send('content_block_stop', { index: 0 });
  }
  send('message_delta', { delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 7 } });
  send('message_stop', {});
  res.end();
}

function fail(res, status, type, message) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ type: 'error', error: { type, message } }));
}

before(async () => {
  server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (d) => (raw += d));
    req.on('end', () => {
      seen.push({ url: req.url, headers: req.headers, body: raw ? JSON.parse(raw) : null });
      const next = script.shift();
      if (!next) return fail(res, 500, 'api_error', 'nothing scripted');
      next(res);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  process.env.ANTHROPIC_API_KEY = 'test-key-not-real';
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  if (saved.key === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = saved.key;
  if (saved.base === undefined) delete process.env.ANTHROPIC_BASE_URL;
  else process.env.ANTHROPIC_BASE_URL = saved.base;
});

const request = (extra = {}) => ({
  system: 'You are Agnes Dray.',
  messages: [{ role: 'user', content: 'DETECTIVE: "What time did you leave?"' }],
  schema: { type: 'object', properties: { say: { type: 'string' } }, required: ['say'], additionalProperties: false },
  effort: 'low',
  maxTokens: 500,
  tag: 'test',
  ...extra,
});

test('sends the request we mean to send and reads the stream as it arrives', async () => {
  seen.length = 0;
  script.push((res) => stream(res, ['{"say":"I left ', 'at six."}']));
  const ai = createAnthropicProvider({ ...process.env, FOLD_AI: undefined });
  assert.equal(ai.describe().live, true);
  const snapshots = [];
  const out = await ai.complete(request({ onText: (soFar) => snapshots.push(soFar) }));
  assert.deepEqual(out, { text: '{"say":"I left at six."}', refused: false, truncated: false });
  assert.deepEqual(snapshots, ['{"say":"I left ', '{"say":"I left at six."}'], 'onText gets the whole text so far each time');

  assert.equal(seen.length, 1);
  const { body, headers, url } = seen[0];
  assert.ok(url.startsWith('/v1/messages'));
  assert.ok([headers['x-api-key'], headers.authorization].some((h) => String(h ?? '').includes('test-key-not-real')), 'the key travels in a header');
  assert.match(String(headers['anthropic-beta'] ?? ''), /server-side-fallback/);
  assert.equal(body.model, 'claude-opus-5-5');
  assert.equal(body.stream, true);
  assert.equal(body.max_tokens, 500);
  assert.equal(body.fallbacks, 'default');
  assert.deepEqual(body.system, [{ type: 'text', text: 'You are Agnes Dray.', cache_control: { type: 'ephemeral' } }]);
  assert.deepEqual(body.cache_control, { type: 'ephemeral' });
  assert.equal(body.output_config.effort, 'low');
  assert.equal(body.output_config.format.type, 'json_schema');
  assert.deepEqual(body.messages, [{ role: 'user', content: 'DETECTIVE: "What time did you leave?"' }]);
  // Nothing a current model would reject outright.
  for (const gone of ['temperature', 'top_p', 'top_k', 'budget_tokens']) assert.ok(!(gone in body), gone);
  assert.ok(!('thinking' in body) || body.thinking.type !== 'enabled');
});

test('plain text requests carry no output format', async () => {
  seen.length = 0;
  script.push((res) => stream(res, ['Detective.\n\n', '— L.']));
  const ai = createAnthropicProvider(process.env);
  const out = await ai.complete(request({ schema: undefined, effort: 'medium' }));
  assert.equal(out.text, 'Detective.\n\n— L.');
  assert.equal(seen[0].body.output_config.effort, 'medium');
  assert.ok(!('format' in seen[0].body.output_config));
});

test('an account without the fallback beta is retried without it, once, and remembered', async () => {
  seen.length = 0;
  script.push((res) => fail(res, 400, 'invalid_request_error', 'fallbacks: unknown field'));
  script.push((res) => stream(res, ['{"say":"Yes."}']));
  script.push((res) => stream(res, ['{"say":"Again."}']));
  const warn = console.warn;
  console.warn = () => {};
  const ai = createAnthropicProvider(process.env);
  const first = await ai.complete(request());
  const second = await ai.complete(request());
  console.warn = warn;
  assert.equal(first.text, '{"say":"Yes."}');
  assert.equal(second.text, '{"say":"Again."}');
  assert.equal(seen.length, 3);
  assert.equal(seen[0].body.fallbacks, 'default');
  assert.ok(!('fallbacks' in seen[1].body), 'the retry drops the fallback');
  assert.ok(!('fallbacks' in seen[2].body), 'and later calls do not try it again');
});

test('a refusal is reported as a refusal, not as an empty line', async () => {
  script.push((res) => stream(res, [], 'refusal'));
  const ai = createAnthropicProvider(process.env);
  const out = await ai.complete(request());
  assert.equal(out.refused, true);
  assert.equal(out.text, '');
});

test('a reply cut off by the token limit is flagged', async () => {
  script.push((res) => stream(res, ['{"say":"I was just'], 'max_tokens'));
  const ai = createAnthropicProvider(process.env);
  const out = await ai.complete(request());
  assert.equal(out.truncated, true);
});

test('rejected credentials switch the game to its script for good', async () => {
  script.push((res) => fail(res, 401, 'authentication_error', 'invalid x-api-key'));
  const error = console.error;
  console.error = () => {};
  const ai = createAnthropicProvider(process.env);
  await assert.rejects(ai.complete(request()));
  console.error = error;
  assert.equal(ai.describe().live, false);
  assert.match(ai.describe().reason, /credentials/);
  await assert.rejects(ai.complete(request()), /not available/);
});

test('with no credentials, or switched off, there is no live AI', () => {
  const none = createAnthropicProvider({ HOME: '/nonexistent' });
  assert.equal(none.describe().live, false);
  const off = createAnthropicProvider({ ANTHROPIC_API_KEY: 'x', FOLD_AI: 'off' });
  assert.equal(off.describe().live, false);
  assert.equal(off.describe().label, 'Scripted');
});

test('closing the connection stops the call', async () => {
  // A reply that never finishes until the caller gives up.
  script.push((res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: 'm', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 0 } } })}\n\n`);
  });
  const ai = createAnthropicProvider(process.env);
  const ctl = new AbortController();
  const pending = ai.complete(request({ signal: ctl.signal }));
  setTimeout(() => ctl.abort(), 150);
  await assert.rejects(pending);
});
