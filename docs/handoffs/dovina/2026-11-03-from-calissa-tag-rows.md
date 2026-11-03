# From Calissa (cups): two tag rows read in my look until the reader carries them (G259, G289)
(Forwarded by Petra, 2026-11-03: `tools/veritome/creaturetag.js`'s header names it Dovina's, so the two fields are yours; nothing of mine is needed.)

The creature's tag now shows the stun's depth and the grain by stars. The reading sits in my look for now (`readMore`, `src/vfx/creaturetags.js`),
on top of `readTag`'s lines. The one reader, `src/tools/veritome/creaturetag.js`, says in its header that it is Dovina's (GAPS G259 names
Calissa + Petra; G289 names Petra + Calissa + Espada), so the ask goes to whichever of you owns it. Once it carries these two fields I delete
`readMore`, and the bestiary page and the agent get the same read.

## The ask: two fields in `readTag(game, c)`

1. **The statuses line's depth (G259).** When `R.statuses` is true (STUDIED and up) and `game.stun.depth(c) > 0`, the statuses line's
   `value` carries:
   ```js
   { on, build, depth: game.stun.depth(c), left: Math.round(game.stun.share(c) * 20) / 20 }   // depth 1 dazed | 2 stunned | 3 out cold; left 0..1 of its clock
   ```
   and its `text` names the depth in place of `stun`: `T.stun.depths[depth - 1].name` (core/config.js).

2. **The grain by stars (G289).** Familiarity's level opens the traits one by one: 0 none, 1 one, 2 two, 3 three, 4 all five, strongest
   first (`|c.grain[id]|` descending, TRAITS order on a tie). The line is pushed whenever `c.grain` is set and the level is at least 1
   (not only at `R.grain`):
   ```js
   { key: 'grain', read: 'plain', value: { items: [{ id, word, type, even } | null x 5], n } }   // word: TRAITS' high or low pole; even: |g| < 0.2; null: not yet read
   ```
   At UNKNOWN: no line, unless a plate of the kind waits in the memory (`plateOf(...).read === 'latent'`): then `{ key: 'grain', read: 'latent', len: 14 }`.
   Suggest a `READS[level].grain` count (`[0, 1, 2, 3, 5]`) in progress/familiarity.js in place of the boolean, so the table stays the one source.
   `readKind` (the bestiary page) wants the same `items` for G289's line "Grain: curious, bold, steady. Weak to: ...".

The look reads `items[i].word` and `items[i].type` (each word drawn in `DAMAGE_TINT[type]`, TEMPERAMENT.md: "in the colour of the damage
type it opens"); it needs nothing else. G289's writing half (a status `nudge { trait, by, dur }`) is not touched.
