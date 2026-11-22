'use strict';

// ── Constants ───────────────────────────────────────────────────────────────

const RATIO_ORDER = ['auto', '1:1', '4:5', '3:4', '2:3', '9:16', '1:4', '1:8', '5:4', '4:3', '3:2', '16:9', '21:9', '4:1', '8:1'];
const COUNTS = [1, 2, 3, 4, 6, 8];
const THINKING_LABELS = { MINIMAL: 'Fast', LOW: 'Low', MEDIUM: 'Balanced', HIGH: 'Thorough' };
const SIZE_LABELS = { 512: '512 px', '1K': '1K', '2K': '2K', '4K': '4K' };
const MAX_REFS = 14;
const REF_MAX_SIDE = 1536; // references are downscaled – Gemini accepts max 20 MB per request
const MAX_RETRIES = 3;
const PAGE_SIZE = 24;
const BIG_BATCH = 16; // from this many images on, a second click is required to confirm
const FATAL_CODES = new Set(['bad_key', 'billing', 'forbidden', 'region', 'quota', 'model_not_found', 'offline', 'pollinations_key', 'pollinations_balance', 'pollinations_outage', 'cloudflare_key', 'cloudflare_quota', 'hf_quota', 'hf_api']);
const VIEWS = ['create', 'effects', 'vectors', 'nodes', 'video'];
const SETTINGS_CODES = new Set(['bad_key', 'billing', 'forbidden', 'pollinations_key', 'pollinations_balance', 'cloudflare_key']);
const LS_KEY = 'hombresai.ui.v1';
const LEGACY_LS_KEY = 'myhighsfield.ui.v1'; // the app’s previous name

const REF_ROLES = [
  { id: 'auto', label: 'Auto' },
  { id: 'character', label: 'Character' },
  { id: 'object', label: 'Object / product' },
  { id: 'style', label: 'Style' },
  { id: 'scene', label: 'Scene' },
  { id: 'pose', label: 'Pose' },
  { id: 'edit', label: 'Edit this' },
];

const STYLES = [
  { id: 'none', label: 'No style', swatch: 'repeating-linear-gradient(45deg,#2a2f36 0 4px,#1b1f24 4px 8px)', prompt: '' },
  { id: 'photo', label: 'Photoreal', swatch: 'linear-gradient(135deg,#c9a27e,#4f5f68)', prompt: 'Photorealistic photograph, shot on a full-frame camera with a 50mm lens, natural light, true-to-life colors, fine detail and realistic textures.' },
  { id: 'cinematic', label: 'Cinematic', swatch: 'linear-gradient(135deg,#0f2f3f,#e0904a)', prompt: 'Cinematic film still, anamorphic lens, dramatic motivated lighting, subtle haze, shallow depth of field, rich color grading, fine 35mm film grain.' },
  { id: 'portrait', label: 'Studio portrait', swatch: 'radial-gradient(circle at 40% 35%,#f1d2b8,#4a3a35 72%)', prompt: 'Professional studio portrait, large softbox key light with a gentle rim light, 85mm lens, shallow depth of field, seamless backdrop, tack-sharp eyes, natural skin texture.' },
  { id: 'product', label: 'Product shot', swatch: 'linear-gradient(135deg,#f4f4f4,#8f99a4)', prompt: 'High-end commercial product photography, clean studio set, three-point softbox lighting, crisp controlled reflections, razor-sharp focus, advertising quality.' },
  { id: 'editorial', label: 'Fashion editorial', swatch: 'linear-gradient(135deg,#c2185b,#161616)', prompt: 'High-fashion editorial photograph for a luxury magazine, bold styling, dramatic directional light, confident pose, refined color palette.' },
  { id: 'phone', label: 'Phone photo', swatch: 'linear-gradient(135deg,#8fb3c9,#d9c7a7)', prompt: 'Candid smartphone photo, casual imperfect framing, realistic everyday lighting, slight sensor noise, authentic social-media look.' },
  { id: 'film', label: 'Analog film', swatch: 'linear-gradient(135deg,#d8a35d,#7a4a3a)', prompt: 'Vintage analog film photograph, warm nostalgic tones, soft natural grain, gentle halation, slightly faded colors.' },
  { id: 'noir', label: 'Noir', swatch: 'linear-gradient(135deg,#efefef,#111)', prompt: 'Black-and-white film noir photograph, high-contrast chiaroscuro lighting, deep shadows, moody atmosphere.' },
  { id: 'anime', label: 'Anime', swatch: 'linear-gradient(135deg,#ff9ec7,#7ac8ff)', prompt: 'Anime illustration, clean line art, vibrant cel shading, expressive characters, detailed painted background.' },
  { id: '3d', label: '3D render', swatch: 'radial-gradient(circle at 35% 35%,#b6a4ff,#3b2f7a 72%)', prompt: 'Stylized 3D render, soft global illumination, smooth physically based materials, subtle subsurface scattering, appealing design.' },
  { id: 'watercolor', label: 'Watercolor', swatch: 'linear-gradient(135deg,#a8e0d1,#f7c6a3)', prompt: 'Delicate watercolor painting on textured paper, soft color bleeds, loose expressive brushstrokes, visible pencil underdrawing.' },
  { id: 'flat', label: 'Flat illustration', swatch: 'linear-gradient(135deg,#ffcf4a 50%,#3a7bd5 50%)', prompt: 'Clean modern flat vector illustration, bold simple shapes, limited harmonious palette, subtle grain texture.' },
  { id: 'neon', label: 'Neon / cyberpunk', swatch: 'linear-gradient(135deg,#00e5ff,#ff2bd6)', prompt: 'Neon-lit cyberpunk aesthetic, rain-soaked reflective streets, glowing signage, teal and magenta palette, atmospheric haze.' },
];

const EXAMPLES = [
  { title: 'Product shot', prompt: 'A perfume bottle on wet black stone, water droplets, dramatic side light, dark background, luxury advertising photo' },
  { title: 'Portrait', prompt: 'Portrait of an old fisherman in a raincoat on a pier at dawn, soft morning light, detailed skin texture, 85mm lens' },
  { title: 'Poster with text', prompt: 'Minimalist movie poster with the title “PRAGUE AT NIGHT”, Charles Bridge in fog, neon reflections on the Vltava, large elegant typography' },
  { title: 'With a reference', prompt: 'Put the person from image 1 in a café in Paris, keep the face and clothes, warm afternoon light, phone photo' },
];

const ICONS = {
  download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><path d="M8 20v-6h8v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12.5A1.6 1.6 0 0 0 8.6 21h6.8a1.6 1.6 0 0 0 1.6-1.5L18 7"/><path d="M9 7V4.5h6V7"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14.5 7.5 3 3"/>',
  imagePlus: '<path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7"/><path d="m4 16 4.5-4.5 4 4 2-2L20 18"/><path d="M18 3v6M15 6h6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  clipboard: '<rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9 4.5V3.5h6v1"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4M12 17v.01"/>',
  cloudUp: '<path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.75 4.75 0 0 0 7 18.5z"/><path d="M12 16v-5M9.8 13.2 12 11l2.2 2.2"/>',
  upload: '<path d="M12 15V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>',
  wand: '<path d="m4 20 11-11"/><path d="m13 7 4 4"/><path d="M17 3v3M15.5 4.5h3M20 9v2M19 10h2M8 3v2M7 4h2"/>',
  sparkle: '<path d="M11 3.5 12.8 8l4.7 1.8-4.7 1.8L11 16.2l-1.8-4.6L4.5 9.8 9.2 8z"/><path d="m18.5 14.5.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  film: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M7.5 4.5v15M16.5 4.5v15M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4"/>',
  record: '<circle cx="12" cy="12" r="6.5"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/>',
  vector: '<path d="M12 4 18 13l-2.6 6H8.6L6 13z"/><path d="M12 4v7.5"/><circle cx="12" cy="13" r="1.5"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
};

// ── State ───────────────────────────────────────────────────────────────────

const DEFAULT_UI = {
  model: 'gemini-nano-banana-2.1',
  aspectRatio: '1:1',
  imageSize: '1K',
  count: 4,
  thinkingLevel: null,
  style: 'none',
  multi: false,
  view: 'create',
  railHidden: false, // the left sidebar (Create / Effects) is collapsed
  nodeGraph: null,   // node graph whose camera, lens, light… Create adds to every prompt
  fx: null,        // last used effect, its sliders and export options (see fx-ui.js)
  fxCoder: null,    // AI coder model for new effects
};

const state = {
  config: null,
  models: [],
  modelsSource: 'static',
  items: [],            // history from the server, newest first
  pending: new Map(),   // batchId -> set that is still generating
  refs: [],             // references in the composer
  ui: { ...DEFAULT_UI, ...readUi() },
  query: '',
  favoritesOnly: false,
  visibleBatches: PAGE_SIZE,
  queue: [],
  running: 0,
  shownItems: [],       // images in gallery order (for the lightbox)
  lightbox: null,
};

const tiles = new Map();   // image / job id -> DOM tile, so images aren’t reloaded on re-render
const thumbing = new Set();

function readUi() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || localStorage.getItem(LEGACY_LS_KEY)) || {}; } catch { return {}; }
}
function saveUi() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state.ui)); } catch { /* works without localStorage too */ }
}

// ── Small helpers ───────────────────────────────────────────────────────────

const $ = sel => document.querySelector(sel);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const uid = () => Math.random().toString(36).slice(2, 10);
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ratioValue = r => (!r || r === 'auto' ? 1 : r.split(':').map(Number).reduce((w, hgt) => w / hgt));
const clampRatio = r => Math.min(2.2, Math.max(0.45, r || 1));
const currentModel = () => state.models.find(m => m.id === state.ui.model) || state.models[0] || null;
const VIDEO_LABELS = { 'gemini-omni-1.1-flash': 'Gemini Omni Flash', 'wan-2.2': 'Wan 2.2', 'ltx-2.3': 'LTX-2.3', 'ltx-video': 'LTX-Video', 'video-edit': 'Video edit' };
const modelLabel = id => (id === 'effects' ? 'Effects' : id === 'vectors' ? 'Vectors' : VIDEO_LABELS[id] || state.models.find(m => m.id === id)?.label || id);
const isSvg = item => item.mimeType === 'image/svg+xml';
const isVideo = item => /^video\//.test(item?.mimeType || '');
// Label by style ID, so images from older versions show the current (English) name too.
const styleLabel = src => (src.styleId && src.styleId !== 'none' ? STYLES.find(s => s.id === src.styleId)?.label : null) || src.style || null;
// Full images live on Google Drive – the server serves them via /media; only thumbnails and references are local.
const fileName = item => item.name || `${item.id}.jpg`;
const mediaUrl = item => `/media/${item.id}`;
const thumbUrl = item => (item.thumb ? `/thumbs/${item.id}.jpg` : mediaUrl(item));
const refUrl = refPath => `/${refPath}`;

function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'style') el.style.cssText = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

function icon(name, size = 18) {
  const span = document.createElement('span');
  span.className = 'ico';
  span.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  return span;
}

function iconBtn(name, title, onClick, cls = '') {
  return h('button', {
    type: 'button',
    class: `icon-btn ${cls}`.trim(),
    title,
    'aria-label': title,
    onclick: e => { e.stopPropagation(); onClick(e); },
  }, icon(name));
}

// Deleting without a blocking dialog: the first click “arms” the button, a second click within 3 s deletes.
function armConfirm(btn, title, onConfirm) {
  let timer = null;
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (btn.classList.contains('confirming')) {
      clearTimeout(timer);
      btn.classList.remove('confirming');
      onConfirm();
      return;
    }
    btn.classList.add('confirming');
    btn.title = 'Click again to confirm';
    timer = setTimeout(() => { btn.classList.remove('confirming'); btn.title = title; }, 3000);
  });
  return btn;
}

function confirmIconBtn(name, title, onConfirm) {
  return armConfirm(h('button', { type: 'button', class: 'icon-btn danger', title, 'aria-label': title }, icon(name)), title, onConfirm);
}

// Gemini prices are in USD – we show them in CZK at the CNB rate (from the server), optionally incl. VAT.
const VAT_RATE = 0.21;
const czkFormat = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'CZK', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toCzk = usd => (usd || 0) * (state.config?.fx?.usdCzk || 0) * (state.config?.settings?.vat ? 1 + VAT_RATE : 1);
const fmtPrice = usd => czkFormat.format(toCzk(usd));

// The CNB publishes dates as DD.MM.YYYY.
function fxDate(date) {
  const [d, m, y] = String(date || '').split('.').map(Number);
  return y ? new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : String(date || '');
}

function priceNote() {
  const fx = state.config?.fx;
  if (!fx) return '';
  const rate = fx.usdCzk.toLocaleString('en-GB', { maximumFractionDigits: 3 });
  return `Based on Google’s price list at the CNB rate of CZK ${rate}/USD (${fxDate(fx.date)}), ${state.config.settings.vat ? 'incl. 21% VAT' : 'excl. VAT'}.`;
}

