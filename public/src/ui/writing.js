// Close-ups of written things: what a slate, a sign, a blotter or a ledger page
// actually looks like, drawn above the description when you examine it.
//
// A figure is described in the case data (a view's `figure`) by its surface and
// its words, never with more than the description itself says: rows the text
// does not give are drawn as scribble nobody could read.
//
//   blotter      blotting paper on a leather desk pad: words, struck through, tally marks
//   slate        a child's chalk slate on a nail
//   stone        letters carved in a wall, and something scratched under them
//   board        a painted notice board
//   card         a small card on a desk, handwritten or typed
//   certificate  a framed document with a heading, a statement and a signature
//   ledger       a ruled page: old entries as scribble, then the ones that matter
//   plate        an engraved brass plate
//   newsprint    a newspaper page: headline, a crossword, a note in the margin
//   typed        a typed sheet: a draft under a paperweight, or a page in a typewriter
//   label        a printed label: a museum card, or a box with a coloured band
//   plan         an architect's plan of the Fold, with its places renamed

import { drawFold } from './guide.js';

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

function s(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) node.setAttribute(k, String(v));
  for (const c of children.flat()) if (c) node.append(c);
  return node;
}

const HAND = "Caveat, 'Segoe Print', 'Bradley Hand', cursive";
const CAPS = "Cinzel, 'Times New Roman', Georgia, serif";
const SERIF = "Marcellus, 'Times New Roman', Georgia, serif";
const TYPED = "'Special Elite', 'Courier New', monospace";
const INK = '#1d2433';
const PENCIL = '#6a6a66';

function rng(seed) {
  let x = seed;
  return () => {
    x = (x * 16807) % 2147483647;
    return x / 2147483647;
  };
}

function text(x, y, str, { size, fill = INK, font = HAND, anchor = 'start', weight, spacing, italic, rotate, opacity, stroke, strokeWidth } = {}) {
  const t = s('text', {
    x,
    y,
    'font-size': size,
    fill,
    'font-family': font,
    'text-anchor': anchor,
    'font-weight': weight,
    'letter-spacing': spacing,
    'font-style': italic ? 'italic' : undefined,
    transform: rotate ? `rotate(${rotate} ${x} ${y})` : undefined,
    opacity,
    stroke,
    'stroke-width': strokeWidth,
    'stroke-linejoin': stroke ? 'round' : undefined,
  });
  t.textContent = str;
  return t;
}

