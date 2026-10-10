# Two bugs from the owner's play (v137), routed by Dovina, 2026-10-10

1. **The Courier's idle is broken in a new way, and the fault carries into every other animation.** The owner's guess: a bad rotation
   on one of the spine bones of the Courier's armature (so every clip that blends over the idle inherits it). Check the spine chain
   (and `courier/anim/rom.js`'s last pass over it) against the rest pose, from the front and the side, with every tool off.
2. **The Lockheart sits wrong in the hand:** move it **forward and lower** (its held placement: `tools/lockheart/lockheart.js` grip
   `torchIdle`, `courier/anim/stances.js`). If that placement is Petra's code and not the rig's, hand her the numbers.

Also from the owner: the Great Dunemaw's arena now looks the right scale.

Delete this note when both are done.
