// ---------------------------------------------------------------------------------------
// THE PATTERN PLAYER: plays the pattern library's emitters into the shot field (progress/rail/patterns.js -> world/emocean/shotfield.js;
// the split with Petra, 2026-10-08). A pattern is emitted once, whole, laid out about a nought origin aimed down -z with up +y (every shot
// with its time, its offset and its heading); the player releases each volley on its time from wherever its thrower is NOW, turned
// from that layout onto the aim at the ship NOW in the VIEW's plane (`orient`: up stays the plane's normal, never the shortest arc, so a
// side view's fan spreads up and down the screen and an aimed fan follows you), its kind settled a volley at a time (a waypoint's
// feeling decides how its volleys fall between the forms: one volley one kind, so it reads). A thrower downed takes its unfired
// volleys with it (Ikaruga: killing the emitter is the answer to its pattern), in its windup too.
// THE CLOCK (the owner's "desynchronised", 2026-10-20: Calissa's measurements, RAIL-BUGS-MEASURED.md report 3): a run started on a bar
// reads the leg's bar (`bar`, set by the leg runner each frame, the stage's clock slewed to the cue), never frame time added up, so a
// hit-stop or a slew leaves no pattern late; frame time only where no bar is given.
//
// Prior art: BulletML's runner (an action tree stepped against a live target, `aim` resolved at each fire), Touhou's familiars
// (patterns carried by a moving body), and Ikaruga's cancelled volleys.
//
//   const P = new PatternPlayer(field, { rng })   P.play(name, params, { from, at, mode, kind, feel, up, range, bar0, lead, until })
//   P.update(dt, ship)   P.stop(from?)   P.playing   P.bar (the leg's bar, the runner's)
//   (from: a foe on the waves' roll, { local, alive }; at: a fixed point in the rail's frame instead; up: the view's plane's normal;
//   lead: the windup before the first volley, real s; until: real s after the play past which nothing is fired)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { emit, frameOf, orient } from '../../progress/rail/patterns.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { kindFor } from '../../progress/rail/legs.js';
import { stream } from '../../core/rng.js';

const LAYOUT = frameOf([0, 0, -1], [0, 1, 0]); // (every pattern is laid out aimed down -z, up +y, then turned onto the ship as it fires)
const _o = new THREE.Vector3(), _aim = new THREE.Vector3(), _up = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
const shot = { pos: _p, dir: _d, speed: 0, kind: 'astral', outlined: false, motion: null, warn: 0, up: null };

export class PatternPlayer {
  constructor(field, { rng = stream('rail/patterns') } = {}) { this.field = field; this.rng = rng; this.runs = []; this.bar = null; }

  /** Begin a pattern from a thrower (or a fixed point), in the view's mode and plane, its kind ('astral', 'umbral', 'feel', 'gift'). */
  play(name, params = {}, { from = null, at = null, mode = 'plane', kind = 'feel', feel = null, up = [0, 1, 0], range = 30, bar0 = null, lead = 0, until = Infinity } = {}) {
    const shots = emit(name, params, { origin: [0, 0, 0], aim: [0, 0, -1], up: [0, 1, 0], mode, rng: this.rng, kind: 'astral', range })
      .filter((s) => lead + s.at <= until); // (nothing into a swing: the bar before one is clear)
    if (!shots.length) return null;
    const run = { name, shots, k: 0, t: -lead, bar0, lead, mode, up, from, at: at ? (Array.isArray(at) ? new THREE.Vector3(...at) : at.clone()) : null, kind, feel, kinds: new Map() };
    this.runs.push(run);
    return run;
  }
  stop(from = null) { this.runs = from ? this.runs.filter((r) => r.from !== from) : []; }
  get playing() { return this.runs.length; }
  /** How long a run fires for, from its first volley (real s). */
  static length(run) { return run?.shots.length ? run.shots[run.shots.length - 1].at : 0; }

  update(dt, ship = null) {
    for (let i = this.runs.length - 1; i >= 0; i--) {
      const r = this.runs[i];
      if (r.from && !r.from.alive) { this.runs.splice(i, 1); continue; } // (its thrower is down: the rest is never fired)
      r.t = this.bar != null && r.bar0 != null ? (this.bar - r.bar0) * BAR_S - r.lead : r.t + dt;
      if (r.k < r.shots.length && r.shots[r.k].at <= r.t) {
        _o.copy(r.from ? r.from.local : r.at || _o.set(0, 4, 60));
        _up.fromArray(r.up);
        if (ship) _aim.copy(ship.local).sub(_o); else _aim.set(0, 0, -1);
        if (r.mode === 'plane') { // (a plane view: the thrower and the aim on the ship's plane, so every shot can reach it)
          if (ship) _o.addScaledVector(_up, -_up.dot(_aim.copy(_o).sub(ship.local))), _aim.copy(ship.local).sub(_o);
          _aim.addScaledVector(_up, -_up.dot(_aim));
        }
        if (_aim.lengthSq() < 1e-6) _aim.set(0, 0, -1);
        const to = frameOf(_aim.toArray(), r.up);
        while (r.k < r.shots.length && r.shots[r.k].at <= r.t) {
          const s = r.shots[r.k++], vk = s.at.toFixed(3), o = orient(s, LAYOUT, to);
          if (!r.kinds.has(vk)) r.kinds.set(vk, kindFor(r.kind, r.feel, this.rng)); // (one volley, one kind)
          _p.fromArray(o.pos).add(_o);
          if (s.motion?.type === 'laser') _d.fromArray(to.f); else _d.fromArray(o.dir); // (a beam sweeps about the aim: its angles are its own)
          let m = s.motion;
          if (o.motion?.at) m = { ...o.motion, at: new THREE.Vector3().fromArray(o.motion.at).add(_o), to: new THREE.Vector3().fromArray(o.motion.to).add(_o) }; // (a cage's ring point and the ship's, where this volley is thrown)
          Object.assign(shot, { speed: s.speed, kind: r.kinds.get(vk), outlined: s.outlined, motion: m, warn: s.warn, up: r.up });
          this.field.fire(shot, { from: r.from, ship });
        }
      }
      if (r.k >= r.shots.length) this.runs.splice(i, 1);
    }
  }
}
