// node:http and node:https for server.js in the browser.
// createServer(): instead of listening on a port, hands its request handler to the service worker.
// request(): outgoing calls (Gemini, Pollinations, Hugging Face…) go through fetch.

let resolveReady;
export const serverReady = new Promise(resolve => { resolveReady = resolve; });

export function createServer(handler) {
  const server = {
    listen(port, host, callback) {
      resolveReady({ handler, port });
      queueMicrotask(() => (typeof host === 'function' ? host : callback)?.());
      return server;
    },
    on() { return server; },
    once() { return server; },
    close(callback) { callback?.(); },
    address: () => ({ port: 4848 }),
  };
  return server;
}

// The daily CNB exchange rate file has no CORS – the site keeps a copy made when it was built.
const CNB_HOST = 'www.cnb.cz';
function mapUrl(url) {
  const u = new URL(url);
  // server.js first asks whether the app already runs on this computer (ports 4848–4868) – on the web it never does
  if (['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname) && Number(u.port) >= 4848 && Number(u.port) <= 4868) return null;
  if (u.hostname === CNB_HOST) return new URL('cnb.txt', self.registration?.scope || self.location.href).href;
  return u.href;
}

const SKIP_HEADERS = /^(content-length|host|connection|accept-encoding|user-agent|transfer-encoding)$/i;

class Emitter {
  constructor() { this.handlers = {}; }
  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); return this; }
  once(ev, fn) { return this.on(ev, fn); }
  emit(ev, ...args) { for (const fn of this.handlers[ev] || []) fn(...args); }
}

class IncomingMessage extends Emitter {
  constructor(r) {
    super();
    this.statusCode = r.status;
    this.statusMessage = r.statusText;
    this.headers = {};
    r.headers.forEach((v, k) => { this.headers[k] = v; });
    this.response = r;
  }
  setEncoding() { return this; }
  resume() { return this; }
  async start() {
    try {
      if (this.response.body) {
        const reader = this.response.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          this.emit('data', Buffer.from(value));
        }
      }
      this.emit('end');
    } catch (err) {
      this.emit('error', err);
    }
  }
}

class ClientRequest extends Emitter {
  constructor(url, options, callback) {
    super();
    this.url = url;
    this.options = options || {};
    this.callback = callback;
    this.chunks = [];
    this.controller = new AbortController();
    this.failed = false;
  }
  setTimeout(ms, fn) { this.timer = setTimeout(fn, ms); return this; }
  setHeader() {}
  write(chunk) { this.chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk); return true; }
  fail(err) {
    clearTimeout(this.timer);
    if (this.failed) return;
    this.failed = true;
    this.emit('error', err);
  }
  destroy(err) {
    this.controller.abort();
    this.fail(err || Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }));
  }
  end(chunk) {
    if (chunk != null) this.write(chunk);
    this.send();
    return this;
  }
  async send() {
    const url = mapUrl(String(this.url));
    if (!url) {
      setTimeout(() => this.fail(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })), 0);
      return;
    }
    const headers = {};
    for (const [k, v] of Object.entries(this.options.headers || {})) if (!SKIP_HEADERS.test(k) && v != null) headers[k] = String(v);
    const method = (this.options.method || 'GET').toUpperCase();
    const body = this.chunks.length && !['GET', 'HEAD'].includes(method) ? Buffer.concat(this.chunks) : undefined;
    let r;
    try {
      r = await fetch(url, { method, headers, body, signal: this.controller.signal, redirect: 'follow' });
    } catch (err) {
      if (!this.failed) this.fail(Object.assign(new Error(err.message || 'fetch failed'), { code: err.name === 'AbortError' ? 'ECONNRESET' : 'ENOTFOUND', cause: err }));
      return;
    }
    clearTimeout(this.timer);
    if (this.failed) return;
    const res = new IncomingMessage(r);
    this.callback?.(res);
    this.emit('response', res);
    res.start();
  }
}

export function request(url, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  return new ClientRequest(url, options, callback);
}

export function get(url, options, callback) {
  const req = request(url, options, callback);
  req.end();
  return req;
}

export const Agent = class {};
export default { createServer, request, get, Agent };
