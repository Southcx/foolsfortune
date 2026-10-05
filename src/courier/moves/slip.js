import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { T, PALETTE } from '../../core/config.js';
import { GROUPS } from '../../core/physics.js';
import { stream } from '../../core/rng.js';
const simRand = stream('courier/moves/slip'); // (the simulation's chance: core/rng.js, the same twice)

// Slip dive (Splatoon's ink swim, in liquid clay). Hold C on wet slip and the
// Courier melts into it: a fast, low blob that only moves quickly through slip,
// climbs walls where they're slip-coated, and fits through gaps nothing else does.
// Space launches you out (higher than a jump, keeping the speed); let go of C to
// stand back up. Lachryma soaks back in while you're under. Paint more with the
// SLIP shell.
//
// The way in and out is shown, not cut: going under, the body squashes toward the floor and dissolves from the head down (a blocky
// dissolve with a glowing edge: outline.js) while the blob swells up out of the splash (0.3 s); coming out, the blob sinks back and
// the body is built up from the feet as it springs to its height with a little overshoot (0.32 s). The physics changes shape at
// once (the momentum is never held up by the show): only the picture takes its time. Prior art: Splatoon's squid form (the swap is
// near-instant, the squash and the splash sell it) and the dissolve-in of the era's teleports (Kingdom Hearts, Phantasy Star Online).
const UP = new THREE.Vector3(0, 1, 0);
const MELT = 0.3, RISE = 0.32;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeIn = (t) => t * t * t, easeOut = (t) => 1 - (1 - t) ** 3;
const easeOutBack = (t) => { const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };

export class SlipDive extends Tech {
  constructor(mgr) {
    super(mgr, 'slip');
    this.overrides = 0;
    this.blendIn = 30;
    this.normal = UP.clone();
    this.blob = this.makeBlob();
    this.trailT = 0;
  }

  get field() { return this.game.slip; }

