// Window glass on a wet night.
//
// A pane does not carry a picture of the outside. It works out, for every
// point on it, which way the eye is looking through that point, and shows
// what a photograph of a sea front at night holds in that direction. So the
// view shifts as you walk, the way a real one does, and the same town lights
// sit outside every window of a room.
//
// The rain is on the glass: standing drops and trails running down it. Each
// bends the line of sight, which is what makes a drop on a window a small
// upside-down picture of the lights behind it.

import * as THREE from 'three';
import { mulberry32 } from './materials.js';

/** The view outside. Shared by every pane, so the photograph can arrive late and still show everywhere. */
const view = { value: null };
const softness = { value: 1.2 };
const standing = { value: null };
const running = { value: null };

/** A square of numbers the shader reads as water: red and green lean, blue depth. */
function field(size, paint) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 128;
    data[i * 4 + 1] = 128;
    data[i * 4 + 3] = 255;
  }
  /** One drop: a lens, leaning outwards more the nearer its edge. */
  const drop = (cx, cy, r, tall = 1, depth = 1) => {
    const ry = r * tall;
    for (let y = Math.floor(-ry); y <= Math.ceil(ry); y++) {
      for (let x = Math.floor(-r); x <= Math.ceil(r); x++) {
        const dx = x / r;
        const dy = y / ry;
        const d = Math.hypot(dx, dy);
        if (d >= 1) continue;
        const px = (((Math.round(cx) + x) % size) + size) % size;
        const py = (((Math.round(cy) + y) % size) + size) % size;
        const i = (py * size + px) * 4;
        const water = Math.min(1, (1 - d) * 4) * depth;
        if (water * 255 < data[i + 2]) continue;
        data[i] = 128 + 127 * dx * water;
        data[i + 1] = 128 + 127 * dy * water;
        data[i + 2] = 255 * water;
      }
    }
  };
  paint(drop, size);
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function water() {
  if (standing.value) return;
  const rnd = mulberry32(0x7a11);
  standing.value = field(512, (drop, size) => {
    for (let i = 0; i < 420; i++) drop(rnd() * size, rnd() * size, 1.4 + rnd() * 2.6, 1, 0.75);
    for (let i = 0; i < 70; i++) drop(rnd() * size, rnd() * size, 4 + rnd() * 4.5, 1 + rnd() * 0.25);
    for (let i = 0; i < 12; i++) drop(rnd() * size, rnd() * size, 8 + rnd() * 6, 1.1 + rnd() * 0.3);
  });
  running.value = field(512, (drop, size) => {
    // A trail: a fat drop with the thinning line of water it left on its way down.
    // Row 0 is the bottom of the picture, so the drop goes at the low end.
    for (let i = 0; i < 16; i++) {
      let x = rnd() * size;
      const foot = rnd() * size;
      const length = 70 + rnd() * 260;
      const width = 1.6 + rnd() * 1.5;
      const wander = rnd() * 6.28;
      for (let y = 0; y < length; y += 1) {
        x += Math.sin(wander + y * 0.045) * 0.22 + (rnd() - 0.5) * 0.5;
        const thin = 1 - y / length;
        drop(x, foot + y, Math.max(0.9, width * (0.45 + 0.55 * thin)), 1, 0.35 + 0.65 * thin);
      }
      drop(x - (rnd() - 0.5), foot, width * 2.1, 1.35);
    }
  });
}

