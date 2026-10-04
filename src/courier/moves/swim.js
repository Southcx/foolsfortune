import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { T, PALETTE } from '../../core/config.js';

// Swimming: deep water takes over from the feet. At the surface you float with your
// head out and paddle along (Shift for a faster crawl); C dives, and underwater you
// swim where you look; Space rises, and at the surface hops you up out of the water.
// Swim into a wall with a ledge in reach and you climb out.
const UP = new THREE.Vector3(0, 1, 0);
const FLOAT = 1.12; // feet this far below the surface when floating (head and shoulders out)

export class Swim extends Tech {
  constructor(mgr) {
    super(mgr, 'swim');
    this.overrides = 1;
    this.blendIn = 8;
    this.handsBusy = true; // (the gun goes away while swimming)
    this.keepsLegs = true; // (the legs are the clip's: no foot IK to re-bend them)
    this.vol = null;
    this.hopT = 0;
  }

  tick(dt) { this.hopT -= dt; }

  get water() { return this.game.water; }

  deepAt(p) {
    const v = this.water?.at(p.x, p.y + 0.9, p.z);
    if (!v) return null;
    return p.y < v.surface - 0.95 && v.surface - v.bottom > 1.2 ? v : null;
  }

  canStart() {
    const P = this.P;
    if (this.hopT > 0) return false; // (mid-hop: the water doesn't grab you back on the way out)
    const v = this.deepAt(P.pos);
    if (!v) return false;
    this.vol = v;
    return true;
  }

  start() {
    const P = this.P;
    const impact = Math.abs(P.vel.y);
    P.endCore();
    P.setShape('low');
    this.stroke = 0;
    this.under = false;
    this.surf = 1;
    this.diveA = 0;
    if (impact > 3) {
      sfx.splash(Math.min(2, impact / 6));
      this.splash(P.pos.clone().setY(this.vol.surface), impact);
    }
    // water eats the fall
    P.vel.y *= 0.35;
    P.vel.x *= 0.7; P.vel.z *= 0.7;
    P.airJumps = T.movement.airJumps;
  }

  update(dt) {
    const P = this.P, c = this.cfg, inp = P.input, v = this.vol;
    const float = v.surface - FLOAT;
    const depth = float - P.pos.y; // >0: below floating height
    // a ladder in reach (the way out of the deep end): take it
    const lad = this.mgr.get('ladder');
    if (lad?.enabled && lad.canStart()) { this.mgr.begin(lad); return true; }
    const wish = P.wishDir();
    const iz = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    const up = inp.isDown('Space') ? 1 : 0, down = inp.isDown('KeyC') ? 1 : 0;
    const fast = inp.isDown('ShiftLeft') || inp.isDown('ShiftRight');
    // surface or under: two states with a gap between them, so hovering at the boundary
    // can't flip back and forth (that was the flicker)
    if (!this.under && (down || depth > 0.7)) this.under = true;
    else if (this.under && !down && depth < 0.1) this.under = false;
    const atSurface = !this.under;
    const target = new THREE.Vector3();
    // climb out: a ledge in reach ahead (or Space at the wall)
    if ((iz > 0 || up) && atSurface && P.tryMantle(0.15, 0)) return false;
    if (atSurface) {
      target.copy(wish).multiplyScalar(fast ? c.sprint : c.speed);
      // (bob to the floating height: velocity proportional to the height error, which settles
      // without overshoot; depth > 0 means below it, so up)
      target.y = THREE.MathUtils.clamp(depth * c.buoyancy, -3, 3);
      if (P.latch('Space') && P.pos.y > float - 0.1) {
        // a hop out of the water (onto a low edge, or just a splash)
        // a reduced jump: from floating height it lifts you about 1.3 m, enough to clear a deck edge
        P.vel.y = c.exitJump;
        P.vel.x = P.vel.x * 0.8 + wish.x * c.exitPush; P.vel.z = P.vel.z * 0.8 + wish.z * c.exitPush;
        P.grounded = false;
        this.hopT = 0.5;
        this.splash(P.pos.clone().setY(v.surface), 3);
        sfx.splash(0.5);
        this.hopped = true;
        return false;
      }
    } else {
      // underwater: swim where you look, Space up, C down; drift back up with nothing held
      const look = P.lookDir();
      const right = P.right(new THREE.Vector3());
      const ix = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
      target.copy(look).multiplyScalar(iz).addScaledVector(right, ix).addScaledVector(UP, up - down);
      if (target.lengthSq() > 1) target.normalize();
      target.multiplyScalar(fast ? c.underwater * 1.35 : c.underwater);
      if (target.lengthSq() < 0.01) target.y = 0.8; // buoyancy
      if (P.pos.y + 0.2 > float && target.y > 0) target.y = Math.min(target.y, Math.max(0, depth * c.buoyancy + 0.3)); // slow into the surface, don't shoot through it
    }
    // (horizontal eases; vertical at the surface tracks the target directly so the bob can't ring)
    P.vel.x += (target.x - P.vel.x) * Math.min(1, c.accel * dt);
    P.vel.z += (target.z - P.vel.z) * Math.min(1, c.accel * dt);
    P.vel.y += (target.y - P.vel.y) * Math.min(1, (atSurface ? 3 : 1) * c.accel * dt);
    P.move(dt);
    // strokes
    const sp = Math.hypot(P.vel.x, P.vel.z) + Math.abs(P.vel.y) * 0.5;
    this.stroke += dt * (0.6 + sp * 0.5);
    if (sp > 0.5 && Math.floor(this.stroke) !== Math.floor(this.stroke - dt * (0.6 + sp * 0.5))) {
      sfx.stroke();
      if (atSurface) this.splash(P.pos.clone().setY(v.surface), 1.2);
    }
    // out of the water (walked up a shallow end, or out of the volume)
    const still = this.deepAt(P.pos) || (this.water.at(P.pos.x, P.pos.y + 0.9, P.pos.z) && P.pos.y < v.surface - 0.8);
    if (!still) return false;
    return true;
  }

