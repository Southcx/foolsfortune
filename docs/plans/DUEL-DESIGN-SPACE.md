# The puzzle duel's design space: what was tried, built, cut and parked

South, 2026-10-28 (through Petra's round note): "Dovina writes down every design space explored and every one implemented, so nothing is
retrodden or forgotten." One row per space: the idea, where it came from, what became of it, where it is (a commit or a section of
`docs/plans/PUZZLE-DUELS.md`), and why. Statuses: **built** (in the game now), **tabled** (built, set aside by a ruling, code kept),
**cut** (removed or refused, with the measure or ruling that cut it), **parked** (thought through, not built, waiting on a reason),
**tried** (measured in a script, never shipped). Add a row in the same commit as the change; never delete one (a cut row says why).

## The board and the match

| space | prior art | status | where | why |
| --- | --- | --- | --- | --- |
| One board, two sides, a Line between them as the score | Noon's territories, Qix | built | 89076517, PD 2-3 | the duel is a tug of war you can see |
| Gravity per cell (a side's pile leaning on the Line, mirrored, burning upward) | PuzzleScript, Puyo | built | 89076517, PD 6 | a Figment's feeling as a rule, not a skin |
| A Figment is its ruleset | Puzzle Fighter's characters, Dr. Mario's levels | built | PD 6 | one aberrant, one way to fight (the owner: "Bingo, baby") |
| The board is the Figment's size (14 x 14, then 12 x 9 for the Wisp) | Puzzle & Dragons' fixed 6 x 5 | built | 9c24916a, PD 17.4, 20 | the phone's cells at 44 px, the touch minimum |
| Runs of 3 and any 4 touching (Puyo's rule) for the gentle Figments | Puyo Puyo, Bejeweled | built | fae3fa9c | linear match-3 alone was too hard on the phone |
| Clusters of 3 | Puyo at 3 | cut | fae3fa9c | one opening move made 52 to 770 junk |
| Colours by board: 4 (Wisp) for chain depth | Candy Crush's colour count per level | built, then 5 | PD 20, 24.2 | 5 on 12 x 10 fell to chains of 3; 4 under the powers chained without end |
| Seven colours on Strawman | South's ask | built | PD 24.2 | harder, the powers bring it down |
| A Figment's weakness (the opposite feeling 1.5, its own 0.5) | Persona, Puzzle & Dragons' wheel | built | 37b41de4, PD 19.2 | a colour worth chasing |
| Bombs | Puzzle Fighter's crash gems | built (Fury) | PD 6 | Fury's rule |
| The pincer (junk between your gems turns to gems) | Othello | built (Grief) | PD 6 | Grief's rule |
| Dread's fog and its lantern; embers that burn three turns | Minesweeper, Puyo's hard garbage | built | f33dd8b8, c47a7960 | Dread's rule |
| Clue fog (numbers in the fog) | Hexcells, Picross | cut | PD 19.3, 26.5 | never drawn; nothing of yours acts on the foe's half, so reading it changes no choice |

## The turn and the verbs

| space | prior art | status | where | why |
| --- | --- | --- | --- | --- |
| Action points, 3 then 5 a turn | Into the Breach's plan of a few actions | tabled (PvP) | 3a0de17c, PD 23 | South: "removing action points" for PvE |
| Swap, rotate (2 x 2), drop, push | Bejeweled, Hexic | tabled (classic) | 89076517 | the one gesture replaced them |
| The drag: a gem dragged swaps with each it passes | Puzzle & Dragons, Terra Battle | built | 6f3c094a, PD 22 | one gesture, the phone's |
| One drag a turn, up to 48 steps, a real 5 s clock | Puzzle & Dragons' orb timer | built | d07b22d1, PD 23.1 | the turn is the drag |
| Undo within the turn | Into the Breach's reset | built (classic, drag); gone once the PvE drag is made | 74eee56a | the drag is final, as in P&D |
| An action point back for a big play (One More) | Puzzle Quest, Persona | tabled with the points | 74eee56a | no points in PvE |
| The Courier on the board: forms, the run, the tools' moves (Shoot, Grab, Drill, Paint, Tune, Delay, Hold, Send, Read) | Puzzle Quest's hero, Bomberman's kick | tabled (South, 2026-10-28) | 3a0de17c, c0850cdb, PD 11, 18 | the one gesture; "the Courier's form, the form's dive and the tools' moves are tabled" |
| The worn pair as charged skills (Shot, Vein, Paint, Grab, Tune, Hold, Read) | P&D active skills, Candy Crush specials | built in `drag`; tabled in PvE | 6f3c094a, PD 22, 24.4 | the seven powers overlap them; nine big plays a turn is too many tiles |
| A skill once a turn | P&D cooldowns | built | 4605a6b9 | skyfall recharged them mid-turn (9 actions, 4 skills) |
| The god hand's seven powers as the PvE duel's big plays | P&D active skills, Puzzle Quest spells, GOD_POWERS | built | 8a0f7856, PD 24 | South's ask; one a domain |
| Powers paid from the pool, filled a point a gem cleared | Puzzle Quest's mana | built | PD 24.1 | the hand's powers cost Lachryma in the world |
| Three powers a turn | P&D (no cap per turn) | tried, cut | PD 24.1 | the Wisp fell in 3 turns at any skill |
| One power a turn, each resting its turns | P&D cooldowns | built | PD 24.1 | how well you drag matters again; a cast is a moment |
| Powers opened by domain level | OSRS, GOD_POWERS' `at` | parked | PD 24.1 | all seven needed to win Strawman's seven; the level lowers the cost instead |
| Powers opened by the bracelet's charms | BRACELET.md | parked | PD 24.1 | the bracelet is a plan; revisit when charms exist |
| The worn pair's domains making their powers cheaper | Monster Hunter's set skills | parked | PD 24.4 | keeps the belt meaningful in a duel; not needed to balance |
| Manifest filling the whole 3 x 3 | Candy Crush's colour fill | tried, cut | PD 24.3 | won alone, 16 of 16 in 4.3 turns; capped at 3 cells |
| Transmute that also keeps its colour out of the refill | Bejeweled's hypercube, Candy Crush's colour removal | built | PD 24.1 | a board of 7 brought to 6 for two turns, the real way down |
| The finisher (the god hand's end on a broken foe) | Persona's all-out attack | tabled in PvE | 3a0de17c | no break in PvE |
| The flee: a d20 saving throw against 15 | D&D's saving throw | built | 929c4d56, PD 15 | an escape with odds you can read |

## Junk, chains and the Line

| space | prior art | status | where | why |
| --- | --- | --- | --- | --- |
| Junk from clears, (n - 2) x 2^(step - 1) | Puyo's chain power | built | 89076517 | chains worth chasing |
| The doubling capped at step 5 | Puyo's chain table tops out | built | 32ce70fb | skyfall made 22-step chains |
| Offsetting: your junk cancels what is coming | Puyo Puyo Tetris | built (classic, drag); none in PvE | PD 23.2 | in PvE your clears always push the Line |
| At most 9 junk land at once (6 on the Wisp's board) | Puyo's 30 a drop | built | ab726b12 | a landing you can survive |
| Margin time (junk counts more past 10 turns) | Puyo Puyo Tetris | built | 74eee56a | a duel ends |
| The all clear | Puyo | built | 74eee56a | a big play's reward |
| Skyfall to a waterline, a refill that would clear at once mostly recoloured | P&D skyfall, Candy Crush's refill | built | 32ce70fb, PD 22.7 | the board read sparse; uncalmed, 397 095 junk a turn |
| A skill's blast refilled wild (uncalmed) | P&D's skyfall combos | built | PD 23 | a blast feeds the drag after it |
| The Line pushed at most 2 columns a turn, overkill lost | P&D's overkill | built | PD 23.2 | a lucky drag is not a win by itself |
| A side filled to death loses | Noon, Tetris | built | 89076517 | the second way to lose |

## The aberrant

| space | prior art | status | where | why |
| --- | --- | --- | --- | --- |
| The aberrant plays match-3 with a bot | Puzzle Fighter's CPU | tabled (PvP) | 89076517 | South: "rather than having them also play match 3" |
| The break: a side's EmO broken, a stun a depth deeper, orbs shed | Persona's down, Octopath's break | built (classic, drag) | 3a0de17c | the Courier's side's reward |
| The foe's intent drawn a turn ahead | Into the Breach | built | c0850cdb, PD 18.2 | answerable, not guessed |
| Foe skills on countdowns (Hurl, Petrify, Seal, Sap, Reclaim) | P&D enemy skills, Into the Breach | built | d07b22d1, PD 23.3 | a battle of wills, not a race |
| The desperate flare once, at its last columns | P&D's preemptive and last-stand skills, a limit break | built | d07b22d1 | the climax; Calissa's cut-in |
| A stagger: a big play puts every countdown a turn later | P&D's delay | built | d07b22d1 | skill pays twice |
| A foe skill's tooltip only once seen (knowledge) | Pokedex, Souls item text, Into the Breach | built | 8a0f7856, PD 24.5 | South: "observation first" |
| Scan counts a skill as seen | Divination's own power | built | PD 24.5 | the domain of seeing sees |
| Seen as a ledger counter | the ledger | cut | PD 24.5 | the practice duel counts nothing, and Strawman's Hurl is the first met |
| Every aberrant an Elite: its own board, Zone of Influence, skills, cut-ins, sounds, secret, two deaths | Slay the Spire's elites, Monster Hunter | built (the Wisp's rules), the rest asked | ABERRANTS.md | South, 2026-10-28: "Puzzle duels are like Elite fights" |
| A secret win, never said, told by the body and board | Shadow of the Colossus, Metroid Prime's scan, MH's capture | built (`secrets.js`) | ABERRANTS.md 3 | a second way to win, for the player who reads the aberrant |
| The Wisp's secret: snuff the lantern (24 Dread cleared) | the will-o'-the-wisp myth | built | ABERRANTS.md 3.1 | at 8 it fell in 2 turns to Transmute and Miracle; at 24 as long as the Line, found by chance 1 in 10 |
| A secret's answer that wakes at half (Kindle) | Slay the Spire's Lagavulin waking | built | ABERRANTS.md 3 | the aberrant notices; the secret is a contest, not a checklist |
| A secret's progress as a gauge from the start | | cut | ABERRANTS.md 4 | a secret said is not a secret; shown plainly only once found |
| A palette per ruleset (its feeling and its weakness on its board) | | built | ABERRANTS.md 3.1 | the Wisp's 5 colours held no Dread at all |
| Your half of the backdrop as your Spirit Garden (season, harmony, decor, spirits) | Jujutsu Kaisen's Domain Expansion, Kingdom Hearts' Station of Awakening | built (the data), the look asked | ABERRANTS.md 7 | South, 2026-10-28; the garden is the world inside your Jar |
| A duel's power pays its domain's experience | the god hand's own sources | built | PD 26.1 | closes the hand's loop: the duel trains what it uses |
| A good drag feeds the powers (pool by chain step, rests cut by a chain) | P&D's skill delay reduction | built | PD 26.2 | a chain worth more than its junk |
| "Your drag barely matters" | | cut (a measuring error) | PD 26.2 | the K stand-ins all searched every swap; with a real skill axis, skill separates sharply |
| Aberrants and duel powers in the collection log | OSRS's collection log | built | PD 26.3 | a secret's slot named by whose, never what |
| Unawakened feelings' gems attenuated (dim) | | built (pool only) | PD 26.4 | South's ask; counting in the Line's push too, a new save could not win |
| Locked feelings' gems hidden | | cut | PD 26.4 | South: attenuate, don't lock |
| Hurl's junk waiting a turn | Puyo's garbage | cut | PD 26.6 | read as broken; nothing answers it in PvE |
| Best of three | fighting games | parked | PD 26.7 | too long for a field fight; for Marks and PvP |
| The garden changing a duel's rules (a spirit's help, harmony as a buff) | Pokemon's partner, Persona's social links | parked | ABERRANTS.md 7 | base change bad; the garden is in flux; no new reasons yet |
| The secrets of the slip jelly, the clapperjar and Strawman | | parked | ABERRANTS.md 5 | each needs its creature aberrant in the world first |

## Teaching and practice

| space | prior art | status | where | why |
| --- | --- | --- | --- | --- |
| The first duel as a lesson, each step done by doing it | Into the Breach's tutorial, P&D's first dungeon | built | c0850cdb, PD 18.3 | the mechanic is the lesson (DESIGN.md 22) |
| The lesson's steps by style (classic, drag, PvE: the last a power) | | built | 9492acb7, PD 24 | the PvE duel has no Courier form |
| The practice duel against Strawman, counting nothing | P&D's training dungeon | built | PD 22.6 | test the duel itself |
| Practice picks: idle, plain, the Wisp's board | Tetris's practice | built | PD 22.6 | from no pressure to the real rehearsal |
| A move's worth shown before it is chosen (`preview`) | Puyo's chain preview, Candy Crush's hint | built | fae3fa9c | the owner could not see why the Figment scored |
| A lookahead never draws the duel's dice | | built | 9db1d51a | hovering changed the duel's chances |

## Later (parked for a PvP mode, South: "we can come circle back to the original mechanics for like a pvp mode")

| space | prior art | status | where | why |
| --- | --- | --- | --- | --- |
| Co-op on one side (a side of two players' points) | Puyo Puyo Tetris's team play | parked | PD 12 | needs the points back |
| The classic duel against a guest | Puzzle Fighter | parked | PD 23 | the original rules kept for it |
