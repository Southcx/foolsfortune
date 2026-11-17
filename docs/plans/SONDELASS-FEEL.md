# The Sondelass's melee, revamped for feel (a plan, approved 2026-11-16; steps 0 to 5 built)

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

## 6. Ruled by South, 2026-11-16 ("I concur with your assessment and recommendations. Execute as outlined!")

All three stand as recommended:

1. **The world's slow on a hit goes from every blow to three rare moments** (3E). This is the largest single change in feel and the
   one closest to what you said; I recommend it.
2. **The string may get faster than today's**, and Dovina re-rates the power to keep the fight's length. Recommended.
3. **No new clips.** Everything above is done on the clips in the suite (the Sond_ set, the unused draw, sheathe and flourish). If a
   pair of clips cannot be joined cleanly, I will bring it to you rather than author one.

## 7. Not verified

The frame targets in 3A are drawn from Melee's published numbers, not from our clips: step 0 measures ours, and a target our mocap
cannot reach will be said, with the nearest it can. Devil May Cry's and the musou games' cancel windows and hitstop lengths are not
published anywhere the agents could reach; where this plan follows them it follows the stated principle, not a number.

## 8. Today's frame data (measured 2026-11-16)

`node scripts/sondelassframes.mjs` (tools/movephases.js), in 60 Hz frames of game time from the move's begin. **startup** is the frames before the first active one (so a light cut "active on frame 6" is startup 5); **active** is the strike as melee.js measures it (the stretch where the tip moves at a third of its peak speed or more) or as typed; **cancel** is today's stand-in for the cancel frame: the later of the chain window's opening and the row's `time`, or on a string's last blow (c4, t2, j3, the dash, the charged slash) the free recovery cut's; "-" where nothing chains (a special, the counter, the plunge, whose landing starts its clock). Nothing was changed.

