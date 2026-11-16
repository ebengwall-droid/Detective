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

test('the magic square: the two numbers that make every line agree, read together, are the answer', () => {
  for (const [id, p] of ofKind('magic')) {
    const rows = p.blocks.find((b) => b.grid && b.numbers).grid.map((r) => r.trim().split(/\s+/));
    const n = rows.length;
    const used = new Set(rows.flat().filter((v) => v !== '?').map(Number));
    const missing = Array.from({ length: n * n }, (_, i) => i + 1).filter((v) => !used.has(v));
    const blanks = rows.flatMap((r, ri) => r.map((v, ci) => (v === '?' ? [ri, ci] : null))).filter(Boolean);
    const perms = missing.length === 2 ? [missing, [...missing].reverse()] : [];
    const good = perms.filter((perm) => {
      const g = rows.map((r) => r.map((v) => (v === '?' ? null : Number(v))));
      blanks.forEach(([r, c], i) => (g[r][c] = perm[i]));
      const lines = [...g, ...g.map((_, c) => g.map((r) => r[c])), g.map((r, i) => r[i]), g.map((r, i) => r[n - 1 - i])];
      const sums = lines.map((l) => l.reduce((a, b) => a + b, 0));
      return sums.every((s) => s === sums[0]);
    });
    assert.equal(good.length, 1, `${id}: exactly one way to fill it`);
    assert.ok(accepted(id, good[0].join('')), id);
  }
});

test('the bridges: every walk over all seven that ends where hers did began at the answer', () => {
  for (const [id, p] of ofKind('bridges')) {
    const { bridges, end, names } = p.stage;
    const starts = new Set();
    const walk = (at, used, from) => {
      if (used.size === bridges.length) {
        if (at === end) starts.add(from);
        return;
      }
      bridges.forEach(([a, b], i) => {
        if (used.has(i) || (a !== at && b !== at)) return;
        walk(a === at ? b : a, new Set([...used, i]), from);
      });
    };
    for (const place of Object.keys(names)) walk(place, new Set(), place);
    assert.equal(starts.size, 1, `${id}: walks ending there should all begin in one place`);
    assert.ok(accepted(id, names[[...starts][0]]), id);
  }
});

test('the tray: one choice is the answer and the other is not', () => {
  for (const [id, p] of ofKind('slide')) {
    const right = p.stage.choices.filter((c) => accepted(id, c.value));
    assert.equal(right.length, 1, id);
    assert.equal(p.stage.choices.length, 2, id);
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

test('the Hall clock: the minutes behind, at four minutes a degree, is the answer', () => {
  const { behind, step } = PUZZLES.suntime.stage;
  const deg = behind / 4;
  assert.equal(deg % step, 0, 'the answer lies on a step of the slider');
  assert.ok(accepted('suntime', String(deg)));
});

test("Nell's ferry: every way across begins with the answer", () => {
  const { items, eats } = PUZZLES.ferry.stage;
  const firsts = new Set();
  const safe = (bank) => !eats.some(([a, b]) => bank.includes(a) && bank.includes(b));
  // A state: which bank each thing is on, and where the boat is. Search every way across.
  const seen = new Set();
  const queue = [{ side: Object.fromEntries(items.map((i) => [i, 0])), boat: 0, first: null }];
  while (queue.length) {
    const st = queue.shift();
    const key = JSON.stringify([st.side, st.boat, st.first]);
    if (seen.has(key)) continue;
    seen.add(key);
    if (items.every((i) => st.side[i] === 1)) {
      firsts.add(st.first);
      continue;
    }
    for (const cargo of [null, ...items.filter((i) => st.side[i] === st.boat)]) {
      const side = { ...st.side };
      if (cargo) side[cargo] = 1 - st.boat;
      const left = items.filter((i) => side[i] === st.boat);
      if (!safe(left)) continue;
      queue.push({ side, boat: 1 - st.boat, first: st.first ?? cargo });
    }
  }
  assert.deepEqual([...firsts], ['goose']);
  assert.ok(accepted('ferry', 'GOOSE'));
});

test('the Physic Garden: each jar on its own bed is the answer', () => {
  const { beds, jars } = PUZZLES.physic.stage;
  assert.equal(beds.length, jars.length);
  const answer = PUZZLES.physic.answers[0].split(' ');
  assert.equal(answer.length, beds.length, 'one medicine for each bed, in the order the beds lie');
  assert.deepEqual(new Set(answer), new Set(jars.map((j) => j.id)));
  assert.equal(answer[beds.findIndex((b) => b.id === 'DIGITALIS')], 'DIGITOXIN');
  // Whatever is handed in has to survive the game's limit on an answer's length.
  for (const p of Object.values(PUZZLES)) for (const a of p.answers) assert.ok(a.length <= 80, `${p.title}: an answer longer than the game takes`);
});

test("the four o'clock problem has one solution, and the upside-down cups belong to the dead", () => {
  const { rows, cols, down } = PUZZLES.cups.stage;
  const own = { PENDRY: 'CLOCK', SALLOW: 'COMPASS', VOSS: 'CROSSWORD', CLAY: 'ARMS' };
  const perms = (xs) => (xs.length ? xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])) : [[]]);
  const ok = perms(cols.map((c) => c.id)).filter((p) => {
    const cup = Object.fromEntries(rows.map((r, i) => [r.id, p[i]]));
    return rows.every((r) => cup[r.id] !== own[r.id]) && cup.CLAY === 'CLOCK' && cup.SALLOW === 'CROSSWORD' && cup.PENDRY !== 'COMPASS';
  });
  assert.equal(ok.length, 1);
  const answer = rows.map((r, i) => `${r.id} ${ok[0][i]}`).join(' ');
  assert.ok(accepted('cups', answer));
  assert.deepEqual(new Set(down), new Set([ok[0][0], ok[0][1]]), 'Pendry and Sallow, who have died');
});

