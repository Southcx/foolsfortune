# Puzzle duels: the aberrant Figments' fights on a board

**Names: the genre's words, everywhere** (the owner, 2026-10-19: "use standard genre names for the rest too, please. I don't know what
any of those mean out of context"). No lore names: the UI, the log and the code say the same. A **duel**; **the Line**; **junk**; a piece's
**kick** (Bomberman's); a **match** (three in a line); the Courier's **run**; a **break** (code `duelBreak`, `duelbreak.js`); an **orb**;
the **finisher** (code `FINISHER`, a duel's; not `stun.finisher`); **Flee**; the tools' moves **Shoot, Grab, Drill, Paint, Delay, Hold,
Send**. The log: "You break the Figment." Retired from this plan: wrangle, the March, grog, punt, glean, buckle, teardrop, coup, wriggle.

Kept by Dovina (the rules, the engine, the numbers). The look is Calissa's, the sounds Wanda's, the names and each Figment's lore
Espada's; the controls of the forms and the room's wiring are Petra's. **The engine's kernel is built** (section 10); the rest is a plan.

> "A 20x20 board between two entities with a sliding line between the two that determines where your zone of control is, your range
> of movement... The foundation is garbage-sending games like Puyo Puyo Tetris, but I would like to build a module/engine that supports
> so many more block/grid interactions, like to a ludicrous degree... The biggest influence probably being the game Noon for PS1... rather
> than have it be a frenetic realtime puzzle sort of combat, it takes a slight step back and opts for having a set # of actions you can
> take per turn, so it becomes much more chess-like... This module is the 'throw every grid based puzzle mechanic at the wall and see what
> sticks'... balance be damned." (the owner, 2026-10-19)
>
> Ruled the same day: the Courier and the god hand are both forms on the board ("think Terra Battle tile sliding mechanics too! I mean
> it, we're gonna go all in"); gravity in many directions; one aberrant Figment is one ruleset ("Bingo, baby").

## 0. The idea in one line

**A turn-based versus puzzle on a 20 × 20 board, split by a line that is the score: every grid mechanic ever made is a rule module the
engine can load, and each aberrant Figment brings the two or three that are its mind.**

## 1. Prior art, and what each gives

| game | what is taken |
|---|---|
| **Noon** (MicroCabin, PC 1996, PS1 and Saturn 1998) | the root. One shared field, bodies walking it and **pushing and kicking** gems; a **territory** each, filled by the other's garbage; the **rainbow** gem that also clears the garbage beside it; garbage **crushed** between walls; a **special** charged by clearing garbage. Its known flaw, mushy real-time pushes, is why ours is turn-based |
| **Puyo Puyo Tetris** | garbage sent by **chains**, and **offsetting** (what you send cancels what is coming first) |
| **Super Puzzle Fighter II Turbo** | **timer garbage** (counter gems that turn normal after a count), the crash gem that clears its colour on contact |
| **Magical Drop III** | **grab and throw**: pull a column's bottom run into the hand and throw it back elsewhere |
| **Mr. Driller** | **drilling** down through blocks, chains of what falls after, the air meter |
| **Bomberman** | **bombs** and their cross of blast, kicking a bomb so it slides |
| **Qix** | **claiming area** by closing a line round it: territory you draw, not just hold |
| **Puzzle Pirates** | garbage that arrives in **patterns** chosen by the sender (the swordfight's breakers) |
| **Bejeweled, Columns, Hexic** | the **swap** of two neighbours, the match of three, the **2×2 rotation** |
| **Tetris, Dr. Mario, Meteos** | **dropping** a piece, line clears; **viruses** that must be cleared; **launching** blocks across to the other side |
| **Terra Battle** | the **drag slide**: a piece dragged along a path swaps with every piece it passes; the **pincer**: an enemy sandwiched between two of yours is taken, and pieces in line with the pincer join it |
| **Othello** | the pincer's **conversion**: what is sandwiched becomes yours |
| **Sokoban** | the **push**, never a pull: a push you cannot undo |
| **Baba Is You** | **rules as tiles on the board**, rewritten by pushing them into new sentences |
| **PuzzleScript** (Stephen Lavelle) | the engine's model: a game as **rewrite rules over a grid**, run until nothing changes |
| **Into the Breach** | **perfect information**: the opponent shows what it will do next turn, and you plan around it |
| **Puzzle Quest** | turn-based versus match-3, the closest commercial relative (it hides the foe's intent; ours shows it) |

## 2. The board

- **20 × 20 cells.** Each cell has a **floor** (plain, ice, a conveyor, a hole, a pit) and holds at most one **piece**.
- **A piece** is a gem of a feeling's colour (the seven), a junk block, a stone, a bomb, a timer junk, a rainbow, a virus, a
  rule tile, or a body (the Courier). What a rule may do to a piece is **its tags** (`falls`, `pushable`, `matches`, `heavy`, `breakable`,
  `explosive`), as `core/tags.js` does for the world: a rule asks the tag, never the kind.
- **The line**: a column boundary between the two sides, at 10 to start. Your side is your zone of control: **the hand acts only on your
  side, and the Courier walks only on your side.**
  - Garbage you land pushes the line toward them, one column for every 3 landed (4 at 3 AP; section 11).
  - **You win when the line reaches their back wall**, or (Noon's win) when their side has no empty cell left at the end of a turn.
  - A ruleset may make the line **jagged**, one boundary a row (Qix's claiming); straight is the default.
- **Gravity is a map**: every cell has its own direction (down, up, toward the line, away from it, toward a point, or none). A ruleset
  sets the map; a rule can turn it (a Figment's action: "the floor tilts").

## 3. The turn

- **5 action points a turn** (the owner's; a knob). Then the board **settles**, junk crosses, and the other side plays.
- **Settling** is the PuzzleScript loop: every settle rule runs (gravity, sliding on ice, matching, exploding, timers), again and again
  until nothing changes. Each pass that clears something is a **chain step**.
  - The loop is capped at 64 passes, and a board seen twice in one settle ends it. That is the guard against a cascade that never ends.
- **Garbage** for a turn is the sum of its chain steps: each step clearing *n* pieces gives (*n* − 2) × 2^(step − 1). It cancels
  what is coming at you first (offsetting), then crosses and lands on their side, from the edge their gravity points away from.
- **The opponent's next turn is shown before you act** (Into the Breach): the Figment's plan, its intents drawn on its pieces.

## 4. The forms (the owner: the Courier and the god hand both play)

| form | where | its actions (AP) | from |
|---|---|---|---|
| **the Courier** | a body on a cell of your side | **run** up to four cells 1, **push** a run of pieces one cell 1, **kick** one piece to slide until blocked 2, and its tools (section 11) | Noon, Bomberman, Sokoban, Mr. Driller |
| **the god hand** | over your side | **the finisher** on a broken foe 2 (section 11), **swap** two neighbours 1, **drag** a piece along a path, swapping with each it passes 1 a 3 cells, **rotate** a 2 × 2 1, **drop** the next queued piece down a lane 1 | Bejeweled, Terra Battle, Hexic, Tetris |
| (switching form) | | 1 | |

The Pneuka Jar as a form (a piece you protect, Dr. Mario's virus turned round) is a later module.

## 5. The rule catalogue (the engine's modules)

Built in the kernel: **gravity** (the map), **match** (three or more in a line), **cluster** (four or more touching, Puyo), **push**,
**kick**, **swap**, **drag** (Terra Battle), **rotate**, **drop**, **pincer** (Terra Battle and Othello: an opponent's piece sandwiched
in a line between two of yours becomes yours), **bomb** (Bomberman's cross, set off by a clear beside it), **junk** with offsetting,
**the line**.

To come, each a module of its own:
- **matching:** diagonal runs (Columns), the crash gem (SPF2T), the rainbow (Noon);
- **clearing:** line clears (Tetris), Lumines' sweep, Qix claims, drilling (Mr. Driller);
- **movement:** ice and conveyors, grab and throw (Magical Drop), launching across the line (Meteos);
- **junk:** timer junk (SPF2T), hard junk (two hits), junk in patterns (Puzzle Pirates), viruses (Dr. Mario);
- **rules as tiles** (section 6).

## 6. A Figment is its ruleset ("Bingo, baby")

An aberrant Figment's data is its rules, its gravity map, its bot's priorities and its rule tiles. The engine carries everything; **a
fight loads the base and two or three families**, so 400 cells stay readable. Its feeling chooses the families:

| feeling | its families (a first pass) |
|---|---|
| Wonder | rules as tiles (the Baba layer), the rainbow |
| Mirth | chains, bounces, ice |
| Desire | pull and magnets, the pincer |
| Fury | bombs, kicks |
| Gall | sticky and hard junk, corrosion |
| Grief | gravity toward the line, clusters that sink |
| Dread | fog (cells hidden), timer junk |

- **The rules are spelled on its side as neuralese tiles** (a sentence a rule: GEM FALL TOWARD LINE). Pushing one breaks or rewrites
  that rule: **reprogramming made physical**, the Veritome's Functions turned into a board.
  Espada's first tiles (LORE.md, proposed): fury LITHA-PIRO KRAKA (bombs), LITHA VADA-LON (kicks); grief LITHA DEO VADA-MURA (sink
  toward the wall), LITHA-MULTA KITH TE, ONO MOR (clusters), LITHA-ALI TOPA-DUO META AMI (pincer); mirth SORA META DEO (mirrored
  gravity), KRAKA KRESA (easy chains). A word pushed out leaves a smaller sentence that still parses (META DEO: gravity comes home).
- **Familiarity reads its rules**: the tag's lines over its board, decrypted as you learn the kind (OVERLAY.md 17).
- **Beating it mends it**: an aberrant Figment is a data bug drawn wrong; its duel won, it is drained and mended (the data drain).

## 7. What it is worth

- **The Assay reads it for free** (APTITUDE.md): planning (your turn's junk against the most the bot could find with the same AP),
  mental rotation (the rotate and drop actions), visual search.
- **Rewards** are the economy's next pass: the mended Figment's haul, a bounty where Letty posts one.

## 8. The look and the controls (asked of the divisions, not ruled here)

- **Calissa:** the board between the two, the line, the pieces by family, the intents, the settle played as steps (the engine returns
  its events in order so the view can animate each).
- **Petra:** the forms' controls on the board, the room the duel opens in (a seam from the encounter), the camera.
- **Wanda:** a chain's rising notes, the line's push, the clear.
- **Espada:** the names (the duel, the line, each rule's words), and each aberrant's rules as neuralese sentences.

## 9. Ruled by the owner (2026-10-19)

1. **5 AP a turn** ("let's start with 5AP"). Each player on a side has their own (section 12).
2. **Losing a duel is a shatter**, as being beaten in any fight: the Courier shatters and is made whole as usual; the aberrant Figment
   stays where it was, its EmO back to calm.
3. **Co-op is planned for** (section 12).
4. **The Courier is the fight; the god hand is the puzzle** (section 11). The owner's words: "direct special attacks that circumvent the
   board, maybe a critical garbage push causes the enemy figment's EmO to spike in a shower of lachryma that you can quickly run around
   and absorb before swapping to Godhand mode to finisher de grace them."

## 10. Built (2026-10-19): the kernel

`src/progress/duel/`: the engine, pure (no three.js), so a board plays in the room, by bots and in the simulator alike, as Raku's tables
do.
- `board.js`: the grid, the floor, the gravity map, the line, tags.
- `rules.js`: the kernel's rules.
- `duel.js`: the turn, AP, the settle loop, junk and the wins.
- `bot.js`: a greedy planner that also gives the shown intent.
- `rulesets.js`: the first three Figments' rulesets.
- `duelbreak.js`: EmO, the break, the shower of orbs, stun depth on the board, the finisher (section 11).
- `dread.js`: Dread's fog and embers (section 14).
- `flee.js`: the flee, a saving throw out of the duel (section 15).
- `couriertools.js`: the Courier's run and its tools on the board (section 11).
- `scripts/duel.mjs`: duels between bots, headless, with lengths, junk rates, and every settle that hit the cap.

### What the simulator said first (the kernel alone, 10 duels a ruleset, 3 AP)

| ruleset | turns a side | junk a turn | longest chain | how they end | settles capped |
|---|---|---|---|---|---|
| fury (4 colours, rain 4, bombs 6%) | 13.4 | 3.8 | 6 | full 6, line 4 | 0 |
| grief (6 colours, toward the line, clusters, pincer) | 7.5 | 4.5 | 3 | line 9, full 1 | 0 |
| mirth (5 colours, rain 3, mirrored gravity) | 7.0 | 7.1 | 5 | line 8, full 2 | 0 |

- **Rain is the knob that matters most**: fury at rain 2 ran 61 turns a side (2 duels hit the 200-turn cap); at rain 4, 13.
- **At 2 AP** duels barely shorten (grief 4.4, mirth 6.7), and fury at rain 2 ran 126 turns: the AP sets how deep a turn's plan is,
  rain sets the pace.
- **The greedy bot never switches form** (a point spent for nothing at once). With the Courier first (`--forms courier,hand`) it walks,
  pushes and kicks, and makes a third of the junk the hand does. The Courier needed a reason the hand lacks: section 11 is it.
- No settle has hit the cap or looped in any run so far.

## 11. The Courier is the fight; the god hand is the puzzle (built 2026-10-19)

**The loop.** The hand makes junk. Junk landed raises the foe's **EmO**; a **critical push** (8 or more landed at once) or EmO full
**breaks** it (label Break; Espada's lore word, proposed: "The Figment breaks."). A break:
- deepens its **stun depth** (dazed, stunned, out cold: STUN-DEPTH.md's three), which costs it action points: 1, 2, then its whole turn.
  The stun holds 2 of its own turns, and a new break while it is down refreshes it a depth deeper.
- sheds a shower of **orbs** (label Orb; Lachryma is Latin *lacrima*, a tear: one for every 2 junk, 3 to 12) onto your side within 6 cells of your Courier. They last
  **one turn**: switch to the Courier, **run** them (a path of up to four cells for one point), and each fills the pool by 8.
- opens **the finisher** (label Finish; the log: "You drain the Figment."): switch back to the hand and finish it (2 AP), paid from the pool by depth: **60 dazed, 40 stunned, 20 out cold**.
  The deeper it is down, the cheaper the finish; the finisher is the data drain in the board's form.

**The Courier's tools on the board**, each a special attack that goes round the puzzle, paid in points and the pool:

| tool | its move | AP | pool | the genre's mechanic |
|---|---|---|---|---|
| (none) | **run** up to four cells, drinking the orbs it crosses | 1 | 0 | Sonic's rings gathered back |
| the psygun | **shoot** the first piece past the Line in your row (their chain may set off and come back at you) | 1 | 5 | Meteos' launch |
| the Sondelass | **grab** that piece back across to your side | 1 | 5 | Magical Drop's grab |
| the Dreamvane | **drill** up to three pieces in a line from you | 1 | 3 | Mr. Driller |
| the Soul Brush | **paint** the 3 × 3 round you one feeling, junk and all | 2 | 10 | Columns' magic jewel |
| the Crucibelle | **delay** (the toll): the foe loses a point next turn (two at most) | 2 | 15 | Tetris 99's attack badges |
| the Lockheart | **hold** the junk beside you into the coffin (12 at most); **send** it all at the foe as junk | 1 / 1 | 0 / 5 | Tetris's hold |
| the Veritome | (to come) a plate of the foe's side reads its rules as familiarity | | | |

Only the tools the Courier wears come to the board. The push and the kick stay.

**What the simulator says** (20 duels a ruleset, 5 AP, the Line a column for every 3 junk; the bot always tries a form switch and the finisher):

| ruleset | turns a side | breaks a duel | orbs run up a duel | how they end |
|---|---|---|---|---|
| fury | 25.9 | 1.6 | 2.5 | line 13, full 3, finisher 3, cap 1 |
| grief | 5.7 | 1.9 | 1.4 | line 17, finisher 2, full 1 |
| mirth | 16.3 | 1.2 | 1.9 | line 14, finisher 5, full 1 |

- **5 AP made offsetting strong**: at 4 junk a column, fury ran 60 to 85 turns a side. At 3 it runs 20 (a blast kept to its own side,
  since Calissa's mock).
- **The finisher ends about one duel in six.** A greedy bot spends its points on swaps before it runs; a player who plans the break
  should finish more. The finisher's price (60 / 40 / 20) is the knob if it needs to come sooner.
- The greedy bot dithered between forms (about one switch a turn). It now never switches twice in a row and a switch costs it a little:
  switches fell by half or more, and it runs twice as often.

## 12. Co-op on the board (planned for, the owner, 2026-10-19)

- **A side holds the party**: the Courier and up to three more (siblings or guests: the party's four at most). Each has **their own form,
  their own 5 AP and their own pool**, and acts in any order inside the side's turn; the side's turn ends when all have ended.
  Shared: the side's ground, the junk it sends and takes, the orbs (whoever runs one drinks it).
- **The finisher can be paid together**: each hand on the side puts in from its own pool (a Spirit Bomb).
- **A sibling plays with the bot**, weighted by its division (Petra builds walls of room, Calissa paints, Wanda chains, Espada hooks,
  Dovina gambles on the finisher): its intent is shown like the Figment's, so you plan round your sibling too.
- **The Figment answers a bigger side** with more points and rain. The simulator cannot set it yet: the greedy bot does not get much
  stronger with more points (10 AP against 5 won 5, 8 and 4 duels in 10 across fury, grief and mirth), so the price is set in play.
  First guess: +3 AP and +1 rain for each player past the first.
- **Built:** a side's own AP (`newDuel({ ap: [10, 5] })`, `--ap0 --ap1`). **Not built:** more than one Courier body on a side.

## 13. Ruled for the view (Calissa's mock, round 11; Dovina, 2026-10-19)

Names since: the genre's (see the top), ruled by the owner the same day.

1. `line` carries `w` and `side` (whose junk pushed it). The engine knows sides, not who; the room maps a side to the bus's `by`
   (`courier`, `creature`) when it emits.
2. `land` carries its cells (`at`).
3. **A blast stops at the Line** (it was a bug: a bomb on the Figment's half cleared the Courier's gem and counted it as the Courier's
   chain). A clear sets off only bombs on its own side, and a blast's cross stops at the Line, as a fall does.
4. `fall` is one event a piece with its whole way (`from`, `to`); `clear`, `break` and `pinch` carry their `side`.
5. A pinch turns the piece, keeping its id (as the Soul Brush's paint does).
6. **The intent is a live forecast, not a promise.** It is what the Figment would do if you stopped now: redrawn after each of your
   actions, its first step bold and the rest fainter (they are drawn on a board the first one changes). Into the Breach's promise does
   not fit a board that settles under every action; the forecast keeps its use, which is planning round it.
7. **The Courier does not fall: intended.** The Courier is a body on the board's face, not a piece in its well (Noon's bodies walk the
   field from above). On the upright board it reads as standing on the face of its cell; the look is Calissa's.
8. Words: a settle's chain is **a duel's chain** (the homonym table); what each side is given at the start of its turn is **the drip**
   (`rs.drip`, event `drip`), not rain, which is the weather's.

**Ruled on Calissa's board v11** (Dovina, 2026-10-19):
9. **The finisher is the Courier's side's only.** The data drain never touches the Courier (the owner), so a Figment's side has no finisher; a
   broken Courier loses its points and nothing more. (`newDuel({ finisher })`, `[true, false]` by default; the simulator gives both chairs
   one to measure alike, `--finisher courier` to play it as the game does.)
10. A spend says what it cost: the action's own event carries `spent` and `pool` (the pool after), the finisher's and every tool's alike.
11. A turn begins with a `turn` event: `{ side, ap, lost, depth, stagger }`, so a stun's or a toll's bite is never silent.
12. The break's reason is `cause` (`push` or `emo`); `by` stays the bus's word for who.
13. After a finisher the board is the view's: draining the Figment's half and sending the Line home is the ceremony, not a rule. An orb
    goes with its ground: if the Line passes over its cell, it is the other side's to run (or lose).


## 14. The first in game: the aberrant Lantern Wisp (the owner, 2026-10-19, on board v11)

The owner: "an incredible first pass", and into the game, with an aberrant Lantern Wisp as the test enemy; the upright tsuitate the
default; the god hand in its current mode the cursor; the backdrop two minds clashing (Jujutsu Kaisen's Domain Expansions meeting).

**Its feeling is Dread.** A will-o'-the-wisp is the light that leads you off the path: it shows you only what it wants you to see. So its
half of the board is Dread's (`dread.js`, the first rule family past the kernel):
- **Fog:** its half is hidden but for the light of its lantern, 3 cells round its body on the board. The engine keeps the whole board;
  `visibleTo(state, viewer, x, y)` says what you may be shown. Its forecast is still drawn (Divination sees what it means to do, not the
  ground it does it on): you see its hand move into the dark.
- **Embers:** the junk it sends lands as embers that burn down 3 of your turns. While burning they cannot be broken by a clear beside
  them, pinched or hoovered; cooled, each is a gem of a random colour. Dread is the wait. (Super Puzzle Fighter II Turbo's counter gems.)
- **Its half burns upward:** a flame's updraft, its pieces rise while yours fall, two domains meeting at the Line.
- Matches of three; 4 colours; a drip of 4. `RULESETS.lanternwisp`; `rulesetOf(creature)` gives it to any Lantern Wisp (`KIND_RULESETS`).

**The simulator** (20 duels, 5 AP, the finisher the Courier's only): 22.8 turns a side, the Line ends every one, wins 10 to 10, 0.9 breaks
and 1.1 orbs run up a duel. Bots see through the fog, so the fog's cost to a player is not in these numbers; a player will be
slower to read the Wisp's half and better at the break. Plain Dread (`RULESETS.dread`, gravity down both halves): 32.2 turns a side.

**How a Lantern Wisp goes aberrant** (a rule for the world; the Wisp and the blots are Petra's to build): **its lantern burns crude.** A
Lantern Wisp that drifts over a blot at night drinks it, as a lamp drinks oil, and its flame goes wrong: it is aberrant (`c.aberrant`,
dressed as a data bug), and the blot is spent. One a blot, and only at night (the Wisps are the Dunes' night Figments). It keeps its
kind's ruleset whatever the weather; the weather's feeling where it drank is its `grade`, for its look and a bounty.
- **For the test:** one placed at night near the oasis, with its debug chest (the Soul Brush and a few Lachrymato Bottles' worth, so the
  pool can pay a finisher). The placement and the chest are Petra's.

**How a duel opens** (my recommendation; the room, seam and camera are Petra's): **the first blow that lands on an aberrant Figment
opens it.** Two minds meet and the domains expand; a duel is never started by a key. Losing is a shatter (section 9); the finisher mends it
(the data drain), and a mended Lantern Wisp is an ordinary Wisp again, curious and skittish.

## 15. Fleeing: a saving throw (the owner, 2026-10-19: "rolling like a saving throw to let you escape"; a failed one gentle at 3 AP)

Name: **Flee**, the standard game word (the owner, 2026-10-19: "Flee is more than appropriate"; no lore name). The log (the session's
rule): "You flee the duel." / "You fail to flee." / on a natural 20, "You flee at once."

Built: `flee.js`. **Flee** is an action in either form, 3 AP, the Courier's side only (`newDuel({ flee })`, `[true, false]`).
- **The roll:** a d20, plus the board's modifiers, must reach **15**. A natural 20 always gets away; a natural 1 never does.
- **The modifiers** (`fleeOdds(state, side)` gives the roll needed, the bonus, each part and the chance, for the overlay to show before
  you commit: "FLEE 45%", the published odds the Lockheart's break chances keep):
  - **the Line:** +1 a column held past the middle, -1 a column lost;
  - **the break:** +3 a stun depth the Figment is down (running from a dazed foe is the smart run);
  - **pity:** +3 for each failed try this duel (Pokémon's Run: each try raises the next);
  - **Luck:** 0 to +2 (`newDuel({ luck })`; ruled 2026-10-19 on Petra's placeholder): `floor(luckOf(ledger).level / 10)`, so +1 at
    Luck level 10 (100 bits, about fifteen prismatic chests' surprise) and +2 at 20. Never negative: Luck only rises, since bad luck lived
    through counts too (`luck.js`). The Figment's side is 0 (it keeps no ledger).
- **Only a failed roll costs** (ruled 2026-10-19, Calissa's question): 3 AP are needed to roll and are held for it; a failure keeps
  them and the duel goes on (2 AP left of a fresh turn); a success hands them back (the `flee` event's `ap`: 3 on a failure, 0 away),
  so a view spends the points only on a miss. **Away:** both whole, no shatter and no reward;
  the Figment keeps its aberrance, its EmO back to calm, and drifts off. The duel ends with `winner: -1` and `fled: side`, event
  `duel.fled`; the ledger counts it through the session's `duel.end { how: 'fled' }`.
- **Measured** (400 duels, fleeing from the first turn of an even fight): every one got away, in 2.3 tries on average, 5 at most (113,
  116, 109, 48 and 14 on tries 1 to 5). Down 4 columns with the Figment stunned: 40%; an even fight after two misses: 60%.
- **The bots** flee only when losing by 4 columns or more and the odds are 40% or better: once in 120 duels. A roll is judged by its
  odds, never sampled with the rest (a clone's die would let the bot see it fall).
- The sure way out stays the Wake Whistle's to give (an item that ends a duel whole, unrolled): the plan's, not built.

**Ruled on Petra's room** (630dccc; Dovina, 2026-10-19):
16. **A Figment's ruleset comes from `rulesetOf(c)`** (rulesets.js), not a feeling looked up in the room: it gives an aberrant Lantern
    Wisp its own (Dread's, section 14), a blotling its grade's, and Fury's otherwise. `DUEL_FOES.wispFeeling` goes.
17. Your pool starts at the Courier's own and the difference comes home; the Figment's at 30: as built.
18. **One landing moved the Line 10 columns** (about 30 junk at once, a chain's doubling). Now **at most 9 junk land at once**
    (`DUEL.landCap`: 3 columns of the Line); the rest waits a turn and can still be offset (Puyo Puyo's 30 at a time). Measured, 20 duels
    each: fury 33.0 turns a side, grief 6.2, mirth 16.6, the Lantern Wisp 22.6; finishers up from 1 in 6 to about 1 in 3 (36 of 100: a capped
    landing of 9 still breaks, so a big send breaks the foe turn after turn).

