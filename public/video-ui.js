// Video – generate clips with Gemini Omni Flash and edit them on a timeline: split, trim, reorder, delete and
// regenerate one part from the frames around it, so the new part keeps the context of the rest. Export records the edit.

const VIDEO_PRICE_PER_SECOND = 0.10; // USD, Gemini Omni Flash at 720p
const VD_STORE = 'hombresai-video-project';
const VD_FPS = 30;

const vd = {
  ready: false,
  projects: [],
  project: null,
  jobs: new Map(),
  sel: null,
  t: 0,
  cur: 0,
  playing: false,
  zoom: 70,                 // px per second on the timeline
  undo: [],
  redo: [],
  players: [],
  active: 0,
  raf: 0,
  audio: null,
  durations: new Map(),
  saveTimer: null,
  saving: 0,
  pollTimer: null,
  frameTimer: null,
  syncTimer: null,
  capturing: false,
  drag: false,              // an edge is being dragged (the part is changed in place)
  regenSeen: new Map(),     // segment id → the newest server regeneration this browser has loaded
  appendJobs: new Set(),    // generation jobs whose clip goes to the end of the timeline
  models: [],               // Gemini Omni Flash and the free open models on Hugging Face (from the server)
  gen: { model: '', prompt: '', graph: '', ratio: '16:9', resolution: '720p', duration: 6, sound: true, first: null, last: null, addToTimeline: true },
  regen: { model: '', instruction: '', keepLength: true, before: true, after: true, resolution: '720p' },
  recording: null,
};

const vdIsFree = id => Boolean(vdModel(id)?.free ?? NodesCore.VIDEO_MODELS.find(m => m.id === id)?.free);
const videoPrice = (seconds, resolution, model) => (vdIsFree(model) ? 'free'
  : `≈ ${fmtPrice((Number(seconds) || 6) * VIDEO_PRICE_PER_SECOND)}${resolution && !['360p', '720p'].includes(resolution) ? ' + upscale' : ''}`);
const vdModel = id => vd.models.find(m => m.id === id) || (id ? null : vd.models[0]);
const VD_MODEL_STORE = 'hombresai-video-model';
const vdSegLen = s => Math.max(0.05, s.out - s.in);
const vdFmt = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const vdItem = id => state.items.find(i => i.id === id);

function vdWait(el, event, ms = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error(`The video didn’t load (${event}).`)); }, ms);
    const ok = () => { cleanup(); resolve(); };
    const bad = () => { cleanup(); reject(new Error('The video couldn’t be loaded.')); };
    const cleanup = () => { clearTimeout(timer); el.removeEventListener(event, ok); el.removeEventListener('error', bad); };
    el.addEventListener(event, ok, { once: true });
    el.addEventListener('error', bad, { once: true });
  });
}

// ── View, setup ─────────────────────────────────────────────────────────────

function videoOnView(active) {
  if (!active) { if (vd.ready) vdPause(); return; }
  if (!vd.ready) vdInit();
  else { vdRenderAll(); }
}

async function vdInit() {
  vd.ready = true;
  vd.players = [...document.querySelectorAll('.vd-player')];
  for (const p of vd.players) { p.playsInline = true; p.preload = 'auto'; }
  vdBindEvents();
  try {
    const [projects, jobs, models] = await Promise.all([api('/api/video/projects'), api('/api/video/jobs'), api('/api/video/models')]);
    vd.projects = projects.projects || [];
    for (const j of jobs.jobs || []) vd.jobs.set(j.id, j);
    vd.models = models.models || [];
  } catch (err) {
    toastError(err, 'Couldn’t load the video projects');
  }
  // the last model used; without a Gemini key the free Wan 2.2
  let model = null;
  try { model = localStorage.getItem(VD_MODEL_STORE); } catch { /* fine */ }
  const fallback = state.config?.hasKey ? 'gemini-omni-1.1-flash' : 'wan-2.2';
  vdSetModel(vdModel(model) ? model : fallback, { quiet: true });
  vd.regen.model = vdModel(vd.gen.model)?.lastFrame ? vd.gen.model : fallback;
  ndEnsureGraphs().catch(() => {});
  let saved = null;
  try { saved = localStorage.getItem(VD_STORE); } catch { /* fine */ }
  const p = vd.projects.find(x => x.id === saved) || vd.projects[0];
  if (p) vdOpen(p);
  else await vdNewProject({ quiet: true });
  vdSchedulePoll();
  vdScheduleSync();
}

function vdOpen(p) {
  vdPause();
  vd.project = p;
  vdNoteRegens();
  vd.sel = p.segments[0]?.id || null;
  vd.t = 0;
  vd.undo = [];
  vd.redo = [];
  try { localStorage.setItem(VD_STORE, p.id); } catch { /* fine */ }
  vdRenderAll();
  vdMeasureAll().then(() => { vdRenderTimeline(); vdSeek(0); });
  vdScheduleFrames();
}

function vdRenderAll() {
  vdRenderBar();
  vdRenderGen();
  vdRenderTimeline();
  vdRenderSide();
  vdRenderTransport();
}

// ── Projects, saving, history ───────────────────────────────────────────────

async function vdNewProject({ quiet = false } = {}) {
  const res = await api('/api/video/projects', { body: { project: { name: 'Untitled video', aspectRatio: vd.gen.ratio, segments: [] } } });
  vd.projects.unshift(res.project);
  vdOpen(res.project);
  if (!quiet) toast('New video project.');
}

function vdSnapshot() {
  return JSON.stringify({ name: vd.project.name, aspectRatio: vd.project.aspectRatio, segments: vd.project.segments });
}

function vdCheckpoint() {
  vd.undo.push(vdSnapshot());
  if (vd.undo.length > 80) vd.undo.shift();
  vd.redo = [];
}

function vdChanged({ frames = false } = {}) {
  vd.project.updatedAt = new Date().toISOString();
  vdRenderScreen();
  vdRenderTimeline();
  vdRenderSide();
  vdRenderTransport();
  clearTimeout(vd.saveTimer);
  vd.saveTimer = setTimeout(vdSave, 500);
  if (frames) vdScheduleFrames();
}

async function vdSave() {
  clearTimeout(vd.saveTimer);
  vd.saveTimer = null;
  if (!vd.project) return;
  vd.saving++;
  try {
    const res = await api('/api/video/projects', { body: { project: vd.project } });
    // keep the local object (the timeline points to it); take over what the server cleaned
    Object.assign(vd.project, { id: res.project.id, updatedAt: res.project.updatedAt });
    // a part was regenerated on the server meanwhile – the server kept it, so show it
    if (res.merged && !vd.saveTimer) await vdApplyServer(res.project);
  } catch (err) {
    toastError(err, 'Couldn’t save the video project');
  } finally {
    vd.saving--;
  }
}

function vdNoteRegens() {
  for (const s of vd.project?.segments || []) if (s.regenAt) vd.regenSeen.set(s.id, s.regenAt);
}

function vdRestore(snap) {
  Object.assign(vd.project, JSON.parse(snap));
  // an undo the user asked for wins, also over a regeneration this browser has already shown
  for (const s of vd.project.segments) if (vd.regenSeen.has(s.id)) s.regenAt = vd.regenSeen.get(s.id);
  if (!vd.project.segments.some(s => s.id === vd.sel)) vd.sel = vd.project.segments[0]?.id || null;
  vdChanged({ frames: true });
  vdSeek(Math.min(vd.t, vdStarts().total));
}

