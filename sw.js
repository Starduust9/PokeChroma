// Service worker PokéChroma : le site (et « Mes compteurs ») marche hors connexion.
// Pense à changer VERSION à chaque mise en ligne importante pour rafraîchir le cache.
const VERSION = "pc-v1";
const A_GARDER = [
  "/",
  "/manifest.webmanifest",
  "/scss/main.css",
  "/scss/pokechroma.css",
  "/assets/picture/Logo.png",
  "/assets/picture/Pok-Chroma-14-04-2025.png",
  "/assets/picture/GalarFond.png",
  "/assets/picture/SinnohFond.png",
  "/assets/picture/drapeau-fr.svg",
  "/assets/picture/drapeau-en.svg",
  "/assets/picture/icone-192.png",
  "/assets/picture/icone-512.png",
  "/assets/picture/favicon.ico",
  "/assets/picture/Regieleki.png",
  "/assets/picture/Xerneas.png",
  "/Router/Route.js",
  "/Router/allRoutes.js",
  "/Router/router.js",
  "/js/compteur.js",
  "/js/compteurs.js",
  "/js/contact.js",
  "/js/easteregg.js",
  "/js/langue.js",
  "/pages/404.html",
  "/pages/accueil.html",
  "/pages/compteur.html",
  "/pages/compteurs.html",
  "/pages/confidentialite.html",
  "/pages/contact.html",
  "/pages/introshinyhunting.html",
  "/pages/shinyhuntingjeu.html",
  "/pages/siteaide.html",
  "/pages/streameryoutuber.html",
  "/pages/page-gen/1G.html",
  "/pages/page-gen/2G.html",
  "/pages/page-gen/3G.html",
  "/pages/page-gen/4G.html",
  "/pages/page-gen/5G.html",
  "/pages/page-gen/6G.html",
  "/pages/page-gen/7G.html",
  "/pages/page-gen/8G.html",
  "/pages/page-gen/9G.html",
  "/pages/page-gen/charmechroma.html",
  "/pages/page-gen/masuda.html",
  "/pages/en/404.html",
  "/pages/en/accueil.html",
  "/pages/en/compteur.html",
  "/pages/en/compteurs.html",
  "/pages/en/confidentialite.html",
  "/pages/en/contact.html",
  "/pages/en/introshinyhunting.html",
  "/pages/en/shinyhuntingjeu.html",
  "/pages/en/siteaide.html",
  "/pages/en/streameryoutuber.html",
  "/pages/en/page-gen/1G.html",
  "/pages/en/page-gen/2G.html",
  "/pages/en/page-gen/3G.html",
  "/pages/en/page-gen/4G.html",
  "/pages/en/page-gen/5G.html",
  "/pages/en/page-gen/6G.html",
  "/pages/en/page-gen/7G.html",
  "/pages/en/page-gen/8G.html",
  "/pages/en/page-gen/9G.html",
  "/pages/en/page-gen/charmechroma.html",
  "/pages/en/page-gen/masuda.html"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) =>
    Promise.all(A_GARDER.map((url) => c.add(url).catch(() => null)))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((cles) =>
    Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Pages du site (/accueil, /3G…) : le réseau d'abord, sinon la coquille en cache
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => {
      caches.open(VERSION).then((c) => c.put("/", r.clone()));
      return r;
    }).catch(() => caches.match("/")));
    return;
  }

  // Fichiers du site : réponse immédiate depuis le cache, mise à jour en arrière-plan
  if (url.origin === self.location.origin) {
    e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((enCache) => {
      const reseau = fetch(req).then((r) => {
        if (r.ok) c.put(req, r.clone());
        return r;
      }).catch(() => enCache);
      return enCache || reseau;
    })));
    return;
  }

  // Bootstrap, polices… : le réseau d'abord, sinon la copie en cache
  if (["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)) {
    e.respondWith(fetch(req).then((r) => {
      const copie = r.clone();
      caches.open(VERSION).then((c) => c.put(req, copie));
      return r;
    }).catch(() => caches.match(req)));
  }
});
