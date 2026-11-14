// Input for walking around: keyboard, mouse and touch, reduced to three
// things the world cares about — a movement vector, look deltas, and taps.
//
// Desktop: WASD / arrows to move, drag to look, click to interact.
//          Press F for mouse-look (pointer lock) where the browser allows it.
// Touch:   left thumb is a floating joystick, anywhere else drags the view,
//          a quick tap interacts with (or walks to) whatever is under it.

// A touch that stays this close to where it landed, for no longer than this,
// is a tap. Fingers wobble more than a mouse and are slower to lift.
const TAP = { touch: { px: 16, ms: 420 }, mouse: { px: 6, ms: 320 } };

export class Controls {
  /**
   * @param {HTMLElement} surface the element that receives pointer input (the canvas)
   * @param {HTMLElement} overlay where the joystick is drawn
   */
  constructor(surface, overlay) {
    this.surface = surface;
    this.overlay = overlay;
    this.enabled = false;
    this.move = { x: 0, z: 0 };
    this.lookX = 0;
    this.lookY = 0;
    this.sensitivity = 1;
    this.invertY = false;
    this.locked = false;
    this.isTouch = false;
    /** @type {(x: number, y: number) => void} */
    this.onTap = () => {};
    /** @type {(x: number, y: number) => void} */
    this.onHover = () => {};
    /** @type {(key: string) => void} */
    this.onKey = () => {};
    /** @type {(locked: boolean) => void} */
    this.onLockChange = () => {};

    this.keys = new Set();
    /** @type {Map<number, {kind: 'stick'|'look', x0: number, y0: number, x: number, y: number, t0: number, far: number, lim: {px: number, ms: number}}>} */
    this.pointers = new Map();

    this.stick = document.createElement('div');
    this.stick.className = 'stick';
    this.stick.innerHTML = '<div class="stick-knob"></div>';
    this.stick.hidden = true;
    overlay.appendChild(this.stick);
    this.knob = /** @type {HTMLElement} */ (this.stick.firstElementChild);

    // A resting joystick so a phone player can see where their thumb goes.
    // The real one appears wherever the thumb actually lands.
    this.touchUi = false;
    this.ghost = document.createElement('div');
    this.ghost.className = 'stick-ghost';
    this.ghost.innerHTML = '<div class="stick-knob"></div><span>Move</span>';
    this.ghost.hidden = true;
    overlay.appendChild(this.ghost);

    this.bind();
  }

