// ---------------------------------------------------------------------------------------
// SENSES: how a creature finds out. Each think it looks at what is around it and listens to what has happened (stimuli.js), and
// writes what it perceived into its memory (memory.js): it never reads the world directly.
//
//   SIGHT    within `sight` metres, inside its field of view (`fov`, degrees about where it faces), and with nothing solid between its
//            eye and the thing (a ray, cast at most every `every` seconds per thing and remembered between). How fast it becomes sure
//            depends on how near the thing is, how close to the middle of its view, and how CONSPICUOUS the thing is just then
//            (`loud`: running and fighting are loud; standing still is quiet; crouching quieter; a body melted into slip invisible).
//   FEEL     within `feel` metres it knows a thing is there whichever way it faces (it touches, smells, feels the sand shift).
//   HEARING  every stimulus that reaches it (its radius times the creature's `hear`) adds to what it knows about whoever made it, or,
//            if it does not know them, becomes an interest to go and look at.
//
//   const s = new Senses(game, { sight: 15, fov: 220, feel: 2.5, hear: 1, eye: 1.0, onHear: (stim, reach) => ... (the kind's own reaction) })
//   s.update(dt, owner, memory, watch)   watch: [{ ent, kind, pos, vel?, loud (0..1.5), hidden? }]   (the brain builds it)
//
// Prior art: the vision cones and hearing radii of the stealth games (Thief, Metal Gear Solid, Splinter Cell's light-and-noise
// meters), with Thief's rule that awareness builds over time rather than flipping (a glimpse is a "?", a stare is a "!"), and the
// cheap trick of every console game since: line-of-sight rays are expensive, so each one is cast a few times a second, not every frame.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const DEG = Math.PI / 180;
const _eye = new THREE.Vector3(), _to = new THREE.Vector3(), _dir = new THREE.Vector3();

export class Senses {
  constructor(game, { sight = 15, fov = 220, feel = 2.5, hear = 1, eye = 1.0, every = 0.25, rate = 1.8, onHear = null } = {}) {
    this.game = game; this.onHear = onHear;
    this.sight = sight; this.fov = fov; this.feel = feel; this.hear = hear; this.eye = eye; this.every = every; this.rate = rate;
    this.los = new Map(); // ent -> { at, clear }
    this.heard = 0; // (the number of the last stimulus it has listened to)
    this.blind = 0; // (seconds it cannot see: a flash in its eyes)
  }

  /** Is there a clear line from its eye to `to`? (cached per thing for `every` seconds) */
  clear(owner, ent, to, now) {
    const c = this.los.get(ent);
    if (c && now - c.at < this.every) return c.clear;
    _dir.subVectors(to, _eye); const d = _dir.length();
    let clear = true;
    if (d > 0.5) {
      const ph = this.game.physics;
      const hit = ph.raycast(_eye, _dir.multiplyScalar(1 / d), d - 0.3, owner.col ?? null, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !ph.entityOf(k)?.type);
      clear = !hit;
    }
    this.los.set(ent, { at: now, clear });
    return clear;
  }

  update(dt, owner, mem, watch) {
    const now = mem.now;
    this.blind = Math.max(0, this.blind - dt);
    _eye.set(owner.pos.x, owner.pos.y + this.eye, owner.pos.z);
    const fx = Math.sin(owner.yaw), fz = Math.cos(owner.yaw), half = (this.fov * DEG) / 2;
    for (const w of watch) {
      if (!w.ent || w.ent === owner || w.hidden) continue;
      _to.set(w.pos.x, w.pos.y + (w.height ?? 1) * 0.6, w.pos.z);
      const dx = _to.x - _eye.x, dz = _to.z - _eye.z, dh = Math.hypot(dx, dz), dy = Math.abs(_to.y - _eye.y);
      if (dh < this.feel && dy < 2.5) { mem.see(w.ent, w.kind, w.pos, dt * this.rate * 2, w.vel); continue; } // (felt: no eyes needed)
      if (this.blind > 0 || dh > this.sight || dy > this.sight * 0.5) continue;
      const ang = Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / (dh || 1))));
      if (ang > half) continue;
      if (!this.clear(owner, w.ent, _to, now)) continue;
      const near = Math.pow(1 - dh / this.sight, 1.4), centre = 1 - 0.6 * (ang / (half || 1));
      mem.see(w.ent, w.kind, w.pos, dt * this.rate * near * centre * (w.loud ?? 1), w.vel);
    }
    // and what was heard since it last listened
    const S = this.game.ai?.stimuli;
    if (S) {
      S.around(_eye, (s, d, reach) => { if (s.source !== owner) { mem.heard(s, s.strength * reach * 0.6); this.onHear?.(s, reach); } }, { after: this.heard, range: this.hear });
      this.heard = S.seq;
    }
  }

  /** Dazzled: it sees nothing for a while (the Veritome's flash). */
  dazzle(t) { this.blind = Math.max(this.blind, t); }
}
