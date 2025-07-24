const CACHE_NAME = "assistente-meta-cache-v1.2"; // Nome do seu cache, mude a versão se alterar os arquivos
const urlsToCache = [
  "/",
  "/index.html",
  "/Style.css",
  "/script.js",
  "/manifest.json",
  "/assets/bg.jpg", // Sua imagem de fundo
  "/assets/logo.png", // Sua logo
  // Adicione todos os ícones que você listou no manifest.json
  "/assets/icon-192x192.png",
  "/assets/icon-512x512.png",
  "/assets/maskable_icon.png",
  // Se você estiver usando showdown.min.js de um CDN, adicione-o aqui
  "https://unpkg.com/showdown/dist/showdown.min.js",
];

// Evento 'install': Ocorre quando o Service Worker é instalado.
// Usamos para armazenar em cache os recursos estáticos do aplicativo.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache aberto");
        return cache.addAll(urlsToCache); // Adiciona todos os URLs à cache
      })
      .catch((error) => {
        console.error(
          "Falha ao adicionar ao cache durante a instalação:",
          error
        );
      })
  );
});

// Evento 'fetch': Intercepta requisições de rede.
// Usamos para servir recursos do cache se disponíveis, ou buscar na rede.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se o recurso estiver no cache, retorna-o
      if (response) {
        return response;
      }
      // Caso contrário, busca o recurso na rede
      return fetch(event.request)
        .then((networkResponse) => {
          // Verifica se a resposta da rede é válida antes de cloná-la e armazená-la em cache
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }
          // Clona a resposta para que possamos consumi-la e também colocá-la no cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch((error) => {
          console.error("Erro ao buscar recurso:", error);
          // Aqui você pode retornar uma página offline personalizada se quiser
          // return caches.match('/offline.html');
        });
    })
  );
});

// Evento 'activate': Ocorre quando o Service Worker é ativado.
// Usamos para limpar caches antigos.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deletando cache antigo:", cacheName);
            return caches.delete(cacheName); // Deleta caches que não correspondem ao CACHE_NAME atual
          }
        })
      );
    })
  );
});
