// ---------------------------------------------------------------------------------------
// AN EGREGORE HERD, AS IT MOVES (the herds: progress/opensea/migrations.js `herdsOf`, Dovina's; the bodies: egregorebodies.js): one
// species gathered in its square for a game day, its bodies milling round the herd's middle, and what they do as the ship comes near,
// by the species' disposition (safari.js):
//   passive      ignores the ship: grazes on, drifting round its places, only easing out of the bow's way
//   wary         inside its `shy` it SCATTERS: each body turns from the ship and runs, diving a beat later (the ghost ship vanishes);
//                once the ship has stood off past 1.4 x shy for a few real seconds the herd REGROUPS: up again, back to its places
//   territorial  inside its `zone` it DISPLAYS: the herd turns to face the ship, edges toward it, roused, its habits played in turn
//                (a breach, a howl, a rise); it settles when the ship leaves
//   hostile      (never herded, MIGRATION.hostile; a lone body laid this way) circles the place it keeps, bent round its turn
// Calm, each body now and then plays one of its habits, so a patient plate catches one (the bonus: plateScore's `habit`). Only looks:
// the herd says nothing (no event, no log); what a plate of it pays is the world's and the Veritome's.
//
// Prior art: Reynolds' boids (1987: separation, alignment, cohesion; the AI part creatures/ai/flock.js is the same idea for a mind) cut
// to what a herd at rest needs (a slot each, kept loosely); a fish school's flash expansion and regroup (a scatter from a threat,
// then the school re-forming behind it); Monster Hunter's herbivore herds that stampede and settle; Pokemon Snap's beasts that turn to
// face the camera when roused.
//
//   const h = new EgregoreHerd({ species, n, at: Vector3 (the herd's middle, on the water), seed, make = egregoreBody })
//   scene.add(h.group)   h.update(dt, { ship: Vector3 | null })   h.state ('calm' | 'scattered' | 'display' | 'hunt')   h.members
//   h.dispose()   (members: { body, pos (Vector3, world), heading, slot })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { egregoreBody } from './egregorebodies.js';
import { EGREGORES } from '../../progress/opensea/safari.js';
import { seeded } from '../../core/rng.js';