function vdUndo() { if (!vd.undo.length) return; vd.redo.push(vdSnapshot()); vdRestore(vd.undo.pop()); }
function vdRedo() { if (!vd.redo.length) return; vd.undo.push(vdSnapshot()); vdRestore(vd.redo.pop()); }

async function vdReloadProject() {
  const res = await api('/api/video/projects');
  vd.projects = res.projects || [];
  const fresh = vd.projects.find(p => p.id === vd.project?.id);
  // with an edit still waiting to be saved, the save brings the server's change back instead (see vdSave)
  if (fresh && fresh.updatedAt !== vd.project.updatedAt && vdIdle()) await vdApplyServer(fresh);
}

const vdIdle = () => vd.project && !vd.saveTimer && !vd.saving && !vd.drag && !vd.recording;

// Takes over the server's copy of the open project (a regenerated part, an edit by Claude) as an undoable step.
async function vdApplyServer(fresh) {
  vdCheckpoint();
  const t = vd.t;
  Object.assign(vd.project, fresh);
  vdNoteRegens();
  if (!vd.project.segments.some(s => s.id === vd.sel)) vd.sel = vd.project.segments[0]?.id || null;
  vdRenderSide(); // right away, so no button keeps pointing at a replaced part
  await vdMeasureAll();
  vdRenderBar();
  vdRenderTimeline();
  vdRenderSide();
  vdRenderTransport();
  vdSeek(Math.min(t, vdStarts().total));
  vdScheduleFrames();
  // a regenerated part can arrive before the job list has noticed that its job is done
  if ([...vd.jobs.values()].some(j => j.status === 'running' && j.projectId === vd.project.id)) vdPoll();
}

// Claude can edit the open project through the connector – check for that while nothing local waits to be saved.
function vdScheduleSync() {
  clearTimeout(vd.syncTimer);
  vd.syncTimer = setTimeout(vdSync, 4000);
}

async function vdSync() {
  try {
    if (vdIdle() && state.ui.view === 'video' && document.visibilityState === 'visible') await vdReloadProject();
  } catch { /* next time */ }
  vdScheduleSync();
}

// ── Timeline maths ──────────────────────────────────────────────────────────

function vdStarts() {
  const starts = [];
  let t = 0;
  for (const s of vd.project?.segments || []) { starts.push(t); t += vdSegLen(s); }
  return { starts, total: t };
}

function vdLocate(t) {
  const segs = vd.project?.segments || [];
  if (!segs.length) return null;
  const { starts, total } = vdStarts();
  const tt = Math.max(0, Math.min(total, t));
  let i = starts.findIndex((st, k) => tt < st + vdSegLen(segs[k]) - 1e-6);
  if (i < 0) i = segs.length - 1;
  return { i, seg: segs[i], start: starts[i], local: Math.min(segs[i].out - 0.001, segs[i].in + (tt - starts[i])) };
}

// The real length of a clip: from the gallery, or measured (some files don't carry it in their header).
async function vdMeasure(itemId) {
  if (vd.durations.has(itemId)) return vd.durations.get(itemId);
  const item = vdItem(itemId);
  if (item?.duration) { vd.durations.set(itemId, item.duration); return item.duration; }
  const v = document.createElement('video');
  v.muted = true;
  v.preload = 'metadata';
  v.src = `/media/${itemId}`;
  let d = 8;
  try {
    await vdWait(v, 'loadedmetadata');
    d = v.duration;
    if (!Number.isFinite(d) || d <= 0) {
      // files without a duration in the header: seeking far makes the browser read it
      v.currentTime = 1e7;
      await vdWait(v, 'durationchange', 8000).catch(() => {});
      d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : v.currentTime || 8;
    }
  } catch { /* keep the default */ }
  v.removeAttribute('src');
  v.load();
  d = Math.round(d * 1000) / 1000;
  vd.durations.set(itemId, d);
  if (item && !item.duration) {
    item.duration = d;
    api(`/api/history/${itemId}`, { method: 'PATCH', body: { duration: d } }).catch(() => {});
  }
  return d;
}

async function vdMeasureAll() {
  for (const s of vd.project?.segments || []) {
    const d = await vdMeasure(s.itemId);
    if (s.out > d + 0.01) s.out = d;
  }
}

// ── Toolbar ─────────────────────────────────────────────────────────────────

function vdRenderBar() {
  const p = vd.project;
  if (!p) return;
  const select = h('select', { class: 'fxe-select vd-project', 'aria-label': 'Video project' },
    ...vd.projects.map(x => h('option', { value: x.id, selected: x.id === p.id }, x.name)));
  select.addEventListener('change', () => { const x = vd.projects.find(y => y.id === select.value); if (x) vdOpen(x); });
  const name = h('input', { type: 'text', class: 'vx-text vd-name', value: p.name, maxlength: '80', 'aria-label': 'Project name' });
  name.addEventListener('change', () => { vdCheckpoint(); p.name = name.value.trim() || 'Untitled video'; vdChanged(); vdRenderBar(); });
  const ratio = h('select', { class: 'fxe-select vd-ratio', 'aria-label': 'Project aspect ratio' }, ...['16:9', '9:16'].map(r => h('option', { value: r, selected: r === p.aspectRatio }, r)));
  ratio.addEventListener('change', () => { vdCheckpoint(); p.aspectRatio = ratio.value; vd.gen.ratio = ratio.value; vdChanged(); vdRenderScreen(); vdRenderGen(); });
  $('#vdBar').replaceChildren(
    select, name, ratio,
    h('button', { type: 'button', class: 'btn small ghost', onclick: () => vdNewProject() }, icon('plus', 14), h('span', {}, 'New')),
    h('span', { class: 'vx-bar-fill' }),
    vxIconBtn('undo', 'Undo (Ctrl+Z)', vdUndo),
    vxIconBtn('redo', 'Redo (Ctrl+Shift+Z)', vdRedo),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Record the edit as a video file', onclick: () => vdExport(false), disabled: !p.segments.length || Boolean(vd.recording) }, vxIcon('download', 15), h('span', {}, 'Export')),
    h('button', { type: 'button', class: 'btn small primary', title: 'Record the edit and save it to the gallery (and Google Drive)', onclick: () => vdExport(true), disabled: !p.segments.length || Boolean(vd.recording) }, vxIcon('cloud', 15), h('span', {}, 'Save to gallery')),
  );
  vdRenderScreen();
}

function vdRenderScreen() {
  const screen = $('#vdScreen');
  if (!screen || !vd.project) return;
  screen.style.aspectRatio = vd.project.aspectRatio === '9:16' ? '9 / 16' : '16 / 9';
  $('#vdEmpty').hidden = Boolean(vd.project.segments.length);
}

// ── Generate panel (left) ───────────────────────────────────────────────────

