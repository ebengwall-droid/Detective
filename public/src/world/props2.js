// Prop library, part two: set pieces for specific places — crime scenes,
// the morgue, the precinct, the tavern, the yacht and the lighthouse.

import * as THREE from 'three';
import { box, cyl, sph, plane, lathe, torus, group } from './geo.js';
import { mat, glow, artMaterial, blobShadowMaterial } from './materials.js';
import { ART } from './art.js';
import { PROPS, def } from './props.js';

const WARM = 0xffb45e;
const COOL = 0xbfe0ee;

function shadowBlob(g, w, d, y = 0.012) {
  const m = plane(g, w * 1.25, d * 1.25, blobShadowMaterial(), 0, y, 0, { rx: -90, unitUv: true, dyn: true });
  m.renderOrder = 1;
  return m;
}

function doubleSided(material) {
  material.side = THREE.DoubleSide;
  return material;
}

// -------------------------------------------------------------- crime scene

/** A body under a sheet, lying along Z with the head toward -Z. */
def('bodySheet', (g, o) => {
  const m = o.mat ?? 'fabricWhite';
  const y = 0;
  const part = (r, sx, sy, sz, px, py, pz) => {
    const s = sph(g, r, m, px, y + py, pz, 10);
    s.scale.set(sx, sy, sz);
  };
  part(0.13, 1, 0.95, 1.05, 0, 0.12, -0.78);
  part(0.3, 0.92, 0.42, 1.2, 0, 0.11, -0.38);
  part(0.28, 0.9, 0.36, 1.1, 0, 0.09, 0.06);
  part(0.24, 0.85, 0.32, 1.9, 0, 0.07, 0.48);
  part(0.11, 1.3, 1.1, 0.8, 0, 0.11, 0.9);
  box(g, 0.66, 0.012, 2.02, m, 0, y + 0.008, 0.06);
  return { c: o.solid ? [0.66, 2.0] : null, h: 0.3 };
});

const OUTLINE = [
  [-0.1, -0.92], [0.1, -0.92], [0.16, -0.78], [0.1, -0.64], [0.3, -0.56], [0.52, -0.2], [0.42, -0.12],
  [0.24, -0.4], [0.22, 0.1], [0.3, 0.86], [0.12, 0.9], [0.02, 0.2], [-0.08, 0.9], [-0.26, 0.86],
  [-0.2, 0.1], [-0.24, -0.4], [-0.5, 0.02], [-0.6, -0.06], [-0.3, -0.56], [-0.1, -0.64], [-0.16, -0.78],
];

/** White tape outline of a body on the floor. */
def('bodyOutline', (g, o) => {
  const m = o.mat ?? 'chalk';
  const s = o.s ?? 1;
  for (let i = 0; i < OUTLINE.length; i++) {
    const [ax, az] = OUTLINE[i];
    const [bx, bz] = OUTLINE[(i + 1) % OUTLINE.length];
    const len = Math.hypot(bx - ax, bz - az) * s;
    const ang = Math.atan2(bx - ax, bz - az);
    const seg = box(g, 0.035, 0.004, len + 0.03, m, ((ax + bx) / 2) * s, 0.01, ((az + bz) / 2) * s, { noShadow: true });
    seg.rotation.y = ang;
  }
  return { c: null, h: 0.02 };
});

def('evidenceMarker', (g, o) => {
  const n = o.n ?? 1;
  const m = doubleSided(artMaterial(`marker:${n}`, 96, 96, (c, w, h, r) => ART.marker(c, w, h, r, { n })));
  for (const s of [-1, 1]) {
    const p = plane(g, 0.1, 0.12, m, 0, 0.056, s * 0.028, { unitUv: true, noShadow: true });
    p.rotation.x = s * -0.45;
    if (s < 0) p.rotation.y = Math.PI;
  }
  return { c: null, h: 0.12 };
});

def('tapeLine', (g, o) => {
  const len = o.len ?? 2;
  const y = o.hgt ?? 1.0;
  const m = doubleSided(artMaterial('policeTape', 1024, 32, (c, w, h) => ART.tape(c, w, h), { rough: 0.6 }));
  const p = plane(g, len, 0.075, m, 0, y, 0, { unitUv: true, noShadow: true });
  p.rotation.z = (o.sag ?? 0) * 0.02;
  if (o.posts) {
    for (const sx of [-1, 1]) {
      cyl(g, 0.015, 0.015, y + 0.06, 'steelDark', (sx * len) / 2, (y + 0.06) / 2, 0, 6);
      cyl(g, 0.12, 0.14, 0.03, 'rubber', (sx * len) / 2, 0.015, 0, 10);
    }
  }
  return { c: o.block ? [len, 0.1] : null, h: y };
});

