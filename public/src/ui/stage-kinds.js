// What each kind of puzzle looks like on the stage, and how it is handled.
//
// A builder gets the stage's `ctx` and returns { node, focus?, wrong?, right?,
// dispose? }. It tells the stage what its main button would hand in with
// ctx.offer(value, label), or gives several choices with ctx.choices. The
// stage sends whatever is handed in to the game core, which alone knows
// whether it is right.

import { el, icon } from './dom.js';
import { letterLock, makeRing, ringRow } from './lock.js';
import { sv, monoOf, glide, shake, wait, still, interlinear, letterStrip, assigner, flash, stepper, keyTiles } from './stage-parts.js';
import { caesar, frequencies, unRailFence, vigenere, playfair, playfairSquare, lettersOf, isKnightMove, square as squareOf } from '../../../core/ciphers.js';
import { drawWorld, project } from './world-map.js';
import { collar, chart, instruments } from './stage-kinds2.js';
import { sun, ferry, garden, grid, chess, wordgame, order, pendulum, piano } from './stage-kinds3.js';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const mod = (a, n) => ((a % n) + n) % n;

/** Put the letters of `letters` into the shape of `top`: its spaces and stops stay where they are. */
function shapeLike(top, letters) {
  let i = 0;
  return top.replace(/[A-Z]/g, () => letters[i++] ?? '·');
}

const tools = (...kids) => el('div', { class: 'stage-tools' }, kids);
const toolBtn = (iconName, text, onClick) => el('button', { class: 'btn small quiet', type: 'button', onClick }, icon(iconName, 16), text);

// =================================================================== locks

function lock(ctx) {
  const { p } = ctx;
  const lk = letterLock({
    rings: p.lock.rings,
    start: p.solved ? p.answer : p.lock.start ?? '',
    tick: ctx.tick,
    onChange: () => {
      ctx.offer(lk.word, 'Try the lock');
      ctx.say('');
    },
    onEnter: () => ctx.submit(lk.word),
  });
  ctx.offer(lk.word, 'Try the lock');
  if (p.solved) lk.open();
  return {
    node: el('div', { class: 'stage-lock' }, lk.node),
    focus: () => lk.focus(),
    wrong: () => lk.shake(),
    async right() {
      ctx.game.audio.bolt?.();
      lk.open();
      await wait(still() ? 0 : 650);
    },
  };
}

// =================================================================== a written answer (for a puzzle with nothing else to handle)

function write(ctx) {
  const field = el('input', { class: 'field write-line', type: 'text', placeholder: 'Your answer', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', enterkeyhint: 'done', maxlength: '60', 'aria-label': ctx.p.ask });
  field.addEventListener('input', () => ctx.offer(field.value.trim() || null, 'Answer'));
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ctx.submit(field.value.trim());
  });
  const blocks = ctx.p.blocks.filter((b) => b.mono).map((b) => el('pre', { class: 'cipher', text: b.mono }));
  return { node: el('div', { class: 'stage-write' }, blocks, el('div', { class: 'stage-ask', text: ctx.p.ask }), field), focus: () => field.focus({ preventScroll: true }) };
}

// =================================================================== the cipher wheel

/**
 * A brass cipher wheel: plain letters on the outer ring, a ring inside it you
 * turn with your finger. Turned k places, the inner letter k after A sits
 * under A, and every letter of a message reads k places back.
 */
function cipherWheel({ at = 0, onChange, tick }) {
  const C = 150;
  const STEP = 360 / 26;
  let k = mod(at, 26);
  let rot = -k * STEP;
  const uid = `cw${Math.random().toString(36).slice(2, 8)}`;
  const letter = (ch, a, r, size, cls) => {
    const rad = (a * Math.PI) / 180;
    const x = C + r * Math.sin(rad);
    const y = C - r * Math.cos(rad);
    const t = sv('text', { x, y, class: cls, 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'central', transform: `rotate(${a} ${x} ${y})` });
    t.textContent = ch;
    return t;
  };
  const spoke = (a, r1, r2, cls) => {
    const rad = (a * Math.PI) / 180;
    return sv('line', { x1: C + r1 * Math.sin(rad), y1: C - r1 * Math.cos(rad), x2: C + r2 * Math.sin(rad), y2: C - r2 * Math.cos(rad), class: cls });
  };
  const inner = sv(
    'g',
    { class: 'cw-inner' },
    sv('circle', { cx: C, cy: C, r: 113, fill: `url(#${uid}i)`, class: 'cw-disc' }),
    [...ABC].map((_, i) => spoke((i + 0.5) * STEP, 82, 112, 'cw-tick')),
    [...ABC].map((ch, i) => letter(ch, i * STEP, 97, 17, 'cw-in')),
    sv('circle', { cx: C, cy: C, r: 82, class: 'cw-groove' }),
  );
  const num = sv('text', { x: C, y: C - 4, class: 'cw-num', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
  const svg = sv(
    'svg',
    { viewBox: '0 0 300 300', class: 'cwheel', role: 'slider', tabindex: '0', 'aria-label': 'Cipher wheel: how many places the inner ring is turned', 'aria-valuemin': '0', 'aria-valuemax': '25' },
    sv(
      'defs',
      {},
      sv('radialGradient', { id: `${uid}o`, cx: '42%', cy: '36%', r: '70%' }, sv('stop', { offset: '0%', 'stop-color': '#fbe7b2' }), sv('stop', { offset: '55%', 'stop-color': '#d5a557' }), sv('stop', { offset: '100%', 'stop-color': '#7a5323' })),
      sv('radialGradient', { id: `${uid}i`, cx: '40%', cy: '34%', r: '72%' }, sv('stop', { offset: '0%', 'stop-color': '#ecd08f' }), sv('stop', { offset: '60%', 'stop-color': '#b48444' }), sv('stop', { offset: '100%', 'stop-color': '#5f4019' })),
    ),
    sv('circle', { cx: C, cy: C, r: 148, fill: `url(#${uid}o)`, class: 'cw-rim' }),
    [...ABC].map((_, i) => spoke((i + 0.5) * STEP, 117, 146, 'cw-tick')),
    [...ABC].map((ch, i) => letter(ch, i * STEP, 131, 19, 'cw-out')),
    inner,
    sv('rect', { x: C - 13, y: 2, width: 26, height: 70, rx: 7, class: 'cw-window' }),
    sv('circle', { cx: C, cy: C, r: 50, class: 'cw-hub' }),
    num,
    (() => {
      const t = sv('text', { x: C, y: C + 22, class: 'cw-unit', 'text-anchor': 'middle' });
      t.textContent = 'PLACES';
      return t;
    })(),
  );

  const paint = (animate) => {
    inner.style.transition = animate ? '' : 'none';
    inner.style.transform = `rotate(${rot}deg)`;
    num.textContent = String(k);
    svg.setAttribute('aria-valuenow', String(k));
  };
  const setK = (n, { animate = true } = {}) => {
    const to = mod(n, 26);
    // Turn the short way round to the new setting.
    const target = -to * STEP;
    rot += mod(target - rot + 180, 360) - 180;
    const changed = to !== k;
    k = to;
    paint(animate);
    if (changed) {
      tick?.();
      onChange(k);
    }
  };

  const angleAt = (e) => {
    const b = svg.getBoundingClientRect();
    return (Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))) * 180) / Math.PI;
  };
  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    drag = { a: angleAt(e) };
    svg.setPointerCapture?.(e.pointerId);
    svg.focus({ preventScroll: true });
    inner.style.transition = 'none';
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const a = angleAt(e);
    rot += mod(a - drag.a + 180, 360) - 180;
    drag.a = a;
    inner.style.transform = `rotate(${rot}deg)`;
    const nk = mod(Math.round(-rot / STEP), 26);
    if (nk !== k) {
      k = nk;
      num.textContent = String(k);
      tick?.();
      onChange(k);
    }
  });
  const end = () => {
    if (!drag) return;
    drag = null;
    setK(k);
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setK(k + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setK(k - 1);
    else return;
    e.preventDefault();
  });
  paint(false);
  const back = el('button', { class: 'cw-step', type: 'button', 'aria-label': 'Turn back one place', text: '‹', onClick: () => setK(k - 1) });
  const fwd = el('button', { class: 'cw-step', type: 'button', 'aria-label': 'Turn on one place', text: '›', onClick: () => setK(k + 1) });
  return { node: el('div', { class: 'cw-wrap' }, back, svg, fwd), focus: () => svg.focus({ preventScroll: true }), get k() { return k; } };
}

