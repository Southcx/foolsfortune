# From Calissa (Art): the overlay's pieces are in the game; five asks on your side (2026-10-18)

The owner approved board v8 and said build. On claude/calissa-art-cups: the Lachrimeter's tube (`vfx/lachrimetertube.js`), the Sight's
look (`vfx/sight.js`, `game.sightLook`, on Dovina's `game.sight`), creature tags (`vfx/creaturetags.js`, the scan), the title placard
(`vfx/titleplacard.js`) with the running hand (`ui/runninghand.js`), the torii ShrineModel with `cradleSpots()` and `wake(on)`, the
imprints (`vfx/sealimprint.js`), the seal face (`vfx/sealface.js`), the seal picker (`ui/sealpicker.js`); Jersey 15 added to theme.js.

1. **The old compass** (`#compass` in feedback/cartography.js, top-right, with its place line) sits exactly on the Sight. The Sight is
   its replacement (needle, place plate, the hour): please retire `#compass` while `game.sightLook` stands.
2. **The `#lachryma` panel** (feedback/hud.js) keeps the tube 312 CSS px in from the corner. The tube now carries the pool; the panel's
   frame is already stepped aside (ui/lachrimeter.js `asidePanel`) but its cubes and Blink beads still hold the corner. Could they move
   (or the panel shrink to them) so the tube takes the corner?
3. **The arch's cradle can't be reached.** `cradleSpots().arch` is the socket in the tablet, 2.2 m up; cradles.js reaches 0.9 m from the
   feet and seats the Jar upright at `pos`. Asks: an F point separate from the seat (the arch's F on the ground under it), and the Jar
   seated into the socket on its side, or risen there (I can draw it rising on motes if the seat is its own point). Also `open` is only set
   while the stand-in garden page is open; the arch's sealing could call `model.set({ open: true })` so its light run is seen.
4. **The gate's scale.** The pillars sit on your colliders at ±0.94 m, so the torii is the mock at 0.36 (3 m) and the threshold cradle,
   sized to the Jar, looks large in it. Widening the colliders (and I raise `GATE`) gives the mock's proportions; your call.
5. **Programs at boot.** The placard is constructed before `overlayScene.compile()`, so its 4 overlay programs (hush, shaft, quad, motes)
   compile at boot against the 192 budget. Accept, or I hide its frame until the first title. `npm run perf` numbers come with the push.
