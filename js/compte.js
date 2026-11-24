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
  // image chromatique (rendu HOME) ; secours : pixel art chromatique
  window.pcSprite = function (nom) {
    const num = window.pcNumero(nom);
    return num ? SPRITES + "pokemon/other/home/shiny/" + num + ".png" : "";
  };
  window.pcSpriteSecours = function (img) {
    const m = /\/(\d+)\.png$/.exec(img.src);
    img.onerror = null;
    if (m && img.src.indexOf("/home/") > 0) img.src = SPRITES + "pokemon/shiny/" + m[1] + ".png";
    else img.style.visibility = "hidden";
  };
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