function vdRenderGen() {
  const box = $('#vdGen');
  if (!box) return;
  const g = vd.gen;
  const prompt = h('textarea', { class: 'vx-prompt', rows: 4, placeholder: 'Describe the clip, e.g. “a paper boat drifting down a rainy street, slow push-in, soft rain sounds”', 'aria-label': 'Video prompt' });
  prompt.value = g.prompt;
  prompt.addEventListener('input', () => { g.prompt = prompt.value; });
  prompt.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); vdGenerate(); } });
  const graphs = (nd.graphs || []).filter(x => x.kind === 'video');
  const graphSel = h('select', { class: 'fxe-select' }, h('option', { value: '' }, 'None'), ...graphs.map(x => h('option', { value: x.id, selected: x.id === g.graph }, x.name)));
  graphSel.addEventListener('change', () => { g.graph = graphSel.value; vdRenderGen(); });
  const sel = (label, key, values, fmt = v => v) => {
    const s = h('select', { class: 'fxe-select' }, ...values.map(v => h('option', { value: v, selected: String(v) === String(g[key]) }, fmt(v))));
    s.addEventListener('change', () => { g[key] = typeof g[key] === 'number' ? Number(s.value) : s.value; vdRenderGen(); });
    return h('label', { class: 'vx-lbl' }, label, s);
  };
  const frame = (key, label) => h('div', { class: 'vd-frame' },
    h('span', { class: 'vd-frame-label' }, label),
    g[key] ? h('img', { src: g[key].url, alt: '' }) : h('span', { class: 'vd-frame-empty' }, '—'),
    h('button', { type: 'button', class: 'btn small', 'data-picker': '', onclick: e => openImagePicker(e.currentTarget, v => { g[key] = v; vdRenderGen(); }, {
      title: label,
      extra: vd.project?.segments.length ? [{ label: 'Use the frame at the playhead', icon: 'film', onClick: () => vdUsePlayheadFrame(key) }] : [],
    }) }, g[key] ? 'Change' : 'Choose…'),
    g[key] ? h('button', { type: 'button', class: 'link-btn', onclick: () => { g[key] = null; vdRenderGen(); } }, 'Remove') : null);
  const addition = vdGraphAddition();
  const m = vdModel(g.model) || {};
  const modelSel = h('select', { class: 'fxe-select', 'aria-label': 'Video model' },
    ...vd.models.map(x => h('option', { value: x.id, selected: x.id === m.id }, `${x.label} · ${x.free ? 'free' : `≈ ${fmtPrice(x.pricePerSecond)} / s`}`)));
  modelSel.addEventListener('change', () => vdSetModel(modelSel.value));
  const lengths = [];
  for (let s = m.free ? 2 : m.minSeconds || 3; s <= (m.maxSeconds || 10); s++) lengths.push(s);
  const fixed = (label, value) => h('div', { class: 'vx-lbl' }, label, h('span', { class: 'vd-fixed' }, value));
  const hasToken = Boolean(state.config?.huggingface?.hasToken);
  box.replaceChildren(
    h('div', { class: 'nd-lib-head' }, h('h2', {}, 'Video')),
    h('section', { class: 'vx-sec' },
      h('h3', {}, 'Generate a clip'),
      h('label', { class: 'vx-lbl' }, 'Model', modelSel),
      m.desc ? h('p', { class: 'vx-note vd-model-note' }, m.desc) : null,
      prompt,
      h('label', { class: 'vx-lbl' }, 'Node graph (camera, lens, movement, sound…)', graphSel),
      addition ? h('div', { class: 'nd-chips-list' }, ...addition.chips.slice(0, 8).map(c => h('span', { class: 'pill' }, c))) : null,
      h('div', { class: 'vx-grid2' },
        sel('Aspect ratio', 'ratio', m.ratios || ['16:9', '9:16']),
        m.free ? fixed('Resolution', m.resolutions?.[0] || '') : sel('Resolution', 'resolution', m.resolutions || ['360p', '720p', '1080p', '4k'])),
      h('div', { class: 'vx-grid2' },
        sel('Length', 'duration', lengths, v => `${v} s`),
        m.free ? fixed('Sound', m.sound ? 'With sound' : 'Silent')
          : h('label', { class: 'fxe-ctl fxe-toggle vd-sound' }, h('span', {}, 'Sound'), (() => { const cb = h('input', { type: 'checkbox', class: 'switch', checked: g.sound }); cb.addEventListener('change', () => { g.sound = cb.checked; }); return cb; })())),
      frame('first', m.firstFrame === 'auto' ? 'First frame (drawn from the prompt if empty)' : 'First frame'),
      g.first && m.lastFrame ? frame('last', 'Last frame') : null,
      h('label', { class: 'check vd-check' }, (() => { const cb = h('input', { type: 'checkbox', checked: g.addToTimeline }); cb.addEventListener('change', () => { g.addToTimeline = cb.checked; }); return cb; })(), h('span', {}, 'Add it to the timeline when it’s ready')),
      h('button', { type: 'button', class: 'btn primary vx-gen-btn', onclick: vdGenerate }, icon('sparkle', 16), h('span', {}, 'Generate video'), h('small', {}, videoPrice(g.duration, g.resolution, g.model))),
      h('p', { class: 'vx-note' }, m.free
        ? `Runs on Hugging Face’s shared GPUs – usually 1–3 minutes, longer when they’re busy. Free GPU time: ${hasToken ? '5 minutes a day with your token' : '2 minutes a day, 5 with a free token in Settings'} – a few short clips.`
        : 'Gemini Omni Flash makes the clip with sound in about 1–3 minutes. It also lands in your gallery and on Google Drive.')),
    h('section', { class: 'vx-sec', id: 'vdJobs' }),
    h('section', { class: 'vx-sec', id: 'vdBin' }),
  );
  vdRenderJobs();
  vdRenderBin();
}

function vdSetModel(id, { quiet = false } = {}) {
  const m = vdModel(id);
  if (!m) return;
  const g = vd.gen;
  g.model = m.id;
  g.duration = Math.min(m.maxSeconds, Math.max(m.free ? 2 : m.minSeconds, g.duration));
  if (!m.lastFrame) g.last = null;
  try { localStorage.setItem(VD_MODEL_STORE, m.id); } catch { /* fine */ }
  if (!quiet) vdRenderGen();
}

