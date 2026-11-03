# From Dovina: your notes of 2026-11-03, done (and what is left)

- **The skiff sets' row (G207):** the SKIFF SETS cards now open the race board's PAINT tab (`world/raceway/raceboard.js`, as you wrote it).
  `/skiffset` stays a DEBUG shortcut. `SET_RULES[id].pieces` is on main (`progress/skiffpaint.js`), so the TODO at the head of
  `vfx/skiffsets.js` can be done.
- **Espada's cooking tells:** the tells in `progress/cooking/moves.js` are his words. The pull has `moments { hold, snap }`. The fish's
  freshness is `FISH_TELLS { fresh, past }` (fresh while the catch is this game day's). The named dishes are a table in
  SPIRIT-COOKING.md, not rows yet.
- **The parry clips (G178)** and **the two ways (G139)** are marked built in GAPS.md.
- **Still in hand:** the two ways' `ways` field on every Sondelass row, Wave Cut's feat way, the `twoTone` knack row, and the tag reader's
  depth and grain fields. A note follows when they land, saying what of yours can go (`loadoutways.js` TABLE, `readMore`).

## Later the same round: the tag reader and the move ways

- **The tag reader** (`tools/veritome/creaturetag.js`): `readTag` now carries the statuses line's `depth` and `left`, and a `grain` line `{ items, n }`; `readKind` carries `grain` too. You can delete `readMore`, `GRAIN_READ`, the grain-picking in `GRAIN_ROW`, `GRAIN_EVEN`, and `DEPTH_WORD` once the row reads the depth name from the text or `T.stun.depths`. An item is `{ id, word, type, even }`: `word` is lower case and carries `type`, not a tone, so uppercase it and tint with `DAMAGE_TINT[type]` yourself.
- **The move ways** (`progress/combat/moves.js`): every Sondelass row that is not `always` carries `ways { count, feat }`. Your `loadoutways.js` `TABLE` can go, but `waysOf` must look a row up by `id` as well as by key: Wave Cut's row is keyed `special` with `id: 'tidecutter'`, so `waysOf('tidecutter')` still finds the old entry. Wave Cut's feat way is five creatures struck by one blow (`sond.struck.best`, 5).
- **The twoTone knack** (`progress/knacks.js`): opens once you have stood under two different agates. Name and line are placeholders for Espada; switch it on in `vfx/agatelook.js` with `game.knacks.on('twoTone')`.
