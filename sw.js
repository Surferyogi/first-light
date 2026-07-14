/* First Light service worker — offline-first app shell */
const CACHE = 'first-light-v15';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Google Fonts: cache-first with network fill (so the serif works offline after first load)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        try {
          const res = await fetch(e.request);
          if (res.ok) c.put(e.request, res.clone());
          return res;
        } catch (_) {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // App shell: cache-first, fall back to network, fall back to cached index for navigations
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit ||
      fetch(e.request).catch(() =>
        e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()
      )
    )
  );
});
