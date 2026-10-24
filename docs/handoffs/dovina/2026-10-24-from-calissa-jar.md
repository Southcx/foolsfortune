# From Calissa (Art): the Jar's look, rows and opens to rule (2026-10-24)

The owner: "we haven't addressed customization of the Pneuka Jar, as it doesn't reflect the glazes used by the Courier model ... go as
hard as you can on customization, you can get weird with it."

What is built (looks only, `src/vfx/pneukajar/`): every form of the Pneuka Jar (the god hand's, the garden's, a guest's) now wears the
vessel's look region to part, live (a firing at the kiln shows on the Jar next time it is drawn). That needs no rule: it follows what
the kiln already sells. The Jar's OWN slots are new, and their rows and opens are yours. Today they are open to nobody in STORY (the
owner's Jar is worn) and to anyone in DEBUG with `/jar <slot> <id>` (`/jar random`, `/jar reset`). Kept in save section `jarLook`,
scope `player` (as the vessel's look: chosen from what play opens, reset with each build).

The table: `JAR_LOOK` in `src/vfx/pneukajar/table.js` (ids, labels, one line each). Proposed opens below, a count way and a feat way
where it is worth having (DESIGN.md 22); every number is a guess for you to set against the ledger.

| slot | id | label | proposed open |
| --- | --- | --- | --- |
| lid | cork | Cork | start |
| lid | lotus | Lotus lid | the garden's harmony: a planetoid over 0.75 (bloom) for the first time |
| lid | crown | Crown lid | the god hand: a raid survived without the Jar shattering (feat) or 10 raids (count) |
| lid | roof | Little roof | a Shrine rested at in each layer |
| lid | teardrop | Teardrop stopper | a Lachrymite crystal tuned to its sweet spot 25 times |
| handle | ears | Two ears | start |
| handle | rings | Two rings | 100 Strawman blows parried (or one perfect string at the sparring circle) |
| handle | dragon | Dragon handle | the Great Slip Jelly's crown burst off (feat) or the Great Dunemaw cleared 5 times |
| handle | basket | Basket handle | 30 spirits carried by the hand in the garden |
| shape | tall / squat | Taller / Squatter | start (shape is the cheapest "mine") |
| shape | gourd | Gourd waist | a moonflower seen open at night |
| shape | faceted | Faceted | the Sondelass's cutlass: 500 blows landed (count) or a no-hit Well floor (feat) |
| shape | melon | Melon-lobed | 20 materials pressed at the Athanor |
| foot | scallop | Scalloped | start |
| foot | gold | Gold ring | the kiln: 10 firings (a kintsugi foot for a fired vessel) |
| foot | claws | Claw feet | a Lantern Wisp's ball parried back 10 times |
| foot | lotus | Lotus pedestal | a spirit's farewell |
| pendant | bell | Bell | the Crucibelle: a song played through |
| pendant | moon | Moon | a night spent in the garden (from dusk to dawn, game hours) |
| pendant | fish | Fish | the first fish landed at the Weir |
| pendant | die | D20 | a natural 20 on the palm die or the flee's d20 |
| pendant | coin | Coin | 1,000 cubes cashed back from Raku's chips |
| pendant | gourd | Gourd | a gourd grown (if a bed grows one) or a Shrine's STORAGE used 10 times |
| pendant | tassel | Tassel | start (the cord is your hair's colour) |
| burst | dye | Dye | start |
| burst | petals | Petals | a planetoid in bloom |
| burst | sparks | Sparks | the Heavenly Kiln endured |
| burst | bubbles | Bubbles | a true firing at the Athanor (Soul Alchemy) |
| burst | confetti | Confetti | all seven feelings awakened |

Open questions for you: buy versus earn (Saggar could sell lids and feet as she sells glazes: a sink), and whether a choice is free
once open (the vessel's firing costs cubes; I would keep the Jar's own slots free, the vessel's glazes already cost). The window that
picks them (a JAR tab at the kiln, or the Box's underside) is unbuilt: tell me where it lives and I will dress it.

Delete this note in your branch when done.
