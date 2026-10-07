// ---------------------------------------------------------------------------------------
// THE SHOAL: the crossing's commonest set piece (docs/plans/RAIL.md section 7; its numbers are progress/rail/setpieces.js SHOAL,
// Dovina's; its look is vfx/shoal.js, Calissa's; its fish are glints and its caller the Conductor, Espada's). A school of glints that
// boils up out of the crude, rings the ship in a bait ball, and strikes at it in pulses, while its Conductor feeds the ball from below.
//
//   THE BOIL     (the set piece's first 8 bars, seen from above) the glints rise at a ring round the ship, ten metres out and tightening
//                0.6 m a bar to no closer than five. They keep to the surface (the crude is opaque: a glint a hand under it is gone),
//                out of the gun's plane: only the Conductor can be reached, and a lance is how (the lock-on is the answer it teaches).
//   THE FRENZY   (from its 8th bar) every bar a strike group of 4 + 2 a class leaves the ball for where the ship will be (0.35 s of
//                lead); a quarter bar before, the group turns its flanks (the silver turn: a motion, never a flash). Five bites are
//                one hit. Every glint can be shot now, one shot each; they are one body, so they never chain and never count toward
//                the medal. While the Conductor lives the crude feeds the ball six glints a bar.
//   THE SCATTER  down the Conductor and the shoal breaks for good (`scattered`); down a third of the ball inside a bar, or toll the
//                bell over it, and it scatters for two bars and reforms (what a predator does to a real one).
// The heavy it was fleeing comes with the authored escort at the set piece's 22nd bar (the waves: world/emocean/waves.js).
//
// Prior art: Reynolds' boids (creatures/ai/flock.js), the sardine run's bait ball (the dolphins herd it to the surface; it tightens;
// it flashes silver as it turns), the piranha's pulse, Finding Nemo's moonfish, and every shmup's "kill the leader and the formation
// breaks" (Galaga's boss with its escort).
//
//   const S = new ShoalPiece(stage)   S.build(scene)   S.begin(leg)   S.update(dt, rel, ctx)   S.finish() -> 'scattered' | null
//   S.scatter(bars)   (the toll's)   S.show(on)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Flock } from '../../creatures/ai/flock.js';
import { SHOAL } from '../../progress/rail/setpieces.js';
import { ROLE_CLASS, LEG } from '../../progress/econ/emocean.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { ShoalLook } from '../../vfx/shoal.js';
import { stream } from '../../core/rng.js';

const simRand = stream('world/emocean/shoal'); // (where a glint rises: core/rng.js, the same twice)

const MAX = 160, CRUISE_Y = 0.15; // (glints at most; how high over the swell the ball swims)
const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1), _u = new THREE.Vector3();

export class ShoalPiece {
  constructor(stage) {
    this.stage = stage; this.game = stage.game;
    const B = SHOAL.boids;
    this.flock = new Flock({ max: MAX, sep: B.sep, align: B.align, coh: B.coh, speed: B.speed, turn: B.turn });
    this.fish = new Array(MAX).fill(null); // (the foe on the roll for each member)
    this.mood = new Uint8Array(MAX); this.moodT = new Float32Array(MAX); this.roll = new Float32Array(MAX); this.ang = new Float32Array(MAX);
  }

  build(scene) {
    this.look = new ShoalLook({ max: 192 }); this.look.group.userData.zoneFree = true; this.look.group.visible = false;
    this.look._s.setScalar(2); // (the glints drawn twice life: at 480 lines a 0.6 m fish from 30 m up is a pixel; Calissa's to tune)
    this.look.group.traverse((o) => { o.userData.zoneFree = true; });
    scene.add(this.look.group);
  }
  show(on) { if (this.look) { this.look.group.visible = on; if (!on) { this.look.count = 0; this.look.boil(_p.set(0, 0, 0), 1, 0); this.look.conductor(_p, _q, false); } } }

  /** The set piece's first bar: the class read at the leg's danger, the ball's ring, the Conductor. */
  begin(leg) {
    const st = this.stage;
    this.leg = leg; this.cls = ROLE_CLASS.school((st.plan?.danger || 0) + LEG.deeper * (leg.k || 0));
    this.want = Math.min(MAX - 24, SHOAL.count(this.cls)); this.risen = 0;
    this.flock.clear(); this.fish.fill(null); this.mood.fill(0); this.roll.fill(0);
    this.radius = SHOAL.ball.radius; this.scattered = false; this.scatterT = 0; this.bites = 0; this.lastBar = -1; this.downsThisBar = 0; this.ballAtBar = 0;
    this.caller = st.waves.add({
      kind: 'rail.conductor', name: 'the Conductor', role: 'caller', cls: this.cls, aspect: null, radius: 1.3, hp: SHOAL.caller.hp,
      local: _p.set(0, CRUISE_Y + 0.4, 9), chain: false,
      tick: (dt, f) => this.tickCaller(dt, f),
      onDown: () => this.lose(),
    });
    this.show(true);
  }

