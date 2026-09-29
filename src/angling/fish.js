// ---------------------------------------------------------------------------------------
// A FISH: one entity in a pool, with the small mind that decides what it does about the lure.
//   roam     drifts between waypoints inside its depth band
//   stalk    has noticed the lure (curiosity filled: the lure's aspect suits it, at a depth it lives at, within its sense range)
//   inspect  circles the lure and probes it. Teaser probes are small dips; the last is the committing bite, and it opens
//            the window in which the hook must be set
//   bite     the window (lure.js shows it: a hard dip and a ring of light)
//   hooked   the fight (fight.js) owns it
//   flee     spooked, or it let go; keeps away for a while
//
// Prior art: FFXIV's bite grading (the last probe's weight is the bite you have to answer), Animal Crossing's shadow that
// approaches, circles and either bites or bolts, and Zelda: Twilight Princess' fish that follow the lure and lose interest if it
// is worked too hard. A jig (twitch) at the right moment raises curiosity; reeling fast frightens.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { buildFish } from './fishmesh.js';
import { sizeClass, weightOf, BY_SPECIES } from './species.js';

const _v = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const rnd = (a, b) => a + Math.random() * (b - a);

export class Fish {
  constructor(pool, sp, cm, pos) {
    this.pool = pool; this.sp = sp; this.cm = cm; this.kg = weightOf(sp, cm);
    this.cls = sizeClass(sp, cm);
    this.pos = pos.clone();
    this.heading = Math.random() * Math.PI * 2;
    this.pitch = 0;
    this.speed = 0.3;
    this.state = 'roam';
    this.timer = rnd(0.5, 3);
    this.curious = 0;
    this.wp = null;
    this.cool = 0;
    this.mesh = buildFish(sp, cm);
    this.mesh.group.scale.setScalar(0.001);
    this.age = 0;
    this.fade = 0; this.dying = false;
    this.glowT = 0; // sounded / aware
    this.probes = 0; this.probeT = 0;
    this.window = 0; // time left in the bite window
    this.turn = 0;
    this.lingering = 0;
    this.base = 0.35 + 0.5 * Math.min(1.2, cm / 100) * (sp.body === 'minnow' || sp.body === 'comet' ? 2.2 : 1);
  }

  get alive() { return !this.dead; }
  get length() { return this.mesh.length; }

  /** A depth to swim at: inside the band, above the floor. */
  pickDepth() {
    const b = this.sp.depth;
    return rnd(b[0], b[1]);
  }

  pickWaypoint() {
    const P = this.pool;
    for (let i = 0; i < 8; i++) {
      const x = rnd(P.x0 + 1, P.x1 - 1), z = rnd(P.z0 + 1, P.z1 - 1);
      const floor = P.depthAt(x, z);
      const d = Math.min(this.pickDepth(), floor - 0.3);
      if (d < 0.25 || floor < this.sp.depth[0] + 0.2) continue;
      this.wp = new THREE.Vector3(x, P.surface - d, z);
      return;
    }
    this.wp = new THREE.Vector3((P.x0 + P.x1) / 2, P.surface - 1, (P.z0 + P.z1) / 2);
  }

  /** Turn and swim toward a point at a speed. */
  steer(dt, to, speed, turnRate = 1.6) {
    const dx = to.x - this.pos.x, dz = to.z - this.pos.z;
    const want = Math.atan2(dz, dx);
    const err = wrap(want - this.heading);
    const step = THREE.MathUtils.clamp(err, -turnRate * dt, turnRate * dt);
    this.heading += step;
    this.turn = THREE.MathUtils.damp(this.turn, step / Math.max(dt, 1e-3) * 0.4, 8, dt);
    this.speed = THREE.MathUtils.damp(this.speed, speed, 3, dt);
    const dy = to.y - this.pos.y;
    this.pitch = THREE.MathUtils.damp(this.pitch, THREE.MathUtils.clamp(Math.atan2(dy, Math.max(0.5, Math.hypot(dx, dz))), -0.5, 0.5), 3, dt);
  }

