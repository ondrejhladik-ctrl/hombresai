// @name Waveform
// @category Lines
// @description Flowing lines that bend and swell with the light – glows beautifully.
// @palette violet
// @finish glow=0.6 glowSize=16
// @animated param=uSpeed
// @preset name="Acid Waves" uCell=6 uFreq=6 uAmp=0.35 uWarp=2.2 palette=acid glow=0.35
// @preset name="Signal" uCell=5 uFreq=20 uAmp=0.25 uWarp=0.6 uSpeed=0.6 palette=phosphor glow=0.5

uniform float uCell;    // @param label="Line spacing" min=2 max=40 step=0.5 default=7
uniform float uFreq;    // @param label="Wave density" min=0 max=40 step=0.5 default=12
uniform float uAmp;     // @param label="Wave height" min=0 max=3 step=0.01 default=0.6
uniform float uWarp;    // @param label="Image warp" min=0 max=4 step=0.01 default=1.2
uniform float uAngle;   // @param label="Angle" min=0 max=180 step=1 default=0
uniform float uSpeed;   // @param label="Speed" min=0 max=4 step=0.01 default=0
uniform bool uPaper;    // @param label="Ink on paper" default=false

vec4 effect(vec2 uv) {
  vec2 r = rot(uv * uSize, -uAngle);
  vec3 c = imgCell(uv, uCell).rgb;
  float lum = luma(c);
  float t = inkAmount(lum);
  float wave = sin(r.x / uSize.x * uFreq * TAU + uTime * uSpeed * 3.0) * uAmp * uCell;
  float y = r.y + wave + lum * uWarp * uCell;
  float d = abs(fract(y / uCell) - 0.5);
  return vec4(ink(t, c), cover(d, 0.5 * t));
}
