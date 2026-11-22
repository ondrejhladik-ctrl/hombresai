#!/usr/bin/env node
// Finds free open-source models and the free places that run them, and sorts them into image, video and code models.
//
//   node scripts/free-models.js            find them, save the list for the app, print it
//   node scripts/free-models.js --json     print the list as JSON instead
//   node scripts/free-models.js --dry-run  don't save anything
//   node scripts/free-models.js --open-only  only open-source licenses (no models with their author's own license)
//
// Where it looks:
// - Hugging Face: the most liked and trending open-source models for text-to-image, text-to-video, image-to-video and
//   SVG, then the public apps (Spaces) that run them for free. Each app's API is read to check it takes a prompt and
//   returns an image, a video or SVG code – apps it can't drive are left out. Nothing is generated while looking, so
//   no free GPU time is used.
// - Pollinations: its models that aren't paid-only, kept only when the same model is open source on Hugging Face.
// - Cloudflare Workers AI, when a free account is connected in the app: its open-source language models.
// - ComfyUI: the open models of its official workflow templates (and how much they're used) – looked up on Hugging
//   Face like the others. ComfyUI itself runs models on your own computer; this only learns which models people use.
//
// Licenses: open source (Apache, MIT, BSD, GPL, OpenRAIL, Creative Commons) and, unless --open-only, models with their
// author's own license (FLUX.1 dev, Stable Diffusion 3.5, Qwen-Image 2.1, LTX…) – free for personal use; each entry
// notes what its license allows (non-commercial, research only, a revenue limit, not valid in the EU…). Apps with adult
// content, wrappers around paid services and apps that want your own key are skipped.
// The free GPU time on Hugging Face is per person (2 minutes a day without an account, 5 with a free token) and shared
// by every ZeroGPU app, so more apps don't mean more free time – they mean another app when one is down or changes.
//
// The list is saved to ~/.hombresai/free-models.json. hombresai reads it: the image models join the model menu (and
// "Best free (auto)", which tries them one after another), the code models join the AI coders for effects and SVG, and
// Settings shows all three groups. The app also refreshes the list once a day. Each Hugging Face entry says how to call
// its app (which input takes the prompt, the size, the seed…); fillValues() turns that and a prompt into the call.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const VERSION = 2;
const HF_API = (process.env.HF_API_BASE || 'https://huggingface.co').replace(/\/+$/, '');
const HF_SPACES_BASE = (process.env.HF_SPACES_BASE || '').replace(/\/+$/, '');
const POLLINATIONS = (process.env.POLLINATIONS_BASE || 'https://gen.pollinations.ai').replace(/\/+$/, '');
const CLOUDFLARE = (process.env.CLOUDFLARE_API_BASE || 'https://api.cloudflare.com/client/v4').replace(/\/+$/, '');
const KINDS = ['image', 'video', 'code'];
const PER_KIND = 40; // the best ones kept per kind

// Licenses that make a model open source (lower case, as Hugging Face tags them).
const OPEN_LICENSES = new Set([
  'apache-2.0', 'mit', 'bsd', 'bsd-2-clause', 'bsd-3-clause', 'bsd-3-clause-clear', 'isc', 'unlicense', 'cc0-1.0', 'wtfpl',
  'gpl', 'gpl-2.0', 'gpl-3.0', 'lgpl', 'lgpl-2.1', 'lgpl-3.0', 'lgpl-lr', 'agpl-3.0', 'mpl-2.0', 'epl-2.0', 'artistic-2.0', 'afl-3.0', 'ecl-2.0', 'osl-3.0', 'bsl-1.0', 'zlib', 'pddl', 'odc-by',
  'openrail', 'openrail++', 'creativeml-openrail-m', 'bigscience-openrail-m', 'bigcode-openrail-m', 'bigscience-bloom-rail-1.0',
  'cc-by-4.0', 'cc-by-sa-4.0', 'cc-by-3.0', 'cc-by-sa-3.0', 'cc-by-2.0',
]);
// "other" licenses that are still MIT or Apache with a note (e.g. Kimi's modified MIT)
const OPEN_OTHER = /^(modified-)?(mit|apache)/i;

const NSFW = /nsfw|nud(e|ity)|naked|porn|hentai|lewd|uncensor|erotic|\beros\b|10eros|sexy|\bxxx\b|18\+|\br-?18\b|onlyfans|fetish|undress|deepnude|waifu/i;
// repos and apps that aren't a generator of their own
const NOT_A_GENERATOR = /lora|lycoris|controlnet|ip-?adapter|\bvae\b|-vae|gguf|\bgptq\b|\bawq\b|embedding|textual-inversion|upscal|inpaint|outpaint|segment|caption|tagger|detector|depth|pose|leaderboard|arena|benchmark|compar|search|prompt-?gen|prompt-?enhanc|dataset|trainer|training|fine-?tun|merge|quantiz|convert|-to-lora|interrogat|clip-|face-?swap|try-?on|remove-?bg|background-?remov|rembg|vram|calculator|gallery-only|viewer/i;
// wrappers around closed models (they pass prompts on to a paid service) aren't open source
const CLOSED = /\bsora\b|\bveo\b|kling|runway|dall-?e|midjourney|ideogram|seedance|seedream|hailuo|\bpika\b|gpt-?image|nano-?banana|imagen|grok|firefly/i;
// Hugging Face staff and projects – their apps are kept up to date
const TRUSTED = new Set(['multimodalart', 'huggingface-projects', 'hysts', 'zerogpu-aoti', 'akhaliq', 'linoyts', 'Gradio-Community', 'gradio', 'huggingface', 'evalstate']);

