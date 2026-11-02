// @name Line Screen
// @category Lines
// @description Parallel lines whose thickness follows the light – scan-line and engraving looks.
// @palette acid
// @finish glow=0.25
// @preset name="Engraving" uCell=4 uAngle=30 uPaper=true palette=sepia glow=0

uniform float uCell;   // @param label="Line spacing" min=2 max=40 step=0.5 default=6
uniform float uAngle;  // @param label="Angle" min=0 max=180 step=1 default=0
uniform bool uPaper;   // @param label="Ink on paper" default=false

vec4 effect(vec2 uv) {
  vec2 r = rot(uv * uSize, -uAngle);
  float row = floor(r.y / uCell);
  vec2 center = rot(vec2(r.x, (row + 0.5) * uCell), uAngle);
  vec3 c = imgCell(center / uSize, uCell * 0.75).rgb;
  float t = inkAmount(luma(c));
  float d = abs(fract(r.y / uCell) - 0.5);
  return vec4(ink(t, c), cover(d, 0.5 * t));
}
