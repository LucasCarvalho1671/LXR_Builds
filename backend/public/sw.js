const CACHE_NAME = "assistente-meta-cache-v2.43"; // Mude a versão se alterar os arquivos
const urlsToCache = [
  "/",
  "/index.html",
  "/Style.css",
  "/script.js",
  "/manifest.json",
  "/img/bg.jpg",
  "/img/logo.png",
  // Ícones do manifest
  "/img/icon-192x192.png",
  "/img/icon-512x512.png",
  "/img/maskable_icon.png",
  // NOVAS CAPAS DE JOGOS
  "/img/valorant_capa.jpg",
  "/img/lol_capa.jpg",
  "/img/bdo_capa.jpg",
  "/img/tft_capa.jpg",
  "/img/delta_capa.jpg",
  "https://unpkg.com/showdown/dist/showdown.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache aberto");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error(
          "Falha ao adicionar ao cache durante a instalação:",
          error
        );
      })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch((error) => {
          console.error("Erro ao buscar recurso:", error);
          // return caches.match('/offline.html'); // Opcional: página offline
        });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deletando cache antigo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