  /** Once a frame while the set piece holds (rel: bars since its first). */
  update(dt, rel, ctx) {
    const st = this.stage, S = st.ship, bar = Math.floor(rel), raw = this.game.rawDt ?? dt;
    // the ball tightens a bar at a time; the boil brings them up over its first two bars
    this.radius = Math.max(SHOAL.ball.min, SHOAL.ball.radius - SHOAL.ball.tighten * rel);
    const due = this.scattered ? 0 : Math.min(this.want, Math.floor(this.want * Math.min(1, rel / 2)));
    while (this.risen < due) { this.rise(); this.risen++; }
    if (bar !== this.lastBar) this.onBar(bar, rel);
    this.scatterT = Math.max(0, this.scatterT - dt / BAR_S);
    // the flock's step: each glint makes for its place on the ring, or the ship (a strike), or away (a scatter)
    const ship = S.local, lead = SHOAL.frenzy.lead, F = this.flock, B = SHOAL.boids;
    F.step(dt, {
      seek: (i, out) => {
        const m = this.mood[i];
        if (this.scattered || this.scatterT > 0) { F.get(i, out); out.sub(ship).setY(0).normalize().multiplyScalar(40).add(ship); out.y = -2; return 3; }
        if (m === 2) { out.copy(ship).addScaledVector(S.vel, lead); return 6; }
        const a = this.ang[i] + st.t * 0.35, r = this.radius + (i % 5) * 0.35;
        out.set(ship.x + Math.cos(a) * r, this.surface(ship.x + Math.cos(a) * r, ship.z + Math.sin(a) * r) + CRUISE_Y, ship.z + Math.sin(a) * r);
        return 2.5;
      },
      speed: (i) => (this.mood[i] === 2 || this.scatterT > 0 || this.scattered ? B.burst : B.speed),
    });
    // each glint: the telegraph's silver turn, the strike's bite, back to the ball; the ball kept on the surface
    for (let i = 0; i < MAX; i++) {
      if (!F.alive[i]) continue;
      F.get(i, _p, _v);
      const m = this.mood[i]; this.moodT[i] += dt;
      if (m === 1 && this.moodT[i] >= SHOAL.frenzy.telegraph * BAR_S) { this.mood[i] = 2; this.moodT[i] = 0; }
      if (m === 2) {
        if (_p.distanceTo(ship) < 1.2) { this.bite(i); continue; }
        if (this.moodT[i] > 1.4 || _p.z < ship.z - 6) { this.mood[i] = 0; this.moodT[i] = 0; }
      } else if (!this.scattered && this.scatterT <= 0) { const y = this.surface(_p.x, _p.z) + CRUISE_Y; if (_p.y < y - 0.2 || _p.y > y + 0.6 && m === 0) F.set(i, _p.x, THREE.MathUtils.lerp(_p.y, y, Math.min(1, dt * 4)), _p.z); }
      if ((this.scattered || this.scatterT > 0) && _p.y < -1.5) { this.sink(i); continue; }
      this.roll[i] = THREE.MathUtils.damp(this.roll[i], m >= 1 ? 1 : 0, m === 1 ? 1 / (SHOAL.frenzy.telegraph * BAR_S) : 4, dt);
    }
    this.draw(raw, rel);
  }

  /** A bar line: the frenzy's strike group, the Conductor's feeding, the third-of-the-ball check. */
  onBar(bar, rel) {
    this.lastBar = bar;
    if (this.downsThisBar >= SHOAL.scatter.share * Math.max(6, this.ballAtBar) && !this.scattered) this.scatter(SHOAL.scatter.bars);
    this.downsThisBar = 0; this.ballAtBar = this.flock.count;
    if (this.scattered) return;
    if (this.caller?.alive) for (let k = 0; k < SHOAL.reinforce.perBar && this.flock.count < MAX - 8; k++) this.rise();
    if (rel >= 8 && this.scatterT <= 0) { // (the frenzy: a group turns its flanks, then strikes)
      let n = SHOAL.frenzy.group(this.cls);
      for (let i = 0; i < MAX && n > 0; i++) if (this.flock.alive[i] && this.mood[i] === 0 && ((i * 7 + bar * 13) % 3 === 0)) { this.mood[i] = 1; this.moodT[i] = 0; n--; }
    }
  }

