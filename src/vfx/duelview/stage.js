// ---------------------------------------------------------------------------------------
// THE DUEL'S STAGE (plain name; South, 2026-10-27: "dynamic camera movement, board shape transforming ... the tsuitate transition into
// its own screen if you pinch zoom on it, or collapse back down into its smallest size to show the Courier and Aberrant ... think in
// maximum terms of action and camera dynamism"): the duel's camera and the tsuitate's size as one zoom, and a director that moves both on
// what the kernel's events say. The duel's view (vfx/duelview.js) owns it; it writes the cinema shot 'duel' every frame.
//
//   THE ZOOM   z 0 the arena: the tsuitate drawn in to STAGE.arenaScale, lifted off the ground and leaning back a little, the Pneuka
//              Jar at your spot and the aberrant at its own in one wide three-quarter shot (the two of you, the board between). z 1 the
//              board view: the tsuitate at its full size, square to the camera and filling the screen (the view's frameShot, on a phone
//              its touchShot). Between, both eased together. Two fingers pinched (input.touchDrag.pinch) or the wheel move it; let go,
//              it settles on the nearer end, and that is your choice (`pref`) until you change it.
//   THE DIRECTOR   the open: held on the arena while the domains unfold, then to your choice. The foe's turn: drawn back to
//              STAGE.foeTurn and leaning toward its half, so its moves and its body both read. Each event: a chain step a push in and a
//              shake that grows with the step; a duel's break and an all clear a whip out to the arena and a roll, held, then back; the
//              Line's step a lean its way; junk landing on your half a jolt; the form's dive the camera following the Jar into the board
//              (vfx/duelview/formdive.js); the duel's end out to the arena.
//   THE CLASH  the domains' clash (domains.js) closes in with the zoom: its full 18 m round the arena, drawn in to just past the camera in the
//              board view, so the board stands in its own screen of the two minds' grounds and the world is gone behind them.
//   THE SHAKE   trauma squared (Squirrel Eiserloh's "Juicing your cameras with math", GDC 2016): each jolt adds trauma, it drains, and
//              the offset and roll are smooth noise times trauma squared, so small jolts are felt and big ones never blur the board.
// Prior art: Hearthstone's board shake on a big hit, Puyo Puyo Tetris's camera punch on a long chain, Persona 5's whip to the wide on an
// All-Out Attack, Clash Royale and Marvel Snap (the board the screen; the fighters drawn back when the board is not the thing), the
// maps app's pinch (settling on a zoom it knows), Super Smash Bros.' camera holding both fighters.
//
//   const S = new DuelStage(view)   S.open()   S.close()   S.event(e) (beats.js, at each phase)   S.update(dt) -> { scale, lift, tilt, dome }
//   S.eatTap(cell) -> bool (the session: a tap on the board in the arena zooms in, never acts)   S.z (0..1)   S.pref   S.wide (z < 0.5)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sm, clamp01, cellLocal } from './layout.js';

/** arenaScale: the tsuitate's size at z 0; lift (m) and tilt (rad, back) there; arenaYaw: the arena's three-quarter turn (rad); foeTurn:
 *  the zoom on the foe's turn (from the board view); intro: real s held on the arena at the open; pinch: z a unit of the pinch's log
 *  scale; wheel: z a wheel delta; settle: real s after the wheel stops before it settles; ease: the zoom's rate (1/s); follow: the
 *  shot's (1/s); kick: { break, allclear, end }: [z, real s] whipped to; shake: m and rad at trauma 1, its drain (1/s); domeFar, domeNear:
 *  the domains' clash's radius (m) in the arena and at the nearest in the board view, domeMargin past the camera; castZ: the zoom a skill's
 *  cast is drawn back to; fixture: m more span in the arena when the foe stands fixed (Strawman's practice duel). */
