# The Great Slip Jelly's arena: a level design plan (the owner, 2026-10-06: "pass an explicit level design plan for the arena")

Kept by Dovina, for Petra (who builds the layout, the colliders and the FOE's body) with Calissa (the look) and Wanda (the cues). The
fight's rules are `docs/plans/DUNEMAW-SYSTEMS.md` and `src/progress/combat/dunemaw.js`; this file is the room they happen in. Units:
metres; **sim seconds**; coordinates are the arena's own, origin at its centre on the floor, **+z north** (toward the way in), +y up;
a **bearing** is measured from north, clockwise.

## What the room must do

1. **Make the bullfight readable.** The clever kill is the FOE's own ram into stone, so the stone has to stand where a charge can be
   drawn into it: pillars at charging distance from open ground, never against a wall.
2. **Be spent as it is fought.** Every ram takes something from the room (a pillar cracks and then falls, a stalactite drops), so the
   arena at the end is not the one at the start. The order the player spends it in is their choice.
3. **Turn into an antlion's pit in phase 2.** The floor slopes to the slip pools and slides toward the one the FOE is in.
4. **Offer the nursery as a choice before the fight.** The clutches are on the rim, reachable quietly, contested by guards.
5. **Be readable from above first.** The way in is a ledge overlooking the whole bowl (the flythrough's reveal, Etrian Odyssey's FOE you
   see before you choose to face it).

Prior art: Monster Hunter's arenas (a ring of walls and features the monster wrecks, ~60 m across); Zelda's Dodongo and the Ocarina
King Dodongo pit; the bullring (barrera and burladeros: cover to step behind); Dark Souls' boss rooms (an entrance that commits);
Shadow of the Colossus (the room as the weapon); Hollow Knight's arenas (flat, legible, one hazard at a time).

## The plan, from above

```
                         N (+z)   the way in: tunnel at z +34, ledge at y +6
                    ┌────────────[ ENTRANCE LEDGE ]────────────┐
              ..:::::  S1 (slope down)        S2 (slope down) :::::..
          .:::   C7      ╲                      ╱       C8      :::.
        .::        P6 ●                            ● P1           ::.      ● pillar (r 18, 3 m wide, every 60°)
       ::     t6         t1    ○ W1 (r 16)   t2         t3          ::     ○ slip pool W1..W4 (r 16) and W0 (centre)
      ::  C6                                                    C1   ::     t stalactite overhead (r 12, y 14..18)
     ::                                                               ::    C clutch (r 25, in the rim shallows)
     ::  P5 ●   ○ W4        t8       ◎ W0       t4     ○ W2   ● P2    ::    ◎ the FOE broods here (W0, 6 m)
     ::                          (r 0, centre)                        ::    S slope (one-way, 30°)
      ::  C5                                                    C2   ::     ~ the upper ring (r 24..28, y +4)
       ::     t7                 ○ W3 (r 16)          t5            ::
        '::        P4 ●                            ● P3           ::'
          ':::   C4                                     C3      :::'
              '':::::~~~~~ upper ring, y +4 (S3 down at south) ~~~~::''
                                    S3
                                  S (-z)
```

## The numbers

| part | where | size | why |
|---|---|---|---|
| **the bowl** | the great cavern's last third, 7 by 7 cells | floor r 28 (56 m across); roof at y 30 | Monster Hunter's scale: room for a 24 m charge in any direction from the centre |
| **the floor** | r 0..22 | slopes 4° down to the centre (the bowl's dish) | the antlion pit, read at a glance; flat enough to fight on |
| **the rim shallows** | r 22..28, at floor level | slip 0.4 m deep; wading x0.7 speed | where the clutches lie; slower, so the rim is a commitment |
| **the walls** | r 28 | stone, unclimbable to y 4 | a ram into the wall stuns it 1 s and cracks no crown (stone it can't break is not stone you can use) |
| **the upper ring** | r 24..28, y +4, south half only (from W round to E) | 4 m wide | a vantage for the Veritome's read and for ranged work; the FOE can't climb it, brood can |
| **the entrance ledge** | north, z +26..+34, y +6 | 12 m wide | the reveal; two slopes down (S1, S2) and none back up: entering commits |
| **slopes** | S1 and S2 (north, from the ledge to the floor), S3 (south, upper ring to floor) | 30°, 3 m wide, one way | sand you slide down and cannot climb (Journey's dunes) |
| **pillars P1..P6** | r 18, at bearings 30°, 90°, 150°, 210°, 270°, 330° (none at 0°: the entrance's line stays open) | 3 m wide, 12 m tall, to the roof's shadow | 18 m from the centre: a drawn charge from the dish meets them at full speed |
| **stalactites t1..t8** | r 12, at bearings 0°, 45° .. 315°, hanging y 14..18 | 1.5 m at the root | each falls when a ram lands on the pillar nearest it, or when the FOE surfaces under it |
| **slip pools W0..W4** | W0 at the centre (6 m wide); W1..W4 at r 16, at bearings 0°, 90°, 180°, 270° (4 m wide) | slip, 2 m deep | where the FOE sinks and surfaces in phase 2; the Courier falling in is put back on the nearest dry floor with a crack |
| **clutches C1..C8** | r 25, two a quadrant, in the rim shallows between pillars | 1.6 m across (3 to 6 eggs) | the nursery (`NURSERY.clutches[2]` = 8); 3 m or more from any pillar, so a fight at a pillar never breaks one by accident |
| **the way up** | W0, after the fight | the pale pool forms in W0 | out where the FOE lay |

## How the fight uses the room, phase by phase

**Before (brooding).** The FOE lies half-sunk in W0, facing north, its crown up. It wakes when the Courier steps off the ledge's slopes
onto the floor within r 20, or when it hears an alarm (a clutch broken within 15 m of it: none can be; the clutches are at r 25, so a
clutch is broken quietly unless its guards' alarm carries through a guard standing nearer). Two guard jellies a quadrant hold the
clutches (`NURSERY.guard`). The rim shallows are slow and the pillars break the FOE's sight (`sight` is a cone through the pillars'
colliders), so clearing the nursery first is a stealth circuit of the rim: slow and safe, as the system intends.

**Phase 1, the crown.** The FOE fights on the floor:
- **The ram:** it lowers its crown and scrapes for **1.0 sim s** (the telegraph: the crown's glow brightens, Wanda's scrape). It takes
  its aim **when the scrape begins** (Petra measured: aimed when the charge starts, the sidestep fails), then charges at that point at **11 m/s** (faster than a sprint at 6.8, slower than a dash at 13: you sidestep, you
  don't outrun), for up to **24 m**, turning at most 20° a second. It stops at whatever it meets first:
  - a **pillar**: a whole crown stage (`FOE.crown.ram`); the pillar takes a crack (its first: a glowing seam; its second: it falls,
    lying across the floor as a 12 m log, cover and a new ram target worth one more stage, then rubble), and the nearest stalactite falls;
  - a **fallen stalactite** on the floor: a whole stage, and it shatters (used once);
  - the **wall**: stunned 1 s, no crack;
  - **nothing**: it skids to a stop, turns, and comes again.
- **The slam:** close in (under 5 m), it rears and slams, a ring 6 m across (the slam cracks its own crown only when the Courier makes
  it land on a fallen stalactite; that is the hammer's way, `FOE.crown.crack.slam`).
- The arithmetic: six pillars hold twelve rams; three end the crown. A player who wastes rams into the wall or into nothing still has
  plenty; a player who rams the pillars nearest the entrance first keeps the south half whole for phase 2. That is the choice.

**The break.** At the third stage the crown bursts and the FOE reels **4 sim s** where it stands.

**Phase 2, bare.**
- **Sinking:** every 12 sim s it sinks into the nearest slip pool and surfaces 3 s later in another (W0..W4, never the same twice in a
  row), with a slam ring where it comes up. The pool it will rise from rings 1.2 s before (Wanda's cue; Calissa's ripple).
- **The slide:** the floor's sand slides toward the pool it is in at **0.8 m/s** (1.5 below a third of its health: `FOE.slide`); the
  dish's 4° slope makes the slide read as falling toward it. Rubble and fallen pillars are islands that do not slide (stand on them).
- **The brood** come out of the clutches still whole, at two thirds and one third (`broodAt`), and climb toward the Courier, the upper
  ring included.
- **Stalactites** still standing fall when it surfaces beneath them: phase 2 thins the sky the way phase 1 thinned the floor.

**The end.** Burst: the pale pool forms in W0. Reprogrammed: it sinks into W0 and stays (the nursery is the Courier's), and the pale pool
forms in W2 (the east).

## What each division builds

- **Petra:** the bowl in the cave generator's last floor (a stamped room, not a carved one: its shape is authored), the colliders
  (pillars and fallen logs as cylinders; stalactites as bodies while they fall, then static), the slopes' one-way slide, the pools'
  put-back, the FOE's ram, slam, sink and the pillars' state (whole, cracked, fallen, rubble), the events of DUNEMAW-SYSTEMS.md.
  **Budgets:** the arena is one sub-zone: at most 60 draw calls and 150k triangles in view (pillars and stalactites batched,
  `propbatch`), lights from the light budget only (W0's glow, the core, and two Lachryma seams in the walls: four of the eight).
- **Calissa:** the bowl's sand (the dish's slide shown in the ground's own streaks), the pillars' crack seams glowing with the ram's
  stage (so stone reads as ammunition), the stalactites' shake before a fall, the pools' ripple before a surfacing, the clutches.
- **Wanda:** the ram's scrape (the 1.0 s tell), a pillar's crack and fall, the pool's ring before it surfaces, the brood's call.
- **Dovina:** the numbers above live in `FOE` and `NURSERY`; any change Petra measures comes back to me.

## Measured (Petra, 2026-10-06)

1. **The sidestep:** aimed when the charge starts, the Courier has 0.55 s and clears at most 1.56 m of the FOE's half-width: a fail.
   Aimed when the scrape begins, even reacting 0.75 s into it, the sprint, roll and jump-and-dash clear 3.29, 3.95 and 5.75 m: a pass.
   **Ruled (Dovina): the aim is taken at the scrape's start** (`FOE.ram.aim` 0), and the 20° a second turn is kept. The tell and the
   movement are unchanged. The FOE's half-width, crown included, is `FOE.halfWidth` 1.0 m.
2. **The pillars:** 15 m stone to stone; a charge down the middle misses both.
3. **The slide:** a sprint nets about 5.3 m/s against 1.5; aiming (2.3 m/s) nets 0.8, slow but never a trap. Kept: aiming in the pit is
   a choice with a cost.

## What was to be measured first (Petra)

1. A sidestep of a 11 m/s charge from 6 m away: the core movement's dash must clear it with the telegraph's 1.0 s (it should, by about
   0.4 s to spare; if it doesn't, the telegraph grows, the movement never changes).
2. The pillars' spacing: the gap between two at r 18 and 60° is 18 m; a charge drawn between them should miss both.
3. The slide at 1.5 m/s against a sprint of 6.8: escapable, never a trap.
