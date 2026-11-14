// Entry point: connect to the game (server if there is one, otherwise run
// the whole thing in this page) and start it.

import { connect } from './api.js';
import { Game } from './game.js';

const root = /** @type {HTMLElement} */ (document.getElementById('app'));
const params = new URLSearchParams(location.search);
const host = /** @type {any} */ (globalThis);

function fail(message) {
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('failed');
  boot.textContent = message;
}

function webglWorks() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

async function main() {
  if (!webglWorks()) {
    fail('Greyhaven is a 3D game and needs WebGL, which this browser has turned off or does not support. Try a current version of Chrome, Safari, Edge or Firefox.');
    return;
  }
  // The hosted single-file build sets GREYHAVEN_MODE = 'local'; ?mode= is for testing.
  const mode = host.GREYHAVEN_MODE ?? params.get('mode') ?? 'auto';
  const client = await connect({ mode });
  const game = new Game(root, client, {
    quality: params.get('quality') ?? undefined,
    noAutoQuality: params.has('quality'),
  });
  host.__game = game;
  await game.boot();
}

main().catch((err) => {
  console.error(err);
  fail(`Greyhaven could not start. ${err?.message ?? ''}`);
});
