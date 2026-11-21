// Page Contact : envoi du message par e-mail (service Web3Forms, sans serveur à gérer).
// La clé Web3Forms est publique par conception : elle permet seulement d'envoyer un message
// vers TON adresse e-mail, elle ne donne accès à rien d'autre.
(function () {
  const CLE_WEB3FORMS = "bbec68f9-4407-4d52-b079-1a5a7ef33226"; // clé du formulaire PokéChroma (web3forms.com)

  const EN = window.PC_LANGUE === "en";
  const T = (fr, en) => (EN ? en : fr);
  const form = document.getElementById("pc-contact");
  if (!form) return;
  const etat = document.getElementById("pc-etat");
  const bouton = document.getElementById("btn-envoie-message");
  const sujet = document.getElementById("SujetInput");
  const pseudo = document.getElementById("PseudoInput");
  const mail = document.getElementById("MailInput");
  const version = document.getElementById("VersionInput");
  const message = document.getElementById("MessageInput");
  const ligneVersion = document.getElementById("ligne-version");

  // Arrivée depuis le compteur (bouton « Signaler un bug ») :
  // /contact?sujet=bug&pseudo=Starduust&version=1.13.1
  const params = new URLSearchParams(window.location.search);
  if (params.get("sujet")) sujet.value = params.get("sujet");
  if (params.get("pseudo")) pseudo.value = params.get("pseudo");
  if (params.get("version")) version.value = params.get("version");

  const majVersion = () => {
    ligneVersion.style.display = sujet.value === "bug" ? "block" : "none";
  };
  sujet.addEventListener("change", majVersion);
  majVersion();

  const valide = (champ, ok) => {
    champ.classList.toggle("is-invalid", !ok);
    champ.classList.toggle("is-valid", ok);
    return ok;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ok = [
      valide(pseudo, pseudo.value.trim() !== ""),
      valide(mail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())),
      valide(message, message.value.trim().length >= 5),
    ].every(Boolean);
    if (!ok) {
      etat.textContent = T("Vérifie les champs en rouge.", "Please check the fields in red.");
      return;
    }
    if (!CLE_WEB3FORMS) {
      etat.textContent = T("Le formulaire n'est pas encore relié à une boîte mail.", "The form is not connected to a mailbox yet.");
      return;
    }
    const nomSujet = sujet.options[sujet.selectedIndex].text;
    bouton.disabled = true;
    etat.textContent = T("Envoi en cours…", "Sending…");
    try {
      const r = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: CLE_WEB3FORMS,
          subject: "PokéChroma – " + nomSujet + " – " + pseudo.value.trim(),
          from_name: "Site PokéChroma",
          name: pseudo.value.trim(),
          email: mail.value.trim(),
          sujet: nomSujet,
          langue: EN ? "anglais" : "français",
          version: sujet.value === "bug" ? version.value.trim() : "",
          message: message.value.trim(),
          botcheck: form.botcheck.checked,
        }),
      });
      const data = await r.json();
      if (data.success) {
        form.reset();
        majVersion();
        [pseudo, mail, message].forEach((c) => c.classList.remove("is-valid"));
        etat.textContent = T("Merci ! Ton message est bien envoyé ✨", "Thank you! Your message has been sent ✨");
      } else {
        etat.textContent = T("L'envoi a échoué : ", "Sending failed: ") + (data.message || T("erreur inconnue", "unknown error"));
      }
    } catch (err) {
      etat.textContent = T("L'envoi a échoué. Vérifie ta connexion et réessaie.", "Sending failed. Check your connection and try again.");
    } finally {
      bouton.disabled = false;
    }
  });
})();
