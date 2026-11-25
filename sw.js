// Service worker PokéChroma : le site (et « Mes compteurs ») marche hors connexion.
// Pense à changer VERSION à chaque mise en ligne importante pour rafraîchir le cache.
const VERSION = "pc-v42";
const A_GARDER = [
  "/",
  "/manifest.webmanifest",
  "/manifest-compteurs.webmanifest",
  "/scss/main.css",
  "/scss/pokechroma.css",
  "/assets/picture/favicon.ico",
  "/assets/picture/icone-192.png",
  "/assets/picture/icone-512.png",
  "/assets/picture/drapeau-fr.svg",
  "/assets/picture/drapeau-en.svg",
  "/assets/picture/Logo.png",
  "/assets/data/tutos.json",
  "/assets/data/noms_pokemon.json",
  "/assets/data/methodes.json",
  "/assets/data/evolutions.json",
  "/Router/Route.js",
  "/Router/allRoutes.js",
  "/Router/router.js",
  "/js/aide.js",
  "/js/compte.js",
  "/js/compteur.js",
  "/js/compteurs.js",
  "/js/contact.js",
  "/js/easteregg.js",
  "/js/joueurs.js",
  "/js/langue.js",
  "/js/profil.js",
  "/js/pubs.js",
  "/pages/404.html",
  "/pages/accueil.html",
  "/pages/compteur.html",
  "/pages/compteurs.html",
  "/pages/confidentialite.html",
  "/pages/contact.html",
  "/pages/guides.html",
  "/pages/introshinyhunting.html",
  "/pages/joueurs.html",
  "/pages/profil.html",
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
  "/pages/en/guides.html",
  "/pages/en/introshinyhunting.html",
  "/pages/en/joueurs.html",
  "/pages/en/profil.html",
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

// Images des guides : téléchargées seulement quand le site est installé comme application
const IMAGES = [
  "/assets/legendaire-gen/Korraidon shiny.png",
  "/assets/legendaire-gen/Miraidon shiny.png",
  "/assets/legendaire-gen/Sprite_Dialga_chromatique.png",
  "/assets/legendaire-gen/Sprite_Ho-oH_chromatique.png",
  "/assets/legendaire-gen/Sprite_Latias_chromatique.png",
  "/assets/legendaire-gen/Sprite_Latios_chromatique.png",
  "/assets/legendaire-gen/Sprite_Lugia_chromatique.png",
  "/assets/legendaire-gen/Sprite_Lunala_chromatique.png",
  "/assets/legendaire-gen/Sprite_Mewtwo_chromatique.png",
  "/assets/legendaire-gen/Sprite_Palkia_chromatique.png",
  "/assets/legendaire-gen/Sprite_Solgaleo_chromatique.png",
  "/assets/legendaire-gen/Sprite_Xerneas_chromatique.png",
  "/assets/legendaire-gen/Sprite_Yveltal_chromatique.png",
  "/assets/legendaire-gen/Sprite_Zacian_chromatique.png",
  "/assets/legendaire-gen/Sprite_Zamazenta_chromatique.png",
  "/assets/logo jeux/1G/Pokémon_Jaune.png",
  "/assets/logo jeux/1G/pokemon_verte.jpg",
  "/assets/logo jeux/1G/pokmon_rouge-bleu.webp",
  "/assets/logo jeux/2G/Pokémon_Argent.png",
  "/assets/logo jeux/2G/Pokémon_Cristal.png",
  "/assets/logo jeux/2G/Pokémon_Or.png",
  "/assets/logo jeux/3G/Pokémon_Rouge_Feu.png",
  "/assets/logo jeux/3G/Pokémon_Rubis.png",
  "/assets/logo jeux/3G/Pokémon_Saphir.png",
  "/assets/logo jeux/3G/Pokémon_Vert_Feuille.png",
  "/assets/logo jeux/3G/Pokémon_Émeraude.png",
  "/assets/logo jeux/4G/Pokémon_Argent_SoulSilver.png",
  "/assets/logo jeux/4G/Pokémon_Diamant.png",
  "/assets/logo jeux/4G/Pokémon_Or_HeartGold.png",
  "/assets/logo jeux/4G/Pokémon_Perle.png",
  "/assets/logo jeux/4G/Pokémon_Platine.png",
  "/assets/logo jeux/5G/Pokémon_Blanc.png",
  "/assets/logo jeux/5G/Pokémon_Blanche_2.jpeg",
  "/assets/logo jeux/5G/Pokémon_Noir.png",
  "/assets/logo jeux/5G/Pokémon_Noire_2.jpeg",
  "/assets/logo jeux/6G/Pokémon_Rubis_Oméga.png",
  "/assets/logo jeux/6G/Pokémon_Saphir_Alpha.png",
  "/assets/logo jeux/6G/Pokémon_X.png",
  "/assets/logo jeux/6G/Pokémon_Y.png",
  "/assets/logo jeux/7G/Pokémon_Let's_Go_Pikachu.png",
  "/assets/logo jeux/7G/Pokémon_Let's_Go_Évoli.png",
  "/assets/logo jeux/7G/Pokémon_Lune.png",
  "/assets/logo jeux/7G/Pokémon_Soleil.png",
  "/assets/logo jeux/7G/Pokémon_Ultra-Lune.jpg",
  "/assets/logo jeux/7G/Pokémon_Ultra-Soleil.jpg",
  "/assets/logo jeux/8G/Légendes_Pokémon_Arceus.png",
  "/assets/logo jeux/8G/Pokémon_Bouclier.png",
  "/assets/logo jeux/8G/Pokémon_Diamant_Étincelant.png",
  "/assets/logo jeux/8G/Pokémon_Perle_Scintillante.png",
  "/assets/logo jeux/8G/Pokémon_Épée.png",
  "/assets/logo jeux/9G/Légendes_Pokémon_-_Z-A_Logo.png",
  "/assets/logo jeux/9G/Légendes_Pokémon_Z-A_Nintendo_Switch_2_Edition.png",
  "/assets/logo jeux/9G/Pokémon_Violet.png",
  "/assets/logo jeux/9G/Pokémon_Écarlate.png",
  "/assets/picture/454px-Luth-HGSS.png",
  "/assets/picture/Brindibou.png",
  "/assets/picture/GalarFond.png",
  "/assets/picture/Pok-Chroma-14-04-2025.png",
  "/assets/picture/Regieleki.png",
  "/assets/picture/Serena.png",
  "/assets/picture/SinnohFond.png",
  "/assets/picture/SpriteAspicot_chromatique_E.gif",
  "/assets/picture/SpriteBulbizarre_chromatique_RFVF.png",
  "/assets/picture/SpriteCarapuce_chromatique_RFVF.png",
  "/assets/picture/SpriteCharmeChroma_NB2.png",
  "/assets/picture/SpriteEntai_chromatique_RS.png",
  "/assets/picture/SpriteMedhyèna_chromatique_E.gif",
  "/assets/picture/SpriteMewShiny.png",
  "/assets/picture/SpriteOssatueur_chromatique_E.gif",
  "/assets/picture/SpriteRaichuAlola.png",
  "/assets/picture/SpriteRaichuAlolaShiny.png",
  "/assets/picture/SpriteRaikou_chromatique_RS.png",
  "/assets/picture/SpriteSalamèche_chromatique_RFVF.png",
  "/assets/picture/SpriteSuicune_chromatique_RS.png",
  "/assets/picture/SpriteTarsal_chromatique_E.gif",
  "/assets/picture/SpriteZigzaton_chromatique_E.gif",
  "/assets/picture/Sprite_Œuf_OA.png",
  "/assets/picture/Xerneas.png",
  "/assets/picture/compteur/chasses.jpg",
  "/assets/picture/compteur/entrainement-3d.jpg",
  "/assets/picture/compteur/logo-compteur.png",
  "/assets/picture/compteur/mes-chromatiques.jpg",
  "/assets/picture/compteur/statistiques.jpg",
  "/assets/picture/fgsh-Image.png",
  "/assets/picture/fgsh-Shiny.png",
  "/assets/picture/herbeshiny.png",
  "/assets/picture/legendsarceusshinysound.mp3",
  "/assets/picture/pokeradartuto.png",
  "/assets/picture/relancePokeradar.png"
];

self.addEventListener("message", (e) => {
  if (e.data === "pc-tout-garder") {
    e.waitUntil(caches.open(VERSION).then((c) =>
      Promise.all(IMAGES.map((url) => c.match(url).then((deja) => deja || c.add(url).catch(() => null))))));
  }
});

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
    // (une requête de navigation ne peut pas être recopiée avec des options : on refait l'adresse)
    e.respondWith(fetch(req.url, { cache: "no-cache" }).then((r) => {
      caches.open(VERSION).then((c) => c.put("/", r.clone()));
      return r;
    }).catch(() => caches.match("/")));
    return;
  }

  if (url.origin === self.location.origin) {
    // Images : depuis le cache (elles ne changent presque jamais), sinon le réseau
    if (/\.(png|jpe?g|gif|webp|svg|ico|mp3)$/i.test(url.pathname)) {
      e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((enCache) =>
        enCache || fetch(req).then((r) => {
          if (r.ok) c.put(req, r.clone());
          return r;
        }))));
      return;
    }
    // Pages, scripts, styles : toujours la dernière version en ligne, le cache hors connexion
    e.respondWith(fetch(req, { cache: "no-cache" }).then((r) => {
      if (r.ok) {
        const copie = r.clone();
        caches.open(VERSION).then((c) => c.put(req, copie));
      }
      return r;
    }).catch(() => caches.match(req)));
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
