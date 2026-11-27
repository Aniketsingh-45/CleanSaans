/**
 * CleanSaans Minimal Service Worker
 *
 * PWA App Shell Caching:
 * - Pre-caches essential offline shell routes and static brand icons.
 * - Stale-while-revalidate for navigational shell and static assets.
 * - STRICT POLICY: NEVER caches /api/ endpoints (AQI, Plan, Audit, Ask) or non-GET requests.
 */

const CACHE_NAME = "cleansaans-shell-v1";

const SHELL_ASSETS = [
  "/",
  "/onboarding",
  "/audit",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Install: pre-cache static application shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {
        // Continue even if some individual resources fail to pre-fetch during build/install
      })
  );
  self.skipWaiting();
});

// Activate: clean up older cache versions and take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve cached shell, NEVER cache /api responses
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Strict API bypass: NEVER cache any /api/ requests or non-GET requests
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Stale-while-revalidate for shell assets with offline fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            !url.pathname.startsWith("/api/")
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is HTML navigation, fallback to root shell
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
