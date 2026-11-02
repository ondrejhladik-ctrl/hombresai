// Nodes – a node canvas for building shots: camera, lens, exposure, light… wired into Generate image / video nodes.
// The graph compiles (nodes-core.js) into prose plus XML, JSON and Markdown that are appended to the prompt.

const ND_CAT_COLORS = {
  input: '#8fb3ff', camera: '#7fd1c7', composition: '#b9a7ff', light: '#9ad08b', look: '#e7a6c9',
  subject: '#a0c4d8', motion: '#6fb6ff', audio: '#c0a6e8', output: '#e6e6e6', utility: '#9aa3ad',
};
const ND_TYPE_COLORS = { spec: '#8b9bb0', image: '#e6e6e6', video: '#6fb6ff' };
const ND_STORE_GRAPH = 'hombresai-nodes-current';

const nd = {
  ready: false,
  graphs: null,            // every saved graph
  graph: null,             // the graph on the canvas
  view: { x: 80, y: 80, k: 1 },
  sel: new Set(),
  selEdge: null,
  drag: null,
  spaceHand: false,
  results: new Map(),      // output node id → { status, items, error, done, total }
  undo: [],
  redo: [],
  saveTimer: null,
  previewTarget: null,
  tab: 'prompt',
  libQuery: '',
  loading: null,
};

// ── Graph list (also used by Create) ────────────────────────────────────────

function ndEnsureGraphs() {
  if (nd.graphs) return Promise.resolve(nd.graphs);
  if (!nd.loading) {
    nd.loading = Promise.all([api('/api/nodes'), api('/api/nodes/templates').catch(() => ({ templates: [] }))]).then(([res, own]) => {
      nd.graphs = (res.graphs || []).map(g => NodesCore.sanitizeGraph(g));
      nd.userTemplates = own.templates || [];
      return nd.graphs;
    }).catch(err => {
      nd.loading = null;
      throw err;
    });
  }
  return nd.loading;
}

const ndGraphById = id => (nd.graphs || []).find(g => g.id === id) || null;

// ── View, setup ─────────────────────────────────────────────────────────────

function ndOnView(active) {
  if (!active) return;
  if (!nd.ready) ndInit();
  else requestAnimationFrame(ndRenderWires);
}

async function ndInit() {
  nd.ready = true;
  ndBindEvents();
  try {
    await ndEnsureGraphs();
  } catch (err) {
    toastError(err, 'Couldn’t load the node graphs');
    nd.graphs = [];
  }
  let saved = null;
  try { saved = localStorage.getItem(ND_STORE_GRAPH); } catch { /* fine */ }
  const graph = ndGraphById(saved) || nd.graphs[0];
  if (graph) ndOpen(graph);
  else ndFromTemplate(NodesCore.TEMPLATES[0].id, { quiet: true });
  ndRenderLib();
}

function ndOpen(graph) {
  nd.graph = graph;
  nd.templateForm = false;
  nd.sel.clear();
  nd.selEdge = null;
  nd.undo = [];
  nd.redo = [];
  nd.previewTarget = null;
  try { localStorage.setItem(ND_STORE_GRAPH, graph.id); } catch { /* fine */ }
  ndRenderAll();
  requestAnimationFrame(ndFit);
}

function ndRenderAll() {
  ndRenderBar();
  ndRenderLib();
  ndRenderGraph();
  ndRenderSide();
}

// ── Saving, history ─────────────────────────────────────────────────────────

const ndSnapshot = () => JSON.stringify({ nodes: nd.graph.nodes, edges: nd.graph.edges, formats: nd.graph.formats, name: nd.graph.name });

// call before a change that should be undoable
function ndCheckpoint() {
  nd.undo.push(ndSnapshot());
  if (nd.undo.length > 80) nd.undo.shift();
  nd.redo = [];
}

function ndChanged({ structure = false } = {}) {
  nd.graph.updatedAt = new Date().toISOString();
  if (structure) ndRenderGraph();
  ndRenderSide();
  clearTimeout(nd.saveTimer);
  nd.saveTimer = setTimeout(ndSave, 600);
  ndSaveStatus('Saving…');
  if (typeof renderNodesField === 'function') renderNodesField();
}

function ndSaveStatus(text, cls = '') {
  const el = $('#ndSaveState');
  if (el) { el.textContent = text; el.className = `nd-save-state ${cls}`; }
}

