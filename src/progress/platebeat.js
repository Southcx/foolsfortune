// ---------------------------------------------------------------------------------------
// PLATES ON THE BEAT (G312; docs/plans/TRACK-EDITOR.md 9.1): a sun plate crossed on the race cue's beat pays more. The rule, pure: the
// music clock (music/clock.js: where the cue is as it is HEARD, latency taken off) in, a grade and a multiplier of the plate's power out.
// The plate's push is the plate's power as ever (conditions.js: the sun's); this only multiplies it, a modifier whose source you can see
// (the plate's pulse, Calissa's) and the log's line. Dark plates (no sun) stay dark: nothing to multiply. A vein lane is never graded.
// The Crucibelle player's instinct pays on the sand; the board's handling is untouched, and a miss costs nothing (the plate is what it was).
//
// Prior art: Audiosurf (the ride's score on the beat), Crypt of the NecroDancer (a move on the beat pays, and the heard beat, not the
// scheduled one, is what counts), Rhythm Heaven's on-beat grades (a perfect and a good), Rez's quantised hits.
//
//   PLATE_BEAT { perfect, good, mult: { perfect, good } }   beatGrade(clock) -> { grade: 'perfect' | 'good' | 'off', off (real s, signed), mult }
// ---------------------------------------------------------------------------------------

/** Real seconds either side of a beat that grade perfect and good, and what each multiplies the plate's push by. */
export const PLATE_BEAT = { perfect: 0.07, good: 0.14, mult: { perfect: 1.35, good: 1.15 } };

/** The grade of a plate crossed now: `clock` is game.music.clock() (null: no arranged cue, so no beat to be on). */
export function beatGrade(clock) {
  if (!clock || !(clock.spb > 0)) return { grade: 'off', off: 0, mult: 1 };
  const off = (clock.beat - Math.round(clock.beat)) * clock.spb, d = Math.abs(off);
  const grade = d <= PLATE_BEAT.perfect ? 'perfect' : d <= PLATE_BEAT.good ? 'good' : 'off';
  return { grade, off: +off.toFixed(3), mult: PLATE_BEAT.mult[grade] ?? 1 };
}