function renderStaticPrices() {
  for (const el of document.querySelectorAll('[data-usd]')) el.textContent = fmtPrice(Number(el.dataset.usd));
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
function relTime(iso) {
  const d = new Date(iso);
  const sec = (Date.now() - d.getTime()) / 1000;
  if (sec < 45) return 'just now';
  if (sec < 3600) return rtf.format(-Math.round(sec / 60), 'minute');
  if (sec < 6 * 3600) return rtf.format(-Math.round(sec / 3600), 'hour');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === new Date().toDateString()) return `today ${time}`;
  if (d.toDateString() === new Date(Date.now() - 86400000).toDateString()) return `yesterday ${time}`;
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function pluralRefs(n) {
  return n === 1 ? '1 reference' : `${n} references`;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ── Talking to the server ───────────────────────────────────────────────────

async function api(url, { method, body } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method: method || (body !== undefined ? 'POST' : 'GET'),
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const info = { code: 'offline', message: 'The local server is not responding.', hint: 'Run start.bat again – its window has to stay open.' };
    throw Object.assign(new Error(info.message), { info });
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty response */ }
  if (!res.ok) {
    const info = data?.error || { message: `Server error (${res.status}).` };
    throw Object.assign(new Error(info.message), { info });
  }
  return data;
}

// ── Toasts ──────────────────────────────────────────────────────────────────

function toast(message, type = 'info', { action, duration = 4500 } = {}) {
  let timer = null;
  const dismiss = () => {
    clearTimeout(timer);
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
  };
  const el = h('div', { class: `toast ${type}`, role: type === 'error' ? 'alert' : 'status' },
    h('span', { class: 'toast-msg' }, message),
    action && h('button', { type: 'button', class: 'toast-action', onclick: () => { action.onClick(); dismiss(); } }, action.label),
    h('button', { type: 'button', class: 'toast-close', 'aria-label': 'Close', onclick: dismiss }, icon('x', 14)));
  $('#toasts').append(el);
  timer = setTimeout(dismiss, duration);
}

function errorText(err, prefix) {
  const info = err?.info || { message: err?.message || String(err) };
  return [prefix, info.message].filter(Boolean).join(': ') + (info.hint ? ` ${info.hint}` : '');
}

function toastError(err, prefix) {
  const code = err?.info?.code;
  const gemini = code === 'pollinations_outage' && state.config?.hasKey && state.models.find(m => m.provider === 'gemini' && m.available !== false);
  const action = SETTINGS_CODES.has(code) ? { label: 'Settings', onClick: () => openSettings() }
    // only switches the model – generating (and paying) is still the user's click
    : gemini ? { label: `Use ${gemini.label}`, onClick: () => useModelInstead(gemini) } : undefined;
  toast(errorText(err, prefix), 'error', { duration: 12000, action });
}

function useModelInstead(m) {
  if (state.ui.view === 'vectors') {
    vx.gen.model = m.id;
    vxRenderSide();
  } else selectModel(m.id);
  toast(`${m.label} selected – click Generate again.`);
}

// While Settings is open, messages belong inside it – a toast would cover the key field.
function notify(message, type = 'info') {
  if ($('#settingsModal').hidden) { toast(message, type); return; }
  const el = $('#settingsMsg');
  el.textContent = message;
  el.className = `settings-msg ${type}`;
}

function notifyError(err, prefix) {
  if ($('#settingsModal').hidden) toastError(err, prefix);
  else notify(errorText(err, prefix), 'error');
}

// ── Startup ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  renderPanel();
  try {
    const [config, history] = await Promise.all([api('/api/config'), api('/api/history')]);
    state.config = config;
    state.items = history.items || [];
  } catch {
    $('#gallery').replaceChildren(h('div', { class: 'empty' },
      h('h2', null, 'The local server is not running'),
      h('p', { class: 'muted' }, 'Run start.bat (or node server.js) and reload the page.')));
    return;
  }
  handleDriveRedirect();
  handleSettingsLink();
  setView(state.ui.view);
  updateSpend();
  schedulePoll();
  ndEnsureGraphs().then(renderNodesField).catch(() => {});
  await loadModels();
  setInterval(tick, 1000);
}

// Coming back from the Google Drive sign-in (/oauth/callback redirects to /?drive=…).
function handleDriveRedirect() {
  const params = new URLSearchParams(location.search);
  const status = params.get('drive');
  if (!status) return;
  history.replaceState(null, '', '/');
  const messages = {
    connected: ['Google Drive connected ✓ Images are uploading to the hombresai folder.', 'success'],
    denied: ['You didn’t allow access to Google Drive.', 'error'],
    expired: ['The sign-in expired – try connecting Google Drive again.', 'error'],
    missing_client: ['Add the OAuth client (Client ID and secret) in Settings first.', 'error'],
  };
  const [message, type] = messages[status] || [`Connecting Google Drive failed: ${params.get('reason') || 'unknown error'}`, 'error'];
  toast(message, type, { duration: 8000 });
}

// While something is waiting to be uploaded to Drive, keep polling the server for its status.
let pollTimer = null;
function schedulePoll() {
  clearTimeout(pollTimer);
  if (state.items.some(i => i.pending)) pollTimer = setTimeout(refreshUploads, 5000);
}

async function refreshUploads() {
  try {
    const res = await api('/api/history');
    const fresh = new Map(res.items.map(i => [i.id, i]));
    for (const item of state.items) {
      const f = fresh.get(item.id);
      if (!f) continue;
      Object.assign(item, { pending: f.pending, drive: f.drive, uploadError: f.uploadError, thumb: item.thumb || f.thumb });
    }
    state.config.drive = res.drive;
    renderGallery();
    if (!$('#settingsModal').hidden) renderDriveStatus();
  } catch {
    // we’ll try again next time
  }
  schedulePoll();
}

async function syncDrive() {
  try {
    state.config.drive = await api('/api/drive/sync', { body: {} });
  } catch (err) {
    toastError(err);
  }
  await refreshUploads();
}

async function loadModels() {
  try {
    const res = await api('/api/models');
    state.models = res.models;
    state.freeStatus = res.freeStatus || null;
    state.modelsSource = res.source;
    if (res.warning) toast(`Couldn’t load the model list from Google (${res.warning}). Using the default list.`, 'error', { duration: 8000 });
  } catch (err) {
    toastError(err, 'Models');
  }
  normalizeUi();
  renderPanel();
  renderGallery();
  // node graphs drawn before the list arrived get their real model names
  if (typeof nd !== 'undefined' && nd.ready && nd.graph) ndRenderGraph();
}

function normalizeUi() {
  const ui = state.ui;
  if (state.models.length && !state.models.some(m => m.id === ui.model)) {
    ui.model = (state.models.find(m => m.available !== false) || state.models[0]).id;
  }
  const m = currentModel();
  if (m) {
    if (ui.aspectRatio !== 'auto' && !m.ratios.includes(ui.aspectRatio)) ui.aspectRatio = '1:1';
    if (m.sizes.length && !m.sizes.includes(ui.imageSize)) ui.imageSize = m.sizes.includes('1K') ? '1K' : m.sizes[0];
    if (m.thinking?.length && !m.thinking.includes(ui.thinkingLevel)) ui.thinkingLevel = m.thinkingDefault || m.thinking[0];
  }
  if (!COUNTS.includes(ui.count)) ui.count = DEFAULT_UI.count;
  if (!STYLES.some(s => s.id === ui.style)) ui.style = 'none';
  if (!VIEWS.includes(ui.view)) ui.view = 'create';
  saveUi();
}

function bindEvents() {
  const input = $('#promptInput');
  input.addEventListener('input', () => { autoresize(); updateGenerateButton(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); generate(); }
  });
  $('#generateBtn').addEventListener('click', generate);
  $('#enhanceBtn').addEventListener('click', enhancePrompt);
  $('#nodeGraphSelect').addEventListener('change', e => { state.ui.nodeGraph = e.target.value || null; saveUi(); renderNodesField(); });
  $('#nodeEditBtn').addEventListener('click', openNodeGraph);
  $('#multiToggle').addEventListener('change', e => { state.ui.multi = e.target.checked; saveUi(); updateGenerateButton(); });
  $('#cancelQueueBtn').addEventListener('click', () => {
    const n = cancelQueued();
    toast(`Cancelled ${n} queued ${n === 1 ? 'image' : 'images'}. The ones already running will finish.`);
  });
  $('#fileInput').addEventListener('change', e => { addRefFiles(e.target.files); e.target.value = ''; });

  $('#searchInput').addEventListener('input', e => { state.query = e.target.value; state.visibleBatches = PAGE_SIZE; renderGallery(); });
  $('#favFilterBtn').addEventListener('click', () => {
    state.favoritesOnly = !state.favoritesOnly;
    $('#favFilterBtn').classList.toggle('active', state.favoritesOnly);
    $('#favFilterBtn').setAttribute('aria-pressed', String(state.favoritesOnly));
    renderGallery();
  });
  $('#settingsBtn').addEventListener('click', () => openSettings());
  $('#openFolderBtn').addEventListener('click', openFolder);
  $('#openFolderBtn2').addEventListener('click', openFolder);
  $('#panelToggle').addEventListener('click', e => { e.stopPropagation(); document.body.classList.toggle('panel-open'); });
  $('#railToggle').addEventListener('click', () => {
    state.ui.railHidden = !state.ui.railHidden;
    saveUi();
    applyRail();
  });
  applyRail();
  $('.main').addEventListener('click', () => document.body.classList.remove('panel-open'));

  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lbPrev').addEventListener('click', () => stepLightbox(-1));
  $('#lbNext').addEventListener('click', () => stepLightbox(1));
  $('#lbStage').addEventListener('click', e => { if (e.target.id === 'lbStage') closeLightbox(); });

  $('#settingsClose').addEventListener('click', closeSettings);
  $('#settingsModal').addEventListener('mousedown', e => { if (e.target.id === 'settingsModal') closeSettings(); });
  $('#keyForm').addEventListener('submit', e => { e.preventDefault(); saveKey($('#keyInput').value, $('#keySave')); });
  $('#keyToggle').addEventListener('click', () => {
    const k = $('#keyInput');
    k.type = k.type === 'password' ? 'text' : 'password';
  });
  $('#keyRemove').addEventListener('click', removeKey);
  $('#settingsSave').addEventListener('click', saveSettings);
  $('#driveConnect').addEventListener('click', connectDrive);
  $('#driveDisconnect').addEventListener('click', disconnectDrive);
  $('#pollKeySave').addEventListener('click', savePollKey);
  $('#pollKeyPaste').addEventListener('click', pastePollKey);
  $('#pollKeyInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); savePollKey(); }
  });
  $('#pollKeyRemove').addEventListener('click', removePollKey);
  $('#cfSave').addEventListener('click', saveCloudflare);
  $('#cfTokenInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); saveCloudflare(); }
  });
  $('#cfRemove').addEventListener('click', removeCloudflare);
  $('#hfSave').addEventListener('click', saveHfToken);
  $('#freeRefresh').addEventListener('click', searchFreeModels);
  $('#hfTokenInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); saveHfToken(); }
  });
  $('#hfRemove').addEventListener('click', removeHfToken);
  for (const btn of document.querySelectorAll('[data-copy]')) {
    btn.addEventListener('click', () => {
      const text = $(`#${btn.dataset.copy}`).textContent;
      navigator.clipboard?.writeText(text).then(() => notify('Copied ✓', 'success'), () => notify('Couldn’t copy – select the text and copy it by hand.', 'error'));
    });
  }

  for (const btn of document.querySelectorAll('.rail-btn')) btn.addEventListener('click', () => setView(btn.dataset.view));
  fxBindEvents();

  document.addEventListener('keydown', onGlobalKey);
  document.addEventListener('paste', onPaste);
  bindDragAndDrop();
  window.addEventListener('beforeunload', e => {
    if (state.queue.length) { e.preventDefault(); e.returnValue = ''; }
  });
}

function onGlobalKey(e) {
  if (e.key === 'Escape') {
    if (!$('#settingsModal').hidden) closeSettings();
    else if (state.lightbox) closeLightbox();
    else document.body.classList.remove('panel-open');
    return;
  }
  if (state.lightbox && !e.target.closest('input, textarea, select')) {
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  }
}

