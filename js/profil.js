// Page /profil : son profil PokéChroma (le même que dans le compteur) ou celui d'un autre joueur.
(async function () {
  const EN = window.PC_LANGUE === "en";
  const T = (fr, en) => (EN ? en : fr);
  const esc = window.pcEchapper;
  const $ = (id) => document.getElementById(id);
  const supa = window.pcSupa;
  if (!$("pc-pf-profil")) return;

  const BADGES = {
    admin: ["🛡", "Admin", "#ff6b81", "Administrateur de PokéChroma", "PokéChroma administrator"],
    vip: ["💎", "VIP", "#c9a8ff", "Membre VIP", "VIP member"],
    supporter: ["❤", "Supporter", "#ff8fb1", "Soutient PokéChroma", "Supports PokéChroma"],
    partageur: ["🧩", T("Partageur", "Sharer"), "#6fd3a0",
      "Pour avoir partagé et participé à l'élaboration d'un modèle 3D",
      "For sharing and helping build a 3D model"],
  };
  // Balls : nom français, nom anglais, image PokeAPI (comme dans le compteur)
  const BALLS = [
    ["Poké Ball", "Poké Ball", "poke-ball"], ["Super Ball", "Great Ball", "great-ball"],
    ["Hyper Ball", "Ultra Ball", "ultra-ball"], ["Master Ball", "Master Ball", "master-ball"],
    ["Honor Ball", "Premier Ball", "premier-ball"], ["Safari Ball", "Safari Ball", "safari-ball"],
    ["Faiblo Ball", "Nest Ball", "nest-ball"], ["Filet Ball", "Net Ball", "net-ball"],
    ["Scuba Ball", "Dive Ball", "dive-ball"], ["Bis Ball", "Repeat Ball", "repeat-ball"],
    ["Chrono Ball", "Timer Ball", "timer-ball"], ["Luxe Ball", "Luxury Ball", "luxury-ball"],
    ["Sombre Ball", "Dusk Ball", "dusk-ball"], ["Soin Ball", "Heal Ball", "heal-ball"],
    ["Rapide Ball", "Quick Ball", "quick-ball"], ["Mémoire Ball", "Cherish Ball", "cherish-ball"],
    ["Rêve Ball", "Dream Ball", "dream-ball"], ["Ultra Ball", "Beast Ball", "beast-ball"],
    ["Compét'Ball", "Sport Ball", "sport-ball"], ["Parc Ball", "Park Ball", "park-ball"],
    ["Étrange Ball", "Strange Ball", "strange-ball"], ["Speed Ball", "Fast Ball", "fast-ball"],
    ["Niveau Ball", "Level Ball", "level-ball"], ["Appât Ball", "Lure Ball", "lure-ball"],
    ["Masse Ball", "Heavy Ball", "heavy-ball"], ["Love Ball", "Love Ball", "love-ball"],
    ["Copain Ball", "Friend Ball", "friend-ball"], ["Lune Ball", "Moon Ball", "moon-ball"],
    ["Plume Ball", "Feather Ball", "lafeather-ball"], ["Envol Ball", "Wing Ball", "lawing-ball"],
    ["Avion Ball", "Jet Ball", "lajet-ball"], ["Gigamasse Ball", "Gigaton Ball", "lagigaton-ball"],
    ["Mégamasse Ball", "Leaden Ball", "laleaden-ball"], ["Origine Ball", "Origin Ball", "laorigin-ball"],
  ];
  const fichierBall = (nom, jeu) => {
    const n = window.pcNormaliser(nom);
    if (!n) return "";
    for (const [fr, en, f] of BALLS) {
      if (n === window.pcNormaliser(fr) || n === window.pcNormaliser(en)) {
        if (window.pcNormaliser(jeu).includes("arceus") &&
            ["poke-ball", "great-ball", "ultra-ball", "heavy-ball", "strange-ball"].includes(f)) return "la" + f;
        return f;
      }
    }
    return "";
  };
  const nombre = (n) => Number(n || 0).toLocaleString(EN ? "en-US" : "fr-FR");
  const dateCourte = (iso) => {
    if (!iso || iso.length < 10) return "";
    const [a, m, j] = [iso.slice(0, 4), iso.slice(5, 7), iso.slice(8, 10)];
    return EN ? `${m}/${j}/${a}` : `${j}/${m}/${a}`;
  };
  const duree = (s) => {
    s = Number(s || 0);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
  };
  const imgSprite = (nom, classe) => {
    const src = window.pcSprite(nom);
    return src ? `<img class="${classe}" src="${esc(src)}" alt="" loading="lazy" onerror="pcSpriteSecours(this)">`
      : `<div class="${classe} pc-pf-vide">?</div>`;
  };

  function afficher(id) {
    ["pc-pf-connexion", "pc-pf-chargement", "pc-pf-profil"].forEach((b) => { $(b).hidden = b !== id; });
  }
  function erreur(message) {
    afficher("pc-pf-chargement");
    $("pc-pf-chargement").innerHTML = `<p class="pc-intro">${message}</p>`;
  }

  // ---------------------------------------------------------------- recherche de joueurs
  $("pc-pf-chercher").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("pc-pf-joueur").value.trim();
    const zone = $("pc-pf-resultats");
    if (q.length < 2 || !supa) { zone.innerHTML = ""; return; }
    zone.innerHTML = `<p class="pc-legende">${T("Recherche…", "Searching…")}</p>`;
    const motif = "%" + q.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
    const { data, error } = await supa.from("profils")
      .select("id,pseudo,avatar,avatar_discord,discord_avatar,photo_compte")
      .not("pseudo", "is", null).ilike("pseudo", motif).order("pseudo").limit(12);
    if (error) { zone.innerHTML = `<p class="pc-legende">${T("Recherche impossible pour le moment.", "Search unavailable right now.")}</p>`; return; }
    if (!data.length) { zone.innerHTML = `<p class="pc-legende">${T("Aucun joueur trouvé.", "No player found.")}</p>`; return; }
    zone.innerHTML = data.map((p) => {
      const img = window.pcImageProfil(p);
      return `<a class="pc-pf-joueur" href="/profil?u=${encodeURIComponent(p.pseudo)}">` +
        (img ? `<img src="${esc(img)}" alt="" onerror="this.style.visibility='hidden'">` : "<span></span>") +
        `<span>${esc(p.pseudo)}</span></a>`;
    }).join("");
  });

  // ---------------------------------------------------------------- quel profil ?
  if (!supa) { erreur(T("Le service de comptes ne répond pas. Réessaie plus tard.", "The account service is not responding. Please try again later.")); return; }
  await window.pcNomsPrets;
  const { data: { session } } = await supa.auth.getSession();
  const params = new URLSearchParams(location.search);
  if (params.has("code") || params.has("error")) {
    if (params.get("error")) erreur(T("La connexion a été annulée.", "Sign-in was cancelled."));
    history.replaceState({}, "", "/profil" + (params.get("u") ? "?u=" + encodeURIComponent(params.get("u")) : ""));
    if (params.get("error")) return;
  }
  const cible = params.get("u");

  let profil = null;
  if (cible) {
    const { data } = await supa.from("profils").select("*")
      .ilike("pseudo", cible.replace(/[\\%_]/g, (c) => "\\" + c)).limit(1);
    profil = data && data[0];
    if (!profil) { erreur(T("Ce joueur n'existe pas (ou a changé de pseudo).", "This player doesn't exist (or changed username).")); return; }
  } else if (session) {
    const { data } = await supa.from("profils").select("*").eq("id", session.user.id).maybeSingle();
    profil = data || { id: session.user.id, pseudo: null, bio: "", avatar: "" };
  } else {
    afficher("pc-pf-connexion");
    return;
  }
  const moi = !!(session && session.user.id === profil.id);
  if (!cible && moi) document.title = (profil.pseudo || T("Mon profil", "My profile")) + " - PokéChroma";
  if (cible) document.title = profil.pseudo + " - PokéChroma";

  const [rBadges, rDet, rShinies, rChasses] = await Promise.all([
    supa.from("badges").select("badge").eq("profil_id", profil.id),
    supa.from("detecteurs").select("id").eq("profil_id", profil.id).limit(1),
    supa.from("chromatiques").select("*").eq("profil_id", profil.id),
    moi ? supa.from("chasses").select("*").eq("profil_id", profil.id).is("termine", null)
      .order("maj_le", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const badges = (rBadges.data || []).map((b) => b.badge);
  if (rDet.data && rDet.data.length) badges.push("partageur");
  const shinies = rShinies.data || [];
  const chasses = rChasses.data || [];

  // ---------------------------------------------------------------- en-tête
  function entete() {
    const img = window.pcImageProfil(profil);
    const avecDiscord = img && img === profil.discord_avatar;
    const pastilles = badges.filter((b) => BADGES[b]).map((b) => {
      const [ic, nom, coul, tfr, ten] = BADGES[b];
      return `<span class="pc-pf-badge" style="--c:${coul}" title="${esc(T(tfr, ten))}">${ic} ${esc(nom)}</span>`;
    }).join("");
    const tag = profil.discord_tag ? `<span class="pc-pf-tag">${profil.discord_badge ? `<img src="${esc(profil.discord_badge)}" alt="">` : ""}${esc(profil.discord_tag)}</span>` : "";
    const fullOdds = shinies.filter((s) => s.full_odds).length;
    const rencontres = shinies.reduce((t, s) => t + (s.rencontres || 0), 0);
    const jeux = new Set(shinies.map((s) => s.jeu).filter(Boolean)).size;
    $("pc-pf-entete").innerHTML = `
      <div class="pc-pf-avatar">${img ? `<img src="${esc(img)}" alt="" onerror="pcSpriteSecours(this)">` : ""}
        ${avecDiscord && profil.discord_decoration ? `<img class="pc-pf-deco" src="${esc(profil.discord_decoration)}" alt="">` : ""}</div>
      <div class="pc-pf-infos">
        <h1>${esc(profil.pseudo || T("Choisis ton pseudo", "Pick a username"))}${tag}</h1>
        <div class="pc-pf-badges">${pastilles}</div>
        ${profil.bio ? `<p class="pc-pf-bio">${esc(profil.bio)}</p>` : ""}
        <p class="pc-legende">${T("Membre depuis le", "Member since")} ${dateCourte(profil.cree_le)}</p>
        <div class="pc-pf-stats">
          <div><b>${nombre(shinies.length)}</b><span>${T("shinies", "shinies")}</span></div>
          <div><b>${nombre(fullOdds)}</b><span>full odds</span></div>
          <div><b>${nombre(rencontres)}</b><span>${T("rencontres", "encounters")}</span></div>
          <div><b>${nombre(jeux)}</b><span>${T("jeux", "games")}</span></div>
        </div>
        ${moi ? `<div class="pc-pf-boutons">
          <button class="btn btn-primary" type="button" id="pc-pf-modifier">✏ ${T("Modifier", "Edit")}</button>
          <button class="btn btn-outline-light" type="button" onclick="pcDeconnexion()">${T("Se déconnecter", "Sign out")}</button>
        </div>` : ""}
      </div>`;
    const bt = $("pc-pf-modifier");
    if (bt) bt.addEventListener("click", ouvrirEdition);
  }

  // ---------------------------------------------------------------- modification (son profil)
  function ouvrirEdition() {
    $("pc-pf-e-pseudo").value = profil.pseudo || "";
    $("pc-pf-e-bio").value = profil.bio || "";
    $("pc-pf-e-avatar").value = profil.avatar || "";
    $("pc-pf-e-discord").checked = !!profil.avatar_discord;
    $("pc-pf-e-discord").closest("label").hidden = !profil.discord_avatar;
    $("pc-pf-e-erreur").textContent = "";
    $("pc-pf-edition").hidden = false;
    $("pc-pf-edition").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("pc-pf-e-annuler").addEventListener("click", () => {
    if (profil.pseudo) $("pc-pf-edition").hidden = true;
  });
  $("pc-pf-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pseudo = $("pc-pf-e-pseudo").value.trim();
    const avatar = $("pc-pf-e-avatar").value.trim();
    const msg = $("pc-pf-e-erreur");
    if (pseudo.length < 2 || pseudo.length > 24) { msg.textContent = T("Le pseudo doit faire entre 2 et 24 caractères.", "The username must be 2 to 24 characters long."); return; }
    if (avatar && !window.pcNumero(avatar)) { msg.textContent = T("Pokémon inconnu : vérifie l'orthographe.", "Unknown Pokémon: check the spelling."); return; }
    const modifs = { pseudo, bio: $("pc-pf-e-bio").value.trim(), avatar,
      avatar_discord: $("pc-pf-e-discord").checked, maj_le: new Date().toISOString() };
    const { error } = await supa.from("profils").update(modifs).eq("id", profil.id);
    if (error) {
      msg.textContent = /duplicate|unique/i.test(error.message)
        ? T("Ce pseudo est déjà pris.", "This username is already taken.")
        : T("Impossible d'enregistrer : ", "Couldn't save: ") + error.message;
      return;
    }
    Object.assign(profil, modifs);
    $("pc-pf-edition").hidden = true;
    entete();
    if (window.pcRechargerCompte) window.pcRechargerCompte();
  });

  // ---------------------------------------------------------------- chasses en cours (les siennes)
  function afficherChasses() {
    $("pc-pf-bloc-chasses").hidden = !moi;
    if (!moi) return;
    $("pc-pf-chasses").innerHTML = chasses.length ? chasses.map((c) => {
      const phases = Array.isArray(c.phases) ? c.phases.length : 0;
      return `<div class="pc-pf-carte">
        ${imgSprite(c.pokemon, "pc-pf-sprite")}
        <h3>${esc(c.pokemon)}</h3>
        <p class="pc-pf-jeu">${esc(c.jeu)}</p>
        <p class="pc-pf-grand">${nombre(c.compteur)}</p>
        <p class="pc-pf-detail">${phases ? `${T("Phase", "Phase")} ${phases + 1} · ${T("total", "total")} ${nombre(c.total)}` : ""}
          ${c.temps ? `<br>⏱ ${duree(c.temps)}` : ""}${c.taux ? `<br>${T("Taux", "Odds")} ${esc(c.taux)}` : ""}</p>
      </div>`;
    }).join("") : `<p class="pc-legende">${T("Aucune chasse en cours.", "No ongoing hunt.")}</p>`;
  }

  // ---------------------------------------------------------------- shinies
  function afficherShinies() {
    const q = window.pcNormaliser($("pc-pf-filtre").value);
    const tri = $("pc-pf-tri").value;
    let liste = shinies.filter((s) => !q || [s.pokemon, s.jeu, s.surnom, s.methode, s.lieu, s.ball]
      .some((v) => window.pcNormaliser(v).includes(q)));
    const d = (s) => s.date || "";
    liste.sort((a, b) =>
      tri === "ancien" ? d(a).localeCompare(d(b)) :
      tri === "nom" ? a.pokemon.localeCompare(b.pokemon, EN ? "en" : "fr") :
      tri === "rencontres" ? (b.rencontres || 0) - (a.rencontres || 0) :
      d(b).localeCompare(d(a)));
    $("pc-pf-titre-shinies").textContent = `${T("Shinies", "Shinies")} (${shinies.length})`;
    $("pc-pf-shinies").innerHTML = liste.length ? liste.map((s) => {
      const ball = fichierBall(s.ball, s.jeu);
      const sexe = s.sexe === "M" ? "♂" : s.sexe === "F" ? "♀" : "";
      const renc = s.rencontres != null
        ? `${s.approx ? "≈ " : ""}${nombre(s.rencontres)} ${esc(s.unite || T("rencontres", "encounters"))}` : "";
      return `<div class="pc-pf-carte">
        ${s.favori ? `<span class="pc-pf-favori" title="${T("Favori", "Favourite")}">★</span>` : ""}
        ${imgSprite(s.pokemon, "pc-pf-sprite")}
        <h3>${esc(s.pokemon)} <span class="pc-pf-sexe">${sexe}</span></h3>
        ${s.surnom ? `<p class="pc-pf-surnom">« ${esc(s.surnom)} »</p>` : ""}
        <p class="pc-pf-jeu">${esc(s.jeu)}</p>
        <p class="pc-pf-detail">${[renc, esc(s.methode), esc(s.lieu), dateCourte(s.date)].filter(Boolean).join("<br>")}</p>
        <div class="pc-pf-pied">
          ${ball ? `<img class="pc-pf-ball" src="${esc(window.pcImageBall(ball))}" alt="${esc(s.ball)}" title="${esc(s.ball)}">` : ""}
          ${s.full_odds ? `<span class="pc-taux">full odds</span>` : ""}
          ${s.charme ? `<span class="pc-pf-mini" title="${T("Charme Chroma", "Shiny Charm")}">✨</span>` : ""}
        </div>
      </div>`;
    }).join("") : `<p class="pc-legende">${shinies.length ? T("Aucun shiny ne correspond.", "No shiny matches.") : T("Aucun shiny pour le moment.", "No shiny yet.")}</p>`;
  }
  $("pc-pf-filtre").addEventListener("input", afficherShinies);
  $("pc-pf-tri").addEventListener("change", afficherShinies);

  entete();
  afficherChasses();
  afficherShinies();
  afficher("pc-pf-profil");
  if (moi && !profil.pseudo) ouvrirEdition();       // nouveau compte : on choisit d'abord son pseudo
})();