/** Wet or dark patch on the floor. o.salt adds a pale tidemark ring. */
def('stain', (g, o) => {
  const r = o.r ?? 0.5;
  const m = artMaterial(`stain:${o.salt ? 's' : 'n'}:${o.tone ?? 'wet'}`, 256, 256, (c, w, h, rnd) => {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * w * 0.2;
      const rr = w * (0.14 + rnd() * 0.2);
      const x = w / 2 + Math.cos(a) * d;
      const y = h / 2 + Math.sin(a) * d;
      const gr = c.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, o.tone === 'ash' ? 'rgba(10,9,8,0.55)' : 'rgba(6,14,18,0.5)');
      gr.addColorStop(0.75, o.tone === 'ash' ? 'rgba(10,9,8,0.3)' : 'rgba(6,14,18,0.32)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr;
      c.fillRect(0, 0, w, h);
    }
    if (o.salt) {
      c.strokeStyle = 'rgba(225,230,225,0.42)';
      c.lineWidth = 3;
      c.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const rr = w * (0.33 + 0.05 * Math.sin(a * 3.1) + 0.03 * Math.sin(a * 7.3));
        const x = w / 2 + Math.cos(a) * rr;
        const y = h / 2 + Math.sin(a) * rr;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
  }, { transparent: true, rough: o.tone === 'ash' ? 1 : 0.15 });
  m.depthWrite = false;
  const p = plane(g, r * 2, r * 2, m, 0, 0.006, 0, { rx: -90, unitUv: true, noShadow: true, dyn: true });
  p.renderOrder = 2;
  return { c: null, h: 0.01 };
});

def('jerrycan', (g, o) => {
  box(g, 0.34, 0.44, 0.16, o.mat ?? 'enamelGreen', 0, 0.22, 0);
  box(g, 0.2, 0.03, 0.03, o.mat ?? 'enamelGreen', -0.02, 0.47, 0);
  cyl(g, 0.025, 0.025, 0.05, 'steelDark', 0.13, 0.46, 0, 8);
  for (const y of [0.14, 0.3]) box(g, 0.3, 0.02, 0.165, 'iron', 0, y, 0);
  return { c: [0.34, 0.2], h: 0.48 };
});

def('tripodCamera', (g, o) => {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = cyl(g, 0.012, 0.012, 1.35, 'steelDark', Math.cos(a) * 0.22, 0.64, Math.sin(a) * 0.22, 5);
    leg.rotation.z = Math.cos(a) * 0.33;
    leg.rotation.x = -Math.sin(a) * 0.33;
  }
  box(g, 0.16, 0.11, 0.09, 'plasticBlack', 0, 1.34, 0);
  cyl(g, 0.04, 0.045, 0.09, 'plasticBlack', 0, 1.34, 0.08, 10, { rx: 90 });
  box(g, 0.07, 0.04, 0.05, 'steel', 0, 1.42, -0.01);
  shadowBlob(g, 0.6, 0.6);
  return { c: [0.4, 0.4], h: 1.45 };
});

def('caseKit', (g) => {
  box(g, 0.46, 0.16, 0.3, 'plasticBlack', 0, 0.08, 0);
  const lid = group(g, 0, 0.16, -0.15);
  lid.rotation.x = -1.25;
  box(lid, 0.46, 0.05, 0.3, 'plasticBlack', 0, 0.025, 0.15);
  box(g, 0.4, 0.02, 0.24, 'fabricGrey', 0, 0.16, 0);
  for (let i = 0; i < 4; i++) cyl(g, 0.012, 0.012, 0.09, 'glassClear', -0.14 + i * 0.09, 0.19, 0.04, 6, { rz: 90 });
  return { c: [0.46, 0.3], h: 0.25 };
});

// ------------------------------------------------------------------- morgue

def('autopsyTable', (g, o, ctx) => {
  box(g, 0.76, 0.04, 2.04, 'steel', 0, 0.9, 0);
  box(g, 0.03, 0.05, 2.04, 'steel', -0.37, 0.935, 0);
  box(g, 0.03, 0.05, 2.04, 'steel', 0.37, 0.935, 0);
  box(g, 0.76, 0.05, 0.03, 'steel', 0, 0.935, -1.0);
  box(g, 0.76, 0.05, 0.03, 'steel', 0, 0.935, 1.0);
  cyl(g, 0.11, 0.13, 0.84, 'steelDark', 0, 0.44, 0, 12);
  box(g, 0.56, 0.05, 0.9, 'steelDark', 0, 0.025, 0);
  cyl(g, 0.04, 0.04, 0.3, 'steelDark', 0.2, 0.74, 0.9, 8);
  if (o.body) {
    const b = group(g, 0, 0.92, 0);
    PROPS.bodySheet(b, {}, ctx);
  }
  shadowBlob(g, 0.9, 2.1);
  return { c: [0.76, 2.04], h: 1.2 };
});

