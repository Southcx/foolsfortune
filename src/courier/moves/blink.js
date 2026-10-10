// Blink (E): a near-instant dodge. The body flashes a few metres along the move
// keys (or the view, with no keys held), sliding along anything in the way, and
// leaves an afterimage behind. Momentum comes out the other side pointed where you
// blinked, so it's a redirect as much as a dodge. Charges recharge on a timer.
import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { PALETTE } from '../../core/config.js';
import { stream, randDir } from '../../core/rng.js';
import { featTint } from '../../vfx/oxidation.js';
const simRand = stream('courier/moves/blink'); // (the simulation's chance: core/rng.js, the same twice)
const fxRand = stream('courier/moves/blink.fx'); // (the look's chance, a stream of its own: the film's hue never shifts the simulation's draws)

const ghostMat = () => new THREE.MeshBasicMaterial({ color: PALETTE.pale, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending });

export class Blink extends Tech {
  constructor(mgr) {
    super(mgr, 'blink');
    this.charges = this.cfg.charges;
    this.recharge = 0;
    this.ghosts = [];
    this.overrides = 0;
  }

  reset() { this.charges = this.cfg.charges; this.recharge = 0; }

  canStart() {
    const P = this.P;
    if (!P.peekLatch('KeyE') || P.mantle) return false;
    P.latch('KeyE');
    if (this.charges <= 0) { sfx.fizzle(); this.game.log.say('warn', 'Blink is still recharging.', { key: 'blink', throttle: 2 }); return false; }
    return true;
  }

  start() {
    const P = this.P, c = this.cfg;
    this.charges--;
    const wish = P.wishDir();
    let dir;
    if (wish.lengthSq() > 0.01) dir = wish.normalize();
    else {
      dir = P.lookDir();
      dir.y = THREE.MathUtils.clamp(dir.y, P.grounded ? 0 : -0.5, 0.5);
      if (dir.lengthSq() < 1e-4) dir = P.forward();
      dir.normalize();
    }
    this.dir = dir;
    this.hs0 = Math.hypot(P.vel.x, P.vel.z);
    this.vy0 = P.vel.y;
    this.left = c.distance;
    this.from = P.pos.clone();
    this.wasGrounded = P.grounded;
    P.endCore();
    this.afterimage();
    this.game.character.setHidden(true);
    P.fovPunch = Math.max(P.fovPunch, 9);
    sfx.blink();
    this.game.events?.emit('move.blink', {});
  }

  update(dt) {
    const P = this.P, c = this.cfg;
    const step = Math.min(this.left, (c.distance / c.time) * dt);
    P.vel.copy(this.dir).multiplyScalar(step / dt);
    const before = P.pos.clone();
    P.move(dt);
    const moved = P.pos.distanceTo(before);
    this.left -= step;
    this.streak(before, P.pos);
    // arrived, or stopped dead against something
    if (this.left <= 1e-3 || moved < step * 0.25) return false;
    return true;
  }

  end() {
    const P = this.P, c = this.cfg;
    this.game.character.setHidden(false);
    if (!P.canStand()) P.setLow(true); // (a blink can end under a low ceiling: come out crouched, not stuck in it)
    const hd = new THREE.Vector3(this.dir.x, 0, this.dir.z);
    if (hd.lengthSq() > 0.04) {
      hd.normalize().multiplyScalar(Math.max(this.hs0, c.exitSpeed));
      P.vel.x = hd.x; P.vel.z = hd.z;
    } else { P.vel.x *= 0.3; P.vel.z *= 0.3; }
    // in the air a blink is a brief stall: it catches your fall (and an upward blink carries)
    P.vel.y = P.grounded ? 0 : Math.max(this.vy0 * 0.25, this.dir.y * c.exitSpeed, c.airLift);
    sfx.blinkArrive();
    const fx = this.game.fx;
    if (fx) {
      const col = new THREE.Color(), ph = fxRand();
      for (let i = 0; i < 14; i++) {
        const v = randDir(simRand, new THREE.Vector3()).multiplyScalar(2.5);
        fx.alpha.emit({ pos: P.pos.clone().add(new THREE.Vector3(0, 0.9, 0)), vel: v, life: 0.3, size: 0.1, sizeEnd: 0.02, color: featTint(ph + i / 14, col), alpha: 0.5, drag: 6 }); // (the arrival's burst round the film's hues)
      }
    }
  }

  tick(dt) {
    const c = this.cfg;
    if (this.charges < c.charges) {
      this.recharge += dt;
      if (this.recharge >= c.recharge) { this.charges++; this.recharge = 0; }
    } else this.recharge = 0;
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i];
      g.age += dt;
      const k = 1 - g.age / c.ghostLife;
      if (k <= 0) {
        this.game.scene.remove(g.obj);
        g.obj.traverse((o) => o.geometry?.dispose());
        g.mat.dispose();
        this.ghosts.splice(i, 1);
        continue;
      }
      g.mat.opacity = 0.45 * k * k;
      featTint(g.ph + (1 - k) * 0.5, g.mat.color); // (a feat of the Courier's power reads as Lachryma: the afterimage walks the oil film's hues as it fades, vfx/oxidation.js)
      g.obj.position.addScaledVector(g.drift, dt);
    }
  }

  afterimage() {
    const ch = this.game.character;
    if (!ch || ch.hidden) return;
    const mat = ghostMat(), ph = fxRand(); featTint(ph, mat.color); // (its hue's start on Lachryma's film)
    const obj = ch.snapshot(mat);
    this.game.scene.add(obj);
    this.ghosts.push({ obj, mat, age: 0, ph, drift: this.dir.clone().multiplyScalar(-0.6) });
  }

  streak(a, b) {
    const fx = this.game.fx;
    if (!fx) return;
    const col = new THREE.Color(), ph = fxRand();
    const d = b.clone().sub(a), n = Math.max(1, Math.round(d.length() / 0.25));
    for (let i = 0; i < n; i++) {
      const p = a.clone().addScaledVector(d, i / n).add(new THREE.Vector3((simRand() - 0.5) * 0.3, 0.4 + simRand() * 1.0, (simRand() - 0.5) * 0.3));
      fx.alpha.emit({ pos: p, vel: new THREE.Vector3(), life: 0.25, size: 0.07, sizeEnd: 0.01, color: featTint(ph + i / n * 0.75, col), alpha: 0.55, drag: 1 }); // (the streak walks the film's hues along the way)
    }
  }

  label() { return 'BLINK'; }
}
