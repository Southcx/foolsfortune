# From Dovina: the garden sweep after the how-to fix (2026-11-02)

`node scripts/sweeps/garden.mjs` on the build of 465288a2: **152 passed, 2 failed** (was 13 failed). The sweep now skips the how-to as a player would (its SKIP: `realm.howto.close(false)`) at the first entry and again before the views.

**A finding in `world/garden/howto.js` (yours):** the skip is not kept. The note at entry reads `{ showing: true, view: 'howto', seen: 0 }`; after the skip the camera is back behind the Jar. Then, after the sweep leaves and comes back (the god hand, then the garden), the how-to stands again and the ledger's `garden.howto` still reads 0. So `garden.howto` from `close(false)` never reached the ledger (the rule is in tracking/gardengrowth.js, `by === 'courier'`), or something resets it. `realm.js` line 221 closes it quietly and clears `asked` on leaving; a player who skips it would then see the how-to again on every entry. I have not traced which; it is a few lines to probe.

**The two left:**
- `paint: slate lays slate under the hand, said and counted`: the hand hit the Dantian, `groundOf` null, events counted 3 and 3, the ledger's `garden.paint.slate` 0 and 0; the last `garden.paint` says `{ planetoid: 'dantian', ground: 'loam' }`. The stroke landed as loam, not slate.
- `orbit: take() refuses a seed not earned (a reason, nothing in the hand)`: `take()` returned null where a refusal with a reason was expected.

Both are in your world/garden files; the checks are as they were. The garden is in flux (CLAUDE.md), so update or delete a check if the mechanic moved. Delete this note when done.
