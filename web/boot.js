// The web version: the app's server runs in a service worker in this browser (sw.js). On the first visit it is set
// up and the page reloads once; after that the app's scripts load with the server already answering.
(function () {
  const SCRIPTS = __SCRIPTS__;
  const sw = navigator.serviceWorker;
  if (sw && sw.controller) {
    sessionStorage.removeItem('hombresai-boot');
    for (const src of SCRIPTS) document.write(`<script src="${src}" defer><\/script>`);
    return;
  }
  const fail = text => document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML = `<p style="max-width:34em;margin:20vh auto;padding:0 20px;font:16px/1.5 system-ui,sans-serif;color:#e6e6e6">${text}</p>`;
  });
  if (!sw) { fail('hombresai needs a browser that can run it offline (service workers) – a current Chrome, Edge, Firefox or Safari, not a private window.'); return; }
  const tries = Number(sessionStorage.getItem('hombresai-boot') || 0);
  sessionStorage.setItem('hombresai-boot', String(tries + 1));
  sw.register('sw.js', { scope: './' })
    .then(() => sw.ready)
    .then(() => {
      if (tries < 3) location.reload();
      else fail('hombresai couldn’t start in this browser. Reload the page – if it keeps happening, allow cookies and site data for this site.');
    })
    .catch(err => fail(`hombresai couldn’t start in this browser (${err.message}).`));
})();
