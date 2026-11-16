// How-tos for two cards of the case: foxglove, and the pneumatic post (the Bellows).
// Same contract as core.js.
//
// Every example here is made up for the lesson. None of them is a puzzle in the game, and
// none of them gives away a puzzle's answer.

/** @typedef {any} Kit */

/**
 * A sound at this point of the timeline (or at `at`). It is heard when the step plays, and kept
 * quiet when the player jumps to the end of a step (the timeline is paused then), or hurries a
 * playing step to its end: then the playhead is further past the sound than one frame moves it.
 */
function sound(k, tl, play, at = tl.duration()) {
  tl.call(
    () => {
      if (tl.paused()) return;
      const frame = (k.gsap.ticker.deltaRatio?.(60) ?? 1) / 60;
      if (tl.time() - at <= frame + 0.05) play();
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

// Shared colours.
const CREAM = '#fbf6ea';
const BRASS_PLATE = '#d9b46a';
const BRASS_EDGE = '#7a5a23';

export const PUZZLES = {
  // ------------------------------------------------------------------ foxglove
  foxglove(k) {
    const { svg, T, L, P, C, G, COL } = k;
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
        sound(k, tl, () => k.audio?.tick?.());
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