// the job list and the clips refresh on their own, so typing in the prompt isn't interrupted
function vdRenderJobs() {
  const box = $('#vdJobs');
  if (!box) return;
  const running = [...vd.jobs.values()].filter(j => j.status === 'running');
  const recent = [...vd.jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  box.hidden = !recent.length;
  box.replaceChildren(h('h3', {}, running.length ? `Generating (${running.length})` : 'Recent clips'), h('div', { class: 'vd-jobs' }, ...recent.map(vdJobRow)));
}

function vdRenderBin() {
  const box = $('#vdBin');
  if (!box) return;
  const clips = state.items.filter(i => /^video\//.test(i.mimeType || '')).slice(0, 40);
  box.replaceChildren(
    h('h3', {}, 'Your clips'),
    clips.length
      ? h('div', { class: 'vd-bin' }, ...clips.map(item => {
        const el = h('button', { type: 'button', class: 'vd-bin-item', title: `${item.userPrompt || 'Clip'} – click to add to the timeline`, draggable: 'true', onclick: () => vdAddClip(item) },
          item.thumb ? h('img', { src: thumbUrl(item), alt: '' }) : h('span', { class: 'vd-bin-ph' }, icon('film', 18)),
          h('span', { class: 'vd-bin-len' }, item.duration ? `${item.duration.toFixed(1)} s` : ''));
        el.addEventListener('dragstart', e => { e.dataTransfer.setData('application/x-mhf-item', item.id); e.dataTransfer.effectAllowed = 'copy'; });
        return el;
      }))
      : h('p', { class: 'vx-note' }, 'No clips yet – generate one above.'));
}

function vdJobRow(job) {
  const secs = Math.round((Date.now() - Date.parse(job.createdAt)) / 1000);
  const status = job.status === 'running' ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : job.status === 'done' ? 'Ready' : job.status === 'cancelled' ? 'Cancelled' : 'Failed';
  const label = VIDEO_LABELS[job.model] || '';
  return h('div', { class: `vd-job is-${job.status}` },
    job.status === 'running' ? h('span', { class: 'spinner' }) : job.item?.thumb ? h('img', { src: thumbUrl(job.item), alt: '' }) : h('span', { class: 'vd-bin-ph' }, icon('film', 16)),
    h('span', { class: 'vd-job-text', title: [label, job.stage, job.error || job.prompt].filter(Boolean).join(' · ') },
      job.segmentId ? `Regenerating: ${job.prompt}` : job.prompt,
      job.free ? h('small', {}, job.status === 'running' && job.stage ? job.stage : `${label} · free`) : null),
    h('span', { class: 'vd-job-status' }, status),
    job.status === 'running' ? h('button', { type: 'button', class: 'link-btn', onclick: () => vdCancelJob(job) }, 'Cancel') : null,
    job.status === 'done' && job.item && !job.segmentId ? h('button', { type: 'button', class: 'link-btn', onclick: () => vdAddClip(job.item) }, 'Add') : null);
}

function vdGraphAddition() {
  const graph = vd.gen.graph ? ndGraphById(vd.gen.graph) : null;
  if (!graph) return null;
  const c = NodesCore.compile(graph, { target: null, skip: ['prompt'], only: 'video' });
  return c.addition ? { graph, ...c } : null;
}

function videoUseGraph(graphId) {
  vd.gen.graph = graphId;
  setView('video');
  vdRenderGen();
  toast('The node graph is set for new clips in Video.', 'success');
}

async function vdUsePlayheadFrame(key) {
  const loc = vdLocate(vd.t);
  if (!loc) return;
  try {
    const blob = await vdGrabFrame(loc.seg.itemId, loc.local);
    const res = await uploadImage(blob, 'frame.jpg');
    vd.gen[key] = { path: res.path, url: res.url };
    vdRenderGen();
  } catch (err) {
    toastError(err, 'Couldn’t capture the frame');
  }
}

// ── Generating ──────────────────────────────────────────────────────────────

async function vdStartJob(body) {
  if (!vdIsFree(body.model) && !state.config?.hasKey) {
    openSettings('Gemini Omni Flash uses your Gemini API key – add it below, or pick one of the free models.');
    throw new Error('Add your Gemini API key first – or pick a free model.');
  }
  const res = await api('/api/video/generate', { body });
  vd.jobs.set(res.job.id, res.job);
  vdSchedulePoll();
  return res.job;
}

async function vdGenerate() {
  const g = vd.gen;
  const addition = vdGraphAddition();
  if (!g.prompt.trim() && !addition) { toast('Describe the clip first.'); return; }
  try {
    const job = await vdStartJob({
      model: g.model,
      prompt: [g.prompt.trim(), addition?.addition].filter(Boolean).join('\n\n'),
      userPrompt: g.prompt.trim() || addition.graph.name,
      aspectRatio: g.ratio, resolution: g.resolution, duration: g.duration, sound: g.sound,
      firstFrame: g.first ? { path: g.first.path } : undefined,
      lastFrame: g.first && g.last ? { path: g.last.path } : undefined,
      nodes: addition ? { graphId: addition.graph.id, name: addition.graph.name, chips: addition.chips } : undefined,
    });
    if (g.addToTimeline) vd.appendJobs.add(job.id);
    toast(vdIsFree(g.model)
      ? `Generating the clip with ${vdModel(g.model).label} on Hugging Face (free) – usually 1–3 minutes.`
      : `Generating the clip (${videoPrice(g.duration, g.resolution, g.model)}) – it takes about 1–3 minutes.`, 'success');
    vdRenderJobs();
  } catch (err) {
    toastError(err, 'Couldn’t start the video');
  }
}

async function vdCancelJob(job) {
  try {
    const res = await api(`/api/video/jobs/${job.id}/cancel`, { body: {} });
    vd.jobs.set(job.id, res.job);
    vdRenderJobs();
    vdRenderTimeline();
  } catch (err) {
    toastError(err, 'Couldn’t cancel it');
  }
}

function vdSchedulePoll() {
  clearTimeout(vd.pollTimer);
  if (![...vd.jobs.values()].some(j => j.status === 'running')) return;
  vd.pollTimer = setTimeout(vdPoll, 2500);
}

async function vdPoll() {
  let finished = false;
  try {
    const res = await api('/api/video/jobs');
    for (const job of res.jobs || []) {
      const before = vd.jobs.get(job.id);
      vd.jobs.set(job.id, job);
      if (before?.status === 'running' && job.status !== 'running') { finished = true; await vdJobFinished(job); }
    }
  } catch { /* try again */ }
  if (vd.ready && state.ui.view === 'video') {
    vdRenderJobs();
    vdRenderTimeline();
    if (finished) vdRenderSide(); // the Regenerate button is enabled again
  }
  vdSchedulePoll();
}

async function vdJobFinished(job) {
  if (job.status !== 'done' || !job.item) {
    toast(`The video failed: ${job.error || 'unknown reason'}`, 'error', { duration: 12000 });
    vd.appendJobs.delete(job.id);
    return;
  }
  if (!state.items.some(i => i.id === job.item.id)) state.items.unshift(job.item);
  updateSpend();
  schedulePoll();
  vdRenderBin();
  if (job.projectId) {
    // a regenerated segment: the server has already put the new take in place
    if (vd.project?.id === job.projectId) await vdReloadProject();
    toast('The part is regenerated – the old version stays under “Takes”.', 'success');
  } else if (vd.appendJobs.has(job.id)) {
    vd.appendJobs.delete(job.id);
    await vdAddClip(job.item);
    toast('The new clip is on the timeline.', 'success');
  } else toast('The video is ready.', 'success', { action: { label: 'Add to timeline', onClick: () => vdAddClip(job.item) } });
}

// Video node in Nodes: generate and wait.
async function videoRunFromNodes(node, c, r, depth) {
  const v = node.values;
  const first = await ndResolveImage(c.inputs.first, depth);
  const last = first ? await ndResolveImage(c.inputs.last, depth) : null;
  const refs = [];
  if (!first) for (const entry of c.inputs.refs || []) { const ref = await ndResolveImage(entry, depth); if (ref) refs.push({ path: ref.path, role: ref.role }); }
  if (!c.parts.base && !first) throw new Error('Connect a Prompt node or a first frame to Generate video.');
  let job = await vdStartJob({
    model: v.model, prompt: c.prompt, userPrompt: c.parts.base || nd.graph.name, aspectRatio: v.ratio, resolution: v.resolution, duration: Number(v.duration), sound: v.sound !== false,
    firstFrame: first ? { path: first.path } : undefined, lastFrame: last ? { path: last.path } : undefined, refs,
    nodes: { graphId: nd.graph.id, name: nd.graph.name, chips: c.chips.slice(0, 12) },
  });
  while (job.status === 'running') {
    await sleep(2500);
    job = (await api(`/api/video/jobs/${job.id}`)).job;
    vd.jobs.set(job.id, job);
  }
  if (job.status !== 'done') throw new Error(job.error || 'The video failed.');
  r.items.unshift(job.item);
  if (!state.items.some(i => i.id === job.item.id)) state.items.unshift(job.item);
  r.done = 1;
  updateSpend();
}

// ── Timeline editing ────────────────────────────────────────────────────────

async function vdAddClip(item, at) {
  if (!vd.ready) { setView('video'); await sleep(50); }
  if (!vd.project) return;
  const d = await vdMeasure(item.id);
  vdCheckpoint();
  const seg = { id: `s${uid()}`, itemId: item.id, in: 0, out: d, label: item.userPrompt, takes: [] };
  const index = Number.isInteger(at) ? at : vd.project.segments.length;
  vd.project.segments.splice(index, 0, seg);
  vd.sel = seg.id;
  vdChanged({ frames: true });
  vdSeek(vdStarts().starts[index] || 0);
}

function vdSplit() {
  const loc = vdLocate(vd.t);
  if (!loc) return;
  const { seg, i, local } = loc;
  if (local - seg.in < 0.1 || seg.out - local < 0.1) { toast('Move the playhead inside a part to split it.'); return; }
  vdCheckpoint();
  // the left half still starts and the right half still ends on the same frame
  const right = { ...seg, id: `s${uid()}`, in: Math.round(local * 1000) / 1000, takes: [], frames: seg.frames?.last ? { last: seg.frames.last } : undefined, regenAt: undefined };
  vd.project.segments.splice(i, 1, { ...seg, out: right.in, frames: seg.frames?.first ? { first: seg.frames.first } : undefined }, right);
  vd.sel = right.id;
  vdChanged({ frames: true });
}

function vdDelete(id = vd.sel) {
  const i = vd.project.segments.findIndex(s => s.id === id);
  if (i < 0) return;
  vdCheckpoint();
  vd.project.segments.splice(i, 1);
  vd.sel = vd.project.segments[Math.min(i, vd.project.segments.length - 1)]?.id || null;
  vdChanged({ frames: true });
  vdSeek(Math.min(vd.t, vdStarts().total));
}

function vdMove(id, toIndex) {
  const segs = vd.project.segments;
  const i = segs.findIndex(s => s.id === id);
  if (i < 0 || toIndex === i || toIndex === i + 1) return;
  vdCheckpoint();
  const [s] = segs.splice(i, 1);
  segs.splice(toIndex > i ? toIndex - 1 : toIndex, 0, s);
  vdChanged({ frames: true });
}

function vdSetTrim(seg, inn, out) {
  const d = vd.durations.get(seg.itemId) || seg.out;
  seg.in = Math.max(0, Math.min(inn, out - 0.1));
  seg.out = Math.min(d, Math.max(out, seg.in + 0.1));
  seg.frames = undefined;
}

function vdUseTake(seg, take) {
  vdCheckpoint();
  const current = { itemId: seg.itemId, in: seg.in, out: seg.out, at: new Date().toISOString() };
  seg.takes = [...(seg.takes || []).filter(t => t !== take), current];
  Object.assign(seg, { itemId: take.itemId, in: take.in, out: take.out, frames: undefined });
  vdMeasure(take.itemId).then(() => { vdChanged({ frames: true }); vdSeek(vd.t); });
}

// ── Timeline view ───────────────────────────────────────────────────────────

function vdRenderTimeline() {
  const track = $('#vdTrack');
  if (!track || !vd.project) return;
  const { starts, total } = vdStarts();
  const width = Math.max(total * vd.zoom, 200);
  track.style.width = `${width}px`;
  $('#vdRuler').style.width = `${width}px`;
  const step = vd.zoom >= 60 ? 1 : vd.zoom >= 25 ? 2 : 5;
  const ticks = [];
  for (let t = 0; t <= total + 0.001; t += step) ticks.push(h('span', { class: 'vd-tick', style: `left:${t * vd.zoom}px` }, vdFmt(t).replace(/\.\d$/, '')));
  $('#vdRuler').replaceChildren(...ticks);
  const running = [...vd.jobs.values()].filter(j => j.status === 'running' && j.projectId === vd.project.id);
  track.replaceChildren(...vd.project.segments.map((s, i) => {
    const item = vdItem(s.itemId);
    const busy = running.find(j => j.segmentId === s.id);
    const thumb = s.frames?.first ? `/${s.frames.first}` : item?.thumb ? thumbUrl(item) : null;
    const el = h('div', {
      class: `vd-seg${s.id === vd.sel ? ' selected' : ''}${busy ? ' busy' : ''}`,
      style: `left:${starts[i] * vd.zoom}px;width:${Math.max(4, vdSegLen(s) * vd.zoom - 2)}px${thumb ? `;--thumb:url('${thumb}')` : ''}`,
      'data-seg': s.id, draggable: 'true', title: `${item?.userPrompt || s.label || 'Clip'} · ${vdSegLen(s).toFixed(2)} s`,
    },
    h('span', { class: 'vd-seg-handle left', 'data-trim': 'in' }),
    h('span', { class: 'vd-seg-label' }, `${i + 1}`, (s.takes || []).length ? h('em', {}, ` · ${s.takes.length + 1} takes`) : null),
    busy ? h('span', { class: 'vd-seg-busy' }, h('span', { class: 'spinner' }), 'Regenerating…') : null,
    h('span', { class: 'vd-seg-handle right', 'data-trim': 'out' }));
    return el;
  }));
  vdRenderPlayhead();
}

function vdRenderPlayhead() {
  const ph = $('#vdPlayhead');
  if (ph) ph.style.transform = `translateX(${vd.t * vd.zoom}px)`;
  const time = $('#vdTime');
  if (time) time.textContent = `${vdFmt(vd.t)} / ${vdFmt(vdStarts().total)}`;
}

function vdRenderTransport() {
  const box = $('#vdTransport');
  if (!box) return;
  const zoom = h('input', { type: 'range', min: '15', max: '200', value: String(vd.zoom), 'aria-label': 'Timeline zoom' });
  zoom.addEventListener('input', () => { vd.zoom = Number(zoom.value); vdRenderTimeline(); });
  box.replaceChildren(
    iconBtn(vd.playing ? 'pause' : 'play', vd.playing ? 'Pause (Space)' : 'Play (Space)', () => (vd.playing ? vdPause() : vdPlay()), 'vd-play'),
    h('span', { class: 'fxe-time', id: 'vdTime' }, `${vdFmt(vd.t)} / ${vdFmt(vdStarts().total)}`),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Split at the playhead (S)', onclick: vdSplit, disabled: !vd.project?.segments.length }, icon('scissors', 15), h('span', {}, 'Split')),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Delete the selected part (Delete)', onclick: () => vdDelete(), disabled: !vd.sel }, icon('trash', 15), h('span', {}, 'Delete')),
    h('button', { type: 'button', class: 'btn small ghost', title: 'Generate a continuation from the last frame', onclick: vdExtend, disabled: !vd.project?.segments.length }, icon('plus', 15), h('span', {}, 'Extend')),
    h('span', { class: 'vx-bar-fill' }),
    h('label', { class: 'vd-zoom' }, icon('search', 14), zoom),
  );
}