  bind() {
    const s = this.surface;
    s.style.touchAction = 'none';
    s.addEventListener('pointerdown', (e) => this.down(e));
    s.addEventListener('pointermove', (e) => this.moveEvent(e));
    s.addEventListener('pointerup', (e) => this.up(e));
    s.addEventListener('pointercancel', (e) => this.up(e, true));
    s.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => this.keydown(e));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === s;
      this.onLockChange(this.locked);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked || !this.enabled) return;
      this.lookX += e.movementX;
      this.lookY += e.movementY;
    });
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) {
      this.reset();
      if (this.locked) document.exitPointerLock?.();
    }
    this.showGhost();
  }

  /** Tell the controls this is a touch screen before the first touch arrives. */
  setTouchUi(on) {
    this.touchUi = on;
    this.showGhost();
  }

  showGhost() {
    const steering = [...this.pointers.values()].some((p) => p.kind === 'stick');
    this.ghost.hidden = !(this.enabled && this.touchUi && !steering);
  }

  reset() {
    this.keys.clear();
    this.pointers.clear();
    this.move.x = 0;
    this.move.z = 0;
    this.stick.hidden = true;
  }

  typing(e) {
    const t = /** @type {HTMLElement} */ (e.target);
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  keydown(e) {
    if (this.typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Escape') {
      if (this.enabled && !this.locked) this.onKey('escape');
      return;
    }
    const hotkeys = { KeyE: 'interact', Enter: 'interact', Space: 'interact', KeyN: 'notebook', Tab: 'notebook', KeyM: 'map', KeyL: 'laptop', KeyT: 'think', KeyQ: 'scan', KeyF: 'lock', KeyH: 'help' };
    if (!this.enabled) {
      // Panels are open: only their own shortcuts apply.
      return;
    }
    if (hotkeys[e.code]) {
      e.preventDefault();
      if (!e.repeat) this.onKey(hotkeys[e.code]);
      return;
    }
    if (e.code.startsWith('Arrow') || e.code.startsWith('Key')) this.keys.add(e.code);
    if (e.code.startsWith('Arrow')) e.preventDefault();
  }

  toggleLock() {
    if (this.locked) document.exitPointerLock?.();
    else {
      try {
        const p = this.surface.requestPointerLock?.();
        if (p?.catch) p.catch(() => {});
      } catch {
        /* Not available here (phones, some embedded views). Drag-look still works. */
      }
    }
  }

  down(e) {
    if (!this.enabled) return;
    if (e.pointerType === 'touch' && !this.isTouch) {
      this.isTouch = true;
      this.touchUi = true;
    }
    if (this.locked) return;
    const rect = this.surface.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const active = [...this.pointers.values()];
    const stickFree = !active.some((p) => p.kind === 'stick');
    const inStickZone = e.pointerType === 'touch' && this.inStickZone(x, y, rect);
    // One finger steers and one turns. A third (or a pinch) does nothing rather than fight them.
    const kind = inStickZone && stickFree ? 'stick' : active.some((p) => p.kind === 'look') ? 'idle' : 'look';
    this.pointers.set(e.pointerId, { kind, x0: x, y0: y, x, y, t0: performance.now(), far: 0, lim: e.pointerType === 'mouse' ? TAP.mouse : TAP.touch });
    try {
      this.surface.setPointerCapture(e.pointerId);
    } catch {
      /* some browsers refuse capture on synthetic events */
    }
    if (kind === 'stick') {
      this.stick.hidden = false;
      this.stick.style.left = `${x}px`;
      this.stick.style.top = `${y}px`;
      this.knob.style.transform = 'translate(-50%, -50%)';
    }
    this.showGhost();
  }

  /** The thumb steers from the ring and a little around it; anywhere else turns the view. */
  inStickZone(x, y, rect) {
    this.ghost.hidden = false;
    const g = this.ghost.getBoundingClientRect();
    this.showGhost();
    if (!g.width) return x < rect.width * 0.45 && y > rect.height * 0.4;
    const cx = g.left + g.width / 2 - rect.left;
    const cy = g.top + g.height / 2 - rect.top;
    return Math.hypot(x - cx, y - cy) <= Math.max(100, g.width * 1.1);
  }

  moveEvent(e) {
    const rect = this.surface.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = this.pointers.get(e.pointerId);
    if (!p) {
      if (this.enabled && e.pointerType === 'mouse' && !this.locked) this.onHover(x, y);
      return;
    }
    if (!this.enabled) return;
    const dx = x - p.x;
    const dy = y - p.y;
    p.x = x;
    p.y = y;
    p.far = Math.max(p.far, Math.hypot(x - p.x0, y - p.y0));
    if (p.kind === 'stick') {
      const max = 46;
      let ox = x - p.x0;
      let oy = y - p.y0;
      const len = Math.hypot(ox, oy);
      if (len > max) {
        ox = (ox / len) * max;
        oy = (oy / len) * max;
      }
      this.knob.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
      const dead = 0.14;
      const nx = ox / max;
      const ny = oy / max;
      const mag = Math.hypot(nx, ny);
      if (mag < dead) {
        this.move.x = 0;
        this.move.z = 0;
      } else {
        const k = (mag - dead) / (1 - dead) / mag;
        this.move.x = nx * k;
        this.move.z = -ny * k;
      }
    } else if (p.kind === 'look' && p.far > p.lim.px) {
      const scale = e.pointerType === 'touch' ? 1.7 : 1.15;
      this.lookX += dx * scale;
      this.lookY += dy * scale;
    }
  }

  up(e, cancelled = false) {
    const p = this.pointers.get(e.pointerId);
    if (this.locked && this.enabled && e.button === 0 && !p) {
      const rect = this.surface.getBoundingClientRect();
      this.onTap(rect.width / 2, rect.height / 2);
      return;
    }
    if (!p) return;
    this.pointers.delete(e.pointerId);
    if (p.kind === 'stick') {
      this.stick.hidden = true;
      this.move.x = 0;
      this.move.z = 0;
    }
    this.showGhost();
    if (!cancelled && this.enabled && p.kind !== 'idle' && p.far <= p.lim.px && performance.now() - p.t0 < p.lim.ms) {
      this.onTap(p.x, p.y);
    }
  }

  /** Combine stick and keys into one movement vector in the player's frame. */
  read() {
    let x = this.move.x;
    let z = this.move.z;
    if (this.enabled) {
      const k = this.keys;
      if (k.has('KeyW') || k.has('ArrowUp')) z += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) z -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    }
    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }
    const look = { x: this.lookX * this.sensitivity, y: this.lookY * this.sensitivity * (this.invertY ? -1 : 1) };
    this.lookX = 0;
    this.lookY = 0;
    return { x, z, look };
  }
}
