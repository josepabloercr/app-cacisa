// Cambia versión para forzar actualización
const CACHE = "sheets-wa-pwa-v27";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./data.js",
  "./style.css",
  "./firebase-config.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Solo cachea peticiones GET locales
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  
  e.respondWith(
    caches.match(req).then(cached => {
      // Devuelve del caché si existe, sino lo busca en red
      return cached || fetch(req);
    })
  );
});