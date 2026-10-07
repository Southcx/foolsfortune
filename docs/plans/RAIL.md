# The crossing: the Emocean's rail shooter (the owner, 2026-10-07)

Kept by Dovina. **Petra builds the rail, the camera, the ship and the creatures. Calissa dresses them, Wanda scores them, Espada names
them.** Units: bars of the cue (1.5 real s each, 100 bars a crossing), real seconds, metres.

> "I want you to flex on me with designing and implementing the Rail Shooter section... Make it a love letter to the genre as a
> whole... Einhander, Ikaruga, Sin & Punishment, Mushihime, Kingdom Hearts 1 & 2 gummi ship combat, Raytracer, Star Fox. We want
> perspective shifting action, massive swimming boid schools that attack you like a bunch of piranhas, ROGUE LEVIATHANS, Pirate ship
> encounters... Assets can be placeholders, but *feeling* should be polished to a mirror shine."

**What is built (Dovina, this round, on `claude/dovina-design`):**
- The crossing's score: acts, views, swings, set pieces and beats, in `src/progress/rail/crossing.js`.
- The set pieces' numbers, in `src/progress/rail/setpieces.js`.
- The scoring, rank, medal and par, in `src/progress/rail/score.js`.
- The ship's mounts, in `src/progress/rail/mounts.js`.
- The voyage, which now settles the set piece at the pier and pays out loot, theft and shards at the dock (`src/progress/voyage.js`:
  `board(from, to, ship, mounts)`, `crossing()`, `stageResult(run)`).
- The log's rules and the ledger counts (`src/feedback/tracking/rail.js`).
- Twelve achievements under THE EMOCEAN, The Rail.
- **A simulator that plays the whole thing** against three players and checks the score's rules: `node scripts/rail.mjs`.

**What is to build:** the rail itself, the camera, the ship, the creatures and the set pieces. That is Petra's, in the phases of
section 9.

## 1. The player's goal at each scale

- **The next thirty seconds:** survive this act and learn its one idea. Every act teaches exactly one thing (section 3).
- **The crossing:** get the cargo across, and do it well. The rank, the medal, the chain and the set piece's end are the arcade's own
  currency; the Emocean pays no cubes (it is the travel layer: a drain of fuel and a risk to cargo, paid at the other end).
