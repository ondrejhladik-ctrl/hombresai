// @name ASCII
// @category Text
// @description Your image rebuilt from characters – pick a character set or type your own text.
// @palette gold
// @finish glow=0.4
// @animated param=uSpeed
// @preset name="Matrix Rain" uCharset=matrix uCell=12 uSpeed=1 palette=phosphor glow=0.55
// @preset name="Amber Terminal" uCharset=dense uCell=8 palette=amber glow=0.4 scanlines=0.35
// @preset name="Your Words" uCharset=text uCell=11 palette=violet glow=0.45

uniform float uCell;     // @param label="Character size" min=4 max=48 step=1 default=10
uniform int uCharset;    // @param label="Characters" type=charset default=classic
uniform float uOffset;   // @param label="Character offset" min=0 max=8 step=1 default=0
uniform float uCutoff;   // @param label="Cut-off" min=0 max=0.6 step=0.01 default=0.06
uniform float uSpeed;    // @param label="Flicker speed" min=0 max=4 step=0.01 default=0
uniform bool uPaper;     // @param label="Ink on paper" default=false

vec4 effect(vec2 uv) {
  vec2 cellSize = vec2(uCell * 0.6, uCell);
  vec2 px = uv * uSize;
  vec2 cell = floor(px / cellSize);
  vec2 local = fract(px / cellSize);
  vec3 c = imgCell((cell + 0.5) * cellSize / uSize, uCell).rgb;
  float t = inkAmount(luma(c));
  if (t < uCutoff) return vec4(ink(t, c), 0.0);
  int count = max(uGlyphCount, 1);
  int i;
  if (uGlyphMode == 1) {
    float cols = ceil(uSize.x / cellSize.x);
    float row = floor(uSize.y / cellSize.y) - cell.y;
    i = int(mod(row * cols + cell.x + row * uOffset, float(count)));
  } else if (uGlyphMode == 2) {
    i = int(hash(cell + floor(uTime * uSpeed * 6.0 + hash(cell.xx) * 4.0)) * float(count));
  } else {
    i = int(floor(t * float(count - 1) + 0.5 + uOffset));
  }
  return vec4(ink(t, c), glyph(i, local, uCell));
}