function autoresize() {
  const input = $('#promptInput');
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 260)}px`;
}

// ── Settings panel ──────────────────────────────────────────────────────────

function renderPanel() {
  renderModels();
  renderRatios();
  renderSizes();
  renderCounts();
  renderThinking();
  renderStyles();
  renderNodesField();
  renderRefs();
  $('#multiToggle').checked = Boolean(state.ui.multi);
  updateGenerateButton();
}

function selectModel(id) {
  state.ui.model = id;
  normalizeUi();
  renderPanel();
}


// the free models found online: the first few are shown, the rest behind “Show more”
const FOUND_SHOWN = 5;
const FOUND_TAGS = { works: 'Works ✓', untested: 'New', pollen: 'Needs pollen' };
const FOUND_NOTES = {
  works: 'Tested – it has already made a picture on this computer.',
  untested: 'Not tried yet – your first picture with it shows whether it works (if it fails twice, it’s hidden for a few days).',
  pollen: 'Runs on Pollinations and needs pollen on your account.',
};
let showAllFound = false;

const FREE_LIMIT_CODES = new Set(['hf_quota', 'pollinations_balance', 'cloudflare_quota']);
const clock = iso => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function freeHiddenText(f, n) {
  const why = [];
  if (!f.huggingface?.ok) why.push(`Hugging Face’s free GPU time is used up (back about ${clock(f.huggingface.until)})`);
  if (!f.pollinations?.ok) why.push(f.pollinations.reason === 'no key' ? 'Pollinations has no key' : 'Pollinations has no pollen');
  if (!f.cloudflare?.ok) why.push(f.cloudflare.reason === 'not connected' ? 'Cloudflare isn’t connected' : `today’s Cloudflare allowance is used up (back ${clock(f.cloudflare.until)})`);
  return `${n} free model${n === 1 ? ' is' : 's are'} hidden – they can’t run right now: ${why.join('; ')}. They come back by themselves.`;
}

// The menus follow what can run: after a used-up free place, every 2 minutes and when the window comes back.
let freeSig = '';
async function refreshFreeAvailability() {
  try {
    const [res, video] = await Promise.all([api('/api/models'), api('/api/video/models').catch(() => null)]);
    const sig = JSON.stringify([res.freeStatus, res.models.map(m => [m.id, m.availableNow]), video?.models.map(m => [m.id, m.availableNow])]);
    if (sig === freeSig) return;
    freeSig = sig;
    state.models = res.models;
    state.freeStatus = res.freeStatus;
    renderModels();
    if (video) {
      if (typeof nd !== 'undefined') nd.videoModels = video.models;
      if (typeof vd !== 'undefined') { vd.models = video.models; if (vd.ready && typeof vdRenderSide === 'function') vdRenderSide(); }
    }
    if (typeof nd !== 'undefined' && nd.ready && nd.graph) ndRenderGraph();
    if (typeof vx !== 'undefined' && vx.tab === 'generate' && typeof vxRenderSide === 'function') vxRenderSide();
    api('/api/effects').then(r => {
      if (typeof fxs !== 'undefined') fxs.coder = r.coder || fxs.coder;
      if (typeof vx !== 'undefined') vx.coders = r.coder?.vectorModels || r.coder?.models || vx.coders;
    }).catch(() => {});
  } catch { /* the next check */ }
}
setInterval(refreshFreeAvailability, 2 * 60 * 1000);
window.addEventListener('focus', () => refreshFreeAvailability());

function renderModels() {
  const list = $('#modelList');
  if (!state.models.length) {
    list.replaceChildren(h('p', { class: 'muted small' }, 'Loading models…'));
    return;
  }
  // only the models that can run right now (the chosen one always stays)
  const visible = state.models.filter(m => m.availableNow !== false || m.id === state.ui.model);
  const hiddenFree = state.models.length - visible.length;
  const found = visible.filter(m => m.group === 'found');
  const extra = found.length - FOUND_SHOWN;
  const hidden = new Set(!showAllFound && extra > 0 ? found.slice(FOUND_SHOWN).map(m => m.id).filter(id => id !== state.ui.model) : []);
  const lastFound = found.at(-1);
  const moreBtn = () => h('button', { type: 'button', class: 'model-more', onclick: () => { showAllFound = !showAllFound; renderModels(); } },
    showAllFound ? 'Show fewer' : `Show ${extra} more free models`);
  const note = () => hiddenFree > 0 && state.freeStatus && h('div', { class: 'free-note' }, freeHiddenText(state.freeStatus, hiddenFree), ' ',
    h('button', { type: 'button', class: 'model-group-link', onclick: () => openSettings() }, 'Settings'));
  const anyFree = visible.some(m => ['open', 'found'].includes(m.group));
  list.replaceChildren(...visible.flatMap((m, i) => {
    if (hidden.has(m.id)) return m === lastFound ? [moreBtn()] : [];
    const selected = m.id === state.ui.model;
    const prices = m.price ? Object.values(m.price.image) : [];
    const firstOpen = m.group === 'open' && visible[i - 1]?.group !== 'open';
    const firstFound = m.group === 'found' && visible[i - 1]?.group !== 'found';
    const isFound = m.group === 'found';
    const tag = isFound ? FOUND_TAGS[m.state] || 'Found' : m.tag;
    const tagClass = m.tag === 'Recommended' ? ' accent' : isFound && m.state === 'works' ? ' works' : ['open', 'found'].includes(m.group) ? ' open' : '';
    return [
      firstOpen && h('div', { class: 'model-group' }, 'Open source · free'),
      (firstOpen || (firstFound && !visible.some(x => x.group === 'open'))) && note(),
      firstFound && h('div', { class: 'model-group model-group-row', title: 'Found by the free-model search – it runs once a day' },
        h('span', {}, `Found free online · ${found.length}`),
        h('button', { type: 'button', class: 'model-group-link', onclick: () => openSettings() }, 'All free models')),
      h('button', {
        type: 'button',
        class: `model-card${selected ? ' selected' : ''}`,
        role: 'radio',
        'aria-checked': String(selected),
        onclick: () => selectModel(m.id),
      },
      h('span', { class: 'model-row' },
        h('span', { class: 'model-name' }, m.label),
        tag && h('span', { class: `tag${tagClass}` }, tag),
        h('span', { class: 'model-price', title: m.free ? 'Runs on free open-source services' : priceNote() },
          prices.length ? `from ${fmtPrice(Math.min(...prices))}` : m.free ? (isFound || m.auto ? 'free' : 'free tier') : '')),
      selected && h('span', { class: 'model-desc' }, m.desc),
      selected && isFound && FOUND_NOTES[m.state] && h('span', { class: `model-desc found-note ${m.state}` }, FOUND_NOTES[m.state]),
      selected && m.available === false && h('span', { class: 'model-warn' }, 'Your key doesn’t list this model – it may not work.'),
      selected && m.keyMissing && h('span', { class: 'model-warn' }, 'Needs a free Pollinations API key – add it in Settings.'),
      selected && m.availableNow === false && h('span', { class: 'model-warn' }, 'Can’t run right now – see the note above.')),
      m === lastFound && extra > 0 && showAllFound && moreBtn(),
    ].filter(Boolean);
  }), ...(anyFree ? [] : [h('div', { class: 'model-group' }, 'Open source · free'), note()].filter(Boolean)));
  $('#modelSource').textContent = state.modelsSource === 'api' ? 'verified for your key' : '';
}

function renderRatios() {
  const m = currentModel();
  const supported = new Set(['auto', ...(m?.ratios || RATIO_ORDER)]);
  $('#ratioGrid').replaceChildren(...RATIO_ORDER.filter(r => supported.has(r)).map(r => {
    let shape;
    if (r === 'auto') {
      shape = h('span', { class: 'ratio-shape auto' });
    } else {
      const [w, hgt] = r.split(':').map(Number);
      const scale = 22 / Math.max(w, hgt);
      shape = h('span', { class: 'ratio-shape', style: `width:${Math.max(4, w * scale)}px;height:${Math.max(4, hgt * scale)}px` });
    }
    const selected = state.ui.aspectRatio === r;
    return h('button', {
      type: 'button',
      class: `ratio${selected ? ' selected' : ''}`,
      'aria-pressed': String(selected),
      title: r === 'auto' ? 'Automatic – the model picks it from the references (good for edits)' : `Aspect ratio ${r}`,
      onclick: () => { state.ui.aspectRatio = r; saveUi(); renderRatios(); },
    }, h('span', { class: 'ratio-box' }, shape), r === 'auto' ? 'Auto' : r);
  }));
}

function segBtn(selected, onClick, label, sub) {
  return h('button', { type: 'button', class: `seg-btn${selected ? ' selected' : ''}`, 'aria-pressed': String(selected), onclick: onClick },
    h('span', null, label), sub && h('small', null, sub));
}

function renderSizes() {
  const m = currentModel();
  const field = $('#sizeField');
  field.hidden = !m?.sizes?.length;
  if (field.hidden) return;
  field.querySelector('.field-note').title = priceNote();
  $('#sizeSeg').replaceChildren(...m.sizes.map(s => segBtn(
    s === state.ui.imageSize,
    () => { state.ui.imageSize = s; saveUi(); renderSizes(); updateGenerateButton(); },
    SIZE_LABELS[s] || s,
    m.price?.image?.[s] != null ? fmtPrice(m.price.image[s]) : null,
  )));
}

function renderCounts() {
  $('#countSeg').replaceChildren(...COUNTS.map(n => segBtn(
    n === state.ui.count,
    () => { state.ui.count = n; saveUi(); renderCounts(); updateGenerateButton(); },
    String(n),
  )));
}

function renderThinking() {
  const m = currentModel();
  const field = $('#thinkingField');
  field.hidden = !m?.thinking?.length;
  if (field.hidden) return;
  $('#thinkingSeg').replaceChildren(...m.thinking.map(level => segBtn(
    level === state.ui.thinkingLevel,
    () => { state.ui.thinkingLevel = level; saveUi(); renderThinking(); },
    THINKING_LABELS[level] || level,
    level === m.thinkingDefault ? 'default' : null,
  )));
}

function renderStyles() {
  $('#styleGrid').replaceChildren(...STYLES.map(s => h('button', {
    type: 'button',
    class: `style-chip${s.id === state.ui.style ? ' selected' : ''}`,
    'aria-pressed': String(s.id === state.ui.style),
    title: s.prompt || 'Your prompt is sent exactly as written',
    onclick: () => { state.ui.style = s.id; saveUi(); renderStyles(); },
  }, h('span', { class: 'style-swatch', style: `background:${s.swatch}` }), h('span', null, s.label))));
}

// Nodes in Create: the chosen graph's camera, lens, light… are added to every prompt (its own Prompt node is skipped).
function createNodeCompile() {
  const graph = state.ui.nodeGraph ? ndGraphById(state.ui.nodeGraph) : null;
  if (!graph) return null;
  const compiled = NodesCore.compile(graph, { target: null, skip: ['prompt'], only: 'image' });
  return compiled.addition ? { graph, compiled } : null;
}

function renderNodesField() {
  const sel = $('#nodeGraphSelect');
  if (!sel) return;
  const graphs = nd.graphs || [];
  const current = graphs.find(g => g.id === state.ui.nodeGraph) || null;
  if (state.ui.nodeGraph && nd.graphs && !current) { state.ui.nodeGraph = null; saveUi(); }
  sel.replaceChildren(h('option', { value: '' }, 'None – the prompt only'),
    ...graphs.map(g => h('option', { value: g.id, selected: g === current }, `${g.name}${g.kind === 'video' ? ' (video graph)' : ''}`)));
  const info = createNodeCompile();
  const m = currentModel();
  const open = m?.provider === 'pollinations' || m?.free;
  $('#nodeChips').replaceChildren(...(info
    ? [
      ...info.compiled.chips.slice(0, 10).map(c => h('span', { class: 'pill' }, c)),
      h('span', { class: 'field-note node-len' }, `+ ${info.compiled.addition.length.toLocaleString('en-GB')} characters added to the prompt`),
      ...info.compiled.warnings.map(w => h('span', { class: 'nd-warn' }, w)),
      open && info.compiled.addition.length > 1500 ? h('span', { class: 'nd-warn' }, 'Open-source models read only about 2,000 characters – attach fewer formats in Nodes.') : null,
    ]
    : [h('span', { class: 'field-note' }, current ? 'This graph has no camera, lens or light nodes yet.' : 'Pick a graph – its camera, lens, exposure, light… are added to every prompt as text, XML, JSON and Markdown.')]));
  $('#nodeEditBtn').textContent = current ? 'Edit' : 'New';
}

function openNodeGraph() {
  const graph = ndGraphById(state.ui.nodeGraph);
  setView('nodes');
  if (graph && nd.ready) ndOpen(graph);
  else if (graph) { try { localStorage.setItem(ND_STORE_GRAPH, graph.id); } catch { /* fine */ } }
}

function promptList() {
  const raw = $('#promptInput').value;
  if (!state.ui.multi) return raw.trim() ? [raw.trim()] : [];
  return raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function unitPrice(m, size) {
  if (!m?.price) return null;
  return m.price.image[size] ?? m.price.image['1K'] ?? Object.values(m.price.image)[0];
}

function updateGenerateButton() {
  const m = currentModel();
  const prompts = Math.max(1, promptList().length);
  const total = prompts * state.ui.count;
  const price = unitPrice(m, m?.sizes?.length ? state.ui.imageSize : '1K');
  const btn = $('#generateBtn');
  btn.classList.remove('confirming');
  $('#generateLabel').textContent = prompts > 1 ? `Generate ${prompts} × ${state.ui.count}` : total > 1 ? `Generate ${total}×` : 'Generate';
  $('#generateCost').textContent = price != null ? `≈ ${fmtPrice(price * total)}` : m?.free ? 'free tier' : '';
  btn.title = price != null
    ? `Estimate: ${priceNote()} References and model thinking add only a few hundredths of a crown.`
    : m?.free ? 'Runs on Pollinations’ free daily credit.' : '';
}

// ── References ──────────────────────────────────────────────────────────────

const isHeic = (blob, name) => /image\/hei[cf]/i.test(blob.type || '') || /\.hei[cf]$/i.test(name || '');

function renderRefs() {
  const wrap = $('#refs');
  const m = currentModel();
  if (!state.refs.length) {
    wrap.replaceChildren(
      h('button', { type: 'button', class: 'ref-add-inline', onclick: () => $('#fileInput').click() }, icon('imagePlus', 16), 'Add references'),
      h('span', { class: 'refs-hint' }, 'or drag them into the window / paste with Ctrl+V'));
    return;
  }
  wrap.replaceChildren(
    ...state.refs.map((ref, i) => h('div', { class: `ref${ref.status === 'uploading' ? ' loading' : ''}` },
      h('div', { class: 'ref-thumb' },
        ref.url ? h('img', { src: ref.url, alt: `Reference ${i + 1}` }) : h('span', { class: 'ref-ph' }, ref.heic ? 'HEIC' : '…'),
        h('span', { class: 'ref-idx' }, String(i + 1)),
        h('button', { type: 'button', class: 'ref-del', title: 'Remove', 'aria-label': `Remove reference ${i + 1}`, onclick: () => removeRef(ref) }, icon('x', 12))),
      h('select', {
        class: 'ref-role',
        title: 'How the model should use this reference',
        'aria-label': `Role of reference ${i + 1}`,
        onchange: e => { ref.role = e.target.value; },
      }, REF_ROLES.map(r => h('option', { value: r.id, selected: r.id === ref.role }, r.label))))),
    state.refs.length < MAX_REFS && h('button', { type: 'button', class: 'ref-add', title: 'Add reference', 'aria-label': 'Add reference', onclick: () => $('#fileInput').click() }, icon('plus', 20)),
    h('div', { class: 'refs-hint' },
      h('b', null, `${state.refs.length}/${MAX_REFS}`), m?.refsHint ? ` · ${m.refsHint}` : '',
      h('br'),
      'In the prompt, refer to them like “the person from image 1”. ',
      h('button', { type: 'button', class: 'link-btn', onclick: clearRefs }, 'Remove all')));
}

function clearRefs() {
  for (const ref of state.refs) if (ref.url?.startsWith('blob:')) URL.revokeObjectURL(ref.url);
  state.refs = [];
  renderRefs();
}

function removeRef(ref) {
  if (ref.url?.startsWith('blob:')) URL.revokeObjectURL(ref.url);
  state.refs = state.refs.filter(r => r !== ref);
  renderRefs();
}

function addRefPlaceholder(blob, name, role = 'auto') {
  const heic = isHeic(blob, name);
  const ref = { id: uid(), status: 'uploading', role, heic, url: heic ? null : URL.createObjectURL(blob), path: null };
  state.refs.push(ref);
  return ref;
}

// Downscales the image and stores it on the server as a reference; returns { path, url }.
async function uploadImage(blob, name) {
  return api('/api/refs', { body: await prepareImage(blob, name) });
}

async function uploadRef(ref, blob, name) {
  try {
    const res = await uploadImage(blob, name);
    if (ref.url?.startsWith('blob:')) URL.revokeObjectURL(ref.url);
    Object.assign(ref, { status: 'ready', path: res.path, url: ref.heic ? null : res.url });
  } catch (err) {
    state.refs = state.refs.filter(r => r !== ref);
    toastError(err, 'Couldn’t add the reference');
  }
  renderRefs();
}

async function addRefFiles(fileList) {
  const files = [...fileList].filter(f => f.type.startsWith('image/') || isHeic(f, f.name));
  if (!files.length) { toast('That doesn’t look like an image.', 'error'); return; }
  const free = MAX_REFS - state.refs.length;
  if (free <= 0) { toast(`The maximum is ${MAX_REFS} references.`, 'error'); return; }
  if (files.length > free) toast(`Adding only ${free} – the maximum is ${MAX_REFS} references.`);
  const accepted = files.slice(0, free);
  const refs = accepted.map(f => addRefPlaceholder(f, f.name));
  renderRefs();
  // one at a time, so decoding large photos doesn’t flood memory
  for (const [i, file] of accepted.entries()) await uploadRef(refs[i], file, file.name);
}

async function addRefFromItem(item, role = 'auto') {
  if (state.refs.length >= MAX_REFS) { toast(`The maximum is ${MAX_REFS} references.`, 'error'); return; }
  try {
    const res = await fetch(mediaUrl(item));
    if (!res.ok) throw new Error((await res.text()) || 'Couldn’t load the image.');
    const blob = await res.blob();
    const ref = addRefPlaceholder(blob, fileName(item), role);
    renderRefs();
    await uploadRef(ref, blob, fileName(item));
  } catch (err) {
    toastError(err, 'Couldn’t add the reference');
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Downscales a reference to max 1536 px (JPEG, or PNG if transparent). Browsers can’t decode HEIC, so it’s sent as is.
async function prepareImage(blob, name) {
  if (isHeic(blob, name)) {
    if (blob.size > 15 * 1024 * 1024) throw new Error('The HEIC file is too large (max 15 MB).');
    const mimeType = /heif/i.test(blob.type) || /\.heif$/i.test(name || '') ? 'image/heif' : 'image/heic';
    return { mimeType, data: await blobToBase64(blob) };
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Couldn’t load this image.');
  }
  const small = await smallCopy(bitmap);
  const scale = Math.min(1, REF_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && /^image\/(png|webp)$/.test(blob.type) && blob.size <= 4 * 1024 * 1024) {
    bitmap.close();
    return { mimeType: blob.type, data: await blobToBase64(blob), small };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const transparent = blob.type !== 'image/jpeg' && hasTransparency(ctx, canvas.width, canvas.height);
  const mimeType = transparent ? 'image/png' : 'image/jpeg';
  const out = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 0.92));
  if (!out) throw new Error('Couldn’t process the image.');
  return { mimeType, data: await blobToBase64(out), small };
}

// A ≤ 500 px JPEG copy of a reference – the Cloudflare backup only takes references under 512 px.
async function smallCopy(bitmap) {
  const scale = Math.min(1, 500 / Math.max(bitmap.width, bitmap.height));
  const canvas = h('canvas', { width: Math.max(1, Math.round(bitmap.width * scale)), height: Math.max(1, Math.round(bitmap.height * scale)) });
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const out = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  return out ? blobToBase64(out) : undefined;
}

function hasTransparency(ctx, width, height) {
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 16) if (data[i] < 250) return true;
  return false;
}

function onPaste(e) {
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  e.preventDefault();
  if (state.ui.view === 'effects') fxLoadFile(files[0]);
  else if (state.ui.view === 'vectors') vxLoadFile(files[0]);
  else addRefFiles(files);
}

function bindDragAndDrop() {
  const overlay = $('#dropOverlay');
  let depth = 0;
  const inEffects = () => state.ui.view === 'effects';
  const relevant = e => {
    const types = [...(e.dataTransfer?.types || [])];
    return types.includes('Files') || types.includes('application/x-mhf-item');
  };
  const reset = () => {
    depth = 0;
    overlay.hidden = true;
    $('#fxeViewport').classList.remove('dragover');
    $('#vxViewport').classList.remove('dragover');
    $('#vdTimeline')?.classList.remove('dragover');
    $('#ndCanvas')?.classList.remove('dragover');
  };
  window.addEventListener('dragenter', e => {
    if (!relevant(e)) return;
    depth++;
    // In Effects the canvas lights up (an image or a video becomes the source) instead of the reference overlay.
    if (inEffects()) $('#fxeViewport').classList.add('dragover');
    else if (state.ui.view === 'vectors') $('#vxViewport').classList.add('dragover');
    else if (state.ui.view === 'video') $('#vdTimeline').classList.add('dragover');
    else if (state.ui.view === 'nodes') $('#ndCanvas').classList.add('dragover');
    else overlay.hidden = false;
  });
  window.addEventListener('dragleave', () => {
    depth = Math.max(0, depth - 1);
    if (!depth) reset();
  });
  window.addEventListener('dragover', e => {
    if (!relevant(e)) return;
    e.preventDefault();
  });
  window.addEventListener('dragend', reset);
  window.addEventListener('drop', e => {
    if (!relevant(e)) return;
    e.preventDefault();
    reset();
    const id = e.dataTransfer.getData('application/x-mhf-item');
    const item = id ? state.items.find(i => i.id === id) : null;
    const file = e.dataTransfer.files[0];
    if (inEffects()) {
      if (item) fxLoadItem(item);
      else if (file) fxLoadFile(file);
      return;
    }
    if (state.ui.view === 'vectors') {
      if (item) vxOpenItem(item);
      else if (file) vxLoadFile(file);
      return;
    }
    if (state.ui.view === 'video') {
      if (item && isVideo(item)) videoOpenItem(item);
      else if (file && /^video\//.test(file.type)) videoUploadFile(file);
      return;
    }
    if (state.ui.view === 'nodes') {
      // a node graph file opens as a graph; images still become references in Create
      const graphs = [...e.dataTransfer.files].filter(f => /\.json$/i.test(f.name) || f.type === 'application/json');
      if (graphs.length) { ndImportFiles(graphs); return; }
    }
    if (item) addRefFromItem(item);
    else if (e.dataTransfer.files.length) addRefFiles(e.dataTransfer.files);
  });
}

// ── Generation ──────────────────────────────────────────────────────────────

// Gemini models need the Gemini key; the open-source ones always work (Hugging Face's free GPUs need no key).
function ensureKey(model = currentModel()) {
  if (model?.provider === 'pollinations' || model?.free) return true;
  if (state.config?.hasKey) return true;
  openSettings('Add your Gemini API key first.');
  return false;
}

function composePrompt(userPrompt, style, refCount) {
  let prompt = userPrompt.trim();
  if (!prompt && refCount) prompt = 'Create a new, high-quality image based on the reference images.';
  if (style.prompt) prompt = `${prompt}\n\nStyle: ${style.prompt}`;
  return prompt.trim();
}

function generate() {
  if (!ensureKey()) return;
  const m = currentModel();
  if (!m) { toast('No model selected.', 'error'); return; }
  if (state.refs.some(r => r.status !== 'ready')) { toast('Wait until the references finish uploading.'); return; }
  const prompts = promptList();
  const refs = state.refs.map(r => ({ path: r.path, role: r.role }));
  if (!prompts.length && !refs.length) {
    toast('Describe what you want to create.');
    $('#promptInput').focus();
    return;
  }
  if (refs.length && m.refs === false) {
    toast(`${m.label} can’t use reference images – remove them or pick FLUX.2 klein or a Gemini model.`, 'error');
    return;
  }
  const total = Math.max(1, prompts.length) * state.ui.count;
  const btn = $('#generateBtn');
  if (total >= BIG_BATCH && !btn.classList.contains('confirming')) {
    btn.classList.add('confirming');
    $('#generateLabel').textContent = `${total} images? Click again`;
    setTimeout(() => { if (btn.classList.contains('confirming')) updateGenerateButton(); }, 4000);
    return;
  }
  updateGenerateButton();

  const style = STYLES.find(s => s.id === state.ui.style) || STYLES[0];
  const base = Date.now();
  const nodes = createNodeCompile();
  (prompts.length ? prompts : ['']).forEach((userPrompt, i) => {
    createBatch({
      model: m.id,
      prompt: [composePrompt(userPrompt, style, refs.length), nodes?.compiled.addition].filter(Boolean).join('\n\n'),
      nodes: nodes ? { graphId: nodes.graph.id, name: nodes.graph.name, chips: nodes.compiled.chips.slice(0, 12) } : undefined,
      userPrompt,
      style: style.id === 'none' ? null : style.label,
      styleId: style.id,
      aspectRatio: state.ui.aspectRatio,
      imageSize: m.sizes.length ? state.ui.imageSize : null,
      thinkingLevel: m.thinking?.length ? state.ui.thinkingLevel : null,
      refs,
    }, state.ui.count, new Date(base - i).toISOString()); // first line on top
  });
  $('#promptInput').placeholder = 'Describe what you want to create… (Ctrl+Enter = generate)';
  renderGallery();
  $('#gallery').scrollTo({ top: 0, behavior: 'smooth' });
}

function createBatch(payload, count, createdAt = new Date().toISOString()) {
  const id = `b${Date.now().toString(36)}${uid().slice(0, 5)}`;
  const batch = { id, createdAt, payload: { ...payload, batchId: id, batchCreatedAt: createdAt }, jobs: [] };
  for (let i = 0; i < count; i++) batch.jobs.push({ id: `${id}-${i}`, batch, index: i, status: 'queued', attempts: 0 });
  state.pending.set(id, batch);
  for (const job of batch.jobs) enqueue(job);
  return batch;
}

function enqueue(job) {
  state.queue.push(job);
  pump();
}

function pump() {
  const limit = state.config?.settings?.concurrency || 4;
  while (state.running < limit && state.queue.length) {
    const job = state.queue.shift();
    if (job.cancelled) continue;
    state.running++;
    runJob(job).finally(() => { state.running--; pump(); });
  }
  updateQueueInfo();
}

async function runJob(job) {
  for (;;) {
    if (job.cancelled) return;
    job.status = 'running';
    job.startedAt = Date.now();
    job.error = null;
    updateJobTile(job);
    try {
      const res = await api('/api/generate', { body: { ...job.batch.payload, index: job.index } });
      completeJob(job, res.items || []);
      return;
    } catch (err) {
      const info = err.info || { message: err.message };
      if (info.retryable && job.attempts < MAX_RETRIES && !job.cancelled) {
        job.attempts++;
        const wait = Math.min(info.retryAfterMs || 2500 * 2 ** (job.attempts - 1) + Math.random() * 1000, 90000);
        job.status = 'retrying';
        job.retryAt = Date.now() + wait;
        job.error = info;
        updateJobTile(job);
        await sleep(wait);
        continue;
      }
      job.status = 'error';
      job.error = info;
      updateJobTile(job);
      if (FREE_LIMIT_CODES.has(info.code)) refreshFreeAvailability();
      if (FATAL_CODES.has(info.code)) handleFatal(info);
      return;
    }
  }
}

let lastFatalAt = 0;
function handleFatal(info) {
  const cancelled = cancelQueued();
  if (Date.now() - lastFatalAt < 4000) return;
  lastFatalAt = Date.now();
  toastError({ info: { ...info, hint: `${info.hint || ''}${cancelled ? ` (cancelled ${cancelled} queued)` : ''}` } });
}

function completeJob(job, items) {
  job.status = 'done';
  removeJob(job);
  state.items.unshift(...items);
  renderGallery();
  updateSpend();
  schedulePoll();
}

function removeJob(job) {
  const batch = job.batch;
  batch.jobs = batch.jobs.filter(j => j !== job);
  if (!batch.jobs.length) state.pending.delete(batch.id);
  tiles.delete(job.id);
}

function cancelQueued() {
  const jobs = state.queue.splice(0);
  for (const job of jobs) {
    job.cancelled = true;
    removeJob(job);
  }
  if (jobs.length) renderGallery();
  updateQueueInfo();
  return jobs.length;
}

function cancelJob(job) {
  job.cancelled = true;
  state.queue = state.queue.filter(j => j !== job);
  removeJob(job);
  renderGallery();
  updateQueueInfo();
}

function retryJob(job) {
  Object.assign(job, { status: 'queued', attempts: 0, error: null, cancelled: false, startedAt: null });
  updateJobTile(job);
  enqueue(job);
}

function dismissJob(job) {
  removeJob(job);
  renderGallery();
}

function dismissErrors(batchId) {
  const batch = state.pending.get(batchId);
  if (!batch) return;
  for (const job of batch.jobs.filter(j => j.status === 'error')) removeJob(job);
  renderGallery();
}

function updateQueueInfo() {
  const queued = state.queue.length;
  const running = state.running;
  $('#queueInfo').textContent = running || queued ? `Generating ${running}${queued ? ` · ${queued} queued` : ''}` : '';
  $('#cancelQueueBtn').hidden = !queued;
}

function tick() {
  for (const batch of state.pending.values()) {
    for (const job of batch.jobs) if (job.status === 'running' || job.status === 'retrying') updateJobTile(job);
  }
}

async function enhancePrompt() {
  if (!ensureKey({ provider: 'gemini' })) return; // enhancing always runs on Gemini
  const input = $('#promptInput');
  const before = input.value;
  const lines = promptList();
  if (!lines.length) {
    toast('Write an idea first – short and in any language is fine.');
    input.focus();
    return;
  }
  if (state.refs.some(r => r.status !== 'ready')) { toast('Wait until the references finish uploading.'); return; }
  const btn = $('#enhanceBtn');
  btn.disabled = true;
  btn.classList.add('busy');
  try {
    const refs = state.refs.map(r => ({ path: r.path, role: r.role }));
    const results = await mapLimit(lines, 3, prompt => api('/api/enhance', { body: { prompt, refs } }));
    input.value = results.map(r => (state.ui.multi ? r.prompt.replace(/\s*\n+\s*/g, ' ') : r.prompt)).join('\n');
    autoresize();
    updateGenerateButton();
    toast('Prompt enhanced.', 'success', {
      duration: 9000,
      action: { label: 'Restore original', onClick: () => { input.value = before; autoresize(); updateGenerateButton(); } },
    });
  } catch (err) {
    toastError(err, 'Enhancing failed');
  } finally {
    btn.disabled = false;
    btn.classList.remove('busy');
  }
}

// ── Gallery ─────────────────────────────────────────────────────────────────

const batchInfo = src => ({
  model: src.model,
  prompt: src.prompt,
  userPrompt: src.userPrompt,
  style: src.style,
  styleId: src.styleId,
  aspectRatio: src.aspectRatio,
  imageSize: src.imageSize,
  thinkingLevel: src.thinkingLevel,
  effect: src.effect,
  refs: src.refs || [],
});

function collectBatches() {
  const map = new Map();
  for (const item of state.items) {
    const id = item.batchId || item.id;
    let batch = map.get(id);
    if (!batch) {
      batch = { id, createdAt: item.batchCreatedAt || item.createdAt, info: batchInfo(item), items: [], jobs: [] };
      map.set(id, batch);
    }
    batch.items.push(item);
  }
  for (const pending of state.pending.values()) {
    let batch = map.get(pending.id);
    if (!batch) {
      batch = { id: pending.id, createdAt: pending.createdAt, info: batchInfo(pending.payload), items: [], jobs: [] };
      map.set(pending.id, batch);
    }
    batch.jobs = pending.jobs;
  }
  const list = [...map.values()];
  for (const batch of list) batch.items.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

function matchesFilter(batch) {
  if (state.favoritesOnly && !batch.items.some(i => i.favorite)) return false;
  if (!state.query.trim()) return true;
  const q = norm(state.query.trim());
  return norm(`${batch.info.userPrompt} ${batch.info.prompt} ${modelLabel(batch.info.model)} ${styleLabel(batch.info) || ''}`).includes(q);
}

function renderGallery() {
  const gallery = $('#gallery');
  if (!state.config) return;
  if (state.ui.view === 'effects') {
    fxRenderStrip();
    return;
  }
  if (['vectors', 'nodes', 'video'].includes(state.ui.view)) return;
  // Either key is enough to start: Gemini, or Pollinations for the open-source models.
  const hasKey = state.config.hasKey || Boolean(state.config.pollinations?.hasKey || state.config.cloudflare?.hasKey);
  if (!hasKey && !state.items.length && !state.pending.size) {
    gallery.replaceChildren(renderOnboarding());
    state.shownItems = [];
    return;
  }
  const all = collectBatches();
  const filtered = all.filter(matchesFilter);
  const shown = filtered.slice(0, state.visibleBatches);
  const drive = state.config.drive || {};
  const pendingNote = drive.pending ? ` ${drive.pending} ${drive.pending === 1 ? 'image is' : 'images are'} waiting on this computer.` : '';
  let banner = null;
  if (!hasKey) {
    banner = h('div', { class: 'banner' }, icon('alert', 18),
      h('span', { class: 'banner-text' }, 'API key missing – generation won’t work without it.'),
      h('button', { type: 'button', class: 'btn small primary', onclick: () => openSettings() }, 'Add key'));
  } else if (!drive.connected) {
    banner = h('div', { class: 'banner' }, icon('cloudUp', 18),
      h('span', { class: 'banner-text' }, `Images are saved only to Google Drive, which isn’t connected yet.${pendingNote}`),
      h('button', {
        type: 'button',
        class: 'btn small primary',
        onclick: () => (drive.configured ? location.assign('/oauth/start') : openSettings('Add the OAuth client and connect Google Drive.')),
      }, 'Connect Google Drive'));
  } else if (drive.error && drive.pending) {
    banner = h('div', { class: 'banner' }, icon('alert', 18),
      h('span', { class: 'banner-text' }, `Uploading to Google Drive is failing: ${drive.error}${pendingNote}`),
      h('button', { type: 'button', class: 'btn small', onclick: syncDrive }, 'Retry'));
  }

  let content;
  if (!all.length) content = renderWelcome();
  else if (!filtered.length) {
    content = h('div', { class: 'empty' },
      h('h2', null, 'Nothing found'),
      h('p', { class: 'muted' }, state.favoritesOnly ? 'You don’t have any favorite images yet (the star on an image).' : 'Try a different search.'));
  } else {
    content = [
      shown.map(renderBatch),
      filtered.length > shown.length && h('button', {
        type: 'button',
        class: 'btn ghost load-more',
        onclick: () => { state.visibleBatches += PAGE_SIZE; renderGallery(); },
      }, `Load older (${filtered.length - shown.length})`),
    ];
  }
  gallery.replaceChildren(...[banner, content].flat(Infinity).filter(Boolean));
  state.shownItems = shown.flatMap(b => (state.favoritesOnly ? b.items.filter(i => i.favorite) : b.items));
}

function renderBatch(batch) {
  const info = batch.info;
  const items = state.favoritesOnly ? batch.items.filter(i => i.favorite) : batch.items;
  const jobs = state.favoritesOnly ? [] : batch.jobs;
  const cost = items.reduce((sum, i) => sum + (i.cost || 0), 0);
  const isEffect = ['effects', 'vectors', 'video-edit', 'gemini-omni-1.1-flash'].includes(info.model); // nothing to generate again with image settings
  const first = batch.items[0];
  const pills = (isVideo(first) ? [
    modelLabel(info.model),
    first.resolution,
    first.aspectRatio !== 'auto' && first.aspectRatio,
    first.duration && `${first.duration.toFixed(1)} s`,
    info.nodes?.name,
  ] : isEffect ? [
    modelLabel(info.model),
    info.model === 'vectors' && 'SVG',
    info.effect?.palette,
    batch.items[0]?.width && `${batch.items[0].width}×${batch.items[0].height}`,
  ] : [
    modelLabel(info.model),
    !info.aspectRatio || info.aspectRatio === 'auto' ? 'Auto ratio' : info.aspectRatio,
    info.imageSize && (SIZE_LABELS[info.imageSize] || info.imageSize),
    info.thinkingLevel && `${THINKING_LABELS[info.thinkingLevel] || info.thinkingLevel} thinking`,
    styleLabel(info),
    info.refs.length && pluralRefs(info.refs.length),
  ]).filter(Boolean);

  return h('article', { class: 'batch' },
    h('header', { class: 'batch-head' },
      h('div', { class: 'batch-text' },
        h('p', { class: 'batch-prompt', title: info.prompt || '' }, info.userPrompt || 'No prompt – references only'),
        h('div', { class: 'batch-meta' },
          pills.map(p => h('span', { class: 'pill' }, p)),
          h('span', { class: 'batch-time' }, relTime(batch.createdAt)),
          cost > 0 && h('span', { class: 'batch-cost', title: priceNote() }, `≈ ${fmtPrice(cost)}`))),
      h('div', { class: 'batch-actions' },
        !isEffect && iconBtn('layers', 'Load settings and prompt into the panel', () => reuseSettings(info)),
        !isEffect && iconBtn('refresh', 'Generate again', () => rerun(info, Math.max(1, batch.items.length + batch.jobs.length))),
        iconBtn('copy', 'Copy prompt', () => copyText(info.userPrompt || info.prompt)),
        jobs.some(j => j.status === 'error') && iconBtn('x', 'Dismiss error tiles', () => dismissErrors(batch.id)),
        batch.items.length > 0 && confirmIconBtn('trash', 'Delete the whole set', () => deleteItems(batch.items.map(i => i.id))))),
    h('div', { class: 'tiles' }, items.map(tileForItem), jobs.map(tileForJob)));
}

function tileForItem(item) {
  let el = tiles.get(item.id);
  if (!el) {
    el = buildItemTile(item);
    tiles.set(item.id, el);
  }
  el.classList.toggle('is-fav', Boolean(item.favorite));
  el.classList.toggle('is-pending', Boolean(item.pending));
  el.querySelector('.tile-cloud').title = item.uploadError
    ? `Upload to Google Drive hasn’t succeeded yet: ${item.uploadError}`
    : 'Waiting to be uploaded to Google Drive';
  return el;
}

function buildItemTile(item) {
  if (isVideo(item)) return buildVideoTile(item);
  const ratio = item.width && item.height ? item.width / item.height : ratioValue(item.aspectRatio);
  const img = h('img', { src: thumbUrl(item), alt: item.userPrompt || '', loading: 'lazy', decoding: 'async', draggable: 'true' });
  if (!item.thumb) img.addEventListener('load', () => makeThumb(item, img), { once: true });
  img.addEventListener('click', () => openLightbox(item.id));
  img.addEventListener('dragstart', e => {
    e.dataTransfer.setData('application/x-mhf-item', item.id);
    e.dataTransfer.effectAllowed = 'copy';
  });
  return h('figure', { class: 'tile', style: `aspect-ratio:${clampRatio(ratio)}` },
    img,
    h('div', { class: 'tile-top' },
      h('span', { class: 'tile-cloud' }, icon('cloudUp', 15)),
      item.width && h('span', { class: 'tile-badge' }, `${item.width}×${item.height}`),
      iconBtn('star', 'Favorite', () => toggleFavorite(item), 'fav-btn')),
    h('div', { class: 'tile-actions' },
      iconBtn('wand', 'Open in Effects', () => fxOpenItem(item)),
      iconBtn('vector', isSvg(item) ? 'Edit in Vectors' : 'Vectorize in Vectors (Image Trace)', () => vxOpenItem(item)),
      !isSvg(item) && iconBtn('edit', 'Edit this image', () => editItem(item)),
      !isSvg(item) && iconBtn('imagePlus', 'Add as reference', () => addRefFromItem(item)),
      h('a', { class: 'icon-btn', href: `${mediaUrl(item)}?download=1`, download: fileName(item), title: 'Download', 'aria-label': 'Download', onclick: e => e.stopPropagation() }, icon('download')),
      confirmIconBtn('trash', 'Delete image', () => deleteItems([item.id]))));
}

// A video tile: the preview frame (made once from the clip), its length, and the actions for clips.
function buildVideoTile(item) {
  const ratio = item.width && item.height ? item.width / item.height : ratioValue(item.aspectRatio);
  const media = item.thumb
    ? h('img', { src: thumbUrl(item), alt: item.userPrompt || '', loading: 'lazy', decoding: 'async', draggable: 'true' })
    : h('video', { src: `${mediaUrl(item)}#t=0.3`, muted: true, preload: 'metadata', playsinline: true, draggable: 'true' });
  if (!item.thumb) media.addEventListener('loadeddata', () => makeVideoThumb(item, media), { once: true });
  media.addEventListener('click', () => openLightbox(item.id));
  media.addEventListener('dragstart', e => { e.dataTransfer.setData('application/x-mhf-item', item.id); e.dataTransfer.effectAllowed = 'copy'; });
  return h('figure', { class: 'tile is-video', style: `aspect-ratio:${clampRatio(ratio)}` },
    media,
    h('span', { class: 'tile-play' }, icon('play', 22)),
    h('div', { class: 'tile-top' },
      h('span', { class: 'tile-cloud' }, icon('cloudUp', 15)),
      h('span', { class: 'tile-badge' }, item.duration ? `${item.duration.toFixed(1)} s` : 'Video'),
      iconBtn('star', 'Favorite', () => toggleFavorite(item), 'fav-btn')),
    h('div', { class: 'tile-actions' },
      iconBtn('film', 'Open in the Video editor', () => videoOpenItem(item)),
      iconBtn('wand', 'Open in Effects', () => fxOpenItem(item)),
      h('a', { class: 'icon-btn', href: `${mediaUrl(item)}?download=1`, download: fileName(item), title: 'Download', 'aria-label': 'Download', onclick: e => e.stopPropagation() }, icon('download')),
      confirmIconBtn('trash', 'Delete video', () => deleteItems([item.id]))));
}

