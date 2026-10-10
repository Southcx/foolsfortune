# The Sondelass's strings: a chart

Draft for the owner's markup, Calissa (Art), 2026-10-10; numbers are Dovina's.

> "chart out combo strings for the Sondelass ... Draft from the clips in the base file. I think that the solution is going to be
> allowing the player to animation cancel their combo string's recovery time at the cost of Lachryma, so that the hits keep flowing
> if you're willing to spend resources. I also had issues with the aerial portion of the launch combo." (the owner, 2026-10-10)

How to read it. The cutlass's table is `MOVES`/`STRINGS` in `src/tools/sondelass/cutlass.js`, played by the one combo engine
(`src/tools/moveset.js`); each move's row (power, time, cost, unlock) is Dovina's (`src/progress/combat/moves.js`). Times are **real
seconds from the blow's start** unless marked **clip s** (a move at rate 1.1 plays 1.1 clip s a real second). The **strike** is the
blade's fast part, measured by `melee.js` from the clip (the tip's fastest stretch, down to a third of its peak speed). The hit-stop
(about 0.1 real s a hit) is left out. **The paid cut** is a working name for the owner's mechanic: the glossary keeps "cancel" for
opposites, so the player's word is Espada's and the owner's, and its price is Dovina's.

## 1. The strings, blow by blow

"Next" is when a press may begin the next blow today: the later of the chain window's opening and the row's time (the rate the raids
are sized to, `moveset.js:129`). "Free cut" is the recovery cut (`moveset.js:132`: a string's last blow, ground and pause strings only,
at its row's time). "Paid" is where the paid cut would land (the strike's end); "buys" is how much sooner than today.

| string | blow | clip (part played) | role | strike | next today | recovery (strike end to end) | free cut today | paid | buys |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ground (LMB) | c1 | Sond_Combo1, 0-0.85 clip s, x1.1 | opener: flat cut, right to left | 0.06-0.25 | 0.42 (window 0.20-0.68) | 0.25-0.77 | - | 0.25 | 0.17 |
| | c2 | Sond_Combo2, 0-0.90, x1.1 | link: rising cut, left to right | 0.15-0.28 | 0.46 (0.24-0.73) | 0.28-0.82 | - | 0.28 | 0.18 |
| | c3 | Sond_Combo3, 0-1.05, x1.1 | link: fast flat cut on a 0.35 m hop | 0.36-0.43 | 0.50 (0.38-0.86) | 0.43-0.95 | - | 0.43 | 0.07 |
| | c4 | Sond_Combo4, whole body, 0.6 m travel | finisher: leap and overhead cut | 0.33-0.41 | - | 0.41-1.70 | at 0.78, into a new opener | 0.41 | 0.37 |
| pause 1 (LMB 0.25-0.8 s after c1) | t1 | Sond_Thrust, 0-0.80, x1.1 | opener: thrust, push 4 | 0.15-0.22 | 0.40 (0.18-0.64) | 0.22-0.73 | - | 0.22 | 0.18 |
| | t2 | Sond_ThrustCombo, whole body | finisher: a held thrust with a flurry, staggers | 0.13-0.34 (one of three peaks) | - | 0.34-1.57 | at 0.90 | 0.34 | 0.56 |
| pause 2 (LMB 0.25-0.8 s after c2) | j1 | Sond_JrpgCombo1, 0-0.95, x1.1 | opener: rising cut | 0.34-0.46 | 0.41: cuts its own arc 0.05 short | 0.46-0.86 | - | - | - |
| | j2 | Sond_JrpgCombo2, 0-1.05, x1.1 | link: wide 271-degree cut | 0.30-0.58 | 0.55: cuts its own arc 0.04 short | 0.58-0.95 | - | - | - |
| | j3 | Sond_JrpgCombo3, whole body | finisher: overhead, lift 3, staggers | 0.53-0.68 | - | 0.68-1.57 | at 0.90 | 0.68 | 0.22 |
| charge (hold LMB) | c1, then hold | c1 held past 0.30 clip s, then Sond_ChargeHold looped (full at 1.1 real s) | wind-up | - | release | - | - | - | - |
| | burst | Sond_ChargeRelease, whole body | finisher: 331-degree cut on release | 0.00-0.11 | - | 0.11-1.63 | none (plays out) | 0.11 | 1.52 |
| launcher (S + LMB) | up | Sond_Launcher, whole body, rises its own 0.92 m | launcher: lift 9.5 | 0.17-0.28 | 0.55 (0.30-1.08) | 0.28-1.10 | - | 0.28 | 0.27 |
| | a1 | Sond_AirCombo1, gravity x0.12 | juggle: flat cut | 0.03-0.24 | 0.35 (0.22-0.80) | 0.24-0.83 | - | 0.24 | 0.11 |
| | a2 | Sond_AirCombo2, gravity x0.12 | juggle: a somersault cut (upside down 0.2-0.3, upright by 0.38) | 0.13-0.38 | 0.38 (0.36-1.00) | 0.38-1.03 | - | 0.38 | 0 |
| | a3 | Sond_AirPlunge | plunge: falls at 26 m/s from 0.32 clip s; a 2.6 m ring on landing; staggers | a chop at 0.07-0.24, then the ring | - | 1.05 on the ground after landing | none (plays out) | landing | about 1.0 |
| dash (LMB sprinting) | dash | Sond_DashSlash, whole body, 2.3 m travel | opener and finisher alone: push 8 | 0.23-0.35 | - | 0.35-1.50 | none (plays out) | 0.35 | 1.15 |
| special (R, 12 Lachryma) | tide | Sond_SpecialTidecutter, whole body | finisher: the 4.2 m ring at 1.86 | 1.80-1.94 | - | 1.94-2.63 | none (plays out) | 1.94 | 0.69 |
| counter (LMB from the guard) | spin | Sond_SpinSlash, whole body | 2.8 turns, four speed peaks | 0.20-0.94 | - | 0.94-1.70 | none (plays out) | 0.94 | 0.76 |

