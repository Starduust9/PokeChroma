// « Mes compteurs » : compteurs de chasse manuels, gardés sur l'appareil (fonctionne hors ligne).
(function () {
  const EN = window.PC_LANGUE === "en";
  const T = (fr, en) => (EN ? en : fr);
  const CLE = "pc-compteurs";
  const zone = document.getElementById("pc-compteurs");
  if (!zone) return;

  const TAUX = [8192, 4096, 2731, 1365, 1024, 683, 512, 315, 273, 128];
  const JEUX = EN
    ? ["Red / Blue / Yellow", "Gold / Silver / Crystal", "Ruby / Sapphire / Emerald", "FireRed / LeafGreen",
       "Diamond / Pearl / Platinum", "HeartGold / SoulSilver", "Black / White", "Black 2 / White 2",
       "X / Y", "Omega Ruby / Alpha Sapphire", "Sun / Moon", "Ultra Sun / Ultra Moon",
       "Let's Go Pikachu / Eevee", "Sword / Shield", "Brilliant Diamond / Shining Pearl",
       "Legends: Arceus", "Scarlet / Violet", "Legends: Z-A", "Other"]
    : ["Rouge / Bleu / Jaune", "Or / Argent / Cristal", "Rubis / Saphir / Émeraude", "Rouge Feu / Vert Feuille",
       "Diamant / Perle / Platine", "Or HeartGold / Argent SoulSilver", "Noir / Blanc", "Noir 2 / Blanc 2",
       "X / Y", "Rubis Oméga / Saphir Alpha", "Soleil / Lune", "Ultra-Soleil / Ultra-Lune",
       "Let's Go Pikachu / Évoli", "Épée / Bouclier", "Diamant Étincelant / Perle Scintillante",
       "Légendes Pokémon : Arceus", "Écarlate / Violet", "Légendes Pokémon : Z-A", "Autre"];

  const lire = () => {
    try { return JSON.parse(localStorage.getItem(CLE)) || []; } catch (e) { return []; }
  };
  const ecrire = (l) => {
    try { localStorage.setItem(CLE, JSON.stringify(l)); } catch (e) { /* stockage plein ou bloqué */ }
  };
  const nb = (n) => n.toLocaleString(EN ? "en-US" : "fr-FR");
  const echappe = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---- formulaire « nouveau compteur »
  const selJeu = document.getElementById("pc-c-jeu");
  const selTaux = document.getElementById("pc-c-taux");
  JEUX.forEach((j) => selJeu.add(new Option(j, j)));
  TAUX.forEach((t) => selTaux.add(new Option("1/" + t, t)));
  selTaux.value = "4096";
  document.getElementById("pc-c-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const nom = document.getElementById("pc-c-nom").value.trim();
    if (!nom) return;
    const l = lire();
    l.unshift({ id: Date.now().toString(36), pokemon: nom, jeu: selJeu.value,
                taux: +selTaux.value, pas: 1, compteur: 0, phases: [], cree: new Date().toISOString() });
    ecrire(l);
    document.getElementById("pc-c-nom").value = "";
    afficher();
  });

  function changer(id, fn) {
    const l = lire();
    const c = l.find((x) => x.id === id);
    if (!c) return;
    fn(c, l);
    c.maj = new Date().toISOString();
    ecrire(l.filter((x) => !x.supprime));
    afficher();
  }

  function afficher() {
    const zone = document.getElementById("pc-compteurs");   // l'élément change à chaque visite
    if (!zone) return;
    const l = lire();
    if (!l.length) {
      zone.innerHTML = '<p class="pc-intro">' + T("Aucun compteur pour l'instant : crée ton premier ci-dessus ✨",
        "No counter yet: create your first one above ✨") + "</p>";
      return;
    }
    zone.innerHTML = l.map((c) => `
      <div class="pc-carte pc-compteur" data-id="${c.id}">
        <div class="pc-compteur-haut">
          <div>
            <h3>${echappe(c.pokemon)}</h3>
            <p>${echappe(c.jeu)} · <span class="pc-taux">1/${c.taux}</span>${c.phases.length ? " · " +
              T("phase ", "phase ") + (c.phases.length + 1) : ""}</p>
          </div>
          <button class="pc-c-menu" data-action="menu" title="${T("Options", "Options")}">⋯</button>
        </div>
        <div class="pc-compteur-valeur">${nb(c.compteur)}</div>
        <div class="pc-compteur-boutons">
          <button data-action="moins">−${c.pas}</button>
          <button class="pc-plus" data-action="plus">+${c.pas}</button>
        </div>
        <div class="pc-compteur-options" hidden>
          <button data-action="shiny">✨ ${T("Shiny trouvé (nouvelle phase)", "Shiny found (new phase)")}</button>
          <button data-action="pas">${T("Pas de", "Step of")} +${c.pas === 1 ? 5 : 1}</button>
          <button data-action="modifier">✏️ ${T("Modifier le nombre", "Edit the count")}</button>
          <button data-action="zero">↺ ${T("Remettre à zéro", "Reset to zero")}</button>
          <button class="pc-danger" data-action="supprimer">🗑 ${T("Supprimer", "Delete")}</button>
        </div>
        ${c.phases.length ? `<p class="pc-phases">${T("Phases précédentes", "Previous phases")} : ${c.phases
          .map((p) => nb(p)).join(", ")}</p>` : ""}
      </div>`).join("");
  }

  zone.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-action]");
    if (!b) return;
    const carte = b.closest(".pc-compteur");
    const id = carte.dataset.id;
    switch (b.dataset.action) {
      case "plus": changer(id, (c) => { c.compteur += c.pas; }); break;
      case "moins": changer(id, (c) => { c.compteur = Math.max(0, c.compteur - c.pas); }); break;
      case "menu": carte.querySelector(".pc-compteur-options").hidden ^= true; break;
      case "pas": changer(id, (c) => { c.pas = c.pas === 1 ? 5 : 1; }); break;
      case "shiny":
        if (confirm(T("Bravo ! On enregistre ce shiny et on recommence une nouvelle phase à 0 ?",
                      "Congrats! Save this shiny and start a new phase from 0?")))
          changer(id, (c) => { c.phases.push(c.compteur); c.compteur = 0; });
        break;
      case "modifier": {
        const v = prompt(T("Nouveau nombre de rencontres :", "New encounter count:"));
        if (v !== null && /^\d+$/.test(v.trim())) changer(id, (c) => { c.compteur = parseInt(v, 10); });
        break;
      }
      case "zero":
        if (confirm(T("Remettre ce compteur à zéro ?", "Reset this counter to zero?")))
          changer(id, (c) => { c.compteur = 0; });
        break;
      case "supprimer":
        if (confirm(T("Supprimer ce compteur ?", "Delete this counter?")))
          changer(id, (c) => { c.supprime = true; });
        break;
    }
  });

  // ---- bouton « Installer l'application » : toujours visible (sauf dans l'app installée).
  // Si le navigateur propose sa fenêtre d'installation (Android / PC), on l'ouvre ;
  // sinon (iPhone, Firefox…), on ouvre les étapes qui correspondent à l'appareil.
  const bt = document.getElementById("pc-installer");
  const dejaInstallee = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const montrerEtapes = () => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const id = ios ? "pc-a-ios" : /Android/.test(ua) ? "pc-a-android" : "pc-a-pc";
    const bloc = document.getElementById(id);
    if (bloc && window.bootstrap) window.bootstrap.Collapse.getOrCreateInstance(bloc, { toggle: false }).show();
    else if (bloc) bloc.classList.add("show");
    const aide = document.getElementById("pc-aide-installation");
    if (aide) setTimeout(() => aide.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return aide;
  };
  if (bt && !dejaInstallee) {
    bt.hidden = false;
    bt.addEventListener("click", async () => {
      if (window.pcInvitation) {
        window.pcInvitation.prompt();
        await window.pcInvitation.userChoice;
        window.pcInvitation = null;
      } else {
        montrerEtapes();
      }
    });
    // arrivée depuis le bouton « Installer les compteurs » de la page Compteur
    // (deuxième défilement : la page peut encore bouger pendant le chargement des images)
    if (new URLSearchParams(location.search).has("installer")) {
      setTimeout(montrerEtapes, 300);
      setTimeout(() => {
        const aide = document.getElementById("pc-aide-installation");
        if (aide && aide.getBoundingClientRect().top > 200) aide.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 1200);
    }
  }
  const lienAide = document.querySelector(".pc-lien-aide");
  if (lienAide) lienAide.onclick = (e) => { e.preventDefault(); montrerEtapes(); };

  // Espace ou + sur le clavier : +1 sur le premier compteur (écouteur ajouté une seule fois)
  window.pcCompteursChanger = changer;
  if (!window.pcCompteursClavier) {
    window.pcCompteursClavier = true;
    document.addEventListener("keydown", (e) => {
    if (!document.getElementById("pc-compteurs")) return;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    const premier = lire()[0];
    if (!premier) return;
    const ch = window.pcCompteursChanger;
    if (e.key === " " || e.key === "+") { e.preventDefault(); ch(premier.id, (c) => { c.compteur += c.pas; }); }
    if (e.key === "-") { e.preventDefault(); ch(premier.id, (c) => { c.compteur = Math.max(0, c.compteur - c.pas); }); }
    });
  }


  afficher();
})();
