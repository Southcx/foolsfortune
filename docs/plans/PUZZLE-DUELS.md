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
| (switching form) | | 0 (free since 2026-10-26, section 17; was 1) | |

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

**The Zone of Influence** (the owner, 2026-10-20): your side of the Line is your Zone of Influence, the same as a zone of control but
"influence", because effects can happen on your side outside your control, and on the foe's from yours (junk landing, a Grab, Delay,
Dread's fog). The explored ground is "explored area" on the map now. The name goes on screen when duels are called final.

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


## 16. The duel is a pocket, one on one (the owner, 2026-10-20)

The owner, from play: "When entering the Puzzle Duel, other enemies in the area are still active and will continue shooting projectiles at
the Courier and attacking them. The Puzzle Duel is supposed to be like a special pocket dimension very similar to one-enemy sized Well."
Ruled, with the numbers:

1. **Nothing outside enters.** While a duel is pending or active (`game.duel.active || game.duel.pending`):
   - every other creature is held (the duel's own `pin`, applied to all of them, released at the end);
   - every enemy projectile in flight is cleared;
   - `creatures.strike` with the Courier as the target is refused.
   
   A Well's floor is the model: a sealed room for two. **Assists are parked** (the owner: "put a pin in that ... future mechanics to mine
   from that concept of enemy assists"): one on one, for now.
2. **Aberrants cannot be shot.** A blow or shot on an aberrant Figment does no harm and opens nothing: it passes through, and the hit
   shows the resist mark (`stun.vulnerable`'s mark). The first blow no longer opens the duel; nearness does (3).
3. **Nearness pulls you in, over a beat you can escape.**
   - Inside **4 m** of an aberrant, a pull fills from 0 to 1 over **1.5 real s**.
   - Outside **6 m** it drains back at twice that rate (0.75 s from full). The gap between 4 and 6 m is so the edge does not flicker.
   - At 1 the wipe plays and the duel opens.
   - The pull is shown as a growing chromatic aberration at the edge of the view (Calissa's look), and a sound (Wanda's).
   - No pull in the god hand, the Spirit Garden, on a vehicle, or while shattered.
   - `game.duelFoes.pull` (0..1) is what the look and the sound read.
4. **An aberrant looks wrong at a glance.** It wears an inverted colour (1 minus each channel) over its materials, beside its data bug, as
   a placeholder until its own look (Calissa's).

The events: `duel.pull { foe, by: 'creature' }` when a pull starts from nothing, `duel.slip { by: 'courier' }` when one drains away before
it filled (the log's line: "You pull away from the aberrant."). These are plain placeholders for Espada.

## 17. The aberrant Lantern Wisp made gentler (the owner on the phone, 2026-10-26, relayed by Calissa)

The owner's words: "reduce the difficulty of the enemy Aberrant"; "having the tiles only match to linear match-3 style combos instead of all
adjacent same-color clusters makes it very difficult"; switching between the hand and the Courier, "why it costs AP to switch"; "the enemy is
racking up double digit points every turn when I manage like, six". The explainer for the owner: https://claude.ai/artifact/V2jdQy5xhps8gHy67CV8Rb.

**Measured first** (a scratch harness on the kernel, 8 to 20 duels a row: side 0 a bot weighing 8 actions a point, standing in for the
owner at about 6 junk a turn; side 1 the Wisp):

| the Wisp's rules | you, junk a turn | the Wisp | you win | turns a side |
| --- | --- | --- | --- | --- |
| as it was: runs of 3, 4 colours, the bot weighing 60 actions a point | 5.6 | 13.5 | 1 of 8 | |
| clusters of 3, 4 colours, the bot at 60 | 13.9 | 34.6 | 1 of 10 | |
| clusters of 3, 4 colours, the bot at 8 | 35.8 | 11.7 | 14 of 20 | 3.9 |
| clusters of 3, 5 colours, the bot at 8 | 9.9 | 10.4 | 11 of 20 | 7.0 |
| clusters of 3, 5 colours, the bot at 4 | 9.5 | 6.1 | 12 of 20 | 8.5 |
| **runs of 3 and clusters of 4, 5 colours, the bot at 6 (ruled)** | **9.4** | **3.3** | **15 of 20** | **6.3** |

The gap was the bot's search, not the rules: 60 actions tried a point (300 a turn) finds the chain moves a person does not, and junk
doubles each chain step (`junkOf`). The stand-in sees the whole board and takes no embers, so in play the Wisp keeps a little more edge.


**The swing of one move** (`preview`, the best single action on the opening board, 12 seeds): runs of 3 at 4 colours 9 to 112 junk;
clusters of 3 at 5 colours **52 to 770** (one lucky move decides the duel, and a board that chains itself is hard to read on a phone);
clusters of 3 at 6 colours 14 to 153; runs of 3 and clusters of 4 at 5 colours 10 to 183.

**Ruled (Dovina):**
- **Runs of 3, and any 4 touching in any shape** on the Wisp's board (`match: 3, cluster: 4`, Puyo's rule; Mirth's already). An L of 3
  does not count: clusters of 3 were measured and refused for the swing above. 4 touching forgives every shape a person sees.
- **5 colours** on it, up from 4, so a cluster is a find and not the board's weather.
- **Its bot weighs 6 actions a point** (`rs.bot.sample`; 60 for a ruleset that does not say). A Figment's cleverness is now its
  ruleset's: the first aberrant met is the gentlest, the later ones set by their own.
- **Switching form is free** (`ACTIONS.form.cost` 0): a form is which verbs you hold, and a price on that read as a tax on learning them.
  The bot keeps its own small reluctance to switch (`W.form`), so it does not dither.
- **A move's worth shown before it is chosen**: `preview(state, action) -> { junk, steps, cleared }` (duel.js), tried on a copy, for the
  view to draw on the hovered move (Calissa's).


### 17.4 The board is the Figment's (South on the phone, 2026-10-27, relayed by Calissa and Petra)

South: "increasing the size of the tsuitate board" on a phone. Calissa's camera now fits the slab into the room the controls leave
(`touchShot`, vfx/duelview.js); on an iPhone XR held flat that room is about 680 by 330 CSS px, so 20 rows give a cell of about 16 px.
A finger wants 40. The camera cannot grow it further; only fewer cells can.

**Ruled (Dovina):**
- **One board on every device.** A duel is the same on the desk and the phone (one save, a guest on either, bests comparable). The phone
  is never given a different game.
- **A ruleset carries its board** (`board: { w, h, perColumn, landCap }`, read by `newDuel`; 20 x 20, 3 and 9 when it says nothing).
  `perColumn` is the junk landed that moves the Line a column, `landCap` the junk that lands at once (three columns' worth). EmO a junk
  landed is scaled by `perColumn` (duelbreak.js), so a column's worth fills as much on any board.
- **The Lantern Wisp's board is 14 x 14**, 2 a column, 6 at once: the first aberrant met is the smallest, and every cell is 1.4x as big
  (about 23 px on the XR). Later Figments set their own, 20 at most.

**Measured** (the same harness, 24 duels a row, the stand-in at 8 actions a point, the Wisp at 6):

| the Wisp's board | you, junk a turn | the Wisp | you win | turns a side | longest chain |
| --- | --- | --- | --- | --- | --- |
| 20 x 20, 3 a column (17's ruling) | 9.4 | 3.3 | 15 of 20 | 6.3 | 5, 5 |
| 16 x 16, 3 a column | 4.9 | 2.0 | 19 of 24 | 6.0 | 4, 5 |
| 14 x 14, 3 a column | 2.2 | 1.9 | 13 of 20 | 11.7 | 4, 5 |
| **14 x 14, 2 a column, 6 at once (ruled)** | **2.7** | **1.7** | **17 of 24** | **7.1** | **4, 5** |
| 12 x 12, 2 a column, 6 at once | 1.7 | 1.3 | 12 of 20 | 8.9 | 3, 3 |
| 20 x 10 (wide and short), 2 a column | 1.7 | 1.3 | 14 of 24 | 16.6 | 3, 4 |

14 keeps the duel as long and as winnable as 20 did, with chains as deep; 12 loses the chains, and a wide short board drags. Junk a
turn falls with the cells, but a column costs 2, so the Line moves about as fast for the side's 7 columns as it did for 10.

**Still open, not a rule:** 23 px is under a thumb. What closes the rest is the input's, not the board's: a loupe over the finger, or
pick-then-place with the picked piece lifted. Calissa's and Petra's call.

## 18. The tools bend the clearing; the intent; the first duel as a lesson (South, 2026-10-27, relayed by Calissa)

South: "Tell Dovina especially to utilize the lachryma tools to help dictate how the tile clearing mechanics work. Like the Soul
Brush being able to recolor the suit of a given gem class, that sort of thing"; "implement the updated mechanics as outlined" (the
preview, the intent through the fog, the first duel as a lesson); "we're probably going to need a smaller board size with larger cells
for mobile" (17.4: the Wisp's board is 14 x 14 on every device; `newDuel({ board })` takes `{ w, h, perColumn, landCap }` over the
ruleset's, for a room that must, and the Line starts at `w / 2`).

### 18.1 The tools' moves (couriertools.js)

Each tool that bends the clearing is a modifier with its source on the board (DESIGN.md 22): the rule is the same, a tool changes it
for you, where you stand, for a while.

| tool | move | AP, pool | what it does | prior art |
| --- | --- | --- | --- | --- |
| the psygun | **Shoot** `{ dir }` | 1, 5 | a shot down a row or column from the Courier (toward the foe by default); the first piece it meets pops with every gem of its colour touching it, any number. A pop is a clear: junk beside it breaks, a bomb goes off. On your half a pop of 3 or more is the chain's first step (what falls after counts from step 2); on the foe's it scores them nothing, but what falls after is theirs | SameGame, Collapse; Meteos' risk |
| the Soul Brush | **Paint** `{ from, colour }` | 2, 10 | every gem of one colour within 4 cells of the Courier (walking) repainted another; `from` defaults to the colour nearest the Courier | Columns' magic jewel, as a class (the owner's) |
| the Crucibelle | **Tune** `{ colour }` | 1, 8 | a song: that colour clears at any 3 touching on your half until your turn ends (its landing included); one a turn | the crystals' frets: a note is a colour |
| the Crucibelle | **Delay** | 2, 15 | the toll: the foe loses a point from its next turn (2 at most) | Tetris 99's badges |
| the Sondelass | **Grab** | 1, 5 | the first piece past the Line in the Courier's row hooked to your half: steal the gem the foe's intent needs | Magical Drop |
| the Dreamvane | **Drill** `{ dir }` | 1, 3 | the pick breaks up to three pieces in a line | Mr. Driller |
| the Lockheart | **Hold** / **Send** | 1, 0 / 1, 5 | junk beside the Courier into the coffin (12 at most) / all it holds thrown at the foe | Tetris's hold |
| the Veritome | **Read** | 1, 0 | Dread's fog lifted for you, this turn and the foe's next (`visibleTo`); only where a fog hides the foe | the Veritome is observation only |

**Measured** (the swing of one move: the best single action of a kind on the opening board, 16 seeds, the Wisp's rules; median / 90th
percentile / most junk):

| move | the Wisp | Fury (runs only) | Grief |
| --- | --- | --- | --- |
| the hand's best swap (1 AP) | 8 / 15 / 27 | 22 / 45 / 112 | 4 / 8 / 20 |
| Paint, the whole half (refused) | 19 / 32 / 35 | | |
| Paint, within 2 | 1 / 3 / 9 | | |
| **Paint, within 4 (ruled)** | **7 / 15 / 19** | 5 / 10 / 18 | 3 / 6 / 15 |
| Tune | 1 / 7 / 11 | 16 / 25 / 71 | 4 / 5 / 24 |
| Shoot | 0 / 1 / 1 | 0 / 0 / 1 | 0 / 0 / 0 |

Paint within 4 is worth about the hand's best swap for twice the points and some pool: the Courier's way to do what the hand does, from
where the Courier stands. Tune is worth most where the rules are strict (Fury's runs only), so the Crucibelle is the answer to a hard
board. Shoot makes little on its own: it is the setup (a gap that brings a fall) and the denial (a pop across the Line breaks the group
the foe's intent was going to clear), so its worth shows with the intent drawn.

The Courier's moves also took the bot's sampled actions (paint 20 ways, tune 5, shoot 4): the simulator's bots use paint and the form
switch a lot. A person's choice is the view's to make easy (Calissa): each move greyed where it is not legal, its preview on hover.

### 18.2 The intent (bot.js `intentOf`)

`intentOf(state, side = the foe) -> { actions, junk, cells, hits }`: the foe's plan for its next turn tried on a copy, the junk it would
send, the cells of its half it would clear (drawn through Dread's fog: Divination sees intent, not ground) and the cells it would move.
Redrawn after each of your actions; a forecast, never a promise (rule 6 above). It costs one plan: about 40 real ms on the Wisp's board
at its 6 samples a point, about 140 on a ruleset with 60 (the desk's numbers: call it after an action, never a frame). The Veritome's
Read shows the ground under it as well.

### 18.3 The first duel as a lesson (lesson.js)

`lessonDue(ledger)`: until the first puzzle duel won (`duel.won`). `newDuel({ lesson: true })`: the foe's first turn passes idle (its
drip still falls; `lesson.idle`), and six steps are asked one at a time, each done by doing it, never locked: **move** (a swap, drag,
rotate or drop), **clear** (3 in a line or 4 touching), **form** (the Courier on the board), **run**, **tool** (any tool's move),
**chain** (a clear of step 2 or more). `lesson.step { side, step, id, next }` says one done and the next asked; `lesson.done` at the end.
What the view shows is Calissa's: the step asked as the verb lit (its tile or key glowing), with no words but the verb's own label.

## 19. The genre's folds (South, 2026-10-27: "do some genre research on the types of games we've used as prior art and determine what else we can fold in")

A research pass over the versus puzzle and tactics games (Puyo Puyo Tetris, Tetris 99, Super Puzzle Fighter II, Puzzle Quest, Gems of
War, Puzzle & Dragons, Into the Breach, Balatro, Slay the Spire, Hexcells) ranked what to fold in by fun per build effort. Built, the
first five (each in `DUEL`, a ruleset may set its own or `false`):

- **Undo within the turn** (Into the Breach's reset; Baba Is You): `undo(state)` takes the last action back, a step at a time, points
  and pool returned, free until the turn ends, a die is thrown (the Flee) or the duel is decided. The drip is laid at the turn's start,
  so nothing hidden is learned. On a phone, a misplaced drag no longer costs the turn. Event `undo { side, left }`.
- **An action point back for a big play** (Puzzle Quest's extra turn, Persona 5's One More): a clear of 5 or more, or a chain step of
  3 or more, refunds 1 AP, once a turn (`refund`). Measured with the bots: 0.22 refunds a turn on the Wisp, 0.33 on Mirth, 0.36 on
  Fury. Event `refund { side, ap, why }`. It is also what makes a Shoot that sets up a chain worth its point.
- **Pool from chains** (Puzzle Quest's mana): each chain step past the first puts 2 in your pool (`trickle`), so the Courier's tools are
  fed by play and not only by breaks. Event `trickle { side, pool, n }`.
- **The all clear** (Puyo): no gem left on your half after a clear sends 6 junk more (`allClear`). Rare by design. Event `allclear`.
- **Margin time** (Puyo Puyo Tetris): past 10 turns a side, junk counts a quarter more each turn (`margin`, `marginOf(state)`), so a
  stalled duel ends. Fury's bots ran 11.2 turns a side before the folds and 4.9 after.

**Measured** (the Wisp, 24 duels, the stand-in kept to the hand at 8 actions a point): you win 13 or 14 of 24 with the folds and 14
without, so they do not tip the balance; they change how a turn feels. A note on the measure: since the tools' moves (section 18) the
stand-in's sample of 8 is spread over many more moves, and with both forms it wins 9 of 24; at 16 a point it wins 18. The tools did not
make the Wisp stronger; they made the stand-in's sampling thinner. A person chooses, a sampler dilutes.

### 19.2 A Figment's weakness (built: `weaknessOf`, `DUEL.weakness`; Persona's weaknesses, Puzzle & Dragons' colour wheel)

Colour meant only matching. Now a Figment is weak to the feeling opposite its own (the wheel of feelings' `OPPOSITE`) when that colour
is on its board, and resists its own: your gems of the weak colour count 1.5 in a clear, of the resisted 0.5. The pair or nothing: a
ruleset whose weak colour is not on its board has neither (Fury, Mirth as they stand). The Wisp (dread) is weak to fury; Grief to mirth,
resisting grief. It is the Soul Brush's best use: Paint the gems round you into the weak colour. `chain` events carry `weak` (how many
weak gems the step had). Measured (the Wisp, the stand-in kept to the hand): 16 of 24 won with it, 13 without.

### 19.3 Clue fog (built: `clues(state, viewer, familiarity)`, `dread.js`; Hexcells', Picross's margins)

Dread's fog stays, but it becomes a thing to read: for each row and column of the fogged half, how many hidden cells hold a piece, and the
hidden gems' tally by colour. From familiarity 2 (familiarity.js) the counts split gems from junk; the Veritome's Read still shows the
cells whole. Into the Breach's promise (nothing hidden that you cannot reason about) kept without lifting the Wisp's fog. For the view
(Calissa): the numbers in the tsuitate's margins over the fog, as a Picross board's.

**Next, ranked, not built:** a colour each Figment is weak to and one it resists, from the wheel of feelings (Persona, Puzzle & Dragons), so colour
means more than matching; power gems (Puzzle Fighter: a 2 x 2 of one colour fused, clearing all its colour touching); a catch-up seed
for a broken side (Puyo's Fever: a break snowballs today); charms as hooks on clears (Balatro's jokers) from the bracelet and the laid
spread; a mended Figment lending its rule family as a charm (Mega Man); a Figment's phases by its breaks; a chain power table per
ruleset in place of the doubling (Puyo's capped table).

### 19.4 A lookahead never draws the duel's dice (a bug, Calissa's builder, 2026-10-27)

`cloneState` seeded each copy from the duel's own stream (`s.r()`), and `legalActions` sampled its drags from it: so a hover preview, the
foe's intent after each action and the bot's search all moved the duel's chances, and a replay could not replay. Now a lookahead's
stream is `quietStream(state, salt)`, seeded from the duel as it stands (its board, ply, mover and points), and nothing that asks draws:
the same seed plays the same with or without previews and intents (checked: ten turns either way, one board). The bots' search changed
with it (the stand-in won 67 of 80 against the Wisp at its 6 actions a point), so the Wisp's bot weighs 8: 58 of 80, as before. The
casebook's rule: a lookahead owns its own stream.

## 20. The phone redo: the rules' side (South via Calissa, 2026-10-27: "the board needs to be the largest thing on screen, doubled in size ... the gems need to be readily identifiable ... Don't be afraid to make radical changes")

Calissa plans the layout (Puzzle Quest's: the board edge to edge vertically, the two bodies either side). The rules answer it so:

- **The Lantern Wisp's board is 12 x 9, 4 colours, on every device** (one game, one save; `rulesets.js`). On an iPhone XR held sideways
  (896 x 414 CSS px) a 9-row board at the full height is a 44 px cell, Apple's touch minimum, 528 x 396, leaving 184 px each side for the
  Courier and the aberrant. Measured over 40 duels each against the shipped bot (sample 8), the stand-in (sample 3, hand and Courier):
  | board, colours | the stand-in wins | longest chain (you, foe) | turns a side |
  | --- | --- | --- | --- |
  | 14 x 14, 5 (until now) | 17 | 4, 5 | 6.4 |
  | 12 x 10, 5 | 23 | 3, 3 | 7.7 |
  | 12 x 12, 5 | 15 | 4, 4 | 6.3 |
  | 10 x 10, 4 | 24 | 3, 4 | 6.7 |
  | 12 x 10, 4 | 20 | 4, 4 | 6.9 |
  | **12 x 9, 4** | **24** | **4, 4** | **7.9** |
  Fewer cells with five colours starve the chains (three colours meet too rarely); four colours put the depth back. The four are the
  first four feelings (Wonder, Mirth, Desire, Fury); Fury stays on the board, so the Wisp's weakness (fury, its dread's opposite, 19.2)
  is still there to chase. A Figment that brings 5 or more colours keeps a bigger board (its own `board`).
- **The tools on screen:** a duel offers only the two worn tools' moves (`wears`, couriertools.js), so the screen needs those as buttons
  and nothing else; Flee and Undo in a corner. No tray of seven.
- **The fog shows shape, not colour** (`fogShows`, dread.js): a fogged cell is drawn as a plain stone of the fog, so the foe's half
  reads as its stacks' height at phone size; the lantern's light (3 cells), Read, the clue counts (19.3) and the foresight give the
  colours. The bot never reads the fog (it is the foe's own half).
- **The gems' meanings:** a gem's colour is a feeling (`COLOURS`, board.js, in the display order); its silhouette is Calissa's, one a
  feeling so the board reads in greyscale; the Wisp's weak colour (fury) wears the weakness mark.
- **Measured live:** the Wisp's duel opened headless on the 12 x 9 board (the Line at 6), the view stood to it, the turn handed over.

## 21. The quality bar: Puzzle & Dragons, Terra Battle, Candy Crush (South, 2026-10-27: "We're going to polish and reiterate until we hit the quality of puzzle titles like puzzle & dragon, terra battle, candy crush")

### 21.1 What those games share (the bar)

- **One gesture.** Puzzle & Dragons: drag one orb, everything it passes swaps. Terra Battle: drag one unit. Candy Crush: swap two by a
  swipe. A new player is playing within seconds, and depth comes from the board, never from the verb list.
- **No modes.** None of them asks you to switch what your finger does. A mode error (the finger did the other form's thing) is the
  genre's worst feel on a phone.
- **Skills are charged, not spent from a shared purse.** Puzzle & Dragons' active skills charge by turns, Puzzle Quest's spells by the
  gems of their colour: a big play is earned by matching, then fired from a button as a moment.
- **The cascade sells itself.** Each chain step lands on a beat (about a quarter of a real second), louder and higher in pitch than the
  last (Puzzle & Dragons' combo counter, Candy Crush's "Sweet ... Divine"), and the board waits for it.
- **An idle hint** (Candy Crush, Bejeweled): a few seconds with no touch and a move that works glows.
- **The foe's turn is short and skippable**; nothing waits on an animation you have seen.

### 21.2 Measured: what our duel's verbs are worth (the Lantern Wisp, 12 x 9, 4 colours)

A strong player (the bot at sample 60 on your side) against the shipped bot, 20 duels a belt; the share of its actions by kind and the
junk each sent:
| belt | wins | drop | rotate | swap | drag | form | tools | the Courier's run / push / kick |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| psygun + Soul Brush | 20 | 23% | 19% | 10% | 14% | 18% | Paint 14% (285 of 538 junk: 53%) | 1% / 0 / 0 |
| Sondelass + Crucibelle | 18 | 27% | 24% | 22% | 21% | 4% | Tune 2%, Grab 0 | 0 / 0 / 0 |
| Lockheart + Veritome | 19 | 31% | 25% | 23% | 20% | 1% | Hold, Send, Read 0 | 0 / 0 / 0 |

And the stand-in (sample 3, a person on a phone) against the shipped bot, 40 duels, with verbs taken away from both sides:
| verbs removed | the stand-in wins | junk a turn (you, foe) | longest chain | turns a side |
| --- | --- | --- | --- | --- |
| none | 28 | 3.1, 2.3 | 3, 4 | 7.3 |
| swap | 28 | 3.0, 2.6 | 3, 3 | 6.4 |
| rotate and drop | 33 | 3.2, 2.1 | 3, 3 | 7.0 |
| **swap, rotate and drop (the hand drags only)** | **30** | **3.1, 2.5** | **3, 3** | **7.3** |
| the Courier's run, push and kick | 27 | 3.4, 2.7 | 3, 4 | 5.7 |

So:
- **The Courier's movement is dead weight.** A strong player moves the Courier in 0 to 1% of actions, and removing run, push and
  kick changes nothing. A D-pad for it would polish a verb nobody needs.
- **The hand's four verbs are one verb four ways.** Drag alone (Puzzle & Dragons' gesture; a swap is a drag of one step) keeps the
  duel as winnable, as long and as deep, within the noise of 40 duels.
- **The tools are lopsided.** Paint is half of all the junk when the Soul Brush is worn; Hold, Send, Read, Grab, Drill, Delay and Shoot
  are almost never worth an action point.

### 21.3 Built now (rules)

- **The idle hint** (`hintOf(state, side, { sample, form })`, `HINT`, bot.js): the move in the form you hold that sends the most junk,
  found on quiet copies (the duel's own dice untouched); 4.4 ms, found on 30 of 30 opening boards. The view lights it after `HINT.idle`
  (6 real s) with no touch and lets it go at the next.

### 21.4 Proposed, then ruled (section 22): one gesture, tools as charged skills, the dive as the cast

1. **The hand has one gesture: drag a gem along a path** (Puzzle & Dragons; Terra Battle's drag), its cost by length as now. Swap,
   rotate and drop leave the phone and the desk alike (measured above: no loss).
2. **No forms.** The Courier stands beside the board, never on it; run, push and kick are cut (measured: no loss).
3. **The worn pair are two skills, charged by clearing.** Each tool fills from gems of its own colour cleared (Puzzle Quest's mana), and
   fires from its button as one big move, retuned so each is worth firing (Paint today's strength, the rest raised to it). 
4. **The dive is the cast.** Firing a skill is the Courier diving into the board to do it, South's image, and the camera's moment.
5. Then: the cascade's beat and its rising sound (Wanda), the idle hint's glow, the foe's turn skippable by a tap.

Until South rules, nothing more is built on the Courier's movement (no D-pad, no swipe polish).

## 22. The one-gesture duel (built 2026-10-27; South: "You have permission to design, draft, and implement anything and everything that would improve this module. Visual feedback, physical feedback, game design synergistic loops")

Section 21.4 built as the default (`DUEL.style = 'drag'`; a ruleset may still ask `style: 'classic'` for the forms and the old verbs).

**Ruled** (South to Petra, 2026-10-27 16:23 UTC: "I approve any and all updates to the puzzle duel module that you ultimately think
improves the user experience of playing"): the one-gesture duel and the session's edits stand; published as Version 327. The forms' dive
moves onto a skill's cast (Calissa's).

### 22.1 The rules
1. **One board verb: drag.** The hand drags a gem along a path, its cost by length as before; a press onto a neighbour is a drag of
   one step (the swap kept as its shortest form). Rotate and drop are gone from this style; so are the forms, run, push and kick.
2. **The Courier stands off the board.** No body on side 0; the foe keeps its body (Dread's lantern, its kick target stays the foe's).
3. **An orb is drunk by the drag**: a dragged gem passing over one takes it (the break's Lachryma reaches the pool with no run).
4. **The worn pair are two skills** (`progress/duel/skills.js`), each a free action (no action point) when full, at a cell of your
   half where it asks one. A skill spent starts from nothing.

| tool | skill (plain label) | does | need |
| --- | --- | --- | --- |
| the psygun | Shot | the three rows through the cell clear: gems, junk, embers (a striped candy, widened) | 9 |
| the Dreamvane | Vein | every gem of the cell's colour on your half clears (a colour bomb) | 10 |
| the Soul Brush | Paint | the 3 x 3 round the cell takes the middle gem's colour (P&D's orb change) | 8 |
| the Sondelass | Grab | every junk and ember in the 5 x 5 round the cell is hooked out and thrown across | 6 |
| the Crucibelle | Tune | the cell's colour clears in any 3 touching, this turn and your next | 7 |
| the Lockheart | Hold | the junk waiting to land on you (up to 9) is thrown back at once | 8 |
| the Veritome | Read | two action points back; the fog lifts for three of your turns | 7 |

5. **Charge** (`chargeFrom`, after every settle, both sides): a point a gem you clear, a weak gem its weakness's `k`, and a chain's
   step from the second adds its step again (a chain of 4 adds 2+3+4 over its gems). A skill's own Shot or Vein charges nothing (no
   skill fires itself). Skill skips grind: a chain fills a skill in one move; a plain match still fills it in three or four.
6. A Shot or Vein clear is a clear: junk beside it breaks, a bomb goes off, and it counts as the chain's first step, so what falls after
   it chains on from 2 (`s.chainFrom`).

### 22.2 The session (Petra's file, edited with South's leave)
Keys 1 and 2 (or the tool's own key) arm a skill; an untargeted one fires at once, an armed one fires at the cell clicked, RMB lets it
go. A tap or click during the foe's turn skips its beats (`view.skip`). Idle 6 real s on your turn, the hint (`hintOf`, 40 drags tried on
quiet copies) is handed to the view (`view.hint(h | null)`). The bus gets the moments for the log, the sound and the phone's buzz:
`duel.chain { step, weak }` (each step from 2), `duel.skill { tool }`, `duel.charge { tool }` (a skill full), `duel.land { n, kind }`
(by `creature`), `duel.allclear { n }`.

### 22.3 Measured (`scratchpad duel/drag.mjs`: the stand-in at sample 3, a person's play, against the shipped bot; the Lantern Wisp, 30 duels a pair)
| pair | wins | junk a turn (you vs it) | skills fired a duel (junk a fire) |
| --- | --- | --- | --- |
| classic psygun + Soul Brush (before) | 22/30 | 3.2 vs 2.1 | none (Paint half the junk) |
| psygun + Dreamvane | 18/30 | 2.8 vs 2.5 | Shot 0.9 (6.4), Vein 0.2 (8.0) |
| Lockheart + Veritome | 25/30 | 2.8 vs 2.5 | Read 1.1, Hold 0.8 (4.8) |
| psygun + Soul Brush (12 duels) | 6/12 | 3.2 vs 2.8 | Shot 0.7 (6.1), Paint 0.3 (12.5) |
| Sondelass + Crucibelle | (measuring: Tune's lookahead runs slow) | | |
Duels run 5 to 6 turns a side against the classic's 7.3: shorter, and every turn has its one big move. A pair is a playstyle, not a
power: the attackers (Shot, Vein) win by sending, the defenders (Hold, Grab) by refusing, the Read by the extra moves.

### 22.4 What the other divisions are asked (the handoffs, docs/HANDOFFS.md)
- **Calissa (the view):** two skill tiles beside the board filling to `need` (`skillsOf(s, 0)`), lit full; `view.armSkill(tool | null)`
  (the cell under the finger previews the skill's reach), `view.hint(h)`, `view.skip()`; the dive as the cast (the Courier diving into the
  board on `skill`); the kernel's events `skill`, `charge`, `blast { at, rows }` (Shot), `vein { at, colour }` (Vein), `recolour` + `paint`, `hold { by: 'grab' }` (Grab, on the classic Hold beat for now), `tune { turns }`,
  `hold.send { from: 'pending' }`, `read { ap }`; no Courier figure on side 0; `stepsOf(s)` in place of `LESSON.steps` (glows.js).
- **Wanda (sound and touch):** the cascade's rising ladder on `duel.chain`, a cast on `duel.skill`, a ready chime on `duel.charge`, a
  thud by `n` on `duel.land`, a fanfare on `duel.allclear`; the phone's buzz on the same (MOMENTS).
- **Espada (words):** the seven skill labels and lines (plain now: Shot, Vein, Paint, Grab, Tune, Hold, Read), the lesson's four drag
  steps, the log lines (tracking/duel.js), the eight achievements (du1 to du8).
- **Petra (the gate):** the session's edits are above; the classic path is kept whole behind `style`.

### 22.5 The ledger and the achievements (progress/duelachievements.js, BATTLE's "Puzzle Duels")
Counts: `duel.chain.<step>` (2 to 8), `duel.chain.weak`, `duel.skill`, `duel.skill.<tool>`, `duel.landed`, `duel.allclear`. Achievements:
win one (du1), break a Figment (du2), a chain of 4 (du3) and of 6 (du4), fire a skill (du5) and all seven (du6), an all clear (du7), win
25 (du8): each worth having has a count way and a feat way.

Prior art: Puzzle & Dragons (the drag, the orb change, active skills charged by play), Terra Battle (the drag's path), Puzzle Quest (mana
from matches), Candy Crush (the striped candy, the colour bomb), Puyo Puyo Fever (a meter filled by chains), Tetris Effect (the perfect
clear).

### 22.6 The practice duel: Strawman at the sparring circle (South, 2026-10-27 via Petra: "test more basic implementations of the puzzle duel module")
Petra's session opens a practice duel with a foe marked `c.practice` (Strawman's aberrant stance); every `duel.*` event carries
`practice: true`; no pool change, no shatter, no drain. Mine:
- **Its rulesets** (`rulesets.js`): `strawman`, the duel with nothing but its core: 10 x 8 (an 8 x 8's halves of 4 columns made Shot
  and Vein near useless and the bot won 2 in 3), 4 colours, plain gravity both halves, runs of 3 and any 4 touching, no fog, embers or
  bombs, a bot weighing 2 actions a point that acts **every other turn** (`bot.every: 2`); `strawmanIdle`, a foe that never acts
  (`bot.idle`). `PRACTICE { idle, plain, wisp }` is the lectern's pick (`rulesetOf(c, pick)`), `wisp` the Lantern Wisp's own board.
  Measured (the stand-in at sample 3, 20 to 30 duels): plain, Lockheart + Veritome 14 of 20; at every turn and sample 4 it won 10 to
  15 of 30, too hard for a dummy.
- **It never counts**: tracking/duel.js says a practice duel in the log but keeps nothing on the ledger; first-today pays nothing for
  it; a Luck re-roll thrown there is not spent.
- **The lesson** runs in practice when due, and finishing it there counts (`duel.lesson`, the one count practice keeps: the lesson is
  what you know, not a record); `lessonDue` is false after a duel won or the lesson finished once.

### 22.7 Skyfall (Petra's go, 2026-10-27; `progress/duel/skyfall.js`)
The gems you clear fall back in from the board's far edge in the same settle, so what comes in can clear again: a free cascade, counted
as the chain's next step (Puzzle & Dragons' skyfall, Candy Crush's refill). A half is never full (junk needs room to land; a side that
cannot take it has lost), so the refill keeps a side at a **waterline** (`to`, a share of its cells) and never over it: junk sitting on a
side keeps it over, so breaking junk still makes room. The drip only tops up to the waterline. A refill that would clear where it lands
is recoloured (`calm`, the chance). The chain's junk stops doubling at step 5 (`CHAIN_CAP`, duel.js).

Measured (`scratchpad duel/sky.mjs`, the stand-in at sample 3, Lockheart + Veritome):

| board | skyfall | wins | turns a side | junk a turn (you vs it) | gems refilled an action | clears of 3+ steps |
| --- | --- | --- | --- | --- | --- | --- |
| Strawman 10 x 8 | none | 16/20 | 5.2 | 1.6 vs 0.4 | 0 | 0% |
| Strawman | to 0.6, calm 0.8 | 19/20 | 3.7 | 20.5 vs 4.0 | 3.7 | 19% (chains to 8) |
| Strawman | to 0.4, calm 0.95 | 15/20 | 7.8 | 2.2 vs 0.6 | 2.2 | 12% |
| Strawman | **to 0.5, calm 0.95** | 17/20 | 5.3 | 3.4 vs 1.3 | 2.5 | 13% |
| the Lantern Wisp 12 x 9 | none | 9/12 | 4.5 | 2.6 vs 2.6 | 0 | 4% |
| the Lantern Wisp | to 0.5, calm 0.95 | 8/12 | 3.6 | 14.8 vs 8.1 | 3.8 | 30% |
| the Lantern Wisp | **to 0.4, calm 0.95** | 8/12 | 4.6 | 5.3 vs 4.3 | 2.4 | 10% (chains to 4) |

With nothing done to it, an uncalmed refill set off chains of 22 steps (397 095 junk a turn). Chosen: the default `{ to: 0.4, calm: 0.95 }`
(the duel's start fill), Strawman's board `{ to: 0.5 }`. The view: a refill is `drip { side, id, at, colour, sky: true }`, the drip's own
shape, its colour on it (it can be cleared in the same settle); Calissa's to drop it in from the edge.

### 22.8 A turn that runs on (Petra's live probe, 2026-10-27: 28 actions in about a turn and a half)
Measured in the kernel (`scratchpad duel/turnlen2.mjs`, the stand-in playing out every action point on Strawman's board): a turn
averages 1.6 actions, but one ran to 9 with 4 skills fired: a Shot's blast, then skyfall's cascade after it, charged the worn skills
again inside the same turn. **Each skill now fires at most once a turn** (`S.fired`, cleared at the turn's end): the longest turn
is then 9 actions with 1 or 2 skills, the designed ceiling (5 action points, a refund, Read's 2 back, the two skills). A turn
with nothing left to do is said by `canAct(s, side)` (an action point, or a skill ready with a target it takes): the session's to end
it a beat after, so a spent turn never reads as a stuck duel (Petra's).

## 23. The PvE duel: a battle of wills (South, 2026-10-28: "points 1 and 2 with removing action points ... a true battle of wills complete with your aforementioned special moves from the Aberrant, rather than having them also play match 3. We can come circle back to the original mechanics for like a pvp mode, but pve can be much more one-sided in favor of the player")

`DUEL.style = 'pve'` (the default; 'drag' and 'classic' kept for a versus mode). Kernel: duel.js, `progress/duel/foeskills.js`.

### 23.1 Your turn
One drag, any length (up to 48 steps; the session's timer is its real limit, Puzzle & Dragons' 4 to 6 real s), no action points. Your
ready skills fire first, free, each once; the drag is the turn, and once it settles nothing is left (`canAct` false: the session ends it
0.6 real s later). No undo: the drag is committed (Puzzle & Dragons). A Seal's column cannot be touched by the drag.

### 23.2 The Line is the battle of wills
The aberrant never matches: its half is its mind, frozen (no gravity, no clears, no drip). What you send at the turn's end pushes the
Line into it, a column a `perColumn` (the Wisp 5, Strawman 4), **two columns a turn at most** (overkill lost: a free Paint alone did 17,
four columns). A column taken is yours, its frozen gems falling into play: a conquest that can cascade. Nothing offsets in PvE: your
clears always push, its junk always lands (Hold and Grab are the answer). Take its whole half and it is broken: you win. It wins by
pushing the Line back to your edge (its junk landing, a column a `perColumn` landed, and Reclaim) or a full half.
A skill's blast (Shot, Vein) is refilled wild (skyfall without the calm), so a skill feeds the drag after it. Skyfall is on in PvE.

### 23.3 The aberrant's turn: foe skills
Each on its own countdown, shown over it (`foeIntent(s)`; `intentOf(s, 1).foe`): **Hurl** (junk landing on you after your next turn),
**Petrify** (gems of yours turned to junk), **Seal** (a column you cannot drag on your next turn), **Sap** (half of each skill's charge),
**Reclaim** (the Line pushed back a column), and a **desperate** flare once when its half is down to `at` columns. Each foe turn says
`foe.soon { skill }` for every move that fires on its next turn (the last tick: a sound, the countdown's throb). A big play of yours
(a chain of 4 or more, or 10 sent in a turn) **staggers** it: every countdown a turn later. The Veritome's Read does the same in PvE.
The lesson's idle turn and a stun fire nothing.

| aberrant | foe skills (every, first) | desperate |
| --- | --- | --- |
| the Lantern Wisp | Hurl 3 embers (2, 1), Petrify 3 (3, 2), Seal (4, 3), Reclaim (5, 4) | at 2 columns: Hurl 5, Petrify 4 |
| Strawman, plain | Hurl 2 (3, 2), Petrify 2 (4, 3), Seal (5, 4) | none |
| Strawman, idle | none | none |

### 23.4 Measured (`scratchpad duel/pve.mjs`: a stand-in trying K drags a turn, its ready skills first at their best of 16 targets)
| board | pair | K | wins | turns | foe skills a duel |
| --- | --- | --- | --- | --- | --- |
| the Wisp | psygun + Dreamvane | 6 | 15/16 | 5.3 | 4.7 |
| the Wisp | Lockheart + Veritome | 6 | 15/16 | 8.3 | 7.0 |
| the Wisp | Soul Brush + Sondelass | 2 (careless) | 11/16 | 8.6 | 9.4 |
| the Wisp | Lockheart + Veritome | 1 (one drag tried) | 3/16 | 15.6 | 16.5 |
| Strawman plain | psygun + Dreamvane | 6 | 16/16 | 4.8 | 1.6 |
| Strawman idle | psygun + Dreamvane | 2 | 8/8 | 6.3 | 0 |
One-sided: a thinking player wins nearly always in 5 to 8 turns and sees the Wisp's whole hand; a masher can lose. Skill damage alone
(best of their targets): Paint 17, Vein 16, Shot 12, a good drag 9; Tune 2, Hold 3, Read 0 (it stalls instead).

### 23.5 Asked of the others
- **Petra (the session):** the drag's timer from the first move (5 real s, a bar draining; release or time out commits); the foe's turn
  is `botPlay`, which in PvE calls `foeTurn` (no change needed); emit `duel.foe { skill, n, by: 'creature' }` on each `foe.skill` and
  `duel.stagger { by: 'courier' }` on `foe.stagger`, `duel.desperate { by: 'creature' }` on `foe.desperate`; until Calissa's beats land, `view.resync(state)` after a foe turn (Petrify swaps a
  gem's piece for a junk piece of a new id).
- **Calissa (the look):** the aberrant's countdowns over it (`foeIntent`), each foe skill as a cast from its body (Hurl: junk flung in
  an arc; Petrify: gems greying to stone; Seal: a column chained; Sap: the skill tiles drained; Reclaim: the Line shoved back with the
  domains' clash), `foe.desperate` its big moment, `foe.stagger` a reel; the Line's push as the battle of wills (each column taken a
  conquest beat, its gems falling into your board); the drag's timer.
- **Wanda:** a sound for each foe skill, the countdown's last tick, the stagger, a column won and lost.
- **Espada:** the foe skills' words (plain now: Hurl, Petrify, Seal, Sap, Reclaim), the log's placeholder lines.

Prior art: Puzzle & Dragons (one drag a turn under a timer, enemy skills on turn counters, jammers and binds, overkill), Terra Battle
(a boss's gimmicks), Into the Breach (attacks drawn a turn ahead), Tug of war (the Line).


## 24. The duel's powers: the god hand's seven, as puzzle moves (South, 2026-10-28, through Petra's round note: "God hand powers in the duel. One power per domain (seven) ... Strawman drops all seven feelings' gems. That is harder, and the seven powers are what bring it back down")

Built in `src/progress/duel/powers.js` (`DUEL_POWERS`). Every design space this round opened or closed is in `docs/plans/DUEL-DESIGN-SPACE.md`.

### 24.1 The seven

Each is a power the god hand already has in the world (`GOD_POWERS`), made a move on your half. All are cast before the turn's drag,
as a free action (the drag still ends the turn).

| power | domain (the hand's power) | what it does | cost (pool) | rests (your turns) | target |
| --- | --- | --- | --- | --- | --- |
| Swap | Ouranurgy (Swap) | two 2 x 2 patches of your half trade places | 10 | 1 | two cells (each a patch's top-left), not overlapping |
| Manifest | Manifestation (Manifest) | up to 3 junk, embers or holes in the 3 x 3 round a cell become gems of one colour (junk first, nearest first); the colour asked, else the one most round them | 20 | 2 | a cell (`colour` optional) |
| Scan | Divination (Scan Intent) | the aberrant's soonest skill shown and put off 2 turns; it counts as seen (24.5) | 15 | 3 | none |
| Lift | Psychokinesis (Lift Ground) | a row or a column of your half shifted 1 or more cells, wrapping round (Chuzzle) | 10 | 1 | a cell, a direction, `by` |
| Herd | Possession (Herd) | for each cell of a row or column, the nearest gem of the colour at the cell within 2 across it comes onto it | 20 | 2 | a cell, `H` or `V` |
| Transmute | Alteration (Transmute) | every gem of one colour on your half becomes another (asked, else the one most on your half), and no gem of it falls for 2 of your turns | 25 | 3 | a cell (`colour` optional) |
| Miracle | Spellscription (the miracles) | the colour at the cell clears at any 2 touching on your half, this turn and your next | 35 | 4 | a cell |

**What pays.** The pool: the Courier's own as the duel opens (the hand's powers cost Lachryma in the world too), and what a practice duel
spends is put back as it never counted. Your clears fill it in the PvE duel: a point a gem (`PVE.drink`, Puzzle Quest's mana) on top of the
trickle. A duel's pool is carried back to the world as it stands at the end (the session's, as before).

**As many a turn as the pool pays for** (South, 2026-10-29: "I think you should be able to use multiple powers provided you have the
resources for it, and the player has a passive regen per turn amount, and dragging also becomes a method of restoring lachryma"). Each
power **rests** its turns once cast (Puzzle & Dragons' cooldowns), so each is cast at most once a turn; the pool is the only other limit.
Your turn opens with the pool's **regen** (`PVE.regen`, 8; said to the view as a `drink` with `from: 'regen'`, so the bead runs), on top of
what your clears drink (`PVE.drink`). It was one a turn (`POWERS_A_TURN`, cut 2026-10-29) because three a turn and no regen made the
searching stand-in win in 3 turns at any strength; with the pool as the limit, skill still shows (26.9).

**All seven open from the first duel.** The world's level-1 powers are open from the start, and a duel you cannot win without them must not
wait on a level. A domain's level widens its power: its cost falls to 0.6 of itself at 99 on the ramp's curve (`powerCost`; the room hands
the levels in as `newDuel({ levels })`). One rule for all seven, so a number on a tile is always the cost.

### 24.2 Strawman's seven gems; the Wisp's five

Strawman (`RULESETS.strawman`, `strawmanIdle`) now drops all seven feelings' gems. The aberrant Lantern Wisp goes from 4 colours to 5: on
4, a Transmute leaves 3 colours, and 3 colours chain without end (24.3).

### 24.3 Measured (`scratchpad duel/powers.mjs`: a stand-in weighing K drags a turn and, with powers, each ready power at 6 targets by the best drag after it, Scan when a skill is a turn off, Miracle on the colour most on its half; pool 30 at the start; 16 duels a row)

| board | K | powers | wins | turns a side |
| --- | --- | --- | --- | --- |
| Strawman, 4 colours (before) | 12 | none | 16 | 3.7 |
| Strawman, 7 colours | 1 | none / all | 2 / 12 | 25.6 / 12.0 |
| Strawman, 7 colours | 2 | none / all | 3 / 14 | 23.1 / 8.4 |
| Strawman, 7 colours | 12 | none / all | 6 / 14 | 22.5 / 8.2 |
| Wisp, 4 colours, all powers, 3 a turn | 1 to 12 | all | 16 | 3.0 to 3.3 |
| Wisp, 5 colours | 1 | none / all | 2 / 15 | 18.9 / 4.9 |
| Wisp, 5 colours | 2 | none / all | 4 / 15 | 17.9 / 4.8 |
| Wisp, 5 colours | 12 | none / all | 9 / 16 | 17.2 / 6.4 |

Each power alone on Strawman's seven (K = 4, before the one-a-turn rule and Manifest's cap of 3): none 3 wins; Swap 10; Manifest (filling
the whole 3 x 3) 16 in 4.3 turns, so capped at 3 cells (12 alone); Lift 7; Herd 7; Transmute 13; Miracle 5; Scan 7. The searching stand-in
values what it sees this turn, so it undervalues Scan and Miracle (both pay over turns); a person who knows them will cast them more.

**Read.** Without powers both duels are now a grind a person loses more than wins; with them, one-sided as South asked (23), and long
enough (5 to 8 turns) that the aberrant's countdowns come round: the Wisp's four skills fire at turns 1 to 4.

### 24.4 The worn pair's skills, tabled in the PvE duel

The PvE duel wears no skills (`newDuel` gives side 0 `tools: []` there, keeping what was worn as `worn`): seven power tiles and two skill
tiles would be nine big plays a turn, and the skills overlap the powers (Paint and Transmute, Tune and Miracle, Read and Scan, Grab and
Manifest). Their code stays for the one-gesture duel (`style: 'drag'`) and a PvP mode later. Parked: the worn pair's domains making their
powers cheaper (DUEL-DESIGN-SPACE.md).

### 24.5 A foe skill seen

`src/progress/foeseen.js` (`game.foeSeen`, save section `foeSeen`, scope player): knowledge, not a count. A foe skill is seen once you have
watched any aberrant use it in any duel, a practice duel too (`duel.foe`), or read it with Scan (`duel.power { power: 'scan', skill }`).
Watched outranks scanned (`how`). Said once: `duel.seen { skill, how }` and a log line. The badge's tooltip (Calissa's) asks
`game.foeSeen.seen(skill)`: until then its countdown and a ?, after its label and line (`FOE_SKILLS`).

### 24.6 Events (the session puts them on the bus with `by`)

The kernel's: `power { side, power, domain, cost, pool, at }` then the power's own (`swap`, `manifest`, `scan`, `lift`, `herd`, `transmute`,
`miracle`, with the moved pieces' ids from and to), `transmute.end`, `drink { side, n, pool }`. The bus's: `duel.power { power, domain, cost,
skill? (Scan's), by: 'courier' }`. Counted: `duel.power.<id>` (tracking/duel.js; practice counts nothing).

## 25. Every aberrant an Elite fight (South, 2026-10-28)

Planned and begun in `docs/plans/ABERRANTS.md`: the Elite format (each aberrant's own board, Zone of Influence, foe skills, cut-ins,
sounds, a secret win and two deaths), and the Lantern Wisp as the first. Its secret (`secrets.js` `snuff`), its own skill (Kindle) and
its palette are built and measured there.

## 26. Folding the duel into the rest (South, 2026-10-29: points 1 to 3 of Dovina's synergy audit, the feelings attenuated, Hurl)

### 26.1 A duel's power trains its domain
`duel.power` is a source of domain experience (domains.js SOURCES), as `god.<power>` is in the world. Base 6 per cast. Quality is
0.35 + 0.65 x (gems the cast cleared / 12): about 9 experience for a cast that cleared nothing, 40 for one that cleared 8. The kernel puts
`cleared` on the `power` event (duel.js `act`), and the session forwards it. A practice duel trains nothing.

### 26.2 A good drag feeds the powers
- **The pool by depth.** Each gem you clear gives pool at its chain step, up to 3 (`PVE.drinkStep`): a cascade's deep steps pay three
  times a plain clear.
- **The rests cut.** A drag whose chain reaches step k takes k - 1 turns off every resting power (`PVE.restCut`, `cutRests`, event
  `rest.cut`; Puzzle & Dragons' skill-delay reduction).

**Measured.** In section 24.3 the K stand-ins all searched every one-step swap, so K was never a skill axis. I said there that "your drag
barely matters". That was wrong: an artefact of the measure. The stand-in now plays its best with probability P and a random move
otherwise (`scratchpad duel/powers.mjs`, 16 duels a row):

| board | P | wins (feeding on / off) | turns (on / off) |
| --- | --- | --- | --- |
| Lantern Wisp | 0 (random) | 0 / 0 | 12.8 / 12.6 |
| Lantern Wisp | 0.5 | 8 / 5 | 13.9 / 13.9 |
| Lantern Wisp | 1 | 16 / 15 | 5.3 / 6.0 |
| Strawman (7 colours) | 0 | 0 / 0 | 22.3 / 22.3 |
| Strawman | 0.5 | 7 / 7 | 21.9 / 21.4 |
| Strawman | 1 | 15 / 15 | 7.1 / 6.1 |

Skill already separates sharply. Feeding the powers helps a middling player against the Wisp (8 wins of 16 against 5) and changes
little elsewhere. It stays because it makes a chain worth more than its junk.

### 26.3 The collection log
Two new sections in collectionlog.js:
- **Aberrants.** Each foe skill met in a duel that counted (`duel.foe.<skill>`). Each aberrant's secret won (`duel.secret.<id>`); its slot
  is named by whose it is ("The Lantern Wisp's secret"), never by what it is.
- **Duel powers.** Each of the seven cast once (`duel.power.<id>`).

The bestiary entry belongs to the Veritome's Book (Petra's): asked in a handoff.

### 26.4 A feeling not yet awakened: a dim gem
South: "some sort of attenuated value, above junk, but not as effective as feelings you have unlocked". The session passes
`newDuel({ dim })`, the feelings not yet awakened to (`notAwakened(L)`, progress/feelings.js). A dim gem matches and clears like any
other, but gives `DIM.k` (0.5) of a gem's pool.

It does not count toward the Line's push (`DIM.junk: false`). With every gem dim, a strong stand-in won 1 Lantern Wisp duel of 16 when
dim counted in the push too. Counting only in the pool, it wins 15 of 16 in 7.4 turns (5.3 with every feeling awake); a middling one
wins 3 of 16 (8 awake). Awakening the feelings is what makes the powers flow.

### 26.5 Clue fog cut
`clues()` (19.3) was never drawn, and nothing of yours acts on the aberrant's half, so knowing its board changes no choice. Removed.
Dread's fog itself stays: it is the Lantern Wisp's secret's tell (its light closing in as the lantern dims, ABERRANTS.md 3).

### 26.6 Hurl lands at once
South saw Hurl go off and nothing happen until the next turn. It had been built that way (junk waiting a turn to be answered by Hold
and Grab), but those skills are tabled in the PvE duel, so the wait answered nothing. Hurl now lands as it is cast (`K.land`), embers
for a Wisp.

### 26.7 Best of three (South's question, parked)
A duel now runs 5 to 8 turns, at about 30 real s a turn with its casts and cut-ins, so 3 to 4 real minutes; three rounds would be 9 to
12. That is too long for a fight the field starts by walking near a creature.
- **Comeback.** Already built in. The Line moves at most 2 columns a turn, a stagger delays the foe, and the desperate flare comes when
  the aberrant is losing.
- **Phases instead.** An aberrant's second round can be a phase change on the same board (Puzzle & Dragons' boss floors, a Monster
  Hunter monster's enraged state).
- **Where three rounds belong.** The marked hunts (Notorious Monsters, FFXII's Marks) and a PvP mode, where a best of three is the
  convention.

### 26.9 Powers paid by the pool, a regen a turn (South, 2026-10-29)
One power a turn is gone: as many as the pool pays for, each still resting its turns. Your turn opens with 8 to the pool (`PVE.regen`), and
your clears still drink (26.2). Measured (`scratchpad duel/powers.mjs`, every power tried up to 7 a turn, 16 duels a row; P the share of
turns a stand-in plays its best, the rest at random):

| board | regen | P 1 (strong) | P 0.5 | P 0 (random) |
| --- | --- | --- | --- | --- |
| Lantern Wisp | 0 | 15 of 16, 4.4 turns | 7 of 16, 17.2 | |
| Lantern Wisp | **8 (built)** | 16 of 16, 3.7 | 15 of 16, 10.6 | 0 of 16 |
| Lantern Wisp | 15 | 16 of 16, 3.4 | 16 of 16, 8.8 | |
| Strawman (7 colours) | 0 | 14 of 16, 7.2 | 7 of 16, 22.9 | |
| Strawman | **8 (built)** | 16 of 16, 3.6 | 16 of 16, 6.7 | 2 of 16 |

At one a turn the Wisp took a strong stand-in 5.3 turns and a half-skilled one won 8 of 16; now 3.7 and 15 of 16. One-sided in your favour,
as South asked of the PvE duel, and still three times faster played well than played half well. With 0 regen a half-skilled player loses
half its duels (the pool runs dry); 15 buys little over 8.

**The Wisp's secret had to move.** With several powers a turn, a Transmute to Dread and a Miracle on it in the same turn took 24 fuel in
2.7 turns, and 9 of 16 stand-ins playing only for the Line found it by chance. At 48 (built): played for, 13 of 16 in 3.6 turns (the Line
4.2); found by chance 2 of 16. Fuel 36 was found by chance 5 of 16; 60 was slower than the Line (4.7).

### 26.10 The secret's reward: a learned skill (South, 2026-10-29: "Learning special abilities? ... I'm all for learning abilities from enemies")
An aberrant's secret is the faster way to win; what it pays is the aberrant's own skill, turned to your hand (`duel/learned.js`; Final
Fantasy's Blue Magic, Mega Man's Weapon Get). A learned skill is a power with `learned` (powers.js): open only once learned, paid and
rested as the seven are, its domain's experience earned the same way. Learned as every Art is (DESIGN.md 22): the feat, its secret
found once (`duel.secret.<id>`); the count, 5 of that aberrant beaten at the Line (`duel.won.<kind>`, counted from this round). Practice
teaches nothing (it counts nothing). Said once, on `duel.learn { power, from, by }` (progress/foeseen.js), in the log.
- **Kindle (the Lantern Wisp's).** Every junk in a row or column of your half lights into an ember that cools into a gem at your turn's
  end; 15, rests 3, Alteration. The Wisp burns your gems down; you burn its junk up. Manifest turns 3 cells at once; Kindle a line,
  a turn later.
- **Drops and looks, weighed.** A Soul Alchemy material from the secret would be a second faucet into a sink South has not tuned for
  duels, and the drain already gives the creature's own drops: not yet. A cosmetic is the right size for a second reward (a lantern
  pendant for the Pneuka Jar, opened by `duel.secret.snuff`: cosmetics.js's rule, "opened by the thing it pictures"); asked of Calissa.

### 26.11 The second aberrant: the slip jelly (ABERRANTS.md 5)
Built in the kernel and measured; every blotling (an aberrant slip jelly) brings it now. Its pieces: **slime**, its junk (`slime: true`,
drawn as junk until Calissa's look). **Transmute** takes a slime cell: every slime on your half turns to gems of the colour you pick.
**Spew** and **Harden**, its own foe skills. Its secret, **dissolve**.

### 26.13 The round's QoL (South, 2026-10-29: "Execute all QoL implementations and consider more as you go")
- **Undo takes back a power too.** It already did: the turn's snapshot is taken before every action and dropped only by the drag, so a
  power cast by mistake comes back with its pool and its rest (checked headless on Absorb).
- **The regen shown.** The kernel says it as a `drink` with `from: 'regen'`; asked of Calissa: a "+8" on the Lachrimeter's tube at the
  turn's open, beside the bead.
- **Learned skills where you look.** The collection log's new section "Learned skills" (a slot a skill), the shiny's slot under
  "Aberrants", and `learnProgress(power, L)` (learned.js: the count way's wins of 5, never the secret's) for a page that wants it.
- **Achievements:** du10 (the slip jelly's secret), du11 (a shiny aberrant), du12 and du13 (a learned skill, every learned skill).
- **Considered and left:** a bounty board (South parked bounties); drop tables shown in the bestiary after a first win (knowledge, asked of
  Petra's Codex when it next opens the bestiary).

### 26.12 Asked of the others (handoffs in `docs/handoffs/<name>/`)
- **Petra:** the session passes `learned: learnedOf(g.ledger)` beside `dim`; a lectern row for the jelly's board (`PRACTICE.jelly`);
  Kindle armed as Herd is (a row or a column); the duel's view coloured by the ruleset's feeling for an aberrant with its own board (a
  blotling's `grade` is its weather, its board the jelly's Gall).
- **Calissa:** the trickle's motes aimed at the Lachrimeter, wherever it stands (South: they fly to its old place); each side of the
  tsuitate shaped as its own (the Courier's half yours, the aberrant's its own: South); slime, Spew, Harden, the jelly's two deaths and
  its Zone of Influence; Kindle's tile and cast; the turn's change (26.8's ask, standing); a lantern pendant if she likes it.
- **Wanda:** Spew's and Harden's stings, the jelly's cue, the slime's sound when a Transmute turns it.
- **Espada:** Spew's, Harden's and Kindle-yours' words, the jelly's secret lines, its two deaths, the learning line.
