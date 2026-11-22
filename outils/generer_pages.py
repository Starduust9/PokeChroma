"""Pages « pré-remplies » pour Google et pour les aperçus de liens (Discord, réseaux sociaux).

Le site charge le contenu de chaque page en JavaScript. Les moteurs de recherche et les
aperçus de liens lisent surtout le HTML de départ : ce script crée donc, pour chaque page,
un fichier (ex. 1G.html, servi à l'adresse /1G) qui contient déjà son titre, sa description
et son texte. Il met aussi à jour index.html (page d'accueil), 404.html, sitemap.xml et
robots.txt. Une fois chargée, la page fonctionne exactement comme avant.

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


def meta(titre, description, adresse, indexer=True):
    t, d = html.escape(titre + " - PokéChroma"), html.escape(description)
    url = SITE + adresse
    lignes = [
        f"<title>{t}</title>",
        f'<meta name="description" content="{d}">',
        f'<link rel="canonical" href="{url}">',
        f'<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="PokéChroma">',
        f'<meta property="og:title" content="{t}">',
        f'<meta property="og:description" content="{d}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{IMAGE}">',
        f'<meta property="og:locale" content="fr_FR">',
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


faites = []
for adresse, fichier, titre, description, indexer in PAGES:
    nom = adresse.strip("/") + ".html"
    open(nom, "w", encoding="utf-8").write(page(adresse, fichier, titre, description, indexer))
    faites.append(nom)
# accueil : index.html (adresse « / ») ; page introuvable : 404.html (vrai code 404)
a = PAGES[0]
open("index.html", "w", encoding="utf-8").write(page("/", a[1], a[2], a[3], True))
open("404.html", "w", encoding="utf-8").write(
    page("/404", "pages/404.html", "Page introuvable", "Cette page n'existe pas.", False))

aujourdhui = date.today().isoformat()
urls = ["/"] + [p[0] for p in PAGES if p[4] and p[0] != "/accueil"]
with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u in urls:
        f.write(f"  <url><loc>{SITE}{u}</loc><lastmod>{aujourdhui}</lastmod></url>\n")
    f.write("</urlset>\n")
with open("robots.txt", "w", encoding="utf-8") as f:
    f.write(f"User-agent: *\nAllow: /\nDisallow: /profil\nDisallow: /joueurs\n\nSitemap: {SITE}/sitemap.xml\n")
print(f"{len(faites)} pages + index.html + 404.html, sitemap ({len(urls)} adresses), robots.txt")
