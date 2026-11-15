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
  /** A sea chart: coastline, soundings, compass rose, a spit with rocks off it. */
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
    // The spit and the rocks off it.
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
    ctx.fillText('THE ESTUARY AT RAVEL', w * 0.34, h * 0.12);
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
   * 'couple' | 'mother' | 'desk' | 'harbor' | 'portrait'
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
    } else if (kind === 'mother') {
      // A woman laughing at the camera, with a small child on her hip.
      figure(w * 0.44, h * 1.0, h * 0.3, 'long');
      figure(w * 0.67, h * 0.72, h * 0.13, 'short');
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(3, h * 0.035);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.66);
      ctx.quadraticCurveTo(w * 0.62, h * 0.8, w * 0.74, h * 0.7);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(32,24,16,0.7)';
      ctx.lineWidth = Math.max(1.5, h * 0.012);
      ctx.beginPath();
      ctx.arc(w * 0.44, h * 0.445, h * 0.045, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else if (kind === 'desk') {
      // A woman at a desk heaped with paper, pointing at the page; a young man at her elbow, reading it.
      ctx.fillStyle = 'rgba(214,198,168,0.16)';
      ctx.fillRect(w * 0.06, h * 0.1, w * 0.3, h * 0.34);
      ctx.strokeStyle = 'rgba(32,24,16,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.06, h * 0.1, w * 0.3, h * 0.34);
      ctx.beginPath();
      ctx.moveTo(w * 0.21, h * 0.1);
      ctx.lineTo(w * 0.21, h * 0.44);
      ctx.moveTo(w * 0.06, h * 0.27);
      ctx.lineTo(w * 0.36, h * 0.27);
      ctx.stroke();
      figure(w * 0.7, h * 0.8, h * 0.25, 'short');
      figure(w * 0.42, h * 0.8, h * 0.21, 'long');
      ctx.fillStyle = ink;
      ctx.fillRect(w * 0.04, h * 0.74, w * 0.92, h * 0.07);
      ctx.fillRect(w * 0.08, h * 0.81, w * 0.05, h * 0.19);
      ctx.fillRect(w * 0.87, h * 0.81, w * 0.05, h * 0.19);
      ctx.fillStyle = pale;
      for (const [x, n] of [[0.1, 4], [0.24, 2], [0.78, 5]]) for (let i = 0; i < n; i++) ctx.fillRect(w * x + (i % 2) * 3, h * (0.725 - i * 0.018), w * 0.12, h * 0.014);
      ctx.save();
      ctx.translate(w * 0.56, h * 0.725);
      ctx.rotate(-0.08);
      ctx.fillRect(-w * 0.07, -h * 0.012, w * 0.14, h * 0.02);
      ctx.restore();
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(3, h * 0.03);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.47, h * 0.6);
      ctx.lineTo(w * 0.56, h * 0.71);
      ctx.moveTo(w * 0.66, h * 0.6);
      ctx.lineTo(w * 0.6, h * 0.71);
      ctx.stroke();
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
    ctx.fillText('THE RAVEL COURIER', w / 2, h * 0.12, w * 0.92);
    ctx.fillRect(w * 0.05, h * 0.15, w * 0.9, 3);
    ctx.font = `bold ${Math.round(h * 0.085)}px ${SERIF}`;
    ctx.fillText(opts.headline ?? 'FERRY RIDDLE UNANSWERED A THIRD WEEK', w / 2, h * 0.26, w * 0.9);
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

// ---------------------------------------------------------------------------
// The Fold: slates, carved stone, painted boards, portraits, two-handed clock
// faces, crosswords, the Crux, plans, cipher wheels and the rest of what a
// town of puzzle-makers hangs on its walls. Used by props3.js.

const HAND = '"Segoe Print", "Bradley Hand", "Comic Sans MS", "Marker Felt", cursive';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Lines of text centred in a box, each scaled down to fit the width. */
function centredLines(ctx, lines, x, y, w, h, font, { lead = 1.25, max = 0.3, weight = '' } = {}) {
  const n = lines.length;
  let size = Math.min((h / (n * lead)) | 0, h * max);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${size}px ${font}`;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
  if (widest > w) size = Math.floor((size * w) / widest);
  ctx.font = `${weight} ${size}px ${font}`;
  const top = y + h / 2 - ((n - 1) * size * lead) / 2;
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, top + i * size * lead));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return size;
}

/** A crossword grid: symmetrical blocks, clue numbers, some lights filled in by hand. */
function crosswordGrid(ctx, x, y, size, n, rnd, { filled = 0.4, ink = '#1a1816', paper = '#f1ecdc', hand = 'rgba(30,40,110,0.85)' } = {}) {
  const cell = size / n;
  const black = new Set();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const lattice = r % 2 === 1 && c % 2 === 1;
      if (lattice || rnd() < 0.07) {
        black.add(r * n + c);
        black.add((n - 1 - r) * n + (n - 1 - c));
      }
    }
  }
  ctx.fillStyle = paper;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = ink;
  for (const k of black) ctx.fillRect(x + (k % n) * cell, y + Math.floor(k / n) * cell, cell + 0.5, cell + 0.5);
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, size / 260);
  for (let i = 0; i <= n; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * cell, y);
    ctx.lineTo(x + i * cell, y + size);
    ctx.moveTo(x, y + i * cell);
    ctx.lineTo(x + size, y + i * cell);
    ctx.stroke();
  }
  if (filled > 0 && cell > 7) {
    ctx.fillStyle = hand;
    ctx.font = `${Math.round(cell * 0.72)}px ${HAND}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < n; r++) {
      const rowOn = rnd() < filled * 1.4;
      for (let c = 0; c < n; c++) {
        if (black.has(r * n + c) || !(rowOn || rnd() < filled * 0.35)) continue;
        ctx.fillText(ALPHABET[Math.floor(rnd() * 26)], x + (c + 0.5) * cell, y + (r + 0.56) * cell);
      }
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

/** Something written in chalk: soft, broken, never quite white. */
function chalk(ctx, w, h, rnd, draw) {
  ctx.save();
  ctx.fillStyle = 'rgba(232,230,220,0.92)';
  ctx.strokeStyle = 'rgba(232,230,220,0.9)';
  ctx.lineCap = 'round';
  draw();
  ctx.restore();
  // Rub some of it away again.
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < (w * h) / 26; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.1 + rnd() * 0.5})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.6, 1 + rnd() * 1.6);
  }
  ctx.restore();
}

function slateGround(ctx, w, h, rnd, base = '#23292b') {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 22; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = Math.max(w, h) * (0.12 + rnd() * 0.3);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(210,215,210,${0.03 + rnd() * 0.07})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.strokeStyle = 'rgba(220,222,214,0.05)';
  ctx.lineWidth = Math.max(4, h * 0.05);
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    const y = rnd() * h;
    ctx.moveTo(-10, y);
    ctx.quadraticCurveTo(w / 2, y + (rnd() - 0.5) * h * 0.3, w + 10, y + (rnd() - 0.5) * h * 0.2);
    ctx.stroke();
  }
}

