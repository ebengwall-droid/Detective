// Low-poly people, assembled from primitives and animated procedurally.
// Appearance comes from the case file, so the same code draws every character.

import * as THREE from 'three';
import { mat, blobShadowMaterial } from './materials.js';

const matCache = new Map();
function color(hex, rough = 0.85, metal = 0) {
  const key = `${hex}:${rough}:${metal}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: metal });
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

const BUILD = {
  slim: { w: 0.9, d: 0.9 },
  medium: { w: 1, d: 1 },
  heavy: { w: 1.22, d: 1.3 },
};

/**
 * @typedef {Object} Appearance
 * @property {number} [height] scale, 1 = about 1.75 m
 * @property {'slim'|'medium'|'heavy'} [build]
 * @property {string} [skin]
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
 * @property {string[]} [accessories] cane | whistle | whistleCord | clipboard | towel | notepad | badge
 * @property {'stand'|'sit'|'bound'|'lean'} [pose]
 */

/**
 * @param {Appearance} a
 * @returns {{ root: THREE.Group, update: (t: number, dt: number, s: {lookAt?: THREE.Vector3|null, talking?: boolean, mood?: string}) => void, headHeight: number, setAccessories: (list: string[]) => void }}
 */
export function createCharacter(a = {}) {
  const root = new THREE.Group();
  const scale = a.height ?? 1;
  const build = BUILD[a.build ?? 'medium'];
  const pose = a.pose ?? 'stand';
  const skin = color(a.skin ?? '#c99b7c', 0.75);
  const coatLen = a.coat?.length ?? 'jacket';
  const coatColor = a.coat?.color ?? '#2c3138';
  const coat = color(coatColor, 0.9);
  const shirt = color(a.shirt ?? '#c9c4b8', 0.9);
  const trousers = color(a.trousers ?? '#22252a', 0.9);
  const shoes = color(a.shoes ?? '#15120f', 0.6);

  const body = new THREE.Group();
  root.add(body);
  body.scale.setScalar(scale);

  // --- legs -------------------------------------------------------------
  const hipY = 0.84;
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.09 * build.w, hipY, 0);
    body.add(hip);
    const upper = mesh(hip, new THREE.CylinderGeometry(0.082 * build.w, 0.07 * build.w, 0.42, 8), trousers, 0, -0.21, 0);
    const knee = new THREE.Group();
    knee.position.set(0, -0.42, 0);
    hip.add(knee);
    mesh(knee, new THREE.CylinderGeometry(0.068 * build.w, 0.055 * build.w, 0.4, 8), trousers, 0, -0.2, 0);
    mesh(knee, new THREE.BoxGeometry(0.1, 0.07, 0.25), shoes, 0, -0.4, 0.05);
    legs.push({ hip, knee, upper });
  }

  // --- torso ------------------------------------------------------------
  const torso = new THREE.Group();
  torso.position.y = hipY - 0.06;
  body.add(torso);
  const longCoat = coatLen === 'long' || coatLen === 'labcoat' || coatLen === 'dress';
  const skirtY = coatLen === 'dress' ? -0.52 : longCoat ? -0.42 : -0.04;
  const profile = [];
  if (longCoat) profile.push([0.2, skirtY], [0.185, -0.1]);
  profile.push([0.172, -0.02], [0.185, 0.2], [0.2, 0.42], [0.19, 0.56], [0.12, 0.64], [0.055, 0.67]);
  const torsoMat = coatLen === 'vest' ? shirt : coat;
  const torsoMesh = mesh(torso, new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 12), torsoMat);
  torsoMesh.scale.set(build.w, 1, 0.68 * build.d);
  if (longCoat) torsoMesh.material = torsoMesh.material.clone();
  if (longCoat) torsoMesh.material.side = THREE.DoubleSide;

  // Shirt front / lapels / vest details.
  if (coatLen === 'vest') {
    const vest = mesh(torso, new THREE.LatheGeometry([[0.176, 0], [0.19, 0.2], [0.204, 0.42], [0.19, 0.52]].map(([r, y]) => new THREE.Vector2(r, y)), 12), coat);
    vest.scale.set(build.w, 1, 0.69 * build.d);
  } else if (coatLen !== 'cardigan' || a.coat?.open) {
    mesh(torso, new THREE.BoxGeometry(0.11, 0.34, 0.02), shirt, 0, 0.44, 0.128 * build.d);
  }
  if (coatLen === 'apron') {
    mesh(torso, new THREE.BoxGeometry(0.3 * build.w, 0.62, 0.02), color('#b9b4a6'), 0, 0.14, 0.135 * build.d);
    mesh(torso, new THREE.BoxGeometry(0.2 * build.w, 0.2, 0.02), color('#b9b4a6'), 0, 0.5, 0.13 * build.d);
  }
  if (coatLen === 'labcoat' || (longCoat && a.coat?.open)) {
    mesh(torso, new THREE.BoxGeometry(0.1, 0.72, 0.02), coatLen === 'labcoat' ? color(a.shirt ?? '#5f7f86') : shirt, 0, 0.08, 0.135 * build.d);
  }
  if (a.tie) {
    mesh(torso, new THREE.BoxGeometry(0.045, 0.3, 0.012), color(a.tie), 0, 0.43, 0.142 * build.d);
    mesh(torso, new THREE.BoxGeometry(0.06, 0.05, 0.02), color(a.tie), 0, 0.6, 0.13 * build.d);
  }
  if (a.scarf) {
    const sc = mesh(torso, new THREE.TorusGeometry(0.085, 0.035, 6, 12), color(a.scarf), 0, 0.66, 0);
    sc.rotation.x = Math.PI / 2;
    mesh(torso, new THREE.BoxGeometry(0.08, 0.3, 0.03), color(a.scarf), 0.05, 0.5, 0.13 * build.d);
  }

  // --- arms -------------------------------------------------------------
  const arms = [];
  for (const sx of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * 0.192 * build.w, 0.56, 0);
    torso.add(shoulder);
    mesh(shoulder, new THREE.SphereGeometry(0.064 * build.w, 8, 6), torsoMat === shirt ? shirt : coat);
    const upper = mesh(shoulder, new THREE.CylinderGeometry(0.058 * build.w, 0.05 * build.w, 0.3, 7), torsoMat === shirt ? shirt : coat, 0, -0.15, 0);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.3, 0);
    shoulder.add(elbow);
    mesh(elbow, new THREE.CylinderGeometry(0.05 * build.w, 0.042 * build.w, 0.27, 7), torsoMat === shirt ? shirt : coat, 0, -0.135, 0);
    const hand = mesh(elbow, new THREE.SphereGeometry(0.045, 7, 6), skin, 0, -0.3, 0);
    shoulder.rotation.z = sx * 0.09;
    arms.push({ shoulder, elbow, hand, upper, side: sx });
  }

  // --- head -------------------------------------------------------------
  const neck = new THREE.Group();
  neck.position.y = 0.67;
  torso.add(neck);
  mesh(neck, new THREE.CylinderGeometry(0.048, 0.055, 0.1, 8), skin, 0, 0.04, 0);
  const head = new THREE.Group();
  head.position.y = 0.1;
  neck.add(head);
  const skull = mesh(head, new THREE.SphereGeometry(0.112, 14, 12), skin, 0, 0.1, 0);
  skull.scale.set(0.94, 1.12, 1);
  // Jaw gives the head a face-forward shape.
  const jaw = mesh(head, new THREE.SphereGeometry(0.085, 10, 8), skin, 0, 0.035, 0.022);
  jaw.scale.set(0.95, 0.8, 0.95);
  const eyeMat = color('#15120f', 0.3);
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = mesh(head, new THREE.SphereGeometry(0.0135, 6, 5), eyeMat, sx * 0.04, 0.112, 0.1);
    eyes.push(eye);
    const brow = mesh(head, new THREE.BoxGeometry(0.04, 0.008, 0.012), color(a.hair?.color ?? '#2a2018'), sx * 0.04, 0.138, 0.102);
    brow.rotation.z = -sx * 0.12;
    mesh(head, new THREE.SphereGeometry(0.018, 5, 4), skin, sx * 0.108, 0.1, 0);
  }
  const nose = mesh(head, new THREE.ConeGeometry(0.016, 0.045, 5), skin, 0, 0.092, 0.112);
  nose.rotation.x = 1.9;
  const mouth = mesh(head, new THREE.BoxGeometry(0.036, 0.006, 0.01), color('#5a2f28'), 0, 0.045, 0.098);

  addHair(head, a);
  if (a.beard) {
    const beard = mesh(head, new THREE.SphereGeometry(0.092, 10, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), color(a.beard), 0, 0.065, 0.02);
    beard.scale.set(1, 1.1, 1.05);
  }
  if (a.moustache) mesh(head, new THREE.BoxGeometry(0.06, 0.016, 0.02), color(a.moustache), 0, 0.064, 0.102);
  if (a.glasses) {
    const gm = color('#1a1a1a', 0.4, 0.6);
    for (const sx of [-1, 1]) {
      const ring = mesh(head, new THREE.TorusGeometry(0.024, 0.0035, 5, 12), gm, sx * 0.04, 0.112, 0.108);
      ring.castShadow = false;
    }
    mesh(head, new THREE.BoxGeometry(0.03, 0.004, 0.004), gm, 0, 0.115, 0.108);
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
        const c = gp.children[0];
        c.geometry?.dispose?.();
        gp.remove(c);
      }
    }
    const brass = color('#c9a14a', 0.3, 1);
    for (const acc of list) {
      if (acc === 'whistle' || acc === 'whistleCord') {
        // A bosun's whistle worn at the chest: on a brass chain, or a bootlace.
        const cordMat = acc === 'whistle' ? brass : color('#3a2a1c', 0.9);
        const loop = mesh(accGroup, new THREE.TorusGeometry(0.1, acc === 'whistle' ? 0.004 : 0.006, 5, 16, Math.PI), cordMat, 0, 0.56, 0.06 * build.d);
        loop.rotation.set(-0.5, 0, Math.PI);
        const pipe = mesh(accGroup, new THREE.CylinderGeometry(0.008, 0.01, 0.07, 6), brass, 0, 0.44, 0.15 * build.d);
        pipe.rotation.z = 0.25;
        mesh(accGroup, new THREE.SphereGeometry(0.014, 6, 5), brass, 0.012, 0.41, 0.15 * build.d);
      } else if (acc === 'badge') {
        mesh(accGroup, new THREE.BoxGeometry(0.04, 0.05, 0.01), brass, -0.09 * build.w, 0.47, 0.135 * build.d);
      } else if (acc === 'towel') {
        mesh(accGroup, new THREE.BoxGeometry(0.1, 0.32, 0.03), color('#b9b4a6'), 0.17 * build.w, 0.52, 0.02);
      } else if (acc === 'cane') {
        mesh(handAcc, new THREE.CylinderGeometry(0.012, 0.012, 0.86, 6), color('#2a1a10', 0.5), 0.02, -0.7, 0.05);
        const hook = mesh(handAcc, new THREE.TorusGeometry(0.04, 0.012, 5, 10, Math.PI), brass, 0.02, -0.28, 0.01);
        hook.rotation.y = Math.PI / 2;
      } else if (acc === 'clipboard') {
        const cb = mesh(handAccL, new THREE.BoxGeometry(0.2, 0.28, 0.012), color('#5a4630'), 0, -0.25, 0.09);
        cb.rotation.x = -0.9;
        const pp = mesh(handAccL, new THREE.BoxGeometry(0.17, 0.24, 0.004), color('#e2ddd0'), 0, -0.245, 0.1);
        pp.rotation.x = -0.9;
      } else if (acc === 'notepad') {
        const np = mesh(handAccL, new THREE.BoxGeometry(0.09, 0.13, 0.012), color('#d8d2c0'), 0, -0.29, 0.06);
        np.rotation.x = -0.8;
      } else if (acc === 'camera') {
        mesh(accGroup, new THREE.BoxGeometry(0.12, 0.08, 0.06), color('#15171a', 0.4), 0, 0.3, 0.17 * build.d);
        mesh(accGroup, new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), color('#15171a', 0.4), 0, 0.3, 0.21 * build.d).rotation.x = Math.PI / 2;
      } else if (acc === 'rope') {
        for (let i = 0; i < 3; i++) {
          const rp = mesh(accGroup, new THREE.TorusGeometry(0.2 * build.w, 0.013, 5, 14), color('#9a8a66', 1), 0, 0.2 + i * 0.05, 0);
          rp.rotation.x = Math.PI / 2;
          rp.scale.set(1, 0.72 * build.d, 1);
        }
      } else if (acc === 'lantern') {
        const lm = color('#c9a14a', 0.3, 1);
        mesh(handAcc, new THREE.CylinderGeometry(0.05, 0.06, 0.06, 8), lm, 0, -0.52, 0.02);
        mesh(handAcc, new THREE.CylinderGeometry(0.04, 0.05, 0.12, 8), new THREE.MeshBasicMaterial({ color: 0xffc070 }), 0, -0.43, 0.02);
        mesh(handAcc, new THREE.CylinderGeometry(0.03, 0.045, 0.04, 8), lm, 0, -0.35, 0.02);
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
  let baseTorsoY = torso.position.y;
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
    arms[0].shoulder.rotation.x = -0.5;
    arms[0].elbow.rotation.x = -1.5;
    arms[1].shoulder.rotation.x = -0.5;
    arms[1].elbow.rotation.x = -1.5;
    arms[0].shoulder.rotation.z = 0.45;
    arms[1].shoulder.rotation.z = -0.45;
  }
  if ((a.accessories ?? []).includes('clipboard') || (a.accessories ?? []).includes('notepad')) {
    arms[0].shoulder.rotation.x = -0.25;
    arms[0].elbow.rotation.x = -1.1;
  }
  const rest = arms.map((arm) => ({ sx: arm.shoulder.rotation.x, sz: arm.shoulder.rotation.z, ex: arm.elbow.rotation.x }));

  // --- animation --------------------------------------------------------
  const phase = Math.random() * 10;
  let blinkAt = 2 + Math.random() * 4;
  let blink = 0;
  let headYaw = 0;
  let headPitch = 0;
  let talk = 0;
  const tmp = new THREE.Vector3();
  const inv = new THREE.Matrix4();

  function update(t, dt, s = {}) {
    const mood = s.mood ?? 'calm';
    const nervous = mood === 'nervous' || mood === 'shaken' || mood === 'afraid';
    const breathe = Math.sin(t * (nervous ? 2.6 : 1.5) + phase);
    torso.scale.y = 1 + breathe * 0.008;
    torso.position.y = baseTorsoY + breathe * 0.003;
    if (pose === 'stand') {
      root.rotation.z = Math.sin(t * 0.6 + phase) * (nervous ? 0.018 : 0.008);
      torso.rotation.x = (mood === 'angry' || mood === 'cold' ? 0.07 : mood === 'sad' || mood === 'grieving' ? 0.05 : 0) + Math.sin(t * 0.43 + phase) * 0.006;
    }
    // Head tracking.
    let targetYaw = Math.sin(t * 0.31 + phase) * 0.12;
    let targetPitch = mood === 'sad' || mood === 'grieving' ? 0.28 : Math.sin(t * 0.23 + phase * 2) * 0.03;
    if (s.lookAt) {
      root.updateWorldMatrix(true, false);
      inv.copy(root.matrixWorld).invert();
      tmp.copy(s.lookAt).applyMatrix4(inv);
      const eyeY = (hipY - 0.06 + 0.67 + 0.2) * scale + body.position.y;
      const dist = Math.hypot(tmp.x, tmp.z);
      if (dist < 7 && dist > 0.2) {
        targetYaw = THREE.MathUtils.clamp(Math.atan2(tmp.x, tmp.z), -1.15, 1.15);
        targetPitch = THREE.MathUtils.clamp(-Math.atan2(tmp.y - eyeY, dist), -0.4, 0.4) + (mood === 'sad' || mood === 'grieving' ? 0.14 : 0);
        if (mood === 'guarded' || mood === 'evasive') targetYaw += Math.sin(t * 0.9 + phase) * 0.22;
      }
    }
    const k = 1 - Math.exp(-dt * 5);
    headYaw += (targetYaw - headYaw) * k;
    headPitch += (targetPitch - headPitch) * k;
    talk += ((s.talking ? 1 : 0) - talk) * (1 - Math.exp(-dt * 8));
    neck.rotation.y = headYaw * 0.75;
    head.rotation.x = headPitch + talk * Math.sin(t * 11) * 0.035;
    head.rotation.z = talk * Math.sin(t * 5.3) * 0.03;
    torso.rotation.y = headYaw * 0.22;
    mouth.scale.y = 1 + talk * (1.5 + Math.sin(t * 17) * 1.5);
    // Arms: idle sway, fidgeting when nervous, small gestures when talking.
    for (let i = 0; i < 2; i++) {
      const arm = arms[i];
      const r = rest[i];
      const fid = nervous ? Math.sin(t * 5.1 + i * 2 + phase) * 0.05 : 0;
      const gest = i === 1 && pose !== 'bound' ? talk * (0.25 + Math.sin(t * 3.1 + phase) * 0.18) : 0;
      arm.shoulder.rotation.x = r.sx + Math.sin(t * 0.9 + phase + i) * 0.02 + fid - gest * 0.5;
      arm.elbow.rotation.x = r.ex + fid * 2 - gest * 1.6;
    }
    // Blink.
    blinkAt -= dt;
    if (blinkAt <= 0) {
      blink = 0.13;
      blinkAt = (nervous ? 1.2 : 2.5) + Math.random() * 4;
    }
    blink = Math.max(0, blink - dt);
    const ey = blink > 0 ? 0.12 : 1;
    eyes[0].scale.y = ey;
    eyes[1].scale.y = ey;
  }

  return { root, update, headHeight: (hipY - 0.06 + 0.67 + 0.2) * scale + body.position.y, setAccessories };
}

function addHair(head, a) {
  const style = a.hair?.style ?? 'short';
  if (style === 'bald') return;
  const hm = color(a.hair?.color ?? '#2a2018', 0.9);
  const capGeo = (theta, r = 0.118) => new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, theta);
  // A band of hair with an opening at the face (+Z). SphereGeometry starts
  // its sweep on -X, so the opening is centred by starting past +Z.
  const bandGeo = (t0, t1, open = 1.5, r = 0.119) => new THREE.SphereGeometry(r, 12, 6, Math.PI * 1.5 + open / 2 - Math.PI, Math.PI * 2 - open, t0, t1 - t0);
  const place = (m) => {
    m.position.y = 0.1;
    m.scale.set(0.96, 1.13, 1.02);
    return m;
  };
  if (style === 'balding') {
    place(mesh(head, bandGeo(0.42 * Math.PI, 0.66 * Math.PI, 2.3), hm));
    return;
  }
  const cap = place(mesh(head, capGeo(Math.PI * 0.42), hm));
  cap.rotation.x = -0.18;
  if (style === 'short' || style === 'crop') {
    place(mesh(head, bandGeo(0.3 * Math.PI, 0.62 * Math.PI, 2.0), hm));
  } else if (style === 'bun') {
    place(mesh(head, bandGeo(0.3 * Math.PI, 0.66 * Math.PI, 1.9), hm));
    mesh(head, new THREE.SphereGeometry(0.052, 8, 6), hm, 0, 0.19, -0.1);
  } else if (style === 'bob') {
    place(mesh(head, bandGeo(0.3 * Math.PI, 0.82 * Math.PI, 1.7, 0.124), hm));
  } else if (style === 'long') {
    place(mesh(head, bandGeo(0.3 * Math.PI, 0.8 * Math.PI, 1.7, 0.124), hm));
    const back = mesh(head, new THREE.BoxGeometry(0.19, 0.26, 0.06), hm, 0, -0.06, -0.085);
    back.rotation.x = 0.12;
  } else if (style === 'ponytail') {
    place(mesh(head, bandGeo(0.3 * Math.PI, 0.64 * Math.PI, 1.9), hm));
    const tail = mesh(head, new THREE.SphereGeometry(0.04, 7, 6), hm, 0, 0.05, -0.14);
    tail.scale.set(0.9, 2.4, 0.9);
    tail.rotation.x = 0.35;
  } else if (style === 'wild') {
    place(mesh(head, bandGeo(0.26 * Math.PI, 0.7 * Math.PI, 1.8, 0.13), hm));
    cap.scale.set(1.04, 1.22, 1.08);
  }
}

function addHat(head, a) {
  if (!a.hat) return;
  const hm = color(a.hatColor ?? '#2b2622', 0.9);
  if (a.hat === 'fedora') {
    const brim = mesh(head, new THREE.CylinderGeometry(0.19, 0.19, 0.012, 16), hm, 0, 0.185, 0.005);
    brim.rotation.x = -0.06;
    const crown = mesh(head, new THREE.CylinderGeometry(0.1, 0.118, 0.11, 14), hm, 0, 0.245, 0);
    crown.scale.set(1, 1, 1.08);
    mesh(head, new THREE.CylinderGeometry(0.12, 0.12, 0.03, 14), color('#0f0d0c'), 0, 0.205, 0).scale.set(1, 1, 1.08);
  } else if (a.hat === 'flatcap') {
    const cap = mesh(head, new THREE.SphereGeometry(0.125, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), hm, 0, 0.165, 0.01);
    cap.scale.set(1.02, 0.5, 1.15);
    const peak = mesh(head, new THREE.CylinderGeometry(0.09, 0.09, 0.012, 10, 1, false, -Math.PI / 2, Math.PI), hm, 0, 0.168, 0.1);
    peak.scale.set(1, 1, 0.8);
  } else if (a.hat === 'police') {
    mesh(head, new THREE.CylinderGeometry(0.122, 0.118, 0.05, 14), hm, 0, 0.2, 0);
    mesh(head, new THREE.CylinderGeometry(0.145, 0.125, 0.04, 14), hm, 0, 0.245, 0);
    const peak = mesh(head, new THREE.CylinderGeometry(0.1, 0.1, 0.01, 10, 1, false, -Math.PI / 2, Math.PI), color('#0c0c0d', 0.3), 0, 0.18, 0.09);
    peak.scale.set(1, 1, 0.7);
    mesh(head, new THREE.BoxGeometry(0.03, 0.03, 0.01), color('#c9a14a', 0.3, 1), 0, 0.225, 0.123);
  }
}

export { mat };