def('coldLockers', (g, o, ctx) => {
  const cols = o.cols ?? 3;
  const rows = o.rows ?? 3;
  const cw = 0.72;
  const rh = 0.64;
  const w = cols * cw + 0.1;
  const h = rows * rh + 0.2;
  box(g, w, h, 0.34, 'steelDark', 0, h / 2, 0);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = (c - (cols - 1) / 2) * cw;
      const y = 0.12 + rh / 2 + r * rh;
      const isOpen = o.open && o.open[0] === c && o.open[1] === r;
      if (isOpen) {
        box(g, cw - 0.1, rh - 0.1, 0.03, 'dark', x, y, 0.16);
        const tray = group(g, x, y - 0.22, 0.2);
        box(tray, cw - 0.14, 0.03, 1.9, 'steel', 0, 0, 0.95);
        const b = group(tray, 0, 0.02, 0.95);
        b.scale.setScalar(0.92);
        PROPS.bodySheet(b, {}, ctx);
        const doorG = group(g, x + cw / 2 - 0.04, y, 0.18);
        doorG.rotation.y = 1.45;
        box(doorG, cw - 0.06, rh - 0.06, 0.05, 'steel', -(cw - 0.06) / 2, 0, 0);
      } else {
        box(g, cw - 0.06, rh - 0.06, 0.05, 'steel', x, y, 0.185);
        box(g, 0.05, 0.2, 0.05, 'steelDark', x - cw / 2 + 0.12, y, 0.23);
        box(g, 0.14, 0.07, 0.004, 'paperWhite', x + 0.12, y + 0.14, 0.213);
      }
    }
  }
  return { c: [w, 0.4], h };
});

def('sink', (g, o) => {
  const w = o.w ?? 1.3;
  box(g, w, 0.86, 0.58, 'steelDark', 0, 0.43, 0);
  box(g, w + 0.04, 0.04, 0.62, 'steel', 0, 0.88, 0);
  box(g, 0.5, 0.012, 0.36, 'dark', -w * 0.18, 0.902, 0.02);
  cyl(g, 0.016, 0.016, 0.28, 'steel', -w * 0.18, 1.04, -0.22, 8);
  cyl(g, 0.014, 0.014, 0.18, 'steel', -w * 0.18, 1.17, -0.14, 8, { rx: 90 });
  box(g, w, 0.5, 0.02, 'steel', 0, 1.15, -0.3);
  shadowBlob(g, w, 0.7);
  return { c: [w, 0.6], h: 1.2 };
});

def('instrumentCart', (g, o, ctx) => {
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      cyl(g, 0.012, 0.012, 0.8, 'steel', sx * 0.27, 0.45, sz * 0.19, 6);
      cyl(g, 0.03, 0.03, 0.02, 'rubber', sx * 0.27, 0.03, sz * 0.19, 8, { rz: 90 });
    }
  }
  box(g, 0.6, 0.02, 0.44, 'steel', 0, 0.84, 0);
  box(g, 0.6, 0.02, 0.44, 'steel', 0, 0.36, 0);
  box(g, 0.34, 0.012, 0.24, 'steelDark', -0.08, 0.857, 0);
  for (let i = 0; i < 6; i++) {
    box(g, 0.012, 0.006, 0.14 + ctx.rnd() * 0.06, 'steel', -0.2 + i * 0.045, 0.868, (ctx.rnd() - 0.5) * 0.04);
  }
  lathe(g, [[0, 0.85], [0.07, 0.85], [0.085, 0.9], [0.075, 0.9], [0, 0.865]], 'steel', 0.19, 0, 0.08, 10);
  shadowBlob(g, 0.7, 0.55);
  return { c: [0.6, 0.44], h: 0.9 };
});

def('surgicalLight', (g, o, ctx) => {
  const ceil = ctx.ceil ?? 3;
  const y = o.hang ?? 2.05;
  cyl(g, 0.03, 0.03, ceil - y - 0.1, 'steelDark', 0, y + 0.1 + (ceil - y - 0.1) / 2, 0, 8);
  cyl(g, 0.36, 0.3, 0.1, 'steel', 0, y + 0.05, 0, 18);
  const on = o.lit !== false;
  cyl(g, 0.3, 0.3, 0.01, on ? glow(0xf0faff, 2.4) : 'glassClear', 0, y - 0.005, 0, 18, { dyn: on });
  if (on) {
    ctx.halo(g, COOL, 1.4, 0, y - 0.05, 0, 0.5);
    if (o.light !== false) {
      ctx.light(g, {
        color: 0xe4f4ff,
        intensity: o.intensity ?? 40,
        distance: 9,
        x: 0,
        y: y - 0.08,
        z: 0,
        spot: { angle: o.angle ?? 0.75, penumbra: 0.55, target: [0, 0, 0] },
        shadow: o.shadow !== false,
      });
    }
  }
  return { c: null, h: 0 };
});

