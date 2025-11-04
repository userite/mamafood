// Service Worker for PWA - Universal compatibility
const CACHE_NAME = 'mamafood-v4';
const VERSION = '4.0.0';

// Install event - cache files
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                // Try to cache, but don't fail if files are not found
                return cache.addAll([
                    './',
                    './index.html',
                    './styles.css',
                    './app.js',
                    './manifest.json'
                ]).catch(err => {
                    console.log('[Service Worker] Cache addAll error:', err);
                });
            })
    );
    
    // Force activation
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    self.clients.claim();
    console.log('[Service Worker] Activated');
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'МАМАФООД', body: 'Ново известие' };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'МАМАФООД', {
            body: data.body || 'Има ново известие',
            icon: '/manifest.json',
            badge: '/manifest.json',
            tag: 'mamafood-notification',
            requireInteraction: false
        })
    );
});

// Notification click - open app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                }).catch(() => {
                    // Network failed, check if it's an HTML request
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

