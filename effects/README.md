# hombresai effects

Every file in this folder is one effect for the **Effects** section of hombresai. Effects are small GPU programs
(GLSL ES 3.00 fragment shaders) that run live in the browser on images, videos and the camera – no AI, no cost.

- `effects/*.glsl` – the effects that come with the app.
- `effects/custom/*.glsl` – your own effects (made with the AI coder, saved from the code editor, or written by hand).
  The app reloads them whenever you come back to its window, so you can edit them in any editor or coding agent.

## File structure

```glsl
// @name Neon Lines
// @category Lines
// @description One sentence that explains the look.
// @palette violet
// @finish glow=0.5 glowSize=16
// @preset name="Acid Variant" uSpacing=6 palette=acid glow=0.3

uniform float uSpacing;  // @param label="Line spacing" min=2 max=40 step=0.5 default=7
uniform bool uPaper;     // @param label="Ink on paper" default=false

vec4 effect(vec2 uv) {
  vec3 c = imgCell(uv, uSpacing).rgb;       // colour of the image around this pixel
  float t = inkAmount(luma(c));             // 0..1, how much ink this area gets
  float d = abs(fract(uv.y * uSize.y / uSpacing) - 0.5);
  return vec4(ink(t, c), cover(d, 0.5 * t)); // rgb = ink colour, a = coverage (0 = background)
}
```

The app wraps the file with the shared header listed below and calls `effect(vUv)` for every pixel.
Do not write `#version`, `precision`, `main()` or redeclare anything from the header.

### Metadata comments (all optional except @name)

| Line | Meaning |
|---|---|
| `// @name …` | Name shown on the effect card. |
| `// @category …` | One of: Pixel, Dither, Print, Lines, Text, Color, Glitch, Edges, Distort (or a new one). |
| `// @description …` | One short sentence. |
| `// @palette id` | Palette chosen when the effect is opened (ids below). |
| `// @finish key=value …` | Default finish: `glow` 0–1, `glowSize` 2–60, `glowThreshold` 0–1, `scanlines` 0–1, `vignette` 0–1, `grain` 0–1, `bg` = `auto` / `transparent` / `#rrggbb`. |
| `// @animated` | The effect moves over time (uses `uTime`). `// @animated param=uSpeed` animates only while that slider is not 0 / that switch is on. |
| `// @preset name="…" …` | An extra card with different slider values, palette or finish (`uName=value`, `palette=id`, finish keys). |

### Sliders – `@param`

Each uniform with a `// @param` comment becomes a control. Supported forms:

```glsl
uniform float uAmount;  // @param label="Amount" min=0 max=1 step=0.01 default=0.5     (slider)
uniform int uMode;      // @param label="Mode" options="Lines,Dots,Waves" default=0      (dropdown, value = index)
uniform bool uInvert;   // @param label="Invert" default=false                         (switch)
uniform vec3 uTint;     // @param label="Tint" type=color default=#ff3366              (colour picker, rgb 0..1)
uniform int uChars;     // @param label="Characters" type=charset default=classic      (character set for glyph())
uniform int uKernel;    // @param label="Algorithm" type=kernel default=floyd          (error-diffusion algorithm)
```

`show="uMode>0"` (also `==`, `!=`, `<`, `>=`…, or `show="original"` / `show="!original"` for the palette) shows a
control only when it matters.

A bool named `uPaper` is special: when it is on, the lightest palette colour becomes the background and `ink()` /
`inkAmount()` work with darkness (ink on paper) instead of light.

### Error diffusion – `// @cpu diffusion`

Error diffusion (Floyd–Steinberg, Atkinson…) can’t run in a shader, so the app does it on the CPU before your
shader runs and hands you the result: `dithered(uv)` returns the dithered colour (alpha 0 on the background colour).
The CPU stage reads these sliders by name (declare the ones you need): `uCell` pixel size, `uKernel` algorithm
(`type=kernel`), `uStrength` 0–1, `uThreshold` −0.5…0.5, `uSerpentine`, `uModulate` (0 none, 1 lines, 2 waves,
3 rings, 4 dots, 5 flow, 6 noise), `uModAmount`, `uModScale` (design px), `uModAngle`, `uWarp`, `uSpeed`,
`uNearest` (closest palette colour instead of a brightness ramp) and `uLevels` (for original colours).
Kernel ids: floyd, atkinson, jjn, stucki, burkes, sierra, sierra2, sierralite, falsefloyd, row, column.