test("Dame Hesper's adjourned game: the answer is checkmate, and the only one", () => {
  const { fen } = PUZZLES.adjourned.stage;
  const board = fen.split('/').map((row) => [...row].flatMap((ch) => (/\d/.test(ch) ? Array(Number(ch)).fill(null) : [ch])));
  const white = (p) => !!p && p === p.toUpperCase();
  const black = (p) => !!p && p === p.toLowerCase();
  const inside = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
  const moves = (b, r, f) => {
    const p = b[r][f];
    const own = white(p) ? white : black;
    const out = [];
    const t = p.toLowerCase();
    const ray = (dr, df, far) => {
      for (let rr = r + dr, ff = f + df; inside(rr, ff); rr += dr, ff += df) {
        if (own(b[rr][ff])) break;
        out.push([rr, ff]);
        if (b[rr][ff] || !far) break;
      }
    };
    if (t === 'p') {
      const d = white(p) ? -1 : 1;
      if (inside(r + d, f) && !b[r + d][f]) out.push([r + d, f]);
      for (const df of [-1, 1]) if (inside(r + d, f + df) && b[r + d][f + df] && !own(b[r + d][f + df])) out.push([r + d, f + df]);
    } else if (t === 'n') {
      for (const [dr, df] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) if (inside(r + dr, f + df) && !own(b[r + dr][f + df])) out.push([r + dr, f + df]);
    } else {
      const st = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const dg = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (const [dr, df] of t === 'r' ? st : t === 'b' ? dg : [...st, ...dg]) ray(dr, df, t !== 'k');
    }
    return out;
  };
  const attacked = (b, r, f, byWhite) => b.some((row, rr) => row.some((p, ff) => p && white(p) === byWhite && (p.toLowerCase() === 'p' ? rr + (white(p) ? -1 : 1) === r && Math.abs(ff - f) === 1 : moves(b, rr, ff).some(([a, c]) => a === r && c === f))));
  const play = (b, [r, f], [r2, f2]) => {
    const nb = b.map((row) => [...row]);
    nb[r2][f2] = nb[r][f];
    nb[r][f] = null;
    return nb;
  };
  const kingAt = (b, k) => {
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) if (b[r][f] === k) return [r, f];
    return null;
  };
  const blackCanEscape = (b) => {
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++)
        if (black(b[r][f]))
          for (const to of moves(b, r, f)) {
            const nb = play(b, [r, f], to);
            const [kr, kf] = kingAt(nb, 'k');
            if (!attacked(nb, kr, kf, true)) return true;
          }
    return false;
  };
  const mates = [];
  for (let r = 0; r < 8; r++)
    for (let f = 0; f < 8; f++)
      if (white(board[r][f]))
        for (const to of moves(board, r, f)) {
          const nb = play(board, [r, f], to);
          const [wr, wf] = kingAt(nb, 'K');
          if (attacked(nb, wr, wf, false)) continue;
          const [kr, kf] = kingAt(nb, 'k');
          if (attacked(nb, kr, kf, true) && !blackCanEscape(nb)) mates.push(`${board[r][f].toUpperCase()}${String.fromCharCode(97 + to[1])}${8 - to[0]}`);
        }
  assert.deepEqual(mates, ['Nf7']);
  assert.ok(accepted('adjourned', 'Nf7'));
});

