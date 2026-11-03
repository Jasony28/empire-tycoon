// ===== EMPIRE TYCOON — Données du jeu =====
const DAY = 90; // durée d'une journée en secondes réelles

const ITEMS = {
  ble:      { n: "Blé",            e: "🌾", p: 4 },
  carotte:  { n: "Carotte",        e: "🥕", p: 7 },
  patate:   { n: "Pomme de terre", e: "🥔", p: 6 },
  tomate:   { n: "Tomate",         e: "🍅", p: 9 },
  mais:     { n: "Maïs",           e: "🌽", p: 8 },
  fraise:   { n: "Fraise",         e: "🍓", p: 15 },
  oeuf:     { n: "Œuf",            e: "🥚", p: 9 },
  lait:     { n: "Lait",           e: "🥛", p: 13 },
  farine:   { n: "Farine",         e: "🥣", p: 17 },
  frites:   { n: "Frites",         e: "🍟", p: 28 },
  popcorn:  { n: "Pop-corn",       e: "🍿", p: 34 },
  sauce:    { n: "Sauce tomate",   e: "🥫", p: 42 },
  pates:    { n: "Pâtes fraîches", e: "🍜", p: 50 },
  pain:     { n: "Pain",           e: "🥖", p: 48 },
  fromage:  { n: "Fromage",        e: "🧀", p: 56 },
  confiture:{ n: "Confiture",      e: "🫙", p: 68 },
  gateau:   { n: "Gâteau",         e: "🎂", p: 140 },
  raisin:   { n: "Raisin",         e: "🍇", p: 22 },
  tournesol:{ n: "Tournesol",      e: "🌻", p: 26 },
  citrouille:{ n: "Citrouille",    e: "🎃", p: 34 },
  cacao:    { n: "Cacao",          e: "🫘", p: 45 },
  cafe:     { n: "Grains de café", e: "🌰", p: 55 },
  viande:   { n: "Viande",         e: "🥩", p: 30 },
  miel:     { n: "Miel",           e: "🍯", p: 45 },
  laine:    { n: "Laine",          e: "🧶", p: 40 },
  saucisse: { n: "Saucisses",      e: "🌭", p: 85 },
  vin:      { n: "Vin",            e: "🍷", p: 130 },
  huile:    { n: "Huile",          e: "🫒", p: 120 },
  pull:     { n: "Pull en laine",  e: "🧥", p: 190 },
  chocolat: { n: "Chocolat",       e: "🍫", p: 230 },
  cafemoulu:{ n: "Café moulu",     e: "☕", p: 210 },
};

// Cultures de la ferme : prix de la graine, temps (s), récolte, niveau requis, xp
const CROPS = {
  ble:     { seed: 3,  time: 20,  yield: 3, lvl: 1, xp: 3 },
  carotte: { seed: 6,  time: 35,  yield: 3, lvl: 1, xp: 4 },
  patate:  { seed: 6,  time: 45,  yield: 4, lvl: 2, xp: 5 },
  tomate:  { seed: 10, time: 55,  yield: 4, lvl: 4, xp: 6 },
  mais:    { seed: 10, time: 70,  yield: 5, lvl: 5, xp: 7 },
  fraise:  { seed: 20, time: 100, yield: 4, lvl: 7, xp: 10 },
  raisin:  { seed: 40, time: 140, yield: 5, lvl: 12, xp: 14 },
  tournesol:{ seed: 50, time: 160, yield: 5, lvl: 16, xp: 16 },
  citrouille:{ seed: 70, time: 200, yield: 5, lvl: 19, xp: 20 },
  cacao:   { seed: 100, time: 240, yield: 5, lvl: 24, xp: 26 },
  cafe:    { seed: 130, time: 280, yield: 5, lvl: 28, xp: 30 },
};

// Animaux : coût, produit, période (s), nourriture consommée par unité
const ANIMALS = {
  poule:  { n: "Poule",  e: "🐔", cost: 150,   out: "oeuf",   period: 30, feed: "ble",       lvl: 3 },
  vache:  { n: "Vache",  e: "🐄", cost: 900,   out: "lait",   period: 45, feed: "mais",      lvl: 8 },
  cochon: { n: "Cochon", e: "🐖", cost: 2500,  out: "viande", period: 60, feed: "patate",    lvl: 11 },
  mouton: { n: "Mouton", e: "🐑", cost: 6000,  out: "laine",  period: 80, feed: "carotte",   lvl: 14 },
  ruche:  { n: "Ruche",  e: "🐝", cost: 15000, out: "miel",   period: 90, feed: "tournesol", lvl: 17 },
};

