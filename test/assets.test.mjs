// The models, textures and animation the game ships with: is everything the
// game asks for by name actually there, and is what the manifests say true?

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { LOOKS } from '../core/cases/fold/looks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'public/assets');
const read = (file) => JSON.parse(fs.readFileSync(path.join(assets, file), 'utf8'));
const people = read('characters.json');
const things = read('props.json');
const size = (file) => fs.statSync(path.join(assets, file)).size;
const isGlb = (file) => fs.readFileSync(path.join(assets, file)).subarray(0, 4).toString('latin1') === 'glTF';

test('every character in the case has a model, a lighter copy and motion clips', () => {
  for (const [id, look] of Object.entries(LOOKS)) {
    assert.ok(look.model, `${id} names a model`);
    const entry = people.characters[look.model];
    assert.ok(entry, `${look.model} is in the manifest`);
    for (const copy of [entry, entry.lite]) {
      assert.equal(size(copy.file), copy.bytes, `${copy.file} is the size the manifest says`);
      assert.ok(isGlb(copy.file), `${copy.file} is a binary glTF`);
    }
    assert.ok(entry.lite.bytes < entry.bytes, `${id}'s lighter copy is lighter`);
    assert.ok(entry.shapes >= 30, `${id} keeps the face shapes the game drives`);
    assert.ok(people.anims[entry.sex], `${id}'s skeleton family has clips`);
  }
});

test('the clips the game plays exist for both skeleton families', () => {
  for (const [sex, set] of Object.entries(people.anims)) {
    assert.equal(size(set.file), set.bytes);
    for (const clip of ['idle', 'idle2', 'idle_breathe', 'talk', 'listen', 'sit']) {
      assert.ok(set.clips[clip], `${sex} has "${clip}"`);
      assert.ok(set.clips[clip].seconds > 1, `${sex} "${clip}" has some length`);
    }
  }
});

test('every model the rooms are dressed with is there', () => {
  // The names are written out in dress.js; read them from the source rather than load three.js here.
  const source = fs.readFileSync(path.join(root, 'public/src/world/dress.js'), 'utf8');
  const named = new Set([...source.matchAll(/model: (?:[^,}]*\? )?'([a-z_]+)'(?: : '([a-z_]+)')?/g)].flatMap((m) => [m[1], m[2]].filter(Boolean)));
  for (const m of source.matchAll(/names\.add\('([a-z_]+)'\)/g)) named.add(m[1]);
  assert.ok(named.size >= 20, 'found the dressing table');
  for (const name of named) {
    const entry = things.models[name];
    assert.ok(entry, `${name} is in the manifest`);
    assert.equal(size(entry.file), entry.bytes, `${entry.file} is the size the manifest says`);
    assert.ok(isGlb(entry.file));
    assert.ok(entry.max[1] > entry.min[1], `${name} has a height`);
  }
});

test('every surface has its three pictures at both sizes, and the environment is there', () => {
  assert.ok(Object.keys(things.textures).length >= 10);
  for (const [name, set] of Object.entries(things.textures)) {
    for (const copy of [set, set.lite]) {
      for (const part of ['d', 'n', 'r']) assert.ok(size(copy[part]) > 100, `${name} ${part}`); // a smooth veneer's normal map is nearly nothing
    }
    assert.ok(set.metres > 0.2 && set.metres < 10, `${name} says how much wall it covers`);
  }
  assert.ok(size(things.env.file) > 10000);
});

test('the night the windows look out on is there, at both sizes', () => {
  assert.ok(things.night, 'the manifest lists it');
  assert.ok(size(things.night.file) > 20000);
  assert.ok(size(things.night.lite.file) > 10000);
  assert.ok(size(things.night.lite.file) < size(things.night.file));
});

test('nothing shipped is too big for the hosted build, and the whole set stays modest', () => {
  let total = 0;
  for (const entry of fs.readdirSync(assets, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const bytes = fs.statSync(path.join(entry.parentPath ?? entry.path, entry.name)).size;
    total += bytes;
    assert.ok(bytes < 4 * 1048576, `${entry.name} is under 4 MB`);
  }
  assert.ok(total < 40 * 1048576, `all assets together are under 40 MB (${(total / 1048576).toFixed(1)} MB)`);
});

// ------------------------------------------------------------ bad connections
// The loader itself, with the network replaced by a stand-in that fails on demand.

test('a dropped request is tried again, a few at a time, and a missing file is asked for again later', async () => {
  const { assets: loader } = await import('../public/src/world/assets.js');
  loader.backoff = 1;
  loader.retryAfter = 30;
  const real = loader.fetchModel;
  const tries = new Map();
  let running = 0;
  let most = 0;
  let failUntil = 2;
  const order = [];
  loader.fetchModel = async (file) => {
    const n = (tries.get(file) ?? 0) + 1;
    tries.set(file, n);
    running += 1;
    most = Math.max(most, running);
    order.push(file);
    await new Promise((r) => setTimeout(r, 4));
    running -= 1;
    if (n <= failUntil) throw new Error('connection reset');
    return { scene: { name: file } };
  };
  try {
    // Twelve files, each dropped twice: all arrive, never more than four requests at once.
    const got = await Promise.all(Array.from({ length: 12 }, (_, i) => loader.gltf(`t/a${i}.glb`, 100)));
    assert.ok(got.every((g, i) => g?.scene.name === `t/a${i}.glb`));
    assert.ok(most <= 4, `no more than four at once (saw ${most})`);
    assert.equal(tries.get('t/a0.glb'), 3);
    assert.deepEqual(loader.status().failed, []);
    assert.equal(loader.fraction(), 1);

    // A file that will not come is given up on for now, without hammering the host...
    failUntil = 99;
    assert.equal(await loader.gltf('t/gone.glb', 50), null);
    assert.equal(tries.get('t/gone.glb'), 3);
    assert.deepEqual(loader.status().failed, ['t/gone.glb']);
    assert.equal(await loader.gltf('t/gone.glb', 50), null);
    assert.equal(tries.get('t/gone.glb'), 3, 'asked again at once, nothing is sent');
    // ...and asked for again once a little time has passed, and kept if it comes.
    await new Promise((r) => setTimeout(r, 40));
    failUntil = 0;
    assert.equal((await loader.gltf('t/gone.glb', 50))?.scene.name, 't/gone.glb');
    assert.deepEqual(loader.status().failed, []);
    assert.equal(loader.fraction(), 1, 'the progress line does not count a retried file twice');

    // Fetching ahead waits behind what the room on screen needs.
    order.length = 0;
    const quiet = [0, 1, 2, 3, 4, 5].map((i) => loader.gltf(`t/q${i}.glb`, 10, true));
    const urgent = [0, 1, 2].map((i) => loader.gltf(`t/u${i}.glb`, 10));
    await Promise.all([...quiet, ...urgent]);
    const lastUrgent = Math.max(...[0, 1, 2].map((i) => order.indexOf(`t/u${i}.glb`)));
    const lastQuiet = order.indexOf('t/q5.glb');
    assert.ok(lastUrgent < lastQuiet, 'urgent files go out before the tail of the quiet ones');
  } finally {
    loader.fetchModel = real;
    loader.backoff = 450;
    loader.retryAfter = 12000;
  }
});
