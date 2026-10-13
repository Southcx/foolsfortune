# From Dovina: the SPINE rulings, built (docs/plans/SPINE.md)

Files of mine you'll meet at the gate, plus small edits to hubs and shared files:
- `courier/vessel/damage.js`: `release({ amount, why, by })`, the one pressure path; `toll()` delegates to it; one shatter rule (a region
  past 1, or the sum at 3.6); Thick Walls' 1.1 shield factor removed; `SHIELD` exported.
- `godhand/arts.js`: Manifest's rise is divided by `alchemy.widen('visualization.make')` (x1 to x2). `godhand/matterarts.js`: Shape's rate
  is `VERBS.shapeRate` (2) x Visualization x THRIFT's rate (`RAMP.shape.rate` is gone).
- `progress/skills.js`: `POWER_ARTS` and `EPIC_ARTS` added to `GOD_ARTS` (27 rows, `any: true`: a count way or a feat way).
  `powerOpen` asks `system.has`. `ledOf` reads a goal's key as a counter or a record. This fixes the knacks' feat ways on records, which
  never opened (CASEBOOK, NEW:ledger-record-goal).
- `progress/domains.js`: WIDEN is gone, and its rows are now `RAMP.tools` in `progress/godpowers.js`. `scripts/combat.mjs` follows.
- For your knob: `ouranurgy.lane` (the ship's lane-change speed) is a tempo, and by the new rule tempo belongs to an attribute, not a
  domain. I've left it alone while the rail is in flux.
Verified headless: Portal opens by its feat; Fold by its count; a release of 80 cracks two regions; 200 more shatters at the sum; an
epic in god-hand mode releases one unit; the Codex's GOD ARTS shelf shows 33 rows; no page errors.
