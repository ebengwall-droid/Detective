// Brass rings you turn with your hands, and the letter-locks made of them.
//
//   swipe a ring up or down, or tap above or below its letter, to turn it
//   type on a focused ring to set it, and the next ring is focused
//   (on a phone, the keyboard button under the rings brings up the keyboard)
//   arrow keys turn the focused ring; Enter does whatever the rings are for
//
// A wrong word shakes the lock and the bolt stays put; the right one slides
// the bolt back. The answer is never in here: the game checks the word.

import { el, icon } from './dom.js';

export const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const STEP = 26; // pixels of drag per symbol

/**
 * One ring: a drum of symbols.
 * @param {{ symbols?: string[], at?: number, label: string, onTurn?: (by: number) => void, tick?: () => void }} o
 */
export function makeRing({ symbols = ABC, at = 0, label, onTurn, tick }) {
  const n = symbols.length;
  let index = ((at % n) + n) % n;
  const prev = el('span', { class: 'ring-letter ring-prev', 'aria-hidden': 'true' });
  const cur = el('span', { class: 'ring-letter ring-cur' });
  const next = el('span', { class: 'ring-letter ring-next', 'aria-hidden': 'true' });
  const drum = el('span', { class: 'ring-drum' }, prev, cur, next);
  const node = el(
    'div',
    { class: 'ring', role: 'spinbutton', tabindex: '0', 'aria-label': label, 'aria-valuemin': '1', 'aria-valuemax': String(n) },
    el('span', { class: 'ring-arrow up', 'aria-hidden': 'true' }),
    drum,
    el('span', { class: 'ring-arrow down', 'aria-hidden': 'true' }),
  );

  function draw(dir = 0) {
    cur.textContent = symbols[index];
    prev.textContent = symbols[(index + n - 1) % n];
    next.textContent = symbols[(index + 1) % n];
    node.classList.toggle('wide', symbols[index].length > 1);
    node.setAttribute('aria-valuenow', String(index + 1));
    node.setAttribute('aria-valuetext', symbols[index]);
    if (dir) {
      // The ring rolls the way it was pushed.
      drum.classList.remove('roll-up', 'roll-down');
      void drum.offsetWidth;
      drum.classList.add(dir > 0 ? 'roll-up' : 'roll-down');
    }
  }

  const ring = {
    node,
    get value() {
      return symbols[index];
    },
    get index() {
      return index;
    },
    turn(by) {
      if (!by) return;
      index = (((index + by) % n) + n) % n;
      draw(by);
      tick?.();
      onTurn?.(by);
    },
    /** Set it to a symbol (a letter typed on it), rolling the short way round. */
    setTo(symbol) {
      const to = symbols.indexOf(String(symbol).toUpperCase());
      if (to < 0) return false;
      let by = to - index;
      if (by > n / 2) by -= n;
      if (by < -n / 2) by += n;
      ring.turn(by);
      return true;
    },
  };

  // Swipe to turn, a symbol for every step; a tap above or below the middle turns it one.
  let startY = null;
  let moved = 0;
  let turned = 0;
  node.addEventListener('pointerdown', (e) => {
    startY = e.clientY;
    moved = 0;
    turned = 0;
    node.setPointerCapture?.(e.pointerId);
    node.focus({ preventScroll: true });
    e.preventDefault();
  });
  node.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    const dy = e.clientY - startY;
    moved = Math.max(moved, Math.abs(dy));
    const steps = Math.trunc(dy / STEP);
    if (steps !== turned) {
      // Dragging down brings the symbol above into the window, as on a real ring.
      ring.turn(-(steps - turned));
      turned = steps;
    }
  });
  node.addEventListener('pointerup', (e) => {
    if (startY === null) return;
    if (moved < 8) {
      const box = node.getBoundingClientRect();
      ring.turn(e.clientY < box.top + box.height / 2 ? -1 : 1);
    }
    startY = null;
  });
  node.addEventListener('pointercancel', () => {
    startY = null;
  });
  draw();
  return ring;
}

/**
 * A row of rings that reads as one word, with a keyboard of its own for phones.
 * @param {{ count: number, start?: string|string[], symbols?: string[], label?: string, onChange?: () => void, onEnter?: () => void, tick?: () => void, typing?: boolean }} o
 */
