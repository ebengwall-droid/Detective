// The finishing pass: what turns a lit room into a photograph of one.
//
// The room is drawn into a high-range off-screen picture, then:
//   bloom          bright things (lamps, windows, wet highlights) spill light
//   depth of field in a conversation the background falls out of focus
//   grade          filmic tone curve, cool shadows against warm lamplight
//   vignette, grain, dither
//
// Everything after the scene itself runs at half resolution or less, so the
// whole chain costs about as much as drawing the room a second time at a
// quarter of the size.

import * as THREE from 'three';

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/** Keep only what is bright enough to glow, with a soft knee so nothing pops on. */
const PREFILTER = /* glsl */ `
uniform sampler2D tSrc;
uniform vec2 texel;
uniform float threshold;
uniform float knee;
uniform float gain;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv + texel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, -1.0)).rgb
         + texture2D(tSrc, vUv + texel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, 1.0)).rgb;
  // Judge brightness as the eye will see it, after exposure.
  c = min(c * 0.25 * gain, vec3(24.0));
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - threshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  c *= max(soft, br - threshold) / max(br, 1e-4);
  // Glow is light, not paint: pull it toward a warm white so lamps do not smear pure yellow.
  float g = dot(c, vec3(0.2126, 0.7152, 0.0722));
  gl_FragColor = vec4(mix(vec3(g), c, 0.62) * vec3(1.0, 0.87, 0.72), 1.0);
}`;

/** Halve the picture (five taps, each already an average of four). */
const DOWN = /* glsl */ `
uniform sampler2D tSrc;
uniform vec2 texel;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
  c += texture2D(tSrc, vUv + texel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, -1.0)).rgb;
  c += texture2D(tSrc, vUv + texel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, 1.0)).rgb;
  gl_FragColor = vec4(c / 8.0, 1.0);
}`;

/** Double it again, smoothly, adding the sharper level on top. */
const UP = /* glsl */ `
uniform sampler2D tSrc;
uniform sampler2D tAdd;
uniform vec2 texel;
uniform float add;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv + texel * vec2(-2.0, 0.0)).rgb + texture2D(tSrc, vUv + texel * vec2(2.0, 0.0)).rgb
         + texture2D(tSrc, vUv + texel * vec2(0.0, -2.0)).rgb + texture2D(tSrc, vUv + texel * vec2(0.0, 2.0)).rgb;
  c += 2.0 * (texture2D(tSrc, vUv + texel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, 1.0)).rgb
            + texture2D(tSrc, vUv + texel * vec2(1.0, -1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(-1.0, -1.0)).rgb);
  gl_FragColor = vec4(c / 12.0 + texture2D(tAdd, vUv).rgb * add, 1.0);
}`;

const COMPOSITE = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform sampler2D tBlur;
uniform sampler2D tDepth;
uniform vec2 resolution;
uniform float exposure;
uniform float bloom;
uniform float dof;
uniform float focus;
uniform float near;
uniform float far;
uniform float time;
uniform float grain;
uniform float vignette;
varying vec2 vUv;

