// Prop library, part one: furniture, lighting and general set dressing.
//
// A prop is a function (g, o, ctx) that fills the THREE.Group `g` (origin on
// the floor, front facing +Z) and may return { c: [w, d] } to block walking.
// Everything is built from primitives; see geo.js.

import * as THREE from 'three';
import { box, cyl, sph, plane, lathe, torus, group } from './geo.js';
import { mat, glow, artMaterial, blobShadowMaterial } from './materials.js';
import { ART } from './art.js';

/** @type {Record<string, (g: THREE.Group, o: any, ctx: any) => ({ c?: [number, number] | null, h?: number } | void)>} */
export const PROPS = {};
export function def(name, fn) {
  PROPS[name] = fn;
}

const WARM = 0xffb45e;
const WARM_DEEP = 0xff9440;
const COOL = 0xbfe0ee;

function shadowBlob(g, w, d, y = 0.012) {
  const m = plane(g, w * 1.25, d * 1.25, blobShadowMaterial(), 0, y, 0, { rx: -90, unitUv: true, dyn: true });
  m.renderOrder = 1;
  return m;
}

// ---------------------------------------------------------------- furniture

def('desk', (g, o) => {
  const w = o.w ?? 1.5;
  const d = o.d ?? 0.75;
  const m = o.mat ?? 'wood';
  box(g, w, 0.045, d, m, 0, 0.74, 0);
  const pw = 0.4;
  for (const side of [-1, 1]) {
    if (o.single && side === -1) {
      box(g, 0.05, 0.72, d - 0.1, m, -w / 2 + 0.06, 0.36, 0);
      continue;
    }
    const x = side * (w / 2 - pw / 2 - 0.03);
    box(g, pw, 0.68, d - 0.08, m, x, 0.38, 0);
    for (let i = 0; i < 3; i++) {
      box(g, pw - 0.06, 0.18, 0.02, o.front ?? 'woodDark', x, 0.16 + i * 0.215, d / 2 - 0.035);
      sph(g, 0.016, 'brass', x, 0.16 + i * 0.215, d / 2 - 0.015, 6);
    }
  }
  box(g, w - 0.1, 0.4, 0.025, m, 0, 0.5, -d / 2 + 0.05);
  shadowBlob(g, w, d);
  return { c: [w, d], h: 0.78 };
});

def('table', (g, o) => {
  const w = o.w ?? 1.2;
  const d = o.d ?? 0.8;
  const h = o.h ?? 0.74;
  const m = o.mat ?? 'wood';
  box(g, w, 0.045, d, m, 0, h - 0.022, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) box(g, 0.06, h - 0.045, 0.06, m, sx * (w / 2 - 0.07), (h - 0.045) / 2, sz * (d / 2 - 0.07));
  }
  box(g, w - 0.16, 0.07, 0.025, m, 0, h - 0.09, d / 2 - 0.08);
  box(g, w - 0.16, 0.07, 0.025, m, 0, h - 0.09, -d / 2 + 0.08);
  shadowBlob(g, w, d);
  return { c: [w, d], h };
});

def('roundTable', (g, o) => {
  const r = o.r ?? 0.45;
  const h = o.h ?? 0.74;
  const m = o.mat ?? 'woodDark';
  cyl(g, r, r, 0.04, m, 0, h - 0.02, 0, 20);
  cyl(g, 0.05, 0.06, h - 0.08, m, 0, (h - 0.04) / 2, 0, 8);
  cyl(g, r * 0.55, r * 0.6, 0.04, m, 0, 0.02, 0, 12);
  shadowBlob(g, r * 2, r * 2);
  return { c: [r * 1.7, r * 1.7], h };
});

def('chair', (g, o) => {
  const m = o.mat ?? 'woodDark';
  box(g, 0.42, 0.04, 0.42, m, 0, 0.45, 0);
  for (const sx of [-1, 1]) {
    box(g, 0.04, 0.45, 0.04, m, sx * 0.18, 0.225, 0.18);
    box(g, 0.04, 0.95, 0.04, m, sx * 0.18, 0.475, -0.19);
  }
  box(g, 0.36, 0.09, 0.025, m, 0, 0.86, -0.19);
  box(g, 0.36, 0.06, 0.025, m, 0, 0.68, -0.19);
  shadowBlob(g, 0.5, 0.5);
  return { c: [0.44, 0.44], h: 0.95 };
});

def('officeChair', (g, o) => {
  const m = o.mat ?? 'leatherGreen';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    box(g, 0.3, 0.03, 0.045, 'iron', Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15, { ry: (-a * 180) / Math.PI });
  }
  cyl(g, 0.025, 0.025, 0.38, 'steelDark', 0, 0.25, 0, 8);
  box(g, 0.46, 0.08, 0.44, m, 0, 0.48, 0);
  box(g, 0.44, 0.5, 0.07, m, 0, 0.82, -0.2, { rx: -6 });
  for (const sx of [-1, 1]) {
    box(g, 0.04, 0.2, 0.04, 'iron', sx * 0.25, 0.6, -0.02);
    box(g, 0.05, 0.03, 0.26, 'woodDark', sx * 0.25, 0.7, 0);
  }
  shadowBlob(g, 0.6, 0.6);
  return { c: [0.5, 0.5], h: 1.05 };
});

def('armchair', (g, o) => {
  const m = o.mat ?? 'leatherOxblood';
  box(g, 0.86, 0.3, 0.8, m, 0, 0.2, 0);
  box(g, 0.6, 0.14, 0.6, m, 0, 0.42, 0.06);
  box(g, 0.86, 0.62, 0.18, m, 0, 0.66, -0.33, { rx: -7 });
  for (const sx of [-1, 1]) {
    box(g, 0.15, 0.32, 0.76, m, sx * 0.355, 0.5, 0);
    cyl(g, 0.085, 0.085, 0.76, m, sx * 0.355, 0.66, 0, 10, { rx: 90 });
    box(g, 0.06, 0.06, 0.06, 'woodBlack', sx * 0.36, 0.03, 0.33);
    box(g, 0.06, 0.06, 0.06, 'woodBlack', sx * 0.36, 0.03, -0.33);
  }
  shadowBlob(g, 0.95, 0.9);
  return { c: [0.86, 0.82], h: 1.0 };
});

def('sofa', (g, o) => {
  const w = o.w ?? 1.9;
  const m = o.mat ?? 'leather';
  box(g, w, 0.28, 0.82, m, 0, 0.2, 0);
  const n = Math.round(w / 0.62);
  for (let i = 0; i < n; i++) {
    const cw = (w - 0.34) / n;
    box(g, cw - 0.02, 0.13, 0.6, m, -w / 2 + 0.17 + cw * (i + 0.5), 0.41, 0.06);
  }
  box(g, w, 0.55, 0.18, m, 0, 0.62, -0.33, { rx: -7 });
  for (const sx of [-1, 1]) {
    box(g, 0.16, 0.3, 0.8, m, sx * (w / 2 - 0.08), 0.5, 0);
    cyl(g, 0.09, 0.09, 0.8, m, sx * (w / 2 - 0.08), 0.65, 0, 10, { rx: 90 });
  }
  shadowBlob(g, w, 0.9);
  return { c: [w, 0.84], h: 0.9 };
});

def('stool', (g, o) => {
  const h = o.h ?? 0.76;
  cyl(g, 0.17, 0.17, 0.05, o.mat ?? 'leatherOxblood', 0, h, 0, 14);
  cyl(g, 0.16, 0.16, 0.02, 'woodDark', 0, h - 0.035, 0, 14);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = cyl(g, 0.016, 0.016, h, 'woodDark', Math.cos(a) * 0.15, h / 2, Math.sin(a) * 0.15, 6);
    leg.rotation.z = Math.cos(a) * 0.09;
    leg.rotation.x = -Math.sin(a) * 0.09;
  }
  torus(g, 0.17, 0.011, 'brassDull', 0, 0.28, 0, { rx: 90 });
  shadowBlob(g, 0.4, 0.4);
  return { c: [0.36, 0.36], h };
});

def('bench', (g, o) => {
  const w = o.w ?? 1.6;
  const m = o.mat ?? 'wood';
  box(g, w, 0.05, 0.36, m, 0, 0.45, 0);
  for (const sx of [-1, 1]) box(g, 0.06, 0.43, 0.32, m, sx * (w / 2 - 0.12), 0.215, 0);
  if (o.back) box(g, w, 0.4, 0.04, m, 0, 0.75, -0.17);
  shadowBlob(g, w, 0.4);
  return { c: [w, 0.38], h: o.back ? 0.95 : 0.5 };
});

