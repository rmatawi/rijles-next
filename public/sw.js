const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

const CORE_ASSETS = ["/", "/offline", "/icons/192x192.png", "/icons/512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => ![STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE].includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

const isStaticAsset = (url) => {
  if (url.pathname.startsWith("/_next/static/")) return true;
  return /\.(?:js|css|woff2?|ttf|svg|ico|json)$/i.test(url.pathname);
};

const isImageAsset = (url) => /\.(?:png|jpg|jpeg|gif|webp|avif)$/i.test(url.pathname);

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  if (isImageAsset(url)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
  }
});

async function handleNavigationRequest(request) {
  const pageCache = await caches.open(PAGE_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      pageCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedPage = await pageCache.match(request, { ignoreSearch: true });
    if (cachedPage) return cachedPage;

    const staticCache = await caches.open(STATIC_CACHE);
    const offlinePage = await staticCache.match("/offline");
    if (offlinePage) return offlinePage;

    const homePage = await staticCache.match("/");
    if (homePage) return homePage;

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request, { ignoreSearch: true });
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return cachedResponse || Response.error();
  }
}
