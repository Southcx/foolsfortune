import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { T, PALETTE } from '../../core/config.js';
import { GROUPS } from '../../core/physics.js';
import { stream } from '../../core/rng.js';
const simRand = stream('courier/moves/slam'); // (the simulation's chance: core/rng.js, the same twice)

// Ground slam (C in the air, looking down, high enough): drive straight down, and the landing
// throws out a shockwave - pots break close in, get shoved further out, clapperjars
// go flying. For a moment after landing: Space is a slam jump (higher the further
// you fell), holding C with a direction turns the fall into a slide.
export class Slam extends Tech {
  constructor(mgr) {
    super(mgr, 'slam');
    this.overrides = 1;
    this.blendIn = 30;
    this.rings = [];
  }

  heightAbove() {
    const P = this.P;
    const hit = P.physics.raycast({ x: P.pos.x, y: P.pos.y + 0.1, z: P.pos.z }, { x: 0, y: -1, z: 0 }, 40, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
    return hit ? hit.distance - 0.1 : Infinity;
  }

  /** Deep water at this point (a swimmer's depth: the swim's own test), or null. */
  waterAt(p) {
    const v = this.game.water?.at(p.x, p.y + 0.9, p.z);
    return v && p.y < v.surface - 0.2 && v.surface - v.bottom > 1.2 ? v : null;
  }

  canStart() {
    const P = this.P;
    if (P.grounded || P.wallrun || P.mantle || !P.peekLatch('KeyC')) return false;
    // (C in the air looking ahead is the core's landing slide: a slam wants you looking down)
    if (P.pitch > -this.cfg.lookDown * Math.PI / 180) return false;
    if (this.heightAbove() < this.cfg.minHeight) return false;
    if (this.waterAt(this.P.pos)) return false; // (no slam out of the water: there is nothing to drive into)
    P.latch('KeyC');
    P.slideBuf = 0;
    return true;
  }

  start() {
    const P = this.P;
    P.endCore();
    this.phase = 'fall';
    this.y0 = P.pos.y;
    this.hv = new THREE.Vector3(P.vel.x, 0, P.vel.z).multiplyScalar(0.25);
    P.fovPunch = Math.max(P.fovPunch, 5);
    sfx.slamStart();
  }

  update(dt) {
    const P = this.P, c = this.cfg, M = T.movement;
    if (this.phase === 'fall') {
      // a little steering on the way down
      const wish = P.wishDir();
      this.hv.lerp(wish.multiplyScalar(c.steer), Math.min(1, 4 * dt));
      P.vel.set(this.hv.x, -c.speed, this.hv.z);
      P.move(dt);
      // into deep water: the slam is spent on the surface (a splash, a quarter of the fall kept), and the swim takes them (the owner, 2026-10-06)
      const w = this.waterAt(P.pos);
      if (w) { P.vel.y = -c.speed * 0.25; sfx.splash?.(0.9); return false; }
      if (P.grounded) this.impact();
      else if (this.t > 4) return false;
      return true;
    }
    // landed: a beat to slam-jump or slam-slide out of it
    this.lt += dt;
    if (P.latch('Space')) {
      const wish = P.wishDir();
      P.vel.set(wish.x * M.walkSpeed, M.jumpVelocity * Math.min(c.jumpMax, c.jumpMult + c.jumpPerMetre * this.fallH), wish.z * M.walkSpeed);
      P.grounded = false;
      P.airJumps = M.airJumps;
      P.jumpFx(1.2);
      sfx.airJump();
      P.airJumpPulse = true;
      return false;
    }
    const wish = P.wishDir();
    if (P.input.isDown('KeyC') && wish.lengthSq() > 0.01) {
      // the fall turns into forward speed
      wish.normalize().multiplyScalar(Math.min(M.maxSpeed, M.slideSpeed + this.fallH * c.slidePerMetre));
      P.vel.set(wish.x, 0, wish.z);
      P.setLow(true);
      P.sliding = true;
      P.slideT = 0;
      P.slideCd = 0;
      sfx.slide();
      return false;
    }
    P.vel.set(0, 0, 0);
    P.move(dt);
    return this.lt < c.window;
  }

  impact() {
    const P = this.P, c = this.cfg, g = this.game;
    this.phase = 'land';
    this.lt = 0;
    this.fallH = Math.max(0, this.y0 - P.pos.y);
    const drop = Math.max(this.fallH, P.lastDrop || 0); // (the whole fall, from the top of the jump)
    const power = THREE.MathUtils.clamp(0.5 + this.fallH / 8, 0.5, 1.6);
    const R = c.radius * power;
    const center = P.pos.clone().add(new THREE.Vector3(0, 0.3, 0));
    // pots: close ones break, the rest get thrown; clapperjars go flying
    g.breakables?.explode(center, { radius: R, breakFrac: c.breakFrac, velocity: c.velocity * power, fx: false, cause: 'slam' });
    P.shake = Math.max(P.shake, 0.5 * power);
    P.fovPunch = Math.max(P.fovPunch, 6);
    sfx.slam(power);
    this.ring(P.pos, R);
    if (g.system?.variantId('slam') === 'super') {
      // (the Super Slam: a second ring after the first, and the whole room feels it)
      g.fx.after?.(0.09, () => this.ring(P.pos, R * 1.4));
      P.shake = Math.max(P.shake, 1); P.fovPunch = Math.max(P.fovPunch, 11);
    }
    const fx = g.fx;
    if (fx) {
      const col = new THREE.Color(PALETTE.pale);
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        fx.alpha.emit({ pos: P.pos.clone().add(new THREE.Vector3(Math.cos(a) * 0.4, 0.1, Math.sin(a) * 0.4)), vel: new THREE.Vector3(Math.cos(a) * 7 * power, 0.8 + simRand(), Math.sin(a) * 7 * power), life: 0.55, size: 0.15, sizeEnd: 0.55, color: col, alpha: 0.35, drag: 5 });
      }
    }
    P.landed = Math.max(P.landed, 14); // the heavy landing pose
    const hitT = g.movers?.hitTargetsNear(P.pos, 0.6, { cause: 'slam', drop });
    g.events?.emit('slam.impact', { height: drop, target: !!hitT, power });
  }

  ring(at, R) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), new THREE.MeshBasicMaterial({ color: PALETTE.hot, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.copy(at).add(new THREE.Vector3(0, 0.04, 0));
    this.game.scene.add(m);
    this.rings.push({ m, age: 0, R });
  }

  tick(dt) {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.age += dt;
      const k = r.age / 0.35;
      if (k >= 1) { this.game.scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); this.rings.splice(i, 1); continue; }
      r.m.scale.setScalar(0.3 + r.R * (1 - (1 - k) * (1 - k)));
      r.m.material.opacity = 0.8 * (1 - k);
    }
  }

  // tucked and pitched head-down while falling; the landing clip does the impact
  animate(ch, base, dt) {
    if (this.phase !== 'fall' && !this.active) return;
    const C = ch.clips;
    const p = C.sample('flipLoop', this.t, ch.P.tmp);
    C.blend(base, p, this.w * (this.phase === 'fall' ? 1 : 0));
  }

  afterPose(ch) {
    if (this.phase !== 'fall' || !this.active) return;
    const rightW = new THREE.Vector3(-1, 0, 0).applyQuaternion(ch.root.quaternion);
    ch.rotW(ch.bones.spine, rightW, -0.5 * this.w);
  }

  label() { return 'SLAM'; }
}
