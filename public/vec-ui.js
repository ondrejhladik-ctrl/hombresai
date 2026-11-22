// Vectors – an Illustrator-style vector editor. A drawing is generated the same way as images (an image model, then
// Image Trace) or written by an AI as SVG, and edited with selection, direct-selection, pen and shape tools,
// a properties panel and layers. The artwork lives in <g id="vxDoc">; its direct children are the objects.

const VX_NS = 'http://www.w3.org/2000/svg';
const VX_STORE = 'hombresai-vectors';
const VX_SHAPES = 'path,rect,circle,ellipse,line,polyline,polygon,text';
const VX_SHAPE_TAGS = new Set(VX_SHAPES.split(','));
const VX_GEOMETRY = new Set(['d', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points']);
const VX_FONTS = ['IBM Plex Sans, Arial, sans-serif', 'Arial, Helvetica, sans-serif', 'Georgia, serif', 'Times New Roman, serif', 'Courier New, monospace', 'Impact, sans-serif', 'Trebuchet MS, sans-serif'];
const VX_RATIOS = ['1:1', '4:3', '3:4', '3:2', '2:3', '16:9', '9:16'];
const VX_UNDO_BYTES = 60 * 1024 * 1024;
const VX_VECTOR_STYLE = 'Style: flat vector illustration with bold, clean shapes, a limited palette of solid colours and crisp edges – no gradients, no texture, no noise, no shadows, no photo realism and no text unless asked – isolated on a plain white background.';

const VX_TOOLS = [
  { id: 'select', key: 'v', label: 'Selection (V)', hint: 'Click to select, drag to move · handles scale, the circle rotates · Shift keeps proportions, Alt duplicates', icon: '<path d="M6 3.5 18 12l-5.4 1 3.1 6-2.3 1.2-3.1-6.1L6 17.6z" fill="currentColor"/>' },
  { id: 'direct', key: 'a', label: 'Direct Selection (A)', hint: 'Click a shape to see its anchor points · drag points and handles · Delete removes a point', icon: '<path d="M6 3.5 18 12l-5.4 1 3.1 6-2.3 1.2-3.1-6.1L6 17.6z"/>' },
  { id: 'pen', key: 'p', label: 'Pen (P)', hint: 'Click for corners, drag for curves · click the first point to close · Enter or Esc finishes', icon: '<path d="M12 3.5 17 12l-2.5 6h-5L7 12z"/><path d="M12 3.5v7"/><circle cx="12" cy="12" r="1.4"/><path d="M9.5 21h5"/>' },
  { id: 'rect', key: 'm', label: 'Rectangle (M)', hint: 'Drag to draw · Shift = square · Alt = from the centre · a click makes 100 × 100', icon: '<rect x="4" y="6" width="16" height="12" rx="1"/>' },
  { id: 'ellipse', key: 'l', label: 'Ellipse (L)', hint: 'Drag to draw · Shift = circle · Alt = from the centre', icon: '<ellipse cx="12" cy="12" rx="8" ry="6.5"/>' },
  { id: 'line', key: '\\', label: 'Line (\\)', hint: 'Drag to draw · Shift snaps to 45°', icon: '<path d="M5 19 19 5"/>' },
  { id: 'text', key: 't', label: 'Type (T)', hint: 'Click to place text, then type it in Properties', icon: '<path d="M5 7V4.5h14V7M12 4.5v15M9 19.5h6"/>' },
  { id: 'eyedropper', key: 'i', label: 'Eyedropper (I)', hint: 'Click a shape to copy its colours to the selection (or to the current colours)', icon: '<path d="m14.5 3.5 6 6-2.2 2.2-6-6z"/><path d="m13.5 7-8.6 8.6L4 20l4.4-.9 8.6-8.6"/>' },
  { id: 'hand', key: 'h', label: 'Hand (H, or hold Space)', hint: 'Drag to move around · the wheel scrolls, Ctrl + wheel zooms', icon: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8c0 3.9-2.6 6-6 6-2.6 0-4-1.2-5.4-3.4L4 13.8a1.5 1.5 0 0 1 2.5-1.6L8 14"/>' },
  { id: 'zoom', key: 'z', label: 'Zoom (Z)', hint: 'Click to zoom in · Alt + click zooms out · Ctrl+0 fits the artboard', icon: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M8.5 11h5M11 8.5v5"/>' },
];

const VX_ICONS = {
  alignLeft: '<path d="M4 3v18"/><rect x="7" y="6" width="11" height="4"/><rect x="7" y="14" width="7" height="4"/>',
  alignHCenter: '<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4"/><rect x="8" y="14" width="8" height="4"/>',
  alignRight: '<path d="M20 3v18"/><rect x="6" y="6" width="11" height="4"/><rect x="10" y="14" width="7" height="4"/>',
  alignTop: '<path d="M3 4h18"/><rect x="6" y="7" width="4" height="11"/><rect x="14" y="7" width="4" height="7"/>',
  alignVCenter: '<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14"/><rect x="14" y="8" width="4" height="8"/>',
  alignBottom: '<path d="M3 20h18"/><rect x="6" y="6" width="4" height="11"/><rect x="14" y="10" width="4" height="7"/>',
  distH: '<path d="M4 3v18M20 3v18"/><rect x="9.5" y="7" width="5" height="10"/>',
  distV: '<path d="M3 4h18M3 20h18"/><rect x="7" y="9.5" width="10" height="5"/>',
  front: '<rect x="8" y="8" width="11" height="11" fill="currentColor"/><path d="M5 15V5h10"/>',
  forward: '<rect x="8" y="8" width="11" height="11"/><path d="M5 15V5h10"/><path d="m13.5 11 0 5M11 13.5h5"/>',
  backward: '<rect x="5" y="5" width="11" height="11"/><path d="M19 9v10H9"/><path d="M8 10.5h5"/>',
  back: '<rect x="5" y="5" width="11" height="11"/><path d="M19 9v10H9" stroke-dasharray="2 2"/>',
  flipH: '<path d="M12 3v18" stroke-dasharray="2 2"/><path d="M9 7 4 17h5zM15 7l5 10h-5z"/>',
  flipV: '<path d="M3 12h18" stroke-dasharray="2 2"/><path d="M7 9 17 4v5zM7 15l10 5v-5z"/>',
  group: '<rect x="3.5" y="3.5" width="17" height="17" stroke-dasharray="2.5 2"/><rect x="7" y="7" width="6" height="6"/><rect x="11" y="11" width="6" height="6"/>',
  ungroup: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  duplicate: '<rect x="8" y="8" width="12" height="12"/><path d="M5 16V4h12"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.6 1.6 0 0 0 8.6 21h6.8a1.6 1.6 0 0 0 1.6-1.5L18 7M9 7V4.5h6V7"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7M6.6 6.6C4 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1.1"/>',
  lock: '<rect x="5" y="11" width="14" height="9.5" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="9.5" rx="1"/><path d="M8 11V8a4 4 0 0 1 7.7-1.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  swap: '<path d="M7 4 4 7l3 3M4 7h11a4 4 0 0 1 4 4v1M17 20l3-3-3-3M20 17H9a4 4 0 0 1-4-4v-1"/>',
  none: '<circle cx="12" cy="12" r="8"/><path d="m6.5 17.5 11-11"/>',
  defaults: '<rect x="4" y="4" width="10" height="10" fill="currentColor"/><rect x="10" y="10" width="10" height="10"/>',
  undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12h-1" transform="translate(0 -6)"/>',
  redo: '<path d="m15 7 5 5-5 5"/><path d="M20 12H10a6 6 0 0 0 0 12h1" transform="translate(0 -6)"/>',
  newDoc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M12 10v7M8.5 13.5h7"/>',
  open: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18z"/><path d="M12 15V10.5M9.8 12.6 12 10.4l2.2 2.2"/>',
  trace: '<rect x="3.5" y="3.5" width="17" height="17" rx="1"/><path d="M7 16c2-5 4-7 5-7s1.5 3 3 3 2-2 2-2"/><circle cx="8.5" cy="8.5" r="1.2"/>',
  sparkle: '<path d="M11 3.5 12.8 8l4.7 1.8-4.7 1.8L11 16.2l-1.8-4.6L4.5 9.8 9.2 8z"/><path d="m18.5 14.5.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
};

const vx = {
  ready: false,
  stage: null, view: null, board: null, doc: null, defs: null, overlay: null,
  w: 1000, h: 1000, bg: null,          // artboard size and colour (null = transparent)
  pan: { x: 0, y: 0, k: 1 }, fitted: false,
  tool: 'select', spaceHand: false, pointer: null, hover: null,
  sel: [], node: null, pen: null, drag: null, clip: null, pasteCount: 0,
  fill: '#ffffff', stroke: '#000000', strokeWidth: 1, active: 'fill',
  undo: [], redo: [], current: null,
  tab: 'generate',
  gen: { mode: 'image', prompt: '', model: null, coder: null, ratio: '1:1', change: false, busy: false },
  trace: { ...VT_DEFAULTS },
  lastTrace: null, label: 'Vector',
  coders: null, drawQueued: false, saveTimer: null,
};

const vxN = v => +(+v).toFixed(2);
const vxR1 = v => Math.round(v * 10) / 10;

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(VX_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) el.setAttribute(k, v);
  return el;
}

function vxIcon(name, size = 18) {
  const span = document.createElement('span');
  span.className = 'ico';
  const paths = VX_ICONS[name] || VX_TOOLS.find(t => t.id === name)?.icon || '';
  span.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  return span;
}

function vxIconBtn(name, title, onClick, cls = '') {
  return h('button', { type: 'button', class: `icon-btn vx-ib ${cls}`.trim(), title, 'aria-label': title, onclick: onClick }, vxIcon(name, 17));
}

// ── View, setup ─────────────────────────────────────────────────────────────

function vxOnView(active) {
  if (!active) {
    if (vx.pen) vxPenFinish();
    return;
  }
  if (!vx.ready) vxInit();
  requestAnimationFrame(() => {
    if (!vx.fitted) vxFit();
    vxDraw();
  });
}

function vxInit() {
  vx.ready = true;
  vx.stage = $('#vxStage');
  vx.defs = svgEl('defs', { id: 'vxDefs' });
  vx.view = svgEl('g', { id: 'vxView' });
  vx.board = svgEl('rect', { class: 'vx-board', x: 0, y: 0 });
  vx.doc = svgEl('g', { id: 'vxDoc' });
  vx.overlay = svgEl('g', { class: 'vx-overlay' });
  vx.view.append(vx.board, vx.doc);
  vx.stage.append(vx.defs, vx.view, vx.overlay);
  vxBuildTools();
  vxBuildBar();
  vxLoadSaved();
  vx.current = vxSnapshot();
  vxUpdateBoard();
  vxSetTool('select');
  vxRenderSide();
  vxBindEvents();
  api('/api/effects').then(res => {
    vx.coders = res.coder?.vectorModels || res.coder?.models || [];
    if (vx.tab === 'generate') vxRenderSide();
  }).catch(() => { vx.coders = []; });
}

function vxBindEvents() {
  const st = vx.stage;
  st.addEventListener('pointerdown', vxDown);
  st.addEventListener('pointermove', vxMove);
  st.addEventListener('pointerup', vxUp);
  st.addEventListener('pointercancel', vxUp);
  st.addEventListener('pointerleave', () => { vx.pointer = null; if (vx.hover) { vx.hover = null; vxDrawSoon(); } });
  st.addEventListener('dblclick', vxDblClick);
  st.addEventListener('contextmenu', e => e.preventDefault());
  st.addEventListener('wheel', e => {
    e.preventDefault();
    const p = vxStagePoint(e);
    if (e.ctrlKey || e.metaKey) vxZoomAt(Math.exp(-e.deltaY * 0.0018), p.x, p.y);
    else {
      vx.pan.x -= e.shiftKey ? e.deltaY : e.deltaX;
      vx.pan.y -= e.shiftKey ? 0 : e.deltaY;
      vxApplyView();
    }
  }, { passive: false });
  document.addEventListener('keydown', vxKey);
  document.addEventListener('keyup', e => {
    if (e.key === ' ' && vx.spaceHand) { vx.spaceHand = false; vxCursor(); }
  });
  new ResizeObserver(() => { if (state.ui.view === 'vectors') vxDrawSoon(); }).observe($('#vxViewport'));
  $('#vxFileInput').addEventListener('change', e => { if (e.target.files[0]) vxLoadFile(e.target.files[0]); e.target.value = ''; });
}

function vxBuildTools() {
  $('#vxTools').replaceChildren(
    ...VX_TOOLS.map(t => h('button', {
      type: 'button', class: 'vx-tool', 'data-tool': t.id, title: t.label, 'aria-label': t.label,
      onclick: () => vxSetTool(t.id),
    }, vxIcon(t.id, 20))),
    h('div', { class: 'vx-colors' },
      h('div', { class: 'vx-sw-stack' },
        h('button', { type: 'button', class: 'vx-sw vx-sw-stroke', id: 'vxStrokeSw', title: 'Stroke – click it twice to pick a colour (X switches)', 'aria-label': 'Stroke colour', onclick: () => vxSwatchClick('stroke') }),
        h('button', { type: 'button', class: 'vx-sw vx-sw-fill', id: 'vxFillSw', title: 'Fill – click it twice to pick a colour (X switches)', 'aria-label': 'Fill colour', onclick: () => vxSwatchClick('fill') })),
      h('div', { class: 'vx-sw-tools' },
        vxIconBtn('swap', 'Swap fill and stroke (Shift+X)', vxSwapColors),
        vxIconBtn('none', 'None (/)', () => vxSetCurrent(vx.active, 'none', true)),
        vxIconBtn('defaults', 'Default colours (D)', vxDefaultColors)),
      h('input', { type: 'color', id: 'vxFillInput', class: 'vx-hidden-color', tabindex: '-1', 'aria-hidden': 'true' }),
      h('input', { type: 'color', id: 'vxStrokeInput', class: 'vx-hidden-color', tabindex: '-1', 'aria-hidden': 'true' })));
  for (const which of ['fill', 'stroke']) {
    const input = $(which === 'fill' ? '#vxFillInput' : '#vxStrokeInput');
    input.addEventListener('input', () => vxSetCurrent(which, input.value, false));
    input.addEventListener('change', () => vxSetCurrent(which, input.value, true));
  }
  vxUpdateSwatches();
}

function vxBuildBar() {
  $('#vxBar').replaceChildren(
    h('button', { type: 'button', class: 'btn small ghost', title: 'New, empty artboard', onclick: vxNew }, vxIcon('newDoc', 16), h('span', {}, 'New')),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Open an SVG to edit, or an image to trace', onclick: () => $('#vxFileInput').click() }, vxIcon('open', 16), h('span', {}, 'Open…')),
    h('span', { class: 'vx-bar-sep' }),
    vxIconBtn('undo', 'Undo (Ctrl+Z)', vxUndo),
    vxIconBtn('redo', 'Redo (Ctrl+Shift+Z)', vxRedo),
    h('span', { class: 'vx-bar-sep' }),
    h('div', { class: 'fxe-zoom' },
      h('button', { type: 'button', class: 'icon-btn', title: 'Zoom out (Ctrl+−)', 'aria-label': 'Zoom out', onclick: () => vxZoomCenter(1 / 1.25) }, '−'),
      h('button', { type: 'button', class: 'chip-btn small', id: 'vxZoomLabel', title: 'Fit the artboard (Ctrl+0)', onclick: vxFit }, '100 %'),
      h('button', { type: 'button', class: 'icon-btn', title: 'Zoom in (Ctrl+=)', 'aria-label': 'Zoom in', onclick: () => vxZoomCenter(1.25) }, '+')),
    h('span', { class: 'vx-bar-fill' }),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Download as SVG (Ctrl+S)', onclick: vxDownloadSvg }, vxIcon('download', 16), h('span', {}, 'SVG')),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Download as PNG', onclick: vxDownloadPng }, vxIcon('download', 16), h('span', {}, 'PNG')),
    h('button', { type: 'button', class: 'btn small primary', title: 'Save the drawing to your gallery – it uploads to Google Drive', onclick: vxSaveToGallery }, vxIcon('cloud', 16), h('span', {}, 'Save to gallery')));
}

// ── Coordinates, view ───────────────────────────────────────────────────────

function vxStagePoint(e) {
  const r = vx.stage.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
const vxToDoc = (sx, sy) => [(sx - vx.pan.x) / vx.pan.k, (sy - vx.pan.y) / vx.pan.k];
const vxToScreen = (x, y) => ({ x: x * vx.pan.k + vx.pan.x, y: y * vx.pan.k + vx.pan.y });

function vxApplyView() {
  vx.view.setAttribute('transform', `translate(${vx.pan.x} ${vx.pan.y}) scale(${vx.pan.k})`);
  const label = $('#vxZoomLabel');
  if (label) label.textContent = `${Math.round(vx.pan.k * 100)} %`;
  vxDraw();
  vxStatus();
}

function vxFit() {
  const vp = $('#vxViewport');
  const vw = vp.clientWidth, vh = vp.clientHeight;
  if (!vw || !vh) return;
  vx.fitted = true;
  const k = Math.min((vw - 60) / vx.w, (vh - 60) / vx.h);
  vx.pan = { k: Math.max(0.02, k), x: (vw - vx.w * k) / 2, y: (vh - vx.h * k) / 2 };
  vxApplyView();
}

function vxZoomAt(factor, sx, sy) {
  const k = Math.min(64, Math.max(0.02, vx.pan.k * factor));
  const f = k / vx.pan.k;
  vx.pan = { k, x: sx - (sx - vx.pan.x) * f, y: sy - (sy - vx.pan.y) * f };
  vxApplyView();
}

function vxZoomCenter(factor) {
  const vp = $('#vxViewport');
  vxZoomAt(factor, vp.clientWidth / 2, vp.clientHeight / 2);
}

function vxUpdateBoard() {
  vx.board.setAttribute('width', vx.w);
  vx.board.setAttribute('height', vx.h);
  vx.board.style.fill = vx.bg || '#ffffff';
}

function vxSetBoard(w, hgt) {
  vx.w = Math.max(1, Math.min(20000, Math.round(w) || 1000));
  vx.h = Math.max(1, Math.min(20000, Math.round(hgt) || 1000));
  vxUpdateBoard();
}

// ── Elements, matrices, boxes ───────────────────────────────────────────────

function vxM(el) {
  const list = el.transform?.baseVal;
  if (!list || !list.numberOfItems) return new DOMMatrix();
  const m = list.consolidate().matrix;
  return new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]);
}