// A rough quality order of the open model families, from public leaderboards and our own tests (2026). The finder
// adds how liked and trending each model is, so a new family still ranks by its popularity.
const FAMILIES = [
  // images
  { kind: 'image', re: /hunyuanimage-?3/i, tier: 92, label: 'HunyuanImage 3', nodes: true },
  { kind: 'image', re: /qwen-?image(?!-edit)/i, tier: 90, label: 'Qwen-Image' },
  { kind: 'image', re: /flux\.?2-?dev/i, tier: 88, label: 'FLUX.2 dev' },
  { kind: 'image', re: /z-?image/i, tier: 86, label: 'Z-Image' },
  { kind: 'image', re: /hidream/i, tier: 82, label: 'HiDream' },
  { kind: 'image', re: /flux\.?2-?klein/i, tier: 80, label: 'FLUX.2 klein' },
  { kind: 'image', re: /bagel/i, tier: 72, label: 'BAGEL', nodes: true },
  { kind: 'image', re: /flux\.?1-?(dev|krea)/i, tier: 78, label: 'FLUX.1' },
  { kind: 'image', re: /flux\.?1-?schnell/i, tier: 72, label: 'FLUX.1 schnell' },
  { kind: 'image', re: /stable-diffusion-3\.5|sd-?3\.5/i, tier: 70, label: 'Stable Diffusion 3.5' },
  { kind: 'image', re: /cogview-?4/i, tier: 70, label: 'CogView4' },
  { kind: 'image', re: /lumina/i, tier: 68, label: 'Lumina' },
  { kind: 'image', re: /sana/i, tier: 64, label: 'SANA' },
  { kind: 'image', re: /kolors/i, tier: 62, label: 'Kolors' },
  { kind: 'image', re: /omnigen/i, tier: 62, label: 'OmniGen' },
  { kind: 'image', re: /playground-?v2/i, tier: 60, label: 'Playground v2.5' },
  { kind: 'image', re: /janus/i, tier: 52, label: 'Janus' },
  { kind: 'image', re: /pixart/i, tier: 55, label: 'PixArt' },
  { kind: 'image', re: /sdxl|stable-diffusion-xl/i, tier: 54, label: 'SDXL' },
  { kind: 'image', re: /dreamshaper/i, tier: 45, label: 'DreamShaper' },
  { kind: 'image', re: /stable-diffusion-(v-?)?[12]|sd-?(1\.5|2\.1)/i, tier: 35, label: 'Stable Diffusion 1/2' },
  // videos
  { kind: 'video', re: /wan-?2\.?[2-9].*(a14b|14b)|wan2-2-fp8|wan-?2-?2-?14b/i, tier: 90, label: 'Wan 2.2 14B' },
  { kind: 'video', re: /hunyuanvideo-?1\.5/i, tier: 86, label: 'HunyuanVideo 1.5' },
  { kind: 'video', re: /ltx-?2/i, tier: 82, label: 'LTX-2' },
  { kind: 'video', re: /wan-?2\.?[2-9]/i, tier: 80, label: 'Wan 2.2' },
  { kind: 'video', re: /skyreels/i, tier: 76, label: 'SkyReels' },
  { kind: 'video', re: /kandinsky-?[5-9]/i, tier: 76, label: 'Kandinsky' },
  { kind: 'video', re: /wan-?2\.?1/i, tier: 74, label: 'Wan 2.1' },
  { kind: 'video', re: /hunyuanvideo/i, tier: 72, label: 'HunyuanVideo' },
  { kind: 'video', re: /magi-?1/i, tier: 70, label: 'MAGI-1' },
  { kind: 'video', re: /ltx-?video|ltxv/i, tier: 64, label: 'LTX-Video' },
  { kind: 'video', re: /cogvideo/i, tier: 60, label: 'CogVideoX' },
  { kind: 'video', re: /mochi/i, tier: 60, label: 'Mochi' },
  { kind: 'video', re: /animatediff/i, tier: 40, label: 'AnimateDiff' },
  // code: models that write SVG only, and the open language models that write code best (effects and SVG)
  { kind: 'svg', re: /omnisvg/i, tier: 78, label: 'OmniSVG' },
  { kind: 'svg', re: /svgthinker/i, tier: 74, label: 'SVGThinker' },
  { kind: 'svg', re: /starvector/i, tier: 66, label: 'StarVector' },
  { kind: 'svg', re: /svg/i, tier: 55, label: 'SVG model' },
  { kind: 'coder', re: /kimi-?k\d/i, tier: 90 },
  { kind: 'coder', re: /glm-?5(?!.*flash)/i, tier: 90 },
  { kind: 'coder', re: /qwen3\.\d+-[\d.]+t/i, tier: 90 },
  { kind: 'coder', re: /deepseek-?v4(?!.*flash)/i, tier: 88 },
  { kind: 'coder', re: /minimax-?m\d(?!.*flash)/i, tier: 86 },
  { kind: 'coder', re: /deepseek/i, tier: 84 },
  { kind: 'coder', re: /qwen.*coder/i, tier: 84 },
  { kind: 'coder', re: /mistral-?large/i, tier: 80 },
  { kind: 'coder', re: /glm/i, tier: 78 },
  { kind: 'coder', re: /minimax/i, tier: 78 },
  { kind: 'coder', re: /gpt-oss-120b/i, tier: 76 },
  { kind: 'coder', re: /qwen/i, tier: 72 },
  { kind: 'coder', re: /gpt-oss/i, tier: 62 },
];
// 'code' apps on Hugging Face are SVG models; 'coder' = language models
const family = (kind, text) => FAMILIES.find(f => (f.kind === kind || (kind === 'code' && f.kind === 'svg')) && f.re.test(text)) || null;