// Graphs save themselves a moment after every change; Save (Ctrl+S) does it right away and says so.
async function ndSave({ announce = false } = {}) {
  clearTimeout(nd.saveTimer);
  if (!nd.graph) return;
  try {
    const res = await api('/api/nodes', { body: { graph: nd.graph } });
    const i = nd.graphs.findIndex(g => g.id === res.graph.id);
    if (i >= 0) nd.graphs[i] = nd.graph; else nd.graphs.unshift(nd.graph);
    ndSaveStatus(`Saved ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, 'ok');
    if (announce) toast(`“${nd.graph.name}” is saved – you’ll find it under Graphs on the left.`, 'success');
  } catch (err) {
    ndSaveStatus('Not saved', 'error');
    toastError(err, 'Couldn’t save the graph');
  }
}

// ── Files: a graph as a .json file to keep or share; its reference images travel inside it ──

const ND_FILE_TYPE = 'hombresai-node-graph';
const ndFileName = name => name.normalize('NFKD').replace(/\p{M}+/gu, '').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 60) || 'node-graph';
const dataUrlToBlob = url => {
  const [head, b64] = url.split(',');
  return new Blob([Uint8Array.from(atob(b64), ch => ch.charCodeAt(0))], { type: /^data:([^;,]+)/.exec(head)?.[1] || 'image/png' });
};
const blobToDataUrl = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

async function ndExportGraph() {
  const g = JSON.parse(JSON.stringify(nd.graph));
  for (const n of g.nodes) {
    for (const v of Object.values(n.values || {})) {
      if (!v || typeof v !== 'object' || !v.url) continue;
      try { v.data = await blobToDataUrl(await (await fetch(v.url)).blob()); } catch { /* the link stays */ }
    }
  }
  const file = { type: ND_FILE_TYPE, version: 1, exportedAt: new Date().toISOString(), graph: g };
  const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })), download: `${ndFileName(g.name)}.hombresai-nodes.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 20000);
  toast(`“${g.name}” exported as a file – your browser saved it (usually to Downloads).`, 'success');
}

async function ndImportFiles(files) {
  if (!nd.ready) { setView('nodes'); await sleep(50); }
  for (const file of files) {
    try {
      let data;
      try { data = JSON.parse(await file.text()); } catch { throw new Error('This file isn’t a hombresai node graph.'); }
      const raw = data?.type === ND_FILE_TYPE ? data.graph : data; // a plain graph (e.g. from Claude) works too
      if (!raw || !Array.isArray(raw.nodes) || !raw.nodes.length) throw new Error('This file isn’t a hombresai node graph.');
      // the images inside become references on this computer
      for (const n of raw.nodes) {
        for (const v of Object.values(n.values || {})) {
          if (!v || typeof v !== 'object' || !/^data:image\//.test(v.data || '')) continue;
          const res = await uploadImage(dataUrlToBlob(v.data), 'reference.png'); // the page's security policy blocks fetch() of data: URLs
          Object.assign(v, { path: res.path, url: res.url, itemId: undefined, data: undefined });
        }
      }
      let name = String(raw.name || file.name.replace(/(\.hombresai-nodes)?\.json$/i, '')).trim().slice(0, 74) || 'Imported graph';
      const taken = new Set(nd.graphs.map(g => g.name));
      if (taken.has(name)) {
        let k = 1;
        while (taken.has(`${name} (imported${k > 1 ? ` ${k}` : ''})`)) k++;
        name = `${name} (imported${k > 1 ? ` ${k}` : ''})`;
      }
      const g = NodesCore.sanitizeGraph({ ...raw, id: undefined, name });
      nd.graphs.unshift(g);
      ndOpen(g);
      await ndSave();
      toast(`Opened “${g.name}” – it’s saved under Graphs.`, 'success');
    } catch (err) {
      toastError(err, `Couldn’t open ${file.name}`);
    }
  }
}

function ndRestore(snap) {
  const s = JSON.parse(snap);
  Object.assign(nd.graph, s);
  nd.sel.clear();
  nd.selEdge = null;
  ndChanged({ structure: true });
}

function ndUndo() {
  if (!nd.undo.length) return;
  nd.redo.push(ndSnapshot());
  ndRestore(nd.undo.pop());
}

function ndRedo() {
  if (!nd.redo.length) return;
  nd.undo.push(ndSnapshot());
  ndRestore(nd.redo.pop());
}

// ── Library (left) ──────────────────────────────────────────────────────────

function ndRenderLib() {
  const box = $('#ndLib');
  if (!box) return;
  const graphs = (nd.graphs || []).slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const search = h('input', { type: 'search', class: 'vx-text nd-search', placeholder: 'Search nodes…', value: nd.libQuery, 'aria-label': 'Search nodes' });
  search.addEventListener('input', () => { nd.libQuery = search.value; ndRenderLibList(); });
  const fileInput = h('input', { type: 'file', accept: '.json,application/json', multiple: true, hidden: true, 'aria-label': 'Open a node graph file' });
  fileInput.addEventListener('change', () => { ndImportFiles([...fileInput.files]); fileInput.value = ''; });
  box.replaceChildren(
    h('div', { class: 'nd-lib-head' }, h('h2', {}, 'Nodes')),
    h('section', { class: 'nd-lib-sec' },
      h('h3', {}, 'Graphs'),
      h('div', { class: 'nd-graphs' }, ...graphs.map(g => h('button', {
        type: 'button', class: `nd-graph${g === nd.graph ? ' active' : ''}`, title: g.name, onclick: () => ndOpen(g),
      }, h('span', { class: 'nd-graph-kind' }, g.kind === 'video' ? 'Video' : 'Image'), h('span', { class: 'nd-graph-name' }, g.name)))),
      h('div', { class: 'nd-row' },
        h('button', { type: 'button', class: 'btn small', onclick: () => ndNewGraph('image') }, icon('plus', 14), 'Image graph'),
        h('button', { type: 'button', class: 'btn small', onclick: () => ndNewGraph('video') }, icon('plus', 14), 'Video graph'),
        h('button', { type: 'button', class: 'btn small', title: 'Open a graph saved with Export… (or drop the file on the canvas)', onclick: () => fileInput.click() }, icon('upload', 14), 'Open file…'),
        h('button', { type: 'button', class: 'btn small', title: 'Save the open graph as a file (with its reference images) to keep or share', onclick: ndExportGraph }, icon('download', 14), 'Export…'),
        fileInput)),
    h('section', { class: 'nd-lib-sec' },
      h('h3', {}, 'Templates'),
      (nd.userTemplates || []).length ? h('div', { class: 'nd-templates nd-own-templates' }, ...nd.userTemplates.map(ndOwnTemplateChip)) : null,
      h('div', { class: 'nd-templates' }, ...NodesCore.TEMPLATES.map(t => h('button', {
        type: 'button', class: 'chip-btn small', title: `Start a new graph from “${t.name}”`, onclick: () => ndFromTemplate(t.id),
      }, t.name))),
      ndTemplateForm()),
    h('section', { class: 'nd-lib-sec nd-lib-nodes' },
      h('h3', {}, 'Add a node'),
      search,
      h('div', { class: 'nd-lib-list', id: 'ndLibList' })),
  );
  ndRenderLibList();
}

// ── Your own templates ──────────────────────────────────────────────────────

// a chip with the template's first reference image, so templates with pictures are easy to tell apart
function ndOwnTemplateChip(t) {
  const img = t.graph.nodes.map(n => n.values?.image).find(v => v?.url);
  const del = h('button', { type: 'button', class: 'nd-tpl-del', title: `Delete the template “${t.name}”`, 'aria-label': `Delete the template ${t.name}` }, icon('x', 11));
  del.addEventListener('click', e => { e.stopPropagation(); ndDeleteTemplate(t, del); });
  return h('span', { class: 'nd-own-tpl' },
    h('button', { type: 'button', class: 'chip-btn small', title: `Start a new graph from your template “${t.name}”`, onclick: () => ndFromTemplate(t.id) },
      img ? h('img', { src: img.url, alt: '', class: 'nd-tpl-thumb' }) : null, t.name),
    del);
}

// “Save this graph as a template…” – opens a name field in place
function ndTemplateForm() {
  if (!nd.graph) return null;
  if (!nd.templateForm) {
    return h('button', { type: 'button', class: 'btn small', title: 'Keep this graph – nodes, settings and images – as a template', onclick: () => { nd.templateForm = true; ndRenderLib(); $('#ndTplName')?.select(); } },
      icon('save', 14), 'Save this graph as a template…');
  }
  const input = h('input', { type: 'text', class: 'vx-text', id: 'ndTplName', value: nd.graph.name, maxlength: '60', 'aria-label': 'Template name' });
  const save = () => ndSaveTemplate(input.value);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { nd.templateForm = false; ndRenderLib(); }
  });
  return h('div', { class: 'nd-tpl-form' }, input,
    h('button', { type: 'button', class: 'btn small primary', onclick: save }, 'Save'),
    h('button', { type: 'button', class: 'link-btn', onclick: () => { nd.templateForm = false; ndRenderLib(); } }, 'Cancel'));
}

async function ndSaveTemplate(name) {
  name = String(name || '').trim();
  if (!name) { toast('Give the template a name.'); return; }
  try {
    await ndSave();
    const res = await api('/api/nodes/templates', { body: { graph: nd.graph, name } });
    nd.userTemplates = [...(nd.userTemplates || []).filter(t => t.id !== res.template.id), res.template].sort((a, b) => a.name.localeCompare(b.name));
    nd.templateForm = false;
    ndRenderLib();
    toast(res.replaced ? `The template “${res.template.name}” was updated.` : `Saved as the template “${res.template.name}” – it’s under Templates.`, 'success');
  } catch (err) {
    toastError(err, 'Couldn’t save the template');
  }
}

