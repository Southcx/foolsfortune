// ---------------------------------------------------------------------------------------
// THE MUSIC CLOCK: where the cue is as you HEAR it, in bars and beats, for anything that must land on the music (the rail's patterns
// and their tells: docs/plans/RAIL-MODULES.md 3, "on the beat, told a beat before"). One clock, read, never driven.
//   - Bars are counted from the cue's first bar (1), off the arranger's own ledger (music/arranger.js barLog), so a section's own tempo
//     or metre is honoured bar by bar.
//   - "Heard" is the audio clock less the output's latency (ctx.outputLatency + baseLatency): what the speakers are playing now, not
//     what was scheduled. A Bluetooth headset's hundred-odd ms is taken off here, once, for everyone.
//   - untilHeard(bar, beat) says how many real seconds until that moment is heard (negative: past). A pattern fires when it reaches 0
//     and shows its tell at one beat (spb) before; nothing needs to know about the audio clock.
// Prior art: Chris Wilson's "A Tale of Two Clocks" (schedule on the audio clock, read it back for the eye), Rhythm Heaven's and Crypt
// of the NecroDancer's latency calibration (the heard beat, not the scheduled one), Rez's and Thumper's bar-locked patterns.
//
//   import { musicClock } from './clock.js'   musicClock(player) -> null (no arranged cue) | { bar, beat, beats, spb, barLen, section,
//   latency, untilHeard(bar, beat = 0), barOf(beatsFromNow) }       game.music.clock() is the same
// ---------------------------------------------------------------------------------------

export function musicClock(player) {
  const A = player?.arr, L = A?.barLog;
  if (!A?.alive || A.ended || !L?.length) return null;
  const ctx = A.ctx, latency = (ctx.outputLatency || 0) + (ctx.baseLatency || 0), heard = ctx.currentTime - latency;
  let b = L[0];
  for (let i = L.length - 1; i >= 0; i--) if (L[i].t <= heard) { b = L[i]; break; }
  const barLen = b.spb * b.beats, into = heard - b.t;
  /** The audio-clock start of bar n: from the ledger when it is laid out, else extrapolated at the current bar's tempo. */
  const startOf = (n) => { const e = L.find((x) => x.n === n); return e ? e.t : b.t + (n - b.n) * barLen; };
  return {
    bar: b.n + into / barLen, beat: into / b.spb, beats: b.beats, spb: b.spb, barLen, section: b.section, latency,
    /** Real seconds until bar `bar` (whole number), beat `beat` (0-based, may be fractional) is heard; negative once past. */
    untilHeard: (bar, beat = 0) => startOf(bar) + beat * (L.find((x) => x.n === bar)?.spb ?? b.spb) - heard,
  };
}
