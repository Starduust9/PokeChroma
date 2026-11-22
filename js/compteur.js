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

  // « Installer l'application » (app web PokéChroma) : la fenêtre d'installation du navigateur
  // si elle est proposée (Android, PC), sinon les étapes de l'appareil (iPhone…)
  const bt = document.getElementById("pc-installer");
  const installee = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (bt && !installee) {
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
      const bloc = document.getElementById(ios ? "pc-a-ios" : /Android/.test(ua) ? "pc-a-android" : "pc-a-pc");
      if (bloc && window.bootstrap) window.bootstrap.Collapse.getOrCreateInstance(bloc, { toggle: false }).show();
      else if (bloc) bloc.classList.add("show");
    });
  }

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
})();
