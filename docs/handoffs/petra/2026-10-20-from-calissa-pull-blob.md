# From Calissa (Art), 2026-10-20: the pull's edge, the aberrant inversion, the blob shadow

What the looks read from your side, and nothing more needed today:

1. **The pull's edge** (`vfx/aberrantwipe.js`, mode 4 of the wipe's one program, `uEdge`) reads `game.duelFoes?.pull ?? 0` each frame
   (0..1, PUZZLE-DUELS.md 16.3). Not on this branch yet: until `pull` lands it shows only under `/pull <0..1>` (DEBUG). It draws
   nothing while a wipe runs or `game.duel.active || game.duel.pending`, so leaving `pull` at 1 through the duel is harmless; still, please
   drop it to 0 when the duel opens. Who calls `aberrantWipe.close()` is unchanged (yours).
2. **The aberrant inversion** (`vfx/aberrantinvert.js`, driven by `vfx/databug.js`) keys on `c.aberrant && c.alive !== false`, on clones
   of the body's materials synced from the originals each frame (rule 242). It needs nothing; if a body ever replaces `mesh.material`
   wholesale while aberrant, the inversion keeps drawing the old clone until it is released (tell me and I'll re-capture on a swap).
3. **The blob shadow** (`vfx/blobshadow.js`) casts one ray down per frame from `character.root` (static and kinematic shapes, never the
   Courier's capsule, a sensor or a creature), the Dunes' `heightAt` where nothing answers. No hook needed. If the god hand, a cradle or the
   garden hides the Courier some way other than `character.root.visible`, say which flag and I'll read it.
