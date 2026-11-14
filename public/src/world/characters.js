// People: smooth stylised figures built in code and animated procedurally.
//
// Bodies are shaped from lathes, capsules and spheres. Faces and clothes are
// painted onto canvases, so a face can blink, speak and change expression by
// being redrawn, and a jacket can have lapels and buttons without modelling
// them. Hair and beards are shells grown from the same skull the head is made
// of, so they sit on it properly. Appearance comes from the case file, so the
// same code draws everyone.

import * as THREE from 'three';
import { blobShadowMaterial } from './materials.js';
import { figureLight, rimLit } from './figure-light.js';
import { createPerson } from './people.js';

export { figureLight };

// ------------------------------------------------------------------ materials

const matCache = new Map();
function color(hex, rough = 0.85, metal = 0, side = THREE.FrontSide) {
  const key = `${hex}:${rough}:${metal}:${side}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: metal, side });
    if (!metal) rimLit(m);
    matCache.set(key, m);
  }
  return m;
}
const SKIN_ROUGH = 0.64;
const brass = () => color('#c9a14a', 0.36, 0.55);

let strandTex = null;
/** Fine streaks running from the crown down, so hair catches the light as hair and not as a painted cap. */
function strands() {
  if (strandTex) return strandTex;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const c = canvas.getContext('2d');
  c.fillStyle = '#d9d9d9';
  c.fillRect(0, 0, size, size);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 520; i++) {
    const x = rnd() * size;
    const light = rnd() > 0.72;
    c.strokeStyle = light ? `rgba(255,255,255,${0.05 + rnd() * 0.14})` : `rgba(0,0,0,${0.05 + rnd() * 0.17})`;
    c.lineWidth = 0.6 + rnd() * 1.8;
    c.beginPath();
    c.moveTo(x, -4);
    c.bezierCurveTo(x + (rnd() - 0.5) * 9, size * 0.33, x + (rnd() - 0.5) * 9, size * 0.66, x + (rnd() - 0.5) * 12, size + 4);
    c.stroke();
  }
  // The left and right edges must match, because the texture wraps round the head.
  const edge = c.getImageData(0, 0, 6, size);
  c.putImageData(edge, size - 6, 0);
  strandTex = new THREE.CanvasTexture(canvas);
  strandTex.colorSpace = THREE.SRGBColorSpace;
  strandTex.wrapS = THREE.RepeatWrapping;
  strandTex.repeat.set(2, 1);
  strandTex.anisotropy = 4;
  return strandTex;
}
function hairMaterial(hex, side = THREE.FrontSide) {
  const key = `hair:${hex}:${side}`;
  let m = matCache.get(key);
  if (!m) {
    m = rimLit(new THREE.MeshStandardMaterial({ color: new THREE.Color(shade(hex, 1.08)), map: strands(), bumpMap: strands(), bumpScale: 0.9, roughness: 0.58, side }), 0.22);
    matCache.set(key, m);
  }
  return m;
}

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 14);
const smooth = (t) => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};
const shade = (hex, f) => {
  const c = new THREE.Color(hex);
  if (f >= 1) c.lerp(new THREE.Color('#ffffff'), f - 1);
  else c.multiplyScalar(f);
  return `#${c.getHexString()}`;
};
const hsl = (hex) => new THREE.Color(hex).getHSL({ h: 0, s: 0, l: 0 });

const BUILD = {
  slim: { w: 0.9, d: 0.9 },
  medium: { w: 1, d: 1 },
  heavy: { w: 1.22, d: 1.3 },
};

/** Grey or white hair: the face gets lines to go with it. */
const isGrey = (hex) => {
  const c = hsl(hex);
  return c.l > 0.42 && c.s < 0.16;
};
const feminine = (a) =>
  a.feminine ?? (['bob', 'bun', 'long', 'ponytail'].includes(a.hair?.style) || (!a.beard && !a.moustache && ['apron', 'dress', 'cardigan'].includes(a.coat?.length)));

// ------------------------------------------------------------------------ head

const HEAD_R = 0.112;
const HEAD_Y = 0.1; // centre of the skull above the head joint
const scratch = new THREE.Vector3();

/**
 * Where a direction from the centre of the head meets the skull, in units of
 * HEAD_R. An egg: full at the back, narrowing to the jaw, with a chin under the mouth.
 */
function skull(dx, dy, dz, out = scratch) {
  const low = smooth((0.15 - dy) / 1.05); // 0 above the eyes, 1 at the chin
  out.x = dx * 0.9 * (1 - 0.17 * low);
  out.z = dz * (dz > 0 ? 0.97 : 1.06) * (1 - 0.1 * low) + Math.max(0, dz) * (0.1 * low + 0.28 * Math.exp(-(((dy + 0.82) / 0.21) ** 2)));
  out.y = (dy < -0.6 ? -0.6 + (dy + 0.6) * 0.8 : dy) * 1.13;
  return out;
}

/** A sphere is cut down one side and pinched at the poles; make the shading run smoothly across both. */
function weld(g, W, H) {
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let j = 0; j <= H; j++) {
    const a = j * (W + 1);
    const b = a + W;
    const nx = n.getX(a) + n.getX(b);
    const ny = n.getY(a) + n.getY(b);
    const nz = n.getZ(a) + n.getZ(b);
    const len = Math.hypot(nx, ny, nz) || 1;
    n.setXYZ(a, nx / len, ny / len, nz / len);
    n.setXYZ(b, nx / len, ny / len, nz / len);
  }
  for (let i = 0; i <= W; i++) {
    n.setXYZ(i, 0, 1, 0);
    n.setXYZ(H * (W + 1) + i, 0, -1, 0);
  }
  return g;
}

const bell = (v, centre, width) => Math.exp(-(((v - centre) / width) ** 2));

/**
 * The face has relief of its own: a nose, a brow, sockets for the eyes, lips.
 * Returns how far forward to push the skull there, in units of HEAD_R.
 */
function relief(dx, dy, dz, strength) {
  if (dz <= 0) return 0;
  const phi = Math.atan2(dx, dz); // 0 at the nose
  const side = Math.abs(phi);
  let push = 0;
  // Nose: a ridge that grows from between the eyes to the tip, then tucks back under.
  const along = (0.15 - dy) / 0.41; // 0 at the top of the bridge, 1 at the tip
  if (along > -0.25 && along < 1.3) {
    const height = along < 1 ? 0.035 + 0.15 * smooth(along) : 0.185 * (1 - smooth((along - 1) / 0.3));
    const width = 0.05 + 0.065 * smooth(along);
    push += strength * height * bell(phi, 0, width) * smooth((along + 0.25) / 0.25);
  }
  push += 0.022 * strength * bell(dy, 0.3, 0.1) * bell(side, 0.4, 0.42); // brow
  push -= 0.04 * bell(dy, 0.1, 0.11) * bell(side, 0.41, 0.2); // eye sockets
  push += 0.022 * bell(dy, -0.5, 0.12) * bell(phi, 0, 0.3); // lips
  push += 0.02 * bell(dy, -0.2, 0.2) * bell(side, 0.75, 0.3); // cheeks
  return push * dz;
}

const headCache = new Map();

/**
 * The head. Its front half takes the painted face; the back half is plain skin under the hair.
 * @param {number} strength how pronounced the nose and brow are
 */
function headGeometry(strength = 1) {
  if (headCache.has(strength)) return headCache.get(strength);
  const W = 96;
  const H = 64;
  const g = new THREE.SphereGeometry(1, W, H);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const u0 = new Float32Array(uv.count);
  for (let i = 0; i < pos.count; i++) {
    const dx = pos.getX(i);
    const dy = pos.getY(i);
    const dz = pos.getZ(i);
    const p = skull(dx, dy, dz);
    p.z += relief(dx, dy, dz, strength);
    pos.setXYZ(i, p.x * HEAD_R, p.y * HEAD_R, p.z * HEAD_R);
    u0[i] = uv.getX(i);
    uv.setX(i, Math.min(1, u0[i] * 2));
  }
  // Front triangles first, then the back, as two material groups.
  const index = g.index.array;
  const front = [];
  const back = [];
  for (let i = 0; i < index.length; i += 3) {
    const mid = (u0[index[i]] + u0[index[i + 1]] + u0[index[i + 2]]) / 3;
    (mid < 0.5 ? front : back).push(index[i], index[i + 1], index[i + 2]);
  }
  g.setIndex([...front, ...back]);
  g.clearGroups();
  g.addGroup(0, front.length, 0);
  g.addGroup(front.length, back.length, 1);
  weld(g, W, H);
  g.userData.shared = true;
  headCache.set(strength, g);
  return g;
}

