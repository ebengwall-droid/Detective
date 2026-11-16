// Puzzles about the world, handled on the stage.
//
//   sun        the Fold's longitude: the clock gives the minutes, the player works out the degrees
//   ferry      Nell's oldest riddle: a fox, a goose and a sack of corn, and a small boat
//   garden     the Physic Garden: put each medicine by the plant it comes from
//   grid       a logic grid: whose cup is whose
//   chess      Dame Hesper's adjourned game: find the move
//   wordgame   the Crux's six-letter word game (the game core marks each guess)
//   order      six brass plates to put in order of history
//   pendulum   five weights on strings: find the two that swing together
//   piano      a line of music to play, then name
//
// Same contract as stage-kinds.js.

import { el } from './dom.js';
import { sv, wait, still, shake, glide } from './stage-parts.js';

// =================================================================== the Fold's own noon

/** Southern Britain, roughly, for the strip of longitude. [lon, lat] */
const BRITAIN = [[-5.7, 50.05], [-4.2, 50.35], [-3.4, 50.6], [-2.5, 50.6], [-1.3, 50.75], [0.2, 50.75], [1.4, 51.15], [1.45, 51.38], [0.7, 51.5], [1.75, 52.6], [0.4, 52.95], [0.2, 53.45], [-3, 53.45], [-4.6, 53.3], [-4.2, 52.25], [-5.3, 51.75], [-3.3, 51.45], [-3.1, 51.2], [-4.2, 51.2], [-5.6, 50.5]];

export function sun(ctx) {
  const { behind = 11, step = 0.25, west = 6 } = ctx.spec;
  const east = 2;
  const W = 340;
  const H = 150;
  const x = (lon) => 16 + ((lon + west) / (west + east)) * (W - 32);
  const y = (lat) => 18 + ((53.6 - lat) / 3.8) * (H - 44);
  const lonAt = (px) => ((px - 16) / (W - 32)) * (west + east) - west;
  // Degrees in whole numbers and quarters, the way the pin is read: 2¾°W.
  const QUARTER = ['', '¼', '½', '¾'];
  const degText = (d) => {
    const whole = Math.floor(d + 1e-9);
    const q = Math.round((d - whole) * 4);
    return `${whole || !q ? whole : ''}${QUARTER[q]}°`;
  };
  let deg = 0;
  const land = sv('path', { d: `M${BRITAIN.map(([lo, la]) => `${x(lo).toFixed(1)} ${y(la).toFixed(1)}`).join(' L')} Z`, class: 'sun-land' });
  const lines = [];
  for (let lon = -west; lon <= east; lon += 1) {
    lines.push(sv('line', { x1: x(lon), y1: 12, x2: x(lon), y2: H - 22, class: `sun-mer ${lon === 0 ? 'gw' : ''}` }));
    // Quarter-degree marks between the whole degrees.
    if (lon < east) for (const qq of [0.25, 0.5, 0.75]) lines.push(sv('line', { x1: x(lon + qq), y1: H - 26, x2: x(lon + qq), y2: H - 22, class: 'sun-q' }));
    const t = sv('text', { x: x(lon), y: H - 8, class: 'sun-deg', 'text-anchor': 'middle' });
    t.textContent = lon === 0 ? '0°' : `${Math.abs(lon)}°${lon < 0 ? 'W' : 'E'}`;
    lines.push(t);
  }
  const gwLabel = sv('text', { x: x(0) + 4, y: 24, class: 'sun-gw' });
  gwLabel.textContent = 'GREENWICH';
  const sunMark = sv('g', { class: 'sun-sun', transform: `translate(${x(0)} 10)` }, sv('circle', { r: 6 }), Array.from({ length: 8 }, (_, i) => sv('line', { x1: 0, y1: -9, x2: 0, y2: -12, transform: `rotate(${i * 45})` })));
  const pinY = y(51.45);
  const pinLabel = sv('text', { x: 10, y: -12, class: 'sun-pin-label' });
  const pin = sv('g', { class: 'sun-pin' }, sv('line', { x1: 0, y1: -40, x2: 0, y2: 40, class: 'sun-pin-line' }), sv('circle', { r: 7, class: 'sun-pin-dot' }), pinLabel);
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sun-strip', role: 'slider', tabindex: '0', 'aria-label': 'Where the Fold lies, west of Greenwich', 'aria-valuemin': '0', 'aria-valuemax': String(west) }, sv('rect', { x: 0, y: 0, width: W, height: H, class: 'sun-sea' }), land, lines, gwLabel, sunMark, pin);

  // The Hall clock, stopped at Greenwich noon: the red hand at twelve, the black hand eleven minutes short of it.
  // It does not move with the pin: the sum is the player's.
  const C = 70;
  const hand = (minutes, len, cls) => {
    const a = (minutes * 6 * Math.PI) / 180;
    return sv('line', { x1: C, y1: C, x2: C + len * Math.sin(a), y2: C - len * Math.cos(a), class: cls });
  };
  const clock = sv(
    'svg',
    { viewBox: '0 0 140 140', class: 'sun-clock', role: 'img', 'aria-label': `The Hall clock. The red hand shows twelve o'clock, Greenwich time. The black hand shows ${behind} minutes to twelve, Fold Time.` },
    sv('circle', { cx: C, cy: C, r: 66, class: 'sc-rim' }),
    sv('circle', { cx: C, cy: C, r: 60, class: 'sc-face' }),
    Array.from({ length: 60 }, (_, i) => {
      const a = (i * 6 * Math.PI) / 180;
      const r1 = i % 5 ? 55 : 50;
      return sv('line', { x1: C + r1 * Math.sin(a), y1: C - r1 * Math.cos(a), x2: C + 58 * Math.sin(a), y2: C - 58 * Math.cos(a), class: i % 5 ? 'sc-tick' : 'sc-tick big' });
    }),
    hand(-behind / 12, 30, 'sc-hour'),
    hand(0, 52, 'sc-red'),
    hand(60 - behind, 48, 'sc-black'),
    sv('circle', { cx: C, cy: C, r: 4, class: 'sc-boss' }),
  );
  const fold = 12 * 60 - behind;
  const hhmm = `${String(Math.floor(fold / 60)).padStart(2, '0')}:${String(fold % 60).padStart(2, '0')}`;
  const legend = el('div', { class: 'sun-read' }, el('span', {}, el('b', { class: 'r', text: '12:00' }), ' Greenwich'), el('span', {}, el('b', { text: hhmm }), ' the Fold'));
  function draw() {
    pin.setAttribute('transform', `translate(${x(-deg)} ${pinY})`);
    pinLabel.textContent = deg ? `THE FOLD · ${degText(deg)}W` : 'THE FOLD';
    svg.setAttribute('aria-valuenow', String(deg));
    svg.setAttribute('aria-valuetext', `${deg} degrees west`);
    ctx.offer(deg ? String(deg) : null, deg ? `The Fold is ${degText(deg)} west` : 'Answer');
  }
  const set = (d) => {
    const to = Math.max(0, Math.min(west, Math.round(d / step) * step));
    if (to === deg) return;
    deg = to;
    ctx.tick();
    draw();
  };
  let dragging = false;
  const at = (e) => {
    const b = svg.getBoundingClientRect();
    return lonAt(((e.clientX - b.left) / b.width) * W);
  };
  svg.addEventListener('pointerdown', (e) => {
    dragging = true;
    svg.setPointerCapture?.(e.pointerId);
    svg.focus({ preventScroll: true });
    set(-at(e));
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => dragging && set(-at(e)));
  svg.addEventListener('pointerup', () => (dragging = false));
  svg.addEventListener('pointercancel', () => (dragging = false));
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') set(deg + step);
    else if (e.key === 'ArrowRight') set(deg - step);
    else return;
    e.preventDefault();
  });
  draw();
  return { node: el('div', { class: 'stage-sun' }, svg, el('div', { class: 'sun-row' }, clock, legend)), focus: () => svg.focus({ preventScroll: true }) };
}

