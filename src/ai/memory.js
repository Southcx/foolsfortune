// ---------------------------------------------------------------------------------------
// MEMORY: what a creature knows, which is not what is true. Its senses (senses.js) write here; its mind (brain.js) reads only from
// here. So it can lose the Courier behind a dune and go to where she WAS; it can be sure of a thing it saw a moment ago and doubt one
// it glimpsed; it can hold a grudge.
//
//   FACTS     one per thing it has perceived (the Courier, another creature): where it was last (and how it was moving), when it was
//             last seen and heard, AWARENESS (0..1: from a glimpse to certainty; it climbs while the thing is perceived and ebbs after
//             `hold` seconds without), THREAT (how dangerous it has proved: hurt by it, kin hurt by it) and GRUDGE (how much it wants
//             to answer that), which fade far more slowly than awareness.
//   INTERESTS things heard but not seen (a shot over the dune, a call): a place and a strength to go and look at.
//   PLACES    named spots it has learned: where it ate, where kin burst (danger), its den; each with a value and a time to forget.
//
//   AWARE.SUSPECT (0.35) the "?": it has noticed something and turns to it      AWARE.ALERT (1) the "!": it knows
//   mem.see(ent, pos, gain, vel?)   mem.heard(stim, gain)   mem.hurt(by, amount)   mem.fact(ent)   mem.focus()   mem.interest()
//   mem.mark('danger', pos, 1, 40)   mem.near('danger', pos, r)   mem.forget(ent)   mem.tick(dt)
//
// Prior art: the "knowledge model" of the Halo AI (Damian Isla, "Handling Complexity in the Halo 2 AI", GDC 2005: the AI acts on
// what it believes, perceptions decay into memories with a last-known position), the awareness levels of Thief and Metal Gear Solid
// (unaware, suspicious, alert, and the search that follows), and the creatures of Rain World, which remember where they last saw you.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const AWARE = { SUSPECT: 0.35, ALERT: 1 };

export class Memory {
  constructor({ hold = 2.5, ebb = 1 / 9, threatEbb = 1 / 120, grudgeEbb = 1 / 200 } = {}) {
    this.hold = hold; this.ebb = ebb; this.threatEbb = threatEbb; this.grudgeEbb = grudgeEbb;
    this.facts = new Map();
    this.interests = [];
    this.places = [];
    this.now = 0;
  }

  fact(ent) { return ent ? this.facts.get(ent) || null : null; }
  ensure(ent, kind) {
    let f = this.facts.get(ent);
    if (!f) this.facts.set(ent, (f = { ent, kind, pos: new THREE.Vector3(), vel: new THREE.Vector3(), seenAt: -1e9, heardAt: -1e9, aware: 0, threat: 0, grudge: 0, peak: 0 }));
    return f;
  }

  /** It perceives `ent` at `pos` this step; `gain` is how much more sure that makes it (0..). */
  see(ent, kind, pos, gain, vel = null) {
    const f = this.ensure(ent, kind);
    f.pos.copy(pos); if (vel) f.vel.copy(vel);
    f.seenAt = this.now;
    f.aware = Math.min(1, f.aware + gain);
    f.peak = Math.max(f.peak, f.aware);
    return f;
  }

  /** A stimulus reached it: if it knows who made it, that thing's place and its certainty move; if not, it is a thing to look into. */
  heard(s, gain) {
    // (a stimulus ABOUT someone (a call that names what it saw, a cry that says who struck): it learns of them, and where they were)
    if (s.about) {
      const f = this.ensure(s.about, s.aboutKind ?? s.about.kind ?? 'courier');
      if (s.aboutPos) f.pos.copy(s.aboutPos);
      f.heardAt = this.now; f.aware = Math.min(1, f.aware + gain * 0.7); f.peak = Math.max(f.peak, f.aware);
      return f;
    }
    const who = s.source;
    if (who && this.facts.has(who)) {
      const f = this.facts.get(who);
      f.heardAt = this.now; f.aware = Math.min(1, f.aware + gain * 0.5); f.pos.lerp(s.pos, 0.5);
      return f;
    }
    // (a new thing to look at, or a stronger one at the same spot)
    const near = this.interests.find((i) => i.pos.distanceToSquared(s.pos) < 9);
    if (near) { near.strength = Math.min(1.5, near.strength + gain); near.at = this.now; near.kind = s.kind; }
    else { this.interests.push({ pos: s.pos.clone(), kind: s.kind, strength: gain, at: this.now, by: s.by }); if (this.interests.length > 6) this.interests.shift(); }
    return null;
  }

  /** It was hurt by `by` (an entity it may or may not have seen). */
  hurt(by, kind, amount = 0.4, pos = null) {
    if (!by) return null;
    const f = this.ensure(by, kind);
    if (pos) f.pos.copy(pos);
    f.threat = Math.min(1, f.threat + amount); f.grudge = Math.min(1, f.grudge + amount * 0.8);
    f.aware = 1; f.seenAt = Math.max(f.seenAt, this.now - 0.5);
    return f;
  }

  /** The fact it is most sure of (and, of those, the most threatening), or null. */
  focus(filter = null) {
    let best = null, bs = 0.05;
    for (const f of this.facts.values()) {
      if (filter && !filter(f)) continue;
      const s = f.aware + f.threat * 0.3;
      if (s > bs) { bs = s; best = f; }
    }
    return best;
  }
  /** The strongest thing heard but not seen, recent enough. */
  interest(maxAge = 12) {
    let best = null, bs = 0.05;
    for (const i of this.interests) { const s = i.strength * (1 - (this.now - i.at) / maxAge); if (s > bs) { bs = s; best = i; } }
    return best;
  }
  /** Looked into: it is crossed off. */
  done(i) { const k = this.interests.indexOf(i); if (k >= 0) this.interests.splice(k, 1); }

  mark(kind, pos, value = 1, ttl = 30) {
    const old = this.places.find((p) => p.kind === kind && p.pos.distanceToSquared(pos) < 4);
    if (old) { old.value = Math.max(old.value, value); old.until = this.now + ttl; return old; }
    const p = { kind, pos: pos.clone(), value, until: this.now + ttl };
    this.places.push(p); if (this.places.length > 24) this.places.shift();
    return p;
  }
  /** The nearest remembered place of a kind within r (with its value), or null. */
  near(kind, pos, r) {
    let best = null, bd = r * r;
    for (const p of this.places) { if (p.kind !== kind) continue; const d = p.pos.distanceToSquared(pos); if (d < bd) { bd = d; best = p; } }
    return best;
  }

  forget(ent) { this.facts.delete(ent); }
  /** Forget everything at once (a creature formed anew), or everything about one kind of thing (a reprogrammed mind: 'courier'). */
  wipe(kind = null) {
    if (!kind) { this.facts.clear(); this.interests.length = 0; return; }
    for (const [e, f] of this.facts) if (f.kind === kind) this.facts.delete(e);
  }

  tick(dt) {
    this.now += dt;
    for (const [e, f] of this.facts) {
      const since = this.now - Math.max(f.seenAt, f.heardAt);
      if (since > this.hold) f.aware = Math.max(0, f.aware - this.ebb * dt);
      f.threat = Math.max(0, f.threat - this.threatEbb * dt);
      f.grudge = Math.max(0, f.grudge - this.grudgeEbb * dt);
      if (f.aware <= 0 && f.threat <= 0.01 && f.grudge <= 0.01 && since > 60) this.facts.delete(e);
    }
    this.interests = this.interests.filter((i) => this.now - i.at < 20);
    this.places = this.places.filter((p) => p.until > this.now);
  }
}
