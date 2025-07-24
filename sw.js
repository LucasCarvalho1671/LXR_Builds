const CACHE_NAME = "assistente-meta-cache-v1.7"; // Mude a versão se alterar os arquivos
const urlsToCache = [
  "/",
  "/index.html",
  "/Style.css",
  "/script.js",
  "/manifest.json",
  "/assets/bg.jpg",
  "/assets/logo.png",
  // Ícones do manifest
  "/assets/icon-192x192.png",
  "/assets/icon-512x512.png",
  "/assets/maskable_icon.png",
  // NOVAS CAPAS DE JOGOS
  "/assets/valorant_capa.jpg",
  "/assets/lol_capa.jpg",
  "/assets/bdo_capa.jpg",
  "/assets/tft_capa.jpg",
  "/assets/delta_capa.jpg",
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