| id | label | clip | kind | body | startup | active | recovery | total | cancel | cancel / total | lunge | power | weight |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| c1 | Slash | Sond_Combo1 | ground | upper | 3 | 12 | 31 | 46 | 25 | 54% | 3.2 | 1.2 | light |
| c2 | Rising Slash | Sond_Combo2 | ground | upper | 9 | 8 | 32 | 49 | 28 | 57% | 3.2 | 1.3 | light |
| c3 | Hop Slash | Sond_Combo3 | ground | upper | 22 | 4 | 31 | 57 | 30 | 53% | 3.6 | 1.4 | light |
| c4 | Leap Strike | Sond_Combo4 | ground | whole | 20 | 5 | 77 | 102 | 47 | 46% | - | 2 | finisher |
| quickSlash | Quick Slash | swordA | ground | upper | 10 | 9 | 7 | 26 | 20 | 77% | 3 | 1 | light |
| backhand | Backhand | swordB | ground | upper | 12 | 7 | 13 | 32 | 23 | 72% | 3 | 1.1 | light |
| lungeSlash | Lunge Slash | meleeHook | ground | whole | 16 | 2 | 13 | 31 | 30 | 97% | - | 1.4 | heavy |
| heavyChop | Heavy Chop | swordC | ground | whole | 30 | 5 | 38 | 73 | 55 | 75% | - | 2.4 | finisher |
| guardBreak | Guard Break | Fist_Shove | ground | whole | 7 | 4 | 35 | 46 | 25 | 54% | - | 1.1 | heavy |
| pushKick | Push Kick | Fist_Kick | ground | whole | 22 | 12 | 23 | 57 | 36 | 63% | - | 1.45 | heavy |
| lowSweep | Low Sweep | swordHeavy | ground | whole | 20 | 10 | 27 | 57 | 33 | 58% | - | 1.35 | heavy |
| bodyBlow | Body Blow | Fist_Combo1 | ground | upper | 3 | 6 | 22 | 31 | 18 | 58% | 2.2 | 0.9 | light |
| frontKick | Front Kick | Cmu_FrontKick | ground | whole | 25 | 9 | 26 | 60 | 35 | 58% | - | 1.45 | heavy |
| roundKick | Roundhouse | Cmu_RoundKick | ground | whole | 19 | 11 | 27 | 57 | 31 | 54% | - | 1.35 | heavy |
| sideKick | Side Kick | Cmu_SideKick | ground | whole | 19 | 10 | 28 | 57 | 30 | 53% | - | 1.3 | heavy |
| kneeStrike | Knee | Cmu_KneeStrike | ground | whole | 22 | 8 | 23 | 53 | 31 | 58% | 1.5 | 1.35 | heavy |
| lowKick | Low Kick | Cmu_LowKick | ground | whole | 28 | 10 | 22 | 60 | 38 | 63% | 1.5 | 1.6 | heavy |
| straightPunch | Straight | Cmu_StraightPunch | ground | whole | 22 | 8 | 25 | 55 | 31 | 56% | - | 1.35 | light |
| hookPunch | Hook | Cmu_Hook | ground | upper | 16 | 9 | 22 | 47 | 26 | 55% | 2 | 1.1 | light |
| stinger | Stinger | Sond_Thrust | special | whole | - | - | - | - | - | - | - | 3 | - |
| spinSlash | Spin Slash | Sond_SpinSlash | special | whole | 10 (hits on 11, 21, 31, 40) | 39 | 21 | 70 | - | - | - | 0.85 x4 | heavy |
| powerSlash | Power Slash | Sond_ChargeRelease | special | whole | 0 | 7 | 65 | 72 | - | - | - | 3 | finisher |
| risingCut | Rising Cut | Fist_Uppercut | special | whole | 14 | 7 | 33 | 54 | - | - | - | 2.3 | launcher |
| guardCrush | Guard Crush | Sond_Thrust | special | whole | 11 | 5 | 51 | 67 | - | - | - | 2.8 | heavy |
| backstepSlash | Backstep Slash | Sond_Combo3 | special | whole | 22 | 4 | 34 | 60 | - | - | - | 2.5 | heavy |
| flyingKick | Flying Kick | Cmu_FlyingKick | special | whole | 49 | 14 | 24 | 87 | - | - | - | 3.6 | finisher |
| tornadoKick | Tornado Kick | Cmu_TornadoKick | special | whole | 23 | 14 | 50 | 87 | - | - | - | 3.6 | finisher |
| spinHeelKick | Spinning Heel | Cmu_SpinHeelKick | special | whole | 55 | 16 | 22 | 93 | - | - | - | 3.8 | finisher |
| risingKick | Rising Kick | Cmu_RisingKick | special | whole | 32 | 10 | 24 | 66 | - | - | - | 2.7 | launcher |
| flurry | Flurry | Cmu_Flurry | special | whole | 22 (hits on 23, 33, 44) | 30 | 11 | 63 | - | - | - | 1 x3 | heavy |
| breakKick | Breaking Kick | Cmu_BreakKick | special | whole | 22 | 12 | 37 | 71 | - | - | - | 2.7 | heavy |
| tidecutter | Wave Cut | Sond_SpecialTidecutter | special | whole | 108 | 9 | 41 | 158 | - | - | - | 7 | finisher |
| t1 | Thrust (after 1) | Sond_Thrust | pause | upper | 9 | 4 | 31 | 44 | 24 | 55% | 4 | 1 | light |
| t2 | Thrust Combo (after 1) | Sond_ThrustCombo | pause | whole | 8 (hits on 9, 28, 37) | 34 | 52 | 94 | 54 | 57% | - | 0.9 x3 | heavy |
| j1 | Wide Arc 1 (after 2) | Sond_JrpgCombo1 | pause | upper | 20 | 6 | 26 | 52 | 29 | 56% | 2.6 | 1 | light |
| j2 | Wide Arc 2 (after 2) | Sond_JrpgCombo2 | pause | upper | 4 | 9 | 44 | 57 | 36 | 63% | 2.6 | 1 | light |
| j3 | Wide Arc 3 (after 2) | Sond_JrpgCombo3 | pause | whole | 32 | 9 | 53 | 94 | 54 | 57% | - | 2.6 | finisher |
| up | Launcher | Sond_Launcher | launcher | whole | 10 | 7 | 49 | 66 | 33 | 50% | - | 0.8 | launcher |
| a1 | Air Cut 1 | Sond_AirCombo1 | air | whole | 2 | 13 | 35 | 50 | 21 | 42% | - | 0.9 | light |
| a2 | Air Cut 2 | Sond_AirCombo2 | air | whole | 8 | 15 | 39 | 62 | 23 | 37% | - | 1 | heavy |
| a3 | Plunge | Sond_AirPlunge | air | whole | 3 | 9 | 54 | 66 | - | - | - | 2 | finisher |
| dash | Dash Slash | Sond_DashSlash | dash | whole | 14 | 7 | 69 | 90 | 30 | 33% | - | 1.6 | heavy |
| hold | Charge (held) | Sond_ChargeHold | charge-hold | upper | 68 | 12 | 0 | 80 | - | - | - | - | - |
| burst | Charged Slash | Sond_ChargeRelease | charge | whole | 0 | 7 | 91 | 98 | 78 | 80% | - | 4 | finisher |
| spin | Counter | Sond_SpinSlash | counter | whole | 12 (hits on 13, 24, 35, 46) | 45 | 45 | 102 | - | - | - | 0.8 x4 | heavy |
| iai | Draw Cut | Sond_Combo2 | iaido | upper | 0 | 4 | 25 | 29 | - | - | 4.5 | 1.1 | heavy |

- stinger: played by cutlass.js: a 16-frame lunge at 30 m/s
- a3: a plunge: its fall holds the clip at its hold until the ground, so its frames after the hold are the landing's, not the press's

What stands out against 3A's targets:

