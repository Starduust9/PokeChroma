import Route from "./Route.js";
import { allRoutes, websiteName } from "./allRoutes.js";

// Création d'une route pour la page 404 (page introuvable)
const route404 = new Route("404", "Page introuvable", "/pages/404.html");

// Fonction pour récupérer la route correspondant à une URL donnée
const getRouteByUrl = (url) => {
  let currentRoute = null;
  // Parcours de toutes les routes pour trouver la correspondance
  allRoutes.forEach((element) => {
    if (element.url == url) {
      currentRoute = element;
    }
  });
  // Si aucune correspondance n'est trouvée, on retourne la route 404
  if (currentRoute != null) {
    return currentRoute;
  } else {
    return route404;
  }
};

// Fonction pour charger le contenu de la page
const LoadContentPage = async () => {
  const path = window.location.pathname;
  // Récupération de l'URL actuelle
  const actualRoute = getRouteByUrl(path);
  // Récupération du contenu HTML de la route (version anglaise si elle existe)
  let html = null;
  if (window.PC_LANGUE === "en") {
    const r = await fetch(actualRoute.pathHtml.replace("/pages/", "/pages/en/"));
    if (r.ok) html = await r.text();
  }
  if (html === null) html = await fetch(actualRoute.pathHtml).then((data) => data.text());
  // Ajout du contenu HTML à l'élément avec l'ID "main-page"
  document.getElementById("main-page").innerHTML = html;

  // Ajout du contenu JavaScript
  if (actualRoute.pathJS != "") {
    // Création d'une balise script
    var scriptTag = document.createElement("script");
    scriptTag.setAttribute("type", "text/javascript");
    scriptTag.setAttribute("src", actualRoute.pathJS);

    // Ajout de la balise script au corps du document
    document.querySelector("body").appendChild(scriptTag);
  }

  // Changement du titre de la page
  document.title = ((window.PC_LANGUE === "en" && actualRoute.titleEn) || actualRoute.title) +
    " - " + websiteName;

  // Page ouverte mise en avant dans le menu
  document.querySelectorAll(".pc-nav .nav-link, .pc-nav .dropdown-item").forEach((lien) => {
    const actif = lien.getAttribute("href") === path ||
      (lien.classList.contains("dropdown-toggle") &&
       [...lien.parentElement.querySelectorAll(".dropdown-item")]
         .some((d) => d.getAttribute("href") === path));
    lien.classList.toggle("active", actif);
  });
  // Application « Compteurs » installée : plein écran, sans le menu du site
  const enApp = window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  document.body.classList.toggle("pc-mode-app", enApp && path.indexOf("/compteurs") === 0);
  const titreApple = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (titreApple) {
    titreApple.content = path.indexOf("/compteurs") === 0 ? "Compteurs" : "PokéChroma";
  }

  const annee = document.getElementById("pc-annee");
  if (annee) annee.textContent = new Date().getFullYear();
};

// Fonction pour gérer les événements de routage (clic sur les liens)
const routeEvent = (event) => {
  event = event || window.event;
  event.preventDefault();
  // Mise à jour de l'URL dans l'historique du navigateur
  window.history.pushState({}, "", event.target.href);
  // Chargement du contenu de la nouvelle page
  LoadContentPage();
};

// Gestion de l'événement de retour en arrière dans l'historique du navigateur
window.onpopstate = LoadContentPage;
// Assignation de la fonction routeEvent à la propriété route de la fenêtre
window.route = routeEvent;
// Changement de langue : on recharge le contenu de la page sans recharger le site
window.pcRechargerPage = LoadContentPage;
// Chargement du contenu de la page au chargement initial
LoadContentPage();