// @name Grain Dither
// @category Dither
// @description Noise-based dithering with a film-grain feel – switch on the animation for video.
// @palette mono
// @animated param=uAnimate
// @preset name="Night Vision" uCell=2 uAnimate=true palette=phosphor glow=0.45 scanlines=0.35 vignette=0.6

uniform float uCell;     // @param label="Pixel size" min=1 max=12 step=1 default=1
uniform float uSpread;   // @param label="Spread" min=0 max=1.5 step=0.01 default=1
uniform bool uAnimate;   // @param label="Animate grain" default=false
uniform float uLevels;   // @param label="Color levels" min=2 max=8 step=1 default=3 show="original"

vec4 effect(vec2 uv) {
  vec2 cell = floor(uv * uSize / uCell);
  vec3 c = imgCell((cell + 0.5) * uCell / uSize, uCell).rgb;
  float frame = uAnimate ? floor(uTime * 24.0) : 0.0;
  float th = (ign(cell + frame * vec2(5.588238, 3.17)) - 0.5) * uSpread;
  if (uPalOriginal) {
    float l = uLevels - 1.0;
    return vec4(clamp(floor(c * l + 0.5 + th), 0.0, l) / l, 1.0);
  }
  float top = float(uPalN - 1);
  int i = int(clamp(floor(luma(c) * top + 0.5 + th), 0.0, top));
  return paletteOut(i);
}
