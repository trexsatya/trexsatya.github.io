// Offline support for the study app (language.html).
//
// Cupitor shows language.html in a WebView dialog. With no network the page
// simply failed to load, so the dialog would not open at all — even though
// everything it needs is already in IndexedDB. A page cannot serve itself
// offline; a service worker has to, and nothing on this site registered one.
//
// Deliberately NOT the build-generated /service-worker.js, for two reasons
// that each rule it out on their own:
//   - it precaches the whole site from precache-manifest.*.js — about 3500
//     files, 600+ of them CKEditor — which is an unacceptable download on a
//     phone just to open a dialog;
//   - its precache route ignores only `utm_*` query parameters, so a request
//     for `/language.html?lang=swedish` matches no cache entry and falls
//     through to the network regardless. It could not serve this page offline
//     even if it were registered.
//
// This worker caches what the page actually uses, as it uses it.
//
// Scope note: a worker's scope has to cover the page it serves, so this claims
// `/`, the same scope the Vue app at /index.html registers /service-worker.js
// for. Only one script can hold a scope, so opening /index.html in the same
// WebView replaces this one, and this one replaces that. Both pages re-register
// on load, so either recovers on its next online visit, and while this worker
// is in control /index.html still works offline through the generic handler
// below — it just is not precached.

const CACHE = 'cupitor-language-v1';
const SHELL = '/language.html';
const NAV_TIMEOUT_MS = 3000;

// Extensions worth keeping. Media is deliberately absent: recordings and
// video are large, are played with range requests, and are already handled by
// the app's own storage.
const STATIC_RE = /\.(?:js|mjs|css|json|html|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico|md)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n.startsWith('cupitor-language-') && n !== CACHE)
             .map((n) => caches.delete(n)),
      ))
      // Claim the page that installed us, so its later subresource requests
      // are cached during this very first visit instead of the one after.
      .then(() => self.clients.claim()),
  );
});

// The shell plus the assets it names.
//
// The list is read out of the HTML rather than written here, so adding a
// <script> to language.html does not silently leave a hole in the offline
// cache. Module imports are not in the HTML and so are not covered here —
// those get cached as they are used, which is why one online visit is needed
// after deploying this.
async function precacheShell() {
  const cache = await caches.open(CACHE);
  let html = '';
  try {
    // `reload` so a stale HTTP-cache copy of the shell is not what gets
    // enshrined for offline use.
    const res = await fetch(SHELL, { cache: 'reload' });
    if (!res || !res.ok) return;
    await cache.put(SHELL, res.clone());
    html = await res.text();
  } catch (_) {
    return;
  }
  const urls = new Set();
  const re = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1];
    // Same-origin, root-relative only. Cross-origin CDN assets are left to
    // the generic handler; a failure there must not fail the install.
    if (!raw.startsWith('/') || raw.startsWith('//')) continue;
    if (STATIC_RE.test(raw.split('?')[0])) urls.add(raw);
  }
  // One at a time with its own catch: cache.addAll rejects the whole batch if
  // any single request fails, which would abort the install and leave nothing
  // cached at all.
  await Promise.all([...urls].map((u) => cache.add(u).catch(() => {})));
}

function cacheable(res) {
  return res && res.ok && res.status === 200 && res.type !== 'opaque';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Range requests are how media is played. Serving one a whole cached body
  // breaks playback, so leave them alone entirely.
  if (req.headers.get('range')) return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(handleNavigation(req));
    return;
  }
  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(handleStatic(req));
  }
});

// Network first so a deploy is picked up, but only for as long as a user will
// wait. Past that the cached shell is better than a spinner — and offline,
// where the fetch fails outright, it is the whole point of this file.
async function handleNavigation(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(req), NAV_TIMEOUT_MS);
    if (cacheable(res)) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (_) {
    // ignoreSearch is what makes `?lang=swedish` match the cached
    // `/language.html`. Without it there is no hit and this all does nothing.
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const shell = await cache.match(SHELL);
    if (shell) return shell;
    return new Response(
      '<h1>Offline</h1><p>This page has not been opened online yet, so there '
      + 'is no cached copy to show.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}

// Cached copy immediately, refreshed in the background. The page loads at
// once, offline or on, and the next load has the newer file.
async function handleStatic(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (cacheable(res)) cache.put(req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  if (hit) return hit;
  const res = await network;
  if (res) return res;
  return new Response('', { status: 504, statusText: 'Offline and not cached' });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}
