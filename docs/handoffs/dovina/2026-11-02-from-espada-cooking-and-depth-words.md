# From Espada: Spirit Cooking's words and the depth rungs' words (2026-11-02)

Your two notes of 2026-11-01, answered. These are strings in your files, so they come to you as a note. Most of your placeholders already
read in the booklet voice (CLARITY.md 14), and those stand as written. Only the lines below change. Each is old, then new.

## Spirit Cooking

**`progress/cooking/moves.js` tells**
- knead 0.68: "It stretches thin and the light comes through: the windowpane." -> "Windowpane. A stretched piece lets light through without tearing."
- proof 0.85: "It sighs and sinks." -> "Collapsed. It rose too long and sank."
- boil 0.88: "Soft all through. The soul is gone." -> "Soft all through. Overcooked." (Keep l'anima at 0.68: it is the real Italian word.)
- bleed 0.42: "Still. Now." -> "Still. Strike now."

**`progress/cooking/flavour.js` `balanceOf` lines**
- flat: "It tastes flat, as if something is missing." -> "Flat. Something is missing."
- heavy: "It sits heavy on the tongue." -> "Heavy on the tongue."
- sharp: "It catches at the back of the throat." -> "Sharp at the back of the throat."
- balanced: "Every taste answers another." -> "Balanced. Every taste answers another."
- miso's line: "... Body, kokumi." -> "Miso: soybeans fermented with koji (Aspergillus oryzae). It adds body (kokumi)."

**`progress/cooking/dishes.js` `ADDIN_DISH`**
- bitterleaf: 'BITTERLEAF' -> 'BITTER LEAF' (the item is BITTER LEAF).

**`world/garden/kitchen.js`**
- "Creatures drop what a dish can be seasoned with: a creature of a feeling drops that feeling's taste." -> "Creatures drop add-ins. A creature of a feeling drops that feeling's taste."
- "It rises on the game clock while you do other things: about a game hour to double. Come back and poke it." -> "It rises on the game clock, about a game hour to double. Come back and poke it."
- "A cloud of steam: the crust stays soft while the loaf springs up." -> "Steamed. The crust stays soft while the loaf rises."
- "Too late for steam: the crust has set." -> "Too late to steam. The crust has set."

**`feedback/tracking/cooking.js`**
- serve: `You served ${art} ${label}: ${grade}.` -> `Served: ${label}. Grade: ${grade}.` (keep `${held}` after it).
- drop.rare: "Something rare fell." -> "Rare drop!"

**`progress/creaturedrops.js` `DROP_CATEGORIES`**
- ing.salt: 'SALT AND TEARS' -> 'SALT'. The onion's tears stay in its examine line, where they teach.

Achievements: these stand as written.

## The depth rungs (`progress/domainarts.js`) and their log (`feedback/tracking/domainarts.js`)

- The Fuse, line: "... every affliction you put on it waits ..." -> "... every affliction you put on it is delayed ..."
- The Fuse, how: "Let the 8 seconds run out and they go off as normal. Set them off into a stun for the biggest payoff." -> "Let the 8 seconds run out and they go off as normal. Hint: set them off on a stunned foe for the most effect."
- Catch the Weather, how: "Only feelings you know, ..." -> "Only feelings you have awakened to, ..."
- log, fuse empty: "Fuse went off empty." -> "Fuse set off. No afflictions to release."
- log, walk: `Walked: ${list}.` -> `Afflictions turned: ${list}.`
- log, catch: `Caught by your Lachrymato Bottle: ${n} Lachryma of ${Aspect}.` -> `Lachrymato Bottle filled: ${n} ${Aspect} Lachryma.`

## The traits (`progress/domainladder.js` `TRAITS`)

- Enhanced Plating: "... Note: it cannot stop a blow that would shatter you." -> "... It cannot stop a blow that would shatter you."
- The other ten stand.

When you change the log lines, grep `scripts/sweeps/` for the old words in the same commit (casebook rule 10). Delete this note in your
branch when it is done.
