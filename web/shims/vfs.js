// A small file system in the browser's IndexedDB for server.js: its data folder (config, history, graphs, pictures)
// lives here instead of on a disk. The app's own read-only files (the effects) are built in.
import { BUILTIN } from './builtin-files.js';

const DB_NAME = 'hombresai-web';
const MEMORY_LIMIT = 512 * 1024; // smaller files stay in memory too; pictures and videos are read when needed
const meta = new Map(); // path → { size, mtime }
const data = new Map(); // path → Uint8Array
const dirs = new Set(['/']);
let db = null;

const enc = new TextEncoder();
for (const [p, text] of Object.entries(BUILTIN)) {
  const bytes = enc.encode(text);
  meta.set(p, { size: bytes.length, mtime: 0, builtin: true });
  data.set(p, bytes);
}

export const norm = p => {
  const parts = [];
  for (const s of String(p).replace(/\\/g, '/').split('/')) {
    if (!s || s === '.') continue;
    if (s === '..') parts.pop(); else parts.push(s);
  }
  return `/${parts.join('/')}`;
};

export const fsError = (code, syscall, p) => Object.assign(new Error(`${code}: ${code === 'ENOENT' ? 'no such file or directory' : 'operation not permitted'}, ${syscall} '${p}'`), { code, syscall, path: p, errno: -2 });

const done = tx => new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
const result = r => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

export async function vfsInit(preload = []) {
  db = await new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('meta'); r.result.createObjectStore('data'); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const store = db.transaction('meta').objectStore('meta');
  const [keys, values] = await Promise.all([result(store.getAllKeys()), result(store.getAll())]);
  keys.forEach((k, i) => meta.set(k, values[i]));
  for (const p of preload.map(norm)) if (meta.has(p) && !data.has(p)) data.set(p, await load(p));
}

async function load(p) {
  const v = await result(db.transaction('data').objectStore('data').get(p));
  return v ? new Uint8Array(v) : null;
}

const isDir = p => p === '/' || dirs.has(p) || [...meta.keys()].some(k => k.startsWith(`${p}/`));
export const exists = p => { p = norm(p); return meta.has(p) || isDir(p); };

export function readSync(p) {
  p = norm(p);
  if (data.has(p)) return data.get(p);
  throw fsError('ENOENT', 'open', p);
}

export async function read(p) {
  p = norm(p);
  if (data.has(p)) return data.get(p);
  if (!meta.has(p)) throw fsError('ENOENT', 'open', p);
  const bytes = await load(p);
  if (!bytes) throw fsError('ENOENT', 'open', p);
  if (bytes.length <= MEMORY_LIMIT) data.set(p, bytes);
  return bytes;
}

export async function write(p, bytes) {
  p = norm(p);
  if (meta.get(p)?.builtin) throw fsError('EPERM', 'open', p);
  const m = { size: bytes.length, mtime: Date.now() };
  const tx = db.transaction(['meta', 'data'], 'readwrite');
  tx.objectStore('meta').put(m, p);
  tx.objectStore('data').put(bytes, p);
  await done(tx);
  meta.set(p, m);
  if (bytes.length <= MEMORY_LIMIT) data.set(p, bytes); else data.delete(p);
}

export async function remove(p) {
  p = norm(p);
  if (!meta.has(p)) throw fsError('ENOENT', 'unlink', p);
  const tx = db.transaction(['meta', 'data'], 'readwrite');
  tx.objectStore('meta').delete(p);
  tx.objectStore('data').delete(p);
  await done(tx);
  meta.delete(p);
  data.delete(p);
}

export async function rename(a, b) {
  a = norm(a); b = norm(b);
  if (!meta.has(a)) throw fsError('ENOENT', 'rename', a);
  const bytes = await read(a);
  await write(b, bytes);
  await remove(a);
}

export function mkdir(p) {
  let cur = norm(p);
  while (cur !== '/') { dirs.add(cur); cur = norm(`${cur}/..`); }
}

export function list(dir) {
  dir = norm(dir);
  if (!isDir(dir)) throw fsError('ENOENT', 'scandir', dir);
  const prefix = dir === '/' ? '/' : `${dir}/`;
  const out = new Map();
  for (const k of [...meta.keys(), ...dirs]) {
    if (!k.startsWith(prefix)) continue;
    const rest = k.slice(prefix.length);
    if (!rest) continue;
    const slash = rest.indexOf('/');
    const name = slash < 0 ? rest : rest.slice(0, slash);
    out.set(name, slash < 0 && meta.has(k) ? 'file' : 'dir');
  }
  return [...out].map(([name, kind]) => ({ name, kind }));
}

export function stat(p) {
  p = norm(p);
  const m = meta.get(p);
  if (m) return { size: m.size, mtimeMs: m.mtime, mtime: new Date(m.mtime), isFile: () => true, isDirectory: () => false };
  if (isDir(p)) return { size: 0, mtimeMs: 0, mtime: new Date(0), isFile: () => false, isDirectory: () => true };
  throw fsError('ENOENT', 'stat', p);
}
