// More things to handle on the stage: puzzles that are not ciphers.
//
//   collar        a carrier's brass collar, punched in binary, and the exchange's dial to set
//   chart         the Engine's night log drawn as a chart, to read like a detective
//   instruments   five brass instruments to measure, one of them hers
//
// Same contract as stage-kinds.js: a builder gets the stage's ctx and returns
// { node, focus?, wrong?, right?, dock? }.

import { el } from './dom.js';
import { sv, wait, still, shake } from './stage-parts.js';

const mod = (a, n) => ((a % n) + n) % n;
const pad = (h) => String(mod(h, 24)).padStart(2, '0');

// =================================================================== the carrier's collar

/** A dial of twenty-four hours you turn with a finger: midnight at the top, noon at the bottom. */
function dial24({ at = 0, onChange, tick }) {
  const C = 120;
  let h = mod(at, 24);
  let rot = h * 15;
  const label = (n) => {
    const a = (n * 15 * Math.PI) / 180;
    const r = n % 6 === 0 ? 92 : 94;
    const t = sv('text', { x: C + r * Math.sin(a), y: C - r * Math.cos(a), class: `d24-n ${n % 6 === 0 ? 'major' : ''}`, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    t.textContent = String(n);
    return t;
  };
  const hand = sv('g', { class: 'd24-hand' }, sv('path', { d: `M${C - 5} ${C + 14} L${C} ${C - 74} L${C + 5} ${C + 14} Z`, class: 'd24-blade' }), sv('circle', { cx: C, cy: C, r: 9, class: 'd24-boss' }));
  const svg = sv(
    'svg',
    { viewBox: '0 0 240 240', class: 'd24', role: 'slider', tabindex: '0', 'aria-label': 'The hold-rack dial: the hour', 'aria-valuemin': '0', 'aria-valuemax': '23' },
    sv('circle', { cx: C, cy: C, r: 116, class: 'd24-rim' }),
    sv('circle', { cx: C, cy: C, r: 106, class: 'd24-face' }),
    Array.from({ length: 96 }, (_, i) => {
      const a = (i * 3.75 * Math.PI) / 180;
      const r1 = i % 4 === 0 ? 74 : 79;
      return sv('line', { x1: C + r1 * Math.sin(a), y1: C - r1 * Math.cos(a), x2: C + 84 * Math.sin(a), y2: C - 84 * Math.cos(a), class: i % 4 === 0 ? 'd24-tick hour' : 'd24-tick' });
    }),
    Array.from({ length: 24 }, (_, n) => label(n)),
    (() => {
      const t = sv('text', { x: C, y: C - 30, class: 'd24-cap', 'text-anchor': 'middle' });
      t.textContent = 'HOLD-RACK';
      return t;
    })(),
    hand,
  );
  const paint = (animate) => {
    hand.style.transition = animate ? '' : 'none';
    hand.style.transform = `rotate(${rot}deg)`;
    svg.setAttribute('aria-valuenow', String(h));
    svg.setAttribute('aria-valuetext', `${pad(h)}:00`);
  };
  const set = (n) => {
    const to = mod(n, 24);
    rot += mod(to * 15 - rot + 180, 360) - 180;
    const changed = to !== h;
    h = to;
    paint(true);
    if (changed) {
      tick?.();
      onChange(h);
    }
  };
  const angleAt = (e) => {
    const b = svg.getBoundingClientRect();
    return (Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))) * 180) / Math.PI;
  };
  let drag = false;
  svg.addEventListener('pointerdown', (e) => {
    drag = true;
    svg.setPointerCapture?.(e.pointerId);
    svg.focus({ preventScroll: true });
    e.preventDefault();
    move(e);
  });
  const move = (e) => {
    if (!drag) return;
    const a = mod(angleAt(e), 360);
    rot += mod(a - rot + 180, 360) - 180;
    hand.style.transition = 'none';
    hand.style.transform = `rotate(${rot}deg)`;
    const nh = mod(Math.round(a / 15), 24);
    if (nh !== h) {
      h = nh;
      tick?.();
      onChange(h);
    }
  };
  svg.addEventListener('pointermove', move);
  const end = () => {
    if (!drag) return;
    drag = false;
    set(h);
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(h + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(h - 1);
    else return;
    e.preventDefault();
  });
  paint(false);
  const back = el('button', { class: 'cw-step', type: 'button', 'aria-label': 'An hour earlier', text: '‹', onClick: () => set(h - 1) });
  const fwd = el('button', { class: 'cw-step', type: 'button', 'aria-label': 'An hour later', text: '›', onClick: () => set(h + 1) });
  return { node: el('div', { class: 'cw-wrap' }, back, svg, fwd), focus: () => svg.focus({ preventScroll: true }), get hour() { return h; } };
}

