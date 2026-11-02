// Loading intro (after the ohdesign.eu loader): the logo's two strokes morph from side by side into the
// logo, while the image resolves from coarse pixel blocks to sharp. Then the layer slides up and is removed.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // the two strokes of logo.svg (viewBox 0 0 213 252.01)
  const VIEW = { w: 213, h: 252.01 };
  const SHAPES = [
    'M107.17,146.58l-2.46,10.49c-9.85,3.93-17.51,6.8-22.98,8.61s-11,2.71-16.58,2.71c-8.75,0-15.32-2.27-19.7-6.81s-6.56-10.15-6.56-16.82c0-2.41.22-5.06.66-7.96.44-2.9,1.15-6.32,2.13-10.26l16.06-61.22c1.2-4.7,2.16-8.97,2.87-12.8.71-3.83,1.07-6.89,1.07-9.19,0-7.33-1.74-13.13-5.21-17.4-3.48-4.27-8.63-6.4-15.46-6.4s-14.45,2.25-22.53,6.74c-4.71,2.62-7.91,5.03-11.2,8.2C4.48,37.13-.16,35.02,0,31.16h0c.1-2.3,1.21-4.44,3.01-5.87,10.06-7.95,19.12-14.06,27.19-18.31C39.02,2.33,49.04,0,60.25,0c10.45,0,18.61,3.04,24.49,9.11,5.88,6.07,8.82,14.03,8.82,23.88,0,1.97-.3,5.47-.9,10.51-.6,5.03-1.56,10.01-2.87,14.94l-13.79,52.69c-.88,3.5-1.81,7.53-2.79,12.07-.98,4.54-1.48,8.07-1.48,10.59,0,6.24,1.37,10.48,4.1,12.72,2.73,2.24,7.22,3.36,13.45,3.36,2.08,0,5.06-.35,8.94-1.07,3.88-.71,6.86-1.45,8.94-2.21Z',
    'M201.36,230.69l-2.46,10.49c-10.06,4.04-18.09,6.86-24.1,8.44-6.01,1.58-11.15,2.38-15.41,2.38-8.75,0-15.3-2.27-19.67-6.81-4.37-4.54-6.56-10.15-6.56-16.82,0-2.52.22-5.14.65-7.88.44-2.74,1.15-6.18,2.13-10.34l17.32-69.76c.87-3.83,1.72-7.93,2.54-12.31.82-4.38,1.23-8.1,1.23-11.16,0-6.13-1.01-10.2-3.03-12.23-2.02-2.02-6.14-3.04-12.36-3.04-2.4,0-5.59.38-9.57,1.15-3.98.77-7.01,1.42-9.08,1.97l2.46-10.49c8.52-3.83,16.17-6.67,22.94-8.53,6.77-1.86,12.13-2.79,16.06-2.79,8.96,0,15.46,2.13,19.5,6.4,4.04,4.27,6.06,10.01,6.06,17.23,0,1.97-.22,4.65-.66,8.04-.44,3.39-1.09,6.78-1.97,10.18l-17.42,69.76c-1.09,4.27-2.04,8.45-2.85,12.56-.81,4.1-1.22,7.47-1.22,10.09,0,6.24,1.39,10.51,4.17,12.8,2.78,2.3,7.27,3.45,13.48,3.45,2.07,0,5.04-.27,8.9-.82,3.87-.54,6.84-1.2,8.91-1.97ZM213,20.99c0,6.23-2.02,11.67-6.07,16.31-4.04,4.65-9.07,6.97-15.08,6.97-5.57,0-10.39-2.21-14.43-6.64-4.05-4.43-6.07-9.48-6.07-15.17,0-6.01,2.02-11.26,6.07-15.74,4.04-4.48,8.85-6.72,14.43-6.72,6.23,0,11.31,2.11,15.25,6.31,3.94,4.21,5.9,9.1,5.9,14.67Z',
  ].map(d => new Path2D(d));
  // start pose of each stroke (logo units, origin top left): both stand on one baseline, deformed; the end pose is the logo
  const START = [
    { tx: 0, ty: 109, sx: 1.12, sy: 0.85 },
    { tx: 30, ty: 60, sx: 0.86, sy: 0.76 },
  ];
  const COLOR = '#f6f1e7';
  const MORPH_MS = 1300;
  const HOLD_MS = 450;
  const PIXELS = [36, 28, 22, 17, 13, 10, 7, 5, 3, 2, 1]; // block size in CSS px, coarse → sharp
  const PIXEL_END = 0.9; // share of the morph after which the logo is sharp

  // cubic-bezier(.76,0,.24,1) – the calm, viscous ease of the original
  const ease = (() => {
    const [x1, y1, x2, y2] = [0.76, 0, 0.24, 1];
    const bez = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    return x => {
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 24; i++) { t = (lo + hi) / 2; if (bez(t, x1, x2) < x) lo = t; else hi = t; }
      return bez(t, y1, y2);
    };
  })();

  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.className = 'intro-logo';
  intro.append(canvas);
  document.body.append(intro);

  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width));
  const cssH = Math.max(1, Math.round(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext('2d');
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');

  function drawLogo(c, w, h, k) {
    c.clearRect(0, 0, w, h);
    c.fillStyle = COLOR;
    const unit = w / VIEW.w;
    SHAPES.forEach((shape, i) => {
      const s = START[i];
      c.save();
      c.scale(unit, unit);
      c.translate(s.tx * (1 - k), s.ty * (1 - k));
      c.scale(s.sx + (1 - s.sx) * k, s.sy + (1 - s.sy) * k);
      c.fill(shape);
      c.restore();
    });
  }

  function frame(t) {
    const k = ease(t);
    const level = Math.min(PIXELS.length - 1, Math.floor(Math.min(1, t / PIXEL_END) * PIXELS.length));
    const px = PIXELS[level];
    if (px <= 1) {
      drawLogo(ctx, canvas.width, canvas.height, k);
      return;
    }
    // draw small, then blow up without smoothing → square pixels
    off.width = Math.ceil(cssW / px);
    off.height = Math.ceil(cssH / px);
    drawLogo(octx, off.width, off.height, k);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, off.width * px * dpr, off.height * px * dpr);
  }

  let removed = false;
  const remove = () => { if (!removed) { removed = true; intro.remove(); } };
  // the coarse start frame shows while the app loads; the morph runs once the page is loaded so it isn't janky
  frame(0);
  let started = false;
  function begin() {
    if (started) return;
    started = true;
    requestAnimationFrame(start => requestAnimationFrame(function tick(now) {
      const t = Math.min(1, Math.max(0, now - start) / MORPH_MS);
      frame(t);
      if (t < 1) return requestAnimationFrame(tick);
      setTimeout(() => {
        intro.classList.add('is-done');
        intro.addEventListener('transitionend', remove, { once: true });
        setTimeout(remove, 1500); // in case transitionend never fires (hidden tab)
      }, HOLD_MS);
    }));
  }
  if (document.readyState === 'complete') begin();
  else window.addEventListener('load', begin, { once: true });
  setTimeout(begin, 1500); // don't wait forever for a slow image
})();
