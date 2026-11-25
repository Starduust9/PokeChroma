// Compte PokéChroma sur le site : le même compte (Discord ou Google) que dans PokéChroma Counter.
// La base est Supabase ; la clé ci-dessous est la clé PUBLIQUE (faite pour être dans le site),
// la sécurité est assurée par les règles de la base (chacun ne modifie que ses propres données).
(function () {
  const URL_SUPA = "https://jdibarvfsshncdzlqibh.supabase.co";
  const CLE_PUBLIQUE = "sb_publishable_CbDSLS4ogiYqs1_GYXFrQA_cx3Omw39";

  window.pcCompte = { session: null, profil: null, pret: false };
  window.pcSupa = window.supabase
    ? window.supabase.createClient(URL_SUPA, CLE_PUBLIQUE, {
        auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true,
                detectSessionInUrl: true, storageKey: "pc-session" },
      })
    : null;

  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  window.pcEchapper = esc;

  // jeux et méthodes du compteur PC (mêmes noms partout, pour que les chasses se retrouvent)
  window.pcJeux = [
    ["9G", [["Légendes Pokémon : Z-A", "Pokémon Legends: Z-A"], ["Pokémon Écarlate", "Pokémon Scarlet"], ["Pokémon Violet", "Pokémon Violet"]]],
    ["8G", [["Légendes Pokémon : Arceus", "Pokémon Legends: Arceus"], ["Pokémon Diamant Étincelant", "Pokémon Brilliant Diamond"],
            ["Pokémon Perle Scintillante", "Pokémon Shining Pearl"], ["Pokémon Épée", "Pokémon Sword"], ["Pokémon Bouclier", "Pokémon Shield"]]],
    ["7G", [["Pokémon Let's Go Pikachu", "Pokémon Let's Go Pikachu"], ["Pokémon Let's Go Évoli", "Pokémon Let's Go Eevee"],
            ["Pokémon Ultra-Soleil", "Pokémon Ultra Sun"], ["Pokémon Ultra-Lune", "Pokémon Ultra Moon"],
            ["Pokémon Soleil", "Pokémon Sun"], ["Pokémon Lune", "Pokémon Moon"]]],
    ["6G", [["Pokémon Rubis Oméga", "Pokémon Omega Ruby"], ["Pokémon Saphir Alpha", "Pokémon Alpha Sapphire"],
            ["Pokémon X", "Pokémon X"], ["Pokémon Y", "Pokémon Y"]]],
    ["5G", [["Pokémon Noir 2", "Pokémon Black 2"], ["Pokémon Blanc 2", "Pokémon White 2"], ["Pokémon Noir", "Pokémon Black"], ["Pokémon Blanc", "Pokémon White"]]],
    ["4G", [["Pokémon Or HeartGold", "Pokémon HeartGold"], ["Pokémon Argent SoulSilver", "Pokémon SoulSilver"],
            ["Pokémon Platine", "Pokémon Platinum"], ["Pokémon Diamant", "Pokémon Diamond"], ["Pokémon Perle", "Pokémon Pearl"]]],
    ["3G", [["Pokémon Rouge Feu", "Pokémon FireRed"], ["Pokémon Vert Feuille", "Pokémon LeafGreen"], ["Pokémon Émeraude", "Pokémon Emerald"],
            ["Pokémon Rubis", "Pokémon Ruby"], ["Pokémon Saphir", "Pokémon Sapphire"]]],
    ["2G", [["Pokémon Cristal", "Pokémon Crystal"], ["Pokémon Or", "Pokémon Gold"], ["Pokémon Argent", "Pokémon Silver"]]],
    ["1G", [["Pokémon Jaune", "Pokémon Yellow"], ["Pokémon Rouge", "Pokémon Red"], ["Pokémon Bleu", "Pokémon Blue"]]],
  ];
  window.pcMethodes = {
    en: ["Encounters", "Resets", "Runaways", "Eggs", "Masuda", "Eggs from a shiny parent", "Poké Radar (chain)", "Chain fishing", "Friend Safari", "Hordes", "DexNav (chain)", "SOS chaining", "Catch combo (Let's Go)", "Number battled (Sword / Shield)", "Dynamax Adventure", "Mass outbreak (Arceus)", "Massive mass outbreak (Arceus)", "Mass outbreaks", "Sparkling Power (sandwich)"],
    fr: ["Rencontres", "Resets", "Fuites", "Œufs", "Masuda", "Œufs d'un parent chromatique", "Pokéradar (chaîne)", "Pêche à la chaîne", "Safari des Amis", "Hordes", "Navidex (chaîne)", "Chaîne SOS", "Combo de captures (Let's Go)", "Compteur de K.O. (Épée / Bouclier)", "Raid Dynamax Aventure", "Apparition massive (Arceus)", "Apparition massive spéciale (Arceus)", "Apparitions massives", "Pouvoir Brillance (sandwich)"] };

  // ---- sprites des Pokémon (mêmes images que dans le compteur : PokeAPI)
  const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/";
  let NOMS = null;
  const normaliser = (t) => String(t || "").normalize("NFKD").toLowerCase()
    .replace(/\p{M}/gu, "").replace(/[^a-z0-9]/g, "");
  window.pcNormaliser = normaliser;
  window.pcNomsPrets = fetch("/assets/data/noms_pokemon.json").then((r) => r.json())
    .then((n) => { NOMS = n; majMenu(); return n; }).catch(() => { NOMS = {}; return NOMS; });
  // « Fantominus » → 92 ; « Zorua de Hisui » → la forme de Hisui (comme dans le compteur)
  window.pcNumero = function (nom) {
    if (!NOMS) return null;
    const n = normaliser(nom);
    if (NOMS[n]) return NOMS[n];
    const mots = String(nom || "").split(/[\s\-_()/,.]+/).filter(Boolean);
    for (let i = mots.length; i > 0; i--) {
      const m = normaliser(mots.slice(0, i).join(""));
      if (NOMS[m]) return NOMS[m];
    }
    for (const mot of mots) if (NOMS[normaliser(mot)]) return NOMS[normaliser(mot)];
    return null;
  };
  // sprites du jeu (comme le compteur PC) : pixel art des anciens jeux, animés de Noir / Blanc,
  // rendus HOME pour les jeux récents ou inconnus
  const SPRITES_JEUX = [
    [["diamantetincelant", "perlescintillante", "brilliantdiamond", "shiningpearl", "bdsp", "epee", "bouclier",
      "sword", "shield", "arceus", "legends", "legendes", "ecarlate", "violet", "scarlet", "letsgo", "za",
      "soleil", "lune", "sun", "moon", "ultra"], null],
    [["rougefeu", "vertfeuille", "firered", "leafgreen", "frlg", "rf", "vf"], "versions/generation-iii/firered-leafgreen/shiny/{n}.png"],
    [["emeraude", "emerald"], "versions/generation-iii/emerald/shiny/{n}.png"],
    [["rubisomega", "saphiralpha", "omegaruby", "alphasapphire", "oras", "x", "y", "xy"], "versions/generation-vi/x-y/shiny/{n}.png"],
    [["rubis", "saphir", "ruby", "sapphire"], "versions/generation-iii/ruby-sapphire/shiny/{n}.png"],
    [["heartgold", "hearthgold", "soulsilver", "hgss"], "versions/generation-iv/heartgold-soulsilver/shiny/{n}.png"],
    [["platine", "platinum"], "versions/generation-iv/platinum/shiny/{n}.png"],
    [["diamant", "perle", "diamond", "pearl"], "versions/generation-iv/diamond-pearl/shiny/{n}.png"],
    [["noir", "blanc", "black", "white", "n2b2", "bw"], "versions/generation-v/black-white/animated/shiny/{n}.gif"],
    [["cristal", "crystal"], "versions/generation-ii/crystal/shiny/{n}.png"],
    [["or", "argent", "gold", "silver"], "versions/generation-ii/gold/shiny/{n}.png"],
  ];
  function modeleSprite(jeu) {
    const complet = normaliser(jeu);
    if (!complet) return null;
    const mots = new Set([...String(jeu).split(/[\s\-_()/,.&+:]+/), ...String(jeu).split(/[\s()/,:]+/)]
      .filter(Boolean).map(normaliser));
    const t = SPRITES_JEUX.find(([cles]) => cles.some((c) => mots.has(c) || (c.length >= 5 && complet.includes(c))));
    return t ? t[1] : null;
  }
  // image chromatique : celle du jeu indiqué (s'il y en a une), sinon le rendu HOME
  window.pcSprite = function (nom, jeu) {
    const num = window.pcNumero(nom);
    if (!num) return "";
    const modele = jeu ? modeleSprite(jeu) : null;
    return SPRITES + "pokemon/" + (modele ? modele.replace("{n}", num) : "other/home/shiny/" + num + ".png");
  };
  // image absente : sprite du jeu -> rendu HOME -> pixel art chromatique
  window.pcSpriteSecours = function (img) {
    const m = /\/(\d+)\.(png|gif)$/.exec(img.src);
    if (m && img.src.indexOf("/versions/") > 0) { img.src = SPRITES + "pokemon/other/home/shiny/" + m[1] + ".png"; return; }
    img.onerror = null;
    if (m && img.src.indexOf("/home/") > 0) img.src = SPRITES + "pokemon/shiny/" + m[1] + ".png";
    else img.style.visibility = "hidden";
  };
  // ---- noms de Pokémon proposés pendant qu'on tape (nouvelle chasse, modifier une chasse,
  // ajouter un shiny) : évite les fautes d'orthographe. Liste : assets/data/evolutions.json
  let NOMS_SUGG = null;
  const chargerNomsSugg = () => NOMS_SUGG ? Promise.resolve(NOMS_SUGG) : fetch("/assets/data/evolutions.json")
    .then((r) => r.json()).then((d) => (NOMS_SUGG = Object.values(d.especes || {}).map((e) => ({
      nom: (window.PC_LANGUE === "en" ? e.en : e.fr) || e.fr, cles: [normaliser(e.fr), normaliser(e.en)] }))
      .filter((x) => x.nom)))
    .catch(() => (NOMS_SUGG = []));
  window.pcSuggestionsPokemon = function (texte, maxi = 8) {
    const t = normaliser(texte);
    if (!t || !NOMS_SUGG) return [];
    const debut = NOMS_SUGG.filter((x) => x.cles.some((c) => c.startsWith(t))).map((x) => x.nom);
    const dedans = NOMS_SUGG.filter((x) => !debut.includes(x.nom) && x.cles.some((c) => c.includes(t))).map((x) => x.nom);
    return [...debut.sort((a, b) => a.length - b.length), ...dedans.sort((a, b) => a.length - b.length)].slice(0, maxi);
  };
  const champPokemon = (el) => el && el.matches && el.matches('input[data-pokemon], input[list="pc-ch-noms"], #pc-pf-s-nom');
  let boite = null, champActif = null, choixSugg = [], selSugg = -1;
  function fermerSugg() { if (boite) boite.hidden = true; choixSugg = []; selSugg = -1; }
  function prendreSugg(nom) {
    if (!champActif) return;
    champActif.value = nom;
    champActif.dispatchEvent(new Event("change", { bubbles: true }));
    fermerSugg();
  }
  function montrerSugg() {
    if (!champActif || !choixSugg.length) { fermerSugg(); return; }
    if (!boite) {
      boite = document.createElement("div");
      boite.className = "pc-sugg";
      document.body.appendChild(boite);
      boite.addEventListener("mousedown", (e) => {        // avant que le champ perde le focus
        const b = e.target.closest("[data-nom]");
        if (b) { e.preventDefault(); prendreSugg(b.dataset.nom); }
      });
    }
    const r = champActif.getBoundingClientRect();
    Object.assign(boite.style, { left: `${r.left}px`, top: `${r.bottom + 2}px`,
      width: `${Math.max(r.width, 220)}px` });
    boite.innerHTML = choixSugg.map((n, i) => {
      const src = window.pcSprite ? window.pcSprite(n) : "";
      return `<div class="pc-sugg-l${i === selSugg ? " pc-sugg-sel" : ""}" data-nom="${window.pcEchapper(n)}">` +
        (src ? `<img src="${window.pcEchapper(src)}" alt="" onerror="this.style.visibility='hidden'">` : "<span></span>") +
        `${window.pcEchapper(n)}</div>`;
    }).join("");
    boite.hidden = false;
  }
  document.addEventListener("input", async (e) => {
    if (!champPokemon(e.target)) return;
    champActif = e.target;
    champActif.setAttribute("autocomplete", "off");
    await chargerNomsSugg();
    const texte = champActif.value.trim();
    choixSugg = window.pcSuggestionsPokemon(texte).filter((n) => n !== texte);
    selSugg = -1;
    montrerSugg();
  });
  document.addEventListener("keydown", (e) => {
    if (!boite || boite.hidden || e.target !== champActif) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      selSugg = (selSugg + (e.key === "ArrowDown" ? 1 : -1) + choixSugg.length) % choixSugg.length;
      montrerSugg();
    } else if (e.key === "Enter" && selSugg >= 0) {
      e.preventDefault();
      prendreSugg(choixSugg[selSugg]);
    } else if (e.key === "Escape") fermerSugg();
  }, true);
  document.addEventListener("focusout", (e) => { if (e.target === champActif) setTimeout(fermerSugg, 150); });
  window.addEventListener("resize", fermerSugg);
  document.addEventListener("scroll", (e) => { if (!boite || !boite.contains(e.target)) fermerSugg(); }, true);
  window.pcImageBall = (fichier) => fichier ? SPRITES + "items/" + fichier + ".png" : "";
  // image du profil : l'avatar Discord si choisi (ou s'il n'y a pas de Pokémon), sinon le Pokémon
  // version animée des images Discord : avatar « a_… » en GIF, décoration en APNG
  window.pcDiscordAnime = function (url) {
    if (!url) return url;
    const base = url.split("?")[0];
    const nom = base.split("/").pop();
    if (base.includes("/avatars/") && nom.startsWith("a_")) return base.replace(/\.\w+$/, ".gif") + "?size=128";
    if (base.includes("/avatar-decoration-presets/")) return base + "?size=240&passthrough=true";
    return url;
  };
  window.pcImageProfil = function (p) {
    const discord = p.avatar_discord || !p.avatar;
    if (discord && p.discord_avatar) return window.pcDiscordAnime(p.discord_avatar);
    return p.avatar ? window.pcSprite(p.avatar) : (p.discord_avatar || p.photo_compte || "");
  };

  // Bouton du menu : « Se connecter », ou l'avatar et le pseudo une fois connecté
  const TT = (fr, en) => (window.PC_LANGUE === "en" ? en : fr);
  const pastille = (n) => (n ? `<span class="pc-pastille">${n > 9 ? "9+" : n}</span>` : "");
  function majMenu() {
    const lien = document.getElementById("pc-nav-compte");
    const menu = document.getElementById("pc-menu-compte");
    if (lien) {
      const p = window.pcCompte.profil;
      const n = window.pcCompte.demandes || 0;
      if (window.pcCompte.session && p) {
        const img = window.pcImageProfil ? window.pcImageProfil(p) : "";
        lien.innerHTML = `<span class="pc-nav-avatar">${img ? `<img src="${esc(img)}" alt="">` : ""}${pastille(n)}</span>` +
          `<span>${esc(p.pseudo || TT("Mon profil", "My profile"))}</span>`;
        lien.classList.add("pc-connecte", "dropdown-toggle");
        lien.setAttribute("data-bs-toggle", "dropdown");
        lien.setAttribute("role", "button");
        if (menu) {
          menu.innerHTML = `
            <li><a class="dropdown-item" href="/profil">👤 ${TT("Mon profil", "My profile")}</a></li>
            <li><a class="dropdown-item" href="/compteurs">🎯 ${TT("Mes chasses", "My hunts")}</a></li>
            <li><a class="dropdown-item" href="/joueurs">👥 ${TT("Joueurs et amis", "Players & friends")} ${pastille(n)}</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item" type="button" onclick="pcDeconnexion()">${TT("Se déconnecter", "Sign out")}</button></li>`;
          menu.hidden = false;
        }
      } else {
        lien.innerHTML = `<span>${TT("Se connecter", "Sign in")}</span>`;
        lien.classList.remove("pc-connecte", "dropdown-toggle");
        lien.removeAttribute("data-bs-toggle");
        if (menu) { menu.innerHTML = ""; menu.hidden = true; }
      }
    }
    majBarreApp();
  }
  window.pcMajMenuCompte = majMenu;

  // ---- demandes d'amis reçues (petit rond rouge, comme dans le compteur)
  window.pcMajDemandes = async function () {
    const s = window.pcCompte.session;
    if (!s || !window.pcSupa) { window.pcCompte.demandes = 0; return; }
    try {
      const { count } = await window.pcSupa.from("demandes_amis").select("de_id", { count: "exact", head: true })
        .eq("a_id", s.user.id);
      window.pcCompte.demandes = count || 0;
    } catch (e) { /* hors ligne */ }
    majMenu();
  };

  // ---- application installée : barre d'onglets en bas (Chasses, Profil, Joueurs, Guides)
  const enApp = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  function majBarreApp(chemin) {
    if (!enApp() || !document.body) return;
    let barre = document.getElementById("pc-app-barre");
    if (!barre) {
      barre = document.createElement("nav");
      barre.id = "pc-app-barre";
      barre.className = "pc-app-barre";
      document.body.appendChild(barre);
    }
    const p = chemin || location.pathname;
    const guide = !["/compteurs", "/profil", "/joueurs"].some((x) => p.indexOf(x) === 0);
    const onglets = [
      ["/compteurs", "🎯", TT("Chasses", "Hunts"), p.indexOf("/compteurs") === 0, 0],
      ["/profil", "👤", TT("Profil", "Profile"), p.indexOf("/profil") === 0, 0],
      ["/joueurs", "👥", TT("Joueurs", "Players"), p.indexOf("/joueurs") === 0, window.pcCompte.demandes || 0],
      ["/guides", "📖", TT("Guides", "Guides"), guide, 0],
    ];
    barre.innerHTML = onglets.map(([href, ic, nom, actif, n]) =>
      `<a href="${href}" class="${actif ? "actif" : ""}"><span class="pc-app-ic">${ic}${pastille(n)}</span><span>${nom}</span></a>`).join("");
  }
  window.pcMajBarreApp = majBarreApp;

  async function chargerProfil() {
    const s = window.pcCompte.session;
    window.pcCompte.profil = null;
    if (s && window.pcSupa) {
      const { data } = await window.pcSupa.from("profils").select("*").eq("id", s.user.id).maybeSingle();
      window.pcCompte.profil = data || { id: s.user.id, pseudo: null };
    }
  }

  async function changement(session) {
    window.pcCompte.session = session || null;
    try { await chargerProfil(); } catch (e) { /* hors ligne */ }
    window.pcCompte.pret = true;
    majMenu();
    window.dispatchEvent(new Event("pc-compte"));
    window.pcMajDemandes();
  }

  window.pcConnexion = function (fournisseur) {
    if (!window.pcSupa) return;
    window.pcSupa.auth.signInWithOAuth({
      provider: fournisseur,
      options: { redirectTo: location.origin + "/profil" },
    });
  };
  window.pcDeconnexion = async function () {
    if (window.pcSupa) await window.pcSupa.auth.signOut();
    location.href = "/profil";
  };
  window.pcRechargerCompte = () => changement(window.pcCompte.session);

  if (window.pcSupa) {
    let premier = true;
    window.pcSupa.auth.onAuthStateChange((evenement, session) => {
      // TOKEN_REFRESHED ne change rien au profil
      if (!premier && evenement === "TOKEN_REFRESHED") { window.pcCompte.session = session; return; }
      premier = false;
      setTimeout(() => changement(session), 0);
    });
  } else {
    window.pcCompte.pret = true;
  }
  document.addEventListener("DOMContentLoaded", majMenu);
})();
