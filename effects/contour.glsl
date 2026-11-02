// @name Contour Map
// @category Edges
// @description Topographic lines that follow the brightness of the image.
// @palette ice
// @finish glow=0.2
// @preset name="Topo Fill" uLevels=10 uFill=0.55 palette=thermal glow=0

uniform float uLevels;  // @param label="Levels" min=3 max=40 step=1 default=12
uniform float uWidth;   // @param label="Line width" min=0.3 max=6 step=0.1 default=1.3
uniform float uSmooth;  // @param label="Smoothing" min=1 max=32 step=0.5 default=6
uniform float uFill;    // @param label="Fill" min=0 max=1 step=0.01 default=0

vec4 effect(vec2 uv) {
  vec3 src = img(uv).rgb;
  float t = luma(textureLod(uImage, uv, log2(max(uSmooth * outScale(), 1.0))).rgb);
  float f = t * uLevels;
  float d = abs(fract(f + 0.5) - 0.5);
  float w = max(fwidth(f), 1e-5);
  float line = clamp(uWidth * outScale() * 0.5 - d / w + 0.5, 0.0, 1.0);
  vec3 fillCol = uPalOriginal ? src * 0.6 : pal(floor(f) / uLevels);
  float a = max(line, uFill);
  return vec4(mix(fillCol, ink(t, src), line / max(a, 0.001)), a);
}
