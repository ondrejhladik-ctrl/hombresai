'use strict';
/*
 * hombresai – a local studio for generating images with the Gemini API (Nano Banana models)
 * and open-source models via Pollinations, plus one-click photo Effects.
 * Generated images are saved only to Google Drive (the “hombresai” folder). The computer keeps
 * just the history, small thumbnails and references. No dependencies – Node.js 18+ is enough.
 *
 *   node server.js          starts the server at http://127.0.0.1:4848
 *   node server.js --open   ...and opens the app in the browser
 */

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

// ── Paths and limits ────────────────────────────────────────────────────────

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
// Older versions saved images in the project folder (OneDrive) – on startup they’re moved to Google Drive.
const LEGACY_OUTPUT_DIR = path.join(ROOT, 'output');
// Config, history and cache live in the user profile, outside OneDrive.
// The app used to be called myhighsfield – its data folder is renamed on the first start.
const DATA_DIR = (() => {
  const dir = path.join(os.homedir(), '.hombresai');
  const legacy = path.join(os.homedir(), '.myhighsfield');
  if (!fs.existsSync(dir) && fs.existsSync(legacy)) {
    try { fs.renameSync(legacy, dir); } catch { return legacy; }
  }
  return dir;
})();
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const REFS_DIR = path.join(CACHE_DIR, 'refs');
const THUMBS_DIR = path.join(CACHE_DIR, 'thumbs');
const PENDING_DIR = path.join(CACHE_DIR, 'pending'); // images still waiting to be uploaded to Drive
const EFFECTS_DIR = path.join(ROOT, 'effects'); // built-in effects (GLSL files)
const CUSTOM_EFFECTS_DIR = path.join(EFFECTS_DIR, 'custom'); // effects made by the user or the AI coder

const API_BASE = (process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
const GOOGLE = {
  auth: process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth',
  token: process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token',
  revoke: process.env.GOOGLE_REVOKE_URL || 'https://oauth2.googleapis.com/revoke',
  drive: (process.env.DRIVE_API_BASE || 'https://www.googleapis.com/drive/v3').replace(/\/+$/, ''),
  upload: (process.env.DRIVE_UPLOAD_BASE || 'https://www.googleapis.com/upload/drive/v3').replace(/\/+$/, ''),
};
const POLLINATIONS_BASE = (process.env.POLLINATIONS_BASE || 'https://gen.pollinations.ai').replace(/\/+$/, '');
const HOST = '127.0.0.1';
const BASE_PORT = Number(process.env.PORT) || 4848;
const OPEN_BROWSER = process.argv.includes('--open');

const MAX_BODY_BYTES = 64 * 1024 * 1024;
const MAX_INLINE_BYTES = 19 * 1024 * 1024; // Gemini accepts at most 20 MB of inline data per request
const MAX_REFS = 14;
const MAX_PROMPT_CHARS = 20000;
const MAX_EFFECT_BYTES = 64 * 1024;
const GENERATE_TIMEOUT_MS = 8 * 60 * 1000;
const MODEL_CACHE_MS = 10 * 60 * 1000;
const MEM_CACHE_MAX_BYTES = 256 * 1024 * 1024; // recently used images stay in memory so they aren’t re-downloaded from Drive
const MODEL_ID_RE = /^[a-z0-9][a-z0-9.-]{1,80}$/i;

// drive.file = the app only sees files it created itself. The rest of your Drive stays untouched.
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FOLDER = 'hombresai';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

// ── Models ──────────────────────────────────────────────────────────────────

const RATIOS_ALL = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', '1:4', '4:1', '1:8', '8:1'];
const RATIOS_STD = RATIOS_ALL.slice(0, 10);
const IMAGE_SIZES = ['512', '1K', '2K', '4K'];
const THINKING_LEVELS = ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH'];

// Prices from https://ai.google.dev/gemini-api/docs/pricing (Standard, October 2026), in USD:
// image = price of one output image by resolution, input / textOut = price per 1M tokens.
const KNOWN_MODELS = [
  {
    id: 'gemini-nano-banana-2.1',
    label: 'Nano Banana 2.1',
    tag: 'Recommended',
    desc: 'The newest model. Fast and cheap, with excellent in-image text, character consistency and edits.',
    ratios: RATIOS_ALL,
    sizes: ['1K', '2K', '4K'],
    thinking: ['MINIMAL', 'MEDIUM', 'HIGH'],
    thinkingDefault: 'MEDIUM',
    refsHint: 'up to 10 objects + 4 characters',
    price: { image: { '1K': 0.0336, '2K': 0.0504, '4K': 0.113 }, input: 1.5, textOut: 7.5 },
  },
  {
    id: 'gemini-3-pro-image',
    label: 'Nano Banana Pro',
    tag: 'Top quality',
    desc: 'Studio quality, complex compositions and precise text. Always thinks at full depth – slower and pricier.',
    ratios: RATIOS_STD,
    sizes: ['1K', '2K', '4K'],
    thinking: null,
    refsHint: 'up to 6 objects, 5 characters and 3 styles',
    price: { image: { '1K': 0.134, '2K': 0.134, '4K': 0.24 }, input: 2, textOut: 12 },
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    label: 'Nano Banana 2 Lite',
    tag: 'Fast',
    desc: 'Minimal latency, 1K only. Ideal for exploring ideas in bulk.',
    ratios: RATIOS_STD,
    sizes: ['1K'],
    thinking: ['MINIMAL', 'HIGH'],
    thinkingDefault: 'MINIMAL',
    refsHint: 'up to 14 objects (no character consistency)',
    price: { image: { '1K': 0.0336 }, input: 0.25, textOut: 1.5 },
  },
  {
    id: 'gemini-3.1-flash-image',
    label: 'Nano Banana 2',
    tag: 'Older',
    desc: 'The previous generation (deprecated by Google). The only one that also supports 512 px.',
    ratios: RATIOS_ALL,
    sizes: ['512', '1K', '2K', '4K'],
    thinking: ['MINIMAL', 'HIGH'],
    thinkingDefault: 'MINIMAL',
    refsHint: 'up to 10 objects + 4 characters',
    price: { image: { '512': 0.045, '1K': 0.067, '2K': 0.101, '4K': 0.151 }, input: 0.5, textOut: 3 },
  },
];
for (const m of KNOWN_MODELS) Object.assign(m, { provider: 'gemini', refs: true, maxRefs: MAX_REFS });

// Open-source models, run through Pollinations (one free API key, free daily “pollen”).
// They have no CZK price – the free tier covers them.
const OPEN_MODELS = [
  {
    id: 'os-z-image-turbo',
    apiModel: 'tongyi-mai/z-image-turbo',
    label: 'Z-Image Turbo',
    desc: 'Alibaba’s open-source model (Apache 2.0). Very fast and photorealistic. Text only – no references.',
    refs: false,
    refsHint: 'no references – text only',
  },
  {
    id: 'os-flux2-klein',
    apiModel: 'black-forest-labs/flux.2-klein-4b',
    label: 'FLUX.2 klein',
    desc: 'Black Forest Labs’ open 4B model (Apache 2.0). Generates and edits photos with references – works with Effects.',
    refs: true,
    maxRefs: 4,
    refsHint: 'up to 4 references',
  },
  {
    id: 'os-flux1-schnell',
    apiModel: 'black-forest-labs/flux.1-schnell',
    label: 'FLUX.1 schnell',
    desc: 'The classic open FLUX model (Apache 2.0). Quick drafts. Text only – no references.',
    refs: false,
    refsHint: 'no references – text only',
  },
  {
    id: 'os-qwen-image',
    label: 'Qwen-Image',
    desc: 'Alibaba’s open 20B model (Apache 2.0) – the best of the free ones at lettering and text in pictures. Runs on Hugging Face’s free GPUs; slower, and it uses more of the daily free GPU time.',
    refs: false,
    refsHint: 'no references – text only',
    hfOnly: true,
  },
].map(m => ({ ...m, provider: 'pollinations', open: true, group: 'open', tag: 'Open source', free: true, ratios: RATIOS_STD, sizes: [], thinking: null, price: null }));

const MODELS_BY_ID = new Map([...KNOWN_MODELS, ...OPEN_MODELS].map(m => [m.id, m]));
const KNOWN_BY_ID = new Map(KNOWN_MODELS.map(m => [m.id, m]));
const KNOWN_LABELS = new Set(KNOWN_MODELS.map(m => m.label.toLowerCase()));
// Google’s model list still returns the old Nano Banana 2.5 and “preview” aliases of known models – they’d only confuse the menu.
const HIDDEN_MODEL_IDS = new Set(['gemini-2.5-flash-image']);
const isAliasOfKnown = (id, displayName) =>
  KNOWN_BY_ID.has(id.replace(/-preview.*$/, '')) || KNOWN_LABELS.has(String(displayName || '').trim().toLowerCase());

// How the model should treat a reference – the text is inserted into the request right before the image.
const REF_ROLES = {
  auto: '',
  character: "Use it as the CHARACTER reference: keep this person's face, identity, hairstyle and body proportions exactly the same.",
  object: 'Use it as the OBJECT/PRODUCT reference: reproduce this item faithfully, with its exact shape, colors, materials, text and logos.',
  style: 'Use it only as a STYLE reference: match its visual style, color palette, lighting and mood, but do not copy its content.',
  scene: 'Use it as the SCENE/BACKGROUND reference: set the result in this environment.',
  pose: 'Use it as the POSE/COMPOSITION reference: match the body pose and camera framing.',
  edit: 'This is the BASE IMAGE to edit: keep everything unchanged except what the instructions ask to change.',
};

// Cheap text models for “Enhance prompt” (a fraction of a cent per call). Tried in order.
const ENHANCE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

// AI coders for new effects. The open-weight ones run on Pollinations’ free credit (they aren’t paid-only there).
const CODER_MODELS = [
  { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash', provider: 'pollinations', note: 'free · open source' },
  { id: 'z-ai/glm-5.3-flash', label: 'GLM 5.3 Flash', provider: 'pollinations', note: 'free · open source' },
  { id: 'openai/gpt-oss-20b', label: 'gpt-oss 20B', provider: 'pollinations', note: 'free · open source' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', provider: 'gemini', note: 'your Gemini key · ≈ CZK 0.03' },
];
// open models Pollinations also serves without a key – the fallback when their key check is down
const POLLINATIONS_ANON_CODERS = ['openai/gpt-oss-20b', 'z-ai/glm-5.3-flash'];
const ENHANCE_SYSTEM =`You are an expert prompt writer for Google's Nano Banana image models (Gemini image generation).
Rewrite the user's idea into ONE vivid, detailed image-generation prompt in English.
- Write a natural descriptive paragraph, not a list of keywords: subject and its details, action, setting, composition and camera angle, lens, lighting, mood, color palette, materials and textures, overall style.
- Keep every concrete detail and the intent of the user. Do not add text, captions, logos or watermarks unless asked. Text the user wants rendered in the image must stay exactly as written (original language), in quotes.
- If reference images are attached, call them "reference image 1", "reference image 2", ... and say precisely what to take from each (e.g. the person's face and identity, the exact product design, the style) and what should change.
- Do not mention aspect ratio, resolution or these instructions.
Return only the final prompt: no title, no surrounding quotes, no markdown, no explanations.`;

// Gemini prices are in USD; the app shows them in CZK at the daily CNB (Czech National Bank) rate.
const CNB_URL = 'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt';
const FALLBACK_FX = { usdCzk: 21.782, date: '26.10.2026' };
const FX_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const FX_RETRY_MS = 10 * 60 * 1000;

const BILLING_HINT = 'Gemini image models have no Free Tier. In Google AI Studio (aistudio.google.com/apikey), click “Set up billing” on your project and link a billing account – then you only pay for the images you generate.';

const MIME_BY_EXT = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
};
const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const CSP = "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

// ── Helpers ─────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const pad = n => String(n).padStart(2, '0');
const localDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = d => `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const base64url = buf => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '')
    .slice(0, 40).replace(/-+$/, '');
}

function resolveInside(base, rel) {
  let decoded;
  try { decoded = decodeURIComponent(String(rel)); } catch { return null; }
  if (decoded.includes('\0')) return null;
  const full = path.resolve(base, decoded.replace(/^[/\\]+/, ''));
  return full.startsWith(base + path.sep) ? full : null;
}

async function writeFileSafe(file, data) {
  const tmp = `${file}.${process.pid}-${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fsp.writeFile(tmp, data);
  for (let attempt = 0; ; attempt++) {
    try {
      await fsp.rename(tmp, file);
      return;
    } catch (err) {
      // An antivirus or sync client can lock the file for a moment – try again.
      if (attempt < 8 && ['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) {
        await sleep(120 * (attempt + 1));
        continue;
      }
      await fsp.writeFile(file, data);
      await fsp.unlink(tmp).catch(() => {});
      return;
    }
  }
}

// Moves files from one folder to another (if OneDrive holds them, falls back to copy and delete).
async function moveFiles(src, dst) {
  let names;
  try { names = await fsp.readdir(src); } catch { return; }
  await fsp.mkdir(dst, { recursive: true });
  for (const name of names) {
    const from = path.join(src, name);
    const to = path.join(dst, name);
    try {
      await fsp.rename(from, to);
    } catch {
      try {
        await fsp.copyFile(from, to);
        await fsp.unlink(from).catch(() => {});
      } catch (err) {
        console.warn(`Couldn’t move ${from}:`, err.message);
      }
    }
  }
}

// Removes only empty folders – never files.
async function removeEmptyDirs(dir) {
  let entries;
  try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) if (entry.isDirectory()) await removeEmptyDirs(path.join(dir, entry.name));
  await fsp.rmdir(dir).catch(() => {});
}

// Image dimensions from the PNG / JPEG / WebP header (no libraries).
function imageDimensions(buf) {
  try {
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let off = 2;
      while (off + 9 < buf.length) {
        if (buf[off] !== 0xff) { off++; continue; }
        const marker = buf[off + 1];
        if (marker === 0xff) { off++; continue; }
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) { off += 2; continue; }
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
        }
        off += 2 + buf.readUInt16BE(off + 2);
      }
    }
    if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = buf.toString('ascii', 12, 16);
      if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
      if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      if (chunk === 'VP8L') {
        const bits = buf.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
    }
  } catch { /* corrupted header – no dimensions then */ }
  return null;
}

function httpError(status, message, extra = {}) {
  return Object.assign(new Error(message), { httpStatus: status, info: { code: 'local', message, ...extra } });
}

// node:https instead of fetch – fetch in Node aborts a request when the response takes longer than 5 minutes.
// body = JSON, raw = ready-made data (Buffer / text), binary = don’t try to read the response as text.
function httpRequest(method, url, { headers = {}, body, raw, binary = false, timeoutMs = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const extra = {};
    let payload = null;
    if (raw !== undefined) {
      payload = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw));
    } else if (body !== undefined) {
      payload = Buffer.from(JSON.stringify(body));
      extra['Content-Type'] = 'application/json; charset=UTF-8';
    }
    if (payload) extra['Content-Length'] = payload.length;
    const req = (target.protocol === 'http:' ? http : https).request(target, {
      method,
      headers: { Accept: 'application/json', ...extra, ...headers },
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (binary && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, headers: res.headers, buffer });
          return;
        }
        const text = buffer.toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch { /* not JSON */ }
        resolve({ status: res.statusCode, headers: res.headers, buffer, text, json });
      });
      res.on('error', reject);
    });
    req.setTimeout(timeoutMs, () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
    req.on('error', reject);
    req.end(payload || undefined);
  });
}