// =================================================================== the ferry

const CREATURE = {
  fox: () => sv('svg', { viewBox: '0 0 40 40', class: 'icon-fox' }, sv('path', { d: 'M8 8 L14 18 L26 18 L32 8 L30 22 L20 33 L10 22 Z', fill: '#d9772b', stroke: '#7a3a10', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }), sv('path', { d: 'M14 24 L20 33 L26 24 Q20 27 14 24 Z', fill: '#f6efe2' }), sv('circle', { cx: 16, cy: 22, r: 1.6, fill: '#2a1d10' }), sv('circle', { cx: 24, cy: 22, r: 1.6, fill: '#2a1d10' }), sv('circle', { cx: 20, cy: 32, r: 1.8, fill: '#2a1d10' })),
  goose: () => sv('svg', { viewBox: '0 0 40 40', class: 'icon-goose' }, sv('ellipse', { cx: 18, cy: 28, rx: 12, ry: 7, fill: '#f4f1ea', stroke: '#8a8478', 'stroke-width': 1.2 }), sv('path', { d: 'M26 26 Q30 14 27 8', fill: 'none', stroke: '#f4f1ea', 'stroke-width': 5, 'stroke-linecap': 'round' }), sv('path', { d: 'M26 26 Q30 14 27 8', fill: 'none', stroke: '#8a8478', 'stroke-width': 0.8 }), sv('circle', { cx: 27, cy: 8, r: 3.6, fill: '#f4f1ea', stroke: '#8a8478', 'stroke-width': 1 }), sv('path', { d: 'M30 8 L35 9 L30 10.5 Z', fill: '#e08a12' }), sv('circle', { cx: 27.5, cy: 7.2, r: 0.9, fill: '#2a1d10' })),
  corn: () => sv('svg', { viewBox: '0 0 40 40', class: 'icon-corn' }, sv('path', { d: 'M10 14 Q8 32 12 35 L28 35 Q32 32 30 14 Q26 11 20 12 Q14 11 10 14 Z', fill: '#c9a46a', stroke: '#6b4f2c', 'stroke-width': 1.2 }), sv('path', { d: 'M14 13 Q20 7 26 13', fill: 'none', stroke: '#6b4f2c', 'stroke-width': 1.4 }), sv('path', { d: 'M17 9 L18 4 M20 9 L20 3 M23 9 L22 4', stroke: '#d9b14a', 'stroke-width': 1.6, 'stroke-linecap': 'round' }), (() => {
    const t = sv('text', { x: 20, y: 27, 'text-anchor': 'middle', 'font-size': 7, 'font-weight': 700, fill: '#5a3f1c', 'font-family': 'Cinzel, serif' });
    t.textContent = 'CORN';
    return t;
  })()),
};