// Recettes de l'usine
const RECIPES = {
  farine:    { in: { ble: 3 },                                  time: 15, lvl: 6,  xp: 4 },
  frites:    { in: { patate: 3 },                               time: 20, lvl: 6,  xp: 5 },
  popcorn:   { in: { mais: 3 },                                 time: 20, lvl: 7,  xp: 5 },
  sauce:     { in: { tomate: 3 },                               time: 25, lvl: 7,  xp: 6 },
  pates:     { in: { farine: 1, oeuf: 2 },                      time: 30, lvl: 8,  xp: 7 },
  pain:      { in: { farine: 2 },                               time: 30, lvl: 9,  xp: 7 },
  fromage:   { in: { lait: 3 },                                 time: 40, lvl: 10, xp: 9 },
  confiture: { in: { fraise: 3 },                               time: 45, lvl: 11, xp: 10 },
  saucisse:  { in: { viande: 2 },                               time: 45, lvl: 12, xp: 11 },
  gateau:    { in: { farine: 2, oeuf: 2, lait: 1, fraise: 2 },  time: 60, lvl: 13, xp: 16 },
  vin:       { in: { raisin: 4 },                               time: 90, lvl: 14, xp: 18 },
  pull:      { in: { laine: 4 },                                time: 80, lvl: 16, xp: 20 },
  huile:     { in: { tournesol: 4 },                            time: 70, lvl: 18, xp: 18 },
  chocolat:  { in: { cacao: 3, lait: 1, miel: 1 },              time: 100, lvl: 25, xp: 28 },
  cafemoulu: { in: { cafe: 3 },                                 time: 90, lvl: 29, xp: 28 },
};

// Plats du restaurant
const DISHES = {
  salade:   { n: "Salade fraîcheur",    e: "🥗", in: { carotte: 2, tomate: 2 },               price: 60,   lvl: 10, xp: 8 },
  soupe:    { n: "Soupe maison",        e: "🍲", in: { carotte: 1, patate: 2, tomate: 1 },    price: 55,   lvl: 10, xp: 8 },
  cornet:   { n: "Cornet de frites",    e: "🍟", in: { frites: 2 },                           price: 85,   lvl: 10, xp: 10 },
  omelette: { n: "Omelette au fromage", e: "🍳", in: { oeuf: 3, fromage: 1 },                 price: 120,  lvl: 11, xp: 12 },
  croque:   { n: "Croque-monsieur",     e: "🥪", in: { pain: 1, fromage: 1 },                 price: 150,  lvl: 12, xp: 14 },
  hotdog:   { n: "Hot-dog",             e: "🌭", in: { pain: 1, saucisse: 1 },                price: 190,  lvl: 13, xp: 15 },
  spaghetti:{ n: "Spaghetti",           e: "🍝", in: { pates: 1, sauce: 1, fromage: 1 },      price: 210,  lvl: 14, xp: 18 },
  pizza:    { n: "Pizza",               e: "🍕", in: { farine: 2, sauce: 1, fromage: 1 },     price: 220,  lvl: 15, xp: 20 },
  burger:   { n: "Burger maison",       e: "🍔", in: { pain: 1, viande: 2, fromage: 1 },      price: 300,  lvl: 16, xp: 22 },
  crepe:    { n: "Crêpe confiture",     e: "🥞", in: { farine: 1, oeuf: 2, confiture: 1 },    price: 170,  lvl: 17, xp: 18 },
  steak:    { n: "Steak frites",        e: "🥩", in: { viande: 3, frites: 1 },                price: 290,  lvl: 18, xp: 24 },
  dessert:  { n: "Gâteau du chef",      e: "🍰", in: { gateau: 1 },                           price: 260,  lvl: 19, xp: 24 },
  veloute:  { n: "Velouté de citrouille",e: "🥣", in: { citrouille: 2, lait: 1 },             price: 200,  lvl: 20, xp: 22 },
  fondue:   { n: "Fondue au vin",       e: "🫕", in: { fromage: 3, pain: 1, vin: 1 },         price: 520,  lvl: 22, xp: 35 },
  mousse:   { n: "Mousse au chocolat",  e: "🍮", in: { chocolat: 1, oeuf: 2, lait: 1 },       price: 420,  lvl: 26, xp: 34 },
  tiramisu: { n: "Tiramisu",            e: "🧁", in: { cafemoulu: 1, oeuf: 2, fromage: 1 },   price: 450,  lvl: 30, xp: 38 },
  menu:     { n: "Menu dégustation",    e: "🍽️", in: { vin: 1, viande: 2, chocolat: 1, cafemoulu: 1 }, price: 1400, lvl: 33, xp: 80 },
};

