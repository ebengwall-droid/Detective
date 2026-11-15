// Parts the puzzle stage builds its objects from: text you can pick a word
// out of, codes you decode against a key one tap at a time, a line of
// letters with its reading underneath, and a way to make things glide to
// where they now belong instead of jumping.

import { el } from './dom.js';

const NS = 'http://www.w3.org/2000/svg';

/** An SVG element. */
export function sv(tag, attrs = {}, ...kids) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) node.setAttribute(k, String(v));
  for (const c of kids.flat()) if (c !== null && c !== undefined) node.append(c);
  return node;
}

export const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** The first cipher text on a puzzle. */
export const monoOf = (p) => p.blocks.find((b) => b.mono)?.mono ?? '';

/**
 * Move things, then let each glide from where it was to where it now is.
 * @param {Element[]} nodes
 * @param {() => void} change
 */
export function glide(nodes, change, { ms = 460 } = {}) {
  if (still() || typeof Element.prototype.animate !== 'function') {
    change();
    return;
  }
  const before = new Map(nodes.map((n) => [n, n.getBoundingClientRect()]));
  change();
  nodes.forEach((n, i) => {
    const a = before.get(n);
    const b = n.getBoundingClientRect();
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    n.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: ms, delay: Math.min(i * 6, 160), easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
  });
}

/** A short shake, for "no". */
export function shake(node) {
  node.classList.remove('nope');
  void node.getBoundingClientRect();
  node.classList.add('nope');
}

/** Swap a letter in place with a little roll, if it really changed. */
function roll(node, ch) {
  if (node.textContent === ch) return;
  node.textContent = ch;
  if (still()) return;
  node.classList.remove('rolled');
  void node.offsetWidth;
  node.classList.add('rolled');
}

// ------------------------------------------------------------------ reading

/**
 * A line of text with its reading written under it, letter for letter: the
 * cipher on top in the setter's ink, what it says underneath. The reading can
 * be picked from: tap a word (or a letter, where there are no spaces) to
 * choose it, tap another to stretch the choice to it, tap the choice to let go.
 * @param {{ cls?: string, pick?: (text: string|null) => void, spaced?: boolean }} o
 */
export function interlinear({ cls = '', pick = null, spaced = true } = {}) {
  const node = el('div', { class: `inter ${cls} ${pick ? 'pickable' : ''}` });
  /** @type {{ top: HTMLElement, bot: HTMLElement, letter: boolean }[]} */
  let cells = [];
  let shape = '';
  /** Letter cells, in order, and the words they make. */
  let letters = [];
  let words = [];
  let sel = null;
  let open = false;
  let current = '';

  function build(top) {
    node.replaceChildren();
    cells = [];
    letters = [];
    words = [];
    let si = 0;
    for (const g of top.split(/(\s+)/)) {
      if (!g) continue;
      if (/^\s+$/.test(g)) {
        node.append(' ');
        si += g.length;
        continue;
      }
      const word = el('span', { class: 'iw' });
      const start = letters.length;
      for (const ch of g) {
        const isLetter = /[A-Z]/.test(ch);
        const t = el('span', { class: 'it', text: ch });
        const b = el('span', { class: 'ib', text: isLetter ? '' : ch });
        const c = el('span', { class: `ic ${isLetter ? '' : 'punct'}` }, t, b);
        if (isLetter) {
          c.dataset.i = String(letters.length);
          letters.push(c);
        }
        cells.push({ top: t, bot: b, letter: isLetter, si });
        word.append(c);
        si += 1;
      }
      if (letters.length > start) {
        if (spaced) words.push([start, letters.length - 1]);
        else for (let i = start; i < letters.length; i++) words.push([i, i]);
      }
      node.append(word);
    }
    shape = top;
  }

  /** Show `top` with `bottom` (the same shape, letter for letter, or null for nothing yet) under it. */
  function set(top, bottom) {
    if (top !== shape) {
      build(top);
      sel = null;
    }
    for (const c of cells) {
      if (!c.letter) continue;
      const ch = bottom ? bottom[c.si] ?? '' : '';
      roll(c.bot, /[A-Z]/.test(ch) ? ch : bottom ? '·' : '');
    }
    current = bottom ?? '';
    node.classList.toggle('unread', !bottom);
    paint();
    if (sel) pick?.(selected());
  }

  function selected() {
    if (!sel) return null;
    let out = '';
    let lastWord = -1;
    for (let i = sel[0]; i <= sel[1]; i++) {
      const w = words.findIndex(([a, b]) => i >= a && i <= b);
      if (spaced && lastWord !== -1 && w !== lastWord) out += ' ';
      lastWord = w;
      out += letters[i].querySelector('.ib').textContent;
    }
    return out.replace(/·/g, '').trim() || null;
  }

  function paint() {
    letters.forEach((c, i) => c.classList.toggle('picked', !!sel && i >= sel[0] && i <= sel[1]));
  }

  if (pick) {
    node.addEventListener('click', (e) => {
      const cell = /** @type {HTMLElement} */ (e.target).closest?.('[data-i]');
      if (!cell || !current) return;
      const i = Number(cell.dataset.i);
      const unit = words.find(([a, b]) => i >= a && i <= b) ?? [i, i];
      const inside = sel && i >= sel[0] && i <= sel[1];
      if (sel && open) {
        sel = [Math.min(sel[0], unit[0]), Math.max(sel[1], unit[1])];
        open = false;
      } else if (sel && inside) {
        sel = null;
      } else {
        sel = [unit[0], unit[1]];
        open = true;
      }
      paint();
      pick(selected());
    });
  }

  return { node, set, clear: () => { sel = null; paint(); pick?.(null); } };
}

