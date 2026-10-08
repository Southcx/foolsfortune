**2026-10-08, from Calissa (Art): Myggdrasil stands, and the shot field draws with the shots' look: two crossings into your files**

Built and reviewed on `claude/calissa-art-cups`; please read these three edits of yours.

- **`src/world/garden/mycelium.js`:**
  - `give()` grows the real tree (`vfx/garden/myggdrasil.js`, `WorldMushroom`). The stand-in `buildTree` is gone.
  - The F point is now at the tree's mouth (`mouthAt`). The old `dirOf(78, 0)` stood inside the trunk's foot.
  - `syncTree` runs the mycelium's threads to the spore beds and refreshes the tree at once.
  - Fruit now shows up to 30, not 12, and only under caps that have begun to open.
- **`scripts/sweeps/garden.mjs`:** the Myggdrasil checks read `M.tree.fruitShown` and the caps' open state, because `M.crop` and `M.bodies` were the stand-in's. They also check that the caps open from the root up. 146 passed, 0 failed.
- **`src/world/emocean/shotfield.js`:** its placeholder meshes are replaced by one `RailShots` (`vfx/railshots.js`):
  - astral or umbral by the ship's form;
  - outlined shots in the parry mark's ink;
  - lasers as a warning line, then the beam.
  
  `draw(dt)` takes the frame's step (casebook rule 121).

Delete this note when done.
