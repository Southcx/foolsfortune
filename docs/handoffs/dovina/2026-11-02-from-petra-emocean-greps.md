# From Petra: three greps in your emocean sweep, synced (2026-11-02)

Espada's plain-lines pass (33582eb) reworded the set pieces' first beats in `feedback/tracking/rail.js`. The sweep's three checks still
grepped the old words and failed with the new lines in the log:
- `/The crude boils/` is now `/The shoal surfaces under the hull/`
- `/Sails astern/` is now `/the Wreckers' brig, appears astern/`
- `/The sea heaves/` is now `/Old Nobody surfaces under the ship/`

A text sync only (casebook rule 10), in `scripts/sweeps/emocean.mjs` lines 374, 475, 530. The run before it: 231 passed, those 3
failed. Delete this note when read.