  advance(dt) {
    const P = this.pool, h = this.heading;
    const c = Math.cos(this.pitch);
    this.pos.x += Math.cos(h) * this.speed * c * dt;
    this.pos.z += Math.sin(h) * this.speed * c * dt;
    this.pos.y += Math.sin(this.pitch) * this.speed * dt;
    // keep inside the pool, off the floor, under the surface
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, P.x0 + 0.4, P.x1 - 0.4);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, P.z0 + 0.4, P.z1 - 0.4);
    const floor = P.surface - P.depthAt(this.pos.x, this.pos.z) + Math.max(0.15, this.length * 0.12);
    this.pos.y = THREE.MathUtils.clamp(this.pos.y, floor, P.surface - Math.max(0.12, this.length * 0.1));
  }

  /** Interest in the lure right now (0..1): the aspect, the depth, the range, how it is being worked. */
  interest(lure) {
    if (!lure || !lure.inWater || lure.claimed) return 0;
    const sp = this.sp;
    // the echo of a fish just landed: what eats it is drawn to it whatever the aspect (and the deepest of them will come to nothing else)
    if (sp.needsEcho && !(lure.echo && BY_SPECIES[lure.echo]?.tier >= 3)) return 0;
    const aff = Math.max(sp.aff[lure.aspect], lure.echo && sp.mooch?.includes(lure.echo) ? 0.8 : 0);
    if (aff < 0.12) return 0;
    const dist = _v.copy(lure.pos).sub(this.pos).length();
    const range = sp.sense * (lure.twitch > 0 ? 1.5 : 1);
    if (dist > range) return 0;
    const ld = this.pool.surface - lure.pos.y;
    const gap = Math.max(0, sp.depth[0] - 0.7 - ld, ld - (sp.depth[1] + 0.7));
    const depthF = 1 - THREE.MathUtils.clamp(gap / 2.4, 0, 1);
    const speedF = lure.speed > 3.2 ? 0.15 : lure.speed > 1.6 ? 0.6 : 1;
    return aff * depthF * speedF * (1 - dist / range * 0.6) * (lure.twitch > 0 ? 1.8 : 1);
  }

  spook(why = 'spook') {
    if (this.state === 'flee' || this.state === 'hooked') return;
    this.state = 'flee'; this.timer = rnd(2, 4); this.cool = rnd(8, 16); this.curious = 0; this.probes = 0;
    this.heading += Math.PI + rnd(-0.7, 0.7);
    this.why = why;
  }

  update(dt, ctx) {
    this.age += dt;
    const { lure, tide, sound, camera } = ctx;
    this.cool -= dt;
    if (this.state !== 'hooked') {
      this.glowT = Math.max(this.glowT - dt, 0);
      if (sound > 0 && _v.copy(ctx.sourcePos).sub(this.pos).length() < sound) this.glowT = 4.5;
    }
    // appearing, and going when the tide turns
    if (this.dying) this.fade = Math.max(0, this.fade - dt * 0.5);
    else this.fade = Math.min(1, this.fade + dt * 0.8);
    if (this.dying && this.fade <= 0) this.dead = true;
    if (!this.dying && this.state !== 'hooked' && !this.sp.tides.includes(tide)) {
      this.lingering += dt;
      if (this.lingering > 18) this.dying = true;
    } else if (this.sp.tides.includes(tide)) this.lingering = 0;

    switch (this.state) {
      case 'roam': {
        this.timer -= dt;
        if (!this.wp || this.pos.distanceTo(this.wp) < 1.3) { if (this.timer < 0) { this.pickWaypoint(); this.timer = rnd(0.5, 3.5); } else this.speed = THREE.MathUtils.damp(this.speed, 0.15, 2, dt); }
        if (this.wp) this.steer(dt, this.wp, this.base);
        if (this.cool <= 0 && lure) {
          const it = this.interest(lure);
          this.curious += it * dt * (0.35 + this.sp.tier * 0.05) * (this.sp.legend ? 0.5 : 1);
          if (it <= 0) this.curious = Math.max(0, this.curious - dt * 0.15);
          if (this.curious >= 1) { this.state = 'stalk'; this.curious = 0; lure.attention++; this.wp = null; }
        } else this.curious = Math.max(0, this.curious - dt * 0.2);
        break;
      }
      case 'stalk': {
        if (!lure || !lure.inWater || lure.claimed || (lure.speed > 3.4 && Math.random() < dt * 2)) { this.state = 'roam'; this.pickWaypoint(); lure && lure.attention--; break; }
        const to = _v.copy(lure.pos);
        this.steer(dt, to, this.base * 1.6, 2.2);
        if (this.pos.distanceTo(lure.pos) < 1.4 + this.length * 0.4) {
          this.state = 'inspect'; this.timer = rnd(this.sp.inspect[0], this.sp.inspect[1]); this.probes = 0; this.probeT = rnd(0.6, 1.4); this.orbit = Math.random() < 0.5 ? 1 : -1;
        }
        break;
      }
      case 'inspect': {
        if (!lure || !lure.inWater || lure.claimed) { this.state = 'roam'; lure && lure.attention--; break; }
        // circle the lure
        const r = 0.8 + this.length * 0.35;
        const a = Math.atan2(this.pos.z - lure.pos.z, this.pos.x - lure.pos.x) + this.orbit * dt * 0.9;
        const to = new THREE.Vector3(lure.pos.x + Math.cos(a) * r, lure.pos.y + (this.probes % 2 ? -0.1 : 0.15), lure.pos.z + Math.sin(a) * r);
        this.steer(dt, to, this.base * 0.9, 3);
        this.timer -= dt; this.probeT -= dt;
        // a lure worked too hard frightens it; a lure jigged gently keeps it
        if (lure.speed > 3.4 && Math.random() < dt * (0.4 + this.sp.shy)) { this.spook('reeled'); lure.attention--; ctx.onSpook?.(this); break; }
        if (this.probeT <= 0) {
          const n = this.sp.bite.length;
          const kind = this.sp.bite[Math.min(this.probes, n - 1)];
          if (this.probes >= n - 1 && this.timer <= this.sp.inspect[1] * 0.85) {
            // the committing bite
            this.state = 'bite'; this.window = this.sp.window * (kind === 'gulp' ? 1.15 : 1); this.biteKind = kind; this.windowT = 0;
            ctx.onBite?.(this, kind);
          } else {
            this.probes++;
            this.probeT = rnd(0.7, 1.9) * (this.sp.body === 'minnow' ? 0.4 : 1);
            ctx.onProbe?.(this, kind === 'gulp' ? 'tug' : 'nibble');
            if (Math.random() < this.sp.shy * 0.12 * (lure.twitch > 0 ? 0.3 : 1)) { this.spook('shy'); lure.attention--; }
          }
        }
        if (this.timer <= -3) { this.spook('bored'); lure.attention--; }
        break;
      }
      case 'bite': {
        if (!lure) { this.state = 'flee'; break; }
        this.windowT += dt;
        this.window -= dt;
        this.steer(dt, lure.pos, this.base * 0.8, 3);
        if (this.window <= 0) { // it got the bait and left
          ctx.onMiss?.(this);
          this.spook('missed'); lure.attention--;
        }
        break;
      }
      case 'flee': {
        this.timer -= dt;
        this.speed = THREE.MathUtils.damp(this.speed, this.base * 3, 4, dt);
        this.heading += Math.sin(this.age * 5) * dt * 0.6;
        if (this.timer <= 0) { this.state = 'roam'; this.pickWaypoint(); }
        break;
      }
      case 'hooked': break; // the fight moves it
      default: break;
    }
    if (this.state !== 'hooked') this.advance(dt);
    // the body
    const g = this.mesh.group;
    g.position.copy(this.pos);
    g.rotation.set(0, -this.heading, this.pitch, 'YZX');
    const s = THREE.MathUtils.smoothstep(this.fade, 0, 1) * (this.leap ? 1 : 1);
    g.scale.setScalar(Math.max(0.001, s));
    const aware = this.state === 'stalk' || this.state === 'inspect' || this.state === 'bite' || this.state === 'hooked';
    this.mesh.glow(Math.max(this.glowT / 4.5, aware ? 0.55 : 0, this.state === 'bite' ? 1 : 0));
    this.mesh.swim(dt, this.speed / Math.max(0.3, this.length * 0.5), this.turn);
    g.visible = ctx.near;
  }

  dispose(scene) { scene.remove(this.mesh.group); this.mesh.dispose(); }
}