def('bed', (g, o) => {
  const w = o.w ?? 0.95;
  const l = 2.0;
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) cyl(g, 0.022, 0.022, sz < 0 ? 1.05 : 0.7, 'iron', sx * (w / 2), sz < 0 ? 0.525 : 0.35, sz * (l / 2), 6);
    cyl(g, 0.018, 0.018, w, 'iron', 0, sz < 0 ? 1.03 : 0.68, sz * (l / 2), 6, { rz: 90 });
    for (let i = 1; i < 5; i++) cyl(g, 0.01, 0.01, sz < 0 ? 0.6 : 0.3, 'iron', -w / 2 + (w * i) / 5, sz < 0 ? 0.72 : 0.52, sz * (l / 2), 5);
  }
  box(g, w, 0.06, l, 'iron', 0, 0.32, 0);
  box(g, w - 0.04, 0.16, l - 0.06, 'fabricCream', 0, 0.43, 0);
  box(g, w - 0.02, 0.05, l * 0.62, o.blanket ?? 'fabricOlive', 0, 0.535, l * 0.17);
  box(g, w * 0.62, 0.1, 0.36, 'fabricWhite', 0, 0.56, -l / 2 + 0.28);
  shadowBlob(g, w, l);
  return { c: [w, l], h: 0.6 };
});

const BOOK_COLORS = ['#5a1f1c', '#1f3a4a', '#3a4a2a', '#6a5320', '#2a2238', '#4a2a1a', '#6b6252', '#203830', '#70301e', '#2c2c30'];

function fillShelf(g, kind, x0, x1, y, depth, rnd, ctx) {
  let x = x0 + 0.02;
  if (kind === 'books') {
    while (x < x1 - 0.05) {
      if (rnd() < 0.08) {
        x += 0.06 + rnd() * 0.1;
        continue;
      }
      const t = 0.025 + rnd() * 0.04;
      const h = 0.19 + rnd() * 0.1;
      const lean = rnd() < 0.07 ? 12 : 0;
      box(g, t, h, depth * (0.6 + rnd() * 0.25), BOOK_COLORS[Math.floor(rnd() * BOOK_COLORS.length)], x + t / 2, y + h / 2, 0.01, lean ? { rz: -lean } : undefined);
      x += t + 0.003;
    }
  } else if (kind === 'files') {
    while (x < x1 - 0.08) {
      const t = 0.06 + rnd() * 0.02;
      box(g, t, 0.26, depth * 0.8, rnd() > 0.4 ? '#3f4a44' : '#5a4a32', x + t / 2, y + 0.13, 0);
      box(g, t * 0.6, 0.06, 0.004, 'paperWhite', x + t / 2, y + 0.17, depth * 0.4 + 0.002);
      x += t + 0.006;
    }
  } else if (kind === 'boxes') {
    while (x < x1 - 0.26) {
      const w = 0.24 + rnd() * 0.1;
      const h = 0.18 + rnd() * 0.08;
      box(g, w, h, depth * 0.85, 'cardboard', x + w / 2, y + h / 2, 0, { ry: (rnd() - 0.5) * 8 });
      box(g, w * 0.5, h * 0.4, 0.004, 'paperWhite', x + w / 2, y + h / 2, depth * 0.43);
      x += w + 0.04;
    }
  } else if (kind === 'bottles') {
    while (x < x1 - 0.06) {
      const r = 0.03 + rnd() * 0.012;
      const h = 0.2 + rnd() * 0.1;
      const m = rnd() > 0.5 ? 'glassBottleGreen' : 'glassBottleAmber';
      cyl(g, r, r, h * 0.65, m, x + r, y + h * 0.325, (rnd() - 0.5) * 0.06, 8);
      cyl(g, r * 0.35, r * 0.8, h * 0.35, m, x + r, y + h * 0.82, 0, 8);
      x += r * 2 + 0.02 + rnd() * 0.03;
    }
  } else if (kind === 'jars') {
    while (x < x1 - 0.1) {
      const r = 0.045 + rnd() * 0.02;
      cyl(g, r, r, 0.14, 'glassClear', x + r, y + 0.07, 0, 10);
      cyl(g, r * 1.02, r * 1.02, 0.015, 'brassDull', x + r, y + 0.147, 0, 10);
      cyl(g, r * 0.85, r * 0.85, 0.06 + rnd() * 0.05, rnd() > 0.5 ? 'brassDull' : '#4a3a2a', x + r, y + 0.045, 0, 8);
      x += r * 2 + 0.03;
    }
  } else if (kind === 'lanterns') {
    while (x < x1 - 0.2) {
      const lg = group(g, x + 0.11, y, 0);
      PROPS.lantern(lg, { lit: rnd() < 0.55, light: false, s: 0.85 + rnd() * 0.2, halo: 0.5 }, ctx);
      x += 0.24 + rnd() * 0.06;
    }
  }
}

def('shelf', (g, o, ctx) => {
  const w = o.w ?? 1.0;
  const h = o.h ?? 2.0;
  const d = o.d ?? 0.32;
  const m = o.mat ?? 'woodDark';
  const n = o.shelves ?? Math.round(h / 0.38);
  box(g, 0.03, h, d, m, -w / 2 + 0.015, h / 2, 0);
  box(g, 0.03, h, d, m, w / 2 - 0.015, h / 2, 0);
  box(g, w, 0.03, d, m, 0, h - 0.015, 0);
  box(g, w - 0.06, h, 0.015, m, 0, h / 2, -d / 2 + 0.01);
  const fills = Array.isArray(o.fill) ? o.fill : [o.fill ?? 'books'];
  for (let i = 0; i < n; i++) {
    const y = 0.06 + (i * (h - 0.1)) / n;
    box(g, w - 0.06, 0.025, d - 0.02, m, 0, y, 0);
    const kind = fills[i % fills.length];
    if (kind && kind !== 'none') fillShelf(g, kind, -w / 2 + 0.03, w / 2 - 0.03, y + 0.013, d - 0.04, ctx.rnd, ctx);
  }
  shadowBlob(g, w, d * 1.6);
  return { c: [w, d], h };
});

def('cabinet', (g, o) => {
  const n = o.drawers ?? 4;
  const h = n * 0.32 + 0.04;
  const m = o.mat ?? 'steelDark';
  box(g, 0.48, h, 0.6, m, 0, h / 2, 0);
  for (let i = 0; i < n; i++) {
    const y = 0.2 + i * 0.32;
    box(g, 0.43, 0.28, 0.015, o.front ?? 'steelDark', 0, y, 0.305);
    box(g, 0.16, 0.022, 0.03, 'steel', 0, y - 0.05, 0.325);
    box(g, 0.12, 0.05, 0.004, 'paperWhite', 0, y + 0.06, 0.316);
  }
  shadowBlob(g, 0.55, 0.7);
  return { c: [0.48, 0.6], h };
});

def('locker', (g, o) => {
  const n = o.n ?? 1;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.4;
    box(g, 0.39, 1.9, 0.48, o.mat ?? 'steelDark', x, 0.95, 0);
    box(g, 0.35, 1.8, 0.012, o.mat ?? 'steelDark', x, 0.95, 0.243);
    for (let k = 0; k < 4; k++) box(g, 0.2, 0.012, 0.004, 'dark', x, 1.62 + k * 0.035, 0.251);
    box(g, 0.025, 0.09, 0.03, 'steel', x + 0.12, 1.0, 0.26);
  }
  shadowBlob(g, 0.4 * n, 0.55);
  return { c: [0.4 * n, 0.48], h: 1.9 };
});

def('safe', (g, o) => {
  const s = o.s ?? 1;
  const w = 0.6 * s;
  const h = 0.8 * s;
  box(g, w, h, 0.55 * s, 'iron', 0, h / 2, 0);
  const door = group(g, o.open ? -w / 2 + 0.02 : 0, 0, 0.28 * s);
  if (o.open) door.rotation.y = -1.2;
  box(door, w - 0.08, h - 0.08, 0.03, 'steelDark', o.open ? w / 2 - 0.04 : 0, h / 2, 0);
  cyl(door, 0.06 * s, 0.06 * s, 0.03, 'brass', o.open ? w / 2 - 0.04 : 0, h * 0.58, 0.03, 14, { rx: 90 });
  box(door, 0.03, 0.16 * s, 0.03, 'brass', (o.open ? w / 2 - 0.04 : 0) + 0.16 * s, h * 0.45, 0.035);
  if (o.open) box(g, w - 0.1, 0.02, 0.45 * s, 'steelDark', 0, h * 0.5, 0);
  shadowBlob(g, w * 1.1, 0.65 * s);
  return { c: [w, 0.55 * s], h };
});

def('trunk', (g, o) => {
  const w = o.w ?? 0.9;
  box(g, w, 0.4, 0.5, 'woodDark', 0, 0.2, 0);
  const lid = cyl(g, 0.25, 0.25, w, 'woodDark', 0, 0.4, 0, 10, { rz: 90 });
  lid.scale.set(0.45, 1, 1);
  for (const sx of [-0.3, 0.3]) box(g, 0.05, 0.42, 0.52, 'leather', sx * w, 0.21, 0);
  box(g, 0.08, 0.08, 0.02, 'brassDull', 0, 0.36, 0.26);
  shadowBlob(g, w, 0.6);
  return { c: [w, 0.5], h: 0.52 };
});

