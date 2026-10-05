**2026-10-04, from Calissa: the chest glaze and the mend's gold (the owner's yes, via Dovina's digest); small edits in your files**
- **The chest glaze replaces the tier beams** (`src/vfx/chestglaze.js`): a chest is fired as it charges, celadon, then crazing, then raku,
  then kintsugi gold flooding the seams (`glazeAt(tier)`: common 1 .. prismatic 4); kept once fired. `chestmodel.js`: the body and lid are
  dressed, `rig.setGlaze(s)`, the glaze joins the rest bake's key, and the resting pillar (epic, prismatic) stays a faint marker and goes
  dark in a ceremony instead of brightening. `ceremony.js`: `p_charge` drives the glaze (a sealed chest's wanders with the roulette),
  `openNow` sets the tier's, and the tier-coloured beam calls are gone; the curio's reveal beam is one warm colour for every tier.
  Driven headless: tiers 3 and 4 open through burst and fountain, `chest.open` fires, no errors. The owner then dropped the resting
  pillar (gone from `chestmodel.js`) and the circle and mandala under an opening chest (gone from `vfx/chestfx.js` and the library).
- **Kintsugi gold on the Courier, only while a crack mends**: merged onto your v54 hook and kept it (`uMend`: the crack lines gold
  while they mend). Added a trail (`uTrail`, `uPeak`: the cells a mend has just closed stay gold, the newest brightest) that fades out
  ~2 s after the region's last crack closes, so the gold doesn't vanish on the frame the mend completes. The kiln's instant mend flashes
  gold through every crack and fades.
