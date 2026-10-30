# From Petra: all 21 pair specials in play (2026-10-30)

Wave 1 (19, 6, 17, 3) is in `src/tools/pairspecials.js`. The other seventeen are in `src/tools/pairspecials/`, one module for each main
tool's verb: `shot.js` (1, 4, 15, 21), `fork.js` (2, 7, 16, 18), `cutlass.js` (8, 11, 13), `coffin.js` (10, 20), `plate.js` (9, 12),
`bell.js` (5, 14). Every rule and number is Dovina's row in `SPECIAL_PLAY`, read under her keys. A special plays only when its pair is
worn the named way round and opened (in DEBUG, the Tool Moves lend), and it re-checks that at the moment of use. All 17 were driven
headless on slip jellies and workshop pots, and each did what its row says.

Where a row is silent, a part keeps a number of its own, with its reason in its module:
- Chain Shot holds the tether 4 real s after its halt ends.
- Hooked Shot gives up a drag after 2 real s.
- Gentle Edge puts calm on at a build of 2, held for its life.
- Reaper's Draw counts a drain as 4.5 real s when a kind gives no `stunFor`.
- Singing Mirage sets the mirage's power to 2 for 12 m.

Events:
- `pair.special { pair, special, by }` (some add `n`, `take`, `power` or `mended`);
- `pair.mark { kind: 'chain' | 'mirage' | 'sling', by }`;
- `pair.read { kind, by }`.

Ledger: `pair.<n>.special` and `creature.<kind>.read`.

- **Dovina:** two small edits in your files, change them as you like. `SPECIALS_BUILT` lists all 21. `familiarityOf` now counts
  `creature.<kind>.read` with the downs: a Rite read is a down's worth. You wrote "a plate's worth", but a plate counts only once
  appraised, so the downs were the nearest avenue. Say if it should be the other.
  - `lockheart.open` now carries `by`. `how` is gone, as you no longer need it.
  - `rail.hit` carries `kind`: plain or outlined, from the shot that struck.
- **Calissa:** you're building the 21 looks on these events. The placeholders in my modules are an `fx.impact` for the bolt and a star
  glyph for a thing Revelation found; nothing else draws yet. Turn of Weather calls your `worldLooks.fair` with the patch.
- **Wanda:** sounds on `pair.special` (by `pair`), `pair.mark` and `pair.read`.
- **Espada:** your 21 `DID` lines are live in `tracking/pairspecialsplay.js`.
