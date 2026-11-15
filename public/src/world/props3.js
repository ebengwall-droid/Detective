// Prop library, part three: the Fold. Letter-locks, the Bellows (the guild's
// pneumatic post), clocks with two minute hands, cipher wheels, and the set
// pieces of each of its rooms.
//
// Same rules as props.js: a prop fills its group (origin on the floor, front
// facing +Z) and may return { c: [w, d] } to block walking. Things that hang on
// a wall put their origin on the wall's surface and read `y` for their height.

import * as THREE from 'three';
import { box, cyl, sph, plane, lathe, torus, group } from './geo.js';
import { mat, glow, artMaterial, blobShadowMaterial } from './materials.js';
import { ART } from './art.js';
import { assets } from './assets.js';
import { PROPS, def } from './props.js';
import './props2.js';

const WARM = 0xffb45e;
const DEG = Math.PI / 180;

const VELVET = '#3a1420';
const BAIZE = '#1f4a34';
const IVORY = '#e4dcc4';
const LEAF = '#2f4a34';

/**
 * Models that some of these props stand in themselves when they are in memory
 * (a chess set on its table, a cake under its dome). dress.js reads this so
 * that a room fetches them.
 */
export const NESTED = {
  chessTable: ['chess_set'],
  automaton: ['chess_set'],
  cakeDome: ['cake'],
  teaTable: ['tea_set'],
  foxgloves: ['vase'],
  planTable: ['magnifier'],
  watchBench: ['magnifier'],
  dominoTable: ['round_table'],
};

// ------------------------------------------------------------------ helpers

function shadowBlob(g, w, d, y = 0.012) {
  const m = plane(g, w * 1.25, d * 1.25, blobShadowMaterial(), 0, y, 0, { rx: -90, unitUv: true, dyn: true });
  m.renderOrder = 1;
  return m;
}

function doubleSided(material) {
  material.side = THREE.DoubleSide;
  return material;
}

/**
 * How high a wall-hung thing puts itself. On a wall, or stood free with no `y`,
 * the prop lifts itself; given a `y` away from a wall, the builder has already.
 */
const hung = (o, fallback) => (o.wall || o.y === undefined ? o.y ?? fallback : 0);

/** A model from the manifest, standing on its base at a point in a prop. Null if it is not in memory. */
function nested(g, name, { x = 0, y = 0, z = 0, s = 1, ry = 0, rx = 0, rz = 0 } = {}) {
  const prop = assets.prop(name);
  if (!prop) return null;
  const model = prop.scene.clone(true);
  model.traverse((m) => {
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    m.material.envMapIntensity = 0.7;
    m.geometry.userData.shared = true;
  });
  const [minX, minY, minZ] = prop.info.min;
  const [maxX, , maxZ] = prop.info.max;
  model.position.set(-(minX + maxX) / 2, -minY, -(minZ + maxZ) / 2);
  const holder = group(g, x, y, z, ry);
  // Turned about the upright last, so that something laid on its side can still be pointed any way.
  holder.rotation.order = 'YXZ';
  holder.rotation.x = rx * DEG;
  holder.rotation.z = rz * DEG;
  holder.scale.setScalar(s);
  holder.userData.dyn = true;
  holder.add(model);
  return holder;
}

/** A toothed wheel lying in the XY plane (its face toward +Z), crossed out like a clock wheel. */
function gear(parent, r, teeth, thick, material, x = 0, y = 0, z = 0, opts = {}) {
  const shape = new THREE.Shape();
  const root = r * (1 - Math.min(0.2, 2.4 / teeth));
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : root;
    if (i === 0) shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  shape.closePath();
  const spokes = opts.spokes ?? 4;
  if (spokes > 0) {
    const rim = root * 0.8;
    const hub = r * 0.3;
    for (let s = 0; s < spokes; s++) {
      const a0 = (s / spokes) * Math.PI * 2 + 0.2;
      const a1 = ((s + 1) / spokes) * Math.PI * 2 - 0.2;
      const hole = new THREE.Path();
      hole.absarc(0, 0, rim, a0, a1, false);
      hole.absarc(0, 0, hub, a1, a0, true);
      hole.closePath();
      shape.holes.push(hole);
    }
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 5 });
  geometry.translate(0, 0, -thick / 2);
  // Extrusions come without an index; give it the plain one, so it can be merged like everything else.
  geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
  const mesh = new THREE.Mesh(geometry, typeof material === 'string' ? mat(material) : material);
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx * DEG;
  if (opts.ry) mesh.rotation.y = opts.ry * DEG;
  if (opts.rz) mesh.rotation.z = opts.rz * DEG;
  if (opts.dyn) mesh.userData.dyn = true;
  parent.add(mesh);
  return mesh;
}

/** A round bar bent through points: pipes, handles, spouts, cables. */
function tube(parent, pts, radius, material, { seg = 18, radial = 8, tension = 0.35, dyn = false, noShadow = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'catmullrom', tension);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, radial, false), typeof material === 'string' ? mat(material) : material);
  if (dyn) mesh.userData.dyn = true;
  if (noShadow) mesh.userData.noShadow = true;
  parent.add(mesh);
  return mesh;
}

/** A straight round bar from one point to another. */
function rod(parent, a, b, radius, material, seg = 6, r2 = radius) {
  const from = new THREE.Vector3(...a);
  const to = new THREE.Vector3(...b);
  const len = from.distanceTo(to);
  const mesh = cyl(parent, r2, radius, len, material, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, seg);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize());
  return mesh;
}

/** A flat disc carrying a picture, facing +Z (or laid face up with flat: true). */
function disc(parent, r, material, x = 0, y = 0, z = 0, { flat = false, turn = 0, seg = 28, dyn = false } = {}) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, seg), material);
  mesh.position.set(x, y, z);
  if (flat) mesh.rotation.set(-Math.PI / 2, 0, turn * DEG);
  else mesh.rotation.z = turn * DEG;
  mesh.userData.noShadow = true;
  if (dyn) mesh.userData.dyn = true;
  parent.add(mesh);
  return mesh;
}

const art = {
  clock(time, face = 'cream', px = 256) {
    return artMaterial(`clock2:${time}:${face}:${px}`, px, px, (c, w, h, r) => ART.clock2(c, w, h, r, { time, face }), { rough: 0.5 });
  },
  wheel(tone, rings, px = 256) {
    const m = artMaterial(`cipherDisc:${tone}:${rings}:${px}`, px, px, (c, w, h, r) => ART.cipherDisc(c, w, h, r, { tone, rings }), { rough: tone === 'brass' ? 0.35 : 0.7 });
    if (tone === 'brass') m.metalness = 0.6;
    return m;
  },
  sheet(kind, i = 0) {
    const key = `sheet:${kind}:${i}`;
    if (kind === 'crossword') return artMaterial(key, 256, 340, (c, w, h, r) => ART.crossword(c, w, h, r, { kind: 'page', filled: 0.25 + i * 0.2, red: i % 2 === 1 }));
    if (kind === 'grid') return artMaterial(key, 256, 256, (c, w, h, r) => ART.crossword(c, w, h, r, { kind: 'grid', filled: 0.2 + i * 0.25, n: 15 }));
    if (kind === 'proof') return artMaterial(key, 160, 480, (c, w, h, r) => ART.proof(c, w, h, r));
    if (kind === 'crux') return artMaterial(key, 384, 512, (c, w, h, r) => ART.crux(c, w, h, r, { puzzle: i % 2 === 0, filled: i ? 0.5 : 0 }));
    if (kind === 'typed') return artMaterial(key, 256, 340, (c, w, h, r) => ART.typed(c, w, h, r, { lines: 10 + i * 2 }));
    return artMaterial(key, 256, 340, (c, w, h, r) => ART.handNotes(c, w, h, r));
  },
  plate(text, sub) {
    const m = artMaterial(`brassplate:${text}:${sub ?? ''}`, 256, sub ? 96 : 64, (c, w, h, r) => ART.sign(c, w, h, r, { text, sub, bg: '#b8923f', fg: '#2a1c06', size: sub ? 0.4 : 0.5 }), { rough: 0.35 });
    m.metalness = 0.6;
    return m;
  },
};

/** A cup on its saucer. */
function cupAndSaucer(parent, x, y, z, { full = false, material = 'ceramic', turn = 0 } = {}) {
  const c = group(parent, x, y, z, turn);
  cyl(c, 0.068, 0.05, 0.008, material, 0, 0.004, 0, 14);
  lathe(c, [[0.018, 0.008], [0.026, 0.012], [0.04, 0.04], [0.043, 0.062], [0.04, 0.062], [0.036, 0.04], [0.02, 0.016], [0, 0.014]], material, 0, 0, 0, 12);
  torus(c, 0.016, 0.004, material, 0.052, 0.038, 0, { seg: 8 });
  if (full) cyl(c, 0.037, 0.037, 0.002, '#3a2412', 0, 0.054, 0, 12);
  return c;
}

/** A teapot: belly, lid, a spout drawn out one side and a handle on the other. */
function teapot(parent, x, y, z, { s = 1, material = 'ceramic', turn = 0, cosy = null } = {}) {
  const p = group(parent, x, y, z, turn);
  p.scale.setScalar(s);
  lathe(p, [[0, 0], [0.05, 0], [0.058, 0.008], [0.082, 0.04], [0.09, 0.075], [0.08, 0.11], [0.056, 0.13], [0.04, 0.134], [0.042, 0.14], [0.02, 0.15], [0.012, 0.165], [0.016, 0.172], [0, 0.178]], material, 0, 0, 0, 16);
  tube(p, [[0.075, 0.05, 0], [0.11, 0.065, 0], [0.135, 0.1, 0], [0.155, 0.13, 0]], 0.013, material, { seg: 8, radial: 6 });
  const handle = torus(p, 0.042, 0.008, material, -0.09, 0.08, 0, { seg: 10, arc: Math.PI * 1.1 });
  handle.rotation.z = Math.PI * 0.45;
  if (cosy) {
    // Knitted, with a hole each side for spout and handle, and a bobble.
    lathe(p, [[0.1, 0], [0.105, 0.06], [0.094, 0.12], [0.06, 0.165], [0.02, 0.185], [0, 0.188]], cosy, 0, 0, 0, 12);
    sph(p, 0.022, cosy, 0, 0.2, 0, 8);
  }
  return p;
}

/** One of the Bellows' carriers: a brass tube with a leather cap and a felt collar at each end. */
function carrier(parent, x, y, z, { turn = 0, upright = false, s = 1 } = {}) {
  const c = group(parent, x, y, z, turn);
  c.scale.setScalar(s);
  const body = group(c);
  if (!upright) body.rotation.z = Math.PI / 2;
  cyl(body, 0.03, 0.03, 0.15, 'brass', 0, 0, 0, 14);
  for (const sy of [-1, 1]) {
    cyl(body, 0.036, 0.036, 0.018, 'fabricWine', 0, sy * 0.075, 0, 14);
    cyl(body, 0.033, 0.033, 0.03, 'leather', 0, sy * 0.098, 0, 14);
    cyl(body, 0.028, 0.033, 0.01, 'leather', 0, sy * 0.118, 0, 14, sy < 0 ? { rx: 180 } : undefined);
  }
  cyl(body, 0.0305, 0.0305, 0.03, 'brassDull', 0, 0, 0, 14);
  return c;
}

/** The lettered rings of a letter-lock on their spindle, the spindle running left to right. Returns their length. */
function letterRings(parent, n, rnd, { r = 0.034, len = 0.03, x = 0, y = 0, z = 0 } = {}) {
  const band = artMaterial('letterBand', 1024, 64, (c, w, h) => ART.letterBand(c, w, h), { rough: 0.38 });
  band.metalness = 0.7;
  const pitch = len + 0.007;
  const total = n * pitch;
  const holder = group(parent, x, y, z);
  cyl(holder, r * 0.4, r * 0.4, total + 0.06, 'steelDark', 0, 0, 0, 8, { rz: 90 });
  for (let i = 0; i < n; i++) {
    const cx = (i - (n - 1) / 2) * pitch;
    const spin = group(holder, cx, 0, 0);
    spin.rotation.z = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 26, 1, true), band);
    // Stop each ring on a letter, a different one for each.
    ring.rotation.y = -((Math.floor(rnd() * 26) + 0.5) / 26) * Math.PI * 2;
    spin.add(ring);
    for (const s of [-1, 1]) cyl(holder, r * 1.05, r * 1.05, 0.004, 'brassDull', cx + (s * len) / 2, 0, 0, 20, { rz: 90 });
  }
  for (const s of [-1, 1]) cyl(holder, r * 0.78, r * 0.86, 0.022, 'brass', s * (total / 2 + 0.016), 0, 0, 14, { rz: s * 90 });
  return total;
}

/** A letter-lock on its brass plate, built facing +Z about the given parent's origin. Returns its width. */
function buildLetterLock(parent, n, rnd, { bolt = 1 } = {}) {
  const r = 0.034;
  const span = n * 0.037;
  const w = span + 0.15;
  const hgt = 0.15;
  box(parent, w - hgt, hgt, 0.01, 'brassDull', 0, 0, 0.005);
  for (const s of [-1, 1]) cyl(parent, hgt / 2, hgt / 2, 0.01, 'brassDull', s * (w - hgt) * 0.5, 0, 0.005, 18, { rx: 90 });
  box(parent, w - hgt, hgt - 0.03, 0.006, 'brass', 0, 0, 0.012);
  // Two cheeks carry the spindle.
  for (const s of [-1, 1]) {
    box(parent, 0.02, 0.085, 0.052, 'brass', s * (span / 2 + 0.038), 0, 0.036);
    cyl(parent, 0.02, 0.02, 0.021, 'brass', s * (span / 2 + 0.038), 0, 0.062, 12, { rz: 90 });
    sph(parent, 0.008, 'steelDark', s * (w / 2 - 0.022), 0.045, 0.014, 6);
    sph(parent, 0.008, 'steelDark', s * (w / 2 - 0.022), -0.045, 0.014, 6);
  }
  letterRings(parent, n, rnd, { r, z: 0.052 });
  // The line the letters are read against.
  box(parent, span + 0.02, 0.004, 0.004, 'steelDark', 0, r + 0.012, 0.05);
  box(parent, span + 0.02, 0.004, 0.004, 'steelDark', 0, -r - 0.012, 0.05);
  // The bolt it holds, shot out one side.
  if (bolt) {
    cyl(parent, 0.012, 0.012, 0.11, 'steel', bolt * (w / 2 + 0.02), 0, 0.03, 10, { rz: 90 });
    box(parent, 0.03, 0.05, 0.035, 'brass', bolt * (w / 2 - 0.02), 0, 0.03);
  }
  return w;
}

// --------------------------------------------------------------- letter-locks

/** A letter-lock on a wall, a post or a gate: a brass plate, a spindle, and o.n lettered rings. */
def('letterLock', (g, o, ctx) => {
  const L = group(g, 0, hung(o, 1.1), 0);
  buildLetterLock(L, o.n ?? 7, ctx.rnd, { bolt: o.bolt ?? 1 });
  return { c: null, h: 0 };
});

/**
 * A door seen from inside its room, with what holds it shut.
 *   lock: 'letter' (a letter-lock of o.n rings), 'night' (a night latch and chain) or 'none'
 *   forced: the frame is splintered round the keep and the door stands ajar
 *   flip: hang it from the other jamb
 *   port: a brass porthole in the leaf (a boat's hatch)
 */
def('lockDoor', (g, o, ctx) => {
  const w = o.w ?? 0.92;
  const h = o.h ?? 2.06;
  const m = o.mat ?? 'woodDark';
  const frame = o.frame ?? 'woodBlack';
  const lock = o.lock ?? 'letter';
  // The leaf runs from its hinge toward +X, or with o.flip toward -X.
  const side = o.flip ? -1 : 1;
  box(g, 0.08, h + 0.08, 0.14, frame, -w / 2 - 0.04, (h + 0.08) / 2, 0);
  box(g, 0.08, h + 0.08, 0.14, frame, w / 2 + 0.04, (h + 0.08) / 2, 0);
  box(g, w + 0.16, 0.08, 0.14, frame, 0, h + 0.04, 0);
  const open = o.open ?? (o.forced ? 17 : 0);
  if (open) box(g, w, h, 0.012, 'dark', 0, h / 2, -0.03, { noShadow: true });
  const leaf = group(g, (-side * w) / 2, 0, 0);
  leaf.rotation.y = -side * open * DEG;
  const at = (x) => side * x;
  box(leaf, w, h, 0.045, m, at(w / 2), h / 2, 0);
  for (const py of [0.3, 0.72]) {
    box(leaf, w * 0.7, h * 0.32, 0.052, o.panel ?? m, at(w / 2), h * py, 0);
    box(leaf, w * 0.7 + 0.03, 0.012, 0.058, frame, at(w / 2), h * py + h * 0.16, 0);
    box(leaf, w * 0.7 + 0.03, 0.012, 0.058, frame, at(w / 2), h * py - h * 0.16, 0);
  }
  for (const hy of [0.18, 0.85]) cyl(leaf, 0.012, 0.012, 0.1, 'brassDull', at(0.004), h * hy, 0.028, 8);
  if (o.port) {
    torus(leaf, 0.11, 0.02, 'brass', at(w / 2), h * 0.74, 0.03, { seg: 16 });
    cyl(leaf, 0.105, 0.105, 0.012, 'glassDark', at(w / 2), h * 0.74, 0.026, 16, { rx: 90, noShadow: true });
  }
  const ly = Math.min(1.08, h * 0.56);
  const jamb = side * (w / 2 + 0.03);
  if (lock === 'letter') {
    const L = group(leaf, at(w - 0.3), ly, 0.0235);
    buildLetterLock(L, o.n ?? 7, ctx.rnd, { bolt: o.forced ? 0 : side });
    // A drop handle under it.
    torus(leaf, 0.035, 0.007, 'brass', at(w - 0.14), ly - 0.2, 0.04, { seg: 12 });
    cyl(leaf, 0.022, 0.022, 0.012, 'brass', at(w - 0.14), ly - 0.165, 0.03, 10, { rx: 90 });
    if (!o.forced) box(g, 0.03, 0.07, 0.04, 'brass', jamb + side * 0.005, ly, 0.075);
  } else if (lock === 'night') {
    // A night latch: the brass box, its little turn and snib; and a chain above it.
    box(leaf, 0.1, 0.075, 0.03, 'brass', at(w - 0.075), ly + 0.25, 0.038);
    cyl(leaf, 0.016, 0.016, 0.02, 'brassDull', at(w - 0.085), ly + 0.25, 0.062, 10, { rx: 90 });
    box(leaf, 0.008, 0.018, 0.012, 'brassDull', at(w - 0.05), ly + 0.275, 0.056);
    box(g, 0.035, 0.085, 0.03, 'brass', jamb, ly + 0.25, 0.082);
    sph(leaf, 0.034, 'brass', at(w - 0.09), ly, 0.05, 10);
    cyl(leaf, 0.02, 0.02, 0.02, 'brassDull', at(w - 0.09), ly, 0.03, 10, { rx: 90 });
    box(leaf, 0.11, 0.02, 0.012, 'brassDull', at(w - 0.14), ly + 0.42, 0.03);
    box(g, 0.03, 0.03, 0.02, 'brassDull', jamb + side * 0.01, ly + 0.42, 0.08);
    for (let i = 0; i < 9; i++) torus(g, 0.008, 0.002, 'brassDull', jamb + side * 0.01, ly + 0.4 - i * 0.014, 0.085, { seg: 6, ry: i % 2 ? 90 : 0 });
    // The letter flap.
    box(leaf, 0.26, 0.05, 0.008, 'brass', at(w / 2), h * 0.5, 0.03);
  } else {
    sph(leaf, 0.035, 'brass', at(w - 0.09), h * 0.47, 0.05, 8);
  }
  if (o.forced) {
    // Raw wood where the keep was torn out of the jamb, and what came away with it.
    box(g, 0.06, 0.42, 0.03, 'woodLight', jamb - side * 0.012, ly, 0.062, { rz: 2 });
    box(g, 0.035, 0.2, 0.034, 'woodLight', jamb - side * 0.03, ly + 0.26, 0.062, { rz: -6 });
    for (let i = 0; i < 12; i++) {
      const len = 0.08 + ctx.rnd() * 0.16;
      box(g, 0.012 + ctx.rnd() * 0.012, len, 0.006, 'woodLight', jamb - side * ctx.rnd() * 0.03, ly - 0.16 + ctx.rnd() * 0.32, 0.075 + ctx.rnd() * 0.02, { rz: (ctx.rnd() - 0.5) * 50, rx: (ctx.rnd() - 0.5) * 40 });
    }
    // The keep hangs by one screw; splinters lie where they fell.
    box(g, 0.03, 0.075, 0.04, 'brass', jamb - side * 0.005, ly - 0.04, 0.085, { rz: 24 });
    for (let i = 0; i < 6; i++) {
      box(g, 0.01 + ctx.rnd() * 0.012, 0.004, 0.06 + ctx.rnd() * 0.12, 'woodLight', side * (w / 2 - 0.1 - ctx.rnd() * 0.4), 0.004, 0.14 + ctx.rnd() * 0.3, { ry: ctx.rnd() * 180 });
    }
  }
  return { c: null, h };
});

// ------------------------------------------------------------- the Bellows

/**
 * An outlet of the Bellows on a wall: the brass pipe down from the ceiling, its
 * mouth and hinged flap, a bell, and a baize tray with (o.carrier) a carrier in it.
 */
def('bellowsOutlet', (g, o, ctx) => {
  const y = hung(o, 1.12);
  const ceil = (ctx.ceil ?? 2.8) - (o.wall || o.y === undefined ? 0 : o.y);
  const b = group(g, 0, y, 0);
  // Backboard.
  box(b, 0.36, 0.66, PROUD, 'woodDark', 0, 0.02, PROUD / 2);
  box(b, 0.4, 0.03, 0.035, 'woodBlack', 0, 0.36, 0.0175);
  box(b, 0.4, 0.03, 0.035, 'woodBlack', 0, -0.32, 0.0175);
  // The pipe, clipped to the wall, and the bend that brings it out over the tray.
  const top = ceil - y;
  cyl(b, 0.046, 0.046, top - 0.26, 'brass', 0, 0.26 + (top - 0.26) / 2, 0.085, 14);
  for (let cy = 0.5; cy < top - 0.1; cy += 0.6) {
    cyl(b, 0.052, 0.052, 0.03, 'brassDull', 0, cy, 0.085, 14);
    box(b, 0.15, 0.03, 0.04, 'brassDull', 0, cy, 0.03);
  }
  cyl(b, 0.07, 0.07, 0.02, 'brassDull', 0, top - 0.01, 0.085, 14);
  tube(b, [[0, 0.3, 0.085], [0, 0.2, 0.09], [0, 0.11, 0.125], [0, 0.05, 0.185]], 0.046, 'brass', { seg: 10, radial: 12 });
  // The mouth: a flared collar, and a flap hung from a hinge above it, a little open.
  const mouth = group(b, 0, 0.04, 0.195);
  mouth.rotation.x = 0.85;
  cyl(mouth, 0.064, 0.05, 0.035, 'brassDull', 0, -0.01, 0, 16);
  cyl(mouth, 0.045, 0.045, 0.004, 'dark', 0, -0.029, 0, 14);
  const flap = group(mouth, 0, -0.032, -0.062);
  flap.rotation.x = 0.5;
  cyl(flap, 0.062, 0.062, 0.006, 'brass', 0, 0, 0.062, 16);
  cyl(flap, 0.008, 0.008, 0.11, 'brassDull', 0, 0, 0, 6, { rz: 90 });
  // The bell that says something has come.
  lathe(b, [[0, 0.04], [0.02, 0.038], [0.036, 0.022], [0.04, 0], [0.036, 0], [0.03, 0.018], [0, 0.03]], 'brass', -0.11, 0.2, 0.05, 12);
  cyl(b, 0.004, 0.004, 0.05, 'steelDark', -0.11, 0.2, 0.025, 4, { rx: 90 });
  // The tray it drops into.
  const ty = -0.22;
  box(b, 0.34, 0.016, 0.2, 'woodDark', 0, ty, 0.12);
  box(b, 0.3, 0.004, 0.16, BAIZE, 0, ty + 0.01, 0.12);
  for (const s of [-1, 1]) box(b, 0.016, 0.05, 0.2, 'woodDark', s * 0.17, ty + 0.025, 0.12);
  box(b, 0.34, 0.035, 0.014, 'woodDark', 0, ty + 0.018, 0.213);
  cyl(b, 0.006, 0.006, 0.34, 'brass', 0, ty + 0.058, 0.213, 6, { rz: 90 });
  for (const s of [-1, 1]) {
    box(b, 0.018, 0.14, 0.018, 'brassDull', s * 0.13, ty - 0.07, 0.02);
    rod(b, [s * 0.13, ty - 0.13, 0.02], [s * 0.13, ty - 0.01, 0.18], 0.007, 'brassDull');
  }
  // Which station this is.
  plane(b, 0.11, 0.04, art.plate(o.label ?? 'BELLOWS'), 0.1, 0.2, PROUD + 0.002, { unitUv: true, noShadow: true });
  if (o.carrier !== false) carrier(b, 0.01, ty + 0.046, 0.12, { turn: 12 });
  return { c: null, h: 0 };
});

/** A carrier lying loose on a desk or a shelf. */
def('carrier', (g, o) => {
  carrier(g, 0, 0.036, 0, { upright: !!o.upright });
  if (o.upright) g.children[0].position.y = 0.123;
  return { c: null, h: 0.08 };
});

/**
 * The Bellows exchange: a dozen tubes up a board to a brass manifold under the
 * ceiling, a trough they deliver into, a rack of carriers waiting to go, and
 * the clockwork dial that says which line is open.
 */
def('bellowsExchange', (g, o, ctx) => {
  const n = o.n ?? 12;
  const w = o.w ?? 2.1;
  const ceil = ctx.ceil ?? 3;
  const base = hung(o, 0.8);
  const b = group(g, 0, base, 0);
  const top = Math.max(1.9, ceil - base - 0.02);
  box(b, w, 1.55, PROUD, 'woodDark', 0, 0.775, PROUD / 2);
  box(b, w + 0.06, 0.05, 0.05, 'woodBlack', 0, 1.56, 0.025);
  box(b, w + 0.06, 0.05, 0.05, 'woodBlack', 0, 0, 0.025);
  const pitch = (w - 0.75) / (n - 1);
  const x0 = -w / 2 + 0.14;
  // The manifold: one fat trunk along the top that every line rises into.
  const my = top - 0.16;
  cyl(b, 0.085, 0.085, w + 0.1, 'brass', 0, my, 0.14, 16, { rz: 90 });
  for (const s of [-1, 1]) {
    cyl(b, 0.095, 0.095, 0.03, 'brassDull', s * (w / 2 + 0.04), my, 0.14, 16, { rz: 90 });
    box(b, 0.05, 0.14, 0.14, 'brassDull', s * (w / 2 - 0.2), my + 0.05, 0.07);
  }
  for (let i = 0; i < n; i++) {
    const x = x0 + i * pitch;
    const z = i % 2 ? 0.1 : 0.14;
    const y0 = 0.88;
    cyl(b, 0.032, 0.032, my - y0, 'brass', x, (my + y0) / 2, z, 10);
    cyl(b, 0.038, 0.038, 0.025, 'brassDull', x, my - 0.1, z, 10);
    cyl(b, 0.038, 0.038, 0.025, 'brassDull', x, 1.3, z, 10);
    if (i % 2 === 0) box(b, 0.05, 0.02, z, 'brassDull', x, 1.3, z / 2);
    // Each line ends in a mouth and a flap over the trough.
    const mouth = group(b, x, y0, z);
    mouth.rotation.x = 0.5;
    cyl(mouth, 0.044, 0.034, 0.03, 'brassDull', 0, -0.012, 0, 10);
    const flap = group(mouth, 0, -0.03, -0.04);
    flap.rotation.x = i % 5 === 2 ? 0.9 : 0.25;
    cyl(flap, 0.042, 0.042, 0.005, 'brass', 0, 0, 0.04, 10);
  }
  // Numbers over the mouths.
  const numbers = artMaterial(`bellowsNumbers:${n}`, 1024, 48, (c, cw, ch) => {
    c.fillStyle = '#e9e2cc';
    c.fillRect(0, 0, cw, ch);
    c.fillStyle = '#1c1a18';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `bold ${Math.round(ch * 0.7)}px Georgia, serif`;
    for (let i = 0; i < n; i++) c.fillText(String(i + 1), ((i + 0.5) * cw) / n, ch * 0.55);
  });
  plane(b, pitch * n, 0.05, numbers, x0 + (pitch * (n - 1)) / 2, 1.42, PROUD + 0.002, { unitUv: true, noShadow: true });
  // The trough.
  const tx = x0 + (pitch * (n - 1)) / 2;
  const tw = pitch * (n - 1) + 0.22;
  box(b, tw, 0.02, 0.24, 'woodDark', tx, 0.7, 0.14);
  box(b, tw - 0.04, 0.004, 0.2, BAIZE, tx, 0.712, 0.14);
  box(b, tw, 0.07, 0.016, 'woodDark', tx, 0.735, 0.262);
  for (const s of [-1, 1]) box(b, 0.016, 0.07, 0.24, 'woodDark', tx + (s * tw) / 2, 0.735, 0.14);
  cyl(b, 0.007, 0.007, tw, 'brass', tx, 0.78, 0.262, 6, { rz: 90 });
  carrier(b, tx - tw * 0.28, 0.748, 0.15, { turn: 20 });
  carrier(b, tx + tw * 0.2, 0.748, 0.12, { turn: -8 });
  // Carriers waiting, stood in a rack.
  box(b, tw, 0.03, 0.14, 'wood', tx, 0.36, 0.09);
  box(b, tw, 0.03, 0.14, 'wood', tx, 0.2, 0.09);
  for (const s of [-1, 1]) box(b, 0.025, 0.24, 0.14, 'wood', tx + s * (tw / 2 - 0.012), 0.27, 0.09);
  const slots = Math.floor(tw / 0.115);
  for (let i = 0; i < slots; i++) {
    if (i % 4 === 3) continue;
    carrier(b, tx - tw / 2 + 0.09 + i * ((tw - 0.18) / (slots - 1)), 0.34, 0.09, { upright: true });
  }
  // The dial and its levers.
  const dx = w / 2 - 0.3;
  cyl(b, 0.2, 0.2, 0.06, 'brass', dx, 1.15, 0.045, 28, { rx: 90 });
  disc(b, 0.17, artMaterial('dial:12', 256, 256, (c, cw, ch, r) => ART.dial(c, cw, ch, r, { n, at: 4 })), dx, 1.15, 0.077);
  torus(b, 0.18, 0.012, 'brassDull', dx, 1.15, 0.078, { seg: 28 });
  gear(b, 0.09, 16, 0.012, 'brassDull', dx - 0.02, 0.84, 0.05);
  gear(b, 0.055, 10, 0.012, 'brass', dx + 0.1, 0.9, 0.06);
  for (let i = 0; i < 3; i++) {
    const lx = dx - 0.12 + i * 0.12;
    box(b, 0.03, 0.06, 0.03, 'iron', lx, 0.52, 0.045);
    rod(b, [lx, 0.52, 0.05], [lx + (i - 1) * 0.03, 0.72, 0.13], 0.008, 'steel');
    sph(b, 0.02, 'woodBlack', lx + (i - 1) * 0.03, 0.73, 0.135, 8);
  }
  plane(b, 0.34, 0.085, art.plate('THE BELLOWS', 'EXCHANGE'), dx, 1.44, PROUD + 0.002, { unitUv: true, noShadow: true });
  return { c: [w, 0.3], h: 0 };
});

