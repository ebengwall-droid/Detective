// Dressing: real, modelled furniture and props in place of the ones built
// from boxes.
//
// Each prop is still laid out by its own function in props.js, which knows
// how big it should be, where its light goes and what glows. When a model
// for it is in memory, the plain geometry it made is taken away and the model
// is fitted to the space it occupied; the lights, flames and other live parts
// stay. When no model is in memory the prop is simply left as it was built.
//
// The models are from Poly Haven (CC0); see scripts/assets/props.json.

import * as THREE from 'three';
import { assets } from './assets.js';
import { PROPS, def } from './props.js';
import './props2.js';
import { NESTED } from './props3.js';

const WOOD = 0x7b5136;
const WOOD_DARK = 0x6a4631;

/**
 * What stands in for each kind of prop. A function gets the prop's options and
 * may return null to leave that one as built.
 *   model   name in the props manifest
 *   fit     'stretch' to the built prop's width, height and depth; 'height' or 'width' to scale evenly; 'none' for its own size
 *   anchor  'floor' (default), 'wall' (back to the wall, centred where the built one was) or 'ceiling' (hung from the top)
 *   bulb    where the lamp's light is inside the model, as fractions of its box; anything glowing is moved there
 *   live    false to drop the built prop's moving or glowing parts as well
 *   spin    radians a second, for things that turn
 */
const DRESS = {
  chair: (o) => ({ model: 'chair', fit: 'height', tint: o.mat === 'steelDark' ? 0x98a2a8 : WOOD }),
  officeChair: (o) => ({ model: 'chair_green', fit: 'height', tint: o.mat === 'leatherOxblood' ? 0xd49a8c : undefined }),
  armchair: (o) => ({ model: 'armchair', fit: 'stretch', tint: o.mat === 'leather' ? 0xa98463 : 0xbb8275 }),
  desk: (o) => (o.carved ? { model: 'console', fit: 'stretch', tint: 0xd9c9ba } : { model: 'desk_metal', fit: 'stretch', tint: o.mat === 'woodDark' ? 0x9a8d7e : 0xbdbdb8 }),
  table: (o) => ((o.d ?? 0.8) < 0.5 ? null : { model: 'table', fit: 'stretch', tint: o.mat === 'woodLight' ? 0xd9c7a8 : o.mat === 'wallTeak' ? 0xa87a55 : 0x8f6748 }),
  roundTable: { model: 'round_table', fit: 'stretch' },
  stool: { model: 'bar_stool', fit: 'height' },
  bench: (o) => (o.back ? { model: 'bench', fit: 'stretch', tint: 0x9a7560 } : null),
  bed: { model: 'day_bed', fit: 'stretch', turn: 90 },
  trunk: { model: 'trunk', fit: 'stretch', turn: 90 },
  crate: (o) => (o.stack ? null : { model: 'crate', fit: 'stretch' }),
  pendant: (o) => ({ model: 'pendant', fit: 'height', anchor: 'ceiling', bulb: [0.5, 0.08, 0.5], tint: o.shade === 'brassDull' ? 0xe0bb7c : o.shade === 'iron' ? 0x8f9092 : undefined }),
  sconce: { model: 'sconce', fit: 'none', anchor: 'wall', bulb: [0.5, 0.3, 0.64] },
  // The ones that carry their own light are seen close; a shelf or a ceiling full of them gets the lighter model.
  lantern: (o) => ({ model: o.light === false ? 'lantern_lo' : 'lantern', fit: 'height', bulb: [0.5, 0.43, 0.5] }),
  clock: { model: 'wall_clock', fit: 'height', anchor: 'wall', live: false },
  laptop: { model: 'laptop', fit: 'width', live: false },
  caseKit: { model: 'toolbox', fit: 'width' },
  // The Fold (props3.js). A longcase clock keeps its own face, with the two minute hands; a flask keeps its cup.
  longcase: { model: 'grandfather_clock', fit: 'stretch' },
  flask: { model: 'thermos', fit: 'height' },
};

