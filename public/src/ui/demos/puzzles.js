// How-tos for the puzzle lessons: magic squares, the bridges of Königsberg, the fifteen puzzle,
// the river crossing, logic grids, the smothered mate, guess-the-word games, pegs for dates,
// reading music, foxglove and the pneumatic post. Same contract as core.js.
//
// Every example here is made up for the lesson. None of them is a puzzle in the game, and
// none of them gives away a puzzle's answer.

/** @typedef {any} Kit */

/**
 * A sound at this point of the timeline (or at `at`). It is heard when the step plays, and
 * kept quiet when the player jumps to the end of a step, which would sound every note at once.
 */
function sound(tl, play, at = tl.duration()) {
  tl.call(
    () => {
      if (!tl.paused() && tl.time() - at < 0.25) play();
    },
    undefined,
    at,
  );
}

/** Make an svg shape a button for a finger. */
function tap(node, label, fn) {
  node.style.cursor = 'pointer';
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', label);
  node.addEventListener('click', fn);
  return node;
}

/** The point at t on the curve from a, pulled towards c, to b. */
const quad = (a, c, b, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];

/** A smooth path through the points. */
function smooth(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Wrap a number into 1..top. */
const wrap = (n, top) => ((((n - 1) % top) + top) % top) + 1;

// Shared colours.
const TILE = '#efe3c6';
const TILE_EDGE = '#b49863';
const CREAM = '#fbf6ea';
const SAND = '#e9dfc4';
const WATER = '#d3e3e8';
const BROWN = '#8a5a2e';
const GOLD = '#c9a227';
const GREY = '#8b8b86';
const BRASS_PLATE = '#d9b46a';
const BRASS_EDGE = '#7a5a23';

// A treble clef, drawn as one stroke around the G line (y 72 on a staff from 36 to 84).
const CLEF = [[35, 71], [39, 67], [35, 63], [28, 66], [26, 74], [31, 81], [39, 82], [45, 76], [45, 66], [40, 57], [33, 48], [29, 39], [30, 29], [35, 22], [39, 25], [38, 33], [33, 42], [32, 60], [34, 80], [35, 94], [32, 100], [27, 100], [26, 95]];
// The notes from C below the staff to F on its top line, and how fast each one vibrates.
const NOTE_NAMES = 'CDEFGABCDEF';
const NOTE_HZ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46];