const formBody = params => ({ raw: new URLSearchParams(params).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

// ── Configuration (API key, settings, Google Drive) ─────────────────────────

const DEFAULT_SETTINGS = { enhanceModel: ENHANCE_MODELS[0], concurrency: 4, store: false, vat: true };
let config = { apiKey: '', pollinationsKey: '', ...DEFAULT_SETTINGS, drive: {} };

function loadConfig() {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('Couldn’t load the config:', err.message);
  }
  config.drive = config.drive || {};
}

async function saveConfig() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await writeFileSafe(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getApiKey() {
  if (config.apiKey) return { key: config.apiKey, source: 'config' };
  const env = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  return { key: env, source: env ? 'env' : null };
}

function requireApiKey() {
  const { key } = getApiKey();
  if (!key) throw httpError(401, 'API key missing – add it in Settings.', { code: 'bad_key' });
  return key;
}

const keyHint = key => (key ? `${key.slice(0, 4)}…${key.slice(-4)}` : '');

function publicConfig() {
  const { key, source } = getApiKey();
  return {
    hasKey: Boolean(key),
    keySource: source,
    keyHint: keyHint(key),
    pollinations: { hasKey: Boolean(config.pollinationsKey), keyHint: keyHint(config.pollinationsKey), ...(config.pollinationsKey ? config.pollinationsInfo : null) },
    cloudflare: { hasKey: hasCloudflare(), accountHint: keyHint(config.cloudflare?.accountId), tokenHint: keyHint(config.cloudflare?.token), ...(hasCloudflare() ? config.cloudflareInfo : null) },
    huggingface: { hasToken: Boolean(config.hfToken), tokenHint: keyHint(config.hfToken), user: config.hfToken ? config.hfInfo?.user : undefined },
    connect: { origin: config.connectOrigin || '' },
    settings: { enhanceModel: config.enhanceModel, concurrency: config.concurrency, store: config.store, vat: config.vat },
    fx: config.fx?.usdCzk ? { usdCzk: config.fx.usdCzk, date: config.fx.date } : FALLBACK_FX,
    drive: driveStatus(),
    dataDir: DATA_DIR,
    configFile: CONFIG_FILE,
    mcp: { script: path.join(ROOT, 'mcp', 'hombresai-mcp.js'), node: process.execPath },
  };
}

// USD/CZK rate from the CNB daily rate file – refreshed after 6 hours, the last known rate is kept in the config.
let fxRefresh = null;
let fxLastAttempt = 0;

function refreshFx() {
  const fresh = config.fx && Date.now() - (config.fx.fetchedAt || 0) < FX_MAX_AGE_MS;
  if (fresh || fxRefresh || Date.now() - fxLastAttempt < FX_RETRY_MS) return fxRefresh || Promise.resolve();
  fxLastAttempt = Date.now();
  fxRefresh = httpRequest('GET', CNB_URL, { headers: { Accept: 'text/plain' }, timeoutMs: 6000 })
    .then(async res => {
      const lines = res.text.split(/\r?\n/);
      const usd = lines.map(line => line.split('|')).find(cols => cols[3] === 'USD');
      const rate = usd ? parseFloat(usd[4].replace(',', '.')) / (parseInt(usd[2], 10) || 1) : NaN;
      if (res.status !== 200 || !(rate > 5 && rate < 100)) throw new Error('unexpected rate file format');
      config.fx = { usdCzk: rate, date: lines[0].split(' ')[0], fetchedAt: Date.now() };
      await saveConfig();
    })
    .catch(err => console.warn('Couldn’t load the CNB exchange rate, using the last known one:', err.message))
    .finally(() => { fxRefresh = null; });
  return fxRefresh;
}

// ── History ─────────────────────────────────────────────────────────────────

let history = []; // newest first
let historyWrites = Promise.resolve();

async function loadHistory() {
  try {
    const data = JSON.parse(await fsp.readFile(HISTORY_FILE, 'utf8'));
    if (!Array.isArray(data)) throw new Error('unexpected format');
    history = data;
  } catch (err) {
    if (err.code === 'ENOENT') return;
    const backup = path.join(DATA_DIR, `history.broken-${Date.now()}.json`);
    await fsp.rename(HISTORY_FILE, backup).catch(() => {});
    console.warn(`history.json was corrupted (${err.message}), backup: ${backup}`);
  }
}

function saveHistory() {
  const data = JSON.stringify(history);
  historyWrites = historyWrites
    .then(() => fsp.mkdir(DATA_DIR, { recursive: true }))
    .then(() => writeFileSafe(HISTORY_FILE, data))
    .catch(err => console.error('Couldn’t save the history:', err.message));
  return historyWrites;
}

// The local path of a waiting file is the server’s internal business.
function publicItem(item) {
  const { localPath, ...rest } = item;
  return rest;
}

// ── In-memory image cache ───────────────────────────────────────────────────

const memCache = new Map(); // id -> { buffer, mimeType }, ordered from least recently used
let memCacheBytes = 0;

function cacheDelete(id) {
  const entry = memCache.get(id);
  if (!entry) return;
  memCacheBytes -= entry.buffer.length;
  memCache.delete(id);
}

function cachePut(id, buffer, mimeType) {
  cacheDelete(id);
  memCache.set(id, { buffer, mimeType });
  memCacheBytes += buffer.length;
  for (const oldId of memCache.keys()) {
    if (memCacheBytes <= MEM_CACHE_MAX_BYTES || memCache.size <= 1) break;
    cacheDelete(oldId);
  }
}

function cacheGet(id) {
  const entry = memCache.get(id);
  if (entry) {
    memCache.delete(id);
    memCache.set(id, entry);
  }
  return entry;
}

// ── Gemini API ──────────────────────────────────────────────────────────────

class GeminiError extends Error {
  constructor(status, apiError, fallbackMessage) {
    super(apiError?.message || fallbackMessage || `HTTP ${status}`);
    this.status = status;
    this.details = Array.isArray(apiError?.details) ? apiError.details : [];
  }
}

async function gemini(method, endpoint, { key, body, timeoutMs }) {
  let res;
  try {
    res = await httpRequest(method, `${API_BASE}/${endpoint}`, { headers: { 'x-goog-api-key': key }, body, timeoutMs });
  } catch (err) {
    const error = new GeminiError(0, null, err.code === 'ETIMEDOUT'
      ? 'The Google API didn’t respond in time.'
      : `Couldn’t connect to the Google API (${err.code || err.message}).`);
    error.network = true;
    throw error;
  }
  if (res.status < 200 || res.status >= 300) throw new GeminiError(res.status, res.json?.error, res.text.slice(0, 500));
  if (!res.json) throw new GeminiError(res.status, null, 'The Google API returned an unreadable response.');
  return res.json;
}

async function listModels(key) {
  const models = [];
  let pageToken = '';
  for (let page = 0; page < 5; page++) {
    const query = `models?pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const json = await gemini('GET', query, { key, timeoutMs: 20000 });
    models.push(...(json.models || []));
    if (!json.nextPageToken) break;
    pageToken = json.nextPageToken;
  }
  return models;
}

// The `store` field turns off saving requests in the project logs. If the API rejected it, we resend without it.
let storeFieldSupported = true;

async function generateContent(model, request, key, timeoutMs) {
  const endpoint = `models/${model}:generateContent`;
  const body = storeFieldSupported ? { ...request, store: Boolean(config.store) } : request;
  try {
    return await gemini('POST', endpoint, { key, body, timeoutMs });
  } catch (err) {
    if (storeFieldSupported && err.status === 400 && /\bstore\b/i.test(err.message)) {
      storeFieldSupported = false;
      return gemini('POST', endpoint, { key, body: request, timeoutMs });
    }
    throw err;
  }
}

function retryDelayMs(details) {
  const info = details.find(d => String(d['@type'] || '').endsWith('RetryInfo'));
  const seconds = parseFloat(info?.retryDelay);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) + 500 : undefined;
}

// Translates a Google API error into plain language and tells the frontend whether retrying makes sense.
function describeError(err) {
  if (err.info) return err.info;
  if (err instanceof PollinationsError) return describePollinationsError(err);
  if (err instanceof CloudflareError) return describeCloudflareError(err);
  if (!(err instanceof GeminiError)) return { code: 'internal', message: err.message || String(err) };
  const msg = err.message;
  const status = err.status;
  const all = `${msg} ${err.details.map(d => d.reason || '').join(' ')}`;
  const base = { status, detail: msg };

  if (err.network) return { ...base, code: 'network', message: msg, hint: 'Check your internet connection.', retryable: true };
  if (/API_KEY_INVALID|API key not valid|API key expired|API_KEY_EXPIRED/i.test(all)) {
    return { ...base, code: 'bad_key', message: 'The API key is invalid or expired.', hint: 'Make sure you copied the whole key from aistudio.google.com/apikey.' };
  }
  if (/location is not supported/i.test(msg)) {
    return { ...base, code: 'region', message: 'The Gemini API isn’t available from this location.', hint: 'If you’re using a VPN, try turning it off.' };
  }
  if (status === 429 && /free.?tier|limit: 0\b/i.test(msg)) {
    return { ...base, code: 'billing', message: 'This model isn’t available in the Free Tier.', hint: BILLING_HINT };
  }
  if (/BILLING_DISABLED|billing account|prepa(y|id)|credits? (are |have been )?(depleted|exhausted)|spend(ing)? cap/i.test(all)) {
    return { ...base, code: 'billing', message: 'There’s a problem with billing or the project’s credit.', hint: 'Check billing and spending limits in Google AI Studio.' };
  }
  if (status === 429) {
    const retryAfterMs = retryDelayMs(err.details);
    if (retryAfterMs && retryAfterMs > 120000) {
      return { ...base, code: 'quota', message: 'Request quota exhausted.', hint: 'Try again later, or check your tier’s limits in AI Studio.' };
    }
    return { ...base, code: 'rate_limit', message: 'Per-minute request limit exceeded.', hint: 'I’ll retry shortly. Lowering the concurrent requests in Settings helps too.', retryable: true, retryAfterMs };
  }
  if (status === 401 || status === 403) {
    return { ...base, code: 'forbidden', message: 'Access denied.', hint: 'The key has no access to this model or project (check the key’s restrictions and billing).' };
  }
  if (status === 404) {
    return { ...base, code: 'model_not_found', message: 'Model not found, or your key doesn’t support it.', hint: 'Pick a different model in the left panel.' };
  }
  if (status === 400) return { ...base, code: 'bad_request', message: 'The Google API rejected the request.', hint: msg };
  if (status === 499 || status >= 500) {
    return { ...base, code: 'server', message: 'The Google API is overloaded or temporarily unavailable.', hint: 'I’ll retry.', retryable: true };
  }
  return { ...base, code: 'unknown', message: msg };
}

function extractOutput(json) {
  const candidate = json?.candidates?.[0];
  const images = [];
  const texts = [];
  for (const part of candidate?.content?.parts || []) {
    if (part.thought) continue; // we don’t want Gemini 3’s interim “thought” images
    const blob = part.inlineData || part.inline_data;
    if (blob?.data) images.push({ mimeType: blob.mimeType || blob.mime_type || 'image/png', data: blob.data });
    else if (typeof part.text === 'string') texts.push(part.text);
  }
  return { candidate, images, text: texts.join('\n').trim() };
}

function estimateCost(meta, usage, imageSize, imageCount) {
  if (!meta?.price) return null;
  const { image, input, textOut } = meta.price;
  const perImage = image[imageSize] ?? image['1K'] ?? Object.values(image)[0];
  let cost = perImage * imageCount;
  if (usage) {
    const textTokens = (usage.candidatesTokensDetails || [])
      .filter(d => d.modality === 'TEXT')
      .reduce((sum, d) => sum + (d.tokenCount || 0), 0);
    cost += ((usage.promptTokenCount || 0) * input + ((usage.thoughtsTokenCount || 0) + textTokens) * textOut) / 1e6;
  }
  return Math.round(cost * 1e5) / 1e5;
}

async function loadRefFiles(refs, max) {
  const files = [];
  let total = 0;
  for (const [i, ref] of refs.slice(0, max).entries()) {
    const rel = String(ref?.path || '');
    if (!/^refs\/[\w.-]+$/.test(rel)) throw httpError(400, `Invalid reference #${i + 1}.`);
    let data;
    try {
      data = await fsp.readFile(path.join(CACHE_DIR, rel));
    } catch {
      throw httpError(400, `Reference image #${i + 1} is no longer on this computer – add it again.`);
    }
    total += data.length;
    if (total * 4 / 3 > MAX_INLINE_BYTES) {
      throw httpError(413, 'The references are too large together (max 20 MB per request). Remove some.');
    }
    const ext = path.extname(rel).slice(1).toLowerCase();
    files.push({
      data,
      ext,
      mimeType: MIME_BY_EXT[ext] || 'image/jpeg',
      role: Object.hasOwn(REF_ROLES, ref.role) ? ref.role : 'auto',
      dims: imageDimensions(data),
    });
  }
  return files;
}

const refLabel = (file, i) => `Reference image ${i + 1}.${REF_ROLES[file.role] ? ` ${REF_ROLES[file.role]}` : ''}`;

async function loadRefParts(refs, max) {
  const files = await loadRefFiles(refs, max);
  return files.flatMap((file, i) => [
    { text: refLabel(file, i) },
    { inlineData: { mimeType: file.mimeType, data: file.data.toString('base64') } },
  ]);
}

function cleanRefs(refs) {
  return (Array.isArray(refs) ? refs : []).slice(0, MAX_REFS).map(r => ({
    path: String(r?.path || ''),
    role: Object.hasOwn(REF_ROLES, r?.role) ? r.role : 'auto',
  }));
}

// One Gemini image request; references go in as labelled inline parts.
async function geminiGenerate(model, prompt, refs, { aspectRatio, imageSize, thinkingLevel }) {
  const key = requireApiKey();
  const parts = [...await loadRefParts(refs, MAX_REFS)];
  if (prompt) parts.push({ text: prompt });

  const generationConfig = { responseModalities: ['TEXT', 'IMAGE'] };
  const imageConfig = {};
  if (aspectRatio) imageConfig.aspectRatio = aspectRatio;
  if (imageSize) imageConfig.imageSize = imageSize;
  if (Object.keys(imageConfig).length) generationConfig.imageConfig = imageConfig;
  if (thinkingLevel) generationConfig.thinkingConfig = { thinkingLevel };

  const json = await generateContent(model, { contents: [{ role: 'user', parts }], generationConfig }, key, GENERATE_TIMEOUT_MS);
  const { candidate, images, text } = extractOutput(json);
  if (!images.length) {
    const blockReason = json?.promptFeedback?.blockReason;
    const finish = candidate?.finishReason || '';
    if (blockReason || /SAFETY|PROHIBITED|BLOCKLIST|SPII|RECITATION/.test(finish)) {
      throw Object.assign(new Error('blocked'), {
        httpStatus: 422,
        info: {
          code: 'blocked',
          message: 'Google’s safety filter blocked the image.',
          hint: /RECITATION/.test(finish)
            ? 'The result was too similar to an existing work. Try making the prompt more distinct.'
            : 'Adjust the prompt or references (typically real famous people, violence, nudity…).',
          detail: [blockReason || finish, candidate?.finishMessage, text].filter(Boolean).join(' – '),
        },
      });
    }
    throw Object.assign(new Error('no_image'), {
      httpStatus: 422,
      info: {
        code: 'no_image',
        message: 'The model didn’t return an image.',
        hint: text ? 'The model replied with text only (see details). Phrase the prompt as a clear image request.' : 'Try again or adjust the prompt.',
        detail: [finish, text].filter(Boolean).join(' – '),
        retryable: !text,
      },
    });
  }
  return { images, text, usageMetadata: json.usageMetadata };
}

// ── Open-source models via Pollinations ─────────────────────────────────────

class PollinationsError extends Error {
  constructor(res, message) {
    const json = res.json || {};
    super(message || json.error?.message || json.message || (typeof json.error === 'string' ? json.error : '') || `HTTP ${res.status}`);
    this.status = res.status;
    this.httpStatus = 502;
    this.retryAfter = Number(res.headers?.['retry-after']);
  }
}

// ~1 megapixel sizes in multiples of 16, which open models such as FLUX expect.
const SIZE_BY_RATIO = {
  '1:1': [1024, 1024],
  '4:5': [896, 1120],
  '5:4': [1120, 896],
  '3:4': [864, 1152],
  '4:3': [1152, 864],
  '2:3': [832, 1248],
  '3:2': [1248, 832],
  '9:16': [768, 1344],
  '16:9': [1344, 768],
  '21:9': [1536, 656],
};
const round16 = n => Math.max(256, Math.round(n / 16) * 16);

// Auto ratio keeps the shape of the first reference photo.
function sizeFor(aspectRatio, dims) {
  if (SIZE_BY_RATIO[aspectRatio]) return SIZE_BY_RATIO[aspectRatio];
  if (dims?.width && dims?.height) {
    const ratio = Math.min(4, Math.max(0.25, dims.width / dims.height));
    const height = Math.sqrt((1024 * 1024) / ratio);
    return [round16(height * ratio), round16(height)];
  }
  return [1024, 1024];
}

function sniffMime(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/png';
}

function multipartBody(fields, files) {
  const boundary = `----hombresai${crypto.randomBytes(12).toString('hex')}`;
  const chunks = [];
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  }
  for (const file of files) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: ${file.mimeType}\r\n\r\n`));
    chunks.push(file.data, Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

async function pollinationsGenerate(meta, prompt, refs, aspectRatio) {
  const key = config.pollinationsKey;
  if (!key) {
    throw httpError(401, 'Open-source models need a free Pollinations API key – add it in Settings.', { code: 'pollinations_key' });
  }
  if (refs.length && !meta.refs) {
    throw httpError(400, `${meta.label} can’t use reference images – remove them or pick FLUX.2 klein or a Gemini model.`, { code: 'bad_request' });
  }
  // Pollinations answers identical requests from a cache, so every variant needs its own seed.
  const seed = crypto.randomInt(1, 2147483647);
  const auth = { Authorization: `Bearer ${key}` };
  let res;
  try {
    if (refs.length) {
      const files = await loadRefFiles(refs, meta.maxRefs || 4);
      const [width, height] = sizeFor(aspectRatio, files[0].dims);
      const form = multipartBody(
        {
          prompt: [...files.map(refLabel), '', prompt].join('\n').trim(),
          model: meta.apiModel,
          size: `${width}x${height}`,
          seed: String(seed),
          response_format: 'b64_json',
        },
        files.map((file, i) => ({ field: 'image', filename: `reference-${i + 1}.${file.ext}`, mimeType: file.mimeType, data: file.data })),
      );
      res = await httpRequest('POST', `${POLLINATIONS_BASE}/v1/images/edits`, {
        raw: form.body,
        headers: { ...auth, 'Content-Type': form.contentType },
        timeoutMs: 4 * 60 * 1000,
      });
    } else {
      const [width, height] = sizeFor(aspectRatio);
      res = await httpRequest('POST', `${POLLINATIONS_BASE}/v1/images/generations`, {
        body: { prompt, model: meta.apiModel, size: `${width}x${height}`, seed, response_format: 'b64_json' },
        headers: auth,
        timeoutMs: 4 * 60 * 1000,
      });
    }
  } catch (err) {
    if (err.info) throw err;
    const error = new PollinationsError({ status: 0 }, err.code === 'ETIMEDOUT'
      ? 'Pollinations didn’t respond in time.'
      : `Couldn’t connect to Pollinations (${err.code || err.message}).`);
    error.network = true;
    throw error;
  }
  if (res.status !== 200) throw new PollinationsError(res);
  let b64 = res.json?.data?.[0]?.b64_json;
  if (!b64 && res.json?.data?.[0]?.url) {
    const image = await httpRequest('GET', res.json.data[0].url, { binary: true, timeoutMs: 60000 }).catch(() => null);
    if (image?.status === 200) b64 = image.buffer.toString('base64');
  }
  if (!b64) {
    throw Object.assign(new Error('no_image'), {
      httpStatus: 422,
      info: { code: 'no_image', message: 'The model didn’t return an image.', hint: 'Try again or adjust the prompt.', retryable: true },
    });
  }
  return { images: [{ mimeType: sniffMime(Buffer.from(b64.slice(0, 32), 'base64')), data: b64 }], text: '', usageMetadata: null };
}

function describePollinationsError(err) {
  const msg = err.message;
  const base = { status: err.status, detail: msg };
  const balance = /balance|pollen|insufficient|credit/i.test(msg);
  if (err.network) return { ...base, code: 'network', message: msg, hint: 'Check your internet connection.', retryable: true };
  if (err.status === 402 || ([400, 401, 403].includes(err.status) && balance)) {
    return { ...base, code: 'pollinations_balance', message: 'Not enough pollen on your Pollinations account.', hint: 'The free models run on free pollen that refills over time – try again later, or top up at enter.pollinations.ai.' };
  }
  if (err.status === 429) {
    const retryAfterMs = Number.isFinite(err.retryAfter) ? Math.min(err.retryAfter * 1000 + 500, 90000) : undefined;
    return { ...base, code: 'rate_limit', message: 'Pollinations rate limit reached.', hint: 'I’ll retry shortly.', retryable: true, retryAfterMs };
  }
  if (err.status === 401 || err.status === 403) {
    return { ...base, code: 'pollinations_key', message: 'The Pollinations API key is missing or invalid.', hint: 'Create a free key at enter.pollinations.ai/keys and paste it in Settings → Open-source models.' };
  }
  if (err.status === 400) return { ...base, code: 'bad_request', message: 'Pollinations rejected the request.', hint: msg };
  if (err.status >= 500) {
    // e.g. "Failed query: select apikey…" – their key database is down: every request fails, retrying only piles them up
    if (/failed query|database/i.test(msg)) {
      return {
        ...base,
        code: 'pollinations_outage',
        message: 'Pollinations can’t check API keys right now – an outage on their side, so the open-source models don’t work.',
        hint: 'Connect the free Cloudflare backup in Settings and the open-source models keep working – or use a Gemini model meanwhile.',
      };
    }
    return { ...base, code: 'server', message: 'Pollinations or the model provider is temporarily unavailable.', hint: 'I’ll retry. If it keeps failing, try again later or use a Gemini model meanwhile.', retryable: true };
  }
  return { ...base, code: 'unknown', message: msg };
}

// ── Cloudflare Workers AI: the free backup for the open-source models ───────
// 10,000 free "neurons" a day: about 95 FLUX.2 klein or 170 FLUX.1 schnell images at 1024 px. Used when Pollinations
// can't serve a request (outage, no pollen, no key).

const CLOUDFLARE_BASE = (process.env.CLOUDFLARE_API_BASE || 'https://api.cloudflare.com/client/v4').replace(/\/+$/, '');
const CF_SCHNELL = '@cf/black-forest-labs/flux-1-schnell';
const CF_KLEIN = '@cf/black-forest-labs/flux-2-klein-4b';
const CF_CODER = '@cf/openai/gpt-oss-120b';
const CF_REF_MAX_SIDE = 511; // Cloudflare's FLUX.2 takes reference images smaller than 512 × 512
const CF_FALLBACK_CODES = new Set(['pollinations_outage', 'pollinations_balance', 'pollinations_key', 'server', 'network', 'rate_limit']);

const hasCloudflare = () => Boolean(config.cloudflare?.accountId && config.cloudflare?.token);

class CloudflareError extends Error {
  constructor(res, message) {
    const json = res.json || {};
    const first = Array.isArray(json.errors) ? json.errors[0] : null;
    super(message || first?.message || json.error?.message || (typeof json.error === 'string' ? json.error : '') || `HTTP ${res.status}`);
    this.status = res.status;
    this.httpStatus = 502;
    this.retryAfter = Number(res.headers?.['retry-after']);
  }
}

function describeCloudflareError(err) {
  const msg = err.message;
  const base = { status: err.status, detail: msg };
  if (err.network) return { ...base, code: 'network', message: msg, hint: 'Check your internet connection.', retryable: true };
  if (/neuron|daily (free )?allocation|free allocation|quota/i.test(msg)) {
    cfQuotaUntil = new Date().setUTCHours(24, 0, 0, 0); // remembered: the models that need it are hidden until it renews
    saveFreeLimits();
    return { ...base, code: 'cloudflare_quota', message: 'Today’s free Cloudflare allowance is used up.', hint: 'It renews at midnight UTC (1:00 in Czechia). Until then use a Gemini model.' };
  }
  if (err.status === 401 || err.status === 403 || /authenticat|unauthori[sz]ed|permission/i.test(msg)) {
    return { ...base, code: 'cloudflare_key', message: 'Cloudflare refused the API token or Account ID.', hint: 'Check them in Settings → Cloudflare – the token needs the “Workers AI” permission.' };
  }
  if (err.status === 429) {
    const retryAfterMs = Number.isFinite(err.retryAfter) ? Math.min(err.retryAfter * 1000 + 500, 90000) : undefined;
    return { ...base, code: 'rate_limit', message: 'Cloudflare rate limit reached.', hint: 'I’ll retry shortly.', retryable: true, retryAfterMs };
  }
  if (err.status >= 500) return { ...base, code: 'server', message: 'Cloudflare Workers AI is temporarily unavailable.', hint: 'I’ll retry.', retryable: true };
  if (err.status === 400) return { ...base, code: 'bad_request', message: 'Cloudflare rejected the request.', hint: msg };
  return { ...base, code: 'unknown', message: msg };
}

async function cloudflareRequest(route, { body, raw, contentType, timeoutMs = 4 * 60 * 1000 } = {}) {
  const { accountId, token } = config.cloudflare;
  let res;
  try {
    res = await httpRequest('POST', `${CLOUDFLARE_BASE}/accounts/${accountId}${route}`, {
      body,
      raw,
      headers: { Authorization: `Bearer ${token}`, ...(contentType ? { 'Content-Type': contentType } : {}) },
      timeoutMs,
    });
  } catch (err) {
    const error = new CloudflareError({ status: 0 }, err.code === 'ETIMEDOUT'
      ? 'Cloudflare didn’t answer in time.'
      : `Couldn’t connect to Cloudflare (${err.code || err.message}).`);
    error.network = true;
    throw error;
  }
  if (res.status !== 200 || res.json?.success === false) throw new CloudflareError(res);
  return res;
}

// The Account ID and token are checked by listing one Workers AI model – that needs exactly the permission we use.
async function verifyCloudflare(accountId, token) {
  let res;
  try {
    res = await httpRequest('GET', `${CLOUDFLARE_BASE}/accounts/${accountId}/ai/models/search?per_page=1`, {
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: 20000,
    });
  } catch (err) {
    throw httpError(502, `Couldn’t reach Cloudflare (${err.code || err.message}).`, { code: 'network' });
  }
  if (res.status === 200 && res.json?.success !== false) return { verified: true, checkedAt: new Date().toISOString() };
  const reason = res.json?.errors?.[0]?.message || `HTTP ${res.status}`;
  if ([400, 401, 403, 404].includes(res.status)) {
    throw httpError(400, `Cloudflare doesn’t accept this Account ID or API token (${reason}).`, {
      code: 'cloudflare_key',
      hint: 'Copy the Account ID from the Cloudflare dashboard and create the token with the “Workers AI” template.',
    });
  }
  throw httpError(502, `Cloudflare didn’t confirm the token (${reason}).`, { code: 'server', retryable: true });
}

// Cloudflare wants small references: the small copy saved with every reference, or the original if it's small enough.
async function loadCloudflareRefs(refs) {
  const files = [];
  for (const [i, ref] of refs.slice(0, 4).entries()) {
    const rel = String(ref?.path || '');
    if (!/^refs\/[\w.-]+$/.test(rel)) throw httpError(400, `Invalid reference #${i + 1}.`);
    const small = path.join(CACHE_DIR, rel.replace(/\.[^.]+$/, '.small.jpg'));
    let data = await fsp.readFile(small).catch(() => null);
    if (!data) {
      data = await fsp.readFile(path.join(CACHE_DIR, rel)).catch(() => null);
      if (!data) throw httpError(400, `Reference image #${i + 1} is no longer on this computer – add it again.`);
      const dims = imageDimensions(data);
      if (!dims || Math.max(dims.width, dims.height) > CF_REF_MAX_SIDE) {
        throw httpError(400, `Reference image #${i + 1} was added before the Cloudflare backup existed.`, {
          code: 'bad_request',
          hint: 'Remove it and add it again – the app then also keeps the small copy Cloudflare needs.',
        });
      }
    }
    files.push({ data, dims: imageDimensions(data), mimeType: sniffMime(data), role: Object.hasOwn(REF_ROLES, ref.role) ? ref.role : 'auto' });
  }
  return files;
}

async function cloudflareGenerate(meta, prompt, refs, aspectRatio) {
  // FLUX.1 schnell only makes square pictures from a prompt – anything else goes to FLUX.2 klein
  const square = !aspectRatio || aspectRatio === '1:1';
  const schnell = meta.id === 'os-flux1-schnell' && !refs.length && square;
  let res;
  if (schnell) {
    res = await cloudflareRequest(`/ai/run/${CF_SCHNELL}`, { body: { prompt: prompt.slice(0, 2048), steps: 6 } });
  } else {
    const files = await loadCloudflareRefs(refs);
    const [width, height] = sizeFor(aspectRatio, files[0]?.dims); // the small copy keeps the reference's shape
    const form = multipartBody(
      {
        prompt: [...files.map(refLabel), '', prompt].join('\n').trim().slice(0, 2048),
        width: String(Math.min(1920, width)),
        height: String(Math.min(1920, height)),
        seed: String(crypto.randomInt(1, 2147483647)),
      },
      files.map((file, i) => ({ field: `input_image_${i}`, filename: `reference-${i + 1}.jpg`, mimeType: file.mimeType, data: file.data })),
    );
    res = await cloudflareRequest(`/ai/run/${CF_KLEIN}`, { raw: form.body, contentType: form.contentType });
  }
  const b64 = res.json?.result?.image || res.json?.image;
  if (!b64) {
    throw Object.assign(new Error('no_image'), {
      httpStatus: 422,
      info: { code: 'no_image', message: 'Cloudflare didn’t return an image.', hint: 'Try again or adjust the prompt.', retryable: true },
    });
  }
  return { images: [{ mimeType: sniffMime(Buffer.from(b64.slice(0, 32), 'base64')), data: b64 }], text: '', usageMetadata: null, via: 'cloudflare' };
}

async function cloudflareChat(system, user, maxTokens, model = CF_CODER) {
  const res = await cloudflareRequest('/ai/v1/chat/completions', {
    body: { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.3, max_tokens: maxTokens },
  });
  const content = res.json?.choices?.[0]?.message?.content;
  return Array.isArray(content) ? content.map(part => part?.text || '').join('') : String(content || '');
}

// Open-source models run on Pollinations; when it can't serve them (no key, no pollen, an outage) the same request
// goes to Cloudflare Workers AI if it's connected, and then to Hugging Face's free GPUs, which need no account.
const OPEN_FALLBACK_CODES = new Set([...CF_FALLBACK_CODES, 'cloudflare_key', 'cloudflare_quota']);
let pollinationsPausedUntil = 0; // after “no pollen” or an outage Pollinations is skipped for a while

async function openGenerate(meta, prompt, refs, aspectRatio) {
  if (meta.hfOnly) return hfImageGenerate(meta, prompt, refs, aspectRatio);
  const routes = [
    config.pollinationsKey && Date.now() > pollinationsPausedUntil && ['Pollinations', pollinationsGenerate],
    hasCloudflare() && ['Cloudflare Workers AI', cloudflareGenerate],
    ['Hugging Face', hfImageGenerate],
  ].filter(Boolean);
  for (const [i, [name, run]] of routes.entries()) {
    try {
      return await run(meta, prompt, refs, aspectRatio);
    } catch (err) {
      const info = err.info || describeError(err);
      if (i === routes.length - 1 || !OPEN_FALLBACK_CODES.has(info.code)) throw err;
      if (name === 'Pollinations' && ['pollinations_balance', 'pollinations_outage'].includes(info.code)) pollinationsPausedUntil = Date.now() + 10 * 60 * 1000;
      if (info.code === 'pollinations_balance') notePollen(0);
      console.log(`  ! ${name}: ${info.message} → ${routes[i + 1][0]}`);
    }
  }
}

// ── Google Drive ────────────────────────────────────────────────────────────

class DriveError extends Error {
  constructor(message, code = 'drive') {
    super(message);
    this.httpStatus = 502;
    this.info = { code, message };
  }
}

let serverPort = BASE_PORT;
let driveToken = null;       // { accessToken, expiresAt }
let driveLastError = null;   // the last upload error, shown in the app
let driveFolderChecked = false;
const oauthStates = new Map(); // state -> { verifier, at }

const redirectUri = () => `http://${HOST}:${serverPort}/oauth/callback`;

function driveStatus() {
  const d = config.drive;
  return {
    configured: Boolean(d.clientId && d.clientSecret),
    connected: Boolean(d.refreshToken),
    email: d.email || null,
    clientId: d.clientId || '',
    folderUrl: d.folderId ? `https://drive.google.com/drive/folders/${d.folderId}` : null,
    pending: history.filter(i => i.pending).length,
    error: driveLastError,
  };
}

function oauthStart(res) {
  const d = config.drive;
  if (!d.clientId || !d.clientSecret) return redirect(res, '/?drive=missing_client');
  for (const [state, entry] of oauthStates) if (Date.now() - entry.at > 15 * 60 * 1000) oauthStates.delete(state);
  const state = base64url(crypto.randomBytes(16));
  const verifier = base64url(crypto.randomBytes(32));
  oauthStates.set(state, { verifier, at: Date.now() });
  const params = new URLSearchParams({
    client_id: d.clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: DRIVE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: base64url(crypto.createHash('sha256').update(verifier).digest()),
    code_challenge_method: 'S256',
  });
  return redirect(res, `${GOOGLE.auth}?${params}`);
}

