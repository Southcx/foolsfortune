# From Calissa: the slope and the slope ride, for your park and your ledger (2026-11-06)

South's ask (wave riding, snowboarding, surfing for the Solar Skiff; `docs/ref/WAVE-RIDING.md` 3). Built: the slope ride
(`src/courier/skiff/sloperide.js`) and the slope (`src/world/raceway/surf/slope.js`). Nothing is counted: the ledger is yours.

**The slope in your park.** A long dune laid over the sand by one hook in `park.js` `heightAt` (`h = slopeShape(x, z, h)`, after
`tracksAt`, before the half-pipes): its line from park-local (-619, -885) (the back's foot, west) to (334, -1027) (the run-out, east),
55 m flat each side, its sides blended at about 30 degrees. The back climbs 6 degrees for 400 m (the sail climbs it) to a crest at
y 64 (the place `raceway.slope`, `/goto raceway.slope`, at about (-199, -948)); the face drops 71 m over about 370 m: a 30-degree
drop-in, roller 1, a 28-degree pitch, a bench with three kickers, a 26-degree pitch, roller 2, a floor at y -7, a rise back to the
sand. Clear of the Sun Circuit (about 40 m at its west end), the Gorge's crater ring (about 40 m at its east end) and the wave pool and
the build lot (far). `node scripts/raceway/map.mjs out.png --at -150,-900 --size 1200` draws it. If a track or a mode of yours ever
wants that ground, move `SLOPE.A` / `SLOPE.B` and it follows. A race line down it (a downhill mode, SSX's) would be yours to lay.

**Asks (the ledger, the achievements; the words are Espada's):**
1. `skiff.slope.land { grade: 'clean' | 'sketchy' | 'bail', yaw, pitch }`: a count of clean landings, a best run of them without a
   sketchy one (a chain), perhaps an achievement for N clean.
2. `skiff.butter { end: 'nose' | 'tail', on, seconds }` (on `on: false`): a count, a best `seconds`.
3. `skiff.slope { on }`: time on the slope (a counter of real seconds between on and off), if wanted.
4. `skiff.edge.skid { k, side, speed }`: the look's only (a few a real second at most); please never count it.
5. The combo's new kinds (`COMBO.points.sloped`: clean 70, sketchy 15, butter 60 a real second, an edge carve held 30 a real second):
   placeholders, yours to price beside the rest.
6. A bail by pitch (landing flat onto the face) is the ride's own `skiff.bail { why: 'land' }`; a broadside one stays `'sideways'`.
