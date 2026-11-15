# The Well's board: a Well run as a board game (a draft)

South, 2026-10-31 (ENDGAME.md): "Well dungeon exploration to me is kind of like our catch all for game genre exploration." ENDGAME.md
3.1 sketched the board: spaces moved across on your own dice, a floor a space, the FOE at the end. South, 2026-11-14: "designing and
drafting the Wells' boardgame module ... you're a free hand. The girls can check over your work later."

Written by a sixth session working as a free hand, on `claude/brave-faraday-gjppx6`. **A draft: nothing here is ruled.** It closes
GAPS G85's design and gives G88 (the endless Well) for free; G93 is still South's. Every name is plain until South calls it final.

**Built:** the rules (`src/progress/wellboard/`), a bot, the simulator (`scripts/wellboard.mjs`), the board in 3D in DEBUG
(`/board`: section 10), its decisions on a page set aside, the log's rules. **Not built:** a floor's own play (the page asks how
it went: a stand-in), its sounds, pay into the purse, touch beyond taps on the page and the dice.

## 1. The game in one paragraph

You stand at the Well's mouth holding six dice: your stones, the d4 to the d20. Each turn you pick **one die that is not spent** and
throw it; you move that many spaces and the die is spent until all six are, when the set comes back. Only the space you land on does
anything. A floor of the Well is a **ring** of twelve spaces; its **door** stops you, and opens down only once **two floors on that
ring are cleared**. A fight or a trial space is a floor you actually play; clearing it puts a material in your **haul**, failing it
costs a **crack** and your newest piece. Four cracks and you **fall**, and the haul is lost. The haul comes home only **up the way
up**: from a door, or by the Wake Whistle for three quarters of it. Below the third door the **FOE** sleeps until two floors of its
ring are cleared.

The decision every turn is **which die**: the d4 lands where you mean it to; the d20 can lap the ring. Each is yours once a cast.

## 2. Why these rules (each against the house's laws)

- **The stones are your dice** (DICE.md: "the chance rolled on your behalf is rolled on your stones"). The board is the first place
  the whole set is thrown, die by die. The d% never moves you: it is the **fate die**, thrown for a hazard's save (DICE.md 9 leaves
  the d% open; this gives it a job without giving it a suit).
- **Skill skips grind; grind closes the gap.** Reading the ring and picking the die is the skill; the simulator prices it (section
  6: a planner brings home about a third more than a seat that throws any die). The floors themselves are played, so the board never
  replaces play with a roll.