def('crate', (g, o) => {
  const s = o.s ?? 0.6;
  box(g, s, s, s, 'woodLight', 0, s / 2, 0);
  for (const y of [0.08, s - 0.08]) {
    box(g, s + 0.02, 0.07, 0.02, 'wood', 0, y, s / 2);
    box(g, s + 0.02, 0.07, 0.02, 'wood', 0, y, -s / 2);
    box(g, 0.02, 0.07, s + 0.02, 'wood', s / 2, y, 0);
    box(g, 0.02, 0.07, s + 0.02, 'wood', -s / 2, y, 0);
  }
  if (o.stack) {
    const t = s * 0.75;
    box(g, t, t, t, 'woodLight', 0.05, s + t / 2, -0.03, { ry: 14 });
  }
  shadowBlob(g, s * 1.2, s * 1.2);
  return { c: [s, s], h: o.stack ? s * 1.75 : s };
});

def('barrel', (g, o) => {
  const s = o.s ?? 1;
  lathe(g, [[0, 0], [0.26 * s, 0], [0.32 * s, 0.25 * s], [0.34 * s, 0.45 * s], [0.32 * s, 0.65 * s], [0.26 * s, 0.9 * s], [0, 0.9 * s]], 'wood', 0, 0, 0, 14);
  for (const y of [0.12, 0.45, 0.78]) torus(g, (y === 0.45 ? 0.343 : 0.295) * s, 0.012, 'iron', 0, y * s, 0, { rx: 90 });
  shadowBlob(g, 0.75 * s, 0.75 * s);
  return { c: [0.62 * s, 0.62 * s], h: 0.9 * s };
});

def('boxes', (g, o, ctx) => {
  const n = o.n ?? 3;
  let y = 0;
  for (let i = 0; i < n; i++) {
    const w = 0.42 - i * 0.03;
    const h = 0.26 + ctx.rnd() * 0.06;
    box(g, w, h, 0.34, 'cardboard', (ctx.rnd() - 0.5) * 0.05, y + h / 2, 0, { ry: (ctx.rnd() - 0.5) * 22 });
    box(g, 0.16, 0.08, 0.004, 'paperWhite', 0, y + h / 2, 0.175);
    y += h;
  }
  shadowBlob(g, 0.55, 0.45);
  return { c: [0.44, 0.36], h: y };
});

def('counter', (g, o) => {
  const len = o.len ?? 3;
  const h = o.h ?? 1.05;
  const d = o.d ?? 0.6;
  const m = o.mat ?? 'woodDark';
  box(g, len, h - 0.05, d - 0.08, m, 0, (h - 0.05) / 2, -0.02);
  box(g, len + 0.08, 0.05, d + 0.06, o.top ?? 'wood', 0, h - 0.025, 0);
  const panels = Math.max(1, Math.round(len / 0.8));
  for (let i = 0; i < panels; i++) {
    const pw = len / panels;
    box(g, pw - 0.1, h - 0.3, 0.02, o.panel ?? 'wood', -len / 2 + pw * (i + 0.5), (h - 0.05) / 2, d / 2 - 0.05);
  }
  if (o.rail) cyl(g, 0.02, 0.02, len, 'brass', 0, 0.2, d / 2 + 0.06, 8, { rz: 90 });
  shadowBlob(g, len, d * 1.5);
  return { c: [len, d], h };
});

def('booth', (g, o) => {
  const w = o.w ?? 1.3;
  const m = o.mat ?? 'leatherOxblood';
  box(g, w, 0.42, 0.5, 'woodDark', 0, 0.21, 0);
  box(g, w - 0.04, 0.09, 0.46, m, 0, 0.46, 0.01);
  box(g, w, 1.2, 0.09, 'woodDark', 0, 0.6, -0.25);
  box(g, w - 0.08, 0.6, 0.06, m, 0, 0.84, -0.19);
  shadowBlob(g, w, 0.6);
  return { c: [w, 0.5], h: 1.2 };
});

def('workbench', (g, o) => {
  const w = o.w ?? 1.8;
  box(g, w, 0.07, 0.7, 'woodLight', 0, 0.87, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) box(g, 0.08, 0.84, 0.08, 'wood', sx * (w / 2 - 0.08), 0.42, sz * 0.28);
  }
  box(g, w - 0.2, 0.03, 0.56, 'wood', 0, 0.22, 0);
  box(g, w, 0.5, 0.03, 'wood', 0, 1.18, -0.335);
  // Vise.
  box(g, 0.12, 0.1, 0.16, 'iron', -w / 2 + 0.2, 0.955, 0.24);
  box(g, 0.14, 0.06, 0.03, 'steelDark', -w / 2 + 0.2, 1.02, 0.31);
  cyl(g, 0.008, 0.008, 0.2, 'steel', -w / 2 + 0.2, 0.96, 0.36, 6, { rz: 90 });
  // Tools on the back board.
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + 0.3 + i * ((w - 0.6) / 5);
    box(g, 0.02, 0.2, 0.015, 'woodDark', x, 1.22, -0.31);
    box(g, 0.05, 0.06, 0.02, 'steel', x, 1.34, -0.31);
  }
  shadowBlob(g, w, 0.85);
  return { c: [w, 0.7], h: 0.92 };
});

def('washstand', (g) => {
  PROPS.table(g, { w: 0.6, d: 0.45, h: 0.8, mat: 'woodPaintWhite' }, null);
  lathe(g, [[0, 0.8], [0.1, 0.8], [0.19, 0.87], [0.2, 0.9], [0.18, 0.9], [0.09, 0.83], [0, 0.825]], 'ceramic', 0, 0, 0, 14);
  lathe(g, [[0, 0.8], [0.05, 0.8], [0.075, 0.88], [0.05, 0.98], [0.04, 1.03], [0.055, 1.05]], 'ceramic', 0.2, 0, -0.1, 10);
  return { c: [0.6, 0.45], h: 1.0 };
});

def('tinBath', (g, o) => {
  const tub = lathe(g, [[0.001, 0.02], [0.3, 0.02], [0.36, 0.25], [0.4, 0.48], [0.42, 0.5], [0.4, 0.5], [0.34, 0.26], [0.28, 0.06], [0.001, 0.06]], 'steelDark', 0, 0, 0, 18);
  tub.scale.set(1, 1, 1.75);
  if (o.water !== false) {
    const water = cyl(g, 0.355, 0.355, 0.01, 'water', 0, o.level ?? 0.33, 0, 18);
    water.scale.set(1, 1, 1.75);
  }
  shadowBlob(g, 0.95, 1.6);
  return { c: [0.84, 1.46], h: 0.5 };
});

def('stove', (g, o, ctx) => {
  lathe(g, [[0, 0.12], [0.2, 0.12], [0.24, 0.3], [0.25, 0.55], [0.2, 0.78], [0.12, 0.84], [0, 0.84]], 'iron', 0, 0, 0, 12);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    box(g, 0.04, 0.14, 0.04, 'iron', Math.cos(a) * 0.17, 0.07, Math.sin(a) * 0.17);
  }
  cyl(g, 0.06, 0.06, (ctx.ceil ?? 2.6) - 0.8, 'iron', 0, 0.8 + ((ctx.ceil ?? 2.6) - 0.8) / 2, -0.05, 8);
  if (o.lit !== false) {
    box(g, 0.14, 0.1, 0.02, glow(WARM_DEEP, 1.6), 0, 0.42, 0.245, { dyn: true });
    ctx.halo(g, WARM_DEEP, 0.7, 0, 0.42, 0.3, 0.5);
    if (o.light !== false) ctx.light(g, { color: WARM_DEEP, intensity: o.intensity ?? 3, distance: 5, x: 0, y: 0.5, z: 0.45, flicker: 0.25 });
  }
  shadowBlob(g, 0.6, 0.6);
  return { c: [0.5, 0.5], h: 0.9 };
});

def('coatrack', (g, o) => {
  cyl(g, 0.02, 0.025, 1.8, 'woodDark', 0, 0.9, 0, 8);
  cyl(g, 0.2, 0.22, 0.03, 'woodDark', 0, 0.015, 0, 12);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    box(g, 0.16, 0.02, 0.02, 'woodDark', Math.cos(a) * 0.08, 1.72, Math.sin(a) * 0.08, { ry: (-a * 180) / Math.PI, rz: 25 });
  }
  if (o.coat !== false) {
    lathe(g, [[0.05, 1.62], [0.13, 1.5], [0.16, 0.9], [0.19, 0.55], [0.17, 0.55], [0.1, 0.9]], o.coatColor ?? '#2a2a30', 0.12, 0, 0, 8);
  }
  if (o.hat) {
    cyl(g, 0.17, 0.17, 0.012, '#2b2622', -0.13, 1.75, 0, 14);
    cyl(g, 0.09, 0.1, 0.1, '#2b2622', -0.13, 1.8, 0, 12);
  }
  shadowBlob(g, 0.5, 0.5);
  return { c: [0.4, 0.4], h: 1.8 };
});