- **The week:** S on every set piece, the 25,600 chain, a brig sunk, a Leviathan driven off, and one felled (a quarter of an
  expert's runs). The Leviathan's deck makes the rarest thing certain within its count.

## 2. The love letter: what was taken, and from where

| from | what we took | where it lives |
|---|---|---|
| **Star Fox 64** | a two-minute stage in authored waves; the hit counter and the medal; the training-then-test shape; two reticles at two depths; the barrel roll that turns shots; boost and brake; the tally at the end | the acts, `medalOf`, the chase view, the roll, the tally line |
| **Ikaruga** | polarity (shots of your colour are drunk, the other kills); chains of three of one colour, doubling to 25,600; chapters that each teach one idea | Q flips the ship's feeling; `chainDown`; the acts |
| **Einhander** | the camera that swings mid-stage from side to behind; gunpods taken into a slot with their own ammunition | the swings; the two mounts |
| **Sin & Punishment** | the free reticle over the whole screen, things coming at the camera; the sword that sends a shot back | the free view; V parries, a down by its own shot pays three times |
| **Mushihime-sama, DoDonPachi** | the bullet pattern as choreography (a wall is a path); point-blank pay for courage | the broadside as a wall with gaps; `pointBlank` x2 |
| **RayStorm, RayCrisis, RayForce** ("Raytracer") | the lock-on sweep: hold, paint up to eight, release; the bonus doubling with every lock, paid only if every lock dies | RMB held; `volleyBonus` |
| **Kingdom Hearts 1 and 2's Gummi Ship** | the world map's hop as a rail stage; set pieces as the stage's heart; the ship built from blocks | the hop is the stage; the set piece is its heart; the mounts are your own tools, not parts (SLICE.md: no second inventory) |
| **Rez** | everything on the beat; shots and lock tones quantised to the music | every swing, wave and beat on a bar; full auto on the sixteenth |
| **Panzer Dragoon** | the look round; the sea-beast that runs alongside; the beast as a sequence of faces | the astern view; the Leviathan's four beats |
| **Radiant Silvergun, Thunder Force** | the stage as one composition; the boss as a musical event | the crossing is the cue (Wanda's Crude Sea) |
| **Gradius, R-Type** | the side-scrolling duel; a ship as a boss with parts | the side view; the brig's ports and rigging |
| **Skies of Arcadia, Wind Waker, Assassin's Creed IV** | ship-to-ship battle, broadside and boarding, a crippled ship striking its colours | the pirates |
| **Craig Reynolds' boids (1987); the sardine run; Finding Nemo's moonfish** | separation, alignment, cohesion; the bait ball; the school as one body | the shoal |
| **Moby-Dick, Shadow of the Colossus, Panzer Dragoon Saga** | the beast you do not kill, only survive; its parts as the fight | the rogue Leviathan, driven off or (rarely) felled |
| **Sid Meier's Pirates!, Sunless Sea** | pirates come for what you carry; the zee takes cargo | the pirates' chance rises with every cask |
| **Squirrel Eiserloh, "Juicing Your Cameras With Math" (GDC 2016)** | screen shake as trauma squared, decaying | the feel table |

## 3. The shape: one crossing, 100 bars

The cue is the clock (Wanda's Crude Sea: 100 bars at 160 bpm, 150 real s). The first half is the same every crossing; the second half
is one of three set pieces.

| bars | act | view | teaches |
|---|---|---|---|
| 0–9 | launch | chase | the ship: the box it moves in, the two reticles, the roll |
| 9–26 | schools | chase | the gun, and the lock-on (a school is a line of eight: one sweep) |
| 26–36 | pincer | **above** | polarity: shots of your feeling are drunk, the other kind hurts |
| 36–50 | darters | **free** | the parry: darters spit outlined shots at the camera; V sends them back |
| 50–62 | breather | chase | the sea: flotsam to gather, the reckoning's marks, a breath (the cue drops its drums) |
| 62–96 | **the set piece** | its own | everything at once |
| 96–100 | arrive | chase | the tally, and the island in sight |

**The set pieces** (`SET_PIECES`, `setPieceOf`):

| set piece | when | its beats (bar: view, what) |
|---|---|---|
| **the shoal** | the default | 62 above: the crude boils, the ball rises and rings the ship. 70 chase: the frenzy, strikes in pulses; down the caller to scatter it. 84 chase: the heavy it was fleeing, with its escort |
| **the pirates** | the day's dice under their chance: 10% on an empty hold, +6% a cask, at most 60% (a full sloop: 58%) | 62 **astern**: a brig closing behind, its bow chasers' shot parried back into her bow. 70 **side**: the broadside duel, ports, boarders, rigging. 84 chase: she comes about to ram. 92: she sinks, strikes or limps off |
| **the rogue Leviathan** | a deck: 1 in 14 on the Margarite run, certain by the 14th (1 in 8 toward Entropolis; half as many under the pall) | 62 free: the sea heaves, it breaches across the rail. 70 side: alongside, four gills, fin sweeps, spit to parry into the gills. 80 above: it sounds, and its shadow grows under you. 88 free: face to face, the maw, its teeth and throat. 96: it is gone, or felled |

**The rules the score keeps:**
- Everything falls on a bar line (Rez).
- **A swing takes one bar and ends on the act's first bar, and nothing enters during it.** A player never meets a threat while the
  ground under their thumbs is turning. `scripts/rail.mjs` checks this and fails on a breach.
- The day changes lanes and which set piece, never the order (an arcade stage is learnable).

## 4. The verbs

| input | verb | from |
|---|---|---|
| WASD | move the ship in the view's plane (screen in chase/free/astern, the sea in above, the wall in side) | all of them |
| mouse | the reticle (chase, free, astern); in above and side the gun fires along the scroll and the mouse rests | Star Fox; a real shmup's honesty |
| LMB held | full auto, a shot each sixteenth note | Rez, every shmup |
| RMB held | **the lock-on sweep**: the reticle paints what it passes (one a sixteenth, up to 8, a rising tone each); release fires a lance at each (3 Lachryma a lance) | RayStorm |
| E | **the barrel roll** (the Blink on the rail: its two charges): 0.35 real s, turning plain shots for its first 0.25 | Star Fox 64 |
| V | **the parry** (as on foot: `docs/plans/PARRY.md`): an outlined shot goes back where it came from | Sin & Punishment |
| Q | **polarity**: the ship's feeling flips between your draught (the stones) and its opposite; shots of the ship's feeling are drunk (+2 Lachryma each) | Ikaruga |
| Shift / C | boost / brake: the ship's place along the rail moves within a window; the music, the clock, never does | Star Fox 64 |
| 1, 2 | the two mounted tools (section 6) | Einhander, the Gummi Ship |

## 5. The score (`src/progress/rail/score.js`)

| rule | pays | why |
|---|---|---|
| a down | Guppy 100, Barracuda 300, Marlin 1,000, Whale 3,000, Leviathan 10,000 | about three times a class, as their hit points are |
| point blank (within 4 m) | x2 | courage (DoDonPachi) |
| its own shot sent back | x3 | the parry is the stylish kill (Sin & Punishment) |
| a chain: three downs of one feeling | 100, doubling, to 25,600 | the order you kill in is a puzzle; another feeling inside a three breaks it to nothing (Ikaruga). A shoal's fish are one body and never chain |
| a volley that downs every lock | 50 x 2^(locks-1): eight locks, 6,400 | greed checked by precision (RayStorm) |
| a shot absorbed | 10, and +2 Lachryma | eating bullets is play, not luck (Ikaruga) |
| the tally | 1,000 for each hit still bearable | Star Fox's no-miss bonus |
| the set piece's end | brig sunk 5,000, struck 3,000; Leviathan driven 8,000, felled 20,000; shoal scattered 1,500 | the set piece is the stage's heart |

- **The rank** is the score against **par**, the median of an expert's run measured by the simulator: S at par, A at three
  quarters, B at half, C at three tenths. Par is per set piece (shoal 102,000, pirates 37,000, Leviathan 60,500).
- **The medal** is Star Fox's: the stage passed with four in five of what came at you downed. The fish of a shoal do not count toward
  it; its caller does.

## 6. The mounts: your own tools at sea (`src/progress/rail/mounts.js`)

The sloop carries two of the tools you wear, chosen at the pier; the psygun is always the gun. **No ship parts, no second
inventory:** the same tools in every layer (SLICE.md).

| tool | at sea | does |
|---|---|---|
| the Soul Brush | the wake brush | a fan of your feeling ahead (50 degrees, 9 m): drinks shots of your feeling, cuts fish three to a stroke; 4 Lachryma a real second |
| the Crucibelle | the toll | **the bomb**: clears every shot within 10 m (14 on the beat), scatters a shoal, staggers boarders; three a crossing |
| the Lockheart | the gulp | swallows a cone for a second: shots and Guppy fish, 2 Lachryma each; every 4 bars |
| the Veritome | the plate | a photograph of what is in frame (a Leviathan for the Compendium: Pokemon Snap on a rail), and its Flash holds a weak point open two bars; 6 Lachryma, every 4 bars |
| the Sondelass | the hook | grapples within 16 m: a cask reeled aboard, a boarder yanked into the sea; every bar |
| the Dreamvane | the vane | passive: the reckoning's marks half again as early, the shoal's caller shown, the Leviathan's breach marked a bar ahead |

## 7. The set pieces, in numbers (`src/progress/rail/setpieces.js`)

**The shoal** (Reynolds' boids, given a mood):
- **Size:** 48 fish at the Guppy class, 24 more a class. They are instanced, one draw call.
- **Flocking:** separation 0.8 m (weight 1.6), alignment 3 m (1.0), cohesion 4.5 m (0.8); 12 m/s cruise, 22 m/s strike, 6 rad/s turn.
- **School → bait ball:** at bar 62 the ball rings the ship at 10 m and tightens 0.6 m a bar, to no closer than 5 m. The fish are
  under the crude until bar 70; only the caller can be reached, by a lance.
- **Frenzy:** every bar a strike group of 4 + 2 a class leaves the ball for where the ship will be (0.35 s of lead). The group turns
  its flanks a quarter bar first (the sardine's silver turn: a motion, never a flash).
- **Bites:** five bites are one hit.
- **The caller:** twice the size, its own glow, four shots (one lance). While it lives the crude feeds the ball 6 fish a bar. Down it,
  or a third of the ball inside a bar, or toll the bell, and the shoal scatters for two bars.

**The pirates:**
- **The brig, as a boss with parts:** hull 420 shots, four rigging points (8 each, one lance), six gunports (5 each).
- **Astern:** a bow chaser every two bars, 16 m/s, outlined. Parried back, it takes 6 off her hull.
- **Alongside:** a broadside every two bars, the ports opening a bar before. Round shot cannot be parried. **A volley is a wall with
  gaps**, so it catches the ship at most once, and its chance is the share of ports still open.
- **Boarders:** two every four bars. One that stands a bar on your deck takes a cask, the dearest grade first.
- **The ram:** at bar 84, a bar and a half of warning; it costs two hits unless her hull is holed or you boost clear.
- **The end:** sunk, her hold floats astern (2 casks); struck, she drops 1; limped, nothing.

**The rogue Leviathan:**
- **Parts:** four gills (34 shots each, open two bars in four, as it breathes), six teeth (a lance each), and the throat (five spits
  parried down it).
- **Blows:** every big one has a bar or more of warning. The breach (2 hits); fin sweeps while it runs alongside (1); the breach from
  under at bar 84 (2, an 8 m ring); a spit every bar (outlined: parried into an open gill it does 5).
- **What it leaves:** driven off, a shard of Lachrymite, and Letty Marque posts its bounty. Felled, three shards.

## 8. The feel: the mirror shine (numbers for Petra's `T.ship`; each is a starting point with its reason)

Feel is Petra's (`config.js`). These are proposals she owns, measured in the testing room before the crossing.

| what | number | why |
|---|---|---|
| the ship in its plane | 14 m/s top, a critically damped spring at w = 12 | snappy without overshoot: Star Fox's arwing settles, it never wobbles |
| bank and pitch | 3.5 degrees per m/s of sideways speed, to 50; pitch to 25 | the ship shows its intent before it arrives |
| the chase camera | 2.2 m up, 7.5 m back; follows the ship at 35% of its offset, lag w = 6 | the ship moves in a box the camera only half follows: Star Fox's parallax, the reason the screen feels wide |
| the two reticles | at 12 m and 36 m, on the line from the nose | Star Fox 64: depth read without stereo |
| the gun | 70 m/s shots, a shot each sixteenth (10.7 a second at 160 bpm) | Rez: firing is playing the hi-hat |
| enemy shots | 16–28 m/s, never over 40% of the gun's | readable: the eye must win the race |
| **the hurtbox** | a sphere of 0.35 m at the ship's heart; the ship is 1.6 m | every shmup's mercy: a graze looks close and is not a hit |
| hitstop | 0.04 s on a Marlin down, 0.08 on a heavy or a part, none on fish | weight where it matters; a shoal never stutters |
| screen shake | trauma squared (Eiserloh): a hit +0.5, a heavy down +0.3, decaying 1.5 a second; never on a fish | shake that means something |
| the roll | 0.35 s; turns plain shots for its first 0.25; the Blink's two charges | Star Fox 64 |
| after a hit | 1.0 s untouchable; the hull glows steady and half-clear | never a blink on and off (CLAUDE.md: nothing repeats a flash) |
| a swing | a bar (1.5 s), eased in and out, starting on a bar line; the input plane turns with the camera at the swing's midpoint; the ship keeps its world place | no position snap, no input surprise |
| the lock-on | a paint each sixteenth, up to 8; a tone each, rising a scale degree in E minor; the volley released a sixteenth apart | RayStorm's sweep, Rez's tones |
| sounds of downs | quantised to the next sixteenth | Rez: the crossing plays along with its music |
| parryable things | Calissa's Lachryma outline (`PARRY.md`); nothing else wears it | Cuphead's pink: one colour, one promise |
| glitch | the .hack frame accumulation at a set piece's first beat only (bars 62/62/62) | the moments that earn it (CLAUDE.md, the look) |

## 9. Measured (`node scripts/rail.mjs`, 3000 runs a player, the Anagami–Margarite run)

| set piece | novice passes | good | expert | expert ends | notes |
|---|---|---|---|---|---|
| shoal | 60% | 100% | 100% | scattered 100% | a novice who never lances the caller drowns in the ball |
| pirates | 98% | 100% | 100% | sunk 100% (good: struck 97%) | casks: novice -1.4, good +0.1, expert +2.0: the pirates are a tax on the unskilled and a prize for the skilled |
| Leviathan | 57% | 97% | 100% | driven 77%, felled 23% | felled is an expert's feat |

**The threat a bar** (the good player): the set piece is the stage's peak in every case (the shoal at bar 72, the pirates at 70, the
Leviathan at 64), and the breather is a breather.

**What the tuning changed, and why:**

| first try | measured | changed to |
|---|---|---|
| the fish chained | the shoal scored ten times a pirate crossing | the fish never chain |
| 18 round shot a broadside, each its own chance | 39% of novices came through | a wall with gaps: at most one hit a volley |
| boarders every two bars | a novice lost the whole hold | every four |
| fins in the maw, two breaches from under | 6% of novices came through | fins only alongside, one breach |
| gills at 20 shots | experts felled it 99% | 34: experts fell it about a quarter of the time |
| darters firing a shot a bar | novices left the first half with two hits spent | half a shot |

**What the model cannot tell:**
- It cannot separate a good player from an expert on the share downed, so the medal's line (four in five) is to be set from measured
  play: the ledger keeps `rail.medal` and the run's downs.
- Its players are three numbers each. **The game measured is the truth that corrects them.**

## 10. The contract (what Petra's rail calls, what it emits)

**Calls:**
- `game.voyage.board(from, to, ship, mounts)`: pays the fuel, draws the set piece and keeps the loadout.
- `game.voyage.crossing()`: the whole crossing as it will play: acts, views, swings, beats and waves with class and lane.
- `game.voyage.stageResult(run)` at bar 100. The run is `{ passed, hits, bears, downed, spawned, score, chainBest, volleyBest,
  parried, absorbed, rolls, pointBlank, end, won, stolen }`. It works out the rank and the medal, takes what the boarders stole,
  stows the loot and the shards, and emits `emocean.stage`.

**Scoring helpers:** `chain()`, `chainDown()`, `volleyBonus()`, `downScore()` (`score.js`).

**Emits:**
- `rail.beat { beat, by: 'environment' }` at each beat's bar.
- `rail.end { end, by }` when the set piece ends.
- `rail.*` for the sound and the look as they want them.
- `creatures.windup` for every telegraph (`PARRY.md`).

**The rules in `tracking/rail.js` say:** the set piece's first beat, its end, and the tally before "You make port".

## 11. Who does what (the orchestration)

| division | does | when |
|---|---|---|
| **Dovina** | the crossing, the set pieces, the scoring, the mounts, the voyage, the log's rules, the achievements, the simulator (done); re-measure par and the medal from the first played crossings (the ledger); the second route's numbers | done; then after Petra's R1 |
| **Petra** | **R1:** the pier and the node map; the sloop form; the rail as a spline paced by `stageAt(game.music)`; the five views and the swing; the ship's verbs (move, fire, lock, roll, parry, polarity, boost); schools, darters, heavies from `crossing().waves`; `stageResult`. **R2:** the shoal (a flock part in `creatures/ai/`, built once, `docs/AI.md`) and the mounts. **R3:** the pirates. **R4:** the Leviathan, and Margarite's dock (with the Pearl Shrine). One gate each | R1 next |
| **Calissa** | the crude sea at speed, the sloop, the ship's polarity as its colour, the views' framing, a swing's look, the shoal (the silver turn, the caller's glow), the brig, the Leviathan (placeholders first), the tally's look | from R1, in parallel |
| **Wanda** | Crude Sea already paces it. Wanted: three layers for bars 62–96, one per set piece (the shoal's churn, a shanty over the broadside, the Leviathan's own motif); lock-on tones in E minor; the downs quantised to the sixteenth | from R2 |
| **Espada** | names: the shoal's fish and its caller, the pirates (who sails the Emocean for crude?), the brig, the rogue Leviathan (one name, it is a character); the log's lines (placeholders in `tracking/rail.js`) | any time |

## 12. The cast (Espada, 2026-10-07; `docs/LORE.md`, "The crossing's cast")

- **The shoal's fish are glints**, named for the flash as a bait ball turns. The caller is **the Conductor**: the shoal moves on the
  cue's beat, so the Conductor falling is the music stopping.
- **The pirates are the Wreckers.** Wreckers hung false lights to lure ships onto rocks. These are Contractors under no letter (Letty
  holds the King's marque; they hold none), and their brig is **the False Light**. Where they come from is left blank.
- **The rogue Leviathan is Old Nobody.** An Egregore is authored by no one, and Nobody is also the name Odysseus gave the Cyclops.
  Letty's notice reads "WANTED: NOBODY".

## 13. The music (Wanda, 2026-10-07; `claude/friendly-knuth-vbv82r` e735393)

Bars 62 to 96 have a version for each set piece (`stageCue(seconds, setPiece)`):

| set piece | what the cue does |
|---|---|
| **the shoal** | a churn to bar 70 (bubbles, rising strings), then string pulses with the strikes |
| **the Wreckers** | the crew's shanty grows astern from bar 62, a bow-chaser boom every two bars; "Haul Away the Fortune" in full over the broadside from 70, a boom with each volley; the ram at 84; the crew's chorus home from 92 |
| **Old Nobody** | its own motif (E F E C B): it heaves at 62, comes alongside at 70 (the gills breathing two bars in four, as in `setpieces.js`), sounds at 80, and is face to face at 88 |

**Lock tones:** `sfx.railLock(n, grid)`, E minor from E5, a degree per lock, heard from `rail.lock { n }`.
**Downs:** `sfx.railDown(cls, grid)`, on the next sixteenth, heard from `rail.down { cls }`.
The sound contract for Petra is `docs/handoffs/petra/2026-10-07-from-wanda-the-crossing-s-sound-contract.md`.

## 14. The owner's rulings (2026-10-07)

### A long crossing chains up to three set pieces

| route | legs | bars | real s | why |
|---|---|---|---|---|
| Anagami to Margarite | 1 | 100 | 150 | a short hop |
| Anagami to Entropolis | 2 | 146 | 219 | onto the wild end (danger 1.5) |
| Margarite to Entropolis (King to Queen) | 3 | 192 | 288 | the whole line (8 steps; danger 1) |

**How a long crossing is built** (`LEG`, `legsOf`, `barsOf` in `econ/emocean.js`; `setPiecesOf`, `timeline`, `script` in
`rail/crossing.js`):
- The first half plays once. Then each set piece (34 bars), with a **breather of 12 between two**, then the arrival.
- **The breather's flotsam mends the ship by 3** (Star Fox's silver rings).
- Each leg further out is half a step of danger wilder: the escorts come a class up.
- The pirates come at most once (each leg rolls the day's dice).
- The rogue Leviathan, when drawn, is always the last leg: the climax.

**Measured:**

| route | good player | expert | novice |
|---|---|---|---|
| two legs | 99% | 100% | 2%, needing about one continue (53 cubes) |
| three legs | 97% | 100% | 2%, needing about one and a half continues (71 cubes) |

The wild routes are meant for the skilled. A novice can still get there by paying.

### The continue: an arcade's coin, priced by the way home

- **When:** the ship has borne all it can.
- **Pay:** `voyage.continueRun(share)`, and the ship is mended whole and flies on.
- **Decline:** it breaks up. You lose a quarter of the cargo (spills as ever) and **you are made whole at your last Shrine**, on its
  island (`SHRINE_ISLAND`), not at the far port.
- **The price** (`continueCost`): the fuel from where the ship is on the line back to that Shrine's island, plus a repair of 2
  minutes of play. It doubles with each continue in one crossing.
- **Examples:** on the Margarite run, resting last at the Float Shrine, a coin costs 26 cubes a fifth of the way out and 54 cubes
  four-fifths of the way. The crossing's fuel is 14.
- **What a coin-fed run gets:** it keeps its score but tops out at rank C, and never medals (the high-score table's honesty).
- **Counted:** `rail.continue`, `rail.continue.cubes`.

**The cue chains too** (Wanda, `claude/friendly-knuth-vbv82r` 60bc2d2):
- `stageCue(seconds, setPieces)` takes one set piece or a list of up to three, with the breather's 12 bars between two: 100, 146 or
  192 bars, the k-th set piece on bar 62 + 46k.
- `stageAt(game.music)` is the fraction of whichever length plays.
- `music/choose.js` reads `game.emocean.stage.setPieces`.

**Events:** `emocean.continue { cost, continues, share, by }`. `emocean.stage` gains `setPieces`, `continues`, and `at` (where you
came to).

## 15. Open for the owner

Nothing yet.