/** Something to look at until the photograph arrives, or if it never does: a dark sea and a few lights. */
function standIn() {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0b1016');
  sky.addColorStop(0.5, '#1b2732');
  sky.addColorStop(0.505, '#0a1118');
  sky.addColorStop(1, '#05080b');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  const rnd = mulberry32(0x51a);
  for (let i = 0; i < 46; i++) {
    const x = rnd() * w;
    const y = h * (0.5 - rnd() * 0.035);
    const r = 1.5 + rnd() * 3.5;
    for (const [at, strength] of [[y, 1], [h - y + 2 + rnd() * 6, 0.3]]) {
      const g = c.createRadialGradient(x, at, 0, x, at, r);
      g.addColorStop(0, `rgba(${rnd() > 0.35 ? '255,206,140' : '170,210,235'},${strength})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(x - r, at - r, r * 2, r * 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function look(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  const width = texture.image?.width ?? 512;
  // The far view is read a little out of focus, as through a wet pane: the same blur whatever the picture's size.
  softness.value = Math.max(0, 2.1 + Math.log2(width / 4096));
  return texture;
}

/** Use this photograph (a band around the horizon, 45 degrees up and down) as the view from every window. */
export function setNightView(texture) {
  const old = view.value;
  view.value = look(texture);
  if (old && old !== texture) old.dispose();
}

const vertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vFacing;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vFacing = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D view;
  uniform sampler2D standing;
  uniform sampler2D running;
  uniform float softness;
  uniform float time;
  uniform float turn;
  uniform float gain;
  uniform float flash;
  uniform vec3 tint;
  uniform vec3 glint;
  varying vec3 vWorld;
  varying vec3 vFacing;

  const float PI = 3.141592653589793;

  // What lies in a direction: the photograph covers every compass bearing, and 45 degrees above and below the horizon.
  vec3 outside(vec3 d, float blur) {
    float u = atan(d.z, d.x) / (2.0 * PI) + turn;
    float v = 0.5 + asin(clamp(d.y, -1.0, 1.0)) / (0.5 * PI);
    return textureLod(view, vec2(u, clamp(v, 0.004, 0.996)), blur).rgb;
  }

  void main() {
    vec3 n = normalize(vFacing);
    vec3 across = abs(n.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), n));
    vec3 up = cross(n, across);
    vec2 p = vec2(dot(vWorld, across), dot(vWorld, up)); // metres across and up the glass
    vec3 eye = normalize(vWorld - cameraPosition);

    vec4 a = texture2D(standing, p * 1.7);
    vec4 b = texture2D(running, vec2(p.x * 1.25, p.y * 0.8 + time * 0.085));
    vec4 c = texture2D(running, vec2(p.x * 1.9 + 0.37, p.y * 1.3 + time * 0.19 + 0.5));
    vec2 lean = (a.rg - 0.5) * 2.0 + (b.rg - 0.5) * 2.0 + (c.rg - 0.5) * 1.6;
    float wet = clamp(a.b + b.b + c.b, 0.0, 1.0);

    // Through dry glass: the night, a little soft. Through water: bent, sharp and upside down.
    vec3 straight = outside(eye, softness);
    vec3 bent = outside(normalize(eye - (across * lean.x + up * lean.y) * 0.85), max(0.0, softness - 2.0));
    vec3 colour = mix(straight, bent, wet);

    // A photograph tops out at white; a lamp does not. Give the brightest parts their strength back.
    float bright = max(colour.r, max(colour.g, colour.b));
    colour *= 1.0 + 3.0 * smoothstep(0.72, 1.0, bright);

    // The thick rim of a drop passes little light, and the top of it catches the room's.
    float rim = wet * smoothstep(0.55, 1.0, length(lean));
    colour *= 1.0 - 0.4 * rim;
    float shine = pow(max(0.0, dot(normalize(vec3(lean, 0.6)), normalize(vec3(-0.3, 0.62, 0.72)))), 30.0) * wet;

    // Lightning: the whole sky lifts for an instant.
    float sky = smoothstep(-0.03, 0.2, eye.y);
    colour = colour * tint * gain * (1.0 + flash * 1.8) + vec3(0.42, 0.5, 0.62) * flash * (0.25 + 0.75 * sky) * 0.32;
    colour += glint * shine;

    gl_FragColor = vec4(colour, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Glass for one room's windows.
 * @param {{ tint?: number, turn?: number, gain?: number, glint?: number }} [o]
 *   turn: which way the room faces, as a fraction of a full turn of the view outside
 * @returns {THREE.ShaderMaterial & { tick(t: number): void, strike(f: number): void }}
 */
export function rainGlass(o = {}) {
  water();
  view.value ??= look(standIn());
  const material = new THREE.ShaderMaterial({
    name: 'rainGlass',
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    uniforms: {
      view,
      standing,
      running,
      softness,
      time: { value: 0 },
      turn: { value: o.turn ?? 0.5 },
      gain: { value: o.gain ?? 0.6 },
      flash: { value: 0 },
      tint: { value: new THREE.Color(o.tint ?? 0xffffff) },
      glint: { value: new THREE.Color(o.glint ?? 0xffd9a8).multiplyScalar(0.08) },
    },
  });
  /** Let the rain run. */
  material.tick = (t) => {
    material.uniforms.time.value = t % 4096;
  };
  /** Lightning, from 0 (none) upwards. */
  material.strike = (f) => {
    material.uniforms.flash.value = f;
  };
  return material;
}
