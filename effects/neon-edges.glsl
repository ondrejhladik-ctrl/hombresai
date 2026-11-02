// @name Neon Edges
// @category Edges
// @description Outlines traced in glowing neon – the colors follow the brightness of the image.
// @palette synth
// @finish glow=0.75 glowSize=18
// @preset name="Chalk" uStrength=2.5 uWidth=1.2 uBase=0 palette=mono glow=0.15

uniform float uStrength;  // @param label="Edge strength" min=0.5 max=10 step=0.1 default=3.5
uniform float uWidth;     // @param label="Line width" min=0.5 max=8 step=0.1 default=1.5
uniform float uBase;      // @param label="Original image" min=0 max=1 step=0.01 default=0.1

float lumAt(vec2 uv, float lod) {
  return luma(textureLod(uImage, uv, lod).rgb);
}

vec4 effect(vec2 uv) {
  vec2 o = uWidth / uSize;
  float lod = log2(max(uWidth * outScale(), 1.0));
  float tl = lumAt(uv + vec2(-o.x, o.y), lod);
  float tc = lumAt(uv + vec2(0.0, o.y), lod);
  float tr = lumAt(uv + vec2(o.x, o.y), lod);
  float ml = lumAt(uv + vec2(-o.x, 0.0), lod);
  float mr = lumAt(uv + vec2(o.x, 0.0), lod);
  float bl = lumAt(uv + vec2(-o.x, -o.y), lod);
  float bc = lumAt(uv + vec2(0.0, -o.y), lod);
  float br = lumAt(uv + vec2(o.x, -o.y), lod);
  float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
  float gy = (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br);
  float e = clamp(length(vec2(gx, gy)) * uStrength * 0.5, 0.0, 1.0);
  vec3 src = img(uv).rgb;
  vec3 col = uPalOriginal ? src / max(max(src.r, max(src.g, src.b)), 0.05) : ink(luma(src), src);
  float a = clamp(e + uBase, 0.0, 1.0);
  return vec4(mix(src, col, e / max(a, 0.001)), a);
}
