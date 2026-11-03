// ---------------------------------------------------------------------------------------
// THE COOKING STATION'S WINDOW, THE OTHER FAMILIES AND THE SLABS (G222 to G225, G229; docs/plans/SPIRIT-COOKING.md 4, 5, 16): what the
// window (kitchen.js) does for every family bread is not: rice, broth, tea, sear, sauce, emulsion, sweet, ferment, smoke and the seafood
// of the 3D stage's moves it can play. A family is its moves in order; each is a play (progress/cooking/plays.js) drawn plainly on the
// window's canvas with its controls as buttons and range sliders (a thumb drag with a wide good zone: every gesture is touch-first),
// its tell said in words and never a number. The ferment runs on the game clock (cooking.js `long`): tend it, leave it, come back.
// Then the window's own taste-and-adjust and serve, as for bread. Also the recipe slabs: a cracked slab found at the hearth whose
// blank lines are filled by placing a move (progress/cooking/recipes.js).
//
// A placeholder look: the canvas draws a pot, its liquid and bubbles (`ck-*` classes, Calissa's to dress; her 3D stage reads `k.step`
// 'fam' as the board and `k.family`, a hook she may want to dress per family: docs/handoffs/calissa/2026-11-03-from-dovina-cooking-families.md).
//
// Prior art: Cooking Mama (a gesture a step), Overcooked (stir or it burns), Papa's Pizzeria (watch the colour), Venba (a recipe
// mended by the order of its steps).
//
//   familyBegin(k)  familyResume(k)  familyPage(k, root, row, btn, el)  familyTick(k, dt)  familyDraw(k, still)  playableFamilies()
//   slabsPage(k, root, row, btn, el)
// ---------------------------------------------------------------------------------------
import { MOVES, moveFor, tellAt } from '../../progress/cooking/moves.js';
import { FAMILIES, dishFor } from '../../progress/cooking/dishes.js';
import { newPlay, PLAYABLE } from '../../progress/cooking/plays.js';
import { slabOf, slabLines, slabChoices } from '../../progress/cooking/recipes.js';

const BREAD = new Set(['knead', 'proof', 'bake']);
/** The families the window can play whole: every move bread's, a play's or the ferment's. */
export const playableFamilies = () => Object.keys(FAMILIES).filter((k) => FAMILIES[k].moves.every((m) => BREAD.has(m) || PLAYABLE.has(m) || MOVES[m]?.clock === 'game' && m === 'ferment'));

const movesOf = (k) => FAMILIES[k.st.family].moves;

/** Begin a cook of this family: the add-ins taken (n of them), the first move set going. */
export function familyBegin(k) {
  const n = k.n || 1; k.takeAddins(n);
  k.st = { family: k.family, addin: k.addin, n, scores: [], hits: [], ruined: false, idx: 0, beatT: 0, taste: null, tasted: false };
  startMove(k);
}
function startMove(k) {
  const S = k.st, move = movesOf(k)[S.idx], M = MOVES[move];
  k.play = null;
  if (M.clock === 'game') k.C.startLong({ family: S.family, addin: S.addin, n: S.n, move, idx: S.idx, scores: S.scores, hits: S.hits });
  else k.play = newPlay(move, { family: S.family, addin: S.addin });
  k.show('fam');
}
/** A ferment left going and come back to: the cook picked up where it was. */
export function familyResume(k) {
  const Lg = k.C.long; if (!Lg) return false;
  k.family = Lg.family; k.addin = Lg.addin; k.n = Lg.n; k.play = null;
  k.st = { family: Lg.family, addin: Lg.addin, n: Lg.n, scores: Lg.scores || [], hits: Lg.hits || [], ruined: false, idx: Lg.idx, beatT: 0, taste: null, tasted: false };
  k.show('fam'); return true;
}
/** The move judged, then the next move or the taste. */
export function familyNext(k) {
  const S = k.st; S.idx++;
  if (S.idx >= movesOf(k).length) return k.show('taste');
  startMove(k);
}
export const familyHead = (k) => { const S = k.st; const m = S && movesOf(k)[S.idx]; return `${FAMILIES[S?.family]?.label || ''} · ${MOVES[m]?.label || ''}`; };

