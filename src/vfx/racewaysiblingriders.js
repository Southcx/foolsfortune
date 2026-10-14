// ---------------------------------------------------------------------------------------
// THE SIBLING RIDERS (docs/plans/SKIFF-RACING.md section 12; Dovina's handoff of 2026-10-14, item 5): the Sibling roster's rivals (Petra,
// Calissa, Espada: world/raceway/rivals.js ROSTERS.siblings) each riding the Solar Skiff in its own body, where the placeholder was a
// coloured capsule. The board is the rivals' look's (vfx/racewayrivals.js, at the Courier's full size here: a sibling is a Courier, so its
// board is the Courier's); this is the one on it.
//   - THE BODY: a sibling's rig as the party makes one (coop/party.js `makeRig`: another Courier's model on its own fade, parsed when it is
//     wanted, never at boot), dressed in its division's look (vfx/siblinglooks.js, through the vessel's dress, `own`: the kiln never
//     reaches it). Made once a session for each sibling raced, kept between races; no gun (a sibling races unarmed).
//   - THE RIDE: the Courier's own rider clips on the same rig (courier/skiff/rider.js's ride, cut to what a rival does): Skiff_RideIdle into
//     Skiff_RideCruise by speed, Skiff_RideTurnL / TurnR by the turn rate (the heel side into a left bend, the toe side into a right: the
//     rider faces over the starboard side), the stance placed in the board's frame as the Courier's is (skiff.js: the deck's height, the
//     `rider` bone's place, a quarter turn to face out), then the joints' limits last (anim/rom.js, the rig's own).
//   - A TAKEDOWN: while spun out (r.wreck), the whole rider cartwheels about the bow off the deck and lands back, as the clapperjar does,
//     the flare's tuck (Skiff_BoostLoop) held through it; then the board's wobble.
//   - THE FINISH: the sail let down (Skiff_Furl) and the stance eased to the idle as it rolls out.
// One shadow a rider (the body's largest mesh; the rest cast none). Materials: the rig's family's (character.js), the same programs as
// the Courier's and the party's: 0 programs added. Draw calls a rider: a sibling's in view (about 12, coop/party.js CAP's note).
//
// Prior art: Mario Kart's and Crash Team Racing's racers (each its own body on the same kart), Kirby Air Ride's riders leaning on their
// machines; the party's own siblings (coop/sibling.js: one body, two drivers), the Courier's rider (courier/skiff/rider.js).
//
//   const S = new RacewaySiblingRiders(game)   S.seat(L, id) -> rider | null (null until its rig is in)   S.ride(L, r, dt, t, turn)
//   S.of(name) -> sibling id | null   SIBLING_RIDE (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SKIFF } from '../courier/skiff/boat.js';
import { SIBLING_LOOKS } from './siblinglooks.js';
import { DEFAULT_LOOK } from '../courier/vessel/glazes.js';

/** The numbers: the board's scale under a sibling (the Courier's own: 1); the turn rate (rad/s) at which a carve is all of the turn clip;
 *  the speed (m/s) from which the stance is all cruise; the tumble (real s, its hop m: the clapperjar's); the finish's furl (its weight). */
export const SIBLING_RIDE = { board: 1, turnFull: 0.35, cruise: [1.5, 14], tumble: { dur: 1.1, hop: 0.9 }, furl: 0.6 };

const UP = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const clamp = THREE.MathUtils.clamp, damp = THREE.MathUtils.damp;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const qFace = new THREE.Quaternion().setFromAxisAngle(UP, -Math.PI / 2); // (the rider faces out over the starboard side: skiff.js qFace)
const _q = new THREE.Quaternion();

export class RacewaySiblingRiders {
  constructor(game) { this.game = game; this.rigs = new Map(); this.coming = new Map(); }

  /** A roster's name as a sibling's id ('Petra' -> 'petra'), if it is one. */
  of(name) { const id = String(name || '').toLowerCase(); return SIBLING_LOOKS[id] ? id : null; }

  /** The look a sibling wears (its division's, else the house's). */
  look(id) { return SIBLING_LOOKS[id] ?? DEFAULT_LOOK; }

