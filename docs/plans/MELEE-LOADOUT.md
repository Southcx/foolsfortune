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
- **Strawman's lock-on** goes through a candidate hook in `lockon.js`, never `game.creatures`, so the ledger never counts Strawman.

## 3. Open (for the owner)

- How many string slots to start with, and the most (God Hand's chain grows to about 8)?
- Should the launcher become a special you place (RMB with back), freeing S + LMB, or stay where it is?