export function ringRow({ count, start = '', symbols = ABC, label = 'Ring', onChange, onEnter, tick, typing = true }) {
  const rings = [];
  const first = Array.isArray(start) ? start : String(start).split('');
  for (let i = 0; i < count; i++) {
    const at = Math.max(0, symbols.indexOf(String(first[i] ?? symbols[0]).toUpperCase()));
    rings.push(makeRing({ symbols, at, label: `${label} ${i + 1} of ${count}`, onTurn: () => onChange?.(), tick }));
  }
  const focusRing = (i) => rings[Math.max(0, Math.min(count - 1, i))]?.node.focus({ preventScroll: true });
  rings.forEach((r, i) => {
    r.node.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') r.turn(-1);
      else if (e.key === 'ArrowDown') r.turn(1);
      else if (e.key === 'ArrowLeft' || e.key === 'Backspace') focusRing(i - 1);
      else if (e.key === 'ArrowRight') focusRing(i + 1);
      else if (e.key === 'Enter') onEnter?.();
      else if (e.key.length === 1 && r.setTo(e.key)) focusRing(i + 1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    });
  });

  const box = el('div', { class: `ring-row rings-${count}` }, rings.map((r) => r.node));
  const node = el('div', { class: 'ring-set' }, box);

  // Phones have no keys to press on a ring: a hidden field under the rings takes the typing.
  if (typing) {
    let cursor = 0;
    const field = el('input', { class: 'ring-type', type: 'text', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'characters', spellcheck: 'false', enterkeyhint: 'done', 'aria-label': 'Type the letters onto the rings', tabindex: '-1' });
    const mark = () => rings.forEach((r, i) => r.node.classList.toggle('typing', document.activeElement === field && i === cursor));
    const take = () => {
      for (const ch of field.value) {
        if (cursor < count && rings[cursor].setTo(ch)) cursor = Math.min(count, cursor + 1);
      }
      field.value = '';
      if (cursor >= count) field.blur();
      mark();
    };
    field.addEventListener('focus', () => {
      const at = rings.findIndex((r) => r.node === document.activeElement);
      cursor = at >= 0 ? at : 0;
      node.classList.add('typing-on');
      mark();
    });
    field.addEventListener('blur', () => {
      node.classList.remove('typing-on');
      rings.forEach((r) => r.node.classList.remove('typing'));
    });
    field.addEventListener('input', take);
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !field.value) {
        cursor = Math.max(0, cursor - 1);
        mark();
        e.preventDefault();
      } else if (e.key === 'Enter') {
        field.blur();
        onEnter?.();
        e.preventDefault();
      }
    });
    const kb = el('button', { class: 'ring-kb', type: 'button', 'aria-label': 'Type the letters' }, icon('keyboard', 18), 'Type');
    kb.addEventListener('pointerdown', (e) => e.preventDefault());
    kb.addEventListener('click', () => {
      cursor = 0;
      field.focus({ preventScroll: true });
      mark();
    });
    if (symbols === ABC) node.append(field, kb);
  }

  return {
    node,
    rings,
    get value() {
      return rings.map((r) => r.value).join('');
    },
    focus: () => focusRing(0),
  };
}

/**
 * A letter-lock: a brass plate of rings and a steel bolt.
 * @param {{ rings: number, start?: string, onChange?: () => void, onEnter?: () => void, tick?: () => void }} o
 */
export function letterLock({ rings, start = '', onChange, onEnter, tick }) {
  const row = ringRow({ count: rings, start, label: 'Ring', onChange, onEnter, tick });
  const plate = el('div', { class: 'lock-plate' }, row.node.firstChild, el('div', { class: 'lock-bolt', 'aria-hidden': 'true' }));
  row.node.prepend(plate);
  const node = el('div', { class: `letterlock rings-${rings}` }, row.node);
  return {
    node,
    get word() {
      return row.value;
    },
    focus: row.focus,
    open() {
      node.classList.add('open');
    },
    shake() {
      node.classList.remove('wrong');
      void node.offsetWidth;
      node.classList.add('wrong');
    },
  };
}
