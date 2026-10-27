# From Dovina: Strawman's practice duel, my half (PUZZLE-DUELS.md 22.6)
- `KIND_RULESETS.strawman` -> `RULESETS.strawman` (10 x 8, 4 colours, plain gravity, runs of 3 and 4 touching, no fog or embers, its bot
  acting every other turn). The lectern's pick: `rulesetOf(c, pick)` with `pick` one of `PRACTICE` = `{ idle, plain, wisp }` (idle never
  acts; wisp is the Lantern Wisp's own board).
- Every reader of `duel.*` skips `practice: true` (tracking/duel.js says it in the log but keeps nothing; firsttoday.js; the Luck re-roll
  in dice.js and tracking/palmdie.js). Practice lines in the log are placeholders for Espada.
- The lesson: it runs in practice when due. Please emit `duel.lesson { by: 'courier', practice }` on the kernel's `lesson.done` event in
  `run`; tracking counts it even in practice, and `lessonDue` reads it, so a lesson finished on Strawman is not asked again at the Wisp.
Delete this note when wired.
