// @name Halftone
// @category Print
// @description A rotated dot screen like a printed magazine – dots grow with the ink (or the light).
// @palette newsprint
// @preset name="Pop Dots" uCell=12 uPaper=false palette=synth glow=0.3
// @preset name="Comic Lines" uCell=8 uShape=3 uAngle=30 palette=blood

uniform float uCell;    // @param label="Dot spacing" min=3 max=60 step=0.5 default=9
uniform float uAngle;   // @param label="Angle" min=0 max=90 step=1 default=45
uniform int uShape;     // @param label="Shape" options="Circle,Square,Diamond,Line" default=0
uniform bool uPaper;    // @param label="Ink on paper" default=true

vec4 effect(vec2 uv) {
  vec2 r = rot(uv * uSize, -uAngle);
  vec2 cell = floor(r / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec3 c = imgCell(rot(center, uAngle) / uSize, uCell).rgb;
  float t = inkAmount(luma(c));
  vec2 d = (r - center) / uCell;
  float dist;
  float size;
  if (uShape == 0) { dist = length(d); size = sqrt(t / PI); }
  else if (uShape == 1) { dist = max(abs(d.x), abs(d.y)); size = 0.5 * sqrt(t); }
  else if (uShape == 2) { dist = abs(d.x) + abs(d.y); size = sqrt(t * 0.5); }
  else { dist = abs(d.y); size = 0.5 * t; }
  return vec4(ink(t, c), cover(dist, size));
}
