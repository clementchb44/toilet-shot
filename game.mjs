// ===== CAMBRIOLEUR : logique (génération de pièces, IA, simulation) =====
export const TILE = 40, GW = 20, GH = 12, PW = GW*TILE, PH = GH*TILE;
export const T = {FLOOR:0, WALL:1, LOW:2, DOOR:3, TALL:4};
export const SAVE_KEY = 'cambrio-save-v1';
export const MAX_TIER = 30;
export function rngFor(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- Butin ----------
export const LOOT = {
  watch:{emoji:'⌚', nom:'Montre', size:'s', v:[60,110]}, ring:{emoji:'💍', nom:'Bague', size:'s', v:[90,160]}, gem:{emoji:'💎', nom:'Diamant', size:'s', v:[140,240]},
  neck:{emoji:'📿', nom:'Collier', size:'s', v:[70,120]}, phone:{emoji:'📱', nom:'Téléphone', size:'s', v:[50,90]}, cash:{emoji:'💵', nom:'Liasse', size:'s', v:[40,80]},
  wine:{emoji:'🍷', nom:'Vin rare', size:'s', v:[80,140]}, coin:{emoji:'🪙', nom:'Pièces d’or', size:'s', v:[30,60]},
  laptop:{emoji:'💻', nom:'Ordinateur', size:'m', v:[200,340]}, console:{emoji:'🎮', nom:'Console', size:'m', v:[150,260]}, camera:{emoji:'📷', nom:'Appareil photo', size:'m', v:[120,210]},
  vase:{emoji:'🏺', nom:'Vase ancien', size:'m', v:[250,420]}, paint:{emoji:'🖼️', nom:'Tableau', size:'m', v:[300,500]}, guitar:{emoji:'🎸', nom:'Guitare', size:'m', v:[220,380]},
  bag:{emoji:'💰', nom:'Sac d’argent', size:'m', v:[260,420]}, crown:{emoji:'👑', nom:'Couronne', size:'m', v:[400,650]}, trophy:{emoji:'🏆', nom:'Trophée', size:'m', v:[280,460]},
  tv:{emoji:'📺', nom:'Télé géante', size:'l', v:[400,650]}, statue:{emoji:'🗿', nom:'Statue', size:'l', v:[600,950]}, gold:{emoji:'🥇', nom:'Lingot d’or', size:'l', v:[700,1000]},
  mask:{emoji:'🎭', nom:'Sculpture', size:'l', v:[550,900]}, case:{emoji:'🧳', nom:'Mallette du coffre', size:'l', v:[1200,2400]},
};
export const SIZE = { s:{slots:1, grab:.6, noise:45}, m:{slots:2, grab:1.2, noise:90}, l:{slots:3, grab:2.2, noise:150}, n:{slots:0, grab:.4, noise:0} };
// ---------- Thèmes ----------
export const THEMES = [
  {id:'salon', nom:'Appartement', floor:['#f3d9a8','#ecca90'], wall:'#6b4a9a', trim:'#a37ad8', loot:['phone','watch','laptop','console','camera','tv','paint','guitar','ring','cash'], furn:[['sofa',3,1,3],['table',2,1,2],['shelf',2,1,2],['plant',1,1,2],['desk',2,1,1],['crate',1,1,1]]},
  {id:'bijou', nom:'Bijouterie', floor:['#f4f4fb','#e1e1f0'], wall:'#1f6f8b', trim:'#57c7e6', loot:['gem','ring','neck','watch','crown','gem','ring','coin','trophy'], furn:[['case',3,1,4],['case',2,1,2],['desk',2,1,1],['plant',1,1,1],['pillar',1,1,1]]},
  {id:'musee', nom:'Musée', floor:['#f0e6d2','#e2d4b8'], wall:'#8a3d3d', trim:'#e08a7a', loot:['vase','paint','statue','mask','trophy','crown','vase','paint','coin'], furn:[['pillar',1,1,3],['case',2,1,3],['sofa',3,1,1],['plant',1,1,2]]},
  {id:'banque', nom:'Banque', floor:['#d8e8d0','#c6dcbd'], wall:'#2f6b4a', trim:'#6fcf97', loot:['cash','bag','coin','gold','bag','watch','gem','cash'], furn:[['desk',3,1,3],['desk',2,1,2],['crate',1,1,2],['plant',1,1,1],['shelf',2,1,1]]},
  {id:'villa', nom:'Villa de luxe', floor:['#ffe3ee','#f7cfe0'], wall:'#b33d6b', trim:'#ff86ad', loot:['wine','guitar','tv','paint','neck','crown','statue','laptop','watch','vase'], furn:[['piano',3,2,1],['sofa',3,1,2],['table',2,2,2],['plant',1,1,2],['shelf',2,1,2]]},
];
export const FURN = { sofa:{tall:false}, table:{tall:false}, shelf:{tall:true}, plant:{tall:false}, case:{tall:false}, desk:{tall:false}, piano:{tall:false}, pillar:{tall:true}, crate:{tall:false}, safe:{tall:false} };

// ---------- Utilitaires de grille ----------
export const tileAt = (room, x, y) => { const tx = Math.floor(x/TILE), ty = Math.floor(y/TILE); return tx < 0 || ty < 0 || tx >= GW || ty >= GH ? T.WALL : room.tiles[ty][tx]; };
export const solidMove = tp => tp === T.WALL || tp === T.LOW || tp === T.TALL;
export const solidSight = tp => tp === T.WALL || tp === T.TALL;
export function bfs(room, sx, sy, goal = null) {
  const prev = new Map(), q = [[sx, sy]], key = (x, y) => y*GW + x; prev.set(key(sx, sy), null);
  for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; if (goal && x === goal[0] && y === goal[1]) break;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue; const k = key(nx, ny); if (prev.has(k) || solidMove(room.tiles[ny][nx])) continue; prev.set(k, key(x, y)); q.push([nx, ny]); } }
  return {prev, order:q};
}
export function pathTo(room, sx, sy, gx, gy) {
  if (sx === gx && sy === gy) return [];
  const {prev} = bfs(room, sx, sy, [gx, gy]), gk = gy*GW + gx; if (!prev.has(gk)) return null;
  const out = []; for (let k = gk; k !== null && k !== sy*GW + sx; k = prev.get(k)) out.push([k % GW, Math.floor(k/GW)]); return out.reverse();
}
export function los(room, x0, y0, x1, y1) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d/6); for (let i = 1; i < n; i++) { const f = i/n; if (solidSight(tileAt(room, x0 + (x1 - x0)*f, y0 + (y1 - y0)*f))) return false; } return true; }
export function rayDist(room, x, y, ang, max) { const cx = Math.cos(ang), cy = Math.sin(ang); for (let d = 4; d < max; d += 5) if (solidSight(tileAt(room, x + cx*d, y + cy*d))) return d; return max; }
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2*Math.PI; while (d < -Math.PI) d += 2*Math.PI; return d; };
export { angDiff };

