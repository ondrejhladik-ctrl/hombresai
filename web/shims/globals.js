// Node globals for server.js running in the browser's service worker. esbuild injects these into every module.
import { Buffer } from 'buffer';

export { Buffer };

export const process = {
  env: {},
  argv: [],
  pid: 1,
  platform: 'web',
  execPath: '',
  version: 'v20.0.0',
  versions: { node: '20.0.0' },
  cwd: () => '/app',
  exit() {},
  on() { return this; },
  once() { return this; },
  emitWarning() {},
  nextTick: (fn, ...args) => queueMicrotask(() => fn(...args)),
};

// Node timers can be unref()'d; browser timers are plain numbers.
const wrap = id => ({ id, unref() { return this; }, ref() { return this; }, hasRef: () => true, [Symbol.toPrimitive]: () => id });
const unwrap = t => (t && typeof t === 'object' ? t.id : t);
const native = {
  setTimeout: globalThis.setTimeout.bind(globalThis),
  setInterval: globalThis.setInterval.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  clearInterval: globalThis.clearInterval.bind(globalThis),
};
export const setTimeout = (fn, ms, ...args) => wrap(native.setTimeout(fn, ms, ...args));
export const setInterval = (fn, ms, ...args) => wrap(native.setInterval(fn, ms, ...args));
export const clearTimeout = t => native.clearTimeout(unwrap(t));
export const clearInterval = t => native.clearInterval(unwrap(t));
