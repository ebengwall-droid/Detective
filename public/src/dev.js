// Scene viewer for layout work: /dev.html?loc=precinct&x=0&z=3&yaw=0&pitch=0
// Not part of the game; it only builds a location and lets you look around.

import * as THREE from 'three';
import { SCENES } from '/core/cases/lamplighter/scenes.js';
import { buildScene } from './world/builder.js';
import { buildEnvironment } from './world/materials.js';
import { createCharacter } from './world/characters.js';
import { LOOKS } from '/core/cases/lamplighter/looks.js';

const params = new URLSearchParams(location.search);
const locId = params.get('loc') ?? 'precinct';
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
const spec = locId === 'stage' ? STAGE : SCENES[locId];
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('c'));
const info = document.getElementById('info');

async function main() {
  if (!spec) {
    info.textContent = `No scene "${locId}". Known: ${Object.keys(SCENES).join(', ')}`;
    return;
  }
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  } catch {}
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Number(params.get('dpr') ?? 1));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = params.get('shadows') !== '0';
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.environment = buildEnvironment(renderer);
  scene.environmentIntensity = 0.35;
  const built = buildScene(spec, { shadows: params.get('shadows') !== '0', maxLights: Number(params.get('lights') ?? 8) });
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
  if (locId === 'stage') {
    // Line the whole cast up twice: front row facing the camera, back row turned away.
    const ids = Object.keys(LOOKS);
    ids.forEach((id, i) => {
      for (const row of [0, 1]) {
        const ch = createCharacter(LOOKS[id]);
        ch.root.position.set((i - (ids.length - 1) / 2) * 1.05, 0, row ? -2.2 : -0.4);
        ch.root.rotation.y = row ? Math.PI : 0;
        scene.add(ch.root);
        people.push(ch);
      }
    });
  } else if (params.get('people')) {
    const samples = [
      { p: [-2.2, -2.4], r: 160, a: LOOKS.vance },
      { p: [5.2, -4.1], r: 0, a: LOOKS.hale },
      { p: [0.8, 2.4], r: 200, a: LOOKS.okoro },
    ];
    for (const s of samples) {
      const ch = createCharacter(s.a);
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
    for (const ch of people) ch.update(t, dt, { lookAt: camera.position, talking: false });
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
  window.__dev = {
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
