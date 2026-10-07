// ---------------------------------------------------------------------------------------
// THE JET ARTS: Super Mario Sunshine's FLUDD nozzles as Movement Arts on the Soul Brush's load (the owner, 2026-10-06: "hover, rocket,
// skim now", opt-in, off by default; docs/plans/SUNSHINE-SYSTEMS.md section 4). Each spends Lachryma from the Lachrymato Bottle, else
// the pool (`spendLoad`), and lays what it sprays where it lands (the paint map): FLUDD's water always went somewhere.
//
//   HOVER   in the air with the jumps spent, hold Space: the brush's jets hold you level for a short while and you steer (Sunshine's
//           hover nozzle: a safety net more than a power)
//   ROCKET  crouched and still, hold Space: the jets gather, then throw you straight up (the rocket nozzle)
//   SKIM    run into water at a sprint, Shift held: you run on its surface, a wake behind (the turbo nozzle across the sea)
//
// They are techs (courier/moves/techs.js): switched off (`T.tech.<id>.enabled`, the chat line's /art), the core movement is exactly
// what it was. Prior art: Super Mario Sunshine (EAD, 2002); Jak II's jet board for the skim's feel of speed on water.
//
//   new Hover(techs) / new Rocket(techs) / new Skim(techs)   (added before the swim, so a skim is chosen before the water takes you)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { spendLoad, loadAspect } from '../../tools/soulbrush/load.js';
import { ASPECT_COLOR } from '../../world/ground/paintmap.js';
import { stream } from '../../core/rng.js';

const simRand = stream('courier/moves/jets');
const _v = new THREE.Vector3(), _d = new THREE.Vector3();

/** The jets' spray under the Courier: drops in the load's colour, a little paint where it falls, rings on water. */
function jetSpray(tech, k = 1) {
  const g = tech.game, P = tech.P, col = ASPECT_COLOR[loadAspect(g)];
  for (let i = 0; i < 2; i++) g.fx?.alpha.emit({ pos: P.pos.clone().add(_v.set((simRand() - 0.5) * 0.3, 0.6, (simRand() - 0.5) * 0.3)), vel: new THREE.Vector3((simRand() - 0.5) * 1.2, -7 * k, (simRand() - 0.5) * 1.2), life: 0.5, size: 0.08, sizeEnd: 0.03, color: col, alpha: 0.75, drag: 0.4, gravity: 6 });
  if (simRand() < 0.25) {
    const hit = g.physics.raycast(P.pos, _d.set(0, -1, 0), 6, P.collider);
    const W = g.water?.at(P.pos.x, P.pos.y - 1, P.pos.z);
    if (W && (!hit || hit.point.y < W.surface)) g.water.disturb(P.pos.x, P.pos.z, 0.4, 'drop');
    else if (hit && hit.normal.y > 0.5) g.paintmap?.stamp(hit.point.x, hit.point.y, hit.point.z, 0.6, loadAspect(g), 0.25);
  }
}

export class Hover extends Tech {
  constructor(mgr) { super(mgr, 'hover'); this.overrides = 0; this.spent = false; }
  tick() { if (this.P.grounded) this.spent = false; } // (once a time in the air: Sunshine's hover runs dry and you fall)
  canStart() {
    const P = this.P, c = this.cfg;
    if (this.spent || P.grounded || P.airJumps > 0 || P.mantle || P.airT < 0.2 || !P.input?.isDown('Space') || P.vel.y > 1.5) return false;
    if (this.game.water?.at(P.pos.x, P.pos.y, P.pos.z)) return false;
    return spendLoad(this.game, c.cost * 0.1, 'hover') > 0;
  }
  start() { this.spent = true; this.P.endCore(); sfx.jetStart?.(); this.game.events?.emit('move.hover', { by: 'courier' }); }
  update(dt) {
    const P = this.P, c = this.cfg;
    if (P.grounded || !P.input?.isDown('Space') || this.t > c.time) return false;
    if (spendLoad(this.game, c.cost * dt, 'hover') < c.cost * dt * 0.5) return false;
    const lift = this.t < 0.25 ? c.lift : 0; // (a little rise as the jets catch, then level)
    P.vel.y += (lift - P.vel.y) * Math.min(1, 6 * dt);
    const wish = P.wishDir();
    P.vel.x += (wish.x * c.speed - P.vel.x) * Math.min(1, c.steer * dt);
    P.vel.z += (wish.z * c.speed - P.vel.z) * Math.min(1, c.steer * dt);
    P.move(dt);
    jetSpray(this, 1);
    return true;
  }
  label() { return 'HOVER'; }
}