const PROPS = {
  studio:   { n: "Studio",            e: "🏠", price: 40000,     rent: 140,     lvl: 20 },
  appart:   { n: "Appartement",       e: "🏘️", price: 120000,    rent: 420,    lvl: 21 },
  maison:   { n: "Maison de ville",   e: "🏡", price: 350000,    rent: 1220,    lvl: 23 },
  local:    { n: "Local commercial",  e: "🏪", price: 900000,    rent: 3150,   lvl: 25 },
  immeuble: { n: "Immeuble",          e: "🏬", price: 2500000,   rent: 8750,   lvl: 28 },
  hotel:    { n: "Hôtel",             e: "🏨", price: 7000000,   rent: 24500,  lvl: 31 },
  tour:     { n: "Tour de bureaux",   e: "🏙️", price: 20000000,  rent: 70000,  lvl: 34 },
  gratte:   { n: "Gratte-ciel",       e: "🌆", price: 80000000,  rent: 280000, lvl: 38 },
  ile:      { n: "Île privée",        e: "🏝️", price: 300000000, rent: 1050000, lvl: 42 },
};

const BIZ = {
  ferme:     { n: "Ferme",       e: "🚜", cost: 0,      lvl: 1,  up: 150,    col: "#43a047", desc: "Cultive des légumes et élève des animaux." },
  superette: { n: "Supérette",   e: "🛒", cost: 1500,   lvl: 3,  up: 500,    col: "#1e88e5", desc: "Remplis tes rayons, fixe tes prix, attire les clients." },
  usine:     { n: "Usine agro",  e: "🏭", cost: 6000,   lvl: 6,  up: 2000,   col: "#8e24aa", desc: "Transforme tes récoltes en produits qui valent bien plus." },
  resto:     { n: "Restaurant",  e: "🍽️", cost: 25000,  lvl: 10, up: 8000,  col: "#e53935", desc: "Cuisine et sers tes clients avant qu'ils ne partent." },
  transport: { n: "Logistique",  e: "🚚", cost: 60000,  lvl: 15, up: 30000,  col: "#fb8c00", desc: "Contrats de livraison en gros, très rentables." },
  immo:      { n: "Immobilier",  e: "🏢", cost: 150000, lvl: 20, up: 150000, col: "#00897b", desc: "Achète des biens et encaisse des loyers chaque jour." },
};
const BIZ_ORDER = ["ferme", "superette", "usine", "resto", "transport", "immo"];
const MAX_LVL = 25;
const UP_GROWTH = 1.6;

