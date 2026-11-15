// People: real rigged models, moved by motion-capture clips.
//
// The body plays a looping clip chosen from what the person is doing (standing
// about, listening, talking, sitting) and how they feel. On top of that, in
// code: the head and eyes turn to whoever they are speaking to, they blink,
// their mouth shapes move while they talk, their face holds an expression,
// and a hand stays on whatever it is holding.
//
// The models and clips are the Microsoft Rocketbox avatar library (MIT).

import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { assets } from './assets.js';
import { rimLit } from './figure-light.js';
import { blobShadowMaterial } from './materials.js';

const prepared = new WeakSet();

/** One-time set-up of a loaded model's materials. */
function prepare(model) {
  if (prepared.has(model)) return;
  prepared.add(model);
  model.scene.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    m.envMapIntensity = 0.6;
    if (m.name === 'hair') {
      // Hair is cards with cut-out edges; let the anti-aliasing soften them.
      m.alphaToCoverage = true;
      m.side = THREE.DoubleSide;
    }
    if (m.name === 'glasses') {
      m.depthWrite = false;
      return;
    }
    if (m.normalMap) m.normalScale.set(0.9, 0.9);
    rimLit(m, m.name === 'head' ? 0.09 : 0.13);
  });
}

const clipCache = new Map();

/**
 * A clip fitted to one person: the hips' travel is scaled to their leg
 * length, so feet stay on the floor whoever plays it.
 */
function fitted(src, clipId) {
  const key = `${src.id}:${clipId}`;
  if (clipCache.has(key)) return clipCache.get(key);
  const base = src.clips.find((c) => c.name === clipId);
  let clip = null;
  if (base) {
    const ratio = src.info.hip / src.clipInfo.hip;
    const tracks = base.tracks.map((track) => {
      if (!track.name.endsWith('.position')) return track;
      const values = Float32Array.from(track.values, (v) => v * ratio);
      return new THREE.VectorKeyframeTrack(track.name, track.times, values);
    });
    clip = new THREE.AnimationClip(clipId, base.duration, tracks);
  }
  clipCache.set(key, clip);
  return clip;
}

// What each mood does to a face, as blendshape weights.
const both = (name, w) => ({ [`${name}L`]: w, [`${name}R`]: w });
const EXPRESSION = {
  calm: { ...both('smile', 0.08) },
  guarded: { ...both('browDown', 0.35), ...both('squint', 0.3), ...both('press', 0.35) },
  nervous: { browInnerUp: 0.6, ...both('wide', 0.3), ...both('stretch', 0.22), ...both('press', 0.15) },
  angry: { ...both('browDown', 0.9), ...both('squint', 0.4), ...both('sneer', 0.45), ...both('frown', 0.35), ...both('press', 0.4) },
  sad: { browInnerUp: 0.8, ...both('frown', 0.65), lidDroop: 0.35, shrugLower: 0.25 },
  shaken: { browInnerUp: 0.9, ...both('wide', 0.7), ...both('browUp', 0.3), jawOpen: 0.1, ...both('stretch', 0.25) },
  cold: { ...both('browDown', 0.45), ...both('squint', 0.5), ...both('press', 0.55), lidDroop: 0.15 },
  warm: { ...both('smile', 0.6), ...both('cheek', 0.5), ...both('squint', 0.15) },
  amused: { smileL: 0.6, smileR: 0.28, cheekL: 0.4, browUpR: 0.45, ...both('squint', 0.12) },
  wavering: { browInnerUp: 0.7, ...both('frown', 0.35), ...both('press', 0.2), lidDroop: 0.15 },
  breaking: { browInnerUp: 1, ...both('frown', 0.8), ...both('squint', 0.45), shrugLower: 0.5, ...both('cheek', 0.25) },
};
const MOOD_ALIAS = { evasive: 'guarded', afraid: 'shaken', grieving: 'sad', surrender: 'breaking', defiant: 'cold' };
const TONE = {
  angry: 'angry', cold: 'angry',
  nervous: 'nervous', shaken: 'nervous', guarded: 'nervous', wavering: 'nervous',
  sad: 'sad', breaking: 'sad',
  warm: 'relaxed', amused: 'relaxed',
};
// Mouth shapes to pass through while speaking, vowels more often than consonants.
const VISEMES = ['v_aa', 'v_aa', 'v_e', 'v_e', 'v_i', 'v_o', 'v_o', 'v_u', 'v_pp', 'v_ff', 'v_th', 'v_dd', 'v_kk', 'v_ch', 'v_ss', 'v_nn', 'v_rr'];

