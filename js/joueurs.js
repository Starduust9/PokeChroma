// Page /joueurs : recherche de joueurs, amis et demandes d'amis (les mêmes que dans le compteur PC).
(async function () {
  const EN = window.PC_LANGUE === "en";
  const T = (fr, en) => (EN ? en : fr);
  const esc = window.pcEchapper;
  const $ = (id) => document.getElementById(id);
  const supa = window.pcSupa;
  if (!$("pc-j-amis") || !supa) return;

  const ligneJoueur = (p, boutons) => {
    const img = window.pcImageProfil(p);
    return `<div class="pc-j-ligne" data-id="${esc(p.id)}">
      <a class="pc-pf-joueur" href="/profil?u=${encodeURIComponent(p.pseudo || "")}">
        ${img ? `<img src="${esc(img)}" alt="" onerror="this.style.visibility='hidden'">` : "<span></span>"}
        <span>${esc(p.pseudo || "?")}</span>
        ${p.discord_tag ? `<span class="pc-pf-tag">${esc(p.discord_tag)}</span>` : ""}
      </a>
      <div class="pc-j-boutons">${boutons}</div>
    </div>`;
  };
  const CHAMPS = "id,pseudo,avatar,avatar_discord,discord_avatar,photo_compte,discord_tag";

  // ---- recherche
  $("pc-pf-chercher").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("pc-pf-joueur").value.trim();
    const zone = $("pc-pf-resultats");
    if (q.length < 2) { zone.innerHTML = ""; return; }
    zone.innerHTML = `<p class="pc-legende">${T("Recherche…", "Searching…")}</p>`;
    const motif = "%" + q.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
    const { data, error } = await supa.from("profils").select(CHAMPS)
      .not("pseudo", "is", null).ilike("pseudo", motif).order("pseudo").limit(12);
    if (error) { zone.innerHTML = `<p class="pc-legende">${T("Recherche impossible pour le moment.", "Search unavailable right now.")}</p>`; return; }
    zone.innerHTML = data.length ? data.map((p) => {
      const img = window.pcImageProfil(p);
      return `<a class="pc-pf-joueur" href="/profil?u=${encodeURIComponent(p.pseudo)}">` +
        (img ? `<img src="${esc(img)}" alt="" onerror="this.style.visibility='hidden'">` : "<span></span>") +
        `<span>${esc(p.pseudo)}</span></a>`;
    }).join("") : `<p class="pc-legende">${T("Aucun joueur trouvé.", "No player found.")}</p>`;
  });

  await window.pcNomsPrets;
  const { data: { session } } = await supa.auth.getSession();
  if (!session) { $("pc-j-connexion").hidden = false; return; }
  const uid = session.user.id;

  async function charger() {
    const [rAmis, rDem] = await Promise.all([
      supa.from("amis").select("ami_id").eq("profil_id", uid),
      supa.from("demandes_amis").select("de_id,a_id").eq("a_id", uid),
    ]);
    const idsAmis = (rAmis.data || []).map((r) => r.ami_id);
    const idsDem = (rDem.data || []).map((r) => r.de_id);
    const tous = [...new Set([...idsAmis, ...idsDem])];
    const profils = {};
    if (tous.length) {
      const { data } = await supa.from("profils").select(CHAMPS).in("id", tous);
      (data || []).forEach((p) => { profils[p.id] = p; });
    }
    $("pc-j-bloc-demandes").hidden = !idsDem.length;
    $("pc-j-demandes").innerHTML = idsDem.filter((i) => profils[i]).map((i) => ligneJoueur(profils[i],
      `<button class="btn btn-primary btn-sm" type="button" data-j="accepter">✓ ${T("Accepter", "Accept")}</button>
       <button class="btn btn-outline-light btn-sm" type="button" data-j="refuser">${T("Refuser", "Decline")}</button>`)).join("");
    $("pc-j-bloc-amis").hidden = false;
    $("pc-j-titre-amis").textContent = `${T("Mes amis", "My friends")} (${idsAmis.length})`;
    const amis = idsAmis.filter((i) => profils[i]).map((i) => profils[i])
      .sort((a, b) => String(a.pseudo).localeCompare(String(b.pseudo)));
    $("pc-j-amis").innerHTML = amis.length ? amis.map((p) => ligneJoueur(p,
      `<button class="btn btn-outline-light btn-sm" type="button" data-j="retirer">${T("Retirer", "Remove")}</button>`)).join("")
      : `<p class="pc-legende">${T("Pas encore d'amis : cherche un joueur ci-dessus et ouvre son profil pour l'ajouter.",
        "No friends yet: find a player above and open their profile to add them.")}</p>`;
    if (window.pcMajDemandes) window.pcMajDemandes();
  }

  document.querySelector(".pc-pf-page").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-j]");
    if (!b) return;
    const id = b.closest("[data-id]").dataset.id;
    b.disabled = true;
    if (b.dataset.j === "accepter") await supa.rpc("accepter_ami", { p_de: id });
    if (b.dataset.j === "refuser") await supa.from("demandes_amis").delete().eq("de_id", id).eq("a_id", uid);
    if (b.dataset.j === "retirer") {
      if (confirm(T("Retirer ce joueur de tes amis ?", "Remove this player from your friends?"))) await supa.rpc("retirer_ami", { p_ami: id });
    }
    charger();
  });
  charger();
})();
