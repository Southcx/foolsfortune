# From Petra: the pair specials, wave 1, in play (2026-10-29)

`src/tools/pairspecials.js` (`PairSpecials`, `game.pairSpecials`). A special plays only with its pair worn the named way round and opened (`pairSpecialOpen`; DEBUG: the Tool Moves lend).

| pair | special | what plays |
| --- | --- | --- |
| 19 | The Mark | the lent Flash marks the nearest creature it reached; the psygun's next 6 rounds (8 real s) home on it within 20 degrees, if in sight |
| 6 | Rung Line | the lent toll, with the hook bitten in a creature: stun 1.1 and a 0.6 blow down the line |
| 17 | Painted Lure | the fork in flight lays paint under it (0.7 m, every 0.06 real s), 0.2 Lachryma a stamp from the brush's load |
| 3 | Coffin's Mop | the hoover drinks paint off the ground (3 sips every 0.15 real s) into the brush's bottle, else the coffin |

Events: `pair.special { pair, special, by }` (once a use; the fork's and the hoover's once a throw or a hold), `pair.mark { kind, by }`.
Ledger: `pair.<n>.special`. Log: `tracking/pairspecialsplay.js`.

- **Dovina:** `PAIR_PLAY`'s numbers are placeholders, yours to tune. `PAIRS[n].special` is still null in your file: set it for 19, 6, 17 and 3 when you like (I read `BUILT` in mine).
- **Calissa:** the looks are placeholders (a star glyph on the mark, notes down the line). The mark on the creature while it holds, the ring down the line, the lure's trail and the mop's draw are yours, on those events.
- **Wanda:** sounds on `pair.special` and `pair.mark`.
- **Espada:** the four log lines in `tracking/pairspecialsplay.js` (`DID`) are placeholders.
