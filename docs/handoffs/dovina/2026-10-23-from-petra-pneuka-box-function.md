# From Petra: the Pneuka Box under main and sub, the function (PNEUKA-BOX.md 4, my ask; 2026-10-23)

## 1. The functional sketch

**The belt becomes the loadout** (`tools/belt.js`, 187 lines today).
- **It keeps:** the seven tools registered (`add`, `get`), the tool contract (`drawT`, `wants`, `stow()`, `out()`, `model`, `rules`), `inHand`,
  `mayDraw`, `draw`, `allows`, `others`, `hands`, `hideWorn`. These 30-odd call sites stay as they are.
- **It gains:** `main` and `sub` (two ids, never the same); `equip(id, 'main' | 'sub')` (the old pair swap in one call); `mayEquip(id)`, which
  asks your swap rule and says the refusal at the point of use; `pair` (your `pairOf(main, sub)`).
- **`isWorn(id)` narrows to "main or sub".** Its 34 readers (20 files: the passives, "is the Dreamvane worn" for the wire compass, and the like)
  keep working unchanged. That is how the sub's passive comes free wherever it is already a "worn" check.
- **It retires:**
  - `PLACES`, `BELT_SIZE`, `inPlace()`, and the capacity part of `wear()` / `takeOff()`;
  - `ready()` (the "is in your Pneuka Box" line, said at each tool's own key);
  - `rules.digits` (read by nothing, your audit).
- **The hip stays.** `HIP_SIDE` and `hipSide()` are kept: main and sub can both be hip tools (the Veritome with the Soul Brush, say), and each
  tool's worn model still hangs at its own place on the body. The slot is now where a model hangs, not a capacity rule.

**The keys move into the belt.**
- The belt reads **X** and draws or stows the main (one rule, where the four tool files each write it out today), and reads **R** for the sub.
- Each tool stops reading its own draw key: Q, G, J, K, U, I and X come out of seven tool files, a few lines each.
- The psygun's `deadInput` filter, its keys blanked while another tool is out, becomes "the psygun is the main and drawn".
- The numbers and the wheel stay the main's alone.

**The sub's verb runs from where it hangs: R on press, instant.**
- **The runtime:** each tool exposes `lend()`. It does the move named in SUB_GIFTS with no draw: its effect code, one gesture clip over the
  main's stance (Calissa's), and the tool's model shown at the hand for the move's length where the move needs it (Grapple's line, Gulp's
  coffin).
- **What each `lend()` calls:**
  - Snap shot: one round from where the main aims;
  - Grapple: the hookshot's `fire`;
  - Flick: the brush's flick;
  - Flash: the Veritome's Flash;
  - Lure throw: the Dreamvane fork's throw;
  - Toll: one toll;
  - Gulp: the Lockheart's gulp.
- **R can't be "tap for the sub, hold for the main".** A tap is only known on release, and Gulp is a parry: a verb that is a parry cannot wait
  0.25 real s for the key to come up. So the two mains' own R moves leave R:
  - the psygun's quick taps (`gunmoves.js:53`);
  - the pick's Dreamquake (`pick.js:59`).
  Where they go is yours to rule. My lean: the quick taps to MMB while the psygun is the main; the Dreamquake to the pick's charged LMB. The
  cutlass's Tidecutter retires into RMB's specials, as your audit says.

**The Box's data** (`pneuka/box.js`, 315 lines).
- **The five tools not worn leave the 56 slots.** They are always owned, so they sit on the loadout's shelf, not in the pocket (every mockup
  shows them apart anyway). `tool.<id>` items stop existing, `reconcile()` keeps "every tool somewhere" as "seven tools, two worn", and five
  pocket slots come back.
- **The two box calls become one:** `wear(slot)` and `takeOff(tool)` become `equip(id, as)`; a psygun's variant stays `carryPsygun`.
- **`FITTINGS` and `box.fit` are unchanged.** What is fitted to a tool is kept as now. Only the window shows it on the tool (the glossary's rule
  stands: a fitting is the Box's, never the tool's own inventory).
- **The bank:**
  - `bankOpen` stays "the Veritome held open" when the Veritome is the main.
  - It also opens at a Shrine: a row THE BANK on the Shrine's page opens the Box and the Book together. The Shrine is mine (`world/shrines.js`);
    I wire that row.

