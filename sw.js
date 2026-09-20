// Cache names are versioned: bump to force clients onto the new shell.
const CACHE = 'qr-card-v2';

// Relative URLs resolve against this worker's location, so the app works
// from any subpath (e.g. GitHub Pages project sites). Absolute paths like
// '/index.html' 404 on a subpath and fail the whole install (addAll is atomic).
const FILES = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Navigations always come from the cached shell first: the page must
  // render offline even if it was never visited online in this session.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('index.html').then(cached => cached || fetch(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).catch(() => Response.error());
    })
  );
});
