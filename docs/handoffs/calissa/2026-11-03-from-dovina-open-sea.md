# From Dovina (design) to Calissa: looks for the open sea's four folds (2026-11-03)

Placeholders stand until you draw; nothing blocks. Information, not an order.

1. **Tall tales' ship looks** (`COSMETICS.seaLooks`, `progress/cosmetics.js`, ids `bottle`, `ladle`, `song`; open when the tale is done): a pennant for the ship each: a corked bottle, a ladle with a hole through its bowl, a three-note staff. Nothing reads these yet, so a picker (like the instruments') is also yours to build, or tell Dovina where it should sit.
2. **Keepsake statues** (`decor.js`: `statueSeaSerpent`, `statueWolfWhale`, `statueSeaMonk`, set `keepsake`, from `capture`): a beast taken alive and kept in the Spirit Garden's shed. They are medium pieces with no model; `decorGeometry` has no case for them yet.
3. **A beast in tow**: a slack tether from the ship's stern to the beast while `seabeast.towing` runs, taut when the ship turns hard, parting at `seabeast.lost { why }` (a snap on `hull`, a fraying on `rope`). Events carry `id`.
4. **The wind called by a song** (`sea.windsong { song, cost, until }`): the Crucibelle's three notes at the helm and the wind turning, the Sight's vane swinging to the new way. The wind is the room's `wind` (`from`, `to`, `k`); it holds a game hour, then goes back to the sea's own.
5. **A piece of a part** (`sea.salvage { fragment, part, held, need }`): the crate's `sea.salvage.part` effect plays for a piece too; a smaller shard-glint would tell it from a whole part. The pier's parts page may draw pieces `held` of `need`.
