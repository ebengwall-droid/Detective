// Build the game's people from the Microsoft Rocketbox avatar library (MIT).
//
//   node scripts/assets/characters.mjs --src <Rocketbox checkout> [--only vance,hale] [--no-anims] [--anims-only]
//
// For each character in cast.json this converts the avatar's FBX to glTF,
// keeps the facial blendshapes the game uses (speech, blinks, brows, mouth),
// resizes and recompresses its textures, and writes a compact, compressed
//   public/assets/characters/<id>.glb
// The motion-capture clips are gathered into one file per skeleton family:
//   public/assets/anims/f.glb and m.glb
// and a manifest of what was built goes to public/assets/characters.json.
//
// The sources are not kept in this repository (they are several gigabytes).
// `--list` prints the paths this script needs, as git sparse-checkout patterns.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, resample } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const cast = JSON.parse(fs.readFileSync(path.join(here, 'cast.json'), 'utf8'));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const AVATARS = 'Assets/Avatars';
const CLIPS = 'Assets/Animations/all_animations_max_motextr_static';

if (flag('list')) {
  const lines = ['/LICENSE.md'];
  for (const c of Object.values(cast.characters)) lines.push(`/${AVATARS}/${c.src}/Export/*_facial.fbx`, `/${AVATARS}/${c.src}/Textures/*.tga`);
  for (const set of Object.values(cast.animations)) for (const name of Object.values(set)) lines.push(`/${CLIPS}/${name}.max.fbx`);
  console.log(lines.join('\n'));
  process.exit(0);
}

const src = arg('src', null);
if (!src || !fs.existsSync(path.join(src, AVATARS))) {
  console.error('Give the Rocketbox checkout with --src (see --list for the files needed).');
  process.exit(2);
}
const only = arg('only', null)?.split(',');
const outDir = path.join(root, 'public/assets');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'greyhaven-chars-'));
const FBX2GLTF = path.join(root, 'node_modules/fbx2gltf/bin', process.platform === 'darwin' ? 'Darwin' : process.platform === 'win32' ? 'Windows_NT' : 'Linux', process.platform === 'win32' ? 'FBX2glTF.exe' : 'FBX2glTF');
fs.chmodSync(FBX2GLTF, 0o755);

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

function convert(fbx, name) {
  const out = path.join(tmp, name);
  execFileSync(FBX2GLTF, ['--binary', '--input', fbx, '--output', out], { stdio: ['ignore', 'ignore', 'ignore'] });
  return `${out}.glb`;
}

/** Blendshape names, in the order the FBX holds them (which is the order the converter writes them in). */
function shapeNames(fbx) {
  const text = fs.readFileSync(fbx).toString('latin1');
  // Each blendshape channel is an object named "<deformer>.<shape>", followed by its class.
  return [...text.matchAll(/([A-Za-z0-9_ .-]+)\x00\x01SubDeformer/g)].map((m) => m[1].replace(/^.*\./, ''));
}

/** The blendshapes the game drives, and the short names it knows them by. */
const SHAPES = {
  AA_VI_01_PP: 'v_pp', AA_VI_02_FF: 'v_ff', AA_VI_03_TH: 'v_th', AA_VI_04_DD: 'v_dd', AA_VI_05_KK: 'v_kk', AA_VI_06_CH: 'v_ch', AA_VI_07_SS: 'v_ss',
  AA_VI_08_nn: 'v_nn', AA_VI_09_RR: 'v_rr', AA_VI_10_aa: 'v_aa', AA_VI_11_E: 'v_e', AA_VI_12_I: 'v_i', AA_VI_13_O: 'v_o', AA_VI_14_U: 'v_u',
  AK_01_BrowDownLeft: 'browDownL', AK_02_BrowDownRight: 'browDownR', AK_03_BrowInnerUp: 'browInnerUp', AK_04_BrowOuterUpLeft: 'browUpL', AK_05_BrowOuterUpRight: 'browUpR',
  AK_07_CheekSquintLeft: 'cheekL', AK_08_CheekSquintRight: 'cheekR', AK_09_EyeBlinkLeft: 'blinkL', AK_10_EyeBlinkRight: 'blinkR',
  AK_19_EyeSquintLeft: 'squintL', AK_20_EyeSquintRight: 'squintR', AK_21_EyeWideLeft: 'wideL', AK_22_EyeWideRight: 'wideR',
  AK_25_JawOpen: 'jawOpen', AK_30_MouthFrownLeft: 'frownL', AK_31_MouthFrownRight: 'frownR', AK_36_MouthPressLeft: 'pressL', AK_37_MouthPressRight: 'pressR',
  AK_42_MouthShrugLower: 'shrugLower', AK_44_MouthSmileLeft: 'smileL', AK_45_MouthSmileRight: 'smileR', AK_46_MouthStretchLeft: 'stretchL', AK_47_MouthStretchRight: 'stretchR',
  AK_48_MouthUpperUpLeft: 'upperUpL', AK_49_MouthUpperUpRight: 'upperUpR', AK_50_NoseSneerLeft: 'sneerL', AK_51_NoseSneerRight: 'sneerR',
  AU_41_LidDroop: 'lidDroop',
};