/**
 * A plain strip of letters (a knight's path, letters taken from a column) that
 * can be picked from the same way, a letter at a time.
 * @param {{ cls?: string, pick?: (text: string|null) => void, empty?: string }} o
 */
export function letterStrip({ cls = '', pick = null, empty = '' } = {}) {
  const node = el('div', { class: `lstrip ${cls} ${pick ? 'pickable' : ''}` });
  let sel = null;
  let open = false;
  let text = '';
  function set(t) {
    const fresh = t !== text;
    if (t.length < text.length || !t.startsWith(text)) sel = null;
    text = t;
    node.replaceChildren(...(text ? text.split('').map((ch, i) => el('span', { class: `ls ${fresh && i === text.length - 1 ? 'new' : ''}`, dataset: { i: String(i) }, text: ch })) : [el('span', { class: 'ls-empty', text: empty })]));
    paint();
  }
  function paint() {
    node.querySelectorAll('.ls').forEach((s, i) => s.classList.toggle('picked', !!sel && i >= sel[0] && i <= sel[1]));
  }
  if (pick) {
    node.addEventListener('click', (e) => {
      const s = /** @type {HTMLElement} */ (e.target).closest?.('[data-i]');
      if (!s) return;
      const i = Number(s.dataset.i);
      const inside = sel && i >= sel[0] && i <= sel[1];
      if (sel && open) {
        sel = [Math.min(sel[0], i), Math.max(sel[1], i)];
        open = false;
      } else if (sel && inside) sel = null;
      else {
        sel = [i, i];
        open = true;
      }
      paint();
      pick(sel ? text.slice(sel[0], sel[1] + 1) : null);
    });
  }
  set('');
  return { node, set, get text() { return text; } };
}

// ------------------------------------------------------------------ codes and keys

/**
 * Codes to decode against a key, one tap at a time: tap a code, then its
 * letter in the key, and every copy of that code takes the letter. The next
 * code still to do is chosen for you.
 * @param {{ words: string[][], draw: (code: string) => Node|string, cls?: string, onChange: (reading: string) => void, tap?: () => void }} o
 */
