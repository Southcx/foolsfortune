// ---------------------------------------------------------------------------------------
// TOOL BODY: what a held tool's own clips need beyond the combo engine (tools/moveset.js), written once for every tool that plays the
// Courier's suite through its own layer (the Soul Brush, the Dreamvane, the Crucibelle, the Lockheart and its ultimate, the Veritome,
// and the busking body at a busker's mat). It was two modules, built at once by two hands (heldclips.js and this); made one, as CLAUDE.md
// asks ("Built once").
//
//  - GESTURES: a held tool's own clip that is not a blow (a note's gesture, the Flash, the coffin opened, the busking body's jam), one at
//    a time, played once or looped from `from` to `to`, faded in and out against the stance; a new one replaces the old. Unreal's
//    Animation Montage slot (a clip played once over a slot, its blend in and out).
//  - STAND LEGS: standing still, a tool clip's legs are the clip's own (its stance, its weight, its crouch), its travel taken out of the
//    hips (casebook rule 19); moving, they are the run's. The tool's weight is eased both ways (a move's weight drops to nothing the frame
//    it ends: a shin snapped 27-29 degrees at the end of a toll, a flail blow, a bash), and the last legs are kept to ease out from. The
//    engine does this for its own moves (`Moveset.legs`); a tool's other clips ask here, with a pose or a clip.
//  - CROSSFADE: one move straight into the next (a string's blows, a hold into its release, a gesture cut off by a toll) is a cut between
//    two clips that do not meet (up to 112 degrees between Brush_Combo1's end and Brush_Combo2's start); the layer as it last was is held
//    and faded out under the new one over a tenth of a second. Inertialization in its plainest form (David Bollo, GDC 2018: the frozen
//    pose eased out, not two clips kept running), as in UE4's Blend Profiles. `keyed` cuts on a change of what plays; a mask and a weight
//    give the legs one too (the hips swung 15 to 34 degrees in one frame from the pick into the sweep), so running legs are never held.
//  - THE SECOND HAND: the suite's two-handed holds already put the free hand on the haft (the Vane's, the brush's slams), within a few
//    centimetres of where the tool lands in the other hand; the palm is moved onto the haft there, its wrist as the clip has it, and
//    let go as the clip takes the hand away (a hand on a handle, the lightest IK: no grip point is imposed on a clip that has its own).
//  - CARRIED IN: a dash's clip travels at its own pace (Brush_Dive half a metre before it lies them down, Vane_Vault's approach a fifth
//    of one); begun at a sprint, the speed they came in with is kept on top of the clip's travel and eased away (DMC's and Bayonetta's
//    dash attacks keep the run's momentum into the swing), never past the clip's own plant.
//  - OFF THE GROUND: a tool clip made with a shorter prop, or on flat ground, can put a brush head or a crook through the floor. The
//    tool is turned about the hand, in the vertical plane of its lowest point, until no listed point of it is under the ground (a
//    light correction, as CLAUDE.md allows IK: the hand then follows the tool, a few degrees at the wrist). A swept-sphere floor
//    check in the manner of the foot-planting of every engine (Unity's and Unreal's two-bone foot IK on a ray down), done for the
//    held thing instead of the foot.
//
//   const S = new Gestures(C)   S.play(clip, { from, to, rate, loop, hold, fadeIn, fadeOut })   S.stop(fade)   S.update(dt)   S.sample(out) -> w
//   S.clip   S.t   S.playing   S.fresh (true the frame after a play: cut the crossfade)   (hold: played once, kept on its last frame)
//   standLegs(ch, P, base, src, w, st, dt, { t, loop })   src: a pose, or a clip name sampled at `t`; st: an object the caller keeps
//   const X = new Crossfade(C, dur)   X.cut(dur)   X.apply(out, dt, mask, w)   X.keyed(out, key, dt, mask, w)   X.reset()
//   legsW(moves, st) -> how much of the legs is the tool's now
//   liftAbove(M, points, floorY, max) -> radians turned   (M: the tool's world matrix, turned in place about its origin: the hand)
//   floorUnder(game, P, x, z, y) -> the ground's height under (x, z) near y (a ray down; the feet's height if nothing is hit)
//   closeHand(ch, grip, M, state, dt, { side, from, to, near, far })   the free hand onto the haft where the clip has it near
//   carryInto(moves, c)   (a Moveset's onBegin) a whole-body move with `carry` (m/s) keeps the sprint it began in, eased away by `carryTo`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { rootOf } from './moveset.js';

const _a = new THREE.Vector3(), _o = new THREE.Vector3(), _w = new THREE.Vector3(), _p = new THREE.Vector3(), _ax = new THREE.Vector3();
const _q = new THREE.Quaternion(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4(), _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);

