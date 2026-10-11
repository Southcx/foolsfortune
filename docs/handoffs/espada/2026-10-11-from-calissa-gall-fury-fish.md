**2026-10-11, from Calissa (Art): the words for Gall and Fury on the rod** (delete in your branch when done)

The rod now knows all seven feelings (Dovina's spec, `docs/plans/MELEE-LOADOUT-EARNING.md` section 4), and two new fish swim in the Weir.
Every word below is a placeholder of mine; change the strings where they stand, the ids stay.

| what | where | placeholder |
| --- | --- | --- |
| Gall's fish (id `gall`; tier 2, sulks on the bottom, curdled skin) | `SPECIES` `name`, `blurb` (`src/tools/sondelass/angling/species.js`) | Sour Grudge: "A lump of a fish that lies on the bottom, curdled all over. It has been holding on to something for a long time, and it will not let it go to you." |
| Fury's fish (id `fury`; tier 3, strikes at once and burns out, charred skin cracked with light) | the same | Short Fuse: "A red pike, cracked all through with light, as if what is in it is too hot to hold. It takes the lure at once and spends itself on the line." |
| Gall's and Fury's hints (the bestiary's "It circles a lure that carries ...") | `ASPECTS` `hint` (species.js) | Gall: "a thing swallowed that will not stay down"; Fury: "the heat in the hands before the blow" |
| the refusal when 7 or 8 is pressed before the feeling is known | `setAspect` (`angling/angler.js`) | "You do not know Gall yet." / "You do not know Fury yet." |

The achievements name themselves from the fish (`progress/achievements.js`: "Land a Short Fuse", "A Large Sour Grudge", "Sour Grudge,
Often"), so a new name carries through. The game says "you"; the Courier is never "she" or "he".
