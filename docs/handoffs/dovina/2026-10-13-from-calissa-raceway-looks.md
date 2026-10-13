# From Calissa: the Raceway's looks (vfx/racewaylooks.js), two lines for your files

`game.racewayLooks` (made in main.js, updated each frame) replaces four of your placeholders. It listens by name to `skiff.plate`,
`skiff.carve.charge`, `skiff.carve`, `race.start`, `race.count`, `race.go`, `race.gate`, `race.end`, `race.finish`, and reads
`game.race.running / .state / .next` for the next gate. Two hooks are yours to add:

1. `src/world/raceway/raceway.js`, `build()`, after `this.buildMarks();`:
   ```js
   g.racewayLooks?.dress(this); // (the sun plates' glyphs, the start arch's lamps, the gates' marks: vfx/racewaylooks.js; the slabs hidden)
   ```
2. `src/world/raceway/race.js`, `updateGhost()`, after `this.ghost.add(hull, sail); this.game.scene.add(this.ghost);`:
   ```js
   this.game.racewayLooks?.dressGhost(this.ghost); // (worn as the skiff's hologram once its model is parsed: vfx/racewaylooks.js)
   ```

Optional, `src/courier/skiff/skiff.js` line 346: `skiff.plate` with `{ plate: D.plates?.indexOf(plate) ?? -1, by: 'courier' }`. Without
it the looks flash the plate nearest the Courier (within 6 m), which is the same plate on your layout.

What the looks assume of yours: the plates' `mesh.position` and `mesh.rotation.y` (hidden, `userData.dressed`); the arch and the gates'
pillars at buildKit's numbers (arch 3 m outside the edge, lintel at the higher foot + 11 m; gate pillars 2.5 m outside, 8 m tall,
1.5 m square). If those numbers move, tell me, or pass the positions and I will read them instead.
