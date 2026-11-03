# 🏢 Empire Tycoon

Jeu de gestion mobile (PWA) : bâtis ton empire avec **6 entreprises reliées entre elles**.

| Entreprise | Ce que tu fais |
|---|---|
| 🚜 Ferme | Plante blé, carottes, patates, tomates, maïs, fraises. Élève poules 🐔 et vaches 🐄 (il faut les nourrir). |
| 🛒 Supérette | Mets tes produits en rayon, choisis ta marge, les clients achètent tout seuls. |
| 🏭 Usine agro | Transforme : farine, frites, sauce, pâtes, pain, fromage, confiture, gâteau. |
| 🍽️ Restaurant | Sers pizzas, spaghetti, croques… avant que la patience des clients tombe à zéro. |
| 🚚 Logistique | Contrats de livraison en gros vers des villes, très rentables. |
| 🏢 Immobilier | Achète studios → gratte-ciel, encaisse des loyers chaque matin. |

**Aussi :** marché aux prix qui bougent chaque jour, événements aléatoires (sécheresse, festival, grève…), employés qui automatisent, missions infinies, 19 succès, diamants 💎 et boosts, cadeau quotidien, progression hors-ligne (3 h max), prestige 🌟 avec bonus permanent, sauvegarde automatique + export.

---

## 📲 Mettre le jeu en ligne depuis ton téléphone (GitHub Pages)

1. Va sur **github.com** → **+** → **New repository** → nom : `empire-tycoon` → **Public** → **Create**.
2. Dans le dépôt : **Add file** → **Upload files** → sélectionne **tous les fichiers** :
   `index.html`, `style.css`, `data.js`, `game.js`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `README.md`
   → **Commit changes**.
   ⚠️ Les fichiers doivent être **à la racine** du dépôt (pas dans un sous-dossier).
3. **Settings** → **Pages** → *Source* : **Deploy from a branch** → *Branch* : **main** / **(root)** → **Save**.
4. Attends 1 à 2 minutes. Ton jeu est sur : `https://TON-PSEUDO.github.io/empire-tycoon/`

## 📱 L'installer comme une vraie appli

Ouvre le lien dans **Chrome** sur Android → menu **⋮** → **Ajouter à l'écran d'accueil / Installer l'application**.
(Sur iPhone : Safari → bouton Partager → **Sur l'écran d'accueil**.)
Le jeu marche ensuite même sans connexion.

## 🔄 Faire une mise à jour

Quand tu modifies un fichier, ouvre `sw.js` et change `empire-tycoon-v1` en `empire-tycoon-v2` (puis v3…), sinon le téléphone peut garder l'ancienne version en cache.

## 🛠️ Modifier le jeu

Tout l'équilibrage (prix, temps, niveaux, recettes, plats, biens immobiliers, événements, succès) est dans **`data.js`**, facile à retoucher.
La logique et l'affichage sont dans **`game.js`**, le style dans **`style.css`**.
