// @name LED Wall
// @category Pixel
// @description A giant LED screen – round lights in the real colors of the image.
// @palette original
// @finish glow=0.45 glowSize=10
// @preset name="Scoreboard" uCell=8 uRound=false uGap=0.25 palette=amber glow=0.6

uniform float uCell;   // @param label="LED size" min=3 max=48 step=1 default=10
uniform float uGap;    // @param label="Gap" min=0 max=0.7 step=0.01 default=0.2
uniform bool uRound;   // @param label="Round LEDs" default=true
uniform float uBoost;  // @param label="Brightness" min=0.5 max=2.5 step=0.01 default=1.25

vec4 effect(vec2 uv) {
  vec2 px = uv * uSize;
  vec2 cell = floor(px / uCell);
  vec2 d = (px - (cell + 0.5) * uCell) / uCell;
  vec3 c = imgCell((cell + 0.5) * uCell / uSize, uCell).rgb;
  float dist = uRound ? length(d) : max(abs(d.x), abs(d.y));
  float a = cover(dist, 0.5 - uGap * 0.5);
  vec3 col = uPalOriginal ? min(c * uBoost, 1.0) : pal(min(luma(c) * uBoost, 1.0));
  return vec4(col, a);
}
