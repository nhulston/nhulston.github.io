// Increment CACHE_VERSION when precache list changes to refresh stored assets.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `site-cache-${CACHE_VERSION}`;
const LONG_CACHE_VALUE = 'public, max-age=31536000, immutable';
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

async function putWithLongCache(cache, request, response) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', LONG_CACHE_VALUE);
    headers.delete('Expires');
    headers.delete('Pragma');

    const responseBody = await response.clone().arrayBuffer();

    const cacheReadyResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers
    });

    await cache.put(request, cacheReadyResponse.clone());
    return cacheReadyResponse;
}

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(
            PRECACHE_URLS.map(async (url) => {
                const request = new Request(url, { cache: 'reload' });
                try {
                    const response = await fetch(request);
                    if (response && response.status === 200 && response.type === 'basic') {
                        await putWithLongCache(cache, request, response);
                    }
                } catch (error) {
                    console.warn('Precache failed for', url, error);
                }
            })
        );
        self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames
                .filter((name) => name !== CACHE_NAME)
                .map((name) => caches.delete(name))
        );
        self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestURL = new URL(event.request.url);
    if (requestURL.origin !== self.location.origin) {
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
            return cachedResponse;
        }

        try {
            const networkResponse = await fetch(event.request);
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
            }

            return await putWithLongCache(cache, event.request, networkResponse);
        } catch (error) {
            return cachedResponse || Promise.reject(error);
        }
    })());
});
