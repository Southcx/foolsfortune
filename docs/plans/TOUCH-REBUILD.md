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
| **F** (the arc's far end, ringed) | the meter | R2 | ART (the class art or the rung on G) | ART | (none) | BOOST (a banked flare) | SURGE | MOUNT |

- **A slot with no verb in a context is not drawn** (never a dead tile). The layout reads the mode's mask: the Arena's `MASKED` keys
  hide their slots.
- A slot's place never changes, so a thumb learns six positions once.
- CROUCH is not in the arc: **the stick pushed down past its ring, held**, crouches (and prone after 0.6 s), as a pad's stick-click
  would. That frees a slot and puts CROUCH where the slide already is: the stick.

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

So the busiest screen goes from 19 tiles to 6 arc slots + PICK + BELT + the top bar's 3: **11, all of them live.**

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
| foot, nothing drawn | USE / KICK | DASH / BLINK | JUMP | (none) | PARRY | ART | PICK hidden; BELT |
| a tool drawn | the tool's LMB | DASH / BLINK (air too) | JUMP | the tool's RMB, directional | PARRY | ART | PICK, BELT |
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

## 6. Open for South

1. **Crouch on the stick** (down past the ring, held) instead of a tile. It frees a slot and matches the slide, but it is less
   discoverable. My call: yes, with the first path teaching it once.
2. **The meter slot F** for the class art and the rungs. Zenless and Genshin put the ultimate at the arc's top, the slot the eye meets
   first. My call: keep it at the far end, ringed, because a rung is used less than a special.
3. **One layout per context, or one for all.** My call: one skeleton for all, with the editor's per-context offsets on top.
