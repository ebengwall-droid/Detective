// A picture guide to where the game happens: the city of Ravel, why no
// printed map shows the Fold, and the Fold itself, close up. Drawn as an old
// printed map, because the Fold's own people are the city's map-makers.
//
// It shows only what the detective knows on the first morning. Nothing here
// gives away the case: places that matter later are left for the player to find.

import { el } from './dom.js';

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

/** An SVG element with attributes and children. */
function s(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) node.setAttribute(k, String(v));
  for (const c of children.flat()) if (c) node.append(c);
  return node;
}

// Printer's colours: brown ink on cream paper, water in a pale wash, red for what matters.
const INK = '#3a2a1c';
const PAPER = '#ece2c9';
const PAPER_EDGE = '#d3bf98';
const ISLAND = '#f4ecd8';
const BLOCK = '#cdb68e';
const WATER = '#a7c0c5';
const WATER_INK = '#4f7280';
const GREEN = '#8f9b6c';
const RED = '#9a3a2a';
const SERIF = "Marcellus, 'Times New Roman', Georgia, serif";
const CAPS = "Cinzel, 'Times New Roman', Georgia, serif";

/** A small, repeatable random sequence, so the drawing is the same every time. */
function rng(seed) {
  let x = seed;
  return () => {
    x = (x * 16807) % 2147483647;
    return x / 2147483647;
  };
}

function label(x, y, str, { size = 2.6, fill = INK, anchor = 'start', font = SERIF, weight, spacing = 0, italic = false, rotate = 0, halo = true, opacity } = {}) {
  const t = s('text', {
    x,
    y,
    'font-size': size,
    fill,
    'text-anchor': anchor,
    'font-family': font,
    'font-weight': weight,
    'letter-spacing': spacing || undefined,
    'font-style': italic ? 'italic' : undefined,
    transform: rotate ? `rotate(${rotate} ${x} ${y})` : undefined,
    opacity,
    // A paper-coloured edge keeps the words readable over lines and water.
    ...(halo ? { 'paint-order': 'stroke', stroke: PAPER, 'stroke-width': size * 0.32, 'stroke-linejoin': 'round' } : {}),
  });
  t.textContent = str;
  return t;
}

/** The sheet: cream paper, darker towards its edges, with a little grain. */
function paper(w, h) {
  const id = `gp${++uid}`;
  return [
    s(
      'defs',
      {},
      s('radialGradient', { id: `${id}a`, cx: '50%', cy: '46%', r: '72%' }, s('stop', { offset: '58%', 'stop-color': PAPER }), s('stop', { offset: '100%', 'stop-color': PAPER_EDGE })),
      s(
        'filter',
        { id: `${id}b`, x: 0, y: 0, width: 1, height: 1 },
        s('feTurbulence', { type: 'fractalNoise', baseFrequency: 1.4, numOctaves: 2, seed: 7 }),
        s('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.24  0 0 0 0 0.17  0 0 0 0 0.1  0 0 0 0.55 -0.2' }),
      ),
    ),
    s('rect', { width: w, height: h, fill: `url(#${id}a)` }),
    s('rect', { width: w, height: h, filter: `url(#${id}b)`, opacity: 0.6 }),
  ];
}

/** A water course: a dark bank under a pale wash, so the water reads at a glance. */
function water(d, width, { cap = 'round' } = {}) {
  return [
    s('path', { d, fill: 'none', stroke: WATER_INK, 'stroke-width': width + 0.7, 'stroke-linecap': cap, 'stroke-linejoin': 'round' }),
    s('path', { d, fill: 'none', stroke: WATER, 'stroke-width': width, 'stroke-linecap': cap, 'stroke-linejoin': 'round' }),
  ];
}

/** Ripples drawn on water, as engravers did. */
function ripples(points, r) {
  return points.map(([x, y]) => s('path', { d: `M${x - r} ${y} q${r / 2} ${-r / 3} ${r} 0 t${r} 0`, fill: 'none', stroke: WATER_INK, 'stroke-width': 0.22, opacity: 0.7 }));
}

