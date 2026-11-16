// The how-to player. A demo is a short animated film of a method, in a few steps on a paper
// screen, each with one short line: no paragraphs. Where the demo has one, it ends with a
// hands-on try-it. Used by the call with Milo (call.js) and by the lesson cards.
//
// A demo (see demos/) is a function of a kit that draws its first frame into `k.svg` and
// returns { steps: [{ say, run(tl) }], tryIt?: { say, mount(host, k) => cleanup } }.
// `run` adds the step's animation to a paused GSAP timeline, so the player can play it, or
// jump straight to its end (going back, replaying, or when motion is turned down).
// Anything that loops for ever (a pendulum, a spinner) is started with k.loop(tween), never
// put in the timeline, so the player can stop it.

import { gsap } from 'gsap';
import { el, icon } from './dom.js';
import { COL, ABC, s, T, L, R, C, P, G, chessman, card } from './ink.js';
import { DEMOS } from './demos/index.js';

export const DEMO_W = 320;
export const DEMO_H = 200;

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Whether a lesson has an animated how-to. */
export const hasDemo = (id) => typeof DEMOS[id] === 'function';
export const DEMO_IDS = () => Object.keys(DEMOS);

/** The kit a demo draws with. */
function makeKit(svg, arrow, extra) {
  const loops = [];
  const kit = {
    svg,
    arrow,
    s,
    T,
    L,
    R,
    C,
    P,
    G,
    el,
    icon,
    chessman,
    card,
    COL,
    ABC,
    gsap,
    W: DEMO_W,
    H: DEMO_H,
    still,
    audio: extra.audio ?? null,
    /** Start something that repeats for ever; the player stops it. */
    loop(tween) {
      loops.push(tween);
      return tween;
    },
    /** Hide a path or line so a step can draw it in: tl.to(node, { strokeDashoffset: 0 }). */
    undraw(node) {
      // A line's length is simple; a path is measured, which needs it in the page.
      let len = 1000;
      const a = (n) => Number(node.getAttribute(n) ?? 0);
      if (node.tagName === 'line') len = Math.hypot(a('x2') - a('x1'), a('y2') - a('y1'));
      else {
        try {
          len = node.getTotalLength();
        } catch {
          /* not in the page yet: a generous dash does the same */
        }
      }
      len = Math.ceil(len) + 2;
      node.style.strokeDasharray = `${len}`;
      node.style.strokeDashoffset = `${len}`;
      return node;
    },
    /** Make a node start invisible. */
    hide(...nodes) {
      for (const n of nodes.flat()) gsap.set(n, { opacity: 0 });
      return nodes.length === 1 ? nodes[0] : nodes;
    },
  };
  kit.stopLoops = () => {
    for (const t of loops.splice(0)) t.kill();
  };
  return kit;
}

/**
 * Mount a demo in `host`. Plays itself through, unless the viewer takes over with the buttons.
 * @param {HTMLElement} host
 * @param {string} id  a lesson id (caesar, binary…)
 * @param {{ audio?: any, autoplay?: boolean, onEnd?: () => void, onTry?: () => void }} [opts]
 * @returns {{ dispose: () => void, el: HTMLElement }|null}
 */
