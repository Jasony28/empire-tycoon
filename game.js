"use strict";
// ===== EMPIRE TYCOON — Moteur du jeu =====

// ---------- Outils ----------
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

function fmt(n) {
  n = Math.floor(n);
  const a = Math.abs(n);
  if (a < 10000) return n.toLocaleString("fr-FR");
  const u = [[1e12, "T"], [1e9, "Md"], [1e6, "M"], [1e3, "k"]];
  for (const [v, s] of u) if (a >= v) return (n / v).toFixed(n / v < 100 ? 1 : 0).replace(".", ",") + s;
}
const money = n => fmt(n) + " €";
const fmtP = n => (n < 100 ? n.toFixed(1).replace(".", ",") + " €" : money(n));
function fmtT(s) {
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m" + (s % 60 ? " " + (s % 60) + "s" : "");
  return Math.floor(m / 60) + "h " + (m % 60) + "m";
}

// ---------- État ----------
const SAVE_KEY = "empire-tycoon-save";
const VERSION = "v2.0";
let G;
let OFF = false;          // simulation hors-ligne en cours
let dirty = true;
let scr = "home";
const earnLog = [];       // pour calculer les revenus/min

function newState(keep) {
  const s = {
    money: 500, gems: 10, xp: 0, lvl: 1, t: 0, day: 1, ts: Date.now(),
    stars: 0, prestiges: 0, runEarned: 0,
    inv: {},
    stats: { planted: 0, harvest: 0, animal: 0, craft: 0, sold: 0, served: 0, contracts: 0, earned: 0, missed: 0 },
    market: {}, events: [], boostUntil: 0, rushUntil: 0,
    biz: {
      ferme: { own: true, lvl: 1, emps: {}, plots: [], sel: "ble",
        animals: {} },
      superette: { own: false, lvl: 1, emps: {}, shelves: [], acc: 0, rep: 60, log: [] },
      usine: { own: false, lvl: 1, emps: {}, machines: [] },
      resto: { own: false, lvl: 1, emps: {}, orders: [], acc: 0, rates: [], chefAcc: 0, nid: 1 },
      transport: { own: false, lvl: 1, emps: {}, trucks: [], contracts: [] },
      immo: { own: false, lvl: 1, emps: {}, props: {}, idx: 1, hist: [1] },
    },
    quests: [], ach: {}, daily: { last: "", streak: 0 },
    settings: { sound: true, vibe: true }, welcomed: false,
  };
  for (const id in ITEMS) s.market[id] = { m: 1, h: [1] };
  if (keep) {
    Object.assign(s, { stars: keep.stars, prestiges: keep.prestiges, gems: keep.gems, ach: keep.ach,
      settings: keep.settings, daily: keep.daily, stats: keep.stats, welcomed: true });
  }
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { applySave(JSON.parse(raw)); return true; }
  } catch (e) { console.warn(e); }
  G = newState();
  return false;
}
// Fusion prudente d'une sauvegarde avec l'état par défaut (compatibilité futures versions)
function applySave(d) {
  if (!d || typeof d !== "object" || !d.biz || typeof d.money !== "number") throw new Error("bad save");
  const base = newState();
  G = Object.assign(base, d);
  for (const b of BIZ_ORDER) G.biz[b] = Object.assign(newState().biz[b], d.biz[b]);
  G.stats = Object.assign(newState().stats, d.stats);
}
let lastSaveOk = 0;
function save() {
  G.ts = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); lastSaveOk = Date.now(); return true; } catch (e) { return false; }
}
function saveAgo() {
  if (!lastSaveOk) return "pas encore";
  const s = Math.round((Date.now() - lastSaveOk) / 1000);
  return s < 3 ? "à l'instant" : "il y a " + fmtT(s);
}
function importData(d) {
  applySave(d); sync(); save();
  closeModal(); scr = "home"; dirty = true;
  toast(`✅ Partie chargée : niveau ${G.lvl}, ${money(G.money)}`, "good"); SFX.level();
}
const saveCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(G))));

// ---------- Paramètres dérivés ----------
const L = b => G.biz[b].lvl;
const plotCount = (l = L("ferme")) => Math.min(36, 4 + Math.floor((l - 1) * 1.5));
const growSpeed = (l = L("ferme")) => (1 + 0.06 * (l - 1)) * mod("grow");
const animalCap = (l = L("ferme")) => 2 + (l - 1);
const shelfCount = (l = L("superette")) => Math.min(18, 3 + Math.floor((l - 1) * 0.75));
const shelfCap = (l = L("superette")) => 20 + 8 * l;
const machineCount = (l = L("usine")) => Math.min(10, 1 + Math.floor((l - 1) / 2));
const craftSpeed = (l = L("usine")) => (1 + 0.06 * (l - 1)) * (E("usine", "ingenieur") ? 1.35 : 1);
const tableCount = (l = L("resto")) => Math.min(8, 1 + Math.ceil(l / 3));
const truckCount = (l = L("transport")) => Math.min(7, 1 + Math.floor((l - 1) / 4));
const truckCap = (l = L("transport")) => 25 + 10 * l;
const truckSpeed = () => (1 + 0.05 * (L("transport") - 1)) * (E("transport", "chauffeur") ? 1.4 : 1) * mod("truck");
const upCost = b => Math.round(BIZ[b].up * Math.pow(UP_GROWTH, L(b) - 1));
const xpNeed = l => Math.floor(70 * Math.pow(l, 2.15));
const animalCost = k => Math.round(ANIMALS[k].cost * Math.pow(1.18, G.biz.ferme.animals[k].n));

function mod(k) {
  let m = 1;
  for (const e of G.events) { const d = EVENTS[e.id]; if (d && d.mods[k]) m *= d.mods[k]; }
  return m;
}
function ref(id) {
  let m = G.market[id].m;
  for (const e of G.events) if (e.id === "penurie" && e.item === id) m *= 2;
  return ITEMS[id].p * m;
}
const PRESTIGE_MIN = 25e6;
const prestigeGain = () => Math.floor(Math.sqrt(G.runEarned / 5e6));
const mult = () => (1 + 0.1 * G.stars) * (G.t < G.boostUntil ? 2 : 1);

function sync() {
  for (const b of BIZ_ORDER) {
    const o = G.biz[b];
    if (!o.emps) o.emps = {};
    if (o.emp === true) o.emps[EMPS[b][0].id] = true;   // anciennes sauvegardes : 1 employé
    delete o.emp;
    if (o.lvl > MAX_LVL) o.lvl = MAX_LVL;
  }
  for (const k in ANIMALS) if (!G.biz.ferme.animals[k]) G.biz.ferme.animals[k] = { n: 0, acc: 0, st: 0, hungry: false };
  const f = G.biz.ferme;
  while (f.plots.length < plotCount()) f.plots.push({ c: null, start: 0, end: 0, ready: false });
  const s = G.biz.superette;
  while (s.shelves.length < shelfCount()) s.shelves.push({ item: null, qty: 0, mk: 0.1 });
  const u = G.biz.usine;
  while (u.machines.length < machineCount()) u.machines.push({ r: null, start: 0, end: 0, ready: false, last: null });
  const t = G.biz.transport;
  while (t.trucks.length < truckCount()) t.trucks.push({ busy: false, start: 0, end: 0, c: null });
  if (t.own) while (t.contracts.length < 4) t.contracts.push(genContract());
  for (const id in ITEMS) if (!G.market[id]) G.market[id] = { m: 1, h: [1] };
  for (const id in PROPS) if (G.biz.immo.props[id] == null) G.biz.immo.props[id] = 0;
  while (G.quests.length < 3) G.quests.push(genQuest());
}

// ---------- Employés ----------
const E = (b, id) => !!(G.biz[b].emps && G.biz[b].emps[id]);
const empDef = (b, id) => EMPS[b].find(e => e.id === id);
const empCount = b => Object.values(G.biz[b].emps || {}).filter(Boolean).length;
function hireEmp(b, id, silent) {
  const e = empDef(b, id), o = G.biz[b];
  if (!e || E(b, id) || o.lvl < e.lvl) return false;
  if (silent) { if (G.money < e.wage * 40) return false; G.money -= e.wage * 40; }
  else if (!spend(e.wage * 40)) return false;
  o.emps[id] = true;
  return true;
}

// ---------- Économie ----------
const have = id => G.inv[id] || 0;
function add(id, n) { G.inv[id] = have(id) + n; }
function canMake(map, times = 1) { for (const k in map) if (have(k) < map[k] * times) return false; return true; }
function consume(map, times = 1) { for (const k in map) G.inv[k] -= map[k] * times; }

function gain(a, opt = {}) {
  if (!opt.raw) a *= mult();
  a = Math.round(a);
  G.money += a;
  if (!opt.raw) { G.stats.earned += a; G.runEarned += a; earnLog.push([G.t, a]); }
  if (!OFF) {
    if (opt.float) floatTxt("+" + money(a), "gold");
    pulse("#hMoney");
  }
  return a;
}
function spend(a) {
  if (G.money < a) { toast("💸 Pas assez d'argent (" + money(a) + ")", "bad"); SFX.err(); return false; }
  G.money -= a; return true;
}
function spendGems(n) {
  if (G.gems < n) { toast("💎 Pas assez de diamants", "bad"); SFX.err(); return false; }
  G.gems -= n; return true;
}
function incomeRate() {
  while (earnLog.length && earnLog[0][0] < G.t - 60) earnLog.shift();
  return earnLog.reduce((s, x) => s + x[1], 0);
}
function netWorth() {
  let w = G.money;
  for (const id in G.inv) w += have(id) * ref(id) * 0.7;
  for (const p in PROPS) w += (G.biz.immo.props[p] || 0) * PROPS[p].price * G.biz.immo.idx;
  for (const b of BIZ_ORDER) if (G.biz[b].own) w += BIZ[b].cost + BIZ[b].up * (Math.pow(UP_GROWTH, G.biz[b].lvl - 1) - 1) / (UP_GROWTH - 1) * 0.5;
  return w;
}

function addXP(x) {
  G.xp += x;
  const before = G.lvl;
  while (G.xp >= xpNeed(G.lvl)) { G.xp -= xpNeed(G.lvl); G.lvl++; G.gems += 2; }
  if (G.lvl > before) { dirty = true; if (!OFF) levelUp(before); }
}

function unlocksAt(l) {
  const u = [];
  for (const b in BIZ) if (BIZ[b].lvl === l && l > 1) u.push(`${BIZ[b].e} Entreprise : <b>${BIZ[b].n}</b>`);
  for (const c in CROPS) if (CROPS[c].lvl === l) u.push(`${ITEMS[c].e} Culture : ${ITEMS[c].n}`);
  for (const a in ANIMALS) if (ANIMALS[a].lvl === l) u.push(`${ANIMALS[a].e} Animal : ${ANIMALS[a].n}`);
  for (const r in RECIPES) if (RECIPES[r].lvl === l) u.push(`${ITEMS[r].e} Recette : ${ITEMS[r].n}`);
  for (const d in DISHES) if (DISHES[d].lvl === l) u.push(`${DISHES[d].e} Plat : ${DISHES[d].n}`);
  for (const p in PROPS) if (PROPS[p].lvl === l) u.push(`${PROPS[p].e} Bien : ${PROPS[p].n}`);
  return u;
}

