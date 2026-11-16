# The Sondelass's melee, revamped for feel (a plan; nothing here is built)

South, 2026-11-16: "drastically improve the feel of combat, making it snappy, responsive, flowing, and visually striking. The single
most important design aspect is 'elegance'." And 2026-11-15, on the stepped key poses we reverted: holding extreme poses was meant as
"more advanced animation techniques ... to give extra impact to melee combo hits, outside of hitstop (which oftentimes was applied too
liberally)". Desktop only. Calissa keeps this plan; the builders are Opus, one piece each, one headless look each.

Reference collated by three Haiku agents, every claim with its source and its confidence marked: `docs/ref/combat/MELEE.md`,
`DEVIL-MAY-CRY.md`, `MUSOU.md`. No Devil May Cry or musou frame number could be sourced, so none is used below; Melee's are from SmashWiki.

## 1. What elegance means here (the one look)

**One unbroken line.** The blade's tip draws a single continuous curve through a whole string, and the body arrives a moment after
the blade. Everything below serves that sentence:

- the tip never stops dead, never jumps, and never retraces itself between two blows (the join);
- time is spent where the eye wants it: almost none before the cut, a long breath after it (the timing);
- the hit is felt on the thing struck, never as the whole world stuttering (the impact);
- a press is never lost and never waits on a flourish (the response).

Prior art for the sentence: Marth (short startup, the arc drawn only on the strike, end lag small beside his reach: MELEE.md 3, 5);
CEDEC 2026's "sketch the tip's arc first, then fit the steps and the weight shift to it", and "a master throws the blow first and
lets the body catch up" (MUSOU.md 5); Itsuno's "the first tenth of a second must read as the result" (DEVIL-MAY-CRY.md 3).

## 2. Where the cutlass stands today (measured from the code, 2026-11-16)

| What | Today | Why it reads wrong |
| --- | --- | --- |
| Hitstop | every blow slows the **whole world** to 0.07 for 0.05 to 0.15 real s, then eases back over 0.12 (`moveset.js` impact, `time.pulse`) | the stutter South named: the player's own motion and input freeze with it, on every light cut |
| Timing | a clip played start to end at one rate (1.1); the string's next blow opens at clip second 0.22 to 0.45 | the mocap's whole windup is played; the cut arrives late and leaves at the same speed |
| The join | the last pose faded into the next clip's frame 0 over 0.1 real s | frame 0 is a neutral ready pose, so the blade travels back to it between cuts: the line breaks |
| Cancels | fixed windows typed per clip; the same whether the blow landed or missed | a landed cut cannot flow on sooner; a whiff costs the same as a hit |
| Tracking | the facing and the step-in are taken once as a move begins | a target that moves during the windup is missed by a blow that looked right |
| The struck thing | only Strawman flinches; a light blow has no camera answer | impact is carried by the world's stutter alone |
| The pose hold | `character.hold` (the drawn pose held, the capsule not) exists and the sword never calls it | the right tool for a heavy blow's weight is sitting unused |
| Buffer | 0.35 s, one press | good; kept |
| Readouts | no table of a move's startup, active and recovery in frames | nobody can tune what nobody can read |

## 3. The six pieces

Each is data on a move's row plus one engine change, opt-in per row (casebook 210: a new option never moves the default), so the
string converts one move at a time and the old play stays for any row not yet converted.

### A. Frame data first: a move's phases, read and shown
Every move gets its **phases** in 60 Hz frames, measured from its clip by the swing measure we have (`tools/melee.js`): **startup**
(press to first active frame), **active**, **recovery**, and its **cancel frame** (Melee's IASA: the first frame anything may
interrupt it). A script prints the table (`scripts/sondelassframes.mjs`) and the Anim Lab draws the bar under a take.
*Targets, to be confirmed against the first table:* a light cut active within 6 frames of the press (Marth's Dancing Blade opens on
frame 6, his down tilt on 7: MELEE.md 1); cancel frame no later than 60% of the move; a finisher may take 12 to 14.

### B. The time warp: fast in, slow out, on the whole clip
In place of one rate, a move plays its clip through a **time warp**: a curve from move time to clip time, three numbers a row
(how much of the windup is skipped, how fast the rest of it runs, how far the follow-through is stretched). The clip stays whole and
interpolated; only its clock bends. This is the smooth form of "hold the extreme pose": the blade lingers at the end of its arc
because time there runs slow, not because a frame is frozen. It is also what makes a 6-frame startup possible on a mocap clip.
The hips' travel, the strike window and the ribbon all read the warped clock (casebook 184: a body and its windup keep one clock).