// Stephen Hill's fit of the ACES filmic curve.
vec3 aces(vec3 x) {
  x = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777) * x;
  x = (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.4329510) + 0.238081);
  x = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602) * x;
  return clamp(x, 0.0, 1.0);
}
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  if (dof > 0.001) {
    float d = texture2D(tDepth, vUv).x;
    float z = (2.0 * near * far) / (far + near - (2.0 * d - 1.0) * (far - near));
    // Sharp around the subject, soft behind, a little soft right in front of the lens.
    float behind = smoothstep(0.35, 2.6, z - focus);
    float front = smoothstep(0.45, 0.05, z / max(focus, 0.01)) * 0.6;
    c = mix(c, texture2D(tBlur, vUv).rgb, max(behind, front) * dof);
  }
  c = c * exposure + texture2D(tBloom, vUv).rgb * bloom;
  c = aces(c);

  // The grade: night air goes a little teal, lamplight stays warm.
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c *= mix(vec3(0.93, 1.0, 1.08), vec3(1.05, 1.0, 0.93), smoothstep(0.03, 0.5, l));
  c = clamp(mix(vec3(l), c, 1.08) + vec3(0.004, 0.007, 0.011), 0.0, 1.0);

  c *= mix(1.0, smoothstep(0.80, 0.30, length(vUv - 0.5)), vignette);

  c = mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  c += (hash(gl_FragCoord.xy + fract(time) * 61.0) - 0.5) * grain;
  gl_FragColor = vec4(c, 1.0);
}`;

function pass(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false, toneMapped: false });
}

export class Post {
  /** @param {THREE.WebGLRenderer} renderer */
  constructor(renderer) {
    this.renderer = renderer;
    // Bright values above 1 need a float target. Without one, bloom still works, just more modestly.
    const ext = renderer.extensions;
    this.type = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.tri = new THREE.Mesh(geometry);
    this.tri.frustumCulled = false;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const tex = () => ({ value: null });
    const v2 = () => ({ value: new THREE.Vector2() });
    this.m = {
      prefilter: pass(PREFILTER, { tSrc: tex(), texel: v2(), threshold: { value: 1.0 }, knee: { value: 0.6 }, gain: { value: 1 } }),
      down: pass(DOWN, { tSrc: tex(), texel: v2() }),
      up: pass(UP, { tSrc: tex(), tAdd: tex(), texel: v2(), add: { value: 1 } }),
      composite: pass(COMPOSITE, {
        tScene: tex(), tBloom: tex(), tBlur: tex(), tDepth: tex(), resolution: v2(),
        exposure: { value: 1 }, bloom: { value: 0.5 }, dof: { value: 0 }, focus: { value: 2 }, near: { value: 0.06 }, far: { value: 90 },
        time: { value: 0 }, grain: { value: 0.035 }, vignette: { value: 0.42 },
      }),
    };
    this.targets = [];
    this.w = 0;
    this.h = 0;
    this.samples = -1;
    this.asked = -1;
    this.verified = false;
    this.noSmoothing = false;
  }

  /** How much the picture is multiplied by for a given exposure: the same as the renderer's own filmic curve would apply. */
  static gain(exposure) {
    return (exposure / 0.6) * 1.1;
  }

  /** @param {number} width CSS pixels  @param {number} height  @param {number} pixelRatio  @param {number} samples multisampling for the scene itself */
  setSize(width, height, pixelRatio, samples = 0) {
    const w = Math.max(8, Math.round(width * pixelRatio));
    const h = Math.max(8, Math.round(height * pixelRatio));
    if (w === this.w && h === this.h && samples === this.asked) return;
    this.asked = samples;
    this.build(w, h, this.noSmoothing ? 0 : samples);
  }

  build(w, h, samples) {
    for (const t of this.targets) t.dispose();
    Object.assign(this, { w, h, samples, verified: false });
    const depthTexture = new THREE.DepthTexture(w, h);
    this.sceneRT = new THREE.WebGLRenderTarget(w, h, { type: this.type, samples, depthTexture });
    const level = (shift) => new THREE.WebGLRenderTarget(Math.max(2, w >> shift), Math.max(2, h >> shift), { type: this.type, depthBuffer: false });
    // Bloom pyramid: down to a sixteenth and back.
    this.down = [level(1), level(2), level(3), level(4)];
    this.up = [level(3), level(2), level(1)];
    // Out-of-focus copy of the whole picture.
    this.blur = [level(1), level(2), level(2)];
    this.targets = [this.sceneRT, depthTexture, ...this.down, ...this.up, ...this.blur];
  }

  /**
   * Not every phone can draw into every kind of off-screen picture, and one that
   * cannot does not say so: it just shows black. So look before the first frame,
   * and step down (no smoothing, then plain 8-bit colour) until something works.
   */
  verify() {
    const r = this.renderer;
    const gl = r.getContext();
    const usable = (target) => {
      r.setRenderTarget(target);
      return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    };
    while (!(usable(this.sceneRT) && usable(this.down[0]))) {
      if (this.samples > 0) {
        this.noSmoothing = true;
        this.build(this.w, this.h, 0);
      } else if (this.type !== THREE.UnsignedByteType) {
        this.type = THREE.UnsignedByteType;
        this.build(this.w, this.h, 0);
      } else {
        r.setRenderTarget(null);
        throw new Error('this device cannot draw to an off-screen picture');
      }
    }
    this.verified = true;
  }

  run(material, target, values) {
    for (const [k, v] of Object.entries(values)) {
      const u = material.uniforms[k];
      if (u.value?.isVector2) u.value.set(v[0], v[1]);
      else u.value = v;
    }
    this.tri.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.tri, this.cam);
  }

  /**
   * @param {THREE.Scene} scene
   * @param {THREE.PerspectiveCamera} camera
   * @param {{exposure: number, bloom?: number, dof?: number, focus?: number, time?: number, grain?: number}} o
   */
  render(scene, camera, o) {
    const r = this.renderer;
    if (!this.verified) this.verify();
    const { m, down, up, blur } = this;
    r.setRenderTarget(this.sceneRT);
    r.render(scene, camera);

    const size = (t) => [1 / t.width, 1 / t.height];
    const gain = Post.gain(o.exposure);
    this.run(m.prefilter, down[0], { tSrc: this.sceneRT.texture, texel: size(this.sceneRT), gain });
    for (let i = 1; i < down.length; i++) this.run(m.down, down[i], { tSrc: down[i - 1].texture, texel: size(down[i - 1]) });
    let src = down[down.length - 1];
    for (let i = 0; i < up.length; i++) {
      const add = down[down.length - 2 - i];
      this.run(m.up, up[i], { tSrc: src.texture, tAdd: add.texture, texel: [0.5 / src.width, 0.5 / src.height], add: 1 });
      src = up[i];
    }

    const dof = o.dof ?? 0;
    if (dof > 0.001) {
      this.run(m.down, blur[0], { tSrc: this.sceneRT.texture, texel: size(this.sceneRT) });
      this.run(m.down, blur[1], { tSrc: blur[0].texture, texel: size(blur[0]) });
      this.run(m.up, blur[2], { tSrc: blur[1].texture, tAdd: blur[1].texture, texel: [1 / blur[1].width, 1 / blur[1].height], add: 0 });
    }

    this.run(m.composite, null, {
      tScene: this.sceneRT.texture,
      tBloom: src.texture,
      tBlur: blur[2].texture,
      tDepth: this.sceneRT.depthTexture,
      resolution: [this.w, this.h],
      exposure: gain,
      bloom: o.bloom ?? 0.5,
      dof,
      focus: o.focus ?? 2,
      near: camera.near,
      far: camera.far,
      time: o.time ?? 0,
      grain: o.grain ?? 0.035,
    });
  }

  dispose() {
    for (const t of this.targets) t.dispose();
    for (const mat of Object.values(this.m)) mat.dispose();
    this.tri.geometry.dispose();
  }
}
