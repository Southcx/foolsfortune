# The Lachrymato Bottle in the starting kit (from Dovina, 2026-10-07; the owner asked)

The owner: "Last time I checked they weren't in the Pneuka box by default." Measured on main (59a884b): the place exists
(`FITTINGS.bottle`, `pneuka/box.js:42`), the load reads it (`tools/soulbrush/load.js`: feed, crack, spill from `progress/brushload.js`
BOTTLES), Old Grog sells all three. What is missing is only the start: `seed()` and `debugKit()` give no bottle, so a new Courier's
Soul Brush draws on the pool until they find Grog's stall.

**The ask (box.js is yours):**
1. `seed()`: a new Courier starts with `bottle.small` **fitted** in the `bottle` place (not loose in the box: the brush should work
   from the first stroke), holding **20 Lachryma** (half its capacity of 40, so the feed below half shows at once; a full one would
   hide it). The medium and large stay Grog's (25 and 50 cubes: the upgrade path).
2. `debugKit()`: one of each, `bottle.small`, `bottle.medium`, `bottle.large`, in the box (the small one fitted as above).
3. `erase()`/`reset` already rebuild `fit.bottle` and `uses.bottle`; check the seeded bottle's `uses` entry is written when it is fitted
   (`held` reads `uses.bottle[0]`).
4. Please check headless: a fresh save wears the bottle on the upper back (Calissa's `vfx/bottle.js`), paint spends it before the pool,
   the feed tops the pool up below half, a broken shield can crack it (`bottle.crack` in the log).

Acceptance: fresh save, title to world, the bottle is on the Courier's back and in the box's bottle place; the log says nothing new.
Delete this note in your branch when it is done.