// -------------------------------------------------------------- the gatehouse

/** Iron railings along X from x0 to x1: rails, bars with spear heads, and a post at each end. */
function railings(g, x0, x1, { h = 1.05, pitch = 0.115 } = {}) {
  const len = x1 - x0;
  if (len < 0.1) return;
  const cx = (x0 + x1) / 2;
  box(g, len, 0.035, 0.03, 'iron', cx, h, 0);
  box(g, len, 0.035, 0.03, 'iron', cx, 0.13, 0);
  const n = Math.max(1, Math.round(len / pitch));
  for (let i = 0; i <= n; i++) {
    const x = x0 + (len * i) / n;
    cyl(g, 0.0095, 0.0095, h + 0.02, 'iron', x, (h + 0.02) / 2 + 0.03, 0, 5);
    cyl(g, 0.0005, 0.018, 0.07, 'iron', x, h + 0.085, 0, 4);
  }
}

/** A square iron gate pier with a moulded foot and a pyramid cap. */
function pier(g, x, z, h, s = 0.16) {
  box(g, s, h, s, 'iron', x, h / 2, z);
  box(g, s + 0.06, 0.1, s + 0.06, 'iron', x, 0.05, z);
  box(g, s + 0.04, 0.035, s + 0.04, 'iron', x, h - 0.12, z);
  box(g, s + 0.05, 0.03, s + 0.05, 'iron', x, h, z);
  cyl(g, 0.0005, (s + 0.03) * 0.7, 0.12, 'iron', x, h + 0.075, z, 4, { ry: 45 });
  sph(g, 0.03, 'brassDull', x, h + 0.15, z, 8);
}

/**
 * The Turnstile of Turnagain Lane: railings across the way, two iron piers, and
 * between them a four-armed stile that will not turn until the letter-lock on
 * the pier (o.n rings) is set. Runs along X; o.w is the whole span, o.at where
 * along it the stile stands. The lock faces +Z.
 */
def('turnstile', (g, o, ctx) => {
  const w = o.w ?? 6;
  const at = o.at ?? 0;
  const half = 0.6;
  railings(g, -w / 2 + 0.02, at - half - 0.08);
  railings(g, at + half + 0.08, w / 2 - 0.02);
  pier(g, at - half, 0, 1.55);
  pier(g, at + half, 0, 1.55);
  // Hoops either side keep you in the path of the arms.
  for (const s of [-1, 1]) {
    for (const hy of [1.0, 0.5]) {
      tube(g, [[at + s * half, hy, 0.08], [at + s * (half - 0.02), hy, 0.5], [at + s * (half - 0.14), hy, 0.62], [at + s * (half - 0.14), 0, 0.62]].slice(0, hy === 1.0 ? 4 : 3), 0.016, 'iron', { seg: 12, radial: 6, tension: 0.2 });
      tube(g, [[at + s * half, hy, -0.08], [at + s * (half - 0.02), hy, -0.5], [at + s * (half - 0.14), hy, -0.62], [at + s * (half - 0.14), 0, -0.62]].slice(0, hy === 1.0 ? 4 : 3), 0.016, 'iron', { seg: 12, radial: 6, tension: 0.2 });
    }
  }
  // The stile: a column, a ratchet drum, a brass hub and four arms.
  cyl(g, 0.2, 0.22, 0.03, 'iron', at, 0.015, 0, 16);
  cyl(g, 0.05, 0.06, 0.86, 'iron', at, 0.46, 0, 10);
  cyl(g, 0.085, 0.085, 0.09, 'iron', at, 0.86, 0, 14);
  const ratchet = gear(g, 0.11, 14, 0.03, 'brassDull', at, 0.925, 0, { rx: 90, spokes: 0 });
  ratchet.rotation.z = 0.3;
  const hub = group(g, at, 0.99, 0, 24);
  cyl(hub, 0.075, 0.085, 0.09, 'brass', 0, 0, 0, 14);
  lathe(hub, [[0.075, 0.045], [0.05, 0.075], [0.02, 0.09], [0, 0.092]], 'brass', 0, 0, 0, 12);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    rod(hub, [Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06], [Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5], 0.019, 'iron', 8);
    sph(hub, 0.028, 'brassDull', Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5, 8);
  }
  // The pawl that holds it, and the rod up from it to the lock.
  box(g, 0.2, 0.025, 0.03, 'steelDark', at + 0.2, 0.925, 0.06, { ry: -18 });
  rod(g, [at + half - 0.06, 0.93, 0.09], [at + half - 0.02, 1.12, 0.09], 0.008, 'steelDark');
  // The letter-lock, on the pier's face.
  const L = group(g, at + half, 1.2, 0.082);
  buildLetterLock(L, o.n ?? 5, ctx.rnd, { bolt: -1 });
  return { c: [w, 0.44], h: 1.6 };
});

/** A slate in a wooden frame, hung from a nail by its cord. o.lines is what is chalked on it. */
def('slate', (g, o) => {
  const w = o.w ?? 0.36;
  const h = o.h ?? 0.46;
  const y = hung(o, 1.4);
  const s = group(g, 0, y, 0);
  s.rotation.z = (o.tilt ?? -2) * DEG;
  box(s, w, h, 0.012, '#23292b', 0, 0, 0.012);
  const f = 0.03;
  box(s, w + f * 2, f, 0.024, 'woodLight', 0, h / 2 + f / 2, 0.016);
  box(s, w + f * 2, f, 0.024, 'woodLight', 0, -h / 2 - f / 2, 0.016);
  box(s, f, h, 0.024, 'woodLight', -w / 2 - f / 2, 0, 0.016);
  box(s, f, h, 0.024, 'woodLight', w / 2 + f / 2, 0, 0.016);
  const lines = o.lines ?? ['—'];
  const m = artMaterial(`slate:${lines.join('|')}:${o.small ?? ''}:${w}x${h}`, 384, Math.round((384 * h) / w), (c, cw, ch, r) => ART.slate(c, cw, ch, r, { lines, small: o.small, max: o.max }), { rough: 0.95 });
  plane(s, w, h, m, 0, 0, 0.0185, { unitUv: true, noShadow: true });
  if (o.cord !== false) {
    const top = h / 2 + f;
    rod(g, [-w * 0.4, y + top, 0.012], [0, y + top + 0.14, 0.012], 0.003, 'rope', 4);
    rod(g, [w * 0.4, y + top, 0.012], [0, y + top + 0.14, 0.012], 0.003, 'rope', 4);
    cyl(g, 0.007, 0.007, 0.03, 'iron', 0, y + top + 0.14, 0.014, 6, { rx: 90 });
    // The chalk, on its own string.
    rod(g, [w / 2 + f, y + top - 0.02, 0.02], [w / 2 + f + 0.03, y - h * 0.2, 0.02], 0.0015, 'rope', 3);
    cyl(g, 0.007, 0.007, 0.05, 'chalk', w / 2 + f + 0.03, y - h * 0.2 - 0.025, 0.02, 6);
  }
  return { c: null, h: 0 };
});

/** A tablet of stone let into a wall, with o.lines cut in it. */
def('stoneTablet', (g, o) => {
  const w = o.w ?? 1.2;
  const h = o.h ?? 0.7;
  const y = hung(o, 1.6);
  const stone = '#857f70';
  box(g, w + 0.14, h + 0.14, 0.035, stone, 0, y, 0.0175);
  box(g, w + 0.22, 0.06, 0.07, stone, 0, y - h / 2 - 0.09, 0.035);
  box(g, w + 0.18, 0.045, 0.055, stone, 0, y + h / 2 + 0.085, 0.0275);
  const lines = o.lines ?? [''];
  const m = artMaterial(`carved:${lines.join('|')}`, 640, Math.round((640 * h) / w), (c, cw, ch, r) => ART.carved(c, cw, ch, r, { lines }), { rough: 0.95 });
  plane(g, w, h, m, 0, y, 0.0365, { unitUv: true, noShadow: true });
  return { c: null, h: 0 };
});

/** A painted board. o.lines, o.bg, o.fg; o.chains hangs it from the ceiling by two chains. */
def('paintedBoard', (g, o, ctx) => {
  const w = o.w ?? 1.5;
  const h = o.h ?? 0.5;
  const y = hung(o, 2.4);
  box(g, w + 0.07, h + 0.07, 0.035, 'woodBlack', 0, y, 0.0175);
  const lines = o.lines ?? [''];
  const m = artMaterial(`board:${lines.join('|')}:${o.bg ?? ''}:${o.fg ?? ''}`, 768, Math.round((768 * h) / w), (c, cw, ch, r) => ART.board(c, cw, ch, r, { lines, bg: o.bg, fg: o.fg, max: o.max }), { rough: 0.7 });
  plane(g, w, h, m, 0, y, 0.036, { unitUv: true, noShadow: true });
  if (o.chains) {
    const ceil = (ctx.ceil ?? 3) - (o.wall || o.y === undefined ? 0 : o.y);
    for (const s of [-1, 1]) cyl(g, 0.006, 0.006, ceil - y - h / 2, 'iron', s * w * 0.4, (ceil + y + h / 2) / 2, 0.018, 4);
    // Seen from behind as well, when it hangs in the open.
    plane(g, w, h, m, 0, y, -0.001, { unitUv: true, noShadow: true, ry: 180 });
  }
  return { c: null, h: 0 };
});

/** The stones of an arch round a doorway: jambs, voussoirs and a keystone. Stands on the wall's face. */
def('archway', (g, o) => {
  const w = o.w ?? 1.4;
  const h = o.h ?? 2.3;
  const stone = o.mat ?? '#7d786a';
  const t = 0.2;
  const spring = h - w / 2;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const bh = spring / 5;
      box(g, t + (i % 2 ? 0.05 : 0), bh - 0.012, 0.09, stone, s * (w / 2 + t / 2 + (i % 2 ? 0.025 : 0)), bh * (i + 0.5), 0.045);
    }
  }
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI;
    const r = w / 2 + t / 2;
    const key = i === (n - 1) / 2;
    const v = box(g, (Math.PI * r) / n - 0.012, t + (key ? 0.1 : 0), key ? 0.12 : 0.09, stone, Math.cos(a) * (r + (key ? 0.03 : 0)), spring + Math.sin(a) * (r + (key ? 0.03 : 0)), key ? 0.06 : 0.045);
    v.rotation.z = a - Math.PI / 2;
  }
  // The dark of the arch's own soffit, filling the square corners of the opening.
  for (const s of [-1, 1]) {
    const corner = new THREE.Shape();
    corner.moveTo(s * (w / 2 + 0.02), w / 2 + 0.02);
    corner.lineTo(s * (w / 2 + 0.02), 0);
    for (let k = 0; k <= 8; k++) {
      const a = (k / 8) * (Math.PI / 2);
      corner.lineTo(s * Math.cos(a) * (w / 2), Math.sin(a) * (w / 2));
    }
    corner.lineTo(0, w / 2 + 0.02);
    corner.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(corner), mat(stone));
    mesh.position.set(0, spring, 0.02);
    g.add(mesh);
  }
  return { c: null, h: 0 };
});

/** Iron bars over a window, set in its reveal. o.w, o.h, o.sill as the window has them. */
def('windowBars', (g, o) => {
  const w = o.w ?? 1.0;
  const h = o.h ?? 1.2;
  const sill = o.sill ?? 1.0;
  const z = o.depth ?? -0.045;
  const n = Math.max(2, Math.round(w / 0.125));
  for (let i = 1; i < n; i++) cyl(g, 0.011, 0.011, h, 'iron', -w / 2 + (w * i) / n, sill + h / 2, z, 6);
  for (const fy of [0.22, 0.78]) box(g, w, 0.035, 0.012, 'iron', 0, sill + h * fy, z + 0.008);
  return { c: null, h: 0 };
});

/**
 * A square lantern of iron and glass. Hung from the ceiling by its chain
 * (o.hang, the height of its foot), or with o.wall on a scrolled bracket.
 */
def('ironLantern', (g, o, ctx) => {
  const ceil = ctx.ceil ?? 3;
  const onWall = !!o.wall;
  const y = onWall ? o.y ?? 2.0 : o.hang ?? 2.1;
  const z = onWall ? 0.34 : 0;
  const s = o.size ?? 1;
  const L = group(g, 0, y, z);
  L.scale.setScalar(s);
  const a = 0.085;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) box(L, 0.014, 0.3, 0.014, 'iron', sx * a, 0.15, sz * a);
  }
  box(L, a * 2 + 0.04, 0.02, a * 2 + 0.04, 'iron', 0, 0.01, 0);
  box(L, a * 2 + 0.05, 0.018, a * 2 + 0.05, 'iron', 0, 0.3, 0);
  cyl(L, 0.02, a * 1.62, 0.12, 'iron', 0, 0.37, 0, 4, { ry: 45 });
  cyl(L, 0.03, 0.03, 0.025, 'iron', 0, 0.44, 0, 8);
  torus(L, 0.025, 0.006, 'iron', 0, 0.475, 0, { seg: 10 });
  for (const [px, pz, ry] of [[0, a, 0], [0, -a, 0], [a, 0, 90], [-a, 0, 90]]) {
    box(L, a * 2 - 0.012, 0.27, 0.004, 'glassClear', px, 0.155, pz, { ry, noShadow: true });
  }
  cyl(L, 0.012, 0.014, 0.1, IVORY, 0, 0.07, 0, 8);
  const lit = o.lit !== false;
  if (lit) {
    const flame = sph(L, 0.016, glow(0xffd27a, 2.4), 0, 0.14, 0, 8, { dyn: true });
    flame.scale.set(0.8, 1.8, 0.8);
    const halo = ctx.halo(L, WARM, o.halo ?? 0.9, 0, 0.16, 0, 0.7);
    const light = o.light !== false ? ctx.light(L, { color: WARM, intensity: o.intensity ?? 6, distance: o.distance ?? 7, x: 0, y: 0.12, z: 0 }) : null;
    const base = light ? light.intensity : 0;
    const haloBase = halo.material.opacity;
    const phase = ctx.rnd() * 100;
    ctx.anim((t) => {
      const f = 0.88 + 0.08 * Math.sin(t * 8.3 + phase) + 0.05 * Math.sin(t * 21.1 + phase * 1.7);
      flame.scale.y = 1.6 + f * 0.4;
      halo.material.opacity = haloBase * f;
      if (light) light.intensity = base * f;
    });
  }
  if (onWall) {
    box(g, 0.07, 0.3, 0.02, 'iron', 0, y + 0.4, 0.01);
    tube(g, [[0, y + 0.3, 0.02], [0, y + 0.42, 0.14], [0, y + 0.56, 0.26], [0, y + 0.52, 0.34], [0, y + 0.49 * s + 0.0, 0.34]], 0.012, 'iron', { seg: 14, radial: 6 });
    tube(g, [[0, y + 0.28, 0.02], [0, y + 0.3, 0.12], [0, y + 0.4, 0.17]], 0.008, 'iron', { seg: 8, radial: 5 });
  } else {
    const top = y + 0.49 * s;
    cyl(g, 0.005, 0.005, ceil - top, 'iron', 0, (ceil + top) / 2, 0, 4);
    cyl(g, 0.05, 0.05, 0.02, 'iron', 0, ceil - 0.01, 0, 8);
  }
  return { c: null, h: 0 };
});

// ------------------------------------------------------------- on the walls

/** How far panelling stands out from a wall: flat things hung over it carry their picture this far out. */
const PROUD = 0.034;

/** The board behind a picture: it fills the gap to the wall, so that panelling does not swallow the picture's lower edge. */
function backing(g, w, h, y, material = 'woodBlack') {
  box(g, w, h, PROUD - 0.002, material, 0, y, (PROUD - 0.002) / 2);
}

function frameBars(g, w, h, y, depth, bar, material, z0 = 0) {
  box(g, w + bar * 2, bar, depth, material, 0, y + h / 2 + bar / 2, z0 + depth / 2);
  box(g, w + bar * 2, bar, depth, material, 0, y - h / 2 - bar / 2, z0 + depth / 2);
  box(g, bar, h, depth, material, -w / 2 - bar / 2, y, z0 + depth / 2);
  box(g, bar, h, depth, material, w / 2 + bar / 2, y, z0 + depth / 2);
}

const SITTERS = [
  { coat: '#2b2f3a', hair: '#b9b3a6', style: 'wig', old: 0.6, collar: '#e0d8c4' },
  { coat: '#3a2a1e', hair: '#4a3626', style: 'long', old: 0.3, collar: '#d8d0bc', chain: true },
  { coat: '#1f3a33', hair: '#8f8b84', style: 'bald', old: 0.8, collar: '#d0c8b4', glasses: true },
  { coat: '#4a1f24', hair: '#2c1f1a', style: 'short', old: 0.4, collar: '#e0d8c4' },
  { coat: '#27303f', hair: '#c9c2b0', style: 'bun', old: 0.7, collar: '#cfc6b0', skin: '#d6b29c' },
  { coat: '#3d3a2c', hair: '#5a3a26', style: 'short', old: 0.5, collar: '#d8d0bc', glasses: true, skin: '#b98e72' },
  { coat: '#2a2622', hair: '#a9a59b', style: 'wig', old: 0.5, collar: '#e6dcc8', chain: true },
];

function buildPortrait(g, o, ctx, x, y, w, h, look, key) {
  const bar = Math.max(0.05, w * 0.1);
  // Hung from the picture rail: the top leans out a little, the foot stays on the wall.
  const lean = 0.035;
  const p = group(g, x, y, (h / 2 + bar) * lean);
  p.rotation.x = lean;
  backing(p, w + bar, h + bar, 0);
  frameBars(p, w, h, 0, 0.066, bar, 'brassDull');
  frameBars(p, w, h, 0, 0.078, bar * 0.35, 'brass');
  frameBars(p, w + bar * 2, h + bar * 2, 0, 0.045, 0.012, 'woodBlack');
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) sph(p, bar * 0.36, 'brass', sx * (w / 2 + bar / 2), sy * (h / 2 + bar / 2), 0.066, 8);
  }
  const m = artMaterial(`portrait:${key}`, 320, Math.round((320 * h) / w), (c, cw, ch, r) => ART.portrait(c, cw, ch, r, look), { rough: 0.55 });
  plane(p, w, h, m, 0, 0, PROUD, { unitUv: true, noShadow: true });
  if (o.plate !== false) plane(p, Math.min(0.3, w * 0.5), 0.045, art.plate(o.plate ?? ' '), 0, -h / 2 - bar / 2, 0.08, { unitUv: true, noShadow: true });
  return p;
}

/**
 * A portrait in oils in a gilt frame. o.look describes the sitter (see ART.portrait);
 * o.lamp hangs a picture light over it.
 */
def('portrait', (g, o, ctx) => {
  const w = o.w ?? 0.62;
  const h = o.h ?? 0.8;
  const y = hung(o, 1.9);
  const look = o.look ?? SITTERS[0];
  buildPortrait(g, o, ctx, 0, y, w, h, look, o.key ?? JSON.stringify(look));
  if (o.lamp) {
    const ly = y + h / 2 + 0.2;
    rod(g, [0, ly - 0.04, 0.01], [0, ly + 0.02, 0.2], 0.008, 'brass');
    cyl(g, 0.022, 0.022, w * 0.6, 'brass', 0, ly + 0.02, 0.2, 8, { rz: 90 });
    box(g, w * 0.56, 0.006, 0.02, glow(0xffe2b0, 1.4), 0, ly + 0.002, 0.2);
    ctx.halo(g, WARM, 0.7, 0, ly - 0.05, 0.22, 0.4);
    if (o.light !== false) ctx.light(g, { color: 0xffd9a0, intensity: o.intensity ?? 3, distance: 4.5, x: 0, y: ly - 0.1, z: 0.45 });
  }
  return { c: null, h: 0 };
});

/** A row of portraits: the Company's past Wardens, o.n of them. */
def('portraitRow', (g, o, ctx) => {
  const n = o.n ?? 4;
  const w = o.w ?? 0.56;
  const h = o.h ?? 0.72;
  const gap = o.gap ?? 0.34;
  const y = hung(o, 2.0);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * (w + gap);
    const look = SITTERS[(i + (o.first ?? 0)) % SITTERS.length];
    buildPortrait(g, { plate: ' ' }, ctx, x, y + (i % 2 ? 0.012 : 0), w, h, look, `row:${(i + (o.first ?? 0)) % SITTERS.length}`);
  }
  return { c: null, h: 0 };
});

/** One clock: its case in a given style, and a face that tells Fold time and Greenwich. */
function clockBody(parent, style, r, time, face, ctx, { swing = false, px = 256 } = {}) {
  const wood = style === 'ebony' ? 'woodBlack' : 'woodDark';
  const faceAt = (y, z, rr = r) => disc(parent, rr, art.clock(time, face, px), 0, y, z);
  const pendulum = (y0, len, z, bob = 0.035) => {
    const p = group(parent, 0, y0, z);
    rod(p, [0, 0, 0], [0, -len, 0], 0.004, 'brass', 4);
    cyl(p, bob, bob, 0.012, 'brass', 0, -len, 0, 14, { rx: 90 });
    if (swing && ctx) {
      p.userData.dyn = true;
      const phase = ctx.rnd() * 6;
      const rate = 3.2 / Math.sqrt(len / 0.25);
      ctx.anim((t) => {
        p.rotation.z = Math.sin(t * rate + phase) * 0.16;
      });
    } else p.rotation.z = 0.1;
    return p;
  };
  if (style === 'octagon' || style === 'drop') {
    cyl(parent, r * 1.42, r * 1.42, 0.06, wood, 0, 0, 0.03, 8, { rx: 90, ry: 22.5 });
    torus(parent, r * 1.04, r * 0.07, 'brass', 0, 0, 0.065, { seg: 24 });
    faceAt(0, 0.064);
    if (style === 'drop') {
      // The trunk: an open box with a glazed front, the pendulum showing in it.
      const dh = r * 2.3;
      const cy = -r * 1.2 - dh / 2;
      box(parent, r * 1.5, dh, 0.02, wood, 0, cy, 0.01);
      box(parent, r * 1.3, dh - 0.02, 0.004, 'dark', 0, cy, 0.022, { noShadow: true });
      for (const s of [-1, 1]) box(parent, r * 0.2, dh, 0.085, wood, s * r * 0.65, cy, 0.0425);
      box(parent, r * 1.5, r * 0.18, 0.085, wood, 0, cy - dh / 2 + r * 0.09, 0.0425);
      box(parent, r * 1.14, dh * 0.86, 0.006, 'glassClear', 0, cy + r * 0.05, 0.084, { noShadow: true });
      cyl(parent, r * 0.75, r * 0.75, 0.085, wood, 0, -r * 1.2 - dh, 0.0425, 3, { rx: 90 });
      pendulum(-r * 1.05, dh * 0.7, 0.05, r * 0.22);
    }
  } else if (style === 'cuckoo') {
    box(parent, r * 2.3, r * 2.5, 0.12, wood, 0, 0, 0.06);
    for (const s of [-1, 1]) box(parent, r * 2.0, 0.03, 0.17, 'woodBlack', s * r * 0.82, r * 1.72, 0.075, { rz: s * -38 });
    faceAt(-r * 0.1, 0.124, r * 0.78);
    torus(parent, r * 0.8, r * 0.06, 'woodBlack', 0, -r * 0.1, 0.124, { seg: 18 });
    box(parent, r * 0.36, r * 0.4, 0.02, 'woodBlack', 0, r * 1.05, 0.125);
    for (const s of [-1, 1]) {
      const leaf = box(parent, r * 0.8, r * 0.34, 0.03, 'woodBlack', s * r * 1.05, -r * 1.2, 0.11, { rz: s * 35 });
      leaf.scale.y = 0.8;
      rod(parent, [s * r * 0.5, -r * 1.25, 0.06], [s * r * 0.5, -r * 3.6 - s * r * 0.5, 0.06], 0.003, 'brassDull', 3);
      lathe(parent, [[0, 0], [r * 0.14, r * 0.1], [r * 0.2, r * 0.45], [r * 0.1, r * 0.75], [0, r * 0.8]], 'iron', s * r * 0.5, -r * 4.4 - s * r * 0.5, 0.06, 8);
    }
    pendulum(-r * 1.25, r * 2.2, 0.04, r * 0.22);
  } else if (style === 'lantern') {
    // A brass lantern clock: a square case under a bell, on its wall bracket.
    box(parent, r * 1.7, r * 2.1, r * 1.3, 'brass', 0, 0, r * 0.75);
    for (const sx of [-1, 1]) {
      for (const sz of [0.12, 1.38]) {
        cyl(parent, r * 0.09, r * 0.09, r * 2.6, 'brassDull', sx * r * 0.85, 0, r * sz, 8);
        lathe(parent, [[0, 0], [r * 0.12, r * 0.05], [r * 0.05, r * 0.2], [0, r * 0.32]], 'brassDull', sx * r * 0.85, r * 1.3, r * sz, 8);
      }
    }
    lathe(parent, [[0, r * 0.62], [r * 0.3, r * 0.58], [r * 0.7, r * 0.3], [r * 0.82, 0], [r * 0.76, 0], [r * 0.62, r * 0.26], [0, r * 0.5]], 'brassDull', 0, r * 1.12, r * 0.75, 14);
    faceAt(0, r * 1.41, r * 0.8);
    box(parent, r * 1.9, 0.02, r * 1.6, 'woodBlack', 0, -r * 1.07, r * 0.75);
    box(parent, 0.03, r * 0.9, 0.03, 'woodBlack', 0, -r * 1.5, 0.02);
    for (const s of [-1, 1]) {
      rod(parent, [s * r * 0.3, -r * 1.05, r * 0.75], [s * r * 0.3, -r * (3 + s * 0.5), r * 0.75], 0.003, 'iron', 3);
      cyl(parent, r * 0.16, r * 0.16, r * 0.7, 'iron', s * r * 0.3, -r * (3.35 + s * 0.5), r * 0.75, 8);
    }
  } else if (style === 'banjo') {
    cyl(parent, r * 1.2, r * 1.2, 0.07, wood, 0, 0, 0.035, 20, { rx: 90 });
    torus(parent, r * 1.03, r * 0.07, 'brass', 0, 0, 0.074, { seg: 24 });
    faceAt(0, 0.073);
    box(parent, r * 0.72, r * 2.4, 0.06, wood, 0, -r * 2.2, 0.03);
    box(parent, r * 0.45, r * 1.9, 0.008, 'brassDull', 0, -r * 2.2, 0.063);
    box(parent, r * 1.7, r * 1.5, 0.08, wood, 0, -r * 4.1, 0.04);
    box(parent, r * 1.3, r * 1.1, 0.008, 'glassDark', 0, -r * 4.1, 0.083, { noShadow: true });
    lathe(parent, [[0, 0], [r * 0.14, r * 0.04], [r * 0.2, r * 0.2], [r * 0.08, r * 0.36], [0, r * 0.5]], 'brass', 0, r * 1.2, 0.035, 8);
  } else if (style === 'sun') {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const len = i % 2 ? r * 0.9 : r * 1.4;
      const ray = box(parent, r * 0.16, len, 0.012, 'brass', Math.sin(a) * (r + len / 2), Math.cos(a) * (r + len / 2), 0.02);
      ray.rotation.z = -a;
    }
    cyl(parent, r * 1.12, r * 1.12, 0.05, 'brassDull', 0, 0, 0.025, 24, { rx: 90 });
    faceAt(0, 0.052);
  } else if (style === 'bracket') {
    // An arched-top table clock, stood on a little shelf.
    box(parent, r * 2.3, r * 2.4, r * 1.3, wood, 0, -r * 0.2, r * 0.75);
    cyl(parent, r * 1.15, r * 1.15, r * 1.3, wood, 0, r * 1.0, r * 0.75, 16, { rx: 90 });
    box(parent, r * 2.6, r * 0.2, r * 1.5, wood, 0, -r * 1.5, r * 0.78);
    torus(parent, r * 0.3, r * 0.05, 'brass', 0, r * 2.25, r * 0.75, { seg: 10, arc: Math.PI });
    torus(parent, r * 0.9, r * 0.06, 'brass', 0, r * 0.25, r * 1.41, { seg: 20 });
    faceAt(r * 0.25, r * 1.405, r * 0.86);
    box(parent, r * 3.0, 0.025, r * 1.9, 'woodBlack', 0, -r * 1.62, r * 0.9);
    for (const s of [-1, 1]) box(parent, 0.025, r * 0.9, r * 1.4, 'woodBlack', s * r * 1.1, -r * 2.05, r * 0.65, { rx: 0 });
  } else {
    // A plain round dial clock in a turned case.
    cyl(parent, r * 1.22, r * 1.3, 0.07, wood, 0, 0, 0.035, 24, { rx: 90 });
    torus(parent, r * 1.05, r * 0.08, style === 'ebony' ? 'brassDull' : 'brass', 0, 0, 0.075, { seg: 28 });
    faceAt(0, 0.073);
  }
}

