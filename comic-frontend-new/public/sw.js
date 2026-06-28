// ─── MangaVerse Service Worker ──────────────────────────────────────────
// Provides: app-shell caching for offline launch, and runtime caching of
// chapter page images so previously-read chapters remain available offline.

const STATIC_CACHE  = 'mangaverse-static-v2';
const IMAGE_CACHE   = 'mangaverse-images-v2';
const APP_SHELL     = ['/', '/manifest.json', '/icon.svg', '/icon-192.png', '/icon-512.png'];

// ── Install: pre-cache the app shell ─────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        // Some shell assets may not exist yet (e.g. icons) — don't block install
      })
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch strategy ────────────────────────────────────────────────────────
// - Comic/chapter page images: cache-first (so read chapters work offline)
// - Navigation requests (app shell): network-first with cache fallback
// - Everything else (API calls, etc.): network only — never intercept
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls — always go to network for live data
  if (url.pathname.startsWith('/api/')) return;

  // Never intercept non-GET requests — only GET responses are cacheable
  if (request.method !== 'GET') return;

  // Cache-first for images (chapter pages, covers)
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            // FIX: was response.clone() AFTER returning response, which consumed
            // the body before clone() could copy it, causing:
            //   TypeError: Failed to execute 'clone' on 'Response':
            //   Response body is already used
            // Fix: clone FIRST, cache the clone, return the original — or cache
            // the original and return the clone. Both work; original→return is
            // cleaner since the caller gets the un-touched stream.
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // Network failed — return whatever we have cached (may be undefined)
          return cached ?? Response.error();
        }
      })
    );
    return;
  }

  // Network-first for navigation (app shell), falling back to cache when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // FIX: same clone-order bug — clone first, cache clone, return original
          caches.open(STATIC_CACHE)
            .then((cache) => cache.put('/', networkResponse.clone()))
            .catch(() => {}); // cache write failure should never break navigation
          return networkResponse;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // All other requests (scripts, styles, fonts): network only, no caching
  // This avoids accidentally caching Vite HMR WebSocket upgrades or stale JS
});
