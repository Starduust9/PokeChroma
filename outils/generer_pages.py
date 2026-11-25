"""Pages « pré-remplies » pour Google et pour les aperçus de liens (Discord, réseaux sociaux).

Le site charge le contenu de chaque page en JavaScript. Les moteurs de recherche et les
aperçus de liens lisent surtout le HTML de départ : ce script crée donc, pour chaque page,
un fichier (ex. 1G.html, servi à l'adresse /1G) qui contient déjà son titre, sa description
et son texte. Il met aussi à jour index.html (page d'accueil), 404.html, sitemap.xml et
robots.txt. Une fois chargée, la page fonctionne exactement comme avant.
Chaque page existe aussi en anglais, à l'adresse /en/… (ex. /en/5G, fichier en/5G.html), avec
les balises hreflang qui relient les deux versions pour Google.

À lancer depuis le dossier du site après avoir modifié des pages :
    python outils/generer_pages.py
"""
import html
import os
import re
from datetime import date

ICI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ICI)
SITE = "https://pokechroma.com"
IMAGE = SITE + "/assets/picture/partage.png"
DEBUT, FIN = "<!--pc-contenu-->", "<!--/pc-contenu-->"

# adresse, fichier de la page, titre, description, dans le sitemap ?
PAGES = [
    ("/accueil", "pages/accueil.html", "Le guide du shiny hunting Pokémon",
     "Astuces, guides et outils pour chasser les Pokémon chromatiques (shiny), de la 1G à la 9G : "
     "méthodes, taux, Masuda, Charme Chroma, et le compteur de shiny PokéChroma Counter.", True),
    ("/introshinyhunting", "pages/introshinyhunting.html", "Débuter le shiny hunting",
     "Qu'est-ce qu'un Pokémon chromatique, quelles sont les chances d'en croiser un et comment "
     "commencer à chasser les shiny : le guide pour débuter.", True),
    ("/shinyhuntingjeu", "pages/shinyhuntingjeu.html", "Le shiny hunting dans chaque jeu et les Shiny Lock",
     "Tous les jeux Pokémon de la 1G à la 9G, leurs méthodes de chasse aux shiny et la liste des "
     "Pokémon impossibles à obtenir chromatiques (Shiny Lock).", True),
    ("/1G", "pages/page-gen/1G.html", "Shiny hunting en 1G (Rouge, Bleu, Jaune)",
     "Chasser les shiny en première génération : Pokémon Rouge, Bleu et Jaune, taux, méthodes et astuces.", True),
    ("/2G", "pages/page-gen/2G.html", "Shiny hunting en 2G (Or, Argent, Cristal)",
     "Chasser les shiny en deuxième génération : Pokémon Or, Argent et Cristal, taux, méthodes et astuces.", True),
    ("/3G", "pages/page-gen/3G.html", "Shiny hunting en 3G (Rubis, Saphir, Émeraude, RF/VF)",
     "Chasser les shiny en troisième génération : Rubis, Saphir, Émeraude, Rouge Feu et Vert Feuille, "
     "taux, méthodes et astuces.", True),
    ("/4G", "pages/page-gen/4G.html", "Shiny hunting en 4G (Diamant, Perle, Platine, HG/SS)",
     "Chasser les shiny en quatrième génération : Diamant, Perle, Platine, Or HeartGold et Argent "
     "SoulSilver, Pokéradar, taux et astuces.", True),
    ("/5G", "pages/page-gen/5G.html", "Shiny hunting en 5G (Noir, Blanc, Noir 2, Blanc 2)",
     "Chasser les shiny en cinquième génération : Noir, Blanc, Noir 2 et Blanc 2, Charme Chroma, "
     "taux et astuces.", True),
    ("/6G", "pages/page-gen/6G.html", "Shiny hunting en 6G (X, Y, Rubis Oméga, Saphir Alpha)",
     "Chasser les shiny en sixième génération : X, Y, Rubis Oméga et Saphir Alpha, pêche à la "
     "chaîne, Navidex, taux et astuces.", True),
    ("/7G", "pages/page-gen/7G.html", "Shiny hunting en 7G (Soleil, Lune, Ultra, Let's Go)",
     "Chasser les shiny en septième génération : Soleil, Lune, Ultra-Soleil, Ultra-Lune et Let's Go, "
     "chaînes SOS, combos de capture, taux et astuces.", True),
    ("/8G", "pages/page-gen/8G.html", "Shiny hunting en 8G (Épée, Bouclier, DEPS, Arceus)",
     "Chasser les shiny en huitième génération : Épée, Bouclier, Diamant Étincelant, Perle "
     "Scintillante et Légendes Arceus, taux et astuces.", True),
    ("/9G", "pages/page-gen/9G.html", "Shiny hunting en 9G (Écarlate, Violet, Légendes Z-A)",
     "Chasser les shiny en neuvième génération : Écarlate, Violet et Légendes Pokémon Z-A, "
     "apparitions massives, sandwichs, taux et astuces.", True),
    ("/masuda", "pages/page-gen/masuda.html", "La méthode Masuda",
     "La méthode Masuda expliquée : faire éclore des œufs de parents de pays différents pour "
     "augmenter ses chances de shiny, avec les taux par génération.", True),
    ("/charmechroma", "pages/page-gen/charmechroma.html", "Le Charme Chroma",
     "Comment obtenir le Charme Chroma dans chaque jeu Pokémon et combien il augmente les chances "
     "de rencontrer un shiny.", True),
    ("/compteur", "pages/compteur.html", "PokéChroma Counter, le compteur de shiny automatique",
     "Compteur de shiny gratuit pour Windows : il compte tes rencontres tout seul avec ta carte "
     "de capture et t'alerte quand le Pokémon est chromatique.", True),
    ("/compteurs", "pages/compteurs.html", "Mes chasses : compteur de shiny en ligne",
     "Compteurs de chasse shiny sur téléphone et PC, même hors connexion, synchronisés avec "
     "PokéChroma Counter.", True),
    ("/guides", "pages/guides.html", "Tous les guides de shiny hunting",
     "Tous les guides PokéChroma : débuter, chaque génération de la 1G à la 9G, Masuda, Charme Chroma.", True),
    ("/siteaide", "pages/siteaide.html", "Sites d'aide pour le shiny hunting",
     "Les sites et outils utiles pour chasser les Pokémon chromatiques.", True),
    ("/streameryoutuber", "pages/streameryoutuber.html", "Streamers et YouTubers shiny hunting",
     "Des streamers et YouTubers francophones de shiny hunting à suivre.", True),
    ("/contact", "pages/contact.html", "Contact",
     "Une question, un bug ou une idée pour PokéChroma ? Écris-nous.", True),
    ("/confidentialite", "pages/confidentialite.html", "Politique de confidentialité",
     "Les données gardées par PokéChroma, le site et le compteur, et comment les supprimer.", True),
    # pages personnelles : accessibles, mais pas proposées à Google
    ("/profil", "pages/profil.html", "Profil", "Le profil PokéChroma d'un chasseur de shiny.", False),
    ("/joueurs", "pages/joueurs.html", "Joueurs", "Les joueurs PokéChroma et tes amis.", False),
]