  end() {
    const P = this.P;
    if (P.canStand()) P.setShape('stand');
  }

  splash(at, k = 1) {
    const fx = this.game.fx;
    if (!fx) return;
    const col = new THREE.Color(0xcfe6e4);
    for (let i = 0; i < 10 * k; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.4 * k;
      fx.alpha.emit({ pos: at.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.05, Math.sin(a) * r)), vel: new THREE.Vector3(Math.cos(a) * 1.5, 2 + Math.random() * 2.5 * k, Math.sin(a) * 1.5), life: 0.6, size: 0.06, sizeEnd: 0.02, color: col, alpha: 0.6, drag: 1.5, gravity: 9 });
    }
  }

  // ---- animation: tread water upright, crawl lying along the surface, dive where you swim ----
  animate(ch, base, dt) {
    const C = ch.clips, P = this.P;
    const hs = Math.hypot(P.vel.x, P.vel.z);
    // (on the surface only sideways speed swings between treading and crawling: the vertical
    // bob would flap the pose; under water any motion does)
    const move = this.under ? hs / 1.5 + Math.abs(P.vel.y) / 3 : hs / 1.5;
    this.crawl = THREE.MathUtils.damp(this.crawl || 0, this.active ? THREE.MathUtils.clamp(move, 0, 1) : 0, 6, dt);
    this.surf = THREE.MathUtils.damp(this.surf ?? 1, this.under ? 0 : 1, 7, dt);
    const tread = C.sample('tread', ch.time, ch.P.tmp);
    const swim = C.sample('swim', this.stroke * 1.33 / 2, ch.P.tmp2);
    C.blend(tread, swim, this.crawl);
    C.blend(base, tread, this.w);
  }

  afterPose(ch) {
    const P = this.P, v = this.vol;
    if (!v) return;
    const B = ch.bones, root = ch.root;
    // the crawl clip already lies prone: tilt it only by the dive angle (head down going
    // down, up coming up); the tread clip stays upright
    const vel = P.vel, hs = Math.hypot(vel.x, vel.z);
    // (the tilt eases toward the dive angle, and only counts once under)
    const want0 = this.under ? THREE.MathUtils.clamp(Math.atan2(-vel.y, Math.max(0.6, hs)), -1.1, 1.1) : 0;
    this.diveA = THREE.MathUtils.damp(this.diveA || 0, want0, 6, 1 / 60);
    const dive = this.diveA;
    root.updateMatrixWorld(true);
    const rightW = new THREE.Vector3(-1, 0, 0).applyQuaternion(root.quaternion);
    ch.rotW(B.spine, rightW, -dive * this.crawl * this.w);
    root.updateMatrixWorld(true);
    // float the body at the waterline: head out when treading, back at the surface when crawling
    const hips = B.spine.getWorldPosition(new THREE.Vector3()), head = B.head.getWorldPosition(new THREE.Vector3());
    const surfW = this.surf ?? 1;
    const atWaterline = THREE.MathUtils.lerp(v.surface + 0.2 - (head.y - hips.y), v.surface - 0.15, this.crawl);
    // (hips at a steady waterline height when floating, at the body's own height when under;
    // the two blend by how far into either state we are)
    const want = THREE.MathUtils.lerp(P.renderPos.y + 0.7, atWaterline, surfW);
    root.position.y += (want - hips.y) * this.w;
    root.updateMatrixWorld(true);
  }

  camera(fp, pivot) {
    if (!this.active && this.w < 0.01) return;
    const v = this.vol, P = this.P;
    if (!v) return;
    // at the surface the eye and the third-person pivot sit at the waterline (steady, whatever
    // the body's bob); under water they ride the body, so a dive is followed all the way down
    const body = P.renderPos.y;
    fp.y = THREE.MathUtils.lerp(fp.y, THREE.MathUtils.lerp(body + 1.3, v.surface + 0.22, this.surf ?? 1), this.w);
    pivot.y = THREE.MathUtils.lerp(pivot.y, THREE.MathUtils.lerp(body + 0.7, v.surface + 0.4, this.surf ?? 1), this.w);  }

  faceYaw() {
    const v = this.P.vel;
    return Math.hypot(v.x, v.z) > 0.4 ? Math.atan2(v.x, v.z) : null;
  }

  label() { return 'SWIM'; }
}

export const WATER_TINT = PALETTE.deep;
