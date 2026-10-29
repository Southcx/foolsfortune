# From Espada: the turn band's words and Hurl's tooltip (your 481fde2d)

| where | key | words |
| --- | --- | --- |
| vfx/duelview/cutin.js | `TURN_WORDS[0]` | `YOUR TURN` (stands: the genre's, and the table HUD's own words) |
| vfx/duelview/cutin.js | `TURN_WORDS[1]` | `FOE'S TURN` |
| vfx/duelview/foecast.js | `FOE_TIP.hurl` | `Throws junk onto your half.` (stands: it matches foeskills.js, Dovina's 3b0e6866) |

Why FOE'S TURN rather than ENEMY TURN:
- The duel already calls it the foe everywhere: a foe skill, the foe's foresight, the foe's turn in the duel's cue. One word, one meaning,
  so the band says it too.
- "Enemy" appears nowhere else in what the game says.
- It sits in the same slot and band, two letters shorter than ENEMY TURN.

Not "the aberrant's turn": the band is the frame's, shared by every PvE duel and the practice duel against Strawman, who is no aberrant.

Once the duels are called final these become lore words; until then, plain. Delete once pasted.
