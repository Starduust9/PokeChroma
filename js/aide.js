// ❓ Aide : fenêtre des tutoriels (les mêmes que dans le logiciel PC, assets/data/tutos.json).
// Sur grand écran : la liste à gauche, le tutoriel à droite. Sur téléphone : la liste, puis le
// tutoriel choisi (bouton ← pour revenir).
(function () {
  let tutos = null;
  const EN = () => window.PC_LANGUE === "en";
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function charger() {
    if (tutos) return tutos;
    const r = await fetch("/assets/data/tutos.json");
    tutos = (await r.json()).tutos || [];
    return tutos;
  }

  function fenetre() {
    let f = document.getElementById("pc-aide");
    if (f) return f;
    f = document.createElement("div");
    f.id = "pc-aide";
    f.className = "pc-aide";
    f.hidden = true;
    f.innerHTML = `<div class="pc-aide-boite" role="dialog" aria-modal="true">
        <div class="pc-aide-haut"><h2></h2><button type="button" class="pc-aide-fermer" aria-label="Fermer">✕</button></div>
        <p class="pc-aide-sous"></p>
        <div class="pc-aide-corps"><nav class="pc-aide-menu"></nav><article class="pc-aide-tuto"></article></div>
      </div>`;
    document.body.appendChild(f);
    f.addEventListener("click", (e) => {
      if (e.target === f || e.target.closest(".pc-aide-fermer")) fermer();
      const b = e.target.closest("[data-tuto]");
      if (b) montrer(+b.dataset.tuto);
      if (e.target.closest(".pc-aide-retour")) f.classList.remove("pc-aide-detail");
      if (e.target.closest(".pc-aide-tuto a")) fermer();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !f.hidden) fermer(); });
    return f;
  }

  function fermer() {
    const f = document.getElementById("pc-aide");
    if (f) f.hidden = true;
    document.body.classList.remove("pc-aide-ouverte");
  }

  function montrer(k) {
    const f = fenetre();
    const lg = EN() ? "en" : "fr";
    const t = tutos[k], c = t[lg];
    f.querySelectorAll("[data-tuto]").forEach((b) => b.classList.toggle("actif", +b.dataset.tuto === k));
    f.querySelector(".pc-aide-tuto").innerHTML = `
      <button type="button" class="pc-aide-retour">← ${EN() ? "All topics" : "Tous les sujets"}</button>
      <h3>${esc(t.icone)} ${esc(c.titre)}</h3>
      <p class="pc-aide-intro">${esc(c.intro)}</p>
      <ol>${c.etapes.map((e) => `<li>${esc(e)}</li>`).join("")}</ol>
      ${c.lien ? `<a class="btn btn-primary" href="${esc(c.lien[0])}">${esc(c.lien[1])} →</a>` : ""}`;
    f.classList.add("pc-aide-detail");
    f.querySelector(".pc-aide-tuto").scrollTop = 0;
  }

  // ouvre l'aide (sur un tutoriel précis si demandé : « compteur-2d », « appli »…)
  window.pcAide = async function (id) {
    const f = fenetre();
    try { await charger(); } catch (e) { return; }
    const lg = EN() ? "en" : "fr";
    f.querySelector("h2").textContent = EN() ? "Help and tutorials" : "Aide et tutoriels";
    f.querySelector(".pc-aide-sous").textContent = EN()
      ? "Pick a topic: the PC counter, the phone app or the website."
      : "Choisis un sujet : le compteur PC, l'appli sur téléphone ou le site.";
    f.querySelector(".pc-aide-menu").innerHTML = tutos.map((t, k) =>
      `<button type="button" data-tuto="${k}"><span>${esc(t.icone)}</span>${esc(t[lg].titre)}</button>`).join("");
    f.hidden = false;
    document.body.classList.add("pc-aide-ouverte");
    const k = Math.max(0, tutos.findIndex((t) => t.id === id));
    montrer(k);
    // sur téléphone, on commence par la liste (sauf si un sujet précis est demandé)
    if (!id && window.matchMedia("(max-width: 700px)").matches) f.classList.remove("pc-aide-detail");
    return false;
  };
})();
