// @name CMYK Halftone
// @category Print
// @description Four rotated ink screens – cyan, magenta, yellow and black – like real offset print.
// @palette original
// @preset name="Comic Print" uCell=10 uInk=1.15 uBlack=0.9 uPaperTone=#fff4dc
// @preset name="Fine Print" uCell=4 uInk=1 uBlack=0.7

uniform float uCell;       // @param label="Screen size" min=3 max=40 step=0.5 default=8
uniform float uInk;        // @param label="Ink" min=0.3 max=2 step=0.01 default=1
uniform float uBlack;      // @param label="Black generation" min=0 max=1 step=0.01 default=0.8
uniform float uRotation;   // @param label="Screen rotation" min=0 max=90 step=1 default=0
uniform vec3 uPaperTone;   // @param label="Paper" type=color default=#ffffff

vec4 toCmyk(vec3 c) {
  float k = (1.0 - max(c.r, max(c.g, c.b))) * uBlack;
  vec3 cmy = (1.0 - c - k) / max(1.0 - k, 0.001);
  return vec4(clamp(cmy, 0.0, 1.0), k);
}

// coverage of one ink: dots on a screen rotated by `angle`, sized by that ink's amount at the dot centre
float screen(vec2 px, float angle, int ink) {
  vec2 r = rot(px, -angle);
  vec2 cell = floor(r / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec4 s = toCmyk(imgCell(rot(center, angle) / uSize, uCell).rgb);
  float amount = ink == 0 ? s.x : (ink == 1 ? s.y : (ink == 2 ? s.z : s.w));
  amount = clamp(amount * uInk, 0.0, 1.0);
  return cover(length((r - center) / uCell), sqrt(amount / PI));
}

vec4 effect(vec2 uv) {
  vec2 px = uv * uSize;
  float c = screen(px, 15.0 + uRotation, 0);
  float m = screen(px, 75.0 + uRotation, 1);
  float y = screen(px, uRotation, 2);
  float k = screen(px, 45.0 + uRotation, 3);
  vec3 col = uPaperTone;
  col *= mix(vec3(1.0), vec3(0.0, 0.68, 0.94), c);
  col *= mix(vec3(1.0), vec3(0.93, 0.0, 0.55), m);
  col *= mix(vec3(1.0), vec3(1.0, 0.93, 0.0), y);
  col *= mix(vec3(1.0), vec3(0.1), k);
  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);
}