function compass(x, y, r) {
  const g = s('g', { transform: `translate(${x} ${y})` });
  g.append(s('circle', { r, fill: 'none', stroke: INK, 'stroke-width': 0.2 }), s('circle', { r: r * 0.82, fill: 'none', stroke: INK, 'stroke-width': 0.12 }));
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const len = i % 2 ? r * 0.62 : r * 1.12;
    const w = i % 2 ? r * 0.1 : r * 0.17;
    const tip = [Math.sin(a) * len, -Math.cos(a) * len];
    const side = [Math.cos(a) * w, Math.sin(a) * w];
    g.append(s('path', { d: `M${side[0]} ${side[1]} L${tip[0]} ${tip[1]} L${-side[0]} ${-side[1]} Z`, fill: i === 0 ? RED : i % 2 ? PAPER : INK, stroke: INK, 'stroke-width': 0.1 }));
  }
  g.append(label(0, -r * 1.3, 'N', { size: r * 0.62, anchor: 'middle', font: CAPS, weight: 700 }));
  return g;
}

/** A numbered marker for a place listed under the picture. */
function marker(x, y, n) {
  return s(
    'g',
    { transform: `translate(${x} ${y})` },
    s('circle', { r: 2.3, fill: RED, stroke: PAPER, 'stroke-width': 0.45 }),
    s('text', { y: 0.95, 'font-size': 2.7, 'text-anchor': 'middle', fill: '#fff8ea', 'font-family': CAPS, 'font-weight': 700 }, String(n)),
  );
}

// ------------------------------------------------------------------ Ravel

// The river runs west to east through the city. The Cut, a canal, leaves it and joins it
// again; the island between the two is the Fold.
const RIVER = 'M-3 21 C 14 17, 28 19, 40 26 C 47 30, 55 34, 64 35.5 C 76 37, 88 30, 103 33';
const CUT = 'M40 26 C 40 45, 56 51, 64 35.5';
const FOLD_ISLE = 'M40 26 C 47 30, 55 34, 64 35.5 C 56 51, 40 45, 40 26 Z';

/** Streets and houses of a city, drawn as blocks with roads between them. */
function cityBlocks(r, { x0 = 1, x1 = 99, y0 = 1, y1 = 69, skip = () => false } = {}) {
  const blocks = [];
  for (let y = y0; y < y1; y += 4.3) {
    for (let x = x0; x < x1; x += 5.1) {
      const w = 3.3 + r() * 1.2;
      const h = 2.6 + r() * 0.8;
      const bx = x + r() * 0.7;
      const by = y + r() * 0.6;
      if (skip(bx + w / 2, by + h / 2)) continue;
      blocks.push(s('rect', { x: bx, y: by, width: w, height: h, fill: BLOCK, stroke: INK, 'stroke-width': 0.14, opacity: 0.85 }));
    }
  }
  return blocks;
}