- **Active within 6 frames (a light cut):** c1 meets it on the measure (first active frame 4), but its measured strike is 12 frames long and starts in what reads as the windup, so the cut the eye sees lands later than the number says. c2 is 4 frames late (10), c3 17 late (23: its hop is the windup), j1 15 late (21); the catalogue's light cuts are 5 to 11 late (quickSlash 11, backhand 13, hookPunch 17). Only bodyBlow (4), j2 (5), t1 (10, 4 late) and a1 (3) are near.
- **Cancel frame by 60% of the move:** the default string meets it (54, 57, 53, 46%), but because Dovina's row `time` sets it (25, 28, 30, 47 frames: 0.42 to 0.78 real s), not the clip's chain window, which opens far sooner (c1 at frame 12): the time warp (3B) must move the rows' times with it, or the string cannot get faster. Far over: lungeSlash 97%, the charged slash 80%, quickSlash 77%, heavyChop 75%, backhand 72% (the split UAL swings have almost no recovery left after their window: they end where they cancel).
- **A finisher 12 to 14:** c4 starts its strike on frame 21 (7 to 9 late), heavyChop on 31 (17 late), j3 on 33; the specials' kicks are slower still (flyingKick 50, spinHeelKick 56), and the Wave Cut's strike is at frame 109 by design.
- **Recovery is the long part everywhere:** c1 to c3 spend 31 frames after their strike (two thirds of the move), c4 77; the dash 69, the charged slash 91. That is the follow-through the time warp is meant to keep but play slow, and the cancel frame cuts it short; today the join fades it.

## 9. Step 1 as built (Calissa's builder, 2026-11-16)

The cutlass's moveset is `impact: 'held'` (`tools/moveimpact.js`); every other tool keeps the pulse (casebook 210). One table a column:

