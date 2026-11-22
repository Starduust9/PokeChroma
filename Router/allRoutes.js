import Route from "./Route.js";

//Définir ici vos routes
export const allRoutes = [
    new Route("/", "Accueil", "/pages/accueil.html", "", "Home"),
    new Route("/accueil", "Accueil", "/pages/accueil.html", "", "Home"),
    new Route("/contact", "Contact", "/pages/contact.html", "/js/contact.js", "Contact"),
    new Route("/introshinyhunting", "Introduction au Shiny Hunting", "/pages/introshinyhunting.html", "", "Getting started with shiny hunting"),
    new Route("/shinyhuntingjeu", "Le Shiny Hunting dans les jeux", "/pages/shinyhuntingjeu.html", "", "Shiny hunting in the games"),
    new Route("/siteaide", "Site d'aide", "/pages/siteaide.html", "", "Helpful sites"),
    new Route("/streameryoutuber", "Streamer Youtuber", "/pages/streameryoutuber.html", "", "Streamers & YouTubers"),
    new Route("/compteur", "PokéChroma Counter", "/pages/compteur.html", "/js/compteur.js", "PokéChroma Counter"),
    new Route("/profil", "Profil", "/pages/profil.html", "/js/profil.js", "Profile"),
    new Route("/compteurs", "Mes compteurs", "/pages/compteurs.html", "/js/compteurs.js", "My counters"),
    new Route("/confidentialite", "Confidentialité", "/pages/confidentialite.html", "", "Privacy policy"),
    new Route("/1G", "1G", "/pages/page-gen/1G.html", "", "Gen 1"),
    new Route("/2G", "2G", "/pages/page-gen/2G.html", "", "Gen 2"),
    new Route("/3G", "3G", "/pages/page-gen/3G.html", "", "Gen 3"),
    new Route("/4G", "4G", "/pages/page-gen/4G.html", "", "Gen 4"),
    new Route("/5G", "5G", "/pages/page-gen/5G.html", "", "Gen 5"),
    new Route("/6G", "6G", "/pages/page-gen/6G.html", "", "Gen 6"),
    new Route("/7G", "7G", "/pages/page-gen/7G.html", "", "Gen 7"),
    new Route("/8G", "8G", "/pages/page-gen/8G.html", "", "Gen 8"),
    new Route("/9G", "9G", "/pages/page-gen/9G.html", "", "Gen 9"),
    new Route("/masuda", "Masuda", "/pages/page-gen/masuda.html", "", "Masuda method"),
    new Route("/charmechroma", "Charme Chroma", "/pages/page-gen/charmechroma.html", "", "Shiny Charm"),
];

//Le titre s'affiche comme ceci : Route.titre - websitename
export const websiteName = "PokéChroma";