function vxSetM(el, m) {
  if (m.isIdentity) { el.removeAttribute('transform'); return; }
  el.setAttribute('transform', `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map(v => +v.toFixed(5)).join(' ')})`);
}

function vxScreenBox(el) {
  let b, m;
  try { b = el.getBBox(); m = el.getCTM(); } catch { return null; }
  if (!m || (!b.width && !b.height)) return null;
  const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
    .map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

function vxUnion(boxes) {
  const list = boxes.filter(Boolean);
  if (!list.length) return null;
  const x = Math.min(...list.map(b => b.x)), y = Math.min(...list.map(b => b.y));
  return { x, y, w: Math.max(...list.map(b => b.x + b.w)) - x, h: Math.max(...list.map(b => b.y + b.h)) - y };
}

const vxSelBox = (list = vx.sel) => vxUnion(list.map(vxScreenBox));

function vxDocBox(elOrBox) {
  const s = elOrBox instanceof Element ? vxScreenBox(elOrBox) : elOrBox;
  if (!s) return null;
  const [x, y] = vxToDoc(s.x, s.y);
  return { x, y, w: s.w / vx.pan.k, h: s.h / vx.pan.k };
}

// the object (direct child of the artwork) that contains a node
function vxTop(node) {
  while (node && node.parentNode !== vx.doc) {
    if (!node.parentNode || node === vx.stage) return null;
    node = node.parentNode;
  }
  return node || null;
}

const vxUsable = el => el && !el.hasAttribute('data-locked') && el.getAttribute('display') !== 'none';
const vxOrdered = list => [...vx.doc.children].filter(c => list.includes(c));
const vxShapesIn = el => [...(VX_SHAPE_TAGS.has(el.tagName) ? [el] : []), ...el.querySelectorAll(VX_SHAPES)];
const vxIsEmpty = () => !vx.doc.children.length;

function vxDeepShape(target) {
  const shape = target?.closest?.(VX_SHAPES);
  return shape && vx.doc.contains(shape) && vxUsable(vxTop(shape)) ? shape : null;
}

// ── History, autosave ───────────────────────────────────────────────────────

function vxSnapshot() {
  return { svg: vx.doc.innerHTML, defs: vx.defs.innerHTML, w: vx.w, h: vx.h, bg: vx.bg };
}

function vxCommit() {
  const s = vxSnapshot();
  const c = vx.current;
  if (c && c.svg === s.svg && c.defs === s.defs && c.w === s.w && c.h === s.h && c.bg === s.bg) return;
  if (c) vx.undo.push(c);
  vx.current = s;
  vx.redo = [];
  let bytes = vx.undo.reduce((sum, u) => sum + u.svg.length, 0);
  while (vx.undo.length > 100 || (bytes > VX_UNDO_BYTES && vx.undo.length > 1)) bytes -= vx.undo.shift().svg.length;
  vxSaveSoon();
  vxStatus();
}

function vxRestore(s) {
  vx.doc.innerHTML = s.svg;
  vx.defs.innerHTML = s.defs;
  vx.w = s.w;
  vx.h = s.h;
  vx.bg = s.bg;
  vxUpdateBoard();
  vx.node = null;
  vx.pen = null;
  vxSelect([]);
  vxSaveSoon();
}

function vxUndo() {
  if (vx.pen) { vxPenFinish(); return; }
  if (!vx.undo.length) return;
  vx.redo.push(vx.current);
  vx.current = vx.undo.pop();
  vxRestore(vx.current);
}

function vxRedo() {
  if (!vx.redo.length) return;
  vx.undo.push(vx.current);
  vx.current = vx.redo.pop();
  vxRestore(vx.current);
}

function vxSaveSoon() {
  clearTimeout(vx.saveTimer);
  vx.saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(VX_STORE, JSON.stringify({ ...vxSnapshot(), label: vx.label }));
    } catch { /* too big for the browser's storage – the drawing still lives until the tab closes */ }
  }, 500);
}

function vxLoadSaved() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(VX_STORE) || 'null'); } catch { /* nothing saved */ }
  if (!saved?.svg && !saved?.w) return;
  vx.doc.innerHTML = saved.svg || '';
  vx.defs.innerHTML = saved.defs || '';
  vx.w = saved.w || 1000;
  vx.h = saved.h || 1000;
  vx.bg = saved.bg || null;
  vx.label = saved.label || 'Vector';
}

function vxNew() {
  if (vx.pen) vxPenFinish();
  vx.doc.replaceChildren();
  vx.defs.replaceChildren();
  vx.bg = null;
  vx.label = 'Vector';
  vx.lastTrace = null;
  vxSetBoard(1000, 1000);
  vxSelect([]);
  vxCommit();
  vxFit();
  if (vx.undo.length) toast('New artboard. Ctrl+Z brings the previous drawing back.');
}

// ── Tools ───────────────────────────────────────────────────────────────────

function vxSetTool(id) {
  if (vx.pen && id !== 'pen') vxPenFinish();
  if (id !== 'direct' && vx.node) vx.node = null;
  vx.tool = id;
  for (const b of document.querySelectorAll('.vx-tool')) b.classList.toggle('active', b.dataset.tool === id);
  vxCursor();
  vxDraw();
  vxStatus();
}

function vxCursor() {
  vx.stage.dataset.tool = vx.spaceHand ? 'hand' : vx.tool;
}

function vxStatus(extra) {
  const el = $('#vxStatus');
  if (!el) return;
  const tool = VX_TOOLS.find(t => t.id === vx.tool);
  const sel = vx.sel.length ? `${vx.sel.length} selected` : `${vx.doc.children.length} objects`;
  const pos = vx.pointer ? vxToDoc(vx.pointer.x, vx.pointer.y).map(v => Math.round(v)).join(', ') : '';
  el.replaceChildren(
    h('span', {}, `${Math.round(vx.pan.k * 100)} %`),
    h('span', {}, `${vx.w} × ${vx.h}`),
    h('span', {}, sel),
    pos && h('span', {}, `x, y ${pos}`),
    h('span', { class: 'vx-hint' }, extra || tool?.hint || ''));
}

// ── Pointer ─────────────────────────────────────────────────────────────────

function vxDown(e) {
  if (e.button === 2) return;
  const p = vxStagePoint(e);
  vx.pointer = p;
  vx.stage.setPointerCapture(e.pointerId);
  const tool = vx.spaceHand || e.button === 1 ? 'hand' : vx.tool;
  const t = e.target;
  if (tool === 'hand') { vx.drag = { type: 'pan', p, pan: { ...vx.pan } }; vx.stage.classList.add('panning'); return; }
  if (tool === 'zoom') { vxZoomAt(e.altKey ? 0.5 : 2, p.x, p.y); return; }
  if (tool === 'select') return vxDownSelect(e, p, t);
  if (tool === 'direct') return vxDownDirect(e, p, t);
  if (tool === 'pen') return vxDownPen(e, p);
  if (tool === 'text') return vxPlaceText(p);
  if (tool === 'eyedropper') return vxPick(t);
  if (['rect', 'ellipse', 'line'].includes(tool)) return vxDownCreate(tool, p, e);
}

function vxMove(e) {
  const p = vxStagePoint(e);
  vx.pointer = p;
  const d = vx.drag;
  if (!d) { vxHover(e); return; }
  const k = vx.pan.k;
  if (d.type === 'pan') {
    vx.pan.x = d.pan.x + p.x - d.p.x;
    vx.pan.y = d.pan.y + p.y - d.p.y;
    vxApplyView();
  } else if (d.type === 'move') {
    let dx = (p.x - d.p.x) / k, dy = (p.y - d.p.y) / k;
    if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    if (!d.moved && Math.hypot(p.x - d.p.x, p.y - d.p.y) < 2) return;
    vx.sel.forEach((el, i) => vxSetM(el, new DOMMatrix().translate(dx, dy).multiply(d.m0[i])));
    d.moved = true;
    vxDrawSoon();
    vxLiveFields();
  } else if (d.type === 'scale') vxDragScale(d, p, e);
  else if (d.type === 'rotate') vxDragRotate(d, p, e);
  else if (d.type === 'marquee') { d.cur = p; vxDrawSoon(); }
  else if (d.type === 'create') { const [x, y] = vxToDoc(p.x, p.y); d.moved = d.moved || Math.hypot(p.x - d.p.x, p.y - d.p.y) > 3; vxUpdateCreate(d, x, y, e); vxDrawSoon(); }
  else if (d.type === 'anchor' || d.type === 'control') vxDragNode(d, p, e);
  else if (d.type === 'pen') vxDragPen(d, p);
  vxStatus();
}

