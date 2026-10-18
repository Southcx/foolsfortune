// ---------------------------------------------------------------------------------------
// STUN: a mind knocked out of itself for a moment. Anything that can be stunned has a POISE meter: dazzling it (the Veritome's
// flash), bludgeoning it, catching it mid-leap fills the meter; left alone, it drains; full, the thing is STUNNED for a few seconds:
// it stops, sways, and gold stars wheel round its head (vfx/dizzy.js). A stunned thing is VULNERABLE: the abilities a thinking
// opponent would see coming and refuse work fully on it (the Sondelass's zandatsu, the Veritome's reprogramming), and it takes more
// from every blow. Coming to, it is IMMUNE a while (its meter fills at a quarter of the rate): no one is stunned twice in a row.
// DEPTH (docs/plans/STUN-DEPTH.md, the owner, 2026-10-18): a first stun is DAZED; blows while it is down keep filling the meter (faster,
// and it does not drain), and a full meter takes it a depth deeper, to STUNNED and OUT COLD, each resetting its clock. The finishers read
// the depth (`depth(t)`): every one open from dazed, each at its best out cold. The numbers are knobs (T.stun, core/config.js).
//
// One module for every kind of thing. A creature (creatures.js) is stunned through its statuses (the status 'stun'; the creature
// decides what it looks like: the jelly slumps and wobbles); a clapperjar through its own stun (clappers.js). Whatever else can be
// stunned one day adds a case to `knock` and to `isStunned`, and nothing that stuns needs to know.
//
//   game.stun.add(target, amount, { by, cause })   (amount 1 = a full meter for an ordinary thing: its `poise` divides it)
//   game.stun.stunned(target)   game.stun.vulnerable(target)   game.stun.hold(target, seconds)  (keep it down: being reprogrammed)
//   game.stun.meter(target) -> 0..1   game.stun.depth(target) -> 0 (not stunned) | 1 dazed | 2 stunned | 3 out cold   .share(target) -> its clock left, 0..1   .finisher(target) -> the depth a finisher reads (asleep, held, melted: 2)
//   a target may carry: poise (default 1: higher is harder to stun), stunFor (scales the depths' lengths against 4.5 s; 0: never), head(out)
//
// Prior art: the stun and stagger of the action game: Monster Hunter's KO (blows to the head fill a hidden meter; a knocked-out
// monster is open to a mount or a big attack), Sekiro's posture (fills with pressure, drains with rest, breaks into a deathblow), the
// stagger of Final Fantasy XIII and VII Remake (staggered, everything does more), and Devil May Cry's and Bayonetta's "Witch Time" of a
// dazed enemy. And the camera flash that stuns: Fatal Frame's Camera Obscura, Luigi's Mansion's Poltergust flashlight.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { st } from './creatures.js';
import { Dizzy } from '../vfx/dizzy.js';
import { T } from '../core/config.js';

const K = () => T.stun; // (read live: the tuning panel moves them)

export class Stun {
  constructor(game) {
    this.game = game;
    this.m = new Map(); // target -> { v, idle, immune, depth, len }
    this.dizzy = new Dizzy(game.scene);
  }

  state(t) { let s = this.m.get(t); if (!s) this.m.set(t, (s = { v: 0, idle: 0, immune: 0, depth: 0, len: 0 })); return s; }
  meter(t) { return this.m.get(t)?.v ?? 0; }

  /** Fill its meter; true if that stunned it. */
  add(t, amount, { by = 'courier', cause = 'flash' } = {}) {
    if (!t?.alive || t.ally || amount <= 0) return false;
    const s = this.state(t), down = this.stunned(t);
    if (down && s.depth >= K().depths.length) { this.hold(t, 0.4); return false; } // (out cold: kept down a little longer, no deeper)
    s.v += (amount / (t.poise ?? 1)) * (down ? K().downFill : s.immune > 0 ? K().immuneFill : 1);
    s.idle = 0;
    this.game.events?.emit('stun.build', { kind: kindOf(t), meter: +Math.min(1, s.v).toFixed(2), depth: down ? s.depth : 0, by, cause });
    if (s.v >= 1) { s.v = 0; this.knock(t, down ? s.depth + 1 : 1, by, cause); return true; }
    return false;
  }

