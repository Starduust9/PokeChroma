// Page « PokéChroma Counter » : version actuelle et agrandissement des captures
(function () {
  // dernière version publiée (affichée sur le bouton de téléchargement)
  fetch("https://api.github.com/repos/Starduust9/PokeChroma-Counter/releases/latest")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const el = document.getElementById("cpt-version");
      if (data && data.tag_name && el) {
        el.textContent = "(version " + data.tag_name.replace(/^v/, "") + ")";
      }
    })
    .catch(() => {});

  // clic sur une capture : elle s'affiche en grand
  const zoom = document.getElementById("cpt-zoom");
  if (!zoom) return;
  document.querySelectorAll(".cpt-captures img").forEach((img) => {
    img.addEventListener("click", () => {
      zoom.querySelector("img").src = img.src;
      zoom.style.display = "flex";
    });
  });
  zoom.addEventListener("click", () => (zoom.style.display = "none"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") zoom.style.display = "none";
  });

  // « Installer le site » : la fenêtre d'installation du navigateur, si elle est disponible
  const btSite = document.getElementById("pc-installer-site");
  if (btSite) {
    btSite.addEventListener("click", async () => {
      if (window.pcInvitation) {
        window.pcInvitation.prompt();
        await window.pcInvitation.userChoice;
        window.pcInvitation = null;
      } else {
        const aide = document.getElementById("pc-installer-site-aide");
        if (aide) aide.style.color = "#ffd84a";
        const acc = document.getElementById("pc-accordeon-cpt");
        if (acc) acc.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
})();