function wheel(ctx) {
  const { p, spec } = ctx;
  const cipher = monoOf(p);
  const long = lettersOf(cipher).length > 40;
  const paper = interlinear({ cls: long ? 'paper' : 'strip' });
  // The fitting is where you are given a wheel; anywhere else you need to have been given one.
  if (p.id !== 'fitting' && !ctx.tools.has('wheel') && !p.solved) {
    paper.set(cipher, null);
    ctx.goal('You need a cipher wheel for this. Mrs Quoin, the wheelwright, fits people for them.');
    return { node: el('div', { class: 'stage-wheel' }, paper.node) };
  }
  const draw = (k) => {
    const plain = caesar(cipher, -k);
    paper.set(cipher, plain);
    if (spec.give === 'read') ctx.offer(plain.replace(/\s+/g, ' ').trim(), 'Read it out');
  };
  const dial = cipherWheel({ at: spec.start ?? 0, tick: ctx.tick, onChange: draw });
  draw(dial.k);
  const top = frequencies(cipher).slice(0, 3);
  const freq = long ? el('div', { class: 'freq' }, el('span', { text: 'Most common on the page:' }), top.map(([ch, n]) => el('b', { text: `${ch} ` }, el('small', { text: `×${n}` })))) : null;
  return {
    node: el('div', { class: 'stage-wheel' }, dial.node, freq, paper.node),
    focus: () => dial.focus(),
    right: () => paper.node.classList.add('glow'),
  };
}

// =================================================================== the rail fence

function fence(ctx) {
  const cipher = lettersOf(monoOf(ctx.p));
  const n = cipher.length;
  let rails = ctx.spec.start ?? 2;
  const box = el('div', { class: 'fence' });
  const tiles = [...cipher].map((ch) => el('span', { class: 'fl', text: ch }));
  const read = el('div', { class: 'fence-read' });
  const cols = () => Math.max(10, Math.min(26, Math.floor((box.clientWidth || 320) / 17)));
  function layout() {
    const pattern = [];
    let r = 0;
    let step = 1;
    for (let i = 0; i < n; i++) {
      pattern.push(r);
      if (r === 0) step = 1;
      else if (r === rails - 1) step = -1;
      r += step;
    }
    // The cipher is the rails read off one after another: its k-th letter is the k-th place on them.
    const order = [];
    for (let row = 0; row < rails; row++) for (let i = 0; i < n; i++) if (pattern[i] === row) order.push(i);
    const c = cols();
    const sections = [];
    for (let s = 0; s * c < n; s++) {
      const width = Math.min(c, n - s * c);
      sections.push(el('div', { class: 'fence-sec', style: { gridTemplateColumns: `repeat(${width}, var(--cell))`, gridTemplateRows: `repeat(${rails}, var(--rail))` } }, Array.from({ length: rails }, (_, row) => el('i', { class: 'rail', style: { gridRow: String(row + 1) } }))));
    }
    order.forEach((i, k) => {
      const t = tiles[k];
      t.style.gridColumn = String((i % c) + 1);
      t.style.gridRow = String(pattern[i] + 1);
      sections[Math.floor(i / c)].append(t);
    });
    box.replaceChildren(...sections);
    read.textContent = unRailFence(cipher, rails);
  }
  const rails$ = stepper({
    label: 'Rails',
    min: 2,
    max: 6,
    value: rails,
    onChange: (v) => {
      rails = v;
      ctx.tick();
      glide(tiles, layout);
    },
  });
  layout();
  requestAnimationFrame(layout);
  return { node: el('div', { class: 'stage-fence' }, rails$.node, box, el('div', { class: 'fence-under' }, el('span', { class: 'under-label', text: 'Read along the zigzag' }), read)) };
}

// =================================================================== keyed ciphers: Vigenère and Playfair

