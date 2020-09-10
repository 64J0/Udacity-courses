const { request } = require("express");

const urlsToCache = [
  '/skeleton',
  'js/main.js',
  'css/main.css',
  'imgs/icon.png',
  'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff'
];

const staticCacheName = 'wittr-static-v6';
const contentImgsCache = 'wittr-content-imgs';

const allCaches = [
  staticCacheName,
  contentImgsCache
];

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
              !allCaches.includes(cacheName)
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

    if (requestUrl.pathname.startsWith('/photos/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }

    if (requestUrl.pathname.startsWith('/avatars/')) {
      event.respondWith(serveAvatar(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        return response || fetch(event.request);
      })
  );
});

function serveAvatar(request) {
  // Avatar urls look like:
  // avatars/sam-2x.jpg
  // But storageUrl has the -2x.jpg bit missing.
  // Use this url to store & match the image in the cache.
  // This means you only store one copy of each avatar.
  let storageUrl = request.url.replace(/-\dx\.jpg$/, '');

  return caches.open(contentImgsCache)
    .then(function (cache) {
      return cache.match(storageUrl)
        .then(function (response) {
          let networkFetch = fetch(request)
            .then(function (networkResponse) {
              cache.put(storageUrl, networkResponse.clone());
              return networkResponse;
            });

          return response || networkFetch;
        });
    });
}

function servePhoto(request) {
  // Photo urls look like:
  // /photos/2h41-2412-41i25jh123-800px.jpg
  // But storageUrl has the -800px.jpg bit missing.
  // Use this url to store & match the image in the cache.
  // This means you only store one copy of each photo.
  let storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(contentImgsCache)
    .then(function (cache) {
      return cache.match(storageUrl)
        .then(function (response) {
          if (response) return response;

          return fetch(request)
            .then(function (networkResponse) {
              cache.put(storageUrl, networkResponse.clone());
              return networkResponse;
            });
        });
    });
}

self.addEventListener('message', function (event) {
  if (event.data.action == 'skipWaiting') {
    self.skipWaiting();
  }
});