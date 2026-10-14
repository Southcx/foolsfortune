**From Dovina (Design), 2026-10-14: the Raceway's round six needs looks for eleven new things; each is a plain placeholder today.**

The owner said "build everything". The plan is `docs/plans/SKIFF-RACING.md` section 12. Each item below names the placeholder, the file
that makes it, and what the look has to say. None of them may carry words or numbers. The order is mine; reorder as you like.

1. **Vein lanes**: cyan slabs 5 m long laid along a stretch (`world/raceway/kit.js` buildMarks; the plate's `meshes`). They are
   Lachrymite in the sand and they refill the pool while ridden. They should read as "health here" from a distance, without reading as
   a sun plate. Your crystal veins are their kin.
2. **The scorch**: `skiff.rules.scorch` (0..1) builds while flaring. At 1 the sail luffs for 2 s (`rules.luffing`), event `skiff.scorch`.
   It wants the sail heating toward an ember and then the luff: a flutter with smoke.
3. **The hull's damage**: every `skiff.hull { kind, damage, left }` drains the pool. The pool is the board's health now (F-Zero). A
   hit wants a flash on the hull, and a low pool wants the board looking worn. The Lachryma ring already shows the number.
4. **A wreck**: `skiff.wreck` is a bail (`why: 'wrecked'`) when the pool was empty. It wants a bigger break than a bail, maybe your
   sibling's shatter in miniature.
5. **The sibling riders**: rivals in the Sibling roster (`ROSTERS.siblings`, `rivals.js` `body`) are a coloured capsule on a mini
   skiff. They want each sibling's own rig on a board.
6. **The pots of the pot smash**: an InstancedMesh of cylinders (`pottrial.js`). The pottery props would be right; a smash plays
   `g.fx.impact` and a star glyph.
7. **The antlion chaser**: a dark open cone on the road (`escape.js` `body`). It comes up the Gorge's crater road behind you, kin to the
   pits' maw. It wants jaws and sand thrown up.
8. **The City Trial's patches**: coloured octahedra (`citytrial.js` `PATCHES`, a colour each: top, accel, grip, pool, flare). Each one
   wants a gem whose shape says its kind, not only its colour.
9. **The buoys**: a grey pole with a red or yellow ball (`buoys.js`). Red means pass right of it, yellow means pass left. The power
   (`raceway.buoys.power`, 0..5) could show as pips on the board.
10. **The manual**: `skiff.manualLean` (-1..1) while W and S are held. It wants the board up on its tail and the grind's balance mark
    reused, if it fits.
11. **The flyover**: a `cinema.shot` cut along the line before a race (`flyover.js` `FLYOVER`). If you want the cuts framed differently,
    the numbers are yours to say.

12. **Hull glazes at the kiln** (the owner took "skiff parts and hull glazes"): the Solar Skiff's hull fired with a glaze as the vessel's
    regions are, at the kiln, from the same `GLAZES` table and at its prices (a look is a sink: ECONOMY.md "The worth of a look"). The
    kiln's UI and the hull's material are yours. I can add a save section `skiffGlaze` in progress/skiffparts.js the moment you say what
    key you want.

Also still open from round five: the water's glare at a low angle, the wake and splash (`skiff.water`), the rivals' look, and the
grind-trick pose.
