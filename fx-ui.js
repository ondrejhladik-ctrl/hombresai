'use strict';

// Effects view – an effect studio: the effect gallery (left), the live canvas (centre) and the controls (right).
// Effects run on the GPU (fx-engine.js) on images, videos and the camera. New effects are written by a free
// open-source AI coder (through Pollinations) or by hand in the code editor, and saved to effects/custom/.
// Uses the helpers of app.js (h, icon, api, toast…) – they are looked up only when a function runs.

const FX_CATEGORY_ORDER = ['Mine', 'Pixel', 'Dither', 'Print', 'Lines', 'Text', 'Color', 'Glitch', 'Edges', 'Distort'];
const FX_EXPORT_SCALES = [1, 2, 4];
const FX_VIDEO_SIDES = [3840, 1920, 1280, 854];
const FX_VIDEO_LABELS = { 3840: '4K', 1920: '1080p', 1280: '720p', 854: '480p' };
const FX_CLIP_SECONDS = [3, 5, 10];
const FX_ZOOMS = [0.25, 0.5, 1, 2, 4];
const FX_FORMATS = { png: ['image/png', 'png'], jpeg: ['image/jpeg', 'jpg'], webp: ['image/webp', 'webp'] };
const FX_AI_EXAMPLES = [
  'Old thermal camera with a slow scanning line and false colors',
  'Stained glass with dark lead lines between the colored cells',
  'Retro LCD screen with chunky square pixels and a green tint',
  'Ink that bleeds outward from the dark areas like wet paper',
  'Hologram with flickering cyan scan lines and color fringes',
];

const fxs = {
  inited: false,
  engine: null,
  error: '',
  lost: false,
  effects: new Map(),   // id -> parsed effect (built-in and custom)
  cards: [],            // gallery entries – an effect or one of its presets
  current: null,        // the effect on the canvas: { key, card, effect, program, name, description, custom, draft, saveId }
  params: {},           // slider values by uniform name
  look: null,           // { palette, custom, adjust, finish }
  source: null,         // { kind: 'image' | 'video' | 'camera', el, name, itemId, width, height, url, stream }
  design: { width: FX_DESIGN_LONG, height: FX_DESIGN_LONG },
  pendingItem: null,    // gallery image to open once the view is ready
  loadToken: 0,
  zoom: 'fit',
  compare: false,
  category: 'All',
  query: '',
  raf: 0,
  started: performance.now(),
  thumbToken: 0,
  stripKey: '',
  coder: { models: [], pollinations: false, gemini: false },
  busy: null,           // { label, ownsCanvas, cancel } while rendering an export
  recorder: null,       // camera recording
  recordSize: null,
  sections: {},         // open / closed state of the inspector sections
  stack: [],            // effects layered on top of the main one: { id, key, card, effect, program, params, enabled }
  editing: null,        // id of the layer whose sliders are shown (null = the main effect)
  exportScale: 2,
  exportFormat: 'png',
  videoSide: 1920,
  clipSeconds: 5,
  exportAudio: true,
  aiMode: 'new',
  wasPlaying: false,
  keyframes: [],        // video timeline: [{ id, time, snap }] sorted by time; each is a hard-switch look
  activeKf: null,       // keyframe shown in the editor / applied live
  appliedKf: null,      // keyframe currently loaded into the live look (apply only when it changes)
  sourceFormat: null,   // the imported file's format, so export matches it
  openMenu: false,
};

// The video shown by default, so Effects always has something to work on (bundled in public/samples/).
const FX_SAMPLE_VIDEO = '/samples/sample.mp4';

const fxActive = () => fxs.inited && Boolean(fxs.engine) && state.ui.view === 'effects' && !document.hidden;

// ── View lifecycle ──────────────────────────────────────────────────────────

function fxOnView(active) {
  if (!active) {
    if (fxs.recorder) fxToggleRecord();
    if (fxs.source?.kind === 'camera') fxReleaseSource({ ui: true }); // the camera never stays on in the background
    else if (fxs.source?.kind === 'video') {
      fxs.wasPlaying = !fxs.source.el.paused;
      fxs.source.el.pause();
    }
    return;
  }
  if (!fxs.inited) {
    fxInit();
    return;
  }
  if (!fxs.engine) return;
  if (fxs.source?.kind === 'video' && fxs.wasPlaying) fxs.source.el.play().catch(() => {});
  if (fxs.pendingItem) fxConsumePending();
  else if (!fxs.source) fxLoadDefault();
  fxRenderStrip();
  fxReloadEffects({ quiet: true });
  fxRequestRender();
}

async function fxInit() {
  fxs.inited = true;
  const saved = state.ui.fx || {};
  if (typeof saved.category === 'string') fxs.category = saved.category;
  if (FX_EXPORT_SCALES.includes(saved.exportScale)) fxs.exportScale = saved.exportScale;
  if (FX_FORMATS[saved.exportFormat]) fxs.exportFormat = saved.exportFormat;
  if (FX_VIDEO_SIDES.includes(saved.videoSide)) fxs.videoSide = saved.videoSide;
  if (FX_CLIP_SECONDS.includes(saved.clipSeconds)) fxs.clipSeconds = saved.clipSeconds;
  if (typeof saved.exportAudio === 'boolean') fxs.exportAudio = saved.exportAudio;
  const canvas = $('#fxeCanvas');
  try {
    fxs.engine = new FxEngine(canvas);
  } catch (err) {
    fxs.error = err.message;
    fxShowError();
    return;
  }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fxs.lost = true; });
  canvas.addEventListener('webglcontextrestored', fxRestoreContext);
  if (window.ResizeObserver) new ResizeObserver(() => fxRequestRender()).observe($('#fxeViewport'));
  fxRenderInspector();
  if (await fxReloadEffects()) {
    fxs.stack = (Array.isArray(saved.stack) ? saved.stack : []).map(s => fxMakeLayer(s.key, s.params, s.enabled)).filter(Boolean).slice(0, 6);
    fxSelect(saved.key || 'waveform', { restore: true });
  }
  if (fxs.pendingItem) fxConsumePending();
  else if (!fxs.source) fxLoadDefault();
  fxRenderStrip();
}

function fxRestoreContext() {
  try {
    fxs.engine = new FxEngine($('#fxeCanvas'));
  } catch (err) {
    fxs.error = err.message;
    fxShowError();
    return;
  }
  fxs.lost = false;
  if (fxs.source) fxs.engine.setSource(fxs.source.el);
  if (fxs.current) fxs.current.program = fxs.engine.compile(fxs.current.effect.source);
  fxQueueThumbs();
  fxRequestRender();
}

function fxShowError() {
  $('#fxeEmpty').replaceChildren(h('b', null, 'Effects can’t run here'), h('span', null, fxs.error));
  $('#fxeEmpty').hidden = false;
  $('#fxeCanvas').hidden = true;
  $('#fxeInspector').replaceChildren();
}

// Opens a gallery image in Effects (tile button, lightbox).
function fxOpenItem(item) {
  fxs.pendingItem = item;
  if (state.ui.view !== 'effects') setView('effects');
  else fxConsumePending();
}

function fxConsumePending() {
  if (!fxs.engine || !fxs.pendingItem) return;
  const item = fxs.pendingItem;
  fxs.pendingItem = null;
  fxLoadItem(item);
}

function fxBindEvents() {
  $('#fxeOpenBtn').addEventListener('click', e => { e.stopPropagation(); fxToggleOpenMenu(); });
  $('#fxeOpenFile').addEventListener('click', () => { fxCloseOpenMenu(); $('#fxeFileInput').click(); });
  document.addEventListener('click', e => { if (fxs.openMenu && !$('#fxeOpen')?.contains(e.target)) fxCloseOpenMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && fxs.openMenu) fxCloseOpenMenu(); });
  $('#fxeFileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) fxLoadFile(file);
    e.target.value = '';
  });
  $('#fxeAddKey').addEventListener('click', fxAddKeyframe);
  $('#fxeDelKey').addEventListener('click', fxDeleteActiveKeyframe);
  $('#fxeTrans').addEventListener('input', e => fxSetActiveTrans(Number(e.target.value) / 10));
  $('#fxeCameraBtn').addEventListener('click', fxToggleCamera);
  $('#fxeNewBtn').addEventListener('click', () => fxOpenAi('new'));
  $('#fxeSearch').addEventListener('input', e => { fxs.query = e.target.value; fxRenderCards(); });
  $('#fxeZoomIn').addEventListener('click', () => fxStepZoom(1));
  $('#fxeZoomOut').addEventListener('click', () => fxStepZoom(-1));
  $('#fxeZoomFit').addEventListener('click', () => fxSetZoom('fit'));

  const cmp = $('#fxeCompareBtn');
  const setCompare = on => {
    if (fxs.compare === on) return;
    fxs.compare = on;
    cmp.classList.toggle('active', on);
    fxRequestRender();
  };
  cmp.addEventListener('pointerdown', e => { e.preventDefault(); setCompare(true); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) cmp.addEventListener(ev, () => setCompare(false));
  cmp.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setCompare(true); } });
  cmp.addEventListener('keyup', () => setCompare(false));

  $('#fxePlay').addEventListener('click', () => {
    const v = fxs.source?.kind === 'video' ? fxs.source.el : null;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  });
  $('#fxeSeek').addEventListener('input', e => {
    const v = fxs.source?.kind === 'video' ? fxs.source.el : null;
    if (v?.duration) v.currentTime = (Number(e.target.value) / 1000) * v.duration;
  });
  $('#fxeMute').addEventListener('click', () => {
    const v = fxs.source?.kind === 'video' ? fxs.source.el : null;
    if (!v) return;
    v.muted = !v.muted;
    fxUpdateTransport();
  });
  $('#fxeBusyCancel').addEventListener('click', () => fxs.busy?.cancel?.());

  const aiModal = $('#fxeAiModal');
  $('#fxeAiClose').addEventListener('click', () => { aiModal.hidden = true; });
  aiModal.addEventListener('mousedown', e => { if (e.target === aiModal) aiModal.hidden = true; });
  aiModal.addEventListener('keydown', e => { if (e.key === 'Escape') aiModal.hidden = true; });
  $('#fxeAiGo').addEventListener('click', fxAiRun);
  $('#fxeAiPrompt').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); fxAiRun(); }
  });
  $('#fxeAiExamples').replaceChildren(...FX_AI_EXAMPLES.map(text => h('button', {
    type: 'button',
    class: 'chip-btn small',
    onclick: () => { $('#fxeAiPrompt').value = text; $('#fxeAiPrompt').focus(); },
  }, text)));

  const codeModal = $('#fxeCodeModal');
  const ta = $('#fxeCodeText');
  $('#fxeCodeClose').addEventListener('click', () => { codeModal.hidden = true; });
  codeModal.addEventListener('mousedown', e => { if (e.target === codeModal) codeModal.hidden = true; });
  codeModal.addEventListener('keydown', e => { if (e.key === 'Escape') codeModal.hidden = true; });
  $('#fxeCodeRun').addEventListener('click', fxCodeRun);
  $('#fxeCodeSave').addEventListener('click', fxCodeSave);
  $('#fxeCodeFix').addEventListener('click', fxCodeFix);
  ta.addEventListener('input', fxUpdateGutter);
  ta.addEventListener('scroll', () => { $('#fxeGutter').scrollTop = ta.scrollTop; });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      fxUpdateGutter();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      fxCodeRun();
    } else if (e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      fxCodeSave();
    }
  });

  // Effect files edited in another program (or by a coding agent) show up when you come back to the window.
  window.addEventListener('focus', () => {
    if (fxActive() && codeModal.hidden && !fxs.busy) fxReloadEffects({ quiet: true });
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) fxRequestRender(); });
  window.addEventListener('resize', fxRequestRender);
}

// ── Effects and cards ───────────────────────────────────────────────────────

