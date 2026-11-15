// The finishing pass: what turns a lit room into a picture.
//
// The room is drawn into a high-range, anti-aliased buffer, then:
//   ambient occlusion  corners, the undersides of furniture, where things meet the floor (N8AO)
//   a guard            every pixel made a real number no brighter than BRIGHTEST, before anything blurs
//   depth of field     the room falls out of focus behind whoever you are talking to
//   bloom              lamps and flames glow
//   the film look      filmic tone curve, a grade (cool shadows, warm light), vignette and grain
//
// Built on pmndrs/postprocessing and N8AO, the libraries most three.js games
// use for this. Anything that goes wrong here is caught by the caller, which
// falls back to drawing the room directly.

import * as THREE from 'three';
import {
  BlendFunction,
  BloomEffect,
  DepthOfFieldEffect,
  Effect,
  EffectComposer,
  EffectPass,
  FXAAEffect,
  NoiseEffect,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

/** The brightest a pixel of the room may be, in the buffer's own units (a lamp's glass is about 2 to 8). */
const BRIGHTEST = '64.0';

// A NaN (not a number) has every exponent bit set and some fraction bit set; an
// infinity has the exponent bits set and no fraction bits. Both are tested on the
// bits, because a shader compiler may assume floats are always numbers and drop
// an isnan() test.

/**
 * The guard. One NaN or infinity anywhere in the room is spread by the blurs
 * that follow (depth of field, then bloom's chain of smaller and smaller
 * copies) into a black rectangle over much of the screen. This runs after the
 * room and its occlusion are drawn and before anything is blurred: a NaN
 * becomes one black pixel on its own, and nothing is brighter than BRIGHTEST.
 * SRC blending, because the default mix(input, output, 1.0) would multiply the
 * bad input by zero, which is still NaN.
 */
class FiniteEffect extends Effect {
  constructor() {
    super(
      'FiniteEffect',
      `void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        bvec4 bad = greaterThan(floatBitsToUint(inputColor) & 0x7fffffffu, uvec4(0x7f800000u));
        vec4 c = mix(inputColor, vec4(0.0, 0.0, 0.0, 1.0), bad);
        outputColor = vec4(clamp(c.rgb, 0.0, ${BRIGHTEST}), clamp(c.a, 0.0, 1.0));
      }`,
      { blendFunction: BlendFunction.SRC },
    );
  }
}

// The same guard in every ordinary material, at the point where its colour is
// final. A shiny surface near a lamp, seen at a glancing angle, can come out
// brighter than the 65504 a half-float buffer holds, and is then stored as
// infinity. Capped here it keeps its glow, instead of reaching the guard pass
// as a bad pixel (the occlusion pass turns an infinity into NaN).
const FINAL_COLOUR = 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );';
if (THREE.ShaderChunk.opaque_fragment.includes(FINAL_COLOUR)) {
  THREE.ShaderChunk.opaque_fragment = THREE.ShaderChunk.opaque_fragment.replace(
    FINAL_COLOUR,
    `outgoingLight = mix( clamp( outgoingLight, 0.0, ${BRIGHTEST} ), vec3( 0.0 ), greaterThan( floatBitsToUint( outgoingLight ) & 0x7fffffffu, uvec3( 0x7f800000u ) ) );\n${FINAL_COLOUR}`,
  );
}

/**
 * The grade: how the picture is printed. Shadows lean cool and highlights
 * warm, so lamplight separates from the dark instead of washing the whole
 * room one brown; contrast is firmer, shadows stay open enough to read on a
 * phone, and colour is a little richer. One small step in the last pass, so
 * even the cheapest tier gets it.
 */
class GradeEffect extends Effect {
  constructor({ amount = 1 } = {}) {
    super(
      'GradeEffect',
      `uniform float amount;
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 c = inputColor.rgb;
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        vec3 tone = mix(vec3(0.84, 0.97, 1.13), vec3(1.07, 1.0, 0.9), smoothstep(0.06, 0.62, l));
        vec3 g = c * tone;
        g = mix(g, g * g * (3.0 - 2.0 * g), 0.24);
        // Open the shadows a little: a phone is looked at in daylight, and a room that is only black is not moody, just unreadable.
        g = pow(max(g, 0.0), vec3(0.93));
        g = mix(vec3(dot(g, vec3(0.2126, 0.7152, 0.0722))), g, 1.1);
        outputColor = vec4(mix(c, clamp(g, 0.0, 1.0), amount), inputColor.a);
      }`,
      { uniforms: new Map([['amount', new THREE.Uniform(amount)]]) },
    );
  }
}

export class Post {
  /** How much brighter the picture is than the light in the room, for a given exposure (three's filmic curve works from exposure / 0.6). */
  static gain(exposure) {
    return (exposure * 1.22) / 0.6;
  }

