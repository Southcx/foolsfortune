// ---------------------------------------------------------------------------------------
// A DOMAIN'S DEPTH RUNGS IN PLAY (docs/plans/DOMAINS.md 14, 18.1; the rules Dovina's, progress/domainarts.js): the runtime of the rungs
// at level 60, the ladder's depth (South, 2026-11-01: a milestone every ten). Owned by the rungs' runtime (run.js: `run.depth`), which
// routes the art key, the strike and the frame here. Each is a modifier with a source you can see, drawn in its domain's grammar from
// the library (vfx/library/domains.js, Calissa's).
//   The Fuse          the action: the nearest foe fused for `window` real s; every affliction put on it is held unspent (its time and
//                     strength kept), then all set off at once when you press again, each `mult` times as long; left to the window's
//                     end, they go off as they were
//   Catch the Weather a passive: in a feeling's weather, in the open, with a Bottle worn and that feeling known, the Bottle fills with
//                     it (`rate` x the weather's strength a real s) while it is empty or already of that feeling
//   Relay             a passive: a creature you strike heavily (a thrown hit, or a blow of power 2 or more) passes the force on to the
//                     next creature behind it, `keep` of it, up to `links` links
//   Walk the Cycle    the action: every affliction on the nearest foe turned into the one its type trumps (types.js TRUMPS: doubt into
//                     charm, charm into confusion, confusion into a stun, blind into doubt), keeping the time it had left, never more
//                     than the new one's own
//   A Seal on a       the action: a creature winding up a blow is sealed; that blow breaks off, and that kind of blow is broken off
//   Creature          each time it starts one for `dur` real s; a FOE (class 2 and up) holds its own rule and refuses it
// None needs a hook: they read and write a creature's statuses (creatures.apply, clearStatus), its windup (creatures.unwind and its
// own `cancel`), the stun (stun.add), the Soul Brush's load (its `fill` and grade) and the weather (`here`), each by its contract.
//
// Prior art: Chrono Trigger's combined techs and Into the Breach's ordered turn (the Fuse: afflictions set off on your beat); Breath of
// the Wild's chemistry and Super Mario Sunshine's FLUDD refilled from the world (Catch the Weather); Katamari and billiards' combination
// shot (Relay); Pokemon's type chart walked as a cycle and Persona's Technical (Walk the Cycle: one ailment made the next's opening);
// Pokemon's Disable and Final Fantasy's Silence (A Seal on a Creature: one of its moves outlawed a while).
//
//   const D = new DepthRungs(run)   .press(id) -> bool   .onStrike(c, cause, power)   .update(dt)
//   events (through the run): domain.art.fire { art: 'fuse' | 'walkCycle' | 'sealCreature' | 'relay' | 'catchWeather', ... },
//   domain.art.end { art: 'fuse' | 'sealCreature', why }, domain.art.refuse { art, why }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TYPES, TRUMPS } from '../../progress/combat/types.js';
import { BOTTLES } from '../../progress/brushload.js';
import { DOMAIN_ARTS } from '../../progress/domainarts.js';

const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
/** The afflictions the depth rungs move: the four a damage type builds (types.js), the stun aside (it is the stun's: stun.js). */
const AFFLICTIONS = Object.values(TYPES).map((T) => T.builds).filter((s) => s !== 'stun');
/** Each type's status, and the status of the type it trumps (Walk the Cycle's step). */
const STATUS_OF = Object.fromEntries(Object.values(TYPES).map((T) => [T.id, T.builds]));
const TYPE_OF_STATUS = Object.fromEntries(Object.values(TYPES).map((T) => [T.builds, T.id]));
const NEXT = Object.fromEntries(AFFLICTIONS.map((s) => [s, STATUS_OF[TRUMPS[TYPE_OF_STATUS[s]]]]));
/** Ours: a FOE (a Well's keeper, class 2 and up) holds its own rule: the seal is refused there (its fight is authored as a timeline). */
const FOE_CLASS = 2;

