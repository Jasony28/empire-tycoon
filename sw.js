// Service worker : permet de jouer hors connexion.
// ⚠️ Change le numéro de version à chaque mise à jour du jeu pour forcer le rafraîchissement.
const CACHE = "empire-tycoon-v7";
const FILES = ["./", "./index.html", "./style.css", "./data.js", "./game.js", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Réseau d'abord (pour avoir les mises à jour), cache si hors ligne
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    // Toujours demander la dernière version au serveur (sans cache HTTP)
    (new URL(e.request.url).origin === location.origin ? fetch(e.request.url, { cache: "no-cache" }) : fetch(e.request))
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
