// @name Relief
// @category Edges
// @description Embossed metal or paper – the image pressed into a surface lit from one side.
// @palette original
// @preset name="Gold Foil" uDepth=3 palette=gold glow=0.25

uniform float uDepth;   // @param label="Depth" min=0 max=8 step=0.05 default=2.5
uniform float uLight;   // @param label="Light angle" min=0 max=360 step=1 default=135
uniform float uSoft;    // @param label="Softness" min=0.5 max=8 step=0.1 default=1.5
uniform float uColor;   // @param label="Keep color" min=0 max=1 step=0.01 default=0 show="original"

float lumAt(vec2 uv, float lod) {
  return luma(textureLod(uImage, uv, lod).rgb);
}

vec4 effect(vec2 uv) {
  vec2 o = uSoft / uSize;
  float lod = log2(max(uSoft * outScale(), 1.0));
  float dx = lumAt(uv - vec2(o.x, 0.0), lod) - lumAt(uv + vec2(o.x, 0.0), lod);
  float dy = lumAt(uv - vec2(0.0, o.y), lod) - lumAt(uv + vec2(0.0, o.y), lod);
  vec3 n = normalize(vec3(dx * uDepth, dy * uDepth, 1.0));
  vec3 l = normalize(vec3(rot(vec2(1.0, 0.0), uLight), 0.8));
  float shade = clamp(dot(n, l), 0.0, 1.0);
  if (!uPalOriginal) return vec4(palSmooth(shade), 1.0);
  vec3 base = mix(vec3(0.62), img(uv).rgb, uColor);
  return vec4(clamp(base * (0.35 + shade), 0.0, 1.0), 1.0);
}