def('specimenFridge', (g, o, ctx) => {
  box(g, 0.75, 1.9, 0.62, 'enamelWhite', 0, 0.95, 0);
  box(g, 0.63, 1.5, 0.02, glow(0xbfeaff, 0.5), 0, 1.02, 0.25, { dyn: true });
  for (let r = 0; r < 4; r++) {
    box(g, 0.63, 0.015, 0.3, 'steel', 0, 0.42 + r * 0.36, 0.16);
    for (let i = 0; i < 6; i++) {
      cyl(g, 0.03, 0.03, 0.09 + ctx.rnd() * 0.05, ctx.rnd() > 0.5 ? 'glassBottleAmber' : 'glassClear', -0.25 + i * 0.1, 0.48 + r * 0.36, 0.2 + (ctx.rnd() - 0.5) * 0.08, 8, { noShadow: true });
    }
  }
  box(g, 0.66, 1.56, 0.02, 'glassClear', 0, 1.02, 0.315, { noShadow: true });
  box(g, 0.03, 0.4, 0.04, 'steel', 0.28, 1.0, 0.345);
  ctx.halo(g, COOL, 1.6, 0, 1.0, 0.4, 0.22);
  shadowBlob(g, 0.9, 0.75);
  return { c: [0.75, 0.62], h: 1.9 };
});

/** Wall-mounted X-ray viewer. */
def('lightbox', (g, o) => {
  const y = o.y ?? 1.55;
  box(g, 0.9, 0.56, 0.06, 'steelDark', 0, y, 0.03);
  const m = artMaterial('xray', 384, 256, (c, w, h, rnd) => {
    c.fillStyle = '#cfe9f2';
    c.fillRect(0, 0, w, h);
    for (const ox of [w * 0.27, w * 0.73]) {
      c.fillStyle = '#0a141a';
      c.fillRect(ox - w * 0.2, h * 0.06, w * 0.4, h * 0.88);
      c.strokeStyle = 'rgba(190,225,235,0.75)';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(ox, h * 0.1);
      c.lineTo(ox, h * 0.9);
      c.stroke();
      c.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const yy = h * (0.2 + i * 0.08);
        for (const s of [-1, 1]) {
          c.beginPath();
          c.moveTo(ox, yy);
          c.quadraticCurveTo(ox + s * w * 0.14, yy - h * 0.02, ox + s * w * 0.15, yy + h * 0.07);
          c.stroke();
        }
      }
      for (let i = 0; i < 80; i++) {
        c.fillStyle = `rgba(190,225,235,${rnd() * 0.08})`;
        c.fillRect(ox - w * 0.2 + rnd() * w * 0.4, h * 0.06 + rnd() * h * 0.88, 6, 6);
      }
    }
  }, { basic: true });
  plane(g, 0.84, 0.5, m, 0, y, 0.062, { unitUv: true, dyn: true });
  return { c: null, h: 0 };
});

def('clipboard', (g, o) => {
  box(g, 0.24, 0.008, 0.33, '#5a4630', 0, 0.004, 0);
  const m = artMaterial(`typed:clip:${o.title ?? ''}`, 256, 340, (c, w, h, r) => ART.typed(c, w, h, r, { title: o.title ?? 'AUTOPSY REPORT', lines: 12, bg: '#e8e6dc' }));
  plane(g, 0.21, 0.297, m, 0, 0.0095, 0.008, { rx: -90, unitUv: true, noShadow: true });
  box(g, 0.1, 0.02, 0.03, 'steel', 0, 0.02, -0.15);
  return { c: null, h: 0.03 };
});

// ----------------------------------------------------------------- precinct

/** Half-glazed office partition, o.len long. Optional gold lettering. */
def('glassWall', (g, o) => {
  const len = o.len ?? 3;
  const top = o.top ?? 2.35;
  box(g, len, 1.0, 0.08, o.mat ?? 'wallPanel', 0, 0.5, 0);
  box(g, len, 0.06, 0.1, 'woodBlack', 0, 1.03, 0);
  box(g, len, 0.08, 0.1, 'woodBlack', 0, top, 0);
  const n = Math.max(1, Math.round(len / 0.95));
  for (let i = 0; i <= n; i++) box(g, 0.05, top - 1.0, 0.07, 'woodBlack', -len / 2 + (len * i) / n, (top + 1.0) / 2, 0);
  box(g, len - 0.04, top - 1.06, 0.012, 'glassDark', 0, (top + 1.04) / 2, 0, { noShadow: true });
  if (o.blinds) {
    const nb = Math.round((top - 1.1) / 0.06);
    for (let i = 0; i < nb; i++) box(g, len - 0.1, 0.004, 0.03, '#a59c84', 0, 1.1 + i * 0.06, -0.035, { rx: 30 });
  }
  if (o.text) {
    const lm = artMaterial(`lettering:${o.text}:${o.sub ?? ''}`, 512, 256, (c, cw, ch, r) => ART.lettering(c, cw, ch, r, { text: o.text, sub: o.sub }), { transparent: true, basic: true });
    plane(g, 0.8, 0.4, lm, o.textX ?? 0, 1.72, 0.012, { unitUv: true, dyn: true });
  }
  return { c: [len, 0.12], h: top };
});

