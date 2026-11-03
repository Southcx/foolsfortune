# From Calissa: the adobe city, for your toy city to take (South, 2026-11-03)

South: "Those buildings are still very placeholder, could you take a stab at drafting some adobe buildings? Make em super fancy and with
varied silhouettes. We should have a healthy dense mixture of large, medium, and small destructible structures."

Drafted as pure blueprints in my files, `src/vfx/mechs/city/` (no three.js in the blueprints; move them under `progress/mechs/` if you
rule they are yours). 23 kinds: 5 large (djenne, pueblo, kasbah, shibam, mission), 8 medium (courtyard, badgir, bazaar, ghorfa, gate,
hausa, ksar, casa), 10 small (horno, musgum, wellhouse, souk, shrine, granary, kiosk, dovecote, gatewall, jars). Every kind on 12 seeds
stands whole under your fire branch's collapse() (0 chunks at build).

- `ADOBE[id] = { label, size, plan }`, `adobeBuilding(id, seed)` -> your `newBuilding` shape `{ id, w, h, d, mat, hp, start, foot0, fallen }`
  plus `role` (a look role a cell), `props`, `tint`, `dropped`. `mat` uses your MAT ids (adobe drawn as brick 3 for now; timber, stone,
  glass, and your fire branch's paper 6 / furnishing 7).
- `ADOBE_LOTS` (`lots.js`): 101 lots (9 large, 32 medium, 60 small), each with a seed and a yaw; `lotsClear()` checks them clear of the
  street (|z| < 14), four cross lanes (x -96, -40, 18, 122), the launch, the giant's yard (x 28..112, |z| < 40), the sockets, the ring,
  the challenges' lane and the west door. About 82k cells: 4x the old city; `npm run perf` and a phone run not yet done.

What would need your wiring:
1. `CITY.lots` taking `ADOBE_LOTS` and a lot's `seed`; a lot built as `ADOBE[id] ? adobeBuilding(id, L.seed) : newBuilding(...)`, its
   label `ADOBE[id].label`.
2. Every `BUILDINGS[rec.id]` read tolerating an adobe id (`strike()` reads `.frame` on a felling and throws for one now).
3. If you want it: `MAT.adobe` (my guess: hp 1.0, density 1.4, span 2). Brick stands in until then.
4. If you want it: a colour hook in `meshCells` (and the chips and rubble): `look.cellColour(m, x, y, z, rec)` with `b.role` passed. Without
   it my dress recolours your meshes after each re-mesh (works untouched; chips and rubble keep CITY_LOOK's colours).

Until then `/adobecity on|off` (DEBUG) previews it on your runtime with two shims (the rec says `house` to your tables; paper and
furnishing stand as timber). Delete this note in your branch when done.