/** Chalk writing drawn onto its own layer, so rubbing it does not rub the slate. */
function chalkLayer(ctx, w, h, rnd, draw) {
  const layer = document.createElement('canvas');
  layer.width = w;
  layer.height = h;
  const c = layer.getContext('2d');
  chalk(c, w, h, rnd, () => draw(c));
  ctx.drawImage(layer, 0, 0);
}

Object.assign(ART, {
  /** A chalk slate. opts.lines: what is chalked on it; opts.small: a smaller note under it. */
  slate(ctx, w, h, rnd, opts = {}) {
    slateGround(ctx, w, h, rnd);
    chalkLayer(ctx, w, h, rnd, (c) => {
      const lines = opts.lines ?? ['—'];
      const room = opts.small ? h * 0.62 : h * 0.84;
      centredLines(c, lines, w * 0.08, h * 0.08, w * 0.84, room, SANS, { weight: '700', max: opts.max ?? 0.42 });
      if (opts.small) {
        c.globalAlpha = 0.8;
        centredLines(c, [].concat(opts.small), w * 0.08, h * 0.72, w * 0.84, h * 0.2, HAND, { max: 0.5 });
      }
    });
  },

  /** A stone tablet with letters cut into it. opts.lines */
  carved(ctx, w, h, rnd, opts = {}) {
    ctx.fillStyle = opts.bg ?? '#8f8a7c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = Math.max(w, h) * (0.05 + rnd() * 0.25);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rnd() > 0.5 ? '40,36,28' : '225,220,200'},${0.05 + rnd() * 0.08})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    for (let i = 0; i < (w * h) / 40; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? '30,28,22' : '235,230,215'},${rnd() * 0.16})`;
      ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    const lines = opts.lines ?? [''];
    const cut = (dx, dy, style) => {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.fillStyle = style;
      centredLines(ctx, lines, w * 0.09, h * 0.14, w * 0.82, h * 0.72, SERIF, { max: 0.3, lead: 1.4 });
      ctx.restore();
    };
    const d = Math.max(1.5, h * 0.008);
    cut(d, d, 'rgba(244,240,226,0.8)');
    cut(-d * 0.7, -d * 0.7, 'rgba(12,10,8,0.85)');
    cut(0, 0, '#26231e');
    // A cut border, lit the same way.
    const m = h * 0.07;
    ctx.lineWidth = d * 1.6;
    ctx.strokeStyle = 'rgba(240,236,222,0.6)';
    ctx.strokeRect(m + d, m + d, w - m * 2, h - m * 2);
    ctx.strokeStyle = '#3d3a33';
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  },

  /** A painted board with several lines of lettering. opts.lines, opts.bg, opts.fg */
  board(ctx, w, h, rnd, opts = {}) {
    ctx.fillStyle = opts.bg ?? '#1d2b27';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const y = rnd() * h;
      ctx.strokeStyle = `rgba(${rnd() > 0.5 ? '0,0,0' : '255,240,210'},${0.02 + rnd() * 0.06})`;
      ctx.lineWidth = 0.6 + rnd() * 1.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (rnd() - 0.5) * 6, w * 0.7, y + (rnd() - 0.5) * 6, w, y);
      ctx.stroke();
    }
    const fg = opts.fg ?? '#d9b869';
    ctx.strokeStyle = fg;
    ctx.lineWidth = Math.max(2, h * 0.022);
    const m = h * 0.07;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.lineWidth = Math.max(1, h * 0.008);
    ctx.strokeRect(m * 1.6, m * 1.6, w - m * 3.2, h - m * 3.2);
    ctx.fillStyle = fg;
    const lines = opts.lines ?? [''];
    centredLines(ctx, lines, w * 0.1, h * 0.16, w * 0.8, h * 0.68, SERIF, { max: opts.max ?? 0.34, lead: 1.42 });
    // Worn paint.
    for (let i = 0; i < (w * h) / 180; i++) {
      ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.22})`;
      ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
    }
  },

  /**
   * An oil portrait, head and shoulders. opts.coat, opts.hair, opts.style ('bun' | 'short' | 'bald' | 'wig' | 'long'),
   * opts.skin, opts.collar, opts.old (0..1), opts.ground
   */
  portrait(ctx, w, h, rnd, opts = {}) {
    const coat = opts.coat ?? '#2a2f3a';
    const hair = opts.hair ?? '#3a2a1e';
    const skin = opts.skin ?? '#c99f84';
    const style = opts.style ?? 'short';
    const old = opts.old ?? 0.4;
    // Ground: umber, with a glow behind the lit side of the head.
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, opts.ground ?? '#3a3024');
    bg.addColorStop(1, '#14100c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * 0.34, h * 0.36, 0, w * 0.34, h * 0.36, w * 0.75);
    glow.addColorStop(0, 'rgba(150,120,80,0.42)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.37;
    const rx = w * 0.17;
    const ry = h * 0.165;
    const shade = (x0, x1, a) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, 'rgba(255,236,200,0.16)');
      g.addColorStop(0.5, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(20,10,4,${a})`);
      return g;
    };
    // Hair that falls behind the shoulders.
    ctx.fillStyle = hair;
    if (style === 'long' || style === 'wig') {
      ctx.beginPath();
      ctx.ellipse(cx, cy + ry * 0.35, rx * 1.5, ry * 1.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (style === 'bun') {
      ctx.beginPath();
      ctx.ellipse(cx + rx * 0.25, cy - ry * 1.12, rx * 0.5, ry * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Shoulders and coat.
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(w * 0.04, h);
      ctx.bezierCurveTo(w * 0.06, h * 0.72, w * 0.26, h * 0.64, w * 0.4, h * 0.6);
      ctx.lineTo(w * 0.6, h * 0.6);
      ctx.bezierCurveTo(w * 0.74, h * 0.64, w * 0.94, h * 0.72, w * 0.96, h);
      ctx.closePath();
    };
    ctx.fillStyle = coat;
    body();
    ctx.fill();
    ctx.fillStyle = shade(w * 0.05, w * 0.95, 0.5);
    body();
    ctx.fill();
    // Shirt front or collar in the V of the coat.
    ctx.fillStyle = opts.collar ?? '#d8d0bc';
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.62, h * 0.6);
    ctx.lineTo(cx + rx * 0.62, h * 0.6);
    ctx.lineTo(cx + rx * 0.1, h * 0.8);
    ctx.lineTo(cx - rx * 0.1, h * 0.8);
    ctx.closePath();
    ctx.fill();
    // Lapels.
    ctx.strokeStyle = 'rgba(10,6,4,0.55)';
    ctx.lineWidth = Math.max(2, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.66, h * 0.6);
    ctx.lineTo(cx - rx * 0.1, h * 0.82);
    ctx.lineTo(cx - rx * 1.1, h * 0.74);
    ctx.moveTo(cx + rx * 0.66, h * 0.6);
    ctx.lineTo(cx + rx * 0.1, h * 0.82);
    ctx.lineTo(cx + rx * 1.1, h * 0.74);
    ctx.stroke();
    if (opts.chain) {
      // A chain of office.
      ctx.strokeStyle = '#c9a44e';
      ctx.lineWidth = Math.max(2, w * 0.014);
      ctx.setLineDash([w * 0.02, w * 0.012]);
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.7);
      ctx.quadraticCurveTo(cx, h * 1.0, w * 0.76, h * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Neck, then the head over it.
    ctx.fillStyle = skin;
    ctx.fillRect(cx - rx * 0.42, cy + ry * 0.6, rx * 0.84, ry * 0.95);
    ctx.fillStyle = 'rgba(40,20,10,0.35)';
    ctx.fillRect(cx - rx * 0.42, cy + ry * 0.86, rx * 0.84, ry * 0.3);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(cx - rx, cx + rx, 0.5);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // Colour in the cheeks.
    for (const s of [-1, 1]) {
      const g = ctx.createRadialGradient(cx + s * rx * 0.5, cy + ry * 0.3, 0, cx + s * rx * 0.5, cy + ry * 0.3, rx * 0.4);
      g.addColorStop(0, 'rgba(170,70,50,0.28)');
      g.addColorStop(1, 'rgba(170,70,50,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    }
    // Hair over the brow.
    ctx.fillStyle = hair;
    if (style === 'bald') {
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + s * rx * 0.95, cy - ry * 0.05, rx * 0.2, ry * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(cx, cy - ry * 0.45, rx * 1.08, ry * 0.72, 0, Math.PI, Math.PI * 2);
      ctx.bezierCurveTo(cx + rx * 0.9, cy - ry * 0.72, cx + rx * 0.2, cy - ry * 0.86, cx - rx * 0.1, cy - ry * 0.62);
      ctx.bezierCurveTo(cx - rx * 0.5, cy - ry * 0.52, cx - rx * 0.95, cy - ry * 0.5, cx - rx * 1.08, cy - ry * 0.45);
      ctx.fill();
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + s * rx * 1.0, cy - ry * 0.12, rx * 0.16, ry * (style === 'short' ? 0.4 : 0.62), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (style === 'wig') {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(cx + (i < 3 ? -1 : 1) * rx * 1.25, cy + ry * (0.1 + (i % 3) * 0.45), rx * 0.26, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // The face: brows, eyes, the shadow down the nose, a mouth.
    const ink = 'rgba(40,22,14,0.85)';
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      const ex = cx + s * rx * 0.42;
      const ey = cy - ry * 0.08;
      ctx.lineWidth = Math.max(1.5, w * 0.012);
      ctx.beginPath();
      ctx.moveTo(ex - rx * 0.2, ey - ry * 0.16);
      ctx.quadraticCurveTo(ex, ey - ry * 0.24, ex + rx * 0.2, ey - ry * 0.15);
      ctx.stroke();
      ctx.fillStyle = 'rgba(235,225,205,0.9)';
      ctx.beginPath();
      ctx.ellipse(ex, ey, rx * 0.15, ry * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(ex + rx * 0.02, ey, ry * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = Math.max(1, w * 0.007);
      ctx.beginPath();
      ctx.moveTo(ex - rx * 0.17, ey - ry * 0.02);
      ctx.quadraticCurveTo(ex, ey - ry * 0.1, ex + rx * 0.17, ey - ry * 0.01);
      ctx.stroke();
      if (old > 0.3) {
        ctx.strokeStyle = `rgba(60,34,22,${old * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(ex - rx * 0.16, ey + ry * 0.12);
        ctx.quadraticCurveTo(ex, ey + ry * 0.18, ex + rx * 0.16, ey + ry * 0.1);
        ctx.stroke();
        ctx.strokeStyle = ink;
      }
    }
    ctx.strokeStyle = 'rgba(70,36,22,0.6)';
    ctx.lineWidth = Math.max(1.5, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(cx + rx * 0.06, cy - ry * 0.1);
    ctx.quadraticCurveTo(cx + rx * 0.16, cy + ry * 0.22, cx + rx * 0.1, cy + ry * 0.3);
    ctx.quadraticCurveTo(cx, cy + ry * 0.36, cx - rx * 0.1, cy + ry * 0.31);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,44,40,0.85)';
    ctx.lineWidth = Math.max(1.5, w * 0.014);
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.26, cy + ry * 0.56);
    ctx.quadraticCurveTo(cx, cy + ry * (0.6 + (opts.smile ?? 0.02)), cx + rx * 0.26, cy + ry * 0.55);
    ctx.stroke();
    if (old > 0.3) {
      ctx.strokeStyle = `rgba(60,34,22,${old * 0.45})`;
      ctx.lineWidth = Math.max(1, w * 0.007);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * rx * 0.22, cy + ry * 0.24);
        ctx.quadraticCurveTo(cx + s * rx * 0.4, cy + ry * 0.42, cx + s * rx * 0.36, cy + ry * 0.62);
        ctx.stroke();
      }
    }
    if (opts.glasses) {
      ctx.strokeStyle = 'rgba(20,16,12,0.8)';
      ctx.lineWidth = Math.max(1, w * 0.008);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + s * rx * 0.42, cy - ry * 0.06, rx * 0.26, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.16, cy - ry * 0.08);
      ctx.lineTo(cx + rx * 0.16, cy - ry * 0.08);
      ctx.stroke();
    }
    // Brushwork, old varnish, and the dark of the corners.
    for (let i = 0; i < 500; i++) {
      ctx.strokeStyle = `rgba(${rnd() > 0.5 ? '255,235,200' : '20,10,0'},${0.02 + rnd() * 0.05})`;
      ctx.lineWidth = 1 + rnd() * 2;
      const x = rnd() * w;
      const y = rnd() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 14, y + (rnd() - 0.5) * 14);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(110,74,20,0.16)';
    ctx.fillRect(0, 0, w, h);
    const v = ctx.createRadialGradient(cx, h * 0.45, h * 0.25, cx, h * 0.5, h * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(8,5,2,0.72)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  },

  /**
   * A Fold clock face: the hour hand, and two minute hands eleven minutes apart
   * (black for the Fold's own time, red for Greenwich). opts.time "HH:MM" is Fold time.
   */
  clock2(ctx, w, h, _rnd, opts = {}) {
    const r = w / 2;
    const brass = opts.face === 'brass';
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(r * 0.8, r * 0.7, r * 0.1, r, r, r);
    g.addColorStop(0, brass ? '#e2c377' : '#f1ead6');
    g.addColorStop(1, brass ? '#a8873c' : '#d2c7a8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(r, r, r * 0.985, 0, Math.PI * 2);
    ctx.fill();
    const ink = brass ? '#2b1f0a' : '#1c1a18';
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = Math.max(1.5, w * 0.008);
    ctx.beginPath();
    ctx.arc(r, r, r * 0.93, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r, r, r * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 60; i++) {
      const a = (i * Math.PI) / 30;
      ctx.lineWidth = i % 5 === 0 ? Math.max(2, w * 0.016) : Math.max(1, w * 0.005);
      ctx.beginPath();
      ctx.moveTo(r + Math.cos(a) * r * 0.8, r + Math.sin(a) * r * 0.8);
      ctx.lineTo(r + Math.cos(a) * r * 0.93, r + Math.sin(a) * r * 0.93);
      ctx.stroke();
    }
    const numerals = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ctx.font = `${Math.round(r * 0.19)}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    numerals.forEach((num, i) => {
      const a = (i * Math.PI) / 6;
      ctx.save();
      ctx.translate(r + Math.sin(a) * r * 0.64, r - Math.cos(a) * r * 0.64);
      ctx.rotate(a);
      ctx.fillText(num, 0, 0);
      ctx.restore();
    });
    const [hh, mm] = (opts.time ?? '10:10').split(':').map(Number);
    const hand = (angle, len, width, colour, tail = 0.12) => {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r - Math.sin(angle) * r * tail, r + Math.cos(angle) * r * tail);
      ctx.lineTo(r + Math.sin(angle) * len, r - Math.cos(angle) * len);
      ctx.stroke();
    };
    hand((((hh % 12) + mm / 60) * Math.PI) / 6, r * 0.46, w * 0.034, ink);
    // Greenwich runs eleven minutes ahead of the Fold.
    hand(((mm + 11) * Math.PI) / 30, r * 0.76, w * 0.014, '#9c2a20', 0.2);
    hand((mm * Math.PI) / 30, r * 0.74, w * 0.022, ink);
    ctx.fillStyle = brass ? '#5a4416' : '#8f7436';
    ctx.beginPath();
    ctx.arc(r, r, w * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  /** A crossword on paper. opts.kind: 'grid' (the grid alone), 'page' (grid and clues), opts.filled 0..1, opts.title */
  crossword(ctx, w, h, rnd, opts = {}) {
    paperGround(ctx, w, h, rnd, opts.bg ?? '#ebe5d3');
    const page = (opts.kind ?? 'page') === 'page';
    const size = page ? Math.min(w * 0.56, h * 0.6) : Math.min(w, h) * 0.86;
    const gx = page ? w * 0.07 : (w - size) / 2;
    const gy = page ? h * 0.17 : (h - size) / 2;
    if (page) {
      ctx.fillStyle = '#1a1816';
      ctx.font = `${Math.round(h * 0.06)}px ${SERIF}`;
      ctx.fillText(opts.title ?? 'CROSSWORD No. 4,118', w * 0.07, h * 0.1, w * 0.86);
      ctx.fillRect(w * 0.07, h * 0.125, w * 0.86, 2);
      typedLines(ctx, gx + size + w * 0.04, h * 0.18, w * 0.86 - size - w * 0.04, 22, h * 0.027, rnd, 'rgba(30,26,22,0.6)');
      typedLines(ctx, w * 0.07, gy + size + h * 0.04, w * 0.86, Math.floor((h * 0.9 - gy - size) / (h * 0.027)), h * 0.027, rnd, 'rgba(30,26,22,0.6)');
    }
    crosswordGrid(ctx, gx, gy, size, opts.n ?? 13, rnd, { filled: opts.filled ?? 0.5 });
    if (opts.red) {
      // An editor's pencil.
      ctx.strokeStyle = 'rgba(170,30,26,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(gx + size * 0.6, gy + size * 0.3, size * 0.22, size * 0.07, -0.1, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  /** The Crux, the Fold's newspaper. opts.headline; opts.puzzle puts the crossword on the page. */
  crux(ctx, w, h, rnd, opts = {}) {
    paperGround(ctx, w, h, rnd, '#d3ccb9');
    ctx.fillStyle = '#1a1816';
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(h * 0.11)}px ${SERIF}`;
    ctx.fillText('THE CRUX', w / 2, h * 0.115, w * 0.9);
    ctx.fillRect(w * 0.05, h * 0.135, w * 0.9, 3);
    ctx.font = `${Math.round(h * 0.022)}px ${SERIF}`;
    ctx.fillText('PRINTED IN THE FOLD · FOLD TIME · ONE ANSWER', w / 2, h * 0.165, w * 0.9);
    ctx.fillRect(w * 0.05, h * 0.175, w * 0.9, 1);
    ctx.font = `bold ${Math.round(h * 0.07)}px ${SERIF}`;
    ctx.fillText(opts.headline ?? 'DEATH IN NONESUCH ROW', w / 2, h * 0.255, w * 0.9);
    ctx.textAlign = 'left';
    if (opts.puzzle !== false) {
      const size = w * 0.4;
      crosswordGrid(ctx, w * 0.54, h * 0.31, size, 13, rnd, { filled: opts.filled ?? 0, paper: '#e4dec9' });
      typedLines(ctx, w * 0.54, h * 0.33 + size, w * 0.4, Math.floor((h * 0.62 - size) / (h * 0.03)), h * 0.03, rnd, 'rgba(30,26,22,0.6)');
      typedLines(ctx, w * 0.06, h * 0.32, w * 0.42, 20, h * 0.031, rnd, 'rgba(30,26,22,0.62)');
    } else {
      ctx.fillStyle = 'rgba(60,55,48,0.6)';
      ctx.fillRect(w * 0.06, h * 0.31, w * 0.4, h * 0.24);
      typedLines(ctx, w * 0.06, h * 0.59, w * 0.4, 11, h * 0.031, rnd, 'rgba(30,26,22,0.62)');
      typedLines(ctx, w * 0.54, h * 0.32, w * 0.4, 20, h * 0.031, rnd, 'rgba(30,26,22,0.62)');
    }
  },

  /** A surveyor's plan of the Fold: six crooked lanes inside the city wall, the Cut along one side. */
  plan(ctx, w, h, rnd, opts = {}) {
    paperGround(ctx, w, h, rnd, opts.bg ?? '#d9cfae');
    const ink = '#3a2f20';
    // The Cut.
    ctx.strokeStyle = 'rgba(70,120,140,0.5)';
    ctx.lineWidth = h * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, h * 0.86);
    ctx.bezierCurveTo(w * 0.3, h * 0.8, w * 0.62, h * 0.95, w + 10, h * 0.8);
    ctx.stroke();
    // The wall round the Fold.
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(2, h * 0.012);
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.72);
    ctx.bezierCurveTo(w * 0.05, h * 0.4, w * 0.2, h * 0.12, w * 0.5, h * 0.13);
    ctx.bezierCurveTo(w * 0.82, h * 0.12, w * 0.95, h * 0.42, w * 0.87, h * 0.7);
    ctx.stroke();
    // Six lanes, none of them straight, meeting at the Hall.
    const hall = [w * 0.5, h * 0.44];
    const ends = [[0.14, 0.66], [0.2, 0.26], [0.44, 0.15], [0.72, 0.2], [0.86, 0.5], [0.6, 0.74]];
    ctx.lineWidth = Math.max(5, h * 0.03);
    ctx.strokeStyle = '#efe6c8';
    // Each lane doglegs twice on its way out: no two points in the Fold can see each other.
    const lanes = ends.map(([ex, ey]) => {
      const dx = ex * w - hall[0];
      const dy = ey * h - hall[1];
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;
      const k1 = (rnd() < 0.5 ? -1 : 1) * len * (0.12 + rnd() * 0.1);
      const k2 = -k1 * (0.6 + rnd() * 0.5);
      return [hall, [hall[0] + dx * 0.36 + nx * k1, hall[1] + dy * 0.36 + ny * k1], [hall[0] + dx * 0.7 + nx * k2, hall[1] + dy * 0.7 + ny * k2], [ex * w, ey * h]];
    });
    ctx.lineJoin = 'round';
    for (const pass of [0, 1]) {
      for (const pts of lanes) {
        ctx.lineWidth = pass ? Math.max(4, h * 0.026) : Math.max(6, h * 0.036);
        ctx.strokeStyle = pass ? '#efe6c8' : ink;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      }
    }
    // Houses along the lanes.
    ctx.fillStyle = 'rgba(120,70,50,0.55)';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    for (const pts of lanes) {
      for (let t = 0.14; t < 0.97; t += 0.07) {
        const seg = Math.min(2, Math.floor(t * 3));
        const u = t * 3 - seg;
        const x = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * u;
        const y = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * u;
        for (const s of [-1, 1]) {
          const bw = w * (0.02 + rnd() * 0.022);
          const bh = h * (0.03 + rnd() * 0.03);
          ctx.save();
          ctx.translate(x + s * h * 0.045, y + s * h * 0.03);
          ctx.rotate((rnd() - 0.5) * 1.2);
          ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
          ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
          ctx.restore();
        }
      }
    }
    // The Hall, with its lantern.
    ctx.fillStyle = '#7a3a2a';
    ctx.fillRect(hall[0] - w * 0.04, hall[1] - h * 0.045, w * 0.08, h * 0.09);
    ctx.strokeRect(hall[0] - w * 0.04, hall[1] - h * 0.045, w * 0.08, h * 0.09);
    ctx.fillStyle = '#e0c060';
    ctx.beginPath();
    ctx.arc(hall[0], hall[1], h * 0.018, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Border, title, compass.
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.03, h * 0.04, w * 0.94, h * 0.92);
    ctx.lineWidth = 1;
    ctx.strokeRect(w * 0.04, h * 0.055, w * 0.92, h * 0.89);
    ctx.fillStyle = ink;
    ctx.font = `${Math.round(h * 0.075)}px ${SERIF}`;
    ctx.fillText(opts.title ?? 'THE FOLD', w * 0.07, h * 0.15);
    ctx.font = `${Math.round(h * 0.03)}px ${SERIF}`;
    ctx.fillText('SURVEYED IN FOLD TIME', w * 0.07, h * 0.195);
    ctx.fillText("SETTERS' HALL", hall[0] + w * 0.05, hall[1] + h * 0.01);
    ctx.fillText('THE CUT', w * 0.42, h * 0.875);
    const cx = w * 0.87;
    const cy = h * 0.17;
    const r = h * 0.07;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const len = i % 2 === 0 ? r * 1.3 : r * 0.7;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }
  },

  /** A guild certificate: ornamental border, a heading, lines of copperplate, a red seal. */
  certificate(ctx, w, h, rnd, opts = {}) {
    paperGround(ctx, w, h, rnd, '#e6dcc0');
    const ink = '#2a2218';
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(2, w * 0.012);
    ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);
    ctx.lineWidth = 1;
    ctx.strokeRect(w * 0.07, h * 0.07, w * 0.86, h * 0.86);
    for (const [x, y] of [[0.07, 0.07], [0.93, 0.07], [0.07, 0.93], [0.93, 0.93]]) {
      ctx.beginPath();
      ctx.arc(w * x, h * y, w * 0.035, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = ink;
    centredLines(ctx, opts.lines ?? ['THE WORSHIPFUL COMPANY', 'OF SETTERS AND SOLVERS'], w * 0.12, h * 0.12, w * 0.76, h * 0.2, SERIF, { max: 0.45 });
    ctx.fillStyle = 'rgba(42,34,24,0.75)';
    centredLines(ctx, [opts.sub ?? 'ADMITS TO THE FREEDOM OF THE FOLD'], w * 0.14, h * 0.33, w * 0.72, h * 0.06, SERIF, { max: 0.9 });
    ctx.strokeStyle = 'rgba(30,30,70,0.75)';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 6; i++) {
      const y = h * (0.47 + i * 0.055);
      ctx.beginPath();
      ctx.moveTo(w * 0.16, y);
      const end = i === 5 ? 0.5 : 0.84;
      for (let x = 0.16; x < end; x += 0.012) ctx.lineTo(w * x, y + Math.sin(x * 90 + i) * h * 0.006 + (rnd() - 0.5) * h * 0.008);
      ctx.stroke();
    }
    // Seal and ribbon.
    ctx.fillStyle = '#2f4a6a';
    ctx.fillRect(w * 0.7, h * 0.76, w * 0.04, h * 0.14);
    ctx.fillRect(w * 0.76, h * 0.76, w * 0.04, h * 0.12);
    ctx.fillStyle = '#9c2a20';
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const rr = w * (0.075 + (i % 2) * 0.008);
      ctx.lineTo(w * 0.75 + Math.cos(a) * rr, h * 0.76 + Math.sin(a) * rr);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,10,8,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.76, w * 0.05, 0, Math.PI * 2);
    ctx.stroke();
  },

  /** The face of a cipher wheel: rings of the alphabet round a boss. opts.tone 'brass' | 'box', opts.rings, opts.shift */
  cipherDisc(ctx, w, h, rnd, opts = {}) {
    const r = w / 2;
    const brass = (opts.tone ?? 'brass') === 'brass';
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(r * 0.75, r * 0.7, r * 0.1, r, r, r);
    g.addColorStop(0, brass ? '#e0c070' : '#dcc594');
    g.addColorStop(1, brass ? '#9a7a34' : '#b89a62');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(r, r, r * 0.99, 0, Math.PI * 2);
    ctx.fill();
    const ink = brass ? '#2b1f0a' : '#3a2412';
    const rings = opts.rings ?? 2;
    const band = 0.2;
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let k = 0; k < rings; k++) {
      const outer = r * (0.96 - k * band);
      const inner = r * (0.96 - (k + 1) * band);
      const shift = k === 0 ? 0 : (opts.shift ?? 3) * k;
      if (k > 0 && !brass) {
        ctx.fillStyle = k % 2 ? 'rgba(255,240,200,0.18)' : 'rgba(60,30,10,0.1)';
        ctx.beginPath();
        ctx.arc(r, r, outer, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ink;
      }
      ctx.lineWidth = Math.max(1, w * 0.008);
      for (const rr of [outer, inner]) {
        ctx.beginPath();
        ctx.arc(r, r, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = `${Math.round((outer - inner) * 0.7)}px ${SERIF}`;
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        ctx.lineWidth = Math.max(1, w * 0.004);
        ctx.beginPath();
        ctx.moveTo(r + Math.sin(a + Math.PI / 26) * inner, r - Math.cos(a + Math.PI / 26) * inner);
        ctx.lineTo(r + Math.sin(a + Math.PI / 26) * outer, r - Math.cos(a + Math.PI / 26) * outer);
        ctx.stroke();
        ctx.save();
        ctx.translate(r + Math.sin(a) * (outer + inner) * 0.5, r - Math.cos(a) * (outer + inner) * 0.5);
        ctx.rotate(a);
        ctx.fillText(ALPHABET[(i + shift) % 26], 0, 0);
        ctx.restore();
      }
    }
    // The boss in the middle, and the pin it turns on.
    const boss = r * (0.96 - rings * band);
    const bg = ctx.createRadialGradient(r * 0.92, r * 0.9, 0, r, r, boss);
    bg.addColorStop(0, brass ? '#f0d68c' : '#c9a14a');
    bg.addColorStop(1, brass ? '#8f6f2c' : '#7a5a22');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(r, r, boss * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1408';
    ctx.beginPath();
    ctx.arc(r, r, boss * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  /**
   * The alphabet round the rim of a letter-lock ring. Drawn on its side: wrapped round a ring whose
   * axle runs left to right, every letter stands upright.
   */
  letterBand(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8f6f2c');
    g.addColorStop(0.18, '#d7b560');
    g.addColorStop(0.82, '#d7b560');
    g.addColorStop(1, '#8f6f2c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1f1606';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.6)}px ${SERIF}`;
    const step = w / 26;
    for (let i = 0; i < 26; i++) {
      ctx.fillRect(i * step, h * 0.12, 1.5, h * 0.76);
      ctx.save();
      ctx.translate((i + 0.5) * step, h / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(ALPHABET[i], 0, 0, h * 0.8);
      ctx.restore();
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  /** A demonstration slate: a chess position in chalk, and what is written beside it. opts.title, opts.lines */
  chessSlate(ctx, w, h, rnd, opts = {}) {
    slateGround(ctx, w, h, rnd);
    chalkLayer(ctx, w, h, rnd, (c) => {
      const size = Math.min(h * 0.8, w * 0.5);
      const x0 = w * 0.05;
      const y0 = (h - size) / 2 + h * 0.03;
      const cell = size / 8;
      c.lineWidth = Math.max(2, size * 0.008);
      c.strokeRect(x0, y0, size, size);
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          if ((r + f) % 2 === 0) continue;
          // Dark squares are hatched, the way a hand does it.
          c.lineWidth = Math.max(1, size * 0.004);
          for (let k = 1; k < 5; k++) {
            c.beginPath();
            c.moveTo(x0 + f * cell + (k * cell) / 5, y0 + r * cell);
            c.lineTo(x0 + f * cell, y0 + r * cell + (k * cell) / 5);
            c.moveTo(x0 + (f + 1) * cell, y0 + r * cell + (k * cell) / 5);
            c.lineTo(x0 + f * cell + (k * cell) / 5, y0 + (r + 1) * cell);
            c.stroke();
          }
        }
      }
      // A late endgame: few men left, the kings close.
      const men = opts.men ?? [['K', 5, 2, 1], ['P', 6, 1, 1], ['R', 0, 6, 1], ['K', 7, 0, 0], ['P', 7, 1, 0], ['B', 2, 3, 0]];
      c.font = `bold ${Math.round(cell * 0.6)}px ${SANS}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      for (const [man, f, r, white] of men) {
        const px = x0 + (f + 0.5) * cell;
        const py = y0 + (r + 0.5) * cell;
        c.globalCompositeOperation = 'destination-out';
        c.beginPath();
        c.arc(px, py, cell * 0.4, 0, Math.PI * 2);
        c.fill();
        c.globalCompositeOperation = 'source-over';
        c.lineWidth = Math.max(2, cell * 0.06);
        c.beginPath();
        c.arc(px, py, cell * 0.38, 0, Math.PI * 2);
        if (white) c.stroke();
        else c.fill();
        if (!white) c.globalCompositeOperation = 'destination-out';
        c.fillText(man, px, py + cell * 0.03);
        c.globalCompositeOperation = 'source-over';
      }
      c.font = `${Math.round(cell * 0.3)}px ${SANS}`;
      for (let i = 0; i < 8; i++) {
        c.fillText('abcdefgh'[i], x0 + (i + 0.5) * cell, y0 + size + cell * 0.28);
        c.fillText(String(8 - i), x0 - cell * 0.22, y0 + (i + 0.5) * cell);
      }
      c.textAlign = 'left';
      const tx = x0 + size + w * 0.05;
      const tw = w - tx - w * 0.04;
      c.font = `bold ${Math.round(h * 0.085)}px ${SANS}`;
      c.fillText(opts.title ?? 'THE DRAW', tx, h * 0.16, tw);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(tx, h * 0.22);
      c.lineTo(tx + tw, h * 0.23);
      c.stroke();
      const lines = opts.lines ?? ['WHITE TO PLAY', 'AND NOT TO WIN', '', '1. ?', '', 'ANSWERS TO', 'THE COUNTER'];
      c.font = `${Math.round(h * 0.062)}px ${HAND}`;
      lines.forEach((line, i) => c.fillText(line, tx, h * (0.33 + i * 0.085), tw));
    });
  },

  /**
   * A wall of puzzles: every sheet a different one, pinned over its neighbours.
   * opts.n how many; opts.ground the baize behind them (or 'none' for a clear ground)
   */
  tithe(ctx, w, h, rnd, opts = {}) {
    if (opts.ground === 'none') ctx.clearRect(0, 0, w, h);
    else {
      ctx.fillStyle = opts.ground ?? '#2c3a30';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < (w * h) / 60; i++) {
        ctx.fillStyle = `rgba(${rnd() > 0.5 ? '0,0,0' : '200,220,190'},${rnd() * 0.1})`;
        ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
      }
    }
    const n = opts.n ?? 34;
    const cols = Math.ceil(Math.sqrt((n * w) / h) * 1.05);
    const rows = Math.ceil(n / cols);
    const tones = ['#ece6d2', '#e2dac0', '#f0ead8', '#d9d0b4', '#e8e0c4'];
    for (let i = 0; i < n; i++) {
      const sw = (w / cols) * (0.8 + rnd() * 0.3);
      const sh = sw * (1.25 + rnd() * 0.2);
      const x = ((i % cols) + 0.5) * (w / cols) + (rnd() - 0.5) * (w / cols) * 0.3;
      const y = (Math.floor(i / cols) + 0.5) * (h / rows) + (rnd() - 0.5) * (h / rows) * 0.3;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rnd() - 0.5) * 0.22);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(-sw / 2 + 3, -sh / 2 + 4, sw, sh);
      ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      const kind = Math.floor(rnd() * 5);
      const inner = sw * 0.78;
      if (kind === 0 || kind === 1) {
        crosswordGrid(ctx, -inner / 2, -sh * 0.36, inner, kind ? 11 : 9, rnd, { filled: 0, paper: 'rgba(255,255,255,0.3)' });
        typedLines(ctx, -inner / 2, -sh * 0.36 + inner + sh * 0.05, inner, 3, sh * 0.05, rnd, 'rgba(40,36,30,0.55)');
      } else if (kind === 2) {
        // A cipher: letters in fives.
        ctx.fillStyle = 'rgba(30,26,22,0.8)';
        ctx.font = `${Math.round(sh * 0.062)}px ${MONO}`;
        for (let r = 0; r < 9; r++) {
          let line = '';
          for (let g = 0; g < 3; g++) {
            for (let k = 0; k < 5; k++) line += ALPHABET[Math.floor(rnd() * 26)];
            line += ' ';
          }
          ctx.fillText(line, -inner / 2, -sh * 0.3 + r * sh * 0.078, inner);
        }
      } else if (kind === 3) {
        // A number square.
        const m = 5;
        const c = inner / m;
        ctx.strokeStyle = 'rgba(30,26,22,0.8)';
        ctx.fillStyle = 'rgba(30,26,22,0.8)';
        ctx.lineWidth = 1.2;
        ctx.font = `${Math.round(c * 0.5)}px ${SERIF}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let r = 0; r < m; r++) {
          for (let q = 0; q < m; q++) {
            ctx.strokeRect(-inner / 2 + q * c, -sh * 0.34 + r * c, c, c);
            if (rnd() < 0.6) ctx.fillText(String(1 + Math.floor(rnd() * 25)), -inner / 2 + (q + 0.5) * c, -sh * 0.34 + (r + 0.55) * c);
          }
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      } else {
        // A maze, more or less.
        ctx.strokeStyle = 'rgba(30,26,22,0.8)';
        ctx.lineWidth = 1.4;
        const m = 8;
        const c = inner / m;
        ctx.strokeRect(-inner / 2, -sh * 0.36, inner, inner);
        ctx.beginPath();
        for (let r = 0; r < m; r++) {
          for (let q = 0; q < m; q++) {
            const px = -inner / 2 + q * c;
            const py = -sh * 0.36 + r * c;
            if (rnd() < 0.45) {
              ctx.moveTo(px, py);
              ctx.lineTo(px + c, py);
            }
            if (rnd() < 0.45) {
              ctx.moveTo(px, py);
              ctx.lineTo(px, py + c);
            }
          }
        }
        ctx.stroke();
      }
      // The pin, and now and then a red tick from whoever marked it.
      ctx.fillStyle = '#c9a14a';
      ctx.beginPath();
      ctx.arc(0, -sh / 2 + sh * 0.05, Math.max(2.5, sw * 0.03), 0, Math.PI * 2);
      ctx.fill();
      if (rnd() < 0.3) {
        ctx.strokeStyle = 'rgba(170,30,26,0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sw * 0.2, sh * 0.34);
        ctx.lineTo(sw * 0.27, sh * 0.42);
        ctx.lineTo(sw * 0.4, sh * 0.26);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  /** The Lectern's screen: a quiet page that waits to be asked. */
  lecternScreen(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0d2226');
    g.addColorStop(1, '#081417');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(190,235,225,0.95)';
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(h * 0.11)}px ${SERIF}`;
    ctx.fillText('THE LECTERN', w / 2, h * 0.2);
    ctx.fillStyle = 'rgba(150,215,205,0.6)';
    ctx.fillRect(w * 0.2, h * 0.26, w * 0.6, 2);
    ctx.font = `${Math.round(h * 0.055)}px ${SERIF}`;
    ctx.fillText('ASK, AND SHOW YOUR WORKING', w / 2, h * 0.36);
    ctx.textAlign = 'left';
    ctx.font = `${Math.round(h * 0.05)}px ${MONO}`;
    ctx.fillStyle = 'rgba(160,225,210,0.75)';
    const rows = ['> six centuries of papers indexed', '> 41,206 puzzles · 1 unanswered', '> _'];
    rows.forEach((row, i) => ctx.fillText(row, w * 0.1, h * (0.56 + i * 0.11), w * 0.8));
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  },

  /** A programmer's screen. */
  monitor(ctx, w, h, rnd) {
    ctx.fillStyle = '#12161c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1d232c';
    ctx.fillRect(0, 0, w, h * 0.07);
    const colours = ['#7fb4d8', '#c9a26a', '#9ccf8f', '#d88f8f', '#c0c5cc'];
    for (let i = 0; i < 26; i++) {
      let x = w * (0.04 + Math.floor(rnd() * 4) * 0.03);
      const y = h * (0.12 + i * 0.033);
      const end = w * (0.3 + rnd() * 0.6);
      while (x < end) {
        const len = 8 + rnd() * 40;
        ctx.fillStyle = colours[Math.floor(rnd() * colours.length)];
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x, y, Math.min(len, end - x), Math.max(2, h * 0.012));
        x += len + 6;
      }
    }
    ctx.globalAlpha = 1;
  },

  /** An inlaid chessboard. */
  chessboard(ctx, w, h, rnd) {
    ctx.fillStyle = '#3a2416';
    ctx.fillRect(0, 0, w, h);
    const m = w * 0.06;
    const cell = (w - m * 2) / 8;
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        ctx.fillStyle = (r + f) % 2 ? '#4a2e1c' : '#d8c08e';
        ctx.fillRect(m + f * cell, m + r * cell, cell + 0.5, cell + 0.5);
      }
    }
    ctx.strokeStyle = '#c9a14a';
    ctx.lineWidth = Math.max(1.5, w * 0.008);
    ctx.strokeRect(m - 2, m - 2, w - m * 2 + 4, h - m * 2 + 4);
    for (let i = 0; i < 400; i++) {
      ctx.strokeStyle = `rgba(${rnd() > 0.5 ? '0,0,0' : '255,240,210'},${0.02 + rnd() * 0.05})`;
      ctx.lineWidth = 1;
      const y = rnd() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (rnd() - 0.5) * 3);
      ctx.stroke();
    }
  },

  /** Sheets for a chart-seller's wall. opts.kind: 'canal' | 'stars' */
  mapSheet(ctx, w, h, rnd, opts = {}) {
    if (opts.kind === 'stars') {
      ctx.fillStyle = '#16233a';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(220,205,150,0.55)';
      ctx.lineWidth = 1;
      for (const rr of [0.2, 0.33, 0.45]) {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) * rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.lineTo(w / 2 + Math.cos(a) * Math.min(w, h) * 0.45, h / 2 + Math.sin(a) * Math.min(w, h) * 0.45);
        ctx.stroke();
      }
      const stars = [];
      for (let i = 0; i < 70; i++) {
        const a = rnd() * Math.PI * 2;
        const d = Math.sqrt(rnd()) * Math.min(w, h) * 0.44;
        stars.push([w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, 1 + rnd() * 2.6]);
      }
      ctx.strokeStyle = 'rgba(235,225,180,0.6)';
      ctx.beginPath();
      for (let i = 0; i < 40; i += 4) {
        ctx.moveTo(stars[i][0], stars[i][1]);
        for (let k = 1; k < 4; k++) ctx.lineTo(stars[i + k][0], stars[i + k][1]);
      }
      ctx.stroke();
      ctx.fillStyle = '#f2e6b0';
      for (const [x, y, s] of stars) {
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    paperGround(ctx, w, h, rnd, '#d6ceb0');
    // A canal, its locks, and the towns strung along it.
    ctx.strokeStyle = 'rgba(60,110,135,0.75)';
    ctx.lineWidth = Math.max(3, h * 0.02);
    ctx.lineCap = 'round';
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push([w * (0.08 + i * 0.105), h * (0.3 + rnd() * 0.45)]);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.quadraticCurveTo(pts[i - 1][0] + w * 0.05, pts[i - 1][1] + (rnd() - 0.5) * h * 0.2, pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.fillStyle = '#3a2f20';
    ctx.strokeStyle = '#3a2f20';
    ctx.lineWidth = 1.5;
    ctx.font = `${Math.round(h * 0.036)}px ${SERIF}`;
    pts.forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.arc(x, y, h * 0.014, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - h * 0.02, y - h * 0.035);
      ctx.lineTo(x + h * 0.02, y - h * 0.035);
      ctx.stroke();
      typedLines(ctx, x - w * 0.03, y + (i % 2 ? h * 0.05 : -h * 0.08), w * 0.07, 1, h * 0.03, rnd, 'rgba(58,47,32,0.7)');
    });
    ctx.strokeRect(w * 0.03, h * 0.05, w * 0.94, h * 0.9);
    ctx.font = `${Math.round(h * 0.075)}px ${SERIF}`;
    ctx.fillText(opts.title ?? 'THE CUT AND ITS LOCKS', w * 0.06, h * 0.16, w * 0.6);
  },

  /** Woven willow. */
  weave(ctx, w, h, rnd) {
    ctx.fillStyle = '#6b4a26';
    ctx.fillRect(0, 0, w, h);
    const cols = 16;
    const rows = 12;
    const cw = w / cols;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r + c) % 2) continue;
        const l = 44 + rnd() * 14;
        const g = ctx.createLinearGradient(0, r * rh, 0, (r + 1) * rh);
        g.addColorStop(0, `hsl(32, 46%, ${l - 14}%)`);
        g.addColorStop(0.45, `hsl(34, 50%, ${l + 6}%)`);
        g.addColorStop(1, `hsl(30, 44%, ${l - 18}%)`);
        ctx.fillStyle = g;
        ctx.fillRect(c * cw - cw * 0.5, r * rh + 1, cw * 2, rh - 2);
      }
    }
    ctx.fillStyle = 'rgba(40,24,8,0.55)';
    for (let c = 0; c < cols; c++) ctx.fillRect(c * cw + cw * 0.42, 0, cw * 0.16, h);
  },

  /** A garden seen at night through a window: dark leaves, and foxgloves standing up into the light. */
  garden(ctx, w, h, rnd) {
    ctx.clearRect(0, 0, w, h);
    // Leaves along the bottom.
    for (let i = 0; i < 170; i++) {
      const x = rnd() * w;
      const y = h * (0.5 + rnd() * rnd() * 0.56);
      ctx.fillStyle = `rgba(${10 + rnd() * 16},${24 + rnd() * 26},${14 + rnd() * 12},${0.8 + rnd() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(x, y, w * (0.03 + rnd() * 0.05), h * (0.03 + rnd() * 0.07), rnd() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Foxglove spires: a stem, and bells hung down one side, smaller toward the tip.
    const spires = 7;
    for (let i = 0; i < spires; i++) {
      const x = w * (0.08 + (i + rnd() * 0.5) * (0.86 / spires));
      const top = h * (0.1 + rnd() * 0.28);
      const base = h * 0.92;
      const lean = (rnd() - 0.5) * w * 0.05;
      ctx.strokeStyle = 'rgba(30,54,32,0.95)';
      ctx.lineWidth = Math.max(2, w * 0.007);
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x + lean, (base + top) / 2, x + lean * 1.4, top);
      ctx.stroke();
      const pale = rnd() < 0.3;
      const bells = 13;
      for (let b = 0; b < bells; b++) {
        const t = b / (bells - 1);
        const by = top + (base - top) * 0.62 * t + h * 0.012;
        const bx = x + lean * (1.4 - t * 0.9);
        const size = w * 0.014 * (0.5 + t * 0.9);
        for (const s of b % 2 ? [-1] : [1, -1]) {
          const lit = 86 + rnd() * 54;
          ctx.fillStyle = pale ? `rgba(${lit + 40},${lit + 26},${lit + 20},0.96)` : `rgba(${lit},${lit * 0.42 + rnd() * 12},${lit * 0.7},0.96)`;
          ctx.beginPath();
          ctx.ellipse(bx + s * size * 1.1, by, size, size * 1.5, s * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(40,8,28,0.55)';
          ctx.beginPath();
          ctx.ellipse(bx + s * size * 1.3, by + size * 1.1, size * 0.5, size * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  },

  /** A brass dial with numbered stations and one hand. opts.n, opts.at */
  dial(ctx, w, h, _rnd, opts = {}) {
    const r = w / 2;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(r * 0.8, r * 0.7, r * 0.1, r, r, r);
    g.addColorStop(0, '#f0ead8');
    g.addColorStop(1, '#cfc4a2');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(r, r, r * 0.98, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c1a18';
    ctx.fillStyle = '#1c1a18';
    ctx.lineWidth = Math.max(1.5, w * 0.012);
    ctx.beginPath();
    ctx.arc(r, r, r * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    const n = opts.n ?? 12;
    ctx.font = `${Math.round(r * 0.2)}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.fillText(String(i + 1), r + Math.sin(a) * r * 0.7, r - Math.cos(a) * r * 0.7);
    }
    const a = ((opts.at ?? 4) / n) * Math.PI * 2;
    ctx.strokeStyle = '#9c2a20';
    ctx.lineWidth = Math.max(2, w * 0.03);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.lineTo(r + Math.sin(a) * r * 0.56, r - Math.cos(a) * r * 0.56);
    ctx.stroke();
    ctx.fillStyle = '#8f7436';
    ctx.beginPath();
    ctx.arc(r, r, w * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  /** A page in a quick hand: workings, crossings-out, a line of capitals boxed. */
  handNotes(ctx, w, h, rnd, opts = {}) {
    paperGround(ctx, w, h, rnd, opts.bg ?? '#ece6d4');
    ctx.strokeStyle = 'rgba(28,32,70,0.8)';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 13; i++) {
      const y = h * (0.1 + i * 0.065);
      const x0 = w * (0.1 + (i % 4 === 3 ? 0.08 : 0));
      const end = w * (0.5 + rnd() * 0.4);
      ctx.beginPath();
      ctx.moveTo(x0, y);
      for (let x = x0; x < end; x += 3) ctx.lineTo(x, y + Math.sin(x * 0.5 + i) * h * 0.008 + (rnd() - 0.5) * h * 0.012);
      ctx.stroke();
      if (rnd() < 0.2) {
        ctx.beginPath();
        ctx.moveTo(x0, y - h * 0.004);
        ctx.lineTo(end * 0.8, y + h * 0.004);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(28,32,70,0.88)';
    ctx.font = `bold ${Math.round(h * 0.055)}px ${MONO}`;
    let caps = '';
    for (let k = 0; k < 7; k++) caps += ALPHABET[Math.floor(rnd() * 26)] + ' ';
    ctx.fillText(opts.caps ?? caps, w * 0.14, h * 0.955, w * 0.7);
    ctx.strokeRect(w * 0.1, h * 0.905, w * 0.74, h * 0.07);
  },

  /** A galley proof: one long column, and the reader's red marks down the margin. */
  proof(ctx, w, h, rnd) {
    paperGround(ctx, w, h, rnd, '#e9e4d6');
    typedLines(ctx, w * 0.2, h * 0.05, w * 0.6, 34, h * 0.026, rnd, 'rgba(30,26,22,0.72)');
    ctx.strokeStyle = 'rgba(170,30,26,0.85)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      const y = h * (0.08 + rnd() * 0.84);
      ctx.beginPath();
      ctx.moveTo(w * 0.86, y);
      ctx.lineTo(w * 0.93, y - h * 0.012);
      ctx.lineTo(w * 0.9, y + h * 0.014);
      ctx.moveTo(w * (0.3 + rnd() * 0.4), y);
      ctx.lineTo(w * 0.84, y);
      ctx.stroke();
    }
  },
});

export const FONTS = { SERIF, TYPE, SANS, MONO, HAND };