export const PUZZLES = {
  // ------------------------------------------------------------------ magic squares
  magic(k) {
    const { svg, T, R, L, G, COL } = k;
    const g = 40;
    const x0 = 100;
    const y0 = 16;
    const SQ = [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6],
    ];
    const cx = (c) => x0 + c * g + g / 2;
    const cy = (r) => y0 + r * g + g / 2;
    const cells = G({});
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.append(R(x0 + c * g, y0 + r * g, g, g, { f: CREAM, s: COL.ink, r: 0 }));
    const bands = G({});
    const nums = SQ.map((row, r) => row.map((n, c) => T(cx(c), cy(r) + 8, String(n), { c: 'd', z: 22, w: 600 })));
    const total = (x, y, f = COL.brass) => T(x, y, '', { z: 15, w: 700, f });
    const rowT = [0, 1, 2].map((r) => total(x0 + 3 * g + 22, cy(r) + 5));
    const colT = [0, 1, 2].map((c) => total(cx(c), y0 + 3 * g + 22));
    const diagT = [total(x0 + 3 * g + 22, y0 + 3 * g + 22, COL.green), total(x0 - 22, y0 + 3 * g + 22, COL.green)];
    const sum = T(160, 187, '', { z: 15, w: 700, f: COL.green });
    svg.append(cells, bands, ...nums.flat(), ...rowT, ...colT, ...diagT, sum);
    k.hide(nums.flat());
    const shade = 'rgba(168,105,28,0.2)';
    const rowBand = (r) => R(x0 + 4, y0 + r * g + 4, 3 * g - 8, g - 8, { f: shade, s: 'none', r: 8 });
    const colBand = (c) => R(x0 + c * g + 4, y0 + 4, g - 8, 3 * g - 8, { f: shade, s: 'none', r: 8 });
    /** Count a total up to 15. */
    const countUp = (tl, node, duration) => {
      const o = { v: 0 };
      tl.to(o, { v: 15, duration, ease: 'power1.out', onUpdate: () => (node.textContent = String(Math.round(o.v))) });
    };
    /** Light a line, count its total, and put the light away. */
    const sweep = (tl, band, node) => {
      bands.append(band);
      k.hide(band);
      tl.to(band, { opacity: 1, duration: 0.08 });
      countUp(tl, node, 0.26);
      tl.to(band, { opacity: 0, duration: 0.08 });
    };
    return {
      steps: [
        {
          say: 'Nine numbers, 1 to 9, in a three-by-three square.',
          run: (tl) => {
            const order = [];
            SQ.forEach((row, r) => row.forEach((n, c) => (order[n - 1] = nums[r][c])));
            tl.fromTo(order, { opacity: 0, scale: 0.3, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.3, stagger: 0.14, ease: 'back.out(2.2)' });
          },
        },
        {
          say: 'Add up the top row: 4 + 9 + 2 = 15.',
          run: (tl) => {
            const band = rowBand(0);
            bands.append(band);
            k.hide(band);
            tl.to(band, { opacity: 1, duration: 0.3 });
            let run = 0;
            SQ[0].forEach((n, c) => {
              run += n;
              const shown = String(run);
              const text = SQ[0].slice(0, c + 1).join(' + ');
              tl.to(nums[0][c], { scale: 1.3, transformOrigin: '50% 50%', duration: 0.18 })
                .call(() => {
                  rowT[0].textContent = shown;
                  sum.textContent = text;
                })
                .to(nums[0][c], { scale: 1, duration: 0.25 });
            });
            tl.call(() => (sum.textContent = '4 + 9 + 2 = 15'))
              .to(rowT[0], { scale: 1.4, transformOrigin: '50% 50%', duration: 0.15 })
              .to(rowT[0], { scale: 1, duration: 0.25 });
          },
        },
        {
          say: 'Every row makes 15, and so does every column.',
          run: (tl) => {
            tl.to([...bands.children, sum], { opacity: 0, duration: 0.2 });
            sweep(tl, rowBand(1), rowT[1]);
            sweep(tl, rowBand(2), rowT[2]);
            [0, 1, 2].forEach((c) => sweep(tl, colBand(c), colT[c]));
          },
        },
        {
          say: 'Both long diagonals make 15 too.',
          run: (tl) => {
            const a = L(x0 + 12, y0 + 12, x0 + 3 * g - 12, y0 + 3 * g - 12, { s: 'rgba(47,122,82,0.22)', w: 18 });
            const b = L(x0 + 3 * g - 12, y0 + 12, x0 + 12, y0 + 3 * g - 12, { s: 'rgba(47,122,82,0.22)', w: 18 });
            bands.append(a, b);
            k.undraw(a);
            k.undraw(b);
            tl.to(a, { strokeDashoffset: 0, duration: 0.55, ease: 'power1.inOut' });
            countUp(tl, diagT[0], 0.35);
            tl.to(b, { strokeDashoffset: 0, duration: 0.55, ease: 'power1.inOut' });
            countUp(tl, diagT[1], 0.35);
          },
        },
        {
          say: 'For a missing number, take the other two from 15.',
          run: (tl) => {
            const old = [...bands.children];
            const q = T(cx(2), cy(2) + 8, '?', { c: 'd', z: 22, w: 700, f: COL.brass });
            const band = rowBand(2);
            bands.append(band);
            svg.append(q);
            k.hide(q, band);
            tl.to(old, { opacity: 0, duration: 0.25 })
              .to(nums[2][2], { opacity: 0, duration: 0.3 })
              .to(q, { opacity: 1, duration: 0.3 })
              .to(band, { opacity: 1, duration: 0.25 })
              .call(() => (sum.textContent = '15 − 8 − 1 = 6'))
              .to(sum, { opacity: 1, duration: 0.3 })
              .to(q, { opacity: 0, duration: 0.2 }, '+=0.5')
              .call(() => nums[2][2].setAttribute('fill', COL.green))
              .to(nums[2][2], { opacity: 1, duration: 0.3 });
          },
        },
      ],
      tryIt: {
        say: 'Your turn: fill the gaps so every line adds up the same.',
        mount(host, k2) {
          const { card, T: t, R: r, L: l, COL: col, el } = k2;
          // Two squares: the first adds up to 15; the second uses 2 to 10, so its total is found by adding a full line.
          const ROUNDS = [
            {
              sq: [
                [2, 7, 6],
                [9, 5, 1],
                [4, 3, 8],
              ],
              gaps: [
                [0, 1],
                [2, 2],
              ],
              top: 9,
              ask: 'Fill the two gaps. Every line must make 15.',
            },
            {
              sq: [
                [9, 2, 7],
                [4, 6, 8],
                [5, 10, 3],
              ],
              gaps: [
                [1, 1],
                [2, 1],
              ],
              top: 12,
              ask: 'This one uses 2 to 10. Add up a full line first.',
            },
          ];
          const g = 40;
          const x0 = 100;
          const y0 = 12;
          const ccx = (c) => x0 + c * g + g / 2;
          const ccy = (rr) => y0 + rr * g + g / 2;
          const { svg: pic } = card(320, 170);
          pic.classList.add('demo-svg');
          const ask = el('div', { class: 'demo-goal' });
          const note = el('div', { class: 'demo-note' });
          let round = 0;
          let vals = [null, null];
          let done = false;
          let timer = 0;
          const cells = [];
          for (let rr = 0; rr < 3; rr++) {
            for (let c = 0; c < 3; c++) {
              const box = r(x0 + c * g, y0 + rr * g, g, g, { f: CREAM, s: col.ink, r: 0 });
              const text = t(ccx(c), ccy(rr) + 7, '', { z: 20, w: 700 });
              const tag = t(x0 + c * g + 4, y0 + rr * g + 12, '', { c: 'u', z: 10, w: 700, f: col.brass, a: 'start' });
              const hit = r(x0 + c * g, y0 + rr * g, g, g, { f: 'transparent', s: 'none' });
              pic.append(box, text, tag, hit);
              const cell = { rr, c, box, text, tag, hit };
              cells.push(cell);
              hit.addEventListener('click', () => {
                const i = gapAt(rr, c);
                if (i < 0 || done) return;
                vals[i] = vals[i] === null ? 1 : wrap(vals[i] + 1, ROUNDS[round].top);
                k2.audio?.tick?.();
                draw();
              });
            }
          }
          // Faint pointers from the corners to the diagonal totals.
          pic.append(l(x0 + 3 * g + 2, y0 + 3 * g + 2, x0 + 3 * g + 10, y0 + 3 * g + 10, { s: col.faint, w: 1 }), l(x0 - 2, y0 + 3 * g + 2, x0 - 10, y0 + 3 * g + 10, { s: col.faint, w: 1 }));
          const LINES = [
            ...[0, 1, 2].map((rr) => ({ cells: [[rr, 0], [rr, 1], [rr, 2]], x: x0 + 3 * g + 22, y: ccy(rr) + 5 })),
            ...[0, 1, 2].map((c) => ({ cells: [[0, c], [1, c], [2, c]], x: ccx(c), y: y0 + 3 * g + 22 })),
            { cells: [[0, 0], [1, 1], [2, 2]], x: x0 + 3 * g + 22, y: y0 + 3 * g + 22 },
            { cells: [[0, 2], [1, 1], [2, 0]], x: x0 - 22, y: y0 + 3 * g + 22 },
          ];
          for (const ln of LINES) pic.append((ln.node = t(ln.x, ln.y, '', { z: 15, w: 700 })));
          const gapAt = (rr, c) => ROUNDS[round].gaps.findIndex(([a, b]) => a === rr && b === c);
          const value = (rr, c) => {
            const i = gapAt(rr, c);
            return i < 0 ? ROUNDS[round].sq[rr][c] : vals[i];
          };
          const groups = [0, 1].map((i) => {
            const name = 'AB'[i];
            const minus = el('button', { class: 'demo-ibtn', type: 'button', 'aria-label': `Gap ${name}: one less`, text: '−' });
            const num = el('b', { class: 'demo-num', text: '?' });
            const plus = el('button', { class: 'demo-ibtn', type: 'button', 'aria-label': `Gap ${name}: one more`, text: '+' });
            const change = (d) => {
              if (done) return;
              const top = ROUNDS[round].top;
              vals[i] = vals[i] === null ? (d > 0 ? 1 : top) : Math.min(top, Math.max(1, vals[i] + d));
              k2.audio?.tick?.();
              draw();
            };
            minus.addEventListener('click', () => change(-1));
            plus.addEventListener('click', () => change(1));
            return { box: el('div', { class: 'demo-group' }, el('span', { class: 'demo-tag', text: name }), minus, num, plus), num };
          });
          const draw = () => {
            const R0 = ROUNDS[round];
            const target = R0.sq[0].reduce((a, b) => a + b, 0);
            for (const cell of cells) {
              const i = gapAt(cell.rr, cell.c);
              const v = value(cell.rr, cell.c);
              cell.text.textContent = v === null ? '?' : String(v);
              cell.text.setAttribute('fill', i < 0 ? col.ink : col.brass);
              cell.box.setAttribute('fill', i < 0 ? CREAM : '#f1dfb6');
              cell.tag.textContent = i < 0 ? '' : 'AB'[i];
              cell.hit.style.cursor = i < 0 ? '' : 'pointer';
            }
            groups.forEach((gr, i) => (gr.num.textContent = vals[i] === null ? '?' : String(vals[i])));
            let all = true;
            for (const ln of LINES) {
              const vs = ln.cells.map(([a, b]) => value(a, b));
              if (vs.includes(null)) {
                ln.node.textContent = '?';
                ln.node.setAttribute('fill', col.faint);
                all = false;
                continue;
              }
              const s = vs.reduce((a, b) => a + b, 0);
              ln.node.textContent = String(s);
              ln.node.setAttribute('fill', s === target ? col.green : col.red);
              if (s !== target) all = false;
            }
            if (all && !done) {
              done = true;
              note.textContent = round === 0 ? 'Magic! Every line makes 15.' : `Magic again! Every line makes ${target}.`;
              if (round === 0) {
                timer = setTimeout(() => {
                  round = 1;
                  vals = [null, null];
                  done = false;
                  note.textContent = '';
                  ask.textContent = ROUNDS[1].ask;
                  draw();
                }, 1800);
              }
            }
          };
          ask.textContent = ROUNDS[0].ask;
          host.append(ask, pic, el('div', { class: 'demo-controls wrap' }, groups.map((gr) => gr.box)), note);
          draw();
          return () => {
            clearTimeout(timer);
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the bridges of Königsberg
  bridges(k) {
    const { svg, T, C, P, G, R, s, COL } = k;
    // Two banks, an island, and a second island to the east. Seven bridges.
    const N = { t: [160, 32], b: [160, 168], i: [84, 100], e: [248, 100] };
    const BR = [
      ['t', 'i', 0.6],
      ['t', 'i', -0.6],
      ['b', 'i', -0.6],
      ['b', 'i', 0.6],
      ['t', 'e', 0],
      ['b', 'e', 0],
      ['i', 'e', 0],
    ];
    const ctrl = ([a, b, bend]) => [(N[a][0] + N[b][0]) / 2 + bend * (N[b][1] - N[a][1]) * 0.25, (N[a][1] + N[b][1]) / 2 - bend * (N[b][0] - N[a][0]) * 0.25];
    const at = (br, u) => quad(N[br[0]], ctrl(br), N[br[1]], u);
    /** A point on a bridge just outside the circle at one end. */
    const near = (br, end) => {
      const o = N[br[end ? 1 : 0]];
      for (let u = 0; u <= 1; u += 0.01) {
        const p = at(br, end ? 1 - u : u);
        if (Math.hypot(p[0] - o[0], p[1] - o[1]) >= 23) return p;
      }
      return o;
    };
    svg.append(
      R(0, 0, 320, 200, { f: SAND, s: 'none', r: 0 }),
      P('M0 60 C60 52 120 70 180 62 C230 56 280 54 320 62 L320 138 C270 146 220 132 160 140 C100 148 50 132 0 140 Z', { f: WATER, s: 'none' }),
      s('ellipse', { cx: 84, cy: 100, rx: 52, ry: 25, fill: SAND }),
      s('ellipse', { cx: 248, cy: 100, rx: 46, ry: 23, fill: SAND }),
    );
    const label = (x, y, text) => T(x, y, text, { c: 'u', z: 10.5, f: COL.faint, a: 'start' });
    svg.append(label(182, 30, 'bank'), label(182, 177, 'bank'), label(24, 104, 'island'), label(272, 104, 'island'));
    const paths = BR.map((br) => {
      const [x1, y1] = N[br[0]];
      const [x2, y2] = N[br[1]];
      const [mx, my] = ctrl(br);
      return P(`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`, { s: BROWN, w: 3 });
    });
    const tallies = G({});
    const tallyOf = [];
    const places = {};
    for (const key of Object.keys(N)) {
      const ring = C(N[key][0], N[key][1], 15, { f: CREAM, s: COL.ink, w: 1.4 });
      const num = T(N[key][0], N[key][1] + 5.5, '', { z: 15, w: 800 });
      places[key] = { ring, num, g: G({}, ring, num) };
    }
    const walker = C(N.t[0], N.t[1], 6.5, { f: COL.brass, s: COL.ink, w: 1.2 });
    const all = Object.values(places);
    svg.append(G({}, paths), tallies, ...all.map((p) => p.g), walker);
    paths.forEach((p) => k.undraw(p));
    k.hide(all.map((p) => p.g), walker);
    return {
      steps: [
        {
          say: 'Four pieces of land, joined by seven bridges.',
          run: (tl) =>
            tl
              .fromTo(
                all.map((p) => p.g),
                { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' },
                { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.3, stagger: 0.1, ease: 'back.out(2)' },
              )
              .to(paths, { strokeDashoffset: 0, duration: 0.45, stagger: 0.16, ease: 'power1.inOut' }),
        },
        {
          say: 'Count the bridges that touch each place.',
          run: (tl) => {
            const n = { t: 0, b: 0, i: 0, e: 0 };
            BR.forEach((br, j) => {
              const dots = [near(br, 0), near(br, 1)].map(([x, y]) => C(x, y, 3.4, { f: COL.brass, s: 'none' }));
              tallies.append(...dots);
              tallyOf[j] = dots;
              k.hide(dots);
              n[br[0]] += 1;
              n[br[1]] += 1;
              const a = String(n[br[0]]);
              const b = String(n[br[1]]);
              tl.to(paths[j], { attr: { stroke: '#d9962c' }, duration: 0.1 })
                .to(dots, { opacity: 1, duration: 0.1 }, '<')
                .call(() => {
                  places[br[0]].num.textContent = a;
                  places[br[1]].num.textContent = b;
                })
                .to(paths[j], { attr: { stroke: BROWN }, duration: 0.14 }, '+=0.08');
            });
          },
        },
        {
          say: 'All four are odd, so no walk crosses each bridge once.',
          run: (tl) =>
            tl
              .to(
                all.map((p) => p.num),
                { attr: { fill: COL.red }, duration: 0.25 },
              )
              .to(
                all.map((p) => p.ring),
                { attr: { stroke: COL.red }, duration: 0.25 },
                '<',
              )
              .to(
                all.map((p) => p.g),
                { scale: 1.2, transformOrigin: '50% 50%', duration: 0.16, stagger: 0.12, yoyo: true, repeat: 1 },
              ),
        },
        {
          say: 'Take one bridge away: now only two are odd.',
          run: (tl) => {
            const [mx, my] = at(BR[6], 0.5);
            const cross = P(`M${mx - 7} ${my - 7} L${mx + 7} ${my + 7} M${mx + 7} ${my - 7} L${mx - 7} ${my + 7}`, { s: COL.red, w: 3 });
            svg.append(cross);
            k.hide(cross);
            tl.to(cross, { opacity: 1, duration: 0.25 })
              .to([paths[6], ...tallyOf[6], cross], { opacity: 0, duration: 0.45 }, '+=0.3')
              .call(() => {
                places.i.num.textContent = '4';
                places.e.num.textContent = '2';
              })
              .to([places.i.num, places.e.num], { attr: { fill: COL.green }, duration: 0.25 })
              .to([places.i.ring, places.e.ring], { attr: { stroke: COL.green }, duration: 0.25 }, '<')
              .to([places.t.g, places.b.g], { scale: 1.22, transformOrigin: '50% 50%', duration: 0.2, yoyo: true, repeat: 1 });
          },
        },
        {
          say: 'Start at one odd place and finish at the other.',
          run: (tl) => {
            // Over the island and back, round by the east, then over the island again.
            const legs = [
              [0, 't'],
              [1, 'i'],
              [4, 't'],
              [5, 'e'],
              [2, 'b'],
              [3, 'i'],
            ];
            tl.to(walker, { opacity: 1, duration: 0.2 }).to(places.t.g, { scale: 1.2, transformOrigin: '50% 50%', duration: 0.12, yoyo: true, repeat: 1 }, '<');
            for (const [j, from] of legs) {
              const br = BR[j];
              const fwd = from === br[0];
              const o = { u: 0 };
              tl.to(o, {
                u: 1,
                duration: 0.3,
                ease: 'power1.inOut',
                onUpdate: () => {
                  const [x, y] = at(br, fwd ? o.u : 1 - o.u);
                  walker.setAttribute('cx', String(x));
                  walker.setAttribute('cy', String(y));
                },
              }).to(paths[j], { attr: { stroke: COL.green }, duration: 0.15 }, '-=0.15');
            }
            // Home on the far bank: step aside so its count shows.
            tl.to(walker, { opacity: 0, duration: 0.2 }).to(places.b.g, { scale: 1.2, transformOrigin: '50% 50%', duration: 0.12, yoyo: true, repeat: 1 }, '<');
          },
        },
      ],
      tryIt: {
        say: 'Your turn: cross every bridge, each one just once.',
        mount(host, k2) {
          const { card, T: t, C: c, P: p, R: r, COL: col, el, gsap: gs } = k2;
          const { svg: pic } = card(320, 196);
          pic.classList.add('demo-svg');
          // Five places and seven bridges: two places are odd.
          const PL = { A: [64, 40], B: [256, 40], C: [160, 98], D: [64, 156], E: [256, 156] };
          const BRS = [
            ['A', 'B', 0.1],
            ['A', 'C', 0.12],
            ['C', 'B', 0.12],
            ['C', 'D', 0.12],
            ['E', 'C', 0.12],
            ['D', 'E', -0.1],
            ['A', 'D', -0.1],
          ];
          const ctl = ([a, b, bend]) => [(PL[a][0] + PL[b][0]) / 2 + bend * (PL[b][1] - PL[a][1]) * 0.25, (PL[a][1] + PL[b][1]) / 2 - bend * (PL[b][0] - PL[a][0]) * 0.25];
          const curve = (br) => `M${PL[br[0]][0]} ${PL[br[0]][1]} Q${ctl(br).join(' ')} ${PL[br[1]][0]} ${PL[br[1]][1]}`;
          pic.append(r(0, 0, 320, 196, { f: WATER, s: 'none', r: 0 }));
          const paths = BRS.map((br) => p(curve(br), { s: BROWN, w: 4 }));
          const hits = BRS.map((br, j) => tap(p(curve(br), { s: 'transparent', w: 22 }), `Bridge ${j + 1}`, () => cross(j)));
          pic.append(...paths, ...hits);
          const degree = (name) => BRS.filter((br) => br[0] === name || br[1] === name).length;
          const SIDE = { A: [-30, 4, 'end'], B: [30, 4, 'start'], C: [0, 40, 'middle'], D: [-30, 4, 'end'], E: [30, 4, 'start'] };
          for (const [name, [x, y]] of Object.entries(PL)) {
            const d = degree(name);
            const f = d % 2 ? col.red : col.green;
            const [dx, dy, a] = SIDE[name];
            pic.append(
              c(x, y, 19, { f: SAND, s: col.ink, w: 1.4 }),
              t(x, y + 6, String(d), { z: 17, w: 800, f }),
              t(x + dx, y + dy, d % 2 ? 'odd' : 'even', { c: 'u', z: 11, w: 700, f, a }),
              tap(c(x, y, 22, { f: 'transparent', s: 'none' }), `A place with ${d} bridges`, () => pick(name)),
            );
          }
          // A ring marks where you stand; a token runs along a bridge as you cross it.
          const ring = c(0, 0, 25, { s: col.brass, w: 3 });
          const walker = c(0, 0, 6.5, { f: col.brass, s: col.ink, w: 1.2 });
          ring.style.pointerEvents = 'none';
          walker.style.pointerEvents = 'none';
          pic.append(ring, walker);
          const ask = el('div', { class: 'demo-goal' });
          const note = el('div', { class: 'demo-note' });
          const again = el('button', { class: 'demo-ibtn', type: 'button', text: 'Start again' });
          let here = null;
          let over = false;
          let moving = null;
          const used = new Set();
          const put = (node, [x, y]) => {
            node.setAttribute('cx', String(x));
            node.setAttribute('cy', String(y));
          };
          const show = (node, on) => node.setAttribute('opacity', on ? '1' : '0');
          // A tap while the token is still on a bridge lands it at once.
          const settle = () => moving?.progress(1);
          const reset = () => {
            moving?.kill();
            moving = null;
            here = null;
            over = false;
            used.clear();
            gs.killTweensOf(paths);
            paths.forEach((path) => {
              path.setAttribute('stroke', BROWN);
              path.removeAttribute('stroke-dasharray');
            });
            show(ring, false);
            show(walker, false);
            ask.textContent = 'Tap the place you want to start from.';
            note.textContent = '';
          };
          const pick = (name) => {
            settle();
            if (over) return;
            k2.audio?.tick?.();
            if (used.size) {
              ask.textContent = 'Now tap a bridge to cross it.';
              return;
            }
            here = name;
            put(ring, PL[name]);
            show(ring, true);
            ask.textContent = 'Now tap the bridges, one after another.';
          };
          const flash = (j) => gs.fromTo(paths[j], { attr: { stroke: col.red } }, { attr: { stroke: used.has(j) ? col.green : BROWN }, duration: 0.6 });
          const cross = (j) => {
            settle();
            if (over) return;
            k2.audio?.tick?.();
            const br = BRS[j];
            if (here === null) {
              ask.textContent = 'First tap a place to start from.';
              return;
            }
            if (used.has(j)) {
              ask.textContent = 'You have crossed that one already.';
              flash(j);
              return;
            }
            if (br[0] !== here && br[1] !== here) {
              ask.textContent = 'That bridge does not touch where you are.';
              flash(j);
              return;
            }
            const fwd = br[0] === here;
            const o = { u: 0 };
            used.add(j);
            here = fwd ? br[1] : br[0];
            show(ring, false);
            show(walker, true);
            moving = gs.to(o, {
              u: 1,
              duration: 0.45,
              ease: 'power1.inOut',
              onUpdate: () => put(walker, quad(PL[br[0]], ctl(br), PL[br[1]], fwd ? o.u : 1 - o.u)),
              onComplete: () => {
                moving = null;
                show(walker, false);
                put(ring, PL[here]);
                show(ring, true);
                paths[j].setAttribute('stroke', col.green);
                paths[j].setAttribute('stroke-dasharray', '7 5');
                if (used.size === BRS.length) {
                  over = true;
                  ask.textContent = 'Every bridge, once each!';
                  note.textContent = 'You started at one odd place and finished at the other.';
                } else if (!BRS.some((b2, i) => !used.has(i) && (b2[0] === here || b2[1] === here))) {
                  over = true;
                  ask.textContent = 'Stuck: no bridge left from here. Try starting at an odd place.';
                } else ask.textContent = `${BRS.length - used.size} bridges to go.`;
              },
            });
          };
          again.addEventListener('click', () => {
            k2.audio?.tick?.();
            reset();
          });
          host.append(ask, pic, el('div', { class: 'demo-controls' }, again), note);
          reset();
          return () => {
            moving?.kill();
            gs.killTweensOf(paths);
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the fifteen puzzle
  fifteen(k) {
    const { svg, T, R, P, G, COL, gsap } = k;
    const g = 36;
    const x0 = 52;
    const y0 = 14;
    const pos = (r, c) => ({ x: x0 + c * g, y: y0 + r * g });
    svg.append(R(x0 - 6, y0 - 6, 3 * g + 12, 3 * g + 12, { f: COL.wood, s: 'none', r: 8 }), R(x0, y0, 3 * g, 3 * g, { f: '#5b3f26', s: 'none', r: 3 }));
    const tiles = {};
    [
      [1, 2, 3],
      [4, 0, 5],
      [7, 8, 6],
    ].forEach((row, r) =>
      row.forEach((n, c) => {
        if (!n) return;
        const tile = G({}, R(1.5, 1.5, g - 3, g - 3, { f: TILE, s: TILE_EDGE, r: 4 }), T(g / 2, g / 2 + 6, String(n), { c: 'd', z: 17, w: 700 }));
        gsap.set(tile, pos(r, c));
        tiles[n] = tile;
        svg.append(tile);
      }),
    );
    const lineX = (i) => 48 + i * 32;
    const lineY = 166;
    const line = [];
    const count = T(160, 189, '', { c: 'u', z: 12.5, w: 700, f: COL.red });
    const ask = T(240, 82, '?', { c: 'd', z: 34, w: 700, f: COL.brass });
    const verdict = [
      T(240, 34, 'this tray', { c: 'u', z: 11, f: COL.faint }),
      T(240, 56, 'odd', { c: 'u', z: 19, w: 700, f: COL.red }),
      T(240, 80, '≠', { z: 20, w: 700, f: COL.red }),
      T(240, 102, 'solved', { c: 'u', z: 11, f: COL.faint }),
      T(240, 124, 'even', { c: 'u', z: 19, w: 700, f: COL.green }),
    ];
    svg.append(count, ask, ...verdict);
    k.hide(count, ask, verdict);
    const slide = (tl, n, r, c, at) => {
      tl.to(tiles[n], { ...pos(r, c), duration: 0.38, ease: 'power2.inOut' }, at);
      sound(tl, () => k.audio?.tick?.());
    };
    return {
      steps: [
        {
          say: 'Slide a tile into the gap, one at a time.',
          run: (tl) => {
            slide(tl, 5, 1, 1);
            slide(tl, 6, 1, 2, '+=0.25');
            const faces = Object.values(tiles).map((tile) => tile.firstChild);
            tl.to(faces, { attr: { fill: '#d5ebd8' }, duration: 0.2, stagger: 0.03 }, '+=0.1').to(faces, { attr: { fill: TILE }, duration: 0.3 });
          },
        },
        {
          say: 'Swap 2 and 3 by hand: can sliding ever put it right?',
          run: (tl) => {
            const a = tiles[2];
            const b = tiles[3];
            svg.append(a); // carried over the top of the other
            tl.to(a, { y: y0 - 12, scale: 1.08, transformOrigin: '50% 50%', duration: 0.25 })
              .to(a, { x: pos(0, 2).x, duration: 0.55, ease: 'power2.inOut' })
              .to(b, { x: pos(0, 1).x, duration: 0.55, ease: 'power2.inOut' }, '<')
              .to(a, { y: y0, scale: 1, duration: 0.25 })
              .fromTo(ask, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.35, ease: 'back.out(2)' });
          },
        },
        {
          say: 'Read the tiles in a line and count pairs in the wrong order.',
          run: (tl) => {
            const order = [1, 3, 2, 4, 5, 6, 7, 8];
            const where = { 1: [0, 0], 3: [0, 1], 2: [0, 2], 4: [1, 0], 5: [1, 1], 6: [1, 2], 7: [2, 0], 8: [2, 1] };
            tl.to(ask, { opacity: 0, duration: 0.2 });
            order.forEach((n, i) => {
              const [r, c] = where[n];
              const sx = x0 + c * g + g / 2;
              const sy = y0 + r * g + g / 2 + 6;
              const node = T(sx, sy, String(n), { c: 'd', z: 18, w: 700 });
              svg.append(node);
              k.hide(node);
              line.push(node);
              tl.set(node, { opacity: 1 }, 0.2 + i * 0.12).to(node, { x: lineX(i) - sx, y: lineY - sy, duration: 0.45, ease: 'power2.inOut' }, 0.2 + i * 0.12);
            });
            const arc = P(`M${lineX(1)} ${lineY - 17} Q${(lineX(1) + lineX(2)) / 2} ${lineY - 36} ${lineX(2)} ${lineY - 17}`, { s: COL.red, w: 2 });
            svg.append(arc);
            k.undraw(arc);
            tl.to(arc, { strokeDashoffset: 0, duration: 0.4 })
              .to([line[1], line[2]], { attr: { fill: COL.red }, duration: 0.2 }, '<')
              .call(() => (count.textContent = 'pairs in the wrong order: 1 (odd)'))
              .to(count, { opacity: 1, duration: 0.3 });
          },
        },
        {
          say: 'Slide all you like: the count stays odd.',
          run: (tl) => {
            // Round the corner and back: the gap ends in its own corner again.
            const moves = [
              [6, 2, 2, [1, 3, 2, 4, 5, 7, 8, 6], 3],
              [5, 1, 2, null, 3],
              [8, 1, 1, [1, 3, 2, 4, 8, 5, 7, 6], 5],
              [6, 2, 1, null, 5],
            ];
            moves.forEach(([n, r, c, order, pairs], i) => {
              slide(tl, n, r, c, i ? '+=0.14' : 0);
              tl.call(() => {
                if (order) order.forEach((v, j) => (line[j].textContent = String(v)));
                count.textContent = `pairs in the wrong order: ${pairs} (odd)`;
              });
              if (order) tl.to(count, { scale: 1.1, transformOrigin: '50% 50%', duration: 0.1, yoyo: true, repeat: 1 });
            });
          },
        },
        {
          say: 'Solved means 0 pairs, which is even, so this tray is stuck.',
          run: (tl) => tl.to(verdict, { opacity: 1, duration: 0.3, stagger: 0.22 }),
        },
      ],
      tryIt: {
        say: 'Your turn: tap a tile next to the gap to slide it.',
        mount(host, k2) {
          const { card, T: t, R: r, G: gg, COL: col, el, gsap: gs } = k2;
          const { svg: pic } = card(320, 172);
          pic.classList.add('demo-svg');
          const s = 46;
          const tx = 28;
          const ty = 16;
          const START = [1, 2, 3, 8, 7, 5, 4, 6, 0];
          let board = START.slice();
          let solved = false;
          const xy = (i) => ({ x: tx + (i % 3) * s, y: ty + Math.floor(i / 3) * s });
          pic.append(r(tx - 6, ty - 6, 3 * s + 12, 3 * s + 12, { f: col.wood, s: 'none', r: 8 }), r(tx, ty, 3 * s, 3 * s, { f: '#5b3f26', s: 'none', r: 3 }));
          const tiles = {};
          for (let n = 1; n <= 8; n++) {
            const face = r(2, 2, s - 4, s - 4, { f: TILE, s: TILE_EDGE, r: 5 });
            const tile = gg({}, face, t(s / 2, s / 2 + 8, String(n), { c: 'd', z: 22, w: 700 }));
            tap(tile, `Tile ${n}`, () => move(n));
            pic.append(tile);
            tiles[n] = { tile, face };
          }
          const num = t(244, 100, '', { z: 34, w: 700 });
          const parity = t(244, 124, '', { c: 'u', z: 14, w: 700, f: col.green });
          pic.append(t(244, 44, 'pairs in the', { c: 'u', z: 11.5, f: col.faint }), t(244, 59, 'wrong order', { c: 'u', z: 11.5, f: col.faint }), num, parity);
          const note = el('div', { class: 'demo-note' });
          const again = el('button', { class: 'demo-ibtn', type: 'button', text: 'Start again' });
          const pairs = () => {
            const a = board.filter(Boolean);
            let n = 0;
            for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) n++;
            return n;
          };
          const place = (fast) =>
            board.forEach((n, i) => {
              if (!n) return;
              if (fast) gs.set(tiles[n].tile, xy(i));
              else gs.to(tiles[n].tile, { ...xy(i), duration: 0.14, ease: 'power2.out', overwrite: true });
            });
          const draw = () => {
            const n = pairs();
            num.textContent = String(n);
            parity.textContent = n % 2 ? 'odd' : 'even';
            parity.setAttribute('fill', n % 2 ? col.red : col.green);
            solved = board.join(',') === '1,2,3,4,5,6,7,8,0';
            for (const { face } of Object.values(tiles)) face.setAttribute('fill', solved ? '#d5ebd8' : TILE);
            note.textContent = solved ? 'Solved! No pairs left in the wrong order.' : '';
          };
          const move = (n) => {
            if (solved) return;
            const i = board.indexOf(n);
            const j = board.indexOf(0);
            const nextTo = Math.abs(i - j) === 3 || (Math.abs(i - j) === 1 && Math.floor(i / 3) === Math.floor(j / 3));
            if (!nextTo) return;
            board[j] = n;
            board[i] = 0;
            k2.audio?.tick?.();
            place(false);
            draw();
          };
          again.addEventListener('click', () => {
            k2.audio?.tick?.();
            board = START.slice();
            place(true);
            draw();
          });
          host.append(pic, el('div', { class: 'demo-controls' }, again), note);
          place(true);
          draw();
          return () => {
            gs.killTweensOf(Object.values(tiles).map((x) => x.tile));
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the river crossing
  alcuin(k) {
    const { svg, T, R, L, P, C, G, COL, gsap } = k;
    svg.append(R(0, 0, 320, 200, { f: WATER, s: 'none', r: 0 }), R(0, 0, 82, 200, { f: SAND, s: 'none', r: 0 }), R(238, 0, 82, 200, { f: SAND, s: 'none', r: 0 }));
    for (const [x, y] of [
      [104, 30],
      [190, 46],
      [122, 168],
      [196, 150],
      [142, 62],
    ])
      svg.append(P(`M${x} ${y} q6 -4 12 0 t12 0`, { s: '#a9c6d0', w: 1.3 }));
    const thing = (label, fill) => G({}, R(-30, -13, 60, 26, { f: fill, s: COL.ink, w: 1, r: 13 }), T(0, 4.5, label, { c: 'u', z: 11.5, w: 700 }));
    const wolf = thing('wolf', '#c4beb2');
    const goat = thing('goat', '#fbf8f0');
    const cabbages = thing('cabbages', '#b5d69a');
    const HOME = { wolf: [41, 48], goat: [41, 100], cabbages: [41, 152] };
    gsap.set(wolf, { x: HOME.wolf[0], y: HOME.wolf[1] });
    gsap.set(goat, { x: HOME.goat[0], y: HOME.goat[1] });
    gsap.set(cabbages, { x: HOME.cabbages[0], y: HOME.cabbages[1] });
    // The boat: the traveller, and room for one thing.
    const LEFT = 86;
    const RIGHT = 148;
    const BOAT_Y = 108;
    const slot = R(26, -27, 60, 26, { s: COL.faint, w: 1.3, d: '3 3', r: 13 });
    const slotSign = T(56, -9.5, '+1', { c: 'u', z: 11.5, w: 700, f: COL.faint });
    const hull = P('M0 0 Q44 14 88 0 L80 13 Q44 25 8 13 Z', { f: '#9a6b3e', s: COL.ink, w: 1 });
    const person = G({}, C(14, -28, 5.5, { f: '#e8c39e', s: COL.ink, w: 1 }), P('M14 -22 V-3 M7 -15 L14 -18 L21 -15', { s: COL.ink, w: 2.2 }));
    const bob = G({}, slot, slotSign, hull, person);
    const boat = G({}, bob);
    gsap.set(boat, { x: LEFT, y: BOAT_Y });
    // Who eats whom.
    const eat1 = L(41, 63, 41, 84, { s: COL.red, w: 2.2, m: k.arrow('red') });
    const eat2 = L(41, 115, 41, 136, { s: COL.red, w: 2.2, m: k.arrow('red') });
    const eats = (y) => T(50, y, 'eats', { c: 'u', z: 10.5, w: 700, f: COL.red, a: 'start' });
    const said1 = eats(78);
    const said2 = eats(130);
    const glow = R(5, 28, 72, 92, { f: 'rgba(176,58,46,0.14)', s: COL.red, w: 2, r: 14 });
    const pair1 = R(6, 29, 70, 88, { s: COL.red, w: 1.8, d: '5 4', r: 15 });
    const pair2 = R(10, 83, 62, 86, { s: COL.red, w: 1.8, d: '5 4', r: 15 });
    const both = [L(102, 184, 218, 184, { s: COL.faint, w: 1.4, m: k.arrow('faint'), ms: k.arrow('faint') }), T(160, 175, 'over and back', { c: 'u', z: 11, f: COL.faint })];
    svg.append(glow, pair1, pair2, eat1, eat2, said1, said2, wolf, goat, cabbages, boat, ...both);
    k.hide(boat, slot, slotSign, eat1, eat2, said1, said2, glow, pair1, pair2, both);
    k.loop(gsap.to(bob, { y: 2.5, rotation: 1.2, svgOrigin: '44 6', duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    const wiggle = (tl, node) => tl.to(node, { rotation: 9, transformOrigin: '50% 50%', duration: 0.06, yoyo: true, repeat: 5 });
    return {
      steps: [
        {
          say: 'The boat holds the traveller and one thing.',
          run: (tl) =>
            tl
              .fromTo(boat, { x: RIGHT, opacity: 0 }, { x: LEFT, opacity: 1, duration: 1, ease: 'power2.out' })
              .to([slot, slotSign], { opacity: 1, duration: 0.3 })
              .to(slot, { attr: { stroke: COL.brass }, duration: 0.18, yoyo: true, repeat: 3 }),
        },
        {
          say: 'Left alone, wolf eats goat, and goat eats cabbages.',
          run: (tl) => {
            tl.to([eat1, said1], { opacity: 1, duration: 0.3 });
            wiggle(tl, goat);
            tl.to([eat2, said2], { opacity: 1, duration: 0.3 }, '+=0.15');
            wiggle(tl, cabbages);
          },
        },
        {
          say: 'Take the cabbages first, and the wolf eats the goat!',
          run: (tl) => {
            tl.to(cabbages, { x: LEFT + 56, y: BOAT_Y - 14, duration: 0.55, ease: 'power2.inOut' })
              .to([eat2, said2], { opacity: 0, duration: 0.3 }, '<')
              .to([slot, slotSign], { opacity: 0, duration: 0.2 }, '-=0.2')
              .to(boat, { x: RIGHT, duration: 0.85, ease: 'power1.inOut' })
              .to(cabbages, { x: RIGHT + 56, duration: 0.85, ease: 'power1.inOut' }, '<')
              .to(glow, { opacity: 1, duration: 0.2 })
              .to(goat.firstChild, { attr: { fill: '#e8a093' }, duration: 0.2 }, '<');
            wiggle(tl, goat);
            tl.to(goat, { opacity: 0, scale: 0.4, duration: 0.35 });
          },
        },
        {
          say: 'Look for the one thing that is in both pairs.',
          run: (tl) =>
            tl
              .to(glow, { opacity: 0, duration: 0.2 })
              .to(boat, { x: LEFT, duration: 0.6, ease: 'power2.inOut' })
              .to(cabbages, { x: HOME.cabbages[0], y: HOME.cabbages[1], duration: 0.6, ease: 'power2.inOut' }, '<')
              .to([slot, slotSign], { opacity: 1, duration: 0.2 })
              .set(goat.firstChild, { attr: { fill: '#fbf8f0' } })
              .to(goat, { opacity: 1, scale: 1, duration: 0.3 })
              .to([eat2, said2], { opacity: 1, duration: 0.3 }, '<')
              .to(pair1, { opacity: 1, duration: 0.3 })
              .to(pair2, { opacity: 1, duration: 0.3 }, '+=0.25'),
        },
        {
          say: 'And the boat can bring something back, too.',
          run: (tl) => {
            const what = thing('?', CREAM);
            gsap.set(what, { x: 56, y: -14 });
            bob.append(what);
            k.hide(what);
            tl.to([pair1, pair2], { opacity: 0.3, duration: 0.25 })
              .to(what, { opacity: 1, duration: 0.25 })
              .to([slot, slotSign], { opacity: 0, duration: 0.25 }, '<')
              .to(boat, { x: RIGHT, duration: 0.7, ease: 'power1.inOut' })
              .to(boat, { x: LEFT, duration: 0.7, ease: 'power1.inOut' }, '+=0.15')
              .to(both, { opacity: 1, duration: 0.3 });
          },
        },
      ],
    };
  },

  // ------------------------------------------------------------------ logic grids
  logic(k) {
    const { svg, T, R, P, G, COL } = k;
    const PEOPLE = ['Ann', 'Ben', 'Cat'];
    const DRINKS = ['tea', 'coffee', 'milk'];
    const x0 = 112;
    const y0 = 64;
    const cw = 62;
    const ch = 38;
    const mid = (i, j) => [x0 + j * cw + cw / 2, y0 + i * ch + ch / 2];
    const clue = T(160, 30, '', { c: 'u', z: 13, w: 600 });
    const slip = G({}, R(64, 10, 192, 30, { f: CREAM, s: '#cbb98f', r: 4 }), clue);
    const cols = DRINKS.map((d, j) => T(x0 + j * cw + cw / 2, y0 - 10, d, { c: 'u', z: 13, w: 600 }));
    const rows = PEOPLE.map((p, i) => T(x0 - 12, y0 + i * ch + ch / 2 + 4.5, p, { c: 'u', z: 13, w: 600, a: 'end' }));
    const cells = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push(R(x0 + j * cw, y0 + i * ch, cw, ch, { s: COL.rule, r: 0, f: CREAM }));
    const bands = G({});
    const marks = G({});
    svg.append(G({}, cells), bands, marks, ...cols, ...rows, slip);
    k.hide(cells, cols, rows, slip);
    const band = (i0, j0, ni, nj) => {
      const b = R(x0 + j0 * cw + 3, y0 + i0 * ch + 3, nj * cw - 6, ni * ch - 6, { f: 'rgba(168,105,28,0.15)', s: 'none', r: 4 });
      bands.append(b);
      k.hide(b);
      return b;
    };
    const tick = (tl, i, j) => {
      const [x, y] = mid(i, j);
      const n = P(`M${x - 10} ${y} L${x - 3} ${y + 8} L${x + 11} ${y - 9}`, { s: COL.green, w: 3.4 });
      marks.append(n);
      k.undraw(n);
      tl.to(n, { strokeDashoffset: 0, duration: 0.35, ease: 'power1.out' });
    };
    const cross = (tl, i, j) => {
      const [x, y] = mid(i, j);
      const n = P(`M${x - 8} ${y - 8} L${x + 8} ${y + 8} M${x + 8} ${y - 8} L${x - 8} ${y + 8}`, { s: COL.red, w: 2.4 });
      marks.append(n);
      tl.fromTo(n, { opacity: 0, scale: 0.3, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.22, ease: 'back.out(2.5)' });
    };
    const setClue = (tl, text, f = COL.ink) =>
      tl
        .to(slip, { opacity: 0, duration: 0.15 })
        .call(() => {
          clue.textContent = text;
          clue.setAttribute('fill', f);
        })
        .to(slip, { opacity: 1, duration: 0.3 });
    return {
      steps: [
        {
          say: 'People down the side, drinks across the top.',
          run: (tl) => tl.to(rows, { opacity: 1, duration: 0.25, stagger: 0.12 }).to(cols, { opacity: 1, duration: 0.25, stagger: 0.12 }).to(cells, { opacity: 1, duration: 0.2, stagger: 0.05 }),
        },
        {
          say: 'Clue: Ann drinks tea, so put a tick there.',
          run: (tl) => {
            setClue(tl, 'Ann drinks tea.');
            tl.to([rows[0], cols[0]], { attr: { fill: COL.brass }, duration: 0.2 });
            tick(tl, 0, 0);
            tl.to([rows[0], cols[0]], { attr: { fill: COL.ink }, duration: 0.3 });
          },
        },
        {
          say: 'A tick crosses out the rest of its row and column.',
          run: (tl) => {
            const rb = band(0, 0, 1, 3);
            const cb = band(0, 0, 3, 1);
            tl.to(rb, { opacity: 1, duration: 0.25 });
            cross(tl, 0, 1);
            cross(tl, 0, 2);
            tl.to(rb, { opacity: 0, duration: 0.2 }).to(cb, { opacity: 1, duration: 0.25 });
            cross(tl, 1, 0);
            cross(tl, 2, 0);
            tl.to(cb, { opacity: 0, duration: 0.2 });
          },
        },
        {
          say: 'Clue: Ben does not drink milk, so cross that out.',
          run: (tl) => {
            setClue(tl, 'Ben does not drink milk.');
            tl.to([rows[1], cols[2]], { attr: { fill: COL.brass }, duration: 0.2 });
            cross(tl, 1, 2);
            tl.to([rows[1], cols[2]], { attr: { fill: COL.ink }, duration: 0.3 });
          },
        },
        {
          say: 'The last box left in a row gets the tick: solved!',
          run: (tl) => {
            const ben = band(1, 0, 1, 3);
            const coffee = band(0, 1, 3, 1);
            const cat = band(2, 0, 1, 3);
            tl.to(ben, { opacity: 1, duration: 0.2 });
            tick(tl, 1, 1);
            tl.to(ben, { opacity: 0, duration: 0.15 }).to(coffee, { opacity: 1, duration: 0.2 });
            cross(tl, 2, 1);
            tl.to(coffee, { opacity: 0, duration: 0.15 }).to(cat, { opacity: 1, duration: 0.2 });
            tick(tl, 2, 2);
            tl.to(cat, { opacity: 0, duration: 0.15 });
            setClue(tl, 'Solved!', COL.green);
          },
        },
      ],
      tryIt: {
        say: 'Your turn: tap the boxes to solve it from the two clues.',
        mount(host, k2) {
          const { card, T: t, R: r, P: p, COL: col, el } = k2;
          const { svg: pic } = card(320, 194);
          pic.classList.add('demo-svg');
          const WHO = ['Dan', 'Eve', 'Flo'];
          const FRUIT = ['pear', 'plum', 'apple'];
          const ANSWER = [2, 0, 1]; // Dan the apple, Eve the pear, Flo the plum
          const gx = 112;
          const gy = 78;
          const cw = 62;
          const ch = 36;
          pic.append(t(16, 22, '1.  Eve has the pear.', { c: 'u', z: 13, w: 600, a: 'start' }), t(16, 43, '2.  Dan does not have the plum.', { c: 'u', z: 13, w: 600, a: 'start' }));
          FRUIT.forEach((f, j) => pic.append(t(gx + j * cw + cw / 2, gy - 9, f, { c: 'u', z: 13, w: 600 })));
          WHO.forEach((w, i) => pic.append(t(gx - 12, gy + i * ch + ch / 2 + 4.5, w, { c: 'u', z: 13, w: 600, a: 'end' })));
          const state = [0, 1, 2].map(() => [0, 0, 0]);
          const marks = [];
          for (let i = 0; i < 3; i++) {
            marks.push([]);
            for (let j = 0; j < 3; j++) {
              const x = gx + j * cw + cw / 2;
              const y = gy + i * ch + ch / 2;
              const box = r(gx + j * cw, gy + i * ch, cw, ch, { s: col.rule, r: 0, f: CREAM });
              const yes = p(`M${x - 10} ${y} L${x - 3} ${y + 8} L${x + 11} ${y - 9}`, { s: col.green, w: 3.4 });
              const no = p(`M${x - 8} ${y - 8} L${x + 8} ${y + 8} M${x + 8} ${y - 8} L${x - 8} ${y + 8}`, { s: col.red, w: 2.4 });
              const hit = tap(r(gx + j * cw, gy + i * ch, cw, ch, { f: 'transparent', s: 'none' }), `${WHO[i]} and the ${FRUIT[j]}`, () => {
                state[i][j] = (state[i][j] + 1) % 3;
                k2.audio?.tick?.();
                draw();
              });
              pic.append(box, yes, no, hit);
              marks[i].push({ yes, no });
            }
          }
          const ask = el('div', { class: 'demo-goal' });
          const note = el('div', { class: 'demo-note' });
          const again = el('button', { class: 'demo-ibtn', type: 'button', text: 'Clear' });
          const draw = () => {
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                marks[i][j].yes.setAttribute('opacity', state[i][j] === 1 ? '1' : '0');
                marks[i][j].no.setAttribute('opacity', state[i][j] === 2 ? '1' : '0');
              }
            }
            const ticks = state.map((row) => row.map((v) => v === 1));
            const inRow = ticks.map((row) => row.filter(Boolean).length);
            const inCol = [0, 1, 2].map((j) => ticks.filter((row) => row[j]).length);
            note.textContent = '';
            ask.classList.remove('ok');
            if (inRow.some((n) => n > 1) || inCol.some((n) => n > 1)) ask.textContent = 'Only one tick in each row and each column.';
            else if (inRow.every((n) => n === 1)) {
              if (ANSWER.every((j, i) => ticks[i][j])) {
                ask.textContent = 'Solved!';
                ask.classList.add('ok');
                note.textContent = 'Dan has the apple, Eve the pear, Flo the plum.';
              } else ask.textContent = 'Not quite. Read the clues again.';
            } else ask.textContent = 'Tap a box once for a tick, twice for a cross.';
          };
          again.addEventListener('click', () => {
            k2.audio?.tick?.();
            state.forEach((row) => row.fill(0));
            draw();
          });
          host.append(ask, pic, el('div', { class: 'demo-controls' }, again), note);
          draw();
          return () => host.replaceChildren();
        },
      },
    };
  },

  // ------------------------------------------------------------------ the smothered mate
  smothered(k) {
    const { svg, T, R, L, P, C, G, COL, chessman } = k;
    const g = 40;
    const x0 = 30;
    const y0 = 12;
    const sx = (c) => x0 + c * g;
    const sy = (r) => y0 + r * g;
    const ctr = (c, r) => [sx(c) + g / 2, sy(r) + g / 2];
    // The corner of the board from a8 to d5, as White sees it.
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) svg.append(R(sx(c), sy(r), g, g, { f: (r + c) % 2 ? '#b89466' : '#ecdfc4', s: 'none', r: 0 }));
      svg.append(T(x0 - 11, sy(r) + g / 2 + 4, String(8 - r), { z: 11, f: COL.faint }));
    }
    'abcd'.split('').forEach((f, c) => svg.append(T(sx(c) + g / 2, y0 + 4 * g + 14, f, { z: 11, f: COL.faint })));
    const under = G({});
    const piece = (code, c, r) => G({}, chessman(code, sx(c) + 3, sy(r) + 3, g - 6));
    const king = piece('k', 0, 0);
    const rook = piece('r', 1, 0);
    const pawnA = piece('p', 0, 1);
    const pawnB = piece('p', 1, 1);
    const knight = piece('N', 3, 3);
    const over = G({});
    const label = (y, text, f, z) => T(204, y, text, { c: 'u', z, w: 700, f, a: 'start' });
    const boxed = label(46, 'boxed in', COL.brass, 14);
    const check = label(92, 'check!', COL.red, 16);
    const mate = label(150, 'mate', COL.red, 26);
    svg.append(under, king, rook, pawnA, pawnB, knight, over, boxed, check, mate);
    k.hide(king, rook, pawnA, pawnB, knight, boxed, check, mate);
    const [kx, ky] = ctr(2, 1); // c7, where the knight lands
    const [ax, ay] = ctr(0, 0); // a8, the king
    return {
      steps: [
        {
          say: 'The black king sits in his corner, on a8.',
          run: (tl) => tl.fromTo(king, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'bounce.out' }),
        },
        {
          say: 'His own rook and pawns fill every square around him.',
          run: (tl) => {
            const boxes = [
              [1, 0],
              [0, 1],
              [1, 1],
            ].map(([c, r]) => R(sx(c) + 2.5, sy(r) + 2.5, g - 5, g - 5, { s: COL.brass, w: 2.6, r: 5 }));
            under.append(...boxes);
            k.hide(boxes);
            tl.fromTo(
              [rook, pawnA, pawnB],
              { opacity: 0, y: -10 },
              { opacity: 1, y: 0, duration: 0.3, stagger: 0.18 },
            )
              .to(boxes, { opacity: 1, duration: 0.2, stagger: 0.12 })
              .to(boxes, { opacity: 0.25, duration: 0.18, yoyo: true, repeat: 3 })
              .to(boxed, { opacity: 1, duration: 0.3 }, '<');
          },
        },
        {
          say: 'The white knight jumps to c7: check!',
          run: (tl) => {
            const red = R(sx(0), sy(0), g, g, { f: 'rgba(176,58,46,0.45)', s: 'none', r: 0 });
            under.prepend(red);
            const len = Math.hypot(kx - ax, ky - ay);
            const [ux, uy] = [(ax - kx) / len, (ay - ky) / len];
            const arrow = L(kx + ux * 12, ky + uy * 12, ax - ux * 15, ay - uy * 15, { s: COL.red, w: 2.8, m: k.arrow('red') });
            over.append(arrow);
            k.hide(red, arrow);
            tl.to(knight, { opacity: 1, duration: 0.3 })
              .to(knight, { x: -g, y: -2 * g, duration: 0.6, ease: 'power2.inOut' })
              .to(knight, { scale: 1.2, transformOrigin: '50% 50%', duration: 0.3, yoyo: true, repeat: 1, ease: 'power1.out' }, '<')
              .to([red, arrow], { opacity: 1, duration: 0.25 })
              .to(check, { opacity: 1, duration: 0.25 }, '<');
          },
        },
        {
          say: 'A knight jumps, so nothing can be put in its way.',
          run: (tl) => {
            const hop = P(`M${kx - 4} ${ky - 16} Q${(kx + ax) / 2 + 10} -6 ${ax + 12} ${ay - 12}`, { s: COL.red, w: 2.2 });
            over.append(hop);
            k.undraw(hop);
            tl.to(over.firstChild, { opacity: 0.35, duration: 0.3 })
              .to(hop, { strokeDashoffset: 0, duration: 0.8, ease: 'power1.inOut' })
              .call(() => hop.setAttribute('marker-end', k.arrow('red')))
              .to([rook, pawnB], { y: -3, duration: 0.12, yoyo: true, repeat: 1 });
          },
        },
        {
          say: 'Nothing can take the knight either: smothered mate!',
          run: (tl) => {
            // Where the rook can go, and the squares the pawns can take on: not one of them is c7.
            const reach = [
              [2, 0],
              [3, 0],
              [0, 2],
              [1, 2],
              [2, 2],
            ].map(([c, r]) => C(...ctr(c, r), 5, { f: COL.blue, s: 'none' }));
            const safe = C(kx, ky, 18, { s: COL.brass, w: 2.4 });
            over.append(...reach, safe);
            k.hide(reach, safe);
            tl.to(reach, { opacity: 0.85, duration: 0.2, stagger: 0.12 })
              .to(safe, { opacity: 1, duration: 0.3 })
              .to(reach, { opacity: 0, duration: 0.3 }, '+=0.4')
              .fromTo(mate, { opacity: 0, scale: 0.5, transformOrigin: '0% 50%' }, { opacity: 1, scale: 1, transformOrigin: '0% 50%', duration: 0.4, ease: 'back.out(2)' });
          },
        },
      ],
    };
  },

  // ------------------------------------------------------------------ guess-the-word games
  wordgames(k) {
    const { svg, T, R, G, COL, gsap } = k;
    const S = 42;
    const x = (i) => 43 + i * 48;
    const tile = (i, y) => {
      const box = R(0, 0, S, S, { f: CREAM, s: '#cbb98f', w: 1.6, r: 5 });
      const ch = T(S / 2, 29, '', { c: 'u', z: 22, w: 800 });
      const t = G({}, box, ch);
      gsap.set(t, { x: x(i), y });
      svg.append(t);
      return { t, box, ch };
    };
    const row1 = [0, 1, 2, 3, 4].map((i) => tile(i, 12));
    const row2 = [0, 1, 2, 3, 4].map((i) => tile(i, 64));
    k.hide(row2.map((tt) => tt.t));
    const KEY = [
      [COL.green, 'right letter, right place'],
      [GOLD, 'in the word, wrong place'],
      [GREY, 'not in the word'],
    ];
    const legend = KEY.map(([f, text], i) => G({}, R(70, 122 + i * 24, 13, 13, { f, s: 'none', r: 2 }), T(92, 133 + i * 24, text, { c: 'u', z: 13, a: 'start' })));
    svg.append(...legend);
    k.hide(legend);
    const paint = (tt, f) => {
      tt.box.setAttribute('fill', f);
      tt.box.setAttribute('stroke', f);
      tt.ch.setAttribute('fill', '#fff');
    };
    const type = (tl, tt, letter) =>
      tl
        .call(() => {
          tt.ch.textContent = letter;
          tt.box.setAttribute('stroke', COL.faint);
        })
        .to(tt.t, { scale: 1.1, transformOrigin: '50% 50%', duration: 0.05 })
        .to(tt.t, { scale: 1, duration: 0.08 });
    const flip = (tl, tt, f, at) => {
      tl.to(tt.t, { scaleY: 0, transformOrigin: '50% 50%', duration: 0.1, ease: 'power1.in' }, at)
        .call(() => paint(tt, f), undefined, at + 0.1)
        .to(tt.t, { scaleY: 1, duration: 0.1, ease: 'power1.out' }, at + 0.1);
    };
    const hop = (tl, tts) => tl.to(tts.map((tt) => tt.t), { y: '-=7', duration: 0.14, yoyo: true, repeat: 3, ease: 'power1.out' });
    return {
      steps: [
        {
          say: 'Guess a word, and each letter turns a colour.',
          run: (tl) => {
            'CRANE'.split('').forEach((ch, i) => type(tl, row1[i], ch));
            const cols = [GREY, GOLD, COL.green, GREY, GOLD];
            const t0 = tl.duration() + 0.25;
            row1.forEach((tt, i) => flip(tl, tt, cols[i], t0 + i * 0.26));
          },
        },
        {
          say: 'Green: the right letter in the right place.',
          run: (tl) => {
            tl.to(legend[0], { opacity: 1, duration: 0.3 });
            hop(tl, [row1[2]]);
          },
        },
        {
          say: 'Gold: in the word, but in another place.',
          run: (tl) => {
            tl.to(legend[1], { opacity: 1, duration: 0.3 });
            hop(tl, [row1[1], row1[4]]);
          },
        },
        {
          say: 'Grey: not in the word at all.',
          run: (tl) => {
            tl.to(legend[2], { opacity: 1, duration: 0.3 });
            hop(tl, [row1[0], row1[3]]);
          },
        },
        {
          say: 'Keep the green, move the gold, drop the grey.',
          run: (tl) => {
            // A stays where it is, R and E move, C and N are dropped.
            tl.to([row1[0].t, row1[3].t], { opacity: 0.3, duration: 0.3 });
            [
              ['A', 2, 2, COL.green],
              ['R', 1, 3, GOLD],
              ['E', 4, 1, GOLD],
            ].forEach(([ch, from, to, f], n) => {
              const tt = row2[to];
              tt.ch.textContent = ch;
              paint(tt, f);
              tl.fromTo(tt.t, { x: x(from), y: 12, opacity: 1 }, { x: x(to), y: 64, duration: 0.5, ease: 'power2.inOut' }, 0.3 + n * 0.1);
            });
            for (const [ch, i] of [
              ['B', 0],
              ['D', 4],
            ]) {
              tl.set(row2[i].t, { opacity: 1 });
              type(tl, row2[i], ch);
            }
            const t0 = tl.duration() + 0.15;
            row2.forEach((tt, i) => flip(tl, tt, COL.green, t0 + i * 0.15));
          },
        },
      ],
      tryIt: {
        say: 'Your turn: find the hidden four-letter word.',
        mount(host, k2) {
          const { card, T: t, R: r, COL: col, el } = k2;
          const WORDS = ['KITE', 'MOLE', 'SNAP'];
          const LETTERS = 'AEIKLMNOPRST';
          const TRIES = 5;
          const { svg: pic } = card(320, 196);
          pic.classList.add('demo-svg');
          const TS = 28;
          const cells = [];
          for (let rr = 0; rr < TRIES; rr++) {
            cells.push([]);
            for (let i = 0; i < 4; i++) {
              const box = r(18 + i * 33, 14 + rr * 35, TS, TS, { f: CREAM, s: '#cbb98f', w: 1.4, r: 4 });
              const ch = t(18 + i * 33 + TS / 2, 14 + rr * 35 + 20, '', { c: 'u', z: 16, w: 800 });
              pic.append(box, ch);
              cells[rr].push({ box, ch });
            }
          }
          const chips = LETTERS.split('').map((letter, n) => {
            const cx = 166 + (n % 3) * 48;
            const cy = 14 + Math.floor(n / 3) * 42;
            const box = r(cx, cy, 42, 36, { f: '#e6dbc2', s: '#cbb98f', w: 1.2, r: 6 });
            const ch = t(cx + 21, cy + 24, letter, { c: 'u', z: 17, w: 700 });
            pic.append(box, ch, tap(r(cx, cy, 42, 36, { f: 'transparent', s: 'none' }), `Letter ${letter}`, () => press(letter)));
            return { letter, box, ch };
          });
          const ask = el('div', { class: 'demo-goal' });
          const note = el('div', { class: 'demo-note' });
          const del = el('button', { class: 'demo-ibtn', type: 'button', text: 'Delete' });
          const enter = el('button', { class: 'demo-ibtn', type: 'button', text: 'Enter' });
          const fresh = el('button', { class: 'demo-ibtn', type: 'button', text: 'New word' });
          let w = 0;
          let word = WORDS[0];
          let guesses = [];
          let typing = '';
          let over = false;
          /** g: right place, y: in the word, x: not in it. */
          const score = (guess) => {
            const res = ['x', 'x', 'x', 'x'];
            const left = {};
            for (let i = 0; i < 4; i++) {
              if (guess[i] === word[i]) res[i] = 'g';
              else left[word[i]] = (left[word[i]] ?? 0) + 1;
            }
            for (let i = 0; i < 4; i++) {
              if (res[i] !== 'g' && left[guess[i]]) {
                res[i] = 'y';
                left[guess[i]] -= 1;
              }
            }
            return res;
          };
          const FILL = { g: col.green, y: GOLD, x: GREY };
          const draw = () => {
            const best = {};
            for (let rr = 0; rr < TRIES; rr++) {
              const guess = guesses[rr];
              const marks = guess ? score(guess) : null;
              for (let i = 0; i < 4; i++) {
                const { box, ch } = cells[rr][i];
                if (guess) {
                  ch.textContent = guess[i];
                  box.setAttribute('fill', FILL[marks[i]]);
                  box.setAttribute('stroke', FILL[marks[i]]);
                  ch.setAttribute('fill', '#fff');
                  const rank = { g: 3, y: 2, x: 1 }[marks[i]];
                  if ((best[guess[i]] ?? 0) < rank) best[guess[i]] = rank;
                } else {
                  const now = rr === guesses.length ? typing[i] ?? '' : '';
                  ch.textContent = now;
                  ch.setAttribute('fill', col.ink);
                  box.setAttribute('fill', CREAM);
                  box.setAttribute('stroke', now ? col.faint : '#cbb98f');
                }
              }
            }
            for (const chip of chips) {
              const rank = best[chip.letter] ?? 0;
              const f = rank ? FILL['xyg'[rank - 1]] : '#e6dbc2';
              chip.box.setAttribute('fill', f);
              chip.ch.setAttribute('fill', rank ? '#fff' : col.ink);
            }
            fresh.hidden = !over;
            enter.hidden = over;
            del.hidden = over;
          };
          const press = (letter) => {
            if (over || typing.length >= 4) return;
            typing += letter;
            k2.audio?.tick?.();
            draw();
          };
          del.addEventListener('click', () => {
            if (over || !typing) return;
            typing = typing.slice(0, -1);
            k2.audio?.tick?.();
            draw();
          });
          enter.addEventListener('click', () => {
            if (over) return;
            k2.audio?.tick?.();
            if (typing.length < 4) {
              ask.textContent = 'Four letters, please.';
              return;
            }
            guesses.push(typing);
            const right = typing === word;
            typing = '';
            if (right) {
              over = true;
              ask.textContent = 'You found it!';
              note.textContent = guesses.length === 1 ? 'First try!' : `${guesses.length} tries.`;
            } else if (guesses.length === TRIES) {
              over = true;
              ask.textContent = `Out of tries. It was ${word}.`;
            } else ask.textContent = 'Keep the green, move the gold, drop the grey.';
            draw();
          });
          fresh.addEventListener('click', () => {
            k2.audio?.tick?.();
            w = (w + 1) % WORDS.length;
            word = WORDS[w];
            guesses = [];
            typing = '';
            over = false;
            ask.textContent = 'Tap four letters, then Enter. Five tries.';
            note.textContent = '';
            draw();
          });
          ask.textContent = 'Tap four letters, then Enter. Five tries.';
          host.append(ask, pic, el('div', { class: 'demo-controls' }, del, enter, fresh), note);
          draw();
          return () => host.replaceChildren();
        },
      },
    };
  },

  // ------------------------------------------------------------------ pegs for dates
  dates(k) {
    const { svg, T, L, R, G, COL, gsap } = k;
    const AX = 120;
    const x = (yr) => 20 + (yr - 1000) * 0.28;
    const axis = L(14, AX, 306, AX, { s: COL.ink, w: 1.6 });
    const ends = [T(12, AX + 18, '1000', { z: 11, f: COL.faint, a: 'start' }), T(308, AX + 18, '2000', { z: 11, f: COL.faint, a: 'end' }), T(12, 190, '← older', { c: 'u', z: 11, f: COL.faint, a: 'start' }), T(308, 190, 'newer →', { c: 'u', z: 11, f: COL.faint, a: 'end' })];
    const PEGS = [
      [1066, 'Hastings', -1],
      [1215, 'Magna Carta', 1],
      [1348, 'Black Death', -1],
      [1588, 'Armada', 1],
      [1815, 'Waterloo', -1],
    ];
    const pegs = PEGS.map(([yr, name, side]) => {
      const px = x(yr);
      const year = T(px, side < 0 ? AX - 22 : AX + 36, String(yr), { z: 12.5, w: 700, f: COL.brass });
      return { px, year, g: G({}, L(px, AX - 7, px, AX + 7, { s: COL.brass, w: 2.6 }), year, T(px, side < 0 ? AX - 37 : AX + 51, name, { c: 'u', z: 11 })) };
    });
    const cardBox = R(-70, -19, 140, 38, { f: CREAM, s: COL.brass, w: 1.6, r: 6 });
    const cardSub = T(0, 13, '?', { z: 11.5, w: 700, f: COL.brass });
    const event = G({}, cardBox, T(0, -3, 'Henry VIII crowned', { c: 'u', z: 12, w: 700 }), cardSub);
    gsap.set(event, { x: 160, y: 36 });
    svg.append(axis, ...ends, ...pegs.map((p) => p.g), event);
    k.undraw(axis);
    k.hide(ends, pegs.map((p) => p.g), event);
    const sub = (tl, text, f) =>
      tl.call(() => {
        cardSub.textContent = text;
        cardSub.setAttribute('fill', f);
      });
    const glow = (tl, p) => tl.to(p.year, { attr: { fill: COL.green }, scale: 1.25, transformOrigin: '50% 50%', duration: 0.15 }).to(p.year, { attr: { fill: COL.brass }, scale: 1, duration: 0.2 }, '+=0.15');
    return {
      steps: [
        {
          say: 'Draw a line: older on the left, newer on the right.',
          run: (tl) =>
            tl
              .to(axis, { strokeDashoffset: 0, duration: 0.9, ease: 'power1.inOut' })
              .call(() => axis.setAttribute('marker-end', k.arrow('ink')))
              .to(ends, { opacity: 1, duration: 0.3, stagger: 0.12 }),
        },
        {
          say: 'Learn a few dates by heart: they are your pegs.',
          run: (tl) => pegs.forEach((p, i) => tl.fromTo(p.g, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'bounce.out' }, i * 0.25)),
        },
        {
          say: 'For anything else, ask: before or after a peg?',
          run: (tl) => {
            tl.fromTo(event, { opacity: 0, y: 6 }, { opacity: 1, y: 36, duration: 0.35 }).to(event, { x: pegs[2].px, duration: 0.45, ease: 'power2.inOut' });
            sub(tl, 'after 1348 →', COL.green);
            glow(tl, pegs[2]);
            tl.to(event, { x: pegs[3].px, duration: 0.45, ease: 'power2.inOut' });
            sub(tl, '← before 1588', COL.green);
            glow(tl, pegs[3]);
          },
        },
        {
          say: 'So it hangs between them: after 1348, before 1588.',
          run: (tl) => {
            const px = x(1509);
            const drop = L(px, 56, px, AX - 8, { s: COL.green, w: 1.6, d: '3 3' });
            const peg = L(px, AX - 8, px, AX + 8, { s: COL.green, w: 3 });
            svg.append(drop, peg);
            k.hide(drop, peg);
            tl.to(event, { x: px, duration: 0.6, ease: 'power2.inOut' });
            sub(tl, '1509', COL.green);
            tl.to(cardBox, { attr: { stroke: COL.green }, duration: 0.3 })
              .to(drop, { opacity: 1, duration: 0.3 })
              .fromTo(peg, { opacity: 0, scaleY: 0, transformOrigin: '50% 50%' }, { opacity: 1, scaleY: 1, transformOrigin: '50% 50%', duration: 0.3 });
          },
        },
      ],
      tryIt: {
        say: 'Your turn: tap the four events, oldest first.',
        mount(host, k2) {
          const { card, T: t, R: r, L: l, G: gg, COL: col, el, gsap: gs } = k2;
          const EVENTS = [
            { name: 'First passenger railway', tag: 'Railway', yr: 1830 },
            { name: 'Battle of Hastings', tag: 'Hastings', yr: 1066 },
            { name: 'Moon landing', tag: 'Moon', yr: 1969 },
            { name: 'Henry VIII crowned', tag: 'Henry VIII', yr: 1509 },
          ];
          const ORDER = [...EVENTS].sort((a, b) => a.yr - b.yr);
          const { svg: pic, arrow } = card(320, 196);
          pic.classList.add('demo-svg');
          const AY = 150;
          const px = (yr) => 20 + (yr - 1000) * 0.28;
          pic.append(l(14, AY, 306, AY, { s: col.ink, w: 1.6, m: arrow('ink') }));
          const placed = gg({});
          pic.append(placed);
          const SPOTS = [
            [10, 12],
            [164, 12],
            [10, 56],
            [164, 56],
          ];
          const cards = EVENTS.map((ev, n) => {
            const [cx, cy] = SPOTS[n];
            const box = r(0, 0, 146, 36, { f: CREAM, s: col.brass, w: 1.4, r: 6 });
            const dot = k2.C(4, 4, 9, { f: col.green, s: 'none' });
            const badge = t(4, 8, '', { c: 'u', z: 11, w: 800, f: '#fff' });
            const sticker = gg({ opacity: 0 }, dot, badge);
            const g = gg({}, box, t(73, 23, ev.name, { c: 'u', z: 11.5, w: 600 }), sticker);
            gs.set(g, { x: cx, y: cy });
            tap(g, ev.name, () => pick(n));
            pic.append(g);
            return { ev, g, box, badge, sticker, done: false };
          });
          const ask = el('div', { class: 'demo-goal' });
          const note = el('div', { class: 'demo-note' });
          const again = el('button', { class: 'demo-ibtn', type: 'button', text: 'Start again' });
          let next = 0;
          const reset = () => {
            next = 0;
            placed.replaceChildren();
            for (const c of cards) {
              c.done = false;
              c.badge.textContent = '';
              c.sticker.setAttribute('opacity', '0');
              c.box.setAttribute('stroke', col.brass);
              gs.set(c.g, { opacity: 1 });
            }
            ask.textContent = 'Which happened first of all?';
            note.textContent = '';
          };
          const pick = (n) => {
            const c = cards[n];
            if (c.done || next >= ORDER.length) return;
            k2.audio?.tick?.();
            if (c.ev !== ORDER[next]) {
              ask.textContent = 'Not yet: one of the others is older.';
              gs.fromTo(c.box, { attr: { stroke: col.red } }, { attr: { stroke: col.brass }, duration: 0.7 });
              gs.fromTo(c.g, { rotation: -3, transformOrigin: '50% 50%' }, { rotation: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'elastic.out(1, 0.3)' });
              return;
            }
            c.done = true;
            next += 1;
            c.badge.textContent = String(next);
            c.sticker.setAttribute('opacity', '1');
            c.box.setAttribute('stroke', col.green);
            gs.to(c.g, { opacity: 0.55, duration: 0.3 });
            const x = px(c.ev.yr);
            const up = next % 2 === 1;
            const mark = gg({}, l(x, AY - 7, x, AY + 7, { s: col.green, w: 2.6 }), t(x, up ? AY - 15 : AY + 22, String(c.ev.yr), { z: 12, w: 700, f: col.brass }), t(x, up ? AY - 29 : AY + 36, c.ev.tag, { c: 'u', z: 11 }));
            placed.append(mark);
            gs.fromTo(mark, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'bounce.out' });
            if (next === ORDER.length) {
              ask.textContent = 'All in order, oldest first!';
              note.textContent = 'Each one hangs between the pegs around it.';
            } else ask.textContent = 'Yes! Now the next oldest.';
          };
          again.addEventListener('click', () => {
            k2.audio?.tick?.();
            reset();
          });
          host.append(ask, pic, el('div', { class: 'demo-controls' }, again), note);
          reset();
          return () => {
            gs.killTweensOf([...cards.map((c) => c.g), ...cards.map((c) => c.box), ...placed.children]);
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ reading music
  notes(k) {
    const { svg, T, L, R, P, G, s, COL } = k;
    const py = (p) => 84 - (p - 2) * 6; // 2 is E on the bottom line, 10 is F on the top line
    const lines = [0, 1, 2, 3, 4].map((i) => L(16, 84 - i * 12, 304, 84 - i * 12, { s: COL.ink, w: 1 }));
    const clef = P(smooth(CLEF), { s: COL.ink, w: 2.2 });
    const KX = 28;
    const KY = 114;
    const KW = 24;
    const KH = 76;
    const WHITE = '#fbf8f0';
    const keys = NOTE_NAMES.split('').map((_, i) => R(KX + i * KW, KY, KW, KH, { f: WHITE, s: COL.ink, w: 1, r: 2 }));
    const keyNames = NOTE_NAMES.split('').map((n, i) => T(KX + i * KW + KW / 2, KY + KH - 9, n, { z: 11, w: 700, f: COL.brass }));
    const blacks = [0, 1, 3, 4, 5, 7, 8].map((i) => R(KX + (i + 1) * KW - 7, KY, 14, 46, { f: COL.ink, s: COL.ink, w: 1, r: 2 }));
    const written = G({});
    svg.append(...lines, clef, ...keys, ...keyNames, ...blacks, written);
    lines.forEach((ln) => k.undraw(ln));
    k.hide(clef, keyNames);
    const head = (x, p) => G({}, s('ellipse', { cx: x, cy: py(p), rx: 7.4, ry: 5.4, fill: COL.ink, transform: `rotate(-18 ${x} ${py(p)})` }));
    /** Write note p at x, name it under the staff, and light its key. */
    const write = (tl, x, p, f, keyFill, at = tl.duration()) => {
      const h = head(x, p);
      const name = T(x, 104, NOTE_NAMES[p], { z: 13, w: 700, f });
      written.append(h, name);
      k.hide(h, name);
      sound(tl, () => k.audio?.piano?.(NOTE_HZ[p]), at);
      tl.fromTo(h, { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.22, ease: 'back.out(2.5)' }, at)
        .to(name, { opacity: 1, duration: 0.15 }, at)
        .to(keys[p], { attr: { fill: keyFill }, duration: 0.12 }, at)
        .to(keyNames[p], { opacity: 1, attr: { fill: f }, duration: 0.12 }, at);
    };
    return {
      steps: [
        {
          say: 'Music is written on five lines, called a staff.',
          run: (tl) => tl.to(lines, { strokeDashoffset: 0, duration: 0.7, stagger: 0.12, ease: 'power1.inOut' }).to(clef, { opacity: 1, duration: 0.4 }),
        },
        {
          say: 'On the lines: E G B D F, Every Good Boy Deserves Fruit.',
          run: (tl) => [2, 4, 6, 8, 10].forEach((p, i) => write(tl, 66 + i * 28, p, COL.brass, '#f0d9a0', i * 0.4)),
        },
        {
          say: 'In the spaces between, the notes spell FACE.',
          run: (tl) => [3, 5, 7, 9].forEach((p, i) => write(tl, 214 + i * 26, p, COL.green, '#cfe6d2', i * 0.4)),
        },
        {
          say: 'The higher a note sits, the higher it sounds.',
          run: (tl) => {
            const old = [...written.children];
            tl.to(old, { opacity: 0, duration: 0.3 }, 0).to(keys, { attr: { fill: WHITE }, duration: 0.3 }, 0).to(keyNames, { opacity: 0, duration: 0.3 }, 0);
            for (let p = 2; p <= 10; p++) {
              const at = 0.4 + (p - 2) * 0.2;
              write(tl, 60 + (p - 2) * 29, p, COL.ink, '#f2c14e', at);
              tl.to(keys[p], { attr: { fill: WHITE }, duration: 0.25 }, at + 0.18);
            }
          },
        },
      ],
      tryIt: {
        say: 'Your turn: tap the staff or the keys to hear a note.',
        mount(host, k2) {
          const { card, T: t, L: l, R: r, P: p, G: gg, s: sv, COL: col, el } = k2;
          const { svg: pic } = card(320, 208);
          pic.classList.add('demo-svg');
          // A roomier staff than the film's, so that a finger can find a line or a space.
          const GAP = 15;
          const BOTTOM = 86;
          const ny = (q) => BOTTOM - ((q - 2) * GAP) / 2; // C below the staff sits on its own short line
          for (let i = 0; i < 5; i++) pic.append(l(16, BOTTOM - i * GAP, 304, BOTTOM - i * GAP, { s: col.ink, w: 1.1 }));
          pic.append(gg({ transform: 'translate(-8 -19) scale(1.25)' }, p(smooth(CLEF), { s: col.ink, w: 2 })));
          const ledger = l(0, ny(0), 0, ny(0), { s: col.ink, w: 1.3 });
          const note = sv('ellipse', { cx: 0, cy: 0, rx: 9, ry: 6.6, fill: col.brass });
          const name = t(0, 123, '', { z: 15, w: 800, f: col.brass });
          ledger.setAttribute('opacity', '0');
          note.setAttribute('opacity', '0');
          const staffHit = r(56, 12, 252, 100, { f: 'transparent', s: 'none' });
          staffHit.style.cursor = 'pointer';
          staffHit.setAttribute('role', 'button');
          staffHit.setAttribute('aria-label', 'The staff: tap a line or a space');
          pic.append(ledger, note, name, staffHit);
          const KX = 28;
          const KY = 130;
          const KW = 24;
          const keys = NOTE_NAMES.split('').map((n, i) => {
            const key = r(KX + i * KW, KY, KW, 70, { f: '#fbf8f0', s: col.ink, w: 1, r: 2 });
            pic.append(key, t(KX + i * KW + KW / 2, KY + 62, n, { z: 10.5, w: 700, f: col.faint }));
            tap(key, `The key ${n}`, () => play(i, KX + i * KW + KW / 2, false));
            return key;
          });
          // The black keys are there to find your way by; they take the tap and do nothing with it.
          for (const i of [0, 1, 3, 4, 5, 7, 8]) pic.append(r(KX + (i + 1) * KW - 7, KY, 14, 42, { f: col.ink, s: col.ink, w: 1, r: 2 }));
          const ask = el('div', { class: 'demo-goal' });
          const GOALS = ['G', 'C', 'F', 'A'];
          let goal = 0;
          let timer = 0;
          let lit = -1;
          const askNow = () => {
            ask.classList.remove('ok');
            ask.textContent = goal < GOALS.length ? `Find ${GOALS[goal]} on the staff.` : 'You can read the staff now. Play on!';
          };
          const play = (q, x, onStaff) => {
            k2.audio?.piano?.(NOTE_HZ[q]);
            const y = ny(q);
            note.setAttribute('cx', String(x));
            note.setAttribute('cy', String(y));
            note.setAttribute('transform', `rotate(-18 ${x} ${y})`);
            note.setAttribute('opacity', '1');
            ledger.setAttribute('x1', String(x - 15));
            ledger.setAttribute('x2', String(x + 15));
            ledger.setAttribute('opacity', q === 0 ? '1' : '0');
            name.setAttribute('x', String(x));
            name.textContent = NOTE_NAMES[q];
            if (lit >= 0) keys[lit].setAttribute('fill', '#fbf8f0');
            keys[q].setAttribute('fill', '#f2c14e');
            lit = q;
            if (goal >= GOALS.length || ask.classList.contains('ok')) return;
            if (NOTE_NAMES[q] === GOALS[goal]) {
              if (!onStaff) {
                ask.textContent = `That key is ${NOTE_NAMES[q]}. See where it sits? Now tap it on the staff.`;
                return;
              }
              ask.textContent = `Yes, that is ${GOALS[goal]}.`;
              ask.classList.add('ok');
              goal += 1;
              timer = setTimeout(askNow, 1100);
            } else if (onStaff) ask.textContent = `That is ${NOTE_NAMES[q]}. Find ${GOALS[goal]}.`;
          };
          staffHit.addEventListener('click', (e) => {
            const m = pic.getScreenCTM();
            if (!m) return;
            const pt = pic.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const at = pt.matrixTransform(m.inverse());
            const q = Math.min(10, Math.max(0, Math.round(((BOTTOM - at.y) * 2) / GAP) + 2));
            play(q, Math.min(294, Math.max(70, at.x)), true);
          });
          host.append(ask, pic);
          askNow();
          return () => {
            clearTimeout(timer);
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ foxglove
  foxglove(k) {
    const { svg, T, L, P, C, G, COL, gsap } = k;
    const STEM = '#4f7a3a';
    const stem = P('M96 194 C92 150 98 90 104 22', { s: STEM, w: 3 });
    const leaves = [P('M96 192 C70 186 52 172 44 152 C70 154 88 168 96 186', { f: '#6f9b6a', s: STEM, w: 1 }), P('M97 190 C124 184 142 170 150 150 C124 152 106 166 97 184', { f: '#6f9b6a', s: STEM, w: 1 })];
    const along = (y) => 96 + ((194 - y) / 172) * 8; // the stem, near enough, at height y
    const bells = [];
    for (let i = 0; i < 9; i++) {
      const y = 128 - i * 12;
      const side = i % 2 ? 1 : -1;
      const z = 1.25 - i * 0.05;
      const sx = along(y);
      const bx = sx + side * 13 * z;
      const d = `M${bx} ${y + 2} q${side * 4 * z} ${2 * z} ${side * 5 * z} ${14 * z} q${-side * 5 * z} ${4 * z} ${-side * 11 * z} 0 q0 ${-10 * z} ${side * 6 * z} ${-14 * z} z`;
      bells.push(G({}, L(sx, y, bx, y + 3, { s: STEM, w: 1.4 }), P(d, { f: '#a24b8f', s: '#6d2e60', w: 1 })));
    }
    const buds = [C(along(24) + 3, 25, 3.2, { f: '#7fa86f', s: STEM, w: 0.8 }), C(along(32) - 4, 33, 3.6, { f: '#7fa86f', s: STEM, w: 0.8 })];
    const title = G({}, T(176, 40, 'Foxglove', { c: 'd', z: 20, w: 600, a: 'start' }), T(176, 58, 'Digitalis purpurea', { c: 'd', z: 12, i: true, f: COL.faint, a: 'start' }));
    // A heart, and its beat.
    const heart = P('M236 129 C197 102 209 69 236 90 C263 69 275 102 236 129 Z', { f: COL.red, s: 'none' });
    const beat = P('M178 160 H208 L214 148 L222 174 L228 152 L234 160 H294', { s: COL.red, w: 1.6 });
    // A dial for the dose: a little helps, a little more harms.
    const D = [236, 162];
    const RAD = 58;
    const pt = (deg, rr = RAD) => [D[0] + rr * Math.cos((deg * Math.PI) / 180), D[1] - rr * Math.sin((deg * Math.PI) / 180)];
    const arc = (a1, a2, f) => {
      const [x1, y1] = pt(a1);
      const [x2, y2] = pt(a2);
      const n = P(`M${x1.toFixed(1)} ${y1.toFixed(1)} A${RAD} ${RAD} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`, { s: f, w: 12 });
      n.setAttribute('stroke-linecap', 'butt');
      return n;
    };
    const helps = T(...pt(102, 78), 'helps', { c: 'u', z: 12.5, w: 700, f: COL.green });
    const harms = T(...pt(48, 80), 'harms', { c: 'u', z: 12.5, w: 700, f: COL.red });
    const needle = L(D[0], D[1], D[0] - 48, D[1], { s: COL.ink, w: 2.6 });
    const dial = G({}, arc(180, 112, '#cfc6b2'), arc(112, 92, COL.green), arc(92, 0, COL.red), helps, harms, needle, C(D[0], D[1], 5, { f: COL.ink, s: 'none' }), T(D[0], D[1] + 22, 'dose', { c: 'u', z: 11, f: COL.faint }));
    // A clock for the hours it takes.
    const CK = [236, 116];
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return L(CK[0] + 36 * Math.sin(a), CK[1] - 36 * Math.cos(a), CK[0] + 41 * Math.sin(a), CK[1] - 41 * Math.cos(a), { s: COL.ink, w: i % 3 ? 1 : 2 });
    });
    const hourHand = L(CK[0], CK[1], CK[0], CK[1] - 22, { s: COL.ink, w: 3.2 });
    const minuteHand = L(CK[0], CK[1], CK[0], CK[1] - 33, { s: COL.ink, w: 2 });
    const clock = G({}, C(CK[0], CK[1], 46, { f: CREAM, s: COL.ink, w: 1.6 }), ...ticks, hourHand, minuteHand, C(CK[0], CK[1], 3.5, { f: COL.ink, s: 'none' }), T(CK[0], CK[1] + 70, 'hours', { c: 'u', z: 12, w: 600, f: COL.faint }));
    svg.append(...leaves, stem, ...bells, ...buds, title, heart, beat, dial, clock);
    k.undraw(stem);
    k.undraw(beat);
    k.hide(leaves, bells, buds, title, heart, dial, clock);
    return {
      steps: [
        {
          say: 'Foxglove: a tall purple flower of the hedgerows.',
          run: (tl) =>
            tl
              .to(stem, { strokeDashoffset: 0, duration: 0.7, ease: 'power1.out' })
              .fromTo(leaves, { opacity: 0, scale: 0.3, transformOrigin: '50% 100%' }, { opacity: 1, scale: 1, transformOrigin: '50% 100%', duration: 0.35, stagger: 0.1 }, 0.1)
              .fromTo(bells, { opacity: 0, scale: 0.2, transformOrigin: '50% 0%' }, { opacity: 1, scale: 1, transformOrigin: '50% 0%', duration: 0.25, stagger: 0.08, ease: 'back.out(2)' }, 0.5)
              .to(buds, { opacity: 1, duration: 0.2 })
              .to(title, { opacity: 1, duration: 0.3 }),
        },
        {
          say: 'It is one of the oldest heart medicines.',
          run: (tl) =>
            tl
              .fromTo(heart, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.35 })
              .to(beat, { strokeDashoffset: 0, duration: 1.2, ease: 'none' })
              .to(heart, { scale: 1.15, duration: 0.12, yoyo: true, repeat: 1 }, '<0.3')
              .to(heart, { scale: 1.15, duration: 0.12, yoyo: true, repeat: 1 }, '<0.55'),
        },
        {
          say: 'The dose that helps is close to the dose that harms.',
          run: (tl) =>
            tl
              .to([heart, beat], { opacity: 0, duration: 0.25 })
              .to(dial, { opacity: 1, duration: 0.3 })
              .to(needle, { rotation: 78, svgOrigin: `${D[0]} ${D[1]}`, duration: 0.6, ease: 'power2.out' })
              .to(helps, { scale: 1.2, transformOrigin: '50% 50%', duration: 0.12, yoyo: true, repeat: 1 })
              .to(needle, { rotation: 97, svgOrigin: `${D[0]} ${D[1]}`, duration: 0.3, ease: 'power1.inOut' }, '+=0.1')
              .to(harms, { scale: 1.25, transformOrigin: '50% 50%', duration: 0.12, yoyo: true, repeat: 1 })
              .to(needle, { rotation: 80, svgOrigin: `${D[0]} ${D[1]}`, duration: 0.3, ease: 'power1.inOut' }),
        },
        {
          say: 'It works slowly, over several hours.',
          run: (tl) =>
            tl
              .to(dial, { opacity: 0, duration: 0.25 })
              .to(clock, { opacity: 1, duration: 0.3 })
              .to(minuteHand, { rotation: 360 * 5, svgOrigin: `${CK[0]} ${CK[1]}`, duration: 1.8, ease: 'power1.inOut' })
              .to(hourHand, { rotation: 150, svgOrigin: `${CK[0]} ${CK[1]}`, duration: 1.8, ease: 'power1.inOut' }, '<'),
        },
      ],
    };
  },

  // ------------------------------------------------------------------ the pneumatic post
  bellows(k) {
    const { svg, T, L, R, C, G, COL, gsap } = k;
    // The pipe, and the exchange that the carrier stops in.
    svg.append(R(-4, 36, 328, 22, { f: '#c9c2b0', s: '#6d675a', w: 1.2, r: 0 }), L(0, 41, 320, 41, { s: '#e4dfd2', w: 2 }));
    const streaks = G({}, L(-50, -4, -34, -4, { s: COL.faint, w: 1.4 }), L(-56, 0, -32, 0, { s: COL.faint, w: 1.4 }), L(-50, 4, -34, 4, { s: COL.faint, w: 1.4 }));
    const carrier = G({}, streaks, R(-24, -8, 48, 16, { f: BRASS_PLATE, s: BRASS_EDGE, w: 1.2, r: 8 }), R(-5, -9.5, 10, 19, { f: '#a8782e', s: BRASS_EDGE, w: 1, r: 2 }));
    gsap.set(carrier, { x: -34, y: 47 });
    const pin = G({}, R(154, 8, 12, 9, { f: COL.ink, s: 'none', r: 2 }), L(160, 17, 160, 25, { s: COL.ink, w: 2 }));
    const housing = G({}, R(126, 24, 68, 10, { f: '#b08a3e', s: BRASS_EDGE, r: 3 }), R(126, 60, 68, 10, { f: '#b08a3e', s: BRASS_EDGE, r: 3 }));
    svg.append(carrier, housing, pin, T(200, 31, 'exchange', { c: 'u', z: 10.5, f: COL.faint, a: 'start' }));
    // The collar, close up: a row of holes for the hour in, and one for the hour out.
    const VALUES = [16, 8, 4, 2, 1];
    const hx = (i) => 104 + i * 34;
    const ROW = { IN: 138, OUT: 170 };
    const ENGRAVED = '#6b4a14';
    const holes = { IN: [], OUT: [] };
    const zoom = G(
      {},
      L(160, 58, 52, 90, { s: COL.faint, w: 1, d: '3 4' }),
      L(160, 58, 256, 90, { s: COL.faint, w: 1, d: '3 4' }),
      R(52, 90, 204, 100, { f: BRASS_PLATE, s: BRASS_EDGE, w: 1.4, r: 10 }),
      T(84, 142, 'IN', { c: 'u', z: 11, w: 700, a: 'end' }),
      T(84, 174, 'OUT', { c: 'u', z: 11, w: 700, a: 'end' }),
    );
    for (const row of ['IN', 'OUT']) VALUES.forEach((_, i) => zoom.append((holes[row][i] = C(hx(i), ROW[row], 8, { f: '#ecd9a6', s: BRASS_EDGE, w: 1 }))));
    const values = VALUES.map((v, i) => T(hx(i), 112, String(v), { z: 12.5, w: 700, f: ENGRAVED }));
    const twice = [0, 1, 2, 3].map((i) => T(hx(i) + 17, 111, '×2', { c: 'u', z: 9.5, f: '#8a6a33' }));
    const totals = { IN: T(264, 143, '', { z: 15, w: 700, f: COL.green, a: 'start' }), OUT: T(264, 175, '', { z: 15, w: 700, f: COL.green, a: 'start' }) };
    svg.append(zoom, ...values, ...twice, totals.IN, totals.OUT);
    k.hide(zoom, values, twice, totals.IN, totals.OUT);
    const punch = (tl, row, which) => {
      for (const i of which) {
        tl.to(holes[row][i], { attr: { fill: COL.ink, stroke: COL.ink }, scale: 1.3, transformOrigin: '50% 50%', duration: 0.12 }).to(holes[row][i], { scale: 1, duration: 0.15 });
        sound(tl, () => k.audio?.tick?.());
      }
    };
    const strike = (tl) => tl.to(pin, { y: 7, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.in' });
    return {
      steps: [
        {
          say: 'Air blows a brass carrier along the pipe.',
          run: (tl) => tl.to(carrier, { x: 160, duration: 1.3, ease: 'power3.out' }).to(streaks, { opacity: 0, duration: 0.6 }, '<0.6'),
        },
        {
          say: 'The exchange punches the hour it went in.',
          run: (tl) => {
            strike(tl);
            tl.to(zoom, { opacity: 1, duration: 0.4 });
            punch(tl, 'IN', [1, 4]);
          },
        },
        {
          say: 'Each hole is worth twice the one to its right.',
          run: (tl) => {
            for (let i = 4; i >= 0; i--) {
              tl.to(values[i], { opacity: 1, duration: 0.22 });
              if (i > 0) tl.to(twice[i - 1], { opacity: 1, duration: 0.18 });
            }
          },
        },
        {
          say: 'IN: 8 + 1 = 9, so it went in at nine in the morning.',
          run: (tl) => {
            const o = { v: 0 };
            tl.to([values[1], values[4]], { attr: { fill: COL.green }, scale: 1.3, transformOrigin: '50% 50%', duration: 0.2 })
              .to([holes.IN[1], holes.IN[4]], { attr: { stroke: COL.green }, duration: 0.2 }, '<')
              .to([values[1], values[4]], { scale: 1, duration: 0.2 })
              .to(totals.IN, { opacity: 1, duration: 0.2 })
              .to(o, { v: 9, duration: 0.5, ease: 'power1.out', onUpdate: () => (totals.IN.textContent = `= ${Math.round(o.v)}`) }, '<');
          },
        },
        {
          say: 'OUT: 8 + 4 + 1 = 13, one in the afternoon.',
          run: (tl) => {
            const o = { v: 0 };
            tl.to([values[1], values[4]], { attr: { fill: ENGRAVED }, duration: 0.2 });
            strike(tl);
            punch(tl, 'OUT', [1, 2, 4]);
            tl.to([values[1], values[2], values[4]], { attr: { fill: COL.green }, duration: 0.2 })
              .to(totals.OUT, { opacity: 1, duration: 0.2 })
              .to(o, { v: 13, duration: 0.5, ease: 'power1.out', onUpdate: () => (totals.OUT.textContent = `= ${Math.round(o.v)}`) }, '<')
              .to(carrier, { x: 360, duration: 0.6, ease: 'power3.in' }, '<');
          },
        },
      ],
      tryIt: {
        say: 'Your turn: punch the holes to set the hour.',
        mount(host, k2) {
          const { card, T: t, R: r, C: c, COL: col, el } = k2;
          const { svg: pic } = card(320, 150);
          pic.classList.add('demo-svg');
          const hx2 = (i) => 104 + i * 30;
          const ROWS = [
            { name: 'IN', y: 62 },
            { name: 'OUT', y: 112 },
          ];
          pic.append(r(56, 34, 196, 104, { f: BRASS_PLATE, s: BRASS_EDGE, w: 1.4, r: 10 }));
          VALUES.forEach((v, i) => pic.append(t(hx2(i), 24, String(v), { z: 13, w: 700, f: col.brass })));
          const on = [
            [false, false, false, false, false],
            [false, false, false, false, false],
          ];
          const rows = ROWS.map((row, ri) => {
            pic.append(t(86, row.y + 4, row.name, { c: 'u', z: 12, w: 700, a: 'end' }));
            const dots = VALUES.map((v, i) => {
              const hole = c(hx2(i), row.y, 10, { f: '#ecd9a6', s: BRASS_EDGE, w: 1.2 });
              pic.append(
                hole,
                tap(r(hx2(i) - 15, row.y - 22, 30, 44, { f: 'transparent', s: 'none' }), `${row.name}: the hole worth ${v}`, () => {
                  on[ri][i] = !on[ri][i];
                  k2.audio?.tick?.();
                  draw();
                }),
              );
              return hole;
            });
            const sum = t(262, row.y + 3, '', { z: 16, w: 700, f: col.green, a: 'start' });
            const clock = t(262, row.y + 19, '', { z: 11, f: col.faint, a: 'start' });
            pic.append(sum, clock);
            return { dots, sum, clock };
          });
          const GOALS = [
            { row: 0, h: 6, ask: 'It went in at six in the morning. Punch the IN row.' },
            { row: 1, h: 17, ask: 'It came out at five in the afternoon. Punch OUT.' },
            { row: 0, h: 10, ask: 'A new carrier: in at ten in the morning.', fresh: true },
            { row: 1, h: 23, ask: 'And out at eleven at night.' },
          ];
          const ask = el('div', { class: 'demo-goal' });
          let goal = 0;
          let timer = 0;
          const hour = (ri) => VALUES.reduce((a, v, i) => a + (on[ri][i] ? v : 0), 0);
          const setGoal = () => {
            ask.classList.remove('ok');
            if (goal >= GOALS.length) {
              ask.textContent = 'You can read a collar now.';
              return;
            }
            if (GOALS[goal].fresh) on.forEach((row) => row.fill(false));
            ask.textContent = GOALS[goal].ask;
            draw();
          };
          const draw = () => {
            rows.forEach((row, ri) => {
              const n = hour(ri);
              row.dots.forEach((hole, i) => hole.setAttribute('fill', on[ri][i] ? col.ink : '#ecd9a6'));
              row.sum.textContent = `= ${n}`;
              row.clock.textContent = n < 24 ? `${String(n).padStart(2, '0')}:00` : 'no hour';
            });
            const G0 = GOALS[goal];
            if (G0 && !ask.classList.contains('ok') && hour(G0.row) === G0.h) {
              const parts = VALUES.filter((_, i) => on[G0.row][i]);
              ask.textContent = `Yes: ${parts.join(' + ')} = ${G0.h}.`;
              ask.classList.add('ok');
              goal += 1;
              timer = setTimeout(setGoal, 1300);
            }
          };
          host.append(ask, pic);
          setGoal();
          draw();
          return () => {
            clearTimeout(timer);
            host.replaceChildren();
          };
        },
      },
    };
  },
};
