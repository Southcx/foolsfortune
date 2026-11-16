# The Sondelass's melee, revamped for feel (a plan, approved 2026-11-16; steps 0 and 1 in work)

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