- **Base change bad, modifiers good.** The board changes no rule of the pool, the vessel or the core movement. It is a second way
  through a Well: the same seed (`wellSeed`), the same haul rule ("a material for each floor whose creatures are all down" became
  the door's two keys), the same Wake Whistle, the same pay table. What bends a run later is a modifier with a source: a stone
  set's mineral, Divination's sight, the game day's card.
- **Every number has two avenues.** The page shows a die's reach on the ring before it is thrown and says it in a line; the log says
  what changed.
- **It teaches something real without saying so:** expected value. A die's reach is a small probability table you learn to read by
  wanting something from it.

## 3. The spaces

One job each (`KINDS`, `progress/wellboard/layout.js`). A floor's main line holds, between its first space and its door: 3 fights
(the first space is always one), 1 trial, 2 caches, 1 spring, 2 hazards, 1 shift, 1 rest.

| space | landing on it |
|---|---|
| Fight | a floor of creatures, played. Cleared: a material of the depth's tier. Failed: a crack, and the newest piece of haul dropped |
| Trial | a genre floor (ENDGAME.md 3.2), played. Cleared: a material a tier higher |
| Cache | a material, once |
| Spring | mends a crack; with none, your smallest spent die comes back |
| Hazard | throw the fate die: saved on 60 in 100 on the first floor, 5 fewer a floor, never under 30; else a crack |
| Shift | moves you the spaces printed on it (-3 to +4), and the space you are set down on does nothing |
| Rest | every spent die comes back |
| Door | stops you whatever you threw. Open (two floors of its ring cleared): the next throw goes down. Shut: it goes round again. The way up starts here |
| FOE | the last floor's door. Asleep until two floors of its ring are cleared; awake, it is fought where you land |

**The side line.** Each ring has one, laid by the seed: a **short cut** across the ring (two spaces, a hazard and a fight) or a **long
way** outside it (five spaces: two caches, a spring, a fight, a rest). The fork is the route's one decision.

**Standing on a floor you failed,** you may play it again in place of a throw.

## 4. The layout and the endless Well

A floor is laid from `(seed, depth)` alone, when a seat first comes down to it. So:
- the game day's board is the same for everyone (`wellSeed('dunemaw', today())`), and a Cogitomap could carry a board as it carries a
  Well;
- **the endless Well is the same module with no last floor** (`opts.endless`): a FOE's space closes every third floor, and beating
  it opens the floor below. Best depth is a record. This is GAPS G88, and ENDGAME.md's "every Well, deeper and stranger".

Deeper floors are the same kinds, dearer: a material's tier is the depth (capped at 4), a hazard's save falls, and the floors
themselves are the runtime's to make harder.

## 5. Pay

No new economy (`progress/wellboard/pay.js`). A cleared floor pays that depth's floor from `ECON.well` (`perFloor`, `deeper`); the
FOE's space pays the FOE's (`foe`). Walked up pays all, the Wake Whistle `ECON.escape.keep`, a fall nothing. Materials are sold or
pressed as any are. **The draft pays nothing**: the numbers are printed, never earned, until the floors are real.

## 6. Measured (`node scripts/wellboard.mjs`)

200 runs a row, a story run (three floors and the FOE), with the board game's own rules (section 11) and the dice battles (section
12) on. "Plans" reads each die's reach, and what hand it would leave for a fight, and throws the best one; "any die" throws at
random. `skill` is how often a round of a battle is played well, and the chance a trial (still a stand-in) is cleared.

| the seat | downs the FOE | out by the Wake Whistle | falls | turns | floors played | cubes home | real minutes | x aim |
|---|---|---|---|---|---|---|---|---|
| alone: plans, skill 0.80 | 86% | 13% | 2% | 25 | 8.4 | 202 | 21.7 | 1.16 |
| alone: any die, 0.80 | 39% | 56% | 2% | 30 | 8.0 | 158 | 22.1 | 0.89 |
| alone: plans, 0.60 | 82% | 13% | 3% | 30 | 8.1 | 190 | 22.1 | 1.07 |
| alone: plans, 0.95 | 93% | 8% | 0% | 24 | 8.6 | 217 | 22.1 | 1.23 |
| three rivals: plans, 0.80 | 29% (a rival does: 64%) | 7% | 1% | 19 | 6.2 | 129 | 16.1 | 1.00 |
| three rivals: any die, 0.80 | 6% (84%) | 8% | 2% | 19 | 4.6 | 88 | 13.1 | 0.84 |
| three rivals: plans, 0.95 | 35% (61%) | 4% | 1% | 19 | 6.6 | 150 | 17.0 | 1.10 |

With three rivals a planner at 0.80 places first to fourth 30%, 24%, 24%, 23% (the rivals plan too); throwing any die it places
last 45% of the time; at 0.95 it places first 37%. About nine duels a game among four seats.

A battle by the hand it is fought with (2000 battles a cell, played by `battleBest`; won / won flawless):

| the foe | all six dice | d10 d12 d20 | d4 d6 d8 | d4 d6 | bare hands |
|---|---|---|---|---|---|
| a fight, floor 1 | 100% / 100% | 100% / 97% | 100% / 77% | 97% / 0% | 94% / 0% |
| a fight, floor 3 | 100% / 65% | 98% / 39% | 88% / 0% | 5% / 0% | 1% / 0% |
| the FOE | 94% / 37% | 64% / 5% | 2% / 0% | 0% | 0% |

