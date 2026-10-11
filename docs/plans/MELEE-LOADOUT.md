# The melee loadout (working name: "kit" is the Pneuka Box and the belt's; Espada names it): the Sondelass built out like God Hand (the owner, 2026-10-11)

Kept by Calissa (the owner put the Sondelass and Strawman in Calissa's hands, 2026-10-10). Each part names who builds it; a part in another
division's files is asked for, never edited past the smallest call-site (CROSSING). The owner's words, verbatim, are in section 0.

## 0. The owner's asks (2026-10-11)

1. The prowl's head is a little too still: split the difference with the old one.
2. High Time and the air string are a little too floaty; the launcher chases what it hits, so on Strawman (who cannot be lifted) the
   action breaks.
3. Strawman cannot be locked on to. Strawman's mode belongs on the nearby lectern. The status bench's roly-polies do nothing visible.
4. Hide the psygun's crosshair when another tool is out; every tool its own UI for what it does, as the Dreamvane has.
5. Gall and Fury are not wired to the Sondelass (the rod's lures know five feelings: keys 4 to 8): broader implications, with Dovina and Petra.
6. The Sondelass needs a run with the blade drawn.
7. Expand and bulletproof the Sondelass's combo system like God Hand (PS2): you build your combo kit yourself (the owner's word; ours: the loadout).
8. The zandatsu (blade mode) moves to holding RMB while crouched, with an iaido striking pose as its charge-up; then LMB is the normal
   attack button and RMB the special button, so moves like the stinger are not disrupted.
9. A blink dodge cancels any move, at any time.
10. C becomes a crouch toggle, and prone joins the cycle.

## 1. Order of work (one set at a time; melee first; the psygun parked)

| phase | what | who |
| --- | --- | --- |
| **1. Polish** | the prowl's head halfway (1); High Time on its own arc, tighter air string (2); Strawman lockable, its mode on the sparring lectern, the roly-polies alive (3); the psygun's crosshair only with the psygun (4, its first half); the drawn run (6) | Calissa; Petra: lockon.js, hud.js (CROSSINGs) |
| **2. The loadout's engine** | LMB normal, RMB special (8); the crouched iaido into blade mode (8); the blink cancel (9); the loadout as data and a default loadout equal to today's moves (7) | Calissa (moveset, cutlass); Petra: blink.js, input (CROSSINGs) |
| **3. The loadout's choosing** | the loadout editor, the moves to learn and how each is earned (7) | Calissa (the editor's look and code); Dovina (earning, the arts law); Espada (the moves' names) |
| **4. Crouch toggle and prone** | C cycles stand, crouch, prone (C while sprinting still slides); a prone body; the crawl's look (built, dormant) wakes | Petra (player.js, the capsule); Calissa (the look) |
| **5. Gall and Fury on the rod** | seven lure aspects, their fish, their keys | Dovina (species, prices), Petra (the angler's keys), Espada (names), Calissa (lures' and fish's looks) |
| **6. Every tool its own UI** | an audit of each tool's on-screen marks, then each tool's own (the Dreamvane's is the model) | Calissa (looks); Petra (hud.js) |

**Phase 1b, built (2026-10-11, Calissa):** Strawman lockable (`game.lock.add`, Petra's ruling; casebook rule 191) and its stance on the
sparring circle's lectern (COMBAT-LAB.md section 2); the status bench's roly-polies alive (COMBAT-LAB.md section 5); the psygun's
crosshair shown only while the psygun is drawn (`feedback/hud.js`, CROSSING). Phase 6's audit is section 4.

**Phase 2, built (2026-10-11, Calissa):** the loadout as data (`tools/sondelass/sondelassloadout.js`: `SONDELASS_MOVES`, c1 to c4 and the
stinger, each with its kind, clip, effect and a null parent; `SONDELASS_LOADOUT`, the string c1 to c4 and the specials { tap: stinger,
forward: null, back: null }), read by the engine (`tools/moveset.js`: `catalogue`, `loadout`, `special(dir)`), so any tool can take one.
The default plays today's string to the frame (headless, free, paid, air and pause runs: every blow's start, hit and paid cut on the same
frame before and after). RMB is the specials button, changed only in `cutlass.js`: at once on the press (the stinger's press-to-lunge,
headless: 117 ms for a 100 ms tap before, which waited for the release; 17 ms after, whatever the hold), W + RMB the forward slot, S + RMB
the back, an empty slot the tap's; never blade mode. Crouched (`player.crouching`), RMB is **the iaido**: the charge's pose (the suite's
Gun_QuickDraw with the blade along the belt, its point past the left hip, the off hand at the guard: `stance:cutlassIaido`, solved in
game), held 0.5 real s into blade mode as before, let go before into **the draw cut** (Sond_Combo2 from 0.1 clip s at 1.4x, the crouch's
legs kept; a slip jelly 2.4 m ahead struck 5 frames, 83 ms, after the release). **The blink cancel** (`Moveset.blinkCancel` on
`move.blink`, every tool's moveset; `cuttable` on the carry and the stinger): E at any frame of c2, the launcher, the stinger, an air
blow, the iaido's charge or blade mode gives the blink on that frame's fixed step (blade mode: 2 frames, the world brought back up first),
and the next LMB is the next slot (c2 to c3, a1 to a2, High Time to a1), never the pause branch nor the dash. Found on the way: a blink
out of the stinger read its 30 m/s as its exit (casebook rule 195). Sheets in Calissa's scratchpad (`melee-p2/`).

**Phase 3, the catalogue, built (2026-10-11, Calissa):** `SONDELASS_MOVES` holds Dovina's slice, 12 normals and 6 specials, each row with
its label (CLARITY's genre word), one line of effect, `lore: null` (Espada's), `earn: null` (Dovina's), its parent, its effect and its
`stats` (power, hits, time, range, cost, status). The new normals: **Quick Slash** (UAL swordA; parent c1), **Backhand** (swordB; c2),
**Lunge Slash** (the melee hook, a step in; c3), **Heavy Chop** (swordC; c4), **Guard Break** (the suite's shove; c2), **Push Kick** (the
front kick, the off hand's foot; c4), **Low Sweep** (swordHeavy's low cut; c3), **Body Blow** (the left jab; c1). The new specials:
**Spin Slash** (Sond_SpinSlash; parent Backhand), **Power Slash** (the charge's release without the hold; Heavy Chop), **Rising Cut**
(the uppercut with the blade, a launch; Quick Slash), **Guard Crush** (a planted thrust through a guard; the stinger), **Backstep Slash**
(c3's hop taken 1.14 m back, for S + RMB; c3). No clip authored. The engine gained what they needed (`tools/moveset.js`): a row's own
`stats` where moves.js names none, a move's own `reach`, `ribbon: false`, a typed `step` (forward or back), and `hit.guardBreak` (the
thing struck asked `breakGuard()` first: Strawman's guard thrown open 1.0 s of the sim clock, `world/testroom/room.js` and `vfx/strawman.js`).
Dovina's row rule holds, measured against a slip jelly: every new normal in every slot within -2.9% and +2.2% of today's string (1.956
power a real second, hit-stops in), the four slowest together -7.7%, every special -8.5% to +6.0%; the stinger, today's, is +780% (its
lunge strikes 2.2 x its row: a finding for Dovina, unchanged). The default loadout is today's to the frame (phase 2's `string.mjs`, all
five runs the same). The chart and the table: SONDELASS-STRINGS.md section 7. Sheets in Calissa's scratchpad (`p3/moves/`).

**Phase 3, the choosing, built (2026-10-11, Calissa; the catalogue's new rows are another builder's, on their own branch):** the loadout
editor (`tools/sondelass/loadouteditor.js`), God Hand's technique list beside its Combo Tree: on the left the string's slots (`slotRow`:
4 open, the rest shown CLOSED with what opens each, "300 hits"; the run's way unshown until its record has a writer) and the specials'
three (RMB, W + RMB, S + RMB); on the right every move of the catalogue that fits the slot picked, as choice cards (label, one line, power, reach, speed and cost, the effect's
keyword, compare arrows against what the slot holds; a locked move shown locked, "Locked. Learned from Rising Slash (to come).", never hidden). Click a
slot, then a move. It lists whatever `SONDELASS_MOVES` holds (two rows put in at run time by the probe were listed, locked and lent,
with nothing changed in the editor); a row's own `label`, `does` and `numbers` win, and `loadoutwords.js` stands in for today's five
(Flat Cut, Rising Cut, Hop Cut, Leap Chop, Stinger: placeholders for Espada's; reach measured from the clips, c1 1.52 m, c2 1.74,
c3 1.56, c4 2.11, the stinger's lunge 8.4 m and its 2 m point). Opened at **the sparring circle's lectern** (its page's first row,
LOADOUT: the Index's window, `showPage`; Esc or F closes) and on **the Codex's SONDELASS shelf** (Esc, B or F closes). **Kept**
(`loadoutchosen.js`, `game.sondelassLoadout`): one save section, `sondelassLoadout`, scope player, `{ string, specials }` as set, marked
dirty on each change; the cutlass hands the engine `get()`, the choice checked against the catalogue (the row there, of the slot's kind,
playable) and against what is open, a slot that no longer fits falling back to the default's (a fifth to eighth slot left empty, the
string closing up), never a throw; the choice itself is kept as set, so a move lent in DEBUG comes back with the lend. **What is open**
(`loadoutopen.js`, reads the ledger and the lends, writes neither): slots 5 to 8 at 300, 1,000, 3,000 and 8,000 `cut.hit`, or a run of
8, 10, 12 or 14 (`sond.string.best`: nothing writes that record yet, so it reads 0 and only the count way opens a slot until Petra's
rule lands); today's four normals and the stinger known from the start, any other row by its `earn(L, game)`; in DEBUG the lend panel's
`moves` row lends every move and all 8 slots, each lent one wearing the hollow mark. **Said:** `loadout.set { tool, slot, move, label,
by: 'courier' }`, its rule in `feedback/tracking/moves.js` ("Your string's third blow is now Leap Chop."; Espada's words to come).
**The keywords:** a move's effect is shown as a keyword, four new ones beside CLARITY's twelve (Stagger, Knockback, Launch, Guard break,
`ui/keywords.js`, their icons `ui/icons/keywordart.js`: placeholders for Espada's word), and the card has three new chips (power, reach,
speed: `ui/choicecard.js`, `ui/icons/chipart.js`). Measured headless: the default string began c1, c2, c3, c4 at frames 1, 38, 67 and
110 (LMB every 6 frames, a slip jelly 1.9 m ahead); with c4 put in slot 3 and c3 in slot 4 through the editor, c1, c2, c4, c3 at 1,
38, 67 and 115, then c1 at 146; the page reloaded, the save still held c1 c2 c4 c3. Sheets in Calissa's scratchpad (`p3/editor/`).
Not built: `move.learn` (the log's line when a move opens: Dovina's earning), the tree view of a move's two ways in the Codex.

**Phase 3, joined (2026-10-11, Calissa):** the catalogue and the editor merged on `art-p3`. The editor lists all 18 rows with the
rows' own words (Slash, Rising Slash, Hop Slash, Leap Strike, Stinger for today's five: `loadoutwords.js`'s placeholders are now a
fallback only). Two fits, both in the card's numbers: a row's `stats.range` is its reach (the catalogue's measure, SONDELASS-STRINGS.md
7a: what the card shows), and a row's power is a hit's times its `hits` (Spin Slash 0.85 x 4 = 3.4); the power chip shows hundredths
(Push Kick 1.45, Low Sweep 1.35). Measured headless, DEBUG with Tool Moves lent: 18 cards for 18 rows, 8 slots open; Quick Slash, Body
Blow and Lunge Slash put in slots 1 to 3 and Spin Slash and Backstep Slash in W and S through the editor, kept in the save as set, said
in the log; the string played quickSlash, bodyBlow, lungeSlash, c4 (begun at frames 1, 32, 55, 98, LMB every 6 frames), striking a
slip jelly 1.9 m ahead for 1.0, 0.9 and 1.4; W + RMB played Spin Slash and S + RMB Backstep Slash. In STORY the new rows stay locked:
their `earn` is null until Dovina writes it. Sheet in Calissa's scratchpad (`p3/integrated/`).

**Phase 3, repaired (2026-10-11, Calissa; the verifiers' three blocking findings):** (1) Whole-body blows walked the Courier through a
slip jelly held by a status, or round Strawman, and every blow after hit air. `Moveset.carry` cut a move's travel only past 0.3 m of
where its clip ENDS, never below 15%, and never under the lock-on, so Guard Break, Push Kick, Heavy Chop and Low Sweep (in 0.12 to 0.43
m and back) were not cut at all. The cut is now by the hips' farthest ahead plus the move's own step, down to none, toward the lock's
target else the magnet's; aimed at something, the clip's sidestep is dropped (casebook NEW:travel-cut-to-the-peak). Guard Break x8 into
a halted jelly holds at 1.40 m, lock-on or not (was through it by blow 7); the default holds 1.41 m from a jelly (it crept 0.1 m a
cycle, and walked to 0.34 m under the lock-on). (2) The row rule, measured as the verifiers did (LMB every 6 frames, the pool empty,
cycles 2 and 3): the 30 random loadouts of 4 to 8 slots (seed 7) are all inside 15% against a pinned slip jelly and Strawman, -6.2% to
+3.1% (were 11 outside against the jelly, to -94.9%, and one against Strawman, -39.5%); every normal alone in 4 and 8 slots, -8.8% to
+6.7%. The default string's frames are phase 2's in all five runs. (3) The Stinger's line says "Lunges 8 m", its reach chip's number
(casebook NEW:line-numbers-are-stats). Not changed: a blow's push follows its swing's tangent (`melee.js`), so the off hand's blows
(Push Kick 7, Guard Break 5) shove a free jelly sideways; stunned, with no lock-on and the camera never turned, [Push Kick, Body Blow,
Lunge Slash, Push Kick] put it 58 degrees off the camera's look by blow 11, past the magnet's cone (with the lock-on, 15 hits in 10
real s). Harness in Calissa's scratchpad (`p3/repair/`).

**Phase 3, repaired again (2026-10-11, Calissa; the verifiers' second round, four blocking):** (1) A knock back goes back: a blow's
direction was its swing's tangent (`melee.js`), so every pushing blow sent a free slip jelly sideways (Push Kick 0.00 m along the line
from the Courier, 1.33 across). The engine's `hit.away` (0..1, `tools/moveset.js`) sends that share straight away, its push and the
flinch; the catalogue's twelve rows that push carry `away: 1` (casebook NEW:knock-away-not-along). Along / across now: Push Kick 1.33 /
0, Heavy Chop 1.45 / 0, Low Sweep 1.66 / 0, c4 1.24 / 0, Power Slash 1.86 / 0. The default string is phase 2's frame for frame through
c4's hit; after it the jelly lies 2.74 m off (was 1.95 m to the side) and the loop's next c1 cuts air. (2) Empty in a middle slot ends
the string there, the slots after it with it, as its card and the log say (it cut the slot out; NEW:say-only-what-happens). (3) A
change in the editor is written at once (`save.flush()` after `dirty()`: the main loop writes nothing while a window is open;
NEW:write-what-a-window-changes). (4) A closed slot says only "300 hits" (1,000, 3,000, 8,000): "or 8 in a row" comes back when
`sond.string.best` has a writer. And three minors: the W + RMB and S + RMB lists show their own key caps, a quick second change to a
slot is said (the log's throttle dropped it), and Backstep Slash's reach says 2.1 m (measured: lands at 2.1, misses at 2.2; it said 2.4). Harness in Calissa's scratchpad (`p3/repair2/`).

**Phase 3, repaired a third time (2026-10-11, Calissa; the verifiers' third round):** (1) The default loadout plays phase 2's string
frame for frame again: c4 has no `hit.away` (its knock is along the swing, as before), and the carry's peak travel cut is opt-in
(`travelCut: 'peak'`, the ten new whole-body rows); every move that existed keeps the old cut. c4's chain window is read only when c4 is
not the last slot, so never by the default (casebook NEW:default-plays-as-before). Phase 2's `string.mjs`, its five runs against
art-melee-p2 (02836dd), the slip jelly free and pinned: identical on every frame (begins, hits, cuts, the pool, the Courier's x, z). (2)
A locked move promises nothing: until Dovina's `unlocked('sondelass', id, L)` has a row for it (`loadoutopen.js` asks it where her
table holds one with an `unlock`), every move not in `STARTERS` stays locked in STORY, and its card says "Locked. Learned from <parent>
(to come)." (NEW:say-only-what-happens); DEBUG's `moves` lend still opens all 18. (3) The editor reaches the Index's window through
`game.indexMenu` (not `game.course`, a retired word); Guard Break's id is `guardBreak` (was `shove`, the kick's move's id), and a save
holding 'shove' plays it (`RENAMED`, `loadoutchosen.js`). Harness in Calissa's scratchpad (`p3/repair3/`).

## 2. The loadout (God Hand's Combo Tree, ours)

**Prior art:** God Hand (Clover, 2006): the Combo Tree (the square button walks a chain of slots the player fills with learned
techniques), the Technique Roulette (specials on their own buttons), techniques bought and assigned in a menu; Devil May Cry's
grammar (kept: the launcher, the air string, the pause string); Bayonetta's dodge offset (the blink cancel keeps the string).

- **LMB, the string:** an ordered row of slots, each holding one learned **normal** move (a Sond_ clip with its row: power, reach, speed,
  what it does to a body: stagger, knock, launch, guard break). Each LMB press plays the next slot; the last slot loops to the first.
  Starts with 4 slots (today's c1 to c4); more slots are earned.
- **RMB, the specials:** RMB tap, RMB with forward, RMB with back, each holds one learned **special** (the stinger is the default on
  the tap). A special can be cut into from a normal's recovery for the paid cut (as now).
- **Kept:** S + LMB the launcher, LMB in the air the air string, LMB after a pause the pause string, LMB while sprinting the dash, R the
  tool's special art (the Tidecutter), V the guard and the parry.
- **Crouched, hold RMB: blade mode** (the zandatsu): an iaido stance as it charges (the hand on the hilt, the body low, the blade
  sheathed-still), released into the cut. Not crouched, RMB never enters blade mode, so the stinger is never eaten by it.
- **The blink cancels anything:** a blink at any frame ends the move (no recovery owed), keeps the string's place (the next LMB is the
  next slot, as Bayonetta's dodge offset), and wears the blink's own afterimage.
- **Earned, never bought** (the house's law: arts only by achievement): each move a ledger predicate with a count way and a feat way;
  Dovina writes the predicates, Espada the names. **Chosen** at the sparring circle's lectern and in the Codex's Sondelass page; kept in
  the save (a section of scope player).
- **The loadout as data:** `SONDELASS_LOADOUT` (the slots) over `SONDELASS_MOVES` (the catalogue), read by the moveset engine (`tools/moveset.js`,
  built once: any tool can have a loadout later).

**Petra's bindings (2026-10-11, checked against main):**
- **RMB changes only in `cutlass.js`.** The hook aims on RMB held (`hookshot.js`) and the rod reels on it (`angler.js`); both stay. MMB
  stays the cutlass's lock-on toggle.
- **"Crouched" is `player.crouching`** (grounded and low), never C held: C held means the wall latch, the slam looking down, swimming
  down, the ladder and pole slides and the balance drop, and after phase 4 C is a toggle.
- **The blink cancel, split.** Petra's half (`techs.js`, `blink.js`): Techs lets the blink (E) cut in over a moveset's `launch` tech.
  Calissa's half: every Moveset listens for `move.blink` and cancels itself. No recovery is owed, the string's place is kept, the clip
  fades, and its launch's `onEnd` is nulled. Nothing in `blink.js` calls into tools, so every tool's moveset gets the cancel free.
  Petra's half is on main at c2e5cc6. On our side, pass `cuttable: true` in the `L.go` options of `Moveset.carry`, and on the stinger's
  launch. `Launch.end` calls our `onEnd`. A launch without the key (a pad's flight, a swing's release) never yields. Upper-body blows
  run no tech, so they need only the `move.blink` cancel.
- **Strawman's lock-on** goes through a candidate hook in `lockon.js`, never `game.creatures`, so the ledger never counts Strawman.

**Dovina's earning (2026-10-11, `docs/plans/MELEE-LOADOUT-EARNING.md` on `claude/dovina-design`, 20c5d96):**
- **String slots:** 4 to start and 8 at most. Slots 5 to 8 open at 300, 1,000, 3,000 and 8,000 cutlass hits, or sooner by an unbroken
  string run of 8, 10, 12 or 14 blows (a new ledger record, `sond.string.best`).
- **Moves:** each catalogue row names one parent move.
  - A normal opens at 60 landed hits of its parent, or 5 finishes with it.
  - A special opens at 30 hits of its parent, or once on the feat its effect names.
  - Known from the start: today's four normals, the stinger, the launcher, the air string, the pause string and the dash.
  - Target for the slice: about 12 normals and 6 specials.
- **The row rule:** whatever the loadout holds, the string's damage per second stays within ±15%. A move that does more to a body pays
  for it in time or in power.
- **Its two events (built 2026-10-11, Calissa; the rules are Petra's):** `move.blow { tool, move, slot, hit, finish, by }` once a blow,
  and `move.string.end { tool, run, why, by }` when a string run stops (the LMB blows landed in a row: a special's blow is apart from
  it, neither adding nor ending; `tools/moveset.js`; what fires when, as measured:
  `docs/handoffs/petra/2026-10-11-from-calissa-blow-events.md`).

## 3. Open (for the owner)

- How many string slots to start with, and the most (God Hand's chain grows to about 8)?
- Should the launcher become a special you place (RMB with back), freeing S + LMB, or stay where it is?

## 4. Every tool its own UI: the audit (phase 6's first step, 2026-10-11)

The owner: "each tool should have its own UI according to what it does, much like the Dreamvane already". What each showed before (the
crosshair is now the psygun's alone), and what phase 6 built for it (the last column; it was the proposal). The Dreamvane is the model:
its marks live on the wire compass and in the world, and each says what the tool is doing (where the Lachryma is, how near).

| tool | on screen before phase 6 | in the world before phase 6 | built (phase 6, 2026-10-11) |
|---|---|---|---|
| **the psygun** | the crosshair and its spread, the hitmarker, the charge ring, the shell palette and its glove, the reload bar | tracer, muzzle flash | as today: the crosshair and the rest are the gun's |
| **the Sondelass** | the form strip (cutlass, rod, hook, the clay bob; the rod's lures on 4 to 8) | blade mode's guide line; the rod's reticle on the water and the fish portrait | the cutlass's **string row** (`ui/cutlassstringrow.js`): a pip a slot at the bottom middle, the next LMB's lit, the struck before it, the paid cut's glint; the hook's **mark** (`vfx/hookmark.js`): a ring where the grapnel would bite, brackets closing for a catch, in place of the chevron; the rod as today |
| **the Soul Brush** | the bottle's arc (it stood beside the crosshair: it now stands alone, to be judged); the paint radial | the paint reticle (where the stream lands), the jet ring, the shine, Celestial mode's mark | the bottle's arc moved beside the paint reticle's ring (`vfx/bottlearc.js`), beside the chest while mopping or a jet runs; the rest as today |
| **the Veritome** | the viewfinder while the lens is raised (first person) | plates; the flash | the **lens's frame** (`vfx/veritomeframe.js`): four corners round what a plate would hold, set where the aim meets the world, opening out to the viewfinder through the lift |
| **the Dreamvane** | the wire compass and its own marks (the vane's dowse and survey) | the dowsing bead, the fork's ring | as today: the model |
| **the Crucibelle** | the pendulum on the wire compass (its beat for the eye) | the toll's ring, the mirage | the **toll's reach** (`vfx/tollreach.js`): the next toll's arc and cone at the feet, lit on the beat, a ring under each thing it would stagger |
| **the Lockheart** | nothing | its load as the lid's glow (ajar a crack when full); the wheel of odds when it opens | the **Lockheart's gauge** (`vfx/lockheartmarks.js`): a padlock beside the coffin filling with its load, a socket a Possibilikey, the shackle up when it would open; **the hoover's reach** on the ground while it draws |
| **nothing in the hands** (the kick, carrying) | nothing (the crosshair went with the psygun) | the lock-on reticle (any tool) | the **carry throw's mark** (`vfx/carrythrowmark.js`): where a carried thing would land (the paint reticle's look in the crosshair's cream) and its flight dashed, only while it is held |


**Phase 6, the Sondelass, built (2026-10-11, Calissa):** the cutlass's **string row** (`ui/cutlassstringrow.js`, God Hand's combo tree):
a pip a slot of the loadout's string at the bottom middle, the next LMB's lit gold and raised, the struck ones before it, the rest dim;
while the paid cut is open (`Moveset.paidCutOpen`, the engine's own test, its cost affordable) the lit pip wears the oil film and a pale
glint runs over it; a blink cancel keeps the lit pip, the string's reset resets it; out of a fight and idle 3 real s it fades, the first
blow brings it back. The hook's **mark** (`vfx/hookmark.js`, Zelda's hookshot sight): a ring on the point the grapnel would bite (the
throw's own probe, 40 m), brackets closing on it for a catch, faint when the pool cannot pay; it replaces the chevron there. The rod as
today. No new shader program (the hook's mark is the wire compass's; the row is DOM pixel art). Sheets: Calissa's scratchpad, `p6/sond/`.

**Phase 6, built (2026-10-11, Calissa; four builders merged on `art-p6`):** every row's last column above. No new shader program: 163
with each tool drawn in turn, as on the base (the marks draw on the wire compass's, the rail mark's, the glyphs' and the ribbons'
programs; the string row is page pixel art). Each mark is gone on a stow or a swap (measured headless, every tool in turn). Two things
at the merge: the carry throw's landing had taken the brush's reticle's name, so the bottle's arc stood at the chest (CASEBOOK
NEW:registered-name); and the toll's reach now draws with the one shared wire (`wireStrip`, `vfx/railmark.js`; its buffers identical
over 240 frames). Open for the owner: feel in play; the toll's and the hoover's reaches are faint on noon sand; window sizes past 960
px. Sheet: Calissa's scratchpad, `p6/integrated/sheet.png`.