/** The city of Ravel, with the Fold marked in red. */
export function drawRavel() {
  const r = rng(41);
  const svg = s('svg', { viewBox: '0 0 100 70', role: 'img', 'aria-label': 'Map of Ravel. The river runs through the city. A canal called the Cut leaves the river and joins it again, and the island between them is the Fold.' });
  svg.append(...paper(100, 70));
  // Houses everywhere but the cathedral close and the infirmary grounds.
  const open = (x, y) => (x > 37 && x < 57 && y > 2 && y < 17) || (x > 76 && x < 94 && y > 9 && y < 24) || (x < 37 && y < 13);
  svg.append(...cityBlocks(r, { skip: open }));
  // Main roads, cut through the houses, meeting at the cathedral.
  for (const d of ['M47 10 L4 70', 'M47 10 L100 4', 'M47 10 L-2 26', 'M47 10 L82 70', 'M85 17 L100 64', 'M47 10 L36 0', 'M0 55 L100 61']) {
    svg.append(s('path', { d, fill: 'none', stroke: PAPER, 'stroke-width': 1.3 }));
  }
  // The cathedral, on its green.
  svg.append(
    s('rect', { x: 38.5, y: 3.5, width: 17, height: 12, rx: 1, fill: '#dfe0bf', stroke: INK, 'stroke-width': 0.15, opacity: 0.9 }),
    s('path', { d: 'M40.5 8.4 h12 v2.8 h-12 Z M45.1 5.4 h2.8 v8.8 h-2.8 Z', fill: INK, opacity: 0.85 }),
    s('circle', { cx: 52, cy: 9.8, r: 1, fill: INK }),
  );
  // The infirmary.
  svg.append(
    s('rect', { x: 78, y: 11, width: 14, height: 11, rx: 0.6, fill: '#dfe0bf', stroke: INK, 'stroke-width': 0.15, opacity: 0.9 }),
    s('path', { d: 'M80 13 h10 v2 h-10 Z M80 18 h10 v2 h-10 Z M84 13 h2 v7 h-2 Z', fill: INK, opacity: 0.8 }),
  );
  // Water over the city, then the island.
  svg.append(...water(RIVER, 4.6), ...water(CUT, 2.6));
  svg.append(s('path', { d: FOLD_ISLE, fill: ISLAND, stroke: 'none' }));
  // Its lanes, faintly: they are there, but no printed map shows them.
  for (const d of ['M51 33 L50.4 38', 'M43.4 32 L50.4 38', 'M50.4 38 L58.5 37.6', 'M50.4 38 L47.2 44', 'M50.4 38 L56 44']) {
    svg.append(s('path', { d, fill: 'none', stroke: INK, 'stroke-width': 0.25, opacity: 0.55 }));
  }
  svg.append(s('path', { d: FOLD_ISLE, fill: 'none', stroke: RED, 'stroke-width': 0.6, 'stroke-dasharray': '1.2 0.8' }));
  // Bridges: two on the river, and the one into the Fold, at its gate.
  for (const [x, y, a] of [
    [21, 19.2, 0],
    [79, 34.2, 0],
    [51.2, 31.7, 23],
  ]) {
    svg.append(s('rect', { x: x - 0.8, y: y - 3.4, width: 1.6, height: 6.8, fill: PAPER, stroke: INK, 'stroke-width': 0.18, transform: `rotate(${a} ${x} ${y})` }));
  }
  svg.append(...ripples([[10, 18.4], [70, 36.4], [92, 31.6]], 1.4));
  // Words.
  svg.append(
    s('rect', { x: 2.5, y: 2.5, width: 32, height: 9.5, fill: PAPER, stroke: INK, 'stroke-width': 0.3 }),
    s('rect', { x: 3.2, y: 3.2, width: 30.6, height: 8.1, fill: 'none', stroke: INK, 'stroke-width': 0.12 }),
    label(18.5, 8, 'RAVEL', { size: 4.2, anchor: 'middle', font: CAPS, weight: 700, spacing: 1.2, halo: false }),
    label(18.5, 10.6, 'a cathedral city in the west of England', { size: 1.55, anchor: 'middle', italic: true, halo: false }),
    label(47, 19, 'Cathedral', { size: 2.2, anchor: 'middle' }),
    label(85, 25.4, 'Ravel Infirmary', { size: 2.2, anchor: 'middle' }),
    label(85, 28, 'the mortuary is here', { size: 1.6, anchor: 'middle', italic: true }),
    label(8, 15.2, 'the river', { size: 2.3, fill: WATER_INK, italic: true, rotate: -9 }),
    label(41, 51.5, 'the Cut, a canal', { size: 2.1, fill: WATER_INK, italic: true }),
  );
  // The Fold, called out.
  svg.append(
    s('path', { d: 'M58.5 40.5 Q 62 46 65.5 47.2', fill: 'none', stroke: RED, 'stroke-width': 0.35 }),
    s('circle', { cx: 58.5, cy: 40.5, r: 0.6, fill: RED }),
    label(66, 48.4, 'THE FOLD', { size: 3.6, fill: RED, font: CAPS, weight: 700, spacing: 0.5 }),
    label(66, 51.3, 'the island between', { size: 1.85, fill: RED, italic: true }),
    label(66, 53.6, 'the river and the Cut', { size: 1.85, fill: RED, italic: true }),
  );
  // Everything else.
  svg.append(
    label(6, 63, 'THE FLAT', { size: 4.4, font: CAPS, weight: 700, spacing: 1, opacity: 0.8 }),
    label(6, 66.4, 'what the Fold calls the rest of Ravel', { size: 1.75, italic: true }),
    compass(91, 60, 4),
  );
  return svg;
}

// ------------------------------------------------------------- the crease

