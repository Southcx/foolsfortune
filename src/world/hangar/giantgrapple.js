// ---------------------------------------------------------------------------------------
// GIANT WRESTLING (docs/plans/MECHS.md 11.2; the numbers Dovina's, progress/mechs/giants.js GRAPPLE; the technique `giantThrow`,
// progress/mechs/techniques.js): a giant staggered (rules.js STAGGER) and within GRAPPLE.reach of the mech's hands is lifted with F,
// held over the mech's head up to GRAPPLE.hold real s, and thrown or slammed:
//   F      on a staggered giant in reach, the technique open (or lent: the Movement Arts row, as mechtech.js `open`): a frame whose
//          load cannot hold the giant (giants.js canLift) only slips (`giant.slip { why: 'heavy' }`), nothing more; else the giant is
//          lifted (`giant.grab`), its mind and windups stopped, the battery drained GRAPPLE.drain every GRAPPLE.shake s; at GRAPPLE.hold
//          s it struggles free (`giant.slip { why: 'struggle' }`) and is set down before the mech. F again puts it down.
//   RMB    thrown along the aim at GRAPPLE.speed m/s and GRAPPLE.up rad; paid GRAPPLE.kJ. In flight, each building its centre's path
//          meets (the toy city's raycast, as props.js) takes a strike there, a ball of GRAPPLE.carve x height / 16 metres at k THROW_K
//          (the cells broken counted), and the giant a blow of GRAPPLE.selfK (the building's) and loses most of its speed; where it
//          lands it takes GRAPPLE.selfK as a blow on its body (the fall), and a strike on the roof it lands on. Said once, at the
//          landing: `giant.throw { id, hit: 'building' | 'ground', cells, by }` (a building met on the way or landed on is 'building').
//   LMB    slammed at the mech's feet: GRAPPLE.slamK on its body, a Ground Pound's ring carved round it; paid GRAPPLE.kJ; `giant.slam`.
// The giant's own blow() decides whether it is felled (giant.down). Its blows here pierce its barrier (a building does not care for
// a barrier) and are the Courier's. `mech.technique { id: 'giantThrow' }` is said at the throw and at the slam.
// While held or flying the giant is stashed far off (giant.js): nothing of the yard collides with it or strikes it, and its drawn body
// is moved by `giant.carry(centre, pitch)`.
//
// Prior art: The Incredible Hulk: Ultimate Destruction (grab a big foe, throw it through a building), God of War (the grab on a stunned
// foe), the kaiju films' throw into a tower, Pacific Rim's thrown ship.
//
//   const W = new Grapple(tech)   W.reset()   W.tryF() -> bool (F taken)   W.drive(K) -> { L, R } | null (the arms while it holds one)
//   W.update(dt) (every frame, the hangar's)   W.mode (null | 'held' | 'flight')   FLIGHT   THROW_K
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GRAPPLE, canLift } from '../../progress/mechs/giants.js';
import { TECHNIQUES } from '../../progress/mechs/techniques.js';
import { G as GRAV } from '../../progress/mechs/frame.js';
import { PROVING } from './layout.js';
import { MECH_BODY, heightOf } from './mech.js';

/** The flight (placeholders for feel, the numbers not Dovina's): the strike's k on a building (Dovina: about 2), how far above the mech's top
 *  the giant is held (m), the half-thickness of a giant lying (m: what its middle clears the ground by), how much of its speed
 *  a building leaves it, and its tumble (rad a real s). */
export const FLIGHT = { over: 4, lie: 4, keep: 0.45, tumble: 0.8 };
export const THROW_K = 2;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3();

export class Grapple {
  constructor(tech) { this.tech = tech; this.reset(); }
  reset() { this.mode = null; this.t = 0; this.shakeT = 0; this.F = null; this.ctr = this.ctr || new THREE.Vector3(); this.pitch = 0; }
  get p() { return this.tech.p; }
  get hangar() { return this.tech.p.hangar; }
  get G() { const G = this.hangar.giant; return G?.c ? G : null; }
  say(name, extra = {}, by = 'courier') { this.tech.game.events?.emit(name, { id: this.G?.G.id, ...extra, by }); }

  // ------------------------------------------------------------------ F
  /** F pressed: a held giant put down, or a staggered one in reach lifted (or found too heavy). True when F is taken. */
  tryF() {
    if (this.mode === 'held') { this.release('put'); return true; }
    if (this.mode) return false;
    const p = this.p, G = this.G;
    if (!G?.c.alive || G.down > 0 || G.under || G.air || !(G.stagger.staggerT > 0)) return false;
    if (!this.tech.open('giantThrow') || p.weapons.gap() > GRAPPLE.reach || !p.armLock('L') || !p.armLock('R')) return false;
    if (!canLift(p.stats.load, G.G)) { this.say('giant.slip', { why: 'heavy' }); return true; }
    this.mode = 'held'; this.t = 0; this.shakeT = 0; this.pitch = Math.PI / 2;
    G.carry(this.holdAt(G), this.pitch); this.say('giant.grab');
    return true;
  }
  /** Where the held giant lies: over the mech's head. */
  holdAt(G) { const p = this.p; return this.ctr.set(p.pos.x, p.pos.y + heightOf(p.stats) + FLIGHT.over, p.pos.z); }

