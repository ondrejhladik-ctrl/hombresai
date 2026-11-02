// @name Stained Glass
// @category Pixel
// @description Irregular glass cells in the colors of the image, joined by dark lead lines.
// @palette original
// @preset name="Crystal" uCell=18 uLead=0.05 palette=ice glow=0.3

uniform float uCell;      // @param label="Cell size" min=6 max=120 step=1 default=28
uniform float uJitter;    // @param label="Irregularity" min=0 max=1 step=0.01 default=0.85
uniform float uLead;      // @param label="Lead width" min=0 max=0.3 step=0.005 default=0.08
uniform vec3 uLeadColor;  // @param label="Lead color" type=color default=#121212
uniform float uShade;     // @param label="Shading" min=0 max=1 step=0.01 default=0.35

vec2 site(vec2 cell) {
  return cell + 0.5 + (vec2(hash(cell), hash(cell + 17.3)) - 0.5) * uJitter;
}

vec4 effect(vec2 uv) {
  vec2 p = uv * uSize / uCell;
  vec2 base = floor(p);
  float d1 = 1e9;
  float d2 = 1e9;
  vec2 best = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 s = site(base + vec2(float(i), float(j)));
      float d = length(p - s);
      if (d < d1) { d2 = d1; d1 = d; best = s; }
      else if (d < d2) { d2 = d; }
    }
  }
  vec3 c = imgCell(best * uCell / uSize, uCell * 0.8).rgb;
  vec3 col = uPalOriginal ? c : nearestColor(c);
  col *= 1.0 - uShade * smoothstep(0.0, 0.7, d1);
  col = mix(col, uLeadColor, cover(d2 - d1, uLead));
  return vec4(col, 1.0);
}
