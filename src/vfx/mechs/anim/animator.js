// ---------------------------------------------------------------------------------------
// A MECH'S ANIMATOR (the parts body's pose: vfx/mechs/partsbody.js pose({ anim })): the frame's movement drawn in two layers, as South
// asked (2026-11-02: "retarget Courier animations or build from scratch/open source libraries? Both?").
//   THE BASE   the Courier's own clips retargeted onto the mech's joints (retarget.js; which clip a state is: clipmap.js): idle and walk
//              blended by the walk's share, the walk's stride on the frame's gait (a step lands on a whole gait), the skate's stance with
//              its turns blended by the carve's lean, the assault boost's ride, the air's rise and fall; the legs only on a biped (a
//              reverse joint, tetrapod or treads keeps its own walk: parts/legs.js)
//   THE KEYS   the mech's own held poses over it (keys.js): the skate stance, the assault's tuck, the quick boost's lurch and recovery,
//              the landing's squash, a turn's pivot; the doll's own layer (contrapposto, the hip's sway, her arms, the skater's line)
//   THE REST   the carve's lean into the curve and the boost's pitch on the whole body, the feet kept on the ground (the hips dropped by
//              what the legs' bend takes off their reach: a light correction, never a whole pose), the boosters aimed against the thrust
//              (anim/boosters.js), and the held blade's wrist rolled so the gunblade's cylinder reads at three-quarters
// It reads one plain object the pilot fills a frame (world/hangar/mechskate.js anim()), its moments as counters (a new quick boost is
// a new `qbId`): nothing allocated a frame. Every joint passes through the frame's range of motion after (rom.js MECH_ROM).
// Prior art: Unreal's layered blend (a base locomotion, additive poses over it), Armored Core 6's boosting stances and quick-boost
// lean, Titanfall's titan skating, the Courier's own key track (courier/anim/keyposes.js).
//
//   const A = new MechAnimator(body, pack)   A.apply(anim, dt) (after the legs' own pose, before the arms' blows)   A.ready
// ---------------------------------------------------------------------------------------
import { MechRetarget, newSlot } from './retarget.js';
import { MECH_CLIPS, WEIGHT, profileOf } from './clipmap.js';
import { SKATE, ASSAULT, SQUASH, PIVOT, DOLL, addKey, lurchAt, addLurch } from './keys.js';

/** The animator's own numbers: each state's weight eased (a real s^-1), the walk's play speed against the gait, the skate clip's
 *  speed, the landing's hold (s at k 1, x the feel's `hold`) and the pivot's (s), the doll's sway, the Courier's hip height (m: the
 *  air's rise scaled to the frame by its own hip), the blade's wrist roll (rad, outward), the reach a leg's drop is measured by. */
export const MECH_ANIM = { ease: 7, skateRate: 0.55, land: { snap: 0.06, hold: 0.12, out: 0.3 }, pivot: 0.42, sway: 1, courierHip: 0.73, bladeRoll: 0.55 };
const PI = Math.PI;

export class MechAnimator {
  constructor(body, pack) {
    this.body = body; this.R = new MechRetarget(pack); this.pack = pack;
    this.s = { base: newSlot(), b: newSlot(), c: newSlot() };
    this.w = { skate: 0, air: 0, assault: 0, walk: 0 }; this.t = 0; this.stamp = -1;
    this.qb = { id: -1, t: 99, f: 0, l: 0 }; this.land = { id: -1, t: 99, k: 0 }; this.piv = { id: -1, t: 99, s: 1 };
  }
  get ready() { return !!this.R; }
  /** Bind to the frame as built (its rests, its profile, its legs' kind), again whenever a slot or the arms' layout changed it. */
  bind() {
    const B = this.body, j = B.joints; this.R.bind(j); this.stamp = B.rigStamp;
    this.profile = profileOf(B.F); this.C = MECH_CLIPS[this.profile]; this.W = WEIGHT[this.profile];
    this.biped = B.stats?.legType === 'biped' && !!j.kneeL && !!j.ankleL;
    if (this.profile === 'doll' && !this.R.has(this.C.walk)) this.pack.social?.then?.(() => {}); // (her walk is in the social pack: asked for once)
    this.leg = {};
    for (const k of ['L', 'R']) if (j[`knee${k}`] && j[`ankle${k}`]) this.leg[k] = { T: Math.abs(j[`knee${k}`].position.y), Sh: Math.abs(j[`ankle${k}`].position.y) };
    this.reach0 = this.reach(true);
    // the per-state weights with the legs left out where the legs are not a biped's
    const strip = (W) => (this.biped ? W : { ...W, hipL: 0, kneeL: 0, ankleL: 0, hipR: 0, kneeR: 0, ankleR: 0 });
    this.WS = { ground: strip(this.W.ground), skate: strip(this.W.skate), air: strip(this.W.air), lurch: strip(this.W.lurch) };
    this.mix = { ...this.WS.ground };
  }
  /** The lower leg's reach from the hip (m: the longest of the two, in the sagittal plane), at rest or as posed. */
  reach(rest = false) {
    const j = this.body.joints, px = rest ? 0 : j.pelvis.rotation.x; let best = 0;
    for (const k in this.leg) {
      const L = this.leg[k], h = j[`hip${k}`], kn = j[`knee${k}`], hx = rest ? h.userData.rest.x : h.rotation.x, kx = rest ? kn.userData.rest.x : kn.rotation.x;
      const a = px + hx, r = L.T * Math.cos(a) + L.Sh * Math.cos(a + kx) * Math.cos(rest ? 0 : h.rotation.z * 0.5);
      if (r > best) best = r;
    }
    return best;
  }

