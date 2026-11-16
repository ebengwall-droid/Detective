// How-tos for the ciphers: ROT13, counting letters, the pigpen, the five-by-five square, the
// rail fence, Vigenère, Playfair and Bacon's two-letter cipher. Same contract as core.js: each
// demo draws its first frame, and each step adds its moves to the timeline it is given.
// Every example is the lesson's own or a new, harmless one: no puzzle's text, key or answer.

/** @typedef {any} Kit */

const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WASH = 'rgba(168,105,28,0.16)'; // brass, thinly, behind a cell
const GREEN_WASH = 'rgba(47,122,82,0.16)';
const TILE = '#efe3c6';
const EDGE = '#b49863';

/** Move every letter of a text n places on, round past Z. */
const shift = (text, n) => text.replace(/[A-Z]/g, (ch) => AZ[(AZ.indexOf(ch) + n + 26) % 26]);

/** Bacon's code for the letter at place i: five marks, counting in twos with a for 0 and b for 1. */
const bacon5 = (i) => i.toString(2).padStart(5, '0').replace(/0/g, 'a').replace(/1/g, 'b');

/** Where letter i of Bacon's table (A to L) sits: three columns of four. */
const baconSpot = (i) => [[18, 122, 226][Math.floor(i / 4)], [26, 44, 62, 80][i % 4]];

/** The rail each letter of a zigzag lands on. */
function zigzag(n, rails) {
  const out = [];
  let r = 0;
  let d = 1;
  for (let i = 0; i < n; i++) {
    out.push(r);
    if (rails < 2) continue;
    if (r === 0) d = 1;
    else if (r === rails - 1) d = -1;
    r += d;
  }
  return out;
}

/** A Playfair square: the key word's letters once each, then the rest in order, I and J together. */
function keySquare(word) {
  let out = '';
  for (const ch of word.replace(/[^A-Z]/g, '').replace(/J/g, 'I') + 'ABCDEFGHIKLMNOPQRSTUVWXYZ') if (!out.includes(ch)) out += ch;
  return out;
}

/** A point t of the way along a gentle curve from a to b; `bend` bows it to the left of the way it goes. */
function bow([x1, y1], [x2, y2], bend, t) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const cx = (x1 + x2) / 2 + (bend * (y2 - y1)) / len;
  const cy = (y1 + y2) / 2 - (bend * (x2 - x1)) / len;
  const u = 1 - t;
  return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
}

/** Slide a text node from a to b, on the timeline. */
function glide(tl, node, a, b, { dur = 0.5, at, bend = 0, ease = 'power2.inOut' } = {}) {
  const p = { t: 0 };
  return tl.to(
    p,
    {
      t: 1,
      duration: dur,
      ease,
      onUpdate() {
        const [x, y] = bow(a, b, bend, p.t);
        node.setAttribute('x', x.toFixed(2));
        node.setAttribute('y', y.toFixed(2));
      },
    },
    at,
  );
}

