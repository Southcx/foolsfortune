// ---------------------------------------------------------------------------------------
// THE PATTERN PLAYER: plays the pattern library's emitters into the shot field (progress/rail/patterns.js -> world/emocean/shotfield.js;
// the split with Petra, 2026-10-08). A pattern is emitted once, whole, about a nought origin (every shot with its time, its offset and
// its heading); the player releases each shot on its time from wherever its thrower is NOW, turned from the aim it was laid out on to
// the aim at the ship NOW (so an aimed fan follows you and a ring stays a ring), its kind settled a volley at a time (a waypoint's
// feeling decides how its volleys fall between the forms: one volley one kind, so it reads). A thrower downed takes its unfired
// volleys with it (Ikaruga: killing the emitter is the answer to its pattern).
//
// Prior art: BulletML's runner (an action tree stepped a frame at a time against a live target), Touhou's familiars (patterns carried
// by a moving body), and Ikaruga's cancelled volleys.
//
//   const P = new PatternPlayer(field, { rng })   P.play(name, params, { from, at, mode, kind, feel, ship })   P.update(dt, ship)
//   P.stop(from?)   P.playing   (from: a foe on the waves' roll, { local, alive }; at: a fixed point in the rail's frame instead)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { emit } from '../../progress/rail/patterns.js';
import { kindFor } from '../../progress/rail/legs.js';
import { stream } from '../../core/rng.js';

const AIM0 = new THREE.Vector3(0, 0, -1); // (every pattern is laid out aimed down -z, then turned onto the ship as it fires)
const _o = new THREE.Vector3(), _aim = new THREE.Vector3(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
const shot = { pos: _p, dir: _d, speed: 0, kind: 'astral', outlined: false, motion: null, warn: 0 };

export class PatternPlayer {
  constructor(field, { rng = stream('rail/patterns') } = {}) { this.field = field; this.rng = rng; this.runs = []; }

  /** Begin a pattern from a thrower (or a fixed point), in the view's mode, its kind ('astral', 'umbral', 'feel', 'gift'). */
  play(name, params = {}, { from = null, at = null, mode = 'plane', kind = 'feel', feel = null } = {}) {
    const shots = emit(name, params, { origin: [0, 0, 0], aim: [0, 0, -1], mode, rng: this.rng, kind: 'astral' });
    if (!shots.length) return null;
    const run = { name, shots, k: 0, t: 0, from, at: at ? (Array.isArray(at) ? new THREE.Vector3(...at) : at.clone()) : null, kind, feel, kinds: new Map() };
    this.runs.push(run);
    return run;
  }
  stop(from = null) { this.runs = from ? this.runs.filter((r) => r.from !== from) : []; }
  get playing() { return this.runs.length; }

  update(dt, ship = null) {
    for (let i = this.runs.length - 1; i >= 0; i--) {
      const r = this.runs[i];
      if (r.from && !r.from.alive) { this.runs.splice(i, 1); continue; } // (its thrower is down: the rest is never fired)
      r.t += dt;
      if (r.k < r.shots.length && r.shots[r.k].at <= r.t) {
        _o.copy(r.from ? r.from.local : r.at || _o.set(0, 4, 60));
        if (ship) { _aim.copy(ship.local).sub(_o); if (_aim.lengthSq() < 1e-6) _aim.copy(AIM0); _q.setFromUnitVectors(AIM0, _aim.normalize()); } else _q.identity();
        while (r.k < r.shots.length && r.shots[r.k].at <= r.t) {
          const s = r.shots[r.k++], vk = s.at.toFixed(2);
          if (!r.kinds.has(vk)) r.kinds.set(vk, kindFor(r.kind, r.feel, this.rng)); // (one volley, one kind)
          _p.set(s.pos[0], s.pos[1], s.pos[2]).applyQuaternion(_q).add(_o);
          _d.set(s.dir[0], s.dir[1], s.dir[2]).applyQuaternion(_q);
          let m = s.motion;
          if (m?.type === 'laser') { _d.copy(AIM0).applyQuaternion(_q); } // (a beam sweeps about the aim: its angles are its own)
          Object.assign(shot, { speed: s.speed, kind: r.kinds.get(vk), outlined: s.outlined, motion: m, warn: s.warn });
          this.field.fire(shot, { from: r.from, ship });
        }
      }
      if (r.k >= r.shots.length) this.runs.splice(i, 1);
    }
  }
}