// ---------- Ferme ----------
function plant(i, c, auto) {
  const f = G.biz.ferme, p = f.plots[i], cr = CROPS[c];
  if (p.c || cr.lvl > G.lvl) return false;
  if (G.money < cr.seed) { if (!auto) spend(cr.seed); return false; }
  G.money -= cr.seed;
  p.c = c; p.start = G.t; p.end = G.t + cr.time / growSpeed(); p.ready = false;
  G.stats.planted = (G.stats.planted || 0) + 1;
  return true;
}
function harvest(i, auto) {
  const f = G.biz.ferme, p = f.plots[i];
  if (!p.c || !p.ready) return 0;
  const c = p.c, cr = CROPS[c];
  const y = cr.yield + (E("ferme", "agro") ? 1 : 0);
  add(c, y); G.stats.harvest += y; addXP(cr.xp);
  p.c = null; p.ready = false; p.last = c;
  if (f.replant !== false || auto) plant(i, c, true);
  return y;
}
function collectAnimal(k) {
  const a = G.biz.ferme.animals[k], d = ANIMALS[k];
  if (!a.st) return 0;
  const n = a.st; add(d.out, n); G.stats.animal += n; addXP(n * 2); a.st = 0;
  return n;
}
function tickFarm(dt) {
  const f = G.biz.ferme;
  f.plots.forEach((p, i) => {
    if (p.c && !p.ready && G.t >= p.end) { p.ready = true; dirty = true; }
    if (E("ferme", "fermier") && p.ready) harvest(i, true);
    if (E("ferme", "fermier") && !p.c && !(p.hold > G.t)) plant(i, p.last || f.sel, true);
  });
  for (const k in ANIMALS) {
    const a = f.animals[k], d = ANIMALS[k];
    if (!a.n) continue;
    const cap = a.n * 8;
    if (a.st >= cap) { a.acc = Math.min(a.acc + dt, d.period); continue; }
    a.acc += dt * (E("ferme", "veto") ? 1.4 : 1);
    if (a.acc >= d.period) {
      a.acc -= d.period;
      let made = 0;
      for (let i = 0; i < a.n && a.st < cap; i++) if (have(d.feed) >= 1) { G.inv[d.feed]--; a.st++; made++; }
      const was = a.hungry;
      a.hungry = made < a.n && a.st < cap;
      if (a.hungry && !was && !OFF) toast(`${d.e} Tes ${d.n.toLowerCase()}s ont faim : il faut du ${ITEMS[d.feed].e} ${ITEMS[d.feed].n.toLowerCase()} !`, "bad");
      dirty = true;
    }
    if (E("ferme", "veto") && a.st > 0) collectAnimal(k);
  }
}

// ---------- Supérette ----------
const MKS = [-0.1, 0.1, 0.25, 0.45, 0.7];
const MK_LBL = { "-0.1": "-10%", "0.1": "+10%", "0.25": "+25%", "0.45": "+45%", "0.7": "+70%" };
const shopBrand = (l = L("superette")) => 1 + 0.03 * (l - 1);
const shelfPrice = sh => ref(sh.item) * (1 + sh.mk) * shopBrand();
const buyChance = (mk, rep) => clamp(0.97 - mk * 1.5 + (rep - 50) / 250 + (G && E("superette", "market") ? 0.15 : 0), 0.04, 0.98);
function shopInterval() {
  const s = G.biz.superette;
  return 7 / ((1 + 0.08 * (s.lvl - 1)) * (E("superette", "caissier") ? 1.3 : 1) * mod("shop") * (G.t < G.rushUntil ? 4 : 1) * (0.6 + s.rep / 100 * 0.8));
}
function restock(sh) {
  if (!sh.item) return 0;
  const n = Math.min(have(sh.item), shelfCap() - sh.qty);
  if (n > 0) { G.inv[sh.item] -= n; sh.qty += n; }
  return Math.max(0, n);
}
function customer() {
  const s = G.biz.superette;
  const st = s.shelves.filter(x => x.item && x.qty > 0);
  if (!st.length) { s.rep = Math.max(0, s.rep - 0.3); return; }
  const sh = pick(st);
  const price = shelfPrice(sh);
  if (Math.random() < buyChance(sh.mk, s.rep)) {
    const q = Math.min(sh.qty, ri(1, 3));
    sh.qty -= q;
    const got = gain(price * q);
    G.stats.sold += q; addXP(q);
    s.rep = Math.min(100, s.rep + (sh.mk <= 0.1 ? 0.6 : sh.mk <= 0.25 ? 0.25 : 0.05) * (E("superette", "market") ? 2 : 1));
    s.log.unshift(`🧍 ${q}× ${ITEMS[sh.item].e} <b>+${money(got)}</b>`);
    if (sh.qty <= 0 && !E("superette", "magasin")) { sh.qty = 0; if (!OFF) toast(`🛒 Rayon ${ITEMS[sh.item].e} vide !`); }
  } else {
    s.rep = Math.max(0, s.rep - 0.5);
    s.log.unshift(`😤 ${ITEMS[sh.item].e} trop cher, le client repart`);
  }
  s.log.length = Math.min(s.log.length, 6);
  dirty = true;
}
function tickShop(dt) {
  const s = G.biz.superette;
  if (!s.own) return;
  if (E("superette", "magasin")) s.shelves.forEach(restock);
  s.acc += dt;
  const iv = shopInterval();
  while (s.acc >= iv) { s.acc -= iv; customer(); }
}

// ---------- Usine ----------
function startRecipe(i, r, auto) {
  const m = G.biz.usine.machines[i], rc = RECIPES[r];
  if (!rc || m.r || rc.lvl > G.lvl) return false;
  if (!canMake(rc.in)) { if (!auto) { toast("🧺 Ingrédients manquants", "bad"); SFX.err(); } return false; }
  consume(rc.in);
  m.r = r; m.last = r; m.start = G.t; m.end = G.t + rc.time / craftSpeed(); m.ready = false;
  return true;
}
function collectMachine(i) {
  const m = G.biz.usine.machines[i];
  if (!m.r || !m.ready) return null;
  const r = m.r;
  const n = E("usine", "chefequipe") && Math.random() < 0.25 ? 2 : 1;
  add(r, n); G.stats.craft += n; addXP(RECIPES[r].xp);
  m.r = null; m.ready = false;
  startRecipe(i, r, true);
  return r;
}
function stopMachine(i) {
  const m = G.biz.usine.machines[i];
  if (!m.r) return;
  if (m.ready) collectMachine(i);
  if (m.r && !m.ready) { for (const k in RECIPES[m.r].in) add(k, RECIPES[m.r].in[k]); }
  m.r = null; m.ready = false;
}
function tickUsine() {
  const u = G.biz.usine;
  if (!u.own) return;
  u.machines.forEach((m, i) => {
    if (m.r && !m.ready && G.t >= m.end) { m.ready = true; dirty = true; }
    if (E("usine", "ouvrier") && m.ready) collectMachine(i);
    if (E("usine", "ouvrier") && !m.r && m.last && !(m.hold > G.t)) startRecipe(i, m.last, true);
  });
}

// ---------- Restaurant ----------
const unlockedDishes = () => Object.keys(DISHES).filter(d => DISHES[d].lvl <= G.lvl);
function rating() {
  const r = G.biz.resto.rates;
  return r.length ? r.reduce((a, b) => a + b, 0) / r.length : 3.5;
}
const dishPrice = d => DISHES[d].price * (1 + 0.04 * (G.biz.resto.lvl - 1)) * mod("restoPrice") * (E("resto", "sommelier") ? 1.25 : 1);
function rate(n) { const r = G.biz.resto.rates; r.push(n); if (r.length > 20) r.shift(); }
function serve(id, auto) {
  const r = G.biz.resto, o = r.orders.find(x => x.id === id);
  if (!o) return false;
  const d = DISHES[o.d];
  if (!canMake(d.in)) { if (!auto) { toast("🧺 Il manque des ingrédients", "bad"); SFX.err(); } return false; }
  consume(d.in);
  const left = (o.end - G.t) / (o.end - o.start);
  rate(left > 0.6 ? 5 : left > 0.3 ? 4 : 3);
  const price = dishPrice(o.d) * (0.75 + rating() * 0.07);
  const tip = left > 0.6 ? price * 0.2 * (E("resto", "serveur") ? 1.5 : 1) : 0;
  const got = gain(price + tip, { float: !auto });
  G.stats.served++; addXP(d.xp);
  r.orders = r.orders.filter(x => x !== o);
  if (!auto && tip) toast(`${d.e} Client ravi ! Pourboire inclus : +${money(got)}`, "good");
  return true;
}
function tickResto(dt) {
  const r = G.biz.resto;
  if (!r.own) return;
  // Sans chef, le restaurant n'est ouvert que quand tu es en salle : les clients attendent sinon.
  const open = E("resto", "chef") || (scr === "biz:resto" && !document.hidden);
  if (!open) { for (const o of r.orders) { o.start += dt; o.end += dt; } return; }
  if (!OFF) {
    r.acc += dt;
    const iv = (r.orders.length ? Math.max(5, 14 - r.lvl / 2) : 3) / mod("resto");
    if (r.acc >= iv) {
      r.acc = 0;
      if (r.orders.length < tableCount()) {
        const all = unlockedDishes(), can = all.filter(x => canMake(DISHES[x].in));
        const d = can.length && Math.random() < 0.75 ? pick(can) : pick(all);
        const pat = (38 + Object.keys(DISHES[d].in).length * 6) * (1 + 0.04 * (r.lvl - 1)) * (E("resto", "serveur") ? 1.5 : 1);
        r.orders.push({ id: r.nid++, d, start: G.t, end: G.t + pat });
        dirty = true;
        if (scr === "biz:resto") SFX.ding();
      }
    }
  }
  for (const o of r.orders.slice()) {
    if (G.t > o.end) {
      r.orders = r.orders.filter(x => x !== o);
      rate(1); G.stats.missed++; dirty = true;
      if (!OFF) toast(`😠 Un client est parti sans manger (${DISHES[o.d].e})`, "bad");
    }
  }
  if (E("resto", "chef")) {
    r.chefAcc += dt;
    if (r.chefAcc >= 3) {
      r.chefAcc = 0;
      const o = r.orders.find(x => canMake(DISHES[x.d].in));
      if (o) { serve(o.id, true); dirty = true; }
    }
  }
}

// ---------- Logistique ----------
function producible() {
  const l = [];
  for (const c in CROPS) if (CROPS[c].lvl <= G.lvl) l.push(c);
  for (const a in ANIMALS) if (G.biz.ferme.animals[a].n > 0) l.push(ANIMALS[a].out);
  if (G.biz.usine.own) for (const r in RECIPES) if (RECIPES[r].lvl <= G.lvl) l.push(r);
  return l;
}
function genContract() {
  const pool = producible();
  const lines = ri(1, Math.min(3, pool.length));
  const items = {};
  let value = 0;
  for (const it of shuffle(pool).slice(0, lines)) {
    const q = Math.max(3, Math.round(truckCap() / lines * rnd(0.3, 0.7) * clamp(10 / ITEMS[it].p, 0.2, 1)));
    items[it] = q; value += q * ITEMS[it].p;
  }
  const reward = Math.round(value * rnd(1.6, 2.2) * (1 + 0.04 * (L("transport") - 1)) * (E("transport", "nego") ? 1.25 : 1));
  return { id: Math.random().toString(36).slice(2, 9), city: pick(CITIES), items, reward,
    xp: Math.round(20 + reward / 25), dur: Math.round(rnd(45, 130)), exp: G.day + 3 };
}
function acceptContract(c, silent) {
  const t = G.biz.transport, tr = t.trucks.find(x => !x.busy);
  if (!c || !tr || !canMake(c.items)) return false;
  consume(c.items);
  Object.assign(tr, { busy: true, c, start: G.t, end: G.t + c.dur / truckSpeed() });
  t.contracts = t.contracts.filter(x => x !== c);
  t.contracts.push(genContract());
  if (!silent && !OFF) { toast(`🚚 Camion en route vers ${c.city} !`); vib(30); }
  return true;
}
function tickTransport() {
  const t = G.biz.transport;
  if (!t.own) return;
  if (E("transport", "dispatch")) for (const c of t.contracts.slice()) if (canMake(c.items)) acceptContract(c, true);
  for (const tr of t.trucks) {
    if (tr.busy && G.t >= tr.end) {
      const c = tr.c;
      const got = gain(c.reward);
      G.stats.contracts++; addXP(c.xp);
      tr.busy = false; tr.c = null; dirty = true;
      if (!OFF) { toast(`🚚 Livraison à ${c.city} terminée : +${money(got)}`, "good"); SFX.coin(); }
    }
  }
}