export class Rocket extends Tech {
  constructor(mgr) { super(mgr, 'rocket'); this.overrides = 0; this.was = false; }
  canStart() {
    const P = this.P, down = !!P.input?.isDown('Space'), fresh = down && !this.was; this.was = down;
    // (the press itself, before the core's jump takes it: crouched and still, Space starts the gather instead of the crouch jump)
    return fresh && P.grounded && P.crouching && Math.hypot(P.vel.x, P.vel.z) < 0.6;
  }
  start() { this.gather = 0; this.P.endCore(); sfx.jetCharge?.(); }
  update(dt) {
    const P = this.P, c = this.cfg;
    P.vel.set(0, 0, 0); P.move(dt);
    this.gather += dt;
    if (this.gather < c.charge && P.input?.isDown('Space')) { if (simRand() < 0.5) jetSpray(this, 0.4); return true; }
    if (this.gather < c.charge * 0.5) return false; // (let go too soon: nothing)
    if (spendLoad(this.game, c.cost, 'rocket') < c.cost * 0.6) { sfx.fizzle?.(); this.game.log?.say('info', 'Not enough Lachryma to launch.', { key: 'rocketdry', throttle: 3 }); return false; }
    P.vel.y = 0; P.impulse(_v.set(0, c.speed * Math.min(1, this.gather / c.charge), 0), 'rocket');
    P.jumpHeldLast = true; P.jumpBuf = 0; // (the Space that gathered it is spent: the core must not read it as a jump)
    for (let i = 0; i < 10; i++) jetSpray(this, 1.6);
    sfx.jetLaunch?.();
    this.game.events?.emit('move.rocket', { by: 'courier' });
    return false;
  }
  label() { return 'ROCKET'; }
}

export class Skim extends Tech {
  constructor(mgr) { super(mgr, 'skim'); this.overrides = 0; this.wakeT = 0; }
  water() {
    const P = this.P, W = this.game.water?.at(P.pos.x, P.pos.y - 0.2, P.pos.z);
    return W && W.surface - P.pos.y > -0.4 && W.surface - P.pos.y < 0.7 && W.surface - W.bottom > 0.8 ? W : null;
  }
  canStart() {
    const P = this.P, c = this.cfg;
    if (!P.input?.isDown('ShiftLeft') || Math.hypot(P.vel.x, P.vel.z) < c.minSpeed || !this.water()) return false;
    return spendLoad(this.game, c.cost * 0.1, 'skim') > 0;
  }
  start() { this.P.endCore(); sfx.jetStart?.(); this.game.events?.emit('move.skim', { by: 'courier' }); }
  update(dt) {
    const P = this.P, c = this.cfg, W = this.water();
    if (!W || !P.input?.isDown('ShiftLeft')) return false;
    if (spendLoad(this.game, c.cost * dt, 'skim') < c.cost * dt * 0.5) return false;
    const wish = P.wishDir(); if (wish.lengthSq() < 0.01) wish.copy(P.forward());
    wish.normalize();
    P.vel.x += (wish.x * c.speed - P.vel.x) * Math.min(1, 3 * dt);
    P.vel.z += (wish.z * c.speed - P.vel.z) * Math.min(1, 3 * dt);
    P.vel.y = (W.surface + 0.02 - P.pos.y) * 12; // (held on the surface)
    P.move(dt);
    this.wakeT -= dt;
    if (this.wakeT <= 0) { this.wakeT = 0.1; this.game.water.disturb(P.pos.x, P.pos.z, 0.8, 'wake', W.surface); jetSpray(this, 0.5); }
    return true;
  }
  label() { return 'SKIM'; }
}