# titres et descriptions anglais (même ordre d'adresses que PAGES)
PAGES_EN = {
    "/accueil": ("The Pokémon shiny hunting guide",
                 "Tips, guides and tools to hunt shiny Pokémon from Gen 1 to Gen 9: methods, odds, "
                 "Masuda, Shiny Charm, and the PokéChroma Counter shiny counter."),
    "/introshinyhunting": ("Getting started with shiny hunting",
                           "What a shiny Pokémon is, what your odds of meeting one are and how to start "
                           "shiny hunting: the beginner's guide."),
    "/shinyhuntingjeu": ("Shiny hunting in every game and Shiny Locks",
                         "Every Pokémon game from Gen 1 to Gen 9, their shiny hunting methods and the "
                         "list of Pokémon that can't be shiny (Shiny Lock)."),
    "/1G": ("Shiny hunting in Gen 1 (Red, Blue, Yellow)",
            "Shiny hunting in the first generation: Pokémon Red, Blue and Yellow, odds, methods and tips."),
    "/2G": ("Shiny hunting in Gen 2 (Gold, Silver, Crystal)",
            "Gen 2 shiny odds and methods: Pokémon Gold, Silver and Crystal, shiny breeding and tips."),
    "/3G": ("Shiny hunting in Gen 3 (Ruby, Sapphire, Emerald, FR/LG)",
            "Gen 3 shiny odds and methods: Ruby, Sapphire, Emerald, FireRed and LeafGreen, tips and tricks."),
    "/4G": ("Shiny hunting in Gen 4 (Diamond, Pearl, Platinum, HG/SS)",
            "Gen 4 shiny odds and methods: Diamond, Pearl, Platinum, HeartGold and SoulSilver, "
            "Poké Radar, Masuda and tips."),
    "/5G": ("Shiny hunting in Gen 5 (Black, White, Black 2, White 2)",
            "Gen 5 shiny odds and methods: Black, White, Black 2 and White 2, Shiny Charm, Masuda and tips."),
    "/6G": ("Shiny hunting in Gen 6 (X, Y, Omega Ruby, Alpha Sapphire)",
            "Gen 6 shiny odds and methods: X, Y, Omega Ruby and Alpha Sapphire, chain fishing, DexNav, "
            "Friend Safari and tips."),
    "/7G": ("Shiny hunting in Gen 7 (Sun, Moon, Ultra, Let's Go)",
            "Gen 7 shiny odds and methods: Sun, Moon, Ultra Sun, Ultra Moon and Let's Go, SOS chains, "
            "catch combos and tips."),
    "/8G": ("Shiny hunting in Gen 8 (Sword, Shield, BDSP, Arceus)",
            "Gen 8 shiny odds and methods: Sword, Shield, Brilliant Diamond, Shining Pearl and Legends: "
            "Arceus, Dynamax Adventures, mass outbreaks and tips."),
    "/9G": ("Shiny hunting in Gen 9 (Scarlet, Violet, Legends Z-A)",
            "Gen 9 shiny odds and methods: Scarlet, Violet and Pokémon Legends Z-A, mass outbreaks, "
            "Sparkling Power sandwiches and tips."),
    "/masuda": ("The Masuda method",
                "The Masuda method explained: breeding Pokémon from different countries to boost your "
                "shiny odds, with the odds for every generation."),
    "/charmechroma": ("The Shiny Charm",
                      "How to get the Shiny Charm in every Pokémon game and how much it boosts your "
                      "shiny odds."),
    "/compteur": ("PokéChroma Counter, the automatic shiny counter",
                  "Free shiny counter for Windows: it counts your encounters on its own with your capture "
                  "card and alerts you when the Pokémon is shiny."),
    "/compteurs": ("My hunts: online shiny counter",
                   "Shiny hunt counters on phone and PC, even offline, synced with PokéChroma Counter."),
    "/guides": ("All shiny hunting guides",
                "Every PokéChroma guide: getting started, every generation from Gen 1 to Gen 9, Masuda, "
                "Shiny Charm."),
    "/siteaide": ("Helpful sites for shiny hunting", "Useful sites and tools to hunt shiny Pokémon."),
    "/streameryoutuber": ("Shiny hunting streamers and YouTubers",
                          "Shiny hunting streamers and YouTubers worth following."),
    "/contact": ("Contact", "A question, a bug or an idea for PokéChroma? Write to us."),
    "/confidentialite": ("Privacy policy",
                         "The data kept by PokéChroma, the website and the counter, and how to delete it."),
    "/profil": ("Profile", "A PokéChroma shiny hunter's profile."),
    "/joueurs": ("Players", "PokéChroma players and your friends."),
}


