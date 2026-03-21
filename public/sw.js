// Service Worker temporariamente desativado.
// Motivo: eliminar 503 em arquivos do /_next durante o desenvolvimento e
// remover registros antigos que continuavam interceptando requests no navegador.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    await self.registration.unregister();

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});

self.addEventListener('fetch', () => {
  // No-op: não interceptar nenhum request.
});