// ── Inspector (right) ───────────────────────────────────────────────────────

function vdRenderSide() {
  const side = $('#vdSide');
  if (!side || !vd.project) return;
  const segs = vd.project.segments;
  const i = segs.findIndex(s => s.id === vd.sel);
  const seg = segs[i];
  const { total } = vdStarts();
  const r = vd.regen;
  if (!seg) {
    side.replaceChildren(
      h('div', { class: 'nd-side-head' }, h('h2', {}, 'Edit')),
      h('div', { class: 'nd-side-body' },
        h('p', { class: 'vx-note' }, segs.length ? 'Click a part on the timeline to edit or regenerate it.' : 'Generate a clip on the left or click one of your clips to put it on the timeline.'),
        h('p', { class: 'vx-note' }, `${segs.length} parts · ${total.toFixed(1)} s`),
        h('p', { class: 'vx-note' }, 'Space plays · S splits at the playhead · Delete removes a part · drag a part to move it, its edges to trim it.')));
    return;
  }
  const item = vdItem(seg.itemId);
  const prev = segs[i - 1], next = segs[i + 1];
  const len = vdSegLen(seg);
  const num = (label, value, onSet) => vxField(label, value, onSet, { step: 0.05, min: 0, suffix: 's' });
  const instruction = h('textarea', { class: 'vx-prompt', rows: 3, placeholder: 'What should happen in this part instead? e.g. “she turns and smiles at the camera”' });
  instruction.value = r.instruction;
  instruction.addEventListener('input', () => { r.instruction = instruction.value; });
  const toggle = (key, label, enabled) => h('label', { class: `check vd-check${enabled ? '' : ' disabled'}` },
    (() => { const cb = h('input', { type: 'checkbox', checked: enabled && r[key], disabled: !enabled }); cb.addEventListener('change', () => { r[key] = cb.checked; }); return cb; })(),
    h('span', {}, label));
  const resolution = h('select', { class: 'fxe-select' }, ...['360p', '720p', '1080p', '4k'].map(v => h('option', { value: v, selected: v === r.resolution }, v)));
  resolution.addEventListener('change', () => { r.resolution = resolution.value; vdRenderSide(); });
  const rm = vdModel(r.model) || vdModel('') || {};
  const modelSel = h('select', { class: 'fxe-select', 'aria-label': 'Model for regenerating' },
    ...vd.models.map(x => h('option', { value: x.id, selected: x.id === rm.id }, `${x.label} · ${x.free ? 'free' : `≈ ${fmtPrice(x.pricePerSecond)} / s`}`)));
  modelSel.addEventListener('change', () => { r.model = modelSel.value; vdRenderSide(); });
  const busy = [...vd.jobs.values()].some(j => j.status === 'running' && j.segmentId === seg.id);
  const typing = document.activeElement?.matches?.('#vdSide textarea') ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  side.replaceChildren(
    h('div', { class: 'nd-side-head' }, h('h2', {}, `Part ${i + 1} of ${segs.length}`)),
    h('div', { class: 'nd-side-body' },
      h('p', { class: 'vd-seg-prompt' }, item?.userPrompt || seg.label || 'Clip'),
      h('div', { class: 'vx-grid2' },
        num('In', seg.in, v => { vdCheckpoint(); vdSetTrim(seg, v, seg.out); vdChanged({ frames: true }); }),
        num('Out', seg.out, v => { vdCheckpoint(); vdSetTrim(seg, seg.in, v); vdChanged({ frames: true }); })),
      h('p', { class: 'vx-note' }, `${len.toFixed(2)} s of a ${(vd.durations.get(seg.itemId) || 0).toFixed(1)} s clip`),
      h('section', { class: 'vd-regen' },
        h('h3', {}, 'Regenerate this part'),
        instruction,
        prev ? toggle('before', 'Continue from the end of the part before', true) : toggle('before', 'Keep how this part starts (its first frame)', true),
        next ? toggle('after', rm.lastFrame === false ? `Lead into the start of the part after (not with ${rm.label})` : 'Lead into the start of the part after', rm.lastFrame !== false) : null,
        toggle('keepLength', `Keep the length (${len.toFixed(1)} s)`, true),
        h('label', { class: 'vx-lbl' }, 'Model', modelSel),
        rm.free ? null : h('label', { class: 'vx-lbl' }, 'Resolution', resolution),
        rm.free && len > rm.maxSeconds + 0.05 ? h('p', { class: 'vx-note' }, `${rm.label} makes at most ${rm.maxSeconds} s – the new part will be shorter.`) : null,
        h('button', { type: 'button', class: 'btn primary vx-gen-btn', disabled: busy, onclick: () => vdRegenerate(seg) }, icon('refresh', 15), h('span', {}, busy ? 'Regenerating…' : 'Regenerate'), h('small', {}, videoPrice(Math.max(3, Math.min(10, Math.round(len))), r.resolution, rm.id))),
        h('p', { class: 'vx-note' }, 'Only this part is made again. It starts on the last frame before it and ends on the first frame after it, and the model is told what happens around it – so it blends into the rest.')),
      (seg.takes || []).length ? h('section', { class: 'vd-takes' },
        h('h3', {}, 'Takes'),
        ...seg.takes.slice().reverse().map((take, k) => h('div', { class: 'vd-take' },
          vdItem(take.itemId)?.thumb ? h('img', { src: thumbUrl(vdItem(take.itemId)), alt: '' }) : h('span', { class: 'vd-bin-ph' }, icon('film', 14)),
          h('span', {}, `Earlier take ${seg.takes.length - k} · ${(take.out - take.in).toFixed(1)} s`),
          h('button', { type: 'button', class: 'link-btn', onclick: () => vdUseTake(seg, take) }, 'Use')))) : null,
      h('div', { class: 'nd-row' },
        h('button', { type: 'button', class: 'btn small', onclick: () => item && openLightbox(item.id) }, icon('film', 14), 'Open clip'),
        h('button', { type: 'button', class: 'btn small', onclick: () => vdDelete(seg.id) }, icon('trash', 14), 'Delete part'))),
  );
  if (typing) { instruction.focus(); instruction.setSelectionRange(...typing); }
}