export function collar(ctx) {
  const rows = ctx.spec.rows ?? [];
  const band = el(
    'div',
    { class: 'collar-band', role: 'img', 'aria-label': `A brass collar with ${rows.length} rows of punched holes` },
    rows.map((r) =>
      el(
        'div',
        { class: 'collar-row' },
        el('span', { class: 'collar-label', text: r.label }),
        el('span', { class: 'collar-holes' }, [...r.holes].map((b) => el('span', { class: `hole ${b === '1' ? 'punched' : ''}` }))),
      ),
    ),
  );
  let touched = false;
  const dial = dial24({
    at: 0,
    tick: ctx.tick,
    onChange: (h) => {
      touched = true;
      ctx.offer(String(h), `Set the dial to ${pad(h)}:00`);
      ctx.say('');
    },
  });
  ctx.offer(null, 'Set the dial');
  void touched;
  return {
    node: el('div', { class: 'stage-collar' }, el('div', { class: 'collar-wrap' }, band), dial.node),
    focus: () => dial.focus(),
    wrong: () => shake(band),
    right: () => band.classList.add('glow'),
  };
}

// =================================================================== the night log, drawn as a chart

export function chart(ctx) {
  const { from = 18, hours = 12, rows = [] } = ctx.spec;
  const cols = Array.from({ length: hours }, (_, i) => mod(from + i, 24));
  const spanOf = (row, h) => row.busy.find(([a, b]) => h >= a && h < b) ?? null;
  const most = Math.max(...rows.flatMap((r) => r.busy.map((b) => b[2])));
  const readout = el('div', { class: 'chart-read', role: 'status', 'aria-live': 'polite', text: 'Tap a square, or an hour along the top.' });
  const cells = [];
  let picked = null;
  const show = (lines) => readout.replaceChildren(...lines.map((l) => el('div', { class: 'chart-line' }, l)));
  const grid = el('div', { class: 'chart-grid', style: { '--cols': String(hours) } });
  grid.append(el('span', { class: 'chart-corner', text: 'Fold Time' }));
  cols.forEach((h, ci) => {
    const head = el('button', { class: 'chart-hour', type: 'button', text: pad(h), 'aria-label': `${pad(h)}:00` });
    head.addEventListener('click', () => {
      ctx.tap();
      cells.forEach((c) => c.node.classList.toggle('col', c.ci === ci));
      const busy = rows.map((r) => [r, spanOf(r, h)]).filter(([, b]) => b);
      // Who was on at this hour, and on how many nights. What they asked for is not shown: the player reads the chart.
      show(busy.length ? [`${pad(h)}:00 to ${pad(h + 1)}:00`, ...busy.map(([r, b]) => `${r.name.padEnd(11, ' ')} ${String(b[2]).padStart(3, ' ')} nights`)] : [`${pad(h)}:00 to ${pad(h + 1)}:00`, 'Nobody.']);
    });
    grid.append(head);
  });
  rows.forEach((row) => {
    const name = el('button', { class: 'chart-name', type: 'button', text: row.name, 'aria-label': `Terminal ${row.name}` });
    name.addEventListener('click', () => {
      ctx.tick();
      picked = row.name;
      grid.querySelectorAll('.chart-name').forEach((n) => n.classList.toggle('on', n === name));
      ctx.offer(picked, `Answer: ${picked}`);
    });
    grid.append(name);
    cols.forEach((h, ci) => {
      const b = spanOf(row, h);
      const c = el('button', { class: `chart-cell ${b ? 'busy' : ''}`, type: 'button', style: { '--heat': String(b ? 0.18 + 0.82 * (b[2] / most) : 0) }, 'aria-label': `${row.name} at ${pad(h)}:00${b ? `: ${b[2]} nights` : ': none'}` });
      c.addEventListener('click', () => {
        ctx.tap();
        cells.forEach((x) => x.node.classList.remove('col', 'on'));
        c.classList.add('on');
        show(b ? [`${row.name} · ${pad(h)}:00 to ${pad(h + 1)}:00`, `Used on ${b[2]} nights since March`] : [`${row.name} · ${pad(h)}:00 to ${pad(h + 1)}:00`, 'Not used at this hour.']);
      });
      cells.push({ node: c, ci });
      grid.append(c);
    });
  });
  ctx.offer(null, 'Answer');
  return {
    node: el('div', { class: 'stage-chart' }, el('div', { class: 'chart-screen' }, el('div', { class: 'crt-top', text: 'ENGINE · USE BY TERMINAL AND HOUR · MARCH TO NOW' }), el('div', { class: 'chart-scroll' }, grid), readout)),
    wrong: () => shake(grid),
  };
}

