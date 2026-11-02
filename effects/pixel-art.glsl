// @name Pixel Art
// @category Pixel
// @description Chunky pixels snapped to a palette – sprite and retro-console looks.
// @palette pico8
// @preset name="Game Boy" uCell=6 uNearest=false palette=gameboy
// @preset name="CGA Pop" uCell=5 palette=cga

uniform float uCell;    // @param label="Pixel size" min=1 max=64 step=1 default=8
uniform bool uNearest;  // @param label="Closest palette color" default=true
uniform float uLevels;  // @param label="Color levels" min=2 max=16 step=1 default=6 show="original"

vec4 effect(vec2 uv) {
  vec2 cell = floor(uv * uSize / uCell);
  vec3 c = imgCell((cell + 0.5) * uCell / uSize, uCell).rgb;
  if (uPalOriginal) {
    float l = uLevels - 1.0;
    return vec4(floor(c * l + 0.5) / l, 1.0);
  }
  int i = uNearest ? nearestIndex(c) : palIndex(luma(c));
  return paletteOut(i);
}