/**
 * A Fold clock on a wall: one hour hand and two minute hands, eleven minutes
 * apart. o.rad its radius, o.time Fold time, o.style round | ebony | octagon |
 * drop | banjo | cuckoo | lantern | sun | bracket, o.swing lets the pendulum go.
 */
def('foldClock', (g, o, ctx) => {
  const c = group(g, 0, hung(o, 2.2), 0);
  clockBody(c, o.style ?? 'round', o.rad ?? 0.24, o.time ?? '08:29', o.face ?? 'cream', ctx, { swing: o.swing, px: (o.rad ?? 0.24) > 0.3 ? 512 : 256 });
  return { c: null, h: 0 };
});

const CLOCK_TIMES = ['08:29', '03:12', '10:44', '06:01', '01:36', '11:20'];
const CLOCK_STYLES = ['round', 'drop', 'octagon', 'cuckoo', 'banjo', 'round', 'lantern', 'ebony', 'sun', 'drop', 'bracket', 'octagon'];

/**
 * A wall crowded with clocks, no two alike and no two agreeing: o.w along the
 * wall, between o.y0 and o.y1, o.n of them. o.skip [[x, y, r], ...] keeps room
 * for something hung there separately.
 */
def('clockWall', (g, o, ctx) => {
  const w = o.w ?? 4;
  const y0 = o.y0 ?? 0.95;
  const y1 = o.y1 ?? 2.75;
  const n = o.n ?? 20;
  const cols = Math.ceil(n / 2);
  const placed = [...(o.skip ?? [])];
  let made = 0;
  // Two rows of places, each tried a few times: one that will not fit is left empty rather than fought over.
  for (let slot = 0; slot < n; slot++) {
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    for (let attempt = 0; attempt < 4; attempt++) {
      const style = CLOCK_STYLES[(made + (o.first ?? 0)) % CLOCK_STYLES.length];
      const tall = style === 'drop' || style === 'banjo' || style === 'cuckoo' || style === 'lantern';
      const r = (tall ? 0.1 : 0.12) + ctx.rnd() * (tall ? 0.04 : 0.09);
      const x = -w / 2 + ((col + 0.5 + (ctx.rnd() - 0.5) * 0.6) * w) / cols;
      const y = (row ? y0 + (y1 - y0) * 0.3 : y0 + (y1 - y0) * 0.8) + (ctx.rnd() - 0.5) * 0.3 + (tall ? 0.18 : 0);
      const reach = r * (tall ? 2.6 : 1.5);
      if (placed.some(([px, py, pr]) => Math.hypot(px - x, (py - y) * 0.75) < pr + reach * 0.8)) continue;
      placed.push([x, y, reach]);
      const c = group(g, x, y, 0);
      clockBody(c, style, r, CLOCK_TIMES[Math.floor(ctx.rnd() * CLOCK_TIMES.length)], ctx.rnd() < 0.3 ? 'brass' : 'cream', ctx, { swing: made % 7 === 1 });
      made++;
      break;
    }
  }
  return { c: null, h: 0 };
});

/**
 * A longcase clock. Built to the measure of the modelled one (see dress.js), which
 * takes its place when it is in memory; the face, with its two minute hands, is ours either way.
 */
def('longcase', (g, o, ctx) => {
  const m = o.mat ?? 'wood';
  // Plinth, trunk and hood; the outline the model is fitted to runs x ±0.313, y 0–2.191, z -0.188–0.238.
  box(g, 0.626, 0.06, 0.426, m, 0, 0.03, 0.025);
  box(g, 0.56, 0.42, 0.38, m, 0, 0.27, 0.025);
  box(g, 0.4, 1.02, 0.28, m, 0, 0.99, 0.0);
  box(g, 0.28, 0.82, 0.02, 'woodDark', 0, 0.99, 0.145);
  box(g, 0.5, 0.56, 0.333, m, 0, 1.78, -0.0215);
  box(g, 0.626, 0.05, 0.426, m, 0, 1.52, 0.025);
  box(g, 0.626, 0.05, 0.426, m, 0, 2.06, 0.025);
  cyl(g, 0.16, 0.16, 0.36, m, 0, 2.02, 0.0, 16, { rx: 90 });
  box(g, 0.08, 0.071, 0.08, m, 0, 2.1555, 0);
  for (const s of [-1, 1]) cyl(g, 0.02, 0.02, 0.5, 'brassDull', s * 0.22, 1.79, 0.13, 8);
  const face = disc(g, 0.15, art.clock(o.time ?? '08:29', 'brass', 256), 0, 1.8, 0.153, { dyn: true });
  face.renderOrder = 2;
  shadowBlob(g, 0.7, 0.55);
  return { c: [0.6, 0.44], h: 2.2 };
});

/** A drum clock on an oak pedestal, made to be carried up and stood where it is needed. */
def('standClock', (g, o, ctx) => {
  const time = o.time ?? '11:49';
  box(g, 0.46, 0.06, 0.4, 'woodDark', 0, 0.03, 0);
  box(g, 0.4, 0.05, 0.34, 'wood', 0, 0.085, 0);
  // The pedestal tapers, with a glazed door to watch the pendulum by.
  box(g, 0.27, 0.98, 0.24, 'wood', 0, 0.6, 0);
  box(g, 0.31, 0.04, 0.28, 'woodDark', 0, 0.2, 0);
  box(g, 0.13, 0.62, 0.012, 'glassDark', 0, 0.62, 0.121, { noShadow: true });
  frameBars(g, 0.13, 0.62, 0.62, 0.014, 0.016, 'woodDark', 0.112);
  const p = group(g, 0, 0.9, 0.105);
  rod(p, [0, 0, 0], [0, -0.42, 0], 0.004, 'brass', 4);
  cyl(p, 0.04, 0.04, 0.012, 'brass', 0, -0.42, 0, 14, { rx: 90 });
  p.userData.dyn = true;
  ctx.anim((t) => {
    p.rotation.z = Math.sin(t * 2.6) * 0.12;
  });
  box(g, 0.34, 0.04, 0.3, 'woodDark', 0, 1.11, 0);
  // The cradle and the drum.
  for (const s of [-1, 1]) box(g, 0.03, 0.14, 0.2, 'brassDull', s * 0.13, 1.2, 0);
  cyl(g, 0.21, 0.21, 0.17, 'brass', 0, 1.39, 0, 28, { rx: 90 });
  cyl(g, 0.225, 0.225, 0.02, 'brassDull', 0, 1.39, 0.08, 28, { rx: 90 });
  cyl(g, 0.225, 0.225, 0.02, 'brassDull', 0, 1.39, -0.08, 28, { rx: 90 });
  disc(g, 0.195, art.clock(time, 'cream', 512), 0, 1.39, 0.091);
  torus(g, 0.2, 0.012, 'brass', 0, 1.39, 0.095, { seg: 28 });
  const handle = torus(g, 0.07, 0.008, 'brass', 0, 1.6, 0, { seg: 12, arc: Math.PI });
  handle.rotation.y = Math.PI / 2;
  // Its winding key, on a hook.
  torus(g, 0.014, 0.003, 'steel', 0.17, 0.95, 0.06, { seg: 8 });
  box(g, 0.005, 0.045, 0.005, 'steel', 0.17, 0.915, 0.06);
  shadowBlob(g, 0.6, 0.55);
  return { c: [0.46, 0.4], h: 1.65 };
});

/** A framed certificate. o.lines its heading. */
def('certificate', (g, o) => {
  const w = o.w ?? 0.42;
  const h = o.h ?? 0.54;
  const y = hung(o, 1.6);
  backing(g, w + 0.03, h + 0.03, y);
  frameBars(g, w, h, y, 0.05, 0.035, o.frame ?? 'woodBlack');
  frameBars(g, w, h, y, 0.054, 0.008, 'brassDull');
  const m = artMaterial(`certificate:${(o.lines ?? []).join('|')}:${o.sub ?? ''}`, 320, Math.round((320 * h) / w), (c, cw, ch, r) => ART.certificate(c, cw, ch, r, { lines: o.lines, sub: o.sub }));
  plane(g, w, h, m, 0, y, PROUD, { unitUv: true, noShadow: true });
  return { c: null, h: 0 };
});

/**
 * A picture in a plain frame from the Fold's own stock: o.art is 'plan', 'canal', 'stars',
 * 'crossword', 'grid', 'crux' or 'chess'.
 */
def('foldFrame', (g, o) => {
  const w = o.w ?? 0.6;
  const h = o.h ?? 0.45;
  const y = hung(o, 1.6);
  const kind = o.art ?? 'plan';
  let m;
  if (kind === 'plan') m = artMaterial('plan', 768, 512, (c, cw, ch, r) => ART.plan(c, cw, ch, r));
  else if (kind === 'canal' || kind === 'stars') m = artMaterial(`mapSheet:${kind}`, 512, Math.round((512 * h) / w), (c, cw, ch, r) => ART.mapSheet(c, cw, ch, r, { kind }));
  else if (kind === 'chess') m = artMaterial('chessboardPrint', 256, 256, (c, cw, ch, r) => ART.chessboard(c, cw, ch, r));
  else m = art.sheet(kind, o.i ?? 0);
  backing(g, w + 0.02, h + 0.02, y);
  if (o.frame !== 'none') frameBars(g, w, h, y, 0.05, 0.03, o.frame ?? 'woodBlack');
  plane(g, w, h, m, 0, y, PROUD, { unitUv: true, noShadow: true });
  if (o.tilt) g.rotation.z = o.tilt * DEG;
  return { c: null, h: 0 };
});

/** A stretch of wall hung with the Company's tithe of puzzles: a baize board of pinned sheets, and loose ones over it. */
def('titheWall', (g, o, ctx) => {
  const w = o.w ?? 3;
  const h = o.h ?? 1.5;
  const y = hung(o, 1.75);
  backing(g, w + 0.04, h + 0.04, y);
  frameBars(g, w, h, y, 0.052, 0.045, 'woodDark');
  const m = artMaterial(`tithe:${w}x${h}`, 1024, Math.round((1024 * h) / w), (c, cw, ch, r) => ART.tithe(c, cw, ch, r, { n: Math.round(w * h * 8) }));
  plane(g, w, h, m, 0, y, PROUD, { unitUv: true, noShadow: true });
  // A few stand proud of the rest: newer, or pinned by one corner only.
  const kinds = ['grid', 'crossword', 'notes', 'grid', 'crossword'];
  for (let i = 0; i < (o.loose ?? 7); i++) {
    const sx = (ctx.rnd() - 0.5) * (w - 0.3);
    const sy = y + (ctx.rnd() - 0.5) * (h - 0.36);
    const kind = kinds[i % kinds.length];
    const size = kind === 'grid' ? [0.2, 0.2] : [0.2, 0.27];
    const p = plane(g, size[0], size[1], art.sheet(kind, i % 3), sx, sy, PROUD + 0.012 + i * 0.002, { unitUv: true, noShadow: true });
    p.rotation.set((ctx.rnd() - 0.5) * 0.12, (ctx.rnd() - 0.5) * 0.14, (ctx.rnd() - 0.5) * 0.3);
    sph(g, 0.008, 'brass', sx, sy + size[1] / 2 - 0.02, PROUD + 0.018 + i * 0.002, 6);
  }
  return { c: null, h: 0 };
});

/** A cork board of pinned newspapers: the Crux, this week's and older. */
def('noticeboard', (g, o) => {
  const w = o.w ?? 1.3;
  const h = o.h ?? 0.95;
  const y = hung(o, 1.6);
  backing(g, w + 0.04, h + 0.04, y);
  frameBars(g, w, h, y, 0.052, 0.04, 'woodDark');
  const m = artMaterial(`noticeboard:${w}x${h}`, 768, Math.round((768 * h) / w), (c, cw, ch, rnd) => {
    c.fillStyle = '#9a7648';
    c.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 5000; i++) {
      c.fillStyle = `rgba(${rnd() > 0.5 ? '50,30,10' : '220,180,120'},${rnd() * 0.25})`;
      c.fillRect(rnd() * cw, rnd() * ch, 2, 2);
    }
    const page = (x, y2, pw, rot, opts) => {
      const sheet = document.createElement('canvas');
      sheet.width = 256;
      sheet.height = 340;
      ART.crux(sheet.getContext('2d'), 256, 340, rnd, opts);
      c.save();
      c.translate(x, y2);
      c.rotate(rot);
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.fillRect(-pw / 2 + 4, -pw * 0.66 + 5, pw, pw * 1.33);
      c.drawImage(sheet, -pw / 2, -pw * 0.66, pw, pw * 1.33);
      c.fillStyle = '#b6261e';
      c.beginPath();
      c.arc(0, -pw * 0.6, 6, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };
    page(cw * 0.2, ch * 0.5, cw * 0.3, -0.05, { headline: 'A SETTER IS FOUND DEAD' });
    page(cw * 0.52, ch * 0.47, cw * 0.28, 0.04, { headline: 'TITHE DAY: 412 PAPERS', puzzle: false });
    page(cw * 0.82, ch * 0.52, cw * 0.27, -0.03, { headline: 'THE CUT FERRY RAISES ITS TOLL' });
  });
  plane(g, w, h, m, 0, y, PROUD, { unitUv: true, noShadow: true });
  return { c: null, h: 0 };
});

/** A demonstration slate for a chess room: a position, and what is to be done about it. */
def('chessSlate', (g, o) => {
  const w = o.w ?? 2.0;
  const h = o.h ?? 1.3;
  const y = hung(o, 1.7);
  box(g, w, h, PROUD, '#23292b', 0, y, PROUD / 2);
  frameBars(g, w, h, y, 0.056, 0.06, 'wood');
  const m = artMaterial(`chessSlate:${o.title ?? ''}:${(o.lines ?? []).join('|')}`, 1024, Math.round((1024 * h) / w), (c, cw, ch, r) => ART.chessSlate(c, cw, ch, r, { title: o.title, lines: o.lines }), { rough: 0.95 });
  plane(g, w, h, m, 0, y, PROUD + 0.001, { unitUv: true, noShadow: true });
  // The ledge, with chalk and a rag.
  box(g, w * 0.8, 0.02, 0.07, 'wood', 0, y - h / 2 - 0.07, 0.035);
  for (let i = 0; i < 3; i++) cyl(g, 0.008, 0.008, 0.06, 'chalk', -0.2 + i * 0.09, y - h / 2 - 0.052, 0.04, 6, { rz: 90, ry: i * 20 });
  box(g, 0.14, 0.03, 0.06, 'fabricGrey', w * 0.25, y - h / 2 - 0.045, 0.04);
  return { c: null, h: 0 };
});

/** An engraved brass plate, screwed to whatever it names. o.text, o.sub */
def('brassPlate', (g, o) => {
  const w = o.w ?? 0.5;
  const h = o.h ?? (o.sub ? 0.19 : 0.13);
  const y = hung(o, 1.5);
  box(g, w + 0.02, h + 0.02, 0.008, 'brassDull', 0, y, 0.004);
  plane(g, w, h, art.plate(o.text ?? '', o.sub), 0, y, 0.0085, { unitUv: true, noShadow: true });
  for (const sx of [-1, 1]) sph(g, 0.006, 'steelDark', sx * (w / 2 - 0.012), y, 0.009, 5);
  return { c: null, h: 0 };
});

/** A window board: a painted sill standing out from the wall under a window, deep enough to put things on. */
def('windowSill', (g, o) => {
  const w = o.w ?? 1.8;
  const d = o.d ?? 0.17;
  const y = hung(o, 0.75);
  const m = o.mat ?? 'woodPaintWhite';
  box(g, w, 0.035, d, m, 0, y - 0.0175, d / 2);
  cyl(g, 0.0175, 0.0175, w, m, 0, y - 0.0175, d, 8, { rz: 90 });
  box(g, w - 0.08, 0.06, 0.02, m, 0, y - 0.065, 0.01);
  return { c: null, h: 0 };
});

/** A garden at night, seen through a window: stand it against the glass. */
def('gardenView', (g, o) => {
  const w = o.w ?? 1.4;
  const h = o.h ?? 1.2;
  const m = artMaterial('garden', 512, Math.round((512 * h) / w), (c, cw, ch, r) => ART.garden(c, cw, ch, r), { transparent: true, rough: 1 });
  m.depthWrite = false;
  const p = plane(g, w, h, m, 0, h / 2, 0, { unitUv: true, noShadow: true, dyn: true });
  p.renderOrder = 2;
  return { c: null, h: 0 };
});

// ------------------------------------------------------- books, paper, small things

const BINDINGS = ['leather', 'leatherOxblood', 'leatherGreen', '#2a2f44', '#4a3a22'];

/** A fat closed ledger, lying flat with its spine toward +Z. */
function tome(parent, x, y, z, { w = 0.34, d = 0.26, t = 0.07, material = 'leather', turn = 0, label = true, bands = true } = {}) {
  const b = group(parent, x, y, z, turn);
  box(b, w, 0.006, d, material, 0, 0.003, 0);
  box(b, w, 0.006, d, material, 0, t - 0.003, 0);
  box(b, w, t, 0.012, material, 0, t / 2, d / 2 - 0.006);
  box(b, w - 0.016, t - 0.012, d - 0.018, 'paper', 0, t / 2, -0.004);
  if (bands) for (const sx of [-0.3, 0, 0.3]) box(b, 0.012, t + 0.004, 0.014, 'brassDull', sx * w, t / 2, d / 2 - 0.005);
  if (label) box(b, w * 0.36, 0.002, d * 0.26, 'paperWhite', 0, t + 0.001, d * 0.08);
  return b;
}

/** A big book lying open: two blocks of pages, a ribbon, and a ruled page showing on each side. */
function openBook(parent, x, y, z, { w = 0.6, d = 0.42, t = 0.05, turn = 0, material = 'leatherOxblood', page = 'ledger', tilt = 0 } = {}) {
  const b = group(parent, x, y, z, turn);
  b.rotation.x = tilt;
  box(b, w + 0.03, 0.01, d + 0.03, material, 0, 0.005, 0);
  const pm = page === 'ledger' ? artMaterial('ledger', 256, 340, (c, cw, ch, r) => ART.ledger(c, cw, ch, r)) : art.sheet(page, 0);
  for (const s of [-1, 1]) {
    const half = group(b, (s * w) / 4, 0.01, 0);
    half.rotation.z = s * 0.06;
    box(half, w / 2 - 0.006, t * (s < 0 ? 1 : 0.7), d, 'paper', 0, (t * (s < 0 ? 1 : 0.7)) / 2, 0);
    plane(half, w / 2 - 0.03, d - 0.03, pm, 0, t * (s < 0 ? 1 : 0.7) + 0.0015, 0, { rx: -90, unitUv: true, noShadow: true });
  }
  box(b, 0.012, 0.004, d * 0.7, 'plasticRed', 0.01, t * 0.5 + 0.012, d * 0.2);
  return b;
}

/** A fat ledger. o.open lays it open; otherwise it lies shut. o.w, o.d, o.thick its size, o.mat its binding. */
def('tome', (g, o) => {
  if (o.open) openBook(g, 0, 0, 0, { w: o.w ?? 0.6, d: o.d ?? 0.42, t: o.thick ?? 0.05, material: o.mat ?? 'leatherOxblood', page: o.page ?? 'ledger' });
  else tome(g, 0, 0, 0, { w: o.w ?? 0.36, d: o.d ?? 0.27, t: o.thick ?? 0.08, material: o.mat ?? 'leather' });
  return { c: null, h: 0.1 };
});

/** Loose sheets on a desk. o.kind: notes | crossword | grid | proof | crux | typed; o.n how many. */
def('sheets', (g, o, ctx) => {
  const n = o.n ?? 3;
  const kind = o.kind ?? 'notes';
  const kinds = Array.isArray(kind) ? kind : [kind];
  const spread = o.spread ?? 0.16;
  for (let i = 0; i < n; i++) {
    const k = kinds[i % kinds.length];
    const size = k === 'grid' ? [0.2, 0.2] : k === 'proof' ? [0.12, 0.36] : k === 'crux' ? [0.3, 0.4] : [0.21, 0.297];
    plane(g, size[0], size[1], art.sheet(k, i % 3), (ctx.rnd() - 0.5) * spread, 0.003 + i * 0.002, (ctx.rnd() - 0.5) * spread * 0.7, { rx: -90, rz: (ctx.rnd() - 0.5) * (o.neat ? 8 : 50), unitUv: true, noShadow: true });
  }
  if (o.pens) {
    for (let i = 0; i < o.pens; i++) {
      const p = group(g, spread * 0.9 + i * 0.03, 0.007, 0.02 * i, 70 + i * 25);
      cyl(p, 0.005, 0.005, 0.13, i % 2 ? '#1c2a5a' : 'woodBlack', 0, 0, 0, 6, { rz: 90 });
      cyl(p, 0.0005, 0.005, 0.02, 'brass', 0.075, 0, 0, 6, { rz: -90 });
    }
  }
  return { c: null, h: 0.02 };
});

/** A folded newspaper: the Crux, with the crossword uppermost if o.puzzle. */
def('cruxPaper', (g, o) => {
  const fold = o.folded !== false;
  const w = fold ? 0.3 : 0.4;
  const d = fold ? 0.22 : 0.56;
  box(g, w, fold ? 0.014 : 0.006, d, 'paper', 0, fold ? 0.007 : 0.003, 0);
  const m = fold && o.puzzle !== false ? art.sheet('grid', o.filled ? 2 : 0) : artMaterial(`crux:${o.headline ?? ''}`, 384, 512, (c, cw, ch, r) => ART.crux(c, cw, ch, r, { headline: o.headline }));
  if (fold && o.puzzle !== false) {
    plane(g, 0.19, 0.19, m, -0.04, 0.0146, 0, { rx: -90, unitUv: true, noShadow: true });
    plane(g, 0.08, 0.19, art.sheet('typed', 1), 0.1, 0.0146, 0, { rx: -90, unitUv: true, noShadow: true });
  } else plane(g, w, d, m, 0, fold ? 0.0146 : 0.0066, 0, { rx: -90, unitUv: true, noShadow: true });
  return { c: null, h: 0.02 };
});

/** A desk spike: a turned base, a steel spike, and the letters impaled on it. */
def('deskSpike', (g, o, ctx) => {
  cyl(g, 0.055, 0.062, 0.018, 'woodDark', 0, 0.009, 0, 16);
  cyl(g, 0.03, 0.045, 0.014, 'brassDull', 0, 0.025, 0, 12);
  cyl(g, 0.0006, 0.004, 0.2, 'steel', 0, 0.13, 0, 6);
  const n = o.n ?? 8;
  for (let i = 0; i < n; i++) {
    const big = i % 3 !== 2;
    const sheet = plane(g, big ? 0.15 : 0.11, big ? 0.2 : 0.075, i === n - 1 ? art.sheet('typed', 1) : i % 2 ? 'paperWhite' : 'paper', (ctx.rnd() - 0.5) * 0.02, 0.036 + i * 0.011, (ctx.rnd() - 0.5) * 0.02, { rx: -90 + (ctx.rnd() - 0.5) * 14, unitUv: i === n - 1, noShadow: true });
    sheet.rotation.z = ctx.rnd() * Math.PI * 2;
  }
  return { c: null, h: 0.24 };
});

/** A vacuum flask with its cup stood beside it (the cup stays; the flask is modelled, see dress.js). */
def('flask', (g, o) => {
  lathe(g, [[0, 0], [0.04, 0], [0.043, 0.01], [0.043, 0.2], [0.036, 0.225], [0.03, 0.24], [0.031, 0.29], [0.028, 0.3], [0, 0.3]], o.mat ?? 'enamelGreen', 0, 0, 0, 14);
  cyl(g, 0.044, 0.044, 0.012, 'steel', 0, 0.2, 0, 14);
  // The cup that screws on top, taken off and half full.
  const c = group(g, o.cupX ?? 0.1, 0, o.cupZ ?? 0.03);
  c.userData.dyn = true;
  lathe(c, [[0, 0], [0.03, 0], [0.036, 0.055], [0.033, 0.055], [0.028, 0.006], [0, 0.006]], 'ceramic', 0, 0, 0, 12);
  cyl(c, 0.03, 0.028, 0.002, '#3a2412', 0, 0.036, 0, 10);
  return { c: null, h: 0.3 };
});

/** An oil lamp for a table: brass foot, a painted font, a glass chimney. Modelled when it can be (see dress.js). */
def('oilLamp', (g, o, ctx) => {
  lathe(g, [[0, 0], [0.07, 0], [0.075, 0.012], [0.04, 0.04], [0.02, 0.08], [0.03, 0.1], [0.07, 0.13], [0.078, 0.17], [0.06, 0.21], [0.03, 0.225], [0.03, 0.25], [0, 0.25]], o.mat ?? 'brass', 0, 0, 0, 14);
  lathe(g, [[0.03, 0.25], [0.045, 0.28], [0.04, 0.34], [0.026, 0.4], [0.024, 0.46]], 'glassClear', 0, 0, 0, 12, { noShadow: true });
  if (o.lit !== false) {
    const flame = sph(g, 0.014, glow(0xffd27a, 2.4), 0, 0.29, 0, 8, { dyn: true });
    flame.scale.set(0.8, 1.8, 0.8);
    ctx.halo(g, WARM, o.halo ?? 0.8, 0, 0.3, 0, 0.65);
    if (o.light !== false) ctx.light(g, { color: WARM, intensity: o.intensity ?? 3, distance: o.distance ?? 5.5, x: 0, y: 0.32, z: 0, flicker: 0.12 });
  }
  return { c: null, h: 0.46 };
});

/** A brass candlestick with its candle. o.lit */
def('candlestick', (g, o, ctx) => {
  lathe(g, [[0, 0], [0.05, 0], [0.055, 0.012], [0.02, 0.03], [0.012, 0.09], [0.02, 0.12], [0.012, 0.16], [0.028, 0.19], [0.03, 0.2], [0, 0.2]], 'brass', 0, 0, 0, 12);
  cyl(g, 0.011, 0.011, 0.16, IVORY, 0, 0.28, 0, 8);
  if (o.lit) {
    const flame = sph(g, 0.011, glow(0xffd27a, 2.4), 0, 0.385, 0, 6, { dyn: true });
    flame.scale.set(0.8, 1.9, 0.8);
    ctx.halo(g, WARM, 0.55, 0, 0.39, 0, 0.6);
    if (o.light) ctx.light(g, { color: WARM, intensity: o.intensity ?? 2, distance: 4.5, x: 0, y: 0.4, z: 0, flicker: 0.2 });
  }
  return { c: null, h: 0.4 };
});

/** A shelf on two brackets, for a wall. o.w, o.d; things are stood on it by the scene. */
def('wallShelf', (g, o) => {
  const w = o.w ?? 1.0;
  const d = o.d ?? 0.22;
  const y = hung(o, 1.3);
  box(g, w, 0.028, d, o.mat ?? 'woodDark', 0, y - 0.014, d / 2);
  for (const s of [-1, 1]) {
    box(g, 0.022, 0.16, 0.02, 'iron', s * (w / 2 - 0.12), y - 0.11, 0.01);
    rod(g, [s * (w / 2 - 0.12), y - 0.18, 0.012], [s * (w / 2 - 0.12), y - 0.03, d - 0.03], 0.008, 'iron');
  }
  return { c: null, h: 0 };
});

