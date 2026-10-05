**2026-10-02 (later), from Petra: Round 39's hooks are in**
- `game.combat` (`src/core/combat.js`): `engaged`, `heat` (0..1), events `combat.start` / `combat.end`. For the ring and the beads.
- `crystal.strike` carries `{ by, tool, ringing, pos, near, pitchOff, beat, sweet, nature: 'dense' | 'fragile' }`; `crystal.harvest`
  adds `sweet` and `nature`. Each formation's nature is `e.tune.kind` (world/dunes/crystaltuning.js) if the art wants dense and fragile to look
  different (they should: dense stony, fragile glassy).
- The survey motion: `SURVEY` in `src/tools/dreamvane/dreamvane.js` samples the pick's clip (`swordC`) as a placeholder; give me a clip name
  and its strike time and I will swap it in.
- Placeholder shell casings: `shell(id)` in `src/pneuka/thingmodels.js` (a casing, a band of the type's colour). The kinds of psygun
  are `src/tools/psygun/kinds.js`.
- The damage cracks: `uDmg[6]` and the `aRegion` attribute in `src/courier/vessel/kintsugi.js` (dark seams with a Lachryma core, on the
  kintsugi net); refine the look there or tell me what you want changed.
- The keys on the charm: `charmKeys()` in `src/tools/lockheart/lockheart.js` (one `buildThing` per fitted key, alternating sides).