export class DepthRungs {
  constructor(run) {
    this.run = run;
    this.fused = null; // (the Fuse: { c, until, held: { status: { t, k } }, h })
    this.sealed = []; // (the Seal: { c, kind, until, h })
    this.relayAt = null; // (Relay's chain: { done: Set, n, until })
    this.caught = 0; // (Catch the Weather: Lachryma caught since it last said so)
  }
  get game() { return this.run.game; }
  get now() { return this.run.now; }
  does(id) { return this.run.does(id); }
  play(name, ctx) { return this.run.play(name, ctx); }
  /** The target: the lock-on's creature if it is a foe in reach, else the nearest. */
  target(reach, test = () => true) {
    const g = this.game, L = g.lock?.target?.ref, P = g.player;
    if (L?.alive && !L.ally && !L.training && L.pos && P && L.pos.distanceTo(P.pos) <= reach && test(L)) return L;
    let best = null, bd = reach;
    for (const c of g.creatures?.list || []) { if (!c.alive || c.ally || c.training || !c.pos || !test(c)) continue; const d = c.pos.distanceTo(P.pos); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  afflictions(c) { return AFFLICTIONS.filter((s) => (c?.status?.get(s)?.t ?? 0) > 0); }

  /** The art key, for the three actions at 60. False refuses (the run refunds the cost). */
  press(id) {
    if (id === 'fuse') return this.fuseGo();
    if (id === 'walkCycle') return this.cycleGo();
    if (id === 'sealCreature') return this.sealGo();
    return false;
  }

  // ---- THE FUSE (Ouranurgy 60) -----------------------------------------------------
  fuseGo() {
    const D = this.does('fuse'), c = this.target(D.reach); if (!c) return this.run.refuse('fuse', 'none') && false;
    const h = this.play('domain.ouranurgy.hold', { pos: c.pos.clone().add(UP), scale: 0.45, follow: (hh) => { hh.pos.set(c.pos.x, c.pos.y + 1.2, c.pos.z); return !!this.fused && c.alive; } });
    this.fused = { c, until: this.now + D.window, held: {}, h };
    this.play('domain.ouranurgy.cast', { pos: c.pos.clone().add(UP) });
    this.run.fire('fuse', { kind: c.kind, window: D.window });
    return true;
  }
  /** Each frame while fused: an affliction on it is taken off and kept (its time left and strength), never spent. */
  fuseHold() {
    const F = this.fused; if (!F) return;
    const c = F.c, g = this.game;
    if (!c.alive) { F.h?.stop?.(); this.fused = null; g.events?.emit('domain.art.end', { art: 'fuse', why: 'gone', by: 'courier' }); return; }
    for (const s of this.afflictions(c)) {
      const was = c.status.get(s), H = F.held[s];
      F.held[s] = { t: Math.max(H?.t ?? 0, was.t), k: Math.max(H?.k ?? 0, was.k) };
      g.creatures.clearStatus?.(c, s); // (held unspent: the creature does not feel it until the fuse goes)
    }
    if (this.now >= F.until) this.fuseRelease('time');
  }
  /** Set them all off at once: each `mult` as long when you chose the beat, as they were when the window ran out. A fuse set off into a
   *  break (the creature stunned) with two or more pays most (DOMAINS.md 3.1: fed by a fuse released into a break). */
  fuseRelease(why) {
    const F = this.fused; if (!F) return; this.fused = null; F.h?.stop?.();
    (this.run.coolUntil ||= {}).fuse = this.now + (DOMAIN_ARTS.fuse.cooldown || 0); // (its cooldown from the release: never a fuse kept lit)
    const g = this.game, c = F.c, D = this.does('fuse'), mult = why === 'chosen' ? D.mult : 1, names = Object.keys(F.held);
    for (const s of names) {
      const { t, k } = F.held[s], dur = t * mult;
      c.status.set(s, { t: dur, dur, k }); // (set straight: it passed the creature's resistance and its mind's hold when it first landed, so it is never scaled twice)
      g.events?.emit('creature.status', { kind: c.kind, status: s, dur: +dur.toFixed(1), fused: true, by: 'courier' });
    }
    if (names.length && c.pos) this.play('domain.ouranurgy.hit', { pos: c.pos.clone().add(UP), power: Math.min(3, names.length) });
    g.events?.emit('domain.art.end', { art: 'fuse', why, statuses: names, n: names.length, by: 'courier' });
    const broken = !!g.stun?.stunned?.(c);
    this.run.arts?.used('fuse', !names.length ? 0.1 : why !== 'chosen' ? 0.3 : Math.min(1, 0.4 + 0.2 * names.length + (broken ? 0.3 : 0)));
  }

  // ---- WALK THE CYCLE (Alteration 60) --------------------------------------------
  cycleGo() {
    const D = this.does('walkCycle'), c = this.target(D.reach, (x) => this.afflictions(x).length > 0); if (!c) return this.run.refuse('walkCycle', 'bare') && false;
    const g = this.game, turned = [];
    for (const s of this.afflictions(c)) {
      const was = c.status.get(s), to = NEXT[s]; g.creatures.clearStatus?.(c, s);
      if (to === 'stun') { // (Delirium trumps Impact: confusion walked into a stun, the shell's meter filled as Shatter fills it)
        const st = g.stun; if (st && !st.stunned(c)) st.add(c, (1 - st.meter(c)) * (c.poise ?? 1) + 0.01, { by: 'courier', cause: 'cycle' });
      } else {
        const dur = Math.min(was.t, TYPES[TYPE_OF_STATUS[to]]?.buildDur ?? was.t); // (the kind changed, never time added)
        const H = c.status.get(to); c.status.set(to, { t: Math.max(dur, H?.t ?? 0), dur, k: Math.max(was.k, H?.k ?? 0) });
        g.events?.emit('creature.status', { kind: c.kind, status: to, dur: +dur.toFixed(1), cycled: true, by: 'courier' });
      }
      turned.push([s, to]);
    }
    if (c.pos) { this.play('domain.alteration.cast', { pos: c.pos.clone().add(UP) }); this.play('domain.alteration.hit', { pos: c.pos.clone().add(UP), scale: 0.6 }); }
    this.run.fire('walkCycle', { kind: c.kind, turned });
    this.run.arts?.used('walkCycle', Math.min(1, 0.4 + 0.3 * turned.length + (turned.some(([, t]) => t === 'stun') ? 0.2 : 0)));
    return true;
  }

  // ---- A SEAL ON A CREATURE (Spellscription 60) -----------------------------------
  sealGo() {
    const D = this.does('sealCreature'), c = this.target(D.reach, (x) => !!x.windup); if (!c) return this.run.refuse('sealCreature', 'still') && false;
    if ((c.cls ?? 1) >= FOE_CLASS) { this.game.glyphs?.pop?.('ward', c.pos.clone().add(UP), { color: 0xffffff, size: 0.7, life: 0.7, float: 0.25, burst: true, ring: true }); return this.run.refuse('sealCreature', 'foe') && false; }
    const kind = c.windup.kind;
    this.sealed = this.sealed.filter((S) => S.c !== c || (S.h?.stop?.(), false)); // (one seal a creature: the newest rule)
    const h = this.play('domain.spellscription.hold', { pos: c.pos.clone().add(UP), scale: 0.4, follow: (hh) => { hh.pos.set(c.pos.x, c.pos.y + 1.5, c.pos.z); return c.alive && this.sealed.some((S) => S.c === c); } });
    this.sealed.push({ c, kind, until: this.now + D.dur, h, broke: 0 });
    this.play('domain.spellscription.cast', { pos: c.pos.clone(), scale: 0.6 });
    this.breakOff(c);
    this.run.fire('sealCreature', { kind: c.kind, blow: kind, dur: D.dur });
    return true;
  }
  breakOff(c) { c.cancel?.('sealed'); this.game.creatures?.unwind?.(c, 'sealed'); if (c.pos) this.play('domain.spellscription.hit', { pos: c.pos.clone().add(UP), scale: 0.5 }); }
  sealTick() {
    for (let i = this.sealed.length - 1; i >= 0; i--) {
      const S = this.sealed[i], c = S.c;
      if (!c.alive || this.now >= S.until) { this.sealed.splice(i, 1); S.h?.stop?.(); this.game.events?.emit('domain.art.end', { art: 'sealCreature', why: c.alive ? 'time' : 'gone', broke: S.broke, by: 'courier' }); this.run.arts?.used('sealCreature', Math.min(1, 0.3 + 0.25 * S.broke)); continue; }
      if (c.windup?.kind === S.kind) { this.breakOff(c); S.broke++; this.run.fire('sealCreature', { kind: c.kind, blow: S.kind, broke: S.broke }); }
    }
  }

  // ---- RELAY (Psychokinesis 60): the strike's own hook, run.onStrike ------------------
  onStrike(c, cause, power) {
    if (!this.run.on('relay') || !c?.pos || c.training) return;
    const D = this.does('relay'), relayed = cause === 'relay';
    if (!relayed && cause !== 'thrown' && power < D.minPower) return;
    let R = this.relayAt;
    if (!relayed || !R || this.now > R.until) R = this.relayAt = { done: new Set([c]), n: 0, until: this.now + 1, dir: null };
    else R.done.add(c);
    if (R.n >= D.links) return this.relayEnd();
    const P = this.game.player, dir = R.dir || _a.copy(c.pos).sub(P.pos).setY(0); if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1); dir.normalize();
    let best = null, bd = D.reach;
    for (const b of this.game.creatures?.near?.(c.pos, D.reach) || []) {
      if (R.done.has(b) || !b.alive || b.ally || b.training || b.aberrant || !b.pos) continue;
      const to = _b.copy(b.pos).sub(c.pos).setY(0), d = to.length(); if (d < 1e-3 || to.dot(dir) / d < D.cone) continue; // (behind it, along the force's line)
      if (d < bd) { bd = d; best = b; }
    }
    if (!best) return this.relayEnd();
    const next = best, k = power * D.keep, along = _b.copy(next.pos).sub(c.pos).setY(0).normalize().clone();
    R.n++; R.until = this.now + 1; R.dir = along.clone();
    queueMicrotask(() => { // (after the first blow lands: the struck body passes it on)
      if (!next.alive) return this.relayEnd();
      this.play('domain.psychokinesis.cast', { pos: c.pos.clone().add(UP), dir: along });
      this.game.creatures?.strike?.(next, next.pos.clone().add(UP), along.clone().setY(0.35).normalize(), k, 'relay', 'courier', null, 'impact');
      if (this.relayAt === R && (R.n >= D.links || !this.relayAt)) this.relayEnd();
    });
  }
  relayEnd() {
    const R = this.relayAt; if (!R) return; this.relayAt = null;
    if (!R.n) return;
    this.run.fire('relay', { links: R.n });
    this.run.arts?.used('relay', Math.min(1, 0.3 + 0.25 * R.n));
  }

  // ---- CATCH THE WEATHER (Manifestation 60) ---------------------------------------
  catchTick(dt) {
    const g = this.game, P = g.player; if (!this.run.on('catchWeather') || !P) return;
    const load = P.techs?.get?.('soulbrush')?.load, b = load?.bottle; if (!b) return;
    const w = g.weather?.here?.(P.pos), D = this.does('catchWeather');
    if (!w?.aspect || w.exposure !== 'open' || (w.strength ?? 0) < D.min || !load.known?.(w.aspect)) return;
    if (load.held > 0.5 && load.grade !== w.aspect) return; // (a Bottle holds one feeling: what it holds is kept, never mixed)
    if (load.held >= BOTTLES[b].capacity - 0.01) return;
    if (load.grade !== w.aspect) { load.grade = w.aspect; load.save?.(); }
    const got = load.fill(D.rate * w.strength * dt); this.caught += got;
    if (this.caught >= D.say) { // (said and paid a Bottle's sip at a time, never every frame)
      this.run.fire('catchWeather', { aspect: w.aspect, lachryma: Math.round(this.caught) });
      this.run.arts?.used('catchWeather', Math.min(1, 0.3 + w.strength * 0.6));
      this.play('domain.manifestation.hit', { pos: P.pos.clone().add(UP), scale: 0.3 });
      this.caught = 0;
    }
  }

  update(dt) {
    this.fuseHold();
    this.sealTick();
    this.catchTick(dt);
    if (this.relayAt && this.now > this.relayAt.until) this.relayEnd();
  }
}