/** Steel mesh partition for the evidence cage. */
def('cage', (g, o) => {
  const len = o.len ?? 3;
  const h = o.h ?? 2.4;
  const m = doubleSided(artMaterial('mesh', 128, 128, (c, w, hh) => {
    c.clearRect(0, 0, w, hh);
    c.strokeStyle = 'rgba(70,78,84,0.9)';
    c.lineWidth = 3;
    for (let i = -w; i < w * 2; i += 32) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i + hh, hh);
      c.moveTo(i, hh);
      c.lineTo(i + hh, 0);
      c.stroke();
    }
  }, { transparent: true, rough: 0.5 }));
  const tex = m.map;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const p = plane(g, len, h, m, 0, h / 2, 0, { noShadow: true, dyn: true });
  // plane() wrote UVs in metres; 4 repeats per metre reads as chain-link.
  const uv = p.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.2, uv.getY(i) * 2.2);
  const n = Math.max(1, Math.round(len / 1.2));
  for (let i = 0; i <= n; i++) box(g, 0.05, h, 0.05, 'steelDark', -len / 2 + (len * i) / n, h / 2, 0);
  box(g, len, 0.05, 0.05, 'steelDark', 0, h, 0);
  box(g, len, 0.05, 0.05, 'steelDark', 0, 0.03, 0);
  box(g, len, 0.04, 0.04, 'steelDark', 0, 1.1, 0);
  return { c: [len, 0.1], h };
});

def('coffee', (g, o) => {
  PROPS.table(g, { w: 0.8, d: 0.5, h: 0.85, mat: 'woodDark' }, null);
  cyl(g, 0.11, 0.11, 0.32, 'steel', -0.18, 1.01, 0, 12);
  cyl(g, 0.12, 0.1, 0.03, 'plasticBlack', -0.18, 1.185, 0, 12);
  for (let i = 0; i < 3; i++) cyl(g, 0.04, 0.035, 0.09, 'ceramic', 0.08 + i * 0.1, 0.895, 0.05 * (i % 2), 8);
  return { c: [0.8, 0.5], h: 1.2 };
});

def('tray', (g, o) => {
  box(g, 0.26, 0.012, 0.34, 'steelDark', 0, 0.006, 0);
  for (const sx of [-1, 1]) box(g, 0.012, 0.05, 0.34, 'steelDark', sx * 0.13, 0.03, 0);
  box(g, 0.26, 0.05, 0.012, 'steelDark', 0, 0.03, -0.17);
  if (o.papers !== false) box(g, 0.21, 0.02, 0.29, 'paperWhite', 0, 0.022, 0, { ry: 3 });
  return { c: null, h: 0.06 };
});

// ------------------------------------------------------------------- tavern

def('backbar', (g, o, ctx) => {
  const len = o.len ?? 3;
  box(g, len, 0.95, 0.45, 'woodDark', 0, 0.475, 0);
  box(g, len + 0.04, 0.04, 0.5, 'wood', 0, 0.97, 0);
  box(g, len, 1.5, 0.04, 'woodDark', 0, 1.74, -0.2);
  box(g, len - 0.5, 0.9, 0.012, 'glassDark', 0, 1.7, -0.175, { noShadow: true });
  for (const y of [1.3, 1.72, 2.12]) {
    box(g, len, 0.03, 0.2, 'wood', 0, y, -0.09);
    const row = group(g, 0, y + 0.015, -0.09);
    fillBottles(row, -len / 2 + 0.06, len / 2 - 0.06, ctx.rnd);
  }
  box(g, len + 0.1, 0.1, 0.3, 'woodDark', 0, 2.52, -0.08);
  return { c: [len, 0.5], h: 2.5 };
});

function fillBottles(g, x0, x1, rnd) {
  let x = x0;
  while (x < x1) {
    const r = 0.03 + rnd() * 0.012;
    const h = 0.2 + rnd() * 0.1;
    const m = rnd() > 0.5 ? 'glassBottleGreen' : rnd() > 0.5 ? 'glassBottleAmber' : 'glassClear';
    cyl(g, r, r, h * 0.65, m, x + r, h * 0.325, (rnd() - 0.5) * 0.05, 8, { noShadow: true });
    cyl(g, r * 0.35, r * 0.8, h * 0.35, m, x + r, h * 0.82, 0, 8, { noShadow: true });
    x += r * 2 + 0.025 + rnd() * 0.05;
  }
}

