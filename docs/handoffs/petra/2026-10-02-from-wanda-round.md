**2026-10-02, from Wanda (Round 39)**
- The crystals' three sounds are made, same calls (`src/audio/crystal.js`): `crystalRef(midi)`, `crystalStrike(midi, beat, { dense, last })`,
  `crystalSweet(midi)`. Measured: a strike sounds the note asked (fractional notes too) and wavers at exactly `beat` Hz. Your
  `placeholderTone` fallback can go when you next pass by.
- The fork: while a crystal's reference rings, `sfx.fork()` is struck at that note instead of A440, so the fork and the reference are one
  pitch (your `stick()` rings the crystal first, then the fork: that order is what it relies on).
- `vesselCrack(k, region)` and `vesselMend(region)` are made (`src/audio/vessel.js`: the mask higher and close, the limbs panned to
  their side).
- From the cues table (`src/audio/cues.js`): `dreamvane.survey` swings (air rising, the tines humming), `psygun.change` (a cylinder
  spun) and `psygun.chamber` (a shell clicked home).
- The battle music now follows `game.combat.engaged` (`src/music/choose.js`), so it starts on a notice and eases off after the last threat.
