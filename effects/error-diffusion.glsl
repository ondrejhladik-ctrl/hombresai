// @name Error Diffusion
// @category Dither
// @description Classic error-diffusion dithering – Floyd–Steinberg, Atkinson and friends – at any pixel size.
// @cpu diffusion
// @palette mono
// @animated param=uSpeed
// @preset name="Atkinson Paper" uKernel=atkinson uCell=2 palette=newsprint
// @preset name="Modulated Lines" uModulate=1 uModAmount=0.9 uModScale=7 uModAngle=0 palette=ice glow=0.3
// @preset name="Flow Lines" uModulate=5 uModAmount=1 uModScale=6 uWarp=2 uCell=2 palette=violet glow=0.5
// @preset name="Acid Waves" uModulate=2 uModAmount=0.85 uModScale=8 uCell=2 palette=acid glow=0.25
// @preset name="Ring Ripples" uModulate=3 uModAmount=0.8 uModScale=10 uCell=2 palette=synth glow=0.35
// @preset name="Retro Color" uNearest=true uCell=3 palette=pico8
// @preset name="Streaks" uKernel=row uCell=2 uStrength=0.9 palette=blood glow=0.3
// @preset name="Riemersma Organic" uKernel=riemersma uCell=2 palette=sepia
// @preset name="Glow Dither" uKernel=stevensonarce uCell=2 palette=ice glow=0.85 glowSize=8 glowThreshold=0.45

uniform float uCell;       // @param label="Pixel size" min=1 max=24 step=1 default=2
uniform int uKernel;       // @param label="Algorithm" type=kernel default=floyd
uniform float uStrength;   // @param label="Diffusion" min=0 max=1 step=0.01 default=1
uniform float uThreshold;  // @param label="Threshold" min=-0.5 max=0.5 step=0.01 default=0
uniform bool uSerpentine;  // @param label="Serpentine scan" default=true
uniform int uModulate;     // @param label="Modulation" options="None,Lines,Waves,Rings,Dots,Flow,Noise" default=0
uniform float uModAmount;  // @param label="Modulation amount" min=0 max=1 step=0.01 default=0.8 show="uModulate>0"
uniform float uModScale;   // @param label="Modulation scale" min=2 max=80 step=0.5 default=8 show="uModulate>0"
uniform float uModAngle;   // @param label="Modulation angle" min=0 max=180 step=1 default=0 show="uModulate>0"
uniform float uWarp;       // @param label="Flow warp" min=0 max=6 step=0.01 default=1.5 show="uModulate==5"
uniform float uSpeed;      // @param label="Speed" min=0 max=4 step=0.01 default=0 show="uModulate>0"
uniform bool uNearest;     // @param label="Closest palette color" default=false show="!original"
uniform float uLevels;     // @param label="Color levels" min=2 max=8 step=1 default=3 show="original"

// The dithering itself runs on the CPU (see @cpu); here it is only drawn as crisp big pixels.
vec4 effect(vec2 uv) {
  return dithered(uv);
}
