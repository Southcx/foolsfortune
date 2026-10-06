# The casebook: every bug fixed, its cause, and the rule it left

The owner, 2026-10-06: "whenever you fix a bug, annotate it somewhere for yourself in a log to reference so that we repeat fewer
implementation mistakes." One case per fix, newest first: what was seen, the cause (measured, not guessed), the fix, and **the rule**
(what to do or check next time so the same mistake is not made twice). Read the rules before building in the same area.
Every division writes here when it fixes something; a rule that a machine can check goes to `npm run check` or a test too.

Prior art: the aviation incident report and the medical case series (what happened, why, what changes), and a team's postmortem
log kept blameless and searchable.

## The rules, short (from the cases below)

1. **No two faces in one plane.** Before adding a floor, a slab or a decal, find what else lies in that plane (a ray down through the
   spot, or the zone's bounds): ceilings of rooms below have their tops at ground level. Cut the other one, or stand off by at least
   1.5 cm (1 mm is not enough at 20 m in a 24-bit depth buffer). Floors and slabs get `{ outline: false }`.
2. **A new zone moves things.** A zone test claims every mesh whose centre falls in it, and everything that asks `zoneOf` changes its
   answer there. Grep `zoneOf` and `zones.current` before adding one; ask `wholeOf` / `zones.whole` for "what ground is this".
3. **Pin the clock in every headless test.** Anything seeded by the game day (the Dunemaw's floors, the weather) changes daily.
4. **Times are the machine's; counts are the change's.** Before believing a perf time, measure the last published build on the same
   machine, back to back.
5. **A shader program is a cost.** A material variant no other mesh uses (instancing on a basic material, flat shading) compiles its
   own program; share an existing one.
6. **Clone skinned models with `SkeletonUtils.clone`**, never `.clone()` (the copy stays bound to the original's bones).
7. **Save records are copies, never live references** (JSON round trip at the write).
8. **Small bumps on a ramp add to the ramp.** Anything walkable stays under the controller's climb limit with its detail included.
9. **A route through doorways approaches each doorway square** (a point in front of it on each side): straight lines along a wall
   catch on anything standing proud of it.
10. **A rename is all the places, or none**: grep the old word across the repo, and read the stress test's page errors, not only its
    violation count.

## Cases

### 2026-10-06 · The Throwing Room's floor flickered (the owner's report, v86)
- **Seen:** a dark patch with a stair-stepped edge crawling across the room's floor as the camera moved.
- **Cause:** the basement's east ceiling slab (`world/basement/basement.js`, top at y 0) ran under the whole room; the room's floor top
  was also at y 0. Two faces in one plane. A ray from the camera met both at the same distance. Also, the floor box had an outline
  hull, and the lane stood only 1 mm over a plank.
- **Fix:** the ceiling slab goes round the room's footprint; the floor has no outline; the lane 1.5 cm over the planks, the ring 1 cm
  over the lane.
- **Rule:** 1.

### 2026-10-06 · The Throwing Room's zone would have rained indoors and silenced the music
- **Seen (before shipping):** with a `testroom` zone, `weather.placeOf` and the music chooser asked `zoneOf`, got 'testroom', found
  no place and no cue.
- **Fix:** `zones.whole`; the weather and the music ask the whole (Dovina's and Wanda's one-word fixes).
- **Rule:** 2.

### 2026-10-06 · The Dunemaw playtest failed on some days only
- **Cause:** the Dunemaw's floors are the game day's (`wellSeed`); the playtest did not pin the calendar, and on four days of six the
  way up was farther than the agent's 30 sim seconds.
- **Fix:** the playtest pins the calendar (`--clock`); a walk across a floor gets 90 sim seconds.
- **Rule:** 3.

### 2026-10-06 · Slopes in the Dunemaw stalled the Courier to 0 m/s
- **Cause:** sand ripples (0.2 m, 3.2 m crest to crest) laid on a 23 degree ramp made 44 degree crests, at the controller's 46 degree
  climb limit. Measured with the controller's contact normals.
- **Fix:** ramps carry no ripple; their ends are rounded; flat lanes from doorway to doorway.
- **Rule:** 8.

### 2026-10-06 · The agent wedged against an arch's pilaster
- **Cause:** a route to a doorway's middle ran along the wall from the side; the new pilaster stood 0.45 m proud of it.
- **Fix:** the route passes a point 1.8 m in front of each doorway on each side.
- **Rule:** 9.

### 2026-10-06 · The testing room cost a shader program of its own
- **Cause:** the spray wall's dents were an InstancedMesh with a MeshBasicMaterial (the only instanced basic material in the game),
  and the console's wood was flat-shaded.
- **Fix:** the dents are one plain mesh written in place; the wood smooth-shaded.
- **Rule:** 5.

### 2026-10-06 · Perf "regressed" by 25 to 45 % in every zone at once
- **Cause:** a new container: the published build measured on it ran as slow as the head.
- **Fix:** none needed; the baseline re-recorded with the reason.
- **Rule:** 4.

### 2026-10-06 · An achievement's sub-category not in CATS (boot page error)
- **Cause:** a rename done in one of five places; the stress test's page errors were not read.
- **Fix:** all five renamed (Espada).
- **Rule:** 10.

### 2026-10-06 · Doubled Lachryma tools in the Pneuka Box
- **Cause:** the save kept section records as live references to the box's arrays, so restoring after a hold re-added tools.
- **Fix:** records are JSON copies at the write; `box.reconcile()` removes extra copies.
- **Rule:** 7.

### 2026-10-06 · The title's Clapperjar stood behind the Courier whatever its position said
- **Cause:** a skinned model copied with `.clone()` stays bound to the original's skeleton.
- **Fix:** `SkeletonUtils.clone`.
- **Rule:** 6.

### 2026-10-06 · Mirroring the Crucibelle to the other hip flipped its bell
- **Cause:** mirroring as M·G·M also mirrored the tool's own axis.
- **Fix:** mirror the socket, then flip the local Y (`mirrorSide`).
- **Rule:** when mirroring a held thing, mirror where it is, not what it is.
