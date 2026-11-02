// Image Trace – turns a bitmap into vector shapes: colours are reduced with k-means, specks are merged away,
// every colour region is outlined along the pixel edges, and the outline is simplified and smoothed into curves.
// Layers are stacked (each colour also covers the colours drawn on top of it), so there are no seams between them.

const VT_DEFAULTS = { colors: 6, detail: 1.2, smooth: 0.7, speckle: 12, removeBg: true, maxSide: 640 };

const vtYield = () => new Promise(r => setTimeout(r, 0));
const vtHex = c => `#${c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

async function vtTrace(img, options = {}, onProgress = () => {}) {
  const o = { ...VT_DEFAULTS, ...options };
  const srcW = img.naturalWidth || img.videoWidth || img.width;
  const srcH = img.naturalHeight || img.videoHeight || img.height;
  const k = Math.min(1, o.maxSide / Math.max(srcW, srcH));
  const W = Math.max(8, Math.round(srcW * k));
  const H = Math.max(8, Math.round(srcH * k));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data;
  const N = W * H;

  onProgress('Reducing colours…', 0.05);
  await vtYield();
  const palette = vtPalette(px, N, Math.max(2, Math.min(24, o.colors | 0)));
  const labels = new Int16Array(N);
  for (let i = 0; i < N; i++) {
    if (px[i * 4 + 3] < 128) { labels[i] = -1; continue; }
    labels[i] = vtNearest(palette, px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
  }

  onProgress('Cleaning up…', 0.2);
  await vtYield();
  vtMajority(labels, W, H);
  vtDespeckle(labels, W, H, Math.max(1, Math.round(o.speckle * k * k)));

  // the background is the colour that dominates the image edge (if it clearly does)
  const area = new Float64Array(palette.length);
  for (let i = 0; i < N; i++) if (labels[i] >= 0) area[labels[i]]++;
  let bg = -1;
  if (o.removeBg) {
    const edge = new Float64Array(palette.length);
    let total = 0;
    const count = i => { if (labels[i] >= 0) { edge[labels[i]]++; total++; } };
    for (let x = 0; x < W; x++) { count(x); count((H - 1) * W + x); }
    for (let y = 1; y < H - 1; y++) { count(y * W); count(y * W + W - 1); }
    const top = edge.indexOf(Math.max(...edge));
    if (total && edge[top] / total > 0.5) bg = top;
  }

  const order = [...palette.keys()].filter(i => i !== bg && area[i] > 0).sort((a, b) => area[b] - area[a]);
  const scale = srcW / W;
  const layers = [];
  const member = new Uint8Array(palette.length);
  for (let li = 0; li < order.length; li++) {
    onProgress(`Tracing colour ${li + 1} of ${order.length}…`, 0.3 + 0.7 * (li / order.length));
    await vtYield();
    member.fill(0);
    for (let j = li; j < order.length; j++) member[order[j]] = 1;
    const mask = new Uint8Array(N);
    for (let i = 0; i < N; i++) if (labels[i] >= 0 && member[labels[i]]) mask[i] = 1;
    const regions = vtRegions(vtLoops(mask, W, H), o, scale, Math.max(2, o.speckle * k * k));
    if (regions.length) layers.push({ color: vtHex(palette[order[li]]), regions });
  }
  onProgress('Done', 1);
  return { width: srcW, height: srcH, layers, background: bg >= 0 ? vtHex(palette[bg]) : null };
}

// k-means++ on a sample of the opaque pixels
function vtPalette(px, N, k) {
  const step = Math.max(1, Math.floor(N / 24000));
  const pts = [];
  for (let i = 0; i < N; i += step) if (px[i * 4 + 3] >= 128) pts.push([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]);
  if (!pts.length) return [[0, 0, 0]];
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const centers = [pts[Math.floor(pts.length / 2)].slice()];
  const dist = new Float64Array(pts.length).fill(Infinity);
  while (centers.length < k) {
    let sum = 0;
    const c = centers[centers.length - 1];
    for (let i = 0; i < pts.length; i++) { dist[i] = Math.min(dist[i], d2(pts[i], c)); sum += dist[i]; }
    if (!sum) break;
    let r = Math.random() * sum, i = 0;
    while (i < pts.length - 1 && (r -= dist[i]) > 0) i++;
    centers.push(pts[i].slice());
  }
  const assign = new Int16Array(pts.length);
  for (let iter = 0; iter < 14; iter++) {
    for (let i = 0; i < pts.length; i++) assign[i] = vtNearest(centers, pts[i][0], pts[i][1], pts[i][2]);
    const acc = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < pts.length; i++) { const a = acc[assign[i]]; a[0] += pts[i][0]; a[1] += pts[i][1]; a[2] += pts[i][2]; a[3]++; }
    acc.forEach((a, j) => { if (a[3]) centers[j] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
  }
  return centers;
}

function vtNearest(pal, r, g, b) {
  let best = 0, bd = Infinity;
  for (let j = 0; j < pal.length; j++) {
    const d = (pal[j][0] - r) ** 2 + (pal[j][1] - g) ** 2 + (pal[j][2] - b) ** 2;
    if (d < bd) { bd = d; best = j; }
  }
  return best;
}

// lone pixels take the colour most of their 3×3 neighbours have
function vtMajority(labels, W, H) {
  const copy = labels.slice();
  const counts = new Map();
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x, own = copy[i];
    let same = 0;
    counts.clear();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const l = copy[i + dy * W + dx];
      if (l === own) same++;
      counts.set(l, (counts.get(l) || 0) + 1);
    }
    if (same >= 3) continue;
    let best = own, bc = 0;
    for (const [l, c] of counts) if (c > bc) { bc = c; best = l; }
    labels[i] = best;
  }
}

// connected regions smaller than `min` pixels are merged into the neighbour they touch most
function vtDespeckle(labels, W, H, min) {
  const N = W * H;
  const comp = new Int32Array(N).fill(-1);
  const queue = new Int32Array(N);
  const touch = new Map();
  for (let s = 0; s < N; s++) {
    if (comp[s] !== -1 || labels[s] < 0) continue;
    const l = labels[s];
    let head = 0, tail = 0;
    queue[tail++] = s;
    comp[s] = s;
    touch.clear();
    while (head < tail) {
      const i = queue[head++], x = i % W;
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1];
      for (const j of nb) {
        if (j < 0) continue;
        if (labels[j] === l) {
          if (comp[j] === -1) { comp[j] = s; queue[tail++] = j; }
        } else if (labels[j] >= 0) touch.set(labels[j], (touch.get(labels[j]) || 0) + 1);
      }
    }
    if (tail >= min || !touch.size) continue;
    let best = l, bc = 0;
    for (const [nl, c] of touch) if (c > bc) { bc = c; best = nl; }
    for (let q = 0; q < tail; q++) labels[queue[q]] = best;
  }
}

// Outline loops of a binary mask, walking along pixel edges (clockwise outside, counter-clockwise around holes).
// Each loop is a list of corner points; at diagonal touches the walk turns right, keeping the pixels apart.
const VT_DX = [1, 0, -1, 0];
const VT_DY = [0, 1, 0, -1];
function vtLoops(mask, W, H) {
  const VW = W + 1;
  const out1 = new Int8Array(VW * (H + 1));
  const out2 = new Int8Array(VW * (H + 1));
  const add = (x, y, d) => { const v = y * VW + x; if (!out1[v]) out1[v] = d + 1; else out2[v] = d + 1; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue;
    if (y === 0 || !mask[(y - 1) * W + x]) add(x, y, 0);
    if (x === W - 1 || !mask[y * W + x + 1]) add(x + 1, y, 1);
    if (y === H - 1 || !mask[(y + 1) * W + x]) add(x + 1, y + 1, 2);
    if (x === 0 || !mask[y * W + x - 1]) add(x, y + 1, 3);
  }
  const take = (v, prefer) => {
    let d;
    if (out2[v] && out1[v] - 1 !== prefer && out2[v] - 1 === prefer) { d = out2[v] - 1; out2[v] = 0; return d; }
    if (out1[v]) { d = out1[v] - 1; out1[v] = out2[v]; out2[v] = 0; return d; }
    return -1;
  };
  const loops = [];
  for (let start = 0; start < out1.length; start++) {
    while (out1[start]) {
      const pts = [];
      let v = start, dir = -1, x = start % VW, y = (start / VW) | 0;
      for (let guard = 0; guard < 4 * VW * (H + 1); guard++) {
        const d = take(v, dir < 0 ? -1 : (dir + 1) % 4);
        if (d < 0) break;
        if (d !== dir) pts.push([x, y]);
        dir = d;
        x += VT_DX[d];
        y += VT_DY[d];
        v = y * VW + x;
        if (v === start) break;
      }
      if (pts.length >= 3) loops.push(pts);
    }
  }
  return loops;
}

function vtArea(p) {
  let a = 0;
  for (let i = 0, n = p.length; i < n; i++) { const q = p[(i + 1) % n]; a += p[i][0] * q[1] - q[0] * p[i][1]; }
  return a / 2;
}

// point-in-polygon for grid polygons: the point always has a half coordinate, the ray runs along that axis
function vtInside(poly, px, py) {
  let inside = false;
  const alongX = py % 1 !== 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (alongX) {
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    } else if ((xi > px) !== (xj > px) && py < (yj - yi) * (px - xi) / (xj - xi) + yi) inside = !inside;
  }
  return inside;
}

// loops → regions (an outline plus the holes inside it) → smoothed path data
function vtRegions(loops, o, scale, minArea) {
  const outers = [], holes = [];
  for (const loop of loops) {
    const a = vtArea(loop);
    if (Math.abs(a) < minArea) continue;
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of loop) { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); }
    const item = { loop, area: Math.abs(a), box, holes: [] };
    (a > 0 ? outers : holes).push(item);
  }
  for (const h of holes) {
    // the middle of the hole's first pixel edge – never on another outline
    const [p, q] = h.loop;
    const mx = p[0] + Math.sign(q[0] - p[0]) / 2, my = p[1] + Math.sign(q[1] - p[1]) / 2;
    let best = null;
    for (const out of outers) {
      if (mx < out.box[0] || mx > out.box[2] || my < out.box[1] || my > out.box[3]) continue;
      if ((!best || out.area < best.area) && vtInside(out.loop, mx, my)) best = out;
    }
    if (best) best.holes.push(h);
  }
  outers.sort((a, b) => b.area - a.area);
  return outers.map(out => [out, ...out.holes].map(l => vtCurve(vtSimplify(vtMidpoints(l.loop), o.detail), o.smooth, scale)).join(' '));
}

// cut the staircase corners: midpoints of the first and last unit edge of every straight run
function vtMidpoints(corners) {
  const n = corners.length, pts = [];
  for (let i = 0; i < n; i++) {
    const a = corners[i], b = corners[(i + 1) % n];
    const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    const ux = Math.sign(b[0] - a[0]) / 2, uy = Math.sign(b[1] - a[1]) / 2;
    pts.push([a[0] + ux, a[1] + uy]);
    if (len > 1) pts.push([b[0] - ux, b[1] - uy]);
  }
  return pts;
}

// Ramer–Douglas–Peucker on a closed polygon
function vtSimplify(pts, eps) {
  if (pts.length < 5 || eps <= 0) return pts;
  let far = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2;
    if (d > fd) { fd = d; far = i; }
  }
  const run = (a, b, out) => {
    const [x1, y1] = pts[a], [x2, y2] = pts[b % pts.length];
    const len = Math.hypot(x2 - x1, y2 - y1) || 1e-9;
    let idx = -1, md = eps;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i % pts.length];
      const d = Math.abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1)) / len;
      if (d > md) { md = d; idx = i; }
    }
    if (idx < 0) { out.push(pts[a]); return; }
    run(a, idx, out);
    run(idx, b, out);
  };
  const out = [];
  run(0, far, out);
  run(far, pts.length, out);
  return out.length >= 3 ? out : pts;
}

function vtTurn(a, p, b) {
  const v1 = [p[0] - a[0], p[1] - a[1]], v2 = [b[0] - p[0], b[1] - p[1]];
  return Math.atan2(v1[0] * v2[1] - v1[1] * v2[0], v1[0] * v2[0] + v1[1] * v2[1]);
}

// Cutting the pixel staircase turns a sharp corner into two half-turns with a tiny segment between them.
// Such a pair becomes one corner again, at the point where the neighbouring edges meet.
function vtRestoreCorners(pts, limit) {
  let out = pts.slice();
  for (let pass = 0; pass < 2 && out.length > 4; pass++) {
    const n = out.length, keep = [];
    let skip = -1;
    for (let i = 0; i < n; i++) {
      if (i === skip) continue;
      const a = out[(i - 1 + n) % n], p = out[i], q = out[(i + 1) % n], b = out[(i + 2) % n];
      const t1 = vtTurn(a, p, q), t2 = vtTurn(p, q, b);
      if (i !== n - 1 && Math.hypot(q[0] - p[0], q[1] - p[1]) < 2.2 && Math.sign(t1) === Math.sign(t2) && Math.abs(t1 + t2) > limit) {
        const d1 = [p[0] - a[0], p[1] - a[1]], d2 = [b[0] - q[0], b[1] - q[1]];
        const den = d1[0] * d2[1] - d1[1] * d2[0];
        if (Math.abs(den) > 1e-9) {
          const t = ((q[0] - a[0]) * d2[1] - (q[1] - a[1]) * d2[0]) / den;
          const x = a[0] + d1[0] * t, y = a[1] + d1[1] * t;
          if (Math.hypot(x - p[0], y - p[1]) < 2.5 && Math.hypot(x - q[0], y - q[1]) < 2.5) { keep.push([x, y]); skip = i + 1; continue; }
        }
      }
      keep.push(p);
    }
    if (keep.length === out.length) break;
    out = keep;
  }
  return out;
}

// smooth points become Catmull-Rom curves, sharp turns stay corners
function vtCurve(pts, smooth, scale) {
  const limit = Math.PI * (0.18 + 0.3 * smooth); // turns sharper than this stay corners
  pts = vtRestoreCorners(pts, limit);
  const n = pts.length;
  const f = v => +(v * scale).toFixed(1);
  if (n < 3) return '';
  const tangent = pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    return Math.abs(vtTurn(a, p, b)) > limit || smooth <= 0 ? null : [(b[0] - a[0]) / 6 * smooth * 1.4, (b[1] - a[1]) / 6 * smooth * 1.4];
  });
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n], t1 = tangent[i], t2 = tangent[(i + 1) % n];
    if (!t1 && !t2) { d += `L${f(q[0])} ${f(q[1])}`; continue; }
    const seg = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const clamp = t => { if (!t) return [0, 0]; const l = Math.hypot(t[0], t[1]); const m = Math.min(1, seg * 0.45 / (l || 1)); return [t[0] * m, t[1] * m]; };
    const a = clamp(t1), b = clamp(t2);
    d += `C${f(p[0] + a[0])} ${f(p[1] + a[1])} ${f(q[0] - b[0])} ${f(q[1] - b[1])} ${f(q[0])} ${f(q[1])}`;
  }
  return `${d}Z`;
}
