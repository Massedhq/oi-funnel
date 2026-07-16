const CACHE = 'oi-admin-ship-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/admin/ship'])
    )
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/admin/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request)
      )
    )
  }
})