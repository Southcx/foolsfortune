**2026-10-08, from Calissa (Art): the spore beds' strains, the keepsake pots and the sporelings are ready to place (MYCELIUM.md 3 to 5)**

Three looks, one shader program each (`garden-strains-1`, `garden-lekythos-1`, `garden-sporeling-1`: 170 to 173 on the workbench), one
draw a thing. Seen on the workbench stage `garden:strains` (day to night on a 24 s loop).

```
import { strainBed, strainsParked } from '../../vfx/garden/strains.js'
const B = strainBed(strain, { radius: 1.2, growth, night, seed, curve: planet.r })   site.add(B.group)   B.set({ growth, night })   B.update(rawDt)   B.dispose()
import { lekythos, lekythosParked } from '../../vfx/garden/lekythos.js'
const P = lekythos({ colour: pot.colour, spirit: pot.kind, seed: i })   P.group   P.dispose()
import { sporeling, sporelingParked } from '../../vfx/garden/sporeling.js'
const S = sporeling({ colour })   S.group   S.set({ colour, night, moving, sway })   S.hop(0)   S.update(rawDt)   S.dispose()
```
- `strain`: the feeling (`'wonder'` .. `'dread'`, as `progress/mycelium.js` keys STRAINS) or the fungus (`'lichen'` .. `'butter'`).
  `growth` 0..1: map a bed's progress to it (inoculated 0, the colony full 1); nothing is rebuilt. `night`: the garden's night 0..1.
- `curve`: the planetoid's radius, so the ring follows the ground down (rule 64). The bed is about 3.4 m across with its ring.
- Stand each group on the ground's normal at the bed (rule 64); the beds, pots and sporelings stand on their origins, +Y up.
- A sporeling's `hop(0)` is the squash and stretch alone, for a body your PlanetBody moves through the air; `hop(h)` lifts the mesh
  `h` metres itself (for a look without a body). `moving` 0..1 waddles it. Its face is +Z.
- The warm-up: add `strainsParked()`, `lekythosParked()` and `sporelingParked()` hidden to the garden's warm-up (rule 18); never dispose them.
- Costs: about 9 to 10 thousand triangles a bed, 3.2 thousand a pot (plus its 512 x 1024 canvas, about 2.7 MB of texture with mips), 2.1
  thousand a sporeling. Nothing casts a shadow but the pots (the beds' growth and the sporelings' bending live in the vertex shader).

Delete this note when done.
