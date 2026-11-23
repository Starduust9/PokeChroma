"""Met à jour la liste des fichiers gardés hors ligne dans sw.js (pages + images des guides).

À lancer depuis le dossier du site après avoir ajouté ou modifié des pages :
    python outils/generer_cache.py
La version du cache est augmentée à chaque fois, pour que les visiteurs reçoivent la nouveauté.
"""
import glob
import json
import os
import re
from urllib.parse import unquote

ICI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ICI)

# d'abord les pages pré-remplies (Google, aperçus de liens), sitemap et robots.txt
import runpy  # noqa: E402
runpy.run_path(os.path.join(ICI, "outils", "generer_pages.py"))
os.chdir(ICI)

fichiers = ["/", "/manifest.webmanifest", "/manifest-compteurs.webmanifest",
            "/scss/main.css", "/scss/pokechroma.css", "/assets/picture/favicon.ico",
            "/assets/picture/icone-192.png", "/assets/picture/icone-512.png",
            "/assets/picture/drapeau-fr.svg", "/assets/picture/drapeau-en.svg",
            "/assets/picture/Logo.png", "/assets/data/tutos.json", "/assets/data/noms_pokemon.json"]
pages = []
for motif in ("Router/*.js", "js/*.js", "pages/*.html", "pages/page-gen/*.html",
              "pages/en/*.html", "pages/en/page-gen/*.html"):
    for f in sorted(glob.glob(motif)):
        if not f.endswith("home.html"):
            fichiers.append("/" + f.replace("\\", "/"))
            if f.endswith(".html"):
                pages.append(f)

# images utilisées par les pages et par les feuilles de style
images = set()
for f in pages + ["index.html"]:
    for src in re.findall(r'src="(/assets/[^"]+)"', open(f, encoding="utf-8").read()):
        images.add(unquote(src))
for f in ("scss/main.css", "scss/pokechroma.css"):
    for src in re.findall(r"url\((?:\.\.)?(/?assets/[^)\"']+)\)", open(f, encoding="utf-8").read()):
        images.add("/" + src.lstrip("/"))
images = sorted(i for i in images if os.path.exists(i.lstrip("/")))
images = [i for i in images if i not in fichiers]

taille = sum(os.path.getsize(f.lstrip("/")) for f in fichiers + images if os.path.isfile(f.lstrip("/")))
s = open("sw.js", encoding="utf-8").read()
m = re.search(r'const VERSION = "pc-v(\d+)";', s)
version = int(m.group(1)) + 1 if m else 1
s = re.sub(r'const VERSION = "pc-v\d+";', f'const VERSION = "pc-v{version}";', s)
s = re.sub(r"const A_GARDER = \[.*?\];", "const A_GARDER = " +
           json.dumps(fichiers, ensure_ascii=False, indent=2) + ";", s, flags=re.S)
s = re.sub(r"const IMAGES = \[.*?\];", "const IMAGES = " +
           json.dumps(images, ensure_ascii=False, indent=2) + ";", s, flags=re.S)
open("sw.js", "w", encoding="utf-8").write(s)
print(f"pc-v{version} : {len(fichiers)} fichiers de base + {len(images)} images, "
      f"{taille / 1048576:.1f} Mo une fois le site installé")
