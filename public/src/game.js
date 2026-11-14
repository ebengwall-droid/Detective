// The game controller: owns the latest view, sends player actions to the
// game core, and turns what comes back into things on screen.

import { World } from './world/world.js';
import { Audio } from './audio.js';
import { el } from './ui/dom.js';
import { createHud, showHere, showInspect, showThink, showCard, confirmCard } from './ui/hud.js';
import { createDialogue } from './ui/dialogue.js';
import { createNotebook } from './ui/notebook.js';
import { createLaptop } from './ui/laptop.js';
import { createMap } from './ui/map.js';
import { showTitle, showMenu, showHelp, showLetter, showEnding } from './ui/title.js';
import { SCENES } from '../../core/cases/lamplighter/scenes.js';

const SETTINGS_KEY = 'greyhaven.settings';
const ACT_KICKER = { 1: 'Part one', 2: 'Part two', 3: 'Part three', 4: 'Part four' };
/** Panels that may be swapped for one another; anything else on screen must finish first. */
const PANELS = new Set(['notebook', 'laptop', 'map']);
const FADE_MS = 470;

function loadSettings() {
  const base = { sound: true, sens: 1, bright: 1, quality: 'auto', coached: false };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return base;
  }
}

function isField(node) {
  return !!node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA');
}

export class Game {
  /**
   * @param {HTMLElement} root
   * @param {Awaited<ReturnType<typeof import('./api.js').connect>>} client
   * @param {{quality?: string, noAutoQuality?: boolean, install?: any, backButton?: boolean}} [opts]
   */
  constructor(root, client, opts = {}) {
    this.root = root;
    this.client = client;
    this.opts = opts;
    this.caseInfo = client.caseInfo ?? { title: 'The Lamplighter', series: 'Greyhaven', tagline: '' };
    /** Home-screen install, where the browser offers it (see main.js). */
    this.install = opts.install ?? null;
    this.settings = loadSettings();
    this.view = null;
    this.unseen = { notebook: false, laptop: false, map: false };
    /** Reasons the player cannot move right now. Empty means exploring. */
    this.blockers = new Set();
    this.started = false;
    /** Whether a history entry is standing by for the phone's Back button to consume. */
    this.backArmed = false;
    this.queue = [];
    this.flushing = false;
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.target = null;

    this.canvas = el('canvas', { id: 'view', tabindex: '-1', 'aria-label': 'The scene' });
    this.sticks = el('div', { id: 'sticks' });
    this.panels = el('div', { id: 'panels' });
    this.cards = el('div', { id: 'cards' });
    this.fadeEl = el('div', { id: 'fade', class: 'on' });
    root.append(this.canvas, el('div', { id: 'vignette' }), this.sticks);

    this.audio = new Audio();
    this.audio.enabled = this.settings.sound;
    this.world = new World(this.canvas, this.sticks);
    this.hud = createHud(root, this);
    root.append(this.panels, this.fadeEl, this.cards);
    this.dialogue = createDialogue(this.panels, this);
    this.notebook = createNotebook(this.panels, this);
    this.laptop = createLaptop(this.panels, this);
    this.map = createMap(this.panels, this);

    // Any card on screen (scene break, question, menu, letter) pauses the world.
    new MutationObserver(() => {
      const any = this.cards.childElementCount > 0;
      // A card has the screen to itself: nothing from the room's interface should show through it.
      root.classList.toggle('carded', any);
      if (any) this.block('cards');
      else this.unblock('cards');
    }).observe(this.cards, { childList: true });
  }

  isWide() {
    return window.innerWidth >= 860;
  }

