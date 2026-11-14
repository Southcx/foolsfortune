# The Well's board: a Well run as a board game (a draft)

South, 2026-10-31 (ENDGAME.md): "Well dungeon exploration to me is kind of like our catch all for game genre exploration." ENDGAME.md
3.1 sketched the board: spaces moved across on your own dice, a floor a space, the FOE at the end. South, 2026-11-14: "designing and
drafting the Wells' boardgame module ... you're a free hand. The girls can check over your work later."

Written by a sixth session working as a free hand, on `claude/brave-faraday-gjppx6`. **A draft: nothing here is ruled.** It closes
GAPS G85's design and gives G88 (the endless Well) for free; G93 is still South's. Every name is plain until South calls it final.

**Built:** the rules (`src/progress/wellboard/`), a bot, the simulator (`scripts/wellboard.mjs`), a playable page in DEBUG
(`/board`), the log's rules. **Not built:** a floor's own play (the page asks how it went: a stand-in), the board's look, its sounds,
pay into the purse, touch beyond the page's own taps.

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

800 runs a row, one seat, a story run (three floors and the FOE). `skill` is the bot's chance to clear a floor (it stands in for
play); "plans" reads each die's reach and throws the best one; "any die" throws at random.

| the seat | reaches and beats the FOE | out by the Wake Whistle | falls | turns | floors played | cubes | real minutes | x aim |
|---|---|---|---|---|---|---|---|---|
| plans, skill 0.80 | 64% | 32% | 1% | 27 | 6.3 | 144 | 17.9 | 1.00 |
| any die, skill 0.80 | 37% | 56% | 2% | 27 | 5.3 | 108 | 16.0 | 0.84 |
| plans, skill 0.60 | 34% | 52% | 4% | 38 | 4.9 | 84 | 17.5 | 0.60 |
| any die, skill 0.60 | 12% | 63% | 9% | 25 | 3.5 | 49 | 12.0 | 0.51 |
| plans, skill 0.95 | 89% | 10% | 0% | 24 | 7.1 | 193 | 19.1 | 1.26 |
| plans, 0.80, no re-roll | 61% | 34% | 2% | 27 | 6.1 | 138 | 17.5 | 0.99 |
| plans, 0.80, three re-rolls | 68% | 28% | 1% | 27 | 6.3 | 148 | 18.0 | 1.03 |
| the endless Well: plans, 0.80 (300 runs) | (deepest floor 5.0) | 95% | 0% | 58 | 10.1 | 235 | 31.8 | 0.92 |
| the endless Well: any die, 0.80 | (deepest floor 3.4) | 93% | 2% | 34 | 6.5 | 113 | 19.8 | 0.71 |

The rest of each row walked up from a door. Every bot carries a Wake Whistle and blows it one crack from the fall, which is why so
few fall; a seat without one falls instead.

How to read it: the model of a run's length is 2 real minutes a floor played and 12 real seconds a turn (`MINUTES`); "x aim" is cubes
a minute against `ECON.perMinute`. Today's Great Dunemaw run pays `wellPay(3, 1)` = 139 cubes for about 17 minutes.

What it says:
- The run is the length of today's Well run, with six or seven floors played in it.
- **Die choice is worth about a third more pay** at the same skill at the floors (144 against 108 cubes), and nearly twice the
  chance of beating the FOE. That is the board's own skill, priced.
- Skill at the floors still decides most: a learner gets down less often and brings less home.
- Luck's re-roll moves little here (a few percent). It should stay a small mercy, as DICE.md rules it.

What it cannot say: whether it is fun. That is South's, in play.

## 7. How it is built

| piece | where | lane |
|---|---|---|
| the layout and the numbers | `src/progress/wellboard/layout.js` | Dovina's |
| the rules (the table engine's shape: `setup`, `pending`, `apply`, `result`, `view`) | `src/progress/wellboard/rules.js` | Dovina's |
| the bot, the pay | `bot.js`, `pay.js` there | Dovina's |
| the session and its draft page | `src/world/well/board/boardsession.js`, `boardpage.js` | Petra's; the look Calissa's |
| the log's rules | `src/feedback/tracking/wellboard.js` | Petra's; the words Espada's |
| the simulator, the shots | `scripts/wellboard.mjs`, `scripts/wellboard-shot.mjs` | Dovina's, Calissa's |

Hub edits: one line in `boot/chatcommands.js` (the session built), two in `feedback/tracking/rules.js`.

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
- **Calissa:** the page is a placeholder and says so. The data a look needs is `readout()` and each space's `x`, `y`, `side`.
- **Wanda:** no sounds. The events are `board.throw`, `.land`, `.haul`, `.crack`, `.mend`, `.door`, `.out`.
- **Espada:** every word is plain and a placeholder: the log's lines, the kinds' labels, "the fate die", "keys".
