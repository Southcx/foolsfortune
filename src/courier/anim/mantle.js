// ---------------------------------------------------------------------------------------
// THE MANTLE'S CLIPS: the body over a ledge, timed to the core's mantle (player.js moves the capsule: up first, then over; only what is
// shown is chosen here). Three kinds, by what began it (`player.mantle`):
//   THE CLIMB      a ledge from the ground or the air: Trav_Mantle (`climb`, UAL ClimbUp_1m's twin) over the mantle's progress, as before
//   THE STEP-OVER  a knee-high wall (`mantle.step`): Trav_Vault's hop (the hand planted, the legs over), time-warped onto the step (0.14 to
//                  0.22 s against the clip's 0.45 s), in place, its rise taken out (the capsule rises; only the clip's dips are kept)
//   THE PULL-UP    from a ledge hang (`mantle.pull`, set by moves/hang.js): Trav_LedgeClimbUp time-warped onto the pull-up (0.39 s
//                  against 1.2 s). The hips follow the clip's own path in the world, whatever the capsule's (the capsule's travel is
//                  taken out of them), from where the hang held them; the last of the difference is eased out as it ends
// The kind is kept after the mantle ends, for the fade.
//
// Prior art: Uncharted's and Assassin's Creed's ledge climbs (a captured climb warped onto the game's own timing, the hands planted by IK
// on the lip: character.js); Mirror's Edge's speed vault for the step-over.
//
//   const mantle = new MantleClips(ch)    mantle.pose(dt, s, mn, base)   (mn: the mantle's blend; s.techs.player.mantle read when there)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { inPlace } from './layers.js';

/** The step-over: Trav_Vault from the plant (0.1) to the landing (0.55). */
export const VAULT = { clip: 'Trav_Vault', from: 0.1, to: 0.55 };
/** The pull-up: Trav_LedgeClimbUp from the pull (0.07) to standing (1.27); the hang's offset (moves/hang.js: the clip's hands onto the
 *  ledge, and the body drawn to the wall) at its start; the difference left at the end eased out over the last `ease` of the pull. */
export const PULL = { clip: 'Trav_LedgeClimbUp', from: 0.07, to: 1.27, ease: 0.4 };

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const _d = new THREE.Vector3(), _e = new THREE.Vector3();

export class MantleClips {
  constructor(ch) { this.ch = ch; this.C = ch.clips; this.kind = 'climb'; this.end = new THREE.Vector3(); this.p = this.C.pose(); }

  pose(dt, s, mn, base) {
    const m = s.techs?.player?.mantle || null, C = this.C, A = T.anim, u = THREE.MathUtils.clamp(s.mantleT ?? 1, 0, 1);
    if (m) { this.kind = m.pull ? 'pull' : m.step ? 'step' : 'climb'; this.m = m; }
    if (mn <= 0.001) return;
    if (this.kind === 'step') {
      const t = THREE.MathUtils.lerp(VAULT.from, VAULT.to, u), p = C.sample(VAULT.clip, t, this.p, false), y0 = C.clips[VAULT.clip].p[1];
      inPlace(C, p, VAULT.clip, t, 'xz');
      p.p[1] = Math.min(p.p[1], y0); // (the capsule does the rising: only the clip's dips are kept)
      C.blend(base, p, mn);
      return;
    }
    if (this.kind === 'pull' && this.m?.pull) {
      const M = this.m, t = THREE.MathUtils.lerp(PULL.from, PULL.to, u), p = C.sample(PULL.clip, t, this.p, false);
      const yaw = this.ch.root.rotation.y, cs = Math.cos(yaw), sn = Math.sin(yaw);
      // the capsule's travel since the pull began, in the body's frame (+z ahead, +x their left), taken out of the hips
      if (m) this.end.copy(s.pos);
      _d.subVectors(this.end, M.from);
      const dz = _d.x * sn + _d.z * cs, dx = _d.x * cs - _d.z * sn;
      const off = M.pull;
      p.p[0] += off.x - dx; p.p[1] += off.y - _d.y; p.p[2] += off.z - dz;
      // what is left of the difference at the end (the clip's last frame stands where the capsule will), eased out
      const k = smooth(1 - PULL.ease, 1, u);
      if (k > 0) {
        const h = C.sample(PULL.clip, PULL.to, this.ch.P.tmp2, false).p, tx = M.to.x - M.from.x, tz = M.to.z - M.from.z;
        _e.set(h[0] + off.x - (tx * cs - tz * sn), h[1] + off.y - (M.to.y - M.from.y), h[2] + off.z - (tx * sn + tz * cs));
        const rest = C.clips.idle.p; // (standing: where the idle holds the hips)
        p.p[0] -= (_e.x - rest[0]) * k; p.p[1] -= (_e.y - rest[1]) * k; p.p[2] -= (_e.z - rest[2]) * k;
      }
      C.blend(base, p, mn);
      return;
    }
    C.blend(base, C.sample('climb', THREE.MathUtils.lerp(A.climbFrom, A.climbTo, u), this.p, false), mn);
  }
}