def('radiator', (g, o) => {
  const n = o.n ?? 9;
  for (let i = 0; i < n; i++) box(g, 0.05, 0.6, 0.14, o.mat ?? 'steelDark', (i - (n - 1) / 2) * 0.07, 0.42, 0);
  box(g, n * 0.07, 0.03, 0.1, o.mat ?? 'steelDark', 0, 0.1, 0);
  return { c: [n * 0.07, 0.16], h: 0.75 };
});

def('fireplace', (g, o, ctx) => {
  const w = o.w ?? 1.5;
  const m = o.mat ?? 'wallStone';
  box(g, 0.28, 1.15, 0.36, m, -w / 2 + 0.14, 0.575, 0);
  box(g, 0.28, 1.15, 0.36, m, w / 2 - 0.14, 0.575, 0);
  box(g, w, 0.3, 0.36, m, 0, 1.3, 0);
  box(g, w + 0.16, 0.06, 0.46, 'woodDark', 0, 1.48, 0.03);
  box(g, w - 0.56, 1.15, 0.05, 'dark', 0, 0.575, -0.15);
  box(g, w - 0.4, 0.04, 0.5, m, 0, 0.02, 0.2);
  // Grate.
  for (let i = 0; i < 6; i++) box(g, 0.015, 0.12, 0.26, 'iron', -0.25 + i * 0.1, 0.14, 0.02);
  box(g, 0.6, 0.02, 0.28, 'iron', 0, 0.09, 0.02);
  if (o.lit) {
    for (let i = 0; i < 5; i++) sph(g, 0.05, glow(i % 2 ? WARM_DEEP : 0xff5a20, 1.5), -0.2 + i * 0.1, 0.19, 0.02, 6, { dyn: true });
    ctx.halo(g, WARM_DEEP, 1.4, 0, 0.35, 0.15, 0.6);
    if (o.light !== false) ctx.light(g, { color: WARM_DEEP, intensity: o.intensity ?? 5, distance: 6, x: 0, y: 0.45, z: 0.55, flicker: 0.35 });
  } else {
    for (let i = 0; i < 4; i++) box(g, 0.14, 0.05, 0.07, '#17140f', -0.18 + i * 0.12, 0.2, 0.02, { ry: i * 37 });
  }
  return { c: [w, 0.4], h: 1.5 };
});

def('stairs', (g, o) => {
  const steps = o.steps ?? 10;
  const w = o.w ?? 1.0;
  const rise = o.rise ?? 0.19;
  const run = o.run ?? 0.26;
  const m = o.mat ?? 'woodDark';
  for (let i = 0; i < steps; i++) {
    box(g, w, rise * (i + 1), run, m, 0, (rise * (i + 1)) / 2, -i * run);
    box(g, w + 0.03, 0.03, run + 0.03, 'wood', 0, rise * (i + 1), -i * run + 0.01);
  }
  const len = Math.hypot(steps * run, steps * rise);
  const ang = (Math.atan2(rise, run) * 180) / Math.PI;
  for (const sx of o.rails === 'both' ? [-1, 1] : [1]) {
    box(g, 0.05, 0.05, len, 'wood', sx * (w / 2 - 0.03), (steps * rise) / 2 + 0.9, (-(steps - 1) * run) / 2, { rx: ang });
    for (let i = 0; i < steps; i += 2) box(g, 0.03, 0.9, 0.03, 'woodDark', sx * (w / 2 - 0.03), rise * (i + 1) + 0.45, -i * run);
  }
  return { c: [w, steps * run], h: steps * rise + 0.9 };
});

def('door', (g, o) => {
  const w = o.w ?? 0.92;
  const h = o.h ?? 2.06;
  const m = o.mat ?? 'woodDark';
  box(g, 0.08, h + 0.08, 0.14, o.frame ?? 'woodBlack', -w / 2 - 0.04, (h + 0.08) / 2, 0);
  box(g, 0.08, h + 0.08, 0.14, o.frame ?? 'woodBlack', w / 2 + 0.04, (h + 0.08) / 2, 0);
  box(g, w + 0.16, 0.08, 0.14, o.frame ?? 'woodBlack', 0, h + 0.04, 0);
  const leaf = group(g, -w / 2, 0, 0);
  if (o.open) leaf.rotation.y = (-o.open * Math.PI) / 180;
  box(leaf, w, h, 0.045, m, w / 2, h / 2, 0);
  if (o.glass) {
    box(leaf, w * 0.66, h * 0.36, 0.05, 'glassDark', w / 2, h * 0.7, 0);
    if (o.text) {
      const lm = artMaterial(`lettering:${o.text}:${o.sub ?? ''}`, 512, 256, (c, cw, ch, r) => ART.lettering(c, cw, ch, r, { text: o.text, sub: o.sub }), { transparent: true, basic: true });
      plane(leaf, w * 0.6, w * 0.3, lm, w / 2, h * 0.7, 0.03, { unitUv: true, dyn: true });
    }
  } else {
    for (const py of [0.3, 0.72]) box(leaf, w * 0.7, h * 0.32, 0.05, o.panel ?? m, w / 2, h * py, 0);
  }
  sph(leaf, 0.035, 'brass', w - 0.09, h * 0.47, 0.05, 8);
  return { c: null, h };
});

// ----------------------------------------------------------------- lighting

def('deskLamp', (g, o, ctx) => {
  // A banker's lamp: a trough of coloured glass slung in a brass yoke, a pull chain under it.
  const on = o.lit !== false;
  const foot = cyl(g, 0.086, 0.1, 0.016, 'brass', 0, 0.008, 0, 20);
  foot.scale.set(1.25, 1, 0.82);
  const step = cyl(g, 0.05, 0.062, 0.014, 'brass', 0, 0.023, 0, 16);
  step.scale.set(1.25, 1, 0.82);
  cyl(g, 0.01, 0.014, 0.2, 'brass', 0, 0.13, -0.025, 8);
  sph(g, 0.017, 'brass', 0, 0.232, -0.025, 8);
  box(g, 0.262, 0.01, 0.012, 'brass', 0, 0.238, -0.025);
  for (const x of [-0.131, 0.131]) {
    box(g, 0.01, 0.075, 0.012, 'brass', x, 0.272, -0.02);
    const pin = cyl(g, 0.009, 0.009, 0.014, 'brass', x, 0.305, 0.02, 8);
    pin.rotation.z = Math.PI / 2;
  }
  // The shade: half a tube, closed at the ends, open underneath.
  const glass = new THREE.CylinderGeometry(0.066, 0.066, 0.25, 16, 1, false, 0, Math.PI);
  const shade = new THREE.Mesh(glass, mat(o.shade ?? 'enamelGreen'));
  shade.rotation.z = Math.PI / 2;
  shade.scale.set(0.82, 1, 1);
  shade.position.set(0, 0.292, 0.02);
  g.add(shade);
  for (const z of [-0.046, 0.086]) box(g, 0.256, 0.007, 0.007, 'brass', 0, 0.292, z);
  if (on) {
    box(g, 0.244, 0.008, 0.126, glow(0xfff0c0, 1.6), 0, 0.292, 0.02, { dyn: true });
    ctx.halo(g, WARM, 0.55, 0, 0.27, 0.04, 0.55);
    if (o.light !== false) ctx.light(g, { color: WARM, intensity: o.intensity ?? 2.2, distance: 4.5, x: 0, y: 0.24, z: 0.08 });
  } else {
    box(g, 0.244, 0.006, 0.126, 'plasticBlack', 0, 0.292, 0.02);
  }
  cyl(g, 0.002, 0.002, 0.07, 'brass', 0.07, 0.253, 0.05, 4);
  sph(g, 0.006, 'brass', 0.07, 0.215, 0.05, 6);
  return { c: null, h: 0.4 };
});

def('floorLamp', (g, o, ctx) => {
  cyl(g, 0.14, 0.16, 0.03, 'brassDull', 0, 0.015, 0, 14);
  cyl(g, 0.014, 0.014, 1.5, 'brassDull', 0, 0.76, 0, 6);
  const on = o.lit !== false;
  lathe(g, [[0.12, 1.42], [0.2, 1.42], [0.15, 1.68], [0.1, 1.68]], on ? glow(o.color ?? 0xffc98a, 0.9) : 'fabricCream', 0, 0, 0, 14, { dyn: on });
  if (on) {
    ctx.halo(g, WARM, 1.0, 0, 1.55, 0, 0.5);
    if (o.light !== false) ctx.light(g, { color: WARM, intensity: o.intensity ?? 5, distance: 7, x: 0, y: 1.5, z: 0 });
  }
  shadowBlob(g, 0.4, 0.4);
  return { c: [0.3, 0.3], h: 1.7 };
});