// Pollinations and Cloudflare name their publishers a little differently from Hugging Face.
const PUBLISHER_ALIASES = { deepseek: 'deepseek-ai', 'deepseek-ai': 'deepseek-ai', 'z-ai': 'zai-org', zai: 'zai-org', meta: 'meta-llama', minimax: 'MiniMaxAI', qwen: 'Qwen', mistral: 'mistralai', ibm: 'ibm-granite', google: 'google', openai: 'openai' };
// an id the app accepts: letters, digits, dots and dashes
const appId = (prefix, name) => `${prefix}-${String(name).toLowerCase().replace(/^@cf\//, '').replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '')}`.slice(0, 80);

// ── HTTP ─────────────────────────────────────────────────────────────────────

// Hugging Face allows 500 API requests per 5 minutes without an account: a short wait is waited out (once); a longer
// one makes the whole search fail, so a cut-short list never replaces the saved one.
let limitedFor = 0; // seconds Hugging Face asked to wait during this search
async function getJson(url, { headers = {}, timeoutMs = 25000, retry = true } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: ctrl.signal, redirect: 'follow' });
  } catch (err) {
    return { status: 0, json: null, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 429) {
    const wait = Number(/t=(\d+)/.exec(res.headers.get('ratelimit') || '')?.[1] || res.headers.get('retry-after') || 0);
    if (retry && wait > 0 && wait <= 90) {
      await new Promise(r => setTimeout(r, (wait + 1) * 1000));
      return getJson(url, { headers, timeoutMs, retry: false });
    }
    limitedFor = Math.max(limitedFor, wait || 300);
    return { status: 429, json: null, wait };
  }
  if (!res.ok) return { status: res.status, json: null };
  return { status: res.status, json: await res.json().catch(() => null) };
}

// runs `fn` over `items`, `limit` at a time
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

// ── Licenses ─────────────────────────────────────────────────────────────────

// Models with their author's own license are kept too (free for personal use) unless only open source is wanted.
let openOnly = process.env.FREE_MODELS_OPEN_ONLY === '1';
const isOpenLicense = l => OPEN_LICENSES.has(l) || OPEN_OTHER.test(l);

// The model's license as Hugging Face names it, or null when it isn't allowed.
function licenseOf(model) {
  const tag = (model.tags || []).find(t => t.startsWith('license:'));
  const license = String(model.cardData?.license || (tag ? tag.slice(8) : '') || '').toLowerCase();
  const name = String(model.cardData?.license_name || '').toLowerCase();
  const id = license === 'other' && name ? name : license;
  if (isOpenLicense(id)) return id;
  return openOnly ? null : id || 'not stated';
}

// What an own license means, in short (null for open source). For personal use these models are free either way.
function licenseNote(license, id = '') {
  if (isOpenLicense(license)) return null;
  const l = `${license} ${id}`.toLowerCase();
  if (/hunyuan|tencent/.test(l)) return 'own license – not valid in the EU, UK and South Korea';
  if (/research/.test(l)) return 'own license – research and personal use only';
  if (/non-?commercial|[-_ ]nc[-_ ]|cc-by-nc|-nc$/.test(l)) return 'own license – non-commercial use only';
  if (/stability|community/.test(l)) return 'own license – free below a yearly revenue limit';
  if (license === 'not stated') return 'no license stated';
  return 'own license – free for personal use';
}

// ── Reading a Gradio app's API ───────────────────────────────────────────────
// Works on the app's /config (components with their limits and choices + the functions that use them) and, when
// given, its /gradio_api/info (the parameter names the API expects). The same code runs here and in the app.

const PROMPT_RE = /prompt|^text$|text_?input|^input$|description|caption|^message$|query|instruction|^idea$|^subject$/i;
const NOT_PROMPT_RE = /negative|neg_|system|lora|model|api|token|key|url|path|file|^n$|_n$|_[iv]$|style_?name|seed|template|preset/i;
const IMAGE_IN_RE = /image|frame|start|first|input|photo|picture|reference|init/i;
const SIZE_CHOICE_RE = /aspect|ratio|resolution|size|dimension|orientation|format/i;
const GOOD_API = /^(infer|generate|generate_image|generate_video|text_to_image|t2i|text2image|txt2img|run|predict|process|create|text_to_video|t2v|image_to_video|i2v|video|gradio_text_to_svg|text_to_svg|svg|generate_svg|draw)$/i;
const BAD_API = /example|random|enhance|update|clear|load|reset|upscale|caption|lambda|^get_|^set_|change|toggle|preset|^on_|_on_|dims|upload|refine|polish|translate|cancel|stop|history|lora|style|login|feedback|share|download|save|delete/i;

const shapeOf = s => {
  const str = String(s);
  const px = /(\d{3,4})\s*[x×*]\s*(\d{3,4})/.exec(str);
  if (px) return [Number(px[1]), Number(px[2])];
  const r = /(\d{1,2}(?:\.\d+)?)\s*:\s*(\d{1,2}(?:\.\d+)?)/.exec(str);
  if (r) return [Number(r[1]), Number(r[2])];
  if (/square/i.test(str)) return [1, 1];
  return null;
};

function componentsById(config) {
  return new Map((config?.components || []).map(c => [c.id, c]));
}

// The inputs of one function: [{ name, type, label, required, props }]
function endpointInputs(config, info, dep) {
  const byId = componentsById(config);
  const params = info?.named_endpoints?.[`/${dep.api_name}`]?.parameters || null;
  const inputs = [];
  let i = 0;
  for (const id of dep.inputs || []) {
    const c = byId.get(id);
    const type = String(c?.type || '').toLowerCase();
    if (type === 'state') return null; // hidden state between calls – not something we can drive
    const p = params ? params[i] : null;
    i++;
    const props = c?.props || {};
    inputs.push({
      name: p?.parameter_name || String(props.label || `input_${i}`).toLowerCase().replace(/\W+/g, '_'),
      type,
      label: String(props.label || p?.label || ''),
      required: p ? !p.parameter_has_default : props.value == null,
      props: { minimum: props.minimum, maximum: props.maximum, step: props.step, value: props.value, choices: props.choices, max_length: props.max_length },
    });
  }
  if (params && params.length !== inputs.length) return null; // the API description doesn't line up with the app
  return inputs;
}