const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

/** A held tool's own clip that is not a blow, over its stance (GESTURES above). */
export class Gestures {
  constructor(C) { this.C = C; this.e = null; this.fresh = false; }
  get playing() { return !!this.e && !this.e.end; }
  get clip() { return this.e?.clip ?? null; }
  get t() { return this.e?.t ?? 0; }
  /** Play `clip` (false if there is no such clip). */
  play(clip, { from = 0, to = null, rate = 1, loop = false, hold = false, fadeIn = 0.08, fadeOut = 0.2 } = {}) {
    const c = this.C.clips[clip];
    if (!c) return false;
    this.e = { clip, t: from, to: to ?? c.dur, rate, loop, hold, fadeIn, fadeOut, env: this.e ? 1 : 0, end: false }; // (from another gesture: the crossfade carries it)
    this.fresh = true;
    return true;
  }
  stop(fade = 0.15) { const e = this.e; if (e && !e.end) { e.end = true; e.fadeOut = Math.min(e.fadeOut, fade); } }
  update(dt) {
    const e = this.e; if (!e) return;
    e.t += dt * e.rate;
    if (e.hold) e.t = Math.min(e.t, e.to);
    else if (!e.loop && e.t >= e.to - e.fadeOut * e.rate) e.end = true;
    e.env = e.end ? e.env - dt / Math.max(1e-3, e.fadeOut) : Math.min(1, e.env + dt / Math.max(1e-3, e.fadeIn));
    if (e.end && e.env <= 0) this.e = null;
  }
  /** The gesture's pose into `out`; its weight over the stance (0: nothing plays). */
  sample(out) {
    const e = this.e; if (!e) return 0;
    this.C.sample(e.clip, e.loop ? e.t : Math.min(e.t, e.to), out, e.loop);
    return sm(e.env);
  }
}

/** The legs of a tool's clip while they stand (STAND LEGS above): `src` a pose, or a clip name sampled at `t`. */
export function standLegs(ch, P, base, src, w, st, dt = 1 / 60, { t = 0, loop = false } = {}) {
  const C = ch.clips, want = src && P.grounded ? 1 - THREE.MathUtils.smoothstep(Math.hypot(P.vel.x, P.vel.z), 0.3, 1.6) : 0;
  st.stand = THREE.MathUtils.damp(st.stand || 0, want, want > (st.stand || 0) ? 12 : 8, dt);
  st.w = THREE.MathUtils.damp(st.w || 0, w, w > (st.w || 0) ? 30 : 12, dt);
  if (typeof src === 'string' && C.clips[src]) {
    const c = C.clips[src], tt = loop ? ((t % c.dur) + c.dur) % c.dur : t;
    const pose = C.sample(src, tt, (st.pose ||= C.pose()), loop), R = rootOf(C, src);
    if (R) { R.at(tt, _a); pose.p[0] -= _a.x; pose.p[2] -= _a.z; }
  } else if (src && typeof src !== 'string') (st.pose ||= C.pose()).copy(src);
  if (st.stand * st.w < 0.01 || !st.pose) return; // (no clip this frame: the last legs ease out from where they were)
  if (!st.lower || st.lower.length !== C.nb) st.lower = Float32Array.from(ch.MASK_UPPER, (v) => 1 - v);
  C.blend(base, st.pose, st.stand * st.w, st.lower, 1);
}

/** The layer held as it was and faded out under the next (CROSSFADE above). `mask` and `w` limit it to some bones and some of the time;
 *  `reset()` when the layer was not drawn this frame, so a later change never fades in a pose from before the gap. */
export class Crossfade {
  constructor(C, dur = 0.1) { this.C = C; this.dur = dur; this.d = dur; this.held = C.pose(); this.last = C.pose(); this.x = 1; this.has = false; this.key = null; }
  /** What plays has changed: the last pose shown is held and eased out over `dur`. */
  cut(dur = this.dur) { if (!this.has) return; this.held.copy(this.last); this.x = 0; this.d = Math.max(1e-3, dur); }
  /** Once a frame, on the finished layer: eased from the held pose, and kept as the last shown. */
  apply(out, dt, mask = null, w = 1) {
    if (this.x < 1) { this.x = Math.min(1, this.x + dt / this.d); this.C.blend(out, this.held, (1 - sm(this.x)) * w, mask, 1); }
    this.last.copy(out); this.has = true;
    return out;
  }
  /** `apply`, cutting first when `key` (what plays now) changed from the last frame's. */
  keyed(out, key, dt, mask = null, w = 1) {
    if (key !== this.key) { if (this.key != null && key != null) this.cut(); this.key = key; }
    return this.apply(out, dt, mask, w);
  }
  reset() { this.has = false; this.x = 1; }
}