async function oauthCallback(url, res) {
  const state = url.searchParams.get('state');
  const pending = state ? oauthStates.get(state) : null;
  if (state) oauthStates.delete(state);
  if (url.searchParams.get('error')) return redirect(res, '/?drive=denied');
  if (!pending) return redirect(res, '/?drive=expired');
  const d = config.drive;
  try {
    const r = await httpRequest('POST', GOOGLE.token, {
      ...formBody({
        code: url.searchParams.get('code') || '',
        client_id: d.clientId,
        client_secret: d.clientSecret,
        redirect_uri: redirectUri(),
        grant_type: 'authorization_code',
        code_verifier: pending.verifier,
      }),
      timeoutMs: 20000,
    });
    if (r.status !== 200 || !r.json?.refresh_token) throw new Error(r.json?.error_description || r.json?.error || `HTTP ${r.status}`);
    d.refreshToken = r.json.refresh_token;
    driveToken = { accessToken: r.json.access_token, expiresAt: Date.now() + (r.json.expires_in || 3600) * 1000 };
    driveLastError = null;
    driveFolderChecked = false;
    try {
      const about = await driveRequest('GET', `${GOOGLE.drive}/about?fields=user(emailAddress)`);
      d.email = about.json?.user?.emailAddress || null;
    } catch { /* the e-mail is only informational */ }
    await saveConfig();
    console.log(`  Google Drive connected${d.email ? ` (${d.email})` : ''}.`);
    scheduleUploads();
    return redirect(res, '/?drive=connected');
  } catch (err) {
    console.warn('Connecting Google Drive failed:', err.message);
    return redirect(res, `/?drive=error&reason=${encodeURIComponent(err.message.slice(0, 200))}`);
  }
}

async function driveAccessToken() {
  const d = config.drive;
  if (!d.refreshToken) throw new DriveError('Google Drive isn’t connected – connect it in Settings.', 'drive_disconnected');
  if (driveToken && Date.now() < driveToken.expiresAt - 60000) return driveToken.accessToken;
  let r;
  try {
    r = await httpRequest('POST', GOOGLE.token, {
      ...formBody({ client_id: d.clientId, client_secret: d.clientSecret, refresh_token: d.refreshToken, grant_type: 'refresh_token' }),
      timeoutMs: 20000,
    });
  } catch (err) {
    throw new DriveError(`Couldn’t connect to Google (${err.code || err.message}).`, 'drive_network');
  }
  if (r.status !== 200 || !r.json?.access_token) {
    if (['invalid_grant', 'invalid_client', 'unauthorized_client'].includes(r.json?.error)) {
      d.refreshToken = null;
      await saveConfig();
      throw new DriveError('Google Drive access expired or was revoked – reconnect Drive in Settings.', 'drive_disconnected');
    }
    throw new DriveError(`Google refused to renew Drive access (${r.json?.error || r.status}).`);
  }
  driveToken = { accessToken: r.json.access_token, expiresAt: Date.now() + (r.json.expires_in || 3600) * 1000 };
  return driveToken.accessToken;
}

