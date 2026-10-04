// ---------------------------------------------------------------------------------------
// STUN: a mind knocked out of itself for a moment. Anything that can be stunned has a POISE meter: dazzling it (the Veritome's
// flash), bludgeoning it, catching it mid-leap fills the meter; left alone, it drains; full, the thing is STUNNED for a few seconds:
// it stops, sways, and gold stars wheel round its head (vfx/dizzy.js). A stunned thing is VULNERABLE: the abilities a thinking
// opponent would see coming and refuse work fully on it (the Sondelass's zandatsu, the Veritome's reprogramming), and it takes more
// from every blow. Coming to, it is IMMUNE a while (its meter fills at a quarter of the rate): no one is stunned twice in a row.
//
// One module for every kind of thing. A creature (creatures.js) is stunned through its statuses (the status 'stun'; the creature
// decides what it looks like: the jelly slumps and wobbles); a clapperjar through its own stun (clappers.js). Whatever else can be
// stunned one day adds a case to `knock` and to `isStunned`, and nothing that stuns needs to know.
//
//   game.stun.add(target, amount, { by, cause })   (amount 1 = a full meter for an ordinary thing: its `poise` divides it)
//   game.stun.stunned(target)   game.stun.vulnerable(target)   game.stun.hold(target, seconds)  (keep it down: being reprogrammed)
//   game.stun.meter(target) -> 0..1
//   a target may carry: poise (default 1: higher is harder to stun), stunFor (seconds, default 4.5), head(out) (where its stars go)
//
// Prior art: the stun and stagger of the action game: Monster Hunter's KO (blows to the head fill a hidden meter; a knocked-out
// monster is open to a mount or a big attack), Sekiro's posture (fills with pressure, drains with rest, breaks into a deathblow), the
// stagger of Final Fantasy XIII and VII Remake (staggered, everything does more), and Devil May Cry's and Bayonetta's "Witch Time" of a
// dazed enemy. And the camera flash that stuns: Fatal Frame's Camera Obscura, Luigi's Mansion's Poltergust flashlight.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { st } from './creatures.js';
import { Dizzy } from '../vfx/dizzy.js';

const DRAIN_AFTER = 1.4, DRAIN = 0.32, IMMUNE = 6, IMMUNE_K = 0.25, BONUS = 1.5;

export class Stun {
  constructor(game) {
    this.game = game;
    this.m = new Map(); // target -> { v, idle, immune, held }
    this.dizzy = new Dizzy(game.scene);
  }

  state(t) { let s = this.m.get(t); if (!s) this.m.set(t, (s = { v: 0, idle: 0, immune: 0, held: 0 })); return s; }
  meter(t) { return this.m.get(t)?.v ?? 0; }

  /** Fill its meter; true if that stunned it. */
  add(t, amount, { by = 'courier', cause = 'flash' } = {}) {
    if (!t?.alive || t.ally || amount <= 0) return false;
    if (this.stunned(t)) { this.hold(t, 0.4); return false; } // (a stunned thing is kept down a little longer, no more)
    const s = this.state(t);
    s.v += (amount / (t.poise ?? 1)) * (s.immune > 0 ? IMMUNE_K : 1);
    s.idle = 0;
    this.game.events?.emit('stun.build', { kind: kindOf(t), meter: +Math.min(1, s.v).toFixed(2), by, cause });
    if (s.v >= 1) { s.v = 0; this.knock(t, t.stunFor ?? 4.5, by, cause); return true; }
    return false;
  }

  knock(t, dur, by, cause) {
    const g = this.game, s = this.state(t);
    if (t.type === 'creature') g.creatures.apply(t, 'stun', dur, 1, by);
    else if (t.type === 'clapper') g.clappers.stun(t, dur, g.shells?.glowOutline, g.shells?.xray);
    else return;
    s.immune = dur + IMMUNE;
    const p = this.head(t, new THREE.Vector3()); p.y += 0.25;
    g.glyphs?.pop('star', p, { color: 0xffd76a, size: 0.7, life: 0.9, burst: true, ring: true });
    g.ai?.stimuli.emit('pain', t.pos, { radius: 14, strength: 0.8, by, source: t });
    g.events?.emit('creature.stun', { kind: kindOf(t), seconds: +dur.toFixed(1), by, cause });
  }

  stunned(t) { return t?.type === 'creature' ? st(t, 'stun') > 0 : t?.type === 'clapper' ? t.alive && t.state === 'stunned' : false; }
  /** Open to what a thinking thing would refuse: stunned, asleep, held, melted. */
  vulnerable(t) { return this.stunned(t) || (t?.type === 'creature' && (st(t, 'sleep') > 0 || st(t, 'halt') > 0 || st(t, 'melt') > 0)); }
  /** Blows on a stunned thing land harder. */
  bonus(t) { return this.stunned(t) ? BONUS : 1; }
  /** Keep it down at least `sec` more (a reprogramming in progress). */
  hold(t, sec) {
    if (!this.stunned(t)) return;
    if (t.type === 'creature') { const x = t.status.get('stun'); if (x) x.t = Math.max(x.t, sec); }
    else if (t.type === 'clapper') t.stunT = Math.max(t.stunT, sec);
  }

  head(t, out) {
    if (t.head) return out.copy(t.head());
    if (t.type === 'clapper') return out.copy(t.pos).setY(t.pos.y + 0.78);
    return out.copy(t.pos).setY(t.pos.y + (t.height ?? 1) + 0.25);
  }

  update(dt) {
    // (a creature stunned some other way (a macro, a trap) wears the stars too)
    for (const c of this.game.creatures?.list || []) if (c.alive && st(c, 'stun') > 0) this.state(c);
    for (const [t, s] of this.m) {
      if (!t.alive) { this.m.delete(t); continue; }
      s.idle += dt; s.immune = Math.max(0, s.immune - dt);
      if (s.idle > DRAIN_AFTER) s.v = Math.max(0, s.v - DRAIN * dt);
      const down = this.stunned(t);
      // (the clapperjar wears its own stars when stunned: only the build is drawn for it)
      if ((down && t.type !== 'clapper') || s.v > 0.02) this.dizzy.set(t, this.head(t, new THREE.Vector3()), { build: s.v, stunned: down, size: t.type === 'clapper' ? 0.7 : 1 });
      if (!down && s.v <= 0 && s.immune <= 0) this.m.delete(t);
    }
    this.dizzy.update(dt);
  }

  clear() { this.m.clear(); }
}

const kindOf = (t) => (t?.type === 'clapper' ? 'clapperjar' : t?.kind ?? t?.type ?? 'thing');
