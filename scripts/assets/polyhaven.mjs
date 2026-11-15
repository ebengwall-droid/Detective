// Fetch and prepare furniture, props, surface materials and the lighting
// environment from Poly Haven (https://polyhaven.com, all CC0).
//
//   node scripts/assets/polyhaven.mjs [--cache <dir>] [--only chair,desk] [--models] [--textures] [--env]
//
// What to fetch is listed in props.json. For each model this downloads the
// glTF, simplifies it where it is heavier than the game needs, shrinks its
// textures to WebP, and writes a compressed public/assets/props/<name>.glb.
// Surface materials become public/assets/textures/<name>_{d,n,r}.webp, and
// the environment a small equirectangular public/assets/env.jpg.
// public/assets/props.json records sizes, so rooms can be laid out without
// loading anything.
//
// Downloads are kept in the cache directory and reused.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, flatten, getBounds, join, meshopt, normals, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const config = JSON.parse(fs.readFileSync(path.join(here, 'props.json'), 'utf8'));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);
const cache = path.resolve(arg('cache', path.join(os.tmpdir(), 'fold-polyhaven')));
const only = arg('only', null)?.split(',');
const all = !flag('models') && !flag('textures') && !flag('env');
const outDir = path.join(root, 'public/assets');
const AGENT = 'fold-asset-fetch/1.0';

