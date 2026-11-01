// ---------------------------------------------------------------------------------------
// THE COOKING STATION'S WINDOW: Spirit Cooking played at the hearth (docs/plans/SPIRIT-COOKING.md 4, 5, 8; the rules progress/cooking/).
// Bread first, as ruled: choose an add-in from the Pneuka Box (or none), then KNEAD (fold and push in time; stretch a piece to read
// the windowpane), PROOF (left on the game clock; poke it to read the dent), BAKE (steam it early; knock it to hear it hollow; take
// it out at the colour), then TASTE and ADJUST (a spoon, then one of salt, acid, fat or heat), and SERVE. Each move's tell is drawn on
// the window's canvas and said in words; no number is shown until the dish is served (the plan's rule: the tell is the interface).
//
// A placeholder look on the index window's page (feedback/indexmenu.js showPage), its classes `ck-*` for Calissa's dress; the canvas
// draws the dough, the loaf and their tells plainly. Every control is a button (a phone has no Space); Space is the knead's beat on a
// keyboard. The proof keeps on the game clock with the window shut (progress/cooking/cooking.js startProof): come back and poke it.
//
// Prior art: Cooking Mama (one gesture a step, the dish their average), Rhythm Heaven (a beat kept by ear and eye), the windowpane and
// poke tests and the hollow knock (every bread book: Hamelman 2004, Forkish 2012), Salt Fat Acid Heat (taste, then adjust), Breath
// of the Wild (an ingredient's nature leans the dish).
//
//   const k = new Kitchen(game)   .open()   .update(dt)   .step   .close()
// ---------------------------------------------------------------------------------------
import { MOVES, scoreOf, tellAt } from '../../progress/cooking/moves.js';
import { FAMILIES, dishFor, serve, GRADES } from '../../progress/cooking/dishes.js';
import { tasteOf, balanceOf, ADJUST, INGREDIENTS } from '../../progress/cooking/flavour.js';
import { itemOf } from '../../pneuka/items.js';
import { COLOR } from '../../progress/weather.js';

const CSS = `
.ck{display:flex;flex-direction:column;gap:8px;width:min(700px,80vw);max-width:100%;box-sizing:border-box}
.ck-main{display:flex;gap:12px;align-items:flex-start}
.ck-side{display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
.ck-canvas{flex:1.2;min-width:0;width:100%;max-width:560px;max-height:46vh;aspect-ratio:2.4;object-fit:contain;background:#1d1410;border-radius:10px;border:2px solid #6a4030}
@media (max-height:520px){.ck-line{font-size:12px}.ck-canvas{max-height:40vh}.ck-b{min-height:44px}}
.ck-tell{font-style:italic;min-height:2.6em;color:#f2e2c8}
.ck-row{display:flex;flex-wrap:wrap;gap:8px}
.ck-b{min-width:80px;min-height:48px;padding:6px 12px;border-radius:9px;border:2px solid #c8925e;background:#5c3424;color:#fbeedd;font:600 15px system-ui;cursor:pointer;touch-action:manipulation}
.ck-b.on{background:#c8925e;color:#2a160e}.ck-b:disabled{opacity:.4;cursor:default}
.ck-b.big{min-width:120px;min-height:60px;font-size:17px}
.ck-line{color:#d9c0a0;font-size:14px}
.ck-done{font:700 22px system-ui;color:#ffd36a;letter-spacing:.06em}
`;

export class Kitchen {
  constructor(game) { this.game = game; this.step = null; this.st = null; this.styled = false; this.keyFn = (e) => this.key(e); }
  get C() { return this.game.cooking; }
  get menu() { return this.game.indexMenu || this.game.course?.menu; }
  say(s) { this.game.log?.say('info', s, { key: 'cook.use', throttle: 1 }); }