def('pendant', (g, o, ctx) => {
  const ceil = ctx.ceil ?? 2.8;
  const y = o.hang ?? 2.0;
  cyl(g, 0.006, 0.006, ceil - y - 0.12, 'dark', 0, y + 0.12 + (ceil - y - 0.12) / 2, 0, 4);
  cyl(g, 0.04, 0.04, 0.03, 'iron', 0, ceil - 0.015, 0, 8);
  lathe(g, [[0.03, 0.14], [0.06, 0.12], [0.2, 0.02], [0.22, 0], [0.2, 0], [0.05, 0.1]], o.shade ?? 'enamelGreen', 0, y, 0, 14);
  const on = o.lit !== false;
  if (on) {
    sph(g, 0.045, glow(o.color ?? 0xfff0c8, 2), 0, y + 0.03, 0, 8, { dyn: true });
    ctx.halo(g, o.color ?? WARM, 0.9, 0, y, 0, 0.5);
    ctx.beam(g, { y: y - 0.01, top: 0.17, bottom: 0.95, h: Math.max(0.6, y - 0.08), color: o.color ?? WARM, opacity: 0.05 });
    if (o.light !== false) {
      ctx.light(g, { color: o.color ?? WARM, intensity: o.intensity ?? 9, distance: o.distance ?? 9, x: 0, y: y - 0.08, z: 0, flicker: o.flicker, shadow: o.shadow });
    }
  }
  return { c: null, h: 0 };
});

def('sconce', (g, o, ctx) => {
  const y = o.y ?? 1.75;
  box(g, 0.08, 0.14, 0.03, 'brassDull', 0, y, 0.015);
  cyl(g, 0.012, 0.012, 0.12, 'brassDull', 0, y + 0.02, 0.07, 6, { rx: 70 });
  const on = o.lit !== false;
  sph(g, 0.07, on ? glow(o.color ?? 0xffd9a0, 1.3) : 'glassClear', 0, y + 0.1, 0.13, 10, { dyn: on });
  if (on) {
    ctx.halo(g, o.color ?? WARM, 0.8, 0, y + 0.1, 0.16, 0.5);
    if (o.light) ctx.light(g, { color: o.color ?? WARM, intensity: o.intensity ?? 3, distance: 6, x: 0, y: y + 0.1, z: 0.3 });
  }
  return { c: null, h: 0 };
});

def('striplight', (g, o, ctx) => {
  const ceil = ctx.ceil ?? 2.8;
  const len = o.len ?? 1.3;
  box(g, len + 0.06, 0.05, 0.16, 'steelDark', 0, ceil - 0.03, 0);
  const on = o.lit !== false;
  box(g, len, 0.03, 0.05, on ? glow(o.color ?? 0xe6f6ff, 2.2) : 'enamelWhite', 0, ceil - 0.07, 0, { dyn: on });
  if (on && o.light !== false) {
    ctx.light(g, { color: o.color ?? 0xd6ecff, intensity: o.intensity ?? 10, distance: o.distance ?? 9, x: 0, y: ceil - 0.25, z: 0, flicker: o.flicker ? 0.5 : 0, buzz: o.flicker, shadow: o.shadow });
  }
  return { c: null, h: 0 };
});

def('ceilingFan', (g, o, ctx) => {
  const ceil = ctx.ceil ?? 2.8;
  cyl(g, 0.02, 0.02, 0.3, 'brassDull', 0, ceil - 0.15, 0, 6);
  cyl(g, 0.1, 0.1, 0.1, 'brassDull', 0, ceil - 0.34, 0, 12);
  const rotor = group(g, 0, ceil - 0.36, 0);
  rotor.userData.dyn = true;
  for (let i = 0; i < 4; i++) {
    const blade = box(rotor, 0.62, 0.012, 0.13, 'woodDark', 0.4, 0, 0);
    const arm = group(rotor);
    arm.rotation.y = (i * Math.PI) / 2;
    arm.add(blade);
    blade.rotation.x = 0.16;
  }
  const speed = o.speed ?? 1.4;
  ctx.anim((t) => {
    rotor.rotation.y = t * speed;
  });
  return { c: null, h: 0 };
});

/**
 * A storm lantern.
 * o.lit, o.light, o.tag (a brass tally on the handle), o.s scale
 */
def('lantern', (g, o, ctx) => {
  const L = group(g);
  L.scale.setScalar(o.s ?? 1);
  const brass = o.metal ?? 'brass';
  lathe(L, [[0, 0], [0.078, 0], [0.086, 0.012], [0.086, 0.05], [0.062, 0.076], [0.04, 0.086], [0, 0.086]], brass, 0, 0, 0, 14);
  cyl(L, 0.042, 0.046, 0.03, 'brassDull', 0, 0.1, 0, 10);
  // Wick-raising knob.
  cyl(L, 0.014, 0.014, 0.05, brass, 0.06, 0.1, 0, 6, { rz: 90 });
  const lit = o.lit !== false;
  lathe(L, [[0.042, 0.115], [0.068, 0.15], [0.076, 0.2], [0.062, 0.262], [0.042, 0.288]], 'glassClear', 0, 0, 0, 12, { noShadow: true });
  // Frame tubes, hood and bail.
  for (const sx of [-1, 1]) {
    cyl(L, 0.008, 0.008, 0.25, brass, sx * 0.094, 0.2, 0, 5);
    cyl(L, 0.008, 0.008, 0.06, brass, sx * 0.07, 0.07, 0, 5, { rz: sx * 50 });
    cyl(L, 0.008, 0.008, 0.07, brass, sx * 0.068, 0.33, 0, 5, { rz: -sx * 48 });
  }
  torus(L, 0.078, 0.004, brass, 0, 0.2, 0, { rx: 90 });
  lathe(L, [[0.045, 0.29], [0.058, 0.3], [0.05, 0.34], [0.03, 0.365], [0.036, 0.375], [0, 0.38]], brass, 0, 0, 0, 12);
  const bail = torus(L, 0.1, 0.005, brass, 0, 0.33, 0, { arc: Math.PI, seg: 12 });
  bail.rotation.z = 0;
  if (o.tag) {
    // The brass token tied to it. Kept as its own piece: it is evidence, whatever the lantern is drawn as.
    cyl(L, 0.001, 0.001, 0.07, 'dark', 0.068, 0.265, 0.01, 3, { dyn: true });
    cyl(L, 0.022, 0.022, 0.004, 'brass', 0.068, 0.215, 0.012, 12, { rx: 90, dyn: true });
  }
  if (lit) {
    const flame = sph(L, 0.018, glow(0xffd27a, 2.4), 0, 0.15, 0, 8, { dyn: true });
    flame.scale.set(0.8, 1.7, 0.8);
    const halo = ctx.halo(L, WARM, o.halo ?? 0.9, 0, 0.18, 0, 0.75);
    const phase = ctx.rnd() * 100;
    const light = o.light !== false
      ? ctx.light(L, { color: WARM, intensity: o.intensity ?? 3.2, distance: o.distance ?? 6, x: 0, y: 0.2, z: 0 })
      : null;
    const base = light ? light.intensity : 0;
    const haloBase = halo.material.opacity;
    ctx.anim((t) => {
      const f = 0.86 + 0.09 * Math.sin(t * 9.1 + phase) + 0.06 * Math.sin(t * 23.7 + phase * 1.7) + 0.04 * Math.sin(t * 3.3 + phase);
      flame.scale.y = 1.5 + f * 0.4;
      halo.material.opacity = haloBase * f;
      if (light) light.intensity = base * f;
    });
  }
  return { c: null, h: 0.4 * (o.s ?? 1) };
});

/** A cluster of lanterns hung from the ceiling at different heights. */
def('lanternCluster', (g, o, ctx) => {
  const ceil = ctx.ceil ?? 2.8;
  const n = o.n ?? 5;
  const spread = o.spread ?? 0.9;
  for (let i = 0; i < n; i++) {
    const a = ctx.rnd() * Math.PI * 2;
    const r = Math.sqrt(ctx.rnd()) * spread;
    const y = 1.85 + ctx.rnd() * 0.45;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    cyl(g, 0.004, 0.004, ceil - y - 0.36, 'dark', x, y + 0.36 + (ceil - y - 0.36) / 2, z, 3);
    const lg = group(g, x, y, z, ctx.rnd() * 360);
    PROPS.lantern(lg, { lit: ctx.rnd() < (o.litRatio ?? 0.7), light: false, s: 0.9 + ctx.rnd() * 0.3, halo: 0.6 }, ctx);
  }
  if (o.light !== false) ctx.light(g, { color: WARM, intensity: o.intensity ?? 7, distance: 8, x: 0, y: 2.0, z: 0, flicker: 0.08 });
  return { c: null, h: 0 };
});