  /** Where the conversation panel sits: beside the character on anything wide (a phone on its side included), under them on an upright phone. Mirrors the stylesheet. */
  dialogueSide() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return (w >= 900 && h >= 520) || (w > h && w >= 560 && h <= 520) ? 'right' : 'bottom';
  }

  // ----------------------------------------------------------------- boot

  async boot() {
    try {
      // Signs and papers in the rooms are painted with type the page itself may never show, so ask for each face by name.
      const faces = ['16px "Marcellus"', '16px "Special Elite"', '16px "Instrument Sans"', '700 16px "Instrument Sans"', '16px "JetBrains Mono"', '700 16px "Bricolage Grotesque"'];
      const loaded = Promise.all(faces.map((face) => document.fonts.load(face))).then(() => document.fonts.ready);
      await Promise.race([loaded, new Promise((r) => setTimeout(r, 2500))]);
    } catch {
      /* fonts are a nicety */
    }
    const auto = this.isTouch || window.innerWidth < 900 ? 'medium' : 'high';
    const quality = this.opts.quality ?? (this.settings.quality === 'auto' ? auto : this.settings.quality);
    this.world.init({ quality, brightness: this.settings.bright });
    this.world.noAutoQuality = !!this.opts.noAutoQuality || this.settings.quality !== 'auto';
    this.world.controls.sensitivity = this.settings.sens;
    this.world.controls.setTouchUi(this.isTouch);
    this.hud.setTouch(this.isTouch);
    this.wire();

    // The lamp shop, slowly, behind the title.
    const shop = SCENES.lamp_shop;
    this.world.loadLocation({ id: 'title', sceneVersion: 0, scene: { ...shop, props: shop.props.filter((p) => !p.if) }, hotspots: [], npcs: [] });
    this.world.titleShot({ x: 0.6, z: 2.6, yaw: 18 });
    this.world.start();
    this.audio.setAmbience('title');

    let resumed = null;
    try {
      resumed = await this.client.resume();
    } catch (err) {
      console.warn('Could not look for a saved case:', err?.message);
    }
    document.getElementById('boot')?.remove();
    await this.titleLoop(resumed);
  }

  async titleLoop(resumed) {
    const pending = showTitle(this.cards, this, { hasSave: !!resumed, savedName: resumed?.view?.player?.name });
    this.fade(false);
    const choice = await pending;
    await this.fade(true);
    await this.prepareAi();
    if (choice.action === 'continue' && resumed) {
      this.applyView(resumed.view, { fresh: true });
      this.beginPlay();
      await this.fade(false);
      this.hud.setVisible(true);
      if (resumed.view.ending && !resumed.view.ending.text) this.runEnding();
      return;
    }
    await this.startNew(choice.name);
  }

  /**
   * In the hosted build the first question put to Claude makes the host ask
   * the player's permission. Do that here, in the dark between the title and
   * the first scene, rather than in the middle of somebody's sentence.
   */
  async prepareAi() {
    if (!this.client.prepareAi || this.aiPrepared) return;
    this.aiPrepared = true;
    this.fadeEl.textContent = 'Asking Claude to play the cast…';
    const live = await this.client.prepareAi();
    this.fadeEl.textContent = '';
    if (!live) this.aiNote = 'Claude is not available here, so the characters will keep to their script.';
  }

  /** Open a fresh case file. Expects the screen to be dark already. */
  async startNew(name) {
    const res = await this.client.call('newGame', { name });
    this.queue.length = 0;
    this.hud.clearToasts();
    this.unseen = { notebook: false, laptop: false, map: false };
    this.applyView(res.view, { fresh: true });
    this.queue.push(...res.events);
    this.beginPlay();
    await this.flushEvents();
    await this.fade(false);
    this.hud.setVisible(true);
    this.coachStart();
    if (this.aiNote) {
      this.hud.toast({ kind: 'alert', iconName: 'speech', title: 'Scripted characters', text: this.aiNote });
      this.aiNote = null;
    }
  }

  beginPlay() {
    this.started = true;
    this.armBack();
    if (this.blockers.size) this.world.setMode('ui');
    else this.enterExplore();
  }

  wire() {
    const w = this.world;
    w.on('target', (t) => {
      this.target = t;
      this.hud.setTarget(this.blockers.size ? null : t);
    });
    w.on('interact', ({ type, id }) => {
      if (type === 'npc') this.talkTo(id);
      else this.examine(id);
    });
    w.on('key', (key) => {
      if (key === 'notebook' || key === 'map' || key === 'laptop') this.open(key);
      else if (key === 'think') this.think();
      else if (key === 'scan') this.scan();
      else if (key === 'help') showHelp(this.cards, this);
      else if (key === 'escape') this.open('menu');
    });
    w.on('step', () => this.audio.step());
    // Light first, sound after: the storm is a little way out over the water.
    w.on('lightning', () => setTimeout(() => this.audio.thunder(), 600 + Math.random() * 1600));
    w.on('lock', (locked) => this.hud.setLocked(locked));
    w.on('slow', (from) => {
      const next = from === 'high' ? 'medium' : 'low';
      this.world.setQuality(next);
      this.hud.toast({ iconName: 'gear', title: 'Graphics lowered', text: 'To keep things smooth. You can change this in the menu.' });
    });
    const unlock = () => {
      this.audio.unlock();
      this.keepAwake();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    // Phones nudge the page up to show the keyboard and do not always put it back.
    document.addEventListener('focusout', () => setTimeout(() => window.scrollTo(0, 0), 60));
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape' || isField(e.target)) return;
      // Cards handle their own keys. Otherwise close whichever panel is on top.
      if (this.cards.childElementCount) return;
      if (this.notebook.isOpen) this.notebook.close();
      else if (this.laptop.isOpen) this.laptop.close();
      else if (this.map.isOpen) this.map.close();
      else if (this.dialogue.isOpen) this.dialogue.close();
    });
    // Keep the conversation box above the on-screen keyboard.
    const vv = window.visualViewport;
    if (vv) {
      const onViewport = () => {
        const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        document.documentElement.style.setProperty('--kb', `${kb > 80 ? kb : 0}px`);
        this.dialogue.setKeyboard(kb > 120);
      };
      vv.addEventListener('resize', onViewport);
      vv.addEventListener('scroll', onViewport);
    }
    document.addEventListener('visibilitychange', () => {
      this.audio.setAway(document.hidden);
      if (document.hidden) this.world.stop();
      else {
        this.world.start();
        this.keepAwake();
      }
    });
    // The phone's Back button (or the back swipe) closes whatever is open, and
    // with nothing open it pauses, as in any phone game: it never drops the
    // player out of the case by accident. One history entry is kept standing
    // by for it and replaced each time it is used; nothing here ever navigates.
    if (this.opts.backButton) {
      window.addEventListener('popstate', () => {
        this.backArmed = false;
        if (!this.started) return;
        if (this.blockers.size) this.closeTop();
        else this.open('menu');
        this.armBack();
      });
    }
    window.addEventListener('resize', () => {
      this.updateCover();
      // Turning the phone moves the conversation panel; keep the speaker in view.
      setTimeout(() => {
        if (this.dialogue.isOpen && this.world.focus) this.frameTalk(this.world.focus.id);
      }, 80);
    });
  }

  armBack() {
    if (!this.opts.backButton || this.backArmed || !this.started) return;
    try {
      history.pushState({ greyhaven: 'layer' }, '');
      this.backArmed = true;
    } catch {
      /* history is not ours to use here */
    }
  }

  /** Dismiss whatever is on top, the way its own close button would. */
  closeTop() {
    const scope = this.cards.childElementCount ? this.cards.lastElementChild : this.panels;
    const backs = scope.querySelectorAll('[data-back]');
    const top = /** @type {HTMLButtonElement|undefined} */ (backs[backs.length - 1]);
    if (!top || top.disabled) return false;
    top.click();
    return true;
  }

  /** Reading a letter or waiting on an answer should not let the phone go dark. */
  async keepAwake() {
    try {
      if (!this.wakeLock || this.wakeLock.released) this.wakeLock = await navigator.wakeLock?.request('screen');
    } catch {
      /* not allowed in this view; the phone's own timeout applies */
    }
  }

  /** A short tick in the hand, on phones that have one. */
  buzz(ms) {
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* no vibration here */
    }
  }

  /** While a full-screen panel or card hides the room there is no point drawing it. */
  updateCover() {
    const panel = !this.isWide() && (this.notebook.isOpen || this.laptop.isOpen || this.map.isOpen);
    const card = [...this.cards.children].some((c) => !c.classList.contains('veil') && !c.classList.contains('title'));
    this.world.covered = this.started && (panel || card);
  }

  async setFullscreen(on) {
    try {
      if (on && !document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      else if (!on && document.fullscreenElement) await document.exitFullscreen();
    } catch {
      this.hud.toast({ kind: 'alert', iconName: 'gear', title: 'Full screen', text: 'This browser will not go full screen here.' });
    }
  }

  // ------------------------------------------------------------ plumbing

  fade(on) {
    if (this.fadeEl.classList.contains('on') === on) return Promise.resolve();
    this.fadeEl.classList.toggle('on', on);
    return new Promise((r) => setTimeout(r, FADE_MS));
  }

  block(name) {
    this.blockers.add(name);
    this.updateCover();
    if (!this.started) return;
    this.armBack();
    this.world.setMode('ui');
    this.hud.setTarget(null);
    this.hud.hideCoach();
  }

  unblock(name) {
    if (!this.blockers.delete(name)) return;
    this.updateCover();
    if (this.started && !this.blockers.size) this.enterExplore();
  }

  enterExplore() {
    this.world.unfocus();
    this.world.setMode('explore');
    // Give the keyboard back to the room, so Space and Enter do not re-press a button.
    const active = /** @type {HTMLElement|null} */ (document.activeElement);
    if (active && active !== document.body && !isField(active)) active.blur();
  }

  /** True when nothing but a swappable panel stands between the player and the room. */
  get free() {
    if (!this.started || this.dialogue.isOpen) return false;
    for (const b of this.blockers) if (!PANELS.has(b)) return false;
    return true;
  }

  /**
   * Send an action to the game core.
   * @param {string} method
   * @param {object} [args]
   * @param {{onText?: (t: string) => void, signal?: AbortSignal}} [hooks]
   * @param {{deferEvents?: boolean}} [opts]
   */
  async call(method, args = {}, hooks = {}, opts = {}) {
    const res = await this.client.call(method, args, hooks);
    if (res?.view) this.applyView(res.view);
    if (res?.events?.length) {
      this.queue.push(...res.events);
      if (!opts.deferEvents) this.flushEvents();
    }
    return res;
  }

  applyView(view, { fresh = false } = {}) {
    const prev = this.view;
    this.view = view;
    const moved = fresh || !prev || prev.location.id !== view.location.id;
    this.world.loadLocation(view.location, { respawn: fresh });
    if (moved) this.audio.setAmbience(view.location.id);
    this.hud.setView(view);
  }

  /** Present queued events. Scene cards wait until any conversation has closed. */
  async flushEvents() {
    if (this.flushing) return;
    this.flushing = true;
    try {
      const facts = [];
      const held = [];
      while (this.queue.length) {
        const e = this.queue.shift();
        if (e.type === 'act') {
          if (this.dialogue.isOpen) held.push(e);
          else await this.showAct(e);
        } else {
          this.present(e, facts);
        }
      }
      if (facts.length) {
        this.audio.lead();
        const more = facts.length > 2 ? facts.length - 1 : 0;
        const shown = more ? facts.slice(0, 1) : facts;
        for (const f of shown) {
          this.hud.toast({ kind: 'lead', iconName: 'star', title: more ? `New lead, and ${more} more` : 'New lead', text: f.text, onClick: () => this.open('notebook', 'leads') });
        }
        if (!this.notebook.isOpen) this.unseen.notebook = true;
      }
      this.queue.push(...held);
      if (this.view) this.hud.setView(this.view);
    } finally {
      this.flushing = false;
    }
  }

  present(e, facts) {
    const hud = this.hud;
    switch (e.type) {
      case 'fact':
        facts.push(e);
        break;
      case 'evidence':
        this.audio.sting();
        this.buzz(18);
        hud.toast({ iconName: e.icon ?? 'bag', title: 'Evidence bagged', text: e.hasLab ? `${e.name}. The lab could look at this.` : e.name, onClick: () => this.openEvidence(e.id) });
        if (!this.notebook.isOpen) this.unseen.notebook = true;
        break;
      case 'unlock':
        this.unseen.map = true;
        hud.toast({ kind: 'alert', iconName: 'pin', title: 'New place on the map', text: e.name, onClick: () => this.open('map') });
        break;
      case 'notify':
        hud.toast({ kind: 'alert', iconName: 'phone', title: 'Message', text: e.text });
        break;
      case 'letter':
        hud.toast({ kind: 'alert', iconName: 'letter', title: 'At the precinct', text: e.text });
        break;
      case 'lab':
        this.audio.sting();
        hud.toast({ iconName: 'flask', title: 'Lab result', text: `${e.name}: ${e.result}`, onClick: () => this.openEvidence(e.id) });
        if (!this.notebook.isOpen) this.unseen.notebook = true;
        break;
      case 'objective':
        if (e.done) hud.toast({ kind: 'lead', iconName: 'check', title: 'Done', text: e.text });
        break;
      case 'deduction':
        this.unseen.notebook = true;
        hud.toast({ kind: 'alert', iconName: 'board', title: 'A question for your case board', text: e.q, onClick: () => this.open('notebook', 'board') });
        break;
      case 'record':
        if (!this.laptop.isOpen) this.unseen.laptop = true;
        break;
      case 'arrive':
        hud.subtitle(e.text, 7000);
        break;
      default:
        break;
    }
  }

  async showAct(e) {
    this.block('act');
    this.hud.setVisible(false);
    await this.fade(true);
    this.audio.chord();
    await showCard(this.cards, { kicker: ACT_KICKER[e.act] ?? '', title: e.title, date: e.date, lines: e.card });
    await this.fade(false);
    this.hud.setVisible(true);
    this.unblock('act');
  }

  /** True if a scene card is waiting, in which case whoever faded out leaves the screen dark for it. */
  actQueued() {
    return this.queue.some((e) => e.type === 'act');
  }

  // -------------------------------------------------------------- actions

  open(panel, tab) {
    if (!this.free) return;
    if (panel === 'menu') {
      this.openMenu();
      return;
    }
    this.notebook.close();
    this.laptop.close();
    this.map.close();
    this.block(panel);
    this.audio.click();
    if (panel === 'notebook') {
      this.unseen.notebook = false;
      this.notebook.open(tab);
    } else if (panel === 'laptop') {
      this.unseen.laptop = false;
      this.laptop.open(tab);
    } else if (panel === 'map') {
      this.map.open();
    }
    this.updateCover();
    this.hud.setView(this.view);
  }

  openEvidence(id) {
    if (!this.free) return;
    this.notebook.selectEvidence(id);
    this.open('notebook', 'evidence');
  }

  panelClosed(name) {
    this.unblock(name);
    if (this.view) this.hud.setView(this.view);
  }

  async openMenu() {
    const res = await showMenu(this.cards, this);
    if (res === 'report') {
      this.runEnding();
    } else if (res === 'new') {
      const sure = await confirmCard(this.cards, { title: 'Start over?', text: 'This case file will be closed and a new one opened from the first morning.', yes: 'Start over', no: 'Keep this case' });
      if (!sure) return;
      this.notebook.close();
      this.laptop.close();
      this.map.close();
      this.hud.setVisible(false);
      await this.fade(true);
      await this.startNew(this.view?.player?.name);
    }
  }

  setSetting(key, value) {
    this.settings[key] = value;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      /* settings just will not persist */
    }
    if (key === 'sound') this.audio.setEnabled(value);
    if (key === 'bright') this.world.setBrightness(value);
    if (key === 'sens') this.world.controls.sensitivity = value;
    if (key === 'quality') {
      this.world.noAutoQuality = true;
      this.world.setQuality(value);
    }
  }

  setAiPreference(pref) {
    this.client.setAiPreference?.(pref);
  }

  /** Look around: light up every marker and offer the room as a list to walk to. */
  async scan() {
    if (this.blockers.size) return;
    this.world.pulse();
    this.audio.blip();
    this.block('here');
    const pick = await showHere(this.panels, this);
    this.unblock('here');
    if (pick) this.world.interact(pick);
  }

  useTarget() {
    if (this.target && !this.blockers.size) this.world.interact(this.target);
  }

  async examine(id) {
    if (this.blockers.size) return;
    const spot = this.view.location.hotspots.find((h) => h.id === id);
    const leaving = spot?.action === 'travel';
    this.block('inspect');
    let next = null;
    try {
      if (leaving) {
        this.hud.setVisible(false);
        await this.fade(true);
      }
      const res = await this.call('examine', { id }, {}, { deferEvents: true });
      if (res.travelled) {
        /* arrived somewhere new: nothing to read */
      } else if (res.action === 'laptop' || res.action === 'board' || res.action === 'map') {
        next = res.action;
      } else {
        if (res.text) {
          this.audio.click();
          const taken = res.taken.map((tid) => this.view.evidence.find((e) => e.id === tid)).filter(Boolean);
          const more = this.view.location.hotspots.some((h) => !h.done && h.kind !== 'exit');
          const choice = await showInspect(this.panels, { title: res.title, text: res.text, taken, actions: more ? [{ id: 'look', label: 'What else is here?' }] : [] });
          if (choice === 'look') next = 'look';
        }
        if (res.letter) {
          await showLetter(this.cards, this, (onText) => this.call('readLetter', {}, { onText }, { deferEvents: true }).then((r) => r.letter));
        }
      }
    } catch (err) {
      this.hud.toast({ kind: 'alert', iconName: 'eye', title: 'Not now', text: err.message });
    }
    if (leaving && !this.actQueued()) {
      await this.fade(false);
      this.hud.setVisible(true);
    }
    this.unblock('inspect');
    if (next === 'look') this.scan();
    else if (next) this.open(next === 'board' ? 'notebook' : next, next === 'board' ? 'board' : undefined);
    this.flushEvents();
  }

  async talkTo(id, { phone = false } = {}) {
    if (this.blockers.size) return;
    this.block('dialogue');
    try {
      const res = await this.call('talk', { id, phone }, {}, { deferEvents: true });
      const here = this.view.location.npcs.find((n) => n.id === id);
      const look = here?.look ?? this.view.people.find((p) => p.id === id)?.look;
      this.hud.setVisible(false);
      this.audio.click();
      this.dialogue.show(res.talk, look);
      if (here) this.frameTalk(id);
      this.flushEvents();
    } catch (err) {
      this.unblock('dialogue');
      this.hud.toast({ kind: 'alert', iconName: 'speech', title: 'No answer', text: err.message });
    }
  }

  /** Point the camera so the speaker sits in the part of the screen the conversation panel leaves free. */
  frameTalk(id) {
    const side = this.dialogueSide();
    const r = this.dialogue.rect();
    const frac = r ? (side === 'right' ? r.width / window.innerWidth : r.height / window.innerHeight) : undefined;
    this.world.focusNpc(id, side, frac);
  }

  dialogueClosed(was) {
    this.hud.setVisible(true);
    this.world.unfocus();
    this.unblock('dialogue');
    this.flushEvents().then(() => {
      if (was?.finale && this.view.ending && !this.view.ending.text) this.runEnding();
    });
  }

  async travel(to) {
    if (!this.free) return;
    this.block('travel');
    this.hud.setVisible(false);
    await this.fade(true);
    try {
      await this.call('travel', { to }, {}, { deferEvents: true });
    } catch (err) {
      this.hud.toast({ kind: 'alert', iconName: 'map', title: 'Not now', text: err.message });
    }
    if (!this.actQueued()) {
      await this.fade(false);
      this.hud.setVisible(true);
    }
    this.unblock('travel');
    this.flushEvents();
  }

  async rest() {
    if (!this.free) return;
    this.block('travel');
    try {
      const res = await this.call('rest', {}, {}, { deferEvents: true });
      if (!res.ok && res.text) this.hud.toast({ kind: 'alert', iconName: 'moon', title: 'Not yet', text: res.text });
    } catch (err) {
      this.hud.toast({ kind: 'alert', iconName: 'moon', title: 'Not now', text: err.message });
    }
    this.unblock('travel');
    this.flushEvents();
  }

  async think() {
    if (this.blockers.size) return;
    this.block('think');
    this.audio.click();
    await showThink(this.panels, (onText) => this.call('think', {}, { onText }));
    this.unblock('think');
  }

  async runEnding() {
    this.block('ending');
    this.hud.setVisible(false);
    await this.fade(true);
    this.audio.chord();
    const choice = await showEnding(this.cards, this, (onText) => this.call('epilogue', {}, { onText }, { deferEvents: true }));
    if (choice === 'new') {
      this.unblock('ending');
      await this.startNew(this.view?.player?.name);
      return;
    }
    await this.fade(false);
    this.hud.setVisible(true);
    this.unblock('ending');
  }

  /** First-minute guidance, shown once per browser. */
  coachStart() {
    if (this.settings.coached) return;
    const tap = this.isTouch ? 'Tap' : 'Click';
    const steps = [
      this.isTouch
        ? '<b>Tap</b> where you want to go and you will walk there. <b>Drag</b> to look around. The ring on the left steers by thumb.'
        : '<b>Click</b> where you want to go, or walk with <b>W A S D</b>. <b>Drag</b> to look around.',
      `<b>Glowing diamonds</b> can be examined. <b>Speech bubbles</b> are people. ${tap} one. Your partner is by the window.`,
      `Lost? <b>Look</b> lists everyone and everything in the room. ${tap} a name and you walk straight to it.`,
    ];
    steps.forEach((html, i) => {
      setTimeout(() => {
        if (i === 0 || !this.blockers.size) this.hud.coach(html, 8500);
      }, i * 9500);
    });
    this.setSetting('coached', true);
  }
}
