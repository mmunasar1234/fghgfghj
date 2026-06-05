/* Ku dar kaydinta browser-ka (edit.html) config-ka asalka ah */
(function () {
  var key = document.documentElement.getAttribute('data-wedding-key') || 'index';
  var storageKey = 'wedding-cfg-' + key;

  var urlParams = new URLSearchParams(location.search);
  var hasPackedUrl = !!urlParams.get('p');
  var isScanLink = hasPackedUrl || !!urlParams.get('v') || urlParams.get('s') === '1';

  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    Object.keys(source).forEach(function (k) {
      var sv = source[k];
      var tv = target[k];
      if (sv && typeof sv === 'object' && !Array.isArray(sv) && typeof tv === 'object' && !Array.isArray(tv)) {
        deepMerge(tv, sv);
      } else {
        target[k] = sv;
      }
    });
    return target;
  }

  function replaceConfig(data) {
    if (!data || typeof WEDDING_CONFIG === 'undefined') return;
    if (data.groom) WEDDING_CONFIG.groom = data.groom;
    if (data.bride) WEDDING_CONFIG.bride = data.bride;
    if (data.date != null) WEDDING_CONFIG.date = data.date;
    if (data.dateISO != null) WEDDING_CONFIG.dateISO = data.dateISO;
    if (data.heroImage != null) WEDDING_CONFIG.heroImage = data.heroImage;
    if (data.venue) WEDDING_CONFIG.venue = data.venue;
    if (data.texts) WEDDING_CONFIG.texts = data.texts;
    if (data.imageOpts) WEDDING_CONFIG.imageOpts = data.imageOpts;
    if (data.gallery) WEDDING_CONFIG.gallery = data.gallery;
    if (data.whatsapp != null) WEDDING_CONFIG.whatsapp = data.whatsapp;
  }

  function applyStoredConfig() {
    if (isScanLink) return;
    try {
      var raw = localStorage.getItem(storageKey);
      if (raw && typeof WEDDING_CONFIG !== 'undefined') {
        deepMerge(WEDDING_CONFIG, JSON.parse(raw));
      }
    } catch (e) { /* ignore */ }
  }

  function applyPackedFromUrl() {
    try {
      var p = urlParams.get('p');
      if (!p || typeof WEDDING_CONFIG === 'undefined') return false;
      if (window.WeddingQR && WeddingQR.unpackConfig) {
        replaceConfig(WeddingQR.unpackConfig(p));
        return true;
      }
    } catch (e) { /* ignore bad pack */ }
    return false;
  }

  function loadDeployedConfig() {
    var rev = urlParams.get('v') || urlParams.get('t') || String(Date.now());
    var url = './wedding-data-' + key + '.json?v=' + encodeURIComponent(rev);
    return fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && typeof WEDDING_CONFIG !== 'undefined') replaceConfig(data);
      })
      .catch(function () { /* offline / file not uploaded yet */ });
  }

  if (hasPackedUrl) applyPackedFromUrl();
  else if (!isScanLink) applyStoredConfig();

  window.__weddingReady = Promise.resolve().then(function () {
    if (hasPackedUrl) return;
    if (isScanLink) return loadDeployedConfig();
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch (e) { /* */ }
    return loadDeployedConfig();
  }).then(function () {
    if (hasPackedUrl) {
      applyPackedFromUrl();
    } else if (!isScanLink) {
      applyStoredConfig();
    }
    if (!window.WeddingStore) return;
    return WeddingStore.getObjectUrl('music-' + key).then(function (url) {
      if (url && typeof WEDDING_CONFIG !== 'undefined' && !isScanLink) WEDDING_CONFIG.music = url;
    });
  }).catch(function () {});
})();
