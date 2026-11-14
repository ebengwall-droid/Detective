// The 3D world: one room at a time, a first-person camera, the people in the
// room, and the things in it that can be examined.
//
// The world knows nothing about the story. It is handed a location (layout,
// hotspots, people) by the game and reports back what the player touched.

import * as THREE from 'three';
import { buildScene } from './builder.js';
import { buildEnvironment, canvasTexture } from './materials.js';
import { createCharacter } from './characters.js';
import { Nav } from './nav.js';
import { Controls } from './controls.js';

const EYE = 1.62;
const WALK_SPEED = 2.35;
const REACH = 2.3;
const REACH_NPC = 2.7;

const QUALITY = {
  high: { shadows: true, shadowSize: 2048, pixelRatio: 2, maxLights: 9, antialias: true },
  medium: { shadows: true, shadowSize: 1024, pixelRatio: 1.5, maxLights: 7, antialias: true },
  low: { shadows: false, shadowSize: 512, pixelRatio: 1, maxLights: 5, antialias: false },
};

/** Screen markers are drawn white (with a dark edge) and tinted per use. */
function markerTexture(kind) {
  return canvasTexture(`marker:${kind}`, 128, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.save();
    ctx.scale(s / 64, s / 64);
    const c = 32;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(8,14,16,0.9)';
    ctx.lineWidth = 3.5;
    if (kind === 'talk') {
      ctx.fillStyle = 'rgba(255,255,255,0.98)';
      ctx.beginPath();
      ctx.roundRect(9, 11, 46, 31, 10);
      ctx.moveTo(23, 41);
      ctx.lineTo(21, 55);
      ctx.lineTo(37, 41);
      ctx.stroke();
      ctx.fill();
      ctx.fillStyle = 'rgba(8,24,26,0.92)';
      for (const x of [22, 32, 42]) {
        ctx.beginPath();
        ctx.arc(x, 26.5, 3.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.beginPath();
    if (kind === 'exit') {
      ctx.moveTo(c - 13, c + 10);
      ctx.lineTo(c, c - 13);
      ctx.lineTo(c + 13, c + 10);
      ctx.lineTo(c + 5.5, c + 10);
      ctx.lineTo(c, c);
      ctx.lineTo(c - 5.5, c + 10);
    } else {
      ctx.moveTo(c, c - 14);
      ctx.lineTo(c + 11, c);
      ctx.lineTo(c, c + 14);
      ctx.lineTo(c - 11, c);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }, { repeat: false });
}

function markerMaterial(kind) {
  // Markers are interface, not scenery: no fog, no tone mapping, always on top.
  return new THREE.SpriteMaterial({ map: markerTexture(kind), transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
}

export class World {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement} overlay element for the touch joystick
   */
  constructor(canvas, overlay) {
    this.canvas = canvas;
    this.controls = new Controls(canvas, overlay);
    this.listeners = {};
    this.quality = 'medium';
    this.brightness = 1;
    this.mode = 'idle';
    this.player = { x: 0, z: 0, yaw: 0, pitch: 0 };
    this.bob = 0;
    /** @type {import('./builder.js').BuiltScene | null} */
    this.built = null;
    this.nav = null;
    this.locKey = null;
    /** @type {Map<string, any>} */
    this.npcs = new Map();
    /** @type {Map<string, any>} */
    this.hotspots = new Map();
    this.pickables = [];
    this.target = null;
    this.hover = null;
    this.walk = null;
    this.focus = null;
    this.pulseUntil = 0;
    this.time = 0;
    this.running = false;
    this.frameCount = 0;
    this.slowFrames = 0;
    this.raycaster = new THREE.Raycaster();
    this.tmpV = new THREE.Vector3();
    this.ripple = null;

    this.controls.onTap = (x, y) => this.tap(x, y);
    this.controls.onHover = (x, y) => {
      this.hover = { x, y, t: performance.now() };
    };
    this.controls.onKey = (key) => {
      if (key === 'interact') {
        if (this.target) this.interact(this.target);
      } else if (key === 'lock') this.controls.toggleLock();
      else if (key === 'scan') this.pulse();
      else this.emit('key', key);
    };
    this.controls.onLockChange = (locked) => this.emit('lock', locked);
  }

  on(name, fn) {
    (this.listeners[name] ??= []).push(fn);
  }

  emit(name, payload) {
    for (const fn of this.listeners[name] ?? []) fn(payload);
  }

  // ------------------------------------------------------------- set-up

  init({ quality, brightness } = {}) {
    if (quality) this.quality = quality;
    if (brightness) this.brightness = brightness;
    const q = QUALITY[this.quality];
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: q.antialias, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.scene.environment = buildEnvironment(this.renderer);
    this.scene.environmentIntensity = 0.3;
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.06, 90);
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas.parentElement ?? this.canvas);
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.renderer) return;
    const parent = this.canvas.parentElement ?? this.canvas;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    const q = QUALITY[this.quality];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatio));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // A tall phone screen needs a wider vertical field of view to feel right.
    this.baseFov = w / h < 0.8 ? 84 : w / h < 1.2 ? 76 : 66;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.viewport = { w, h };
  }

  setQuality(name) {
    if (!QUALITY[name] || name === this.quality) return;
    this.quality = name;
    this.renderer.shadowMap.enabled = QUALITY[name].shadows;
    this.resize();
    if (this.lastLoc) {
      const pose = { ...this.player };
      this.locKey = null;
      this.loadLocation(this.lastLoc, { pose });
    }
  }

  setBrightness(value) {
    this.brightness = value;
    if (this.built) this.renderer.toneMappingExposure = this.built.exposure * value;
  }

  // ---------------------------------------------------------- locations

  /**
   * Show a location. Rebuilds the room only if it actually changed.
   * @param {any} loc view.location from the game
   * @param {{ pose?: {x:number,z:number,yaw:number,pitch?:number}, respawn?: boolean }} [opts]
   *   respawn: rebuild even if nothing changed and put the player back at the door
   */
  loadLocation(loc, opts = {}) {
    const key = `${loc.id}:${loc.sceneVersion}`;
    const rebuilt = key !== this.locKey || !!opts.respawn;
    this.lastLoc = loc;
    if (rebuilt) {
      const sameRoom = !opts.respawn && this.locKey?.split(':')[0] === loc.id;
      const keep = sameRoom ? { ...this.player } : null;
      const keepFocus = sameRoom ? this.focus : null;
      this.clearLocation();
      const q = QUALITY[this.quality];
      this.built = buildScene(loc.scene, { shadows: q.shadows, shadowSize: q.shadowSize, maxLights: q.maxLights });
      this.scene.add(this.built.root);
      this.built.hooks.lightning = () => this.emit('lightning');
      this.scene.background = new THREE.Color(this.built.fog.color);
      this.scene.fog = new THREE.FogExp2(this.built.fog.color, this.built.fog.density);
      this.renderer.toneMappingExposure = this.built.exposure * this.brightness;
      this.nav = new Nav(this.built);
      this.locKey = key;
      const pose = opts.pose ?? keep;
      if (pose) Object.assign(this.player, { x: pose.x, z: pose.z, yaw: pose.yaw, pitch: pose.pitch ?? 0 });
      else {
        const sp = this.built.spawn;
        const free = this.nav.nearestFree(sp.p[0], sp.p[1]) ?? { x: sp.p[0], z: sp.p[1] };
        Object.assign(this.player, { x: free.x, z: free.z, yaw: ((sp.yaw ?? 0) * Math.PI) / 180, pitch: 0 });
      }
      this.walk = null;
      this.focus = keepFocus;
    }
    this.syncHotspots(loc.hotspots);
    this.syncNpcs(loc.npcs);
    this.rebuildPickables();
    return rebuilt;
  }

  clearLocation() {
    if (this.built) {
      this.scene.remove(this.built.root);
      this.built.dispose();
      this.built = null;
    }
    for (const n of this.npcs.values()) this.scene.remove(n.ch.root, n.marker, n.proxy);
    this.npcs.clear();
    for (const h of this.hotspots.values()) this.scene.remove(h.marker, h.proxy);
    this.hotspots.clear();
    this.pickables = [];
    this.target = null;
    this.emit('target', null);
  }

  syncHotspots(list) {
    const seen = new Set();
    for (const h of list) {
      seen.add(h.id);
      let entry = this.hotspots.get(h.id);
      if (!entry) {
        const anchor = h.at ? this.built.anchors.get(h.at) : null;
        const centre = anchor ? anchor.center.clone() : new THREE.Vector3(h.p?.[0] ?? 0, h.p?.[1] ?? 0.5, h.p?.[2] ?? 0);
        const size = anchor ? anchor.size.clone() : new THREE.Vector3(0.4, 0.4, 0.4);
        if (h.size) size.set(Math.max(size.x, h.size[0]), Math.max(size.y, h.size[1]), Math.max(size.z, h.size[2]));
        size.x = Math.max(size.x, 0.36);
        size.y = Math.max(size.y, 0.36);
        size.z = Math.max(size.z, 0.36);
        const proxy = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ visible: false }));
        proxy.position.copy(centre);
        proxy.userData.pick = { type: 'hotspot', id: h.id };
        const marker = new THREE.Sprite(markerMaterial(h.kind === 'exit' ? 'exit' : 'spot'));
        // Float the marker just above the object, but never above eye line for tall things.
        const top = Math.min(centre.y + size.y / 2 + 0.16, 2.05);
        marker.position.set(centre.x, Math.max(top, 0.35), centre.z);
        marker.renderOrder = 10;
        this.scene.add(proxy, marker);
        entry = { proxy, marker, centre, size, phase: Math.random() * 6 };
        this.hotspots.set(h.id, entry);
      }
      entry.data = h;
    }
    for (const [id, entry] of this.hotspots) {
      if (seen.has(id)) continue;
      this.scene.remove(entry.marker, entry.proxy);
      this.hotspots.delete(id);
    }
  }

  syncNpcs(list) {
    const seen = new Set();
    for (const n of list) {
      seen.add(n.id);
      const sig = JSON.stringify([n.look, n.p, n.r]);
      let entry = this.npcs.get(n.id);
      if (entry && entry.sig !== sig) {
        this.scene.remove(entry.ch.root, entry.marker, entry.proxy);
        this.npcs.delete(n.id);
        entry = null;
      }
      if (!entry) {
        const ch = createCharacter(n.look);
        ch.root.position.set(n.p[0], 0, n.p[1]);
        const baseYaw = ((n.r ?? 0) * Math.PI) / 180;
        ch.root.rotation.y = baseYaw;
        const proxyH = n.look.pose === 'bound' ? 1.0 : n.look.pose === 'sit' ? 1.4 : 1.85;
        const proxy = new THREE.Mesh(new THREE.BoxGeometry(0.7, proxyH, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
        proxy.position.set(n.p[0], proxyH / 2, n.p[1]);
        proxy.userData.pick = { type: 'npc', id: n.id };
        const marker = new THREE.Sprite(markerMaterial('talk'));
        marker.material.color.setHex(0x9fe6d2);
        marker.position.set(n.p[0], ch.headHeight + 0.42, n.p[1]);
        marker.scale.setScalar(0.3);
        marker.renderOrder = 10;
        this.scene.add(ch.root, proxy, marker);
        entry = { ch, proxy, marker, baseYaw, yaw: baseYaw, sig, talking: false, pos: new THREE.Vector3(n.p[0], 0, n.p[1]), head: ch.headHeight };
        this.npcs.set(n.id, entry);
      }
      entry.data = n;
      entry.mood = n.mood;
    }
    for (const [id, entry] of this.npcs) {
      if (seen.has(id)) continue;
      this.scene.remove(entry.ch.root, entry.marker, entry.proxy);
      this.npcs.delete(id);
    }
  }

  rebuildPickables() {
    this.pickables = [...[...this.hotspots.values()].map((h) => h.proxy), ...[...this.npcs.values()].map((n) => n.proxy)];
    // People are solid: walk round them, not through them.
    if (this.nav && this.built) {
      const base = this.built.colliders;
      const withPeople = [...base];
      for (const n of this.npcs.values()) {
        withPeople.push({ minX: n.pos.x - 0.26, maxX: n.pos.x + 0.26, minZ: n.pos.z - 0.26, maxZ: n.pos.z + 0.26 });
      }
      this.nav = new Nav({ ...this.built, colliders: withPeople });
    }
  }

  // --------------------------------------------------------------- modes

  /** 'explore' lets the player move; anything else freezes them. */
  setMode(mode) {
    this.mode = mode;
    this.controls.setEnabled(mode === 'explore');
    if (mode !== 'explore') {
      this.walk = null;
      if (this.target) {
        this.target = null;
        this.emit('target', null);
      }
    }
  }

  /** Turn the camera to a character for conversation. side: where the dialogue panel sits. */
  focusNpc(id, side = 'bottom') {
    const n = this.npcs.get(id);
    if (!n) {
      this.focus = null;
      return;
    }
    const dx = n.pos.x - this.player.x;
    const dz = n.pos.z - this.player.z;
    const dist = Math.max(0.6, Math.hypot(dx, dz));
    let yaw = Math.atan2(-dx, -dz);
    let pitch = Math.atan2(n.head - 0.12 - EYE, dist);
    // Leave room for the panel: push the face toward the free part of the screen.
    if (side === 'bottom') pitch -= 0.33;
    else yaw -= 0.24;
    this.turnTo = null;
    this.focus = { id, yaw, pitch, fov: side === 'bottom' ? this.baseFov - 8 : this.baseFov - 12 };
    for (const [nid, e] of this.npcs) e.talking = false;
  }

  unfocus() {
    this.focus = null;
    for (const e of this.npcs.values()) e.talking = false;
  }

  setTalking(id, on) {
    const n = this.npcs.get(id);
    if (n) n.talking = on;
  }

  setMood(id, mood) {
    const n = this.npcs.get(id);
    if (n) n.mood = mood;
  }

  pulse() {
    this.pulseUntil = this.time + 2.4;
  }

  // ------------------------------------------------------------ picking

  /** What is under a screen point? Nearest hit among hotspots and people. */
  pickAt(x, y) {
    const { w, h } = this.viewport;
    this.raycaster.setFromCamera(new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1), this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    if (hits.length) return { ...hits[0].object.userData.pick, point: hits[0].point };
    return null;
  }

  floorAt(x, y) {
    const { w, h } = this.viewport;
    this.raycaster.setFromCamera(new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1), this.camera);
    const ray = this.raycaster.ray;
    if (ray.direction.y >= -0.02) return null;
    const t = -ray.origin.y / ray.direction.y;
    if (t <= 0 || t > 30) return null;
    return { x: ray.origin.x + ray.direction.x * t, z: ray.origin.z + ray.direction.z * t };
  }

  /** The interactable nearest the centre of the view, within a generous cone. */
  pickCentre() {
    let best = null;
    let bestScore = Infinity;
    const cam = this.camera;
    const dir = cam.getWorldDirection(this.tmpV).clone();
    const consider = (pos, pick, reach) => {
      const to = pos.clone().sub(cam.position);
      const dist = to.length();
      if (dist > reach + 1.6) return;
      const angle = to.normalize().angleTo(dir);
      const limit = dist < 1.4 ? 0.62 : 0.3;
      if (angle > limit) return;
      const score = angle + dist * 0.035;
      if (score < bestScore) {
        bestScore = score;
        best = pick;
      }
    };
    for (const [id, h] of this.hotspots) consider(h.centre, { type: 'hotspot', id }, REACH);
    for (const [id, n] of this.npcs) consider(new THREE.Vector3(n.pos.x, n.head - 0.25, n.pos.z), { type: 'npc', id }, REACH_NPC);
    return best;
  }

  targetPos(t) {
    if (t.type === 'npc') return this.npcs.get(t.id)?.pos ?? null;
    return this.hotspots.get(t.id)?.centre ?? null;
  }

  describe(t) {
    if (!t) return null;
    if (t.type === 'npc') {
      const n = this.npcs.get(t.id);
      return n ? { type: 'npc', id: t.id, label: n.data.name, verb: 'Talk to', kind: 'talk' } : null;
    }
    const h = this.hotspots.get(t.id);
    if (!h) return null;
    const verb = h.data.kind === 'exit' ? '' : h.data.kind === 'use' ? 'Use' : 'Examine';
    return { type: 'hotspot', id: t.id, label: h.data.label, verb, kind: h.data.kind, done: h.data.done };
  }

  tap(x, y) {
    if (this.mode !== 'explore') return;
    const hit = this.pickAt(x, y);
    if (hit) {
      this.interact(hit);
      return;
    }
    const floor = this.floorAt(x, y);
    if (floor && this.nav) {
      const path = this.nav.findPath(this.player, floor, 0);
      if (path?.length) {
        this.walk = { path, then: null };
        this.showRipple(path[path.length - 1]);
      }
    }
  }

  /** Use a thing or person: straight away if in reach, otherwise walk there first. */
  interact(t) {
    const pos = this.targetPos(t);
    if (!pos || this.mode !== 'explore') return;
    const reach = t.type === 'npc' ? REACH_NPC : REACH;
    const dist = Math.hypot(pos.x - this.player.x, pos.z - this.player.z);
    const fire = () => {
      this.faceToward(pos, t.type === 'hotspot' ? pos.y : null);
      this.emit('interact', { type: t.type, id: t.id });
    };
    if (dist <= reach) {
      fire();
      return;
    }
    const path = this.nav.findPath(this.player, { x: pos.x, z: pos.z }, reach - 0.5);
    if (path) {
      this.walk = { path, then: fire, face: pos };
    } else {
      fire();
    }
  }

  /** Turn to look at a point; with a height, tilt so the thing sits clear of the panel that opens below it. */
  faceToward(pos, y = null) {
    const dx = pos.x - this.player.x;
    const dz = pos.z - this.player.z;
    const dist = Math.max(0.5, Math.hypot(dx, dz));
    const pitch = y === null ? 0 : THREE.MathUtils.clamp(Math.atan2(y - EYE, dist) - 0.12, -1.0, 0.45);
    this.turnTo = { yaw: Math.atan2(-dx, -dz), pitch, until: this.time + 1.0 };
  }

  showRipple(p) {
    if (!this.ripple) {
      const tex = canvasTexture('ripple', 64, (ctx, s) => {
        ctx.clearRect(0, 0, s, s);
        ctx.strokeStyle = 'rgba(255,214,150,0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(s / 2, s / 2, s / 2 - 6, 0, Math.PI * 2);
        ctx.stroke();
      }, { repeat: false });
      this.ripple = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      this.ripple.rotation.x = -Math.PI / 2;
      this.ripple.renderOrder = 5;
    }
    this.ripple.position.set(p.x, 0.03, p.z);
    this.ripple.userData.t0 = this.time;
    this.scene.add(this.ripple);
  }

  // ---------------------------------------------------------- main loop

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = () => {
      if (!this.running) return;
      const now = performance.now();
      const dt = Math.min(0.06, (now - this.last) / 1000);
      this.last = now;
      this.frame(dt, now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  frame(dt, now) {
    this.time += dt;
    const t = this.time;
    if (!this.built) return;
    const p = this.player;
    const input = this.controls.read();
    let moving = false;

    if (this.mode === 'explore') {
      p.yaw -= input.look.x * 0.0042;
      p.pitch = THREE.MathUtils.clamp(p.pitch - input.look.y * 0.0042, -1.25, 1.25);
      if (input.look.x || input.look.y) this.turnTo = null;
      const mag = Math.hypot(input.x, input.z);
      if (mag > 0.01) {
        this.walk = null;
        const sin = Math.sin(p.yaw);
        const cos = Math.cos(p.yaw);
        const wx = (input.x * cos - input.z * sin) * WALK_SPEED * dt;
        const wz = (-input.x * sin - input.z * cos) * WALK_SPEED * dt;
        moving = this.nav.move(p, wx, wz);
      } else if (this.walk) {
        moving = this.followPath(dt);
      }
    } else if (this.focus) {
      const k = 1 - Math.exp(-dt * 5);
      p.yaw = lerpAngle(p.yaw, this.focus.yaw, k);
      p.pitch += (this.focus.pitch - p.pitch) * k;
    } else if (this.mode === 'title') {
      p.yaw = this.titleYaw + Math.sin(t * 0.09) * 0.22;
      p.pitch = -0.04 + Math.sin(t * 0.13) * 0.02;
    }

    // Turning to face something carries on while its panel is open.
    if (this.turnTo && this.mode !== 'title' && !(this.focus && this.mode !== 'explore')) {
      p.yaw = lerpAngle(p.yaw, this.turnTo.yaw, 1 - Math.exp(-dt * 8));
      p.pitch += (this.turnTo.pitch - p.pitch) * (1 - Math.exp(-dt * 6));
      if (t > this.turnTo.until) this.turnTo = null;
    }

    const targetFov = this.focus && this.mode !== 'explore' ? this.focus.fov : this.baseFov;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-dt * 4));
      this.camera.updateProjectionMatrix();
    }

    if (moving) {
      this.bob += dt * 9;
      this.stepPhase = (this.stepPhase ?? 0) + dt * 2.1;
      if (this.stepPhase >= 1) {
        this.stepPhase = 0;
        this.emit('step');
      }
    }
    const bobY = moving ? Math.sin(this.bob) * 0.022 : 0;
    this.camera.position.set(p.x, EYE + bobY, p.z);
    this.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ');

    for (const fn of this.built.anims) fn(t, dt);

    // People.
    for (const [id, n] of this.npcs) {
      const facing = (this.focus?.id === id && this.mode !== 'explore') || n.talking;
      const pose = n.data.look.pose;
      const want = facing && pose !== 'sit' && pose !== 'bound' ? Math.atan2(p.x - n.pos.x, p.z - n.pos.z) : n.baseYaw;
      n.yaw = lerpAngle(n.yaw, want, 1 - Math.exp(-dt * 4));
      n.ch.root.rotation.y = n.yaw;
      n.ch.update(t, dt, { lookAt: this.camera.position, talking: n.talking, mood: n.mood });
      const dist = Math.hypot(p.x - n.pos.x, p.z - n.pos.z);
      const pulsing = t < this.pulseUntil;
      n.marker.material.opacity = this.mode === 'explore' ? (pulsing ? 1 : THREE.MathUtils.clamp(1.25 - dist / 7, 0.3, 0.95)) : 0;
      n.marker.position.y = n.head + 0.42 + Math.sin(t * 2 + n.pos.x) * 0.03;
      n.marker.scale.setScalar(0.3 * THREE.MathUtils.clamp(dist / 3.2, 0.85, 2) * (pulsing ? 1.25 : 1));
    }

    // Hotspot markers: bright when new, faint once examined.
    const pulsing = t < this.pulseUntil;
    for (const [id, h] of this.hotspots) {
      const dist = h.centre.distanceTo(this.camera.position);
      const isTarget = this.target?.type === 'hotspot' && this.target.id === id;
      const fresh = !h.data.done;
      let opacity = fresh ? THREE.MathUtils.clamp(1.3 - dist / 8, 0.42, 1) : dist < 3.2 ? 0.22 : 0;
      if (pulsing) opacity = fresh ? 1 : 0.5;
      if (this.mode !== 'explore') opacity = 0;
      const beat = fresh ? 1 + Math.sin(t * 3 + h.phase) * 0.12 : 1;
      const size = (fresh ? 0.25 : 0.13) * beat * (isTarget ? 1.35 : 1) * (pulsing ? 1.3 : 1);
      h.marker.scale.setScalar(size * THREE.MathUtils.clamp(dist / 3.2, 0.7, 2.2));
      h.marker.material.opacity = opacity;
      h.marker.material.color.setHex(h.data.kind === 'exit' ? 0x9fd8c8 : fresh ? 0xffc46a : 0xb8c4c4);
    }

    if (this.ripple?.parent) {
      const age = t - this.ripple.userData.t0;
      this.ripple.scale.setScalar(1 + age * 1.6);
      this.ripple.material.opacity = Math.max(0, 0.9 - age * 1.5);
      if (age > 0.7) this.scene.remove(this.ripple);
    }

    // Work out what the player is looking at, a few times a second.
    if (this.mode === 'explore' && this.frameCount % 4 === 0) {
      let cand = null;
      const hoverFresh = this.hover && now - this.hover.t < 2500 && !this.controls.locked && !this.controls.isTouch;
      if (hoverFresh) cand = this.pickAt(this.hover.x, this.hover.y);
      if (!cand) cand = this.pickCentre();
      const changed = (cand?.type ?? '') + (cand?.id ?? '') !== (this.target?.type ?? '') + (this.target?.id ?? '');
      if (changed) {
        this.target = cand ? { type: cand.type, id: cand.id } : null;
        this.emit('target', this.describe(this.target));
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.frameCount++;

    // If the frame rate is poor for a while, step the quality down once.
    if (dt > 0.05) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 90 && this.quality !== 'low' && !this.noAutoQuality) {
      this.slowFrames = 0;
      this.emit('slow', this.quality);
    }
  }

  followPath(dt) {
    const p = this.player;
    const w = this.walk;
    const next = w.path[0];
    if (!next) {
      const then = w.then;
      this.walk = null;
      then?.();
      return false;
    }
    const dx = next.x - p.x;
    const dz = next.z - p.z;
    const dist = Math.hypot(dx, dz);
    const step = WALK_SPEED * dt;
    // Look where we are going, gently, unless the player is steering the view.
    const yaw = Math.atan2(-dx, -dz);
    if (dist > 0.25) p.yaw = lerpAngle(p.yaw, yaw, 1 - Math.exp(-dt * 5));
    p.pitch += (0 - p.pitch) * (1 - Math.exp(-dt * 3));
    if (dist <= step) {
      p.x = next.x;
      p.z = next.z;
      w.path.shift();
      return true;
    }
    const ok = this.nav.move(p, (dx / dist) * step, (dz / dist) * step);
    w.stuck = ok ? 0 : (w.stuck ?? 0) + dt;
    if (w.stuck > 0.6) {
      const then = w.then;
      this.walk = null;
      then?.();
    }
    return ok;
  }

  /** Slow drifting camera for the title screen. */
  titleShot(pose) {
    this.setMode('title');
    Object.assign(this.player, { x: pose.x, z: pose.z, yaw: (pose.yaw * Math.PI) / 180, pitch: 0 });
    this.titleYaw = this.player.yaw;
  }

  // ----------------------------------------------------------- portraits

  /** Render a head-and-shoulders picture of a character; returns a data URL. */
  portrait(look, size = 160) {
    this.portraitCache ??= new Map();
    const key = JSON.stringify(look) + size;
    if (this.portraitCache.has(key)) return this.portraitCache.get(key);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16232a);
    const ch = createCharacter({ ...look, pose: 'stand' });
    ch.update(0, 0.016, {});
    scene.add(ch.root);
    scene.add(new THREE.HemisphereLight(0x9fb8c8, 0x3a2a1c, 1.4));
    const key1 = new THREE.DirectionalLight(0xffd8a8, 2.6);
    key1.position.set(1.2, 2.4, 2);
    scene.add(key1);
    const rim = new THREE.DirectionalLight(0x86b8d0, 1.6);
    rim.position.set(-2, 2, -1.5);
    scene.add(rim);
    const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 10);
    const h = ch.headHeight;
    cam.position.set(0.28, h + 0.02, 1.55);
    cam.lookAt(0, h - 0.06, 0);
    const rt = new THREE.WebGLRenderTarget(size, size);
    const prevTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(rt);
    this.renderer.render(scene, cam);
    const pixels = new Uint8Array(size * size * 4);
    this.renderer.readRenderTargetPixels(rt, 0, 0, size, size, pixels);
    this.renderer.setRenderTarget(prevTarget);
    rt.dispose();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    // The target holds linear light and is upside-down relative to a canvas.
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const src = ((size - 1 - y) * size + x) * 4;
        const dst = (y * size + x) * 4;
        for (let c = 0; c < 3; c++) {
          const v = pixels[src + c] / 255;
          img.data[dst + c] = Math.round(255 * Math.pow(Math.min(1, v * 1.15), 1 / 2.2));
        }
        img.data[dst + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.86);
    this.portraitCache.set(key, url);
    return url;
  }
}

function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
