// Loading of authored assets: character models, motion clips, props, textures.
//
// Everything is fetched from one base address (set by the page: the server's
// /assets/, or files published beside a hosted page), cached, and handed out
// synchronously afterwards, so building a room stays a plain function call.
// If something cannot be fetched the game still runs: whoever asked gets null
// and falls back to drawing the thing in code.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const pictures = new THREE.TextureLoader();
/** @type {Map<string, {d: THREE.Texture, n: THREE.Texture|null, r: THREE.Texture|null, metres: number}>} */
const surfaces = new Map();

/** @type {Map<string, Promise<any>>} */
const pending = new Map();
/** @type {Map<string, any>} */
const ready = new Map();
const failed = new Set();

export const assets = {
  base: 'assets/',
  /** @type {{characters: Record<string, any>, anims: Record<string, any>}|null} */
  people: null,
  /** Bytes fetched so far and expected, for a progress line. */
  progress: { done: 0, total: 0 },

  /** @type {{models: Record<string, any>, textures: Record<string, any>, env?: any}|null} */
  things: null,

  /** Read the manifests. Safe to call more than once. */
  async init(base) {
    if (base) this.base = base.endsWith('/') ? base : `${base}/`;
    if (this.people || this.things) return true;
    const read = async (file) => {
      try {
        const res = await fetch(this.base + file);
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    };
    [this.people, this.things] = await Promise.all([read('characters.json'), read('props.json')]);
    return !!(this.people || this.things);
  },

  /** Make sure these furniture and prop models are loaded. */
  async loadProps(names, onProgress) {
    if (!this.things) return false;
    const todo = [...new Set(names)].map((n) => this.things.models[n]).filter((m) => m && !ready.has(m.file) && !failed.has(m.file));
    const total = todo.reduce((sum, m) => sum + m.bytes, 0) || 1;
    let done = 0;
    await Promise.all(
      todo.map((m) =>
        this.gltf(m.file, m.bytes).then(() => {
          done += m.bytes;
          onProgress?.(done / total);
        }),
      ),
    );
    return true;
  },

  /**
   * Load every photographed surface (floorboards, plaster, brick...): colour, normal and
   * a third picture carrying occlusion, roughness and metal in its three channels.
   */
  async loadSurfaces() {
    if (!this.things?.textures) return false;
    const one = (file, colour) =>
      file
        ? pictures
            .loadAsync(this.base + file)
            .then((t) => {
              t.wrapS = t.wrapT = THREE.RepeatWrapping;
              t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
              t.anisotropy = 4;
              return t;
            })
            .catch(() => null)
        : Promise.resolve(null);
    await Promise.all(
      Object.entries(this.things.textures).map(async ([name, info]) => {
        if (surfaces.has(name)) return;
        const [d, n, r] = await Promise.all([one(info.d, true), one(info.n, false), one(info.r, false)]);
        if (!d) return;
        for (const t of [d, n, r]) t?.repeat.set(1 / info.metres, 1 / info.metres);
        surfaces.set(name, { d, n, r, metres: info.metres });
      }),
    );
    return surfaces.size > 0;
  },

  /** A loaded surface, or null. */
  surface(name) {
    return surfaces.get(name) ?? null;
  },

  /** The photographed room that everything shiny reflects, as an equirectangular picture. */
  async loadEnvironment() {
    if (!this.things?.env) return null;
    try {
      const t = await pictures.loadAsync(this.base + this.things.env.file);
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    } catch {
      return null;
    }
  },

  /** A loaded prop model: its scene (clone it before use) and its measurements. Null if it is not in memory. */
  prop(name) {
    const info = this.things?.models[name];
    const gltf = info && ready.get(info.file);
    return gltf ? { info, scene: gltf.scene } : null;
  },

  /** Fetch and parse one glTF file; resolves to the parsed file, or null if it could not be had. */
  gltf(file, bytes = 0) {
    if (ready.has(file)) return Promise.resolve(ready.get(file));
    if (failed.has(file)) return Promise.resolve(null);
    if (!pending.has(file)) {
      this.progress.total += bytes;
      pending.set(
        file,
        loader
          .loadAsync(this.base + file)
          .then((gltf) => {
            ready.set(file, gltf);
            return gltf;
          })
          .catch((err) => {
            console.warn(`asset ${file} could not be loaded`, err?.message ?? err);
            failed.add(file);
            return null;
          })
          .finally(() => {
            this.progress.done += bytes;
            pending.delete(file);
          }),
      );
    }
    return pending.get(file);
  },

  /** A file already loaded with gltf(), or null. */
  get(file) {
    return ready.get(file) ?? null;
  },

  /**
   * Make sure these characters (and the motion clips their skeletons use) are loaded.
   * @param {string[]} ids character ids from the manifest
   * @param {(fraction: number) => void} [onProgress]
   */
  async loadPeople(ids, onProgress) {
    if (!this.people) return false;
    const files = new Map();
    for (const id of ids) {
      const c = this.people.characters[id];
      if (!c) continue;
      files.set(c.file, c.bytes);
      const a = this.people.anims[c.sex];
      if (a) files.set(a.file, a.bytes);
    }
    const todo = [...files].filter(([file]) => !ready.has(file) && !failed.has(file));
    const total = todo.reduce((sum, [, bytes]) => sum + bytes, 0) || 1;
    let done = 0;
    await Promise.all(
      todo.map(([file, bytes]) =>
        this.gltf(file, bytes).then(() => {
          done += bytes;
          onProgress?.(done / total);
        }),
      ),
    );
    return true;
  },

  /** The parsed model and clips for one character, or null if they are not loaded. */
  person(id) {
    const c = this.people?.characters[id];
    if (!c) return null;
    const model = ready.get(c.file);
    const anims = ready.get(this.people.anims[c.sex]?.file);
    if (!model || !anims) return null;
    return { id, info: c, model, clips: anims.animations, clipInfo: this.people.anims[c.sex] };
  },
};

export { THREE };