def adresse_en(adresse):
    return "/en/" if adresse == "/" else "/en" + adresse


def meta(titre, description, adresse, indexer=True, langue="fr", adresse_fr=None):
    t, d = html.escape(titre + " - PokéChroma"), html.escape(description)
    url = SITE + adresse
    fr = adresse_fr if adresse_fr is not None else adresse
    lignes = [
        f"<title>{t}</title>",
        f'<meta name="description" content="{d}">',
        f'<link rel="canonical" href="{url}">',
        # les deux versions de la page (français / anglais), pour Google
        f'<link rel="alternate" hreflang="fr" href="{SITE + fr}">',
        f'<link rel="alternate" hreflang="en" href="{SITE + adresse_en(fr)}">',
        f'<link rel="alternate" hreflang="x-default" href="{SITE + fr}">',
        f'<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="PokéChroma">',
        f'<meta property="og:title" content="{t}">',
        f'<meta property="og:description" content="{d}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{IMAGE}">',
        f'<meta property="og:locale" content="{"en_US" if langue == "en" else "fr_FR"}">',
        f'<meta name="twitter:card" content="summary_large_image">',
    ]
    if not indexer:
        lignes.append('<meta name="robots" content="noindex">')
    return "\n    ".join(lignes)


modele = open("index.html", encoding="utf-8").read()
# zone des balises gérées par ce script (titre, description, aperçus)
modele = re.sub(r"\s*<!--pc-meta-->.*?<!--/pc-meta-->", "", modele, flags=re.S)
modele = re.sub(r"\s*<title>.*?</title>", "", modele, flags=re.S)
modele = re.sub(r'\s*<meta name="description"[^>]*>', "", modele)
modele = modele.replace("</head>", "    <!--pc-meta-->\n    {META}\n    <!--/pc-meta-->\n</head>", 1)
# zone du contenu de la page
modele = re.sub(re.escape(DEBUT) + r".*?" + re.escape(FIN), DEBUT + FIN, modele, flags=re.S)
if DEBUT not in modele:
    modele = re.sub(r'(<main id="main-page">).*?(</main>)', r"\1" + DEBUT + FIN + r"\2", modele, flags=re.S)
