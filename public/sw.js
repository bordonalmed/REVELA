// Service Worker para Revela PWA
const CACHE_NAME = 'revela-v1';
const RUNTIME_CACHE = 'revela-runtime-v1';

// Arquivos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/projects',
  '/new-project',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/revela3.png',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de extensões do Chrome (chrome-extension://)
  if (requestUrl.protocol === 'chrome-extension:') {
    return;
  }

  // Ignorar requisições para APIs externas e serviços de terceiros
  if (requestUrl.hostname.includes('supabase.co') || 
      requestUrl.hostname.includes('supabase.in') ||
      requestUrl.hostname.includes('supabase.io') ||
      requestUrl.hostname.includes('googleapis.com') ||
      requestUrl.hostname.includes('gstatic.com') ||
      requestUrl.hostname.includes('googletagmanager.com') ||
      requestUrl.hostname.includes('google-analytics.com') ||
      requestUrl.hostname.includes('google.com') ||
      requestUrl.hostname.includes('netlify.app')) {
    return;
  }

  // Ignorar requisições que não são HTTP/HTTPS
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar a resposta para cache apenas se for válida
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          
          // Validar se a URL é cacheável antes de tentar fazer cache
          const url = new URL(event.request.url);
          const isCacheable = url.protocol === 'http:' || url.protocol === 'https:';
          
          if (isCacheable) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              // Adicionar tratamento de erro para evitar falhas silenciosas
              cache.put(event.request, responseToCache).catch((error) => {
                console.warn('[Service Worker] Failed to cache:', event.request.url, error);
              });
            }).catch((error) => {
              console.warn('[Service Worker] Failed to open cache:', error);
            });
          }
        }
        
        return response;
      })
      .catch(() => {
        // Fallback para cache se a rede falhar
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Se for uma navegação, retornar página inicial
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // Retornar resposta vazia para outros casos
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