function vxUp() {
  const d = vx.drag;
  vx.drag = null;
  vx.stage.classList.remove('panning');
  if (!d) return;
  if (d.type === 'marquee' && d.cur) {
    const r = { x: Math.min(d.p.x, d.cur.x), y: Math.min(d.p.y, d.cur.y), w: Math.abs(d.cur.x - d.p.x), h: Math.abs(d.cur.y - d.p.y) };
    if (r.w > 2 || r.h > 2) {
      const hits = [...vx.doc.children].filter(el => {
        if (!vxUsable(el)) return false;
        const b = vxScreenBox(el);
        return b && b.x < r.x + r.w && b.x + b.w > r.x && b.y < r.y + r.h && b.y + b.h > r.y;
      });
      vxSelect([...new Set([...d.add, ...hits])]);
    }
  }
  if (['move', 'scale', 'rotate'].includes(d.type) && (d.moved || d.dup)) { vxCommit(); vxRenderSide(); }
  if (d.type === 'create') vxFinishCreate(d);
  if ((d.type === 'anchor' || d.type === 'control') && d.moved) vxCommit();
  vxDraw();
  vxStatus();
}

function vxHover(e) {
  if (vx.tool === 'select' || vx.tool === 'direct' || vx.tool === 'eyedropper') {
    const top = vxTop(e.target);
    const hover = vxUsable(top) ? top : null;
    if (hover !== vx.hover) { vx.hover = hover; vxDrawSoon(); }
  } else if (vx.pen) vxDrawSoon();
  vxStatus();
}

function vxDblClick(e) {
  if (vx.tool === 'pen') { vxPenFinish(); return; }
  const top = vxTop(e.target);
  if (vx.tool === 'select' && top) {
    if (top.tagName === 'text') { vx.tab = 'properties'; vxRenderSide(); $('#vxTextInput')?.select(); }
    else { vxSetTool('direct'); const shape = vxDeepShape(e.target); if (shape) vxNodeOpen(shape); vxDraw(); }
  }
}

// ── Selection tool ──────────────────────────────────────────────────────────

function vxSelect(list, { keepNode = false } = {}) {
  vx.sel = list.filter(el => el && el.isConnected);
  if (!keepNode && vx.node && !vx.sel.includes(vxTop(vx.node.el))) vx.node = null;
  const first = vx.sel[0];
  if (first) {
    const paint = vxPaintOf(first);
    vx.fill = paint.fill;
    vx.stroke = paint.stroke;
    if (paint.width) vx.strokeWidth = paint.width;
    vxUpdateSwatches();
  }
  vxDraw();
  vxRenderSide();
  vxStatus();
}

function vxDownSelect(e, p, t) {
  const handle = t.closest?.('.vx-h');
  if (handle && vx.sel.length) {
    vx.drag = { type: handle.dataset.h === 'rot' ? 'rotate' : 'scale', h: handle.dataset.h, p, box: vxSelBox(), m0: vx.sel.map(vxM) };
    return;
  }
  const hit = vxTop(t);
  if (hit && vxUsable(hit)) {
    if (vx.tab === 'generate') vx.tab = 'properties'; // clicking an object shows its properties
    if (e.shiftKey) {
      vxSelect(vx.sel.includes(hit) ? vx.sel.filter(s => s !== hit) : [...vx.sel, hit]);
      if (!vx.sel.includes(hit)) return;
    } else if (!vx.sel.includes(hit)) vxSelect([hit]);
    let dup = false;
    if (e.altKey) {
      const clones = vxOrdered(vx.sel).map(el => { const c = el.cloneNode(true); el.after(c); return c; });
      vxSelect(clones);
      dup = true;
    }
    vx.drag = { type: 'move', p, m0: vx.sel.map(vxM), moved: false, dup };
    return;
  }
  if (!e.shiftKey && vx.sel.length) vxSelect([]);
  vx.drag = { type: 'marquee', p, add: e.shiftKey ? [...vx.sel] : [] };
}

function vxDragScale(d, p, e) {
  const b = d.box;
  if (!b) return;
  const hd = d.h;
  const left = b.x, right = b.x + b.w, top = b.y, bottom = b.y + b.h;
  let ax = hd.includes('w') ? right : hd.includes('e') ? left : b.x + b.w / 2;
  let ay = hd.includes('n') ? bottom : hd.includes('s') ? top : b.y + b.h / 2;
  if (e.altKey) { ax = b.x + b.w / 2; ay = b.y + b.h / 2; }
  const hx = hd.includes('w') ? left : hd.includes('e') ? right : null;
  const hy = hd.includes('n') ? top : hd.includes('s') ? bottom : null;
  let sx = hx == null || Math.abs(hx - ax) < 1e-6 ? 1 : (hx + p.x - d.p.x - ax) / (hx - ax);
  let sy = hy == null || Math.abs(hy - ay) < 1e-6 ? 1 : (hy + p.y - d.p.y - ay) / (hy - ay);
  if (e.shiftKey) {
    const s = hx == null ? Math.abs(sy) : hy == null ? Math.abs(sx) : Math.max(Math.abs(sx), Math.abs(sy));
    sx = Math.sign(sx || 1) * s;
    sy = Math.sign(sy || 1) * s;
  }
  const clamp = s => (Math.abs(s) < 0.001 ? 0.001 * (Math.sign(s) || 1) : s);
  const [adx, ady] = vxToDoc(ax, ay);
  const m = new DOMMatrix().translate(adx, ady).scale(clamp(sx), clamp(sy)).translate(-adx, -ady);
  vx.sel.forEach((el, i) => vxSetM(el, m.multiply(d.m0[i])));
  d.moved = true;
  vxDrawSoon();
  vxLiveFields();
}

function vxDragRotate(d, p, e) {
  const b = d.box;
  if (!b) return;
  const c = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  let ang = (Math.atan2(p.y - c.y, p.x - c.x) - Math.atan2(d.p.y - c.y, d.p.x - c.x)) * 180 / Math.PI;
  if (e.shiftKey) ang = Math.round(ang / 15) * 15;
  const [cx, cy] = vxToDoc(c.x, c.y);
  const m = new DOMMatrix().translate(cx, cy).rotate(ang).translate(-cx, -cy);
  vx.sel.forEach((el, i) => vxSetM(el, m.multiply(d.m0[i])));
  d.moved = true;
  vxDrawSoon();
  vxStatus(`Rotate ${Math.round(((ang % 360) + 540) % 360 - 180)}°`);
}

// ── Shapes, text, eyedropper ────────────────────────────────────────────────

function vxPaintNew(el, isLine) {
  if (isLine) {
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', vx.stroke !== 'none' ? vx.stroke : vx.fill !== 'none' ? vx.fill : '#000000');
    el.setAttribute('stroke-width', vx.strokeWidth || 1);
    return;
  }
  el.setAttribute('fill', vx.fill);
  el.setAttribute('stroke', vx.stroke);
  if (vx.stroke !== 'none') el.setAttribute('stroke-width', vx.strokeWidth || 1);
}

function vxDownCreate(tool, p, e) {
  const [x, y] = vxToDoc(p.x, p.y);
  const el = svgEl(tool === 'ellipse' ? 'ellipse' : tool);
  vxPaintNew(el, tool === 'line');
  vx.doc.append(el);
  vx.drag = { type: 'create', tool, el, p, x0: x, y0: y, moved: false };
  vxUpdateCreate(vx.drag, x, y, e);
}

function vxUpdateCreate(d, x, y, e) {
  let dx = x - d.x0, dy = y - d.y0;
  const el = d.el;
  if (d.tool === 'line') {
    if (e.shiftKey) {
      const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), len = Math.hypot(dx, dy);
      dx = Math.cos(a) * len;
      dy = Math.sin(a) * len;
    }
    const x1 = e.altKey ? d.x0 - dx : d.x0, y1 = e.altKey ? d.y0 - dy : d.y0;
    for (const [k, v] of [['x1', x1], ['y1', y1], ['x2', d.x0 + dx], ['y2', d.y0 + dy]]) el.setAttribute(k, vxN(v));
    return;
  }
  if (e.shiftKey) { const s = Math.max(Math.abs(dx), Math.abs(dy)); dx = Math.sign(dx || 1) * s; dy = Math.sign(dy || 1) * s; }
  const w = e.altKey ? 2 * dx : dx, hh = e.altKey ? 2 * dy : dy;
  const x0 = e.altKey ? d.x0 - dx : d.x0, y0 = e.altKey ? d.y0 - dy : d.y0;
  const rx = Math.min(x0, x0 + w), ry = Math.min(y0, y0 + hh), rw = Math.abs(w), rh = Math.abs(hh);
  if (d.tool === 'rect') {
    for (const [k, v] of [['x', rx], ['y', ry], ['width', rw], ['height', rh]]) el.setAttribute(k, vxN(v));
  } else {
    for (const [k, v] of [['cx', rx + rw / 2], ['cy', ry + rh / 2], ['rx', rw / 2], ['ry', rh / 2]]) el.setAttribute(k, vxN(v));
  }
}

function vxFinishCreate(d) {
  if (!d.moved) {
    // a click without a drag makes a 100 × 100 shape
    const el = d.el, x = d.x0, y = d.y0;
    if (d.tool === 'rect') for (const [k, v] of [['x', x], ['y', y], ['width', 100], ['height', 100]]) el.setAttribute(k, vxN(v));
    else if (d.tool === 'ellipse') for (const [k, v] of [['cx', x], ['cy', y], ['rx', 50], ['ry', 50]]) el.setAttribute(k, vxN(v));
    else for (const [k, v] of [['x1', x], ['y1', y], ['x2', x + 100], ['y2', y]]) el.setAttribute(k, vxN(v));
  }
  if (vx.tab === 'generate') vx.tab = 'properties';
  vxSelect([d.el]);
  vxCommit();
}

function vxPlaceText(p) {
  const [x, y] = vxToDoc(p.x, p.y);
  const el = svgEl('text', {
    x: vxN(x), y: vxN(y), 'font-size': Math.max(8, Math.round(48 / Math.max(vx.pan.k, 0.25) * 0.5)),
    'font-family': VX_FONTS[0], fill: vx.fill !== 'none' ? vx.fill : '#000000',
  });
  el.textContent = 'Text';
  vx.doc.append(el);
  vxSetTool('select');
  vx.tab = 'properties';
  vxSelect([el]);
  vxCommit();
  requestAnimationFrame(() => { const input = $('#vxTextInput'); input?.focus(); input?.select(); });
}

function vxPick(target) {
  const shape = vxDeepShape(target);
  if (!shape) return;
  const paint = vxPaintOf(shape);
  if (vx.sel.length) {
    vxApplyAttr('fill', paint.fill);
    vxApplyAttr('stroke', paint.stroke);
    if (paint.stroke !== 'none') vxApplyAttr('stroke-width', paint.width || 1);
    vxCommit();
  }
  vx.fill = paint.fill;
  vx.stroke = paint.stroke;
  if (paint.width) vx.strokeWidth = paint.width;
  vxUpdateSwatches();
  vxRenderSide();
}

// ── Pen ─────────────────────────────────────────────────────────────────────

function vxDownPen(e, p) {
  const [x, y] = vxToDoc(p.x, p.y);
  const pen = vx.pen;
  if (pen) {
    const first = pen.cmds[0].p, fs = vxToScreen(first[0], first[1]);
    if (pen.cmds.length > 2 && Math.hypot(fs.x - p.x, fs.y - p.y) < 9) {
      vxPenSegment(pen, first.slice());
      pen.cmds.push({ c: 'Z' });
      vxPenRender();
      vxPenFinish();
      return;
    }
    vxPenSegment(pen, [x, y]);
  } else {
    const el = svgEl('path');
    vxPaintNew(el, false);
    if (vx.stroke === 'none') { el.setAttribute('stroke', '#000000'); el.setAttribute('stroke-width', vx.strokeWidth || 1); }
    vx.doc.append(el);
    vx.pen = { el, cmds: [{ c: 'M', p: [x, y] }], out: null };
  }
  vx.drag = { type: 'pen', p };
  vxPenRender();
}

function vxPenSegment(pen, pt) {
  const prev = pen.cmds[pen.cmds.length - 1];
  if (pen.out) pen.cmds.push({ c: 'C', c1: pen.out, c2: pt.slice(), p: pt });
  else pen.cmds.push({ c: 'L', p: pt });
  pen.out = null;
  return prev;
}

function vxDragPen(d, p) {
  const pen = vx.pen;
  if (!pen || Math.hypot(p.x - d.p.x, p.y - d.p.y) < 3) return;
  const last = pen.cmds[pen.cmds.length - 1];
  if (last.c === 'Z') return;
  const [x, y] = vxToDoc(p.x, p.y);
  const a = last.p;
  pen.out = [x, y];
  const mirror = [2 * a[0] - x, 2 * a[1] - y];
  if (last.c === 'L') Object.assign(last, { c: 'C', c1: pen.cmds[pen.cmds.length - 2].p.slice(), c2: mirror });
  else if (last.c === 'C') last.c2 = mirror;
  vxPenRender();
}

