// Publicités du site (Google AdSense), placées à la main pour rester discrètes :
//  - guides : 1 au milieu du texte + 1 à la fin ;
//  - accueil et page Guides : 1 en bas ;
//  - Mes chasses : 1 petite en bas, sous les cartes (jamais dans l'écran de comptage) ;
//  - aucune ailleurs (profil, joueurs, contact, confidentialité, téléchargement du compteur).
// Rien ne s'affiche tant que les numéros de blocs (BLOC_*) sont vides.
(function () {
  const CLIENT = "ca-pub-9465038992038625";
  const BLOC_GUIDES = "";     // bloc « Guides » (data-ad-slot), à remplir après validation AdSense
  const BLOC_BAS = "";      // bloc « Bas de page » (data-ad-slot)

  const GUIDES = ["/1G", "/2G", "/3G", "/4G", "/5G", "/6G", "/7G", "/8G", "/9G", "/masuda",
    "/charmechroma", "/introshinyhunting", "/shinyhuntingjeu"];
  const BAS = ["/", "/accueil", "/guides"];

  function bloc(numero, classe) {
    const d = document.createElement("div");
    d.className = "pc-pub " + (classe || "");
    d.innerHTML = `<span class="pc-pub-etiquette">${window.PC_LANGUE === "en" ? "Advertisement" : "Publicité"}</span>
      <ins class="adsbygoogle" style="display:block" data-ad-client="${CLIENT}" data-ad-slot="${numero}"
           data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    return d;
  }
  function remplir(d) {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { d.remove(); }
  }

  window.pcPlacerPubs = function (chemin) {
    document.querySelectorAll("#main-page .pc-pub").forEach((p) => p.remove());
    const blocs = [...document.querySelectorAll("#main-page .response-container")];
    if (!blocs.length) return;
    const poser = (apres, numero, classe) => {
      if (!numero || !apres) return;
      const d = bloc(numero, classe);
      apres.insertAdjacentElement("afterend", d);
      remplir(d);
    };
    if (GUIDES.includes(chemin)) {
      if (blocs.length >= 3) poser(blocs[Math.floor(blocs.length / 2) - 1], BLOC_GUIDES);
      poser(blocs[blocs.length - 1], BLOC_GUIDES);
    } else if (BAS.includes(chemin)) {
      poser(blocs[blocs.length - 1], BLOC_BAS);
    } else if (chemin === "/compteurs") {
      // sous le bloc des chasses (pas sous l'aide à l'installation, cachée dans l'app installée)
      poser(blocs[0], BLOC_BAS, "pc-pub-petite");
    }
  };
})();
