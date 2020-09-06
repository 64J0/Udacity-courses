const urlsToCache = [
  '/skeleton',
  'js/main.js',
  'css/main.css',
  'imgs/icon.png',
  'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff'
];

const staticCacheName = 'wittr-static-v4';

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(staticCacheName)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.filter(function (cacheName) {
            return (
              cacheName.startsWith('wittr-') &&
              cacheName != staticCacheName
            );
          }).map(function (cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
  );
});

self.addEventListener('fetch', function (event) {
  let requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        return response || fetch(event.request);
      })
      .catch(function () {
        return new Response("Uh oh, that totally failed!");
      })
  );
});

// TODO: listen for the "message" event, and call
// skipWaiting if you get the appropriate message
self.addEventListener('message', function (event) {
  if (event.data.action == 'skipWaiting') {
    self.skipWaiting();
  }
});