// The preview frame of a clip, saved like an image thumbnail; the clip's length is noted if its file didn't say.
async function makeVideoThumb(item, video) {
  if (item.thumb || thumbing.has(item.id) || !video.videoWidth) return;
  thumbing.add(item.id);
  try {
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = h('canvas', { width: Math.round(video.videoWidth * scale), height: Math.round(video.videoHeight * scale) });
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (blob) item.thumb = (await api(`/api/history/${item.id}/thumb`, { body: { data: await blobToBase64(blob) } })).thumb;
    if (!item.duration && Number.isFinite(video.duration) && video.duration > 0) {
      item.duration = Math.round(video.duration * 1000) / 1000;
      api(`/api/history/${item.id}`, { method: 'PATCH', body: { duration: item.duration } }).catch(() => {});
    }
  } catch {
    // only an optimization
  } finally {
    thumbing.delete(item.id);
  }
}

// Gemini returns large images – for the gallery we save a light JPEG thumbnail (once, in the background).
async function makeThumb(item, img) {
  if (item.thumb || thumbing.has(item.id) || !img.naturalWidth) return;
  thumbing.add(item.id);
  try {
    const scale = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return;
    const res = await api(`/api/history/${item.id}/thumb`, { body: { data: await blobToBase64(blob) } });
    item.thumb = res.thumb;
  } catch {
    // the thumbnail is only an optimization
  } finally {
    thumbing.delete(item.id);
  }
}

