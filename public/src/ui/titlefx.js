// Motion for the big moments: the title, chapter cards, place names.
//
// The title is a letter-lock that sets itself. Each letter starts as its
// Caesar cipher, three letters on, and clicks back three places to the plain
// letter, left to right, the way the gate into the Fold is opened. Then a
// glint runs along the brass. Built on GSAP; everything here is skipped for
// players who ask for reduced motion.

import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText.js';

gsap.registerPlugin(SplitText);
// Keep to the clock even when frames are slow (a phone compiling shaders, a busy machine):
// an entrance that finishes on time, a little choppily, beats one that crawls.
gsap.ticker.lagSmoothing(0);

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const shift = (ch, n) => {
  const i = ABC.indexOf(ch);
  return i < 0 ? ch : ABC[(i + n + 26) % 26];
};

export const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A word as a row of lettered rings. Each ring shows the letter three on
 * (its Caesar cipher), then two on, one on, and finally the letter itself.
 * @param {string} text
 * @param {string} [cls]
 * @returns {{ word: HTMLSpanElement, strips: HTMLSpanElement[], plains: HTMLSpanElement[] }}
 */
export function lockWord(text, cls = '') {
  const word = document.createElement('span');
  word.className = `lock-word ${cls}`.trim();
  word.setAttribute('aria-hidden', 'true');
  const strips = [];
  const plains = [];
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') {
      const gap = document.createElement('span');
      gap.className = 'lock-gap';
      word.append(gap);
      continue;
    }
    const drum = document.createElement('span');
    drum.className = 'lock-drum';
    // The ring is as wide as its final letter; the strip of letters turns inside it.
    const size = document.createElement('span');
    size.className = 'lock-size';
    size.textContent = ch;
    const strip = document.createElement('span');
    strip.className = 'lock-strip';
    for (const n of [3, 2, 1, 0]) {
      const g = document.createElement('span');
      g.className = n ? 'lock-g lock-c' : 'lock-g lock-p';
      g.textContent = shift(ch, n);
      strip.append(g);
      if (!n) plains.push(g);
    }
    drum.append(size, strip);
    word.append(drum);
    strips.push(strip);
  }
  return { word, strips, plains };
}

/** Show a lock word already set, with no motion. */
export function setLock(strips) {
  gsap.set(strips, { yPercent: -75 });
}

/**
 * Turn the rings: three clicks each, left to right.
 * @param {gsap.core.Timeline} tl
 * @param {HTMLElement[]} strips
 * @param {number} at when to start, in seconds on the timeline
 * @param {{ gap?: number, click?: number, onClick?: () => void }} [o]
 * @returns {number} when the last ring has stopped
 */
export function turnLock(tl, strips, at, { gap = 0.075, click = 0.15, onClick } = {}) {
  gsap.set(strips, { yPercent: 0 });
  let end = at;
  strips.forEach((strip, i) => {
    const t0 = at + i * gap;
    for (let s = 1; s <= 3; s++) {
      const t = t0 + (s - 1) * (click + 0.02);
      tl.to(strip, { yPercent: -25 * s, duration: click, ease: 'back.out(2.4)' }, t);
      if (onClick && s === 3) tl.call(onClick, null, t);
      end = Math.max(end, t + click);
    }
  });
  return end;
}

/** A glint running along brass letters: each catches the light for a moment, one after another. */
export function glint(targets, { stagger = 0.045, duration = 0.22 } = {}) {
  return gsap.to(targets, { color: '#fff6dd', duration, stagger, yoyo: true, repeat: 1, ease: 'sine.inOut' });
}

/**
 * The title's entrance.
 * @param {{ root: HTMLElement, veil: HTMLElement, kicker: HTMLElement, the: ReturnType<typeof lockWord>, name: ReturnType<typeof lockWord>, rest: HTMLElement[], rule?: HTMLElement|null }} p
 * @returns {{ timeline: gsap.core.Timeline|null, idle: gsap.core.Tween|null }}
 */
