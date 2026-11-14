// Loading of authored assets: character models, motion clips, furniture,
// surfaces and the lighting environment.
//
// Everything is fetched from one base address (set by the page: the server's
// /assets/, or files published beside a hosted page), cached, and handed out
// synchronously afterwards, so building a room stays a plain function call.
// If something cannot be fetched the game still runs: whoever asked gets null
// and falls back to drawing the thing in code.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder as FastDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { MeshoptDecoder as PlainDecoder } from './lib/meshopt-reference.js';

/**
 * The models are meshopt-compressed. The usual decoder is WebAssembly, which
 * some hosts' content policies do not allow a page to compile; where it will
 * not start, the same job is done in plain JavaScript, a little more slowly.
 */
let fast;
// The WebAssembly decoder starts itself when its file is read. Where a host refuses it, say now that
// the refusal is expected, so it is not reported as an error nobody caught.
FastDecoder.ready?.catch?.(() => {});
const decoder = {
  supported: true,
  ready: Promise.resolve(),
  async decodeGltfBufferAsync(count, size, source, mode, filter) {
    fast ??= Promise.resolve(FastDecoder.supported ? FastDecoder.ready : Promise.reject(new Error('no WebAssembly'))).then(
      () => true,
      () => false,
    );
    if (await fast) {
      try {
        const target = new Uint8Array(count * size);
        FastDecoder.decodeGltfBuffer(target, count, size, source, mode, filter);
        return target;
      } catch {
        fast = Promise.resolve(false);
      }
    }
    return PlainDecoder.decodeGltfBufferAsync(count, size, source, mode, filter);
  },
};

/**
 * The pictures inside a model arrive as blob: addresses. Decoding them off the
 * main thread means reading the blob back with fetch, which some hosts' content
 * policies refuse; an ordinary image element is allowed everywhere, so fall
 * back to that rather than lose the model.
 */
let blobsReadable = null;
/** Ask once, with a blob of our own, rather than find out on every picture. */
function canReadBlobs() {
  blobsReadable ??= (async () => {
    if (typeof createImageBitmap !== 'function') return false;
    const url = URL.createObjectURL(new Blob(['.']));
    try {
      await fetch(url);
      return true;
    } catch {
      return false;
    } finally {
      URL.revokeObjectURL(url);
    }
  })();
  return blobsReadable;
}
const pictureLoader = {
  isImageBitmapLoader: true,
  load(url, onLoad, onProgress, onError) {
    const asImage = () => {
      const img = new Image();
      img.onload = () => onLoad(img);
      img.onerror = () => onError?.(new Error(`could not decode a picture in ${url}`));
      img.src = url;
    };
    canReadBlobs().then((yes) => {
      if (!yes) return asImage();
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }))
        .then(onLoad, asImage);
    });
  },
};

const loader = new GLTFLoader();
loader.setMeshoptDecoder(decoder);
loader.register((parser) => {
  parser.textureLoader = pictureLoader;
  return { name: 'GREYHAVEN_pictures' };
});
const pictures = new THREE.TextureLoader();
/** @type {Map<string, {d: THREE.Texture, n: THREE.Texture|null, r: THREE.Texture|null, metres: number}>} */
const surfaces = new Map();

/** @type {Map<string, Promise<any>>} */
const pending = new Map();
/** @type {Map<string, any>} */
const ready = new Map();
const failed = new Set();

/** The file to fetch for a manifest entry: the lighter copy on a phone, where there is one. */
const pick = (entry, lite) => (lite && entry.lite ? entry.lite : entry);