  /** One glint up out of the crude at a place on the ring, onto the roll (shootable from the frenzy on). */
  rise() {
    const st = this.stage, S = st.ship.local, a = simRand() * Math.PI * 2, r = this.radius + 2;
    const x = S.x + Math.cos(a) * r, z = S.z + Math.sin(a) * r;
    const i = this.flock.add(x, this.surface(x, z) - 0.6, z, -Math.sin(a) * 6, 1.5, Math.cos(a) * 6); if (i < 0) return;
    this.ang[i] = a; this.mood[i] = 0; this.moodT[i] = 0; this.roll[i] = 0;
    const self = this;
    this.fish[i] = st.waves.add({
      kind: 'rail.glint', name: 'a glint', role: 'glint', cls: this.cls, aspect: null, radius: 0.55, hp: SHOAL.fish.hp, local: _p.set(x, 0, z),
      chain: false, count: false,
      get solid() { return self.leg && st.bar - self.leg.from >= 8; }, // (under the crude's skin until the frenzy: SHOAL's "only the Conductor can be reached")
      get lock() { return this.solid; },
      tick: (dt, f) => { if (!this.flock.alive[i] || this.fish[i] !== f) return false; this.flock.get(i, f.local); return true; },
      onDown: () => { this.flock.remove(i); this.fish[i] = null; this.downsThisBar++; },
    });
  }
  sink(i) { const f = this.fish[i]; this.flock.remove(i); this.fish[i] = null; if (f?.alive) this.stage.waves.drop(f); }

  /** A strike that lands: a bite (five are a hit on what the ship bears), and the glint goes back to the ball. */
  bite(i) {
    this.mood[i] = 0; this.moodT[i] = 0;
    if (++this.bites >= SHOAL.bite.perHit) { this.bites = 0; this.stage.blow(1, { by: 'creature', what: 'bite' }); }
    this.game.events?.emit('rail.bite', { bites: this.bites, by: 'creature' });
  }

  /** The Conductor: it swims the inside of the ring, at the surface, its glow breathing (Calissa's). */
  tickCaller(dt, f) {
    const st = this.stage, S = st.ship.local, a = st.t * 0.6, r = Math.max(3, this.radius * 0.55);
    const x = S.x + Math.cos(a) * r, z = S.z + 4 + Math.sin(a) * r;
    f.local.set(x, this.surface(x, z) + CRUISE_Y + 0.3, z);
    return !this.scattered;
  }
  /** The Conductor downed: the shoal breaks for good. */
  lose() {
    this.scattered = true; this.caller = null;
    this.game.events?.emit('rail.end', { end: 'scattered', by: 'courier' });
    this.stage.endPay('scattered');
  }
  /** The ball broken for `bars` (the toll's ring, a third of it downed in a bar): it flees and sinks, and reforms if the Conductor lives. */
  scatter(bars = SHOAL.scatter.bars) { if (!this.scattered) { this.scatterT = bars; this.game.events?.emit('rail.scatter', { bars, by: 'courier' }); } }

  surface(x, z) { const st = this.stage, w = st.rail.toWorld(_u.set(x, 0, z), _w); return (st.sea?.heightAt(w.x, w.z) ?? st.rail.Q.y) - st.rail.Q.y; }

  /** The glints, the Conductor and the boil, each frame (one instanced draw for the glints). */
  draw(raw, rel) {
    const st = this.stage, L = this.look, F = this.flock; let n = 0;
    for (let i = 0; i < MAX; i++) {
      if (!F.alive[i]) continue;
      F.get(i, _p, _v); st.rail.toWorld(_p, _w); st.rail.dirWorld(_v, _u);
      _q.setFromUnitVectors(_z, _u.lengthSq() > 1e-6 ? _u.normalize() : _z);
      L.set(n++, _w, _q, this.roll[i]);
    }
    L.count = n;
    const c = this.caller;
    if (c?.alive) { _q.setFromAxisAngle(_u.set(0, 1, 0), -st.t * 0.6); L.conductor(c.pos, _q, true); } else L.conductor(_p, _q, false);
    st.rail.toWorld(_p.copy(st.ship.local), _w);
    L.boil(_w, this.radius + 3, this.scattered ? 0 : Math.min(1, rel / 1.5) * (this.scatterT > 0 ? 0.3 : 1), st.sea);
    L.update(raw);
  }

  /** The set piece's last bar: what is left of the shoal sinks; how it ended. */
  finish() {
    for (let i = 0; i < MAX; i++) if (this.flock.alive[i]) this.sink(i);
    if (this.caller?.alive) this.stage.waves.drop(this.caller);
    const end = this.scattered ? 'scattered' : null;
    this.caller = null; this.show(false);
    return end;
  }
}