const UP = new THREE.Vector3(0, 1, 0);
const va = new THREE.Vector3();
const vb = new THREE.Vector3();
const vc = new THREE.Vector3();
const vd = new THREE.Vector3();
const ve = new THREE.Vector3();
const qa = new THREE.Quaternion();
const qb = new THREE.Quaternion();
const qc = new THREE.Quaternion();
const qd = new THREE.Quaternion();
const qe = new THREE.Quaternion();
const qf = new THREE.Quaternion();
const ray = new THREE.Raycaster();

/** Turn a bone by a rotation given in world space. */
function turnWorld(bone, worldDelta) {
  bone.parent.getWorldQuaternion(qe);
  // local' = parent^-1 * delta * parent * local
  qf.copy(qe).invert().multiply(worldDelta).multiply(qe);
  bone.quaternion.premultiply(qf);
}

/**
 * Bend an arm so the hand ends up at a point: the two-bone problem, solved exactly.
 * @param {THREE.Bone} upper  @param {THREE.Bone} fore  @param {THREE.Bone} hand
 * @param {THREE.Vector3} target world position for the wrist
 * @param {THREE.Vector3} pole world direction the elbow should point in
 */
function reach(upper, fore, hand, target, pole) {
  const s = upper.getWorldPosition(va);
  const e = fore.getWorldPosition(vb);
  const w = hand.getWorldPosition(vc);
  const a = s.distanceTo(e);
  const b = e.distanceTo(w);
  const toTarget = vd.copy(target).sub(s);
  const d = Math.min(toTarget.length(), (a + b) * 0.999);
  toTarget.normalize();
  // Where the elbow goes: on the circle both bones allow, on the side the pole points to.
  const along = (a * a - b * b + d * d) / (2 * d);
  const out = Math.sqrt(Math.max(0, a * a - along * along));
  const side = ve.copy(pole).addScaledVector(toTarget, -pole.dot(toTarget)).normalize();
  const elbow = side.multiplyScalar(out).addScaledVector(toTarget, along).add(s);
  turnWorld(upper, qa.setFromUnitVectors(vb.sub(s).normalize(), vd.copy(elbow).sub(s).normalize()));
  upper.updateWorldMatrix(false, true);
  const e2 = fore.getWorldPosition(vb);
  const w2 = hand.getWorldPosition(vc);
  turnWorld(fore, qa.setFromUnitVectors(w2.sub(e2).normalize(), vd.copy(target).sub(e2).normalize()));
  fore.updateWorldMatrix(false, true);
}

const hash = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};

const BRASS = new THREE.MeshStandardMaterial({ color: 0xd2a94e, roughness: 0.32, metalness: 0.85 });
const solids = new Map();
const solid = (hex, rough = 0.8) => {
  const key = `${hex}:${rough}`;
  if (!solids.has(key)) solids.set(key, new THREE.MeshStandardMaterial({ color: hex, roughness: rough }));
  return solids.get(key);
};

/**
 * @param {any} look appearance from the case file; `look.model` names the character
 * @returns {{ root: THREE.Group, update: Function, headHeight: number, setAccessories: Function, dispose: Function }|null}
 */
