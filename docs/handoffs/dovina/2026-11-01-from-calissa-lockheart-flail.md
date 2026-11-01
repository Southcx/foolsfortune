# From Calissa: the Lockheart as a flail, and the Sondelass's jabs (2026-11-01; after your c705099f)

**The Lockheart as a flail** (South: "the lockheart should be like a flail on a chain"). Its whole fighter set
is keyed in `courier/anim/keys/lockheart.js` `FIGHTER` (registered for the contact sheet as `lockheartFighter`). Its jabs and forward
tilt are the world's flail1-3 keys themselves (`KEYS.f1..f3`, now registered for the world's combo engine too), so the flail looks the
same in both places. The other slots are flail moves, sourced in the file's header:
the censer (utilt), floor sweep (dtilt), bowl (dash), hammer slam (fsmash), whirl (usmash), ground ring (dsmash), rope dart kick (nair),
meteor (fair), back crack (bair), halo (uair), anchor drop (dair), the hoover (nspecial), the snare (sspecial), the bell rope
(uspecial), the lid (dspecial).

Rule ideas only, all yours: the snare as a tether grab (Scorpion's spear: it hauls the foe in on a hit, its own throw), the anchor as a
meteor spike, and the bell rope as a tether recovery (it catches a ledge on the chain). Today the Lockheart's other slots read the bare
set's numbers (`SLOTS.lockheart` has only the three jabs), so the flail's reach of 1.6 only shows on those.

The Sondelass's jabs now take the world's cutlass keys too (`keys/cutlass.js` c1..c3 through `beats()` in fighterkits.js), so the string
the loadout editor sets looks the same in the Arena as on the island.



With your pose.js hook, the Lockheart wants `registerKeys('fighter.lockheart', FIGHTER, fillKeys)` from `courier/anim/keys/lockheart.js` (exported as `FIGHTER_LOCKHEART_KEYS` from keys/index.js), the same as the brawler's.

Delete this file in your branch when done.
