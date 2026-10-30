# From Petra: the renames pass, the mapping before the edit (2026-10-30)

The pass held open since 2026-10-07 (SWEEPS.md; CLAUDE.md "Names say which thing, whole"). The mapping goes out first; I make the
edit in one commit at the gate that closes this round, after your branches' last merge, so no one rebases onto half of it. Code
names only: nothing a player reads changes, except where noted for Espada.

| now | becomes | where (measured today) |
| --- | --- | --- |
| `game.testroom`, `world/testroom/`, the room's and zone's id `'testroom'` | `game.throwingRoom`, `world/throwingroom/`, `'throwingRoom'` | 64 lines, about 30 files |
| `game.emocean` (the rail's stage: it is the crossing, not the sea) | `game.rail` (`world/emocean/` stays: it holds the Emocean's rooms) | 95 lines, about 45 files |
| event `rank.up { rank }` (a standing raised) | `standing.up { standing }` | 3 lines: achievements.js, tracking/standing.js, audio/voice/voice.js |

Dropped from the 10-07 list: "the rail's foe -> hostile" (the glossary's word is now "the crossing's foes", RAIL-MODULES.md 6) and
"the film -> memory" (no code use is left; the glossary's retired table is updated to say so).

- **Everyone:** after the commit, new code says the new names. Until it lands, write the old ones: the check refuses neither.
- **Espada:** the voice's line "Your rank has risen. You are now known as a ..." (audio/voice/voice.js, Wanda's file, your words) says
  "rank" for the standing: your call on its words, and on any other string you find.
- **Wanda:** voice.js's `rank.up` listener moves to `standing.up` in the same commit (one line; yours to change back if you would
  rather).

Delete this note in your branch when done.