// ── Frames ──────────────────────────────────────────────────────────────────

async function vdGrabFrame(itemId, time) {
  const v = document.createElement('video');
  v.muted = true;
  v.preload = 'auto';
  v.src = `/media/${itemId}`;
  await vdWait(v, 'loadeddata');
  const d = Number.isFinite(v.duration) ? v.duration : vd.durations.get(itemId) || time + 1;
  v.currentTime = Math.max(0, Math.min(time, d - 0.04));
  await vdWait(v, 'seeked');
  const canvas = h('canvas', { width: v.videoWidth, height: v.videoHeight });
  canvas.getContext('2d').drawImage(v, 0, 0);
  v.removeAttribute('src');
  v.load();
  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Couldn’t capture the frame.');
  return blob;
}

async function vdFramePath(itemId, time) {
  const res = await uploadImage(await vdGrabFrame(itemId, time), 'frame.jpg');
  return res.path;
}

// Every part keeps its first and last frame on the server, so Claude can regenerate parts too.
function vdScheduleFrames() {
  clearTimeout(vd.frameTimer);
  vd.frameTimer = setTimeout(vdCaptureFrames, 1500);
}

async function vdCaptureFrames() {
  if (vd.capturing || !vd.project) return;
  vd.capturing = true;
  let changed = false;
  try {
    for (const s of vd.project.segments) {
      if (s.frames?.first && s.frames?.last) continue;
      const frames = {
        first: s.frames?.first || await vdFramePath(s.itemId, s.in + 0.02),
        last: s.frames?.last || await vdFramePath(s.itemId, Math.max(s.in, s.out - 0.04)),
      };
      if (vd.project.segments.includes(s)) { s.frames = frames; changed = true; }
    }
  } catch { /* try again after the next edit */ }
  vd.capturing = false;
  if (changed) { vdRenderTimeline(); await vdSave(); }
}

