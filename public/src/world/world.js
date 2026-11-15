// The 3D world: one room at a time, a first-person camera, the people in the
// room, and the things in it that can be examined.
//
// The world knows nothing about the story. It is handed a location (layout,
// hotspots, people) by the game and reports back what the player touched.

import * as THREE from 'three';
import { buildScene } from './builder.js';
import { buildEnvironment, canvasTexture, useSurfaces } from './materials.js';
import { createCharacter, figureLight } from './characters.js';
import { assets } from './assets.js';
import { modelsFor } from './dress.js';
import { setNightView } from './glass.js';
import { Nav } from './nav.js';
import { Controls } from './controls.js';
import { Post } from './post.js';

const EYE = 1.62;
const WALK_SPEED = 2.35;
const REACH = 2.3;
const REACH_NPC = 2.7;

// post: the finishing pass (bloom, focus, grade). samples: edge smoothing for
// the room itself. detail: how much geometry the room is given (bevels, dust).
/**
 * What each setting pays for. Every one of them keeps the finishing pass: a
 * slow phone gives up occlusion, focus blur and shadows in that order, and
 * some sharpness, but never the tone curve and the grade, which cost almost
 * nothing and are most of what makes the picture look finished. "lean" sits
 * between Medium and Low for the game to step down to by itself.
 */
const QUALITY = {
  high: { shadows: true, shadowSize: 2048, pixelRatio: 2, maxLights: 9, post: true, lite: false, samples: 4, detail: 2, ao: 12, dof: true },
  medium: { shadows: true, shadowSize: 1024, pixelRatio: 1.75, maxLights: 7, post: true, lite: false, samples: 2, detail: 1, ao: 6, dof: true },
  lean: { shadows: true, shadowSize: 512, pixelRatio: 1.5, maxLights: 6, post: true, lite: true, samples: 0, detail: 1, ao: 0, dof: false },
  low: { shadows: false, shadowSize: 512, pixelRatio: 1.25, maxLights: 5, post: true, lite: true, samples: 0, detail: 0, ao: 0, dof: false },
};
/** The order the game steps down in when frames run slow. */
/** How bright the close-up key light is at full (candela, before exposure). */
const KEY_LIGHT = 3.2;
export const STEP_DOWN = { high: 'medium', medium: 'lean', lean: 'low' };

/**
 * Screen markers: a point of light with a fine ring round it, drawn white and
 * tinted per use. Something to look at rather than a symbol to read; a person
 * gets three small dots in the ring, a way out gets a chevron.
 */
