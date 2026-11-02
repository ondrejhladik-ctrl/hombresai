// @name Chromatic Aberration
// @category Glitch
// @description Color fringes like a cheap lens – red and blue drift apart toward the edges.
// @palette original
// @animated param=uPulse
// @preset name="Prism Split" uMode=1 uAmount=14 uBlur=0

uniform float uAmount;   // @param label="Amount" min=0 max=40 step=0.1 default=8
uniform int uMode;       // @param label="Direction" options="Radial (lens),Horizontal,Vertical" default=0
uniform float uFalloff;  // @param label="Edge falloff" min=0 max=3 step=0.01 default=1.2 show="uMode==0"
uniform float uBlur;     // @param label="Smear" min=0 max=1 step=0.01 default=0.4
uniform float uPulse;    // @param label="Pulse speed" min=0 max=4 step=0.01 default=0

vec4 effect(vec2 uv) {
  vec2 c = uv - 0.5;
  vec2 dir = uMode == 0 ? c * pow(max(length(c) * 2.0, 1e-4), uFalloff) : (uMode == 1 ? vec2(0.5, 0.0) : vec2(0.0, 0.5));
  float amount = uAmount * (1.0 + 0.6 * sin(uTime * uPulse * 3.0) * step(0.001, uPulse));
  vec2 off = dir * amount * 2.0 / uSize;
  float r = 0.0;
  float b = 0.0;
  for (int i = 0; i < 8; i++) {
    float k = 1.0 - uBlur * float(i) / 7.0;
    r += img(uv + off * k).r;
    b += img(uv - off * k).b;
  }
  vec3 col = vec3(r / 8.0, img(uv).g, b / 8.0);
  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);
}