// ------------------------------------------------------------------ the move's page
export function familyPage(k, root, row, btn, el) {
  const S = k.st, move = movesOf(k)[S.idx], M = moveFor(move, S.family, S.addin), P = k.play;
  root.insertBefore(el('div', 'ck-line', `${M.line} ${S.idx + 1} of ${movesOf(k).length}.`), root.querySelector('.ck-main'));
  k.ctl = {};
  if (!P) { // (the ferment, on the game clock)
    for (const [id, m] of Object.entries(M.modes)) btn(m.label, () => { k.C.tend(id); k.tell(`Set ${m.label.toLowerCase()}.`); }, k.C.long?.mode === id ? 'on' : '');
    btn('SMELL IT', () => k.tell(tellAt(M, k.C.longValue())));
    btn('TAKE IT OUT', () => { const v = k.C.longValue(); k.C.takeLong(); k.finish(move, v); }, 'big');
    btn('LEAVE IT', () => k.close());
    k.tell('It works on the game clock, about two game hours to ready at a steady warmth. Come back and smell it.');
  } else {
    for (const c of P.controls()) {
      if (c.kind === 'range') {
        const w = el('div', 'ck-slide'); w.appendChild(el('div', 'ck-line', c.label));
        const r = document.createElement('input'); r.type = 'range'; r.className = 'ck-range'; r.min = c.min; r.max = c.max; r.step = 0.01; r.value = c.value;
        r.oninput = (e) => { e.stopPropagation(); P.act(c.id, +r.value); }; w.appendChild(r); row.parentNode.appendChild(w); k.ctl[c.id] = w;
      } else k.ctl[c.id] = btn(c.label, () => { const out = P.act(c.id); if (out === 'rebuild') k.show('fam'); else if (P.done) familyTick(k, 0); }, c.big ? 'big' : '');
    }
    k.tell(P.tell());
  }
  k.draw = () => familyDraw(k);
}

/** Each frame: the play's clock, its tell, its buttons' labels; a finished play is judged. */
export function familyTick(k, dt) {
  const P = k.play; if (k.step !== 'fam') return;
  if (!P) return;
  P.tick(dt);
  if (P.done) { k.st.last = P.live(); return finishPlay(k); }
  k.tell(P.tell());
  for (const c of P.controls()) { const b = k.ctl?.[c.id]; if (b && c.kind === 'tap') { b.textContent = c.label; b.style.display = c.show === false ? 'none' : ''; } }
}
function finishPlay(k) {
  const P = k.play, r = P.result(k.C.practice(P.move)); k.st.last = P.ruined ? P.M.over : P.live();
  k.tell(P.ruined ? tellAt(P.M, P.M.over) : P.tell()); k.finish(P.move, P.value(), r);
}