export function ferry(ctx) {
  const { items = [], eats = [] } = ctx.spec;
  const NAMES = { fox: 'the fox', goose: 'the goose', corn: 'the corn' };
  let side = {};
  let boat = 'near';
  let cargo = null;
  let crossings = 0;
  let first = null;
  let busy = false;
  const tokens = new Map();
  const scene = el('div', { class: 'ferry-scene' });
  const near = el('div', { class: 'ferry-bank near' }, el('span', { class: 'bank-name', text: 'This side' }));
  const far = el('div', { class: 'ferry-bank far' }, el('span', { class: 'bank-name', text: 'Across the Cut' }));
  const hold = el('div', { class: 'ferry-hold' });
  const hull = el('div', { class: 'ferry-boat' }, el('span', { class: 'ferry-nell', 'aria-hidden': 'true' }), hold, el('span', { class: 'ferry-hull', 'aria-hidden': 'true' }));
  const water = el('div', { class: 'ferry-water' }, hull);
  scene.append(near, water, far);
  const count = el('div', { class: 'ferry-count' });
  const row = el('button', { class: 'btn ferry-row', type: 'button', text: 'Row across' });
  const restart = el('button', { class: 'btn small quiet', type: 'button', text: 'Start again' });
  for (const it of items) {
    const t = el('button', { class: 'ferry-token', type: 'button', 'aria-label': NAMES[it] ?? it }, CREATURE[it]?.() ?? it);
    t.addEventListener('click', () => load(it));
    tokens.set(it, t);
  }
  function reset() {
    side = Object.fromEntries(items.map((it) => [it, 'near']));
    boat = 'near';
    cargo = null;
    crossings = 0;
    first = null;
    scene.classList.remove('lost');
    ctx.say('');
    ctx.offer(null, 'Answer');
    paint();
  }
  function paint() {
    for (const [it, t] of tokens) {
      const where = cargo === it ? hold : side[it] === 'near' ? near : far;
      if (t.parentElement !== where) where.append(t);
    }
    hull.classList.toggle('far', boat === 'far');
    count.textContent = crossings ? `${crossings} ${crossings === 1 ? 'crossing' : 'crossings'}` : 'Tap something to put it in the boat.';
    row.textContent = cargo ? `Row across with ${NAMES[cargo]}` : 'Row across alone';
  }
  function load(it) {
    if (busy) return;
    if (cargo === it) {
      cargo = null;
      side[it] = boat;
    } else if (side[it] === boat && !cargo) {
      cargo = it;
    } else if (side[it] !== boat) {
      shake(tokens.get(it));
      ctx.say('The boat is on the other side.');
      return;
    } else {
      shake(tokens.get(it));
      ctx.say('The boat only holds one thing besides Nell.');
      return;
    }
    ctx.tap();
    ctx.say('');
    glide([...tokens.values()], paint, { ms: 320 });
  }
  async function cross() {
    if (busy) return;
    busy = true;
    const from = boat;
    boat = from === 'near' ? 'far' : 'near';
    crossings += 1;
    if (cargo && !first) first = cargo;
    ctx.game.audio.step?.();
    paint();
    await wait(still() ? 0 : 750);
    if (cargo) {
      side[cargo] = boat;
      cargo = null;
    }
    // Whatever was left behind, alone together.
    const left = items.filter((it) => side[it] === from);
    const meal = eats.find(([a, b]) => left.includes(a) && left.includes(b));
    glide([...tokens.values()], paint, { ms: 320 });
    busy = false;
    if (meal) {
      scene.classList.add('lost');
      tokens.get(meal[1])?.classList.add('eaten');
      ctx.say(`Nell looks back. ${NAMES[meal[0]][0].toUpperCase()}${NAMES[meal[0]].slice(1)} has eaten ${NAMES[meal[1]]}.`);
      ctx.game.audio.clunk?.();
      await wait(still() ? 0 : 1700);
      tokens.get(meal[1])?.classList.remove('eaten');
      reset();
      ctx.say(`${NAMES[meal[0]][0].toUpperCase()}${NAMES[meal[0]].slice(1)} ate ${NAMES[meal[1]]}. Start again.`);
      return;
    }
    if (items.every((it) => side[it] === 'far')) {
      ctx.say(`All three across in ${crossings} crossings. The first to go was ${NAMES[first] ?? 'nothing'}.`);
      ctx.offer(first?.toUpperCase() ?? null, `${(NAMES[first] ?? '').replace(/^the /, 'The ')} went first`);
    }
  }
  row.addEventListener('click', cross);
  restart.addEventListener('click', reset);
  reset();
  return { node: el('div', { class: 'stage-ferry' }, scene, el('div', { class: 'ferry-controls' }, row, count, restart)) };
}

// =================================================================== the Physic Garden

const PLANT = {
  willow: () => sv('svg', { viewBox: '0 0 60 50', class: 'plant' }, sv('path', { d: 'M30 48 L30 20', stroke: '#6b4f2c', 'stroke-width': 3 }), ...[-22, -14, -6, 2, 10, 18].map((dx, i) => sv('path', { d: `M30 ${16 + (i % 2) * 3} Q${30 + dx} 10 ${30 + dx * 1.3} 40`, fill: 'none', stroke: '#7fa65a', 'stroke-width': 1.6 }))),
  poppy: () => sv('svg', { viewBox: '0 0 60 50', class: 'plant' }, ...[18, 32, 44].map((x0, i) => sv('g', {}, sv('path', { d: `M${x0} 48 Q${x0 - 2} 30 ${x0 + 1} ${18 + i * 4}`, fill: 'none', stroke: '#6f8f4a', 'stroke-width': 1.5 }), sv('circle', { cx: x0 + 1, cy: 15 + i * 4, r: 6, fill: '#d23b2b' }), sv('circle', { cx: x0 + 1, cy: 15 + i * 4, r: 2, fill: '#2a1d10' })))),
  foxglove: () => sv('svg', { viewBox: '0 0 60 50', class: 'plant' }, sv('path', { d: 'M30 48 L30 6', stroke: '#6f8f4a', 'stroke-width': 2 }), ...Array.from({ length: 6 }, (_, i) => sv('ellipse', { cx: 30 + (i % 2 ? 5 : -5), cy: 10 + i * 6, rx: 4, ry: 3, fill: '#a35ba8', transform: `rotate(${i % 2 ? 25 : -25} ${30 + (i % 2 ? 5 : -5)} ${10 + i * 6})` })), sv('path', { d: 'M18 48 Q22 40 30 42 Q38 40 42 48', fill: '#6f8f4a' })),
  nightshade: () => sv('svg', { viewBox: '0 0 60 50', class: 'plant' }, sv('path', { d: 'M30 48 L30 14 M30 26 L18 18 M30 22 L42 14', stroke: '#5c7a3e', 'stroke-width': 2 }), sv('ellipse', { cx: 16, cy: 26, rx: 7, ry: 4, fill: '#5c7a3e' }), sv('ellipse', { cx: 44, cy: 24, rx: 7, ry: 4, fill: '#5c7a3e' }), sv('circle', { cx: 18, cy: 16, r: 3.4, fill: '#1c1424' }), sv('circle', { cx: 42, cy: 12, r: 3.4, fill: '#1c1424' }), sv('circle', { cx: 30, cy: 12, r: 3.4, fill: '#1c1424' })),
  yew: () => sv('svg', { viewBox: '0 0 60 50', class: 'plant' }, sv('path', { d: 'M30 48 L30 34', stroke: '#6b4f2c', 'stroke-width': 3 }), sv('path', { d: 'M30 4 L48 36 L12 36 Z', fill: '#2f5a33' }), sv('circle', { cx: 24, cy: 26, r: 2.2, fill: '#d1342a' }), sv('circle', { cx: 36, cy: 20, r: 2.2, fill: '#d1342a' }), sv('circle', { cx: 33, cy: 31, r: 2.2, fill: '#d1342a' })),
};