async function driveRequest(method, url, opts = {}) {
  for (let attempt = 0; ; attempt++) {
    const token = await driveAccessToken();
    let res;
    try {
      res = await httpRequest(method, url, { timeoutMs: 60000, ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
    } catch (err) {
      throw new DriveError(`Couldn’t connect to Google Drive (${err.code || err.message}).`, 'drive_network');
    }
    if (res.status === 401 && attempt === 0) {
      driveToken = null;
      continue;
    }
    return res;
  }
}

function driveFail(res, what) {
  const msg = res.json?.error?.message || `HTTP ${res.status}`;
  if (res.status === 403 && /storage|quota/i.test(msg)) return new DriveError('Google Drive is out of storage.', 'drive_full');
  return new DriveError(`${what}: ${msg}`);
}

async function findOrCreateFolder(name, parentId) {
  const q = `mimeType='${FOLDER_MIME}' and name='${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;
  const list = await driveRequest('GET', `${GOOGLE.drive}/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1&spaces=drive`);
  if (list.status !== 200) throw driveFail(list, 'Looking up a folder on Drive failed');
  if (list.json?.files?.length) return list.json.files[0].id;
  const created = await driveRequest('POST', `${GOOGLE.drive}/files?fields=id`, { body: { name, mimeType: FOLDER_MIME, parents: [parentId] } });
  if (created.status !== 200) throw driveFail(created, 'Creating a folder on Drive failed');
  return created.json.id;
}

// The hombresai/YYYY-MM-DD folder on Drive (IDs are remembered in the config).
async function dayFolderId(day) {
  const d = config.drive;
  if (d.folderId && !driveFolderChecked) {
    const r = await driveRequest('GET', `${GOOGLE.drive}/files/${encodeURIComponent(d.folderId)}?fields=id,trashed`);
    if (r.status !== 200 || r.json?.trashed) {
      d.folderId = null;
      d.dayFolders = {};
    }
    driveFolderChecked = true;
  }
  if (!d.folderId) {
    d.folderId = await findOrCreateFolder(DRIVE_FOLDER, 'root');
    d.dayFolders = {};
    driveFolderChecked = true;
    await saveConfig();
  }
  if (!d.dayFolders?.[day]) {
    d.dayFolders = { ...d.dayFolders, [day]: await findOrCreateFolder(day, d.folderId) };
    await saveConfig();
  }
  return d.dayFolders[day];
}

async function driveUpload(item, buffer) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const parent = await dayFolderId(item.day);
    const init = await driveRequest('POST', `${GOOGLE.upload}/files?uploadType=resumable&fields=id,webViewLink`, {
      body: { name: item.name, parents: [parent], mimeType: item.mimeType, description: String(item.userPrompt || item.prompt || '').slice(0, 4000) },
      headers: { 'X-Upload-Content-Type': item.mimeType, 'X-Upload-Content-Length': String(buffer.length) },
    });
    if (init.status === 404 && attempt === 0) {
      // someone deleted the folder on Drive – create it again
      config.drive.dayFolders = {};
      driveFolderChecked = false;
      continue;
    }
    if (init.status !== 200 || !init.headers.location) throw driveFail(init, 'Upload to Drive failed');
    const put = await driveRequest('PUT', init.headers.location, { raw: buffer, headers: { 'Content-Type': item.mimeType }, timeoutMs: 5 * 60 * 1000 });
    if (put.status !== 200 && put.status !== 201) throw driveFail(put, 'Upload to Drive failed');
    return { id: put.json.id, link: put.json.webViewLink || `https://drive.google.com/file/d/${put.json.id}/view` };
  }
  throw new DriveError('Couldn’t create the folder on Google Drive.');
}

async function driveTrash(fileId) {
  const r = await driveRequest('PATCH', `${GOOGLE.drive}/files/${encodeURIComponent(fileId)}`, { body: { trashed: true } });
  if (r.status !== 200 && r.status !== 404) throw driveFail(r, 'Moving to the Drive trash failed');
}

// Waiting images are uploaded one by one in the background; the app reads the result from the history.
let uploadChain = Promise.resolve();
let uploadQueued = false;

function scheduleUploads() {
  if (uploadQueued) return uploadChain;
  uploadQueued = true;
  uploadChain = uploadChain
    .then(() => { uploadQueued = false; return processUploads(); })
    .catch(err => console.warn('Uploading to Google Drive:', err.message));
  return uploadChain;
}

async function processUploads() {
  if (!config.drive.refreshToken) return;
  let changed = false;
  for (const item of history.filter(i => i.pending)) {
    if (!history.includes(item)) continue; // deleted in the meantime
    try {
      const buffer = cacheGet(item.id)?.buffer || await fsp.readFile(item.localPath);
      const uploaded = await driveUpload(item, buffer);
      if (!history.includes(item)) {
        await driveTrash(uploaded.id).catch(() => {});
        continue;
      }
      const local = item.localPath;
      item.drive = uploaded;
      delete item.pending;
      delete item.localPath;
      delete item.uploadError;
      cachePut(item.id, buffer, item.mimeType);
      changed = true;
      driveLastError = null;
      if (local) await fsp.unlink(local).catch(() => {});
      console.log(`  ☁ ${item.name} → Google Drive`);
    } catch (err) {
      item.uploadError = err.code === 'ENOENT' ? 'The image file is no longer on this computer.' : (err.info?.message || err.message);
      driveLastError = item.uploadError;
      changed = true;
      if (['drive_disconnected', 'drive_network', 'drive_full'].includes(err.info?.code)) break;
    }
  }
  if (changed) await saveHistory();
  if (!history.some(i => i.localPath?.startsWith(LEGACY_OUTPUT_DIR + path.sep))) await removeEmptyDirs(LEGACY_OUTPUT_DIR);
}

// One-off migration from an older version: history, references and thumbnails move from OneDrive to the profile,
// images are queued for upload to Drive and disappear from OneDrive once they’re uploaded.
async function migrateLegacyOutput() {
  if (!fs.existsSync(LEGACY_OUTPUT_DIR)) return;
  await moveFiles(path.join(LEGACY_OUTPUT_DIR, 'refs'), REFS_DIR);
  await moveFiles(path.join(LEGACY_OUTPUT_DIR, 'thumbs'), THUMBS_DIR);
  const legacyHistory = path.join(LEGACY_OUTPUT_DIR, 'history.json');
  let items;
  try { items = JSON.parse(await fsp.readFile(legacyHistory, 'utf8')); } catch { items = null; }
  if (!Array.isArray(items)) {
    await removeEmptyDirs(LEGACY_OUTPUT_DIR);
    return;
  }
  const known = new Set(history.map(i => i.id));
  let imported = 0;
  for (const item of items) {
    if (known.has(item.id) || typeof item.file !== 'string') continue;
    const { file, thumb, ...rest } = item;
    const [, day, name] = file.split('/');
    history.push({
      ...rest,
      day: day || localDay(new Date(item.createdAt)),
      name: name || path.basename(file),
      thumb: Boolean(thumb),
      pending: true,
      localPath: path.join(LEGACY_OUTPUT_DIR, file),
    });
    imported++;
  }
  history.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  await saveHistory();
  await historyWrites;
  await fsp.unlink(legacyHistory).catch(() => {});
  if (imported) console.log(`  Imported ${imported} images from the output folder – they’ll move to Google Drive once it’s connected.`);
}

// ── API handlers ────────────────────────────────────────────────────────────

// Asks Pollinations whether the key works (no generation, nothing is spent). A bad key is refused; when
// Pollinations can’t be reached the key is saved anyway and checked on first use.
async function verifyPollinationsKey(key) {
  const headers = { Authorization: `Bearer ${key}` };
  let res;
  try {
    res = await httpRequest('GET', `${POLLINATIONS_BASE}/account/key`, { headers, timeoutMs: 15000 });
  } catch {
    return { verified: false };
  }
  if (res.status === 401 || res.status === 403 || res.json?.valid === false) {
    throw httpError(400, 'Pollinations doesn’t accept this key. Copy the whole secret key (sk_…) from enter.pollinations.ai/keys.', { code: 'pollinations_key' });
  }
  if (res.status !== 200 || !res.json) return { verified: false };
  if (res.json.type === 'publishable') {
    throw httpError(400, 'That’s a publishable key (pk_…) – create a secret key (sk_…) at enter.pollinations.ai/keys.', { code: 'pollinations_key' });
  }
  const models = res.json.permissions?.models;
  const allows = kind => !Array.isArray(models) || models.includes(kind);
  const info = {
    verified: true,
    keyName: typeof res.json.name === 'string' ? res.json.name.slice(0, 60) : null,
    expiresAt: typeof res.json.expiresAt === 'string' ? res.json.expiresAt : null,
    images: allows('image'),
    text: allows('text'),
    balance: Number.isFinite(res.json.pollenBudget) ? res.json.pollenBudget : null,
  };
  if (info.balance == null) {
    // the free credit left on the account – not every key may see it (403), that’s fine
    const bal = await httpRequest('GET', `${POLLINATIONS_BASE}/account/balance`, { headers, timeoutMs: 15000 }).catch(() => null);
    if (bal?.status === 200 && Number.isFinite(bal.json?.balance)) info.balance = bal.json.balance;
  }
  console.log(`  ✓ Pollinations key verified${info.keyName ? ` (“${info.keyName}”)` : ''}${info.balance != null ? ` – ${info.balance} pollen` : ''}`);
  return info;
}

async function handleConfig(body) {
  if (typeof body.apiKey === 'string') {
    const key = body.apiKey.trim();
    if (key) {
      try {
        await listModels(key);
      } catch (err) {
        const info = describeError(err);
        if (['bad_key', 'forbidden', 'region'].includes(info.code)) throw Object.assign(new Error(info.message), { httpStatus: 400, info });
        // A network error etc. – save the key anyway, it gets verified when generating.
      }
    }
    config.apiKey = key;
    modelCache = null;
  }
  if (typeof body.enhanceModel === 'string') {
    const model = body.enhanceModel.trim();
    if (model && !MODEL_ID_RE.test(model)) throw httpError(400, 'Invalid model name.');
    config.enhanceModel = model || DEFAULT_SETTINGS.enhanceModel;
  }
  if (body.concurrency !== undefined) {
    config.concurrency = clamp(parseInt(body.concurrency, 10) || DEFAULT_SETTINGS.concurrency, 1, 8);
  }
  if (typeof body.store === 'boolean') config.store = body.store;
  if (typeof body.vat === 'boolean') config.vat = body.vat;
  if (typeof body.pollinationsKey === 'string') {
    const key = body.pollinationsKey.trim();
    if (key && (key.length < 10 || /\s/.test(key))) throw httpError(400, 'That doesn’t look like a Pollinations API key (it starts with “sk_”).');
    config.pollinationsInfo = key ? await verifyPollinationsKey(key) : null;
    config.pollinationsKey = key;
    pollinationsPausedUntil = 0; // e.g. topped up – try Pollinations again right away
    modelCache = null;
  }
  if (typeof body.cloudflareAccountId === 'string' || typeof body.cloudflareToken === 'string') {
    const accountId = String(body.cloudflareAccountId ?? config.cloudflare?.accountId ?? '').trim();
    const token = String(body.cloudflareToken ?? config.cloudflare?.token ?? '').trim();
    if (!accountId && !token) {
      delete config.cloudflare;
      delete config.cloudflareInfo;
    } else {
      if (!/^[0-9a-f]{32}$/i.test(accountId)) throw httpError(400, 'The Account ID has 32 characters (0–9, a–f) – copy it from the Cloudflare dashboard.', { code: 'cloudflare_key' });
      if (!/^[\w-]{30,100}$/.test(token)) throw httpError(400, 'That doesn’t look like a Cloudflare API token – create one with the “Workers AI” template and copy it whole.', { code: 'cloudflare_key' });
      config.cloudflareInfo = await verifyCloudflare(accountId, token);
      config.cloudflare = { accountId, token };
    }
    modelCache = null;
  }
  if (typeof body.hfToken === 'string') {
    const token = body.hfToken.trim();
    if (!token) {
      delete config.hfToken;
      delete config.hfInfo;
    } else {
      if (!/^hf_[A-Za-z0-9]{20,}$/.test(token)) throw httpError(400, 'That doesn’t look like a Hugging Face token (it starts with “hf_”).', { code: 'hf_token' });
      config.hfInfo = await verifyHfToken(token);
      config.hfToken = token;
    }
  }
  if (typeof body.driveClientId === 'string' || typeof body.driveClientSecret === 'string') {
    const d = config.drive;
    const clientId = typeof body.driveClientId === 'string' ? body.driveClientId.trim() : d.clientId || '';
    const clientSecret = typeof body.driveClientSecret === 'string' && body.driveClientSecret.trim() ? body.driveClientSecret.trim() : d.clientSecret || '';
    if (clientId && !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
      throw httpError(400, 'The Client ID should look like “….apps.googleusercontent.com”.');
    }
    if (clientId !== d.clientId || clientSecret !== d.clientSecret) {
      config.drive = { ...d, clientId, clientSecret, refreshToken: null, email: null };
      driveToken = null;
    }
  }
  if (typeof body.connectOrigin === 'string') {
    const raw = body.connectOrigin.trim();
    if (!raw) {
      delete config.connectOrigin;
    } else {
      let origin;
      try {
        const u = new URL(raw);
        if (!['http:', 'https:'].includes(u.protocol) || u.pathname !== '/' || u.search || u.hash) throw new Error('bad');
        origin = u.origin;
      } catch {
        throw httpError(400, 'Enter the address of your onestoapp site, like https://yoursite.com (no path).');
      }
      config.connectOrigin = origin;
    }
  }
  await saveConfig();
  return publicConfig();
}

async function handleDriveDisconnect() {
  const token = config.drive.refreshToken;
  config.drive.refreshToken = null;
  config.drive.email = null;
  driveToken = null;
  await saveConfig();
  if (token) await httpRequest('POST', GOOGLE.revoke, { ...formBody({ token }), timeoutMs: 10000 }).catch(() => {});
  return publicConfig();
}

let modelCache = null;

async function handleModels() {
  const base = KNOWN_MODELS.map(m => ({ ...m, known: true, available: null }));
  // Hugging Face's free GPUs serve the open models without any key, so none of them is ever blocked
  const routes = freeRoutesNow();
  const open = [FREE_AUTO_MODEL, ...OPEN_MODELS, ...freeImageModels()].map(m => ({ ...m, availableNow: availableNow(m, routes) }))
    .map(({ found, ...m }) => ({ ...m, known: true, available: null, keyMissing: false }));
  const freeStatus = freeStatusNow();
  const { key } = getApiKey();
  if (!key) return { models: [...base, ...open], source: 'static', freeStatus };
  if (modelCache && modelCache.key === key && Date.now() - modelCache.at < MODEL_CACHE_MS) return { ...modelCache.value, models: [...modelCache.value.models, ...open], freeStatus };
  try {
    const imageModels = (await listModels(key)).filter(m =>
      (m.supportedGenerationMethods || []).includes('generateContent')
      && /image|banana/i.test(m.name || '')
      && !/imagen|veo|video|embed|tts/i.test(m.name || ''));
    const ids = new Set(imageModels.map(m => m.name.replace(/^models\//, '')));
    const models = base.map(m => ({ ...m, available: ids.has(m.id) }));
    for (const m of imageModels) {
      const id = m.name.replace(/^models\//, '');
      if (KNOWN_BY_ID.has(id) || HIDDEN_MODEL_IDS.has(id) || !MODEL_ID_RE.test(id) || isAliasOfKnown(id, m.displayName)) continue;
      models.push({
        id,
        label: m.displayName || id,
        desc: m.description || 'An image model found in your account.',
        ratios: RATIOS_STD,
        sizes: [],
        thinking: null,
        refsHint: '',
        price: null,
        known: false,
        available: true,
        provider: 'gemini',
        refs: true,
        maxRefs: MAX_REFS,
      });
    }
    const value = { models, source: 'api' };
    modelCache = { key, at: Date.now(), value };
    return { ...value, models: [...models, ...open], freeStatus };
  } catch (err) {
    return { models: [...base, ...open], source: 'static', warning: describeError(err).message, freeStatus };
  }
}

// A new image waits in the pending cache (and in memory) until it’s uploaded to Google Drive.
async function stashImage(buf, mimeType, now, slug) {
  const id = `${now.getTime().toString(36)}${crypto.randomBytes(4).toString('hex')}`;
  const ext = mimeType === 'image/svg+xml' ? 'svg' : VIDEO_MIME_EXT[mimeType] || EXT_BY_MIME[mimeType] || 'png';
  const localPath = path.join(PENDING_DIR, `${id}.${ext}`);
  await fsp.mkdir(PENDING_DIR, { recursive: true });
  await fsp.writeFile(localPath, buf);
  cachePut(id, buf, mimeType);
  const dims = imageDimensions(buf) || {};
  return { id, localPath, name: `${localTime(now)}-${slug}-${id.slice(-6)}.${ext}`, width: dims.width, height: dims.height, bytes: buf.length };
}

async function handleGenerate(body) {
  const model = String(body.model || '');
  if (!MODEL_ID_RE.test(model)) throw httpError(400, 'Invalid model.');
  const meta = MODELS_BY_ID.get(model) || freeModelMeta(model);
  const prompt = String(body.prompt || '').trim().slice(0, MAX_PROMPT_CHARS);
  const refs = cleanRefs(body.refs);
  if (!prompt && !refs.length) throw httpError(400, 'Write a prompt or add a reference.');

  const aspectRatio = RATIOS_ALL.includes(body.aspectRatio) ? body.aspectRatio : null;
  const imageSize = IMAGE_SIZES.includes(body.imageSize) ? body.imageSize : null;
  const thinkingLevel = THINKING_LEVELS.includes(body.thinkingLevel) ? body.thinkingLevel : null;

  const started = Date.now();
  let result;
  try {
    result = meta?.open
      ? await freeGenerate(meta, prompt, refs, aspectRatio)
      : await geminiGenerate(model, prompt, refs, { aspectRatio, imageSize, thinkingLevel });
  } catch (err) {
    console.log(`  ✗ ${model}: ${String(err.info?.message || err.message).split('\n')[0].slice(0, 160)}`);
    throw err;
  }
  const durationMs = Date.now() - started;
  const { images, text, usageMetadata } = result;
  const callCost = estimateCost(meta, usageMetadata, imageSize || '1K', images.length);
  const now = new Date();
  const day = localDay(now);
  const slug = slugify(body.userPrompt || prompt) || 'image';
  const batchId = /^[\w-]{1,64}$/.test(String(body.batchId || '')) ? String(body.batchId) : null;
  const batchCreatedAt = typeof body.batchCreatedAt === 'string' && !Number.isNaN(Date.parse(body.batchCreatedAt))
    ? body.batchCreatedAt : now.toISOString();
  const usage = usageMetadata ? {
    prompt: usageMetadata.promptTokenCount,
    output: usageMetadata.candidatesTokenCount,
    thoughts: usageMetadata.thoughtsTokenCount,
  } : undefined;

  const items = [];
  for (const [i, image] of images.entries()) {
    const file = await stashImage(Buffer.from(image.data, 'base64'), image.mimeType, now, slug);
    items.push({
      id: file.id,
      via: result.via,
      batchId: batchId || file.id,
      batchCreatedAt,
      index: (Number(body.index) || 0) + i / 10,
      createdAt: now.toISOString(),
      model: result.model || model, // “Best free (auto)” says which model made it
      prompt,
      userPrompt: String(body.userPrompt ?? prompt).slice(0, MAX_PROMPT_CHARS),
      style: typeof body.style === 'string' ? body.style.slice(0, 80) : null,
      styleId: typeof body.styleId === 'string' ? body.styleId.slice(0, 40) : null,
      nodes: cleanNodesMeta(body.nodes),
      aspectRatio: aspectRatio || 'auto',
      imageSize,
      thinkingLevel,
      refs,
      day,
      name: file.name,
      mimeType: image.mimeType,
      width: file.width,
      height: file.height,
      bytes: file.bytes,
      durationMs,
      cost: callCost == null ? null : Math.round((callCost / images.length) * 1e5) / 1e5,
      usage,
      text: text || undefined,
      pending: true,
      localPath: file.localPath,
    });
  }
  history.unshift(...items);
  await saveHistory();
  scheduleUploads();
  console.log(`  ✓ ${result.model || model} · ${imageSize || '–'} · ${aspectRatio || 'auto'} · ${(durationMs / 1000).toFixed(1)} s${refs.length ? ` · ${refs.length} ref.` : ''}`);
  return { items: items.map(publicItem) };
}

function cleanEnhancedPrompt(text) {
  let out = text.trim()
    .replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '')
    .replace(/^\s*(final\s+)?prompt\s*:\s*/i, '')
    .trim();
  if (/^"[^"]*"$/.test(out) || /^“[^”]*”$/.test(out)) out = out.slice(1, -1).trim();
  return out;
}

async function handleEnhance(body) {
  const key = requireApiKey();
  const idea = String(body.prompt || '').trim().slice(0, MAX_PROMPT_CHARS);
  if (!idea) throw httpError(400, 'Write an idea to enhance first.');
  const parts = [
    ...await loadRefParts(cleanRefs(body.refs), 6),
    { text: `User's idea (may be written in Czech or another language):\n${idea}` },
  ];
  const request = { systemInstruction: { parts: [{ text: ENHANCE_SYSTEM }] }, contents: [{ role: 'user', parts }] };
  const candidates = [...new Set([config.enhanceModel, ...ENHANCE_MODELS].filter(Boolean))];
  let lastError;
  for (const model of candidates) {
    try {
      const { text } = extractOutput(await generateContent(model, request, key, 90000));
      if (!text) throw new GeminiError(200, null, 'The model returned no text.');
      return { prompt: cleanEnhancedPrompt(text), model };
    } catch (err) {
      lastError = err;
      const missing = err.status === 404 || (err.status === 400 && /not found|not supported|unsupported/i.test(err.message));
      if (!missing) throw err;
    }
  }
  throw lastError;
}

async function handleRefUpload(body) {
  const ext = EXT_BY_MIME[String(body.mimeType || '').toLowerCase()];
  if (!ext) throw httpError(415, 'Gemini doesn’t support this image format.');
  const buf = Buffer.from(String(body.data || ''), 'base64');
  if (buf.length < 32) throw httpError(400, 'Empty image.');
  const name = `${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 24)}.${ext}`;
  const file = path.join(REFS_DIR, name);
  if (!fs.existsSync(file)) {
    await fsp.mkdir(REFS_DIR, { recursive: true });
    await fsp.writeFile(file, buf);
  }
  // a small copy next to it – Cloudflare's FLUX.2 only takes references under 512 px
  const small = typeof body.small === 'string' ? Buffer.from(body.small, 'base64') : null;
  const smallDims = small && sniffMime(small) === 'image/jpeg' ? imageDimensions(small) : null;
  if (smallDims && Math.max(smallDims.width, smallDims.height) <= CF_REF_MAX_SIDE) {
    const smallFile = path.join(REFS_DIR, name.replace(/\.[^.]+$/, '.small.jpg'));
    if (!fs.existsSync(smallFile)) await fsp.writeFile(smallFile, small);
  }
  return { path: `refs/${name}`, url: `/refs/${name}` };
}

function findItem(id) {
  const item = history.find(it => it.id === id);
  if (!item) throw httpError(404, 'Image not found.');
  return item;
}

async function handlePatch(id, body) {
  const item = findItem(id);
  if (typeof body.favorite === 'boolean') item.favorite = body.favorite;
  // a clip whose file header doesn't say how long it is: the browser measures it
  const seconds = Number(body.duration);
  if (/^video\//.test(item.mimeType || '') && !item.duration && Number.isFinite(seconds) && seconds > 0 && seconds < 36000) item.duration = Math.round(seconds * 1000) / 1000;
  await saveHistory();
  return { item: publicItem(item) };
}

async function handleThumb(id, body) {
  const item = findItem(id);
  const buf = Buffer.from(String(body.data || ''), 'base64');
  if (buf.length < 100 || buf[0] !== 0xff || buf[1] !== 0xd8) throw httpError(400, 'Invalid thumbnail.');
  await fsp.mkdir(THUMBS_DIR, { recursive: true });
  await fsp.writeFile(path.join(THUMBS_DIR, `${id}.jpg`), buf);
  item.thumb = true;
  await saveHistory();
  return { thumb: true };
}

async function handleDelete(body) {
  const ids = new Set((Array.isArray(body.ids) ? body.ids : []).map(String));
  const removed = history.filter(it => ids.has(it.id));
  history = history.filter(it => !ids.has(it.id));
  await saveHistory();
  let driveFailed = 0;
  for (const item of removed) {
    cacheDelete(item.id);
    if (item.localPath) await fsp.unlink(item.localPath).catch(() => {});
    await fsp.unlink(path.join(THUMBS_DIR, `${item.id}.jpg`)).catch(() => {});
    if (item.drive?.id) {
      // to the Drive trash – it can be restored from there for 30 days
      try { await driveTrash(item.drive.id); } catch { driveFailed++; }
    }
  }
  return { deleted: removed.length, driveFailed };
}

function openExternal(target) {
  const [cmd, args] = process.platform === 'win32' ? ['explorer.exe', [target]]
    : process.platform === 'darwin' ? ['open', [target]]
      : ['xdg-open', [target]];
  spawn(cmd, args, { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
}

function handleOpenFolder() {
  if (config.drive.folderId) return { url: `https://drive.google.com/drive/folders/${config.drive.folderId}` };
  openExternal(DATA_DIR);
  return { opened: DATA_DIR };
}

// ── Effects ─────────────────────────────────────────────────────────────────
// Effects are GLSL files: effects/ (built in) and effects/custom/ (made by the user or the AI coder). The
// browser compiles and runs them on the GPU; the server lists and saves the files and talks to the AI coder.

async function readEffectDir(dir, prefix) {
  let names;
  try {
    names = (await fsp.readdir(dir)).filter(n => /^[\w-]{1,60}\.glsl$/i.test(n)).sort();
  } catch {
    return [];
  }
  const out = [];
  for (const name of names) {
    const file = path.join(dir, name);
    try {
      const source = await fsp.readFile(file, 'utf8');
      if (Buffer.byteLength(source) <= MAX_EFFECT_BYTES) {
        out.push({ id: prefix + name.replace(/\.glsl$/i, ''), file: path.relative(ROOT, file).replace(/\\/g, '/'), source });
      }
    } catch { /* unreadable – skip it */ }
  }
  return out;
}

async function handleEffectsList() {
  const [builtin, custom] = await Promise.all([readEffectDir(EFFECTS_DIR, ''), readEffectDir(CUSTOM_EFFECTS_DIR, 'custom/')]);
  return {
    builtin,
    custom,
    coder: { models: publicCoders(coderModels()), vectorModels: publicCoders(coderModels({ svg: true })), pollinations: Boolean(config.pollinationsKey) || hasCloudflare(), cloudflare: hasCloudflare(), gemini: Boolean(getApiKey().key) },
  };
}

const customEffectSlug = id => /^custom\/([\w-]{1,60})$/.exec(String(id || ''))?.[1] || null;

// Saves an effect from the code editor or the AI coder. An existing custom effect is overwritten, everything
// else (including edited built-in effects) becomes a new file in effects/custom/.
async function handleEffectSave(body) {
  const source = String(body.source || '').replace(/\r\n?/g, '\n');
  if (!source.trim()) throw httpError(400, 'The effect code is empty.');
  if (Buffer.byteLength(source) > MAX_EFFECT_BYTES) throw httpError(400, 'The effect code is too long (max 64 KB).');
  if (!/\bvec4\s+effect\s*\(/.test(source) && !/\bvoid\s+main\s*\(/.test(source)) {
    throw httpError(400, 'The code needs a `vec4 effect(vec2 uv)` function.');
  }
  const name = source.match(/^\s*\/\/\s*@name\s+(.+?)\s*$/m)?.[1] || 'My effect';
  await fsp.mkdir(CUSTOM_EFFECTS_DIR, { recursive: true });
  let slug = customEffectSlug(body.id);
  if (!slug || !fs.existsSync(path.join(CUSTOM_EFFECTS_DIR, `${slug}.glsl`))) {
    const base = slugify(name) || 'effect';
    slug = base;
    for (let n = 2; fs.existsSync(path.join(CUSTOM_EFFECTS_DIR, `${slug}.glsl`)); n++) slug = `${base}-${n}`;
  }
  await writeFileSafe(path.join(CUSTOM_EFFECTS_DIR, `${slug}.glsl`), source.endsWith('\n') ? source : `${source}\n`);
  console.log(`  ✓ effect saved: effects/custom/${slug}.glsl`);
  return { id: `custom/${slug}`, file: `effects/custom/${slug}.glsl` };
}

// Deleting only moves the file to effects/custom/.trash – it can be put back by hand.
async function handleEffectDelete(body) {
  const slug = customEffectSlug(body.id);
  if (!slug) throw httpError(400, 'Only your own effects can be deleted.');
  const trash = path.join(CUSTOM_EFFECTS_DIR, '.trash');
  await fsp.mkdir(trash, { recursive: true });
  try {
    await fsp.rename(path.join(CUSTOM_EFFECTS_DIR, `${slug}.glsl`), path.join(trash, `${slug}-${Date.now()}.glsl`));
  } catch (err) {
    if (err.code === 'ENOENT') throw httpError(404, 'That effect no longer exists.');
    throw err;
  }
  console.log(`  ✓ effect moved to effects/custom/.trash: ${slug}.glsl`);
  return { ok: true };
}

const CODER_INTRO = `You are an expert graphics programmer who writes effects for "hombresai", a browser studio that applies
procedural GPU effects to images, videos and the camera. Answer with exactly one complete effect file in a
\`\`\`glsl code block and nothing else – no explanation before or after it.

Write a beautiful, efficient effect that matches the request. Expose the interesting knobs as @param sliders
(3–8 is a good number) with sensible ranges and defaults that already look great. Give it a short, catchy
@name, a @category, a one-sentence @description and a fitting @palette (plus @finish if glow or scan lines help).
If it moves over time, use uTime and add an @animated line (with param= pointing at a speed slider that can be 0).

The effect file format, the helpers you can call and the GLSL rules follow. Obey them exactly – the code is
compiled as WebGL2 GLSL ES 3.00 together with the header described in the guide.`;

// The guide in effects/README.md is the AI coder's manual too.
const effectGuide = () => fsp.readFile(path.join(EFFECTS_DIR, 'README.md'), 'utf8').catch(() => '');

function extractGlsl(text) {
  const str = String(text || '');
  const blocks = [...str.matchAll(/```[ \t]*[\w+-]*[ \t]*\r?\n([\s\S]*?)```/g)].map(m => m[1]);
  const code = blocks.find(b => /\bvec4\s+effect\s*\(/.test(b))
    || (str.includes('```') ? str.slice(str.indexOf('```')).replace(/^```[^\n]*\n/, '').replace(/```[\s\S]*$/, '') : str);
  return /\bvec4\s+effect\s*\(|\bvoid\s+main\s*\(/.test(code) ? code.replace(/\r\n?/g, '\n').trim() : '';
}

async function coderPollinations(model, system, user, { maxTokens = 8000 } = {}) {
  const key = config.pollinationsKey;
  if (!key) {
    if (hasCloudflare()) return cloudflareChat(system, user, maxTokens);
    throw httpError(401, 'The free AI coders need a Pollinations key – add it in Settings.', {
      code: 'pollinations_key',
      hint: 'Create a free key at enter.pollinations.ai/keys and paste it in Settings → Open-source models.',
    });
  }
  const send = async (modelId, auth) => {
    try {
      return await httpRequest('POST', `${POLLINATIONS_BASE}/v1/chat/completions`, {
        body: { model: modelId, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.3, max_tokens: maxTokens },
        headers: auth ? { Authorization: `Bearer ${key}` } : {},
        timeoutMs: 4 * 60 * 1000,
      });
    } catch (err) {
      const error = new PollinationsError({ status: 0 }, err.code === 'ETIMEDOUT'
        ? 'The AI coder didn’t answer in time.'
        : `Couldn’t connect to Pollinations (${err.code || err.message}).`);
      error.network = true;
      throw error;
    }
  };
  const text = res => {
    const content = res.json?.choices?.[0]?.message?.content;
    return Array.isArray(content) ? content.map(part => part?.text || '').join('') : String(content || '');
  };
  let res, failure;
  try {
    res = await send(model.id, true);
    if (res.status === 200) return text(res);
    failure = new PollinationsError(res);
  } catch (err) {
    failure = err;
  }
  const code = describePollinationsError(failure).code;
  if (code === 'pollinations_balance') notePollen(0);
  // Pollinations can't serve it: the connected Cloudflare account takes over
  if (hasCloudflare() && CF_FALLBACK_CODES.has(code)) {
    console.log(`  ! Pollinations: ${describePollinationsError(failure).message} → Cloudflare Workers AI`);
    return cloudflareChat(system, user, maxTokens);
  }
  // When Pollinations can't look keys up (their database fails), some open models still answer without a key.
  if (code === 'pollinations_outage') {
    const anon = POLLINATIONS_ANON_CODERS.includes(model.id) ? model.id : POLLINATIONS_ANON_CODERS[0];
    console.log(`  ! Pollinations can’t check API keys – asking ${anon} without a key`);
    const retry = await send(anon, false).catch(() => null);
    // keyless requests are rationed per IP – if that's refused too, the outage is the real reason
    if (retry?.status === 200) return text(retry);
  }
  throw failure;
}

async function coderGemini(model, system, user, { maxTokens = 8192 } = {}) {
  const key = requireApiKey();
  const request = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
  };
  let lastError;
  for (const id of [...new Set([model.id, ...ENHANCE_MODELS])]) {
    try {
      return extractOutput(await generateContent(id, request, key, 3 * 60 * 1000)).text || '';
    } catch (err) {
      lastError = err;
      const missing = err.status === 404 || (err.status === 400 && /not found|not supported|unsupported/i.test(err.message));
      if (!missing) throw err;
    }
  }
  throw lastError;
}

// Writes a new effect, changes an existing one, or fixes compile errors the browser reported.
async function handleEffectAi(body) {
  const prompt = String(body.prompt || '').trim().slice(0, 2000);
  const base = typeof body.source === 'string' ? body.source.slice(0, MAX_EFFECT_BYTES) : '';
  const error = typeof body.error === 'string' ? body.error.slice(0, 4000) : '';
  if (!prompt) throw httpError(400, 'Describe the effect you want.');
  const model = coderModels().find(m => m.id === body.model) || CODER_MODELS[0];
  const system = `${CODER_INTRO}\n\n${await effectGuide()}`;
  let user;
  if (error && base) {
    user = `This effect file fails to compile in WebGL2 (GLSL ES 3.00). Fix every error and return the complete corrected file; otherwise keep the effect and its sliders the same.\n\nCompiler errors (line numbers are lines of the effect file):\n${error}\n\nWhat the effect should do: ${prompt}\n\n\`\`\`glsl\n${base}\n\`\`\``;
  } else if (base.trim()) {
    user = `Here is an existing effect. Change it as follows: ${prompt}\n\nKeep what still fits and keep slider names where they still make sense. Update @name and @description if the look changes. Return the complete new file.\n\n\`\`\`glsl\n${base}\n\`\`\``;
  } else {
    user = `Create a new effect: ${prompt}`;
  }
  const started = Date.now();
  const text = await runCoder(model, system, user);
  const source = extractGlsl(text);
  if (!source) {
    throw httpError(502, 'The AI coder didn’t return any shader code.', {
      code: 'ai_empty',
      hint: 'Try again, describe the effect a little differently, or pick another AI coder.',
    });
  }
  console.log(`  ✓ AI coder (${model.label}): ${((Date.now() - started) / 1000).toFixed(1)} s${error ? ' – compile fix' : ''}`);
  return { source, model: model.id };
}

// An image rendered in Effects joins the gallery and goes to Google Drive like a generated one.
async function handleEffectExport(body) {
  const mimeType = ['image/png', 'image/jpeg', 'image/webp'].includes(body.mimeType) ? body.mimeType : null;
  const buf = mimeType && typeof body.data === 'string' ? Buffer.from(body.data, 'base64') : null;
  if (!buf || !imageDimensions(buf)) throw httpError(400, 'That isn’t a valid image.');
  const label = String(body.label || 'Effect').trim().slice(0, 80) || 'Effect';
  const now = new Date();
  const file = await stashImage(buf, mimeType, now, slugify(label) || 'effect');
  const item = {
    id: file.id,
    batchId: file.id,
    batchCreatedAt: now.toISOString(),
    index: 0,
    createdAt: now.toISOString(),
    model: 'effects',
    prompt: String(body.description || label).slice(0, 2000),
    userPrompt: label,
    style: null,
    styleId: null,
    effect: { name: label, palette: typeof body.palette === 'string' ? body.palette.slice(0, 40) : undefined },
    aspectRatio: 'auto',
    imageSize: null,
    thinkingLevel: null,
    refs: [],
    day: localDay(now),
    name: file.name,
    mimeType,
    width: file.width,
    height: file.height,
    bytes: file.bytes,
    cost: null,
    pending: true,
    localPath: file.localPath,
  };
  history.unshift(item);
  await saveHistory();
  scheduleUploads();
  console.log(`  ✓ effect image saved: ${label} · ${file.width}×${file.height}`);
  return { items: [publicItem(item)] };
}

// ── Nodes ───────────────────────────────────────────────────────────────────
// Node graphs (camera, lens, exposure, light…) are kept in the profile next to the config. nodes-core.js is the same
// file the browser uses, so a graph compiles to exactly the same prompt here, in the app and for Claude.

const NodesCore = require('./public/nodes-core.js');
const GRAPHS_FILE = path.join(DATA_DIR, 'nodes.json');
const MAX_GRAPHS = 500;
let graphStore = null;

async function loadGraphs() {
  if (graphStore) return graphStore;
  graphStore = new Map();
  try {
    const data = JSON.parse(await fsp.readFile(GRAPHS_FILE, 'utf8'));
    for (const g of Array.isArray(data) ? data : []) {
      const clean = NodesCore.sanitizeGraph(g);
      if (typeof g.updatedAt === 'string') clean.updatedAt = g.updatedAt;
      graphStore.set(clean.id, clean);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('Couldn’t read the node graphs:', err.message);
  }
  return graphStore;
}

async function saveGraphs() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await writeFileSafe(GRAPHS_FILE, JSON.stringify([...graphStore.values()], null, 1));
}

async function handleNodesList() {
  const graphs = await loadGraphs();
  return { graphs: [...graphs.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) };
}

async function handleNodesSave(body) {
  const graphs = await loadGraphs();
  if (!body.graph || typeof body.graph !== 'object') throw httpError(400, 'No graph to save.');
  if (graphs.size >= MAX_GRAPHS && !graphs.has(body.graph.id)) throw httpError(400, 'There are too many graphs – delete some first.');
  const graph = NodesCore.sanitizeGraph(body.graph);
  graphs.set(graph.id, graph);
  await saveGraphs();
  return { graph };
}

async function handleNodesDelete(body) {
  const graphs = await loadGraphs();
  if (!graphs.delete(String(body.id || ''))) throw httpError(404, 'That graph doesn’t exist.');
  await saveGraphs();
  return { ok: true };
}

// a graph by id or (case-insensitive) name, or an inline graph object
async function resolveGraph(body) {
  if (body.graph && typeof body.graph === 'object') return NodesCore.sanitizeGraph(body.graph);
  const graphs = await loadGraphs();
  const ref = String(body.graphId || body.id || body.name || '').trim();
  const graph = graphs.get(ref) || [...graphs.values()].find(g => g.name.toLowerCase() === ref.toLowerCase());
  if (!graph) throw httpError(404, `No node graph “${ref}”.`);
  return graph;
}

function compileOptions(body) {
  const formats = body.formats && typeof body.formats === 'object'
    ? Object.fromEntries(['prose', 'xml', 'json', 'markdown'].filter(k => k in body.formats).map(k => [k, Boolean(body.formats[k])]))
    : undefined;
  return {
    // target null = every shot node; skip/only = leave out node types / keep nodes made for 'image' or 'video'
    target: body.target === null ? null : body.target ? String(body.target) : undefined,
    skip: Array.isArray(body.skip) ? body.skip.map(String).slice(0, 20) : undefined,
    only: ['image', 'video'].includes(body.only) ? body.only : undefined,
    prompt: typeof body.prompt === 'string' ? body.prompt.slice(0, MAX_PROMPT_CHARS) : '',
    formats,
  };
}

async function handleNodesTemplate(body) {
  const want = String(body.template || '');
  const t = NodesCore.TEMPLATES.find(x => x.id === want);
  // the user's own templates, by id or by name
  const own = t ? null : [...(await loadUserTemplates()).values()].find(x => x.id === want || x.name.toLowerCase() === want.trim().toLowerCase());
  if (!t && !own) {
    const names = [...NodesCore.TEMPLATES.map(x => x.id), ...[...(await loadUserTemplates()).values()].map(x => x.name)];
    throw httpError(400, `Unknown template. Use one of: ${names.join(', ')}.`);
  }
  const graph = t ? t.build() : NodesCore.sanitizeGraph({ ...JSON.parse(JSON.stringify(own.graph)), id: undefined, name: own.name });
  if (body.name) graph.name = String(body.name).slice(0, 80);
  return handleNodesSave({ graph });
}

// ── Your own node templates: a graph kept as a starting point, with the images of its Reference nodes ──
const NODE_TEMPLATES_FILE = path.join(DATA_DIR, 'node-templates.json');
let userTemplates = null;

async function loadUserTemplates() {
  if (userTemplates) return userTemplates;
  userTemplates = new Map();
  try {
    for (const t of JSON.parse(await fsp.readFile(NODE_TEMPLATES_FILE, 'utf8'))) {
      if (t?.id && t.graph) userTemplates.set(t.id, { ...t, graph: NodesCore.sanitizeGraph(t.graph) });
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('Couldn’t read the node templates:', err.message);
  }
  return userTemplates;
}

async function saveUserTemplates() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await writeFileSafe(NODE_TEMPLATES_FILE, JSON.stringify([...userTemplates.values()], null, 1));
}

async function handleUserTemplatesList() {
  const map = await loadUserTemplates();
  return { templates: [...map.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}

// Saving under an existing name replaces that template.
async function handleUserTemplateSave(body) {
  const map = await loadUserTemplates();
  const source = body.graph && typeof body.graph === 'object' ? body.graph : body.graphId ? (await loadGraphs()).get(String(body.graphId)) : null;
  if (!source) throw httpError(400, 'Which graph should become the template?');
  const name = String(body.name || source.name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!name) throw httpError(400, 'Give the template a name.');
  const graph = NodesCore.sanitizeGraph({ ...JSON.parse(JSON.stringify(source)), name });
  if (!graph.nodes.length) throw httpError(400, 'The graph is empty.');
  for (const n of graph.nodes) {
    for (const v of Object.values(n.values || {})) {
      if (v && typeof v === 'object' && v.path && !fs.existsSync(path.join(CACHE_DIR, v.path))) throw httpError(400, `An image in “${n.type}” is no longer on this computer – choose it again first.`);
    }
  }
  const old = [...map.values()].find(x => x.name.toLowerCase() === name.toLowerCase());
  const now = new Date().toISOString();
  const template = { id: old?.id || `ut${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`, name, kind: graph.kind, graph: { ...graph, id: undefined }, createdAt: old?.createdAt || now, updatedAt: now };
  map.set(template.id, template);
  await saveUserTemplates();
  return { template, replaced: Boolean(old) };
}

async function handleUserTemplateDelete(body) {
  const map = await loadUserTemplates();
  if (!map.delete(String(body.id || ''))) throw httpError(404, 'That template doesn’t exist.');
  await saveUserTemplates();
  return { ok: true };
}

// Gallery images as references (for Claude): each becomes a refs/… file like an upload in Create.
async function handleRefsFromItems(body) {
  const ids = (Array.isArray(body.ids) ? body.ids : []).slice(0, MAX_REFS);
  const roles = Array.isArray(body.roles) ? body.roles : [];
  const refs = [];
  for (const [i, id] of ids.entries()) refs.push({ path: await refFromItem(id), role: Object.hasOwn(REF_ROLES, roles[i]) ? roles[i] : 'auto' });
  return { refs };
}

async function handleNodesCompile(body) {
  const graph = await resolveGraph(body);
  const c = NodesCore.compile(graph, compileOptions(body));
  return { graph: { id: graph.id, name: graph.name, kind: graph.kind }, ...c };
}

function handleNodeTypes() {
  const types = Object.entries(NodesCore.NODE_TYPES).map(([id, t]) => ({
    type: id,
    title: t.title,
    category: t.category,
    kinds: t.kinds,
    help: t.help,
    inputs: t.inputs,
    outputs: t.outputs,
    fields: t.fields.map(f => ({ id: f.id, label: f.label, type: f.type, default: f.default, ...(f.options && f.type !== 'model' ? { options: f.options.map(o => o.value) } : {}) })),
  }));
  return { types, categories: NodesCore.CATEGORIES, templates: NodesCore.TEMPLATES.map(t => ({ id: t.id, name: t.name, kind: t.kind })) };
}

const cleanNodesMeta = n => (n && typeof n === 'object' && n.name
  ? { graphId: String(n.graphId || '').slice(0, 40), name: String(n.name).slice(0, 80), chips: (Array.isArray(n.chips) ? n.chips : []).slice(0, 12).map(c => String(c).slice(0, 40)) }
  : undefined);

// The full file of a gallery item: from memory, the waiting file or Google Drive.
async function itemBuffer(item) {
  let entry = cacheGet(item.id);
  if (!entry && item.localPath) {
    try { entry = { buffer: await fsp.readFile(item.localPath), mimeType: item.mimeType }; } catch { /* uploaded in the meantime */ }
  }
  if (!entry && item.drive?.id) {
    const r = await driveRequest('GET', `${GOOGLE.drive}/files/${encodeURIComponent(item.drive.id)}?alt=media`, { binary: true, timeoutMs: 120000 });
    if (r.status !== 200) throw httpError(r.status === 404 ? 404 : 502, r.status === 404 ? 'The file is no longer on Google Drive.' : 'Google Drive didn’t return the file.');
    entry = { buffer: r.buffer, mimeType: item.mimeType };
    cachePut(item.id, r.buffer, item.mimeType);
  }
  if (!entry) throw httpError(404, 'The file isn’t available.');
  return entry;
}

// A gallery image as a reference file (refs/…), like uploading it in Create.
async function refFromItem(id) {
  const item = findItem(String(id));
  if (!/^image\/(png|jpeg|webp)$/.test(item.mimeType || '')) throw httpError(400, 'Only PNG, JPEG and WebP images can be references.');
  const { buffer } = await itemBuffer(item);
  const ext = EXT_BY_MIME[item.mimeType];
  const name = `${crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 24)}.${ext}`;
  const file = path.join(REFS_DIR, name);
  if (!fs.existsSync(file)) {
    await fsp.mkdir(REFS_DIR, { recursive: true });
    await fsp.writeFile(file, buffer);
  }
  return `refs/${name}`;
}

async function nodeImageRef(entry, graph, depth) {
  if (!entry) return null;
  if (entry.kind === 'reference') {
    const img = entry.image || {};
    if (/^refs\/[\w.-]+$/.test(img.path || '') && fs.existsSync(path.join(CACHE_DIR, img.path))) return { path: img.path, role: entry.role || 'auto' };
    if (img.itemId) return { path: await refFromItem(img.itemId), role: entry.role || 'auto' };
    return null;
  }
  // an image made by another Generate node in the same graph: run it first
  if (depth > 3) throw httpError(400, 'The graph chains too many Generate nodes.');
  const node = graph.nodes.find(n => n.id === entry.node);
  const run = await runImageNode(graph, node, { count: 1 }, depth + 1);
  return run.items[0] ? { path: await refFromItem(run.items[0].id), role: 'auto', itemId: run.items[0].id } : null;
}

async function runImageNode(graph, node, opts = {}, depth = 0) {
  const c = NodesCore.compile(graph, { target: node.id, prompt: opts.prompt || '', formats: opts.formats });
  const v = node.values;
  const model = String(opts.model || v.model);
  if (!MODELS_BY_ID.has(model) && !MODEL_ID_RE.test(model)) throw httpError(400, 'Invalid model.');
  const refs = [];
  for (const entry of c.inputs.refs || []) {
    const ref = await nodeImageRef(entry, graph, depth);
    if (ref) refs.push({ path: ref.path, role: ref.role });
  }
  const count = clamp(parseInt(opts.count ?? v.count, 10) || 1, 1, 4);
  const now = new Date().toISOString();
  const batchId = `n${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
  const items = [];
  for (let i = 0; i < count; i++) {
    const res = await handleGenerate({
      model,
      prompt: c.prompt,
      userPrompt: c.parts.base || graph.name,
      aspectRatio: opts.aspectRatio || (v.ratio === 'auto' ? null : v.ratio),
      imageSize: opts.imageSize || v.size,
      refs,
      nodes: { graphId: graph.id, name: graph.name, chips: c.chips },
      batchId,
      batchCreatedAt: now,
      index: i,
    });
    items.push(...res.items);
  }
  return { compiled: c, items };
}

// Runs a graph's Generate node on the server – for Claude; the app runs nodes from the browser.
async function handleNodesRun(body) {
  const graph = await resolveGraph(body);
  const outputs = NodesCore.outputNodes(graph);
  const node = body.target ? graph.nodes.find(n => n.id === body.target) : outputs.find(n => NodesCore.NODE_TYPES[n.type].output === graph.kind) || outputs[0];
  if (!node || !NodesCore.NODE_TYPES[node.type]?.output) throw httpError(400, 'The graph has no Generate image or Generate video node.');
  const opts = compileOptions(body);
  if (NodesCore.NODE_TYPES[node.type].output === 'video') {
    if (typeof runVideoNode !== 'function') throw httpError(501, 'Video generation isn’t available yet.');
    return runVideoNode(graph, node, { ...opts, wait: body.wait });
  }
  const run = await runImageNode(graph, node, { ...opts, count: body.count, model: body.model });
  return { prompt: run.compiled.prompt, chips: run.compiled.chips, warnings: run.compiled.warnings, items: run.items };
}

// ── Vectors ─────────────────────────────────────────────────────────────────

const MAX_SVG_BYTES = 4 * 1024 * 1024;
const VECTOR_INTRO = `You are an expert vector illustrator who draws with hand-written SVG code for "hombresai", a vector
editor similar to Adobe Illustrator. Answer with exactly one complete SVG document in a \`\`\`svg code block and nothing
else – no explanation before or after it.

Rules:
- Root: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H" width="W" height="H"> – pick W×H to suit the
  subject (1000×1000 unless the request implies another shape).
- Draw with <path>, <rect>, <circle>, <ellipse>, <line>, <polyline>, <polygon> and <text>, grouped with <g> into
  meaningful parts (give each <g> an id that names the part, e.g. id="left-eye"). Prefer filled shapes with clear,
  confident curves; use strokes only where lines are the point.
- Solid hex colors on fill/stroke attributes, a deliberate palette (4–10 colors). Linear and radial gradients in <defs>
  are allowed when they really help; no filters, masks, patterns, images, CSS classes, <style>, scripts, animation,
  event attributes, external links or <foreignObject>.
- Leave the background transparent unless a background is requested.
- Make it look professionally designed – balanced composition, good proportions, enough detail to be convincing but
  no tiny noise. Keep the file compact: round coordinates to at most 1 decimal.`;

function extractSvg(text) {
  const str = String(text || '');
  const start = str.search(/<svg[\s>]/i);
  const end = str.toLowerCase().lastIndexOf('</svg>');
  return start >= 0 && end > start ? str.slice(start, end + 6).trim() : '';
}

// The AI's drawing without anything active: scripts, embedded documents, event attributes and outside links go.
function stripUnsafeSvg(svg) {
  return svg
    .replace(/<\s*(script|foreignObject|iframe|object|embed|audio|video)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|foreignObject|iframe|object|embed|audio|video)\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:xlink:)?(?:href|src)\s*=\s*(["'])\s*(?:javascript:|data:text\/html|https?:|\/\/)[^"']*\1/gi, '')
    .replace(/<!ENTITY[^>]*>/gi, '');
}

// Vector drawings are only accepted when they can't carry scripts or reach out of the page.
function unsafeSvg(svg) {
  return /<\s*(script|foreignObject|iframe|object|embed|audio|video)\b|\son\w+\s*=|javascript:|data:text\/html|<!ENTITY|(?:href|src)\s*=\s*["']?\s*(?:https?:)?\/\//i.test(svg);
}

// The AI draws a new vector graphic, or changes the drawing it gets.
async function handleVectorAi(body) {
  const prompt = String(body.prompt || '').trim().slice(0, 2000);
  const base = typeof body.source === 'string' ? body.source.slice(0, 200000) : '';
  if (!prompt) throw httpError(400, 'Describe what to draw.');
  const model = coderModels({ svg: true }).find(m => m.id === body.model) || CODER_MODELS[0];
  if (model.svgOnly && base.trim()) throw httpError(400, `${model.label} can only draw new drawings – pick another AI model to change this one.`);
  const user = base.trim()
    ? `Here is an existing SVG drawing. Change it as follows: ${prompt}\n\nKeep everything that still fits, keep the viewBox, and return the complete new SVG.\n\n\`\`\`svg\n${base}\n\`\`\``
    : `Draw this as an SVG: ${prompt}`;
  const started = Date.now();
  const text = model.svgOnly
    ? await foundSvg(model.found, prompt)
    : await runCoder(model, VECTOR_INTRO, user, { maxTokens: model.provider === 'gemini' ? 16384 : 12000 });
  const svg = stripUnsafeSvg(extractSvg(text));
  if (!svg || unsafeSvg(svg)) {
    throw httpError(502, 'The AI didn’t return a usable drawing.', {
      code: 'ai_empty',
      hint: 'Try again, describe it a little differently, or pick another AI model.',
    });
  }
  console.log(`  ✓ AI vector (${model.label}): ${((Date.now() - started) / 1000).toFixed(1)} s · ${(svg.length / 1024).toFixed(0)} kB`);
  return { svg, model: model.id };
}

// A vector drawing joins the gallery as an .svg and goes to Google Drive like an image.
async function handleVectorExport(body) {
  const svg = typeof body.svg === 'string' ? body.svg.trim() : '';
  if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>$/i.test(svg)) throw httpError(400, 'That isn’t an SVG drawing.');
  if (Buffer.byteLength(svg) > MAX_SVG_BYTES) throw httpError(413, 'The drawing is too big (max 4 MB) – simplify it or trace with fewer colors.');
  if (unsafeSvg(svg)) throw httpError(400, 'The drawing contains scripts or external links – they aren’t allowed.');
  const size = v => Math.max(1, Math.min(20000, Math.round(Number(v) || 0)));
  const label = String(body.label || 'Vector').trim().slice(0, 80) || 'Vector';
  const now = new Date();
  const file = await stashImage(Buffer.from(svg), 'image/svg+xml', now, slugify(label) || 'vector');
  const item = {
    id: file.id,
    batchId: file.id,
    batchCreatedAt: now.toISOString(),
    index: 0,
    createdAt: now.toISOString(),
    model: 'vectors',
    prompt: String(body.description || label).slice(0, 2000),
    userPrompt: label,
    style: null,
    styleId: null,
    aspectRatio: 'auto',
    imageSize: null,
    thinkingLevel: null,
    refs: [],
    day: localDay(now),
    name: file.name,
    mimeType: 'image/svg+xml',
    width: size(body.width),
    height: size(body.height),
    bytes: file.bytes,
    cost: null,
    pending: true,
    localPath: file.localPath,
  };
  history.unshift(item);
  await saveHistory();
  scheduleUploads();
  console.log(`  ✓ vector saved: ${label} · ${(file.bytes / 1024).toFixed(0)} kB`);
  return { items: [publicItem(item)] };
}

// ── Video ───────────────────────────────────────────────────────────────────
// Clips come from Gemini Omni Flash (Interactions API: started in the background, then polled). A finished clip is a
// gallery item like an image and goes to Google Drive. Edit projects are timelines of segments that point into clips.
// A segment can be regenerated from the frames around it: the new part starts on the last frame before it and ends on
// the first frame after it (first/last-frame interpolation also works in the EEA, where editing uploaded video doesn't).

const OMNI_MODEL = 'gemini-omni-1.1-flash';
const OMNI_PRICE = { input: 1.5e-6, textOut: 9e-6, videoOut: 17.5e-6 }; // USD per token (Standard tier)
// firstFrame: 'auto' = the model animates a first frame, drawn from the prompt when none is given
const FREE_VIDEO = { provider: 'huggingface', free: true, pricePerSecond: 0, ratios: ['16:9', '9:16'], refs: false };
const VIDEO_MODELS = [{
  id: OMNI_MODEL, label: 'Gemini Omni Flash', provider: 'gemini', ratios: ['16:9', '9:16'], resolutions: ['360p', '720p', '1080p', '4k'],
  minSeconds: 3, maxSeconds: 10, pricePerSecond: 0.10, sound: true, firstFrame: 'optional', lastFrame: true, refs: true,
  desc: 'Google’s video model: text, first/last frame and reference images to video, with sound. About $0.10 per second of 720p (1080p and 4K are upscaled).',
}, {
  id: 'wan-2.2', label: 'Wan 2.2', ...FREE_VIDEO, resolutions: ['480p'], minSeconds: 1, maxSeconds: 5, sound: false, firstFrame: 'auto', lastFrame: true,
  desc: 'Alibaba’s open model – the best free quality. It animates a first frame (drawn for you with FLUX.1 schnell if you don’t pick one) and can move from a first to a last frame. Silent, up to 5 s.',
}, {
  id: 'ltx-2.3', label: 'LTX-2.3', ...FREE_VIDEO, resolutions: ['576p'], minSeconds: 1, maxSeconds: 10, sound: true, firstFrame: 'auto', lastFrame: false,
  desc: 'Lightricks’ open model with sound. It animates a first frame (drawn for you if you don’t pick one). Up to 10 s – long clips use up the free GPU time faster.',
}, {
  id: 'ltx-video', label: 'LTX-Video', ...FREE_VIDEO, resolutions: ['480p'], minSeconds: 1, maxSeconds: 8, sound: false, firstFrame: 'optional', lastFrame: false,
  desc: 'Lightricks’ fast open model, straight from text or from a first frame. Silent, up to 8 s. Lower quality, but quick and light on the free GPU time.',
}];
const VIDEO_MIME_EXT = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
const VIDEO_JOBS_FILE = path.join(DATA_DIR, 'video-jobs.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'video-projects.json');
const VIDEO_POLL_MS = Number(process.env.VIDEO_POLL_MS) || 5000;
const VIDEO_TIMEOUT_MS = 20 * 60 * 1000;
const MAX_VIDEO_UPLOAD = 60 * 1024 * 1024;
const videoJobs = new Map();
let videoProjects = null;

// Duration and size from an MP4's header boxes (mvhd, tkhd, mehd for fragmented files).
function mp4Info(buf) {
  const info = {};
  let timescale = 0;
  // A fragmented file has no length in its header: the fragments of each track are added up instead.
  let track = 0;
  let frag = null;
  const scales = {}, trexDur = {}, ends = {};
  const walk = (start, end) => {
    let off = start;
    while (off + 8 <= end) {
      let size = buf.readUInt32BE(off);
      const type = buf.toString('latin1', off + 4, off + 8);
      let header = 8;
      if (size === 1) { size = Number(buf.readBigUInt64BE(off + 8)); header = 16; } else if (size === 0) size = end - off;
      if (size < header || off + size > end) break;
      const p = off + header;
      if (['moov', 'trak', 'mvex', 'mdia', 'moof'].includes(type)) walk(p, off + size);
      else if (type === 'traf') {
        frag = { track: 0, dur: 0, base: null, sum: 0 };
        walk(p, off + size);
        const t = frag.track;
        ends[t] = Math.max(ends[t] || 0, (frag.base ?? ends[t] ?? 0) + frag.sum);
        frag = null;
      } else if (type === 'mvhd') {
        const v = buf[p];
        timescale = v === 1 ? buf.readUInt32BE(p + 20) : buf.readUInt32BE(p + 12);
        const duration = v === 1 ? Number(buf.readBigUInt64BE(p + 24)) : buf.readUInt32BE(p + 16);
        if (timescale && duration && duration !== 0xffffffff) info.duration = duration / timescale;
      } else if (type === 'mehd' && timescale && !info.duration) {
        const d = buf[p] === 1 ? Number(buf.readBigUInt64BE(p + 4)) : buf.readUInt32BE(p + 4);
        if (d) info.duration = d / timescale;
      } else if (type === 'tkhd') {
        track = buf.readUInt32BE(p + (buf[p] === 1 ? 20 : 12));
        const w = buf.readUInt32BE(off + size - 8) / 65536, h = buf.readUInt32BE(off + size - 4) / 65536;
        if (w && h && !info.width) { info.width = Math.round(w); info.height = Math.round(h); }
      } else if (type === 'mdhd') {
        scales[track] = buf.readUInt32BE(p + (buf[p] === 1 ? 20 : 12));
      } else if (type === 'trex') {
        trexDur[buf.readUInt32BE(p + 4)] = buf.readUInt32BE(p + 12);
      } else if (type === 'tfhd' && frag) {
        const flags = buf.readUInt32BE(p) & 0xffffff;
        frag.track = buf.readUInt32BE(p + 4);
        const q = p + 8 + (flags & 0x01 ? 8 : 0) + (flags & 0x02 ? 4 : 0);
        frag.dur = flags & 0x08 ? buf.readUInt32BE(q) : trexDur[frag.track] || 0;
      } else if (type === 'tfdt' && frag) {
        frag.base = buf[p] === 1 ? Number(buf.readBigUInt64BE(p + 4)) : buf.readUInt32BE(p + 4);
      } else if (type === 'trun' && frag) {
        const flags = buf.readUInt32BE(p) & 0xffffff;
        const count = buf.readUInt32BE(p + 4);
        const q = p + 8 + (flags & 0x01 ? 4 : 0) + (flags & 0x04 ? 4 : 0);
        const step = [0x100, 0x200, 0x400, 0x800].filter(f => flags & f).length * 4;
        if (flags & 0x100) for (let k = 0; k < count; k++) frag.sum += buf.readUInt32BE(q + k * step);
        else frag.sum += count * frag.dur;
      }
      off += size;
    }
  };
  try { walk(0, buf.length); } catch { /* a damaged header – no info then */ }
  if (!info.duration) {
    const seconds = Object.keys(ends).map(t => (scales[t] ? ends[t] / scales[t] : 0));
    if (Math.max(0, ...seconds) > 0) info.duration = Math.max(...seconds);
  }
  if (info.duration) info.duration = Math.round(info.duration * 1000) / 1000;
  return info;
}

const RES_HEIGHT = { '360p': 360, '480p': 480, '576p': 576, '720p': 720, '1080p': 1080, '4k': 2160 };
function videoSize(aspectRatio, resolution) {
  const short = RES_HEIGHT[resolution] || 720;
  const long = Math.round((short * 16) / 9);
  return aspectRatio === '9:16' ? { width: short, height: long } : { width: long, height: short };
}

function publicJob(job) {
  const item = job.itemId ? history.find(i => i.id === job.itemId) : null;
  return {
    id: job.id, status: job.status, error: job.error || undefined, createdAt: job.createdAt, finishedAt: job.finishedAt,
    prompt: job.userPrompt, aspectRatio: job.aspectRatio, resolution: job.resolution, duration: job.duration,
    projectId: job.projectId, segmentId: job.segmentId, itemId: job.itemId, item: item ? publicItem(item) : undefined,
    estimate: job.estimate, model: job.model || OMNI_MODEL, free: job.provider === 'huggingface', stage: job.status === 'running' ? job.stage : undefined,
  };
}

async function saveVideoJobs() {
  const keep = [...videoJobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 60)
    .map(({ timer, abort, ...job }) => job);
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await writeFileSafe(VIDEO_JOBS_FILE, JSON.stringify(keep, null, 1));
}

// Running Gemini jobs are paid for – after a restart their polling resumes. A free Hugging Face run can't be picked up again.
async function loadVideoJobs() {
  try {
    for (const job of JSON.parse(await fsp.readFile(VIDEO_JOBS_FILE, 'utf8'))) {
      videoJobs.set(job.id, job);
      if (job.status !== 'running') continue;
      if (job.provider === 'huggingface') failVideoJob(job, 'Stopped when hombresai restarted – it was free, just start it again.');
      else pollVideoJob(job);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('Couldn’t read the video jobs:', err.message);
  }
}

// A frame for the video model: a refs/… file the browser captured or uploaded, or a gallery image.
async function videoFrame(spec, itemId) {
  let rel = spec && typeof spec === 'object' ? String(spec.path || '') : '';
  if (!rel && itemId) rel = await refFromItem(String(itemId));
  if (!rel) return null;
  if (!/^refs\/[\w.-]+$/.test(rel)) throw httpError(400, 'Invalid frame.');
  const data = await fsp.readFile(path.join(CACHE_DIR, rel)).catch(() => null);
  if (!data) throw httpError(400, 'The frame image is no longer on this computer – capture it again.');
  return { path: rel, data, mimeType: sniffMime(data) };
}

function videoCost(usage, seconds) {
  const out = (usage?.output_tokens_by_modality || []).find(m => /video/i.test(m.modality))?.tokens;
  if (usage && (usage.total_input_tokens || usage.total_output_tokens)) {
    const video = out ?? usage.total_output_tokens ?? 0;
    const text = Math.max(0, (usage.total_output_tokens || 0) - video);
    return (usage.total_input_tokens || 0) * OMNI_PRICE.input + video * OMNI_PRICE.videoOut + text * OMNI_PRICE.textOut;
  }
  return seconds ? seconds * VIDEO_MODELS[0].pricePerSecond : null;
}

// ── Free open video models: Hugging Face Spaces on ZeroGPU ──
// Wan 2.2, LTX-2.3 and LTX-Video (plus FLUX.1 schnell for first frames) run as public Gradio apps on Hugging Face's
// shared GPUs. Each caller has a daily GPU-time allowance: 2 minutes without an account, 5 with a free account's token.
// The Gradio HTTP API: upload the frames, start a call, then read the call's event stream until it completes.

const HF_SPACES_BASE = (process.env.HF_SPACES_BASE || '').replace(/\/+$/, '');
const HF_API_BASE = (process.env.HF_API_BASE || 'https://huggingface.co').replace(/\/+$/, '');
const HF_TIMEOUT_MS = 15 * 60 * 1000;
const hfHost = s => (HF_SPACES_BASE ? `${HF_SPACES_BASE}/${s.host}` : `https://${s.host}.hf.space`);
const hfHeaders = () => (config.hfToken ? { Authorization: `Bearer ${config.hfToken}` } : {});

// The inputs are matched by name against the Space's own API description, so a Space that adds or reorders inputs
// keeps working; whatever isn't set here keeps the Space's default.
const HF_SPACES = {
  flux: { repo: 'black-forest-labs/FLUX.1-schnell', host: 'black-forest-labs-flux-1-schnell', api: 'infer', title: 'FLUX.1 schnell' },
  wan: { repo: 'zerogpu-aoti/wan2-2-fp8da-aoti-faster', host: 'zerogpu-aoti-wan2-2-fp8da-aoti-faster', api: 'generate_video', title: 'Wan 2.2' },
  wanFlf: { repo: 'multimodalart/wan-2-2-first-last-frame', host: 'multimodalart-wan-2-2-first-last-frame', api: 'generate_video', title: 'Wan 2.2 (first and last frame)' },
  ltx2: { repo: 'Lightricks/LTX-2-3', host: 'lightricks-ltx-2-3', api: 'generate_video', title: 'LTX-2.3' },
  ltxText: { repo: 'Lightricks/ltx-video-distilled', host: 'lightricks-ltx-video-distilled', api: 'text_to_video', title: 'LTX-Video' },
  ltxImage: { repo: 'Lightricks/ltx-video-distilled', host: 'lightricks-ltx-video-distilled', api: 'image_to_video', title: 'LTX-Video' },
  // the open image models – used when Pollinations (and Cloudflare) can't serve them; Qwen-Image only runs here
  zimage: { repo: 'Tongyi-MAI/Z-Image-Turbo', host: 'tongyi-mai-z-image-turbo', api: 'generate', title: 'Z-Image Turbo' },
  klein: { repo: 'black-forest-labs/FLUX.2-klein-4B', host: 'black-forest-labs-flux-2-klein-4b', api: 'infer', title: 'FLUX.2 klein' },
  qwenImage: { repo: 'Qwen/Qwen-Image', host: 'qwen-qwen-image', api: 'infer', title: 'Qwen-Image' },
};
const FREE_SIZES = {
  frame: { '16:9': [1024, 576], '9:16': [576, 1024] },
  'ltx-2.3': { '16:9': [1024, 576], '9:16': [576, 1024] },
  'ltx-video': { '16:9': [832, 480], '9:16': [480, 832] },
};

async function verifyHfToken(token) {
  let res;
  try {
    res = await httpRequest('GET', `${HF_API_BASE}/api/whoami-v2`, { headers: { Authorization: `Bearer ${token}` }, timeoutMs: 20000 });
  } catch (err) {
    throw httpError(502, `Couldn’t reach Hugging Face (${err.code || err.message}).`, { code: 'network' });
  }
  if (res.status === 200 && res.json?.name) return { user: res.json.name, checkedAt: new Date().toISOString() };
  if (res.status === 401 || res.status === 403) {
    throw httpError(400, 'Hugging Face doesn’t accept this token.', { code: 'hf_token', hint: 'Create a new token of the type “Read” and copy it whole.' });
  }
  throw httpError(502, `Hugging Face didn’t confirm the token (HTTP ${res.status}).`, { code: 'server', retryable: true });
}

const hfInfoCache = new Map();
const hfUnavailable = (s, status) => httpError(503, `The free ${s.title} app on Hugging Face isn’t available right now (HTTP ${status}) – it may be starting up or paused.`, {
  code: 'hf_unavailable', retryable: true, hint: `Try again in a minute or pick another model. huggingface.co/spaces/${s.repo}`,
});

// The app's API description (inputs by name) and its config (which queue function serves which API name).
async function hfApiInfo(s) {
  const hit = hfInfoCache.get(s.host);
  if (hit && Date.now() - hit.at < 60 * 60 * 1000) return hit.info;
  let info, cfg;
  try {
    [info, cfg] = await Promise.all([
      httpRequest('GET', `${hfHost(s)}/gradio_api/info`, { headers: hfHeaders(), timeoutMs: 60000 }),
      httpRequest('GET', `${hfHost(s)}/config`, { headers: hfHeaders(), timeoutMs: 60000 }),
    ]);
  } catch (err) {
    throw httpError(502, `Couldn’t reach Hugging Face (${err.code || err.message}).`, { code: 'network', retryable: true });
  }
  if (info.status !== 200 || !info.json?.named_endpoints) throw hfUnavailable(s, info.status);
  if (cfg.status !== 200 || !Array.isArray(cfg.json?.dependencies)) throw hfUnavailable(s, cfg.status);
  const components = (cfg.json.components || []).map(c => ({ id: c.id, type: c.type, props: { label: c.props?.label, minimum: c.props?.minimum, maximum: c.props?.maximum, step: c.props?.step, value: c.props?.value, choices: c.props?.choices, max_length: c.props?.max_length } }));
  const result = { ...info.json, dependencies: cfg.json.dependencies, components };
  hfInfoCache.set(s.host, { at: Date.now(), info: result });
  return result;
}

async function hfUpload(s, file) {
  const ext = EXT_BY_MIME[file.mimeType] || 'png';
  const { body, contentType } = multipartBody({}, [{ field: 'files', filename: `frame.${ext}`, mimeType: file.mimeType, data: file.data }]);
  const res = await httpRequest('POST', `${hfHost(s)}/gradio_api/upload`, { headers: { ...hfHeaders(), 'Content-Type': contentType }, raw: body, timeoutMs: 120000 });
  const uploaded = Array.isArray(res.json) ? res.json[0] : null;
  if (res.status !== 200 || typeof uploaded !== 'string') throw httpError(502, `Couldn’t send the frame to Hugging Face (HTTP ${res.status}).`, { code: 'hf_run', retryable: true });
  return { path: uploaded, orig_name: `frame.${ext}`, mime_type: file.mimeType, size: file.data.length, meta: { _type: 'gradio.FileData' } };
}

function hfRunError(s, payload) {
  const msg = String((typeof payload === 'string' ? payload : payload?.message || payload?.error) || '').replace(/\s+/g, ' ').trim();
  if (/quota/i.test(msg)) {
    // e.g. “You have exceeded your ZeroGPU quota (90s requested vs. 0s left). Try again in 3:12:05.”
    const wait = /try again in ([\d:]+)/i.exec(msg)?.[1];
    const ask = /\((\d+)s requested vs\.? (\d+)s left\)/i.exec(msg);
    const back = wait && /[1-9]/.test(wait) ? ` – it comes back in ${wait.replace(/^0:/, '')} (h:mm:ss)` : ' for now';
    noteHfQuota(wait, ask ? Number(ask[2]) : null);
    return httpError(429, `The free GPU time on Hugging Face is used up${back}.${ask ? ` ${s.title} books ${ask[1]} s per run, ${ask[2]} s are left.` : ''}`, {
      code: 'hf_quota', detail: msg.slice(0, 300),
      hint: config.hfToken
        ? 'A free account has 5 minutes a day. For images, a free Cloudflare account (Settings) gives about 100 a day.'
        : 'Without an account it’s 2 minutes a day: a free Hugging Face token in Settings gives 5. For images, a free Cloudflare account (Settings) gives about 100 a day.',
    });
  }
  if (/no gpu|gpu task aborted|zerogpu|worker|timed? ?out/i.test(msg)) {
    return httpError(503, `Hugging Face had no free GPU for ${s.title} just now – try again in a minute.`, { code: 'hf_busy', detail: msg.slice(0, 300), retryable: true });
  }
  return httpError(502, msg ? `${s.title} failed: ${msg.slice(0, 300)}` : `${s.title} failed without saying why – try again or pick another model.`, { code: 'hf_run', retryable: true });
}

// Joins the app's queue (the protocol the official Gradio client uses – unlike the simpler /call API it tells why a
// run failed, e.g. the used-up GPU time) and reads the session's event stream until the run completes.
async function hfCall(s, info, data, signal, onProgress) {
  const host = hfHost(s);
  const fnIndex = info.dependencies.findIndex(d => d.api_name === s.api);
  if (fnIndex < 0) throw httpError(502, `The ${s.title} app on Hugging Face has changed – hombresai needs an update for it.`, { code: 'hf_api' });
  const session = crypto.randomBytes(8).toString('hex');
  const join = await httpRequest('POST', `${host}/gradio_api/queue/join`, {
    headers: hfHeaders(), timeoutMs: 60000,
    body: { data, fn_index: fnIndex, trigger_id: info.dependencies[fnIndex].targets?.[0]?.[0] ?? null, session_hash: session, event_data: null },
  });
  if (join.status !== 200 || !join.json?.event_id) {
    hfInfoCache.delete(s.host); // asked again next time – the app may have restarted or changed
    if ([404, 502, 503, 504].includes(join.status)) throw hfUnavailable(s, join.status);
    throw hfRunError(s, join.json?.detail || join.json?.error || `HTTP ${join.status}`);
  }
  const res = await fetch(`${host}/gradio_api/queue/data?session_hash=${session}`, { headers: { ...hfHeaders(), Accept: 'text/event-stream' }, signal });
  if (!res.ok || !res.body) throw hfRunError(s, `HTTP ${res.status}`);
  const decoder = new TextDecoder();
  let buf = '';
  for await (const chunk of res.body) {
    buf = (buf + decoder.decode(chunk, { stream: true })).replace(/\r\n/g, '\n');
    let end;
    while ((end = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, end);
      buf = buf.slice(end + 2);
      const raw = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('\n');
      let msg;
      try { msg = JSON.parse(raw); } catch { continue; }
      if (msg.msg === 'estimation') onProgress?.({ rank: msg.rank, eta: msg.rank_eta });
      else if (msg.msg === 'process_starts') onProgress?.({ started: true });
      else if (msg.msg === 'process_completed') {
        if (msg.success && msg.output?.data) { if (hfQuotaUntil) { hfQuotaUntil = 0; saveFreeLimits(); } return msg.output.data; }
        throw hfRunError(s, msg.output?.error || msg.title || null);
      } else if (msg.msg === 'unexpected_error') throw hfRunError(s, msg.message || null);
    }
  }
  throw httpError(502, 'Hugging Face closed the connection before the result was ready – try again.', { code: 'hf_run', retryable: true });
}

async function hfRun(key, values, signal, onProgress) {
  const s = HF_SPACES[key];
  const info = await hfApiInfo(s);
  const ep = info.named_endpoints[`/${s.api}`];
  if (!ep) throw httpError(502, `The ${s.title} app on Hugging Face has changed – hombresai needs an update for it.`, { code: 'hf_api' });
  const files = {};
  for (const [name, v] of Object.entries(values)) {
    if (v?.data && v.mimeType) files[name] = await hfUpload(s, v);
    // a Gallery input: a list of images
    else if (Array.isArray(v) && v.length && v.every(f => f?.data)) files[name] = await Promise.all(v.map(async f => ({ image: await hfUpload(s, f), caption: null })));
  }
  const data = ep.parameters.map(p => {
    const name = p.parameter_name;
    if (Object.hasOwn(values, name)) return files[name] || values[name];
    if (p.parameter_has_default) return p.parameter_default;
    throw httpError(502, `The ${s.title} app on Hugging Face now needs “${name}” – hombresai needs an update for it.`, { code: 'hf_api' });
  });
  return hfCall(s, info, data, signal, onProgress);
}

// Downloads a result file; the token only goes to the Space itself.
async function hfDownload(key, out) {
  const s = HF_SPACES[key];
  const first = Array.isArray(out) ? out[0] : out; // a Gallery output is a list
  const file = first?.video || first?.image || first;
  const url = file?.url || (file?.path ? `${hfHost(s)}/gradio_api/file=${file.path}` : null);
  if (!url || !/^https?:\/\//.test(url)) throw httpError(502, `${s.title} finished without a file.`, { code: 'hf_run', retryable: true });
  const own = new URL(url).host === new URL(hfHost(s)).host;
  const res = await httpRequest('GET', url, { headers: own ? hfHeaders() : {}, binary: true, timeoutMs: 300000 });
  if (res.status !== 200) throw httpError(502, `Couldn’t download the result from Hugging Face (HTTP ${res.status}).`, { code: 'hf_run', retryable: true });
  const type = String(file.mime_type || res.headers['content-type'] || '').split(';')[0];
  return { data: res.buffer, mimeType: type || (/\.webm$/i.test(url) ? 'video/webm' : 'video/mp4') };
}

// A first frame for the models that animate one: FLUX.1 schnell draws it from the prompt.
async function hfFirstFrame(job, signal) {
  const [width, height] = FREE_SIZES.frame[job.aspectRatio] || FREE_SIZES.frame['16:9'];
  const out = await hfRun('flux', { prompt: `Opening frame of a film shot: ${job.prompt}`.slice(0, 1200), width, height, randomize_seed: true }, signal);
  const img = await hfDownload('flux', out?.[0]);
  const ref = await handleRefUpload({ mimeType: sniffMime(img.data), data: img.data.toString('base64') });
  return videoFrame({ path: ref.path });
}

// The open image models on Hugging Face's free GPUs. Sizes follow each app's own limits.
const HF_IMAGE_SPACE = { 'os-z-image-turbo': 'zimage', 'os-flux2-klein': 'klein', 'os-flux1-schnell': 'flux', 'os-qwen-image': 'qwenImage' };
const fitSize = ([w, h], max, step) => {
  const k = Math.min(1, max / Math.max(w, h));
  return [w, h].map(v => Math.max(256, Math.min(max, Math.round((v * k) / step) * step)));
};
// the choice (“1280x720 ( 16:9 )”, “16:9”…) whose shape is closest to the asked one
function closestChoice(info, s, param, [w, h], { maxPixels = Infinity } = {}) {
  const p = info.named_endpoints[`/${s.api}`]?.parameters.find(x => x.parameter_name === param);
  const choices = [...String(p?.python_type?.type || '').matchAll(/'([^']+)'/g)].map(m => m[1]);
  const shape = c => { const m = /(\d+)\s*[x:]\s*(\d+)/.exec(c); return m ? [Number(m[1]), Number(m[2])] : null; };
  const fits = choices.filter(c => shape(c) && shape(c)[0] * shape(c)[1] <= maxPixels);
  const pool = fits.length ? fits : choices.filter(shape);
  if (!pool.length) return p?.parameter_default;
  const dist = c => Math.abs(Math.log((shape(c)[0] / shape(c)[1]) / (w / h)));
  return pool.reduce((best, c) => (dist(c) < dist(best) ? c : best));
}

async function hfImageGenerate(meta, prompt, refs, aspectRatio) {
  const key = HF_IMAGE_SPACE[meta.id];
  const s = HF_SPACES[key];
  const files = key === 'klein' ? await loadRefFiles(refs, meta.maxRefs || 4) : [];
  const size = sizeFor(aspectRatio, files[0]?.dims);
  let values;
  if (key === 'zimage') {
    const info = await hfApiInfo(s);
    values = { prompt, resolution: closestChoice(info, s, 'resolution', size, { maxPixels: 1.1e6 }), random_seed: true };
  } else if (key === 'qwenImage') {
    const info = await hfApiInfo(s);
    values = { prompt, aspect_ratio: closestChoice(info, s, 'aspect_ratio', size), randomize_seed: true, prompt_enhance: false, num_inference_steps: 30 };
  } else if (key === 'klein') {
    const [width, height] = fitSize(size, 1024, 8);
    values = { prompt: [...files.map(refLabel), '', prompt].join('\n').trim(), input_images: files, width, height, randomize_seed: true };
  } else {
    const [width, height] = fitSize(size, 2048, 32);
    values = { prompt, width, height, randomize_seed: true };
  }
  const out = await hfRun(key, values);
  const img = await hfDownload(key, out?.[0]);
  const mimeType = /^image\//.test(img.mimeType) ? img.mimeType : sniffMime(img.data);
  return { images: [{ mimeType, data: img.data.toString('base64') }], text: '', usageMetadata: null, via: 'huggingface' };
}

// The open models read plain prose – the XML/JSON/Markdown copy of a node specification only adds noise for them.
const plainPrompt = prompt => prompt.split(/\n\n(?:Shot|Video) specification – follow every value exactly/)[0].trim();
const openVideoPrompt = prompt => plainPrompt(prompt).slice(0, 1500);

// ── Free open-source models found online (scripts/free-models.js) ───────────
// The finder looks at Hugging Face, Pollinations and Cloudflare for open-source models that run for free and sorts
// them into image, video and code models. Image ones join the model menu (and “Best free (auto)”), code ones join the
// AI coders for effects and SVG. The list is kept in .hombresai/free-models.json and searched again once a day.

const FreeModels = require('./scripts/free-models.js');
const FREE_MODELS_FILE = path.join(DATA_DIR, 'free-models.json');
const FREE_MODELS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const FREE_AUTO_MODEL = {
  id: 'free-auto',
  label: 'Best free (auto)',
  provider: 'free',
  open: true,
  auto: true,
  group: 'open',
  tag: 'Auto',
  free: true,
  desc: 'Tries the best free open-source models one after another until one works – the built-in ones and the ones found online, best first. The gallery shows which model made each image. With references it uses FLUX.2 klein.',
  refs: true,
  maxRefs: 4,
  refsHint: 'up to 4 references (FLUX.2 klein)',
  ratios: RATIOS_STD,
  sizes: [],
  thinking: null,
  price: null,
  nodes: false,
};
let freeCatalog = null;
let freeSearch = null;      // the search that's running
let freeSearchError = null; // why the last one failed

// ── Which free models can run right now ─────────────────────────────────────
// The menus show only these: a model whose only free place is used up (Hugging Face's GPU time, no pollen, today's
// Cloudflare allowance) is hidden until it comes back, instead of failing when you click Generate.
let hfQuotaUntil = 0;   // Hugging Face's free GPU time is used up until then
let cfQuotaUntil = 0;   // today's free Cloudflare allowance is used up until midnight UTC
let pollenBalance = null;
let pollenCheckedAt = 0;

function noteHfQuota(wait, left) {
  if (left != null && left >= 30) return; // some time is left – smaller runs still fit
  const [h = 0, m = 0, sec = 0] = String(wait || '').split(':').map(Number).reverse().concat([0, 0, 0]).slice(0, 3).reverse();
  const ms = ((h * 60 + m) * 60 + sec) * 1000;
  hfQuotaUntil = Date.now() + (ms > 0 ? ms : 60 * 60 * 1000); // HF doesn't always say when – try again in an hour
  saveFreeLimits();
}

// kept with the models' health, so a restart doesn't forget a used-up allowance
function saveFreeLimits() {
  freeHealth._limits = { hf: hfQuotaUntil, cf: cfQuotaUntil };
  saveFreeHealth();
}

function notePollen(balance) {
  pollenBalance = balance;
  pollenCheckedAt = Date.now();
}

// the pollen left, asked again every 15 minutes (in the background)
function checkPollen() {
  if (!config.pollinationsKey || Date.now() - pollenCheckedAt < 15 * 60 * 1000) return;
  pollenCheckedAt = Date.now();
  httpRequest('GET', `${POLLINATIONS_BASE}/account/balance`, { headers: { Authorization: `Bearer ${config.pollinationsKey}` }, timeoutMs: 15000 })
    .then(res => { if (res.status === 200 && Number.isFinite(res.json?.balance)) pollenBalance = res.json.balance; })
    .catch(() => {});
}

function pollinationsUp() {
  if (!config.pollinationsKey || Date.now() < pollinationsPausedUntil) return false;
  const balance = pollenBalance ?? config.pollinationsInfo?.balance;
  return !(Number.isFinite(balance) && balance <= 0);
}

function freeRoutesNow() {
  return {
    pollinations: pollinationsUp(),
    cloudflare: hasCloudflare() && Date.now() > cfQuotaUntil,
    huggingface: Date.now() > hfQuotaUntil,
  };
}

// Paid Gemini models are always available; a free model needs one of its places to be up.
function availableNow(m, r = freeRoutesNow()) {
  if (m.provider === 'gemini') return true;
  if (m.auto) return r.pollinations || r.cloudflare || r.huggingface;
  const e = m.found;
  if (e) return e.provider === 'pollinations' ? r.pollinations || (e.kind === 'code' && r.cloudflare) : e.provider === 'cloudflare' ? r.cloudflare : r.huggingface;
  if (m.hfOnly || m.provider === 'huggingface') return r.huggingface;
  if (m.provider === 'pollinations' && !m.open) return r.pollinations || r.cloudflare; // the AI coders: Cloudflare takes over
  return r.pollinations || r.cloudflare || r.huggingface; // the built-in open image models try all three
}

// Why free models are hidden, for the note in the menus.
function freeStatusNow() {
  checkPollen();
  const r = freeRoutesNow();
  return {
    huggingface: { ok: r.huggingface, until: r.huggingface ? null : new Date(hfQuotaUntil).toISOString() },
    pollinations: { ok: r.pollinations, reason: r.pollinations ? null : !config.pollinationsKey ? 'no key' : 'no pollen' },
    cloudflare: { ok: r.cloudflare, reason: r.cloudflare ? null : !hasCloudflare() ? 'not connected' : 'used up today', until: hasCloudflare() && !r.cloudflare ? new Date(cfQuotaUntil).toISOString() : null },
  };
}

async function loadFreeModels() {
  try {
    const c = JSON.parse(await fsp.readFile(FREE_MODELS_FILE, 'utf8'));
    if (c?.version === FreeModels.VERSION && FreeModels.KINDS.every(k => Array.isArray(c[k]))) freeCatalog = c;
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('Couldn’t read the list of free models:', err.message);
  }
  await loadFreeHealth();
}

// A new search when the list is missing or older than a day – in the background, a little after the start.
function scheduleFreeModels() {
  if (process.env.FREE_MODELS_AUTO === '0') return;
  const check = () => {
    const age = freeCatalog ? Date.now() - Date.parse(freeCatalog.updatedAt) : Infinity;
    if (!(age < FREE_MODELS_MAX_AGE_MS)) refreshFreeModels();
  };
  setTimeout(check, 15000).unref();
  setInterval(check, 60 * 60 * 1000).unref();
}

// Searches again (one search at a time). A failed search keeps the old list.
function refreshFreeModels({ wait = false } = {}) {
  if (!freeSearch) {
    freeSearch = (async () => {
      try {
        const c = await FreeModels.discover({ hfToken: config.hfToken || '', cloudflare: hasCloudflare() ? config.cloudflare : null });
        await fsp.mkdir(DATA_DIR, { recursive: true });
        await writeFileSafe(FREE_MODELS_FILE, JSON.stringify(c, null, 1));
        freeCatalog = c;
        freeSearchError = null;
        modelCache = null;
        console.log(`  ✓ Free models found: ${c.counts.image} image, ${c.counts.video} video, ${c.counts.code} code`);
        if (process.env.FREE_MODELS_TEST === '1') testNewFreeModels();
      } catch (err) {
        freeSearchError = err.message;
        console.log(`  ! Free models: ${err.message}`);
      } finally {
        freeSearch = null;
      }
    })();
  }
  const run = freeSearch;
  return wait ? run.then(() => freeModelsStatus()) : Promise.resolve(freeModelsStatus());
}

// The app's own model for a found entry, when it has one built in (with its own routing and backups).
function builtInFor(e) {
  const builtInHost = host => Object.values(HF_SPACES).some(s => !s.found && s.host === host);
  if (e.kind === 'image') {
    if (e.provider === 'pollinations') return OPEN_MODELS.find(m => m.apiModel === e.apiModel) || null;
    return OPEN_MODELS.find(m => HF_SPACES[HF_IMAGE_SPACE[m.id]]?.host === e.host) || null;
  }
  if (e.kind === 'video') return e.provider === 'huggingface' && builtInHost(e.host) ? VIDEO_MODELS.find(m => m.free) : null;
  if (e.kind === 'code') return CODER_MODELS.find(m => m.id === e.apiModel) || (e.provider === 'cloudflare' && e.apiModel === CF_CODER ? CODER_MODELS[0] : null);
  return null;
}

function freeImageModels() {
  return (freeCatalog?.image || []).filter(e => ['huggingface', 'pollinations'].includes(e.provider) && !builtInFor(e) && freeState(e) !== 'broken').map(e => ({
    id: e.id,
    label: e.label,
    provider: e.provider,
    open: true,
    group: 'found',
    tag: 'Found free',
    free: true,
    found: e,
    state: e.provider === 'huggingface' ? freeState(e) : 'pollen',
    where: FreeModels.whereLabel(e),
    desc: `${e.model} (${e.licenseNote || e.license}), found by the free-model search. ${e.provider === 'pollinations'
      ? 'Runs on Pollinations and needs pollen.'
      : `Runs free on Hugging Face in ${e.space}${e.alternates?.length ? ` (backup: ${e.alternates.map(a => a.space).join(', ')})` : ''} and uses the daily free GPU time.`} Text only – no references.`,
    refs: false,
    refsHint: 'no references – text only',
    ratios: RATIOS_STD,
    sizes: [],
    thinking: null,
    price: null,
    nodes: false,
  })).sort((a, b) => (a.state === 'works' ? 0 : 1) - (b.state === 'works' ? 0 : 1));
}

function freeModelMeta(id) {
  if (id === FREE_AUTO_MODEL.id) return FREE_AUTO_MODEL;
  return freeImageModels().find(m => m.id === id) || null;
}

async function freeGenerate(meta, prompt, refs, aspectRatio) {
  prompt = plainPrompt(prompt); // the open models read prose – a node graph's XML/JSON/Markdown copy only adds noise
  if (meta.auto) return freeAutoGenerate(prompt, refs, aspectRatio);
  if (!meta.found) return openGenerate(meta, prompt, refs, aspectRatio);
  if (refs.length) throw httpError(400, `${meta.label} can’t use reference images – pick FLUX.2 klein or a Gemini model.`);
  const e = meta.found;
  if (e.provider === 'pollinations') return pollinationsGenerate({ ...meta, apiModel: e.apiModel }, plainPrompt(prompt), [], aspectRatio);
  const { key, plan, out } = await foundRun(e, 'image', { prompt: plainPrompt(prompt), aspectRatio: aspectRatio || '1:1' });
  const img = await hfDownload(key, out?.[plan.outputIndex]);
  const mimeType = /^image\//.test(img.mimeType) ? img.mimeType : sniffMime(img.data);
  return { images: [{ mimeType, data: img.data.toString('base64') }], text: '', usageMetadata: null, via: 'huggingface' };
}

// Calls a found Hugging Face app; when it's down or has changed, its backup apps take over.
async function foundRun(e, kind, input, { signal, onProgress } = {}) {
  const places = [{ space: e.space, host: e.host }, ...(e.alternates || [])];
  let last;
  for (const [i, place] of places.entries()) {
    const key = `found:${place.host}`;
    HF_SPACES[key] ||= { repo: place.space, host: place.host, api: e.api, title: e.label, found: true };
    const s = HF_SPACES[key];
    try {
      const info = await hfApiInfo(s);
      // the app is read again each time, so a changed app is still called the right way
      let plan = FreeModels.analyzeSpace(info, info, kind);
      if (!plan) throw httpError(502, `The free ${e.label} app on Hugging Face has changed – search for free models again in Settings.`, { code: 'hf_api' });
      // a video app with a separate function for a first frame
      if (input.image && plan.input === 'text' && plan.imageApi) plan = FreeModels.analyzeSpace(info, info, kind, plan.imageApi) || plan;
      s.api = plan.api;
      const out = await hfRun(key, FreeModels.fillValues(plan, input), signal, onProgress);
      noteFree(e, null);
      return { key, plan, out };
    } catch (err) {
      last = err;
      // the free GPU time is the same in every app – only an app that's down or changed has a backup worth trying
      if (i === places.length - 1 || !['hf_unavailable', 'hf_api', 'hf_busy', 'network'].includes(err.info?.code)) break;
      console.log(`  ! ${place.space}: ${err.info?.message || err.message} → ${places[i + 1].space}`);
    }
  }
  noteFree(e, last);
  throw last;
}

// ── Does each found model really work? Learnt from every run (and a small test of each new image model). ──
const FREE_HEALTH_FILE = path.join(DATA_DIR, 'free-models-health.json');
const FREE_BROKEN_CODES = new Set(['hf_api', 'hf_run', 'hf_unavailable']); // not: used-up GPU time, a busy GPU, the network
const FREE_BROKEN_DAYS = 3; // a broken model gets another chance after this
let freeHealth = {};
let freeHealthSave = null;
let freeTesting = false;

async function loadFreeHealth() {
  try { freeHealth = JSON.parse(await fsp.readFile(FREE_HEALTH_FILE, 'utf8')) || {}; } catch { freeHealth = {}; }
  hfQuotaUntil = Number(freeHealth._limits?.hf) || 0;
  cfQuotaUntil = Number(freeHealth._limits?.cf) || 0;
}

function noteFree(e, err) {
  const h = freeHealth[e.id] ||= { strikes: 0 };
  if (!err) Object.assign(h, { ok: new Date().toISOString(), strikes: 0, error: undefined });
  else if (FREE_BROKEN_CODES.has(err.info?.code)) Object.assign(h, { fail: new Date().toISOString(), strikes: (h.strikes || 0) + 1, error: String(err.info?.message || err.message).slice(0, 200) });
  else return;
  saveFreeHealth();
}

function saveFreeHealth() {
  clearTimeout(freeHealthSave);
  freeHealthSave = setTimeout(() => writeFileSafe(FREE_HEALTH_FILE, JSON.stringify(freeHealth, null, 1)).catch(() => {}), 500);
}

// 'works' (made something), 'broken' (failed twice in a row lately – left out of the menus), 'untested'
function freeState(e) {
  const h = freeHealth[e.id];
  if (!h) return 'untested';
  if (h.strikes >= 2 && Date.now() - Date.parse(h.fail) < FREE_BROKEN_DAYS * 86400000) return 'broken';
  return h.ok ? 'works' : 'untested';
}

// Test pictures of the new image models (only with FREE_MODELS_TEST=1): each run books 60–90 s of the shared free GPU
// time – most of the 2 minutes a day without an account – so normally a model is judged by its first real picture.
async function testNewFreeModels() {
  if (freeTesting) return;
  freeTesting = true;
  try {
    for (const m of freeImageModels().filter(x => x.found.provider === 'huggingface' && freeState(x.found) === 'untested').slice(0, 3)) {
      try {
        await foundRun(m.found, 'image', { prompt: 'A red apple on a wooden table, soft daylight', aspectRatio: '1:1', area: 512 * 512 });
        console.log(`  ✓ Free model works: ${m.label}`);
      } catch (err) {
        console.log(`  ! Free model test – ${m.label}: ${String(err.info?.message || err.message).slice(0, 120)}`);
        if (err.info?.code === 'hf_quota') break;
      }
    }
  } finally {
    freeTesting = false;
  }
}

// Found video models, for the Video view: same call as the image ones, with the first frame and length when the app takes them.
function freeVideoModels() {
  return (freeCatalog?.video || []).filter(e => e.provider === 'huggingface' && !builtInFor(e) && freeState(e) !== 'broken').map(e => {
    const d = e.duration;
    const takesFrame = e.input !== 'text' || Boolean(e.imageApi);
    return {
      id: e.id,
      label: `${e.label} (found)`,
      provider: 'huggingface',
      free: true,
      found: e,
      pricePerSecond: 0,
      ratios: ['16:9', '9:16'],
      resolutions: [e.width ? '480p' : 'app default'],
      minSeconds: d ? Math.max(1, Math.ceil(d.min)) : 2,
      maxSeconds: d ? Math.max(1, Math.min(10, Math.floor(d.max))) : 5,
      sound: false,
      firstFrame: e.input === 'image' ? 'auto' : takesFrame ? 'optional' : false,
      lastFrame: false,
      refs: false,
      nodes: false,
      desc: `${e.model} (${e.licenseNote || e.license}), found by the free-model search. Runs free on Hugging Face in ${e.space} and uses the daily free GPU time.${d ? '' : ' The app decides the length.'}`,
    };
  });
}
const videoModels = () => [...VIDEO_MODELS, ...freeVideoModels()];
const publicVideoModels = () => { const r = freeRoutesNow(); return videoModels().map(m => ({ ...m, availableNow: availableNow(m, r) })).map(({ found, ...m }) => m); };

// “Best free (auto)”: the best free models one after another, until one makes the image.
async function freeAutoGenerate(prompt, refs, aspectRatio) {
  const ranked = [];
  const add = m => { if (m && !ranked.includes(m)) ranked.push(m); };
  if (refs.length) add(OPEN_MODELS.find(m => m.refs));
  else {
    const found = freeImageModels();
    for (const e of freeCatalog?.image || []) add(builtInFor(e) || found.find(m => m.id === e.id));
    OPEN_MODELS.forEach(add);
    ranked.sort((a, b) => (a.found && freeState(a.found) === 'untested' ? 1 : 0) - (b.found && freeState(b.found) === 'untested' ? 1 : 0));
  }
  let last = null;
  let quota = !freeRoutesNow().huggingface;
  let tries = 0;
  for (const m of ranked) {
    if (tries >= 5) break;
    if (m.found?.provider === 'pollinations' && !pollinationsUp()) continue;
    // once the free GPU time is used up, only models that can run elsewhere (Pollinations, Cloudflare) are worth a try
    if (quota && (m.hfOnly || m.found?.zeroGpu || (!m.found && !pollinationsUp() && !hasCloudflare()))) continue;
    tries++;
    try {
      return { ...(await freeGenerate(m, prompt, refs, aspectRatio)), model: m.id };
    } catch (err) {
      last = err;
      if (err.info?.code === 'hf_quota') quota = true;
      console.log(`  ! Best free: ${m.label} – ${String(err.info?.message || err.message).slice(0, 120)}`);
    }
  }
  throw last || httpError(503, 'No free model is available right now – try again later.', { code: 'server', retryable: true });
}

// The AI coders for effects and SVG: the built-in ones, then the found ones (svg: also the SVG-only models).
function coderModels({ svg = false } = {}) {
  const found = (freeCatalog?.code || [])
    .filter(e => (e.role === 'coder' || (svg && e.role === 'svg')) && !builtInFor(e) && (e.provider !== 'cloudflare' || hasCloudflare()) && freeState(e) !== 'broken')
    .map(e => ({
      id: e.id,
      label: e.label,
      provider: e.provider,
      found: e,
      svgOnly: e.role === 'svg',
      note: e.role === 'svg' ? 'found · open source · SVG only · free GPU time'
        : e.provider === 'cloudflare' ? 'found · open source · Cloudflare (free)'
        : 'found · open source · needs pollen',
    }));
  return [...CODER_MODELS, ...found];
}
const publicCoders = list => { const r = freeRoutesNow(); return list.map(m => ({ ...m, availableNow: availableNow(m, r) })).map(({ found, ...m }) => m); };

function runCoder(model, system, user, opts = {}) {
  if (model.provider === 'gemini') return coderGemini(model, system, user, opts);
  if (model.provider === 'cloudflare') {
    if (!hasCloudflare()) throw httpError(400, 'Connect Cloudflare in Settings first.', { code: 'cloudflare_key' });
    return cloudflareChat(system, user, opts.maxTokens || 8000, model.found.apiModel);
  }
  return coderPollinations(model.found ? { ...model, id: model.found.apiModel } : model, system, user, opts);
}

// An SVG-only model on Hugging Face: the description in, SVG code out.
async function foundSvg(e, prompt) {
  const { key, plan, out } = await foundRun(e, 'code', { prompt });
  const v = out?.[plan.outputIndex];
  if (typeof v === 'string') return v;
  if (v?.url || v?.path) return (await hfDownload(key, v)).data.toString('utf8');
  return '';
}

function freeModelsStatus() {
  const c = freeCatalog;
  const inMenus = new Set([...freeImageModels(), ...freeVideoModels(), ...coderModels({ svg: true })].map(m => m.id));
  const row = e => ({
    id: e.id,
    rank: e.rank,
    label: e.label,
    model: e.model,
    license: e.license,
    licenseNote: e.licenseNote || null,
    where: FreeModels.whereLabel(e),
    url: e.space ? `https://huggingface.co/spaces/${e.space}` : `https://huggingface.co/${e.model}`,
    role: e.role || null,
    comfy: Boolean(e.comfy),
    nodes: Boolean(e.nodes),
    state: e.provider === 'huggingface' ? freeState(e) : null,
    error: e.provider === 'huggingface' && freeState(e) === 'broken' ? freeHealth[e.id]?.error || null : null,
    use: inMenus.has(e.id) ? 'menu' : builtInFor(e) ? 'built-in' : e.kind === 'code' && e.provider === 'cloudflare' ? 'connect' : 'list',
  });
  return {
    updatedAt: c?.updatedAt || null,
    searching: Boolean(freeSearch),
    testing: freeTesting,
    error: freeSearchError,
    groups: Object.fromEntries(FreeModels.KINDS.map(k => [k, (c?.[k] || []).map(row)])),
  };
}

function videoModel(id) {
  if (id) {
    const m = videoModels().find(x => x.id === id);
    if (!m) throw httpError(400, `Unknown video model “${id}”.`);
    return m;
  }
  // nothing chosen (Claude, an older page): Omni Flash with a Gemini key, otherwise the free Wan 2.2
  return getApiKey().key ? VIDEO_MODELS[0] : VIDEO_MODELS.find(m => m.id === 'wan-2.2');
}

async function startFreeVideoJob(model, { body, prompt, userPrompt, nodes, aspectRatio, first, last }) {
  if (!model.firstFrame) first = last = null; // a found app that works from text only
  const duration = clamp(Math.round((Number(body.duration) || 4) * 10) / 10, model.minSeconds, model.maxSeconds);
  const now = new Date();
  const job = {
    id: `vj${now.getTime().toString(36)}${crypto.randomBytes(3).toString('hex')}`,
    provider: 'huggingface',
    model: model.id,
    status: 'running',
    stage: 'Starting…',
    createdAt: now.toISOString(),
    userPrompt: userPrompt || prompt.slice(0, 200),
    prompt: openVideoPrompt(prompt),
    aspectRatio, resolution: model.resolutions[0], duration, sound: model.sound,
    frames: { first: first?.path, last: model.lastFrame && first ? last?.path : undefined },
    refs: [],
    nodes,
    projectId: body.projectId ? String(body.projectId).slice(0, 40) : undefined,
    segmentId: body.segmentId ? String(body.segmentId).slice(0, 40) : undefined,
    keepLength: body.keepLength !== false,
    estimate: 0,
  };
  videoJobs.set(job.id, job);
  console.log(`  … free video started (${model.label}, ${aspectRatio}, ~${duration} s${first ? ', with frames' : ''})`);
  runFreeVideoJob(job, first, model.lastFrame && first ? last : null);
  await saveVideoJobs();
  return { job: publicJob(job) };
}

async function runFreeVideoJob(job, first, last) {
  const controller = new AbortController();
  job.abort = () => controller.abort();
  const timer = setTimeout(() => { job.timedOut = true; controller.abort(); }, HF_TIMEOUT_MS);
  const signal = controller.signal;
  const { prompt, duration } = job;
  try {
    const model = videoModels().find(m => m.id === job.model);
    if (!model) throw httpError(400, 'This free video model is no longer in the list – pick another one.', { code: 'bad_request' });
    if (!first && model.firstFrame === 'auto') {
      job.stage = 'Drawing the first frame (FLUX.1 schnell)…';
      first = await hfFirstFrame(job, signal);
      if (job.status !== 'running') return;
      job.frames.first = first.path;
      job.autoFirstFrame = true;
    }
    job.stage = 'Generating on Hugging Face’s free GPU…';
    const progress = p => {
      job.stage = p.started ? 'Generating on Hugging Face’s free GPU…'
        : `In the queue on Hugging Face (position ${(p.rank ?? 0) + 1}${p.eta ? `, about ${Math.max(1, Math.round(p.eta))} s` : ''})…`;
    };
    // a model found by the free-model search: called the way its app describes itself
    if (model.found) {
      const run = await foundRun(model.found, 'video', { prompt, aspectRatio: job.aspectRatio, image: first, duration, area: 832 * 480 }, { signal, onProgress: progress });
      job.stage = 'Downloading the clip…';
      const clip = await hfDownload(run.key, run.out?.[run.plan.outputIndex]);
      if (job.status !== 'running') return;
      await saveVideoItem(job, clip.data, clip.mimeType, { cost: () => 0, via: 'huggingface' });
      return;
    }
    let key, values;
    if (job.model === 'wan-2.2') {
      [key, values] = last
        ? ['wanFlf', { start_image_pil: first, end_image_pil: last, prompt, duration_seconds: Math.min(duration, 5.1), randomize_seed: true }]
        : ['wan', { input_image: first, prompt, duration_seconds: duration, randomize_seed: true }];
    } else if (job.model === 'ltx-2.3') {
      const [width, height] = FREE_SIZES['ltx-2.3'][job.aspectRatio];
      [key, values] = ['ltx2', { input_image: first, prompt, duration, enhance_prompt: false, randomize_seed: true, width, height }];
    } else {
      const [width_ui, height_ui] = FREE_SIZES['ltx-video'][job.aspectRatio];
      [key, values] = [first ? 'ltxImage' : 'ltxText', {
        prompt, mode: first ? 'image-to-video' : 'text-to-video', duration_ui: duration, width_ui, height_ui, randomize_seed: true,
        ...(first ? { input_image_filepath: first } : {}),
      }];
    }
    const out = await hfRun(key, values, signal, p => {
      job.stage = p.started ? 'Generating on Hugging Face’s free GPU…'
        : `In the queue on Hugging Face (position ${(p.rank ?? 0) + 1}${p.eta ? `, about ${Math.max(1, Math.round(p.eta))} s` : ''})…`;
    });
    job.stage = 'Downloading the clip…';
    const video = await hfDownload(key, out?.[0]);
    if (job.status !== 'running') return; // cancelled while it downloaded
    await saveVideoItem(job, video.data, video.mimeType, { cost: () => 0, via: 'huggingface' });
  } catch (err) {
    if (job.status !== 'running') return; // cancelled meanwhile
    if (job.timedOut) failVideoJob(job, 'Hugging Face didn’t finish within 15 minutes – its free GPUs are very busy. Try again later.');
    else if (!err.info && /fetch failed|ECONN|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|socket/i.test(`${err.message} ${err.code || ''} ${err.cause?.code || ''}`)) {
      failVideoJob(job, 'Couldn’t reach Hugging Face – check the internet connection and try again.');
    } else {
      const info = describeError(err);
      failVideoJob(job, [info.message, info.hint].filter(Boolean).join(' '));
    }
  } finally {
    clearTimeout(timer);
    delete job.abort;
    delete job.stage;
  }
}

async function handleVideoGenerate(body) {
  const model = videoModel(body.model);
  const userPrompt = String(body.userPrompt ?? body.prompt ?? '').trim().slice(0, MAX_PROMPT_CHARS);
  let prompt = String(body.prompt || '').trim().slice(0, MAX_PROMPT_CHARS);
  let nodes = cleanNodesMeta(body.nodes);
  if (body.graph) {
    // a node graph by name or id (Claude): its camera, lens, motion, sound… without its own Prompt node
    const graph = await resolveGraph({ name: body.graph });
    const c = NodesCore.compile(graph, { target: null, skip: ['prompt'], only: 'video' });
    prompt = [prompt, c.addition].filter(Boolean).join('\n\n');
    nodes = cleanNodesMeta({ graphId: graph.id, name: graph.name, chips: c.chips });
  }
  if (!prompt) throw httpError(400, 'Describe the video.');
  const aspectRatio = model.ratios.includes(body.aspectRatio) ? body.aspectRatio : '16:9';
  const first = await videoFrame(body.firstFrame, body.firstFrameId);
  const last = await videoFrame(body.lastFrame, body.lastFrameId);
  if (last && !first) throw httpError(400, 'A last frame needs a first frame as well.');
  if (model.free) return startFreeVideoJob(model, { body, prompt, userPrompt, nodes, aspectRatio, first, last });
  const key = requireApiKey();
  const resolution = model.resolutions.includes(body.resolution) ? body.resolution : '720p';
  const duration = clamp(Math.round(Number(body.duration) || 6), 3, 10);
  const sound = body.sound !== false;
  const refs = first ? [] : await loadRefFiles(cleanRefs(body.refs), 3);
  const text = [
    prompt,
    `Length: about ${duration} seconds.`,
    sound ? '' : 'Silent: no audio at all.',
    first && last ? 'The clip starts exactly on the first image (<FIRST_FRAME>) and ends exactly on the second image (<LAST_FRAME>); move between them smoothly.'
      : first ? 'The clip starts exactly on the given image (<FIRST_FRAME>).' : '',
  ].filter(Boolean).join('\n\n');
  const input = [
    ...(first ? [first] : []), ...(last ? [last] : []), ...refs,
  ].map(f => ({ type: 'image', data: f.data.toString('base64'), mime_type: f.mimeType }));
  input.push({ type: 'text', text });
  const request = { model: OMNI_MODEL, input, response_format: { type: 'video', aspect_ratio: aspectRatio, resolution }, background: true, store: true };
  if (first) request.generation_config = { video_config: { task: 'image_to_video' } };
  else if (refs.length) request.generation_config = { video_config: { task: 'reference_to_video' } };
  const started = await gemini('POST', 'interactions', { key, body: request, timeoutMs: 120000 });
  const now = new Date();
  const job = {
    id: `vj${now.getTime().toString(36)}${crypto.randomBytes(3).toString('hex')}`,
    interactionId: started.id,
    provider: 'gemini',
    model: OMNI_MODEL,
    status: 'running',
    createdAt: now.toISOString(),
    userPrompt: userPrompt || prompt.slice(0, 200),
    prompt: text,
    aspectRatio, resolution, duration, sound,
    frames: { first: first?.path, last: last?.path },
    refs: refs.length ? cleanRefs(body.refs).slice(0, 3) : [],
    nodes,
    projectId: body.projectId ? String(body.projectId).slice(0, 40) : undefined,
    segmentId: body.segmentId ? String(body.segmentId).slice(0, 40) : undefined,
    keepLength: body.keepLength !== false,
    estimate: duration * VIDEO_MODELS[0].pricePerSecond,
  };
  videoJobs.set(job.id, job);
  console.log(`  … video started (${resolution}, ${aspectRatio}, ~${duration} s${first ? ', with frames' : ''})`);
  if (started.status === 'completed') await finishVideoJob(job, started);
  else if (['failed', 'cancelled', 'incomplete'].includes(started.status)) failVideoJob(job, interactionError(started));
  else pollVideoJob(job);
  await saveVideoJobs();
  return { job: publicJob(job) };
}

function interactionError(res) {
  const e = Array.isArray(res.errors) ? res.errors[0] : null;
  const msg = e?.message || (res.status === 'cancelled' ? 'The video was cancelled.' : 'Gemini couldn’t make this video.');
  return /safety|blocked|policy/i.test(msg) ? `${msg} – Gemini’s safety filters stopped it; describe it differently.` : msg;
}

function pollVideoJob(job) {
  const tick = async () => {
    if (job.status !== 'running') return;
    if (Date.now() - Date.parse(job.createdAt) > VIDEO_TIMEOUT_MS) { failVideoJob(job, 'Gemini didn’t finish the video within 20 minutes.'); return; }
    try {
      const res = await gemini('GET', `interactions/${encodeURIComponent(job.interactionId)}`, { key: requireApiKey(), timeoutMs: 120000 });
      if (res.status === 'completed') { await finishVideoJob(job, res); return; }
      if (['failed', 'cancelled', 'incomplete'].includes(res.status)) { failVideoJob(job, interactionError(res)); return; }
    } catch (err) {
      const info = describeError(err);
      if (['bad_key', 'billing', 'forbidden', 'region', 'quota'].includes(info.code)) { failVideoJob(job, info.message); return; }
      job.lastError = info.message; // a hiccup – keep polling
    }
    job.timer = setTimeout(tick, VIDEO_POLL_MS);
  };
  job.timer = setTimeout(tick, VIDEO_POLL_MS);
}

function failVideoJob(job, message) {
  job.status = 'error';
  job.error = message;
  job.finishedAt = new Date().toISOString();
  console.log(`  ✗ video: ${message}`);
  saveVideoJobs().catch(() => {});
}

async function finishVideoJob(job, res) {
  const content = (res.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []);
  const video = content.find(c => c.type === 'video');
  if (!video) {
    const said = content.filter(c => c.type === 'text').map(c => c.text).join(' ').slice(0, 300);
    failVideoJob(job, said ? `Gemini answered without a video: “${said}”` : 'Gemini finished without a video.');
    return;
  }
  let buf;
  try {
    if (video.data) buf = Buffer.from(video.data, 'base64');
    else {
      const r = await fetch(video.uri, { headers: { 'x-goog-api-key': requireApiKey() } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      buf = Buffer.from(await r.arrayBuffer());
    }
  } catch (err) {
    failVideoJob(job, `Couldn’t download the video (${err.message}).`);
    return;
  }
  await saveVideoItem(job, buf, video.mime_type, { cost: seconds => videoCost(res.usage, seconds || job.duration), usage: res.usage });
}

// A finished clip joins the gallery (and Google Drive); a regenerated part takes its place in its project.
async function saveVideoItem(job, buf, type, { cost, usage, via } = {}) {
  const mimeType = VIDEO_MIME_EXT[type] ? type : 'video/mp4';
  const info = mimeType === 'video/mp4' ? mp4Info(buf) : {};
  const size = videoSize(job.aspectRatio, job.resolution);
  const now = new Date();
  const file = await stashImage(buf, mimeType, now, slugify(job.userPrompt) || 'video');
  const seconds = info.duration || null;
  const item = {
    id: file.id,
    batchId: job.id,
    batchCreatedAt: job.createdAt,
    index: 0,
    createdAt: now.toISOString(),
    model: job.model || OMNI_MODEL,
    via,
    prompt: job.prompt,
    userPrompt: job.userPrompt,
    style: null,
    styleId: null,
    nodes: job.nodes,
    aspectRatio: job.aspectRatio,
    imageSize: null,
    resolution: via === 'huggingface' && info.height ? `${Math.min(info.width, info.height)}p` : job.resolution,
    thinkingLevel: null,
    refs: [
      job.frames.first && { path: job.frames.first, role: job.autoFirstFrame ? 'first frame (drawn by FLUX.1 schnell)' : 'first frame' },
      job.frames.last && { path: job.frames.last, role: 'last frame' },
      ...(job.refs || []),
    ].filter(Boolean),
    frames: job.frames,
    day: localDay(now),
    name: file.name,
    mimeType,
    width: info.width || size.width,
    height: info.height || size.height,
    duration: seconds,
    bytes: file.bytes,
    durationMs: Date.now() - Date.parse(job.createdAt),
    cost: cost ? cost(seconds) : null,
    usage,
    interactionId: job.interactionId,
    pending: true,
    localPath: file.localPath,
  };
  history.unshift(item);
  await saveHistory();
  scheduleUploads();
  job.status = 'done';
  job.itemId = item.id;
  job.finishedAt = now.toISOString();
  const price = via === 'huggingface' ? 'free' : `≈ ${item.cost != null ? `$${item.cost.toFixed(2)}` : '?'}`;
  console.log(`  ✓ video ${item.width}×${item.height}${seconds ? ` · ${seconds.toFixed(1)} s` : ''} · ${price}`);
  if (job.projectId && job.segmentId) await applyRegeneration(job, item).catch(err => console.warn('Couldn’t update the project:', err.message));
  await saveVideoJobs();
}

function handleVideoJobs() {
  return { jobs: [...videoJobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30).map(publicJob) };
}

function handleVideoJob(id) {
  const job = videoJobs.get(id);
  if (!job) throw httpError(404, 'No such video job.');
  return { job: publicJob(job) };
}

async function handleVideoCancel(id) {
  const job = videoJobs.get(id);
  if (!job) throw httpError(404, 'No such video job.');
  if (job.status === 'running') {
    clearTimeout(job.timer);
    if (job.provider === 'huggingface') job.abort?.();
    else await gemini('POST', `interactions/${encodeURIComponent(job.interactionId)}/cancel`, { key: requireApiKey(), body: {}, timeoutMs: 30000 }).catch(() => {});
    failVideoJob(job, 'Cancelled.');
    job.status = 'cancelled';
    await saveVideoJobs();
  }
  return { job: publicJob(job) };
}

// A clip that was recorded in the browser (the Video editor's export, or an upload) joins the gallery.
async function handleVideoSave(body) {
  const mimeType = VIDEO_MIME_EXT[body.mimeType] ? body.mimeType : null;
  const buf = mimeType && typeof body.data === 'string' ? Buffer.from(body.data, 'base64') : null;
  if (!buf || buf.length < 1000) throw httpError(400, 'That isn’t a valid video.');
  if (buf.length > MAX_VIDEO_UPLOAD) throw httpError(413, 'The video is too big (max 60 MB).');
  const label = String(body.label || 'Edited video').trim().slice(0, 80) || 'Edited video';
  const now = new Date();
  const file = await stashImage(buf, mimeType, now, slugify(label) || 'video');
  const info = mimeType === 'video/mp4' ? mp4Info(buf) : {};
  const num = (v, max) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(max, n) : null; };
  const item = {
    id: file.id, batchId: file.id, batchCreatedAt: now.toISOString(), index: 0, createdAt: now.toISOString(),
    model: 'video-edit', prompt: String(body.description || label).slice(0, 2000), userPrompt: label,
    style: null, styleId: null, aspectRatio: ['16:9', '9:16'].includes(body.aspectRatio) ? body.aspectRatio : 'auto',
    imageSize: null, thinkingLevel: null, refs: [], day: localDay(now), name: file.name, mimeType,
    width: info.width || num(body.width, 8000), height: info.height || num(body.height, 8000),
    duration: info.duration || num(body.duration, 36000), bytes: file.bytes, cost: null,
    projectId: body.projectId ? String(body.projectId).slice(0, 40) : undefined,
    pending: true, localPath: file.localPath,
  };
  history.unshift(item);
  await saveHistory();
  scheduleUploads();
  console.log(`  ✓ video saved: ${label} · ${(file.bytes / 1024 / 1024).toFixed(1)} MB`);
  return { items: [publicItem(item)] };
}

// ── Edit projects (timelines) ──

function cleanSegment(s) {
  const n = v => Math.max(0, Math.round((Number(v) || 0) * 1000) / 1000);
  const seg = {
    id: String(s?.id || `s${crypto.randomBytes(4).toString('hex')}`).slice(0, 40),
    itemId: String(s?.itemId || '').slice(0, 60),
    in: n(s?.in),
    out: n(s?.out),
    label: s?.label ? String(s.label).slice(0, 120) : undefined,
    takes: (Array.isArray(s?.takes) ? s.takes : []).slice(-20).map(t => ({ itemId: String(t.itemId || '').slice(0, 60), in: n(t.in), out: n(t.out), at: String(t.at || '').slice(0, 30) })).filter(t => t.itemId),
    frames: s?.frames && typeof s.frames === 'object'
      ? Object.fromEntries(['first', 'last'].filter(k => /^refs\/[\w.-]+$/.test(s.frames[k] || '')).map(k => [k, s.frames[k]]))
      : undefined,
    regenAt: s?.regenAt ? String(s.regenAt).slice(0, 30) : undefined,
  };
  if (seg.out <= seg.in) seg.out = seg.in + 0.1;
  return seg;
}

function cleanProject(p) {
  return {
    id: String(p?.id || `p${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`).replace(/[^\w-]/g, '').slice(0, 40),
    name: String(p?.name || 'Untitled video').slice(0, 80),
    aspectRatio: p?.aspectRatio === '9:16' ? '9:16' : '16:9',
    segments: (Array.isArray(p?.segments) ? p.segments : []).slice(0, 300).map(cleanSegment).filter(s => s.itemId),
    createdAt: String(p?.createdAt || new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };
}

async function loadProjects() {
  if (videoProjects) return videoProjects;
  videoProjects = new Map();
  try {
    for (const p of JSON.parse(await fsp.readFile(PROJECTS_FILE, 'utf8'))) {
      const clean = cleanProject(p);
      clean.updatedAt = p.updatedAt || clean.updatedAt;
      videoProjects.set(clean.id, clean);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('Couldn’t read the video projects:', err.message);
  }
  return videoProjects;
}

async function saveProjects() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await writeFileSafe(PROJECTS_FILE, JSON.stringify([...videoProjects.values()], null, 1));
}

async function handleProjectsList() {
  const map = await loadProjects();
  return { projects: [...map.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
}

async function handleProjectSave(body) {
  const map = await loadProjects();
  const project = cleanProject(body.project);
  // A part regenerated on the server wins over an older copy of the timeline from the browser
  // (the browser learns the new regenAt when it reloads the project).
  const stored = map.get(project.id);
  let merged = false;
  for (const seg of project.segments) {
    const old = stored?.segments.find(s => s.id === seg.id);
    if (old?.regenAt && old.regenAt !== seg.regenAt) {
      Object.assign(seg, { itemId: old.itemId, in: old.in, out: old.out, takes: old.takes, frames: old.frames, regenAt: old.regenAt });
      merged = true;
    }
  }
  map.set(project.id, project);
  await saveProjects();
  return { project, merged };
}

async function handleProjectDelete(body) {
  const map = await loadProjects();
  if (!map.delete(String(body.id || ''))) throw httpError(404, 'No such project.');
  await saveProjects();
  return { ok: true };
}

async function projectById(id) {
  const map = await loadProjects();
  const p = map.get(String(id || ''));
  if (!p) throw httpError(404, `No video project “${id}”.`);
  return p;
}

const clipLength = item => item?.duration || 8;

// Timeline edits for Claude (the app edits the same projects in the browser).
async function handleProjectEdit(body) {
  const op = String(body.op || '');
  if (op === 'create') {
    return handleProjectSave({ project: { name: body.name || 'Untitled video', aspectRatio: body.aspect_ratio || body.aspectRatio } });
  }
  const p = await projectById(body.project);
  const segIndex = () => {
    const i = p.segments.findIndex(s => s.id === body.segment);
    if (i < 0) throw httpError(404, `No segment “${body.segment}” in this project.`);
    return i;
  };
  if (op === 'add_clip') {
    const item = findItem(String(body.item_id || body.itemId || ''));
    if (!/^video\//.test(item.mimeType || '')) throw httpError(400, 'That item isn’t a video.');
    const seg = cleanSegment({ itemId: item.id, in: 0, out: clipLength(item), label: item.userPrompt });
    const at = Number.isInteger(body.at) ? clamp(body.at, 0, p.segments.length) : p.segments.length;
    p.segments.splice(at, 0, seg);
  } else if (op === 'split') {
    const i = segIndex();
    const s = p.segments[i];
    const cut = s.in + Number(body.at_seconds);
    if (!(cut > s.in + 0.1 && cut < s.out - 0.1)) throw httpError(400, `Split inside the segment: between 0.1 and ${(s.out - s.in - 0.1).toFixed(2)} seconds.`);
    // the left half still starts and the right half still ends on the same frame
    const right = cleanSegment({ ...s, id: undefined, in: cut, takes: [], frames: s.frames?.last ? { last: s.frames.last } : undefined, regenAt: undefined });
    p.segments.splice(i, 1, cleanSegment({ ...s, out: cut, frames: s.frames?.first ? { first: s.frames.first } : undefined }), right);
  } else if (op === 'delete_segment') {
    p.segments.splice(segIndex(), 1);
  } else if (op === 'trim') {
    const i = segIndex();
    const s = p.segments[i];
    const len = clipLength(history.find(it => it.id === s.itemId));
    const inn = clamp(Number(body.in_seconds ?? s.in), 0, len), out = clamp(Number(body.out_seconds ?? s.out), 0, len);
    if (out - inn < 0.1) throw httpError(400, 'A segment must be at least 0.1 s long.');
    p.segments[i] = cleanSegment({ ...s, in: inn, out, frames: undefined });
  } else if (op === 'move') {
    const i = segIndex();
    const [s] = p.segments.splice(i, 1);
    p.segments.splice(clamp(Number(body.to_index) || 0, 0, p.segments.length), 0, s);
  } else throw httpError(400, 'Unknown operation.');
  p.updatedAt = new Date().toISOString();
  await saveProjects();
  return { project: p };
}

// Regenerates a segment: the new clip runs from the frame before it to the frame after it.
async function handleProjectRegenerate(body) {
  const p = await projectById(body.project);
  const i = p.segments.findIndex(s => s.id === body.segment);
  if (i < 0) throw httpError(404, 'No such segment.');
  const seg = p.segments[i], prev = p.segments[i - 1], next = p.segments[i + 1];
  const instruction = String(body.instruction || '').trim();
  if (!instruction) throw httpError(400, 'Say what should happen in this part.');
  const model = videoModel(body.model);
  // before/after: the browser's checkboxes; a model without last frames (LTX) only continues from the part before
  const wantFirst = body.before !== false;
  const wantLast = wantFirst && body.after !== false && model.lastFrame;
  const firstFrame = !wantFirst ? null : body.firstFrame?.path ? body.firstFrame : prev ? { path: prev.frames?.last } : seg.frames?.first ? { path: seg.frames.first } : null;
  const lastFrame = !wantLast ? null : body.lastFrame?.path ? body.lastFrame : next ? { path: next.frames?.first } : null;
  if ((wantFirst && prev && !firstFrame?.path) || (wantLast && next && !lastFrame?.path)) {
    throw httpError(409, 'The frames around this segment haven’t been captured yet.', { code: 'frames_missing', hint: 'Open the project once in the app’s Video view – it captures them automatically.' });
  }
  const label = it => history.find(x => x.id === it?.itemId)?.userPrompt || it?.label || '';
  const context = [
    'This clip replaces one part of a longer edited video and must blend in seamlessly with the rest: same characters, setting, lighting, color, style, camera language and pacing.',
    prev ? `What comes before it: ${label(prev).slice(0, 400)}.` : 'It is the opening of the video.',
    next ? `What comes after it: ${label(next).slice(0, 400)}.` : 'It is the end of the video.',
    `What happens in this part: ${instruction}`,
  ].join('\n');
  // the free models take tenths of a second (and stop at their own limit); Omni Flash whole seconds from 3 to 10
  const length = model.free ? Math.round((seg.out - seg.in) * 10) / 10 : Math.max(3, Math.min(10, Math.round(seg.out - seg.in)));
  return handleVideoGenerate({
    prompt: context, userPrompt: instruction, aspectRatio: p.aspectRatio, resolution: body.resolution || '720p',
    duration: length, sound: body.sound !== false, firstFrame: firstFrame?.path ? firstFrame : undefined, lastFrame: lastFrame?.path && firstFrame?.path ? lastFrame : undefined,
    projectId: p.id, segmentId: seg.id, keepLength: body.keepLength !== false, nodes: body.nodes, model: model.id,
  });
}

// When a regeneration finishes, the new clip takes the segment's place; the old take stays in its history.
async function applyRegeneration(job, item) {
  const map = await loadProjects();
  const p = map.get(job.projectId);
  const seg = p?.segments.find(s => s.id === job.segmentId);
  if (!seg) return;
  const length = seg.out - seg.in;
  seg.takes = [...(seg.takes || []), { itemId: seg.itemId, in: seg.in, out: seg.out, at: new Date().toISOString() }].slice(-20);
  seg.itemId = item.id;
  seg.in = 0;
  seg.out = job.keepLength && item.duration ? Math.min(length, item.duration) : item.duration || length;
  seg.frames = undefined;
  seg.regenAt = new Date().toISOString();
  p.updatedAt = new Date().toISOString();
  await saveProjects();
}

// Video node: the browser runs it in the app; this is the same for Claude.
async function runVideoNode(graph, node, opts) {
  const c = NodesCore.compile(graph, { target: node.id, prompt: opts.prompt || '', formats: opts.formats });
  const v = node.values;
  const first = await nodeImageRef(c.inputs.first, graph, 0);
  const last = first ? await nodeImageRef(c.inputs.last, graph, 0) : null;
  const refs = [];
  if (!first) for (const e of c.inputs.refs || []) { const r = await nodeImageRef(e, graph, 0); if (r) refs.push({ path: r.path, role: r.role }); }
  return handleVideoGenerate({
    model: v.model, prompt: c.prompt, userPrompt: c.parts.base || graph.name, aspectRatio: v.ratio, resolution: v.resolution, duration: v.duration, sound: v.sound,
    firstFrame: first ? { path: first.path } : undefined, lastFrame: last ? { path: last.path } : undefined, refs,
    nodes: { graphId: graph.id, name: graph.name, chips: c.chips },
  });
}

// ── HTTP server ─────────────────────────────────────────────────────────────

const routes = [
  ['GET', /^\/api\/ping$/, () => ({ app: 'hombresai' })],
  ['GET', /^\/api\/effects$/, () => handleEffectsList()],
  ['POST', /^\/api\/effects\/custom$/, body => handleEffectSave(body)],
  ['POST', /^\/api\/effects\/custom\/delete$/, body => handleEffectDelete(body)],
  ['POST', /^\/api\/effects\/ai$/, body => handleEffectAi(body)],
  ['POST', /^\/api\/effects\/export$/, body => handleEffectExport(body)],
  ['POST', /^\/api\/vectors\/ai$/, body => handleVectorAi(body)],
  ['GET', /^\/api\/nodes$/, () => handleNodesList()],
  ['GET', /^\/api\/nodes\/types$/, () => handleNodeTypes()],
  ['POST', /^\/api\/nodes$/, body => handleNodesSave(body)],
  ['POST', /^\/api\/nodes\/delete$/, body => handleNodesDelete(body)],
  ['POST', /^\/api\/nodes\/compile$/, body => handleNodesCompile(body)],
  ['POST', /^\/api\/nodes\/run$/, body => handleNodesRun(body)],
  ['POST', /^\/api\/nodes\/template$/, body => handleNodesTemplate(body)],
  ['GET', /^\/api\/nodes\/templates$/, () => handleUserTemplatesList()],
  ['POST', /^\/api\/nodes\/templates$/, body => handleUserTemplateSave(body)],
  ['POST', /^\/api\/nodes\/templates\/delete$/, body => handleUserTemplateDelete(body)],
  ['POST', /^\/api\/refs\/from-items$/, body => handleRefsFromItems(body)],
  ['GET', /^\/api\/video\/models$/, () => ({ models: publicVideoModels(), freeStatus: freeStatusNow() })],
  ['POST', /^\/api\/video\/generate$/, body => handleVideoGenerate(body)],
  ['GET', /^\/api\/video\/jobs$/, () => handleVideoJobs()],
  ['GET', /^\/api\/video\/jobs\/([\w-]+)$/, (body, m) => handleVideoJob(m[1])],
  ['POST', /^\/api\/video\/jobs\/([\w-]+)\/cancel$/, (body, m) => handleVideoCancel(m[1])],
  ['POST', /^\/api\/video\/save$/, body => handleVideoSave(body)],
  ['GET', /^\/api\/video\/projects$/, () => handleProjectsList()],
  ['POST', /^\/api\/video\/projects$/, body => handleProjectSave(body)],
  ['POST', /^\/api\/video\/projects\/delete$/, body => handleProjectDelete(body)],
  ['POST', /^\/api\/video\/projects\/edit$/, body => handleProjectEdit(body)],
  ['POST', /^\/api\/video\/projects\/regenerate$/, body => handleProjectRegenerate(body)],
  ['POST', /^\/api\/vectors\/export$/, body => handleVectorExport(body)],
  ['GET', /^\/api\/config$/, async () => { await Promise.race([refreshFx(), sleep(2500)]); return publicConfig(); }],
  ['POST', /^\/api\/config$/, body => handleConfig(body)],
  ['GET', /^\/api\/models$/, () => handleModels()],
  ['GET', /^\/api\/free-models$/, () => freeModelsStatus()],
  ['POST', /^\/api\/free-models\/refresh$/, () => refreshFreeModels({ wait: true })],
  ['GET', /^\/api\/history$/, () => ({ items: history.map(publicItem), drive: driveStatus() })],
  ['POST', /^\/api\/history\/delete$/, body => handleDelete(body)],
  ['PATCH', /^\/api\/history\/([\w-]+)$/, (body, m) => handlePatch(m[1], body)],
  ['POST', /^\/api\/history\/([\w-]+)\/thumb$/, (body, m) => handleThumb(m[1], body)],
  ['POST', /^\/api\/refs$/, body => handleRefUpload(body)],
  ['POST', /^\/api\/generate$/, body => handleGenerate(body)],
  ['POST', /^\/api\/enhance$/, body => handleEnhance(body)],
  ['POST', /^\/api\/drive\/disconnect$/, () => handleDriveDisconnect()],
  ['POST', /^\/api\/drive\/sync$/, async () => { await scheduleUploads(); return driveStatus(); }],
  ['POST', /^\/api\/open-folder$/, () => handleOpenFolder()],
];

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(httpError(413, 'The request is too large.'));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(httpError(400, 'Invalid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

async function serveFile(req, res, baseDir, rel, cacheControl) {
  const file = resolveInside(baseDir, rel);
  let stat = null;
  try { stat = file ? await fsp.stat(file) : null; } catch { /* doesn’t exist */ }
  if (!stat?.isFile()) return sendText(res, 404, 'Not found');
  const ext = path.extname(file).slice(1).toLowerCase();
  const total = stat.size;
  const headers = {
    'Content-Type': MIME_BY_EXT[ext] || 'application/octet-stream',
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };
  if (ext === 'html') headers['Content-Security-Policy'] = CSP;
  // Byte ranges so a <video> can seek/scrub a static file (e.g. the Effects sample video).
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    const start = range[1] === '' ? Math.max(0, total - Number(range[2])) : Number(range[1]);
    const end = Math.min(total - 1, range[1] !== '' && range[2] !== '' ? Number(range[2]) : total - 1);
    if (start >= total || end < start) { res.writeHead(416, { 'Content-Range': `bytes */${total}` }); res.end(); return; }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': end - start + 1 });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
    return;
  }
  res.writeHead(200, { ...headers, 'Content-Length': total });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

// A full image: from memory, from the waiting file, or downloaded from Google Drive.
async function serveMedia(req, res, id, download) {
  const item = history.find(i => i.id === id);
  if (!item) return sendText(res, 404, 'Image not found.');
  let entry = cacheGet(id);
  if (!entry && item.localPath) {
    try { entry = { buffer: await fsp.readFile(item.localPath), mimeType: item.mimeType }; } catch { /* uploaded in the meantime */ }
  }
  if (!entry && item.drive?.id) {
    try {
      const r = await driveRequest('GET', `${GOOGLE.drive}/files/${encodeURIComponent(item.drive.id)}?alt=media`, { binary: true, timeoutMs: 120000 });
      if (r.status !== 200) return sendText(res, r.status === 404 ? 404 : 502, r.status === 404 ? 'The file is no longer on Google Drive.' : 'Google Drive didn’t return the image.');
      entry = { buffer: r.buffer, mimeType: item.mimeType };
      cachePut(id, r.buffer, item.mimeType);
    } catch (err) {
      return sendText(res, 502, err.info?.message || err.message);
    }
  }
  if (!entry) return sendText(res, 404, 'The image isn’t available.');
  const headers = {
    'Content-Type': entry.mimeType || 'application/octet-stream',
    'Content-Length': entry.buffer.length,
    'Cache-Control': 'private, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  };
  // a vector drawing opened on its own must never run anything
  if (entry.mimeType === 'image/svg+xml') headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";
  if (download) headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(item.name || `${id}.jpg`)}`;
  headers['Accept-Ranges'] = 'bytes';
  // video players ask for byte ranges to seek
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  const total = entry.buffer.length;
  if (range && !download && (range[1] || range[2])) {
    const start = range[1] === '' ? Math.max(0, total - Number(range[2])) : Number(range[1]);
    const end = Math.min(total - 1, range[1] !== '' && range[2] !== '' ? Number(range[2]) : total - 1);
    if (start >= total || end < start) {
      res.writeHead(416, { 'Content-Range': `bytes */${total}` });
      res.end();
      return;
    }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': end - start + 1 });
    res.end(req.method === 'HEAD' ? undefined : entry.buffer.subarray(start, end + 1));
    return;
  }
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : entry.buffer);
}

// The connected onestoapp site may READ the gallery to pick an image (the images bridge): only
// GET /api/history and GET /media/* — never the money-spending POSTs. The user's own machine
// (a local onestoapp dev server) is allowed automatically; a deployed site's address is set in
// Settings (config.connectOrigin).
function connectAllowed(origin) {
  if (!origin) return false;
  if (config.connectOrigin && origin === config.connectOrigin) return true;
  try {
    const u = new URL(origin);
    return ['http:', 'https:'].includes(u.protocol) && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}
const isConnectReadPath = pathname => pathname === '/api/history' || /^\/media\/[\w-]+$/.test(pathname);

async function handleRequest(req, res, port) {
  // Protection against DNS rebinding and other websites: only our own origin is allowed.
  const allowed = [`127.0.0.1:${port}`, `localhost:${port}`];
  const host = String(req.headers.host || '').toLowerCase();
  if (!allowed.includes(host)) return sendJson(res, 403, { error: { message: 'Host not allowed.' } });
  const url = new URL(req.url, `http://${host}`);
  const { pathname } = url;
  const reqOrigin = req.headers.origin;
  const connectRead = connectAllowed(reqOrigin) && isConnectReadPath(pathname);

  // CORS preflight from the connected site, including Chrome's Private Network Access check that
  // fires when a page calls a local address. Answered only for the two readable GET endpoints.
  if (req.method === 'OPTIONS' && connectRead) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': reqOrigin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
      'Access-Control-Allow-Private-Network': 'true',
      'Access-Control-Max-Age': '600',
    });
    res.end();
    return;
  }

  if (pathname.startsWith('/api/')) {
    const origin = req.headers.origin;
    // Foreign origins are refused, except the connected site reading the gallery list.
    if (origin && !allowed.some(h => origin === `http://${h}`) && !(connectRead && req.method === 'GET')) {
      return sendJson(res, 403, { error: { message: 'Origin not allowed.' } });
    }
    if (connectRead) {
      res.setHeader('Access-Control-Allow-Origin', reqOrigin);
      res.setHeader('Vary', 'Origin');
    }
    const route = routes.find(([method, re]) => method === req.method && re.test(pathname));
    if (!route) return sendJson(res, 404, { error: { message: 'Unknown endpoint.' } });
    try {
      let body = {};
      if (req.method !== 'GET') {
        if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) throw httpError(415, 'Expected JSON.');
        body = await readJsonBody(req);
      }
      sendJson(res, 200, await route[2](body, pathname.match(route[1])));
    } catch (err) {
      const status = err.httpStatus || (err instanceof GeminiError ? 502 : 500);
      if (status === 500) console.error(err);
      sendJson(res, status, { error: describeError(err) });
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }
  if (pathname === '/oauth/start') return oauthStart(res);
  if (pathname === '/oauth/callback') return oauthCallback(url, res);
  const media = pathname.match(/^\/media\/([\w-]+)$/);
  if (media) {
    if (connectRead) { res.setHeader('Access-Control-Allow-Origin', reqOrigin); res.setHeader('Vary', 'Origin'); }
    return serveMedia(req, res, media[1], url.searchParams.has('download'));
  }
  if (pathname.startsWith('/thumbs/')) return serveFile(req, res, THUMBS_DIR, pathname.slice('/thumbs/'.length), 'private, max-age=31536000, immutable');
  if (pathname.startsWith('/refs/')) return serveFile(req, res, REFS_DIR, pathname.slice('/refs/'.length), 'private, max-age=31536000, immutable');
  return serveFile(req, res, PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname, 'no-cache');
}

function listen(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handleRequest(req, res, port).catch(err => {
        console.error(err);
        if (!res.headersSent) sendJson(res, 500, { error: { message: 'Internal server error.' } });
        else res.destroy();
      });
    });
    server.once('error', reject);
    server.listen(port, HOST, () => resolve(server));
  });
}

async function findRunningInstance(port) {
  try {
    const res = await httpRequest('GET', `http://${HOST}:${port}/api/ping`, { timeoutMs: 1500 });
    return ['hombresai', 'myhighsfield'].includes(res.json?.app) ? `http://${HOST}:${port}` : null;
  } catch {
    return null;
  }
}

async function main() {
  loadConfig();
  refreshFx();
  await fsp.mkdir(DATA_DIR, { recursive: true });

  const running = await findRunningInstance(BASE_PORT);
  if (running) {
    console.log(`hombresai is already running at ${running} – opening it.`);
    openExternal(running);
    return;
  }

  await loadHistory();
  await loadVideoJobs();
  await loadFreeModels();
  await migrateLegacyOutput();
  let port = BASE_PORT;
  for (;; port++) {
    try {
      await listen(port);
      break;
    } catch (err) {
      if (!['EADDRINUSE', 'EACCES'].includes(err.code) || port >= BASE_PORT + 20) throw err;
    }
  }
  serverPort = port;

  const url = `http://${HOST}:${port}`;
  const { key, source } = getApiKey();
  const d = config.drive;
  const pendingCount = history.filter(i => i.pending).length;
  console.log('');
  console.log(`  hombresai is running at ${url}`);
  console.log(`  Images are saved to: ${d.refreshToken ? `Google Drive${d.email ? ` (${d.email})` : ''} → folder ${DRIVE_FOLDER}` : 'Google Drive – not connected yet, connect it in Settings'}`);
  if (pendingCount) console.log(`  ${pendingCount} ${pendingCount === 1 ? 'image is' : 'images are'} waiting to be uploaded.`);
  console.log(`  Gemini API key: ${key ? (source === 'env' ? 'from an environment variable' : 'saved') : 'missing – add it in the app'}`);
  console.log(`  Open-source models (Pollinations): ${config.pollinationsKey ? 'key saved' : 'no key yet – add one in Settings'}${hasCloudflare() ? ' · Cloudflare backup connected' : ''}`);
  console.log(`  Free video models (Hugging Face): ${config.hfToken ? `token saved (${config.hfInfo?.user || 'checked'}) – 5 min of GPU a day` : 'no token – 2 min of GPU a day, add a free token in Settings for 5'}`);
  console.log('  Stop it by closing this window or pressing Ctrl+C.');
  console.log('');
  if (OPEN_BROWSER) openExternal(url);

  scheduleUploads();
  setInterval(() => { if (history.some(i => i.pending)) scheduleUploads(); }, 60000).unref();
  scheduleFreeModels();
}

process.on('SIGINT', () => historyWrites.finally(() => process.exit(0)));

main().catch(err => {
  console.error('Failed to start the server:', err.message);
  process.exit(1);
});
