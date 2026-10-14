**2026-10-14, from Dovina: the Raceway, round 3 (claude/dovina-design; docs/plans/SKIFF-RACING.md section 9)**

The owner asked for four of these by name: **bigger carve sparks**, **the flare and the boost glow in Lachryma's colour** (it is
Lachryma-fuelled: `boat.js` energyMat/clothMat glow, and your carve and plate looks where they show the push), **a mark when a pop is
nailed**, and grabs that look like grabs. The rest is what the new parts need to read. Placeholders are mine and named below; replace
them freely.

1. **Carve sparks, bigger** (the owner, after his first race): `skiff.carve.charge { tier }`, `skiff.carve { tier }` as now.
2. **Lachryma-coloured boost**: the flare (Shift), the turbo of a carve, plate, ring or solar start (`skiff.boosting` 0..1 is both).
3. **The perfect pop**: `skiff.pop { late: true, perfect: true }`. Placeholder: a star glyph pop on the board (`skiff.js`, colour
   0x7fdcff, `LACHRYMA_TINT`). A missed one is `skiff.pop.miss { late }` if you want a dud puff.
4. **Grabs**: `skiff.grab` (held: `techs.get('skiff').grab = { kind: 'nose' | 'tail' | 'double', t }`; let go: `skiff.grab { grab,
   seconds }`; landed still holding: `skiff.grab.late`). Placeholder: the whole board tweaks (`GRAB.tweak` 0.3 rad, nose or tail down,
   rolled for the double). Wanted: the rider's hand to the board's rail (IK, a light correction) over the air pose; the tweak can stay.
5. **The trick combo's gauge and the banked flares** (no words, no numbers): `skiff.combo { kind, n, points, mult }` per link,
   `skiff.combo.bank { points, n, mult, stocks }`, `skiff.combo.drop { why }`; live state `techs.get('skiff').combo` (`.n`, `.total`,
   `.mult`, `.t` the link's clock out of `COMBO.link` 2 s, `.stocks` 0..3). The F3 label shows BANKED for now.
6. **Sun plates by the sun**: `raceway.sun` (0..1; 0 at night). `skiff.plate { plate, power }` (power 0: a dark plate ridden).
7. **The cavern** (`world/raceway/cavern.js`): the roof slabs, stalactites and crystals are placeholder meshes (`raceway.cavern.mesh`,
   `.crystals`); the crystal veins are `raceway.plates` with `line: 'cavern'`, `vein: true` (your plate dress picks them up as sun plates
   by their mesh: they want their own look). Its edge strings: `raceway.edgeLines(step, 'cavern')`; while in it `raceway.line` is
   'cavern' and `raceway.sb` its place along it (`raceway.s` is then the main line's place it stands for). It wants its dark, and the
   weather's rain kept out from under the roof.
8. **Dread's fog**: `raceway.condition.fog` (0..1).
Delete this note when it is merged.
