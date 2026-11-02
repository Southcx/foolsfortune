// ---------------------------------------------------------------------------------------
// THE MECH'S SPECIALS (South, 2026-11-02: "bake special moves into a per-part basis, and amplify/modify existing God Art abilities"):
// each worn part's special (progress/mechs/specials.js PART_SPECIALS) on its slot's key (the head E, the arms Q, the legs R, the core Y),
// paid from the battery (the pilot's spent kJ), resting `rest` real s, its strength by the domain's level (specialK), striking the
// toy city (city.js strike) and the straw giant (mechtech.js hitGiant) as the techniques do. What lasts (a mark, a ward, a haste) is a
// modifier with its source in the frame (base change bad, modifiers good): the weapons' marked weak point, `wardK` on every blow the
// pilot takes, `hasteK` on its walk and its arms' cooling. An arm gone takes the arms' special with it; the legs broken, the legs'.
//
// Prior art: Medabots (a part's own action), the god hand's powers (godhand/powers.js) at the frame's scale, Ultimate Destruction's
// moves on keys the body already has (mechtech.js).
//
//   const S = new MechSpecials(pilot)   S.reset()   S.drive(K, dt)   S.wardK   S.hasteK   S.ready(slot) -> 0..1 (its rest run out)
//   events: mech.special { slot, part, power, kind, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SPECIAL_KEYS, specialsOf, specialK } from '../../progress/mechs/specials.js';
import { outputK } from '../../progress/mechs/rules.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3();
/** Which regions a slot's special needs whole (an arm gone takes the arms' special; the legs broken, the legs'). */
const NEEDS = { arms: ['armR', 'armL'], legs: ['legs'], head: ['head'], core: ['core'] };

export class MechSpecials {
  constructor(pilot) { this.p = pilot; this.game = pilot.game; this.reset(); }
  reset() { this.t = 0; this.cool = {}; this.wardT = 0; this.wardK0 = 1; this.hasteT = 0; this.hasteK0 = 1; this.markT = 0; }
  get list() { return specialsOf(this.p.stats); }
  get wardK() { return this.wardT > 0 ? this.wardK0 : 1; }
  get hasteK() { return this.hasteT > 0 ? this.hasteK0 : 1; }
  ready(slot) { const S = this.list[slot]; if (!S) return 0; const c = this.cool[slot] ?? 0; return c <= this.t ? 1 : 1 - (c - this.t) / S.rest; }
  out() { return this.p.berserk > 0 ? outputK(1) : outputK(this.p.sync); }
  amp(S) { return specialK(S, this.game.psyche?.level?.(S.domain) ?? 1); }

  drive(K, dt) {
    this.t += dt;
    if (this.wardT > 0) this.wardT -= dt;
    if (this.hasteT > 0) this.hasteT -= dt;
    if (this.markT > 0 && (this.markT -= dt) <= 0 && this.p.weapons) this.p.weapons.marked = false;
    if (this.p.berserk > 0) return;
    const L = this.list;
    for (const [slot, key] of Object.entries(SPECIAL_KEYS)) {
      const S = L[slot]; if (!S || !K.pressed(key)) continue;
      if ((this.cool[slot] ?? 0) > this.t) continue;
      if (NEEDS[slot].some((r) => this.p.broken(r)) && !(slot === 'arms' && NEEDS.arms.some((r) => !this.p.broken(r)))) continue;
      if (this.fire(S) === false) continue;
      this.cool[slot] = this.t + S.rest; this.p.spend(S.kJ);
      this.game.events?.emit('mech.special', { slot, part: S.id, power: S.power, kind: S.kind, by: 'courier' });
    }
  }

  /** One special let go; false when it found nothing to do (no cost, no rest). */
  fire(S) {
    const p = this.p, T = p.tech, a = this.amp(S), o = this.out(), f = p.forward(_f), chest = T.chest(_a);
    const giantIn = (reach) => { const G = p.giant; return G && Math.hypot(G.pos.x - p.pos.x, G.pos.z - p.pos.z) <= reach + 8 ? G : null; };
    switch (S.kind) {
      case 'scan': { if (!p.weapons) return false; p.weapons.marked = true; this.markT = S.for * a; return true; }
      case 'ward': { this.wardT = S.for * a; this.wardK0 = Math.max(0.1, S.k / a); return true; }
      case 'hasten': { this.hasteT = S.for * a; this.hasteK0 = 1 + (S.k - 1) * a; return true; }
      case 'gust': {
        const reach = S.reach * a; T.city?.strike({ kind: 'cone', at: chest, dir: f, r: reach, angle: S.angle, only: 'glass' }, 1, 'courier');
        T.city?.strike({ kind: 'cone', at: chest, dir: f, r: reach * 0.5, angle: S.angle, only: 'timber' }, 1, 'courier');
        const G = giantIn(reach); if (G && this.facing(G, S.angle * 1.4)) T.hitGiant(`special.${S.id}`, S.k * a * o, S.stagger * a, 'body');
        p.faceGiant?.(reach); return true;
      }
      case 'sunder': {
        const reach = S.reach * a, to = _b.copy(chest).addScaledVector(f, reach);
        T.city?.strike({ kind: 'capsule', at: chest, to, r: S.r }, S.k * a * o, 'courier');
        const G = giantIn(reach); if (G && this.facing(G, 0.35)) T.hitGiant(`special.${S.id}`, S.k * a * o, S.stagger * a, 'body', true);
        p.weapons && (p.weapons.arms.R.swing = 1); p.faceGiant?.(reach); return true;
      }
      case 'quake': {
        const r = S.r * a; T.city?.strike({ kind: 'ball', at: _b.copy(p.pos), r }, S.k * a * o, 'courier');
        const G = giantIn(r); if (G) T.hitGiant(`special.${S.id}`, S.k * a * o, S.stagger * a, 'legs', true);
        p.shake = Math.max(p.shake || 0, 0.6); return true;
      }
      case 'blink': {
        const reach = S.reach * a; p.pos.addScaledVector(f, reach); p.clampPos?.();
        T.city?.strike({ kind: 'ball', at: _b.copy(p.pos).setY(p.pos.y + 4), r: 6 }, 0.8, 'courier'); // (the portal closes where you stand: what was there is gone)
        return true;
      }
      case 'pull': {
        const P = p.hangar.props; if (!P || P.held) return false;
        const r = P.nearest(p.pos, S.reach * a); if (!r) return false;
        r.mesh.position.set(p.pos.x + f.x * 6, r.mesh.position.y, p.pos.z + f.z * 6); // (drawn in to the hand's reach, then taken)
        return P.grab();
      }
    }
    return false;
  }
  facing(G, angle) { const p = this.p, f = p.forward(_f); _a.set(G.pos.x - p.pos.x, 0, G.pos.z - p.pos.z).normalize(); return f.dot(_a) >= Math.cos(angle); }
}
