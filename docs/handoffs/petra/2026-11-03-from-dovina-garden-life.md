# The Spirit Garden's life: the runtime hooks (from Dovina, 2026-11-03)

South: "build any outstanding unbuilt features." The rules are in `progress/` and tested (`node scripts/garden-life.mjs`); each needs one
small hook in a runtime file of yours. Nothing below is needed to boot: every rule is inert until its hook calls it. Delete this note as
each lands.

1. **A spirit notices (G114).** F with the hand over a spirit (and a tap on touch): `game.spiritNotice.talk(entry, spot)` with `spot = { planetoid,
   face, iu, iv }` (the spirit's cell on the decor grid, half-cells). It emits `spirit.notice { line, ... }`; the log says it
   (`tracking/gardenlife.js`). RULING NEEDED FROM SOUTH (via Dovina): the row says "in the dialogue box", but the glossary makes that the folk's
   one window and a spirit has none (`FAREWELL_LINES` are quoted by the log). Built as the log's quote; if South wants a box, the event
   carries the line. Touch: a talk tile in the art bar (the row's NEEDS).
2. **Spirits tend spore beds (G153).** In `raising.work`, when a spirit's `job === 'sporebed'`, call `game.sporeBeds.worker(game.sporeBeds.bedOf(plot.id),
   s.e)`; clear it with `worker(i, null)` when it leaves. The bed's page (`world/garden/mycelium.js` `bedPage`) gets an "assign a spirit"
   row calling the same with a chosen entry (`sporeBeds.workerOf(i)` says who). `spirit.release` already clears it.
3. **A spirit seeds a bare bed (G155).** Nothing: `sporeBeds.seedBy()` runs on `garden.enter`. A spirit set to a bare bed for 3 game days,
   bond 30, whose feeling's strain you hold, seeds it.
4. **Wild spore prints (G155).** Pickups (F or USE): `game.sporePrints.out({ where, floor })` lists the prints out today where you stand
   (`where`: `ridges`, `weir`, `ruins` the Dunes' areas; `well` with the floor); place one in each area/floor that lists it (Calissa dresses
   it) and call `game.sporePrints.take(id, { where, floor })` on F. Data in `progress/sporeprints.js` `WILD_PRINTS`.
5. **Seasons (G118).** (a) `world/garden/plants.js` `tick`: per cell per game hour, `const r = plantRate(seasonOf().id, groundIdOf(cell))`; a cell steps
   `rollOf(r.step, rand)` stages and a full cell seeds a neighbour with `rollOf(r.seed, rand)` tries (the wilt of dry or bare ground stays as
   it is; a season never wilts). (b) `world/garden/awaken.js` `visitors()`: `if (!seasonOpen(kind, seasonOf().id)) continue;` before the
   wants check (a missed visit costs nothing; `v.n` is kept). The digest already lists the kinds that call (`garden.digest.visitors`).
6. **Bed growth (G235).** Wherever a plot's ground or water changes, and on entry: `game.garden.surround(bedIndex, { feeling: plot.placed.feeling, ground:
   groundId, water: feelingOfWater })` for an herb terrace's bed, `game.sporeBeds.surround(i, { ground, water })` for a spore bed (its own
   strain is its feeling). `groundId` is realm.js `GROUND`'s id (clay.js `groundOf`); `water` a feeling or null (`waterworks.feelingAt`).
   A planted bed keeps the share of growth done when the pace changes.
7. **A spirit drinks its own feeling's water (G235).** `game.spiritDiet.waterOf = (entry) => the feeling of the water the spirit stands in
   (waterworks) or null`; set once in the realm's constructor. `spiritDiet.update()` already runs each frame (`systems`, world phase) and
   pays a point a game hour in the spirit's own stat.
8. **A spirit at the press (G219).** In `raising.work`, a spirit within 3 m of the Athanor's press (the ware ring) gets `e.work = 'press'` (the
   same `work` field beds and pavilions use). `progress/spiritwork.js` does the rest (`SoulAlchemy.walk` asks it; `GardenPress.extra()` can
   stay 0). A spirit of the material's feeling, bond 30 or more, gives that material one extra step; the preview shows it.
9. **A spirit eats the tree's fruit (G154).** In `raising.feed`, add the data of the meal to the `spirit.feed` event:
   `fruit: !!it.data?.fruit, hue: it.data?.hue, sat: it.data?.sat` (Myggdrasil's crown now marks its fruit `fruit: true`). `game.spiritDiet`
   does the rest (tint on `sp.tint`, likes and dislikes, the stat following the fruit's colour).
10. **Visitors' bodies (G115).** `garden.folk { folk }` fires on the first garden visit of a game day; if you want Pip, Saggar or Raku
    walking in (their models are the folk's), it is yours to place; the log already says it and the gift is already in the shed.

Not done and not asked: no new sweep checks (the garden is in flux).
