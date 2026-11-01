# From Calissa: the Well's training targets, mechanics for you to tune (2026-11-02)

South asked for three filler foes in Strawman's Well, target practice in Strawman's family ("little ramshackle contraptions with an obvious
training target motif"). Built on `claude/calissa-art-cups` (3ae44d61): `world/strawmanwell/targets.js` (runtime), `targetminds.js` (minds),
`vfx/strawmanwell/targets/` (bodies). South asked me to bring the mechanics to you: every number below is a first guess, yours to rule.

**How it rides your code.** `TrainingTargets extends StrawDummies` (your dummy.js untouched): the same percent, launch, blast lines, KO
(`well.dummy.ko`, so they also count toward `stage.kos`), trophies, verbs and windup. It overrides `spawn` (the kind's body, mind and
capsule: a copy of yours with those three swapped), `hurt` (the throw divided by the kind's weight; a quintain struck starts its swing),
`swipe` / `release` (each kind's blow), `update` (only the lane you are in moves; the duck held up). Built and taken down with the area
(`boot/services.js`: `populate` after your `build`, `clear` before your `teardown`). If you would rather have a `kind` hook in
`StrawDummies.spawn` (body, mind, size), the copy folds away: say so and I will move to it.

**The three (TARGETS, TARGET_MINDS):**
- target hopper: hops at you within 9 m, pounces (0.45 s crouch, leap 7.4 up / up to 3.7 along) inside 3 m, shove 5.5; weight 0.9; never
  hops where no floor is.
- quintain: never starts a fight. Struck by you, it winds 0.42 s then the sandbag comes round (reach 1.9 m, either side), shove 6.5;
  blows during the swing do not break it off (the parry still does). Rolls back to its spot. Weight 1.7 (thrown about half as far).
- gallery duck: patrols ±3.5 m at 3.4 m over its floor, dives (0.6 s tip, 0.55 s at 9.5 m/s) when you are under it, shove 4.5; weight 0.75.

**Placed (PLACES, m along the lane):** wings quintain at Strawman + 2.3; Run hopper 40, duck 58 (over the gap), hopper 96; Climb duck 30;
Stomp hopper 30; Brawl duck 25; Machine quintain 16. Your stage ranks count their hits on you (`well.hit()`); move or drop any that fight
a stage's design.

**Asks:**
1. The numbers and the placements, above.
2. Should a target's KO count toward a stage's rank or the Brawl's `kos` (it does now, through `onKO`)? And the ledger: their KOs say
   `well.dummy.ko` like a dummy's; a `kind` field would let a rule tell them apart (dummy.js's emit is yours).
3. Your branch's lanes for waves 2 to 4 (stagemods.js): tell me where you want targets there and I will place them.

Delete this file in your branch when done.
