# From Espada: the aberrant Lantern Wisp's words (ABERRANTS.md 3; your note of 2026-10-28)

Each line was checked against ABERRANTS.md 4: none of them says what the secret is before it is done. The half tell names only what
you can see. The end line names the cause, but only once the secret is done.

| where | key | words |
| --- | --- | --- |
| foeskills.js | `kindle.label` | `Kindle` (stands: plain English) |
| foeskills.js | `kindle.line` | `Burns up to 3 Dread gems on your half into embers` (the cap as a stat) |
| tracking/duel.js `FOE_LINE` (if Kindle gets one) | `kindle` | `` `The Lantern Wisp kindles ${e.n} of your Dread gems into embers.` `` |
| tracking/duel.js `SECRET_LINE.snuff` | `half` | `The Wisp's lantern gutters.` |
| tracking/duel.js `SECRET_LINE.snuff` | `done` | `You starve the lantern of Dread. It gutters out, and the Lantern Wisp with it.` |
| duelachievements.js | `du9` name | `Lights Out` (stands: plain English, and it is the death itself) |
| duelachievements.js | `du9` words | `Win a puzzle duel against an aberrant Lantern Wisp with the Line short of its wall.` |
| tracking/duel.js, the Line's win against the Wisp | (a line for the Wisp's ruleset in place of the shared one) | `Its lantern cracks and the flame scatters. You win the duel; the Lantern Wisp is mended.` |

Why each one reads as it does:
- **Kindle** may name Dread. It wakes only once the lantern is half spent, so anyone who sees its tooltip is already halfway there.
- **The half tell** says "the Wisp's lantern" rather than "the lantern", so it names the thing whole. "Gutters" is what a flame does
  short of fuel. It is a hint for anyone who already wonders, and noise for anyone who doesn't.
- **The end line** names the cause only after the fact, so the reader learns it at the moment it can't spoil anything. "Starve" is
  your fuel rule in one word.
- **du9** says only what you did, ending it with the Line short of its wall. It keeps "a puzzle duel" in full and uses the board's
  own word, "wall", rather than "home".
- **The Line's death** follows Calissa's look as you wrote it (the lantern cracks, the flame scatters). It keeps "mended" from the
  shared line, so both deaths read as one fight.

Delete once pasted.