function keyed(ctx) {
  const { p, spec } = ctx;
  const cipher = monoOf(p);
  const vig = spec.method === 'vigenere';
  const offer = (t) => ctx.offer(t, t ? `Answer: ${t}` : 'Answer');
  const inter = interlinear({ cls: 'paper', spaced: vig, pick: offer });
  let key = '';
  const cells = new Map();
  const sq = vig ? null : el('div', { class: 'pf-square', 'aria-label': 'The square the key builds' }, [...playfairSquare('')].map((ch) => {
    const c = el('span', { class: 'pf', text: ch === 'I' ? 'I/J' : ch });
    cells.set(ch, c);
    return c;
  }));
  function draw() {
    if (vig) {
      inter.set(cipher, key ? vigenere(cipher, key, true) : null);
      return;
    }
    const square = playfairSquare(key);
    const keyed = new Set(lettersOf(key).replace(/J/g, 'I'));
    glide([...cells.values()], () => {
      [...square].forEach((ch, i) => {
        const c = cells.get(ch);
        c.style.order = String(i);
        c.classList.toggle('key', keyed.has(ch));
      });
    });
    const letters = lettersOf(cipher);
    inter.set(cipher, key && letters.length % 2 === 0 ? shapeLike(cipher, playfair(letters, key, true)) : null);
  }
  const keyIn = keyTiles({
    max: 14,
    placeholder: 'Type the key',
    onChange: (w) => {
      key = w;
      ctx.tick();
      draw();
    },
  });
  draw();
  return {
    node: el('div', { class: `stage-keyed ${vig ? 'keyed-vig' : 'keyed-pf'}` }, el('div', { class: 'key-row' }, el('span', { class: 'under-label', text: 'Key' }), keyIn.node), sq, inter.node),
    focus: () => {},
    right: () => inter.node.classList.add('glow'),
  };
}

// =================================================================== decoding against a key: pairs, codes, pigpen, Bacon

function pairs(ctx) {
  const words = monoOf(ctx.p)
    .split('/')
    .map((w) => w.trim().split(/\s+/).filter(Boolean));
  const asg = assigner({ words, draw: (c) => c, cls: 'collar', tap: ctx.tap, onChange: (r) => ctx.offer(r.includes('·') ? null : r, 'Read it out') });
  const five = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
  const grid = el('div', { class: 'pb-square' }, el('span', { class: 'pb-h corner' }), [1, 2, 3, 4, 5].map((n) => el('span', { class: 'pb-h', text: String(n) })));
  for (let r = 0; r < 5; r++) {
    grid.append(el('span', { class: 'pb-h', text: String(r + 1) }));
    for (let c = 0; c < 5; c++) {
      const ch = five[r * 5 + c];
      const b = el('button', { class: 'pb-cell key-cell', type: 'button', text: ch === 'I' ? 'I/J' : ch });
      b.addEventListener('click', () => {
        if (asg.assign(ch)) {
          ctx.tick();
          flash(b);
        } else ctx.say('Tap a pair on the collar first.');
      });
      grid.append(b);
    }
  }
  ctx.offer(null, 'Read it out');
  return { node: el('div', { class: 'stage-keys' }, el('div', { class: 'band brass' }, asg.node), tools(toolBtn('reset', 'Start again', () => asg.clear()))), dock: grid };
}

function codes(ctx) {
  const mono = monoOf(ctx.p);
  const list = mono.match(/\b[0-9A-F]{2}\b/g) ?? [];
  const label = mono.replace(/(\s+[0-9A-F]{2}\b)+\s*$/, '').trim();
  const asg = assigner({ words: [list], draw: (c) => c, cls: 'hexcodes', tap: ctx.tap, onChange: (r) => ctx.offer(r.includes('·') ? null : r, 'Read it out') });
  const hex = '0123456789ABCDEF';
  const chart = el('div', { class: 'hex-chart' }, el('span', { class: 'hx-h corner' }), [...hex].map((h) => el('span', { class: 'hx-h', text: h })));
  for (const row of [4, 5]) {
    chart.append(el('span', { class: 'hx-h', text: String(row) }));
    for (let c = 0; c < 16; c++) {
      const ch = String.fromCharCode(row * 16 + c);
      const b = el('button', { class: 'hx-cell key-cell', type: 'button', text: ch, 'aria-label': `${row}${hex[c]}: ${ch}` });
      b.addEventListener('click', () => {
        if (asg.assign(ch)) {
          ctx.tick();
          flash(b);
        } else ctx.say('Tap a code on the screen first.');
      });
      chart.append(b);
    }
  }
  ctx.offer(null, 'Read it out');
  return {
    node: el(
      'div',
      { class: 'stage-keys' },
      el('div', { class: 'crt' }, el('div', { class: 'crt-top', text: 'ENGINE · NIGHT LOG · 02:14' }), el('div', { class: 'crt-row' }, el('span', { class: 'crt-label', text: label }), asg.node)),
      tools(toolBtn('reset', 'Start again', () => asg.clear())),
    ),
    dock: el('div', { class: 'hex-wrap' }, el('div', { class: 'under-label', text: "The Engine's code card: first digit down, second across" }), chart),
  };
}

// ---- pigpen

/** The strokes of one pigpen sign, in a 20 x 20 box. */
function pigpenPath(ch) {
  const i = ch.charCodeAt(0) - 65;
  const a = 3;
  const b = 17;
  if (i < 18) {
    const cell = i % 9;
    const r = Math.floor(cell / 3);
    const c = cell % 3;
    let d = '';
    if (r > 0) d += `M${a} ${a}H${b}`;
    if (r < 2) d += `M${a} ${b}H${b}`;
    if (c > 0) d += `M${a} ${a}V${b}`;
    if (c < 2) d += `M${b} ${a}V${b}`;
    return { d, dot: i >= 9 ? [10, 10] : null };
  }
  const arm = (i - 18) % 4;
  const d = [`M${a} ${a + 2}L10 ${b - 1}L${b} ${a + 2}`, `M${a + 2} ${a}L${b - 1} 10L${a + 2} ${b}`, `M${b - 2} ${a}L${a + 1} 10L${b - 2} ${b}`, `M${a} ${b - 2}L10 ${a + 1}L${b} ${b - 2}`][arm];
  const dot = [[10, 7], [7, 10], [13, 10], [10, 13]][arm];
  return { d, dot: i >= 22 ? dot : null };
}

