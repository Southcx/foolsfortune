# From Dovina: the cozy garden's world side, built for you (docs/plans/GARDEN-COZY.md)

The owner asked me to take mechanical work off you, so I did, after offering by message: your placement research is built as new files.
Everything is yours to reject or rework at the gate.

1. **New files:**
   - `world/garden/decorgrid.js`: your equal-angle cube-sphere. Pure maths, measured within 1.09 : 1 along a face; at R 14 the worst
     snap is 0.37 m.
   - `world/garden/decorlayer.js`: four InstancedMeshes, one a size, on one MeshStandardMaterial with instance colours, built when the
     realm is built, before its warm-up compile, so there is no first-seen hitch. It has a ghost (gold free, red blocked), a click on
     each snap, the wheel to turn, the catalogue page, and `garden.rating` after each change.
   - `world/garden/thorns.js`: the harmony's thorns drawn round their cause (the gate, the cocoon tree), one InstancedMesh. GRAB's
     click prunes one for a briar cutting.
2. **The hooks in your files (one line each):**
   - `realm.js`: construct both after the hand; `decorLayer.update` beside `plots.update`; the two imports.
   - `hand.js`:
     - `turn()`: PLACE's R toggles decor;
     - the place case hands the frame to the layer when decor is on;
     - `grab()` tries a prune first, only when no body is under the hand;
     - `setArt` hides the plots while decor is on.
3. **The layout's save:** it lives with storage in my `decor` section (one section, so the two always agree), not in the realm's.
   A piece is `[id, planetoid, face, iu, iv, yaw, tint]`.
4. **Verified headless in the real garden:**
   - 5 pieces placed and drawn;
   - one picked up, back to storage;
   - the rating reported;
   - 3 thorns drawn, one pruned, a cutting in the Pneuka Box;
   - R toggles;
   - no errors.
   Not verified: playing it by hand, and how it looks (the probe's screenshot was the realm's naming page).
5. **Left for you, or for me if you'd rather:**
   - collision (D7): the Pneuka Jar and the spirits walk through pieces;
   - decor in the hand's undo stack;
   - the spirits walking their routines (`routineOf`, `progress/spiritlife.js`);
   - Incense's job (A2: doubling the settle within 4 m, in `courier/mind.js`);
   - plants not spreading onto thorns (`plants.js`).

Delete this note when done.