/** A printed map of Ravel, opened like a book: the Fold falls in the crease, where nothing is printed. */
export function drawFoldedMap() {
  const r = rng(9);
  const id = `gf${++uid}`;
  const svg = s('svg', { viewBox: '0 0 100 70', role: 'img', 'aria-label': 'A printed map of Ravel, folded in half. The river and the canal are printed, but the island between them falls in the crease of the paper, and nothing is printed there.' });
  // The table it lies on.
  svg.append(s('rect', { width: 100, height: 70, fill: '#2a2018' }));
  svg.append(
    s(
      'defs',
      {},
      s('clipPath', { id: `${id}l` }, s('rect', { x: 0, y: 0, width: 50, height: 70 })),
      s('clipPath', { id: `${id}r` }, s('rect', { x: 50, y: 0, width: 50, height: 70 })),
      s('linearGradient', { id: `${id}sl`, x1: 0, x2: 1 }, s('stop', { offset: '0%', 'stop-color': '#000', 'stop-opacity': 0 }), s('stop', { offset: '78%', 'stop-color': '#000', 'stop-opacity': 0.05 }), s('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.42 })),
      s('linearGradient', { id: `${id}sr`, x1: 0, x2: 1 }, s('stop', { offset: '0%', 'stop-color': '#000', 'stop-opacity': 0.5 }), s('stop', { offset: '22%', 'stop-color': '#000', 'stop-opacity': 0.16 }), s('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.08 })),
    ),
  );
  // What the printer prints: the city and the water, with the island moved under the crease and left blank.
  const sheet = () => {
    const g = s('g', { transform: 'translate(-2 4)' });
    g.append(s('rect', { x: 2, y: 0, width: 100, height: 62, fill: PAPER }));
    const island = (x, y) => x > 38 && x < 66 && y > 25 && y < 46;
    g.append(...cityBlocks(r, { x0: 3, x1: 100, y0: 1.5, y1: 60, skip: island }));
    g.append(...water(RIVER, 4.6), ...water(CUT, 2.6));
    g.append(s('path', { d: FOLD_ISLE, fill: PAPER, stroke: 'none' }));
    g.append(
      s('rect', { x: 9, y: 6.4, width: 21, height: 9.4, fill: PAPER, stroke: INK, 'stroke-width': 0.25 }),
      label(19.5, 11.4, 'RAVEL', { size: 3.6, font: CAPS, weight: 700, spacing: 1, anchor: 'middle', halo: false }),
      label(19.5, 14.2, 'the printed map', { size: 1.6, italic: true, anchor: 'middle', halo: false }),
    );
    return g;
  };
  const page = (side) => {
    // Each half is tipped up towards its outer edge, so the sheet stands open like a book.
    const m = side === 'l' ? 'matrix(0.8 0.16 0 1 10 -8)' : 'matrix(0.8 -0.16 0 1 10 8)';
    const outer = s('g', { transform: m });
    const inner = s('g', { 'clip-path': `url(#${id}${side})` });
    inner.append(sheet(), s('rect', { x: side === 'l' ? 0 : 50, y: 4, width: 50, height: 62, fill: `url(#${id}s${side})` }));
    outer.append(s('rect', { x: side === 'l' ? 0.4 : 50, y: 4.4, width: 49.6, height: 62, fill: '#000', opacity: 0.35, transform: 'translate(1 1.4)' }), inner, s('rect', { x: side === 'l' ? 0 : 50, y: 4, width: 50, height: 62, fill: 'none', stroke: INK, 'stroke-width': 0.2 }));
    return outer;
  };
  svg.append(page('l'), page('r'));
  // The crease itself.
  svg.append(s('path', { d: 'M50 4 L50 66', stroke: '#1a120b', 'stroke-width': 0.35, opacity: 0.8 }));
  // Called out.
  svg.append(
    s('circle', { cx: 50, cy: 37.5, r: 5.4, fill: 'none', stroke: RED, 'stroke-width': 0.45, 'stroke-dasharray': '1.1 0.7' }),
    s('path', { d: 'M55.2 39.5 Q 66 47 74 49.4', fill: 'none', stroke: RED, 'stroke-width': 0.4 }),
    s('rect', { x: 66.5, y: 49.6, width: 32, height: 12.4, rx: 0.8, fill: PAPER, stroke: RED, 'stroke-width': 0.3 }),
    label(68.2, 53.3, 'THE FOLD IS HERE', { size: 2.3, fill: RED, font: CAPS, weight: 700, halo: false }),
    label(68.2, 56.3, 'It falls in the crease of the', { size: 1.75, halo: false }),
    label(68.2, 58.7, 'paper, and the map-makers', { size: 1.75, halo: false }),
    label(68.2, 61.1, 'print nothing there.', { size: 1.75, halo: false }),
  );
  return svg;
}

// ---------------------------------------------------------------- the Fold

// The island, in the same frame as the places' own map positions (a 100 by 70 sheet).
const ISLE = 'M12 21 C 26 15, 38 13.5, 50 14 C 64 15, 78 19, 88 26 C 87 37, 85 47, 81 55 C 71 61, 62 65, 52 66 C 38 66, 22 63, 11 60 C 9 47, 9 33, 12 21 Z';
const ISLE_POLY = [[12, 21], [50, 14], [88, 26], [81, 55], [52, 66], [11, 60]];
/** The lanes, as their bends: crooked, because they were never planned. */
const LANES = [
  { name: 'TURNAGAIN LANE', pts: [[50, 14.5], [48.6, 19], [49.9, 24.5], [48.8, 28], [49.5, 31]] },
  { name: 'NONESUCH ROW', pts: [[14, 23.5], [20, 25.4], [26, 26.4], [32, 28.6], [38, 30.2], [44, 33]] },
  { pts: [[11.5, 44.5], [19, 42.4], [27, 42.8], [35, 40.4], [44, 40.2]] },
  { pts: [[26, 62], [30.5, 56], [36.5, 51.4], [40, 46.4], [44.4, 42.8]] },
  { pts: [[56, 36.2], [63, 34], [70, 32.8], [78, 31.4], [86.5, 29.6]] },
  { pts: [[56, 41.2], [61.5, 45.4], [64.5, 51], [69.5, 55], [74, 59.6]] },
  { pts: [[50, 43], [48.5, 48.5], [50.6, 54], [49.5, 59.5], [51.6, 65.5]] },
];
const SQUARE = { x: 44, y: 31, w: 12, h: 12 };
const GARDEN = { x: 14.5, y: 49, w: 10, h: 5.6 };

const pathOf = (pts) => `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')}`;

/** How far a point is from a line segment, and which way the segment runs. */
function toSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return { d: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), a: Math.atan2(dy, dx) };
}

function nearestLane(x, y) {
  let best = { d: Infinity, a: 0 };
  for (const { pts } of LANES) {
    for (let i = 1; i < pts.length; i++) {
      const r = toSegment(x, y, pts[i - 1], pts[i]);
      if (r.d < best.d) best = r;
    }
  }
  return best;
}

/** Inside the island, and at least `margin` from its shore. */
function onIsland(x, y, margin = 2.6) {
  let inside = false;
  for (let i = 0, j = ISLE_POLY.length - 1; i < ISLE_POLY.length; j = i++) {
    const [xi, yi] = ISLE_POLY[i];
    const [xj, yj] = ISLE_POLY[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  if (!inside) return false;
  for (let i = 0, j = ISLE_POLY.length - 1; i < ISLE_POLY.length; j = i++) if (toSegment(x, y, ISLE_POLY[j], ISLE_POLY[i]).d < margin) return false;
  return true;
}

const within = (x, y, b, pad = 0) => x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad;

/**
 * The Fold up close: the island, its lanes and the square, the river and the Cut.
 * @param {{ places?: {n: number, at: number[]}[], names?: boolean, callouts?: {at: number[], text: string, x: number, y: number, anchor?: string}[] }} [o]
 *   places: numbered markers (the guide lists them under the picture); names: lane and water names;
 *   callouts: a red dot on a place with its name written beside it, large enough to read at a glance
 */
export function drawFold({ places = [], names = true, callouts = [], cartouche = true } = {}) {
  const r = rng(23);
  const svg = s('svg', { viewBox: '0 0 100 70', role: 'img', 'aria-label': 'Map of the Fold: an island with six crooked lanes and a square, the river to the north and west, and the Cut, a canal, to the south and east.' });
  svg.append(...paper(100, 70));
  // The Flat, beyond the water.
  const nearIsland = (x, y) => (x - 50) ** 2 / 47 ** 2 + (y - 40) ** 2 / 34 ** 2 < 1;
  svg.append(...cityBlocks(r, { skip: (x, y) => nearIsland(x, y) || (x < 30 && y < 13) }));
  // Water all round, and the river going on east and west.
  svg.append(...water(ISLE, 9), ...water('M12 21 L-4 13', 9), ...water('M88 26 L104 21', 9));
  svg.append(s('path', { d: ISLE, fill: ISLAND, stroke: INK, 'stroke-width': 0.3 }));
  // Houses packed along the lanes, and more behind them in their yards.
  const houses = [];
  const house = (x, y, a, w, h) => houses.push(s('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, fill: BLOCK, stroke: INK, 'stroke-width': 0.13, transform: `rotate(${(a * 180) / Math.PI} ${x} ${y})` }));
  for (const { pts } of LANES) {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const len = Math.hypot(bx - ax, by - ay);
      const a = Math.atan2(by - ay, bx - ax);
      for (let d = 1.4; d < len; d += 2.9) {
        const cx = ax + ((bx - ax) * d) / len;
        const cy = ay + ((by - ay) * d) / len;
        for (const side of [-1, 1]) {
          const x = cx + Math.cos(a + Math.PI / 2) * 2.2 * side;
          const y = cy + Math.sin(a + Math.PI / 2) * 2.2 * side;
          if (!onIsland(x, y, 1.8) || within(x, y, SQUARE, 1.2) || within(x, y, GARDEN, 0.6) || nearestLane(x, y).d < 1.6) continue;
          house(x, y, a, 2.4 + r() * 0.5, 1.6);
        }
      }
    }
  }
  for (let i = 0; i < 420; i++) {
    const x = 10 + r() * 80;
    const y = 14 + r() * 52;
    const near = nearestLane(x, y);
    if (near.d < 4.2 || !onIsland(x, y, 2.4) || within(x, y, SQUARE, 1.5) || within(x, y, GARDEN, 1)) continue;
    if (houses.length > 260) break;
    if (r() < 0.45) house(x, y, near.a, 1.6 + r() * 1.1, 1.2 + r() * 0.6);
  }
  svg.append(...houses);
  // The lanes, paved.
  for (const { pts } of LANES) svg.append(s('path', { d: pathOf(pts), fill: 'none', stroke: INK, 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  for (const { pts } of LANES) svg.append(s('path', { d: pathOf(pts), fill: 'none', stroke: ISLAND, 'stroke-width': 1.45, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  // Proving Square, with Setters' Hall along its north side.
  svg.append(
    s('rect', { x: SQUARE.x, y: SQUARE.y, width: SQUARE.w, height: SQUARE.h, rx: 0.6, fill: '#e3d6b6', stroke: INK, 'stroke-width': 0.3 }),
    s('rect', { x: 45.2, y: 32.1, width: 9.6, height: 4.4, fill: BLOCK, stroke: INK, 'stroke-width': 0.2 }),
    s('circle', { cx: 50, cy: 34.3, r: 1.2, fill: PAPER, stroke: INK, 'stroke-width': 0.2 }),
  );
  // The Physic Garden, by the Almshouses.
  for (let i = 0; i < 6; i++) svg.append(s('rect', { x: GARDEN.x + 0.6 + (i % 3) * 3.1, y: GARDEN.y + 0.8 + Math.floor(i / 3) * 2.4, width: 2.4, height: 1.5, rx: 0.3, fill: GREEN, opacity: 0.75 }));
  // The bridge in, at the gate; the bridge to the city's east side; the ferry across the Cut.
  svg.append(
    s('rect', { x: 49, y: 7.6, width: 2, height: 7.6, fill: PAPER, stroke: INK, 'stroke-width': 0.2 }),
    s('rect', { x: 89.4, y: 19.4, width: 2, height: 7.4, fill: PAPER, stroke: INK, 'stroke-width': 0.2, transform: 'rotate(45 90.4 23.1)' }),
    s('path', { d: 'M66.5 60.5 L70.5 68.8', fill: 'none', stroke: INK, 'stroke-width': 0.3, 'stroke-dasharray': '0.9 0.6' }),
  );
  // Narrowboats moored on the Cut.
  for (const [x, y, a] of [
    [40, 68.6, -2],
    [79.4, 62.6, -38],
    [89.8, 44, -82],
  ]) {
    svg.append(s('rect', { x: x - 3, y: y - 0.55, width: 6, height: 1.1, rx: 0.55, fill: '#7b5a3a', stroke: INK, 'stroke-width': 0.12, transform: `rotate(${a} ${x} ${y})` }));
  }
  svg.append(...ripples([[34, 11.6], [70, 13.4], [5.6, 40], [60, 69.4], [95.4, 34]], 1.3));
  // The crease of the printed map runs through the middle, which is why nobody finds the place.
  svg.append(s('path', { d: 'M50 0 L50 70', stroke: INK, 'stroke-width': 0.18, 'stroke-dasharray': '0.6 1.2', opacity: 0.45 }));
  if (names) {
    const row = LANES[1].pts;
    const ra = (Math.atan2(row[3][1] - row[1][1], row[3][0] - row[1][0]) * 180) / Math.PI;
    svg.append(
      label(47.4, 19.4, 'TURNAGAIN LANE', { size: 1.7, font: CAPS, weight: 600, spacing: 0.15, anchor: 'end' }),
      label(27.5, 24.6, 'NONESUCH ROW', { size: 1.7, font: CAPS, weight: 600, spacing: 0.15, anchor: 'middle', rotate: ra }),
      label(50, 46.4, 'PROVING SQUARE', { size: 1.7, font: CAPS, weight: 600, spacing: 0.15, anchor: 'middle' }),
      label(GARDEN.x, GARDEN.y - 0.8, 'Physic Garden', { size: 1.7, italic: true }),
      label(31, 10.8, 'the river', { size: 2.3, fill: WATER_INK, italic: true, rotate: -5 }),
      label(87.6, 52, 'the Cut', { size: 2.3, fill: WATER_INK, italic: true, rotate: -66 }),
      label(72, 67.6, 'ferry', { size: 1.6, italic: true, rotate: -26 }),
      label(80, 4.6, 'THE FLAT', { size: 2.6, font: CAPS, weight: 700, spacing: 0.6, opacity: 0.75 }),
    );
  }
  if (cartouche) svg.append(
    s('rect', { x: 2.4, y: 2.4, width: 25, height: 8.4, fill: PAPER, stroke: INK, 'stroke-width': 0.28 }),
    s('rect', { x: 3.1, y: 3.1, width: 23.6, height: 7, fill: 'none', stroke: INK, 'stroke-width': 0.1 }),
    label(14.9, 7.2, 'THE FOLD', { size: 3, font: CAPS, weight: 700, spacing: 0.7, anchor: 'middle', halo: false }),
    label(14.9, 9.4, 'as told, not as printed', { size: 1.35, italic: true, anchor: 'middle', halo: false }),
  );
  svg.append(compass(93.5, 61.5, 3.4));
  for (const p of places) svg.append(marker(p.at[0], p.at[1], p.n));
  for (const c of callouts) {
    svg.append(
      s('circle', { cx: c.at[0], cy: c.at[1], r: 1.5, fill: RED, stroke: PAPER, 'stroke-width': 0.5 }),
      label(c.x, c.y, c.text, { size: 2.9, fill: RED, font: CAPS, weight: 700, anchor: c.anchor ?? 'start', spacing: 0.2 }),
    );
  }
  return svg;
}

// ----------------------------------------------------------------- the card

/**
 * A picture over the whole screen, wider than it, to drag around with a finger. Tap to close.
 * @param {SVGSVGElement} svg  @param {string} caption  @param {HTMLElement} host the cards layer
 * @returns {() => void} closes it
 */
export function enlargePicture(svg, caption, host) {
  const zoom = el('div', { class: 'guide-zoom', role: 'dialog', 'aria-label': caption }, el('div', { class: 'guide-zoom-inner' }, svg.cloneNode(true)), el('div', { class: 'guide-zoom-hint', text: 'Drag to look around. Tap to close.' }));
  const onKey = (e) => {
    if (e.code !== 'Escape') return;
    e.stopPropagation();
    close();
  };
  const close = () => {
    window.removeEventListener('keydown', onKey, true);
    zoom.remove();
  };
  zoom.addEventListener('click', close);
  window.addEventListener('keydown', onKey, true);
  host.append(zoom);
  return close;
}

/** The pictures a chapter card can show, by the names the story uses. */
export const PICTURES = {
  ravel: { draw: () => drawRavel(), caption: 'Ravel. The Fold is the island in red, between the river and the Cut.' },
  crease: { draw: () => drawFoldedMap(), caption: 'Every printed map of Ravel puts the Fold in a crease of the paper and leaves it blank.' },
  fold: {
    draw: () =>
      drawFold({
        callouts: [
          { at: [50, 9], text: 'YOU START HERE', x: 53, y: 10.2 },
          { at: [30, 30], text: "THE CLOCKMAKER'S", x: 25, y: 36.4, anchor: 'middle' },
        ],
      }),
    caption: 'The Fold: six crooked lanes and a square. You come in over the bridge at the top, through the gate.',
  },
};

/** The places a detective knows of on the first morning, as numbered on the close-up. */
const FIRST_PLACES = [
  { n: 1, at: [50, 9], name: 'The Turnstile', text: 'The gate into the Fold, on the bridge from the city. It opens only to the word of the day.' },
  { n: 2, at: [50, 36], name: "Setters' Hall", text: 'The hall of the puzzle-makers, on Proving Square. Your desk is here.' },
  { n: 3, at: [30, 30], name: 'Pendry & Sons', text: 'The clockmaker’s shop on Nonesuch Row, where Ignatius Pendry was found dead.' },
  { n: 4, at: [24.4, 28.2], name: 'Quoin & Daughter', text: 'The wheelwright’s shop next door. Kit’s grandmother makes cipher wheels here.' },
  { n: 5, at: [42.6, 41.6], name: 'The Stalemate', text: 'The coffee house on Proving Square, where people play games and talk.' },
  { n: 6, at: [21, 56], name: 'The Almshouses', text: 'Homes for old members of the Company, beside the Physic Garden, an old herb garden.' },
  { n: 7, at: [68.5, 64.6], name: 'The ferry', text: 'Across the Cut. You leave on the last ferry when you end the day.' },
];

const WORDS = [
  ['Ravel', 'An old cathedral city in the west of England. You are a police detective there.'],
  ['The Fold', 'A hidden part of Ravel: six crooked lanes and a square, on an island between the river and a canal.'],
  ['The Flat', 'What people in the Fold call everyone and everywhere outside it, because they come from the flat part of the map. That includes you.'],
  ['The Company', 'The Worshipful Company of Setters and Solvers, the Fold’s guild of puzzle-makers. Setters make puzzles. Solvers solve them.'],
  ['The Syndics', 'The four people who run the Company. The Warden is the head of them.'],
  ['The Proving', 'The Company’s yearly puzzle exam. This year it is on Thursday night.'],
  ['Fold Time', 'The Fold’s clocks run eleven minutes behind your watch.'],
  ['Papers', 'Puzzles that someone sets you. They are kept in your notebook.'],
];

/**
 * Open the guide. A picture can be tapped to see it larger.
 * @returns {Promise<void>} when it is closed
 */
export function showGuide(cards) {
  return new Promise((resolve) => {
    let unzoom = null;
    const close = () => {
      window.removeEventListener('keydown', onKey, true);
      unzoom?.();
      card.remove();
      resolve();
    };
    const onKey = (e) => {
      // An enlarged picture closes itself first.
      if (e.code !== 'Escape' || card.parentElement?.querySelector('.guide-zoom')) return;
      e.stopPropagation();
      close();
    };
    window.addEventListener('keydown', onKey, true);
    // Over the whole screen, wherever the guide has been scrolled to.
    const enlarge = (svg, caption) => {
      unzoom = enlargePicture(svg, caption, card.parentElement ?? card);
    };
    const figure = (svg, title, ...text) => {
      const box = el('button', { class: 'guide-pic', type: 'button', 'aria-label': `${title}. Tap to see it larger.`, onClick: () => enlarge(svg, title) }, svg);
      return el('figure', { class: 'guide-fig' }, box, el('figcaption', {}, el('h4', { text: title }), ...text.map((t) => el('p', { text: t }))));
    };
    const fold = drawFold({ places: FIRST_PLACES });
    const card = el(
      'section',
      { class: 'card guide', role: 'dialog', 'aria-label': 'Where you are' },
      el(
        'div',
        { class: 'card-inner' },
        el('div', { class: 'card-kicker', text: 'Where you are' }),
        el('h2', { class: 'card-title', text: 'Ravel and the Fold' }),
        el('div', { class: 'rule' }),
        figure(drawRavel(), 'The city of Ravel', 'A river runs through the city. A canal, the Cut, leaves the river and joins it again further on. The small island between them is the Fold.'),
        figure(drawFoldedMap(), 'Why no map shows the Fold', 'The people of the Fold have drawn the maps of Ravel since 1741. They always put their island in a crease of the paper and print nothing there. Only people who have been told can find it.'),
        figure(fold, 'The Fold, close up', 'Six crooked lanes and a square. You come in over the bridge at the top, through the gate.'),
        el(
          'ol',
          { class: 'guide-places' },
          FIRST_PLACES.map((p) => el('li', {}, el('span', { class: 'guide-n', text: String(p.n) }), el('div', {}, el('b', { text: p.name }), el('span', { text: ` ${p.text}` })))),
        ),
        el('p', { class: 'guide-note', text: 'The County Mortuary is outside the Fold, at Ravel Infirmary in the Flat. Other places open up as the case goes on.' }),
        el('h3', { class: 'guide-h', text: 'Words you will hear' }),
        el(
          'dl',
          { class: 'guide-words' },
          WORDS.map(([w, d]) => [el('dt', { text: w }), el('dd', { text: d })]),
        ),
        el('div', { class: 'card-actions sticky' }, el('button', { class: 'btn solid', type: 'button', text: 'Back', 'data-back': '', onClick: close })),
      ),
    );
    cards.append(card);
  });
}
