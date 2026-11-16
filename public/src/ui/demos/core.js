// How-tos: the Caesar shift and counting in holes. These two are the worked examples for
// the contract in demo-player.js.

/** @typedef {any} Kit */

/** A unique id for a clip path or a gradient. */
const uid = () => `d${Math.random().toString(36).slice(2, 9)}`;

export const CORE = {
  // ------------------------------------------------------------------ the Caesar shift
  caesar(k) {
    const { svg, s, T, L, R, G, COL, ABC } = k;
    const step = 29;
    const x = (i) => 30 + i * step;
    const clip = uid();
    svg.append(s('defs', {}, s('clipPath', { id: clip }, s('rect', { x: 12, y: 30, width: 296, height: 120 }))));
    const top = G({}, Array.from({ length: 26 }, (_, i) => T(x(i), 62, ABC[i], { z: 17, w: 700 })));
    const bottom = G({}, Array.from({ length: 29 }, (_, i) => T(x(i), 130, ABC[i % 26], { z: 17, w: 700, f: COL.green })));
    const arrows = G({}, Array.from({ length: 26 }, (_, i) => L(x(i), 72, x(i), 110, { s: COL.faint, w: 1.1, m: k.arrow('faint') })));
    const marks = G({});
    const cam = G({}, marks, arrows, top, bottom);
    svg.append(G({ 'clip-path': `url(#${clip})` }, cam));
    const secret = T(70, 182, 'EHDG', { z: 18, w: 700, f: COL.green });
    const to = T(130, 182, '→', { c: 'u', z: 16, f: COL.faint });
    const plain = Array.from('BEAD', (ch, i) => T(176 + i * 22, 182, ch, { z: 18, w: 700, f: COL.brass }));
    svg.append(secret, to, ...plain);
    k.hide(top.children, bottom, arrows, secret, to, plain);
    // A box around column i, top and bottom.
    const box = (i) => R(x(i) - 12, 40, 24, 100, { s: COL.brass, w: 2, r: 6 });
    return {
      steps: [
        { say: 'Here is the alphabet.', run: (tl) => tl.to(top.children, { opacity: 1, duration: 0.25, stagger: 0.04 }) },
        {
          say: 'Shift three: slide a copy along by three.',
          run: (tl) => tl.to(bottom, { opacity: 1, duration: 0.4 }).to(bottom, { x: -3 * step, duration: 1.3, ease: 'power2.inOut' }),
        },
        {
          say: 'Read straight down: A becomes D.',
          run: (tl) => {
            const a = box(0);
            const b = box(1);
            marks.append(a, b);
            k.hide(a, b);
            tl.to(arrows, { opacity: 1, duration: 0.4 }).to(a, { opacity: 1, duration: 0.3 }).to(b, { opacity: 1, duration: 0.3 }, '+=0.5');
          },
        },
        {
          say: 'To read a secret, go back up: EHDG is BEAD.',
          run: (tl) => {
            tl.to(marks.children, { opacity: 0, duration: 0.2 }).to([secret, to], { opacity: 1, duration: 0.3 });
            // E, H, D and G sit under B, E, A and D.
            [1, 4, 0, 3].forEach((col, i) => {
              const b = box(col);
              marks.append(b);
              k.hide(b);
              tl.to(b, { opacity: 1, duration: 0.2 }).to(plain[i], { opacity: 1, duration: 0.25 }).to(b, { opacity: 0, duration: 0.2 }, '+=0.35');
            });
          },
        },
        {
          say: 'After Z, start again at A.',
          run: (tl) => {
            const boxes = [23, 24, 25].map(box);
            marks.append(...boxes);
            k.hide(boxes);
            tl.to([secret, to, ...plain], { opacity: 0.25, duration: 0.3 }).to(cam, { x: -16 * step, duration: 1.4, ease: 'power2.inOut' }).to(boxes, { opacity: 1, duration: 0.25, stagger: 0.3 });
          },
        },
      ],
      tryIt: {
        say: 'Your turn: turn the shift until the word makes sense.',
        mount(host, k2) {
          const { card, T: t, R: r, COL: c, ABC: abc, el } = k2;
          const word = 'KHOOR';
          const { svg: pic } = card(320, 150);
          pic.classList.add('demo-svg');
          const cells = Array.from(word, (ch, i) => {
            const cx = 64 + i * 48;
            pic.append(r(cx - 20, 18, 40, 40, { f: '#efe3c6', s: '#b49863', r: 6 }), t(cx, 47, ch, { z: 22, w: 700, f: c.green }));
            const out = t(cx, 125, ch, { z: 22, w: 800 });
            const frame = r(cx - 20, 96, 40, 40, { f: 'none', s: c.rule, r: 6, w: 1.5 });
            pic.append(frame, out);
            return { ch, out, frame };
          });
          pic.append(t(160, 80, 'shift back', { c: 'u', z: 11, f: c.faint }));
          const label = el('b', { class: 'demo-num', text: '0' });
          const minus = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'One less', text: '−' });
          const plus = el('button', { class: 'demo-ibtn big', type: 'button', 'aria-label': 'One more', text: '+' });
          const note = el('div', { class: 'demo-note', text: '' });
          let shift = 0;
          const draw = () => {
            label.textContent = String(shift);
            const plainNow = cells.map(({ ch }) => abc[(abc.indexOf(ch) - shift + 26) % 26]).join('');
            cells.forEach(({ out, frame }, i) => {
              out.textContent = plainNow[i];
              frame.setAttribute('stroke', plainNow === 'HELLO' ? c.green : c.rule);
              out.setAttribute('fill', plainNow === 'HELLO' ? c.green : c.ink);
            });
            note.textContent = plainNow === 'HELLO' ? 'That is it: three back.' : '';
          };
          minus.addEventListener('click', () => {
            shift = (shift + 25) % 26;
            k2.audio?.tick?.();
            draw();
          });
          plus.addEventListener('click', () => {
            shift = (shift + 1) % 26;
            k2.audio?.tick?.();
            draw();
          });
          host.append(pic, el('div', { class: 'demo-controls' }, minus, label, plus), note);
          draw();
          return () => host.replaceChildren();
        },
      },
    };
  },

  // ------------------------------------------------------------------ counting in holes
  binary(k) {
    const { svg, T, R, C, G, COL } = k;
    const values = [16, 8, 4, 2, 1];
    const x = (i) => 48 + i * 56;
    const label = values.map((v, i) => T(x(i), 40, String(v), { z: 14, w: 700, f: COL.brass }));
    const twice = [0, 1, 2, 3].map((i) => T((x(i) + x(i + 1)) / 2, 40, '×2', { c: 'u', z: 9.5, f: COL.faint }));
    const plates = values.map((_, i) => R(x(i) - 20, 54, 40, 46, { f: '#e2d3ae', s: '#b49863', r: 6 }));
    const holes = values.map((_, i) => C(x(i), 77, 11, { f: 'none', s: '#b49863', w: 1 }));
    const bits = values.map((_, i) => T(x(i), 124, '0', { z: 14, w: 700, f: COL.faint }));
    const sum = T(160, 170, '16 + 4 = 20', { z: 20, w: 700, f: COL.green });
    svg.append(G({}, plates), G({}, holes), ...label, ...twice, ...bits, sum);
    k.hide(label, twice, bits, sum);
    const punched = [0, 2];
    return {
      steps: [
        {
          say: 'Each place is worth twice the one to its right.',
          run: (tl) => {
            for (let i = 4; i >= 0; i--) {
              tl.to(label[i], { opacity: 1, duration: 0.25 });
              if (i > 0) tl.to(twice[i - 1], { opacity: 1, duration: 0.2 });
            }
          },
        },
        {
          say: 'A punched hole counts. A blank does not.',
          run: (tl) => {
            tl.to(bits, { opacity: 1, duration: 0.3 });
            for (const i of punched) {
              tl.to(holes[i], { attr: { fill: COL.ink, stroke: COL.ink }, scale: 1.15, transformOrigin: '50% 50%', duration: 0.18 }).to(holes[i], { scale: 1, duration: 0.2 });
              tl.call(() => {
                bits[i].textContent = '1';
                bits[i].setAttribute('fill', COL.brass);
              });
            }
          },
        },
        {
          say: 'Add up the holes: 16 + 4 = 20.',
          run: (tl) => tl.fromTo(sum, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(2)' }),
        },
        {
          say: 'On a 24-hour clock, 20 is eight in the evening.',
          run: (tl) => {
            tl.to(sum, { opacity: 0, duration: 0.2 }).call(() => {
              sum.textContent = '20:00 is 8 pm';
            }).to(sum, { opacity: 1, duration: 0.4 });
          },
        },
      ],
      tryIt: {
        say: 'Tap the holes to make the number asked for.',
        mount(host, k2) {
          const { card, T: t, R: r, C: c, COL: col, el } = k2;
          const { svg: pic } = card(320, 150);
          pic.classList.add('demo-svg');
          const on = [false, false, false, false, false];
          const goals = [5, 13, 22, 9];
          let g = 0;
          const ask = el('div', { class: 'demo-goal' });
          const total = t(160, 138, '0', { z: 18, w: 700, f: col.green });
          const holesT = values.map((v, i) => {
            const hx = x(i);
            pic.append(t(hx, 22, String(v), { z: 13, w: 700, f: col.brass }), r(hx - 20, 34, 40, 46, { f: '#e2d3ae', s: '#b49863', r: 6 }));
            const hole = c(hx, 57, 12, { f: '#f3ecdb', s: '#b49863', w: 1.4 });
            const hit = r(hx - 24, 30, 48, 80, { f: 'transparent', s: 'none' });
            hit.style.cursor = 'pointer';
            hit.setAttribute('role', 'button');
            hit.setAttribute('aria-label', `The hole worth ${v}`);
            const bit = t(hx, 102, '0', { z: 13, w: 700, f: col.faint });
            pic.append(hole, bit, hit);
            hit.addEventListener('click', () => {
              on[i] = !on[i];
              k2.audio?.tick?.();
              draw();
            });
            return { hole, bit };
          });
          pic.append(total);
          const draw = () => {
            const n = values.reduce((a, v, i) => a + (on[i] ? v : 0), 0);
            holesT.forEach(({ hole, bit }, i) => {
              hole.setAttribute('fill', on[i] ? col.ink : '#f3ecdb');
              bit.textContent = on[i] ? '1' : '0';
              bit.setAttribute('fill', on[i] ? col.brass : col.faint);
            });
            total.textContent = String(n);
            if (g < goals.length && n === goals[g]) {
              ask.textContent = `Yes: ${n}!`;
              ask.classList.add('ok');
              g++;
              setTimeout(() => {
                ask.classList.remove('ok');
                ask.textContent = g < goals.length ? `Now make ${goals[g]}.` : 'You can read holes now.';
              }, 900);
            } else if (!ask.classList.contains('ok')) ask.textContent = g < goals.length ? `Make ${goals[g]}.` : 'You can read holes now.';
          };
          host.append(ask, pic);
          draw();
          return () => host.replaceChildren();
        },
      },
    };
  },

};
