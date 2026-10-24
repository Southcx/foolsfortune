// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S RELIQUARY (OVERLAY.md 19.5 to 19.8; board v10, signed off by the owner 2026-10-19 in its B orientation: "the 'B'
// orientation for the lockheart UI is the correct one, because then it feels like the lockheart is taking in Lachryma even before it
// reaches your lachrimeter"). The Lockheart's own UI, in the overlay's own scene (render/overlayscene.js) at the 480-line present,
// bottom-right beside the thermometer Lachrimeter where every tool's piece stands: the coffin as a reliquary hung on its chain from the
// hand's point, hanging straight down, parallel to the tube (the owner, 2026-10-19), its right side (the window) toward the tube; it
// does not swing with the Lockheart's blows.
//   WHAT IT SHOWS   which coffin is worn (its lacquer, trim and lid emblem); the fill against its measure and past it to twice full (the
//                   window, and the count plate "42 /40"); the ghost of its odds on the lid; can it open now (the padlock, gold and its
//                   shackle sprung only when every reason holds); the Possibilikeys on the ring below in ring order, each with its
//                   cracks and its break chance as a published rate (the tags); the hoover's draw (a vortex in the window, motes drawn
//                   in at the head); the flail's string (three links of the chain, lit per blow); and the Opening: RMB held shows the
//                   wheel of odds still with each sector's rate and a gold arc filling to the open (0.5 real s, T.tech.lockheart.openHold);
//                   held through, the keys turn (held, spent, broken), the lid swings open and the wheel turns in lock step with the
//                   Lockheart's own (tools/lockheart/wheel.js: one angle), landing, its power, and an ECHO's again
//   THE LINK        it claims the spiritual link (vfx/spirituallink.js) while it stands, its end at the window. The Lockheart spends
//                   nothing from the pool: the DRINK (the overflow, worn and the pool full) runs down the link like a spend, three slow
//                   pulled beads, the window rising as they land; the GULP (its parry swallowing a shot into the pool) is the link's one
//                   true reverse, one bright bead coffin to bulb, the lid snapping like a mouth
// It reads, never drives (game.lockheart, the Pneuka Box's keyring and its uses, the moveset's string, the Lockheart's wheel). It replaces
// the old padlock and sockets that stood beside the 3D coffin, retired, not hidden (the owner,
// 2026-10-19; casebook rule 235). The hoover's reach on the ground stays a world mark (vfx/lockheartreach.js).
// One canvas (two texture pixels a dot) on one plane of the overlay's flat kind: no program of its own.
//
// Prior art, as on a museum label: the mock (Calissa's board v10, r10-lockheart), ported; the reliquary and the monstrance, the mourning
// locket and the coffin pendant (Victorian memento mori); the 19th century's hexagonal coffin and Castlevania's; the thurible on its
// chain and Castlevania's Vampire Killer; the padlock and open shackle; the split keyring and the skeleton key; Kintsugi and crazed glaze;
// the prize wheel, the gacha's published rates, Persona's arcana roulette, a slot reel; Balatro's and Slay the Spire's stacking
// modifiers for the ring's order; Luigi's Mansion's Poltergust; Dead Space's diegetic gauges (a count on the thing itself).
//
//   game.lockheartReliquary = new LockheartReliquary(game)   (main.js, after the tube and the link; it updates itself in the overlay's scene)
//   .state -> { shown, heart, charge, fill, canOpen, keys: [{ id, uses, st }], wheel: null | 'peek' | 'spin', flail: { st, next } }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayFlat } from './lachrimetertube.js';
import { T } from '../core/config.js';
import { COLOR } from '../progress/weather.js';
import { HEARTS, oddsOf, rates } from '../tools/lockheart/table.js';
import { C01, sm, lerp, heartLook, keyLook } from './lockheartreliquary/look.js';
import { drawPiece } from './lockheartreliquary/piece.js';
import { RedrawGate } from './redrawgate.js';
import { skinPalette } from './toolskinwear.js';