async function vdRegenerate(seg) {
  const r = vd.regen;
  if (!r.instruction.trim()) { toast('Say what should happen in this part.'); return; }
  const segs = vd.project.segments;
  const i = segs.findIndex(s => s.id === seg.id);
  if (i < 0) return;
  seg = segs[i];
  const prev = segs[i - 1], next = segs[i + 1];
  const model = vdModel(r.model) || vdModel('');
  if (!model?.free && !state.config?.hasKey) { openSettings('Gemini Omni Flash uses your Gemini API key – add it below, or pick a free model.'); return; }
  const after = r.after && model?.lastFrame !== false;
  try {
    // the frames right around the part: the last frame before it, the first frame after it
    const firstFrame = prev && r.before ? { path: await vdFramePath(prev.itemId, Math.max(prev.in, prev.out - 0.04)) }
      : !prev && r.before ? { path: await vdFramePath(seg.itemId, seg.in + 0.02) } : null;
    const lastFrame = next && after && firstFrame ? { path: await vdFramePath(next.itemId, next.in + 0.02) } : null;
    await vdSave();
    const res = await api('/api/video/projects/regenerate', {
      body: {
        project: vd.project.id, segment: seg.id, instruction: r.instruction.trim(), resolution: r.resolution, keepLength: r.keepLength,
        firstFrame, lastFrame: lastFrame || undefined, before: r.before, after, model: model?.id,
      },
    });
    vd.jobs.set(res.job.id, res.job);
    vdSchedulePoll();
    vdRenderTimeline();
    vdRenderSide();
    vdRenderJobs();
    toast('Regenerating this part – about 1–3 minutes.', 'success');
  } catch (err) {
    toastError(err, 'Couldn’t regenerate the part');
  }
}

// A continuation: a new clip that starts on the last frame of the timeline.
async function vdExtend() {
  const segs = vd.project.segments;
  const last = segs[segs.length - 1];
  if (!last) return;
  const what = vd.gen.prompt.trim();
  if (!what) { toast('Write what happens next in the prompt on the left, then click Extend.'); $('#vdGen textarea')?.focus(); return; }
  try {
    const firstFrame = { path: await vdFramePath(last.itemId, Math.max(last.in, last.out - 0.04)) };
    const before = vdItem(last.itemId)?.userPrompt || '';
    const job = await vdStartJob({
      model: vd.gen.model,
      prompt: `This clip continues an edited video seamlessly – same characters, setting, light, style and camera language.\nWhat happened just before: ${before.slice(0, 400)}\nWhat happens now: ${what}`,
      userPrompt: what, aspectRatio: vd.project.aspectRatio, resolution: vd.gen.resolution, duration: vd.gen.duration, sound: vd.gen.sound, firstFrame,
    });
    vd.appendJobs.add(job.id);
    vdRenderJobs();
    toast('Generating the continuation – it’s added to the end when it’s ready.', 'success');
  } catch (err) {
    toastError(err, 'Couldn’t extend the video');
  }
}

// ── Playback ────────────────────────────────────────────────────────────────

function vdEnsureAudio() {
  if (vd.audio) { vd.audio.ctx.resume?.(); return vd.audio; }
  try {
    const ctx = new AudioContext();
    const out = ctx.createGain();
    out.connect(ctx.destination);
    for (const p of vd.players) ctx.createMediaElementSource(p).connect(out);
    vd.audio = { ctx, out };
  } catch { vd.audio = null; }
  return vd.audio;
}

async function vdLoad(player, itemId) {
  if (player.dataset.item === itemId && player.readyState >= 1) return;
  player.dataset.item = itemId;
  player.src = `/media/${itemId}`;
  await vdWait(player, 'loadedmetadata');
}

function vdShowActive() {
  vd.players.forEach((p, k) => p.classList.toggle('on', k === vd.active));
}

async function vdSeek(t) {
  if (!vd.project) return;
  const wasPlaying = vd.playing;
  if (wasPlaying) vdPause();
  vd.t = Math.max(0, Math.min(t, vdStarts().total));
  vdRenderPlayhead();
  const loc = vdLocate(vd.t);
  if (!loc) { vd.players.forEach(p => { p.removeAttribute('src'); p.dataset.item = ''; p.load(); }); return; }
  vd.cur = loc.i;
  const p = vd.players[vd.active];
  try {
    await vdLoad(p, loc.seg.itemId);
    p.currentTime = loc.local;
    vdShowActive();
    vdPreloadNext();
  } catch (err) {
    toastError(err, 'Couldn’t load the clip');
  }
  if (wasPlaying) vdPlay();
}

async function vdPreloadNext() {
  const next = vd.project.segments[vd.cur + 1];
  if (!next) return;
  const sb = vd.players[1 - vd.active];
  try {
    await vdLoad(sb, next.itemId);
    sb.currentTime = next.in;
    sb.pause();
  } catch { /* loaded when it's needed */ }
}

async function vdPlay() {
  if (!vd.project?.segments.length) return;
  vdEnsureAudio();
  if (vd.t >= vdStarts().total - 0.05) await vdSeek(0);
  const loc = vdLocate(vd.t);
  const p = vd.players[vd.active];
  if (p.dataset.item !== loc.seg.itemId) await vdSeek(vd.t);
  vd.playing = true;
  try { await vd.players[vd.active].play(); } catch { /* autoplay blocked – keep going muted */ }
  cancelAnimationFrame(vd.raf);
  vd.raf = requestAnimationFrame(vdTick);
  vdRenderTransport();
}

function vdPause() {
  vd.playing = false;
  cancelAnimationFrame(vd.raf);
  vd.players.forEach(p => p.pause());
  if (vd.ready) vdRenderTransport();
}

function vdTick() {
  if (!vd.playing) return;
  const segs = vd.project.segments;
  const seg = segs[vd.cur];
  const p = vd.players[vd.active];
  if (!seg) { vdPause(); return; }
  const { starts, total } = vdStarts();
  vd.t = Math.min(total, starts[vd.cur] + Math.max(0, p.currentTime - seg.in));
  if (p.currentTime >= seg.out - 0.025 || p.ended) {
    if (vd.cur + 1 >= segs.length) {
      vdPause();
      vd.t = total;
      vdRenderPlayhead();
      vd.recording?.done();
      return;
    }
    const next = segs[vd.cur + 1];
    const sb = vd.players[1 - vd.active];
    if (sb.dataset.item === next.itemId && sb.readyState >= 2 && Math.abs(sb.currentTime - next.in) < 0.3) {
      sb.play().catch(() => {});
      p.pause();
      vd.active = 1 - vd.active;
      vd.cur++;
      vdShowActive();
      vdPreloadNext();
    } else {
      // the next part isn't ready yet: load it, then carry on
      vd.playing = false;
      vdSeek(starts[vd.cur + 1]).then(() => vdPlay());
      return;
    }
  }
  vdRenderPlayhead();
  vd.raf = requestAnimationFrame(vdTick);
}

// ── Export: the edit is played and recorded ────────────────────────────────

