// ---------------------------------------------------------------------------------------
// THE PRESS'S LOOK (docs/plans/SOUL-ALCHEMY.md 4.3, 4.6, 4.12 to 4.14, 4.17): everything the spirit press at the Athanor shows, read
// each frame from the station (world/garden/press.js, Petra's: the press view, the hand's hotspots, the queue, the lever) and from the
// rules (progress/alchemy.js, Dovina's: the colour, the ranks, the cocked lever, a firing's price), and laid on the model
// (vfx/spiritpress.js and its hue ring), the bath (vfx/alchemy/bath.js through the station's adapter), the garden's sky, the frame,
// the HUD and the god hand. It decides nothing: it shows what the press answers before it is touched and what a firing does.
//   THE PRESS VIEW  opening (0.8 s): the garden outside the kerb greys (the sky, the haze, the fog: vfx/garden/gardensky.js), the lights
//                   settle into their seals, the bead wells up; the HUD steps out (only the bath and the press speak) and the log folds
//                   to its tab strip, opening to a line said while the view is up for 4 real seconds; leaving (0.5 s): all of it back
//   BEFORE TOUCHING the lever's ball up after a press and down after a firing, warming (an ember) with the bead inside a spread; the
//                   eye brightening as the bead nears a tile's heart; the lantern tall when your cubes cover a firing here, low when not
//   THE LEVER       dragged, the ball goes only as far as a firing here would let it: a third of the way outside every spread, not at all
//                   over a finished tile, already down when the press is spent
//   A FIRING        the timelines of vfx/alchemy/firing.js, laid on everything (the hit-stop holds this look's clock)
//   THE HAND        raised over the bath and half-dithered there, so it never hides the bead, its shadow dot on the bath the cursor;
//                   on the ball when it takes the lever, before the mouth when it presses (its clips: godhand/godhandclips.js)
// After a true firing, leaving the press view, the Pneuka Jar's mouth breathes the soul colour for a few real seconds.
//
// Prior art: the section 4 labels (Albers' grey surround and Okami's stilled canvas for the press view, Townscaper's answer before the
// act, Hades' held beat), and the director pattern of a cinematic system (one object reads the game's state and poses the set).
//
//   const L = new PressLook(station)   (made by the station, after its model and its bath)   L.update(raw, { soul, walking })
//   L.handPoint(at, overMouth, overBall) -> where the hand goes (or null)   L.handLift   L.firing (busy, t)   L.sealLit   L.sealFx   L.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ATTRIBUTES, aimedFuel, radiusAt } from '../../progress/alchemy.js';
import { ECON } from '../../progress/econ/table.js';
import { Firing } from './firing.js';
import { HAND_FADE } from '../vessoulpaint.js';

const IDS = Object.keys(ATTRIBUTES);
const LOG = { open: 4 }; // (real seconds a line said in the press view holds the folded log open)
const HAND = { over: 2.0, carry: 1.0, at: 0.25, dither: 0.5 }; // (metres the hand stands over the bath, over what it carries, at the mouth and the ball; its fade over the bath)
const BALL = { travel: 0.25 }; // (real seconds for the ball from its stop to up, or back)
const REST = { shown: 1, scale: 1, men: 1, crawl: 0 };
const toward = (v, to, rate) => (v < to ? Math.min(to, v + rate) : Math.max(to, v - rate));
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

export class PressLook {
  constructor(station) {
    const S = (this.S = station); this.g = station.game; this.model = station.model; this.pb = station.bath; this.pb.look = this;
    this.firing = new Firing();
    this.t = 0; this.ball = 1; this.ember = 0; this.eye = 0; this.flame = 0.9; this.handFade = 1; this.handLift = HAND.over; this.bead = new THREE.Vector3();
    this.sealLit = new Array(7).fill(0); this.gold = new Array(7).fill(0); this.sealFx = { ember: null, gold: this.gold };
    this.open = false; this.logT = 0; this.trueFired = false; this.accum = false; this.lastTiles = null; this.handWhole = true;
    this.seatPress();
    const on = (n, fn) => this.g.events?.on?.(n, fn);
    this.offs = [
      on('alchemy.open', () => this.opened()),
      on('alchemy.close', () => this.closed()),
      on('alchemy.fire', (e) => this.fired(e)),
      on('alchemy.refuse', (e) => this.refused(e)),
      on('garden.leave', () => { this.closed(); this.setHandFade(1); this.S.R.site?.sky?.surround(false, true); }), // (the garden left: its sky and the hand back at once)
    ];
  }

