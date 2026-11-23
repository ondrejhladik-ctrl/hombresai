// The web version: there's no Google Drive here, so the gallery note says where the pictures are kept instead.
(function () {
  const render = renderGallery;
  renderGallery = function (...args) {
    const out = render.apply(this, args);
    for (const banner of document.querySelectorAll('.banner')) {
      if (!/Google Drive/.test(banner.textContent)) continue;
      banner.replaceChildren(icon('alert', 18), h('span', { class: 'banner-text' },
        'Web version: your keys, pictures and graphs are kept only in this browser. Download what you want to keep – or install the app on your computer for Google Drive.'));
    }
    return out;
  };
  navigator.storage?.persist?.(); // ask the browser not to clear the gallery when it's short of space
})();