  /** Down to `depth` (1 dazed .. 3 out cold): its clock reset to that depth's length (a kind's own `stunFor` scales it), never shorter. */
  knock(t, depth, by, cause) {
    const g = this.game, s = this.state(t), D = K().depths[Math.min(depth, K().depths.length) - 1];
    const dur = t.stunFor === 0 ? 0 : D.len * Math.max(1, (t.stunFor ?? 4.5) / 4.5); // (a long-stunned kind is down longer; a short one never under the depth's length; 0: never stunned, Dovina's ruling)
    if (!(dur > 0)) return;
    if (this.stunned(t)) this.hold(t, dur); // (deeper: the clock reset, the status kept)
    else if (t.type === 'creature') g.creatures.apply(t, 'stun', dur, 1, by);
    else if (t.type === 'clapper') g.clappers.stun(t, dur, g.shells?.glowOutline, g.shells?.xray);
    else return;
    s.depth = Math.min(depth, K().depths.length); s.len = dur;
    s.immune = dur + D.immune;
    const p = this.head(t, new THREE.Vector3()); p.y += 0.25;
    g.glyphs?.pop('star', p, { color: 0xffd76a, size: 0.7, life: 0.9, burst: true, ring: true });
    g.ai?.stimuli.emit('pain', t.pos, { radius: 14, strength: 0.8, by, source: t });
    g.events?.emit('creature.stun', { kind: kindOf(t), seconds: +dur.toFixed(1), depth: s.depth, by, cause });
  }

  stunned(t) { return t?.type === 'creature' ? st(t, 'stun') > 0 : t?.type === 'clapper' ? t.alive && t.state === 'stunned' : false; }
  /** Open to what a thinking thing would refuse: stunned, asleep, held, melted. */
  vulnerable(t) { return this.stunned(t) || (t?.type === 'creature' && (st(t, 'sleep') > 0 || st(t, 'halt') > 0 || st(t, 'melt') > 0)); }
  /** Blows on a stunned thing land harder, the deeper the harder. */
  bonus(t) { return this.stunned(t) ? (K().depths[this.depth(t) - 1]?.bonus ?? K().depths[0].bonus) : 1; }
  /** How deep it is down: 0 not stunned, 1 dazed, 2 stunned, 3 out cold (a stun from elsewhere, a macro or a trap, counts as dazed). */
  depth(t) { return this.stunned(t) ? Math.max(1, this.m.get(t)?.depth || 0) : 0; }
  /** The depth the finishers read: asleep, held or melted with no stun counts as stunned (2; Dovina's ruling, STUN-DEPTH.md 3). */
  finisher(t) { return this.depth(t) || (this.vulnerable(t) ? 2 : 0); }
  /** Its clock left over its depth's length, 0..1 (the Lockheart's clean hold reads it). */
  share(t) {
    if (!this.stunned(t)) return 0;
    const len = this.m.get(t)?.len || (t.stunFor ?? 4.5), left = t.type === 'creature' ? t.status.get('stun')?.t ?? 0 : t.stunT ?? 0;
    return Math.min(1, left / Math.max(0.1, len));
  }
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
      const down = this.stunned(t);
      if (!down && s.depth) s.depth = 0; // (come to: the next stun starts dazed again)
      if (s.idle > K().drainAfter && !down) s.v = Math.max(0, s.v - K().drain * dt); // (it does not drain while it is down)
      // (the clapperjar wears its own stars when stunned: only the build is drawn for it)
      if ((down && t.type !== 'clapper') || s.v > 0.02) this.dizzy.set(t, this.head(t, new THREE.Vector3()), { build: s.v, stunned: down, depth: down ? this.depth(t) : 0, size: t.type === 'clapper' ? 0.7 : 1 });
      if (!down && s.v <= 0 && s.immune <= 0) this.m.delete(t);
    }
    this.dizzy.update(dt);
  }

  clear() { this.m.clear(); }
}

const kindOf = (t) => (t?.type === 'clapper' ? 'clapperjar' : t?.kind ?? t?.type ?? 'thing');