function tileForJob(job) {
  let el = tiles.get(job.id);
  if (!el) {
    el = h('figure', { class: 'tile job', style: `aspect-ratio:${clampRatio(ratioValue(job.batch.payload.aspectRatio))}` });
    tiles.set(job.id, el);
    job.el = el;
  }
  updateJobTile(job);
  return el;
}

function updateJobTile(job) {
  const el = job.el;
  if (!el) return;
  if (job.status === 'error') {
    const e = job.error || {};
    el.classList.add('error');
    el.replaceChildren(h('div', { class: 'job-error' },
      icon('alert', 20),
      h('strong', null, e.message || 'Something went wrong.'),
      e.hint && h('p', null, e.hint),
      e.detail && e.detail !== e.hint && h('details', null, h('summary', null, 'Details'), h('code', null, e.detail)),
      h('div', { class: 'job-error-actions' },
        h('button', { type: 'button', class: 'btn small', onclick: () => retryJob(job) }, icon('refresh', 14), 'Try again'),
        h('button', { type: 'button', class: 'btn small ghost', onclick: () => dismissJob(job) }, 'Dismiss'))));
    return;
  }
  el.classList.remove('error');
  let status = el.querySelector('.job-status');
  if (!status) {
    // The elements are created once and only their text changes, so the spinner animation doesn’t jump.
    status = h('div', { class: 'job-status' },
      h('span', { class: 'spinner' }),
      h('span', { class: 'job-label' }),
      h('small', { class: 'job-note' }),
      h('button', { type: 'button', class: 'link-btn job-cancel', onclick: () => cancelJob(job) }, 'Cancel'));
    el.replaceChildren(h('div', { class: 'shimmer' }), status);
  }
  const secs = job.startedAt ? Math.floor((Date.now() - job.startedAt) / 1000) : 0;
  let label = `Generating · ${secs} s`;
  if (job.status === 'queued') label = 'Queued';
  if (job.status === 'retrying') label = `Retrying in ${Math.max(0, Math.ceil((job.retryAt - Date.now()) / 1000))} s (${job.attempts}/${MAX_RETRIES})`;
  status.querySelector('.spinner').classList.toggle('idle', job.status === 'queued');
  status.querySelector('.job-label').textContent = label;
  const note = status.querySelector('.job-note');
  note.textContent = job.status === 'retrying' ? job.error?.message || '' : '';
  note.hidden = !note.textContent;
  status.querySelector('.job-cancel').hidden = job.status !== 'queued';
}

