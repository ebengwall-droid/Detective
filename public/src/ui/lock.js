// A letter-lock you turn with your hands: brass rings of letters, a bolt, and
// a button to try it. The Fold's locks are puzzles; this is how you answer one.
//
//   swipe a ring up or down, or tap above or below its letter, to turn it
//   type a letter on a focused ring to set it, and the next ring is focused
//   arrow keys turn the focused ring; Enter tries the lock
//
// A wrong word shakes the lock and the bolt stays put; the right one slides
// the bolt back. The answer is never in here: the game checks the word.

import { el } from './dom.js';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const STEP = 26; // pixels of drag per letter

/**
 * @param {{ rings: number, start?: string, onTry: (word: string) => Promise<{ ok: boolean, text?: string }> }} o
 * @returns {{ node: HTMLElement, word: () => string }}
 */
export function letterLock({ rings, start = '', onTry }) {
  const letters = Array.from({ length: rings }, (_, i) => Math.max(0, ABC.indexOf((start[i] ?? 'A').toUpperCase())));
  const status = el('div', { class: 'lock-status', role: 'status', 'aria-live': 'polite' });
  const ringEls = [];
  const word = () => letters.map((i) => ABC[i]).join('');

  function draw(i, dir = 0) {
    const r = ringEls[i];
    const at = letters[i];
    r.cur.textContent = ABC[at];
    r.prev.textContent = ABC[(at + 25) % 26];
    r.next.textContent = ABC[(at + 1) % 26];
    r.node.setAttribute('aria-valuenow', String(at + 1));
    r.node.setAttribute('aria-valuetext', ABC[at]);
    if (dir) {
      // The ring rolls the way it was pushed.
      r.drum.classList.remove('roll-up', 'roll-down');
      void r.drum.offsetWidth;
      r.drum.classList.add(dir > 0 ? 'roll-up' : 'roll-down');
    }
  }

  function turn(i, by) {
    letters[i] = (letters[i] + by + 26) % 26;
    draw(i, by);
    status.textContent = '';
    node.classList.remove('wrong');
  }

  for (let i = 0; i < rings; i++) {
    const prev = el('span', { class: 'ring-letter ring-prev', 'aria-hidden': 'true' });
    const cur = el('span', { class: 'ring-letter ring-cur' });
    const next = el('span', { class: 'ring-letter ring-next', 'aria-hidden': 'true' });
    const drum = el('span', { class: 'ring-drum' }, prev, cur, next);
    const up = el('span', { class: 'ring-arrow up', 'aria-hidden': 'true' });
    const down = el('span', { class: 'ring-arrow down', 'aria-hidden': 'true' });
    const ring = el('div', { class: 'ring', role: 'spinbutton', tabindex: '0', 'aria-label': `Ring ${i + 1} of ${rings}`, 'aria-valuemin': '1', 'aria-valuemax': '26' }, up, drum, down);
    ringEls.push({ node: ring, drum, prev, cur, next });

    // Swipe to turn, a letter for every step; a tap above or below the middle turns it one.
    let startY = null;
    let moved = 0;
    let turned = 0;
    ring.addEventListener('pointerdown', (e) => {
      startY = e.clientY;
      moved = 0;
      turned = 0;
      ring.setPointerCapture?.(e.pointerId);
      ring.focus({ preventScroll: true });
      e.preventDefault();
    });
    ring.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      const dy = e.clientY - startY;
      moved = Math.max(moved, Math.abs(dy));
      const steps = Math.trunc(dy / STEP);
      if (steps !== turned) {
        // Dragging down brings the letter above into the window, as on a real ring.
        turn(i, -(steps - turned));
        turned = steps;
      }
    });
    const end = (e) => {
      if (startY === null) return;
      if (moved < 8) {
        const box = ring.getBoundingClientRect();
        turn(i, e.clientY < box.top + box.height / 2 ? -1 : 1);
      }
      startY = null;
    };
    ring.addEventListener('pointerup', end);
    ring.addEventListener('pointercancel', () => {
      startY = null;
    });
    ring.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') turn(i, -1);
      else if (e.key === 'ArrowDown') turn(i, 1);
      else if (e.key === 'ArrowLeft') ringEls[i - 1]?.node.focus();
      else if (e.key === 'ArrowRight') ringEls[i + 1]?.node.focus();
      else if (e.key === 'Enter') attempt();
      else if (/^[a-z]$/i.test(e.key)) {
        const to = ABC.indexOf(e.key.toUpperCase());
        const by = to - letters[i];
        if (by) turn(i, by);
        ringEls[i + 1]?.node.focus();
      } else return;
      e.preventDefault();
      e.stopPropagation();
    });
  }

  const tryBtn = el('button', { class: 'btn solid lock-try', type: 'button', text: 'Try the lock' });
  let busy = false;
  async function attempt() {
    if (busy) return;
    busy = true;
    tryBtn.disabled = true;
    try {
      const res = await onTry(word());
      if (res?.ok) {
        node.classList.add('open');
        status.textContent = 'The bolt slides back.';
      } else {
        node.classList.remove('wrong');
        void node.offsetWidth;
        node.classList.add('wrong');
        status.textContent = res?.text ?? 'The bolt does not move.';
      }
    } catch (err) {
      status.textContent = err?.message ?? 'Something went wrong.';
    } finally {
      busy = false;
      tryBtn.disabled = false;
    }
  }
  tryBtn.addEventListener('click', attempt);

  const node = el(
    'div',
    { class: `letterlock rings-${rings}` },
    el('div', { class: 'lock-plate' }, el('div', { class: 'lock-rings' }, ringEls.map((r) => r.node)), el('div', { class: 'lock-bolt', 'aria-hidden': 'true' })),
    el('div', { class: 'lock-help', text: 'Swipe a ring, or tap above or below its letter, to turn it.' }),
    status,
    tryBtn,
  );
  ringEls.forEach((_, i) => draw(i));
  return { node, word };
}