/** A plinth of polished wood with a moulded foot and cap, for a bust or a relic. */
def('plinth', (g, o) => {
  const s = o.size ?? 0.42;
  const h = o.h ?? 1.0;
  const m = o.mat ?? 'woodDark';
  box(g, s + 0.1, 0.08, s + 0.1, m, 0, 0.04, 0);
  box(g, s + 0.04, 0.04, s + 0.04, m, 0, 0.1, 0);
  box(g, s, h - 0.2, s, m, 0, 0.12 + (h - 0.2) / 2, 0);
  box(g, s + 0.05, 0.03, s + 0.05, m, 0, h - 0.065, 0);
  box(g, s + 0.1, 0.05, s + 0.1, m, 0, h - 0.025, 0);
  if (o.plate) plane(g, s * 0.7, 0.06, art.plate(o.plate), 0, h * 0.72, s / 2 + 0.002, { unitUv: true, noShadow: true });
  shadowBlob(g, s + 0.2, s + 0.2);
  return { c: [s + 0.1, s + 0.1], h };
});

// ------------------------------------------------------------- Setters' Hall

/**
 * The Porter's Lodge: a panelled counter, glazed above along most of its length,
 * with a hatch to speak through, the daybook lying open, a bell and a lamp.
 * Runs along X and faces +Z; the porter stands behind it.
 */
def('lodge', (g, o, ctx) => {
  const len = o.len ?? 3.0;
  const d = 0.62;
  const h = 1.05;
  box(g, len, h - 0.05, d - 0.1, 'woodDark', 0, (h - 0.05) / 2, -0.02);
  box(g, len + 0.1, 0.05, d + 0.08, 'wood', 0, h - 0.025, 0);
  box(g, len + 0.04, 0.1, d - 0.06, 'woodBlack', 0, 0.05, -0.02);
  const panels = Math.max(2, Math.round(len / 0.75));
  for (let i = 0; i < panels; i++) {
    const pw = len / panels;
    const x = -len / 2 + pw * (i + 0.5);
    box(g, pw - 0.12, h - 0.36, 0.02, 'wallPanel', x, h / 2 + 0.02, d / 2 - 0.062);
    box(g, pw - 0.26, h - 0.52, 0.03, 'wood', x, h / 2 + 0.02, d / 2 - 0.06);
  }
  cyl(g, 0.018, 0.018, len, 'brass', 0, 0.22, d / 2 - 0.02, 8, { rz: 90 });
  // The screen.
  const open = o.open ?? 0.36;
  const side = o.flip ? -1 : 1;
  const sx0 = o.flip ? -len / 2 : -len / 2 + len * open;
  const sx1 = o.flip ? len / 2 - len * open : len / 2;
  const top = 2.28;
  const bays = Math.max(2, Math.round((sx1 - sx0) / 0.72));
  for (let i = 0; i <= bays; i++) {
    const x = sx0 + ((sx1 - sx0) * i) / bays;
    box(g, 0.06, top - h, 0.06, 'woodBlack', x, (top + h) / 2, 0.18);
  }
  for (let i = 0; i < bays; i++) {
    const bw = (sx1 - sx0) / bays;
    const x = sx0 + bw * (i + 0.5);
    const hatch = i === (o.flip ? bays - 1 : 0);
    const gy0 = hatch ? 1.72 : h + 0.36;
    box(g, bw - 0.06, 0.04, 0.05, 'woodBlack', x, gy0, 0.18);
    box(g, bw - 0.07, top - 0.05 - gy0, 0.01, 'glassDark', x, (top - 0.05 + gy0) / 2, 0.18, { noShadow: true });
    if (!hatch) box(g, bw - 0.06, gy0 - h - 0.02, 0.03, 'wallPanel', x, (gy0 + h) / 2, 0.18);
    else box(g, bw - 0.1, 0.02, 0.2, 'brassDull', x, h + 0.012, 0.2);
  }
  box(g, sx1 - sx0 + 0.1, 0.2, 0.09, 'woodBlack', (sx0 + sx1) / 2, top + 0.08, 0.18);
  const sign = artMaterial('sign:lodge', 768, 96, (c, cw, ch, r) => ART.sign(c, cw, ch, r, { text: "PORTER'S LODGE", size: 0.5, bg: '#161210' }));
  plane(g, Math.min(1.5, sx1 - sx0 - 0.1), 0.16, sign, (sx0 + sx1) / 2, top + 0.08, 0.227, { unitUv: true, noShadow: true });
  // The open end: the daybook, a pen across it, ink, the bell, a lamp.
  const bx = side * (-len / 2 + (len * open) / 2);
  openBook(g, bx, h, 0.04, { w: 0.62, d: 0.42, t: 0.045, turn: 4, material: 'leatherGreen' });
  const pen = group(g, bx + 0.12, h + 0.07, 0.1, 35);
  cyl(pen, 0.005, 0.005, 0.15, 'woodBlack', 0, 0, 0, 6, { rz: 90 });
  cyl(g, 0.032, 0.036, 0.045, 'glassDark', bx + side * 0.42, h + 0.022, -0.14, 10);
  cyl(g, 0.02, 0.02, 0.012, 'brass', bx + side * 0.42, h + 0.05, -0.14, 10);
  lathe(g, [[0, 0], [0.06, 0], [0.062, 0.012], [0.05, 0.035], [0.03, 0.055], [0.01, 0.062], [0.012, 0.075], [0, 0.078]], 'brass', bx - side * 0.42, h, 0.12, 14);
  PROPS.deskLamp(group(g, bx + side * 0.44, h, 0.12, -30 * side), { intensity: o.intensity ?? 2.4 }, ctx);
  shadowBlob(g, len, d * 1.5);
  return { c: [len, d], h: top };
});

/** A wall cabinet of keys: baize, brass hooks in rows, a key on most of them, and its glazed door standing open. */
def('keyCabinet', (g, o, ctx) => {
  const w = o.w ?? 0.95;
  const h = o.h ?? 1.15;
  const k = group(g, 0, hung(o, 1.55), 0);
  box(k, w, h, PROUD, BAIZE, 0, 0, PROUD / 2);
  box(k, w + 0.06, 0.03, 0.12, 'woodDark', 0, h / 2 + 0.015, 0.06);
  box(k, w + 0.06, 0.03, 0.12, 'woodDark', 0, -h / 2 - 0.015, 0.06);
  for (const s of [-1, 1]) box(k, 0.03, h, 0.12, 'woodDark', s * (w / 2 + 0.015), 0, 0.06);
  box(k, w + 0.14, 0.045, 0.15, 'woodBlack', 0, h / 2 + 0.05, 0.075);
  const rows = o.rows ?? 5;
  const cols = o.cols ?? 9;
  const metals = ['iron', 'brass', 'steel', 'brassDull', 'iron'];
  for (let r = 0; r < rows; r++) {
    const yy = h / 2 - 0.1 - (r * (h - 0.16)) / rows;
    box(k, w - 0.06, 0.012, 0.012, 'brassDull', 0, yy + 0.004, PROUD + 0.006);
    for (let c = 0; c < cols; c++) {
      const x = -w / 2 + 0.07 + (c * (w - 0.14)) / (cols - 1);
      cyl(k, 0.004, 0.004, 0.03, 'brass', x, yy, PROUD + 0.02, 5, { rx: 90 });
      box(k, 0.032, 0.018, 0.002, 'paperWhite', x, yy + 0.03, PROUD + 0.002);
      if (ctx.rnd() < 0.16) continue;
      const metal = metals[Math.floor(ctx.rnd() * metals.length)];
      const key = group(k, x, yy, PROUD + 0.03);
      key.rotation.z = (ctx.rnd() - 0.5) * 0.3;
      const long = 0.05 + ctx.rnd() * 0.05;
      torus(key, 0.015, 0.0035, metal, 0, -0.016, 0, { seg: 8 });
      box(key, 0.005, long, 0.005, metal, 0, -0.03 - long / 2, 0);
      box(key, 0.016, 0.016, 0.004, metal, 0.008, -0.03 - long + 0.01, 0);
      if (ctx.rnd() < 0.3) cyl(key, 0.012, 0.012, 0.003, 'plasticRed', 0.014, -0.03, 0.004, 8, { rx: 90 });
    }
  }
  // The door.
  const door = group(k, -w / 2 - 0.03, 0, 0.125);
  door.rotation.y = -(o.open ?? 115) * DEG;
  const dw = w + 0.06;
  box(door, dw, 0.05, 0.022, 'woodDark', dw / 2, h / 2 - 0.01, 0);
  box(door, dw, 0.05, 0.022, 'woodDark', dw / 2, -h / 2 + 0.01, 0);
  box(door, 0.05, h, 0.022, 'woodDark', 0.025, 0, 0);
  box(door, 0.05, h, 0.022, 'woodDark', dw - 0.025, 0, 0);
  box(door, dw - 0.08, h - 0.08, 0.005, 'glassClear', dw / 2, 0, 0, { noShadow: true });
  sph(door, 0.012, 'brass', dw - 0.03, 0, 0.02, 6);
  return { c: null, h: 0 };
});

/**
 * The tea table: a white cloth, a copper urn, the big brown pot, cups, milk,
 * sugar and a tin of biscuits.
 */
def('teaTable', (g, o, ctx) => {
  const w = o.w ?? 1.8;
  const d = o.d ?? 0.66;
  const h = 0.78;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) cyl(g, 0.032, 0.022, h - 0.04, 'woodDark', sx * (w / 2 - 0.08), (h - 0.04) / 2, sz * (d / 2 - 0.08), 8);
  }
  box(g, w, 0.04, d, 'woodDark', 0, h - 0.02, 0);
  box(g, w + 0.03, 0.008, d + 0.03, 'fabricWhite', 0, h + 0.004, 0);
  box(g, w + 0.03, 0.24, 0.006, 'fabricWhite', 0, h - 0.115, d / 2 + 0.016);
  for (const s of [-1, 1]) box(g, 0.006, 0.24, d + 0.03, 'fabricWhite', s * (w / 2 + 0.016), h - 0.115, 0);
  const top = h + 0.008;
  // The urn, on its foot, with a tap and a drip bowl.
  const ux = -w / 2 + 0.32;
  lathe(g, [[0, 0], [0.1, 0], [0.11, 0.02], [0.05, 0.05], [0.05, 0.09], [0.1, 0.12], [0.15, 0.2], [0.168, 0.32], [0.15, 0.44], [0.11, 0.5], [0.09, 0.52], [0.1, 0.53], [0.085, 0.57], [0.04, 0.6], [0.015, 0.62], [0.025, 0.64], [0, 0.66]], 'copper', ux, top, -0.06, 18);
  for (const s of [-1, 1]) {
    const hd = torus(g, 0.05, 0.009, 'brass', ux + s * 0.175, top + 0.38, -0.06, { seg: 10, arc: Math.PI });
    hd.rotation.z = -s * (Math.PI / 2);
  }
  for (const by of [0.2, 0.44]) torus(g, 0.152, 0.006, 'brass', ux, top + by, -0.06, { rx: 90, seg: 22 });
  cyl(g, 0.012, 0.012, 0.08, 'brass', ux, top + 0.16, 0.1, 8, { rx: 90 });
  cyl(g, 0.009, 0.007, 0.04, 'brass', ux, top + 0.14, 0.135, 8);
  box(g, 0.01, 0.05, 0.016, 'woodBlack', ux, top + 0.195, 0.125);
  lathe(g, [[0, 0], [0.04, 0], [0.06, 0.03], [0.055, 0.03], [0.036, 0.008], [0, 0.008]], 'ceramic', ux, top, 0.14, 12);
  // The pot.
  teapot(g, ux + 0.42, top, 0.02, { s: 1.35, material: '#4a2a18', turn: 155 });
  // China.
  if (!nested(g, 'tea_set', { x: w / 2 - 0.5, y: top, z: -0.04, s: 0.88, ry: 180 })) {
    for (let i = 0; i < 6; i++) cupAndSaucer(g, w / 2 - 0.82 + (i % 3) * 0.17, top, -0.14 + Math.floor(i / 3) * 0.17, { turn: 30 + i * 50 });
    lathe(g, [[0, 0], [0.03, 0], [0.042, 0.03], [0.036, 0.07], [0.042, 0.09], [0.038, 0.09], [0.03, 0.07], [0, 0.06]], 'ceramic', w / 2 - 0.26, top, -0.1, 12);
    lathe(g, [[0, 0], [0.035, 0], [0.05, 0.03], [0.05, 0.055], [0.045, 0.055], [0.03, 0.01], [0, 0.01]], 'ceramic', w / 2 - 0.2, top, 0.08, 12);
  }
  // Biscuits: the tin, its lid beside it, and a plate.
  cyl(g, 0.09, 0.09, 0.1, 'enamelGreen', ux + 0.4, top + 0.05, -0.2, 16);
  cyl(g, 0.093, 0.093, 0.02, 'brassDull', ux + 0.56, top + 0.01, -0.22, 16);
  cyl(g, 0.1, 0.07, 0.012, 'ceramic', 0.05, top + 0.006, 0.2, 16);
  for (let i = 0; i < 6; i++) cyl(g, 0.026, 0.026, 0.008, '#b08a4a', 0.05 + Math.cos(i) * 0.045, top + 0.016 + (i % 2) * 0.006, 0.2 + Math.sin(i) * 0.045, 10);
  // Spoons in a jar.
  cyl(g, 0.03, 0.028, 0.08, 'glassClear', w / 2 - 0.12, top + 0.04, 0.2, 10, { noShadow: true });
  for (let i = 0; i < 5; i++) rod(g, [w / 2 - 0.12, top + 0.005, 0.2], [w / 2 - 0.12 + (i - 2) * 0.012, top + 0.13, 0.2 + ((i * 7) % 5 - 2) * 0.008], 0.003, 'steel', 4);
  shadowBlob(g, w, d);
  return { c: [w, d], h: 1.4 };
});

/** A tray of tea things: the pot, o.cups cups (one of them drunk from), milk and sugar. o.cosy a colour for a knitted cosy. */
def('teaTray', (g, o) => {
  const w = 0.46;
  const d = 0.3;
  const m = o.mat ?? 'woodDark';
  box(g, w, 0.01, d, m, 0, 0.005, 0);
  box(g, w, 0.022, 0.012, m, 0, 0.016, d / 2 - 0.006);
  box(g, w, 0.022, 0.012, m, 0, 0.016, -d / 2 + 0.006);
  for (const s of [-1, 1]) {
    box(g, 0.012, 0.022, d, m, s * (w / 2 - 0.006), 0.016, 0);
    const hd = torus(g, 0.03, 0.005, 'brass', s * (w / 2 + 0.002), 0.03, 0, { seg: 8, arc: Math.PI });
    hd.rotation.y = Math.PI / 2;
  }
  const china = o.china ?? 'ceramic';
  if (o.pot !== false) teapot(g, -0.11, 0.01, -0.03, { s: 0.82, material: china, turn: 200, cosy: o.cosy });
  cupAndSaucer(g, 0.1, 0.01, 0.06, { full: o.full !== false, material: china, turn: 30 });
  if ((o.cups ?? 1) > 1) cupAndSaucer(g, 0.14, 0.01, -0.08, { material: china, turn: -50 });
  lathe(g, [[0, 0], [0.02, 0], [0.028, 0.02], [0.024, 0.05], [0.03, 0.062], [0.026, 0.062], [0.02, 0.05], [0, 0.04]], china, 0.01, 0.01, 0.09, 10);
  lathe(g, [[0, 0], [0.024, 0], [0.034, 0.02], [0.034, 0.036], [0.03, 0.036], [0.02, 0.008], [0, 0.008]], china, -0.01, 0.01, -0.105, 10);
  box(g, 0.1, 0.003, 0.012, 'steel', 0.06, 0.014, 0.125, { ry: 20 });
  return { c: null, h: 0.2 };
});

/** An iron-bound chest for evidence: oak, strapped and riveted, padlocked, a label tied to the hasp. */
def('strongbox', (g, o) => {
  const w = o.w ?? 1.15;
  const d = o.d ?? 0.62;
  const h = o.h ?? 0.6;
  const lift = 0.22;
  // Its stand.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) box(g, 0.07, lift, 0.07, 'iron', sx * (w / 2 - 0.07), lift / 2, sz * (d / 2 - 0.07));
  }
  box(g, w, 0.03, d, 'iron', 0, lift - 0.015, 0);
  const c = group(g, 0, lift, 0);
  box(c, w, h, d, 'woodDark', 0, h / 2, 0);
  const lid = cyl(c, d / 2, d / 2, w, 'woodDark', 0, h, 0, 14, { rz: 90 });
  lid.scale.set(0.34, 1, 1);
  const top = h + (d / 2) * 0.34;
  // Straps over the lid and down the front, riveted.
  for (const sx of [-0.36, 0, 0.36]) {
    box(c, 0.075, h + 0.01, d + 0.016, 'iron', sx * w, h / 2, 0);
    const over = cyl(c, d / 2 + 0.008, d / 2 + 0.008, 0.075, 'iron', sx * w, h, 0, 14, { rz: 90 });
    over.scale.set(0.345, 1, 1);
    for (let i = 0; i < 5; i++) sph(c, 0.012, 'steelDark', sx * w, 0.08 + i * ((h - 0.1) / 4), d / 2 + 0.01, 6);
  }
  for (const by of [0.04, h - 0.04]) {
    box(c, w + 0.016, 0.06, d + 0.016, 'iron', 0, by, 0);
    for (let i = 0; i < 9; i++) sph(c, 0.011, 'steelDark', -w / 2 + 0.06 + (i * (w - 0.12)) / 8, by, d / 2 + 0.012, 6);
  }
  for (const sx of [-1, 1]) {
    for (const by of [0.1, h - 0.1]) box(c, 0.14, 0.14, 0.012, 'iron', sx * (w / 2 - 0.07), by, d / 2 + 0.007);
    // A ring at each end to carry it by.
    const ring = torus(c, 0.06, 0.012, 'iron', sx * (w / 2 + 0.02), h * 0.5, 0, { seg: 12 });
    ring.rotation.y = Math.PI / 2;
    ring.rotation.x = 0.4;
    box(c, 0.02, 0.06, 0.1, 'iron', sx * (w / 2 + 0.006), h * 0.62, 0);
  }
  // Lock plate, hasp and padlock.
  box(c, 0.2, 0.24, 0.014, 'iron', 0, h * 0.62, d / 2 + 0.018);
  box(c, 0.07, 0.2, 0.02, 'steelDark', 0, h * 0.78, d / 2 + 0.03);
  const shackle = torus(c, 0.035, 0.009, 'steel', 0, h * 0.56, d / 2 + 0.045, { seg: 10, arc: Math.PI });
  shackle.rotation.z = 0;
  box(c, 0.1, 0.085, 0.035, 'brassDull', 0, h * 0.5, d / 2 + 0.045);
  cyl(c, 0.008, 0.008, 0.004, 'dark', 0, h * 0.5, d / 2 + 0.064, 6, { rx: 90 });
  // The label, and the seal on its string.
  rod(c, [0.03, h * 0.56, d / 2 + 0.05], [0.16, h * 0.4, d / 2 + 0.03], 0.002, 'rope', 3);
  box(c, 0.13, 0.075, 0.003, 'paper', 0.2, h * 0.36, d / 2 + 0.026, { rz: -14 });
  cyl(c, 0.02, 0.02, 0.006, 'plasticRed', 0.14, h * 0.42, d / 2 + 0.03, 10, { rx: 90 });
  shadowBlob(g, w * 1.1, d * 1.2);
  return { c: [w, d], h: lift + top };
});

/**
 * A safe of the old kind on its stand: japanned green and lined in gold, strap
 * hinges, a brass lever, and where a keyhole would be, a dial of letters.
 */
def('foldSafe', (g, o) => {
  const w = o.w ?? 0.74;
  const h = o.h ?? 0.98;
  const d = o.d ?? 0.64;
  const body = o.mat ?? '#1d2e28';
  const base = 0.14;
  box(g, w + 0.06, base, d + 0.04, 'woodBlack', 0, base / 2, 0);
  box(g, w, h, d, body, 0, base + h / 2, 0);
  box(g, w + 0.03, 0.045, d + 0.03, body, 0, base + h - 0.0225, 0);
  box(g, w + 0.03, 0.06, d + 0.03, body, 0, base + 0.03, 0);
  // The door stands proud of the carcass, with a sunk panel lined in gold.
  const z = d / 2;
  const cy = base + h / 2;
  box(g, w - 0.09, h - 0.15, 0.04, body, 0, cy, z + 0.02);
  frameBars(group(g, 0, 0, z + 0.04), w - 0.24, h - 0.3, cy, 0.003, 0.007, 'brass');
  frameBars(group(g, 0, 0, z + 0.04), w - 0.3, h - 0.36, cy, 0.003, 0.003, 'brass');
  for (const fy of [0.24, 0.76]) {
    cyl(g, 0.022, 0.022, 0.14, 'steelDark', -(w / 2 - 0.045), base + h * fy, z + 0.035, 10);
    box(g, 0.2, 0.05, 0.012, 'steelDark', -(w / 2 - 0.15), base + h * fy, z + 0.046);
    for (const sy of [-1, 1]) sph(g, 0.024, 'brassDull', -(w / 2 - 0.045), base + h * fy + sy * 0.075, z + 0.035, 8);
  }
  // The dial: a ring of letters, and the knob it is turned by.
  const dx = -0.04;
  const dy = base + h * 0.6;
  cyl(g, 0.092, 0.092, 0.018, 'brassDull', dx, dy, z + 0.049, 24, { rx: 90 });
  disc(g, 0.084, art.wheel('brass', 1), dx, dy, z + 0.0585);
  cyl(g, 0.024, 0.03, 0.035, 'brass', dx, dy, z + 0.075, 14, { rx: 90 });
  box(g, 0.012, 0.03, 0.006, 'steelDark', dx, dy + 0.1, z + 0.045);
  // The lever.
  const hx = w / 2 - 0.19;
  const hy = base + h * 0.47;
  cyl(g, 0.034, 0.038, 0.03, 'brass', hx, hy, z + 0.055, 12, { rx: 90 });
  rod(g, [hx, hy, z + 0.075], [hx, hy - 0.14, z + 0.095], 0.012, 'brass', 8);
  sph(g, 0.02, 'brass', hx, hy - 0.145, z + 0.097, 8);
  plane(g, 0.24, 0.085, art.plate('TUMBLER & WARD', 'SAFEMAKERS · THE FOLD'), 0, base + h * 0.845, z + 0.041, { unitUv: true, noShadow: true });
  shadowBlob(g, w * 1.1, d * 1.1);
  return { c: [w + 0.06, d + 0.04], h: base + h };
});

/** A long refectory table on two trestles joined by a stretcher. */
def('longTable', (g, o) => {
  const w = o.w ?? 4.2;
  const d = o.d ?? 1.1;
  const h = 0.77;
  const m = o.mat ?? 'wood';
  box(g, w, 0.06, d, m, 0, h - 0.03, 0);
  for (const s of [-1, 1]) box(g, 0.1, 0.064, d + 0.004, 'woodDark', s * (w / 2 - 0.05), h - 0.03, 0);
  box(g, w - 0.5, 0.1, 0.03, 'woodDark', 0, h - 0.11, d / 2 - 0.12);
  box(g, w - 0.5, 0.1, 0.03, 'woodDark', 0, h - 0.11, -d / 2 + 0.12);
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 0.5);
    box(g, 0.14, 0.09, d - 0.16, 'woodDark', x, 0.045, 0);
    box(g, 0.12, 0.07, d - 0.24, 'woodDark', x, h - 0.095, 0);
    for (const sz of [-1, 1]) {
      lathe(g, [[0, 0], [0.05, 0], [0.055, 0.06], [0.035, 0.1], [0.06, 0.2], [0.065, 0.3], [0.04, 0.42], [0.05, 0.5], [0.05, h - 0.22], [0, h - 0.22]], m, x, 0.09, sz * (d / 2 - 0.3), 10);
    }
  }
  box(g, w - 1.0, 0.07, 0.09, 'woodDark', 0, 0.24, 0);
  shadowBlob(g, w, d);
  return { c: [w, d], h };
});

/** A tall plain chair: the one the invigilator sits in, and nobody else. */
def('tallChair', (g, o) => {
  const m = o.mat ?? 'wood';
  box(g, 0.5, 0.045, 0.46, m, 0, 0.47, 0.01);
  for (const sx of [-1, 1]) {
    box(g, 0.05, 0.47, 0.05, m, sx * 0.22, 0.235, 0.2);
    box(g, 0.05, 1.62, 0.05, m, sx * 0.22, 0.81, -0.2);
    box(g, 0.035, 0.035, 0.36, m, sx * 0.22, 0.2, 0);
    cyl(g, 0.0005, 0.036, 0.05, m, sx * 0.22, 1.645, -0.2, 4, { ry: 45 });
    box(g, 0.05, 0.03, 0.4, m, sx * 0.24, 0.68, -0.02);
    box(g, 0.04, 0.2, 0.04, m, sx * 0.24, 0.57, 0.16);
  }
  box(g, 0.4, 0.035, 0.035, m, 0, 0.2, 0.2);
  box(g, 0.4, 0.09, 0.03, m, 0, 1.52, -0.2);
  box(g, 0.4, 0.06, 0.03, m, 0, 0.72, -0.2);
  box(g, 0.36, 0.74, 0.016, 'woodDark', 0, 1.11, -0.2);
  shadowBlob(g, 0.6, 0.6);
  return { c: [0.52, 0.5], h: 1.65 };
});

/** A great book lying open on a stand: the register. Two candle sconces light it. */
def('bookStand', (g, o, ctx) => {
  const m = o.mat ?? 'woodDark';
  box(g, 0.56, 0.06, 0.46, m, 0, 0.03, 0);
  box(g, 0.44, 0.05, 0.36, m, 0, 0.085, 0);
  lathe(g, [[0.09, 0.11], [0.06, 0.16], [0.05, 0.4], [0.075, 0.5], [0.05, 0.6], [0.045, 0.86], [0.08, 0.92], [0.1, 0.96]], m, 0, 0, 0, 10);
  const top = group(g, 0, 0.98, 0.02);
  top.rotation.x = 0.42;
  box(top, 0.86, 0.04, 0.6, m, 0, 0, 0);
  box(top, 0.86, 0.05, 0.03, m, 0, 0.04, 0.29);
  openBook(top, 0, 0.02, -0.01, { w: 0.76, d: 0.52, t: 0.06, material: o.binding ?? 'leatherOxblood' });
  for (const s of [-1, 1]) {
    rod(g, [s * 0.1, 0.9, -0.05], [s * 0.5, 1.08, -0.12], 0.008, 'brass');
    cyl(g, 0.03, 0.02, 0.02, 'brass', s * 0.5, 1.09, -0.12, 8);
    cyl(g, 0.011, 0.011, 0.14, IVORY, s * 0.5, 1.17, -0.12, 6);
    if (o.lit !== false) {
      const flame = sph(g, 0.011, glow(0xffd27a, 2.4), s * 0.5, 1.26, -0.12, 6);
      flame.scale.set(0.8, 1.9, 0.8);
    }
  }
  if (o.lit !== false) {
    ctx.halo(g, WARM, 0.9, 0, 1.25, -0.1, 0.45);
    if (o.light !== false) ctx.light(g, { color: WARM, intensity: o.intensity ?? 2.4, distance: 4.5, x: 0, y: 1.4, z: 0.1, flicker: 0.15 });
  }
  shadowBlob(g, 0.9, 0.7);
  return { c: [0.8, 0.6], h: 1.3 };
});

/** A brass ring of candle-lamps hung from the ceiling on three chains. */
def('ringLight', (g, o, ctx) => {
  const ceil = ctx.ceil ?? 3;
  const y = o.hang ?? 2.5;
  const r = o.rad ?? 0.55;
  const n = o.n ?? 8;
  torus(g, r, 0.018, 'brass', 0, y, 0, { rx: 90, seg: 32 });
  torus(g, r * 0.3, 0.012, 'brass', 0, y + 0.3, 0, { rx: 90, seg: 16 });
  cyl(g, 0.06, 0.06, 0.03, 'brassDull', 0, ceil - 0.015, 0, 12);
  cyl(g, 0.01, 0.01, ceil - y - 0.3, 'brassDull', 0, (ceil + y + 0.3) / 2, 0, 6);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    rod(g, [Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * r * 0.3, y + 0.3, Math.sin(a) * r * 0.3], 0.005, 'brassDull', 4);
  }
  const lit = o.lit !== false;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    cyl(g, 0.03, 0.012, 0.025, 'brass', x, y + 0.03, z, 8);
    cyl(g, 0.011, 0.011, 0.1, IVORY, x, y + 0.09, z, 6);
    if (lit) {
      const flame = sph(g, 0.014, glow(0xffdc96, 2.2), x, y + 0.16, z, 6);
      flame.scale.set(0.8, 1.7, 0.8);
    }
  }
  if (lit) {
    ctx.halo(g, WARM, r * 3.2, 0, y + 0.12, 0, 0.42);
    if (o.light !== false) ctx.light(g, { color: 0xffc27a, intensity: o.intensity ?? 14, distance: o.distance ?? 10, x: 0, y: y - 0.05, z: 0, shadow: o.shadow });
  }
  return { c: null, h: 0 };
});

