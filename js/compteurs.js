// « Mes chasses » : les chasses de PokéChroma Counter sur le téléphone (et l'inverse).
// Connecté : les chasses sont celles du compte (table « chasses »), gardées aussi sur l'appareil
// pour marcher hors connexion ; les changements partent dès que le réseau revient.
// Pas connecté : compteurs gardés seulement sur l'appareil.
(function () {
  const EN = window.PC_LANGUE === "en";
  const T = (fr, en) => (EN ? en : fr);
  const esc = window.pcEchapper || ((t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const $ = (id) => document.getElementById(id);
  if (!$("pc-ch-grille")) return;

  // ------------------------------------------------------------ jeux et taux (comme le compteur PC)
  const JEUX = window.pcJeux;
  const n = (t) => window.pcNormaliser ? window.pcNormaliser(t) : String(t || "").toLowerCase();
  function generation(jeu) {
    const j = n(jeu);
    for (const [gen, jeux] of JEUX) if (jeux.some(([fr, en]) => n(fr) === j || n(en) === j)) return parseInt(gen, 10);
    const f = famille(jeu);
    return f ? f.gen : null;
  }
  const tauxDefaut = (jeu) => ((generation(jeu) || 0) >= 6 ? 4096 : 8192);
  function charmePossible(jeu) {
    const g = generation(jeu);
    if (g === null) return true;
    if (g <= 4) return false;
    if (g === 5) return n(jeu).includes("2");
    return true;
  }
  // catalogue des méthodes (assets/data/methodes.json, le même fichier que le compteur PC)
  let CAT = { familles: [], methodes: [], groupes: [], options_famille: {} };
  const catalogue = fetch("/assets/data/methodes.json").then((r) => r.json())
    .then((d) => { CAT = Object.assign(CAT, d); }).catch(() => {});
  const nom = (o) => (o ? (EN ? o.en : o.fr) || o.fr || "" : "");
  const court = (o) => (o ? (EN ? o.court_en : o.court_fr) || o.court_fr || "" : "");
  function famille(jeu) {
    const complet = n(jeu);
    if (!complet) return null;
    const mots = new Set([...String(jeu).split(/[\s\-_()/,.&+:]+/), ...String(jeu).split(/[\s()/,:]+/)].filter(Boolean).map(n));
    return CAT.familles.find((f) => (f.cles || []).some((c) => mots.has(c) || (c.length >= 5 && complet.includes(c)))) || null;
  }
  function methodeDe(c) {
    const m = n(c.methode);
    if (!m) return null;
    return CAT.methodes.find((x) => [n(x.fr), n(x.en), x.id].includes(m))
      || CAT.methodes.find((x) => (x.alias || []).some((a) => m.includes(a))) || null;
  }
  const possible = (m, jeu) => { if (!m || m.familles === "*") return true; const f = famille(jeu); return !f || m.familles.includes(f.id); };
  function optionsDe(c) {
    const m = methodeDe(c), f = famille(c.jeu);
    return [...((m && m.options) || []), ...((f && CAT.options_famille[f.id]) || [])];
  }
  function valeurOption(c, o) {
    const v = (c.options || {})[o.id];
    return o.choix.some((x) => x.v === v) ? v : (o.defaut || 0);
  }
  function chaineDe(c) {
    const m = methodeDe(c), ch = m && m.chaine;
    if (!ch) return null;
    const bonus = (k) => (ch.par != null ? ch.par * Math.min(k, ch.max)
      : Math.max(0, ...(ch.paliers || []).filter(([mini]) => k >= mini).map(([, b]) => b)));
    return { max: ch.max, bonus };
  }
  const chaine = (c) => +((c.options || {}).chaine) || 0;
  // rencontres ajoutées par appui (+1, +2, +5 pour les Hordes…) : dans les options, comme sur le PC
  const pas = (c) => Math.max(1, Math.min(1000, +((c.options || {}).pas) || +c.pas || 1));
  const tauxNombre = (c) => { const m = /1\s*\/\s*(\d+)/.exec(c.taux || ""); return m ? +m[1] : 8192; };
  // le texte « 1/1365 (Charme Chroma) » ou « 1/683 (Masuda) » du compteur PC : le vrai taux
  // de base est retrouvé
  const tauxBase = (c) => (/\(/.test(c.taux || "") ? tauxDefaut(c.jeu) : tauxNombre(c));
  const avecTirages = (t, k) => (k <= 1 ? t : Math.round(1 / (1 - Math.pow(1 - 1 / t, k))));
  function tauxEtRaisons(c) {
    const m = methodeDe(c) || {}, f = famille(c.jeu) || {};
    const charme = !!c.charme && m.charme !== false;
    const CHARME = T("Charme Chroma", "Shiny Charm");
    if (m.fixe) return charme && m.fixe_charme ? [m.fixe_charme, [CHARME]] : [m.fixe, [nom(m)]];
    let bonus = 0;
    const raisons = [];
    if (m.bonus) {
      bonus += +((m.bonus_gen || {})[String(generation(c.jeu))] ?? m.bonus);
      raisons.push(nom(m).split(" (")[0]);
    }
    const ch = chaineDe(c);
    if (ch) { bonus += ch.bonus(chaine(c)); raisons.push(T(`chaîne ${chaine(c)}`, `chain ${chaine(c)}`)); }
    for (const o of optionsDe(c)) {
      const v = valeurOption(c, o);
      if (v) { bonus += +v; raisons.push(court(o.choix.find((x) => x.v === v)) || nom(o)); }
    }
    if (m.variable) raisons.push(T("variable", "variable"));
    if (charme) raisons.push(CHARME);
    return [avecTirages(tauxBase(c), 1 + (charme ? (f.charme_tirages || 2) : 0) + bonus), raisons];
  }
  const tauxActuel = (c) => tauxEtRaisons(c)[0];
  const tauxAffiche = (c) => { const [t, r] = tauxEtRaisons(c); return `1/${t}${r.length ? ` (${r.join(" + ")})` : ""}`; };
  const chance = (c) => 1 - Math.pow(1 - 1 / tauxActuel(c), c.compteur);
  const nb = (x) => Number(x || 0).toLocaleString(EN ? "en-US" : "fr-FR");
  const total = (c) => (c.compteur || 0) + (c.phases || []).reduce((t, p) => t + (+p.rencontres || 0), 0);
  const maintenant = () => new Date().toISOString();
  const duree = (s) => {
    s = Math.floor(+s || 0);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
  };

  // ------------------------------------------------------------ stockage (un seul pour toute la visite)
  const S = window.pcChasses || (window.pcChasses = { uid: null, rows: {}, attente: [], minuteur: null, synchro: null, derniere: null, erreur: "" });
  const CLE_LOCALE = "pc-compteurs";
  const lireJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const ecrireJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* plein ou bloqué */ } };

  // compteurs locaux (sans compte) : ancien format des « Mes compteurs » converti
  function lireLocales() {
    return lireJSON(CLE_LOCALE, []).map((c) => {
      if (c.id_local) return c;
      const base = +c.taux || 8192;
      return { id_local: "tel-" + (c.id || Date.now().toString(36)), pokemon: c.pokemon, jeu: c.jeu || "",
        compteur: +c.compteur || 0, temps: 0, termine: null, methode: "", charme: false, taux: `1/${base}`, pas: c.pas || 1,
        phases: (c.phases || []).map((r, i) => (typeof r === "object" ? r :
          { numero: i + 1, pokemon: c.pokemon, rencontres: +r || 0, date: c.maj || maintenant() })), maj_le: c.maj || maintenant() };
    });
  }
  const ecrireLocales = (l) => ecrireJSON(CLE_LOCALE, l);

  function chargerCompte(uid) {
    if (S.uid === uid) return;
    S.uid = uid;
    const d = uid ? lireJSON("pc-chasses-" + uid, { rows: {}, attente: [] }) : { rows: {}, attente: [] };
    S.rows = d.rows || {};
    S.attente = d.attente || [];
  }
  const sauverCompte = () => { if (S.uid) ecrireJSON("pc-chasses-" + S.uid, { rows: S.rows, attente: S.attente }); };

  // ------------------------------------------------------------ synchronisation avec le compte
  const COLONNES = ["id_local", "pokemon", "jeu", "compteur", "total", "phases", "temps", "termine", "methode", "taux", "charme", "options", "maj_le"];
  async function synchroniser() {
    const supa = window.pcSupa;
    if (!supa || !S.uid || !navigator.onLine) { afficherEtat(); return; }
    if (S.enCours) { S.relancer = true; return; }
    S.enCours = true;
    try {
      // 1. envoyer ce qui a changé ici
      const envoi = S.attente.filter((id) => S.rows[id]);
      if (envoi.length) {
        const lignes = envoi.map((id) => {
          const r = S.rows[id], l = { profil_id: S.uid };
          COLONNES.forEach((k) => { l[k] = r[k] ?? (k === "phases" ? [] : k === "termine" ? null : k === "options" ? {} : r[k]); });
          l.total = total(r);
          if (S.sansOptions) delete l.options;
          return l;
        });
        const versions = envoi.map((id) => S.rows[id].maj_le);
        let { error } = await supa.from("chasses").upsert(lignes, { onConflict: "profil_id,id_local" });
        if (error && /options/.test(error.message || "") && !S.sansOptions) {
          S.sansOptions = true;            // serveur pas encore à jour : on envoie sans les options
          lignes.forEach((l) => delete l.options);
          ({ error } = await supa.from("chasses").upsert(lignes, { onConflict: "profil_id,id_local" }));
        }
        if (error) throw error;
        // n'enlever de l'attente que ce qui n'a pas rechangé pendant l'envoi
        S.attente = S.attente.filter((id) => { const i = envoi.indexOf(id); return i < 0 || S.rows[id].maj_le !== versions[i]; });
      }
      if (S.effacer && S.effacer.length) {
        const { error } = await supa.from("chasses").delete().eq("profil_id", S.uid).in("id_local", S.effacer);
        if (!error) S.effacer = [];
      }
      // 2. récupérer les chasses du compte (compteur PC, autre téléphone)
      const { data, error } = await supa.from("chasses").select("*").eq("profil_id", S.uid);
      if (error) throw error;
      const vus = new Set();
      for (const r of data) {
        vus.add(r.id_local);
        if (S.attente.includes(r.id_local)) continue;           // changé ici, pas encore envoyé
        const ici = S.rows[r.id_local];
        S.rows[r.id_local] = Object.assign({}, r, ici && ici.pas ? { pas: ici.pas } : {});
      }
      for (const id of Object.keys(S.rows)) if (!vus.has(id) && !S.attente.includes(id)) delete S.rows[id];
      S.derniere = new Date();
      S.erreur = "";
      sauverCompte();
    } catch (e) {
      S.erreur = e && e.message ? e.message : String(e);
    } finally {
      S.enCours = false;
      if (S.relancer) { S.relancer = false; setTimeout(synchroniser, 500); }
      dessiner();
    }
  }
  function bientot() {
    clearTimeout(S.minuteur);
    S.minuteur = setTimeout(synchroniser, 1200);
  }
  if (!S.ecoutes) {
    S.ecoutes = true;
    window.addEventListener("online", () => synchroniser());
    window.addEventListener("offline", () => afficherEtat());
    document.addEventListener("visibilitychange", () => { if (!document.hidden && $("pc-ch-grille")) synchroniser(); });
    setInterval(() => { if (!document.hidden && $("pc-ch-grille")) synchroniser(); }, 20000);
    window.addEventListener("pc-compte", () => { if ($("pc-ch-grille")) demarrer(); });
  }

  // ------------------------------------------------------------ modifier une chasse
  // (s'applique à une chasse du compte ou à un compteur local)
  function trouver(id) {
    if (S.rows[id]) return { c: S.rows[id], compte: true };
    const l = lireLocales();
    const c = l.find((x) => x.id_local === id);
    return c ? { c, compte: false, liste: l } : null;
  }
  function changer(id, fn) {
    const t = trouver(id);
    if (!t) return;
    fn(t.c);
    t.c.taux = tauxAffiche(t.c);
    t.c.maj_le = maintenant();
    t.c.total = total(t.c);
    if (t.compte) {
      if (!S.attente.includes(id)) S.attente.push(id);
      sauverCompte();
      bientot();
    } else {
      ecrireLocales(t.liste);
    }
    dessiner();
  }
  function nouvelId(pokemon, jeu) {
    const base = (`${pokemon} - ${jeu || "?"}`).replace(/[\\/:*?"<>|]/g, "").trim();
    const pris = new Set([...Object.keys(S.rows), ...lireLocales().map((c) => c.id_local)]);
    let id = base, i = 2;
    while (pris.has(id)) id = `${base} (${i++})`;
    return id;
  }
  function creer(c) {
    c.maj_le = maintenant();
    if (S.uid) {
      S.rows[c.id_local] = c;
      S.attente.push(c.id_local);
      sauverCompte();
      bientot();
    } else {
      const l = lireLocales();
      l.unshift(c);
      ecrireLocales(l);
    }
    dessiner();
  }
  function supprimer(id) {
    const t = trouver(id);
    if (!t) return;
    if (t.compte) {
      delete S.rows[id];
      S.attente = S.attente.filter((x) => x !== id);
      (S.effacer = S.effacer || []).push(id);
      sauverCompte();
      bientot();
    } else {
      ecrireLocales(t.liste.filter((x) => x.id_local !== id));
    }
    dessiner();
  }
  function envoyerSurCompte(id) {
    const l = lireLocales();
    const c = l.find((x) => x.id_local === id);
    if (!c || !S.uid) return;
    const copie = Object.assign({}, c, { id_local: nouvelId(c.pokemon, c.jeu) });
    S.rows[copie.id_local] = copie;
    S.attente.push(copie.id_local);
    sauverCompte();
    ecrireLocales(l.filter((x) => x.id_local !== id));
    synchroniser();
    dessiner();
  }

  // ------------------------------------------------------------ affichage
  function sprite(nom, classe, jeu) {
    const src = window.pcSprite ? window.pcSprite(nom, jeu) : "";
    const pixel = /\/versions\//.test(src) ? " pc-pixel" : "";
    return src ? `<img class="${classe}${pixel}" src="${esc(src)}" alt="" loading="lazy" onerror="pcSpriteSecours(this)">`
      : `<span class="${classe} pc-ch-lettre">${esc((nom || "?").slice(0, 1).toUpperCase())}</span>`;
  }
  function carte(c, local) {
    const phase = (c.phases || []).length + 1;
    const puces = [];
    if (c.termine) puces.push(`<span class="pc-ch-puce pc-ch-p-or">✨ ${T("terminée", "finished")}</span>`);
    if (c.charme) puces.push(`<span class="pc-ch-puce pc-ch-p-violet">✨ ${T("charme", "charm")}</span>`);
    if (S.attente.includes(c.id_local)) puces.push(`<span class="pc-ch-puce" title="${T("Sera envoyé dès que possible", "Will be sent as soon as possible")}">⏳ ${T("à envoyer", "pending")}</span>`);
    return `<div class="pc-ch-carte" data-id="${esc(c.id_local)}">
      <div class="pc-ch-haut" data-action="ouvrir">
        <div class="pc-ch-bulle">${sprite(c.pokemon, "pc-ch-sprite", c.jeu)}</div>
        <div class="pc-ch-noms"><b>${esc(c.pokemon)}</b><span>${esc(c.jeu || "")}</span></div>
      </div>
      <div data-action="ouvrir">
        <div class="pc-ch-cpt">${nb(c.compteur)}</div>
        <div class="pc-ch-sous">${phase === 1 ? T("rencontres", "encounters") : T(`phase ${phase} · total ${nb(total(c))}`, `phase ${phase} · total ${nb(total(c))}`)}</div>
        <div class="pc-ch-sous">${T("Taux", "Odds")} ${esc(tauxAffiche(c))}</div>
      </div>
      ${puces.length ? `<div class="pc-ch-puces">${puces.join("")}</div>` : ""}
      ${c.termine ? "" : `<div class="pc-ch-boutons">
        <button type="button" data-action="moins" aria-label="−1">−${pas(c)}</button>
        <button type="button" class="pc-ch-plus" data-action="plus" aria-label="+1">+${pas(c)}</button>
      </div>`}
      ${local && S.uid ? `<button type="button" class="pc-ch-envoyer" data-action="envoyer">☁ ${T("Envoyer sur mon compte", "Send to my account")}</button>` : ""}
    </div>`;
  }
  function afficherEtat() {
    const el = $("pc-ch-etat");
    if (!el) return;
    if (!S.uid) { el.textContent = T("Compteurs gardés sur cet appareil.", "Counters kept on this device."); return; }
    const att = S.attente.length;
    let t;
    if (!navigator.onLine) t = `📴 ${T("Hors connexion", "Offline")}${att ? ` · ${att} ${T("changement(s) en attente", "pending change(s)")}` : ""}`;
    else if (S.erreur) t = `⚠ ${T("Synchronisation impossible pour le moment", "Sync not possible right now")}`;
    else if (att || S.enCours) t = `⏳ ${T("Envoi…", "Sending…")}`;
    else t = `☁ ${T("Synchronisé avec ton compte", "Synced with your account")}${S.derniere ? ` · ${S.derniere.toLocaleTimeString(EN ? "en-US" : "fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}`;
    el.textContent = t;
  }
  function trier(l) {
    return l.slice().sort((a, b) => String(b.maj_le || "").localeCompare(String(a.maj_le || "")));
  }
  function dessiner() {
    if (!$("pc-ch-grille")) return;
    afficherEtat();
    const compte = trier(Object.values(S.rows));
    const locales = lireLocales();
    const enCours = S.uid ? compte.filter((c) => !c.termine) : locales.filter((c) => !c.termine);
    const finies = S.uid ? compte.filter((c) => c.termine) : locales.filter((c) => c.termine);
    $("pc-ch-grille").innerHTML = enCours.length ? enCours.map((c) => carte(c, false)).join("")
      : `<p class="pc-legende pc-ch-vide">${S.uid ? T("Aucune chasse en cours. Crée-en une, ou lance une chasse dans le compteur PC : elle apparaîtra ici.",
        "No ongoing hunt. Create one, or start a hunt in the PC counter: it will show up here.")
        : T("Aucun compteur pour l'instant : crée ta première chasse ✨", "No counter yet: create your first hunt ✨")}</p>`;
    const autres = S.uid ? locales : [];
    $("pc-ch-bloc-locales").hidden = !autres.length;
    $("pc-ch-locales").innerHTML = autres.map((c) => carte(c, true)).join("");
    $("pc-ch-bloc-finies").hidden = !finies.length;
    $("pc-ch-titre-finies").textContent = `${T("Chasses terminées", "Finished hunts")} (${finies.length})`;
    $("pc-ch-finies").innerHTML = finies.map((c) => carte(c, !S.uid)).join("");
    const toutes = S.uid ? compte : locales;
    const shinies = toutes.reduce((t, c) => t + (c.phases || []).length + (c.termine ? 1 : 0), 0);
    $("pc-ch-stats").innerHTML = [
      [nb(toutes.reduce((t, c) => t + total(c), 0)), T("rencontres", "encounters")],
      [nb(shinies), "shinies"],
      [duree(toutes.reduce((t, c) => t + (+c.temps || 0), 0)), T("de chasse", "hunting")],
      [nb(enCours.length), T("en cours", "ongoing")],
    ].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("");
    $("pc-ch-connexion").hidden = !!S.uid || !window.pcSupa;
    if (S.focus) dessinerFocus();
  }

  // ------------------------------------------------------------ écran de comptage
  function ouvrirFocus(id) {
    S.focus = id;
    S.debutFocus = Date.now();
    document.body.classList.add("pc-ch-plein");
    $("pc-ch-focus").hidden = false;
    dessinerFocus();
  }
  function noterTemps() {                    // le temps passé sur l'écran de comptage compte
    if (!S.focus || !S.debutFocus) return;
    const s = Math.round((Date.now() - S.debutFocus) / 1000);
    S.debutFocus = Date.now();
    if (s > 0 && s < 6 * 3600) {
      const t = trouver(S.focus);
      if (t && !t.c.termine) t.c.temps = (+t.c.temps || 0) + s;
    }
  }
  function fermerFocus() {
    noterTemps();
    const id = S.focus;
    S.focus = null;
    document.body.classList.remove("pc-ch-plein");
    $("pc-ch-focus").hidden = true;
    if (id) changer(id, () => {});
  }
  function dessinerFocus() {
    const t = trouver(S.focus);
    const z = $("pc-ch-focus");
    if (!t || !z) { if (z) fermerFocus(); return; }
    // formulaire « Modifier la chasse » ouvert : on ne l'efface pas pendant la saisie (synchro)
    if (z.querySelector(".pc-ch-f-edit:not([hidden])")) return;
    const c = t.c, phase = (c.phases || []).length + 1;
    const pct = (chance(c) * 100).toFixed(1).replace(".", EN ? "." : ",");
    z.innerHTML = `<div class="pc-ch-f-boite" data-id="${esc(c.id_local)}">
      <div class="pc-ch-f-haut">
        <button type="button" class="pc-ch-f-fermer" data-action="fermer" aria-label="${T("Fermer", "Close")}">←</button>
        <div class="pc-ch-f-titre"><b>${esc(c.pokemon)}</b><span>${esc(c.jeu || "")}${phase > 1 ? ` · phase ${phase}` : ""}</span></div>
        <button type="button" class="pc-ch-f-fermer" data-action="menu" aria-label="Options">⋯</button>
      </div>
      <div class="pc-ch-f-menu" hidden>
        <div class="pc-ch-f-pas"><span>${T("Rencontres par appui", "Encounters per tap")}</span>
          ${[1, 2, 3, 5].map((v) => `<button type="button" data-action="pas" data-v="${v}"${pas(c) === v ? ' class="pc-ch-f-pas-actif"' : ""}>+${v}</button>`).join("")}
          <button type="button" class="pc-ch-f-pas-autre${[1, 2, 3, 5].includes(pas(c)) ? "" : " pc-ch-f-pas-actif"}" data-action="pas" data-v="autre" aria-label="${T("Choisir mon nombre", "Choose my number")}">✏️</button></div>
        <button type="button" data-action="editer">✏️ ${T("Modifier la chasse", "Edit the hunt")}</button>
        ${charmePossible(c.jeu) ? `<button type="button" data-action="charme">✨ ${c.charme ? T("Retirer le Charme Chroma", "Remove the Shiny Charm") : T("Ajouter le Charme Chroma", "Add the Shiny Charm")}</button>` : ""}
        ${c.termine ? `<button type="button" data-action="reprendre">↺ ${T("Reprendre la chasse", "Resume the hunt")}</button>` : ""}
        <button type="button" class="pc-danger" data-action="supprimer">🗑 ${T("Supprimer la chasse", "Delete the hunt")}</button>
      </div>
      ${formEdition(c)}
      <div class="pc-ch-f-image">${sprite(c.pokemon, "pc-ch-f-sprite", c.jeu)}</div>
      <div class="pc-ch-f-cpt">${nb(c.compteur)}</div>
      <div class="pc-ch-f-sous">${phase === 1 ? T("rencontres", "encounters") : T(`rencontres · total ${nb(total(c))}`, `encounters · total ${nb(total(c))}`)}</div>
      <div class="pc-ch-f-sous">${T("Taux", "Odds")} ${esc(tauxAffiche(c))} · ${pct} % ${T("de chances de l'avoir croisé", "chance to have met it")}</div>
      <div class="pc-ch-f-sous">⏱ ${duree(c.temps)}</div>
      ${blocChaine(c)}${blocOptions(c)}
      ${c.termine ? `<p class="pc-ch-f-fini">✨ ${T("Chasse terminée !", "Hunt finished!")}</p>` : `
      <button type="button" class="pc-ch-f-plus" data-action="plus">+${pas(c)}</button>
      <div class="pc-ch-f-ligne">
        <button type="button" data-action="moins">−${pas(c)}</button>
        <button type="button" class="pc-ch-f-shiny" data-action="shiny">✨ ${T("Shiny !", "Shiny!")}</button>
      </div>`}
      ${(c.phases || []).length ? `<p class="pc-ch-f-phases">${T("Phases", "Phases")} : ${c.phases.map((p) =>
        `${esc(p.pokemon)} (${nb(p.rencontres)})`).join(" · ")}</p>` : ""}
      <div class="pc-ch-f-shiny-boite" hidden>
        <p>${T("Bravo ! Quel Pokémon est chromatique ?", "Congrats! Which Pokémon is shiny?")}</p>
        <button type="button" class="btn btn-primary" data-action="terminer">✨ ${esc(c.pokemon)} : ${T("chasse terminée", "hunt finished")}</button>
        <div class="pc-ch-f-ligne">
          <input class="form-control" id="pc-ch-f-autre" placeholder="${T("Un autre Pokémon", "Another Pokémon")}">
          <button type="button" class="btn btn-outline-light" data-action="phase">${T("Nouvelle phase", "New phase")}</button>
        </div>
      </div>
    </div>`;
  }

  // ---- modifier une chasse : Pokémon, jeu, méthode, taux de base, Charme, rencontres, chaîne
  const TAUX_BASE = [[8192, T("1/8192 · jeux 1G à 5G", "1/8192 · Gen 1 to 5 games")],
    [4096, T("1/4096 · à partir de X / Y", "1/4096 · from X / Y on")]];
  function optionsJeux(choisi) {
    let h = `<option value="">${T("— Jeu (facultatif) —", "— Game (optional) —")}</option>`;
    let trouve = !choisi;
    for (const [gen, jeux] of JEUX) {
      h += `<optgroup label="${esc(gen)}">` + jeux.map(([fr, en]) => {
        const v = EN ? en : fr, sel = n(v) === n(choisi) || n(fr) === n(choisi) || n(en) === n(choisi);
        if (sel) trouve = true;
        return `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(v)}</option>`;
      }).join("") + "</optgroup>";
    }
    // jeu écrit à la main sur le PC (ex. « Legend ZA ») : gardé tel quel
    return trouve ? h : h + `<option value="${esc(choisi)}" selected>${esc(choisi)}</option>`;
  }
  function optionsMethodes(jeu, choisie) {
    const m0 = methodeDe({ methode: choisie });
    let h = `<option value="">${T("— Méthode (facultatif) —", "— Method (optional) —")}</option>`;
    for (const g of CAT.groupes) {
      const ms = CAT.methodes.filter((m) => m.groupe === g.id && possible(m, jeu));
      if (ms.length) h += `<optgroup label="${esc(nom(g))}">` + ms.map((m) =>
        `<option value="${esc(nom(m))}"${m === m0 ? " selected" : ""}>${esc(nom(m))}</option>`).join("") + "</optgroup>";
    }
    return h;
  }
  function formEdition(c) {
    const base = tauxBase(c), auto = base === tauxDefaut(c.jeu);
    return `<form class="pc-ch-form pc-ch-f-edit" hidden autocomplete="off">
      <label>${T("Pokémon", "Pokémon")} <input class="form-control" name="pokemon" required value="${esc(c.pokemon)}" list="pc-ch-noms"></label>
      <label>${T("Jeu", "Game")} <select class="form-control" name="jeu">${optionsJeux(c.jeu || "")}</select></label>
      <label>${T("Méthode", "Method")} <select class="form-control" name="methode">${optionsMethodes(c.jeu, c.methode)}</select></label>
      <label>${T("Taux de base", "Base odds")} <select class="form-control" name="taux">
        <option value="auto"${auto ? " selected" : ""}>${T("Selon le jeu", "From the game")}</option>
        ${TAUX_BASE.concat(TAUX_BASE.some(([v]) => v === base) ? [] : [[base, `1/${base}`]]).map(([v, l]) =>
          `<option value="${v}"${!auto && v === base ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
      <label>${T("Rencontres (phase en cours)", "Encounters (current phase)")} <input class="form-control" name="compteur" type="number" min="0" inputmode="numeric" value="${+c.compteur || 0}"></label>
      <label class="pc-ch-f-edit-chaine"${chaineDe(c) ? "" : " hidden"}>${T("Chaîne actuelle", "Current chain")} <input class="form-control" name="chaine" type="number" min="0" inputmode="numeric" value="${chaine(c)}"></label>
      <label class="pc-pf-case pc-ch-f-edit-charme"${charmePossible(c.jeu) ? "" : " hidden"}><input type="checkbox" name="charme"${c.charme ? " checked" : ""}> Charme Chroma</label>
      <p class="pc-ch-f-edit-erreur" hidden></p>
      <div class="pc-pf-boutons">
        <button class="btn btn-primary" type="button" data-action="enregistrer">${T("Enregistrer", "Save")}</button>
        <button class="btn btn-outline-light" type="button" data-action="editer">${T("Annuler", "Cancel")}</button>
      </div></form>`;
  }
  function enregistrerEdition(id, form) {
    const v = (k) => form.elements[k];
    const pokemon = v("pokemon").value.trim(), jeu = v("jeu").value, methode = v("methode").value;
    const err = form.querySelector(".pc-ch-f-edit-erreur");
    const m = methodeDe({ methode });
    if (!pokemon) { err.textContent = T("Indique le nom du Pokémon.", "Enter the Pokémon's name."); err.hidden = false; return; }
    if (m && !possible(m, jeu)) {
      err.textContent = T(`« ${nom(m)} » n'existe pas dans ce jeu.`, `“${nom(m)}” doesn't exist in this game.`);
      err.hidden = false;
      return;
    }
    const compteur = Math.max(0, parseInt(v("compteur").value, 10) || 0);
    const k = Math.max(0, parseInt(v("chaine").value, 10) || 0);
    const taux = v("taux").value === "auto" ? tauxDefaut(jeu) : +v("taux").value;
    form.hidden = true;
    changer(id, (c) => {
      Object.assign(c, { pokemon, jeu, methode, compteur, charme: v("charme").checked && charmePossible(jeu) });
      c.taux = `1/${taux}`;
      c.options = Object.assign({}, c.options, { chaine: chaineDe(c) ? k : 0 });
    });
  }

  function blocChaine(c) {
    const ch = chaineDe(c);
    if (!ch || c.termine) return "";
    const k = chaine(c), pc = Math.min(100, (k / ch.max) * 100);
    return `<div class="pc-ch-chaine">
      <div class="pc-ch-chaine-haut"><span>${T("Chaîne actuelle", "Current chain")}</span>
        <b class="${k >= ch.max ? "pc-ch-chaine-max" : ""}">${nb(k)}<small> / ${nb(ch.max)} max</small></b></div>
      <div class="pc-ch-chaine-barre"><i style="width:${pc}%"></i></div>
      <div class="pc-ch-f-ligne">
        <button type="button" class="pc-ch-chaine-plus" data-action="plus">+1 ${T("chaîne", "chain")}</button>
        <button type="button" data-action="casser">${T("Chaîne cassée", "Chain broken")}</button>
      </div></div>`;
  }
  function blocOptions(c) {
    const opts = optionsDe(c);
    if (!opts.length || c.termine) return "";
    return `<div class="pc-ch-chaine">${opts.map((o) => `<label class="pc-ch-option"><span>${esc(nom(o))}</span>
      <select class="form-select form-select-sm" data-option="${esc(o.id)}">${o.choix.map((x) =>
        `<option value="${x.v}"${x.v === valeurOption(c, o) ? " selected" : ""}>${esc(nom(x))}</option>`).join("")}</select></label>`).join("")}</div>`;
  }

  // ------------------------------------------------------------ clics
  function action(nom, id, el) {
    switch (nom) {
      case "ouvrir": ouvrirFocus(id); break;
      case "fermer": fermerFocus(); break;
      case "plus": noterTemps(); changer(id, (c) => { c.compteur = (+c.compteur || 0) + pas(c); avancerChaine(c, pas(c)); }); vibrer(); break;
      case "moins": changer(id, (c) => { const avant = +c.compteur || 0; c.compteur = Math.max(0, avant - pas(c)); avancerChaine(c, c.compteur - avant); }); break;
      case "editer": {
        const f = el.closest(".pc-ch-f-boite").querySelector(".pc-ch-f-edit");
        f.hidden = !f.hidden;
        el.closest(".pc-ch-f-boite").querySelector(".pc-ch-f-menu").hidden = true;
        if (!f.hidden) f.elements.pokemon.focus();
        break;
      }
      case "enregistrer": enregistrerEdition(id, el.closest("form")); break;
      case "casser": changer(id, (c) => { c.options = Object.assign({}, c.options, { chaine: 0 }); }); break;
      case "envoyer": envoyerSurCompte(id); break;
      case "menu": { const m = el.closest(".pc-ch-f-boite").querySelector(".pc-ch-f-menu"); m.hidden = !m.hidden; break; }
      case "pas": {
        let v = el.dataset.v;
        if (v === "autre") {
          v = prompt(T("Rencontres ajoutées à chaque appui (ex. 5 pour les Hordes) :", "Encounters added per tap (e.g. 5 for Hordes):"));
          if (v === null || !/^\s*\d+\s*$/.test(v)) break;
        }
        v = Math.max(1, Math.min(1000, parseInt(v, 10) || 1));
        changer(id, (c) => { c.options = Object.assign({}, c.options, { pas: v }); delete c.pas; });
        break;
      }
      case "charme": changer(id, (c) => { c.charme = !c.charme; }); break;
      case "modifier": {
        const v = prompt(T("Nouveau nombre de rencontres :", "New encounter count:"));
        if (v !== null && /^\s*\d+\s*$/.test(v)) changer(id, (c) => { c.compteur = parseInt(v, 10); });
        break;
      }
      case "shiny": { const b = el.closest(".pc-ch-f-boite").querySelector(".pc-ch-f-shiny-boite"); b.hidden = !b.hidden; break; }
      case "terminer":
        noterTemps();
        changer(id, (c) => { c.termine = { date: maintenant().slice(0, 19), rencontres: c.compteur, phase: (c.phases || []).length + 1, total: total(c) }; });
        break;
      case "phase": {
        const autre = ($("pc-ch-f-autre").value || "").trim();
        if (!autre) { $("pc-ch-f-autre").focus(); break; }
        noterTemps();
        changer(id, (c) => {
          c.phases = c.phases || [];
          c.phases.push({ numero: c.phases.length + 1, pokemon: autre, rencontres: c.compteur, date: maintenant().slice(0, 19) });
          c.compteur = 0;
        });
        break;
      }
      case "reprendre": changer(id, (c) => { c.termine = null; }); break;
      case "supprimer":
        if (confirm(T("Supprimer définitivement cette chasse ?\n\nSi elle est aussi dans le compteur PC, supprime-la aussi là-bas, sinon elle reviendra.",
                      "Delete this hunt for good?\n\nIf it is also in the PC counter, delete it there too, or it will come back."))) {
          S.focus = null;
          document.body.classList.remove("pc-ch-plein");
          $("pc-ch-focus").hidden = true;
          supprimer(id);
        }
        break;
    }
  }
  function avancerChaine(c, d) {             // méthode à chaîne : la chaîne suit les rencontres
    if (!chaineDe(c) || !d) return;
    c.options = Object.assign({}, c.options, { chaine: Math.max(0, chaine(c) + d) });
  }
  const vibrer = () => { try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* rien */ } };
  const surClic = (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const porteur = b.closest("[data-id]");
    if (porteur) action(b.dataset.action, porteur.dataset.id, b);
  };
  document.querySelector(".pc-ch-page").addEventListener("click", surClic);
  $("pc-ch-focus").addEventListener("click", surClic);
  $("pc-ch-focus").addEventListener("change", (e) => {
    const form = e.target.closest(".pc-ch-f-edit");
    if (!form) return;
    const jeu = form.elements.jeu.value;
    if (e.target.name === "jeu") form.elements.methode.innerHTML = optionsMethodes(jeu, form.elements.methode.value);
    form.querySelector(".pc-ch-f-edit-charme").hidden = !charmePossible(jeu);
    form.querySelector(".pc-ch-f-edit-chaine").hidden = !chaineDe({ methode: form.elements.methode.value });
  });
  $("pc-ch-focus").addEventListener("change", (e) => {     // options (sandwich, Parfum…)
    const sel = e.target.closest("[data-option]"), porteur = e.target.closest("[data-id]");
    if (!sel || !porteur) return;
    changer(porteur.dataset.id, (c) => { c.options = Object.assign({}, c.options, { [sel.dataset.option]: +sel.value }); });
  });

  // ------------------------------------------------------------ nouvelle chasse
  const selJeu = $("pc-ch-f-jeu"), selTaux = $("pc-ch-f-taux"), selMeth = $("pc-ch-f-methode");
  selJeu.add(new Option(T("— Jeu (facultatif) —", "— Game (optional) —"), ""));
  for (const [gen, jeux] of JEUX) {
    const g = document.createElement("optgroup");
    g.label = gen;
    jeux.forEach(([fr, en]) => g.appendChild(new Option(EN ? en : fr, EN ? en : fr)));
    selJeu.appendChild(g);
  }
  function listeMethodes() {
    const garde = selMeth.value;
    selMeth.innerHTML = "";
    selMeth.add(new Option(T("— Méthode (facultatif) —", "— Method (optional) —"), ""));
    for (const g of CAT.groupes) {
      const ms = CAT.methodes.filter((m) => m.groupe === g.id && possible(m, selJeu.value));
      if (!ms.length) continue;
      const og = document.createElement("optgroup");
      og.label = nom(g);
      ms.forEach((m) => og.appendChild(new Option(nom(m), nom(m))));
      selMeth.appendChild(og);
    }
    if ([...selMeth.options].some((o) => o.value === garde)) selMeth.value = garde;
  }
  [[8192, T("1/8192 · jeux 1G à 5G", "1/8192 · Gen 1 to 5 games")], [4096, T("1/4096 · à partir de X / Y", "1/4096 · from X / Y on")],
   [2731, "1/2731"], [1365, "1/1365"], [1024, "1/1024"], [683, "1/683"], [512, "1/512"], [273, "1/273"], [128, "1/128"]]
    .forEach(([v, l]) => selTaux.add(new Option(l, v)));
  const majForm = () => {
    listeMethodes();
    selTaux.value = String(tauxDefaut(selJeu.value));
    const ok = charmePossible(selJeu.value);
    $("pc-ch-f-charme-l").hidden = !ok;
    if (!ok) $("pc-ch-f-charme").checked = false;
  };
  selJeu.addEventListener("change", majForm);
  majForm();
  catalogue.then(() => { majForm(); dessiner(); });
  $("pc-ch-nouvelle").addEventListener("click", () => {
    $("pc-ch-form").hidden = !$("pc-ch-form").hidden;
    if (!$("pc-ch-form").hidden) $("pc-ch-f-nom").focus();
  });
  $("pc-ch-f-annuler").addEventListener("click", () => { $("pc-ch-form").hidden = true; });
  $("pc-ch-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const pokemon = $("pc-ch-f-nom").value.trim();
    if (!pokemon) return;
    const jeu = selJeu.value, charme = $("pc-ch-f-charme").checked;
    const c = { id_local: nouvelId(pokemon, jeu), pokemon, jeu, compteur: 0, phases: [], temps: 0, termine: null,
      methode: selMeth.value, charme, taux: `1/${+selTaux.value}`, options: {} };
    c.taux = tauxAffiche(c);
    creer(c);
    $("pc-ch-f-nom").value = "";
    $("pc-ch-form").hidden = true;
  });

  // ---- bouton « Installer l'application »
  const bt = $("pc-installer");
  const dejaInstallee = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (dejaInstallee) $("pc-aide-installation").hidden = true;
  if (bt && !dejaInstallee) {
    bt.hidden = false;
    bt.addEventListener("click", async () => {
      if (window.pcInvitation) {
        window.pcInvitation.prompt();
        await window.pcInvitation.userChoice;
        window.pcInvitation = null;
        return;
      }
      const ua = navigator.userAgent;
      const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      const bloc = $(ios ? "pc-a-ios" : /Android/.test(ua) ? "pc-a-android" : "pc-a-pc");
      if (bloc && window.bootstrap) window.bootstrap.Collapse.getOrCreateInstance(bloc, { toggle: false }).show();
      else if (bloc) bloc.classList.add("show");
    });
  }

  // ---- clavier (PC) : Espace ou + sur la chasse ouverte (ou la première), − pour retirer
  if (!S.clavier) {
    S.clavier = true;
    document.addEventListener("keydown", (e) => {
      if (!document.getElementById("pc-ch-grille")) return;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      const id = S.focus || (document.querySelector("#pc-ch-grille .pc-ch-carte") || {}).dataset?.id;
      if (!id) return;
      if (e.key === " " || e.key === "+") { e.preventDefault(); S.action("plus", id); }
      if (e.key === "-") { e.preventDefault(); S.action("moins", id); }
      if (e.key === "Escape" && S.focus) S.action("fermer", id);
    });
  }
  S.action = action;

  // ------------------------------------------------------------ démarrage
  async function demarrer() {
    const session = window.pcCompte && window.pcCompte.session;
    chargerCompte(session ? session.user.id : null);
    dessiner();
    if (S.uid) synchroniser();
  }
  S.focus = null;
  document.body.classList.remove("pc-ch-plein");
  (window.pcNomsPrets || Promise.resolve()).then(async () => {
    if (window.pcSupa) {
      const { data } = await window.pcSupa.auth.getSession();
      chargerCompte(data && data.session ? data.session.user.id : null);
    }
    dessiner();
    if (S.uid) synchroniser();
  });
})();
