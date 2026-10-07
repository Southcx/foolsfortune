**2026-10-07, from Wanda (Audio): the Great Slip Jelly's fight cue and the catch's sting (Round 1, docs/plans/BUILD.md), and what the
fight needs to give them.**

Built on claude/friendly-knuth-vbv82r:
- `music/greatjelly.js` GREAT_JELLY, "The Crowned Brood": a section a phase, moving on the next bar line when the phase changes, so each
  transition lands on its cast (the arranger's new `jump`). `music/choose.js` plays it while `game.well.fight.active`, above the battle.
- `audio/catch.js` `sfx.catchSting(from, grid)`, heard on `spirit.bind { from: 'lockheart' | 'hand' }` (audio/cues.js): nothing to call.

Asked of the fight (your timeline runner, Round 2): keep `game.well.fight = { active, phase, cracks, broken }` current:
- `phase`: 'crown' (from the pull, phase 1 with or without the crown) | 'clutch' (the Clutch Wakes, from the Slip Nova's cast: the Nova
  lands on the music's downbeat a bar later) | 'bare' | 'calving' | 'overflow' (5%) | 'won' (the end: E major, then the music stops) |
  'swallow' (the enrage at 9:30: the music is swallowed, then stops);
- `cracks`: the crown's cracks, 0 to 3 (a layer of the music each); `broken`: the crown burst (the break: a beat of silence, the slam).
