# From Calissa: the seeds' looks are in; your stand-ins can go (2026-10-30)

Answering your seeds note, points 1 and 2. The looks: `vfx/garden/seedplanetoids.js` (was `boughtplanetoids.js`, re-keyed to the seeds'
kinds, `drills` dropped), `seedskins.js`, `seedlooks.js` (`game.seedLooks`, installed in `boot/godhand.js` and updated in `boot/frame.js`
beside the lotuses: one line each), `seedpour.js`. None adds a program (measured, below).

1. **STAND_IN can go.** Until it does, my table reads your names as the seeds' kinds (`SEED_KIND_OF` in seedplanetoids.js: fossils is
   bone, moon is crystal, koi is coral). Tell me when it is gone and I drop `SEED_KIND_OF` in the same round.
2. **`PALETTE` and `paint()` can go too.** A seed's look keeps its own colours (`sTop`, `sLow`, `sRock`) and never reads `cTop`, `cLow`
   or `cRock`; `game.seedLooks` dresses each look from `orbit.planted` (kind, feeling, `tintOf(r.fed)`) on `seed.plant`, `seed.feed`,
   `garden.enter` and every half real second, so `addPlanet`'s `tint:` and the `paint(P.look, r)` after a feeding are no longer needed.
   (Your rebuild after a feeding now costs little: the skin is kept a vertex.)
3. **`ownMoon`: please make it its parent's kind**, `new Planetoid({ kind: SEEDS[r.seed].kind, radius: OWN_MOON.r, seed: 7, detail: 6 })`,
   with no `paint`. Today it is made a moonlet and my look re-kinds it (a second build and a `present.shade()`); with the kind passed,
   that path does nothing.
4. **The bodies beyond a sphere are yours** (Dovina's ruling: "spheres first"). Each is drawn over the sphere for now as a height a
   direction, so your `PlanetBody` stands on it as it is:
   - the bowl: a well at its crown 0.22 R deep with a lip; lived in from the inside needs gravity out from the heart on its inner face;
   - the ring: dished 0.36 R at both poles into a "hole"; walked inside and out needs gravity toward a circle (Galaxy's donut);
   - the crystal at large: a hollow at its crown 0.18 to 0.28 R deep, lined with points; standing inside a split geode with a roof needs
     a surface that is not one radius a direction;
   - the coral's arms are props (the Jar passes through them, as the Mulberry Grove's trees).
   When a body comes, `SHAPES[kind].body` can tell my look which, and I draw its true surface.
5. **What the pour reads** (casebook rule 282, so a rename tells me): `realm.orbit.pouring` (`{ id, m3 }`), `orbit.of(id).planet`,
   `realm.hand.hit.planet` and `realm.hand.point`, `game.god.hand.root` and `.tip`, `game.god.arts.matter.held`.
6. A new look's props stand on the look's own shape, not on `P.radiusAt`: in `regrow`, `P.radiusAt` still reads the old clay while
   the new look dresses (the clay is regrown after). Nothing for you to change; said so the next reader knows why.

Measured headless (the probe of 2026-10-30, every seed small, then all large with their own moons, a pour, a swell): the programs in
the garden the same before and after, 219 on the desk and 203 on the phone. The first run counted 219 -> 221: the launch lotuses'
warm-up recompiling from a rebuild in the frame when a seed adds lotuses (mine, fixed: casebook NEW:warm-once). At the wide view the
thirteen seed planetoids (six large, their moons, the seven moonlets) cost 41 draw calls and 181,750 triangles a frame, every pass;
of that the props are 27 meshes and 17,332 triangles, and the pour's two meshes are 2 draws and 1,208 triangles while it is seen.

Delete this note in your branch when done.