export function garden(ctx) {
  const { beds = [], jars = [] } = ctx.spec;
  const placed = new Map();
  let held = null;
  const shelf = el('div', { class: 'jar-shelf' });
  const jarEls = new Map();
  for (const j of jars) {
    const b = el('button', { class: 'jar', type: 'button', 'aria-label': `${j.id}: ${j.use}` }, el('span', { class: 'jar-lid', 'aria-hidden': 'true' }), el('span', { class: 'jar-label' }, el('b', { text: j.id }), el('small', { text: j.use })));
    b.addEventListener('click', () => {
      ctx.tap();
      const bed = [...placed].find(([, jid]) => jid === j.id)?.[0];
      if (bed) {
        placed.delete(bed);
        held = null;
      } else held = held === j.id ? null : j.id;
      paint();
    });
    jarEls.set(j.id, b);
  }
  const bedEls = beds.map((bd) => {
    const slot = el('div', { class: 'bed-slot' });
    const node = el('button', { class: 'bed', type: 'button', 'aria-label': `${bd.latin}, ${bd.name}` }, PLANT[bd.plant]?.() ?? null, el('span', { class: 'bed-latin', text: bd.latin }), el('span', { class: 'bed-name', text: bd.name }), slot);
    node.addEventListener('click', () => {
      if (!held) {
        if (placed.has(bd.id)) {
          placed.delete(bd.id);
          paint();
          return;
        }
        ctx.say('Tap a jar first.');
        return;
      }
      for (const [k, v] of placed) if (v === held) placed.delete(k);
      placed.set(bd.id, held);
      held = null;
      ctx.tick();
      ctx.say('');
      paint();
    });
    return { bd, node, slot };
  });
  function paint() {
    glide([...jarEls.values()], () => {
      for (const { bd, node, slot } of bedEls) {
        const jid = placed.get(bd.id);
        node.classList.toggle('filled', !!jid);
        if (jid) slot.append(jarEls.get(jid));
      }
      for (const [id, b] of jarEls) {
        if (![...placed.values()].includes(id)) shelf.append(b);
        b.classList.toggle('held', held === id);
      }
    }, { ms: 360 });
    const done = beds.every((bd) => placed.has(bd.id));
    ctx.offer(done ? beds.map((bd) => placed.get(bd.id)).join(' ') : null, done ? 'Label the beds' : 'Answer');
  }
  paint();
  return { node: el('div', { class: 'stage-garden' }, el('div', { class: 'garden-beds' }, bedEls.map((b) => b.node)), el('div', { class: 'under-label', text: 'The jars' }), shelf), wrong: () => shake(shelf.parentElement) };
}

// =================================================================== a logic grid

const CUP = {
  clock: () => [sv('circle', { cx: 20, cy: 18, r: 6, fill: 'none', stroke: '#2a1d10', 'stroke-width': 1 }), sv('path', { d: 'M20 18 L20 14 M20 18 L23 19', stroke: '#2a1d10', 'stroke-width': 1 })],
  compass: () => [sv('path', { d: 'M20 10 L22 18 L20 26 L18 18 Z M12 18 L20 16 L28 18 L20 20 Z', fill: '#2a1d10' })],
  crossword: () => [sv('path', { d: 'M14 12 H26 V24 H14 Z M18 12 V24 M22 12 V24 M14 16 H26 M14 20 H26', fill: 'none', stroke: '#2a1d10', 'stroke-width': 0.9 }), sv('rect', { x: 18, y: 16, width: 4, height: 4, fill: '#2a1d10' })],
  arms: () => [sv('path', { d: 'M14 11 H26 V18 Q26 24 20 27 Q14 24 14 18 Z', fill: 'none', stroke: '#2a1d10', 'stroke-width': 1.1 }), sv('path', { d: 'M20 11 V27 M14 17 H26', stroke: '#2a1d10', 'stroke-width': 0.8 })],
};

function cupIcon(kind, down) {
  return sv('svg', { viewBox: '0 0 40 36', class: `cup ${down ? 'down' : ''}` }, sv('g', { transform: down ? 'rotate(180 20 18)' : '' }, sv('path', { d: 'M8 8 H32 V20 Q32 30 20 30 Q8 30 8 20 Z', fill: '#f4efe2', stroke: '#8a7a62', 'stroke-width': 1.2 }), sv('path', { d: 'M32 12 Q38 12 38 17 Q38 22 32 22', fill: 'none', stroke: '#8a7a62', 'stroke-width': 1.6 }), ...(CUP[kind]?.() ?? [])));
}