def('floodlight', (g, o, ctx) => {
  // A scene-of-crime work light: a finned lamp head in a yoke, on a telescopic tripod.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const leg = cyl(g, 0.011, 0.014, 1.0, 'steelDark', Math.cos(a) * 0.22, 0.46, Math.sin(a) * 0.22, 6);
    leg.rotation.z = Math.cos(a) * 0.45;
    leg.rotation.x = -Math.sin(a) * 0.45;
    cyl(g, 0.02, 0.024, 0.03, 'rubber', Math.cos(a) * 0.44, 0.015, Math.sin(a) * 0.44, 8);
  }
  cyl(g, 0.034, 0.034, 0.07, 'plasticBlack', 0, 0.92, 0, 10);
  cyl(g, 0.019, 0.019, 0.42, 'steelDark', 0, 1.1, 0, 8);
  cyl(g, 0.026, 0.026, 0.045, 'plasticBlack', 0, 1.31, 0, 10);
  cyl(g, 0.013, 0.013, 0.2, 'steel', 0, 1.42, 0, 8);
  const knob = cyl(g, 0.014, 0.014, 0.05, 'plasticBlack', 0.04, 1.31, 0, 6);
  knob.rotation.z = Math.PI / 2;
  // The yoke the head swings in.
  box(g, 0.39, 0.014, 0.036, 'steelDark', 0, 1.5, 0);
  for (const x of [-0.19, 0.19]) {
    box(g, 0.012, 0.15, 0.036, 'steelDark', x, 1.575, 0);
    const pivot = cyl(g, 0.022, 0.022, 0.022, 'plasticBlack', x * 1.07, 1.63, 0, 8);
    pivot.rotation.z = Math.PI / 2;
  }
  const head = group(g, 0, 1.63, 0);
  head.rotation.x = ((o.tilt ?? 20) * Math.PI) / 180;
  box(head, 0.33, 0.23, 0.05, 'steelDark', 0, 0, 0.012);
  // Cooling fins down the back.
  for (let i = 0; i < 9; i++) box(head, 0.008, 0.2, 0.04, 'steelDark', -0.14 + i * 0.035, 0, -0.03);
  // A hi-vis rim round the lens, and a carrying handle.
  box(head, 0.35, 0.022, 0.03, 'plasticYellow', 0, 0.115, 0.04);
  box(head, 0.35, 0.022, 0.03, 'plasticYellow', 0, -0.115, 0.04);
  box(head, 0.022, 0.21, 0.03, 'plasticYellow', -0.164, 0, 0.04);
  box(head, 0.022, 0.21, 0.03, 'plasticYellow', 0.164, 0, 0.04);
  box(head, 0.016, 0.05, 0.016, 'plasticBlack', -0.07, 0.15, 0.0);
  box(head, 0.016, 0.05, 0.016, 'plasticBlack', 0.07, 0.15, 0.0);
  box(head, 0.17, 0.018, 0.022, 'plasticBlack', 0, 0.18, 0.0);
  box(head, 0.3, 0.2, 0.012, glow(0xf2f8ff, 2.6), 0, 0, 0.042, { dyn: true });
  ctx.halo(g, COOL, 1.3, 0, 1.63, 0.1, 0.6);
  if (o.light !== false) {
    ctx.light(g, { color: 0xdcecff, intensity: o.intensity ?? 12, distance: 9, x: 0, y: 1.58, z: 0.3, shadow: o.shadow });
  }
  shadowBlob(g, 0.6, 0.6);
  return { c: [0.4, 0.4], h: 1.75 };
});

// -------------------------------------------------------------------- decor

def('laptop', (g, o) => {
  box(g, 0.34, 0.016, 0.24, 'steelDark', 0, 0.008, 0);
  box(g, 0.3, 0.003, 0.12, 'plasticBlack', 0, 0.018, -0.03);
  const lid = group(g, 0, 0.016, -0.12);
  lid.rotation.x = -0.3;
  box(lid, 0.34, 0.23, 0.012, 'steelDark', 0, 0.115, 0);
  const screen = artMaterial('lecternScreen', 512, 340, (c, w, h) => ART.lecternScreen(c, w, h), { basic: true });
  plane(lid, 0.31, 0.2, screen, 0, 0.118, 0.0075, { unitUv: true, dyn: true });
  return { c: null, h: 0.25 };
});

def('phone', (g) => {
  box(g, 0.2, 0.05, 0.16, 'plasticBlack', 0, 0.025, 0);
  box(g, 0.2, 0.05, 0.1, 'plasticBlack', 0, 0.06, -0.03, { rx: -18 });
  cyl(g, 0.045, 0.045, 0.01, 'steelDark', 0, 0.055, 0.035, 12, { rx: -8 });
  box(g, 0.22, 0.035, 0.045, 'plasticBlack', 0, 0.105, -0.03);
  for (const sx of [-1, 1]) cyl(g, 0.03, 0.03, 0.03, 'plasticBlack', sx * 0.1, 0.095, -0.03, 8);
  return { c: null, h: 0.14 };
});

def('typewriter', (g) => {
  box(g, 0.34, 0.07, 0.3, 'iron', 0, 0.035, 0);
  box(g, 0.32, 0.06, 0.14, 'iron', 0, 0.09, -0.07);
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 9; k++) cyl(g, 0.011, 0.011, 0.012, 'ceramic', -0.13 + k * 0.032 + r * 0.008, 0.076 + r * 0.004, 0.11 - r * 0.04, 6);
  }
  cyl(g, 0.02, 0.02, 0.4, 'rubber', 0, 0.135, -0.1, 8, { rz: 90 });
  plane(g, 0.21, 0.16, 'paperWhite', 0, 0.2, -0.105, { rx: -12 });
  return { c: null, h: 0.28 };
});

def('papers', (g, o, ctx) => {
  const n = o.n ?? 3;
  for (let i = 0; i < n; i++) {
    const m = artMaterial(`typed:${i % 3}:${o.stamp ?? ''}`, 256, 340, (c, w, h, r) => ART.typed(c, w, h, r, { title: i === 0 ? o.title : undefined, lines: 9 + i * 2, stamp: i === 0 ? o.stamp : undefined }));
    plane(g, 0.21, 0.297, m, (ctx.rnd() - 0.5) * 0.16, 0.003 + i * 0.002, (ctx.rnd() - 0.5) * 0.1, { rx: -90, rz: (ctx.rnd() - 0.5) * 50, unitUv: true, noShadow: true });
  }
  return { c: null, h: 0.02 };
});

def('folder', (g, o) => {
  box(g, 0.24, 0.012, 0.32, o.mat ?? '#a98a4f', 0, 0.006, 0, { ry: o.skew ?? 8 });
  box(g, 0.08, 0.002, 0.03, 'paperWhite', 0.05, 0.013, -0.12, { ry: o.skew ?? 8 });
  return { c: null, h: 0.03 };
});

def('books', (g, o, ctx) => {
  const n = o.n ?? 3;
  let y = 0;
  for (let i = 0; i < n; i++) {
    const h = 0.03 + ctx.rnd() * 0.025;
    box(g, 0.16 + ctx.rnd() * 0.05, h, 0.22 + ctx.rnd() * 0.04, BOOK_COLORS[Math.floor(ctx.rnd() * BOOK_COLORS.length)], 0, y + h / 2, 0, { ry: (ctx.rnd() - 0.5) * 30 });
    y += h;
  }
  return { c: null, h: y };
});

def('bottle', (g, o) => {
  const m = o.kind === 'amber' ? 'glassBottleAmber' : o.kind === 'clear' ? 'glassClear' : 'glassBottleGreen';
  if (o.fallen) g.rotation.z = Math.PI / 2;
  cyl(g, 0.036, 0.036, 0.17, m, 0, o.fallen ? 0 : 0.085, o.fallen ? 0 : 0, 10);
  cyl(g, 0.013, 0.03, 0.08, m, 0, o.fallen ? 0.125 : 0.21, 0, 8);
  cyl(g, 0.014, 0.014, 0.03, m, 0, o.fallen ? 0.18 : 0.265, 0, 6);
  if (!o.fallen) box(g, 0.05, 0.06, 0.002, 'paperWhite', 0, 0.09, 0.0365);
  return { c: null, h: 0.28 };
});

def('glass', (g, o) => {
  cyl(g, 0.032, 0.026, 0.08, 'glassClear', 0, 0.04, 0, 10);
  if (o.full) cyl(g, 0.028, 0.024, 0.035, 'glassBottleAmber', 0, 0.022, 0, 8);
  return { c: null, h: 0.08 };
});

def('mug', (g, o) => {
  cyl(g, 0.04, 0.036, 0.09, o.mat ?? 'ceramic', 0, 0.045, 0, 10);
  torus(g, 0.025, 0.007, o.mat ?? 'ceramic', 0.045, 0.045, 0, { seg: 8 });
  cyl(g, 0.034, 0.034, 0.005, '#1c120b', 0, 0.082, 0, 8);
  return { c: null, h: 0.09 };
});