// ------------------------------------------------------------ the clock shop

/** A clock movement between two brass plates, stood on its edge with its wheels showing. */
function movement(parent, x, y, z, s = 1, turn = 0) {
  const m = group(parent, x, y, z, turn);
  m.scale.setScalar(s);
  box(m, 0.16, 0.012, 0.09, 'woodDark', 0, 0.006, 0);
  for (const sz of [-1, 1]) {
    box(m, 0.13, 0.15, 0.004, 'brass', 0, 0.09, sz * 0.03);
    for (const [px, py] of [[-0.055, 0.025], [0.055, 0.025], [-0.055, 0.155], [0.055, 0.155]]) cyl(m, 0.005, 0.005, 0.064, 'brassDull', px, py, 0, 6, { rx: 90 });
  }
  gear(m, 0.045, 18, 0.005, 'brass', -0.02, 0.07, 0);
  gear(m, 0.028, 12, 0.005, 'brassDull', 0.03, 0.105, 0.012);
  gear(m, 0.02, 10, 0.005, 'brass', -0.01, 0.13, -0.012);
  gear(m, 0.014, 8, 0.008, 'steel', 0.04, 0.06, -0.01, { spokes: 0 });
  cyl(m, 0.03, 0.03, 0.02, 'brassDull', -0.02, 0.07, 0, 12, { rx: 90 });
  return m;
}

/**
 * A watchmaker's bench: a thick top with a raised back, two banks of small
 * drawers, and the work left on it: a lathe, a movement half built, a tray
 * of wheels, a dome, the tools in their block. o.lamp lights it.
 */
def('watchBench', (g, o, ctx) => {
  const w = o.w ?? 2.4;
  const d = o.d ?? 0.78;
  const h = 0.92;
  box(g, w, 0.06, d, 'woodLight', 0, h - 0.03, 0);
  box(g, w, 0.1, 0.025, 'wood', 0, h + 0.05, -d / 2 + 0.0125);
  for (const s of [-1, 1]) box(g, 0.025, 0.07, d * 0.55, 'wood', s * (w / 2 - 0.0125), h + 0.035, -d * 0.22);
  const pw = 0.62;
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - pw / 2 - 0.02);
    box(g, pw, h - 0.14, d - 0.1, 'wood', x, 0.08 + (h - 0.14) / 2, -0.01);
    box(g, pw + 0.02, 0.08, d - 0.08, 'woodDark', x, 0.04, -0.01);
    for (let i = 0; i < 5; i++) {
      const dy = 0.16 + i * 0.145;
      for (const sx of [-1, 1]) {
        box(g, pw / 2 - 0.035, 0.125, 0.018, 'woodDark', x + (sx * pw) / 4, dy + 0.02, d / 2 - 0.06);
        sph(g, 0.011, 'brass', x + (sx * pw) / 4, dy + 0.02, d / 2 - 0.044, 6);
      }
    }
  }
  box(g, w - pw * 2 - 0.04, 0.09, d - 0.14, 'wood', 0, h - 0.105, -0.02);
  box(g, w - pw * 2 - 0.16, 0.06, 0.016, 'woodDark', 0, h - 0.105, d / 2 - 0.085);
  box(g, w - pw * 2 - 0.04, 0.03, 0.06, 'woodDark', 0, 0.3, -d / 2 + 0.2);
  const top = h;
  // A bench vice at the left.
  const vx = -w / 2 + 0.24;
  box(g, 0.1, 0.07, 0.14, 'iron', vx, top + 0.035, d / 2 - 0.12);
  box(g, 0.12, 0.05, 0.025, 'steelDark', vx, top + 0.085, d / 2 - 0.07);
  box(g, 0.12, 0.05, 0.025, 'steelDark', vx, top + 0.085, d / 2 - 0.13);
  cyl(g, 0.007, 0.007, 0.16, 'steel', vx, top + 0.045, d / 2 - 0.03, 6, { rz: 90 });
  // The turns: a watchmaker's lathe, bed, headstock, tailstock and its pulley.
  const lx = w / 2 - 0.5;
  const lz = -d / 2 + 0.2;
  for (const s of [-1, 1]) box(g, 0.035, 0.05, 0.06, 'iron', lx + s * 0.13, top + 0.025, lz);
  cyl(g, 0.012, 0.012, 0.36, 'steel', lx, top + 0.06, lz, 8, { rz: 90 });
  box(g, 0.05, 0.075, 0.05, 'steelDark', lx - 0.1, top + 0.105, lz);
  cyl(g, 0.012, 0.012, 0.11, 'steel', lx - 0.1, top + 0.12, lz, 8, { rz: 90 });
  for (let i = 0; i < 3; i++) cyl(g, 0.034 - i * 0.008, 0.034 - i * 0.008, 0.012, 'brass', lx - 0.165 - i * 0.013, top + 0.12, lz, 14, { rz: 90 });
  cyl(g, 0.016, 0.02, 0.03, 'steel', lx - 0.045, top + 0.12, lz, 8, { rz: 90 });
  box(g, 0.045, 0.065, 0.045, 'steelDark', lx + 0.1, top + 0.1, lz);
  cyl(g, 0.0005, 0.007, 0.05, 'steel', lx + 0.06, top + 0.12, lz, 6, { rz: 90 });
  box(g, 0.012, 0.05, 0.012, 'steel', lx, top + 0.085, lz + 0.03);
  box(g, 0.07, 0.008, 0.014, 'steel', lx, top + 0.112, lz + 0.03);
  // The movement he was working on, and a finished one under a dome.
  movement(g, 0.12, top, -0.12, 1.25, -14);
  const dx = -w / 2 + 0.72;
  const dz = -d / 2 + 0.22;
  cyl(g, 0.1, 0.11, 0.025, 'woodBlack', dx, top + 0.0125, dz, 18);
  movement(g, dx, top + 0.025, dz, 0.85, 30);
  lathe(g, [[0.092, 0.025], [0.094, 0.19], [0.08, 0.25], [0.05, 0.285], [0.015, 0.298], [0, 0.3]], 'glassClear', dx, top, dz, 16, { noShadow: true });
  // A tray of wheels and pinions, sorted.
  const tx = -0.42;
  const tz = 0.14;
  box(g, 0.34, 0.012, 0.22, 'woodDark', tx, top + 0.006, tz);
  for (let i = 0; i <= 3; i++) box(g, 0.006, 0.026, 0.22, 'woodDark', tx - 0.17 + i * 0.1133, top + 0.013, tz);
  for (const sz of [-1, 0, 1]) box(g, 0.34, 0.026, 0.006, 'woodDark', tx, top + 0.013, tz + sz * 0.107);
  for (let i = 0; i < 9; i++) {
    const r = 0.012 + ctx.rnd() * 0.02;
    gear(g, r, 8 + Math.floor(ctx.rnd() * 10), 0.004, i % 3 ? 'brass' : 'steel', tx - 0.113 + (i % 3) * 0.113 + (ctx.rnd() - 0.5) * 0.03, top + 0.016 + (i % 2) * 0.004, tz - 0.05 + Math.floor(i / 3) * 0.05 + (ctx.rnd() - 0.5) * 0.02, { rx: -90, spokes: r > 0.02 ? 4 : 0 });
  }
  // Loose on the bench: the big wheel, a mainspring, tweezers, an oil pot.
  gear(g, 0.07, 30, 0.005, 'brass', 0.68, top + 0.004, 0.25, { rx: -90, rz: 20 });
  gear(g, 0.035, 14, 0.005, 'brassDull', 0.8, top + 0.009, 0.16, { rx: -90 });
  for (let i = 0; i < 4; i++) torus(g, 0.02 + i * 0.008, 0.002, 'steel', 0.62, top + 0.004, 0.08, { rx: 90, seg: 14, arc: Math.PI * 1.8 });
  box(g, 0.11, 0.003, 0.008, 'steel', -0.08, top + 0.003, 0.26, { ry: 24 });
  box(g, 0.11, 0.003, 0.008, 'steel', -0.085, top + 0.003, 0.268, { ry: 18 });
  cyl(g, 0.022, 0.026, 0.022, 'glassBottleAmber', 0.74, top + 0.011, -0.05, 10, { noShadow: true });
  // Screwdrivers in their block, by size.
  const sx0 = 0.34;
  box(g, 0.2, 0.035, 0.05, 'woodDark', sx0, top + 0.0175, -d / 2 + 0.09);
  const caps = ['plasticRed', 'plasticYellow', 'plasticBlack', 'plasticRed', 'plasticBlack', 'plasticYellow', 'plasticRed'];
  for (let i = 0; i < 7; i++) {
    cyl(g, 0.0025, 0.0025, 0.07, 'steel', sx0 - 0.075 + i * 0.025, top + 0.07, -d / 2 + 0.09, 5);
    cyl(g, 0.006, 0.006, 0.035, caps[i], sx0 - 0.075 + i * 0.025, top + 0.12, -d / 2 + 0.09, 6);
  }
  // His glass.
  if (!nested(g, 'magnifier', { x: -0.86, y: top + 0.017, z: 0.2, rx: 90, ry: 40 })) {
    torus(g, 0.045, 0.006, 'brass', -0.86, top + 0.008, 0.16, { rx: 90, seg: 16 });
    cyl(g, 0.008, 0.008, 0.11, 'woodBlack', -0.86, top + 0.008, 0.26, 6, { rx: 90 });
  }
  if (o.lamp !== false) PROPS.deskLamp(group(g, o.lampX ?? 0.92, top, -d / 2 + 0.2, -35), { intensity: o.intensity ?? 2.6, shade: 'brassDull' }, ctx);
  shadowBlob(g, w, d);
  return { c: [w, d], h: 1.2 };
});

/**
 * The Lodger: a chess-playing automaton of the old kind. A cabinet on castors
 * with a board let into its top; behind it a figure in a robe and turban, one
 * hand out over the board; and one door standing ajar on the wheels inside.
 */
def('automaton', (g0, o, ctx) => {
  // Cabinet and figure together run from 0.31 in front of the cabinet's middle to 0.77 behind it:
  // set them about the origin, so that what blocks the floor is what is there.
  const g = group(g0, 0, 0, 0.23);
  const w = 1.2;
  const d = 0.62;
  const h = 0.86;
  const base = 0.09;
  const robe = o.robe ?? '#263f3a';
  const face = '#b99573';
  // Castors.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      sph(g, 0.035, 'brass', sx * (w / 2 - 0.08), 0.035, sz * (d / 2 - 0.08), 8);
      box(g, 0.05, 0.03, 0.05, 'brassDull', sx * (w / 2 - 0.08), base - 0.015, sz * (d / 2 - 0.08));
    }
  }
  // The cabinet: a carcass open at the front, so that the works can be seen.
  box(g, w, 0.04, d, 'woodDark', 0, base + 0.02, 0);
  box(g, w + 0.04, 0.045, d + 0.04, 'woodDark', 0, h - 0.0225, 0);
  box(g, w, h - base - 0.08, 0.03, 'woodDark', 0, (h + base) / 2, -d / 2 + 0.015);
  for (const s of [-1, 1]) box(g, 0.03, h - base - 0.08, d, 'woodDark', s * (w / 2 - 0.015), (h + base) / 2, 0);
  box(g, 0.03, h - base - 0.08, d - 0.04, 'woodDark', -0.2, (h + base) / 2, 0);
  box(g, w - 0.06, 0.03, d - 0.04, 'woodDark', 0, base + 0.2, 0);
  box(g, w - 0.04, 0.02, d - 0.03, 'dark', 0, base + 0.05, 0, { noShadow: true });
  const dy0 = base + 0.215;
  const dh = h - 0.045 - dy0;
  // The long drawer for the chessmen.
  box(g, w - 0.08, 0.15, 0.025, 'wood', 0, base + 0.115, d / 2 - 0.0125);
  for (const sx of [-0.3, 0.3]) sph(g, 0.016, 'brass', sx, base + 0.115, d / 2 + 0.008, 8);
  // Two doors shut on the right.
  for (let i = 0; i < 2; i++) {
    const x = -0.2 + 0.015 + 0.385 * (i + 0.5);
    box(g, 0.37, dh - 0.02, 0.025, 'wood', x, dy0 + dh / 2, d / 2 - 0.0125);
    box(g, 0.25, dh - 0.16, 0.03, 'woodDark', x, dy0 + dh / 2, d / 2 - 0.012);
    sph(g, 0.014, 'brass', x + (i ? -0.15 : 0.15), dy0 + dh / 2, d / 2 + 0.008, 8);
    cyl(g, 0.006, 0.006, 0.004, 'dark', x + (i ? -0.15 : 0.15), dy0 + dh / 2 - 0.05, d / 2 + 0.001, 6, { rx: 90 });
  }
  // The left door, ajar, and what is behind it.
  const door = group(g, -w / 2 + 0.02, 0, d / 2 - 0.012);
  door.rotation.y = -(o.ajar ?? 78) * DEG;
  box(door, 0.37, dh - 0.02, 0.025, 'wood', 0.185, dy0 + dh / 2, 0);
  box(door, 0.25, dh - 0.16, 0.03, 'woodDark', 0.185, dy0 + dh / 2, 0);
  sph(door, 0.014, 'brass', 0.33, dy0 + dh / 2, 0.02, 8);
  const cx = -0.39;
  const cy = dy0 + dh / 2;
  box(g, 0.37, dh, 0.01, '#241a12', cx, cy, -d / 2 + 0.04, { noShadow: true });
  // In the dark of the cabinet polished brass would show nothing: these are painted to be seen by.
  const gold = '#d0a850';
  const dull = '#a07c38';
  const grey = '#9aa0a4';
  gear(g, 0.15, 36, 0.012, gold, cx - 0.02, cy - 0.04, 0.2);
  gear(g, 0.085, 20, 0.012, dull, cx + 0.1, cy + 0.14, 0.23);
  gear(g, 0.06, 14, 0.012, gold, cx - 0.11, cy + 0.17, 0.25);
  gear(g, 0.045, 12, 0.014, grey, cx + 0.1, cy - 0.16, 0.25, { spokes: 0 });
  gear(g, 0.1, 24, 0.01, dull, cx + 0.03, cy + 0.02, 0.05);
  gear(g, 0.13, 30, 0.01, gold, cx - 0.04, cy + 0.06, -0.1);
  for (const [ax, ay] of [[cx - 0.02, cy - 0.04], [cx + 0.1, cy + 0.14], [cx - 0.11, cy + 0.17], [cx + 0.1, cy - 0.16]]) cyl(g, 0.008, 0.008, d - 0.1, grey, ax, ay, 0, 6, { rx: 90 });
  // A pinned barrel, like a musical box's.
  cyl(g, 0.05, 0.05, 0.3, gold, cx, dy0 + 0.07, 0.1, 14, { rz: 90 });
  for (let i = 0; i < 16; i++) sph(g, 0.006, grey, cx - 0.13 + (i % 8) * 0.037, dy0 + 0.07 + Math.sin(i * 1.9) * 0.05, 0.1 + Math.cos(i * 1.9) * 0.05, 4);
  // The board, in the top.
  const by = h + 0.001;
  if (!nested(g, 'chess_set', { x: 0, y: by, z: 0.04, s: 0.8, ry: 0 })) {
    plane(g, 0.44, 0.44, artMaterial('chessboard', 256, 256, (c, cw, ch, r) => ART.chessboard(c, cw, ch, r)), 0, by + 0.002, 0.04, { rx: -90, unitUv: true, noShadow: true });
    for (let i = 0; i < 8; i++) {
      for (const side of [-1, 1]) lathe(g, [[0, 0], [0.016, 0], [0.017, 0.006], [0.007, 0.02], [0.01, 0.034], [0.006, 0.04], [0.009, 0.05], [0, 0.056]], side < 0 ? IVORY : 'woodBlack', -0.169 + i * 0.0483, by + 0.002, 0.04 + side * 0.121, 8);
    }
  }
  // A candlestick at each end, for the look of the thing.
  for (const s of [-1, 1]) PROPS.candlestick(group(g, s * 0.5, h, -0.18), {}, ctx);
  // The figure, seated behind on a box that is part of the cabinet.
  const fz = -d / 2 - 0.2;
  box(g, 0.56, 0.5, 0.46, 'woodDark', 0, 0.25 + base * 0.5, fz - 0.02);
  lathe(g, [[0.25, 0.5], [0.27, 0.62], [0.25, 0.85], [0.22, 1.05], [0.2, 1.18], [0.13, 1.3], [0.075, 1.34], [0.07, 1.38]], robe, 0, 0, fz, 14);
  torus(g, 0.12, 0.04, 'fabricCream', 0, 1.3, fz, { rx: 90, seg: 14 });
  box(g, 0.1, 0.5, 0.02, 'fabricCream', 0, 1.02, fz + 0.225, { rx: -6 });
  torus(g, 0.235, 0.025, 'brassDull', 0, 0.9, fz, { rx: 90, seg: 18 });
  // Head: carved and painted wood, a turban, a moustache that has seen better centuries.
  const head = group(g, 0, 1.47, fz + 0.01);
  head.rotation.x = 0.12;
  const skull = sph(head, 0.1, face, 0, 0, 0, 14);
  skull.scale.set(0.9, 1.08, 0.98);
  cyl(head, 0.045, 0.05, 0.08, face, 0, -0.12, -0.01, 8);
  box(head, 0.022, 0.05, 0.03, face, 0, -0.01, 0.098, { rx: -12 });
  for (const s of [-1, 1]) {
    sph(head, 0.012, 'woodBlack', s * 0.036, 0.022, 0.088, 6);
    box(head, 0.04, 0.008, 0.012, 'woodBlack', s * 0.037, 0.047, 0.088, { rz: s * -8 });
    box(head, 0.055, 0.012, 0.014, 'woodBlack', s * 0.03, -0.048, 0.09, { rz: s * 22 });
    sph(head, 0.02, face, s * 0.094, 0, 0, 6);
  }
  box(head, 0.03, 0.008, 0.01, '#6a2a22', 0, -0.062, 0.088);
  lathe(head, [[0.098, 0.03], [0.14, 0.05], [0.155, 0.1], [0.13, 0.15], [0.08, 0.175], [0, 0.18]], 'fabricCream', 0, 0, 0, 14);
  torus(head, 0.125, 0.03, 'fabricCream', 0, 0.075, 0, { rx: 78, seg: 14 });
  sph(head, 0.018, 'plasticRed', 0, 0.1, 0.14, 8);
  cyl(head, 0.0005, 0.012, 0.12, IVORY, 0, 0.17, 0.13, 5, { rx: -10 });
  // Arms: the left reaches over the board, the right rests on the cabinet by a cushion.
  const arm = (sx, hand) => {
    const shoulder = [sx * 0.2, 1.2, fz + 0.02];
    const elbow = [sx * 0.33, 0.99, fz + 0.22];
    rod(g, shoulder, elbow, 0.062, robe, 8, 0.07);
    rod(g, elbow, hand, 0.045, robe, 8, 0.06);
    sph(g, 0.066, robe, ...elbow, 8);
    sph(g, 0.07, robe, ...shoulder, 8);
    cyl(g, 0.052, 0.052, 0.035, 'fabricCream', hand[0], hand[1] + 0.01, hand[2] - 0.02, 8, { rx: 60 });
    const palm = sph(g, 0.042, face, hand[0], hand[1] - 0.005, hand[2] + 0.03, 8);
    palm.scale.set(1, 0.5, 1.25);
  };
  arm(-1, [-0.2, h + 0.075, -0.06]);
  arm(1, [0.36, h + 0.065, -0.14]);
  box(g, 0.2, 0.035, 0.16, VELVET, 0.37, h + 0.018, -0.1);
  shadowBlob(g0, w * 1.2, d * 2.0);
  return { c: [w + 0.06, 1.1], h: 1.7 };
});

// ---------------------------------------------------------- the wheelwrights

/** One cipher wheel: a brass or boxwood disc, its face cut with rings of letters. Built facing +Z about the origin. */
function cipherWheel(parent, x, y, z, r, tone, rings, turn = 0) {
  const c = group(parent, x, y, z);
  cyl(c, r, r, r * 0.12 + 0.006, tone === 'brass' ? 'brass' : 'woodLight', 0, 0, 0, 28, { rx: 90 });
  disc(c, r * 0.985, art.wheel(tone, rings), 0, 0, r * 0.06 + 0.0035, { turn });
  cyl(c, r * 0.07, r * 0.09, 0.012, 'brassDull', 0, 0, r * 0.06 + 0.008, 8, { rx: 90 });
  return c;
}

/** A cipher wheel on a counter: lying flat, or (o.stand) propped on a little easel. */
def('cipherWheel', (g, o) => {
  const r = o.rad ?? 0.09;
  const tone = o.tone ?? 'brass';
  if (o.stand) {
    box(g, r * 1.2, 0.012, 0.07, 'woodDark', 0, 0.006, 0);
    box(g, 0.012, r * 1.5, 0.012, 'woodDark', 0, r * 0.75, -0.03, { rx: -14 });
    const c = cipherWheel(g, 0, r + 0.014, 0.01, r, tone, o.rings ?? 2, o.turn ?? 0);
    c.rotation.x = -0.24;
  } else {
    const c = cipherWheel(g, 0, r * 0.06 + 0.003, 0, r, tone, o.rings ?? 2, o.turn ?? 0);
    c.rotation.x = -Math.PI / 2;
  }
  return { c: null, h: 0.2 };
});

/**
 * Racks of cipher wheels on a wall: rows of discs on pegs over narrow shelves,
 * brass and boxwood, every size the Company's ciphers call for.
 */
def('wheelRack', (g, o, ctx) => {
  const w = o.w ?? 3.0;
  const h = o.h ?? 1.9;
  const y0 = hung(o, 0.75);
  const k = group(g, 0, y0, 0);
  box(k, w, h, PROUD, 'woodDark', 0, h / 2, PROUD / 2);
  box(k, w + 0.08, 0.05, 0.07, 'woodBlack', 0, h + 0.025, 0.035);
  for (const s of [-1, 1]) box(k, 0.04, h, 0.14, 'woodBlack', s * (w / 2 + 0.02), h / 2, 0.07);
  const rows = o.rows ?? 4;
  const rowH = h / rows;
  for (let r = 0; r < rows; r++) {
    const sy = r * rowH;
    box(k, w, 0.025, 0.13, 'wood', 0, sy + 0.0125, 0.065);
    let x = -w / 2 + 0.08;
    let i = 0;
    while (x < w / 2 - 0.2) {
      const big = (r + i) % 4 === 0;
      const rad = Math.min(rowH * 0.42, big ? 0.17 : 0.09 + ctx.rnd() * 0.05);
      x += rad;
      if (x + rad > w / 2 - 0.04) break;
      const tone = ctx.rnd() < 0.55 ? 'brass' : 'box';
      const cy = sy + 0.03 + rad;
      // Each leans back against the board on the shelf under it.
      const c = cipherWheel(k, x, cy, 0.05 + rad * 0.1, rad, tone, big || ctx.rnd() < 0.4 ? 3 : 2, ctx.rnd() * 360);
      c.rotation.x = -0.1;
      if (ctx.rnd() < 0.5) box(k, 0.05, 0.03, 0.002, 'paperWhite', x, sy + 0.04, 0.132);
      x += rad + 0.03 + ctx.rnd() * 0.05;
      i++;
    }
  }
  return { c: [w, 0.2], h: 0 };
});

/** A velvet-lined tray of brass discs waiting to be fitted, and a loupe. */
def('discTray', (g, o, ctx) => {
  const w = 0.5;
  const d = 0.34;
  box(g, w, 0.02, d, 'woodDark', 0, 0.01, 0);
  box(g, w - 0.04, 0.006, d - 0.04, VELVET, 0, 0.021, 0);
  box(g, w, 0.035, 0.016, 'woodDark', 0, 0.0175, d / 2 - 0.008);
  box(g, w, 0.035, 0.016, 'woodDark', 0, 0.0175, -d / 2 + 0.008);
  for (const s of [-1, 1]) box(g, 0.016, 0.035, d, 'woodDark', s * (w / 2 - 0.008), 0.0175, 0);
  for (let i = 0; i < 6; i++) {
    const c = cipherWheel(g, -0.15 + (i % 3) * 0.15, 0.03, -0.075 + Math.floor(i / 3) * 0.15, 0.05 + (i % 2) * 0.012, i === 4 ? 'box' : 'brass', i % 2 ? 3 : 2, i * 47);
    c.rotation.x = -Math.PI / 2;
  }
  // A loupe, and the brass pin the discs turn on.
  cyl(g, 0.022, 0.028, 0.04, 'plasticBlack', w / 2 + 0.07, 0.02, 0.06, 12);
  cyl(g, 0.02, 0.02, 0.003, 'glassClear', w / 2 + 0.07, 0.041, 0.06, 12, { noShadow: true });
  cyl(g, 0.004, 0.004, 0.07, 'brass', w / 2 + 0.06, 0.004, -0.08, 6, { rz: 90, ry: 30 });
  return { c: null, h: 0.06 };
});

/**
 * A dividing engine: the machine that cuts twenty-six equal places round a
 * disc. An iron bed, a brass index plate, a boxwood blank on the arbor, a
 * cutter on a bridge over it and a crank to turn it by.
 */
def('dividingEngine', (g, o) => {
  box(g, 0.56, 0.04, 0.4, 'iron', 0, 0.02, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) cyl(g, 0.02, 0.025, 0.02, 'iron', sx * 0.24, -0.0, sz * 0.16, 8);
  }
  cyl(g, 0.03, 0.04, 0.06, 'iron', 0, 0.07, 0, 12);
  gear(g, 0.19, 78, 0.014, 'brass', 0, 0.107, 0, { rx: -90, spokes: 6 });
  cyl(g, 0.11, 0.11, 0.004, 'brassDull', 0, 0.116, 0, 24);
  cyl(g, 0.022, 0.022, 0.07, 'steel', 0, 0.15, 0, 10);
  const blank = cipherWheel(g, 0, 0.16, 0, 0.1, 'box', 2, 20);
  blank.rotation.x = -Math.PI / 2;
  cyl(g, 0.02, 0.02, 0.02, 'brass', 0, 0.185, 0, 10);
  // The bridge and the cutter.
  for (const s of [-1, 1]) box(g, 0.035, 0.24, 0.035, 'iron', s * 0.25, 0.16, -0.1);
  box(g, 0.54, 0.035, 0.035, 'iron', 0, 0.28, -0.1);
  box(g, 0.07, 0.07, 0.07, 'steelDark', 0.09, 0.265, -0.07);
  cyl(g, 0.0005, 0.008, 0.06, 'steel', 0.09, 0.205, -0.04, 6, { rx: 180 });
  cyl(g, 0.012, 0.012, 0.1, 'steel', 0.09, 0.33, -0.07, 8);
  sph(g, 0.02, 'woodBlack', 0.09, 0.385, -0.07, 8);
  // The worm and its crank.
  cyl(g, 0.016, 0.016, 0.3, 'steel', 0.21, 0.1, 0.06, 8, { rx: 90 });
  for (let i = 0; i < 7; i++) torus(g, 0.02, 0.004, 'brassDull', 0.21, 0.1, -0.02 + i * 0.014, { seg: 8 });
  const crank = torus(g, 0.06, 0.007, 'brass', 0.21, 0.1, 0.215, { seg: 16 });
  crank.rotation.y = 0;
  rod(g, [0.21, 0.1, 0.215], [0.21, 0.155, 0.215], 0.005, 'brass');
  cyl(g, 0.009, 0.009, 0.045, 'woodBlack', 0.21, 0.16, 0.24, 6, { rx: 90 });
  return { c: null, h: 0.4 };
});

/** Great wheels hung from the ceiling as a shop sign: three or four, at different heights, each turned its own way. */
def('hangingWheels', (g, o, ctx) => {
  const ceil = ctx.ceil ?? 2.9;
  const n = o.n ?? 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.6;
    const r = (o.spread ?? 0.9) * (0.5 + (0.5 * ((i * 37) % 10)) / 10);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const rad = 0.2 + ((i * 53) % 10) / 55;
    const y = 2.0 + ((i * 29) % 10) / 50;
    cyl(g, 0.004, 0.004, ceil - y - rad, 'iron', x, (ceil + y + rad) / 2, z, 4);
    const hung2 = group(g, x, y, z, i * 70 + 15);
    cipherWheel(hung2, 0, 0, 0, rad, i % 2 ? 'box' : 'brass', 3, i * 31);
    const back = cipherWheel(hung2, 0, 0, 0, rad, i % 2 ? 'box' : 'brass', 2, i * 77);
    back.rotation.y = Math.PI;
  }
  return { c: null, h: 0 };
});

