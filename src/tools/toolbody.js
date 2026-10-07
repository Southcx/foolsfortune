// ---------------------------------------------------------------------------------------
// TOOL BODY: what a held tool's own clips need beyond the combo engine (tools/moveset.js), written once for every tool that plays the
// Courier's suite through its own layer (the Soul Brush, the Dreamvane):
//
//  - STAND LEGS: standing still, an upper-body clip's legs are the clip's own (its stance, its weight, its crouch), its travel taken out
//    of the hips (casebook rule 19); moving, they are the run's. The engine does this for its own moves (`Moveset.legs`); a tool's
//    other clips (a load, a dowse, a survey) ask here.
//  - CROSSFADE: one move straight into the next (a string's blows, a hold into its release) is a cut between two clips that do not
//    meet (the clip QA's joins: up to 112 degrees between Brush_Combo1's end and Brush_Combo2's start); the layer as it last was is
//    held and faded out under the new move over a tenth of a second. Unreal's "inertialization" in its plainest form (the frozen
//    pose blend: a snapshot of the outgoing pose, faded, instead of keeping two clips running), as in UE4's Blend Profiles.
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
//   standLegs(ch, base, P, clip, t, w, state, dt, loop)   state: any object the caller keeps (its weight and buffers)
//   const X = new Crossfade(C)   X.apply(C, layer, key, dt)   (key: what is playing now; a change of key between two moves fades)
//   liftAbove(M, points, floorY, max) -> radians turned   (M: the tool's world matrix, turned in place about its origin: the hand)
//   floorUnder(game, P, x, z, y) -> the ground's height under (x, z) near y (a ray down; the feet's height if nothing is hit)
//   closeHand(ch, grip, M, state, dt, { side, from, to, near, far })   the free hand onto the haft where the clip has it near
//   carryInto(moves, c)   (a Moveset's onBegin) a whole-body move with `carry` (m/s) keeps the sprint it began in, eased away by `carryTo`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { rootOf } from './moveset.js';

const _a = new THREE.Vector3(), _o = new THREE.Vector3(), _w = new THREE.Vector3(), _p = new THREE.Vector3(), _ax = new THREE.Vector3();
const _q = new THREE.Quaternion(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4(), _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);

/** The legs of an upper-body clip, while they stand (damped in and out: `state.w`). */
export function standLegs(ch, base, P, clip, t, w, state, dt, loop = false) {
  const C = ch.clips, want = clip && P.grounded ? 1 - THREE.MathUtils.smoothstep(Math.hypot(P.vel.x, P.vel.z), 0.3, 1.6) : 0;
  state.w = THREE.MathUtils.damp(state.w || 0, want, want > (state.w || 0) ? 12 : 8, dt);
  if (clip) { state.clip = clip; state.t = t; }
  if (state.w < 0.01 || !state.clip || !C.clips[state.clip]) return;
  const c = C.clips[state.clip], tt = loop ? ((state.t % c.dur) + c.dur) % c.dur : state.t;
  const pose = C.sample(state.clip, tt, (state.buf ||= C.pose()), loop), R = rootOf(C, state.clip);
  if (R) { R.at(tt, _a); pose.p[0] -= _a.x; pose.p[2] -= _a.z; }
  if (!state.lower || state.lower.length !== C.nb) state.lower = Float32Array.from(ch.MASK_UPPER, (v) => 1 - v);
  C.blend(base, pose, state.w * w, state.lower, 1);
}

/** The layer held as it was and faded out under the next move (a frozen-pose crossfade). */
export class Crossfade {
  constructor(C, dur = 0.1) { this.snap = C.pose(); this.last = C.pose(); this.k = 0; this.key = null; this.dur = dur; this.has = false; }
  apply(C, layer, key, dt) {
    if (key !== this.key) { if (this.key != null && key != null && this.has) { this.snap.copy(this.last); this.k = 1; } this.key = key; }
    if (this.k > 0) { this.k = Math.max(0, this.k - dt / this.dur); const f = this.k * this.k * (3 - 2 * this.k); C.blend(layer, this.snap, f); }
    this.last.copy(layer); this.has = true;
    return layer;
  }
}

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
  if (!c.def.carry || o?.tag !== c.tag || !o.drive) return;
  const own = o.drive, from = c.def.from || 0, to = c.def.carryTo ?? c.def.to ?? moves.dur(c.def);
  o.drive = (vel, dt, l) => {
    own(vel, dt, l);
    if (moves.cur !== c) return;
    const k = c.def.carry * (1 - THREE.MathUtils.clamp((c.t - from) / Math.max(0.01, to - from), 0, 1)) ** 1.5 * (c.scale ?? 1);
    vel.x += Math.sin(c.yaw) * k; vel.z += Math.cos(c.yaw) * k;
  };
}
