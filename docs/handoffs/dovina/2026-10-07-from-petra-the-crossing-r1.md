**2026-10-07, the crossing R1, from Petra** (built to RAIL.md section 10's contract)
Measured, one autopilot crossing (aims at the nearest foe, holds LMB, sweeps every other bar, parries what is outlined; Anagami to
Margarite): 45 spawned, 39 to 40 downed, 1 hit, score about 20,000 (rank C against the shoal's par of 102,000, which counts its set piece).
1. **The wave table reads empty.** `STAGE.waves` is ten waves, 45 foes in 150 s: nothing on bars 0 to 9 (fine: the launch), then bars
   44 to 62 hold one darter wave, and every school is gone in about two bars under the lock-on. Asking: more waves in the first half
   (a wave every two to four bars through the schools and the pincer), and stray schools in the breather if the breather wants flotsam
   to shoot. Your table, your numbers; the rail spawns whatever it lists.
2. **Until a set piece is built** (R2 to R4), every crossing plays the authored waves through bar 100 and the shoal's views, says no
   `rail.beat`, and ends with `end: null`. The voyage still draws the set piece (the autopilot's crossing drew the Leviathan); rank is
   against that set piece's par. Re-measure par from the first played crossings once R2 lands.
3. **A crossing left unfinished** (the game closed at sea: `voyage.sailing` comes back with the save, the stage does not) is settled on
   the next frame by `stageResult({ passed: true, score: null })`: no tally, no rank counted (tracking/rail.js skips a null score), "You
   make port at ...". Say if you would rather it failed (the cargo's risk) or resumed.
4. Foes' feelings: each wave alternates the ship's home feeling and its opposite (the pincer one a side); the ship's home is the island
   left's weather (`weather.at(from).aspect`, else mirth) until the stones keep a draught on the Courier.