/** A patch of bare brick where the plaster has come away from a wall, a bricked-up opening showing in it. */
def('brickPatch', (g, o, ctx) => {
  const w = o.w ?? 1.6;
  const h = o.h ?? 1.5;
  const y = hung(o, 1.4);
  for (let i = 0; i < 7; i++) {
    const pw = w * (0.45 + ctx.rnd() * 0.5);
    const ph = h * (0.25 + ctx.rnd() * 0.3);
    box(g, pw, ph, 0.012, 'wallBrick', (ctx.rnd() - 0.5) * (w - pw), y + (ctx.rnd() - 0.5) * (h - ph), 0.004 + i * 0.0006);
  }
  if (o.arch !== false) {
    // The line of an old opening, bricked up long ago: a low arch in paler mortar.
    const aw = w * 0.5;
    for (let i = 0; i < 9; i++) {
      const a = ((i + 0.5) / 9) * Math.PI;
      const v = box(g, 0.11, 0.05, 0.016, '#8a8072', Math.cos(a) * aw * 0.5, y - h * 0.05 + Math.sin(a) * aw * 0.36, 0.012);
      v.rotation.z = a - Math.PI / 2;
    }
    for (const s of [-1, 1]) box(g, 0.035, h * 0.36, 0.016, '#8a8072', s * aw * 0.5, y - h * 0.05 - h * 0.18, 0.012);
  }
  return { c: null, h: 0 };
});

// ---------------------------------------------------------------- the Meridian

/** A chart table with a great plan of the Fold spread on it, weighted at the corners, the instruments left where they were put down. */
def('planTable', (g, o, ctx) => {
  const w = o.w ?? 1.7;
  const d = o.d ?? 0.9;
  const h = o.h ?? 0.82;
  const m = o.mat ?? 'wood';
  box(g, w, 0.05, d, m, 0, h - 0.025, 0);
  box(g, w - 0.1, 0.15, d - 0.1, m, 0, h - 0.125, 0);
  for (const sx of [-1, 1]) {
    box(g, (w - 0.2) / 2 - 0.02, 0.105, 0.016, 'woodDark', (sx * (w - 0.2)) / 4, h - 0.125, d / 2 - 0.044);
    for (const hx of [-0.2, 0.2]) {
      const pull = torus(g, 0.028, 0.006, 'brass', (sx * (w - 0.2)) / 4 + hx, h - 0.12, d / 2 - 0.03, { seg: 8, arc: Math.PI });
      pull.rotation.z = Math.PI;
    }
    for (const sz of [-1, 1]) box(g, 0.07, h - 0.2, 0.07, m, sx * (w / 2 - 0.09), (h - 0.2) / 2, sz * (d / 2 - 0.09));
    box(g, 0.05, 0.05, d - 0.2, m, sx * (w / 2 - 0.09), 0.16, 0);
  }
  box(g, w - 0.2, 0.05, 0.05, m, 0, 0.16, 0);
  const pw = o.pw ?? Math.min(1.3, w - 0.3);
  const pd = o.pd ?? Math.min(0.82, d - 0.06);
  const px = o.px ?? -0.06;
  plane(g, pw, pd, artMaterial('plan', 768, 512, (c, cw, ch, r) => ART.plan(c, cw, ch, r)), px, h + 0.003, 0, { rx: -90, rz: 2, unitUv: true, noShadow: true });
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1]]) cyl(g, 0.032, 0.036, 0.028, 'brass', px + sx * (pw / 2 - 0.06), h + 0.018, sz * (pd / 2 - 0.06), 12);
  // The fourth corner has curled up off its weight.
  const curl = cyl(g, 0.03, 0.03, 0.2, 'paper', px - pw / 2 + 0.07, h + 0.03, pd / 2 - 0.09, 8, { rx: 90, rz: 50 });
  curl.userData.noShadow = true;
  // Dividers, a parallel rule, a pencil.
  const dv = group(g, px + 0.18, h + 0.012, 0.08, 30);
  rod(dv, [0, 0, 0], [0.07, 0, 0.15], 0.004, 'brass', 5, 0.001);
  rod(dv, [0, 0, 0], [-0.05, 0, 0.155], 0.004, 'brass', 5, 0.001);
  cyl(dv, 0.01, 0.01, 0.012, 'brassDull', 0, 0.003, 0, 8);
  const pr = group(g, px - 0.2, h + 0.008, -0.16, -12);
  box(pr, 0.36, 0.006, 0.035, 'woodBlack', 0, 0, 0);
  box(pr, 0.36, 0.006, 0.035, 'woodBlack', 0.02, 0, 0.055);
  for (const sx of [-0.1, 0.1]) box(pr, 0.012, 0.004, 0.07, 'brass', sx + 0.01, 0.005, 0.027, { ry: 20 });
  cyl(g, 0.004, 0.004, 0.16, 'plasticYellow', px + 0.42, h + 0.008, -0.2, 6, { rz: 90, ry: 25 });
  if (!nested(g, 'magnifier', { x: px - 0.38, y: h + 0.02, z: 0.12, rx: 90, ry: -30 })) {
    torus(g, 0.05, 0.006, 'brass', px - 0.38, h + 0.01, 0.14, { rx: 90, seg: 16 });
    cyl(g, 0.008, 0.008, 0.12, 'woodBlack', px - 0.38, h + 0.01, 0.25, 6, { rx: 90 });
  }
  // More charts, rolled, at the end of the table.
  for (let i = 0; i < 3; i++) cyl(g, 0.03, 0.03, 0.62 - i * 0.08, 'paper', w / 2 - 0.1 - i * 0.055, h + 0.03 + (i === 1 ? 0.05 : 0), (i - 1) * 0.02 - (i === 1 ? 0.02 : 0), 8, { rx: 90, rz: (i - 1) * 3 });
  shadowBlob(g, w, d);
  return { c: [w, d], h: h + 0.1 };
});

/** A plan chest: wide shallow drawers, each with its label and two brass pulls. */
def('planChest', (g, o) => {
  const w = o.w ?? 1.25;
  const d = o.d ?? 0.78;
  const h = o.h ?? 0.9;
  const m = o.mat ?? 'wood';
  box(g, w - 0.06, 0.08, d - 0.06, 'woodDark', 0, 0.04, 0);
  box(g, w, h - 0.115, d, m, 0, 0.08 + (h - 0.115) / 2, 0);
  box(g, w + 0.04, 0.035, d + 0.04, m, 0, h - 0.0175, 0);
  const n = o.drawers ?? 7;
  const dh = (h - 0.16) / n;
  for (let i = 0; i < n; i++) {
    const y = 0.1 + dh * (i + 0.5);
    box(g, w - 0.06, dh - 0.016, 0.016, 'woodDark', 0, y, d / 2 + 0.002);
    for (const sx of [-0.3, 0.3]) {
      const pull = torus(g, 0.03, 0.006, 'brass', sx * w, y + 0.012, d / 2 + 0.016, { seg: 8, arc: Math.PI });
      pull.rotation.z = Math.PI;
    }
    box(g, 0.1, 0.034, 0.004, 'brassDull', 0, y, d / 2 + 0.012);
    box(g, 0.084, 0.022, 0.002, 'paperWhite', 0, y, d / 2 + 0.0145);
  }
  shadowBlob(g, w, d);
  return { c: [w, d], h };
});

/** A wall shelf of great atlases: tall, thick, gilt on their spines, one laid flat on the rest. */
def('atlasShelf', (g, o, ctx) => {
  const w = o.w ?? 1.3;
  const d = 0.32;
  const y = hung(o, 1.15);
  box(g, w, 0.035, d, o.mat ?? 'woodDark', 0, y - 0.0175, d / 2);
  for (const s of [-1, 1]) {
    box(g, 0.025, 0.2, 0.025, 'brassDull', s * (w / 2 - 0.14), y - 0.135, 0.0125);
    rod(g, [s * (w / 2 - 0.14), y - 0.22, 0.014], [s * (w / 2 - 0.14), y - 0.035, d - 0.04], 0.009, 'brassDull');
  }
  let x = -w / 2 + 0.05;
  let i = 0;
  while (x < w / 2 - 0.46) {
    const t = 0.05 + ctx.rnd() * 0.04;
    const bh = 0.4 + ctx.rnd() * 0.12;
    const bd = 0.26 + ctx.rnd() * 0.04;
    const bind = BINDINGS[i % BINDINGS.length];
    const lean = i === 3 ? -9 : 0;
    const b = group(g, x + t / 2 + (lean ? 0.03 : 0), y, d / 2 + 0.01);
    b.rotation.z = lean * DEG;
    box(b, t, bh, bd, bind, 0, bh / 2, 0);
    box(b, t - 0.012, bh - 0.014, 0.01, 'paper', 0, bh / 2, -bd / 2 - 0.001);
    for (const fy of [0.16, 0.78, 0.88]) box(b, t + 0.002, 0.012, 0.004, 'brass', 0, bh * fy, bd / 2 + 0.001);
    box(b, t * 0.7, bh * 0.16, 0.003, 'brassDull', 0, bh * 0.6, bd / 2 + 0.001);
    x += t + 0.006 + (lean ? 0.06 : 0);
    i++;
  }
  // One that would not go back in.
  tome(g, w / 2 - 0.21, y, d / 2 + 0.01, { w: 0.3, d: 0.26, t: 0.075, material: 'leatherGreen', turn: 96 });
  tome(g, w / 2 - 0.2, y + 0.075, d / 2 + 0.01, { w: 0.27, d: 0.22, t: 0.05, material: 'leatherOxblood', turn: 80 });
  box(g, 0.02, 0.2, 0.2, 'brass', w / 2 - 0.03, y + 0.1, d / 2);
  return { c: null, h: 0 };
});

/** A sextant in its box: mahogany, baize-lined, the lid standing open. */
def('sextant', (g, o) => {
  const w = 0.36;
  const d = 0.32;
  const hh = 0.085;
  box(g, w, 0.012, d, 'woodDark', 0, 0.006, 0);
  box(g, w, hh, 0.012, 'woodDark', 0, hh / 2, d / 2 - 0.006);
  box(g, w, hh, 0.012, 'woodDark', 0, hh / 2, -d / 2 + 0.006);
  for (const s of [-1, 1]) box(g, 0.012, hh, d, 'woodDark', s * (w / 2 - 0.006), hh / 2, 0);
  box(g, w - 0.024, 0.004, d - 0.024, BAIZE, 0, 0.014, 0);
  const lid = group(g, 0, hh, -d / 2);
  lid.rotation.x = -(o.open ?? 105) * DEG;
  box(lid, w, 0.014, d, 'woodDark', 0, 0.007, d / 2);
  box(lid, w - 0.03, 0.003, d - 0.03, BAIZE, 0, -0.0015, d / 2);
  box(lid, 0.05, 0.02, 0.006, 'brass', 0, 0.006, d + 0.002);
  for (const s of [-1, 1]) box(g, 0.03, 0.03, 0.004, 'brass', s * (w / 2 - 0.03), hh - 0.03, d / 2 + 0.001);
  // The instrument: a frame of two arms and an arc, an index arm, mirrors and a little telescope.
  const s = group(g, 0.02, 0.05, 0.02, o.turn ?? 200);
  const R = 0.2;
  const px = -R * 0.45;
  const pz = -R * 0.5;
  const span = 1.15;
  const at = (u, rr = R) => [px + Math.cos(u) * rr, 0, pz + Math.sin(u) * rr];
  torus(s, R, 0.008, 'brass', px, 0, pz, { rx: 90, arc: span, seg: 14 });
  torus(s, R - 0.016, 0.004, 'brassDull', px, 0, pz, { rx: 90, arc: span, seg: 14 });
  rod(s, [px, 0, pz], at(0), 0.005, 'brass');
  rod(s, [px, 0, pz], at(span), 0.005, 'brass');
  rod(s, at(0, R * 0.55), at(span, R * 0.55), 0.004, 'brass');
  rod(s, at(0.3, R * 0.8), at(span - 0.3, R * 0.8), 0.004, 'brass');
  rod(s, [px, 0.012, pz], at(span * 0.62, R + 0.012).map((v, i) => (i === 1 ? 0.012 : v)), 0.0045, 'brassDull');
  box(s, 0.03, 0.012, 0.022, 'brass', ...at(span * 0.62, R - 0.004).map((v, i) => (i === 1 ? 0.014 : v)));
  cyl(s, 0.016, 0.016, 0.02, 'brass', px, 0.012, pz, 10);
  box(s, 0.032, 0.036, 0.004, 'steel', px + 0.012, 0.036, pz + 0.01, { ry: 40 });
  const hg = at(0, R * 0.62);
  box(s, 0.028, 0.03, 0.004, 'steel', hg[0], 0.03, hg[2], { ry: -20 });
  const t0 = at(span, R * 0.4);
  const scope = group(s, t0[0], 0.034, t0[2], -(span * 180) / Math.PI + 108);
  cyl(scope, 0.011, 0.013, 0.12, 'brass', 0, 0, 0, 10, { rz: 90 });
  cyl(scope, 0.007, 0.007, 0.03, 'brassDull', -0.072, 0, 0, 8, { rz: 90 });
  box(s, 0.012, 0.03, 0.012, 'brass', t0[0], 0.016, t0[2]);
  const hd = at(span * 0.5, R * 0.5);
  box(s, 0.03, 0.026, 0.1, 'woodBlack', hd[0], -0.018, hd[2], { ry: 30 });
  return { c: null, h: 0.36 };
});

/**
 * A boat's berth, built in across the cabin: lockers under it, a lee-board, the
 * blanket thrown back and the pillow still dented, a shelf of books over the
 * head and a curtain drawn to one end. Runs along X; the open side faces +Z.
 */
def('berth', (g, o, ctx) => {
  const len = o.len ?? 1.9;
  const d = o.d ?? 0.8;
  const m = o.mat ?? 'wallTeak';
  const ceil = ctx.ceil ?? 2.1;
  box(g, len, 0.46, d, m, 0, 0.23, 0);
  box(g, len + 0.02, 0.03, d + 0.02, 'woodDark', 0, 0.475, 0);
  for (const s of [-1, 1]) {
    box(g, len / 2 - 0.1, 0.3, 0.016, 'woodDark', (s * len) / 4, 0.24, d / 2 + 0.002);
    const pull = torus(g, 0.03, 0.006, 'brass', (s * len) / 4, 0.25, d / 2 + 0.014, { seg: 8, arc: Math.PI });
    pull.rotation.z = Math.PI;
  }
  // The lee-board, cut down in the middle to climb in by.
  for (const s of [-1, 1]) box(g, len * 0.24, 0.2, 0.03, m, s * len * 0.38, 0.59, d / 2 - 0.015);
  box(g, len * 0.52, 0.07, 0.03, m, 0, 0.525, d / 2 - 0.015);
  // Mattress, sheet, pillow.
  box(g, len - 0.04, 0.11, d - 0.07, 'fabricCream', 0, 0.545, -0.02);
  const px = -len / 2 + 0.3;
  const pillow = sph(g, 0.2, 'fabricWhite', px, 0.635, -0.04, 12);
  pillow.scale.set(1.15, 0.36, 1.45);
  const dent = sph(g, 0.1, 'fabricCream', px + 0.02, 0.672, -0.03, 10);
  dent.scale.set(1.1, 0.22, 1.2);
  // The blanket: over the foot, thrown back in a heap from the head.
  const blanket = o.blanket ?? '#5d6f80';
  box(g, len * 0.46, 0.035, d - 0.05, blanket, len * 0.25, 0.618, -0.02);
  box(g, 0.05, 0.16, d - 0.05, blanket, len / 2 - 0.045, 0.56, -0.02);
  for (let i = 0; i < 4; i++) {
    const fold = cyl(g, 0.055 + i * 0.012, 0.055 + i * 0.012, d - 0.12 - i * 0.05, blanket, 0.02 - i * 0.075, 0.645 + (i % 2) * 0.02, -0.02 + (i - 1.5) * 0.02, 8, { rx: 90 });
    fold.scale.y = 1;
    fold.rotation.z = (i - 1.5) * 0.1;
  }
  box(g, 0.3, 0.02, 0.36, 'fabricWhite', -0.12, 0.61, 0.12, { ry: 18 });
  // Over the head: a shelf with a fiddle rail, a few books, a reading lamp on the bulkhead.
  const sy = 1.28;
  box(g, 0.62, 0.025, 0.2, m, px + 0.05, sy, -d / 2 + 0.1);
  box(g, 0.62, 0.04, 0.012, m, px + 0.05, sy + 0.03, -d / 2 + 0.195);
  let bx = px - 0.2;
  for (let i = 0; i < 6; i++) {
    const t = 0.03 + ctx.rnd() * 0.03;
    const bh = 0.17 + ctx.rnd() * 0.06;
    box(g, t, bh, 0.14, BINDINGS[i % BINDINGS.length], bx + t / 2, sy + 0.0125 + bh / 2, -d / 2 + 0.09, i === 4 ? { rz: -10 } : undefined);
    bx += t + 0.006;
  }
  cyl(g, 0.03, 0.03, 0.012, 'brass', len / 2 - 0.45, 1.2, -d / 2 + 0.006, 10, { rx: 90 });
  tube(g, [[len / 2 - 0.45, 1.2, -d / 2 + 0.01], [len / 2 - 0.45, 1.24, -d / 2 + 0.12], [len / 2 - 0.5, 1.2, -d / 2 + 0.2]], 0.007, 'brass', { seg: 8, radial: 5 });
  lathe(g, [[0.012, 0.05], [0.03, 0.04], [0.055, 0], [0.05, 0], [0.026, 0.03]], 'brassDull', len / 2 - 0.5, 1.13, -d / 2 + 0.2, 10);
  if (o.lit !== false) {
    sph(g, 0.022, glow(0xffe2b0, 1.8), len / 2 - 0.5, 1.135, -d / 2 + 0.2, 8);
    ctx.halo(g, WARM, 0.6, len / 2 - 0.5, 1.1, -d / 2 + 0.22, 0.5);
    if (o.light !== false) ctx.light(g, { color: WARM, intensity: o.intensity ?? 2.6, distance: 4, x: len / 2 - 0.5, y: 1.05, z: -d / 2 + 0.3 });
  }
  // A curtain on a rail, drawn back to the foot.
  const rail = ceil - 0.12;
  cyl(g, 0.008, 0.008, len, 'brass', 0, rail, d / 2 + 0.02, 6, { rz: 90 });
  for (let i = 0; i < 5; i++) {
    cyl(g, 0.035, 0.045, rail - 0.62, o.curtain ?? 'fabricWine', len / 2 - 0.06 - i * 0.05, 0.6 + (rail - 0.62) / 2, d / 2 + 0.02 + (i % 2) * 0.03, 6);
    torus(g, 0.014, 0.003, 'brass', len / 2 - 0.06 - i * 0.05, rail, d / 2 + 0.02, { seg: 6, ry: 90 });
  }
  shadowBlob(g, len, d);
  return { c: [len, d], h: 0.7 };
});

/** Pigeonholes of rolled charts. Stands on the floor; o.w, o.h, o.cols, o.rows. */
def('scrollRack', (g, o, ctx) => {
  const w = o.w ?? 1.4;
  const h = o.h ?? 1.2;
  const d = o.d ?? 0.34;
  const cols = o.cols ?? 6;
  const rows = o.rows ?? 5;
  const m = o.mat ?? 'woodDark';
  const y0 = o.base ?? 0;
  if (y0 > 0.05) {
    box(g, w, y0 - 0.02, d, m, 0, (y0 - 0.02) / 2, 0);
    box(g, w + 0.03, 0.03, d + 0.03, m, 0, y0 - 0.015, 0);
  }
  box(g, w, h, 0.015, m, 0, y0 + h / 2, -d / 2 + 0.0075);
  for (let i = 0; i <= cols; i++) box(g, 0.02, h, d, m, -w / 2 + 0.01 + ((w - 0.02) * i) / cols, y0 + h / 2, 0);
  for (let j = 0; j <= rows; j++) box(g, w, 0.02, d, m, 0, y0 + 0.01 + ((h - 0.02) * j) / rows, 0);
  const cw = (w - 0.02) / cols;
  const rh = (h - 0.02) / rows;
  const ribbons = ['plasticRed', '#2f4a6a', BAIZE];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cx = -w / 2 + 0.01 + cw * (i + 0.5);
      const by = y0 + 0.02 + rh * j;
      const n = ctx.rnd() < 0.12 ? 0 : 1 + Math.floor(ctx.rnd() * 2.4);
      for (let k = 0; k < n; k++) {
        const r = Math.min(0.022 + ctx.rnd() * 0.02, rh * 0.3, cw * 0.24);
        const out = ctx.rnd() * 0.07;
        const x = cx + (k - (n - 1) / 2) * Math.min(cw * 0.42, r * 2.1);
        const y = by + r + (k === 2 ? r * 1.6 : 0);
        cyl(g, r, r, d - 0.06, k % 2 ? 'paperWhite' : 'paper', x, y, 0.02 + out / 2, 8, { rx: 90 });
        cyl(g, r * 0.28, r * 0.28, 0.004, '#6b604a', x, y, d / 2 - 0.008 + out, 6, { rx: 90, noShadow: true });
        if (ctx.rnd() < 0.5) torus(g, r, 0.004, ribbons[Math.floor(ctx.rnd() * 3)], x, y, d / 2 - 0.06 + out, { seg: 8 });
      }
    }
  }
  shadowBlob(g, w, d * 1.5);
  return { c: [w, d], h: y0 + h };
});

// --------------------------------------------------------------- the Stalemate

const PAWN = [[0, 0], [0.017, 0], [0.018, 0.006], [0.008, 0.02], [0.011, 0.034], [0.006, 0.04], [0.01, 0.05], [0, 0.058]];
const PIECE = [[0, 0], [0.02, 0], [0.021, 0.008], [0.009, 0.03], [0.012, 0.06], [0.007, 0.068], [0.013, 0.08], [0.004, 0.092], [0, 0.1]];
const ROOK = [[0, 0], [0.02, 0], [0.021, 0.008], [0.012, 0.022], [0.012, 0.055], [0.018, 0.06], [0.018, 0.075], [0, 0.075]];

/** A board and its men, built in code: what stands on a chess table when the modelled set is not to hand. */
function chessmen(g, y, size, rnd) {
  plane(g, size, size, artMaterial('chessboard', 256, 256, (c, cw, ch, r) => ART.chessboard(c, cw, ch, r)), 0, y + 0.012, 0, { rx: -90, unitUv: true, noShadow: true });
  box(g, size + 0.02, 0.012, size + 0.02, 'woodBlack', 0, y + 0.006, 0);
  const cell = (size * 0.88) / 8;
  for (const side of [-1, 1]) {
    const m = side < 0 ? IVORY : 'woodBlack';
    for (let f = 0; f < 8; f++) {
      const x = (f - 3.5) * cell;
      if (rnd() < 0.82) lathe(g, PAWN, m, x, y + 0.013, side * cell * (rnd() < 0.3 ? 1.5 : 2.5), 8);
      if (rnd() < 0.85) lathe(g, f === 0 || f === 7 ? ROOK : PIECE, m, x, y + 0.013, side * cell * 3.5, 8);
    }
  }
}

/**
 * A chess table: a square top on an iron pedestal, a set laid out on it, a chess
 * clock with one button down, and two coffee cups.
 */
def('chessTable', (g, o, ctx) => {
  const s = o.size ?? 0.8;
  const h = 0.74;
  box(g, s, 0.035, s, o.mat ?? 'woodDark', 0, h - 0.0175, 0);
  box(g, s - 0.08, 0.025, s - 0.08, 'woodBlack', 0, h - 0.047, 0);
  lathe(g, [[0.04, 0.1], [0.032, 0.2], [0.046, 0.26], [0.03, 0.32], [0.028, 0.58], [0.06, 0.66], [0.12, 0.695]], 'iron', 0, 0, 0, 10);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    tube(g, [[c * 0.03, 0.14, sn * 0.03], [c * 0.15, 0.12, sn * 0.15], [c * 0.27, 0.04, sn * 0.27], [c * 0.31, 0.014, sn * 0.31]], 0.017, 'iron', { seg: 8, radial: 6 });
    cyl(g, 0.024, 0.028, 0.02, 'iron', c * 0.31, 0.01, sn * 0.31, 8);
  }
  const scale = o.boardScale ?? 0.82;
  const turn = group(g, 0, 0, 0, o.turn ?? 0);
  if (o.set !== false && !nested(turn, 'chess_set', { y: h, s: scale })) chessmen(turn, h, 0.55 * scale, ctx.rnd);
  if (o.clock !== false) {
    const c = group(turn, s / 2 - 0.09, h, 0, -90);
    box(c, 0.2, 0.09, 0.06, 'wood', 0, 0.045, 0);
    for (const sx of [-1, 1]) {
      cyl(c, 0.034, 0.034, 0.006, 'ceramic', sx * 0.05, 0.048, 0.032, 14, { rx: 90 });
      torus(c, 0.035, 0.004, 'brass', sx * 0.05, 0.048, 0.034, { seg: 14 });
      box(c, 0.003, 0.024, 0.002, 'dark', sx * 0.05, 0.058, 0.036, { rz: sx * 30 });
      cyl(c, 0.011, 0.011, sx < 0 ? 0.012 : 0.026, 'brass', sx * 0.05, 0.09 + (sx < 0 ? 0.006 : 0.013), 0, 8);
    }
  }
  if (o.cups !== false) {
    cupAndSaucer(turn, -s / 2 + 0.1, h, s / 2 - 0.1, { full: true, turn: 40 });
    cupAndSaucer(turn, -s / 2 + 0.12, h, -s / 2 + 0.1, { turn: 200 });
  }
  shadowBlob(g, s, s);
  return { c: [s, s], h };
});

/** A table of dominoes: a game laid out in a crooked line, hands stood on edge, the boneyard to one side. */
def('dominoTable', (g, o, ctx) => {
  const r = o.rad ?? 0.5;
  const h = 0.74;
  PROPS.roundTable(group(g), { r, h }, ctx);
  const tile = (x, z, turn, stand = false, down = false) => {
    const t = group(g, x, h + (stand ? 0.012 : 0.005), z, turn);
    t.rotation.order = 'YXZ';
    if (stand) t.rotation.x = Math.PI / 2 - 0.12;
    box(t, 0.048, 0.01, 0.024, down ? 'woodBlack' : IVORY, 0, 0, 0);
    if (down) return;
    box(t, 0.002, 0.0012, 0.022, 'dark', 0, 0.0052, 0);
    for (const half of [-1, 1]) {
      const pips = Math.floor(ctx.rnd() * 7);
      const spots = [[0, 0], [-1, -1], [1, 1], [-1, 1], [1, -1], [-1, 0], [1, 0]];
      const use = pips % 2 ? spots.slice(0, pips) : spots.slice(1, pips + 1);
      for (const [a, b] of use) cyl(t, 0.0026, 0.0026, 0.0014, 'dark', half * 0.012 + a * 0.006, 0.0052, b * 0.0065, 5, { noShadow: true });
    }
  };
  // The line of play wanders across the table and turns twice.
  let x = -0.24;
  let z = -0.05;
  let dir = 0;
  for (let i = 0; i < 13; i++) {
    const double = i % 5 === 3;
    tile(x, z, dir + (double ? 90 : 0));
    const step = double ? 0.037 : 0.05;
    x += Math.cos((dir * Math.PI) / 180) * step;
    z -= Math.sin((dir * Math.PI) / 180) * step;
    if (i === 5 || i === 9) dir -= 90;
    else if (double) {
      x += Math.cos((dir * Math.PI) / 180) * 0.013;
      z -= Math.sin((dir * Math.PI) / 180) * 0.013;
    }
  }
  for (let i = 0; i < 5; i++) tile(-0.13 + i * 0.055, 0.34, 0, true);
  for (let i = 0; i < 4; i++) tile(0.1 - i * 0.055, -0.36, 180, true);
  for (let i = 0; i < 6; i++) tile(0.26 + (i % 2) * 0.06 + ctx.rnd() * 0.02, -0.1 + Math.floor(i / 2) * 0.05, ctx.rnd() * 90, false, true);
  cupAndSaucer(g, -0.32, h, 0.2, { full: true });
  return { c: [r * 1.7, r * 1.7], h };
});