export function grid(ctx) {
  const { rows = [], cols = [], down = [] } = ctx.spec;
  const clueBlock = ctx.p.blocks.find((b) => b.quote);
  const clueLines = (clueBlock?.quote ?? '').split('\n').filter((l) => l.trim() && !l.startsWith('—'));
  const marks = rows.map(() => cols.map(() => 0)); // 0 nothing, 1 cross, 2 tick
  const cells = [];
  const table = el('div', { class: 'lg', style: { '--cols': String(cols.length) } });
  table.append(el('span', { class: 'lg-corner' }));
  for (const c of cols) table.append(el('div', { class: 'lg-col' }, cupIcon(c.cup, down.includes(c.id)), el('span', { text: c.label })));
  rows.forEach((r, ri) => {
    table.append(el('div', { class: 'lg-row' }, el('b', { text: r.label }), el('small', { text: r.sub })));
    cols.forEach((c, ci) => {
      const b = el('button', { class: 'lg-cell', type: 'button', 'aria-label': `${r.label} and the ${c.label}` });
      b.addEventListener('click', () => {
        marks[ri][ci] = (marks[ri][ci] + 1) % 3;
        ctx.tick();
        paint();
      });
      cells.push({ b, ri, ci });
      table.append(b);
    });
  });
  function paint() {
    for (const { b, ri, ci } of cells) {
      const m = marks[ri][ci];
      // A tick crosses out the rest of its row and column, faintly, without taking the player's own marks away.
      const auto = m === 0 && (marks[ri].some((x, j) => x === 2 && j !== ci) || marks.some((row, i) => i !== ri && row[ci] === 2));
      b.className = `lg-cell ${m === 2 ? 'tick' : m === 1 ? 'cross' : auto ? 'cross auto' : ''}`;
      b.textContent = m === 2 ? '✓' : m === 1 || auto ? '✕' : '';
    }
    const ticks = rows.map((_, ri) => marks[ri].indexOf(2));
    const whole = ticks.every((t, ri) => t >= 0 && marks[ri].filter((x) => x === 2).length === 1) && new Set(ticks).size === rows.length;
    ctx.offer(whole ? rows.map((r, ri) => `${r.id} ${cols[ticks[ri]].id}`).join(' ') : null, whole ? 'That is everyone' : 'Answer');
  }
  const clues = el(
    'ol',
    { class: 'lg-clues' },
    clueLines.map((line) => {
      const li = el('li', { text: line.replace(/^\d+\.\s*/, '') });
      li.addEventListener('click', () => li.classList.toggle('used'));
      return li;
    }),
  );
  paint();
  return { node: el('div', { class: 'stage-grid' }, el('div', { class: 'lg-card' }, el('div', { class: 'lg-card-head', text: "The Four O'Clock Problem" }), clues), el('div', { class: 'lg-wrap' }, table)), wrong: () => shake(table) };
}

// =================================================================== chess

const PIECE_PATHS = {
  p: 'M22.5 9a4 4 0 0 0-3.2 6.4C17.4 16.6 16 18.6 16 21c0 2 .9 3.8 2.4 5-3 1.1-7.4 5.5-7.4 13.5h23c0-8-4.4-12.4-7.4-13.5 1.5-1.2 2.4-3 2.4-5 0-2.4-1.4-4.4-3.3-5.6A4 4 0 0 0 22.5 9z',
  r: 'M9 39h27v-3H9zM12 36v-4h21v4zM11 14V9h4v2h5V9h5v2h5V9h4v5zM34 14l-3 3H14l-3-3zM31 17v12.5H14V17zM31 29.5l1.5 2.5h-20l1.5-2.5z',
  n: 'M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21M24 18c.4 2.9-5.5 7.4-8 9-3 2-2.8 4.3-5 4-1-.9 1.4-3 0-3-1 0 .2 1.2-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.9-1.9 2-3.5c-.7-1-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.8-2 2.5-3c1 0 1 3 1 3',
  b: 'M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.6 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.4.5-2.3.5-3-.5 1.4-1.9 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z',
  q: 'M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z',
  k: 'M22.5 11.6V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z',
};

function piece(code) {
  const white = code === code.toUpperCase();
  const t = code.toLowerCase();
  return sv('svg', { viewBox: '0 0 45 45', class: `cp ${white ? 'w' : 'b'}` }, sv('path', { d: PIECE_PATHS[t], class: 'cp-body' }));
}

