// @name Ordered Dither
// @category Dither
// @description Threshold-matrix dithering – crisp 1-bit, pattern and retro looks that stay stable on video.
// @palette mono
// @animated param=uShimmer
// @preset name="Mac Classic" uCell=2 uPattern=2 palette=newsprint
// @preset name="Handheld Dither" uCell=3 uPattern=1 palette=gameboy
// @preset name="Clustered Print" uCell=2 uPattern=4 palette=sepia
// @preset name="Thermal Dither" uCell=2 uPattern=3 palette=thermal glow=0.35
// @preset name="Blue Noise" uCell=1 uPattern=8 palette=mono
// @preset name="Ring Pattern" uCell=2 uPattern=10 palette=synth glow=0.3
// @preset name="Hard Threshold" uCell=1 uSpread=0 palette=mono

uniform float uCell;     // @param label="Pixel size" min=1 max=16 step=1 default=2
uniform int uPattern;    // @param label="Pattern" options="Bayer 2×2,Bayer 4×4,Bayer 8×8,Bayer 16×16,Clustered dots,Lines,Diagonal lines,Noise,Blue noise,Crosses,Rings,Waves,Checker,Diamonds" default=2
uniform float uSpread;   // @param label="Spread" min=0 max=1.5 step=0.01 default=1
uniform float uShimmer;  // @param label="Shimmer (animate)" min=0 max=4 step=0.01 default=0
uniform float uLevels;   // @param label="Color levels" min=2 max=8 step=1 default=3 show="original"

float threshold(vec2 cell) {
  if (uPattern <= 3) return bayer(cell, uPattern == 0 ? 2 : (uPattern == 1 ? 4 : (uPattern == 2 ? 8 : 16)));
  if (uPattern == 4) return 0.5 + 0.25 * (cos(TAU * cell.x / 6.0) + cos(TAU * cell.y / 6.0));
  if (uPattern == 5) return fract((cell.y + 0.5) / 4.0);
  if (uPattern == 6) return fract((cell.x + cell.y + 0.5) / 6.0);
  if (uPattern == 7) return ign(cell);
  if (uPattern == 8) return blueNoise(cell);
  if (uPattern == 9) {
    vec2 f = abs(fract(cell / 6.0) - 0.5);
    return min(f.x, f.y) * 2.0;
  }
  if (uPattern == 10) return fract(length(cell - uSize / uCell * 0.5) / 5.0);
  if (uPattern == 11) return fract((cell.y + 2.0 * sin(cell.x * 0.35)) / 5.0);
  if (uPattern == 12) return mod(cell.x + cell.y, 2.0) * 0.5 + 0.25;
  vec2 f = abs(fract(cell / 6.0) - 0.5);
  return f.x + f.y;
}

vec4 effect(vec2 uv) {
  vec2 cell = floor(uv * uSize / uCell);
  vec3 c = imgCell((cell + 0.5) * uCell / uSize, uCell).rgb;
  vec2 shift = floor(uTime * uShimmer * 12.0) * vec2(3.0, 7.0);
  float th = (threshold(cell + shift) - 0.5) * uSpread;
  if (uPalOriginal) {
    float l = uLevels - 1.0;
    return vec4(clamp(floor(c * l + 0.5 + th), 0.0, l) / l, 1.0);
  }
  float top = float(uPalN - 1);
  int i = int(clamp(floor(luma(c) * top + 0.5 + th), 0.0, top));
  return paletteOut(i);
}
