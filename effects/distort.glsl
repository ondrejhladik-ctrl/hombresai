// @name Distort
// @category Distort
// @description Swirl, ripple, bulge, pinch or wave the picture – it moves while Speed is above 0.
// @palette original
// @animated param=uSpeed
// @preset name="Ripple" uMode=1 uAmount=1.2 uFreq=14 uSpeed=0.8
// @preset name="Fisheye" uMode=2 uAmount=1.3 uRadius=0.9

uniform int uMode;       // @param label="Mode" options="Swirl,Ripple,Bulge,Pinch,Waves" default=0
uniform float uAmount;   // @param label="Amount" min=-2 max=2 step=0.01 default=0.8
uniform float uRadius;   // @param label="Radius" min=0.05 max=1.5 step=0.01 default=0.6
uniform float uFreq;     // @param label="Frequency" min=1 max=60 step=0.5 default=12 show="uMode==1"
uniform float uCenterX;  // @param label="Center X" min=0 max=1 step=0.01 default=0.5
uniform float uCenterY;  // @param label="Center Y" min=0 max=1 step=0.01 default=0.5
uniform float uSpeed;    // @param label="Speed" min=0 max=4 step=0.01 default=0

vec4 effect(vec2 uv) {
  float aspect = uSize.x / uSize.y;
  vec2 center = vec2(uCenterX, uCenterY);
  vec2 d = (uv - center) * vec2(aspect, 1.0);
  float r = length(d);
  float t = uTime * uSpeed;
  float k = clamp(1.0 - r / uRadius, 0.0, 1.0);
  vec2 q = d;
  if (uMode == 0) q = rot(d, degrees(uAmount * 3.0 * k * k + t * k));
  else if (uMode == 1) q = d + normalize(d + 1e-6) * sin(r * uFreq * TAU - t * 4.0) * 0.02 * uAmount * k;
  else if (uMode == 2) q = d * (1.0 - uAmount * 0.5 * k * k);
  else if (uMode == 3) q = d * (1.0 + uAmount * 0.5 * k * k);
  else q = d + vec2(sin(d.y * 36.0 + t * 3.0), sin(d.x * 36.0 + t * 2.0)) * 0.015 * uAmount;
  vec2 s = center + q / vec2(aspect, 1.0);
  s = 1.0 - abs(1.0 - mod(s, 2.0));
  vec3 col = img(s).rgb;
  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);
}