  /** A sibling's rig, made once (the party's maker) and kept; null until it is in. */
  rig(id) {
    if (this.rigs.has(id)) return this.rigs.get(id);
    const make = this.game.party?.makeRig;
    if (!make || this.coming.has(id)) return null;
    this.coming.set(id, make().then((rig) => {
      rig.gun?.removeFromParent(); rig.gunOff = true; rig.root.name = `SiblingRider-${id}`;
      this.game.vessel?.dress(rig, this.look(id), { own: true });
      // one shadow a rider: its largest mesh's
      let big = null, n = 0;
      rig.model.traverse((o) => { if (!o.isMesh || o.userData.isOutline) return; o.castShadow = false; const c = o.geometry?.attributes?.position?.count || 0; if (c > n) { n = c; big = o; } });
      if (big) big.castShadow = true;
      rig.root.removeFromParent();
      const C = rig.clips;
      this.rigs.set(id, { rig, A: C.pose(), B: C.pose() });
    }).catch((e) => { console.warn('a sibling rider', e); this.rigs.set(id, null); }));
    return null;
  }

  /** Seat a sibling on a dressed board (L: the rivals' look's record; its `unit` the board and rider banked as one). */
  seat(L, id) {
    const R = this.rig(id);
    if (!R) return null;
    const root = R.rig.root, s = L.scale ?? 1;
    L.unit.add(root); // (from the last race's board, if it was on one)
    root.position.set(0, SKIFF.deck * s, SKIFF.rider.z * s); root.quaternion.copy(qFace); root.scale.setScalar(s);
    return (L.rider = { id, R, turnW: 0, furlW: 0, tumble: 0 });
  }

  /** One rider's frame: the stance by the board's speed and turn, the takedown's cartwheel, the finish's furl, the limits last.
   *  turn: the board's turn rate (rad/s, + to the left); tumble: 0..1 through the takedown's cartwheel, or -1; t: its clock. */
  ride(L, r, dt, t, { turn = 0, tumble = -1 } = {}) {
    const S = L.rider; if (!S) return;
    const P = SIBLING_RIDE, { rig, A, B } = S.R, C = rig.clips, has = (n) => !!C.clips[n];
    if (!has('Skiff_RideIdle')) return;
    const v = r.v || 0, done = r.done != null;
    C.sample('Skiff_RideIdle', t, A, true);
    if (has('Skiff_RideCruise')) C.blend(A, C.sample('Skiff_RideCruise', t, B, true), smooth(P.cruise[0], P.cruise[1], v) * (done ? 0.5 : 1));
    // the carve: a left bend (the heading turning toward the board's left) is the heel side, a right the toe side
    S.turnW = damp(S.turnW, clamp(Math.abs(turn) / P.turnFull, 0, 1) * smooth(1, 8, v), 8, dt);
    const tc = turn > 0 ? 'Skiff_RideTurnL' : 'Skiff_RideTurnR';
    if (S.turnW > 0.01 && has(tc)) C.blend(A, C.sample(tc, t, B, true), S.turnW);
    // the finish: the sail let down
    S.furlW = damp(S.furlW, done ? P.furl : 0, 3, dt);
    if (S.furlW > 0.01 && has('Skiff_Furl')) C.blend(A, C.sample('Skiff_Furl', 0.96 * S.furlW, B, false), S.furlW);
    // the takedown: the flare's tuck held while it is thrown
    if (tumble >= 0 && tumble < 1 && has('Skiff_BoostLoop')) C.blend(A, C.sample('Skiff_BoostLoop', t, B, true), Math.sin(Math.PI * tumble));
    rig.applyPose(A);
    // the cartwheel about the bow (the rider's +X), up off the deck and back (the clapperjar's, at a Courier's height)
    const s = L.scale ?? 1, root = rig.root, half = 0.9 * s;
    if (tumble >= 0 && tumble < 1) {
      const spin = smooth(0, 1, tumble) * Math.PI * 2, hop = Math.sin(Math.PI * tumble) * P.tumble.hop;
      root.position.set(half * Math.sin(spin), SKIFF.deck * s + hop + half * (1 - Math.cos(spin)), SKIFF.rider.z * s); // (turned about its middle, half its height over the feet)
      root.quaternion.copy(qFace).premultiply(_q.setFromAxisAngle(Z, spin));
    } else {
      root.position.set(0, SKIFF.deck * s, SKIFF.rider.z * s); root.quaternion.copy(qFace);
    }
    root.updateMatrixWorld(true);
    rig.limits?.apply(); // (the joints' limits, last: anim/rom.js)
  }
}