export const STAGE = {
  arenaScale: 0.6, lift: 0.28, tilt: 0.14, arenaYaw: 0.3, foeTurn: 0.62, intro: 1.5, pinch: 1.5, wheel: 0.0028, settle: 0.35, ease: 5, follow: 9,
  kick: { break: [0.12, 1.5], allclear: [0, 2.1], end: [0, 99], finisher: [0.2, 2.4], push: [0.15, 1.0] },
  shake: { pos: 0.07, roll: 0.035, drain: 1.5 },
  domeFar: 18, domeNear: 5.5, domeMargin: 1.6, castZ: 0.5, fixture: 1.3,
};
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3();
const noise = (t, s) => (Math.sin(t * 13.1 + s) + Math.sin(t * 7.3 + s * 2.1) * 0.6 + Math.sin(t * 23.7 + s * 3.7) * 0.3) / 1.9;

export class DuelStage {
  constructor(view) {
    this.view = view; this.z = 0; this.pref = 1; this.manual = null; this.idle = 0; this.t = 0; this.trauma = 0; this.fovKick = 0; this.rollKick = 0;
    this.kick = null; this.lean = 0; this.leanT = 0; this.dive = null; this.fitT = 0; this.board = null;
    this.pos = new THREE.Vector3(); this.look = new THREE.Vector3(); this.started = false; this.cine = null; this.introT = null;
    this.cs = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0, roll: 0 };
  }
  get intro() { return this.introT ?? STAGE.intro; }
  get wide() { return this.z < 0.5; }

  open() {
    this.z = 0; this.manual = null; this.idle = 0; this.t = 0; this.trauma = 0; this.fovKick = 0; this.rollKick = 0; this.kick = null; this.lean = 0; this.leanT = 0;
    this.dive = null; this.fitT = 0; this.board = null; this.started = false; this.ended = false; this.cine = null;
  }
  close() { this.kick = null; this.dive = null; this.manual = null; this.cine = null; }

  /** A cutaway from the board to one of the show's shots (duelshow.js cineShot: 'vsFoe', 'vsJar', 'hit', 'death', 'hero') for `dur` real
   *  s, eased in and out over the board's shot; `cut` snaps to it at once (a hard cut). Your hands on the zoom always win. */
  cutAway(kind, dur, { cut = false } = {}) { this.cine = { kind, dur, t: 0, cut }; }

  /** The session asks before a tap on the board acts: in the arena it zooms in instead (the cells are too small to aim at there). */
  eatTap(cell) {
    if (!this.view.isOpen || this.t < this.intro || this.z >= 0.5 || this.manual != null) return false;
    this.pref = 1; this.kick = null; return true;
  }

  /** An event as the beats play it: the director's answer. */
  event(e) {
    const s = this.view.state; if (!s) return;
    const mine = (side) => side === 0;
    this.view.show?.event?.(e); // (the fighters' acting and the big moments' cuts: duelshow.js)
    switch (e.type) {
      case 'chain': { const n = Math.min(6, e.step || 1); this.jolt(0.1 + 0.07 * n + (e.weak ? 0.12 : 0)); this.fovKick = Math.min(9, this.fovKick + 1.6 * n); if (n >= 3) this.rollKick += (mine(e.side) ? 1 : -1) * 0.012 * n; break; }
      case 'duelBreak': this.jolt(0.55); this.whip('break'); this.rollKick += (e.side === 1 ? -1 : 1) * 0.06; break;
      case 'allclear': this.jolt(0.35); this.whip('allclear'); break;
      case 'line': { const d = Math.sign((e.line ?? 0) - (this.view.lineCol ?? e.line ?? 0)) || (e.side === 0 ? 1 : -1); this.lean = d; this.leanT = 0.9; this.jolt(0.18); break; } // (toward where it went: the side pushed back)
      case 'land': if (e.side === 0 || (e.at && e.at[0] < (this.view.lineCol ?? 0))) this.jolt(0.22); break;
      case 'duel.finisher': this.whip('finisher'); this.jolt(0.8); this.fovKick = 12; this.rollKick += 0.09; break; // (the super: sold hardest, Dovina's ruling)
      case 'refund': this.fovKick = Math.min(9, this.fovKick + 3); this.jolt(0.1); break;
      case 'duel.line': case 'duel.full': case 'duel.cap': this.whip('end'); this.jolt(0.3); break;
      case 'kick': this.jolt(0.12); break;
      case 'skill': if (e.side === 0) { this.fovKick = Math.min(10, this.fovKick + 5); this.jolt(0.25); this.kick = { z: STAGE.castZ, until: this.t + 0.95, kind: 'cast' }; } break; // (drawn back to mid so the Jar's pour is seen from its mouth to the cell) // (the cast: the board view's moment, formdive.js)
      case 'charge': if (e.side === 0 && e.ready) this.jolt(0.08); break;
      case 'shot': case 'blast': this.jolt(0.16); break;
      default: break;
    }
  }
  jolt(k) { this.trauma = Math.min(1, this.trauma + k); }
  whip(kind) { const [z, dur] = STAGE.kick[kind]; this.kick = { z, until: this.t + dur, kind }; }
  /** The form's dive (formdive.js): the camera follows the Jar into the board (to 'courier') or out of it (to 'hand'). */
  follow(to, dur, at = null) { this.dive = { to, t: 0, dur, at }; }

  /** Pinch and wheel to the zoom: followed while fingers are down, settled on the nearer end when they lift. */
  input(dt) {
    const I = this.view.game.input; if (!I) return;
    const G = I.touchDrag, two = (G?.fingers || 0) >= 2;
    if (two || Math.abs(G?.pinch || 0) > 1e-4) { this.manual = clamp01((this.manual ?? this.z) + (G?.pinch || 0) * STAGE.pinch); this.idle = 0; }
    if (I.device !== 'touch' && I.wheel) { this.manual = clamp01((this.manual ?? this.z) - I.wheel * STAGE.wheel); this.idle = 0; }
    if (this.manual != null && !two) { this.idle += dt; if (this.idle >= STAGE.settle) { this.pref = this.manual >= 0.5 ? 1 : 0; this.manual = null; this.kick = null; } }
  }

  /** The zoom this frame: your hands first, then the director's kick, the open's hold, the foe's turn, your choice. */
  want() {
    const s = this.view.state;
    if (this.manual != null) return this.manual;
    if (this.kick && this.t < this.kick.until) return Math.min(this.kick.z, this.pref);
    this.kick = null;
    if (this.cine || this.t < this.intro) return 0;
    if (s && s.toMove === 1 && s.winner === null) return Math.min(this.pref, STAGE.foeTurn);
    return this.pref;
  }

  /** The arena's shot: both bodies and the drawn-in tsuitate in one three-quarter view from the face's side. */
  arenaShot(out) {
    const V = this.view, g = V.game, cam = g.camera, tan = Math.tan(((cam?.fov ?? 70) * Math.PI) / 360), asp = cam?.aspect || 16 / 9;
    const a = g.player?.pos ? _a.copy(g.player.pos) : _a.copy(V.centre).addScaledVector(V.u, -1.5), b = V.foe?.pos ? _b.copy(V.foe.pos) : _b.copy(V.centre).addScaledVector(V.u, 1.5);
    const fixed = !!(V.game.duel?.practice || V.foe?.rooted || V.foe?.practice); // (a foe that stands where it is, Strawman: the two set nearer, so the shot opens wider)
    const span = a.distanceTo(b) / 2 + 0.75 + (fixed ? STAGE.fixture : 0) + (V.show?.on ? V.show.margin : 0), look = _m.copy(a).lerp(b, 0.5).setY(V.centre.y + 0.9);
    const d = Math.max(span / (tan * asp), 1.2 / tan), dir = _d.copy(V.face).applyAxisAngle(UP, -STAGE.arenaYaw);
    out.look.copy(look); out.pos.copy(look).addScaledVector(dir, d).addScaledVector(UP, 0.35 + d * 0.06);
    return out;
  }

  /** Each frame: the zoom eased, the tsuitate's size, the shot written (real seconds). Returns the frame's transform for the view. */
  update(dt) {
    const V = this.view; this.t += dt;
    this.input(dt);
    const zw = this.want(), k = 1 - Math.exp(-(this.manual != null ? STAGE.ease * 2.4 : STAGE.ease) * dt);
    this.z += (zw - this.z) * k;
    const e = sm(this.z), scale = STAGE.arenaScale + (1 - STAGE.arenaScale) * e, lift = STAGE.lift * (1 - e), tilt = STAGE.tilt * (1 - e);
    this.trauma = Math.max(0, this.trauma - STAGE.shake.drain * dt); this.fovKick *= Math.exp(-5 * dt); this.rollKick *= Math.exp(-3 * dt);
    if (this.leanT > 0) this.leanT -= dt; else this.lean *= Math.exp(-4 * dt);
    this.shot(dt, e);
    const near = this.pos.distanceTo(V.centre) + STAGE.domeMargin, dome = STAGE.domeFar + (Math.max(STAGE.domeNear, near) - STAGE.domeFar) * e; // (the board view its own screen: the clash closed in round the board and the camera, the world gone behind it)
    return { scale, lift, tilt, dome: Math.min(STAGE.domeFar, dome) };
  }

  shot(dt, e) {
    const V = this.view, g = V.game, shot = g.cinema?.shots?.get('duel'); if (!shot) return;
    if ((this.fitT -= dt) <= 0 || !this.board) { this.fitT = 0.25; this.board = V.frameShot?.() || this.board; }
    if (!this.board) return;
    const A = this.arenaShot(this.arena ||= { pos: new THREE.Vector3(), look: new THREE.Vector3() }), B = this.board;
    const pos = _a.copy(A.pos).lerp(B.pos, e), look = _b.copy(A.look).lerp(B.look, e);
    const s = V.state, foe = s && s.toMove === 1 && s.winner === null ? 1 : 0, reach = (1 - e * 0.75) * 0.35;
    look.addScaledVector(V.u, (foe * 0.6 + this.lean * 0.5) * reach); pos.addScaledVector(V.u, (foe * 0.6 + this.lean * 0.5) * reach * 0.6);
    if (this.dive) { // (the form's dive: the camera leans in after the Jar as it pours into the board, or back out with it)
      const D = this.dive; D.t += dt; const u = clamp01(D.t / D.dur), bell = Math.sin(Math.PI * u), at = V.pieces?.bodyAt?.(0);
      if ((D.at || at) && V.frame) { const c = D.at ? _c.copy(D.at) : V.frame.localToWorld(cellLocal(at.x, at.y, V.board3, _c)); look.lerp(c, 0.35 * bell); pos.lerp(c, (D.to === 'courier' ? 0.22 : 0.12) * bell); }
      if (u >= 1) this.dive = null;
    }
    let cfov = 0, croll = 0;
    if (this.cine && this.manual == null) { // (the show's cut: its shot laid over the board's, eased in and out, or snapped to)
      const C = this.cine; C.t += dt; const u = clamp01(C.t / C.dur), w = (C.cut ? 1 : sm(clamp01(C.t / 0.14))) * (1 - sm(clamp01((C.t - C.dur + 0.32) / 0.32)));
      const S = this.view.show?.cineShot?.(C.kind, u, Object.assign(this.cs, { fov: 0, roll: 0 }));
      if (S) { pos.lerp(S.pos, w); look.lerp(S.look, w); cfov = S.fov * w; croll = S.roll * w; if (C.cut && !C.snapped) { C.snapped = true; this.pos.copy(pos); this.look.copy(look); } }
      if (C.t >= C.dur) this.cine = null;
    } else if (this.cine) this.cine = null;
    if (!this.started) { this.started = true; this.pos.copy(pos); this.look.copy(look); }
    const f = 1 - Math.exp(-STAGE.follow * (this.cine ? 1.6 : 1) * dt); this.pos.lerp(pos, f); this.look.lerp(look, f);
    const T = this.trauma * this.trauma, S = STAGE.shake, t = this.t, dist = this.pos.distanceTo(this.look) / 4;
    shot.pos.copy(this.pos); shot.look.copy(this.look);
    if (T > 0) { shot.pos.x += noise(t, 1) * S.pos * T * dist; shot.pos.y += noise(t, 2) * S.pos * T * dist; shot.pos.z += noise(t, 3) * S.pos * T * dist; shot.look.y += noise(t, 4) * S.pos * T * 0.5 * dist; }
    shot.fov = -this.fovKick + cfov; shot.roll = this.rollKick + croll + noise(t, 5) * S.roll * T;
  }
}