## Coordinates

- `uv` – 0..1 across the image, origin at the **bottom-left** (y goes up).
- `uSize` – the design size in pixels (the long side is 1080). Measure every size in these pixels: `uv * uSize`.
  Exports at 2× or 4× and videos at any resolution then look exactly like the preview.
- `uOutSize` – the real output size in pixels (for anti-aliasing math only); `outScale()` = output px per design px.

## Header – uniforms and helpers you can use

```glsl
uniform sampler2D uImage;  // the source image / video frame (already adjusted), mipmapped
uniform vec2 uSize;        // design size in px
uniform vec2 uOutSize;     // output size in px
uniform float uTime;       // seconds since the effect started
uniform vec3 uPal[16];     // the palette, darkest first (first = background)
uniform int uPalN;         // number of palette colours (2..16)
uniform bool uPalOriginal; // true when the user picked "Original colors"
uniform bool uPaperMode;   // true when the effect's uPaper switch is on
const float PI, TAU;

float luma(vec3 c);                    // perceived brightness 0..1
vec4  img(vec2 uv);                    // sample the image
vec4  imgCell(vec2 uv, float cellPx);  // average colour of a cellPx-sized area around uv (smooth, cheap)
float outScale();                      // output px per design px
vec2  rot(vec2 p, float degrees);      // rotate a point around the origin
float hash(vec2 p);                    // random 0..1 from a position
float ign(vec2 p);                     // interleaved-gradient noise 0..1 (good for dithering)
float blueNoise(vec2 cell);            // blue-noise threshold 0..1 for a cell – the finest, pattern-free dither
float bayer(vec2 cell, int n);         // ordered-dither threshold 0..1 for an n×n matrix (2, 4, 8 or 16)
float cover(float dist, float size);   // anti-aliased coverage: 1 where dist < size, 0 outside
float inkAmount(float lum);            // lum, or 1 - lum in ink-on-paper mode
vec3  palAt(int i);                    // palette colour i
int   palIndex(float t);               // palette index for brightness t (stepped)
vec3  pal(float t);                    // stepped palette colour for brightness t
vec3  palSmooth(float t);              // smooth gradient through the palette
vec3  ink(float amount, vec3 src);     // ink colour for amount 0..1 (palette without background, or src for original colours)
int   nearestIndex(vec3 c);            // closest palette colour index
vec3  nearestColor(vec3 c);            // closest palette colour (or c for original colours)
vec4  paletteOut(int i);               // palette colour i as output (the background index becomes transparent)
float glyph(int index, vec2 local, float cellPx); // coverage of character `index` at `local` (0..1 inside the cell)
uniform int uGlyphCount;               // number of characters of the chosen character set
uniform int uGlyphMode;                // 0 = ordered by density, 1 = the user's text in reading order, 2 = random (matrix)
vec4  dithered(vec2 uv);               // result of the CPU error diffusion (only with // @cpu diffusion)
```

### Output

Return `vec4(rgb, alpha)`: `rgb` is the colour you draw, `alpha` is how much of the pixel it covers.
Alpha 0 shows the background (palette background, a chosen colour, or transparency in PNG exports).
Effects that recolour the whole picture return alpha 1.

### Rules (WebGL2 / GLSL ES 3.00)

- Float literals need a dot: `1.0`, not `1`. There is no automatic int ↔ float conversion – use `float(i)` / `int(x)`.
- Loops need a constant upper bound (`for (int i = 0; i < 32; i++)`), break early with `if (…) break;`.
- Use `img()` / `imgCell()` / `texture()`, never `texture2D` or `gl_FragColor`.
- Helper functions must be defined before `effect()`. Keep it fast – it runs for every pixel of every video frame.
- Sizes in design pixels, never in raw output pixels. Animate only with `uTime`.

### Palette ids

mono, newsprint, amber, phosphor, gold, blueprint, violet, acid, synth, blood, ice, thermal, gameboy, cga, pico8,
c64, teletext, sepia, auto (the main colours of the user’s image), original

### Character set ids (for `type=charset`)

classic, dense, blocks, binary, braille, dots, hearts, matrix, text (the user's own text)