test('the Crux Six: the word fits the board, and a guess is marked letter by letter', () => {
  const { length } = PUZZLES.cruxword.stage;
  assert.equal(C.lettersOf(PUZZLES.cruxword.answers[0]).length, length);
  assert.equal(PUZZLES.cruxword.feedback, 'letters');
  assert.equal(C.markLetters('TEACUP', 'TEACUP'), 'GGGGGG');
  assert.equal(C.markLetters('EEEEEE', 'TEACUP'), '.G....');
});

test('the history board, put in order of the years, spells the answer', () => {
  const year = { S: 1455, O: 1492, L: 1616, V: 1666, E: 1776, R: 1840 };
  const items = [...PUZZLES.wardens.stage.items].sort((a, b) => year[a.id] - year[b.id]);
  assert.ok(accepted('wardens', items.map((i) => i.id).join('')));
  assert.notEqual(PUZZLES.wardens.stage.items.map((i) => i.id).join(''), 'SOLVER', 'it does not start solved');
});

test("the apprentice's lesson: one pair hangs on equal strings, and only that pair is right", () => {
  const { bobs } = PUZZLES.pendulum.stage;
  const pairs = [];
  for (let i = 0; i < bobs.length; i++) for (let j = i + 1; j < bobs.length; j++) pairs.push([bobs[i], bobs[j]]);
  const together = pairs.filter(([x, y]) => x.length === y.length);
  assert.equal(together.length, 1);
  // The pair that swings together is one heavy weight and one light one: the weight is what fools you.
  assert.notEqual(together[0][0].heavy, together[0][1].heavy);
  // The words in front of the player count the weights right.
  const words = ['no', 'one', 'two', 'three', 'four', 'five'];
  const heavy = bobs.filter((b) => b.heavy).length;
  assert.match(PUZZLES.pendulum.blocks[0].p.toLowerCase(), new RegExp(`${words[heavy]} of the weights are heavy brass and ${words[bobs.length - heavy]} are light wood`));
  // The stage offers a pair as its two letters in order, with a space between.
  for (const [x, y] of pairs) assert.equal(accepted('pendulum', `${x.id} ${y.id}`), x.length === y.length, `${x.id} ${y.id}`);
  // Every pair of the same weight has its own word of help.
  for (const [x, y] of pairs.filter(([x, y]) => x.heavy === y.heavy)) assert.ok(PUZZLES.pendulum.near.some((n) => n.match.includes(`${x.id} ${y.id}`)), `${x.id} ${y.id}`);
});

test('the piano: the line is the opening of Für Elise, and only that choice is right', () => {
  const { notes, choices } = PUZZLES.piano.stage;
  assert.deepEqual(notes, ['E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4']);
  assert.deepEqual(choices.filter((c) => accepted('piano', c.value)).map((c) => c.label), ['Für Elise']);
});

test('the collar, the log and the instruments', () => {
  const rows = PUZZLES.bellows.stage.rows;
  assert.ok(accepted('bellows', String(parseInt(rows.find((r) => r.label === 'IN').holes, 2))));
  assert.ok(PUZZLES.ascii.stage.rows.some((r) => accepted('ascii', r.name)));
  assert.equal(PUZZLES.paper2b.stage.give.rings, 7);
});
