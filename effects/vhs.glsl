// @name VHS Tape
// @category Glitch
// @description A worn videotape – tracking wobble, color bleed, noise and a curved CRT screen.
// @palette original
// @finish scanlines=0.35 vignette=0.5
// @animated

uniform float uWobble;  // @param label="Tracking wobble" min=0 max=8 step=0.1 default=2
uniform float uBleed;   // @param label="Color bleed" min=0 max=12 step=0.1 default=4
uniform float uNoise;   // @param label="Tape noise" min=0 max=1 step=0.01 default=0.25
uniform float uCurve;   // @param label="Screen curve" min=0 max=0.3 step=0.005 default=0.08

vec4 effect(vec2 uv) {
  vec2 c = uv - 0.5;
  vec2 cuv = 0.5 + c * (1.0 + uCurve * dot(c, c) * 4.0);
  if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) return vec4(0.0, 0.0, 0.0, 1.0);
  float line = floor(cuv.y * uSize.y);
  float frame = floor(uTime * 30.0);
  float wob = (hash(vec2(line, frame)) - 0.5) * uWobble + sin(cuv.y * 40.0 + uTime * 3.0) * uWobble * 0.3;
  vec2 p = cuv + vec2(wob / uSize.x, 0.0);
  vec2 b = vec2(uBleed / uSize.x, 0.0);
  vec3 col = vec3(img(p + b).r, img(p).g, img(p - b).b);
  col += (hash(vec2(floor(p.x * uSize.x * 0.5), line + frame * 17.0)) - 0.5) * uNoise * 0.5;
  float roll = fract(uTime * 0.12);
  col += smoothstep(0.03, 0.0, abs(cuv.y - roll)) * uNoise * hash(vec2(p.x * 300.0, line));
  vec3 outc = uPalOriginal ? col : palSmooth(clamp(luma(col), 0.0, 1.0));
  return vec4(clamp(outc, 0.0, 1.0), 1.0);
}