Already true today: R (the special) cuts any upper-body blow (c1-c3, t1, j1, j2) at any moment, for its 12 Lachryma. The stinger
(RMB) and the guard (V) wait until no blow is playing.

## 2. The paid cut, drafted

- **When**: in any blow's recovery: its strike past, before today's next blow, free cut or end. Never inside a strike (an arc
  finishes), never in the plunge's fall.
- **What**: the press pays Lachryma and the next move begins at once, from the pose on show (the engine's 0.1 real s join,
  `moveset.js` `joined()`). The grammar picks the move as it does now: LMB the next blow (after a last blow, the opener), S + LMB the
  launcher, R the special, RMB the stinger, V the guard. In the engine it is a third branch beside `moveset.js:129` and `:132`: the
  row's time waived, paid.
- **The free cut stays** where it is, so not paying is exactly today's game.
- **What it buys** (Dovina's to price): the ground string's cycle goes from 2.16 to 1.37 real s, its 5.9 power from 2.7 to 4.3 a
  real second (x1.57), past the 2.6 rule the raids are sized to. The biggest single buys are the blows that play out today: the charge
  release (1.52), the dash (1.15), the plunge's landing (about 1.0).
- **The look** (Calissa's; the owner, 2026-10-10: "use the same afterimage effect that Blink Dash does"): the cut leaves Blink Dash's
  afterimage, the body left behind walking the oil film's hues as it fades (`featTint`), and the paid blow's ribbon wears the film too.
  Blink Dash's afterimage (`courier/moves/blink.js`) and the stinger's (`tools/sondelass/cutlass.js`) fold into one shared vfx module
  first, so the three read as one. No words. A sound for it is Wanda's (none yet).
- Prior art: Guilty Gear's Roman Cancel (recovery cut short for half the Tension gauge), Street Fighter 6's Drive Rush cancel (the
  Drive gauge), Devil May Cry's jump cancel and Bayonetta's Dodge Offset (the string kept flowing, for skill rather than a resource).

## 3. The aerial problem, measured

One headless run in the Throwing Room: a slip jelly (calmed) 1.9 m in front, S + LMB, then LMB every 0.1 real s. Heights above the
floor where the Courier stood; the gap is the jelly's centre above the Courier's feet. (Strawman cannot be lifted: its `knock` is
empty.)

| moment | real s | Courier's feet | jelly (base / centre) | gap | the blow |
| --- | --- | --- | --- | --- | --- |
| launcher strikes | 0.22 | 0.11 | 0 / 0.81 | 0.70 | hits: lift 9.5 m/s |
| a1 begins | 0.77 | 0.99 | 2.61 / 3.42 | 2.43 | |
| a1's strike | 0.80-1.00 | 1.01-1.05 | 2.81-3.77 / 3.62-4.58 | 2.61-3.53 | misses: the cut reaches about 2.66 m above the feet |
| a2's strike | 1.27-1.50 | 1.00-0.85 | 4.45-4.35 / 5.25-5.16 | 4.25-4.31 | misses: reach about 3.1 m |
| jelly's apex | 1.32 | 0.98 | 4.50 / 5.30 | 4.3 | |
| the plunge lands | 1.87 | 0 | 3.06 / 3.87 | 3.5 | "hits": the ring has no height test; its push 7 and lift 5 throw the jelly 9 m away |
| jelly lands | 3.57 | 0 | 0 | | |

Two mismatches, and a third thing:

1. **The rise.** The Courier rises the clip's 0.92 m over 1.08 real s; the jelly goes 4.6 m up in 0.97 real s after the strike.
2. **The fall.** In the air string the Courier falls at 0.12 x 21 = 2.5 m/s²; the jelly at its own 9.81 m/s². Over a1 and a2 the
   gap grows by about 1.8 m whatever the launch. The `airborne` status (1.6 real s) is put on, but no creature reads it.
3. **The plunge's ring** strikes what is overhead.

A variant, patched in the page only (nothing in the repo): the Courier carried up on the jelly's own arc (9.5 m/s at 9.81 m/s²) from
the launcher's first frame, a1 and a2 lifting 1.5. a1 hit (the jelly's centre 0.2 m below the feet). a2 missed: the Courier started
rising 0.2 real s before the jelly, then floated while the jelly fell, 0.7-1.3 m below their feet at a2's strike.

**Proposal** (the engine is Calissa's, the numbers Dovina's, what `airborne` means to a slip jelly is the creature's own file):

| | what | numbers (computed, not yet run) |
| --- | --- | --- |
| A | **S + LMB tapped**: the launcher as now (the clip's own 0.92 m), the target lifted to the blade, not past it | lift about 5.5 m/s: apex 1.55 m at about 0.8 real s, as a1 cuts; its centre about 1.35 m above the feet, inside a1's 1.15-1.46 m |
| B | **S + LMB held**: Devil May Cry's High Time. The Courier is carried up with what they launched by the Launch tech (`courier/moves/launch.js`), from the launcher's strike end (0.28), at the target's speed and gravity; both rise together, the target a blade's height above; let go early and the rise stops | lift 9.5 kept: both to about 4.6 m; the target about 1.3 m above the feet |
| C | **Air blows keep the target at the blade**: each sets its vertical speed so it is back at blade height for the next strike (Devil May Cry's and Bayonetta's air hits reset the fall) | a1, a2 lift 4 to about 2 m/s (9.81 x 0.4 real s / 2); 4 throws it 0.8 m up for 0.8 real s |
| D | **The plunge takes it down**: the ring strikes only within about 1.5 m of the ground where it lands, or what the plunge cut in the air goes down with the Courier (the Helm Breaker) | plunge lift 5 to 0 |

The core movement is untouched: the jump stays 6.4 m/s at 21 m/s² (0.98 m). The rise in B is the move's, as the launcher's own
`xyz` rise already is. a2 into the plunge joins clean: the somersault is upright by 0.38 clip s (sheet `a2probe`).

## 4. Other changes the clips ask for

1. **j1, j2**: their chain windows open before their strikes end, so a quick press cuts each arc short (0.05 and 0.04 real s; the
   pause-2 sheet's j1 and j2 rows stop mid-strike). Open them at 0.53 and 0.66 clip s.
2. **t2** (Sond_ThrustCombo) has three speed peaks (0.21, 0.53, 0.66 clip s): the thrust is held out from 0.13 to 0.67 while the
   blade stabs. The strike covers only the first. Type its strike as 0.13-0.70 and give the row three hits (Dovina's).
3. **The counter** (Sond_SpinSlash) borrows the `combo3` row. Give it a row of its own, three or four hits.
4. **The dash and the charge release get no free cut** (`moveset.js:132` covers ground and pause strings only), so 1.15 and 1.52
   real s play out. Let them take the free cut at their rows' times (0.5, 1.3). The same goes for the plunge's 1.05 real s on landing.
5. **The Tidecutter's row says 1.4 real s**, but its strike comes at 1.80 and the clip runs 2.63, so the damage-a-second sum counts
   it short.
6. **No swap from the old packs.** UAL's swordA and swordB come with separate recovery clips (swordARec, swordBRec): the attack ends
   on its follow-through. That is the paid cut's shape in the prior art: the paid cut stops a Sond_ clip at its strike's end, like
   playing swordA without swordARec. The Sond_ suite reads as one Courier; the UAL clips are the old look.
7. **Sond_Flourish** (2.0 real s; its fast part 1.73-1.91) is in the suite but not used. It is a show, not a blow: a flourish after
   a fight, like the psygun's.

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

The sheets show each string played through the engine with the cutlass drawn and the other tools hidden, side-on, in the movement lab:
`sheet-ground`, `-pause1`, `-pause2`, `-charge`, `-launcher`, `-dash`, `-special`, and the probes `-a2probe` (a2's somersault) and
`-t2probe` (t2's flurry). They are in Calissa's scratchpad and not in the repo (`sondelass-chart/`, beside `strikes.json` and
`air.json`).

Not checked: nothing was watched at speed, only stills; the hit-stop is not in the tables; the variant carried the Courier from the
launcher's first frame, not its strike; A's 5.5 and C's 2 are worked out on paper, not run; only a slip jelly was used, so other
creatures may fall differently; t2's three stabs are read from speed peaks and stills, not frame by frame.