function choiceValues(choices) {
  return (Array.isArray(choices) ? choices : []).map(c => (Array.isArray(c) ? { label: String(c[0]), value: c[1] } : { label: String(c), value: c }));
}

// How to call one function of an app for a kind of output, or null when we can't drive it.
function planEndpoint(config, info, dep, kind) {
  if (!dep.api_name || dep.show_api === false || ['private', 'undocumented'].includes(dep.api_visibility) || dep.backend_fn === false) return null;
  const inputs = endpointInputs(config, info, dep);
  if (!inputs) return null;
  const byId = componentsById(config);
  const outputs = (dep.outputs || []).map(id => String(byId.get(id)?.type || '').toLowerCase());
  const want = kind === 'image' ? ['image', 'gallery'] : kind === 'video' ? ['video'] : ['code', 'textbox', 'html', 'markdown', 'file'];
  const outputIndex = outputs.findIndex(t => want.includes(t));
  if (outputIndex < 0) return null;
  const plan = { api: dep.api_name, output: outputs[outputIndex], outputIndex, outputs: outputs.length, fixed: {} };
  const text = p => `${p.name} ${p.label}`;
  // an input the API insists on that we don't set: the value the app itself starts with
  const keep = p => {
    if (!p.required) return true;
    const choices = choiceValues(p.props.choices);
    const v = p.props.value ?? (choices.length ? choices[0].value : p.type === 'checkbox' ? false : ['slider', 'number'].includes(p.type) ? p.props.minimum ?? 0 : ['textbox', 'textarea', 'code'].includes(p.type) ? '' : undefined);
    if (v === undefined) return false;
    plan.fixed[p.name] = v;
    return true;
  };
  for (const p of inputs) {
    const t = p.type;
    if (/api.?key|token|password|secret|credential/i.test(text(p))) return null; // apps that want your own key for a paid service
    if (['textbox', 'textarea', 'code'].includes(t)) {
      if (!plan.prompt && PROMPT_RE.test(text(p)) && !NOT_PROMPT_RE.test(p.name) && !/negative/i.test(p.label)) plan.prompt = { name: p.name, maxLength: Number(p.props.max_length) || null };
      else if (!keep(p)) return null;
    } else if (t === 'slider' || t === 'number') {
      const lim = { name: p.name, min: Number(p.props.minimum ?? 0), max: Number(p.props.maximum ?? 4096), step: Number(p.props.step || 1) };
      if (/^width$|image_?width|\bwidth\b/i.test(text(p))) plan.width = lim;
      else if (/^height$|image_?height|\bheight\b/i.test(text(p))) plan.height = lim;
      else if (/seed/i.test(text(p))) plan.seed = lim;
      else if (/duration|seconds|length/i.test(text(p)) && !/frames/i.test(text(p))) plan.duration = lim;
      else if (!keep(p)) return null;
    } else if (t === 'checkbox') {
      if (/random/i.test(text(p))) plan.randomize = { name: p.name };
      else if (!keep(p)) return null;
    } else if (t === 'radio' || t === 'dropdown') {
      const choices = choiceValues(p.props.choices);
      const shaped = choices.filter(c => shapeOf(c.label) || shapeOf(c.value));
      if (!plan.choice && SIZE_CHOICE_RE.test(text(p)) && shaped.length >= 2) plan.choice = { name: p.name, choices: shaped.map(c => ({ value: c.value, shape: shapeOf(c.value) || shapeOf(c.label) })) };
      else if (!keep(p)) return null;
    } else if (t === 'image') {
      // image and code apps must work from text alone: an image they call optional is left empty
      if (kind === 'video' && !plan.image && IMAGE_IN_RE.test(text(p))) plan.image = { name: p.name, required: p.required && !/optional/i.test(p.label) };
      else if (!p.required || /optional/i.test(p.label)) plan.fixed[p.name] = null;
      else return null;
    } else if (p.required) {
      return null; // a video, audio, file or gallery input we can't fill
    }
  }
  if (!plan.prompt) return null;
  plan.input = plan.image ? (plan.image.required ? 'image' : 'text+image') : 'text';
  if (plan.width && !plan.height) delete plan.width;
  if (plan.height && !plan.width) delete plan.height;
  return plan;
}

function apiScore(plan) {
  let s = 0;
  if (GOOD_API.test(plan.api)) s += 10;
  if (BAD_API.test(plan.api)) s -= 20;
  if (plan.width || plan.choice) s += 2;
  if (plan.seed || plan.randomize) s += 1;
  if (plan.input === 'text') s += 1;
  return s;
}

// The best function of an app for `kind` (or the one named `api`), or null.
function analyzeSpace(config, info, kind, api = null) {
  if (!Array.isArray(config?.dependencies)) return null;
  const plans = config.dependencies.map(dep => planEndpoint(config, info, dep, kind)).filter(Boolean)
    .filter(p => apiScore(p) > -10);
  if (api) return plans.find(p => p.api === api) || null;
  if (!plans.length) return null;
  plans.sort((a, b) => apiScore(b) - apiScore(a));
  // a video app with separate text and image functions: keep the image one too
  const best = plans[0];
  if (kind === 'video' && best.input === 'text') {
    const img = plans.find(p => p.input !== 'text' && p.api !== best.api);
    if (img) best.imageApi = img.api;
  }
  return best;
}

// ── Filling in a call ─────────────────────────────────────────────────────────

const snap = (v, lim) => {
  const step = lim.step > 0 ? lim.step : 1;
  const x = Math.round((v - lim.min) / step) * step + lim.min;
  return Math.max(lim.min, Math.min(lim.max, Number(x.toFixed(6))));
};

