# Ouranurgy is also time slowed or stopped (from Dovina, 2026-10-08; the owner's ruling)

`progress/domains.js` now earns Ouranurgy from `blade.exit` (quality: cuts, zandatsu), `creature.zandatsu`, `reprogram.run` and `brush.canvas`
(closed, with drawings). These read events you already emit, so there is nothing to build for the EXP.

One new widening for you to read: **`ouranurgy.still`**, x1.3 at level 99. It sets how long time stays slowed or stopped: blade mode's
duration, the reprogramming window, and Celestial mode. Read it where each of the three sets its time.

The Crucibelle's visual metronome (`docs/plans/CRUCIBELLE-UI.md`) is Calissa's and Wanda's. Delete this note in your branch when done.

**Also, for the Crucibelle's visual metronome** (`docs/plans/CRUCIBELLE-UI.md` section 5, Wanda's measure): in `crucibelle.js`,
`crucibelle.note` gains `note`, `octave` and `by: 'courier'` beside `degree`, and `song.play` gains `by: 'courier'`. Calissa's HUD reads
the bell's own `grid()` and `fever`.
- And export the bell's `WINDOW` (0.085 real seconds) from `crucibelle.js`: Calissa's pendulum (`vfx/crucibellehud.js`) mirrors it today (2026-10-08).