// =================================================================== brass instruments to measure

const FRACTION = { 360: 'a whole circle', 180: 'half a circle', 90: 'a quarter of a circle', 60: 'a sixth of a circle', 45: 'an eighth of a circle' };

/** A brass instrument, drawn by how much of a circle its arc is. */
function instrument(arc) {
  const W = 120;
  const g = sv('g', { class: 'inst-art' });
  const R = 50;
  const cx = 60;
  if (arc === 360) {
    // An astrolabe: a whole circle with its ring to hang it by, an inner plate and a rule across it.
    const cy = 64;
    g.append(
      sv('circle', { cx, cy: 12, r: 6, class: 'brass-line' }),
      sv('circle', { cx, cy, r: R, class: 'brass' }),
      sv('circle', { cx, cy, r: R - 8, class: 'brass-dark' }),
      sv('circle', { cx, cy, r: 18, class: 'brass-line' }),
      sv('path', { d: `M${cx - R + 6} ${cy} H${cx + R - 6} M${cx} ${cy - R + 6} V${cy + R - 6}`, class: 'brass-line' }),
      sv('path', { d: `M${cx - 30} ${cy + 22} L${cx + 30} ${cy - 22}`, class: 'brass-rule' }),
      sv('circle', { cx, cy, r: 3, class: 'brass-pin' }),
    );
    return { g, W, H: 120, apex: [cx, 64], r: R };
  }
  // Every other one is a fan: its apex at the top, its arc at the bottom.
  const apex = [cx, arc === 180 ? 58 : 14];
  const r = arc === 180 ? R : 92;
  const a0 = 90 - arc / 2;
  const a1 = 90 + arc / 2;
  const pt = (a, rr = r) => [apex[0] + rr * Math.cos((a * Math.PI) / 180), apex[1] + rr * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1);
  const large = arc > 180 ? 1 : 0;
  g.append(sv('path', { d: `M${apex[0]} ${apex[1]} L${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`, class: arc === 45 ? 'wood' : 'brass' }));
  // Graduations along the arc.
  for (let a = a0; a <= a1 + 0.01; a += arc / 12) {
    const [p, q] = pt(a, r - 2);
    const [u, v] = pt(a, r - 9);
    g.append(sv('line', { x1: p, y1: q, x2: u, y2: v, class: 'brass-tick' }));
  }
  const [ix, iy] = pt(90 + arc / 5, r - 1);
  g.append(sv('line', { x1: apex[0], y1: apex[1], x2: ix, y2: iy, class: 'brass-rule' }), sv('circle', { cx: apex[0], cy: apex[1], r: 3.2, class: 'brass-pin' }));
  if (arc === 60 || arc === 45) {
    // Mirrors and a sighting tube near the apex: the two-mirror instruments.
    g.append(sv('rect', { x: apex[0] - 3, y: apex[1] + 6, width: 6, height: 12, class: 'glass' }), sv('rect', { x: apex[0] - 22, y: apex[1] + 24, width: 16, height: 6, rx: 2, class: 'brass-dark' }));
  }
  if (arc === 90) {
    // A plumb line hanging from the apex.
    g.append(sv('path', { d: `M${apex[0]} ${apex[1]} L${apex[0] + 10} ${apex[1] + 62}`, class: 'plumb' }), sv('circle', { cx: apex[0] + 10, cy: apex[1] + 64, r: 3.5, class: 'brass-pin' }));
  }
  if (arc === 180) {
    // A half circle with sight vanes at both ends of its straight edge.
    g.append(sv('rect', { x: x0 - 3, y: y0 - 10, width: 4, height: 10, class: 'brass-dark' }), sv('rect', { x: x1 - 1, y: y1 - 10, width: 4, height: 10, class: 'brass-dark' }));
  }
  return { g, W, H: 120, apex, r };
}

