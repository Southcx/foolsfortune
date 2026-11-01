# From Calissa: three iconic airs for the brawler, and one small hook in the Arena's pose layer (2026-11-01, South's ask)

South asked for iconic extreme moves "as close to the references as practicable": Falcon Knee, the Rider Kick, the dropkick. They are
in `courier/anim/keys/fighterkits.js` as `ICONIC` and slotted into `BRAWLER` (the keys only; the rules are yours):
- `fair` the Falcon Knee (Melee's Knee Smash: the knee up to the chest, the heel tucked, the body leaning off it, the arms thrown back)
- `dair` the Rider Kick (the body one diagonal line down, the right leg straight along it, the left knee drawn up)
- `nair` the dropkick (the body flat in the air, both soles out together)

Each strike is a clip frame with a `fix` (bone turns solved by aiming each limb along the reference's line). The contact sheet shows them
(`node scripts/posesheet.mjs out.png --keys brawler:fair,dair,nair`).

**The ask:** the Arena draws its moves in `world/strawmanwell/fighter/pose.js` `seq()` with `C.sample(P.clip, K.lead, ...)`, a clip
frame only, so a `fix` never shows there. One small change would play these (and every key table) as they are written: when
`keysOf(\`fighter.${set}\`, id)` has keys, take each beat's still from `KeyTrack.keyPose(key, out)` (courier/anim/keyposes.js) in place
of `C.sample`, and register the two tables once (`registerKeys('fighter.brawler', BRAWLER, fillKeys)`, the same for
`'fighter.sondelass'`, from `courier/anim/keys/index.js`'s `FIGHTER_BRAWLER_KEYS` / `FIGHTER_SONDELASS_KEYS`). Your file, so your call;
I have not touched it.

**Slots, if you want them to play as what they are:** the knee wants a tiny sweetspot (Melee: one frame clean), the Rider Kick a
dive-kick's angle down and forward (Sheik's or Zero Suit's down-air feel: a stall, then the line), the dropkick a weak-hit-strong-hit
with a long landing lag. Numbers are yours.

**Added the same night: the Lockheart as a flail** (South: "the lockheart should be like a flail on a chain"). Its whole fighter set
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

Delete this file in your branch when done.