  /** The bath's places in the press's own frame (its north lip, its up, the seals, the tiles), for the spout, the thread and the lights. */
  seatPress() {
    const S = this.S, F = S.frame, B = this.pb, M = this.model, inv = new THREE.Matrix4();
    S.R.site?.group?.updateMatrixWorld?.(true); inv.copy(M.group.matrixWorld).invert();
    const toPress = (local) => B.group.localToWorld(local).applyMatrix4(inv);
    if (!B.basin.hues) B.basin.seals(IDS.map((id) => ATTRIBUTES[id].hue)); // (the seals' bearings, before the first frame names them)
    const lip = toPress(new THREE.Vector3(0, 0.02, -F.R)), up = F.U.clone().transformDirection(inv);
    const seals = IDS.map((_, i) => toPress(B.basin.sealAt(i, new THREE.Vector3()))), tiles = IDS.map((id) => toPress(B.local(ATTRIBUTES[id].hue, ECON.alchemy.sat, new THREE.Vector3())));
    M.seat({ seals, tiles, lip, up });
  }

  // ---------------------------------------------------------------- the press view, opened and closed
  opened() {
    if (this.open) return; this.open = true; this.trueFired = false;
    const g = this.g, log = g.log;
    this.S.R.site?.sky?.surround(true);
    g.ui?.want?.('alchemy', true, { log: true }); // (the HUD steps out; the log stays: feedback/hideui.js)
    if (log) { this.logMini = log.mini; log.setMini?.(true, false); this.logSeen = log.said || 0; this.logT = 0; }
  }
  closed() {
    if (!this.open) return; this.open = false;
    const g = this.g, log = g.log;
    this.S.R.site?.sky?.surround(false);
    g.ui?.want?.('alchemy', false);
    if (log && this.logMini !== undefined) log.setMini?.(this.logMini, false);
    if (this.accum && g.post?.accum) g.post.accum.amt = 0; this.accum = false;
    this.pb.bath.cursor(null); this.pb.marks.flush();
    if (this.trueFired && g.vfx && this.S.R.jarBody) { const J = this.S.R.jarBody; g.vfx.play('jar.breath', { pos: J.pos.clone().addScaledVector(J.up, 0.55), dir: J.up, tint: this.soulHex() }); } // (the Jar's mouth breathes the soul colour)
    this.trueFired = false;
  }
  soulHex() { return this.model.poolU.uSoul.value.getHex(); } // (the soul's colour as the press draws it: wheelColour's)

  // ---------------------------------------------------------------- a firing, a refusal
  fired(e) {
    const i = IDS.indexOf(e.attribute); if (i < 0) return;
    const prev = this.lastTiles?.[i], A = this.g.alchemy, id = e.attribute;
    const next = { r: A.radius(id), bare: radiusAt(A.rank(id)), rank: A.rank(id), stars: A.stars?.(id) ?? 0 };
    this.firing.fire({ i, prev: prev ? { r: prev.r, bare: prev.bare, rank: prev.rank ?? e.rank - 1, stars: prev.stars ?? 0 } : next, next, deep: !!e.true });
    if (e.true) this.trueFired = true;
  }
  refused(e) {
    let glint = -1;
    if (e.why === 'outside') { // (the nearest spread's break, on the side facing the bead: the way)
      const B = this.pb.bath, b = B.beadAt; let best = Infinity;
      B.T.forEach((T, i) => { const d = Math.hypot(b.x - T.x, b.z - T.z) - T.now; if (d < best) { best = d; glint = i; } });
    }
    this.firing.refuse(e.why, { glint });
  }
  /** The tiles as the bath draws them (the station's adapter asks): the firing's hold on the tile it fires. */
  tilesFor(list) { this.lastTiles = this.firing.busy ? this.lastTiles : list; return this.firing.tiles(list); }

