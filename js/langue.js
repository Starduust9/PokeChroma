// Langue du site (français / anglais) : barre de menu, pied de page et choix du drapeau.
// Les pages elles-mêmes existent en deux versions : /pages/… (français) et /pages/en/… (anglais).
(function () {
  let langue = "fr";
  try {
    langue = localStorage.getItem("pc-langue") ||
      ((navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en");
  } catch (e) { /* stockage indisponible : français */ }
  window.PC_LANGUE = langue === "en" ? "en" : "fr";

  // textes anglais de la barre du haut et du pied de page (le français est dans index.html)
  const EN = {
    "nav.debuter": "Getting started",
    "nav.jeux": "Games",
    "nav.tous": "All games & Shiny Lock",
    "nav.parGen": "By generation",
    "nav.1G": "Gen 1 · Red, Blue, Yellow",
    "nav.2G": "Gen 2 · Gold, Silver, Crystal",
    "nav.3G": "Gen 3 · Ruby, Sapphire, Emerald, FR/LG",
    "nav.4G": "Gen 4 · Diamond, Pearl, Platinum, HG/SS",
    "nav.5G": "Gen 5 · Black, White, B2/W2",
    "nav.6G": "Gen 6 · X, Y, ORAS",
    "nav.7G": "Gen 7 · Sun, Moon, Let's Go",
    "nav.8G": "Gen 8 · Sword, Shield, BDSP, Arceus",
    "nav.9G": "Gen 9 · Scarlet, Violet, Z-A",
    "nav.methodes": "Methods",
    "nav.masuda": "Masuda",
    "nav.charme": "Shiny Charm",
    "nav.aide": "Helpful sites",
    "nav.streamers": "Streamers & YouTubers",
    "nav.contact": "Contact",
    "nav.compteur": "⬇ Shiny Counter",
    "pied.texte": "Simple tips, clear guides and useful info for every shiny hunter, from beginners to veterans ✨",
    "pied.liens": "Links",
    "pied.debuter": "Getting started",
    "pied.jeux": "Games",
    "pied.kofi": "❤ Support on Ko-fi",
    "pied.mentions": "Legal notice",
    "pied.fan": "This site is a fan project, made for fans. Thanks to <b>Sky_Lasth</b> for the help with the code and the site.",
    "pied.illus": "Some illustrations belong to The Pokémon Company. The shiny Rowlet artwork belongs to <a href=\"https://pin.it/5vtTFbc6J\" target=\"_blank\" rel=\"noopener\">milenagorosito</a> on Pinterest.",
    "pied.marques": "Pokémon and related names are trademarks of Nintendo, Creatures and GAME FREAK.",
  };

  function appliquer() {
    document.documentElement.lang = window.PC_LANGUE;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.dataset.fr === undefined) el.dataset.fr = el.innerHTML;     // texte français d'origine
      const cle = el.dataset.i18n;
      el.innerHTML = window.PC_LANGUE === "en" && EN[cle] ? EN[cle] : el.dataset.fr;
    });
    const drapeau = document.getElementById("pc-drapeau");
    if (drapeau) {
      drapeau.src = "/assets/picture/drapeau-" + window.PC_LANGUE + ".svg";
      drapeau.alt = window.PC_LANGUE === "en" ? "English" : "Français";
    }
    document.querySelectorAll("[data-langue]").forEach((el) =>
      el.classList.toggle("active", el.dataset.langue === window.PC_LANGUE));
  }

  window.pcChangerLangue = function (l) {
    window.PC_LANGUE = l === "en" ? "en" : "fr";
    try { localStorage.setItem("pc-langue", window.PC_LANGUE); } catch (e) { /* rien */ }
    appliquer();
    if (window.pcRechargerPage) window.pcRechargerPage();
  };
  window.pcAppliquerLangue = appliquer;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", appliquer);
  } else {
    appliquer();
  }
})();