// ---------- Génération d'une pièce ----------
export function difficulty(tier) { return {guards: Math.min(4, 1 + Math.floor(tier/4)), cams: Math.min(5, Math.max(0, Math.floor((tier - 1)/2))), dogs: tier < 4 ? 0 : tier < 10 ? 1 : 2, safes: tier < 2 ? 0 : tier < 9 ? 1 : 2, loot: Math.min(11, 6 + Math.floor(tier/3)), walls: tier >= 5 ? (tier >= 14 ? 2 : 1) : 0, furn: 8 + Math.min(6, Math.floor(tier/3))}; }
export function generateRoom(tier, seed) {
  for (let attempt = 0; attempt < 60; attempt++) { const r = tryRoom(tier, rngFor(seed + attempt*977)); if (r) { r.seed = seed; return r; } }
  throw Error('génération impossible');
}
function tryRoom(tier, rng) {
  const D = difficulty(tier), theme = THEMES[Math.floor(rng()*THEMES.length)], pick = arr => arr[Math.floor(rng()*arr.length)];
  const tiles = Array.from({length:GH}, (_, y) => Array.from({length:GW}, (_, x) => x === 0 || y === 0 || x === GW-1 || y === GH-1 ? T.WALL : T.FLOOR));
  const room = {tiles, theme, tier, furniture:[], loot:[], safes:[], notes:[], guards:[], dogs:[], cams:[]};
  const dx = 3 + Math.floor(rng()*(GW - 6)); room.door = {x:dx, y:GH-1}; tiles[GH-1][dx] = T.DOOR; room.start = {x:(dx + .5)*TILE, y:(GH - 1.5)*TILE};
  // cloisons
  const wallXs = [];
  for (let i = 0; i < D.walls; i++) { const x = i === 0 ? 7 + Math.floor(rng()*6) : (wallXs[0] < 10 ? 14 : 5); if (wallXs.some(w => Math.abs(w - x) < 4)) continue; wallXs.push(x); const gap = 2 + Math.floor(rng()*(GH - 6));
    for (let y = 1; y < GH-1; y++) if (y < gap || y > gap + 2) tiles[y][x] = T.WALL; }
  // meubles
  const free = (x, y, w, h) => { for (let j = y - 1; j <= y + h; j++) for (let i = x - 1; i <= x + w; i++) { if (i < 0 || j < 0 || i >= GW || j >= GH) continue; const tp = tiles[j][i]; if (tp !== T.FLOOR && !(i < x || i >= x + w || j < y || j >= y + h)) return false; if ((i >= x && i < x + w && j >= y && j < y + h) && tp !== T.FLOOR) return false; } return true; };
  const bag = theme.furn.flatMap(f => Array(f[3]).fill(f));
  for (let k = 0, placed = 0; k < 80 && placed < D.furn; k++) {
    const f = pick(bag), rot = f[1] !== f[2] && rng() < .5, w = rot ? f[2] : f[1], h = rot ? f[1] : f[2], x = 1 + Math.floor(rng()*(GW - 1 - w)), y = 1 + Math.floor(rng()*(GH - 1 - h));
    if (Math.abs(x + w/2 - (dx + .5)) < 3 && y + h >= GH - 3) continue; // dégager l'entrée
    let ok = true; for (let j = y; j < y + h && ok; j++) for (let i = x; i < x + w; i++) if (tiles[j][i] !== T.FLOOR) ok = false; if (!ok) continue;
    // marge d'au moins 1 case libre autour (couloirs)
    for (let j = y - 1; j <= y + h && ok; j++) for (let i = x - 1; i <= x + w; i++) { if (i < 1 || j < 1 || i >= GW-1 || j >= GH-1) continue; if (i >= x && i < x + w && j >= y && j < y + h) continue; if (tiles[j][i] !== T.FLOOR && tiles[j][i] !== T.WALL) ok = false; }
    if (!ok) continue;
    const tall = FURN[f[0]].tall; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) tiles[j][i] = tall ? T.TALL : T.LOW;
    room.furniture.push({kind:f[0], x, y, w, h}); placed++;
  }
  // zone atteignable
  const sx = Math.floor(room.start.x/TILE), sy = Math.floor(room.start.y/TILE), {prev, order} = bfs(room, sx, sy);
  const reach = order.map(([x, y]) => ({x, y})); const totalFree = tiles.flat().filter(t => t === T.FLOOR).length;
  if (reach.length < totalFree*0.97 || reach.length < 90) return null;
  for (let y = 1; y < GH-1; y++) for (let x = 1; x < GW-1; x++) if (tiles[y][x] === T.FLOOR && !prev.has(y*GW + x)) return null;
  const far = (c, minD) => Math.hypot(c.x - sx, c.y - sy) >= minD, used = [];
  const takeTile = (minD, pred = () => true, tries = 200) => { for (let i = 0; i < tries; i++) { const c = reach[Math.floor(rng()*reach.length)]; if (tiles[c.y][c.x] !== T.FLOOR || !far(c, minD) || used.some(u => Math.hypot(u.x - c.x, u.y - c.y) < 2) || !pred(c)) continue; used.push(c); return c; } return null; };
  const nearBlock = c => [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => { const tp = tiles[c.y + b]?.[c.x + a]; return tp === T.LOW || tp === T.TALL || tp === T.WALL; });
  // coffres (dans le décor, contre un mur)
  for (let i = 0; i < D.safes; i++) { const c = takeTile(5, c2 => [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => tiles[c2.y + b]?.[c2.x + a] === T.WALL) && c2.y > 1 && c2.y < GH-2); if (!c) return null;
    tiles[c.y][c.x] = T.LOW; room.furniture.push({kind:'safe', x:c.x, y:c.y, w:1, h:1}); const code = [0,0,0].map(() => Math.floor(rng()*10)); room.safes.push({x:c.x, y:c.y, code, opened:false, note:rng() < .85, id:i});
    // vérifier que le coffre reste accessible
    if (!bfs(room, sx, sy).prev.has((c.y + 1)*GW + c.x) && ![[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => bfs(room, sx, sy).prev.has((c.y + b)*GW + c.x + a))) return null; }
  for (const s of room.safes) if (s.note) { const c = takeTile(3); if (!c) return null; room.notes.push({x:(c.x + .5)*TILE, y:(c.y + .5)*TILE, safe:s.id, taken:false}); }
  // butin
  const mult = 1 + 0.06*(tier - 1), bigChance = Math.min(.5, .12 + tier*.02);
  for (let i = 0; i < D.loot; i++) { const c = takeTile(4, c2 => nearBlock(c2) || rng() < .5); if (!c) return null; let id = pick(theme.loot);
    for (let t = 0; t < 4; t++) { const sz = LOOT[id].size; if (sz === 'l' && rng() > bigChance) id = pick(theme.loot); else break; }
    const def = LOOT[id]; room.loot.push({x:(c.x + .5)*TILE, y:(c.y + .5)*TILE, id, value:Math.round((def.v[0] + rng()*(def.v[1] - def.v[0]))*mult/5)*5, taken:false}); }
  // gardes
  for (let i = 0; i < D.guards; i++) { const a = takeTile(7); if (!a) return null; const wps = [a]; for (let k = 0; k < 2 + Math.floor(rng()*2); k++) { const b = takeTile(4); if (b) wps.push(b); }
    room.guards.push({wps:wps.map(c => [c.x, c.y]), x:(a.x + .5)*TILE, y:(a.y + .5)*TILE}); }
  for (let i = 0; i < D.dogs; i++) { const a = takeTile(7); if (!a) return null; const b = takeTile(5); room.dogs.push({x:(a.x + .5)*TILE, y:(a.y + .5)*TILE, sleeping:rng() < .6, wps:[[a.x, a.y], ...(b ? [[b.x, b.y]] : [])]}); }
  // caméras : posées contre un mur, orientées vers l'intérieur
  const camSpots = []; for (const c of reach) { if (tiles[c.y][c.x] !== T.FLOOR || !far(c, 6)) continue; for (const [a, b, ang] of [[0,-1,Math.PI/2],[-1,0,0],[1,0,Math.PI],[0,1,-Math.PI/2]]) if (tiles[c.y + b]?.[c.x + a] === T.WALL) camSpots.push({x:c.x, y:c.y, base:ang}); }
  for (let i = 0; i < D.cams && camSpots.length; i++) { const s = camSpots.splice(Math.floor(rng()*camSpots.length), 1)[0]; room.cams.push({x:(s.x + .5)*TILE + Math.cos(s.base + Math.PI)*14, y:(s.y + .5)*TILE + Math.sin(s.base + Math.PI)*14, base:s.base, sweep:.9 + rng()*.4, speed:.5 + rng()*.35, phase:rng()*6.28, range:200, half:.42}); }
  // vérification finale : tout le sol libre reste atteignable (les coffres n'ont rien isolé)
  const fin = bfs(room, sx, sy).prev; for (let y = 1; y < GH-1; y++) for (let x = 1; x < GW-1; x++) if (tiles[y][x] === T.FLOOR && !fin.has(y*GW + x)) return null;
  return room;
}

