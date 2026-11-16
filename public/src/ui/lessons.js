// Pictures for the Lectern's lesson cards. Each method is drawn once, plainly, in ink on a
// paper card: the idea at a glance, with an example that is never the answer to a puzzle
// in the game. drawLesson(name) returns { svg, caption }, or null for a name it does not know.

import { COL, ABC, s, T, L, R, C, P, chessman, card } from './ink.js';

const { ink: INK, faint: FAINT, rule: RULE, brass: BRASS, green: GREEN, red: RED, blue: BLUE } = COL;

const PICS = {
  caesar() {
    const { svg, arrow } = card(320, 128);
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', '…', 'X', 'Y', 'Z'];
    cols.forEach((ch, i) => {
      const x = 28 + i * 24.5;
      svg.append(T(x, 34, ch, { z: 15, w: 600 }));
      if (ch === '…') return svg.append(T(x, 100, '…', { z: 15, f: GREEN }));
      const to = ABC[(ABC.indexOf(ch) + 3) % 26];
      svg.append(L(x, 42, x, 78, { s: FAINT, w: 1.1, m: arrow('faint') }), T(x, 100, to, { z: 15, w: 700, f: GREEN }));
    });
    svg.append(T(160, 122, 'every letter moves three places on; after Z comes A again', { c: 'u', z: 10.5, f: FAINT }));
    return { svg, caption: 'A shift of three. To read a message, move each letter three places back.' };
  },

  rot13() {
    const { svg, arrow } = card(320, 112);
    for (let i = 0; i < 13; i++) {
      const x = 26 + i * 22.4;
      svg.append(T(x, 30, ABC[i], { z: 14, w: 600 }), L(x, 38, x, 66, { s: FAINT, w: 1.1, m: arrow('faint'), ms: arrow('faint') }), T(x, 84, ABC[i + 13], { z: 14, w: 700, f: GREEN }));
    }
    svg.append(T(160, 106, 'each letter swaps with the one thirteen places away', { c: 'u', z: 10.5, f: FAINT }));
    return { svg, caption: 'A and N swap, B and O swap, and so on. The same swap hides a message and brings it back.' };
  },

  frequency() {
    const { svg } = card(320, 150);
    const f = [['E', 12.7], ['T', 9.1], ['A', 8.2], ['O', 7.5], ['I', 7.0], ['N', 6.7], ['S', 6.3], ['H', 6.1], ['R', 6.0], ['D', 4.3], ['L', 4.0], ['U', 2.8]];
    svg.append(L(18, 118, 304, 118, { s: RULE }));
    f.forEach(([ch, pc], i) => {
      const x = 30 + i * 24;
      const h = pc * 7;
      svg.append(R(x - 8, 118 - h, 16, h, { f: i === 0 ? BRASS : '#cdb98d', s: 'none', r: 2 }), T(x, 136, ch, { z: 13, w: i === 0 ? 700 : 500, f: i === 0 ? BRASS : INK }));
    });
    svg.append(T(30, 118 - 12.7 * 7 - 6, '13%', { c: 'u', z: 10, f: BRASS, w: 700 }), T(300, 24, 'how often each letter', { c: 'u', z: 10.5, f: FAINT, a: 'end' }), T(300, 37, 'appears in English', { c: 'u', z: 10.5, f: FAINT, a: 'end' }));
    return { svg, caption: 'E is the most common letter in English. In a simple cipher, the most common sign is probably E.' };
  },

  pigpen() {
    const { svg } = card(320, 156);
    const grid = (x0, y0, letters, dots) => {
      const g = 22;
      svg.append(L(x0 + g, y0, x0 + g, y0 + 3 * g), L(x0 + 2 * g, y0, x0 + 2 * g, y0 + 3 * g), L(x0, y0 + g, x0 + 3 * g, y0 + g), L(x0, y0 + 2 * g, x0 + 3 * g, y0 + 2 * g));
      letters.split('').forEach((ch, i) => {
        const cx = x0 + (i % 3) * g + g / 2;
        const cy = y0 + Math.floor(i / 3) * g + g / 2;
        svg.append(T(dots ? cx - 4 : cx, cy + 4.5, ch, { z: 12, w: 600 }));
        if (dots) svg.append(C(cx + 5, cy, 1.8, { f: INK, s: 'none' }));
      });
    };
    const cross = (cx, cy, letters, dots) => {
      const r = 30;
      svg.append(L(cx - r, cy - r, cx + r, cy + r), L(cx + r, cy - r, cx - r, cy + r));
      [[0, -17], [-17, 0], [17, 0], [0, 17]].forEach(([dx, dy], i) => {
        svg.append(T(cx + dx - (dots ? 4 : 0), cy + dy + 4.5, letters[i], { z: 12, w: 600 }));
        if (dots) svg.append(C(cx + dx + 5, cy + dy, 1.8, { f: INK, s: 'none' }));
      });
    };
    grid(8, 12, 'ABCDEFGHI', false);
    grid(84, 12, 'JKLMNOPQR', true);
    cross(194, 45, 'STUV', false);
    cross(276, 45, 'WXYZ', true);
    // Three letters, written.
    const y = 104;
    svg.append(T(26, y + 22, 'A =', { c: 'u', z: 12, a: 'start' }), P(`M52 ${y + 6} H66 V${y + 26} H52`, { w: 2, s: BRASS }));
    svg.append(T(104, y + 22, 'E =', { c: 'u', z: 12, a: 'start' }), R(130, y + 6, 18, 20, { s: BRASS, w: 2, r: 0 }));
    svg.append(T(184, y + 22, 'S =', { c: 'u', z: 12, a: 'start' }), P(`M208 ${y + 6} L218 ${y + 26} L228 ${y + 6}`, { w: 2, s: BRASS }));
    svg.append(T(258, y + 22, 'J =', { c: 'u', z: 12, a: 'start' }), P(`M282 ${y + 6} H296 V${y + 26} H282`, { w: 2, s: BRASS }), C(290, y + 16, 2, { f: BRASS, s: 'none' }));
    svg.append(T(160, 150, 'each letter is drawn as the lines around its own space', { c: 'u', z: 10.5, f: FAINT }));
    return { svg, caption: 'The key: two grids and two crosses, the second of each with dots.' };
  },

  polybius() {
    const { svg } = card(320, 180);
    const g = 26;
    const x0 = 96;
    const y0 = 38;
    const rows = ['ABCDE', 'FGHIK', 'LMNOP', 'QRSTU', 'VWXYZ'];
    for (let i = 0; i < 5; i++) {
      svg.append(T(x0 + i * g + g / 2, y0 - 9, String(i + 1), { z: 11, f: i === 2 ? BRASS : FAINT, w: i === 2 ? 700 : 400 }), T(x0 - 12, y0 + i * g + g / 2 + 4, String(i + 1), { z: 11, f: i === 1 ? BRASS : FAINT, w: i === 1 ? 700 : 400 }));
      rows[i].split('').forEach((ch, j) => {
        const hit = i === 1 && j === 2;
        svg.append(R(x0 + j * g, y0 + i * g, g, g, { s: RULE, r: 0, f: hit ? 'rgba(168,105,28,0.16)' : 'none' }), T(x0 + j * g + g / 2, y0 + i * g + g / 2 + 4.5, ch === 'I' ? 'I/J' : ch, { z: ch === 'I' ? 9.5 : 13, w: hit ? 700 : 500, f: hit ? BRASS : INK }));
      });
    }
    svg.append(T(276, 94, 'H = 2 3', { z: 16, w: 700, f: BRASS }), T(276, 112, 'row, then column', { c: 'u', z: 10.5, f: FAINT }), T(40, 94, 'row', { c: 'u', z: 10.5, f: FAINT }), T(x0 + 2.5 * g, 13, 'column', { c: 'u', z: 10.5, f: FAINT }));
    return { svg, caption: 'Each letter becomes two numbers: the row, then the column. I and J share a cell.' };
  },

  railfence() {
    const { svg } = card(320, 128);
    const text = 'COMEATONCE';
    const rail = [0, 1, 2, 1, 0, 1, 2, 1, 0, 1];
    const ys = [28, 56, 84];
    const pts = text.split('').map((_, i) => [32 + i * 28, ys[rail[i]]]);
    ys.forEach((y) => svg.append(L(16, y, 304, y, { s: RULE, w: 1, d: '2 4' })));
    svg.append(P(`M${pts.map(([x, y]) => `${x} ${y}`).join(' L')}`, { s: '#d8c39a', w: 1.6 }));
    text.split('').forEach((ch, i) => svg.append(C(pts[i][0], pts[i][1], 9.5, { f: '#f3ecdb', s: 'none' }), T(pts[i][0], pts[i][1] + 4.5, ch, { z: 13, w: 700, f: [BRASS, INK, GREEN][rail[i]] })));
    svg.append(T(16, 114, 'read each line in turn:', { c: 'u', z: 10.5, f: FAINT, a: 'start' }), T(164, 114, 'CAC', { z: 13, w: 700, f: BRASS, a: 'start' }), T(198, 114, 'OETNE', { z: 13, w: 700, a: 'start' }), T(250, 114, 'MO', { z: 13, w: 700, f: GREEN, a: 'start' }));
    return { svg, caption: 'COME AT ONCE written in a zigzag over three lines, then read off line by line.' };
  },

  vigenere() {
    const { svg } = card(320, 134);
    const key = 'LEMONL';
    const msg = 'ATTACK';
    const out = 'LXFOPV';
    svg.append(T(14, 32, 'key', { c: 'u', z: 11, f: FAINT, a: 'start' }), T(14, 70, 'message', { c: 'u', z: 11, f: FAINT, a: 'start' }), T(14, 118, 'secret', { c: 'u', z: 11, f: FAINT, a: 'start' }));
    for (let i = 0; i < 6; i++) {
      const x = 118 + i * 34;
      const shift = ABC.indexOf(key[i]);
      svg.append(T(x, 32, key[i], { z: 15, w: 700, f: BRASS }), T(x, 70, msg[i], { z: 15, w: 600 }), T(x, 93, `+${shift}`, { c: 'u', z: 10, f: BRASS, w: 600 }), T(x, 118, out[i], { z: 15, w: 700, f: GREEN }));
    }
    return { svg, caption: 'Each key letter is its own shift: A is 0, B is 1, and L is 11. So the first A becomes L.' };
  },

  playfair() {
    const { svg } = card(320, 172);
    const sq = ['PLAYF', 'IREXM', 'BCDGH', 'KNOQS', 'TUVWZ'];
    const g = 28;
    const x0 = 20;
    const y0 = 16;
    const at = (r, c) => [x0 + c * g + g / 2, y0 + r * g + g / 2];
    sq.forEach((row, r) => row.split('').forEach((ch, c) => svg.append(R(x0 + c * g, y0 + r * g, g, g, { s: RULE, r: 0 }), T(at(r, c)[0], at(r, c)[1] + 4.5, ch === 'I' ? 'I/J' : ch, { z: ch === 'I' ? 9.5 : 13 }))));
    // H (row 3, column 5) and I (row 2, column 1) mark a rectangle: take its other two corners, B and M.
    const [hx, hy] = at(2, 4);
    const [ix, iy] = at(1, 0);
    svg.append(R(ix, iy, hx - ix, hy - iy, { s: BRASS, w: 1.6, d: '4 3', r: 0 }));
    for (const [[x, y], col] of [[at(2, 4), BRASS], [at(1, 0), BRASS], [at(2, 0), GREEN], [at(1, 4), GREEN]]) svg.append(C(x, y, 12, { s: col, w: 2 }));
    svg.append(T(244, 74, 'HI', { z: 20, w: 700, f: BRASS }), T(244, 98, '↓', { c: 'u', z: 16, f: FAINT }), T(244, 124, 'BM', { z: 20, w: 700, f: GREEN }), T(244, 150, 'key word: PLAYFAIR', { c: 'u', z: 9.5, f: FAINT }), T(244, 162, 'EXAMPLE', { c: 'u', z: 9.5, f: FAINT }));
    return { svg, caption: 'H and I are in different rows and columns, so they swap to the other two corners: B and M.' };
  },

  bacon() {
    const { svg } = card(320, 150);
    const codes = ['aaaaa', 'aaaab', 'aaaba', 'aaabb', 'aabaa', 'aabab', 'aabba', 'aabbb'];
    codes.forEach((code, i) => {
      const x = i < 4 ? 30 : 170;
      const y = 26 + (i % 4) * 20;
      svg.append(T(x, y, ABC[i], { z: 13, w: 700, a: 'start', f: i === 4 ? GREEN : INK }), T(x + 22, y, code, { z: 13, a: 'start', f: i === 4 ? GREEN : INK }));
    });
    // "found", with only the u in bold: a a b a a, which is E.
    const word = 'found';
    word.split('').forEach((ch, i) => {
      const x = 60 + i * 24;
      const b = ch === 'u';
      svg.append(T(x, 126, ch, { c: 'd', z: 19, w: b ? 800 : 400, f: b ? BRASS : INK }), T(x, 144, b ? 'b' : 'a', { z: 11, f: b ? BRASS : FAINT }));
    });
    svg.append(T(196, 126, '= aabaa = E', { z: 13, w: 700, f: GREEN, a: 'start' }));
    return { svg, caption: 'Plain letters stand for a and bold ones for b. Five letters of any word carry one hidden letter.' };
  },

  ascii() {
    const { svg } = card(320, 118);
    svg.append(T(10, 40, 'letter', { c: 'u', z: 10.5, f: FAINT, a: 'start' }), T(10, 70, 'number', { c: 'u', z: 10.5, f: FAINT, a: 'start' }), T(10, 100, 'hex', { c: 'u', z: 10.5, f: FAINT, a: 'start' }));
    [['A', '65', '41'], ['B', '66', '42'], ['C', '67', '43'], ['…', '…', '…'], ['L', '76', '4C'], ['…', '…', '…'], ['Z', '90', '5A']].forEach(([a, n, h], i) => {
      const x = 82 + i * 37;
      svg.append(T(x, 40, a, { z: 16, w: 700 }), T(x, 70, n, { z: 13 }), T(x, 100, h, { z: 13, w: 700, f: BRASS }));
    });
    return { svg, caption: 'Each capital letter has a number. In hexadecimal, A is 41, and the letters count up from there.' };
  },

  binary() {
    const { svg } = card(320, 132);
    [16, 8, 4, 2, 1].forEach((v, i) => {
      const x = 46 + i * 56;
      const hole = v === 16 || v === 4;
      svg.append(T(x, 22, String(v), { z: 12, w: 700, f: FAINT }), R(x - 20, 30, 40, 44, { f: '#e2d3ae', s: '#b49863', r: 6 }), hole ? C(x, 52, 10, { f: INK, s: 'none' }) : C(x, 52, 10, { s: '#b49863', w: 1, d: '2 3' }), T(x, 94, hole ? '1' : '0', { z: 14, w: 700, f: hole ? BRASS : FAINT }));
    });
    svg.append(T(160, 122, 'holes at 16 and 4:  16 + 4 = 20', { z: 13, w: 600, f: GREEN }));
    return { svg, caption: 'Each place is worth twice the one to its right. A hole means that place counts.' };
  },

  chart() {
    const { svg } = card(320, 162);
    const hours = ['20', '21', '22', '23', '00', '01', '02', '03'];
    const rows = ['Mill', 'Dock', 'Inn', 'Yard', 'Shop'];
    const heat = [[0.2, 0.5, 0, 0, 0, 0, 0, 0], [0, 0, 0.3, 0.6, 0.3, 0, 0, 0], [0.7, 0.9, 0.8, 0.4, 0, 0, 0, 0], [0, 0, 0, 0, 0.2, 0.3, 0.95, 0.9], [0, 0, 0, 0, 0, 0, 0.25, 0.2]];
    svg.append(R(8, 8, 304, 134, { f: '#16201b', s: 'none', r: 8 }));
    hours.forEach((h, j) => svg.append(T(78 + j * 28, 26, h, { z: 10, f: '#8fcfa9' })));
    rows.forEach((r, i) => {
      svg.append(T(54, 44 + i * 20, r, { c: 'u', z: 10.5, f: '#b9dcc6', a: 'end' }));
      heat[i].forEach((v, j) => svg.append(R(66 + j * 28, 33 + i * 20, 24, 15, { f: v ? `rgba(143,224,176,${0.15 + 0.85 * v})` : 'rgba(255,255,255,0.05)', s: 'none', r: 2 })));
    });
    svg.append(R(66 + 6 * 28 - 3, 30, 30, 104, { s: '#f2b45a', w: 1.6, r: 4 }), T(78 + 6 * 28 - 10, 156, 'the hour you want', { c: 'u', z: 10, f: BRASS, w: 600 }));
    return { svg, caption: 'Brighter means more nights. Look down the column for your hour, not just for the brightest square.' };
  },

  noonsight() {
    const { svg, arrow } = card(320, 140);
    svg.append(L(16, 112, 304, 112, { s: BLUE, w: 2 }), T(300, 128, 'horizon', { c: 'u', z: 10.5, f: BLUE, a: 'end' }));
    const sun = [246, 30];
    svg.append(C(sun[0], sun[1], 12, { f: '#f2c14e', s: BRASS }));
    for (let a = 0; a < 360; a += 45) {
      const r = (a * Math.PI) / 180;
      svg.append(L(sun[0] + 16 * Math.cos(r), sun[1] + 16 * Math.sin(r), sun[0] + 21 * Math.cos(r), sun[1] + 21 * Math.sin(r), { s: BRASS, w: 1.4 }));
    }
    const eye = [58, 112];
    svg.append(C(eye[0], eye[1] - 4, 4, { f: INK, s: 'none' }), L(eye[0], eye[1] - 4, sun[0] - 14, sun[1] + 6, { s: INK, w: 1.2, d: '5 4' }));
    const ang = Math.atan2(eye[1] - 4 - (sun[1] + 6), sun[0] - 14 - eye[0]);
    const rr = 70;
    svg.append(P(`M${eye[0] + rr} ${eye[1] - 4} A${rr} ${rr} 0 0 0 ${eye[0] + rr * Math.cos(ang)} ${eye[1] - 4 - rr * Math.sin(ang)}`, { s: BRASS, w: 2, m: arrow('brass') }));
    svg.append(T(eye[0] + 82, eye[1] - 22, 'the sun’s height', { c: 'u', z: 11, f: BRASS, a: 'start', w: 600 }), T(eye[0] + 82, eye[1] - 9, 'at noon', { c: 'u', z: 11, f: BRASS, a: 'start', w: 600 }));
    return { svg, caption: 'Measure how high the sun stands at noon. With a table for the day, that gives your latitude.' };
  },

  river() {
    const { svg, arrow } = card(320, 150);
    svg.append(R(0, 0, 320, 150, { f: '#cfe0e6', s: 'none', r: 0 }), R(0, 0, 92, 150, { f: '#e6d6b4', s: 'none', r: 0 }), R(240, 0, 80, 150, { f: '#e6d6b4', s: 'none', r: 0 }));
    const thing = (x, y, label, col) => [C(x, y, 17, { f: col, s: INK, w: 1 }), T(x, y + 4, label, { c: 'u', z: 10.5, w: 700 })];
    svg.append(...thing(46, 28, 'fox', '#e7a35c'), ...thing(46, 76, 'goose', '#fbf8f0'), ...thing(46, 124, 'corn', '#f2d36b'));
    svg.append(L(46, 46, 46, 57, { s: RED, w: 2, m: arrow('red') }), T(72, 56, 'eats', { c: 'u', z: 10, f: RED, a: 'start', w: 700 }), L(46, 94, 46, 105, { s: RED, w: 2, m: arrow('red') }), T(72, 104, 'eats', { c: 'u', z: 10, f: RED, a: 'start', w: 700 }));
    svg.append(P('M120 86 Q166 104 212 86 L204 98 Q166 112 128 98 Z', { f: '#9a6b3e', s: INK, w: 1 }), T(166, 78, 'you + one thing', { c: 'u', z: 10.5, w: 600 }), L(150, 120, 196, 120, { s: FAINT, m: arrow('faint'), ms: arrow('faint') }), T(173, 136, 'over and back', { c: 'u', z: 9.5, f: FAINT }));
    return { svg, caption: 'Never leave a dangerous pair alone. The boat can carry something back as well as over.' };
  },

  logic() {
    const { svg } = card(320, 150);
    const people = ['Ann', 'Ben', 'Cat'];
    const drinks = ['tea', 'coffee', 'milk'];
    const x0 = 100;
    const y0 = 36;
    const cw = 58;
    const ch = 32;
    drinks.forEach((d, j) => svg.append(T(x0 + j * cw + cw / 2, y0 - 10, d, { c: 'u', z: 12, w: 600 })));
    people.forEach((p, i) => {
      svg.append(T(x0 - 12, y0 + i * ch + ch / 2 + 4, p, { c: 'u', z: 12, w: 600, a: 'end' }));
      drinks.forEach((_, j) => svg.append(R(x0 + j * cw, y0 + i * ch, cw, ch, { s: RULE, r: 0 })));
    });
    const mark = (i, j, yes) => {
      const cx = x0 + j * cw + cw / 2;
      const cy = y0 + i * ch + ch / 2;
      return yes ? P(`M${cx - 9} ${cy} L${cx - 2} ${cy + 7} L${cx + 10} ${cy - 8}`, { s: GREEN, w: 3 }) : P(`M${cx - 7} ${cy - 7} L${cx + 7} ${cy + 7} M${cx + 7} ${cy - 7} L${cx - 7} ${cy + 7}`, { s: RED, w: 2 });
    };
    svg.append(mark(0, 0, true), mark(0, 1, false), mark(0, 2, false), mark(1, 0, false), mark(2, 0, false));
    svg.append(T(160, 144, 'Ann drinks tea: cross out the rest of her row and the tea column', { c: 'u', z: 9.5, f: FAINT }));
    return { svg, caption: 'A tick lets you cross out everything else in its row and its column.' };
  },

  smothered() {
    const { svg, arrow } = card(320, 168);
    const g = 34;
    const x0 = 34;
    const y0 = 12;
    const files = 'abcd';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) svg.append(R(x0 + c * g, y0 + r * g, g, g, { f: (r + c) % 2 ? '#b89466' : '#ecdfc4', s: 'none', r: 0 }));
      svg.append(T(x0 - 9, y0 + r * g + g / 2 + 4, String(8 - r), { z: 10, f: FAINT }));
    }
    files.split('').forEach((f, c) => svg.append(T(x0 + c * g + g / 2, y0 + 4 * g + 13, f, { z: 10, f: FAINT })));
    const put = (code, c, r) => svg.append(chessman(code, x0 + c * g + 2, y0 + r * g + 2, g - 4));
    put('k', 0, 0);
    put('r', 1, 0);
    put('p', 0, 1);
    put('p', 1, 1);
    put('N', 2, 1);
    svg.append(L(x0 + 2 * g + 8, y0 + g + 10, x0 + g / 2 + 10, y0 + g / 2 + 4, { s: RED, w: 2.4, m: arrow('red') }));
    svg.append(T(186, 50, 'The king cannot', { c: 'u', z: 11.5, a: 'start' }), T(186, 65, 'move: his own', { c: 'u', z: 11.5, a: 'start' }), T(186, 80, 'pieces block him.', { c: 'u', z: 11.5, a: 'start' }), T(186, 108, 'A knight jumps,', { c: 'u', z: 11.5, a: 'start', f: RED, w: 600 }), T(186, 123, 'so its check', { c: 'u', z: 11.5, a: 'start', f: RED, w: 600 }), T(186, 138, 'cannot be blocked.', { c: 'u', z: 11.5, a: 'start', f: RED, w: 600 }));
    return { svg, caption: 'A smothered mate: the king is boxed in by his own pieces, and a knight gives check.' };
  },

  wordgame() {
    const { svg } = card(320, 120);
    const tiles = [['C', '#8b8b86'], ['R', '#c9a227'], ['A', GREEN], ['N', '#8b8b86'], ['E', '#c9a227']];
    tiles.forEach(([ch, col], i) => {
      const x = 46 + i * 48;
      svg.append(R(x, 14, 42, 42, { f: col, s: 'none', r: 5 }), T(x + 21, 43, ch, { c: 'u', z: 22, w: 800, f: '#fff' }));
    });
    const key = [[GREEN, 'right letter, right place'], ['#c9a227', 'in the word, wrong place'], ['#8b8b86', 'not in the word']];
    key.forEach(([col, text], i) => svg.append(R(56, 70 + i * 16, 11, 11, { f: col, s: 'none', r: 2 }), T(74, 79 + i * 16, text, { c: 'u', z: 11, a: 'start' })));
    return { svg, caption: 'Every guess tells you something about each letter. Keep the greens, move the golds, drop the greys.' };
  },

  timeline() {
    const { svg, arrow } = card(320, 130);
    const x = (yr) => 20 + ((yr - 1000) / 1000) * 280;
    svg.append(L(14, 64, 306, 64, { s: INK, w: 1.6, m: arrow('ink') }), T(16, 84, 'older', { c: 'u', z: 10, f: FAINT, a: 'start' }), T(304, 84, 'newer', { c: 'u', z: 10, f: FAINT, a: 'end' }));
    const pegs = [[1066, 'Hastings', -1], [1215, 'Magna Carta', 1], [1348, 'Black Death', -1], [1588, 'Armada', 1], [1815, 'Waterloo', -1]];
    for (const [yr, name, side] of pegs) {
      const px = x(yr);
      svg.append(L(px, 58, px, 70, { s: BRASS, w: 2.2 }), T(px, side < 0 ? 40 : 102, String(yr), { z: 12, w: 700, f: BRASS }), T(px, side < 0 ? 26 : 116, name, { c: 'u', z: 10.5 }));
    }
    return { svg, caption: 'Keep a few dates as pegs. For anything else, ask: before or after this one?' };
  },

  pendulum() {
    const { svg } = card(320, 168);
    svg.append(R(14, 8, 292, 10, { f: '#7a5332', s: 'none', r: 3 }));
    const bob = (x, len, deg, r, col) => {
      const a = (deg * Math.PI) / 180;
      const bx = x + len * Math.sin(a);
      const by = 18 + len * Math.cos(a);
      return [P(`M${x - len * Math.sin(a)} ${18 + len * Math.cos(a)} A${len} ${len} 0 0 0 ${bx} ${by}`, { s: RULE, w: 1, d: '3 4' }), L(x, 18, bx, by, { s: FAINT, w: 1.2 }), C(bx, by, r, { f: col, s: INK, w: 1 })];
    };
    svg.append(...bob(56, 54, -14, 9, '#d9b46a'), ...bob(166, 108, 13, 8, '#a8743f'), ...bob(254, 108, 13, 13, '#d9b46a'));
    svg.append(T(56, 104, 'short:', { c: 'u', z: 10.5, f: FAINT }), T(56, 117, 'quick', { c: 'u', z: 10.5, f: FAINT }));
    svg.append(P('M150 146 V152 H270 V146', { s: GREEN, w: 1.6 }), T(210, 164, 'same length: they swing together', { c: 'u', z: 10.5, f: GREEN, w: 600 }));
    return { svg, caption: 'Only the length of the string matters. A light weight and a heavy one on the same length swing together.' };
  },

  staff() {
    const { svg } = card(320, 146);
    const line = (i) => 92 - i * 12;
    for (let i = 0; i < 5; i++) svg.append(L(18, line(i), 302, line(i), { s: INK, w: 1 }));
    const note = (x, y, col) => s('ellipse', { cx: x, cy: y, rx: 7.2, ry: 5.4, fill: col, transform: `rotate(-18 ${x} ${y})` });
    'EGBDF'.split('').forEach((n, i) => svg.append(note(52 + i * 28, line(i), INK), T(52 + i * 28, 118, n, { z: 13, w: 700, f: BRASS })));
    'FACE'.split('').forEach((n, i) => svg.append(note(210 + i * 26, line(i) - 6, INK), T(210 + i * 26, 118, n, { z: 13, w: 700, f: GREEN })));
    svg.append(T(108, 138, 'lines: Every Good Boy Deserves Fruit', { c: 'u', z: 9.5, f: BRASS }), T(249, 138, 'spaces: FACE', { c: 'u', z: 9.5, f: GREEN }));
    return { svg, caption: 'With a treble clef, the lines and the spaces each have a letter. Higher on the staff sounds higher.' };
  },

  latlong() {
    const { svg, arrow } = card(320, 164);
    svg.append(R(20, 14, 280, 132, { f: '#dfe9ee', s: '#9db3bf', r: 6 }));
    for (let i = 1; i < 6; i++) svg.append(L(20 + i * 46.6, 14, 20 + i * 46.6, 146, { s: '#c2d2da', w: 0.8 }));
    for (let i = 1; i < 4; i++) svg.append(L(20, 14 + i * 33, 300, 14 + i * 33, { s: '#c2d2da', w: 0.8 }));
    svg.append(L(20, 80, 300, 80, { s: RED, w: 1.6 }), T(24, 94, 'equator  0°', { c: 'u', z: 10, f: RED, a: 'start', w: 600 }), L(160, 14, 160, 146, { s: BLUE, w: 1.6 }), T(164, 140, 'Greenwich  0°', { c: 'u', z: 10, f: BLUE, a: 'start', w: 600 }));
    const pt = [230, 47];
    svg.append(L(pt[0], 80, pt[0], pt[1] + 6, { s: RED, w: 1.6, d: '4 3', m: arrow('red') }), L(160, pt[1], pt[0] - 6, pt[1], { s: BLUE, w: 1.6, d: '4 3', m: arrow('ink') }), C(pt[0], pt[1], 5, { f: BRASS, s: INK }));
    svg.append(T(pt[0], pt[1] - 11, '30° N, 60° E', { z: 11, w: 700 }), T(pt[0] + 6, 70, 'north', { c: 'u', z: 9.5, f: RED, a: 'start' }), T(190, pt[1] + 13, 'east', { c: 'u', z: 9.5, f: BLUE }));
    return { svg, caption: 'Latitude first: how far north or south of the equator. Then longitude: how far east or west of Greenwich.' };
  },

  noon() {
    const { svg } = card(320, 132);
    const xs = [272, 206, 140, 74];
    svg.append(L(30, 78, 300, 78, { s: INK, w: 1.2 }));
    xs.forEach((x, d) => {
      svg.append(L(x, 70, x, 86, { s: d === 0 ? BLUE : INK, w: d === 0 ? 2.4 : 1.4 }), T(x, 102, d === 0 ? '0°' : `${d}° W`, { z: 12, w: 700, f: d === 0 ? BLUE : INK }), T(x, 120, `12:${String(d * 4).padStart(2, '0')}`, { z: 12, f: BRASS, w: 600 }));
    });
    svg.append(C(272, 34, 11, { f: '#f2c14e', s: BRASS }), T(272, 60, 'Greenwich', { c: 'u', z: 10, f: BLUE, w: 600 }), T(150, 30, 'noon comes 4 minutes later', { c: 'u', z: 11, f: FAINT }), T(150, 44, 'for every degree west', { c: 'u', z: 11, f: FAINT }));
    return { svg, caption: 'Noon by the sun, as a Greenwich clock reads it: four minutes later for each degree west.' };
  },

  nina() {
    const { svg } = card(320, 178);
    const g = 28;
    const x0 = 90;
    const y0 = 10;
    const grid = ['HOSTA', 'AIRED', 'LONGS', 'TRIES', '#ODES'];
    const word = 'HIDES';
    grid.forEach((row, r) =>
      row.split('').forEach((ch, c) => {
        if (ch === '#') return svg.append(R(x0 + c * g, y0 + r * g, g, g, { f: INK, s: 'none', r: 0 }));
        const hit = r === c;
        svg.append(R(x0 + c * g, y0 + r * g, g, g, { f: hit ? 'rgba(168,105,28,0.2)' : 'none', s: RULE, r: 0 }), T(x0 + c * g + g / 2, y0 + r * g + g / 2 + 4.5, hit ? word[r] : ch, { z: 13, w: hit ? 800 : 500, f: hit ? BRASS : INK }));
      }),
    );
    svg.append(T(160, 170, 'corner to corner: H I D E S', { c: 'u', z: 10.5, f: BRASS, w: 600 }));
    return { svg, caption: 'A Nina: a word hidden in a finished grid, apart from the answers.' };
  },

  cryptic() {
    const { svg, arrow } = card(320, 150);
    svg.append(T(160, 26, 'Vehicle, then animal:', { c: 'd', z: 15, i: true }), T(160, 46, 'a covering for the floor (6)', { c: 'd', z: 15, i: true }));
    svg.append(L(66, 52, 254, 52, { s: GREEN, w: 2 }), T(160, 66, 'the definition', { c: 'u', z: 10, f: GREEN, w: 600 }));
    svg.append(L(126, 31, 126, 90, { s: BRASS, w: 1, d: '3 3', m: arrow('brass') }), L(200, 31, 200, 90, { s: BRASS, w: 1, d: '3 3', m: arrow('brass') }));
    svg.append(T(126, 108, 'CAR', { z: 15, w: 700, f: BRASS }), T(163, 108, '+', { z: 15, f: FAINT }), T(200, 108, 'PET', { z: 15, w: 700, f: BRASS }), T(160, 138, '= CARPET, a covering for the floor', { z: 12, w: 700, f: GREEN }));
    return { svg, caption: 'One end of the clue is a plain definition. The rest builds the same word another way.' };
  },

  knight() {
    const { svg } = card(320, 198);
    const g = 20;
    const x0 = 90;
    const y0 = 10;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) svg.append(R(x0 + c * g, y0 + r * g, g, g, { f: (r + c) % 2 ? '#b89466' : '#ecdfc4', s: 'none', r: 0 }));
      svg.append(T(x0 - 8, y0 + r * g + 14, String(8 - r), { z: 10, f: FAINT }));
    }
    'abcdefgh'.split('').forEach((f, c) => svg.append(T(x0 + c * g + g / 2, y0 + 8 * g + 13, f, { z: 10, f: FAINT })));
    const sq = (file, rank) => [x0 + 'abcdefgh'.indexOf(file) * g + g / 2, y0 + (8 - rank) * g + g / 2];
    const [kx, ky] = sq('b', 1);
    svg.append(chessman('N', kx - g / 2 + 1, ky - g / 2 + 1, g - 2));
    for (const [f, r] of [['a', 3], ['c', 3], ['d', 2]]) {
      const [x, y] = sq(f, r);
      svg.append(C(x, y, 5.5, { f: GREEN, s: 'none' }), L(kx, ky, x, y, { s: GREEN, w: 1.2, d: '2 3' }));
    }
    svg.append(T(258, 150, 'From b1:', { c: 'u', z: 10.5, a: 'start' }), T(258, 164, 'a3, c3, d2', { c: 'u', z: 10.5, a: 'start', f: GREEN, w: 700 }), T(30, 40, 'rank', { c: 'u', z: 10, f: FAINT }), T(30, 52, '(row)', { c: 'u', z: 10, f: FAINT }), T(176, 194, 'file (column)', { c: 'u', z: 10, f: FAINT }));
    return { svg, caption: 'Squares are named by column letter, then row number. A knight moves two squares one way and one to the side.' };
  },

  magic() {
    const { svg } = card(320, 156);
    const g = 36;
    const x0 = 106;
    const y0 = 12;
    const sq = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
    sq.forEach((row, r) => row.forEach((n, c) => svg.append(R(x0 + c * g, y0 + r * g, g, g, { s: INK, r: 0 }), T(x0 + c * g + g / 2, y0 + r * g + g / 2 + 6, String(n), { c: 'd', z: 18, w: 600 }))));
    for (let i = 0; i < 3; i++) svg.append(T(x0 + 3 * g + 18, y0 + i * g + g / 2 + 5, '15', { z: 12, w: 700, f: BRASS }), T(x0 + i * g + g / 2, y0 + 3 * g + 18, '15', { z: 12, w: 700, f: BRASS }));
    svg.append(T(x0 + 3 * g + 18, y0 + 3 * g + 18, '15', { z: 12, w: 700, f: GREEN }), T(x0 - 18, y0 + 3 * g + 18, '15', { z: 12, w: 700, f: GREEN }), T(160, 150, 'every row, column and long diagonal', { c: 'u', z: 10, f: FAINT }));
    return { svg, caption: 'The Lo Shu square: every line adds up to the same total, 15.' };
  },

  bridges() {
    const { svg } = card(320, 172);
    const N = { n: [160, 22], s: [160, 150], i: [92, 86], e: [254, 86] };
    const edge = (a, b, bend = 0) => {
      const [x1, y1] = N[a];
      const [x2, y2] = N[b];
      const mx = (x1 + x2) / 2 + bend * (y2 - y1) * 0.25;
      const my = (y1 + y2) / 2 - bend * (x2 - x1) * 0.25;
      return P(`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`, { s: '#8a5a2e', w: 2.4 });
    };
    svg.append(edge('n', 'i', 0.6), edge('n', 'i', -0.6), edge('s', 'i', 0.6), edge('s', 'i', -0.6), edge('n', 'e'), edge('s', 'e'), edge('i', 'e'));
    const node = (k, label, count) => [C(N[k][0], N[k][1], 15, { f: '#f3ecdb', s: INK, w: 1.4 }), T(N[k][0], N[k][1] + 5, String(count), { z: 14, w: 800, f: RED }), T(N[k][0] + (k === 'e' ? 0 : k === 'i' ? -2 : 24), N[k][1] + (k === 'e' || k === 'i' ? 32 : 5), label, { c: 'u', z: 10, f: FAINT, a: k === 'n' || k === 's' ? 'start' : 'middle' })];
    svg.append(...node('n', 'north bank', 3), ...node('s', 'south bank', 3), ...node('i', 'island', 5), ...node('e', 'east', 3));
    return { svg, caption: 'Königsberg: each place shows how many bridges touch it. All four are odd, so no walk crosses every bridge once.' };
  },

  fifteen() {
    const { svg, arrow } = card(320, 160);
    const g = 34;
    const x0 = 92;
    const y0 = 10;
    svg.append(R(x0 - 6, y0 - 6, 4 * g + 12, 4 * g + 12, { f: '#7a5332', s: 'none', r: 8 }));
    for (let i = 0; i < 15; i++) {
      const r = Math.floor(i / 4);
      const c = i % 4;
      svg.append(R(x0 + c * g + 1.5, y0 + r * g + 1.5, g - 3, g - 3, { f: '#efe3c6', s: '#b49863', r: 4 }), T(x0 + c * g + g / 2, y0 + r * g + g / 2 + 5, String(i + 1), { c: 'd', z: 14, w: 700 }));
    }
    svg.append(L(x0 + 3 * g + g / 2, y0 + 2 * g + g - 2, x0 + 3 * g + g / 2, y0 + 3 * g + g / 2 + 4, { s: BRASS, w: 2.4, m: arrow('brass') }));
    svg.append(T(258, 74, 'slide a tile', { c: 'u', z: 10.5, f: BRASS, a: 'start' }), T(258, 88, 'into the gap', { c: 'u', z: 10.5, f: BRASS, a: 'start' }));
    return { svg, caption: 'Count the pairs of tiles in the wrong order. If the count is odd, no amount of sliding will solve it.' };
  },

  letterlock() {
    const { svg } = card(320, 132);
    svg.append(R(28, 34, 238, 64, { f: '#c99a4b', s: '#7a5a23', w: 1.5, r: 10 }), R(266, 54, 34, 24, { f: '#9c9c96', s: '#5d5d58', r: 4 }));
    'KEYWORD'.split('').forEach((ch, i) => {
      const x = 46 + i * 32;
      const k = ABC.indexOf(ch);
      svg.append(R(x - 13, 26, 26, 80, { f: '#e3c27e', s: '#7a5a23', w: 1.2, r: 6 }), T(x, 44, ABC[(k + 25) % 26], { z: 10, f: '#8a6a33' }), R(x - 12, 54, 24, 24, { f: '#fbf3df', s: '#7a5a23', w: 1, r: 3 }), T(x, 71, ch, { z: 15, w: 800 }), T(x, 98, ABC[(k + 1) % 26], { z: 10, f: '#8a6a33' }));
    });
    svg.append(T(283, 94, 'bolt', { c: 'u', z: 9.5, f: FAINT }), T(160, 124, 'turn each ring until the word lines up in the window', { c: 'u', z: 10.5, f: FAINT }));
    return { svg, caption: 'A letter-lock: one ring for each letter. The bolt moves only when every ring shows the right letter.' };
  },

  foxglove() {
    const { svg } = card(320, 168);
    svg.append(P('M120 160 C118 120 122 80 128 18', { s: GREEN, w: 3 }));
    svg.append(P('M120 160 C96 150 84 140 78 126 C98 128 112 140 120 150', { f: '#6f9b6a', s: GREEN, w: 1 }), P('M121 158 C144 150 156 140 162 128 C142 130 128 140 121 150', { f: '#6f9b6a', s: GREEN, w: 1 }));
    for (let i = 0; i < 7; i++) {
      const y = 34 + i * 15;
      const x = 128 - i * 0.9;
      const side = i % 2 ? 1 : -1;
      const bx = x + side * 12;
      svg.append(L(x, y, bx, y + 4, { s: GREEN, w: 1.4 }), P(`M${bx} ${y + 2} q${side * 4} 2 ${side * 5} 14 q${-side * 5} 4 ${-side * 11} 0 q0 -10 ${side * 6} -14 z`, { f: '#a24b8f', s: '#6d2e60', w: 1 }));
    }
    svg.append(T(196, 70, 'Foxglove', { c: 'd', z: 17, w: 600, a: 'start' }), T(196, 88, 'Digitalis purpurea', { c: 'd', z: 12, i: true, f: FAINT, a: 'start' }), T(196, 112, 'a heart medicine,', { c: 'u', z: 11, a: 'start' }), T(196, 126, 'and a poison', { c: 'u', z: 11, a: 'start', f: RED, w: 600 }));
    return { svg, caption: 'The dose that helps is close to the dose that harms. It works slowly, over several hours.' };
  },

  carrier() {
    const { svg } = card(320, 150);
    svg.append(R(14, 50, 120, 44, { f: '#b9b2a0', s: '#6d675a', r: 22 }), R(134, 44, 120, 56, { f: '#d9b46a', s: '#7a5a23', r: 6 }), R(254, 50, 52, 44, { f: '#b9b2a0', s: '#6d675a', r: 22 }));
    const rows = [['IN', [0, 1, 0, 0, 1], 60], ['OUT', [0, 1, 1, 0, 1], 84]];
    [16, 8, 4, 2, 1].forEach((v, i) => svg.append(T(150 + i * 22, 36, String(v), { z: 10, w: 700, f: FAINT })));
    for (const [name, bits, y] of rows) {
      svg.append(T(128, y + 4, name, { c: 'u', z: 9.5, w: 700, f: INK, a: 'end' }));
      bits.forEach((b, i) => svg.append(b ? C(150 + i * 22, y, 5, { f: INK, s: 'none' }) : C(150 + i * 22, y, 5, { s: '#7a5a23', w: 1, f: 'none' })));
    }
    svg.append(T(160, 122, 'in: 8 + 1 = 9, nine in the morning', { c: 'u', z: 11, f: GREEN, w: 600 }), T(160, 138, 'out: 8 + 4 + 1 = 13, one in the afternoon', { c: 'u', z: 11, f: GREEN, w: 600 }));
    return { svg, caption: 'Every carrier is punched on its collar as it passes the exchange: the hour in, and the hour out.' };
  },
};

/**
 * Draw a lesson's picture.
 * @param {string} name
 * @returns {{ svg: SVGSVGElement, caption: string }|null}
 */
export function drawLesson(name) {
  const make = PICS[name];
  if (!make) return null;
  const out = make();
  out.svg.setAttribute('aria-label', out.caption);
  return out;
}

export const LESSON_PICTURES = Object.keys(PICS);
