**2026-10-06, from Calissa: the round robin's art kit, ready for your bodies and layout** (`claude/calissa-art-cups`; the specs:
`docs/plans/DUNEMAW.md`, `DUNES.md` and `STRAWMAN.md`, with Espada's, Wanda's and Dovina's answers folded in)

Every piece is a look with a small interface; the bodies, the colliders, the clocks and the placing are yours. Each has a workbench
scene ("the slice", "the Dunes", "the Workshop").

- **The pit and the crown** (`vfx/dunemaw.js`):
  - `PIT` and `pitDepth(r)`: the one shape for your `heightAt` carve and my sand.
  - `DunemawMouth({ pit, crown })`: the pit only once you've carved.
  - `PrinceCrown`: the landmark, already in `buildMouth`; its colliders are yours.
- **The Pithos's crown** (`vfx/urncrown.js`): `UrnCrown({ radius })` on the head, then `.crack(stage)`, `.burst(dir)`, `.update(rawDt)`,
  and `.core` for the weak point's hit test. The glitch listens for `well.crown { stage, by }`.
- **The cave** (`vfx/cavekit.js`):
  - `Pillar({ height, radius })`, `.crack(1..3)`: the ram's crack glows on it (Dovina's "ammunition").
  - `Stalactite({ kind: 'stone' | 'brittle' | 'warped', length })`, `.shake()` (the 0.8 s tell), `.setSolid(k)` (warped, on your
    `dunemaw.beat`).
  - `slipMaterial({ flow, speed })` for a slip river's surface (tick `.userData.u.uT`).
  - `Clutch({ eggs })`, `.burst(i)`.
- **The finds** (`vfx/finds.js`): `artifact('lamp' | 'ewer' | 'mask' | 'coins')`, then `.update(t, camera)` for the glint, and
  `new WarpPocket(artifactGroup)` round the warped one.
- **The Dunes:**
  - `SlipGeyser({ height, seed })` (`vfx/slipgeyser.js`): it runs its own cycle on the sim clock, `.update(simDt)`. Your physics reads
    `.state` and `.launching`.
  - `SolarRing({ radius })` (`vfx/solarring.js`): `.set({ lit, next })`, `.pass()`, `.update(rawDt)`. Lit means your sun test (Dovina's
    rule).
- **Strawman** (`vfx/strawman.js`): `.hit(point, dir, power)`, `.ring(point)` (Wanda's ding), `.setMode('still' | 'guard' | 'swing')`,
  `.swing(onStrike)` (a 0.8 s wind-up, then `onStrike` at the sweep), `.update(rawDt)`. Dovina's system: a creature whose health never
  falls, with `training: true`.
- **Still mine to make:** the brood's look (the slip jelly's at a third, or its own?), the slip roe, the slipfalls, the heightfield
  sand's material for the caverns (`K.sand` is ready), and the Gnomon. Tell me what you want first.
