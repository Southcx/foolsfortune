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
out of the stinger read its 30 m/s as its exit (casebook rule NEW:launch-end-speed). Sheets in Calissa's scratchpad (`melee-p2/`).

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

## 3. Open (for the owner)

- How many string slots to start with, and the most (God Hand's chain grows to about 8)?
- Should the launcher become a special you place (RMB with back), freeing S + LMB, or stay where it is?

## 4. Every tool its own UI: the audit (phase 6's first step, 2026-10-11)

The owner: "each tool should have its own UI according to what it does, much like the Dreamvane already". What each shows today (the
crosshair is now the psygun's alone), and a proposal for what it should show; nothing in the last column is built. The Dreamvane is the
model: its marks live on the wire compass and in the world, and each says what the tool is doing (where the Lachryma is, how near).

| tool | on screen today | in the world today | should show (proposal, for the owner) |
|---|---|---|---|
| **the psygun** | the crosshair and its spread, the hitmarker, the charge ring, the shell palette and its glove, the reload bar | tracer, muzzle flash | as today: these are the gun's |
| **the Sondelass** | the form strip (cutlass, rod, hook, the clay bob; the rod's lures on 4 to 8) | blade mode's guide line; the rod's reticle on the water and the fish portrait | the cutlass: the loadout's string as a short row of slots, the next LMB's slot lit (God Hand's combo tree), the paid cut's window as a glint on it; the hook: a mark on what it can catch, in reach; the rod: as today |
| **the Soul Brush** | the bottle's arc (it stood beside the crosshair: it now stands alone, to be judged); the paint radial | the paint reticle (where the stream lands), the jet ring, the shine, Celestial mode's mark | as today: the paint reticle is its aim; the arc may want to move to the reticle's side |
| **the Veritome** | the viewfinder while the lens is raised (first person) | plates; the flash | a small frame of the lens's field in the third person before it is raised (what the plate will hold) |
| **the Dreamvane** | the wire compass and its own marks (the vane's dowse and survey) | the dowsing bead, the fork's ring | the model, as today |
| **the Crucibelle** | the pendulum on the wire compass (its beat for the eye) | the toll's ring, the mirage | the toll's reach as a ring at the feet on the beat (what it staggers) |
| **the Lockheart** | nothing | its load as the lid's glow (ajar a crack when full); the wheel of odds when it opens | the fill and the Possibilikeys on the ring as one small gauge at the coffin (whether it can open); the hoover's reach while it draws |
| **nothing in the hands** (the kick, carrying) | nothing (the crosshair went with the psygun) | the lock-on reticle (any tool) | a throw's aim mark only while something carried can be thrown: a carried thing is thrown at the screen's middle (`courier/moves/carry.js`), which is now unmarked |

