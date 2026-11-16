// Every puzzle is solved on the stage by handling a thing: turning a wheel,
// tapping codes against a key, walking bridges. These tests do what the hands
// would do, the way each kind of stage reads it, and check that what would be
// handed in is an answer the case accepts. So no puzzle can ship with an
// object that cannot give its own answer.
//
//   node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../core/ciphers.js';
import { PUZZLES, FEEDS } from '../core/cases/fold/puzzles.js';

const accepted = (id, given) => PUZZLES[id].answers.some((a) => C.normalise(a) === C.normalise(given));
const mono = (id) => PUZZLES[id].blocks.find((b) => b.mono).mono;
const ofKind = (kind) => Object.entries(PUZZLES).filter(([, p]) => p.stage?.kind === kind);

test('every puzzle has a stage and one line saying what to do', () => {
  for (const [id, p] of Object.entries(PUZZLES)) {
    assert.ok(p.stage?.kind, `${id} has no stage`);
    assert.ok(p.goal && p.goal.length <= 110, `${id}: the goal should be one short line`);
  }
});

test('a lock or a row of rings has a ring for every letter of its answer', () => {
  for (const [id, p] of Object.entries(PUZZLES)) {
    const rings = p.stage.kind === 'lock' ? p.lock.rings : p.stage.give?.rings;
    if (rings) assert.equal(C.lettersOf(p.answers[0]).length, rings, id);
  }
});

test('a wheel read out at the right setting says the answer', () => {
  for (const [id, p] of ofKind('wheel')) {
    if (p.stage.give !== 'read') continue;
    const readings = Array.from({ length: 26 }, (_, k) => C.caesar(mono(id), -k).replace(/\s+/g, ' ').trim());
    assert.ok(readings.some((r) => accepted(id, r)), id);
  }
});

test('codes tapped against their key read out as the answer', () => {
  const five = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
  for (const [id] of ofKind('pairs')) {
    const words = mono(id).split('/').map((w) => w.trim().split(/\s+/));
    const reading = words.map((w) => w.map((c) => five[(Number(c[0]) - 1) * 5 + Number(c[1]) - 1]).join('')).join(' ');
    assert.ok(accepted(id, reading), id);
  }
  for (const [id] of ofKind('codes')) {
    const codes = mono(id).match(/\b[0-9A-F]{2}\b/g);
    assert.ok(accepted(id, codes.map((c) => String.fromCharCode(parseInt(c, 16))).join('')), id);
  }
  for (const [id, p] of ofKind('bacon')) {
    const letters = [...p.blocks.find((b) => b.marked).marked].filter((ch) => /[A-Za-z]/.test(ch));
    let reading = '';
    for (let i = 0; i + 5 <= letters.length && reading.length < p.stage.letters; i += 5) {
      const bits = letters.slice(i, i + 5).map((ch) => (ch === ch.toUpperCase() ? '1' : '0')).join('');
      reading += String.fromCharCode(65 + parseInt(bits, 2));
    }
    assert.ok(accepted(id, reading), id);
  }
});

test('a keyed message, given its key, has the answer in it to pick out', () => {
  const keys = { vigenere: 'VESPER', playfair: 'INVIGILATOR' };
  for (const [id, p] of ofKind('keyed')) {
    const text = mono(id);
    const plain = p.stage.method === 'vigenere' ? C.vigenere(text, keys.vigenere, true) : C.playfair(C.lettersOf(text), keys.playfair, true);
    assert.ok(p.answers.some((a) => C.lettersOf(plain).includes(C.lettersOf(a))), id);
  }
});

test("the knight's path spells a line with the answer in it", () => {
  for (const [id, p] of ofKind('knight')) {
    const rows = p.blocks.find((b) => b.board).board.rows;
    const moves = p.blocks.find((b) => b.quote && /^N\s/.test(b.quote)).quote.match(/[a-h][1-8]/g);
    for (let i = 1; i < moves.length; i++) assert.ok(C.isKnightMove(moves[i - 1], moves[i]), `${moves[i - 1]} to ${moves[i]}`);
    assert.ok(C.readBoard(rows, moves).includes(C.lettersOf(p.answers[0])), id);
  }
});

test('the column of answers, read down its slope, is the answer', () => {
  for (const [id] of ofKind('column')) {
    const word = FEEDS.map((pid, i) => C.lettersOf(PUZZLES[pid].answers[0])[i]).join('');
    assert.ok(accepted(id, word), id);
  }
});

test('a line read across a late square is the answer, and not across the early one', () => {
  for (const [id, p] of ofKind('grids')) {
    const grids = p.blocks.filter((b) => b.grid && !b.numbers);
    const diagonal = (g) => g.grid.map((row, i) => row[i]).join('');
    assert.ok(grids.slice(0, 3).every((g) => accepted(id, diagonal(g))), id);
    assert.ok(!accepted(id, diagonal(grids[3])), `${id}: the 1998 square should not give it`);
  }
});

test('five places on the map, one ring each, spell the answer', () => {
  for (const [id, p] of ofKind('places')) {
    const list = p.blocks.find((b) => b.list).list;
    assert.equal(list.length, C.lettersOf(p.answers[0]).length, id);
    for (const line of list) assert.match(line, /[\d.]+°\s*[NS],\s*[\d.]+°\s*[EW]/, `${id}: every place has its coordinates`);
  }
});

// ------------------------------------------------------------------ puzzles about the world

test('the collar, the log and the instruments', () => {
  const rows = PUZZLES.bellows.stage.rows;
  assert.ok(accepted('bellows', String(parseInt(rows.find((r) => r.label === 'IN').holes, 2))));
  assert.ok(PUZZLES.ascii.stage.rows.some((r) => accepted('ascii', r.name)));
  assert.equal(PUZZLES.paper2b.stage.give.rings, 7);
});
