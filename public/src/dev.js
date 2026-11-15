// Scene viewer for layout work: /dev.html?loc=hall&x=0&z=3&yaw=0&pitch=0&people=1
// Not part of the game; it only builds a location and lets you look around.

import * as THREE from 'three';
import * as fold from '/core/cases/fold/scenes.js';
import { buildScene } from './world/builder.js';
import { buildEnvironment, useSurfaces } from './world/materials.js';
import { createCharacter } from './world/characters.js';
import { LOOKS } from '/core/cases/fold/looks.js';
import { check } from '/core/conditions.js';
import { assets } from './world/assets.js';
import { modelsFor } from './world/dress.js';
import { setNightView } from './world/glass.js';

const params = new URLSearchParams(location.search);
const { SCENES } = fold;
const locId = params.get('loc') ?? 'hall';
const STAGE = {
  size: [12, 7],
  height: 3,
  floor: 'floorWood',
  walls: 'wallTeal',
  ambient: { sky: 0x9fb4c4, ground: 0x4a3a2c, fog: 0x0d171c, hemi: 1.3, density: 0.01, exposure: 1.4 },
  props: [
    { t: 'pendant', p: [-3, 0.5], hang: 2.4, intensity: 22, distance: 12 },
    { t: 'pendant', p: [3, 0.5], hang: 2.4, intensity: 22, distance: 12 },
  ],
  spawn: { p: [0, 2.6], yaw: 0 },
};
const rawSpec = locId === 'stage' || locId === 'models' ? STAGE : SCENES[locId];
// Evaluate conditional props against a stand-in game state (?act=2).
const fakeState = { act: Number(params.get('act') ?? 2), facts: {}, evidence: {}, flags: {}, deductions: {}, records: {}, beats: {}, visited: {}, examined: {}, npcs: {}, marks: {}, jobsDone: {}, steps: 0 };
const spec = rawSpec && { ...rawSpec, props: (rawSpec.props ?? []).filter((p) => check(p.if, fakeState)) };
/**
 * Who stands where: ?people=kit:1.2:0.4:30,voss:0.5:-1:90:sit places people one by one (id:x:z:facing[:pose]);
 * ?people=1 puts the room's own people where its layout says they go (PLACES in scenes.js).
 */
function placed() {
  const asked = params.get('people') ?? '';
  if (!asked) return [];
  if (asked.includes(':')) {
    return asked.split(',').map((item) => {
      const [id, x, z, r, pose] = item.split(':');
      return { id, p: [Number(x), Number(z)], r: Number(r ?? 0), pose };
    }).filter((s) => LOOKS[s.id]);
  }
  return Object.entries(fold.PLACES?.[locId] ?? {}).map(([id, w]) => ({ id, ...w })).filter((s) => LOOKS[s.id]);
}
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('c'));
const info = document.getElementById('info');