/** Models a list of props will want, so they can be fetched before the room is built. */
export function modelsFor(props) {
  const names = new Set();
  const visit = (p) => {
    const rule = DRESS[p.t];
    const spec = typeof rule === 'function' ? rule(p) : rule;
    if (spec) names.add(spec.model);
    if (p.t === 'lanternCluster' || p.t === 'shelf') names.add('lantern_lo');
    // Props that stand a model in themselves (a chess set on its table, a cake under its dome).
    for (const name of NESTED[p.t] ?? []) names.add(name);
    if (p.t === 'model' && p.m) names.add(p.m);
  };
  for (const p of props ?? []) visit(p);
  return [...names];
}

const tinted = new Map();
/** The model's own materials, multiplied by a colour (paint it darker, stain it, age it). */
function tint(material, hex) {
  const key = `${material.uuid}:${hex}`;
  if (!tinted.has(key)) {
    const m = material.clone();
    m.color.multiply(new THREE.Color(hex));
    tinted.set(key, m);
  }
  return tinted.get(key);
}

const prepared = new WeakSet();
function prepare(scene) {
  if (prepared.has(scene)) return;
  prepared.add(scene);
  scene.traverse((o) => {
    if (!o.isMesh) return;
    o.material.envMapIntensity = 0.7;
    // Shared between every copy in every room: never to be thrown away with one of them.
    o.geometry.userData.shared = true;
  });
}

const box = new THREE.Box3();
const part = new THREE.Box3();
const inverse = new THREE.Matrix4();
const matrix = new THREE.Matrix4();

/** The space taken up by the plain built parts of a prop, in the prop's own frame. Those parts are returned for removal. */
function builtBody(g) {
  g.updateMatrixWorld(true);
  inverse.copy(g.matrixWorld).invert();
  box.makeEmpty();
  const body = [];
  const isLive = (obj) => {
    for (let o = obj; o && o !== g; o = o.parent) if (o.userData.dyn) return true;
    return false;
  };
  g.traverse((obj) => {
    if (!obj.isMesh || isLive(obj)) return;
    obj.geometry.computeBoundingBox();
    part.copy(obj.geometry.boundingBox).applyMatrix4(matrix.multiplyMatrices(inverse, obj.matrixWorld));
    box.union(part);
    body.push(obj);
  });
  return body;
}

/**
 * Swap the built body of a prop for its model.
 * @param {THREE.Group} g the prop's group, already filled by its own function
 * @param {any} o the prop's options
 * @param {any} ctx builder context
 * @param {any} spec an entry of DRESS, resolved
 */
