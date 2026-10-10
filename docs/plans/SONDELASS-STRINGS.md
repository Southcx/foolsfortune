# The Sondelass's strings: a chart

Charted 2026-10-10 for the owner's markup; built the same day to the owner's rulings, Calissa (Art). The owner put the whole task in
Calissa's hands, the numbers in `src/progress/combat/moves.js` included (Dovina has a note: `docs/handoffs/dovina/`).

> "chart out combo strings for the Sondelass ... Draft from the clips in the base file. I think that the solution is going to be
> allowing the player to animation cancel their combo string's recovery time at the cost of Lachryma, so that the hits keep flowing
> if you're willing to spend resources. I also had issues with the aerial portion of the launch combo." (the owner, 2026-10-10)

How to read it. The cutlass's table is `MOVES`/`STRINGS` in `src/tools/sondelass/cutlass.js`, played by the one combo engine
(`src/tools/moveset.js`); each move's row (power, hits, time, cost, unlock) is in `src/progress/combat/moves.js`. Times are **real
seconds from the blow's start** unless marked **clip s** (a move at rate 1.1 plays 1.1 clip s a real second). The **strike** is the
blade's fast part, measured by `melee.js` from the clip (the tip's fastest stretch, down to a third of its peak speed), or typed where
the clip asks. The hit-stop (about 0.1 real s a hit) is left out. **The paid cut** is a working name: the glossary keeps "cancel" for
opposites, so the player's word is Espada's and the owner's.

## 1. The strings, blow by blow (as built)

"Next" is when a press may begin the next blow for free: the later of the chain window's opening and the row's time (the rate the raids
are sized to). "Free cut" is the recovery cut: a string's last blow (and now the dash, the charge's release and the plunge once landed),
at its row's time, into a new opener. "Paid" is where the paid cut lands (the strike's end); "buys" is how much sooner than the free way.