**The save.**
- `kit.belt` changes from a Set of worn ids to `{ main, sub }`: `kit` version 2.
- `migrate` maps an old Set to main and sub by TOOL_IDS' order (the first two worn) and drops `tool.<id>` items from the slots.
- `kit` is player scope, so a new build wipes it anyway. The migrate is for a save carried within one build, and is cheap.

**What `pneuka/ui.js` (305 lines) becomes** depends on the pick. In every case:
- its equipment pane (the five places) goes;
- the pocket (the 56 slots, the hover line, left and right click, drag, drop) is kept whole;
- the module splits if the new window passes the 800-line contract: `pneuka/ui.js` the window, `pneuka/loadout.js` the loadout's part.

## 2. The keys

- **X** draws and stows the main.
- **R** is the sub's verb, on press.
- **Q, G, J, K, U and I** come free, and stay empty this round, as you propose. None has another reader on foot: G and K are read only by
  the Soul Brush and the Dreamvane, and the Index's room keys are read only in its own window.
- **The bank:** J's job goes, because the Veritome is often not worn. The bank is at a Shrine, and the Veritome as main still opens it with
  its own open.
- **R's other readers** are all mode-bound and never meet a tool: the garden hand's turn, a fix at sea, a puzzle duel's rotate.

## 3. The cost of each concept at the gate

**The function above is common to all three:**
- belt.js rewritten (about 150 lines);
- seven tool files lose their draw keys and gain `lend()` (about 20 to 40 lines each);
- box.js's tool items and save;
- the Shrine's row;
- one gesture clip per sub verb (Calissa's);
- a stress test, since the change touches the core of the tools.

That is the bulk of the work whichever look is picked.

**A. The spread:**
- the cheapest;
- a page set aside, built from choice cards and the house deck's Major Arcana faces (already in `bazaarAtlas`: no new art for the cards);
- no new programs: DOM and a canvas, as the index window is;
- the risk is only taste.

**B. The attaché case:**
- the dearest, and against a ruling (the owner's 56 slots, one thing to a slot);
- it rewrites the Box's storage model (shapes, rotation, fit), every `add()` caller (pick-ups, chests, the haul, the debug chests) and the save;
- my no, unless the owner reopens the 56.

**C. The Jar's interior:**
- the most novel and the dearest of the two that fit the rules;
- the overlay scene carries 56 slots as instanced quads with pixel-art icons at 1x;
- a world-space pick under the cursor, the wheel turning a ring, time slowed rather than paused (so a fight goes on around the window: the
  swap refusal must hold there);
- new programs and draws while it is open, to be measured with `npm run perf`;
- the pocket as a ring is the read problem you name.

**My lean:**
- A's spread for the loadout;
- the pocket as A's flat tray;
- one thing from C: the window opens with the Courier holding up the main and the sub in the world, beside the page set aside.

That is the cohesion and most of C's charm for A's cost. The look is Calissa's call.

## 4. Who builds what

This is bigger than K1: the belt, the input, the save and seven tools are the core of play. So I take the function, and you take the window
and the rules.

**Petra:**
- belt.js as above;
- the keys out of the tools;
- each tool's `lend()`;
- box.js's data and save;
- the Shrine's THE BANK row;
- a stress test and a sweep of the workshop, the room the Box is used in most.

**Dovina:**
- `pneuka/ui.js` and `pneuka/loadout.js` (the window, on Calissa's look);
- `progress/toolpairs.js`, the swap rule (`mayEquip`'s answer) and a pair's special's state;
- the words, as placeholders for Espada's.

**The seam between us:** the window calls `belt.equip(id, as)`, `belt.mayEquip(id)`, `belt.main`, `belt.sub`, `belt.pair`, `box.fitted(socket)`,
and the pocket's calls as today. I build the belt's half first and tell you when its calls stand.

**Pruning, my files** (your audit's list; Calissa's first where her readout must come before mine goes):
- `#charge` and `feedback/hud.js:44`: removed once Calissa's four variants carry their own charge readout.
- `#reloadbar`: removed (the cylinder's reload beats own it).
- `Hud.update`'s dead parameters and the dead `hud.el.cross` guards (godhand.js, realm.js, skiff.js).
- `#course` in `world/emocean/stage.js` and the empty `#locks` div.
- `rules.digits` (with the belt).
- Stale comments in main.js.
- The pot-smash trial's `#trial` panel: its rest goes the way of `CountRings`.

`vfx/cinema.js`'s `#crosshair` and `vfx/hudring.js`'s comment are Calissa's.

Delete this note when done.
