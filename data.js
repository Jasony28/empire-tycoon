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
  confiture:{ n: "Confiture",      e: "🍯", p: 68 },
  gateau:   { n: "Gâteau",         e: "🎂", p: 140 },
};

// Cultures de la ferme : prix de la graine, temps (s), récolte, niveau requis, xp
const CROPS = {
  ble:     { seed: 3,  time: 20,  yield: 3, lvl: 1, xp: 3 },
  carotte: { seed: 6,  time: 35,  yield: 3, lvl: 1, xp: 4 },
  patate:  { seed: 6,  time: 45,  yield: 4, lvl: 2, xp: 5 },
  tomate:  { seed: 10, time: 55,  yield: 4, lvl: 3, xp: 6 },
  mais:    { seed: 10, time: 70,  yield: 5, lvl: 4, xp: 7 },
  fraise:  { seed: 20, time: 100, yield: 4, lvl: 6, xp: 10 },
};

// Animaux : coût, produit, période (s), nourriture consommée par unité
const ANIMALS = {
  poule: { n: "Poule", e: "🐔", cost: 150, out: "oeuf", period: 30, feed: "ble",  lvl: 2 },
  vache: { n: "Vache", e: "🐄", cost: 700, out: "lait", period: 45, feed: "mais", lvl: 5 },
};

// Recettes de l'usine
const RECIPES = {
  farine:    { in: { ble: 3 },                                  time: 15, lvl: 4,  xp: 4 },
  frites:    { in: { patate: 3 },                               time: 20, lvl: 4,  xp: 5 },
  popcorn:   { in: { mais: 3 },                                 time: 20, lvl: 5,  xp: 5 },
  sauce:     { in: { tomate: 3 },                               time: 25, lvl: 5,  xp: 6 },
  pates:     { in: { farine: 1, oeuf: 2 },                      time: 30, lvl: 6,  xp: 7 },
  pain:      { in: { farine: 2 },                               time: 30, lvl: 6,  xp: 7 },
  fromage:   { in: { lait: 3 },                                 time: 40, lvl: 7,  xp: 9 },
  confiture: { in: { fraise: 3 },                               time: 45, lvl: 8,  xp: 10 },
  gateau:    { in: { farine: 2, oeuf: 2, lait: 1, fraise: 2 },  time: 60, lvl: 10, xp: 16 },
};

// Plats du restaurant
const DISHES = {
  salade:   { n: "Salade fraîcheur",  e: "🥗", in: { carotte: 2, tomate: 2 },            price: 60,  lvl: 6,  xp: 8 },
  soupe:    { n: "Soupe maison",      e: "🍲", in: { carotte: 1, patate: 2, tomate: 1 }, price: 55,  lvl: 6,  xp: 8 },
  cornet:   { n: "Cornet de frites",  e: "🍟", in: { frites: 2 },                        price: 85,  lvl: 7,  xp: 10 },
  omelette: { n: "Omelette au fromage",e:"🍳", in: { oeuf: 3, fromage: 1 },              price: 120, lvl: 7,  xp: 12 },
  croque:   { n: "Croque-monsieur",   e: "🥪", in: { pain: 1, fromage: 1 },              price: 150, lvl: 8,  xp: 14 },
  spaghetti:{ n: "Spaghetti",         e: "🍝", in: { pates: 1, sauce: 1, fromage: 1 },   price: 210, lvl: 9,  xp: 18 },
  pizza:    { n: "Pizza",             e: "🍕", in: { farine: 2, sauce: 1, fromage: 1 },  price: 220, lvl: 10, xp: 20 },
  crepe:    { n: "Crêpe confiture",   e: "🥞", in: { farine: 1, oeuf: 2, confiture: 1 }, price: 170, lvl: 11, xp: 18 },
  dessert:  { n: "Gâteau du chef",    e: "🍰", in: { gateau: 1 },                        price: 260, lvl: 12, xp: 24 },
};

const PROPS = {
  studio:   { n: "Studio",            e: "🏠", price: 8000,     rent: 120,    lvl: 10 },
  appart:   { n: "Appartement",       e: "🏘️", price: 25000,    rent: 390,    lvl: 11 },
  maison:   { n: "Maison de ville",   e: "🏡", price: 70000,    rent: 1100,   lvl: 13 },
  local:    { n: "Local commercial",  e: "🏪", price: 180000,   rent: 2900,   lvl: 15 },
  immeuble: { n: "Immeuble",          e: "🏬", price: 500000,   rent: 8200,   lvl: 18 },
  tour:     { n: "Tour de bureaux",   e: "🏙️", price: 2000000,  rent: 33000,  lvl: 22 },
  gratte:   { n: "Gratte-ciel",       e: "🌆", price: 10000000, rent: 170000, lvl: 26 },
};

const BIZ = {
  ferme:     { n: "Ferme",       e: "🚜", cost: 0,     lvl: 1,  up: 150,   col: "#43a047", desc: "Cultive des légumes et élève des animaux." },
  superette: { n: "Supérette",   e: "🛒", cost: 1200,  lvl: 2,  up: 600,   col: "#1e88e5", desc: "Remplis tes rayons, fixe tes prix, attire les clients." },
  usine:     { n: "Usine agro",  e: "🏭", cost: 4000,  lvl: 4,  up: 1800,  col: "#8e24aa", desc: "Transforme tes récoltes en produits qui valent bien plus." },
  resto:     { n: "Restaurant",  e: "🍽️", cost: 12000, lvl: 6,  up: 5000,  col: "#e53935", desc: "Cuisine et sers tes clients avant qu'ils ne partent." },
  transport: { n: "Logistique",  e: "🚚", cost: 35000, lvl: 8,  up: 12000, col: "#fb8c00", desc: "Contrats de livraison en gros, très rentables." },
  immo:      { n: "Immobilier",  e: "🏢", cost: 90000, lvl: 10, up: 40000, col: "#00897b", desc: "Achète des biens et encaisse des loyers chaque jour." },
};
const BIZ_ORDER = ["ferme", "superette", "usine", "resto", "transport", "immo"];
const MAX_LVL = 10;

const EMP = {
  ferme:     { n: "Fermier",       e: "👨‍🌾", wage: 60,  desc: "Récolte, replante et ramasse œufs et lait tout seul." },
  superette: { n: "Caissier",      e: "🧑‍💼", wage: 90,  desc: "Remplit les rayons depuis ton stock et +30 % de clients." },
  usine:     { n: "Ouvrier",       e: "👷",   wage: 140, desc: "Récupère la production et relance la même recette." },
  resto:     { n: "Chef cuisinier",e: "👨‍🍳", wage: 220, desc: "Sert les commandes tout seul quand les ingrédients sont là." },
  transport: { n: "Chauffeur",     e: "🧑‍✈️", wage: 300, desc: "Livraisons 40 % plus rapides." },
  immo:      { n: "Gestionnaire",  e: "🕴️",   wage: 500, desc: "Loyers +25 %." },
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
  { id: "max",   n: "Perfectionniste",     d: "Une entreprise au niveau 10",  g: 15, c: s => BIZ_ORDER.some(b => s.biz[b].own && s.biz[b].lvl >= MAX_LVL) },
  { id: "pr1",   n: "Nouveau départ",      d: "Faire un premier prestige",    g: 30, c: s => s.prestiges >= 1 },
];