// The values for a call: { [parameter name]: value }. `image` is passed through (the app uploads it).
function fillValues(plan, { prompt, aspectRatio = '1:1', image = null, duration = null, area = 1024 * 1024 }) {
  const values = { ...(plan.fixed || {}) };
  const max = plan.prompt.maxLength || 2000;
  values[plan.prompt.name] = String(prompt || '').slice(0, max);
  const [rw, rh] = String(aspectRatio).split(':').map(Number);
  const ratio = rw > 0 && rh > 0 ? rw / rh : 1;
  if (plan.width && plan.height) {
    let w = Math.sqrt(area * ratio);
    let h = w / ratio;
    const k = Math.min(1, plan.width.max / w, plan.height.max / h);
    w *= k; h *= k;
    values[plan.width.name] = snap(w, plan.width);
    values[plan.height.name] = snap(h, plan.height);
  }
  if (plan.choice) {
    const dist = s => Math.abs(Math.log((s[0] / s[1]) / ratio));
    values[plan.choice.name] = plan.choice.choices.reduce((a, b) => (dist(b.shape) < dist(a.shape) ? b : a)).value;
  }
  if (plan.randomize) values[plan.randomize.name] = true;
  else if (plan.seed) values[plan.seed.name] = Math.floor(plan.seed.min + Math.random() * Math.max(1, Math.min(plan.seed.max, 2 ** 31 - 1) - plan.seed.min));
  if (plan.duration && duration) values[plan.duration.name] = snap(Number(duration), plan.duration);
  if (plan.image && image) values[plan.image.name] = image;
  return values;
}

// ── Finding ──────────────────────────────────────────────────────────────────

// an app's own subdomain (older aliases in its domain list answer 404)
const spaceHost = s => s.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const spaceUrl = host => (HF_SPACES_BASE ? `${HF_SPACES_BASE}/${host}` : `https://${host}.hf.space`);
const prettyName = id => id.split('/').pop().replace(/[-_]+/g, ' ').replace(/\b(\d+)b\b/gi, '$1B').trim().replace(/^./, c => c.toUpperCase());

async function candidateModels(log, headers) {
  const queries = [
    ['image', 'pipeline_tag=text-to-image&sort=likes&limit=70'],
    ['image', 'pipeline_tag=text-to-image&sort=trendingScore&limit=40'],
    ['video', 'pipeline_tag=text-to-video&sort=likes&limit=40'],
    ['video', 'pipeline_tag=image-to-video&sort=likes&limit=40'],
    ['video', 'pipeline_tag=text-to-video&sort=trendingScore&limit=25'],
    ['video', 'pipeline_tag=image-to-video&sort=trendingScore&limit=25'],
    ['code', 'search=svg&sort=likes&limit=40'],
  ];
  const found = new Map();
  const results = await pool(queries, 4, async ([kind, q]) => ({ kind, res: await getJson(`${HF_API}/api/models?${q}&expand[]=likes&expand[]=tags&expand[]=pipeline_tag&expand[]=trendingScore&expand[]=cardData`, { headers }) }));
  // nothing came back: say why instead of saving an empty list
  if (!results.some(r => Array.isArray(r.res.json))) {
    const limited = results.find(r => r.res.status === 429);
    throw new Error(limited
      ? `Hugging Face is limiting requests for now – try again in ${Math.max(1, Math.ceil((limited.res.wait || 300) / 60))} min.`
      : `Hugging Face isn’t answering (${results[0]?.res.error || `HTTP ${results[0]?.res.status}`}).`);
  }
  let seen = 0;
  for (const { kind, res } of results) {
    for (const m of Array.isArray(res.json) ? res.json : []) {
      seen++;
      if (found.has(m.id)) continue;
      const text = `${m.id} ${(m.tags || []).join(' ')}`;
      if (NSFW.test(text) || NOT_A_GENERATOR.test(m.id) || (m.tags || []).some(t => /^(lora|gguf|base_model:adapter:|base_model:quantized:)/.test(t))) continue;
      const license = licenseOf(m);
      if (!license) continue;
      if (kind === 'code' && !/svg/i.test(m.id)) continue;
      found.set(m.id, { id: m.id, kind, license, likes: m.likes || 0, trending: m.trendingScore || 0, task: m.pipeline_tag || '' });
    }
  }
  // the models ComfyUI's official templates use, found on Hugging Face by name
  for (const m of await comfyCandidates(log, headers)) {
    const old = found.get(m.id);
    if (old) Object.assign(old, { comfyUsage: m.comfyUsage, comfyName: m.comfyName });
    else found.set(m.id, m);
  }
  // the most promising ones are looked up (each costs a request); popular in ComfyUI counts too
  const rank = m => (family(m.kind, m.id)?.tier ?? 50) + 8 * Math.log10(1 + m.likes) + Math.min(10, m.trending / 5) + Math.min(10, 2 * Math.log10(1 + (m.comfyUsage || 0)));
  const list = [...found.values()].sort((a, b) => rank(b) - rank(a)).slice(0, 120);
  log(`Hugging Face: ${seen} models looked at, ${found.size} open-source generators, the ${list.length} most promising checked`);
  return list;
}

// ComfyUI: the open models of its official workflow templates (with how often each template is used). ComfyUI runs
// models on your own computer; here it's a list of the models people really use, looked up on Hugging Face.
const COMFY_TEMPLATES = process.env.COMFY_TEMPLATES_URL || 'https://raw.githubusercontent.com/Comfy-Org/workflow_templates/main/templates/index.json';
const COMFY_GENERIC = /^(none|wan|flux|lightricks|stability|tencent|qwen|hunyuan|minimax|bytedance|google|openai|alibaba|kling|comfyui|sdxl?)$/i;