// ---------- Immobilier ----------
function rentPerDay() {
  const im = G.biz.immo;
  if (!im.own) return 0;
  let r = 0;
  for (const p in PROPS) r += (im.props[p] || 0) * PROPS[p].rent;
  return r * (0.7 + 0.3 * im.idx) * (1 + 0.05 * (im.lvl - 1)) * (E("immo", "gestion") ? 1.25 : 1) * (E("immo", "concierge") ? 1.3 : 1) * mod("rent");
}
const propPrice = p => PROPS[p].price * G.biz.immo.idx * (E("immo", "agent") ? 0.9 : 1);
const propSell = p => PROPS[p].price * G.biz.immo.idx * (E("immo", "agent") ? 1 : 0.9);

// ---------- Journée ----------
function wages() {
  let w = 0;
  for (const b of BIZ_ORDER) if (G.biz[b].own) for (const e of EMPS[b]) if (E(b, e.id)) w += e.wage;
  return w;
}
function startEvent() {
  const ok = Object.keys(EVENTS).filter(id => {
    if (G.events.some(e => e.id === id)) return false;
    if (id === "greve") return G.biz.transport.own;
    if (id === "boom") return G.biz.immo.own;
    if (id === "touristes") return G.biz.resto.own;
    if (id === "festival" || id === "crise") return G.biz.superette.own;
    return true;
  });
  if (!ok.length) return;
  const id = pick(ok);
  const e = { id, d: EVENTS[id].d };
  if (id === "penurie") e.item = pick(producible());
  G.events.push(e);
  if (!OFF) { toast(`${EVENTS[id].e} <b>${evName(e)}</b> : ${evTxt(e)}`, "event"); SFX.ding(); }
}
const evName = e => e.id === "penurie" ? `Pénurie de ${ITEMS[e.item].n.toLowerCase()}` : EVENTS[e.id].n;
const evTxt = e => e.id === "penurie" ? `le ${ITEMS[e.item].e} se vend deux fois plus cher !` : EVENTS[e.id].txt;

function newDay() {
  G.events.forEach(e => e.d--);
  G.events = G.events.filter(e => e.d > 0);
  if (G.day > 2 && G.events.length < 2 && Math.random() < 0.3) startEvent();
  for (const id in ITEMS) {
    const mk = G.market[id];
    mk.m = clamp(mk.m + rnd(-0.1, 0.1) + (1 - mk.m) * 0.15, 0.6, 1.6);
    mk.h.push(mk.m); if (mk.h.length > 14) mk.h.shift();
  }
  const im = G.biz.immo;
  im.idx = clamp(im.idx + rnd(-0.05, 0.06) + (1 - im.idx) * 0.1, 0.7, 1.5);
  im.hist.push(im.idx); if (im.hist.length > 14) im.hist.shift();
  const rent = rentPerDay();
  let gotRent = rent > 0 ? gain(rent) : 0;
  let w = wages(), fired = [];
  while (w > 0 && G.money < w) {
    const all = []; for (const b of BIZ_ORDER) for (const e of EMPS[b]) if (E(b, e.id)) all.push([b, e]);
    all.sort((x, y) => y[1].wage - x[1].wage);
    const [b, e] = all[0]; G.biz[b].emps[e.id] = false; fired.push(e.n); w = wages();
  }
  G.money -= w;
  const t = G.biz.transport;
  t.contracts = t.contracts.filter(c => c.exp >= G.day);
  if (t.own) while (t.contracts.length < 4) t.contracts.push(genContract());
  if (!OFF) {
    let msg = `☀️ <b>Jour ${G.day}</b>`;
    if (gotRent) msg += ` · loyers +${money(gotRent)}`;
    if (w) msg += ` · salaires -${money(w)}`;
    toast(msg);
    if (fired.length) toast(`😢 Impossible de payer : ${fired.join(", ")} démissionne`, "bad");
  }
  dirty = true;
}

// ---------- Missions & succès ----------
const QT = {
  planted:   { e: "🌱", t: n => `Planter ${n} graines`, n: l => 12 + l * 4 },
  harvest:   { e: "🧺", t: n => `Récolter ${n} produits à la ferme`, n: l => 15 + l * 8 },
  animal:    { e: "🥚", t: n => `Ramasser ${n} œufs ou bouteilles de lait`, n: l => 6 + l * 3 },
  earned:    { e: "💰", t: n => `Gagner ${money(n)}`, n: l => Math.round(250 * Math.pow(1.5, l)) },
  sold:      { e: "🛒", b: "superette", t: n => `Vendre ${n} articles en magasin`, n: l => 12 + l * 5 },
  craft:     { e: "🏭", b: "usine", t: n => `Fabriquer ${n} produits à l'usine`, n: l => 4 + l * 2 },
  served:    { e: "🍽️", b: "resto", t: n => `Servir ${n} plats au restaurant`, n: l => 3 + l },
  contracts: { e: "🚚", b: "transport", t: n => `Livrer ${n} contrat${n > 1 ? "s" : ""}`, n: l => 1 + Math.floor(l / 8) },
};
function genQuest() {
  const used = G.quests.map(q => q.k);
  const keys = Object.keys(QT).filter(k => {
    if (used.includes(k)) return false;
    if (QT[k].b && !G.biz[QT[k].b].own) return false;
    if (k === "animal" && !Object.values(G.biz.ferme.animals).some(a => a.n > 0)) return false;
    return true;
  });
  const k = keys.length ? pick(keys) : pick(["harvest", "planted", "earned"]);
  return { k, n: QT[k].n(G.lvl), base: G.stats[k], money: Math.round(60 * Math.pow(1.28, G.lvl)),
    xp: 25 + G.lvl * 12, gems: Math.random() < 0.4 ? 2 : 1 };
}
const qProg = q => clamp(G.stats[q.k] - q.base, 0, q.n);
function checkAch() {
  for (const a of ACHS) {
    if (!G.ach[a.id] && a.c(G)) {
      G.ach[a.id] = 1; G.gems += a.g;
      toast(`🏆 Succès : <b>${a.n}</b> (+${a.g} 💎)`, "good"); SFX.level();
      dirty = true;
    }
  }
}
const questsReady = () => G.quests.filter(q => qProg(q) >= q.n).length;

// ---------- Récompense quotidienne ----------
const dayKey = (d = new Date()) => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
const canDaily = () => G.daily.last !== dayKey();
function dailyReward(streak) {
  return { money: Math.round(150 * G.lvl * (1 + streak * 0.5)), gems: streak % 7 === 0 ? 10 : 1 + Math.floor(streak / 3) };
}

// ---------- Boucle ----------
function tick(dt) {
  G.t += dt;
  const d = Math.floor(G.t / DAY) + 1;
  while (G.day < d) { G.day++; newDay(); }
  tickFarm(dt); tickShop(dt); tickUsine(); tickResto(dt); tickTransport();
}
function catchUp(sec) {
  sec = Math.min(sec, 3 * 3600);
  if (sec > 60) G.biz.resto.orders = [];
  OFF = true;
  const m0 = G.money, l0 = G.lvl;
  const steps = Math.floor(sec);
  for (let i = 0; i < steps; i++) tick(1);
  tick(sec - steps);
  OFF = false;
  dirty = true;
  return { sec, earned: G.money - m0, lvls: G.lvl - l0 };
}

// ---------- Sons & vibrations ----------
let AC;
function beep(f = 600, d = 0.08, type = "sine", v = 0.07) {
  if (!G.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d);
    o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d);
  } catch (e) {}
}
const SFX = {
  tap: () => beep(520, 0.035, "triangle", 0.04),
  coin: () => { beep(880, 0.07); setTimeout(() => beep(1320, 0.1), 60); },
  err: () => beep(150, 0.18, "square", 0.04),
  ding: () => beep(1250, 0.15, "sine", 0.05),
  level: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.16, "triangle", 0.08), i * 110)),
};
const vib = (ms = 12) => { if (G.settings.vibe && navigator.vibrate) navigator.vibrate(ms); };