export function createPerson(look) {
  const src = assets.person(look.model);
  if (!src) return null;
  prepare(src.model);
  // 'slumped' sits on the floor like 'bound', but with the hands left free.
  const tied = look.pose === 'bound';
  const pose = look.pose === 'slumped' ? 'bound' : (look.pose ?? 'stand');
  const seated = pose === 'sit' || pose === 'bound';
  const root = new THREE.Group();
  const rig = SkeletonUtils.clone(src.model.scene);
  root.add(rig);
  // The same few bodies have to play nine people: broaden the heavy-set, narrow the slight.
  const girth = { heavy: 1.08, slim: 0.97 }[look.build] ?? 1;
  rig.scale.set(girth, 1, girth * (look.build === 'heavy' ? 1.03 : 1));

  const faces = [];
  const skins = [];
  rig.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    skins.push(o);
    o.castShadow = o.material.name !== 'glasses';
    // The shadow map is too coarse for a face; clothes can take it.
    o.receiveShadow = o.name === 'body';
    // Clips move people well outside the box their rest pose was measured in.
    o.frustumCulled = false;
    if (o.morphTargetDictionary) faces.push(o);
  });
  const bone = (name) => rig.getObjectByName(name);
  const arm = (s) => ({ upper: bone(`Bip01_${s}_UpperArm`), fore: bone(`Bip01_${s}_Forearm`), hand: bone(`Bip01_${s}_Hand`), grip: bone(`Bip01_${s}_Finger2`) });
  const bones = {
    hips: bone('Bip01'),
    pelvis: bone('Bip01_Pelvis'),
    waist: bone('Bip01_Spine1'),
    chest: bone('Bip01_Spine2'),
    neck: bone('Bip01_Neck'),
    head: bone('Bip01_Head'),
    eyeL: bone('Bip01_LEye'),
    eyeR: bone('Bip01_REye'),
    shoulderL: bone('Bip01_L_Clavicle'),
    L: arm('L'),
    R: arm('R'),
    legs: ['L', 'R'].map((s) => ({ calf: bone(`Bip01_${s}_Calf`), foot: bone(`Bip01_${s}_Foot`), out: s === 'L' ? 1 : -1 })),
  };
  // The clips do not move the eyes, so they have to be put back before each new glance.
  const eyeRest = [bones.eyeL, bones.eyeR].map((eye) => eye.quaternion.clone());
  // Which way the head bone's own axes point when the head faces straight ahead (the model's rest pose).
  root.updateMatrixWorld(true);
  const headAhead = new THREE.Vector3(0, 0, 1).applyQuaternion(bones.head.getWorldQuaternion(new THREE.Quaternion()).invert());

  // --- body ---------------------------------------------------------------
  const mixer = new THREE.AnimationMixer(rig);
  const actions = new Map();
  const action = (id) => {
    if (!actions.has(id)) {
      const clip = fitted(src, id);
      actions.set(id, clip ? mixer.clipAction(clip) : null);
    }
    return actions.get(id);
  };
  const has = (id) => src.clips.some((c) => c.name === id);
  const seed = hash(`${look.model}:${pose}`);
  // Not everyone stands the same way.
  const restIdle = ['idle', 'idle2', 'idle_breathe'][Math.floor(seed * 3)];
  let current = null;
  function play(id, fade = 0.5) {
    const next = action(id) ?? action('idle');
    if (!next || next === current) return;
    next.reset();
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    if (!current) next.time = seed * next.getClip().duration;
    next.play();
    if (current) {
      next.fadeIn(fade);
      current.fadeOut(fade);
    }
    current = next;
  }
  function wanted(s) {
    const tone = TONE[MOOD_ALIAS[s.mood] ?? s.mood] ?? '';
    const or = (id, fallback) => (has(id) ? id : fallback);
    if (seated) {
      if (s.talking && pose === 'sit') return or('sit_talk', 'sit');
      return tone === 'nervous' || pose === 'bound' ? or('sit_nervous', 'sit') : 'sit';
    }
    if (s.talking) return tone === 'relaxed' ? or('talk_relaxed', 'talk') : tone ? or(`talk_${tone}`, 'talk') : seed > 0.5 ? or('talk2', 'talk') : 'talk';
    if (s.engaged) return tone && tone !== 'relaxed' ? or(`listen_${tone}`, 'listen') : 'listen';
    if (tone === 'angry') return or('idle_angry', restIdle);
    if (tone === 'nervous') return or('idle_nervous', restIdle);
    return restIdle;
  }
  play(wanted({}), 0);
  mixer.update(0);
  root.updateMatrixWorld(true);
  if (seated) {
    // Where they are placed is where they sit: put the hips over that spot, not the feet.
    const hips = bones.pelvis.getWorldPosition(new THREE.Vector3());
    // Someone tied up is on the floor, not on a chair: lower them until they are sitting on it.
    rig.position.set(-hips.x, pose === 'bound' ? -Math.max(0, hips.y - 0.13) : 0, -hips.z);
    root.updateMatrixWorld(true);
  }
  /** On the floor the legs go out in front, where a chair would have let them hang. */
  function legsOut() {
    root.updateWorldMatrix(true, true);
    for (const leg of bones.legs) {
      const knee = leg.calf.getWorldPosition(va);
      const shin = leg.foot.getWorldPosition(vb).sub(knee).normalize();
      const along = vc.set(leg.out * 0.1, -0.07, 1).normalize().transformDirection(root.matrixWorld);
      turnWorld(leg.calf, qa.setFromUnitVectors(shin, along));
    }
  }
  if (pose === 'bound') legsOut();
  const eyeHeight = bones.head.getWorldPosition(new THREE.Vector3()).y + 0.1;

  // --- face ---------------------------------------------------------------
  const weights = new Map(); // blendshape -> current weight
  const shape = (name, value) => {
    for (const mesh of faces) {
      const i = mesh.morphTargetDictionary[name];
      if (i !== undefined) mesh.morphTargetInfluences[i] = value;
    }
  };
  const allShapes = new Set();
  for (const mesh of faces) for (const name of Object.keys(mesh.morphTargetDictionary)) allShapes.add(name);
  let blinkAt = 1.5 + seed * 4;
  let blink = 0;
  let mouthAt = 0;
  let viseme = null;
  let visemeTarget = 0;
  const speech = new Map(); // viseme -> weight

  // --- things carried -----------------------------------------------------
  const made = [];
  const carried = [];
  /** Where each wrist is held, in the person's own frame, if it is held anywhere. */
  const held = { L: null, R: null };
  const part = (geometry, material) => {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = true;
    made.push(geometry);
    return m;
  };
  const local = (object) => root.worldToLocal(object.getWorldPosition(new THREE.Vector3()));
  /** Where a level ray from in front meets their clothes: a point on the chest, in the person's own frame. */
  function surface(x, y, fallbackZ = 0.11) {
    root.updateMatrixWorld(true);
    const from = new THREE.Vector3(x, y, 1).applyMatrix4(root.matrixWorld);
    ray.set(from, vd.set(0, 0, -1).transformDirection(root.matrixWorld));
    ray.far = 2;
    let hit = null;
    try {
      hit = ray.intersectObjects(skins.filter((m) => m.name === 'body'), false)[0];
    } catch {
      /* fall back to a guess */
    }
    return hit ? root.worldToLocal(hit.point.clone()) : new THREE.Vector3(x, y, fallbackZ);
  }
  /** Put something where it belongs now, then let a bone carry it from there. */
  const hang = (object, onBone) => {
    root.add(object);
    root.updateMatrixWorld(true);
    onBone.attach(object);
    carried.push(object);
  };
  /** A cord lying on the chest from point to point. */
  const cord = (points, radius, material) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => p.clone().add(new THREE.Vector3(0, 0, radius + 0.002))));
    return part(new THREE.TubeGeometry(curve, 20, radius, 6), material);
  };

  function setAccessories(list = []) {
    for (const o of carried.splice(0)) o.parent?.remove(o);
    held.L = held.R = null;
    root.updateMatrixWorld(true);
    const neck = local(bones.neck);
    for (const item of list) {
      if (item === 'whistle' || item === 'whistleCord') {
        // A bosun's whistle at the breastbone: on a brass chain, or (later, tellingly) on a bootlace.
        const chain = item === 'whistle';
        const at = surface(0, neck.y - 0.17);
        const g = new THREE.Group();
        for (const sx of [-1, 1]) {
          const line = [new THREE.Vector3(sx * 0.062, neck.y - 0.005, neck.z + 0.015), surface(sx * 0.045, neck.y - 0.06), surface(sx * 0.022, neck.y - 0.12), at.clone().add(new THREE.Vector3(0, 0.012, 0))];
          g.add(cord(line, chain ? 0.0022 : 0.0034, chain ? BRASS : solid(0x2b1f15, 0.95)));
        }
        const call = new THREE.Group();
        const pipe = part(new THREE.CylinderGeometry(0.0042, 0.0052, 0.062, 12), BRASS);
        pipe.rotation.z = Math.PI / 2;
        const buoy = part(new THREE.SphereGeometry(0.0105, 14, 10), BRASS);
        buoy.position.x = -0.03;
        const keel = part(new THREE.BoxGeometry(0.036, 0.011, 0.0022), BRASS);
        keel.position.set(-0.004, -0.008, 0);
        const ring = part(new THREE.TorusGeometry(0.005, 0.0012, 6, 14), BRASS);
        ring.position.set(0.004, 0.009, 0);
        call.add(pipe, buoy, keel, ring);
        call.rotation.z = -1.25;
        call.position.copy(at).add(new THREE.Vector3(0.004, -0.024, 0.011));
        g.add(call);
        hang(g, bones.chest);
      } else if (item === 'badge') {
        const at = surface(0.088, neck.y - 0.2);
        const g = new THREE.Group();
        const shield = part(new THREE.CylinderGeometry(0.021, 0.015, 0.005, 6), BRASS);
        shield.rotation.x = Math.PI / 2;
        g.add(shield);
        g.position.copy(at).add(new THREE.Vector3(0, 0, 0.004));
        hang(g, bones.chest);
      } else if (item === 'camera') {
        const at = surface(0, neck.y - 0.31);
        const g = new THREE.Group();
        const dark = solid(0x121416, 0.42);
        const body = part(new THREE.BoxGeometry(0.118, 0.076, 0.046), dark);
        const top = part(new THREE.BoxGeometry(0.05, 0.02, 0.04), dark);
        top.position.y = 0.046;
        const lens = part(new THREE.CylinderGeometry(0.028, 0.031, 0.055, 20), solid(0x0c0d0f, 0.3));
        lens.rotation.x = Math.PI / 2;
        lens.position.z = 0.048;
        const glass = part(new THREE.CircleGeometry(0.022, 20), new THREE.MeshStandardMaterial({ color: 0x1a2530, roughness: 0.08, metalness: 0.6 }));
        glass.position.z = 0.0765;
        const cam = new THREE.Group();
        cam.add(body, top, lens, glass);
        cam.position.copy(at).add(new THREE.Vector3(0, 0, 0.028));
        g.add(cam);
        for (const sx of [-1, 1]) {
          const line = [new THREE.Vector3(sx * 0.066, neck.y, neck.z + 0.01), surface(sx * 0.06, neck.y - 0.1), surface(sx * 0.057, neck.y - 0.22), at.clone().add(new THREE.Vector3(sx * 0.056, 0.03, 0.01))];
          g.add(cord(line, 0.0045, solid(0x15171a, 0.85)));
        }
        hang(g, bones.chest);
      } else if (item === 'clipboard' || item === 'notepad') {
        const big = item === 'clipboard';
        const g = new THREE.Group();
        const board = part(new THREE.BoxGeometry(big ? 0.225 : 0.085, big ? 0.31 : 0.125, 0.007), solid(big ? 0x4d3b28 : 0x1e2126, 0.7));
        const sheet = part(new THREE.BoxGeometry(big ? 0.205 : 0.078, big ? 0.28 : 0.115, 0.003), solid(0xece7da, 0.9));
        sheet.position.set(0, big ? -0.008 : 0, 0.005);
        g.add(board, sheet);
        if (big) {
          const clip = part(new THREE.BoxGeometry(0.09, 0.022, 0.012), solid(0x9aa0a6, 0.35));
          clip.position.set(0, 0.142, 0.006);
          g.add(clip);
        }
        // Held at the side, hanging from the fingers, its face outward.
        const hand = local(bones.L.grip);
        g.position.copy(hand).add(new THREE.Vector3(0.018, big ? -0.11 : -0.035, 0.015));
        g.rotation.set(0, Math.PI / 2, 0.06);
        hang(g, bones.L.hand);
      } else if (item === 'towel') {
        // A bar towel over the shoulder: down the front, over the top, down the back.
        const cloth = solid(0xd0c9b8, 0.95);
        const shoulder = local(bones.shoulderL).add(new THREE.Vector3(0.055, 0, 0));
        const front = surface(shoulder.x, shoulder.y - 0.1);
        const g = new THREE.Group();
        const top = part(new THREE.BoxGeometry(0.085, 0.012, 0.12), cloth);
        top.position.set(shoulder.x, shoulder.y + 0.048, 0.0);
        const down = part(new THREE.BoxGeometry(0.085, 0.2, 0.012), cloth);
        down.position.set(shoulder.x, shoulder.y - 0.05, Math.max(front.z, 0.05) + 0.008);
        down.rotation.x = -0.08;
        const back = part(new THREE.BoxGeometry(0.085, 0.16, 0.012), cloth);
        back.position.set(shoulder.x, shoulder.y - 0.03, -0.075);
        back.rotation.x = 0.12;
        g.add(top, down, back);
        hang(g, bones.chest);
      } else if (item === 'rope') {
        const g = new THREE.Group();
        const hemp = solid(0xa89872, 1);
        for (let i = 0; i < 5; i++) {
          const ring = part(new THREE.TorusGeometry(0.235, 0.0115, 8, 32), hemp);
          ring.rotation.x = Math.PI / 2 + (i % 2 ? 0.05 : -0.04);
          ring.scale.set(1, 0.72, 1);
          ring.position.y = i * 0.036;
          g.add(ring);
        }
        // Round the chest and the upper arms.
        g.position.copy(local(bones.chest)).add(new THREE.Vector3(0, -0.07, -0.01));
        hang(g, bones.chest);
      } else if (item === 'lantern') {
        const g = new THREE.Group();
        const base = part(new THREE.CylinderGeometry(0.045, 0.055, 0.05, 14), BRASS);
        const glass = part(new THREE.CylinderGeometry(0.036, 0.045, 0.11, 14), new THREE.MeshBasicMaterial({ color: 0xffc070 }));
        glass.position.y = 0.08;
        const cap = part(new THREE.CylinderGeometry(0.026, 0.04, 0.035, 14), BRASS);
        cap.position.y = 0.15;
        g.add(base, glass, cap);
        g.position.copy(local(bones.R.grip)).add(new THREE.Vector3(0, -0.2, 0.02));
        hang(g, bones.R.hand);
      } else if (item === 'cane') {
        // Planted on the floor, the hand resting on top. The hand is held there; the stick goes from it to the ground.
        const wrist = local(bones.R.hand);
        const top = seated ? wrist.clone().add(new THREE.Vector3(0.02, 0.03, 0.1)) : new THREE.Vector3(wrist.x + 0.05, wrist.y + 0.02, wrist.z + 0.14);
        const foot = new THREE.Vector3(top.x + 0.03, 0, top.z + (seated ? 0.16 : 0.07));
        const length = top.distanceTo(foot);
        const g = new THREE.Group();
        const stick = part(new THREE.CylinderGeometry(0.0105, 0.0085, length - 0.02, 12), solid(0x24160d, 0.42));
        stick.position.y = -length / 2 - 0.01;
        const ferrule = part(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 10), solid(0x101010, 0.6));
        ferrule.position.y = -length + 0.015;
        const knob = part(new THREE.SphereGeometry(0.021, 14, 10), BRASS);
        knob.scale.set(1.25, 0.8, 1);
        const collar = part(new THREE.CylinderGeometry(0.0125, 0.0125, 0.016, 12), BRASS);
        collar.position.y = -0.024;
        g.add(stick, ferrule, knob, collar);
        g.position.copy(top);
        g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), foot.clone().sub(top).normalize());
        root.add(g);
        carried.push(g);
        // The wrist sits just above and behind the knob.
        held.R = { at: top.clone().add(new THREE.Vector3(-0.012, 0.045, -0.035)), pole: new THREE.Vector3(-0.5, -0.2, -1) };
      }
    }
    if (tied) {
      // Wrists together behind the back of the chair.
      const hips = local(bones.pelvis);
      held.L = { at: new THREE.Vector3(0.045, hips.y + 0.1, hips.z - 0.2), pole: new THREE.Vector3(1, 0.1, -0.6) };
      held.R = { at: new THREE.Vector3(-0.045, hips.y + 0.1, hips.z - 0.2), pole: new THREE.Vector3(-1, 0.1, -0.6) };
    }
  }
  setAccessories(look.accessories ?? []);

  const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), blobShadowMaterial());
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.014;
  blob.renderOrder = 1;
  root.add(blob);

  // --- every frame --------------------------------------------------------
  let look_yaw = 0;
  let look_pitch = 0;
  let talk = 0;
  const target = new THREE.Vector3();
  const inv = new THREE.Matrix4();
  const world = new THREE.Vector3();
  const pole = new THREE.Vector3();
  const right = new THREE.Vector3();

  function update(t, dt, s = {}) {
    const mood = MOOD_ALIAS[s.mood] ?? s.mood ?? 'calm';
    const nervous = TONE[mood] === 'nervous';
    const low = TONE[mood] === 'sad';
    play(s.clip && has(s.clip) ? s.clip : wanted(s));
    mixer.update(dt);
    if (pose === 'bound') legsOut();
    talk += ((s.talking ? 1 : 0) - talk) * (1 - Math.exp(-dt * 9));

    // Head and eyes toward whoever they are looking at. The clip keeps moving
    // the head; what is added here is whatever it still takes to face them.
    let turnYaw = 0;
    let turnPitch = low ? -0.14 : 0;
    let eyeYaw = 0;
    let eyePitch = 0;
    if (s.lookAt) {
      root.updateWorldMatrix(true, false);
      inv.copy(root.matrixWorld).invert();
      target.copy(s.lookAt).applyMatrix4(inv);
      const flat = Math.hypot(target.x, target.z);
      if (flat < 7 && flat > 0.25 && target.z > -0.6) {
        let yaw = THREE.MathUtils.clamp(Math.atan2(target.x, target.z), -1.1, 1.1);
        const pitch = THREE.MathUtils.clamp(Math.atan2(target.y - eyeHeight, flat), -0.45, 0.4) + (low ? -0.12 : 0);
        if (mood === 'guarded') yaw += Math.sin(t * 0.7 + seed * 9) * 0.28;
        // Where the head is facing now, in the person's own frame.
        root.getWorldQuaternion(qc);
        const ahead = vb.copy(headAhead).applyQuaternion(bones.head.getWorldQuaternion(qa)).applyQuaternion(qb.copy(qc).invert());
        const nowYaw = Math.atan2(ahead.x, ahead.z);
        const nowPitch = Math.asin(THREE.MathUtils.clamp(ahead.y, -1, 1));
        // Someone you are talking to faces you; someone going about their business glances your way.
        const attention = s.talking || s.engaged ? 0.92 : flat < 3.2 ? 0.75 : 0.45;
        turnYaw = THREE.MathUtils.clamp((yaw - nowYaw) * attention, -1.25, 1.25);
        turnPitch = THREE.MathUtils.clamp((pitch - nowPitch) * attention, -0.6, 0.6);
        eyeYaw = THREE.MathUtils.clamp(yaw - nowYaw - look_yaw, -0.38, 0.38);
        eyePitch = THREE.MathUtils.clamp(pitch - nowPitch - look_pitch, -0.2, 0.2);
      }
    }
    bones.eyeL.quaternion.copy(eyeRest[0]);
    bones.eyeR.quaternion.copy(eyeRest[1]);
    const ease = 1 - Math.exp(-dt * 4.5);
    look_yaw += (turnYaw - look_yaw) * ease;
    look_pitch += (turnPitch - look_pitch) * ease;
    if (Math.abs(look_yaw) > 0.002 || Math.abs(look_pitch) > 0.002 || eyeYaw || eyePitch) {
      right.set(1, 0, 0).applyQuaternion(root.getWorldQuaternion(qc));
      for (const [b, share] of [[bones.chest, 0.14], [bones.neck, 0.34], [bones.head, 0.52]]) {
        turnWorld(b, qd.setFromAxisAngle(right, -look_pitch * share).multiply(qb.setFromAxisAngle(UP, look_yaw * share)));
      }
      // The eyes cover what the head has not got to yet.
      if (Math.abs(eyeYaw) > 0.004 || Math.abs(eyePitch) > 0.004) {
        for (const eye of [bones.eyeL, bones.eyeR]) turnWorld(eye, qd.setFromAxisAngle(right, -eyePitch).multiply(qb.setFromAxisAngle(UP, eyeYaw)));
      }
    }

    // Hands that are holding something stay on it, whatever the rest of the body does.
    if (held.L || held.R) {
      root.updateWorldMatrix(true, true);
      for (const side of ['L', 'R']) {
        const grip = held[side];
        if (!grip) continue;
        world.copy(grip.at).applyMatrix4(root.matrixWorld);
        pole.copy(grip.pole).transformDirection(root.matrixWorld);
        reach(bones[side].upper, bones[side].fore, bones[side].hand, world, pole);
      }
    }

    // Face: expression, blinking, speech.
    const face = EXPRESSION[mood] ?? EXPRESSION.calm;
    blinkAt -= dt;
    if (blinkAt <= 0) {
      blink = 0.15;
      blinkAt = (nervous ? 1.1 : 2.4) + Math.random() * 3.8;
    }
    blink = Math.max(0, blink - dt);
    const lid = blink > 0 ? 1 - Math.abs(blink / 0.15 - 0.5) * 2 : 0;
    if (talk > 0.3) {
      mouthAt -= dt;
      if (mouthAt <= 0) {
        viseme = VISEMES[Math.floor(Math.random() * VISEMES.length)];
        visemeTarget = 0.45 + Math.random() * 0.55;
        // Now and then the mouth closes between words.
        if (Math.random() < 0.14) visemeTarget = 0;
        mouthAt = 0.075 + Math.random() * 0.085;
      }
    } else {
      viseme = null;
    }
    const quick = 1 - Math.exp(-dt * 22);
    const slow = 1 - Math.exp(-dt * 6);
    for (const name of allShapes) {
      if (name.startsWith('v_')) {
        const goal = name === viseme ? visemeTarget * talk : 0;
        const w = (speech.get(name) ?? 0) + (goal - (speech.get(name) ?? 0)) * quick;
        speech.set(name, w);
        shape(name, w);
        continue;
      }
      let goal = face[name] ?? 0;
      // A speaking mouth cannot hold a pressed or stretched one as well.
      if (talk > 0.3 && /^(press|stretch|jawOpen|shrug)/.test(name)) goal *= 0.3;
      const w = (weights.get(name) ?? 0) + (goal - (weights.get(name) ?? 0)) * slow;
      weights.set(name, w);
      shape(name, name === 'blinkL' || name === 'blinkR' ? Math.min(1, w + lid) : w);
    }
  }

  function dispose() {
    mixer.stopAllAction();
    mixer.uncacheRoot(rig);
    for (const g of made) g.dispose();
    blob.geometry.dispose();
    // Each skinned part keeps its bones in a small texture of its own; give those back too.
    rig.traverse((o) => {
      if (o.isSkinnedMesh) o.skeleton?.dispose();
    });
  }

  return { root, update, headHeight: eyeHeight, setAccessories, dispose };
}