function renderOnboarding() {
  const input = h('input', { type: 'password', placeholder: 'Paste your API key from AI Studio', spellcheck: 'false', 'aria-label': 'API key' });
  const button = h('button', { type: 'submit', class: 'btn primary' }, 'Save key');
  const cheapest = Math.min(0.0336, ...state.models.flatMap(m => (m.price ? Object.values(m.price.image) : [])));
  return h('div', { class: 'onboarding' },
    h('div', { class: 'onb-card' },
      h('span', { class: 'onb-badge' }, 'Welcome to hombresai'),
      h('h1', null, 'Connect your Gemini and generate images at scale'),
      h('p', { class: 'muted' }, 'The app runs only on your computer and sends requests straight to the Gemini API with your key. Generated images are saved to your Google Drive.'),
      h('ol', { class: 'onb-steps' },
        h('li', null, h('b', null, 'Create an API key'), ' in ', h('a', { href: 'https://aistudio.google.com/apikey', target: '_blank', rel: 'noopener noreferrer' }, 'Google AI Studio → API keys'), ' (the Create API key button).'),
        h('li', null, h('b', null, 'Enable billing (pay-as-you-go).'), ` Nano Banana image models aren’t in the Free Tier – click “Set up billing” on your project and link a card. You only pay for the images you generate, from ≈ ${fmtPrice(cheapest)} each.`),
        h('li', null, h('b', null, 'Paste the key here'), ' – it’s stored only on this PC, outside OneDrive.')),
      h('form', { class: 'key-row', onsubmit: e => { e.preventDefault(); saveKey(input.value, button); } }, input, button),
      h('p', { class: 'muted small onb-alt' },
        'No Google billing? The open-source models (FLUX, Z-Image) run with a free Pollinations key – ',
        h('a', { href: '#', onclick: e => { e.preventDefault(); openSettings(); } }, 'add it in Settings'),
        '.')));
}

function renderWelcome() {
  return h('div', { class: 'welcome' },
    h('h2', null, 'What shall we create?'),
    h('p', { class: 'muted' }, 'Write a prompt below (any language works), add references and pick how many images you want. Tip: “Enhance prompt” turns a short idea into a detailed brief. A few ideas to start with:'),
    h('div', { class: 'examples' }, EXAMPLES.map(ex => h('button', {
      type: 'button',
      class: 'example',
      onclick: () => {
        const input = $('#promptInput');
        input.value = ex.prompt;
        autoresize();
        updateGenerateButton();
        input.focus();
      },
    }, h('b', null, ex.title), h('span', null, ex.prompt)))));
}

function updateSpend() {
  const today = new Date().toDateString();
  let todaySum = 0;
  let todayCount = 0;
  let total = 0;
  for (const item of state.items) {
    total += item.cost || 0;
    if (new Date(item.createdAt).toDateString() === today) {
      todaySum += item.cost || 0;
      todayCount++;
    }
  }
  const el = $('#spendInfo');
  el.textContent = `Today ${todayCount} img · ≈ ${fmtPrice(todaySum)}`;
  el.title = `Estimate: ${priceNote()} History total ≈ ${fmtPrice(total)} for ${state.items.length} images. See your exact spend in Google AI Studio (Spend / Billing).`;
}

// ── Image actions ───────────────────────────────────────────────────────────

async function toggleFavorite(item) {
  const favorite = !item.favorite;
  item.favorite = favorite;
  tiles.get(item.id)?.classList.toggle('is-fav', favorite);
  if (state.lightbox) renderLightbox();
  try {
    await api(`/api/history/${item.id}`, { method: 'PATCH', body: { favorite } });
  } catch (err) {
    item.favorite = !favorite;
    tiles.get(item.id)?.classList.toggle('is-fav', !favorite);
    toastError(err);
  }
  if (state.favoritesOnly) renderGallery();
}

async function deleteItems(ids) {
  try {
    const res = await api('/api/history/delete', { body: { ids } });
    if (res.driveFailed) toast(`${res.driveFailed} ${res.driveFailed === 1 ? 'image' : 'images'} couldn’t be moved to the Google Drive trash – delete them there manually.`, 'error', { duration: 9000 });
  } catch (err) {
    toastError(err, 'Delete failed');
    return;
  }
  const gone = new Set(ids);
  state.items = state.items.filter(i => !gone.has(i.id));
  for (const id of ids) tiles.delete(id);
  if (state.lightbox) {
    const lb = state.lightbox;
    lb.list = lb.list.filter(i => !gone.has(i.id));
    if (!lb.list.length) closeLightbox();
    else {
      lb.idx = Math.min(lb.idx, lb.list.length - 1);
      renderLightbox();
    }
  }
  renderGallery();
  updateSpend();
}

async function editItem(item) {
  clearRefs();
  state.ui.aspectRatio = 'auto';
  saveUi();
  renderRatios();
  const input = $('#promptInput');
  input.value = '';
  input.placeholder = 'Describe what to change in the image… (e.g. “change the background to Prague at night”)';
  autoresize();
  updateGenerateButton();
  input.focus();
  await addRefFromItem(item, 'edit');
}