// ---------- Améliorations & style ----------
export const UPGRADES = [
  {id:'speed', nom:'Chaussons de sport', icone:'👟', desc:'+7 % de vitesse par niveau', max:5, base:200},
  {id:'quiet', nom:'Semelles silencieuses', icone:'🤫', desc:'−14 % de bruit par niveau', max:5, base:250},
  {id:'grab', nom:'Doigts de fée', icone:'🧤', desc:'Vol 10 % plus rapide par niveau', max:5, base:150},
  {id:'bag', nom:'Grand sac', icone:'🎒', desc:'+1 place dans le sac par niveau', max:4, base:300},
  {id:'emp', nom:'Brouilleur de caméras', icone:'📡', desc:'1 charge par niveau : coupe les caméras 8 s', max:3, base:600},
];
export const upCost = (u, lvl) => Math.round(u.base*Math.pow(1.9, lvl)/10)*10;
export const statsOf = up => ({speed:1 + .07*(up.speed||0), noise:1 - .14*(up.quiet||0), grab:1 - .1*(up.grab||0), cap:5 + (up.bag||0), emp:up.emp||0});
export const CATS = [{id:'tenue', nom:'Tenue'}, {id:'gants', nom:'Gants'}, {id:'masque', nom:'Masque'}];
export const SKINS = [
  {id:'t_noir', cat:'tenue', nom:'Tout noir', prix:0, c:'#262633'}, {id:'t_raye', cat:'tenue', nom:'Rayé', prix:120, c:'stripe'}, {id:'t_rouge', cat:'tenue', nom:'Rouge ninja', prix:200, c:'#d8333b'},
  {id:'t_bleu', cat:'tenue', nom:'Bleu nuit', prix:200, c:'#2f4fd8'}, {id:'t_vert', cat:'tenue', nom:'Vert camouflage', prix:350, c:'#3a8a4a'}, {id:'t_rose', cat:'tenue', nom:'Rose bonbon', prix:500, c:'#ff5fa8'}, {id:'t_or', cat:'tenue', nom:'Doré', prix:2500, c:'#f2b72a'}, {id:'t_arc', cat:'tenue', nom:'Arc-en-ciel', prix:4000, c:'rainbow'},
  {id:'g_noir', cat:'gants', nom:'Noirs', prix:0, c:'#111'}, {id:'g_rouge', cat:'gants', nom:'Rouges', prix:80, c:'#e23a3a'}, {id:'g_vert', cat:'gants', nom:'Verts', prix:80, c:'#39c46a'}, {id:'g_jaune', cat:'gants', nom:'Jaunes', prix:120, c:'#ffd23a'},
  {id:'g_or', cat:'gants', nom:'Dorés', prix:900, c:'#f2b72a'}, {id:'g_arc', cat:'gants', nom:'Arc-en-ciel', prix:2000, c:'rainbow'},
  {id:'m_none', cat:'masque', nom:'Aucun', prix:0}, {id:'m_domino', cat:'masque', nom:'Domino', prix:100}, {id:'m_cagoule', cat:'masque', nom:'Cagoule', prix:150}, {id:'m_loup', cat:'masque', nom:'Loup', prix:300}, {id:'m_clown', cat:'masque', nom:'Clown', prix:450},
];
export const SKIN_BY = Object.fromEntries(SKINS.map(s => [s.id, s]));
export const DEFAULT_EQ = {tenue:'t_noir', gants:'g_noir', masque:'m_none'};
export function initial() { return {v:1, money:0, tier:1, unlocked:1, up:{speed:0, quiet:0, grab:0, bag:0, emp:0}, owned:SKINS.filter(s => s.prix === 0).map(s => s.id), equipped:{...DEFAULT_EQ}, stats:{heists:0, caught:0, loot:0, ghost:0}}; }
export function normalize(s) {
  const b = initial(); if (!s || typeof s !== 'object') return b; const o = {...b};
  o.money = Number.isFinite(s.money) && s.money >= 0 ? Math.min(Math.floor(s.money), 1e9) : 0;
  o.unlocked = Math.max(1, Math.min(MAX_TIER, Math.floor(s.unlocked) || 1)); o.tier = Math.max(1, Math.min(o.unlocked, Math.floor(s.tier) || 1));
  for (const u of UPGRADES) o.up[u.id] = Math.max(0, Math.min(u.max, Math.floor(s.up?.[u.id]) || 0));
  o.owned = [...new Set([...b.owned, ...(Array.isArray(s.owned) ? s.owned.filter(id => SKIN_BY[id]) : [])])];
  o.equipped = {...DEFAULT_EQ}; for (const c of CATS) { const id = s.equipped?.[c.id]; if (SKIN_BY[id]?.cat === c.id && o.owned.includes(id)) o.equipped[c.id] = id; }
  o.stats = {...b.stats, ...(s.stats || {})}; return o;
}
export function buyUpgrade(state, id) { const u = UPGRADES.find(x => x.id === id); if (!u) throw Error('Amélioration inconnue.'); const l = state.up[id]||0; if (l >= u.max) throw Error('Niveau maximum !'); const p = upCost(u, l); if (state.money < p) throw Error('Pas assez d’argent.'); state.money -= p; state.up[id] = l + 1; return u; }
export function buySkin(state, id) { const s = SKIN_BY[id]; if (!s) throw Error('Skin inconnu.'); if (state.owned.includes(id)) throw Error('Déjà acheté.'); if (state.money < s.prix) throw Error('Pas assez d’argent.'); state.money -= s.prix; state.owned.push(id); state.equipped[s.cat] = id; return s; }
export function equipSkin(state, id) { const s = SKIN_BY[id]; if (!s || !state.owned.includes(id)) throw Error('Skin non possédé.'); state.equipped[s.cat] = id; return s; }