  // ------------------------------------------------------------------ the buttons
  /** While a giant is held, both hands are its: RMB throws, LMB slams. Null otherwise. */
  drive(K) {
    if (this.mode !== 'held') return null;
    if (K.pressed('Mouse2')) this.throw(); else if (K.pressed('Mouse0')) this.slam();
    return { L: true, R: true };
  }
  /** The ground (or a roof) under a point, world y. */
  floorAt(x, z, below) { const C = this.hangar.city; return Math.max(PROVING.at.y, C?.built ? C.topAt(x, z, below, 3) ?? -Infinity : -Infinity); }
  /** The giant set down on its feet before the mech. */
  setDown(G) {
    const p = this.p, f = p.forward(_f), d = MECH_BODY.radius + G.radius + 2, x = p.pos.x + f.x * d, z = p.pos.z + f.z * d;
    G.putDown(x, this.floorAt(x, z, p.pos.y + 1), z); return G.pos;
  }
  release(why) {
    const G = this.G; if (!G || !this.mode) { this.mode = null; return; }
    this.mode = null; if (G.air) this.setDown(G);
    if (why === 'struggle') this.say('giant.slip', { why: 'struggle' }, 'creature');
  }

  throw() {
    const p = this.p, G = this.G, out = this.tech.out(); if (!G) return;
    const dir = p.aimDir(_a); dir.y = 0; if (dir.lengthSq() < 1e-4) p.forward(dir); dir.normalize();
    const c = Math.cos(GRAPPLE.up), s = Math.sin(GRAPPLE.up);
    p.spend(GRAPPLE.kJ); p.weapons.arms.L.swing = p.weapons.arms.R.swing = 1;
    this.mode = 'flight'; this.F = { vel: new THREE.Vector3(dir.x * c * GRAPPLE.speed, s * GRAPPLE.speed, dir.z * c * GRAPPLE.speed), cells: 0, hit: null, struck: new Set(), out, yaw: Math.atan2(dir.x, dir.z) };
    G.yaw = this.F.yaw; this.tech.game.events?.emit('mech.technique', { id: 'giantThrow', by: 'courier' });
  }
  slam() {
    const p = this.p, G = this.G; if (!G) return;
    p.spend(GRAPPLE.kJ); p.weapons.arms.L.swing = p.weapons.arms.R.swing = 1; p.kneel = 0.6; this.mode = null;
    const at = this.setDown(G), T = TECHNIQUES.groundPound, r = G.blow({ weapon: 'giantThrow', k: GRAPPLE.slamK, stagger: 0, region: 'body', pierce: true, by: 'courier' });
    this.hangar.city?.strike({ kind: 'ball', at: _b.set(at.x, at.y + 1, at.z), r: T.carve.r }, T.k * this.tech.out(), 'courier'); // (a Ground Pound's ring round it)
    p.quake?.(at, 2); this.say('giant.slam', { ...(r.felled ? { felled: true } : {}) });
    this.tech.game.events?.emit('mech.technique', { id: 'giantThrow', by: 'courier' });
  }

  // ------------------------------------------------------------------ each frame
  update(dt) {
    if (!this.mode) return;
    const p = this.p, G = this.G;
    if (!G || G.down > 0 || !p.target() || this.hangar.bout?.active || p.berserk > 0) { this.release('drop'); return; }
    if (this.mode === 'held') {
      this.t += dt; this.shakeT += dt;
      while (this.shakeT >= GRAPPLE.shake) { this.shakeT -= GRAPPLE.shake; p.spend(GRAPPLE.drain); }
      G.carry(this.holdAt(G), this.pitch); G.yaw = p.yaw;
      if (this.t >= GRAPPLE.hold) this.release('struggle');
      return;
    }
    this.fly(dt, G);
  }

  /** The giant in the air: gravity, a building met on the way, the ground or a roof under it. */
  fly(dt, G) {
    const F = this.F, C = this.hangar.city, prev = _a.copy(this.ctr);
    F.vel.y -= GRAV * dt; this.ctr.addScaledVector(F.vel, dt); this.pitch += FLIGHT.tumble * dt;
    const R = GRAPPLE.carve * (G.G.height / 16);
    if (C?.built) {
      const len = prev.distanceTo(this.ctr), dir = _b.subVectors(this.ctr, prev).normalize(), hit = len > 0 ? C.raycast(prev, dir, len + G.radius) : null;
      if (hit && !F.struck.has(hit.rec.i)) {
        F.struck.add(hit.rec.i); F.hit = 'building';
        F.cells += C.strike({ kind: 'ball', at: hit.point, r: R }, THROW_K, 'courier').cells;
        F.vel.x *= FLIGHT.keep; F.vel.z *= FLIGHT.keep;
        if (this.selfBlow(G).felled) return this.land(G, true);
      }
    }
    G.carry(this.ctr, this.pitch);
    const floor = this.floorAt(this.ctr.x, this.ctr.z, this.ctr.y);
    if (F.vel.y < 0 && this.ctr.y - FLIGHT.lie <= floor) this.land(G, false, floor);
  }
  selfBlow(G) { return G.blow({ weapon: 'giantThrow', k: GRAPPLE.selfK, stagger: 0, region: 'body', pierce: true, by: 'courier' }); }

  /** Down: on the ground or a roof (its strike), the fall its own blow; the throw said once. `felled` when a building already felled it. */
  land(G, felled, floor = null) {
    const F = this.F, C = this.hangar.city, p = this.p;
    floor ??= this.floorAt(this.ctr.x, this.ctr.z, this.ctr.y + FLIGHT.lie);
    if (floor > PROVING.at.y + 1) { F.hit = 'building'; if (C?.built) F.cells += C.strike({ kind: 'ball', at: _b.set(this.ctr.x, floor, this.ctr.z), r: GRAPPLE.carve * (G.G.height / 16) }, THROW_K, 'courier').cells; }
    if (!felled) felled = this.selfBlow(G).felled;
    G.putDown(this.ctr.x, floor, this.ctr.z); this.mode = null; this.F = null;
    p.quake?.(G.pos, 2);
    this.say('giant.throw', { hit: F.hit || 'ground', cells: F.cells, ...(felled ? { felled: true } : {}) });
  }
}
