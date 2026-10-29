# From Espada: the aberrant slip jelly's words, and learned skills (your d97739ac; ABERRANTS.md 5, 8)

Each line was read against ABERRANTS.md 4: nothing says the secret before it is done. The half's tell names only what you can see,
the jelly shrinking. "Slime" is the junk's plain name throughout, as the glossary has it.

| where | key | words |
| --- | --- | --- |
| foeskills.js | `spew.label` | `Spew` (stands) |
| foeskills.js | `spew.line` | `Throws a heap of slime onto your half` (stands) |
| foeskills.js | `harden.label` | `Harden` (stands) |
| foeskills.js | `harden.line` | `Sets up to 4 slime on your half into plain junk` (stands) |
| tracking/duel.js `FOE_LINE.spew` | | `` `The slip jelly spews ${e.n} ${e.n === 1 ? 'piece' : 'pieces'} of slime onto your half.` `` |
| tracking/duel.js `FOE_LINE.harden` | | `` `The slip jelly hardens ${e.n} of its slime into plain junk.` `` (the skill's own verb, so the log and the badge say one word) |
| secrets.js | `dissolve.of` | `The slip jelly` (a common noun: "slip jelly" is lowercase in the glossary, unlike the Lantern Wisp's name; the slot reads "The slip jelly's secret") |
| secrets.js | `dissolve.label` | `Dissolve the slip jelly` (the thing named whole, as "Snuff the lantern" names its lantern) |
| secrets.js | `dissolve.line` | `Let its slime pile up on your half, Transmute the slime, and clear 9 of those gems in one turn; with nothing left to hold it together, the slip jelly falls apart` (the need as a stat) |
| tracking/duel.js `SECRET_LINE.dissolve` | `half` | `The slip jelly sags, thin from all it has thrown.` |
| tracking/duel.js `SECRET_LINE.dissolve` | `done` | `You turn its own slime against it. With nothing left to hold it together, the slip jelly falls apart.` |
| tracking/duel.js `LINE_DEATH.slipjelly` | | `The slip jelly bursts into its slime. You win the duel; it is mended.` |
| powers.js | `kindle.line` (learned) | `Lights every junk in a row or column of your half into an ember, and each cools into a gem at your turn's end` |
| tracking/duel.js `duel.learn` | | `` `You learn ${label} from the aberrant ${who}. It is yours to cast in a duel now.` `` (Kindle: "You learn Kindle from the aberrant Lantern Wisp. It is yours to cast in a duel now.") |
| learned.js | `kindle.hint` | `Learned from the aberrant Lantern Wisp.` (stands) |
| strawmanstrings.js lectern row (Petra's) | label / line | `Slip jelly` / `An aberrant slip jelly's board: slime, and a lot of it.` |

Why these lines read as they do:
- **The half tell** says what you see: the jelly gets thinner as it throws. It is a hint for anyone who is already counting the slime,
  and plain weather for everyone else. Your draft, "its slime piled on your half", pointed at the pile itself, which is the secret's
  measure, so I took it out.
- **`duel.learn`** says "cast", because a learned skill is cast as a power, and "in a duel", because it is the PvE duel's power and never
  the world's. The `${who}` is the creature's name as the log says it mid-sentence (lowercase "slip jelly", "Lantern Wisp" as named).
- **The lectern row** tells you what the board brings without saying how to beat it. "A lot of it" is South's "a LOT of junk".
- **The Line's death** follows the look you wrote (the jelly bursts into its slime) and keeps "mended" from the Wisp's line, so every
  aberrant ends the same way.

Delete once pasted.
