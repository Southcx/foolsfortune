# The touch UI, rebuilt from the ground (a plan, Dovina's, with Calissa's look to come)

South, 2026-11-01: "could you please come up with a plan for a better mobile UI with Calissa? I'm wondering if we're truly using the
correct layout or buttons considering how the melee/combat/platforming modules have evolved. In general if you were to rebuild the UI
from scratch, how would you do so now that you have exposure to most of the systems?"

This plan replaces MOBILE.md's sections 4.1.4 and 8.8 to 8.10 (the cluster, the shelves and the tool rows) once South rules it. The rest of
MOBILE.md stands: the zones, the safe area, the one save, the input actions and the bindings table. The audit it stands on was done on
2026-11-01 from the code, not from play (the facts are in section 1).

## 1. What is wrong today (the audit)

The touch UI grew one system at a time, and it shows. The numbers below are read from `src/ui/touch/` and `core/bindings.js`.

1. **No two contexts agree where a verb lives.**
   - JUMP has three homes (the cluster's main tile, the near shelf, the cluster's third slot), and the 80 px main tile is JUMP on foot
     but FIRE with a tool drawn.
   - CROUCH and DASH move shelf when a tool comes out.
   - USE has three homes.
   - Lock has three paths.
   - A thumb can't learn the screen, because the screen keeps changing under it.