| string | blow | clip (part played) | role | strike | next (free) | recovery | free cut | paid | buys |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ground (LMB) | c1 | Sond_Combo1, 0-0.85 clip s, x1.1 | opener: flat cut, right to left | 0.06-0.25 | 0.42 (window 0.20-0.68) | 0.25-0.77 | - | 0.25 | 0.17 |
| | c2 | Sond_Combo2, 0-0.90, x1.1 | link: rising cut, left to right | 0.15-0.28 | 0.46 (0.24-0.73) | 0.28-0.82 | - | 0.28 | 0.18 |
| | c3 | Sond_Combo3, 0-1.05, x1.1 | link: fast flat cut on a 0.35 m hop | 0.36-0.43 | 0.50 (0.38-0.86) | 0.43-0.95 | - | 0.43 | 0.07 |
| | c4 | Sond_Combo4, whole body, 0.6 m travel | finisher: leap and overhead cut | 0.33-0.41 | - | 0.41-1.70 | at 0.78, into a new opener | 0.41 | 0.37 |
| pause 1 (LMB 0.25-0.8 s after c1) | t1 | Sond_Thrust, 0-0.80, x1.1 | opener: thrust, push 4 | 0.15-0.22 | 0.40 (0.18-0.64) | 0.22-0.73 | - | 0.22 | 0.18 |
| | t2 | Sond_ThrustCombo, whole body | finisher: a held thrust that stabs three times, staggers; its own row (`thrust2`: 0.9 x 3) | 0.13-0.70, typed; stabs from 0.13, 0.45, 0.60; aimed 55 degrees | - | 0.70-1.57 | at 0.90 | 0.70 | 0.20 |
| pause 2 (LMB 0.25-0.8 s after c2) | j1 | Sond_JrpgCombo1, 0-0.95, x1.1 | opener: rising cut | 0.34-0.46 | 0.48 (window from 0.53 clip s: the arc finishes) | 0.46-0.86 | - | 0.46 | 0.02 |
| | j2 | Sond_JrpgCombo2, 0-1.05, x1.1 | link: wide 271-degree cut | 0.30-0.58 | 0.60 (from 0.66 clip s) | 0.58-0.95 | - | 0.58 | 0.02 |
| | j3 | Sond_JrpgCombo3, whole body | finisher: overhead, lift 3, staggers | 0.53-0.68 | - | 0.68-1.57 | at 0.90 | 0.68 | 0.22 |
| charge (hold LMB) | c1, then hold | c1 held past 0.30 clip s, then Sond_ChargeHold looped (full at 1.1 real s) | wind-up | - | release | - | - | - | - |
| | burst | Sond_ChargeRelease, whole body | finisher: 331-degree cut on release | 0.00-0.11 | - | 0.11-1.63 | at 1.30 (new) | 0.11 | 1.19 |
| launcher (S + LMB) | up | Sond_Launcher, whole body, rises its own 0.92 m | launcher: tapped, lift 5.5; held to its strike, lift 9.5 and they ride it up (High Time) | 0.17-0.28 | 0.55 (0.30-1.08) | 0.28-1.10 (held, to the target's turn) | - | 0.28 | 0.27 |
| | a1 | Sond_AirCombo1 | juggle: flat cut, lift 2, push 0.5 | 0.03-0.24 | 0.35 (0.22-0.80) | 0.24-0.83 | - | 0.24 | 0.11 |
| | a2 | Sond_AirCombo2 | juggle: a somersault cut, lift 2, push 0.5; aimed 42 degrees | 0.13-0.38 | 0.38 (0.36-1.00) | 0.38-1.03 | - | 0.38 | 0 |
| | a3 | Sond_AirPlunge | plunge: a chop (push 2, lift 0), falls at 26 m/s from 0.32 clip s; a 2.6 m ring on landing, near the ground only; staggers | a chop at 0.07-0.24, then the ring | - | 1.05 on the ground after landing | 0.6 after landing (new) | landing | 0.6 |
| dash (LMB sprinting) | dash | Sond_DashSlash, whole body, 2.3 m travel | opener and finisher alone: push 8 | 0.23-0.35 | - | 0.35-1.50 | at 0.50 (new) | 0.35 | 0.15 |
| special (R, 12 Lachryma) | tide | Sond_SpecialTidecutter, whole body | finisher: the 4.2 m ring at 1.86; its row's time now the clip's 2.63 | 1.80-1.94 | - | 1.94-2.63 | none (plays out) | 1.94 | 0.69 |
| counter (LMB from the guard) | spin | Sond_SpinSlash, whole body | 2.8 turns; its own row (`counter`: 0.8 x 4) | 0.20-0.94 | - | 0.94-1.70 | none (plays out) | 0.94 | 0.76 |

R (the special) still cuts any upper-body blow (c1-c3, t1, j1, j2) at any moment, for its 12 Lachryma; from a whole-body blow's
recovery it is the paid cut (5 + 12). The stinger (RMB) and the guard (V) wait until no blow is playing, or come at once from a
recovery for the paid cut (5 + the stinger's 6; 5 for the guard).

**Measured** (headless, the movement lab, at the air, 60 frames a real second): the ground string's cycle is 2.20 real s free (LMB every
0.1 s; 2.16 on paper), 1.50 with the paid cut (LMB every 2 frames: each cut waits for a press after the strike's end; 1.37 on paper),
1.60 at LMB every 0.1 s. The cuts land at c1 0.30, c2 0.30, c3 0.47, c4 0.43 real s into each blow. A fresh pool (100) paid 20 cuts and
was under 5 at 7.7 real s. With a slip jelly: t2 stabbed three times, the counter landed three of its four turns, the dash cut freely
into c1 at 0.52 s, the charge's release at 1.30 s; a paid cut from c1 at 0.55 s went into the stinger (pool 100 to 89) and into the
guard (100 to 95); from the dash's recovery into the Tidecutter (5 + 12).

## 2. The paid cut, built

- **When**: in any blow's recovery: its strike (and its ring) past, a plunge landed; never inside a strike, never in a plunge's fall.
  The press must be made in the recovery: one buffered from inside the strike waits for the free ways, so pressing on the old rhythm
  costs nothing. A press when the free way is already open is free.
- **What**: the press pays 5 Lachryma (`paidCut` in `moves.js`) and the next move begins at once, from the pose on show (the engine's
  0.1 real s join). The grammar picks it: LMB the next blow (after a last blow, the opener), S + LMB the launcher, R the special, RMB the
  stinger, V the guard. The next move's own cost is paid with it, or neither is. A press the pool cannot pay is the free grammar: no cut,
  no words, the pool's pulse once a blow. In the engine: `recovering()`, `pay()`, `cut()`, the branch after the free ones in `update()`.
- **The price, 5** (Calissa's, the owner's to tune; the reasoning is the row's comment): a fresh pool pays five paid ground strings,
  7.7 real s at 3.9 power a second (x1.47 the free 2.7), about 9 power more than the free string would do, then the pool, which is also
  the shield, is empty. Regen waits 2.2 s unspent, so it cannot keep a cut every 0.4 s going: a burst, not a raise.
- **The event**: `move.cut { tool, move, paid: true, cost, by }`; its rule (`feedback/tracking/moves.js`) counts `move.cut.paid` and
  says one line the first time ("You cut the recovery short for 5 Lachryma: a press once the blade has struck."; Espada's words to come).
- **The look**: the cut leaves Blink Dash's afterimage, the pose on show left behind walking the oil film's hues as it fades
  (`featTint`), drifting back 0.6 m/s; the paid blow's ribbon wears the film. Blink Dash's, the stinger's and the paid cut's afterimages
  are one module now (`src/vfx/afterimage.js`); the stinger's was a flat orange and walks the film too. No words. A sound is Wanda's.
- Prior art: Guilty Gear's Roman Cancel (recovery cut short for half the Tension gauge, flat whatever it cancels), Street Fighter 6's
  Drive Rush cancel (the Drive gauge), Devil May Cry's jump cancel and Bayonetta's Dodge Offset (the string kept flowing).

## 3. The aerial problem, measured, and fixed

Before (one headless run in the Throwing Room: a slip jelly, calmed, 1.9 m in front, S + LMB, then LMB every 0.1 real s; heights above
the floor where the Courier stood; the gap is the jelly's centre above the Courier's feet):

| moment | real s | Courier's feet | jelly (base / centre) | gap | the blow |
| --- | --- | --- | --- | --- | --- |
| launcher strikes | 0.22 | 0.11 | 0 / 0.81 | 0.70 | hits: lift 9.5 m/s |
| a1's strike | 0.80-1.00 | 1.01-1.05 | 2.81-3.77 / 3.62-4.58 | 2.61-3.53 | misses: the cut reaches about 2.66 m above the feet |
| a2's strike | 1.27-1.50 | 1.00-0.85 | 4.45-4.35 / 5.25-5.16 | 4.25-4.31 | misses: reach about 3.1 m |
| the plunge lands | 1.87 | 0 | 3.06 / 3.87 | 3.5 | "hits": the ring had no height test; its push 7 and lift 5 threw the jelly 9 m away |

The causes: the Courier rose the clip's 0.92 m while the jelly went 4.6 m up; in the air string the Courier fell at 0.12 x 21 = 2.5
m/s² and the jelly at its own 9.81; the plunge's ring struck what was overhead. And two found on the way: a2's somersault turns the blade
in an upright circle 37-49 degrees to the Courier's left and t2's held thrust sits 40-90 degrees to their left, so neither ever crossed
the front, and neither could strike what was straight ahead (`melee.js` tip angles, a probe); and a1's and a2's sideways pushes (1.5,
2) carried the pair at 3.8 m/s into the nearest wall once they rode together.

Built (`tools/moveset.js`, `tools/sondelass/cutlass.js`):

| | what | numbers |
| --- | --- | --- |
| A | **S + LMB tapped**: the launcher as it was (the clip's own 0.92 m), the target lifted to the blade | lift 5.5 |
| B | **S + LMB held** to the strike's start (0.17 real s): High Time. From the strike's end the Courier **rides** what it launched (the `juggle`): its measured speed, and a pull (6 /s, at most 7 m/s) to 1.3 m below its centre and 1.4 m from it on the ground's plane; the launcher's last pose held till it falls at 3 m/s (0.3 s past its apex), 2.5 s at most | lift 9.5 |
| C | **The air blows ride it too**, held up by their own lift: the two hang alike whatever the target's own gravity (the engine never assumes one: it measures where the thing is each frame); out of reach (3.5 m), the old hang (gravity x0.12) | a1, a2 lift 2, push 0.5; a2 aimed 42 degrees |
| D | **The plunge's ring strikes only near the ground**: a target's lowest point within 1.5 m of the Courier's feet as they land (`RING_UP`) | plunge lift 0; the chop push 2, the ring's push 7 (`ringHit`) |

After (the movement lab, the same jelly 1.9 m in front, the pool empty so only the free grammar plays; LMB every 0.1 s after):

| moment | real s | held: feet | held: jelly base / centre, gap | tapped: feet | tapped: jelly base / centre, gap |
| --- | --- | --- | --- | --- | --- |
| launcher strikes | 0.22 | 0.11 | 0 / 0.83, 0.72 (lift 9.5) | 0.11 | 0 / 0.83, 0.72 (lift 5.5) |
| a1 hits | 0.78 | 2.34 | 2.71 / 3.54, 1.20 | 1.01 | 1.30 / 2.13, 1.12 |
| the apex | 1.13-1.17 | 2.57 | 3.00 / 3.82, 1.25 | 1.12 | 1.53 / 2.35, 1.23 |
| a2 hits | 1.43 | 2.27 | 2.72 / 3.54, 1.27 | 0.80 | 1.24 / 2.07, 1.27 |
| a3's chop hits | 1.95 | 2.36 | 2.81 / 3.64, 1.28 | 0.89 | 1.34 / 2.16, 1.28 |
| the plunge lands | 2.52 / 2.47 | 0.02 | 1.87 / 2.70: overhead, out of the ring | 0.02 | 0.60 / 1.43 (struck by the chop already) |
| the jelly lands | 3.08 / 2.60 | | 1.5 m from them; c1 at 3.35 hits it | | 1.45 m from them; c1 at 3.07 |

Every air cut landed in both. Held, a1 at its free time (0.55) stops the rise at about 2.6 m (its lift 2 replaces the 9.5): the 4.6 m
of the paper plan comes only if a1 waits for the apex. The core movement is untouched: the jump stays 6.4 m/s at 21 m/s² (0.98 m);
the rise is the move's, as the launcher's own `xyz` rise already was.

## 4. The other changes the clips asked for (built)

1. **j1, j2**: their chain windows open at 0.53 and 0.66 clip s, once their arcs finish (j1 into j2 at 0.48 real s, j2 into j3 at 0.62).
2. **t2** strikes three times: its strike typed as 0.13-0.70 clip s, each hit's start at 0.13, 0.45, 0.60 (`parts`), aimed 55 degrees
   (`aim`), push 7 to 2 (the first stab threw the target out of the other two's reach), its own row `thrust2` (0.9 x 3, staggers).
3. **The counter** has its own row, `counter` (0.8 x 4, time 1.7).
4. **The dash, the charge release and the plunge's landing** take the free recovery cut at their rows' times (0.5, 1.3, and 0.6 after
   landing).
5. **The Tidecutter's row** says 2.63 real s, its clip's length.
6. **No swap from the old packs** (unchanged): the Sond_ suite reads as one Courier; UAL's swordA and swordARec are the paid cut's shape
   in the prior art.
7. **Sond_Flourish** is still unused: a show, not a blow.

## 5. The clips

**The base file.** `source_assets/courier_base_rigged.blend` holds two actions: CameraRigAction (8 frames) and Courier_Pose_Idle01
(1 frame). It has no blade clips, so this chart draws on the Courier's suite, `source_assets/Courier/courier_anims_melee.glb` (169
actions, 35 of them Sond_*). If "the base file" meant another file, the owner should say which.

Lengths are the baked game clips' (30 fps; the glb's are one frame longer). The strike is in clip s; sweep is the degrees the tip
turns about the body during the strike; tip height is metres at the strike's start and end; travel and rise are the hips' metres.

| clip | length | strike | sweep | tip height | travel / rise | used for |
| --- | --- | --- | --- | --- | --- | --- |
| Sond_Combo1 | 1.30 | 0.07-0.28 | 174 | 0.77-1.27 | 0.25 / 0 | c1 |
| Sond_Combo2 | 1.23 | 0.17-0.31 | 195 | 0.30-2.51 | 0.20 / 0 | c2 |
| Sond_Combo3 | 1.50 | 0.40-0.47 | 198 | 1.44-1.06 | 0.10 / 0.35 | c3 |
| Sond_Combo4 | 1.70 | 0.33-0.41 | 43 (overhead) | 2.72 to -0.05 | 0.60 / 0.57 | c4 |
| Sond_Thrust | 1.23 | 0.17-0.24 | 31 | 1.40-1.24 | 0.45 / 0 | t1; the stinger's pose |
| Sond_ThrustCombo | 1.57 | 0.13-0.34 | 46 | 1.13-1.00 | 0.30 / 0 | t2 |
| Sond_JrpgCombo1 | 1.10 | 0.37-0.51 | 172 | 0.65-1.99 | 0 / 0.03 | j1 |
| Sond_JrpgCombo2 | 1.17 | 0.33-0.64 | 271 | 1.13-0.34 | 0 / 0.17 | j2 |
| Sond_JrpgCombo3 | 1.57 | 0.53-0.68 | 134 | 2.17-0.28 | 0 / 0.06 | j3 |
| Sond_ChargeHold | 1.33 | (no swing) | - | 0.80 | 0 / 0 | the charge's hold; Blade Mode's stance |
| Sond_ChargeRelease | 1.63 | 0.00-0.11 | 331 | 0.66-1.35 | 0.38 / 0.14 | burst |
| Sond_Launcher | 1.10 | 0.17-0.28 | 153 | 0.13-1.77 | 0.32 / 0.92 | up |
| Sond_AirCombo1 | 0.83 | 0.03-0.24 | 172 | 1.15-1.46 | 0 / 0 | a1 |
| Sond_AirCombo2 | 1.03 | 0.13-0.38 | 8 (a somersault) | 1.89-1.56 | 0 / 0 | a2 |
| Sond_AirPlunge | 1.37 | 0.07-0.24 | 55 | 1.40-0.16 | 0 / 0 | a3 |
| Sond_DashSlash | 1.50 | 0.23-0.35 | 63 | 0.32-1.01 | 2.30 / 0 | dash |
| Sond_SpinSlash | 1.70 | 0.20-0.94 | 996 | 0.96-1.32 | 0 / 0 | the counter |
| Sond_SpecialTidecutter | 2.63 | 1.80-1.94 | 72 | 0.03-2.76 | 0 / 0.50 | tide |
| Sond_Flourish | 1.97 | 1.73-1.91 | 115 | 2.15-1.13 | 0 / 0 | (unused) |
| Sond_Parry, Sond_Block | 1.03, 1.23 | (not swings) | | | | the deflect, the guard |
| Sond_Idle (B-E), Draw, Sheathe, HitReact; Cast, CastIdle, ReelIn, ReelFight, Catch, Hookshot | | | | | | the stance; the rod's and the hook's |

Other clips that could serve a one-handed blade (measured the same way, right hand):

| clip (pack) | length | strike | sweep | note |
| --- | --- | --- | --- | --- |
| swordA, swordB (UAL, anims.bin) | 0.43, 0.53 | 0.17-0.31, 0.20-0.31 | 271, 233 | with swordARec 0.97 and swordBRec 1.03: attack and recovery split |
| swordC, swordAtk, swordDash (UAL) | 2.00, 1.53, 1.57 | 0.60-0.71, 0.33-0.47, 0.27-0.38 | 212, 234, 243 | the old look; swordHeavy is 4.33 long |
| meleeHook (UAL) | 0.47 | 0.23-0.28 | 90 | a fast short hook |
| Brush_Combo1-3, Brush_Spin, Brush_AirSlam, Brush_Dive (suite) | 0.90-1.50 | | | two hands on the brush; the Dive drops 0.62 m and goes 1.2 m |
| Vane_SpinSweep, Vane_JrpgCombo1-3 (suite) | 1.17-1.70 | | | a staff's two-handed grip |
| Fist_Uppercut, Fist_FlyingKick (suite) | 1.03, 1.37 | 0.23-0.34, 0.50-0.64 | | unarmed; the uppercut rises 0.38 m |
| Air_SlamStart, Air_SlamFall, Air_SlamLand (move file) | 0.67, 0.40, 1.13 | | | the core's slam in three parts |
| Gun_PistolWhip, Lock_FlailCombo3 (suite) | 0.70, 1.23 | | | other tools' grips |

## 6. The contact sheets, and what was not checked

The chart's sheets (`sheet-ground`, `-pause1`, `-pause2`, `-charge`, `-launcher`, `-dash`, `-special`, the probes `-a2probe`, `-t2probe`)
are in Calissa's scratchpad (`sondelass-chart/`), the pass's in `sondelass-pass/`: `sheet-paidcut` (four paid cuts round the ground
string, at the cut, 5 and 12 frames after: the afterimage and the filmed ribbon) and `sheet-hightime` (the hold-launcher's air string
against a slip jelly, every 0.1 s, side-on). None are in the repo.

Not checked: nothing was watched at speed, only stills; the hit-stop is not in the tables; only a slip jelly was juggled (a clapperjar
rides the same way in code, untried); a2 and t2 aimed off their targets were seen side-on only, not from the front; the paid cut from
the launcher (into a1 at once, which stops the rise early) and from the air string was not measured; the feel of the price is the
owner's.
