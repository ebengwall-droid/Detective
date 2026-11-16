// The Lectern's lesson cards: a short plain summary, a picture that exists, and no answers given away.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CASE } from '../core/cases/fold/index.js';

const source = fs.readFileSync(new URL('../public/src/ui/lessons.js', import.meta.url), 'utf8');
const pictures = new Set([...source.matchAll(/^ {2}(\w+)\(\) \{$/gm)].map((m) => m[1]));
const lectures = Object.entries(CASE.records).filter(([, r]) => r.kind === 'lecture');

test('every picture a card names is drawn', () => {
  assert.ok(pictures.size >= 20);
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

test("the page gets each open puzzle's method by id, which is what Milo and the Lectern are asked with", async () => {
  const { GameSession } = await import('../core/engine.js');
  const s = new GameSession({ ai: null });
  await s.newGame({ name: 'Lessons' }, {});
  const res = await s.examine({ id: 'turnstile' });
  const gate = res.view.puzzles.find((p) => p.id === 'gate');
  assert.equal(gate.lessonId, CASE.puzzles.gate.lesson);
  // Milo's lines for it travel with the view, and asking with that id opens its card.
  assert.ok(res.view.techie.lessons[gate.lessonId], 'Milo knows the method of an open puzzle');
  const asked = await s.laptopAsk({ query: gate.title, lesson: gate.lessonId });
  assert.deepEqual(asked.opened, [`l_${gate.lessonId}`]);
});

test('the how-tos use their own examples: no puzzle answer appears in them', () => {
  const dir = new URL('../public/src/ui/demos/', import.meta.url);
  const code = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(new URL(f, dir), 'utf8')).join('\n');
  // Only what a player could read: the strings, not the code around them (a 1200 ms pause is not an answer).
  const src = [...code.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2]).join('\n').toUpperCase();
  // Ordinary words the lessons themselves use (the noon sun, Königsberg's south bank, a walk that
  // can never be done), and the instrument the navigation lesson names alongside the others.
  const allowed = new Set(['SEXTANT', 'NOON', 'MIDDAY', 'TWELVE', 'SOUTH', 'SOUTH BANK', 'THE SOUTH BANK', 'NEVER', 'CANNOT', 'IT CANNOT', 'IMPOSSIBLE']);
  for (const [id, p] of Object.entries(CASE.puzzles)) {
    for (const a of p.answers) {
      const word = a.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
      if (word.replace(/ /g, '').length < 4 || allowed.has(word)) continue;
      assert.doesNotMatch(src, new RegExp(`\\b${word.replace(/ /g, '\\s*')}\\b`), `${id}: "${a}" appears in a how-to`);
    }
  }
});