// ---------- UI : toasts, flottants, modale ----------
let lastXY = [innerWidth / 2, innerHeight / 2];
function toast(html, type = "") {
  if (OFF) return;
  const box = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast " + type; el.innerHTML = html;
  box.prepend(el);
  while (box.children.length > 3) box.lastChild.remove();
  setTimeout(() => el.classList.add("out"), 3200);
  setTimeout(() => el.remove(), 3700);
}
function floatTxt(txt, cls = "") {
  const el = document.createElement("div");
  el.className = "float " + cls; el.textContent = txt;
  el.style.left = lastXY[0] + "px"; el.style.top = lastXY[1] + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
function pulse(sel) {
  const el = $(sel); if (!el) return;
  el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse");
}
let modalFn = null, modalTitle = "";
function openModal(title, fn) {
  modalTitle = title; modalFn = fn;
  refreshModal();
  $("#modal").classList.add("show");
}
function refreshModal() {
  if (!modalFn) return;
  $("#modal .mbox").innerHTML = `<div class="mhead"><h3>${modalTitle}</h3><button class="x" data-a="close">✕</button></div><div class="mbody">${modalFn()}</div>`;
}
function closeModal() { modalFn = null; $("#modal").classList.remove("show"); }

function levelUp(from) {
  SFX.level(); vib(60);
  let ul = [];
  for (let l = from + 1; l <= G.lvl; l++) ul = ul.concat(unlocksAt(l));
  openModal("🎉 Niveau " + G.lvl + " !", () => `
    <div class="center big">⭐</div>
    <p class="center">Bravo patron ! Tu gagnes <b>${2 * (G.lvl - from)} 💎</b>.</p>
    ${ul.length ? `<div class="sec">Nouveautés débloquées</div><ul class="ul">${ul.map(x => `<li>${x}</li>`).join("")}</ul>` : ""}
    <button class="btn gold full" data-a="close">Continuer</button>`);
}

// ---------- Petits composants ----------
function pbar(s, e, rev, cls = "") {
  let p = clamp((G.t - s) / (e - s || 1), 0, 1);
  if (rev) p = 1 - p;
  return `<div class="pb ${cls}${rev && p < 0.3 ? " hurry" : ""}" data-start="${s}" data-end="${e}"${rev ? ' data-rev="1"' : ""}><i style="width:${(p * 100).toFixed(1)}%"></i><span>${fmtT(e - G.t)}</span></div>`;
}
const sbar = (p, cls = "") => `<div class="pb ${cls}"><i style="width:${clamp(p, 0, 1) * 100}%"></i></div>`;
function ingr(map, times = 1) {
  return Object.keys(map).map(k => {
    const ok = have(k) >= map[k] * times;
    return `<span class="ing ${ok ? "ok" : "no"}">${ITEMS[k].e} ${have(k)}/${map[k] * times}</span>`;
  }).join("");
}
function spark(h, w = 64, hh = 20) {
  if (h.length < 2) h = [h[0] || 1, h[0] || 1];
  const mn = Math.min(...h), mx = Math.max(...h), r = mx - mn || 1;
  const pts = h.map((v, i) => `${(i / (h.length - 1)) * w},${hh - ((v - mn) / r) * (hh - 2) - 1}`).join(" ");
  const up = h[h.length - 1] >= h[h.length - 2];
  return `<svg class="spark" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}"><polyline points="${pts}" fill="none" stroke="${up ? "#4ade80" : "#f87171"}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
function trend(h) {
  if (h.length < 2) return `<span class="tr">=</span>`;
  const d = h[h.length - 1] / h[h.length - 2] - 1;
  if (Math.abs(d) < 0.01) return `<span class="tr">=</span>`;
  return d > 0 ? `<span class="tr up">▲ ${Math.round(d * 100)}%</span>` : `<span class="tr down">▼ ${Math.round(-d * 100)}%</span>`;
}
const skipCost = end => Math.max(1, Math.ceil((end - G.t) / 60));

// ---------- Écrans ----------
function bizHead(b) {
  const o = G.biz[b], d = BIZ[b];
  const up = o.lvl < MAX_LVL
    ? `<button class="upbtn" data-a="upg" data-b="${b}">⬆️ <b>${money(upCost(b))}</b></button>`
    : `<span class="upbtn max">MAX ⭐</span>`;
  return `<div class="bhead" style="--c:${d.col}">
    <button class="back" data-a="nav" data-s="home">‹</button>
    <div class="bemo">${d.e}</div>
    <div class="btitle"><h2>${d.n}</h2><div class="lvdots">${Array.from({ length: MAX_LVL }, (_, i) => `<i class="${i < o.lvl ? "on" : ""}"></i>`).join("")}</div></div>
    ${up}</div>`;
}
function empCard(b) {
  const o = G.biz[b];
  let h = `<div class="sec">Personnel <small>· ${empCount(b)}/3 · salaires payés chaque matin</small></div>`;
  for (const e of EMPS[b]) {
    const on = E(b, e.id), lock = o.lvl < e.lvl;
    h += `<div class="card emp ${lock ? "lock" : ""}"><div class="emo">${e.e}</div>
      <div class="grow"><b>${e.n}</b> ${on ? '<span class="tag good">En poste</span>' : ""}<small>${e.desc}</small>
      <small class="dim">${lock ? `🔒 ${BIZ[b].n} niveau ${e.lvl}` : on ? `Salaire ${money(e.wage)} / jour` : `Embauche ${money(e.wage * 40)} · puis ${money(e.wage)} / jour`}</small></div>
      ${lock ? "" : `<button class="btn sm ${on ? "ghost" : "gold"}" data-a="emp" data-b="${b}" data-e="${e.id}">${on ? "Renvoyer" : "Embaucher"}</button>`}</div>`;
  }
  return h;
}

function vHome() {
  let h = "";
  if (canDaily()) h += `<button class="daily" data-a="daily"><span>🎁</span><div><b>Cadeau du jour !</b><small>${G.daily.streak ? `Série de ${G.daily.streak} jour(s) — ne la casse pas !` : "Touche pour l'ouvrir et lancer ta série"}</small></div></button>`;
  for (const e of G.events) h += `<div class="event"><span>${EVENTS[e.id].e}</span><div><b>${evName(e)}</b><small>${evTxt(e)} · encore ${e.d} j</small></div></div>`;
  if (G.t < G.boostUntil) h += `<div class="event boost"><span>⚡</span><div><b>Boost ×2 actif</b><small>Encore ${fmtT(G.boostUntil - G.t)}</small></div></div>`;
  h += `<div class="stats3">
    <div class="card"><small>Valeur de l'empire</small><b>${money(netWorth())}</b></div>
    <div class="card"><small>Revenus</small><b>${money(incomeRate())}<em>/min</em></b></div></div>`;
  // objectif
  const next = BIZ_ORDER.find(b => !G.biz[b].own);
  const qr = questsReady();
  if (qr) h += `<button class="goal" data-a="nav" data-s="quests">🎯 <b>${qr} mission${qr > 1 ? "s" : ""} terminée${qr > 1 ? "s" : ""}</b> — récupère ta récompense !</button>`;
  else if (next) {
    const d = BIZ[next];
    h += `<div class="goal">🎯 Prochain objectif : ouvrir <b>${d.e} ${d.n}</b> ${G.lvl < d.lvl ? `(niveau ${d.lvl} requis)` : `pour ${money(d.cost)}`}</div>`;
  } else if (G.runEarned >= PRESTIGE_MIN) h += `<button class="goal" data-a="nav" data-s="more">🌟 Tu peux faire un <b>prestige</b> pour devenir encore plus riche !</button>`;

  h += `<div class="sec">Tes entreprises</div><div class="bgrid">`;
  for (const b of BIZ_ORDER) {
    const o = G.biz[b], d = BIZ[b];
    if (o.own) {
      const st = bizStatus(b);
      h += `<button class="bcard" style="--c:${d.col}" data-a="open" data-b="${b}">
        ${st.alert ? '<i class="dot"></i>' : ""}
        <span class="bemo">${d.e}</span><b>${d.n}</b><small>Niv. ${o.lvl}${empCount(b) ? " · " + EMPS[b].filter(e => E(b, e.id)).map(e => e.e).join("") : ""}</small><em>${st.txt}</em></button>`;
    } else if (G.lvl >= d.lvl) {
      h += `<button class="bcard buy" style="--c:${d.col}" data-a="buybiz" data-b="${b}">
        <span class="bemo">${d.e}</span><b>${d.n}</b><small>${d.desc}</small><em class="price ${G.money >= d.cost ? "ok" : ""}">Ouvrir · ${money(d.cost)}</em></button>`;
    } else {
      h += `<div class="bcard lock"><span class="bemo">${d.e}</span><b>${d.n}</b><small>${d.desc}</small><em>🔒 Niveau ${d.lvl}</em></div>`;
    }
  }
  return h + "</div>";
}
function bizStatus(b) {
  const o = G.biz[b];
  switch (b) {
    case "ferme": {
      const r = o.plots.filter(p => p.ready).length, g = o.plots.filter(p => p.c && !p.ready).length;
      const an = Object.values(o.animals).reduce((s, a) => s + a.st, 0);
      const empty = o.plots.length - r - g;
      return { alert: (r || an || empty) && !E("ferme", "fermier"), txt: r ? `🧺 ${r} prête(s)` : an ? `🥚 ${an} à ramasser` : empty ? `🌱 ${empty} parcelle(s) libre(s)` : `🌱 ${g} en culture` };
    }
    case "superette": {
      const em = o.shelves.filter(s => !s.item || s.qty <= 0).length;
      return { alert: em > 0, txt: em ? `⚠️ ${em} rayon(s) vide(s)` : `⭐ Réputation ${Math.round(o.rep)}%` };
    }
    case "usine": {
      const r = o.machines.filter(m => m.ready).length, idle = o.machines.filter(m => !m.r).length;
      return { alert: (r || idle) && !E("usine", "ouvrier"), txt: r ? `✅ ${r} prête(s)` : idle ? `⚙️ ${idle} machine(s) à l'arrêt` : `⚙️ En production` };
    }
    case "resto": return { alert: o.orders.length > 0 && !E("resto", "chef"), txt: o.orders.length ? `🔔 ${o.orders.length} client(s)` : `★ ${rating().toFixed(1)}` };
    case "transport": {
      const free = o.trucks.filter(t => !t.busy).length;
      return { alert: free > 0, txt: free ? `🚚 ${free} camion(s) dispo` : `🛣️ Tous en route` };
    }
    case "immo": return { alert: false, txt: `🔑 +${money(rentPerDay())}/jour` };
  }
}

function vFerme() {
  const f = G.biz.ferme;
  let h = bizHead("ferme");
  const ready = f.plots.filter(p => p.ready).length, empty = f.plots.filter(p => !p.c).length;
  // résumé de ce qui pousse
  const count = {};
  f.plots.forEach(p => { if (p.c) count[p.c] = (count[p.c] || 0) + 1; });
  const mix = Object.keys(count).map(c => `${ITEMS[c].e}×${count[c]}`).join("  ");
  h += `<div class="sec">Tes champs (${f.plots.length}) <small>· touche un champ vide pour choisir quoi planter</small></div>`;
  if (mix) h += `<div class="mix">${mix}</div>`;
  h += `<div class="plots">`;
  f.plots.forEach((p, i) => {
    if (!p.c) h += `<button class="plot empty" data-a="plot" data-i="${i}"><span>＋</span><small>${p.last ? "avant : " + ITEMS[p.last].e : "Planter"}</small></button>`;
    else if (p.ready) h += `<button class="plot ready" data-a="plot" data-i="${i}"><span>${ITEMS[p.c].e}</span><small>Récolter</small></button>`;
    else h += `<button class="plot grow" data-a="plot" data-i="${i}"><span>${ITEMS[p.c].e}</span>${pbar(p.start, p.end, false, "thin")}</button>`;
  });
  h += `</div><div class="row">
    <button class="btn" data-a="plantall" ${empty ? "" : "disabled"}>🌱 Planter les champs vides<small>${empty} champ(s) libre(s)</small></button>
    <button class="btn gold" data-a="harvall" ${ready ? "" : "disabled"}>🧺 Tout récolter<small>${ready} prêt(s)</small></button></div>
    <button class="li btnli" data-a="replant"><span class="emo">🔁</span><div class="grow"><b>Replanter la même culture après récolte</b><small>Chaque champ garde sa culture. Désactive pour choisir à chaque fois.</small></div><span class="tag ${f.replant !== false ? "good" : ""}">${f.replant !== false ? "Oui" : "Non"}</span></button>`;
  h += `</div><div class="sec">Animaux</div>`;
  for (const k in ANIMALS) {
    const d = ANIMALS[k], a = f.animals[k];
    if (d.lvl > G.lvl) { h += `<div class="card animal lock"><div class="aemo">${d.e}</div><div class="grow"><b>${d.n}s</b><small>🔒 Niveau ${d.lvl}</small></div></div>`; continue; }
    h += `<div class="card animal"><div class="aemo">${d.e}</div><div class="grow">
      <b>${d.n}s ${a.n}/${animalCap()}</b>
      <small>Produit ${ITEMS[d.out].e} toutes les ${d.period}s · mange ${ITEMS[d.feed].e} (stock : ${have(d.feed)})</small>
      ${a.n ? `<div class="pb thin" data-anim="${k}"><i></i></div>` : ""}
      ${a.hungry ? `<small class="warn">⚠️ Plus de ${ITEMS[d.feed].n.toLowerCase()} pour les nourrir !</small>` : ""}
      </div><div class="acol">
      <button class="btn sm" data-a="buyani" data-k="${k}" ${a.n >= animalCap() ? "disabled" : ""}>+1 · ${money(animalCost(k))}</button>
      <button class="btn sm gold" data-a="colani" data-k="${k}" ${a.st ? "" : "disabled"}>${ITEMS[d.out].e} ${a.st}</button></div></div>`;
  }
  return h + empCard("ferme");
}