def('ashtray', (g) => {
  cyl(g, 0.06, 0.05, 0.022, 'glassDark', 0, 0.011, 0, 12);
  cyl(g, 0.005, 0.005, 0.07, 'paperWhite', 0.02, 0.026, 0.01, 4, { rz: 78, ry: 30 });
  return { c: null, h: 0.03 };
});

/** Wall-mounted: origin is on the wall surface, facing +Z. o.y sets height. */
def('clock', (g, o) => {
  const y = o.y ?? 2.1;
  const r = o.r ?? 0.2;
  cyl(g, r + 0.025, r + 0.025, 0.05, 'woodDark', 0, y, 0.025, 20, { rx: 90 });
  const face = artMaterial(`clock:${o.time ?? '10:10'}`, 256, 256, (c, w, h, rn) => ART.clock(c, w, h, rn, { time: o.time }));
  const p = new THREE.Mesh(new THREE.CircleGeometry(r, 24), face);
  p.position.set(0, y, 0.052);
  p.userData.dyn = true;
  g.add(p);
  return { c: null, h: 0 };
});

def('frame', (g, o) => {
  const y = o.y ?? 1.6;
  const w = o.w ?? 0.5;
  const h = o.h ?? 0.4;
  const [kind, sub] = String(o.art ?? 'photo:portrait').split(':');
  let m;
  if (kind === 'photo') m = artMaterial(`photo:${sub}`, 256, Math.round((256 * h) / w), (c, cw, ch, r) => ART.photo(c, cw, ch, r, { kind: sub }));
  else if (kind === 'seascape') m = artMaterial('seascape', 384, Math.round((384 * h) / w), (c, cw, ch, r) => ART.seascape(c, cw, ch, r));
  else if (kind === 'chart') m = artMaterial('chart', 768, Math.round((768 * h) / w), (c, cw, ch, r) => ART.chart(c, cw, ch, r));
  else if (kind === 'notice') m = artMaterial(`notice:${sub}`, 256, Math.round((256 * h) / w), (c, cw, ch, r) => ART.notice(c, cw, ch, r, { title: sub }));
  else if (kind === 'newspaper') m = artMaterial(`newspaper:${sub ?? ''}`, 384, Math.round((384 * h) / w), (c, cw, ch, r) => ART.newspaper(c, cw, ch, r, { headline: sub }));
  else m = mat('paper');
  const fm = o.frame ?? 'woodBlack';
  if (fm !== 'none') {
    box(g, w + 0.07, 0.035, 0.03, fm, 0, y + h / 2 + 0.017, 0.015);
    box(g, w + 0.07, 0.035, 0.03, fm, 0, y - h / 2 - 0.017, 0.015);
    box(g, 0.035, h, 0.03, fm, -w / 2 - 0.017, y, 0.015);
    box(g, 0.035, h, 0.03, fm, w / 2 + 0.017, y, 0.015);
  }
  plane(g, w, h, m, 0, y, 0.012, { unitUv: true, noShadow: true });
  if (o.tilt) g.rotation.z = (o.tilt * Math.PI) / 180;
  return { c: null, h: 0 };
});

def('caseBoard', (g, o) => {
  const y = o.y ?? 1.55;
  const w = o.w ?? 2.2;
  const h = o.h ?? 1.2;
  box(g, w + 0.08, h + 0.08, 0.03, 'woodDark', 0, y, 0.015);
  const m = artMaterial('caseBoard', 1024, 560, (c, cw, ch, r) => ART.caseBoard(c, cw, ch, r));
  plane(g, w, h, m, 0, y, 0.032, { unitUv: true, noShadow: true });
  return { c: null, h: 0 };
});

def('plaque', (g, o) => {
  const y = o.y ?? 1.6;
  const w = o.w ?? 0.8;
  const h = o.h ?? 1.0;
  box(g, w + 0.06, h + 0.06, 0.03, 'woodBlack', 0, y, 0.015);
  const key = `plaque:${o.title ?? ''}:${o.big ?? ''}:${(o.lines ?? []).length}`;
  const m = artMaterial(key, 512, Math.round((512 * h) / w), (c, cw, ch, r) => ART.plaque(c, cw, ch, r, o), { rough: 0.35 });
  m.metalness = 0.7;
  plane(g, w, h, m, 0, y, 0.032, { unitUv: true, noShadow: true });
  return { c: null, h: 0 };
});

def('sign', (g, o) => {
  const y = o.y ?? 2.2;
  const w = o.w ?? 1.6;
  const h = o.h ?? 0.4;
  box(g, w + 0.04, h + 0.04, 0.03, 'woodBlack', 0, y, 0.015);
  const key = `sign:${o.text}:${o.sub ?? ''}:${o.bg ?? ''}`;
  const m = artMaterial(key, 768, Math.round((768 * h) / w), (c, cw, ch, r) => ART.sign(c, cw, ch, r, o));
  plane(g, w, h, m, 0, y, 0.032, { unitUv: true, noShadow: true });
  return { c: null, h: 0 };
});

def('rug', (g, o) => {
  const w = o.w ?? 2.4;
  const d = o.d ?? 1.6;
  const base = o.color ?? '#4a1f24';
  const accent = o.accent ?? '#b08a4a';
  const m = artMaterial(`rug:${base}:${accent}`, 384, 256, (c, cw, ch, rnd) => {
    c.fillStyle = base;
    c.fillRect(0, 0, cw, ch);
    c.strokeStyle = accent;
    c.lineWidth = 6;
    c.strokeRect(16, 16, cw - 32, ch - 32);
    c.lineWidth = 2;
    c.strokeRect(30, 30, cw - 60, ch - 60);
    c.fillStyle = accent;
    c.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        const x = 70 + i * ((cw - 140) / 4);
        const y = 70 + j * ((ch - 140) / 2);
        c.beginPath();
        c.moveTo(x, y - 14);
        c.lineTo(x + 12, y);
        c.lineTo(x, y + 14);
        c.lineTo(x - 12, y);
        c.fill();
      }
    }
    c.globalAlpha = 1;
    for (let i = 0; i < 3000; i++) {
      c.fillStyle = `rgba(0,0,0,${rnd() * 0.18})`;
      c.fillRect(rnd() * cw, rnd() * ch, 2, 2);
    }
  }, { rough: 1 });
  plane(g, w, d, m, 0, 0.008, 0, { rx: -90, unitUv: true, noShadow: true });
  return { c: null, h: 0 };
});

def('plant', (g, o, ctx) => {
  lathe(g, [[0, 0], [0.13, 0], [0.17, 0.3], [0.15, 0.3], [0, 0.28]], '#5a3a2a', 0, 0, 0, 10);
  const leaf = '#2f4a34';
  for (let i = 0; i < 9; i++) {
    const a = ctx.rnd() * Math.PI * 2;
    const len = 0.4 + ctx.rnd() * 0.45;
    const l = box(g, 0.09, len, 0.008, leaf, Math.cos(a) * 0.08, 0.3 + len / 2 - 0.04, Math.sin(a) * 0.08);
    l.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5 + (ctx.rnd() - 0.5) * 0.3, 'YXZ');
  }
  shadowBlob(g, 0.5, 0.5);
  return { c: [0.34, 0.34], h: 1.1 };
});

def('curtain', (g, o) => {
  const h = o.h ?? 2.2;
  const w = o.w ?? 0.5;
  const y0 = o.bottom ?? 0.3;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * (w / n);
    cyl(g, w / n / 1.6, w / n / 1.4, h, o.mat ?? 'fabricWine', x, y0 + h / 2, 0.04 + (i % 2) * 0.03, 6);
  }
  cyl(g, 0.012, 0.012, (o.rod ?? w) + 0.2, 'brassDull', o.rodX ?? 0, y0 + h + 0.03, 0.05, 6, { rz: 90 });
  return { c: null, h: 0 };
});

/** Venetian blinds hung in front of a window; throws striped shadows. */
def('blinds', (g, o) => {
  const w = o.w ?? 1.2;
  const h = o.h ?? 1.5;
  const y0 = o.sill ?? 1.0;
  const pitch = 0.09;
  const n = Math.round(h / pitch);
  const open = o.open ?? 0.6;
  const count = Math.round(n * open);
  // Slats lean up toward the room, so low moonlight is cut into bold bars.
  for (let i = 0; i < count; i++) {
    box(g, w, 0.006, 0.062, o.mat ?? '#a39a80', 0, y0 + h - 0.03 - i * pitch, 0.05, { rx: -20 });
  }
  box(g, w + 0.04, 0.045, 0.06, '#7d7562', 0, y0 + h + 0.025, 0.05);
  box(g, w, 0.03, 0.05, '#7d7562', 0, y0 + h - 0.03 - count * pitch, 0.05);
  for (const sx of [-0.3, 0.3]) box(g, 0.006, count * pitch, 0.004, '#7d7562', sx * w, y0 + h - (count * pitch) / 2, 0.085, { noShadow: true });
  return { c: null, h: 0 };
});

