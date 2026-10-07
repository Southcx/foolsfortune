# The crossing: the Emocean's rail shooter (the owner, 2026-10-07)

Kept by Dovina. **Built.** Units: bars of the cue (1.5 real seconds each at 160 bpm), real seconds, metres.

> "I want you to flex on me with designing and implementing the Rail Shooter section... Make it a love letter to the genre as a
> whole... perspective shifting action, massive swimming boid schools that attack you like a bunch of piranhas, ROGUE LEVIATHANS, Pirate
> ship encounters... Assets can be placeholders, but *feeling* should be polished to a mirror shine."

A hop across the Emocean is one rail-shooter stage paced by Wanda's Crude Sea cue: a first half that is the same every crossing (each act
teaches one verb), then one to three set pieces (the shoal, the pirates, the rogue Leviathan), then the tally. It pays no cubes: the
score is the arcade's own currency (rank, medal, chain, the set piece's end).

**Where the code is** (each module's header carries its rules, numbers and prior art):
- The score, the set pieces' numbers, the scoring, the mounts (Dovina's): `src/progress/rail/crossing.js`, `setpieces.js`, `score.js`,
  `mounts.js`; the voyage `src/progress/voyage.js`; the log's rules and ledger counts `src/feedback/tracking/rail.js`; twelve
  achievements under THE EMOCEAN, The Rail.
- The stage, the creatures, the places (Petra's): `src/world/emocean/` (`stage.js` the conductor, `shoal.js`, `pirates.js`,
  `leviathan.js`, `waves.js`, `pier.js`, `margarite.js`); the ship `src/courier/ship/` (`ship.js`, `views.js`, `shots.js`, `mounts.js`);
  the feel `T.ship` in `src/core/config.js`.
