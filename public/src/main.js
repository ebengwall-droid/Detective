// Entry point: connect to the game (server if there is one, otherwise run
// the whole thing in this page) and start it.

import { connect } from './api.js';
import { Game } from './game.js';
import { assets } from './world/assets.js';

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

const topLevel = (() => {
  try {
    return window.top === window.self;
  } catch {
    return false;
  }
})();
const installed = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
const apple = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

/** Putting the game on the home screen. Android offers a prompt; iPhone does it from the Share sheet. */
const install = {
  event: null,
  installed,
  iosHint: topLevel && !installed && apple,
  canPrompt() {
    return !!this.event;
  },
  async prompt() {
    const e = this.event;
    if (!e) return false;
    this.event = null;
    e.prompt();
    const choice = await e.userChoice.catch(() => null);
    return choice?.outcome === 'accepted';
  },
};
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  install.event = e;
});

// The service worker is what lets the installed app start without a signal.
// Not inside another page (the claude.ai build), and not from a file.
if (topLevel && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

async function main() {
  if (!webglWorks()) {
    fail('This is a 3D game and needs WebGL, which this browser has turned off or does not support. Try a current version of Chrome, Safari, Edge or Firefox.');
    return;
  }
  // The hosted single-file build sets FOLD_MODE = 'local'; ?mode= is for testing.
  const mode = host.FOLD_MODE ?? params.get('mode') ?? 'auto';
  const client = await connect({ mode });
  // Modelled people, furniture and materials live beside the page. Without them (a single
  // file opened from disk, say) the game draws everything in code instead. ?real=0 forces that.
  assets.packed = !!host.FOLD_PACKED;
  if (params.get('real') !== '0') await assets.init(host.FOLD_ASSETS ?? 'assets/');
  const game = new Game(root, client, {
    quality: params.get('quality') ?? undefined,
    noAutoQuality: params.has('quality'),
    install,
    // Only when the game is the whole page: inside another page the history belongs to the host.
    backButton: topLevel,
  });
  host.__game = game;
  await game.boot();
}

main().catch((err) => {
  console.error(err);
  fail(`The game could not start. ${err?.message ?? ''}`);
});