function vxPenRender() {
  vx.pen.el.setAttribute('d', vxPathString(vx.pen.cmds));
  vxDrawSoon();
}

function vxPenFinish() {
  const pen = vx.pen;
  vx.pen = null;
  if (!pen) return;
  if (pen.cmds.filter(c => c.p).length < 2) pen.el.remove();
  else { vxSelect([pen.el]); vxCommit(); }
  vxDraw();
}

// ── Paths: parsing, anchors ─────────────────────────────────────────────────

function vxParsePath(d) {
  const tokens = String(d || '').match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
  const out = [];
  let i = 0, cmd = null, cx = 0, cy = 0, sx = 0, sy = 0, lastC = null, lastQ = null;
  const num = () => parseFloat(tokens[i++]);
  const isCmd = t => /^[A-Za-z]$/.test(t);
  while (i < tokens.length) {
    if (isCmd(tokens[i])) cmd = tokens[i++];
    else if (!cmd) break;
    const rel = cmd !== cmd.toUpperCase();
    const C = cmd.toUpperCase();
    const ox = rel ? cx : 0, oy = rel ? cy : 0;
    if (C === 'Z') { out.push({ c: 'Z' }); cx = sx; cy = sy; lastC = lastQ = null; cmd = null; continue; }
    if (i >= tokens.length || isCmd(tokens[i])) { cmd = null; continue; }
    if (C === 'M') {
      cx = ox + num(); cy = oy + num(); sx = cx; sy = cy;
      out.push({ c: 'M', p: [cx, cy] });
      cmd = rel ? 'l' : 'L';
      lastC = lastQ = null;
    } else if (C === 'L' || C === 'H' || C === 'V') {
      if (C === 'L') { cx = ox + num(); cy = oy + num(); } else if (C === 'H') cx = (rel ? cx : 0) + num(); else cy = (rel ? cy : 0) + num();
      out.push({ c: 'L', p: [cx, cy] });
      lastC = lastQ = null;
    } else if (C === 'C' || C === 'S') {
      const c1 = C === 'C' ? [ox + num(), oy + num()] : lastC ? [2 * cx - lastC[0], 2 * cy - lastC[1]] : [cx, cy];
      const c2 = [ox + num(), oy + num()];
      cx = ox + num(); cy = oy + num();
      out.push({ c: 'C', c1, c2, p: [cx, cy] });
      lastC = c2; lastQ = null;
    } else if (C === 'Q' || C === 'T') {
      const q = C === 'Q' ? [ox + num(), oy + num()] : lastQ ? [2 * cx - lastQ[0], 2 * cy - lastQ[1]] : [cx, cy];
      const x0 = cx, y0 = cy;
      cx = ox + num(); cy = oy + num();
      out.push({ c: 'C', c1: [x0 + 2 / 3 * (q[0] - x0), y0 + 2 / 3 * (q[1] - y0)], c2: [cx + 2 / 3 * (q[0] - cx), cy + 2 / 3 * (q[1] - cy)], p: [cx, cy] });
      lastQ = q; lastC = null;
    } else if (C === 'A') {
      const rx = num(), ry = num(), rot = num(), large = num(), sweep = num();
      const x2 = ox + num(), y2 = oy + num();
      for (const s of vxArc(cx, cy, rx, ry, rot, large, sweep, x2, y2)) out.push({ c: 'C', c1: [s[0], s[1]], c2: [s[2], s[3]], p: [s[4], s[5]] });
      cx = x2; cy = y2;
      lastC = lastQ = null;
    } else break;
  }
  const ok = pt => !pt || pt.every(Number.isFinite);
  return out.filter(c => ok(c.p) && ok(c.c1) && ok(c.c2));
}

// an elliptical arc as cubic Béziers (SVG spec, appendix F.6)
function vxArc(x1, y1, rx, ry, angle, large, sweep, x2, y2) {
  if (x1 === x2 && y1 === y2) return [];
  rx = Math.abs(rx); ry = Math.abs(ry);
  if (!rx || !ry) return [[x1, y1, x2, y2, x2, y2]];
  const phi = angle * Math.PI / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) { rx *= Math.sqrt(lambda); ry *= Math.sqrt(lambda); }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let coef = Math.sqrt(Math.max(0, num / den));
  if (!!large === !!sweep) coef = -coef;
  const cxp = coef * rx * y1p / ry, cyp = -coef * ry * x1p / rx;
  const ccx = cos * cxp - sin * cyp + (x1 + x2) / 2, ccy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx2, vy) => Math.atan2(ux * vy - uy * vx2, ux * vx2 + uy * vy);
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  else if (sweep && dt < 0) dt += 2 * Math.PI;
  const segs = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const step = dt / segs, kk = 4 / 3 * Math.tan(step / 4);
  const out = [];
  let t = t1;
  for (let s = 0; s < segs; s++) {
    const c1 = Math.cos(t), s1 = Math.sin(t), c2 = Math.cos(t + step), s2 = Math.sin(t + step);
    const pts = [[c1 - kk * s1, s1 + kk * c1], [c2 + kk * s2, s2 - kk * c2], [c2, s2]]
      .map(([ux, uy]) => { const x = ux * rx, y = uy * ry; return [cos * x - sin * y + ccx, sin * x + cos * y + ccy]; });
    out.push([...pts[0], ...pts[1], ...pts[2]]);
    t += step;
  }
  return out;
}

function vxPathString(cmds) {
  return cmds.map(c => {
    if (c.c === 'Z') return 'Z';
    if (c.c === 'C') return `C${vxN(c.c1[0])} ${vxN(c.c1[1])} ${vxN(c.c2[0])} ${vxN(c.c2[1])} ${vxN(c.p[0])} ${vxN(c.p[1])}`;
    return `${c.c}${vxN(c.p[0])} ${vxN(c.p[1])}`;
  }).join('');
}

function vxShapeToD(el) {
  const n = a => parseFloat(el.getAttribute(a)) || 0;
  switch (el.tagName) {
    case 'rect': {
      const x = n('x'), y = n('y'), w = n('width'), hh = n('height');
      let rx = el.hasAttribute('rx') ? n('rx') : n('ry'), ry = el.hasAttribute('ry') ? n('ry') : rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, hh / 2);
      if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + hh}H${x}Z`;
      return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + hh - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + hh}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + hh - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
    }
    case 'circle':
    case 'ellipse': {
      const cx = n('cx'), cy = n('cy'), rx = el.tagName === 'circle' ? n('r') : n('rx'), ry = el.tagName === 'circle' ? n('r') : n('ry');
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx} ${cy - ry}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}A${rx} ${ry} 0 0 1 ${cx} ${cy + ry}A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}Z`;
    }
    case 'line': return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
    case 'polyline':
    case 'polygon': {
      const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      let d = '';
      for (let i = 0; i + 1 < pts.length; i += 2) d += `${i ? 'L' : 'M'}${pts[i]} ${pts[i + 1]}`;
      return el.tagName === 'polygon' ? `${d}Z` : d;
    }
    default: return '';
  }
}

const vxNear = (a, b) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;

// a closed subpath often repeats its start point right before Z – that point moves with the start
function vxDupOf(cmds, mi) {
  let j = mi + 1;
  while (j < cmds.length && cmds[j].c !== 'M' && cmds[j].c !== 'Z') j++;
  return cmds[j]?.c === 'Z' && j - 1 > mi && vxNear(cmds[j - 1].p, cmds[mi].p) ? j - 1 : -1;
}

function vxAnchorList(cmds) {
  const dups = new Set();
  cmds.forEach((c, i) => { if (c.c === 'M') { const dup = vxDupOf(cmds, i); if (dup >= 0) dups.add(dup); } });
  return cmds.map((c, i) => i).filter(i => cmds[i].p && !dups.has(i));
}

function vxHandleRef(cmds, i, side) {
  if (side === 'in') {
    if (cmds[i].c === 'C') return [i, 'c2'];
    if (cmds[i].c === 'M') { const dup = vxDupOf(cmds, i); if (dup >= 0 && cmds[dup].c === 'C') return [dup, 'c2']; }
    return null;
  }
  return cmds[i + 1]?.c === 'C' ? [i + 1, 'c1'] : null;
}

function vxAnchorParts(cmds, i) {
  const parts = [[i, 'p']];
  const inn = vxHandleRef(cmds, i, 'in'), out = vxHandleRef(cmds, i, 'out');
  if (inn) parts.push(inn);
  if (out) parts.push(out);
  if (cmds[i].c === 'M') { const dup = vxDupOf(cmds, i); if (dup >= 0) parts.push([dup, 'p']); }
  return parts;
}

const vxCloneCmds = cmds => cmds.map(c => ({ c: c.c, p: c.p?.slice(), c1: c.c1?.slice(), c2: c.c2?.slice() }));

function vxNodeOpen(shape) {
  if (shape.tagName === 'text') { vx.node = null; vxSelect([vxTop(shape)]); return; }
  const d = shape.tagName === 'path' ? shape.getAttribute('d') : vxShapeToD(shape);
  vx.node = { el: shape, cmds: vxParsePath(d), active: null, needsPath: shape.tagName !== 'path' };
  vxSelect([vxTop(shape)], { keepNode: true });
}

// rectangles, ellipses and polygons become paths the first time a point is moved
function vxNodeMakePath() {
  const n = vx.node;
  if (!n?.needsPath) return;
  const path = svgEl('path', { d: vxPathString(n.cmds) });
  for (const a of [...n.el.attributes]) if (!VX_GEOMETRY.has(a.name)) path.setAttribute(a.name, a.value);
  const wasTop = vx.sel.includes(n.el);
  n.el.replaceWith(path);
  if (wasTop) vx.sel = vx.sel.map(s => (s === n.el ? path : s));
  n.el = path;
  n.needsPath = false;
}

function vxDownDirect(e, p, t) {
  const a = t.closest?.('.vx-a, .vx-c');
  if (a && vx.node) {
    const i = +a.dataset.i;
    const isAnchor = a.classList.contains('vx-a');
    if (isAnchor) vx.node.active = i;
    vxNodeMakePath();
    vx.drag = { type: isAnchor ? 'anchor' : 'control', side: a.dataset.side, i, p, cmds0: vxCloneCmds(vx.node.cmds), inv: vx.node.el.getCTM().inverse(), moved: false };
    vxDraw();
    return;
  }
  const shape = vxDeepShape(t);
  if (shape) {
    if (vx.node?.el !== shape) vxNodeOpen(shape);
    return;
  }
  vx.node = null;
  vxSelect([]);
}

function vxDragNode(d, p, e) {
  const n = vx.node;
  if (!n) return;
  const local = pt => { const q = new DOMPoint(pt.x, pt.y).matrixTransform(d.inv); return [q.x, q.y]; };
  const [x0, y0] = local(d.p), [x1, y1] = local(p);
  const dx = x1 - x0, dy = y1 - y0;
  n.cmds = vxCloneCmds(d.cmds0);
  if (d.type === 'anchor') {
    for (const [ci, key] of vxAnchorParts(n.cmds, d.i)) n.cmds[ci][key] = [d.cmds0[ci][key][0] + dx, d.cmds0[ci][key][1] + dy];
  } else {
    const ref = vxHandleRef(n.cmds, d.i, d.side);
    if (!ref) return;
    const h0 = d.cmds0[ref[0]][ref[1]];
    const nh = [h0[0] + dx, h0[1] + dy];
    n.cmds[ref[0]][ref[1]] = nh;
    // a smooth point stays smooth: the opposite handle turns with this one (Alt breaks the pair)
    const other = vxHandleRef(n.cmds, d.i, d.side === 'in' ? 'out' : 'in');
    const anchor = d.cmds0[d.i].p;
    if (other && !e.altKey) {
      const o0 = d.cmds0[other[0]][other[1]];
      const v1 = [h0[0] - anchor[0], h0[1] - anchor[1]], v2 = [anchor[0] - o0[0], anchor[1] - o0[1]];
      const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
      const smooth = l1 > 0.01 && l2 > 0.01 && Math.abs(Math.atan2(v1[0] * v2[1] - v1[1] * v2[0], v1[0] * v2[0] + v1[1] * v2[1])) < 0.17;
      const ln = Math.hypot(nh[0] - anchor[0], nh[1] - anchor[1]);
      if (smooth && ln > 0.01) n.cmds[other[0]][other[1]] = [anchor[0] - (nh[0] - anchor[0]) / ln * l2, anchor[1] - (nh[1] - anchor[1]) / ln * l2];
    }
  }
  n.el.setAttribute('d', vxPathString(n.cmds));
  d.moved = true;
  vxDrawSoon();
}

function vxNodeNudge(dx, dy) {
  const n = vx.node;
  if (n?.active == null) return;
  vxNodeMakePath();
  const inv = n.el.getCTM().inverse();
  const a = new DOMPoint(0, 0).matrixTransform(inv), b = new DOMPoint(dx * vx.pan.k, dy * vx.pan.k).matrixTransform(inv);
  for (const [ci, key] of vxAnchorParts(n.cmds, n.active)) n.cmds[ci][key] = [n.cmds[ci][key][0] + b.x - a.x, n.cmds[ci][key][1] + b.y - a.y];
  n.el.setAttribute('d', vxPathString(n.cmds));
  vxCommit();
  vxDraw();
}

