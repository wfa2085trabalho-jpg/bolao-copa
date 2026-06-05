// Service Worker — Bolão Copa 2026
const CACHE = "bolao-copa-v1";
const ASSETS = [
  "./bolao-copa-2026-firebase.html",
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap",
];

// Instala e cacheia os assets principais
self.addEventListener("install", ev => {
  ev.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(ASSETS).catch(() => {}) // falha silenciosa em dev
    )
  );
  self.skipWaiting();
});

// Limpa caches antigos
self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: Network First para Firebase, Cache First para assets estáticos
self.addEventListener("fetch", ev => {
  const url = new URL(ev.request.url);

  // Firebase e APIs externas: sempre rede, sem cache
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("football-data.org") ||
    url.hostname.includes("esm.sh")
  ) {
    ev.respondWith(fetch(ev.request).catch(() => caches.match(ev.request)));
    return;
  }

  // Assets locais: Cache First com fallback de rede
  ev.respondWith(
    caches.match(ev.request).then(cached => {
      if (cached) return cached;
      return fetch(ev.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(ev.request, clone));
        }
        return resp;
      });
    })
  );
});
