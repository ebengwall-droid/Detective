// Turns a location's scene description (plain data from the case file) into
// a lit three.js scene graph plus the collision and anchor data the game needs.

import * as THREE from 'three';
import { box, cyl, plane, group, mergeStatic, DEG } from './geo.js';
import { mat, glow, artMaterial, haloTexture, shaftTexture, mulberry32 } from './materials.js';
import { ART } from './art.js';
import { PROPS } from './props.js';
import { rainGlass } from './glass.js';
import './props2.js';
import './props3.js';
import './dress.js';

const WALL_T = 0.16;
/** Props that read `y` themselves (a height on the wall), so the builder must not also lift them. */
const SELF_Y = new Set(['clock', 'frame', 'caseBoard', 'plaque', 'sign', 'lifebuoy', 'shipWheel', 'anchor', 'sconce', 'dartboard', 'lightbox', 'porthole', 'barometer']);

/**
 * @typedef {Object} BuiltScene
 * @property {THREE.Group} root
 * @property {{minX:number,maxX:number,minZ:number,maxZ:number}[]} colliders
 * @property {{minX:number,maxX:number,minZ:number,maxZ:number}|null} bounds walkable rectangle
 * @property {{r:number}|null} round walkable circle for round rooms
 * @property {((t:number, dt:number) => void)[]} anims
 * @property {Map<string, {center: THREE.Vector3, size: THREE.Vector3}>} anchors
 * @property {{p:[number,number], yaw:number}} spawn
 * @property {number} height
 * @property {() => void} dispose
 */

/**
 * @param {any} spec scene description
 * @param {{ shadows?: boolean, maxLights?: number, shadowSize?: number }} [quality]
 * @returns {BuiltScene}
 */