2. **The newest modules have no touch path at all.**
   - **The Arena:** bare hands have no jab, tilt, smash, special or grab (LMB and RMB exist only as a drawn tool's tiles). Smash is a
     double flick of a key with no touch form. Shield on the ground is unreachable once Blink is learned. CROUCH, PARRY, DRAW, SWAP,
     ART and BLINK show there but are masked, so they are dead tiles.
   - **The Well's stages:** the jar throw (LMB held bare-handed), the script line (RMB held) and the troupe's jobs (keys 1 to 6).
   - **The crossing:** FIRE, LOCK, ROLL, FORM, SURGE, BOOST and BRAKE have bindings and no tiles.
   - **The jelly mount** can never be chosen: the SKIFF tile taps Y for 60 ms, and the choice needs Y held 0.35 s.
   - **Blink** in the air or crouched has no tile.
3. **Too many tiles.** The worst screen (foot, the Crucibelle drawn, a sub and a class art worn) shows 19. The Spirit Garden shows 20.
4. **Gestures that cost time.**
   - The cutlass's special fires on the finger's lift, so the press's hold is added to every special and every paid cut.
   - The long press is 420 ms in one place and 650 ms in another.
   - There are three ways to fold (MENU, MORE, the ⋯ tile).

## 2. The prior art (what the best action games on a phone agree on)

| game | what to take |
|---|---|
| **Genshin Impact, Wuthering Waves, Zenless Zone Zero** | Attack is the biggest button, in the corner under the right thumb. The other verbs sit in a fixed **arc** round it (dodge, jump, skill, ultimate), and the arc never moves. A context relabels a button; it never moves one. ZZZ's arc is attack, dodge, special, ultimate: an action game's four verbs on four fixed places. |
| **Brawlhalla (mobile), Smash-likes** | **A press reads the stick's direction at the moment it lands.** Neutral, side, up and down attack or special are one button and the stick. This is exactly the Arena's tilts and specials, and the melee loadout's "RMB tapped, with W, with S". |
| **Brawl Stars, Wild Rift, Pokemon Unite** | A skill button **dragged** aims (a line or a cone on the ground); tapped, it fires at the auto-target. The lock-on is the default, and the drag is the skill. |
| **Diablo Immortal, Monster Hunter Now** | Skills arc round attack with their cooldown on the rim. A held meter skill (the ultimate) glows when full. |
| **Call of Duty Mobile, Fortnite** | The HUD editor moves, sizes and **hides** any button. Layouts save per mode. |
| **Sky: Children of the Light** | Most verbs are contextual on one button: the world says what it does. Our USE already is. |
| **Every gamepad** | Six face and shoulder buttons cover a whole action game. The bindings table already gives every input action a pad button. **If the touch skeleton is the pad, a pad on the phone and the touch screen are one mental model, and help text says the same thing for both.** |

## 3. The rebuild: one skeleton, relabelled, never rearranged

### 3.1 The arc (the right thumb)

Six slots in a fixed arc round the corner, in the same places in every action context. Each slot is a *kind* of verb, and a context
only renames it:

| slot | kind of verb | the pad's button | on foot | a tool drawn | the Arena | the Solar Skiff | the crossing | the helm |
|---|---|---|---|---|---|---|---|---|
| **A** (the corner, biggest, 88 px) | the primary verb | X / Square | USE (or the kick once learned) | FIRE (the tool's LMB) | ATTACK | FLARE | FIRE (held: auto) | GUN |
| **B** (left of A) | evade | B / Circle | DASH (BLINK once learned) | DASH | SHIELD (held), dodge with the stick | BRAKE | ROLL | THROTTLE |
| **C** (above A) | vertical | A / Cross | JUMP | JUMP | JUMP | HOP | FORM (Astral, Umbral) | (none) |
| **D** (the arc's top) | the secondary verb | Y / Triangle | (none) | the tool's RMB (AIM, SPECIAL, the lens) | SPECIAL | NOSE (in the air) | LOCK (tap: the nearest) | BROADSIDE |
| **E** (the arc's left end) | defend | R1 | PARRY (once learned) | PARRY | GRAB | TAIL (in the air) | PARRY | PARRY (the spit) |
| **F** (the top of the fold's column, ringed) | the meter | R2 | ART (the class art or the rung on G) | ART | (none) | BOOST (a banked flare) | SURGE | MOUNT |

- **A slot with no verb in a context is not drawn** (never a dead tile). The layout reads the mode's mask: the Arena's `MASKED` keys
  hide their slots.
- A slot's place never changes, so a thumb learns six positions once.
- **CROUCH depends on the mode** (South's ruling 1, below).
  - **In a side-on mode** (the Well's stages, the Arena), crouch is the stick pushed down past its ring, as a fighter's down is, and
    has no tile.
  - **In a 3D mode**, CROUCH is a tile, **G**: a small one (60 px) on the arc's inner end beside B, pressed for the posture's cycle
    and held for the slide, as today. G is drawn only in 3D, so a side-on mode shows six slots and a 3D one seven.

### 3.1.1 The geometry (the grid: South, 2026-11-02; the placement drawn in `docs/ref/touch-rebuild/grid-placement.jpg`)

**The arc is a grid** (South, 2026-11-02: "the tiles need equal padding or else it looks awful"). Calissa's first geometry put the
tiles on two rings round A. Tiles of three sizes on circles leave gaps of every width between neighbours, and the eye reads that as
mess. So every tile sits on one grid with one gutter, the way a keyboard or a tile wall does.

- **The cell** is 48 px, **the gutter** 8 px (a 56 px pitch). The safe area's edges sit two gutters (16 px) off.
- **A** takes 2 x 2 cells (104 px), so the gap round it is the gutter too. Every other tile is one cell.
- **A 48 px tile** is above the 44 px least a thumb hits cleanly (Apple's HIG).

Cells are counted from A's corner: the column from the right, the row from the bottom. At 896 x 414:

| slot | cell | box (x, y, w, h) | from A's centre |
|---|---|---|---|
| A | columns 0-1, rows 0-1 | 776, 294, 104, 104 | |
| C (vertical) | 0, 2 | 832, 238, 48, 48 | 88 px |
| D (secondary) | 1, 2 | 776, 238, 48, 48 | 88 px |
| B (evade) | 2, 0 | 720, 350, 48, 48 | 88 px |
| G CROUCH (3D only) | 2, 1 | 720, 294, 48, 48 | 88 px |
| E (defend) | 2, 2 | 720, 238, 48, 48 | 119 px |
| F (the meter): the fold's top | 3, 2 | 664, 238, 48, 48 | 163 px |
| PICK | 3, 1 | 664, 294, 48, 48 | 143 px |
| BELT | 3, 0 | 664, 350, 48, 48 | 143 px |

- **The whole block** is 216 x 160 px. It never reaches left of x 664: 53 px into the centre 60%, at its lower-right corner only.
  The rings reached x 588.
- **What a fight presses** (A, B, C, D, E, G) is the 3 x 3 block round A, everything within 119 px of its centre. The deliberate
  presses (F, PICK, BELT) are the column beyond it, the arc's fold (section 7).
- **An empty cell stays empty.** A slot with no verb is not drawn (G in a side-on mode, E before parry is learned), and nothing moves
  up to fill its cell. A thumb learns cells, not neighbours.
- **A directional slot** wears four small gold chevrons on its rim.
- **The stick, side-on:** in a side-on mode the stick's ring carries a gold notch for crouch, labelled until the first path has taught
  it.
- **The rings' history:** F went to the far end (ruling 2, section 6), then second from the fold's root (ruling 4). The grid puts it on
  top of the fold, always showing (section 7).

### 3.2 A press reads the stick (directional presses)

Every arc button reads the stick's direction **at the moment it lands** (Brawlhalla's rule). Neutral, toward, up, down and away are
five verbs on one button:
- **The Arena:** A with the stick is a jab and the four tilts; A with **the stick flicked** (pushed past 70% within 80 ms) is a smash
  (a pad's smash stick). D with the stick is the five specials, back special included. This fills the Arena's whole kit (FIGHTER.md 9's
  ten slots) with no extra tile.
- **The melee loadout:** "RMB tapped, with W, with S" becomes D neutral, D up, D down, fired **on the press**, not the lift. That
  removes the cutlass's swipe and its latency, and the paid cut becomes a press like any other.
- **The side-on stages:** A held with no tool is the jar throw. D held is the script line. The stick is the stage's own axis.
- Each tool keeps its own meaning. A is the shot, the blow, the paint or the toll. D is the tool's second verb.

### 3.3 Drag a slot to aim (Brawl Stars' rule)

A and D can be **dragged** from where they landed. The drag is the aim (the stick-on-the-button), and the lift lets it go. A tap fires
at the lock-on target, or straight ahead.
- This keeps today's FIRE and AIM drag. It extends it to the hook's bite, the Bombardier's lob (its arc mark already drawn) and the
  carry's throw.
- Celestial mode's paper stays a held D that hands the screen to the brush (`screenTaken()`).

### 3.4 One pick button and one belt button (radials, not shelves)

Today's far shelf (up to 10 tiles) collapses into two buttons beside the arc, both on the same rule. **Tap is the next one; hold
(400 ms) is a radial under the thumb; let go on a choice.**
- **PICK**: the tool's picks. The psygun's chambers, the Sondelass's forms, the brush's PAINT and MOP, the lure ring, the
  Crucibelle's five notes, the Lockheart's wheel. Each is a radial of its own, with the choices as the desk's slot row draws them.
  The Crucibelle's notes stay pads on its radial, held open while it is played.
- **BELT**: tap DRAW or STOW. Hold for a radial of SWAP (the main and sub), LEND (the sub's verb), the mounts (the Solar Skiff and
  the slip jelly: this fixes the jelly mount) and the class art to wear.

So the busiest screen goes from 19 tiles to 7 arc slots (CROUCH included, in 3D) + PICK + BELT + the top bar's 3: **12, all of them live.**

### 3.5 The left thumb, the look area, the edges

- **The stick:** where the thumb lands in the move area, as today. Past its ring it sprints, or carves on the Solar Skiff. Down and
  held is crouch.
- **The look area:**
  - a drag is the camera;
  - a **double tap** is USE on the thing drawn there, else the lock-on (today's);
  - a **flick** is the context's sideways verb (the Solar Skiff's shoulder, today's);
  - a two-finger tap is **undo** wherever there is one (the garden, the duel, the god hand), one gesture everywhere.
- **The top edge:** the top bar (MENU, LOG, PAUSE), the one fold.
- **The bottom band:** the tool's own UI in a glance (the cylinder, the guard, the desk), as MOBILE.md 4.1 ruled.
- **The corners:** the Lachrimeter and the Sight, as now.
- The log's ticker gets a 44 px tap target (it is 24 px today).

### 3.6 The board modes keep their own screens

The puzzle duel, the rhythm mode, Raku's tables, the god hand and the Spirit Garden are not action contexts: they are a whole screen
of one thing. They keep their built layouts (MOBILE.md 8.2 to 8.7). Only these change:
- the two-finger undo;
- the one long press (400 ms everywhere, FLEE's hold included: a hold that loses something stays confirmed by its own ring);
- the god strip's domains as an arc on the right edge, the same arc as section 3.1, so the hand's seven domains sit where the thumb
  already looks.

### 3.7 The rules that make it one system

1. **A verb's kind has one place.** A context renames a slot and never moves it.
2. **Never a dead tile.** What a mode masks is not drawn.
3. **One hold:** 400 ms. One fold. One undo gesture.
4. **A press reads the stick at once.** No verb waits on the finger's lift, except a drag's aim.
5. **The touch skeleton is the pad.** Each slot is a pad button (bindings `pad`). The help, the device's words and a connected
   controller on the phone all say the same thing.
6. **The layout editor moves, sizes and hides anything,** and keeps a layout per context (Call of Duty Mobile's). The left-handed
   mirror is one switch.
7. **Haptics where the platform allows** (Android's `navigator.vibrate`): a parry's window, a grade struck, a drop picked up. A sound
   always goes with it, as the second avenue.

## 4. Each module's context, under the skeleton

| context | A | B | C | D | E | F | other |
|---|---|---|---|---|---|---|---|
| foot, nothing drawn | USE / KICK | DASH / BLINK | JUMP | (none) | PARRY | ART | G: CROUCH; PICK hidden; BELT |
| a tool drawn | the tool's LMB | DASH / BLINK (air too) | JUMP | the tool's RMB, directional | PARRY | ART | G: CROUCH; PICK, BELT |
| carrying | THROW (drag aims) | DASH | JUMP | PUT DOWN | (none) | (none) | |
| the Arena | ATTACK (tilts, smash by flick) | SHIELD (dodge by stick) | JUMP | SPECIAL (five by stick) | GRAB | (none) | BELT (the kit by the hand) |
| a side-on stage | the stage's own (throw, swing) | DASH | JUMP | the stage's held verb (script) | PARRY | (none) | the troupe's jobs on PICK |
| the Solar Skiff | FLARE | BRAKE | HOP | NOSE (air) | TAIL (air) | BOOST | the flick is the shoulder; gyro |
| the jelly mount | (its burst) | DASH | HOP | (none) | (none) | (none) | BELT's mounts radial |
| the crossing | FIRE (held: auto) | ROLL | FORM | LOCK (the sweep stays the look area's) | PARRY | SURGE | the stick: BOOST and BRAKE by pushing forward and back |
| the helm | GUN | THROTTLE (stick forward and back as well) | (none) | BROADSIDE | PARRY | MOUNT (radial: 1 and 2) | USE by double tap |

The crossing and the jelly mount get their first working touch from this table. So does the Arena's whole kit.

## 5. Who builds what (when South says go)

1. **Dovina:** this plan and its rules. The slot table becomes data (`TOUCH_ARC`, one row per context, beside `ACTIONS` in
   `core/bindings.js` or its own `progress/toucharc.js`), the directional-press rule, the masks, the sweeps' touch checks.
2. **Calissa** (the look, `src/ui/touch/`):
   - the arc's tiles in the Clay dress, sized by slot;
   - PICK's and BELT's radials;
   - the stick's crouch notch;
   - mock-ups at 896 x 414 of three contexts (foot, a tool drawn, the Arena) before anything is built: the layout is judged in a
     picture first.
3. **Petra** (the touch driver, `core/touch*.js`):
   - the press reading the stick at landing;
   - the stick flick;
   - the hold at 400 ms;
   - the two-finger undo;
   - the per-context layout keep;
   - the gate: no dead tile, measured.
4. **Espada:** the slot labels where a genre word isn't obvious.
5. **Order:** foot and a tool drawn first (the most played), then the Arena and the side-on stages (the most broken), then the
   crossing, the Solar Skiff and the helm. South plays each on the phone before the next.

## 6. Ruled (South, 2026-11-01)

1. **Crouch on the stick:** "Depends on the mode, yes for 2d, no for 3d movement." So it is the stick's down in a side-on mode, and
   the G tile in 3D (section 3.1).
2. **The meter slot F:** "Use your best judgment." It went to the arc's far end, ringed, its meter on the rim (moved second from the root by the fold, section 7). A rung or a class art
   is pressed less often than a special, so the slot the eye meets first (the arc's top) goes to D, the tool's second verb. F glows
   when ready, as the ultimates of Genshin and Zenless do, so it is found without being in the way.
3. **One layout or many:** "You got it". One skeleton for every action mode, with the layout editor's per-context offsets on top.

4. **The plan whole, and the reach** (2026-11-01): "yes to the touch rebuild, but i'm not a fan of how far the tertiary action tiles
   reach out across the screen. If UI *has* to be that intrusive, then we need a 'hide all Touch UI' setting or button, or a collapse
   option ... I liked the old square tiles. You know that clacking wood toy that is popular in mexico and folds up into a stack of
   tiles. Use that thing for inspiration." So: square tiles, the outer ring folds (section 7), and a setting and a tile hide them all.
5. **Equal padding** (2026-11-02, on Calissa's square-tile mock-ups): "Its better but the tiles need equal padding or else it looks
   awful." So the rings became one grid with one gutter (3.1.1). Parry joined the block round A, and the fold became one column.

## 7. The arc's fold (South's ruling 4)

**Prior art.** The Jacob's ladder: in Mexico, the tablitas. It is six or so wooden blocks joined by crossed ribbons. Tip the top
block and each one flips over the next, clacking down the chain; tip it back and they fold into one stack. Also Breath of the Wild's
Pro HUD (the HUD stripped, the world kept), and the auto-hiding HUDs of console action games (shown in a fight, gone outside it).
What is taken: the chain, the flip one tile after another, the clack, and the stack you can hold. The origami is the motion's
feel; the square wooden tile is the shape.

**The tiles are square** (the old ones: today's glazed clay `TouchTile`, slightly rounded corners). The circles of the mock-ups go.
Sizes and places stay as in 3.1.1.

**The fold is one column** of three tiles hinged edge to edge: F on top, then PICK, then BELT, hanging down the grid's fourth
column (3.1.1), as the toy hangs from the block in your hand.

| state | what is out | its left edge at 896 x 414 |
|---|---|---|
| **folded**, the default | F alone, the top of a stack: PICK and BELT folded on its back, their edges stepped on its rim | x 664 |
| **open** | F, PICK and BELT down the column | x 664: the fold opens downward, never further in |

- **A tap on the stack is F** (the art, the boost, the surge, the mount), so the meter is one tap in a fight, folded or not. With its
  meter empty it refuses, as an open F would.
- **A pull opens it.** A swipe down off the stack, the toy's own motion, cascades PICK and BELT out below it. Where F has no verb (the
  Arena), PICK is the stack's face and a tap opens it.
- **The cascade.** Each tile flips over the last, about 60 ms a flip, with a clack as it lands. Folding is the same run reversed, a
  little faster, and the clacks are lighter.
- **When it folds back.** After a pick or a belt choice. Or 3 real s with no press on the column.
- **A press while it moves** lands on a tile only once the tile has landed.
- **Parry is no longer in the fold.** It sits in the block round A (cell 2, 2), with what a fight presses over and over. Fights no
  longer open anything.
- **The block round A never folds** except by the top bar's fold tile (below). A slot's place never changes (3.7).

**The touch controls' setting** (a settings row; Espada's label, these are placeholders):
- **FOLDED**, the default: the table above.
- **SHOWN**: the fold's column always open.
- **HIDDEN**: no tile is drawn, the stick's ring is not drawn (the stick still works where a thumb lands), and the look area, taps
  and double taps still work. One faint tile stays at the top bar's right end to bring them back.

**The top bar's fold tile.** One tile on the top bar folds every tile into one stack at A's corner, the block round A and A as well.
The top bar folds already, and the log folds with its tab (`log.fold`), so this is the same gesture. Tapping the stack cascades
everything back out: A first, then the block round A, then the fold's column, folded. While
this is folded, a live fight opening does not unfold it. You folded it, so it stays folded until you open it.

**Two avenues.** The fold's state is seen in the stack and heard in the clack. Nothing of it goes to the log: it is a control, not
a happening.

**Kept.** Whether the fold's column is open is not saved: it folds itself back. The top bar's fold and the setting are kept in
the settings scope, beside the touch layout (`touchLayout`).

**What it replaces.** The far shelf's ⋯ tile ("the fold" in today's glossary) goes with the far shelf when the rebuild lands
(PICK and BELT replace it). Until then the new one is always called "the arc's fold" in full.

**Who builds it**, after section 5's first pass:
- **Calissa:** the tiles on the grid (3.1.1), in the square glazed clay, the stack's stepped rim, and the ribbons shown only while a tile
  flips. Her square-tile mock-ups (claude/calissa-art-cups dd20b3c) are on the rings: the grid's placements replace them.
- **Wanda:** the clack. It is wood or clay on clay, one per tile, pitched by the tile's size. Folding is lighter. It must stay
  inside the phone mixer's burst cap.
- **Petra:** the grid's placement from cells (one cell size, one gutter, A spanning four), the stack's tap and pull, a press landing
  only on a landed tile, the setting's row, and the top bar's tile.
- **Dovina:** the cells and the fold's column as data: done, `src/progress/toucharc.js` (`ARC_GRID`, `ARC_CELLS`, `ARC_FOLD`,
  `TOUCH_ARC` a context's slots as input action ids, `arcRect`, `arcOf`, `foldOf`).
