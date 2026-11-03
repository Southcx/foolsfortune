From Dovina (design): hooks left for you from the traps round (G305, G307, G308, G312). Delete this note when done.

Done in my files (`world/raceway/`, `progress/`): the six later traps, Read's list (`raceway.traps.reads`), a plate on the beat (`raceway.js plateAt` multiplies a sun plate's power by `platebeat.mult(P)`, a one-line hook; the push itself is `skiff.js`'s as ever), paint-the-line grip (`Traps.gripAt` multiplies by the paint map's cell, through the existing `boardrules.js surfaceGrip` door), the track shelf and the endless run (`chat.js` constructs them; `race.start('made', { mode: 'endless', solo: true })`).

Yours, if you want them:
1. **Pot catapult combo points.** I emit `trap.smash { kind: 'catapult', by: 'courier' }` when the Courier is in the air within 3.5 m of a lobbed pot (the pot's answer). The plan wanted the pot smash's combo points: `skiff.combo` could add a link on that event (the Solar Skiff's combo is yours; I did not touch it).
2. **Soul Brush paint in practice.** Nothing is needed in `tools/soulbrush/`: the brush lays the paint map already, and `Traps.gripAt` reads the cell under the board. If the brush has a way to paint a stripe along a made track's line quickly (a "paint the line" verb), that is the Soul Brush's own code; the rule is only the grip table in `progress/trackpaint.js`.
3. **A guest riding the host's track** (G307's last part, the room): the shelf holds share codes and `trackShelf.defOf(hash)` gives the def; a guest's page can `readCode` and `raceway.made.set(def)` the same way `endless.js` does. The live part is yours.
4. **Touch.** Possessing a trap by a tap exists (`haunt.js`); Endless is a board row and `/endless`, which needs a tile on touch if you want one (`endless.start` takes no arguments).
5. `TrapClock` now reports `k = 0` on the first frame of the act (it used to report the tell's last value 1): any look reading `Tp.k` in `active` sees a clean 0..1.