- The simulator: `node scripts/rail.mjs` (three players; fails on a breach of the score's rules).
- Chat: `/crossing shoal,pirates,leviathan` sets the next crossing's set pieces for testing.

**Prior art** (credited in the headers): Star Fox 64, Ikaruga, Einhander, Sin & Punishment, Mushihime-sama, DoDonPachi, RayStorm, the
Gummi Ship, Rez, Panzer Dragoon, Radiant Silvergun, R-Type, Skies of Arcadia, Sid Meier's Pirates!, Sunless Sea, Reynolds' boids, Eiserloh.

**The goal:** the next thirty real seconds, survive this act and learn its one idea; the crossing, get the cargo across and do it well;
the week, S on every set piece, the 25,600 chain, a brig sunk, a Leviathan driven off and one felled (a quarter of an expert's runs; the
Leviathan's deck makes the rarest thing certain within its count).

## The shape of a short hop (100 bars)

| bars | act | view | teaches |
|---|---|---|---|
| 0–9 | launch | chase | the ship: the box it moves in, the two reticles, the roll |
| 9–26 | schools | chase | the gun, and the lock-on (a school is a line of eight: one sweep) |
| 26–36 | pincer | above | polarity |
| 36–50 | darters | free | the parry |
| 50–62 | breather | chase | flotsam, the reckoning's marks, a breath (the cue drops its drums) |
| 62–96 | the set piece | its own | everything at once |
| 96–100 | arrive | chase | the tally, the island in sight |

Which set piece: **the shoal** by default; **the pirates** under the day's dice (10% on an empty hold, +6% a cask, at most 60%; a full
sloop 58%: risk scales with what you carry); **the rogue Leviathan** from a deck (1 in 14 on the Margarite run, certain by the 14th;
1 in 8 toward Entropolis; half as many under the pall).

**The rules the score keeps** (checked by `scripts/rail.mjs`): everything falls on a bar line (Rez); a swing takes one bar, ends on the
act's first bar, and nothing enters during it; the day changes lanes and which set piece, never the order (an arcade stage is learnable).

## The verbs

| input | verb |
|---|---|
| WASD | move the ship in the view's plane |
| mouse | the reticle (chase, free, astern); in above and side the gun fires along the scroll |
| LMB held | full auto, a shot each sixteenth note |
| RMB held | the lock-on sweep: paint up to 8 (one a sixteenth, a rising tone each); release fires a lance at each (3 Lachryma a lance) |
| E | the barrel roll (the Blink's two charges): 0.35 real seconds, turning plain shots for its first 0.25 |
| V | the parry (`docs/plans/PARRY.md`): an outlined shot goes back where it came from |
| Q | polarity: the ship's feeling flips between your draught and its opposite; shots of the ship's feeling are drunk (+2 Lachryma) |
| Shift / C | boost / brake: the ship's place along the rail moves within a window; the music, the clock, never does |
| 1, 2 | the two mounted tools (`mounts.js`: the sloop carries two of the tools you wear; the psygun is always the gun; no ship parts, no second inventory) |

## The score (`score.js`)

Downs by class (Guppy 100 to Leviathan 10,000), x2 point blank (within 4 m), x3 by its own shot sent back; chains of three of one feeling
doubling to 25,600 (a shoal's fish never chain); a volley that downs every lock 50 x 2^(locks-1); a shot absorbed 10; the tally 1,000 a
hit still bearable; the set piece's end: brig sunk 5,000, struck 3,000; Leviathan driven 8,000, felled 20,000; shoal scattered 1,500.

- **Rank** against **par** (the median expert run, measured: shoal 102,000, pirates 37,000, Leviathan 60,500): S at par, then halving
  bands (A at half, B a quarter, C an eighth), because the chain doubles and an expert scores about four times a good player; three-quarter
  bands, measured, ranked every good shoal D.
- **Medal** (Star Fox's): passed with four in five of what came downed; a shoal's fish do not count, its caller does.

## The feel: what is not in `T.ship`

The numbers (speed, spring, bank, camera, reticles, shot, lock, roll, hurtbox, mercy, boost, hitstop, trauma) are in `config.js`. The
rules beside them:
- Enemy shots 16–28 m/s, never over 40% of the gun's: readable, the eye must win the race.
- After a hit the hull glows steady and half-clear for the mercy time: never a blink on and off (CLAUDE.md).
- A swing is a bar, eased, starting on a bar line; the input plane turns at the swing's midpoint; the ship keeps its world place.
- Lock tones rise a scale degree in E minor; the volley is released a sixteenth apart; down sounds are quantised to the next sixteenth.
- Only parryable things wear Calissa's Lachryma outline (Cuphead's pink: one colour, one promise).
- The .hack glitch only at a set piece's first beat.

## Measured (`node scripts/rail.mjs`, 3000 runs a player, the Anagami–Margarite run)

| set piece | novice passes | good | expert | expert ends | notes |
|---|---|---|---|---|---|
| shoal | 60% | 100% | 100% | scattered 100% | a novice who never lances the caller drowns in the ball |
| pirates | 98% | 100% | 100% | sunk 100% (good: struck 97%) | casks: novice -1.4, good +0.1, expert +2.0: a tax on the unskilled, a prize for the skilled |
| Leviathan | 57% | 97% | 100% | driven 77%, felled 23% | felled is an expert's feat |

The set piece is the threat's peak in every case (the shoal at bar 72, the pirates at 70, the Leviathan at 64); the breather is a breather.

**What tuning changed:** the fish no longer chain (the shoal scored ten times a pirate crossing); a broadside is a wall with gaps, at most
one hit a volley (18 separate round shot let 39% of novices through); boarders every four bars, not two (a novice lost the whole hold);
the Leviathan's fins only alongside and one breach from under (6% of novices came through); gills 34 shots, not 20 (experts felled it
99%); darters half a shot a bar (novices left the first half with two hits spent).

**What the model cannot tell:** it cannot separate a good player from an expert on the share downed, so the medal's line is to be set
from measured play (the ledger keeps `rail.medal` and the run's downs). Its players are three numbers each; the game measured corrects them.

## The contract

**Calls:**
- `game.voyage.board(from, to, ship, mounts)`: pays the fuel, draws the set pieces, keeps the loadout.
- `game.voyage.crossing()`: the whole crossing as it will play (acts, views, swings, beats, waves with class and lane).
- `game.voyage.stageResult(run)` at the last bar; `run` is `{ passed, hits, bears, downed, spawned, score, chainBest, volleyBest,
  parried, absorbed, rolls, pointBlank, end, won, stolen }`. It works out rank and medal, takes what the boarders stole, stows loot and
  shards, and emits `emocean.stage`.
- `game.voyage.continueCost(share)`, `game.voyage.continueRun(share)`.
- Scoring helpers: `chain()`, `chainDown()`, `volleyBonus()`, `downScore()`, `rankOf()`, `medalOf()`.

**Emits:** `rail.beat { beat, by: 'environment' }`; `rail.end { end, by }`; `rail.lock { n }`; `rail.down { cls }`; other `rail.*` for
the sound and the look; `creatures.windup` for every telegraph (`PARRY.md`); `emocean.continue { cost, continues, share, by }`;
`emocean.stage` with `setPieces`, `continues` and `at` (where you came to).

**The log says** (`tracking/rail.js`): the set piece's first beat, its end, and the tally before "You make port".

**The sound** (Wanda): `stageCue(seconds, setPieces)` takes one set piece or up to three (100, 146 or 192 bars; the k-th set piece on
bar 62 + 46k); `stageAt(game.music)` is the fraction of whichever length plays; `music/choose.js` reads `game.emocean.stage.setPieces`;
`sfx.railLock(n, grid)`, `sfx.railDown(cls, grid)`. Contract: `docs/handoffs/petra/2026-10-07-from-wanda-the-crossing-s-sound-contract.md`.

**The cast** (Espada, `docs/LORE.md`, "The crossing's cast"): the shoal's fish are **glints**, its caller **the Conductor**; the pirates
are **the Wreckers**, their brig **the False Light** (where they come from is left blank); the rogue Leviathan is **Old Nobody** (Letty's
notice reads "WANTED: NOBODY").

## The owner's rulings (2026-10-07)

### A long crossing chains up to three set pieces

| route | legs | bars | real seconds | why | passes: good, expert, novice (measured) |
|---|---|---|---|---|---|
| Anagami to Margarite | 1 | 100 | 150 | a short hop | the table above |
| Anagami to Entropolis | 2 | 146 | 219 | onto the wild end (danger 1.5) | 99%, 100%, 2% (about one continue, 53 cubes) |
| Margarite to Entropolis (King to Queen) | 3 | 192 | 288 | the whole line (8 steps; danger 1) | 97%, 100%, 2% (about one and a half continues, 71 cubes) |

(`LEG`, `legsOf`, `barsOf` in `econ/emocean.js`; `setPiecesOf`, `timeline`, `script` in `rail/crossing.js`.) The first half plays once;
then each set piece (34 bars) with a breather of 12 bars between two, whose flotsam mends the ship by 3 (Star Fox's silver rings); each
leg further out is half a step of danger wilder (escorts a class up); the pirates come at most once; the rogue Leviathan, when drawn, is
always the last leg. The wild routes are meant for the skilled; a novice can still get there by paying.

### The continue: an arcade's coin, priced by the way home

- Offered when the ship has borne all it can. **Pay** (`continueRun`): mended whole, flies on. **Decline:** it breaks up, a quarter of
  the cargo is lost (spills as ever), and you are made whole at your last Shrine, on its island (`SHRINE_ISLAND`), not at the far port.
- **The price** (`continueCost`): the fuel from where the ship is back to that Shrine's island, plus a repair of 2 minutes of play,
  doubling with each continue in one crossing. On the Margarite run, resting last at the Float Shrine: 26 cubes a fifth of the way out,
  54 cubes four-fifths of the way (the crossing's fuel is 14).
- A coin-fed run keeps its score but tops out at rank C and never medals (the high-score table's honesty).
- Counted: `rail.continue`, `rail.continue.cubes`.

**Open for the owner:** nothing yet.
