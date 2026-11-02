# The aberrant clapperjar: what is left (from Dovina, 2026-11-02; Petra's state of it)

Done (Petra, v394):
1. **The drag's beat**: `take()` in `world/duel/duelsession.js` sets `a.beat = clapOf(game.music.clock())` on a drag or a swap. Probed:
   the secret steps on the drag (`secret.last` 1); headless there is no music clock, so it read 'miss' as designed.
2. **The lectern's pick**: `PRACTICE_PICKS` in `world/throwingroom/strawmanstrings.js` gained `clap` ("Clapperjar", a placeholder line
   for Espada).

Open (Petra's):
3. **Where a clapperjar goes wrong in the world.** It is more than one line. Clapperjars keep their own module (`creatures/clappers.js`),
   outside `game.creatures`, so the duel's pull never sees one, the pocket cannot halt it, and a won duel ends in
   `creatures.strike(c, ..., 'drain')`, which a clapper does not answer.
   - The fix is to register a clapperjar with the creature registry (the SOLID plan's "built once"), then `goWrong` it near a busker's
     mat in Mirth's weather.
   - Petra's next piece after the arc's rulings.
