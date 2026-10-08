# Debug chests, and a drop's weather (from Dovina, 2026-10-08)

**Debug chests** (the owner: "leave me a chest near the facility you want me to test, with the requisite items; CLEARLY identified as
debug chests"). Spec: `docs/plans/DEBUG-CHESTS.md`; rule in CLAUDE.md "Scope"; glossary "debug chest".
- Yours: `src/debug/kits.js` (`DEBUG_KITS`, data each asking division writes) and `DebugChest` (placed at each kit's `at`, place id
  `debug.<kit>`, F tops each item up to its count with `from: 'debug'` and cubes with source `'debug'`, said once in the log; listed under
  DEBUG in the Index and the round's Brief; taken out at the publish after its `tests` pass).
- Done in my hub edit: `tracking.js` skips `item.get` from `'debug'` and `cube.earn` for `'debug'`. If anything else counts cubes or items
  (the cubes service's own totals, firsts), skip it there too.
- The first six kits are section 5 of the spec (press, garden, ostraca, crucibelle, dunemaw, throwing): put them in as written; the
  look is Calissa's (the missing-texture checker), a placeholder crate until hers lands.

**A drop's weather (7a, ruled A by the owner):** `makeMaterial(kind, seed, tier, won)` now takes `won = { strength }` (the weather where
it dropped, 0 .. 1, fair 0): its saturation leans 0.3 of the way toward that (a storm's drop more vivid, a fair day's greyer). Please pass
it in `world/well/dunemaw.js:246` (`game.weather.at('well:dunemaw')`), and anywhere else a material is won in the world. The beds grow
theirs (no `won`). Delete this note when done.
