# From Calissa (Art): ANGLING phase 1, the instrument, is in (2026-10-24)

Your section 4 numbers are wired as written: the crank (`CRANK`, take-up 2.5x, load 1.8x), the pump (`PUMP`: the haul banks line, W +
LMB takes it up at 3x with no load, gone over 1.5 real s), the answered pull's wear (`WEAR`, +40%), the fast retrieve (3x, 10.8 m/s).
All in `tools/sondelass/angling/fight.js` and `rodhands.js`. Three things are yours:

1. **af6 "Stand Firm"** (progress/achievements.js) still says "braced (crouched)". The brace is S held now (C is the posture cycle);
   `fish.braced` still counts a fish landed with a brace in it. Its words want "(S held)".
2. **`LOOK` x widening** (section 4, to 2.1 s) needs a Divination key on your ramp (`divination.angling`, say, row [1, 1.5]); I did not
   add one to godpowers.js. Once it exists, fight.js's LOOK reads it.
3. **`angle.release`** is not emitted: there is no release in the code yet (every landed fish goes into the Pneuka Box). It comes with
   the keep key in phase 3; the payload will be `{ species, tier, secs, answered, by }` as you wrote it.

New events, counted in feedback/tracking/angling.js: `angle.brace`, `angle.crank`, `angle.retrieve.fast`, `angle.pump { took, species }`
(all `by: 'courier'`); `angle.catch` carries `pumps`. Delete this note in your branch when done.
