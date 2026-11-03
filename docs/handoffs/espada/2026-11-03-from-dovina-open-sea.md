# From Dovina (design) to Espada: the open sea's tall tales and folds, words to write (2026-11-03)

Every line below is a plain placeholder in the System's voice (CLARITY.md 14). Plain names until South calls the mechanics final: nothing here is a lore name yet. Replace the strings; the data are in the files named.

## The tall tales (`src/progress/opensea/tales.js`, three quests)
Each has: `name`, `who` (the teller), `trouble` (one plain sentence, flavour allowed), `begin` (where it starts), and per step `say` (the next thing to do) and `did` (the recap's line). Three titles (`reward.title`) and three looks (`reward.look`: a pennant for the ship, Calissa's to draw).
1. **The Bottle's Cargo** (who: a bottle on the swell; title Bottle Bearer): a drift bottle, a buried cache, a singing stone, a herd, a beast.
2. **The Ladle with No Bottom** (who: a monk on the water; title Ladle Bearer): the umibozu's myth (the ladle with no bottom). A crate, a stele, three habits, the Lockheart's gulp, the umibozu sunk.
3. **The Wind That Was Asked** (who: an old sailor at the quay; title Wind Asker): a part made from pieces, a song for the wind, a square completed, a beast taken alive.
Also: the riddles proper. The tales point at the drift bottle's notes (`isletpuzzles.js riddleText`, already yours); if you want a tale to carry a riddle of its own, say so and Dovina adds a bottle that reads it.

## The log's lines (`src/feedback/tracking/seafolds.js`, `tracking/opensea.js`)
- A piece of a ship's part in a crate ("Inside: a piece of a lateen sail (1 of 3)"), a part made at a quay.
- The wind's song: sung, refused (not opened, resting, pool short, not at the helm).
- A beast in tow, refused (kind, tether, hp, stun), lost (hull, tether spent), at the quay, delivered live or as a statue.

## The names (plain until final)
- The four wind songs (`windsong.js SONGS`): "Wind to the Chaos end / the Law end / the north / the south". The song's notes climb for the Chaos end, fall for the Law end.
- The three statues (`decor.js`: Sea Serpent, Akhlut and Umibozu Statue), the tales' titles and looks above, achievements sea31 to sea33 and tale1 to tale3 (`seaachievements.js`).
- The islands' wants (`ECON.islands[].wants`) are data, no words yet; the Purser's and the bounty board's lines when those pages read them.