| Weight class | World slowed | The Courier's pose held | Its shake | Victim's hitlag (share of Melee's) | Camera kick | Smear |
| --- | --- | --- | --- | --- | --- | --- |
| light | never | 0 | none | x0.6 | 0.15 deg | none |
| heavy | never | 2 frames | 1.2 cm | x0.75 | 0.45 deg | one frame, the blade's outer half, arc 0.65 rad |
| launcher | never | 2 frames | 1.2 cm | x0.7 | 0.4 deg | none |
| finisher | only when it downs the last hurtable creature within 8 m (x0.07 for 0.12 real s, eased over 0.16) | 4 frames | 2 cm | x1 | 0.8 deg | two frames, the whole blade, arc 1.1 rad (as before) |

The victim's frames: d = the move's power (Dovina's row) x 5, `round(floor(d / 3 + 3) x share)`, clamped 2 to 8 (60 Hz frames of game
time). So combo1 to combo3 (1.2 to 1.4) hold 3, combo4 (2.0) 6, the launcher (0.8) 3, heavyChop (2.4, heavy) 5, a full charge (4.0) 8.
The hold is the registry's (`creatures.hitlag`): a kind that honours it (`c.lags`: the slip jelly and the Lantern Wisp so far) holds its
body, mind, clip and attack with one factor (`lagK`), and its windup clock is held with it (casebook 184). The flinch and the flash on its
body are `vfx/hitflinch.js` (`FLINCH`): shaken along the cut through the hitlag, squashed 12% at the blow, knocked 9 cm back once let go,
lit in the damage type's colour for 0.14 real s; by weight x0.7 light .. x1.35 finisher. Kept as they were: the stinger's own pulse, the
parry's, and the first stun's beat (stun.js), which a light cut that stuns still sets off.

## 10. Step 2 as built (Calissa's builder, 2026-11-16)

The time warp (3B) and the cancel frame (3D) on the default string only, opt-in a row (`warp`, `cancel` on c1 .. c4's `play`,
`sondelass/sondelassloadout.js`; the rules `tools/movewarp.js`; the engine's hooks `tools/moveset.js`). Every other row plays as before:
`node scripts/sondelassframes.mjs` prints the other 42 rows identical to section 8.

| id | startup | active | recovery | total | cancel (whiff) | on-hit cancel | was: startup, active, recovery, total, cancel |
| --- | --- | --- | --- | --- | --- | --- | --- |
| c1 | 3 | 8 | 35 | 46 | 24 (52%) | 15 (33%) | 3, 12, 31, 46, 25 |
| c2 | 4 | 8 | 37 | 49 | 25 (51%) | 16 (33%) | 9, 8, 32, 49, 28 |
| c3 | 7 | 4 | 38 | 49 | 25 (51%) | 16 (33%) | 22, 4, 31, 57, 30 |
| c4 | 11 | 4 | 83 | 98 | 36 (37%) | 25 (26%) | 20, 5, 77, 102, 47 |

The rows (clip s for `skip`, rates in clip s a game s, `cancel` in game s from the press):

| id | skip | in | strike rate | out | back | cancel hit / whiff | typed strike |
| --- | --- | --- | --- | --- | --- | --- | --- |
| c1 | 0.04 | 2.4 | 1.1 | 0.5 | 1.9 | 0.25 / 0.40 | [0.15, 0.29] (the measured one, [0.058, 0.275], began in the backswing) |
| c2 | 0.03 | 2.2 | 1.1 | 0.5 | 1.9 | 0.27 / 0.42 | measured |
| c3 | 0.10 | 2.6 | 1.1 | 0.5 | 1.7 | 0.27 / 0.42 | measured |
| c4 | 0.10 | 1.35 | 1.0 | 0.55 | 1.6 | 0.42 / 0.60 | measured |

- **First active frame, as seen** (the contact sheet, `sf2/string-sheet.png` in the builder's scratchpad): c1's blade crosses the front on
  frame 5 to 6 (target 6 to 8: met); c2's rising cut on 6 to 7 (met); c3 on 8 to 9, its windup a whole turn of the blade whirled at
  2.6 times (the edge of the target: entering later than 0.1 s of clip lands mid-spin, the body turned away); c4 on 12 (target 12 to 14:
  met), but see below.
- **Press to press, on a slip jelly, pressed every 3 frames:** c1 to c2 16 frames, c2 to c3 17, c3 to c4 17 (the on-hit cancel and the
  press's grid), c4 to c1 22 (the paid cut: see below). A light cut left alone ends in its old length or less (46, 49, 49 from 57, 98
  from 102), its follow-through stretched (0.5 at the strike's end, back to 1.9 by the clip's end).
- **The cancels:** on a hit at a third of the move, on a whiff at half (c4 at a third); never before the strike's end plus a frame. A
  press in the startup or the strike is held for the cancel frame; the jump, the guard (held V) and the next blow take it free from there;
  the blink, as before, at any frame. A press in the recovery more than 0.07 s before the cancel frame is the paid cut, as today.
- **Tracking:** through the startup, 12 rad/s toward the lock or the magnet's pick; the step in turns with it.
- **The pause strings** open 0.25 to 0.8 real s after a move ends, as before; the moves end at about their old lengths, so their timing
  reads the same (t1 after c1, j1 after c2).
- **Dovina's rows**: combo1 .. combo4's `time` set to the on-hit cancels (0.25, 0.27, 0.27, 0.42 from 0.42, 0.46, 0.5, 0.78): the
  string's power a second is 4.9 from 2.7 until she re-rates it (`docs/handoffs/dovina/2026-11-16-from-calissa-sondelass-times.md`).

Rough, seen in the look and not fixed (one look, no tuning loop):
- **c4's hit lands with the blade still overhead.** Its measured strike starts at the top of the downswing (clip 0.333, the tip at its
  highest), so the creature takes the hit, and the finisher's 4-frame pose hold freezes the blade up in the air, before it has visibly
  come down. A typed strike for c4 nearer [0.36, 0.42] would put the contact and the hold where the blade meets the body (a step 3 or 5
  fix; it was so before the warp too).
- **Mashing pays.** Pressed every 3 frames, c4's recovery (its cancel 10 frames past its strike) takes a press as the paid cut, so a
  mashed string spends Lachryma and skips the finisher's follow-through; it did today as well (c1's recovery paid for 10 frames). A
  rule that keeps the paid cut for a deliberate press (a fresh press after a release in the recovery) is Petra's and Dovina's call.
- c3's 2.6x whirl is fast: read it in play; if it reads as a pop, enter at 0.06 and take a frame more.

## 11. Step 3 as built (Calissa's builder, 2026-11-17)

The join, drag and overshoot (3C) on the default string only, opt-in a row (`join` on c1 .. c4's `play`, `sondelass/sondelassloadout.js`;
the module `courier/anim/bladejoin.js`, `JOIN`; the engine's hooks in `tools/moveset.js`, still 799 lines; `warpOf` in `tools/movewarp.js`
takes an entry `at` in place of `skip`). Every other row and tool plays as before. All of it is laid on the move's pose before the
skeleton is posed: the hinges, the wrist ease and `rom.js` still come last.

- **The join.** A chained joined move (its row and the one before it both `join`) is entered at the windup frame whose blade arm is
  nearest the pose on screen: a feature table a clip (60 a clip second: the hand and the tip, 0.9 m along the forearm, in the body's frame
  with the hips' travel out, and the hand's turn), score = hand gap (m) + half the tip gap + 0.15 a radian of the hand's turn, divided by
  the fade frames the entry leaves (so a far frame with room to close may win), plus 0.04 a clip second off the row's own `skip`. Searched
  once a pair and a 2-frame bin of where the move before stood, kept. Never at or past the strike's start, and at least 1 frame of startup
  left (`lead`). The last pose shown is faded in over `clamp(startup frames - 1, 2, 6)` frames (the engine's `fadeDur`, was 0.1 s).
  A joined whole-body move (c4) takes it through its launch's `poseFix`, the hips' height faded with the rest (their ground place the
  launch's), and the tool's layer under it holds the last pose shown, so the launch never blends in over the stance. That also mends c4 to
  c1 fading in from c3's stale pose (a whole-body move never wrote `last` before).
- **Drag.** spine001 .. spine004, upper_armL, forearmL and handL each on a spring (6 Hz, damping 0.9: about 3 frames behind), laid over
  at 0.7 x a bone's share (0.5 .. 1), at most 9 degrees from the clip; the blade's upper arm is turned back by what the spine's lag
  turned its chain (spine001 .. spine003), so its arc is its clip's and the body arrives after it.
- **Overshoot.** handR on a looser spring (10 Hz, damping 0.35), at most 6 degrees from its clip: it trails into a cut and carries past
  where the cut stops, then settles. The springs start from the clip at a string's first move or any move not joined.

**The entries, and why three are typed.** No pair meets cleanly: these clips each start from the same ready pose and end their
follow-through far round the body (c1 with the blade behind the left shoulder, c2 overhead on the right, c3 behind the left again, c4
point down in front), so every pair's tip gap is 1 to 2.4 m, and the nearest frame by distance alone sends the blade back the way it
came. Where the search would retrace, the pair is typed to the windup frame on the same side, so the blade goes on round:

| pair | entered at (clip s) | how | tip gap | fade (frames) | tip's pace through the fade | press to strike (B / before) |
| --- | --- | --- | --- | --- | --- | --- |
| c1 > c2 | 0.12 (was 0.03) | typed: the end of c2's windup, low behind the left, where c1 left the blade high behind the left; it drops and rises | 1.82 m | 2 | 55 m/s | 2 / 5 frames |
| c2 > c3 | 0.117 (was 0.1) | typed: c3's turn on the right, under where c2 left the blade overhead on the right | 1.73 m | 5 | 21 m/s | 7 / 8 |
| c3 > c4 | 0.167 (was 0.1) | typed: the crouch's bottom, so the leap keeps its spring (the blade still comes forward from behind the left: a retrace) | 2.2 m | 6 | 22 m/s | 8 / 11 |
| c4 > c1 | 0.033 (was 0.04) | searched: the blade rising from the ground in front into c1's backswing | 1.06 m | 2 | 32 m/s | 4 / 4 |

(The pace is the tip gap over the fade; `JOIN.clean` calls 18 m/s or less clean and none is. On the hit, mashed every 3 frames on a
calm slip jelly.)

The look (one, `sf3/pairs-sheet.png` in the builder's scratchpad: each pair from the first strike to the second, side and front, the
tip's path drawn as beads a frame, gold with the join and blue-grey before it): through the join window (the first strike's end to the
second's start) the tip's path is shorter in every pair (3.2 m from 5.3, 8.0 from 11.0, 6.2 from 8.3, 3.0 from 4.0) and the strikes
come sooner, but the line is not yet one curve:
- **The longest single frame's step is still over a metre in every pair** (1.4, 3.4, 1.1, 1.4 m; before: 1.4, 2.2, 1.9, 1.2): the fade
  closes a 1 to 2 m gap in 2 to 6 frames. c2 > c3's 3.4 m frame is the worst: the fade and c3's 2.6x whirl stacked.
- **c3 > c4 still retraces** (the leap's windup starts in front); c1 > c2 enters only 2 frames before its strike, so the Rising Slash
  now lands on frame 3 from the press, quicker than the 6-frame target needs: read it in play.
- The drag and overshoot are small by design and could not be told apart in a still; they want a clip in play.
- As ruled (section 6, 3): the clips cannot be joined cleanly as they stand, so this goes to South. The two ways on from here without
  a new clip: cut each follow-through's cancel earlier (before the blade wraps behind), or let the fade run into the strike's first
  frames (longer than the startup). Both are a call, not a tune.
## 12. Step 4 as built (Calissa's builder, 2026-11-17)

The line, drawn (3F). Nothing in `tools/moveset.js` changed; the other six tools' ribbons are the engine's, as they were.

| Piece | Where | What it does |
| --- | --- | --- |
| The cutlass's trail | `vfx/cutlasstrail.js` (`CutlassTrail`, `CUTLASS_TRAIL`), asked from `cutlass.js` afterHands; its look `swing.cutlass` (library.js); `taper` on `vfx/trail.js` | pushed only from the strike's start to its end (no pad), on `c.t` (the warped clock); 0.075 game s more past the strike's end, its head drawn in to a point (92% of the blade), and that carry waits while the pose is held; two ribbons (a body from 42% of the blade out, an edge from 90%) each thinning to its tail with age (taper 0.8, 0.55) and fading; the blow's damage type's colour (impact's bone, `DAMAGE_TINT`) to a warm white edge; a paid blow keeps the film. The violet afterglow ribbon and the sparkles are gone; max 96 samples, so 144 Hz never cuts a tail |
| The cutlass's settle | `tools/sondelass/settle.js` (`CutlassSettle`, `SETTLE`) | Sond_Flourish at 1.3x (1.5 real s), in over 0.24 clip s, out into the stance over its last 0.3; starts when the finisher (`c.last`) ends on its own, or when the string's window lapses (RESET 0.9 s after a blow); only standing, still, on the ground, third person, nothing pressed; any press, a move key, motion or the air cuts it, its last pose let go over 0.05 real s, under a blow that begins |
| The cutlass's draw and stow | `tools/sondelass/drawclips.js` (`CutlassDrawClips`, `DRAW_CLIPS`), wired in `sondelass.js` | Sond_Draw from 0.06 at 1.5x: the tool held in the holster until clip 0.24, eased into the hand by 0.33 (the hand within 0.13 m of the holster there, measured), the blade out from 0.31, the clip crossfaded into stance:cutlass over 0.47 .. 0.66; drawT 0 to 1 over 0.06 .. 0.42 (0.24 real s; the old draw 0.26). Sond_Sheathe at 1.4x: the blade in from 0.16, the tool eased into the holster over 0.34 .. 0.45, drawT 1 to 0 by 0.44 (the stow event and sound on the seat), the layer let go over 0.6 .. 0.8. Upper body only; reversed, carrying, first person or a blow begun: the shared draw goes on from drawT |

Events for the ear: `cutlass.draw { beat: 'grab' }`, `cutlass.sheathe { beat: 'seat' }`, `cutlass.settle { beat: 'begin' | 'flick' | 'cut' }`.
The three clips are now named by code, so `node scripts/bake_suite.mjs` moved them from social.bin into core.bin (+83 KB at boot).

The look (one headless run, desk resolution, at the Weir against a slip jelly; the builder's scratchpad `sf4/`):
- **The trail** reads as one arc a blow, tapered to its tail: c1's flat cut, c2's rising arc over the head, c4's overhead line. Drawn
  only while LIVE, and the carry past the strike's end shows as a short pointed head. **Rough:** impact's bone white is additive on pale
  sand and pale sky, so in the Dunes at noon it is faint; it reads well only against the dark of the body. Whether the damage type should
  be a tint over a darker core (a blade's line that reads on white) is a look call, not made here.
- **The draw** reads: the hand goes to the small of the back, the haft comes round over the right shoulder and down into the en garde,
  the blade sliding out as it comes; no pop where it leaves the holster (from the front three-quarter).
- **The settle** played after c3 (the string's window lapsed): 0.9 s of plain stance first (the lapse), then the flourish: the blade
  turned down past the leg, held up and back behind the shoulder, then flicked out level at 1.73. **Rough:** the wait for the lapse reads
  as a pause before a fidget, not as the end of the string; and through 1.0 to 1.7 clip s the blade points behind the Courier. Starting it
  from the last blow's end (not the lapse) would read as part of the line, but would show and be cut in every deliberate pause of a pause
  string; it was left on the lapse.
- **The stow:** the blade drawn in by the time the hand turns, the seat on its frame (the events say so), the hand down after. **Not
  seen:** the camera meant to be behind them stood in front, so the tool going into the holster at the small of the back was not looked at.

Not verified: the pose audit (no blade-through-body numbers for the flourish or the two clips), first person, running draws and stows,
the settle cut mid-play by each press kind (only the stow's X cut was seen), and the stress test (Calissa runs it on the merged result).

## 13. Step 5 as built (Calissa's builder, 2026-11-17)

Every other row the cutlass's engine plays is warped as c1 .. c4 are (rows only: `warp`, `cancel`, and `join` on the light ones): the
catalogue's 15 normals and 12 of its specials (`sondelass/sondelassloadout.js`), and of the cutlass's own table the pause strings, the
launcher, the two air cuts, the dash and the counter (`sondelass/cutlass.js`). c4's strike is typed nearer where the blade meets the body
(`strike: [0.41, 0.47]`, clip s; the measured [0.333, 0.408] began with the tip at its highest; section 10's [0.36, 0.42] was tried
first and the look showed it still striking with the blade up behind the head, see below). Dovina's rows' `time` set to each move's
on-hit cancel, as step 2 did (her handoff, `docs/handoffs/dovina/2026-11-16-from-calissa-sondelass-times.md`, has the old and new times
and the power a second; `air2`'s rose 0.38 to 0.41, the soonest its strike's end allows; `pause1` is shared by t1 and j1, so both take
0.27). Left on their own clocks, by design: the plunge (its fall holds the clip until the ground; its landing is its cancel), the
charge's hold, the charged slash (warped already, its cancel its strike's end), the iaido's draw cut (begun at its strike), the stinger
(cutlass.js's own lunge, not the engine's) and the Wave Cut (its 108-frame leap is the move; its ring at 1.86 clip s would be lost to a
cancel before it).

**One engine line** (`tools/moveset.js` freeCutOpen, still 799 lines): a warped move with no next takes the free recovery cut from its
cancel frame, whatever its kind. Without it a warped special, or the launcher with the air string locked, held a press made past its
cancel frame (`queued`) and nothing ever took it, so the paid cut out of a special was lost. Opt-in as before: only a warped row.

`node scripts/sondelassframes.mjs` (now also prints a warped special's cancel), the converted rows (60 Hz frames from the press;
cancel the whiff's and its share of the move, then the on-hit one):

| id | weight | startup | active | recovery | total | cancel (whiff) | on-hit cancel | was: startup, active, recovery, total, cancel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| c4 | finisher | 14 | 4 | 78 | 96 | 36 (38%) | 25 (26%) | 11, 4, 83, 98, 36 (strike typed) |
| quickSlash | light | 5 | 9 | 17 | 31 | 17 (55%) | 15 (48%) | 10, 9, 7, 26, 20 |
| backhand | light | 6 | 6 | 25 | 37 | 18 (49%) | 15 (41%) | 12, 7, 13, 32, 23 |
| bodyBlow | light | 3 | 6 | 30 | 39 | 18 (46%) | 12 (31%) | 3, 6, 22, 31, 18 |
| straightPunch | light | 8 | 9 | 34 | 51 | 25 (49%) | 18 (35%) | 22, 8, 25, 55, 31 |
| hookPunch | light | 7 | 8 | 30 | 45 | 23 (51%) | 16 (36%) | 16, 9, 22, 47, 26 |
| lungeSlash | heavy | 12 | 3 | 19 | 34 | 20 (59%) | 17 (50%) | 16, 2, 13, 31, 30 |
| guardBreak | heavy | 7 | 4 | 44 | 55 | 25 (45%) | 18 (33%) | 7, 4, 35, 46, 25 |
| pushKick | heavy | 12 | 12 | 29 | 53 | 32 (60%) | 27 (51%) | 22, 12, 23, 57, 36 |
| lowSweep | heavy | 12 | 10 | 35 | 57 | 31 (54%) | 24 (42%) | 20, 10, 27, 57, 33 |
| frontKick | heavy | 12 | 9 | 35 | 56 | 31 (55%) | 24 (43%) | 25, 9, 26, 60, 35 |
| roundKick | heavy | 11 | 12 | 36 | 59 | 32 (54%) | 25 (42%) | 19, 11, 27, 57, 31 |
| sideKick | heavy | 12 | 9 | 36 | 57 | 30 (53%) | 23 (40%) | 19, 10, 28, 57, 30 |
| kneeStrike | heavy | 12 | 8 | 30 | 50 | 29 (58%) | 23 (46%) | 22, 8, 23, 53, 31 |
| lowKick | heavy | 13 | 10 | 30 | 53 | 31 (58%) | 24 (45%) | 28, 10, 22, 60, 38 |
| heavyChop | finisher | 14 | 5 | 53 | 72 | 36 (50%) | 27 (38%) | 30, 5, 38, 73, 55 |
| spinSlash | heavy | 10 (hits on 11, 21, 31, 40) | 39 | 41 | 90 | 55 (61%) | 50 (56%) | 10, 39, 21, 70, - |
| powerSlash | finisher | 0 | 6 | 82 | 88 | 42 (48%) | 33 (38%) | 0, 7, 65, 72, - |
| risingCut | launcher | 12 | 7 | 42 | 61 | 33 (54%) | 27 (44%) | 14, 7, 33, 54, - |
| guardCrush | heavy | 11 | 5 | 62 | 78 | 39 (50%) | 30 (38%) | 11, 5, 51, 67, - |
| backstepSlash | heavy | 22 | 4 | 41 | 67 | 40 (60%) | 33 (49%) | 22, 4, 34, 60, - |
| flyingKick | finisher | 27 | 13 | 31 | 71 | 54 (76%) | 45 (63%) | 49, 14, 24, 87, - |
| tornadoKick | finisher | 15 | 14 | 63 | 92 | 45 (49%) | 36 (39%) | 23, 14, 50, 87, - |
| spinHeelKick | finisher | 26 | 16 | 27 | 69 | 54 (78%) | 45 (65%) | 55, 16, 22, 93, - |
| risingKick | launcher | 17 | 10 | 31 | 58 | 35 (60%) | 30 (52%) | 32, 10, 24, 66, - |
| flurry | heavy | 13 (hits on 14, 24, 35) | 30 | 18 | 61 | 49 (80%) | 44 (72%) | 22, 30, 11, 63, - |
| breakKick | heavy | 13 | 11 | 43 | 67 | 37 (55%) | 30 (45%) | 22, 12, 37, 71, - |
| t1 | light | 5 | 4 | 38 | 47 | 23 (49%) | 16 (34%) | 9, 4, 31, 44, 24 |
| t2 | heavy | 8 (hits on 9, 28, 37) | 34 | 65 | 107 | 48 (45%) | 43 (40%) | 8, 34, 52, 94, 54 |
| j1 | light | 7 | 6 | 32 | 45 | 24 (53%) | 16 (36%) | 20, 6, 26, 52, 29 |
| j2 | light | 4 | 9 | 55 | 68 | 23 (34%) | 16 (24%) | 4, 9, 44, 57, 36 |
| j3 | finisher | 14 | 9 | 59 | 82 | 36 (44%) | 27 (33%) | 32, 9, 53, 94, 54 |
| up | launcher | 10 | 7 | 58 | 75 | 30 (40%) | 23 (31%) | 10, 7, 49, 66, 33 |
| a1 | light | 2 | 13 | 42 | 57 | 22 (39%) | 17 (30%) | 2, 13, 35, 50, 21 |
| a2 | heavy | 8 | 15 | 46 | 69 | 30 (43%) | 25 (36%) | 8, 15, 39, 62, 23 |
| dash | heavy | 12 | 7 | 86 | 105 | 30 (29%) | 22 (21%) | 14, 7, 69, 90, 30 |
| spin (counter) | heavy | 12 (hits on 13, 24, 35, 46) | 45 | 61 | 118 | 63 (53%) | 58 (49%) | 12, 45, 45, 102, - |

The rows' numbers are in the files beside each row; the rules that set them:
- **Light normals** (quickSlash, backhand, the hook, the straight; t1, j1): the windup run at 1.6 to 2.5x past a small skip, first active
  frame 6 to 9. bodyBlow, j2 and the air cuts were already quick (3, 4, 2, 8 frames) and keep their windups at their rate. The straight
  is the slowest light one (first active 9): its windup is a lunging step, and past 2.4x the step reads as a pop.
- **Heavies and finishers** (the kicks, the sweep, the lunge, heavyChop, j3, the dash): windups at 1.15 to 2.1x, first active frame 12 to
  15 (heavyChop's 31 to 15). guardBreak (7) and guardCrush (11) were already in the range and keep theirs.
- **Specials keep their weight where the windup is the tell** (the plan's own exception), so their startups stay above the normals':
  the backstep's 22 is its hop back (its tell and its escape: kept at its rate, its step's speed 5 to 4.2 m/s so it still carries
  1.14 m now the follow-through runs slow); the flying kick's 27 is its two-step run-up (49 before); the spinning heel's 26 its turn
  (55); the rising kick's 17 its held chamber; the Rising Cut's 12 the uppercut's crouch. powerSlash keeps a startup of 0: its clip
  begins mid-swing (the charged slash left it for that reason), and it is a full charge let go at once by design.
- **The follow-through** of every converted row runs at 0.3 to 0.6 just after the strike, back to 0.5 to 1.6 by the clip's end: the
  blade lingers, so a move left alone runs about as long as before or longer (spinSlash 70 to 90, the dash 90 to 105), while the cancel
  frame cuts it short when pressed.
- **The cancel**: on a whiff at 45 to 60% of the move, on a hit 6 to 10 frames sooner, never before the strike's end and a frame. Where
  the strike itself ends late the cancel cannot be earlier: the flying kick (its strike ends on 40 of 71: whiff 76%, hit 63%), the
  spinning heel (42 of 69: 78%, 65%), the flurry (its third punch ends on 43 of 61: 80%, 72%) and spinSlash (its fourth cut on 49 of
  90: 61%, 56%) are the nearest their clips reach; the kicks' two are given a few frames past the strike so the foot is down.
- **The join** (`join: {}`, searched, none typed) on the light normals, the pause strings' t1, j1, j2, and the launcher and the air
  cuts: a heavy, a kick, a finisher or a special takes none, since entered mid-windup out of a string its tell would go. A light
  catalogue normal slotted after c1 .. c4 now enters where the blade is, as the default string does.
- lungeSlash's step 3.5 to 4.5 m/s, so its 0.78 m forward step stays 0.78 m now its windup runs faster (the step is in move time, the
  clip's own travel is not).

**The look** (one, `sf5/moves-sheet.png` in the builder's scratchpad: quickSlash, heavyChop, c4, risingCut, tornadoKick, guardCrush and
the launcher into a1, each begun alone on a calm slip jelly, drawn side-on every second frame, the strike's frames and the hit marked):
- **The light normal reads quick:** quickSlash's blade is live on frame 6 and lands on 9, low across the front; its follow-through hangs
  through frames 14 to 30 as meant.
- **The heavy reads heavy and sooner:** heavyChop's hop and overhead are still there, the chop lands on frame 17 (31 before) with the
  blade in front of the body; its 2-frame pose hold sits on the chop, not before it.
- **The launcher and the special:** risingCut lands on 14 with the blade rising in front; tornadoKick's spin is whole, the foot
  landing on 25; the launcher hits on 13 and a1 follows from its cancel frame on 24, hitting on 26 in the air.
- **c4 was not fixed by [0.36, 0.42]:** its hit landed on frame 12, the first live frame, and the 4-frame pose hold held the blade
  straight up behind the head (frames 12 to 14); the blade only crossed the front on 16, about clip 0.43. The row is now typed
  [0.41, 0.47] from that measure (first active frame 15, the finisher's target's top). **That correction was not looked at** (one look,
  no rerun): read it in play, and if the blade is past the body when it lands, 0.39 is the next to try.
- **guardCrush's hit came on frame 11, before its live window as sampled** (14): its sweep's pad (`STRIKE_PAD`) reached the jelly at
  1.6 m before the measured strike; it read as the thrust's start, not wrong, but its contact is earlier than the table says.

Rough, and not done here:
- Only the light rows join; the heavies, kicks and specials keep a 0.1 s fade from whatever came before, as before step 3. A heavy in a
  string still draws its windup from the stance, by design (its tell).
- **A whole-body joined move gets the join's fade but not its drag and overshoot:** in `carry` (`tools/moveset.js`) the launch's options
  name `poseFix` twice and the second (the root travel taken out, then the fade) wins, so `BladeJoin.whole` never runs. True of c4 since
  step 3 and now of the launcher and the air cuts; mending it means folding the root-travel step into `whole`, an engine change left for
  Petra's gate.
- **A joined row begun cold no longer shows a stale pose:** `BladeJoin.under` held `M.last` under any joined whole-body move, and
  `M.last` is never cleared, so the launcher from a stand or a first air cut would have blended in over whatever move was shown last.
  It now holds it only for the move `enter` joined (`entered`, `courier/anim/bladejoin.js`); c4, always fourth, never met it.
- **The travel cut ignores the warp:** `carry` predicts a move's own step as `v x span / rate`; lungeSlash's step at 4.5 m/s is
  predicted 1.0 m against the 0.78 m it now travels, so near a target its lunge stops about 0.2 m short. An engine line, Petra's.
- **With the plunge locked, a2 has no next:** from its cancel frame a press now takes the free cut into a ground opener in the air (it
  was the paid cut). An edge, but new.
- The pause strings, the dash and the counter were converted though the brief named only the catalogue, the air string, the launcher and
  the specials ("every remaining row"); say so if they should go back.
- The specials now take a free cut into the string from their cancel frame (the engine line above): each special's recovery is shorter
  in play by a third to a half, though its Lachryma cost is the same. Dovina's to weigh with the rest.
- Not looked at: the kicks but the tornado, the fists, the pause strings, the dash, the counter, a2, and every row on a whiff; the joins
  of the light catalogue normals in a string; the stress test (Calissa's, on the merged result).

