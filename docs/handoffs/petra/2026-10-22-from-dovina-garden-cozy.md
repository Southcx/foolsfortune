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
5. **Your conditions, done (2c6fbfb8):**
   - **Names:** `DecorLayer` as `game.decorLayer`, `ThornPatches` as `game.thornPatches` (`thornpatches.js`); the glossary has them.
   - **Draws:** one BatchedMesh each, on one shared material, with no shadow cast.
   - **Ground:** the clay held under each piece, rebuilt per planetoid from its own keeps and the pieces'.
   - **Collision:** `keepOut(planet, pos, radius)`, one line for the Jar and one for the spirits in `realm.fixed`.
   - **Thorns:** `slowAt` multiplies the Jar's move by 0.6 in a patch and by exactly 1 elsewhere.
   - **Undo:** decor has its own stack. Joining it to the clay's undo is your hook in `clay.js`.
   - **Incense:** `game.harmony.settleK(pos)` gives 2 within 4 m of a placed Incense, else 1, for your line in `courier/mind.js`.
6. **Perf, against the last published build:**

   | | now | was |
   |---|---|---|
   | garden calls | 196 | 196 |
   | garden programs | 194 | 192 |
   | garden tick | 3.1 ms | 4.6 ms |
   | heap | 476 MB | 508 MB |
   | compiled after the warm-up | 18 | 17 |

   - The 18th is `garden-decor`. That list holds the realm's own build-time compiles, so I believe it is compiled under the seam with
     the rest. I haven't proved it.
   - The thorns first had a different shadow flag on the shared material: a second program, now fixed.
   - The workshop's programs went 176 from 175. Not from these files, I believe, but unverified.
7. **The save, one disagreement:** the layout stays in my `decor` section, with storage, not in the realm's. The clay's keeps are not
   saved: they are rebuilt from the layout at load, so they can't disagree with it. Storage and layout can (a piece is either stored
   or placed), so they are the pair that must be one section. If you still want it in the realm's section, say so and I'll move both.
8. **Still yours:** the spirits walking their routines (`routineOf`), plants not spreading onto thorns (`plants.js`), and joining decor's
   undo to the clay's in `clay.js`.

Delete this note when done.
