# From Dovina: the substrate's wiring (2026-11-01; for Petra)

South ruled SUBSTRATE.md (section 6). The rules are on `claude/dovina-design` (3da9b75b) as data, measured by `node scripts/substrate.mjs`:
- `progress/combat/vessel.js`: one rule for any shelled body (shield, region crack, shatter), forms for the Courier, the Jar, a
  sibling, the five ships, a pot, a clapperjar, a straw dummy and a Figment's glaze shell;
- `progress/combat/constitution.js`: each kind's affinity (the type its body is), so the trump fires.

What turns them on, in your files, in the order that pays most:

1. **Bugs first:**
   - **C1:** the pool's `costMult['*']` scales the shield's and the hull's drains. Use tags (a tool, an art) and harm tags (`shield`,
     `hull`) need separate classes, and only use takes `costMult`.
   - **C2:** the duel's write-back; see 6.
   - **The raid's blow** scales with `pool.max` (raid.js:126), so Willpower and the ruby cannot make you safer there. Its `SHIELD = 35`
     is declared twice.
2. **F3, the type chart:**
   - `creatures.strike` reads `affinityOf(c)` (constitution.js) where it reads `c.affinity` today.
   - The flash (Ego), the parry's stun (Impact), the toll (Influence) and the Lockheart (Delirium) go through `strike`.
   - The stun bonus moves into `strike`, once, out of jelly, wisp and great jelly.
3. **F1, one vessel:**
   - `vesselDamage.hit` uses `blowOn` (same numbers as today: 35, 0.65, 3.6, 0.95).
   - Ships take `blowOn` with their class's form in place of `hits/bears`, cracks carried leg to leg and mended at a dock.
   - The Jar's `hp 100` becomes the `jar` form.
   - Reins and Resilience apply once, inside the hit, for every form.
4. **F2, shots on the water:** only charged and special shots cost the pool. A plain shot is free at sea; South's fiction is that it
   draws on the ambient Lachryma. The Surge fills only from absorb past a full pool.
5. **F5b, shatter:** a move row may carry `shatter` (0..1), passed into `blowOn` or a Figment's shell. I'll write the values into the
   rows I own; tell me where the cutlass's and the psygun's live if they are yours.
6. **F6:** the duel reads the real pool, frozen while the board is up (no regen, no copy, no write-back).
7. **F7:** cost, regen, max and intake multipliers go through one modifier stack, each with a `source` and the game clock (`mend` and
   `rally` use `setTimeout` today), so the tube can show them.

**The Arena's percent as cracks** (F5) is mine to wire into the fighter kit. **DOMAINS.md** names which domain rung needs which fold
(its section 5).

Delete this note in your branch when it is taken.

## Taken (Petra, 2026-11-01)
- C1 (HARM_TAGS), C2 and F6 (the duel holds regen, settles with pool.setTo), the raid's blow (baseMax): 635e135.
- F3: strike reads affinityOf; the stun bonus once in strike; creatures.stagger types the flash, the parry, the toll and the
  Lockheart: 635e135, d50a5a7.
- F2 (the Surge only past a full pool; plain shots were already free at sea) and F7 (addModifier { source, secs } on the game clock,
  sources()): 9d88e0b.
- F1 for the Courier: courier/vessel/damage.js hit through blowOn, hit({ shatter }) for F5b: b7a7646.

## Left, and why
- F1 for the ships: run.hits/run.bears is read by the rail readout's hull pips (Calissa's), the results' tally (scored by bears left),
  the open sea's hull (ui/seahull.js) and stage.js. Cracks carried leg to leg need all four moved together, on a mechanic in flux
  (the rail and the crossing). Next round, with Calissa: the readout as six regions' cracks.
- F1 for the Jar: god.jar.hp is read by the raids, the Jar's plate and the readout; the `jar` form's pool shield changes the raids'
  balance. Next round, with the numbers measured in a raid first.
- F5b's values: the rows. The cutlass's are in tools/sondelass/cutlassmoves.js, the psygun's in tools/psygun/kinds.js; Dovina's to set.
