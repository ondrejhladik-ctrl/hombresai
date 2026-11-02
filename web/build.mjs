// Builds the web version (GitHub Pages) into web/dist: the app's pages from public/ plus server.js bundled for the
// browser's service worker. Nothing in the app itself changes – the local app keeps running with `node server.js`.
//   npm i --prefix web --no-save esbuild@0.25.0 buffer@6.0.3 path-browserify@1.0.1
//   node web/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const WEB = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(WEB, '..');
const OUT = process.env.WEB_OUT || path.join(WEB, 'dist');
const MODULES = process.env.WEB_NODE_MODULES || path.join(WEB, 'node_modules');
const requireTool = createRequire(path.join(MODULES, 'noop.js'));
const { build } = requireTool('esbuild');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1) server.js for the service worker, with the Node modules it uses swapped for browser versions (web/shims)
const shim = name => path.join(WEB, 'shims', name);
const NODE_MODULES = {
  'node:fs': shim('fs.js'),
  'node:fs/promises': shim('fs-promises.js'),
  'node:http': shim('http.js'),
  'node:https': shim('http.js'),
  'node:os': shim('os.js'),
  'node:crypto': shim('crypto.js'),
  'node:child_process': shim('child_process.js'),
  'node:path': requireTool.resolve('path-browserify'),
};
const builtin = {};
for (const name of fs.readdirSync(path.join(ROOT, 'effects'))) {
  if (/\.(glsl|md)$/i.test(name)) builtin[`/app/effects/${name}`] = fs.readFileSync(path.join(ROOT, 'effects', name), 'utf8');
}
const plugins = [{
  name: 'hombresai-web',
  setup(b) {
    b.onResolve({ filter: /^node:/ }, a => (NODE_MODULES[a.path] ? { path: NODE_MODULES[a.path] } : { errors: [{ text: `The web version has no stand-in for ${a.path}.` }] }));
    // the app's read-only files (the built-in effects) go into the browser file system
    b.onResolve({ filter: /builtin-files\.js$/ }, () => ({ path: 'builtin-files', namespace: 'hombresai' }));
    b.onLoad({ filter: /.*/, namespace: 'hombresai' }, () => ({ contents: `export const BUILTIN = ${JSON.stringify(builtin)};`, loader: 'js' }));
  },
}];
// a test build can point the server at mock services (the same environment variables as on a computer)
const env = process.env.WEB_ENV_JSON ? JSON.parse(process.env.WEB_ENV_JSON) : {};
await build({
  entryPoints: [path.join(WEB, 'sw-entry.js')],
  outfile: path.join(OUT, 'sw.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'chrome110',
  nodePaths: [MODULES],
  inject: [shim('globals.js')],
  define: { __dirname: '"/app"', 'process.env': JSON.stringify(env) },
  plugins,
  legalComments: 'none',
  logLevel: 'warning',
});

// 2) the pages: public/ as it is, except index.html loads through boot.js and uses paths relative to the site
for (const name of fs.readdirSync(path.join(ROOT, 'public'))) {
  if (name !== 'index.html') fs.copyFileSync(path.join(ROOT, 'public', name), path.join(OUT, name));
}
let html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
const scripts = [];
html = html.replace(/[ \t]*<script src="\/([\w.-]+\.js)" defer><\/script>\n?/g, (all, src) => { scripts.push(src); return ''; });
if (!scripts.length) throw new Error('index.html: no deferred scripts found – the web build needs updating.');
scripts.push('web.js');
html = html
  .replace('</head>', '  <link rel="stylesheet" href="web.css">\n  <script src="boot.js"></script>\n</head>')
  .replace(/(src|href)="\/(?=[\w.-]*")/g, '$1="./');
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.join(OUT, 'boot.js'), fs.readFileSync(path.join(WEB, 'boot.js'), 'utf8').replace('__SCRIPTS__', JSON.stringify(scripts)));
fs.copyFileSync(path.join(WEB, 'web.js'), path.join(OUT, 'web.js'));
fs.copyFileSync(path.join(WEB, 'web.css'), path.join(OUT, 'web.css'));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// 3) today's CNB exchange rate (the CNB doesn't let web pages read it directly)
try {
  const res = await fetch('https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt', { signal: AbortSignal.timeout(15000) });
  if (res.ok) fs.writeFileSync(path.join(OUT, 'cnb.txt'), await res.text());
} catch (err) {
  console.warn(`No CNB rate (${err.message}) – the app uses its built-in rate.`);
}

console.log(`Web version built in ${path.relative(ROOT, OUT) || OUT}: ${scripts.length} scripts, ${Object.keys(builtin).length} built-in files.`);