  // ---------------------------------------------------------------- the hand
  /** Where the hand stands in the press view: on the ball when it takes (or reaches for) the lever, before the mouth when it presses
   *  (or reaches for it), else the cursor's point on the bath. */
  handPoint(at, overMouth, overBall) {
    const S = this.S, F = S.frame;
    if (S.lever || (overBall && !S.carry && !S.walk)) { this.handLift = HAND.at; return S.ballAt().addScaledVector(F.N, -0.25); }
    if (S.walk || S.beatT != null || (overMouth && (S.carry || S.hopper.length))) { this.handLift = HAND.at; return S.mouthAt().addScaledVector(F.N, -0.35); } // (pressing, or bringing a lump to the mouth)
    this.handLift = S.carry ? HAND.carry : HAND.over;
    return at;
  }
  setHandFade(k) {
    this.handFade = k; HAND_FADE.fade.value = k;
    const whole = k > 0.99, model = this.g.realm?.god?.hand?.model; if (whole === this.handWhole || !model) return; this.handWhole = whole; // (the outlines change only when the hand goes from whole to dithered or back, not each frame)
    model.traverse((o) => { if (o.userData?.isOutline) o.visible = whole; }); // (no outline round a dithered hand)
  }

  // ---------------------------------------------------------------- each frame
  update(raw, { soul, walking = false } = {}) {
    const S = this.S, g = this.g, A = g.alchemy, M = this.model, B = this.pb.bath, marks = this.pb.marks; if (!A) return;
    const viewing = S.viewing;
    if (this.firing.busy && viewing && g.input?.wasPressed?.('Mouse0')) this.firing.skip();
    const F = this.firing.update(raw) || {};
    if (!F.hold) this.t += raw; // (the hit-stop: the look's clock holds)
    // where the bead is (the drawn one, walking or still) and the spread it is in, a tile's heart; what a firing here would cost
    const i = B.active, T = i >= 0 ? B.T[i] : null, dB = T ? Math.hypot(B.beadAt.x - T.x, B.beadAt.z - T.z) : 0, heart = !!T && dB <= T.bare / 4;
    const N = A.nearest(), id = N?.id, rank = id ? A.rank(id) : 0, ranks = ECON.alchemy.ranks;
    const price = N ? aimedFuel(rank, N.d, N.r, A.formation()) : 0, cubes = g.cubes?.balance ?? 0, cocked = A.cocked ?? !!A.s?.cocked;
    const would = !cocked ? 'spent' : !N ? 'outside' : rank >= ranks ? 'full' : cubes < price ? 'poor' : null;
    // THE BALL: up when cocked (or pressing), at its stop when spent; dragged, only as far as a firing here would let it go
    let want = cocked || S.walk ? 0 : 1;
    if (S.lever) want = would === 'spent' ? 1 : would === 'full' ? Math.min(S.pull, 0.03) : would === 'outside' ? Math.min(S.pull, 1 / 3) : S.pull;
    if (F.pull != null) want = F.pull;
    this.ball = S.lever || F.pull != null ? want : toward(this.ball, want, raw / BALL.travel);
    const tileRank = id ? rank : 0;
    this.ember = toward(this.ember, cocked && N && tileRank < ranks ? 1 : 0, raw * 3);
    // THE EYE: dark outside every spread, brightening as the bead nears a tile's heart (as the price falls with it)
    const open = T && A.rank(IDS[i]) < ranks, near = open ? 1 - clamp01((dB - T.bare / 4) / Math.max(1e-3, T.now - T.bare / 4)) : 0; // (a finished tile: no firing, the lens dark)
    this.eye = toward(this.eye, open ? 0.25 + 0.75 * near : 0, raw * 3);
    // THE LANTERN: tall when your cubes cover a firing here, low when they do not
    this.flame = toward(this.flame, N && rank < ranks ? (cubes >= price ? 1.5 : 0.4) : 0.9, raw * 2);
    // the model
    if (viewing || this.firing.busy) this.bead.copy(this.pb.group.localToWorld(_v.set(B.beadAt.x, 0.04, B.beadAt.z)));
    M.set({
      soul, fire: Math.max(S.fire * 0.6, F.dive?.burn ?? 0), press: S.pressT, pull: this.ball, near: i, queue: S.queued().map((m) => m.hue),
      view: viewing, heart, unlit: i >= 0 && A.rank(IDS[i]) >= ranks, bead: M.group.worldToLocal(_w.copy(this.bead)), dive: F.dive ?? null,
      ember: this.ember, eye: F.eye ?? this.eye, flare: F.flare ?? 0, flame: F.flame ?? this.flame, smoke: F.smoke ?? 0, beam: F.beam ?? 0,
    });
    M.update(this.t);
    // the seals: each lit as its light lands, an ember while its light hangs over its tile, gold for a beat at a true firing
    const R = M.ring; for (let k = 0; k < 7; k++) { this.sealLit[k] = R.seated[k] * R.seated[k] * (3 - 2 * R.seated[k]); this.gold[k] = F.gold?.i === k ? F.gold.k : 0; }
    this.sealFx.ember = R.lifted;
    // the bath: the firing's hold on the bead, its ring, the glint, the kiln heat and crazing, the burning glass's point
    Object.assign(B.fx, F.bead || REST);
    if (F.ring) B.ring(B.beadAt.x, B.beadAt.z);
    B.glint(F.glint?.i ?? -1, F.glint?.k ?? 0);
    const ft = F.fireTile, U = marks.uniforms;
    if (ft && B.T[ft.i]) { // (in the tile's own units, its disc 1 in radius: the front runs from the bead until it has crossed the whole tile)
      const Tt = B.T[ft.i], ax = (B.beadAt.x - Tt.x) / Tt.bare, az = (B.beadAt.z - Tt.z) / Tt.bare;
      U.uFire.value.set(ft.i, ft.heat, ft.craze, ft.front * (Math.hypot(ax, az) + 1.3)); U.uFireAt.value.set(ax, az);
    }
    else U.uFire.value.set(-1, 0, 0, 0);
    B.glow(F.glow ?? 0, soul || A.colour);
    // the frame accumulation for a true firing's dive (render/glow.js), handed back at once when it ends
    const post = g.post; if (post?.accum && !g.death?.active) { if ((F.accum ?? 0) > 0.001 && this.open) { Object.assign(post.accum, { amt: F.accum, zoom: 0.003, spin: 0 }); this.accum = true; } else if (this.accum) { post.accum.amt = 0; this.accum = false; } }
    // the log, folded while the press view is up: a line said opens it to that line for a few real seconds
    const log = g.log;
    if (this.open && log) {
      if ((log.said || 0) !== this.logSeen) { this.logSeen = log.said || 0; log.setMini?.(false, false); this.logT = LOG.open; }
      else if (this.logT > 0) { if (log.typing) this.logT = LOG.open; else if ((this.logT -= raw) <= 0) log.setMini?.(true, false); } // (never folded under their typing)
    }
    // the hand: half-dithered over the bath (it never hides the bead), its shadow dot the cursor; solid on the ball, at the mouth, carrying
    if (viewing) {
      const at = S.lean, overWater = !!at && at.distanceTo(S.frame.O) < S.frame.R && !S.carry && !S.lever && !S.walk;
      this.setHandFade(toward(this.handFade, overWater ? HAND.dither : 1, raw * 4));
      if (overWater) { const p = this.pb.group.worldToLocal(_v.copy(at)); B.cursor({ x: p.x, z: p.z }); } else B.cursor(null);
    } else if (this.handFade < 1) this.setHandFade(toward(this.handFade, 1, raw * 4)); // (left: the hand fills in over a quarter of a second, not in a frame)
    marks.flush();
  }

  dispose() { for (const off of this.offs) off?.(); this.closed(); this.setHandFade(1); }
}
