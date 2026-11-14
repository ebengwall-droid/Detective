// Tiny mesh-building helpers used by the prop library and scene builder.
// UVs are written in metres so one material tiles consistently on any size.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat } from './materials.js';

const DEG = Math.PI / 180;

function resolve(material) {
  return typeof material === 'string' ? mat(material) : material;
}

function place(mesh, parent, x, y, z, opts) {
  mesh.position.set(x, y, z);
  if (opts) {
    if (opts.rx) mesh.rotation.x = opts.rx * DEG;
    if (opts.ry) mesh.rotation.y = opts.ry * DEG;
    if (opts.rz) mesh.rotation.z = opts.rz * DEG;
    if (opts.dyn) mesh.userData.dyn = true;
    if (opts.noShadow) mesh.userData.noShadow = true;
    if (opts.name) mesh.name = opts.name;
  }
  if (parent) parent.add(mesh);
  return mesh;
}

/** Box centred on (x, y, z). */
export function box(parent, w, h, d, material, x = 0, y = 0, z = 0, opts) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const uv = geometry.attributes.uv;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z, four vertices each.
  const dims = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  return place(new THREE.Mesh(geometry, resolve(material)), parent, x, y, z, opts);
}

/** Cylinder (or cone/frustum) centred on (x, y, z). */
export function cyl(parent, rTop, rBottom, h, material, x = 0, y = 0, z = 0, seg = 12, opts) {
  const geometry = new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, !!opts?.open);
  const uv = geometry.attributes.uv;
  const circ = Math.PI * 2 * Math.max(rTop, rBottom, 0.01);
  const sideCount = (seg + 1) * 2;
  for (let i = 0; i < uv.count; i++) {
    if (i < sideCount) uv.setXY(i, uv.getX(i) * circ, uv.getY(i) * h);
    else uv.setXY(i, uv.getX(i) * rTop * 2, uv.getY(i) * rTop * 2);
  }
  return place(new THREE.Mesh(geometry, resolve(material)), parent, x, y, z, opts);
}

export function sph(parent, r, material, x = 0, y = 0, z = 0, seg = 10, opts) {
  const geometry = new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.7)));
  return place(new THREE.Mesh(geometry, resolve(material)), parent, x, y, z, opts);
}

/** Flat quad. Faces +Z by default; pass rx: -90 to lay it on the floor. */
export function plane(parent, w, h, material, x = 0, y = 0, z = 0, opts) {
  const geometry = new THREE.PlaneGeometry(w, h);
  if (!opts?.unitUv) {
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  }
  const m = resolve(material);
  return place(new THREE.Mesh(geometry, m), parent, x, y, z, opts);
}

/** Surface of revolution from [radius, height] pairs. */
export function lathe(parent, points, material, x = 0, y = 0, z = 0, seg = 14, opts) {
  const pts = points.map(([r, h]) => new THREE.Vector2(r, h));
  const geometry = new THREE.LatheGeometry(pts, seg);
  return place(new THREE.Mesh(geometry, resolve(material)), parent, x, y, z, opts);
}

export function torus(parent, r, tube, material, x = 0, y = 0, z = 0, opts) {
  const geometry = new THREE.TorusGeometry(r, tube, 6, opts?.seg ?? 16, opts?.arc ?? Math.PI * 2);
  return place(new THREE.Mesh(geometry, resolve(material)), parent, x, y, z, opts);
}

export function group(parent, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (ry) g.rotation.y = ry * DEG;
  if (parent) parent.add(g);
  return g;
}

/**
 * Collapse every static mesh under `root` into one mesh per material. A room
 * with sixty props goes from several hundred draw calls to a few dozen, which
 * is the difference between smooth and choppy on a phone.
 *
 * Meshes flagged `userData.dyn` (animated or individually addressable) and
 * anything that is not a plain Mesh are left in place.
 */
export function mergeStatic(root, { shadows = true } = {}) {
  root.updateMatrixWorld(true);
  const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  /** @type {Map<THREE.Material, { geos: THREE.BufferGeometry[], cast: boolean }>} */
  const buckets = new Map();
  const remove = [];

  const isDynamic = (obj) => {
    for (let o = obj; o && o !== root; o = o.parent) {
      if (o.userData.dyn) return true;
    }
    return false;
  };

  root.traverse((obj) => {
    if (!obj.isMesh || obj.isSkinnedMesh || obj.isInstancedMesh) return;
    if (Array.isArray(obj.material) || isDynamic(obj)) return;
    const g = obj.geometry;
    if (!g.attributes.position || !g.attributes.normal || !g.attributes.uv) return;
    let geometry = g.clone();
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') geometry.deleteAttribute(name);
    }
    if (!geometry.index) geometry = geometry.toNonIndexed();
    else geometry = geometry.toNonIndexed();
    const m = new THREE.Matrix4().multiplyMatrices(inverseRoot, obj.matrixWorld);
    geometry.applyMatrix4(m);
    let bucket = buckets.get(obj.material);
    if (!bucket) {
      bucket = { geos: [], cast: false };
      buckets.set(obj.material, bucket);
    }
    bucket.geos.push(geometry);
    if (!obj.userData.noShadow) bucket.cast = true;
    remove.push(obj);
  });

  for (const obj of remove) {
    obj.geometry.dispose();
    obj.removeFromParent();
  }
  for (const [material, bucket] of buckets) {
    const merged = mergeGeometries(bucket.geos, false);
    for (const g of bucket.geos) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = `merged:${material.name || 'material'}`;
    mesh.castShadow = shadows && bucket.cast && !material.transparent;
    mesh.receiveShadow = shadows;
    root.add(mesh);
  }
  // Drop the now-empty prop groups, except ones something still points at.
  const empties = [];
  root.traverse((obj) => {
    if (obj !== root && obj.isGroup && obj.children.length === 0 && !obj.userData.keep) empties.push(obj);
  });
  for (const obj of empties) obj.removeFromParent();
}

export { DEG };
