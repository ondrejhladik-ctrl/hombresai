// @name JPEG Glitch
// @category Glitch
// @description Broken compression – blocky artefacts, shifted blocks, swapped colors and ringing.
// @palette original
// @animated param=uSpeed
// @preset name="Datamosh" uBlock=16 uQuality=0.1 uCorrupt=0.75 uChroma=0.9 uSpeed=0.6

uniform float uBlock;    // @param label="Block size" min=4 max=64 step=1 default=12
uniform float uQuality;  // @param label="Quality" min=0 max=1 step=0.01 default=0.25
uniform float uCorrupt;  // @param label="Corruption" min=0 max=1 step=0.01 default=0.35
uniform float uChroma;   // @param label="Color bleed" min=0 max=1 step=0.01 default=0.6
uniform float uSpeed;    // @param label="Speed" min=0 max=4 step=0.01 default=0
uniform float uSeed;     // @param label="Seed" min=1 max=99 step=1 default=11

vec3 toYcc(vec3 c) {
  return vec3(dot(c, vec3(0.299, 0.587, 0.114)), dot(c, vec3(-0.1687, -0.3313, 0.5)) + 0.5, dot(c, vec3(0.5, -0.4187, -0.0813)) + 0.5);
}

vec3 toRgb(vec3 y) {
  float cb = y.y - 0.5;
  float cr = y.z - 0.5;
  return vec3(y.x + 1.402 * cr, y.x - 0.344136 * cb - 0.714136 * cr, y.x + 1.772 * cb);
}

vec4 effect(vec2 uv) {
  float tm = floor(uTime * uSpeed * 6.0);
  vec2 px = uv * uSize;
  vec2 block = floor(px / uBlock);
  float h = hash(block + vec2(uSeed, tm));
  // corrupted blocks show data from elsewhere in the row (or a row nearby)
  vec2 src = block;
  if (h < uCorrupt * 0.5) src.x += floor((hash(block.yx + uSeed + tm) - 0.5) * 12.0);
  if (h > 1.0 - uCorrupt * 0.15) src.y += floor((hash(block + 3.1 + tm) - 0.5) * 4.0);
  vec2 local = px - block * uBlock;
  vec3 ycc = toYcc(img((src * uBlock + local) / uSize).rgb);
  vec3 avg = toYcc(imgCell((src + 0.5) * uBlock / uSize, uBlock).rgb);
  // low quality = flat blocks with few brightness steps
  ycc.x = mix(avg.x, ycc.x, mix(0.15, 1.0, uQuality));
  float steps = mix(4.0, 32.0, uQuality);
  ycc.x = floor(ycc.x * steps + 0.5) / steps;
  // colour is stored at half resolution and coarsely – it bleeds over the blocks
  vec3 chroma = toYcc(imgCell((floor(src / 2.0) * 2.0 + 1.0) * uBlock / uSize, uBlock * 2.0).rgb);
  ycc.yz = mix(ycc.yz, floor(chroma.yz * 6.0 + 0.5) / 6.0, uChroma);
  if (h > 1.0 - uCorrupt * 0.25) ycc.yz = ycc.zy;
  // ringing inside the damaged blocks
  float ring = cos(PI * local.x / uBlock * (1.0 + floor(h * 4.0))) * cos(PI * local.y / uBlock * (1.0 + floor(h * 3.0)));
  ycc.x += ring * 0.08 * uCorrupt * step(h, uCorrupt);
  vec3 col = clamp(toRgb(ycc), 0.0, 1.0);
  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);
}
