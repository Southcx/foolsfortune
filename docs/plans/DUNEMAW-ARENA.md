# The Great Slip Jelly's arena: the bowl (the owner, 2026-10-06: "pass an explicit level design plan for the arena")

Kept by Dovina. **Built:** `src/world/well/bowl.js` (the room, its colliders and states; it lays the plan out, so no map is kept here);
the measures are `ARENA` in `src/progress/combat/dunemaw.js`; the fight's rules are DUNEMAW-SYSTEMS.md and DUNEMAW-EXTREME.md. Units:
metres, sim seconds; the arena's own frame, origin at its centre on the floor, +z north (toward the way in), +y up; a bearing is from
north, clockwise.

**What the room must do:** make the bullfight readable (pillars at charging distance from open ground, never against a wall); be spent
as it is fought (every ram takes a pillar's crack or a stalactite, in the order the player chooses); turn into an antlion's pit in the
bare phase; offer the nursery as a choice before the fight; be seen from above first (the ledge's reveal).

Prior art: Monster Hunter's arenas, Zelda's Dodongo pit, the bullring, Dark Souls' boss rooms, Shadow of the Colossus, Hollow Knight.

## The numbers

| part | where | size | why |
|---|---|---|---|
| **the bowl** | the great cavern under the third floor | floor r 28 (56 m across); roof at y 30 | Monster Hunter's scale: room for a 24 m charge in any direction from the centre |
| **the floor** | r 0..22 | dishes 4° to the centre | the antlion pit, read at a glance; flat enough to fight on |
| **the rim shallows** | r 22..28 | slip 0.4 m deep; wading x0.7 speed | where the clutches lie; slower, so the rim is a commitment |
| **the walls** | r 28 | stone, unclimbable to y 4 | a ram into the wall stuns it 1 s and cracks no crown (stone it can't break is not stone you can use) |
| **the upper ring** | r 24..28, y +4, the south half | 4 m wide | a vantage for the Veritome's read and ranged work; the FOE can't climb it, brood can |
| **the entrance ledge** | north, z +26..+34, y +6 | 12 m wide | the reveal; two slopes down and none back up: entering commits |
| **slopes** | S1, S2 (ledge to floor), S3 (upper ring to floor) | 30°, 3 m wide | S1 and S2 one way (Journey's dunes); S3 both ways (Petra, 2026-10-07: else the upper ring could never be reached) |
| **pillars P1..P6** | r 18, bearings 30°, 90° .. 330° (none at 0°: the entrance's line stays open) | 3 m wide, 12 m tall | a charge drawn from the dish meets them at full speed; two rams each (cracked, then fallen: a 12 m log, cover and one more ram, then rubble) |
| **stalactites t1..t8** | r 12, bearings 0°, 45° .. 315°, hanging y 14..18 | 1.5 m at the root | each falls when a ram lands on the stone nearest it, or the FOE surfaces under it; on the floor, a ram target used once |
| **slip pools W0..W4** | W0 at the centre (6 m wide); W1..W4 at r 16, bearings 0°, 90°, 180°, 270° (4 m wide) | 2 m deep | where the FOE sinks and surfaces when bare; the Courier falling in is put back on dry floor with a crack |
| **clutches C1..C8** | r 25, two a quadrant, in the rim shallows | 1.6 m across (3 to 6 eggs) | the nursery (`NURSERY.clutches[2]` = 8); 3 m or more from any pillar, so a fight at a pillar never breaks one by accident |
| **the FOE's wake** | on the floor within r 20 | | it broods in W0 facing north; the rim's stealth circuit stays safe |
| **the way up** | W0 after a burst; W2 (the east) after a reprogram (it sinks into W0 and stays) | | out where the FOE lay |

**The ram:** a 1.0 sim-second scrape (the tell), then a charge at 11 m/s (faster than a sprint at 6.8, slower than a dash at 13: you
sidestep, you don't outrun), up to 24 m, turning at most 20° a second. Six pillars hold twelve rams and three end the crown: wasting
rams is forgiven, and which side of the room is spent first is the player's choice for the bare phase.

**Budgets:** one sub-zone, at most 60 draw calls and 150k triangles in view (pillars and stalactites batched), lights from the light
budget only (four of the eight: W0's glow, the core, two Lachryma seams).

## Measured (Petra, 2026-10-06) and ruled

1. **The sidestep:** aimed when the charge starts, the Courier clears at most 1.56 m of the FOE's half-width: a fail. Aimed when the
   scrape begins, the sprint, roll and jump-and-dash clear 3.29, 3.95 and 5.75 m: a pass. **Ruled (Dovina): the aim is taken at the
   scrape's start** (`FOE.ram.aim` 0); the 20° a second turn, the tell and the movement are unchanged. `FOE.halfWidth` 1.0 m.
2. **The pillars:** 15 m stone to stone; a charge down the middle misses both.
3. **The slide** (1.5 m/s at its fastest): a sprint nets about 5.3 m/s; aiming (2.3 m/s) nets 0.8, slow but never a trap. Kept.