async function comfyCandidates(log, headers) {
  const res = await getJson(COMFY_TEMPLATES, { timeoutMs: 30000 });
  if (!Array.isArray(res.json)) { log(`ComfyUI: its template list isn’t available (${res.error || `HTTP ${res.status}`})`); return []; }
  const byName = new Map();
  for (const t of res.json.flatMap(c => c.templates || [])) {
    if (!t.openSource) continue;
    const tags = t.tags || [];
    const kind = tags.includes('Text to Image') ? 'image' : tags.some(g => /^(Text|Image) to Video$/.test(g)) ? 'video' : null;
    if (!kind) continue;
    for (const name of t.models || []) {
      if (!name || COMFY_GENERIC.test(String(name).trim())) continue;
      const key = `${kind}:${String(name).toLowerCase()}`;
      const e = byName.get(key) || { name: String(name), kind, usage: 0 };
      e.usage += Number(t.usage) || 0;
      byName.set(key, e);
    }
  }
  const names = [...byName.values()].sort((a, b) => b.usage - a.usage).slice(0, 60);
  const tasks = { image: ['text-to-image'], video: ['text-to-video', 'image-to-video'] };
  const out = [];
  await pool(names, 6, async n => {
    const q = encodeURIComponent(n.name.trim().replace(/\s+/g, '-'));
    const r = await getJson(`${HF_API}/api/models?search=${q}&sort=likes&limit=6&expand[]=likes&expand[]=tags&expand[]=pipeline_tag&expand[]=trendingScore&expand[]=cardData`, { headers });
    const m = (Array.isArray(r.json) ? r.json : []).find(x => tasks[n.kind].includes(x.pipeline_tag) && licenseOf(x)
      && !NSFW.test(`${x.id} ${(x.tags || []).join(' ')}`) && !NOT_A_GENERATOR.test(x.id)
      && !(x.tags || []).some(t => /^(lora|gguf|base_model:adapter:|base_model:quantized:)/.test(t)));
    if (m) out.push({ id: m.id, kind: n.kind, license: licenseOf(m), likes: m.likes || 0, trending: m.trendingScore || 0, task: m.pipeline_tag, comfyUsage: n.usage, comfyName: n.name });
  });
  log(`ComfyUI: ${names.length} open models in its official templates, ${out.length} of them open source on Hugging Face`);
  return out;
}

async function spacesFor(models, log, headers) {
  const spaces = new Map();
  await pool(models, 6, async m => {
    const res = await getJson(`${HF_API}/api/spaces?models=${encodeURIComponent(m.id)}&sort=likes&limit=8&expand[]=runtime&expand[]=likes&expand[]=sdk&expand[]=tags&expand[]=cardData&expand[]=models`, { headers });
    const list = (Array.isArray(res.json) ? res.json : []).filter(s => {
      // a GPU of its own or Hugging Face's free ZeroGPU – an app on a plain CPU only forwards to another service
      if (s.sdk !== 'gradio' || s.runtime?.stage !== 'RUNNING' || !s.runtime?.hardware?.current || /^cpu/.test(s.runtime.hardware.current)) return false;
      const about = `${s.id} ${s.cardData?.title || ''} ${s.cardData?.short_description || ''} ${(s.tags || []).join(' ')} ${(s.models || []).join(' ')}`;
      const name = `${s.id} ${s.cardData?.title || ''}`;
      return !NSFW.test(about) && !CLOSED.test(name) && !NOT_A_GENERATOR.test(name);
    });
    const author = m.id.split('/')[0].toLowerCase();
    const trust = s => (s.id.split('/')[0].toLowerCase() === author ? 3 : TRUSTED.has(s.id.split('/')[0]) ? 2 : 1);
    list.sort((a, b) => trust(b) - trust(a) || (b.likes || 0) - (a.likes || 0));
    for (const s of list.slice(0, 2)) {
      const old = spaces.get(s.id);
      // an app that runs several models counts for the best-known one
      const fam = family(m.kind, m.id);
      if (old && (family(old.model.kind, old.model.id)?.tier || 0) >= (fam?.tier || 0)) continue;
      spaces.set(s.id, { space: s, model: m, official: trust(s) === 3, trusted: trust(s) >= 2 });
    }
  });
  log(`Hugging Face: ${spaces.size} running apps use them`);
  return [...spaces.values()];
}