  /** @param {THREE.WebGLRenderer} renderer */
  constructor(renderer) {
    this.renderer = renderer;
    /** What this device is asked to do: ambient occlusion samples (0 for none), whether to blur by depth, and how much bloom to afford. */
    this.features = { ao: 10, dof: true, lite: false };
    const ext = renderer.extensions;
    // Bright values above 1 need a float buffer. Without one, the effects still run, just more modestly.
    this.type = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.w = 0;
    this.h = 0;
    this.samples = -1;
    this.composer = null;
    this.scene = null;
    this.camera = null;
  }

  /** @param {{ao: number, dof: boolean, lite?: boolean}} features */
  configure(features) {
    if (features.ao === this.features.ao && features.dof === this.features.dof && !!features.lite === !!this.features.lite) return;
    this.features = { ...features };
    this.dispose();
  }

  /** @param {number} width CSS pixels  @param {number} height  @param {number} pixelRatio  @param {number} samples multisampling for the room itself */
  setSize(width, height, pixelRatio, samples = 0) {
    const w = Math.max(8, Math.round(width * pixelRatio));
    const h = Math.max(8, Math.round(height * pixelRatio));
    if (samples !== this.samples) this.dispose();
    Object.assign(this, { w, h, samples, cssW: width, cssH: height });
    this.composer?.setSize(width, height);
  }

  build(scene, camera) {
    this.dispose();
    const { renderer } = this;
    const composer = new EffectComposer(renderer, { frameBufferType: this.type, multisampling: Math.min(this.samples, renderer.capabilities.maxSamples ?? 4), stencilBuffer: false });
    composer.addPass(new RenderPass(scene, camera));

    if (this.features.ao) {
      const ao = new N8AOPostPass(scene, camera, this.w, this.h);
      // Sized for rooms: a soft shadow within about half a metre of where surfaces meet.
      Object.assign(ao.configuration, { aoRadius: 0.55, distanceFalloff: 0.6, intensity: 2.0, halfRes: true, depthAwareUpsampling: true, aoSamples: this.features.ao, denoiseSamples: 4, denoiseRadius: 8, gammaCorrection: false });
      composer.addPass(ao);
      this.ao = ao;
    }
    composer.addPass(new EffectPass(camera, new FiniteEffect()));

    if (this.features.dof) {
      this.dof = new DepthOfFieldEffect(camera, { focusDistance: 2, focusRange: 1.6, bokehScale: 0, resolutionScale: 0.5 });
      this.dofPass = new EffectPass(camera, this.dof);
      this.dofPass.enabled = false;
      composer.addPass(this.dofPass);
    }

    const lite = !!this.features.lite;
    this.bloom = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.9, luminanceSmoothing: 0.25, intensity: 0.8, radius: lite ? 0.66 : 0.72, levels: lite ? 4 : 6 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    this.grade = new GradeEffect({ amount: 0.85 });
    const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.5 });
    const finish = [this.bloom, tone, this.grade, vignette];
    if (!lite) {
      this.grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false });
      this.grain.blendMode.opacity.value = 0.06;
      finish.push(this.grain);
    }
    // Where the room could not be multisampled, smooth its edges afterwards instead: properly where there is time for it, cheaply where there is not.
    if (!this.samples) finish.push(lite ? new FXAAEffect() : new SMAAEffect({ preset: SMAAPreset.MEDIUM }));
    composer.addPass(new EffectPass(camera, ...finish));

    composer.setSize(this.cssW, this.cssH);
    this.composer = composer;
    this.scene = scene;
    this.camera = camera;
  }

  /**
   * @param {THREE.Scene} scene
   * @param {THREE.PerspectiveCamera} camera
   * @param {{exposure: number, bloom?: number, dof?: number, focus?: number, time?: number, dt?: number}} o
   */
  render(scene, camera, o) {
    if (!this.composer || this.scene !== scene || this.camera !== camera) this.build(scene, camera);
    const r = this.renderer;
    // A touch over the room's own exposure: occlusion and the vignette both take light away.
    r.toneMappingExposure = o.exposure * 1.22;
    this.bloom.intensity = (o.bloom ?? 0.55) * 1.5;
    if (this.dof) {
      const amount = o.dof ?? 0;
      this.dofPass.enabled = amount > 0.01;
      if (this.dofPass.enabled) {
        this.dof.cocMaterial.focusDistance = o.focus ?? 2;
        this.dof.cocMaterial.focusRange = 1.3 + (o.focus ?? 2) * 0.35;
        this.dof.bokehScale = 3.2 * amount;
      }
    }
    this.composer.render(o.dt ?? 1 / 60);
  }

  dispose() {
    this.composer?.dispose();
    this.composer = null;
    this.ao = null;
    this.dof = null;
    this.dofPass = null;
  }
}
