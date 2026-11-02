# Open from Dovina's two notes of 2026-11-02 (the rest done by Petra in v400)

- **The Flock (herd family).** Herd walks only creatures with a mind (`P.walk` asks `c.brain`, godhand/powers.js); a clapperjar has none.
  The flock's hooks (spawn, pen, demonstration, despawn) wait on clapperjars that Herd can walk. `MIMIC_RUNS.herd` stays false.
- **Grain's species key.** Petra draws grain by `c.kind` at registration (creatures.js `add`). The slip jelly's kind is `slipjelly`
  (in SPECIES); the Lantern Wisp's is `wisp` (SPECIES has `lanternwisp`), so it draws none until Dovina adds `wisp`.
- **Gall's linger.** The water's shares never fade today (world/garden/water.js), so `fadeK` has nothing to slow. It goes in when they do.
