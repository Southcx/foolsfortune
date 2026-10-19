# Puzzle duels: the aberrant Figments' fights on a board (working names, Espada's to rule)

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
| **Bejeweled, Columns, Hexic** | the **swap** of two neighbours, the run of three, the **2×2 rotation** |
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
- **A piece** is a gem of a feeling's colour (the seven), a junk block (garbage), a stone, a bomb, a timer junk, a rainbow, a virus, a
  rule tile, or a body (the Courier). What a rule may do to a piece is **its tags** (`falls`, `pushable`, `matches`, `heavy`, `breakable`,
  `explosive`), as `core/tags.js` does for the world: a rule asks the tag, never the kind.
- **The line**: a column boundary between the two sides, at 10 to start. Your side is your zone of control: **the hand acts only on your
  side, and the Courier walks only on your side.**
  - Garbage you land pushes the line toward them, one column for every 4 sent.
  - **You win when the line reaches their back wall**, or (Noon's win) when their side has no empty cell left at the end of a turn.
  - A ruleset may make the line **jagged**, one boundary a row (Qix's claiming); straight is the default.
- **Gravity is a map**: every cell has its own direction (down, up, toward the line, away from it, toward a point, or none). A ruleset
  sets the map; a rule can turn it (a Figment's action: "the floor tilts").

## 3. The turn

- **3 action points a turn** (a knob). Then the board **settles**, garbage crosses, and the other side plays.
- **Settling** is the PuzzleScript loop: every settle rule runs (gravity, sliding on ice, matching, exploding, timers), again and again
  until nothing changes. Each pass that clears something is a **chain step**.
  - The loop is capped at 64 passes, and a board seen twice in one settle ends it. That is the guard against a cascade that never ends.
- **Garbage** for a turn is the sum of its chain steps: each step clearing *n* pieces gives (*n* − 2) × 2^(step − 1). It cancels
  what is coming at you first (offsetting), then crosses and lands on their side, from the edge their gravity points away from.
- **The opponent's next turn is shown before you act** (Into the Breach): the Figment's plan, its intents drawn on its pieces.

## 4. The forms (the owner: the Courier and the god hand both play)

| form | where | its actions (AP) | from |
|---|---|---|---|
| **the Courier** | a body on a cell of your side | step 1, **push** a run of pieces one cell 1, **kick** one piece to slide until blocked 2 | Noon, Bomberman, Sokoban, Mr. Driller |
| **the god hand** | over your side | **swap** two neighbours 1, **drag** a piece along a path, swapping with each it passes 1 a 3 cells, **rotate** a 2 × 2 1, **drop** the next queued piece down a lane 1 | Bejeweled, Terra Battle, Hexic, Tetris |
| (switching form) | | 1 | |

The Pneuka Jar as a form (a piece you protect, Dr. Mario's virus turned round) is a later module.

## 5. The rule catalogue (the engine's modules)

Built in the kernel: **gravity** (the map), **run** (three or more in a line), **cluster** (four or more touching, Puyo), **push**,
**kick**, **swap**, **drag** (Terra Battle), **rotate**, **drop**, **pincer** (Terra Battle and Othello: an opponent's piece sandwiched
in a line between two of yours becomes yours), **bomb** (Bomberman's cross, set off by a clear beside it), **garbage** with offsetting,
**the line**.

To come, each a module of its own:
- **matching:** diagonal runs (Columns), the crash gem (SPF2T), the rainbow (Noon);
- **clearing:** line clears (Tetris), Lumines' sweep, Qix claims, drilling (Mr. Driller);
- **movement:** ice and conveyors, grab and throw (Magical Drop), launching across the line (Meteos);
- **garbage:** timer junk (SPF2T), hard junk (two hits), garbage in patterns (Puzzle Pirates), viruses (Dr. Mario);
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
- **Familiarity reads its rules**: the tag's lines over its board, decrypted as you learn the kind (OVERLAY.md 17).
- **Beating it mends it**: an aberrant Figment is a data bug drawn wrong; its duel won, it is drained and mended (the data drain).

## 7. What it is worth

- **The Assay reads it for free** (APTITUDE.md): planning (your turn's garbage against the most the bot could find with the same AP),
  mental rotation (the rotate and drop actions), visual search.
- **Rewards** are the economy's next pass: the mended Figment's haul, a bounty where Letty posts one.

## 8. The look and the controls (asked of the divisions, not ruled here)

- **Calissa:** the board between the two, the line, the pieces by family, the intents, the settle played as steps (the engine returns
  its events in order so the view can animate each).
- **Petra:** the forms' controls on the board, the room the duel opens in (a seam from the encounter), the camera.
- **Wanda:** a chain's rising notes, the line's push, the clear.
- **Espada:** the names (the duel, the line, each rule's words), and each aberrant's rules as neuralese sentences.

## 9. Open, for the owner

1. Is 3 AP right? It is a knob; the simulator will say how long a duel runs at each.
2. When you lose a duel, what happens: a crack, being thrown out of the board, or the Figment escaping?
3. Can a sibling or a guest join your side of the board (two Couriers, one side)?
4. What does the Courier do that the hand cannot? A first answer: it stands on the board (garbage cannot land on its cell, its body
   stops a blast), and kicks cross distance the hand's swaps cannot. To be decided in play.

## 10. Built (2026-10-19): the kernel

`src/progress/duel/`: the engine, pure (no three.js), so a board plays in the room, by bots and in the simulator alike, as Raku's tables
do.
- `board.js`: the grid, the floor, the gravity map, the line, tags.
- `rules.js`: the kernel's rules.
- `duel.js`: the turn, AP, the settle loop, garbage and the wins.
- `bot.js`: a greedy planner that also gives the shown intent.
- `rulesets.js`: the first three Figments' rulesets.
- `scripts/duel.mjs`: duels between bots, headless, with lengths, garbage rates, and every settle that hit the cap.

### What the simulator says (bots against bots, 10 duels a ruleset, 3 AP, `node scripts/duel.mjs`)

| ruleset | turns a side | garbage a turn | longest chain | how they end | settles capped |
|---|---|---|---|---|---|
| fury (4 colours, rain 4, bombs 6%) | 13.4 | 3.8 | 6 | full 6, line 4 | 0 |
| grief (6 colours, toward the line, clusters, pincer) | 7.5 | 4.5 | 3 | line 9, full 1 | 0 |
| mirth (5 colours, rain 3, mirrored gravity) | 7.0 | 7.1 | 5 | line 8, full 2 | 0 |

- **Rain is the knob that matters most**: fury at rain 2 ran 61 turns a side (2 duels hit the 200-turn cap); at rain 4, 13.
- **At 2 AP** duels barely shorten (grief 4.4, mirth 6.7), and fury at rain 2 ran 126 turns: the AP sets how deep a turn's plan is,
  rain sets the pace.
- **The greedy bot never switches form** (a point spent for nothing at once). With the Courier first (`--forms courier,hand`) it walks,
  pushes and kicks, and makes a third of the garbage the hand does. The Courier needs a reason the hand lacks (section 9.4).
- No settle has hit the cap or looped in any run so far.
