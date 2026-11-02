// @name Bit Crush
// @category Glitch
// @description Digital decay – fewer bits per color, plus bit patterns that tear the image into bands.
// @palette original
// @animated param=uSpeed
// @preset name="XOR Storm" uBits=4 uMode=1 uAmount=0.8 uScale=2 uSpeed=0.5

uniform float uBits;     // @param label="Bits per channel" min=1 max=8 step=1 default=3
uniform int uMode;       // @param label="Glitch" options="None,XOR pattern,Bit shift bands,Channel swap bands" default=1
uniform float uAmount;   // @param label="Amount" min=0 max=1 step=0.01 default=0.5 show="uMode>0"
uniform float uScale;    // @param label="Pattern scale" min=1 max=32 step=1 default=4 show="uMode>0"
uniform float uSpeed;    // @param label="Speed" min=0 max=4 step=0.01 default=0 show="uMode>0"

vec4 effect(vec2 uv) {
  vec3 c = img(uv).rgb;
  int bits = int(uBits);
  int maxv = (1 << bits) - 1;
  float levels = float(maxv);
  ivec3 q = ivec3(floor(c * levels + 0.5));
  float t = floor(uTime * uSpeed * 8.0);
  vec2 cell = floor(uv * uSize / uScale);
  float band = floor(uv.y * uSize.y / (uScale * 6.0));
  if (uMode == 1) {
    ivec2 p = ivec2(cell + t);
    if (hash(cell + t * 0.37) < uAmount) q = q ^ ivec3((p.x ^ p.y) & maxv);
  } else if (uMode == 2) {
    if (hash(vec2(band, t)) < uAmount) {
      int s = int(hash(vec2(band + 9.0, t)) * float(bits));
      q = ((q << s) | (q >> (bits - s))) & maxv;
    }
  } else if (uMode == 3) {
    if (hash(vec2(band, t + 3.0)) < uAmount) q = q.gbr;
  }
  vec3 col = vec3(q) / levels;
  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);
}
