# 🏢 Empire Tycoon

Jeu de gestion mobile (PWA) : bâtis ton empire avec **6 entreprises reliées entre elles**.

| Entreprise | Ce que tu fais |
|---|---|
| 🚜 Ferme | 11 cultures (blé → café), choisies champ par champ. 5 animaux à nourrir : poules, vaches, cochons, moutons, ruches. |
| 🛒 Supérette | Mets tes produits en rayon, choisis ta marge, les clients achètent tout seuls. |
| 🏭 Usine agro | 15 recettes : farine, frites, pâtes, fromage, vin, pulls en laine, chocolat, café… |
| 🍽️ Restaurant | 17 plats, du cornet de frites au menu dégustation. Sers avant que la patience tombe à zéro. |
| 🚚 Logistique | Contrats de livraison en gros vers des villes, très rentables. |
| 🏢 Immobilier | 9 biens du studio à l'île privée, des loyers chaque matin. |

**Profondeur :** chaque entreprise monte jusqu'au **niveau 25** et a **3 employés** à débloquer (18 au total). 30 succès, missions infinies, marché qui bouge, événements, prestige 🌟 avec bonus permanent. Un joueur rapide met environ 30 h à faire son premier prestige.


**Aussi :** diamants 💎 et boosts, cadeau quotidien, progression hors-ligne (3 h max), sauvegarde automatique + fichier de sauvegarde, mises à jour automatiques.

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