/** Read a Targa file (the library's textures are uncompressed, but run-length ones are handled too). */
function readTga(file) {
  const b = fs.readFileSync(file);
  const idLength = b[0];
  const type = b[2];
  const width = b.readUInt16LE(12);
  const height = b.readUInt16LE(14);
  const depth = b[16];
  const topDown = (b[17] & 0x20) !== 0;
  const bpp = depth / 8;
  if (![2, 10].includes(type) || ![3, 4].includes(bpp)) throw new Error(`${file}: unsupported TGA (type ${type}, ${depth} bit)`);
  let p = 18 + idLength;
  const data = Buffer.alloc(width * height * bpp);
  if (type === 2) {
    b.copy(data, 0, p, p + data.length);
  } else {
    let o = 0;
    while (o < data.length) {
      const head = b[p++];
      const count = (head & 0x7f) + 1;
      if (head & 0x80) {
        for (let i = 0; i < count; i++) b.copy(data, o + i * bpp, p, p + bpp);
        p += bpp;
      } else {
        b.copy(data, o, p, p + count * bpp);
        p += count * bpp;
      }
      o += count * bpp;
    }
  }
  // BGR(A), bottom row first -> RGB(A), top row first.
  const out = Buffer.alloc(data.length);
  const row = width * bpp;
  for (let y = 0; y < height; y++) {
    const from = (topDown ? y : height - 1 - y) * row;
    for (let x = 0; x < row; x += bpp) {
      out[y * row + x] = data[from + x + 2];
      out[y * row + x + 1] = data[from + x + 1];
      out[y * row + x + 2] = data[from + x];
      if (bpp === 4) out[y * row + x + 3] = data[from + x + 3];
    }
  }
  return { data: out, width, height, channels: bpp };
}

const image = (tga) => sharp(tga.data, { raw: { width: tga.width, height: tga.height, channels: tga.channels } });

async function webp(file, size, { quality = 84, alpha = false, normal = false } = {}) {
  const tga = readTga(file);
  let img = image(tga);
  if (!alpha && tga.channels === 4) img = img.removeAlpha();
  const w = Math.min(size, tga.width);
  img = img.resize({ width: w, height: Math.round((tga.height * w) / tga.width), kernel: 'lanczos3' });
  // Normal maps: no chroma subsampling, or the directions smear.
  return img.webp(normal ? { quality: Math.max(quality, 88), smartSubsample: true, effort: 5 } : { quality, alphaQuality: 90, effort: 5 }).toBuffer();
}

/** Specular map -> glTF roughness (green) with no metal (blue). */
async function roughness(file, size) {
  const tga = readTga(file);
  const grey = await image(tga).removeAlpha().greyscale().resize({ width: size, height: size }).raw().toBuffer();
  const out = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    const spec = grey[i] / 255;
    out[i * 3] = 255;
    out[i * 3 + 1] = Math.round(255 * Math.min(1, Math.max(0.3, 0.96 - spec * 0.72)));
    out[i * 3 + 2] = 0;
  }
  return sharp(out, { raw: { width: size, height: size, channels: 3 } }).webp({ quality: 80, effort: 5 }).toBuffer();
}

/** A material "m156_equipment" takes "m156_equipment_color.tga" and its companions. */
function findTexture(dir, stem, kind) {
  const files = fs.readdirSync(dir);
  const [code, part] = [stem.slice(0, stem.indexOf('_')), stem.slice(stem.indexOf('_') + 1)];
  const lower = (f) => f.toLowerCase();
  const hit =
    files.find((f) => lower(f) === `${stem}_${kind}.tga`) ??
    files.find((f) => lower(f).endsWith(`_${part}_${kind}.tga`)) ??
    // One or two of the library's materials are misspelt ("equpiment"): go by how the name starts.
    files.find((f) => lower(f).startsWith(`${code}_${part.slice(0, 3)}`) && lower(f).endsWith(`_${kind}.tga`));
  return hit ? path.join(dir, hit) : null;
}