async function fxReloadEffects({ quiet = false } = {}) {
  fxTransCache.clear(); // effects recompile – drop cached crossfade look-states
  let data;
  try {
    data = await api('/api/effects');
  } catch (err) {
    if (!quiet) toastError(err, 'Couldn’t load the effects');
    return false;
  }
  fxs.coder = data.coder || fxs.coder;
  const effects = new Map();
  for (const e of data.builtin || []) effects.set(e.id, fxParseEffect(e.source, { id: e.id, file: e.file, custom: false }));
  for (const e of data.custom || []) effects.set(e.id, fxParseEffect(e.source, { id: e.id, file: e.file, custom: true }));
  const same = effects.size === fxs.effects.size && [...effects].every(([id, e]) => fxs.effects.get(id)?.source === e.source);
  if (same) return true;
  fxs.effects = effects;
  fxs.cards = fxBuildCards();
  // layers follow edited effect files; layers of deleted effects disappear
  fxs.stack = fxs.stack.map(l => fxMakeLayer(l.key, l.params, l.enabled, l.id)).filter(Boolean);
  if (fxs.editing && !fxs.stack.some(l => l.id === fxs.editing)) fxs.editing = null;
  const cur = fxs.current;
  if (cur && !cur.draft) fxSelect(fxs.cards.some(c => c.key === cur.key) ? cur.key : fxs.cards[0]?.key, { keep: true });
  fxRenderLibrary();
  return true;
}

// ── Layers: effects stacked on top of the main one ──────────────────────────

function fxMakeLayer(key, params = null, enabled = true, id = uid()) {
  const card = fxs.cards.find(c => c.key === key);
  const effect = card && fxs.effects.get(card.effectId);
  if (!effect) return null;
  return {
    id,
    key,
    card,
    effect,
    program: fxs.engine.compile(effect.source),
    params: { ...fxDefaultParams(effect, card.preset), ...(params ? fxCoerceParams(effect, params) : {}) },
    enabled: enabled !== false,
  };
}

function fxLayersChanged() {
  fxPersist();
  fxSyncActiveKeyframe();
  fxRenderInspector();
  fxRequestRender();
}

function fxAddLayer(key) {
  const layer = fxMakeLayer(key);
  if (!layer || fxs.stack.length >= 6) return;
  fxs.stack.push(layer);
  fxs.editing = layer.id;
  fxLayersChanged();
}

function fxMoveLayer(id, dir) {
  const i = fxs.stack.findIndex(l => l.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= fxs.stack.length) return;
  [fxs.stack[i], fxs.stack[j]] = [fxs.stack[j], fxs.stack[i]];
  fxLayersChanged();
}

function fxRemoveLayer(id) {
  fxs.stack = fxs.stack.filter(l => l.id !== id);
  if (fxs.editing === id) fxs.editing = null;
  fxLayersChanged();
}

// The effect whose sliders the inspector shows – the main one or a layer.
function fxEditTarget() {
  const layer = fxs.editing ? fxs.stack.find(l => l.id === fxs.editing) : null;
  return layer
    ? { effect: layer.effect, params: layer.params, name: layer.card.name, layer }
    : { effect: fxs.current.effect, params: fxs.params, name: fxs.current.name, layer: null };
}

const fxActiveLayers = () => fxs.stack.filter(l => l.enabled && l.program.ok).map(l => ({ program: l.program, effect: l.effect, params: l.params }));

function fxLayerControls() {
  const groups = [...new Set(fxs.cards.map(c => c.category))];
  const row = (n, name, active, onEdit, extra = []) => h('div', { class: `fxe-layer${active ? ' active' : ''}` },
    h('button', { type: 'button', class: 'fxe-layer-name', title: 'Show its settings', onclick: onEdit }, h('span', { class: 'fxe-layer-n' }, String(n)), name),
    extra);
  return [
    row(1, fxs.current.name, !fxs.editing, () => { fxs.editing = null; fxRenderInspector(); }),
    fxs.stack.map((l, i) => row(i + 2, `${l.card.name}${l.program.ok ? '' : ' ⚠'}`, fxs.editing === l.id, () => { fxs.editing = l.id; fxRenderInspector(); }, [
      h('input', { type: 'checkbox', class: 'switch', checked: l.enabled, title: 'Show this layer', 'aria-label': `Show ${l.card.name}`, onchange: e => { l.enabled = e.target.checked; fxLayersChanged(); } }),
      iconBtn('up', 'Move up (applied earlier)', () => fxMoveLayer(l.id, -1)),
      iconBtn('down', 'Move down (applied later)', () => fxMoveLayer(l.id, 1)),
      iconBtn('x', 'Remove this layer', () => fxRemoveLayer(l.id)),
    ])),
    fxs.stack.length < 6 && h('select', {
      class: 'fxe-select fxe-add-layer',
      'aria-label': 'Add an effect on top',
      onchange: e => { if (e.target.value) fxAddLayer(e.target.value); },
    },
    h('option', { value: '' }, '+ Add an effect on top…'),
    groups.map(g => h('optgroup', { label: g }, fxs.cards.filter(c => c.category === g).map(c => h('option', { value: c.key }, c.name))))),
    !fxs.stack.length && h('p', { class: 'muted small' }, 'Stack effects to combine them – e.g. a dither, then chromatic aberration and a JPEG glitch on top.'),
  ];
}

function fxBuildCards() {
  const cards = [];
  for (const e of fxs.effects.values()) {
    const category = e.custom ? 'Mine' : e.category;
    cards.push({ key: e.id, effectId: e.id, name: e.name, category, description: e.description, preset: null, custom: e.custom });
    e.presets.forEach((p, i) => cards.push({
      key: `${e.id}#${i}`,
      effectId: e.id,
      name: p.name,
      category,
      description: p.description || e.description,
      preset: p,
      custom: e.custom,
    }));
  }
  const rank = c => {
    const i = FX_CATEGORY_ORDER.indexOf(c.category);
    return i < 0 ? 99 : i;
  };
  return cards.sort((a, b) => rank(a) - rank(b));
}

function fxDefaultParams(effect, preset = null) {
  const params = {};
  for (const p of effect.params) {
    params[p.name] = preset?.[p.name] != null ? fxCoerce(p, preset[p.name]) : p.default;
    if (p.type === 'charset') params[`${p.name}Text`] = 'HOMBRESAI';
  }
  return params;
}

// Values from saved settings or the previous version of an effect – only for sliders that still exist.
function fxCoerceParams(effect, values = {}) {
  const out = {};
  for (const p of effect.params) {
    if (values[p.name] !== undefined) out[p.name] = fxCoerce(p, values[p.name]);
    const textKey = `${p.name}Text`;
    if (p.type === 'charset' && typeof values[textKey] === 'string') out[textKey] = values[textKey].slice(0, 200);
  }
  return out;
}

function fxDefaultLook(effect, preset = null) {
  const palette = [preset?.palette, effect.palette, 'mono'].find(id => id && FX_PALETTES.some(p => p.id === id && p.id !== 'custom'));
  return {
    palette,
    custom: [...(FX_PALETTES.find(p => p.id === palette)?.colors || ['#000000', '#ffffff'])],
    autoCount: 6,
    adjust: { ...FX_ADJUST_DEFAULTS },
    finish: { ...FX_FINISH_DEFAULTS, ...fxFinishFrom(effect.finish), ...(preset ? fxFinishFrom(preset) : {}) },
  };
}

function fxPickValues(src, defaults) {
  const out = {};
  for (const [key, def] of Object.entries(defaults)) {
    const v = src?.[key];
    if (typeof def === 'number' && v !== null && v !== '' && Number.isFinite(Number(v))) out[key] = Number(v);
    else if (typeof def === 'boolean' && typeof v === 'boolean') out[key] = v;
    else if (typeof def === 'string' && typeof v === 'string') out[key] = v;
  }
  return out;
}

