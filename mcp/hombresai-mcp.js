#!/usr/bin/env node
// hombresai for Claude – an MCP server (stdio, JSON-RPC 2.0) that lets Claude use the whole app: generate images and
// videos, build and run node graphs (camera, lens, exposure, light…), browse the gallery and draw SVG vectors.
// It talks to the local hombresai server (http://127.0.0.1:4848) and starts it in the background when it isn't running.
//
// Claude Code:    claude mcp add hombresai -- node "<path>/mcp/hombresai-mcp.js"   (or the project's .mcp.json)
// Claude Desktop: "mcpServers": { "hombresai": { "command": "node", "args": ["<path>/mcp/hombresai-mcp.js"] } }

'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const NAME = 'hombresai';
const VERSION = '1.0.0';
const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const FIRST_PORT = Number(process.env.HOMBRESAI_PORT) || 4848;
const MAX_INLINE_IMAGE = 1.6 * 1024 * 1024;

let base = process.env.HOMBRESAI_URL || null;
let starting = null;

const log = (...args) => process.stderr.write(`[hombresai-mcp] ${args.join(' ')}\n`);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Talking to the app ──────────────────────────────────────────────────────

async function ping(url) {
  try {
    const r = await fetch(`${url}/api/ping`, { signal: AbortSignal.timeout(1500) });
    const j = await r.json();
    return ['hombresai', 'myhighsfield'].includes(j.app);
  } catch {
    return false;
  }
}

async function findServer() {
  if (base && await ping(base)) return base;
  for (let port = FIRST_PORT; port <= FIRST_PORT + 20; port++) {
    const url = `http://127.0.0.1:${port}`;
    if (await ping(url)) return (base = url);
  }
  return null;
}

// The app isn't running: start it in the background (without opening a browser) and wait for it.
async function ensureServer() {
  const found = await findServer();
  if (found) return found;
  if (!starting) {
    starting = (async () => {
      log('starting the hombresai server…');
      const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], { cwd: ROOT, detached: true, stdio: 'ignore', windowsHide: true });
      child.unref();
      for (let i = 0; i < 40; i++) {
        await sleep(500);
        const url = await findServer();
        if (url) return url;
      }
      throw new Error('The hombresai server didn’t start. Run start.bat (or `node server.js`) in the project folder.');
    })().finally(() => { starting = null; });
  }
  return starting;
}

