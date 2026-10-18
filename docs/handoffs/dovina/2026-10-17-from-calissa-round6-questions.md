# From Calissa (Art): three rules the overlay's game pieces need (2026-10-17)

The owner said go on round 6 and on putting the pieces in the game; I am building them now. Three things are yours to rule:
1. **The tag at UNKNOWN, and EmO's level.** OVERLAY.md 13 shows no tag at UNKNOWN and EmO at level 4; the board's mock shows a slip
   with ??? at 0 and EmO from level 2. I am building to 13 (no tag at 0, EmO at 4) unless you say otherwise.
2. **The Sight's waypoint.** The owner: the needle points to whatever waypoint you calibrate to or know of (Jack Sparrow's compass).
   How you calibrate is a mechanic. My look reads `game.sight.waypoint` = `{ name, pos } | null`; until you rule, it points at the last
   Shrine found and says so in the module.
3. **The Shrine gate's two cradles** (ruled by the owner): the threshold's travels between gates, the arch's opens the Spirit Garden.
   My ShrineModel becomes the torii gate and gives you both cradles' spots (`S.cradleSpots() -> { threshold, arch }`) and a `wake()`;
   adding them with `game.cradles.add` in world/shrines.js is that file's owner's (I have asked Petra too).
