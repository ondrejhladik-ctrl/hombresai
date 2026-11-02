// @name Crosshatch
// @category Print
// @description Pen-and-ink hatching that layers up in the shadows.
// @palette sepia
// @preset name="Blueprint Sketch" uCell=6 uWeight=0.18 uPaper=false palette=blueprint

uniform float uCell;    // @param label="Spacing" min=3 max=30 step=0.5 default=7
uniform float uWeight;  // @param label="Line weight" min=0.05 max=0.6 step=0.01 default=0.22
uniform bool uPaper;    // @param label="Ink on paper" default=true

float hatch(vec2 px, float angle, float spacing) {
  vec2 r = rot(px, -angle);
  return cover(abs(fract(r.y / spacing) - 0.5), uWeight * 0.5);
}

vec4 effect(vec2 uv) {
  vec2 px = uv * uSize;
  vec3 c = imgCell(uv, uCell * 0.5).rgb;
  float t = inkAmount(luma(c));
  float a = hatch(px, 45.0, uCell) * smoothstep(0.08, 0.16, t);
  a = max(a, hatch(px, -45.0, uCell) * smoothstep(0.30, 0.38, t));
  a = max(a, hatch(px, 0.0, uCell) * smoothstep(0.52, 0.60, t));
  a = max(a, hatch(px, 90.0, uCell * 0.5) * smoothstep(0.74, 0.82, t));
  return vec4(ink(t, c), a);
}
