// ---------------------------------------------------------------------------------------
// STIMULI: what happens in the world that a creature could notice without seeing it. Anything that makes a noise, a light, a smell or
// a call puts a STIMULUS here (a kind, a place, how far it carries, how strong, who made it), and it lingers a moment; every creature's
// senses (senses.js) ask what has happened within their hearing since they last listened. The shooter does not know who heard; the
// listener does not know what made it: a new noise is one line where it happens, and every creature, now and later, can hear it.
//
//   kinds    noise   a shot, a blast, a pot breaking, a heavy landing               light   the Veritome's flash, a blast's glare
//            alarm   a creature's call to its kind ("there is something here")      pain    a creature hurt (its kin come, or flee)
//            death   a creature burst or broken (a place to fear for a while)      food    something to eat appeared (baubles)
//            shiny   something bright to look at (cubes, a dropped curio)          scent   a trail laid (slip) (strength is its freshness)
//
//   game.ai.stimuli.emit('noise', pos, { radius: 24, strength: 1, by: 'courier', source: entity, ttl: 1.2 })
//   (and `about` / `aboutPos`: whom it is about, and where they were: a call naming what it saw, a cry naming who struck)
//   game.ai.stimuli.around(pos, (s, d, reach) => ..., { kinds: ['noise', 'alarm'], after: seq })   (each live stimulus whose radius
//   reaches pos, made after the one numbered `seq`: a listener keeps `stimuli.seq` from its last listen, and hears each thing once)
//
// Prior art: the "sense" systems of the stealth games, where a noise is an event with a position and a radius that the AI polls
// (Thief: The Dark Project's sound propagation and awareness, Tom Leonard's "Building an AI Sensory System" GDC 2003; Unreal's
// MakeNoise / PawnSensing), and Rain World's creatures, which hear and smell one another as well as the player.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const STIM = ['noise', 'light', 'alarm', 'pain', 'death', 'food', 'shiny', 'scent'];

export class Stimuli {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.now = 0; this.seq = 0;
    this.max = 160;
  }

  emit(kind, pos, { radius = 15, strength = 1, by = null, source = null, about = null, aboutPos = null, ttl = 1.2 } = {}) {
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) return null;
    const s = { id: ++this.seq, kind, pos: new THREE.Vector3(pos.x, pos.y, pos.z), radius, strength, by, source, about, aboutPos: aboutPos ? new THREE.Vector3().copy(aboutPos) : null, at: this.now, ttl };
    this.list.push(s);
    if (this.list.length > this.max) this.list.shift();
    return s;
  }

  update(dt) {
    this.now += dt;
    let n = 0;
    for (const s of this.list) if (this.now - s.at <= s.ttl) this.list[n++] = s;
    this.list.length = n;
  }

  /** Each live stimulus that reaches `pos` (its radius x the listener's `range`), made after number `after`; fn(s, distance, reach 0..1). */
  around(pos, fn, { kinds = null, after = 0, range = 1 } = {}) {
    for (const s of this.list) {
      if (s.id <= after || (kinds && !kinds.includes(s.kind))) continue;
      const d = s.pos.distanceTo(pos), R = s.radius * range;
      if (d > R) continue;
      fn(s, d, 1 - d / R);
    }
  }

  clear() { this.list.length = 0; }
}