def('beerTaps', (g, o) => {
  cyl(g, 0.035, 0.045, 0.3, 'brass', 0, 0.15, 0, 10);
  box(g, 0.34, 0.05, 0.06, 'brass', 0, 0.3, 0);
  for (let i = -1; i <= 1; i++) {
    cyl(g, 0.012, 0.012, 0.07, 'brass', i * 0.12, 0.26, 0.05, 6, { rx: 60 });
    cyl(g, 0.018, 0.014, 0.16, i === 0 ? 'woodBlack' : 'ceramic', i * 0.12, 0.41, 0, 8);
  }
  return { c: null, h: 0.5 };
});

def('keg', (g, o) => {
  const k = group(g, 0, 0.36, 0);
  k.rotation.z = Math.PI / 2;
  lathe(k, [[0, -0.4], [0.22, -0.4], [0.28, -0.15], [0.29, 0], [0.28, 0.15], [0.22, 0.4], [0, 0.4]], 'wood', 0, 0, 0, 14);
  for (const y of [-0.3, 0, 0.3]) torus(k, y === 0 ? 0.292 : 0.255, 0.012, 'iron', 0, y, 0, { rx: 90 });
  for (const sx of [-0.25, 0.25]) box(g, 0.06, 0.14, 0.5, 'woodDark', sx, 0.07, 0);
  cyl(g, 0.012, 0.012, 0.08, 'brass', 0.42, 0.26, 0, 6, { rz: 90 });
  shadowBlob(g, 0.9, 0.6);
  return { c: [0.82, 0.56], h: 0.66 };
});

def('dartboard', (g, o) => {
  const y = o.y ?? 1.7;
  const m = artMaterial('dartboard', 256, 256, (c, w, h) => {
    c.fillStyle = '#1a1612';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 20; i++) {
      c.fillStyle = i % 2 ? '#d9cfb0' : '#17130f';
      c.beginPath();
      c.moveTo(w / 2, h / 2);
      c.arc(w / 2, h / 2, w * 0.46, (i * Math.PI) / 10, ((i + 1) * Math.PI) / 10);
      c.fill();
    }
    for (const [r, col] of [[0.3, '#7a1f1a'], [0.27, null], [0.07, '#2f5a38'], [0.035, '#7a1f1a']]) {
      if (!col) continue;
      c.strokeStyle = col;
      c.lineWidth = r > 0.1 ? 8 : w * r;
      c.beginPath();
      c.arc(w / 2, h / 2, w * r, 0, Math.PI * 2);
      c.stroke();
    }
  });
  const p = new THREE.Mesh(new THREE.CircleGeometry(0.23, 24), m);
  p.position.set(0, y, 0.03);
  g.add(p);
  cyl(g, 0.25, 0.25, 0.025, 'woodBlack', 0, y, 0.0125, 20, { rx: 90 });
  return { c: null, h: 0 };
});

def('piano', (g) => {
  box(g, 1.45, 1.2, 0.5, 'woodBlack', 0, 0.6, -0.08);
  box(g, 1.45, 0.06, 0.36, 'woodBlack', 0, 0.72, 0.27);
  box(g, 1.3, 0.012, 0.14, 'ceramic', 0, 0.756, 0.34);
  for (let i = 0; i < 26; i++) {
    if (i % 7 === 2 || i % 7 === 6) continue;
    box(g, 0.022, 0.012, 0.08, 'dark', -0.62 + i * 0.05, 0.768, 0.31);
  }
  for (const sx of [-1, 1]) box(g, 0.08, 0.7, 0.08, 'woodBlack', sx * 0.66, 0.35, 0.36);
  shadowBlob(g, 1.6, 0.8);
  return { c: [1.45, 0.7], h: 1.2 };
});

// -------------------------------------------------------------------- yacht

def('bunk', (g, o) => {
  const len = o.len ?? 1.9;
  box(g, 0.75, 0.45, len, 'wallTeak', 0, 0.225, 0);
  box(g, 0.7, 0.12, len - 0.06, o.mat ?? 'fabricNavy', 0, 0.51, 0);
  box(g, 0.42, 0.09, 0.3, 'fabricWhite', 0, 0.6, -len / 2 + 0.24);
  box(g, 0.04, 0.2, len, 'wallTeak', 0.375, 0.55, 0);
  return { c: [0.75, len], h: 0.7 };
});

def('chartTable', (g, o, ctx) => {
  box(g, 1.1, 0.7, 0.7, 'wallTeak', 0, 0.35, 0);
  const top = group(g, 0, 0.72, 0);
  top.rotation.x = 0.14;
  box(top, 1.14, 0.04, 0.74, 'wallTeak', 0, 0.04, 0);
  const m = artMaterial('chart', 768, 512, (c, w, h, r) => ART.chart(c, w, h, r));
  plane(top, 0.9, 0.58, m, 0, 0.062, 0, { rx: -90, unitUv: true, noShadow: true });
  for (let i = 0; i < 3; i++) {
    box(g, 0.3, 0.14, 0.02, 'woodDark', -0.36 + i * 0.36, 0.5, 0.355);
    sph(g, 0.014, 'brass', -0.36 + i * 0.36, 0.5, 0.372, 6);
  }
  return { c: [1.1, 0.72], h: 0.9 };
});

