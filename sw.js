// نيورون AI — Service Worker v2.0
const CACHE_NAME = 'neuron-ai-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap'
];

// ===== INSTALL =====
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ===== FETCH (Cache First, Network Fallback) =====
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', e => {
  let data = { title: '🧠 نيورون AI', body: 'خبر جديد في عالم الذكاء الاصطناعي', tag: 'ai-news', url: './' };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: data.tag,
      renotify: true,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      data: { url: data.url },
      actions: [
        { action: 'open', title: '📖 اقرأ الخبر' },
        { action: 'close', title: '✕ إغلاق' }
      ]
    })
  );
});

// ===== NOTIFICATION CLICK =====
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('index.html') || client.url.endsWith('/')) {
          client.focus(); return;
        }
      }
      clients.openWindow(url);
    })
  );
});

// ===== BACKGROUND SYNC (simulated news check) =====
self.addEventListener('sync', e => {
  if (e.tag === 'sync-news') {
    e.waitUntil(checkForNewNews());
  }
});

async function checkForNewNews() {
  // In production this would fetch real API
  console.log('[SW] Background sync: checking for news...');
}

// ===== PERIODIC BACKGROUND SYNC =====
self.addEventListener('periodicsync', e => {
  if (e.tag === 'news-update') {
    e.waitUntil(checkForNewNews());
  }
});
