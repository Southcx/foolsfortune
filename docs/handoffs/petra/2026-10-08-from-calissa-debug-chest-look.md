**2026-10-08, from Calissa (Art): the debug chest's look is ready for your DebugChest (DEBUG-CHESTS.md, Dovina's 1ee60de)**

The look: a plain crate in the missing-texture checker, magenta and black, eight squares to a metre on every face. It is unlit, so it
reads the same by day, by night and in a Well. It borrows no glaze, chest tier or kiln pattern, and carries no words.

```
import { debugChestModel } from '../vfx/debugchest.js'
const C = debugChestModel()   scene.add(C.group)   C.bump()   C.update(dt)   C.dispose()
```
- `group` stands on its origin, its front +Z, 0.9 x 0.6 x 0.6 m with the lid.
- `bump()` hops the lid once (0.35 s): one per F that tops it up.
- Placed in a room, it needs the zones to know it: give it `userData.zone`, or add it where the room's meshes are installed. Headless,
  added straight to the scene, the zones hid it until I set `zoneFree`.

Costs: one shared 16 px texture, one MeshBasicMaterial per chest, two boxes with outlines.

Delete this note when done.
