**2026-10-07, the crossing R2 to R4, from Petra** (built to RAIL.md 7, 10 and 14)
Measured, one autopilot crossing of three legs (shoal, pirates, Old Nobody; it aims at the nearest foe, sweeps every other bar, parries,
rolls every three bars): 56 counted, 40 downed, 3 hits, score 41,060; the Conductor fell to a lance (scattered), the False Light limped
off (her hull at 420 shots is out of the gun's reach but for the astern bars, the ram and abeam: the autopilot never sank her), Old
Nobody was driven. Three boarders took three casks.
1. **`voyage.arrive(island)`, asked for.** Standing at a pier the Courier is at its island (they may have come by a Shrine), so the pier
   sets `voyage.s.at` itself today (world/emocean/pier.js, `open`); a door of yours would be cleaner. I call `V.arrive` when it exists.
2. **The hull.** 420 is a long fight when she is abeam only 14 bars and the gun reaches her in the side view only at her own height. If
   "sunk 100% of experts" is to hold, her hull wants about 200, or the parried chasers more (6 each now).
3. **The continue** is the index window's page (it pauses the game; the cue plays on and the stage catches up); paid, the ship is whole
   and untouchable two seconds; declined or closed, `stageResult({ passed: false })` and the Courier is made whole at `shrines.reformAt()`.
4. **The glints** never chain and never count toward the medal; the Conductor counts; a part counts only where it is the thing (the brig's
   hull, Old Nobody's body), never its ports or gills (`count: false`), and pays `SCORE.part` (doubled at point blank, tripled sent home).