def('jar', (g, o) => {
  const r = o.r ?? 0.07;
  const h = o.h ?? 0.2;
  cyl(g, r, r, h, 'glassClear', 0, h / 2, 0, 12, { noShadow: true });
  cyl(g, r * 0.8, r * 0.8, 0.03, 'brassDull', 0, h + 0.012, 0, 10);
  const fill = o.fill ?? 0.55;
  cyl(g, r * 0.9, r * 0.9, h * fill, o.contents ?? 'brass', 0, (h * fill) / 2 + 0.004, 0, 10);
  return { c: null, h: h + 0.03 };
});

def('token', (g, o) => {
  cyl(g, 0.022, 0.022, 0.004, 'brass', 0, 0.003, 0, 14);
  return { c: null, h: 0.01 };
});

def('ledger', (g, o) => {
  box(g, 0.44, 0.03, 0.3, '#3a1f1a', 0, 0.015, 0);
  const m = artMaterial('ledger', 256, 340, (c, w, h, r) => ART.ledger(c, w, h, r));
  plane(g, 0.2, 0.27, m, -0.105, 0.032, 0, { rx: -90, unitUv: true, noShadow: true });
  plane(g, 0.2, 0.27, m, 0.105, 0.032, 0, { rx: -90, unitUv: true, noShadow: true });
  return { c: null, h: 0.04 };
});

def('punchSet', (g) => {
  box(g, 0.3, 0.03, 0.14, 'woodLight', 0, 0.015, 0);
  for (let i = 0; i < 10; i++) cyl(g, 0.007, 0.007, 0.07, 'steel', -0.12 + i * 0.027, 0.06, 0, 5);
  box(g, 0.03, 0.03, 0.09, 'iron', 0.21, 0.02, 0.02);
  cyl(g, 0.01, 0.01, 0.2, 'woodDark', 0.21, 0.02, -0.1, 6, { rx: 90 });
  return { c: null, h: 0.1 };
});

def('radio', (g, o) => {
  box(g, 0.34, 0.24, 0.18, 'wood', 0, 0.12, 0);
  box(g, 0.16, 0.14, 0.01, 'fabricCream', -0.06, 0.13, 0.091);
  box(g, 0.1, 0.05, 0.01, glow(0xffc070, 0.9), 0.1, 0.17, 0.091, { dyn: true });
  for (const x of [0.07, 0.13]) cyl(g, 0.016, 0.016, 0.02, 'woodBlack', x, 0.07, 0.1, 8, { rx: 90 });
  return { c: null, h: 0.25 };
});

def('cashbox', (g, o) => {
  box(g, 0.24, 0.08, 0.16, 'steelDark', 0, 0.04, 0);
  const lid = group(g, 0, 0.08, -0.08);
  lid.rotation.x = o.open ? -1.1 : 0;
  box(lid, 0.24, 0.015, 0.16, 'steelDark', 0, 0.007, 0.08);
  box(g, 0.04, 0.02, 0.01, 'brass', 0, 0.05, 0.085);
  return { c: null, h: 0.1 };
});

def('burntPaper', (g, o, ctx) => {
  for (let i = 0; i < 5; i++) {
    plane(g, 0.07 + ctx.rnd() * 0.05, 0.05 + ctx.rnd() * 0.05, i === 0 ? '#8a7a5a' : '#1a1612', (ctx.rnd() - 0.5) * 0.2, 0.01 + i * 0.004, (ctx.rnd() - 0.5) * 0.12, { rx: -90 + (ctx.rnd() - 0.5) * 30, rz: ctx.rnd() * 180, noShadow: true });
  }
  return { c: null, h: 0.03 };
});

def('newspaper', (g, o) => {
  const m = artMaterial(`newspaper:${o.headline ?? ''}`, 384, 512, (c, w, h, r) => ART.newspaper(c, w, h, r, { headline: o.headline }));
  box(g, 0.3, 0.012, 0.4, 'paper', 0, 0.006, 0);
  plane(g, 0.3, 0.4, m, 0, 0.0125, 0, { rx: -90, unitUv: true, noShadow: true });
  return { c: null, h: 0.02 };
});

def('lifebuoy', (g, o) => {
  const y = o.y ?? 1.7;
  const r = o.r ?? 0.3;
  for (let i = 0; i < 4; i++) {
    const seg = torus(g, r, 0.055, i % 2 ? '#b8b2a2' : '#8c2a22', 0, y, 0.06, { arc: Math.PI / 2, seg: 8 });
    seg.rotation.z = (i * Math.PI) / 2;
  }
  return { c: null, h: 0 };
});

def('shipWheel', (g, o) => {
  const y = o.y ?? 1.7;
  const r = o.r ?? 0.36;
  torus(g, r, 0.03, 'wood', 0, y, 0.05);
  cyl(g, 0.06, 0.06, 0.06, 'brassDull', 0, y, 0.05, 10, { rx: 90 });
  for (let i = 0; i < 4; i++) {
    const spoke = cyl(g, 0.016, 0.016, r * 2 + 0.2, 'wood', 0, y, 0.05, 6);
    spoke.rotation.z = (i * Math.PI) / 4;
  }
  return { c: null, h: 0 };
});

def('ropeCoil', (g, o) => {
  for (let i = 0; i < 4; i++) torus(g, 0.2 - i * 0.012, 0.025, 'rope', 0, 0.025 + i * 0.045, 0, { rx: 90, seg: 14 });
  return { c: [0.4, 0.4], h: 0.2 };
});

def('anchor', (g, o) => {
  const y = o.y ?? 1.5;
  box(g, 0.05, 0.8, 0.04, 'iron', 0, y, 0.03);
  box(g, 0.36, 0.045, 0.04, 'iron', 0, y + 0.3, 0.03);
  const arc = torus(g, 0.26, 0.028, 'iron', 0, y - 0.16, 0.03, { arc: Math.PI, seg: 12 });
  arc.rotation.z = Math.PI;
  torus(g, 0.06, 0.016, 'iron', 0, y + 0.45, 0.03, { seg: 10 });
  return { c: null, h: 0 };
});

def('waterCooler', (g) => {
  box(g, 0.32, 0.95, 0.32, 'enamelWhite', 0, 0.475, 0);
  cyl(g, 0.13, 0.13, 0.36, 'glassClear', 0, 1.14, 0, 12, { noShadow: true });
  cyl(g, 0.05, 0.13, 0.08, 'glassClear', 0, 1.0, 0, 12, { noShadow: true });
  box(g, 0.05, 0.03, 0.04, 'plasticRed', -0.06, 0.78, 0.17);
  box(g, 0.05, 0.03, 0.04, '#2a4a7a', 0.06, 0.78, 0.17);
  shadowBlob(g, 0.45, 0.45);
  return { c: [0.32, 0.32], h: 1.32 };
});

def('nameplate', (g, o) => {
  box(g, 0.24, 0.05, 0.05, 'woodBlack', 0, 0.025, 0);
  const m = artMaterial(`nameplate:${o.text}`, 256, 48, (c, w, h, r) => ART.sign(c, w, h, r, { text: o.text, bg: '#b8923f', fg: '#2a1c06', size: 0.5 }), { rough: 0.35 });
  plane(g, 0.22, 0.04, m, 0, 0.028, 0.026, { unitUv: true, noShadow: true });
  return { c: null, h: 0.05 };
});

def('vial', (g, o) => {
  cyl(g, 0.008, 0.008, 0.045, 'glassClear', 0, 0.008, 0, 6, { rz: 90 });
  cyl(g, 0.009, 0.009, 0.01, o.cap ?? 'plasticRed', 0.026, 0.008, 0, 6, { rz: 90 });
  return { c: null, h: 0.02 };
});

def('keys', (g) => {
  torus(g, 0.018, 0.003, 'steel', 0, 0.004, 0, { rx: 90, seg: 10 });
  box(g, 0.01, 0.003, 0.05, 'brass', 0.02, 0.004, 0.02, { ry: 20 });
  box(g, 0.01, 0.003, 0.045, 'steel', -0.015, 0.004, 0.022, { ry: -25 });
  return { c: null, h: 0.01 };
});

def('envelope', (g, o) => {
  box(g, 0.22, 0.004, 0.11, o.mat ?? 'paperWhite', 0, 0.002, 0, { ry: o.skew ?? -12 });
  return { c: null, h: 0.01 };
});

def('chain', (g, o) => {
  for (let i = 0; i < 5; i++) torus(g, 0.006, 0.0015, 'brass', i * 0.009, 0.004, (i % 2) * 0.002, { rx: i % 2 ? 90 : 0, seg: 8 });
  return { c: null, h: 0.01 };
});