### C. The join: enter the next cut from where the blade is
A chained move no longer starts at its clip's frame 0. It enters at the frame of its windup whose blade-arm pose is **nearest the
pose now on screen** (searched once a pair at boot, cached), and blends over the frames A's table says it has. Where two clips cannot
meet inside a tenth of a second, the pair gets a typed entry frame. Two additive touches ride on top, both sprung and both small:
**drag** (the spine and the off arm lag the blade arm by a few frames, so the body arrives after the blade) and **overshoot** (the
wrist carries a few degrees past the clip's end pose and settles). Everything still passes through `rom.js` last.

### D. Cancels that answer a hit
The engine's windows become phase rules, read from A: a press in the startup or the active frames is buffered (kept: 0.35 s) and
taken at the cancel frame; **a blow that landed moves its cancel frame earlier** (the on-hit cancel: DEVIL-MAY-CRY.md "What to take" 2), so a string that is
connecting flows faster than one swung at air; the active frames are never skipped (DMC5's rule). The blink, the jump and the guard
may interrupt from the cancel frame for free; before it, the paid cut as today. A move tracks its target's bearing through its
startup (a capped turn rate), and stops turning when the blade goes live.

### E. Impact without the world's stutter
- **Normals stop slowing the world.** The time-scale pulse comes off light, heavy and launcher blows altogether.
- **The struck thing carries the hit:** victim-only hitlag (its pose held and shaken for a few frames, Melee's floor(d/3 + 3) scaled
  down for a crowd and capped: MELEE.md 2), a flinch on every creature kind (today only Strawman's), a flash in the damage type's colour.
- **The attacker's weight is a pose hold, and only on heavy things:** 2 to 3 frames of `character.hold` on a heavy blow, more on a
  finisher, none on a light cut. The capsule and the input never stop.
- **One true stop is kept, and earned:** a string's finisher that downs the last creature in reach, the stinger's first contact, a
  parry. Rare enough to mean something.
- The camera answers a light blow too (a fraction of a degree along the blade), and the smear frame, today a finisher's, is tried on
  the heavy class.

### F. The line, drawn
The ribbon is redrawn as the tip's true arc: on the active frames only (Marth's trail), thinning along its length, its colour the
damage type's, carried a little past the body on the follow-through (CEDEC's "the sweep carries past"). At a string's end, left
alone, the Courier settles through the unused `Sond_Flourish` back to the stance; any press cuts it at once. `Sond_Draw` and
`Sond_Sheathe` (unused today) replace the draw's and stow's generic fade.

## 4. Order of work

| Step | Builder (Opus) | Touches | Done when |
| --- | --- | --- | --- |
| 0 | frame table and the Anim Lab's phase bar | a new script, `workbench/` | the table of all 14 engine moves and 32 catalogue rows is printed, and today's numbers are written into this plan |
| 1 | E: impact | `moveset.js` impact, `vfx/blowfeel.js`, creatures' flinch | no world slow on a normal; a struck slip jelly and Lantern Wisp visibly flinch; before and after clips |
| 2 | B + D on the default string (c1 to c4) | `moveset.js`, `sondelassloadout.js` | the four rows converted; the table shows the targets met; old rows untouched |
| 3 | C: the join, drag and overshoot | `moveset.js` pose, a new `courier/anim/` module | a contact sheet of every pair in the default string: the tip's path drawn as one curve |
| 4 | F: the ribbon, the settle, the draw | `vfx/`, `sondelass.js` | shots |
| 5 | the rest of the catalogue, the air string, the launcher, the specials | rows only | the table |

Steps 1 and 2 are what South will feel first; I would stop after 2 for a play before spending 3 to 5. Each step ends with
`npm run check`, `npm run build`, the stress test (it touches a shared service), and a short clip or contact sheet, on the desk.

## 5. What this touches outside Art, and who hears about it

- **Petra** owns `tools/moveset.js` and the hitstop. South has given leave to touch any system for this; the engine changes are
  opt-in per row and go through her gate as usual, with a note in `docs/handoffs/petra/` at each step.
- **Dovina's** rule rows (`progress/combat/moves.js`) hold each blow's time and power, and her rule that a normal stays within 15% of
  the string's 2.7 power a second. Faster cuts raise power a second; step 2 hands her the new times so the power is re-rated, not left.
- **Wanda's** `sfx.slash` and `sfx.cutHit` want the new contact frame; a victim's flinch wants a sound a kind.
- **The other six tools** share the engine. They are not converted by this plan, and are not changed by it (opt-in rows); the same
  pieces will fit them afterwards.

## 6. For South to rule

1. **The world's slow on a hit goes from every blow to three rare moments** (3E). This is the largest single change in feel and the
   one closest to what you said; I recommend it.
2. **The string may get faster than today's**, and Dovina re-rates the power to keep the fight's length. Recommended.
3. **No new clips.** Everything above is done on the clips in the suite (the Sond_ set, the unused draw, sheathe and flourish). If a
   pair of clips cannot be joined cleanly, I will bring it to you rather than author one.

## 7. Not verified

The frame targets in 3A are drawn from Melee's published numbers, not from our clips: step 0 measures ours, and a target our mocap
cannot reach will be said, with the nearest it can. Devil May Cry's and the musou games' cancel windows and hitstop lengths are not
published anywhere the agents could reach; where this plan follows them it follows the stated principle, not a number.