function reuseSettings(info) {
  if (state.models.some(m => m.id === info.model)) state.ui.model = info.model;
  else toast('The original model is no longer available – keeping the current one.');
  state.ui.aspectRatio = info.aspectRatio || 'auto';
  if (info.imageSize) state.ui.imageSize = info.imageSize;
  if (info.thinkingLevel) state.ui.thinkingLevel = info.thinkingLevel;
  state.ui.style = STYLES.some(s => s.id === info.styleId) ? info.styleId : 'none';
  state.ui.nodeGraph = info.nodes?.graphId && ndGraphById(info.nodes.graphId) ? info.nodes.graphId : null;
  normalizeUi();
  clearRefs();
  state.refs = (info.refs || []).map(r => ({
    id: uid(),
    status: 'ready',
    path: r.path,
    role: r.role || 'auto',
    heic: /\.hei[cf]$/i.test(r.path),
    url: /\.hei[cf]$/i.test(r.path) ? null : refUrl(r.path),
  }));
  const input = $('#promptInput');
  input.value = info.userPrompt || '';
  autoresize();
  renderPanel();
  input.focus();
}

function rerun(info, count) {
  const model = state.models.find(m => m.id === info.model);
  if (!model) {
    toast('This model is no longer available. Use “Load settings” and pick another one.', 'error');
    return;
  }
  if (!ensureKey(model)) return;
  createBatch(batchInfo(info), count);
  renderGallery();
  $('#gallery').scrollTo({ top: 0, behavior: 'smooth' });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text || '');
    toast('Prompt copied.', 'success', { duration: 1800 });
  } catch {
    toast('Copying failed.', 'error');
  }
}

async function copyImage(item) {
  try {
    let blob = await (await fetch(mediaUrl(item))).blob();
    if (blob.type !== 'image/png') {
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast('Image copied to the clipboard.', 'success', { duration: 1800 });
  } catch {
    toast('Couldn’t copy the image.', 'error');
  }
}

async function openFolder() {
  try {
    const res = await api('/api/open-folder', { body: {} });
    if (res.url) window.open(res.url, '_blank', 'noopener');
    else toast('Google Drive isn’t connected yet – I opened the folder with images waiting on this computer.');
  } catch (err) {
    toastError(err);
  }
}

// ── Lightbox ────────────────────────────────────────────────────────────────

function openLightbox(id) {
  let list = [...state.shownItems];
  let idx = list.findIndex(i => i.id === id);
  if (idx < 0) { list = [...state.items]; idx = list.findIndex(i => i.id === id); }
  if (idx < 0) return;
  state.lightbox = { list, idx };
  $('#lightbox').hidden = false;
  renderLightbox();
}

function closeLightbox() {
  $('#lightbox').hidden = true;
  $('#lbImg').removeAttribute('src');
  const v = $('#lbVideo');
  v.pause();
  v.removeAttribute('src');
  v.load();
  state.lightbox = null;
}

function stepLightbox(delta) {
  const lb = state.lightbox;
  if (!lb || lb.list.length < 2) return;
  lb.idx = (lb.idx + delta + lb.list.length) % lb.list.length;
  renderLightbox();
}

function lbButton(name, label, onClick, extraClass = '') {
  return h('button', { type: 'button', class: `btn ghost ${extraClass}`.trim(), onclick: onClick }, icon(name, 16), label);
}

function renderLightbox() {
  const { list, idx } = state.lightbox;
  const item = list[idx];
  const img = $('#lbImg');
  const video = $('#lbVideo');
  img.hidden = isVideo(item);
  video.hidden = !isVideo(item);
  if (isVideo(item)) {
    img.removeAttribute('src');
    if (video.getAttribute('src') !== mediaUrl(item)) { video.src = mediaUrl(item); video.play().catch(() => {}); }
  } else {
    if (video.getAttribute('src')) { video.pause(); video.removeAttribute('src'); video.load(); }
    if (img.getAttribute('src') !== mediaUrl(item)) img.src = mediaUrl(item);
  }
  img.alt = item.userPrompt || '';
  $('#lbCounter').textContent = `${idx + 1} / ${list.length}`;
  $('#lbPrev').hidden = list.length < 2;
  $('#lbNext').hidden = list.length < 2;

  const deleteBtn = armConfirm(lbButton('trash', 'Delete', () => {}, 'danger'), 'Delete', () => deleteItems([item.id]));
  $('#lbActions').replaceChildren(...[
    h('a', { class: 'btn ghost', href: `${mediaUrl(item)}?download=1`, download: fileName(item) }, icon('download', 16), 'Download'),
    isVideo(item) && lbButton('film', 'Video editor', () => { closeLightbox(); videoOpenItem(item); }),
    !isVideo(item) && lbButton('clipboard', 'Copy', () => copyImage(item)),
    !isSvg(item) && !isVideo(item) && lbButton('edit', 'Edit', () => { closeLightbox(); editItem(item); }),
    !isSvg(item) && !isVideo(item) && lbButton('imagePlus', 'Use as reference', () => addRefFromItem(item)),
    lbButton('wand', 'Effects', () => { closeLightbox(); fxOpenItem(item); }),
    !isVideo(item) && lbButton('vector', isSvg(item) ? 'Edit in Vectors' : 'Vectorize', () => { closeLightbox(); vxOpenItem(item); }),
    !['effects', 'vectors', 'video-edit', 'gemini-omni-1.1-flash'].includes(item.model) && lbButton('layers', 'Load settings', () => { closeLightbox(); reuseSettings(item); }),
    lbButton('star', item.favorite ? 'Favorited' : 'Add to favorites', () => toggleFavorite(item), item.favorite ? 'active' : ''),
    deleteBtn,
  ].filter(Boolean));

  const rows = [
    ['Prompt', item.userPrompt || '—'],
    item.prompt && item.prompt !== item.userPrompt && ['Sent prompt', item.prompt],
    ['Model', modelLabel(item.model) + (item.via === 'cloudflare' ? ' · via Cloudflare Workers AI' : item.via === 'huggingface' ? ' · free on Hugging Face' : '')],
    ['Dimensions', item.width ? `${item.width} × ${item.height} px` : '—'],
    isVideo(item) && ['Length', item.duration ? `${item.duration.toFixed(1)} s` : '—'],
    item.resolution && ['Resolution', item.resolution],
    ['Ratio & resolution', [item.aspectRatio === 'auto' ? 'Auto' : item.aspectRatio, item.imageSize && SIZE_LABELS[item.imageSize]].filter(Boolean).join(' · ')],
    item.thinkingLevel && ['Thinking', THINKING_LABELS[item.thinkingLevel] || item.thinkingLevel],
    styleLabel(item) && ['Style', styleLabel(item)],
    item.nodes && ['Nodes', [item.nodes.name, ...(item.nodes.chips || [])].join(' · ')],
    ['Created', new Date(item.createdAt).toLocaleString('en-GB')],
    item.durationMs && ['Generation time', `${(item.durationMs / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })} s`],
    item.via === 'huggingface' ? ['Cost', 'Free (Hugging Face’s shared GPUs)'] : item.cost != null && ['Estimated cost', `≈ ${fmtPrice(item.cost)}`],
    item.text && ['Model reply', item.text],
    ['Saved', item.drive?.link
      ? h('a', { href: item.drive.link, target: '_blank', rel: 'noopener noreferrer' }, 'Open in Google Drive ↗')
      : `Waiting to be uploaded to Google Drive${item.uploadError ? ` (${item.uploadError})` : ''}`],
    ['File name', fileName(item)],
  ].filter(Boolean);
  const refs = item.refs || [];
  if (refs.length) {
    rows.push(['References', h('div', { class: 'lb-refs' }, refs.map((r, i) => (/\.hei[cf]$/i.test(r.path)
      ? h('span', { title: `Reference ${i + 1}` }, 'HEIC')
      : h('img', { src: refUrl(r.path), alt: `Reference ${i + 1}`, title: `Reference ${i + 1} · ${REF_ROLES.find(x => x.id === r.role)?.label || 'Auto'}` }))))]);
  }
  $('#lbInfo').replaceChildren(...rows.flatMap(([key, value]) => [h('dt', null, key), h('dd', null, value)]));
}

// ── Settings ────────────────────────────────────────────────────────────────

function openSettings(message) {
  const c = state.config;
  if (!c) return;
  renderKeyStatus();
  $('#keyInput').value = '';
  $('#keyInput').type = 'password';
  $('#concurrencyInput').value = c.settings.concurrency;
  $('#enhanceModelInput').value = c.settings.enhanceModel;
  $('#storeInput').checked = Boolean(c.settings.store);
  $('#vatInput').checked = Boolean(c.settings.vat);
  $('#fxInfo').textContent = `CNB rate: 1 USD = CZK ${c.fx.usdCzk.toLocaleString('en-GB', { maximumFractionDigits: 3 })} (${fxDate(c.fx.date)}). Updated automatically; prices are estimates.`;
  renderStaticPrices();
  $('#configPath').textContent = c.configFile;
  $('#outputPath').textContent = c.dataDir;
  $('#driveClientId').value = c.drive.clientId || '';
  $('#driveClientSecret').value = '';
  $('#driveClientSecret').placeholder = c.drive.configured ? '•••••••• (saved)' : 'GOCSPX-…';
  $('#driveClientBox').open = !c.drive.configured;
  renderDriveStatus();
  $('#pollKeyInput').value = '';
  renderPollStatus();
  $('#cfAccountInput').value = '';
  $('#cfTokenInput').value = '';
  renderCloudflareStatus();
  $('#hfTokenInput').value = '';
  renderHfStatus();
  loadFreeModels();
  renderMcpSetup();
  $('#settingsMsg').textContent = message || '';
  $('#settingsMsg').className = 'settings-msg';
  $('#toasts').replaceChildren();
  $('#settingsModal').hidden = false;
  setTimeout(() => (c.hasKey ? $('#settingsSave') : $('#keyInput')).focus(), 30);
}

function closeSettings() {
  $('#settingsModal').hidden = true;
}

function renderDriveStatus() {
  const d = state.config.drive;
  const waiting = d.pending ? ` ${d.pending} ${d.pending === 1 ? 'image is' : 'images are'} waiting to upload.` : '';
  $('#driveStatus').replaceChildren(d.connected
    ? h('span', { class: 'ok' }, `✓ Connected${d.email ? ` as ${d.email}` : ''}.${waiting}`)
    : h('span', { class: 'warn' }, `${d.configured ? 'Google Drive isn’t connected.' : 'Google Drive isn’t connected – add the OAuth client below first.'}${waiting}`),
  d.connected && d.error ? h('span', { class: 'warn' }, ` Last error: ${d.error}`) : '');
  const connect = $('#driveConnect');
  connect.textContent = d.connected ? 'Reconnect' : 'Connect Google Drive';
  connect.classList.toggle('primary', !d.connected);
  connect.classList.toggle('ghost', d.connected);
  $('#driveDisconnect').hidden = !d.connected;
  $('#openFolderBtn2').hidden = !d.folderUrl;
}

async function connectDrive() {
  const clientId = $('#driveClientId').value.trim();
  const clientSecret = $('#driveClientSecret').value.trim();
  if (clientId !== (state.config.drive.clientId || '') || clientSecret) {
    try {
      state.config = await api('/api/config', { body: { driveClientId: clientId, driveClientSecret: clientSecret } });
    } catch (err) {
      notifyError(err, 'Couldn’t save the OAuth client');
      return;
    }
  }
  if (!state.config.drive.configured) {
    $('#driveClientBox').open = true;
    notify('Enter the OAuth Client ID and Client secret.', 'error');
    return;
  }
  location.assign('/oauth/start');
}

async function disconnectDrive() {
  try {
    state.config = await api('/api/drive/disconnect', { body: {} });
    renderDriveStatus();
    renderGallery();
    notify('Google Drive disconnected. New images will wait on this computer until you connect it again.');
  } catch (err) {
    notifyError(err);
  }
}

function renderKeyStatus() {
  const c = state.config;
  $('#keyStatus').replaceChildren(c.hasKey
    ? h('span', { class: 'ok' }, c.keySource === 'env' ? `✓ Using the key from an environment variable (${c.keyHint}).` : `✓ Key saved (${c.keyHint}).`)
    : h('span', { class: 'warn' }, 'No key set yet.'));
  $('#keyRemove').hidden = c.keySource !== 'config';
}

async function saveKey(value, button) {
  const key = String(value || '').trim();
  if (!key) { notify('Paste an API key.', 'error'); return false; }
  if (button) button.disabled = true;
  try {
    state.config = await api('/api/config', { body: { apiKey: key } });
    notify('API key saved and verified ✓', 'success');
    $('#keyInput').value = '';
    renderKeyStatus();
    await loadModels();
    pump();
    return true;
  } catch (err) {
    notifyError(err, 'Couldn’t save the key');
    return false;
  } finally {
    if (button) button.disabled = false;
  }
}

async function removeKey() {
  try {
    state.config = await api('/api/config', { body: { apiKey: '' } });
    renderKeyStatus();
    renderGallery();
    notify('The saved key was removed.');
  } catch (err) {
    notifyError(err);
  }
}

async function saveSettings() {
  const pendingKey = $('#keyInput').value.trim();
  const newPollKey = $('#pollKeyInput').value.trim();
  if (pendingKey && !(await saveKey(pendingKey, $('#keySave')))) return;
  try {
    state.config = await api('/api/config', {
      body: {
        concurrency: Number($('#concurrencyInput').value),
        enhanceModel: $('#enhanceModelInput').value,
        store: $('#storeInput').checked,
        vat: $('#vatInput').checked,
        driveClientId: $('#driveClientId').value.trim(),
        driveClientSecret: $('#driveClientSecret').value.trim(),
        ...(newPollKey ? { pollinationsKey: newPollKey } : {}),
      },
    });
    if (newPollKey) await loadModels();
    closeSettings();
    toast('Settings saved.', 'success', { duration: 2000 });
    renderPanel();
    renderGallery();
    updateSpend();
    pump();
  } catch (err) {
    notifyError(err);
  }
}

function renderPollStatus() {
  const p = state.config.pollinations || {};
  let status;
  if (!p.hasKey) {
    status = h('span', { class: 'warn' }, 'Not connected yet – the open-source models and the free AI coder need a key.');
  } else if (p.verified) {
    const pollen = p.balance != null ? `${Number(p.balance).toLocaleString('en-GB', { maximumFractionDigits: 2 })} pollen left` : null;
    const details = [p.keyName && `key “${p.keyName}”`, pollen].filter(Boolean).join(' · ');
    const limits = [!p.images && 'image models', !p.text && 'text models (AI coder)'].filter(Boolean);
    status = h('span', { class: limits.length ? 'warn' : 'ok' },
      `✓ Connected to Pollinations (${p.keyHint})${details ? ` · ${details}` : ''}.`,
      limits.length ? ` This key isn’t allowed to use ${limits.join(' or ')} – allow them in the key’s settings on enter.pollinations.ai.` : ' Open-source models and the free AI coder are ready.');
  } else {
    status = h('span', { class: 'ok' }, `✓ Key saved (${p.keyHint}). Pollinations couldn’t be reached to check it – it’s checked on first use.`);
  }
  $('#pollStatus').replaceChildren(status);
  $('#pollKeyRemove').hidden = !p.hasKey;
}

// /?settings=pollinations opens Settings right at the Pollinations key (the quickest way to connect the free models).
function handleSettingsLink() {
  const section = new URLSearchParams(location.search).get('settings');
  if (!section) return;
  history.replaceState(null, '', '/');
  openSettings(section === 'pollinations' ? 'Copy your secret key (sk_…) on enter.pollinations.ai, then click Paste & connect.' : '');
  if (section === 'pollinations') {
    setTimeout(() => {
      const input = $('#pollKeyInput');
      input.scrollIntoView({ block: 'center' });
      input.focus();
    }, 60);
  }
}

// The key the user just copied on enter.pollinations.ai – one click instead of paste + save.
async function pastePollKey() {
  let text = '';
  try {
    text = (await navigator.clipboard.readText()).trim();
  } catch {
    notify('The browser didn’t allow reading the clipboard – paste the key into the field with Ctrl+V and press Enter.', 'error');
    $('#pollKeyInput').focus();
    return;
  }
  if (!/^sk_\S{8,}$/.test(text)) {
    notify('The clipboard doesn’t hold a Pollinations secret key (sk_…). Copy the key on enter.pollinations.ai first, then click again.', 'error');
    return;
  }
  $('#pollKeyInput').value = text;
  await savePollKey();
}

async function savePollKey() {
  const key = $('#pollKeyInput').value.trim();
  if (!key) { notify('Paste your Pollinations key first.', 'error'); return; }
  const btn = $('#pollKeySave');
  btn.disabled = true;
  notify('Checking the key with Pollinations…');
  try {
    state.config = await api('/api/config', { body: { pollinationsKey: key } });
    $('#pollKeyInput').value = '';
    renderPollStatus();
    notify(state.config.pollinations.verified
      ? 'Connected ✓ The open-source models and the free AI coder are ready.'
      : 'Pollinations key saved ✓', 'success');
    if (fxs.inited) fxReloadEffects({ quiet: true }); // the AI coder list depends on the key
    await loadModels();
  } catch (err) {
    notifyError(err, 'Couldn’t save the key');
  } finally {
    btn.disabled = false;
  }
}

async function removePollKey() {
  try {
    state.config = await api('/api/config', { body: { pollinationsKey: '' } });
    renderPollStatus();
    notify('The Pollinations key was removed.');
    await loadModels();
  } catch (err) {
    notifyError(err);
  }
}

// How to connect Claude (the MCP server in mcp/hombresai-mcp.js), with this computer's paths filled in.
function renderMcpSetup() {
  const m = state.config.mcp;
  if (!m) return;
  $('#mcpCodeCmd').textContent = `claude mcp add --scope user hombresai -- node "${m.script}"`;
  $('#mcpDesktopCfg').textContent = JSON.stringify({ mcpServers: { hombresai: { command: m.node, args: [m.script] } } }, null, 2);
}

// Cloudflare Workers AI: the free backup that runs the open-source models while Pollinations can't.
function renderCloudflareStatus() {
  const c = state.config.cloudflare || {};
  $('#cfStatus').replaceChildren(c.hasKey
    ? h('span', { class: 'ok' }, `✓ Connected to Cloudflare (account ${c.accountHint}, token ${c.tokenHint}). The open-source models switch to it whenever Pollinations can’t serve them.`)
    : h('span', { class: 'warn' }, 'Not connected – optional, but it keeps the free models working while Pollinations is down.'));
  $('#cfRemove').hidden = !c.hasKey;
}

async function saveCloudflare() {
  const accountId = $('#cfAccountInput').value.trim();
  const token = $('#cfTokenInput').value.trim();
  if (!accountId || !token) { notify('Paste both the Account ID and the API token.', 'error'); return; }
  const btn = $('#cfSave');
  btn.disabled = true;
  notify('Checking with Cloudflare…');
  try {
    state.config = await api('/api/config', { body: { cloudflareAccountId: accountId, cloudflareToken: token } });
    $('#cfAccountInput').value = '';
    $('#cfTokenInput').value = '';
    renderCloudflareStatus();
    notify('Connected ✓ The free models now fall back to Cloudflare when Pollinations can’t serve them.', 'success');
    if (fxs.inited) fxReloadEffects({ quiet: true });
    await loadModels();
  } catch (err) {
    notifyError(err, 'Couldn’t connect Cloudflare');
  } finally {
    btn.disabled = false;
  }
}

async function removeCloudflare() {
  try {
    state.config = await api('/api/config', { body: { cloudflareAccountId: '', cloudflareToken: '' } });
    renderCloudflareStatus();
    notify('Cloudflare was disconnected.');
    await loadModels();
  } catch (err) {
    notifyError(err);
  }
}

// Hugging Face: the free open video models run on its shared GPUs – a token raises the daily GPU time from 2 to 5 minutes.
// ── Free open-source models (Settings) ───────────────────────────────────────

const FREE_GROUPS = [['image', 'Images'], ['video', 'Videos'], ['code', 'Code – effects and SVG']];
const FREE_USE = { menu: 'in the menu', 'built-in': 'built in', connect: 'connect Cloudflare', list: 'listed only' };
const FREE_STATE = { works: 'works ✓', untested: 'not tried yet', broken: 'broken – hidden' };

async function loadFreeModels() {
  try {
    renderFreeModels(await api('/api/free-models'));
  } catch (err) {
    $('#freeStatus').replaceChildren(h('span', { class: 'warn' }, errorText(err)));
  }
}

function renderFreeModels(f) {
  const total = FREE_GROUPS.reduce((n, [k]) => n + (f.groups[k]?.length || 0), 0);
  $('#freeStatus').replaceChildren(
    f.searching ? h('span', {}, 'Searching…')
      : f.testing ? h('span', {}, 'Trying out the new models…')
      : f.updatedAt ? h('span', { class: 'ok' }, `✓ ${total} free models, searched ${relTime(f.updatedAt)}.`)
      : h('span', { class: 'warn' }, 'Not searched yet – it runs a little after the app starts, or click Search now.'),
    ...(f.error ? [h('span', { class: 'warn' }, ` The last search failed: ${f.error}`)] : []));
  $('#freeRefresh').disabled = f.searching;
  $('#freeLists').replaceChildren(...FREE_GROUPS.map(([kind, title]) => {
    const rows = f.groups[kind] || [];
    return h('details', { class: 'free-group', open: kind === 'image' },
      h('summary', {}, `${title} (${rows.length})`),
      rows.length ? h('ol', { class: 'free-list' }, ...rows.map(r => h('li', {},
        h('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer', title: r.model }, r.label),
        h('span', { class: 'muted' }, ` · ${r.where} · ${r.licenseNote || r.license}${r.comfy ? ' · in ComfyUI' : ''}${r.role === 'svg' ? ' · SVG only' : ''}`),
        h('span', { class: `free-use ${r.use}` }, FREE_USE[r.use] || r.use),
        r.state && h('span', { class: `free-state ${r.state}`, title: r.error || '' }, FREE_STATE[r.state]))))
        : h('p', { class: 'muted small' }, 'None found.'));
  }));
}