/** Place a group that is drawn around (0, 0). */
function put(g, x, y, s = 1) {
  g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(3)})`);
  return g;
}

/** Carry such a group from a to b, each [x, y, scale], on the timeline. */
function carry(tl, g, a, b, { dur = 0.6, at, bend = 0, ease = 'power2.inOut' } = {}) {
  const p = { t: 0 };
  const s1 = a[2] ?? 1;
  const s2 = b[2] ?? 1;
  put(g, a[0], a[1], s1);
  return tl.to(
    p,
    {
      t: 1,
      duration: dur,
      ease,
      onUpdate() {
        const [x, y] = bow(a, b, bend, p.t);
        put(g, x, y, s1 + (s2 - s1) * p.t);
      },
    },
    at,
  );
}

/** Count a text node on through the alphabet from letter `from`, `by` places. */
function spin(tl, node, from, by, { dur = 0.3, at } = {}) {
  const p = { v: 0 };
  return tl.to(
    p,
    {
      v: by,
      duration: dur,
      ease: 'none',
      onUpdate() {
        node.textContent = AZ[(from + Math.round(p.v)) % 26];
      },
    },
    at,
  );
}

/** Make an SVG node something to tap. */
function tappable(node, label, fn) {
  node.style.cursor = 'pointer';
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', label);
  node.addEventListener('click', fn);
  return node;
}

/**
 * The strokes of a pigpen sign around (0, 0), in a box of half-size h: a grid letter is the lines
 * around its cell, a cross letter the two lines either side of its space. Dotted letters get a dot.
 */
function pigSign(ch, h = 11) {
  const i = AZ.indexOf(ch);
  if (i < 18) {
    const cell = i % 9;
    const r = Math.floor(cell / 3);
    const c = cell % 3;
    let d = '';
    if (r > 0) d += `M${-h} ${-h}H${h}`;
    if (r < 2) d += `M${-h} ${h}H${h}`;
    if (c > 0) d += `M${-h} ${-h}V${h}`;
    if (c < 2) d += `M${h} ${-h}V${h}`;
    return { d, dot: i >= 9 ? [0, 0] : null };
  }
  const arm = (i - 18) % 4;
  const a = h * 0.75;
  const d = [`M${-h} ${-a}L0 ${a}L${h} ${-a}`, `M${-a} ${-h}L${a} 0L${-a} ${h}`, `M${a} ${-h}L${-a} 0L${a} ${h}`, `M${-h} ${a}L0 ${-a}L${h} ${a}`][arm];
  const dot = [[0, -h * 0.3], [-h * 0.3, 0], [h * 0.3, 0], [0, h * 0.3]][arm];
  return { d, dot: i >= 22 ? dot : null };
}

export const CIPHERS = {
  // ------------------------------------------------------------------ ROT13
  rot13(k) {
    const { svg, T, L, R, G, COL, ABC } = k;
    const x = (i) => 26 + i * 22.4;
    const Y1 = 36;
    const Y2 = 94;
    /** Where a letter sits in the two rows. */
    const spot = (ch) => {
      const i = ABC.indexOf(ch);
      return [x(i % 13), i < 13 ? Y1 : Y2];
    };
    const partner = (ch) => ABC[(ABC.indexOf(ch) + 13) % 26];
    const boxes = G({});
    const top = Array.from(ABC.slice(0, 13), (ch, i) => T(x(i), Y1, ch, { z: 16, w: 700 }));
    const bottom = Array.from(ABC.slice(13), (ch, i) => T(x(i), Y2, ch, { z: 16, w: 700, f: COL.green }));
    const links = top.map((_, i) => L(x(i), Y1 + 9, x(i), Y2 - 19, { s: COL.faint, w: 1.1, m: k.arrow('faint'), ms: k.arrow('faint') }));
    const fly = G({});
    const WX = (i) => 46 + i * 20;
    const OX = (i) => 194 + i * 20;
    const W1 = 146;
    const W2 = 184;
    const word = Array.from('HELLO', (ch, i) => T(WX(i), W1, ch, { z: 18, w: 700 }));
    const to1 = T(160, W1 - 1, '→', { c: 'u', z: 18, f: COL.faint });
    const to2 = T(160, W2 - 1, '→', { c: 'u', z: 18, f: COL.faint });
    svg.append(boxes, G({}, links), ...top, ...bottom, ...word, to1, to2, fly);
    k.hide(top, bottom, links, word, to1, to2);
    const box = (cx) => {
      const b = R(cx - 11, 19, 22, 84, { s: COL.brass, w: 2, r: 6 });
      boxes.append(b);
      return k.hide(b);
    };
    /** Swap each letter of `text` (shown by the nodes `from`) across the rows, into the slots on line y. */
    const swap = (tl, from, text, y, ink, back, start) => {
      const cols = Array.from(text, (ch) => spot(ch)[0]);
      const b = box(cols[0]);
      let t = start;
      Array.from(text).forEach((ch, i) => {
        const p = spot(partner(ch));
        const c = T(p[0], p[1], partner(ch), { z: 18, w: 700, f: ink });
        fly.append(c);
        k.hide(c);
        tl.to(b, i ? { attr: { x: cols[i] - 11 }, duration: 0.14 } : { opacity: 1, duration: 0.14 }, t);
        tl.to(from[i], { attr: { fill: COL.brass }, duration: 0.1 }, t);
        tl.set(c, { opacity: 1 }, t + 0.1);
        glide(tl, c, p, [OX(i), y], { dur: 0.42, at: t + 0.1 });
        tl.to(from[i], { attr: { fill: back }, duration: 0.15 }, t + 0.4);
        t += 0.3;
      });
      tl.to(b, { opacity: 0, duration: 0.2 }, t + 0.15);
    };
    return {
      steps: [
        {
          say: 'Write A to M on top, and N to Z under them.',
          run: (tl) => tl.to(top, { opacity: 1, duration: 0.2, stagger: 0.04 }).to(bottom, { opacity: 1, duration: 0.2, stagger: 0.04 }, '-=0.15'),
        },
        {
          say: 'Each letter swaps with its partner: A with N.',
          run: (tl) => {
            const b = box(x(0));
            const a = T(x(0), Y1, 'A', { z: 16, w: 700, f: COL.brass });
            const n = T(x(0), Y2, 'N', { z: 16, w: 700, f: COL.brass });
            fly.append(a, n);
            k.hide(a, n);
            tl.to(links, { opacity: 1, duration: 0.25, stagger: 0.03 })
              .to(b, { opacity: 1, duration: 0.25 })
              .set([a, n], { opacity: 1 })
              .to([top[0], bottom[0]], { opacity: 0.2, duration: 0.15 }, '<');
            glide(tl, a, [x(0), Y1], [x(0), Y2], { dur: 0.8, bend: 22 });
            glide(tl, n, [x(0), Y2], [x(0), Y1], { dur: 0.8, bend: 22, at: '<' });
            tl.to([a, n], { opacity: 0, duration: 0.25 }, '+=0.2').to([top[0], bottom[0]], { opacity: 1, duration: 0.25 }, '<');
          },
        },
        {
          say: 'Swap every letter: HELLO becomes URYYB.',
          run: (tl) => {
            tl.to([...boxes.children], { opacity: 0, duration: 0.2 });
            tl.to(word, { opacity: 1, duration: 0.2, stagger: 0.04 }, 0).to(to1, { opacity: 1, duration: 0.15 });
            swap(tl, word, 'HELLO', W1, COL.green, COL.ink, 0.55);
          },
        },
        {
          say: 'Swap again, and HELLO comes back.',
          run: (tl) => {
            const again = Array.from('URYYB', (ch, i) => T(OX(i), W1, ch, { z: 18, w: 700, f: COL.green }));
            fly.append(...again);
            again.forEach((n, i) => glide(tl, n, [OX(i), W1], [WX(i), W2], { dur: 0.5, at: i * 0.04 }));
            tl.to(to2, { opacity: 1, duration: 0.15 }, 0.5);
            swap(tl, again, 'URYYB', W2, COL.ink, COL.green, 0.6);
          },
        },
      ],
      tryIt: {
        say: 'Tap each letter to swap it and read the secret.',
        mount(host, k2) {
          const { card, T: t, L: l, R: r, G: g, COL: c, ABC: abc, el, gsap } = k2;
          const secret = 'OENIB';
          const across = (ch) => abc[(abc.indexOf(ch) + 13) % 26];
          const plainWord = Array.from(secret, across).join('');
          const x2 = (i) => 26 + i * 22.4;
          const { svg: pic } = card(320, 138);
          pic.classList.add('demo-svg');
          const band = r(0, 11, 20, 50, { f: WASH, s: 'none', r: 5 });
          pic.append(band);
          for (let i = 0; i < 13; i++) pic.append(t(x2(i), 27, abc[i], { z: 13, w: 600 }), l(x2(i), 32, x2(i), 42, { s: c.rule, w: 1 }), t(x2(i), 55, abc[i + 13], { z: 13, w: 700, f: c.green }));
          const note = el('div', { class: 'demo-note' });
          host.append(pic, note);
          gsap.set(band, { opacity: 0 });
          const tweens = [];
          const shown = Array.from(secret);
          const tiles = Array.from(secret, (ch, i) => {
            const cx = 64 + i * 48;
            const face = r(cx - 20, 74, 40, 48, { f: TILE, s: EDGE, r: 6 });
            const letter = t(cx, 107, ch, { z: 24, w: 700, f: c.green });
            const tile = g({}, face, letter);
            pic.append(tile);
            tappable(tile, `Swap letter ${i + 1}`, () => flip(i));
            return { cx, tile, face, letter };
          });
          const turning = [];
          const flip = (i) => {
            k2.audio?.tick?.();
            turning[i]?.progress(1);
            const { cx, tile, face, letter } = tiles[i];
            shown[i] = across(shown[i]);
            const plain = shown[i] !== secret[i];
            band.setAttribute('x', String(x2(abc.indexOf(shown[i]) % 13) - 10));
            tweens.push(gsap.fromTo(band, { opacity: 1 }, { opacity: 0, duration: 1.2, ease: 'power2.in' }));
            const now = shown[i];
            turning[i] = gsap
              .timeline()
              .to(tile, { scaleY: 0, svgOrigin: `${cx} 98`, duration: 0.1, ease: 'power1.in' })
              .call(() => {
                letter.textContent = now;
                letter.setAttribute('fill', plain ? c.ink : c.green);
                face.setAttribute('fill', plain ? '#f8f2e2' : TILE);
              })
              .to(tile, { scaleY: 1, svgOrigin: `${cx} 98`, duration: 0.14, ease: 'power1.out' });
            tweens.push(turning[i]);
            const whole = shown.join('') === plainWord;
            note.textContent = whole ? `It says ${plainWord}. Tap again to hide it.` : '';
            for (const tile of tiles) tile.face.setAttribute('stroke', whole ? c.green : EDGE);
          };
          return () => {
            for (const tw of tweens) tw.kill();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ counting letters
  frequency(k) {
    const { svg, T, R, C, G, COL, ABC } = k;
    // How often each letter comes up in English, in every hundred letters.
    const EN = [8.2, 1.5, 2.8, 4.3, 12.7, 2.2, 2.0, 6.1, 7.0, 0.2, 0.8, 4.0, 2.4, 6.7, 7.5, 1.9, 0.1, 6.0, 6.3, 9.1, 2.8, 1.0, 2.4, 0.2, 2.0, 0.1];
    const x = (i) => 18 + i * 11.4;
    const BASE = 66; // the English bars stand on this line
    const AXIS = 80; // the letters
    const HANG = 102; // the secret's bars hang from this line
    const UNIT = 7.5;
    const PLAIN = 'SEE ME HERE AT TEN';
    const SECRET = shift(PLAIN, 3);
    const H = ABC.indexOf('H');
    const english = EN.map((_, i) => R(x(i) - 3.5, BASE, 7, 0, { f: i === 4 ? COL.brass : '#cdb98d', s: 'none', r: 1.5 }));
    const axis = Array.from(ABC, (ch, i) => T(x(i), AXIS, ch, { z: 10, w: 600, f: COL.faint }));
    const bars = Array.from(ABC, (_, i) => R(x(i) - 3.5, HANG, 7, 0, { f: '#9cc0a8', s: 'none', r: 1.5 }));
    const mx = (j) => 160 + (j - (SECRET.length - 1) / 2) * 8.6;
    const line = Array.from(SECRET, (ch, j) => T(mx(j), 166, ch, { z: 13, w: 700, f: COL.green }));
    const plain = Array.from(PLAIN, (ch, j) => T(mx(j), 189, ch, { z: 13, w: 700 }));
    const enLabel = T(304, 22, 'English', { c: 'u', z: 11, f: COL.faint, a: 'end' });
    const seLabel = T(304, 146, 'secret', { c: 'u', z: 11, f: COL.green, a: 'end' });
    const floors = [k.L(12, BASE + 0.5, 308, BASE + 0.5, { s: COL.rule, w: 1 }), k.L(12, HANG - 0.5, 308, HANG - 0.5, { s: COL.rule, w: 1 })];
    svg.append(...floors, G({}, english), G({}, bars), ...axis, ...line, ...plain, enLabel, seLabel);
    k.hide(line, plain, enLabel, seLabel, floors[1]);
    const counts = Array(26).fill(0);
    return {
      steps: [
        {
          say: 'In English, E is the most common letter.',
          run: (tl) => {
            english.forEach((b, i) => tl.to(b, { attr: { y: BASE - EN[i] * 3.7, height: EN[i] * 3.7 }, duration: 0.45, ease: 'power2.out' }, 0.05 + i * 0.03));
            tl.to(enLabel, { opacity: 1, duration: 0.3 }, 0.2);
            tl.to(axis[4], { attr: { fill: COL.brass }, duration: 0.3 }, 0.9).set(axis[4], { attr: { 'font-weight': 800 } }, 0.9);
          },
        },
        {
          say: 'Now count each letter of a secret message.',
          run: (tl) => {
            tl.to(line, { opacity: 1, duration: 0.2, stagger: 0.015 }).to([seLabel, floors[1]], { opacity: 1, duration: 0.3 }, '<');
            let t = 0.55;
            Array.from(SECRET).forEach((ch, j) => {
              if (ch === ' ') return;
              const i = ABC.indexOf(ch);
              counts[i] += 1;
              tl.to(line[j], { attr: { fill: COL.brass }, duration: 0.05 }, t)
                .to(bars[i], { attr: { height: counts[i] * UNIT }, duration: 0.12 }, t)
                .to(line[j], { attr: { fill: COL.green }, duration: 0.15 }, t + 0.1);
              t += 0.1;
            });
          },
        },
        {
          say: 'H comes up most, so H probably stands for E.',
          run: (tl) => {
            const guess = T(x(H) + 14, HANG + 34, 'E?', { c: 'u', z: 14, w: 700, f: COL.brass, a: 'start' });
            svg.append(guess);
            k.hide(guess);
            tl.to(bars[H], { attr: { fill: COL.brass }, duration: 0.3 })
              .to(axis[H], { attr: { fill: COL.brass }, duration: 0.3 }, '<')
              .set(axis[H], { attr: { 'font-weight': 800 } }, '<')
              .to(line.filter((n) => n.textContent === 'H'), { attr: { fill: COL.brass }, duration: 0.2, stagger: 0.07 }, '<')
              .fromTo(guess, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.35 }, '+=0.1');
          },
        },
        {
          say: 'From E to H is 3 places, so the shift is 3.',
          run: (tl) => {
            const ring = C(x(4), AXIS - 3.6, 6.6, { s: COL.brass, w: 1.6 });
            svg.append(ring);
            k.hide(ring);
            tl.to(ring, { opacity: 1, duration: 0.25 });
            [5, 6, 7].forEach((i, n) => {
              const num = T(x(i), 95, String(n + 1), { z: 10, w: 700, f: COL.brass });
              svg.append(num);
              k.hide(num);
              tl.to(ring, { attr: { cx: x(i) }, duration: 0.3, ease: 'power2.inOut' }, '+=0.1').to(num, { opacity: 1, duration: 0.15 }, '-=0.1');
            });
            const res = T(178, 136, 'shift 3', { c: 'u', z: 16, w: 700, f: COL.brass });
            svg.append(res);
            k.hide(res);
            tl.fromTo(res, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.35 }, '+=0.15');
          },
        },
        {
          say: 'Move every letter 3 back, and you can read it.',
          run: (tl) => tl.to(line, { opacity: 0.45, duration: 0.3 }).fromTo(plain, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04 }, '<'),
        },
      ],
      tryIt: {
        say: 'Count the letters, then tap the tallest bar.',
        mount(host, k2) {
          const { card, T: t, R: r, P: p, G: g, COL: c, ABC: abc, el, gsap } = k2;
          const SETS = [
            ['SEVEN SHEEP SLEEP', 5],
            ['THE BEES NEED TREES', 9],
          ];
          const FLOOR = 112;
          const { svg: pic } = card(320, 192);
          pic.classList.add('demo-svg');
          const ask = el('div', { class: 'demo-goal' });
          const countBtn = el('button', { class: 'demo-ibtn', type: 'button', text: 'Count letters' });
          const otherBtn = el('button', { class: 'demo-ibtn', type: 'button', text: 'New message' });
          host.append(ask, pic, el('div', { class: 'demo-controls' }, countBtn, otherBtn));
          const layer = g({});
          pic.append(k2.L(20, FLOOR + 0.5, 300, FLOOR + 0.5, { s: c.rule, w: 1 }), layer);
          let set = 0;
          let state = null;
          let run = null;
          const start = () => {
            run?.kill();
            layer.replaceChildren();
            const [said, n] = SETS[set];
            const secret = shift(said, n);
            const letters = [...new Set(secret.replace(/ /g, ''))].sort();
            const bx = (i) => 160 + (i - (letters.length - 1) / 2) * 36;
            const mx2 = (j) => 160 + (j - (secret.length - 1) / 2) * 11.5;
            const text = Array.from(secret, (ch, j) => t(mx2(j), 30, ch, { z: 16, w: 700, f: c.green }));
            const bars2 = letters.map((_, i) => r(bx(i) - 12, FLOOR, 24, 0, { f: '#9cc0a8', s: 'none', r: 2 }));
            const nums = letters.map((_, i) => t(bx(i), FLOOR - 5, '', { z: 11, w: 700, f: c.faint }));
            const labels = letters.map((ch, i) => t(bx(i), 130, ch, { z: 15, w: 700 }));
            layer.append(...text, ...bars2, ...nums, ...labels);
            letters.forEach((ch, i) => layer.append(tappable(r(bx(i) - 17, 40, 34, 98, { f: 'transparent', s: 'none' }), `The bar for ${ch}`, () => pick(i))));
            state = { said, n, secret, letters, text, bars: bars2, nums, bx, counted: false, over: false, tally: letters.map(() => 0) };
            ask.classList.remove('ok');
            ask.textContent = 'First, count the letters.';
            countBtn.disabled = false;
          };
          const count = () => {
            if (!state || state.counted || run?.isActive()) return;
            k2.audio?.tick?.();
            countBtn.disabled = true;
            const { secret, letters, bars: bs, nums, text, tally } = state;
            run = gsap.timeline({
              onComplete: () => {
                state.counted = true;
                ask.textContent = 'Now tap the tallest bar.';
              },
            });
            Array.from(secret).forEach((ch, j) => {
              if (ch === ' ') return;
              const i = letters.indexOf(ch);
              tally[i] += 1;
              const v = tally[i];
              run
                .to(text[j], { attr: { fill: c.brass }, duration: 0.04 })
                .to(bs[i], { attr: { y: FLOOR - v * 9, height: v * 9 }, duration: 0.08 }, '<')
                .call(() => {
                  nums[i].textContent = String(v);
                  nums[i].setAttribute('y', String(FLOOR - v * 9 - 5));
                })
                .to(text[j], { attr: { fill: c.green }, duration: 0.05 }, '+=0.01');
            });
          };
          const pick = (i) => {
            if (!state || state.over) return;
            k2.audio?.tick?.();
            if (!state.counted) {
              ask.textContent = 'Count the letters first.';
              return;
            }
            const { letters, tally, n, said, text, bars: bs } = state;
            const best = tally.indexOf(Math.max(...tally));
            if (i !== best) {
              ask.textContent = `${letters[i]} is not the tallest. Look again.`;
              return;
            }
            state.over = true;
            bs[i].setAttribute('fill', c.brass);
            const sx = (q) => 160 + (q - n / 2) * 22;
            const strip = Array.from({ length: n + 1 }, (_, q) => t(sx(q), 180, abc[(4 + q) % 26], { z: 14, w: 700, f: q === 0 || q === n ? c.brass : c.ink }));
            layer.append(...strip);
            gsap.set(strip, { opacity: 0 });
            run = gsap.timeline();
            run.to(strip, { opacity: 1, duration: 0.15, stagger: 0.03 });
            for (let q = 0; q < n; q++) {
              const mid = (sx(q) + sx(q + 1)) / 2;
              const hop = p(`M${sx(q) + 3} 166 Q${mid} 154 ${sx(q + 1) - 3} 166`, { s: c.brass, w: 1.5 });
              const num = t(mid, 151, String(q + 1), { z: 10, w: 700, f: c.brass });
              layer.append(hop, num);
              gsap.set([hop, num], { opacity: 0 });
              run.to([hop, num], { opacity: 1, duration: 0.12 }, '+=0.08');
            }
            run.call(() => {
              ask.textContent = `${letters[i]} is ${n} places after E. The shift is ${n}.`;
              ask.classList.add('ok');
            });
            run
              .to(text, { opacity: 0, duration: 0.15, stagger: 0.015 }, '+=0.2')
              .call(() =>
                text.forEach((node, j) => {
                  node.textContent = said[j];
                  node.setAttribute('fill', c.ink);
                }),
              )
              .to(text, { opacity: 1, duration: 0.2, stagger: 0.03 });
          };
          countBtn.addEventListener('click', count);
          otherBtn.addEventListener('click', () => {
            k2.audio?.tick?.();
            set = (set + 1) % SETS.length;
            start();
          });
          start();
          return () => {
            run?.kill();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the pigpen
  pigpen(k) {
    const { svg, T, L, R, C, P, G, COL, ABC } = k;
    const g = 22;
    const GRIDS = [
      [10, 14],
      [88, 14],
    ];
    const CROSSES = [
      [196, 47],
      [276, 47],
    ];
    const XR = 30;
    const SPOTS = [[0, -17], [-17, 0], [17, 0], [0, 17]];
    const dotted = (i) => (i >= 9 && i < 18) || i >= 22;
    /** The middle of a letter's space in the key. */
    const home = (i) => {
      if (i < 18) {
        const [x0, y0] = GRIDS[i < 9 ? 0 : 1];
        const cell = i % 9;
        return [x0 + (cell % 3) * g + g / 2, y0 + Math.floor(cell / 3) * g + g / 2];
      }
      const [cx, cy] = CROSSES[i < 22 ? 0 : 1];
      const [dx, dy] = SPOTS[(i - 18) % 4];
      return [cx + dx, cy + dy];
    };
    const frame = [];
    for (const [x0, y0] of GRIDS) frame.push(L(x0 + g, y0, x0 + g, y0 + 3 * g, { w: 1.6 }), L(x0 + 2 * g, y0, x0 + 2 * g, y0 + 3 * g, { w: 1.6 }), L(x0, y0 + g, x0 + 3 * g, y0 + g, { w: 1.6 }), L(x0, y0 + 2 * g, x0 + 3 * g, y0 + 2 * g, { w: 1.6 }));
    for (const [cx, cy] of CROSSES) frame.push(L(cx - XR, cy - XR, cx + XR, cy + XR, { w: 1.6 }), L(cx + XR, cy - XR, cx - XR, cy + XR, { w: 1.6 }));
    const keyLetters = Array.from(ABC, (ch, i) => {
      const [x, y] = home(i);
      const d = dotted(i);
      return G({}, T(d ? x - 4 : x, y + 4.5, ch, { z: 12, w: 600 }), d ? C(x + 5, y, 1.8, { f: COL.ink, s: 'none' }) : null);
    });
    const washes = G({});
    const signs = G({});
    svg.append(washes, ...frame, ...keyLetters, signs);
    for (const line of frame) k.undraw(line);
    k.hide(keyLetters);
    const SLOT_Y = 144;
    const SLOTS = [52, 124, 196, 268];
    /** Light up a letter's space, lift the lines around it out of the key, and set them down as its sign. */
    const show = (tl, ch, slot, at) => {
      const i = ABC.indexOf(ch);
      const [hx, hy] = home(i);
      let wash;
      let d;
      let from;
      let scale;
      let dot = null;
      if (i < 18) {
        wash = R(hx - g / 2, hy - g / 2, g, g, { f: WASH, s: 'none', r: 0 });
        d = pigSign(ch, g / 2).d;
        from = [hx, hy, 1];
        scale = 1.15;
        if (dotted(i)) dot = C(5, 0, 2.2, { f: COL.brass, s: 'none' });
      } else {
        const [cx, cy] = CROSSES[i < 22 ? 0 : 1];
        const arm = (i - 18) % 4;
        const corners = [
          [[cx - XR, cy - XR], [cx + XR, cy - XR]],
          [[cx - XR, cy - XR], [cx - XR, cy + XR]],
          [[cx + XR, cy - XR], [cx + XR, cy + XR]],
          [[cx - XR, cy + XR], [cx + XR, cy + XR]],
        ][arm];
        wash = k.s('polygon', { points: `${corners[0].join(',')} ${corners[1].join(',')} ${cx},${cy}`, fill: WASH });
        d = ['M-30 -15L0 15L30 -15', 'M-15 -30L15 0L-15 30', 'M15 -30L-15 0L15 30', 'M-30 15L0 -15L30 15'][arm];
        from = [cx + [0, -15, 15, 0][arm], cy + [-15, 0, 0, 15][arm], 1];
        scale = 0.45;
      }
      const path = P(d, { s: COL.brass, w: 2.6 });
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      const sign = G({}, path, dot);
      signs.append(sign);
      put(sign, from[0], from[1], 1);
      k.undraw(path);
      washes.append(wash);
      k.hide(wash);
      if (dot) k.hide(dot);
      const label = T(SLOTS[slot], 184, ch, { z: 17, w: 700, f: COL.brass });
      svg.append(label);
      k.hide(label);
      tl.to(wash, { opacity: 1, duration: 0.15 }, at).to(path, { strokeDashoffset: 0, duration: 0.3 }, at + 0.1);
      if (dot) tl.to(dot, { opacity: 1, duration: 0.15 }, at + 0.3);
      tl.set(path, { strokeDasharray: 'none' }, at + 0.45);
      carry(tl, sign, from, [SLOTS[slot], SLOT_Y, scale], { dur: 0.55, at: at + 0.5, bend: 24 });
      if (dot) tl.to(dot, { attr: { cx: 0 }, duration: 0.55 }, at + 0.5);
      tl.to(label, { opacity: 1, duration: 0.2 }, at + 1.0).to(wash, { opacity: 0, duration: 0.25 }, at + 1.0);
    };
    return {
      steps: [
        {
          say: 'Draw two grids and two big X shapes.',
          run: (tl) => frame.forEach((line, i) => tl.to(line, { strokeDashoffset: 0, duration: 0.3, ease: 'power1.inOut' }, i * 0.1)),
        },
        {
          say: 'Fill in the letters, with dots in the second grid and X.',
          run: (tl) => tl.to(keyLetters, { opacity: 1, duration: 0.2, stagger: 0.045 }),
        },
        {
          say: 'Each letter is drawn as the lines around its space.',
          run: (tl) => {
            show(tl, 'A', 0, 0);
            show(tl, 'E', 1, 1.15);
          },
        },
        { say: 'S sits in the X, so its sign is a V.', run: (tl) => show(tl, 'S', 2, 0) },
        { say: 'J is in the dotted grid: like A, plus a dot.', run: (tl) => show(tl, 'J', 3, 0) },
      ],
      tryIt: {
        say: 'Read the signs: tap each one’s letter in the key.',
        mount(host, k2) {
          const { card, T: t, L: l, R: r, C: c, P: p, G: gg, COL: col, ABC: abc, el, gsap, s } = k2;
          const WORD = 'SWAN';
          // The key two by two, as the game lays it out on a phone, so every space is big enough to tap.
          const cell = 30;
          const GR = [
            [10, 8],
            [110, 8],
          ];
          const XS = [
            [55, 152],
            [155, 152],
          ];
          const XR = 40;
          const SP = [[0, -22], [-22, 0], [22, 0], [0, 22]];
          const { svg: pic } = card(320, 204);
          pic.classList.add('demo-svg');
          const ask = el('div', { class: 'demo-goal' });
          host.append(pic, ask);
          const tweens = [];
          const ink = gg({ 'pointer-events': 'none' });
          const lit = gg({ 'pointer-events': 'none' });
          /** The lines around a letter's space in this key, and where its dot is. */
          const around = [];
          Array.from(abc).forEach((ch, i) => {
            let hit;
            let x;
            let y;
            let lines;
            if (i < 18) {
              const [x0, y0] = GR[i < 9 ? 0 : 1];
              const q = i % 9;
              const left = x0 + (q % 3) * cell;
              const top = y0 + Math.floor(q / 3) * cell;
              hit = r(left, top, cell, cell, { f: col.brass, s: 'none', r: 0 });
              x = left + cell / 2;
              y = top + cell / 2;
              lines = [pigSign(ch, cell / 2).d, x, y];
            } else {
              const [cx, cy] = XS[i < 22 ? 0 : 1];
              const arm = (i - 18) % 4;
              const h = XR / 2;
              const corners = [
                [[cx - XR, cy - XR], [cx + XR, cy - XR]],
                [[cx - XR, cy - XR], [cx - XR, cy + XR]],
                [[cx + XR, cy - XR], [cx + XR, cy + XR]],
                [[cx - XR, cy + XR], [cx + XR, cy + XR]],
              ][arm];
              hit = s('polygon', { points: `${corners[0].join(',')} ${corners[1].join(',')} ${cx},${cy}`, fill: col.brass });
              x = cx + SP[arm][0];
              y = cy + SP[arm][1];
              const d = [`M${-XR} ${-h}L0 ${h}L${XR} ${-h}`, `M${-h} ${-XR}L${h} 0L${-h} ${XR}`, `M${h} ${-XR}L${-h} 0L${h} ${XR}`, `M${-XR} ${h}L0 ${-h}L${XR} ${h}`][arm];
              lines = [d, cx + [0, -h, h, 0][arm], cy + [-h, 0, 0, h][arm]];
            }
            hit.setAttribute('fill-opacity', '0');
            pic.append(tappable(hit, `The space for ${ch}`, () => choose(ch, hit)));
            const dotted = (i >= 9 && i < 18) || i >= 22;
            ink.append(t(dotted ? x - 4 : x, y + 5.5, ch, { z: 15, w: 600 }));
            if (dotted) ink.append(c(x + 6.5, y, 2, { f: col.ink, s: 'none' }));
            around.push({ lines, dot: dotted ? [x + 6.5, y] : null });
          });
          for (const [x0, y0] of GR) ink.append(l(x0 + cell, y0, x0 + cell, y0 + 3 * cell, { w: 1.6 }), l(x0 + 2 * cell, y0, x0 + 2 * cell, y0 + 3 * cell, { w: 1.6 }), l(x0, y0 + cell, x0 + 3 * cell, y0 + cell, { w: 1.6 }), l(x0, y0 + 2 * cell, x0 + 3 * cell, y0 + 2 * cell, { w: 1.6 }));
          for (const [cx, cy] of XS) ink.append(l(cx - XR, cy - XR, cx + XR, cy + XR, { w: 1.6 }), l(cx + XR, cy - XR, cx - XR, cy + XR, { w: 1.6 }));
          pic.append(ink, lit);
          // The word to read, one sign under another, with a box beside each for its letter.
          const SY = (q) => 36 + q * 46;
          const drawSign = (ch, colour) => {
            const { d, dot } = pigSign(ch, 11);
            return gg({ 'pointer-events': 'none' }, p(d, { s: colour, w: 2.2 }), dot ? c(dot[0], dot[1], 2, { f: colour, s: 'none' }) : null);
          };
          const boxes = Array.from(WORD, (_, q) => r(266, SY(q) - 15, 30, 30, { f: '#f8f2e2', s: col.rule, r: 4 }));
          const got = Array.from(WORD, (_, q) => t(281, SY(q) + 6.5, '', { z: 18, w: 700, f: col.green }));
          pic.append(...Array.from(WORD, (ch, q) => put(drawSign(ch, col.ink), 234, SY(q), 1.15)), ...Array.from(WORD, (_, q) => t(253, SY(q) + 5, '=', { z: 14, f: col.faint })), ...boxes, ...got);
          let at = 0;
          const draw = () => boxes.forEach((b, q) => b.setAttribute('stroke', q === at ? col.brass : q < at ? col.green : col.rule));
          /** Light the tapped space and the lines around it: that is its sign. */
          const flash = (i, hit, colour) => {
            hit.setAttribute('fill', colour);
            const { lines, dot } = around[i];
            const shape = put(gg({}, p(lines[0], { s: colour, w: 3 })), lines[1], lines[2]);
            lit.replaceChildren(...[shape, dot && c(dot[0], dot[1], 2.8, { f: colour, s: 'none' })].filter(Boolean));
            tweens.push(gsap.fromTo(hit, { attr: { 'fill-opacity': 0.3 } }, { attr: { 'fill-opacity': 0 }, duration: 1.2, ease: 'power1.in' }));
            tweens.push(gsap.fromTo(lit, { opacity: 1 }, { opacity: 0, duration: 0.5, delay: 1.1, overwrite: true }));
          };
          const choose = (ch, hit) => {
            k2.audio?.tick?.();
            if (at >= WORD.length) return;
            const i = abc.indexOf(ch);
            if (ch === WORD[at]) {
              flash(i, hit, col.green);
              got[at].textContent = ch;
              at += 1;
              ask.classList.toggle('ok', at >= WORD.length);
              ask.textContent = at >= WORD.length ? `${WORD}! You can read pigpen.` : `Yes, ${ch}. Now the next sign.`;
            } else {
              flash(i, hit, col.red);
              ask.textContent = `Not that one: the red lines are the sign for ${ch}.`;
            }
            draw();
          };
          ask.textContent = 'Find the first sign in the key.';
          draw();
          return () => {
            for (const tw of tweens) tw.kill();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the five-by-five square
  polybius(k) {
    const { svg, T, R, G, COL } = k;
    const ROWS = ['ABCDE', 'FGHIK', 'LMNOP', 'QRSTU', 'VWXYZ'];
    const g = 28;
    const x0 = 46;
    const y0 = 42;
    const cx = (c) => x0 + c * g + g / 2;
    const cy = (r) => y0 + r * g + g / 2;
    const find = (ch) => {
      const r = ROWS.findIndex((row) => row.includes(ch));
      return [r, ROWS[r].indexOf(ch)];
    };
    const back = G({});
    const cells = [];
    const letters = [];
    ROWS.forEach((row, r) =>
      Array.from(row).forEach((ch, c) => {
        cells.push(R(x0 + c * g, y0 + r * g, g, g, { s: COL.rule, r: 0 }));
        letters.push(T(cx(c), cy(r) + 5, ch === 'I' ? 'I/J' : ch, { z: ch === 'I' ? 10 : 15, w: 600 }));
      }),
    );
    const colNums = [0, 1, 2, 3, 4].map((c) => T(cx(c), y0 - 9, String(c + 1), { z: 13, w: 700, f: COL.faint }));
    const rowNums = [0, 1, 2, 3, 4].map((r) => T(x0 - 14, cy(r) + 4.5, String(r + 1), { z: 13, w: 700, f: COL.faint }));
    const colWord = T(cx(2), 17, 'column', { c: 'u', z: 10.5, f: COL.faint });
    const rowWord = T(18, cy(2), 'row', { c: 'u', z: 10.5, f: COL.faint });
    rowWord.setAttribute('transform', `rotate(-90 18 ${cy(2)})`);
    const marks = G({});
    const DY = 104;
    const dH = T(214, DY, 'H', { z: 22, w: 700, f: COL.brass });
    const dEq = T(238, DY - 1, '=', { z: 18, f: COL.faint });
    svg.append(back, G({}, cells), ...letters, ...colNums, ...rowNums, colWord, rowWord, marks, dH, dEq);
    k.hide(cells, letters, colNums, rowNums, colWord, rowWord, dH, dEq);
    const [hr, hc] = find('H');
    return {
      steps: [
        {
          say: 'Fill a 5 by 5 square with the alphabet, I and J together.',
          run: (tl) => {
            cells.forEach((cell, n) => tl.to([cell, letters[n]], { opacity: 1, duration: 0.18 }, n * 0.05));
            const ij = letters[ROWS.join('').indexOf('I')];
            tl.to(ij, { attr: { fill: COL.brass }, duration: 0.2 }).to(ij, { attr: { fill: COL.ink }, duration: 0.3 }, '+=0.35');
          },
        },
        {
          say: 'Number the rows and the columns from 1 to 5.',
          run: (tl) =>
            tl
              .to(colNums, { opacity: 1, duration: 0.2, stagger: 0.08 })
              .to(colWord, { opacity: 1, duration: 0.3 }, '<0.2')
              .to(rowNums, { opacity: 1, duration: 0.2, stagger: 0.08 })
              .to(rowWord, { opacity: 1, duration: 0.3 }, '<0.2'),
        },
        {
          say: 'To write H as numbers, find its row: 2.',
          run: (tl) => {
            const band = R(x0, y0 + hr * g, 5 * g, g, { f: WASH, s: 'none', r: 0 });
            const ring = R(x0 + hc * g, y0 + hr * g, g, g, { f: 'none', s: COL.brass, w: 2.2, r: 0 });
            back.append(band);
            marks.append(ring);
            k.hide(band, ring);
            const two = T(x0 - 14, cy(hr) + 4.5, String(hr + 1), { z: 13, w: 700, f: COL.brass });
            svg.append(two);
            k.hide(two);
            tl.to([dH, dEq], { opacity: 1, duration: 0.3 })
              .to(ring, { opacity: 1, duration: 0.25 })
              .to(letters[hr * 5 + hc], { attr: { fill: COL.brass }, duration: 0.25 }, '<')
              .to(band, { opacity: 1, duration: 0.3 }, '+=0.15')
              .to(rowNums[hr], { attr: { fill: COL.brass }, duration: 0.2 }, '<')
              .set(two, { opacity: 1 }, '+=0.1');
            glide(tl, two, [x0 - 14, cy(hr) + 4.5], [262, DY], { dur: 0.8 });
            tl.to(two, { attr: { 'font-size': 22 }, duration: 0.8 }, '<');
          },
        },
        {
          say: 'Its column is 3, so H is 2 3.',
          run: (tl) => {
            const band = R(x0 + hc * g, y0, g, 5 * g, { f: WASH, s: 'none', r: 0 });
            back.append(band);
            k.hide(band);
            const three = T(cx(hc), y0 - 9, String(hc + 1), { z: 13, w: 700, f: COL.brass });
            svg.append(three);
            k.hide(three);
            tl.to(band, { opacity: 1, duration: 0.3 }).to(colNums[hc], { attr: { fill: COL.brass }, duration: 0.2 }, '<').set(three, { opacity: 1 }, '+=0.1');
            glide(tl, three, [cx(hc), y0 - 9], [286, DY], { dur: 0.8, bend: 40 });
            tl.to(three, { attr: { 'font-size': 22 }, duration: 0.8 }, '<');
          },
        },
        {
          say: 'A word is just pairs: CAT is 13 11 44.',
          run: (tl) => {
            tl.to([...back.children, ...marks.children], { opacity: 0, duration: 0.3 })
              .to(letters[hr * 5 + hc], { attr: { fill: COL.ink }, duration: 0.3 }, '<')
              .to([rowNums[hr], colNums[hc]], { attr: { fill: COL.faint }, duration: 0.3 }, '<');
            Array.from('CAT').forEach((ch, i) => {
              const [r, c] = find(ch);
              const ring = R(x0 + c * g, y0 + r * g, g, g, { f: 'none', s: COL.brass, w: 2.2, r: 0 });
              const big = T(222 + i * 30, 150, ch, { z: 17, w: 700, f: COL.brass });
              const code = T(222 + i * 30, 174, `${r + 1}${c + 1}`, { z: 14, w: 700 });
              marks.append(ring);
              svg.append(big, code);
              k.hide(ring, big, code);
              tl.to(ring, { opacity: 1, duration: 0.12 }).to([big, code], { opacity: 1, duration: 0.2 }).to(ring, { opacity: 0, duration: 0.15 }, '+=0.12');
            });
          },
        },
      ],
      tryIt: {
        say: 'Tap a row number, then a column number.',
        mount(host, k2) {
          const { card, T: t, R: r, C: c, G: gg, COL: col, el } = k2;
          const G0 = 28;
          const X0 = 58;
          const Y0 = 42;
          const cx2 = (q) => X0 + q * G0 + G0 / 2;
          const cy2 = (q) => Y0 + q * G0 + G0 / 2;
          // 34 52 31: OWL.
          const GOAL = [
            [2, 3],
            [4, 1],
            [2, 0],
          ];
          const { svg: pic } = card(320, 192);
          pic.classList.add('demo-svg');
          const note = el('div', { class: 'demo-goal' });
          host.append(pic, note);
          const rowBand = r(X0, Y0, 5 * G0, G0, { f: WASH, s: 'none', r: 0 });
          const colBand = r(X0, Y0, G0, 5 * G0, { f: WASH, s: 'none', r: 0 });
          pic.append(rowBand, colBand);
          const ink = gg({ 'pointer-events': 'none' });
          ROWS.forEach((row, rr) => Array.from(row).forEach((ch, cc) => ink.append(r(X0 + cc * G0, Y0 + rr * G0, G0, G0, { s: col.rule, r: 0 }), t(cx2(cc), cy2(rr) + 5, ch === 'I' ? 'I/J' : ch, { z: ch === 'I' ? 10 : 15, w: 600 }))));
          pic.append(ink);
          let sel = { r: -1, c: -1 };
          let found = 0;
          let timer = 0;
          const button = (x, y, n, label, fn) => {
            const disc = c(x, y, 11, { f: TILE, s: EDGE, w: 1.2 });
            const num = t(x, y + 4.5, String(n), { z: 13, w: 700 });
            num.setAttribute('pointer-events', 'none');
            pic.append(tappable(disc, label, fn), num);
            return { disc, num };
          };
          const rowBtns = [0, 1, 2, 3, 4].map((q) => button(36, cy2(q), q + 1, `Row ${q + 1}`, () => pickRow(q)));
          const colBtns = [0, 1, 2, 3, 4].map((q) => button(cx2(q), 22, q + 1, `Column ${q + 1}`, () => pickCol(q)));
          ROWS.forEach((row, rr) => Array.from(row).forEach((ch, cc) => pic.append(tappable(r(X0 + cc * G0, Y0 + rr * G0, G0, G0, { f: 'transparent', s: 'none', r: 0 }), `The letter ${ch}`, () => pickCell(rr, cc)))));
          // The numbers to read, the letters found, and what the taps point at.
          const codes = GOAL.map(([rr, cc], q) => t(228 + q * 32, 66, `${rr + 1}${cc + 1}`, { z: 15, w: 700, f: col.faint }));
          const got = GOAL.map((_, q) => t(228 + q * 32, 96, '', { z: 20, w: 700, f: col.green }));
          const readout = t(260, 152, '', { z: 18, w: 700, f: col.brass });
          pic.append(...codes, ...got, readout);
          const draw = () => {
            rowBand.setAttribute('opacity', sel.r >= 0 ? '1' : '0');
            colBand.setAttribute('opacity', sel.c >= 0 ? '1' : '0');
            if (sel.r >= 0) rowBand.setAttribute('y', String(Y0 + sel.r * G0));
            if (sel.c >= 0) colBand.setAttribute('x', String(X0 + sel.c * G0));
            rowBtns.forEach(({ disc, num }, q) => {
              disc.setAttribute('fill', q === sel.r ? col.brass : TILE);
              num.setAttribute('fill', q === sel.r ? '#fff' : col.ink);
            });
            colBtns.forEach(({ disc, num }, q) => {
              disc.setAttribute('fill', q === sel.c ? col.brass : TILE);
              num.setAttribute('fill', q === sel.c ? '#fff' : col.ink);
            });
            codes.forEach((n, q) => n.setAttribute('fill', q === found ? col.brass : q < found ? col.green : col.faint));
            const a = sel.r >= 0 ? sel.r + 1 : '·';
            const b = sel.c >= 0 ? sel.c + 1 : '·';
            readout.textContent = sel.r < 0 && sel.c < 0 ? '' : `${a} ${b}`;
            if (sel.r >= 0 && sel.c >= 0) readout.textContent += ` = ${ROWS[sel.r][sel.c] === 'I' ? 'I/J' : ROWS[sel.r][sel.c]}`;
          };
          const settle = () => {
            k2.audio?.tick?.();
            clearTimeout(timer);
            draw();
            if (sel.r < 0 || sel.c < 0) return;
            const ch = ROWS[sel.r][sel.c];
            if (found < GOAL.length && sel.r === GOAL[found][0] && sel.c === GOAL[found][1]) {
              got[found].textContent = ch;
              found += 1;
              note.classList.toggle('ok', found === GOAL.length);
              note.textContent = found === GOAL.length ? `${got.map((n) => n.textContent).join('')}! You can read the square.` : `Yes, ${ch}. Now find ${GOAL[found][0] + 1} ${GOAL[found][1] + 1}.`;
              draw();
            } else if (found < GOAL.length) note.textContent = `That is ${ch}. Look for ${GOAL[found][0] + 1} ${GOAL[found][1] + 1}.`;
            timer = setTimeout(() => {
              sel = { r: -1, c: -1 };
              draw();
            }, 1200);
          };
          const fresh = () => {
            if (sel.r >= 0 && sel.c >= 0) sel = { r: -1, c: -1 };
          };
          const pickRow = (q) => {
            fresh();
            sel.r = q;
            settle();
          };
          const pickCol = (q) => {
            fresh();
            sel.c = q;
            settle();
          };
          const pickCell = (rr, cc) => {
            sel = { r: rr, c: cc };
            settle();
          };
          note.textContent = `Find ${GOAL[0][0] + 1} ${GOAL[0][1] + 1}: row ${GOAL[0][0] + 1}, then column ${GOAL[0][1] + 1}.`;
          draw();
          return () => {
            clearTimeout(timer);
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ the rail fence
  transposition(k) {
    const { svg, T, L, C, P, G, COL } = k;
    const MSG = 'COMEATONCE';
    const SHOWN = 'COME AT ONCE';
    const RAIL = zigzag(MSG.length, 3);
    const YS = [58, 92, 126];
    const INKS = [COL.brass, COL.ink, COL.green];
    const pts = Array.from(MSG, (_, i) => [34 + i * 28, YS[RAIL[i]]]);
    const topAt = [];
    Array.from(SHOWN).forEach((ch, j) => ch !== ' ' && topAt.push(j));
    const tx = (j) => 160 + (j - (SHOWN.length - 1) / 2) * 15;
    const top = Array.from(MSG, (ch, i) => T(tx(topAt[i]), 24, ch, { z: 15, w: 700 }));
    const rails = YS.map((y) => L(16, y, 304, y, { s: COL.rule, w: 1, d: '2 4' }));
    const path = P(`M${pts.map(([x, y]) => `${x} ${y}`).join(' L')}`, { s: '#d8c39a', w: 1.6 });
    const places = pts.map(([x, y]) => C(x, y, 3.2, { f: COL.rule, s: 'none' }));
    const idx = [...Array(MSG.length).keys()];
    const order = [0, 1, 2].flatMap((r) => idx.filter((i) => RAIL[i] === r));
    const OY = 170;
    const ox = (n) => 160 + (n - 4.5) * 19 + (RAIL[order[n]] - 1) * 10;
    const token = (ch, ink) => G({}, C(0, 0, 10, { f: COL.paper, s: 'none' }), T(0, 5, ch, { z: 15, w: 700, f: ink }));
    const zig = Array.from(MSG, (ch, i) => put(token(ch, INKS[RAIL[i]]), pts[i][0], pts[i][1]));
    const layer = G({});
    svg.append(...rails, path, ...places, ...zig, ...top, layer);
    k.hide(rails, places, zig);
    k.undraw(path);
    const plen = parseFloat(path.style.strokeDasharray) || 300;
    const backs = [];
    /** Copy the letters of one line, in order, down into the secret. */
    const copyOut = (tl, r, start) => {
      let t = start;
      order.forEach((i, n) => {
        if (RAIL[i] !== r) return;
        const node = T(pts[i][0], pts[i][1] + 5, MSG[i], { z: 15, w: 700, f: INKS[r] });
        layer.append(node);
        k.hide(node);
        tl.set(node, { opacity: 1 }, t);
        glide(tl, node, [pts[i][0], pts[i][1] + 5], [ox(n), OY], { dur: 0.6, at: t });
        t += 0.17;
      });
      return t;
    };
    return {
      steps: [
        {
          say: 'Write the message in a zigzag over three lines.',
          run: (tl) => {
            tl.to(rails, { opacity: 1, duration: 0.3, stagger: 0.08 });
            tl.to(path, { strokeDashoffset: 0, duration: 1.45, ease: 'none' }, 0.45);
            idx.forEach((i) => {
              const at = 0.3 + i * 0.15;
              tl.set(zig[i], { opacity: 1 }, at);
              carry(tl, zig[i], [tx(topAt[i]), 19], pts[i], { dur: 0.45, at });
              tl.to(top[i], { opacity: 0.3, duration: 0.2 }, at);
            });
          },
        },
        { say: 'Copy out the top line first: C A C.', run: (tl) => copyOut(tl, 0, 0) },
        {
          say: 'Then the middle line, then the bottom line.',
          run: (tl) => {
            const t = copyOut(tl, 1, 0);
            copyOut(tl, 2, t + 0.1);
          },
        },
        {
          say: 'To read it, fill the lines again: 3, then 5, then 2.',
          run: (tl) => {
            tl.to(zig, { opacity: 0, duration: 0.3 }).to(path, { opacity: 0.2, duration: 0.3 }, '<').to(places, { opacity: 1, duration: 0.3 }, '<').to(top, { opacity: 0, duration: 0.3 }, '<');
            // How many letters each line takes: the first group fills the top line, and so on.
            [0, 1, 2].forEach((r) => {
              const ns = order.map((i, n) => (RAIL[i] === r ? n : -1)).filter((n) => n >= 0);
              const tag = T((ox(ns[0]) + ox(ns[ns.length - 1])) / 2, 189, String(ns.length), { c: 'u', z: 11, w: 700, f: INKS[r] });
              layer.append(tag);
              k.hide(tag);
              tl.to(tag, { opacity: 1, duration: 0.25 }, 0.3 + r * 0.12);
            });
            order.forEach((i, n) => {
              const b = token(MSG[i], INKS[RAIL[i]]);
              layer.append(b);
              k.hide(b);
              const at = 0.45 + n * 0.13;
              tl.set(b, { opacity: 1 }, at);
              carry(tl, b, [ox(n), OY - 5], pts[i], { dur: 0.5, at });
              backs[i] = b;
            });
          },
        },
        {
          say: 'Then read along the zigzag: COME AT ONCE.',
          run: (tl) => {
            tl.set(path, { strokeDashoffset: plen, opacity: 1 }).to(path, { strokeDashoffset: 0, duration: 1.4, ease: 'none' });
            idx.forEach((i) => {
              const at = 0.05 + i * 0.15;
              tl.to(backs[i].lastChild, { attr: { fill: COL.green }, duration: 0.15 }, at).to(top[i], { opacity: 1, duration: 0.2 }, at).to(top[i], { attr: { fill: COL.green }, duration: 0.2 }, at);
            });
          },
        },
      ],
      tryIt: {
        say: 'Change the number of lines and watch the zigzag.',
        mount(host, k2) {
          const { card, T: t, L: l, C: c, P: p, G: gg, COL: col, el, gsap } = k2;
          const TEXT = 'SEEYOUATSIX';
          const N = TEXT.length;
          const zx = (i) => 30 + i * 26;
          const LINES = { 2: [44, 92], 3: [28, 64, 100], 4: [24, 50, 76, 102] };
          const INK4 = [col.brass, col.ink, col.green, col.blue];
          const OY2 = 148;
          const { svg: pic } = card(320, 166);
          pic.classList.add('demo-svg');
          const railLayer = gg({});
          const pathLayer = gg({});
          const tokens = Array.from(TEXT, (ch) => gg({}, c(0, 0, 10, { f: col.paper, s: 'none' }), t(0, 5, ch, { z: 15, w: 700 })));
          const outs = Array.from(TEXT, (ch) => t(160, OY2, ch, { z: 15, w: 700 }));
          pic.append(railLayer, pathLayer, ...tokens, ...outs);
          const pos = tokens.map(() => ({ x: 0, y: 0 }));
          let rails = 3;
          const tweens = [];
          const label = el('b', { class: 'demo-num', text: '3' });
          const minus = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'One line fewer', text: '−' });
          const plus = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'One line more', text: '+' });
          host.append(pic, el('div', { class: 'demo-controls' }, el('span', { class: 'demo-tag', text: 'lines' }), minus, label, plus));
          const layout = (animate) => {
            for (const tw of tweens.splice(0)) tw.kill();
            const ys = LINES[rails];
            const rail = zigzag(N, rails);
            railLayer.replaceChildren(...ys.map((y) => l(16, y, 304, y, { s: col.rule, w: 1, d: '2 4' })));
            const spots = rail.map((r, i) => [zx(i), ys[r]]);
            const zigPath = p(`M${spots.map(([x, y]) => `${x} ${y}`).join(' L')}`, { s: '#d8c39a', w: 1.6 });
            pathLayer.replaceChildren(zigPath);
            const order2 = ys.flatMap((_, r) => [...Array(N).keys()].filter((i) => rail[i] === r));
            const ox2 = (n) => 160 + (n - (N - 1) / 2) * 20 + (rail[order2[n]] - (rails - 1) / 2) * 8;
            tokens.forEach((tk, i) => {
              const [x, y] = spots[i];
              tk.lastChild.setAttribute('fill', INK4[rail[i]]);
              if (animate) tweens.push(gsap.to(pos[i], { x, y, duration: 0.5, ease: 'power2.inOut', onUpdate: () => put(tk, pos[i].x, pos[i].y) }));
              else {
                pos[i].x = x;
                pos[i].y = y;
                put(tk, x, y);
              }
            });
            order2.forEach((i, n) => {
              outs[i].setAttribute('fill', INK4[rail[i]]);
              if (animate) tweens.push(gsap.to(outs[i], { attr: { x: ox2(n) }, duration: 0.5, ease: 'power2.inOut' }));
              else outs[i].setAttribute('x', String(ox2(n)));
            });
            if (animate) tweens.push(gsap.fromTo([zigPath, ...railLayer.children], { opacity: 0 }, { opacity: 1, duration: 0.5 }));
            label.textContent = String(rails);
            minus.disabled = rails <= 2;
            plus.disabled = rails >= 4;
          };
          minus.addEventListener('click', () => {
            if (rails <= 2) return;
            rails -= 1;
            k2.audio?.tick?.();
            layout(true);
          });
          plus.addEventListener('click', () => {
            if (rails >= 4) return;
            rails += 1;
            k2.audio?.tick?.();
            layout(true);
          });
          layout(false);
          return () => {
            for (const tw of tweens) tw.kill();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ Vigenère
  vigenere(k) {
    const { svg, T, R, C, G, COL, ABC } = k;
    const KEY = 'LEMONL';
    const MSG = 'ATTACK';
    const x = (i) => 112 + i * 36;
    const YK = 36;
    const YM = 74;
    const YP = 99;
    const YO = 128;
    const word = (y, text, f) => T(14, y, text, { c: 'u', z: 11.5, f, a: 'start' });
    const keyWord = word(YK - 1, 'key', COL.brass);
    const msgWord = word(YM - 1, 'message', COL.faint);
    const outWord = word(YO - 1, 'secret', COL.green);
    const key = Array.from(KEY, (ch, i) => T(x(i), YK, ch, { z: 18, w: 700, f: COL.brass }));
    const msg = Array.from(MSG, (ch, i) => T(x(i), YM, ch, { z: 18, w: 600 }));
    const plus = Array.from(KEY, (ch, i) => T(x(i), YP, `+${ABC.indexOf(ch)}`, { c: 'u', z: 11.5, w: 700, f: COL.brass }));
    const out = Array.from(MSG, (ch, i) => T(x(i), YO, ch, { z: 18, w: 700, f: COL.green }));
    // A ruler of letters and their numbers: A is 0, B is 1 ...
    const sx = (i) => 20 + i * 20;
    const ring = R(sx(11) - 9, 151, 18, 38, { s: COL.brass, w: 2, r: 6 });
    const strip = G(
      {},
      R(10, 146, 300, 46, { f: TILE, s: 'none', r: 8 }),
      Array.from({ length: 15 }, (_, i) => [T(sx(i), 166, ABC[i], { z: 12, w: 700 }), T(sx(i), 184, String(i), { z: 10, w: 600, f: COL.faint })]).flat(),
      ring,
    );
    svg.append(keyWord, msgWord, outWord, ...key, ...msg, ...plus, ...out, strip);
    k.hide(keyWord, outWord, key, plus, out, strip, ring);
    return {
      steps: [
        {
          say: 'Write the key word over the message, again and again.',
          run: (tl) => {
            tl.to(keyWord, { opacity: 1, duration: 0.3 });
            key.forEach((n, i) => tl.fromTo(n, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 0.25 + i * 0.22));
          },
        },
        {
          say: 'Each key letter is a shift: A is 0, B is 1, L is 11.',
          run: (tl) => {
            tl.to(strip, { opacity: 1, duration: 0.35 });
            Array.from(KEY).forEach((ch, i) => {
              const at = 0.45 + i * 0.27;
              tl.to(ring, i ? { attr: { x: sx(ABC.indexOf(ch)) - 9 }, duration: 0.18 } : { opacity: 1, duration: 0.15 }, at)
                .to(key[i], { scale: 1.3, transformOrigin: '50% 50%', duration: 0.1, yoyo: true, repeat: 1 }, at)
                .to(plus[i], { opacity: 1, duration: 0.2 }, at + 0.1);
            });
          },
        },
        {
          say: 'Move each letter on by its number: A + 11 = L.',
          run: (tl) => {
            tl.to(outWord, { opacity: 1, duration: 0.3 }).to(ring, { opacity: 0, duration: 0.3 }, '<');
            Array.from(MSG).forEach((ch, i) => {
              const at = 0.2 + i * 0.33;
              tl.set(out[i], { opacity: 1 }, at);
              spin(tl, out[i], ABC.indexOf(ch), ABC.indexOf(KEY[i]), { dur: 0.3, at });
              tl.to(msg[i], { attr: { fill: COL.brass }, duration: 0.08 }, at).to(msg[i], { attr: { fill: COL.ink }, duration: 0.2 }, at + 0.3);
            });
          },
        },
        {
          say: 'The two T’s come out different: X and F.',
          run: (tl) => {
            const rings = [1, 2].flatMap((i) => [C(x(i), YM - 6, 13, { s: COL.brass, w: 2 }), C(x(i), YO - 6, 13, { s: COL.green, w: 2 })]);
            svg.append(...rings);
            k.hide(rings);
            tl.to(rings, { opacity: 1, duration: 0.3, stagger: 0.18 });
          },
        },
      ],
      tryIt: {
        say: 'Tap a column, then change its key letter.',
        mount(host, k2) {
          const { card, T: t, R: r, COL: col, ABC: abc, el, gsap } = k2;
          const keyNow = Array.from(KEY, (ch) => abc.indexOf(ch));
          let sel = 2;
          const YK2 = 32;
          const YM2 = 70;
          const YP2 = 95;
          const YO2 = 124;
          const { svg: pic } = card(320, 142);
          pic.classList.add('demo-svg');
          const band = r(x(sel) - 17, 12, 34, 122, { f: WASH, s: 'none', r: 6 });
          pic.append(band, t(14, YK2 - 1, 'key', { c: 'u', z: 11.5, f: col.brass, a: 'start' }), t(14, YM2 - 1, 'message', { c: 'u', z: 11.5, f: col.faint, a: 'start' }), t(14, YO2 - 1, 'secret', { c: 'u', z: 11.5, f: col.green, a: 'start' }));
          const keyT = [];
          const plusT = [];
          const outT = [];
          const tweens = [];
          Array.from(MSG).forEach((ch, i) => {
            keyT.push(t(x(i), YK2, '', { z: 18, w: 700, f: col.brass }));
            plusT.push(t(x(i), YP2, '', { c: 'u', z: 11.5, w: 700, f: col.brass }));
            outT.push(t(x(i), YO2, '', { z: 18, w: 700, f: col.green }));
            pic.append(keyT[i], t(x(i), YM2, ch, { z: 18, w: 600 }), plusT[i], outT[i]);
          });
          Array.from(MSG).forEach((_, i) =>
            pic.append(
              tappable(r(x(i) - 18, 10, 36, 128, { f: 'transparent', s: 'none' }), `Column ${i + 1}`, () => {
                sel = i;
                k2.audio?.tick?.();
                draw(false);
              }),
            ),
          );
          const ask = el('div', { class: 'demo-goal' });
          const label = el('b', { class: 'demo-num', text: '' });
          const minus = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'Key letter back one', text: '−' });
          const plusBtn = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'Key letter on one', text: '+' });
          host.append(ask, pic, el('div', { class: 'demo-controls' }, minus, label, plusBtn));
          const draw = (changed) => {
            band.setAttribute('x', String(x(sel) - 17));
            Array.from(MSG).forEach((ch, i) => {
              keyT[i].textContent = abc[keyNow[i]];
              plusT[i].textContent = `+${keyNow[i]}`;
              outT[i].textContent = abc[(abc.indexOf(ch) + keyNow[i]) % 26];
            });
            label.textContent = abc[keyNow[sel]];
            // A pop in size, not a transform: a scale about a measured middle drifts as the letter changes.
            if (changed) tweens.push(gsap.fromTo([keyT[sel], outT[sel]], { attr: { 'font-size': 25 } }, { attr: { 'font-size': 18 }, duration: 0.3, ease: 'power2.out', overwrite: true }));
            const same = outT[1].textContent === outT[2].textContent;
            ask.classList.toggle('ok', same);
            ask.textContent = same ? 'Yes! Same key letter, same shift.' : 'Can you make the two T’s come out the same?';
          };
          minus.addEventListener('click', () => {
            keyNow[sel] = (keyNow[sel] + 25) % 26;
            k2.audio?.tick?.();
            draw(true);
          });
          plusBtn.addEventListener('click', () => {
            keyNow[sel] = (keyNow[sel] + 1) % 26;
            k2.audio?.tick?.();
            draw(true);
          });
          draw(false);
          return () => {
            for (const tw of tweens) tw.kill();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ Playfair
  playfair(k) {
    const { svg, T, R, C, G, COL } = k;
    const WORD = 'PLAYFAIR EXAMPLE';
    const SQ = keySquare(WORD);
    const g = 30;
    const x0 = 14;
    const y0 = 36;
    const cx = (c) => x0 + c * g + g / 2;
    const cy = (r) => y0 + r * g + g / 2;
    const rc = (ch) => {
      const n = SQ.indexOf(ch);
      return [Math.floor(n / 5), n % 5];
    };
    const kx = (j) => cx(2) + (j - (WORD.length - 1) / 2) * 8.6;
    const bands = G({});
    const cells = Array.from(SQ, (_, n) => R(x0 + (n % 5) * g, y0 + Math.floor(n / 5) * g, g, g, { s: COL.rule, r: 0 }));
    const letters = Array.from(SQ, (ch, n) => T(cx(n % 5), cy(Math.floor(n / 5)) + 5.5, ch, { z: 16, w: 700 }));
    const kw = Array.from(WORD, (ch, j) => T(kx(j), 22, ch, { z: 13, w: 700, f: COL.brass }));
    const marks = G({});
    svg.append(bands, ...cells, ...letters, ...kw, marks);
    k.hide(letters);
    const LINE_Y = [78, 122, 166];
    /** One rule: the pair lights up, and a ring slides from each letter to the letter it becomes. */
    const rule = (tl, line, pair, result, { band }) => {
      const old = [...marks.children, ...bands.children];
      if (old.length) tl.to(old, { opacity: 0, duration: 0.25 });
      bands.append(band);
      k.hide(band);
      tl.to(band, { opacity: 1, duration: 0.3 });
      const a = T(214, LINE_Y[line], pair, { z: 19, w: 700, f: COL.brass });
      const arrow = T(246, LINE_Y[line] - 1, '→', { c: 'u', z: 17, f: COL.faint });
      const b = T(280, LINE_Y[line], result, { z: 19, w: 700, f: COL.green });
      svg.append(a, arrow, b);
      k.hide(a, arrow, b);
      const rings = [];
      const fresh = [];
      Array.from(pair).forEach((ch, q) => {
        const [r, c] = rc(ch);
        // A dashed ring stays where the letter was; a solid one moves to the letter it becomes.
        const stay = C(cx(c), cy(r), 12.5, { s: COL.brass, w: 1.4, d: '3 3' });
        const go = C(cx(c), cy(r), 12.5, { s: COL.brass, w: 2.4 });
        marks.append(stay, go);
        k.hide(stay, go);
        fresh.push(stay, go);
        rings.push([go, ...rc(result[q])]);
      });
      tl.to(fresh, { opacity: 1, duration: 0.25 }).to(a, { opacity: 1, duration: 0.25 }, '<');
      rings.forEach(([go, r, c], q) => tl.to(go, { attr: { cx: cx(c), cy: cy(r), stroke: COL.green }, duration: 0.65, ease: 'power2.inOut' }, q ? '<' : '+=0.3'));
      tl.to([arrow, b], { opacity: 1, duration: 0.3 });
    };
    return {
      steps: [
        {
          say: 'Write the key word into the square, skipping repeats.',
          run: (tl) => {
            let n = 0;
            let t = 0.1;
            Array.from(WORD).forEach((ch, j) => {
              if (ch === ' ') return;
              if (SQ.indexOf(ch) < n) {
                // Already in the square: struck out, and left where it is.
                const strike = k.L(kx(j) - 5, 17.5, kx(j) + 5, 17.5, { s: COL.red, w: 1.6 });
                svg.append(strike);
                k.hide(strike);
                tl.to(kw[j], { attr: { fill: COL.red }, duration: 0.1 }, t).to(strike, { opacity: 1, duration: 0.15 }, t + 0.1);
              } else {
                const node = letters[n];
                node.setAttribute('x', String(kx(j)));
                node.setAttribute('y', '22');
                node.setAttribute('fill', COL.brass);
                tl.set(node, { opacity: 1 }, t).to(kw[j], { opacity: 0.3, duration: 0.2 }, t);
                glide(tl, node, [kx(j), 22], [cx(n % 5), cy(Math.floor(n / 5)) + 5.5], { dur: 0.45, at: t });
                tl.to(node, { attr: { fill: COL.ink }, duration: 0.3 }, t + 0.45);
                n += 1;
              }
              t += 0.12;
            });
          },
        },
        {
          say: 'Fill in the rest of the alphabet, I and J in one cell.',
          run: (tl) => {
            tl.to(letters.slice(10), { opacity: 1, duration: 0.2, stagger: 0.05 });
            const n = SQ.indexOf('I');
            const ij = letters[n];
            tl.to(ij, { opacity: 0, duration: 0.15 })
              .call(() => {
                ij.textContent = 'I/J';
                ij.setAttribute('font-size', '11');
                ij.setAttribute('y', String(cy(Math.floor(n / 5)) + 4));
              })
              .to(ij, { opacity: 1, duration: 0.25 })
              .to(ij, { attr: { fill: COL.brass }, duration: 0.2 }, '<')
              .to(ij, { attr: { fill: COL.ink }, duration: 0.3 }, '+=0.35');
          },
        },
        {
          say: 'If both are in one row, take the letter to the right.',
          run: (tl) => rule(tl, 0, 'PY', 'LF', { band: R(x0, y0, 5 * g, g, { f: WASH, s: 'none', r: 0 }) }),
        },
        {
          say: 'If both are in one column, take the letter below.',
          run: (tl) => rule(tl, 1, 'LN', 'RU', { band: R(x0 + g, y0, g, 5 * g, { f: WASH, s: 'none', r: 0 }) }),
        },
        {
          say: 'Otherwise, take the other two corners: HI becomes BM.',
          run: (tl) => rule(tl, 2, 'HI', 'BM', { band: R(x0, y0 + g, 5 * g, 2 * g, { f: WASH, s: COL.brass, w: 1.4, d: '4 3', r: 0 }) }),
        },
      ],
      tryIt: {
        say: 'Tap two letters to see what they become.',
        mount(host, k2) {
          const { card, T: t, R: r, C: c, G: gg, COL: col, el, gsap } = k2;
          const G0 = 30;
          const X0 = 14;
          const Y0 = 16;
          const cx2 = (q) => X0 + q * G0 + G0 / 2;
          const cy2 = (q) => Y0 + q * G0 + G0 / 2;
          const { svg: pic } = card(320, 182);
          pic.classList.add('demo-svg');
          const note = el('div', { class: 'demo-goal' });
          host.append(pic, note);
          const back = gg({});
          const rings = gg({ 'pointer-events': 'none' });
          pic.append(back);
          Array.from(SQ).forEach((ch, n) => pic.append(r(X0 + (n % 5) * G0, Y0 + Math.floor(n / 5) * G0, G0, G0, { s: col.rule, r: 0 }), t(cx2(n % 5), cy2(Math.floor(n / 5)) + (ch === 'I' ? 4 : 5.5), ch === 'I' ? 'I/J' : ch, { z: ch === 'I' ? 11 : 16, w: 700 })));
          pic.append(rings);
          Array.from(SQ).forEach((ch, n) => pic.append(tappable(r(X0 + (n % 5) * G0, Y0 + Math.floor(n / 5) * G0, G0, G0, { f: 'transparent', s: 'none', r: 0 }), `The letter ${ch}`, () => choose(n))));
          const pairT = t(246, 74, '', { z: 22, w: 700, f: col.brass });
          const down = t(246, 104, '', { c: 'u', z: 18, f: col.faint });
          const resT = t(246, 138, '', { z: 22, w: 700, f: col.green });
          pic.append(pairT, down, resT);
          const tweens = [];
          let picked = [];
          const ring = (n, colour, dashed) => c(cx2(n % 5), cy2(Math.floor(n / 5)), 12.5, { s: colour, w: dashed ? 1.4 : 2.4, d: dashed ? '3 3' : null });
          const clear = () => {
            for (const tw of tweens.splice(0)) tw.kill();
            rings.replaceChildren();
            back.replaceChildren();
            pairT.textContent = '';
            down.textContent = '';
            resT.textContent = '';
          };
          /** Slide a ring to its new letter; off one edge and back in at the other when it wraps round. */
          const slide = (node, to, wrap, across) => {
            const X = cx2(to % 5);
            const Y = cy2(Math.floor(to / 5));
            const tl = gsap.timeline({ delay: 0.3 });
            if (!wrap) tl.to(node, { attr: { cx: X, cy: Y, stroke: col.green }, duration: 0.55, ease: 'power2.inOut' });
            else if (across) tl.to(node, { attr: { cx: `+=${G0 * 0.7}` }, opacity: 0, duration: 0.25 }).set(node, { attr: { cx: X - G0 * 0.7, stroke: col.green } }).to(node, { attr: { cx: X }, opacity: 1, duration: 0.3 });
            else tl.to(node, { attr: { cy: `+=${G0 * 0.7}` }, opacity: 0, duration: 0.25 }).set(node, { attr: { cy: Y - G0 * 0.7, stroke: col.green } }).to(node, { attr: { cy: Y }, opacity: 1, duration: 0.3 });
            tweens.push(tl);
          };
          const choose = (n) => {
            k2.audio?.tick?.();
            if (picked.length === 2) {
              clear();
              picked = [];
            }
            if (picked[0] === n) {
              clear();
              picked = [];
              note.textContent = 'Tap two letters.';
              return;
            }
            picked.push(n);
            rings.append(ring(n, col.brass, false));
            if (picked.length === 1) {
              pairT.textContent = SQ[n];
              note.textContent = 'Now tap a second letter.';
              return;
            }
            const [a, b] = picked;
            const [ra, ca, rb, cb] = [Math.floor(a / 5), a % 5, Math.floor(b / 5), b % 5];
            let ta;
            let tb;
            let wrap = [false, false];
            let across = true;
            if (ra === rb) {
              ta = ra * 5 + ((ca + 1) % 5);
              tb = rb * 5 + ((cb + 1) % 5);
              wrap = [ca === 4, cb === 4];
              back.append(r(X0, Y0 + ra * G0, 5 * G0, G0, { f: WASH, s: 'none', r: 0 }));
              note.textContent = wrap.includes(true) ? 'One row: one to the right, round to the start.' : 'One row: take the letter to the right of each.';
            } else if (ca === cb) {
              ta = ((ra + 1) % 5) * 5 + ca;
              tb = ((rb + 1) % 5) * 5 + cb;
              wrap = [ra === 4, rb === 4];
              across = false;
              back.append(r(X0 + ca * G0, Y0, G0, 5 * G0, { f: WASH, s: 'none', r: 0 }));
              note.textContent = wrap.includes(true) ? 'One column: one below, round to the top.' : 'One column: take the letter below each.';
            } else {
              ta = ra * 5 + cb;
              tb = rb * 5 + ca;
              back.append(r(X0 + Math.min(ca, cb) * G0, Y0 + Math.min(ra, rb) * G0, (Math.abs(ca - cb) + 1) * G0, (Math.abs(ra - rb) + 1) * G0, { f: WASH, s: col.brass, w: 1.4, d: '4 3', r: 0 }));
              note.textContent = 'A rectangle: take the other two corners.';
            }
            const goA = ring(a, col.brass, false);
            const goB = ring(b, col.brass, false);
            rings.replaceChildren(ring(a, col.brass, true), ring(b, col.brass, true), goA, goB);
            slide(goA, ta, wrap[0], across);
            slide(goB, tb, wrap[1], across);
            pairT.textContent = SQ[a] + SQ[b];
            down.textContent = '↓';
            resT.textContent = SQ[ta] + SQ[tb];
            gsap.set([down, resT], { opacity: 0 });
            tweens.push(gsap.to([down, resT], { opacity: 1, duration: 0.3, delay: 0.75 }));
          };
          note.textContent = 'Tap two letters.';
          return () => {
            for (const tw of tweens) tw.kill();
            host.replaceChildren();
          };
        },
      },
    };
  },

  // ------------------------------------------------------------------ Bacon's two-letter cipher
  bacon(k) {
    const { svg, T, R, G, COL, ABC } = k;
    const table = Array.from({ length: 12 }, (_, i) => {
      const [x, y] = baconSpot(i);
      return G({}, T(x, y, ABC[i], { z: 13, w: 700, a: 'start' }), T(x + 18, y, bacon5(i), { z: 13, a: 'start' }));
    });
    const more = T(296, 80, '…', { z: 13, f: COL.faint });
    const glow = G({});
    const WORD = 'found';
    const wx = (i) => 100 + i * 25;
    const word = Array.from(WORD, (ch, i) => T(wx(i), 134, ch, { c: 'd', z: 28 }));
    const marks = Array.from(WORD, (ch, i) => T(wx(i), 162, ch === 'u' ? 'b' : 'a', { z: 15, w: 700, f: ch === 'u' ? COL.brass : COL.faint }));
    const eq = T(234, 140, '=', { z: 20, f: COL.faint });
    const res = T(266, 146, 'E', { z: 34, w: 800, f: COL.green });
    svg.append(glow, ...table, more, ...word, ...marks, eq, res);
    k.hide(table, more, word, marks, eq, res);
    return {
      steps: [
        {
          say: 'Every letter has a code of five marks, each a or b.',
          run: (tl) => tl.to(table, { opacity: 1, duration: 0.25, stagger: 0.11 }).to(more, { opacity: 1, duration: 0.25 }),
        },
        {
          say: 'In any word, plain letters mean a and bold ones mean b.',
          run: (tl) => {
            const u = word[2];
            tl.to(word, { opacity: 1, duration: 0.3, stagger: 0.06 })
              .to(u, { attr: { fill: COL.brass }, duration: 0.3 }, '+=0.2')
              .set(u, { attr: { 'font-weight': 800 } }, '<')
              .fromTo(u, { scale: 1 }, { scale: 1.25, transformOrigin: '50% 80%', duration: 0.15, yoyo: true, repeat: 1 }, '<')
              .to(marks, { opacity: 1, duration: 0.25, stagger: 0.12 }, '+=0.15');
          },
        },
        {
          say: 'Look the five marks up: aabaa is E.',
          run: (tl) => {
            const [ex, ey] = baconSpot(4);
            const band = R(ex - 6, ey - 15, 74, 20, { f: GREEN_WASH, s: 'none', r: 4 });
            glow.append(band);
            k.hide(band);
            const code = bacon5(4);
            marks.forEach((_, i) => {
              const copy = T(wx(i), 162, code[i], { z: 15, w: 700, f: code[i] === 'b' ? COL.brass : COL.faint });
              svg.append(copy);
              const at = 0.1 + i * 0.08;
              glide(tl, copy, [wx(i), 162], [ex + 21.9 + i * 7.8, ey], { dur: 0.7, at, bend: 30 });
              tl.to(copy, { attr: { 'font-size': 13 }, duration: 0.7 }, at).to(copy, { opacity: 0, duration: 0.3 }, 1.2);
            });
            tl.to(band, { opacity: 1, duration: 0.3 }, 0.95).to([eq, res], { opacity: 1, duration: 0.35 }, 1.25);
          },
        },
        {
          say: 'Capitals work too: small means a, capital means b.',
          run: (tl) => {
            const u = word[2];
            const big = T(wx(2), 134, 'U', { c: 'd', z: 28, f: COL.brass });
            svg.append(big);
            k.hide(big);
            tl.to(u, { opacity: 0, y: -10, duration: 0.3 })
              .fromTo(big, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35 }, '-=0.1')
              .to(marks[2], { scale: 1.35, transformOrigin: '50% 50%', duration: 0.15, yoyo: true, repeat: 1 }, '+=0.1')
              .to(res, { scale: 1.2, transformOrigin: '50% 50%', duration: 0.15, yoyo: true, repeat: 1 }, '+=0.05');
          },
        },
      ],
      tryIt: {
        say: 'Tap letters to make them bold and watch the hidden letter.',
        mount(host, k2) {
          const { card, T: t, R: r, G: gg, COL: col, ABC: abc, el } = k2;
          const TEXT = 'tiger';
          const GOALS = ['C', 'H', 'K'];
          const bold = Array.from(TEXT, () => false);
          const { svg: pic } = card(320, 186);
          pic.classList.add('demo-svg');
          const ask = el('div', { class: 'demo-goal' });
          host.append(ask, pic);
          const band = r(0, 0, 74, 20, { f: GREEN_WASH, s: 'none', r: 4 });
          pic.append(band);
          for (let i = 0; i < 12; i++) {
            const [x, y] = baconSpot(i);
            pic.append(t(x, y, abc[i], { z: 13, w: 700, a: 'start' }), t(x + 18, y, bacon5(i), { z: 13, a: 'start' }));
          }
          pic.append(t(296, 80, '…', { z: 13, f: col.faint }));
          const wx2 = (i) => 92 + i * 34;
          const letters = Array.from(TEXT, (ch, i) => t(wx2(i), 136, ch, { c: 'd', z: 30 }));
          const marks2 = Array.from(TEXT, (_, i) => t(wx2(i), 164, 'a', { z: 15, w: 700, f: col.faint }));
          const eq2 = t(262, 142, '=', { z: 20, f: col.faint });
          const res2 = t(292, 147, '', { z: 32, w: 800, f: col.green });
          pic.append(gg({ 'pointer-events': 'none' }, ...letters, ...marks2), eq2, res2);
          let goal = 0;
          let timer = 0;
          const draw = () => {
            const code = bold.map((b) => (b ? 'b' : 'a')).join('');
            const n = parseInt(bold.map((b) => (b ? 1 : 0)).join(''), 2);
            letters.forEach((node, i) => {
              node.setAttribute('font-weight', bold[i] ? '800' : '400');
              node.setAttribute('fill', bold[i] ? col.brass : col.ink);
            });
            marks2.forEach((m, i) => {
              m.textContent = bold[i] ? 'b' : 'a';
              m.setAttribute('fill', bold[i] ? col.brass : col.faint);
            });
            res2.textContent = n < 26 ? abc[n] : '?';
            res2.setAttribute('fill', n < 26 ? col.green : col.faint);
            if (n < 12) {
              const [x, y] = baconSpot(n);
              band.setAttribute('x', String(x - 6));
              band.setAttribute('y', String(y - 15));
              band.setAttribute('opacity', '1');
            } else band.setAttribute('opacity', '0');
            if (goal < GOALS.length && n < 26 && abc[n] === GOALS[goal]) {
              ask.textContent = `Yes: ${code} is ${GOALS[goal]}.`;
              ask.classList.add('ok');
              goal += 1;
              clearTimeout(timer);
              timer = setTimeout(() => {
                ask.classList.remove('ok');
                ask.textContent = goal < GOALS.length ? `Now hide ${GOALS[goal]}.` : 'You can hide letters now.';
              }, 1100);
            } else if (!ask.classList.contains('ok')) ask.textContent = goal < GOALS.length ? `Hide the letter ${GOALS[goal]}.` : n < 26 ? `${code} is ${abc[n]}.` : `${code} is past Z: no letter.`;
          };
          letters.forEach((_, i) =>
            pic.append(
              tappable(r(wx2(i) - 16, 100, 32, 74, { f: 'transparent', s: 'none' }), `Letter ${i + 1}`, () => {
                bold[i] = !bold[i];
                k2.audio?.tick?.();
                draw();
              }),
            ),
          );
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