function fxCleanLook(look = {}) {
  const custom = Array.isArray(look.custom) ? look.custom.filter(c => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 16) : [];
  const finish = { ...FX_FINISH_DEFAULTS, ...fxPickValues(look.finish, FX_FINISH_DEFAULTS) };
  if (!/^#[0-9a-f]{6}$/i.test(finish.bg) && finish.bg !== 'transparent') finish.bg = 'auto';
  return {
    palette: FX_PALETTES.some(p => p.id === look.palette) ? look.palette : 'mono',
    custom: custom.length >= 2 ? custom : ['#000000', '#ffffff'],
    autoCount: Math.max(2, Math.min(16, Math.round(Number(look.autoCount)) || 6)),
    adjust: { ...FX_ADJUST_DEFAULTS, ...fxPickValues(look.adjust, FX_ADJUST_DEFAULTS) },
    finish,
  };
}

function fxPaletteHexes(look = fxs.look) {
  if (!look || look.palette === 'original') return null;
  if (look.palette === 'custom') return look.custom?.length >= 2 ? look.custom : ['#000000', '#ffffff'];
  if (look.palette === 'auto') return fxAutoPalette(look.autoCount);
  return (FX_PALETTES.find(p => p.id === look.palette) || FX_PALETTES[0]).colors;
}

// "From your image": the main colours of the source (k-means on a small copy), darkest first. Computed once per
// source and colour count – for a video from the frame on screen when it’s picked or refreshed.
function fxAutoPalette(count = 6, refresh = false) {
  const s = fxs.source;
  const n = Math.max(2, Math.min(16, Math.round(count) || 6));
  if (!s || (s.el instanceof HTMLVideoElement && s.el.readyState < 2)) return ['#000000', '#ffffff'];
  if (!refresh && fxs.autoPal?.src === s && fxs.autoPal.n === n) return fxs.autoPal.colors;
  let colors = ['#000000', '#ffffff'];
  try {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(s.el, 0, 0, 64, 64);
    colors = fxKMeans(ctx.getImageData(0, 0, 64, 64).data, n);
  } catch { /* the source isn’t ready yet */ }
  fxs.autoPal = { src: s, n, colors };
  return colors;
}

function fxKMeans(data, k) {
  const pts = [];
  for (let i = 0; i < data.length; i += 4) pts.push([data[i], data[i + 1], data[i + 2]]);
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  // farthest-point start (deterministic, so the palette doesn’t jump around), then Lloyd iterations
  const centers = [pts.reduce((a, b) => (a[0] + a[1] + a[2] <= b[0] + b[1] + b[2] ? a : b))];
  const near = pts.map(p => d2(p, centers[0]));
  while (centers.length < k) {
    let best = 0;
    for (let i = 1; i < pts.length; i++) if (near[i] > near[best]) best = i;
    if (near[best] === 0) break;
    centers.push([...pts[best]]);
    for (let i = 0; i < pts.length; i++) near[i] = Math.min(near[i], d2(pts[i], pts[best]));
  }
  for (let iter = 0; iter < 10; iter++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const p of pts) {
      let bi = 0;
      for (let c = 1; c < centers.length; c++) if (d2(p, centers[c]) < d2(p, centers[bi])) bi = c;
      const s = sums[bi];
      s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    }
    sums.forEach((s, c) => { if (s[3]) centers[c] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  const hex = c => `#${c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  const colors = centers.map(hex).sort((a, b) => fxLuma(a) - fxLuma(b));
  while (colors.length < 2) colors.push(colors[0] === '#ffffff' ? '#000000' : '#ffffff');
  return colors;
}

function fxSelect(key, { keep = false, restore = false, snap = null } = {}) {
  const card = fxs.cards.find(c => c.key === key) || fxs.cards[0];
  if (!card || !fxs.engine) return;
  const effect = fxs.effects.get(card.effectId);
  const saved = restore && state.ui.fx?.key === card.key ? state.ui.fx : null;
  const params = fxDefaultParams(effect, card.preset);
  if (snap?.params) Object.assign(params, fxCoerceParams(effect, snap.params));
  else if (saved?.params) Object.assign(params, fxCoerceParams(effect, saved.params));
  else if (keep && fxs.current) Object.assign(params, fxCoerceParams(effect, fxs.params));
  fxs.params = params;
  if (snap?.look) fxs.look = fxCleanLook(snap.look);
  else if (saved?.look) fxs.look = fxCleanLook(saved.look);
  else if (!keep || !fxs.look) fxs.look = fxDefaultLook(effect, card.preset);
  const program = fxs.engine.compile(effect.source);
  fxs.current = {
    key: card.key,
    card,
    effect,
    program,
    name: card.name,
    description: card.description,
    custom: card.custom,
    draft: false,
    saveId: card.custom ? card.effectId : null,
  };
  if (!keep) {
    fxs.started = performance.now();
    fxs.editing = null; // a card from the gallery replaces the main effect – show its sliders
  }
  if (!program.ok && !keep) toast(`“${card.name}” has an error in its code – open Code to see it.`, 'error');
  fxPersist();
  if (!snap) fxSyncActiveKeyframe(); // a gallery pick updates the keyframe being edited
  fxRenderInspector();
  fxMarkActiveCard();
  fxRequestRender();
}

let fxPersistTimer = 0;
function fxPersist() {
  clearTimeout(fxPersistTimer);
  fxPersistTimer = setTimeout(() => {
    const prev = state.ui.fx || {};
    const cur = fxs.current;
    state.ui.fx = {
      key: cur && !cur.draft ? cur.key : prev.key,
      params: cur && !cur.draft ? fxs.params : prev.params,
      look: cur && !cur.draft ? fxs.look : prev.look,
      stack: fxs.stack.map(l => ({ key: l.key, params: l.params, enabled: l.enabled })),
      category: fxs.category,
      exportScale: fxs.exportScale,
      exportFormat: fxs.exportFormat,
      videoSide: fxs.videoSide,
      clipSeconds: fxs.clipSeconds,
      exportAudio: fxs.exportAudio,
    };
    saveUi();
  }, 300);
}

function fxChanged() {
  fxPersist();
  fxSyncActiveKeyframe();
  fxRequestRender();
}

// ── Rendering ───────────────────────────────────────────────────────────────

function fxRequestRender() {
  if (!fxs.raf && fxActive()) fxs.raf = requestAnimationFrame(fxFrame);
}

function fxFrame() {
  fxs.raf = 0;
  if (!fxActive() || fxs.busy?.ownsCanvas) return;
  const view = fxViewSize();
  const size = fxs.recordSize || view;
  const tl = fxHasTimeline() ? fxTimelineAt(fxVideoTime()) : null;
  let done;
  if (tl && tl.a) {
    done = fxDrawTransition(tl, size); // crossfading between two keyframes
  } else {
    if (tl) fxApplyTimeline(); // load the keyframe active at the playhead
    done = fxDraw(size);
  }
  if (done === null && fxs.source && fxs.source.kind !== 'image') { fxRequestRender(); return; } // first frame not ready yet
  if (fxLive() || fxIsAnimated() || fxs.recorder) fxRequestRender();
}

function fxEffectMoves(effect, params, program) {
  const a = effect?.animated;
  if (!a || !program?.ok) return false;
  if (!a.param) return true;
  const v = params[a.param];
  return typeof v === 'boolean' ? v : Number(v) !== 0;
}

function fxIsAnimated() {
  if (!fxs.current) return false;
  return fxEffectMoves(fxs.current.effect, fxs.params, fxs.current.program)
    || fxs.stack.some(l => l.enabled && fxEffectMoves(l.effect, l.params, l.program));
}

const fxLive = () => Boolean(fxs.source && (fxs.source.kind === 'camera' || (fxs.source.kind === 'video' && !fxs.source.el.paused)));

function fxDraw(size, extra = {}) {
  if (!fxs.source || !fxs.current || !fxs.engine || fxs.lost) return null;
  return fxs.engine.render({
    program: fxs.current.program,
    effect: fxs.current.effect,
    params: fxs.params,
    layers: fxActiveLayers(),
    look: { palette: fxPaletteHexes(), adjust: fxs.look.adjust, finish: fxs.look.finish },
    out: size,
    design: fxs.design,
    time: (performance.now() - fxs.started) / 1000,
    refresh: fxs.source.kind !== 'image',
    bypass: fxs.compare,
    ...extra,
  });
}

// Size of the canvas on screen (CSS px) and of its pixel buffer (device px, at most 4096).
function fxViewSize() {
  const vp = $('#fxeViewport');
  const canvas = $('#fxeCanvas');
  const d = fxs.design;
  const z = fxs.zoom === 'fit' ? fxFitScale() : fxs.zoom;
  const cssW = Math.max(16, Math.round(d.width * z));
  const cssH = Math.max(16, Math.round(d.height * z));
  const w = `${cssW}px`;
  const hgt = `${cssH}px`;
  if (canvas.style.width !== w) canvas.style.width = w;
  if (canvas.style.height !== hgt) canvas.style.height = hgt;
  vp.classList.toggle('pixelated', fxs.zoom !== 'fit' && z >= 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cap = Math.min(1, Math.min(fxs.engine.maxSize, 4096) / (Math.max(cssW, cssH) * dpr));
  return { width: Math.max(1, Math.round(cssW * dpr * cap)), height: Math.max(1, Math.round(cssH * dpr * cap)) };
}

function fxFitScale() {
  const vp = $('#fxeViewport');
  const d = fxs.design;
  return Math.max(0.05, Math.min((vp.clientWidth - 32) / d.width, (vp.clientHeight - 32) / d.height));
}

function fxSetZoom(z) {
  fxs.zoom = z;
  $('#fxeZoomFit').textContent = z === 'fit' ? 'Fit' : `${Math.round(z * 100)} %`;
  $('#fxeZoomFit').classList.toggle('active', z === 'fit');
  fxRequestRender();
}

function fxStepZoom(dir) {
  const cur = fxs.zoom === 'fit' ? fxFitScale() : fxs.zoom;
  const next = dir > 0 ? FX_ZOOMS.find(z => z > cur + 1e-3) : [...FX_ZOOMS].reverse().find(z => z < cur - 1e-3);
  if (next) fxSetZoom(next);
}

// ── Gallery of effects (left) ───────────────────────────────────────────────

function fxRenderLibrary() {
  const cats = ['All', ...new Set(fxs.cards.map(c => c.category))];
  if (!cats.includes(fxs.category)) fxs.category = 'All';
  $('#fxeCats').replaceChildren(...cats.map(c => h('button', {
    type: 'button',
    class: `chip-btn small${c === fxs.category ? ' active' : ''}`,
    'aria-pressed': String(c === fxs.category),
    onclick: () => { fxs.category = c; fxPersist(); fxRenderLibrary(); },
  }, c)));
  fxRenderCards();
}

function fxRenderCards() {
  const q = norm(fxs.query.trim());
  const list = fxs.cards.filter(c => (fxs.category === 'All' || c.category === fxs.category)
    && (!q || norm(`${c.name} ${c.category} ${c.description}`).includes(q)));
  $('#fxeCards').replaceChildren(...list.map(c => h('button', {
    type: 'button',
    class: `fxe-card${fxs.current?.key === c.key ? ' active' : ''}`,
    'data-key': c.key,
    title: c.description,
    onclick: () => fxSelect(c.key),
  },
  h('canvas', { class: 'fxe-thumb', 'data-key': c.key, width: 8, height: 8 }),
  h('span', { class: 'fxe-card-name' }, c.name),
  h('span', { class: 'fxe-card-cat' }, c.category))));
  if (!list.length) $('#fxeCards').append(h('p', { class: 'muted small fxe-none' }, 'No effects match.'));
  fxQueueThumbs();
}

function fxMarkActiveCard() {
  for (const el of document.querySelectorAll('.fxe-card')) el.classList.toggle('active', el.dataset.key === fxs.current?.key);
}

// Card thumbnails: each effect in its default look, rendered on the current image a few at a time.
function fxQueueThumbs() {
  const token = ++fxs.thumbToken;
  if (!fxs.source || !fxs.engine) return;
  const canvases = [...document.querySelectorAll('.fxe-thumb')];
  let i = 0;
  const step = () => {
    if (token !== fxs.thumbToken) return;
    if (!fxActive() || fxs.busy) { setTimeout(step, 400); return; }
    const t0 = performance.now();
    while (i < canvases.length && performance.now() - t0 < 14) fxDrawThumb(canvases[i++]);
    if (i < canvases.length) setTimeout(step, 0);
  };
  setTimeout(step, 30);
}

function fxDrawThumb(canvas) {
  const card = fxs.cards.find(c => c.key === canvas.dataset.key);
  const effect = card && fxs.effects.get(card.effectId);
  if (!effect || !canvas.isConnected) return;
  const program = fxs.engine.compile(effect.source);
  const ctx = canvas.getContext('2d');
  if (!program.ok) {
    canvas.width = 120;
    canvas.height = 90;
    ctx.fillStyle = '#3a1418';
    ctx.fillRect(0, 0, 120, 90);
    return;
  }
  const d = fxs.design;
  const k = 220 / Math.max(d.width, d.height);
  const look = fxDefaultLook(effect, card.preset);
  const img = fxs.engine.render({
    program,
    effect,
    params: fxDefaultParams(effect, card.preset),
    look: { palette: fxPaletteHexes(look), adjust: look.adjust, finish: look.finish },
    out: { width: d.width * k, height: d.height * k },
    design: { width: d.width * 0.4, height: d.height * 0.4 },
    time: 0.8,
    read: true,
    targetPrefix: 'thumb-',
  });
  if (!img) return;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.putImageData(img, 0, 0);
}

// ── Your images (strip under the canvas) ────────────────────────────────────

function fxRenderStrip() {
  const strip = $('#fxeStrip');
  if (!strip) return;
  // videos show up once they have a preview frame
  const items = state.items.filter(i => !/^video\//.test(i.mimeType || '') || i.thumb).slice(0, 60);
  const key = `${items.map(i => `${i.id}${i.thumb ? 't' : ''}`).join(',')}|${fxs.source?.itemId || ''}`;
  if (key === fxs.stripKey) return;
  fxs.stripKey = key;
  $('#fxeStripWrap').hidden = !items.length;
  strip.replaceChildren(...items.map(item => {
    const img = h('img', { src: thumbUrl(item), alt: item.userPrompt || 'Your image', loading: 'lazy', draggable: 'true' });
    img.addEventListener('dragstart', e => {
      e.dataTransfer.setData('application/x-mhf-item', item.id);
      e.dataTransfer.effectAllowed = 'copy';
    });
    return h('button', {
      type: 'button',
      class: `fxe-strip-item${fxs.source?.itemId === item.id ? ' active' : ''}`,
      title: item.userPrompt || '',
      onclick: () => fxLoadItem(item),
    }, img);
  }));
}

// ── Sources: image, video, camera ───────────────────────────────────────────

function fxLoadFile(file) {
  if (!fxs.engine) return;
  const name = file.name || 'Pasted image';
  if (file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv|mkv)$/i.test(name)) {
    fxLoadVideoUrl(URL.createObjectURL(file), name);
  } else if (isHeic(file, name)) {
    toast('HEIC photos can’t be opened in Effects – save the photo as JPG or PNG first.', 'error');
  } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|bmp)$/i.test(name)) {
    fxLoadImageUrl(URL.createObjectURL(file), name);
  } else {
    toast('That isn’t an image or a video.', 'error');
  }
}

function fxLoadItem(item) {
  if (!fxs.engine) {
    fxs.pendingItem = item;
    return;
  }
  if (/^video\//.test(item.mimeType || '')) fxLoadVideoUrl(mediaUrl(item), fileName(item));
  else fxLoadImageUrl(mediaUrl(item), fileName(item), item.id);
}

function fxLoadDefault() {
  // Always start on the bundled sample video (so the timeline has something to animate).
  fxLoadVideoUrl(FX_SAMPLE_VIDEO, 'Sample video', { fallback: true });
}

// When the sample video can't play, fall back to a gradient image so the view isn't empty.
function fxLoadSampleImage() {
  const c = fxSampleCanvas();
  fxSetSource({ kind: 'image', el: c, name: 'Sample image', itemId: null, width: c.width, height: c.height });
}

// Shown when there are no images yet, so the effects have something to work on.
function fxSampleCanvas() {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1080;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 1080, 1080);
  g.addColorStop(0, '#15233f');
  g.addColorStop(1, '#f0a35e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1080, 1080);
  const sun = ctx.createRadialGradient(430, 400, 30, 540, 520, 400);
  sun.addColorStop(0, '#fff7e3');
  sun.addColorStop(0.45, '#ec7a4c');
  sun.addColorStop(1, 'rgba(40, 18, 60, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(540, 520, 380, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 150px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('hombresai', 540, 960);
  return c;
}

function fxSetLoading(on) {
  $('#fxeViewport').classList.toggle('loading', on);
}

async function fxLoadImageUrl(url, name, itemId = null) {
  const token = ++fxs.loadToken;
  fxSetLoading(true);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    if (token !== fxs.loadToken) return;
    let el = img;
    let w = img.naturalWidth;
    let hgt = img.naturalHeight;
    const max = Math.min(fxs.engine.maxSize, 4096);
    if (Math.max(w, hgt) > max) {
      const s = max / Math.max(w, hgt);
      el = document.createElement('canvas');
      el.width = Math.round(w * s);
      el.height = Math.round(hgt * s);
      el.getContext('2d').drawImage(img, 0, 0, el.width, el.height);
      w = el.width;
      hgt = el.height;
    }
    fxSetSource({ kind: 'image', el, name, itemId, width: w, height: hgt, url });
  } catch {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    if (token === fxs.loadToken) toast(`Couldn’t open ${name}.`, 'error');
  } finally {
    if (token === fxs.loadToken) fxSetLoading(false);
  }
}

async function fxLoadVideoUrl(url, name, { fallback = false } = {}) {
  const token = ++fxs.loadToken;
  fxSetLoading(true);
  const v = document.createElement('video');
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = url;
  try {
    await new Promise((resolve, reject) => {
      v.addEventListener('loadeddata', resolve, { once: true });
      v.addEventListener('error', () => reject(new Error('unsupported')), { once: true });
    });
    if (token !== fxs.loadToken) return;
    fxSetSource({ kind: 'video', el: v, name, itemId: null, width: v.videoWidth, height: v.videoHeight, url });
    for (const ev of ['timeupdate', 'play', 'pause', 'volumechange', 'durationchange']) v.addEventListener(ev, fxUpdateTransport);
    v.addEventListener('durationchange', fxRenderTimeline);
    v.addEventListener('play', fxRequestRender);
    v.addEventListener('seeked', fxRequestRender);
    v.play().catch(() => {});
  } catch {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    if (token !== fxs.loadToken) return;
    if (fallback) fxLoadSampleImage();
    else toast(`This video can’t be played in the browser (${name}). MP4 (H.264) and WebM work best.`, 'error', { duration: 8000 });
  } finally {
    if (token === fxs.loadToken) fxSetLoading(false);
  }
}

async function fxToggleCamera() {
  if (!fxs.engine) return;
  if (fxs.source?.kind === 'camera') {
    if (fxs.recorder) fxToggleRecord();
    fxReleaseSource({ ui: true });
    fxLoadDefault();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    toast('This browser doesn’t give access to a camera.', 'error');
    return;
  }
  const token = ++fxs.loadToken;
  fxSetLoading(true);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.srcObject = stream;
    await v.play();
    if (token !== fxs.loadToken) {
      stream.getTracks().forEach(t => t.stop());
      return;
    }
    fxSetSource({ kind: 'camera', el: v, name: 'Camera', itemId: null, width: v.videoWidth || 1280, height: v.videoHeight || 720, stream });
  } catch (err) {
    toast(err?.name === 'NotAllowedError' ? 'Camera access was blocked – allow it in the browser’s address bar.' : 'No camera is available.', 'error');
  } finally {
    if (token === fxs.loadToken) fxSetLoading(false);
  }
}

function fxSetSource(src) {
  fxReleaseSource();
  fxs.source = src;
  fxs.engine.setSource(src.el);
  fxs.design = fxDesignSize(src.width, src.height);
  fxs.started = performance.now();
  fxCloseOpenMenu();
  fxSetSourceFormat(src);
  $('#fxeEmpty').hidden = true;
  $('#fxeCanvas').hidden = false;
  fxUpdateSourceUi();
  fxResetKeyframes();
  fxRenderInspector();
  fxRenderStrip();
  fxQueueThumbs();
  fxRequestRender();
}

function fxReleaseSource({ ui = false } = {}) {
  const s = fxs.source;
  if (!s) return;
  fxs.source = null;
  if (s.kind !== 'image') {
    s.el.pause();
    s.el.srcObject = null;
    s.el.removeAttribute('src');
  }
  s.stream?.getTracks().forEach(t => t.stop());
  if (s.url?.startsWith('blob:')) URL.revokeObjectURL(s.url);
  if (ui) {
    $('#fxeEmpty').hidden = false;
    $('#fxeCanvas').hidden = true;
    fxUpdateSourceUi();
    fxRenderInspector();
    fxRenderStrip();
  }
}

function fxUpdateSourceUi() {
  const s = fxs.source;
  $('#fxeSourceName').textContent = s ? `${s.kind === 'camera' ? 'Live camera' : s.name} · ${s.width} × ${s.height}` : '';
  const cam = $('#fxeCameraBtn');
  cam.classList.toggle('active', s?.kind === 'camera');
  cam.setAttribute('aria-pressed', String(s?.kind === 'camera'));
  cam.querySelector('span').textContent = s?.kind === 'camera' ? 'Stop camera' : 'Camera';
  fxUpdateTransport();
}

function fxUpdateTransport() {
  const s = fxs.source;
  const video = s?.kind === 'video';
  $('#fxeTransport').hidden = !video;
  if (!video) return;
  const v = s.el;
  $('#fxePlay').replaceChildren(icon(v.paused ? 'play' : 'pause', 18));
  $('#fxePlay').setAttribute('aria-label', v.paused ? 'Play' : 'Pause');
  $('#fxeMute').replaceChildren(icon(v.muted ? 'mute' : 'sound', 18));
  $('#fxeMute').setAttribute('aria-label', v.muted ? 'Turn the sound on' : 'Mute');
  if (document.activeElement !== $('#fxeSeek')) $('#fxeSeek').value = v.duration ? Math.round((v.currentTime / v.duration) * 1000) : 0;
  $('#fxeTime').textContent = `${fxClock(v.currentTime)} / ${fxClock(v.duration)}`;
}

function fxClock(sec) {
  const s = Number.isFinite(sec) ? Math.max(0, sec) : 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// ── Timeline: keyframes that hard-switch the whole look along a video ─────────
// A keyframe snapshots the effect + its properties (layers, palette, adjust, finish). From its time
// until the next keyframe, that look applies – live while playing and when exporting. Only videos
// have a timeline; an image or the camera keeps the single current look.
const fxHasTimeline = () => fxs.source?.kind === 'video';
const fxVideoTime = () => (fxs.source?.kind === 'video' ? fxs.source.el.currentTime || 0 : 0);
// Videos recorded by a browser (MediaRecorder MP4/WebM, incl. this app's own exports) often can't be
// seeked – the container has no index. Then scrubbing / jumping is off; play→pause→+Key and export still work.
function fxCanSeek() {
  const v = fxs.source?.kind === 'video' ? fxs.source.el : null;
  return Boolean(v && v.seekable && v.seekable.length && v.seekable.end(v.seekable.length - 1) > 0.5);
}

function fxSnapshot() {
  return {
    key: fxs.current?.key,
    params: structuredClone(fxs.params || {}),
    look: structuredClone(fxs.look || {}),
    stack: fxs.stack.map(l => ({ key: l.key, params: structuredClone(l.params), enabled: l.enabled })),
  };
}

// Load a snapshot into the live look (recompiles) – when crossing a keyframe or clicking one.
function fxApplySnapshot(snap) {
  if (!snap) return;
  fxs.stack = (snap.stack || []).map(s => fxMakeLayer(s.key, s.params, s.enabled)).filter(Boolean).slice(0, 6);
  fxs.editing = null;
  fxSelect(snap.key || fxs.current?.key, { snap });
}

const fxSortKeyframes = () => fxs.keyframes.sort((a, b) => a.time - b.time);

// The keyframe active at `time`: the last one at or before it (there is always one at 0).
function fxKeyframeAt(time) {
  let kf = fxs.keyframes[0] || null;
  for (const k of fxs.keyframes) { if (k.time <= time + 0.02) kf = k; else break; }
  return kf;
}

function fxResetKeyframes() {
  fxTransCache.clear();
  fxs.keyframes = fxHasTimeline() ? [{ id: uid(), time: 0, trans: 0, snap: fxSnapshot() }] : [];
  fxs.activeKf = fxs.keyframes[0]?.id || null;
  fxs.appliedKf = fxs.activeKf;
  fxRenderTimeline();
}

// Save the current look into the keyframe being edited (after a slider / layer / effect change).
function fxSyncActiveKeyframe() {
  if (!fxHasTimeline() || !fxs.activeKf) return;
  const kf = fxs.keyframes.find(k => k.id === fxs.activeKf);
  if (kf) kf.snap = fxSnapshot();
}

function fxAddKeyframe() {
  if (!fxHasTimeline()) return;
  const time = fxVideoTime();
  const near = fxs.keyframes.find(k => Math.abs(k.time - time) < 0.08);
  if (near) { near.snap = fxSnapshot(); fxs.activeKf = near.id; }
  else { const kf = { id: uid(), time, trans: 0, snap: fxSnapshot() }; fxs.keyframes.push(kf); fxSortKeyframes(); fxs.activeKf = kf.id; }
  fxs.appliedKf = fxs.activeKf;
  fxRenderTimeline();
  toast('Key added – change the effect here and it applies from this point.', 'success');
}

function fxDeleteActiveKeyframe() {
  const kf = fxs.keyframes.find(k => k.id === fxs.activeKf);
  if (!kf || fxs.keyframes.length <= 1 || kf.time <= 0.02) { toast('The first key can’t be removed.', 'error'); return; }
  fxs.keyframes = fxs.keyframes.filter(k => k.id !== kf.id);
  fxApplyTimeline(true);
  fxRenderTimeline();
}

function fxSelectKeyframe(id) {
  const kf = fxs.keyframes.find(k => k.id === id);
  if (!kf) return;
  fxs.activeKf = id;
  fxs.appliedKf = id;
  if (fxs.source?.kind === 'video' && fxCanSeek()) fxs.source.el.currentTime = kf.time; // jump only when the video supports it
  fxApplySnapshot(kf.snap); // either way, load its look into the editor
  fxRenderTimeline();
}

// Live / scrub / export: load the keyframe active at the current time, only when it changes.
function fxApplyTimeline(force = false) {
  if (!fxHasTimeline() || !fxs.keyframes.length) return;
  const kf = fxKeyframeAt(fxVideoTime());
  if (!kf) return;
  if (force || kf.id !== fxs.appliedKf) {
    fxs.appliedKf = kf.id;
    fxs.activeKf = kf.id; // the editor follows the playhead
    fxApplySnapshot(kf.snap);
    fxRenderTimeline();
  }
}

// ── Gradual transitions between keyframes (crossfade) ────────────────────────
// A keyframe may fade IN over `trans` seconds from the key before it. Inside that window the two
// looks are rendered and mixed on the GPU; outside it a single key applies (hard switch, trans 0).
const fxTransCache = new Map(); // keyframe id -> { snap, state }; rebuilt when the key's look is edited

function fxBuildState(snap) {
  const card = fxs.cards.find(c => c.key === snap.key) || fxs.cards[0];
  if (!card) return null;
  const effect = fxs.effects.get(card.effectId);
  return {
    program: fxs.engine.compile(effect.source),
    effect,
    params: { ...fxDefaultParams(effect, card.preset), ...fxCoerceParams(effect, snap.params || {}) },
    look: fxCleanLook(snap.look || {}),
    layers: (snap.stack || []).map(s => fxMakeLayer(s.key, s.params, s.enabled)).filter(Boolean).slice(0, 6),
  };
}

function fxTransState(kf) {
  const hit = fxTransCache.get(kf.id);
  if (hit && hit.snap === kf.snap) return hit.state;
  const state = fxBuildState(kf.snap);
  fxTransCache.set(kf.id, { snap: kf.snap, state });
  return state;
}

// Render one built look-state into a texture (toTarget) or the canvas.
function fxDrawState(st, size, extra = {}) {
  if (!st) return null;
  return fxs.engine.render({
    program: st.program,
    effect: st.effect,
    params: st.params,
    layers: st.layers.filter(l => l.enabled && l.program.ok).map(l => ({ program: l.program, effect: l.effect, params: l.params })),
    look: { palette: fxPaletteHexes(st.look), adjust: st.look.adjust, finish: st.look.finish },
    out: size,
    design: fxs.design,
    time: (performance.now() - fxs.started) / 1000,
    refresh: fxs.source.kind !== 'image',
    ...extra,
  });
}

// At a video time: inside a keyframe's fade-in window → {a, b, factor}; otherwise {single}.
function fxTimelineAt(time) {
  const ks = fxs.keyframes;
  for (let i = 1; i < ks.length; i++) {
    const b = ks[i], a = ks[i - 1];
    const tr = Math.min(b.trans || 0, b.time - a.time);
    if (tr > 0.001 && time >= b.time - tr && time < b.time) return { a, b, factor: (time - (b.time - tr)) / tr };
  }
  return { single: fxKeyframeAt(time) };
}

// Crossfade the two looks of a transition onto the canvas (or export frame).
function fxDrawTransition(tl, size, extra = {}) {
  const a = fxTransState(tl.a);
  const b = fxTransState(tl.b);
  if (!a || !b) return fxDraw(size, extra);
  const TA = fxDrawState(a, size, { ...extra, toTarget: true, targetPrefix: 'tA' });
  const TB = fxDrawState(b, size, { ...extra, toTarget: true, targetPrefix: 'tB' });
  if (!TA || !TB) return null;
  return fxs.engine.blend(TA, TB, tl.factor, size);
}

// Set the active keyframe's fade-in length (0 = instant); the first key has none.
function fxSetActiveTrans(sec) {
  const i = fxs.keyframes.findIndex(k => k.id === fxs.activeKf);
  if (i <= 0) return;
  const gap = fxs.keyframes[i].time - fxs.keyframes[i - 1].time;
  fxs.keyframes[i].trans = Math.max(0, Math.min(sec, gap));
  fxRenderTimeline();
  fxRequestRender();
}

function fxRenderTimeline() {
  const keys = $('#fxeTlKeys');
  if (!keys) return;
  const v = fxs.source?.kind === 'video' ? fxs.source.el : null;
  const dur = v && Number.isFinite(v.duration) ? v.duration : 0;
  const marks = fxHasTimeline() ? fxs.keyframes : [];
  // a shaded bar before each key shows its fade-in (gradual transition)
  const fades = [];
  for (let i = 1; i < marks.length; i++) {
    const tr = Math.min(marks[i].trans || 0, marks[i].time - marks[i - 1].time);
    if (dur && tr > 0.001) fades.push(h('div', { class: 'fxe-fade', style: `left:${((marks[i].time - tr) / dur) * 100}%;width:${(tr / dur) * 100}%` }));
  }
  keys.replaceChildren(...fades, ...marks.map(k => h('button', {
    type: 'button',
    class: `fxe-key${k.id === fxs.activeKf ? ' active' : ''}`,
    style: `left:${dur ? Math.min(100, Math.max(0, (k.time / dur) * 100)) : 0}%`,
    title: `Key at ${fxClock(k.time)} – click to jump here`,
    'aria-label': `Key at ${fxClock(k.time)}`,
    onclick: () => fxSelectKeyframe(k.id),
  })));
  const info = $('#fxeTlInfo');
  if (info) {
    const n = fxs.keyframes.length;
    const idx = fxs.keyframes.findIndex(k => k.id === fxs.activeKf);
    const noScrub = fxHasTimeline() && !fxCanSeek() ? ' · can’t scrub this clip – play, pause, then add a key' : '';
    info.textContent = !fxHasTimeline() ? ''
      : (n > 1 ? `Key ${idx + 1} of ${n} · at ${fxClock(fxs.keyframes[idx]?.time || 0)}` : 'One look for the whole clip – add a key to change the effect over time') + noScrub;
  }
  if (fxHasTimeline()) $('#fxeSeek').disabled = !fxCanSeek();
  const del = $('#fxeDelKey');
  if (del) { const kf = fxs.keyframes.find(k => k.id === fxs.activeKf); del.hidden = !(fxHasTimeline() && fxs.keyframes.length > 1 && kf && kf.time > 0.02); }
  // the transition (fade-in) slider for the selected key – the first key has no "before"
  const tw = $('#fxeTransWrap');
  if (tw) {
    const i = fxs.keyframes.findIndex(k => k.id === fxs.activeKf);
    const show = fxHasTimeline() && i > 0;
    tw.hidden = !show;
    if (show) {
      const kf = fxs.keyframes[i];
      const gap = kf.time - fxs.keyframes[i - 1].time;
      const slider = $('#fxeTrans');
      slider.max = String(Math.max(1, Math.round(gap * 10)));
      if (document.activeElement !== slider) slider.value = String(Math.round((kf.trans || 0) * 10));
      $('#fxeTransVal').textContent = (kf.trans || 0) > 0.001 ? `${(kf.trans || 0).toFixed(1)} s` : 'Instant';
    }
  }
}

// ── The "Open image or video" popover (holds "your images") ──────────────────
function fxToggleOpenMenu(open) {
  const menu = $('#fxeOpenMenu');
  if (!menu) return;
  fxs.openMenu = open === undefined ? !fxs.openMenu : open;
  menu.hidden = !fxs.openMenu;
  $('#fxeOpenBtn')?.setAttribute('aria-expanded', String(fxs.openMenu));
  if (fxs.openMenu) fxRenderStrip();
}
const fxCloseOpenMenu = () => fxToggleOpenMenu(false);

// Match the export format to the file just imported (image → its type; video → mp4 or webm).
function fxSetSourceFormat(src) {
  const name = (src.name || '').toLowerCase();
  if (src.kind === 'image') {
    const t = /\.png$/.test(name) ? 'png' : /\.jpe?g$/.test(name) ? 'jpeg' : /\.webp$/.test(name) ? 'webp' : null;
    fxs.sourceFormat = t;
    if (t && FX_FORMATS[t]) { fxs.exportFormat = t; fxPersist(); }
  } else if (src.kind === 'video') {
    fxs.sourceFormat = /\.webm$/.test(name) ? 'webm' : 'mp4';
  } else {
    fxs.sourceFormat = null;
  }
}

// ── Inspector (right) ───────────────────────────────────────────────────────

function fxRenderInspector() {
  const box = $('#fxeInspector');
  if (fxs.error) return;
  const cur = fxs.current;
  if (!cur) {
    box.replaceChildren(h('p', { class: 'muted small fxe-pad' }, 'Loading effects…'));
    return;
  }
  const e = cur.effect;
  const file = cur.draft ? (cur.saveId ? `${cur.saveId}.glsl · unsaved changes` : 'Not saved yet') : e.file;
  box.replaceChildren(...[
    h('div', { class: 'fxe-insp-head' },
      h('div', { class: 'fxe-insp-title' },
        h('h2', null, cur.name),
        h('span', { class: `pill${cur.draft ? ' draft' : cur.custom ? ' mine' : ''}` }, cur.draft ? 'Draft' : cur.custom ? 'Mine' : e.category)),
      cur.description && h('p', { class: 'fxe-desc' }, cur.description),
      file && h('p', { class: 'fxe-file', title: 'You can edit this file in any editor – changes load when you come back to this window.' }, file),
      h('div', { class: 'fxe-insp-actions' },
        cur.draft && h('button', { type: 'button', class: 'btn small primary', id: 'fxeSaveDraft', onclick: fxSaveDraft }, 'Save effect'),
        h('button', { type: 'button', class: 'btn small', onclick: () => fxOpenAi('remix') }, icon('sparkle', 15), 'Remix with AI'),
        h('button', { type: 'button', class: 'btn small ghost', onclick: fxOpenCode }, icon('code', 15), 'Code'),
        h('button', { type: 'button', class: 'btn small ghost', title: 'Back to the effect’s own settings', onclick: fxResetCurrent }, 'Reset'),
        cur.custom && !cur.draft && confirmIconBtn('trash', 'Delete this effect', fxDeleteCustom))),
    !cur.program.ok && h('div', { class: 'fxe-compile-error' },
      icon('alert', 16),
      h('div', null,
        h('b', null, 'This effect doesn’t compile'),
        h('pre', null, fxErrorText(cur.program)),
        h('button', { type: 'button', class: 'link-btn', onclick: fxOpenCode }, 'Open the code'))),
    fxSection(fxs.stack.length ? `Layers (${fxs.stack.length + 1})` : 'Layers', fxLayerControls(), 'Layers'),
    fxSettingsSection(),
    fxSection('Palette', fxPaletteControls()),
    fxSection('Adjust', fxAdjustControls()),
    fxSection('Finish', fxFinishControls()),
    fxSection('Export', fxExportControls()),
  ].filter(Boolean));
}

function fxSection(title, children, key = title) {
  return h('details', {
    class: 'fxe-sec',
    'data-sec': key,
    open: fxs.sections[key] ?? true,
    ontoggle: e => { fxs.sections[key] = e.target.open; },
  }, h('summary', null, title), h('div', { class: 'fxe-sec-body' }, children));
}

// Sliders of the main effect, or of the layer picked in Layers.
function fxSettingsSection() {
  const t = fxEditTarget();
  const controls = t.effect.params.length
    ? t.effect.params.filter(fxParamVisible).map(fxParamControl)
    : h('p', { class: 'muted small' }, 'This effect has no sliders.');
  return fxSection(t.layer ? `Settings · ${t.name}` : 'Settings', [
    t.layer && !t.layer.program.ok && h('p', { class: 'fxe-layer-error' }, `This layer doesn’t compile: ${fxErrorText(t.layer.program).split('\n')[0]}`),
    controls,
  ], 'Settings');
}

function fxFormat(value, step) {
  if (step >= 1) return String(Math.round(value));
  return Number(value).toFixed(step >= 0.1 ? 1 : 2);
}

function fxSlider(label, value, { min, max, step, def, onInput }) {
  const out = h('output', null, fxFormat(value, step));
  const input = h('input', { type: 'range', min, max, step, value, 'aria-label': label });
  input.addEventListener('input', () => {
    const v = Number(input.value);
    out.textContent = fxFormat(v, step);
    onInput(v);
  });
  const reset = () => {
    input.value = def;
    input.dispatchEvent(new Event('input'));
  };
  return h('div', { class: 'fxe-ctl' },
    h('div', { class: 'fxe-ctl-head', title: 'Double-click to reset', ondblclick: reset }, h('span', null, label), out),
    input);
}

function fxToggle(label, checked, onChange) {
  return h('label', { class: 'fxe-ctl fxe-toggle' },
    h('span', null, label),
    h('input', { type: 'checkbox', class: 'switch', checked: Boolean(checked), onchange: e => onChange(e.target.checked) }));
}

function fxSelectCtl(label, options, value, onChange) {
  return h('label', { class: 'fxe-ctl' },
    h('div', { class: 'fxe-ctl-head' }, h('span', null, label)),
    h('select', { class: 'fxe-select', onchange: e => onChange(e.target.value) },
      options.map(([v, text]) => h('option', { value: v, selected: String(v) === String(value) }, text))));
}

// `show="uModulate>0"`, `show="original"` … – some sliders only matter in certain modes.
function fxParamVisible(p) {
  const cond = p.show;
  if (!cond) return true;
  if (cond === 'original' || cond === '!original') return (fxs.look.palette === 'original') === (cond === 'original');
  const m = cond.match(/^(u\w+)\s*(==|!=|>=|<=|>|<)\s*(-?[\d.]+|true|false)$/);
  if (!m) return true;
  const raw = fxEditTarget().params[m[1]];
  const lhs = typeof raw === 'boolean' ? Number(raw) : Number(raw);
  const rhs = m[3] === 'true' ? 1 : m[3] === 'false' ? 0 : Number(m[3]);
  switch (m[2]) {
    case '==': return lhs === rhs;
    case '!=': return lhs !== rhs;
    case '>': return lhs > rhs;
    case '<': return lhs < rhs;
    case '>=': return lhs >= rhs;
    default: return lhs <= rhs;
  }
}

function fxParamControl(p) {
  const target = fxEditTarget();
  const params = target.params;
  const v = params[p.name];
  const set = val => {
    params[p.name] = val;
    fxChanged();
  };
  // switches and lists can show or hide other sliders
  const setAndRefresh = val => {
    set(val);
    if (target.effect.params.some(x => x.show?.includes(p.name))) fxRenderInspector();
  };
  switch (p.type) {
    case 'bool': return fxToggle(p.label, v, setAndRefresh);
    case 'select': return fxSelectCtl(p.label, p.options.map((o, i) => [i, o]), v, x => setAndRefresh(Number(x)));
    case 'kernel': return fxSelectCtl(p.label, FX_KERNELS.map((k, i) => [i, k.label]), v, x => setAndRefresh(Number(x)));
    case 'color':
      return h('label', { class: 'fxe-ctl fxe-color' }, h('span', null, p.label),
        h('input', { type: 'color', value: v, oninput: e => set(e.target.value) }));
    case 'charset': {
      const textKey = `${p.name}Text`;
      const text = h('input', {
        type: 'text',
        class: 'fxe-text',
        value: params[textKey] || 'HOMBRESAI',
        maxlength: 200,
        placeholder: 'Type your text',
        'aria-label': 'Your text',
        oninput: e => { params[textKey] = e.target.value; fxChanged(); },
      });
      text.hidden = FX_CHARSETS[v]?.id !== 'text';
      return h('div', { class: 'fxe-ctl' },
        fxSelectCtl(p.label, FX_CHARSETS.map((c, i) => [i, c.label]), v, x => {
          set(Number(x));
          text.hidden = FX_CHARSETS[Number(x)]?.id !== 'text';
        }),
        text);
    }
    default:
      return fxSlider(p.label, v, { min: p.min, max: p.max, step: p.step, def: p.default, onInput: set });
  }
}

function fxSetPalette(id) {
  fxs.look.palette = id;
  fxChanged();
  fxRenderInspector();
}

function fxPaletteControls() {
  const look = fxs.look;
  const groups = [...new Set(FX_PALETTES.map(p => p.group))];
  const hexes = fxPaletteHexes();
  return [
    h('label', { class: 'fxe-ctl' },
      h('div', { class: 'fxe-ctl-head' }, h('span', null, 'Palette')),
      h('select', { class: 'fxe-select', id: 'fxePalette', onchange: e => fxSetPalette(e.target.value) },
        groups.map(g => h('optgroup', { label: g }, FX_PALETTES.filter(p => p.group === g)
          .map(p => h('option', { value: p.id, selected: p.id === look.palette }, p.label)))))),
    look.palette === 'auto' && [
      fxSlider('Colors', look.autoCount, { min: 2, max: 16, step: 1, def: 6, onInput: v => {
        look.autoCount = v;
        $('#fxeAutoSwatches')?.replaceChildren(...fxPaletteHexes().map(c => h('span', { style: `background:${c}`, title: c })));
        fxChanged();
      } }),
      fxs.source && fxs.source.kind !== 'image' && h('button', {
        type: 'button',
        class: 'link-btn',
        onclick: () => { fxAutoPalette(look.autoCount, true); fxChanged(); fxRenderInspector(); },
      }, 'Take the colors from the current frame'),
    ],
    look.palette === 'custom'
      ? fxCustomColors()
      : hexes
        ? [
          h('div', { class: 'fxe-swatches', id: look.palette === 'auto' ? 'fxeAutoSwatches' : null }, hexes.map(c => h('span', { style: `background:${c}`, title: c }))),
          h('button', { type: 'button', class: 'link-btn', onclick: () => { look.custom = [...fxPaletteHexes()]; fxSetPalette('custom'); } }, 'Customize these colors'),
        ]
        : h('p', { class: 'muted small' }, 'The effect keeps the colors of your image.'),
  ];
}

function fxCustomColors() {
  const cols = fxs.look.custom;
  const changed = () => { fxChanged(); };
  return h('div', { class: 'fxe-custom' },
    h('div', { class: 'fxe-custom-colors' },
      cols.map((c, i) => h('span', { class: 'fxe-cc' },
        h('input', { type: 'color', value: c, 'aria-label': `Color ${i + 1}`, oninput: e => { cols[i] = e.target.value; changed(); } }),
        cols.length > 2 && h('button', {
          type: 'button',
          class: 'fxe-cc-x',
          title: 'Remove this color',
          'aria-label': `Remove color ${i + 1}`,
          onclick: () => { cols.splice(i, 1); fxRenderInspector(); changed(); },
        }, '×'))),
      cols.length < 16 && h('button', {
        type: 'button',
        class: 'fxe-cc-add',
        title: 'Add a color',
        'aria-label': 'Add a color',
        onclick: () => { cols.push(cols[cols.length - 1]); fxRenderInspector(); changed(); },
      }, '+')),
    h('p', { class: 'muted small' }, 'The first color is the background, the rest go from dark to light.'));
}

function fxAdjustControls() {
  const a = fxs.look.adjust;
  const slider = (key, label, min, max, step) => fxSlider(label, a[key], {
    min, max, step, def: FX_ADJUST_DEFAULTS[key], onInput: v => { a[key] = v; fxChanged(); },
  });
  return [
    slider('brightness', 'Brightness', -1, 1, 0.01),
    slider('contrast', 'Contrast', -1, 1, 0.01),
    slider('saturation', 'Saturation', 0, 2, 0.01),
    slider('gamma', 'Gamma', 0.3, 3, 0.01),
    fxToggle('Invert', a.invert, v => { a.invert = v; fxChanged(); }),
  ];
}

function fxFinishControls() {
  const f = fxs.look.finish;
  const slider = (key, label, min, max, step) => fxSlider(label, f[key], {
    min, max, step, def: FX_FINISH_DEFAULTS[key], onInput: v => { f[key] = v; fxChanged(); },
  });
  const mode = f.bg === 'transparent' ? 'transparent' : /^#/.test(f.bg) ? 'color' : 'auto';
  const setBg = v => { f.bg = v; fxChanged(); fxRenderInspector(); };
  return [
    slider('glow', 'Glow', 0, 1, 0.01),
    slider('glowSize', 'Glow size', 2, 60, 1),
    slider('glowThreshold', 'Glow threshold', 0, 1, 0.01),
    slider('scanlines', 'Scan lines', 0, 1, 0.01),
    slider('vignette', 'Vignette', 0, 1, 0.01),
    slider('grain', 'Grain', 0, 1, 0.01),
    h('div', { class: 'fxe-ctl' },
      h('div', { class: 'fxe-ctl-head' }, h('span', null, 'Background')),
      h('div', { class: 'seg' },
        segBtn(mode === 'auto', () => setBg('auto'), 'Palette'),
        segBtn(mode === 'color', () => setBg(/^#/.test(f.bg) ? f.bg : '#000000'), 'Color'),
        segBtn(mode === 'transparent', () => setBg('transparent'), 'Transparent')),
      mode === 'color' && h('input', { type: 'color', class: 'fxe-bg-color', value: f.bg, 'aria-label': 'Background color', oninput: e => { f.bg = e.target.value; fxChanged(); } })),
  ];
}

function fxExportControls() {
  const s = fxs.source;
  if (!s) return h('p', { class: 'muted small' }, 'Open an image or a video first.');
  const frameButtons = (label = 'Download') => h('div', { class: 'fxe-btn-row' },
    h('button', { type: 'button', class: 'btn primary', id: 'fxeDownloadBtn', onclick: () => fxExportImage(false) }, icon('download', 16), label),
    h('button', { type: 'button', class: 'btn', id: 'fxeSaveBtn', onclick: () => fxExportImage(true) }, icon('cloudUp', 16), 'Save to gallery'));
  const imageOptions = () => {
    const d = fxs.design;
    const max = Math.min(fxs.engine.maxSize, 8192);
    return [
      h('div', { class: 'fxe-ctl' },
        h('div', { class: 'fxe-ctl-head' }, h('span', null, 'Size')),
        h('div', { class: 'seg' }, FX_EXPORT_SCALES.map(k => segBtn(k === fxs.exportScale, () => {
          fxs.exportScale = k;
          fxPersist();
          fxRenderInspector();
        }, `${k}×`, `${Math.min(max, Math.max(d.width, d.height) * k)} px`)))),
      fxSelectCtl('Format', [['png', 'PNG'], ['jpeg', 'JPG'], ['webp', 'WebP']], fxs.exportFormat, v => { fxs.exportFormat = v; fxPersist(); }),
    ];
  };
  if (s.kind === 'image') {
    return [
      imageOptions(),
      frameButtons(),
      fxIsAnimated() && h('div', { class: 'fxe-ctl fxe-clip' },
        h('div', { class: 'fxe-ctl-head' }, h('span', null, 'Animation')),
        h('div', { class: 'seg' }, FX_CLIP_SECONDS.map(n => segBtn(n === fxs.clipSeconds, () => { fxs.clipSeconds = n; fxPersist(); fxRenderInspector(); }, `${n} s`))),
        h('button', { type: 'button', class: 'btn', onclick: fxExportClip }, icon('film', 16), 'Export as video')),
      h('p', { class: 'muted small' }, 'Save to gallery uploads it to your Google Drive like your other images.'),
    ];
  }
  if (s.kind === 'video') {
    const long = Math.max(s.width, s.height);
    const maxSide = Math.min(fxs.engine.maxSize || 4096, 3840);
    const sides = FX_VIDEO_SIDES.filter(x => x <= maxSide);
    if (!sides.length) sides.push(Math.min(long, maxSide));
    const side = sides.includes(fxs.videoSide) ? fxs.videoSide : (sides.includes(1920) ? 1920 : sides[0]);
    if (fxs.videoSide !== side) fxs.videoSide = side; // keep the export in step with the shown choice
    const out = fxVideoExportSize(); // the real encoded size (a non-16:9 clip is capped to stay encodable)
    return [
      h('div', { class: 'fxe-ctl' },
        h('div', { class: 'fxe-ctl-head' }, h('span', null, 'Video size (long side)'), h('output', null, `${out.width} × ${out.height}`)),
        h('div', { class: 'seg' }, sides.map(x => segBtn(x === side, () => { fxs.videoSide = x; fxPersist(); fxRenderInspector(); }, FX_VIDEO_LABELS[x] || `${x} px`, `${x} px${x > long ? ' ↑' : ''}`)))),
      side > long ? h('p', { class: 'muted small' }, `Bigger than the clip – it’s scaled up to ${out.width} × ${out.height}. The effect stays crisp; the footage is enlarged.`) : null,
      fxToggle('Include sound', fxs.exportAudio, v => { fxs.exportAudio = v; fxPersist(); }),
      h('div', { class: 'fxe-btn-row' },
        h('button', { type: 'button', class: 'btn primary', id: 'fxeExportVideoBtn', onclick: fxExportVideo }, icon('film', 16), 'Export video')),
      h('p', { class: 'muted small' }, `The video plays once from the start while it records (${fxRecorderMime()?.includes('mp4') ? 'MP4' : 'WebM'}).`),
      h('div', { class: 'fxe-subhead' }, 'Current frame'),
      imageOptions(),
      frameButtons('Download frame'),
    ];
  }
  return [
    h('div', { class: 'fxe-btn-row' },
      h('button', { type: 'button', class: `btn${fxs.recorder ? ' recording' : ' primary'}`, id: 'fxeRecordBtn', onclick: fxToggleRecord },
        icon(fxs.recorder ? 'stop' : 'record', 16), fxs.recorder ? 'Stop recording' : 'Record video')),
    h('div', { class: 'fxe-subhead' }, 'Current frame'),
    imageOptions(),
    frameButtons('Download frame'),
  ];
}

function fxResetCurrent() {
  const cur = fxs.current;
  if (!cur) return;
  const t = fxEditTarget();
  if (t.layer) {
    t.layer.params = fxDefaultParams(t.layer.effect, t.layer.card.preset);
  } else {
    fxs.params = fxDefaultParams(cur.effect, cur.card?.preset);
    fxs.look = fxDefaultLook(cur.effect, cur.card?.preset);
  }
  fxChanged();
  fxRenderInspector();
}

// ── Export ──────────────────────────────────────────────────────────────────

function fxSetBusy(label, opts = {}) {
  fxs.busy = label ? { label, ...opts } : null;
  $('#fxeBusy').hidden = !label;
  if (!label) return;
  $('#fxeBusyLabel').textContent = label;
  $('#fxeProgress').hidden = opts.progress == null;
  $('#fxeProgressBar').style.width = '0%';
  $('#fxeBusyCancel').hidden = !opts.cancel;
}

function fxBusyProgress(p) {
  $('#fxeProgressBar').style.width = `${Math.round(Math.min(1, Math.max(0, p)) * 100)}%`;
}

function fxExportSize(scale) {
  const d = fxs.design;
  const k = Math.min(scale, Math.min(fxs.engine.maxSize, 8192) / Math.max(d.width, d.height));
  return { width: Math.round(d.width * k), height: Math.round(d.height * k) };
}

const fxEven = n => Math.max(2, Math.round(n / 2) * 2);

// Hardware video encoders (MediaRecorder's H.264/VP9) can't do arbitrarily large frames:
// ~UHD (3840×2160 ≈ 8.3 MP) is the safe ceiling, so a square clip asked for at "4K" would
// become 3840×3840 ≈ 14.7 MP and silently encode to 0 bytes. Target the chosen long side,
// but keep the total pixel count within that ceiling (preserving the aspect ratio).
const FX_VIDEO_PIXEL_CAP = 3840 * 2160;
function fxVideoExportSize() {
  const s = fxs.source;
  const long = Math.max(s.width, s.height);
  let scale = Math.min(fxs.videoSide, fxs.engine.maxSize || 4096) / long; // 4K may upscale a smaller clip
  const pix = (s.width * scale) * (s.height * scale);
  if (pix > FX_VIDEO_PIXEL_CAP) scale *= Math.sqrt(FX_VIDEO_PIXEL_CAP / pix);
  return { width: fxEven(s.width * scale), height: fxEven(s.height * scale) };
}

function fxSlug(text) {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'effect';
}

function fxBaseName() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `hombresai-${fxSlug(fxs.current?.name)}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function fxDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function fxDescribe() {
  const cur = fxs.current;
  const palette = FX_PALETTES.find(p => p.id === fxs.look.palette)?.label || '';
  const settings = cur.effect.params.map(p => {
    const v = fxs.params[p.name];
    const list = { select: p.options, charset: FX_CHARSETS.map(c => c.label), kernel: FX_KERNELS.map(k => k.label) }[p.type];
    const shown = list ? list[v] : p.type === 'bool' ? (v ? 'on' : 'off') : p.type === 'color' ? v : fxFormat(v, p.step);
    return `${p.label} ${shown}`;
  }).join(', ');
  const layers = fxs.stack.filter(l => l.enabled).map(l => l.card.name);
  return `Effect “${cur.name}”${layers.length ? ` + ${layers.join(' + ')}` : ''} (hombresai Effects)${fxs.source?.name ? ` on ${fxs.source.name}` : ''}. Palette: ${palette}. ${settings}`.slice(0, 2000);
}

// Renders one frame at the export size on the canvas and encodes it.
async function fxRenderBlob(size, type) {
  fxSetBusy(`Rendering ${size.width} × ${size.height} px…`, { ownsCanvas: true });
  try {
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
    if (!fxDraw(size)) throw new Error('There’s nothing to export yet.');
    const blob = await new Promise(resolve => $('#fxeCanvas').toBlob(resolve, type, 0.92));
    if (!blob) throw new Error('The browser couldn’t encode the image.');
    return blob;
  } finally {
    fxSetBusy(null);
    fxRequestRender();
  }
}

async function fxExportImage(save) {
  if (fxs.busy || !fxs.source || !fxs.current) return;
  const [type, ext] = FX_FORMATS[fxs.exportFormat] || FX_FORMATS.png;
  if (type === 'image/jpeg' && fxs.look.finish.bg === 'transparent') {
    toast('JPG can’t keep transparency – the background turns black. Pick PNG or WebP to keep it.');
  }
  let blob;
  try {
    blob = await fxRenderBlob(fxExportSize(fxs.exportScale), type);
  } catch (err) {
    toastError(err, 'The export failed');
    return;
  }
  if (!save) {
    fxDownload(blob, `${fxBaseName()}.${ext}`);
    toast('Image downloaded.', 'success', { duration: 2500 });
    return;
  }
  fxSetBusy('Saving to your gallery…');
  try {
    const res = await api('/api/effects/export', {
      body: { data: await blobToBase64(blob), mimeType: type, label: fxs.current.name, description: fxDescribe() },
    });
    state.items.unshift(...res.items);
    updateSpend();
    schedulePoll();
    fxRenderStrip();
    toast('Saved to your gallery – it uploads to Google Drive.', 'success', { action: { label: 'Show', onClick: () => setView('create') } });
  } catch (err) {
    toastError(err, 'Couldn’t save the image');
  } finally {
    fxSetBusy(null);
  }
}

function fxRecorderMime(size) {
  if (typeof MediaRecorder === 'undefined') return null;
  // Frames above 1080p need a higher H.264 level than the default avc1.640028 (Level 4.0),
  // which otherwise reports "supported" yet encodes 0 bytes. avc1.64003C is Level 6.0 (up to 8K);
  // the generic video/mp4 lets Chrome pick a level that fits. vp9 is the cross-browser fallback.
  const big = size && size.width * size.height > 1920 * 1088;
  const mp4 = big
    ? ['video/mp4;codecs=avc1.64003C', 'video/mp4', 'video/mp4;codecs=avc1.640034']
    : ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.42E028', 'video/mp4'];
  const webm = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  // Match the imported video's container when the browser can record it.
  const order = fxs.sourceFormat === 'webm' ? [...webm, ...mp4] : [...mp4, ...webm];
  return order.find(t => MediaRecorder.isTypeSupported(t)) || null;
}

// Records the canvas (plus, optionally, the sound of a video) – stop() resolves with the finished file.
function fxStartRecorder(size, audioFrom = null) {
  const mime = fxRecorderMime(size);
  if (!mime) throw new Error('This browser can’t record video.');
  const stream = $('#fxeCanvas').captureStream(30);
  if (audioFrom) {
    try {
      const audio = audioFrom.captureStream ? audioFrom.captureStream() : audioFrom.mozCaptureStream();
      for (const track of audio.getAudioTracks()) stream.addTrack(track);
    } catch { /* recorded without sound */ }
  }
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: Math.round(Math.min(60e6, Math.max(4e6, size.width * size.height * 6))),
  });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const finished = new Promise(resolve => {
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      resolve(new Blob(chunks, { type: mime.split(';')[0] }));
    };
  });
  recorder.start(250);
  return {
    ext: mime.includes('mp4') ? 'mp4' : 'webm',
    stop: () => {
      if (recorder.state !== 'inactive') recorder.stop();
      return finished.then(fxRemuxBlob);
    },
  };
}

// MediaRecorder writes a fragmented MP4 that video editors (DaVinci Resolve, Premiere…) can't import
// and the browser can't seek. Re-container it into a flat, progressive MP4 – lossless, same H.264.
// WebM and anything unexpected pass through unchanged.
async function fxRemuxBlob(blob) {
  if (typeof FxRemux === 'undefined' || !/mp4/.test(blob.type || '')) return blob;
  try {
    const out = FxRemux.remux(new Uint8Array(await blob.arrayBuffer()));
    return out ? new Blob([out], { type: 'video/mp4' }) : blob;
  } catch {
    return blob;
  }
}

function fxOnce(el, event, timeoutMs = 0) {
  return new Promise(resolve => {
    let timer = 0;
    const done = () => {
      clearTimeout(timer);
      el.removeEventListener(event, done);
      resolve();
    };
    el.addEventListener(event, done);
    if (timeoutMs) timer = setTimeout(done, timeoutMs);
  });
}

const fxNextVideoFrame = (v, cb) => (v.requestVideoFrameCallback ? v.requestVideoFrameCallback(cb) : requestAnimationFrame(cb));

// The video plays once from the start while each frame is rendered at the export size and recorded.
async function fxExportVideo() {
  const s = fxs.source;
  if (!s || s.kind !== 'video' || fxs.busy) return;
  const v = s.el;
  const size = fxVideoExportSize();
  const wasLoop = v.loop;
  const wasMuted = v.muted;
  let rec = null;
  let cancelled = false;
  let finish;
  const finished = new Promise(resolve => { finish = resolve; });
  fxSetBusy('Exporting video…', { ownsCanvas: true, progress: 0, cancel: () => { cancelled = true; finish(); } });
  try {
    v.pause();
    v.loop = false;
    v.muted = !fxs.exportAudio;
    if (v.currentTime > 0) {
      v.currentTime = 0;
      await fxOnce(v, 'seeked', 5000);
    }
    fxApplyTimeline(true); // start on the first keyframe's look
    // Warm up the pipeline at the export size before any footage plays: the first draw at a new
    // (possibly 4K) resolution compiles shaders and allocates framebuffers, which would otherwise
    // stall the opening frames and freeze the start of the recording. gl.finish() forces the GPU
    // to actually complete that work now, while we're still paused.
    const gl = fxs.engine && fxs.engine.gl;
    for (let i = 0; i < 3; i++) {
      fxDraw(size, { refresh: true });
      try { gl && gl.finish(); } catch { /* ignore */ }
      await new Promise(r => requestAnimationFrame(r));
      if (cancelled) break;
    }
    const onFrame = () => {
      if (cancelled || !fxs.busy) return;
      const tl = fxHasTimeline() ? fxTimelineAt(fxVideoTime()) : null;
      if (tl && tl.a) fxDrawTransition(tl, size, { refresh: true }); // crossfade
      else { fxApplyTimeline(); fxDraw(size, { refresh: true }); } // switch as the playhead crosses keyframes
      // Start recording on the first real video frame: starting earlier would hold this frame
      // on the captured stream while the decoder warms up, freezing the start of the export.
      if (!rec) rec = fxStartRecorder(size, fxs.exportAudio ? v : null);
      fxBusyProgress(v.duration ? v.currentTime / v.duration : 0);
      if (!v.ended) fxNextVideoFrame(v, onFrame);
    };
    fxNextVideoFrame(v, onFrame);
    v.addEventListener('ended', finish, { once: true });
    await v.play();
    await finished;
  } catch (err) {
    cancelled = true;
    toastError(err, 'The video export failed');
  }
  v.removeEventListener('ended', finish);
  const blob = rec ? await rec.stop() : null;
  v.loop = wasLoop;
  v.muted = wasMuted;
  fxSetBusy(null);
  v.play().catch(() => {});
  fxRequestRender();
  if (!cancelled && blob?.size) {
    fxDownload(blob, `${fxBaseName()}.${rec.ext}`);
    toast('Video exported – it’s in your downloads.', 'success');
  } else if (!cancelled) {
    toast('The export came out empty – try a smaller video size.', 'error');
  }
}

// Animated effects on a still image: records a short clip.
async function fxExportClip() {
  if (!fxs.source || fxs.busy) return;
  const size = fxExportSize(1);
  size.width = fxEven(size.width);
  size.height = fxEven(size.height);
  let rec = null;
  let cancelled = false;
  fxSetBusy('Recording the animation…', { ownsCanvas: true, progress: 0, cancel: () => { cancelled = true; } });
  try {
    rec = fxStartRecorder(size);
    const t0 = performance.now();
    await new Promise(resolve => {
      const tick = () => {
        const t = (performance.now() - t0) / 1000;
        if (cancelled || t >= fxs.clipSeconds) { resolve(); return; }
        fxDraw(size, { time: t });
        fxBusyProgress(t / fxs.clipSeconds);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  } catch (err) {
    cancelled = true;
    toastError(err, 'The export failed');
  }
  const blob = rec ? await rec.stop() : null;
  fxSetBusy(null);
  fxRequestRender();
  if (!cancelled && blob?.size) {
    fxDownload(blob, `${fxBaseName()}.${rec.ext}`);
    toast('Animation exported – it’s in your downloads.', 'success');
  }
}

async function fxToggleRecord() {
  if (fxs.recorder) {
    const rec = fxs.recorder;
    fxs.recorder = null;
    fxs.recordSize = null;
    fxRenderInspector();
    const blob = await rec.stop();
    if (blob.size) {
      fxDownload(blob, `${fxBaseName()}.${rec.ext}`);
      toast('Recording saved to your downloads.', 'success');
    }
    return;
  }
  const s = fxs.source;
  if (!s || s.kind !== 'camera') return;
  const scale = Math.min(1, 1280 / Math.max(s.width, s.height));
  fxs.recordSize = { width: fxEven(s.width * scale), height: fxEven(s.height * scale) };
  try {
    fxs.recorder = fxStartRecorder(fxs.recordSize);
  } catch (err) {
    fxs.recordSize = null;
    toastError(err);
    return;
  }
  fxRenderInspector();
  fxRequestRender();
}

// ── AI coder ────────────────────────────────────────────────────────────────

function fxCoderAvailable(m) {
  if (m.availableNow === false) return false;
  return (m.provider === 'pollinations' && fxs.coder.pollinations) || (m.provider === 'gemini' && fxs.coder.gemini) || (m.provider === 'cloudflare' && fxs.coder.cloudflare) || m.provider === 'huggingface';
}

function fxPreferredCoder() {
  const models = fxs.coder.models || [];
  return [state.ui.fxCoder, ...models.map(m => m.id)].map(id => models.find(m => m.id === id)).find(m => m && fxCoderAvailable(m)) || null;
}

function fxOpenAi(mode = 'new') {
  if (!fxs.engine) return;
  if (mode !== 'new' && !fxs.current) return;
  fxs.aiMode = mode;
  $('#fxeAiTitle').textContent = mode === 'remix' ? `Remix “${fxs.current.name}” with AI` : 'Create an effect with AI';
  const prompt = $('#fxeAiPrompt');
  prompt.value = '';
  prompt.placeholder = mode === 'remix'
    ? 'What should change? e.g. “make the lines pulse slowly and add a slider for a color tint”'
    : 'Describe the look, e.g. “old thermal camera with a scanning line and false colors”';
  $('#fxeAiExamples').hidden = mode !== 'new';
  $('#fxeAiGo').textContent = mode === 'remix' ? 'Remix effect' : 'Create effect';
  const sel = $('#fxeAiModel');
  sel.replaceChildren(...(fxs.coder.models || []).map(m => h('option', { value: m.id, disabled: !fxCoderAvailable(m) }, `${m.label} – ${m.note}`)));
  const preferred = fxPreferredCoder();
  if (preferred) sel.value = preferred.id;
  $('#fxeAiKeyNote').hidden = fxs.coder.pollinations;
  $('#fxeAiLog').replaceChildren();
  fxAiMsg('');
  $('#fxeAiModal').hidden = false;
  setTimeout(() => prompt.focus(), 30);
}

function fxAiMsg(text, type = 'info') {
  const el = $('#fxeAiMsg');
  el.textContent = text;
  el.className = `settings-msg ${text ? type : ''}`;
}

async function fxAiRun() {
  const btn = $('#fxeAiGo');
  if (btn.disabled) return;
  const prompt = $('#fxeAiPrompt').value.trim();
  if (!prompt) {
    fxAiMsg('Describe the effect first.', 'error');
    return;
  }
  const model = $('#fxeAiModel').value;
  const meta = (fxs.coder.models || []).find(m => m.id === model);
  if (!meta || !fxCoderAvailable(meta)) {
    fxAiMsg('Add a free Pollinations key (or your Gemini key) in Settings first.', 'error');
    return;
  }
  state.ui.fxCoder = model;
  saveUi();
  const remix = fxs.aiMode === 'remix';
  const base = remix ? fxs.current.effect.source : '';
  const log = text => $('#fxeAiLog').append(h('div', null, text));
  $('#fxeAiLog').replaceChildren();
  fxAiMsg('');
  btn.disabled = true;
  try {
    log(`${meta.label} is writing the shader…`);
    let res = await api('/api/effects/ai', { body: { prompt, source: base, model } });
    let check = fxs.engine.compile(res.source);
    for (let attempt = 1; !check.ok && attempt <= 2; attempt++) {
      log(`It didn’t compile – asking for a fix (${attempt}/2)…`);
      res = await api('/api/effects/ai', { body: { prompt, source: res.source, error: fxErrorText(check), model } });
      check = fxs.engine.compile(res.source);
    }
    fxApplyDraft(res.source, { saveId: null, freshLook: !remix });
    $('#fxeAiModal').hidden = true;
    if (check.ok) {
      toast('Your effect is ready – tweak the sliders, then click Save effect.', 'success', { duration: 6000 });
    } else {
      toast('The AI’s code still has an error – it’s open in the code editor, where you can fix it or ask the AI again.', 'error', { duration: 8000 });
      fxOpenCode();
    }
  } catch (err) {
    fxAiMsg(errorText(err), 'error');
  } finally {
    btn.disabled = false;
  }
}

// A new or edited effect that isn’t saved yet. Sliders that still exist keep their values.
function fxApplyDraft(source, { saveId = null, freshLook = false } = {}) {
  const effect = fxParseEffect(source, { id: 'draft', custom: true });
  const program = fxs.engine.compile(source);
  const prev = fxs.current;
  const params = fxDefaultParams(effect);
  if (prev) Object.assign(params, fxCoerceParams(effect, fxs.params));
  fxs.params = params;
  if (freshLook || !fxs.look) fxs.look = fxDefaultLook(effect);
  fxs.current = {
    key: 'draft',
    card: null,
    effect,
    program,
    name: effect.name,
    description: effect.description,
    custom: true,
    draft: true,
    saveId,
  };
  fxs.started = performance.now();
  fxRenderInspector();
  fxMarkActiveCard();
  fxRequestRender();
}

async function fxSaveDraft() {
  const cur = fxs.current;
  if (!cur?.draft) return false;
  if (!cur.program.ok) {
    toast('Fix the errors in the code before saving.', 'error');
    return false;
  }
  try {
    const res = await api('/api/effects/custom', { body: { id: cur.saveId, source: cur.effect.source } });
    const params = fxs.params;
    const look = fxs.look;
    fxs.current = null;
    await fxReloadEffects({ quiet: true });
    fxSelect(res.id);
    fxs.params = { ...fxs.params, ...fxCoerceParams(fxs.current.effect, params) };
    fxs.look = look;
    fxChanged();
    fxRenderInspector();
    fxs.category = fxs.category === 'All' ? 'All' : 'Mine';
    fxRenderLibrary();
    toast(`Saved as ${res.file}.`, 'success');
    return true;
  } catch (err) {
    toastError(err, 'Couldn’t save the effect');
    return false;
  }
}

async function fxDeleteCustom() {
  const cur = fxs.current;
  if (!cur?.custom || cur.draft) return;
  try {
    await api('/api/effects/custom/delete', { body: { id: cur.card.effectId } });
    fxs.current = null;
    await fxReloadEffects({ quiet: true });
    fxSelect(fxs.cards[0]?.key);
    toast('Effect deleted (it’s in effects/custom/.trash if you need it back).');
  } catch (err) {
    toastError(err, 'Couldn’t delete the effect');
  }
}

// ── Code editor ─────────────────────────────────────────────────────────────

function fxOpenCode() {
  const cur = fxs.current;
  if (!cur) return;
  const ta = $('#fxeCodeText');
  ta.value = cur.effect.source;
  $('#fxeCodeFile').textContent = cur.draft
    ? (cur.saveId ? `${cur.saveId}.glsl – unsaved changes` : 'New effect – not saved yet')
    : cur.custom ? cur.effect.file : `${cur.effect.file} – built in, saving creates your own copy`;
  fxShowCodeErrors(cur.program);
  fxUpdateGutter();
  $('#fxeCodeModal').hidden = false;
  setTimeout(() => { ta.focus(); ta.setSelectionRange(0, 0); ta.scrollTop = 0; fxUpdateGutter(); }, 30);
}

function fxUpdateGutter() {
  const ta = $('#fxeCodeText');
  const lines = ta.value.split('\n').length;
  const gutter = $('#fxeGutter');
  if (gutter.dataset.lines !== String(lines)) {
    gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    gutter.dataset.lines = String(lines);
  }
  gutter.scrollTop = ta.scrollTop;
}

function fxGotoLine(n) {
  const ta = $('#fxeCodeText');
  const lines = ta.value.split('\n');
  let pos = 0;
  for (let i = 0; i < n - 1 && i < lines.length; i++) pos += lines[i].length + 1;
  ta.focus();
  ta.setSelectionRange(pos, pos + (lines[n - 1]?.length || 0));
  ta.scrollTop = Math.max(0, (n - 6) * (parseFloat(getComputedStyle(ta).lineHeight) || 20));
  fxUpdateGutter();
}

function fxShowCodeErrors(program) {
  const box = $('#fxeCodeErrors');
  $('#fxeCodeFix').hidden = program.ok;
  if (program.ok) {
    box.replaceChildren(h('span', { class: 'fxe-ok' }, '✓ Compiles'));
    return;
  }
  box.replaceChildren(...(program.errors?.length ? program.errors : [{ line: 0, message: program.log }]).slice(0, 8).map(err => h('button', {
    type: 'button',
    class: 'fxe-err',
    onclick: () => { if (err.line) fxGotoLine(err.line); },
  }, err.line ? h('b', null, `Line ${err.line}`) : null, ` ${err.message}`)));
}

function fxCodeTarget() {
  const cur = fxs.current;
  return cur.draft ? cur.saveId : cur.custom ? cur.card.effectId : null;
}

function fxCodeRun() {
  const source = $('#fxeCodeText').value;
  const program = fxs.engine.compile(source);
  fxShowCodeErrors(program);
  if (program.ok) fxApplyDraft(source, { saveId: fxCodeTarget() });
  return program.ok;
}

async function fxCodeSave() {
  if (!fxCodeRun()) {
    toast('Fix the errors in the code before saving.', 'error');
    return;
  }
  if (await fxSaveDraft()) $('#fxeCodeModal').hidden = true;
}

async function fxCodeFix() {
  const ta = $('#fxeCodeText');
  const program = fxs.engine.compile(ta.value);
  if (program.ok) {
    fxShowCodeErrors(program);
    return;
  }
  const model = fxPreferredCoder();
  if (!model) {
    toast('Add a free Pollinations key (or your Gemini key) in Settings to use the AI coder.', 'error');
    return;
  }
  const btn = $('#fxeCodeFix');
  btn.disabled = true;
  btn.textContent = 'Fixing…';
  try {
    const res = await api('/api/effects/ai', {
      body: { prompt: 'Fix the compile errors and keep the effect working the same way.', source: ta.value, error: fxErrorText(program), model: model.id },
    });
    ta.value = res.source;
    fxUpdateGutter();
    fxCodeRun();
  } catch (err) {
    toastError(err, 'The AI coder failed');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ask AI to fix';
  }
}
