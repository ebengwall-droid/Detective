// Painted artwork for one-off surfaces: charts, photographs, plaques, signs,
// screens. Each painter draws onto a canvas that becomes a texture.

const SERIF = '"Marcellus SC", "Marcellus", Georgia, "Times New Roman", serif';
const TYPE = '"Special Elite", "Courier New", Courier, monospace';
const SANS = '"Instrument Sans", "Helvetica Neue", Arial, sans-serif';
const MONO = '"JetBrains Mono", "Courier New", monospace';

function paperGround(ctx, w, h, rnd, base = '#d9cfb4') {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = Math.max(w, h) * (0.1 + rnd() * 0.3);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rnd() > 0.5 ? '120,90,40' : '255,250,230'},${0.05 + rnd() * 0.06})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

function typedLines(ctx, x, y, w, lines, lineH, rnd, color = 'rgba(30,26,22,0.8)') {
  ctx.fillStyle = color;
  for (let i = 0; i < lines; i++) {
    let cx = x;
    const end = x + w * (i === lines - 1 ? 0.3 + rnd() * 0.4 : 0.82 + rnd() * 0.18);
    while (cx < end) {
      const len = 6 + rnd() * 26;
      ctx.fillRect(cx, y + i * lineH, Math.min(len, end - cx), Math.max(1.5, lineH * 0.22));
      cx += len + 5;
    }
  }
}

