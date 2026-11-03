// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S TURRET (docs/plans/STRAWMANS-WELL.md 3.7; GAPS G254): the Machine's cannon as the Lantern Wisp's turret, the Raceway's
// kind (world/raceway/traps.js 'turret'): every TURRET.every real s it throws a ball of the Wisp's flame (the Wisp's own ember, vfx
// `wisps.look.bolt`) along the floor at you. The ball is a parryable shot like the Wisp's own (`game.projectiles`: V in its window sends it
// back, courier/parry.js); sent back it flies home, and a ball that reaches the turret stuns it TURRET.stun real s (`well.turret.stun`). One
// that meets you knocks you back and counts a hit. The turret's body is a placeholder, named wellTurretLantern for Calissa.
//
// Prior art: Mario's Bullet Bill cannon (a shot on a beat), the Raceway's Wisp turret (a flame the parry sends home), the Lantern Wisp's cast
// (creatures/wisp/lanternwisp.js).
//
//   const T = new WellTurret(machine)   T.add(at, dir, range, into) -> the turret   T.tick(turret, dt)   T.update(dt)   T.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TURRET } from '../../progress/strawmanwell.js';
import { COLOR } from './stagekit.js';

const _v = new THREE.Vector3(), _c = new THREE.Vector3();

export class WellTurret {
  constructor(machine) { this.M = machine; this.game = machine.game; this.balls = []; }

  add(at, dir, range, into) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb04a })); lamp.name = 'wellTurretLantern';
    lamp.position.copy(at).setY(at.y + 0.35); into.add(lamp);
    return this.M.add({ kind: 'cannon', at: at.clone(), dir, range, t: TURRET.every * 0.5, into, stun: 0, lamp });
  }

  /** The turret's beat; stunned, it throws nothing and its lamp is dark. */
  tick(T, dt) {
    T.lamp.material.color.setHex(T.stun > 0 ? 0x4a3a2a : 0xffb04a);
    if (T.stun > 0) { T.stun -= dt; return; }
    if ((T.t -= dt) > 0) return;
    T.t = TURRET.every;
    const g = this.game, bolt = g.wisps?.look?.bolt?.(T.at.clone()); // (the Wisp's own ember where there is one; the look's, never disposed here)
    const m = bolt || new THREE.Mesh(new THREE.SphereGeometry(TURRET.r, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb04a }));
    m.position.copy(T.at); if (!m.parent) g.scene.add(m);
    const vel = new THREE.Vector3(T.dir * TURRET.speed, 0, 0);
    const q = { m, own: !bolt, pos: m.position, vel, v: vel, t: 0, T, from: null, lachryma: 1, d: 0, near: false, home: false, mark: g.parryMark?.mark(m), vanish: () => { q.gone = true; } };
    (g.projectiles ||= new Set()).add(q); this.balls.push(q);
  }

  update(dt) {
    const g = this.game, P = this.M.P, W = this.M.well;
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const B = this.balls[i]; let gone = !!B.gone;
      if (!B.home && B.reflected) { B.home = true; g.events?.emit('well.turret.parry', { stage: W.stage?.id ?? null, by: 'courier' }); W.verb('cannon'); }
      if (B.home) { // (sent back: it flies home to the lantern)
        _c.copy(B.T.at).sub(B.pos); const d = _c.length();
        if (d < 0.8) { B.T.stun = TURRET.stun; gone = true; g.events?.emit('well.turret.stun', { stage: W.stage?.id ?? null, by: 'courier' }); }
        else B.vel.copy(_c.multiplyScalar(TURRET.speed * 1.6 / d));
      }
      B.pos.addScaledVector(B.vel, dt); B.d += TURRET.speed * dt; B.m.rotation.y += dt * 9;
      if (!B.home) {
        _v.set(P.pos.x, P.pos.y + 1.0, P.pos.z); const d = _v.distanceTo(B.pos);
        if (d < 0.75 && !(P.invuln > 0)) { P.impulse(new THREE.Vector3(B.T.dir * TURRET.knock, 3, 0), 'cannon'); W.hit(); W.verb('cannon'); gone = true; }
        else if (d < 2.2) B.near = true;
        else if (B.near && !gone) { B.near = false; W.verb('cannon'); }
        if (B.d > B.T.range) gone = true;
      }
      if (gone) { this.free(B); this.balls.splice(i, 1); }
    }
  }

  free(B) { B.mark?.clear?.(); this.game.projectiles?.delete(B); B.m.removeFromParent(); if (B.own) { B.m.geometry?.dispose?.(); B.m.material?.dispose?.(); } }
  clear() { for (const B of this.balls) this.free(B); this.balls = []; }
}
