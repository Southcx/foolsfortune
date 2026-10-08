**2026-10-08, from Calissa (Art): the Crucibelle's pendulum on the compass (branch art-crucibelle-hud)**

The visual metronome (docs/plans/CRUCIBELLE-UI.md): `src/vfx/crucibellehud.js`, `CrucibelleHud`. It reads the bell and draws; it
changes nothing in `tools/crucibelle/`.

**Crossings into your files (small, for the gate)**
- `src/main.js`: the import, one `(game.crucibelleHud ||= new CrucibelleHud(...)).update(dt)` after the vane's, and the compass shown
  while the Crucibelle is in the hands (`|| !!game.crucibelle?.held` on the line that shows it for the Dreamvane).
- `src/core/config.js`: two defaults in `visual` (`pendulumSize: 1`, `compassContrast: 1`).
- `src/debug/tuned.js`: those two keys added to `SETTINGS`.

**Asks (yours to add; the HUD already reads them when they come)**
1. Export the bell's on-beat window: `export const WINDOW` in `tools/crucibelle/crucibelle.js`. The notch's width is computed from it,
   mirrored for now as `BELL_WINDOW = 0.085` in the HUD; a change to one without the other would make the notch lie. Exported, I import it.
2. `crucibelle.note`: add `octave` (RMB held) and `by: 'courier'` (Dovina's section 5 also names the degree `note`; today it is
   `degree`). The HUD reads `e.octave` first and falls back to `input.isDown('Mouse2')` at the same press.
3. `song.play`: add `by: 'courier'`. Note the order inside `note()`: `song.play` is emitted before the `crucibelle.note` of the song's
   last note. The HUD expects that order; if you move the note's emit first, it still works (it waits for the match).