def('galley', (g, o) => {
  const len = o.len ?? 1.4;
  box(g, len, 0.86, 0.55, 'wallTeak', 0, 0.43, 0);
  box(g, len + 0.03, 0.035, 0.58, 'steel', 0, 0.88, 0);
  box(g, 0.36, 0.01, 0.3, 'dark', -len / 4, 0.9, 0);
  cyl(g, 0.012, 0.012, 0.18, 'steel', -len / 4, 0.98, -0.2, 6);
  for (const dx of [-0.11, 0.11]) torus(g, 0.07, 0.008, 'iron', len / 4 + dx, 0.905, 0, { rx: 90, seg: 12 });
  for (let i = 0; i < 2; i++) {
    box(g, len / 2 - 0.08, 0.5, 0.02, 'woodDark', -len / 4 + (i * len) / 2, 0.42, 0.28);
    sph(g, 0.014, 'brass', -len / 4 + (i * len) / 2 + 0.2, 0.5, 0.295, 6);
  }
  return { c: [len, 0.56], h: 0.92 };
});

/** Wall-mounted brass porthole with rain on the glass. */
def('porthole', (g, o, ctx) => {
  const y = o.y ?? 1.45;
  const r = o.r ?? 0.17;
  torus(g, r, 0.028, 'brass', 0, y, 0.03, { seg: 18 });
  const m = ctx.rainMaterial();
  const p = new THREE.Mesh(new THREE.CircleGeometry(r, 20), m);
  p.position.set(0, y, 0.02);
  p.userData.dyn = true;
  g.add(p);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    sph(g, 0.012, 'brass', Math.cos(a) * r, y + Math.sin(a) * r, 0.055, 5);
  }
  return { c: null, h: 0 };
});

def('companionway', (g, o, ctx) => {
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    box(g, 0.7, 0.04, 0.24, 'wallTeak', 0, 0.3 + i * 0.3, -i * 0.2);
  }
  for (const sx of [-1, 1]) {
    const rail = box(g, 0.05, 0.1, 2.0, 'wallTeak', sx * 0.37, 0.85, -0.42);
    rail.rotation.x = -0.98;
    cyl(g, 0.014, 0.014, 1.9, 'brass', sx * 0.4, 1.25, -0.4, 6, { rx: -34 });
  }
  const ceil = ctx.ceil ?? 2.1;
  box(g, 0.84, 0.05, 0.9, 'woodDark', 0, ceil - 0.02, -0.9);
  plane(g, 0.74, 0.8, glow(0x8fb6c8, 0.5), 0, ceil - 0.05, -0.9, { rx: 90, dyn: true });
  ctx.halo(g, COOL, 1.6, 0, ceil - 0.2, -0.9, 0.25);
  return { c: [0.8, 1.2], h: ceil };
});

def('beam', (g, o, ctx) => {
  const ceil = ctx.ceil ?? 2.4;
  box(g, o.len ?? 4, o.h ?? 0.14, o.t ?? 0.12, o.mat ?? 'woodDark', 0, ceil - (o.h ?? 0.14) / 2, 0);
  return { c: null, h: 0 };
});

def('barometer', (g, o) => {
  const y = o.y ?? 1.6;
  cyl(g, 0.11, 0.11, 0.04, 'brass', 0, y, 0.02, 18, { rx: 90 });
  cyl(g, 0.09, 0.09, 0.01, 'ceramic', 0, y, 0.042, 18, { rx: 90 });
  box(g, 0.006, 0.07, 0.004, 'dark', 0.012, y + 0.02, 0.05, { rz: -30 });
  return { c: null, h: 0 };
});

def('shipModel', (g, o) => {
  box(g, 0.9, 0.04, 0.3, 'woodBlack', 0, 0.02, 0);
  const hull = box(g, 0.66, 0.08, 0.14, '#23282c', 0, 0.12, 0);
  hull.scale.set(1, 1, 1);
  box(g, 0.5, 0.07, 0.11, 'paperWhite', -0.02, 0.19, 0);
  box(g, 0.3, 0.05, 0.09, 'paperWhite', -0.04, 0.25, 0);
  cyl(g, 0.03, 0.035, 0.12, '#8c2a22', 0, 0.33, 0, 8);
  cyl(g, 0.004, 0.004, 0.2, 'woodDark', 0.24, 0.26, 0, 4);
  box(g, 0.86, 0.5, 0.26, 'glassClear', 0, 0.29, 0, { noShadow: true });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) box(g, 0.012, 0.5, 0.012, 'brassDull', sx * 0.43, 0.29, sz * 0.13);
  }
  return { c: null, h: 0.55 };
});

