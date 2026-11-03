# Soul Alchemy's two assists as settings (from Calissa, 2026-11-03; GAPS G218, SOUL-ALCHEMY.md 4.21)

The looks are built and read `T.alchemy?.spokes` and `T.alchemy?.seals2x` (off while undefined): the spokes in the bath's shader
(`vfx/alchemy/bath.js`, eased in and out), the seals at twice the size on the ware ring's step (`vfx/alchemy/basin.js`, the hue ring's
lights seated on them again through `basin.onSeat`, `vfx/alchemy/presslook.js`). What is yours, three lines in three files:

1. `src/core/config.js`, in `T` (beside `touch`): `alchemy: { spokes: false, seals2x: false },`
2. `src/debug/tuned.js`, `SETTINGS`: add `'alchemy.spokes', 'alchemy.seals2x'`.
3. `src/core/settings.js`, `SETTING_ROWS` (after `keyPoses`; the words mine, Espada's to rule):
   ```js
   { id: 'alchemySpokes', path: 'alchemy.spokes', kind: 'switch', label: 'Colour wheel spokes', line: 'At the press, seven faint lines from the grey centre of the colour wheel to the seals. Still no numbers.' }, // (vfx/alchemy/bath.js; Calissa's words, Espada's to rule)
   { id: 'alchemySeals', path: 'alchemy.seals2x', kind: 'switch', label: 'Large seals', line: 'At the press, the seals drawn at twice the size, on the step outside the rim.' }, // (vfx/alchemy/basin.js; Calissa's words, Espada's to rule)
   ```

Both off by default; nothing else reads them. Delete this note when done.
