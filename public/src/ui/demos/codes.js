// How-tos for codes, maps, boards and words: letters as numbers, a heat chart, latitude and
// longitude, the sun's height, local time, chess squares, letter-locks, the Nina, clues
// and the meta. Same contract as core.js: each demo draws its first frame, and each
// step adds its animation to the paused timeline it is given.
// Every example here is made up for the how-to; none is the answer to a puzzle in the game.

/** @typedef {any} Kit */

/** A unique id for a clip path. */
const uid = () => `q${Math.random().toString(36).slice(2, 9)}`;

/** Where a pointer event falls, in a picture's own units. */
function spot(pic, e) {
  const box = pic.getBoundingClientRect();
  const [vx, vy, vw, vh] = (pic.getAttribute('viewBox') ?? '0 0 320 200').split(/[\s,]+/).map(Number);
  return [vx + ((e.clientX - box.left) / box.width) * vw, vy + ((e.clientY - box.top) / box.height) * vh];
}

/** A clear tap target over part of a picture. */
function tapZone(k, x, y, w, h, label, fn) {
  const r = k.R(x, y, w, h, { f: 'transparent', s: 'none', r: 0 });
  r.style.cursor = 'pointer';
  r.setAttribute('role', 'button');
  r.setAttribute('aria-label', label);
  r.addEventListener('click', fn);
  return r;
}

/** Count a text node from one whole number to another, as part of a timeline. */
function countUp(tl, node, from, to, fmt, duration = 1, pos) {
  const o = { v: from };
  const show = () => {
    node.textContent = fmt(Math.round(o.v));
  };
  return tl.to(o, { v: to, duration, ease: 'power1.inOut', onUpdate: show, onComplete: show }, pos);
}

/**
 * Follow a finger or the mouse from a press on `pic` until it lets go: `onMove` with each
 * pointer event, `onEnd` when it lets go. Returns a function that stops listening.
 */
function follow(pic, onMove, onEnd) {
  let on = false;
  const down = (e) => {
    on = true;
    e.preventDefault();
    onMove(e);
  };
  const move = (e) => {
    if (on) onMove(e);
  };
  const end = () => {
    if (!on) return;
    on = false;
    onEnd();
  };
  pic.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  return () => {
    pic.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
  };
}

/** 1st, 2nd, 3rd, 4th … */
const nth = (n) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

/** Timers a try-it starts, so its cleanup can stop them. */
function timers() {
  const ids = [];
  return {
    later(fn, ms) {
      ids.push(setTimeout(fn, ms));
    },
    stop() {
      for (const id of ids.splice(0)) clearTimeout(id);
    },
  };
}

