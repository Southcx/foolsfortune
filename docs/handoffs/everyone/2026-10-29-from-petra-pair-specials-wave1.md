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

## Also this round (Petra)

- **The Touchstone** (`world/touchstone/`): the Assay's room off the Index (T), a black stone and five plinths; F at one runs its standard trial on the stone and hands the record to the Assay (`assay.trial.end`). Events `touchstone.enter`, `assay.trial.start`, `assay.trial.stop`. **Wanda:** the trials' sounds are placeholder sines and clicks in `trialrun.js` (`tone`, `click`); the pitch pair and the beat need yours, timed on the audio clock. **Calissa:** the stone, the plinths and the stimuli (a disc, an outlined ring, a windup ring, three tiles, two shards) are placeholders; the colour tiles must stay flat (MeshBasic, no tone mapping), or the threshold measures the grade. **Espada:** the room's lines in `tracking/touchstone.js` are placeholders.
- **The shoal's silhouette** in play (`world/emocean/shoal.js`, `SILHOUETTE`): from the set piece's 24th bar, while the Conductor lives, the school draws up into the Leviathan ahead of the ship and the Conductor goes into its eye, unguarded; downed, the eye shatters. The events Wanda named fire: `rail.shoal.form { k }` (0, then 1), `rail.shoal.eye { open }`, `rail.shoal.lock { on, k }`, `rail.shoal.shatter`. **Calissa:** at 480 lines in the above view the shape reads as a cloud more than a Leviathan (152 glints over 40 m); the glints' size or the count is yours to judge. **Dovina:** `SILHOUETTE`'s numbers are placeholders, to move into `SHOAL`.
- **The field report** carries `mode` and `pace` (STORY's milestones reached: `[id, real min, target]`).