// 3 employés par entreprise, débloqués avec le niveau de l'entreprise
const EMPS = {
  ferme: [
    { id: "fermier",  n: "Fermier",        e: "👨‍🌾", wage: 5,   lvl: 1,  desc: "Récolte et replante tes champs tout seul." },
    { id: "veto",     n: "Vétérinaire",    e: "🧑‍⚕️", wage: 20,  lvl: 5,  desc: "Ramasse œufs, lait… et les animaux produisent 40 % plus vite." },
    { id: "agro",     n: "Agronome",       e: "🧑‍🔬", wage: 70,  lvl: 10, desc: "+1 produit à chaque récolte de champ." },
  ],
  superette: [
    { id: "caissier", n: "Caissier",       e: "🧑‍💼", wage: 8,   lvl: 1,  desc: "+30 % de clients." },
    { id: "magasin",  n: "Magasinier",     e: "📦",   wage: 25,  lvl: 5,  desc: "Remplit les rayons depuis ton stock automatiquement." },
    { id: "market",   n: "Responsable marketing", e: "📣", wage: 100, lvl: 10, desc: "Les clients acceptent des prix plus hauts et la réputation monte 2× plus vite." },
  ],
  usine: [
    { id: "ouvrier",  n: "Ouvrier",        e: "👷",   wage: 15,  lvl: 1,  desc: "Récupère la production et relance la même recette." },
    { id: "ingenieur",n: "Ingénieur",      e: "👩‍💻", wage: 60,  lvl: 5,  desc: "Chaînes 35 % plus rapides." },
    { id: "chefequipe",n: "Chef d'équipe", e: "🦺",   wage: 180, lvl: 10, desc: "25 % de chances de produire en double." },
  ],
  resto: [
    { id: "chef",     n: "Chef cuisinier", e: "👨‍🍳", wage: 40,  lvl: 1,  desc: "Sert les commandes tout seul (la salle reste ouverte sans toi)." },
    { id: "serveur",  n: "Serveur",        e: "🤵",   wage: 120,  lvl: 5,  desc: "Clients 50 % plus patients et pourboires +50 %." },
    { id: "sommelier",n: "Sommelier",      e: "🍷",   wage: 300, lvl: 10, desc: "Plats vendus 25 % plus cher." },
  ],
  transport: [
    { id: "chauffeur",n: "Chauffeur",      e: "🧑‍✈️", wage: 150, lvl: 1,  desc: "Livraisons 40 % plus rapides." },
    { id: "dispatch", n: "Dispatcheur",    e: "🗺️",   wage: 450, lvl: 5,  desc: "Accepte tout seul les contrats quand tu as la marchandise." },
    { id: "nego",     n: "Négociateur",    e: "🤝",   wage: 1100, lvl: 10, desc: "Contrats payés 25 % de plus." },
  ],
  immo: [
    { id: "gestion",  n: "Gestionnaire",   e: "🕴️",   wage: 900,  lvl: 1,  desc: "Loyers +25 %." },
    { id: "agent",    n: "Agent immobilier", e: "🔑", wage: 2500, lvl: 5,  desc: "Achats 10 % moins chers, reventes au prix plein." },
    { id: "concierge",n: "Conciergerie",   e: "🛎️",   wage: 6000, lvl: 10, desc: "Loyers encore +30 %." },
  ],
};
const CITIES = ["Paris", "Lyon", "Marseille", "Bruxelles", "Lille", "Bordeaux", "Nantes", "Liège", "Genève", "Toulouse", "Strasbourg", "Nice", "Namur", "Charleroi"];

// Événements aléatoires (mods multiplient des paramètres)
const EVENTS = {
  secheresse: { n: "Sécheresse",          e: "🌵", d: 2, mods: { grow: 0.6 },                   txt: "Les cultures poussent 40 % moins vite." },
  pluie:      { n: "Pluies bénies",       e: "🌧️", d: 2, mods: { grow: 1.5 },                   txt: "Les cultures poussent 50 % plus vite !" },
  festival:   { n: "Festival en ville",   e: "🎉", d: 1, mods: { shop: 2, resto: 1.5 },         txt: "Deux fois plus de clients au magasin !" },
  crise:      { n: "Crise économique",    e: "📉", d: 2, mods: { shop: 0.6 },                   txt: "Les clients se font rares." },
  touristes:  { n: "Vague de touristes",  e: "📸", d: 2, mods: { restoPrice: 1.3, resto: 1.3 }, txt: "Plats vendus 30 % plus cher." },
  greve:      { n: "Grève des routiers",  e: "🚧", d: 1, mods: { truck: 0.5 },                  txt: "Les camions roulent deux fois moins vite." },
  penurie:    { n: "Pénurie",             e: "⚠️", d: 2, mods: {},                              txt: "" },
  boom:       { n: "Boom immobilier",     e: "🏗️", d: 2, mods: { rent: 1.5 },                   txt: "Loyers +50 % !" },
};

