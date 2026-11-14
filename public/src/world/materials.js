// Procedural materials. Every texture in the game is painted on a canvas at
// load time, so the project ships no image assets at all.

import * as THREE from 'three';

/** Small deterministic PRNG so textures look the same on every load. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rnd() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const textures = new Map();
const materials = new Map();

/**
 * @param {string} key
 * @param {number} size
 * @param {(ctx: CanvasRenderingContext2D, size: number, rnd: () => number) => void} draw
 * @param {{ srgb?: boolean, repeat?: boolean, w?: number, h?: number }} [opts]
 */
export function canvasTexture(key, size, draw, opts = {}) {
  if (textures.has(key)) return textures.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = opts.w ?? size;
  canvas.height = opts.h ?? size;
  const ctx = canvas.getContext('2d');
  let seed = 7;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) | 0;
  draw(ctx, size, mulberry32(seed));
  const tex = new THREE.CanvasTexture(canvas);
  if (opts.srgb !== false) tex.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat !== false) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  }
  tex.anisotropy = 4;
  textures.set(key, tex);
  return tex;
}

function speckle(ctx, s, rnd, count, alpha, light = true, dark = true) {
  for (let i = 0; i < count; i++) {
    const x = rnd() * s;
    const y = rnd() * s;
    const r = 0.5 + rnd() * 1.6;
    const isLight = light && (!dark || rnd() > 0.5);
    ctx.fillStyle = isLight ? `rgba(255,255,255,${alpha * rnd()})` : `rgba(0,0,0,${alpha * rnd()})`;
    ctx.fillRect(x, y, r, r);
  }
}

function blotches(ctx, s, rnd, count, alpha) {
  for (let i = 0; i < count; i++) {
    const x = rnd() * s;
    const y = rnd() * s;
    const r = s * (0.05 + rnd() * 0.22);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tone = rnd() > 0.5 ? '255,255,255' : '0,0,0';
    g.addColorStop(0, `rgba(${tone},${alpha * (0.4 + rnd() * 0.6)})`);
    g.addColorStop(1, `rgba(${tone},0)`);
    ctx.fillStyle = g;
    // Draw wrapped copies so the texture tiles without seams.
    for (const ox of [-s, 0, s]) {
      for (const oy of [-s, 0, s]) {
        ctx.fillRect(x - r + ox, y - r + oy, r * 2, r * 2);
      }
    }
  }
}

