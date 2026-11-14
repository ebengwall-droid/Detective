// The models, textures and animation the game ships with: is everything the
// game asks for by name actually there, and is what the manifests say true?

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { LOOKS } from '../core/cases/lamplighter/looks.js';

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
