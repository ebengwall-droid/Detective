// The Lectern's lesson cards: a short plain summary, a picture that exists, and no answers given away.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CASE } from '../core/cases/fold/index.js';

const source = fs.readFileSync(new URL('../public/src/ui/lessons.js', import.meta.url), 'utf8');
const pictures = new Set([...source.matchAll(/^ {2}(\w+)\(\) \{$/gm)].map((m) => m[1]));
const lectures = Object.entries(CASE.records).filter(([, r]) => r.kind === 'lecture');

test('every picture a card names is drawn', () => {
  assert.ok(pictures.size >= 30);
  for (const [id, r] of lectures) if (r.pic) assert.ok(pictures.has(r.pic), `${id}: no picture called ${r.pic}`);
});

test('every lesson behind a puzzle has a short summary and a picture', () => {
  for (const p of Object.values(CASE.puzzles)) {
    if (!p.lesson) continue;
    const r = CASE.records[`l_${p.lesson}`];
    assert.ok(r.short, `l_${p.lesson} has no short summary`);
    if (!['meta', 'foxglove'].includes(p.lesson)) assert.ok(r.pic, `l_${p.lesson} has no picture`);
  }
});

test('the summaries are short: a few full sentences', () => {
  for (const [id, r] of lectures) {
    if (!r.short) continue;
    assert.ok(r.short.length <= 270, `${id}: ${r.short.length} characters`);
    const sentences = r.short.split(/(?<=[.?!])\s+/);
    assert.ok(sentences.length <= 4, `${id}: ${sentences.length} sentences`);
    assert.match(r.short, /[.?!]$/, `${id} ends mid-sentence`);
  }
});

test('the lessons teach the method without giving a puzzle its answer', () => {
  const R = CASE.records;
  // The Hall clock asks how far west the Fold is.
  assert.doesNotMatch(R.l_time.body + R.l_time.short, /three-quarter|2\.75|2¾/);
  // The tray on the Wall of Tithes has 14 and 15 swapped.
  assert.doesNotMatch(R.l_fifteen.body + R.l_fifteen.short, /14 and 15|Nobody ever collected/);
  // The magic square on the wall is Dürer's, and its missing numbers are his year.
  assert.doesNotMatch(R.l_magic.body, /year he made it|1514/);
});

test('asked from a puzzle, the Lectern opens that puzzle\'s own lesson card', async () => {
  const { GameSession } = await import('../core/engine.js');
  const s = new GameSession({ ai: null });
  await s.newGame({ name: 'Lessons' }, {});
  for (const [id, p] of Object.entries(CASE.puzzles)) {
    if (!p.lesson || CASE.records[`l_${p.lesson}`].if) continue;
    const res = await s.laptopAsk({ query: `How is “${p.title}” done?`, lesson: p.lesson });
    assert.deepEqual(res.opened, [`l_${p.lesson}`], id);
  }
});