export const ART = {
  /** Harbour chart of Greyhaven: coastline, soundings, compass rose, Marrow Point. */
  chart(ctx, w, h, rnd) {
    paperGround(ctx, w, h, rnd, '#cfd3bd');
    // Sea tint.
    ctx.fillStyle = 'rgba(96,140,150,0.28)';
    ctx.fillRect(0, 0, w, h);
    // Land mass along the top and left with a harbour bite out of it.
    ctx.fillStyle = '#d8c79a';
    ctx.strokeStyle = '#4a4433';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.22);
    ctx.bezierCurveTo(w * 0.8, h * 0.3, w * 0.74, h * 0.16, w * 0.6, h * 0.26);
    ctx.bezierCurveTo(w * 0.5, h * 0.46, w * 0.36, h * 0.42, w * 0.3, h * 0.3);
    ctx.bezierCurveTo(w * 0.24, h * 0.5, w * 0.2, h * 0.7, w * 0.08, h * 0.82);
    ctx.lineTo(0, h * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Marrow Point spit and the Teeth.
    ctx.beginPath();
    ctx.moveTo(w * 0.6, h * 0.26);
    ctx.bezierCurveTo(w * 0.68, h * 0.44, w * 0.74, h * 0.6, w * 0.8, h * 0.66);
    ctx.bezierCurveTo(w * 0.76, h * 0.58, w * 0.7, h * 0.4, w * 0.66, h * 0.25);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4a4433';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(w * (0.82 + rnd() * 0.07), h * (0.68 + rnd() * 0.08), 2 + rnd() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Lighthouse symbol.
    ctx.fillStyle = '#9c2f22';
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.66, 5, 0, Math.PI * 2);
    ctx.fill();
    // Depth contours and soundings.
    ctx.strokeStyle = 'rgba(40,80,95,0.4)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * (0.9 - k * 0.02));
      ctx.bezierCurveTo(w * 0.3, h * (0.6 + k * 0.07), w * 0.55, h * (0.55 + k * 0.08), w, h * (0.4 + k * 0.12));
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(40,60,70,0.7)';
    ctx.font = `${Math.round(h * 0.028)}px ${SERIF}`;
    for (let i = 0; i < 38; i++) {
      const x = w * (0.3 + rnd() * 0.68);
      const y = h * (0.5 + rnd() * 0.48);
      ctx.fillText(String(2 + Math.floor(rnd() * 28)), x, y);
    }
    // Grid.
    ctx.strokeStyle = 'rgba(60,60,50,0.22)';
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo((w * i) / 6, 0);
      ctx.lineTo((w * i) / 6, h);
      ctx.moveTo(0, (h * i) / 6);
      ctx.lineTo(w, (h * i) / 6);
      ctx.stroke();
    }
    // Compass rose.
    const cx = w * 0.18;
    const cy = h * 0.18 + h * 0.5;
    const r = h * 0.1;
    ctx.strokeStyle = '#4a4433';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      const len = i % 4 === 0 ? r * 1.25 : i % 2 === 0 ? r * 0.9 : r * 0.55;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.fillStyle = '#3b3526';
    ctx.font = `${Math.round(h * 0.06)}px ${SERIF}`;
    ctx.fillText('GREYHAVEN HARBOUR', w * 0.34, h * 0.12);
    ctx.font = `${Math.round(h * 0.034)}px ${SERIF}`;
    ctx.fillText('MARROW POINT', w * 0.6, h * 0.6);
    ctx.fillText('THE TEETH', w * 0.8, h * 0.82);
  },

  /** Brass memorial plaque. opts.title / opts.lines / opts.big */
  plaque(ctx, w, h, rnd, opts = {}) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#b8923f');
    g.addColorStop(0.5, '#d7b560');
    g.addColorStop(1, '#8f6f2c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.strokeStyle = `rgba(${rnd() > 0.5 ? '255,240,190' : '60,40,10'},${0.03 + rnd() * 0.05})`;
      ctx.beginPath();
      const y = rnd() * h;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(50,34,8,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = 'rgba(38,26,6,0.92)';
    ctx.textAlign = 'center';
    let y = h * 0.16;
    if (opts.title) {
      ctx.font = `${Math.round(h * 0.085)}px ${SERIF}`;
      ctx.fillText(opts.title, w / 2, y);
      y += h * 0.09;
    }
    if (opts.big) {
      ctx.font = `${Math.round(h * 0.17)}px ${SERIF}`;
      ctx.fillText(opts.big, w / 2, y + h * 0.1);
      y += h * 0.18;
    }
    const lines = opts.lines ?? [];
    ctx.font = `${Math.round(h * 0.042)}px ${SERIF}`;
    for (const line of lines) {
      ctx.fillText(line, w / 2, y);
      y += h * 0.058;
    }
    ctx.textAlign = 'left';
  },

  /** Painted shop or door sign. opts.text, opts.sub, opts.bg, opts.fg */
  sign(ctx, w, h, rnd, opts = {}) {
    ctx.fillStyle = opts.bg ?? '#1f2b25';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.12})`;
      ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
    }
    ctx.strokeStyle = opts.fg ?? '#d1b168';
    ctx.lineWidth = Math.max(2, h * 0.03);
    ctx.strokeRect(h * 0.07, h * 0.07, w - h * 0.14, h - h * 0.14);
    ctx.fillStyle = opts.fg ?? '#d1b168';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = opts.size ?? 0.36;
    ctx.font = `${Math.round(h * size)}px ${SERIF}`;
    ctx.fillText(opts.text ?? '', w / 2, opts.sub ? h * 0.42 : h * 0.52, w * 0.9);
    if (opts.sub) {
      ctx.font = `${Math.round(h * 0.16)}px ${SERIF}`;
      ctx.fillText(opts.sub, w / 2, h * 0.76, w * 0.9);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  /** Frosted office-door style lettering on a transparent ground. */
  lettering(ctx, w, h, _rnd, opts = {}) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = opts.fg ?? 'rgba(232,214,160,0.92)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(h * 0.34)}px ${SERIF}`;
    ctx.fillText(opts.text ?? '', w / 2, h * 0.36, w * 0.94);
    if (opts.sub) {
      ctx.font = `${Math.round(h * 0.2)}px ${SERIF}`;
      ctx.fillText(opts.sub, w / 2, h * 0.74, w * 0.94);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  /**
   * Sepia photograph. opts.kind: 'girl' | 'crew' | 'ferry' | 'lighthouse' |
   * 'couple' | 'harbor' | 'portrait'
   */
  photo(ctx, w, h, rnd, opts = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8d7f68');
    g.addColorStop(1, '#4e4435');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const ink = 'rgba(32,24,16,0.85)';
    const pale = 'rgba(214,198,168,0.9)';
    const figure = (x, baseY, s, hair) => {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.55, baseY);
      ctx.quadraticCurveTo(x - s * 0.5, baseY - s * 1.5, x, baseY - s * 1.55);
      ctx.quadraticCurveTo(x + s * 0.5, baseY - s * 1.5, x + s * 0.55, baseY);
      ctx.fill();
      ctx.fillStyle = pale;
      ctx.beginPath();
      ctx.arc(x, baseY - s * 1.9, s * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink;
      if (hair === 'long') {
        ctx.beginPath();
        ctx.arc(x, baseY - s * 1.98, s * 0.4, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - s * 0.42, baseY - s * 2, s * 0.16, s * 0.7);
        ctx.fillRect(x + s * 0.26, baseY - s * 2, s * 0.16, s * 0.7);
      } else if (hair === 'cap') {
        ctx.fillRect(x - s * 0.42, baseY - s * 2.26, s * 0.84, s * 0.2);
        ctx.fillRect(x - s * 0.5, baseY - s * 2.1, s * 0.6, s * 0.07);
      } else {
        ctx.beginPath();
        ctx.arc(x, baseY - s * 1.98, s * 0.38, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fill();
      }
    };
    const kind = opts.kind ?? 'portrait';
    if (kind === 'girl') {
      // A girl of about eleven on a quay, a bosun's whistle on a chain.
      ctx.fillStyle = 'rgba(200,190,165,0.35)';
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
      figure(w * 0.5, h * 0.96, h * 0.26, 'long');
      ctx.strokeStyle = '#e9d9a0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.6);
      ctx.quadraticCurveTo(w * 0.5, h * 0.74, w * 0.56, h * 0.6);
      ctx.stroke();
      ctx.fillStyle = '#f0dfa0';
      ctx.fillRect(w * 0.485, h * 0.71, w * 0.03, h * 0.06);
    } else if (kind === 'crew') {
      ctx.fillStyle = 'rgba(200,190,165,0.3)';
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
      for (let i = 0; i < 5; i++) figure(w * (0.16 + i * 0.17), h * 0.97, h * 0.2, 'cap');
      ctx.fillStyle = ink;
      ctx.fillRect(0, h * 0.3, w, h * 0.05);
    } else if (kind === 'ferry') {
      ctx.fillStyle = 'rgba(30,40,45,0.6)';
      ctx.fillRect(0, h * 0.66, w, h * 0.34);
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.66);
      ctx.lineTo(w * 0.92, h * 0.66);
      ctx.lineTo(w * 0.84, h * 0.78);
      ctx.lineTo(w * 0.14, h * 0.78);
      ctx.fill();
      ctx.fillStyle = pale;
      ctx.fillRect(w * 0.2, h * 0.5, w * 0.56, h * 0.16);
      ctx.fillStyle = ink;
      for (let i = 0; i < 8; i++) ctx.fillRect(w * (0.23 + i * 0.065), h * 0.55, w * 0.03, h * 0.05);
      ctx.fillRect(w * 0.42, h * 0.3, w * 0.1, h * 0.2);
      ctx.fillStyle = 'rgba(210,200,180,0.35)';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.2, h * 0.12, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'lighthouse') {
      ctx.fillStyle = 'rgba(30,40,45,0.6)';
      ctx.fillRect(0, h * 0.8, w, h * 0.2);
      ctx.fillStyle = pale;
      ctx.beginPath();
      ctx.moveTo(w * 0.4, h * 0.85);
      ctx.lineTo(w * 0.45, h * 0.28);
      ctx.lineTo(w * 0.55, h * 0.28);
      ctx.lineTo(w * 0.6, h * 0.85);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.fillRect(w * 0.43, h * 0.2, w * 0.14, h * 0.09);
      ctx.fillRect(w * 0.42, h * 0.5, w * 0.16, h * 0.07);
      ctx.beginPath();
      ctx.moveTo(w * 0.43, h * 0.2);
      ctx.lineTo(w * 0.5, h * 0.12);
      ctx.lineTo(w * 0.57, h * 0.2);
      ctx.fill();
    } else if (kind === 'couple') {
      figure(w * 0.36, h * 0.98, h * 0.27, 'short');
      figure(w * 0.64, h * 0.98, h * 0.25, 'long');
    } else if (kind === 'harbor') {
      ctx.fillStyle = 'rgba(30,40,45,0.55)';
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
      ctx.fillStyle = ink;
      for (let i = 0; i < 7; i++) {
        const x = w * (0.08 + i * 0.13);
        ctx.fillRect(x, h * (0.25 + rnd() * 0.15), 2, h * 0.38);
        ctx.fillRect(x - w * 0.04, h * 0.58, w * 0.08, h * 0.05);
      }
    } else {
      figure(w * 0.5, h * 1.02, h * 0.36, opts.hair ?? 'short');
    }
    // Vignette, scratches, border.
    const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(20,12,4,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(240,230,200,0.12)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(rnd() * w, rnd() * h);
      ctx.lineTo(rnd() * w, rnd() * h);
      ctx.stroke();
    }
    ctx.strokeStyle = '#d9cdb0';
    ctx.lineWidth = Math.max(3, w * 0.04);
    ctx.strokeRect(0, 0, w, h);
  },

  /** Moody oil painting of a storm sea for parlour walls. */
  seascape(ctx, w, h, rnd) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1d2a33');
    sky.addColorStop(0.55, '#51605f');
    sky.addColorStop(0.56, '#1b2f38');
    sky.addColorStop(1, '#0c171c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(200,215,210,${0.05 + rnd() * 0.18})`;
      ctx.lineWidth = 1 + rnd() * 2;
      const y = h * (0.58 + rnd() * 0.4);
      const x = rnd() * w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 14, y - 5 - rnd() * 5, x + 30 + rnd() * 30, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(240,210,140,0.75)';
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.3, h * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d1114';
    ctx.fillRect(w * 0.7, h * 0.3, w * 0.035, h * 0.26);
  },

  /** Wall clock face. opts.time "HH:MM" */
  clock(ctx, w, h, _rnd, opts = {}) {
    const r = w / 2;
    ctx.fillStyle = '#e4dcc6';
    ctx.beginPath();
    ctx.arc(r, r, r * 0.96, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    for (let i = 0; i < 60; i++) {
      const a = (i * Math.PI) / 30;
      const inner = i % 5 === 0 ? 0.78 : 0.88;
      ctx.lineWidth = i % 5 === 0 ? 4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(r + Math.cos(a) * r * inner, r + Math.sin(a) * r * inner);
      ctx.lineTo(r + Math.cos(a) * r * 0.93, r + Math.sin(a) * r * 0.93);
      ctx.stroke();
    }
    const [hh, mm] = (opts.time ?? '10:10').split(':').map(Number);
    const hand = (angle, len, width) => {
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r, r);
      ctx.lineTo(r + Math.sin(angle) * len, r - Math.cos(angle) * len);
      ctx.stroke();
    };
    hand((((hh % 12) + mm / 60) * Math.PI) / 6, r * 0.5, 7);
    hand((mm * Math.PI) / 30, r * 0.74, 4.5);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(r, r, 6, 0, Math.PI * 2);
    ctx.fill();
  },

  /** Sheet of typed paper. opts.title, opts.lines, opts.stamp */
  typed(ctx, w, h, rnd, opts = {}) {
    paperGround(ctx, w, h, rnd, opts.bg ?? '#e2dccb');
    ctx.fillStyle = 'rgba(30,26,22,0.88)';
    if (opts.title) {
      ctx.font = `${Math.round(h * 0.075)}px ${TYPE}`;
      ctx.fillText(opts.title, w * 0.09, h * 0.14, w * 0.82);
    }
    typedLines(ctx, w * 0.09, h * 0.22, w * 0.82, opts.lines ?? 12, h * 0.055, rnd);
    if (opts.stamp) {
      ctx.save();
      ctx.translate(w * 0.62, h * 0.8);
      ctx.rotate(-0.22);
      ctx.strokeStyle = 'rgba(150,30,25,0.75)';
      ctx.fillStyle = 'rgba(150,30,25,0.75)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-w * 0.2, -h * 0.05, w * 0.4, h * 0.1);
      ctx.font = `${Math.round(h * 0.06)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText(opts.stamp, 0, h * 0.022, w * 0.38);
      ctx.restore();
    }
  },

  newspaper(ctx, w, h, rnd, opts = {}) {
    paperGround(ctx, w, h, rnd, '#cfc9b8');
    ctx.fillStyle = '#1a1816';
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(h * 0.1)}px ${SERIF}`;
    ctx.fillText('THE GREYHAVEN LEDGER', w / 2, h * 0.12, w * 0.92);
    ctx.fillRect(w * 0.05, h * 0.15, w * 0.9, 3);
    ctx.font = `bold ${Math.round(h * 0.085)}px ${SERIF}`;
    ctx.fillText(opts.headline ?? 'THE LAMPLIGHTER STRIKES AGAIN', w / 2, h * 0.26, w * 0.9);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(60,55,48,0.65)';
    ctx.fillRect(w * 0.06, h * 0.32, w * 0.36, h * 0.26);
    for (let c = 0; c < 2; c++) {
      typedLines(ctx, w * (c ? 0.52 : 0.06), h * (c ? 0.33 : 0.63), w * (c ? 0.42 : 0.36), c ? 18 : 9, h * 0.034, rnd, 'rgba(30,26,22,0.6)');
    }
  },

  /** The detectives' case board: photos, notes and red string. */
  caseBoard(ctx, w, h, rnd) {
    ctx.fillStyle = '#8a6a44';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? '40,24,8' : '210,170,110'},${rnd() * 0.25})`;
      ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
    const pins = [];
    const card = (x, y, cw, ch, tone, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-cw / 2 + 3, -ch / 2 + 4, cw, ch);
      ctx.fillStyle = tone;
      ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
      if (tone === '#3b3a36') {
        ctx.fillStyle = 'rgba(210,200,180,0.75)';
        ctx.beginPath();
        ctx.arc(0, -ch * 0.08, cw * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-cw * 0.3, ch * 0.14, cw * 0.6, ch * 0.3);
      } else {
        typedLines(ctx, -cw / 2 + 6, -ch / 2 + 10, cw - 12, 4, ch / 6, rnd, 'rgba(40,36,30,0.6)');
      }
      ctx.restore();
      pins.push([x, y - ch / 2 + 6]);
    };
    const tones = ['#3b3a36', '#e4dcc4', '#3b3a36', '#d8cfa0', '#e4dcc4', '#3b3a36', '#e4dcc4', '#3b3a36', '#d8cfa0'];
    for (let i = 0; i < 9; i++) {
      const x = w * (0.12 + (i % 5) * 0.19 + (rnd() - 0.5) * 0.04);
      const y = h * (0.28 + Math.floor(i / 5) * 0.42 + (rnd() - 0.5) * 0.08);
      card(x, y, w * 0.13, h * 0.3, tones[i], (rnd() - 0.5) * 0.2);
    }
    ctx.strokeStyle = 'rgba(170,30,26,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < pins.length - 1; i++) {
      const a = pins[i];
      const b = pins[(i * 3 + 2) % pins.length];
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
    for (const [x, y] of pins) {
      ctx.fillStyle = '#b6261e';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /** Laptop screen showing the HARBORNET terminal. */
  screen(ctx, w, h) {
    ctx.fillStyle = '#071318';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#12303a';
    ctx.fillRect(0, 0, w, h * 0.13);
    ctx.fillStyle = '#9fe0d0';
    ctx.font = `${Math.round(h * 0.075)}px ${MONO}`;
    ctx.fillText('HARBORNET // GREYHAVEN PD', w * 0.04, h * 0.095);
    ctx.fillStyle = 'rgba(140,220,200,0.75)';
    ctx.font = `${Math.round(h * 0.06)}px ${MONO}`;
    const rows = ['> case 24-1011 BROOK, L.', '  status: OPEN / HOMICIDE', '> records ............ ok', '> lab queue .......... 0', '> _'];
    rows.forEach((row, i) => ctx.fillText(row, w * 0.05, h * (0.27 + i * 0.13)));
  },

  /** Ledger page with ruled columns. */
  ledger(ctx, w, h, rnd) {
    paperGround(ctx, w, h, rnd, '#ded3b4');
    ctx.strokeStyle = 'rgba(150,40,30,0.5)';
    ctx.lineWidth = 1.5;
    for (const x of [0.16, 0.62, 0.8]) {
      ctx.beginPath();
      ctx.moveTo(w * x, 0);
      ctx.lineTo(w * x, h);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(60,80,120,0.35)';
    for (let i = 1; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h * i) / 16);
      ctx.lineTo(w, (h * i) / 16);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(25,25,60,0.7)';
    ctx.lineWidth = 1.4;
    for (let i = 1; i < 12; i++) {
      const y = (h * i) / 16 - 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.19, y);
      for (let x = 0.19; x < 0.5 + rnd() * 0.1; x += 0.02) ctx.lineTo(w * x, y + (rnd() - 0.5) * 6);
      ctx.stroke();
    }
  },

  /** Yellow evidence tent number. */
  marker(ctx, w, h, _rnd, opts = {}) {
    ctx.fillStyle = '#e3bd12';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.7)}px ${SANS}`;
    ctx.fillText(String(opts.n ?? 1), w / 2, h * 0.54);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  /** POLICE LINE tape strip. */
  tape(ctx, w, h) {
    ctx.fillStyle = '#e3bd12';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111';
    ctx.font = `bold ${Math.round(h * 0.62)}px ${SANS}`;
    ctx.textBaseline = 'middle';
    for (let x = 8; x < w; x += h * 9.2) ctx.fillText('POLICE LINE  DO NOT CROSS', x, h * 0.54);
    ctx.textBaseline = 'alphabetic';
  },

  /** Night sea through a window: horizon glow and rain. Animated by scrolling. */
  rainGlass(ctx, w, h, rnd) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#16252f');
    g.addColorStop(0.55, '#22394a');
    g.addColorStop(1, '#0c151b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Distant harbour lights, smeared.
    for (let i = 0; i < 9; i++) {
      const x = rnd() * w;
      const y = h * (0.55 + rnd() * 0.2);
      const r = 6 + rnd() * 16;
      const glowG = ctx.createRadialGradient(x, y, 0, x, y, r);
      glowG.addColorStop(0, `rgba(${rnd() > 0.4 ? '255,196,120' : '150,200,220'},0.55)`);
      glowG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowG;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 140; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const len = 8 + rnd() * 40;
      ctx.strokeStyle = `rgba(190,215,230,${0.08 + rnd() * 0.22})`;
      ctx.lineWidth = 0.6 + rnd() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len * 0.08, y + len);
      ctx.stroke();
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(200,225,240,${0.15 + rnd() * 0.3})`;
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, 0.8 + rnd() * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /** Tide table / duty roster style ruled notice. */
  notice(ctx, w, h, rnd, opts = {}) {
    paperGround(ctx, w, h, rnd, '#dcd6c2');
    ctx.fillStyle = '#23201c';
    ctx.font = `${Math.round(h * 0.09)}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.fillText(opts.title ?? 'NOTICE', w / 2, h * 0.14, w * 0.9);
    ctx.textAlign = 'left';
    typedLines(ctx, w * 0.1, h * 0.24, w * 0.8, 11, h * 0.06, rnd);
  },
};

export const FONTS = { SERIF, TYPE, SANS, MONO };