function cropPicker(target) {
  return () => {
    const f = G.biz.ferme;
    const empty = f.plots.filter(p => !p.c).length;
    const n = target === "all" ? empty : 1;
    let h = target === "all" ? `<p class="tip">Plante la même culture sur tes <b>${empty}</b> champ(s) vide(s). Pour mélanger, touche les champs un par un.</p>` : "";
    h += `<div class="list">`;
    for (const c in CROPS) {
      const cr = CROPS[c], lock = cr.lvl > G.lvl;
      if (lock) { h += `<div class="li lock"><span class="emo">${ITEMS[c].e}</span><div class="grow"><b>${ITEMS[c].n}</b><small>🔒 Niveau ${cr.lvl}</small></div></div>`; continue; }
      const t = cr.time / growSpeed(), val = cr.yield * ref(c), profit = val - cr.seed;
      h += `<button class="li btnli" data-a="plantc" data-i="${target}" data-c="${c}" ${G.money >= cr.seed ? "" : "disabled"}>
        <span class="emo">${ITEMS[c].e}</span><div class="grow"><b>${ITEMS[c].n}</b>
        <small>⏱ ${fmtT(t)} · récolte ×${cr.yield} · vaut ~${fmtP(val)}</small>
        <small class="good">≈ ${fmtP(profit / t * 60)}/min par champ</small></div>
        <span class="tag">${n > 1 ? n + " × " : ""}${cr.seed} €</span></button>`;
    }
    return h + "</div>";
  };
}

function vSuperette() {
  const s = G.biz.superette;
  let h = bizHead("superette");
  h += `<div class="card shopstats">
    <div><small>Réputation</small>${sbar(s.rep / 100, "rep")}<b>${Math.round(s.rep)}%</b></div>
    <div><small>Affluence</small><b>${(60 / shopInterval()).toFixed(1)} clients/min</b>${G.t < G.rushUntil ? '<span class="tag good">PROMO FLASH</span>' : ""}</div></div>
    <div class="log">${s.log.length ? s.log.map(x => `<div>${x}</div>`).join("") : '<div class="dim">Remplis un rayon pour accueillir tes premiers clients…</div>'}</div>
    <p class="tip">💡 Prix bas = plus de ventes et meilleure réputation. Prix haut = plus de marge par article.</p>`;
  h += `<div class="sec">Rayons (${s.shelves.length})</div>`;
  s.shelves.forEach((sh, i) => {
    if (!sh.item) { h += `<button class="shelf empty" data-a="fill" data-i="${i}">＋ Mettre un produit en rayon</button>`; return; }
    const it = ITEMS[sh.item];
    h += `<div class="card shelf"><div class="shtop"><span class="emo">${it.e}</span>
      <div class="grow"><b>${it.n}</b><small>${sh.qty}/${shelfCap()} en rayon · ${have(sh.item)} en stock</small>${sbar(sh.qty / shelfCap(), sh.qty ? "" : "bad")}</div>
      <div class="price"><b>${fmtP(shelfPrice(sh))}</b><small>${Math.round(buyChance(sh.mk, s.rep) * 100)}% achat</small></div></div>
      <div class="seg">${MKS.map(m => `<button class="${sh.mk === m ? "on" : ""}" data-a="mk" data-i="${i}" data-m="${m}">${MK_LBL[m]}</button>`).join("")}</div>
      <div class="row"><button class="btn sm" data-a="refill" data-i="${i}" ${have(sh.item) && sh.qty < shelfCap() ? "" : "disabled"}>📦 Réapprovisionner</button>
      <button class="btn sm ghost" data-a="unshelf" data-i="${i}">Retirer</button></div></div>`;
  });
  h += `<button class="btn full" data-a="grossiste">🏬 Commander chez le grossiste</button>`;
  return h + empCard("superette");
}

function vUsine() {
  const u = G.biz.usine;
  let h = bizHead("usine");
  h += `<div class="sec">Chaînes de production (${u.machines.length}) <small>· vitesse ×${craftSpeed().toFixed(1)}</small></div>`;
  u.machines.forEach((m, i) => {
    if (!m.r) h += `<button class="machine idle" data-a="pickrec" data-i="${i}">⚙️ Chaîne ${i + 1} à l'arrêt<small>Touche pour choisir une recette</small></button>`;
    else if (m.ready) h += `<div class="machine ready"><span>${ITEMS[m.r].e}</span><div class="grow"><b>${ITEMS[m.r].n} prêt !</b><small>Récupère pour relancer la même recette</small></div>
      <div class="acol"><button class="btn sm gold" data-a="colm" data-i="${i}">Récupérer</button><button class="btn sm ghost" data-a="mach" data-i="${i}">🔄 Changer</button></div></div>`;
    else h += `<div class="machine run"><span>${ITEMS[m.r].e}</span><div class="grow"><b>${ITEMS[m.r].n}</b><small>Chaîne ${i + 1}</small>${pbar(m.start, m.end)}</div>
      <div class="acol"><button class="btn sm ghost" data-a="mach" data-i="${i}">🔄 Changer</button><button class="btn sm gem" data-a="skip" data-k="m" data-i="${i}">⚡ ${skipCost(m.end)}💎</button></div></div>`;
  });
  h += `<div class="sec">Recettes</div><div class="list">`;
  for (const r in RECIPES) {
    const rc = RECIPES[r], lock = rc.lvl > G.lvl;
    h += `<div class="li ${lock ? "lock" : ""}"><span class="emo">${ITEMS[r].e}</span><div class="grow"><b>${ITEMS[r].n}</b>
      <small>${lock ? "🔒 Niveau " + rc.lvl : ingr(rc.in) + " · " + fmtT(rc.time / craftSpeed())}</small></div><b class="dim">${fmtP(ref(r))}</b></div>`;
  }
  return h + "</div>" + empCard("usine");
}
function recipeModal(i) {
  return () => {
    const m = G.biz.usine.machines[i];
    const back = m.r && !m.ready ? RECIPES[m.r].in : {};
    let h = m.r ? `<div class="card"><b>En ce moment : ${ITEMS[m.r].e} ${ITEMS[m.r].n}</b>
      <small>${m.ready ? "La production finie sera récupérée avant de changer." : "Si tu changes, les ingrédients en cours te sont rendus."}</small>
      <button class="btn ghost full" data-a="stopm" data-i="${i}">⏹️ Arrêter cette chaîne</button></div><div class="sec">Nouvelle recette</div>` : "";
    h += `<div class="list">`;
    for (const r in RECIPES) {
      const rc = RECIPES[r];
      if (rc.lvl > G.lvl) continue;
      const ok = Object.keys(rc.in).every(k => have(k) + (back[k] || 0) >= rc.in[k]);
      const cur = m.r === r;
      let inV = 0; for (const k in rc.in) inV += rc.in[k] * ref(k);
      h += `<button class="li btnli" data-a="startrec" data-i="${i}" data-r="${r}" ${ok && !cur ? "" : "disabled"}>
        <span class="emo">${ITEMS[r].e}</span><div class="grow"><b>${ITEMS[r].n}${cur ? ' <span class="tag good">en cours</span>' : ""}</b><small>${ingr(rc.in)}</small>
        <small class="dim">⏱ ${fmtT(rc.time / craftSpeed())} · valeur ${fmtP(inV)} → <b class="good">${fmtP(ref(r))}</b></small></div></button>`;
    }
    return h + "</div>";
  };
}

function vResto() {
  const r = G.biz.resto;
  let h = bizHead("resto");
  const rt = rating();
  h += `<div class="card rstats"><div class="stars">${"★".repeat(Math.round(rt))}<span>${"★".repeat(5 - Math.round(rt))}</span></div>
    <small>Note ${rt.toFixed(1)}/5 · les clients satisfaits paient plus cher</small></div>
    ${E("resto", "chef") ? "" : `<p class="tip">🕒 Sans chef cuisinier, la salle n'est ouverte que quand tu es là : les clients patientent pendant ton absence.</p>`}`;
  h += `<div class="sec">Salle (${tableCount()} tables)</div><div class="tables">`;
  for (const o of r.orders) {
    const d = DISHES[o.d], ok = canMake(d.in);
    h += `<div class="card order"><div class="otop"><span class="emo">${d.e}</span><div class="grow"><b>${d.n}</b><small>${fmtP(dishPrice(o.d))}</small></div></div>
      <div class="ings">${ingr(d.in)}</div>${pbar(o.start, o.end, true, "pat")}
      <button class="btn ${ok ? "gold" : ""} full" data-a="serve" data-o="${o.id}" ${ok ? "" : "disabled"}>${ok ? "🍽️ Servir" : "Ingrédients manquants"}</button></div>`;
  }
  for (let i = r.orders.length; i < tableCount(); i++) h += `<div class="card order free">🪑<small>Table libre…</small></div>`;
  h += `</div><div class="sec">Carte du restaurant</div><div class="list">`;
  for (const k in DISHES) {
    const d = DISHES[k], lock = d.lvl > G.lvl;
    h += `<div class="li ${lock ? "lock" : ""}"><span class="emo">${d.e}</span><div class="grow"><b>${d.n}</b><small>${lock ? "🔒 Niveau " + d.lvl : ingr(d.in)}</small></div><b class="dim">${money(d.price)}</b></div>`;
  }
  return h + "</div>" + empCard("resto");
}

function vTransport() {
  const t = G.biz.transport;
  let h = bizHead("transport");
  h += `<div class="sec">Flotte <small>· capacité ${truckCap()} articles/camion</small></div>`;
  t.trucks.forEach((tr, i) => {
    if (!tr.busy) h += `<div class="card truck"><span class="emo">🚚</span><div class="grow"><b>Camion ${i + 1}</b><small class="good">Disponible au dépôt</small></div></div>`;
    else h += `<div class="card truck"><span class="emo moving">🚚</span><div class="grow"><b>→ ${tr.c.city}</b>${pbar(tr.start, tr.end)}</div><b class="good">+${money(tr.c.reward * mult())}</b>
      <button class="btn sm gem" data-a="skip" data-k="t" data-i="${i}">⚡ ${skipCost(tr.end)}💎</button></div>`;
  });
  const free = t.trucks.some(x => !x.busy);
  h += `<div class="sec">Contrats disponibles <button class="mini-btn" data-a="refreshc">🔄 2💎</button></div>`;
  for (const c of t.contracts) {
    const ok = canMake(c.items);
    const qty = Object.values(c.items).reduce((a, b) => a + b, 0);
    h += `<div class="card contract"><div class="otop"><span class="emo">📦</span><div class="grow"><b>Livraison à ${c.city}</b>
      <small>${qty} articles · ⏱ ${fmtT(c.dur / truckSpeed())} · expire jour ${c.exp}</small></div><b class="good">${money(c.reward * mult())}</b></div>
      <div class="ings">${ingr(c.items)}</div>
      <button class="btn ${ok && free ? "gold" : ""} full" data-a="accept" data-c="${c.id}" ${ok && free ? "" : "disabled"}>${!free ? "Aucun camion libre" : ok ? "🚚 Charger et partir" : "Marchandise insuffisante"}</button></div>`;
  }
  return h + empCard("transport");
}

