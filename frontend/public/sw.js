// Service Worker for caching static assets and API responses
const CACHE_NAME = 'ticktime-platform-v3';
const STATIC_CACHE = 'static-v3';
const API_CACHE = 'api-v3';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
        .then((cache) => cache.addAll(STATIC_ASSETS))
        .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
        .then((cacheNames) => {
            return Promise.all(
                cacheNames
                .filter((cacheName) =>
                    cacheName !== STATIC_CACHE &&
                    cacheName !== API_CACHE
                )
                .map((cacheName) => caches.delete(cacheName))
            );
        })
        .then(() => self.clients.claim())
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Do not intercept any requests when running on localhost (dev)
    if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
        return; // allow the network to handle it normally
    }

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
    }
    // Handle static assets
    else if (request.destination === 'image' ||
        request.destination === 'script' ||
        request.destination === 'style') {
        event.respondWith(handleStaticAsset(request));
    }
    // Handle navigation requests
    else if (request.mode === 'navigate') {
        event.respondWith(handleNavigation(request));
    }
});

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('Static asset fetch failed:', error);
        // Return a fallback response if needed
        return new Response('Asset not available', {
            status: 404
        });
    }
}

// Network-first strategy for API requests with cache fallback
async function handleApiRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful GET requests
            if (request.method === 'GET') {
                const cache = await caches.open(API_CACHE);
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        }

        // If network fails, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        return networkResponse;
    } catch (error) {
        console.error('API request failed:', error);

        // Try to return cached response
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return error response
        return new Response(
            JSON.stringify({
                error: 'Network error',
                offline: true
            }), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

// Network-first strategy for navigation with cache fallback
async function handleNavigation(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            try {
                const cache = await caches.open(STATIC_CACHE);
                cache.put(request, networkResponse.clone());
            } catch (_) {}
            return networkResponse;
        }
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Page not available offline', { status: 404 });
    }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(handleBackgroundSync());
    }
});

async function handleBackgroundSync() {
    // Implement background sync logic for failed requests
    console.log('Background sync triggered');
}

// Push notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();

        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: data.tag || 'default',
            data: data.data || {},
            actions: data.actions || [],
            requireInteraction: data.requireInteraction || false,
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action) {
        // Handle action clicks
        console.log('Notification action clicked:', event.action);
    } else {
        // Handle notification click
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});