  apply(a, dt) {
    const B = this.body; if (this.stamp !== B.rigStamp) this.bind();
    const j = B.joints, R = this.R, C = this.C;
    dt = Math.min(Math.max(dt || 0, 0), 0.1); this.t += dt;
    const E = 1 - Math.exp(-dt * MECH_ANIM.ease * (0.6 + 0.8 * (a.feel ?? 0.65)));
    const W = this.w;
    W.skate += ((a.skate ? 1 : 0) - W.skate) * E; W.air += ((a.grounded ? 0 : 1) - W.air) * E; W.assault += ((a.assault ? 1 : 0) - W.assault) * E;
    W.walk += ((a.walk ?? 0) - W.walk) * E;
    // the moments, by their counters
    if (this.first !== false) { this.first = false; this.qb.id = a.qbId; this.land.id = a.landId; this.piv.id = a.pivotId; } // (what happened before the first look is not replayed)
    if (a.qbId !== this.qb.id) { this.qb.id = a.qbId; this.qb.t = 0; this.qb.f = a.qbF || 0; this.qb.l = a.qbL || 0; B.boosters?.puff(-this.qb.l, 0, -this.qb.f); }
    if (a.landId !== this.land.id) { this.land.id = a.landId; this.land.t = 0; this.land.k = a.landK || 0; }
    if (a.pivotId !== this.piv.id) { this.piv.id = a.pivotId; this.piv.t = 0; this.piv.s = a.pivotSide || 1; }
    this.qb.t += dt; this.land.t += dt; this.piv.t += dt;
    // ---- the base: the clips blended, then retargeted
    const S = this.s, base = S.base, gait = a.gait || 0, walkAt = ((gait / 2) % 1 + 1) % 1;
    R.sample(base, C.idle, this.t, true);
    if (W.walk > 0.01) { const walk = R.has(C.walk) ? C.walk : C.walkAlt; if (walk && R.sample(S.b, walk, walkAt * this.pack.clips[walk].dur, true)) R.blend(base, S.b, W.walk); }
    if (W.skate > 0.01) {
      R.sample(S.b, C.skate, this.t * MECH_ANIM.skateRate, true);
      const lean = a.leanX || 0, turn = lean > 0 ? C.carveL : C.carveR;
      if (Math.abs(lean) > 0.02 && R.sample(S.c, turn, this.t * MECH_ANIM.skateRate, true)) R.blend(S.b, S.c, Math.min(1, Math.abs(lean) * 3));
      if (W.assault > 0.01 && R.sample(S.c, C.assault, this.t, true)) R.blend(S.b, S.c, W.assault);
      R.blend(base, S.b, W.skate);
    } else if (W.assault > 0.01 && R.sample(S.b, C.assault, this.t, true)) R.blend(base, S.b, W.assault);
    if (W.air > 0.01) { R.sample(S.b, (a.vy ?? 0) > 0 ? C.air : C.fall, this.t, true); R.blend(base, S.b, W.air); }
    const L = lurchAt(this.qb.t, a.recov || 0.4);
    if (L.brace > 0.01) { const d = this.qb, key = Math.abs(d.f) >= Math.abs(d.l) ? (d.f >= 0 ? 'f' : 'b') : (d.l > 0 ? 'l' : 'r'); R.sample(S.b, C.lurch[key], C.lurchFrame / 30, false); this.lurchW = L.brace; } else this.lurchW = 0;
    const lw = this.landW(a), mix = this.mix, G = this.WS.ground, K = this.WS.skate, A = this.WS.air, Q = this.WS.lurch;
    for (const id in mix) mix[id] = (G[id] * (1 - W.skate) + K[id] * W.skate) * (1 - W.air) + A[id] * W.air;
    R.apply(base, j, mix);
    if (this.lurchW > 0) { for (const id in mix) mix[id] = Q[id] * this.lurchW; R.apply(S.b, j, mix); }
    // ---- the keys
    const sk = W.skate * (1 - W.air);
    addKey(j, SKATE, sk * (1 - W.assault)); addKey(j, ASSAULT, W.assault * (1 - W.air * 0.5));
    if (L.brace > 0.01 || Math.abs(L.push) > 0.01) addLurch(j, this.qb.f, this.qb.l, L.push, L.brace * (1 - W.air));
    addKey(j, SQUASH, lw * Math.min(1, 0.35 + 0.65 * this.land.k)); // (the key alone: with the landing clip under it the two folded the frame flat, the one look of 2026-11-02)
    const pv = this.piv.t < MECH_ANIM.pivot ? Math.sin((PI * this.piv.t) / MECH_ANIM.pivot) : 0;
    if (pv > 0) { if (this.piv.s > 0) addKey(j, PIVOT, pv); else this.mirrorPivot(pv); }
    if (this.profile === 'doll') {
      addKey(j, DOLL.rest, 1 - sk * 0.6); addKey(j, DOLL.skate, sk * (1 - W.assault));
      const sway = Math.sin(PI * gait) * W.walk * (1 - W.air) * (1 - sk) * MECH_ANIM.sway; if (Math.abs(sway) > 0.001) addKey(j, DOLL.walk, sway);
    }
    // ---- the whole body: the carve's lean, the boost's pitch
    j.pelvis.rotation.z -= (a.leanX || 0) * (1 - W.air * 0.5); j.pelvis.rotation.x += (a.pitch || 0) * 0.6;
    if (j.chest) j.chest.rotation.z += (a.leanX || 0) * 0.25; // (the chest kept a little upright over the lean: a skater's head stays level)
    // ---- the held blade's wrist (the gunblade's cylinder at three-quarters: its flat turned away from the chase camera)
    for (const [s, k] of [[1, 'L'], [-1, 'R']]) if (B.sel?.[`weapon${k}`] === 'greatBlade' && j[`wrist${k}`]) j[`wrist${k}`].rotation.y += s * MECH_ANIM.bladeRoll;
    // ---- a thigh swung high turned out clear of the hero's codpiece (past 1.4 rad forward it would clip it: legs.js), and the codpiece told
    for (const [s, k] of [[1, 'L'], [-1, 'R']]) { const h = j[`hip${k}`]; if (h && this.biped) { const over = Math.min(1, Math.max(0, (-h.rotation.x - 1.1) / 0.3)); if (over > 0) h.rotation.z += s * 0.35 * over; } }
    B.legs?.follow?.();
    // ---- the feet on the ground: the hips dropped by the reach the legs' bend takes; in the air the clip's own rise
    const air = R.rootY(base) * (B.hip / MECH_ANIM.courierHip) * W.air;
    if (this.biped) B.body.position.y = -Math.max(0, this.reach0 - this.reach()) * (1 - W.air) + air; else B.body.position.y += air; // (another leg kind drops by its own walk: parts/legs.js drop)
    // ---- the boosters against the thrust
    B.boosters?.aim(a.boostX || 0, a.boostY ?? -0.85, a.boostZ ?? -0.5, a.boostK || 0);
  }
  /** The landing's weight now: snapped in, held by its weight and the feel, eased out. */
  landW(a) {
    const T = MECH_ANIM.land, t = this.land.t, k = this.land.k, hold = T.hold * (0.4 + k) * (a.hold ?? 1), out = T.out * (a.recov ? a.recov / 0.4 : 1);
    if (t < T.snap) return (t / T.snap) * k; if (t < T.snap + hold) return k; const u = (t - T.snap - hold) / out; return u < 1 ? k * (1 - u) * (1 - u) : 0;
  }
  /** The pivot's key mirrored (to the right): its yaw and rolls turned the other way. */
  mirrorPivot(w) {
    const j = this.body.joints;
    for (const id in PIVOT) { const o = j[id]; if (!o) continue; const v = PIVOT[id]; o.rotation.y -= v[1] * w; o.rotation.z -= v[2] * w; o.rotation.x += v[0] * w; }
    // (the legs swap their loads)
    for (const p of ['hip', 'knee', 'ankle']) { const L = PIVOT[`${p}L`], Rr = PIVOT[`${p}R`]; if (j[`${p}L`]) j[`${p}L`].rotation.x += (Rr[0] - L[0]) * w; if (j[`${p}R`]) j[`${p}R`].rotation.x += (L[0] - Rr[0]) * w; }
  }
}
