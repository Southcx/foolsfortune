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
// stage.js relay), as adrift does. THE FALL: once the boss is down (and no boss is still to come in the peak), the peak is cut so the
// release follows the next bar line by one bar (the swing's): what was laid past it in the peak is let go, what follows moves back.
// THE MUSIC (Wanda's, music/legs.js setBoss): `stage.boss = { k, enraged, down }` from the peak's first bar while the boss stands, `down`
// from its fall to the release; her cue loops the peak while it stands and lets go into the release on the bar after the fall. The
// stage never follows a cue that no longer agrees with its length (stage.js clock). `rail.hold { bars, enraged, by }` for the log. The
// fall is felt (stage.js feel('fall'): a freeze, then a slow, and the shake).
//
// THE MAELSTROM: its peak is the arena (railpath.js `arena`, laid by distance in laps of whole bars: arenaLaid), so it is held a lap at a
// time, decided a bar before the arena's exit begins (the line flown stays as it was: a lap added ahead of the ship before its exit
// changes nothing behind it); at Charybdis's fall the whole laps still ahead are taken away, and `down` is said two bars before the
// release (the ship must come round to the exit first). Dovina's ruling, RAIL-FLOW.md 9.
//
// Prior art: Star Fox 64's boss rooms (the music loops until the boss falls), iMUSE's horizontal resequencing (a section looped on the
// bar line until the game moves on), and every shmup boss's "rage" timer (Cave's: a boss quickens, it never leaves).
//
//   const H = new BossHold(trip)   H.update(k, layout, leg, bar)   H.reset()   HOLD = { bars, before }
// ---------------------------------------------------------------------------------------
import { BOSS } from '../../progress/rail/setpieces.js';
import { SWING_CLEAR } from '../../progress/rail/legs.js';
import { ROSTER } from '../../progress/rail/showcase.js';
import { BAR_S } from '../../progress/rail/crossing.js';

/** The phrase a held peak is lengthened by (bars), and how far before the peak's end its window closes (the swing's clear bars). */
export const HOLD = { bars: BOSS.hold?.bars ?? 8, before: BOSS.hold?.before ?? SWING_CLEAR };

export class BossHold {
  constructor(trip) { this.trip = trip; this.st = trip.st; this.reset(); }
  reset() { this.t0 = new Map(); this.done = new Set(); }

  /** A boss still to come in leg `k`'s peak (a held foe not yet let in: the bounty's gunship after its heavy). */
  toCome(k, now) {
    const R = this.trip.runner; if (this.trip.k !== k || !R.plan) return false;
    for (let i = R.next; i < R.plan.events.length; i++) { const e = R.plan.events[i]; if (e.bar > now && e.phase === 'peak' && e.wave && ROSTER[e.wave.role]?.moves?.until === 'beaten') return true; }
    return false;
  }
  /** Whether leg `k`'s boss still stands. */
  standing(k, leg) {
    const S = this.st, P = S.piece;
    if (leg.type === 'maelstrom') { const C = S.charybdis; return !!(C?.active && C.foe?.alive && !C.beaten); }
    if (P && P.leg?.k === k && P.beaten === false) return true;
    for (const f of S.waves?.foes || []) if (f.alive && f.boss) return true;
    return false;
  }

