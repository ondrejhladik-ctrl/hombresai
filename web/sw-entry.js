// The web version's service worker: it runs the app's own server.js (unchanged) inside the browser and answers the
// page's /api, /media, /thumbs and /refs requests with it – the way the server answers them on a computer.
// Its data folder lives in IndexedDB (shims/vfs.js), so every visitor has their own keys, pictures and graphs.
import { vfsInit } from './shims/vfs.js';
import { serverReady } from './shims/http.js';

const SCOPE = new URL(self.registration.scope).pathname; // e.g. /hombresai/
const SERVER_PATHS = /^\/(api|media|thumbs|refs|oauth)(\/|$)/;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

let started = null;
function startServer() {
  started ||= (async () => {
    await vfsInit(['/home/web/.hombresai/config.json']);
    require('../server.js'); // its main() loads the data and calls http.createServer().listen()
    return serverReady;
  })().catch(err => { started = null; throw err; });
  return started;
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const rel = url.pathname.startsWith(SCOPE) ? `/${url.pathname.slice(SCOPE.length)}` : url.pathname;
  if (SERVER_PATHS.test(rel)) event.respondWith(serve(event.request, rel + url.search));
  else if (!url.pathname.startsWith(SCOPE)) event.respondWith(fetch(SCOPE + rel.slice(1) + url.search)); // e.g. /logo.svg
});

class FakeRequest {
  constructor(method, url, headers, body) {
    Object.assign(this, { method, url, headers, body, handlers: {}, delivered: false });
  }
  on(ev, fn) {
    (this.handlers[ev] ||= []).push(fn);
    if (ev === 'end' && !this.delivered) {
      this.delivered = true;
      setTimeout(() => {
        if (this.body?.length) for (const fn of this.handlers.data || []) fn(Buffer.from(this.body));
        for (const fn of this.handlers.end || []) fn();
      }, 0);
    }
    return this;
  }
  once(ev, fn) { return this.on(ev, fn); }
  destroy() {}
}

class FakeResponse {
  constructor(done) {
    this.done = done;
    this.statusCode = 200;
    this.headers = new Headers();
    this.chunks = [];
    this.headersSent = false;
    this.finished = false;
  }
  setHeader(k, v) { this.headers.set(k, String(v)); }
  getHeader(k) { return this.headers.get(k); }
  removeHeader(k) { this.headers.delete(k); }
  writeHead(status, headers) {
    this.statusCode = status;
    for (const [k, v] of Object.entries(headers || {})) if (v != null) this.headers.set(k, String(v));
    this.headersSent = true;
    return this;
  }
  write(chunk) {
    if (chunk != null) this.chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    this.headersSent = true;
    return true;
  }
  end(chunk) {
    if (this.finished) return;
    if (chunk != null) this.write(chunk);
    this.finished = true;
    this.headers.delete('content-length'); // the browser counts the body itself
    const empty = [101, 204, 205, 304].includes(this.statusCode);
    this.done(new Response(empty ? null : Buffer.concat(this.chunks), { status: this.statusCode, headers: this.headers }));
  }
  destroy() {
    if (this.finished) return;
    this.finished = true;
    this.done(new Response('The request failed.', { status: 500 }));
  }
  on() { return this; }
  once() { return this; }
}

async function serve(request, pathAndQuery) {
  let server;
  try {
    server = await startServer();
  } catch (err) {
    return new Response(JSON.stringify({ error: { message: `The web version couldn’t start: ${err.message}` } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const body = ['GET', 'HEAD'].includes(request.method) ? null : new Uint8Array(await request.arrayBuffer());
  const headers = {};
  request.headers.forEach((v, k) => { headers[k] = v; });
  // the server only answers its own address (protection against other websites on a computer)
  headers.host = `127.0.0.1:${server.port}`;
  if (headers.origin) headers.origin = `http://127.0.0.1:${server.port}`;
  return new Promise(resolve => server.handler(new FakeRequest(request.method, pathAndQuery, headers, body), new FakeResponse(resolve)));
}
