// ---------------------------------------------------------------------------------------
// THE MECH'S WEAPONS (docs/plans/MECHS.md 4.3, 4.5, 4.6, 4.9): the arm weapons on LMB and RMB and the back unit on G, each the part's own
// verb read from its numbers (progress/mechs/parts.js; no tool is named here: a part with `string` swings a string, one with `charge`
// shoots and charges, `volley` fires missiles, `block` is a shield; South, 2026-11-02: a blade and a blaster, the brush, bell, flail,
// vane and lens retired), and the charge (an assault boost into a giant, its blow the frame's momentum: frame.js chargeK). Each blow on a
// giant goes through its rules (giant.js blow: the barrier, the stagger, its vessel) at the part's k x outputK(sync) and its stagger.
//   the fist and the great blade: a string of three (the third heavy where the part says), a blow landing a beat after the press
//   the big gun: a shot at most `rate` a real s on a press; held `charge.hold` real s and let go, the charged beam (it pierces a barrier)
// An arm broken (MECHS.md 4.7) has no weapon; the back broken, no back unit. Shots are drawn as plain tracer lines (Calissa's looks later).
//
// Prior art: Armored Core's arm units (one trigger a hand), Ratchet & Clank's Giant Clank (a punch string and a charge), Evangelion's
// pallet rifle and progressive knife, the Courier's own tools' grammar (TOOLS-TOGETHER.md: the gun shoots, the bell tolls).
//
//   const W = new MechWeapons(pilot)   W.reset()   W.arm(side, { down, pressed, released })   W.backUnit(pressed)   W.update(dt)
//   W.swing(side) -> 0..1 (the pose)   W.charge(speed)   W.blockK(fromPos) -> the shield's share of a blow from there   TIMING   REGION_OF
//   W.later(t, fn, side?)   W.cancel(side) (an arm's blow still to land called back)   W.cityBlow(P, kind, k, heavy)
// v2 (MECHS.md 9): every blow also strikes the toy city where it lands (city.js: a fist a ball on the first cell along the arms' aim, a
// shot the first cell on its line, the beam a ray through everything); an arm past a fractured joint works at its lock
// (joints.js lockOf: k and timing), an arm gone at a joint has no weapon, the back mount snapped no back unit.
//   events: mech.hit { weapon, region, staggered, pierced, arm?, crit, blocked?, felled?, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { outputK } from '../../progress/mechs/rules.js';
import { chargeK } from '../../progress/mechs/frame.js';
import { MECH_BODY } from './mech.js';
import { GIANT_LOOK } from './giant.js';

/** Real seconds the parts' verbs take (placeholders for feel, South's to judge in play): a melee blow lands `land` after the press; a
 *  string keeps if the next press comes within `string`; between blows `cool`; missiles fly `fly`; the charge strikes once in `charge`. */
export const TIMING = { land: 0.3, string: 1.1, cool: 0.5, fly: 0.8, charge: 1, charge2: 5 };
/** Where on a giant each kind of blow lands (vessel.js FORMS.giant regions). */
export const REGION_OF = { string: 'body', shot: 'body', beam: 'body', volley: 'body', charge: 'body' };
const FRONT = Math.cos((70 * Math.PI) / 180); // (a melee blow lands on what stands within 70 degrees of the mech's facing)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3();

export class MechWeapons {
  constructor(pilot) { this.p = pilot; this.game = pilot.game; this.tracers = []; this.mat = null; this.reset(); }
  reset() {
    this.arms = { L: this.newArm(), R: this.newArm() }; this.pending = []; this.chargeCool = 0; this.backCool = 0; this.shieldUp = false;
    for (const T of this.tracers) { T.line.parent?.remove(T.line); T.line.geometry.dispose(); T.line.material.dispose(); } this.tracers = [];
  }
  newArm() { return { cool: 0, n: 0, sinceT: 9, hold: 0, swing: 0 }; }
  get stats() { return this.p.stats; }
  partOf(side) { return this.p.broken(side === 'L' ? 'armL' : 'armR') || !this.p.armLock(side) ? null : this.stats.parts[side === 'L' ? 'weaponL' : 'weaponR']; } // (an arm broken, or gone at a joint: no weapon)
  swing(side) { return this.arms[side].swing; }
  out() { return this.p.berserk > 0 ? outputK(1) : outputK(this.p.sync); }