export function pigpenSign(ch, size = 24) {
  const { d, dot } = pigpenPath(ch);
  return sv('svg', { viewBox: '0 0 20 20', width: size, height: size, class: 'pig', 'aria-hidden': 'true' }, sv('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), dot ? sv('circle', { cx: dot[0], cy: dot[1], r: 1.6, fill: 'currentColor' }) : null);
}

/** The pigpen key: two grids and two crosses, each cell something you can tap. */
function pigpenPad(onPick) {
  const frame = (letters, kind) => {
    const svg = sv('svg', { viewBox: '0 0 66 66', class: 'pig-frame' });
    const line = { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round' };
    const label = (ch, x, y, dotAt) => {
      const g = sv('g', { class: 'pig-cell', role: 'button', tabindex: '0', 'aria-label': ch });
      return g;
    };
    if (kind.startsWith('grid')) {
      letters.forEach((ch, i) => {
        const x = 3 + (i % 3) * 20;
        const y = 3 + Math.floor(i / 3) * 20;
        const g = label(ch);
        g.append(sv('rect', { x, y, width: 20, height: 20, class: 'pig-hit' }));
        const t = sv('text', { x: x + 10, y: y + 11, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'pig-l' });
        t.textContent = ch;
        g.append(t);
        if (kind === 'grid.') g.append(sv('circle', { cx: x + 16, cy: y + 5, r: 1.4, class: 'pig-dot' }));
        g.addEventListener('click', () => onPick(ch, g));
        g.addEventListener('keydown', (e) => e.key === 'Enter' && onPick(ch, g));
        svg.append(g);
      });
      svg.append(sv('path', { d: 'M23 3V63M43 3V63M3 23H63M3 43H63', ...line, 'pointer-events': 'none' }));
    } else {
      const tri = ['8,8 58,8 33,33', '8,8 33,33 8,58', '58,8 58,58 33,33', '8,58 33,33 58,58'];
      const at = [[33, 17], [17, 33], [49, 33], [33, 49]];
      letters.forEach((ch, i) => {
        const g = label(ch);
        g.append(sv('polygon', { points: tri[i], class: 'pig-hit' }));
        const t = sv('text', { x: at[i][0], y: at[i][1] + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'pig-l' });
        t.textContent = ch;
        g.append(t);
        if (kind === 'x.') g.append(sv('circle', { cx: at[i][0] + (i === 1 ? 0 : i === 2 ? 0 : 6), cy: at[i][1] + (i === 1 || i === 2 ? -7 : 0), r: 1.4, class: 'pig-dot' }));
        g.addEventListener('click', () => onPick(ch, g));
        g.addEventListener('keydown', (e) => e.key === 'Enter' && onPick(ch, g));
        svg.append(g);
      });
      svg.append(sv('path', { d: 'M8 8L58 58M58 8L8 58', ...line, 'pointer-events': 'none' }));
    }
    return svg;
  };
  return el('div', { class: 'pig-pad' }, frame([...'ABCDEFGHI'], 'grid'), frame([...'JKLMNOPQR'], 'grid.'), frame([...'STUV'], 'x'), frame([...'WXYZ'], 'x.'));
}

function pigpen(ctx) {
  const text = ctx.p.blocks.find((b) => b.glyphs)?.glyphs ?? '';
  const words = text
    .toUpperCase()
    .split(/\s+/)
    .map((w) => [...w.replace(/[^A-Z]/g, '')])
    .filter((w) => w.length);
  const asg = assigner({ words, draw: (ch) => pigpenSign(ch), cls: 'pigcodes', tap: ctx.tap, onChange: () => {} });
  const pad = pigpenPad((ch, g) => {
    if (asg.assign(ch)) {
      ctx.tick();
      flash(g);
    } else ctx.say('Tap a sign in the message first.');
  });
  return { node: el('div', { class: 'stage-keys' }, el('div', { class: 'band paper' }, asg.node), tools(toolBtn('reset', 'Start again', () => asg.clear()))), dock: pad };
}

// ---- Bacon

function bacon(ctx) {
  const marked = ctx.p.blocks.find((b) => b.marked)?.marked ?? '';
  const letters = [...marked].filter((ch) => /[A-Za-z]/.test(ch));
  const take = ctx.spec.letters ?? 7;
  const pattern = (s) => [...s].map((ch) => (ch === ch.toUpperCase() ? 'b' : 'a')).join('');
  const line = el('div', { class: 'bacon-line' });
  const keyGrid = el('div', { class: 'bacon-key' });
  let asg = null;
  const pad = [...ABC].map((ch, i) => {
    const code = i.toString(2).padStart(5, '0').replace(/0/g, 'a').replace(/1/g, 'b');
    const b = el('button', { class: 'bk key-cell', type: 'button', 'aria-label': `${ch}: ${code}` }, el('b', { text: ch }), el('span', { text: code }));
    b.addEventListener('click', () => {
      if (asg?.assign(ch)) {
        ctx.tick();
        flash(b);
      } else ctx.say(asg ? 'Tap a group of letters first.' : 'Split the line into groups first.');
    });
    return b;
  });
  keyGrid.append(...pad);
  function regroup(size) {
    ctx.offer(null, 'Read it out');
    if (size <= 1) {
      asg = null;
      line.replaceChildren(el('div', { class: 'bacon-text', text: marked }));
      return;
    }
    const groups = [];
    for (let i = 0; i + size <= letters.length && groups.length < take; i += size) groups.push(letters.slice(i, i + size).join(''));
    const rest = letters.slice(groups.length * size).join('');
    asg = assigner({
      words: [groups.map((g) => ({ code: pattern(g), face: g }))],
      draw: (c) => c,
      cls: 'baconcodes',
      tap: ctx.tap,
      onChange: (r) => ctx.offer(r.includes('·') ? null : r.replace(/\s+/g, ''), 'Read it out'),
    });
    line.replaceChildren(asg.node, rest ? el('span', { class: 'bacon-rest', text: rest }) : null);
  }
  const size = stepper({ label: 'Letters in a group', min: 1, max: 8, value: 1, show: (v) => (v === 1 ? 'none' : String(v)), onChange: (v) => { ctx.tick(); regroup(v); } });
  regroup(1);
  return { node: el('div', { class: 'stage-keys stage-bacon' }, el('div', { class: 'band paper' }, line), size.node), dock: keyGrid };
}

// =================================================================== the knight on the slate

function knightSvg() {
  return sv('svg', { viewBox: '0 0 40 40', class: 'kn-svg' }, sv('path', { d: 'M12 34h18c0-6-2-9-4-12 1-3 4-5 5-9-3-4-8-6-13-5l-2-3-2 4c-3 2-5 5-6 9l3 2 4-3c1 2 1 4-1 6-2 3-3 6-2 11z', class: 'kn-body' }), sv('circle', { cx: 19, cy: 12.5, r: 1.4, class: 'kn-eye' }));
}

function knight(ctx) {
  const rows = ctx.p.blocks.find((b) => b.board)?.board.rows ?? [];
  const moves = ctx.p.blocks.find((b) => b.quote && /^N\s/.test(b.quote))?.quote.match(/[a-h][1-8]/g) ?? [];
  const letterAt = (name) => {
    const [f, r] = squareOf(name);
    return rows[7 - r][f];
  };
  const path = [];
  const squares = new Map();
  const board = el('div', { class: 'kboard' });
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const name = String.fromCharCode(97 + f) + (8 - r);
      const b = el('button', { class: `ksq ${(r + f) % 2 ? 'dark' : 'light'}`, type: 'button', 'aria-label': `${name}: ${rows[r][f]}` }, el('span', { class: 'ksq-l', text: rows[r][f] }), el('span', { class: 'ksq-n', text: '' }));
      b.addEventListener('click', () => hop(name));
      squares.set(name, b);
      board.append(b);
    }
  }
  const piece = el('span', { class: 'kpiece', 'aria-hidden': 'true' }, knightSvg());
  board.append(piece);
  const files = el('div', { class: 'kfiles', 'aria-hidden': 'true' }, [...'abcdefgh'].map((f) => el('span', { text: f })));
  const ranks = el('div', { class: 'kranks', 'aria-hidden': 'true' }, [8, 7, 6, 5, 4, 3, 2, 1].map((n) => el('span', { text: String(n) })));
  const chips = moves.map((m) => el('span', { class: 'kn', text: m }));
  const notation = el('div', { class: 'knote' }, el('span', { class: 'kn kn-n', text: 'N' }), chips);
  const strip = letterStrip({ cls: 'chalk', pick: (t) => ctx.offer(t, t ? `Answer: ${t}` : 'Answer'), empty: 'Letters the knight lands on' });

  function paint() {
    const at = path[path.length - 1];
    for (const [name, b] of squares) {
      const i = path.indexOf(name);
      b.classList.toggle('been', i >= 0);
      b.classList.toggle('here', name === at);
      b.classList.toggle('can', !!at && !path.includes(name) && isKnightMove(at, name));
      b.querySelector('.ksq-n').textContent = i >= 0 ? String(i + 1) : '';
    }
    if (at) {
      const [f, r] = squareOf(at);
      piece.style.setProperty('--f', String(f));
      piece.style.setProperty('--r', String(7 - r));
      piece.classList.add('on');
    } else piece.classList.remove('on');
    let ok = true;
    chips.forEach((c, i) => {
      ok = ok && path[i] === moves[i];
      c.classList.toggle('done', ok && i < path.length);
      c.classList.toggle('next', ok && i === path.length);
    });
    strip.set(path.map(letterAt).join(''));
  }
  function hop(name) {
    const at = path[path.length - 1];
    if (path.includes(name)) {
      shake(squares.get(name));
      ctx.say('The knight has already been there.');
      return;
    }
    if (at && !isKnightMove(at, name)) {
      shake(squares.get(name));
      ctx.say('A knight cannot jump there.');
      return;
    }
    path.push(name);
    ctx.tick();
    ctx.say('');
    paint();
  }
  paint();
  ctx.offer(null, 'Answer');
  return {
    node: el(
      'div',
      { class: 'stage-knight' },
      notation,
      el('div', { class: 'kframe' }, ranks, board, files),
      strip.node,
      tools(
        toolBtn('undo', 'Back a move', () => {
          path.pop();
          paint();
        }),
        toolBtn('reset', 'Start again', () => {
          path.length = 0;
          paint();
        }),
      ),
    ),
  };
}

// =================================================================== the seven answers in a column

function column(ctx) {
  const feeds = ctx.p.blocks.find((b) => b.feeds)?.feeds ?? [];
  const taken = [];
  const strip = letterStrip({ cls: 'ink', empty: 'Tap letters to take them' });
  const tiles = [];
  const rows = feeds.map((f, r) => {
    const word = f.answer ? lettersOf(f.answer) : '';
    return el(
      'div',
      { class: 'col-row' },
      el('span', { class: 'col-n', text: String(f.n) }),
      word
        ? el('span', { class: 'col-word' }, [...word].map((ch, c) => {
            const t = el('button', { class: 'col-t', type: 'button', text: ch, 'aria-label': `${ch}, letter ${c + 1} of answer ${f.n}` });
            t.addEventListener('click', () => {
              const at = taken.findIndex((x) => x.t === t);
              if (at >= 0) taken.splice(at, 1);
              else taken.push({ t, ch });
              ctx.tick();
              paint();
            });
            tiles.push(t);
            return t;
          }))
        : el('span', { class: 'col-none', text: `${f.title}: not answered yet` }),
    );
  });
  function paint() {
    for (const t of tiles) {
      const i = taken.findIndex((x) => x.t === t);
      t.classList.toggle('taken', i >= 0);
      t.dataset.n = i >= 0 ? String(i + 1) : '';
    }
    const word = taken.map((x) => x.ch).join('');
    strip.set(word);
    ctx.offer(word || null, 'Read it out');
  }
  paint();
  return { node: el('div', { class: 'stage-column' }, el('div', { class: 'col-rows' }, rows), strip.node, tools(toolBtn('reset', 'Clear', () => { taken.length = 0; paint(); }))) };
}

// =================================================================== the Late Tithes: reading across finished grids

function grids(ctx) {
  const blocks = ctx.p.blocks.filter((b) => b.grid && !b.numbers);
  const wrap = el('div', { class: 'ngrids' });
  const all = [];
  blocks.forEach((b, g) => {
    const cells = [];
    const table = el('div', { class: 'ngrid', style: { '--n': String(b.grid.length) } });
    b.grid.forEach((row, r) =>
      [...row].forEach((ch, c) => {
        const cell = el('span', { class: 'nc', text: ch, dataset: { g: String(g), r: String(r), c: String(c) } });
        cells.push(cell);
        table.append(cell);
      }),
    );
    all.push(cells);
    wrap.append(el('figure', { class: 'nfig' }, table, el('figcaption', { text: b.caption ?? '' })));
  });
  const reading = el('div', { class: 'nread' });
  let line = null;
  let start = null;
  let pending = null;
  const cellAt = (x, y) => document.elementFromPoint(x, y)?.closest?.('.nc') ?? null;
  const pos = (cell) => ({ g: Number(cell.dataset.g), r: Number(cell.dataset.r), c: Number(cell.dataset.c) });
  function lineBetween(a, b) {
    if (a.g !== b.g) return null;
    const dr = b.r - a.r;
    const dc = b.c - a.c;
    if (dr && dc && Math.abs(dr) !== Math.abs(dc)) return null;
    const n = Math.max(Math.abs(dr), Math.abs(dc));
    const size = blocks[a.g].grid.length;
    const out = [];
    for (let i = 0; i <= n; i++) out.push(all[a.g][(a.r + Math.sign(dr) * i) * size + a.c + Math.sign(dc) * i]);
    return out;
  }
  function show(cells, final) {
    for (const cs of all) for (const c of cs) c.classList.remove('lit', 'held');
    line = cells;
    const word = cells ? cells.map((c) => c.textContent).join('') : '';
    if (cells) for (const c of cells) c.classList.add(final ? 'held' : 'lit');
    reading.textContent = word;
    ctx.offer(final && word.length > 1 ? word : null, final && word.length > 1 ? `Answer: ${word}` : 'Answer');
  }
  wrap.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest?.('.nc');
    if (!cell) return;
    e.preventDefault();
    wrap.setPointerCapture?.(e.pointerId);
    if (pending && pending !== cell) {
      const cells = lineBetween(pos(pending), pos(cell));
      pending = null;
      start = null;
      if (cells) {
        ctx.tick();
        show(cells, true);
        return;
      }
    }
    start = cell;
    show([cell], false);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!start) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell) return;
    const cells = lineBetween(pos(start), pos(cell));
    if (cells && cells.length !== line?.length) ctx.tick();
    if (cells) show(cells, false);
  });
  const end = () => {
    if (!start) return;
    if (line && line.length > 1) {
      pending = null;
      show(line, true);
    } else {
      // A single tap: the start of a line, waiting for its other end.
      pending = start;
      show([start], false);
    }
    start = null;
  };
  wrap.addEventListener('pointerup', end);
  wrap.addEventListener('pointercancel', end);
  ctx.offer(null, 'Answer');
  return { node: el('div', { class: 'stage-grids' }, wrap, el('div', { class: 'nread-row' }, el('span', { class: 'under-label', text: 'You read' }), reading)) };
}