export function buildScene(spec, quality = {}) {
  const root = new THREE.Group();
  root.name = 'location';
  const statics = group(root);
  statics.name = 'statics';
  const H = spec.height ?? 2.9;
  const isRound = spec.shape === 'round';
  const [W, D] = isRound ? [spec.radius * 2, spec.radius * 2] : spec.size;
  const rnd = mulberry32(hash(JSON.stringify(spec.size ?? spec.radius) + (spec.seed ?? '')));

  /** @type {BuiltScene['anims']} */
  const anims = [];
  /** Things the scene tells whoever is showing it. */
  const hooks = { lightning: null };
  /** @type {BuiltScene['colliders']} */
  const colliders = [];
  const anchors = new Map();
  /** @type {{ light: THREE.Light, weight: number, base: number }[]} */
  const lightRequests = [];
  const disposables = [];
  let shadowCaster = null;

  // ------------------------------------------------------------ rain glass
  let rainMat = null;
  const rainMaterial = () => {
    if (rainMat) return rainMat;
    // One sheet of glass for the room, so its windows share a view, a storm and a clock.
    rainMat = rainGlass({ tint: spec.ambient?.glass, turn: spec.ambient?.view, gain: spec.ambient?.night });
    disposables.push(rainMat);
    let flash = 0;
    let nextFlash = 6 + rnd() * 14;
    anims.push((t, dt) => {
      rainMat.tick(t);
      if (spec.ambient?.storm) {
        nextFlash -= dt;
        if (nextFlash <= 0) {
          flash = 1;
          nextFlash = 9 + Math.random() * 22;
          hooks.lightning?.();
        }
        if (flash > 0) {
          flash = Math.max(0, flash - dt * 2.6);
          // Two quick strokes, then the afterglow.
          const f = flash > 0.75 || (flash > 0.35 && flash < 0.5) ? 2.6 : 1 + flash;
          rainMat.strike(f - 1);
          if (moon) moon.intensity = moonBase * (1 + (f - 1) * 3);
          hemi.intensity = hemiBase * (1 + (f - 1) * 0.45);
        }
      }
    });
    return rainMat;
  };

  // ------------------------------------------------------------- prop ctx
  const ctx = {
    rnd,
    ceil: H,
    rainMaterial,
    anim(fn) {
      anims.push(fn);
    },
    /** Glowing sprite; reads as bloom around a lamp without a post pass. */
    halo(parent, color, size, x, y, z, opacity = 0.6) {
      const material = new THREE.SpriteMaterial({
        map: haloTexture(),
        color,
        transparent: true,
        // With the finishing pass the lamp itself blooms; the painted halo only adds a little air.
        opacity: quality.post ? opacity * 0.3 : opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      disposables.push(material);
      const sprite = new THREE.Sprite(material);
      sprite.scale.setScalar(size);
      sprite.position.set(x, y, z);
      sprite.userData.dyn = true;
      parent.add(sprite);
      return sprite;
    },
    /** A cone of lit air under a lamp. Cheap, and it is most of what makes a room feel like it has atmosphere. */
    beam(parent, { x = 0, y = 0, z = 0, top = 0.08, bottom = 0.9, h = 1.6, color = 0xffb45e, opacity = 0.11 } = {}) {
      if (!quality.detail) return null;
      const geometry = new THREE.CylinderGeometry(top, bottom, h, 28, 1, true);
      // Lit air has no skin: brightest where you look through the most of it, gone at the edges.
      const material = new THREE.ShaderMaterial({
        uniforms: { tint: { value: new THREE.Color(color) }, strength: { value: opacity * 1.7 } },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          varying float vDown;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalMatrix * normal;
            vView = -mv.xyz;
            vDown = 1.0 - uv.y;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 tint;
          uniform float strength;
          varying vec3 vNormal;
          varying vec3 vView;
          varying float vDown;
          void main() {
            float facing = abs(dot(normalize(vNormal), normalize(vView)));
            float body = pow(facing, 1.7);
            float fall = pow(1.0 - vDown, 1.5) * smoothstep(0.0, 0.06, vDown);
            gl_FragColor = vec4(tint * strength * body * fall, 1.0);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      disposables.push(geometry, material);
      const cone = new THREE.Mesh(geometry, material);
      cone.position.set(x, y - h / 2, z);
      cone.userData.dyn = true;
      cone.userData.noShadow = true;
      cone.renderOrder = 3;
      parent.add(cone);
      return cone;
    },
    light(parent, o) {
      let light;
      if (o.spot) {
        light = new THREE.SpotLight(o.color, o.intensity, o.distance ?? 0, o.spot.angle ?? 0.6, o.spot.penumbra ?? 0.5, 2);
        const target = new THREE.Object3D();
        target.position.set(...(o.spot.target ?? [0, 0, 0]));
        target.userData.dyn = true;
        parent.add(target);
        light.target = target;
      } else {
        light = new THREE.PointLight(o.color, o.intensity, o.distance ?? 0, 2);
      }
      light.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
      light.userData.dyn = true;
      parent.add(light);
      if (o.shadow && quality.shadows !== false && !shadowCaster && o.spot) {
        shadowCaster = light;
        light.castShadow = true;
        light.shadow.mapSize.setScalar(quality.shadowSize ?? 1024);
        light.shadow.bias = -0.0015;
        light.shadow.normalBias = 0.02;
        light.shadow.camera.near = 0.3;
        light.shadow.camera.far = o.distance || 12;
      }
      const base = o.intensity;
      lightRequests.push({ light, weight: o.intensity * (o.spot ? 0.5 : 1), base });
      if (o.flicker) {
        const phase = rnd() * 100;
        const amt = o.flicker;
        if (o.buzz) {
          // Failing fluorescent tube: mostly steady with sudden dropouts.
          let drop = 0;
          anims.push((t, dt) => {
            if (drop > 0) drop -= dt;
            else if (Math.random() < dt * 0.35) drop = 0.05 + Math.random() * 0.18;
            light.intensity = base * (drop > 0 ? 0.25 : 1 - amt * 0.08 * Math.sin(t * 50 + phase));
          });
        } else {
          anims.push((t) => {
            light.intensity = base * (1 - amt * 0.5 + amt * (0.5 * Math.sin(t * 7.3 + phase) + 0.3 * Math.sin(t * 17.1 + phase * 2) + 0.2 * Math.sin(t * 2.9 + phase)) * 0.5);
          });
        }
      }
      return light;
    },
  };

  // --------------------------------------------------------- room envelope
  const floorMat = spec.floor ?? 'floorWood';
  const wallMat = spec.walls ?? 'wallTeal';
  const ceilMat = spec.ceiling ?? 'ceiling';
  let bounds = null;
  let round = null;

  if (isRound) {
    buildRoundRoom(statics, spec, H, ctx);
    round = { r: spec.radius - 0.42 };
  } else {
    box(statics, W + WALL_T * 2, 0.1, D + WALL_T * 2, floorMat, 0, -0.05, 0);
    box(statics, W + WALL_T * 2, 0.1, D + WALL_T * 2, ceilMat, 0, H + 0.05, 0);
    const openingsFor = (side) => [
      ...(spec.windows ?? []).filter((w) => w.wall === side).map((w) => ({ ...w, kind: 'window' })),
      ...(spec.doorways ?? []).filter((w) => w.wall === side).map((w) => ({ sill: 0, h: 2.1, w: 1.0, ...w, kind: 'door' })),
    ];
    const walls = [
      { side: 'n', len: W, x: 0, z: -D / 2 - WALL_T / 2, ry: 0, flip: 1 },
      { side: 's', len: W, x: 0, z: D / 2 + WALL_T / 2, ry: 180, flip: -1 },
      { side: 'e', len: D, x: W / 2 + WALL_T / 2, z: 0, ry: -90, flip: 1 },
      { side: 'w', len: D, x: -W / 2 - WALL_T / 2, z: 0, ry: 90, flip: -1 },
    ];
    for (const wl of walls) {
      const wg = group(statics, wl.x, 0, wl.z, wl.ry);
      const sideMat = spec.wallMats?.[wl.side] ?? wallMat;
      const ops = openingsFor(wl.side).map((o) => ({ ...o, at: o.at * wl.flip }));
      buildWall(wg, wl.len + WALL_T * 2, H, sideMat, ops, spec, ctx, { skirting: spec.skirting, wainscot: spec.wainscot });
    }
    bounds = { minX: -W / 2, maxX: W / 2, minZ: -D / 2, maxZ: D / 2 };
  }

  // Interior partitions (axis-aligned), with optional door gaps.
  for (const part of spec.interior ?? []) {
    const [ax, az] = part.from;
    const [bx, bz] = part.to;
    const horizontal = Math.abs(az - bz) < 1e-6;
    const len = horizontal ? Math.abs(bx - ax) : Math.abs(bz - az);
    const cx = (ax + bx) / 2;
    const cz = (az + bz) / 2;
    const wg = group(statics, cx, 0, cz, horizontal ? 0 : 90);
    const gaps = (part.gaps ?? []).map((gp) => ({ at: gp.at, w: gp.w ?? 1.0, h: gp.h ?? 2.1, sill: 0, kind: 'door' }));
    buildWall(wg, len, part.h ?? H, part.mat ?? wallMat, gaps, spec, ctx, { thickness: part.t ?? 0.12, bothSides: true });
    // Colliders for each solid stretch.
    let cursor = -len / 2;
    const sorted = [...gaps].sort((a, b) => a.at - b.at);
    const spans = [];
    for (const gp of sorted) {
      spans.push([cursor, gp.at - gp.w / 2]);
      cursor = gp.at + gp.w / 2;
    }
    spans.push([cursor, len / 2]);
    for (const [s0, s1] of spans) {
      if (s1 - s0 < 0.05) continue;
      const t = (part.t ?? 0.12) / 2 + 0.02;
      if (horizontal) colliders.push({ minX: cx + s0, maxX: cx + s1, minZ: cz - t, maxZ: cz + t });
      else colliders.push({ minX: cx - t, maxX: cx + t, minZ: cz - s1, maxZ: cz - s0 });
    }
  }

  // ----------------------------------------------------------------- props
  const wallPlacement = (p) => {
    if (!p.wall) return null;
    const inset = 0.004;
    switch (p.wall) {
      case 'n': return { x: p.at, z: -D / 2 + inset, r: 0 };
      case 's': return { x: p.at, z: D / 2 - inset, r: 180 };
      case 'e': return { x: W / 2 - inset, z: p.at, r: -90 };
      case 'w': return { x: -W / 2 + inset, z: p.at, r: 90 };
      default: return null;
    }
  };

  for (const p of spec.props ?? []) {
    const factory = PROPS[p.t];
    if (!factory) {
      console.warn(`Unknown prop type: ${p.t}`);
      continue;
    }
    const wp = wallPlacement(p);
    const x = wp ? wp.x : p.p[0];
    const z = wp ? wp.z : p.p[1];
    const r = (wp ? wp.r : 0) + (p.r ?? 0);
    const g = group(statics, x, wp || SELF_Y.has(p.t) ? 0 : p.y ?? 0, z, r);
    if (p.s && p.t !== 'lantern' && p.t !== 'safe' && p.t !== 'crate' && p.t !== 'barrel' && p.t !== 'bodyOutline') g.scale.setScalar(p.s);
    const meta = factory(g, p, ctx) ?? {};
    if (meta.c && p.solid !== false) {
      const [cw, cd] = meta.c;
      const rad = r * DEG;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const hw = (cw * cos + cd * sin) / 2;
      const hd = (cw * sin + cd * cos) / 2;
      colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });
    }
    if (p.id) {
      g.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(g);
      if (bb.isEmpty()) bb.setFromCenterAndSize(new THREE.Vector3(x, (p.y ?? 0) + 0.2, z), new THREE.Vector3(0.3, 0.3, 0.3));
      anchors.set(p.id, { center: bb.getCenter(new THREE.Vector3()), size: bb.getSize(new THREE.Vector3()) });
    }
  }

  // Extra lights declared directly on the scene.
  for (const l of spec.lights ?? []) {
    ctx.light(root, { color: l.color ?? 0xffb45e, intensity: l.intensity ?? 4, distance: l.distance ?? 8, x: l.p[0], y: l.p[1], z: l.p[2], flicker: l.flicker, spot: l.spot, shadow: l.shadow });
  }

  // -------------------------------------------------------- ambient + moon
  const amb = spec.ambient ?? {};
  const hemi = new THREE.HemisphereLight(amb.sky ?? 0x5a7890, amb.ground ?? 0x241a12, amb.hemi ?? 0.55);
  const hemiBase = hemi.intensity;
  root.add(hemi);

  let moon = null;
  let moonBase = 0;
  if (amb.moon && quality.shadows !== false) {
    const m = amb.moon;
    moon = new THREE.DirectionalLight(m.color ?? 0x9fc4dc, m.intensity ?? 1.6);
    moonBase = moon.intensity;
    const dir = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[m.from ?? 'n'];
    const reach = Math.max(W, D) * 0.9 + 4;
    const elev = (m.elevation ?? 34) * DEG;
    const skew = m.skew ?? 0.35;
    moon.position.set(dir[0] * reach * Math.cos(elev) + dir[1] * reach * skew, reach * Math.sin(elev), dir[1] * reach * Math.cos(elev) + dir[0] * reach * skew);
    moon.target.position.set(0, 0, 0);
    root.add(moon, moon.target);
    if (!shadowCaster) {
      shadowCaster = moon;
      moon.castShadow = true;
      const size = quality.shadowSize ?? 2048;
      moon.shadow.mapSize.setScalar(size);
      const ext = Math.max(W, D) * 0.75 + 1;
      Object.assign(moon.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 0.5, far: reach * 2.4 });
      moon.shadow.bias = -0.0006;
      moon.shadow.normalBias = 0.03;
    }
  }

  // ------------------------------------------------------------ atmosphere
  if (quality.detail) {
    // Moonlight through the windows as visible shafts of lit air.
    if (moon && !isRound) {
      const side = amb.moon.from ?? 'n';
      const dir = moon.position.clone().normalize().negate();
      const material = new THREE.MeshBasicMaterial({ map: shaftTexture(true), color: amb.moon.color ?? 0x9fc4dc, transparent: true, opacity: 0.085, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
      disposables.push(material);
      const sheet = (a, b) => {
        // A flat sheet of light from the segment a-b at the glass, carried along the light until it reaches the floor.
        const len = Math.min(6, Math.max(a.y, b.y) / Math.max(0.15, -dir.y));
        const c = a.clone().addScaledVector(dir, len);
        const d = b.clone().addScaledVector(dir, len);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z], 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2));
        geometry.setIndex([0, 2, 1, 1, 2, 3]);
        disposables.push(geometry);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.dyn = true;
        mesh.renderOrder = 3;
        mesh.frustumCulled = false;
        root.add(mesh);
      };
      for (const w of (spec.windows ?? []).filter((x) => x.wall === side)) {
        const sill = w.sill ?? 0.9;
        const h = w.h ?? 1.2;
        const hw = (w.w ?? 1.2) / 2;
        const inset = 0.06;
        const at = (u, y) => {
          switch (side) {
            case 'n': return new THREE.Vector3(w.at + u, y, -D / 2 + inset);
            case 's': return new THREE.Vector3(w.at + u, y, D / 2 - inset);
            case 'e': return new THREE.Vector3(W / 2 - inset, y, w.at + u);
            default: return new THREE.Vector3(-W / 2 + inset, y, w.at + u);
          }
        };
        sheet(at(-hw, sill + h * 0.82), at(hw, sill + h * 0.82));
        sheet(at(-hw, sill + h * 0.35), at(hw, sill + h * 0.35));
        sheet(at(0, sill + h * 0.05), at(0, sill + h * 0.95));
      }
      anims.push((t) => {
        material.opacity = 0.085 * (0.86 + 0.14 * Math.sin(t * 0.5));
      });
    }

    // Dust hanging in the air, catching whatever light there is.
    const count = quality.detail > 1 ? 260 : 130;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    const reach = isRound ? (spec.radius ?? 3) * 0.62 : 0;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = isRound ? (rnd() * 2 - 1) * reach : (rnd() - 0.5) * (W - 0.6);
      positions[i * 3 + 1] = 0.35 + rnd() * (H - 0.7);
      positions[i * 3 + 2] = isRound ? (rnd() * 2 - 1) * reach : (rnd() - 0.5) * (D - 0.6);
      seeds[i * 3] = rnd();
      seeds[i * 3 + 1] = rnd();
      seeds[i * 3 + 2] = rnd();
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dustGeometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 3));
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, scale: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float time;
        uniform float scale;
        attribute vec3 seed;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(time * 0.11 + seed.x * 6.283) * 0.28;
          p.y += sin(time * 0.07 + seed.y * 6.283) * 0.2;
          p.z += cos(time * 0.09 + seed.z * 6.283) * 0.28;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp((3.5 + seed.y * 5.0) * scale / max(0.3, -mv.z), 1.0, 6.0);
          // Twinkle, and thin out right in front of the lens.
          vAlpha = (0.25 + 0.75 * seed.x) * (0.6 + 0.4 * sin(time * 0.8 + seed.z * 40.0)) * smoothstep(0.35, 1.3, -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(vec3(1.0, 0.9, 0.74) * smoothstep(0.5, 0.0, d) * vAlpha * 0.2, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(dustGeometry, dustMaterial);
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    dust.frustumCulled = false;
    dust.userData.dyn = true;
    root.add(dust);
    anims.push((t) => {
      dustMaterial.uniforms.time.value = t;
    });
  }

  // Keep only the strongest lights; each extra point light costs every pixel.
  const maxLights = quality.maxLights ?? 8;
  lightRequests.sort((a, b) => b.weight - a.weight);
  for (let i = maxLights; i < lightRequests.length; i++) {
    const { light } = lightRequests[i];
    if (light === shadowCaster) continue;
    light.removeFromParent();
    light.intensity = 0;
  }

  mergeStatic(statics, { shadows: quality.shadows !== false });

  const spawn = spec.spawn ?? { p: [0, D / 2 - 1], yaw: 0 };

  return {
    root,
    colliders,
    bounds,
    round,
    anims,
    hooks,
    anchors,
    spawn,
    height: H,
    fog: { color: amb.fog ?? 0x0a1216, density: amb.density ?? 0.03 },
    exposure: amb.exposure ?? 1.15,
    dispose() {
      root.traverse((obj) => {
        if (obj.isMesh && !obj.geometry.userData.shared) obj.geometry.dispose();
        if (obj.isLight && obj.shadow?.map) obj.shadow.map.dispose();
      });
      for (const d of disposables) d.dispose();
    },
  };
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Build one straight wall in its own local frame: it runs along X, centred on
 * the origin, with the room on the +Z side. Openings are cut out as gaps and
 * windows get a frame and rain-streaked glass.
 */
function buildWall(g, len, H, material, openings, spec, ctx, opts = {}) {
  const t = opts.thickness ?? WALL_T;
  const sorted = [...openings].sort((a, b) => a.at - b.at);
  let cursor = -len / 2;
  const solid = (x0, x1, y0, y1) => {
    const w = x1 - x0;
    const h = y1 - y0;
    if (w < 0.01 || h < 0.01) return;
    box(g, w, h, t, material, (x0 + x1) / 2, (y0 + y1) / 2, 0);
  };
  for (const o of sorted) {
    const x0 = o.at - o.w / 2;
    const x1 = o.at + o.w / 2;
    const sill = o.sill ?? 0.95;
    const top = Math.min(H, sill + (o.h ?? 1.4));
    solid(cursor, x0, 0, H);
    solid(x0, x1, 0, sill);
    solid(x0, x1, top, H);
    cursor = x1;
    if (o.kind === 'window') buildWindow(g, o, sill, top, t, ctx);
    else if (o.kind === 'door' && o.dark !== false) {
      // A doorway onto darkness beyond.
      box(g, o.w, top - sill, 0.02, 'dark', o.at, (sill + top) / 2, -t / 2 - 0.4, { noShadow: true });
      box(g, 0.02, top - sill, 0.4, 'dark', x0 - 0.01, (sill + top) / 2, -t / 2 - 0.2, { noShadow: true });
      box(g, 0.02, top - sill, 0.4, 'dark', x1 + 0.01, (sill + top) / 2, -t / 2 - 0.2, { noShadow: true });
    }
  }
  solid(cursor, len / 2, 0, H);

  const trimSides = opts.bothSides ? [1, -1] : [1];
  for (const s of trimSides) {
    const z = s * (t / 2 + 0.012);
    if (opts.skirting !== false) {
      // Skirting board, broken at doorways.
      let c2 = -len / 2;
      for (const o of sorted.filter((q) => (q.sill ?? 0.95) < 0.12)) {
        if (o.at - o.w / 2 - c2 > 0.02) box(g, o.at - o.w / 2 - c2, 0.12, 0.024, spec.trim ?? 'woodBlack', (c2 + o.at - o.w / 2) / 2, 0.06, z);
        c2 = o.at + o.w / 2;
      }
      if (len / 2 - c2 > 0.02) box(g, len / 2 - c2, 0.12, 0.024, spec.trim ?? 'woodBlack', (c2 + len / 2) / 2, 0.06, z);
    }
    if (opts.wainscot && s === 1) {
      const wh = opts.wainscot.h ?? 1.0;
      let c3 = -len / 2;
      const cuts = sorted.filter((q) => (q.sill ?? 0.95) < wh);
      for (const o of cuts) {
        if (o.at - o.w / 2 - c3 > 0.02) {
          box(g, o.at - o.w / 2 - c3, wh, 0.02, opts.wainscot.mat ?? 'wallPanel', (c3 + o.at - o.w / 2) / 2, wh / 2, z - 0.002);
          box(g, o.at - o.w / 2 - c3, 0.04, 0.034, spec.trim ?? 'woodBlack', (c3 + o.at - o.w / 2) / 2, wh + 0.02, z);
        }
        c3 = o.at + o.w / 2;
      }
      if (len / 2 - c3 > 0.02) {
        box(g, len / 2 - c3, wh, 0.02, opts.wainscot.mat ?? 'wallPanel', (c3 + len / 2) / 2, wh / 2, z - 0.002);
        box(g, len / 2 - c3, 0.04, 0.034, spec.trim ?? 'woodBlack', (c3 + len / 2) / 2, wh + 0.02, z);
      }
    }
  }
}

function buildWindow(g, o, sill, top, t, ctx) {
  const w = o.w;
  const h = top - sill;
  const frame = o.frame ?? 'woodBlack';
  const cy = (sill + top) / 2;
  plane(g, w, h, ctx.rainMaterial(), o.at, cy, -t / 2 + 0.02, { dyn: true });
  box(g, w + 0.1, 0.06, t + 0.06, frame, o.at, sill - 0.03, 0.02);
  box(g, w + 0.1, 0.05, t + 0.02, frame, o.at, top + 0.025, 0);
  box(g, 0.05, h, t + 0.02, frame, o.at - w / 2 - 0.025, cy, 0);
  box(g, 0.05, h, t + 0.02, frame, o.at + w / 2 + 0.025, cy, 0);
  const cols = o.cols ?? Math.max(1, Math.round(w / 0.6));
  const rows = o.rows ?? Math.max(1, Math.round(h / 0.75));
  for (let i = 1; i < cols; i++) box(g, 0.03, h, 0.04, frame, o.at - w / 2 + (w * i) / cols, cy, -t / 2 + 0.04);
  for (let i = 1; i < rows; i++) box(g, w, 0.03, 0.04, frame, o.at, sill + (h * i) / rows, -t / 2 + 0.04);
  if (o.blinds) {
    const bg = group(g, o.at, 0, t / 2);
    PROPS.blinds(bg, { w: w + 0.04, h: h + 0.05, sill, open: o.blinds === true ? 1 : o.blinds }, ctx);
  }
}

/** The lighthouse lantern room: a drum of storm panes over a stone parapet. */
function buildRoundRoom(g, spec, H, ctx) {
  const R = spec.radius;
  const seg = spec.panes ?? 16;
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.2, R + 0.2, 0.1, 40), mat(spec.floor ?? 'floorPlanks'));
  floor.position.y = -0.05;
  // Cylinder caps carry 0..1 UVs; scale them to metres for the plank texture.
  const fuv = floor.geometry.attributes.uv;
  for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * R * 2, fuv.getY(i) * R * 2);
  g.add(floor);
  const parapet = spec.parapet ?? 0.95;
  const rail = spec.walls ?? 'iron';
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const chord = 2 * R * Math.sin(Math.PI / seg) + 0.02;
    const x = Math.cos(am) * R * Math.cos(Math.PI / seg);
    const z = Math.sin(am) * R * Math.cos(Math.PI / seg);
    const ry = (-am * 180) / Math.PI - 90;
    const pg = group(g, x, 0, z, ry);
    // Local +Z now points at the centre of the room.
    box(pg, chord, parapet, 0.14, rail, 0, parapet / 2, -0.07);
    box(pg, chord, 0.05, 0.2, 'brassDull', 0, parapet + 0.025, -0.06);
    const isDoor = (spec.doorPanes ?? []).includes(i);
    const paneH = H - parapet - 0.3;
    plane(pg, chord - 0.06, paneH, ctx.rainMaterial(), 0, parapet + 0.05 + paneH / 2, -0.06, { dyn: true });
    box(pg, 0.06, H - parapet, 0.08, 'iron', -chord / 2, parapet + (H - parapet) / 2, -0.06);
    box(pg, chord, 0.3, 0.14, 'iron', 0, H - 0.15, -0.07);
    box(pg, chord - 0.06, 0.03, 0.05, 'iron', 0, parapet + 0.05 + paneH * 0.5, -0.05);
    if (isDoor) {
      box(pg, 0.05, paneH, 0.06, 'brassDull', chord / 2 - 0.12, parapet + paneH / 2, -0.04);
      box(pg, 0.03, 0.12, 0.05, 'brass', chord / 2 - 0.2, parapet + 0.25, -0.02);
    }
  }
  // Conical roof with ribs.
  const roof = new THREE.Mesh(new THREE.ConeGeometry(R + 0.25, 1.5, seg, 1, true), mat(spec.ceiling ?? 'iron'));
  roof.material.side = THREE.DoubleSide;
  roof.position.y = H + 0.75;
  roof.userData.dyn = true;
  g.add(roof);
  for (let i = 0; i < seg; i += 2) {
    const a = (i / seg) * Math.PI * 2;
    const rib = cyl(g, 0.02, 0.02, Math.hypot(R, 1.5), 'brassDull', (Math.cos(a) * R) / 2, H + 0.72, (Math.sin(a) * R) / 2, 5);
    rib.rotation.set(0, -a, Math.atan2(R, 1.5), 'YXZ');
  }
}

export { glow };