async function searchFreeModels() {
  const btn = $('#freeRefresh');
  btn.disabled = true;
  $('#freeStatus').replaceChildren(h('span', {}, 'Searching Hugging Face, Pollinations and Cloudflare… (about 10–60 s)'));
  try {
    const f = await api('/api/free-models/refresh', { body: {} });
    renderFreeModels(f);
    if (!f.error) {
      notify('The free models are up to date – the new image models are being tried out now.', 'success');
      setTimeout(loadFreeModels, 20000);
      loadModels();
      if (typeof fxs !== 'undefined') api('/api/effects').then(r => { fxs.coder = r.coder || fxs.coder; }).catch(() => {});
      if (typeof vx !== 'undefined') api('/api/effects').then(r => { vx.coders = r.coder?.vectorModels || r.coder?.models || vx.coders; }).catch(() => {});
    }
  } catch (err) {
    notifyError(err, 'Couldn’t search for free models');
  } finally {
    btn.disabled = false;
  }
}

function renderHfStatus() {
  const c = state.config.huggingface || {};
  $('#hfStatus').replaceChildren(c.hasToken
    ? h('span', { class: 'ok' }, `✓ Signed in as ${c.user || 'your account'} (token ${c.tokenHint}) – 5 minutes of free GPU time a day.`)
    : h('span', { class: 'warn' }, 'No token – the free video models still work, with 2 minutes of GPU time a day.'));
  $('#hfRemove').hidden = !c.hasToken;
}

async function saveHfToken() {
  const token = $('#hfTokenInput').value.trim();
  if (!token) { notify('Paste the token first.', 'error'); return; }
  const btn = $('#hfSave');
  btn.disabled = true;
  notify('Checking with Hugging Face…');
  try {
    state.config = await api('/api/config', { body: { hfToken: token } });
    $('#hfTokenInput').value = '';
    renderHfStatus();
    notify('Connected ✓ The free video models now have 5 minutes of GPU time a day.', 'success');
  } catch (err) {
    notifyError(err, 'Couldn’t save the Hugging Face token');
  } finally {
    btn.disabled = false;
  }
}

async function removeHfToken() {
  try {
    state.config = await api('/api/config', { body: { hfToken: '' } });
    renderHfStatus();
    notify('The Hugging Face token was removed.');
  } catch (err) {
    notifyError(err);
  }
}

// ── Views (left rail) ───────────────────────────────────────────────────────

function applyRail() {
  const hidden = Boolean(state.ui.railHidden);
  document.body.classList.toggle('rail-hidden', hidden);
  const btn = $('#railToggle');
  const label = hidden ? 'Show the sidebar' : 'Hide the sidebar';
  btn.title = label;
  btn.setAttribute('aria-label', label);
  btn.setAttribute('aria-expanded', String(!hidden));
}

// The view glides in with the intro's ease (styles.css – Motion); the class leaves once the wave has passed,
// so later re-renders inside the view don't replay it.
let lastView = null;
function animateEnter(el) {
  if (!el) return;
  el.classList.remove('view-enter');
  void el.offsetWidth; // restart the animation
  el.classList.add('view-enter');
  clearTimeout(el._enterTimer);
  el._enterTimer = setTimeout(() => el.classList.remove('view-enter'), 900);
}

function setView(view) {
  state.ui.view = VIEWS.includes(view) ? view : 'create';
  saveUi();
  if (state.ui.view !== lastView) {
    lastView = state.ui.view;
    animateEnter($(state.ui.view === 'create' ? '#createView' : `#${state.ui.view}View`));
    if (state.ui.view === 'create') animateEnter($('#panel'));
  }
  for (const v of VIEWS) document.body.classList.toggle(`view-${v}`, state.ui.view === v);
  for (const btn of document.querySelectorAll('.rail-btn')) {
    const active = btn.dataset.view === state.ui.view;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  }
  fxOnView(state.ui.view === 'effects');
  vxOnView(state.ui.view === 'vectors');
  ndOnView(state.ui.view === 'nodes');
  if (typeof videoOnView === 'function') videoOnView(state.ui.view === 'video');
  renderGallery();
}
