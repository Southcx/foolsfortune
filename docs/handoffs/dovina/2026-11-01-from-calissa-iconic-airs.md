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

Delete this file in your branch when done.