  update(k, L, leg, bar) {
    const plan = leg?.plan; if (!plan || L?.peak == null || L.release == null || L.release <= L.peak) return;
    const S = this.st, B = S.stage.boss;
    if (bar < L.peak) return;
    if (bar >= L.release) { if (B?.k === k) S.stage.boss = null; return; } // (the release: the music has let go)
    const mael = leg.type === 'maelstrom', arena = mael ? (S.arenas || []).find((t) => t.k === k && t.lapBars) : null;
    if (mael && !arena) return; // (an arena laid the old way is not held)
    if (!this.t0.has(k)) this.t0.set(k, S.t);
    const standing = this.standing(k, leg), Ebars = arena ? arena.E / (BAR_S * S.rail.speed) : 0;
    if (standing) { if (!B || B.k !== k || B.enraged !== this.enraged(k)) S.stage.boss = { k, enraged: this.enraged(k), down: false }; }
    else if (B?.k === k && !B.down && !B.fell && !this.toCome(k, bar - L.at)) {
      S.feel?.('fall'); // (its weight: a freeze, then a slow, and the shake: RAIL-STANDARDS.md 1)
      if (!mael) { S.stage.boss = { ...B, down: true }; this.cut(k, L, plan, bar - L.at); return; } // (it fell: the release after the next bar line)
      S.stage.boss = { ...B, fell: true }; // (the maelstrom: the laps still ahead taken away, a bar's margin kept)
      const peak = plan.phases.find((p) => p.id === 'peak'), m = Math.floor((peak.to - Ebars - (bar - L.at) - 1) / arena.lapBars);
      if (m > 0) this.cut(k, L, plan, bar - L.at, peak.to - m * arena.lapBars);
      return;
    }
    if (mael && B?.k === k && B.fell && !B.down && bar >= L.release - 2) S.stage.boss = { ...B, down: true };
    const n = mael ? arena.lapBars : HOLD.bars, edge = mael ? L.release - Ebars : L.release - HOLD.before; // (the window's end: the arena's exit, else the last bar patterns may fall in before the swing)
    if (!standing || bar < edge - 1 || bar >= edge || this.done.has(`${k}:${edge}`)) return;
    this.done.add(`${k}:${edge}`);
    this.extend(k, L, plan, edge - L.at, bar - L.at, n);
  }
  enraged(k) { return this.st.t - (this.t0.get(k) ?? this.st.t) > BOSS.enrage; }

  /** The peak cut at its boss's fall: the release from the bar after the next bar line (the swing takes that bar), the peak's events
   *  past it let go, what follows moved back by as much. Nothing if the peak ends sooner than that anyway. */
  cut(k, L, plan, now, to = Math.ceil(now) + 1) {
    const T = this.trip, S = this.st, R = T.runner, live = T.k === k ? R.plan : null, peak = plan.phases.find((p) => p.id === 'peak');
    const d = (peak?.to ?? to) - to; if (d <= 0) return;
    if (live) {
      live.events = live.events.filter((e) => !(e.bar > now && e.bar >= to && e.bar < to + d && e.phase === 'peak'));
      for (const e of live.events) if (e.bar >= to + d) e.bar -= d;
      R.next = live.events.findIndex((e) => e.bar > now); if (R.next < 0) R.next = live.events.length;
      for (const Q of R.queues.values()) { Q.list = Q.list.filter((e) => !(e.bar >= to && e.bar < to + d)); for (const e of Q.list) if (e.bar >= to + d) e.bar -= d; }
    }
    for (const p of new Set([plan, live].filter(Boolean))) {
      for (const ph of p.phases) { if (ph.id === 'peak') ph.to -= d; else if (ph.from >= to + d) { ph.from -= d; ph.to -= d; } }
      p.bars -= d; p.swings = (p.swings || []).map((w) => (w >= to + d ? w - d : w));
    }
    T.legs[k].phases = { ...T.legs[k].phases, peak: (T.legs[k].phases?.peak ?? 0) - d };
    if (S.piece?.leg?.k === k) S.piece.leg.to -= d;
    T.layOut(); S.relay?.();
    S.game.events?.emit('rail.hold', { bars: -d, enraged: false, by: 'courier' });
  }
  /** The peak lengthened by a phrase at `rel0` (leg bars): what follows moves on, the phrase before is laid again in the gap. */
  extend(k, L, plan, rel0, now, n = HOLD.bars) {
    const T = this.trip, S = this.st, from = rel0 - n, enraged = this.enraged(k), q = enraged ? BOSS.quicken : 1;
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
