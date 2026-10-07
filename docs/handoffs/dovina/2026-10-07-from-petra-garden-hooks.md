# The garden's feature list, steps 1 to 3: the sweep's hooks (from Petra, 2026-10-07)

Built (SPIRIT-GARDEN.md section 7; mark them **built**): 3, 31, 6, 7, 11, 13, 20 (wired, dry: below), 30, 24. Hooks for item 23, all on
`game.realm` (`R`):
- **3** `R.camera.arm` (0..1, the share of the wanted distance the camera stands at); `R.camera.clear(from, to)`. Check: raise a hill
  behind the Jar (`R.clays[id].brush(dir, 'pull', 0.3, 5)` x40), 60 ticks: the camera stays over `P.radiusAt` (measured 0.96 m, arm 0.31).
  Overhead zoomed to 70 m is inside no planetoid.
- **31** `R.waterworks.cost` (ms a fixed step, averaged) and `.every` (steps folded into one, 1..3). Measured 1.29 ms pouring on the
  Dantian. `npm run perf` has no garden zone yet; this is the measure until it does.
- **6** `R.hand.setArt('paint')`, `R.hand.turn()` (R: moss, ash, loam, slate, silt), `R.clays[id].paint(dir, ground, r)`,
  `.groundOf(dir)`, `.painted`, `.dumpGround()`; the save's `realm.ground`. Free. Event `garden.paint { planetoid, ground }`
  (ledger `garden.paint`, `garden.paint.<ground>`).
- **7** `R.plots.move(from, to)`, the hand's grab on a placed feature; event `garden.move { from, to, feature, mult, vein }` (ledger
  `garden.move`).
- **11** `R.hand.turn()` with WATER (wonder .. dread, then your draught's), `R.waterworks.feelingAt(planet, dir)`, `R.plots.wet`; the
  formation now passes `{ ground, water }` to your `formation()`. The lake: `R.lake` (the draught entered with). Not built: GROWTH's
  two 1.25s on the beds, and a spirit drinking its stat's feeling (they need the beds' and the spirits' growth to read them: step 4).
- **13** `R.site.links[i].ends[planetId]` (a direction); `R.plots.veins(planet)` runs on every stroke's end and undo. `onVein` is your
  `VEIN.reach` (3 m) from an end now, not the old 8 degrees of a great circle: far fewer plots are on a vein.
- **20** `R.waterworks.rain()` reads `game.courierMind?.state` / `.brimming` through your `rainOf`. Nothing keeps the Courier's mental
  state in play yet (nor `game.draught`), so it is 0. Who builds the keeper (stones.js has the numbers): yours to rule, mine to wire.
- **30** Ctrl+Backspace twice within 3 real seconds over a planetoid: `R.resetPlanetoid(P)`; event `garden.reset.ask`, `garden.reset`
  (ledger `garden.reset`); Ctrl+Z undoes it.
- **22** The save: one sculpted planetoid's clay is 8,192 integers (the Dantian's dump measured 18 KB with paint and water); six fully
  sculpted is about 110 KB. Under your 200 KB, not by much.

From the room sweeps (your SWEEPS.md): groups 1 to 6 and 8 fixed on main (c7c0f37); first-run counts after: basement 259/1, Dunemaw
220/3 (the third, the cavern's leak, fixed since: the meeting's rig left its gun in the scene). **The arrival**: your check wants the
Courier set down at the Lip Stone on the way in; the plan only says the wipe. Both now stand on the ledge behind it, 1.4 m off. Say if
the tunnel walk was wanted. **Still yours**: the five drops' definitions (group 7); the renames (they touch the save's Shrine ids,
`game.emocean` and others' files: next round, in one pass, once you say the Shrine ids are final).

**Step 4 built since:** 14 (moonflowers, Calissa's datura, beside each lantern, by night), 15 (`R.plants`: `.at(planet, dir)`,
`.grids`, `.tick(hours)`; ledger none yet), 17a (your SETTLE in `awaken.visitors()`), 17b (`R.raising.spar(a, b)`, `.sparring`; events
`spirit.spar.start`, `spirit.spar`; ledger `spirit.spar`, `spirit.spar.bumps`), 17c (`R.races.offer(planet, path)`, `.tracks`,
`.start(track, spirits)`, `.running`; events `garden.track`, `spirit.race.start`, `spirit.race`; ledger `garden.track`, `spirit.race`,
`spirit.race.fastest`), 25 (`/name Words`; event `spirit.name`). Open: 12, 19, 21.

**Your sweeps, after this round's fixes (four checks to change, not the game):**
- workshop, "kiln: Esc with the Codex over the station closes the Codex first": the Codex no longer opens over the station (your own
  "no second window" check); accept `before` without the Codex.
- garden, "water: the waterworks has the Jar's planetoid": the grids are made on a planetoid's first water now (the heap); ask
  `R.waterworks.water(planet)` or `planet.waterAt(dir)`.
- dunes, "skiff: resized mid-ride": the canvas follows (measured 640 px, aspect 1.6 at 640 x 400); the check reads before the resize
  event lands: wait 300 ms as the basement sweep does.
- dunemaw, "(casebook 34)" in a check's name: rule 49 now (Calissa's renumbering).
