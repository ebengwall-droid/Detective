// The finishing pass: what turns a lit room into a picture.
//
// The room is drawn into a high-range, anti-aliased buffer, then:
//   ambient occlusion  corners, the undersides of furniture, where things meet the floor (N8AO)
//   depth of field     the room falls out of focus behind whoever you are talking to
//   bloom              lamps and flames glow
//   the film look      filmic tone curve, a slight grade, vignette and grain
//
// Built on pmndrs/postprocessing and N8AO, the libraries most three.js games
// use for this. Anything that goes wrong here is caught by the caller, which
// falls back to drawing the room directly.

import * as THREE from 'three';
import {
  BlendFunction,
  BloomEffect,
  BrightnessContrastEffect,
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  HueSaturationEffect,
  NoiseEffect,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

export class Post {
  /** How much brighter the picture is than the light in the room, for a given exposure (three's filmic curve works from exposure / 0.6). */
  static gain(exposure) {
    return (exposure * 1.22) / 0.6;
  }

  /** @param {THREE.WebGLRenderer} renderer */
  constructor(renderer) {
    this.renderer = renderer;
    /** What this device is asked to do: ambient occlusion samples (0 for none) and whether to blur by depth. */
    this.features = { ao: 10, dof: true };
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

  /** @param {{ao: number, dof: boolean}} features */
  configure(features) {
    if (features.ao === this.features.ao && features.dof === this.features.dof) return;
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

    if (this.features.dof) {
      this.dof = new DepthOfFieldEffect(camera, { focusDistance: 2, focusRange: 1.6, bokehScale: 0, resolutionScale: 0.5 });
      this.dofPass = new EffectPass(camera, this.dof);
      this.dofPass.enabled = false;
      composer.addPass(this.dofPass);
    }

    this.bloom = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.9, luminanceSmoothing: 0.25, intensity: 0.8, radius: 0.72, levels: 6 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    // The grade: a little less colour, a little more contrast, the way night interiors are printed.
    const grade = new HueSaturationEffect({ saturation: -0.06 });
    const contrast = new BrightnessContrastEffect({ brightness: 0.0, contrast: 0.05 });
    const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.5 });
    this.grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false });
    this.grain.blendMode.opacity.value = 0.06;
    const finish = [this.bloom, tone, grade, contrast, vignette, this.grain];
    // Where the room could not be multisampled, smooth its edges afterwards instead.
    if (!this.samples) finish.push(new SMAAEffect({ preset: SMAAPreset.MEDIUM }));
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