const PAINTERS = {
  /** Neutral plaster: tint with material.color. */
  plaster(ctx, s, rnd) {
    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rnd, 26, 0.07);
    speckle(ctx, s, rnd, 2600, 0.08);
  },
  concrete(ctx, s, rnd) {
    ctx.fillStyle = '#b9b9b9';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rnd, 40, 0.11);
    speckle(ctx, s, rnd, 5200, 0.13);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let x = rnd() * s;
      let y = rnd() * s;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (rnd() - 0.5) * s * 0.12;
        y += rnd() * s * 0.08;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  },
  /** Floor boards running along U. Colour is baked in. */
  woodFloor(ctx, s, rnd) {
    const rows = 4;
    const h = s / rows;
    for (let r = 0; r < rows; r++) {
      const offset = rnd() * s;
      let x = -offset;
      while (x < s) {
        const len = s * (0.45 + rnd() * 0.4);
        const l = 22 + rnd() * 9;
        ctx.fillStyle = `hsl(${24 + rnd() * 8}, ${32 + rnd() * 10}%, ${l}%)`;
        ctx.fillRect(x, r * h, len, h);
        ctx.strokeStyle = 'rgba(20,10,4,0.55)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.5, r * h + 0.5, len, h);
        for (let g = 0; g < 9; g++) {
          const gy = r * h + 3 + rnd() * (h - 6);
          ctx.strokeStyle = `rgba(${rnd() > 0.5 ? '255,220,170' : '15,8,3'},${0.05 + rnd() * 0.1})`;
          ctx.lineWidth = 0.6 + rnd();
          ctx.beginPath();
          ctx.moveTo(x, gy);
          ctx.bezierCurveTo(x + len * 0.3, gy + (rnd() - 0.5) * 4, x + len * 0.6, gy + (rnd() - 0.5) * 4, x + len, gy);
          ctx.stroke();
        }
        x += len;
      }
    }
    speckle(ctx, s, rnd, 1200, 0.07);
  },
  /** Fine furniture grain, neutral so it can be tinted. */
  woodGrain(ctx, s, rnd) {
    ctx.fillStyle = '#c9c9c9';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const y = rnd() * s;
      ctx.strokeStyle = `rgba(${rnd() > 0.45 ? '0,0,0' : '255,255,255'},${0.05 + rnd() * 0.12})`;
      ctx.lineWidth = 0.5 + rnd() * 1.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      const wob = (rnd() - 0.5) * 6;
      ctx.bezierCurveTo(s * 0.33, y + wob, s * 0.66, y - wob, s, y);
      ctx.stroke();
    }
  },
  /** Vertical-stripe wallpaper, neutral. */
  wallpaper(ctx, s, rnd) {
    ctx.fillStyle = '#cfcfcf';
    ctx.fillRect(0, 0, s, s);
    const stripes = 8;
    const w = s / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.085)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(i * w, 0, w, s);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(i * w, 0, 1.2, s);
      // A small repeating motif down the middle of every other stripe.
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        for (let k = 0; k < 4; k++) {
          const cy = (k + 0.5) * (s / 4);
          ctx.beginPath();
          ctx.ellipse(i * w + w / 2, cy, w * 0.14, w * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    blotches(ctx, s, rnd, 14, 0.05);
    speckle(ctx, s, rnd, 1500, 0.05);
  },
  tiles(ctx, s, rnd) {
    ctx.fillStyle = '#d6d6d6';
    ctx.fillRect(0, 0, s, s);
    const n = 4;
    const w = s / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.07})`;
        ctx.fillRect(i * w, j * w, w, w);
        const g = ctx.createLinearGradient(i * w, j * w, i * w + w, j * w + w);
        g.addColorStop(0, 'rgba(255,255,255,0.10)');
        g.addColorStop(1, 'rgba(0,0,0,0.06)');
        ctx.fillStyle = g;
        ctx.fillRect(i * w + 2, j * w + 2, w - 4, w - 4);
      }
    }
    ctx.strokeStyle = 'rgba(40,40,40,0.75)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w, 0);
      ctx.lineTo(i * w, s);
      ctx.moveTo(0, i * w);
      ctx.lineTo(s, i * w);
      ctx.stroke();
    }
    blotches(ctx, s, rnd, 8, 0.05);
  },
  checker(ctx, s, rnd) {
    const n = 4;
    const w = s / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const dark = (i + j) % 2 === 0;
        const l = dark ? 20 + rnd() * 4 : 62 + rnd() * 6;
        ctx.fillStyle = `hsl(200, 6%, ${l}%)`;
        ctx.fillRect(i * w, j * w, w, w);
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w, 0);
      ctx.lineTo(i * w, s);
      ctx.moveTo(0, i * w);
      ctx.lineTo(s, i * w);
      ctx.stroke();
    }
    blotches(ctx, s, rnd, 16, 0.06);
    speckle(ctx, s, rnd, 1500, 0.07);
  },
  brick(ctx, s, rnd) {
    ctx.fillStyle = '#3a2a25';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const bh = s / rows;
    const bw = s / 4;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let c = -1; c < 5; c++) {
        ctx.fillStyle = `hsl(${8 + rnd() * 12}, ${28 + rnd() * 14}%, ${24 + rnd() * 12}%)`;
        ctx.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
    blotches(ctx, s, rnd, 22, 0.1);
    speckle(ctx, s, rnd, 3000, 0.1);
  },
  stone(ctx, s, rnd) {
    ctx.fillStyle = '#777';
    ctx.fillRect(0, 0, s, s);
    const rows = 4;
    const bh = s / rows;
    const bw = s / 2;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let c = -1; c < 3; c++) {
        ctx.fillStyle = `hsl(205, ${4 + rnd() * 6}%, ${38 + rnd() * 14}%)`;
        ctx.fillRect(c * bw + off + 1.5, r * bh + 1.5, bw - 3, bh - 3);
      }
    }
    blotches(ctx, s, rnd, 30, 0.12);
    speckle(ctx, s, rnd, 4200, 0.12);
  },
  metal(ctx, s, rnd) {
    ctx.fillStyle = '#c4c4c4';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 420; i++) {
      const y = rnd() * s;
      ctx.strokeStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + rnd() * 0.07})`;
      ctx.lineWidth = 0.5 + rnd();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
    blotches(ctx, s, rnd, 8, 0.05);
  },
  fabric(ctx, s, rnd) {
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, s, s);
    ctx.lineWidth = 1;
    for (let i = 0; i < s; i += 3) {
      ctx.strokeStyle = `rgba(0,0,0,${0.05 + rnd() * 0.06})`;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, s);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.03 + rnd() * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(s, i);
      ctx.stroke();
    }
    blotches(ctx, s, rnd, 10, 0.05);
  },
  /** Teak-and-holly yacht sole. */
  deck(ctx, s, rnd) {
    const n = 8;
    const w = s / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `hsl(${26 + rnd() * 6}, ${42 + rnd() * 8}%, ${30 + rnd() * 7}%)`;
      ctx.fillRect(0, i * w, s, w);
      ctx.fillStyle = 'rgba(235,225,200,0.55)';
      ctx.fillRect(0, i * w, s, 2.5);
      for (let g = 0; g < 5; g++) {
        const gy = i * w + 4 + rnd() * (w - 6);
        ctx.strokeStyle = `rgba(20,10,0,${0.06 + rnd() * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(s, gy + (rnd() - 0.5) * 3);
        ctx.stroke();
      }
    }
  },
  /** Worn floorboards for attics and wharves; colour baked in. */
  planksRough(ctx, s, rnd) {
    const n = 5;
    const w = s / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `hsl(${28 + rnd() * 10}, ${16 + rnd() * 10}%, ${24 + rnd() * 10}%)`;
      ctx.fillRect(0, i * w, s, w);
      ctx.fillStyle = 'rgba(8,5,2,0.8)';
      ctx.fillRect(0, i * w, s, 2);
      for (let g = 0; g < 12; g++) {
        const gy = i * w + 3 + rnd() * (w - 5);
        ctx.strokeStyle = `rgba(${rnd() > 0.6 ? '230,210,180' : '10,6,2'},${0.05 + rnd() * 0.12})`;
        ctx.lineWidth = 0.5 + rnd() * 1.4;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(s * 0.3, gy + (rnd() - 0.5) * 5, s * 0.7, gy + (rnd() - 0.5) * 5, s, gy);
        ctx.stroke();
      }
      for (let k = 0; k < 2; k++) {
        ctx.fillStyle = 'rgba(10,6,2,0.55)';
        ctx.beginPath();
        ctx.arc(rnd() * s, i * w + w / 2, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    blotches(ctx, s, rnd, 12, 0.08);
  },
  carpet(ctx, s, rnd) {
    ctx.fillStyle = '#c4c4c4';
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, rnd, 9000, 0.12);
    blotches(ctx, s, rnd, 10, 0.05);
  },
};

/** Get (and cache) a tiling texture by painter name. */
export function tex(name, size = 256) {
  const painter = PAINTERS[name];
  if (!painter) throw new Error(`Unknown texture: ${name}`);
  return canvasTexture(`${name}:${size}`, size, painter);
}

/**
 * Material definitions. `map` names a painter; `m` is metres covered by one
 * repeat of the texture (geometry UVs are in metres, see geo.js).
 */
const DEFS = {
  // Floors
  floorWood: { map: 'woodFloor', m: 2.4, color: 0xffffff, rough: 0.62 },
  floorWoodDark: { map: 'woodFloor', m: 2.4, color: 0x8f7f76, rough: 0.55 },
  floorPlanks: { map: 'planksRough', m: 2.0, color: 0xffffff, rough: 0.9 },
  floorTile: { map: 'checker', m: 1.6, color: 0xb9c4c4, rough: 0.35 },
  floorConcrete: { map: 'concrete', m: 3, color: 0x6f757a, rough: 0.85 },
  floorDeck: { map: 'deck', m: 1.2, color: 0xffffff, rough: 0.5 },
  floorStone: { map: 'stone', m: 2.4, color: 0x8a9096, rough: 0.9 },
  floorLino: { map: 'checker', m: 1.2, color: 0x8f9a8c, rough: 0.5 },
  // Walls
  wallTeal: { map: 'plaster', m: 3, color: 0x31454a, rough: 0.95 },
  wallGreen: { map: 'plaster', m: 3, color: 0x3d4a3c, rough: 0.95 },
  wallCream: { map: 'plaster', m: 3, color: 0x8d8570, rough: 0.95 },
  wallOxblood: { map: 'wallpaper', m: 1.6, color: 0x5a3030, rough: 0.95 },
  wallNavy: { map: 'wallpaper', m: 1.6, color: 0x2e3a52, rough: 0.95 },
  wallMoss: { map: 'wallpaper', m: 1.6, color: 0x46503a, rough: 0.95 },
  wallTile: { map: 'tiles', m: 1.2, color: 0x9fb3b0, rough: 0.3 },
  wallBrick: { map: 'brick', m: 1.6, color: 0xffffff, rough: 0.95 },
  wallStone: { map: 'stone', m: 2.2, color: 0x9aa0a6, rough: 0.95 },
  wallPanel: { map: 'woodGrain', m: 1.4, color: 0x4a3122, rough: 0.6 },
  wallTeak: { map: 'woodGrain', m: 1.2, color: 0x7a4a26, rough: 0.45 },
  wallAttic: { map: 'plaster', m: 3, color: 0x57504a, rough: 0.98 },
  ceiling: { map: 'plaster', m: 4, color: 0x23282c, rough: 1 },
  ceilingWood: { map: 'woodGrain', m: 1.6, color: 0x33241a, rough: 0.8 },
  // Furniture
  wood: { map: 'woodGrain', m: 1.1, color: 0x6a4428, rough: 0.55 },
  woodDark: { map: 'woodGrain', m: 1.1, color: 0x3c2618, rough: 0.5 },
  woodLight: { map: 'woodGrain', m: 1.1, color: 0x9a7448, rough: 0.6 },
  woodBlack: { map: 'woodGrain', m: 1.1, color: 0x1c1613, rough: 0.45 },
  woodPaintGreen: { map: 'woodGrain', m: 1.1, color: 0x2f4a3c, rough: 0.6 },
  woodPaintWhite: { map: 'woodGrain', m: 1.1, color: 0xa9a394, rough: 0.6 },
  steel: { map: 'metal', m: 1, color: 0xa8b0b4, rough: 0.32, metal: 0.85 },
  steelDark: { map: 'metal', m: 1, color: 0x4c5358, rough: 0.45, metal: 0.8 },
  iron: { map: 'metal', m: 1, color: 0x25282b, rough: 0.6, metal: 0.7 },
  brass: { map: 'metal', m: 0.6, color: 0xc9a14a, rough: 0.3, metal: 1 },
  brassDull: { map: 'metal', m: 0.6, color: 0x8f7436, rough: 0.5, metal: 0.9 },
  copper: { map: 'metal', m: 0.6, color: 0xb0683c, rough: 0.4, metal: 1 },
  enamelWhite: { color: 0xd9dcd6, rough: 0.25 },
  enamelGreen: { color: 0x2f5a48, rough: 0.3 },
  leather: { map: 'carpet', m: 0.8, color: 0x3f2619, rough: 0.5 },
  leatherGreen: { map: 'carpet', m: 0.8, color: 0x22382f, rough: 0.5 },
  leatherOxblood: { map: 'carpet', m: 0.8, color: 0x4d1f1c, rough: 0.5 },
  fabricGrey: { map: 'fabric', m: 0.5, color: 0x5d6368, rough: 1 },
  fabricNavy: { map: 'fabric', m: 0.5, color: 0x27344a, rough: 1 },
  fabricWine: { map: 'fabric', m: 0.5, color: 0x5a2630, rough: 1 },
  fabricCream: { map: 'fabric', m: 0.5, color: 0xb9b09a, rough: 1 },
  fabricWhite: { map: 'fabric', m: 0.5, color: 0xcfd3d2, rough: 1 },
  fabricOlive: { map: 'fabric', m: 0.5, color: 0x4b5138, rough: 1 },
  carpetWine: { map: 'carpet', m: 1, color: 0x4a1f24, rough: 1 },
  carpetNavy: { map: 'carpet', m: 1, color: 0x1f2a3c, rough: 1 },
  paper: { color: 0xd8cfb8, rough: 0.9 },
  paperWhite: { color: 0xe6e3da, rough: 0.9 },
  cardboard: { map: 'carpet', m: 0.7, color: 0x8a6a45, rough: 0.95 },
  rubber: { color: 0x141414, rough: 0.8 },
  plasticBlack: { color: 0x15171a, rough: 0.45 },
  plasticRed: { color: 0x8c2a22, rough: 0.5 },
  plasticYellow: { color: 0xd8b21c, rough: 0.5 },
  ceramic: { color: 0xcfd2cc, rough: 0.2 },
  rope: { map: 'fabric', m: 0.2, color: 0x9a8a66, rough: 1 },
  chalk: { color: 0xe8e6df, rough: 1 },
  tape: { color: 0xe2c21e, rough: 0.6 },
  skinA: { color: 0xc99b7c, rough: 0.75 },
  dark: { color: 0x0b0d10, rough: 1 },
  water: { color: 0x0c1d26, rough: 0.08, metal: 0.4 },
  glassDark: { color: 0x10202a, rough: 0.1, metal: 0.3, opacity: 0.55, transparent: true },
  glassClear: { color: 0x9fc0c8, rough: 0.05, metal: 0.1, opacity: 0.22, transparent: true },
  glassBottleGreen: { color: 0x1f4a34, rough: 0.12, metal: 0.2, opacity: 0.82, transparent: true },
  glassBottleAmber: { color: 0x7a4310, rough: 0.12, metal: 0.2, opacity: 0.85, transparent: true },
};

/**
 * Get a shared material by name. Unknown names of the form `#rrggbb` produce a
 * plain coloured material, which keeps scene data terse.
 * @param {string} name
 * @returns {THREE.MeshStandardMaterial}
 */
export function mat(name) {
  let material = materials.get(name);
  if (material) return material;
  let def = DEFS[name];
  if (!def) {
    if (/^#[0-9a-f]{6}$/i.test(name)) def = { color: parseInt(name.slice(1), 16), rough: 0.8 };
    else throw new Error(`Unknown material: ${name}`);
  }
  material = new THREE.MeshStandardMaterial({
    color: def.color ?? 0xffffff,
    roughness: def.rough ?? 0.8,
    metalness: def.metal ?? 0,
    transparent: !!def.transparent,
    opacity: def.opacity ?? 1,
  });
  if (def.map) {
    const base = tex(def.map);
    // Clone so each material can carry its own repeat while sharing the image.
    const t = base.clone();
    t.needsUpdate = true;
    const rep = 1 / (def.m ?? 1);
    t.repeat.set(rep, rep);
    material.map = t;
  }
  material.name = name;
  materials.set(name, material);
  return material;
}

/** Unlit glowing material (lamp shades, flames, screens). */
export function glow(color, intensity = 1) {
  const key = `glow:${color}:${intensity}`;
  let material = materials.get(key);
  if (!material) {
    const c = new THREE.Color(color).multiplyScalar(intensity);
    material = new THREE.MeshBasicMaterial({ color: c, toneMapped: true });
    material.name = key;
    materials.set(key, material);
  }
  return material;
}

/**
 * A one-off textured material from a painter function, for signs, charts,
 * photographs and anything else with unique artwork.
 * @param {string} key cache key
 * @param {number} w canvas width
 * @param {number} h canvas height
 * @param {(ctx: CanvasRenderingContext2D, w: number, h: number, rnd: () => number) => void} draw
 * @param {{ emissive?: number, rough?: number, transparent?: boolean, basic?: boolean }} [opts]
 */
export function artMaterial(key, w, h, draw, opts = {}) {
  const cacheKey = `art:${key}`;
  let material = materials.get(cacheKey);
  if (material) return material;
  const t = canvasTexture(cacheKey, w, (ctx, _s, rnd) => draw(ctx, w, h, rnd), { repeat: false, w, h });
  if (opts.basic) {
    material = new THREE.MeshBasicMaterial({ map: t, transparent: !!opts.transparent });
  } else {
    material = new THREE.MeshStandardMaterial({
      map: t,
      roughness: opts.rough ?? 0.85,
      transparent: !!opts.transparent,
    });
    if (opts.emissive) {
      material.emissive = new THREE.Color(0xffffff);
      material.emissiveMap = t;
      material.emissiveIntensity = opts.emissive;
    }
  }
  material.name = cacheKey;
  materials.set(cacheKey, material);
  return material;
}

/** Soft round shadow decal used under furniture and people. */
export function blobShadowMaterial() {
  const key = 'blobShadow';
  let material = materials.get(key);
  if (material) return material;
  const t = canvasTexture(
    key,
    128,
    (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(0,0,0,0.75)');
      g.addColorStop(0.6, 'rgba(0,0,0,0.35)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    },
    { repeat: false },
  );
  material = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.8 });
  material.name = key;
  materials.set(key, material);
  return material;
}

/** Radial glow sprite texture for lamp halos. */
/**
 * Lit air: bright where the light enters, fading along its length, with faint
 * streaks. `edges` fades the sides too, for flat sheets of light.
 */
export function shaftTexture(edges = false) {
  return canvasTexture(
    edges ? 'shaft-flat' : 'shaft',
    128,
    (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.3, 'rgba(255,255,255,0.42)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      ctx.globalCompositeOperation = 'destination-out';
      const rnd = mulberry32(edges ? 7 : 11);
      for (let i = 0; i < 22; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.06 + rnd() * 0.2})`;
        ctx.fillRect(rnd() * s, 0, 1 + rnd() * 6, s);
      }
      if (edges) {
        const e = ctx.createLinearGradient(0, 0, s, 0);
        e.addColorStop(0, 'rgba(0,0,0,1)');
        e.addColorStop(0.22, 'rgba(0,0,0,0)');
        e.addColorStop(0.78, 'rgba(0,0,0,0)');
        e.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = e;
        ctx.fillRect(0, 0, s, s);
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    { repeat: false },
  );
}

export function haloTexture() {
  return canvasTexture(
    'halo',
    128,
    (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    },
    { repeat: false },
  );
}

/** A dim studio-ish environment so brass and steel have something to reflect. */
export function buildEnvironment(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 128);
  sky.addColorStop(0, '#1b2a36');
  sky.addColorStop(0.5, '#0d151c');
  sky.addColorStop(1, '#070a0d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 128);
  const blob = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  blob(60, 50, 34, 'rgba(255,190,110,0.95)');
  blob(190, 44, 26, 'rgba(255,170,90,0.8)');
  blob(128, 30, 40, 'rgba(120,170,200,0.5)');
  blob(20, 70, 18, 'rgba(160,200,220,0.5)');
  const equirect = new THREE.CanvasTexture(canvas);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(equirect).texture;
  equirect.dispose();
  pmrem.dispose();
  return env;
}