function vxNodeDelete() {
  const n = vx.node;
  if (n?.active == null) return;
  vxNodeMakePath();
  const cmds = n.cmds, i = n.active;
  if (vxAnchorList(cmds).length <= 2) {
    const top = vxTop(n.el);
    n.el.remove();
    if (top && top !== n.el && !top.querySelector(VX_SHAPES)) top.remove();
    vx.node = null;
    vxSelect([]);
    vxCommit();
    return;
  }
  if (cmds[i].c === 'M') {
    const next = cmds[i + 1];
    if (!next?.p) return;
    const dup = vxDupOf(cmds, i);
    cmds.splice(i, 2, { c: 'M', p: next.p.slice() });
    if (dup >= 0) cmds[dup - 1].p = next.p.slice();
  } else {
    const next = cmds[i + 1];
    if (next?.c === 'C' && cmds[i].c === 'C') next.c1 = cmds[i].c1;
    cmds.splice(i, 1);
  }
  n.active = null;
  n.el.setAttribute('d', vxPathString(cmds));
  vxCommit();
  vxDraw();
}

// ── Overlay ─────────────────────────────────────────────────────────────────

function vxDrawSoon() {
  if (vx.drawQueued) return;
  vx.drawQueued = true;
  requestAnimationFrame(() => { vx.drawQueued = false; vxDraw(); });
}

function vxDraw() {
  if (!vx.ready) return;
  const o = vx.overlay;
  o.replaceChildren();
  const add = (tag, attrs) => { const el = svgEl(tag, attrs); o.append(el); return el; };
  const rect = (b, cls) => add('rect', { x: b.x, y: b.y, width: Math.max(b.w, 0.5), height: Math.max(b.h, 0.5), class: cls });

  if (vx.hover && !vx.sel.includes(vx.hover) && !vx.drag && vx.hover.isConnected) {
    const b = vxScreenBox(vx.hover);
    if (b) rect(b, 'vx-hover');
  }
  if (vx.sel.length && !vx.node) {
    if (vx.sel.length > 1) for (const el of vx.sel) { const b = vxScreenBox(el); if (b) rect(b, 'vx-sel-item'); }
    const b = vxSelBox();
    if (b) {
      rect(b, 'vx-sel');
      if (vx.tool === 'select') {
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        add('line', { x1: cx, y1: b.y, x2: cx, y2: b.y - 22, class: 'vx-rot-line' });
        add('circle', { cx, cy: b.y - 22, r: 5, class: 'vx-h vx-rot', 'data-h': 'rot' });
        const handles = { nw: [b.x, b.y], n: [cx, b.y], ne: [b.x + b.w, b.y], e: [b.x + b.w, cy], se: [b.x + b.w, b.y + b.h], s: [cx, b.y + b.h], sw: [b.x, b.y + b.h], w: [b.x, cy] };
        for (const [id, [x, y]] of Object.entries(handles)) add('rect', { x: x - 4, y: y - 4, width: 8, height: 8, class: 'vx-h', 'data-h': id });
      }
    }
  }
  const n = vx.node;
  if (n && n.el.isConnected) {
    const m = n.el.getCTM();
    if (m) {
      const sp = pt => new DOMPoint(pt[0], pt[1]).matrixTransform(m);
      add('path', { d: vxPathString(n.cmds), transform: `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`, class: 'vx-node-path' });
      if (n.active != null && n.cmds[n.active]) {
        const a = sp(n.cmds[n.active].p);
        for (const side of ['in', 'out']) {
          const ref = vxHandleRef(n.cmds, n.active, side);
          if (!ref) continue;
          const q = sp(n.cmds[ref[0]][ref[1]]);
          add('line', { x1: a.x, y1: a.y, x2: q.x, y2: q.y, class: 'vx-hline' });
          add('circle', { cx: q.x, cy: q.y, r: 4, class: 'vx-c', 'data-i': n.active, 'data-side': side });
        }
      }
      for (const i of vxAnchorList(n.cmds)) {
        const q = sp(n.cmds[i].p);
        add('rect', { x: q.x - 3.5, y: q.y - 3.5, width: 7, height: 7, class: `vx-a${i === n.active ? ' on' : ''}`, 'data-i': i });
      }
    }
  }
  if (vx.pen) {
    const cmds = vx.pen.cmds;
    const sp = pt => vxToScreen(pt[0], pt[1]);
    const last = cmds[cmds.length - 1];
    if (vx.pointer && !vx.drag && last.p) {
      const a = sp(last.p), q = vx.pointer;
      const o1 = vx.pen.out ? sp(vx.pen.out) : null;
      add('path', { d: o1 ? `M${a.x} ${a.y}C${o1.x} ${o1.y} ${q.x} ${q.y} ${q.x} ${q.y}` : `M${a.x} ${a.y}L${q.x} ${q.y}`, class: 'vx-rubber' });
    }
    if (vx.pen.out && last.p) {
      const a = sp(last.p), q = sp(vx.pen.out);
      add('line', { x1: a.x, y1: a.y, x2: q.x, y2: q.y, class: 'vx-hline' });
      add('circle', { cx: q.x, cy: q.y, r: 3.5, class: 'vx-c' });
    }
    cmds.forEach((c, i) => {
      if (!c.p) return;
      const q = sp(c.p);
      add('rect', { x: q.x - 3.5, y: q.y - 3.5, width: 7, height: 7, class: `vx-a${i === 0 && cmds.length > 2 ? ' start' : ''}${i === cmds.length - 1 ? ' on' : ''}` });
    });
  }
  const d = vx.drag;
  if (d?.type === 'marquee' && d.cur) rect({ x: Math.min(d.p.x, d.cur.x), y: Math.min(d.p.y, d.cur.y), w: Math.abs(d.cur.x - d.p.x), h: Math.abs(d.cur.y - d.p.y) }, 'vx-marquee');
}

// ── Operations ──────────────────────────────────────────────────────────────

function vxTransformSel(m) {
  vx.sel.forEach(el => vxSetM(el, m.multiply(vxM(el))));
}

function vxMoveBy(dx, dy) {
  if (!vx.sel.length) return;
  vxTransformSel(new DOMMatrix().translate(dx, dy));
  vxCommit();
  vxDraw();
  vxLiveFields();
}

function vxSetBox({ x, y, w, h: hh }, constrain) {
  const b = vxDocBox(vxSelBox());
  if (!b) return;
  let sx = w != null && b.w ? w / b.w : 1, sy = hh != null && b.h ? hh / b.h : 1;
  if (constrain) { if (w != null) sy = sx; else if (hh != null) sx = sy; }
  const m = new DOMMatrix()
    .translate(x != null ? x : b.x, y != null ? y : b.y)
    .scale(sx, sy)
    .translate(-b.x, -b.y);
  vxTransformSel(m);
  vxCommit();
  vxDraw();
  vxRenderSide();
}

function vxRotateBy(deg) {
  const b = vxDocBox(vxSelBox());
  if (!b || !deg) return;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  vxTransformSel(new DOMMatrix().translate(cx, cy).rotate(deg).translate(-cx, -cy));
  vxCommit();
  vxDraw();
  vxRenderSide();
}

function vxFlip(horizontal) {
  const b = vxDocBox(vxSelBox());
  if (!b) return;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  vxTransformSel(new DOMMatrix().translate(cx, cy).scale(horizontal ? -1 : 1, horizontal ? 1 : -1).translate(-cx, -cy));
  vxCommit();
  vxDraw();
}

function vxDuplicate() {
  if (!vx.sel.length) return;
  const clones = vxOrdered(vx.sel).map(el => {
    const c = el.cloneNode(true);
    vxSetM(c, new DOMMatrix().translate(10, 10).multiply(vxM(el)));
    el.after(c);
    return c;
  });
  vxSelect(clones);
  vxCommit();
}

function vxDelete() {
  if (!vx.sel.length) return;
  vx.sel.forEach(el => el.remove());
  vxSelect([]);
  vxCommit();
}

function vxCopy(cut) {
  if (!vx.sel.length) return;
  vx.clip = vxOrdered(vx.sel).map(el => el.cloneNode(true));
  vx.pasteCount = 0;
  if (cut) vxDelete();
}

function vxPaste() {
  if (!vx.clip?.length) return;
  vx.pasteCount++;
  const off = 10 * vx.pasteCount;
  const clones = vx.clip.map(el => {
    const c = el.cloneNode(true);
    vxSetM(c, new DOMMatrix().translate(off, off).multiply(vxM(el)));
    vx.doc.append(c);
    return c;
  });
  vxSelect(clones);
  vxCommit();
}

function vxGroup() {
  const sel = vxOrdered(vx.sel);
  if (!sel.length) return;
  const g = svgEl('g', { 'data-name': 'Group' });
  sel[sel.length - 1].after(g);
  sel.forEach(el => g.append(el));
  vxSelect([g]);
  vxCommit();
}

function vxUngroup() {
  const out = [];
  let changed = false;
  for (const g of vxOrdered(vx.sel)) {
    if (g.tagName !== 'g') { out.push(g); continue; }
    changed = true;
    const gm = vxM(g);
    const inherit = ['fill', 'stroke', 'stroke-width', 'fill-rule', 'stroke-linecap', 'stroke-linejoin', 'font-family', 'font-size', 'font-weight'].filter(a => g.hasAttribute(a));
    const op = g.getAttribute('opacity');
    for (const c of [...g.children]) {
      g.before(c);
      if (!(c instanceof SVGGraphicsElement)) continue;
      vxSetM(c, gm.multiply(vxM(c)));
      for (const a of inherit) if (!c.hasAttribute(a)) c.setAttribute(a, g.getAttribute(a));
      if (op != null) c.setAttribute('opacity', +(op * (c.getAttribute('opacity') ?? 1)).toFixed(3));
      out.push(c);
    }
    g.remove();
  }
  if (!changed) return;
  vxSelect(out);
  vxCommit();
}

function vxArrange(where) {
  const sel = vxOrdered(vx.sel);
  if (!sel.length) return;
  if (where === 'front') sel.forEach(el => vx.doc.append(el));
  if (where === 'back') [...sel].reverse().forEach(el => vx.doc.prepend(el));
  if (where === 'forward') [...sel].reverse().forEach(el => { const n = el.nextElementSibling; if (n && !vx.sel.includes(n)) n.after(el); });
  if (where === 'backward') sel.forEach(el => { const p = el.previousElementSibling; if (p && !vx.sel.includes(p)) p.before(el); });
  vxCommit();
  vxDraw();
  vxRenderSide();
}

function vxAlign(how) {
  const els = vx.sel;
  if (!els.length) return;
  const boxes = els.map(el => vxDocBox(el));
  const t = els.length > 1 ? vxUnion(boxes) : { x: 0, y: 0, w: vx.w, h: vx.h };
  els.forEach((el, i) => {
    const b = boxes[i];
    if (!b) return;
    let dx = 0, dy = 0;
    if (how === 'left') dx = t.x - b.x;
    if (how === 'hcenter') dx = t.x + t.w / 2 - (b.x + b.w / 2);
    if (how === 'right') dx = t.x + t.w - (b.x + b.w);
    if (how === 'top') dy = t.y - b.y;
    if (how === 'vcenter') dy = t.y + t.h / 2 - (b.y + b.h / 2);
    if (how === 'bottom') dy = t.y + t.h - (b.y + b.h);
    vxSetM(el, new DOMMatrix().translate(dx, dy).multiply(vxM(el)));
  });
  vxCommit();
  vxDraw();
  vxRenderSide();
}

function vxDistribute(horizontal) {
  const items = vx.sel.map(el => ({ el, b: vxDocBox(el) })).filter(i => i.b);
  if (items.length < 3) { toast('Select at least 3 objects to distribute them.'); return; }
  const c = i => (horizontal ? i.b.x + i.b.w / 2 : i.b.y + i.b.h / 2);
  items.sort((a, b) => c(a) - c(b));
  const first = c(items[0]), step = (c(items[items.length - 1]) - first) / (items.length - 1);
  items.forEach((it, i) => {
    const delta = first + step * i - c(it);
    vxSetM(it.el, new DOMMatrix().translate(horizontal ? delta : 0, horizontal ? 0 : delta).multiply(vxM(it.el)));
  });
  vxCommit();
  vxDraw();
}

function vxFitInto(el, frac = 0.8) {
  const b = vxDocBox(el);
  if (!b || !b.w || !b.h) return;
  const s = Math.min((vx.w * frac) / b.w, (vx.h * frac) / b.h);
  const m = new DOMMatrix().translate(vx.w / 2, vx.h / 2).scale(s).translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
  vxSetM(el, m.multiply(vxM(el)));
}

function vxFitBoardToArt() {
  const b = vxDocBox(vxUnion([...vx.doc.children].map(vxScreenBox)));
  if (!b) return;
  const m = new DOMMatrix().translate(-b.x, -b.y);
  [...vx.doc.children].forEach(el => vxSetM(el, m.multiply(vxM(el))));
  vxSetBoard(Math.ceil(b.w), Math.ceil(b.h));
  vxCommit();
  vxFit();
  vxRenderSide();
}

// ── Colours ─────────────────────────────────────────────────────────────────

function vxCssColor(v) {
  if (!v || v === 'none' || v === 'transparent') return 'none';
  if (v.startsWith('url(')) return 'gradient';
  const m = v.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
  if (m) return m[4] === '0' ? 'none' : `#${[m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join('')}`;
  return v;
}