  /** One arm's trigger this frame. */
  arm(side, { down, pressed, released }) {
    const A = this.arms[side], P = this.partOf(side); if (!P) return;
    const lock = this.p.armLock(side); // (a fractured joint: the arm works at joints.js JOINT.locked, its blows lighter and slower)
    A.sinceT += this.p.dt;
    if (P.charge) { // (a gun: a shot on the press, the charged beam on a long hold's release)
      if (pressed && A.cool <= 0) { this.shot(side, P, false); A.cool = 1 / (P.rate || 2) / lock; }
      A.hold = down ? A.hold + this.p.dt : A.hold;
      if (released) { if (A.hold >= P.charge.hold) this.shot(side, P, true); A.hold = 0; }
      return;
    }
    if (!pressed || A.cool > 0) return;
    if (P.string) { A.n = A.sinceT < TIMING.string ? (A.n % P.string) + 1 : 1; A.sinceT = 0; A.cool = TIMING.cool / lock; this.melee(side, P, { heavy: !!P.heavy && A.n === P.string, kind: 'string' }); return; }
  }

  /** The back unit on G: missiles, the shield raised or lowered. */
  backUnit(pressed) {
    const B = this.p.broken('back') || !this.p.armLock('back') ? null : this.stats.parts.back; if (!B || !pressed || this.backCool > 0) return; // (the back mount snapped: the back unit is gone)
    if (B.volley) { this.backCool = 2; this.p.spend(B.cost || 0); const G = this.p.giant, d = this.gap(); this.tracer(this.p.mech.back(_a), G ? G.c.center(_b) : _a.clone().addScaledVector(this.p.forward(_f), B.range), 0xffe0a0); if (G && d <= B.range) this.later(TIMING.fly, () => { for (let i = 0; i < B.volley; i++) this.land(B, 'volley', { k: B.k, stagger: B.stagger }); }); return; }
    if (B.block) { this.shieldUp = !this.shieldUp; this.backCool = 0.3; }
  }
  /** The share of a blow from `from` that gets through: the shield raised takes it from the front. */
  blockK(from) {
    const B = this.stats.parts.back; if (!this.shieldUp || !B?.block || this.p.broken('back')) return 1;
    _a.subVectors(from, this.p.pos).setY(0).normalize(); return _a.dot(this.p.forward(_f)) > 0.3 ? B.block : 1;
  }

  /** The gap (m) from the mech's footprint to the giant's, or Infinity. */
  gap() { const G = this.p.giant; if (!G?.c?.alive) return Infinity; return Math.hypot(G.pos.x - this.p.pos.x, G.pos.z - this.p.pos.z) - MECH_BODY.radius - GIANT_LOOK.radius; }
  inFront(cos = FRONT) { const G = this.p.giant; if (!G) return false; _a.subVectors(G.pos, this.p.pos).setY(0).normalize(); return _a.dot(this.p.forward(_f)) >= cos; }
  later(t, fn, side = null) { this.pending.push({ t, fn, side }); }
  /** An arm's blow still to land called back (the Thunderclap takes both hands: mechtech.js). */
  cancel(side) { this.pending = this.pending.filter((q) => q.side !== side); }

  melee(side, P, { heavy = false, kind }) {
    this.arms[side].swing = 1; this.p.spend(P.cost || 0); this.p.faceGiant(P.range * 2);
    const lock = this.p.armLock(side) || 1;
    this.later(TIMING.land / lock, () => {
      const k = P.k * (P.mass ? 1 : this.stats.punch) * lock;
      this.cityBlow(P, kind, k * this.out(), heavy); // (the toy city takes the blow where it lands: city.js, MECHS.md 9.1)
      if (this.gap() > P.range || !this.inFront()) return;
      this.land(P, kind, { k, heavy, arm: side });
    }, side);
  }
  /** A melee blow on the toy city: a ball on the first cell along the arms' aim within the part's reach (a fist a ball of 2 m, the heavy
   *  third 3 m: destruction.js carve's ball). */
  cityBlow(P, kind, k, heavy) {
    const C = this.p.hangar.city; if (!C?.built) return;
    const T = this.p.tech, from = T.chest(_a), dir = T.aim(_f);
    T.cityBlow(from, dir, MECH_BODY.radius + P.range, k, heavy ? 3 : 2);
  }

