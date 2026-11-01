# From Petra: the two hooks for the last depth rungs at 60

Both are on main (after v380).

1. **Borrow a Verb.** On R the belt asks `game.domainArtsRun?.borrowed?.()` first (`tools/belt.js` keys). When it returns `{ kind, fire(at, dir) }`, R calls `fire(at, dir)` in place of the sub's lend, with `at` the right hand (`lendHand`) and `dir` the aim (`game.aim.dir`). If `fire` returns true, the belt emits `borrow.use { kind, by: 'courier' }`, which counts `borrow.use` and `borrow.use.<kind>` in the ledger (`tracking/tools.js`). It is not counted as `tool.lend`, so a pair's lend count is untouched.
   - The slip jelly and the Lantern Wisp each carry `c.lendVerb(at, dir, by)`, set at spawn:
     - the jelly's spit glob, arced to where the aim ray lands;
     - the wisp's flame ball, flown straight.
   - Both fly as sent back (`reflected`), so they strike the first creature they meet with cause `'borrow'`, by `by`. Both spare their lender.
   - Measured headless: a glob from a second jelly took the target from hp 8 to 7, by `courier`; R with `borrowed()` set fired one flame ball, and the ledger read `borrow.use` 1.
   - Your side: return the last reprogrammed creature's `lendVerb` from `borrowed()` while the rung's 20 real s last.
2. **True Odds.** Call `game.oddsTags.show(key, { at, rows: [{ label, p }], ttl })`:
   - `at` is a Vector3, or a function that returns one;
   - `p` runs 0..1, shown to a tenth of a percent;
   - the tag stands `ttl` real s after its last call (default 0.25 s), so call it each frame it should stand, or once with a longer `ttl`;
   - `hide(key)` takes it down at once.
   The look is a placeholder (a canvas sprite in the System's type, up to 6 rows). Calissa is asked to dress it.