// ------------------------------------------------------------------ the drawing: a pot, its liquid and what it shows (placeholder)
const LIQUID = { simmer: '#cfd6a0', rice: '#e8e4d8', steep: '#c89a50', sugar: '#e6d9b0', roux: '#f0e6c8', emulsion: '#f2d878', smoke: '#6a5a50', sear: '#c8a070', cut: '#ecd9b4', bleed: '#7a8fa8', ferment: '#efe6cc' };
const mixc = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b), u = Math.max(0, Math.min(1, t)); return `#${A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join('')}`; };
export function familyDraw(k, still = false) {
  const x = k.ctx(); if (!x) return;
  const S = k.st || {}, P = k.play, move = P?.move || FAMILIES[S.family]?.moves?.[S.idx ?? 0] || FAMILIES[k.family]?.moves?.[0] || 'simmer';
  const v = P ? P.live() : move === 'ferment' && k.C.long ? k.C.longValue() : S.last ?? 0.5;
  x.fillStyle = '#3a2a20'; x.fillRect(40, 190, 480, 14); // (the counter)
  let liquid = LIQUID[move] || '#ddd';
  if (move === 'roux') liquid = mixc('#f0e6c8', '#3a2410', v); else if (move === 'sugar') liquid = mixc('#eee6c8', '#6a3a10', v); else if (move === 'rice') liquid = mixc('#f2eee2', '#bcd2dc', v);
  else if (move === 'ferment') liquid = mixc('#efe6cc', v > 0.6 ? '#a8b060' : '#e8e0c0', Math.max(0, (v - 0.55) * 3));
  else if (move === 'steep') liquid = mixc('#d8d4c0', '#b07a30', v);
  x.fillStyle = '#5c3424'; x.beginPath(); x.ellipse(280, 160, 120, 34, 0, 0, Math.PI); x.lineTo(160, 110); x.lineTo(400, 110); x.closePath(); x.fill(); // (the pot)
  x.fillStyle = liquid; x.beginPath(); x.ellipse(280, 112, 112, 16, 0, 0, Math.PI * 2); x.fill();
  const t = performance.now() / 1000, bub = move === 'simmer' || move === 'steep' || move === 'sugar' ? Math.round(v * 10) : move === 'emulsion' ? Math.round((P?.pour || 0) * 8) : 0;
  x.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < bub; i++) { const a = i * 2.3 + t * (1 + v * 3); x.beginPath(); x.arc(280 + Math.cos(a * 1.7) * 90, 108 + Math.sin(a) * 9 - ((t * 20 * (1 + i)) % 22), 3 + (i % 3), 0, Math.PI * 2); x.fill(); }
  if (move === 'smoke' || move === 'simmer') { x.fillStyle = `rgba(230,230,240,${Math.min(0.7, (move === 'smoke' ? v : Math.max(0, v - 0.3)) * 0.8)})`; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(250 + i * 25 + Math.sin(t * 2 + i) * 8, 90 - i * 18 - ((t * 15) % 15), 14 + i * 4, 0, Math.PI * 2); x.fill(); } }
  if (move === 'smoke' || move === 'sear' || move === 'roux' || move === 'sugar' || move === 'simmer') { x.fillStyle = '#ff7a30'; x.globalAlpha = 0.25 + 0.5 * (P?.fire ?? P?.heat ?? Math.min(1, v + 0.3)); x.fillRect(190, 178, 180, 8); x.globalAlpha = 1; } // (the fire under it)
  if (move === 'cut' && P) { x.fillStyle = '#d8b878'; P.strokes.slice(-8).forEach((w, i) => x.fillRect(80 + i * 50, 140, 8 + w * 36, 40)); }
  if (move === 'bleed' && P) { x.fillStyle = '#9fb0c4'; x.beginPath(); x.ellipse(280 + Math.sin(P.t * 9) * (v < 0.38 || v > 0.55 ? 40 : 2), 150, 80, 22, 0, 0, Math.PI * 2); x.fill(); }
  if (move === 'emulsion' && P) { x.fillStyle = `rgba(200,60,40,${Math.min(1, P.splitK)})`; x.fillRect(120, 30, 320 * Math.min(1, P.splitK), 6); }
  if (move === 'rice' && P?.phase === 'line') { x.strokeStyle = '#ffd36a'; x.lineWidth = 2; const y = 175 - (P.ratio - 0.8) / 0.7 * 60; x.beginPath(); x.moveTo(160, y); x.lineTo(400, y); x.stroke(); }
  if (!still && P && ['roux'].includes(move) && P.t - P.stirAt > 1) { x.fillStyle = '#ffd36a'; x.font = '14px system-ui'; x.fillText('STIR!', 250, 30); }
}

// ------------------------------------------------------------------ the recipe slabs
export function slabsPage(k, root, row, btn, el) {
  const C = k.C, found = C.checkSlabs(k.game.ledger), open = k.slab;
  root.insertBefore(el('div', 'ck-line', open ? 'A cracked slab. Each blank line is hinted; tap a blank to choose the move that belongs there.' : 'Cracked recipe slabs turn up as you cook. Mend one and the recipe is yours.'), root.querySelector('.ck-main'));
  if (!open) {
    for (const id of found) { const S = slabOf(id), D = dishFor(S.family, S.addin), done = C.slabState(id) === 'mended';
      btn(done ? `${D.label} · MENDED` : `${D.label} · ${S.line}`, () => { k.slab = { id, picks: [] }; k.show('slabs'); }, done ? 'on' : ''); }
    if (!found.length) k.tell('No slab has turned up yet. Cook a few dishes.');
    btn('BACK', () => k.show('choose'), 'big');
  } else {
    const S = slabOf(open.id), lines = slabLines(S), choices = slabChoices(S), known = []; let b = 0;
    if (k.tellEl) k.tellEl.style.whiteSpace = 'pre-line';
    lines.forEach((l, i) => {
      if (!l.blank) { known.push(`${i + 1}. ${MOVES[l.move].label} — ${l.hint}`); return; }
      const at = b++, pick = open.picks[at];
      btn(`${i + 1}. ${pick ? MOVES[pick].label : '[ ? ]'} — ${l.hint}`, () => { open.picks[at] = choices[(choices.indexOf(pick) + 1) % choices.length]; k.show('slabs'); }, pick ? 'on' : '');
    });
    if (known.length) k.tell(known.join('\n'));
    btn('MEND', () => {
      const n = lines.filter((l) => l.blank).length; if (open.picks.filter(Boolean).length < n) return k.tell('Fill every blank first.');
      const r = C.mend(open.id, open.picks);
      if (r?.ok) { k.slab = null; k.show('slabs'); k.tell('The slab is whole. The recipe is yours.'); } else k.tell(`${r?.right ?? 0} of ${r?.total ?? n} lines fit. Try another order.`);
    }, 'big');
    btn('BACK', () => { k.slab = null; k.show('slabs'); });
  }
}