  makeBlob() {
    const g = new THREE.SphereGeometry(1, 20, 12);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: PALETTE.pale, roughness: 0.15, metalness: 0, emissive: PALETTE.glow, emissiveIntensity: 0.08 }));
    m.visible = false;
    m.renderOrder = 3;
    this.game.scene.add(m);
    return m;
  }

  wetUnder(p) { return this.field?.at(p, UP, 0.35); }

  canStart() {
    const P = this.P;
    if (!this.field || P.mantle || !P.grounded) return false;
    if (!(P.input.isDown('KeyC') || P.peekLatch('KeyC'))) return false;
    return !!this.wetUnder(P.pos);
  }

  start() {
    const P = this.P;
    P.latch('KeyC');
    P.slideBuf = 0;
    const hv = new THREE.Vector3(P.vel.x, 0, P.vel.z);
    P.endCore();
    P.setShape('blob');
    P.vel.set(hv.x, 0, hv.z); // a slide keeps its speed going in
    this.mode = 'floor';
    this.normal.copy(UP);
    this.melt = 0; this.rise = null; // (the body melts down over MELT seconds: tick)
    this.blob.visible = true;
    sfx.slipDive();
    this.splash(P.pos, 1.2);
  }

  update(dt) {
    const P = this.P, c = this.cfg, inp = P.input, M = T.movement;
    const wish = P.wishDir();
    const wetFloor = this.wetUnder(P.pos);
    // surface: let go of C (standing room permitting), or launch with Space
    if (P.latch('Space')) return this.launch(wish);
    if (!inp.isDown('KeyC') && P.fits(P.pos, false)) return false;

    // on a slip-coated wall, pressing into it: climb
    if (wish.lengthSq() > 0.01) {
      const dir = wish.clone().normalize();
      const hit = P.physics.raycast({ x: P.pos.x, y: P.pos.y + 0.3, z: P.pos.z }, dir, 0.6, P.collider, GROUPS.controllerQuery, (col) => !col.isSensor() && !col.parent()?.isDynamic());
      if (hit && Math.abs(hit.normal.y) < 0.3) {
        const n = new THREE.Vector3(hit.normal.x, 0, hit.normal.z).normalize();
        const on = this.field.at(new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z), n, 0.3);
        if (on && -dir.dot(n) > 0.5) { this.mode = 'wall'; this.normal.copy(n); }
      }
    }
    if (this.mode === 'wall') {
      const n = this.normal;
      // still slip under us on the wall, and still pushing into it?
      const probe = P.physics.raycast({ x: P.pos.x, y: P.pos.y + 0.3, z: P.pos.z }, n.clone().negate(), 0.7, P.collider, GROUPS.controllerQuery);
      const onWall = probe && this.field.at(new THREE.Vector3(probe.point.x, probe.point.y, probe.point.z), n, 0.3);
      const pushing = -(wish.x * n.x + wish.z * n.z) > 0.2;
      if (!probe) {
        // over the top: flop onto it
        P.vel.set(-n.x * 3, 3, -n.z * 3);
        this.mode = 'air';
      } else if (!onWall || !pushing) {
        this.mode = 'air'; // (fall off - dry wall, or let go)
        P.vel.set(n.x * 1.5, Math.min(P.vel.y, 0), n.z * 1.5);
      } else {
        const along = new THREE.Vector3(-n.z, 0, n.x);
        const side = wish.dot(along);
        P.vel.set(-n.x * 1.5 + along.x * side * c.speed * 0.4, c.climbSpeed, -n.z * 1.5 + along.z * side * c.speed * 0.4);
        P.move(dt);
        this.regen(dt);
        return true;
      }
    }
    // floor / air
    if (P.grounded) this.mode = 'floor';
    const speed = wetFloor ? c.speed : c.dryCrawl;
    const target = wish.multiplyScalar(speed);
    const hv = new THREE.Vector3(P.vel.x, 0, P.vel.z);
    const d = target.sub(hv);
    const maxStep = (P.grounded ? c.accel : c.accel * 0.3) * dt;
    if (d.length() > maxStep) d.setLength(maxStep);
    hv.add(d);
    if (!wetFloor && P.grounded) hv.multiplyScalar(Math.exp(-6 * dt)); // dry floor drags
    P.vel.x = hv.x; P.vel.z = hv.z;
    P.vel.y = P.grounded ? 0 : P.vel.y - M.gravity * dt;
    P.move(dt);
    if (P.grounded) this.normal.lerp(UP, Math.min(1, 12 * dt));
    if (wetFloor) this.regen(dt);
    // high and dry: stand up as soon as there's room
    if (P.grounded && !this.wetUnder(P.pos) && this.t > 0.2 && P.fits(P.pos, false)) return false;
    return true;
  }

  launch(wish) {
    const P = this.P, c = this.cfg;
    const hv = new THREE.Vector3(P.vel.x, 0, P.vel.z);
    if (this.mode === 'wall') hv.addScaledVector(this.normal, 4);
    if (wish.lengthSq() > 0.01) hv.lerp(wish.clone().normalize().multiplyScalar(Math.max(hv.length(), T.movement.walkSpeed)), 0.5);
    hv.clampLength(0, c.keepSpeed);
    P.vel.set(hv.x, c.jump, hv.z);
    P.grounded = false;
    P.setShape(P.fits(P.pos, false) ? 'stand' : 'low');
    P.airJumps = T.movement.airJumps;
    P.airJumpPulse = true; // (the tuck on the way out)
    return false;
  }

  end() {
    const P = this.P;
    if (P.shape === 'blob') P.setShape(P.fits(P.pos, false) ? 'stand' : 'low');
    // the rise: the body comes back squashed and dissolved, and is built up from the feet (tick runs it after the tech has ended)
    const ch = this.game.character;
    ch.setHidden(false);
    this.rise = 0; this.melt = null;
    this.body(1, 0.35, 1.3);
    sfx.slipSurface();
    this.splash(P.pos, 1);
  }

  regen(dt) {
    const pool = this.game.lachryma;
    if (pool && this.cfg.regen > 0) pool.value = Math.min(pool.max ?? 100, pool.value + this.cfg.regen * dt);
  }

  splash(at, k = 1) {
    const fx = this.game.fx;
    if (!fx) return;
    const col = new THREE.Color(PALETTE.pale);
    for (let i = 0; i < 14 * k; i++) {
      const a = simRand() * Math.PI * 2;
      fx.alpha.emit({ pos: at.clone().add(new THREE.Vector3(Math.cos(a) * 0.2, 0.1, Math.sin(a) * 0.2)), vel: new THREE.Vector3(Math.cos(a) * 1.6, 1.5 + simRand() * 2.5 * k, Math.sin(a) * 1.6), life: 0.5, size: 0.07, sizeEnd: 0.03, color: col, alpha: 0.8, drag: 1.5, gravity: 9 });
    }
  }

  /** The body's share of the show: dissolved k (0..1), squashed to sy with its width spread to sxz, standing where it stands. */
  body(k, sy, sxz) {
    const ch = this.game.character;
    ch.setDissolve(k, this.P.renderPos.y, 1.9);
    ch.root.scale.set(sxz, sy, sxz);
  }

  // the blob: a glossy clay swell riding the surface, stretched along its motion
  tick(dt) {
    const P = this.P, b = this.blob, ch = this.game.character;
    let grow = 1;
    if (this.rise !== null && this.rise !== undefined) {
      // coming out: the blob sinks away in the first moment, the body springs up (easeOutBack: a little past its height, and back)
      this.rise += dt;
      const k = clamp01(this.rise / RISE);
      this.body(1 - easeOut(k), 0.35 + 0.65 * easeOutBack(k), 1.3 - 0.3 * easeOut(k));
      grow = 1 - clamp01(this.rise / 0.14);
      if (k >= 1) { this.rise = null; this.body(0, 1, 1); b.visible = false; return; }
      if (grow <= 0) { b.visible = false; return; }
    } else if (!this.active) return;
    else if (this.melt !== null && this.melt !== undefined) {
      // going under: the body squashes and dissolves from the head down (slow, then all at once), the blob swells out of it
      this.melt += dt;
      const k = clamp01(this.melt / MELT);
      this.body(Math.min(1, k * k * 1.15), 1 - 0.65 * easeIn(k), 1 + 0.35 * easeIn(k));
      grow = easeOutBack(clamp01((this.melt - 0.08) / 0.22));
      if (k >= 1) { this.melt = null; ch.setHidden(true); this.body(0, 1, 1); }
    }
    b.visible = P.fpWeight < 0.5 && grow > 0.01; // (in first person you're looking out of it)
    const n = this.normal;
    const v = P.vel.clone();
    const sp = v.length();
    this.wob = (this.wob || 0) + dt * (4 + sp);
    const fwd = v.clone().addScaledVector(n, -v.dot(n));
    if (fwd.lengthSq() < 1e-4) fwd.set(Math.sin(P.bodyYaw), 0, Math.cos(P.bodyYaw)).addScaledVector(n, -n.y * 0);
    fwd.normalize();
    const side = new THREE.Vector3().crossVectors(n, fwd).normalize();
    b.matrixAutoUpdate = false;
    const stretch = 1 + Math.min(0.8, sp * 0.06);
    const h = 0.13 + Math.sin(this.wob) * 0.02;
    const center = P.renderPos.clone().add(new THREE.Vector3(0, this.mode === 'wall' ? 0.35 : 0, 0)).addScaledVector(n, this.mode === 'wall' ? -0.18 : 0.03);
    b.matrix.makeBasis(side.multiplyScalar(0.34 / Math.sqrt(stretch) * grow), n.clone().multiplyScalar(h * grow), fwd.multiplyScalar(0.34 * stretch * grow)).setPosition(center);
    // a wake of ripples
    this.trailT -= dt;
    if (this.active && sp > 1 && this.trailT <= 0 && this.game.fx) {
      this.trailT = 0.05;
      this.game.fx.alpha.emit({ pos: center.clone().addScaledVector(n, 0.05), vel: n.clone().multiplyScalar(0.3), life: 0.5, size: 0.12, sizeEnd: 0.4, color: new THREE.Color(PALETTE.pale), alpha: 0.35, drag: 3 });
      sfx.slipSwim();
    }
  }

  camera(fp, pivot) {
    if (!this.active) return;
    const P = this.P;
    const eye = P.renderPos.clone().addScaledVector(this.normal, 0.45);
    if (this.mode === 'wall') eye.y += 0.4;
    fp.lerp(eye, this.w);
    pivot.y = THREE.MathUtils.lerp(pivot.y, P.renderPos.y + 0.7, this.w);
  }

  label() { return this.mode === 'wall' ? 'SLIP · WALL' : 'SLIP'; }
}