async function buildCharacter(id, spec) {
  const dir = path.join(src, AVATARS, spec.src);
  const fbx = path.join(dir, 'Export', fs.readdirSync(path.join(dir, 'Export')).find((f) => f.endsWith('_facial.fbx')));
  const names = shapeNames(fbx);
  const doc = await io.read(convert(fbx, id));
  const r = doc.getRoot();
  for (const a of r.listAnimations()) a.dispose();
  doc.createExtension(EXTTextureWebP).setRequired(true);

  const meshNode = r.listNodes().find((n) => n.getMesh());
  const mesh = meshNode.getMesh();
  const skin = meshNode.getSkin();
  const parent = meshNode.getParentNode() ?? r.listScenes()[0];
  const tex = path.join(dir, 'Textures');
  const report = { tris: 0, shapes: 0 };

  const used = new Set();
  for (const prim of mesh.listPrimitives()) {
    const material = prim.getMaterial();
    const stem = material.getName().toLowerCase(); // e.g. f020_head, m156_equipment, f015_glasses
    const kind = stem.replace(/^[a-z]\d+_/, '');
    const part = kind === 'opacity' ? 'hair' : kind;
    prim.setAttribute('COLOR_0', null);
    report.tris += prim.getIndices().getCount() / 3;

    // Keep the blendshapes we use, and only where they move something.
    const kept = [];
    prim.listTargets().forEach((target, i) => {
      const short = SHAPES[names[i]];
      const pos = target.getAttribute('POSITION');
      const moves = pos && Math.max(...pos.getMax([]).map(Math.abs), ...pos.getMin([]).map(Math.abs)) > 1e-5;
      if (short && (part === 'head' || part === 'hair' || part === 'glasses') && moves) {
        kept.push(short);
        target.setName(short); // the writer takes the shapes' names from here
      } else prim.removeTarget(target);
    });
    for (const target of prim.listTargets()) for (const semantic of target.listSemantics()) if (semantic !== 'POSITION') target.setAttribute(semantic, null);

    let name = part;
    for (let k = 2; used.has(name); k++) name = `${part}${k}`;
    used.add(name);
    const own = doc.createMesh(name).addPrimitive(prim);
    mesh.removePrimitive(prim);
    if (kept.length) own.setWeights(kept.map(() => 0));
    if (part === 'head') report.shapes = kept.length;
    const node = doc.createNode(name).setMesh(own).setSkin(skin);
    node.setTranslation(meshNode.getTranslation()).setRotation(meshNode.getRotation()).setScale(meshNode.getScale());
    parent.addChild(node);

    material.setName(part).setMetallicFactor(0).setRoughnessFactor(part === 'head' ? 0.62 : 0.82).setBaseColorFactor([1, 1, 1, 1]);
    material.setBaseColorTexture(null).setNormalTexture(null);
    const texture = (label, buffer) => doc.createTexture(`${id}_${label}`).setImage(buffer).setMimeType('image/webp');
    if (part === 'hair') {
      const file = findTexture(tex, stem, 'color');
      if (file) material.setBaseColorTexture(texture(name, await webp(file, 1024, { alpha: true, quality: 86 })));
      material.setAlphaMode('MASK').setAlphaCutoff(0.4).setDoubleSided(true).setRoughnessFactor(0.62);
    } else if (part === 'glasses') {
      // Frames and lenses share one card: solid where the frame is, faint where the glass is.
      const file = findTexture(tex, stem, 'opacity_color');
      if (file) material.setBaseColorTexture(texture(name, await webp(file, 512, { alpha: true, quality: 86 })));
      material.setAlphaMode('BLEND').setDoubleSided(true).setRoughnessFactor(0.25);
    } else {
      const big = part === 'body' || part === 'head';
      const color = findTexture(tex, stem, 'color');
      const normal = findTexture(tex, stem, 'normal');
      const spec = findTexture(tex, stem, 'specular');
      if (color) material.setBaseColorTexture(texture(name, await webp(color, big ? 1024 : 512, { quality: part === 'head' ? 88 : 84 })));
      if (normal) material.setNormalTexture(texture(`${name}_n`, await webp(normal, part === 'body' ? 1024 : 512, { normal: true })));
      if (spec) material.setMetallicRoughnessTexture(texture(`${name}_r`, await roughness(spec, big ? 512 : 256))).setRoughnessFactor(1).setMetallicFactor(1);
    }
  }
  meshNode.dispose();
  mesh.dispose();

  await doc.transform(prune(), dedup(), meshopt({ encoder: MeshoptEncoder, level: 'medium', quantizationVolume: 'scene' }));
  fs.mkdirSync(path.join(outDir, 'characters'), { recursive: true });
  const file = path.join(outDir, 'characters', `${id}.glb`);
  await io.write(file, doc);
  // Rest measurements the game wants without loading the file.
  const hip = r.listNodes().find((n) => n.getName() === 'Bip01');
  return { file: `characters/${id}.glb`, sex: spec.sex, source: spec.src, bytes: fs.statSync(file).size, tris: report.tris, shapes: report.shapes, hip: +hip.getTranslation()[1].toFixed(4) };
}