const shellCache = new Map();

/**
 * Hair, or a beard: the skull again, pushed out where there is hair and pulled
 * just under the skin where there is not. The hairline is wherever the two
 * surfaces cross, so it comes out as a clean curve, not a row of steps.
 * @param {string} key cache key
 * @param {(dx: number, dy: number, dz: number, A: number) => number} depth thickness there, as a fraction of the head's radius
 */
function shell(key, depth) {
  let g = shellCache.get(key);
  if (g) return g;
  const W = 48;
  const H = 34;
  g = new THREE.SphereGeometry(1, W, H);
  const pos = g.attributes.position;
  const t = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const dx = pos.getX(i);
    const dy = pos.getY(i);
    const dz = pos.getZ(i);
    t[i] = depth(dx, dy, dz, Math.abs(Math.atan2(dx, dz)));
    const p = skull(dx, dy, dz);
    const k = HEAD_R * (1 + t[i]);
    pos.setXYZ(i, p.x * k, p.y * k, p.z * k);
  }
  const index = g.index.array;
  const keep = [];
  for (let i = 0; i < index.length; i += 3) {
    if (t[index[i]] > -0.03 || t[index[i + 1]] > -0.03 || t[index[i + 2]] > -0.03) keep.push(index[i], index[i + 1], index[i + 2]);
  }
  g.setIndex(keep);
  weld(g, W, H);
  g.userData.shared = true;
  shellCache.set(key, g);
  return g;
}

/** Full thickness a little way inside the hairline, under the skin outside it. */
const grow = (s, full, soft = 0.13) => (s >= 0 ? full * Math.min(1, s / soft) : Math.max(-0.07, (s / soft) * 0.07));
/** Negative in the patch of bare skin round an ear. */
const earGap = (A, dy) => (Math.hypot((A - 1.5) / 0.19, (dy + 0.1) / 0.22) - 1) * 0.16;
/** How high the hairline sits: `fore` across the forehead, dropping to `nape` between the temples and the ears. */
const hairline = (A, fore, nape, a0 = 0.8, a1 = 1.25, arch = 0) =>
  fore - arch * smooth(A / a0) + arch * 0.5 + (nape - fore) * smooth((A - a0) / (a1 - a0));
const lumps = (dx, dy, dz) => 0.5 + 0.25 * Math.sin(dx * 9.1 + dy * 7.3) + 0.25 * Math.sin(dz * 11.7 - dy * 5.9 + 1.3);

const HAIR = {
  crop: () => (dx, dy, dz, A) => grow(Math.min(dy - hairline(A, 0.56, -0.3, 0.8, 1.25, -0.06), earGap(A, dy)), 0.035),
  short: (hat) => (dx, dy, dz, A) =>
    grow(Math.min(dy - hairline(A, 0.57, -0.5, 0.8, 1.25, -0.07), earGap(A, dy)), hat ? 0.045 : 0.08 * (1 + 0.6 * smooth(dy) + 0.22 * dx * smooth(dy)), 0.2),
  balding: () => (dx, dy, dz, A) => grow(Math.min(dy - hairline(A, 0.5, -0.5), 0.34 - dy, (A - 1.02) * 0.6, earGap(A, dy)), 0.05, 0.1),
  bun: (hat) => (dx, dy, dz, A) => grow(Math.min(dy - hairline(A, 0.52, -0.46, 0.75, 1.3, 0.16), earGap(A, dy)), hat ? 0.045 : 0.07 * (1 + 0.3 * smooth(dy)), 0.3),
  ponytail: (hat) => (dx, dy, dz, A) => grow(Math.min(dy - hairline(A, 0.52, -0.46, 0.75, 1.3, 0.16), earGap(A, dy)), hat ? 0.045 : 0.07, 0.3),
  bob: (hat) => (dx, dy, dz, A) => grow(dy - hairline(A, 0.37, -0.62, 0.62, 0.98), hat ? 0.05 : 0.105 * (1 + 0.25 * smooth(dy))),
  long: (hat) => (dx, dy, dz, A) => grow(dy - hairline(A, 0.42, -0.62, 0.62, 0.98), hat ? 0.05 : 0.1),
  wild: (hat) => (dx, dy, dz, A) =>
    grow(dy - hairline(A, 0.6, -0.5, 0.8, 1.2, 0.1), hat ? 0.05 : (0.07 + 0.2 * lumps(dx, dy, dz)) * (1 + 0.7 * Math.abs(dx)), 0.16),
};

const beardDepth = (full) => (dx, dy, dz, A) => {
  // From the sideburns, along the cheeks, under the lower lip; nothing behind the ears.
  const top = -0.64 + 0.56 * smooth((A - 0.24) / 0.98);
  const s = Math.min(top - dy, (1.42 - A) * 0.6);
  return grow(s, full * (0.55 + 0.45 * smooth((-dy - 0.3) / 0.5)), 0.1);
};

// What each mood does to a face. brow: height. tilt: inner ends up (worry) or
// down (anger). lid: how far the upper lid drops. smile: corners of the mouth.
const EXPRESSION = {
  calm: { brow: 0, tilt: 0, lid: 0.12, smile: 0.08 },
  guarded: { brow: -0.3, tilt: -0.2, lid: 0.3, smile: -0.1, gaze: 2.6 },
  nervous: { brow: 0.5, tilt: 0.55, lid: 0.02, smile: -0.18, wide: 0.1 },
  angry: { brow: -0.7, tilt: -0.8, lid: 0.3, smile: -0.5 },
  sad: { brow: 0.2, tilt: 0.75, lid: 0.36, smile: -0.5 },
  shaken: { brow: 0.8, tilt: 0.6, lid: -0.04, smile: -0.22, wide: 0.18, part: 1 },
  cold: { brow: -0.4, tilt: -0.3, lid: 0.4, smile: -0.14 },
  warm: { brow: 0.15, tilt: 0.1, lid: 0.2, smile: 0.62 },
  amused: { brow: 0.22, tilt: 0, lid: 0.2, smile: 0.45, lopsided: 0.6 },
  wavering: { brow: 0.4, tilt: 0.65, lid: 0.2, smile: -0.32 },
  breaking: { brow: 0.5, tilt: 0.95, lid: 0.3, smile: -0.58, wet: 1 },
};
const MOOD_ALIAS = { evasive: 'guarded', afraid: 'shaken', grieving: 'sad', surrender: 'breaking', defiant: 'cold' };

const F = 384; // face canvas size
const EYE_Y = 180;
const EYE_X = 50;
const EYE_K = 1.22;
const MOUTH_Y = 256;

/**
 * Paint a face. The canvas wraps the front half of the head: the middle of
 * the canvas is the nose, the edges are the ears.
 * @param {CanvasRenderingContext2D} c
 * @param {any} a appearance
 * @param {{mood: string, blink: boolean, mouth: number}} s
 */