async function probeSpaces(candidates, log, headers) {
  const entries = [];
  let failed = 0;
  await pool(candidates, 6, async ({ space, model, official, trusted }) => {
    const host = spaceHost(space);
    const [config, info] = await Promise.all([
      getJson(`${spaceUrl(host)}/config`, { headers, timeoutMs: 20000 }),
      getJson(`${spaceUrl(host)}/gradio_api/info`, { headers, timeoutMs: 20000 }),
    ]);
    // a model tagged text-to-image may really be a video app (and the other way round): what it returns decides
    let kind = model.kind;
    let plan = config.json && info.json ? analyzeSpace(config.json, info.json, kind) : null;
    if (!plan && config.json && info.json && kind !== 'code') {
      const other = kind === 'image' ? 'video' : 'image';
      // …but only an app whose own name says what it is
      plan = family(other, space.id) ? analyzeSpace(config.json, info.json, other) : null;
      if (plan) kind = other;
    }
    if (!plan) {
      failed++;
      if (process.env.FREE_MODELS_DEBUG) {
        const byId = componentsById(config.json);
        const fns = (config.json?.dependencies || []).filter(d => d.api_name).map(d => `${d.api_name}(${(d.inputs || []).map(i => `${byId.get(i)?.type}:${byId.get(i)?.props?.label || ''}`).join(', ')}) → ${(d.outputs || []).map(i => byId.get(i)?.type).join(',')}`);
        log(`  ✗ ${kind} ${space.id} [${config.status}/${info.status}] ${fns.slice(0, 6).join(' | ').slice(0, 600)}`);
      }
      return;
    }
    // the app's own name first: an app that lists several models is named after the one it shows
    const fam = family(kind, space.id) || (kind === model.kind ? family(kind, model.id) : null);
    if (kind !== model.kind && !fam) return;
    const hardware = space.runtime.hardware.current;
    const score = Math.round(((fam?.tier ?? 50) + 6 * Math.log10(1 + model.likes) + 4 * Math.log10(1 + (space.likes || 0)) + (official ? 6 : trusted ? 3 : 0) + Math.min(5, model.trending / 10) + Math.min(6, 1.5 * Math.log10(1 + (model.comfyUsage || 0)))) * 10) / 10;
    entries.push({
      id: appId('hf', host),
      kind,
      role: kind === 'code' ? 'svg' : undefined, // the code apps found on Hugging Face write SVG only
      label: fam && !/model$/.test(fam.label) ? `${fam.label}${/(turbo|fast|lightning|distill)/i.test(space.id + model.id) ? ' (fast)' : ''}` : prettyName(model.id),
      provider: 'huggingface',
      model: model.id,
      license: (kind !== model.kind && licenseOf({ cardData: space.cardData })) || model.license,
      licenseNote: licenseNote((kind !== model.kind && licenseOf({ cardData: space.cardData })) || model.license, `${model.id} ${space.id}`),
      space: space.id,
      host,
      hardware,
      zeroGpu: /^zero/.test(hardware),
      official,
      likes: model.likes,
      spaceLikes: space.likes || 0,
      comfy: model.comfyUsage ? model.comfyName || true : undefined, // in ComfyUI's official templates
      score,
      nodes: Boolean(fam?.nodes),
      ...plan,
    });
  });
  log(`Hugging Face: ${entries.length} apps can be driven${failed ? `, ${failed} left out (no usable API)` : ''}`);
  return entries;
}

// Pollinations: the models that aren't paid-only and are open source on Hugging Face
async function pollinationsModels(log, headers) {
  const [img, txt] = await Promise.all([getJson(`${POLLINATIONS}/image/models`), getJson(`${POLLINATIONS}/text/models`)]);
  const list = [
    ...(Array.isArray(img.json) ? img.json : []).map(m => ({ ...m, kind: 'image' })),
    ...(Array.isArray(txt.json) ? txt.json : []).map(m => ({ ...m, kind: 'coder' })),
  ].filter(m => m.paid_only === false && m.name && !String(m.name).startsWith('community/') && !NSFW.test(m.name)
    && (m.kind === 'image' ? (m.output_modalities || ['image']).includes('image') : (m.output_modalities || ['text']).join() === 'text' && !/guard|audio|midijourney|safeguard/i.test(m.name)));
  const entries = [];
  await pool(list, 6, async m => {
    const open = await openOnHuggingFace(m.name, headers);
    if (!open) return;
    const fam = family(m.kind, m.name);
    if (m.kind === 'coder' && !fam) return; // only language models known to write good code
    entries.push({
      id: appId('poll', m.name),
      kind: m.kind === 'coder' ? 'code' : 'image',
      role: m.kind === 'coder' ? 'coder' : undefined,
      label: m.title || prettyName(open.id),
      provider: 'pollinations',
      apiModel: m.name,
      model: open.id,
      license: open.license,
      licenseNote: licenseNote(open.license, open.id),
      likes: open.likes,
      score: Math.round(((fam?.tier ?? 60) + 6 * Math.log10(1 + open.likes)) * 10) / 10,
      // language models read structured specifications (XML, JSON); image models only their prompt
      nodes: m.kind === 'coder',
    });
  });
  log(`Pollinations: ${list.length} free models, ${entries.length} of them open source`);
  return entries;
}

