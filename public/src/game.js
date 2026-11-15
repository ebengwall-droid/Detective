// The game controller: owns the latest view, sends player actions to the
// game core, and turns what comes back into things on screen.

import { World, STEP_DOWN } from './world/world.js';
import { assets } from './world/assets.js';
import { Audio } from './audio.js';
import { el } from './ui/dom.js';
import { createHud, showHere, showInspect, showThink, showCard, confirmCard } from './ui/hud.js';
import { showGuide } from './ui/guide.js';
import { createDialogue } from './ui/dialogue.js';
import { createNotebook } from './ui/notebook.js';
import { createLaptop } from './ui/laptop.js';
import { createMap } from './ui/map.js';
import { showTitle, showMenu, showHelp, showLetter, showEnding } from './ui/title.js';
import { SCENES } from '../../core/cases/fold/scenes.js';

const SETTINGS_KEY = 'fold.settings';
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
    this.caseInfo = client.caseInfo ?? { title: 'The Invigilator', series: 'The Fold', tagline: '' };
    /** Home-screen install, where the browser offers it (see main.js). */
    this.install = opts.install ?? null;
    this.settings = loadSettings();
    this.view = null;
    this.unseen = { notebook: false, laptop: false, map: false };
    /** Reasons the player cannot move right now. Empty means exploring. */
    this.blockers = new Set();
    /** Errors the page has thrown, kept short, for the diagnostics. */
    this.faults = [];
    const fault = (text) => {
      this.faults.push(String(text).slice(0, 180));
      if (this.faults.length > 8) this.faults.shift();
    };
    window.addEventListener('error', (e) => fault(e.message ?? e.error ?? 'error'));
    window.addEventListener('unhandledrejection', (e) => fault(e.reason?.message ?? e.reason ?? 'rejected promise'));
    this.started = false;
    /** Whether a history entry is standing by for the phone's Back button to consume. */
    this.backArmed = false;
    this.queue = [];
    this.flushing = false;
    /**
     * Which version of the game this page is. The two published versions are
     * each set up for one kind of device: 'mobile' for phones and tablets,
     * 'web' for computers. 'auto' (the development server, the stand-alone
     * page and the installable app) decides from the device.
     */
    this.device = window.FOLD_DEVICE === 'mobile' || window.FOLD_DEVICE === 'web' ? window.FOLD_DEVICE : 'auto';
    /** A screen you touch rather than point at: a phone or a tablet. */
    this.touchScreen = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    // The mobile version always has the touch interface. (Its controls also work with a mouse.)
    this.isTouch = this.device === 'mobile' || this.touchScreen;
    /** Where the other version lives, when this one is open on the wrong kind of device. */
    this.otherVersion = typeof window.FOLD_OTHER === 'string' && /^https:\/\//.test(window.FOLD_OTHER) ? window.FOLD_OTHER : null;
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
      const faces = ['16px "Marcellus"', '16px "Special Elite"', '16px "Instrument Sans"', '700 16px "Instrument Sans"', '16px "JetBrains Mono"', '700 16px "Cinzel"'];
      const loaded = Promise.all(faces.map((face) => document.fonts.load(face))).then(() => document.fonts.ready);
      await Promise.race([loaded, new Promise((r) => setTimeout(r, 2500))]);
    } catch {
      /* fonts are a nicety */
    }
    // The graphics a device starts at (it steps down by itself if frames run slow). The web version
    // gives a computer the full picture, whatever the window's size; phones and tablets start lighter.
    const auto = this.device === 'web' ? (this.touchScreen ? 'medium' : 'high') : this.isTouch || window.innerWidth < 900 ? 'medium' : 'high';
    const quality = this.opts.quality ?? (this.settings.quality === 'auto' ? auto : this.settings.quality);
    this.world.init({ quality, brightness: this.settings.bright });
    this.world.noAutoQuality = !!this.opts.noAutoQuality || this.settings.quality !== 'auto';
    this.world.controls.sensitivity = this.settings.sens;
    this.world.controls.setTouchUi(this.isTouch);
    this.hud.setTouch(this.isTouch);
    this.wire();

    // The wheelwright's shop, slowly, behind the title.
    const shop = SCENES.wheelshop ?? Object.values(SCENES)[0];
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
    // Hold the opening card until the room behind the title is dressed.
    await this.world.whenReady(15000);
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

  /** Say once that part of what is on screen is a stand-in, and that it will be swapped. */
  noteMissing() {
    if (this.toldMissing || !this.started || !assets.missing) return;
    this.toldMissing = true;
    this.hud.toast({ kind: 'alert', iconName: 'gear', title: 'Still fetching', text: 'The connection dropped part of this room, so some of it is a plain stand-in. It will be swapped as it arrives.' });
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
    // A model that would not download leaves a plainer stand-in in its place. Say so once, rather
    // than leave the player wondering why the room looks unfinished; it is swapped the moment it lands.
    // Set where the glass tokens are declared (the page root), so every sheet that uses them follows.
    w.on('tilt', (deg) => document.documentElement.style.setProperty('--tilt', `${deg}deg`));
    w.on('missing', () => {
      if (!this.fadeEl.classList.contains('on')) this.noteMissing();
    });
    w.on('slow', (from) => {
      const next = STEP_DOWN[from];
      if (!next) return;
      this.world.setQuality(next);
      // Say so once; after that it just gets on with it.
      if (!this.toldSlow) this.hud.toast({ iconName: 'gear', title: 'Graphics eased', text: 'To keep things smooth. You can change this in the menu.' });
      this.toldSlow = true;
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
      history.pushState({ fold: 'layer' }, '');
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

  async fade(on) {
    if (this.fadeEl.classList.contains('on') === on) return;
    // Never lift the dark on a room that is still arriving.
    if (!on) await this.arrive();
    this.fadeEl.classList.toggle('on', on);
    await new Promise((r) => setTimeout(r, FADE_MS));
    // If the room had to be shown unfinished, say so now that it can be seen.
    if (!on) setTimeout(() => this.noteMissing(), 900);
  }

  /** Wait for the room on screen to have its furniture and people, saying so if it takes a moment. */
  async arrive(limit = 40000) {
    const had = this.fadeEl.textContent;
    let done = false;
    const say = () => {
      if (done) return;
      const part = Math.round(assets.fraction() * 100);
      this.fadeEl.textContent = part < 100 ? `Setting the scene · ${part}%` : 'Setting the scene';
      setTimeout(say, 200);
    };
    // Only mention it when it is slow enough to wonder about.
    const note = setTimeout(say, 700);
    await this.world.whenReady(limit);
    done = true;
    clearTimeout(note);
    this.fadeEl.textContent = had;
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
    // A new day starts from the room's own first view, not wherever you were last standing
    // (unless it dawns in the middle of a conversation, which keeps its close-up).
    const newDay = !!prev && prev.act?.n !== view.act?.n && !this.dialogue?.isOpen;
    this.world.loadLocation(view.location, { respawn: fresh || newDay });
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
      /** New places on the map, said once together rather than one notice each. */
      const places = [];
      while (this.queue.length) {
        const e = this.queue.shift();
        if (e.type === 'act') {
          if (this.dialogue.isOpen) held.push(e);
          else await this.showAct(e);
        } else if (e.type === 'unlock') {
          places.push(e.name);
        } else {
          this.present(e, facts);
        }
      }
      if (places.length) {
        this.unseen.map = true;
        const list = places.length === 1 ? places[0] : `${places.slice(0, -1).join(', ')} and ${places[places.length - 1]}`;
        this.hud.toast({ kind: 'alert', iconName: 'pin', title: places.length === 1 ? 'New place on the map' : `${places.length} new places on the map`, text: list, onClick: () => this.open('map') });
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
        hud.toast({ kind: 'alert', iconName: 'letter', title: 'By the Bellows', text: e.text });
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
      case 'puzzle':
        if (e.opened && !e.secret) {
          this.unseen.notebook = true;
          hud.toast({ kind: 'alert', iconName: 'paper', title: 'A new paper', text: e.title, onClick: () => this.openPuzzle(e.id) });
        }
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
    // The first card is where Ravel, the Fold and the Flat are first named: offer the pictures.
    const extra = e.act === 1 ? { label: 'See a map first', onClick: () => showGuide(this.cards) } : null;
    await showCard(this.cards, { kicker: ACT_KICKER[e.act] ?? '', title: e.title, date: e.date, lines: e.card, extra });
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

  /** Open the notebook at one paper. */
  openPuzzle(id) {
    this.notebook.selectPuzzle(id);
    this.open('notebook', 'papers');
  }

  /** Put a question to the Lectern, from anywhere. */
  askLectern(query) {
    this.open('laptop', 'ask');
    this.laptop.ask(query);
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
      const sure = await confirmCard(this.cards, { title: 'Start over?', text: 'Your current case will be deleted, and a new one will start from the first day.', yes: 'Start over', no: 'Keep this case' });
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
    this.toldEased = false;
  }

  /**
   * Who is playing the cast can change while you talk: if the best model
   * keeps people waiting, everyday conversation moves to the fast one. Returns
   * the sentence that says so, once, for the conversation to show; otherwise null.
   */
  aiChanged() {
    const ai = this.client?.ai;
    if (!ai?.eased || this.toldEased) return null;
    this.toldEased = true;
    return ai.easedWhy === 'limit'
      ? 'Claude Opus is at its limit for now, so everyday talk has moved to Claude\u2019s fast model. You can change that in the menu.'
      : 'Answers were slow to start, so everyday talk now uses Claude\u2019s fast model. You can change that in the menu.';
  }

  /**
   * A plain-text account of what this device is doing with the game: for a
   * player to copy and send when something looks wrong. Nothing personal is
   * in it, and nothing leaves the page unless they paste it somewhere.
   */
  diagnostics() {
    const w = this.world;
    const r = w.renderer;
    const gl = r?.getContext?.();
    let gpu = 'unknown';
    try {
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) ?? 'unknown';
    } catch {
      /* some browsers refuse this */
    }
    const ai = this.client?.ai ?? {};
    const info = r?.info ?? {};
    const got = assets.status();
    const lines = [
      `${document.title} (version: ${this.device})`,
      `screen ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio ?? 1}, ${this.isTouch ? 'touch' : 'pointer'}, drawing at ${r ? r.getPixelRatio().toFixed(2) : '?'}x`,
      `graphics ${w.quality}${this.settings.quality === 'auto' ? ' (auto)' : ' (chosen)'}, finishing pass ${w.post ? 'on' : 'OFF'}, about ${Math.round(1 / Math.max(0.004, w.lastDt ?? 0.016))} fps`,
      `gpu ${String(gpu).slice(0, 90)} (WebGL${gl && typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? '2' : '1'})`,
      `scene ${this.view?.location?.id ?? '-'}: ${info.memory?.geometries ?? '?'} geometries, ${info.memory?.textures ?? '?'} textures, ${info.programs?.length ?? '?'} programs`,
      `models ${got.manifests ? `${got.loaded} loaded${assets.packed ? ' (packed)' : ''}` : 'NOT LOADED (people and furniture drawn in code)'}${got.failed.length ? `, failed: ${got.failed.slice(0, 6).join(' ')}` : ''}`,
      `characters ${ai.live ? `live (${ai.label ?? ai.model ?? 'Claude'}${ai.hosted ? `, hosted, set to ${ai.pref ?? '-'}` : ''})` : `script (${ai.reason ?? 'no model'})`}${ai.resting ? ', resting after failures' : ''}`,
      ...(ai.pace && (ai.pace.opus !== null || ai.pace.quick !== null) ? [`  first words after: ${ai.pace.opus !== null ? `Opus ${(ai.pace.opus / 1000).toFixed(1)} s` : ''}${ai.pace.opus !== null && ai.pace.quick !== null ? ', ' : ''}${ai.pace.quick !== null ? `fast ${(ai.pace.quick / 1000).toFixed(1)} s` : ''}`] : []),
      ...(ai.trouble ?? []).map((t) => `  model call failed: ${t.tag} ${t.code ?? ''} ${t.message}`),
      `case day ${this.view?.act?.n ?? '-'}, ${this.view?.facts?.length ?? 0} leads, mode ${this.client?.mode ?? '-'}`,
      ...this.faults.slice(-5).map((f) => `  error: ${f}`),
      `agent ${navigator.userAgent}`,
    ];
    return lines.join('\n');
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
        // An object that is itself a puzzle: read it, then sit down to it.
        const pid = typeof res.action === 'string' && res.action.startsWith('puzzle:') ? res.action.slice(7) : null;
        const paper = pid ? this.view.puzzles.find((p) => p.id === pid) : null;
        if (res.text) {
          this.audio.click();
          const taken = res.taken.map((tid) => this.view.evidence.find((e) => e.id === tid)).filter(Boolean);
          const more = this.view.location.hotspots.some((h) => !h.done && h.kind !== 'exit');
          const actions = [];
          if (paper && !paper.solved) actions.push({ id: 'paper', label: 'Work on it' });
          if (more) actions.push({ id: 'look', label: 'What else is here?' });
          const choice = await showInspect(this.panels, { title: res.title, text: res.text, taken, actions });
          if (choice === 'look') next = 'look';
          else if (choice === 'paper') next = `puzzle:${pid}`;
        } else if (paper && !paper.solved) {
          next = `puzzle:${pid}`;
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
    else if (next?.startsWith('puzzle:')) this.openPuzzle(next.slice(7));
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
    this.world.focusNpc(id, side, frac, r?.rail ?? 0);
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
      `<b>Rings of light</b> mark what you can examine; a ring with <b>three dots</b> is someone to talk to. ${tap} one. Your partner is waiting by the gate.`,
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
