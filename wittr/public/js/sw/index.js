const urlsToCache = [
  '/',
  'js/main.js',
  'css/main.css',
  'imgs/icon.png',
  'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff'
];

const staticCacheName = 'wittr-static-v2';

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
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) return response;

        return fetch(event.request);
      })
      .catch(function () {
        return new Response("Uh oh, that totally failed!");
      })
  );
});