  /** A shot of the big gun, or the charged beam: aimed at the giant while it is within the lock and in view, else straight ahead. */
  shot(side, P, beam) {
    const G = this.p.giant, from = this.p.mech.hand(side, _a).clone(), d = this.gap(), lock = this.p.lockRange();
    const locked = G?.c?.alive && d <= lock && this.p.inView(G.pos);
    if (beam) this.p.spend(P.charge.cost); else this.p.spend(P.cost || 0);
    let to = locked ? G.c.center(_b).clone() : from.clone().addScaledVector(this.p.aimDir(_f), Math.min(P.range, 160));
    const armK = this.p.armLock(side) || 1, C = this.p.hangar.city;
    if (C?.built) { // (the toy city in the way: a shot strikes the first cell on its line and stops there; the beam carves a ray through everything)
      const dir = _f.subVectors(to, from).normalize(), len = from.distanceTo(to);
      if (beam) C.strike({ kind: 'ray', at: from, dir, r: 1.5 }, P.charge.k * this.out() * armK, 'courier');
      else { const hit = C.raycast(from, dir, len); if (hit) { C.strike({ kind: 'ball', at: hit.point, r: 1.2 }, P.k * this.out() * armK, 'courier'); to = hit.point; this.tracer(from, to, 0xffc070, 0.12); return; } }
    }
    this.tracer(from, to, beam ? 0xfff2b0 : 0xffc070, beam ? 0.5 : 0.12);
    if (locked && d <= P.range) this.land(P, beam ? 'beam' : 'shot', beam ? { k: P.charge.k * armK, pierce: true, stagger: P.stagger * 3, arm: side } : { k: P.k * armK, stagger: P.stagger, arm: side });
  }

  /** The charge: an assault boost into the giant, a heavy blow of the frame's momentum (once a contact). */
  charge(speed) {
    if (this.chargeCool > 0 || speed < TIMING.charge2) return;
    this.chargeCool = TIMING.charge;
    const k = chargeK(this.stats.mass, speed);
    this.land({ id: 'charge', stagger: 0 }, 'charge', { k, heavy: true, stagger: 30 * k }); // (stagger: impact weighs most, MECHS.md 4.6; 30 a full charge)
  }

  /** A blow on the giant through its rules, said as mech.hit. */
  land(P, kind, { k = P.k, stagger = P.stagger || 0, heavy = false, pierce = false, arm = null } = {}) {
    const G = this.p.giant; if (!G) return;
    const region = REGION_OF[kind] || 'body', weapon = P.id || this.idOf(P);
    const r = G.blow({ weapon, k: k * this.out(), stagger, heavy, pierce, region, from: this.p.pos, by: 'courier' }); // (from: a body blow from its side lands on that arm, giant.js)
    if (!r.blocked && r.staggered) this.p.staggerHit();
    this.game.events?.emit('mech.hit', { weapon, region, staggered: !!r.staggered, pierced: !!r.pierced, ...(arm ? { arm } : {}), crit: !!r.crit, ...(r.blocked ? { blocked: true } : {}), ...(r.felled ? { felled: true } : {}), by: 'courier' });
  }
  idOf(P) { const S = this.stats.parts; for (const s of ['weaponL', 'weaponR', 'back']) if (S[s] === P) return this.stats.sel[s]; return 'fist'; }

  tracer(from, to, color, life = 0.12) {
    const into = this.p.into; if (!into) return;
    this.mat ||= new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true });
    const g = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]), m = this.mat.clone(); m.color.setHex(color);
    const line = new THREE.Line(g, m); line.frustumCulled = false; into.add(line); this.tracers.push({ line, t: life, life });
  }

  update(dt) {
    for (const A of Object.values(this.arms)) { A.cool -= dt; A.swing = Math.max(0, A.swing - dt * 2.2); }
    this.chargeCool -= dt; this.backCool -= dt;
    for (let i = this.pending.length - 1; i >= 0; i--) { const q = this.pending[i]; q.t -= dt; if (q.t <= 0) { this.pending.splice(i, 1); q.fn(); } }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const T = this.tracers[i]; T.t -= dt; T.line.material.opacity = Math.max(0, T.t / T.life);
      if (T.t <= 0) { T.line.parent?.remove(T.line); T.line.geometry.dispose(); T.line.material.dispose(); this.tracers.splice(i, 1); }
    }
  }
  dispose() { this.reset(); this.mat?.dispose(); this.mat = null; }
}
