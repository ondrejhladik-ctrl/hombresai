// @name Signal Jitter
// @category Glitch
// @description Lines of the picture slip sideways like a bad video signal, with a rolling sync bar.
// @palette original
// @animated param=uSpeed

uniform float uShift;    // @param label="Shift" min=0 max=200 step=1 default=40
uniform float uLines;    // @param label="Line height" min=1 max=40 step=1 default=3
uniform float uChance;   // @param label="Amount" min=0 max=1 step=0.01 default=0.3
uniform float uWave;     // @param label="Wave" min=0 max=60 step=0.5 default=6
uniform float uBar;      // @param label="Sync bar" min=0 max=1 step=0.01 default=0.4
uniform float uSpeed;    // @param label="Speed" min=0 max=4 step=0.01 default=1

vec4 effect(vec2 uv) {
  vec2 px = uv * uSize;
  float t = uTime * uSpeed;
  float line = floor(px.y / uLines);
  float frame = floor(t * 12.0);
  float shift = hash(vec2(line, frame)) < uChance ? (hash(vec2(line + 5.0, frame)) - 0.5) * 2.0 * uShift : 0.0;
  shift += sin(px.y * 0.05 + t * 4.0) * uWave;
  vec3 c = img((px + vec2(shift, 0.0)) / uSize).rgb;
  float bar = fract(uv.y * 0.7 + t * 0.25);
  c *= 1.0 - uBar * 0.6 * smoothstep(0.0, 0.06, bar) * smoothstep(0.14, 0.06, bar);
  return vec4(uPalOriginal ? c : palSmooth(luma(c)), 1.0);
}
