// node:fs/promises on top of the browser file system (vfs.js).
import * as vfs from './vfs.js';

const toBytes = (d, encoding) => (typeof d === 'string' ? Buffer.from(d, encoding || 'utf8') : d instanceof Uint8Array ? d : Buffer.from(d));
const encodingOf = o => (typeof o === 'string' ? o : o?.encoding);

export async function readFile(p, options) {
  const bytes = Buffer.from(await vfs.read(p));
  const enc = encodingOf(options);
  return enc ? bytes.toString(enc) : bytes;
}
export async function writeFile(p, d, options) { await vfs.write(p, toBytes(d, encodingOf(options))); }
export async function appendFile(p, d, options) {
  const old = vfs.exists(p) ? Buffer.from(await vfs.read(p)) : Buffer.alloc(0);
  await vfs.write(p, Buffer.concat([old, toBytes(d, encodingOf(options))]));
}
export async function mkdir(p) { vfs.mkdir(p); }
export async function unlink(p) { await vfs.remove(p); }
export async function rm(p, options) { try { await vfs.remove(p); } catch (err) { if (!options?.force) throw err; } }
export async function rename(a, b) { await vfs.rename(a, b); }
export async function copyFile(a, b) { await vfs.write(b, await vfs.read(a)); }
export async function rmdir() {}
export async function stat(p) { return vfs.stat(p); }
export async function access(p) { if (!vfs.exists(p)) throw vfs.fsError('ENOENT', 'access', p); }
export async function readdir(dir, options) {
  const entries = vfs.list(dir);
  if (!options?.withFileTypes) return entries.map(e => e.name);
  return entries.map(e => ({ name: e.name, isFile: () => e.kind === 'file', isDirectory: () => e.kind === 'dir' }));
}

export default { readFile, writeFile, appendFile, mkdir, unlink, rm, rename, copyFile, rmdir, stat, access, readdir };
