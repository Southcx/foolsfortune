# From Dovina: the garden's how-to, the starter slab, the first path's garden steps

The rules are on `claude/dovina-design`: `src/progress/gardenhowto.js`, `src/progress/gardengrowthachievements.js`, and `progress/goals.js`
`FIRST`. The plan is `docs/plans/SEEDS-SLABS-SCANS.md` section 6. The runtime is yours.

1. **The how-to.** Play `GARDEN_HOWTO.steps` one at a time on the first entry, after the realm-naming page.
   - The table view's coach-step way is fine: a System window, NEXT and SKIP.
   - Each step's `show` turns the garden camera to that spot and rings it. The spots:
     - `jar`: the Pneuka Jar
     - `hand`: the art bar on touch, the hand on the desk
     - `shed`: the shed
     - `ring`: the open sky over the Dantian where a seed is let go
     - `lotus`: the Dantian's lotus to the Athanor
     - `shrine`: the plate shrine's hokora
     - `bench`: the carving bench
   - `say` is the desk's words. `touch` replaces it on touch where given. Say `{use}` through `deviceText`.
   - When it is finished or skipped, emit `garden.howto { done: bool, by: 'courier' }`. The ledger's `garden.howto` then stops it from
     playing on entry (`gardenHowtoSeen(game)`).
   - `/howto` in the garden replays it. `card` is the garden on one card, a click away.
2. **The starter slab** (`GIFT`: clapperjar, one star).
   - On the first entry, put one spirit slab in the Pneuka Box, unsealed, and emit `slab.make { kind, stars, from: 'gift', by: 'environment' }`.
     It counts nothing.
   - Give it once, from the realm's own save; that is a runtime give-once, not an achievement.
   - The plate shrine's "Carve" row then has it on the first visit. That is the how-to's step 6 and the first path's gw3.
3. **A bug in `world/garden/awaken.js` `plates()`.** The Book keys a clapperjar's photo `clapper` (bestiary.js `creatureOf`), but
   `plates()` filters for `clapperjar`, so the workshop's own creature never reaches the plate shrine.
   - Map it through `photoKindOf` (progress/scans.js), the other way round: the Book's `clapper` becomes the garden's `clapperjar`.
   - Also check what the Book keys glint, lobber and spirit photos as. `creatureOf` names only clapper, slipjelly and fish.
   - The scanner's seal already asks for either spelling (scans.js), and the casebook case is written (378).
4. **The first path.** It is now `sr1, gw1, gw2, gw3, fk1, ...`: enter, plant, carve, right after the Shrine's rest. Each step's
   `FIRST.where` names its spot.
   - gw2 counts `seed.plant.ring` (a moonlet's plant does not count: `inner: true`).
   - If a goals sweep or probe counts the path's length, it is 13 now.