/** Split text into lines of about `max` characters, at spaces. */
function wrap(str, max) {
  const out = [];
  let line = '';
  for (const word of String(str).split(/\s+/)) {
    if (line && (line + ' ' + word).length > max) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

/** About how wide a run of handwritten capitals is, in the drawing's units. */
const capsWidth = (str, size) => str.length * size * 0.56;

/** A grainy surface: noise laid over a colour, the same every time. */
function grain(id, { freq = 1.2, alpha = 0.5, tone = [0.2, 0.15, 0.1] } = {}) {
  return s(
    'filter',
    { id, x: 0, y: 0, width: 1, height: 1 },
    s('feTurbulence', { type: 'fractalNoise', baseFrequency: freq, numOctaves: 2, seed: 4 }),
    s('feColorMatrix', { type: 'matrix', values: `0 0 0 0 ${tone[0]}  0 0 0 0 ${tone[1]}  0 0 0 0 ${tone[2]}  0 0 0 ${alpha} -0.15` }),
  );
}

/** A line drawn by hand across a word: not quite straight, not quite level. */
function strike(x, y, w, r, { width = 0.5, color = INK } = {}) {
  const j = () => (r() - 0.5) * 0.7;
  return s('path', { d: `M${x - 0.6} ${y + j()} C ${x + w * 0.3} ${y - 0.6 + j()}, ${x + w * 0.7} ${y + 0.5 + j()}, ${x + w + 0.8} ${y + j()}`, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' });
}

/** Tally marks in fives, row after row, as someone counting would make them. */
function tally(count, x0, y0, { perRow = 6, gw = 5.6, rh = 5.2, h = 3.6, r }) {
  const g = s('g', { stroke: INK, 'stroke-width': 0.32, 'stroke-linecap': 'round', fill: 'none' });
  const groups = Math.ceil(count / 5);
  for (let i = 0; i < groups; i++) {
    const n = Math.min(5, count - i * 5);
    const gx = x0 + (i % perRow) * gw + (r() - 0.5) * 0.4;
    const gy = y0 + Math.floor(i / perRow) * rh + (r() - 0.5) * 0.3;
    for (let k = 0; k < Math.min(n, 4); k++) {
      const x = gx + k * 0.95;
      g.append(s('path', { d: `M${x + (r() - 0.5) * 0.25} ${gy} L${x + (r() - 0.5) * 0.35} ${gy + h}` }));
    }
    if (n === 5) g.append(s('path', { d: `M${gx - 0.6} ${gy + h * 0.78} L${gx + 3.6} ${gy + h * 0.18}` }));
  }
  return g;
}

/** Rows nobody could read: the shape of handwriting, without the words. */
function scribble(x, y, w, r, color = INK) {
  let d = `M${x} ${y}`;
  let cx = x;
  while (cx < x + w) {
    const step = 0.8 + r() * 1.2;
    d += ` q${step / 2} ${-1 - r() * 0.8} ${step} ${(r() - 0.5) * 0.4}`;
    cx += step;
    if (r() < 0.12) {
      cx += 1.4;
      d += ` m1.4 0`;
    }
  }
  return s('path', { d, fill: 'none', stroke: color, 'stroke-width': 0.3, opacity: 0.55, 'stroke-linecap': 'round' });
}

/** A desk under it: dark wood with a grain. */
function desk(defs, w, h) {
  const id = `wd${++uid}`;
  defs.append(grain(id, { freq: 0.9, alpha: 0.6, tone: [0.08, 0.05, 0.03] }));
  const out = [s('rect', { width: w, height: h, fill: '#3b2618' }), s('rect', { width: w, height: h, filter: `url(#${id})`, opacity: 0.8 })];
  const r = rng(11);
  for (let y = 2; y < h; y += 2.6 + r() * 2) out.push(s('path', { d: `M0 ${y} Q ${w / 2} ${y + (r() - 0.5) * 2} ${w} ${y + (r() - 0.5)}`, stroke: '#2a1a10', 'stroke-width': 0.25, fill: 'none', opacity: 0.6 }));
  return out;
}

// ------------------------------------------------------------------ surfaces

function blotter(svg, defs, f) {
  const r = rng(7);
  svg.append(...desk(defs, 100, 62));
  // The leather pad, its corners, and the blotting paper.
  svg.append(
    s('rect', { x: 4, y: 3.5, width: 92, height: 55, rx: 1.2, fill: '#26402f', stroke: '#14231a', 'stroke-width': 0.4 }),
    s('rect', { x: 8.5, y: 6.5, width: 83, height: 49, fill: '#ede3d3' }),
  );
  const id = `bl${++uid}`;
  defs.append(grain(id, { freq: 1.6, alpha: 0.35, tone: [0.35, 0.3, 0.3] }));
  svg.append(s('rect', { x: 8.5, y: 6.5, width: 83, height: 49, filter: `url(#${id})`, opacity: 0.7 }));
  // Old blots soaked into it.
  for (let i = 0; i < 14; i++) svg.append(s('ellipse', { cx: 12 + r() * 76, cy: 9 + r() * 44, rx: 0.6 + r() * 2.2, ry: 0.4 + r() * 1.2, fill: '#5d6a86', opacity: 0.08 + r() * 0.1 }));
  for (const [x, y, a] of [[4, 3.5, 0], [96, 3.5, 90], [96, 58.5, 180], [4, 58.5, 270]]) {
    svg.append(s('path', { d: 'M0 0 L9 0 L0 9 Z', fill: '#4a2e1c', stroke: '#2a180d', 'stroke-width': 0.3, transform: `translate(${x} ${y}) rotate(${a})` }));
  }
  // The words, one under another, each crossed out.
  const size = f.size ?? 5.2;
  (f.words ?? []).forEach((w, i) => {
    const x = 15 + (r() - 0.5) * 1.2;
    const y = 15.5 + i * 6.6;
    const heavy = (f.heavy ?? []).includes(i);
    svg.append(text(x, y, w, { size, weight: heavy ? 700 : 500, spacing: 0.3, stroke: heavy ? INK : undefined, strokeWidth: heavy ? 0.35 : undefined, rotate: (r() - 0.5) * 2 }));
    const width = capsWidth(w, size);
    svg.append(strike(x, y - size * 0.32, width, r, { width: heavy ? 0.9 : 0.5 }));
    // Pressed so hard the nib went through: a slit in the paper along the line.
    if (heavy && f.tear) {
      svg.append(s('path', { d: `M${x + width * 0.15} ${y - size * 0.3} l${width * 0.2} 0.35 l${width * 0.2} -0.4 l${width * 0.25} 0.3`, fill: 'none', stroke: '#16100c', 'stroke-width': 0.55, 'stroke-linecap': 'round' }));
    }
  });
  if (f.tally) svg.append(tally(f.tally, 52, 11, { perRow: 6, gw: 6.4, rh: 5.6, r }));
}

function slate(svg, defs, f) {
  // The nail, the string and the frame.
  svg.append(s('rect', { width: 100, height: 62, fill: '#8f8678' }));
  const wall = `sw${++uid}`;
  defs.append(grain(wall, { freq: 0.7, alpha: 0.55, tone: [0.25, 0.22, 0.2] }));
  svg.append(s('rect', { width: 100, height: 62, filter: `url(#${wall})` }));
  svg.append(
    s('path', { d: 'M50 2.6 L16 9 M50 2.6 L84 9', stroke: '#c9b48a', 'stroke-width': 0.35, fill: 'none' }),
    s('circle', { cx: 50, cy: 2.6, r: 0.9, fill: '#3a3632' }),
    s('rect', { x: 12, y: 8, width: 76, height: 50, rx: 1.4, fill: '#9a6b3f', stroke: '#5e3d20', 'stroke-width': 0.4 }),
    s('rect', { x: 15.5, y: 11.5, width: 69, height: 43, fill: '#2d3236' }),
  );
  const id = `sl${++uid}`;
  defs.append(grain(id, { freq: 1.1, alpha: 0.45, tone: [0.75, 0.75, 0.75] }));
  svg.append(s('rect', { x: 15.5, y: 11.5, width: 69, height: 43, filter: `url(#${id})`, opacity: 0.35 }));
  // Old chalk, rubbed out.
  for (const [cx, cy, rx] of [[32, 24, 10], [66, 42, 12], [48, 30, 16]]) svg.append(s('ellipse', { cx, cy, rx, ry: rx * 0.35, fill: '#ffffff', opacity: 0.05 }));
  // Chalk: pale, a little broken.
  const chalk = `ch${++uid}`;
  defs.append(
    s(
      'filter',
      { id: chalk },
      s('feTurbulence', { type: 'fractalNoise', baseFrequency: 3, numOctaves: 1, seed: 9, result: 'n' }),
      s('feColorMatrix', { in: 'n', type: 'matrix', values: '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.6 1.25', result: 'm' }),
      s('feComposite', { in: 'SourceGraphic', in2: 'm', operator: 'in' }),
    ),
  );
  if (f.chess) {
    const g = s('g', { opacity: 0.07 });
    for (let i = 0; i < 64; i++) if ((i + Math.floor(i / 8)) % 2) g.append(s('rect', { x: 22 + (i % 8) * 7, y: 12.5 + Math.floor(i / 8) * 5.2, width: 7, height: 5.2, fill: '#ffffff' }));
    svg.append(g);
  }
  if (f.main) {
    svg.append(text(50, 35.5, f.main, { size: 15, fill: '#eeece6', anchor: 'middle', spacing: 2.4, weight: 600 }));
    svg.lastChild.setAttribute('filter', `url(#${chalk})`);
  }
  (f.lines ?? []).forEach((line, i, all) => {
    const t = text(50, 33 - ((all.length - 1) * 8) / 2 + i * 8, line, { size: 6.2, fill: '#eeece6', anchor: 'middle', weight: 600, spacing: 0.3 });
    t.setAttribute('filter', `url(#${chalk})`);
    svg.append(t);
  });
  if (f.note) {
    const n = text(54, 47.5, f.note, { size: 4.6, fill: '#e2dfd8', anchor: 'middle', rotate: -4, opacity: 0.9 });
    n.setAttribute('filter', `url(#${chalk})`);
    svg.append(n);
  }
}

function stone(svg, defs, f) {
  svg.append(s('rect', { width: 100, height: 62, fill: '#8b877f' }));
  const id = `st${++uid}`;
  defs.append(grain(id, { freq: 0.55, alpha: 0.7, tone: [0.22, 0.21, 0.19] }));
  svg.append(s('rect', { width: 100, height: 62, filter: `url(#${id})` }));
  // Courses of stone.
  const r = rng(5);
  for (let y = 0; y < 62; y += 12.4) {
    svg.append(s('path', { d: `M0 ${y} L100 ${y}`, stroke: '#5f5b54', 'stroke-width': 0.5 }));
    const off = (y / 12.4) % 2 ? 0 : 14;
    for (let x = off; x < 100; x += 28 + r() * 6) svg.append(s('path', { d: `M${x} ${y} L${x} ${y + 12.4}`, stroke: '#5f5b54', 'stroke-width': 0.5 }));
  }
  // The carved band, smoothed for the letters.
  svg.append(s('rect', { x: 8, y: 13, width: 84, height: 24, fill: '#a29d93', stroke: '#6d6960', 'stroke-width': 0.4 }));
  (f.lines ?? []).forEach((line, i) => {
    const y = 23 + i * 9;
    // Cut letters: a pale lower edge where the light catches the cut, and the dark of the cut itself.
    svg.append(text(50, y + 0.4, line, { size: 6, fill: '#cfc9bd', font: CAPS, weight: 700, anchor: 'middle', spacing: 0.5 }), text(50, y, line, { size: 6, fill: '#3f3b35', font: CAPS, weight: 700, anchor: 'middle', spacing: 0.5 }));
  });
  if (f.scratch) svg.append(text(56, 47.5, f.scratch, { size: 4.4, fill: 'none', stroke: '#e6e1d6', strokeWidth: 0.22, anchor: 'middle', rotate: -2 }));
}

function board(svg, defs, f) {
  svg.append(s('rect', { width: 100, height: 62, fill: '#7d766c' }));
  const wall = `bw${++uid}`;
  defs.append(grain(wall, { freq: 0.6, alpha: 0.6, tone: [0.24, 0.22, 0.2] }));
  svg.append(s('rect', { width: 100, height: 62, filter: `url(#${wall})` }));
  svg.append(s('rect', { x: 7, y: 9, width: 86, height: 44, rx: 0.8, fill: f.color ?? '#2f3a2c', stroke: '#1a2118', 'stroke-width': 0.6 }));
  for (let y = 9 + 11; y < 53; y += 11) svg.append(s('path', { d: `M7 ${y} L93 ${y}`, stroke: '#1d251b', 'stroke-width': 0.35 }));
  const id = `bp${++uid}`;
  defs.append(grain(id, { freq: 1.4, alpha: 0.5, tone: [0.1, 0.12, 0.09] }));
  svg.append(s('rect', { x: 7, y: 9, width: 86, height: 44, filter: `url(#${id})`, opacity: 0.6 }));
  for (const [x, y] of [[10, 12], [90, 12], [10, 50], [90, 50]]) svg.append(s('circle', { cx: x, cy: y, r: 0.7, fill: '#9a8f7a' }));
  const lines = f.lines ?? [];
  const top = 31 - ((lines.length - 1) * 9) / 2;
  lines.forEach((line, i) => svg.append(text(50, top + i * 9 + 2, line, { size: i === 0 ? 7 : 5.2, fill: '#efe6cf', font: CAPS, weight: 700, anchor: 'middle', spacing: 0.6, opacity: 0.94 })));
}

function card(svg, defs, f) {
  svg.append(...desk(defs, 100, 62));
  const typed = f.hand === 'type';
  const caps = (f.text.match(/[A-Z]/g) ?? []).length > f.text.length * 0.5;
  const lines = wrap(f.text, typed ? 30 : caps ? 22 : 32);
  const h = Math.max(20, 12 + lines.length * (typed ? 5.2 : 6) + (f.sign ? 6 : 0));
  const y0 = 31 - h / 2;
  const g = s('g', { transform: `rotate(${f.tilt ?? -2} 50 31)` });
  g.append(
    s('rect', { x: 19.5, y: y0 + 1.2, width: 63, height: h, fill: '#000', opacity: 0.35 }),
    s('rect', { x: 18, y: y0, width: 63, height: h, fill: '#f5efe2', stroke: '#c9bea6', 'stroke-width': 0.25 }),
  );
  const ink = f.ink ?? INK;
  lines.forEach((line, i) => g.append(text(49.5, y0 + 10 + i * (typed ? 5.2 : 6), line, { size: typed ? 3.9 : 5, font: typed ? TYPED : HAND, anchor: 'middle', fill: typed ? '#2a2a2a' : ink, weight: f.heavy ? 700 : undefined, stroke: f.heavy ? ink : undefined, strokeWidth: f.heavy ? 0.25 : undefined, rotate: f.shaky ? 1.2 : undefined })));
  if (f.sign) g.append(text(74, y0 + h - 4.5, f.sign, { size: 4.6, anchor: 'end', fill: ink }));
  if (f.seal) g.append(s('circle', { cx: 49.5, cy: y0 + h - 1, r: 3.4, fill: '#8e2a22' }), s('circle', { cx: 49.5, cy: y0 + h - 1, r: 2.3, fill: 'none', stroke: '#b9483a', 'stroke-width': 0.3 }));
  svg.append(g);
}

function certificate(svg, defs, f) {
  svg.append(s('rect', { width: 100, height: 62, fill: '#3b3f3a' }));
  svg.append(
    s('rect', { x: 9, y: 1.5, width: 82, height: 59, fill: '#1f1510', stroke: '#0f0a07', 'stroke-width': 0.4 }),
    s('rect', { x: 11.5, y: 4, width: 77, height: 54, fill: '#f2e9d5' }),
    s('rect', { x: 13, y: 5.5, width: 74, height: 51, fill: 'none', stroke: '#a88a4c', 'stroke-width': 0.35 }),
  );
  let y = 11.5;
  for (const [i, h] of (f.head ?? []).entries()) {
    svg.append(text(50, y, h, { size: i ? 2.6 : 3.4, font: CAPS, weight: 700, anchor: 'middle', fill: '#2a2018', spacing: 0.25 }));
    y += i ? 4.4 : 4.6;
  }
  y += 1.4;
  for (const line of wrap(f.body ?? '', 56)) {
    svg.append(text(50, y, line, { size: 2.05, font: SERIF, anchor: 'middle', fill: '#2c241c' }));
    y += 3;
  }
  if (f.foot) svg.append(text(50, y + 2.2, f.foot, { size: 1.9, font: SERIF, italic: true, anchor: 'middle', fill: '#4a3c2c' }));
  if (f.sign) svg.append(text(70, 53, f.sign, { size: 4.2, anchor: 'middle' }), s('path', { d: 'M58 54.2 L82 54.2', stroke: '#6b5a44', 'stroke-width': 0.2 }));
  svg.append(s('circle', { cx: 25, cy: 51, r: 3.2, fill: '#8e2a22' }), s('circle', { cx: 25, cy: 51, r: 2.2, fill: 'none', stroke: '#b9483a', 'stroke-width': 0.3 }));
}

function ledger(svg, defs, f) {
  svg.append(...desk(defs, 100, 62));
  const r = rng(f.seed ?? 3);
  svg.append(
    s('rect', { x: 7.5, y: 3.5, width: 87, height: 57, fill: '#000', opacity: 0.3 }),
    s('rect', { x: 6, y: 2, width: 87, height: 57, fill: '#efe6cf', stroke: '#b8a882', 'stroke-width': 0.3 }),
  );
  const id = `lg${++uid}`;
  defs.append(grain(id, { freq: 1.5, alpha: 0.3, tone: [0.3, 0.25, 0.15] }));
  svg.append(s('rect', { x: 6, y: 2, width: 87, height: 57, filter: `url(#${id})`, opacity: 0.6 }));
  // Ruled lines and the red margin.
  const rule = f.rule ?? 5.4;
  for (let y = 8; y < 58; y += rule) svg.append(s('path', { d: `M6 ${y} L93 ${y}`, stroke: '#9fb3c8', 'stroke-width': 0.18 }));
  svg.append(s('path', { d: 'M17 2 L17 59', stroke: '#c0645c', 'stroke-width': 0.3 }));
  if (f.money) svg.append(s('path', { d: 'M76 2 L76 59 M78 2 L78 59', stroke: '#c0645c', 'stroke-width': 0.22 }));
  let row = 0;
  // A heading takes the first line; everything else starts under it.
  const top = f.title || f.col ? 1 : 0;
  const yOf = (i) => 8 + (i + top) * rule - 1.1;
  for (let i = 0; i < (f.faint ?? 0); i++) {
    svg.append(scribble(19, yOf(row), f.col ? 18 + r() * 20 : 30 + r() * 28, r));
    if (f.money) svg.append(scribble(79, yOf(row), 8 + r() * 4, r));
    row++;
  }
  if (f.title) svg.append(text(19, 7.2, f.title, { size: 3.8, fill: '#2b2219', weight: 700 }));
  if (f.col) {
    svg.append(text(f.col.x ?? 64, 7.2, f.col.head, { size: 3.4, fill: '#2b2219', weight: 700 }));
    svg.append(s('path', { d: `M${(f.col.x ?? 64) - 2} 2 L${(f.col.x ?? 64) - 2} 59`, stroke: '#9fb3c8', 'stroke-width': 0.25 }));
    for (let i = 0; i < (f.faint ?? 0); i++) svg.append(text((f.col.x ?? 64) + (i ? 6 : 0), yOf(i), i ? (f.col.fill ?? '"') : f.col.first, { size: i ? 4.6 : 3.6, fill: '#2b2219' }));
  }
  if (f.faint && f.gap) row += f.gap;
  const size = f.size ?? 4.4;
  for (const e of f.entries ?? []) {
    const entry = typeof e === 'string' ? { t: e } : e;
    svg.append(text(entry.indent ? 22 : 19, yOf(row), entry.t, { size, fill: entry.pencil ? PENCIL : '#2b2219', weight: entry.pencil ? 400 : 500, opacity: entry.pencil ? 0.95 : 1 }));
    row++;
  }
}

function plate(svg, defs, f) {
  svg.append(s('rect', { width: 100, height: 62, fill: '#2b2622' }));
  const id = `pl${++uid}`;
  defs.append(
    s('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, s('stop', { offset: '0%', 'stop-color': '#e2bd6a' }), s('stop', { offset: '45%', 'stop-color': '#b88a3a' }), s('stop', { offset: '100%', 'stop-color': '#8a6224' })),
  );
  const lines = f.lines ?? [];
  const h = 14 + lines.length * 8;
  const y0 = 31 - h / 2;
  svg.append(s('rect', { x: 14, y: y0, width: 72, height: h, rx: 1.5, fill: `url(#${id})`, stroke: '#5c4016', 'stroke-width': 0.5 }));
  for (const [x, y] of [[17.5, y0 + 3.5], [82.5, y0 + 3.5], [17.5, y0 + h - 3.5], [82.5, y0 + h - 3.5]]) svg.append(s('circle', { cx: x, cy: y, r: 1.1, fill: '#7a5a22' }), s('path', { d: `M${x - 0.8} ${y} L${x + 0.8} ${y}`, stroke: '#4a3412', 'stroke-width': 0.3 }));
  lines.forEach((line, i) => {
    const y = y0 + 12 + i * 8;
    const size = Math.min(5.4, 64 / (line.length * 0.78));
    svg.append(text(50, y + 0.35, line, { size, font: CAPS, weight: 700, anchor: 'middle', fill: '#f4dc9c', spacing: 0.4 }), text(50, y, line, { size, font: CAPS, weight: 700, anchor: 'middle', fill: '#4a3311', spacing: 0.4 }));
  });
}

function newsprint(svg, defs, f) {
  svg.append(s('rect', { width: 100, height: 62, fill: '#5a4a3a' }));
  const g = s('g', { transform: 'rotate(-1.5 50 31)' });
  g.append(s('rect', { x: 10, y: 2, width: 80, height: 58, fill: '#e9e4d6' }));
  const id = `np${++uid}`;
  defs.append(grain(id, { freq: 1.6, alpha: 0.3, tone: [0.3, 0.3, 0.28] }));
  g.append(s('rect', { x: 10, y: 2, width: 80, height: 58, filter: `url(#${id})`, opacity: 0.6 }));
  g.append(text(50, 8.5, f.masthead ?? 'THE CRUX', { size: 4.2, font: CAPS, weight: 700, anchor: 'middle', fill: '#1a1a1a', spacing: 0.8 }));
  g.append(s('path', { d: 'M13 10.5 L87 10.5 M13 11.3 L87 11.3', stroke: '#1a1a1a', 'stroke-width': 0.2 }));
  let y = 16.5;
  for (const line of wrap(f.headline ?? '', 34)) {
    g.append(text(50, y, line, { size: 3.6, font: SERIF, weight: 700, anchor: 'middle', fill: '#111' }));
    y += 4.4;
  }
  if (f.sub) {
    for (const line of wrap(f.sub, 52)) {
      g.append(text(50, y, line, { size: 2.2, font: SERIF, italic: true, anchor: 'middle', fill: '#333' }));
      y += 3;
    }
  }
  const r = rng(13);
  if (f.crossword) {
    // A grid, mostly filled in; the words in it are not shown.
    const x0 = 14;
    const y0 = y + 1;
    const cell = 3;
    for (let i = 0; i < 11; i++) {
      for (let j = 0; j < 9; j++) {
        const black = (i * 7 + j * 3) % 5 === 0;
        g.append(s('rect', { x: x0 + i * cell, y: y0 + j * cell, width: cell, height: cell, fill: black ? '#1a1a1a' : '#f4f0e6', stroke: '#1a1a1a', 'stroke-width': 0.12 }));
      }
    }
    let cy = y0 + 2;
    for (const line of wrap(f.clue ?? '', 30)) {
      g.append(text(50, cy, line, { size: 2.3, font: SERIF, fill: '#1a1a1a' }));
      cy += 3.1;
    }
    if (f.answer) g.append(text(52, cy + 2.6, f.answer, { size: 4.2, fill: PENCIL, spacing: 0.4 }));
    if (f.by) g.append(text(50, y0 + 9 * cell + 3.5, f.by, { size: 2.1, font: SERIF, italic: true, fill: '#333' }));
    y = y0 + 9 * cell + 6;
  } else {
    // Columns of print: the words are not given, so none are shown.
    for (let c = 0; c < 3; c++) {
      for (let ly = y + 1; ly < 50; ly += 2.2) g.append(s('path', { d: `M${14 + c * 24.5} ${ly} L${14 + c * 24.5 + 20 - (r() < 0.15 ? 8 : 0)} ${ly}`, stroke: '#8a877e', 'stroke-width': 0.9 }));
    }
  }
  for (const [i, line] of (f.foot ?? []).entries()) g.append(text(50, 53 + i * 3.2, line, { size: i ? 1.8 : 2.3, font: SERIF, anchor: 'middle', fill: '#222' }));
  if (f.ring) g.append(s('circle', { cx: 74, cy: 40, r: 8, fill: 'none', stroke: '#8b5a2b', 'stroke-width': 0.9, opacity: 0.35 }));
  if (f.note) {
    const n = f.note;
    const nx = n.x ?? 60;
    const ny = n.y ?? 26;
    g.append(text(nx, ny, n.t, { size: n.size ?? 4.2, fill: n.ink ?? '#1f3f8f', rotate: n.rotate ?? -4 }));
    for (let k = 0; k < (n.under ?? 0); k++) g.append(s('path', { d: `M${nx - 0.5} ${ny + 1.4 + k * 1.1} l${capsWidth(n.t, (n.size ?? 4.2) * 0.62)} -1.5`, stroke: n.ink ?? '#1f3f8f', 'stroke-width': 0.35, fill: 'none' }));
  }
  if (f.scrawl) g.append(text(50, 45, f.scrawl, { size: 16, fill: PENCIL, anchor: 'middle', rotate: -14, opacity: 0.85, weight: 700, spacing: 1 }));
  svg.append(g);
}

function typed(svg, defs, f) {
  svg.append(...desk(defs, 100, 62));
  if (f.roller) {
    // The page coming up out of the machine, the roller across it, the keys below.
    svg.append(
      s('rect', { x: 20, y: 0, width: 60, height: 40, fill: '#f4f1e8' }),
      s('rect', { x: 8, y: 38, width: 84, height: 5, rx: 2.5, fill: '#2b2b2b' }),
      s('circle', { cx: 8, cy: 40.5, r: 3, fill: '#3a3a3a' }),
      s('circle', { cx: 92, cy: 40.5, r: 3, fill: '#3a3a3a' }),
      s('path', { d: 'M4 62 L12 44 L88 44 L96 62 Z', fill: '#1d1f22' }),
    );
    for (let row = 0; row < 3; row++) for (let k = 0; k < 10 - row; k++) svg.append(s('circle', { cx: 24 + row * 2.6 + k * 5.6, cy: 49 + row * 4.4, r: 1.6, fill: '#e9e4d6', stroke: '#777', 'stroke-width': 0.2 }));
    const lines = [].concat(f.body ?? []).flatMap((para) => wrap(para, 34));
    lines.forEach((line, i) => svg.append(text(24, 35.5 - (lines.length - 1 - i) * 4.2, line, { size: 2.9, font: TYPED, fill: '#202020' })));
    return;
  } else {
    svg.append(s('rect', { x: 15.5, y: 3.5, width: 70, height: 56, fill: '#000', opacity: 0.3 }), s('rect', { x: 14, y: 2, width: 70, height: 56, fill: '#f6f3ea' }));
  }
  let y = 10;
  if (f.title) {
    svg.append(text(49, y, f.title, { size: 3.3, font: TYPED, anchor: 'middle', fill: '#151515', weight: 700 }));
    y += 6;
  }
  for (const para of [].concat(f.body ?? [])) {
    for (const line of wrap(para, f.roller ? 38 : 40)) {
      svg.append(text(18, y, line, { size: 2.9, font: TYPED, fill: '#202020' }));
      y += 4.2;
    }
    y += 1.6;
  }
  if (f.weight) svg.append(s('ellipse', { cx: 64, cy: 44, rx: 9, ry: 9, fill: '#dfe8ea', opacity: 0.35, stroke: '#ffffff', 'stroke-width': 0.4 }), s('ellipse', { cx: 61, cy: 41, rx: 3, ry: 2, fill: '#ffffff', opacity: 0.5 }));
}

function label(svg, defs, f) {
  svg.append(s('rect', { width: 100, height: 62, fill: f.box ? '#3a4247' : '#26201c' }));
  const lines = f.lines ?? [];
  const w = f.box ? 64 : 70;
  const h = Math.max(24, 14 + lines.length * 6.4);
  const x0 = 50 - w / 2;
  const y0 = 31 - h / 2;
  svg.append(s('rect', { x: x0 + 1.4, y: y0 + 1.4, width: w, height: h, fill: '#000', opacity: 0.35 }), s('rect', { x: x0, y: y0, width: w, height: h, fill: f.box ? '#f4f4f1' : '#f1ece0' }));
  if (f.band) svg.append(s('rect', { x: x0, y: y0 + h - 7, width: w, height: 4.5, fill: f.band }));
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(f.box ? 4.6 : 3.4, (w - 8) / (longest * (f.box ? 0.7 : 0.5)));
  lines.forEach((line, i) => {
    const quoted = f.quote || (line.startsWith("'") && line.endsWith("'"));
    svg.append(text(50, y0 + 9 + i * 6.4, line, { size, font: f.box ? CAPS : SERIF, weight: f.box ? 700 : undefined, italic: !f.box && quoted, anchor: 'middle', fill: '#1d1d1d' }));
  });
}

/** An architect's plan: the map of the Fold, its places given new names, one crossed out in red. */
function plan(svg, defs, f) {
  const base = drawFold({ names: false, cartouche: false });
  // The map's own drawing, then the architect's labels over it.
  for (const child of [...base.childNodes]) svg.append(child);
  svg.setAttribute('viewBox', '0 0 100 70');
  svg.append(s('rect', { x: 24, y: 1.6, width: 52, height: 6.4, fill: '#f1ece0', stroke: '#1f3f8f', 'stroke-width': 0.3 }), text(50, 6.1, f.title ?? '', { size: 2.8, font: CAPS, weight: 700, anchor: 'middle', fill: '#1f3f8f', spacing: 0.3 }));
  for (const l of f.labels ?? []) {
    svg.append(s('circle', { cx: l.at[0], cy: l.at[1], r: 0.9, fill: '#1f3f8f' }));
    const t = text(l.at[0] + (l.dx ?? 2), l.at[1] + (l.dy ?? 0.9), l.t, { size: 2.3, fill: '#1f3f8f', anchor: l.anchor ?? 'start', weight: 600 });
    t.setAttribute('paint-order', 'stroke');
    t.setAttribute('stroke', '#f4ecd8');
    t.setAttribute('stroke-width', '0.8');
    svg.append(t);
    if (l.struck) svg.append(s('path', { d: `M${l.at[0] - 3} ${l.at[1] - 3} L${l.at[0] + 3} ${l.at[1] + 3} M${l.at[0] + 3} ${l.at[1] - 3} L${l.at[0] - 3} ${l.at[1] + 3}`, stroke: '#c0392b', 'stroke-width': 0.6 }));
  }
}

const SURFACES = { blotter, slate, stone, board, card, certificate, ledger, plate, newsprint, typed, label, plan };
export const WRITING_KINDS = Object.keys(SURFACES);

/**
 * Draw a written thing.
 * @param {{ kind: string, alt?: string }} figure as given in the case data
 * @returns {SVGSVGElement|null}
 */
export function drawWriting(figure) {
  const draw = SURFACES[figure?.kind];
  if (!draw) return null;
  const svg = s('svg', { viewBox: '0 0 100 62', role: 'img', 'aria-label': figure.alt ?? 'A close-up' });
  const defs = s('defs');
  svg.append(defs);
  draw(svg, defs, figure);
  return svg;
}