def('telescope', (g, o) => {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = cyl(g, 0.014, 0.014, 1.25, 'woodDark', Math.cos(a) * 0.2, 0.6, Math.sin(a) * 0.2, 5);
    leg.rotation.z = Math.cos(a) * 0.32;
    leg.rotation.x = -Math.sin(a) * 0.32;
  }
  const tube = group(g, 0, 1.25, 0);
  tube.rotation.x = -0.25;
  cyl(tube, 0.035, 0.045, 0.6, 'brass', 0, 0, 0.1, 10, { rx: 90 });
  cyl(tube, 0.025, 0.03, 0.3, 'brassDull', 0, 0, -0.3, 10, { rx: 90 });
  shadowBlob(g, 0.6, 0.6);
  return { c: [0.4, 0.4], h: 1.4 };
});

def('globe', (g) => {
  cyl(g, 0.11, 0.13, 0.03, 'woodDark', 0, 0.015, 0, 12);
  cyl(g, 0.012, 0.012, 0.12, 'brassDull', 0, 0.09, 0, 6);
  sph(g, 0.14, '#3c5a5e', 0, 0.28, 0, 14);
  torus(g, 0.155, 0.006, 'brassDull', 0, 0.28, 0, { seg: 18, arc: Math.PI });
  return { c: null, h: 0.45 };
});

// --------------------------------------------------------------- lighthouse

/** The great Fresnel lens of Marrow Point light. o.lit switches the beam on. */
def('lens', (g, o, ctx) => {
  cyl(g, 0.72, 0.8, 0.9, 'iron', 0, 0.45, 0, 16);
  cyl(g, 0.86, 0.86, 0.06, 'brassDull', 0, 0.93, 0, 20);
  const rotor = group(g, 0, 0.96, 0);
  rotor.userData.dyn = true;
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9fd0c8, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.32 });
  const profile = [[0.42, 0], [0.62, 0.22], [0.74, 0.5], [0.78, 0.8], [0.74, 1.1], [0.62, 1.38], [0.42, 1.6]];
  const body = lathe(rotor, profile, glassMat, 0, 0, 0, 16);
  body.material.side = THREE.DoubleSide;
  for (let i = 0; i < profile.length; i++) torus(rotor, profile[i][0] + 0.01, 0.014, 'brass', 0, profile[i][1], 0, { rx: 90, seg: 20 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    for (let k = 0; k < profile.length - 1; k++) {
      const [r0, y0] = profile[k];
      const [r1, y1] = profile[k + 1];
      const len = Math.hypot(r1 - r0, y1 - y0);
      const bar = box(rotor, 0.022, len, 0.022, 'brass', 0, 0, 0);
      const holder = group(rotor);
      holder.rotation.y = a;
      holder.add(bar);
      bar.position.set((r0 + r1) / 2, (y0 + y1) / 2, 0);
      bar.rotation.z = -Math.atan2(r1 - r0, y1 - y0);
    }
  }
  cyl(rotor, 0.44, 0.44, 0.04, 'brass', 0, 1.62, 0, 16);
  cyl(rotor, 0.08, 0.1, 0.5, 'brassDull', 0, 0.55, 0, 10);
  const lamp = sph(rotor, 0.12, o.lit ? glow(0xfff2c0, 3) : mat('glassClear'), 0, 0.86, 0, 10);
  lamp.userData.dyn = true;
  let beam = null;
  if (o.lit) {
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    beam = group(rotor, 0, 0.86, 0);
    for (const dir of [1, -1]) {
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 2.6, 22, 12, 1, true), beamMat);
      cone.rotation.z = (dir * Math.PI) / 2;
      cone.position.x = dir * 11.4;
      beam.add(cone);
    }
    ctx.halo(g, WARM, 4, 0, 1.8, 0, 0.75);
    ctx.light(g, { color: 0xffe2a8, intensity: o.intensity ?? 30, distance: 14, x: 0, y: 1.9, z: 0 });
  }
  ctx.anim((t) => {
    rotor.rotation.y = t * (o.lit ? 0.5 : 0.04);
  });
  shadowBlob(g, 2, 2);
  return { c: [1.7, 1.7], h: 2.6 };
});

def('hatch', (g, o) => {
  box(g, 0.9, 0.05, 0.9, 'iron', 0, 0.025, 0);
  box(g, 0.74, 0.02, 0.74, 'dark', 0, 0.045, 0);
  for (const sx of [-1, 1]) {
    cyl(g, 0.02, 0.02, 1.0, 'iron', sx * 0.3, 0.5, -0.36, 6);
  }
  cyl(g, 0.02, 0.02, 0.6, 'iron', 0, 1.0, -0.36, 6, { rz: 90 });
  return { c: null, h: 1.0 };
});

/** A figure seated on the floor, bound. Used for the captain in the finale. */
def('ropeLoop', (g) => {
  for (let i = 0; i < 3; i++) torus(g, 0.22, 0.014, 'rope', 0, 0.5 + i * 0.05, 0, { rx: 90, seg: 14 });
  return { c: null, h: 0 };
});