export function playTitle(p) {
  const strips = [...p.the.strips, ...p.name.strips];
  const plains = [...p.the.plains, ...p.name.plains];
  if (still()) {
    setLock(strips);
    gsap.set(p.veil, { autoAlpha: 0 });
    return { timeline: null, idle: null };
  }
  const kicker = SplitText.create(p.kicker, { type: 'chars' });
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  // Out of the dark, onto the room.
  tl.to(p.veil, { autoAlpha: 0, duration: 1.8, ease: 'power2.inOut' }, 0);
  tl.from(kicker.chars, { autoAlpha: 0, y: 10, duration: 0.7, stagger: 0.025 }, 0.5);
  tl.from(p.the.word, { autoAlpha: 0, y: 8, duration: 0.6 }, 0.62);
  tl.from(p.name.word, { autoAlpha: 0, scale: 1.06, filter: 'blur(10px)', duration: 1.1, ease: 'power2.out' }, 0.6);
  const end = turnLock(tl, strips, 0.95);
  // The rings settle: the shading that made them read as rings eases off.
  tl.to(p.root.querySelectorAll('.lock-drum'), { '--ring': 0, duration: 0.9, stagger: 0.03 }, end - 0.3);
  tl.add(glint(plains), end - 0.05);
  if (p.rule) tl.from(p.rule, { scaleX: 0, duration: 1.0, ease: 'power3.inOut' }, end - 0.2);
  tl.from(p.rest, { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.09 }, end);
  // Now and then the light catches it again.
  const idle = gsap.timeline({ repeat: -1, repeatDelay: 7.5, delay: 3 + end });
  idle.add(glint(plains, { stagger: 0.05, duration: 0.3 }));
  return { timeline: tl, idle };
}

/**
 * The title's exit: the rings spin back to cipher and the screen goes to black.
 * @returns {Promise<void>}
 */
export function leaveTitle(p) {
  const strips = [...p.the.strips, ...p.name.strips];
  p.idle?.kill();
  p.timeline?.progress(1);
  if (still()) return Promise.resolve();
  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });
    tl.to(p.rest, { autoAlpha: 0, y: 10, duration: 0.35, stagger: 0.04, ease: 'power2.in' }, 0);
    tl.to(strips, { yPercent: 0, duration: 0.45, stagger: { each: 0.03, from: 'end' }, ease: 'power2.inOut' }, 0.1);
    tl.to(p.veil, { autoAlpha: 1, duration: 0.6, ease: 'power2.in' }, 0.45);
  });
}

/**
 * A chapter card arriving: the kicker letters, the title rising out of a blur,
 * the rule drawn, then the text a line at a time, at reading pace.
 * @param {HTMLElement} card
 */
export function revealCard(card) {
  if (still()) return null;
  card.classList.add('fx');
  const kicker = card.querySelector('.card-kicker');
  const title = card.querySelector('.card-title');
  const date = card.querySelector('.card-date');
  const rule = card.querySelector('.rule');
  // Paragraphs and the pictures between them, in reading order.
  const paras = [...card.querySelectorAll('.card-lines > p, .card-lines > figure, .card-text')];
  const actions = card.querySelector('.card-actions');
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  if (kicker) tl.from(SplitText.create(kicker, { type: 'chars' }).chars, { autoAlpha: 0, y: 8, duration: 0.6, stagger: 0.03 }, 0.1);
  if (title) {
    const split = SplitText.create(title, { type: 'words,chars', mask: 'words' });
    tl.from(split.chars, { yPercent: 105, duration: 0.9, stagger: 0.022, ease: 'power4.out' }, 0.25);
  }
  if (date) tl.from(date, { autoAlpha: 0, duration: 0.8 }, 0.7);
  if (rule) tl.from(rule, { scaleX: 0, duration: 1.0, ease: 'power3.inOut' }, 0.55);
  let at = 0.9;
  for (const p of paras) {
    if (p.tagName === 'FIGURE') {
      tl.from(p, { autoAlpha: 0, y: 18, duration: 0.9 }, at);
      at += 0.5;
      continue;
    }
    const lines = SplitText.create(p, { type: 'lines', mask: 'lines' }).lines;
    tl.from(lines, { yPercent: 100, autoAlpha: 0, duration: 0.8, stagger: 0.09 }, at);
    at += 0.28 + lines.length * 0.09;
  }
  if (actions) tl.from(actions, { autoAlpha: 0, y: 12, duration: 0.7 }, Math.min(at, 3.2));
  // A tap anywhere hurries it along.
  const hurry = () => tl.timeScale(4);
  card.addEventListener('pointerdown', hurry, { once: true });
  return tl;
}

/**
 * A place name, the way a game announces where you are: the letters rise into
 * place, hold, and step back to the corner.
 * @param {HTMLElement} el
 */
const announcing = new WeakMap();
export function announce(el) {
  if (still() || !el) return;
  // A newer name replaced the text mid-animation: stop the old one, and never put its text back.
  announcing.get(el)?.kill();
  const text = el.textContent;
  const split = SplitText.create(el, { type: 'chars', mask: 'chars' });
  const tween = gsap.from(split.chars, {
    yPercent: 110,
    duration: 0.7,
    stagger: 0.025,
    ease: 'power4.out',
    onComplete: () => {
      if (el.textContent === text) split.revert();
      announcing.delete(el);
    },
  });
  announcing.set(el, tween);
}

export { gsap };