async function vdExport(toGallery) {
  if (!vd.project?.segments.length || vd.recording) return;
  const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  const type = types.find(t => window.MediaRecorder?.isTypeSupported(t));
  if (!type) { toast('This browser can’t record video – use Chrome or Edge.', 'error'); return; }
  const audio = vdEnsureAudio();
  const first = vd.players[vd.active];
  await vdSeek(0);
  const w = first.videoWidth || (vd.project.aspectRatio === '9:16' ? 720 : 1280);
  const hgt = first.videoHeight || (vd.project.aspectRatio === '9:16' ? 1280 : 720);
  const canvas = h('canvas', { width: w, height: hgt });
  const ctx = canvas.getContext('2d');
  const tracks = [...canvas.captureStream(VD_FPS).getVideoTracks()];
  let dest = null;
  if (audio) { dest = audio.ctx.createMediaStreamDestination(); audio.out.connect(dest); tracks.push(...dest.stream.getAudioTracks()); }
  const recorder = new MediaRecorder(new MediaStream(tracks), { mimeType: type, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => { recorder.onstop = r; });
  let drawing = true;
  const draw = () => {
    if (!drawing) return;
    const p = vd.players[vd.active];
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, hgt);
    if (p.videoWidth) {
      const s = Math.min(w / p.videoWidth, hgt / p.videoHeight);
      const dw = p.videoWidth * s, dh = p.videoHeight * s;
      ctx.drawImage(p, (w - dw) / 2, (hgt - dh) / 2, dw, dh);
    }
    requestAnimationFrame(draw);
  };
  const finished = new Promise(resolve => { vd.recording = { done: resolve }; });
  vdRenderBar();
  toast(`Recording the edit (${vdStarts().total.toFixed(1)} s, in real time)…`);
  draw();
  recorder.start(500);
  await vdPlay();
  await finished;
  await sleep(150);
  drawing = false;
  recorder.stop();
  await stopped;
  if (dest) audio.out.disconnect(dest);
  vd.recording = null;
  vdRenderBar();
  const blob = new Blob(chunks, { type: type.split(';')[0] });
  const ext = blob.type === 'video/mp4' ? 'mp4' : 'webm';
  const name = `${(norm(vd.project.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video').slice(0, 40)}.${ext}`;
  if (!toGallery) { vxDownloadBlob(blob, name); toast('Exported.', 'success'); return; }
  try {
    const res = await api('/api/video/save', {
      body: { data: await blobToBase64(blob), mimeType: blob.type, label: vd.project.name, duration: vdStarts().total, width: w, height: hgt, aspectRatio: vd.project.aspectRatio, projectId: vd.project.id, description: `Edited video “${vd.project.name}” (${vd.project.segments.length} parts)` },
    });
    state.items.unshift(...res.items);
    schedulePoll();
    vdRenderBin();
    toast('Saved to your gallery – it uploads to Google Drive.', 'success');
  } catch (err) {
    toastError(err, 'Couldn’t save the video');
  }
}

// ── Events ──────────────────────────────────────────────────────────────────

function vdBindEvents() {
  const timeline = $('#vdTimeline');
  // the sound device can take a second to wake up – start it on the first click, not when Play is pressed
  $('#videoView').addEventListener('pointerdown', () => vdEnsureAudio(), { once: true });
  timeline.addEventListener('pointerdown', vdTimelineDown);
  timeline.addEventListener('dragstart', e => {
    const seg = e.target.closest('.vd-seg');
    if (!seg) return;
    e.dataTransfer.setData('application/x-hombresai-seg', seg.dataset.seg);
    e.dataTransfer.effectAllowed = 'move';
  });
  timeline.addEventListener('dragover', e => {
    const types = [...e.dataTransfer.types];
    if (types.includes('application/x-hombresai-seg') || types.includes('application/x-mhf-item')) e.preventDefault();
  });
  timeline.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    const index = vdIndexAt(e.clientX);
    const segId = e.dataTransfer.getData('application/x-hombresai-seg');
    const itemId = e.dataTransfer.getData('application/x-mhf-item');
    if (segId) vdMove(segId, index);
    else if (itemId) { const item = vdItem(itemId); if (item && /^video\//.test(item.mimeType || '')) vdAddClip(item, index); }
  });
  $('#vdScreen').addEventListener('click', () => (vd.playing ? vdPause() : vdPlay()));
  document.addEventListener('keydown', vdKey);
}

function vdTimeAt(clientX) {
  const r = $('#vdTrack').getBoundingClientRect();
  return Math.max(0, Math.min(vdStarts().total, (clientX - r.left) / vd.zoom));
}

function vdIndexAt(clientX) {
  const t = vdTimeAt(clientX);
  const { starts } = vdStarts();
  const segs = vd.project.segments;
  let i = 0;
  while (i < segs.length && starts[i] + vdSegLen(segs[i]) / 2 < t) i++;
  return i;
}

function vdTimelineDown(e) {
  if (e.button !== 0) return;
  const handle = e.target.closest('[data-trim]');
  const segEl = e.target.closest('.vd-seg');
  if (handle && segEl) {
    // drag an edge to trim; the parts after it move along
    e.preventDefault();
    const seg = vd.project.segments.find(s => s.id === segEl.dataset.seg);
    const side = handle.dataset.trim;
    const x0 = e.clientX, in0 = seg.in, out0 = seg.out;
    vdCheckpoint();
    vd.drag = true;
    const move = ev => {
      const dt = (ev.clientX - x0) / vd.zoom;
      if (side === 'in') vdSetTrim(seg, in0 + dt, out0); else vdSetTrim(seg, in0, out0 + dt);
      vdRenderTimeline();
      vdRenderSide();
    };
    const up = () => { vd.drag = false; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); vdChanged({ frames: true }); vdSeek(vd.t); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return;
  }
  if (segEl) {
    vd.sel = segEl.dataset.seg;
    vdRenderTimeline();
    vdRenderSide();
    vdRenderTransport();
  }
  if (e.target.closest('.vd-seg') && e.detail === 1 && !e.shiftKey) {
    vdSeek(vdTimeAt(e.clientX));
    return;
  }
  // ruler or empty track: scrub
  vdSeek(vdTimeAt(e.clientX));
  const move = ev => { vd.t = vdTimeAt(ev.clientX); vdRenderPlayhead(); };
  const up = ev => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); vdSeek(vdTimeAt(ev.clientX)); };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function vdKey(e) {
  if (state.ui.view !== 'video' || !vd.ready || !vd.project) return;
  if (!$('#settingsModal').hidden || state.lightbox) return;
  if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (e.key === ' ') { e.preventDefault(); if (vd.playing) vdPause(); else vdPlay(); return; }
  if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) vdRedo(); else vdUndo(); return; }
  if (mod && k === 'y') { e.preventDefault(); vdRedo(); return; }
  if (!mod && k === 's') { e.preventDefault(); vdSplit(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); vdDelete(); return; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    const step = e.shiftKey ? 1 : 1 / VD_FPS;
    vdSeek(vd.t + (e.key === 'ArrowLeft' ? -step : step));
    return;
  }
  if (e.key === 'Home') vdSeek(0);
  if (e.key === 'End') vdSeek(vdStarts().total);
}

// A video file dropped on the editor joins the gallery (and Google Drive), then the timeline.
async function videoUploadFile(file) {
  if (file.size > 60 * 1024 * 1024) { toast('That video is too big – the maximum is 60 MB.', 'error'); return; }
  try {
    toast(`Adding “${file.name}”…`);
    const res = await api('/api/video/save', { body: { data: await blobToBase64(file), mimeType: file.type, label: file.name.replace(/\.[^.]+$/, '') } });
    state.items.unshift(...res.items);
    schedulePoll();
    vdRenderBin();
    await vdAddClip(res.items[0]);
  } catch (err) {
    toastError(err, 'Couldn’t add the video');
  }
}

// From the gallery: put a clip on the timeline of the open project.
function videoOpenItem(item) {
  setView('video');
  const add = () => vdAddClip(item);
  if (vd.project) add();
  else setTimeout(function wait() { if (vd.project) add(); else setTimeout(wait, 100); }, 100);
}
