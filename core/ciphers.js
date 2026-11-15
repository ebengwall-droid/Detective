// The classical ciphers the game's puzzles are set in.
//
// Every puzzle text in the case file is produced by these functions from its
// plain answer, and the tests run each one backwards, so a puzzle can never
// ship with a slip of the pen in it. The client's solving tools use the same
// code.

const A = 65;
const isLetter = (ch) => ch >= 'A' && ch <= 'Z';
const up = (text) => String(text).toUpperCase();

/** Caesar's cipher: every letter moved `shift` places along the alphabet. Other characters pass through. */
export function caesar(text, shift) {
  const k = ((shift % 26) + 26) % 26;
  return up(text).replace(/[A-Z]/g, (ch) => String.fromCharCode(((ch.charCodeAt(0) - A + k) % 26) + A));
}

/** ROT13: the Caesar shift that undoes itself. */
export const rot13 = (text) => caesar(text, 13);

/** Letters only, capitals. */
export const lettersOf = (text) => up(text).replace(/[^A-Z]/g, '');

/** How often each letter appears, commonest first. */
export function frequencies(text) {
  const counts = new Map();
  for (const ch of lettersOf(text)) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Rail fence: write the letters in a zigzag over `rails` lines, then read the lines off one after another. */
export function railFence(text, rails) {
  const s = lettersOf(text);
  const rows = Array.from({ length: rails }, () => []);
  let r = 0;
  let step = 1;
  for (const ch of s) {
    rows[r].push(ch);
    if (r === 0) step = 1;
    else if (r === rails - 1) step = -1;
    r += step;
  }
  return rows.map((row) => row.join('')).join('');
}

export function unRailFence(cipher, rails) {
  const s = lettersOf(cipher);
  const pattern = [];
  let r = 0;
  let step = 1;
  for (let i = 0; i < s.length; i++) {
    pattern.push(r);
    if (r === 0) step = 1;
    else if (r === rails - 1) step = -1;
    r += step;
  }
  const out = new Array(s.length);
  let k = 0;
  for (let row = 0; row < rails; row++) {
    for (let i = 0; i < s.length; i++) if (pattern[i] === row) out[i] = s[k++];
  }
  return out.join('');
}

/** The Polybius square: five by five, I and J sharing a cell. Each letter becomes row then column, counted from 1. */
const SQUARE = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
export function polybius(text) {
  return up(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      lettersOf(word)
        .replace(/J/g, 'I')
        .split('')
        .map((ch) => {
          const i = SQUARE.indexOf(ch);
          return `${Math.floor(i / 5) + 1}${(i % 5) + 1}`;
        })
        .join(' '),
    )
    .join('  /  ');
}

export function unPolybius(codes) {
  return String(codes)
    .split('/')
    .map((word) =>
      (word.match(/[1-5][1-5]/g) ?? [])
        .map((pair) => SQUARE[(Number(pair[0]) - 1) * 5 + Number(pair[1]) - 1])
        .join(''),
    )
    .join(' ')
    .trim();
}

/** Vigenere: a Caesar shift that changes with each letter of a key word. Only letters use up the key. */
export function vigenere(text, key, decrypt = false) {
  const k = lettersOf(key);
  if (!k) return up(text);
  let i = 0;
  return up(text).replace(/[A-Z]/g, (ch) => {
    const shift = k.charCodeAt(i++ % k.length) - A;
    const moved = decrypt ? ch.charCodeAt(0) - A - shift + 26 : ch.charCodeAt(0) - A + shift;
    return String.fromCharCode((moved % 26) + A);
  });
}

/** The 5 x 5 Playfair square for a key word: the key's letters once each, then the rest of the alphabet, J riding with I. */
export function playfairSquare(key) {
  const seen = new Set();
  let out = '';
  for (const ch of lettersOf(key).replace(/J/g, 'I') + SQUARE) {
    if (!seen.has(ch)) {
      seen.add(ch);
      out += ch;
    }
  }
  return out;
}

/** Split a message into Playfair pairs: J becomes I, a doubled letter is parted with X, an odd letter out gets an X. */
export function playfairPairs(text) {
  const s = lettersOf(text).replace(/J/g, 'I');
  const pairs = [];
  let i = 0;
  while (i < s.length) {
    const a = s[i];
    const b = s[i + 1];
    if (b === undefined) {
      pairs.push(a + (a === 'X' ? 'Q' : 'X'));
      i += 1;
    } else if (a === b) {
      pairs.push(a + (a === 'X' ? 'Q' : 'X'));
      i += 1;
    } else {
      pairs.push(a + b);
      i += 2;
    }
  }
  return pairs;
}

/** Playfair: letters are swapped a pair at a time by their places in the key square. */
export function playfair(text, key, decrypt = false) {
  const sq = playfairSquare(key);
  const move = decrypt ? 4 : 1;
  const pairs = decrypt ? lettersOf(text).replace(/J/g, 'I').match(/../g) ?? [] : playfairPairs(text);
  return pairs
    .map(([a, b]) => {
      const ia = sq.indexOf(a);
      const ib = sq.indexOf(b);
      const ra = Math.floor(ia / 5);
      const ca = ia % 5;
      const rb = Math.floor(ib / 5);
      const cb = ib % 5;
      if (ra === rb) return sq[ra * 5 + ((ca + move) % 5)] + sq[rb * 5 + ((cb + move) % 5)];
      if (ca === cb) return sq[((ra + move) % 5) * 5 + ca] + sq[((rb + move) % 5) * 5 + cb];
      return sq[ra * 5 + cb] + sq[rb * 5 + ca];
    })
    .join('');
}

/**
 * Bacon's two-letter cipher, in its modern 26-letter form: each letter of the secret is five
 * marks, a or b (A = aaaaa, B = aaaab ... Z = bbaab), and the marks are carried by some visible
 * difference between the letters of an innocent sentence. Here: small letters for a, capitals for b.
 */
export function baconHide(secret, cover) {
  const bits = lettersOf(secret)
    .split('')
    .map((ch) => (ch.charCodeAt(0) - A).toString(2).padStart(5, '0'))
    .join('');
  let i = 0;
  let out = '';
  for (const ch of String(cover)) {
    if (/[A-Za-z]/.test(ch)) {
      out += i < bits.length && bits[i] === '1' ? ch.toUpperCase() : ch.toLowerCase();
      i += 1;
    } else out += ch;
  }
  if (i < bits.length) throw new Error('cover text too short for the secret');
  return out;
}

export function baconRead(marked, length) {
  const marks = String(marked)
    .replace(/[^A-Za-z]/g, '')
    .split('')
    .map((ch) => (ch === ch.toUpperCase() ? '1' : '0'))
    .join('');
  let out = '';
  for (let i = 0; i + 5 <= marks.length && out.length < length; i += 5) out += String.fromCharCode(parseInt(marks.slice(i, i + 5), 2) + A);
  return out;
}

/** Bytes of a word as two-digit hexadecimal, the way a machine's log prints them. */
export const hexOf = (text) =>
  up(text)
    .split('')
    .map((ch) => ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');

export const unHex = (codes) =>
  String(codes)
    .trim()
    .split(/\s+/)
    .map((h) => String.fromCharCode(parseInt(h, 16)))
    .join('');

// --------------------------------------------------------------- chessboard

/** 'c3' -> [file 2, rank 2], counted from 0. */
export function square(name) {
  return [name.charCodeAt(0) - 97, Number(name[1]) - 1];
}

export function isKnightMove(from, to) {
  const [f1, r1] = square(from);
  const [f2, r2] = square(to);
  const df = Math.abs(f1 - f2);
  const dr = Math.abs(r1 - r2);
  return (df === 1 && dr === 2) || (df === 2 && dr === 1);
}

/**
 * Lay a message along a knight's path on a chessboard and fill the other squares with decoys.
 * @param {string} message letters to hide
 * @param {string} start starting square, e.g. 'b1'
 * @param {() => number} rnd random source in [0, 1)
 * @returns {{ rows: string[], moves: string[] }} rows[0] is rank 8 (the top of a printed board)
 */
export function knightBoard(message, start, rnd) {
  const s = lettersOf(message);
  const jumps = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const used = new Set();
  const path = [];
  const name = (f, r) => String.fromCharCode(97 + f) + (r + 1);
  // Warnsdorff's rule with a random tie-break: go where there are fewest ways on. It rarely needs to back up.
  const ways = (f, r) => jumps.filter(([df, dr]) => f + df >= 0 && f + df < 8 && r + dr >= 0 && r + dr < 8 && !used.has(name(f + df, r + dr))).length;
  const walk = (f, r) => {
    used.add(name(f, r));
    path.push(name(f, r));
    if (path.length === s.length) return true;
    const next = jumps
      .map(([df, dr]) => [f + df, r + dr])
      .filter(([nf, nr]) => nf >= 0 && nf < 8 && nr >= 0 && nr < 8 && !used.has(name(nf, nr)))
      .map(([nf, nr]) => ({ nf, nr, w: ways(nf, nr) + rnd() * 0.9 }))
      .sort((a, b) => a.w - b.w);
    for (const n of next) if (walk(n.nf, n.nr)) return true;
    used.delete(name(f, r));
    path.pop();
    return false;
  };
  const [f0, r0] = square(start);
  if (!walk(f0, r0)) throw new Error('no knight path of that length from there');
  const cells = Array.from({ length: 8 }, () => new Array(8).fill(null));
  path.forEach((sq, i) => {
    const [f, r] = square(sq);
    cells[7 - r][f] = s[i];
  });
  const decoys = 'ETAOINSHRDLCUMWFGYPBVK';
  for (const row of cells) for (let f = 0; f < 8; f++) if (!row[f]) row[f] = decoys[Math.floor(rnd() * decoys.length)];
  return { rows: cells.map((row) => row.join('')), moves: path };
}

/** Read the letters a list of squares lands on. */
export function readBoard(rows, moves) {
  return moves
    .map((sq) => {
      const [f, r] = square(sq);
      return rows[7 - r][f];
    })
    .join('');
}

/** A small seeded random source, so generated puzzles come out the same every time. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What a typed answer is compared as: capitals and digits only. */
export const normalise = (text) => up(text).replace(/[^A-Z0-9]/g, '');