export const CODES = {
  // ------------------------------------------------------------------ letters as numbers
  ascii(k) {
    const { svg, s, T, R, G, COL } = k;
    const cols = [['A', 65], ['B', 66], ['C', 67], null, ['L', 76], null, ['Z', 90]];
    const x = (i) => 84 + i * 36;
    const hexOf = (n) => n.toString(16).toUpperCase();
    svg.append(T(12, 34, 'letter', { c: 'u', z: 10.5, f: COL.faint, a: 'start' }), T(12, 60, 'number', { c: 'u', z: 10.5, f: COL.faint, a: 'start' }), T(12, 86, 'hex', { c: 'u', z: 10.5, f: COL.faint, a: 'start' }));
    const letters = cols.map((c, i) => T(x(i), 34, c ? c[0] : '…', { z: 17, w: 700, f: c ? COL.ink : COL.faint }));
    const nums = cols.map((c, i) => T(x(i), 60, c ? String(c[1]) : '…', { z: 13, f: c ? COL.ink : COL.faint }));
    const hexes = cols.map((c, i) => {
      const t = T(x(i), 86, c ? '' : '…', { z: 14, w: 700, f: c ? COL.brass : COL.faint });
      if (!c) return { t };
      const [a, b] = hexOf(c[1]);
      const d1 = s('tspan', {}, a);
      const d2 = s('tspan', {}, b);
      t.append(d1, d2);
      return { t, d1, d2 };
    });
    // The sixteen digits of hexadecimal: after 9 come A to F, for ten to fifteen.
    const digits = '0123456789ABCDEF'.split('').map((d, j) => {
      const dx = 22 + j * 18.4;
      const ring = k.C(dx, 108, 8.5, { f: 'none', s: COL.green, w: 1.6 });
      const g = G({}, ring, T(dx, 112, d, { z: 12, w: 700, f: j > 9 ? COL.brass : COL.ink }), j > 9 ? T(dx, 128, String(j), { z: 9.5, f: COL.faint }) : null);
      return { g, ring };
    });
    const boxes = cols.map((_, i) => R(x(i) - 16, 18, 32, 76, { s: COL.green, w: 1.6, r: 6 }));
    const why = (code, text, y) => G({}, T(56, y, code, { z: 14, w: 700, f: COL.brass }), T(80, y, text, { c: 'u', z: 12, a: 'start' }));
    const four = [why('41', '1: the 1st letter, A', 156), why('4C', 'C is 12: the 12th letter, L', 178)];
    const five = [why('50', '0 + 16 = 16: the 16th letter, P', 156), why('5A', '10 + 16 = 26: the 26th letter, Z', 178)];
    svg.append(...boxes, ...letters, ...nums, ...hexes.map((h) => h.t), ...digits.map((d) => d.g), ...four, ...five);
    k.hide(letters, nums, hexes.map((h) => h.t), digits.map((d) => d.g), digits.map((d) => d.ring), boxes, four, five);
    const glow = (tspan) => (tl, pos) => tl.to(tspan, { attr: { fill: COL.green }, duration: 0.3 }, pos);
    return {
      steps: [
        {
          say: 'Every capital letter has a number: A is 65, Z is 90.',
          run: (tl) => {
            tl.to(letters, { opacity: 1, duration: 0.25, stagger: 0.08 });
            tl.fromTo(nums, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.12, ease: 'back.out(2)' });
          },
        },
        {
          say: 'Engineers write them in hex: A is 41, Z is 5A.',
          run: (tl) => {
            tl.fromTo(hexes.map((h) => h.t), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.12, ease: 'back.out(2)' });
            tl.to(digits.map((d) => d.g), { opacity: 1, duration: 0.2, stagger: 0.05 }, '+=0.2');
          },
        },
        {
          say: 'Starts with 4? The next digit is its place in the alphabet.',
          run: (tl) => {
            tl.to([boxes[0], digits[1].ring], { opacity: 1, duration: 0.3 });
            glow(hexes[0].d2)(tl, '<');
            tl.to(four[0], { opacity: 1, duration: 0.3 });
            tl.to([boxes[4], digits[12].ring], { opacity: 1, duration: 0.3 }, '+=0.4');
            glow(hexes[4].d2)(tl, '<');
            tl.to(four[1], { opacity: 1, duration: 0.3 });
          },
        },
        {
          say: 'Starts with 5? Add sixteen to the next digit.',
          run: (tl) => {
            tl.to([boxes[0], boxes[4], digits[1].ring, digits[12].ring, ...four], { opacity: 0, duration: 0.3 });
            tl.to([hexes[0].d2, hexes[4].d2], { attr: { fill: COL.brass }, duration: 0.3 }, '<');
            tl.to([digits[0].ring, five[0]], { opacity: 1, duration: 0.3 });
            tl.to([boxes[6], digits[10].ring], { opacity: 1, duration: 0.3 }, '+=0.4');
            glow(hexes[6].d2)(tl, '<');
            tl.to(five[1], { opacity: 1, duration: 0.3 });
          },
        },
      ],
      tryIt: {
        say: 'Your turn: tap a letter to see its number and hex.',
        mount(host, k2) {
          const { card, T: t, R: r, COL: c, ABC: abc, el } = k2;
          const { svg: pic } = card(320, 172);
          pic.classList.add('demo-svg');
          pic.append(r(18, 12, 64, 64, { f: '#efe3c6', s: '#b49863', r: 8 }), t(150, 28, 'number', { c: 'u', z: 11, f: c.faint }), t(250, 28, 'hex', { c: 'u', z: 11, f: c.faint }));
          const big = t(50, 59, 'A', { z: 40, w: 700 });
          const num = t(150, 64, '65', { z: 26 });
          const hx = t(250, 64, '41', { z: 26, w: 700, f: c.brass });
          const line = t(160, 98, '', { c: 'u', z: 12, f: c.green, w: 600 });
          pic.append(big, num, hx, line);
          let at = 0;
          const keys = abc.split('').map((ch, i) => {
            const kx = 11 + (i % 13) * 23;
            const ky = i < 13 ? 112 : 140;
            const bg = r(kx, ky, 21, 24, { f: '#efe3c6', s: '#cbb98f', r: 4 });
            pic.append(bg, t(kx + 10.5, ky + 17, ch, { z: 13, w: 700 }));
            pic.append(
              tapZone(k2, kx - 1, ky - 2, 23, 28, `The letter ${ch}`, () => {
                at = i;
                k2.audio?.tick?.();
                draw();
              }),
            );
            return bg;
          });
          const why = (i) => {
            const h = (65 + i).toString(16).toUpperCase();
            const d = parseInt(h[1], 16);
            const named = d > 9 ? `${h[1]} is ${d}` : '';
            if (h[0] === '4') return `${h}: ${named ? `${named}, so ` : ''}the ${nth(i + 1)} letter`;
            return `${h}: ${named ? `${named}. ` : ''}${d} + 16 = ${i + 1}, the ${nth(i + 1)} letter`;
          };
          const goals = ['4E', '52', '47'];
          let g = 0;
          const ask = el('div', { class: 'demo-goal' });
          const label = el('b', { class: 'demo-num', text: 'A' });
          const minus = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'The letter before', text: '−' });
          const plus = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'The letter after', text: '+' });
          const clock = timers();
          const draw = () => {
            const h = (65 + at).toString(16).toUpperCase();
            big.textContent = abc[at];
            label.textContent = abc[at];
            num.textContent = String(65 + at);
            hx.textContent = h;
            line.textContent = why(at);
            keys.forEach((bg, i) => {
              bg.setAttribute('fill', i === at ? '#f2d9a0' : '#efe3c6');
              bg.setAttribute('stroke', i === at ? c.brass : '#cbb98f');
            });
            if (g < goals.length && h === goals[g]) {
              ask.textContent = `Yes: ${h} is ${abc[at]}.`;
              ask.classList.add('ok');
              g++;
              clock.later(() => {
                ask.classList.remove('ok');
                ask.textContent = g < goals.length ? `Now find ${goals[g]}.` : 'You can read letters as numbers now.';
              }, 1100);
            } else if (!ask.classList.contains('ok')) ask.textContent = g < goals.length ? `Which letter is ${goals[g]}?` : 'You can read letters as numbers now.';
          };
          minus.addEventListener('click', () => {
            at = (at + 25) % 26;
            k2.audio?.tick?.();
            draw();
          });
          plus.addEventListener('click', () => {
            at = (at + 1) % 26;
            k2.audio?.tick?.();
            draw();
          });
          host.append(ask, pic, el('div', { class: 'demo-controls' }, minus, label, plus));
          draw();
          return () => {
            clock.stop();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ reading a heat chart
  charts(k) {
    const { svg, T, R, G, COL } = k;
    const hours = ['20', '21', '22', '23', '00', '01', '02', '03'];
    const rows = ['Mill', 'Dock', 'Inn', 'Yard', 'Shop'];
    const top = 180;
    const cx = (j) => 74 + j * 28;
    const cy = (i) => 34 + i * 20;
    const shade = (v) => (v ? `rgba(143,224,176,${(0.12 + (0.88 * v) / top).toFixed(3)})` : 'rgba(255,255,255,0.05)');
    svg.append(R(8, 8, 304, 134, { f: '#16201b', s: 'none', r: 8 }));
    const heads = hours.map((h, j) => T(cx(j) + 12, 25, h, { z: 10, f: '#8fcfa9' }));
    const names = rows.map((name, i) => T(66, cy(i) + 12, name, { c: 'u', z: 10.5, f: '#b9dcc6', a: 'end' }));
    const cells = CHART.map((row, i) => row.map((v, j) => R(cx(j), cy(i), 24, 16, { f: shade(v), s: 'none', r: 2 })));
    const frame = R(cx(0) - 3, 30, 30, 104, { s: '#f2b45a', w: 1.8, r: 4 });
    const yours = T(cx(0) + 12, 156, 'your hour', { c: 'u', z: 10.5, f: COL.brass, w: 700 });
    const ring = R(cx(3) - 2.5, cy(1) - 2.5, 29, 21, { s: '#f2b45a', w: 2.2, r: 4 });
    const wrong = R(cx(1) - 2.5, cy(2) - 2.5, 29, 21, { s: '#ff8a7a', w: 1.8, r: 4, d: '3 2' });
    const wrongNote = T(cx(1) + 12, 174, 'brightest, wrong hour', { c: 'u', z: 10.5, f: COL.red, w: 600 });
    const cellGroup = G({}, cells.flat());
    svg.append(...heads, ...names, cellGroup, frame, yours, ring, wrong, wrongNote);
    k.hide(heads, names, cells.flat(), frame, yours, ring, wrong, wrongNote);
    return {
      steps: [
        {
          say: 'Each row is a place. Each column is an hour of the night.',
          run: (tl) => tl.to(names, { opacity: 1, duration: 0.25, stagger: 0.1 }).to(heads, { opacity: 1, duration: 0.2, stagger: 0.08 }),
        },
        {
          say: 'The brighter the square, the more nights it was busy.',
          run: (tl) => {
            hours.forEach((_, j) => tl.to(cells.map((row) => row[j]), { opacity: 1, duration: 0.3 }, j * 0.16));
          },
        },
        {
          say: 'First, find the column for the hour you want.',
          run: (tl) => {
            tl.to([frame, yours], { opacity: 1, duration: 0.3 });
            tl.to([frame, yours], { x: 3 * 28, duration: 1.2, ease: 'power2.inOut' });
            tl.to(heads[3], { attr: { fill: '#f2b45a' }, duration: 0.3 });
          },
        },
        {
          say: 'Then look down it for the brightest square.',
          run: (tl) => {
            tl.to(ring, { opacity: 1, duration: 0.3 });
            tl.to(names[1], { attr: { fill: '#f2b45a' }, duration: 0.3 }, '<');
            tl.fromTo(ring, { scale: 1.6, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'back.out(2)' }, '<');
            tl.call(() => {
              k.loop(k.gsap.to(cells[1][3], { opacity: 0.55, duration: 0.6, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
            });
          },
        },
        {
          say: 'The brightest square of all may be at the wrong hour.',
          run: (tl) => tl.to(wrong, { opacity: 1, duration: 0.4 }).to(wrongNote, { opacity: 1, duration: 0.4 }),
        },
      ],
      tryIt: {
        say: 'Your turn: tap a square to read how many nights.',
        mount(host, k2) {
          const { card, T: t, R: r, COL: c, el } = k2;
          const { svg: pic } = card(320, 204);
          pic.classList.add('demo-svg');
          const px = (j) => 68 + j * 29.5;
          const py = (i) => 34 + i * 27;
          pic.append(r(8, 8, 304, 166, { f: '#16201b', s: 'none', r: 8 }));
          hours.forEach((h, j) => pic.append(t(px(j) + 13.5, 25, h, { z: 10.5, f: '#8fcfa9' })));
          const labels = rows.map((name, i) => {
            const n = t(60, py(i) + 16, name, { c: 'u', z: 11, f: '#b9dcc6', a: 'end' });
            pic.append(n);
            return n;
          });
          const mark = r(0, 0, 31, 27, { s: '#ffffff', w: 2, r: 4 });
          mark.style.opacity = '0';
          const read = t(160, 194, 'Brighter means more nights.', { c: 'u', z: 13, w: 700, f: c.faint });
          const goals = [2, 5];
          let g = 0;
          const ask = el('div', { class: 'demo-goal' });
          const clock = timers();
          const say = () => (g < goals.length ? `Busiest place at ${hours[goals[g]]}:00? Tap it.` : 'You can read a heat chart now.');
          CHART.forEach((row, i) =>
            row.forEach((v, j) => {
              pic.append(r(px(j), py(i), 27, 23, { f: shade(v), s: 'none', r: 2 }));
              pic.append(
                tapZone(k2, px(j) - 1, py(i) - 2, 29.5, 27, `${rows[i]} at ${hours[j]}:00`, () => {
                  k2.audio?.tick?.();
                  mark.setAttribute('x', String(px(j) - 2));
                  mark.setAttribute('y', String(py(i) - 2));
                  mark.style.opacity = '1';
                  labels.forEach((n, ii) => n.setAttribute('fill', ii === i ? '#f2b45a' : '#b9dcc6'));
                  read.textContent = `${rows[i]} at ${hours[j]}:00: ${v ? `${v} nights` : 'no nights'}`;
                  read.setAttribute('fill', c.ink);
                  if (g >= goals.length || ask.classList.contains('ok') || j !== goals[g]) return;
                  const best = Math.max(...CHART.map((rr) => rr[j]));
                  if (v === best) {
                    ask.textContent = `Yes: ${rows[i]}, ${v} nights.`;
                    ask.classList.add('ok');
                    g++;
                    clock.later(() => {
                      ask.classList.remove('ok');
                      ask.textContent = say();
                    }, 1300);
                  } else ask.textContent = 'Right hour. Is there a brighter square in it?';
                }),
              );
            }),
          );
          pic.append(mark, read);
          ask.textContent = say();
          host.append(ask, pic);
          return () => {
            clock.stop();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ latitude and longitude
  atlas(k) {
    const { svg, T, L, R, C, G, COL } = k;
    // The whole world: 360 degrees across and 180 up and down, at 0.8 units a degree.
    const X = (lon) => 160 + lon * 0.8;
    const Y = (lat) => 96 - lat * 0.8;
    svg.append(R(16, 24, 288, 144, { f: '#dfe9ee', s: '#9db3bf', r: 6 }));
    for (let d = -150; d <= 150; d += 30) if (d) svg.append(L(X(d), 24, X(d), 168, { s: '#c2d2da', w: 0.8 }));
    for (let d = -60; d <= 60; d += 30) if (d) svg.append(L(16, Y(d), 304, Y(d), { s: '#c2d2da', w: 0.8 }));
    svg.append(T(160, 18, 'N', { c: 'u', z: 10, f: COL.faint, w: 700 }), T(160, 182, 'S', { c: 'u', z: 10, f: COL.faint, w: 700 }));
    const equator = k.undraw(L(16, 96, 304, 96, { s: COL.red, w: 1.8 }));
    const greenwich = k.undraw(L(160, 24, 160, 168, { s: COL.blue, w: 1.8 }));
    const eqName = T(300, 91, 'equator  0°', { c: 'u', z: 10, f: COL.red, a: 'end', w: 600 });
    const grName = T(155, 36, 'Greenwich  0°', { c: 'u', z: 10, f: COL.blue, a: 'end', w: 600 });
    const latNum = T(22, 92, '0°', { z: 11, w: 700, f: COL.red, a: 'start' });
    const lat = G({}, L(16, 96, 304, 96, { s: COL.red, w: 1.4, d: '4 3' }), latNum);
    const lonNum = T(164, 162, '0°', { z: 11, w: 700, f: COL.blue, a: 'start' });
    const lon = G({}, L(160, 24, 160, 168, { s: COL.blue, w: 1.4, d: '4 3' }), lonNum);
    const [px, py] = [X(60), Y(30)];
    const pin = G({}, C(px, py, 6, { f: COL.brass, s: COL.ink, w: 1.2 }), C(px - 1.8, py - 1.8, 1.6, { f: '#fbe7b5', s: 'none' }));
    const tag = G({}, R(px - 46, py - 28, 92, 17, { f: COL.paper, s: COL.ink, w: 1, r: 4 }), T(px, py - 15.5, '30° N, 60° E', { z: 11, w: 700 }));
    svg.append(equator, greenwich, eqName, grName, lat, lon, pin, tag);
    k.hide(eqName, grName, lat, lon, pin, tag);
    return {
      steps: [
        {
          say: 'Two lines start at zero: the equator and Greenwich.',
          run: (tl) => {
            tl.to(equator, { strokeDashoffset: 0, duration: 0.8, ease: 'power1.inOut' }).to(eqName, { opacity: 1, duration: 0.3 });
            tl.to(greenwich, { strokeDashoffset: 0, duration: 0.7, ease: 'power1.inOut' }).to(grName, { opacity: 1, duration: 0.3 });
          },
        },
        {
          say: 'Latitude: how far up or down from the equator.',
          run: (tl) => {
            tl.to(lat, { opacity: 1, duration: 0.3 });
            tl.to(lat, { y: Y(30) - 96, duration: 1.4, ease: 'power1.inOut' });
            countUp(tl, latNum, 0, 30, (v) => (v ? `${v}° N` : '0°'), 1.4, '<');
          },
        },
        {
          say: 'Longitude: how far east or west of Greenwich.',
          run: (tl) => {
            tl.to(lon, { opacity: 1, duration: 0.3 });
            tl.to(lon, { x: X(60) - 160, duration: 1.4, ease: 'power1.inOut' });
            countUp(tl, lonNum, 0, 60, (v) => (v ? `${v}° E` : '0°'), 1.4, '<');
          },
        },
        {
          say: 'Where they cross is the place. Say latitude first.',
          run: (tl) => {
            tl.fromTo(pin, { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.5, ease: 'bounce.out' });
            tl.fromTo(tag, { opacity: 0, scale: 0.6, transformOrigin: '50% 100%' }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' });
          },
        },
      ],
      tryIt: {
        say: 'Your turn: drag the pin and read where it is.',
        mount(host, k2) {
          const { card, T: t, L: l, R: r, C: c, COL: col, el } = k2;
          const { svg: pic } = card(320, 196);
          pic.classList.add('demo-svg');
          pic.style.touchAction = 'none';
          pic.style.cursor = 'crosshair';
          pic.append(r(16, 24, 288, 144, { f: '#dfe9ee', s: '#9db3bf', r: 6 }));
          for (let d = -150; d <= 150; d += 30) if (d) pic.append(l(X(d), 24, X(d), 168, { s: '#c2d2da', w: 0.8 }));
          for (let d = -60; d <= 60; d += 30) if (d) pic.append(l(16, Y(d), 304, Y(d), { s: '#c2d2da', w: 0.8 }));
          pic.append(l(16, 96, 304, 96, { s: col.red, w: 1.6 }), l(160, 24, 160, 168, { s: col.blue, w: 1.6 }), t(160, 18, 'N', { c: 'u', z: 10, f: col.faint, w: 700 }));
          const up = l(0, 96, 0, 96, { s: col.red, w: 1.6, d: '4 3' });
          const across = l(160, 0, 160, 0, { s: col.blue, w: 1.6, d: '4 3' });
          const head = c(0, 0, 7, { f: col.brass, s: col.ink, w: 1.3 });
          const read = t(160, 188, '', { z: 15, w: 700 });
          pic.append(up, across, head, read);
          const name = (v, plus, minus) => (v > 0 ? `${v}° ${plus}` : v < 0 ? `${-v}° ${minus}` : '0°');
          const goals = [[60, -30], [-30, 120], [30, -150]];
          let gi = 0;
          let now = [30, 60];
          const ask = el('div', { class: 'demo-goal' });
          const clock = timers();
          const say = () => (gi < goals.length ? `Put the pin on ${name(goals[gi][0], 'N', 'S')}, ${name(goals[gi][1], 'E', 'W')}.` : 'You can find any place by two numbers now.');
          const draw = () => {
            const [la, lo] = now;
            const [hx, hy] = [X(lo), Y(la)];
            for (const [n, v] of [[head, { cx: hx, cy: hy }], [up, { x1: hx, x2: hx, y2: hy }], [across, { y1: hy, y2: hy, x2: hx }]]) for (const [a, b] of Object.entries(v)) n.setAttribute(a, String(b));
            read.textContent = `${name(la, 'N', 'S')}, ${name(lo, 'E', 'W')}`;
          };
          const check = () => {
            if (gi >= goals.length || ask.classList.contains('ok')) return;
            if (now[0] === goals[gi][0] && now[1] === goals[gi][1]) {
              ask.textContent = `Yes: ${read.textContent}.`;
              ask.classList.add('ok');
              gi++;
              clock.later(() => {
                ask.classList.remove('ok');
                ask.textContent = say();
              }, 1300);
            }
          };
          const move = (e) => {
            const [x, y] = spot(pic, e);
            const la = Math.max(-90, Math.min(90, Math.round((96 - y) / 0.8 / 5) * 5));
            const lo = Math.max(-180, Math.min(180, Math.round((x - 160) / 0.8 / 5) * 5));
            if (la === now[0] && lo === now[1]) return;
            now = [la, lo];
            k2.audio?.tick?.();
            draw();
          };
          const unfollow = follow(pic, move, check);
          host.append(ask, pic);
          draw();
          ask.textContent = say();
          return () => {
            unfollow();
            clock.stop();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the sun's height
  navigation(k) {
    const { svg, T, L, R, C, G, P, COL } = k;
    const [ox, oy] = [48, 160];
    const far = 140; // how far away the sun is drawn
    const peak = 52; // how high it gets in this example, in degrees
    const rad = (d) => (d * Math.PI) / 180;
    const out = (d, r) => [ox + r * Math.cos(rad(d)), oy - r * Math.sin(rad(d))];
    const sky = G({});
    const [p1x, p1y] = out(0, far);
    const [p2x, p2y] = out(78, far);
    sky.append(P(`M${p1x} ${p1y} A${far} ${far} 0 0 0 ${p2x.toFixed(1)} ${p2y.toFixed(1)}`, { s: COL.rule, w: 1, d: '3 4' }));
    sky.append(L(16, oy, 304, oy, { s: COL.blue, w: 2 }), T(304, oy + 16, 'horizon', { c: 'u', z: 10, f: COL.blue, a: 'end' }), C(ox, oy - 1, 4, { f: COL.ink, s: 'none' }), T(ox, oy + 16, 'you', { c: 'u', z: 10, f: COL.faint }));
    const sun = G({}, C(0, 0, 11, { f: '#f2c14e', s: COL.brass }));
    for (let a = 0; a < 360; a += 45) sun.append(L(15 * Math.cos(rad(a)), 15 * Math.sin(rad(a)), 20 * Math.cos(rad(a)), 20 * Math.sin(rad(a)), { s: COL.brass, w: 1.4 }));
    const sight = L(ox, oy, ox, oy, { s: COL.ink, w: 1.2, d: '5 4' });
    const arc = P('', { s: COL.brass, w: 2.2 });
    const deg = T(ox + 60, oy, '0°', { z: 14, w: 700, f: COL.brass });
    const pose = (a) => {
      const [sx, sy] = out(a, far);
      sun.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
      const [lx, ly] = out(a, far - 17);
      sight.setAttribute('x2', lx.toFixed(1));
      sight.setAttribute('y2', ly.toFixed(1));
      const [ax, ay] = out(a, 44);
      arc.setAttribute('d', `M${ox + 44} ${oy} A44 44 0 0 0 ${ax.toFixed(1)} ${ay.toFixed(1)}`);
      const [tx, ty] = out(a / 2, 64);
      deg.setAttribute('x', tx.toFixed(1));
      deg.setAttribute('y', (ty + 5).toFixed(1));
      deg.textContent = `${Math.round(a)}°`;
    };
    pose(0);
    // The day's table, and what it gives.
    const table = G({}, R(196, 34, 70, 52, { f: '#fbf6ea', s: COL.ink, w: 1, r: 3 }), L(196, 46, 266, 46, { s: COL.rule, w: 1 }), T(231, 100, 'table for the day', { c: 'u', z: 10, f: COL.faint }));
    for (let i = 0; i < 4; i++) table.append(L(204, 56 + i * 8, 228, 56 + i * 8, { s: COL.faint, w: 1.2 }), L(240, 56 + i * 8, 258, 56 + i * 8, { s: COL.faint, w: 1.2 }));
    const toTable = L(124, 124, 190, 76, { s: COL.brass, w: 1.6, m: k.arrow('brass') });
    const toLat = L(231, 106, 231, 120, { s: COL.green, w: 1.6, m: k.arrow('green') });
    const latitude = T(231, 138, 'your latitude', { c: 'u', z: 12.5, f: COL.green, w: 700 });
    sky.append(sight, arc, deg, sun, table, toTable, toLat, latitude);
    // The brass instruments, each named for how much of a circle its arc is.
    const tools = G({});
    const xs = [46, 122, 198, 274];
    const rims = [];
    const astro = G({}, C(xs[0], 92, 30, { f: '#ead29b', s: COL.brass, w: 1.4 }), C(xs[0], 92, 23, { f: 'none', s: COL.brass, w: 1 }), C(xs[0], 56, 4, { f: 'none', s: COL.brass, w: 1.4 }), L(xs[0] - 26, 107, xs[0] + 26, 77, { s: COL.ink, w: 1.6 }), C(xs[0], 92, 2.2, { f: COL.ink, s: 'none' }));
    for (let a = 0; a < 360; a += 30) astro.append(L(xs[0] + 23 * Math.cos(rad(a)), 92 + 23 * Math.sin(rad(a)), xs[0] + 30 * Math.cos(rad(a)), 92 + 30 * Math.sin(rad(a)), { s: COL.brass, w: 1 }));
    const astroRim = C(xs[0], 92, 30, { f: 'none', s: COL.green, w: 2.4 });
    rims.push([astroRim, 2 * Math.PI * 30]);
    const shapes = [astro];
    [90, 60, 45].forEach((span, i) => {
      const x = xs[i + 1];
      const r = 52;
      const a0 = 90 - span / 2;
      const a1 = 90 + span / 2;
      const pt = (a, rr) => [x + rr * Math.cos(rad(a)), 122 - rr * Math.sin(rad(a))];
      const [sx, sy] = pt(a0, r);
      const [ex, ey] = pt(a1, r);
      const fan = G({}, P(`M${x} 122 L${sx.toFixed(1)} ${sy.toFixed(1)} A${r} ${r} 0 0 0 ${ex.toFixed(1)} ${ey.toFixed(1)} Z`, { f: '#ead29b', s: COL.brass, w: 1.4 }));
      const [bx, by] = pt(a0, r - 8);
      const [cx2, cy2] = pt(a1, r - 8);
      fan.append(P(`M${bx.toFixed(1)} ${by.toFixed(1)} A${r - 8} ${r - 8} 0 0 0 ${cx2.toFixed(1)} ${cy2.toFixed(1)}`, { s: COL.brass, w: 1 }));
      for (let j = 0; j <= 6; j++) {
        const a = a0 + (span * j) / 6;
        const [ux, uy] = pt(a, r - 8);
        const [vx, vy] = pt(a, r);
        fan.append(L(ux, uy, vx, vy, { s: COL.brass, w: 1 }));
      }
      fan.append(C(x, 122, 2.4, { f: COL.ink, s: 'none' }));
      shapes.push(fan);
      const rim = P(`M${sx.toFixed(1)} ${sy.toFixed(1)} A${r} ${r} 0 0 0 ${ex.toFixed(1)} ${ey.toFixed(1)}`, { s: COL.green, w: 2.6 });
      rims.push([rim, (r * span * Math.PI) / 180]);
    });
    const names = ['astrolabe', 'quadrant', 'sextant', 'octant'].map((n, i) => T(xs[i], 142, n, { c: 'u', z: 12, w: 700 }));
    const parts = ['whole circle', 'a quarter', 'a sixth', 'an eighth'].map((n, i) => T(xs[i], 158, n, { c: 'u', z: 10.5, f: COL.green, w: 600 }));
    const degs = ['360°', '90°', '60°', '45°'].map((n, i) => T(xs[i], 174, n, { z: 11.5, w: 700, f: COL.brass }));
    for (const [rim, len] of rims) {
      rim.style.strokeDasharray = `${Math.ceil(len) + 2}`;
      rim.style.strokeDashoffset = `${Math.ceil(len) + 2}`;
    }
    tools.append(...shapes, ...rims.map(([rim]) => rim), ...names, ...parts, ...degs);
    tools.setAttribute('transform', 'translate(0 6)');
    svg.append(sky, tools);
    k.hide(sun, sight, arc, deg, table, toTable, toLat, latitude, shapes, names, parts, degs);
    return {
      steps: [
        {
          say: 'The sun climbs to its highest. Measure that angle.',
          run: (tl) => {
            const o = { a: 0 };
            tl.to([sun, sight, arc, deg], { opacity: 1, duration: 0.3 });
            tl.to(o, { a: peak, duration: 2.2, ease: 'power2.out', onUpdate: () => pose(o.a), onComplete: () => pose(peak) });
          },
        },
        {
          say: 'With a table for the day, that angle gives your latitude.',
          run: (tl) => {
            tl.to(toTable, { opacity: 1, duration: 0.3 }).to(table, { opacity: 1, duration: 0.4 }).to(toLat, { opacity: 1, duration: 0.3 }, '+=0.2').fromTo(latitude, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.4 });
          },
        },
        {
          say: 'Sailors measured it with brass tools, named for their arcs.',
          run: (tl) => {
            tl.to(sky, { opacity: 0, duration: 0.4 });
            shapes.forEach((sh, i) => tl.fromTo(sh, { opacity: 0, scale: 0.7, transformOrigin: '50% 100%' }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, 0.4 + i * 0.2));
            tl.to(names, { opacity: 1, duration: 0.3, stagger: 0.2 }, 0.6);
          },
        },
        {
          say: 'A whole circle, a quarter, a sixth, and an eighth.',
          run: (tl) => {
            rims.forEach(([rim], i) => {
              tl.to(rim, { strokeDashoffset: 0, duration: 0.6, ease: 'power1.inOut' }, i * 0.3);
              tl.to([parts[i], degs[i]], { opacity: 1, duration: 0.3 }, i * 0.3 + 0.3);
            });
          },
        },
      ],
      tryIt: {
        say: 'Your turn: drag the sun up or down. Read its height.',
        mount(host, k2) {
          const { card, T: t, L: l, C: c, P: p, G: g, COL: col, el } = k2;
          const { svg: pic } = card(320, 184);
          pic.classList.add('demo-svg');
          pic.style.touchAction = 'none';
          const [ex, ey] = [40, 164];
          const far2 = 124;
          const at2 = (d, r) => [ex + r * Math.cos(rad(d)), ey - r * Math.sin(rad(d))];
          for (let d = 0; d <= 90; d += 10) {
            const [ax, ay] = at2(d, 96);
            const [bx, by] = at2(d, d % 30 ? 101 : 104);
            pic.append(l(ax, ay, bx, by, { s: col.faint, w: d % 30 ? 1 : 1.5 }));
            if (d % 30 === 0 && d) {
              const [qx, qy] = at2(d, 84);
              pic.append(t(qx, qy + 4, `${d}°`, { z: 9.5, f: col.faint }));
            }
          }
          const [r1x, r1y] = at2(0, 96);
          const [r2x, r2y] = at2(90, 96);
          pic.append(p(`M${r1x} ${r1y} A96 96 0 0 0 ${r2x} ${r2y}`, { s: col.faint, w: 1 }));
          pic.append(l(16, ey, 304, ey, { s: col.blue, w: 2 }), t(304, ey + 14, 'horizon', { c: 'u', z: 10, f: col.blue, a: 'end' }), c(ex, ey - 1, 4, { f: col.ink, s: 'none' }), t(ex, ey + 14, 'you', { c: 'u', z: 10, f: col.faint }));
          const beam = l(ex, ey, ex, ey, { s: col.ink, w: 1.2, d: '5 4' });
          const bow = p('', { s: col.brass, w: 2.2 });
          const ball = g({}, c(0, 0, 11, { f: '#f2c14e', s: col.brass }));
          for (let a = 0; a < 360; a += 45) ball.append(l(15 * Math.cos(rad(a)), 15 * Math.sin(rad(a)), 20 * Math.cos(rad(a)), 20 * Math.sin(rad(a)), { s: col.brass, w: 1.4 }));
          ball.style.cursor = 'grab';
          const big = t(262, 74, '', { z: 30, w: 700, f: col.brass });
          pic.append(beam, bow, ball, t(262, 38, 'height', { c: 'u', z: 11, f: col.faint }), big);
          let h = 35;
          const goals = [40, 75, 20];
          let gi = 0;
          const ask = el('div', { class: 'demo-goal' });
          const label = el('b', { class: 'demo-num', text: '' });
          const clock = timers();
          const say = () => (gi < goals.length ? `Set the sun ${goals[gi]}° high.` : 'That is how a navigator reads the sun.');
          const draw = () => {
            const [sx, sy] = at2(h, far2);
            ball.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
            const [lx, ly] = at2(h, far2 - 17);
            beam.setAttribute('x2', lx.toFixed(1));
            beam.setAttribute('y2', ly.toFixed(1));
            const [ax, ay] = at2(h, 36);
            bow.setAttribute('d', h ? `M${ex + 36} ${ey} A36 36 0 0 0 ${ax.toFixed(1)} ${ay.toFixed(1)}` : '');
            big.textContent = `${h}°`;
            label.textContent = `${h}°`;
          };
          const check = () => {
            if (gi >= goals.length || ask.classList.contains('ok')) return;
            if (Math.abs(h - goals[gi]) <= 1) {
              h = goals[gi];
              draw();
              ask.textContent = `Yes: ${h}° high.`;
              ask.classList.add('ok');
              gi++;
              clock.later(() => {
                ask.classList.remove('ok');
                ask.textContent = say();
              }, 1300);
            }
          };
          const move = (e) => {
            const [x, y] = spot(pic, e);
            const a = Math.round((Math.atan2(ey - y, x - ex) * 180) / Math.PI);
            const next = Math.max(0, Math.min(90, a < -90 ? 90 : a));
            if (next === h) return;
            h = next;
            k2.audio?.tick?.();
            draw();
          };
          const unfollow = follow(pic, move, check);
          const minus = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'One degree lower', text: '−' });
          const plus = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'One degree higher', text: '+' });
          minus.addEventListener('click', () => {
            h = Math.max(0, h - 1);
            k2.audio?.tick?.();
            draw();
            check();
          });
          plus.addEventListener('click', () => {
            h = Math.min(90, h + 1);
            k2.audio?.tick?.();
            draw();
            check();
          });
          host.append(ask, pic, el('div', { class: 'demo-controls' }, minus, label, plus));
          draw();
          ask.textContent = say();
          return () => {
            unfollow();
            clock.stop();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ local time
  time(k) {
    const { svg, T, L, R, C, G, COL } = k;
    const xs = [272, 216, 160, 104, 48]; // 0°, 1° W … 4° W: west is to the left
    const pad = (n) => String(n).padStart(2, '0');
    svg.append(R(16, 58, 288, 40, { f: '#e6dcc0', s: 'none', r: 4 }));
    xs.forEach((x, d) => svg.append(L(x, 58, x, 98, { s: d ? COL.ink : COL.blue, w: d ? 1.3 : 2.4 }), T(x, 124, d ? `${d}° W` : '0°', { z: 12, w: 700, f: d ? COL.ink : COL.blue })));
    svg.append(T(272, 110, 'Greenwich', { c: 'u', z: 9.5, f: COL.blue, w: 600 }));
    const times = xs.map((x, d) => T(x, 142, `12:${pad(d * 4)}`, { z: 12, w: 700, f: COL.brass }));
    const sun = G({}, L(0, 17, 0, 25, { s: COL.faint, w: 1.2, d: '2 2' }), C(0, 0, 10, { f: '#f2c14e', s: COL.brass }));
    for (let a = 0; a < 360; a += 45) {
      const r = (a * Math.PI) / 180;
      sun.append(L(13 * Math.cos(r), 13 * Math.sin(r), 17 * Math.cos(r), 17 * Math.sin(r), { s: COL.brass, w: 1.3 }));
    }
    sun.setAttribute('transform', 'translate(0 32)');
    const [cx, cy] = [34, 174];
    const face = G({}, C(cx, cy, 18, { f: '#fbf6ea', s: COL.ink, w: 1.4 }));
    for (let i = 0; i < 12; i++) {
      const r = (i * 30 * Math.PI) / 180;
      face.append(L(cx + 14 * Math.sin(r), cy - 14 * Math.cos(r), cx + 17 * Math.sin(r), cy - 17 * Math.cos(r), { s: COL.ink, w: i % 3 ? 0.8 : 1.4 }));
    }
    const hourHand = L(cx, cy, cx, cy - 9, { s: COL.ink, w: 2.4 });
    const minHand = L(cx, cy, cx, cy - 14, { s: COL.brass, w: 1.6 });
    const clockText = T(60, 188, '12:00', { z: 15, w: 700, a: 'start' });
    const box = R(xs[3] - 25, 52, 50, 98, { s: COL.green, w: 1.8, r: 6 });
    const sum1 = T(240, 168, '12 minutes late', { c: 'u', z: 11.5, f: COL.ink });
    const sum2 = T(240, 187, '12 ÷ 4 = 3° W', { z: 13, w: 700, f: COL.green });
    svg.append(face, hourHand, minHand, C(cx, cy, 1.8, { f: COL.ink, s: 'none' }), T(60, 169, 'Greenwich clock', { c: 'u', z: 10, f: COL.faint, a: 'start' }), clockText, ...times, sun, box, sum1, sum2);
    k.hide(times, sun, box, sum1, sum2);
    k.gsap.set(sun, { x: 300 });
    // Move the sun to line d, and the clock on by 4 minutes a line.
    const go = (tl, from, to, dur, pos) => {
      tl.to(sun, { x: xs[to], duration: dur, ease: 'power1.inOut' }, pos);
      tl.to(minHand, { rotation: 24 * to, svgOrigin: `${cx} ${cy}`, duration: dur, ease: 'power1.inOut' }, '<');
      tl.to(hourHand, { rotation: 2 * to, svgOrigin: `${cx} ${cy}`, duration: dur, ease: 'power1.inOut' }, '<');
      countUp(tl, clockText, from * 4, to * 4, (v) => `12:${pad(v)}`, dur, '<');
      tl.to(times[to], { opacity: 1, duration: 0.25 });
    };
    return {
      steps: [
        {
          say: 'Over Greenwich, the sun is highest at 12:00.',
          run: (tl) => {
            tl.to(sun, { opacity: 1, duration: 0.3 });
            tl.to(sun, { x: xs[0], duration: 1, ease: 'power2.out' }, '<');
            tl.to(times[0], { opacity: 1, duration: 0.3 });
          },
        },
        {
          say: 'It moves west, one degree every 4 minutes.',
          run: (tl) => go(tl, 0, 1, 1.4),
        },
        {
          say: 'So each degree west, it is highest 4 minutes later.',
          run: (tl) => {
            go(tl, 1, 2, 0.5);
            go(tl, 2, 3, 0.5, '+=0.1');
            go(tl, 3, 4, 0.5, '+=0.1');
          },
        },
        {
          say: 'Minutes late, divided by 4, give the degrees west.',
          run: (tl) => tl.to(box, { opacity: 1, duration: 0.4 }).to(sum1, { opacity: 1, duration: 0.4 }).to(sum2, { opacity: 1, duration: 0.4 }),
        },
      ],
      tryIt: {
        say: 'Your turn: move the town west and read the clock.',
        mount(host, k2) {
          const { card, T: t, L: l, R: r, C: c, P: p, G: g, COL: col, el } = k2;
          const { svg: pic } = card(320, 176);
          pic.classList.add('demo-svg');
          const at = (d) => 290 - 33 * d;
          pic.append(r(14, 44, 292, 36, { f: '#e6dcc0', s: 'none', r: 4 }));
          for (let d = 0; d <= 8; d++) pic.append(l(at(d), 44, at(d), 80, { s: d ? col.ink : col.blue, w: d ? 1.2 : 2.2 }), t(at(d), 96, d ? `${d}° W` : '0°', { z: 10, w: 700, f: d ? col.ink : col.blue }));
          pic.append(t(304, 110, 'Greenwich', { c: 'u', z: 9.5, f: col.blue, w: 600, a: 'end' }));
          const town = g({}, p('M-8 9 V-1 L0 -8 L8 -1 V9 Z', { f: '#c98f5a', s: col.ink, w: 1.2 }), r(-2.5, 3, 5, 6, { f: col.ink, s: 'none', r: 0 }));
          const sunny = g({}, l(0, 12, 0, 22, { s: col.faint, w: 1.2, d: '2 2' }), c(0, 0, 8, { f: '#f2c14e', s: col.brass }));
          const [fx, fy] = [40, 146];
          const dial = g({}, c(fx, fy, 18, { f: '#fbf6ea', s: col.ink, w: 1.4 }));
          for (let i = 0; i < 12; i++) {
            const a = (i * 30 * Math.PI) / 180;
            dial.append(l(fx + 14 * Math.sin(a), fy - 14 * Math.cos(a), fx + 17 * Math.sin(a), fy - 17 * Math.cos(a), { s: col.ink, w: i % 3 ? 0.8 : 1.4 }));
          }
          const hh = l(fx, fy, fx, fy - 9, { s: col.ink, w: 2.4 });
          const mh = l(fx, fy, fx, fy - 14, { s: col.brass, w: 1.6 });
          const shown = t(66, 162, '12:00', { z: 18, w: 700, a: 'start' });
          const late = t(236, 154, '', { z: 11.5, w: 600, f: col.green });
          pic.append(town, sunny, dial, hh, mh, c(fx, fy, 1.8, { f: col.ink, s: 'none' }), t(66, 140, 'Greenwich clock', { c: 'u', z: 10, f: col.faint, a: 'start' }), shown, late);
          let d = 0;
          const goals = [[20, 5], [32, 8], [8, 2]];
          let gi = 0;
          const ask = el('div', { class: 'demo-goal' });
          const clock = timers();
          const say = () => (gi < goals.length ? `Where is the sun highest at 12:${pad(goals[gi][0])}?` : 'Four minutes for every degree. That is all.');
          const draw = () => {
            const m = 4 * d;
            town.setAttribute('transform', `translate(${at(d)} 66)`);
            sunny.setAttribute('transform', `translate(${at(d)} 22)`);
            mh.setAttribute('transform', `rotate(${6 * m} ${fx} ${fy})`);
            hh.setAttribute('transform', `rotate(${m / 2} ${fx} ${fy})`);
            shown.textContent = `12:${pad(m)}`;
            late.textContent = d ? `${d} × 4 = ${m} min late` : 'no minutes late';
            if (gi < goals.length && !ask.classList.contains('ok') && d === goals[gi][1]) {
              ask.textContent = `Yes: ${d}° W.`;
              ask.classList.add('ok');
              gi++;
              clock.later(() => {
                ask.classList.remove('ok');
                ask.textContent = say();
              }, 1300);
            }
          };
          const moveTo = (n) => {
            if (n < 0 || n > 8 || n === d) return;
            d = n;
            k2.audio?.tick?.();
            draw();
          };
          for (let n = 0; n <= 8; n++) pic.append(tapZone(k2, at(n) - 16.5, 8, 33, 96, n ? `${n} degrees west` : 'Greenwich', () => moveTo(n)));
          const west = el('button', { class: 'demo-ibtn', type: 'button', text: '← West' });
          const east = el('button', { class: 'demo-ibtn', type: 'button', text: 'East →' });
          west.addEventListener('click', () => moveTo(d + 1));
          east.addEventListener('click', () => moveTo(d - 1));
          host.append(ask, pic, el('div', { class: 'demo-controls' }, west, east));
          ask.textContent = say();
          draw();
          return () => {
            clock.stop();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ naming squares, and the knight
  knight(k) {
    const { svg, T, R, C, G, P, COL } = k;
    const g = 20;
    const x0 = 64;
    const y0 = 12;
    const files = 'abcdefgh';
    const sq = (name) => [x0 + files.indexOf(name[0]) * g + g / 2, y0 + (8 - Number(name[1])) * g + g / 2];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) svg.append(R(x0 + c * g, y0 + r * g, g, g, { f: (r + c) % 2 ? '#b89466' : '#ecdfc4', s: 'none', r: 0 }));
    const fileNames = files.split('').map((f, c) => T(x0 + c * g + g / 2, y0 + 8 * g + 13, f, { z: 11, w: 700, f: COL.brass }));
    const rankNames = Array.from({ length: 8 }, (_, i) => T(x0 - 9, y0 + (7 - i) * g + 14, String(i + 1), { z: 11, w: 700, f: COL.brass }));
    const colBand = R(x0 + 4 * g, y0, g, 8 * g, { f: 'rgba(47,122,82,0.28)', s: 'none', r: 0 });
    const rowBand = R(x0, y0 + 4 * g, 8 * g, g, { f: 'rgba(47,122,82,0.28)', s: 'none', r: 0 });
    const [e4x, e4y] = sq('e4');
    const e4ring = R(e4x - g / 2, e4y - g / 2, g, g, { s: COL.green, w: 2.4, r: 0 });
    const bigE = T(263, 66, 'e', { z: 30, w: 700, f: COL.green });
    const big4 = T(283, 66, '4', { z: 30, w: 700, f: COL.green });
    const [bx, by] = sq('b1');
    const ends = ['a3', 'c3', 'd2'];
    const corners = { a3: 'b3', c3: 'b3', d2: 'd1' };
    const paths = ends.map((e) => {
      const [mx, my] = sq(corners[e]);
      const [ex, ey] = sq(e);
      return P(`M${bx} ${by} L${mx} ${my} L${ex} ${ey}`, { s: COL.green, w: 2.2 });
    });
    const dots = ends.map((e) => {
      const [ex, ey] = sq(e);
      return C(ex, ey, 5.5, { f: COL.green, s: '#fbf6ea', w: 1.2 });
    });
    const knight = G({}, k.chessman('N', bx - g / 2 + 1, by - g / 2 + 1, g - 2));
    const from = T(238, 112, 'From b1:', { c: 'u', z: 11.5, a: 'start' });
    const list = ends.map((e, i) => T(238, 136 + i * 19, e, { z: 15, w: 700, f: COL.green, a: 'start' }));
    svg.append(colBand, rowBand, e4ring, ...fileNames, ...rankNames, bigE, big4, ...paths, ...dots, knight, from, ...list);
    paths.forEach((p) => k.undraw(p));
    k.hide(fileNames, rankNames, colBand, rowBand, e4ring, bigE, big4, dots, knight, from, list);
    const hop = (tl, dx, dy) => {
      tl.to(knight, { x: dx, y: dy, duration: 0.5, ease: 'power2.inOut' });
      tl.to(knight, { scale: 1.3, transformOrigin: '50% 50%', duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.out' }, '<');
    };
    return {
      steps: [
        {
          say: 'Columns are lettered a to h. Rows are numbered 1 to 8.',
          run: (tl) => {
            tl.fromTo(fileNames, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.08 });
            tl.fromTo(rankNames, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.08 });
          },
        },
        {
          say: 'A square is named by its column, then its row: e4.',
          run: (tl) => {
            tl.to(colBand, { opacity: 1, duration: 0.35 }).to(fileNames[4], { attr: { fill: COL.green }, scale: 1.4, transformOrigin: '50% 50%', duration: 0.3 }, '<');
            tl.to(rowBand, { opacity: 1, duration: 0.35 }).to(rankNames[3], { attr: { fill: COL.green }, scale: 1.4, transformOrigin: '50% 50%', duration: 0.3 }, '<');
            tl.to(e4ring, { opacity: 1, duration: 0.3 });
            tl.fromTo(bigE, { opacity: 0, x: x0 + 4.5 * g - 263, y: 185 - 66 }, { opacity: 1, x: 0, y: 0, duration: 0.6, ease: 'power2.inOut' });
            tl.fromTo(big4, { opacity: 0, x: x0 - 9 - 283, y: y0 + 3 * g + 14 - 66 + g }, { opacity: 1, x: 0, y: 0, duration: 0.6, ease: 'power2.inOut' }, '<0.15');
          },
        },
        {
          say: 'A knight moves in an L: two squares, then one to the side.',
          run: (tl) => {
            tl.to([colBand, rowBand, e4ring, bigE, big4], { opacity: 0, duration: 0.3 });
            tl.to([fileNames[4], rankNames[3]], { attr: { fill: COL.brass }, scale: 1, duration: 0.3 }, '<');
            tl.fromTo(knight, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' });
            tl.to(paths[0], { strokeDashoffset: 0, duration: 0.7, ease: 'none' });
            hop(tl, -g, -2 * g);
            tl.to(dots[0], { opacity: 1, duration: 0.2 });
            hop(tl, 0, 0);
          },
        },
        {
          say: 'So from b1, a knight can jump to a3, c3 or d2.',
          run: (tl) => {
            tl.to(from, { opacity: 1, duration: 0.3 }).to(list[0], { opacity: 1, duration: 0.25 });
            [1, 2].forEach((i) => {
              tl.to(paths[i], { strokeDashoffset: 0, duration: 0.6, ease: 'none' });
              tl.to([dots[i], list[i]], { opacity: 1, duration: 0.25 });
            });
          },
        },
      ],
      tryIt: {
        say: 'Your turn: tap any square to put the knight there.',
        mount(host, k2) {
          const { card, T: t, R: r, C: c, G: gg, COL: col, el } = k2;
          const { svg: pic } = card(320, 210);
          pic.classList.add('demo-svg');
          const s2 = 22;
          const bx0 = 26;
          const by0 = 8;
          const name = (f, rk) => `${files[f]}${rk + 1}`;
          const centre = (f, rk) => [bx0 + f * s2 + s2 / 2, by0 + (7 - rk) * s2 + s2 / 2];
          for (let rr = 0; rr < 8; rr++) {
            for (let f = 0; f < 8; f++) pic.append(r(bx0 + f * s2, by0 + rr * s2, s2, s2, { f: (rr + f) % 2 ? '#b89466' : '#ecdfc4', s: 'none', r: 0 }));
            pic.append(t(bx0 - 9, by0 + rr * s2 + 15, String(8 - rr), { z: 10.5, w: 700, f: col.brass }));
          }
          files.split('').forEach((f, i) => pic.append(t(bx0 + i * s2 + s2 / 2, by0 + 8 * s2 + 13, f, { z: 10.5, w: 700, f: col.brass })));
          const marks = gg({});
          const piece = gg({}, k2.chessman('N', 0, 0, s2 - 2));
          const here = t(262, 54, '', { z: 24, w: 700 });
          const count = t(262, 194, '', { c: 'u', z: 11, f: col.faint });
          const names = Array.from({ length: 8 }, (_, i) => t(i < 4 ? 242 : 284, 106 + (i % 4) * 21, '', { z: 14, w: 700, f: col.green }));
          pic.append(marks, piece, t(262, 28, 'knight on', { c: 'u', z: 11, f: col.faint }), here, t(262, 82, 'can jump to', { c: 'u', z: 11, f: col.faint }), ...names, count);
          const goals = [2, 8];
          let gi = 0;
          const ask = el('div', { class: 'demo-goal' });
          const clock = timers();
          const say = () => (gi === 0 ? 'Find a square with only two jumps.' : gi === 1 ? 'Now find one with eight.' : 'Tap anywhere to see where it can go.');
          let now = [6, 0];
          let moved = false;
          const draw = () => {
            const [f, rk] = now;
            const [x, y] = centre(f, rk);
            if (moved) k2.gsap.to(piece, { x: x - s2 / 2 + 1, y: y - s2 / 2 + 1, duration: 0.3, ease: 'power2.out' });
            else k2.gsap.set(piece, { x: x - s2 / 2 + 1, y: y - s2 / 2 + 1 });
            const jumps = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]].map(([df, dr]) => [f + df, rk + dr]).filter(([a, b]) => a >= 0 && a < 8 && b >= 0 && b < 8);
            marks.replaceChildren(...jumps.map(([a, b]) => c(...centre(a, b), 5.5, { f: col.green, s: '#fbf6ea', w: 1.2 })));
            const list = jumps.map(([a, b]) => name(a, b)).sort();
            here.textContent = name(f, rk);
            names.forEach((n, i) => {
              n.textContent = list[i] ?? '';
            });
            count.textContent = `${list.length} squares`;
            if (gi < goals.length && !ask.classList.contains('ok') && list.length === goals[gi]) {
              ask.textContent = gi === 0 ? 'Yes: from a corner, only two.' : 'Yes: from the middle, eight.';
              ask.classList.add('ok');
              gi++;
              clock.later(() => {
                ask.classList.remove('ok');
                ask.textContent = say();
              }, 1400);
            }
          };
          for (let rk = 0; rk < 8; rk++) {
            for (let f = 0; f < 8; f++) {
              const [x, y] = centre(f, rk);
              pic.append(
                tapZone(k2, x - s2 / 2, y - s2 / 2, s2, s2, `Square ${name(f, rk)}`, () => {
                  if (now[0] === f && now[1] === rk) return;
                  now = [f, rk];
                  moved = true;
                  k2.audio?.tick?.();
                  draw();
                }),
              );
            }
          }
          host.append(ask, pic);
          ask.textContent = say();
          draw();
          return () => {
            clock.stop();
            k2.gsap.killTweensOf(piece);
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the letter-lock
  letterlock(k) {
    const { s, T, R, G, COL, ABC } = k;
    // The whole lock sits a little lower, in the middle of the screen.
    const svg = G({ transform: 'translate(0 20)' });
    k.svg.append(svg);
    const word = 'KEYWORD';
    const start = 'QZBHVJM';
    const x = (i) => 36 + i * 33;
    const mid = 80;
    const step = 24;
    const clip = uid();
    svg.append(s('defs', {}, s('clipPath', { id: clip }, s('rect', { x: 0, y: 32, width: 320, height: 96 }))));
    // The keeper on the door frame, and the bolt that goes into it.
    svg.append(R(284, 50, 24, 60, { f: COL.wood, s: 'none', r: 3 }), R(284, 69, 14, 22, { f: '#3a2a1a', s: 'none', r: 2 }));
    const bolt = R(228, 70, 68, 20, { f: '#a9a9a3', s: '#5d5d58', w: 1.2, r: 3 });
    svg.append(bolt, R(14, 40, 240, 80, { f: '#c99a4b', s: '#7a5a23', w: 1.5, r: 10 }));
    const pos = start.split('').map((ch) => ABC.indexOf(ch));
    const frames = [];
    const strips = word.split('').map((_, i) => {
      const cx = x(i);
      const strip = G({});
      for (let j = 0; j < 78; j++) strip.append(T(cx, j * step + 5.5, ABC[j % 26], { z: 15, w: 800 }));
      const frame = R(cx - 12, mid - 12, 24, 24, { s: '#7a5a23', w: 1.2, r: 3 });
      frames.push(frame);
      svg.append(R(cx - 14, 30, 28, 100, { f: '#e3c27e', s: '#7a5a23', w: 1.2, r: 6 }), R(cx - 12, mid - 12, 24, 24, { f: '#fbf3df', s: 'none', r: 3 }), G({ 'clip-path': `url(#${clip})` }, strip), R(cx - 13, 31, 26, 37, { f: 'rgba(227,194,126,0.62)', s: 'none', r: 5 }), R(cx - 13, 92, 26, 37, { f: 'rgba(227,194,126,0.62)', s: 'none', r: 5 }), frame);
      k.gsap.set(strip, { y: mid - pos[i] * step });
      return strip;
    });
    const open = T(296, 128, 'open', { c: 'u', z: 11, w: 700, f: COL.green });
    svg.append(open);
    k.hide(open);
    /** Turn ring i to a letter: forward by at least `min` places, or the shortest way if `min` is null. */
    const turn = (tl, i, letter, min, dur, at) => {
      const t0 = ABC.indexOf(letter);
      let p0 = pos[i] % 26;
      let to;
      if (min === null) {
        p0 += 26;
        to = t0 + 26;
        if (to - p0 > 13) to -= 26;
        if (p0 - to > 13) to += 26;
      } else {
        to = t0;
        while (to < p0 + min) to += 26;
      }
      tl.set(strips[i], { y: mid - p0 * step }, at);
      tl.to(strips[i], { y: mid - to * step, duration: dur, ease: 'power3.out' }, '<');
      pos[i] = to;
    };
    return {
      steps: [
        {
          say: 'Each ring carries the whole alphabet.',
          run: (tl) => {
            tl.to(frames[0], { attr: { stroke: COL.green, 'stroke-width': 2.4 }, duration: 0.2 });
            turn(tl, 0, start[0], 26, 1.8);
            tl.to(frames[0], { attr: { stroke: '#7a5a23', 'stroke-width': 1.2 }, duration: 0.2 });
          },
        },
        {
          say: 'Turn each ring until its letter sits in the window.',
          run: (tl) => {
            const shown = 'KEYWOTD';
            shown.split('').forEach((ch, i) => turn(tl, i, ch, 6, 1.1, i * 0.18));
          },
        },
        {
          say: 'One letter wrong, and the bolt will not move.',
          run: (tl) => {
            tl.to(frames[5], { attr: { stroke: COL.red, 'stroke-width': 2.6 }, duration: 0.25 });
            tl.to(bolt, { x: -5, duration: 0.08, yoyo: true, repeat: 5, ease: 'sine.inOut' });
          },
        },
        {
          say: 'Every letter right, and the bolt slides back.',
          run: (tl) => {
            turn(tl, 5, 'R', null, 0.6);
            tl.to(frames, { attr: { stroke: COL.green, 'stroke-width': 2.4 }, duration: 0.3, stagger: 0.06 });
            tl.to(bolt, { x: -44, duration: 0.7, ease: 'power2.inOut' });
            tl.to(open, { opacity: 1, duration: 0.3 });
          },
        },
      ],
      tryIt: {
        say: 'Your turn: tap above or below a ring to turn it.',
        mount(host, k2) {
          const { card, T: t, R: r, P: p, G: gg, COL: col, ABC: abc, el } = k2;
          const target = 'TULIP';
          const now = 'RWJKN'.split('').map((ch) => abc.indexOf(ch));
          const { svg: pic } = card(320, 140);
          pic.classList.add('demo-svg');
          const bolt2 = r(262, 60, 46, 20, { f: '#a9a9a3', s: '#5d5d58', w: 1.2, r: 3 });
          pic.append(bolt2, r(32, 38, 256, 64, { f: '#c99a4b', s: '#7a5a23', w: 1.5, r: 10 }));
          const rings = target.split('').map((_, i) => {
            const cx = 64 + i * 48;
            const face = r(cx - 12, 58, 24, 24, { f: '#fbf3df', s: '#7a5a23', w: 1.2, r: 3 });
            const up = t(cx, 45, '', { z: 13, w: 700, f: '#8a6a33' });
            const mid2 = t(cx, 77, '', { z: 19, w: 800 });
            const down = t(cx, 109, '', { z: 13, w: 700, f: '#8a6a33' });
            const letters = gg({}, up, mid2, down);
            pic.append(r(cx - 19, 12, 38, 116, { f: '#e3c27e', s: '#7a5a23', w: 1.2, r: 8 }), face, letters, p(`M${cx - 6} ${26} L${cx} ${20} L${cx + 6} ${26}`, { s: '#7a5a23', w: 1.6 }), p(`M${cx - 6} ${114} L${cx} ${120} L${cx + 6} ${114}`, { s: '#7a5a23', w: 1.6 }));
            return { cx, face, up, mid2, down, letters };
          });
          const ask = el('div', { class: 'demo-goal', text: `Set the rings to ${target}.` });
          let done = false;
          const draw = () => {
            rings.forEach((ring, i) => {
              ring.up.textContent = abc[(now[i] + 25) % 26];
              ring.mid2.textContent = abc[now[i]];
              ring.down.textContent = abc[(now[i] + 1) % 26];
              const right = abc[now[i]] === target[i];
              ring.face.setAttribute('stroke', done ? col.green : '#7a5a23');
              ring.face.setAttribute('stroke-width', done ? '2.4' : '1.2');
              ring.mid2.setAttribute('fill', done || right ? col.green : col.ink);
            });
            const word2 = now.map((n) => abc[n]).join('');
            if (!done && word2 === target) {
              done = true;
              ask.textContent = 'Open! The word is the key.';
              ask.classList.add('ok');
              k2.gsap.to(bolt2, { x: -22, duration: 0.6, ease: 'power2.inOut' });
              draw();
            }
          };
          rings.forEach((ring, i) => {
            const turn2 = (by) => {
              if (done) return;
              now[i] = (now[i] + by + 26) % 26;
              k2.audio?.tick?.();
              k2.gsap.fromTo(ring.letters, { y: by * 9 }, { y: 0, duration: 0.18, ease: 'power2.out' });
              draw();
            };
            pic.append(tapZone(k2, ring.cx - 24, 6, 48, 64, `Turn ring ${i + 1} back`, () => turn2(-1)), tapZone(k2, ring.cx - 24, 70, 48, 64, `Turn ring ${i + 1} on`, () => turn2(1)));
          });
          host.append(ask, pic);
          draw();
          return () => {
            k2.gsap.killTweensOf([bolt2, ...rings.map((ring) => ring.letters)]);
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the Nina
  nina(k) {
    const { svg, T, R, P, COL } = k;
    const rows = ['HOUSE', 'BEACH', 'SALTY', 'SMALL', 'RADIO'];
    const g = 28;
    const x0 = 90;
    const y0 = 10;
    const cell = (r, c) => [x0 + c * g, y0 + r * g];
    const shades = [];
    const letters = [];
    rows.forEach((row, r) =>
      row.split('').forEach((ch, c) => {
        const [x, y] = cell(r, c);
        const shade = R(x, y, g, g, { f: 'rgba(168,105,28,0.24)', s: 'none', r: 0 });
        svg.append(R(x, y, g, g, { f: '#fbf6ea', s: COL.rule, r: 0 }), shade);
        if (c === 0) svg.append(T(x + 4, y + 9, String(r + 1), { c: 'u', z: 7.5, f: COL.faint, a: 'start' }));
        const t = T(x + g / 2, y + g / 2 + 5, ch, { z: 14, w: 600 });
        letters.push(t);
        if (r === c) shades.push(shade);
        else k.hide(shade);
      }),
    );
    svg.append(...letters);
    const scan = R(x0, y0, g, g, { s: COL.brass, w: 2.6, r: 2 });
    const word = 'HELLO'.split('').map((ch, i) => T(x0 + i * g + g / 2, y0 + i * g + g / 2 + 5, ch, { z: 14, w: 800, f: COL.brass }));
    const swash = P('M100 188 C140 181 180 192 216 183', { s: COL.brass, w: 1.8 });
    const named = T(236, 177, 'a Nina', { c: 'd', z: 17, i: true, f: COL.brass, a: 'start' });
    svg.append(scan, ...word, swash, named);
    k.undraw(swash);
    k.hide(letters, shades, scan, word, named);
    const diag = (i) => letters[i * 5 + i];
    return {
      steps: [
        {
          say: 'Here is a finished grid. Each row is an answer.',
          run: (tl) => tl.to(letters, { opacity: 1, duration: 0.12, stagger: 0.05 }),
        },
        {
          say: 'Look past the answers: round the edges, corner to corner.',
          run: (tl) => {
            tl.to(scan, { opacity: 1, duration: 0.2 });
            for (const [c, r] of [[4, 0], [4, 4], [0, 4], [0, 0], [4, 4]]) tl.to(scan, { x: c * g, y: r * g, duration: 0.38, ease: 'power1.inOut' });
            tl.to(scan, { opacity: 0, duration: 0.2 });
          },
        },
        {
          say: 'Corner to corner, it spells HELLO.',
          run: (tl) => {
            shades.forEach((sh, i) => {
              tl.to(sh, { opacity: 1, duration: 0.2 });
              tl.to(diag(i), { attr: { fill: COL.brass }, duration: 0.2 }, '<');
            });
            word.forEach((w, i) => {
              tl.set(w, { opacity: 1 }, i ? '<0.08' : '+=0.1');
              tl.to(w, { x: 112 + i * 24 - (x0 + i * g + g / 2), y: 176 - (y0 + i * g + g / 2 + 5), scale: 1.25, transformOrigin: '50% 50%', duration: 0.6, ease: 'power2.inOut' }, '<');
            });
          },
        },
        {
          say: 'A hidden word like this is a Nina: a setter’s signature.',
          run: (tl) => tl.to(swash, { strokeDashoffset: 0, duration: 0.6, ease: 'power1.inOut' }).to(named, { opacity: 1, duration: 0.4 }),
        },
      ],
      tryIt: {
        say: 'Your turn: find the hidden word in this grid.',
        mount(host, k2) {
          const { card, T: t, R: r, COL: col, el } = k2;
          const grid = ['STORM', 'MAPLE', 'IVORY', 'LEMON', 'EARTH'];
          const nina = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]];
          const s2 = 30;
          const gx = 85;
          const gy = 10;
          const { svg: pic } = card(320, 196);
          pic.classList.add('demo-svg');
          const shade = [];
          grid.forEach((row, rr) =>
            row.split('').forEach((ch, cc) => {
              const sh = r(gx + cc * s2, gy + rr * s2, s2, s2, { f: '#fbf6ea', s: col.rule, r: 0 });
              shade.push(sh);
              pic.append(sh, t(gx + cc * s2 + s2 / 2, gy + rr * s2 + s2 / 2 + 5.5, ch, { z: 15, w: 600 }));
            }),
          );
          const read = t(160, 184, '', { z: 18, w: 700, f: col.brass });
          pic.append(read);
          const ask = el('div', { class: 'demo-goal', text: 'Tap its first letter, then its last.' });
          let first = null;
          let found = false;
          const paint = (cells, fill) => shade.forEach((sh, i) => sh.setAttribute('fill', cells.some(([a, b]) => a * 5 + b === i) ? fill : '#fbf6ea'));
          const pick = (rr, cc) => {
            if (found) return;
            k2.audio?.tick?.();
            if (!first || (first[0] === rr && first[1] === cc)) {
              first = first ? null : [rr, cc];
              paint(first ? [first] : [], 'rgba(168,105,28,0.3)');
              read.textContent = first ? grid[rr][cc] : '';
              ask.textContent = first ? 'Now tap its last letter.' : 'Tap its first letter, then its last.';
              return;
            }
            const [r0, c0] = first;
            first = null;
            const dr = Math.sign(rr - r0);
            const dc = Math.sign(cc - c0);
            const n = Math.max(Math.abs(rr - r0), Math.abs(cc - c0));
            if ((rr !== r0 && cc !== c0 && Math.abs(rr - r0) !== Math.abs(cc - c0)) || n < 2) {
              paint([], '');
              read.textContent = '';
              ask.textContent = 'Pick two squares in a straight line.';
              return;
            }
            const cells = Array.from({ length: n + 1 }, (_, i) => [r0 + dr * i, c0 + dc * i]);
            const letters = cells.map(([a, b]) => grid[a][b]).join('');
            read.textContent = letters;
            const isNina = cells.length === nina.length && cells.every(([a, b]) => nina.some(([p, q]) => p === a && q === b));
            if (isNina) {
              found = true;
              paint(cells, 'rgba(47,122,82,0.3)');
              read.textContent = 'SMILE';
              read.setAttribute('fill', col.green);
              ask.textContent = 'Yes: SMILE, down the left edge.';
              ask.classList.add('ok');
              return;
            }
            paint(cells, 'rgba(168,105,28,0.3)');
            ask.textContent = grid.includes(letters) ? 'That is an answer. A Nina hides apart from them.' : 'Not a word. Try an edge, or a diagonal.';
          };
          grid.forEach((row, rr) => row.split('').forEach((ch, cc) => pic.append(tapZone(k2, gx + cc * s2, gy + rr * s2, s2, s2, `Letter ${ch}, row ${rr + 1}`, () => pick(rr, cc)))));
          host.append(ask, pic);
          return () => host.replaceChildren();
        },
      },
    };
  },

  // ------------------------------------------------------------------ the crossword clue
  cryptic(k) {
    const { svg, T, L, R, C, G, COL } = k;
    // Each word of the clue is laid out to a set width, so the marks fall under the right words.
    const word = (x, y, text, z = 16) => {
      const n = T(x, y, text, { c: 'd', z, i: true, a: 'start' });
      n.setAttribute('textLength', String(text.length * z * 0.5));
      n.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      return n;
    };
    const vehicle = word(77, 34, 'Vehicle,');
    const animal = word(187, 34, 'animal:');
    const defn = word(46, 58, 'a covering for the floor');
    const six = word(252, 58, '(6)');
    svg.append(vehicle, word(148, 34, 'then'), animal, defn, six);
    const under = k.undraw(L(46, 65, 238, 65, { s: COL.green, w: 2 }));
    const defName = T(142, 79, 'the definition', { c: 'u', z: 10, f: COL.green, w: 600 });
    const tile = (ch, x) => G({}, G({ transform: `translate(${x} 112)` }, R(-9, -12, 18, 23, { f: '#efe3c6', s: '#b49863', r: 3 }), T(0, 5.5, ch, { z: 15, w: 700 })));
    const car = G({}, ...'CAR'.split('').map((ch, i) => tile(ch, 89 + i * 20)));
    const pet = G({}, ...'PET'.split('').map((ch, i) => tile(ch, 195 + i * 20)));
    const carName = T(109, 140, 'a vehicle', { c: 'u', z: 10, f: COL.brass, w: 600 });
    const petName = T(215, 140, 'an animal', { c: 'u', z: 10, f: COL.brass, w: 600 });
    const ring = C(264, 53, 14, { s: COL.brass, w: 1.8 });
    const done = T(160, 160, 'CARPET: a covering for the floor', { c: 'u', z: 12.5, f: COL.green, w: 700 });
    const count = T(160, 182, 'six letters, as the (6) says', { c: 'u', z: 10.5, f: COL.faint });
    svg.append(under, defName, car, pet, carName, petName, ring, done, count);
    k.hide(defName, car, pet, carName, petName, ring, done, count);
    return {
      steps: [
        {
          say: 'One end of the clue is a plain definition.',
          run: (tl) => tl.to(under, { strokeDashoffset: 0, duration: 0.8, ease: 'power1.inOut' }).to(defName, { opacity: 1, duration: 0.3 }),
        },
        {
          say: 'The rest is a recipe. A vehicle: CAR.',
          run: (tl) => {
            tl.to(vehicle, { attr: { fill: COL.brass }, duration: 0.3 });
            tl.fromTo(car.children, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.12, ease: 'back.out(1.6)' });
            tl.set(car, { opacity: 1 }, 0);
            tl.to(carName, { opacity: 1, duration: 0.3 });
          },
        },
        {
          say: 'And an animal: PET.',
          run: (tl) => {
            tl.to(animal, { attr: { fill: COL.brass }, duration: 0.3 });
            tl.fromTo(pet.children, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.12, ease: 'back.out(1.6)' });
            tl.set(pet, { opacity: 1 }, 0);
            tl.to(petName, { opacity: 1, duration: 0.3 });
          },
        },
        {
          say: 'Put them together: CARPET. It fits the definition.',
          run: (tl) => {
            tl.to([carName, petName], { opacity: 0, duration: 0.25 });
            tl.to(car, { x: 21, duration: 0.6, ease: 'power2.inOut' }).to(pet, { x: -25, duration: 0.6, ease: 'power2.inOut' }, '<');
            tl.to(done, { opacity: 1, duration: 0.4 });
            tl.to(ring, { opacity: 1, duration: 0.3 }).to(count, { opacity: 1, duration: 0.3 }, '<');
          },
        },
      ],
      tryIt: {
        say: 'Your turn: build the answer from two pieces.',
        mount(host, k2) {
          const { card, T: t, L: l, R: r, COL: col, el } = k2;
          const { svg: pic } = card(320, 150);
          pic.classList.add('demo-svg');
          const piece = (x, y, text) => {
            const n = t(x, y, text, { c: 'd', z: 16, i: true, a: 'start' });
            n.setAttribute('textLength', String(text.length * 8));
            n.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            return n;
          };
          pic.append(piece(97, 30, 'Ocean,'), piece(152, 30, 'then'), piece(191, 30, 'boy:'), piece(88, 54, 'a time of year'), piece(208, 54, '(6)'), l(88, 61, 200, 61, { s: col.green, w: 2 }));
          const boxes = Array.from({ length: 6 }, (_, i) => {
            const bx = 110 + i * 20;
            const box = r(bx - 9, 80, 18, 23, { f: '#fbf6ea', s: '#b49863', r: 3 });
            const ch = t(bx, 97, '', { z: 15, w: 700 });
            pic.append(box, ch);
            return { box, ch };
          });
          const out = t(160, 134, '', { c: 'u', z: 12.5, w: 700, f: col.green });
          pic.append(out);
          const ask = el('div', { class: 'demo-goal', text: 'Ocean first, then boy. Tap two pieces.' });
          const clock = timers();
          let picks = [];
          let solved = false;
          const draw = () => {
            const letters = picks.join('');
            boxes.forEach(({ box, ch }, i) => {
              ch.textContent = letters[i] ?? '';
              box.setAttribute('stroke', solved ? col.green : '#b49863');
              box.setAttribute('fill', solved ? '#e3efe5' : '#fbf6ea');
            });
          };
          const judge = () => {
            const w2 = picks.join('');
            if (w2 === 'SEASON') {
              solved = true;
              out.textContent = 'SEA + SON = SEASON';
              ask.textContent = 'Yes! A season is a time of year.';
              ask.classList.add('ok');
              draw();
              return;
            }
            ask.textContent = w2 === 'SONSEA' ? 'Right pieces, wrong order: the ocean comes first.' : w2 === 'SEAMAN' ? 'SEAMAN is a word, but not a time of year.' : `${w2} is not a word. Try again.`;
            clock.later(() => {
              picks = [];
              out.textContent = '';
              ask.textContent = 'Ocean first, then boy. Tap two pieces.';
              draw();
            }, 1600);
          };
          const buttons = ['SEA', 'SUN', 'BAY', 'SON', 'LAD', 'MAN'].map((p) => {
            const b = el('button', { class: 'demo-ibtn', type: 'button', text: p });
            b.addEventListener('click', () => {
              if (solved || picks.length >= 2) return;
              picks.push(p);
              k2.audio?.tick?.();
              draw();
              if (picks.length === 2) judge();
            });
            return b;
          });
          host.append(ask, pic, el('div', { class: 'demo-controls wrap' }, buttons));
          draw();
          return () => {
            clock.stop();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the meta
  meta(k) {
    const { svg, T, L, R, C, G, P, COL } = k;
    const answers = ['PARROT', 'RIVER', 'IGLOO', 'ZEBRA', 'EAGLE'];
    const final = answers.map((a) => a[0]).join('');
    const y = (i) => 40 + i * 26;
    const nums = answers.map((_, i) => T(40, y(i), `${i + 1}.`, { c: 'u', z: 11, f: COL.faint, a: 'end' }));
    const words = answers.map((a, i) => T(50, y(i), a, { z: 16, w: 700, a: 'start' }));
    const rings = answers.map((_, i) => C(54.8, y(i) - 5.5, 10, { f: 'rgba(168,105,28,0.18)', s: COL.brass, w: 1.6 }));
    const brace = P('M124 28 Q132 28 132 38 V82 Q132 92 140 92 Q132 92 132 102 V140 Q132 150 124 150', { s: COL.faint, w: 1.4 });
    const arrow = L(146, 92, 176, 92, { s: COL.faint, w: 1.4, m: k.arrow('faint') });
    const tx = (i) => 196 + i * 24;
    const slots = final.split('').map((_, i) => G({}, R(tx(i) - 11, 79, 22, 26, { f: '#fbf6ea', s: '#b49863', r: 3 })));
    const marks = final.split('').map((_, i) => T(tx(i), 98, '?', { z: 15, w: 700, f: COL.faint }));
    const metaName = T(244, 68, 'the last answer', { c: 'u', z: 10.5, f: COL.faint });
    const flying = final.split('').map((ch, i) => T(54.8, y(i), ch, { z: 16, w: 800, f: COL.brass }));
    svg.append(...rings, ...nums, ...words, brace, arrow, ...slots, ...marks, metaName, ...flying);
    k.hide(nums, words, rings, brace, arrow, slots, marks, metaName, flying);
    return {
      steps: [
        {
          say: 'Every puzzle in a hunt has an answer. Here are five.',
          run: (tl) => {
            answers.forEach((_, i) => tl.fromTo([nums[i], words[i]], { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3 }, i * 0.2));
          },
        },
        {
          say: 'The last puzzle, the meta, is made from all of them.',
          run: (tl) => tl.to([brace, arrow], { opacity: 1, duration: 0.4 }).to([...slots, ...marks, metaName], { opacity: 1, duration: 0.3, stagger: 0.06 }),
        },
        {
          say: 'Take one letter from each answer, in order.',
          run: (tl) => {
            rings.forEach((rg, i) => {
              tl.fromTo(rg, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, i * 0.25);
              tl.to(flying[i], { opacity: 1, duration: 0.2 }, i * 0.25);
            });
          },
        },
        {
          say: 'Read them down: the last answer is PRIZE.',
          run: (tl) => {
            flying.forEach((f, i) => {
              tl.to(f, { x: tx(i) - 54.8, y: 98 - y(i), duration: 0.6, ease: 'power2.inOut' }, i * 0.25);
              tl.to(marks[i], { opacity: 0, duration: 0.2 }, i * 0.25 + 0.4);
              tl.to(f, { attr: { fill: COL.green }, duration: 0.2 }, i * 0.25 + 0.6);
            });
          },
        },
      ],
      tryIt: {
        say: 'Your turn: take the first letters, in order.',
        mount(host, k2) {
          const { card, T: t, R: r, C: c, COL: col, el } = k2;
          const set = ['MANGO', 'ELBOW', 'DONKEY', 'APPLE', 'LADDER'];
          const order = [2, 0, 4, 1, 3];
          const target = set.map((a) => a[0]).join('');
          const { svg: pic } = card(320, 172);
          pic.classList.add('demo-svg');
          const ry = (i) => 30 + i * 28;
          const sx = (i) => 206 + i * 22;
          pic.append(t(250, 58, 'the last answer', { c: 'u', z: 10.5, f: col.faint }));
          const tiles = target.split('').map((_, i) => {
            const box = r(sx(i) - 10, 68, 20, 25, { f: '#fbf6ea', s: '#b49863', r: 3 });
            const ch = t(sx(i), 86, '', { z: 15, w: 700, f: col.green });
            pic.append(box, ch);
            return ch;
          });
          const rowsT = order.map((n, i) => {
            const badge = c(26, ry(i) - 5, 10, { f: '#efe3c6', s: '#b49863', w: 1.2 });
            const num = t(26, ry(i) - 0.5, String(n + 1), { c: 'u', z: 11, w: 700 });
            const wd = t(46, ry(i), set[n], { z: 17, w: 700, a: 'start' });
            pic.append(badge, num, wd);
            return { n, wd };
          });
          const ask = el('div', { class: 'demo-goal', text: 'Start with answer 1. Tap it.' });
          let next = 0;
          rowsT.forEach(({ n, wd }, i) => {
            pic.append(
              tapZone(k2, 12, ry(i) - 21, 168, 26, `Answer ${n + 1}, ${set[n]}`, () => {
                if (next >= set.length) return;
                k2.audio?.tick?.();
                if (n !== next) {
                  ask.textContent = `Not yet: answer ${next + 1} comes next.`;
                  k2.gsap.fromTo(wd, { x: -5 }, { x: 0, duration: 0.3, ease: 'elastic.out(1, 0.3)' });
                  return;
                }
                const fly = t(46 + 5.1, ry(i), set[n][0], { z: 17, w: 800, f: col.brass });
                pic.append(fly);
                const slot = next;
                k2.gsap.to(fly, {
                  x: sx(slot) - 51.1,
                  y: 86 - ry(i),
                  duration: 0.5,
                  ease: 'power2.inOut',
                  onComplete: () => {
                    fly.remove();
                    tiles[slot].textContent = target[slot];
                  },
                });
                wd.setAttribute('fill', col.faint);
                next++;
                ask.textContent = next < set.length ? `Good. Now answer ${next + 1}.` : `Yes: ${target}!`;
                if (next >= set.length) ask.classList.add('ok');
              }),
            );
          });
          host.append(ask, pic);
          return () => {
            k2.gsap.killTweensOf(pic.querySelectorAll('text'));
            host.replaceChildren();
          };
        },
      },
    };
  },
};

/** Nights each place was busy, hour by hour from 20:00 to 03:00: made up for the how-to. */
const CHART = [
  [40, 90, 0, 0, 0, 0, 0, 0],
  [0, 0, 50, 110, 70, 20, 0, 0],
  [150, 180, 160, 80, 0, 0, 0, 0],
  [0, 0, 0, 0, 40, 140, 120, 30],
  [0, 0, 0, 0, 0, 30, 50, 10],
];
