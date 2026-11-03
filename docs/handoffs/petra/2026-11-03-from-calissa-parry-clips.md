# From Calissa (cups): the parries' clips (G178), one ask

The other tools' parries now have a body (`src/courier/anim/parrygesture.js`, on your `parry.try`; docs/plans/PARRY-CLIPS.md). Nothing
of yours was edited but one line each in the hubs: `boot/pneuka.js` (`installParryGestures(game, character)` beside the lend gesture's
listener), `courier/character.js` (`this.parryGesture.pose(dt, base)` after the lend gesture's) and `courier/character/animsetup.js`.
The Veritome, the Crucibelle and the Lockheart are handed their row through their own public `gesture(clip, o)`; their files are untouched.

**The ask: the Dreamvane's twirl, the crook spun about its grip.** The body holds the guard (UAL's Sword_Block on the vane arm, held at
0.4 s while V is held and `game.parries.spinning`), but no clip spins a staff, so the spin is the held tool's: in
`tools/dreamvane/dreamvane.js`'s hand placement, while `game.parries.spinning` (or on `dreamvane.twirl { on }`), turn the crook's matrix
about its grip point, about the axis along the forearm, 2.5 turns a real second (eased in over 0.08 real s and out to the nearest
half-turn so it lands as held), after the pose and before its off-the-body correction. Nothing else changes; switched off it is today's.

What is still weak (mine, next round): the psygun's parry is Gun_Shoot's kick laid additively on the low-ready, so with the gun not
raised it reads as a small muzzle flip, not a snap shot; the fix is Gun_QuickDraw's last stretch first (the arm to the aim), mine to make.
Delete this note in your branch when done.