/** How much of the legs is the tool's now: the engine's standing weight for its moves, or standLegs' for the tool's own clips. */
export const legsW = (moves, st) => Math.max(moves?.legW || 0, st?.stand || 0);

/** Turn the tool at world matrix M about its origin (the hand) so that none of `points` ({ x, y, z, r }: tool frame, and a radius) is
 *  under `floorY`: in the vertical plane through the lowest of them, upward, by no more than `max` radians. */
export function liftAbove(M, points, floorY, max = 0.8) {
  _o.setFromMatrixPosition(M);
  let need = 0, pr = 0;
  for (const pt of points) {
    _w.set(pt.x, pt.y || 0, pt.z || 0).applyMatrix4(M);
    const under = floorY + (pt.r || 0) - _w.y;
    if (under > need) { need = under; _p.copy(_w); pr = pt.r || 0; }
  }
  if (need <= 1e-4) return 0;
  const d = _w.subVectors(_p, _o), len = d.length(), flat = Math.hypot(d.x, d.z);
  if (len < 0.15 || flat < 1e-3) return 0;
  const e0 = Math.asin(THREE.MathUtils.clamp(d.y / len, -1, 1)), e1 = Math.asin(THREE.MathUtils.clamp((floorY + pr - _o.y) / len, -1, 1));
  const a = Math.min(max, e1 - e0);
  if (!(a > 1e-4)) return 0;
  _ax.set(-d.z, 0, d.x).normalize(); // (d x up: turning about it raises d)
  _q.setFromAxisAngle(_ax, a);
  _r.makeRotationFromQuaternion(_q);
  M.premultiply(_t.makeTranslation(-_o.x, -_o.y, -_o.z)).premultiply(_r).premultiply(_t.makeTranslation(_o.x, _o.y, _o.z));
  return a;
}

/** The ground's height under (x, z), looked for from a little above `y` down (the feet's height when nothing is found). */
export function floorUnder(game, P, x, z, y) {
  const hit = game.physics?.raycast(_a.set(x, y + 0.6, z), _down, 1.8, P.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
  return hit ? hit.point.y : P.renderPos.y;
}

/** The free hand (`side`) onto the tool's haft (world matrix M, +X along it) where the clip already has it near: within `near` m of the
 *  haft and between `from` and `to` along it, fully; past `far`, not at all (the clip has let go). Its place moves; its wrist is the
 *  clip's. `state.k` is the weight, damped. */
export function closeHand(ch, grip, M, state, dt, { side = 'L', from = -1, to = 1, near = 0.1, far = 0.2 } = {}) {
  const hand = side === 'L' ? ch.bones.handL : ch.bones.handR;
  _m.multiplyMatrices(hand.matrixWorld, side === 'L' ? grip.L : grip.R); _a.setFromMatrixPosition(_m);
  _o.setFromMatrixPosition(M); _x.setFromMatrixColumn(M, 0).normalize();
  const d = _w.subVectors(_a, _o), x = d.dot(_x);
  d.addScaledVector(_x, -x);
  const perp = d.length(), want = x > from && x < to ? 1 - THREE.MathUtils.smoothstep(perp, near, far) : 0;
  state.k = THREE.MathUtils.damp(state.k || 0, want, 14, dt);
  if (state.k < 0.01 || perp < 0.004 || !Number.isFinite(perp)) return;
  hand.getWorldPosition(_p).sub(d);
  ch.reachHand(side, _p, hand.getWorldQuaternion(_q), state.k);
}

/** In a Moveset's onBegin: a whole-body move whose def has `carry` keeps that much forward speed on top of its clip's own travel, eased
 *  to nothing by clip time `carryTo` (its end, else), the engine's drive left as it is beneath (tools/moveset.js carries it in Launch). */
export function carryInto(moves, c) {
  const L = moves.P.techs.get('launch'), o = L?.o;
  if (!c.def.carry || !o?.drive || !c.tag || o.tag !== c.tag) return; // (a move played on the upper body alone, as mid-mantle, has no launch to carry: casebook 35)
  const own = o.drive, from = c.def.from || 0, to = c.def.carryTo ?? c.def.to ?? moves.dur(c.def);
  o.drive = (vel, dt, l) => {
    own(vel, dt, l);
    if (moves.cur !== c) return;
    const k = c.def.carry * (1 - THREE.MathUtils.clamp((c.t - from) / Math.max(0.01, to - from), 0, 1)) ** 1.5 * (c.scale ?? 1);
    vel.x += Math.sin(c.yaw) * k; vel.z += Math.cos(c.yaw) * k;
  };
}