// The same model on Hugging Face, when its license is allowed: { id, license, likes } or null.
async function openOnHuggingFace(name, headers) {
  const [pub, ...rest] = String(name).replace(/^@cf\//, '').split('/');
  if (!rest.length) return null;
  const res = await getJson(`${HF_API}/api/models/${PUBLISHER_ALIASES[pub] || pub}/${rest.join('/')}?expand[]=tags&expand[]=cardData&expand[]=likes`, { headers });
  const license = res.json ? licenseOf(res.json) : null;
  return license ? { id: res.json.id, license, likes: res.json.likes || 0 } : null;
}

// Cloudflare Workers AI (with a connected free account): its open-source language models write code within the free
// daily allowance. Its image models each want their own request format, so they stay with the app's built-in ones.
async function cloudflareModels(cloudflare, log, headers) {
  if (!cloudflare?.accountId || !cloudflare?.token) return [];
  const res = await getJson(`${CLOUDFLARE}/accounts/${encodeURIComponent(cloudflare.accountId)}/ai/models/search?task=${encodeURIComponent('Text Generation')}&per_page=100`, {
    headers: { Authorization: `Bearer ${cloudflare.token}` },
  });
  const list = (Array.isArray(res.json?.result) ? res.json.result : [])
    .filter(m => /^@cf\//.test(m.name || '') && family('coder', m.name) && !/guard|lora|awq|-int8|vision|-vl\b/i.test(m.name)
      && !(m.properties || []).some(p => p.property_id === 'planned_deprecation_date'));
  const entries = [];
  await pool(list, 6, async m => {
    const open = await openOnHuggingFace(m.name, headers);
    if (!open) return;
    entries.push({
      id: appId('cf', m.name),
      kind: 'code',
      role: 'coder',
      label: prettyName(open.id),
      provider: 'cloudflare',
      apiModel: m.name,
      model: open.id,
      license: open.license,
      licenseNote: licenseNote(open.license, open.id),
      likes: open.likes,
      score: Math.round((family('coder', m.name).tier + 6 * Math.log10(1 + open.likes) + 3) * 10) / 10, // +3: really free
      nodes: true,
    });
  });
  log(`Cloudflare: ${list.length} code models, ${entries.length} of them open source`);
  return entries;
}

// Everything found, best first per kind.
async function discover({ hfToken = '', cloudflare = null, openSourceOnly = process.env.FREE_MODELS_OPEN_ONLY === '1', log = () => {} } = {}) {
  openOnly = openSourceOnly;
  limitedFor = 0;
  const started = Date.now();
  const headers = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};
  const models = await candidateModels(log, headers);
  const [spaceEntries, pollEntries, cfEntries] = await Promise.all([
    spacesFor(models, log, headers).then(c => probeSpaces(c, log, headers)),
    pollinationsModels(log, headers).catch(err => { log(`Pollinations: ${err.message}`); return []; }),
    cloudflareModels(cloudflare, log, headers).catch(err => { log(`Cloudflare: ${err.message}`); return []; }),
  ]);
  const catalog = { version: VERSION, updatedAt: new Date().toISOString(), tookMs: Date.now() - started };
  for (const kind of KINDS) {
    const sorted = [...spaceEntries, ...pollEntries, ...cfEntries].filter(e => e.kind === kind)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
    // one entry per model and place: the best app runs it, the others are its backups when it's down
    const byModel = new Map();
    for (const e of sorted) {
      const key = `${e.provider}:${e.model.toLowerCase()}`;
      const first = byModel.get(key);
      if (!first) byModel.set(key, { ...e, alternates: [] });
      else if (e.provider === 'huggingface' && first.alternates.length < 2) {
        first.alternates.push({ space: e.space, host: e.host, hardware: e.hardware, zeroGpu: e.zeroGpu });
      }
    }
    const kept = [...byModel.values()].slice(0, PER_KIND);
    // versions of one family (Qwen-Image, 2.1, 2512…) get the model's own name instead of the family name
    const same = {};
    for (const e of kept) same[e.label] = (same[e.label] || 0) + 1;
    for (const e of kept) {
      if (same[e.label] > 1 && e.provider === 'huggingface') {
        const fast = /(turbo|fast|lightning|distill)/i.test(e.space) && !/(turbo|fast|lightning|distill)/i.test(e.model);
        // the model's name when it is what the app shows, otherwise the app's own name
        const fromModel = !family(e.kind, e.space) || family(e.kind, e.model) === family(e.kind, e.space);
        e.label = `${prettyName(fromModel ? e.model : e.space)}${fast ? ' (fast)' : ''}`;
      }
    }
    catalog[kind] = kept.map((e, i) => ({ ...e, rank: i + 1 }));
  }
  catalog.counts = Object.fromEntries(KINDS.map(k => [k, catalog[k].length]));
  // a search Hugging Face cut short (or that found nothing) must not replace a good list
  if (limitedFor) throw new Error(`Hugging Face is limiting requests for now, so the search was cut short – the list wasn’t changed. Try again in ${Math.max(1, Math.ceil(limitedFor / 60))} min.`);
  if (!catalog.image.length) throw new Error('The search found no image models – the list wasn’t changed. Try again later.');
  return catalog;
}

// ── The saved list ───────────────────────────────────────────────────────────

const dataDir = () => path.join(os.homedir(), '.hombresai'); // the app's own data folder
const catalogFile = () => path.join(dataDir(), 'free-models.json');

function readCatalog(file = catalogFile()) {
  try {
    const c = JSON.parse(fs.readFileSync(file, 'utf8'));
    return c?.version === VERSION ? c : null;
  } catch {
    return null;
  }
}

function writeCatalog(catalog, file = catalogFile()) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(catalog, null, 1));
  fs.renameSync(tmp, file);
}

function printCatalog(c) {
  const titles = { image: 'Images', video: 'Videos', code: 'Code (effects and SVG)' };
  for (const kind of KINDS) {
    console.log(`\n${titles[kind]} (${c[kind].length})`);
    for (const e of c[kind]) {
      console.log(`  ${String(e.rank).padStart(2)}. ${e.label.padEnd(26)} ${(e.licenseNote ? `${e.license.slice(0, 18)}*` : e.license).padEnd(22)} ${whereLabel(e)}${e.comfy ? ' · in ComfyUI' : ''}${e.role === 'svg' ? ' · SVG only' : ''}${e.nodes ? ' · reads node specs' : ''}`);
    }
  }
  console.log(`\n* own license – free for personal use (each model's license has the details).\nUpdated ${c.updatedAt} in ${(c.tookMs / 1000).toFixed(0)} s.`);
}

function whereLabel(e) {
  if (e.provider === 'pollinations') return 'Pollinations (needs pollen)';
  if (e.provider === 'cloudflare') return 'Cloudflare (free daily allowance)';
  return `Hugging Face · ${e.space}${e.zeroGpu ? ' (free GPU time)' : ''}`;
}

module.exports = { VERSION, KINDS, discover, analyzeSpace, planEndpoint, fillValues, readCatalog, writeCatalog, catalogFile, licenseOf, licenseNote, family, whereLabel };

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  // the app's own Hugging Face token and Cloudflare account, when they are set up
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(path.join(dataDir(), 'config.json'), 'utf8')); } catch { /* nothing set up – fine */ }
  const quiet = args.has('--json');
  discover({ hfToken: process.env.HF_TOKEN || saved.hfToken || '', cloudflare: saved.cloudflare, openSourceOnly: args.has('--open-only'), log: msg => { if (!quiet) console.log(msg); } }).then(catalog => {
    if (!args.has('--dry-run')) writeCatalog(catalog);
    if (quiet) console.log(JSON.stringify(catalog, null, 2));
    else {
      printCatalog(catalog);
      if (!args.has('--dry-run')) console.log(`Saved to ${catalogFile()}.`);
    }
  }).catch(err => {
    console.error(`Couldn’t finish: ${err.message}`);
    process.exit(1);
  });
}
