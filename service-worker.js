// Service Worker for PWA - Universal compatibility
const CACHE_NAME = 'mamafood-v10';
const VERSION = '10.0.0';

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
                    './index.html?v=10',
                    './styles.css?v=2',
                    './app_v2.js?v=10',
                    './i18n.js?v=2',
                    './manifest.json?v=2'
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

// Fetch event - network first, then cache (for better updates)
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip caching for API calls
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request.clone())
            .then((response) => {
                // Check if valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    // Try cache if network fails
                    return caches.match(event.request).then(cachedResponse => {
                        return cachedResponse || response;
                    });
                }
                
                // Clone the response
                const responseToCache = response.clone();
                
                // Update cache with new version
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If it's an HTML request, return index.html
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