// ---------- Simulation d'un cambriolage ----------
const PR = 9; // rayon du joueur
export class Sim {
  constructor(room, up) {
    this.room = room; this.st = statsOf(up); this.t = 0;
    this.p = {x:room.start.x, y:room.start.y, ang:-Math.PI/2, sneaking:false, moving:false, walk:0};
    this.bag = []; this.codes = {}; this.events = []; this.noises = []; this.noiseT = 0; this.alarm = {on:false, t:30}; this.empT = 0; this.empLeft = this.st.emp; this.spotted = false;
    this.grab = {target:null, prog:0}; this.over = null; this.msg = ''; this.msgT = 0;
    this.guards = room.guards.map(g => this.mkAgent(g, 'guard', room.tier)); this.dogs = room.dogs.map(g => this.mkAgent(g, 'dog', room.tier));
    this.cams = room.cams.map(c => ({...c, ang:c.base, susp:0}));
    this.loot = room.loot.map(l => ({...l, def:LOOT[l.id]})); this.notes = room.notes.map(n => ({...n}));
  }
  mkAgent(g, kind, tier = 1) {
    const dog = kind === 'dog', k = Math.min(1, (tier - 1)/12);
    return {kind, x:g.x, y:g.y, ang:0, wps:g.wps, wi:0, path:[], state:g.sleeping ? 'sleep' : 'patrol', susp:0, look:0, wait:0, target:null, lastSeen:null, lostT:0, replan:0, wake:false,
      sp:dog ? 80 : 62, chaseSp:dog ? 118 : 100, range:dog ? 110 + 20*k : 140 + 50*k, half:dog ? .8 + .1*k : .48 + .12*k, hear:dog ? 1.3 + .3*k : .8 + .2*k, react:(dog ? .5 : .55) + .45*k};
  }
  say(m) { this.msg = m; this.msgT = 2.2; }
  noise(x, y, r) { r *= this.st.noise; if (r < 8) return; this.noises.push({x, y, r, t:0}); for (const a of [...this.guards, ...this.dogs]) this.hear(a, x, y, r); }
  hear(a, x, y, r) {
    const d = Math.hypot(a.x - x, a.y - y), eff = r*a.hear*(los(this.room, x, y, a.x, a.y) ? 1 : .55); if (d > eff) return;
    if (a.state === 'chase') return; if (a.state === 'sleep') { a.state = 'investigate'; a.wake = true; }
    else if (a.state !== 'alert') a.state = 'investigate'; a.target = [x, y]; a.path = null; a.wait = 0; a.susp = Math.max(a.susp, .25);
  }
  triggerAlarm(x, y) { if (!this.alarm.on) { this.alarm.on = true; this.alarm.t = 30; this.events.push('alarm'); this.say('ALARME ! La police arrive…'); } this.spotted = true;
    for (const a of [...this.guards, ...this.dogs]) if (a.state !== 'chase') { a.state = 'investigate'; a.target = [x, y]; a.path = null; a.wake = true; } }
  nearest(list, r) { let best = null, bd = r; for (const o of list) { if (o.taken) continue; const d = Math.hypot(o.x - this.p.x, o.y - this.p.y); if (d < bd) { bd = d; best = o; } } return best; }
  interactables() { // renvoie l'objet d'interaction le plus proche
    const p = this.p, c = [];
    for (const l of this.loot) if (!l.taken) c.push({kind:'loot', o:l, x:l.x, y:l.y, d:Math.hypot(l.x - p.x, l.y - p.y)});
    for (const n of this.notes) if (!n.taken) c.push({kind:'note', o:n, x:n.x, y:n.y, d:Math.hypot(n.x - p.x, n.y - p.y)});
    for (const s of this.room.safes) if (!s.opened) c.push({kind:'safe', o:s, x:(s.x + .5)*TILE, y:(s.y + .5)*TILE, d:Math.hypot((s.x + .5)*TILE - p.x, (s.y + .5)*TILE - p.y)});
    const dr = {x:(this.room.door.x + .5)*TILE, y:(this.room.door.y + .5)*TILE}; c.push({kind:'door', o:this.room.door, x:dr.x, y:dr.y, d:Math.hypot(dr.x - p.x, dr.y - p.y)});
    return c.filter(i => i.d < (i.kind === 'door' ? 48 : 50) && los(this.room, p.x, p.y, i.x, i.y) || (i.d < 50 && i.kind !== 'door')).sort((a, b) => a.d - b.d)[0] || null;
  }
  slotsUsed() { return this.bag.reduce((a, l) => a + SIZE[l.def.size].slots, 0); }
  bagValue() { return this.bag.reduce((a, l) => a + l.value, 0); }
  useEmp() { if (this.empLeft <= 0 || this.empT > 0) return false; this.empLeft--; this.empT = 8; this.say('Caméras brouillées 8 s !'); return true; }
  trySafe(id, guess) {
    const s = this.room.safes.find(x => x.id === id); if (!s || s.opened) throw Error('Coffre indisponible.');
    const exact = s.code.filter((v, i) => v === guess[i]).length; this.noise((s.x + .5)*TILE, (s.y + .5)*TILE, 55);
    if (exact === 3) { s.opened = true; const v = LOOT.case.v, rng = rngFor(this.room.seed + 31*id + 7); this.loot.push({x:(s.x + .5)*TILE, y:(s.y + .5)*TILE, id:'case', def:LOOT.case, value:Math.round((v[0] + rng()*(v[1] - v[0]))*(1 + .06*(this.room.tier - 1))/5)*5, taken:false, fromSafe:true}); this.say('Coffre ouvert !'); }
    return {exact, opened:s.opened};
  }
  step(dt, inp) {
    if (this.over) return; const room = this.room, p = this.p; this.t += dt; if (this.msgT > 0) this.msgT -= dt; if (this.empT > 0) this.empT -= dt;
    // --- déplacement ---
    const mag = Math.min(1, Math.hypot(inp.mx, inp.my)); p.moving = mag > .08; p.sneaking = !!inp.sneak || (mag > .08 && mag < .55);
    if (p.moving) { const load = this.slotsUsed()/this.st.cap*.18, sp = 128*this.st.speed*(1 - load)*(p.sneaking ? .5 : 1), nx = inp.mx/Math.max(mag, 1e-6), ny = inp.my/Math.max(mag, 1e-6);
      this.moveBy(nx*sp*dt, 0); this.moveBy(0, ny*sp*dt); p.ang = Math.atan2(ny, nx); p.walk += dt*(p.sneaking ? 5 : 9);
      this.noiseT -= dt; if (this.noiseT <= 0) { this.noiseT = .38; this.noise(p.x, p.y, p.sneaking ? 34 : 135); } }
    // --- interaction (maintenir) ---
    const it = this.interactables(); this.prompt = it; 
    if (inp.act && it) {
      if (it.kind === 'loot' || it.kind === 'note') { const sz = it.kind === 'note' ? SIZE.n : SIZE[it.o.def.size];
        if (it.kind === 'loot' && this.slotsUsed() + sz.slots > this.st.cap) { if (this.grab.target !== it.o) this.say('Sac trop plein !'); this.grab = {target:it.o, prog:0}; }
        else { if (this.grab.target !== it.o) this.grab = {target:it.o, prog:0}; this.grab.prog += dt/(sz.grab*this.st.grab);
          if (this.grab.prog >= 1) { it.o.taken = true; this.grab = {target:null, prog:0}; this.noise(p.x, p.y, sz.noise);
            if (it.kind === 'note') { const s = room.safes.find(s => s.id === it.o.safe); this.codes[s.id] = s.code.slice(); this.say('Code trouvé : ' + s.code.join(' ')); this.events.push('note'); }
            else { this.bag.push(it.o); this.events.push('loot'); this.say(`${it.o.def.emoji} ${it.o.def.nom} +${it.o.value} €`); } } } }
      else if (it.kind === 'safe' && !inp._safeLatch) { this.events.push({type:'safe', id:it.o.id}); }
      else if (it.kind === 'door' && !inp._exitLatch) { this.events.push('exit'); }
    } else this.grab = {target:null, prog:0};
    // --- bruit (rings) ---
    for (const n of this.noises) n.t += dt; this.noises = this.noises.filter(n => n.t < .8);
    // --- caméras ---
    for (const c of this.cams) {
      c.ang = c.base + Math.sin(this.t*c.speed + c.phase)*c.sweep; const off = this.empT > 0;
      const sees = !off && this.t > 3 && this.canSee(c.x, c.y, c.ang, c.range, c.half);
      if (sees) { c.susp = Math.min(1, c.susp + dt*1.3); if (c.susp >= 1) this.triggerAlarm(p.x, p.y); } else c.susp = Math.max(0, c.susp - dt*.7);
    }
    // --- agents ---
    for (const a of [...this.guards, ...this.dogs]) this.stepAgent(a, dt);
    // --- alarme ---
    if (this.alarm.on) { this.alarm.t -= dt; if (this.alarm.t <= 0) this.over = {win:false, why:'police'}; }
  }
  moveBy(dx, dy) {
    const p = this.p; p.x += dx; p.y += dy;
    for (const [cx, cy] of [[-PR, -PR], [PR, -PR], [-PR, PR], [PR, PR]]) if (solidMove(tileAt(this.room, p.x + cx, p.y + cy))) { p.x -= dx; p.y -= dy; return; }
  }
  canSee(x, y, ang, range, half) {
    const p = this.p, d = Math.hypot(p.x - x, p.y - y); if (d > range) return false;
    if (Math.abs(angDiff(Math.atan2(p.y - y, p.x - x), ang)) > half) return false; return los(this.room, x, y, p.x, p.y);
  }
  stepAgent(a, dt) {
    const p = this.p, room = this.room, tx = Math.floor(a.x/TILE), ty = Math.floor(a.y/TILE);
    const sees = a.state !== 'sleep' && this.t > 3 && this.canSee(a.x, a.y, a.ang, a.range, a.half), d = Math.hypot(p.x - a.x, p.y - a.y);
    if (a.state === 'sleep') { return; }
    if (sees) { if (!this.spotted && a.susp > .5) {} a.susp = Math.min(1, a.susp + dt*a.react/(.8 + d/190)); a.lastSeen = [p.x, p.y]; a.lostT = 0; } else { a.susp = Math.max(0, a.susp - dt*(a.state === 'chase' ? .05 : .35)); if (a.state === 'chase') a.lostT += dt; }
    if (a.susp >= 1 && a.state !== 'chase') { a.state = 'chase'; a.path = null; if (!this.alarm.on || true) this.triggerAlarm(p.x, p.y); a.state = 'chase'; }
    else if (a.susp >= .35 && a.state === 'patrol') { a.state = 'alert'; a.wait = 1.2; }
    const turn = (to, rate = 5*dt) => { const df = angDiff(to, a.ang); a.ang += Math.max(-rate, Math.min(rate, df)); };
    const follow = (sp, goalTile) => {
      a.replan -= dt; if (!a.path || a.replan <= 0) { a.replan = .35; a.path = pathTo(room, tx, ty, goalTile[0], goalTile[1]) || []; }
      const nxt = a.path[0]; if (!nxt) return true; const gx = (nxt[0] + .5)*TILE, gy = (nxt[1] + .5)*TILE, dx = gx - a.x, dy = gy - a.y, dist = Math.hypot(dx, dy);
      turn(Math.atan2(dy, dx), 8*dt); if (dist < 3) { a.path.shift(); return !a.path.length; } const st = Math.min(dist, sp*dt); a.x += dx/dist*st; a.y += dy/dist*st; return false;
    };
    if (a.state === 'patrol') {
      const wp = a.wps[a.wi]; if (a.wait > 0) { a.wait -= dt; a.look += dt; turn(a.ang + Math.sin(a.look*2)*.8, 1.6*dt); }
      else if (!wp) {} else if (follow(a.sp, wp)) { a.wi = (a.wi + 1) % a.wps.length; a.wait = a.kind === 'dog' ? .8 : 1.4; a.path = null; }
    } else if (a.state === 'alert') {
      a.wait -= dt; if (a.lastSeen) turn(Math.atan2(a.lastSeen[1] - a.y, a.lastSeen[0] - a.x)); if (a.wait <= 0) { a.state = a.susp >= .35 ? 'investigate' : 'patrol'; a.target = a.lastSeen; a.path = null; }
    } else if (a.state === 'investigate') {
      if (!a.target) { a.state = 'patrol'; return; } const g = [Math.floor(a.target[0]/TILE), Math.floor(a.target[1]/TILE)];
      if (follow(a.sp*1.5, g)) { a.wait += dt; a.look += dt; turn(a.ang + Math.sin(a.look*3)*1.2, 2.4*dt); if (a.wait > 2.2) { a.state = 'patrol'; a.target = null; a.wait = 0; a.path = null; a.susp = 0; } } else a.wait = 0;
    } else if (a.state === 'chase') {
      const lastX = sees ? p.x : (a.lastSeen ? a.lastSeen[0] : p.x), lastY = sees ? p.y : (a.lastSeen ? a.lastSeen[1] : p.y);
      follow(a.chaseSp, [Math.floor(lastX/TILE), Math.floor(lastY/TILE)]);
      if (sees) turn(Math.atan2(p.y - a.y, p.x - a.x), 8*dt);
      if (d < 18) { this.over = {win:false, why:'caught', by:a.kind}; return; }
      if (a.lostT > 4.5) { a.state = 'investigate'; a.target = a.lastSeen; a.path = null; a.susp = .4; }
    }
  }
  exit() {
    const value = this.bagValue(), ghost = !this.spotted, bonus = ghost ? Math.round(value*.25/5)*5 : 0; this.over = {win:true, value, bonus, ghost, items:this.bag.length}; return this.over;
  }
}
export function finishHeist(state, over, tier) {
  state.stats.heists++;
  if (over.win) { const gain = over.value + over.bonus; state.money += gain; state.stats.loot += gain; if (over.ghost) state.stats.ghost++; if (tier === state.unlocked && state.unlocked < MAX_TIER) state.unlocked++; return gain; }
  state.stats.caught++; return 0;
}