async function main() {
  if (!spec) {
    info.textContent = `No scene "${locId}". Known: ${Object.keys(SCENES).join(', ')}`;
    return;
  }
  try {
    const faces = ['16px "Marcellus"', '16px "Special Elite"', '16px "Instrument Sans"', '700 16px "Instrument Sans"', '16px "JetBrains Mono"'];
    await Promise.race([Promise.all(faces.map((face) => document.fonts.load(face))), new Promise((r) => setTimeout(r, 2500))]);
  } catch {}
  // Modelled people, unless ?real=0 asks for the code-drawn ones.
  if (params.get('real') !== '0' && (await assets.init('/assets/'))) {
    // Only the people who will be shown: the whole cast on the stage, those placed in a room by ?people=.
    await assets.loadPeople(locId === 'stage' ? Object.keys(LOOKS) : placed().map((s) => s.id));
    await assets.loadProps(modelsFor(spec.props));
    if (await assets.loadSurfaces()) useSurfaces((name) => assets.surface(name));
    const night = await assets.loadNight();
    if (night) setNightView(night);
  }
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Number(params.get('dpr') ?? 1));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = params.get('shadows') !== '0';
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.environment = buildEnvironment(renderer);
  scene.environmentIntensity = 0.35;
  const photo = await assets.loadEnvironment();
  if (photo) {
    scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(photo).texture;
    scene.environmentIntensity = 0.42;
  }
  const built = buildScene(spec, { shadows: params.get('shadows') !== '0', maxLights: Number(params.get('lights') ?? 8), detail: Number(params.get('detail') ?? 1) });
  scene.add(built.root);
  scene.background = new THREE.Color(built.fog.color);
  scene.fog = new THREE.FogExp2(built.fog.color, built.fog.density);
  renderer.toneMappingExposure = Number(params.get('exp') ?? built.exposure);

  const camera = new THREE.PerspectiveCamera(Number(params.get('fov') ?? 68), innerWidth / innerHeight, 0.05, 80);
  const pos = { x: Number(params.get('x') ?? built.spawn.p[0]), z: Number(params.get('z') ?? built.spawn.p[1]), y: Number(params.get('y') ?? 1.62) };
  let yaw = (Number(params.get('yaw') ?? built.spawn.yaw ?? 0) * Math.PI) / 180;
  let pitch = (Number(params.get('pitch') ?? 0) * Math.PI) / 180;

  // Optional test characters: ?people=1
  const people = [];
  if (locId === 'models') {
    // Every furniture and prop model in a row, front toward the camera, a red block marking the front.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x998877, 1.6));
    const names = params.get('only')?.split(',') ?? Object.keys(assets.things?.models ?? {});
    await assets.loadProps(names);
    const gap = Number(params.get('gap') ?? 1.6);
    names.forEach((name, i) => {
      const prop = assets.prop(name);
      if (!prop) return;
      const obj = prop.scene.clone();
      obj.position.set((i - (names.length - 1) / 2) * gap, Number(params.get('lift') ?? 0), -0.6);
      scene.add(obj);
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), new THREE.MeshBasicMaterial({ color: 0xff3020 }));
      mark.position.set(obj.position.x, 0.01, obj.position.z + Math.max(0.3, prop.info.max[2] + 0.12));
      scene.add(mark);
    });
    window.__names = names;
  } else if (locId === 'stage') {
    // Line the whole cast up twice: front row facing the camera, back row turned away.
    // ?only=hale,vance shows just those, front row only.
    const only = params.get('only')?.split(',');
    const ids = only ?? Object.keys(LOOKS);
    ids.forEach((id, i) => {
      for (const row of only ? [0] : [0, 1]) {
        const ch = createCharacter({ ...LOOKS[id], pose: params.get('pose') ?? undefined, accessories: params.get('acc')?.split(',').filter(Boolean) ?? LOOKS[id].accessories });
        ch.root.position.set((i - (ids.length - 1) / 2) * 1.05, 0, row ? -2.2 : -0.4);
        ch.root.rotation.y = row ? Math.PI : 0;
        scene.add(ch.root);
        people.push(ch);
      }
    });
  } else if (params.get('people')) {
    for (const s of placed()) {
      const ch = createCharacter({ ...LOOKS[s.id], ...(s.pose ? { pose: s.pose } : {}) });
      ch.root.position.set(s.p[0], 0, s.p[1]);
      ch.root.rotation.y = (s.r * Math.PI) / 180;
      scene.add(ch.root);
      people.push(ch);
    }
  }

  const keys = new Set();
  addEventListener('keydown', (e) => keys.add(e.code));
  addEventListener('keyup', (e) => keys.delete(e.code));
  let dragging = false;
  canvas.addEventListener('pointerdown', () => (dragging = true));
  addEventListener('pointerup', () => (dragging = false));
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw -= e.movementX * 0.004;
    pitch = Math.max(-1.3, Math.min(1.3, pitch - e.movementY * 0.004));
  });
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  let last = performance.now();
  let t = 0;
  let frames = 0;
  const freeze = params.get('freeze');
  function step(dt) {
    t += dt;
    camera.position.set(pos.x, pos.y, pos.z);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    for (const fn of built.anims) fn(t, dt);
    for (const ch of people) ch.update(t, dt, { lookAt: params.get('look') === '0' ? null : camera.position, talking: params.get('talk') === '1', engaged: params.get('engaged') === '1', mood: params.get('mood') ?? 'calm', clip: window.__clip ?? params.get('clip') });
    renderer.render(scene, camera);
    const ri = renderer.info.render;
    info.textContent = `${locId}  x=${pos.x.toFixed(2)} z=${pos.z.toFixed(2)} yaw=${((yaw * 180) / Math.PI).toFixed(0)} pitch=${((pitch * 180) / Math.PI).toFixed(0)}\ncalls=${ri.calls} tris=${ri.triangles}`;
  }
  function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const speed = (keys.has('ShiftLeft') ? 6 : 2.5) * dt;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    if (keys.has('KeyW')) { pos.x += fx * speed; pos.z += fz * speed; }
    if (keys.has('KeyS')) { pos.x -= fx * speed; pos.z -= fz * speed; }
    if (keys.has('KeyA')) { pos.x += fz * speed; pos.z -= fx * speed; }
    if (keys.has('KeyD')) { pos.x -= fz * speed; pos.z += fx * speed; }
    if (keys.has('KeyQ')) pos.y -= speed;
    if (keys.has('KeyE')) pos.y += speed;
    step(dt);
    frames++;
    window.__ready = frames > 2;
    // ?freeze=1 stops the loop after a few frames so screenshots are cheap.
    if (!freeze || frames < 4) requestAnimationFrame(frame);
  }
  window.__people = people;
  window.__dev = {
    step,
    setCam(x, z, yawDeg, pitchDeg = 0, y = 1.62) {
      pos.x = x; pos.z = z; pos.y = y;
      yaw = (yawDeg * Math.PI) / 180;
      pitch = (pitchDeg * Math.PI) / 180;
      step(0.5);
      step(0.016);
    },
  };
  frame();
}

main().catch((err) => {
  console.error(err);
  info.textContent = String(err?.stack ?? err);
  window.__error = String(err?.stack ?? err);
});