/** Bones whose motion we keep. Faces are driven by blendshapes, not by the clips. */
const BODY = /^Bip01( Pelvis| Spine\d?| Neck| Head| [LR] (Clavicle|UpperArm|Forearm|Hand|Finger\d+|Thigh|Calf|Foot|Toe0))?$/;

async function buildAnimations(sex, set) {
  const out = new Document();
  const buffer = out.createBuffer();
  const scene = out.createScene('skeleton');
  const nodes = new Map();
  const nodeFor = (name) => {
    if (!nodes.has(name)) {
      const node = out.createNode(name);
      nodes.set(name, node);
      scene.addChild(node);
    }
    return nodes.get(name);
  };
  const info = {};
  let hip = 0;
  for (const [id, name] of Object.entries(set)) {
    const fbx = path.join(src, CLIPS, `${name}.max.fbx`);
    if (!fs.existsSync(fbx)) {
      console.warn(`  missing clip ${name}`);
      continue;
    }
    const doc = await io.read(convert(fbx, `${sex}_${id}`));
    const anim = doc.getRoot().listAnimations()[0];
    const rest = doc.getRoot().listNodes().find((n) => n.getName() === 'Bip01');
    hip ||= rest.getTranslation()[1];
    const dst = out.createAnimation(id);
    let duration = 0;
    for (const channel of anim.listChannels()) {
      const target = channel.getTargetNode()?.getName();
      const what = channel.getTargetPath();
      if (!target || !BODY.test(target)) continue;
      // Rotations everywhere; position only for the hips, so each person keeps their own proportions.
      if (what !== 'rotation' && !(what === 'translation' && target === 'Bip01')) continue;
      const s = channel.getSampler();
      // The captures are at 24 frames a second; every other frame is plenty for people standing and talking.
      const allTimes = s.getInput().getArray();
      const allValues = s.getOutput().getArray();
      const size = what === 'rotation' ? 4 : 3;
      const keep = [];
      // Fingers hold the curl they start with: in these clips they barely move, and there are thirty of them.
      const step = /Finger/.test(target) ? allTimes.length : 2;
      for (let k = 0; k < allTimes.length; k += step) keep.push(k);
      if (step === 2 && keep[keep.length - 1] !== allTimes.length - 1) keep.push(allTimes.length - 1);
      const times = Float32Array.from(keep, (k) => allTimes[k]);
      const values = new Float32Array(keep.length * size);
      keep.forEach((k, n) => {
        for (let c = 0; c < size; c++) values[n * size + c] = allValues[k * size + c];
      });
      duration = Math.max(duration, times[times.length - 1]);
      const input = out.createAccessor().setType('SCALAR').setArray(times).setBuffer(buffer);
      const output = out.createAccessor().setType(size === 4 ? 'VEC4' : 'VEC3').setArray(values).setBuffer(buffer);
      const sampler = out.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
      dst.addSampler(sampler).addChannel(out.createAnimationChannel().setTargetNode(nodeFor(target)).setTargetPath(what).setSampler(sampler));
    }
    info[id] = { source: name, seconds: +duration.toFixed(2) };
  }
  await doc_transform(out);
  fs.mkdirSync(path.join(outDir, 'anims'), { recursive: true });
  const file = path.join(outDir, 'anims', `${sex}.glb`);
  await io.write(file, out);
  return { file: `anims/${sex}.glb`, bytes: fs.statSync(file).size, hip: +hip.toFixed(4), clips: info };
}

async function doc_transform(doc) {
  await doc.transform(resample({ tolerance: 0.0006 }), dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
}

const manifestFile = path.join(outDir, 'characters.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { characters: {}, anims: {} };
manifest.licence = 'Microsoft Rocketbox Avatar Library, MIT License, Copyright (c) 2020 Microsoft';
for (const [id, spec] of Object.entries(cast.characters)) {
  if (flag('anims-only') || (only && !only.includes(id))) continue;
  const built = await buildCharacter(id, spec);
  manifest.characters[id] = built;
  console.log(`${id.padEnd(8)} ${(built.bytes / 1024).toFixed(0).padStart(5)} KB  ${built.tris} triangles, ${built.shapes} face shapes  (${spec.src})`);
}
if (!flag('no-anims')) {
  for (const [sex, set] of Object.entries(cast.animations)) {
    const built = await buildAnimations(sex, set);
    manifest.anims[sex] = built;
    console.log(`anims/${sex}  ${(built.bytes / 1024).toFixed(0).padStart(5)} KB  ${Object.keys(built.clips).length} clips`);
  }
}
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
fs.rmSync(tmp, { recursive: true, force: true });