async function ndDeleteTemplate(t, btn) {
  if (!btn.classList.contains('confirming')) {
    btn.classList.add('confirming');
    toast(`Click × again to delete the template “${t.name}”.`);
    setTimeout(() => btn.classList.remove('confirming'), 3500);
    return;
  }
  try {
    await api('/api/nodes/templates/delete', { body: { id: t.id } });
    nd.userTemplates = (nd.userTemplates || []).filter(x => x.id !== t.id);
    ndRenderLib();
    toast(`The template “${t.name}” was deleted.`);
  } catch (err) {
    toastError(err, 'Couldn’t delete the template');
  }
}

function ndRenderLibList() {
  const list = $('#ndLibList');
  if (!list) return;
  const q = norm(nd.libQuery);
  const kind = nd.graph?.kind || 'image';
  const groups = NodesCore.CATEGORIES.map(cat => {
    const types = Object.entries(NodesCore.NODE_TYPES).filter(([, t]) => t.category === cat.id)
      .filter(([id, t]) => !q || norm(`${t.title} ${t.help} ${id}`).includes(q));
    if (!types.length) return null;
    return h('div', { class: 'nd-lib-group' },
      h('div', { class: 'nd-lib-cat' }, h('span', { class: 'nd-dot', style: `background:${ND_CAT_COLORS[cat.id]}` }), cat.label),
      ...types.map(([id, t]) => {
        const btn = h('button', {
          type: 'button', class: 'nd-lib-item', draggable: 'true', title: t.help, 'data-type': id,
          onclick: () => ndAddNode(id),
        }, h('span', {}, t.title), !t.kinds.includes(kind) && h('em', {}, t.kinds[0]));
        btn.addEventListener('dragstart', e => { e.dataTransfer.setData('application/x-hombresai-node', id); e.dataTransfer.effectAllowed = 'copy'; });
        return btn;
      }));
  }).filter(Boolean);
  list.replaceChildren(...(groups.length ? groups : [h('p', { class: 'vx-note' }, 'No node matches.')]));
}

// ── Toolbar ─────────────────────────────────────────────────────────────────

function ndRenderBar() {
  const g = nd.graph;
  if (!g) return;
  const name = h('input', { type: 'text', class: 'vx-text nd-name', value: g.name, 'aria-label': 'Graph name', maxlength: '80' });
  name.addEventListener('change', () => { ndCheckpoint(); g.name = name.value.trim() || 'Untitled'; ndChanged(); ndRenderLib(); });
  $('#ndBar').replaceChildren(
    name,
    h('span', { class: 'nd-kind-tag', title: g.kind === 'video' ? 'Video graph' : 'Image graph' }, g.kind === 'video' ? 'Video' : 'Image'),
    h('span', { class: 'nd-save-state ok', id: 'ndSaveState', title: 'Graphs save themselves on this computer as you work' }, 'Saved'),
    h('span', { class: 'vx-bar-fill' }),
    vxIconBtn('undo', 'Undo (Ctrl+Z)', ndUndo),
    vxIconBtn('redo', 'Redo (Ctrl+Shift+Z)', ndRedo),
    vxIconBtn('fit', 'Fit to view (F)', ndFit),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Save now (Ctrl+S) – graphs also save themselves as you work', onclick: () => ndSave({ announce: true }) }, icon('save', 15), h('span', {}, 'Save')),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Save a copy under a new name (to keep it as a file, use Export… on the left)', onclick: ndSaveAs }, vxIcon('duplicate', 15), h('span', {}, 'Save as…')),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Delete this graph', 'aria-label': 'Delete this graph', onclick: ndDeleteGraph }, vxIcon('trash', 15)),
    h('button', { type: 'button', class: 'btn small primary', title: 'Run every Generate node, in order', onclick: ndRunAll }, icon('sparkle', 15), h('span', {}, 'Run all')),
  );
}

// ── Canvas ──────────────────────────────────────────────────────────────────

function ndApplyView() {
  $('#ndWorld').style.transform = `translate(${nd.view.x}px, ${nd.view.y}px) scale(${nd.view.k})`;
  const canvas = $('#ndCanvas');
  const grid = 24 * nd.view.k;
  canvas.style.backgroundSize = `${grid}px ${grid}px`;
  canvas.style.backgroundPosition = `${nd.view.x}px ${nd.view.y}px`;
}

function ndToWorld(clientX, clientY) {
  const r = $('#ndCanvas').getBoundingClientRect();
  return { x: (clientX - r.left - nd.view.x) / nd.view.k, y: (clientY - r.top - nd.view.y) / nd.view.k };
}

function ndFit() {
  const canvas = $('#ndCanvas');
  if (!canvas || !nd.graph?.nodes.length) { nd.view = { x: 80, y: 80, k: 1 }; ndApplyView(); return; }
  const els = [...document.querySelectorAll('.nd-node')];
  const xs = nd.graph.nodes.map(n => n.x), ys = nd.graph.nodes.map(n => n.y);
  const ws = els.map(e => e.offsetWidth), hs = els.map(e => e.offsetHeight);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const maxX = Math.max(...nd.graph.nodes.map((n, i) => n.x + (ws[i] || 260)));
  const maxY = Math.max(...nd.graph.nodes.map((n, i) => n.y + (hs[i] || 200)));
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  const k = Math.max(0.3, Math.min(1.1, Math.min((cw - 80) / (maxX - minX), (ch - 80) / (maxY - minY))));
  nd.view = { k, x: (cw - (maxX - minX) * k) / 2 - minX * k, y: (ch - (maxY - minY) * k) / 2 - minY * k };
  ndApplyView();
  ndRenderWires();
}

function ndZoomAt(factor, clientX, clientY) {
  const r = $('#ndCanvas').getBoundingClientRect();
  const sx = clientX - r.left, sy = clientY - r.top;
  const k = Math.max(0.25, Math.min(2.5, nd.view.k * factor));
  const f = k / nd.view.k;
  nd.view = { k, x: sx - (sx - nd.view.x) * f, y: sy - (sy - nd.view.y) * f };
  ndApplyView();
}

function ndRenderGraph() {
  const world = $('#ndWorld');
  if (!world || !nd.graph) return;
  const wires = $('#ndWires');
  world.replaceChildren(wires, ...nd.graph.nodes.map(ndRenderNode));
  ndApplyView();
  requestAnimationFrame(ndRenderWires);
}

