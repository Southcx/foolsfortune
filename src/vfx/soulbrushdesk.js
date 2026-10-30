// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S DESK (working name, Espada's to rule; OVERLAY.md 10.5g and 19.1 to 19.4; board v11, signed off by the owner 2026-10-19:
// "Soul Brush looks much much better now ... please also implement the refired Soul Brush as the new ingame UI"). The Soul Brush's own
// UI, in the overlay's own scene (render/overlayscene.js) at the 480-line present, bottom-right beside the thermometer Lachrimeter where
// every tool's piece stands: a scholar's desk laid in lines, nothing round (the Sondelass's guard is the round metalwork).
//   THE RANGE      a brush rest of seven glazed peaks, right to left in display order (the brush is the left hand's tool: its tip faces
//                  inboard), a feeling not yet awakened a bare dark bisque peak; a cliff and a trough of water at its end, CLEAN
//                  (soulbrushdesk/range.js). The chosen peak risen, the brush in its saddle; the wheel walks it peak to peak (a hop and
//                  a drop of colour); 1 held, a gold ghost brush walks with the flick while the brush waits, and hops there let go
//   THE BRUSH      PAINT tip-down with a drop at its point, MOP lifted tip-up and wrung, crude filling the hairs; the hairs fill from
//                  the tip while LMB is held (the saturation); the source's thread in at the heel: along the haft from the Bottles,
//                  or falling from the weather (OVERLAY.md 19.1: the pick wins, the source shows under it)
//   THE SCROLLS    the hanging scroll holds the club's string (a stroke of 永 a blow, the next a gold ghost, rolled back up as the string
//                  cools), the source's red chop at its foot (intaglio for the Bottles, relief for the weather); in Celestial mode the
//                  piece turns to ink and a handscroll opens leftward, each drawing echoed in its column, read by a film line, its cost
//                  held in a chip until paid (19.3) (soulbrushdesk/scroll.js)
//   THE PLATE      PAINT or MOP (or CELESTIAL), the pick, FROM ... (soulbrushdesk/plate.js); words that are the System's labels, never narration
//   THE LINK       it claims the spiritual link (vfx/spirituallink.js), its end at the brush's cord: each spend from the pool a bead down
//                  it; while PAINT spends the Bottles, or MOP fills them, the link's foot slides down to their valve, the mop's beads
//                  running up it. The Bottles' level never comes onto the desk (19.4)
// It reads, never drives (the Soul Brush: its load, its ring's pick and quick pick, the club's moveset, Celestial mode's canvas and queue;
// the pool's spends; the weather here). It replaces the Soul Brush's radial (the DOM wheel on 1 held and its paint icons, ui/icons/
// paintart.js), retired, not hidden (casebook rule 235). The paint reticle, the jet ring, the shine and the
// Bottle's arc stay world marks. One canvas (two texture pixels a dot) on one plane of the overlay's flat kind: no program of its own.
//
// Prior art, as on a museum label: the mock (Calissa's board v11, r11-soulbrush), ported; the scholar's studio: the brush rest as a
// range of peaks (the bijia, the "brush mountain"; the fudeoki), the brush washer (shanshui, mountain and water), the Song monochromes;
// the hanging scroll (the kakejiku and its mount); the Eight Principles of Yong (永字八法); seal carving's two cuts (baiwen and zhuwen);
// the handscroll (the emakimono); Ōkami's Celestial Brush; FLUDD and the Poltergust (spray and suck); Splatoon's tank on the back;
// Dead Space's diegetic gauges.
//
//   game.soulBrushDesk = new SoulBrushDesk(game)   (main.js, after the tube and the link; it updates itself in the overlay's scene)
//   .state -> { shown, pick, mode, sat, src, string, cel, cols }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayFlat } from './lachrimetertube.js';
import { SEATS, seatCol, C01, sm, oB, lerp, FAIR, D } from './soulbrushdesk/look.js';
import { rangeDraw, brushPose, brushDraw, streamDraw, tipFx, ptOn, BR } from './soulbrushdesk/range.js';
import { scrollDraw, sheetDraw } from './soulbrushdesk/scroll.js';
import { plateDraw, plateRemeasure } from './soulbrushdesk/plate.js';
import { RedrawGate } from './redrawgate.js';