function vImmo() {
  const im = G.biz.immo;
  let h = bizHead("immo");
  h += `<div class="card istats"><div><small>Indice immobilier</small><b>${Math.round(im.idx * 100)}</b> ${trend(im.hist)}</div>${spark(im.hist, 90, 30)}
    <div><small>Loyers</small><b class="good">+${money(rentPerDay() * mult())}/jour</b></div></div>
    <p class="tip">💡 Achète quand l'indice est bas, revends quand il est haut. Les loyers tombent chaque matin.</p><div class="list">`;
  for (const p in PROPS) {
    const d = PROPS[p], n = im.props[p] || 0, lock = d.lvl > G.lvl;
    if (lock) { h += `<div class="li lock"><span class="emo">${d.e}</span><div class="grow"><b>${d.n}</b><small>🔒 Niveau ${d.lvl}</small></div></div>`; continue; }
    h += `<div class="card prop"><span class="emo">${d.e}</span><div class="grow"><b>${d.n}${n ? ` <span class="tag">×${n}</span>` : ""}</b>
      <small>Prix ${money(propPrice(p))} · loyer ~${money(d.rent)}/j</small></div>
      <div class="acol"><button class="btn sm gold" data-a="buyprop" data-p="${p}">Acheter</button>
      ${n ? `<button class="btn sm ghost" data-a="sellprop" data-p="${p}">Vendre ${money(propSell(p))}</button>` : ""}</div></div>`;
  }
  return h + "</div>" + empCard("immo");
}

function vStock() {
  let h = `<h2 class="ptitle">📦 Entrepôt</h2>`;
  const ids = Object.keys(ITEMS).filter(id => have(id) > 0);
  let val = 0; ids.forEach(id => val += have(id) * ref(id) * 0.7);
  h += `<div class="card"><small>Valeur de revente du stock</small><b>${money(val)}</b></div>
    <p class="tip">💡 Vendre ici rapporte 70 % du cours. La supérette, l'usine, le resto et les contrats paient bien mieux !</p>`;
  if (!ids.length) h += `<div class="empty-state">Ton entrepôt est vide.<br>Va récolter à la ferme 🚜</div>`;
  h += `<div class="list">`;
  for (const id of ids) {
    const it = ITEMS[id], p = ref(id) * 0.7 * mult();
    h += `<div class="li"><span class="emo">${it.e}</span><div class="grow"><b>${it.n} <span class="tag">${have(id)}</span></b>
      <small>${fmtP(p)} / u ${trend(G.market[id].h)}</small></div>
      <button class="btn sm" data-a="sell" data-id="${id}" data-q="10">×10</button>
      <button class="btn sm gold" data-a="sell" data-id="${id}" data-q="all">Tout</button></div>`;
  }
  h += `</div><div class="sec">📈 Cours du marché</div><div class="list">`;
  for (const id in ITEMS) {
    if (!producible().includes(id) && !have(id)) continue;
    h += `<div class="li"><span class="emo">${ITEMS[id].e}</span><div class="grow"><b>${ITEMS[id].n}</b><small>${fmtP(ref(id))} ${trend(G.market[id].h)}</small></div>${spark(G.market[id].h)}</div>`;
  }
  return h + "</div>";
}

function vQuests() {
  let h = `<h2 class="ptitle">🎯 Missions</h2><div class="list">`;
  G.quests.forEach((q, i) => {
    const p = qProg(q), done = p >= q.n;
    h += `<div class="card quest ${done ? "done" : ""}"><span class="emo">${QT[q.k].e}</span><div class="grow"><b>${QT[q.k].t(q.n)}</b>
      ${sbar(p / q.n)}<small>${fmt(p)} / ${fmt(q.n)} · 🎁 ${money(q.money)} · ${q.xp} XP · ${q.gems}💎</small></div>
      ${done ? `<button class="btn sm gold" data-a="claimq" data-i="${i}">Récupérer</button>` : `<button class="mini-btn" data-a="skipq" data-i="${i}" title="Changer">🔄</button>`}</div>`;
  });
  h += `</div><p class="tip">🔄 Changer une mission coûte 1💎.</p>`;
  const got = ACHS.filter(a => G.ach[a.id]).length;
  h += `<div class="sec">🏆 Succès (${got}/${ACHS.length})</div><div class="list">`;
  for (const a of ACHS) h += `<div class="li ${G.ach[a.id] ? "" : "lock"}"><span class="emo">${G.ach[a.id] ? "🏆" : "🔒"}</span><div class="grow"><b>${a.n}</b><small>${a.d}</small></div><b class="dim">${a.g}💎</b></div>`;
  return h + "</div>";
}

const BOOSTS = {
  x2:    { e: "⚡", n: "Boost ×2 pendant 5 min", d: "Tous tes gains sont doublés.", c: 15 },
  rush:  { e: "📣", n: "Promo flash (2 min)", d: "4× plus de clients à la supérette.", c: 6 },
  grow:  { e: "🌧️", n: "Pluie d'engrais", d: "Toutes les cultures en cours sont prêtes.", c: 4 },
  cash:  { e: "💼", n: "Valise de billets", d: "Un gros paquet d'argent immédiat.", c: 10 },
};
const cashPack = () => Math.round(Math.max(400 * Math.pow(G.lvl, 1.6), incomeRate() * 15));
function vShop() {
  let h = `<h2 class="ptitle">💎 Boosts</h2><div class="card gemsbox"><span>💎</span><b>${G.gems}</b><small>Gagne des diamants avec les missions, les succès, les niveaux et le cadeau du jour.</small></div>`;
  if (canDaily()) h += `<button class="daily" data-a="daily"><span>🎁</span><div><b>Cadeau du jour !</b><small>Touche pour l'ouvrir</small></div></button>`;
  h += `<div class="list">`;
  for (const k in BOOSTS) {
    const b = BOOSTS[k];
    if (k === "rush" && !G.biz.superette.own) continue;
    const extra = k === "cash" ? ` (+${money(cashPack())})` : "";
    h += `<div class="card boostc"><span class="emo">${b.e}</span><div class="grow"><b>${b.n}</b><small>${b.d}${extra}</small></div>
      <button class="btn sm gem" data-a="boost" data-k="${k}" ${G.gems >= b.c ? "" : "disabled"}>${b.c} 💎</button></div>`;
  }
  return h + "</div>";
}

function vMore() {
  const s = G.stats;
  const gainStars = prestigeGain();
  let h = `<h2 class="ptitle">⚙️ Plus</h2>`;
  h += `<div class="card savecard"><div class="shtop"><span class="emo">💾</span><div class="grow"><b>Sauvegarde</b>
    <small>${lastSaveOk ? "✅ Automatique toutes les 5 s · dernière " + saveAgo() : "⚠️ Ce navigateur bloque la sauvegarde automatique : garde un fichier ou un code !"}</small></div></div>
    <div class="row"><button class="btn sm gold" data-a="savenow">💾 Sauvegarder</button><button class="btn sm" data-a="savefile">📥 Fichier</button><button class="btn sm" data-a="loadfile">📂 Charger</button></div>
    <small class="dim">« Fichier » enregistre ta partie sur ton téléphone. Pratique pour changer d'appareil ou si tu vides ton navigateur.</small></div>`;
  h += `<div class="card prestige"><div class="center big">🌟</div><b>Prestige</b>
    <small>Revends tout ton empire pour gagner des <b>étoiles d'investisseur</b>. Chaque étoile = <b>+10 % de gains pour toujours</b>. Tu gardes tes diamants et tes succès.</small>
    <small>Étoiles actuelles : <b>${G.stars}</b> (+${G.stars * 10}% de gains)</small>
    ${G.runEarned >= PRESTIGE_MIN
      ? `<button class="btn gold full" data-a="prestige">Revendre l'empire (+${gainStars} 🌟)</button>`
      : `${sbar(G.runEarned / PRESTIGE_MIN)}<small class="dim">Gagne ${money(PRESTIGE_MIN)} dans cette partie pour débloquer (${money(G.runEarned)})</small>`}</div>`;
  h += `<div class="sec">📊 Statistiques</div><div class="card statsg">
    <div><small>Jour</small><b>${G.day}</b></div><div><small>Gains totaux</small><b>${money(s.earned)}</b></div>
    <div><small>Récoltes</small><b>${fmt(s.harvest)}</b></div><div><small>Produits animaux</small><b>${fmt(s.animal)}</b></div>
    <div><small>Ventes magasin</small><b>${fmt(s.sold)}</b></div><div><small>Fabrications</small><b>${fmt(s.craft)}</b></div>
    <div><small>Plats servis</small><b>${fmt(s.served)}</b></div><div><small>Livraisons</small><b>${fmt(s.contracts)}</b></div></div>`;
  h += `<div class="sec">Réglages</div><div class="list">
    <button class="li btnli" data-a="set" data-k="sound"><span class="emo">${G.settings.sound ? "🔊" : "🔇"}</span><div class="grow"><b>Sons</b></div><span class="tag">${G.settings.sound ? "Oui" : "Non"}</span></button>
    <button class="li btnli" data-a="set" data-k="vibe"><span class="emo">📳</span><div class="grow"><b>Vibrations</b></div><span class="tag">${G.settings.vibe ? "Oui" : "Non"}</span></button>
    ${deferredInstall ? `<button class="li btnli" data-a="install"><span class="emo">📲</span><div class="grow"><b>Installer le jeu</b><small>Ajouter sur l'écran d'accueil</small></div></button>` : ""}
    <button class="li btnli" data-a="update"><span class="emo">🔄</span><div class="grow"><b>Mettre à jour le jeu</b><small>Version actuelle : ${VERSION} · ta partie est gardée</small></div></button>
    <button class="li btnli" data-a="help"><span class="emo">❓</span><div class="grow"><b>Comment jouer</b></div></button>
    <button class="li btnli" data-a="export"><span class="emo">💾</span><div class="grow"><b>Code de sauvegarde</b><small>Copier / coller ta partie sous forme de texte</small></div></button>
    <button class="li btnli danger" data-a="reset"><span class="emo">🗑️</span><div class="grow"><b>Recommencer à zéro</b></div></button></div>
    <p class="center dim small">Empire Tycoon · ${VERSION}</p>`;
  return h;
}

const HELP = `
  <p><b>Le but :</b> bâtir l'empire le plus riche possible en reliant tes 6 entreprises.</p>
  <ul class="ul">
  <li>🚜 <b>Ferme</b> : plante, récolte, élève poules et vaches (il faut les nourrir).</li>
  <li>🛒 <b>Supérette</b> : mets tes produits en rayon et choisis ta marge. Les clients achètent tout seuls.</li>
  <li>🏭 <b>Usine</b> : transforme les récoltes en produits qui valent beaucoup plus.</li>
  <li>🍽️ <b>Restaurant</b> : sers les clients avant que leur patience tombe à zéro.</li>
  <li>🚚 <b>Logistique</b> : livre de grosses commandes pour un bonus énorme.</li>
  <li>🏢 <b>Immobilier</b> : achète des biens, touche des loyers chaque matin.</li></ul>
  <p>📈 Les prix du marché bougent chaque jour, des <b>événements</b> changent la donne. Les <b>employés</b> automatisent ton travail mais coûtent un salaire quotidien. Une journée dure 1 min 30.</p>
  <p>🌙 Le jeu continue jusqu'à 3 h quand l'appli est fermée.</p>
  <button class="btn gold full" data-a="close">C'est parti !</button>`;