function vxPaintOf(el) {
  const shape = VX_SHAPE_TAGS.has(el.tagName) ? el : el.querySelector(VX_SHAPES);
  if (!shape) return { fill: 'none', stroke: 'none', width: 0 };
  const cs = getComputedStyle(shape);
  return { fill: vxCssColor(cs.fill), stroke: vxCssColor(cs.stroke), width: vxR1(parseFloat(cs.strokeWidth) || 0) };
}

function vxApplyAttr(attr, value) {
  for (const el of vx.sel) {
    const targets = attr === 'opacity' ? [el] : vxShapesIn(el);
    if (el.tagName === 'g' && attr !== 'opacity' && el.hasAttribute(attr)) el.setAttribute(attr, value);
    for (const s of targets) {
      if (value == null || value === '') s.removeAttribute(attr);
      else s.setAttribute(attr, value);
      s.style?.removeProperty(attr);
    }
  }
}

function vxSetCurrent(which, value, commit) {
  if (which === 'fill') vx.fill = value; else vx.stroke = value;
  if (vx.sel.length && value !== 'gradient') {
    vxApplyAttr(which, value);
    if (which === 'stroke' && value !== 'none') {
      for (const el of vx.sel) for (const s of vxShapesIn(el)) if (!parseFloat(getComputedStyle(s).strokeWidth)) s.setAttribute('stroke-width', vx.strokeWidth || 1);
    }
    if (commit) { vxCommit(); vxRenderSide(); }
  }
  vxUpdateSwatches();
}

function vxSwatchClick(which) {
  if (vx.active !== which) { vx.active = which; vxUpdateSwatches(); return; }
  const input = $(which === 'fill' ? '#vxFillInput' : '#vxStrokeInput');
  const v = which === 'fill' ? vx.fill : vx.stroke;
  input.value = /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000';
  input.click();
}

function vxSwapColors() {
  [vx.fill, vx.stroke] = [vx.stroke, vx.fill];
  if (vx.sel.length) {
    vxApplyAttr('fill', vx.fill);
    vxApplyAttr('stroke', vx.stroke);
    if (vx.stroke !== 'none') vxApplyAttr('stroke-width', vx.strokeWidth || 1);
    vxCommit();
    vxRenderSide();
  }
  vxUpdateSwatches();
}

function vxDefaultColors() {
  vx.fill = '#ffffff';
  vx.stroke = '#000000';
  vx.strokeWidth = 1;
  if (vx.sel.length) { vxApplyAttr('fill', vx.fill); vxApplyAttr('stroke', vx.stroke); vxApplyAttr('stroke-width', 1); vxCommit(); vxRenderSide(); }
  vxUpdateSwatches();
}

function vxUpdateSwatches() {
  for (const which of ['fill', 'stroke']) {
    const sw = $(which === 'fill' ? '#vxFillSw' : '#vxStrokeSw');
    if (!sw) continue;
    const v = which === 'fill' ? vx.fill : vx.stroke;
    sw.style.setProperty('--c', /^#|^rgb/.test(v) ? v : 'transparent');
    sw.classList.toggle('none', v === 'none');
    sw.classList.toggle('grad', v === 'gradient');
    sw.classList.toggle('on', vx.active === which);
  }
}

// ── Side panel ──────────────────────────────────────────────────────────────

function vxRenderSide() {
  if (!vx.ready) return;
  const tabs = [['properties', 'Properties'], ['layers', 'Layers'], ['generate', 'Generate']];
  $('#vxTabs').replaceChildren(...tabs.map(([id, label]) => h('button', {
    type: 'button', role: 'tab', class: `vx-tab${vx.tab === id ? ' active' : ''}`, 'aria-selected': String(vx.tab === id),
    onclick: () => { vx.tab = id; vxRenderSide(); },
  }, label)));
  const panel = $('#vxPanel');
  const scroll = panel.scrollTop;
  panel.replaceChildren(...(vx.tab === 'layers' ? vxPanelLayers() : vx.tab === 'generate' ? vxPanelGenerate() : vxPanelProperties()).filter(Boolean));
  panel.scrollTop = scroll;
}

const vxSec = (title, ...body) => h('section', { class: 'vx-sec' }, h('h3', {}, title), ...body);

function vxField(label, value, onSet, { id, step = 1, min, max, suffix, width } = {}) {
  const input = h('input', { type: 'number', class: 'vx-num', id, step, min, max, value: value == null ? '' : vxR1(value), style: width ? `width:${width}` : null });
  const apply = () => { const v = parseFloat(input.value); if (Number.isFinite(v)) onSet(v); };
  input.addEventListener('change', apply);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
  return h('label', { class: 'vx-field' }, h('span', {}, label), input, suffix && h('em', {}, suffix));
}

function vxColorField(label, value, onInput, onCommit, { allowNone = true } = {}) {
  const color = h('input', { type: 'color', class: 'vx-color', value: /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000', title: `${label} colour` });
  color.addEventListener('input', () => onInput(color.value));
  color.addEventListener('change', () => onCommit(color.value));
  return h('div', { class: `vx-color-row${value === 'none' ? ' is-none' : ''}` },
    h('span', { class: 'vx-color-label' }, label),
    color,
    h('code', {}, value === 'none' ? 'none' : value === 'gradient' ? 'gradient' : value),
    allowNone && h('button', { type: 'button', class: `chip-btn small${value === 'none' ? ' active' : ''}`, title: `No ${label.toLowerCase()}`, onclick: () => onCommit('none') }, 'None'));
}

function vxLiveFields() {
  if (vx.tab !== 'properties') return;
  const b = vxDocBox(vxSelBox());
  if (!b) return;
  for (const [id, v] of [['#vxFX', b.x], ['#vxFY', b.y], ['#vxFW', b.w], ['#vxFH', b.h]]) { const el = $(id); if (el && document.activeElement !== el) el.value = vxR1(v); }
}

function vxPanelProperties() {
  const sel = vx.sel;
  if (!sel.length) {
    return [
      vxSec('Artboard',
        h('div', { class: 'vx-grid2' },
          vxField('W', vx.w, v => { vxSetBoard(v, vx.h); vxCommit(); vxFit(); vxRenderSide(); }, { min: 1 }),
          vxField('H', vx.h, v => { vxSetBoard(vx.w, v); vxCommit(); vxFit(); vxRenderSide(); }, { min: 1 })),
        vxColorField('Background', vx.bg || 'none',
          v => { vx.bg = v; vxUpdateBoard(); },
          v => { vx.bg = v === 'none' ? null : v; vxUpdateBoard(); vxCommit(); vxRenderSide(); }),
        h('p', { class: 'vx-note' }, 'With no background the SVG and PNG exports are transparent.'),
        h('button', { type: 'button', class: 'btn small', onclick: vxFitBoardToArt, disabled: vxIsEmpty() }, vxIcon('fit', 15), 'Fit artboard to artwork')),
      vxSec('Start',
        h('p', { class: 'vx-note' }, 'Generate a drawing in the Generate tab, open an SVG or an image (Open… or drop a file here), or draw with the tools on the left.'),
        h('p', { class: 'vx-note' }, 'Shortcuts: V select · A direct select · P pen · M rectangle · L ellipse · T type · Space+drag to pan · Ctrl+Z undo · Ctrl+G group · Ctrl+D duplicate.')),
    ];
  }
  const one = sel.length === 1 ? sel[0] : null;
  const kind = one ? vxKindName(one) : `${sel.length} objects`;
  const b = vxDocBox(vxSelBox()) || { x: 0, y: 0, w: 0, h: 0 };
  const paint = vxPaintOf(sel[0]);
  const opacity = Math.round((parseFloat(sel[0].getAttribute('opacity') ?? 1)) * 100);
  const constrain = vx.constrain !== false;
  const text = one?.tagName === 'text' ? one : null;

  return [
    h('div', { class: 'vx-kind' }, h('b', {}, kind), one?.dataset.name && h('span', {}, one.dataset.name)),
    vxSec('Transform',
      h('div', { class: 'vx-grid2' },
        vxField('X', b.x, v => vxSetBox({ x: v }), { id: 'vxFX' }),
        vxField('Y', b.y, v => vxSetBox({ y: v }), { id: 'vxFY' }),
        vxField('W', b.w, v => vxSetBox({ w: Math.max(0.1, v) }, constrain), { id: 'vxFW', min: 0.1 }),
        vxField('H', b.h, v => vxSetBox({ h: Math.max(0.1, v) }, constrain), { id: 'vxFH', min: 0.1 })),
      h('div', { class: 'vx-row' },
        vxIconBtn('link', constrain ? 'Proportions locked – click to unlock' : 'Proportions free – click to lock', () => { vx.constrain = !constrain; vxRenderSide(); }, constrain ? 'on' : ''),
        vxField('Rotate', 0, v => vxRotateBy(v), { suffix: '°', width: '64px' }),
        vxIconBtn('flipH', 'Flip horizontally', () => vxFlip(true)),
        vxIconBtn('flipV', 'Flip vertically', () => vxFlip(false)))),
    vxSec('Appearance',
      vxColorField('Fill', paint.fill, v => vxSetCurrent('fill', v, false), v => vxSetCurrent('fill', v, true)),
      vxColorField('Stroke', paint.stroke, v => vxSetCurrent('stroke', v, false), v => vxSetCurrent('stroke', v, true)),
      h('div', { class: 'vx-grid2' },
        vxField('Width', paint.width, v => { vx.strokeWidth = Math.max(0, v); vxApplyAttr('stroke-width', Math.max(0, v)); vxCommit(); }, { min: 0, step: 0.5, suffix: 'px' }),
        vxField('Opacity', opacity, v => { const o = Math.max(0, Math.min(100, v)) / 100; vxApplyAttr('opacity', o >= 1 ? null : o); vxCommit(); }, { min: 0, max: 100, suffix: '%' }))),
    text && vxSec('Type',
      (() => {
        const input = h('input', { type: 'text', class: 'vx-text', id: 'vxTextInput', value: text.textContent });
        input.addEventListener('input', () => { text.textContent = input.value; vxDrawSoon(); });
        input.addEventListener('change', () => { vxCommit(); vxRenderSide(); });
        return input;
      })(),
      h('div', { class: 'vx-grid2' },
        vxField('Size', parseFloat(text.getAttribute('font-size')) || 16, v => { text.setAttribute('font-size', Math.max(1, v)); vxCommit(); vxDraw(); }, { min: 1, suffix: 'px' }),
        h('button', { type: 'button', class: `chip-btn small${/bold|[6-9]00/.test(text.getAttribute('font-weight') || '') ? ' active' : ''}`, onclick: () => { text.setAttribute('font-weight', /bold|[6-9]00/.test(text.getAttribute('font-weight') || '') ? 'normal' : 'bold'); vxCommit(); vxDraw(); vxRenderSide(); } }, 'Bold')),
      (() => {
        const current = text.getAttribute('font-family') || VX_FONTS[0];
        const select = h('select', { class: 'fxe-select' }, ...[...new Set([current, ...VX_FONTS])].map(f => h('option', { value: f, selected: f === current }, f.split(',')[0])));
        select.addEventListener('change', () => { text.setAttribute('font-family', select.value); vxCommit(); vxDraw(); });
        return select;
      })()),
    vxSec(sel.length > 1 ? 'Align (to the selection)' : 'Align (to the artboard)',
      h('div', { class: 'vx-row vx-icons' },
        vxIconBtn('alignLeft', 'Align left', () => vxAlign('left')),
        vxIconBtn('alignHCenter', 'Align horizontal centres', () => vxAlign('hcenter')),
        vxIconBtn('alignRight', 'Align right', () => vxAlign('right')),
        vxIconBtn('alignTop', 'Align top', () => vxAlign('top')),
        vxIconBtn('alignVCenter', 'Align vertical centres', () => vxAlign('vcenter')),
        vxIconBtn('alignBottom', 'Align bottom', () => vxAlign('bottom'))),
      sel.length > 2 && h('div', { class: 'vx-row vx-icons' },
        vxIconBtn('distH', 'Distribute horizontally', () => vxDistribute(true)),
        vxIconBtn('distV', 'Distribute vertically', () => vxDistribute(false)))),
    vxSec('Arrange',
      h('div', { class: 'vx-row vx-icons' },
        vxIconBtn('front', 'Bring to front (Ctrl+Shift+])', () => vxArrange('front')),
        vxIconBtn('forward', 'Bring forward (Ctrl+])', () => vxArrange('forward')),
        vxIconBtn('backward', 'Send backward (Ctrl+[)', () => vxArrange('backward')),
        vxIconBtn('back', 'Send to back (Ctrl+Shift+[)', () => vxArrange('back')))),
    vxSec('Quick actions',
      h('div', { class: 'vx-actions' },
        h('button', { type: 'button', class: 'btn small', onclick: vxGroup }, vxIcon('group', 15), 'Group'),
        h('button', { type: 'button', class: 'btn small', onclick: vxUngroup, disabled: !sel.some(el => el.tagName === 'g') }, vxIcon('ungroup', 15), 'Ungroup'),
        h('button', { type: 'button', class: 'btn small', onclick: vxDuplicate }, vxIcon('duplicate', 15), 'Duplicate'),
        h('button', { type: 'button', class: 'btn small', onclick: vxDelete }, vxIcon('trash', 15), 'Delete'))),
  ];
}

function vxKindName(el) {
  const names = { path: 'Path', rect: 'Rectangle', circle: 'Ellipse', ellipse: 'Ellipse', line: 'Line', polyline: 'Polyline', polygon: 'Polygon', text: 'Text', g: 'Group' };
  if (el.tagName === 'g') return `Group · ${el.querySelectorAll(VX_SHAPES).length} shapes`;
  return names[el.tagName] || el.tagName;
}

function vxLayerName(el) {
  if (el.dataset.name) return el.dataset.name;
  if (el.id) return el.id;
  if (el.tagName === 'text') return `“${el.textContent.slice(0, 24)}”`;
  return vxKindName(el);
}

function vxPanelLayers() {
  const items = [...vx.doc.children].reverse();
  if (!items.length) return [h('p', { class: 'vx-note vx-pad' }, 'The artboard is empty.')];
  const rows = items.map(el => {
    const hidden = el.getAttribute('display') === 'none';
    const locked = el.hasAttribute('data-locked');
    const paint = vxPaintOf(el);
    const name = h('span', { class: 'vx-layer-name', title: 'Double-click to rename' }, vxLayerName(el));
    name.addEventListener('dblclick', e => {
      e.stopPropagation();
      const input = h('input', { type: 'text', class: 'vx-text', value: vxLayerName(el) });
      const done = () => { const v = input.value.trim(); if (v) el.dataset.name = v.slice(0, 60); else el.removeAttribute('data-name'); vxCommit(); vxRenderSide(); };
      input.addEventListener('keydown', ev => { if (ev.key === 'Enter') input.blur(); if (ev.key === 'Escape') { input.value = vxLayerName(el); input.blur(); } });
      input.addEventListener('blur', done, { once: true });
      name.replaceWith(input);
      input.focus();
      input.select();
    });
    return h('div', {
      class: `vx-layer${vx.sel.includes(el) ? ' active' : ''}${hidden ? ' is-hidden' : ''}`,
      onclick: e => {
        if (locked || hidden) return;
        vxSelect(e.shiftKey ? (vx.sel.includes(el) ? vx.sel.filter(s => s !== el) : [...vx.sel, el]) : [el]);
      },
    },
    vxIconBtn(hidden ? 'eyeOff' : 'eye', hidden ? 'Show' : 'Hide', e => {
      e.stopPropagation();
      if (hidden) el.removeAttribute('display'); else { el.setAttribute('display', 'none'); vx.sel = vx.sel.filter(s => s !== el); }
      vxCommit(); vxDraw(); vxRenderSide();
    }),
    vxIconBtn(locked ? 'lock' : 'unlock', locked ? 'Unlock' : 'Lock', e => {
      e.stopPropagation();
      if (locked) el.removeAttribute('data-locked'); else { el.setAttribute('data-locked', ''); vx.sel = vx.sel.filter(s => s !== el); }
      vxCommit(); vxDraw(); vxRenderSide();
    }, locked ? 'on' : ''),
    h('span', { class: `vx-layer-sw${paint.fill === 'none' ? ' none' : ''}`, style: /^#/.test(paint.fill) ? `background:${paint.fill}` : null }),
    name);
  });
  return [
    h('p', { class: 'vx-note vx-pad' }, `${items.length} objects · top first · click selects, Shift+click adds`),
    h('div', { class: 'vx-layers' }, ...rows),
    vx.sel.length > 0 && h('div', { class: 'vx-row vx-icons vx-pad' },
      vxIconBtn('forward', 'Bring forward', () => vxArrange('forward')),
      vxIconBtn('backward', 'Send backward', () => vxArrange('backward')),
      vxIconBtn('group', 'Group (Ctrl+G)', vxGroup),
      vxIconBtn('trash', 'Delete', vxDelete)),
  ];
}

function vxPanelGenerate() {
  const g = vx.gen;
  const models = state.models || [];
  const model = models.find(m => m.id === g.model) || currentModel() || models[0];
  const coders = vx.coders || [];
  const coder = coders.find(c => c.id === g.coder) || vxDefaultCoder();
  const prompt = h('textarea', { class: 'vx-prompt', rows: 4, placeholder: 'Describe the drawing, e.g. “a fox head logo, geometric, two colours”', 'aria-label': 'What to draw' });
  prompt.value = g.prompt;
  prompt.addEventListener('input', () => { g.prompt = prompt.value; });
  prompt.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); vxGenerate(); } });

  const modeBtn = (id, label, sub) => h('button', { type: 'button', class: `seg-btn${g.mode === id ? ' selected' : ''}`, onclick: () => { g.mode = id; vxRenderSide(); } }, label, h('small', {}, sub));
  const price = model ? unitPrice(model, '1K') : null;

  const imageOptions = g.mode === 'image' && model && [
    h('label', { class: 'vx-lbl' }, 'Image model',
      (() => {
        const sel = h('select', { class: 'fxe-select' }, ...models.filter(m => m.availableNow !== false || m.id === model.id).map(m => {
          const p = unitPrice(m, '1K');
          return h('option', { value: m.id, selected: m.id === model.id }, `${m.label} – ${p != null ? `≈ ${fmtPrice(p)}` : m.free ? 'free tier' : ''}`);
        }));
        sel.addEventListener('change', () => { g.model = sel.value; vxRenderSide(); });
        return sel;
      })()),
    h('label', { class: 'vx-lbl' }, 'Shape',
      (() => {
        const ratios = VX_RATIOS.filter(r => !model.ratios || model.ratios.includes(r));
        const sel = h('select', { class: 'fxe-select' }, ...ratios.map(r => h('option', { value: r, selected: r === g.ratio }, r)));
        sel.addEventListener('change', () => { g.ratio = sel.value; });
        return sel;
      })()),
  ];
  const svgOptions = g.mode === 'svg' && [
    h('label', { class: 'vx-lbl' }, 'AI model',
      (() => {
        const sel = h('select', { class: 'fxe-select' }, ...(coders.length ? coders.filter(c => c.availableNow !== false || c.id === coder?.id) : [{ id: '', label: 'Loading…', note: '' }]).map(c => h('option', { value: c.id, selected: c.id === coder?.id }, `${c.label} – ${c.note}`)));
        sel.addEventListener('change', () => { g.coder = sel.value; });
        return sel;
      })()),
    h('label', { class: 'check' },
      (() => { const cb = h('input', { type: 'checkbox', checked: g.change && !vxIsEmpty(), disabled: vxIsEmpty() }); cb.addEventListener('change', () => { g.change = cb.checked; }); return cb; })(),
      h('span', {}, 'Change the current drawing instead of adding a new one')),
  ];

  const t = vx.trace;
  const slider = (label, key, min, max, step, fmt) => {
    const out = h('output', {}, fmt(t[key]));
    const input = h('input', { type: 'range', min, max, step, value: t[key] });
    input.addEventListener('input', () => { t[key] = +input.value; out.textContent = fmt(t[key]); });
    return h('label', { class: 'fxe-ctl' }, h('span', { class: 'fxe-ctl-head' }, h('span', {}, label), out), input);
  };
  const detail = v => (v <= 0.5 ? 'very fine' : v <= 1 ? 'fine' : v <= 2 ? 'balanced' : 'simple');

  return [
    vxSec('Generate a drawing',
      h('div', { class: 'seg' }, modeBtn('image', 'Image + Trace', 'same models as Create'), modeBtn('svg', 'AI draws SVG', 'clean editable shapes')),
      prompt,
      ...(imageOptions || svgOptions || []),
      h('button', { type: 'button', class: 'btn primary vx-gen-btn', disabled: g.busy, onclick: vxGenerate },
        vxIcon('sparkle', 16),
        h('span', {}, g.busy ? 'Working…' : 'Generate'),
        g.mode === 'image' && h('small', {}, price != null ? `≈ ${fmtPrice(price)}` : model?.free ? 'free tier' : '')),
      h('p', { class: 'vx-note' }, g.mode === 'image'
        ? 'The image model paints the picture (it also lands in your gallery), then Image Trace turns it into vector shapes – one layer per colour.'
        : 'The AI writes the SVG code itself: fewer, cleaner shapes with names, easy to edit. Ctrl+Enter generates.')),
    vxSec('Image Trace',
      slider('Colours', 'colors', 2, 16, 1, v => String(v)),
      slider('Detail', 'detail', 0.3, 3.5, 0.1, detail),
      slider('Smoothness', 'smooth', 0, 1, 0.05, v => `${Math.round(v * 100)} %`),
      slider('Ignore specks', 'speckle', 0, 200, 2, v => `${v} px`),
      h('label', { class: 'fxe-ctl fxe-toggle' }, h('span', {}, 'Remove the background'),
        (() => { const cb = h('input', { type: 'checkbox', class: 'switch', checked: t.removeBg }); cb.addEventListener('change', () => { t.removeBg = cb.checked; }); return cb; })()),
      h('div', { class: 'vx-actions' },
        h('button', { type: 'button', class: 'btn small', onclick: () => $('#vxFileInput').click() }, vxIcon('trace', 15), 'Trace an image…'),
        vx.lastTrace && h('button', { type: 'button', class: 'btn small', onclick: vxRetrace, disabled: g.busy }, vxIcon('trace', 15), 'Re-trace')),
      h('p', { class: 'vx-note' }, 'Any gallery image can be traced too – use the vector button on its tile. Fewer colours and less detail give cleaner, lighter files.')),
  ];
}

function vxDefaultCoder() {
  const coders = vx.coders || [];
  if (!state.config?.pollinations?.hasKey && !state.config?.cloudflare?.hasKey && state.config?.hasKey) return coders.find(c => c.provider === 'gemini') || coders[0];
  return coders[0];
}

// ── Generating, tracing ─────────────────────────────────────────────────────

function vxBusy(message, fraction) {
  const box = $('#vxBusy');
  box.hidden = !message;
  if (!message) return;
  $('#vxBusyText').textContent = message;
  const bar = $('#vxBusyBar');
  bar.parentElement.hidden = fraction == null;
  if (fraction != null) bar.style.width = `${Math.round(fraction * 100)}%`;
}

function vxLoadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Couldn’t load the image.'));
    img.src = url;
  });
}

