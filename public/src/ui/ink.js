// Ink on paper: the small drawing kit shared by the lesson pictures (lessons.js) and the
// animated how-tos (demos/). Plain SVG elements with the house colours and type.

import { PIECE_PATHS } from './stage-kinds3.js';

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