function paintFace(c, a, s) {
  const skin = a.skin ?? '#c99b7c';
  const hair = a.hair?.color ?? '#2a2018';
  const old = isGrey(hair);
  const fem = feminine(a);
  const fair = hsl(hair).l > 0.45;
  const brow = fair ? shade(hair, 0.66) : shade(hair, 0.85);
  const e = { brow: 0, tilt: 0, lid: 0.12, smile: 0, wide: 0, part: 0, lopsided: 0, wet: 0, gaze: 0, ...(EXPRESSION[MOOD_ALIAS[s.mood] ?? s.mood] ?? EXPRESSION.calm) };
  const mx = F / 2;
  const glow = (x, y, r, inner, outer) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  };

  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = skin;
  c.fillRect(0, 0, F, F);
  // Modelling. Everything fades out before the edges of the canvas, where the painted half meets plain skin.
  glow(mx, 118, 92, 'rgba(255,238,220,0.1)', 'rgba(255,238,220,0)');
  glow(mx, 380, 62, 'rgba(60,26,14,0.26)', 'rgba(60,26,14,0)');
  for (const sx of [-1, 1]) {
    glow(mx + sx * 66, 226, 40, fem ? 'rgba(210,84,76,0.22)' : 'rgba(190,90,70,0.13)', 'rgba(200,90,70,0)');
    glow(mx + sx * EYE_X, EYE_Y - 3, 36, 'rgba(60,28,18,0.24)', 'rgba(60,28,18,0)');
  }

  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (old) {
    c.strokeStyle = 'rgba(70,40,28,0.28)';
    c.lineWidth = 1.6;
    for (const y of [118, 131]) {
      c.beginPath();
      c.moveTo(mx - 50, y + 3);
      c.quadraticCurveTo(mx, y - 4, mx + 50, y + 3);
      c.stroke();
    }
    for (const sx of [-1, 1]) {
      for (const k of [-1, 0, 1]) {
        c.beginPath();
        c.moveTo(mx + sx * (EYE_X + 26), EYE_Y + k * 4);
        c.lineTo(mx + sx * (EYE_X + 38), EYE_Y + k * 10 - 1);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(mx + sx * 22, 224);
      c.quadraticCurveTo(mx + sx * 40, 242, mx + sx * 41, 266);
      c.stroke();
      c.beginPath();
      c.moveTo(mx + sx * (EYE_X - 17), EYE_Y + 19);
      c.quadraticCurveTo(mx + sx * EYE_X, EYE_Y + 26, mx + sx * (EYE_X + 18), EYE_Y + 17);
      c.stroke();
    }
  }

  // Eyes. Drawn once and mirrored, so +x runs from the nose toward the ear.
  const iris = a.eyes ?? (hsl(skin).l > 0.62 && fair ? '#4f6c80' : '#3d2819');
  const lid = e.lid + (old ? 0.06 : 0);
  const up = 11 * (1 + e.wide) * (1 - Math.max(0, lid) * 1.15) - Math.min(0, lid) * 8;
  for (const sx of [-1, 1]) {
    const cx = mx + sx * EYE_X;
    c.save();
    c.translate(cx, EYE_Y);
    c.scale(sx * EYE_K, EYE_K);
    if (s.blink) {
      c.strokeStyle = shade(skin, 0.36);
      c.lineWidth = 2.8;
      c.beginPath();
      c.moveTo(-17, 1);
      c.quadraticCurveTo(0, 8, 18, 0);
      c.stroke();
    } else {
      c.save();
      c.beginPath();
      c.moveTo(-17, 2);
      c.quadraticCurveTo(0, -up * 2, 18, 0);
      c.quadraticCurveTo(0, 15, -17, 2);
      c.closePath();
      c.clip();
      c.fillStyle = '#f0ece2';
      c.fillRect(-22, -26, 44, 46);
      const lidShadow = c.createLinearGradient(0, -up - 2, 0, 3);
      lidShadow.addColorStop(0, 'rgba(50,30,25,0.5)');
      lidShadow.addColorStop(1, 'rgba(50,30,25,0)');
      c.fillStyle = lidShadow;
      c.fillRect(-22, -26, 44, 32);
      const gx = e.gaze * sx;
      c.fillStyle = shade(iris, 0.55);
      c.beginPath();
      c.arc(gx, 0.5, 9.4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = iris;
      c.beginPath();
      c.arc(gx, 0.5, 8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = shade(iris, 1.25);
      c.beginPath();
      c.arc(gx, 3, 5.4, 0, Math.PI);
      c.fill();
      c.fillStyle = '#0b0706';
      c.beginPath();
      c.arc(gx, 0.5, 4, 0, Math.PI * 2);
      c.fill();
      c.restore();
      // Upper lid and lashes; a lighter line under the eye; the crease above.
      c.strokeStyle = shade(skin, fem ? 0.2 : 0.3);
      c.lineWidth = fem ? 3.6 : 2.9;
      c.beginPath();
      c.moveTo(-17, 2);
      c.quadraticCurveTo(0, -up * 2, fem ? 21 : 18, fem ? -2.5 : 0);
      c.stroke();
      c.strokeStyle = shade(skin, 0.64);
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(-12, 6.5);
      c.quadraticCurveTo(0, 11, 16, 3);
      c.stroke();
      c.strokeStyle = 'rgba(70,38,26,0.28)';
      c.beginPath();
      c.moveTo(-14, -up - 3);
      c.quadraticCurveTo(1, -up * 2 - 6, 18, -up - 1);
      c.stroke();
      if (e.wet) {
        c.fillStyle = 'rgba(255,255,255,0.5)';
        c.beginPath();
        c.ellipse(0, 7.5, 10, 2, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    // Brow: tapered, thicker toward the nose.
    const lop = e.lopsided && sx > 0 ? -5 : 0;
    const by = -25 - e.brow * 7;
    const thick = fem ? 4.4 : 6.6;
    c.fillStyle = brow;
    c.beginPath();
    c.moveTo(-18, by - e.tilt * 8 + lop - thick * 0.5);
    c.quadraticCurveTo(3, by - 7 + lop, 23, by + 2 + e.tilt * 3.5);
    c.quadraticCurveTo(3, by - 7 + thick + lop, -18, by - e.tilt * 8 + lop + thick * 0.5);
    c.closePath();
    c.fill();
    c.restore();
    if (!s.blink) {
      // The light in the eye falls on the same side of both.
      c.fillStyle = 'rgba(255,255,255,0.92)';
      c.beginPath();
      c.arc(cx + e.gaze * EYE_K - 3.6, EYE_Y - Math.min(3.8, up * 0.42), e.wet ? 3.4 : 2.7, 0, Math.PI * 2);
      c.fill();
    }
  }

  // The nose itself is modelled; paint only what grounds it.
  glow(mx, 233, 20, 'rgba(60,26,14,0.1)', 'rgba(60,26,14,0)');
  c.strokeStyle = shade(skin, 0.7);
  c.lineWidth = 1.8;
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.moveTo(mx + sx * 18, 218);
    c.quadraticCurveTo(mx + sx * 22, 225, mx + sx * 15, 229);
    c.stroke();
  }

  if (a.beard) {
    // Stubble under and around the modelled beard, so its edge is not a hard line.
    c.save();
    c.shadowColor = a.beard;
    c.shadowBlur = 10;
    c.fillStyle = a.beard;
    c.beginPath();
    c.moveTo(-20, 214);
    c.quadraticCurveTo(mx - 110, 216, mx - 44, 238);
    c.quadraticCurveTo(mx, 230, mx + 44, 238);
    c.quadraticCurveTo(mx + 110, 216, F + 20, 214);
    c.lineTo(F + 20, F + 20);
    c.lineTo(-20, F + 20);
    c.closePath();
    c.fill();
    c.restore();
  }

  // Mouth.
  c.save();
  c.translate(mx, MOUTH_Y);
  c.scale(1.12, 1.12);
  const w = 27 + e.smile * 4;
  const lift = e.smile * 8;
  const lx = -w;
  const ly = -lift;
  const rx = w;
  const ry = -lift - e.lopsided * 5;
  const lip = a.beard ? shade(skin, 0.48) : fem ? '#8e3b3a' : shade(skin, 0.52);
  if (s.mouth > 0 || e.part) {
    const open = s.mouth === 2 ? 11 : s.mouth === 1 ? 6 : 3;
    c.fillStyle = '#2a0f0d';
    c.beginPath();
    c.moveTo(lx + 5, ly);
    c.quadraticCurveTo(0, -5, rx - 5, ry);
    c.quadraticCurveTo(0, open * 2, lx + 5, ly);
    c.fill();
    if (open > 4) {
      c.fillStyle = 'rgba(240,236,226,0.9)';
      c.fillRect(-12, -3, 24, 3.2);
      c.fillStyle = '#7d3a36';
      c.beginPath();
      c.ellipse(0, open - 1.5, 9, 3, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = lip;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(lx, ly);
    c.quadraticCurveTo(0, -6, rx, ry);
    c.stroke();
    c.beginPath();
    c.moveTo(lx + 3, ly + 1);
    c.quadraticCurveTo(0, open * 2 + 2, rx - 3, ry + 1);
    c.stroke();
  } else {
    if (fem) {
      // A fuller lower lip.
      c.fillStyle = 'rgba(160,70,66,0.5)';
      c.beginPath();
      c.moveTo(lx + 6, ly + 1);
      c.quadraticCurveTo(0, 4 + lift * 0.4, rx - 6, ry + 1);
      c.quadraticCurveTo(0, 13, lx + 6, ly + 1);
      c.fill();
    }
    c.strokeStyle = lip;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(lx, ly);
    c.quadraticCurveTo(0, 3 + lift * 0.55, rx, ry);
    c.stroke();
    c.strokeStyle = 'rgba(60,30,20,0.22)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-12, 13);
    c.quadraticCurveTo(0, 17, 12, 13);
    c.stroke();
  }
  c.restore();

  if (a.moustache) {
    const k = a.build === 'heavy' ? 1.28 : 1;
    const bar = (sx) => {
      c.beginPath();
      c.moveTo(mx, 234);
      c.bezierCurveTo(mx + sx * 12 * k, 231, mx + sx * 30 * k, 236, mx + sx * 40 * k, 253);
      c.bezierCurveTo(mx + sx * 28 * k, 250, mx + sx * 14 * k, 250, mx, 248);
      c.closePath();
    };
    c.fillStyle = a.moustache;
    for (const sx of [-1, 1]) {
      bar(sx);
      c.fill();
    }
    c.strokeStyle = shade(a.moustache, hsl(a.moustache).l > 0.4 ? 0.72 : 1.5);
    c.lineWidth = 1;
    for (const sx of [-1, 1]) {
      for (let i = 1; i < 6; i++) {
        c.beginPath();
        c.moveTo(mx + sx * i * 4 * k, 235 + i * 0.6);
        c.lineTo(mx + sx * (i * 6.5 + 3) * k, 247 + i * 0.5);
        c.stroke();
      }
    }
  }
  if (a.hat) {
    // The brim keeps the light off the brow.
    const brim = c.createLinearGradient(0, 96, 0, 186);
    brim.addColorStop(0, 'rgba(18,10,8,0.5)');
    brim.addColorStop(1, 'rgba(18,10,8,0)');
    c.fillStyle = brim;
    c.fillRect(0, 0, F, 186);
  }
}

// --------------------------------------------------------------------- clothes

const T = 256; // torso canvas is drawn at this size and stored at twice it

/**
 * Paint the garment that wraps the torso. The middle of the canvas is the
 * front of the chest, the edges meet at the spine; the top is the neck.
 * @param {(h: number) => number} at canvas y for a height above the hips
 */
function paintTorso(c, a, at, kind) {
  const coat = a.coat?.color ?? '#2c3138';
  const shirt = a.shirt ?? '#c9c4b8';
  const base = kind === 'vest' ? shirt : coat;
  const mx = T / 2;
  c.fillStyle = base;
  c.fillRect(0, 0, T, T);
  let g = c.createLinearGradient(0, 0, 0, T);
  g.addColorStop(0, 'rgba(255,255,255,0.07)');
  g.addColorStop(0.45, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.28)');
  c.fillStyle = g;
  c.fillRect(0, 0, T, T);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const line = (x0, y0, x1, y1, style, wd = 1.5) => {
    c.strokeStyle = style;
    c.lineWidth = wd;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  };
  const poly = (pts, style) => {
    c.fillStyle = style;
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  };
  const button = (x, y, style = 'rgba(0,0,0,0.55)') => {
    c.fillStyle = style;
    c.beginPath();
    c.arc(x, y, 2.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.beginPath();
    c.arc(x - 0.7, y - 0.7, 1, 0, Math.PI * 2);
    c.fill();
  };
  const seam = 'rgba(0,0,0,0.3)';
  const neck = at(0.665);
  const tieAndShirt = (bottom, half) => {
    // The V of shirt at the throat, with a tie if there is one.
    poly([[mx - half, neck], [mx + half, neck], [mx, bottom]], shirt);
    g = c.createLinearGradient(0, neck, 0, bottom);
    g.addColorStop(0, 'rgba(0,0,0,0.22)');
    g.addColorStop(0.5, 'rgba(0,0,0,0)');
    poly([[mx - half, neck], [mx + half, neck], [mx, bottom]], g);
    if (a.tie) {
      poly([[mx - 5, neck + 4], [mx + 5, neck + 4], [mx + 3.5, neck + 13], [mx - 3.5, neck + 13]], shade(a.tie, 1.12));
      poly([[mx - 3.5, neck + 13], [mx + 3.5, neck + 13], [mx + 6, bottom - 14], [mx, bottom - 4], [mx - 6, bottom - 14]], a.tie);
    } else {
      line(mx, neck + 6, mx, bottom - 3, 'rgba(0,0,0,0.16)', 1.2);
    }
    // Collar points.
    poly([[mx - half - 1, neck - 1], [mx - 3, neck + 2], [mx - half + 3, neck + 17]], shade(shirt, 1.1));
    poly([[mx + half + 1, neck - 1], [mx + 3, neck + 2], [mx + half - 3, neck + 17]], shade(shirt, 1.1));
  };
  const lapels = (bottom, half, tone) => {
    for (const sx of [-1, 1]) {
      poly([[mx + sx * half, neck - 2], [mx + sx * (half + 15), neck + 10], [mx + sx * (half + 9), neck + 22], [mx + sx * (half + 17), neck + 27], [mx + sx * 2, bottom], [mx + sx * (half - 1), neck + 12]], tone);
      line(mx + sx * (half + 15), neck + 10, mx + sx * 2, bottom, 'rgba(0,0,0,0.35)', 1.3);
    }
  };

  if (kind === 'jacket') {
    const v = at(0.36);
    tieAndShirt(v, 15);
    lapels(v, 15, shade(coat, 1.14));
    line(mx, v, mx, T, seam, 1.6);
    button(mx + 4, v + 12);
    button(mx + 4, v + 34);
    line(mx + 34, at(0.42), mx + 58, at(0.42), 'rgba(0,0,0,0.3)', 1.6);
    line(mx - 62, at(0.1), mx - 34, at(0.09), seam);
    line(mx + 34, at(0.09), mx + 62, at(0.1), seam);
  } else if (kind === 'long' || kind === 'labcoat') {
    const lab = kind === 'labcoat';
    const waist = at(0.0);
    const half = 16;
    // An open coat: shirt to the belt, trousers below, the coat's own edges either side.
    poly([[mx - half, neck], [mx + half, neck], [mx + 13, waist], [mx + 15, T], [mx - 15, T], [mx - 13, waist]], lab ? shirt : a.trousers ?? '#22252a');
    poly([[mx - half, neck], [mx + half, neck], [mx + 13, waist], [mx - 13, waist]], shirt);
    if (!lab) {
      line(mx - 13, waist, mx + 13, waist, 'rgba(0,0,0,0.6)', 4);
      c.fillStyle = '#b89a55';
      c.fillRect(mx - 3.5, waist - 3, 7, 6);
    }
    if (a.tie && !lab) poly([[mx - 3.5, neck + 13], [mx + 3.5, neck + 13], [mx + 6, waist - 26], [mx, waist - 16], [mx - 6, waist - 26]], a.tie);
    else line(mx, neck + 6, mx, waist - 4, 'rgba(0,0,0,0.14)', 1.2);
    poly([[mx - half - 1, neck - 1], [mx - 3, neck + 2], [mx - half + 3, neck + 15]], shade(shirt, 1.1));
    poly([[mx + half + 1, neck - 1], [mx + 3, neck + 2], [mx + half - 3, neck + 15]], shade(shirt, 1.1));
    lapels(at(0.3), half, shade(coat, lab ? 0.93 : 1.15));
    for (const sx of [-1, 1]) line(mx + sx * 14, at(0.3), mx + sx * 16, T, 'rgba(0,0,0,0.4)', 2);
    if (lab) {
      c.strokeStyle = 'rgba(0,0,0,0.22)';
      c.lineWidth = 1.4;
      c.strokeRect(mx + 30, at(0.47), 24, 22);
      line(mx + 36, at(0.47) - 5, mx + 36, at(0.47) + 6, '#27496b', 2.4);
      line(mx + 42, at(0.47) - 4, mx + 42, at(0.47) + 6, '#7d2a26', 2.4);
      c.strokeRect(mx + 28, at(0.08), 30, 30);
      c.strokeRect(mx - 58, at(0.08), 30, 30);
    } else {
      line(mx - 66, at(0.05), mx - 36, at(0.03), seam, 1.6);
      line(mx + 36, at(0.03), mx + 66, at(0.05), seam, 1.6);
      for (const y of [at(0.22), at(0.1)]) button(mx + 21, y);
    }
  } else if (kind === 'vest') {
    const v = at(0.3);
    // A waistcoat over shirt sleeves: the shirt shows at the throat, round the armholes and over the shoulders.
    c.fillStyle = coat;
    c.fillRect(0, at(0.6), T, T);
    g = c.createLinearGradient(0, at(0.6), 0, T);
    g.addColorStop(0, 'rgba(255,255,255,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0.25)');
    c.fillStyle = g;
    c.fillRect(0, at(0.6), T, T);
    c.fillStyle = shirt;
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.ellipse(mx + sx * 64, at(0.56), 24, at(0.36) - at(0.56), 0, 0, Math.PI * 2);
      c.fill();
    }
    tieAndShirt(v, 14);
    lapels(v, 14, shade(coat, 1.18));
    line(mx, v, mx, T, seam, 1.6);
    for (let i = 0; i < 4; i++) button(mx + 4, v + 10 + i * 17, 'rgba(210,180,110,0.9)');
    line(mx - 46, at(0.2), mx - 22, at(0.19), seam);
    line(mx + 22, at(0.19), mx + 46, at(0.2), seam);
  } else if (kind === 'apron') {
    const linen = '#c2bba9';
    tieAndShirt(at(0.5), 12);
    poly([[mx - 30, at(0.56)], [mx + 30, at(0.56)], [mx + 36, at(0.26)], [mx + 62, at(0.22)], [mx + 66, T], [mx - 66, T], [mx - 62, at(0.22)], [mx - 36, at(0.26)]], linen);
    for (const sx of [-1, 1]) line(mx + sx * 28, at(0.56), mx + sx * 20, neck, linen, 6);
    g = c.createLinearGradient(0, at(0.56), 0, T);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.22)');
    c.fillStyle = g;
    c.fillRect(mx - 66, at(0.56), 132, T);
    c.strokeStyle = 'rgba(0,0,0,0.25)';
    c.lineWidth = 1.4;
    c.strokeRect(mx - 24, at(0.12), 48, 30);
    line(0, at(0.24), T, at(0.24), 'rgba(0,0,0,0.16)', 3);
    c.fillStyle = 'rgba(90,60,30,0.16)';
    c.beginPath();
    c.ellipse(mx - 20, at(0.36), 11, 7, 0.4, 0, Math.PI * 2);
    c.fill();
  } else if (kind === 'dress') {
    // A scooped neckline, a waist seam, pleats.
    c.fillStyle = a.skin ?? '#c99b7c';
    c.beginPath();
    c.ellipse(mx, neck - 2, 21, 15, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = shade(coat, 1.25);
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(mx, neck - 2, 21, 15, 0, 0.1, Math.PI - 0.1);
    c.stroke();
    line(0, at(0.2), T, at(0.2), 'rgba(0,0,0,0.38)', 2.4);
    for (let i = -6; i <= 6; i++) line(mx + i * 20, at(0.19), mx + i * 22, T, 'rgba(0,0,0,0.14)', 1.4);
    c.fillStyle = '#d6c08a';
    c.beginPath();
    c.arc(mx - 26, at(0.5), 4, 0, Math.PI * 2);
    c.fill();
  } else {
    // Cardigan: knitted, worn open over a blouse.
    for (let x = 4; x < T; x += 6) line(x, 0, x, T, 'rgba(0,0,0,0.07)', 1.4);
    poly([[mx - 13, neck], [mx + 13, neck], [mx + 11, T], [mx - 11, T]], shirt);
    line(mx, neck + 8, mx, T, 'rgba(0,0,0,0.12)', 1.2);
    for (const sx of [-1, 1]) {
      line(mx + sx * 12, neck, mx + sx * 11, T, shade(coat, 0.7), 5);
    }
    for (let i = 0; i < 5; i++) button(mx + 12, at(0.5) + i * 22, 'rgba(230,220,200,0.85)');
    c.fillStyle = 'rgba(0,0,0,0.16)';
    c.fillRect(0, T - 12, T, 12);
  }
  // Back seam.
  line(1, at(0.6), 1, T, 'rgba(0,0,0,0.2)', 2);
}

// ------------------------------------------------------------------ the person

/**
 * @typedef {Object} Appearance
 * @property {number} [height] scale, 1 = about 1.75 m
 * @property {'slim'|'medium'|'heavy'} [build]
 * @property {string} [skin]
 * @property {string} [eyes]
 * @property {boolean} [feminine] softer features; guessed from hair and dress if not given
 * @property {{style?: string, color?: string}} [hair]
 * @property {{color?: string, length?: 'long'|'jacket'|'vest'|'labcoat'|'apron'|'dress'|'cardigan', open?: boolean}} [coat]
 * @property {string} [shirt]
 * @property {string} [trousers]
 * @property {string} [shoes]
 * @property {'fedora'|'flatcap'|'police'|null} [hat]
 * @property {string} [hatColor]
 * @property {boolean} [glasses]
 * @property {string|null} [beard]
 * @property {string|null} [moustache]
 * @property {string|null} [tie]
 * @property {string|null} [scarf]
 * @property {string[]} [accessories] cane | whistle | whistleCord | clipboard | towel | notepad | badge | camera | rope | lantern
 * @property {'stand'|'sit'|'bound'|'lean'} [pose]
 */

/**
 * @param {Appearance} a
 * @returns {{ root: THREE.Group, update: (t: number, dt: number, s: {lookAt?: THREE.Vector3|null, talking?: boolean, mood?: string}) => void, headHeight: number, setAccessories: (list: string[]) => void, dispose: () => void }}
 */
export function createCharacter(a = {}) {
  const person = a.model ? createPerson(a) : null;
  if (person) return person;
  return createFigure(a);
}

/** A person drawn in code: the stand-in for when the modelled one is not available. */
function createFigure(a = {}) {
  const root = new THREE.Group();
  const scale = a.height ?? 1;
  const build = BUILD[a.build ?? 'medium'];
  const pose = a.pose ?? 'stand';
  const fem = feminine(a);
  const coatLen = a.coat?.length ?? 'jacket';
  const coatColor = a.coat?.color ?? '#2c3138';
  const sleeveColor = coatLen === 'vest' ? a.shirt ?? '#c9c4b8' : coatColor;
  const skin = color(a.skin ?? '#c99b7c', SKIN_ROUGH);
  const sleeve = color(sleeveColor, 0.9);
  const trousers = color(a.trousers ?? '#22252a', 0.9);
  const shoes = color(a.shoes ?? '#15120f', 0.45);
  const limb = 1 + (build.w - 1) * 0.5; // arms, legs and neck thicken less than the trunk does
  const owned = []; // textures and materials made for this person alone

  const body = new THREE.Group();
  root.add(body);
  body.scale.setScalar(scale);

  // --- legs -------------------------------------------------------------
  const hipY = 0.84;
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.088 * build.w, hipY, 0);
    body.add(hip);
    mesh(hip, capsule(0.076 * limb, 0.3), trousers, 0, -0.2, 0);
    const knee = new THREE.Group();
    knee.position.set(0, -0.42, 0);
    hip.add(knee);
    mesh(knee, capsule(0.06 * limb, 0.28), trousers, 0, -0.18, 0);
    const shoe = mesh(knee, capsule(0.048, 0.14), shoes, 0, -0.395, 0.045);
    shoe.rotation.x = Math.PI / 2;
    shoe.scale.set(1.05, 1, 0.78);
    legs.push({ hip, knee });
  }

  // --- torso ------------------------------------------------------------
  const torso = new THREE.Group();
  torso.position.y = hipY - 0.06;
  body.add(torso);
  const long = coatLen === 'long' || coatLen === 'labcoat' || coatLen === 'dress';
  const hem = coatLen === 'dress' ? -0.54 : long ? -0.44 : -0.05;
  const girth = fem ? 0.93 : 1;
  const waist = fem && a.build !== 'heavy' ? 0.9 : 1;
  // The silhouette as [height above the hips, radius], then resampled evenly so the painted cloth is not stretched.
  const outline = [
    ...(long ? [[hem, coatLen === 'dress' ? 0.235 : 0.205], [-0.12, 0.186]] : [[hem, 0.172]]),
    [0.0, 0.172 * girth], [0.18, 0.17 * girth * waist], [0.34, 0.182 * girth], [0.46, 0.19 * girth], [0.545, 0.18 * girth], [0.605, 0.155 * girth], [0.642, 0.108], [0.67, 0.064],
  ];
  const radiusAt = (h) => {
    let i = 0;
    while (i < outline.length - 2 && h > outline[i + 1][0]) i++;
    const [h0, r0] = outline[i];
    const [h1, r1] = outline[i + 1];
    return r0 + (r1 - r0) * smooth((h - h0) / (h1 - h0));
  };
  const top = 0.67;
  const rows = 24;
  const points = [];
  for (let i = 0; i <= rows; i++) {
    const h = hem + ((top - hem) * i) / rows;
    points.push(new THREE.Vector2(radiusAt(h), h));
  }
  const cloth = document.createElement('canvas');
  cloth.width = cloth.height = T * 2;
  const clothCtx = cloth.getContext('2d');
  clothCtx.scale(2, 2);
  paintTorso(clothCtx, a, (h) => (1 - (h - hem) / (top - hem)) * T, coatLen);
  const clothTex = new THREE.CanvasTexture(cloth);
  clothTex.colorSpace = THREE.SRGBColorSpace;
  clothTex.anisotropy = 4;
  const clothMat = rimLit(new THREE.MeshStandardMaterial({ map: clothTex, roughness: 0.88, side: long ? THREE.DoubleSide : THREE.FrontSide }));
  owned.push(clothTex, clothMat);
  // Seam at the back, so the front of the chest is the middle of the canvas.
  const torsoMesh = mesh(torso, new THREE.LatheGeometry(points, 32, Math.PI, Math.PI * 2), clothMat);
  torsoMesh.scale.set(build.w, 1, 0.68 * build.d);
  const chest = (h) => radiusAt(h) * 0.68 * build.d; // how far forward the cloth is at that height
  if (a.scarf) {
    const wool = color(a.scarf, 0.95);
    const wrap = mesh(torso, new THREE.TorusGeometry(0.064, 0.027, 10, 22), wool, 0, 0.664, 0.004);
    wrap.rotation.x = Math.PI / 2;
    wrap.scale.set(1, 0.92, 0.95);
    const knot = mesh(torso, new THREE.SphereGeometry(0.026, 12, 10), wool, 0.028, 0.642, 0.058);
    knot.scale.set(1.1, 0.9, 0.8);
  }

  // --- arms -------------------------------------------------------------
  const arms = [];
  const reach = (fem ? 0.17 : 0.186) * build.w;
  for (const sx of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * reach, 0.536, 0);
    torso.add(shoulder);
    mesh(shoulder, capsule(0.05 * limb, 0.25), sleeve, 0, -0.125, 0);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.3, 0);
    shoulder.add(elbow);
    mesh(elbow, capsule(0.044 * limb, 0.18), sleeve, 0, -0.125, 0);
    if (coatLen !== 'vest') mesh(elbow, new THREE.CylinderGeometry(0.048 * limb, 0.048 * limb, 0.03, 14), color(shade(sleeveColor, 0.8), 0.9), 0, -0.245, 0);
    const hand = mesh(elbow, new THREE.SphereGeometry(0.044, 14, 10), skin, 0, -0.3, 0.004);
    hand.scale.set(0.82, 1.18, 0.62);
    const thumb = mesh(elbow, capsule(0.012, 0.03), skin, -sx * 0.03, -0.285, 0.018);
    thumb.rotation.z = -sx * 0.5;
    shoulder.rotation.z = sx * 0.07;
    shoulder.rotation.x = 0.03;
    elbow.rotation.x = -0.16;
    arms.push({ shoulder, elbow, hand, side: sx });
  }

  // --- head -------------------------------------------------------------
  const neck = new THREE.Group();
  neck.position.y = 0.67;
  torso.add(neck);
  mesh(neck, new THREE.CylinderGeometry(0.047 * limb, 0.056 * limb, 0.12, 18), skin, 0, 0.02, 0);
  const head = new THREE.Group();
  head.position.y = 0.06;
  neck.add(head);
  head.scale.x = a.build === 'heavy' ? 1.05 : a.build === 'slim' ? 0.97 : 1;
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = faceCanvas.height = F;
  const faceCtx = faceCanvas.getContext('2d');
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = 4;
  const faceMat = rimLit(new THREE.MeshStandardMaterial({ map: faceTex, roughness: SKIN_ROUGH }));
  owned.push(faceTex, faceMat);
  // Softer features for some, a stronger nose and brow for the big and the old.
  const features = fem ? 0.8 : a.build === 'heavy' || isGrey(a.hair?.color ?? '#2a2018') ? 1.15 : 1;
  // The shadow map is far too coarse for a face; let the paint and the light do the modelling.
  mesh(head, headGeometry(features), [faceMat, skin], 0, HEAD_Y, 0).receiveShadow = false;
  const style = a.hair?.style ?? 'short';
  if (!['bob', 'long', 'wild'].includes(style)) {
    for (const sx of [-1, 1]) {
      const ear = mesh(head, new THREE.SphereGeometry(0.026, 12, 10), skin, sx * 0.1015, HEAD_Y - 0.012, -0.004);
      ear.scale.set(0.34, 1.12, 0.74);
      ear.rotation.y = sx * 0.35;
    }
  }
  let faceKey = '';
  const setFace = (mood, blink, mouth) => {
    const key = `${mood}|${blink ? 1 : 0}|${mouth}`;
    if (key === faceKey) return;
    faceKey = key;
    paintFace(faceCtx, a, { mood, blink, mouth });
    faceTex.needsUpdate = true;
  };
  setFace('calm', false, 0);

  addHair(head, a);
  if (a.beard) {
    const big = style === 'wild';
    mesh(head, shell(`beard:${big}`, beardDepth(big ? 0.2 : 0.07)), hairMaterial(a.beard), 0, HEAD_Y, 0);
  }
  if (a.glasses) {
    const frame = color('#1c1c1e', 0.35, 0.7);
    const lens = new THREE.MeshBasicMaterial({ color: 0xcfe4ea, transparent: true, opacity: 0.1, depthWrite: false });
    owned.push(lens);
    for (const sx of [-1, 1]) {
      const ring = mesh(head, new THREE.TorusGeometry(0.0265, 0.0024, 6, 26), frame, sx * 0.041, HEAD_Y + 0.011, 0.109);
      ring.castShadow = false;
      ring.rotation.y = sx * 0.16;
      const glass = mesh(head, new THREE.CircleGeometry(0.026, 20), lens, sx * 0.041, HEAD_Y + 0.011, 0.109);
      glass.rotation.y = sx * 0.16;
      glass.castShadow = false;
      const arm = mesh(head, new THREE.CylinderGeometry(0.0015, 0.0015, 0.118, 5), frame, sx * 0.0835, HEAD_Y + 0.013, 0.05);
      arm.rotation.x = Math.PI / 2;
      arm.rotation.z = sx * 0.27;
      arm.castShadow = false;
    }
    mesh(head, new THREE.CylinderGeometry(0.0018, 0.0018, 0.03, 5), frame, 0, HEAD_Y + 0.015, 0.113).rotation.z = Math.PI / 2;
  }
  addHat(head, a);

  // --- accessories ------------------------------------------------------
  const accGroup = new THREE.Group();
  torso.add(accGroup);
  const handAcc = new THREE.Group();
  arms[1].elbow.add(handAcc);
  const handAccL = new THREE.Group();
  arms[0].elbow.add(handAccL);

  function setAccessories(list = []) {
    for (const gp of [accGroup, handAcc, handAccL]) {
      while (gp.children.length) {
        const child = gp.children[0];
        child.geometry?.dispose?.();
        gp.remove(child);
      }
    }
    const metal = brass();
    const front = chest(0.45);
    for (const acc of list) {
      if (acc === 'whistle' || acc === 'whistleCord') {
        // A bosun's whistle worn at the chest: on a brass chain, or a bootlace.
        const cordMat = acc === 'whistle' ? metal : color('#3a2a1c', 0.9);
        const loop = mesh(accGroup, new THREE.TorusGeometry(0.1, acc === 'whistle' ? 0.0035 : 0.005, 6, 28, Math.PI), cordMat, 0, 0.56, front * 0.45);
        loop.rotation.set(-0.5, 0, Math.PI);
        const pipe = mesh(accGroup, new THREE.CylinderGeometry(0.007, 0.0095, 0.072, 10), metal, 0, 0.44, front + 0.012);
        pipe.rotation.z = 0.25;
        mesh(accGroup, new THREE.SphereGeometry(0.014, 10, 8), metal, 0.012, 0.408, front + 0.012);
      } else if (acc === 'badge') {
        const shield = mesh(accGroup, new THREE.CylinderGeometry(0.024, 0.017, 0.008, 6), metal, -0.085 * build.w, 0.47, chest(0.47) * 0.9 + 0.004);
        shield.rotation.x = Math.PI / 2;
        shield.rotation.z = -0.2;
      } else if (acc === 'towel') {
        const tw = mesh(accGroup, capsule(0.03, 0.26), color('#c2bba9', 0.95), reach * 0.92, 0.5, 0.03);
        tw.scale.set(1.5, 1, 0.5);
      } else if (acc === 'cane') {
        mesh(handAcc, new THREE.CylinderGeometry(0.011, 0.009, 0.86, 10), color('#2a1a10', 0.45), 0.02, -0.7, 0.05);
        const hook = mesh(handAcc, new THREE.TorusGeometry(0.04, 0.012, 8, 14, Math.PI), metal, 0.02, -0.28, 0.01);
        hook.rotation.y = Math.PI / 2;
      } else if (acc === 'clipboard') {
        const cb = mesh(handAccL, new THREE.BoxGeometry(0.2, 0.28, 0.012), color('#5a4630'), 0, -0.25, 0.09);
        cb.rotation.x = -0.9;
        const pp = mesh(handAccL, new THREE.BoxGeometry(0.17, 0.24, 0.004), color('#e8e3d6'), 0, -0.245, 0.1);
        pp.rotation.x = -0.9;
      } else if (acc === 'notepad') {
        const np = mesh(handAccL, new THREE.BoxGeometry(0.09, 0.13, 0.012), color('#e2dcc9'), 0, -0.29, 0.06);
        np.rotation.x = -0.8;
      } else if (acc === 'camera') {
        const z = chest(0.3);
        mesh(accGroup, new THREE.BoxGeometry(0.12, 0.08, 0.06), color('#15171a', 0.4), 0, 0.3, z + 0.03);
        mesh(accGroup, new THREE.CylinderGeometry(0.03, 0.03, 0.05, 16), color('#15171a', 0.4), 0, 0.3, z + 0.07).rotation.x = Math.PI / 2;
        const strap = mesh(accGroup, new THREE.TorusGeometry(0.13, 0.004, 5, 24, Math.PI), color('#15171a', 0.8), 0, 0.5, z * 0.5);
        strap.rotation.set(-0.45, 0, Math.PI);
      } else if (acc === 'rope') {
        for (let i = 0; i < 4; i++) {
          const rp = mesh(accGroup, new THREE.TorusGeometry(0.202 * build.w, 0.012, 8, 28), color('#a4946c', 1), 0, 0.2 + i * 0.045, 0);
          rp.rotation.x = Math.PI / 2;
          rp.scale.set(1, 0.72 * build.d, 1);
        }
      } else if (acc === 'lantern') {
        mesh(handAcc, new THREE.CylinderGeometry(0.05, 0.06, 0.06, 14), metal, 0, -0.52, 0.02);
        const flame = new THREE.MeshBasicMaterial({ color: 0xffc070 });
        owned.push(flame);
        mesh(handAcc, new THREE.CylinderGeometry(0.04, 0.05, 0.12, 14), flame, 0, -0.43, 0.02);
        mesh(handAcc, new THREE.CylinderGeometry(0.03, 0.045, 0.04, 14), metal, 0, -0.35, 0.02);
      }
    }
  }
  setAccessories(a.accessories ?? []);

  // Soft contact shadow.
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), blobShadowMaterial());
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.014;
  blob.renderOrder = 1;
  root.add(blob);

  // --- pose -------------------------------------------------------------
  const baseTorsoY = torso.position.y;
  if (pose === 'sit') {
    for (const leg of legs) {
      leg.hip.rotation.x = -Math.PI / 2 + 0.08;
      leg.knee.rotation.x = Math.PI / 2 - 0.05;
    }
    body.position.y = -0.36 * scale;
    for (const arm of arms) {
      arm.shoulder.rotation.x = -0.35;
      arm.elbow.rotation.x = -0.9;
    }
  } else if (pose === 'bound') {
    for (const leg of legs) {
      leg.hip.rotation.x = -Math.PI / 2 + 0.15;
      leg.knee.rotation.x = 0.25;
    }
    body.position.y = -0.74 * scale;
    for (const arm of arms) {
      arm.shoulder.rotation.x = 0.7;
      arm.shoulder.rotation.z = -arm.side * 0.25;
      arm.elbow.rotation.x = 0.5;
    }
    torso.rotation.x = 0.12;
  } else if (pose === 'lean') {
    for (const arm of arms) {
      arm.shoulder.rotation.x = -0.5;
      arm.elbow.rotation.x = -1.5;
      arm.shoulder.rotation.z = -arm.side * 0.45;
    }
  }
  if ((a.accessories ?? []).includes('clipboard') || (a.accessories ?? []).includes('notepad')) {
    arms[0].shoulder.rotation.x = -0.25;
    arms[0].elbow.rotation.x = -1.1;
  }
  const rest = arms.map((arm) => ({ sx: arm.shoulder.rotation.x, ex: arm.elbow.rotation.x }));

  // --- animation --------------------------------------------------------
  const phase = Math.random() * 10;
  let blinkAt = 2 + Math.random() * 4;
  let blink = 0;
  let headYaw = 0;
  let headPitch = 0;
  let talk = 0;
  let mouthFrame = 0;
  let mouthAt = 0;
  const tmp = new THREE.Vector3();
  const inv = new THREE.Matrix4();
  const eyeHeight = (torso.position.y + neck.position.y + head.position.y + HEAD_Y + 0.012) * scale + body.position.y;

  function update(t, dt, s = {}) {
    const mood = s.mood ?? 'calm';
    const nervous = mood === 'nervous' || mood === 'shaken' || mood === 'afraid' || mood === 'wavering';
    const low = mood === 'sad' || mood === 'grieving' || mood === 'breaking';
    const breathe = Math.sin(t * (nervous ? 2.6 : 1.5) + phase);
    torso.scale.y = 1 + breathe * 0.008;
    torso.position.y = baseTorsoY + breathe * 0.003;
    if (pose === 'stand') {
      root.rotation.z = Math.sin(t * 0.6 + phase) * (nervous ? 0.018 : 0.008);
      torso.rotation.x = (mood === 'angry' || mood === 'cold' ? 0.07 : low ? 0.05 : 0) + Math.sin(t * 0.43 + phase) * 0.006;
    }
    // Head tracking.
    let targetYaw = Math.sin(t * 0.31 + phase) * 0.12;
    let targetPitch = low ? 0.28 : Math.sin(t * 0.23 + phase * 2) * 0.03;
    if (s.lookAt) {
      root.updateWorldMatrix(true, false);
      inv.copy(root.matrixWorld).invert();
      tmp.copy(s.lookAt).applyMatrix4(inv);
      const dist = Math.hypot(tmp.x, tmp.z);
      if (dist < 7 && dist > 0.2) {
        targetYaw = THREE.MathUtils.clamp(Math.atan2(tmp.x, tmp.z), -1.15, 1.15);
        targetPitch = THREE.MathUtils.clamp(-Math.atan2(tmp.y - eyeHeight, dist), -0.4, 0.4) + (low ? 0.14 : 0);
        if (mood === 'guarded' || mood === 'evasive') targetYaw += Math.sin(t * 0.9 + phase) * 0.22;
      }
    }
    const k = 1 - Math.exp(-dt * 5);
    headYaw += (targetYaw - headYaw) * k;
    headPitch += (targetPitch - headPitch) * k;
    talk += ((s.talking ? 1 : 0) - talk) * (1 - Math.exp(-dt * 8));
    neck.rotation.y = headYaw * 0.75;
    head.rotation.x = headPitch + talk * Math.sin(t * 11) * 0.03;
    head.rotation.z = talk * Math.sin(t * 5.3) * 0.03 + Math.sin(t * 0.37 + phase) * 0.02;
    torso.rotation.y = headYaw * 0.22;
    // Arms: idle sway, fidgeting when nervous, small gestures when talking.
    for (let i = 0; i < 2; i++) {
      const arm = arms[i];
      const r = rest[i];
      const fid = nervous ? Math.sin(t * 5.1 + i * 2 + phase) * 0.05 : 0;
      const gest = i === 1 && pose !== 'bound' ? talk * (0.25 + Math.sin(t * 3.1 + phase) * 0.18) : 0;
      arm.shoulder.rotation.x = r.sx + Math.sin(t * 0.9 + phase + i) * 0.02 + fid - gest * 0.5;
      arm.elbow.rotation.x = r.ex + fid * 2 - gest * 1.6;
    }
    // Face: blinking, and a mouth that moves when they speak.
    blinkAt -= dt;
    if (blinkAt <= 0) {
      blink = 0.13;
      blinkAt = (nervous ? 1.2 : 2.5) + Math.random() * 4;
    }
    blink = Math.max(0, blink - dt);
    if (talk > 0.35) {
      mouthAt -= dt;
      if (mouthAt <= 0) {
        mouthFrame = (mouthFrame + 1 + Math.floor(Math.random() * 2)) % 3;
        mouthAt = 0.09 + Math.random() * 0.07;
      }
    } else {
      mouthFrame = 0;
    }
    setFace(mood, blink > 0, mouthFrame);
  }

  function dispose() {
    root.traverse((obj) => {
      if (obj.isMesh && !obj.geometry.userData.shared) obj.geometry.dispose();
    });
    for (const thing of owned) thing.dispose();
  }

  return { root, update, headHeight: eyeHeight, setAccessories, dispose };
}