function ndRenderNode(node) {
  const t = NodesCore.NODE_TYPES[node.type];
  const color = ND_CAT_COLORS[t.category] || '#999';
  const rows = Math.max(t.inputs.length, t.outputs.length);
  const io = Array.from({ length: rows }, (_, i) => {
    const pin = t.inputs[i], pout = t.outputs[i];
    return h('div', { class: 'nd-io' },
      pin ? h('span', { class: 'nd-port in', 'data-node': node.id, 'data-port': pin.id, 'data-type': pin.type, title: `${pin.label} (${pin.type})` },
        h('span', { class: 'nd-pin', style: `--c:${ND_TYPE_COLORS[pin.type]}` }), h('span', { class: 'nd-port-label' }, pin.label)) : h('span'),
      pout ? h('span', { class: 'nd-port out', 'data-node': node.id, 'data-port': pout.id, 'data-type': pout.type, title: `${pout.label} (${pout.type})` },
        h('span', { class: 'nd-port-label' }, pout.label), h('span', { class: 'nd-pin', style: `--c:${ND_TYPE_COLORS[pout.type]}` })) : h('span'));
  });
  const el = h('div', {
    class: `nd-node${nd.sel.has(node.id) ? ' selected' : ''}${t.output ? ' is-output' : ''}${node.type === 'note' ? ' is-note' : ''}`,
    'data-id': node.id,
    style: `left:${node.x}px;top:${node.y}px;--cat:${color}`,
  },
  h('div', { class: 'nd-head', 'data-drag': node.id },
    h('span', { class: 'nd-cat-dot' }),
    h('span', { class: 'nd-title' }, t.title),
    h('span', { class: 'nd-chips', 'data-chips': node.id }, ndChipText(node)),
    h('button', { type: 'button', class: 'nd-x', title: 'Delete node', 'aria-label': 'Delete node', onclick: e => { e.stopPropagation(); ndCheckpoint(); ndDeleteNodes([node.id]); } }, icon('x', 12))),
  rows ? h('div', { class: 'nd-ios' }, ...io) : null,
  h('div', { class: 'nd-body' }, ...t.fields.map(f => ndField(node, f))),
  t.output ? h('div', { class: 'nd-run', 'data-run': node.id }, ...ndRunControls(node)) : null);
  return el;
}

const ndChipText = node => (NodesCore.NODE_TYPES[node.type].chips?.(node.values) || []).filter(Boolean).slice(0, 4).join(' · ');

function ndRefreshChips(node) {
  const el = document.querySelector(`[data-chips="${node.id}"]`);
  if (el) el.textContent = ndChipText(node);
}

function ndSetValue(node, field, value, { live = false } = {}) {
  if (!live) ndCheckpoint();
  node.values[field.id] = value;
  ndRefreshChips(node);
  if (field.type === 'model' || ['ratio', 'size', 'count', 'duration', 'resolution'].includes(field.id)) ndRefreshRun(node);
  ndChanged();
}

function ndField(node, f) {
  const v = node.values[f.id];
  const wrap = (control, extra) => h('label', { class: `nd-field nd-f-${f.type}` }, h('span', { class: 'nd-flabel' }, f.label), control, extra);
  if (f.type === 'select' || f.type === 'model') {
    let options = f.options || [];
    if (f.type === 'model') {
      const models = (state.models || []).filter(m => m.provider !== undefined);
      options = models.length ? models.map(m => {
        const p = unitPrice(m, '1K');
        return { value: m.id, label: `${m.label}${p != null ? ` – ≈ ${fmtPrice(p)}` : m.free ? ' – free' : ''}` };
      }) : options;
      // never show another model than the one the node will use (e.g. before the model list has loaded)
      if (v && !options.some(op => String(op.value) === String(v))) options = [...options, { value: v, label: modelLabel(v) }];
    }
    const sel = h('select', { class: 'fxe-select nd-input' }, ...options.map(op => h('option', { value: op.value, selected: String(op.value) === String(v) }, op.label)));
    sel.addEventListener('change', () => ndSetValue(node, f, sel.value));
    return wrap(sel);
  }
  if (f.type === 'toggle') {
    const cb = h('input', { type: 'checkbox', class: 'switch', checked: Boolean(v) });
    cb.addEventListener('change', () => ndSetValue(node, f, cb.checked));
    return h('label', { class: 'nd-field nd-f-toggle' }, h('span', { class: 'nd-flabel' }, f.label), cb);
  }
  if (f.type === 'textarea') {
    const ta = h('textarea', { class: 'vx-prompt nd-input', rows: f.rows || 3, placeholder: f.placeholder || '' });
    ta.value = v || '';
    let first = true;
    ta.addEventListener('input', () => { if (first) { ndCheckpoint(); first = false; } ndSetValue(node, f, ta.value, { live: true }); });
    ta.addEventListener('change', () => { first = true; });
    return wrap(ta);
  }
  if (f.type === 'image') return wrap(ndImageField(node, f));
  const input = h('input', { type: 'text', class: 'vx-text nd-input', value: v || '', placeholder: f.placeholder || '' });
  let first = true;
  input.addEventListener('input', () => { if (first) { ndCheckpoint(); first = false; } ndSetValue(node, f, input.value, { live: true }); });
  input.addEventListener('change', () => { first = true; });
  return wrap(input);
}

// Reference image: pick one from the gallery or upload one; it's stored as a reference like in Create.
function ndImageField(node, f) {
  const v = node.values[f.id];
  const box = h('div', { class: 'nd-image' });
  if (v?.url) box.append(h('img', { src: v.url, alt: '', class: 'nd-image-thumb' }));
  box.append(
    h('button', { type: 'button', class: 'btn small', onclick: e => { e.preventDefault(); ndOpenPicker(node, f, e.currentTarget); } }, v ? 'Change…' : 'Choose image…'),
    v ? h('button', { type: 'button', class: 'link-btn', onclick: e => { e.preventDefault(); ndSetValue(node, f, null); ndRenderGraph(); } }, 'Remove') : null);
  return box;
}

function ndOpenPicker(node, f, anchor) {
  openImagePicker(anchor, value => { ndSetValue(node, f, value); ndRenderGraph(); });
}