const K = 2;                   // (texture pixels a dot)
const CW = 224, CH = 232;      // (the canvas in dots: room over the coffin, the wheel and its plates, the ring and its tags)
const OX = 144, OY = 104;      // (the hand's point in the canvas, dots)
const CLEAR = 18, HAND = [85, 152]; // (CSS px from the right edge as the tube's; then the hand's point in dots: left of the tube's bulb, and up from the bottom)
const PHI0 = 0, SCALE = 1.3; // (the chain's rest angle: straight down, parallel to the Lachrimeter, the owner 2026-10-19; dots a unit of the coffin)
const KT = 0.18, DUR = 2.1, HOLD = 0.9; // (real s: a Possibilikey's turn at the Opening; the wheel's spin and its hold, tools/lockheart/wheel.js)
const DRINK = { dur: 0.35, gap: 0.07, colour: 0x7f5cf0 }, GULP = { dur: 0.12, colour: 0xffe296, amount: 6 };
/** The coffin's look in the Lockheart's skin (vfx/toolskins.js): its body and trim the skin's, its emblem the heart's own. */
const skinnedLook = (L) => { const P = skinPalette('lockheart'); return P ? { ...L, col: P.body || L.col, trim: P.trim || L.trim } : L; };
const IDLE_HZ = 10;            // (redraws a real second at rest, when only the ambient shimmer moves; 30 while anything else does: redrawgate.js)