async function vxGenerate() {
  const g = vx.gen;
  const prompt = g.prompt.trim();
  if (!prompt) { toast('Describe what to draw.'); $('.vx-prompt')?.focus(); return; }
  if (g.busy) return;
  g.busy = true;
  vxRenderSide();
  try {
    if (g.mode === 'image') await vxGenerateImage(prompt);
    else await vxGenerateSvg(prompt);
  } finally {
    g.busy = false;
    vxBusy(null);
    vxRenderSide();
  }
}

// after the last retry the message must not promise another one
function vxFail(err, prefix) {
  const info = err.info;
  if (info?.retryable) toastError({ info: { ...info, hint: `Tried ${MAX_RETRIES + 1} times – try again later, or pick another model.` } }, prefix);
  else toastError(err, prefix);
}

// Server hiccups and rate limits are retried with growing pauses, like jobs in Create.
async function vxRetry(request) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request();
    } catch (err) {
      const info = err.info || {};
      if (!info.retryable || attempt >= MAX_RETRIES) throw err;
      const wait = Math.min(info.retryAfterMs || 3000 * 2 ** attempt + Math.random() * 1000, 60000);
      for (let left = Math.ceil(wait / 1000); left > 0; left--) {
        vxBusy(`${info.message} Retrying in ${left} s (attempt ${attempt + 2} of ${MAX_RETRIES + 1})…`);
        await sleep(1000);
      }
    }
  }
}

async function vxGenerateImage(prompt) {
  const m = (state.models || []).find(x => x.id === vx.gen.model) || currentModel();
  if (!m || !ensureKey(m)) return;
  const ratio = !m.ratios || m.ratios.includes(vx.gen.ratio) ? vx.gen.ratio : '1:1';
  const createdAt = new Date().toISOString();
  try {
    const res = await vxRetry(() => vxBusy(`${m.label} is painting the picture…`) || api('/api/generate', {
      body: {
        model: m.id,
        prompt: `${prompt}\n\n${VX_VECTOR_STYLE}`,
        userPrompt: prompt,
        style: 'Vector',
        styleId: 'vector',
        aspectRatio: ratio,
        imageSize: m.sizes?.length ? (m.sizes.includes('1K') ? '1K' : m.sizes[0]) : null,
        thinkingLevel: m.thinking?.length ? (m.thinkingDefault || m.thinking[0]) : null,
        refs: [],
        batchId: `v${Date.now().toString(36)}${uid().slice(0, 4)}`,
        batchCreatedAt: createdAt,
        index: 0,
      },
    }));
    const item = res.items?.[0];
    if (!item) throw new Error('The model didn’t return an image.');
    state.items.unshift(...res.items);
    updateSpend();
    schedulePoll();
    const img = await vxLoadImage(mediaUrl(item));
    await vxTraceImage(img, prompt);
  } catch (err) {
    vxFail(err, 'Couldn’t generate the drawing');
  }
}

async function vxGenerateSvg(prompt) {
  const coder = (vx.coders || []).find(c => c.id === vx.gen.coder) || vxDefaultCoder();
  if (!coder) { toast('The AI models are still loading – try again in a moment.'); return; }
  if (coder.provider === 'pollinations' && !state.config?.pollinations?.hasKey && !state.config?.cloudflare?.hasKey) { openSettings('The free open-source AI models need a Pollinations key – add it below.'); return; }
  if (coder.provider === 'gemini' && !state.config?.hasKey) { openSettings('Add your Gemini API key first.'); return; }
  const change = vx.gen.change && !vxIsEmpty();
  try {
    const res = await vxRetry(() => vxBusy(change ? `${coder.label} is changing the drawing…` : `${coder.label} is drawing…`)
      || api('/api/vectors/ai', { body: { prompt, model: coder.id, source: change ? vxSerialize() : '' } }));
    if (vxImportSvg(res.svg, { label: prompt, replace: change })) {
      vx.label = prompt.slice(0, 80);
      toast(change ? 'Drawing changed.' : 'Drawing added – every part is its own object in Layers.', 'success');
    }
  } catch (err) {
    vxFail(err, 'The AI couldn’t draw it');
  }
}

