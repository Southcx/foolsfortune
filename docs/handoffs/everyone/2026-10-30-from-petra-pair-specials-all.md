# From Petra: all 21 pair specials in play (2026-10-30)

Wave 1 (19, 6, 17, 3) is in `src/tools/pairspecials.js`. The other seventeen are in `src/tools/pairspecials/`, one module for each main
tool's verb. A special plays only when its pair is worn the named way round and opened (`pairSpecialOpen`; in DEBUG, the Tool Moves
lend). It also checks that again at the moment of use, so a swap after the lend disarms it. Each was driven headless on a slip jelly
(or two workshop pots), and each did what its line says.

| pair | special | what plays (placeholder numbers, `PAIR_PLAY` key) |
| --- | --- | --- |
| 1 | Hooked Shot | the lent Grapple arms 3 rounds (6 real s); a creature struck is dragged at 9 m/s toward you for 0.6 real s, stopped 2.6 m off (`hooked`) |
| 4 | On the Beat | the lent toll arms 6 rounds (8 real s); a round fired on the bell's beat adds 0.35 to what it strikes' poise (`beat`) |
| 15 | Chain Shot | the lent Gulp arms the next two creatures struck (6 real s); both are halted for 2.5 real s, and any blow of yours on one strikes the other at half (`chain`) |
| 21 | Full Circle | the lent Flick arms 6 rounds (8 real s); each paints 0.9 m where it lands (1 from the brush's load) and mends an ally within 1.2 m of its path by 4 (`circle`) |
| 2 | Revelation | the lent Flash with the dowse held: creatures within 30 m revealed (a flare's outline and tag, 8 real s); hidden signatures found as the dowse finds them (`reveal`) |
| 7 | Slingshot | the lent Grapple with the fork stuck bites the fork; on arrival you are flung on along the pull at 14 m/s, lifted 6 m/s (`sling`) |
| 16 | Lightning Rod | the lent snap shot with the fork stuck: a bolt (power 2.5, impact) on everything within 4 m of the fork, dazed 0.6; once per stick (`rod`) |
| 18 | Singing Mirage | the lent toll with the fork stuck raises the mirage there for 6 real s; once per stick (`mirage`) |
| 8 | Gentle Edge | the lent Flick with the cutlass in hand: the next 6 cutlass blows (6 real s) do no wound and put calm on for 3 real s (`gentle`) |
| 11 | Appraised Cut | a cutlass blow on a kind you have photographed lands as the type that beats its own (`appraise`) |
| 13 | Reaper's Draw | a cutlass blow that downs a creature feeds the coffin half its full health, 20 at most (`reap`) |
| 10 | Turn of Weather | the wheel of odds spun: fair weather where you stand for a game hour, 12 m x 0.8..1.6 by the coffin's fill (Calm's own patch) (`weather`) |
| 20 | Last Call | the lent toll with the coffin full: no key, no wheel; the coffin empties as a wave of 7 m x 0.8..1.6, power 2 x the fill, dazed 0.8 (`last`) |
| 9 | Illumined Page | a plate holding a sigil writes it on every other subject that can take it, where a plate alone would undo it (`page`) |
| 12 | Held Plate | a plate halts up to 3 creatures in it for 1.2 real s (`held`) |
| 5 | Rite | the lent Flash readies the next toll (6 real s); each creature it reaches is read: `pair.read`, counted as a down toward familiarity (`rite`) |
| 14 | Healing Song | paint laid while the bell's beat falls mends 0.04 of the worst region's crack, once a beat (`song`) |

Events: `pair.special { pair, special, by }` (some add `n`, `r` or `power`), `pair.mark { kind: 'chain' | 'mirage' | 'sling', by }`,
`pair.read { kind, by }`, `pair.mend { kind, by }`. Ledger: `pair.<n>.special`, `creature.<kind>.read`.

- **Dovina:** every number above is a placeholder with its reason in its module. A row of yours in `SPECIAL_PLAY` under the same key
  replaces mine, since yours are spread last. I made two small edits in your files; change them as you like. `SPECIALS_BUILT` now lists
  all 21. `familiarityOf` now counts `creature.<kind>.read` with the downs.
- **Calissa:** the looks are placeholders. The bolt is `fx.impact`, a found thing is a star glyph, and the rest show nothing yet. Each is
  yours on its event: the drag's line, the beat's flash on a round, the chain between two creatures, the paint round's splat, the reveal
  (already the flare's outline), the bolt, the decoy's song, the calm on the blade, the wave out of the coffin, the fair patch (already
  Calm's), the written sigil, the held plate, the read, and the mend.
- **Wanda:** sounds on `pair.special` (by `pair`), `pair.mark`, `pair.read` and `pair.mend`.
- **Espada:** your 21 `DID` lines are live in `tracking/pairspecialsplay.js`.
