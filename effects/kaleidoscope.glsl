// @name Kaleidoscope
// @category Distort
// @description Mirrored slices around the center – set a spin speed to make it turn.
// @palette original
// @animated param=uSpin

uniform float uSegments;  // @param label="Segments" min=2 max=24 step=1 default=8
uniform float uRotate;    // @param label="Rotation" min=0 max=360 step=1 default=0
uniform float uZoom;      // @param label="Zoom" min=0.3 max=3 step=0.01 default=1
uniform float uSpin;      // @param label="Spin speed" min=-2 max=2 step=0.01 default=0

vec4 effect(vec2 uv) {
  float m = min(uSize.x, uSize.y);
  vec2 p = (uv - 0.5) * uSize / m;
  float a = atan(p.y, p.x) + radians(uRotate) + uTime * uSpin;
  float r = length(p) / uZoom;
  float seg = TAU / uSegments;
  a = mod(a, seg);
  a = abs(a - seg * 0.5);
  vec2 s = 0.5 + vec2(cos(a), sin(a)) * r * m / uSize;
  s = 1.0 - abs(1.0 - mod(s, 2.0));
  vec3 c = img(s).rgb;
  return vec4(uPalOriginal ? c : palSmooth(luma(c)), 1.0);
}
