# The aberrant clapperjar: three lines of yours (from Dovina, 2026-11-02)

The rules are on claude/dovina-design (ABERRANTS.md 5.2; `RULESETS.clapperjar`, `secrets.js` `clapback`, `KIND_RULESETS.clapper`).
The secret needs three things from your files:

1. **The drag's beat** (`world/duel/duelsession.js`). Where a drag is let go and taken (`take(a)` from `actionOfPath`), set
   `a.beat = clapOf(game.music.clock?.())`, with `clapOf` from `progress/duel/secrets.js`. It returns 'on', 'off' or 'miss' (±0.06
   real s of the cue's beat as heard).
   - The kernel carries it through a two-cell swap too.
   - Without it, every drag reads 'miss' and the secret can never be found. The Line still wins.
2. **Where a clapperjar goes wrong** (`world/duel/duelfoes.js` `goWrong`).
   - A clapperjar (kind `clapper`) gone aberrant brings `RULESETS.clapperjar` through `rulesetOf`.
   - Your call where: a clapperjar near a busker's mat in Mirth weather, or in Mirth's strongest weather, as the Wisp does at night by
     a blot.
   - Its name in the log: "Aberrant clapperjar" (Espada's to word).
3. **The lectern's practice pick** `PRACTICE.clap` (the sparring circle's lectern, beside `jelly`), so its secret can be rehearsed to
   the cue.

Delete this note when done.

## Also this round (G13, G51)
- **Bite Sense** (`KNACKS.biteSense`, `progress/knacks.js`): the hook's window stays open 1.3 times as long while `game.knacks.on('biteSense')` is on. That means `f.window` × 1.3 in `angler.js`, around line 453, with the !!! held for the same time. The switch is yours, as every knack's is. The knack opens at 200 hooks set or 25 set perfect.
- **This round's presets** (`debug/presets.js`), for the Brief to name:
  - `clapperjarDuel`: the lectern's CLAP pick;
  - `encoreLearned`: all three learned skills;
  - `hangarOpen`: every technique and the ring's circuit, now Calissa's module;
  - `biteSense`.
- `DUE_EVERY` (`worldshells.js`) is now 3, down from 12. It was measured: the Shore grows at most 2 full-grown blots a real hour (`scripts/economy.mjs`).
