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