export class LockheartReliquary {
  constructor(game) {
    this.game = game; this.S0 = game.overlayScene;
    this.t = 0; this.a = 0; this.shown = false; this.gate = new RedrawGate(30); this.busy = true;
    this.snapT = 9; this.drainT = 9; this.echoT = 9; this.rippleT = 9; this.fullT = 9; this.wasOpen = false;
    this.pend = 0; this.shownCharge = -1; this.lid = 0;
    this.F = { lit: 0, hitAge: 9, cooling: false, cool: 0 };
    this.rot = null; this.ghostA = null; this.ghostB = null; this.ghostT = 9; this.ghostSig = ''; this.oddsT = 0; this.odds = null;
    this.opening = null; this.close = null; this.peek = null; this.spinQ = null; this.fromPeek = false; this.prevOut = null; this.hold = 0;
    this.beadQ = []; this.landing = [];
    this.state = { shown: false, heart: null, charge: 0, fill: 0, canOpen: false, keys: [], wheel: null, flail: { st: 0, next: 0 } };
    this.endFn = (out) => this.linkEnd(out);
    if (!this.S0) return;
    this.c = document.createElement('canvas'); this.c.width = CW * K; this.c.height = CH * K; this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.generateMipmaps = false; this.tex.minFilter = THREE.LinearFilter;
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: this.tex, depthTest: false, depthWrite: false }));
    this.plane.frustumCulled = false; this.plane.renderOrder = 20;
    this.root = new THREE.Group(); this.root.name = 'lockheartReliquary'; this.root.userData.overlayHidden = true; this.root.add(this.plane);
    this.slot = this.S0.add(this.root, { anchor: 'br', x: 0, y: 0, z: 0, hud: true, update: (dt, slot) => this.update(dt, slot) });
    const on = (n, f) => game.events?.on(n, f);
    // (the piece does not swing with the Lockheart's blows: the owner, 2026-10-19; the flail's string still lights its links)
    on('move.parry', (e) => { if (e.how === 'gulp' && e.what === 'shot' && this.shown) { this.snapT = 0; this.beadQ.push({ amount: e.amount ?? GULP.amount, colour: GULP.colour, dur: GULP.dur, rev: true, wait: 0.1, age: 0 }); } });
    on('lockheart.drain', (e) => { this.drainT = 0; const c = COLOR[e.feeling]; this.drainCol = c != null ? '#' + c.toString(16).padStart(6, '0') : '#b49be6'; }); // (the drained creature's feeling, else the weather's; plain Lachryma the Mind's violet)
    on('lockheart.echo', () => { this.echoT = 0; });
    on('lockheart.outcome', (e) => { this.prevOut = e.outcome; });
    on('lockheart.keyring', (e) => this.turned(e.keys || []));
    on('lockheart.preview', (e) => { this.peek = { R: e.rates || [], t0: this.t }; });
    on('lockheart.open', (e) => this.opened(e));
  }

  /** The Lockheart, drawn and in the hands as the belt says, or null. */
  tool() {
    const g = this.game, L = g.lockheart;
    if (!L || g.belt?.inHand?.id !== 'lockheart' || L.drawT <= 0.02 || L.drawTarget <= 0 || g.god?.controlling) return null;
    return L;
  }

  /** The link's far end: the coffin's window, in the overlay scene's coordinates. */
  linkEnd(out) {
    const A = this.anchor; if (!this.shown || !A) return null;
    const dot = this.dot || 1, p = this.root.position;
    return out.set(p.x + (A[0] - OX) * dot, p.y - (A[1] - OY) * dot, 0);
  }

  // ---------------------------------------------------------------- each frame it may be drawn
  update(dt, slot) {
    const g = this.game, B = document.body.classList, L = this.tool();
    const allowed = !!L && !g.title?.active && !g.emocean?.stage?.active && !B.contains('cine') && !B.contains('bztable-seated');
    this.a = C01(this.a + (allowed ? dt / 0.22 : -dt / 0.16));
    if (!allowed && this.a <= 0) return this.hide();
    this.t += dt;
    if (!this.shown) { this.shown = true; this.root.userData.overlayHidden = false; this.gate.reset(); this.busy = true; this.shownCharge = -1; g.spiritualLink?.attach(this, this.endFn); this.hookDrink(); }
    // where it stands: the hand's point CLEAR px and HAND dots in from the corner, on the dot grid
    const dot = (this.dot = (slot.view.h || innerHeight) / 480), W = slot.view.w || innerWidth, H = slot.view.h || innerHeight;
    const hx = Math.round((W - CLEAR - HAND[0] * dot) / dot) * dot, hy = Math.round((H - HAND[1] * dot) / dot) * dot;
    slot.x = hx - W; slot.y = hy - H;
    this.plane.scale.set(CW * dot, CH * dot, 1); this.plane.position.set((CW / 2 - OX) * dot, -(CH / 2 - OY) * dot, 0);
    this.plane.material.opacity = sm(this.a);
    const lh = L || g.lockheart;
    if (lh) this.read(dt, lh);
    this.link(dt);
    if (!lh) this.busy = true;
    if (this.gate.rate(dt, this.busy, IDLE_HZ) && this.S) this.paint();
  }

  hide() {
    if (!this.shown) return;
    this.shown = false; this.root.userData.overlayHidden = true; this.beadQ.length = 0; this.landing.length = 0; this.pend = 0; this.opening = null; this.close = null; this.rot = null;
    this.game.spiritualLink?.detach(this); this.state.shown = false;
  }

  /** The overflow drunk (lachryma.js 'overflow', the Lockheart takes 0.8 of it while worn): three pulled beads down the link. */
  hookDrink() {
    const pool = this.game.lachryma; if (this.hooked === pool || !pool?.on) return; this.hooked = pool;
    pool.on('overflow', (e) => {
      const L = this.game.lockheart; if (!this.shown || e.source === 'lockheart' || !L?.worn) return;
      const amt = Math.max(0, Math.min(e.amount * 0.8, (L.cap ?? 100) - (L.charge - this.pend))); if (amt <= 0) return;
      this.pend += amt;
      for (let j = 0; j < 3; j++) this.beadQ.push({ amount: amt / 3, colour: DRINK.colour, dur: DRINK.dur, rev: false, wait: 0.15 + j * DRINK.gap, age: 0, drink: amt / 3 });
    });
  }

  // ---------------------------------------------------------------- the tool, read
  read(dt, L) {
    const g = this.game, box = g.pneuka, heart = L.heart || 'heart.plain', look = skinnedLook(heartLook(heart)), fill = L.fill;
    // the fill: eased so the count rolls, held back by a drink still on the link
    const target = Math.max(0, L.charge - this.pend);
    this.shownCharge = this.shownCharge < 0 ? target : this.shownCharge + (target - this.shownCharge) * Math.min(1, dt * 8);
    // can it open: a coffin, full, a Possibilikey on the ring, and for the Warden's a Figment laid low (its odds asked five times a second)
    const ids = box?.fitted('keys') || [], uses = box?.uses?.keys || [];
    if (!this.rot && !this.opening) { const sig = ids.join(','); if (sig !== this.ringSig) { this.ringSig = sig; this.ringWas = ids.slice(); } } // (the order before a turn)
    if ((this.oddsT -= dt) <= 0) { this.oddsT = 0.2; this.odds = L.odds?.() || null; }
    const summon = HEARTS[heart]?.mode === 'summoning', canNow = !!L.heart && ids.length > 0 && L.full && (!summon || !!this.odds);
    const opening = !!this.opening;
    if (canNow && !this.wasOpen) this.fullT = 0; this.wasOpen = canNow; this.fullT += dt;
    // the ghost on the lid: the odds as the ring stands, re-formed over 0.3 real s when the ring turns
    const ghost = summon ? this.odds?.R || [] : rates(oddsOf(heart, ids).table), gsig = `${heart}|${ids.join(',')}|${summon ? ghost.map((r) => r.p.toFixed(2)).join(',') : ''}`;
    if (gsig !== this.ghostSig) { this.ghostA = this.ghostB || ghost; this.ghostB = ghost; this.ghostT = this.ghostSig ? 0 : 9; this.ghostSig = gsig; }
    this.ghostT += dt;
    const gf = sm((this.ghostT - 0.1) / 0.3), GA = this.ghostA, gh = gf >= 1 || !GA ? ghost : ghost.map((r) => ({ id: r.id, p: lerp(GA.find((z) => z.id === r.id)?.p ?? r.p, r.p, gf) }));
    // the flail's string: the moveset's place, read (a struck blow runs its light down the chain; the string left, it cools back)
    const F = this.F, place = L.moves?.stringPlace?.() || { struck: 0, next: 0 }, st = Math.min(3, place.struck | 0);
    F.hitAge += dt;
    if (st > F.lit || (st > 0 && F.cooling)) { F.lit = st; F.hitAge = 0; F.cooling = false; F.cool = 0; }
    else if (st < F.lit && !F.cooling) { F.cooling = true; F.cool = 0; }
    if (F.cooling) { F.cool = C01(F.cool + dt / 0.5); if (F.cool >= 1) { F.cooling = false; F.cool = 0; F.lit = st; } }
    this.snapT += dt; this.drainT += dt; this.echoT += dt; this.rippleT += dt;
    // the wheel: the Lockheart's own, read (held still for its odds, or spinning)
    const wheel = this.wheelOf(L, look);
    // the keys, the lid, the lift: as the ring stands, or as the Opening turns them
    const keys = this.keysOf(ids, uses);
    let lift = 0, shackle = 0, can = canNow, pour = -1, lidT = wheel?.peek ? 0.12 : 0;
    if (opening) {
      const u = this.t - this.opening.t0, nk = this.opening.keys.length, busy = (!!wheel && !wheel.peek) || L.queue?.length > 0; // (a TWIN's second spin waits a beat between)
      lift = busy || u < nk * KT + 0.4 ? sm(u / 0.3) : 0; shackle = C01((u - nk * KT) / 0.12) * (busy ? 1 : 0); can = u < nk * KT + 0.2;
      if (busy) { lidT = 1; const wt = L.wheel.t; pour = wt >= 0 && wt < 0.75 ? wt / 0.75 : -1; }
      if (!busy && u > nk * KT + 0.6) this.endOpening();
    }
    const lift0 = this.lift ?? 0, lid0 = this.lid;
    this.lift = lerp(this.lift ?? 0, lift, Math.min(1, dt * (lift > (this.lift ?? 0) ? 12 : 4)));
    this.lid += (lidT - this.lid) * Math.min(1, dt * 14);
    // busy: anything that moves past the ambient shimmer (the fill rolling, the lid and lift settling, a turn, the Opening, the wheel, a bead, a flash, the odds re-forming, the flail's light)
    this.busy = !!(opening || this.rot || this.close || wheel || canNow || this.beadQ.length || this.landing.length || this.snapT < 0.3 || this.drainT < 0.9 || this.rippleT < 0.35 || this.echoT < 0.55 || this.ghostT < 0.5
      || F.lit > 0 || F.cooling || F.hitAge < 0.6 || (L.hooverW || 0) > 0 || Math.abs(this.shownCharge - target) > 0.01 || Math.abs(this.lift - lift0) > 1e-3 || Math.abs(this.lid - lid0) > 1e-3 || Math.abs(this.lid - lidT) > 0.01);
    this.S = {
      look, heart, fill, charge: this.shownCharge, shownCharge: this.shownCharge, keys, ghost: gh,
      canOpen: can, fullAge: this.fullT, shackleOpen: shackle, lid: this.lid, snap: this.snapT < 0.25 ? this.snapT : -1,
      hoover: L.hooverW || 0, hvCol: this.drainT < 0.8 ? (this.drainCol || '#b49be6') : null, ripple: this.rippleT < 0.3 ? 1 - this.rippleT / 0.3 : 0,
      flail: { st: F.lit, hitAge: F.hitAge, runP: C01(F.hitAge / 0.12), next: F.cooling ? -1 : place.next, cool: F.cooling ? F.cool : 0 },
      swingT: 0, swingAt: null, trailA: 0, lift: this.lift, chainA: lerp(1, 0.25, this.lift), pour, wheel,
    };
    Object.assign(this.state, { shown: this.shown, heart, charge: +L.charge.toFixed(1), fill, canOpen: canNow, keys: keys.map((k) => ({ id: k.id, uses: k.uses, st: k.st })), wheel: wheel ? (wheel.peek ? 'peek' : 'spin') : null, flail: { st: F.lit, next: place.next } });
  }

  /** The wheel of odds as the Lockheart's own stands: held still (RMB held short), spinning (one angle with it), or none. */
  wheelOf(L, look) {
    const Wh = L.wheel; if (!Wh) return null;
    if (Wh.still || (Wh.foldT >= 0 && this.peek)) {
      const P = this.peek || (this.peek = { R: L.odds?.()?.R || [], t0: this.t }), u = this.t - P.t0;
      if (L.rmbT >= 0) this.hold = L.rmbT / (T.tech.lockheart?.openHold ?? 0.5);
      const sink = Wh.foldT >= 0 ? 1 - sm(Wh.foldT / 0.2) : 1;
      this.fromPeek = true;
      return { R: P.R, ang: 0, rise: sm(u / 0.18), sink, landAge: -1, chosen: null, prev: null, power: 1, mods: [], echoAge: -9, peek: true, hold: Wh.still ? this.hold : this.hold * sink, look };
    }
    if (Wh.t >= 0) {
      if (!this.spinQ) { this.spinQ = L.queue?.[0] || { id: 'catch' }; if (!this.opening) this.fromPeek = false; }
      const q = this.spinQ, catching = q.id === 'catch', R = (catching ? this.peek?.R : q.R) || this.peek?.R || [];
      const mods = []; if (q.mods?.reach > 1) mods.push('wide'); if (q.mods?.echo > 0) mods.push('echo'); if (q.mods?.spins > 1) mods.push('twin');
      const wt = Wh.t, sink = wt > DUR + HOLD ? 1 - sm((wt - DUR - HOLD) / 0.2) : 1;
      return { R, ang: Wh.disc.rotation.z, rise: this.fromPeek ? 1 : sm(wt / 0.18), sink, landAge: wt >= DUR ? wt - DUR : -1, chosen: catching ? null : q.id,
        prev: (q.i || 0) > 0 ? this.prevOut : null, power: q.power ?? 1, mods, echoAge: this.echoT < 0.5 ? this.echoT : -9, peek: false, hold: 0 };
    }
    this.spinQ = null; if (!Wh.still && Wh.foldT < 0 && !this.opening) { this.peek = null; this.fromPeek = false; }
    return null;
  }

  /** The keys for this frame: the ring as it stands (each place, its uses), or as a turn of the ring or the Opening moves them. */
  keysOf(ids, uses) {
    const O = this.opening;
    if (O) {
      const u = this.t - O.t0;
      return O.keys.map((k, i) => {
        const K = { ...k, slot: i, st: 'ring', a: 0 }, d = u - i * KT;
        if (d < 0) return K;
        if (d < 0.09) { K.st = 'fly'; K.a = sm(d / 0.09); } else if (d < 0.15) { K.st = 'turn'; K.a = (d - 0.09) / 0.06; }
        else { const e = d - 0.15; if (k.res === 'spent') { K.st = e < 0.35 ? 'melt' : 'gone'; K.a = e / 0.35; } else if (k.res === 'break') { K.st = e < 0.45 ? 'snap' : 'gone'; K.a = e / 0.45; } else { K.st = e < 0.15 ? 'back' : 'ring'; K.a = sm(e / 0.15); K.uses = k.after; } }
        return K;
      });
    }
    const n = ids.length, R = this.rot, q = R ? sm((this.t - R.t0) / 0.22) : 1, C = this.close, qc = C ? sm((this.t - C.t0) / 0.3) : 1;
    if (R && q >= 1) this.rot = null; if (C && qc >= 1) this.close = null;
    return ids.map((id, j) => {
      const L = keyLook(id), K = { id, s: L.s, c: L.c, uses: uses[j] | 0, slot: j, st: 'ring', a: 1 };
      if (R && q < 1 && n > 1) {
        if (R.dir > 0) { if (j === 0) { K.slot = lerp(n - 1, 0, q); K.wrapLift = Math.sin(q * Math.PI) * 9; } else K.slot = j - 1 + q; }
        else if (j === n - 1) { K.slot = lerp(0, n - 1, q); K.wrapLift = Math.sin(q * Math.PI) * 9; } else K.slot = j + 1 - q;
      } else if (C && qc < 1 && C.from[j] != null) K.slot = lerp(C.from[j], j, qc);
      return K;
    });
  }

  /** The ring turned a notch (the wheel): which way, from the order before (every key one place round, the last over the ring). */
  turned(next) {
    const prev = this.ringWas || []; this.ringWas = [...next]; this.ringSig = next.join(',');
    const n = next.length; if (!this.shown || n < 2 || prev.length !== n) return;
    const fwd = next.every((id, i) => id === prev[(i - 1 + n) % n]), back = next.every((id, i) => id === prev[(i + 1) % n]);
    if (fwd || back) this.rot = { t0: this.t, dir: fwd ? 1 : -1 };
  }

  /** The Opening: each key on the ring turned; which held, which was spent (brass) and which broke, read from the ring after it. */
  opened(e) {
    if (!this.shown) return;
    const used = e.keys || [], left = this.game.pneuka?.fitted('keys') || [], uses = this.game.pneuka?.uses?.keys || [];
    let j = 0; const R = e.results; // (each key's result by ring index, 'kept' | 'spent' | 'broke': lockheart.open; else inferred from the ring after)
    const keys = used.map((id, i) => { const L = keyLook(id), k = { id, s: L.s, c: L.c, uses: 0 }; if (R ? R[i] === 'kept' && left[j] === id : left[j] === id) { k.res = 'keep'; k.after = uses[j] | 0; k.uses = Math.max(0, k.after - 1); k.to = j; j++; } else { k.res = R?.[i] === 'spent' || (!R && id === 'key.brass') ? 'spent' : 'break'; k.uses = 9; } return k; });
    this.opening = { t0: this.t, keys }; this.prevOut = null;
  }
  /** The Opening over: the survivors close up on the ring. */
  endOpening() {
    const O = this.opening; this.opening = null; if (!O) return;
    const from = []; O.keys.forEach((k, i) => { if (k.res === 'keep') from[k.to] = i; });
    this.close = { t0: this.t, from };
  }

  // ---------------------------------------------------------------- the canvas
  paint() {
    const x = this.x, S = this.S;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.c.width, this.c.height); x.setTransform(K, 0, 0, K, 0, 0);
    drawPiece(x, { hx: OX, hy: OY, k: SCALE, t: this.t, phi0: PHI0 }, S);
    this.anchor = S.anchor;
    this.tex.needsUpdate = true;
  }

  // ---------------------------------------------------------------- the spiritual link: the drink down it, the gulp back up it
  link(dt) {
    const L = this.game.spiritualLink, Q = this.beadQ;
    for (let i = Q.length - 1; i >= 0; i--) {
      const q = Q[i]; q.age += dt; if ((q.wait -= dt) > 0) continue;
      if (L?.state?.shown) { L.bead({ amount: q.amount, colour: q.colour, dur: q.dur, rev: q.rev }); if (q.drink) this.landing.push({ at: q.dur, amt: q.drink }); Q.splice(i, 1); }
      else if (q.age > 0.8) { if (q.drink) this.pend = Math.max(0, this.pend - q.drink); Q.splice(i, 1); } // (the tube rises to meet a bead; not up, it lands unseen)
    }
    for (let i = this.landing.length - 1; i >= 0; i--) { const l = this.landing[i]; if ((l.at -= dt) <= 0) { this.pend = Math.max(0, this.pend - l.amt); this.rippleT = 0; this.landing.splice(i, 1); } } // (a drink lands: the window ripples and rises)
    if (!Q.length && !this.landing.length) this.pend = 0;
  }
}