  open() {
    if (!this.C || !this.menu?.showPage) return;
    if (!this.styled) { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); this.styled = true; }
    if (this.st?.served) this.st = null; // (a dish already served is done with)
    if (this.C.proofing) return this.show('proof');
    this.show('choose');
  }
  close() { removeEventListener('keydown', this.keyFn, true); this.step = null; if (this.menu?.page?.name === 'hearth') this.menu.close(); }

  /** One step's page: the canvas, the tell, the step's buttons. */
  show(step) {
    this.step = step; removeEventListener('keydown', this.keyFn, true);
    if (step === 'knead') addEventListener('keydown', this.keyFn, true);
    this.menu.showPage('hearth', (im, el) => {
      const root = el('div', 'ck'); im.appendChild(root);
      const head = { choose: 'BREAD', knead: MOVES.knead.label, proof: MOVES.proof.label, bake: MOVES.bake.label, taste: 'TASTE AND ADJUST', served: 'SERVED' }[step];
      root.appendChild(el('div', 'grp', head));
      if (MOVES[step]?.line) root.appendChild(el('div', 'ck-line', MOVES[step].line));
      const main = el('div', 'ck-main'), side = el('div', 'ck-side'); root.appendChild(main); // (the drawing beside its controls: a phone held sideways has no height for both stacked)
      this.cv = document.createElement('canvas'); this.cv.width = 560; this.cv.height = 234; this.cv.className = 'ck-canvas'; main.appendChild(this.cv); main.appendChild(side);
      this.tellEl = el('div', 'ck-tell', ''); side.appendChild(this.tellEl);
      const row = el('div', 'ck-row'); side.appendChild(row);
      const btn = (t, run, cls = '') => { const b = el('button', `ck-b ${cls}`, t); b.onclick = (e) => { e.stopPropagation(); run(b); }; row.appendChild(b); return b; };
      this[`page_${step}`](root, row, btn, el);
    }, { title: 'THE HEARTH', sub: 'click or tap · F closes' });
  }

  // ------------------------------------------------------------------ choose
  page_choose(root, row, btn, el) {
    const box = this.game.pneuka, have = {};
    for (const s of box?.slots || []) if (s?.id?.startsWith('ing.')) have[s.id.slice(4)] = (have[s.id.slice(4)] || 0) + (s.n || 1);
    this.addin = this.addin && have[this.addin] ? this.addin : null;
    root.insertBefore(el('div', 'ck-line', FAMILIES.bread.line + ' Add one thing from your Pneuka Box to give it a feeling, or bake it plain.'), root.querySelector('.ck-main'));
    const pick = (k) => { this.addin = k; this.show('choose'); };
    btn('PLAIN', () => pick(null), this.addin ? '' : 'on');
    for (const k of Object.keys(have)) btn(`${itemOf(`ing.${k}`)?.name || k} ×${have[k]}`, () => pick(k), this.addin === k ? 'on' : '');
    if (!Object.keys(have).length) root.appendChild(el('div', 'ck-line', 'Creatures drop what a dish can be seasoned with: a creature of a feeling drops that feeling\'s taste.'));
    btn('BEGIN', () => this.begin(), 'big');
    this.draw = () => this.drawDough(0.1, false);
  }
  begin() {
    if (this.addin) { const i = this.game.pneuka?.slots.findIndex((s) => s?.id === `ing.${this.addin}`); if (i >= 0) this.game.pneuka.take(i); }
    this.st = { addin: this.addin, scores: [], hits: [], ruined: false, v: 0, beatT: 0, lastBeat: -1, steamed: 0, taste: null, tasted: false };
    this.show('knead');
  }

  // ------------------------------------------------------------------ knead: a beat
  page_knead(root, row, btn) {
    const M = MOVES.knead;
    btn('KNEAD', () => this.beat(), 'big');
    btn('STRETCH A PIECE', () => { this.stretched = 1.2; this.tell(tellAt(M, this.st.v)); });
    btn('DONE', () => this.finish('knead', this.st.v));
    this.tell('Fold and push in time with the pulse. Space works too.');
    this.draw = () => this.drawDough(this.st.v, true);
  }
  key(e) { if (this.step === 'knead' && e.code === 'Space') { e.preventDefault(); e.stopPropagation(); this.beat(); } }
  beat() {
    const M = MOVES.knead, S = this.st, ph = (S.beatT % M.beat) / M.beat, off = Math.min(ph, 1 - ph); // (0 on the beat .. 0.5 between)
    const on = off < 0.18; S.v = Math.min(1.05, S.v + (on ? M.perBeat : M.offBeat)); S.flash = on ? 1 : 0.4;
    if (S.v >= M.over) { this.tell(tellAt(M, S.v)); this.finish('knead', S.v); }
  }

  // ------------------------------------------------------------------ proof: on the game clock
  page_proof(root, row, btn) {
    const C = this.C;
    if (!C.proofing && this.st) C.startProof(this.st.addin, { score: this.st.scores[0], hit: this.st.hits[0] });
    btn('POKE IT', () => { this.poked = 1.2; this.tell(tellAt(MOVES.proof, C.proofValue())); });
    btn('INTO THE OVEN', () => {
      const v = C.proofValue(), p = C.takeProof(); // (a dough left proofing and come back to: its add-in and the knead's score kept with it)
      if (!this.st) this.st = { addin: p?.addin ?? null, scores: [p?.knead?.score ?? 0.5], hits: [!!p?.knead?.hit], ruined: false };
      this.finish('proof', v);
    }, 'big');
    btn('LEAVE IT', () => this.close());
    this.tell('It rises on the game clock while you do other things: about a game hour to double. Come back and poke it.');
    this.draw = () => { this.lastProof = C.proofValue(); this.drawProof(this.lastProof); };
  }

  // ------------------------------------------------------------------ bake: hold, steam early, take out at the colour
  page_bake(root, row, btn) {
    const M = MOVES.bake, S = this.st; S.v = 0; S.steamed = 0;
    btn('STEAM', () => { if (S.v <= M.steamUntil) { S.steamed = 1; this.tell('A cloud of steam: the crust stays soft while the loaf springs up.'); } else this.tell('Too late for steam: the crust has set.'); });
    btn('KNOCK', () => this.tell(tellAt(M, S.v)));
    btn('TAKE IT OUT', () => this.finish('bake', S.v), 'big');
    this.tell('The oven is hot. Steam it in the first minutes, then watch the crust.');
    this.draw = () => this.drawLoaf(S.v, S.steamed);
  }

  // ------------------------------------------------------------------ taste and adjust
  page_taste(root, row, btn, el) {
    const S = this.st, F = FAMILIES.bread, t = tasteOf([...F.base, ...(S.addin ? [S.addin] : [])]); S.taste = t;
    const B = balanceOf(t);
    btn('TASTE', () => { S.tasted = true; this.tell(B.line); });
    for (const [k, A] of Object.entries(ADJUST)) btn(A.label, () => this.adjust(k, B));
    btn('SERVE AS IT IS', () => this.adjust(null, B), 'big');
    this.tell('A spoon first, then one adjustment, or none.');
    this.draw = () => this.drawLoaf(this.st.lastBake ?? 0.7, this.st.steamed, true);
  }
  adjust(k, B) {
    const S = this.st, right = S.tasted && (k === B.fix || (!k && B.ok));
    if (S.tasted) this.C.tasted(right);
    const res = serve({ family: 'bread', addin: S.addin, scores: S.scores, hits: S.hits, ruined: S.ruined, adjusted: k, rightFix: right && !!k });
    this.C.serve(res); this.served = res; S.served = true; this.show('served');
  }

  // ------------------------------------------------------------------ served
  page_served(root, row, btn, el) {
    const R = this.served, G = GRADES.find((x) => x.id === R.grade);
    root.appendChild(el('div', 'ck-done', `${R.dish.label} · ${G.label}`));
    const D = R.draught;
    root.appendChild(el('div', 'ck-line', D ? `Draught: ${D.feeling.toUpperCase()} at ${Math.round(D.strength * 100)}%, lasting ${D.hold} real seconds. Use the press at the Athanor before it fades.` : 'Dubious. A little Lachryma returns to your pool.'));
    btn('BAKE ANOTHER', () => { this.st = null; this.show('choose'); });
    btn('CLOSE', () => this.close(), 'big');
    this.tell(R.grade === 'true' ? 'True loaf. Every move was at its heart.' : '');
    this.draw = () => this.drawLoaf(this.st?.lastBake ?? 0.7, this.st?.steamed, true);
  }

  // ------------------------------------------------------------------ a move judged
  finish(move, v) {
    const S = this.st, r = scoreOf(MOVES[move], v, this.C.practice(move));
    if (move === 'bake') { if (S.steamed) r.score = Math.min(1, r.score + 0.05); else r.score = Math.max(0, r.score - 0.05); S.lastBake = v; } // (oven spring: steam in the first minutes, the rise a loaf gets or misses)
    S.scores.push(r.score); S.hits.push(r.hit); if (r.ruined) S.ruined = true;
    this.C.moved(move, r, `bread.${S.addin || 'plain'}`);
    if (r.ruined) { this.served = serve({ family: 'bread', addin: S.addin, scores: S.scores, hits: S.hits, ruined: true }); this.C.serve(this.served); S.served = true; return this.show('served'); }
    this.show({ knead: 'proof', proof: 'bake', bake: 'taste' }[move]);
  }
  tell(s) { if (this.tellEl) this.tellEl.textContent = s; }

  update(dt) {
    if (!this.step) return;
    if (this.menu?.page?.name !== 'hearth' || !this.menu.open) { this.step = null; removeEventListener('keydown', this.keyFn, true); return; } // (F closed it)
    const S = this.st, raw = this.game.rawDt ?? dt;
    if (S) { S.beatT = (S.beatT || 0) + raw; S.flash = Math.max(0, (S.flash || 0) - raw * 3); }
    if (this.step === 'bake' && S) { S.v = Math.min(1.02, S.v + MOVES.bake.rate * raw); if (S.v >= MOVES.bake.over) { this.tell(tellAt(MOVES.bake, S.v)); this.finish('bake', S.v); return; } }
    this.stretched = Math.max(0, (this.stretched || 0) - raw); this.poked = Math.max(0, (this.poked || 0) - raw);
    this.draw?.();
  }

  // ------------------------------------------------------------------ the drawings (placeholders: Calissa's to dress)
  ctx() { const x = this.cv?.getContext('2d'); if (x) { x.clearRect(0, 0, 560, 234); } return x; }
  drawDough(v, beat) {
    const x = this.ctx(); if (!x) return;
    const S = this.st || {}, rough = Math.max(0, 1 - v * 1.2), tint = this.addin || S.addin;
    x.fillStyle = '#3a2a20'; x.fillRect(40, 180, 480, 20); // (the board)
    x.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI, r = 90 + rough * 10 * Math.sin(i * 7.3) + (S.flash || 0) * 6; const px = 280 + Math.cos(a) * r * 1.4, py = 180 - Math.sin(a) * r * 0.75; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath();
    x.fillStyle = tint ? mix('#efe0c4', hexOf(INGREDIENTS[tint]?.from), 0.18) : '#efe0c4'; x.fill();
    if (v > 1 - 0.08) { x.strokeStyle = '#8a6a4a'; x.lineWidth = 2; x.stroke(); }
    if (beat) { const M = MOVES.knead, ph = ((S.beatT || 0) % M.beat) / M.beat; x.strokeStyle = `rgba(255,211,106,${1 - ph})`; x.lineWidth = 4; x.beginPath(); x.arc(500, 50, 14 + 22 * ph, 0, Math.PI * 2); x.stroke(); x.fillStyle = '#ffd36a'; x.beginPath(); x.arc(500, 50, 8, 0, Math.PI * 2); x.fill(); }
    if (this.stretched > 0) { // (the windowpane: a stretched piece held to the light; thin enough, it glows; under, it tears; over, it fights)
      const M = MOVES.knead, ok = v >= M.tells[2][0] && v < M.tells[3][0], tear = v < M.tells[2][0];
      x.fillStyle = '#ffeec0'; x.globalAlpha = 0.25; x.fillRect(60, 30, 140, 110); x.globalAlpha = 1;
      x.fillStyle = ok ? 'rgba(255,240,200,0.75)' : 'rgba(230,210,180,0.95)'; x.beginPath(); x.ellipse(130, 85, 55, 42, 0, 0, Math.PI * 2); x.fill();
      if (tear) { x.strokeStyle = '#1d1410'; x.lineWidth = 4; x.beginPath(); x.moveTo(110, 60); x.lineTo(135, 90); x.lineTo(120, 115); x.stroke(); }
    }
  }
  drawProof(v) {
    const x = this.ctx(); if (!x) return;
    const h = 40 + Math.min(1, v / 0.5) * 50 - (v > 0.8 ? (v - 0.8) * 200 : 0);
    x.fillStyle = '#5c3424'; x.fillRect(150, 150, 260, 50); // (the bowl)
    x.fillStyle = '#efe0c4'; x.beginPath(); x.ellipse(280, 150, 120, Math.max(10, h), 0, Math.PI, 0); x.fill();
    if (this.poked > 0) { const back = v < 0.38 ? 1 : v < 0.62 ? 0.5 : 0; const r = 8 * (1 - back * Math.min(1, (1.2 - this.poked) * 2)); x.fillStyle = '#c8b090'; x.beginPath(); x.arc(280, 150 - h * 0.6, Math.max(1, r), 0, Math.PI * 2); x.fill(); }
  }
  drawLoaf(v, steamed, still = false) {
    const x = this.ctx(); if (!x) return;
    const c = v < 0.4 ? mix('#efe0c4', '#d8a860', v / 0.4) : v < 0.72 ? mix('#d8a860', '#8a4a20', (v - 0.4) / 0.32) : v < 1 ? mix('#8a4a20', '#1a1008', (v - 0.72) / 0.28) : '#0e0804';
    if (!still) { x.fillStyle = '#2a1a12'; x.fillRect(80, 40, 400, 170); x.fillStyle = '#ff7a30'; x.globalAlpha = 0.25; x.fillRect(80, 200, 400, 10); x.globalAlpha = 1; }
    const rise = steamed ? 70 : 52;
    x.fillStyle = c; x.beginPath(); x.ellipse(280, 190, 130, rise, 0, Math.PI, 0); x.fill();
    x.strokeStyle = 'rgba(40,20,10,.6)'; x.lineWidth = 3; x.beginPath(); x.moveTo(220, 190 - rise * 0.7); x.lineTo(340, 190 - rise * 0.8); x.stroke(); // (the score)
    if (steamed && v < 0.3 && !still) { x.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(160 + i * 50, 80 + 10 * Math.sin(v * 40 + i), 18, 0, Math.PI * 2); x.fill(); } }
  }
}

const hexOf = (feeling) => `#${(COLOR[feeling] ?? 0xefe0c4).toString(16).padStart(6, '0')}`;
function mix(a, b, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b), t = Math.max(0, Math.min(1, k));
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