const ACHS = [
  { id: "h100",  n: "Main verte",          d: "Récolter 100 produits",        g: 5,  c: s => s.stats.harvest >= 100 },
  { id: "h1000", n: "Roi des champs",      d: "Récolter 1 000 produits",      g: 15, c: s => s.stats.harvest >= 1000 },
  { id: "a50",   n: "Basse-cour",          d: "Collecter 50 œufs ou laits",   g: 5,  c: s => s.stats.animal >= 50 },
  { id: "e10k",  n: "Premier pactole",     d: "Gagner 10 000 €",              g: 5,  c: s => s.stats.earned >= 1e4 },
  { id: "e100k", n: "Entrepreneur",        d: "Gagner 100 000 €",             g: 10, c: s => s.stats.earned >= 1e5 },
  { id: "e1m",   n: "Millionnaire",        d: "Gagner 1 000 000 €",           g: 25, c: s => s.stats.earned >= 1e6 },
  { id: "e100m", n: "Magnat",              d: "Gagner 100 000 000 €",         g: 50, c: s => s.stats.earned >= 1e8 },
  { id: "s100",  n: "Commerçant",          d: "Vendre 100 articles en magasin",g: 5, c: s => s.stats.sold >= 100 },
  { id: "s1000", n: "Hypermarché",         d: "Vendre 1 000 articles",        g: 15, c: s => s.stats.sold >= 1000 },
  { id: "c50",   n: "Chaîne de production",d: "Fabriquer 50 produits",        g: 8,  c: s => s.stats.craft >= 50 },
  { id: "r50",   n: "Toque d'argent",      d: "Servir 50 plats",              g: 10, c: s => s.stats.served >= 50 },
  { id: "r500",  n: "Étoilé",              d: "Servir 500 plats",             g: 25, c: s => s.stats.served >= 500 },
  { id: "t10",   n: "Routier",             d: "Livrer 10 contrats",           g: 10, c: s => s.stats.contracts >= 10 },
  { id: "p1",    n: "Propriétaire",        d: "Acheter un premier bien",      g: 8,  c: s => Object.values(s.biz.immo.props).some(n => n > 0) },
  { id: "all",   n: "Conglomérat",         d: "Posséder les 6 entreprises",   g: 20, c: s => BIZ_ORDER.every(b => s.biz[b].own) },
  { id: "l10",   n: "Patron confirmé",     d: "Atteindre le niveau 10",       g: 10, c: s => s.lvl >= 10 },
  { id: "l20",   n: "Légende du business", d: "Atteindre le niveau 20",       g: 25, c: s => s.lvl >= 20 },
  { id: "max",   n: "Perfectionniste",     d: "Une entreprise au niveau 10",  g: 15, c: s => BIZ_ORDER.some(b => s.biz[b].own && s.biz[b].lvl >= 10) },
  { id: "pr1",   n: "Nouveau départ",      d: "Faire un premier prestige",    g: 30, c: s => s.prestiges >= 1 },
  { id: "pr3",   n: "Serial entrepreneur", d: "Faire 3 prestiges",            g: 60, c: s => s.prestiges >= 3 },
  { id: "l30",   n: "Tycoon",              d: "Atteindre le niveau 30",       g: 40, c: s => s.lvl >= 30 },
  { id: "l40",   n: "Empereur",            d: "Atteindre le niveau 40",       g: 80, c: s => s.lvl >= 40 },
  { id: "e1md",  n: "Milliardaire",        d: "Gagner 1 milliard €",          g: 80, c: s => s.stats.earned >= 1e9 },
  { id: "emp6",  n: "Recruteur",           d: "Avoir 6 employés en même temps", g: 15, c: s => BIZ_ORDER.reduce((n, b) => n + Object.values(s.biz[b].emps || {}).filter(Boolean).length, 0) >= 6 },
  { id: "emp18", n: "Grand patron",        d: "Avoir les 18 employés",        g: 60, c: s => BIZ_ORDER.reduce((n, b) => n + Object.values(s.biz[b].emps || {}).filter(Boolean).length, 0) >= 18 },
  { id: "zoo",   n: "Arche de Noé",        d: "Posséder les 5 espèces d'animaux", g: 20, c: s => Object.values(s.biz.ferme.animals).filter(a => a.n > 0).length >= 5 },
  { id: "max25", n: "Au sommet",           d: "Une entreprise au niveau 25",  g: 40, c: s => BIZ_ORDER.some(b => s.biz[b].own && s.biz[b].lvl >= 25) },
  { id: "allmax",n: "Perfection absolue",  d: "Les 6 entreprises au niveau 25", g: 150, c: s => BIZ_ORDER.every(b => s.biz[b].own && s.biz[b].lvl >= 25) },
  { id: "chef",  n: "Grand chef",          d: "Servir 2 000 plats",           g: 40, c: s => s.stats.served >= 2000 },
  { id: "ile",   n: "Robinson milliardaire",d: "Acheter une île privée",      g: 100, c: s => (s.biz.immo.props.ile || 0) > 0 },
];
