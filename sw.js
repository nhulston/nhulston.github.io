// Increment CACHE_VERSION when precache list changes to refresh stored assets.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `site-cache-${CACHE_VERSION}`;
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/404.html',
    '/images/park-city-ski-resort.webp',
    '/images/park-city-map.webp',
    '/images/park-city-condo1.webp',
    '/images/park-city-condo2.webp',
    '/images/park-city-condo3.webp',
    '/images/park-city-condo4.webp',
    '/images/facebook.png',
    '/images/favicon.png'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (name) {
                        return name !== CACHE_NAME;
                    })
                    .map(function (name) {
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestURL = new URL(event.request.url);

    if (requestURL.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(function (networkResponse) {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            });
        })
    );
});
