// @name Glitch
// @category Glitch
// @description Torn slices, RGB split and digital noise – it moves while Speed is above 0.
// @palette original
// @animated param=uSpeed

uniform float uShift;   // @param label="RGB split" min=0 max=40 step=0.5 default=6
uniform float uSlices;  // @param label="Slices" min=0 max=60 step=1 default=16
uniform float uOffset;  // @param label="Slice offset" min=0 max=200 step=1 default=40
uniform float uNoise;   // @param label="Noise" min=0 max=1 step=0.01 default=0.15
uniform float uSpeed;   // @param label="Speed" min=0 max=4 step=0.01 default=1
uniform float uSeed;    // @param label="Seed" min=1 max=99 step=1 default=7

vec4 effect(vec2 uv) {
  float tm = floor(uTime * uSpeed * 10.0);
  vec2 px = uv * uSize;
  float band = floor((1.0 - uv.y) * max(uSlices, 1.0) * 3.0);
  float shift = 0.0;
  if (uSlices > 0.0 && hash(vec2(band, uSeed + tm)) > 1.0 - uSlices / 90.0) {
    shift = (hash(vec2(band + 17.0, uSeed - tm)) - 0.5) * 2.0 * uOffset;
  }
  vec2 p = px + vec2(shift, 0.0);
  vec2 s = vec2(uShift, 0.0);
  vec3 c = vec3(img((p + s) / uSize).r, img(p / uSize).g, img((p - s) / uSize).b);
  c += (hash(floor(px) + tm * 13.1) - 0.5) * uNoise;
  float line = step(0.996, hash(vec2(floor(px.y), tm + uSeed)));
  c = mix(c, vec3(1.0), line * uNoise);
  vec3 col = uPalOriginal ? c : palSmooth(clamp(luma(c), 0.0, 1.0));
  return vec4(clamp(col, 0.0, 1.0), 1.0);
}