export function instruments(ctx) {
  const arcs = ctx.spec.arcs ?? [];
  const bench = el('div', { class: 'inst-bench', 'aria-live': 'polite' });
  const read = el('div', { class: 'inst-read', text: 'Tap an instrument to measure its arc.' });
  let measuring = 0;
  async function measure(arc, btn) {
    const token = ++measuring;
    ctx.tap();
    tray.querySelectorAll('.inst').forEach((b) => b.classList.toggle('on', b === btn));
    const art = instrument(arc);
    // The protractor's sweep: an arc drawn out from one edge of the instrument to the other.
    const [ax, ay] = art.apex;
    const rr = art.r + 10;
    const start = arc === 360 ? -90 : 90 - arc / 2;
    const end = arc === 360 ? 269.9 : 90 + arc / 2;
    const p = (a) => [ax + rr * Math.cos((a * Math.PI) / 180), ay + rr * Math.sin((a * Math.PI) / 180)];
    const [sx, sy] = p(start);
    const [ex, ey] = p(end);
    const sweep = sv('path', { d: `M${sx} ${sy} A${rr} ${rr} 0 ${end - start > 180 ? 1 : 0} 1 ${ex} ${ey}`, class: 'inst-sweep', pathLength: '100' });
    const svg = sv('svg', { viewBox: `-14 -10 ${art.W + 28} ${art.H + 30}`, class: 'inst-big', role: 'img', 'aria-label': 'The instrument, measured' }, art.g, sweep);
    const deg = el('div', { class: 'inst-deg', text: '0°' });
    const frac = el('div', { class: 'inst-frac', text: '' });
    bench.replaceChildren(svg, el('div', { class: 'inst-figures' }, deg, frac));
    read.textContent = '';
    const steps = still() ? 1 : 24;
    for (let i = 1; i <= steps; i++) {
      if (token !== measuring) return;
      deg.textContent = `${Math.round((arc * i) / steps)}°`;
      if (i % 4 === 0) ctx.tick();
      await wait(still() ? 0 : 28);
    }
    frac.textContent = FRACTION[arc] ?? '';
  }
  const tray = el(
    'div',
    { class: 'inst-tray' },
    arcs.map((arc, i) => {
      const art = instrument(arc);
      const btn = el('button', { class: 'inst', type: 'button', 'aria-label': `Instrument ${i + 1}` }, sv('svg', { viewBox: `-6 -4 ${art.W + 12} ${art.H + 10}`, class: 'inst-svg' }, art.g), el('span', { class: 'inst-n', text: String(i + 1) }));
      btn.addEventListener('click', () => measure(arc, btn));
      return btn;
    }),
  );
  return { node: el('div', { class: 'stage-inst' }, el('div', { class: 'inst-sheet' }, tray), bench, read) };
}
