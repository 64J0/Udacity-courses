const urlsToCache = [
  '/',
  'js/main.js',
  'css/main.css',
  'imgs/icon.png',
  'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    // TODO: open a cache named 'wittr-static-v1'
    // Add cache the urls from urlsToCache
    caches.open('wittr-static-v1')
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("fetch", function (event) {
  // TODO: respond with an entry from the cache if there is one.
  // If there isn't, fetch from the network
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