export function assigner({ words, draw, cls = '', onChange, tap }) {
  const map = new Map();
  const items = [];
  let selected = null;
  const node = el(
    'div',
    { class: `codes ${cls}` },
    words.map((w) =>
      el(
        'span',
        { class: 'code-word' },
        w.map((item) => {
          // An item is a code, or a code and what to show for it (a group of letters whose code is its pattern).
          const code = typeof item === 'string' ? item : item.code;
          const face = typeof item === 'string' ? draw(item) : item.face;
          const slot = el('span', { class: 'code-slot', 'aria-hidden': 'true' });
          const b = el('button', { class: 'code', type: 'button', 'aria-label': typeof face === 'string' ? face : 'A sign' }, el('span', { class: 'code-face' }, face), slot);
          b.addEventListener('click', () => {
            tap?.();
            selected = code;
            paint();
          });
          items.push({ code, node: b, slot });
          return b;
        }),
      ),
    ),
  );
  const reading = () => words.map((w) => w.map((it) => map.get(typeof it === 'string' ? it : it.code) ?? '·').join('')).join(' ');
  function paint() {
    for (const it of items) {
      it.node.classList.toggle('on', it.code === selected);
      it.node.classList.toggle('set', map.has(it.code));
      const ch = map.get(it.code) ?? '';
      if (it.slot.textContent !== ch) {
        it.slot.textContent = ch;
        if (ch && !still()) {
          it.slot.classList.remove('pop');
          void it.slot.offsetWidth;
          it.slot.classList.add('pop');
        }
      }
    }
  }
  selected = items[0]?.code ?? null;
  paint();
  return {
    node,
    get selected() {
      return selected;
    },
    /** Give the chosen code a letter. False if no code is chosen. */
    assign(letter) {
      if (selected === null) return false;
      map.set(selected, letter);
      const next = items.find((it) => !map.has(it.code));
      selected = next ? next.code : null;
      paint();
      onChange(reading());
      return true;
    },
    reading,
    clear() {
      map.clear();
      selected = items[0]?.code ?? null;
      paint();
      onChange(reading());
    },
  };
}

/** Flash a key cell that was just used. */
export function flash(node) {
  if (still()) return;
  node.classList.remove('flash');
  void node.getBoundingClientRect();
  node.classList.add('flash');
}

/**
 * A small stepper: − value +.
 * @param {{ label: string, min: number, max: number, value: number, onChange: (v: number) => void, show?: (v: number) => string }} o
 */
export function stepper({ label, min, max, value, onChange, show = String }) {
  let v = value;
  const out = el('span', { class: 'step-val', text: show(v) });
  const set = (n) => {
    const to = Math.max(min, Math.min(max, n));
    if (to === v) return;
    v = to;
    out.textContent = show(v);
    less.disabled = v <= min;
    more.disabled = v >= max;
    onChange(v);
  };
  const less = el('button', { class: 'step-btn', type: 'button', 'aria-label': `Fewer ${label}`, text: '−', onClick: () => set(v - 1) });
  const more = el('button', { class: 'step-btn', type: 'button', 'aria-label': `More ${label}`, text: '+', onClick: () => set(v + 1) });
  less.disabled = v <= min;
  more.disabled = v >= max;
  return { node: el('div', { class: 'stepper', role: 'group', 'aria-label': label }, el('span', { class: 'step-label', text: label }), less, out, more), get value() { return v; }, set };
}

/**
 * Letters typed onto tiles: a key word for a cipher. Tap the tiles and type.
 * @param {{ max?: number, onChange: (word: string) => void, placeholder?: string }} o
 */
export function keyTiles({ max = 14, onChange, placeholder = 'Key word' }) {
  const field = el('input', { class: 'tiles-type', type: 'text', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: String(max), enterkeyhint: 'done', 'aria-label': placeholder });
  const tiles = el('div', { class: 'tiles', 'aria-hidden': 'true' });
  const node = el('label', { class: 'keytiles' }, field, tiles);
  let word = '';
  const draw = () => {
    const kids = word.split('').map((ch) => el('span', { class: 'tile', text: ch }));
    if (word.length < max) kids.push(el('span', { class: `tile caret ${word ? '' : 'empty'}`, text: word ? '' : placeholder }));
    tiles.replaceChildren(...kids);
  };
  field.addEventListener('input', () => {
    const next = field.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, max);
    if (field.value !== next) field.value = next;
    if (next === word) return;
    word = next;
    draw();
    onChange(word);
  });
  field.addEventListener('focus', () => node.classList.add('on'));
  field.addEventListener('blur', () => node.classList.remove('on'));
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      field.blur();
      e.preventDefault();
    }
  });
  draw();
  return { node, focus: () => field.focus({ preventScroll: true }), get value() { return word; } };
}