// A small popup to choose a gallery image or upload one; the choice is stored as a reference (refs/…).
// `extra`: more buttons on top (e.g. “Use the current frame” in Video).
function openImagePicker(anchor, onPick, { title = 'Choose an image', extra = [] } = {}) {
  document.querySelector('.nd-picker')?.remove();
  const images = state.items.filter(i => !i.mimeType || /^image\/(?!svg)/.test(i.mimeType)).slice(0, 48);
  const pick = async (blobPromise, name, item) => {
    picker.remove();
    try {
      const blob = await blobPromise;
      const res = await uploadImage(blob, name);
      onPick({ path: res.path, itemId: item?.id, url: item ? thumbUrl(item) : res.url });
    } catch (err) {
      toastError(err, 'Couldn’t use the image');
    }
  };
  const file = h('input', { type: 'file', accept: 'image/*', hidden: true });
  file.addEventListener('change', () => { const fl = file.files[0]; if (fl) pick(Promise.resolve(fl), fl.name, null); });
  const picker = h('div', { class: 'nd-picker', role: 'dialog', 'aria-label': title },
    h('div', { class: 'nd-picker-head' }, h('b', {}, title), h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close', onclick: () => picker.remove() }, icon('x', 14))),
    ...extra.map(x => h('button', { type: 'button', class: 'btn small', onclick: () => { picker.remove(); x.onClick(); } }, x.icon ? icon(x.icon, 15) : null, x.label)),
    h('button', { type: 'button', class: 'btn small', onclick: () => file.click() }, icon('imagePlus', 15), 'Upload from this computer…'),
    file,
    images.length
      ? h('div', { class: 'nd-picker-grid' }, ...images.map(item => h('button', {
        type: 'button', class: 'nd-picker-item', title: item.userPrompt || '',
        onclick: () => pick(fetch(mediaUrl(item)).then(r => { if (!r.ok) throw new Error('The image isn’t available.'); return r.blob(); }), fileName(item), item),
      }, h('img', { src: thumbUrl(item), alt: '', loading: 'lazy' }))))
      : h('p', { class: 'vx-note' }, 'Your gallery has no images yet.'));
  document.body.append(picker);
  const r = anchor.getBoundingClientRect();
  picker.style.left = `${Math.min(window.innerWidth - 340, r.left)}px`;
  picker.style.top = `${Math.min(window.innerHeight - 420, r.bottom + 6)}px`;
}

// ── Wires ───────────────────────────────────────────────────────────────────

function ndPortCenter(nodeId, portId, dir) {
  const el = document.querySelector(`.nd-port.${dir}[data-node="${nodeId}"][data-port="${portId}"] .nd-pin`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return ndToWorld(r.left + r.width / 2, r.top + r.height / 2);
}

const ndWirePath = (a, b) => {
  const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
  return `M${a.x} ${a.y}C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
};

function ndRenderWires() {
  const svg = $('#ndWires');
  if (!svg || !nd.graph) return;
  const paths = [];
  for (const e of nd.graph.edges) {
    const a = ndPortCenter(e.from.node, e.from.port, 'out'), b = ndPortCenter(e.to.node, e.to.port, 'in');
    if (!a || !b) continue;
    const from = nd.graph.nodes.find(n => n.id === e.from.node);
    const type = NodesCore.portOf(from?.type, 'out', e.from.port)?.type || 'spec';
    const d = ndWirePath(a, b);
    paths.push(svgEl('path', { d, class: `nd-wire${nd.selEdge === e.id ? ' selected' : ''}`, style: `--c:${ND_TYPE_COLORS[type]}` }));
    paths.push(svgEl('path', { d, class: 'nd-wire-hit', 'data-edge': e.id }));
  }
  const drag = nd.drag;
  if (drag?.type === 'wire' && drag.cur) paths.push(svgEl('path', { d: drag.dir === 'out' ? ndWirePath(drag.anchor, drag.cur) : ndWirePath(drag.cur, drag.anchor), class: 'nd-wire temp' }));
  svg.replaceChildren(...paths);
}

// ── Pointer ─────────────────────────────────────────────────────────────────

function ndBindEvents() {
  const canvas = $('#ndCanvas');
  canvas.addEventListener('pointerdown', ndDown);
  canvas.addEventListener('pointermove', ndMove);
  canvas.addEventListener('pointerup', ndUp);
  canvas.addEventListener('pointercancel', ndUp);
  canvas.addEventListener('wheel', e => {
    if (e.target.closest('.nd-body textarea, .nd-body select')) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) ndZoomAt(Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY);
    else {
      nd.view.x -= e.shiftKey ? e.deltaY : e.deltaX;
      nd.view.y -= e.shiftKey ? 0 : e.deltaY;
      ndApplyView();
    }
  }, { passive: false });
  canvas.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('application/x-hombresai-node')) e.preventDefault(); });
  canvas.addEventListener('drop', e => {
    const type = e.dataTransfer.getData('application/x-hombresai-node');
    if (!type) return;
    e.preventDefault();
    e.stopPropagation();
    const p = ndToWorld(e.clientX, e.clientY);
    ndAddNode(type, { x: p.x - 120, y: p.y - 20 });
  });
  document.addEventListener('keydown', ndKey);
  document.addEventListener('keyup', e => { if (e.key === ' ') nd.spaceHand = false; });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.nd-picker, .nd-image, [data-picker]')) document.querySelector('.nd-picker')?.remove(); });
  new ResizeObserver(() => { if (state.ui.view === 'nodes') ndRenderWires(); }).observe(canvas);
}

function ndDown(e) {
  if (e.button === 2) return;
  const t = e.target;
  const port = t.closest('.nd-port');
  if (port) {
    e.preventDefault();
    const dir = port.classList.contains('out') ? 'out' : 'in';
    const ref = { node: port.dataset.node, port: port.dataset.port };
    // dragging from a connected input picks that wire up again
    if (dir === 'in') {
      const existing = nd.graph.edges.filter(x => x.to.node === ref.node && x.to.port === ref.port).at(-1);
      if (existing) {
        ndCheckpoint();
        nd.graph.edges = nd.graph.edges.filter(x => x !== existing);
        nd.drag = { type: 'wire', dir: 'out', from: existing.from, anchor: ndPortCenter(existing.from.node, existing.from.port, 'out'), cur: ndToWorld(e.clientX, e.clientY), moved: true, picked: true };
        $('#ndCanvas').setPointerCapture(e.pointerId);
        ndRenderWires();
        return;
      }
    }
    nd.drag = { type: 'wire', dir, [dir === 'out' ? 'from' : 'to']: ref, anchor: ndPortCenter(ref.node, ref.port, dir), cur: ndToWorld(e.clientX, e.clientY) };
    $('#ndCanvas').setPointerCapture(e.pointerId);
    return;
  }
  const hit = t.closest('.nd-wire-hit');
  if (hit) {
    nd.selEdge = hit.dataset.edge;
    nd.sel.clear();
    document.querySelectorAll('.nd-node.selected').forEach(n => n.classList.remove('selected'));
    ndRenderWires();
    return;
  }
  const head = t.closest('[data-drag]');
  if (head && !t.closest('button')) {
    const id = head.dataset.drag;
    if (e.shiftKey) { if (nd.sel.has(id)) nd.sel.delete(id); else nd.sel.add(id); } else if (!nd.sel.has(id)) { nd.sel.clear(); nd.sel.add(id); }
    nd.selEdge = null;
    ndMarkSelection();
    const start = ndToWorld(e.clientX, e.clientY);
    nd.drag = { type: 'move', start, origin: [...nd.sel].map(nid => { const n = nd.graph.nodes.find(x => x.id === nid); return { n, x: n.x, y: n.y }; }), moved: false };
    $('#ndCanvas').setPointerCapture(e.pointerId);
    return;
  }
  if (t.closest('.nd-node')) {
    // inside a node body: select it, leave the form controls alone
    const id = t.closest('.nd-node').dataset.id;
    if (!nd.sel.has(id)) { nd.sel.clear(); nd.sel.add(id); nd.selEdge = null; ndMarkSelection(); }
    return;
  }
  // empty canvas: pan
  nd.sel.clear();
  nd.selEdge = null;
  ndMarkSelection();
  ndRenderWires();
  nd.drag = { type: 'pan', x: e.clientX, y: e.clientY, view: { ...nd.view } };
  $('#ndCanvas').classList.add('panning');
  $('#ndCanvas').setPointerCapture(e.pointerId);
}

function ndMove(e) {
  const d = nd.drag;
  if (!d) return;
  if (d.type === 'pan') {
    nd.view.x = d.view.x + e.clientX - d.x;
    nd.view.y = d.view.y + e.clientY - d.y;
    ndApplyView();
  } else if (d.type === 'move') {
    const p = ndToWorld(e.clientX, e.clientY);
    const dx = p.x - d.start.x, dy = p.y - d.start.y;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    if (!d.moved) { ndCheckpoint(); d.moved = true; }
    for (const o of d.origin) {
      o.n.x = Math.round((o.x + dx) / 4) * 4;
      o.n.y = Math.round((o.y + dy) / 4) * 4;
      const el = document.querySelector(`.nd-node[data-id="${o.n.id}"]`);
      if (el) { el.style.left = `${o.n.x}px`; el.style.top = `${o.n.y}px`; }
    }
    ndRenderWires();
  } else if (d.type === 'wire') {
    d.cur = ndToWorld(e.clientX, e.clientY);
    d.moved = true;
    ndRenderWires();
  }
}

function ndUp(e) {
  const d = nd.drag;
  nd.drag = null;
  $('#ndCanvas').classList.remove('panning');
  if (!d) return;
  if (d.type === 'move' && d.moved) ndChanged();
  if (d.type === 'wire') {
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.nd-port');
    let connected = false;
    if (target) {
      const dir = target.classList.contains('out') ? 'out' : 'in';
      const ref = { node: target.dataset.node, port: target.dataset.port };
      const from = d.dir === 'out' ? d.from : dir === 'out' ? ref : null;
      const to = d.dir === 'in' ? d.to : dir === 'in' ? ref : null;
      if (from && to && NodesCore.canConnect(nd.graph, from, to)) {
        if (!d.picked) ndCheckpoint();
        connected = Boolean(NodesCore.connect(nd.graph, from, to));
      } else if (from && to) toast('Those two ports don’t fit together – match the colors: shot → shot, image → image.');
    }
    if (connected || d.picked) ndChanged({ structure: true });
    else ndRenderWires();
  }
}

function ndMarkSelection() {
  document.querySelectorAll('.nd-node').forEach(el => el.classList.toggle('selected', nd.sel.has(el.dataset.id)));
  ndRenderSide();
}

// ── Graph operations ────────────────────────────────────────────────────────

function ndAddNode(type, at) {
  if (!nd.graph) return;
  ndCheckpoint();
  const canvas = $('#ndCanvas');
  const selected = nd.graph.nodes.find(n => nd.sel.has(n.id));
  let pos = at;
  if (!pos && selected) pos = { x: selected.x + 290, y: selected.y };
  if (!pos) { const c = ndToWorld(canvas.getBoundingClientRect().left + canvas.clientWidth / 2, canvas.getBoundingClientRect().top + canvas.clientHeight / 3); pos = { x: c.x - 120, y: c.y }; }
  const node = NodesCore.newNode(type, pos.x, pos.y);
  nd.graph.nodes.push(node);
  // a new shot node right after a selected one continues the chain
  const t = NodesCore.NODE_TYPES[type];
  if (selected && !at) {
    const out = NodesCore.NODE_TYPES[selected.type].outputs[0];
    const input = t.inputs.find(p => p.type === out?.type);
    if (out && input) {
      const forward = nd.graph.edges.filter(e => e.from.node === selected.id && e.from.port === out.id);
      NodesCore.connect(nd.graph, { node: selected.id, port: out.id }, { node: node.id, port: input.id });
      const myOut = t.outputs.find(p => p.type === out.type);
      if (myOut) for (const e of forward) { nd.graph.edges = nd.graph.edges.filter(x => x !== e); NodesCore.connect(nd.graph, { node: node.id, port: myOut.id }, e.to); }
    }
  }
  nd.sel.clear();
  nd.sel.add(node.id);
  ndChanged({ structure: true });
}

function ndDeleteNodes(ids) {
  const set = new Set(ids);
  nd.graph.nodes = nd.graph.nodes.filter(n => !set.has(n.id));
  nd.graph.edges = nd.graph.edges.filter(e => !set.has(e.from.node) && !set.has(e.to.node));
  for (const id of set) nd.results.delete(id);
  nd.sel.clear();
  ndChanged({ structure: true });
}

function ndDuplicateNodes() {
  const picked = nd.graph.nodes.filter(n => nd.sel.has(n.id));
  if (!picked.length) return;
  ndCheckpoint();
  const map = new Map();
  for (const n of picked) {
    const c = NodesCore.newNode(n.type, n.x + 40, n.y + 40, JSON.parse(JSON.stringify(n.values)));
    map.set(n.id, c.id);
    nd.graph.nodes.push(c);
  }
  for (const e of nd.graph.edges.slice()) if (map.has(e.from.node) && map.has(e.to.node)) NodesCore.connect(nd.graph, { node: map.get(e.from.node), port: e.from.port }, { node: map.get(e.to.node), port: e.to.port });
  nd.sel = new Set(map.values());
  ndChanged({ structure: true });
}

async function ndNewGraph(kind) {
  const g = NodesCore.newGraph(kind, kind === 'video' ? 'New video graph' : 'New image graph');
  g.nodes.push(NodesCore.newNode('prompt', 0, 0), NodesCore.newNode(kind === 'video' ? 'generate_video' : 'generate_image', 320, 0));
  NodesCore.connect(g, { node: g.nodes[0].id, port: 'out' }, { node: g.nodes[1].id, port: 'spec' });
  nd.graphs.unshift(g);
  ndOpen(g);
  await ndSave();
}

async function ndFromTemplate(id, { quiet = false } = {}) {
  const own = (nd.userTemplates || []).find(x => x.id === id);
  const t = own || NodesCore.TEMPLATES.find(x => x.id === id);
  if (!t) return;
  const g = own ? NodesCore.sanitizeGraph({ ...JSON.parse(JSON.stringify(own.graph)), id: undefined, name: own.name }) : t.build();
  nd.graphs = nd.graphs || [];
  nd.graphs.unshift(g);
  ndOpen(g);
  await ndSave();
  if (!quiet) toast(`New graph from “${t.name}”. Change any node and watch the prompt on the right.`);
}

async function ndDuplicateGraph() {
  const copy = NodesCore.sanitizeGraph({ ...JSON.parse(JSON.stringify(nd.graph)), id: undefined, name: `${nd.graph.name} (copy)` });
  nd.graphs.unshift(copy);
  ndOpen(copy);
  await ndSave();
}

// Save as…: the copy opens with its name selected, ready to be typed over.
async function ndSaveAs() {
  await ndDuplicateGraph();
  const input = $('#ndBar .nd-name');
  input?.focus();
  input?.select();
  toast('Saved as a copy – type a name for it and press Enter.', 'success');
}

async function ndDeleteGraph() {
  const g = nd.graph;
  const btn = document.activeElement;
  if (!btn?.classList.contains('confirming')) {
    btn?.classList.add('confirming');
    toast(`Click Delete again to delete “${g.name}”.`);
    setTimeout(() => btn?.classList.remove('confirming'), 3500);
    return;
  }
  try {
    await api('/api/nodes/delete', { body: { id: g.id } });
    nd.graphs = nd.graphs.filter(x => x !== g);
    if (state.ui.nodeGraph === g.id) { state.ui.nodeGraph = null; saveUi(); }
    if (nd.graphs.length) ndOpen(nd.graphs[0]);
    else await ndFromTemplate(NodesCore.TEMPLATES[0].id, { quiet: true });
    if (typeof renderNodesField === 'function') renderNodesField();
  } catch (err) {
    toastError(err, 'Couldn’t delete the graph');
  }
}

// ── Running Generate nodes ──────────────────────────────────────────────────

function ndResult(id) {
  if (!nd.results.has(id)) nd.results.set(id, { status: 'idle', items: [], error: null, done: 0, total: 0 });
  return nd.results.get(id);
}

function ndRunControls(node) {
  const t = NodesCore.NODE_TYPES[node.type];
  const r = ndResult(node.id);
  const v = node.values;
  let price = '';
  if (t.output === 'image') {
    const m = (state.models || []).find(x => x.id === v.model);
    const p = m ? unitPrice(m, v.size || '1K') : null;
    price = p != null ? `≈ ${fmtPrice(p * (Number(v.count) || 1))}` : m?.free ? 'free tier' : '';
  } else {
    const secs = Number(v.duration) || 6;
    price = typeof videoPrice === 'function' ? videoPrice(secs, v.resolution, v.model) : '';
  }
  const running = r.status === 'running';
  return [
    h('div', { class: 'nd-run-row' },
      h('button', { type: 'button', class: 'btn small primary', disabled: running, onclick: () => ndRun(node.id) }, icon('sparkle', 14), running ? `Running ${r.done}/${r.total}…` : t.output === 'video' ? 'Generate video' : 'Generate'),
      h('span', { class: 'nd-price' }, price)),
    r.error ? h('p', { class: 'nd-error' }, errorText(r.error)) : null,
    r.items.length ? h('div', { class: 'nd-results' }, ...r.items.slice(0, 8).map(item => {
      const video = /^video\//.test(item.mimeType || '');
      return h('button', { type: 'button', class: 'nd-result', title: 'Open', onclick: () => openLightbox(item.id) },
        video ? h('span', { class: 'nd-result-video' }, icon('film', 18)) : h('img', { src: thumbUrl(item), alt: '' }));
    })) : null,
  ];
}

function ndRefreshRun(node) {
  const box = document.querySelector(`[data-run="${node.id}"]`);
  if (box) box.replaceChildren(...ndRunControls(node));
}

// retries hiccups like Create does
async function ndRetry(request, onWait) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request();
    } catch (err) {
      const info = err.info || {};
      if (!info.retryable || attempt >= MAX_RETRIES) throw err;
      const wait = Math.min(info.retryAfterMs || 3000 * 2 ** attempt + Math.random() * 1000, 60000);
      onWait?.(wait, attempt);
      await sleep(wait);
    }
  }
}

// an image result of another node, uploaded as a reference
async function ndItemAsRef(item) {
  const res = await fetch(mediaUrl(item));
  if (!res.ok) throw new Error('The image isn’t available.');
  return uploadImage(await res.blob(), fileName(item));
}

async function ndResolveImage(entry, depth) {
  if (!entry) return null;
  if (entry.kind === 'reference') return entry.image?.path ? { path: entry.image.path, role: entry.role || 'auto' } : null;
  const r = ndResult(entry.node);
  if (!r.items.length) {
    if (depth > 3) return null;
    await ndRun(entry.node, depth + 1);
  }
  const item = ndResult(entry.node).items[0];
  if (!item) return null;
  const up = await ndItemAsRef(item);
  return { path: up.path, role: 'auto', itemId: item.id };
}

async function ndRun(nodeId, depth = 0) {
  const node = nd.graph.nodes.find(n => n.id === nodeId);
  if (!node) return;
  const t = NodesCore.NODE_TYPES[node.type];
  const r = ndResult(node.id);
  if (r.status === 'running') return;
  const c = NodesCore.compile(nd.graph, { target: node.id });
  r.status = 'running';
  r.error = null;
  r.done = 0;
  r.total = t.output === 'image' ? Number(node.values.count) || 1 : 1;
  ndRefreshRun(node);
  try {
    if (t.output === 'image') await ndRunImage(node, c, r, depth);
    else if (typeof videoRunFromNodes === 'function') await videoRunFromNodes(node, c, r, depth);
    else throw new Error('Video generation isn’t available yet.');
    r.status = 'done';
  } catch (err) {
    r.status = 'error';
    r.error = err;
    toastError(err, `“${t.title}” failed`);
  }
  ndRefreshRun(node);
}

async function ndRunImage(node, c, r, depth) {
  const v = node.values;
  const m = (state.models || []).find(x => x.id === v.model) || currentModel();
  if (!m) throw new Error('No image model is available.');
  if (!ensureKey(m)) throw new Error('Add the key for this model first.');
  const refs = [];
  for (const entry of c.inputs.refs || []) {
    const ref = await ndResolveImage(entry, depth);
    if (ref) refs.push(ref);
  }
  if (refs.length && m.refs === false) throw new Error(`${m.label} can’t use reference images – pick FLUX.2 klein or a Gemini model.`);
  if (!c.parts.base && !refs.length) throw new Error('Connect a Prompt node (or a reference image) to this Generate node.');
  const createdAt = new Date().toISOString();
  const batchId = `n${Date.now().toString(36)}${uid().slice(0, 4)}`;
  const payload = {
    model: m.id,
    prompt: c.prompt,
    userPrompt: c.parts.base || nd.graph.name,
    aspectRatio: v.ratio === 'auto' ? null : v.ratio,
    imageSize: m.sizes?.length ? (m.sizes.includes(v.size) ? v.size : m.sizes.includes('1K') ? '1K' : m.sizes[0]) : null,
    thinkingLevel: m.thinking?.length ? (m.thinkingDefault || m.thinking[0]) : null,
    refs,
    nodes: { graphId: nd.graph.id, name: nd.graph.name, chips: c.chips.slice(0, 12) },
    batchId,
    batchCreatedAt: createdAt,
  };
  const errors = [];
  await Promise.all(Array.from({ length: r.total }, (_, i) => ndRetry(() => api('/api/generate', { body: { ...payload, index: i } }))
    .then(res => {
      r.items.unshift(...res.items);
      state.items.unshift(...res.items);
      r.done++;
      ndRefreshRun(node);
    })
    .catch(err => { errors.push(err); })));
  updateSpend();
  schedulePoll();
  if (errors.length && errors.length === r.total) throw errors[0];
  if (errors.length) toastError(errors[0], `${errors.length} of ${r.total} images failed`);
}

async function ndRunAll() {
  const outputs = NodesCore.outputNodes(nd.graph);
  if (!outputs.length) { toast('Add a Generate image or Generate video node first.'); return; }
  // images first – videos may use them as frames
  outputs.sort((a, b) => (NodesCore.NODE_TYPES[a.type].output === 'image' ? 0 : 1) - (NodesCore.NODE_TYPES[b.type].output === 'image' ? 0 : 1));
  for (const n of outputs) await ndRun(n.id);
}

// ── Prompt preview (right) ──────────────────────────────────────────────────

function ndRenderSide() {
  const side = $('#ndSide');
  if (!side || !nd.graph) return;
  const g = nd.graph;
  const outputs = NodesCore.outputNodes(g);
  if (nd.previewTarget && !outputs.some(n => n.id === nd.previewTarget)) nd.previewTarget = null;
  const c = NodesCore.compile(g, nd.previewTarget ? { target: nd.previewTarget } : {});
  const tabs = [['prompt', 'Final prompt'], ['prose', 'Description'], ['xml', 'XML'], ['json', 'JSON'], ['markdown', 'Markdown']];
  const text = nd.tab === 'prompt' ? c.prompt : c.parts[nd.tab] || '';
  const selected = g.nodes.find(n => nd.sel.has(n.id));
  const fmt = (key, label) => {
    const cb = h('input', { type: 'checkbox', checked: g.formats?.[key] !== false });
    cb.addEventListener('change', () => { ndCheckpoint(); g.formats = { ...g.formats, [key]: cb.checked }; ndChanged(); });
    return h('label', { class: 'check' }, cb, h('span', {}, label));
  };
  side.replaceChildren(
    h('div', { class: 'nd-side-head' }, h('h2', {}, 'Prompt')),
    h('div', { class: 'nd-side-body' },
      outputs.length > 1 && (() => {
        const sel = h('select', { class: 'fxe-select' }, ...outputs.map(n => h('option', { value: n.id, selected: n.id === c.target }, `${NodesCore.NODE_TYPES[n.type].title}${outputs.filter(x => x.type === n.type).length > 1 ? ` (${Math.round(n.x)}, ${Math.round(n.y)})` : ''}`)));
        sel.addEventListener('change', () => { nd.previewTarget = sel.value; ndRenderSide(); });
        return h('label', { class: 'vx-lbl' }, 'Preview for', sel);
      })(),
      c.chips.length ? h('div', { class: 'nd-chips-list' }, ...c.chips.map(x => h('span', { class: 'pill' }, x))) : h('p', { class: 'vx-note' }, 'Connect nodes to a Generate node to build the prompt.'),
      ...c.warnings.map(w => h('p', { class: 'nd-warn' }, w)),
      h('div', { class: 'nd-tabs', role: 'tablist' }, ...tabs.map(([id, label]) => h('button', {
        type: 'button', role: 'tab', class: `chip-btn small${nd.tab === id ? ' active' : ''}`, 'aria-selected': String(nd.tab === id),
        onclick: () => { nd.tab = id; ndRenderSide(); },
      }, label))),
      h('pre', { class: 'nd-code', tabindex: '0' }, text || '—'),
      h('div', { class: 'nd-row' },
        h('span', { class: 'muted small' }, `${(text || '').length.toLocaleString('en-GB')} characters`),
        h('span', { class: 'vx-bar-fill' }),
        h('button', { type: 'button', class: 'btn small', onclick: () => { navigator.clipboard?.writeText(text || '').then(() => toast('Copied.', 'success'), () => toast('Couldn’t copy.', 'error')); } }, icon('copy', 14), 'Copy')),
      c.kind === 'image' && c.prompt.length > 2000 && h('p', { class: 'nd-warn' }, 'Open-source models (FLUX, Z-Image) read only about the first 2,000 characters – for them, attach fewer formats below.'),
      h('div', { class: 'nd-formats' },
        h('h3', {}, 'Attach to the prompt'),
        fmt('prose', 'Description (prose)'), fmt('xml', 'XML'), fmt('json', 'JSON'), fmt('markdown', 'Markdown')),
      h('div', { class: 'nd-use' },
        h('button', { type: 'button', class: 'btn small', onclick: ndUseInCreate, title: 'Add this graph’s camera, lens, light… to every prompt in Create' }, icon('sparkle', 14), state.ui.nodeGraph === g.id ? 'Used in Create ✓' : 'Use in Create'),
        typeof videoUseGraph === 'function' && g.kind === 'video' && h('button', { type: 'button', class: 'btn small', onclick: () => videoUseGraph(g.id) }, icon('film', 14), 'Use in Video')),
      selected && h('div', { class: 'nd-help' },
        h('h3', {}, NodesCore.NODE_TYPES[selected.type].title),
        h('p', { class: 'vx-note' }, NodesCore.NODE_TYPES[selected.type].help))),
  );
}

function ndUseInCreate() {
  state.ui.nodeGraph = nd.graph.id;
  saveUi();
  ndRenderSide();
  if (typeof renderNodesField === 'function') renderNodesField();
  toast(`Create now adds “${nd.graph.name}” to every prompt.`, 'success', { action: { label: 'Open Create', onClick: () => setView('create') } });
}

// ── Keyboard ────────────────────────────────────────────────────────────────

function ndKey(e) {
  if (state.ui.view !== 'nodes' || !nd.ready || !nd.graph) return;
  if (!$('#settingsModal').hidden || state.lightbox) return;
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (mod && k === 's') {
    // also while typing: a name being edited is taken over first
    e.preventDefault();
    if (e.target.matches?.('.nd-name')) e.target.blur();
    ndSave({ announce: true });
    return;
  }
  if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
  if (e.key === ' ') { nd.spaceHand = true; return; }
  if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) ndRedo(); else ndUndo(); return; }
  if (mod && k === 'y') { e.preventDefault(); ndRedo(); return; }
  if (mod && k === 'd') { e.preventDefault(); ndDuplicateNodes(); return; }
  if (mod && k === 'a') { e.preventDefault(); nd.sel = new Set(nd.graph.nodes.map(n => n.id)); ndMarkSelection(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    if (nd.selEdge) {
      ndCheckpoint();
      nd.graph.edges = nd.graph.edges.filter(x => x.id !== nd.selEdge);
      nd.selEdge = null;
      ndChanged({ structure: true });
    } else if (nd.sel.size) {
      ndCheckpoint();
      ndDeleteNodes([...nd.sel]);
    }
    return;
  }
  if (!mod && k === 'f') ndFit();
  if (e.key === 'Escape') { nd.sel.clear(); nd.selEdge = null; ndMarkSelection(); ndRenderWires(); }
}