/** A lever coffee machine in copper and brass: a boiler under a dome, two groups, a steam wand, cups warming on top. */
def('coffeeMachine', (g, o) => {
  box(g, 0.56, 0.09, 0.4, 'steelDark', 0, 0.045, 0);
  box(g, 0.5, 0.012, 0.2, 'steel', 0, 0.094, 0.09);
  for (let i = 0; i < 9; i++) box(g, 0.012, 0.004, 0.18, 'iron', -0.2 + i * 0.05, 0.102, 0.09);
  cyl(g, 0.17, 0.17, 0.44, 'copper', 0, 0.31, -0.06, 22);
  for (const by of [0.11, 0.3, 0.5]) torus(g, 0.172, 0.01, 'brass', 0, by, -0.06, { rx: 90, seg: 24 });
  lathe(g, [[0.17, 0.53], [0.16, 0.6], [0.11, 0.66], [0.05, 0.69], [0.02, 0.7], [0.03, 0.73], [0.04, 0.76], [0.02, 0.79], [0, 0.8]], 'copper', 0, 0, -0.06, 20);
  torus(g, 0.2, 0.008, 'brass', 0, 0.56, -0.06, { rx: 90, seg: 24 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    cyl(g, 0.005, 0.005, 0.05, 'brass', Math.cos(a) * 0.2, 0.545, -0.06 + Math.sin(a) * 0.2, 4);
  }
  // A gauge on the front.
  cyl(g, 0.045, 0.045, 0.03, 'brass', 0, 0.42, 0.115, 16, { rx: 90 });
  cyl(g, 0.038, 0.038, 0.004, 'ceramic', 0, 0.42, 0.132, 16, { rx: 90 });
  box(g, 0.003, 0.03, 0.002, 'plasticRed', 0.006, 0.43, 0.135, { rz: -40 });
  // The groups, each with its lever and a handle.
  for (const s of [-1, 1]) {
    const x = s * 0.13;
    cyl(g, 0.035, 0.035, 0.12, 'brass', x, 0.3, 0.13, 12, { rx: 90 });
    cyl(g, 0.04, 0.045, 0.05, 'brass', x, 0.26, 0.2, 12);
    cyl(g, 0.045, 0.035, 0.03, 'steelDark', x, 0.22, 0.2, 12);
    rod(g, [x, 0.22, 0.2], [x + s * 0.03, 0.2, 0.34], 0.012, 'plasticBlack');
    rod(g, [x, 0.33, 0.16], [x - s * 0.02, 0.62, 0.3], 0.008, 'steel');
    cyl(g, 0.014, 0.016, 0.09, 'plasticBlack', x - s * 0.023, 0.66, 0.318, 8, { rx: 25 });
  }
  tube(g, [[0.2, 0.36, -0.02], [0.27, 0.34, 0.06], [0.28, 0.24, 0.12], [0.27, 0.16, 0.13]], 0.007, 'steel', { seg: 10, radial: 6 });
  lathe(g, [[0, 0], [0.035, 0], [0.04, 0.07], [0.036, 0.09], [0.033, 0.09], [0.036, 0.07], [0.03, 0.006], [0, 0.006]], 'steel', 0.27, 0.1, 0.13, 10);
  cyl(g, 0.008, 0.008, 0.3, 'glassClear', -0.2, 0.33, -0.02, 6, { noShadow: true });
  cupAndSaucer(g, -0.04, 0.094, 0.1, {});
  return { c: null, h: 0.8 };
});

/**
 * What stands behind a coffee-house counter: a cupboard, and over it shelves of
 * cups, tins, copper pots and great jars of beans.
 */
def('coffeeBar', (g, o, ctx) => {
  const len = o.len ?? 4.6;
  box(g, len, 0.95, 0.45, 'woodDark', 0, 0.475, 0);
  box(g, len + 0.04, 0.04, 0.5, 'wood', 0, 0.97, 0);
  const doors = Math.round(len / 0.6);
  for (let i = 0; i < doors; i++) {
    const x = -len / 2 + (len * (i + 0.5)) / doors;
    box(g, len / doors - 0.06, 0.74, 0.02, 'wood', x, 0.5, 0.226);
    sph(g, 0.014, 'brass', x + (i % 2 ? -1 : 1) * (len / doors / 2 - 0.08), 0.56, 0.242, 6);
  }
  box(g, len, 1.56, 0.04, 'woodDark', 0, 1.77, -0.2);
  box(g, len + 0.1, 0.1, 0.3, 'woodDark', 0, 2.56, -0.08);
  for (const s of [-1, 1]) box(g, 0.05, 1.56, 0.26, 'woodDark', s * (len / 2 - 0.025), 1.77, -0.09);
  const tins = ['enamelGreen', '#7a2a22', '#2a3a5a', 'brassDull', '#c9b27c'];
  [1.3, 1.72, 2.12].forEach((y, row) => {
    box(g, len - 0.1, 0.03, 0.24, 'wood', 0, y, -0.09);
    let x = -len / 2 + 0.12;
    while (x < len / 2 - 0.2) {
      const pick = (row + Math.floor(ctx.rnd() * 3)) % 4;
      const top = y + 0.015;
      if (pick === 0) {
        // A jar of beans.
        cyl(g, 0.07, 0.07, 0.22, 'glassClear', x + 0.07, top + 0.11, -0.09, 12, { noShadow: true });
        cyl(g, 0.064, 0.064, 0.15 + ctx.rnd() * 0.05, '#3a2414', x + 0.07, top + 0.085, -0.09, 10);
        cyl(g, 0.072, 0.072, 0.02, 'brassDull', x + 0.07, top + 0.23, -0.09, 12);
        x += 0.19;
      } else if (pick === 1) {
        // Cups in a stack on their saucers.
        const n = 2 + Math.floor(ctx.rnd() * 4);
        cyl(g, 0.065, 0.05, 0.03, 'ceramic', x + 0.065, top + 0.015, -0.09, 12);
        for (let k = 0; k < n; k++) cyl(g, 0.04, 0.03, 0.05, 'ceramic', x + 0.065, top + 0.05 + k * 0.036, -0.09, 10);
        x += 0.17;
      } else if (pick === 2) {
        const tw = 0.1 + ctx.rnd() * 0.05;
        const th = 0.14 + ctx.rnd() * 0.1;
        box(g, tw, th, 0.11, tins[Math.floor(ctx.rnd() * tins.length)], x + tw / 2, top + th / 2, -0.09, { ry: (ctx.rnd() - 0.5) * 12 });
        box(g, tw * 0.7, th * 0.4, 0.002, 'paper', x + tw / 2, top + th * 0.5, -0.033);
        x += tw + 0.04;
      } else {
        // A copper pot with a long handle.
        lathe(g, [[0, 0], [0.05, 0], [0.058, 0.04], [0.04, 0.1], [0.05, 0.13], [0.046, 0.13], [0.036, 0.1], [0, 0.09]], 'copper', x + 0.06, top, -0.09, 10);
        rod(g, [x + 0.1, top + 0.11, -0.09], [x + 0.22, top + 0.15, -0.05], 0.006, 'brass');
        x += 0.26;
      }
      x += ctx.rnd() * 0.06;
    }
  });
  // On the cupboard top: a mill, sugar, a row of small glasses.
  const mx = len / 2 - 0.5;
  box(g, 0.14, 0.14, 0.14, 'wood', mx, 1.06, 0.02);
  lathe(g, [[0.03, 0.13], [0.07, 0.15], [0.075, 0.19], [0.03, 0.2]], 'brass', mx, 1.0, 0.02, 10);
  rod(g, [mx, 1.2, 0.02], [mx + 0.1, 1.22, 0.02], 0.005, 'steel');
  sph(g, 0.016, 'woodBlack', mx + 0.1, 1.245, 0.02, 6);
  box(g, 0.05, 0.03, 0.01, 'brass', mx, 1.03, 0.092);
  for (let i = 0; i < 5; i++) cyl(g, 0.026, 0.02, 0.07, 'glassClear', -len / 2 + 0.3 + i * 0.075, 1.025, 0.05, 8, { noShadow: true });
  return { c: [len, 0.5], h: 2.6 };
});

/** An upright piano: iron-framed, candle sconces on the front, the lid of the keys up and a piece open on the desk. */
def('uprightPiano', (g, o) => {
  const w = 1.48;
  const m = o.mat ?? 'woodBlack';
  box(g, w, 0.1, 0.6, m, 0, 0.05, -0.02);
  box(g, w - 0.04, 1.18, 0.34, m, 0, 0.69, -0.14);
  box(g, w + 0.05, 0.04, 0.4, m, 0, 1.3, -0.13);
  box(g, w - 0.02, 0.03, 0.36, m, 0, 1.265, -0.14);
  // The front above the keys: two sunk panels either side of the desk.
  for (const px of [-0.47, 0, 0.47]) {
    box(g, 0.4, 0.32, 0.012, m, px, 1.03, 0.035);
    frameBars(group(g, px, 0, 0.03), 0.4, 0.32, 1.03, 0.014, 0.008, 'brassDull');
  }
  box(g, w - 0.08, 0.03, 0.03, m, 0, 0.845, 0.04);
  // The key bed, its cheeks, and the keys.
  box(g, w, 0.07, 0.31, m, 0, 0.7, 0.165);
  for (const s of [-1, 1]) {
    box(g, 0.06, 0.15, 0.31, m, s * (w / 2 - 0.03), 0.78, 0.165);
    lathe(g, [[0.03, 0], [0.045, 0.04], [0.03, 0.1], [0.04, 0.3], [0.03, 0.45], [0.05, 0.54], [0.04, 0.565]], m, s * (w / 2 - 0.08), 0.1, 0.27, 8);
  }
  box(g, w - 0.12, 0.03, 0.02, m, 0, 0.742, 0.31);
  const kw = w - 0.14;
  box(g, kw, 0.02, 0.15, IVORY, 0, 0.75, 0.215);
  const whites = 52;
  for (let i = 1; i < whites; i++) box(g, 0.0025, 0.0205, 0.15, 'dark', -kw / 2 + (kw * i) / whites, 0.75, 0.215, { noShadow: true });
  for (let i = 0; i < whites - 1; i++) {
    const k = (i + 5) % 7;
    if (k === 2 || k === 6) continue;
    box(g, 0.013, 0.014, 0.095, 'plasticBlack', -kw / 2 + (kw * (i + 1)) / whites, 0.766, 0.188);
  }
  box(g, kw, 0.13, 0.014, m, 0, 0.82, 0.13, { rx: -8 });
  box(g, kw, 0.012, 0.03, 'fabricWine', 0, 0.762, 0.137);
  // Pedals.
  for (const s of [-1, 1]) box(g, 0.03, 0.012, 0.1, 'brass', s * 0.06, 0.065, 0.3);
  // The desk and the music on it.
  const desk = group(g, 0, 0.9, 0.065);
  desk.rotation.x = -0.22;
  box(desk, 0.62, 0.02, 0.035, m, 0, 0, 0.012);
  const music = artMaterial('sheetMusic', 384, 256, (c, cw, ch, rnd) => {
    c.fillStyle = '#ece6d2';
    c.fillRect(0, 0, cw, ch);
    c.fillStyle = 'rgba(40,36,30,0.25)';
    c.fillRect(cw / 2 - 1, 0, 2, ch);
    c.strokeStyle = 'rgba(30,26,22,0.8)';
    c.fillStyle = 'rgba(30,26,22,0.9)';
    for (const x0 of [cw * 0.05, cw * 0.55]) {
      for (let st = 0; st < 5; st++) {
        const y0 = ch * (0.12 + st * 0.17);
        c.lineWidth = 1;
        for (let l = 0; l < 5; l++) {
          c.beginPath();
          c.moveTo(x0, y0 + l * 4);
          c.lineTo(x0 + cw * 0.4, y0 + l * 4);
          c.stroke();
        }
        for (let n = 0; n < 9; n++) {
          const nx = x0 + cw * (0.03 + n * 0.042);
          const ny = y0 + rnd() * 18 - 1;
          c.beginPath();
          c.ellipse(nx, ny, 3.2, 2.4, -0.4, 0, Math.PI * 2);
          c.fill();
          c.beginPath();
          c.moveTo(nx + 3, ny);
          c.lineTo(nx + 3, ny - 13);
          c.stroke();
        }
      }
    }
  });
  plane(desk, 0.5, 0.33, music, 0, 0.18, 0.012, { unitUv: true, noShadow: true });
  // Sconces.
  for (const s of [-1, 1]) {
    tube(g, [[s * 0.47, 1.12, 0.04], [s * 0.5, 1.1, 0.12], [s * 0.56, 1.1, 0.17]], 0.007, 'brass', { seg: 8, radial: 5 });
    cyl(g, 0.028, 0.015, 0.02, 'brass', s * 0.56, 1.11, 0.17, 8);
    cyl(g, 0.01, 0.01, 0.1, IVORY, s * 0.56, 1.17, 0.17, 6);
  }
  shadowBlob(g, 1.6, 0.8);
  return { c: [w, 0.66], h: 1.32 };
});

/** A cake on a stand under a glass dome, and a card to say what it is. o.label */
def('cakeDome', (g, o) => {
  lathe(g, [[0, 0], [0.08, 0], [0.085, 0.01], [0.03, 0.03], [0.025, 0.08], [0.06, 0.095], [0.17, 0.105], [0.175, 0.115], [0, 0.115]], 'ceramic', 0, 0, 0, 18);
  if (!nested(g, 'cake', { y: 0.115, s: 1.0 })) {
    cyl(g, 0.11, 0.11, 0.07, '#9a6a34', 0, 0.15, 0, 18);
    cyl(g, 0.112, 0.112, 0.014, '#e8dfc8', 0, 0.192, 0, 18);
    for (let i = 0; i < 7; i++) sph(g, 0.012, '#6a4420', Math.cos(i * 0.9) * 0.07, 0.202, Math.sin(i * 0.9) * 0.07, 5);
  }
  lathe(g, [[0.16, 0.116], [0.162, 0.2], [0.15, 0.27], [0.11, 0.33], [0.05, 0.36], [0.012, 0.365], [0.012, 0.378], [0.022, 0.385], [0.022, 0.4], [0, 0.404]], 'glassClear', 0, 0, 0, 20, { noShadow: true });
  if (o.label !== false) {
    const card = artMaterial(`card:${o.label ?? 'THE DRAW CAKE'}`, 256, 96, (c, w, h, r) => ART.sign(c, w, h, r, { text: o.label ?? 'THE DRAW CAKE', bg: '#e6dcc0', fg: '#2a2218', size: 0.42 }));
    const p = plane(g, 0.16, 0.06, card, 0.02, 0.031, 0.21, { unitUv: true, noShadow: true });
    p.rotation.x = -0.35;
    box(g, 0.16, 0.004, 0.04, 'paperWhite', 0.02, 0.002, 0.2);
  }
  return { c: null, h: 0.4 };
});

// -------------------------------------------------------------------- the Crux

/** Galley proofs pegged along a string to dry, across a room at o.y. Runs along X for o.len. */
def('proofLine', (g, o, ctx) => {
  const len = o.len ?? 3;
  const y = o.hgt ?? 1.95;
  const n = o.n ?? Math.round(len / 0.32);
  const sag = 0.07;
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push([-len / 2 + len * t, y - Math.sin(t * Math.PI) * sag, 0]);
  }
  tube(g, pts, 0.003, 'rope', { seg: 16, radial: 4, noShadow: true });
  const proof = doubleSided(art.sheet('proof', 0));
  const page = doubleSided(art.sheet('crossword', 1));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5 + (ctx.rnd() - 0.5) * 0.4) / n;
    const x = -len / 2 + len * t;
    const top = y - Math.sin(t * Math.PI) * sag;
    const wide = i % 3 === 1;
    const sh = wide ? 0.3 : 0.42 + ctx.rnd() * 0.12;
    const sw = wide ? 0.22 : 0.14;
    const p = plane(g, sw, sh, wide ? page : proof, x, top - sh / 2 - 0.004, 0, { unitUv: true, noShadow: true });
    p.rotation.set((ctx.rnd() - 0.5) * 0.12, (ctx.rnd() - 0.5) * 0.5, (ctx.rnd() - 0.5) * 0.06);
    box(g, 0.012, 0.035, 0.014, 'woodLight', x, top - 0.006, 0);
  }
  return { c: null, h: 0 };
});

/** Bundles of the paper, tied with string and stacked: o.n of them. */
def('paperBundles', (g, o, ctx) => {
  const n = o.n ?? 3;
  let y = 0;
  const front = artMaterial('crux:bundle', 384, 512, (c, w, h, r) => ART.crux(c, w, h, r, { headline: o.headline }));
  for (let i = 0; i < n; i++) {
    const t = 0.1 + ctx.rnd() * 0.07;
    const b = group(g, (ctx.rnd() - 0.5) * 0.04, y, (ctx.rnd() - 0.5) * 0.04, (ctx.rnd() - 0.5) * 16);
    box(b, 0.3, t, 0.4, 'paper', 0, t / 2, 0);
    box(b, 0.31, t + 0.004, 0.012, 'rope', 0, t / 2, 0.05);
    box(b, 0.012, t + 0.004, 0.41, 'rope', 0.03, t / 2, 0);
    if (i === n - 1) plane(b, 0.3, 0.4, front, 0, t + 0.001, 0, { rx: -90, unitUv: true, noShadow: true });
    y += t;
  }
  shadowBlob(g, 0.45, 0.5);
  return { c: [0.32, 0.42], h: y };
});

/** A wicker waste-paper basket, with what was thrown at it. o.full */
function wicker(parent, x, y, z, s = 1) {
  const b = group(parent, x, y, z);
  b.scale.setScalar(s);
  const weave = artMaterial('weave', 256, 192, (c, w, h, r) => ART.weave(c, w, h, r), { rough: 0.9 });
  weave.side = THREE.DoubleSide;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.115, 0.3, 20, 1, true), weave);
  wall.position.y = 0.15;
  b.add(wall);
  cyl(b, 0.115, 0.115, 0.012, '#6b4a26', 0, 0.006, 0, 16);
  torus(b, 0.152, 0.011, '#8a6436', 0, 0.3, 0, { rx: 90, seg: 20 });
  torus(b, 0.118, 0.008, '#8a6436', 0, 0.012, 0, { rx: 90, seg: 20 });
  return b;
}

def('wasteBasket', (g, o, ctx) => {
  wicker(g, 0, 0, 0);
  const n = o.full ?? 5;
  for (let i = 0; i < n; i++) {
    const inside = i < 3;
    const ball = sph(g, 0.035 + ctx.rnd() * 0.02, i % 2 ? 'paperWhite' : 'paper', inside ? (ctx.rnd() - 0.5) * 0.12 : (ctx.rnd() - 0.5) * 0.7, inside ? 0.24 + ctx.rnd() * 0.07 : 0.035, inside ? (ctx.rnd() - 0.5) * 0.12 : 0.2 + ctx.rnd() * 0.3, 5);
    ball.scale.set(1, 0.8, 0.9);
  }
  shadowBlob(g, 0.4, 0.4);
  return { c: [0.3, 0.3], h: 0.32 };
});

// --------------------------------------------------------------- the Almshouses

/** Foxgloves in a vase: tall spires, the bells hung down one side and smaller toward the tip. */
def('foxgloves', (g, o, ctx) => {
  const vh = 0.26;
  if (!nested(g, 'vase', { s: 0.65 })) lathe(g, [[0, 0], [0.05, 0], [0.075, 0.05], [0.07, 0.11], [0.03, 0.18], [0.026, 0.23], [0.04, 0.26], [0.03, 0.26], [0.02, 0.23]], o.mat ?? 'ceramic', 0, 0, 0, 14);
  const n = o.n ?? 4;
  const colours = ['#b0527a', '#c97aa0', '#9a4a86', '#e6d3d8'];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + ctx.rnd();
    const lean = 0.05 + ctx.rnd() * 0.07;
    const len = 0.5 + ctx.rnd() * 0.25;
    const foot = [0, vh - 0.06, 0];
    const tip = [Math.cos(a) * lean * 2.2, vh + len, Math.sin(a) * lean * 2.2];
    rod(g, foot, tip, 0.004, LEAF, 5, 0.002);
    const colour = colours[i % colours.length];
    const bells = 12;
    for (let b = 0; b < bells; b++) {
      const t = 0.35 + (b / bells) * 0.62;
      const px = foot[0] + (tip[0] - foot[0]) * t;
      const py = foot[1] + (tip[1] - foot[1]) * t;
      const pz = foot[2] + (tip[2] - foot[2]) * t;
      const size = 1 - (b / bells) * 0.6;
      const side = a + (b % 2 ? 0.7 : -0.7) + (ctx.rnd() - 0.5) * 0.5;
      rod(g, [px + Math.cos(side) * 0.034 * size, py - 0.03 * size, pz + Math.sin(side) * 0.034 * size], [px, py, pz], 0.013 * size, colour, 6, 0.004);
    }
    // A leaf or two at the foot of each.
    const leaf = box(g, 0.035, 0.12, 0.004, LEAF, Math.cos(a) * 0.04, vh + 0.02, Math.sin(a) * 0.04);
    leaf.rotation.set(Math.sin(a) * 0.7, -a, Math.cos(a) * 0.7, 'YXZ');
  }
  return { c: null, h: 1.0 };
});

// ------------------------------------------------------------- the Repository

/**
 * The Lectern: the Company's reference engine, in the shape it has always kept
 * its references in. An oak reading-desk on a turned pedestal; a screen let
 * into the slope where the book would lie, softly lit; a chained book under it.
 */
def('lectern', (g, o, ctx) => {
  cyl(g, 0.36, 0.38, 0.06, 'woodDark', 0, 0.03, 0, 8, { ry: 22.5 });
  cyl(g, 0.29, 0.31, 0.05, 'wood', 0, 0.085, 0, 8, { ry: 22.5 });
  lathe(g, [[0.2, 0.11], [0.12, 0.17], [0.075, 0.3], [0.1, 0.42], [0.11, 0.5], [0.07, 0.58], [0.06, 0.88], [0.085, 0.96], [0.14, 1.0], [0.16, 1.03]], 'wood', 0, 0, 0, 14);
  torus(g, 0.105, 0.012, 'brass', 0, 0.46, 0, { rx: 90, seg: 16 });
  torus(g, 0.066, 0.01, 'brass', 0, 0.86, 0, { rx: 90, seg: 14 });
  // The desk.
  const top = group(g, 0, 1.1, 0.02);
  top.rotation.x = 0.55;
  box(top, 0.7, 0.05, 0.54, 'wood', 0, 0, 0);
  box(top, 0.7, 0.07, 0.035, 'woodDark', 0, 0.045, 0.255);
  cyl(top, 0.008, 0.008, 0.66, 'brass', 0, 0.085, 0.255, 6, { rz: 90 });
  for (const s of [-1, 1]) {
    box(top, 0.035, 0.12, 0.54, 'woodDark', s * 0.335, -0.02, 0);
    sph(top, 0.022, 'brass', s * 0.335, 0.05, -0.27, 8);
  }
  box(top, 0.7, 0.09, 0.035, 'woodDark', 0, 0.01, -0.262);
  // The screen and its brass bezel.
  const sw = 0.5;
  const sh = 0.33;
  box(top, sw + 0.05, 0.012, sh + 0.05, 'brassDull', 0, 0.03, -0.02);
  const screen = artMaterial('lecternScreen', 512, 340, (c, w, h) => ART.lecternScreen(c, w, h), { basic: true });
  plane(top, sw, sh, screen, 0, 0.0372, -0.02, { rx: -90, unitUv: true, noShadow: true, dyn: true });
  // A grille to speak through, and one brass key.
  cyl(top, 0.03, 0.03, 0.008, 'dark', -0.2, 0.03, 0.2, 12);
  torus(top, 0.031, 0.005, 'brass', -0.2, 0.034, 0.2, { rx: 90, seg: 12 });
  cyl(top, 0.018, 0.018, 0.014, 'brass', 0.22, 0.034, 0.2, 10);
  // The chained book: a habit the Company has not broken.
  box(g, 0.34, 0.03, 0.26, 'woodDark', 0, 0.62, 0.14);
  rod(g, [0, 0.6, 0.02], [0, 0.56, 0.2], 0.012, 'woodDark');
  tome(g, 0, 0.635, 0.14, { w: 0.28, d: 0.21, t: 0.06, material: 'leatherOxblood', turn: 8 });
  for (let i = 0; i < 12; i++) torus(g, 0.011, 0.0028, 'brassDull', 0.16 + Math.sin(i * 0.5) * 0.02, 0.68 + i * 0.03 - (i > 7 ? (i - 7) * 0.012 : 0), 0.22 - i * 0.012, { seg: 6, ry: i % 2 ? 90 : 0 });
  // Its lead goes down the column and away across the floor.
  tube(g, [[0, 0.5, -0.1], [0, 0.2, -0.16], [0.02, 0.03, -0.3], [0.1, 0.012, -0.5]], 0.012, 'rubber', { seg: 12, radial: 6 });
  const glowAt = [0, 1.32, 0.16];
  ctx.halo(g, 0x9fe6d8, 1.5, ...glowAt, 0.32);
  if (o.light !== false) ctx.light(g, { color: 0x9fe6d8, intensity: o.intensity ?? 3.2, distance: o.distance ?? 6, x: 0, y: 1.5, z: 0.45 });
  shadowBlob(g, 0.9, 0.9);
  return { c: [0.74, 0.7], h: 1.4 };
});

/**
 * A display case. By default a glazed table on legs with sheets laid out under
 * the glass, lit from inside; o.tall makes it an upright case on a plinth with
 * one sheet on a stand. o.light gives the glow a real light.
 */
def('vitrine', (g, o, ctx) => {
  const kinds = o.sheets ?? ['grid', 'notes', 'crossword'];
  const cool = 0xcfe8ff;
  if (o.tall) {
    const s = 0.62;
    box(g, s + 0.06, 0.08, s + 0.06, 'woodBlack', 0, 0.04, 0);
    box(g, s, 0.82, s, 'woodDark', 0, 0.49, 0);
    box(g, s + 0.06, 0.04, s + 0.06, 'woodBlack', 0, 0.92, 0);
    box(g, s - 0.06, 0.008, s - 0.06, 'fabricCream', 0, 0.944, 0);
    const gh = 0.72;
    box(g, s - 0.04, gh, s - 0.04, 'glassClear', 0, 0.94 + gh / 2, 0, { noShadow: true });
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) box(g, 0.016, gh, 0.016, 'brassDull', sx * (s / 2 - 0.02), 0.94 + gh / 2, sz * (s / 2 - 0.02));
    }
    box(g, s, 0.05, s, 'woodBlack', 0, 0.94 + gh + 0.025, 0);
    box(g, s - 0.14, 0.006, s - 0.14, glow(cool, 1.3), 0, 0.94 + gh - 0.004, 0);
    // The sheet, on a sloped rest.
    const rest = group(g, 0, 1.0, 0.02);
    rest.rotation.x = -0.5;
    box(rest, 0.3, 0.4, 0.012, 'woodDark', 0, 0.2, -0.008);
    plane(rest, 0.24, 0.32, art.sheet(kinds[0] === 'grid' ? 'notes' : kinds[0], 2), 0, 0.21, 0, { unitUv: true, noShadow: true });
    box(g, 0.14, 0.004, 0.05, 'paperWhite', 0, 0.95, 0.22);
    ctx.halo(g, cool, 1.3, 0, 1.4, 0.1, 0.22);
    if (o.light !== false) ctx.light(g, { color: cool, intensity: o.intensity ?? 3, distance: 4.5, x: 0, y: 1.55, z: 0 });
    shadowBlob(g, s + 0.2, s + 0.2);
    return { c: [s + 0.06, s + 0.06], h: 1.75 };
  }
  const w = o.w ?? 1.25;
  const d = o.d ?? 0.7;
  const h = 0.86;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) cyl(g, 0.03, 0.02, h - 0.06, 'woodDark', sx * (w / 2 - 0.07), (h - 0.06) / 2, sz * (d / 2 - 0.07), 8);
  }
  box(g, w - 0.18, 0.03, 0.03, 'woodDark', 0, 0.2, 0);
  box(g, w, 0.07, d, 'woodDark', 0, h - 0.035, 0);
  box(g, w - 0.05, 0.006, d - 0.05, 'fabricCream', 0, h + 0.003, 0);
  const gh = 0.2;
  box(g, w - 0.02, gh, d - 0.02, 'glassClear', 0, h + gh / 2, 0, { noShadow: true });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) box(g, 0.018, gh, 0.018, 'brassDull', sx * (w / 2 - 0.012), h + gh / 2, sz * (d / 2 - 0.012));
  }
  for (const sz of [-1, 1]) box(g, w, 0.018, 0.018, 'brassDull', 0, h + gh, sz * (d / 2 - 0.012));
  for (const sx of [-1, 1]) box(g, 0.018, 0.018, d, 'brassDull', sx * (w / 2 - 0.012), h + gh, 0);
  // What it holds.
  kinds.forEach((kind, i) => {
    const size = kind === 'grid' ? [0.22, 0.22] : [0.2, 0.28];
    const x = -w / 2 + (w * (i + 0.5)) / kinds.length;
    plane(g, size[0], size[1], art.sheet(kind, (i + (o.first ?? 0)) % 3), x, h + 0.009 + i * 0.001, -0.03, { rx: -90, rz: (i - 1) * 7 + (o.first ?? 0) * 3, unitUv: true, noShadow: true });
    box(g, 0.1, 0.002, 0.035, 'paperWhite', x, h + 0.008, d / 2 - 0.09);
  });
  // A strip of light under the back rail.
  box(g, w - 0.12, 0.008, 0.012, glow(cool, 1.5), 0, h + gh - 0.02, -d / 2 + 0.03);
  ctx.halo(g, cool, 1.1, 0, h + 0.14, 0, 0.2);
  if (o.light) ctx.light(g, { color: cool, intensity: o.intensity ?? 3, distance: 4.5, x: 0, y: h + 0.5, z: 0.2 });
  shadowBlob(g, w, d);
  return { c: [w, d], h: h + gh };
});