// ------------------------------------------------------------------------ hair

function addHair(head, a) {
  const style = a.hair?.style ?? 'short';
  if (style === 'bald' || !HAIR[style]) return;
  const hex = a.hair?.color ?? '#2a2018';
  const m = hairMaterial(hex);
  const hat = Boolean(a.hat);
  mesh(head, shell(`hair:${style}:${hat}`, HAIR[style](hat)), m, 0, HEAD_Y, 0);

  // Hair that hangs: a curtain round the sides and back, dropped from the skull at about eye level.
  const curtain = (length, curl, from = 0.86) => {
    const cols = 30;
    const rws = 7;
    const positions = [];
    const uvs = [];
    const index = [];
    const p = new THREE.Vector3();
    for (let i = 0; i <= cols; i++) {
      const phi = from + ((Math.PI * 2 - from * 2) * i) / cols;
      const dy = 0.28;
      const h = Math.sqrt(1 - dy * dy);
      skull(Math.sin(phi) * h, dy, Math.cos(phi) * h, p);
      for (let j = 0; j <= rws; j++) {
        const k = j / rws;
        // Out a little as it falls, then turned under at the ends.
        const wide = 1.1 + 0.07 * Math.sin(Math.PI * Math.min(1, k * 1.15)) - curl * k * k * k;
        positions.push(p.x * HEAD_R * wide, p.y * HEAD_R - length * k, p.z * HEAD_R * wide - 0.004 * k);
        uvs.push((i / cols) * 0.7, 1 - k);
      }
    }
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rws; j++) {
        const q = i * (rws + 1) + j;
        index.push(q, q + 1, q + rws + 1, q + 1, q + rws + 2, q + rws + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(index);
    g.computeVertexNormals();
    mesh(head, g, hairMaterial(hex, THREE.DoubleSide), 0, HEAD_Y, 0);
  };
  if (style === 'bob') curtain(0.165, 0.2);
  if (style === 'long') curtain(0.34, 0.04);
  if (style === 'bun') {
    const bun = mesh(head, new THREE.SphereGeometry(0.047, 18, 14), m, 0, HEAD_Y + 0.07, -0.112);
    bun.scale.set(1, 0.92, 0.9);
  }
  if (style === 'ponytail') {
    const tail = mesh(head, capsule(0.026, 0.2), m, 0, HEAD_Y - 0.04, -0.14);
    tail.rotation.x = 0.35;
  }
}

function addHat(head, a) {
  if (!a.hat) return;
  const hex = a.hatColor ?? '#3a3128';
  const m = color(hex, 0.9, 0, THREE.DoubleSide);
  // Hats sit on the brow: the skull there is narrower than it is deep.
  const seat = new THREE.Group();
  seat.position.set(0, HEAD_Y + 0.056, -0.004);
  seat.scale.set(0.95, 1, 1.07);
  seat.rotation.x = 0.05;
  head.add(seat);
  const lathe = (pts, seg = 32) => new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg);
  if (a.hat === 'fedora') {
    mesh(seat, lathe([[0.1, 0.004], [0.158, -0.006], [0.178, 0.004], [0.158, 0.003], [0.1, 0.012]]), m);
    mesh(seat, lathe([[0.103, 0], [0.101, 0.05], [0.092, 0.086], [0.068, 0.099], [0.03, 0.093], [0, 0.092]]), m);
    mesh(seat, new THREE.CylinderGeometry(0.1035, 0.1045, 0.022, 32, 1, true), color(shade(hex, 0.5), 0.8), 0, 0.016, 0);
  } else if (a.hat === 'flatcap') {
    const cap = mesh(seat, new THREE.SphereGeometry(0.112, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), m, 0, -0.012, 0.01);
    cap.scale.set(1, 0.62, 1.14);
    const peak = mesh(seat, new THREE.CylinderGeometry(0.08, 0.08, 0.008, 20, 1, false, -Math.PI / 2, Math.PI), m, 0, 0.012, 0.078);
    peak.rotation.x = 0.16;
  } else if (a.hat === 'police') {
    mesh(seat, lathe([[0.102, 0], [0.104, 0.03], [0.128, 0.06], [0.124, 0.07], [0.05, 0.076], [0, 0.076]]), m);
    mesh(seat, new THREE.CylinderGeometry(0.1045, 0.1035, 0.024, 32, 1, true), color('#0c0f14', 0.5), 0, 0.016, 0);
    const peak = mesh(seat, new THREE.CylinderGeometry(0.096, 0.096, 0.007, 24, 1, false, -Math.PI / 2, Math.PI), color('#0c0f14', 0.3), 0, 0.004, 0.046);
    peak.rotation.x = 0.2;
    mesh(seat, new THREE.SphereGeometry(0.014, 10, 8), brass(), 0, 0.044, 0.112).scale.set(1, 1.2, 0.4);
  }
}