function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.part`;
  // curl, because it already knows about whatever proxy this machine is behind.
  execFileSync('curl', ['-sS', '-f', '-L', '--retry', '3', '-m', '300', '-A', AGENT, '-o', tmp, url], { stdio: ['ignore', 'ignore', 'inherit'] });
  fs.renameSync(tmp, dest);
  return dest;
}

function listing(id) {
  const file = download(`https://api.polyhaven.com/files/${id}`, path.join(cache, 'api', `${id}.json`));
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const manifestFile = path.join(outDir, 'props.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
manifest.licence = 'Models, textures and environment from Poly Haven (polyhaven.com), CC0';
manifest.models ??= {};
manifest.textures ??= {};

// ------------------------------------------------------------------ models

async function buildModel(name, spec) {
  const files = listing(spec.src).gltf['1k'].gltf;
  const dir = path.join(cache, 'models', spec.src);
  const gltfPath = download(files.url, path.join(dir, path.basename(files.url)));
  for (const [rel, f] of Object.entries(files.include)) download(f.url, path.join(dir, rel));

  const doc = await io.read(gltfPath);
  const r = doc.getRoot();
  doc.createExtension(EXTTextureWebP).setRequired(true);
  for (const a of r.listAnimations()) a.dispose();
  for (const s of r.listSkins()) s.dispose();

  // Some downloads are a whole set (a heap of barrels, a rack of bottles). Keep the one piece asked for.
  if (spec.keep) {
    const keep = new Set([].concat(spec.keep));
    const scene = r.listScenes()[0];
    const walk = (node, inside) => {
      const on = inside || keep.has(node.getName());
      for (const child of node.listChildren()) walk(child, on);
      if (!on && !node.listChildren().length) node.dispose();
    };
    for (const node of scene.listChildren()) walk(node, false);
  }
  if (spec.drop) {
    for (const node of r.listNodes()) if ([].concat(spec.drop).some((d) => node.getName().includes(d))) node.dispose();
  }

  const before = triangles(r);
  const size = spec.tex ?? 512;
  for (const texture of r.listTextures()) {
    const isNormal = r.listMaterials().some((m) => m.getNormalTexture() === texture);
    const hasAlpha = r.listMaterials().some((m) => m.getBaseColorTexture() === texture && m.getAlphaMode() !== 'OPAQUE');
    let img = sharp(Buffer.from(texture.getImage()));
    const meta = await img.metadata();
    if (!hasAlpha) img = img.removeAlpha();
    if (meta.width > size) img = img.resize({ width: size, height: Math.round((meta.height * size) / meta.width), kernel: 'lanczos3' });
    texture.setImage(await img.webp(isNormal ? { quality: 86, smartSubsample: true, effort: 5 } : { quality: 80, effort: 5 }).toBuffer()).setMimeType('image/webp');
    texture.setURI(`${texture.getName() || 'tex'}.webp`);
  }

  // Some models give every face its own corners, which leaves a simplifier nothing to join up.
  // For those ("smooth" in props.json) drop the normals, so corners can be shared, and work them out again afterwards.
  if (spec.smooth) {
    for (const mesh of r.listMeshes()) for (const prim of mesh.listPrimitives()) for (const semantic of ['NORMAL', 'TANGENT']) prim.setAttribute(semantic, null);
  }
  const steps = [dedup(), weld()];
  const target = spec.tris ?? 6000;
  if (before > target * 1.15) steps.push(simplify({ simplifier: MeshoptSimplifier, ratio: target / before, error: spec.error ?? 0.02, lockBorder: false }));
  if (spec.smooth) steps.push(normals({ overwrite: true }));
  steps.push(flatten(), join(), prune(), dedup(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await doc.transform(...steps);

  const bounds = getBounds(r.listScenes()[0]);
  fs.mkdirSync(path.join(outDir, 'props'), { recursive: true });
  const file = path.join(outDir, 'props', `${name}.glb`);
  await io.write(file, doc);
  const round = (v) => v.map((x) => +x.toFixed(4));
  return { file: `props/${name}.glb`, source: spec.src, bytes: fs.statSync(file).size, tris: triangles(r), min: round(bounds.min), max: round(bounds.max) };
}

function triangles(r) {
  let n = 0;
  for (const mesh of r.listMeshes()) for (const prim of mesh.listPrimitives()) n += (prim.getIndices() ?? prim.getAttribute('POSITION')).getCount() / 3;
  return Math.round(n);
}

if (all || flag('models')) {
  for (const [name, spec] of Object.entries(config.models)) {
    if (only && !only.includes(name)) continue;
    try {
      const built = await buildModel(name, spec);
      manifest.models[name] = built;
      const dims = built.max.map((v, i) => (v - built.min[i]).toFixed(2)).join(' x ');
      console.log(`${name.padEnd(16)} ${(built.bytes / 1024).toFixed(0).padStart(5)} KB  ${String(built.tris).padStart(6)} triangles  ${dims} m  (${spec.src})`);
    } catch (err) {
      console.error(`${name}: FAILED ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------- textures

async function buildTexture(name, spec) {
  const files = listing(spec.src);
  const size = spec.size ?? 1024;
  const dir = path.join(cache, 'textures', spec.src);
  const get = (map) => {
    const entry = files[map]?.['1k']?.jpg;
    return entry ? download(entry.url, path.join(dir, path.basename(entry.url))) : null;
  };
  fs.mkdirSync(path.join(outDir, 'textures'), { recursive: true });
  const out = { lite: {} };
  const write = async (suffix, file, options) => {
    if (!file) return;
    const dest = path.join(outDir, 'textures', `${name}_${suffix}.webp`);
    await sharp(file).resize({ width: size, height: size, fit: 'fill', kernel: 'lanczos3' }).webp(options).toFile(dest);
    out[suffix] = `textures/${name}_${suffix}.webp`;
    out.bytes = (out.bytes ?? 0) + fs.statSync(dest).size;
    // Half size for phones.
    const small = path.join(outDir, 'textures', `${name}_${suffix}.m.webp`);
    await sharp(file).resize({ width: size / 2, height: size / 2, fit: 'fill', kernel: 'lanczos3' }).webp(options).toFile(small);
    out.lite[suffix] = `textures/${name}_${suffix}.m.webp`;
    out.lite.bytes = (out.lite.bytes ?? 0) + fs.statSync(small).size;
  };
  await write('d', get('Diffuse'), { quality: spec.quality ?? 78, effort: 5 });
  await write('n', get('nor_gl'), { quality: 84, smartSubsample: true, effort: 5 });
  await write('r', get('arm'), { quality: 76, effort: 5 }); // occlusion, roughness, metal in red, green, blue
  // How much wall or floor one copy of the picture covers, in metres.
  const info = JSON.parse(fs.readFileSync(download(`https://api.polyhaven.com/info/${spec.src}`, path.join(cache, 'api', `${spec.src}.info.json`)), 'utf8'));
  out.metres = spec.metres ?? +((info.dimensions?.[0] ?? 2000) / 1000).toFixed(2);
  out.source = spec.src;
  return out;
}

if (all || flag('textures')) {
  for (const [name, spec] of Object.entries(config.textures ?? {})) {
    if (only && !only.includes(name)) continue;
    try {
      const built = await buildTexture(name, spec);
      manifest.textures[name] = built;
      console.log(`${name.padEnd(16)} ${(built.bytes / 1024).toFixed(0).padStart(5)} KB  covers ${built.metres} m  (${spec.src})`);
    } catch (err) {
      console.error(`${name}: FAILED ${err.message}`);
    }
  }
}

// ------------------------------------------------------------- environment

if ((all || flag('env')) && config.env) {
  const files = listing(config.env.src);
  const big = download(files.tonemapped.url, path.join(cache, 'hdris', `${config.env.src}.jpg`));
  const dest = path.join(outDir, 'env.jpg');
  await sharp(big, { limitInputPixels: false }).resize({ width: 1024, height: 512, fit: 'fill' }).jpeg({ quality: 82 }).toFile(dest);
  manifest.env = { file: 'env.jpg', source: config.env.src, bytes: fs.statSync(dest).size };
  console.log(`env              ${(manifest.env.bytes / 1024).toFixed(0).padStart(5)} KB  (${config.env.src})`);
}

// --------------------------------------------------------- the night outside

// What the windows look out on: a photograph of a sea front at night. Only the band around the
// horizon is kept (45 degrees up and down; nothing else is ever seen through a window), which buys
// twice the detail for the same size.
//
// Two things are done to it. A night photograph is a long exposure, far brighter than the night
// was, so the sky is taken back down to dark and the lamps left as they are. And the photographer
// stood on a floodlit quay, so the half below the horizon is replaced with water: the sky and its
// lights upside down, dimmer and drawn out downwards, as a harbour shows them.
if ((all || flag('env')) && config.night) {
  const files = listing(config.night.src);
  const big = download(files.tonemapped.url, path.join(cache, 'hdris', `${config.night.src}.jpg`));
  const meta = await sharp(big, { limitInputPixels: false }).metadata();
  const W = 4096;
  const half = 512;
  const { data } = await sharp(big, { limitInputPixels: false })
    .extract({ left: 0, top: Math.round(meta.height / 4), width: meta.width, height: Math.round(meta.height / 4) })
    .resize({ width: W, height: half, fit: 'fill', kernel: 'lanczos3' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const toScreen = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
  const darker = config.night.darken ?? 2.5;
  const curve = Uint8Array.from({ length: 256 }, (_, i) => Math.round(255 * toScreen(toLinear(i / 255) ** darker)));
  for (let i = 0; i < data.length; i++) data[i] = curve[data[i]];
  const raw = { raw: { width: W, height: half, channels: 3 } };
  const sky = await sharp(data, raw).png().toBuffer();
  const smeared = await sharp(sky).flip().resize({ width: W, height: half / 8, fit: 'fill', kernel: 'cubic' }).png().toBuffer();
  const water = await sharp(smeared)
    .resize({ width: W, height: half, fit: 'fill', kernel: 'cubic' })
    .blur(2)
    .linear([0.5, 0.56, 0.66], [0, 0, 0])
    .png()
    .toBuffer();
  const band = await sharp({ create: { width: W, height: half * 2, channels: 3, background: '#000' } })
    .composite([
      { input: sky, left: 0, top: 0 },
      { input: water, left: 0, top: half },
    ])
    .png()
    .toBuffer();
  const dest = path.join(outDir, 'night.jpg');
  const small = path.join(outDir, 'night.m.jpg');
  await sharp(band).blur(0.6).jpeg({ quality: 86, mozjpeg: true }).toFile(dest);
  await sharp(band).resize({ width: W / 2, height: half, fit: 'fill' }).jpeg({ quality: 84, mozjpeg: true }).toFile(small);
  manifest.night = {
    file: 'night.jpg',
    bytes: fs.statSync(dest).size,
    lite: { file: 'night.m.jpg', bytes: fs.statSync(small).size },
    degrees: 45,
    source: config.night.src,
  };
  console.log(`night            ${(manifest.night.bytes / 1024).toFixed(0).padStart(5)} KB  (${config.night.src}), ${(manifest.night.lite.bytes / 1024).toFixed(0)} KB for phones`);
}

fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 1)}\n`);