function dress(g, o, ctx, spec) {
  const prop = assets.prop(spec.model);
  if (!prop) return false;
  prepare(prop.scene);
  const body = builtBody(g);
  if (box.isEmpty()) return false;
  const want = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const floor = box.min.y;
  const top = box.max.y;
  const back = box.min.z;

  // Where the built lamp's light was, before anything is removed.
  let lamp = null;
  g.traverse((obj) => {
    if (!lamp && obj.isMesh && obj.material?.name?.startsWith?.('glow:')) lamp = obj;
  });
  const lampWas = lamp ? g.worldToLocal(lamp.getWorldPosition(new THREE.Vector3())) : null;

  for (const obj of body) {
    obj.geometry.dispose();
    obj.removeFromParent();
  }
  if (spec.live === false) {
    for (const child of [...g.children]) {
      if (child.isLight || child.isSprite) continue;
      const blob = child.isMesh && child.renderOrder === 1; // the contact shadow stays
      if (!blob) child.removeFromParent();
    }
  }

  const model = prop.scene.clone(true);
  model.userData.dyn = true; // not to be merged into the room's static geometry
  model.traverse((m) => {
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    if (spec.tint !== undefined) m.material = tint(m.material, spec.tint);
  });
  const holder = new THREE.Group();
  holder.userData.dyn = true;
  holder.add(model);
  if (spec.turn) model.rotation.y = (spec.turn * Math.PI) / 180;
  model.updateMatrixWorld(true);
  const own = new THREE.Box3().setFromObject(model);
  const size = own.getSize(new THREE.Vector3());
  const mid = own.getCenter(new THREE.Vector3());

  const scale = new THREE.Vector3(1, 1, 1);
  if (spec.fit === 'stretch') scale.set(want.x / size.x, want.y / size.y, want.z / size.z);
  else if (spec.fit === 'height') scale.setScalar(want.y / size.y);
  else if (spec.fit === 'width') scale.setScalar(want.x / size.x);
  if (spec.scale) scale.multiplyScalar(spec.scale);
  holder.scale.copy(scale);

  // Line the model's box up with the built one.
  const anchor = spec.anchor ?? 'floor';
  const x = centre.x - mid.x * scale.x;
  let y;
  let z = centre.z - mid.z * scale.z;
  if (anchor === 'ceiling') y = top - own.max.y * scale.y;
  else if (anchor === 'wall') {
    y = centre.y - mid.y * scale.y;
    z = back - own.min.z * scale.z;
  } else y = floor - own.min.y * scale.y;
  holder.position.set(x, y, z);
  g.add(holder);

  // Move whatever glows to where this model's bulb is.
  if (spec.bulb && lampWas) {
    const bulb = new THREE.Vector3(
      x + (own.min.x + size.x * spec.bulb[0]) * scale.x,
      y + (own.min.y + size.y * spec.bulb[1]) * scale.y,
      z + (own.min.z + size.z * spec.bulb[2]) * scale.z,
    );
    const shift = bulb.sub(lampWas);
    g.updateMatrixWorld(true);
    const moved = new Set();
    g.traverse((obj) => {
      if (obj === holder || obj === g) return;
      const live = obj.userData.dyn || obj.isLight || obj.isSprite;
      if (!live) return;
      for (let p = obj.parent; p && p !== g; p = p.parent) if (moved.has(p) || p === holder) return;
      const at = g.worldToLocal(obj.getWorldPosition(new THREE.Vector3())).add(shift);
      obj.position.copy(obj.parent.worldToLocal(g.localToWorld(at)));
      moved.add(obj);
    });
  }
  if (spec.spin) {
    const speed = o.speed ?? 1.2;
    ctx?.anim?.((t) => {
      model.rotation.y = t * speed;
    });
  }
  return true;
}

// Wrap every prop that has a model, so that it is dressed wherever it is made
// (a cluster of lanterns makes its own lanterns, for instance).
for (const [type, rule] of Object.entries(DRESS)) {
  const build = PROPS[type];
  if (!build) continue;
  PROPS[type] = (g, o, ctx) => {
    const meta = build(g, o, ctx);
    const spec = typeof rule === 'function' ? rule(o) : rule;
    if (spec && ctx?.dress !== false) {
      try {
        dress(g, o, ctx, spec);
      } catch (err) {
        console.warn(`could not dress ${type}`, err);
      }
    }
    return meta;
  };
}

/**
 * A model placed as it is: set dressing with no built counterpart.
 *   { t: 'model', m: 'kettle', p: [x, z], y: 0.78, r: 20, s: 1 }
 * Hung on a wall it takes { wall, at, y } like any other wall prop.
 * rx / rz (degrees) lay it over before it is turned: a magnifying glass flat on a desk.
 */
def('model', (g, o) => {
  const prop = assets.prop(o.m);
  if (!prop) return { c: null, h: 0 };
  prepare(prop.scene);
  const model = prop.scene.clone(true);
  model.userData.dyn = true;
  model.traverse((m) => {
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    if (o.tint !== undefined) m.material = tint(m.material, o.tint);
  });
  const [minX, minY, minZ] = prop.info.min;
  const [maxX, , maxZ] = prop.info.max;
  // Stand it on its base, centred, unless it is the kind of thing that hangs or is fixed to a wall.
  if (!o.wall && !o.hang) model.position.set(-(minX + maxX) / 2, -minY, -(minZ + maxZ) / 2);
  if (o.wall) g.position.y = o.y ?? 1.6;
  if (o.hang) g.position.y = o.hang;
  if (o.rx || o.rz) {
    const tip = new THREE.Group();
    tip.rotation.set(((o.rx ?? 0) * Math.PI) / 180, 0, ((o.rz ?? 0) * Math.PI) / 180);
    tip.add(model);
    g.add(tip);
  } else g.add(model);
  const w = maxX - minX;
  const d = maxZ - minZ;
  return { c: o.solid ? [w * (o.s ?? 1), d * (o.s ?? 1)] : null, h: 0 };
});
