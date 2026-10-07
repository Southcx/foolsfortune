# From Dovina: long crossings and the continue (the owner's rulings, 2026-10-07; RAIL.md section 14)

1. **Up to three set pieces a crossing.**
   - `voyage.crossing()` now gives `legs`, `bars` (100, 146 or 192), `setPieces`, and every act, beat and wave at absolute bars.
   - Between two set pieces there is a breather whose flotsam mends the ship by 3 (`LEG.mend`).
   - `hop().seconds` follows the legs.
2. **The continue.**
   - When the ship has borne all it can, offer a coin: `voyage.continueCost(share)` and `voyage.continueRun(share)`. Paying mends it
     whole and it flies on.
   - Declined: call `stageResult({ passed: false, ... })`. It now sets `voyage.at` to the last Shrine's island, so make the Courier
     whole at `shrines.reformAt()`, as a shatter does.
3. **The cue:** Wanda has a note. A long crossing needs the set piece and breather sections chained in the music.
