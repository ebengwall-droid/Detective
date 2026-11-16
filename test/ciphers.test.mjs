// The puzzles are set by code. These tests undo every one of them the way a
// player would, so a puzzle that does not come out can never ship.
//
//   node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../core/ciphers.js';
import { PUZZLES, FEEDS, TITHES, TOOLS } from '../core/cases/fold/puzzles.js';

const mono = (id) => PUZZLES[id].blocks.find((b) => b.mono).mono;
const answerOf = (id) => C.normalise(PUZZLES[id].answers[0]);

test('each cipher undoes itself', () => {
  const text = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
  assert.equal(C.caesar(C.caesar(text, 7), -7), text);
  assert.equal(C.rot13(C.rot13(text)), text);
  for (const rails of [2, 3, 4, 5, 6]) assert.equal(C.unRailFence(C.railFence(text, rails), rails), C.lettersOf(text));
  assert.equal(C.unPolybius(C.polybius('HELD SINCE NOON')), 'HELD SINCE NOON');
  assert.equal(C.vigenere(C.vigenere(text, 'LEMON'), 'LEMON', true), text);
  assert.equal(C.vigenere('ATTACKATDAWN', 'LEMON'), 'LXFOPVEFRNHR', 'the textbook example');
  assert.equal(C.playfairSquare('PLAYFAIR EXAMPLE'), 'PLAYFIREXMBCDGHKNOQSTUVWZ');
  assert.equal(C.playfair('HIDE THE GOLD IN THE TREE STUMP', 'PLAYFAIR EXAMPLE'), 'BMODZBXDNABEKUDMUIXMMOUVIF', 'the textbook example');
  assert.equal(C.playfair('BMODZBXDNABEKUDMUIXMMOUVIF', 'PLAYFAIR EXAMPLE', true), 'HIDETHEGOLDINTHETREXESTUMP');
  assert.equal(C.baconRead(C.baconHide('HELLO', 'x'.repeat(30)), 5), 'HELLO');
  assert.equal(C.unHex(C.hexOf('LODGE')), 'LODGE');
  assert.equal(C.hexOf('AZ'), '41 5A');
});

test('the gate, the fitting and the carrier', () => {
  assert.equal(C.caesar(mono('gate'), -3), 'CATCH');
  assert.equal(C.rot13(mono('fitting')), 'PATIENCE');
  // The collar is punched in binary: OUT reads 20, as the story says; IN reads the hour the dial is set to.
  const rows = Object.fromEntries(PUZZLES.bellows.stage.rows.map((r) => [r.label, parseInt(r.holes, 2)]));
  assert.equal(rows.OUT, 20);
  assert.ok(PUZZLES.bellows.answers.some((a) => C.normalise(a) === String(rows.IN)), 'setting the dial to the IN hour is an answer');
  assert.ok(PUZZLES.bellows.answers.map(C.normalise).includes('HELDSINCENOON'));
});

test('Paper I really is a Caesar cipher whose commonest letter is E', () => {
  const cipher = mono('paper1a');
  const [[top]] = C.frequencies(cipher);
  const shift = (top.charCodeAt(0) - 69 + 26) % 26;
  const plain = C.caesar(cipher, -shift);
  assert.match(plain, /^CANDIDATE\./);
  assert.match(plain, /TELL ME THE NAME THE BUYERS GIVE THE THING THEY ARE BUYING/);
  assert.equal(C.frequencies(plain)[0][0], 'E');
  assert.ok(C.frequencies(plain)[0][1] > C.frequencies(plain)[1][1] * 1.5, 'E must lead clearly, as the Paper promises');
  assert.notEqual(shift, 3, 'not the gate\'s number again');
});

test('Paper I, question two, is in letters the pigpen can draw', () => {
  const text = PUZZLES.paper1b.blocks.find((b) => b.glyphs).glyphs;
  assert.match(text, /GIVE ME HIS OFFICE, NOT HIS NAME/);
  assert.ok(/^[A-Z .,]+$/.test(text));
});

test('Paper II: five real places, and one instrument whose arc is a sixth of a circle', () => {
  assert.equal(['Mecca', 'Oslo', 'Null Island', 'Everest', 'York'].map((p) => p[0]).join(''), answerOf('paper2a'));
  assert.equal(PUZZLES.paper2a.blocks.find((b) => b.list).list.length, 5);
  const arcs = PUZZLES.paper2b.stage.arcs;
  assert.equal(arcs.filter((a) => a === 360 / 6).length, 1, 'exactly one sixth of a circle');
  assert.equal(new Set(arcs).size, arcs.length, 'no two instruments alike');
  assert.equal(answerOf('paper2b'), 'SEXTANT');
});

test('Paper III opens to her pen-name and to nothing else nearby', () => {
  const plain = C.vigenere(mono('paper3'), 'VESPER', true);
  assert.match(plain, /^TONIGHT THE PROBLEM ON THE SLATE AT THE STALEMATE IS MINE\./);
  assert.doesNotMatch(C.vigenere(mono('paper3'), 'HESPER', true), /STALEMATE/);
});

test('the slate is a true knight\'s path that spells its message', () => {
  const board = PUZZLES.slate.blocks.find((b) => b.board).board;
  const moves = PUZZLES.slate.blocks.find((b) => b.quote?.startsWith('N ')).quote.slice(2).split(' ');
  assert.equal(board.rows.length, 8);
  for (const row of board.rows) assert.equal(row.length, 8);
  assert.equal(new Set(moves).size, moves.length, 'no square twice');
  moves.forEach((m, i) => i && assert.ok(C.isKnightMove(moves[i - 1], m), `${moves[i - 1]} to ${m}`));
  assert.equal(C.readBoard(board.rows, moves), 'CANDIDATETHREESETSASCENSOR');
});

