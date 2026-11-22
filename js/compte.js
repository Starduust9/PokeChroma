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

  // ---- sprites des Pokémon (mêmes images que dans le compteur : PokeAPI)
  const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/";
  let NOMS = null;
  const normaliser = (t) => String(t || "").normalize("NFKD").toLowerCase()
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
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
  window.pcImageProfil = function (p) {
    const discord = p.avatar_discord || !p.avatar;
    if (discord && p.discord_avatar) return p.discord_avatar;
    return p.avatar ? window.pcSprite(p.avatar) : (p.discord_avatar || p.photo_compte || "");
  };

  // Bouton du menu : « Se connecter », ou l'avatar et le pseudo une fois connecté
  function majMenu() {
    const lien = document.getElementById("pc-nav-compte");
    if (!lien) return;
    const p = window.pcCompte.profil;
    if (window.pcCompte.session && p) {
      const img = window.pcImageProfil ? window.pcImageProfil(p) : "";
      lien.innerHTML = (img ? `<img src="${esc(img)}" alt="">` : "") +
        `<span>${esc(p.pseudo || (window.PC_LANGUE === "en" ? "My profile" : "Mon profil"))}</span>`;
      lien.classList.add("pc-connecte");
    } else {
      lien.innerHTML = `<span>${window.PC_LANGUE === "en" ? "Sign in" : "Se connecter"}</span>`;
      lien.classList.remove("pc-connecte");
    }
  }
  window.pcMajMenuCompte = majMenu;

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
