// ---------------------------------------------------------------------------------------
// THE BOSS HOLD: a leg's peak held until its boss falls (the boss law: the owner, 2026-10-21, "rethink having them flee based on a time
// metric and make the player have to properly fight it out"; docs/plans/RAIL-FLOW.md 5, setpieces.js BOSS, Dovina's). A boss is the
// leg's director while unbeaten (the shoal's Conductor, the False Light, Old Nobody: their `beaten`), Charybdis in its maelstrom, or a
// peak's foe that holds until beaten (waves.js `boss`: the Drowned Light's and the bounty's heavies until their directors).
//
// HOW: one bar before the peak's last bars clear of patterns (the swing's: legs.js SWING_CLEAR), if the boss still stands, the peak is
// lengthened by a phrase (HOLD.bars): every event from there on moves on by the phrase, and the phrase before it (its patterns and
// waves, not its queue, which the stream keeps fed, nor its director) is laid again into the gap, so the fight goes on as it was going.
// Past BOSS.enrage real s from the peak's first bar the copies come BOSS.quicken apart (a third more often): a long fight quickens and
// still ends, never by leaving. The trip's layout, views and swings are laid again and the rail relaid (triprun.js layOut,
// stage.js relay), as adrift does; the cue follows the legs' phases (Wanda's, music/legs.js tripCue), and until it does the stage runs
// on its own clock rather than follow a cue that no longer agrees (stage.js clock). `stage.boss` says it for the music: { k, held,
// enraged }; `rail.hold { bars, enraged, by }` for the log.
//
// NOT YET: the maelstrom. Its peak is the arena (railpath.js `arena`: whole laps round the whirlpool, laid once), and lengthened mid-
// flight the arena's laps and ease change the path already flown (the ship would jump); so Charybdis is fought out by its parts within
// its arena and goes down at its end, until the arena can be laid open-ended (RAIL-FLOW.md 5, said to Dovina, 2026-10-21).
//
// Prior art: Star Fox 64's boss rooms (the music loops until the boss falls), iMUSE's horizontal resequencing (a section looped on the
// bar line until the game moves on), and every shmup boss's "rage" timer (Cave's: a boss quickens, it never leaves).
//
//   const H = new BossHold(trip)   H.update(k, layout, leg, bar)   H.reset()   HOLD = { bars, before }
// ---------------------------------------------------------------------------------------
import { BOSS } from '../../progress/rail/setpieces.js';
import { SWING_CLEAR } from '../../progress/rail/legs.js';

/** The phrase a held peak is lengthened by (bars), and how far before the peak's end its window closes (the swing's clear bars). */
export const HOLD = { bars: BOSS.hold?.bars ?? 8, before: BOSS.hold?.before ?? SWING_CLEAR };

export class BossHold {
  constructor(trip) { this.trip = trip; this.st = trip.st; this.reset(); }
  reset() { this.t0 = new Map(); this.done = new Set(); }

  /** Whether leg `k`'s boss still stands. */
  standing(k, leg) {
    const S = this.st, P = S.piece;
    if (leg.type === 'maelstrom') return false; // (the arena: NOT YET, above)
    if (P && P.leg?.k === k && P.beaten === false) return true;
    for (const f of S.waves?.foes || []) if (f.alive && f.boss) return true;
    return false;
  }

  update(k, L, leg, bar) {
    const plan = leg?.plan; if (!plan || L?.peak == null || L.release == null || L.release <= L.peak) return;
    if (this.st.stage.boss?.k === k && !this.standing(k, leg)) this.st.stage.boss = null; // (it fell: the music lets go)
    if (bar >= L.peak && !this.t0.has(k)) this.t0.set(k, this.st.t);
    const edge = L.release - HOLD.before; // (the window's end: the last bar patterns may fall in before the swing)
    if (bar < edge - 1 || bar >= edge || this.done.has(`${k}:${edge}`)) return;
    this.done.add(`${k}:${edge}`);
    const S = this.st, standing = this.standing(k, leg);
    S.stage.boss = standing ? { k, held: true, enraged: this.enraged(k) } : null;
    if (standing) this.extend(k, L, plan, edge - L.at, bar - L.at);
  }
  enraged(k) { return this.st.t - (this.t0.get(k) ?? this.st.t) > BOSS.enrage; }

  /** The peak lengthened by a phrase at `rel0` (leg bars): what follows moves on, the phrase before is laid again in the gap. */
  extend(k, L, plan, rel0, now) {
    const T = this.trip, S = this.st, n = HOLD.bars, from = rel0 - n, enraged = this.enraged(k), q = enraged ? BOSS.quicken : 1;
    const R = T.runner, live = T.k === k ? R.plan : null; // (what plays is the runner's own plan; the trip's is laid out from)
    if (live) {
      for (const e of live.events) if (e.bar >= rel0) e.bar += n;
      const copies = [];
      for (const e of live.events) {
        if (e.bar < from || e.bar >= rel0 || e.queue || e.director || e.flourish || !(e.pattern || e.wave)) continue;
        for (let t = (e.bar - from) * q; t < n; t += n * q) copies.push({ ...e, bar: +(rel0 + t).toFixed(3), held: true, ...(e.pattern ? { pattern: { ...e.pattern, params: { ...(e.pattern.params || {}) } } } : {}), ...(e.wave ? { wave: { ...e.wave } } : {}) });
      }
      live.events.push(...copies); live.events.sort((a, b) => a.bar - b.bar);
      R.next = live.events.findIndex((e) => e.bar > now); if (R.next < 0) R.next = live.events.length; // (what is past stays past)
      for (const Q of R.queues.values()) for (const e of Q.list) if (e.bar >= rel0) e.bar += n; // (its queues' later waves move on too)
    }
    for (const p of new Set([plan, live].filter(Boolean))) {
      for (const ph of p.phases) { if (ph.id === 'peak') ph.to += n; else if (ph.from >= rel0) { ph.from += n; ph.to += n; } }
      p.bars += n; p.swings = (p.swings || []).map((w) => (w >= rel0 ? w + n : w));
    }
    T.legs[k].phases = { ...T.legs[k].phases, peak: (T.legs[k].phases?.peak ?? 0) + n };
    if (S.piece?.leg?.k === k) S.piece.leg.to += n;
    T.layOut(); S.relay?.();
    this.st.game.events?.emit('rail.hold', { bars: n, enraged, by: 'environment' });
  }
}
