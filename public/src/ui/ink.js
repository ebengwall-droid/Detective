// Ink on paper: the small drawing kit shared by the lesson pictures (lessons.js) and the
// animated how-tos (demos/). Plain SVG elements with the house colours and type.

export const NS = 'http://www.w3.org/2000/svg';

export const COL = {
  ink: '#2b2620',
  faint: '#8a7f6c',
  rule: '#cfc2a6',
  brass: '#a8691c',
  green: '#2f7a52',
  red: '#b03a2e',
  blue: '#2d5f8a',
  paper: '#f3ecdb',
  wood: '#7a5332',
  gold: '#c9a227',
  grey: '#8b8b86',
};

export const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Chess pieces, drawn in a 45 by 45 square. */
export const PIECE_PATHS = {
  p: 'M22.5 9a4 4 0 0 0-3.2 6.4C17.4 16.6 16 18.6 16 21c0 2 .9 3.8 2.4 5-3 1.1-7.4 5.5-7.4 13.5h23c0-8-4.4-12.4-7.4-13.5 1.5-1.2 2.4-3 2.4-5 0-2.4-1.4-4.4-3.3-5.6A4 4 0 0 0 22.5 9z',
  r: 'M9 39h27v-3H9zM12 36v-4h21v4zM11 14V9h4v2h5V9h5v2h5V9h4v5zM34 14l-3 3H14l-3-3zM31 17v12.5H14V17zM31 29.5l1.5 2.5h-20l1.5-2.5z',
  n: 'M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21M24 18c.4 2.9-5.5 7.4-8 9-3 2-2.8 4.3-5 4-1-.9 1.4-3 0-3-1 0 .2 1.2-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.9-1.9 2-3.5c-.7-1-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.8-2 2.5-3c1 0 1 3 1 3',
  b: 'M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.6 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.4.5-2.3.5-3-.5 1.4-1.9 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z',
  q: 'M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z',
  k: 'M22.5 11.6V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z',
};

let uid = 0;

/** An SVG element with attributes and children. */
export function s(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) node.setAttribute(k, String(v));
  for (const c of children.flat()) if (c) node.append(c);
  return node;
}

/** Text. `c`: font (m mono, u sans, d serif); `a`: anchor; `z`: size; `f`: colour; `w`: weight; `i`: italic. */
export function T(x, y, str, o = {}) {
  const n = s('text', { x, y, 'text-anchor': o.a ?? 'middle', class: `lt ${o.c ?? 'm'}`, fill: o.f ?? COL.ink, 'font-size': o.z ?? 13, 'font-weight': o.w ?? null, 'font-style': o.i ? 'italic' : null });
  n.textContent = str;
  return n;
}
export const L = (x1, y1, x2, y2, o = {}) => s('line', { x1, y1, x2, y2, stroke: o.s ?? COL.ink, 'stroke-width': o.w ?? 1.4, 'stroke-linecap': 'round', 'stroke-dasharray': o.d ?? null, 'marker-end': o.m ?? null, 'marker-start': o.ms ?? null });
export const R = (x, y, w, h, o = {}) => s('rect', { x, y, width: w, height: h, rx: o.r ?? 3, fill: o.f ?? 'none', stroke: o.s ?? COL.ink, 'stroke-width': o.w ?? 1.2, 'stroke-dasharray': o.d ?? null });
export const C = (cx, cy, r, o = {}) => s('circle', { cx, cy, r, fill: o.f ?? 'none', stroke: o.s ?? COL.ink, 'stroke-width': o.w ?? 1.2 });
export const P = (d, o = {}) => s('path', { d, fill: o.f ?? 'none', stroke: o.s ?? COL.ink, 'stroke-width': o.w ?? 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': o.d ?? null, 'marker-end': o.m ?? null });
export const G = (attrs = {}, ...children) => s('g', attrs, ...children);

/** A chess piece in a square of `size` at (x, y). Upper case is White. */
export function chessman(code, x, y, size) {
  const white = code === code.toUpperCase();
  return s('g', { transform: `translate(${x} ${y}) scale(${size / 45})` }, s('path', { d: PIECE_PATHS[code.toLowerCase()], fill: white ? '#fbf6ea' : '#1c140c', stroke: white ? '#1c140c' : '#e8d6b0', 'stroke-width': white ? 1.5 : 1.1, 'stroke-linejoin': 'round' }));
}

/**
 * A paper card of the given size. `arrow(colour)` gives a marker-end value for that
 * colour (ink, brass, red, green, faint).
 */
export function card(w, h) {
  const id = `ink${++uid}`;
  const defs = s('defs');
  for (const [name, col] of Object.entries({ ink: COL.ink, brass: COL.brass, red: COL.red, green: COL.green, faint: COL.faint })) {
    defs.append(s('marker', { id: `${id}-${name}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { d: 'M0 0 L10 5 L0 10 z', fill: col })));
  }
  // The paper is part of the picture, so it reads the same enlarged, on any background.
  const svg = s('svg', { viewBox: `0 0 ${w} ${h}`, class: 'lesson-svg', role: 'img' }, defs, s('rect', { x: 0, y: 0, width: w, height: h, rx: 8, fill: COL.paper }));
  const arrow = (name = 'ink') => `url(#${id}-${name})`;
  return { svg, arrow };
}