const _d = new THREE.Vector3(), _w = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class EgregoreHerd {
  constructor({ species, n = 4, at = new THREE.Vector3(), seed = 1, make = egregoreBody } = {}) {
    this.species = species; this.E = EGREGORES[species] || { disposition: 'passive', size: 2 };
    this.centre = at.clone(); this.group = new THREE.Group(); this.group.name = `egregoreHerd:${species}`;
    this.rng = seeded((seed * 7919 + species.length * 104729) >>> 0); this.state = this.E.disposition === 'hostile' ? 'hunt' : 'calm';
    const size = this.E.size || 2; this.size = size;
    this.spacing = Math.max(3, size * 1.7); this.ring = this.spacing * Math.sqrt(n) * 0.7;
    this.cruise = THREE.MathUtils.clamp(size * 0.18, 0.4, 5); this.flee = Math.max(3, this.cruise * 4.5); this.calmT = 0; this.mill = 0;
    this.members = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.rng.range(-0.3, 0.3), r = this.ring * this.rng.range(0.3, 1);
      const body = make(species);
      const m = { body, slot: [a, r], pos: new THREE.Vector3(at.x + Math.cos(a) * r, at.y, at.z + Math.sin(a) * r), heading: this.rng() * Math.PI * 2, speed: 0, bend: 0, nextHabit: this.rng.range(2, 12), delay: 0 };
      this.members.push(m); this.group.add(body.group);
    }
    this.update(0);
  }

  /** Where member i belongs now: its slot round the middle, the herd milling slowly; nudged toward `toward` (display). */
  slotOf(m, toward = null) {
    const [a, r] = m.slot, ang = a + this.mill;
    _w.set(this.centre.x + Math.cos(ang) * r, this.centre.y, this.centre.z + Math.sin(ang) * r);
    if (toward) { _d.subVectors(toward, this.centre).setY(0); const d = _d.length(); if (d > 1) _w.addScaledVector(_d, Math.min(0.35, (d - this.ring) / d) * 0.6); }
    return _w;
  }

  update(dt, { ship = null } = {}) {
    const E = this.E, dis = E.disposition, near = ship ? Math.hypot(ship.x - this.centre.x, ship.z - this.centre.z) : Infinity;
    // the herd's state from the ship's distance
    if (dis === 'wary') {
      if (near < (E.shy || 30) + this.ring) { if (this.state !== 'scattered') for (const m of this.members) m.delay = this.rng.range(0.2, 0.9); this.state = 'scattered'; this.calmT = 0; }
      else if (this.state === 'scattered' && near > (E.shy || 30) * 1.4 + this.ring) { this.calmT += dt; if (this.calmT > 4) this.state = 'calm'; }
    } else if (dis === 'territorial') this.state = near < (E.zone || 50) + this.ring ? 'display' : 'calm';
    this.mill += dt * (this.cruise / Math.max(4, this.ring)) * 0.35;
    for (const m of this.members) this.steer(m, dt, ship);
  }

  steer(m, dt, ship) {
    const E = this.E, b = m.body;
    let want = null, speed = this.cruise * 0.5;
    if (this.state === 'scattered' && ship) {
      _d.subVectors(m.pos, ship).setY(0); if (_d.lengthSq() < 1e-6) _d.set(1, 0, 0);
      want = Math.atan2(_d.x, _d.z) + Math.sin(m.slot[0] * 3) * 0.5; speed = this.flee;
      m.delay -= dt; if (m.delay <= 0) b.dive(true);
    } else {
      b.dive(false);
      const to = this.slotOf(m, this.state === 'display' ? ship : null);
      _d.subVectors(to, m.pos).setY(0); const d = _d.length();
      if (this.state === 'hunt') { // (circling its place: the tangent of a ring round the middle)
        _d.subVectors(m.pos, this.centre).setY(0); const r = Math.max(1, _d.length()), R = Math.max(this.size * 1.5, (E.sense || 100) * 0.25);
        want = Math.atan2(_d.x, _d.z) + Math.PI / 2 + THREE.MathUtils.clamp((r - R) / R, -0.6, 0.6); speed = this.cruise * 1.6;
      } else if (this.state === 'display' && ship) {
        want = Math.atan2(ship.x - m.pos.x, ship.z - m.pos.z); speed = d > this.size ? this.cruise : 0.05; b.rouse(0.7);
      } else {
        want = d > 0.5 ? Math.atan2(_d.x, _d.z) : m.heading; speed = THREE.MathUtils.clamp(d * 0.3, this.cruise * 0.15, this.cruise * (d > this.ring ? 2 : 1)); b.rouse(0);
      }
      for (const o of this.members) if (o !== m) { _w.subVectors(m.pos, o.pos).setY(0); const s = _w.length(); if (s < this.spacing && s > 1e-3) m.pos.addScaledVector(_w, ((this.spacing - s) / s) * dt * 0.8); } // (apart)
      if (ship && E.disposition === 'passive') { _w.subVectors(m.pos, ship).setY(0); const s = _w.length(), keep = this.size * 1.5 + 8; if (s < keep && s > 1e-3) m.pos.addScaledVector(_w, ((keep - s) / s) * dt * 0.6); } // (out of the bow's way)
      m.nextHabit -= dt;
      if (m.nextHabit <= 0 && b.habits.length) { b.habit(this.rng.pick(b.habits)); m.nextHabit = this.state === 'display' ? this.rng.range(2.5, 5) : this.rng.range(8, 20); }
    }
    const turnMax = 0.9 / Math.max(1, Math.sqrt(this.size / 3)), dh = THREE.MathUtils.clamp(wrap(want - m.heading), -turnMax * dt, turnMax * dt);
    m.heading = wrap(m.heading + dh); m.speed = THREE.MathUtils.damp(m.speed, speed, 1.5, dt);
    m.bend = THREE.MathUtils.damp(m.bend, dt > 0 && m.speed > 0.05 ? THREE.MathUtils.clamp(dh / (m.speed * dt), -1.5 / this.size, 1.5 / this.size) : 0, 3, dt);
    m.pos.x += Math.sin(m.heading) * m.speed * dt; m.pos.z += Math.cos(m.heading) * m.speed * dt;
    b.group.position.copy(m.pos); b.group.rotation.y = m.heading;
    b.update(dt, { speed: m.speed / this.size, bend: m.bend });
  }

  dispose() { for (const m of this.members) { m.body.group.removeFromParent(); m.body.dispose(); } this.members.length = 0; }
}