export function mountDemo(host, id, opts = {}) {
  const make = DEMOS[id];
  if (typeof make !== 'function') return null;
  const screen = el('div', { class: 'demo-screen' });
  const say = el('div', { class: 'demo-say', role: 'status', 'aria-live': 'polite' });
  const dots = el('div', { class: 'demo-dots', 'aria-hidden': 'true' });
  const backBtn = el('button', { class: 'demo-ibtn', type: 'button', 'aria-label': 'Back a step' }, icon('back', 18));
  const againBtn = el('button', { class: 'demo-ibtn', type: 'button', 'aria-label': 'Watch it again' }, icon('reset', 18));
  const nextBtn = el('button', { class: 'btn small solid demo-next', type: 'button', text: 'Next' });
  const bar = el('div', { class: 'demo-bar' }, backBtn, againBtn, dots, nextBtn);
  const root = el('div', { class: 'demo' }, screen, say, bar);
  host.append(root);

  let demo = null;
  let kit = null;
  let tl = null;
  let at = -1;
  let trying = null;
  let run = 0; // bumps whenever the viewer takes over, so a running autoplay stops
  let dead = false;

  function build() {
    tl?.kill();
    tl = null;
    kit?.stopLoops();
    trying?.();
    trying = null;
    root.classList.remove('trying');
    const { svg, arrow } = card(DEMO_W, DEMO_H);
    svg.classList.add('demo-svg');
    screen.replaceChildren(svg);
    kit = makeKit(svg, arrow, opts);
    demo = make(kit);
    at = -1;
  }

  function drawBar() {
    const n = demo.steps.length;
    dots.replaceChildren(...demo.steps.map((_, i) => el('i', { class: i === at ? 'on' : i < at ? 'done' : '' })));
    backBtn.disabled = at <= 0 && !root.classList.contains('trying');
    const last = at >= n - 1;
    nextBtn.textContent = root.classList.contains('trying') ? 'Watch again' : last ? (demo.tryIt ? 'Try it yourself' : 'Watch again') : 'Next';
  }

  /** Play step n from the frame before it; `fast` jumps to its end. */
  async function play(n, fast = false) {
    const step = demo.steps[n];
    tl = gsap.timeline({ paused: true });
    step.run?.(tl, kit);
    at = n;
    say.textContent = step.say;
    drawBar();
    // Jumping, motion turned down, or a step with nothing to animate: straight to its end.
    if (fast || still() || tl.duration() === 0) {
      tl.progress(1);
      return;
    }
    await new Promise((done) => {
      tl.eventCallback('onComplete', done);
      tl.play();
    });
  }

  /** Rebuild and arrive at step n, the steps before it already done. */
  async function goTo(n) {
    build();
    for (let k = 0; k < n; k++) await play(k, true);
    await play(n);
  }

  function showTry() {
    if (!demo.tryIt) return;
    tl?.progress(1);
    kit.stopLoops();
    root.classList.add('trying');
    const box = el('div', { class: 'demo-try' });
    screen.replaceChildren(box);
    say.textContent = demo.tryIt.say;
    trying = demo.tryIt.mount(box, kit) ?? null;
    drawBar();
    opts.onTry?.();
  }

  async function autoplay() {
    const me = ++run;
    for (let n = 0; n < demo.steps.length; n++) {
      if (dead || me !== run) return;
      await play(n);
      if (dead || me !== run) return;
      // Time to read the line, then on.
      await new Promise((r) => setTimeout(r, still() ? 1800 : 900 + demo.steps[n].say.length * 32));
    }
    if (!dead && me === run) opts.onEnd?.();
  }

  nextBtn.addEventListener('click', async () => {
    run++;
    opts.audio?.click?.();
    if (root.classList.contains('trying')) {
      build();
      autoplay();
      return;
    }
    if (at >= demo.steps.length - 1) {
      if (demo.tryIt) showTry();
      else {
        build();
        autoplay();
      }
      return;
    }
    tl?.progress(1);
    await play(at + 1);
    if (at >= demo.steps.length - 1) opts.onEnd?.();
  });
  backBtn.addEventListener('click', () => {
    run++;
    opts.audio?.click?.();
    if (root.classList.contains('trying')) {
      goTo(demo.steps.length - 1);
      return;
    }
    if (at > 0) goTo(at - 1);
  });
  againBtn.addEventListener('click', () => {
    run++;
    opts.audio?.click?.();
    build();
    autoplay();
  });

  build();
  if (opts.autoplay === false) {
    play(0);
  } else autoplay();

  return {
    el: root,
    /** Jump to the end of step n (for checks and screenshots). */
    async jump(n) {
      run++;
      build();
      for (let k = 0; k <= n; k++) await play(k, true);
    },
    tryIt() {
      run++;
      if (demo.tryIt) showTry();
      return !!demo.tryIt;
    },
    get steps() {
      return demo.steps.length;
    },
    dispose() {
      dead = true;
      run++;
      tl?.kill();
      kit?.stopLoops();
      trying?.();
      root.remove();
    },
  };
}