// =================================================================== a cryptic clue

function clue(ctx) {
  const { spec } = ctx;
  const taps = el('div', { class: 'clue-taps', 'aria-label': `${spec.length} taps on the arm of her chair` }, Array.from({ length: spec.length ?? 0 }, (_, i) => el('i', { style: { animationDelay: `${0.5 + i * 0.32}s` } })));
  return {
    node: el(
      'div',
      { class: 'stage-clue' },
      el('div', { class: 'clue-card' }, el('div', { class: 'clue-text' }, spec.clue, el('span', { class: 'clue-len', text: ` (${spec.length})` })), spec.aside ? el('div', { class: 'clue-aside', text: spec.aside }) : null, el('div', { class: 'clue-by', text: spec.by ?? '' })),
      taps,
    ),
  };
}

// =================================================================== the magic square

function magic(ctx) {
  const rows = ctx.p.blocks.find((b) => b.grid && b.numbers)?.grid.map((r) => r.trim().split(/\s+/)) ?? [];
  const n = rows.length;
  const NUMS = ['?', ...Array.from({ length: n * n }, (_, i) => String(i + 1))];
  const vals = rows.map((r) => r.map((v) => (v === '?' ? null : Number(v))));
  const blanks = [];
  const grid = el('div', { class: 'mq-grid', style: { '--n': String(n) } });
  const sums = { row: [], col: [], d1: null, d2: null };
  const sumEl = (cls, label) => el('span', { class: `mq-sum ${cls}`, 'aria-label': label });
  // The top row holds the rising diagonal's total, in its corner.
  for (let c = 0; c < n; c++) grid.append(el('span', { class: 'mq-pad' }));
  sums.d2 = sumEl('diag up', 'Total of the rising diagonal');
  grid.append(sums.d2);
  rows.forEach((r, ri) => {
    r.forEach((v, ci) => {
      if (v === '?') {
        const ring = makeRing({ symbols: NUMS, at: 0, label: `Missing number, row ${ri + 1}`, tick: ctx.tick, onTurn: () => update() });
        ring.node.classList.add('small');
        blanks.push({ ring, r: ri, c: ci });
        grid.append(el('span', { class: 'mq mq-blank' }, ring.node));
      } else grid.append(el('span', { class: 'mq', text: v }));
    });
    const s = sumEl('row', `Total of row ${ri + 1}`);
    sums.row.push(s);
    grid.append(s);
  });
  for (let c = 0; c < n; c++) {
    const s = sumEl('col', `Total of column ${c + 1}`);
    sums.col.push(s);
    grid.append(s);
  }
  sums.d1 = sumEl('diag down', 'Total of the falling diagonal');
  grid.append(sums.d1);

  function update() {
    for (const b of blanks) vals[b.r][b.c] = b.ring.value === '?' ? null : Number(b.ring.value);
    const lines = [];
    const total = (cells) => ({ sum: cells.reduce((a, v) => a + (v ?? 0), 0), whole: cells.every((v) => v !== null) });
    vals.forEach((r, i) => lines.push([sums.row[i], total(r)]));
    for (let c = 0; c < n; c++) lines.push([sums.col[c], total(vals.map((r) => r[c]))]);
    lines.push([sums.d1, total(vals.map((r, i) => r[i]))]);
    lines.push([sums.d2, total(vals.map((r, i) => r[n - 1 - i]))]);
    const whole = lines.filter(([, t]) => t.whole);
    const target = whole.length ? whole[0][1].sum : null;
    const allMatch = lines.every(([, t]) => t.whole && t.sum === target);
    for (const [node, t] of lines) {
      node.textContent = t.whole ? String(t.sum) : `${t.sum}…`;
      node.classList.toggle('part', !t.whole);
      node.classList.toggle('match', allMatch);
    }
    grid.classList.toggle('magic', allMatch);
    const filled = blanks.every((b) => b.ring.value !== '?');
    ctx.offer(filled ? blanks.map((b) => b.ring.value).join('') : null, 'Read them together');
  }
  update();
  return { node: el('div', { class: 'stage-magic' }, grid) };
}

