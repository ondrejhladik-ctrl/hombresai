// @name Pixel Smear
// @category Glitch
// @description A pixel-sorting look – bright areas drip and streak in one direction.
// @palette original
// @preset name="Neon Drip" uLength=180 uThreshold=0.45 palette=synth glow=0.4

uniform float uLength;     // @param label="Length" min=0 max=400 step=1 default=120
uniform float uThreshold;  // @param label="Threshold" min=0 max=1 step=0.01 default=0.5
uniform float uAngle;      // @param label="Direction" min=0 max=360 step=1 default=270
uniform float uFade;       // @param label="Fade" min=0 max=1 step=0.01 default=0.35

vec4 effect(vec2 uv) {
  vec2 dir = rot(vec2(1.0, 0.0), uAngle) / uSize;
  vec3 best = img(uv).rgb;
  float bestL = luma(best);
  for (int i = 1; i <= 48; i++) {
    float k = float(i) / 48.0;
    vec3 s = img(uv - dir * k * uLength).rgb;
    float l = luma(s) * (1.0 - k * uFade);
    if (l > uThreshold && l > bestL) {
      best = s * (1.0 - k * uFade);
      bestL = l;
    }
  }
  vec3 col = uPalOriginal ? best : palSmooth(clamp(luma(best), 0.0, 1.0));
  return vec4(col, 1.0);
}