export function chess(ctx) {
  const { fen = '8/8/8/8/8/8/8/8', side = 'w' } = ctx.spec;
  const start = () => {
    const b = [];
    for (const row of fen.split('/')) {
      const r = [];
      for (const ch of row) {
        if (/\d/.test(ch)) for (let i = 0; i < Number(ch); i++) r.push(null);
        else r.push(ch);
      }
      b.push(r);
    }
    return b;
  };
  let board = start();
  let sel = null;
  let moved = null;
  const mine = (pc) => !!pc && (side === 'w' ? pc === pc.toUpperCase() : pc === pc.toLowerCase());
  const theirs = (pc) => !!pc && !mine(pc);
  const name = (r, f) => String.fromCharCode(97 + f) + (8 - r);
  const inside = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
  function targets(r, f) {
    const pc = board[r][f];
    const t = pc.toLowerCase();
    const out = [];
    const ray = (dr, df, far) => {
      let rr = r + dr;
      let ff = f + df;
      while (inside(rr, ff)) {
        if (mine(board[rr][ff])) break;
        out.push([rr, ff]);
        if (theirs(board[rr][ff]) || !far) break;
        rr += dr;
        ff += df;
      }
    };
    const dir = side === 'w' ? -1 : 1;
    if (t === 'p') {
      if (inside(r + dir, f) && !board[r + dir][f]) {
        out.push([r + dir, f]);
        const home = side === 'w' ? 6 : 1;
        if (r === home && !board[r + 2 * dir][f]) out.push([r + 2 * dir, f]);
      }
      for (const df of [-1, 1]) if (inside(r + dir, f + df) && theirs(board[r + dir][f + df])) out.push([r + dir, f + df]);
    } else if (t === 'n') {
      for (const [dr, df] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) if (inside(r + dr, f + df) && !mine(board[r + dr][f + df])) out.push([r + dr, f + df]);
    } else {
      const straight = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      const dirs = t === 'r' ? straight : t === 'b' ? diag : [...straight, ...diag];
      for (const [dr, df] of dirs) ray(dr, df, t !== 'k');
    }
    return out;
  }
  const squares = [];
  const boardEl = el('div', { class: 'cb' });
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = el('button', { class: `cb-sq ${(r + f) % 2 ? 'dark' : 'light'}`, type: 'button', 'aria-label': name(r, f) });
      sq.addEventListener('click', () => tapSquare(r, f));
      squares.push(sq);
      boardEl.append(sq);
    }
  }
  function paint() {
    const legal = sel ? targets(sel[0], sel[1]) : [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = squares[r * 8 + f];
        const pc = board[r][f];
        sq.replaceChildren(...(pc ? [piece(pc)] : []));
        sq.classList.toggle('sel', !!sel && sel[0] === r && sel[1] === f);
        sq.classList.toggle('can', legal.some(([a, b]) => a === r && b === f));
        sq.classList.toggle('hit', legal.some(([a, b]) => a === r && b === f) && !!pc);
        sq.classList.toggle('last', !!moved && ((moved.from[0] === r && moved.from[1] === f) || (moved.to[0] === r && moved.to[1] === f)));
        sq.setAttribute('aria-label', `${name(r, f)}${pc ? `: ${mine(pc) ? 'your' : 'their'} ${({ p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king' })[pc.toLowerCase()]}` : ''}`);
      }
    }
  }
  function tapSquare(r, f) {
    const pc = board[r][f];
    if (moved) {
      // Take the move back and think again.
      board = start();
      moved = null;
      ctx.offer(null, 'Answer');
    }
    if (sel && targets(sel[0], sel[1]).some(([a, b]) => a === r && b === f)) {
      const from = sel;
      const p = board[from[0]][from[1]];
      const capture = !!board[r][f];
      board[r][f] = p;
      board[from[0]][from[1]] = null;
      const letter = p.toLowerCase() === 'p' ? (capture ? String.fromCharCode(97 + from[1]) : '') : p.toUpperCase();
      const san = `${letter}${capture ? 'x' : ''}${name(r, f)}`;
      moved = { from, to: [r, f], san };
      sel = null;
      ctx.tick();
      ctx.say('');
      paint();
      ctx.offer(san, `Play ${san}`);
      return;
    }
    if (mine(pc)) {
      sel = sel && sel[0] === r && sel[1] === f ? null : [r, f];
      ctx.tap();
    } else {
      sel = null;
      if (pc) ctx.say('Those are not your pieces.');
    }
    paint();
  }
  paint();
  ctx.offer(null, 'Answer');
  const files = el('div', { class: 'cb-files', 'aria-hidden': 'true' }, [...'abcdefgh'].map((x) => el('span', { text: x })));
  const ranks = el('div', { class: 'cb-ranks', 'aria-hidden': 'true' }, [8, 7, 6, 5, 4, 3, 2, 1].map((x) => el('span', { text: String(x) })));
  return {
    node: el('div', { class: 'stage-chess' }, el('div', { class: 'cb-card', text: 'Adjourned. H.L. to move.' }), el('div', { class: 'cb-frame' }, ranks, boardEl, files)),
    wrong: () => {
      shake(boardEl);
      setTimeout(() => {
        board = start();
        moved = null;
        paint();
        ctx.offer(null, 'Answer');
      }, still() ? 0 : 700);
    },
    right: async () => {
      // The black king lies down.
      const k = squares.find((sq) => sq.querySelector('.cp.b') && sq.getAttribute('aria-label').includes('king'));
      k?.classList.add('mated');
      await wait(still() ? 0 : 700);
    },
  };
}

// =================================================================== the Crux Six

const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫'];

export function wordgame(ctx) {
  const { length = 6, tries = 6 } = ctx.spec;
  let rowAt = 0;
  let guess = '';
  const marks = {};
  const rows = Array.from({ length: tries }, () => Array.from({ length }, () => el('span', { class: 'wg-tile' })));
  const board = el('div', { class: 'wg-board', style: { '--len': String(length) } }, rows.map((r) => el('div', { class: 'wg-row' }, r)));
  const keyEls = new Map();
  const keyboard = el(
    'div',
    { class: 'wg-keys' },
    KEYS.map((line) =>
      el(
        'div',
        { class: 'wg-keyrow' },
        [...line].map((k) => {
          const b = el('button', { class: `wg-key ${k === '⏎' || k === '⌫' ? 'wide' : ''}`, type: 'button', text: k === '⏎' ? 'Enter' : k, 'aria-label': k === '⏎' ? 'Enter' : k === '⌫' ? 'Delete' : k });
          b.addEventListener('pointerdown', (e) => e.preventDefault());
          b.addEventListener('click', () => press(k));
          if (/[A-Z]/.test(k)) keyEls.set(k, b);
          return b;
        }),
      ),
    ),
  );
  function draw() {
    rows[rowAt]?.forEach((t, i) => {
      t.textContent = guess[i] ?? '';
      t.classList.toggle('typed', !!guess[i]);
    });
    ctx.offer(guess.length === length ? guess : null, 'Enter');
  }
  function press(k) {
    if (rowAt >= tries) return;
    if (k === '⌫') guess = guess.slice(0, -1);
    else if (k === '⏎') {
      if (guess.length === length) ctx.submit(guess);
      else shake(board.children[rowAt]);
      return;
    } else if (guess.length < length) {
      guess += k;
      ctx.tick();
    }
    draw();
  }
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Backspace') press('⌫');
    else if (e.key === 'Enter') press('⏎');
    else if (/^[a-z]$/i.test(e.key)) press(e.key.toUpperCase());
    else return;
    e.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  async function reveal(pattern) {
    const tiles = rows[rowAt];
    for (let i = 0; i < length; i++) {
      const cls = pattern[i] === 'G' ? 'green' : pattern[i] === 'Y' ? 'gold' : 'grey';
      tiles[i].classList.add('flip', cls);
      const ch = guess[i];
      const rank = { grey: 1, gold: 2, green: 3 };
      if (!marks[ch] || rank[cls] > rank[marks[ch]]) marks[ch] = cls;
      if (!still()) await wait(110);
    }
    for (const [ch, cls] of Object.entries(marks)) {
      const kb = keyEls.get(ch);
      if (kb) kb.className = `wg-key ${cls}`;
    }
  }
  draw();
  return {
    node: el('div', { class: 'stage-wordgame' }, el('div', { class: 'wg-paper' }, el('div', { class: 'wg-head', text: 'THE CRUX SIX' }), board)),
    dock: keyboard,
    quietWrong: true,
    async wrong(res) {
      if (!res?.pattern) return;
      await reveal(res.pattern);
      rowAt += 1;
      guess = '';
      if (rowAt >= tries) {
        ctx.say('Out of squares. Ottilie rubs them out for you: try again.');
        await wait(still() ? 0 : 1600);
        for (const r of rows) for (const t of r) t.className = 'wg-tile';
        rowAt = 0;
      }
      draw();
    },
    async right() {
      await reveal('G'.repeat(length));
      rows[rowAt].forEach((t, i) => t.animate?.([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], { duration: 360, delay: i * 70 }));
      await wait(still() ? 0 : 600);
    },
    dispose: () => window.removeEventListener('keydown', onKey),
  };
}

// =================================================================== plates to put in order

export function order(ctx) {
  const items = [...(ctx.spec.items ?? [])];
  let held = -1;
  const plates = items.map((it) => {
    const b = el('button', { class: 'plate', type: 'button', 'aria-label': `${it.name}, ${it.text}` }, el('span', { class: 'plate-initial', text: it.id }), el('span', { class: 'plate-body' }, el('b', { text: it.name }), el('small', { text: it.text })));
    b.addEventListener('click', () => tap(b));
    return { it, b };
  });
  const list = el('div', { class: 'plates' });
  function paint() {
    glide(plates.map((p) => p.b), () => {
      for (const p of plates) list.append(p.b);
      plates.forEach((p, i) => p.b.classList.toggle('held', i === held));
    }, { ms: 380 });
    ctx.offer(plates.map((p) => p.it.id).join(''), 'Hang them like this');
  }
  function tap(b) {
    const i = plates.findIndex((p) => p.b === b);
    if (held < 0) {
      held = i;
      ctx.tap();
    } else if (held === i) {
      held = -1;
    } else {
      [plates[held], plates[i]] = [plates[i], plates[held]];
      held = -1;
      ctx.tick();
    }
    paint();
  }
  paint();
  return { node: el('div', { class: 'stage-order' }, el('div', { class: 'under-label', text: 'Oldest at the top' }), list), wrong: () => shake(list) };
}

// =================================================================== the apprentice's pendulums

/**
 * Five weights hang on strings from a beam. Choose two and let them go together:
 * a pair that swings at the same speed stays side by side; any other pair drifts
 * apart. Nothing is counted or measured for the player: they watch, and think.
 */
export function pendulum(ctx) {
  const { bobs = [] } = ctx.spec;
  const W = 360;
  const beamY = 18;
  // From the beam to the middle of the weight: the length that sets the swing.
  const px = (cm) => 30 + cm * 2;
  const xs = bobs.map((_, i) => 52 + (i * (W - 104)) / Math.max(1, bobs.length - 1));
  // Every weight is pulled the same distance sideways, so the long ones stay inside the frame.
  // How far a pendulum swings does not change how fast it swings, so this is fair to the puzzle.
  const ampOf = (len) => Math.min(20, (Math.asin(Math.min(1, 32 / len)) * 180) / Math.PI);
  const g = 9.81;
  const chosen = [];
  let raf = 0;
  let t0 = 0;
  let swinging = false;
  const svg = sv('svg', { viewBox: `0 0 ${W} 268`, class: 'pend-svg', role: 'group', 'aria-label': 'Five weights hanging on strings from a beam' });
  svg.append(sv('rect', { x: 14, y: beamY - 9, width: W - 28, height: 12, rx: 3, class: 'pend-beam' }));
  const items = bobs.map((b, i) => {
    const len = px(b.length);
    const r = b.heavy ? 13 : 10;
    const arm = sv(
      'g',
      { class: 'pend-arm', transform: `translate(${xs[i]} ${beamY})` },
      sv('circle', { cx: 0, cy: 0, r: 3, class: 'pend-hook' }),
      sv('line', { x1: 0, y1: 0, x2: 0, y2: len - r, class: 'pend-string' }),
      sv('circle', { cx: 0, cy: len, r, class: b.heavy ? 'pend-bob brass' : 'pend-bob wood' }),
      sv('circle', { cx: -r * 0.35, cy: len - r * 0.35, r: r * 0.28, class: 'pend-shine' }),
    );
    const tag = sv('text', { x: xs[i], y: 262, class: 'pend-tag', 'text-anchor': 'middle' });
    tag.textContent = b.id;
    const hit = sv('rect', { x: xs[i] - 30, y: beamY, width: 60, height: 268 - beamY, class: 'pend-hit', role: 'button', tabindex: '0', 'aria-pressed': 'false', 'aria-label': `Weight ${b.id}: ${b.heavy ? 'heavy brass' : 'light wood'}, on a string ${b.length} centimetres long` });
    svg.append(arm, tag, hit);
    hit.addEventListener('click', () => pick(i));
    hit.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && pick(i));
    return { b, arm, tag, hit, amp: ampOf(len), period: 2 * Math.PI * Math.sqrt(b.length / 100 / g) };
  });
  const go = el('button', { class: 'btn pend-go', type: 'button', text: 'Let them go', disabled: true });
  const note = el('div', { class: 'pend-note', text: 'Tap two weights.' });
  function draw(now) {
    const t = (now - t0) / 1000;
    items.forEach((it, i) => {
      const on = swinging && chosen.includes(i);
      // Pulled to the same angle and let go together; a little friction slowly takes the swing away.
      const angle = on ? it.amp * Math.exp(-t / 60) * Math.cos((2 * Math.PI * t) / it.period) : 0;
      it.arm.setAttribute('transform', `translate(${xs[i]} ${beamY}) rotate(${angle.toFixed(2)})`);
    });
    if (swinging) raf = requestAnimationFrame(draw);
  }
  function stop() {
    swinging = false;
    cancelAnimationFrame(raf);
    draw(performance.now());
  }
  function paint() {
    items.forEach((it, i) => {
      const on = chosen.includes(i);
      it.arm.classList.toggle('on', on);
      it.tag.classList.toggle('on', on);
      it.hit.setAttribute('aria-pressed', String(on));
    });
    go.disabled = chosen.length !== 2;
    go.textContent = swinging ? 'Stop them' : 'Let them go';
    if (chosen.length === 2) {
      const pair = chosen.map((i) => bobs[i].id).sort().join(' ');
      ctx.offer(pair, `${pair.replace(' ', ' and ')} swing together`);
    } else ctx.offer(null, 'Answer');
    note.textContent = chosen.length < 2 ? 'Tap two weights.' : swinging ? 'Watch them. Do they stay side by side?' : 'Now let them go, both at once.';
  }
  function pick(i) {
    stop();
    // A new pair: whatever was said about the last one no longer applies.
    ctx.say('');
    const at = chosen.indexOf(i);
    if (at >= 0) chosen.splice(at, 1);
    else {
      chosen.push(i);
      if (chosen.length > 2) chosen.shift();
    }
    ctx.tap();
    paint();
  }
  go.addEventListener('click', () => {
    if (swinging) {
      stop();
      paint();
      return;
    }
    if (chosen.length !== 2) return;
    // The swing is the puzzle, and the player starts it, so it moves even when motion is turned down.
    swinging = true;
    t0 = performance.now();
    ctx.tick();
    paint();
    raf = requestAnimationFrame(draw);
  });
  paint();
  return {
    node: el('div', { class: 'stage-pend' }, el('div', { class: 'pend-frame' }, svg), el('div', { class: 'pend-controls' }, go, note)),
    wrong: () => shake(svg),
    dispose: () => cancelAnimationFrame(raf),
  };
}

// =================================================================== the piano

const PC = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const midiOf = (n) => {
  const m = n.match(/^([A-G]#?)(\d)$/);
  return 12 * (Number(m[2]) + 1) + PC[m[1]];
};
const freqOf = (midi) => 440 * 2 ** ((midi - 69) / 12);
/** Where a note sits on a treble staff: 0 is the bottom line (E4), each step a line or a space. */
const stepOf = (n) => {
  const m = n.match(/^([A-G])#?(\d)$/);
  return 'CDEFGAB'.indexOf(m[1]) + 7 * Number(m[2]) - ('CDEFGAB'.indexOf('E') + 7 * 4);
};

export function piano(ctx) {
  const { notes = [], choices = [] } = ctx.spec;
  let at = 0;
  // The sheet: five lines, a clef, and the notes, the next one lit.
  const W = 320;
  const gap = 9;
  const base = 70;
  const yOf = (step) => base - step * (gap / 2);
  const sheet = sv('svg', { viewBox: `0 0 ${W} 100`, class: 'pn-sheet', role: 'img', 'aria-label': `A line of music: ${notes.length} notes` });
  for (let i = 0; i < 5; i++) sheet.append(sv('line', { x1: 8, y1: yOf(i * 2), x2: W - 8, y2: yOf(i * 2), class: 'pn-line' }));
  sheet.append(sv('path', { d: 'M28 80 C20 80 20 70 27 69 C34 68 33 82 26 83 C16 84 14 66 26 56 C34 49 34 38 30 30 C26 38 25 50 30 64 L33 86', class: 'pn-clef' }));
  const heads = notes.map((n, i) => {
    const x = 62 + i * ((W - 80) / notes.length);
    const s = stepOf(n);
    const y = yOf(s);
    const g = sv('g', { class: 'pn-note' }, sv('ellipse', { cx: x, cy: y, rx: 5.6, ry: 4.2, transform: `rotate(-20 ${x} ${y})`, class: 'pn-head' }), sv('line', { x1: s >= 4 ? x - 5 : x + 5, y1: y, x2: s >= 4 ? x - 5 : x + 5, y2: s >= 4 ? y + 26 : y - 26, class: 'pn-stem' }));
    if (n.includes('#')) {
      const t = sv('text', { x: x - 15, y: y + 4, class: 'pn-sharp' });
      t.textContent = '♯';
      g.append(t);
    }
    sheet.append(g);
    return g;
  });
  // The keys: G below to G above, black keys on top.
  const whites = ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
  const blacks = { G4: 'G#4', A4: 'A#4', C5: 'C#5', D5: 'D#5', F5: 'F#5' };
  const keys = new Map();
  const kb = el('div', { class: 'pn-keys' });
  let letters = false;
  whites.forEach((n, i) => {
    const w = el('button', { class: 'pn-white', type: 'button', 'aria-label': n.replace(/\d/, ''), dataset: { n } }, el('span', { class: 'pn-letter', text: n[0] }));
    w.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      play(n);
    });
    keys.set(n, w);
    kb.append(w);
    if (blacks[n] && i < whites.length - 1) {
      const bn = blacks[n];
      const b = el('button', { class: 'pn-black', type: 'button', 'aria-label': `${bn[0]} sharp`, style: { '--i': String(i) } });
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        play(bn);
      });
      keys.set(bn, b);
      kb.append(b);
    }
  });
  const toggle = el('button', { class: 'btn small quiet', type: 'button', text: 'Letters on the keys' });
  toggle.addEventListener('click', () => {
    letters = !letters;
    kb.classList.toggle('lettered', letters);
    toggle.textContent = letters ? 'Hide the letters' : 'Letters on the keys';
  });
  function light() {
    heads.forEach((h, i) => {
      h.classList.toggle('next', i === at);
      h.classList.toggle('done', i < at);
    });
  }
  function sound(n) {
    const k = keys.get(n);
    k?.classList.add('down');
    setTimeout(() => k?.classList.remove('down'), 180);
    ctx.game.audio.piano?.(freqOf(midiOf(n)));
  }
  async function play(n) {
    sound(n);
    if (at >= notes.length) return;
    if (n === notes[at]) {
      at += 1;
      light();
      if (at === notes.length) await finale();
    } else shake(heads[at]);
  }
  async function finale() {
    ctx.say('');
    await wait(still() ? 0 : 400);
    // The whole line, played back as it should sound.
    const beat = [0, 1, 1, 1, 1, 1, 1, 1, 1.6];
    for (let i = 0; i < notes.length; i++) {
      await wait(still() ? 0 : 230 * (beat[i] ?? 1));
      sound(notes[i]);
    }
    ctx.say('Now: what is it?');
    ctx.choices(choices);
  }
  light();
  ctx.offer(null, 'Play the line first');
  return { node: el('div', { class: 'stage-piano' }, el('div', { class: 'pn-stand' }, sheet), el('div', { class: 'pn-board' }, kb), toggle) };
}