const K = 2;                       // (texture pixels a dot)
const CW = 232, CH = 184;          // (the canvas in dots: the plate and the handscroll to the left, the brush lifted in MOP to the right)
const OX = 178, OY = 172;          // (the range's right foot in the canvas, dots)
const CLEAR = 18, AT = [150, 14];  // (CSS px from the right edge, as the tube's; then the range's right foot in dots: clear of the tube's plinth and its cube plate, up from the bottom)
const PLATE = [-38, -34];          // (the plate's right edge and its foot, dots from the range's foot: beside the hanging scroll)
const MN = ['PAINT', 'MOP'];
const SLAM_COST = 4;               // (the club's slam, tools/soulbrush/club.js SLAM.cost: shown held on the tube while the charge gathers)
const FRAME = 1 / 30;              // (real s between redraws of the canvas while anything moves; at rest only its ambient shimmer does, redrawn at IDLE_HZ: redrawgate.js)
const IDLE_HZ = 10;
const BEAD = { pool: 1.5, valve: 1.5, mop: 2 }; // (Lachryma a bead: a spend from the pool or the Bottles; a mop's gulp up the link)

export class SoulBrushDesk {
  constructor(game) {
    this.game = game; this.S0 = game.overlayScene;
    this.t = 0; this.a = 0; this.shown = false; this.gate = new RedrawGate(30); this.busy = true;
    this.sel = -1; this.hop = null; this.ghostF = null; this.openV = 0; this.wasOpen = false;
    this.md = 0; this.mFrom = 0; this.modeT = 9; this.satV = 0; this.dryFrom = 0; this.dryT = 9; this.workAge = -1;
    this.strokes = []; this.lastHit = -9; this.coolT = 0; this.burstT = 9; this.flickT = 9; this.charging = false;
    this.celV = 0; this.celT = 9; this.celWas = false; this.cols = [];
    this.src = null; this.srcPrev = null; this.srcAge = 9; this.srcKey = ''; this.srcT = 0;
    this.LK = new Set(); this.lkT = 0; this.foot = 0; this.lastHeld = -1; this.accB = 0; this.accV = 0; this.accU = 0; this.beadQ = [];
    this.state = { shown: false, pick: null, mode: 'paint', sat: 0, src: null, string: [], cel: 0, cols: [] };
    this.endFn = (out) => this.linkEnd(out); this.footFn = () => this.foot;
    if (!this.S0) return;
    this.c = document.createElement('canvas'); this.c.width = CW * K; this.c.height = CH * K; this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.generateMipmaps = false; this.tex.minFilter = THREE.LinearFilter;
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: this.tex, depthTest: false, depthWrite: false }));
    this.plane.frustumCulled = false; this.plane.renderOrder = 20;
    this.root = new THREE.Group(); this.root.name = 'soulBrushDesk'; this.root.userData.overlayHidden = true; this.root.add(this.plane);
    this.slot = this.S0.add(this.root, { anchor: 'br', x: 0, y: 0, z: 0, hud: true, update: (dt, slot) => this.update(dt, slot) });
    const on = (n, f) => game.events?.on(n, f);
    on('brush.swing', (e) => this.swung(e));
    on('brush.flick', () => { if (this.shown) this.flickT = 0; });
    on('brush.canvas', (e) => this.canvased(e));
    document.fonts?.addEventListener?.('loadingdone', () => plateRemeasure());
  }

  /** The Soul Brush, drawn and in the hands as the belt says, or null. */
  tool() {
    const g = this.game, B = g.player?.techs?.get?.('soulbrush');
    if (!B || g.belt?.inHand?.id !== 'soulbrush' || B.drawT <= 0.02 || B.drawTarget <= 0 || g.god?.controlling) return null;
    return B;
  }

  /** The link's far end: the brush's cord, in the overlay scene's coordinates. */
  linkEnd(out) {
    if (!this.shown || !this.S) return null;
    const dot = this.dot || 1, p = this.root.position, c = ptOn(this.S.pose, BR.cord);
    return out.set(p.x + c[0] * dot, p.y - c[1] * dot, 0);
  }

  // ---------------------------------------------------------------- each frame it may be drawn
  update(dt, slot) {
    const g = this.game, Bc = document.body.classList, B = this.tool();
    const allowed = !!B && !g.title?.active && !g.rail?.stage?.active && !Bc.contains('cine') && !Bc.contains('bztable-seated');
    this.a = C01(this.a + (allowed ? dt / 0.22 : -dt / 0.16));
    if (!allowed && this.a <= 0) return this.hide();
    this.t += dt;
    if (!this.shown) { this.shown = true; this.root.userData.overlayHidden = false; this.gate.reset(); this.busy = true; this.sel = -1; this.hookPool(); g.spiritualLink?.attach(this, this.endFn, this.footFn); }
    // where it stands: the range's foot CLEAR px and AT dots in from the corner, on the dot grid
    const dot = (this.dot = (slot.view.h || innerHeight) / 480), W = slot.view.w || innerWidth, H = slot.view.h || innerHeight;
    const hx = Math.round((W - CLEAR - AT[0] * dot) / dot) * dot, hy = Math.round((H - AT[1] * dot) / dot) * dot;
    slot.x = hx - W; slot.y = hy - H;
    this.plane.scale.set(CW * dot, CH * dot, 1); this.plane.position.set((CW / 2 - OX) * dot, -(CH / 2 - OY) * dot, 0);
    this.plane.material.opacity = sm(this.a);
    if (B) this.read(dt, B);
    this.link(dt);
    if (!B) this.busy = true; // (fading out)
    if (this.gate.rate(dt, this.busy, IDLE_HZ) && this.S) this.paint();
  }

  hide() {
    if (!this.shown) return;
    this.shown = false; this.root.userData.overlayHidden = true; this.beadQ.length = 0; this.cols = []; this.strokes = []; this.hop = null;
    this.game.lachrimeterTube?.reserve?.('soulbrush.slam', 0); this.charging = false;
    this.game.spiritualLink?.detach(this); this.state.shown = false;
  }

  // ---------------------------------------------------------------- the bus and the pool
  swung(e) {
    if (!this.shown) return;
    if (e.slam) { this.burstT = 0; return; }
    if (e.move === 'dive' || this.strokes.length >= 4 || this.coolT > 0) this.strokes = []; // (the dive opens a string of its own)
    this.strokes.push({ k: e.move, t: this.t }); this.lastHit = this.t; this.coolT = 0;
  }
  canvased(e) {
    if (e.open) { this.cols = []; return; }
    const B = this.game.player?.techs?.get?.('soulbrush'); if (B) this.resolve(B.celestial); // (a drawing read as the brush lifts: celestial.js exit)
    let j = 0; for (const c of this.cols) if (c.st === 'take') { c.payAt = this.t + 0.05 + j * 0.16; j++; } // (each drawing runs in order: celestial.js exit)
  }
  /** The pool's spends for the brush (its tags all begin "brush"): a bead down the link; a refusal, the link's slack. */
  hookPool() {
    const pool = this.game.lachryma; if (this.hooked === pool || !pool?.on) return; this.hooked = pool;
    const mine = (e) => this.shown && /^brush/.test(e.tag || '');
    pool.on('spend', (e) => {
      if (!mine(e)) return;
      if (!e.partial) { this.spend(e.amount); return; }
      this.accB += e.amount; if (this.accB >= BEAD.pool) { this.accB -= BEAD.pool; this.spend(BEAD.pool); }
    });
    pool.on('denied', (e) => { if (mine(e)) this.game.spiritualLink?.slack(); });
  }
  spend(amount, rev = false) { if (this.beadQ.length < 4) this.beadQ.push({ amount, rev, age: 0 }); }

  // ---------------------------------------------------------------- the tool, read
  read(dt, B) {
    const g = this.game, L = B.load, R = B.radial, C = B.club, t = this.t;
    if ((this.lkT -= dt) <= 0) { this.lkT = 0.25; this.LK = new Set(SEATS.slice(0, 7).filter((s) => !L.known(s.id)).map((s) => s.id)); }
    // the seat: what the paint is refined into (load.js aspect: the pick wins), or CLEAN
    // 1 held: the quick pick; the ghost brush walks with the flick while the brush waits, and hops there let go
    const open = !!R.open && R.ghost >= 0, quick = this.wasOpen && !open;
    if (open) { this.ghostF = this.ghostF == null ? R.ghost : this.ghostF + (R.ghost - this.ghostF) * Math.min(1, dt * 18); this.openV = C01(this.openV + dt / 0.12); }
    else { this.ghostF = null; this.openV = C01(this.openV - dt / 0.15); }
    this.wasOpen = open;
    const lay = L.cleaning ? 'clean' : L.aspect, sel = Math.max(0, SEATS.findIndex((s) => s.id === lay));
    if (this.sel < 0) { this.sel = sel; this.hop = null; }
    else if (sel !== this.sel) { const from = this.hop ? Math.round(this.selF ?? this.sel) : this.sel; this.hop = { from, to: sel, t0: t, quick }; this.sel = sel; }
    const S = { LK: this.LK, t, pickId: lay };
    this.walk(S);
    S.ghostF = open ? this.ghostF : null; S.open = sm(this.openV);
    // the mode (a tap of 1 or 2): the brush lifts and turns over 0.35 real s, the plate rolls
    const md = L.mode === 'mop' ? 1 : 0; if (md !== this.md) { this.mFrom = this.md; this.md = md; this.modeT = 0; } this.modeT += dt;
    S.mode = md; S.mp = lerp(this.mFrom, md, sm(this.modeT / 0.35)); S.word = { a: MN[this.mFrom], b: MN[md], p: sm((this.modeT - 0.05) / 0.3) };
    // LMB held on the ground: the hairs fill from the tip; working; let go, they dry over 0.3 real s
    if (L.busy) { this.satV = Math.max(0, L.sat); this.dryFrom = this.satV; this.dryT = 0; } else { this.dryT += dt; this.satV = this.dryFrom * (1 - sm(this.dryT / 0.3)); }
    const work = L.busy && L.working; this.workAge = work ? (this.workAge < 0 ? 0 : this.workAge + dt) : -1;
    S.sat = this.satV; S.work = work; S.workAge = this.workAge; S.loadMode = md;
    this.string(S, C, dt);
    this.celestial(S, B, dt);
    this.source(S, L, dt);
    this.bottles(L, work, md);
    S.pose = brushPose(S);
    // busy: anything that moves by more than the ambient shimmer (the pot's shine, the chosen peak's film, the plate's rim); at rest the canvas redraws slowly
    this.busy = !!(this.hop || open || this.openV > 0 || this.modeT < 0.6 || this.dryT < 0.4 || this.satV > 0 || work || this.strokes.length || S.flick >= 0 || S.burst >= 0 || S.charge >= 0
      || S.cel > 0 || this.celT < 0.5 || this.cols.length || this.srcAge < 0.6 || S.shake || S.dot || S.str.next !== 'c1');
    this.S = S;
    Object.assign(this.state, { shown: this.shown, pick: lay, mode: L.mode, sat: +S.sat.toFixed(2), src: S.src ? (S.src.w ? `weather:${S.src.id || 'fair'}` : `bottles:${S.src.id}`) : null, string: S.str.strokes.map((s) => s.k), cel: +S.cel.toFixed(2), cols: S.cols.map((c) => `${c.st}${c.name ? ':' + c.name : ''}`) });
  }

  /** The brush's walk to its seat: a hop a peak (0.16 real s; a dark peak 0.24, higher, a shiver), or the quick pick's one hop (0.2). */
  walk(S) {
    const h = this.hop; S.shake = null; S.dot = null;
    if (!h) { S.selF = this.sel; S.seaFrom = S.seaTo = seatCol(this.sel); S.seaFill = 1; return; }
    const u = this.t - h.t0, n = Math.abs(h.to - h.from), k = n > 3 ? 3 / n : 1, dir = Math.sign(h.to - h.from);
    let T = 0, f = null;
    if (h.quick) { T = 0.2; if (u < T) f = lerp(h.from, h.to, oB(u / 0.2, 1.4)); }
    else for (let s = h.from + dir; dir && (dir > 0 ? s <= h.to : s >= h.to); s += dir) {
      const lk = this.LK.has(SEATS[s].id), d = (lk ? 0.24 : 0.16) * k;
      if (u < T + d) { const p = (u - T) / d; f = s - dir + dir * oB(p, 1.9); if (lk) S.shake = { i: s, amp: Math.sin(C01(p) * Math.PI) }; break; }
      T += d;
    }
    if (f != null) { S.selF = this.selF = f; S.seaFrom = S.seaTo = seatCol(h.from); S.seaFill = 1; return; }
    S.selF = this.selF = h.to; S.seaFrom = seatCol(h.from); S.seaTo = seatCol(h.to); S.seaFill = C01((u - T + 0.05) / 0.35);
    if (u - T < 0.9) S.dot = { i: h.to, age: u - T }; else this.hop = null; // (landing, a drop of the new colour falls from the tip)
  }

  /** The club's string on the hanging scroll: the strokes laid, the next a ghost (the moveset's place, read), cooled and rolled up. */
  string(S, C, dt) {
    const t = this.t, M = C.moves;
    const charging = C.charge >= 0;
    if (charging && !this.charging) this.strokes = []; // (the slam's charge owns the scroll)
    if (charging !== this.charging) this.game.lachrimeterTube?.reserve?.('soulbrush.slam', charging ? SLAM_COST : 0);
    this.charging = charging;
    if (this.strokes.length && t - this.lastHit > 1.1 && !C.busy) { this.coolT += dt; if (this.coolT >= 0.5) { this.strokes = []; this.coolT = 0; } }
    const cool = this.strokes.length ? C01(this.coolT / 0.5) : 0;
    let next = null, rest = false;
    if (!this.strokes.length) { next = 'c1'; rest = true; }
    else if (cool <= 0) { const pl = M?.stringPlace?.(); if (pl?.branch && pl.branch.next >= 0) next = pl.branch.to[pl.branch.next]; else if (pl && pl.struck > 0 && pl.next > 0) next = M.string?.[pl.next] ?? null; }
    S.str = { strokes: this.strokes.map((s) => ({ k: s.k, age: t - s.t })), cool, next, rest };
    S.tilt = 0; for (const s of S.str.strokes) if (s.age < 0.3) S.tilt = ({ c1: 9, c2: -9, c3: 15, spin: 18, dive: 11 }[s.k] || 0) * D * Math.sin(C01(s.age / 0.3) * Math.PI) * (1 - s.age / 0.3);
    S.charge = charging ? C01(C.charge / 1.1) : -1;
    this.burstT += dt; S.burst = this.burstT < 0.6 ? this.burstT : -1;
    this.flickT += dt; S.flick = this.flickT < 0.45 ? this.flickT : -1;
    if (S.flick >= 0) S.tilt += -14 * D * Math.sin(C01(S.flick / 0.3) * Math.PI);
  }

  /** Celestial mode: the piece to ink; a column a drawing on the canvas (tools/soulbrush/canvas.js), read, taken or run; the cost held. */
  celestial(S, B, dt) {
    const Ce = B.celestial, on = !!Ce.active, cv = B.canvas;
    if (on !== this.celWas) { this.celT = 0; this.celWas = on; } this.celT += dt;
    this.celV = C01(this.celV + (on ? dt : -dt) / 0.35); S.cel = sm(this.celV); S.celOpen = on;
    if (on && cv?.wet?.strokes?.length && !this.cols.some((c) => c.g === cv.wet)) this.cols.push({ g: cv.wet, strokes: cv.wet.strokes, st: 'read', age: 0, atAge: 0, name: null, cost: 0, paidAge: -1, payAt: -1 });
    for (const c of this.cols) { c.age += dt; c.atAge += dt; }
    this.resolve(Ce);
    for (const c of this.cols) if (c.payAt >= 0 && this.t >= c.payAt) c.paidAge = this.t - c.payAt;
    if (!on && S.cel <= 0) this.cols = [];
    S.cols = this.cols.slice(-3);
    S.names = this.cols.filter((c) => c.st === 'take' && c.paidAge < 0 && c.name).map((c) => c.name);
    const md = S.mode;
    if (S.cel > 0) S.word = on ? { a: MN[md], b: 'CELESTIAL', p: sm(this.celT / 0.3) } : { a: 'CELESTIAL', b: MN[md], p: sm(this.celT / 0.3) };
  }

  /** Each drawing read since: taken (its name and the cost held, the queue's last plan), run, or gone (a dot that marked, a quiet fade). */
  resolve(Ce) {
    for (let i = this.cols.length - 1; i >= 0; i--) {
      const c = this.cols[i]; if (c.st !== 'read' || c.g.state === 'wet') continue;
      if (c.g.state === 'take') { const plan = Ce.queue[Ce.queue.length - 1]; c.st = 'take'; c.atAge = 0; c.name = plan?.name || null; c.cost = plan?.held ?? plan?.cost ?? 0; }
      else if (c.g.state === 'run') { c.st = 'run'; c.atAge = 0; }
      else this.cols.splice(i, 1);
    }
  }

  /** Where the paint comes from (OVERLAY.md 19.1): the Bottles' grade while they hold some, else the weather's feeling here. */
  source(S, L, dt) {
    if ((this.srcT -= dt) <= 0 || !this.src) {
      this.srcT = 0.25;
      let I;
      if (L.bottle && L.held > 0.5 && L.grade) I = { w: false, id: L.grade };
      else { const a = this.game.weather?.here?.(L.P?.pos)?.aspect || null; I = { w: true, id: a }; }
      I.col = I.id ? seatCol(SEATS.findIndex((s) => s.id === I.id)) : FAIR;
      const key = `${I.w ? 'w' : 'b'}:${I.id}`;
      if (key !== this.srcKey) { this.srcPrev = this.src; this.src = I; this.srcKey = key; this.srcAge = this.srcPrev ? 0 : 9; }
    }
    this.srcAge += dt; S.src = this.src; S.srcPrev = this.srcPrev; S.srcAge = this.srcAge; S.srcMix = sm(this.srcAge / 0.35);
  }

  /** The Bottles through the link: PAINT spending them a bead down it from their valve, MOP filling them a bead up it; the foot slides. */
  bottles(L, work, md) {
    const held = L.held || 0, dh = this.lastHeld < 0 ? 0 : held - this.lastHeld; this.lastHeld = held;
    if (work && md === 0 && dh < 0) { this.accV -= dh; if (this.accV >= BEAD.valve) { this.accV -= BEAD.valve; this.spend(BEAD.valve); } }
    if (work && md === 1 && dh > 0) { this.accU += dh; if (this.accU >= BEAD.mop) { this.accU -= BEAD.mop; this.spend(BEAD.mop, true); } }
    const want = work && (md === 1 || (L.paintFrom === 'bottle' && held > 0.01)) ? 1 : 0;
    this.foot = C01(this.foot + Math.sign(want - this.foot) * Math.min(Math.abs(want - this.foot), (this.game.rawDt || 1 / 60) / 0.25));
  }

  // ---------------------------------------------------------------- the canvas
  paint() {
    const x = this.x, S = this.S, t = this.t;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.c.width, this.c.height); x.setTransform(K, 0, 0, K, OX * K, OY * K);
    x.lineJoin = 'round';
    scrollDraw(x, S, t);
    rangeDraw(x, S, t);
    if (S.ghostF != null) brushDraw(x, S, t, brushPose(S, S.ghostF), true);
    brushDraw(x, S, t, S.pose, false); streamDraw(x, S, t, S.pose); tipFx(x, S, t, S.pose);
    sheetDraw(x, S, t);
    plateDraw(x, S, t, PLATE[0], PLATE[1]);
    this.tex.needsUpdate = true;
  }

  // ---------------------------------------------------------------- the spiritual link: the spends down it, the mop's up it
  link(dt) {
    const L = this.game.spiritualLink, Q = this.beadQ;
    for (let i = Q.length - 1; i >= 0; i--) {
      const q = Q[i]; q.age += dt;
      if (L?.state?.shown) { L.bead({ amount: q.amount, rev: q.rev, dur: q.rev ? 0.14 : 0.1 }); Q.splice(i, 1); }
      else if (q.age > 0.5) Q.splice(i, 1); // (the tube rises when the pool moves: the bead waits for it, a moment)
    }
  }
}
