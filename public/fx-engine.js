'use strict';

// hombresai Effects engine – procedural image and video effects rendered on the GPU (WebGL2).
// An effect is a small GLSL file from the effects/ folder (see effects/README.md): a `vec4 effect(vec2 uv)`
// function plus `@param` uniforms that become sliders. Everything runs in the browser – no AI, no network.

const FX_DESIGN_LONG = 1080; // effect sizes are measured on this long side, whatever the output resolution

function fxHexToRgb(hex) {
  const n = parseInt(String(hex).slice(1, 7), 16) || 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function fxLuma(hex) {
  const [r, g, b] = fxHexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// First colour = background / darkest end of the ramp. Hardware palettes are sorted by brightness.
const FX_PALETTES = [
  { id: 'mono', group: 'Mono', label: 'Black & white', colors: ['#000000', '#ffffff'] },
  { id: 'newsprint', group: 'Mono', label: 'Newsprint', colors: ['#14110d', '#f1ece2'] },
  { id: 'amber', group: 'Mono', label: 'Amber terminal', colors: ['#0a0500', '#ffb000'] },
  { id: 'phosphor', group: 'Mono', label: 'Green phosphor', colors: ['#010903', '#3dff7e'] },
  { id: 'gold', group: 'Mono', label: 'Gold', colors: ['#000000', '#6b4e00', '#ffe14a'] },
  { id: 'blueprint', group: 'Mono', label: 'Blueprint', colors: ['#0b3a8c', '#e8f1ff'] },
  { id: 'violet', group: 'Neon', label: 'Violet glow', colors: ['#05010c', '#2c0c78', '#e0193f', '#b13ce6', '#ffa6f5'] },
  { id: 'acid', group: 'Neon', label: 'Acid', colors: ['#000000', '#5a2bff', '#7cff3a'] },
  { id: 'synth', group: 'Neon', label: 'Synthwave', colors: ['#0d0221', '#6a1b9a', '#ff2a6d', '#05d9e8'] },
  { id: 'blood', group: 'Neon', label: 'Blood moon', colors: ['#050000', '#4a0012', '#d1002c', '#ff9aa2'] },
  { id: 'ice', group: 'Neon', label: 'Ice', colors: ['#020814', '#0f3d6e', '#38b6ff', '#e8fbff'] },
  { id: 'thermal', group: 'Neon', label: 'Thermal', colors: ['#000000', '#2b0a5c', '#b8155b', '#ff6a00', '#ffe14d', '#ffffff'] },
  { id: 'gameboy', group: 'Retro', label: 'Game Boy', colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
  { id: 'cga', group: 'Retro', label: 'CGA', colors: ['#000000', '#ff55ff', '#55ffff', '#ffffff'] },
  { id: 'pico8', group: 'Retro', label: 'PICO-8', sort: true, colors: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'] },
  { id: 'c64', group: 'Retro', label: 'C64', sort: true, colors: ['#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55', '#0000aa', '#eeee77', '#dd8855', '#664400', '#ff7777', '#333333', '#777777', '#aaff66', '#0088ff', '#bbbbbb'] },
  { id: 'teletext', group: 'Retro', label: 'Teletext', colors: ['#000000', '#0000ff', '#ff0000', '#ff00ff', '#00ff00', '#00ffff', '#ffff00', '#ffffff'] },
  { id: 'sepia', group: 'Retro', label: 'Sepia', colors: ['#1a120b', '#5c4033', '#a67b5b', '#f1e3c8'] },
  { id: 'auto', group: 'Image', label: 'From your image', colors: null },
  { id: 'original', group: 'Image', label: 'Original colors', colors: null },
  { id: 'custom', group: 'Image', label: 'Custom', colors: null },
].map(p => (p.sort ? { ...p, colors: [...p.colors].sort((a, b) => fxLuma(a) - fxLuma(b)) } : p));

// Character sets for glyph(): mode 0 = ordered from empty to dense, 1 = the user's text, 2 = random (matrix).
const FX_CHARSETS = [
  { id: 'classic', label: 'Classic', chars: ' .:-=+*#%@' },
  { id: 'dense', label: 'Dense', chars: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$' },
  { id: 'blocks', label: 'Blocks', chars: ' ░▒▓█' },
  { id: 'binary', label: 'Binary', chars: ' 01' },
  { id: 'braille', label: 'Braille', chars: ' ⠁⠃⠇⠏⠟⠿⡿⣿' },
  { id: 'dots', label: 'Dots', chars: ' ·•●' },
  { id: 'hearts', label: 'Hearts', chars: ' ·♡♥' },
  { id: 'matrix', label: 'Matrix', chars: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789', mode: 2 },
  { id: 'text', label: 'Your text', chars: null, mode: 1 },
];

// Error-diffusion kernels: [dx, dy, weight] triples; the weights are divided by `div`.
const FX_KERNELS = [
  { id: 'floyd', label: 'Floyd–Steinberg', div: 16, taps: [1, 0, 7, -1, 1, 3, 0, 1, 5, 1, 1, 1] },
  { id: 'atkinson', label: 'Atkinson', div: 8, taps: [1, 0, 1, 2, 0, 1, -1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 2, 1] },
  { id: 'jjn', label: 'Jarvis–Judice–Ninke', div: 48, taps: [1, 0, 7, 2, 0, 5, -2, 1, 3, -1, 1, 5, 0, 1, 7, 1, 1, 5, 2, 1, 3, -2, 2, 1, -1, 2, 3, 0, 2, 5, 1, 2, 3, 2, 2, 1] },
  { id: 'stucki', label: 'Stucki', div: 42, taps: [1, 0, 8, 2, 0, 4, -2, 1, 2, -1, 1, 4, 0, 1, 8, 1, 1, 4, 2, 1, 2, -2, 2, 1, -1, 2, 2, 0, 2, 4, 1, 2, 2, 2, 2, 1] },
  { id: 'burkes', label: 'Burkes', div: 32, taps: [1, 0, 8, 2, 0, 4, -2, 1, 2, -1, 1, 4, 0, 1, 8, 1, 1, 4, 2, 1, 2] },
  { id: 'sierra', label: 'Sierra', div: 32, taps: [1, 0, 5, 2, 0, 3, -2, 1, 2, -1, 1, 4, 0, 1, 5, 1, 1, 4, 2, 1, 2, -1, 2, 2, 0, 2, 3, 1, 2, 2] },
  { id: 'sierra2', label: 'Two-row Sierra', div: 16, taps: [1, 0, 4, 2, 0, 3, -2, 1, 1, -1, 1, 2, 0, 1, 3, 1, 1, 2, 2, 1, 1] },
  { id: 'sierralite', label: 'Sierra Lite', div: 4, taps: [1, 0, 2, -1, 1, 1, 0, 1, 1] },
  { id: 'falsefloyd', label: 'False Floyd–Steinberg', div: 8, taps: [1, 0, 3, 0, 1, 3, 1, 1, 2] },
  { id: 'row', label: 'Row streaks (1D)', div: 1, taps: [1, 0, 1] },
  { id: 'column', label: 'Column streaks (1D)', div: 1, taps: [0, 1, 1] },
  { id: 'fan', label: 'Fan', div: 16, taps: [1, 0, 7, -2, 1, 1, -1, 1, 3, 0, 1, 5] },
  { id: 'shiaufan', label: 'Shiau–Fan', div: 8, taps: [1, 0, 4, -2, 1, 1, -1, 1, 1, 0, 1, 2] },
  { id: 'shiaufan2', label: 'Shiau–Fan 2', div: 16, taps: [1, 0, 8, -3, 1, 1, -2, 1, 1, -1, 1, 2, 0, 1, 4] },
  { id: 'stevensonarce', label: 'Stevenson–Arce', div: 200, taps: [2, 0, 32, -3, 1, 12, -1, 1, 26, 1, 1, 30, 3, 1, 16, -2, 2, 12, 0, 2, 26, 2, 2, 12, -3, 3, 5, -1, 3, 12, 1, 3, 12, 3, 3, 5] },
  { id: 'riemersma', label: 'Riemersma (Hilbert curve)', path: 'hilbert' },
];

const FX_FINISH_DEFAULTS ={ glow: 0, glowSize: 14, glowThreshold: 0.3, scanlines: 0, vignette: 0, grain: 0, bg: 'auto' };
const FX_ADJUST_DEFAULTS = { brightness: 0, contrast: 0, saturation: 1, gamma: 1, invert: false };

// ── Shaders ─────────────────────────────────────────────────────────────────

const FX_VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// Shared header of every effect – documented in effects/README.md.
const FX_PRELUDE = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uImage;
uniform vec2 uSize;
uniform vec2 uOutSize;
uniform float uTime;
uniform vec3 uPal[16];
uniform int uPalN;
uniform bool uPalOriginal;
uniform bool uPaperMode;
uniform sampler2D uGlyphs;
uniform int uGlyphCount;
uniform int uGlyphCols;
uniform int uGlyphRows;
uniform int uGlyphMode;
uniform float uGlyphCellPx;
uniform sampler2D uDither;
uniform vec2 uDitherSize;
uniform sampler2D uBlueNoise;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec4 img(vec2 uv) { return texture(uImage, uv); }
float outScale() { return uOutSize.x / uSize.x; }
vec4 imgCell(vec2 uv, float cellPx) { return textureLod(uImage, uv, log2(max(cellPx * outScale(), 1.0))); }
vec2 rot(vec2 p, float deg) { float a = radians(deg); float c = cos(a); float s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float blueNoise(vec2 cell) { return texelFetch(uBlueNoise, ivec2(mod(floor(cell), 64.0)), 0).r; }
float bayer(vec2 cell, int n) {
  int x = int(floor(cell.x));
  int y = int(floor(cell.y));
  int bits = n <= 2 ? 1 : (n <= 4 ? 2 : (n <= 8 ? 3 : 4));
  int v = 0;
  for (int i = 0; i < 4; i++) {
    if (i >= bits) break;
    int xb = (x >> i) & 1;
    int yb = (y >> i) & 1;
    v = (v << 2) | (((xb ^ yb) << 1) | yb);
  }
  return (float(v) + 0.5) / float(1 << (2 * bits));
}
float cover(float dist, float size) { return clamp((size - dist) / max(fwidth(dist), 1e-5) + 0.5, 0.0, 1.0); }
float inkAmount(float lum) { return uPaperMode ? 1.0 - lum : lum; }
vec3 palAt(int i) { return uPal[clamp(i, 0, max(uPalN - 1, 0))]; }
int palIndex(float t) { return int(clamp(floor(t * float(uPalN)), 0.0, float(uPalN - 1))); }
vec3 pal(float t) { return palAt(palIndex(t)); }
vec3 palSmooth(float t) {
  float x = clamp(t, 0.0, 1.0) * float(max(uPalN - 1, 1));
  int i = int(floor(x));
  return mix(palAt(i), palAt(i + 1), fract(x));
}
vec3 ink(float amount, vec3 src) {
  if (uPalOriginal) return src;
  if (uPalN < 2) return palAt(0);
  int k = int(floor(clamp(amount, 0.0, 0.9999) * float(uPalN - 1)));
  return uPaperMode ? palAt(uPalN - 2 - k) : palAt(1 + k);
}
int nearestIndex(vec3 c) {
  int best = 0;
  float bestD = 1e9;
  for (int i = 0; i < 16; i++) {
    if (i >= uPalN) break;
    vec3 d = c - uPal[i];
    float e = dot(d * d, vec3(0.30, 0.59, 0.11));
    if (e < bestD) { bestD = e; best = i; }
  }
  return best;
}
vec3 nearestColor(vec3 c) { return uPalOriginal ? c : palAt(nearestIndex(c)); }
vec4 paletteOut(int i) { return vec4(palAt(i), i == (uPaperMode ? uPalN - 1 : 0) ? 0.0 : 1.0); }
float glyph(int index, vec2 local, float cellPx) {
  if (uGlyphCount <= 0) return 0.0;
  int i = clamp(index, 0, uGlyphCount - 1);
  float cx = float(i % uGlyphCols);
  float cy = float(i / uGlyphCols);
  vec2 l = clamp(local, 0.0, 1.0);
  vec2 g = vec2((cx + l.x) / float(uGlyphCols), 1.0 - (cy + 1.0 - l.y) / float(uGlyphRows));
  float lod = log2(max(uGlyphCellPx / max(cellPx * outScale(), 1.0), 1.0));
  return textureLod(uGlyphs, g, lod).a;
}
vec4 dithered(vec2 uv) { return texture(uDither, uv); }
`;
const FX_PRELUDE_LINES = FX_PRELUDE.split('\n').length - 1;
const FX_MAIN = '\nvoid main() {\n  fragColor = effect(vUv);\n}\n';
const FX_RESERVED = new Set(['uImage', 'uSize', 'uOutSize', 'uTime', 'uPal', 'uPalN', 'uPalOriginal', 'uPaperMode', 'uGlyphs',
  'uGlyphCount', 'uGlyphCols', 'uGlyphRows', 'uGlyphMode', 'uGlyphCellPx', 'uDither', 'uDitherSize', 'uBlueNoise', 'vUv', 'fragColor']);

// The source image is composited over black, then brightness / contrast / saturation / gamma are applied.
const FX_ADJUST = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uGamma;
uniform bool uInvert;
uniform bool uBypass;
void main() {
  vec4 s = texture(uSrc, vUv);
  vec3 c = s.rgb * s.a;
  if (!uBypass) {
    c = (c - 0.5) * uContrast + 0.5 + uBrightness;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, uSaturation);
    c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / uGamma));
    if (uInvert) c = 1.0 - c;
  }
  fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`;

// Glow, step 1: the bright parts of the composited image, downsampled 4× (a 4×4 box from four bilinear taps).
const FX_BRIGHT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform vec3 uBg;
uniform bool uTransparent;
uniform float uThreshold;
vec3 comp(vec2 uv) {
  vec4 f = texture(uTex, uv);
  return uTransparent ? f.rgb * f.a : mix(uBg, f.rgb, f.a);
}
void main() {
  vec3 c = 0.25 * (comp(vUv + uTexel * vec2(-1.0, -1.0)) + comp(vUv + uTexel * vec2(1.0, -1.0))
    + comp(vUv + uTexel * vec2(-1.0, 1.0)) + comp(vUv + uTexel * vec2(1.0, 1.0)));
  float l = max(c.r, max(c.g, c.b));
  fragColor = vec4(c * smoothstep(uThreshold, uThreshold + 0.25, l), 1.0);
}
`;

// Layers: the result so far, flattened over the background, becomes the next effect’s image.
const FX_COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec3 uBg;
void main() {
  vec4 f = texture(uTex, vUv);
  fragColor = vec4(mix(uBg, f.rgb, f.a), 1.0);
}
`;

// Glow, step 2: separable Gaussian blur (9 taps through 5 bilinear fetches).
const FX_BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uDir;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 0.2270270270;
  c += texture(uTex, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture(uTex, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture(uTex, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture(uTex, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  fragColor = vec4(c, 1.0);
}
`;

// Background, glow, scan lines, vignette and grain on top of the effect.
const FX_FINAL = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform sampler2D uBloom;
uniform bool uHasBloom;
uniform float uGlow;
uniform vec3 uBg;
uniform bool uTransparent;
uniform float uScanlines;
uniform float uVignette;
uniform float uGrain;
uniform float uTime;
uniform vec2 uSize;
uniform bool uFlipY;
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec2 uv = uFlipY ? vec2(vUv.x, 1.0 - vUv.y) : vUv;
  vec4 f = texture(uTex, uv);
  vec3 c = uTransparent ? f.rgb * f.a : mix(uBg, f.rgb, f.a);
  float a = uTransparent ? f.a : 1.0;
  if (uHasBloom) {
    vec3 b = texture(uBloom, uv).rgb * uGlow * 1.6;
    c += b;
    a = max(a, clamp(max(b.r, max(b.g, b.b)), 0.0, 1.0));
  }
  vec2 px = uv * uSize;
  if (uScanlines > 0.0) c *= mix(1.0, 0.55 + 0.45 * cos(px.y * 6.28318530718 / 3.0), uScanlines);
  if (uVignette > 0.0) c *= mix(1.0, smoothstep(0.95, 0.25, length(uv - 0.5) * 1.35), uVignette);
  if (uGrain > 0.0) c += (hash(floor(px * 1.5) + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain * 0.3;
  c = clamp(c, 0.0, 1.0);
  fragColor = uTransparent ? vec4(c / max(a, 0.0001), a) : vec4(c, 1.0);
}
`;

// ── Parsing effect files ────────────────────────────────────────────────────

function fxAttrs(text) {
  const out = {};
  for (const m of String(text).matchAll(/(\w+)\s*=\s*(?:"([^"]*)"|(\S+))/g)) out[m[1]] = m[2] ?? m[3];
  return out;
}

const fxNum = (v, fallback) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : fallback);

// Lists behind the `type=charset` and `type=kernel` parameters (the value is the index).
const FX_LISTS = { charset: FX_CHARSETS, kernel: FX_KERNELS };

function fxParam(type, name, a) {
  const label = a.label || name.replace(/^u/, '');
  const show = a.show || null; // e.g. "uModulate>0" or "original" – the control is hidden otherwise
  if (type === 'bool') return { name, label, show, type: 'bool', default: a.default === 'true' };
  if (type === 'vec3') return { name, label, show, type: 'color', default: /^#[0-9a-f]{6}$/i.test(a.default || '') ? a.default.toLowerCase() : '#ffffff' };
  if (type === 'int' && FX_LISTS[a.type]) {
    const list = FX_LISTS[a.type];
    const idx = list.findIndex(c => c.id === a.default);
    return { name, label, show, type: a.type, default: idx >= 0 ? idx : Math.max(0, Math.min(list.length - 1, Math.round(fxNum(a.default, 0)))) };
  }
  if (type === 'int' && a.options) {
    const options = a.options.split(',').map(s => s.trim()).filter(Boolean);
    return { name, label, show, type: 'select', options, default: Math.max(0, Math.min(options.length - 1, Math.round(fxNum(a.default, 0)))) };
  }
  const isInt = type === 'int';
  let min = fxNum(a.min, 0);
  let max = fxNum(a.max, isInt ? 10 : 1);
  if (max < min) [min, max] = [max, min];
  const step = Math.max(isInt ? 1 : 1e-4, fxNum(a.step, isInt ? 1 : (max - min) / 100));
  return { name, label, show, type: isInt ? 'int' : 'float', min, max, step, default: Math.max(min, Math.min(max, fxNum(a.default, min))) };
}

// Coerce a value (from a preset, saved settings or a slider) to what the parameter accepts.
function fxCoerce(p, v) {
  if (v == null) return p.default;
  switch (p.type) {
    case 'bool': return v === true || v === 'true' || v === 1 || v === '1';
    case 'color': return /^#[0-9a-f]{6}$/i.test(String(v)) ? String(v).toLowerCase() : p.default;
    case 'charset':
    case 'kernel': {
      const list = FX_LISTS[p.type];
      const idx = typeof v === 'string' && !/^\d+$/.test(v) ? list.findIndex(c => c.id === v) : Number(v);
      return idx >= 0 && idx < list.length ? idx : p.default;
    }
    case 'select': return Math.max(0, Math.min(p.options.length - 1, Math.round(fxNum(v, p.default))));
    default: {
      const n = fxNum(v, p.default);
      return Math.max(p.min, Math.min(p.max, p.type === 'int' ? Math.round(n) : n));
    }
  }
}

function fxParseEffect(source, extra = {}) {
  const info = { name: '', category: 'Other', description: '', palette: null, finish: {}, presets: [], animated: null, cpu: null };
  const params = [];
  for (const line of String(source).split(/\r?\n/)) {
    let m = line.match(/^\s*\/\/\s*@(name|category|description|palette|cpu)\s+(.+?)\s*$/);
    if (m) { info[m[1]] = m[2]; continue; }
    m = line.match(/^\s*\/\/\s*@(finish|preset|animated)\b(.*)$/);
    if (m) {
      const attrs = fxAttrs(m[2]);
      if (m[1] === 'finish') Object.assign(info.finish, attrs);
      else if (m[1] === 'preset') { if (attrs.name) info.presets.push(attrs); }
      else info.animated = { param: attrs.param || null };
      continue;
    }
    m = line.match(/^\s*uniform\s+(float|int|bool|vec3)\s+(\w+)\s*;\s*\/\/\s*@param\b(.*)$/);
    if (m && !FX_RESERVED.has(m[2]) && !params.some(p => p.name === m[2])) params.push(fxParam(m[1], m[2], fxAttrs(m[3])));
  }
  if (!info.animated && /\buTime\b/.test(String(source).replace(/\/\/.*$/gm, ''))) info.animated = { param: null };
  if (info.palette && !FX_PALETTES.some(p => p.id === info.palette)) info.palette = null;
  return { ...extra, ...info, name: info.name || extra.name || extra.id || 'Untitled effect', params, source: String(source) };
}

// Finish values from `@finish` / `@preset` attributes.
function fxFinishFrom(attrs) {
  const out = {};
  for (const key of ['glow', 'glowSize', 'glowThreshold', 'scanlines', 'vignette', 'grain']) {
    if (attrs[key] != null && Number.isFinite(Number(attrs[key]))) out[key] = Number(attrs[key]);
  }
  if (attrs.bg) out.bg = /^#[0-9a-f]{6}$/i.test(attrs.bg) || attrs.bg === 'transparent' ? attrs.bg.toLowerCase() : 'auto';
  return out;
}

// Line numbers in compiler errors point at the effect file, not at the shared header.
function fxCompileErrors(log) {
  const errors = [];
  for (const line of String(log || '').split('\n')) {
    const m = line.match(/^\s*ERROR:\s*\d+:(\d+):\s*(.*)$/);
    if (m) errors.push({ line: Math.max(1, Number(m[1]) - FX_PRELUDE_LINES), message: m[2].trim() });
    else if (line.trim() && !errors.length) errors.push({ line: 0, message: line.trim() });
  }
  return errors;
}

function fxErrorText(result) {
  return (result.errors?.length ? result.errors : [{ line: 0, message: result.log || 'Unknown error' }])
    .map(e => (e.line ? `line ${e.line}: ${e.message}` : e.message)).join('\n');
}

// Strip what the header already provides (an AI coder sometimes adds it), keeping the line numbers intact.
function fxSanitize(source) {
  return String(source).replace(/\r\n?/g, '\n').split('\n').map(line => {
    const t = line.trim();
    if (/^#\s*version\b/.test(t) || /^precision\s+\w+\s+\w+\s*;$/.test(t)) return '';
    const m = t.match(/^(?:uniform|in|out)\s+\w+\s+(\w+)\s*(?:\[\s*\d+\s*\])?\s*;/);
    if (m && FX_RESERVED.has(m[1])) return '';
    return line;
  }).join('\n');
}

// ── Error diffusion (CPU) ───────────────────────────────────────────────────
// Every pixel depends on the ones before it, so this can’t run in a shader. It works on the grid of big
// pixels (design size ÷ pixel size), which keeps it fast enough for video.

function fxHashXY(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Threshold modulation turns the diffusion into lines, waves, rings or dots (an offset of ±0.5 × amount).
function fxModulation(o, w, h, src) {
  const amt = o.modAmount;
  if (!o.modulate || !(amt > 0)) return null;
  const S = Math.max(0.5, o.modScale);
  const a = (o.modAngle * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const ph = o.time * o.speed;
  const TAU = Math.PI * 2;
  // u runs across the lines, v along them – at 0° the lines are horizontal
  switch (o.modulate) {
    case 1: return (x, y) => 0.5 * amt * Math.sin(TAU * ((y * ca + x * sa) / S + ph));
    case 2: return (x, y) => {
      const u = y * ca + x * sa;
      const v = x * ca - y * sa;
      return 0.5 * amt * Math.sin(TAU * ((u + Math.sin((TAU * v) / (S * 5)) * S * 0.6) / S + ph));
    };
    case 3: {
      const cx = w / 2;
      const cy = h / 2;
      return (x, y) => 0.5 * amt * Math.sin(TAU * (Math.hypot(x - cx, y - cy) / S - ph));
    }
    case 4: return (x, y) => 0.25 * amt * (Math.sin(TAU * ((y * ca + x * sa) / S + ph)) + Math.sin(TAU * ((x * ca - y * sa) / S)));
    case 5: return (x, y, i) => { // flow – lines that bend with the brightness of the image
      const j = i * 4;
      const l = (0.2126 * src[j] + 0.7152 * src[j + 1] + 0.0722 * src[j + 2]) / 255;
      return 0.5 * amt * Math.sin(TAU * ((y * ca + x * sa) / S + l * o.warp + ph));
    };
    case 6: {
      const frame = Math.floor(ph * 24) * 131;
      return (x, y) => amt * (fxHashXY(x, y + frame) - 0.5);
    }
    default: return null;
  }
}

// Pixel indices along a Hilbert curve covering w × h (for Riemersma dithering), cached per size.
const fxHilbertCache = new Map();
function fxHilbertOrder(w, h) {
  const key = `${w}x${h}`;
  if (fxHilbertCache.has(key)) return fxHilbertCache.get(key);
  let n = 1;
  while (n < Math.max(w, h)) n *= 2;
  const order = new Int32Array(w * h);
  let k = 0;
  for (let d = 0; d < n * n; d++) {
    let x = 0;
    let y = 0;
    let t = d;
    for (let s = 1; s < n; s *= 2) {
      const rx = 1 & (t >> 1);
      const ry = 1 & (t ^ rx);
      if (ry === 0) {
        if (rx === 1) {
          x = s - 1 - x;
          y = s - 1 - y;
        }
        const tmp = x;
        x = y;
        y = tmp;
      }
      x += s * rx;
      y += s * ry;
      t >>= 2;
    }
    if (x < w && y < h) order[k++] = y * w + x;
  }
  if (fxHilbertCache.size > 6) fxHilbertCache.clear();
  fxHilbertCache.set(key, order);
  return order;
}

/**
 * src: RGBA bytes (w × h). o.palette: [[r, g, b] 0..1] (darkest first) or null for the original colours.
 * Returns RGBA bytes – palette colours, with the background colour transparent.
 */
function fxDiffuse(src, w, h, o) {
  const kernel = FX_KERNELS[o.kernel] || FX_KERNELS[0];
  if (kernel.path === 'hilbert') return fxDiffuseHilbert(src, w, h, o);
  const taps = kernel.taps;
  const k = Math.max(0, Math.min(1, o.strength)) / kernel.div;
  const n = w * h;
  const out = new Uint8Array(n * 4);
  const pal = o.palette;
  const mode = !pal ? 'levels' : o.nearest ? 'nearest' : 'ramp';
  const ch = mode === 'ramp' ? 1 : 3;
  const buf = new Float32Array(n * ch);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    if (ch === 1) {
      buf[i] = (0.2126 * src[j] + 0.7152 * src[j + 1] + 0.0722 * src[j + 2]) / 255;
    } else {
      buf[i * 3] = src[j] / 255;
      buf[i * 3 + 1] = src[j + 1] / 255;
      buf[i * 3 + 2] = src[j + 2] / 255;
    }
  }
  const mod = fxModulation(o, w, h, src);
  const N = pal ? pal.length : 0;
  const top = Math.max(1, N - 1);
  const bg = o.paper ? N - 1 : 0;
  const bytes = pal ? pal.map(c => c.map(v => Math.round(v * 255))) : null;
  const L = Math.max(1, Math.round(o.levels) - 1);
  const bias = o.threshold || 0;
  let e0 = 0;
  let e1 = 0;
  let e2 = 0;
  for (let y = 0; y < h; y++) {
    const rev = o.serpentine && (y & 1) === 1;
    for (let s = 0; s < w; s++) {
      const x = rev ? w - 1 - s : s;
      const i = y * w + x;
      const j = i * 4;
      const m = mod ? mod(x, y, i) : 0;
      if (mode === 'ramp') {
        const v = buf[i] + bias;
        const idx = Math.max(0, Math.min(N - 1, Math.floor(v * top + 0.5 + m)));
        e0 = v - idx / top;
        const c = bytes[idx];
        out[j] = c[0];
        out[j + 1] = c[1];
        out[j + 2] = c[2];
        out[j + 3] = idx === bg ? 0 : 255;
      } else if (mode === 'nearest') {
        const r = buf[i * 3] + bias;
        const g = buf[i * 3 + 1] + bias;
        const b = buf[i * 3 + 2] + bias;
        const off = m * 0.5;
        let best = 0;
        let bestD = Infinity;
        for (let p = 0; p < N; p++) {
          const c = pal[p];
          const dr = r + off - c[0];
          const dg = g + off - c[1];
          const db = b + off - c[2];
          const d = 0.30 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
          if (d < bestD) { bestD = d; best = p; }
        }
        const c = pal[best];
        e0 = r - c[0];
        e1 = g - c[1];
        e2 = b - c[2];
        const cb = bytes[best];
        out[j] = cb[0];
        out[j + 1] = cb[1];
        out[j + 2] = cb[2];
        out[j + 3] = best === bg ? 0 : 255;
      } else {
        const r = buf[i * 3] + bias;
        const g = buf[i * 3 + 1] + bias;
        const b = buf[i * 3 + 2] + bias;
        const qr = Math.max(0, Math.min(L, Math.floor(r * L + 0.5 + m))) / L;
        const qg = Math.max(0, Math.min(L, Math.floor(g * L + 0.5 + m))) / L;
        const qb = Math.max(0, Math.min(L, Math.floor(b * L + 0.5 + m))) / L;
        e0 = r - qr;
        e1 = g - qg;
        e2 = b - qb;
        out[j] = qr * 255;
        out[j + 1] = qg * 255;
        out[j + 2] = qb * 255;
        out[j + 3] = 255;
      }
      for (let t = 0; t < taps.length; t += 3) {
        const nx = x + (rev ? -taps[t] : taps[t]);
        const ny = y + taps[t + 1];
        if (nx < 0 || nx >= w || ny >= h) continue;
        const f = taps[t + 2] * k;
        const ni = ny * w + nx;
        if (ch === 1) {
          buf[ni] += e0 * f;
        } else {
          buf[ni * 3] += e0 * f;
          buf[ni * 3 + 1] += e1 * f;
          buf[ni * 3 + 2] += e2 * f;
        }
      }
    }
  }
  return out;
}

// Riemersma: walks the image along a Hilbert curve and spreads each error over the next 16 pixels on the path
// (the newest errors count most) – an organic texture without the diagonal artefacts of row-by-row kernels.
function fxDiffuseHilbert(src, w, h, o) {
  const n = w * h;
  const out = new Uint8Array(n * 4);
  const pal = o.palette;
  const mode = !pal ? 'levels' : o.nearest ? 'nearest' : 'ramp';
  const chs = mode === 'ramp' ? 1 : 3;
  const N = pal ? pal.length : 0;
  const top = Math.max(1, N - 1);
  const bg = o.paper ? N - 1 : 0;
  const bytes = pal ? pal.map(c => c.map(v => Math.round(v * 255))) : null;
  const L = Math.max(1, Math.round(o.levels) - 1);
  const bias = o.threshold || 0;
  const strength = Math.max(0, Math.min(1, o.strength));
  const mod = fxModulation(o, w, h, src);
  const order = fxHilbertOrder(w, h);
  const Q = 16;
  const weights = Array.from({ length: Q }, (_, i) => Math.pow(16, i / (Q - 1)) / 16); // oldest … newest
  const hist = [new Float32Array(Q), new Float32Array(Q), new Float32Array(Q)];
  const v = [0, 0, 0];
  const e = [0, 0, 0];
  let head = 0; // the oldest slot of the error ring
  for (let k = 0; k < n; k++) {
    const i = order[k];
    const x = i % w;
    const y = (i - x) / w;
    const j = i * 4;
    if (chs === 1) {
      v[0] = (0.2126 * src[j] + 0.7152 * src[j + 1] + 0.0722 * src[j + 2]) / 255 + bias;
    } else {
      v[0] = src[j] / 255 + bias;
      v[1] = src[j + 1] / 255 + bias;
      v[2] = src[j + 2] / 255 + bias;
    }
    for (let c = 0; c < chs; c++) {
      let s = 0;
      const hc = hist[c];
      for (let q = 0; q < Q; q++) s += hc[(head + q) % Q] * weights[q];
      e[c] = v[c] + s * strength;
    }
    const m = mod ? mod(x, y, i) : 0;
    if (mode === 'ramp') {
      const idx = Math.max(0, Math.min(N - 1, Math.floor(e[0] * top + 0.5 + m)));
      hist[0][head] = v[0] - idx / top;
      const c = bytes[idx];
      out[j] = c[0];
      out[j + 1] = c[1];
      out[j + 2] = c[2];
      out[j + 3] = idx === bg ? 0 : 255;
    } else if (mode === 'nearest') {
      const off = m * 0.5;
      let best = 0;
      let bestD = Infinity;
      for (let p = 0; p < N; p++) {
        const c = pal[p];
        const dr = e[0] + off - c[0];
        const dg = e[1] + off - c[1];
        const db = e[2] + off - c[2];
        const d = 0.30 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
        if (d < bestD) { bestD = d; best = p; }
      }
      const c = pal[best];
      hist[0][head] = v[0] - c[0];
      hist[1][head] = v[1] - c[1];
      hist[2][head] = v[2] - c[2];
      const cb = bytes[best];
      out[j] = cb[0];
      out[j + 1] = cb[1];
      out[j + 2] = cb[2];
      out[j + 3] = best === bg ? 0 : 255;
    } else {
      for (let c = 0; c < 3; c++) {
        const q = Math.max(0, Math.min(L, Math.floor(e[c] * L + 0.5 + m))) / L;
        hist[c][head] = v[c] - q;
        out[j + c] = q * 255;
      }
      out[j + 3] = 255;
    }
    head = (head + 1) % Q;
  }
  return out;
}

// Blue-noise threshold map (void-and-cluster, Ulichney 1993): 64×64 ranks spread as evenly as possible, so
// thresholding against it gives a fine grain without visible patterns. Generated once, deterministic.
function fxBlueNoise(size = 64, sigma = 1.5) {
  const n = size * size;
  const kern = new Float32Array(n); // Gaussian energy for every (toroidal) offset
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.min(x, size - x);
      const dy = Math.min(y, size - y);
      kern[y * size + x] = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
    }
  }
  const energy = new Float32Array(n);
  const bits = new Uint8Array(n);
  const splat = (p, sign) => {
    const px = p % size;
    const py = (p - px) / size;
    for (let y = 0; y < size; y++) {
      let ky = y - py;
      if (ky < 0) ky += size;
      const krow = ky * size;
      const row = y * size;
      for (let x = 0; x < size; x++) {
        let kx = x - px;
        if (kx < 0) kx += size;
        energy[row + x] += sign * kern[krow + kx];
      }
    }
  };
  const tightest = () => {
    let best = -1;
    for (let i = 0; i < n; i++) if (bits[i] && (best < 0 || energy[i] > energy[best])) best = i;
    return best;
  };
  const largestVoid = () => {
    let best = -1;
    for (let i = 0; i < n; i++) if (!bits[i] && (best < 0 || energy[i] < energy[best])) best = i;
    return best;
  };
  let seed = 12345;
  const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296;
  const ones = Math.round(n * 0.1);
  for (let k = 0; k < ones;) {
    const p = Math.floor(rnd() * n);
    if (!bits[p]) {
      bits[p] = 1;
      splat(p, 1);
      k++;
    }
  }
  // 1. spread the starting points evenly: move the tightest cluster into the largest void until it settles
  for (let guard = 0; guard < n; guard++) {
    const c = tightest();
    bits[c] = 0;
    splat(c, -1);
    const v = largestVoid();
    bits[v] = 1;
    splat(v, 1);
    if (v === c) break;
  }
  const rank = new Float32Array(n);
  const startBits = bits.slice();
  const startEnergy = energy.slice();
  // 2. rank the starting points by taking away the tightest cluster each time
  for (let r = ones - 1; r >= 0; r--) {
    const c = tightest();
    bits[c] = 0;
    splat(c, -1);
    rank[c] = r;
  }
  // 3. rank the rest by filling the largest void each time
  bits.set(startBits);
  energy.set(startEnergy);
  for (let r = ones; r < n; r++) {
    const v = largestVoid();
    bits[v] = 1;
    splat(v, 1);
    rank[v] = r;
  }
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.floor(((rank[i] + 0.5) / n) * 256);
  return out;
}

// ── Engine ──────────────────────────────────────────────────────────────────

class FxEngine {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
    if (!gl) throw new Error('Your browser can’t run WebGL2, which the effects need. Try a current Chrome, Edge or Firefox.');
    this.gl = gl;
    this.canvas = canvas;
    this.maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vs, FX_VERTEX);
    gl.compileShader(this.vs);
    this.programs = new Map(); // effect source -> compiled program or compile errors
    this.passes = {};
    for (const [name, src] of Object.entries({ adjust: FX_ADJUST, bright: FX_BRIGHT, blur: FX_BLUR, final: FX_FINAL, composite: FX_COMPOSITE })) {
      const p = this.link(src);
      if (!p.ok) throw new Error(`Internal shader “${name}” failed: ${p.log}`);
      this.passes[name] = p;
    }
    this.srcTex = this.texture(true);
    this.source = null;
    this.sourceDirty = false;
    this.targets = new Map();
    this.glyphTex = this.texture(true);
    this.glyphs = { key: '', count: 0, cols: 1, rows: 1, mode: 0, cellH: 80 };
    this.palette = new Float32Array(48);
    this.ditherTex = this.texture(false); // result of the CPU error diffusion – crisp big pixels
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    this.blueTex = this.texture(false); // 64×64 blue-noise thresholds for blueNoise()
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 64, 64, 0, gl.RED, gl.UNSIGNED_BYTE, fxBlueNoise());
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  }

  // Error diffusion: the adjusted image is averaged down to the grid of big pixels, read back, dithered on
  // the CPU and uploaded again; the effect then reads it with dithered(uv).
  diffuse(A, p, o, colors, paper, prefix) {
    const gl = this.gl;
    const cell = Math.max(1, Number(p.uCell) || 1);
    const gw = Math.max(1, Math.min(4096, Math.round(o.design.width / cell)));
    const gh = Math.max(1, Math.min(4096, Math.round(o.design.height / cell)));
    const G = this.target(`${prefix}grid`, gw, gh);
    const copy = this.passes.adjust;
    gl.useProgram(copy.program);
    this.bindTex(0, A.tex);
    gl.uniform1i(copy.loc('uBypass'), 1);
    this.draw(copy, G, gw, gh);
    if (this.gridBuf?.length !== gw * gh * 4) this.gridBuf = new Uint8Array(gw * gh * 4);
    gl.readPixels(0, 0, gw, gh, gl.RGBA, gl.UNSIGNED_BYTE, this.gridBuf);
    const out = fxDiffuse(this.gridBuf, gw, gh, {
      palette: colors ? colors.map(fxHexToRgb) : null,
      nearest: p.uNearest === true,
      paper,
      kernel: Number(p.uKernel) || 0,
      strength: p.uStrength ?? 1,
      serpentine: p.uSerpentine !== false,
      threshold: Number(p.uThreshold) || 0,
      levels: Number(p.uLevels) || 3,
      modulate: Number(p.uModulate) || 0,
      modAmount: Number(p.uModAmount) || 0,
      modScale: (Number(p.uModScale) || 6) / cell,
      modAngle: Number(p.uModAngle) || 0,
      warp: Number(p.uWarp) || 0,
      speed: Number(p.uSpeed) || 0,
      time: o.time || 0,
    });
    this.bindTex(3, this.ditherTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gw, gh, 0, gl.RGBA, gl.UNSIGNED_BYTE, out);
    return { w: gw, h: gh };
  }

  texture(mipmap = false) {
    const gl = this.gl;
    // A scratch unit – binding a new texture to a unit a shader samples could create a feedback loop.
    gl.activeTexture(gl.TEXTURE7);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  target(name, w, h, mipmap = false) {
    const gl = this.gl;
    let t = this.targets.get(name);
    if (!t || t.w !== w || t.h !== h) {
      if (t) {
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fbo);
      }
      const tex = this.texture(mipmap);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      t = { tex, fbo, w, h };
      this.targets.set(name, t);
    }
    return t;
  }

  link(fragSource) {
    const gl = this.gl;
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(fs) || 'The shader didn’t compile.';
      gl.deleteShader(fs);
      return { ok: false, log };
    }
    const program = gl.createProgram();
    gl.attachShader(program, this.vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) || 'The shader didn’t link.';
      gl.deleteProgram(program);
      return { ok: false, log };
    }
    const locs = new Map();
    const loc = name => {
      if (!locs.has(name)) locs.set(name, gl.getUniformLocation(program, name));
      return locs.get(name);
    };
    return { ok: true, program, loc };
  }

  // Compiles an effect file (cached by its source). Returns { ok } or { ok: false, log, errors: [{ line, message }] }.
  compile(source) {
    const cached = this.programs.get(source);
    if (cached) {
      this.programs.delete(source); // keep the most recently used at the end
      this.programs.set(source, cached);
      return cached;
    }
    const body = fxSanitize(source);
    const res = this.link(FX_PRELUDE + body + (/\bvoid\s+main\s*\(/.test(body) ? '' : FX_MAIN));
    const entry = res.ok ? res : { ok: false, log: res.log, errors: fxCompileErrors(res.log) };
    this.programs.set(source, entry);
    while (this.programs.size > 64) {
      const [oldest, old] = this.programs.entries().next().value;
      if (old.program) this.gl.deleteProgram(old.program);
      this.programs.delete(oldest);
    }
    return entry;
  }

  setSource(el) {
    this.source = el;
    this.sourceDirty = true;
  }

  upload() {
    const gl = this.gl;
    const el = this.source;
    if (!el) return false;
    if (el instanceof HTMLVideoElement && el.readyState < 2) return false;
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.sourceDirty = false;
    return true;
  }

  // Characters for glyph() – drawn once into a texture atlas (white on transparent, 16 per row).
  setGlyphs(chars, mode = 0) {
    const key = `${mode}\u0001${chars.join('\u0001')}`;
    if (key === this.glyphs.key) return;
    const cellW = 48;
    const cellH = 80;
    const cols = 16;
    const count = Math.max(1, chars.length);
    const rows = Math.ceil(count / cols);
    const canvas = document.createElement('canvas');
    canvas.width = cols * cellW;
    canvas.height = rows * cellH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 66px "Cascadia Mono", Consolas, "Courier New", monospace';
    chars.forEach((ch, i) => {
      const w = ctx.measureText(ch).width || 1;
      const sx = Math.min(1, (cellW * 0.98) / w);
      ctx.save();
      ctx.translate(((i % cols) + 0.5) * cellW, (Math.floor(i / cols) + 0.5) * cellH + 3);
      ctx.scale(sx, 1);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
    const gl = this.gl;
    this.bindTex(1, this.glyphTex); // unit 1 – unit 0 holds the image during the effect pass
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.glyphs = { key, count: chars.length, cols, rows, mode, cellH };
  }

  // One effect: `input` (a mipmapped image) → `target` (colour + coverage). CPU dithering runs first if needed.
  effectPass(p, effect, params, input, target, W, H, o, colors, paper, prefix) {
    const gl = this.gl;
    const dither = effect?.cpu === 'diffusion' ? this.diffuse(input, params, o, colors, paper, prefix) : null;
    gl.useProgram(p.program);
    this.bindTex(0, input.tex);
    gl.uniform1i(p.loc('uImage'), 0);
    gl.uniform2f(p.loc('uSize'), o.design.width, o.design.height);
    gl.uniform2f(p.loc('uOutSize'), W, H);
    gl.uniform1f(p.loc('uTime'), o.time || 0);
    this.palette.fill(0);
    (colors || ['#000000', '#ffffff']).forEach((hex, i) => this.palette.set(fxHexToRgb(hex), i * 3));
    gl.uniform3fv(p.loc('uPal'), this.palette);
    gl.uniform1i(p.loc('uPalN'), colors ? colors.length : 2);
    gl.uniform1i(p.loc('uPalOriginal'), colors ? 0 : 1);
    gl.uniform1i(p.loc('uPaperMode'), paper ? 1 : 0);
    const charsetParam = effect?.params.find(x => x.type === 'charset');
    if (charsetParam) {
      const cs = FX_CHARSETS[params[charsetParam.name] ?? charsetParam.default] || FX_CHARSETS[0];
      const text = String(params[`${charsetParam.name}Text`] || 'HOMBRESAI').replace(/\s+/g, ' ').slice(0, 200);
      this.setGlyphs([...(cs.chars ?? (text || 'HOMBRESAI'))], cs.mode || 0);
    }
    this.bindTex(1, this.glyphTex);
    gl.uniform1i(p.loc('uGlyphs'), 1);
    gl.uniform1i(p.loc('uGlyphCount'), charsetParam ? this.glyphs.count : 0);
    gl.uniform1i(p.loc('uGlyphCols'), this.glyphs.cols);
    gl.uniform1i(p.loc('uGlyphRows'), this.glyphs.rows);
    gl.uniform1i(p.loc('uGlyphMode'), this.glyphs.mode);
    gl.uniform1f(p.loc('uGlyphCellPx'), this.glyphs.cellH);
    this.bindTex(3, this.ditherTex);
    gl.uniform1i(p.loc('uDither'), 3);
    gl.uniform2f(p.loc('uDitherSize'), dither ? dither.w : 1, dither ? dither.h : 1);
    this.bindTex(4, this.blueTex);
    gl.uniform1i(p.loc('uBlueNoise'), 4);
    for (const def of effect?.params || []) {
      const loc = p.loc(def.name);
      if (!loc) continue;
      const v = params[def.name] ?? def.default;
      if (def.type === 'float') gl.uniform1f(loc, Number(v));
      else if (def.type === 'bool') gl.uniform1i(loc, v ? 1 : 0);
      else if (def.type === 'color') gl.uniform3fv(loc, fxHexToRgb(v));
      else gl.uniform1i(loc, Math.round(Number(v)));
    }
    this.draw(p, target, W, H);
  }

  draw(pass, target, w, h) {
    const gl = this.gl;
    gl.useProgram(pass.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, w, h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  bindTex(unit, tex) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  /**
   * Renders one frame.
   * o.program   – result of compile()
   * o.effect    – parsed effect (for its params)
   * o.params    – slider values by uniform name
   * o.look      – { palette: ['#hex'…] | null, adjust, finish, bgColor }
   * o.out       – output size in px; o.design – design size in px (sizes in effects are measured on it)
   * o.time      – seconds; o.refresh – re-upload the source (video frames)
   * o.read      – return the pixels as ImageData instead of drawing on the canvas
   * o.bypass    – show the untouched source (compare)
   * o.targetPrefix – separate render targets (thumbnails), so the main ones aren’t reallocated
   */
  render(o) {
    const gl = this.gl;
    const W = Math.max(1, Math.round(o.out.width));
    const H = Math.max(1, Math.round(o.out.height));
    if ((this.sourceDirty || o.refresh) && !this.upload() && this.sourceDirty) return null;
    const look = o.look || {};
    const adjust = { ...FX_ADJUST_DEFAULTS, ...look.adjust };
    const finish = { ...FX_FINISH_DEFAULTS, ...look.finish };
    const colors = look.palette && look.palette.length >= 2 ? look.palette.slice(0, 16) : null;
    const params = o.params || {};
    const paper = !o.bypass && params.uPaper === true;
    const P = o.targetPrefix || '';

    // 1. source → adjusted image (mipmapped, so effects can average cells cheaply)
    const A = this.target(`${P}adjust`, W, H, true);
    const ad = this.passes.adjust;
    gl.useProgram(ad.program);
    this.bindTex(0, this.srcTex);
    gl.uniform1i(ad.loc('uSrc'), 0);
    gl.uniform1f(ad.loc('uBrightness'), adjust.brightness * 0.5);
    gl.uniform1f(ad.loc('uContrast'), adjust.contrast >= 0 ? 1 + adjust.contrast * 3 : 1 + adjust.contrast);
    gl.uniform1f(ad.loc('uSaturation'), adjust.saturation);
    gl.uniform1f(ad.loc('uGamma'), Math.max(0.05, adjust.gamma));
    gl.uniform1i(ad.loc('uInvert'), adjust.invert ? 1 : 0);
    gl.uniform1i(ad.loc('uBypass'), o.bypass ? 1 : 0);
    this.draw(ad, A, W, H);
    gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.generateMipmap(gl.TEXTURE_2D);

    // 2. the effect itself, then the effects stacked on top – each one works on the result so far
    const F = this.target(`${P}effect`, W, H);
    let bg = colors ? fxHexToRgb(paper ? colors[colors.length - 1] : colors[0]) : [0, 0, 0];
    if (/^#[0-9a-f]{6}$/i.test(finish.bg)) bg = fxHexToRgb(finish.bg);
    const transparent = finish.bg === 'transparent' && !o.bypass;
    let ink = F;
    if (o.bypass || !o.program?.ok) {
      // compare mode: the original image, no effect
      const copy = this.passes.adjust;
      gl.useProgram(copy.program);
      this.bindTex(0, A.tex);
      gl.uniform1i(copy.loc('uBypass'), 1);
      this.draw(copy, F, W, H);
    } else {
      this.effectPass(o.program, o.effect, params, A, F, W, H, o, colors, paper, P);
      (o.layers || []).forEach((layer, i) => {
        // flatten the result so far over the background into a full (mipmapped) image for the next effect
        const C = this.target(`${P}stack${i % 2}`, W, H, true);
        const comp = this.passes.composite;
        gl.useProgram(comp.program);
        this.bindTex(0, ink.tex);
        gl.uniform1i(comp.loc('uTex'), 0);
        gl.uniform3fv(comp.loc('uBg'), bg);
        this.draw(comp, C, W, H);
        gl.bindTexture(gl.TEXTURE_2D, C.tex);
        gl.generateMipmap(gl.TEXTURE_2D);
        const L = this.target(`${P}layer${i % 2}`, W, H);
        const lp = layer.params || {};
        this.effectPass(layer.program, layer.effect, lp, C, L, W, H, o, colors, lp.uPaper === true, P);
        ink = L;
      });
    }

    // 3. glow
    let bloom = null;
    if (!o.bypass && finish.glow > 0.001) {
      const bw = Math.max(1, Math.ceil(W / 4));
      const bh = Math.max(1, Math.ceil(H / 4));
      const B1 = this.target(`${P}bloom1`, bw, bh);
      const B2 = this.target(`${P}bloom2`, bw, bh);
      const br = this.passes.bright;
      gl.useProgram(br.program);
      this.bindTex(0, ink.tex);
      gl.uniform1i(br.loc('uTex'), 0);
      gl.uniform2f(br.loc('uTexel'), 1 / W, 1 / H);
      gl.uniform3fv(br.loc('uBg'), bg);
      gl.uniform1i(br.loc('uTransparent'), transparent ? 1 : 0);
      gl.uniform1f(br.loc('uThreshold'), finish.glowThreshold);
      this.draw(br, B1, bw, bh);
      const radius = (finish.glowSize * W) / o.design.width / 4; // in bloom texels
      const passes = radius > 6 ? 2 : 1;
      const step = radius / (3.23 * Math.sqrt(passes));
      const bl = this.passes.blur;
      gl.useProgram(bl.program);
      gl.uniform1i(bl.loc('uTex'), 0);
      for (let i = 0; i < passes; i++) {
        this.bindTex(0, B1.tex);
        gl.uniform2f(bl.loc('uDir'), step / bw, 0);
        this.draw(bl, B2, bw, bh);
        this.bindTex(0, B2.tex);
        gl.uniform2f(bl.loc('uDir'), 0, step / bh);
        this.draw(bl, B1, bw, bh);
      }
      bloom = B1;
    }

    // 4. finish → canvas (or a texture that is read back)
    const fin = this.passes.final;
    gl.useProgram(fin.program);
    this.bindTex(0, ink.tex);
    gl.uniform1i(fin.loc('uTex'), 0);
    this.bindTex(2, bloom ? bloom.tex : ink.tex);
    gl.uniform1i(fin.loc('uBloom'), 2);
    gl.uniform1i(fin.loc('uHasBloom'), bloom ? 1 : 0);
    gl.uniform1f(fin.loc('uGlow'), finish.glow);
    gl.uniform3fv(fin.loc('uBg'), bg);
    gl.uniform1i(fin.loc('uTransparent'), transparent ? 1 : 0);
    gl.uniform1f(fin.loc('uScanlines'), o.bypass ? 0 : finish.scanlines);
    gl.uniform1f(fin.loc('uVignette'), o.bypass ? 0 : finish.vignette);
    gl.uniform1f(fin.loc('uGrain'), o.bypass ? 0 : finish.grain);
    gl.uniform1f(fin.loc('uTime'), o.time || 0);
    gl.uniform2f(fin.loc('uSize'), o.design.width, o.design.height);
    gl.uniform1i(fin.loc('uFlipY'), o.read ? 1 : 0);
    if (o.read) {
      const R = this.target(`${P}read`, W, H);
      this.draw(fin, R, W, H);
      const px = new Uint8ClampedArray(W * H * 4);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return new ImageData(px, W, H);
    }
    if (this.canvas.width !== W) this.canvas.width = W;
    if (this.canvas.height !== H) this.canvas.height = H;
    this.draw(fin, null, W, H);
    return true;
  }
}

// Design size: the long side is FX_DESIGN_LONG, the short side keeps the aspect ratio of the source.
function fxDesignSize(w, h) {
  const s = FX_DESIGN_LONG / Math.max(w || 1, h || 1);
  return { width: Math.max(16, Math.round((w || 1) * s)), height: Math.max(16, Math.round((h || 1) * s)) };
}