// =================================================================== the seven bridges

const BRIDGE_MAP = {
  places: {
    north: { label: 'NORTH BANK', at: [170, 34], walk: [60, 52] },
    south: { label: 'SOUTH BANK', at: [170, 236], walk: [60, 214] },
    fold: { label: 'THE FOLD', at: [104, 130], walk: [104, 148] },
    eyot: { label: 'THE EYOT', at: [244, 130], walk: [244, 145] },
  },
};

function bridges(ctx) {
  const { spec } = ctx;
  const names = spec.names ?? { north: 'the North Bank', south: 'the South Bank', fold: 'the Fold', eyot: 'the Eyot' };
  // You are on a bank or an island, but in the Fold.
  const where = (id) => `${(spec.inside ?? []).includes(id) ? 'in' : 'on'} ${names[id]}`;
  // Where each bridge is drawn, in the order the case lists them.
  const spans = [];
  const seen = {};
  for (const [a, b] of spec.bridges) {
    const k = [a, b].sort().join('-');
    const n = (seen[k] = (seen[k] ?? 0) + 1);
    spans.push({ a, b, ...bridgeLine(a, b, n) });
  }
  const svg = sv('svg', { viewBox: '0 0 340 270', class: 'bridges', role: 'img', 'aria-label': 'A sketch of the river, its islands and seven bridges' });
  svg.append(
    sv('rect', { x: 0, y: 0, width: 340, height: 270, class: 'br-land' }),
    sv('path', { d: 'M0 88 C60 80 120 96 170 90 C230 84 280 96 340 88 L340 178 C280 186 230 172 170 180 C120 186 60 172 0 180 Z', class: 'br-water' }),
    sv('ellipse', { cx: 104, cy: 133, rx: 64, ry: 27, class: 'br-isle', 'data-place': 'fold' }),
    sv('ellipse', { cx: 244, cy: 133, rx: 42, ry: 22, class: 'br-isle', 'data-place': 'eyot' }),
  );
  svg.append(sv('rect', { x: 0, y: 0, width: 340, height: 84, class: 'br-hit', 'data-place': 'north' }), sv('rect', { x: 0, y: 184, width: 340, height: 86, class: 'br-hit', 'data-place': 'south' }));
  for (const [id, pl] of Object.entries(BRIDGE_MAP.places)) {
    const t = sv('text', { x: pl.at[0], y: pl.at[1], class: 'br-label', 'text-anchor': 'middle', 'data-place': id });
    t.textContent = pl.label;
    svg.append(t);
  }
  const bridgeEls = spans.map((s, i) => {
    const g = sv('g', { class: 'br-bridge', 'data-i': String(i), role: 'button', tabindex: '0', 'aria-label': `Bridge between ${names[s.a]} and ${names[s.b]}` }, sv('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, class: 'br-hitline' }), sv('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, class: 'br-deck' }), sv('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, class: 'br-trail' }));
    svg.append(g);
    return g;
  });
  const walker = sv('circle', { r: 7, cx: 0, cy: 0, class: 'br-walker' });
  svg.append(walker);

  let start = null;
  let at = null;
  const crossed = [];
  const count = el('div', { class: 'br-count' });
  const moveWalker = ([x, y]) => {
    walker.style.transform = `translate(${x}px, ${y}px)`;
  };
  function paint() {
    bridgeEls.forEach((g, i) => {
      g.classList.toggle('crossed', crossed.includes(i));
      g.classList.toggle('open', !!at && !crossed.includes(i) && (spans[i].a === at || spans[i].b === at));
    });
    svg.querySelectorAll('[data-place]').forEach((node) => {
      node.classList.toggle('here', node.dataset.place === at);
      node.classList.toggle('began', node.dataset.place === start);
    });
    walker.classList.toggle('on', !!at);
    count.textContent = at ? `Crossed ${crossed.length} of ${spans.length}` : 'Tap a place to start your walk';
    if (crossed.length === spans.length) {
      const fine = at === spec.end;
      ctx.say(`All seven, each once. You began ${where(start)} and ended ${where(at)}.${fine ? '' : ` Hers ended ${where(spec.end)}.`}`);
      ctx.offer(fine ? names[start] : null, fine ? `She began ${where(start)}` : 'Answer');
    } else {
      ctx.offer(null, 'Answer');
      if (at && !spans.some((s, i) => !crossed.includes(i) && (s.a === at || s.b === at))) ctx.say(`Stuck ${where(at)}: no bridge left from here.`);
    }
  }
  function begin(id) {
    start = id;
    at = id;
    crossed.length = 0;
    ctx.say('');
    moveWalker(BRIDGE_MAP.places[id].walk);
    ctx.tick();
    paint();
  }
  async function cross(i) {
    const s = spans[i];
    if (!at) {
      ctx.say('Tap a place to start from first.');
      return;
    }
    if (crossed.includes(i)) {
      shake(bridgeEls[i]);
      ctx.say('You have crossed that one already.');
      return;
    }
    if (s.a !== at && s.b !== at) {
      shake(bridgeEls[i]);
      ctx.say(`That bridge does not start ${where(at)}.`);
      return;
    }
    const from = s.a === at ? [s.x1, s.y1] : [s.x2, s.y2];
    const to = s.a === at ? [s.x2, s.y2] : [s.x1, s.y1];
    ctx.say('');
    moveWalker(from);
    await wait(still() ? 0 : 140);
    moveWalker(to);
    crossed.push(i);
    at = s.a === at ? s.b : s.a;
    ctx.game.audio.step?.();
    paint();
    await wait(still() ? 0 : 320);
    moveWalker(BRIDGE_MAP.places[at].walk);
  }
  svg.addEventListener('click', (e) => {
    const b = e.target.closest?.('.br-bridge');
    if (b) {
      cross(Number(b.dataset.i));
      return;
    }
    const place = e.target.closest?.('[data-place]');
    if (place && (!at || crossed.length === 0 || crossed.length === spans.length)) begin(place.dataset.place);
    else if (place && at) ctx.say('Start again to choose a new place to start from.');
  });
  svg.addEventListener('keydown', (e) => {
    const b = e.target.closest?.('.br-bridge');
    if (b && e.key === 'Enter') cross(Number(b.dataset.i));
  });
  paint();
  return { node: el('div', { class: 'stage-bridges' }, svg, count, tools(toolBtn('reset', 'Start again', () => { start = null; at = null; crossed.length = 0; moveWalker([-20, -20]); ctx.say(''); paint(); }))) };
}

/** Where the n-th bridge between two places is drawn on the sketch: x1,y1 on `a`'s side, x2,y2 on `b`'s. */
function bridgeLine(a, b, n) {
  const ENDS = {
    'fold-north': [{ north: [78, 86], fold: [80, 110] }, { north: [128, 90], fold: [126, 109] }],
    'eyot-fold': [{ fold: [166, 133], eyot: [204, 133] }],
    'eyot-south': [{ eyot: [228, 153], south: [226, 178] }, { eyot: [262, 153], south: [264, 176] }],
    'north-south': [{ north: [314, 88], south: [314, 182] }],
    'eyot-north': [{ north: [244, 86], eyot: [244, 111] }],
  };
  const ends = ENDS[[a, b].sort().join('-')]?.[n - 1];
  if (!ends) return { x1: 0, y1: 0, x2: 0, y2: 0 };
  return { x1: ends[a][0], y1: ends[a][1], x2: ends[b][0], y2: ends[b][1] };
}

// =================================================================== the fifteen tiles

function slide(ctx) {
  const rows = ctx.p.blocks.find((b) => b.grid && b.numbers)?.grid.map((r) => r.trim().split(/\s+/)) ?? [];
  const n = rows.length;
  const start = rows.flat();
  let cells = [...start];
  let moves = 0;
  const tray = el('div', { class: 'slide-tray', style: { '--n': String(n) } });
  const tiles = new Map();
  for (const v of start) {
    if (v === '_') continue;
    const t = el('button', { class: 'slide-t', type: 'button', text: v, 'aria-label': `Tile ${v}` });
    t.addEventListener('click', () => push(v));
    tiles.set(v, t);
    tray.append(t);
  }
  const counter = el('div', { class: 'slide-count' });
  function paint() {
    cells.forEach((v, i) => {
      const t = tiles.get(v);
      if (!t) return;
      t.style.setProperty('--x', String(i % n));
      t.style.setProperty('--y', String(Math.floor(i / n)));
      t.classList.toggle('home', Number(v) === i + 1);
    });
    counter.textContent = moves ? `${moves} ${moves === 1 ? 'slide' : 'slides'}` : 'Tap a tile next to the gap to slide it';
  }
  function push(v) {
    const i = cells.indexOf(v);
    const g = cells.indexOf('_');
    const [ix, iy, gx, gy] = [i % n, Math.floor(i / n), g % n, Math.floor(g / n)];
    if (ix !== gx && iy !== gy) {
      shake(tiles.get(v));
      return;
    }
    // Everything between the tile and the gap slides along with it.
    const step = ix === gx ? (iy < gy ? n : -n) : ix < gx ? 1 : -1;
    for (let at = g; at !== i; at -= step) cells[at] = cells[at - step];
    cells[i] = '_';
    moves += 1;
    ctx.tick();
    paint();
  }
  paint();
  ctx.choices(ctx.spec.choices ?? []);
  return { node: el('div', { class: 'stage-slide' }, el('div', { class: 'slide-case' }, tray), counter, tools(toolBtn('reset', 'Put them back', () => { cells = [...start]; moves = 0; paint(); }))) };
}

// =================================================================== five places on the map

function places(ctx) {
  const list = ctx.p.blocks.find((b) => b.list)?.list ?? [];
  const items = list.map((line) => {
    const [clue, where = ''] = line.split(/\s{2,}/);
    const m = where.match(/([\d.]+)°\s*([NS]),\s*([\d.]+)°\s*([EW])/);
    const lat = m ? Number(m[1]) * (m[2] === 'S' ? -1 : 1) : 0;
    const lon = m ? Number(m[3]) * (m[4] === 'W' ? -1 : 1) : 0;
    return { clue, where, lat, lon };
  });
  const map = drawWorld();
  const pins = items.map((it, i) => {
    const [x, y] = project(it.lat, it.lon);
    const n = sv('text', { x: 0, y: -11, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'pin-n' });
    n.textContent = String(i + 1);
    const body = sv('g', { class: 'pin-body' }, sv('path', { d: 'M0 0 C-4 -6 -6 -9 -6 -12 A6 6 0 1 1 6 -12 C6 -9 4 -6 0 0 Z', class: 'pin-head' }), n);
    const pin = sv('g', { class: 'pin', transform: `translate(${x} ${y})` }, body);
    map.append(pin);
    return { pin, body };
  });
  let touched = false;
  // One ring per place, read together as a word: set by hand, or typed from the first ring on.
  const row = ringRow({ count: items.length, label: 'First letter of place', tick: ctx.tick, onChange: () => { touched = true; offer(); }, onEnter: () => ctx.submit(row.value) });
  const rings = row.rings;
  // Tapping a place drops its pin; pins already dropped stay, a little fainter.
  const show = (i) => {
    pins.forEach(({ pin }, j) => {
      if (j === i) pin.classList.add('seen');
      pin.classList.toggle('on', j === i);
    });
    const { body } = pins[i];
    body.classList.remove('drop');
    void body.getBoundingClientRect();
    body.classList.add('drop');
    cards.forEach((c, j) => c.classList.toggle('on', j === i));
    ctx.tap();
  };
  const cards = items.map((it, i) => {
    rings[i].node.classList.add('small');
    return el('div', { class: 'place-card' }, el('button', { class: 'place-say', type: 'button', onClick: () => show(i) }, el('span', { class: 'place-n', text: String(i + 1) }), el('span', { class: 'place-clue' }, it.clue, el('small', { text: it.where }))), rings[i].node);
  });
  const offer = () => ctx.offer(touched ? row.value : null, 'Answer');
  offer();
  row.node.querySelector('.ring-row')?.remove();
  return { node: el('div', { class: 'stage-places' }, el('div', { class: 'world' }, map), el('div', { class: 'place-list' }, cards), row.node), focus: () => {} };
}

export const KINDS = { lock, write, wheel, fence, keyed, pairs, codes, pigpen, bacon, knight, column, grids, clue, magic, bridges, slide, places, collar, chart, instruments, sun, ferry, garden, grid, chess, wordgame, order, pendulum, piano };