/** A relic: the wicker waste-paper basket, on a plinth under its own lamp, a rope across in front of it. */
def('relicBasket', (g, o, ctx) => {
  const s = 0.5;
  const h = o.h ?? 0.9;
  box(g, s + 0.1, 0.08, s + 0.1, 'woodBlack', 0, 0.04, 0);
  box(g, s, h - 0.13, s, 'woodDark', 0, 0.08 + (h - 0.13) / 2, 0);
  box(g, s + 0.08, 0.05, s + 0.08, 'woodBlack', 0, h - 0.025, 0);
  box(g, s - 0.04, 0.012, s - 0.04, VELVET, 0, h + 0.006, 0);
  plane(g, 0.26, 0.09, art.plate(o.plate ?? 'THE BASKET', o.sub ?? 'NOT TO BE EMPTIED'), 0, h * 0.66, s / 2 + 0.002, { unitUv: true, noShadow: true });
  wicker(g, 0, h + 0.012, 0, 0.95);
  for (let i = 0; i < 2; i++) {
    const ball = sph(g, 0.04, 'paper', (i - 0.5) * 0.09, h + 0.24 + i * 0.03, (i - 0.5) * 0.05, 5);
    ball.scale.set(1, 0.8, 0.9);
  }
  // Stanchions and a rope.
  for (const sx of [-1, 1]) {
    cyl(g, 0.11, 0.12, 0.025, 'brass', sx * 0.62, 0.0125, 0.62, 14);
    cyl(g, 0.018, 0.018, 0.88, 'brass', sx * 0.62, 0.46, 0.62, 8);
    sph(g, 0.035, 'brass', sx * 0.62, 0.92, 0.62, 8);
  }
  tube(g, [[-0.62, 0.86, 0.62], [-0.3, 0.74, 0.62], [0, 0.7, 0.62], [0.3, 0.74, 0.62], [0.62, 0.86, 0.62]], 0.016, 'fabricWine', { seg: 14, radial: 6 });
  // Its lamp.
  const ceil = ctx.ceil ?? 2.7;
  cyl(g, 0.07, 0.1, 0.1, 'iron', 0, ceil - 0.05, 0, 12);
  cyl(g, 0.06, 0.06, 0.006, glow(0xffe6c0, 1.8), 0, ceil - 0.103, 0, 12);
  ctx.beam(g, { y: ceil - 0.1, top: 0.07, bottom: 0.42, h: ceil - h - 0.2, color: 0xffe6c0, opacity: 0.06 });
  if (o.light !== false) ctx.light(g, { color: 0xffe2b8, intensity: o.intensity ?? 9, distance: 5, x: 0, y: ceil - 0.15, z: 0, spot: { angle: 0.5, penumbra: 0.6, target: [0, h, 0] } });
  shadowBlob(g, s + 0.3, s + 0.3);
  return { c: [1.4, 1.4], h: h + 0.35 };
});

/** Dark equipment cabinets with small coloured lights: o.n of them side by side. */
def('serverRack', (g, o, ctx) => {
  const n = o.n ?? 2;
  const w = 0.62;
  const d = 0.9;
  const h = 2.0;
  const body = '#16191d';
  const lights = [0x4cff8a, 0x4cff8a, 0xffb040, 0x4cc8ff, 0x4cff8a];
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * (w + 0.02);
    const face = d / 2 - 0.07;
    box(g, w, h, d - 0.07, body, x, h / 2 + 0.03, -0.035);
    for (const s of [-1, 1]) box(g, 0.03, h, 0.07, body, x + s * (w / 2 - 0.015), h / 2 + 0.03, d / 2 - 0.035);
    box(g, w, 0.06, 0.07, body, x, h + 0.0, d / 2 - 0.035);
    box(g, w, 0.1, 0.07, body, x, 0.08, d / 2 - 0.035);
    box(g, w - 0.04, 0.03, d - 0.04, 'iron', x, 0.015, 0);
    // The door: a steel frame round smoked glass, a handle.
    box(g, w - 0.06, h - 0.1, 0.008, 'glassDark', x, h / 2 + 0.03, d / 2 + 0.004, { noShadow: true });
    frameBars(group(g, x, 0, d / 2 - 0.004), w - 0.1, h - 0.12, h / 2 + 0.03, 0.02, 0.03, 'steelDark');
    box(g, 0.02, 0.2, 0.025, 'steel', x + w / 2 - 0.07, h / 2, d / 2 + 0.028);
    // The units behind it, each with its lights.
    const units = 11;
    for (let u = 0; u < units; u++) {
      const y = 0.22 + u * ((h - 0.36) / (units - 1));
      box(g, w - 0.12, 0.11, 0.01, u % 4 === 2 ? '#22262b' : 'steelDark', x, y, face + 0.005);
      const count = 2 + ((u * 7 + k * 3) % 4);
      for (let i = 0; i < count; i++) {
        const colour = lights[(u + i * 2 + k) % lights.length];
        box(g, 0.016, 0.016, 0.004, glow(colour, 0.95), x - w / 2 + 0.11 + i * 0.032, y + 0.02, face + 0.012);
      }
      for (let i = 0; i < 6; i++) box(g, 0.03, 0.012, 0.004, 'dark', x + 0.02 + i * 0.038, y - 0.02, face + 0.011);
    }
    // Two that blink.
    for (let i = 0; i < 2; i++) {
      const blink = box(g, 0.016, 0.016, 0.005, glow(i ? 0xffb040 : 0x4cff8a, 1.15), x - w / 2 + 0.11 + i * 0.06, 0.22 + (3 + i * 4) * ((h - 0.36) / 10) - 0.02, face + 0.013, { dyn: true });
      const rate = 3 + ctx.rnd() * 9;
      const phase = ctx.rnd() * 10;
      ctx.anim((t) => {
        blink.visible = Math.sin(t * rate + phase) + Math.sin(t * rate * 0.37) > -0.3;
      });
    }
    // Cables up to the ceiling.
    const ceil = ctx.ceil ?? 2.7;
    cyl(g, 0.035, 0.035, ceil - h - 0.03, 'rubber', x - 0.1, (ceil + h + 0.03) / 2, -0.2, 8);
    box(g, w - 0.1, 0.02, 0.3, 'iron', x, h + 0.04, -0.2);
  }
  ctx.halo(g, 0x6cffb0, 1.2, 0, 1.2, d / 2 + 0.1, 0.16);
  shadowBlob(g, n * w + 0.2, d + 0.2);
  return { c: [n * (w + 0.02), d], h: h + 0.03 };
});

/** The Company's rolls: huge ledgers on a stand made for them, one open on the slope, the rest shelved under it. */
def('rollStand', (g, o) => {
  const w = o.w ?? 1.2;
  const d = 0.8;
  const m = o.mat ?? 'woodDark';
  for (const sx of [-1, 1]) {
    box(g, 0.08, 0.96, d - 0.1, m, sx * (w / 2 - 0.04), 0.48, 0);
    box(g, 0.12, 0.06, d, m, sx * (w / 2 - 0.04), 0.03, 0);
  }
  box(g, w - 0.08, 0.035, d - 0.12, m, 0, 0.2, 0);
  box(g, w - 0.08, 0.035, d - 0.12, m, 0, 0.56, 0);
  box(g, w - 0.08, 0.7, 0.02, m, 0, 0.56, -d / 2 + 0.07);
  const top = group(g, 0, 1.0, 0);
  top.rotation.x = 0.36;
  box(top, w + 0.06, 0.04, d + 0.04, m, 0, 0, 0);
  box(top, w + 0.06, 0.06, 0.035, m, 0, 0.045, d / 2);
  openBook(top, 0, 0.02, -0.02, { w: 0.98, d: 0.66, t: 0.09, material: 'leather' });
  // Shelved: spines out.
  tome(g, -0.2, 0.22, 0.02, { w: 0.6, d: 0.5, t: 0.13, material: 'leatherOxblood', turn: 0 });
  tome(g, -0.17, 0.35, 0.03, { w: 0.58, d: 0.48, t: 0.11, material: 'leatherGreen', turn: 3 });
  tome(g, 0.3, 0.22, 0.0, { w: 0.4, d: 0.5, t: 0.15, material: 'leather', turn: -2 });
  tome(g, -0.02, 0.58, 0.02, { w: 0.62, d: 0.5, t: 0.14, material: 'leather', turn: 0 });
  tome(g, 0.0, 0.72, 0.03, { w: 0.6, d: 0.48, t: 0.1, material: '#2a2f44', turn: -4 });
  shadowBlob(g, w, d);
  return { c: [w, d], h: 1.3 };
});

/**
 * One rib of a low vault, springing from a pier at each end and meeting the
 * ceiling in the middle. Runs along X for o.span; the piers stand o.spring high.
 */
def('vaultRib', (g, o, ctx) => {
  const span = o.span ?? 9;
  const ceil = ctx.ceil ?? 2.7;
  const spring = o.spring ?? 1.75;
  const m = o.mat ?? 'wallBrick';
  const depth = o.depth ?? 0.42;
  const t = o.thick ?? 0.26;
  const rise = ceil - spring;
  const half = span / 2 - 0.25;
  const R = (half * half + rise * rise) / (2 * rise);
  const cy = ceil - R;
  const a0 = Math.asin(half / R);
  const n = o.segments ?? 16;
  for (let i = 0; i < n; i++) {
    const a = -a0 + ((i + 0.5) / n) * a0 * 2;
    const len = (2 * a0 * R) / n + 0.02;
    const seg = box(g, len, t, depth, m, Math.sin(a) * (R - t / 2), cy + Math.cos(a) * (R - t / 2), 0);
    seg.rotation.z = -a;
  }
  for (const s of [-1, 1]) {
    box(g, 0.5, spring, depth + 0.06, m, s * (span / 2 - 0.25), spring / 2, 0);
    box(g, 0.58, 0.1, depth + 0.14, o.cap ?? 'wallStone', s * (span / 2 - 0.25), spring - 0.02, 0);
    box(g, 0.56, 0.16, depth + 0.12, o.cap ?? 'wallStone', s * (span / 2 - 0.25), 0.08, 0);
  }
  return { c: null, h: 0 };
});

/** A modern desk in an old room: trestle legs, two screens, a keyboard, a scanner with a ledger on it, and everything else. */
def('techDesk', (g, o, ctx) => {
  const w = o.w ?? 1.7;
  const d = o.d ?? 0.78;
  const h = 0.74;
  box(g, w, 0.03, d, 'woodLight', 0, h - 0.015, 0);
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.2);
    box(g, 0.05, h - 0.05, 0.05, 'steelDark', x, (h - 0.05) / 2, 0);
    box(g, 0.06, 0.03, d - 0.1, 'steelDark', x, 0.015, 0);
    box(g, 0.06, 0.03, d - 0.16, 'steelDark', x, h - 0.045, 0);
  }
  box(g, w - 0.4, 0.04, 0.03, 'steelDark', 0, h - 0.2, -d / 2 + 0.16);
  const top = h;
  // Two screens on one arm.
  cyl(g, 0.02, 0.02, 0.36, 'steelDark', 0, top + 0.18, -d / 2 + 0.1, 8);
  box(g, 0.1, 0.012, 0.1, 'steelDark', 0, top + 0.006, -d / 2 + 0.1);
  [-1, 1].forEach((s, i) => {
    const scr = group(g, s * 0.3, top + 0.34, -d / 2 + 0.16, -s * 14);
    box(scr, 0.56, 0.34, 0.02, 'plasticBlack', 0, 0, 0);
    plane(scr, 0.53, 0.3, artMaterial(`monitor:${i}`, 384, 224, (c, cw, ch, r) => ART.monitor(c, cw, ch, r), { basic: true }), 0, 0.005, 0.0105, { unitUv: true, noShadow: true, dyn: true });
    rod(g, [0, top + 0.3, -d / 2 + 0.1], [s * 0.3, top + 0.34, -d / 2 + 0.15], 0.012, 'steelDark');
  });
  // Keyboard, mouse, a mug, cans.
  box(g, 0.42, 0.018, 0.14, 'plasticBlack', -0.05, top + 0.009, 0.12, { ry: 3 });
  for (let r = 0; r < 4; r++) box(g, 0.38, 0.004, 0.022, '#2a2e33', -0.05, top + 0.02, 0.075 + r * 0.03, { ry: 3 });
  const mouse = sph(g, 0.03, 'plasticBlack', 0.27, top + 0.012, 0.14, 8);
  mouse.scale.set(0.9, 0.5, 1.4);
  PROPS.mug(group(g, 0.42, top, 0.02), { mat: '#2a4a7a' }, ctx);
  for (let i = 0; i < 3; i++) {
    cyl(g, 0.03, 0.03, 0.12, 'steel', 0.6 + (i % 2) * 0.07, top + 0.06, -0.12 + i * 0.065, 10);
    cyl(g, 0.0305, 0.0305, 0.05, i === 1 ? 'plasticRed' : '#2a6a4a', 0.6 + (i % 2) * 0.07, top + 0.06, -0.12 + i * 0.065, 10);
  }
  // A flatbed scanner, lid up, with one of the old ledgers face down on the glass.
  const sx = -w / 2 + 0.34;
  box(g, 0.46, 0.06, 0.34, '#d8d8d4', sx, top + 0.03, 0.02);
  box(g, 0.4, 0.004, 0.28, 'glassDark', sx, top + 0.062, 0.02, { noShadow: true });
  box(g, 0.36, 0.002, 0.01, glow(0xcfe8ff, 1.6), sx, top + 0.065, 0.12);
  const lid = group(g, sx, top + 0.06, -0.15);
  lid.rotation.x = -1.2;
  box(lid, 0.46, 0.02, 0.34, '#d8d8d4', 0, 0.01, 0.17);
  tome(g, sx + 0.02, top + 0.065, 0.0, { w: 0.3, d: 0.22, t: 0.05, material: 'leather', turn: 6 });
  // Headphones, notes stuck to the screen's edge, a tangle of leads.
  const hp = torus(g, 0.08, 0.008, 'plasticBlack', 0.44, top + 0.085, 0.24, { seg: 12, arc: Math.PI });
  hp.rotation.y = 0.5;
  for (const s of [-1, 1]) cyl(g, 0.035, 0.035, 0.03, 'plasticBlack', 0.44 + s * 0.07, top + 0.04, 0.24 - s * 0.038, 10, { rz: 90, ry: 28 });
  for (let i = 0; i < 4; i++) plane(g, 0.07, 0.07, 'plasticYellow', -0.58 + i * 0.09, top + 0.1 + (i % 2) * 0.08, -d / 2 + 0.2, { noShadow: true, ry: 14, rz: (i - 2) * 4 });
  tube(g, [[0.1, top + 0.01, -d / 2 + 0.12], [0.3, top + 0.012, -d / 2 + 0.2], [0.5, top + 0.01, -d / 2 + 0.1], [0.62, 0.4, -d / 2 + 0.05], [0.5, 0.02, -d / 2 + 0.1]], 0.008, 'rubber', { seg: 16, radial: 5 });
  // A lamp on an arm.
  const lx = -w / 2 + 0.14;
  cyl(g, 0.06, 0.07, 0.02, 'steelDark', lx, top + 0.01, -d / 2 + 0.14, 12);
  rod(g, [lx, top + 0.02, -d / 2 + 0.14], [lx + 0.04, top + 0.4, -d / 2 + 0.2], 0.008, 'steelDark');
  rod(g, [lx + 0.04, top + 0.4, -d / 2 + 0.2], [lx + 0.3, top + 0.5, -d / 2 + 0.34], 0.008, 'steelDark');
  box(g, 0.26, 0.02, 0.05, 'steelDark', lx + 0.32, top + 0.5, -d / 2 + 0.36, { ry: -28 });
  box(g, 0.24, 0.004, 0.04, glow(0xfff0d0, 1.8), lx + 0.32, top + 0.488, -d / 2 + 0.36, { ry: -28 });
  ctx.halo(g, 0xfff0d0, 0.8, lx + 0.32, top + 0.44, -d / 2 + 0.36, 0.4);
  if (o.light !== false) ctx.light(g, { color: 0xffe6c0, intensity: o.intensity ?? 3.4, distance: 5, x: lx + 0.32, y: top + 0.44, z: -d / 2 + 0.4 });
  shadowBlob(g, w, d);
  return { c: [w, d], h: top + 0.5 };
});

/** Nothing to see: a patch of floor that cannot be walked on (the foot of a pier, a step). o.w, o.d */
def('blocker', (g, o) => ({ c: [o.w ?? 0.5, o.d ?? 0.5], h: 0 }));

/** A lead lying across the floor. o.pts: [[x, z], ...] from the prop's own origin. */
def('cable', (g, o) => {
  const pts = (o.pts ?? [[0, 0], [1, 0]]).map(([x, z]) => [x, 0.014, z]);
  tube(g, pts, o.rad ?? 0.012, 'rubber', { seg: pts.length * 8, radial: 5, tension: 0.5, noShadow: true });
  return { c: null, h: 0 };
});

// ----------------------------------------------------------------- the Lantern

/**
 * The orrery in the Lantern: an oak drum glazed to show its wheelwork, a brass
 * column, a lamp for a sun, six planets on their arms, and round it all the
 * great rings of an armillary. It turns, slowly.
 */
def('orrery', (g, o, ctx) => {
  // The drum.
  cyl(g, 0.92, 0.98, 0.1, 'woodDark', 0, 0.05, 0, 8, { ry: 22.5 });
  cyl(g, 0.8, 0.8, 0.04, 'woodDark', 0, 0.12, 0, 8, { ry: 22.5 });
  cyl(g, 0.84, 0.84, 0.06, 'woodDark', 0, 0.58, 0, 8, { ry: 22.5 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const am = a + Math.PI / 8;
    box(g, 0.05, 0.44, 0.05, 'brassDull', Math.cos(a) * 0.79, 0.34, Math.sin(a) * 0.79, { ry: (-a * 180) / Math.PI });
    box(g, 0.56, 0.4, 0.008, 'glassClear', Math.cos(am) * 0.73, 0.34, Math.sin(am) * 0.73, { ry: 90 - (am * 180) / Math.PI, noShadow: true });
  }
  // The wheelwork inside it.
  gear(g, 0.5, 72, 0.02, 'brass', 0, 0.2, 0, { rx: -90, spokes: 6 });
  gear(g, 0.26, 40, 0.02, 'brassDull', 0.36, 0.28, 0.2, { rx: -90, spokes: 5 });
  gear(g, 0.18, 28, 0.02, 'brass', -0.4, 0.33, -0.12, { rx: -90, spokes: 4 });
  gear(g, 0.12, 20, 0.02, 'steel', 0.05, 0.4, -0.42, { rx: -90, spokes: 4 });
  gear(g, 0.3, 48, 0.016, 'brassDull', -0.12, 0.44, 0.3, { rx: -90, spokes: 5 });
  for (const [x, z, h] of [[0.36, 0.2, 0.3], [-0.4, -0.12, 0.34], [0.05, -0.42, 0.4], [-0.12, 0.3, 0.44]]) cyl(g, 0.014, 0.014, h, 'steel', x, 0.14 + h / 2, z, 6);
  // The winding handle.
  rod(g, [0.78, 0.36, 0], [1.02, 0.36, 0], 0.014, 'steel');
  rod(g, [1.02, 0.36, 0], [1.02, 0.5, 0], 0.012, 'brass');
  cyl(g, 0.018, 0.018, 0.09, 'woodBlack', 1.065, 0.5, 0, 8, { rz: 90 });
  // Top plate and column.
  cyl(g, 0.72, 0.72, 0.03, 'brass', 0, 0.625, 0, 32);
  torus(g, 0.7, 0.012, 'brassDull', 0, 0.645, 0, { rx: 90, seg: 40 });
  lathe(g, [[0.16, 0.64], [0.1, 0.7], [0.06, 0.82], [0.085, 0.92], [0.05, 1.0], [0.045, 1.34], [0.07, 1.38], [0.04, 1.42]], 'brass', 0, 0, 0, 14);
  // The sun: a lamp in a glass globe.
  const sunY = 1.56;
  sph(g, 0.17, 'glassClear', 0, sunY, 0, 18, { noShadow: true });
  torus(g, 0.172, 0.006, 'brass', 0, sunY, 0, { rx: 90, seg: 24 });
  const lit = o.lit !== false;
  if (lit) {
    sph(g, 0.085, glow(0xffd890, 2.2), 0, sunY, 0, 12);
    ctx.halo(g, WARM, 2.6, 0, sunY, 0, 0.5);
    if (o.light !== false) ctx.light(g, { color: 0xffc680, intensity: o.intensity ?? 11, distance: 11, x: 0, y: sunY, z: 0, flicker: 0.04 });
  } else sph(g, 0.085, 'brassDull', 0, sunY, 0, 12);
  // Six planets, each on its own arm from its own collar, each at its own pace.
  const planets = [
    { r: 0.34, size: 0.03, m: 'steel', rate: 0.42 },
    { r: 0.5, size: 0.045, m: 'brass', rate: 0.26 },
    { r: 0.68, size: 0.05, m: '#3c6a7a', rate: 0.18, moon: true },
    { r: 0.86, size: 0.038, m: 'copper', rate: 0.12 },
    { r: 1.06, size: 0.085, m: '#b08a62', rate: 0.06 },
    { r: 1.26, size: 0.07, m: '#c9b27c', rate: 0.035, ring: true },
  ];
  planets.forEach((p, i) => {
    const cy = 1.3 - i * 0.04;
    const armG = group(g, 0, 0, 0, (i * 67 + 20) % 360);
    armG.userData.dyn = true;
    cyl(armG, 0.062, 0.062, 0.03, 'brassDull', 0, cy, 0, 12);
    rod(armG, [0.05, cy, 0], [p.r, cy, 0], 0.006, 'brass', 5);
    rod(armG, [p.r, cy, 0], [p.r, sunY - p.size, 0], 0.005, 'brass', 5);
    sph(armG, p.size, p.m, p.r, sunY, 0, 14);
    if (p.moon) {
      rod(armG, [p.r, sunY - 0.03, 0], [p.r + 0.1, sunY, 0.02], 0.003, 'brass', 4);
      sph(armG, 0.016, IVORY, p.r + 0.1, sunY, 0.02, 8);
    }
    if (p.ring) {
      const ring = torus(armG, p.size * 1.7, 0.012, 'brassDull', p.r, sunY, 0, { seg: 24 });
      ring.rotation.x = Math.PI / 2 - 0.4;
      ring.scale.z = 0.3;
    }
    const start = armG.rotation.y;
    ctx.anim((t) => {
      armG.rotation.y = start + t * p.rate * (o.speed ?? 1);
    });
  });
  // The armillary: horizon, meridian, and the band of the ecliptic at its tilt.
  const R = 1.42;
  torus(g, R, 0.022, 'brass', 0, sunY, 0, { rx: 90, seg: 56 });
  torus(g, R, 0.022, 'brass', 0, sunY, 0, { seg: 56 });
  const ecl = torus(g, R - 0.03, 0.03, 'brassDull', 0, sunY, 0, { seg: 56 });
  ecl.rotation.set(Math.PI / 2 - 0.41, 0, 0);
  ecl.scale.z = 0.35;
  const colure = torus(g, R - 0.004, 0.016, 'brass', 0, sunY, 0, { seg: 56 });
  colure.rotation.y = Math.PI / 2;
  // The cradle that carries the rings on the drum.
  for (const s of [-1, 1]) {
    tube(g, [[s * 0.6, 0.64, 0], [s * 0.86, 0.5, 0], [s * 1.12, 0.52, 0], [s * 1.3, 0.92, 0], [s * 1.4, 1.4, 0]], 0.022, 'brass', { seg: 14, radial: 6 });
    sph(g, 0.04, 'brassDull', s * R, sunY, 0, 8);
  }
  sph(g, 0.04, 'brassDull', 0, sunY + R, 0, 8);
  shadowBlob(g, 2.4, 2.4);
  return { c: [1.8, 1.8], h: 3 };
});

/**
 * A low iron grille in a ring, o.rad across, with a gate in it facing +Z.
 * It keeps the room from whatever stands inside.
 */
def('grille', (g, o) => {
  const R = o.rad ?? 1.6;
  const h = o.h ?? 1.0;
  const gate = o.gate ?? 0.3;
  const posts = o.posts ?? 12;
  const front = Math.PI / 2;
  const bars = Math.round((2 * Math.PI * R) / 0.095);
  for (let i = 0; i < bars; i++) {
    const a = (i / bars) * Math.PI * 2;
    const inGate = Math.abs(Math.atan2(Math.sin(a - front), Math.cos(a - front))) < gate;
    const top = inGate ? h + 0.12 * Math.cos(((a - front) / gate) * (Math.PI / 2)) : h;
    cyl(g, 0.009, 0.009, top - 0.08, 'iron', Math.cos(a) * R, 0.08 + (top - 0.08) / 2, Math.sin(a) * R, 5);
    if (!inGate) cyl(g, 0.0005, 0.016, 0.06, 'iron', Math.cos(a) * R, h + 0.03, Math.sin(a) * R, 4);
  }
  // Rails, broken at the gate.
  for (const y of [0.1, h - 0.04]) {
    const rail = torus(g, R, 0.014, 'iron', 0, y, 0, { seg: 64, arc: Math.PI * 2 - gate * 2 });
    rail.rotation.set(Math.PI / 2, 0, front + gate);
  }
  for (let i = 0; i < posts; i++) {
    const a = front + gate + ((Math.PI * 2 - gate * 2) * i) / (posts - 1);
    box(g, 0.045, h + 0.06, 0.045, 'iron', Math.cos(a) * R, (h + 0.06) / 2, Math.sin(a) * R, { ry: (-a * 180) / Math.PI });
    sph(g, 0.035, i === 0 || i === posts - 1 ? 'brass' : 'iron', Math.cos(a) * R, h + 0.09, Math.sin(a) * R, 8);
  }
  // The gate: its own frame, an arched top rail, hinges on one side and the lock plate's stile on the other.
  const ga = [];
  for (let i = 0; i <= 8; i++) {
    const a = front - gate + (gate * 2 * i) / 8;
    ga.push([Math.cos(a) * R, h + 0.12 * Math.cos(((a - front) / gate) * (Math.PI / 2)) - 0.0, Math.sin(a) * R]);
  }
  tube(g, ga, 0.014, 'iron', { seg: 16, radial: 6 });
  tube(g, ga.map(([x, , z]) => [x, 0.12, z]), 0.014, 'iron', { seg: 16, radial: 6 });
  tube(g, ga.map(([x, , z]) => [x, h * 0.55, z]), 0.012, 'iron', { seg: 16, radial: 6 });
  for (const y of [0.25, h - 0.2]) box(g, 0.05, 0.07, 0.03, 'brassDull', Math.cos(front + gate) * R, y, Math.sin(front + gate) * R + 0.01);
  // What blocks is a square, so it is cut a little inside the ring: the corners make up for it.
  return { c: [R * 2 - 0.04, R * 2 - 0.04], h };
});

/** The trap in the floor that the stair comes up through: its leaf thrown back, a rail on two sides. */
def('trapdoor', (g, o) => {
  const s = o.size ?? 1.0;
  // The curb and the dark under it, with the first treads showing.
  for (const sx of [-1, 1]) box(g, 0.07, 0.05, s + 0.14, 'woodDark', sx * (s / 2 + 0.035), 0.025, 0);
  for (const sz of [-1, 1]) box(g, s, 0.05, 0.07, 'woodDark', 0, 0.025, sz * (s / 2 + 0.035));
  const well = artMaterial('stairwell', 128, 128, (c, w, h) => {
    c.fillStyle = '#050608';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const y = h * (0.06 + i * 0.2);
      const k = 1 - i * 0.24;
      c.fillStyle = `rgba(${Math.round(120 * k)},${Math.round(84 * k)},${Math.round(50 * k)},1)`;
      c.fillRect(w * (0.08 + i * 0.03), y, w * (0.84 - i * 0.06), h * 0.1);
      c.fillStyle = `rgba(${Math.round(60 * k)},${Math.round(40 * k)},${Math.round(22 * k)},1)`;
      c.fillRect(w * (0.08 + i * 0.03), y + h * 0.1, w * (0.84 - i * 0.06), h * 0.05);
    }
  }, { basic: true });
  plane(g, s, s, well, 0, 0.012, 0, { rx: -90, unitUv: true, noShadow: true });
  // The leaf, thrown back against its stay.
  const leaf = group(g, 0, 0.05, -s / 2 - 0.02);
  leaf.rotation.x = -(o.open ?? 100) * DEG;
  box(leaf, s + 0.04, 0.045, s + 0.04, 'wood', 0, 0.0225, (s + 0.04) / 2);
  for (const sx of [-0.3, 0.3]) box(leaf, 0.06, 0.008, s * 0.8, 'iron', sx * s, 0.05, s * 0.45);
  torus(leaf, 0.05, 0.008, 'iron', 0, 0.06, s * 0.8, { seg: 12 });
  // Newels and a rail on the two open sides.
  const posts = [[-s / 2 - 0.035, s / 2 + 0.035], [s / 2 + 0.035, s / 2 + 0.035], [s / 2 + 0.035, -s / 2 - 0.035]];
  for (const [x, z] of posts) {
    box(g, 0.06, 0.95, 0.06, 'woodDark', x, 0.475, z);
    sph(g, 0.045, 'brass', x, 0.99, z, 10);
  }
  box(g, 0.04, 0.05, s + 0.07, 'wood', s / 2 + 0.035, 0.9, 0);
  box(g, 0.03, 0.03, s + 0.07, 'woodDark', s / 2 + 0.035, 0.5, 0);
  for (let i = 1; i < 6; i++) cyl(g, 0.012, 0.012, 0.86, 'woodDark', s / 2 + 0.035, 0.45, -s / 2 + (s * i) / 6, 6);
  return { c: null, h: 1.0 };
});
