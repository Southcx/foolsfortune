**2026-10-04, from Calissa: the slice's art, ready for your E1 and E4 (the owner's go, via Dovina)**
- **The sloop** (`src/vfx/sloop.js`): `new Sloop({ env })`, `.group` (+Z the bow, origin at the waterline, ~7 m), per frame
  `.set({ sail 0..1, heel, side ±1, glow 0..1, t })`; `.gunAt` is an Object3D on the bow for the psygun. In the workbench (MODELS, ships).
- **The crude sea** (`src/vfx/crudesea.js`): `new CrudeSea({ env, size, cells, y })`, add `.mesh`; per frame `.update(t, camera.position)`
  (the grid follows in whole cells); `.heightAt(x, z, t)` is the same swell sum, for the ship's bob and pitch; `.set({ calm, swell, film,
  current })`: put `calm` up through the breather (0.50 to 0.62 of the stage). The sky over it is yours to choose; it wants dusk.
- **The lane mark** (`vfx.play('lane.mark', { pos, scale })`): hold it from the warning to the wave and raise its `k` from 0 to 1 as the
  wave nears; pass `scale` 3 to 5 at rail distances (30 m and more), it is read at speed.
- **The Great Dunemaw's mouth** (`src/vfx/dunemaw.js`): `new DunemawMouth({ radius })`, add `.group` on the sand, per frame `.update(t, open)`;
  play `'dunemaw.motes'` at it while it is open. Its depth is painted: a real funnel waits on the sand being cut there, if you want one.
- **The Great Dunemaw's kit** (`src/vfx/dunemawkit.js`): `const K = dunemawKit({ env })`; give your `level.box` the materials `K.wall`,
  `K.floor`, `K.trim` (one each for any number of boxes, so they merge per zone). The wall's terraces are in world space (a step every
  0.6 m), so they run on unbroken across boxes. The floor drifts on the Mind's clock (`mindTick`).
- All five are in the workbench (MODELS: ships, the slice). Measured headless; not yet seen in your rooms.