function markerTexture(kind) {
  return canvasTexture(`marker2:${kind}`, 128, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.save();
    ctx.scale(s / 64, s / 64);
    const c = 32;
    // A breath of dark behind it, so it holds against a lit wall; then the glow.
    let g = ctx.createRadialGradient(c, c, 4, c, c, 30);
    g.addColorStop(0, 'rgba(0,0,0,0.34)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    g = ctx.createRadialGradient(c, c, 0, c, c, 26);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(c, c, kind === 'spot' ? 11.5 : 14, 0, Math.PI * 2);
    ctx.stroke();
    if (kind === 'talk') {
      for (const x of [-6, 0, 6]) {
        ctx.beginPath();
        ctx.arc(c + x, c, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === 'exit') {
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(c - 6, c + 3);
      ctx.lineTo(c, c - 4);
      ctx.lineTo(c + 6, c + 3);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(c, c, 4.6, 0, Math.PI * 2);
      ctx.fill();
    }
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
    this.restPitch = 0;
    /** The player has asked for less motion. */
    this.still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    // The stylesheet drops its frosted-glass blur on the lowest setting.
    document.documentElement.dataset.quality = this.quality;
    // Decided once, before anything is fetched: smaller pictures on anything but the highest setting.
    assets.lite = this.quality !== 'high';
    // No canvas antialiasing: with the finishing pass the room is smoothed in
    // its own off-screen picture, and without it speed matters more.
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    try {
      this.post = new Post(this.renderer);
    } catch (err) {
      console.warn('No finishing pass on this device:', err?.message);
      this.post = null;
    }
    this.scene = new THREE.Scene();
    // A key light for close-ups: when you talk to someone, a soft lamp comes up on their face from
    // beside the camera, the way a film would light them. It is always in the scene (dark when not
    // in use), so starting a conversation never changes how many lights the shaders are built for.
    this.keyLight = new THREE.SpotLight(0xfff0df, 0, 7, 0.42, 1, 1.6);
    this.keyLight.castShadow = false;
    this.keyAmt = 0;
    this.scene.add(this.keyLight, this.keyLight.target);
    /** Markers are drawn after everything else, crisp and unblurred. */
    this.overlay = new THREE.Scene();
    this.scene.environment = buildEnvironment(this.renderer);
    this.scene.environmentIntensity = 0.3;
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.06, 90);
    this.resize();
    this.fetchSurroundings();
    // Phones take the graphics context away when the game is put in the
    // background for a while. When it comes back, lay the room out again.
    this.canvas.addEventListener('webglcontextrestored', () => {
      // Everything the finishing pass kept on the graphics card went with the old context: build it afresh.
      try {
        this.post?.dispose();
      } catch {
        /* nothing of it is left to give back */
      }
      // The photographed room that shiny things reflect was baked on the card too: bake it again.
      this.photoEnvironment = null;
      if (this.got) this.got.light = false;
      this.scene.environment = buildEnvironment(this.renderer);
      this.scene.environmentIntensity = 0.3;
      this.surroundings = null;
      this.portraitCache?.clear();
      if (this.lastLoc) {
        const pose = { ...this.player };
        const focus = this.focus;
        this.locKey = null;
        this.loadLocation(this.lastLoc, { pose });
        this.focus = focus;
      }
    });
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
    const ratio = Math.min(window.devicePixelRatio || 1, q.pixelRatio);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    if (this.post && q.post) {
      this.post.configure({ ao: q.ao, dof: q.dof, lite: q.lite });
      this.post.setSize(w, h, ratio, q.samples);
    }
    this.camera.aspect = w / h;
    // A tall phone screen needs a wider vertical field of view to feel right.
    this.baseFov = w / h < 0.8 ? 84 : w / h < 1.2 ? 76 : 66;
    // Held upright, a level gaze is half ceiling: tip it down a little so the room, not the roof, fills the screen.
    this.restPitch = w / h < 0.8 ? -0.13 : w / h < 1.2 ? -0.06 : 0;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.viewport = { w, h };
  }

  setQuality(name) {
    if (!QUALITY[name] || name === this.quality) return;
    this.quality = name;
    document.documentElement.dataset.quality = name;
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
  /**
   * Photographed floors and walls, and a photographed room for everything shiny to reflect.
   * Fetched once; until they land the painted surfaces and a painted sky stand in.
   */
  fetchSurroundings() {
    if (!assets.things || this.surroundings) return;
    this.got ??= { surfaces: false, light: false, night: false };
    const got = this.got;
    if (got.surfaces && got.light && got.night) return;
    const job = Promise.all([
      got.surfaces ||
        assets.loadSurfaces().then((ok) => {
          if (!ok) return;
          got.surfaces = true;
          useSurfaces((name) => assets.surface(name));
        }),
      got.light ||
        assets.loadEnvironment().then((picture) => {
          if (!picture) return;
          got.light = true;
          const pmrem = new THREE.PMREMGenerator(this.renderer);
          this.photoEnvironment = pmrem.fromEquirectangular(picture).texture;
          this.scene.environment = this.photoEnvironment;
          this.scene.environmentIntensity = 0.42;
          picture.dispose();
          pmrem.dispose();
        }),
      got.night ||
        assets.loadNight().then((picture) => {
          if (!picture) return;
          got.night = true;
          setNightView(picture);
        }),
    ]).then(() => {
      // Whatever did not arrive is asked for again with the next room, rather than given up on.
      if (this.surroundings === job) this.surroundings = null;
    });
    this.surroundings = job;
  }

  /**
   * Fetch the furniture and prop models this room wants and are not in memory yet.
   * The room is built with what there is, and built again once the rest has landed.
   */
  fetchModels(loc, again = 0) {
    if (!assets.things) return;
    const wanted = modelsFor(loc.scene.props).filter((name) => assets.things.models[name]);
    const missing = wanted.filter((name) => !assets.prop(name));
    if (!missing.length) return this.fetchAhead();
    const waitingFor = loc;
    const job = assets.loadProps(missing).then(() => {
      if (this.modelJob === job) this.modelJob = null;
      if (this.lastLoc !== waitingFor && this.lastLoc?.id !== waitingFor.id) return;
      const landed = missing.some((name) => assets.prop(name));
      const still = missing.filter((name) => !assets.prop(name));
      if (landed) {
        const pose = { ...this.player };
        const focus = this.focus;
        this.locKey = null;
        this.loadLocation(this.lastLoc, { pose });
        this.focus = focus;
      }
      // Something would not come: keep asking while the player is still in the room, a few times.
      if (still.length && again < 4) {
        this.emit('missing', { kind: 'models', names: still });
        clearTimeout(this.modelRetry);
        this.modelRetry = setTimeout(() => {
          if (this.lastLoc?.id === waitingFor.id && !this.modelJob) this.fetchModels(this.lastLoc, again + 1);
        }, 13000);
      } else if (!still.length) this.fetchAhead();
    });
    this.modelJob = job;
  }

  /**
   * Once the room on screen has what it needs, fetch the rest of the game quietly, a little at a
   * time, so that later rooms open at once and a patchy connection has been and gone by then.
   */
  fetchAhead() {
    if (this.aheadStarted || !assets.things || this.noFetchAhead) return;
    this.aheadStarted = true;
    assets.loadProps(Object.keys(assets.things.models), true);
  }

  /** The manifests arrived late (a bad start on a bad connection): build the room again with what they offer. */
  assetsArrived() {
    this.surroundings = null;
    if (!this.lastLoc) return;
    const pose = { ...this.player };
    const focus = this.focus;
    this.locKey = null;
    this.loadLocation(this.lastLoc, { pose });
    this.focus = focus;
  }

  loadLocation(loc, opts = {}) {
    const key = `${loc.id}:${loc.sceneVersion}`;
    const rebuilt = key !== this.locKey || !!opts.respawn;
    this.lastLoc = loc;
    if (rebuilt) this.fetchModels(loc);
    if (rebuilt) this.fetchSurroundings();
    if (rebuilt) {
      const sameRoom = !opts.respawn && this.locKey?.split(':')[0] === loc.id;
      const keep = sameRoom ? { ...this.player } : null;
      const keepFocus = sameRoom ? this.focus : null;
      this.clearLocation();
      if (this.locKey?.split(':')[0] !== loc.id) assets.release();
      const q = QUALITY[this.quality];
      this.built = buildScene(loc.scene, { shadows: q.shadows, shadowSize: q.shadowSize, maxLights: q.maxLights, detail: q.detail, post: !!(this.post && q.post) });
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
        // A room may say how far to tip the first look (spawn.pitch, degrees); otherwise the screen's shape decides.
        Object.assign(this.player, { x: free.x, z: free.z, yaw: ((sp.yaw ?? 0) * Math.PI) / 180, pitch: sp.pitch === undefined ? this.restPitch : (sp.pitch * Math.PI) / 180 });
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
    for (const n of this.npcs.values()) {
      this.scene.remove(n.ch.root, n.proxy);
      this.overlay.remove(n.marker);
      n.ch.dispose();
    }
    this.npcs.clear();
    for (const h of this.hotspots.values()) {
      this.scene.remove(h.proxy);
      this.overlay.remove(h.marker);
    }
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
        this.scene.add(proxy);
        this.overlay.add(marker);
        entry = { proxy, marker, centre, size, phase: Math.random() * 6 };
        this.hotspots.set(h.id, entry);
      }
      entry.data = h;
    }
    for (const [id, entry] of this.hotspots) {
      if (seen.has(id)) continue;
      this.scene.remove(entry.proxy);
      this.overlay.remove(entry.marker);
      this.hotspots.delete(id);
    }
  }

  /**
   * Fetch the modelled people this place needs and are not in memory yet.
   * Until they arrive anyone missing is drawn in code; they are swapped the moment the files land.
   */
  fetchPeople(list, again = 0) {
    const missing = [...new Set(list.map((n) => n.look?.model).filter((id) => id && assets.people?.characters[id] && !assets.person(id)))];
    if (!missing.length || !assets.people) return;
    const job = assets.loadPeople(missing).then(() => {
      if (this.loading === job) this.loading = null;
      if (this.lastLoc) {
        this.syncNpcs(this.lastLoc.npcs);
        this.rebuildPickables();
      }
      // Somebody would not come: keep asking while they are in the room, a few times.
      const still = missing.filter((id) => !assets.person(id));
      if (still.length && again < 4) {
        this.emit('missing', { kind: 'people', names: still });
        clearTimeout(this.peopleRetry);
        this.peopleRetry = setTimeout(() => {
          if (this.lastLoc && !this.loading) this.fetchPeople(this.lastLoc.npcs, again + 1);
        }, 13000);
      }
      // Everyone else, quietly, so that nobody is ever a stand-in again.
      if (!this.castFetched && !this.noFetchAhead) {
        this.castFetched = true;
        assets.loadPeople(Object.keys(assets.people.characters), true).then(() => this.portraitCache?.clear());
      }
    });
    this.loading = job;
  }

  /** Resolves once the place on screen has everything it was waiting for (or has waited long enough). */
  whenReady(limit = 15000) {
    const jobs = [this.loading, this.modelJob, this.surroundings].filter(Boolean);
    if (!jobs.length) return Promise.resolve();
    // One thing landing can start another (a room rebuilt for its furniture asks again for its people).
    const settle = Promise.all(jobs).then(() => (this.loading || this.modelJob ? this.whenReady(limit) : undefined));
    return Promise.race([settle, new Promise((r) => setTimeout(r, limit))]);
  }

  syncNpcs(list) {
    const seen = new Set();
    this.fetchPeople(list);
    for (const n of list) {
      seen.add(n.id);
      const sig = JSON.stringify([n.look, n.p, n.r, !!assets.person(n.look?.model)]);
      let entry = this.npcs.get(n.id);
      if (entry && entry.sig !== sig) {
        this.scene.remove(entry.ch.root, entry.proxy);
        this.overlay.remove(entry.marker);
        entry.ch.dispose();
        this.npcs.delete(n.id);
        entry = null;
      }
      if (!entry) {
        const ch = createCharacter(n.look);
        ch.root.position.set(n.p[0], 0, n.p[1]);
        const baseYaw = ((n.r ?? 0) * Math.PI) / 180;
        ch.root.rotation.y = baseYaw;
        const proxyH = n.look.pose === 'bound' || n.look.pose === 'slumped' ? 1.0 : n.look.pose === 'sit' ? 1.4 : 1.85;
        const proxy = new THREE.Mesh(new THREE.BoxGeometry(0.7, proxyH, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
        proxy.position.set(n.p[0], proxyH / 2, n.p[1]);
        proxy.userData.pick = { type: 'npc', id: n.id };
        const marker = new THREE.Sprite(markerMaterial('talk'));
        marker.material.color.setHex(0x9fe6d2);
        marker.position.set(n.p[0], ch.headHeight + 0.42, n.p[1]);
        marker.scale.setScalar(0.3);
        marker.renderOrder = 10;
        this.scene.add(ch.root, proxy);
        this.overlay.add(marker);
        entry = { ch, proxy, marker, baseYaw, yaw: baseYaw, sig, talking: false, pos: new THREE.Vector3(n.p[0], 0, n.p[1]), head: ch.headHeight };
        this.npcs.set(n.id, entry);
      }
      entry.data = n;
      entry.mood = n.mood;
    }
    for (const [id, entry] of this.npcs) {
      if (seen.has(id)) continue;
      this.scene.remove(entry.ch.root, entry.proxy);
      this.overlay.remove(entry.marker);
      entry.ch.dispose();
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

  /**
   * Turn the camera to a character for conversation and put their face in the
   * middle of whatever the panel leaves free.
   * @param {string} id
   * @param {'bottom'|'right'} side where the conversation panel sits
   * @param {number} [frac] how much of the height (bottom) or width (right) it covers
   */
  focusNpc(id, side = 'bottom', frac = side === 'bottom' ? 0.6 : 0.42, rail = 0) {
    const n = this.npcs.get(id);
    if (!n) {
      this.focus = null;
      return;
    }
    let dx = n.pos.x - this.player.x;
    let dz = n.pos.z - this.player.z;
    let dist = Math.max(0.6, Math.hypot(dx, dz));
    // Nose to nose is no way to hold a conversation: take a step back if there is room.
    let stand = null;
    const COMFORT = 1.7;
    if (dist < COMFORT - 0.15 && this.nav) {
      const back = { x: n.pos.x - (dx / dist) * COMFORT, z: n.pos.z - (dz / dist) * COMFORT };
      if (this.nav.isFree(back.x, back.z) && this.nav.lineFree(this.player.x, this.player.z, back.x, back.z)) {
        stand = back;
        dx = n.pos.x - back.x;
        dz = n.pos.z - back.z;
        dist = COMFORT;
      }
    }
    // A portrait lens: long enough to flatter a face and let the room fall away behind it,
    // from a little under their eye line rather than from the detective's full height.
    const tall = this.camera.aspect < 0.8;
    const fov = side === 'bottom' ? (tall ? 44 : 40) : 34;
    const half = Math.tan((fov * Math.PI) / 360);
    const f = THREE.MathUtils.clamp(frac, 0, 0.8);
    const eye = THREE.MathUtils.clamp(n.head - 0.16, 1.02, EYE);
    let yaw = Math.atan2(-dx, -dz);
    let pitch = Math.atan2(n.head - 0.1 - eye, dist);
    // Looking past someone by this much lands them at the centre of the free part of the screen.
    if (side === 'bottom') {
      pitch -= Math.atan(f * half);
      // A rail of buttons down one edge: stand them in the middle of what is left beside it.
      yaw -= Math.atan(THREE.MathUtils.clamp(rail, 0, 0.3) * half * this.camera.aspect);
    } else yaw -= Math.atan(f * half * this.camera.aspect);
    this.turnTo = null;
    this.focus = { id, yaw, pitch: Math.max(-1.1, pitch), fov, stand, eye };
    for (const e of this.npcs.values()) e.talking = false;
  }

  unfocus() {
    this.focus = null;
    for (const e of this.npcs.values()) {
      e.talking = false;
      e.thinking = false;
    }
  }

  setTalking(id, on) {
    const n = this.npcs.get(id);
    if (n) n.talking = on;
  }

  /** Somebody working out what to say: their eyes leave you for a moment. */
  setThinking(id, on) {
    const n = this.npcs.get(id);
    if (n) n.thinking = on;
  }

  setMood(id, mood) {
    const n = this.npcs.get(id);
    if (n) n.mood = mood;
  }

  pulse() {
    this.pulseUntil = this.time + 2.4;
  }

  // ------------------------------------------------------------ picking

  /** What is under a screen point? A marker if one is close, otherwise the nearest thing hit. */
  pickAt(x, y) {
    const { w, h } = this.viewport;
    // People aim for the glowing marker, which floats above the thing itself.
    let best = null;
    let bestDist = this.controls.isTouch ? 36 : 22;
    const near = (marker, pick) => {
      if (marker.material.opacity < 0.08) return;
      const v = this.tmpV.copy(marker.position).project(this.camera);
      if (v.z < -1 || v.z > 1) return;
      const d = Math.hypot(((v.x + 1) / 2) * w - x, ((1 - v.y) / 2) * h - y);
      if (d < bestDist) {
        bestDist = d;
        best = pick;
      }
    };
    for (const [id, hs] of this.hotspots) near(hs.marker, { type: 'hotspot', id });
    for (const [id, n] of this.npcs) near(n.marker, { type: 'npc', id });
    if (best) return best;
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
      this.raf = requestAnimationFrame(loop);
      const now = performance.now();
      // Sixty frames a second is plenty. On a 120 Hz phone drawing every
      // refresh would double the heat and halve the battery for nothing.
      if (now - this.last < 14.5) return;
      const dt = Math.min(0.06, (now - this.last) / 1000);
      this.last = now;
      // Nothing to draw while a full-screen panel hides the room.
      if (this.covered) return;
      this.frame(dt, now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  frame(dt, now) {
    this.lastDt = dt;
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
      if (this.focus.stand) {
        p.x += (this.focus.stand.x - p.x) * k;
        p.z += (this.focus.stand.z - p.z) * k;
      }
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
    // In a conversation the camera comes down to the other person's eye line, and goes back up after.
    const eyeWant = this.focus && this.mode !== 'explore' ? (this.focus.eye ?? EYE) : EYE;
    this.eyeY = (this.eyeY ?? EYE) + (eyeWant - (this.eyeY ?? EYE)) * (1 - Math.exp(-dt * 4));
    this.camera.position.set(p.x, this.eyeY + bobY, p.z);
    // The camera is held, not bolted down: the faintest drift keeps the picture alive. Most in a
    // close-up, a little when you stand and look at a room, none while you walk or if motion is unwelcome.
    const swayWant = this.still ? 0 : this.focus && this.mode !== 'explore' ? 1 : this.mode === 'explore' && !moving ? 0.45 : 0;
    this.sway = (this.sway ?? 0) + (swayWant - (this.sway ?? 0)) * (1 - Math.exp(-dt * 2));
    const held = this.sway;
    this.camera.rotation.set(p.pitch + Math.sin(t * 0.83) * 0.0026 * held, p.yaw + Math.sin(t * 0.61 + 1.3) * 0.0032 * held, Math.sin(t * 0.37) * 0.0014 * held, 'YXZ');

    for (const fn of this.built.anims) fn(t, dt);

    // The key light: up on whoever you are talking to, down again when you look away.
    const lit = this.focus && this.mode !== 'explore' ? this.npcs.get(this.focus.id) : null;
    this.keyAmt += ((lit ? 1 : 0) - this.keyAmt) * (1 - Math.exp(-dt * 3.2));
    if (lit) {
      // From beside and a little above the lens, so the face has a lit side and a modelled one.
      const cy = Math.cos(p.yaw);
      const sy = Math.sin(p.yaw);
      this.keyLight.position.set(p.x + cy * 0.55, this.eyeY + 0.34, p.z - sy * 0.55);
      this.keyLight.target.position.set(lit.pos.x, lit.head - 0.08, lit.pos.z);
    }
    this.keyLight.intensity = this.keyAmt < 0.004 ? 0 : KEY_LIGHT * this.keyAmt;

    // People.
    for (const [id, n] of this.npcs) {
      const facing = (this.focus?.id === id && this.mode !== 'explore') || n.talking;
      const pose = n.data.look.pose;
      const want = facing && pose !== 'sit' && pose !== 'bound' && pose !== 'slumped' ? Math.atan2(p.x - n.pos.x, p.z - n.pos.z) : n.baseYaw;
      n.yaw = lerpAngle(n.yaw, want, 1 - Math.exp(-dt * 4));
      n.ch.root.rotation.y = n.yaw;
      n.ch.update(t, dt, { lookAt: this.camera.position, talking: n.talking, thinking: n.thinking && !this.still, mood: n.mood, engaged: this.focus?.id === n.data?.id });
      const dist = Math.hypot(p.x - n.pos.x, p.z - n.pos.z);
      const pulsing = t < this.pulseUntil;
      n.marker.material.opacity = this.mode === 'explore' ? (pulsing ? 1 : THREE.MathUtils.clamp(1.4 - dist / 9, 0.6, 1)) : 0;
      n.marker.position.y = n.head + 0.42 + Math.sin(t * 2 + n.pos.x) * 0.03;
      n.marker.scale.setScalar(0.3 * THREE.MathUtils.clamp(dist / 3.2, 0.85, 2) * (pulsing ? 1.25 : 1));
    }

    // Hotspot markers: bright when new, faint once examined.
    const pulsing = t < this.pulseUntil;
    for (const [id, h] of this.hotspots) {
      const dist = h.centre.distanceTo(this.camera.position);
      const isTarget = this.target?.type === 'hotspot' && this.target.id === id;
      const fresh = !h.data.done;
      let opacity = fresh ? THREE.MathUtils.clamp(1.4 - dist / 9, 0.6, 1) : dist < 3.2 ? 0.22 : 0;
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

    this.draw(t);
    this.frameCount++;

    // If the frame rate is poor for a while, step the quality down once.
    if (dt > 0.042) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 90 && STEP_DOWN[this.quality] && !this.noAutoQuality) {
      this.slowFrames = 0;
      this.emit('slow', this.quality);
    }
  }

  /** Put the frame on screen: the room through the finishing pass where there is one, then the markers. */
  draw(t) {
    const r = this.renderer;
    const q = QUALITY[this.quality];
    const exposure = this.built.exposure * this.brightness;
    // Keep faces within what the picture can hold (see figureLight).
    figureLight.value = this.post && q.post ? 0.9 / Post.gain(exposure) : 100;
    if (this.post && q.post) {
      try {
        // In a conversation, focus on the speaker and let the room behind them go soft.
        const talking = this.focus && this.mode !== 'explore' ? this.npcs.get(this.focus.id) : null;
        const want = talking ? 1 : this.mode === 'title' ? 0.7 : 0;
        // By the clock, not by the frame: a slow device should not leave the room blurred for seconds after a conversation.
        this.dof = (this.dof ?? 0) + (want - (this.dof ?? 0)) * (1 - Math.exp(-(this.lastDt ?? 0.016) * 6));
        const focus = talking ? Math.hypot(talking.pos.x - this.player.x, talking.pos.z - this.player.z) : 2.4;
        this.post.render(this.scene, this.camera, { exposure, dof: this.dof < 0.01 ? 0 : this.dof, focus, time: t, dt: this.lastDt, bloom: 0.55 });
      } catch (err) {
        console.warn('Finishing pass failed; drawing plainly from here on:', err?.message);
        this.post = null;
      }
    }
    if (!this.post || !q.post) {
      r.toneMappingExposure = exposure;
      r.setRenderTarget(null);
      r.render(this.scene, this.camera);
    }
    r.autoClear = false;
    r.render(this.overlay, this.camera);
    r.autoClear = true;

    // The interface is glass standing in the room: as you turn, the light along its edges turns too.
    // A few degrees at a time, and not more than a dozen times a second; not at all on the lowest setting.
    if (!this.still && this.quality !== 'low') {
      const tilt = Math.round(((this.player.yaw * 180) / Math.PI) * 0.4 + ((this.player.pitch * 180) / Math.PI) * 0.6);
      if (tilt !== this.lastTilt && t - (this.tiltAt ?? -1) > 0.08) {
        this.lastTilt = tilt;
        this.tiltAt = t;
        this.emit('tilt', tilt);
      }
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
    p.pitch += (this.restPitch - p.pitch) * (1 - Math.exp(-dt * 3));
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
  portrait(look, size = 208) {
    this.portraitCache ??= new Map();
    const real = !!assets.person(look.model);
    const key = JSON.stringify(look) + size + real;
    if (this.portraitCache.has(key)) return this.portraitCache.get(key);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1b2736);
    const ch = createCharacter({ ...look, pose: 'stand', accessories: (look.accessories ?? []).filter((a) => a !== 'cane') });
    ch.update(0, 0.016, { clip: 'idle_breathe' });
    scene.add(ch.root);
    scene.environment = this.scene.environment;
    scene.environmentIntensity = 0.5;
    scene.add(new THREE.HemisphereLight(0xa9c0d4, 0x7a6858, real ? 1.1 : 1.5));
    const key1 = new THREE.DirectionalLight(0xffdcb0, 2.7);
    key1.position.set(1.2, 2.2, 2.2);
    scene.add(key1);
    const rim = new THREE.DirectionalLight(0x7fc6dc, 1.8);
    rim.position.set(-2, 2, -1.5);
    scene.add(rim);
    // Close enough to be a face at the size of a thumbnail.
    const cam = new THREE.PerspectiveCamera(17.5, 1, 0.1, 10);
    const h = ch.headHeight;
    cam.position.set(0.24, h + 0.03, 1.42);
    cam.lookAt(0, h - 0.002, 0);
    const rt = new THREE.WebGLRenderTarget(size, size);
    const prevTarget = this.renderer.getRenderTarget();
    const prevLimit = figureLight.value;
    figureLight.value = 100; // a studio picture, lit on purpose
    this.renderer.setRenderTarget(rt);
    this.renderer.render(scene, cam);
    figureLight.value = prevLimit;
    const pixels = new Uint8Array(size * size * 4);
    this.renderer.readRenderTargetPixels(rt, 0, 0, size, size, pixels);
    this.renderer.setRenderTarget(prevTarget);
    rt.dispose();
    ch.dispose();
    if (real && ![...this.npcs.values()].some((n) => n.data?.look?.model === look.model)) {
      const file = assets.personFile(look.model)?.file;
      assets.release((f) => f !== file);
    }
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