function vxTraceOptions() {
  return { ...vx.trace };
}

async function vxTraceImage(img, label, { replace = null } = {}) {
  vxBusy('Tracing…', 0);
  let res;
  try {
    res = await vtTrace(img, vxTraceOptions(), (msg, f) => vxBusy(msg, f));
  } finally {
    vxBusy(null);
  }
  if (!res.layers.length) { toast('Nothing to trace – try more colours or turn off “Remove the background”.'); return; }
  const id = uid();
  const group = svgEl('g', { 'data-name': String(label || 'Traced image').slice(0, 48), 'data-vx-trace': id });
  let shapes = 0;
  for (const layer of res.layers) {
    const lg = svgEl('g', { 'data-name': `Colour ${layer.color}`, fill: layer.color });
    for (const d of layer.regions) { lg.append(svgEl('path', { d, 'fill-rule': 'evenodd' })); shapes++; }
    group.append(lg);
  }
  const old = replace?.isConnected ? replace : null;
  if (old) {
    old.replaceWith(group);
    vxSetM(group, vxM(old));
  } else if (vxIsEmpty()) {
    vxSetBoard(res.width, res.height);
    vx.doc.append(group);
    vxFit();
  } else {
    vx.doc.append(group);
    const s = Math.min((vx.w * 0.8) / res.width, (vx.h * 0.8) / res.height);
    vxSetM(group, new DOMMatrix().translate((vx.w - res.width * s) / 2, (vx.h - res.height * s) / 2).scale(s));
  }
  vx.lastTrace = { img, label, group };
  vx.label = String(label || 'Traced image').slice(0, 80);
  vxSelect([group]);
  vxCommit();
  const kb = Math.round(group.outerHTML.length / 1024);
  toast(`Traced: ${res.layers.length} colours, ${shapes} shapes (${kb} kB).${kb > 3000 ? ' That’s heavy – fewer colours or less detail make it lighter.' : ''}`, 'success');
}

async function vxRetrace() {
  const last = vx.lastTrace;
  if (!last || vx.gen.busy) return;
  vx.gen.busy = true;
  vxRenderSide();
  try {
    await vxTraceImage(last.img, last.label, { replace: last.group });
  } catch (err) {
    toastError(err, 'Couldn’t trace it');
  } finally {
    vx.gen.busy = false;
    vxRenderSide();
  }
}

// ── Import, export ──────────────────────────────────────────────────────────

const VX_ALLOWED = new Set(['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'title', 'desc', 'style', 'use', 'symbol']);
const VX_STYLE_PROPS = new Set(['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'fill-rule', 'clip-rule', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'text-anchor', 'display', 'visibility', 'stop-color', 'stop-opacity']);
const VX_EXTERNAL_URL = /url\(\s*['"]?\s*(?!#)/i;

// Only plain drawing survives: no scripts, events, external links or foreign content. Illustrator's CSS classes
// (.cls-1 { fill: … }) become attributes, so the colours stay when the <style> goes.
function vxSanitize(root) {
  for (const style of [...root.querySelectorAll('style')]) {
    const css = style.textContent.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selector, body] of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
      let els;
      try { els = root.querySelectorAll(selector.trim()); } catch { continue; }
      for (const decl of body.split(';')) {
        const [p, ...rest] = decl.split(':');
        const prop = p?.trim().toLowerCase(), val = rest.join(':').trim();
        if (!VX_STYLE_PROPS.has(prop) || !val || VX_EXTERNAL_URL.test(val)) continue;
        for (const el of els) el.setAttribute(prop, val);
      }
    }
    style.remove();
  }
  for (const el of [...root.querySelectorAll('*')]) {
    if (!VX_ALLOWED.has(el.localName.toLowerCase())) { el.remove(); continue; }
    for (const a of [...el.attributes]) {
      const name = a.name.toLowerCase(), v = a.value.trim();
      if (name.startsWith('on') || name === 'class' || /javascript:/i.test(v) || VX_EXTERNAL_URL.test(v)
        || ((name === 'href' || name === 'xlink:href') && !v.startsWith('#'))) el.removeAttribute(a.name);
    }
  }
}

function vxParseSvg(text) {
  // event attributes go before parsing – the browser reports them against the page's CSP as soon as it parses them
  const clean = String(text || '').replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  const doc = new DOMParser().parseFromString(clean, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.localName !== 'svg' || doc.querySelector('parsererror')) return null;
  vxSanitize(root);
  const num = a => { const v = root.getAttribute(a) || ''; return /%/.test(v) ? NaN : parseFloat(v); };
  const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const box = vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0 ? vb : [0, 0, num('width') > 0 ? num('width') : 1000, num('height') > 0 ? num('height') : 1000];
  const defs = [...root.querySelectorAll('defs')].flatMap(d => { const kids = [...d.children]; d.remove(); return kids; });
  return { root, x: box[0], y: box[1], w: box[2], h: box[3], defs };
}

function vxImportSvg(text, { label = 'Imported', replace = false } = {}) {
  const parsed = vxParseSvg(text);
  if (!parsed) { toast('That isn’t a valid SVG.', 'error'); return false; }
  const kids = [...parsed.root.childNodes].filter(n => n.nodeType === 1).map(n => document.importNode(n, true));
  if (!kids.length) { toast('The SVG is empty.', 'error'); return false; }
  const defs = parsed.defs.map(n => document.importNode(n, true));
  const offset = parsed.x || parsed.y ? new DOMMatrix().translate(-parsed.x, -parsed.y) : null;
  if (replace || vxIsEmpty()) {
    vx.doc.replaceChildren();
    vx.defs.replaceChildren(...defs);
    vxSetBoard(parsed.w, parsed.h);
    for (const k of kids) { if (offset && k instanceof SVGGraphicsElement) vxSetM(k, offset.multiply(vxM(k))); vx.doc.append(k); }
    vx.lastTrace = null;
    vxFit();
    vxSelect([]);
  } else {
    vx.defs.append(...defs);
    const g = svgEl('g', { 'data-name': String(label).slice(0, 48) });
    g.append(...kids);
    vx.doc.append(g);
    if (offset) vxSetM(g, offset);
    vxFitInto(g, 0.8);
    vxSelect([g]);
  }
  vxCommit();
  return true;
}

function vxSerialize() {
  const root = svgEl('svg', { viewBox: `0 0 ${vx.w} ${vx.h}`, width: vx.w, height: vx.h });
  if (vx.defs.children.length) {
    const defs = svgEl('defs');
    for (const c of vx.defs.children) defs.append(c.cloneNode(true));
    root.append(defs);
  }
  if (vx.bg) root.append(svgEl('rect', { width: vx.w, height: vx.h, fill: vx.bg }));
  for (const c of vx.doc.children) root.append(c.cloneNode(true));
  for (const el of root.querySelectorAll('[data-vx-trace], [data-locked]')) { el.removeAttribute('data-vx-trace'); el.removeAttribute('data-locked'); }
  return new XMLSerializer().serializeToString(root);
}

function vxFileName(ext) {
  const slug = norm(vx.label).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'vector';
  return `${slug}.${ext}`;
}

function vxDownloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function vxDownloadSvg() {
  if (vxIsEmpty()) { toast('The artboard is empty.'); return; }
  vxDownloadBlob(new Blob([vxSerialize()], { type: 'image/svg+xml' }), vxFileName('svg'));
}

async function vxDownloadPng() {
  if (vxIsEmpty()) { toast('The artboard is empty.'); return; }
  const url = URL.createObjectURL(new Blob([vxSerialize()], { type: 'image/svg+xml' }));
  try {
    const img = await vxLoadImage(url);
    const scale = Math.min(2, 4096 / Math.max(vx.w, vx.h));
    const canvas = h('canvas', { width: Math.round(vx.w * scale), height: Math.round(vx.h * scale) });
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    vxDownloadBlob(blob, vxFileName('png'));
  } catch (err) {
    toastError(err, 'Couldn’t make the PNG');
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function vxSaveToGallery() {
  if (vxIsEmpty()) { toast('The artboard is empty.'); return; }
  vxBusy('Saving to your gallery…');
  try {
    const res = await api('/api/vectors/export', {
      body: { svg: vxSerialize(), label: vx.label, width: vx.w, height: vx.h, description: `Vector drawing: ${vx.label}` },
    });
    state.items.unshift(...res.items);
    updateSpend();
    schedulePoll();
    toast('Saved to your gallery as SVG – it uploads to Google Drive.', 'success', { action: { label: 'Show', onClick: () => setView('create') } });
  } catch (err) {
    toastError(err, 'Couldn’t save the drawing');
  } finally {
    vxBusy(null);
  }
}

async function vxLoadFile(file) {
  if (!vx.ready) vxInit();
  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
  try {
    if (isSvg) {
      if (vxImportSvg(await file.text(), { label: file.name.replace(/\.svg$/i, '') })) {
        vx.label = file.name.replace(/\.svg$/i, '');
        toast('SVG opened.', 'success');
      }
    } else if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      try { await vxTraceImage(await vxLoadImage(url), file.name.replace(/\.[^.]+$/, '')); } finally { URL.revokeObjectURL(url); }
    } else toast('Open an SVG, or an image to trace.', 'error');
  } catch (err) {
    toastError(err, 'Couldn’t open the file');
  }
}

// From the gallery: an SVG opens for editing, an image is traced.
async function vxOpenItem(item) {
  if (state.ui.view !== 'vectors') setView('vectors');
  if (!vx.ready) vxInit();
  try {
    if (item.mimeType === 'image/svg+xml') {
      vxBusy('Opening…');
      const res = await fetch(mediaUrl(item));
      if (!res.ok) throw new Error('The drawing isn’t available.');
      if (vxImportSvg(await res.text(), { label: item.userPrompt || 'Vector' })) vx.label = item.userPrompt || 'Vector';
    } else {
      vxBusy('Loading the image…');
      await vxTraceImage(await vxLoadImage(mediaUrl(item)), item.userPrompt || 'Traced image');
    }
  } catch (err) {
    toastError(err, 'Couldn’t open it in Vectors');
  } finally {
    vxBusy(null);
  }
}

// ── Keyboard ────────────────────────────────────────────────────────────────

function vxKey(e) {
  if (state.ui.view !== 'vectors' || !vx.ready) return;
  if (!$('#settingsModal').hidden || state.lightbox) return;
  if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
  const key = e.key, mod = e.ctrlKey || e.metaKey;
  if (key === ' ') {
    e.preventDefault();
    if (!vx.spaceHand) { vx.spaceHand = true; vxCursor(); }
    return;
  }
  if (mod) {
    const k = key.toLowerCase();
    const actions = {
      z: () => (e.shiftKey ? vxRedo() : vxUndo()),
      y: vxRedo,
      a: () => vxSelect([...vx.doc.children].filter(vxUsable)),
      c: () => vxCopy(false),
      x: () => vxCopy(true),
      v: vxPaste,
      d: vxDuplicate,
      g: () => (e.shiftKey ? vxUngroup() : vxGroup()),
      0: vxFit,
      1: () => { const vp = $('#vxViewport'); vxZoomAt(1 / vx.pan.k, vp.clientWidth / 2, vp.clientHeight / 2); },
      '=': () => vxZoomCenter(1.25),
      '+': () => vxZoomCenter(1.25),
      '-': () => vxZoomCenter(1 / 1.25),
      ']': () => vxArrange(e.shiftKey ? 'front' : 'forward'),
      '}': () => vxArrange('front'),
      '[': () => vxArrange(e.shiftKey ? 'back' : 'backward'),
      '{': () => vxArrange('back'),
      s: vxDownloadSvg,
    };
    if (actions[k]) { e.preventDefault(); actions[k](); }
    return;
  }
  if (key === 'Escape') {
    if (vx.pen) vxPenFinish();
    else if (vx.node) { vx.node = null; vxDraw(); }
    else if (vx.sel.length) vxSelect([]);
    return;
  }
  if (key === 'Enter' && vx.pen) { vxPenFinish(); return; }
  if (key === 'Delete' || key === 'Backspace') {
    e.preventDefault();
    if (vx.node?.active != null) vxNodeDelete();
    else vxDelete();
    return;
  }
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (arrows[key]) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    const [dx, dy] = arrows[key];
    if (vx.node?.active != null) vxNodeNudge(dx * step, dy * step);
    else vxMoveBy(dx * step, dy * step);
    return;
  }
  if (e.altKey) return;
  if (key.toLowerCase() === 'x') {
    if (e.shiftKey) vxSwapColors();
    else { vx.active = vx.active === 'fill' ? 'stroke' : 'fill'; vxUpdateSwatches(); }
    return;
  }
  if (key.toLowerCase() === 'd' && !e.shiftKey) { vxDefaultColors(); return; }
  if (key === '/') { vxSetCurrent(vx.active, 'none', true); return; }
  const tool = VX_TOOLS.find(t => t.key === key.toLowerCase());
  if (tool) vxSetTool(tool.id);
}
