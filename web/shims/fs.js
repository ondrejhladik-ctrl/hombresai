// node:fs – the few synchronous calls server.js makes, plus streaming a file into a response.
import * as vfs from './vfs.js';
import promises from './fs-promises.js';

export { promises };

export const existsSync = p => vfs.exists(p);

export function readFileSync(p, options) {
  const bytes = Buffer.from(vfs.readSync(p));
  const enc = typeof options === 'string' ? options : options?.encoding;
  return enc ? bytes.toString(enc) : bytes;
}

// only used for a one-time folder move on a computer; there is nothing to move here
export function renameSync(a) { throw vfs.fsError('ENOENT', 'rename', a); }

export function mkdirSync(p) { vfs.mkdir(p); }

// serveFile: fs.createReadStream(file[, {start, end}]).on('error', …).pipe(res)
// `end` is inclusive, like Node, so a byte range can be served (video seeking).
export function createReadStream(p, opts = {}) {
  const handlers = {};
  const stream = {
    on(ev, fn) { (handlers[ev] ||= []).push(fn); return stream; },
    once(ev, fn) { return stream.on(ev, fn); },
    pipe(res) {
      vfs.read(p).then(bytes => {
        let out = Buffer.from(bytes);
        if (typeof opts.start === 'number' || typeof opts.end === 'number') {
          out = out.subarray(opts.start || 0, typeof opts.end === 'number' ? opts.end + 1 : out.length);
        }
        res.end(out);
      }, err => (handlers.error || []).forEach(fn => fn(err)));
      return res;
    },
  };
  return stream;
}

export default { existsSync, readFileSync, renameSync, mkdirSync, createReadStream, promises };