assert DEBUT in modele, "zone <main id=main-page> introuvable"


def page(adresse, fichier, titre, description, indexer):
    contenu = open(fichier, encoding="utf-8").read()
    return (modele.replace("{META}", meta(titre, description, adresse, indexer))
            .replace(DEBUT + FIN, DEBUT + "\n" + contenu + "\n" + FIN))


# ---- version anglaise : textes du menu et du pied de page (les mêmes que js/langue.js)
TEXTES_EN = dict(re.findall(r'^\s*"([\w.]+)":\s*"((?:[^"\\]|\\.)*)",?\s*$',
                            open("js/langue.js", encoding="utf-8").read(), flags=re.M))
TEXTES_EN = {k: v.replace('\\"', '"') for k, v in TEXTES_EN.items()}
ROUTES = {p[0] for p in PAGES} | {"/"}


def liens_en(texte):
    """Liens internes vers les pages anglaises (/5G -> /en/5G, / -> /en/)."""
    def remplacer(m):
        chemin, reste = m.group(2), m.group(3)
        if chemin in ROUTES:
            return f'{m.group(1)}"{adresse_en(chemin)}{reste}"'
        return m.group(0)
    return re.sub(r'(href=)"(/[^"?#]*)([^"]*)"', remplacer, texte)


def textes_en(texte):
    """Menu et pied de page déjà en anglais (le français est gardé dans data-fr)."""
    def remplacer(m):
        ouverture, cle, interieur, fermeture = m.group(1), m.group(3), m.group(4), m.group(5)
        if cle not in TEXTES_EN:
            return m.group(0)
        ouverture = ouverture[:-1] + f' data-fr="{html.escape(interieur, quote=True)}">'
        return ouverture + TEXTES_EN[cle] + fermeture
    return re.sub(r'(<(\w+)\b[^>]*\bdata-i18n="([\w.]+)"[^>]*>)(.*?)(</\2>)', remplacer, texte, flags=re.S)


modele_en = textes_en(liens_en(modele.replace('<html lang="fr">', '<html lang="en">', 1)))


def page_en(adresse_fr, fichier, indexer):
    titre, description = PAGES_EN[adresse_fr if adresse_fr != "/" else "/accueil"]
    fichier_en = fichier.replace("pages/", "pages/en/", 1)
    contenu = open(fichier_en if os.path.exists(fichier_en) else fichier, encoding="utf-8").read()
    return (modele_en.replace("{META}", meta(titre, description, adresse_en(adresse_fr), indexer,
                                             "en", adresse_fr))
            .replace(DEBUT + FIN, DEBUT + "\n" + liens_en(contenu) + "\n" + FIN))


faites = []
os.makedirs("en", exist_ok=True)
for adresse, fichier, titre, description, indexer in PAGES:
    nom = adresse.strip("/") + ".html"
    open(nom, "w", encoding="utf-8").write(page(adresse, fichier, titre, description, indexer))
    open(os.path.join("en", nom), "w", encoding="utf-8").write(page_en(adresse, fichier, indexer))
    faites.append(nom)
# accueil : index.html (adresse « / ») ; page introuvable : 404.html (vrai code 404)
a = PAGES[0]
open("index.html", "w", encoding="utf-8").write(page("/", a[1], a[2], a[3], True))
open(os.path.join("en", "index.html"), "w", encoding="utf-8").write(page_en("/", a[1], True))
open("404.html", "w", encoding="utf-8").write(
    page("/404", "pages/404.html", "Page introuvable", "Cette page n'existe pas.", False))

aujourdhui = date.today().isoformat()
urls = ["/"] + [p[0] for p in PAGES if p[4] and p[0] != "/accueil"]
with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n')
    for u in urls:
        versions = (f'    <xhtml:link rel="alternate" hreflang="fr" href="{SITE}{u}"/>\n'
                    f'    <xhtml:link rel="alternate" hreflang="en" href="{SITE}{adresse_en(u)}"/>\n'
                    f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{u}"/>\n')
        for loc in (u, adresse_en(u)):
            f.write(f"  <url>\n    <loc>{SITE}{loc}</loc>\n    <lastmod>{aujourdhui}</lastmod>\n"
                    f"{versions}  </url>\n")
    f.write("</urlset>\n")
with open("robots.txt", "w", encoding="utf-8") as f:
    f.write(f"User-agent: *\nAllow: /\nDisallow: /profil\nDisallow: /joueurs\n"
            f"Disallow: /en/profil\nDisallow: /en/joueurs\n\nSitemap: {SITE}/sitemap.xml\n")
print(f"{len(faites)} pages (+ {len(faites)} en anglais) + index.html + 404.html, "
      f"sitemap ({2 * len(urls)} adresses), robots.txt")
