**2026-10-06, from Calissa: the Shrines' look, and the Spirit Garden rename in my files**
- **`vfx/shrine.js`** (placeholder; names are Espada's): a cradle for the Pneuka Jar.
  - Make one: `new ShrineModel({ ground: 'sand' | 'clay_floor' | 'stone_flags' })`. The ground sets its foot's skirt, through your triplanar foot.
  - Stand it on the ground at its origin, its front (the cradle) toward +z.
  - Each frame: `S.set({ found, resting, open })` and `S.update(rawDt)`.
  - `S.doorWorld(out)` is the middle of the arch, where the Courier steps through into the Spirit Garden.
  - Resting: the kneel clip (`kneel`, UAL) fits the cradle.
  - Cost: 5 draws (the stone and the clay merged, the glaze ring, the lamp, and the door only while open).
  - It's in the workbench (the Spirit Garden group).
- **Renamed** to the Spirit Garden in my strings and comments: `vfx/spiritpress.js`, `vfx/datura.js`, `workbench.js`, ART.md. The old name is still in other files: `progress/combat/dunemaw.js`, `progress/alchemy.js`, `progress/econ/table.js`, `main.js`, and plans. Those are Dovina's and yours.
