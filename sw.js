var CACHE = 'cpc-connect-v3';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.url.includes('supabase.co') || e.request.url.includes('open-meteo') || e.request.url.includes('cdn') || e.request.url.includes('rss2json')) {
    e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return res;
      });
    }).catch(function() { return caches.match('./index.html'); })
  );
});

// ===== PUSH NOTIFICATION =====
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) { data = { title: 'CPC Connect', body: e.data ? e.data.text() : 'New message' }; }
  
  e.waitUntil(
    self.registration.showNotification(data.title || 'CPC Connect', {
      body: data.body || 'New message',
      icon: '/cpc-connect/icon-192.png',
      badge: '/cpc-connect/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'cpc-message',
      renotify: true,
      data: { url: data.url || '/cpc-connect/' }
    })
  );
});

// Open app when notification tapped
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes('cpc-connect') && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/cpc-connect/');
    })
  );
});