export const assets = {
  base: 'assets/',
  /**
   * Some hosts serve only ordinary web file types, and a .glb is not one. There the
   * models are published as JSON, each carrying its file in base64 (see
   * scripts/build-artifact.mjs), and unpacked here.
   */
  packed: false,
  /** Prefer the lighter copies of things (smaller pictures): set for phones before anything is fetched. */
  lite: false,
  /** @type {{characters: Record<string, any>, anims: Record<string, any>}|null} */
  people: null,
  /** @type {{models: Record<string, any>, textures: Record<string, any>, env?: any}|null} */
  things: null,
  /** Bytes fetched so far and expected, for a progress line. */
  progress: { done: 0, total: 0 },

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

  /** How far along everything asked for so far is, from 0 to 1. */
  fraction() {
    return this.progress.total ? Math.min(1, this.progress.done / this.progress.total) : 1;
  },

  async fetchModel(file) {
    if (!this.packed) return loader.loadAsync(this.base + file);
    const res = await fetch(`${this.base}${file}.json`);
    if (!res.ok) throw new Error(`${res.status} for ${file}.json`);
    const { base64 } = await res.json();
    const text = atob(base64);
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
    return loader.parseAsync(bytes.buffer, this.base);
  },

  /** Fetch and parse one glTF file; resolves to the parsed file, or null if it could not be had. */
  gltf(file, bytes = 0) {
    if (ready.has(file)) return Promise.resolve(ready.get(file));
    if (failed.has(file)) return Promise.resolve(null);
    if (!pending.has(file)) {
      this.progress.total += bytes;
      pending.set(
        file,
        this.fetchModel(file)
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

  // ----------------------------------------------------------------- people

  /** The file a character is loaded from on this device. */
  personFile(id) {
    const c = this.people?.characters[id];
    return c ? pick(c, this.lite) : null;
  },

  /** Make sure these characters (and the motion clips their skeletons use) are loaded. */
  async loadPeople(ids) {
    if (!this.people) return false;
    const files = new Map();
    for (const id of ids) {
      const c = this.people.characters[id];
      if (!c) continue;
      const f = pick(c, this.lite);
      files.set(f.file, f.bytes);
      const a = this.people.anims[c.sex];
      if (a) files.set(a.file, a.bytes);
    }
    await Promise.all([...files].map(([file, bytes]) => this.gltf(file, bytes)));
    return true;
  },

  /** The parsed model and clips for one character, or null if they are not loaded. */
  person(id) {
    const c = this.people?.characters[id];
    if (!c) return null;
    const model = ready.get(pick(c, this.lite).file);
    const anims = ready.get(this.people.anims[c.sex]?.file);
    if (!model || !anims) return null;
    return { id, info: c, model, clips: anims.animations, clipInfo: this.people.anims[c.sex] };
  },

  // -------------------------------------------------------------- furniture

  /** Make sure these furniture and prop models are loaded. */
  async loadProps(names) {
    if (!this.things) return false;
    const todo = [...new Set(names)].map((n) => this.things.models[n]).filter(Boolean);
    await Promise.all(todo.map((m) => this.gltf(m.file, m.bytes)));
    return true;
  },

  /** A loaded prop model: its scene (clone it before use) and its measurements. Null if it is not in memory. */
  prop(name) {
    const info = this.things?.models[name];
    const gltf = info && ready.get(info.file);
    return gltf ? { info, scene: gltf.scene } : null;
  },

  // --------------------------------------------------------------- surfaces

  /**
   * Load every photographed surface (floorboards, plaster, brick...): colour, normal and
   * a third picture carrying occlusion, roughness and metal in its three channels.
   */
  async loadSurfaces() {
    if (!this.things?.textures) return false;
    const one = (file, bytes, colour) => {
      if (!file) return Promise.resolve(null);
      this.progress.total += bytes;
      return pictures
        .loadAsync(this.base + file)
        .then((t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
          t.anisotropy = 4;
          return t;
        })
        .catch(() => null)
        .finally(() => {
          this.progress.done += bytes;
        });
    };
    await Promise.all(
      Object.entries(this.things.textures).map(async ([name, info]) => {
        if (surfaces.has(name)) return;
        const files = pick(info, this.lite);
        const each = (files.bytes ?? 0) / 3;
        const [d, n, r] = await Promise.all([one(files.d, each, true), one(files.n, each, false), one(files.r, each, false)]);
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

  /** The photograph the windows look out on: a sea front at night. Null if it cannot be had. */
  async loadNight() {
    const info = this.things?.night;
    if (!info) return null;
    try {
      const t = await pictures.loadAsync(this.base + pick(info, this.lite).file);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    } catch {
      return null;
    }
  },

  // ----------------------------------------------------------------- memory

  /**
   * Give back the graphics memory held by models that are not on screen. What was
   * fetched stays in ordinary memory, so anything needed again is simply sent to the
   * graphics card again: a moment's work, against tens of megabytes held for nothing.
   * A phone's browser will close a page that holds too much.
   * @param {(file: string) => boolean} [keep] files still in use
   */
  release(keep = () => false) {
    for (const [file, gltf] of ready) {
      if (keep(file) || !gltf.scene) continue;
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          for (const value of Object.values(m)) if (value?.isTexture) value.dispose();
        }
      });
    }
  },
};

export { THREE };