// ---------- Actions ----------
const A = {
  close: () => closeModal(),
  nav: d => { scr = d.s; $("#main").scrollTop = 0; },
  open: d => { scr = "biz:" + d.b; $("#main").scrollTop = 0; },
  buybiz: d => {
    const b = BIZ[d.b];
    if (G.lvl < b.lvl || !spend(b.cost)) return;
    G.biz[d.b].own = true; sync();
    SFX.level(); vib(50);
    toast(`${b.e} <b>${b.n}</b> ouverte !`, "good");
    scr = "biz:" + d.b;
  },
  upg: d => {
    const b = d.b, o = G.biz[b], n = o.lvl + 1;
    const lines = {
      ferme: [`Parcelles : ${plotCount(o.lvl)} → <b>${plotCount(n)}</b>`, `Vitesse de pousse : +${6 * (n - 1)}%`, `Animaux max : ${animalCap(o.lvl)} → <b>${animalCap(n)}</b>`],
      superette: [`Rayons : ${shelfCount(o.lvl)} → <b>${shelfCount(n)}</b>`, `Taille des rayons : ${shelfCap(o.lvl)} → <b>${shelfCap(n)}</b>`, `Affluence : +${8 * (n - 1)}%`, `Prix de vente : +${3 * (n - 1)}%`],
      usine: [`Chaînes : ${machineCount(o.lvl)} → <b>${machineCount(n)}</b>`, `Vitesse : ×${craftSpeed(o.lvl).toFixed(2)} → <b>×${craftSpeed(n).toFixed(2)}</b>`],
      resto: [`Tables : ${tableCount(o.lvl)} → <b>${tableCount(n)}</b>`, `Prix des plats : +${4 * (n - 1)}%`, `Patience des clients : +${4 * (n - 1)}%`, `Clients plus fréquents`],
      transport: [`Camions : ${truckCount(o.lvl)} → <b>${truckCount(n)}</b>`, `Capacité : ${truckCap(o.lvl)} → <b>${truckCap(n)}</b>`, `Vitesse : +${5 * (n - 1)}%`, `Contrats mieux payés : +${4 * (n - 1)}%`],
      immo: [`Loyers : +${5 * (n - 1)}%`],
    }[b];
    for (const e of EMPS[b]) if (e.lvl === n) lines.push(`${e.e} Nouvel employé : <b>${e.n}</b>`);
    openModal(`⬆️ ${BIZ[b].n} niveau ${n}`, () => `<ul class="ul">${lines.map(x => `<li>${x}</li>`).join("")}</ul>
      <button class="btn gold full" data-a="upgok" data-b="${b}" ${G.money >= upCost(b) ? "" : "disabled"}>Améliorer pour ${money(upCost(b))}</button>`);
  },
  upgok: d => {
    const o = G.biz[d.b];
    if (o.lvl >= MAX_LVL || !spend(upCost(d.b))) return;
    o.lvl++; sync(); closeModal();
    SFX.level(); vib(40);
    toast(`⬆️ ${BIZ[d.b].n} passe au niveau ${o.lvl} !`, "good");
  },
  emp: d => {
    const b = d.b, e = empDef(b, d.e);
    if (!e) return;
    if (E(b, e.id)) { G.biz[b].emps[e.id] = false; toast(`${e.e} ${e.n} renvoyé.`); return; }
    if (hireEmp(b, e.id)) { SFX.coin(); toast(`${e.e} ${e.n} embauché !`, "good"); }
  },

  sel: d => {
    if (CROPS[d.c].lvl > G.lvl) { toast(`🔒 Débloqué au niveau ${CROPS[d.c].lvl}`); return; }
    G.biz.ferme.sel = d.c;
  },
  plot: d => {
    const i = +d.i, p = G.biz.ferme.plots[i];
    if (!p.c) { p.hold = G.t + 60; openModal(`🌱 Que planter sur le champ ${i + 1} ?`, cropPicker(i)); }
    else if (p.ready) { const c = p.c, n = harvest(i); floatTxt(`+${n} ${ITEMS[c].e}`, "good"); SFX.coin(); }
    else openModal("🌱 En train de pousser", () => `<p class="center">Encore <b>${fmtT(p.end - G.t)}</b> avant la récolte.</p>
      <button class="btn gem full" data-a="skip" data-k="p" data-i="${i}">⚡ Finir maintenant · ${skipCost(p.end)} 💎</button>
      <button class="btn ghost full" data-a="uproot" data-i="${i}">🪓 Arracher pour planter autre chose (graine perdue)</button>`);
  },
  plantc: d => {
    const f = G.biz.ferme, c = d.c;
    if (CROPS[c].lvl > G.lvl) return;
    f.sel = c;
    if (d.i === "all") {
      let n = 0;
      f.plots.forEach((p, i) => { if (!p.c && plant(i, c, true)) n++; });
      if (n) floatTxt(`${ITEMS[c].e} ×${n}`, "good"); else spend(CROPS[c].seed);
      if (n && f.plots.some(p => !p.c)) toast("💸 Plus assez d'argent pour planter tous les champs");
    } else {
      const p = f.plots[+d.i];
      if (p.c && p.c !== c) { p.c = null; p.ready = false; }
      if (!p.c && plant(+d.i, c)) { p.last = c; floatTxt(ITEMS[c].e, "good"); }
      p.hold = 0;
    }
    closeModal();
  },
  uproot: d => {
    const p = G.biz.ferme.plots[+d.i];
    if (!p.c) return closeModal();
    p.c = null; p.ready = false; p.hold = G.t + 60;
    closeModal(); openModal(`🌱 Que planter sur le champ ${+d.i + 1} ?`, cropPicker(+d.i));
  },
  replant: () => { const f = G.biz.ferme; f.replant = f.replant === false; toast(f.replant ? "🔁 Les champs replantent leur culture" : "✋ Tu choisis la culture à chaque récolte"); },
  plantall: () => openModal("🌱 Planter tous les champs vides", cropPicker("all")),
  harvall: () => {
    const f = G.biz.ferme; let n = 0;
    f.plots.forEach((p, i) => { if (p.ready) n += harvest(i); });
    if (n) { floatTxt(`+${n} récoltés`, "good"); SFX.coin(); vib(25); }
  },
  buyani: d => {
    const a = G.biz.ferme.animals[d.k];
    if (a.n >= animalCap()) return toast("🏚️ Plus de place : améliore la ferme");
    if (!spend(animalCost(d.k))) return;
    a.n++; floatTxt(ANIMALS[d.k].e + " +1");
  },
  colani: d => { const n = collectAnimal(d.k); if (n) { floatTxt(`+${n} ${ITEMS[ANIMALS[d.k].out].e}`, "good"); SFX.coin(); } },
  fill: d => {
    const i = +d.i;
    openModal("📦 Choisir un produit", () => {
      const ids = Object.keys(ITEMS).filter(id => have(id) > 0);
      if (!ids.length) return `<p class="center">Ton stock est vide. Récolte à la ferme ou passe par le grossiste !</p><button class="btn full" data-a="grossiste">🏬 Grossiste</button>`;
      return `<div class="list">${ids.map(id => `<button class="li btnli" data-a="fillwith" data-i="${i}" data-id="${id}"><span class="emo">${ITEMS[id].e}</span><div class="grow"><b>${ITEMS[id].n}</b><small>${have(id)} en stock · cours ${fmtP(ref(id))}</small></div></button>`).join("")}</div>`;
    });
  },
  fillwith: d => {
    const sh = G.biz.superette.shelves[+d.i];
    if (sh.item) { add(sh.item, sh.qty); }
    sh.item = d.id; sh.qty = 0; restock(sh); closeModal();
  },
  refill: d => { const n = restock(G.biz.superette.shelves[+d.i]); if (n) floatTxt(`📦 +${n}`); },
  unshelf: d => { const sh = G.biz.superette.shelves[+d.i]; if (sh.item) add(sh.item, sh.qty); sh.item = null; sh.qty = 0; },
  mk: d => { G.biz.superette.shelves[+d.i].mk = parseFloat(d.m); },
  grossiste: () => openModal("🏬 Grossiste", () => {
    const ids = Object.keys(ITEMS).filter(id => producible().includes(id) || Object.values(ANIMALS).some(a => a.out === id && a.lvl <= G.lvl));
    return `<p class="tip">Le grossiste vend 15 % au-dessus du cours. Pratique pour démarrer, mais produire toi-même rapporte bien plus !</p>
      <div class="list">${ids.map(id => { const p = ref(id) * 1.15; return `<div class="li"><span class="emo">${ITEMS[id].e}</span><div class="grow"><b>${ITEMS[id].n}</b><small>${fmtP(p)} / u · stock ${have(id)}</small></div>
      <button class="btn sm" data-a="gbuy" data-id="${id}" data-q="10">×10<small>${money(p * 10)}</small></button>
      <button class="btn sm" data-a="gbuy" data-id="${id}" data-q="50">×50<small>${money(p * 50)}</small></button></div>`; }).join("")}</div>`;
  }),
  gbuy: d => {
    const q = +d.q, cost = Math.round(ref(d.id) * 1.15 * q);
    if (!spend(cost)) return;
    add(d.id, q); toast(`🏬 +${q} ${ITEMS[d.id].e} achetés`); refreshModal();
  },
  pickrec: d => { G.biz.usine.machines[+d.i].hold = G.t + 60; openModal(`⚙️ Chaîne ${+d.i + 1} : que produire ?`, recipeModal(+d.i)); },
  mach: d => { G.biz.usine.machines[+d.i].hold = G.t + 60; openModal(`🔄 Changer la chaîne ${+d.i + 1}`, recipeModal(+d.i)); },
  startrec: d => {
    const i = +d.i, m = G.biz.usine.machines[i];
    if (m.r) stopMachine(i);
    if (startRecipe(i, d.r)) { m.hold = 0; closeModal(); floatTxt(ITEMS[d.r].e, "good"); toast(`⚙️ Chaîne ${i + 1} : ${ITEMS[d.r].n}`); }
  },
  stopm: d => {
    const i = +d.i, m = G.biz.usine.machines[i];
    stopMachine(i); m.last = null; m.hold = 0;
    closeModal(); toast(`⏹️ Chaîne ${i + 1} arrêtée, ingrédients rendus`);
  },
  colm: d => { const r = collectMachine(+d.i); if (r) { floatTxt(`+1 ${ITEMS[r].e}`, "good"); SFX.coin(); } },
  skip: d => {
    const i = +d.i;
    const o = d.k === "p" ? G.biz.ferme.plots[i] : d.k === "m" ? G.biz.usine.machines[i] : G.biz.transport.trucks[i];
    if (!o || o.end <= G.t) { closeModal(); return; }
    if (!spendGems(skipCost(o.end))) return;
    o.end = G.t; closeModal(); tick(0);
    floatTxt("⚡", "gem");
  },
  serve: d => { if (serve(+d.o)) { SFX.coin(); vib(25); } },
  accept: d => { acceptContract(G.biz.transport.contracts.find(x => x.id === d.c)); },

  refreshc: () => { if (!spendGems(2)) return; G.biz.transport.contracts = []; sync(); toast("🔄 Nouveaux contrats !"); },
  buyprop: d => { if (!spend(Math.round(propPrice(d.p)))) return; G.biz.immo.props[d.p]++; SFX.coin(); toast(`${PROPS[d.p].e} ${PROPS[d.p].n} acheté !`, "good"); },
  sellprop: d => {
    const im = G.biz.immo; if (!im.props[d.p]) return;
    im.props[d.p]--; gain(propSell(d.p), { raw: true, float: true }); SFX.coin();
  },
  sell: d => {
    const q = d.q === "all" ? have(d.id) : Math.min(+d.q, have(d.id));
    if (q <= 0) return;
    G.inv[d.id] -= q; gain(ref(d.id) * 0.7 * q, { float: true }); SFX.coin();
  },
  claimq: d => {
    const q = G.quests[+d.i];
    if (!q || qProg(q) < q.n) return;
    gain(q.money, { float: true }); G.gems += q.gems; addXP(q.xp);
    G.quests.splice(+d.i, 1); G.quests.push(genQuest());
    SFX.coin(); vib(40); toast(`🎯 Mission accomplie ! +${q.gems}💎`, "good");
  },
  skipq: d => { if (!spendGems(1)) return; G.quests.splice(+d.i, 1); G.quests.push(genQuest()); },
  daily: () => {
    if (!canDaily()) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    G.daily.streak = G.daily.last === dayKey(y) ? G.daily.streak + 1 : 1;
    G.daily.last = dayKey();
    const r = dailyReward(G.daily.streak);
    gain(r.money, { raw: true }); G.gems += r.gems;
    SFX.level(); vib(60);
    openModal("🎁 Cadeau du jour", () => `<div class="center big">🎁</div>
      <p class="center">Jour <b>${G.daily.streak}</b> de ta série !</p>
      <p class="center big2">+${money(r.money)} · +${r.gems} 💎</p>
      <p class="center dim">Reviens demain pour un cadeau encore plus gros (gros bonus tous les 7 jours).</p>
      <button class="btn gold full" data-a="close">Merci !</button>`);
  },
  boost: d => {
    const b = BOOSTS[d.k];
    if (!spendGems(b.c)) return;
    if (d.k === "x2") G.boostUntil = Math.max(G.t, G.boostUntil) + 300;
    if (d.k === "rush") G.rushUntil = Math.max(G.t, G.rushUntil) + 120;
    if (d.k === "grow") G.biz.ferme.plots.forEach(p => { if (p.c) p.end = G.t; });
    if (d.k === "cash") gain(cashPack(), { raw: true, float: true });
    SFX.level(); toast(`${b.e} ${b.n} activé !`, "good");
  },
  prestige: () => openModal("🌟 Revendre l'empire ?", () => `<p>Tu vas repartir de zéro avec <b>+${prestigeGain()} étoile(s)</b>.</p>
      <p>Tu gardes : 💎 diamants, 🏆 succès, 🌟 étoiles, statistiques.</p>
      <button class="btn gold full" data-a="prestigeok">Confirmer le prestige</button><button class="btn ghost full" data-a="close">Annuler</button>`),
  prestigeok: () => {
    const gainS = prestigeGain();
    const keep = G; G = newState(keep); G.stars += gainS; G.prestiges++;
    sync(); closeModal(); scr = "home"; SFX.level();
    toast(`🌟 Nouveau départ avec ${G.stars} étoile(s) : +${G.stars * 10}% de gains !`, "good");
  },
  set: d => { G.settings[d.k] = !G.settings[d.k]; },
  install: async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; dirty = true; },
  update: async () => {
    save();
    toast("🔄 Recherche de la dernière version…");
    try {
      if (swReg) await swReg.update();
      if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
    } catch (e) {}
    setTimeout(() => location.reload(), 600);
  },
  help: () => openModal("❓ Comment jouer", () => HELP),
  savenow: () => { if (save()) { toast("💾 Partie sauvegardée !", "good"); SFX.coin(); } else toast("⚠️ Sauvegarde impossible ici : utilise « Fichier »", "bad"); },
  savefile: () => {
    save();
    const d = new Date(), stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const blob = new Blob([JSON.stringify(G)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `empire-tycoon-${stamp}-niv${G.lvl}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast("📥 Fichier de sauvegarde créé (dossier Téléchargements)", "good");
  },
  loadfile: () => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".json,application/json,text/plain";
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const txt = String(rd.result).trim();
          const d = txt.startsWith("{") ? JSON.parse(txt) : JSON.parse(decodeURIComponent(escape(atob(txt))));
          openModal("📂 Charger cette partie ?", () => `<p class="center">Niveau <b>${d.lvl}</b> · <b>${money(d.money)}</b> · jour ${d.day}</p>
            <p class="center dim">Ta partie actuelle (niveau ${G.lvl}) sera remplacée.</p>
            <button class="btn gold full" data-a="loadok">Charger</button><button class="btn ghost full" data-a="close">Annuler</button>`);
          pendingLoad = d;
        } catch (e) { toast("❌ Ce fichier n'est pas une sauvegarde Empire Tycoon", "bad"); SFX.err(); }
      };
      rd.readAsText(f);
    };
    inp.click();
  },
  loadok: () => { try { importData(pendingLoad); } catch (e) { toast("❌ Sauvegarde invalide", "bad"); } pendingLoad = null; },
  export: () => openModal("💾 Code de sauvegarde", () => {
    save();
    const code = saveCode();
    return `<p class="small">Copie ce code et garde-le. Sur un autre appareil, colle-le puis touche « Importer ».</p>
      <textarea id="saveCode" rows="5">${code}</textarea>
      <div class="row"><button class="btn" data-a="copysave">📋 Copier</button><button class="btn gold" data-a="importsave">📥 Importer</button></div>`;
  }),
  copysave: () => {
    const t = $("#saveCode"); t.select();
    try { navigator.clipboard.writeText(t.value).then(() => toast("📋 Code copié !"), () => toast("Code sélectionné : copie-le avec un appui long")); }
    catch (e) { toast("Code sélectionné : copie-le avec un appui long"); }
  },
  importsave: () => {
    try {
      const txt = $("#saveCode").value.trim();
      importData(txt.startsWith("{") ? JSON.parse(txt) : JSON.parse(decodeURIComponent(escape(atob(txt)))));
    } catch (e) { toast("❌ Code invalide", "bad"); }
  },
  reset: () => openModal("🗑️ Tout recommencer ?", () => `<p>Ta partie sera <b>définitivement</b> effacée (y compris diamants et étoiles).</p>
      <button class="btn danger full" data-a="resetok">Oui, tout effacer</button><button class="btn ghost full" data-a="close">Annuler</button>`),
  resetok: () => { localStorage.removeItem(SAVE_KEY); G = newState(); sync(); closeModal(); scr = "home"; A.help(); G.welcomed = true; },
};

// ---------- Rendu ----------
const VIEWS = { home: vHome, stock: vStock, quests: vQuests, shop: vShop, more: vMore,
  "biz:ferme": vFerme, "biz:superette": vSuperette, "biz:usine": vUsine, "biz:resto": vResto, "biz:transport": vTransport, "biz:immo": vImmo };
let pressing = false, lastRender = 0, lastHtml = "";
function render(force) {
  if (!force && (pressing || Date.now() - lastRender < 350)) return;
  lastRender = Date.now();
  dirty = false;
  const main = $("#main");
  const html = (VIEWS[scr] || vHome)();
  if (html !== lastHtml || force) {
    const st = main.scrollTop;
    main.innerHTML = html; lastHtml = html;
    main.scrollTop = st;
  }
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.s === scr || (b.dataset.s === "home" && scr.startsWith("biz:"))));
  const qr = questsReady();
  $("#qBadge").textContent = qr || ""; $("#qBadge").style.display = qr ? "" : "none";
  $("#sBadge").style.display = canDaily() ? "" : "none";
  updTimers();
}
function hud() {
  $("#hMoney").textContent = money(G.money);
  $("#hGems").textContent = G.gems;
  $("#hLvl").textContent = G.lvl;
  $("#hXp").style.width = (G.xp / xpNeed(G.lvl) * 100) + "%";
  const dp = (G.t % DAY) / DAY;
  const hh = Math.floor(6 + dp * 16), mm = Math.floor((6 + dp * 16) % 1 * 60);
  $("#hDay").textContent = `Jour ${G.day} · ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  $("#hSun").textContent = dp < 0.75 ? "☀️" : "🌙";
  $("#hEv").textContent = G.events.map(e => EVENTS[e.id].e).join(" ") + (G.t < G.boostUntil ? " ⚡" : "") + (G.stars ? ` 🌟${G.stars}` : "");
}
function updTimers() {
  document.querySelectorAll("[data-end]").forEach(el => {
    const s = +el.dataset.start, e = +el.dataset.end;
    let p = clamp((G.t - s) / (e - s || 1), 0, 1);
    if (el.dataset.rev) p = 1 - p;
    const bar = el.firstElementChild; if (bar) bar.style.width = p * 100 + "%";
    if (el.dataset.rev) el.classList.toggle("hurry", p < 0.3);
    const tx = el.querySelector("span"); if (tx) tx.textContent = fmtT(e - G.t);
  });
  document.querySelectorAll("[data-anim]").forEach(el => {
    const k = el.dataset.anim, a = G.biz.ferme.animals[k];
    el.firstElementChild.style.width = clamp(a.acc / ANIMALS[k].period, 0, 1) * 100 + "%";
  });
}

// ---------- Démarrage ----------
let deferredInstall = null, pendingLoad = null, swReg = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; dirty = true; });

