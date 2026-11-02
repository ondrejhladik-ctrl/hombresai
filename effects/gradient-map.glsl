// @name Gradient Map
// @category Color
// @description Maps the brightness onto a palette – duotones, thermal camera, neon.
// @palette thermal
// @preset name="Duotone" palette=synth
// @preset name="Posterize" uSteps=5 palette=ice

uniform float uSteps;  // @param label="Steps (0 = smooth)" min=0 max=16 step=1 default=0
uniform float uMix;    // @param label="Amount" min=0 max=1 step=0.01 default=1

vec4 effect(vec2 uv) {
  vec3 src = img(uv).rgb;
  float t = luma(src);
  if (uSteps >= 2.0) t = floor(t * uSteps) / (uSteps - 1.0);
  vec3 col = uPalOriginal ? src : palSmooth(clamp(t, 0.0, 1.0));
  return vec4(mix(src, col, uMix), 1.0);
}
