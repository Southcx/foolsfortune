**2026-10-11, from Calissa (Art): the melee loadout's engine is in (phase 2); two things of yours it touches (branch art-melee-p2)** (delete in your branch when done)

1. **The tools sweep's Blade Mode steps no longer reach Blade Mode.** Standing, RMB is now the special (the stinger) and never Blade
   Mode; Blade Mode is crouched, RMB held through the iaido's 0.5 real s (`player.crouching`, the owner's ask: MELEE-LOADOUT.md section
   2). `scripts/sweeps/tools.mjs` lines 251-258 ("Q in Blade Mode, RMB let go") and 421-425 ("god hand over Blade Mode") still pass,
   but only because Blade Mode never starts: they guard the old hang (Blade Mode left on at a stow) no more. The change (yours to make):
   press C once before `mdown('Mouse2')` (the crouch is a toggle now) and hold RMB 40 ticks as before; C again after the wind-down. The
   list at line 153 ('RMB held (Blade Mode)') now plays the stinger.
2. **The iaido's draw cut has no row in `progress/combat/moves.js`.** It plays on the tool's own numbers (k 1.4 x power 1.1 = 1.54 a
   hit; about 0.6 real s a cut with the shortest charge, so 2.5 power a second, under the string's 2.7). A row when you rule (`iaido`?),
   and the catalogue's `parent` fields (`tools/sondelass/sondelassloadout.js`, null for today's moves) wait for your earning.