document.addEventListener("pointerdown", e => { lastXY = [e.clientX, e.clientY]; pressing = true; }, true);
document.addEventListener("pointerup", () => setTimeout(() => (pressing = false), 60), true);
document.addEventListener("pointercancel", () => (pressing = false), true);
document.addEventListener("click", e => {
  if (e.target.id === "modal") { closeModal(); return; }
  const el = e.target.closest("[data-a]");
  pressing = false;
  if (!el || el.disabled) return;
  const fn = A[el.dataset.a];
  if (!fn) return;
  SFX.tap(); vib(8);
  fn(el.dataset, el);
  dirty = true;
  render(true);
  if (modalFn && el.closest("#modal") && !["close"].includes(el.dataset.a)) refreshModal();
});

let lastReal = Date.now(), secAcc = 0, lastSave = Date.now();
function frame() {
  if (document.hidden) return;
  const now = Date.now();
  const dt = (now - lastReal) / 1000;
  lastReal = now;
  if (dt > 5) {
    const r = catchUp(dt);
    if (r.sec > 60) offlineReport(r);
  } else tick(dt);
  hud(); updTimers();
  secAcc += dt;
  if (secAcc >= 1) {
    secAcc = 0; checkAch();
    if (scr === "home" || scr === "quests" || scr === "more" || scr === "biz:immo") dirty = true;
  }
  if (dirty) render();
  if (now - lastSave > 5000) { lastSave = now; save(); }
}
function offlineReport(r) {
  openModal("🌙 Bon retour, patron !", () => `<p class="center">Tu étais absent <b>${fmtT(r.sec)}</b>.</p>
    <p class="center big2 ${r.earned >= 0 ? "good" : "bad"}">${r.earned >= 0 ? "+" : ""}${money(r.earned)}</p>
    <p class="center dim">Tes cultures ont poussé, tes clients ont acheté et tes loyers sont tombés.</p>
    <button class="btn gold full" data-a="close">Au travail !</button>`);
}

function init() {
  const had = load();
  sync();
  if (had) {
    const away = (Date.now() - G.ts) / 1000;
    if (away > 5) { const r = catchUp(away); if (r.sec > 60) offlineReport(r); }
  }
  lastReal = Date.now();
  hud(); render(true);
  if (!G.welcomed) { G.welcomed = true; openModal("👋 Bienvenue dans Empire Tycoon !", () => HELP); }
  setInterval(frame, 100);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
  window.addEventListener("pagehide", save);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then(r => { swReg = r; r.update().catch(() => {}); }).catch(() => {});
    // Quand une nouvelle version prend la main, on recharge une fois pour l'afficher
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloaded || !hadController) return; reloaded = true; save(); location.reload(); });
    var hadController = !!navigator.serviceWorker.controller;
  }
}
document.addEventListener("DOMContentLoaded", init);
