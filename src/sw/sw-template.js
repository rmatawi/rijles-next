// Custom service worker template for Workbox

// Import Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Your custom code here
self.addEventListener('install', (event) => {
  console.log('Custom Service Worker installing');
  // Skip waiting so new service workers activate immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Custom Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle navigation requests (deep linking)
// This ensures external links to your domain open in the PWA
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle navigation requests (page loads)
  if (event.request.mode === 'navigate') {
    console.log('[SW] Navigation request:', url.href);

    // Check if this is a same-origin request
    if (url.origin === location.origin) {
      console.log('[SW] Same-origin navigation, allowing PWA to handle');

      // Let the default handler take care of it
      // This will open in the PWA if it's installed
      event.respondWith(
        fetch(event.request)
          .catch(() => {
            // If offline, try to serve cached page
            return caches.match('/index.html');
          })
      );

      return;
    }
  }

  // For non-navigation requests, let Workbox handle it
});

// Add runtime caching for fonts
workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
      }),
    ],
  })
);

// Runtime caching for SVG assets (vehicles, roads, traffic signs)
workbox.routing.registerRoute(
  ({ url }) =>
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/vehicles/') ||
      url.pathname.startsWith('/roads/') ||
      url.pathname.startsWith('/borden/')),
  new workbox.strategies.CacheFirst({
    cacheName: 'svg-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// This will be replaced by Workbox's precache manifest
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);