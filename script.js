import * as G from './game.mjs?v=1';
const { TILE, GW, GH, PW, PH, T, LOOT, SIZE, UPGRADES, CATS, SKINS, SKIN_BY, MAX_TIER } = G;
const $ = id => document.getElementById(id);
let state;
function load() { try { return G.normalize(JSON.parse(localStorage.getItem(G.SAVE_KEY))); } catch { return G.initial(); } }
function save() { try { localStorage.setItem(G.SAVE_KEY, JSON.stringify(state)); } catch {} }
function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2400); }
const fmt = n => Math.round(n).toLocaleString('fr-FR');

// ================= DESSIN =================
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const colorOf = (id, t, i = 0) => { const s = SKIN_BY[id]; if (!s || !s.c) return '#222'; return s.c === 'rainbow' ? `hsl(${(t*120 + i*40) % 360} 85% 55%)` : s.c; };
function drawPerson(c, x, y, ang, o) {
  const t = o.t || 0, sw = Math.sin(o.walk || 0)*3.2, body = o.stripe ? '#262633' : o.body;
  c.save(); c.translate(x, y); c.fillStyle = '#0003'; c.beginPath(); c.ellipse(1, 3, 13, 10, 0, 0, 7); c.fill(); c.rotate(ang);
  // jambes (petits pieds qui alternent)
  c.fillStyle = '#1b1b24'; c.beginPath(); c.ellipse(-2 + sw, -4, 4.5, 3, 0, 0, 7); c.ellipse(-2 - sw, 4, 4.5, 3, 0, 0, 7); c.fill();
  // gants / mains
  c.fillStyle = o.glove; c.strokeStyle = '#0006'; c.lineWidth = 1; for (const s of [-1, 1]) { c.beginPath(); c.arc(5 + (s > 0 ? sw : -sw), s*11.5, 3.8, 0, 7); c.fill(); c.stroke(); }
  // épaules
  c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, 7.5, 12, 0, 0, 7); c.fill(); c.stroke();
  if (o.stripe) { c.save(); c.beginPath(); c.ellipse(0, 0, 7.5, 12, 0, 0, 7); c.clip(); c.fillStyle = '#fff'; for (let k = -12; k < 12; k += 6) c.fillRect(-9, k, 18, 2.6); c.restore(); }
  // tête
  const head = o.mask === 'm_cagoule' ? body : (o.head || '#ffd9b3');
  c.fillStyle = head; c.beginPath(); c.arc(1.5, 0, 7.6, 0, 7); c.fill(); c.stroke();
  if (o.mask === 'm_domino') { c.fillStyle = '#111'; c.fillRect(2, -7, 6, 14); }
  if (o.mask === 'm_cagoule') { c.fillStyle = '#ffd9b3'; c.fillRect(5, -3.5, 3.5, 7); }
  if (o.mask === 'm_loup') { c.fillStyle = '#8a8a9a'; c.beginPath(); c.arc(1.5, 0, 7.6, -1.4, 1.4); c.lineTo(10, 3); c.lineTo(11, -3); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-3, -7); c.lineTo(-7, -11); c.lineTo(0, -9); c.moveTo(-3, 7); c.lineTo(-7, 11); c.lineTo(0, 9); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(10.5, 0, 1.6, 0, 7); c.fill(); }
  if (o.mask === 'm_clown') { c.fillStyle = '#ff3a3a'; c.beginPath(); c.arc(8.5, 0, 3, 0, 7); c.fill(); c.fillStyle = '#4ad'; c.beginPath(); c.arc(-1, -6, 3, 0, 7); c.arc(-1, 6, 3, 0, 7); c.fill(); }
  if (o.cap) { c.fillStyle = o.cap; c.beginPath(); c.arc(0.5, 0, 7.6, 0, 7); c.fill(); c.fillStyle = '#0006'; c.fillRect(5, -6, 5, 12); }
  c.restore();
}
function drawDog(c, a, t) {
  c.save(); c.translate(a.x, a.y); c.fillStyle = '#0003'; c.beginPath(); c.ellipse(1, 3, 14, 8, 0, 0, 7); c.fill();
  if (a.state === 'sleep') { c.rotate(.5); c.fillStyle = '#a8703a'; c.beginPath(); c.ellipse(0, 0, 12, 9, 0, 0, 7); c.fill(); c.fillStyle = '#8a5a2a'; c.beginPath(); c.arc(8, 3, 5.5, 0, 7); c.fill(); c.restore(); c.save(); c.translate(a.x, a.y); c.fillStyle = '#fff'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.fillText('z', 10, -12 - Math.sin(t*3)*2); c.fillText('Z', 18, -20 - Math.sin(t*3 + 1)*2); c.restore(); return; }
  c.rotate(a.ang); const wag = Math.sin(t*14)*.5;
  c.strokeStyle = '#7a4a22'; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, 0); c.lineTo(-17, wag*6); c.stroke();
  c.fillStyle = '#b97a3e'; c.beginPath(); c.ellipse(0, 0, 12, 7, 0, 0, 7); c.fill();
  c.fillStyle = '#a56a30'; c.beginPath(); c.arc(11, 0, 6, 0, 7); c.fill(); c.fillStyle = '#6a3a14'; c.beginPath(); c.ellipse(9, -5, 3, 2, .6, 0, 7); c.ellipse(9, 5, 3, 2, -.6, 0, 7); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(16.5, 0, 1.8, 0, 7); c.fill(); c.restore();
}
function drawFurn(c, f, th) {
  const x = f.x*TILE, y = f.y*TILE, w = f.w*TILE, h = f.h*TILE; c.save(); c.fillStyle = '#0003'; rr(c, x + 3, y + 5, w - 2, h - 2, 8); c.fill();
  const g = (c1, c2) => { const gr = c.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); return gr; };
  const R = (c1, c2, r = 8, ins = 2) => { c.fillStyle = g(c1, c2); rr(c, x + ins, y + ins, w - ins*2, h - ins*2, r); c.fill(); c.strokeStyle = '#0004'; c.lineWidth = 2; c.stroke(); };
  switch (f.kind) {
    case 'sofa': R('#ff7a95', '#d8456a', 12); c.fillStyle = '#ffffff30'; const hor = w > h; for (let i = 1; i < (hor ? f.w : f.h); i++) { c.fillRect(hor ? x + i*TILE - 1 : x + 6, hor ? y + 6 : y + i*TILE - 1, hor ? 2 : w - 12, hor ? h - 12 : 2); } break;
    case 'table': R('#e0a35a', '#b87a34', 10, 4); c.fillStyle = '#fff3'; rr(c, x + 8, y + 8, w - 16, 5, 3); c.fill(); break;
    case 'shelf': R('#7a4a2a', '#4a2a14', 4, 1); for (let i = 0; i < f.w*f.h*3; i++) { c.fillStyle = ['#e23a3a', '#3a8ae2', '#3ae26a', '#e2c23a', '#c23ae2'][i % 5]; const hor = w > h; if (hor) c.fillRect(x + 4 + i*(w - 8)/(f.w*f.h*3), y + 6, (w - 8)/(f.w*f.h*3) - 2, h - 12); else c.fillRect(x + 6, y + 4 + i*(h - 8)/(f.w*f.h*3), w - 12, (h - 8)/(f.w*f.h*3) - 2); } break;
    case 'plant': c.fillStyle = '#c0663a'; c.beginPath(); c.arc(x + w/2, y + h/2, 11, 0, 7); c.fill(); c.fillStyle = '#2fbf5a'; for (let i = 0; i < 7; i++) { const a = i*.9; c.beginPath(); c.ellipse(x + w/2 + Math.cos(a)*7, y + h/2 + Math.sin(a)*7, 9, 5, a, 0, 7); c.fill(); } c.fillStyle = '#6fe98a'; c.beginPath(); c.arc(x + w/2, y + h/2, 5, 0, 7); c.fill(); break;
    case 'case': R('#bfeaff', '#8cc8e8', 6, 3); c.strokeStyle = '#ffffffcc'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#fff8'; c.fillRect(x + 8, y + 7, 10, 3); break;
    case 'desk': R('#b8865a', '#8a5a34', 6, 3); c.fillStyle = '#222'; rr(c, x + w/2 - 11, y + 8, 22, 14, 3); c.fill(); c.fillStyle = '#6fd'; c.fillRect(x + w/2 - 9, y + 10, 18, 9); break;
    case 'piano': R('#2a2a34', '#0e0e14', 8, 2); c.fillStyle = '#fff'; c.fillRect(x + 8, y + h - 16, w - 16, 9); c.fillStyle = '#111'; for (let i = 0; i < (w - 16)/12; i++) c.fillRect(x + 14 + i*12, y + h - 16, 5, 5); break;
    case 'pillar': c.fillStyle = g('#f2f2f8', '#b8b8c8'); c.beginPath(); c.arc(x + w/2, y + h/2, 17, 0, 7); c.fill(); c.strokeStyle = '#0004'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#fff9'; c.beginPath(); c.arc(x + w/2 - 5, y + h/2 - 5, 6, 0, 7); c.fill(); break;
    case 'crate': R('#c98f4a', '#9a6a2a', 4, 3); c.strokeStyle = '#6a4a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 5, y + 5); c.lineTo(x + w - 5, y + h - 5); c.moveTo(x + w - 5, y + 5); c.lineTo(x + 5, y + h - 5); c.stroke(); break;
    case 'safe': R('#8a8fa0', '#4a4f60', 6, 3); c.fillStyle = '#ffd34a'; c.beginPath(); c.arc(x + w/2, y + h/2, 8, 0, 7); c.fill(); c.strokeStyle = '#6a5a1a'; c.lineWidth = 2; c.stroke(); c.beginPath(); c.moveTo(x + w/2, y + h/2); c.lineTo(x + w/2 + 5, y + h/2 - 4); c.stroke(); break;
  }
  c.restore();
}
function cone(c, room, x, y, ang, range, half, color) {
  c.beginPath(); c.moveTo(x, y); const n = 24; for (let i = 0; i <= n; i++) { const a = ang - half + (2*half)*i/n; const d = G.rayDist(room, x, y, a, range); c.lineTo(x + Math.cos(a)*d, y + Math.sin(a)*d); } c.closePath(); c.fillStyle = color; c.fill();
}
function drawRoom(c, sim, t, W_, H_) {
  const room = sim.room, th = room.theme; c.setTransform(W_/PW, 0, 0, H_/PH, 0, 0);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { c.fillStyle = th.floor[(x + y) & 1]; c.fillRect(x*TILE, y*TILE, TILE, TILE); }
  // tapis décoratif
  c.fillStyle = th.trim + '33'; rr(c, 3*TILE, 2*TILE, 6*TILE, 4*TILE, 20); c.fill();
  // murs
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const tp = room.tiles[y][x]; if (tp === T.WALL) { c.fillStyle = th.wall; c.fillRect(x*TILE, y*TILE, TILE, TILE); c.fillStyle = th.trim; c.fillRect(x*TILE, y*TILE, TILE, 5); c.fillStyle = '#0003'; c.fillRect(x*TILE, y*TILE + TILE - 6, TILE, 6); } }
  // porte
  const d = room.door; c.fillStyle = '#2ecc71'; c.fillRect(d.x*TILE, d.y*TILE, TILE, TILE); c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('SORTIE', d.x*TILE + TILE/2, d.y*TILE + 24);
  for (const f of room.furniture) drawFurn(c, f, th);
  // butin
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const l of sim.loot) { if (l.taken) continue; const bob = Math.sin(t*3 + l.x)*1.5, big = l.def.size === 'l' ? 28 : l.def.size === 'm' ? 23 : 18;
    const gl = c.createRadialGradient(l.x, l.y, 2, l.x, l.y, 22); gl.addColorStop(0, '#ffe45acc'); gl.addColorStop(1, '#ffe45a00'); c.fillStyle = gl; c.beginPath(); c.arc(l.x, l.y, 22, 0, 7); c.fill();
    c.font = `${big}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.fillText(l.def.emoji, l.x, l.y + bob); }
  for (const n of sim.notes) { if (n.taken) continue; c.font = '20px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.fillText('🗒️', n.x, n.y + Math.sin(t*3)*1.5); }
  // cônes (sous les personnages)
  for (const cm of sim.cams) { const off = sim.empT > 0; cone(c, room, cm.x, cm.y, cm.ang, cm.range, cm.half, off ? '#99999922' : cm.susp > .05 ? `rgba(255,60,60,${.2 + cm.susp*.35})` : 'rgba(255,200,80,.2)'); }
  for (const a of [...sim.guards, ...sim.dogs]) { if (a.state === 'sleep') continue; cone(c, room, a.x, a.y, a.ang, a.range, a.half, a.state === 'chase' ? 'rgba(255,50,50,.32)' : a.susp > .1 ? 'rgba(255,150,40,.3)' : 'rgba(255,235,90,.24)'); }
  // caméras
  for (const cm of sim.cams) { c.save(); c.translate(cm.x, cm.y); c.fillStyle = '#2a2a38'; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill(); c.rotate(cm.ang); c.fillStyle = sim.empT > 0 ? '#777' : '#e23a3a'; rr(c, 0, -5, 14, 10, 3); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(12, 0, 2, 0, 7); c.fill(); c.restore(); }
  // agents
  for (const d2 of sim.dogs) drawDog(c, d2, t);
  for (const g of sim.guards) drawPerson(c, g.x, g.y, g.ang, {body:'#2f6fe0', glove:'#fff', cap:'#173a8a', head:'#f4c9a0', walk:t*8, t});
  for (const a of [...sim.guards, ...sim.dogs]) { if (a.state === 'sleep') continue; const sym = a.state === 'chase' ? '!' : (a.state === 'alert' || a.state === 'investigate' || a.susp > .1) ? '?' : ''; if (sym) { c.font = 'bold 20px sans-serif'; c.fillStyle = sym === '!' ? '#ff3a3a' : '#ffb020'; c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeText(sym, a.x, a.y - 22); c.fillText(sym, a.x, a.y - 22); }
    if (a.susp > .02 && a.state !== 'chase') { c.fillStyle = '#0008'; c.fillRect(a.x - 12, a.y - 17, 24, 4); c.fillStyle = a.susp > .6 ? '#ff4a4a' : '#ffc84a'; c.fillRect(a.x - 12, a.y - 17, 24*a.susp, 4); } }
  // joueur
  const p = sim.p, e = state.equipped, sk = SKIN_BY[e.tenue];
  for (const n of sim.noises) { c.strokeStyle = `rgba(255,255,255,${.5*(1 - n.t/.8)})`; c.lineWidth = 2; c.beginPath(); c.arc(n.x, n.y, Math.min(n.r, 20 + n.t/.8*n.r), 0, 7); c.stroke(); }
  drawPerson(c, p.x, p.y, p.ang, {body:colorOf(e.tenue, t), stripe:sk.c === 'stripe', glove:colorOf(e.gants, t, 1), mask:e.masque, walk:p.moving ? p.walk : 0, t});
  if (sim.grab.target && sim.grab.prog > 0) { c.strokeStyle = '#0008'; c.lineWidth = 6; c.beginPath(); c.arc(p.x, p.y - 26, 11, 0, 7); c.stroke(); c.strokeStyle = '#ffd34a'; c.beginPath(); c.arc(p.x, p.y - 26, 11, -Math.PI/2, -Math.PI/2 + Math.PI*2*Math.min(1, sim.grab.prog)); c.stroke(); }
  if (sim.prompt && !sim.grab.target) { const pr = sim.prompt; c.font = 'bold 13px sans-serif'; c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 3; const lab = pr.kind === 'door' ? '🚪 Sortir' : pr.kind === 'safe' ? '🔐 Ouvrir' : pr.kind === 'note' ? '🗒️ Lire' : `${pr.o.def.emoji} +${pr.o.value} €`; c.strokeText(lab, pr.x, pr.y - 24); c.fillText(lab, pr.x, pr.y - 24); }
  if (sim.msgT > 0) { c.font = 'bold 18px sans-serif'; c.globalAlpha = Math.min(1, sim.msgT); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 4; c.strokeText(sim.msg, PW/2, 60); c.fillText(sim.msg, PW/2, 60); c.globalAlpha = 1; }
  // pénombre sur les bords
  const vg = c.createRadialGradient(PW/2, PH/2, PH*.5, PW/2, PH/2, PW*.62); vg.addColorStop(0, '#0000'); vg.addColorStop(1, '#0006'); c.fillStyle = vg; c.fillRect(0, 0, PW, PH);
}

// ================= JEU =================
let sim = null, running = false, last = 0, acc = 0, tier = 1, keys = new Set(), stick = null, actHeld = false, sneakTog = false, actLatch = false, paused = false, gameT = 0;
function newHeist() {
  tier = state.tier; const seed = Math.floor(Math.random()*1e9); sim = new G.Sim(G.generateRoom(tier, seed), state.up); paused = false; actLatch = false;
  $('menu').hidden = true; $('game').hidden = false; $('overlay').hidden = true; $('h-title').textContent = sim.room.theme.nom; $('h-tier').textContent = `Difficulté ${tier}`; $('h-alarm').hidden = true;
  $('b-emp').hidden = !state.up.emp; $('h-codes').hidden = true; updateHud(); running = true; last = performance.now(); acc = 0; requestAnimationFrame(frame);
}
function input() {
  let mx = 0, my = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA') || keys.has('KeyQ_')) mx -= 1; if (keys.has('ArrowRight') || keys.has('KeyD')) mx += 1; if (keys.has('ArrowUp') || keys.has('KeyW') || keys.has('KeyZ')) my -= 1; if (keys.has('ArrowDown') || keys.has('KeyS')) my += 1;
  let mag = Math.hypot(mx, my); if (mag) { mx /= mag; my /= mag; }
  if (stick) { mx = stick.x; my = stick.y; }
  const act = actHeld || keys.has('Space') || keys.has('KeyE');
  return {mx, my, sneak: sneakTog || keys.has('ShiftLeft') || keys.has('ShiftRight'), act: act && !actLatch, _safeLatch: false};
}
function frame(ts) {
  if (!running) return; const dt = Math.min(.05, (ts - last)/1000 || 0); last = ts; gameT += dt; if (!paused) acc += dt;
  while (acc >= 1/60 && !sim.over) { const inp = input(); sim.step(1/60, inp); acc -= 1/60; handleEvents(); if (paused) { acc = 0; break; } }
  if (!(actHeld || keys.has('Space') || keys.has('KeyE'))) actLatch = false;
  const cv = $('cv'); drawRoom(cv.getContext('2d'), sim, gameT, cv.width, cv.height); updateHud();
  if (sim.over) { running = false; showResult(); return; }
  requestAnimationFrame(frame);
}
function handleEvents() {
  for (const ev of sim.events.splice(0)) {
    if (ev === 'exit') { sim.exit(); }
    else if (ev?.type === 'safe') { actLatch = true; openSafe(ev.id); }
    else if (ev === 'alarm') { navigator.vibrate?.(200); }
  }
}
function updateHud() {
  $('h-bag').textContent = `🎒 ${sim.slotsUsed()}/${sim.st.cap} · ${fmt(sim.bagValue())} €`;
  const ids = Object.keys(sim.codes); $('h-codes').hidden = !ids.length; $('h-codes').textContent = '🔑 ' + ids.map(i => sim.codes[i].join(' ')).join(' · ');
  $('h-alarm').hidden = !sim.alarm.on; $('h-alarm-t').textContent = Math.max(0, Math.ceil(sim.alarm.t));
  const pr = sim.prompt; $('b-act-l').textContent = !pr ? 'Voler' : pr.kind === 'door' ? 'Sortir' : pr.kind === 'safe' ? 'Ouvrir' : pr.kind === 'note' ? 'Lire' : 'Voler';
  $('b-emp-n').textContent = `×${sim.empLeft}`; $('b-emp').disabled = sim.empLeft <= 0 || sim.empT > 0; $('b-sneak').classList.toggle('on', sneakTog);
}
function showResult() {
  const o = sim.over, ov = $('overlay'); ov.hidden = false;
  const gain = G.finishHeist(state, o, tier); let unlocked = false;
  if (o.win && tier === state.unlocked - 1) unlocked = true; if (o.win && tier < state.unlocked) state.tier = Math.min(state.unlocked, state.tier); save(); renderMenu();
  if (o.win) ov.innerHTML = `<div class="ov-box"><h2>Cambriolage réussi ! 🎉</h2><big>+${fmt(gain)} €</big><p class="fine">${o.items} objet${o.items > 1 ? 's' : ''} volé${o.items > 1 ? 's' : ''}${o.ghost ? ` · bonus fantôme 👻 +${fmt(o.bonus)} €` : ''}</p>${unlocked ? '<p>🔓 Nouvelle difficulté débloquée !</p>' : ''}<div class="ov-btns"><button class="primary" id="ov-again">Encore !</button><button class="secondary" id="ov-menu">Planque</button></div></div>`;
  else ov.innerHTML = `<div class="ov-box"><h2>${o.why === 'police' ? 'La police est arrivée ! 🚔' : o.by === 'dog' ? 'Mordu par le chien ! 🐕' : 'Tu t’es fait pincer ! 👮'}</h2><p class="fine">Tu perds ton butin${sim.bag.length ? ` (${fmt(sim.bagValue())} €)` : ''}. Essaie d’être plus discret !</p><div class="ov-btns"><button class="primary" id="ov-again">Réessayer</button><button class="secondary" id="ov-menu">Planque</button></div></div>`;
  $('ov-again').onclick = newHeist; $('ov-menu').onclick = backToMenu;
}
function backToMenu() { running = false; $('game').hidden = true; $('menu').hidden = false; renderMenu(); renderCoins(); }
$('quit').onclick = () => { if (!sim?.over && sim?.bag.length && !confirm('Abandonner ? Tu perds ton butin.')) return; backToMenu(); };

// ---- coffre ----
let safeId = null, digits = [0, 0, 0];
function openSafe(id) {
  paused = true; safeId = id; const known = sim.codes[id]; digits = known ? known.slice() : [0, 0, 0]; $('safe-fb').textContent = ''; $('safe-fb').style.color = '';
  $('safe-info').textContent = known ? '🗒️ Tu as trouvé le code sur un post-it !' : 'Pas de code ? Devine-le : on te dit combien de chiffres sont bien placés. Chaque essai fait un peu de bruit.';
  renderDials([]); $('safe-dialog').hidden = false;
}
function renderDials(ok) { $('dials').replaceChildren(...digits.map((d, i) => { const el = document.createElement('div'); el.className = 'dial'; const up = document.createElement('button'), dn = document.createElement('button'), b = document.createElement('b'); up.textContent = '▲'; dn.textContent = '▼'; b.textContent = d; if (ok[i]) b.className = 'ok'; up.onclick = () => { digits[i] = (digits[i] + 1) % 10; renderDials([]); }; dn.onclick = () => { digits[i] = (digits[i] + 9) % 10; renderDials([]); }; el.append(up, b, dn); return el; })); }
$('safe-try').onclick = () => {
  try { const r = sim.trySafe(safeId, digits); const s = sim.room.safes.find(s => s.id === safeId); renderDials(s.code.map((v, i) => v === digits[i]));
    if (r.opened) { $('safe-fb').style.color = '#3ddc84'; $('safe-fb').textContent = 'Clic ! Le coffre s’ouvre 🎉'; setTimeout(closeSafe, 700); } else { $('safe-fb').style.color = '#ffd34a'; $('safe-fb').textContent = `${r.exact} chiffre${r.exact > 1 ? 's' : ''} bien placé${r.exact > 1 ? 's' : ''}`; } } catch (e) { $('safe-fb').textContent = e.message; }
};
function closeSafe() { $('safe-dialog').hidden = true; paused = false; actLatch = true; }
$('safe-close').onclick = closeSafe;

// ---- contrôles ----
addEventListener('keydown', e => { if (!running) return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); keys.add(e.code); if (e.code === 'KeyQ' && !paused) { sim.useEmp(); } });
addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
const wrap = $('game');
wrap.addEventListener('pointerdown', e => { if (e.target.closest('.btns, button, .overlay-game') || !running) return; wrap.setPointerCapture(e.pointerId); stick = {id:e.pointerId, ox:e.clientX, oy:e.clientY, x:0, y:0}; const s = $('stick'); s.hidden = false; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.firstElementChild.style.transform = 'none'; });
wrap.addEventListener('pointermove', e => { if (!stick || e.pointerId !== stick.id) return; const dx = e.clientX - stick.ox, dy = e.clientY - stick.oy, R = 52, m = Math.min(1, Math.hypot(dx, dy)/R); const a = Math.atan2(dy, dx); stick.x = m < .12 ? 0 : Math.cos(a)*m; stick.y = m < .12 ? 0 : Math.sin(a)*m; $('stick').firstElementChild.style.transform = `translate(${Math.cos(a)*m*R*.7}px,${Math.sin(a)*m*R*.7}px)`; });
const endStick = e => { if (stick && e.pointerId === stick.id) { stick = null; $('stick').hidden = true; } }; wrap.addEventListener('pointerup', endStick); wrap.addEventListener('pointercancel', endStick);
const hold = (el, on, off) => { el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); on(); }); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); };
hold($('b-act'), () => { actHeld = true; }, () => { actHeld = false; });
$('b-sneak').onclick = () => { sneakTog = !sneakTog; };
$('b-emp').onclick = () => { if (sim && !paused) sim.useEmp(); };

// ================= MENUS =================
const TIER_TXT = t => { const D = G.difficulty(t); return `${D.guards} garde${D.guards > 1 ? 's' : ''}${D.dogs ? ` · ${D.dogs} chien${D.dogs > 1 ? 's' : ''}` : ''}${D.cams ? ` · ${D.cams} caméra${D.cams > 1 ? 's' : ''}` : ''}${D.safes ? ` · ${D.safes} coffre${D.safes > 1 ? 's' : ''}` : ''}`; };
function renderMenu() {
  $('tier-n').textContent = state.tier; $('tier-info').textContent = TIER_TXT(state.tier); $('tier-minus').disabled = state.tier <= 1; $('tier-plus').disabled = state.tier >= state.unlocked;
  const s = state.stats; $('stats').innerHTML = [['Cambriolages', s.heists], ['Arrestations', s.caught], ['Butin total', fmt(s.loot) + ' €'], ['Coups parfaits 👻', s.ghost]].map(([k, v]) => `<p><span>${k}</span><b>${v}</b></p>`).join('');
}
$('tier-minus').onclick = () => { state.tier = Math.max(1, state.tier - 1); save(); renderMenu(); }; $('tier-plus').onclick = () => { state.tier = Math.min(state.unlocked, state.tier + 1); save(); renderMenu(); };
$('start').onclick = newHeist;
function renderCoins() { $('money').textContent = fmt(state.money); }
function renderUps() {
  $('ups').replaceChildren(...UPGRADES.map(u => { const l = state.up[u.id] || 0, max = l >= u.max, cost = G.upCost(u, l), el = document.createElement('div'); el.className = 'up';
    el.innerHTML = `<span class="ic">${u.icone}</span><b>${u.nom}</b><small class="fine">${u.desc}</small><div class="pips">${Array.from({length:u.max}, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>`;
    const b = document.createElement('button'); b.className = 'primary'; b.disabled = max || state.money < cost; b.textContent = max ? 'Niveau max ✓' : `Acheter · ${fmt(cost)} €`; b.onclick = () => { try { G.buyUpgrade(state, u.id); save(); renderCoins(); renderUps(); toast(`${u.nom} amélioré !`); } catch (e) { toast(e.message); } }; el.append(b); return el; }));
}
let shopCat = 'tenue';
function renderSkins() {
  $('cats').replaceChildren(...CATS.map(c => { const b = document.createElement('button'); b.type = 'button'; b.className = c.id === shopCat ? 'on' : ''; b.textContent = c.nom; b.onclick = () => { shopCat = c.id; renderSkins(); }; return b; }));
  $('skins').replaceChildren(...SKINS.filter(s => s.cat === shopCat).map(s => { const owned = state.owned.includes(s.id), eq = state.equipped[s.cat] === s.id, el = document.createElement('button'); el.type = 'button'; el.className = 'skin' + (eq ? ' eq' : '');
    const bg = s.c === 'rainbow' ? 'linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,magenta)' : s.c === 'stripe' ? 'repeating-linear-gradient(0deg,#262633 0 5px,#fff 5px 9px)' : s.c || '#444';
    el.innerHTML = `<span class="sw" style="background:${bg}">${s.cat === 'masque' ? ({m_none:'—', m_domino:'🕶️', m_cagoule:'🥷', m_loup:'🐺', m_clown:'🤡'}[s.id]) : ''}</span><b>${s.nom}</b><small>${eq ? 'Équipé ✓' : owned ? 'Équiper' : fmt(s.prix) + ' €'}</small>`;
    el.onclick = () => { try { if (owned) G.equipSkin(state, s.id); else { G.buySkin(state, s.id); toast(`${s.nom} acheté !`); } save(); renderCoins(); renderSkins(); } catch (e) { toast(e.message); } }; return el; }));
}
let pvRun = false;
function pvLoop(ts) { if (!pvRun) return; const c = $('pv').getContext('2d'), W_ = $('pv').width, H_ = $('pv').height, t = ts/1000; c.setTransform(1, 0, 0, 1, 0, 0);
  const th = G.THEMES[0]; for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) { c.fillStyle = th.floor[(x + y) & 1]; c.fillRect(x*50, y*50, 50, 50); }
  c.save(); c.translate(W_/2, H_/2); c.scale(5, 5); const e = state.equipped; drawPerson(c, 0, 0, t*.8, {body:colorOf(e.tenue, t), stripe:SKIN_BY[e.tenue].c === 'stripe', glove:colorOf(e.gants, t, 1), mask:e.masque, walk:t*9, t}); c.restore(); requestAnimationFrame(pvLoop); }
function tab(name) { document.querySelectorAll('.tab').forEach(el => el.classList.toggle('visible', el.id === name)); document.querySelectorAll('nav [data-tab]').forEach(el => el.classList.toggle('active', el.dataset.tab === name)); pvRun = name === 'style'; if (pvRun) { renderSkins(); requestAnimationFrame(pvLoop); } if (name === 'mat') renderUps(); }
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { if (running && b.dataset.tab !== 'jouer') return; tab(b.dataset.tab); });
state = load(); renderCoins(); renderMenu();
document.addEventListener('visibilitychange', () => { if (document.hidden && running) { paused = true; } else if (!document.hidden && running && $('safe-dialog').hidden) { paused = false; last = performance.now(); } });
