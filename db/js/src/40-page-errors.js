// Page error capture.
//
// A page that renders nothing usually threw on the way there, and the console
// shim only forwards the snippet's own output — so the page's own failures are
// invisible from the app, which turns "it is blank" into guesswork.

  // ---- Page error capture -------------------------------------------------
  //
  // A page that renders nothing usually threw on the way. The console shim
  // only forwards snippet.js's own output, so the page's failures are
  // invisible from the app — which turns "it is blank" into guesswork.
  // Kept to a handful so an ad-heavy page cannot flood the log.
  (function pageErrors() {
    if (window.__cupPageErrors) return;
    const seen = [];
    window.__cupPageErrors = seen;
    const MAX = 10;
    function note(kind, message, where) {
      if (seen.length >= MAX) return;
      const line = kind + ': ' + String(message || '').slice(0, 300) +
        (where ? ' @ ' + String(where).slice(0, 160) : '');
      seen.push(line);
      console.warn('[pageerr]', line);
    }
    window.addEventListener('error', (ev) => {
      try {
        note('error', ev.message || (ev.error && ev.error.message),
          (ev.filename || '') + ':' + (ev.lineno || ''));
      } catch (_) {}
    }, true);
    window.addEventListener('unhandledrejection', (ev) => {
      try {
        const r = ev.reason;
        note('unhandled', (r && (r.message || r)) || 'rejection', '');
      } catch (_) {}
    });
  })();