test('Paper IV is Playfair on the word every Paper is signed with', () => {
  const plain = C.playfair(mono('paper4'), 'INVIGILATOR', true);
  assert.match(plain, /^LAYXYOURSEVENANSWERSINACOLUMN/);
  assert.match(plain, /THESEVENTHANSWERISTUITIONX?$/);
});

test('the seven answers, read down their slope, give the place', () => {
  assert.equal(FEEDS.length, 7);
  const word = FEEDS.map((id, i) => answerOf(id)[i]).join('');
  assert.equal(word, answerOf('meta'));
  FEEDS.forEach((id, i) => assert.equal(PUZZLES[id].feed, i + 1));
});

test('the Late Tithes carry the name corner to corner, and the early one does not', () => {
  for (const year of ['y2014', 'y2018', 'y2022']) {
    assert.equal(TITHES[year].map((w, i) => w[i]).join(''), 'ARIADNE', year);
    for (const w of TITHES[year]) assert.equal(w.length, 7);
  }
  const early = TITHES.y1998.map((w, i) => w[i]).join('');
  assert.notEqual(early, 'ARIADNE');
  for (const p of ['nina', 'lock', 'grille', 'bacon']) assert.equal(answerOf(p), 'ARIADNE');
});

test('the epigraph hides the same name in its capitals', () => {
  const marked = PUZZLES.bacon.blocks.find((b) => b.marked).marked;
  assert.equal(C.baconRead(marked, 7), 'ARIADNE');
  assert.equal(marked.toLowerCase(), 'nothing is hidden that a patient eye will not find.');
});

test('the night log, the square, the bridges and the tray', () => {
  // The night log: only one terminal asks for the lecture between two and four, and it is the answer.
  const log = PUZZLES.ascii.stage.rows;
  const lecture = log.filter((r) => r.busy.some(([from, to, , asked]) => from <= 2 && to >= 4 && /LECTURE 1987/.test(asked)));
  assert.equal(lecture.length, 1);
  assert.equal(lecture[0].name, answerOf('ascii'));
  assert.ok(log.filter((r) => r.busy.some(([from, to]) => from < 4 && to > 2)).length > 1, 'another terminal is busy then too');
  // The chart shows only the hours and the nights. Between two and four the answer is used on far more nights
  // than anyone else, and the darkest square on the whole chart is somewhere else, so the hour matters.
  const late = log.map((r) => [r.name, Math.max(0, ...r.busy.filter(([from, to]) => from < 4 && to > 2).map((b) => b[2]))]).sort((a, b) => b[1] - a[1]);
  assert.equal(late[0][0], answerOf('ascii'));
  assert.ok(late[0][1] > 200 && late[1][1] < 60, 'nearly every night, against a few');
  const darkest = log.flatMap((r) => r.busy.map((b) => [r.name, b[2]])).sort((a, b) => b[1] - a[1])[0];
  assert.notEqual(darkest[0], answerOf('ascii'), 'the darkest square is not the answer');
  // Durer's square: every line makes 34 once the two gaps are filled.
  const rows = PUZZLES.tithe_square.blocks.find((b) => b.grid).grid.map((r) => r.trim().split(/\s+/).map((n) => (n === '?' ? null : Number(n))));
  rows[3][1] = 15;
  rows[3][2] = 14;
  const sums = [...rows.map((r) => r.reduce((a, b) => a + b)), ...[0, 1, 2, 3].map((c) => rows.reduce((a, r) => a + r[c], 0)), rows.reduce((a, r, i) => a + r[i], 0), rows.reduce((a, r, i) => a + r[3 - i], 0)];
  assert.deepEqual(new Set(sums), new Set([34]));
  // The bridges: exactly two places have an odd number.
  const bridges = { 'North Bank': 2 + 1 + 1, Fold: 2 + 1, Eyot: 1 + 2 + 1, 'South Bank': 2 + 1 };
  assert.deepEqual(Object.entries(bridges).filter(([, n]) => n % 2).map(([k]) => k), ['Fold', 'South Bank']);
  assert.equal(Object.values(bridges).reduce((a, b) => a + b) / 2, 7);
  // The tray: one pair out of order with the gap in its home corner cannot be solved.
  const tiles = PUZZLES.tithe_fifteen.blocks.find((b) => b.grid).grid.join(' ').trim().split(/\s+/).filter((t) => t !== '_').map(Number);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) inversions++;
  assert.equal(inversions % 2, 1, 'an odd number of inversions: unreachable');
});

test('every puzzle can be finished from its own hints, and says what it teaches', () => {
  for (const [id, p] of Object.entries(PUZZLES)) {
    assert.ok(p.hints.length >= 3, `${id}: hints run from a nudge to the answer`);
    const last = C.normalise(p.hints.at(-1));
    assert.ok(p.answers.some((a) => last.includes(C.normalise(a))), `${id}: the last hint must give the answer`);
    for (const h of p.hints.slice(0, 1)) assert.ok(!p.answers.some((a) => C.normalise(h).includes(C.normalise(a)) && C.normalise(a).length > 3), `${id}: the first hint must not`);
    assert.ok(p.tier >= 1 && p.tier <= 5, id);
    assert.ok(p.ask && p.solved && p.title, id);
  }
  for (const b of Object.values(PUZZLES).flatMap((p) => p.blocks)) if (b.tool) assert.ok(TOOLS[b.tool], `tool ${b.tool} exists`);
});