How to read it: a run's length is modelled as 2 real minutes a floor played and 12 real seconds a turn (`MINUTES`); "x aim" is
cubes a minute against `ECON.perMinute`. Today's Great Dunemaw run pays `wellPay(3, 1)` = 139 cubes for about 17 minutes.

What it says:
- **Die choice is the game.** Alone, planning the dice is worth a quarter more pay and more than twice the chance of downing the
  FOE; and the second table is why: the dice you did not move with are your hand, so the FOE met with the big dice spent is lost.
- Alone it pays a little over the aim (1.16) for a slightly longer run; `PAY.share` is the one knob, and it is Dovina's.
- With rivals the run is shorter (someone downs the FOE and it ends for all), and it is a race: you down it yourself about three
  times in ten.
- Nine duels a game is many. `BOARD.duelRest` (a seat that has duelled is left alone two rounds) is the knob.

What it cannot say: whether it is fun. That is South's, in play.

## 7. How it is built

| piece | where | lane |
|---|---|---|
| the layout and the numbers | `src/progress/wellboard/layout.js` | Dovina's |
| the rules (the table engine's shape: `setup`, `pending`, `apply`, `result`, `view`) | `src/progress/wellboard/rules.js` | Dovina's |
| the bot, the pay | `bot.js`, `pay.js` there | Dovina's |
| the session and its page | `src/world/well/board/boardsession.js`, `boardpage.js` | Petra's |
| the board in 3D | `src/vfx/wellboard/` (`boardview.js`, `boardring.js`, `boardkit.js`) | Calissa's |
| the log's rules | `src/feedback/tracking/wellboard.js` | Petra's; the words Espada's |
| the simulator, the shots | `scripts/wellboard.mjs`, `scripts/wellboard-shot.mjs` | Dovina's, Calissa's |

Hub edits: one line in `boot/chatcommands.js` (the session built), two in `feedback/tracking/rules.js`, the draw's line in
`boot/frame.js`.

**The one seam that matters:** `game.wellBoard.floor('clear' | 'true' | 'fail')`. A floor module is entered when the rules ask for a
floor (`pending().kind === 'floor'`, with its `floor` kind and `depth`), and calls that when it ends. Strawman's Well's stages
already end on `well.stage.clear` with a rank: the sidescroller is one adapter away from being the first trial.

**Legible from the first day** (AGENT-INTERFACE.md): the rules never draw. `readout(state, seat)` is the turn as data (where you
stand, each die's reach, the decision waiting and its moves by id), and the page, the bot and an agent all read that one thing.
`game.wellBoard.readout()` and `.take(move)` are the readout and the intent the System's interface would register.

## 8. Open, for South

1. **Does it read as fun?** `/board` in DEBUG. The stand-in buttons make it a board game without its floors; judge the die and the
   ring, not the pacing.
2. **G93, still yours:** does every Well have a board, or is the board a second kind of Well beside the Great Dunemaw's floors? The
   draft assumes the second: nothing of the Dunemaw is touched.
3. **Four cracks to a fall** stands in for the vessel's four regions. Should a board crack be a real crack on the vessel, carried
   out of the Well and mended at the kiln? (I think yes: one vessel, one rule. It makes a spring space matter more.)
4. **Co-op.** The rules take one to four seats on one board, floors cleared for everyone, doors opened for everyone. Untested beyond
   the simulator.
5. **The board as a tarot spread** (ENDGAME.md 3.1): a ring of twelve is the zodiac's wheel, and the d12 is the zodiac's die. A
   look's question, and Espada's.

## 9. For the divisions, when you look this over

- **Dovina:** the numbers are in `BOARD` and `PAY`, each with its reason; the simulator is yours to retune. I priced a floor at a
  whole `perFloor`; you know whether a space is worth a Dunemaw floor.
- **Petra:** the session is small and counts nothing; `floor()` is the seam. Nothing of yours was changed but the two hub lines.
- **Calissa:** section 10 is a first look, yours to keep, change or replace. The data a look needs is `readout()`, each space's
  `x`, `y`, `side`, and the rules' log (each step of a walk is in it).
- **Wanda:** no sounds. The events are `board.throw`, `.land`, `.haul`, `.crack`, `.mend`, `.door`, `.out`.
- **Espada:** every word is plain and a placeholder: the log's lines, the kinds' labels, "the fate die", "keys".

## 10. The look (South, 2026-11-14: "Mario Party and Dokapon Kingdom ... taken to a psychedelic esoteric extreme")

A draft look, `src/vfx/wellboard/`, drawn in a scene of its own in place of the world while the page is open (as the reading
view's scene is), through the game's glow and grade.

- **The void.** One sky dome. The zenith is an eye (the house's convention for every sky), the horizon a seven-fold kaleidoscope
  of drifting colour, the nadir the Well: a spiral of the film turning down into a lit throat. It shifts hue a floor.
- **A floor is a wheel.** An annulus floating over the shaft, its top painted as a zodiac wheel in gold on indigo (twelve houses for
  twelve spaces, a heptagram on the shaft's lip), its walls in the labradorite's film. The floor below is seen down the shaft.
- **Pads, one colour a job** (Mario Party's rule): a cream foot, a saturated body, a white icon keylined dark (Dokapon's thick
  outline). Fight red, Trial violet, Cache gold, Spring teal, Hazard crimson on black, Shift blue, Rest green. A worked pad greys
  under a check. The short cut is stepping pads across the shaft; the long way floats outside the rim on shards.
- **The door** is a gold arch whose portal turns in the film once its ring's two floors are cleared; **the FOE's space** wears a
  spiked eye that opens when it wakes. Over the shaft hangs **the heart**: an armillary round a stellated core, an orb a key.
- **Your piece is your Pneuka Jar**: the owner's model cloned and fired in your vessel's glazes, hopping pad to pad, squashing as it
  lands.
- **Your dice** float along the top as their solids in their suits' inks. A click picks one and its reach rings the pads; a second
  click throws it. It tumbles out over the Jar, its face is said big over the Jar's head, and counts down a hop.
- **A turn is played as beats** from the rules' log (the throw, each step, the landing, a piece of haul, a crack, the fate die,
  the way out); the page waits while they play.

What it costs, said plainly: two shader programs of its own (`wellboard-sky`, `wellboard-toy`), compiled on the first `/board`,
not at the warm-up; the Jar's materials lit by this scene's two lights are a variant of the finish program. Neither is in the
perf baseline. One line in `boot/frame.js`'s draw (twice: the frame and the manual draw).

Seen headless at 1280 x 720 and 896 x 414 (`scripts/wellboard-shot.mjs`). What I would change next: the dice tray crowds the far
pads at the top; the game's log and Lachrimeter are still drawn over the scene; the icons are soft at 480 lines.

## 11. The board game's own (South, 2026-11-15: "its mario party and dokapon kingdom derived after all, so think about what we're missing")

What Mario Party and Dokapon Kingdom have that the first draft did not, each built on the same kernel (`rules.js`), each a row of
data (`layout.js` BOARD, `items.js`):

| what | the rule | from |
|---|---|---|
| rivals | up to four seats on one board, in turn. In play: you and three of the siblings, each the board's bot in its own style (`RIVAL_STYLES`: who plans, who hoards, which stance each leans to). Each seat clears its own floors and opens its own doors; a cache is taken once, for all. | both |
| the purse | cubes found this run: spent at a shop, robbed in a duel, home with the haul | both |
| items | three held, one used a turn before the throw: Twin throw, Loaded die, Mending kit, Door pick, Swap, Snare, Fresh cast | Mario Party's items |
| a shop, an item space | a shop sells one of three items fixed by the board's seed; an item space gives one at random | Mario Party |
| an Arcana space | draws one of fourteen Major Arcana, which does what it says, for good or ill (the Star: 20 cubes; the Tower: a crack and half your cubes; the Wheel: trade purses with a rival) | Chance Time, Dokapon's roulette |
| a duel | landing on a rival: each picks Strike, Feint or Guard in secret (Strike beats Feint beats Guard beats Strike); the winner takes the loser's newest material, or 15 cubes | Dokapon's battles |
| a snare | set on your space by an item; the next rival to land there pays you 15 cubes | Mario Party's traps |
| the stray | one a ring, walking a d4 a round. Land on it, or have it walk onto you, and it is fought | Dokapon's wandering monsters |
| the end | a story run ends for every seat when the FOE falls. The standings add cubes, the haul by tier, and three bonus awards of 15 (most floors cleared, furthest walked, most duels won) | Mario Party's bonus stars |

The layout changed to carry them: a floor's main line holds an Arcana space and an Item space, and a tenth space that is a Shop on
the odd floors and a Rest on the even; the long way holds a Shop.

## 12. The dice do three things (South, 2026-11-15: "look into ... how Dicey Dungeon's mechanics work. Obviously using all the dice for movement is wasted design space")

What Dicey Dungeon does: each turn you throw your dice, and each die is set into a slot of a piece of equipment; the slot says
which dice it takes (a maximum, evens only, a countdown that several dice fill) and the equipment does one thing with the face it
is given; some equipment only reshapes dice (split one, throw one again). The foe's dice are thrown where you can see them.

Here, a die of the cast is still spent once, and there are now three things to spend it on or keep it for:

1. **A move** (as before): throw it, walk its face.
2. **A power** (`items.js` POWERS; the god hand's powers at the board's scale): once a turn, before the throw, set a die into a
   power's slot. It is spent as a throw would spend it. **Ward** (any die): the next crack, snare or lost duel is turned aside.
   **Push** (any die, thrown): a rival on your ring, or its stray, is carried back that many spaces. **Transmute** (the d12 or the
   d20): every Hazard on this ring becomes a Spring, for everyone, for good.
3. **A battle** (`battle.js`): a fight, a stray and the FOE are no longer handed back as won or lost. They are fought with **the
   dice you have not spent**. Each round that hand is thrown, the foe's dice are thrown and shown, and you set each die into one of
   six tool slots:

| the slot | takes | does |
|---|---|---|
| Cutlass | any die | deals its face |
| Psygun | a face of 4 or less, twice a round | deals its face + 2 |
| Lockheart | an even face | guards that much of the foe's blow |
| Dreamvane | a face of 2 or more | splits it into two dice |
| Veritome | any die | throws it again |
| Crucibelle | any dice, across rounds | counts down from 12; at 0 the foe's blow is stopped |

   Then the foe's blow lands on your **poise** (16, less 2 for each crack you carry: the cracked vessel, said on the page), less
   your guard. Poise gone, the battle is lost: a crack, as a failed floor was. A battle won with no poise lost is **flawless**: the
   material is a tier higher. A battle spends no die. With fewer than two dice left you fight with bare d4s.

Why this shape: the cast is now one resource pulled three ways. The d20 that would carry you to the door is your heaviest blow at
the FOE; the d4 that barely moves you is the Psygun's best die and a cheap Ward. A Rest and a Fresh cast are worth more the nearer
the FOE. It is the house's law (one substrate, modifiers with a seen source) and it teaches expected value and keeping a reserve
without saying so. Section 6's second table is the measurement.

Stand-ins, said plainly: every seat has the same six slots (they want to be the tools you wear, and a shop's stock); a foe has
health and a blow and nothing else (no status, no slots of its own); a trial is still asked, not played; the Soul Brush has no
slot. In 3D a battle is words over your Jar, not a staged fight.