async function call(method, route, body) {
  const url = await ensureServer();
  const res = await fetch(`${url}${route}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15 * 60 * 1000),
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) {
    const e = data?.error || {};
    throw new Error([e.message || `HTTP ${res.status}`, e.hint].filter(Boolean).join(' '));
  }
  return data;
}

const get = route => call('GET', route);
const post = (route, body = {}) => call('POST', route, body);

async function fetchBinary(route) {
  const url = await ensureServer();
  const res = await fetch(`${url}${route}`, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) return null;
  return { buffer: Buffer.from(await res.arrayBuffer()), mimeType: (res.headers.get('content-type') || '').split(';')[0] };
}

// ── Formatting ──────────────────────────────────────────────────────────────

// the same prices the app shows: CNB rate, with 21 % VAT unless the user switched it off in Settings
let fx = { usdCzk: 21.8 };
let vat = true;
const useConfig = config => {
  if (config.fx?.usdCzk) fx = config.fx;
  if (typeof config.settings?.vat === 'boolean') vat = config.settings.vat;
};
const czk = usd => (usd == null ? null : `${(usd * fx.usdCzk * (vat ? 1.21 : 1)).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CZK`);
const isVideo = i => /^video\//.test(i.mimeType || '');
const isSvg = i => i.mimeType === 'image/svg+xml';

function summarize(item) {
  return {
    id: item.id,
    kind: isVideo(item) ? 'video' : isSvg(item) ? 'vector' : 'image',
    created: item.createdAt,
    model: item.model,
    prompt: String(item.userPrompt || item.prompt || '').slice(0, 300),
    size: item.width ? `${item.width}×${item.height}` : undefined,
    duration_seconds: item.duration || undefined,
    aspect_ratio: item.aspectRatio,
    cost: item.via === 'huggingface' ? 'free (Hugging Face GPUs)' : item.cost != null ? czk(item.cost) : undefined,
    favorite: item.favorite || undefined,
    node_graph: item.nodes?.name,
    on_google_drive: Boolean(item.drive?.id),
    drive_link: item.drive?.link,
  };
}

// An image of a gallery item for Claude to look at: the small thumbnail if there is one, else the file if it's small.
async function imageContent(item) {
  if (isVideo(item)) {
    const thumb = item.thumb ? await fetchBinary(`/thumbs/${item.id}.jpg`) : null;
    return thumb ? { type: 'image', data: thumb.buffer.toString('base64'), mimeType: 'image/jpeg' } : null;
  }
  if (isSvg(item)) return null;
  const thumb = item.thumb ? await fetchBinary(`/thumbs/${item.id}.jpg`) : null;
  if (thumb?.buffer.length) return { type: 'image', data: thumb.buffer.toString('base64'), mimeType: 'image/jpeg' };
  if (item.bytes && item.bytes > MAX_INLINE_IMAGE) return null;
  const full = await fetchBinary(`/media/${item.id}`);
  if (!full || full.buffer.length > MAX_INLINE_IMAGE) return null;
  return { type: 'image', data: full.buffer.toString('base64'), mimeType: full.mimeType || item.mimeType };
}

const text = value => ({ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) });

// ── Tools ───────────────────────────────────────────────────────────────────

const TOOLS = [];
const tool = (name, description, properties, required, run) => TOOLS.push({ name, description, inputSchema: { type: 'object', properties, required, additionalProperties: false }, run });

tool('status', 'Shows the state of hombresai: which providers are connected (Gemini, Pollinations, Cloudflare backup, Google Drive), today’s spending in CZK and what the gallery holds. Call this first.', {}, [], async () => {
  const [config, history, video] = await Promise.all([get('/api/config'), get('/api/history'), get('/api/video/jobs').catch(() => null)]);
  useConfig(config);
  const today = new Date().toISOString().slice(0, 10);
  const items = history.items || [];
  const spentToday = items.filter(i => (i.day || i.createdAt?.slice(0, 10)) === today).reduce((s, i) => s + (i.cost || 0), 0);
  return [text({
    app: `${base} (open it in a browser to see the gallery)`,
    gemini_key: config.hasKey ? `connected (${config.keyHint})` : 'missing – needed for Nano Banana, Gemini Omni Flash video and the cheap text models',
    pollinations: config.pollinations?.hasKey ? 'key saved (free open-source models)' : 'no key',
    cloudflare_backup: config.cloudflare?.hasKey ? 'connected (free backup for the open-source models)' : 'not connected',
    google_drive: config.drive?.connected ? `connected as ${config.drive.email}` : 'not connected – files wait on this computer until it is',
    spent_today: czk(spentToday),
    gallery: { images: items.filter(i => !isVideo(i) && !isSvg(i)).length, videos: items.filter(isVideo).length, vectors: items.filter(isSvg).length },
    running_video_jobs: video ? (video.jobs || []).filter(j => j.status === 'running').length : undefined,
    prices_in: `CZK (Czech National Bank rate, ${vat ? 'incl. 21 % VAT' : 'VAT not included'})`,
  })];
});

tool('list_models', 'Lists the image models (with price per image in CZK, sizes, aspect ratios and whether they take reference images), the video models and the AI models that can draw SVG.', {}, [], async () => {
  const [models, config, effects] = await Promise.all([get('/api/models'), get('/api/config'), get('/api/effects').catch(() => ({}))]);
  useConfig(config);
  const video = await get('/api/video/models').catch(() => null);
  return [text({
    image_models: models.models.map(m => ({
      id: m.id,
      name: m.label,
      provider: m.provider === 'pollinations' ? 'open source (Pollinations / Cloudflare backup)' : 'Google Gemini',
      price_per_image: m.price?.image ? Object.fromEntries(Object.entries(m.price.image).map(([k, v]) => [k, czk(v)])) : m.free ? 'free tier' : 'unknown',
      sizes: m.sizes,
      aspect_ratios: m.ratios,
      reference_images: m.refs !== false,
      note: m.desc,
    })),
    video_models: video?.models || 'not available',
    svg_models: (effects.coder?.models || []).map(m => ({ id: m.id, name: m.label, note: m.note })),
  })];
});

tool('generate_images',
  'Generates images with an image model and saves them to the gallery (and Google Drive). Costs money with Gemini models (see list_models) – ask the user before generating many. Optionally applies a node graph (camera, lens, exposure, light…) and uses gallery images as references. Returns the new items and small previews.',
  {
    prompt: { type: 'string', description: 'What to show. Any language.' },
    model: { type: 'string', description: 'Model id from list_models. Default: gemini-nano-banana-2.1.' },
    aspect_ratio: { type: 'string', description: 'e.g. 1:1, 4:5, 3:2, 16:9, 9:16 (omit for automatic)' },
    image_size: { type: 'string', enum: ['512', '1K', '2K', '4K'], description: 'Gemini models only. Default 1K.' },
    count: { type: 'integer', minimum: 1, maximum: 4, description: 'How many images (default 1).' },
    node_graph: { type: 'string', description: 'Name or id of a node graph whose camera/lens/exposure/light… is added to the prompt (its own Prompt node is left out).' },
    reference_ids: { type: 'array', items: { type: 'string' }, description: 'Gallery item ids to use as reference images (max 14).' },
    reference_roles: { type: 'array', items: { type: 'string', enum: ['auto', 'character', 'object', 'style', 'scene', 'pose', 'edit'] }, description: 'Role of each reference, in the same order.' },
    show_images: { type: 'boolean', description: 'Return previews of the results (default true).' },
  }, ['prompt'], async a => {
    const model = a.model || 'gemini-nano-banana-2.1';
    let prompt = String(a.prompt);
    let nodes;
    if (a.node_graph) {
      // like Create: the graph's own Prompt node and video-only nodes are left out
      const c = await post('/api/nodes/compile', { name: a.node_graph, target: null, skip: ['prompt'], only: 'image' });
      prompt = [prompt, c.addition].filter(Boolean).join('\n\n');
      nodes = { graphId: c.graph.id, name: c.graph.name, chips: c.chips };
    }
    const refs = a.reference_ids?.length ? (await post('/api/refs/from-items', { ids: a.reference_ids, roles: a.reference_roles })).refs : [];
    const count = Math.min(4, Math.max(1, a.count || 1));
    const batchCreatedAt = new Date().toISOString();
    const batchId = `c${Date.now().toString(36)}`;
    const items = [];
    const errors = [];
    for (let i = 0; i < count; i++) {
      try {
        const r = await post('/api/generate', { model, prompt, userPrompt: a.prompt, aspectRatio: a.aspect_ratio || null, imageSize: a.image_size || '1K', refs, nodes, batchId, batchCreatedAt, index: i });
        items.push(...r.items);
      } catch (err) {
        errors.push(err.message);
      }
    }
    const content = [text({ generated: items.map(summarize), errors: errors.length ? errors : undefined })];
    if (a.show_images !== false) for (const item of items.slice(0, 4)) { const img = await imageContent(item); if (img) content.push(img); }
    return content;
  });

tool('list_gallery', 'Lists the newest items in the gallery (images, videos, vectors) with their ids, prompts, models, costs and Google Drive links.', {
  limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Default 20.' },
  query: { type: 'string', description: 'Only items whose prompt contains this text.' },
  kind: { type: 'string', enum: ['image', 'video', 'vector'], description: 'Only this kind.' },
  favorites_only: { type: 'boolean' },
}, [], async a => {
  const { items } = await get('/api/history');
  const q = String(a.query || '').toLowerCase();
  const list = items.map(summarize).filter(i => (!a.kind || i.kind === a.kind) && (!a.favorites_only || i.favorite) && (!q || i.prompt.toLowerCase().includes(q)));
  return [text({ total: list.length, items: list.slice(0, a.limit || 20) })];
});

tool('get_item', 'Shows one gallery item in detail – including the full prompt that was sent – and a preview image.', {
  id: { type: 'string' },
  show_image: { type: 'boolean', description: 'Default true.' },
}, ['id'], async a => {
  const { items } = await get('/api/history');
  const item = items.find(i => i.id === a.id);
  if (!item) throw new Error(`No item “${a.id}”.`);
  const content = [text({ ...summarize(item), full_prompt: item.prompt, references: item.refs, file_name: item.name, node_graph: item.nodes })];
  if (a.show_image !== false) { const img = await imageContent(item); if (img) content.push(img); }
  return content;
});

tool('set_favorite', 'Marks a gallery item as a favorite (or removes the mark).', { id: { type: 'string' }, favorite: { type: 'boolean' } }, ['id', 'favorite'], async a => {
  await call('PATCH', `/api/history/${encodeURIComponent(a.id)}`, { favorite: Boolean(a.favorite) });
  return [text(`${a.favorite ? 'Marked' : 'Unmarked'} ${a.id}.`)];
});

tool('delete_items', 'Deletes gallery items. Their files go to the Google Drive trash (restorable for 30 days). Always confirm with the user first.', {
  ids: { type: 'array', items: { type: 'string' }, minItems: 1 },
}, ['ids'], async a => {
  const r = await post('/api/history/delete', { ids: a.ids });
  return [text({ deleted: a.ids.length, ...r })];
});

tool('enhance_prompt', 'Rewrites a short idea (any language) into a detailed English image prompt with a cheap Gemini text model (≈ 0.01–0.02 CZK).', {
  idea: { type: 'string' },
}, ['idea'], async a => [text((await post('/api/enhance', { prompt: a.idea, refs: [] })).prompt)]);

// ── Nodes ──

tool('list_node_types', 'Lists every node type for node graphs (camera body, lens, exposure with ISO/aperture/shutter, focus, film stock, shot & angle, lighting, time & place, color grade, style, subject, camera movement, action, sound, avoid, Generate image/video…) with their fields, allowed values, inputs and outputs. Read this before building a graph.', {}, [], async () => [text(await get('/api/nodes/types'))]);

tool('list_node_graphs', 'Lists the saved node graphs with their settings in short.', {}, [], async () => {
  const { graphs } = await get('/api/nodes');
  const out = [];
  for (const g of graphs) {
    const c = await post('/api/nodes/compile', { graph: g }).catch(() => null);
    out.push({ id: g.id, name: g.name, kind: g.kind, nodes: g.nodes.length, settings: c?.chips, updated: g.updatedAt });
  }
  return [text(out)];
});

tool('get_node_graph', 'Returns a node graph as JSON (nodes with their values and positions, edges between ports) plus the prompt it compiles to.', {
  graph: { type: 'string', description: 'Name or id.' },
}, ['graph'], async a => {
  const c = await post('/api/nodes/compile', { name: a.graph });
  const g = (await get('/api/nodes')).graphs.find(x => x.id === c.graph.id);
  return [text({ graph: g, compiled: { prompt: c.prompt, chips: c.chips, warnings: c.warnings } })];
});

tool('save_node_graph',
  'Creates or updates a node graph. Pass the whole graph: { id?, name, kind: "image"|"video", nodes: [{ id, type, x, y, values }], edges: [{ from: { node, port }, to: { node, port } }], formats?: { prose, xml, json, markdown } }. Shot nodes connect "out" → "in" of the next node and the last one → "spec" of the Generate node; reference nodes connect "image" → "refs" / "first" / "last". Unknown values fall back to defaults. Returns the saved graph and its compiled prompt. The graph appears in the app’s Nodes view.',
  { graph: { type: 'object', description: 'The graph JSON.' } }, ['graph'], async a => {
    const { graph } = await post('/api/nodes', { graph: a.graph });
    const c = await post('/api/nodes/compile', { graph });
    return [text({ saved: { id: graph.id, name: graph.name, nodes: graph.nodes.length, edges: graph.edges.length }, compiled: { prompt: c.prompt, chips: c.chips, warnings: c.warnings } })];
  });

tool('list_node_templates', 'Lists the node graph templates: the built-in ones and the user’s own (saved in the app with their reference images).', {}, [], async () => {
  const own = await get('/api/nodes/templates').catch(() => ({ templates: [] }));
  return [text({
    built_in: ['portrait85', 'street35', 'product100', 'landscape16', 'cine_anamorphic (video)', 'image_to_video (video)'],
    yours: (own.templates || []).map(t => ({ name: t.name, kind: t.kind, nodes: t.graph.nodes.map(n => n.type), images: t.graph.nodes.filter(n => n.values?.image).length })),
  })];
});

tool('create_node_graph_from_template', 'Creates a new node graph from a template: a built-in one (portrait85, street35, product100, landscape16, cine_anamorphic, image_to_video) or one of the user’s own templates by its name (see list_node_templates) – those keep their reference images.', {
  template: { type: 'string', description: 'A built-in template id or the name of the user’s own template.' },
  name: { type: 'string' },
}, ['template'], async a => {
  const { graph } = await post('/api/nodes/template', { template: a.template, name: a.name });
  return [text({ id: graph.id, name: graph.name, kind: graph.kind, nodes: graph.nodes.map(n => ({ id: n.id, type: n.type, values: n.values })) })];
});

tool('compile_node_graph', 'Compiles a node graph into the final prompt: a description in prose plus the same specification as XML, JSON and Markdown (the formats can be switched). Shows the optical consequences (depth of field, motion blur, noise, light level) and warnings about conflicting settings. Costs nothing.', {
  graph: { type: 'string', description: 'Name or id of a saved graph.' },
  prompt: { type: 'string', description: 'Extra text put in front of the graph’s prompt.' },
  formats: { type: 'object', properties: { prose: { type: 'boolean' }, xml: { type: 'boolean' }, json: { type: 'boolean' }, markdown: { type: 'boolean' } } },
}, ['graph'], async a => {
  const c = await post('/api/nodes/compile', { name: a.graph, prompt: a.prompt || '', formats: a.formats });
  return [text({ prompt: c.prompt, prose: c.parts.prose, xml: c.parts.xml, json: c.parts.json, markdown: c.parts.markdown, chips: c.chips, warnings: c.warnings })];
});

tool('run_node_graph', 'Runs a node graph’s Generate node: generates images (or starts a video) exactly as the graph describes and saves them to the gallery. Costs money with Gemini models – confirm with the user.', {
  graph: { type: 'string', description: 'Name or id.' },
  prompt: { type: 'string', description: 'Extra text put in front of the graph’s prompt.' },
  count: { type: 'integer', minimum: 1, maximum: 4 },
  show_images: { type: 'boolean' },
}, ['graph'], async a => {
  const r = await post('/api/nodes/run', { name: a.graph, prompt: a.prompt || '', count: a.count });
  if (r.job) return [text({ video_job: r.job, note: 'Video generation runs in the background – check it with get_video_job.' })];
  const content = [text({ generated: r.items.map(summarize), settings: r.chips, warnings: r.warnings })];
  if (a.show_images !== false) for (const item of r.items.slice(0, 4)) { const img = await imageContent(item); if (img) content.push(img); }
  return content;
});

// ── Vectors ──

tool('draw_svg', 'An AI draws a vector illustration as SVG (free open-source models with a Pollinations key or the Cloudflare backup, or Gemini 3.1 Flash Lite for ≈ 0.03 CZK). Optionally saves it to the gallery.', {
  prompt: { type: 'string' },
  model: { type: 'string', description: 'deepseek/deepseek-v4-flash, z-ai/glm-5.3-flash, openai/gpt-oss-20b or gemini-3.1-flash-lite.' },
  save_to_gallery: { type: 'boolean' },
}, ['prompt'], async a => {
  const r = await post('/api/vectors/ai', { prompt: a.prompt, model: a.model });
  const content = [text(r.svg)];
  if (a.save_to_gallery) {
    const vb = r.svg.match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/);
    const saved = await post('/api/vectors/export', { svg: r.svg, label: a.prompt.slice(0, 80), width: vb ? Number(vb[1]) : 1000, height: vb ? Number(vb[2]) : 1000 }).catch(err => ({ error: err.message }));
    content.push(text(saved.error ? `Not saved: ${saved.error}` : `Saved to the gallery as ${saved.items[0].id}.`));
  }
  return content;
});

// ── Video ──

tool('generate_video', 'Generates a video clip. Models: gemini-omni-1.1-flash (best, with sound, ≈ 2.6 CZK per second at 720p incl. VAT, 3–10 s – confirm the cost with the user first) or free open models on Hugging Face’s shared GPUs with a small daily allowance: wan-2.2 (best free quality, silent, up to 5 s, first and last frames), ltx-2.3 (with sound, up to 10 s), ltx-video (fast, silent, up to 8 s). Wan and LTX-2.3 animate a first frame – without one the app draws it from the prompt. Optional first and last frames (gallery image ids) anchor the start and end; a node graph can add camera, lens, movement and sound. Runs in the background: returns a job id for get_video_job.', {
  prompt: { type: 'string' },
  model: { type: 'string', enum: ['gemini-omni-1.1-flash', 'wan-2.2', 'ltx-2.3', 'ltx-video'], description: 'Default: Gemini Omni Flash when a Gemini key is set, otherwise wan-2.2.' },
  aspect_ratio: { type: 'string', enum: ['16:9', '9:16'] },
  resolution: { type: 'string', enum: ['360p', '720p', '1080p', '4k'], description: 'Gemini Omni Flash only.' },
  duration_seconds: { type: 'number', minimum: 1, maximum: 10 },
  first_frame_id: { type: 'string', description: 'Gallery image id for the first frame.' },
  last_frame_id: { type: 'string', description: 'Gallery image id for the last frame.' },
  node_graph: { type: 'string', description: 'Name or id of a video node graph to apply.' },
  sound: { type: 'boolean', description: 'Default true.' },
}, ['prompt'], async a => {
  const r = await post('/api/video/generate', {
    model: a.model, prompt: a.prompt, userPrompt: a.prompt, aspectRatio: a.aspect_ratio, resolution: a.resolution, duration: a.duration_seconds,
    firstFrameId: a.first_frame_id, lastFrameId: a.last_frame_id, graph: a.node_graph, sound: a.sound,
  });
  return [text({ job: r.job, note: 'Generating takes about 1–3 minutes. Poll get_video_job with this id.' })];
});

tool('get_video_job', 'Checks a video job. When it’s done, returns the new gallery item (with a preview frame if the app has made one).', {
  id: { type: 'string' },
  wait_seconds: { type: 'integer', minimum: 0, maximum: 120, description: 'Wait up to this long for it to finish (default 0).' },
}, ['id'], async a => {
  const until = Date.now() + (a.wait_seconds || 0) * 1000;
  let r;
  for (;;) {
    r = await get(`/api/video/jobs/${encodeURIComponent(a.id)}`);
    if (r.job.status !== 'running' || Date.now() >= until) break;
    await sleep(4000);
  }
  const content = [text({ ...r.job, item: r.job.item ? summarize(r.job.item) : undefined })];
  if (r.job.item) { const img = await imageContent(r.job.item); if (img) content.push(img); }
  return content;
});

tool('list_video_projects', 'Lists the video editing projects (timelines) with their segments.', {}, [], async () => [text(await get('/api/video/projects'))]);

tool('edit_video_project',
  'Edits a video project’s timeline. Operations: create { name, aspect_ratio }; add_clip { project, item_id, at? }; split { project, segment, at_seconds } (time inside that segment); delete_segment { project, segment }; trim { project, segment, in_seconds, out_seconds }; move { project, segment, to_index }. Returns the project.',
  {
    op: { type: 'string', enum: ['create', 'add_clip', 'split', 'delete_segment', 'trim', 'move'] },
    project: { type: 'string', description: 'Project id (not for create).' },
    name: { type: 'string' },
    aspect_ratio: { type: 'string', enum: ['16:9', '9:16'] },
    item_id: { type: 'string' },
    at: { type: 'integer', description: 'Position in the timeline (index). Default: the end.' },
    segment: { type: 'string', description: 'Segment id.' },
    at_seconds: { type: 'number' },
    in_seconds: { type: 'number' },
    out_seconds: { type: 'number' },
    to_index: { type: 'integer' },
  }, ['op'], async a => [text(await post('/api/video/projects/edit', a))]);

tool('regenerate_segment',
  'Regenerates one segment of a video project while keeping the rest: the new part starts on the last frame before it and ends on the first frame after it, so it blends in (the app stores those frames when the project is edited in the Video view). Costs like generate_video – confirm first. Returns a job id; when it finishes the segment is replaced (the old take stays available).',
  {
    project: { type: 'string' },
    segment: { type: 'string' },
    instruction: { type: 'string', description: 'What should happen in this part instead.' },
    model: { type: 'string', enum: ['gemini-omni-1.1-flash', 'wan-2.2', 'ltx-2.3', 'ltx-video'], description: 'wan-2.2 is free and also moves from the frame before to the frame after (up to 5 s).' },
    resolution: { type: 'string', enum: ['360p', '720p', '1080p', '4k'] },
  }, ['project', 'segment', 'instruction'], async a => [text(await post('/api/video/projects/regenerate', a))]);

// ── JSON-RPC over stdio ─────────────────────────────────────────────────────

const INSTRUCTIONS = `hombresai is the user's local AI image and video studio (Gemini Nano Banana images, free open-source FLUX/Z-Image models, Gemini Omni Flash video, node graphs, SVG vectors). Everything you create lands in the user's gallery and is uploaded to their Google Drive.
- Start with \`status\`. Prices are in CZK incl. VAT; Gemini image models cost about 1–4 CZK per image and Gemini video about 2.6 CZK per second – ask before generating more than a few images or any paid video. The free video models (wan-2.2, ltx-2.3, ltx-video) cost nothing but share a small daily GPU allowance on Hugging Face.
- For precise photographic control use node graphs: \`list_node_types\`, then \`save_node_graph\` (or a template) and \`compile_node_graph\` to check the prompt (prose + XML + JSON + Markdown) for free before \`run_node_graph\`.
- Write prompts in English for best results; the user may speak Czech.`;

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

async function handle(msg) {
  const { id, method, params } = msg;
  const reply = result => { if (id !== undefined) send({ jsonrpc: '2.0', id, result }); };
  const fail = (code, message) => { if (id !== undefined) send({ jsonrpc: '2.0', id, error: { code, message } }); };
  switch (method) {
    case 'initialize': {
      const asked = params?.protocolVersion;
      return reply({
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: NAME, title: 'hombresai', version: VERSION },
        instructions: INSTRUCTIONS,
      });
    }
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return undefined;
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
    case 'tools/call': {
      const t = TOOLS.find(x => x.name === params?.name);
      if (!t) return fail(-32602, `Unknown tool: ${params?.name}`);
      try {
        const content = await t.run(params.arguments || {});
        return reply({ content, isError: false });
      } catch (err) {
        return reply({ content: [text(`Error: ${err.message}`)], isError: true });
      }
    }
    default:
      if (method?.startsWith('notifications/')) return undefined;
      return fail(-32601, `Method not found: ${method}`);
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
    handle(msg).catch(err => log('error:', err.message));
  }
});
process.stdin.on('end', () => process.exit(0));
log(`ready (${TOOLS.length} tools)`);
