// Two things every person in the game shares, however they are drawn: a soft
// edge light, and a limit on how bright they may get.

import * as THREE from 'three';

/**
 * How bright a person may get before the light on them is reined in. Someone
 * standing next to a work lamp should look well lit, not burn out to a white
 * shape. The world sets this each frame to suit the room's exposure.
 */
export const figureLight = { value: 100 };

/**
 * Patch a standard material with a soft edge light, so a figure reads against
 * a dark room the way it would with a lamp somewhere behind it, and with the
 * brightness limit above.
 */
export function rimLit(material, strength = 0.17, tint = 0x9fc4dc) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.rimTint = { value: new THREE.Color(tint) };
    shader.uniforms.rimStrength = { value: strength };
    shader.uniforms.figureLight = figureLight;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimTint;\nuniform float rimStrength;\nuniform float figureLight;')
      .replace(
        '#include <opaque_fragment>',
        [
          'float rimTerm = pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 3.2);',
          'outgoingLight += rimTint * rimTerm * rimStrength * (0.3 + diffuseColor.rgb);',
          'float figurePeak = max(outgoingLight.r, max(outgoingLight.g, outgoingLight.b));',
          'if (figurePeak > figureLight) outgoingLight *= (figureLight + (figurePeak - figureLight) * 0.2) / figurePeak;',
          '#include <opaque_fragment>',
        ].join('\n'),
      );
  };
  material.customProgramCacheKey = () => `rim:${strength}:${tint}`;
  return material;
}
