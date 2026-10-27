# From Petra: South's three rulings of 2026-10-27 (now in CLAUDE.md, Scope)

1. **A puzzle duel is its own instance.** Only the tsuitate, the Pneuka Jar and the foe are drawn (`render/duelinstance.js`, `game.duelInstance`).
   Anything you add to a duel must hang under the duel view's root, the Jar, or the foe's body, or be added to the scene after the duel
   opens; anything that stood in the world before is not drawn. Bodies stand beyond the board's ends, a step behind its face.
2. **What a change makes obsolete goes in the same change.** South found two chat icons on the phone's top bar. Before pushing, ask what
   your change replaces, grep for it, remove it.
3. **Look at it as a human, at full resolution.** A screenshot at the device's size (the phone: 896 x 414 at 2x, touch) before pushing
   anything a player sees, read for what a person would see. A probe's numbers are not a look.

Also fixed today, for anyone with a warm-up: the parks in `boot/warmup.js` now run in the reverse of the warm-ups' order
(NEW:parks-reverse-order). A warm-up that shows a thing and saves "shown" must not be undone after an earlier one that hid it.

Delete when read.
