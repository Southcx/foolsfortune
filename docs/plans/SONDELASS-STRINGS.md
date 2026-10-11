# The Sondelass's strings: a chart

Charted 2026-10-10 for the owner's markup; built the same day to the owner's rulings, Calissa (Art). The owner put the whole task in
Calissa's hands, the numbers in `src/progress/combat/moves.js` included (Dovina has a note: `docs/handoffs/dovina/`).

> "chart out combo strings for the Sondelass ... Draft from the clips in the base file. I think that the solution is going to be
> allowing the player to animation cancel their combo string's recovery time at the cost of Lachryma, so that the hits keep flowing
> if you're willing to spend resources. I also had issues with the aerial portion of the launch combo." (the owner, 2026-10-10)

How to read it. The cutlass's table is `MOVES`/`STRINGS` in `src/tools/sondelass/cutlass.js`, played by the one combo engine
(`src/tools/moveset.js`); each move's row (power, hits, time, cost, unlock) is in `src/progress/combat/moves.js`. Since 2026-10-11 the
string's normals and RMB's specials are the melee loadout's catalogue (`SONDELASS_MOVES`, `tools/sondelass/sondelassloadout.js`); the
catalogue's new moves carry their own numbers there (`stats`) until Dovina takes them into her table, charted in section 7. Times are **real
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
| launcher (S + LMB) | up | Sond_Launcher, whole body, rises its own 0.92 m | launcher: tapped, lift 5.5 (the feet to 1.13 m); held to its strike, High Time: they rise on an arc of their own to 3.92 m (2.2 x their height) whatever was struck, and it is lifted 9.2 to meet the blade (section 3c) | 0.17-0.28 | 0.55 (0.30-1.08) | 0.28-1.10 (held, to their arc's turn) | - | 0.28 | 0.27 |
| | a1 | Sond_AirCombo1 | juggle: flat cut, lift 1.2, push 0.5; their hang x0.3 | 0.03-0.24 | 0.35 (0.22-0.80) | 0.24-0.83 | - | 0.24 | 0.11 |
| | a2 | Sond_AirCombo2 | juggle: a somersault cut, lift 1.2, push 0.5; aimed 42 degrees; their hang x0.3 | 0.13-0.38 | 0.38 (0.36-1.00) | 0.38-1.03 | - | 0.38 | 0 |
| | a3 | Sond_AirPlunge, x1.25 | plunge: a chop (push 2, lift 0), falls at 30 m/s from 0.26 clip s; a 2.6 m ring on landing, near the ground only; staggers; the landing settles the body (the Courier's squash, 6 %) | a chop at 0.06-0.19, then the ring | - | 0.89 on the ground after landing | 0.6 after landing (new) | landing | 0.6 |
| dash (LMB sprinting) | dash | Sond_DashSlash, whole body, 2.3 m travel | opener and finisher alone: push 8 | 0.23-0.35 | - | 0.35-1.50 | at 0.50 (new) | 0.35 | 0.15 |
| RMB, the specials (the melee loadout: 2026-10-11) | stinger | the tap's slot (W + RMB the forward, S + RMB the back; empty: the tap's); Sond_Thrust held out, a 6 m lunge (launch.js), 6 Lachryma | special: pierces and throws | from the press, f+1 (was on release: a 100 ms tap, f+7) | - | - | - | from any blow's recovery (5 + 6) | - |
| crouched, hold RMB | iaido | the charge's pose (`stance:cutlassIaido`: Gun_QuickDraw, the blade along the belt past the left hip, the off hand at the guard); held 0.5 real s: blade mode | wind-up | - | - | - | - | from any blow's recovery (5) | - |
| | draw | let go before 0.5 s: Sond_Combo2 from 0.1 clip s, x1.4, the crouch's legs kept; no row yet (k x 1.1 = 1.54) | a rising cut from the left hip | 0.05-0.15 | - | 0.15-0.57 | - | 0.15 | - |
| E (the blink), any move | - | the blink cancel: the move let go on the blink's frame (`Moveset.blinkCancel`), the string's place kept | - | - | the next slot (within 0.9 real s of the blink) | none owed | - | - | - |
| special (R, 12 Lachryma) | tide | Sond_SpecialTidecutter, whole body | finisher: the 4.2 m ring at 1.86; its row's time now the clip's 2.63 | 1.80-1.94 | - | 1.94-2.63 | none (plays out) | 1.94 | 0.69 |
| counter (LMB from the guard) | spin | Sond_SpinSlash, whole body | 2.8 turns; its own row (`counter`: 0.8 x 4) | 0.20-0.94 | - | 0.94-1.70 | none (plays out) | 0.94 | 0.76 |

R (the special) still cuts any upper-body blow (c1-c3, t1, j1, j2) at any moment, for its 12 Lachryma; from a whole-body blow's
recovery it is the paid cut (5 + 12). The stinger (RMB) and the guard (V) wait until no blow is playing, or come at once from a
recovery for the paid cut (5 + the stinger's 6; 5 for the guard). Since 2026-10-11 (the melee loadout, MELEE-LOADOUT.md section 2) the
ground string's c1 to c4 and RMB's specials are the loadout's (`tools/sondelass/sondelassloadout.js`); RMB acts on the press, a press
inside a strike waits 0.35 real s for the free way, and crouched it is the iaido; E (the blink) lets any move go and keeps the string's
place.

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
| B | **S + LMB held** to the strike's start (0.17 real s): High Time (lift 9.5 then; 9.2 now, section 3b). From the strike's end the Courier **rides** what it launched (the `juggle`): its measured speed, and a pull (6 /s, at most 7 m/s) to 1.3 m below its centre and 1.4 m from it on the ground's plane; the launcher's last pose held till it falls at 3 m/s (0.3 s past its apex), 2.5 s at most | lift 9.5 |
| C | **The air blows ride it too**, held up by their own lift (a floor, never a ceiling: section 3b): the two hang alike whatever the target's own gravity (the engine never assumes one: it measures where the thing is each frame); out of reach (3.5 m), the old hang (gravity x0.12) | a1, a2 lift 2, push 0.5; a2 aimed 42 degrees |
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

Every air cut landed in both. Held, a1 at its free time (0.55) stopped the rise at about 2.6 m (its lift 2 replaced the 9.5; fixed in 3b): the 4.6 m
of the paper plan comes only if a1 waits for the apex. The core movement is untouched: the jump stays 6.4 m/s at 21 m/s² (0.98 m);
the rise is the move's, as the launcher's own `xyz` rise already was.

## 3b. High Time's height, and the plunge's settle (the owner, 2026-10-10, the second pass)

> "We'll hammer out the High Time/ launcher behavior since it feels like there isn't enough height distance covered, like my intuition
> says it should launch the courier about 2.2x their own height." ... "it's okay to use a small amount of squash and stretch on the
> Courier for settling after impacts like the plunge attack, just to convey a little more sense of weight." (the owner, 2026-10-10)

The height: 2.2 x 1.78 m (the Courier to the top of the head) = 3.92 m, to the feet. What stopped it (casebook, "High Time stopped at
2.6 m"): a1, pressed on at its free time, laid its lift 2 on a jelly still rising at about 6 m/s and the climb ended there. Now an air
blow's lift is a floor (`blow()`, `tools/moveset.js`: what still rises faster keeps its rise; rule 187), and the held lift is 9.2: the
Courier rides 1.3 m under the jelly's centre, 0.45 m under its base, so its base must reach 4.37 m; 9.2 m/s gives 4.31 at 9.81, and a2's
lift at the top the rest. The tapped launcher, the air blows' rows and the plunge are unchanged; so is the core movement's jump.

Measured in the juggle pen (the combat wing), a slip jelly 1.9 m ahead, S + LMB held, then LMB every 0.1 real s, the pool empty (the
free grammar); heights above the floor, the gap the jelly's centre above the Courier's feet:

| moment | before: real s, feet, gap | after: real s, feet, gap |
| --- | --- | --- |
| the launcher strikes | 0.22, 0.19, 0.63 (lift 9.5) | 0.22, 0.19, 0.63 (lift 9.2) |
| a1 hits | 0.78, 2.43, 1.20: the rise ends here | 0.78, 2.32, 1.20: rising on (it keeps its 5.4 m/s) |
| a2 hits | 1.43, 2.23, 1.27 | 1.43, 3.75, 1.27 |
| the top | 1.13, **2.57** | 1.80, **3.93** (no press after the launcher: 3.80 at 1.35) |
| a3's chop hits | 1.95, 2.34, 1.28 | 1.95, 3.86, 1.28 |
| the plunge lands | 2.52, from 2.3 m | 2.58, from 3.25 m at 26 m/s: 9 frames, 0.15 s |
| the jelly lands | 2.83, 1.5 m off | 3.02, 1.8 m off (overhead at the ring, out of it); c1 at 3.22 hits it |
| tapped (unchanged) | a1 0.78 / a2 1.43 / a3 1.95: feet 1.05 / 0.76 / 0.88, gaps 1.11 / 1.26 / 1.26; top 1.13 | the same to the centimetre |

The rhythm is the one it was: the blows hit at the same real seconds, a1 on the way up, a2 and the chop at the top (about 0.9 s of hang
between the two, held by the blows' lift 2 and a 0.2 s hit-stop at the chop), then the drop; the higher top costs the plunge 0.06 s more
fall. No hang was changed. The plunge's fall stays 26 m/s (constant from 0.32 clip s): from 3.25 m it is 9 frames, fast; the weight is
the landing's.

**The settle** (`src/courier/anim/squash.js`, the Courier's squash): a landing past 9 m/s (where the hard landing begins) presses the
drawn body down and out, the volume kept (width 1/sqrt of the height's scale), on a critically damped spring (omega 20 /s): deepest
0.05 s after the landing, under 0.25 % left at 0.3 s, no overshoot. How deep is how hard: 6 % at the plunge's 26 m/s, 30 % of that at 9
m/s, in line between. Measured: the plunge 6.0 % (the head 7.8 cm lower than the same landing without it, at +2 frames); a 2.2 m drop
(9.4 m/s) 1.9 %; a 4 m drop (13 m/s) 2.8 %; the brush's air slam (18 m/s) 4.0 %, held through its hit-stop (the spring keeps the body's
clock, the game's, as the pose does). A jump's own landing (6.4 m/s) none. Laid on after everything has read the pose (the end of the
tick) and lifted before anything reads it (the start of the next): the capsule, the camera, every collision, the hinges and rom.js see
the body as posed; a drawn tool and the psygun move with the hand and keep their shape. Not in first person. Prior art: the twelve
principles' squash and stretch, Super Mario 64's landing squash, Ratchet & Clank's, a critically damped spring (Holden's "Spring-It-On").

## 3c. High Time on its own arc, and the air string tightened (the owner, 2026-10-11)

> "As for High time and the air combos, I think they're a little too floaty, also the launcher is linked to chasing the target it hits,
> so the action breaks when attempting to use it on the Strawman." (the owner, 2026-10-11)

What was built (`tools/moveset.js`: `HIGH`, `leap()`, `rise()`; `tools/sondelass/cutlass.js`'s table; casebook, "High Time chased what
it struck", rule 192):

- **The rise is theirs.** From the launcher's strike end (held), a ballistic arc to 3.92 m over the ground they left, at 14.7 m/s²
  (x0.7 the core's 21): the top 0.71 s after the strike's end. The launcher's last pose holds till that arc turns over (3 m/s down). An
  air blow begun on the way up keeps the arc to its top, so a press never stops or stretches the rise. Whatever was struck, or nothing.
- **What can be lifted meets the blade** (9.2, as before); the ride (1.3 m under its centre) is laid on only past the top, and only on
  a thing seen to rise (0.1 m in 0.2 s); what took the hit and stayed put (Strawman) is let go, and the air string plays over it, or
  strikes it if it is tall enough (a paid cut into a1 struck Strawman on the way up).
- **Tighter:** a1's and a2's hang x0.3 (6.3 m/s², was x0.12, 2.5) where nothing is ridden; their lift on what they ride 1.2 (was 2),
  so the pair sinks about 0.3 m a blow instead of holding level; the plunge's wind-up at 1.25x to 0.26 clip s (the chop's end; was 1x
  to 0.32) and its fall 30 m/s (was 26). The tapped launcher, the core jump and the rows of `moves.js` are unchanged.

Measured (the combat wing, the pool empty so only the free grammar plays; S + LMB held, then LMB every 0.1 real s; heights the feet
above the floor; real s from the press, hit-stops included):

| | before | after |
| --- | --- | --- |
| a slip jelly (the juggle pen): the top | 3.93 m at 1.80 s, riding it (3.80 at 1.35 with no press) | 3.92 m at 1.35 s (1.17 with no press) |
| the jelly: a1 / a2 / the chop hit, feet and gap | 0.78 s 2.32 m 1.20 / 1.43 s 3.75 m 1.27 / 1.95 s 3.86 m 1.28 | 0.78 s 2.90 m 0.62 / 1.43 s 3.92 m 1.10 / 1.93 s 3.66 m 1.25 |
| the jelly: the launcher to the plunge's landing | 2.58 s (from 3.83 m) | 2.45 s (from 3.66 m) |
| Strawman (the sparring circle): the top | 0.43 m: the ride held them on the ground | 3.92 m at 1.17 s |
| Strawman: the air string | a1, a2 and the chop on the ground | a1 and a2 over its head, the plunge from 3.82 m lands at 1.85 s, its ring strikes it |
| Strawman, no press after: the launcher's last pose | frozen 1.42 s on the ground | 0.08 s at the top |
| nothing struck | 1.08 m (no ride: the clip's rise) | 3.92 m at 0.97 s; the plunge lands at 1.68 s |
| tapped, a jelly (unchanged launcher) | a1 / a2 / chop at 1.05 / 0.76 / 0.88 m; lands 2.47 s | 1.05 / 0.71 / 0.62 m (sinking); lands 2.38 s |
| the hang where nothing is ridden | x0.12 (2.5 m/s²) | x0.3 (6.3 m/s²) |

Every air blow lands on the jelly, held and tapped. The paid cut keeps working through it (pool 100, LMB every 2 frames): from the
launcher's recovery into a1 at 0.47 s (the arc kept: 3.92 m), from a1 into a2 at 0.93 s, from the plunge's landing at 2.1 s into the
ground string; the free recovery cut after the landing at the row's 0.6 s. No row of `moves.js` changed, so its 2.9 power a second
over the air string (on the rows' times) stands; in real time, hit-stops and all, the string's 4.7 power (the launcher's with it) took
2.58 s on a jelly and takes 2.45 (1.8 to 1.9 a second).

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
against a slip jelly, every 0.1 s, side-on); the second pass's in `hightime-squash/`: `sheet-arc-b` (High Time's arc, a fixed side
camera, the heights graphed and labelled) and `sheet-land-b` (the plunge's landing frame by frame, the squash on and off in pairs, its
curve graphed); the 2026-10-11 pass's in `melee-p1a/hightime/`: `sheet-arc-jelly-before`, `-after`, `sheet-arc-strawman-before`,
`-after` (High Time against a slip jelly and against Strawman, a fixed side camera, the heights graphed and labelled). None are in the repo.

Not checked: nothing was watched at speed, only stills; the hit-stop is not in the tables; only a slip jelly was juggled (a clapperjar
rides the same way in code, untried); a2 and t2 aimed off their targets were seen side-on only, not from the front; the paid cut from
the launcher (into a1 at once, which stops the rise early) and from the air string was not measured; the feel of the price is the
owner's.

## 7. The catalogue (the melee loadout, phase 3: 2026-10-11, Calissa)

> "I want to really expand and bulletproof the Sondelass melee combo system. I was thinking about something like the game God Hand for
> ps2 where you can essentially build out your combo kit yourself." (the owner, 2026-10-11)

Twelve normals (a string slot each) and six specials (RMB tapped, with W, with S), Dovina's slice. Every clip is the packs' own: UAL
Standard's split swings (swordA/B with their recoveries, swordC, swordHeavy's first cut, the melee hook) and the Courier's suite (Sond_,
Fist_); none authored. Each was judged from the front and the side with every other tool off (the sheets, section 7c). A fist or a foot
is measured on itself (`limb`, `tip`) and reaches a hand's width past it (`reach` 0.35), not a blade's (0.80); a kick or a shove leaves
no ribbon. **Range** is the farthest the measured tip goes in the strike plus what the sweep adds: what the card shows. Times are real
seconds from the blow's start (the clip's at its rate); "next" is when the next slot may begin (the later of its chain window and its
row's time; in the last slot, its free cut); "row/s" is its power over its time, hit-stops out (today's string: 2.73); "meas/s" is
measured (7b), hit-stops in (today's blows: 1.94).

### 7a. The chart

| | move (id) | label | clip, rate, part | wind-up | strike | next | recovery to | power x hits | range | effect (status) | parent | row/s | meas/s |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| N | c1 | Slash | Sond_Combo1 x1.1, 0-0.85 | 0-0.06 | 0.06-0.25 | 0.42 | 0.77 | 1.2 | 2.3 | stagger | (known) | 2.86 | 1.94 |
| N | c2 | Rising Slash | Sond_Combo2 x1.1, 0-0.90 | 0-0.15 | 0.15-0.28 | 0.46 | 0.82 | 1.3 | 2.5 | stagger | (known) | 2.83 | 1.95 |
| N | c3 | Hop Slash | Sond_Combo3 x1.1, 0-1.05 | 0-0.36 | 0.36-0.43 | 0.50 | 0.95 | 1.4 | 2.4 | stagger | (known) | 2.80 | 2.00 |
| N | c4 | Leap Strike | Sond_Combo4 x1, whole | 0-0.33 | 0.33-0.41 | 0.78 | 1.70 | 2.0 | 2.9 | knock (push 6) | (known) | 2.56 | 1.94 |
| N | quickSlash | Quick Slash | swordA x1, then swordARec | 0-0.17 | 0.17-0.31 | 0.34 | 0.43 (+0.75 rec) | 1.0 | 2.4 | stagger | c1 | 2.94 | 1.93 |
| N | backhand | Backhand | swordB x1, then swordBRec | 0-0.20 | 0.20-0.31 | 0.38 | 0.53 (+0.75 rec) | 1.1 | 2.6 | stagger | c2 | 2.89 | 1.94 |
| N | lungeSlash | Lunge Slash | meleeHook x0.9, whole; its 0.24 m and a step of 0.78 m | 0-0.26 | 0.26-0.31 | 0.50 | 0.52 | 1.4 | 3.0 | stagger (push 2) | c3 | 2.80 | 2.00 |
| N | heavyChop | Heavy Chop | swordC x1.2, whole, 0-1.45 | 0-0.50 (a hop) | 0.50-0.59 | 0.92 | 1.21 | 2.4 | 2.6 | knock (push 7; stagger) | c4 | 2.61 | 2.09 |
| N | guardBreak | Guard Break | Fist_Shove x1.1, whole, 0-0.85; both hands | 0-0.12 | 0.12-0.19 | 0.42 | 0.77 | 1.1 | 1.6 | guard break (push 5; stagger) | c2 | 2.62 | 1.78 |
| N | pushKick | Push Kick | Fist_Kick x1.1, whole, 0-1.05; the left foot, its strike typed 0.40-0.62 clip s | 0-0.36 | 0.36-0.56 | 0.60 | 0.95 | 1.45 | 1.7 | knock (push 7) | c4 | 2.42 | 1.81 |
| N | lowSweep | Low Sweep | swordHeavy x1.1, whole, 0-1.05 | 0-0.33 | 0.33-0.49 | 0.55 | 0.95 | 1.35 | 2.7 | launch (lift 3; trip) | c3 | 2.45 | 1.80 |
| N | bodyBlow | Body Blow | Fist_Combo1 x1.15, 0-0.60; the left fist | 0-0.06 | 0.06-0.15 | 0.30 | 0.52 | 0.9 | 1.6 | stagger (push 1.5) | c1 | 3.00 | 1.86 |
| S | stinger | Stinger | Sond_Thrust held out, a 6 m lunge (cutlass.js) | 0 | from f+1 | - | 0.38 | 3.0 (6.6 to a creature) | 8 | knock | (known) | 4.29 | 17.2 |
| S | spinSlash | Spin Slash | Sond_SpinSlash x1.15, whole, 0-1.35 | 0-0.17 | 0.17-0.82, four cuts | - | 1.17 | 0.85 x 4 | 2.4 | knock (push 5), all round | backhand | 2.91 | 1.79 |
| S | powerSlash | Power Slash | Sond_ChargeRelease x1, whole, 0-1.2 | none: the charge skipped | 0.00-0.11 | - | 1.20 | 3.0 | 2.5 | knock (push 9) | heavyChop | 2.50 | 2.07 |
| S | risingCut | Rising Cut | Fist_Uppercut x1, whole, the hop's 0.38 m carried (`root: 'xyz'`), 0-0.9 | 0-0.23 | 0.23-0.34 | - | 0.90 | 2.3 | 2.0 | launch (lift 8; airborne) | quickSlash | 2.56 | 2.03 |
| S | guardCrush | Guard Crush | Sond_Thrust x0.9, whole; its 0.45 m and a step of 0.5 m | 0-0.19 | 0.19-0.27 | - | 1.11 | 2.8 | 2.7 | guard break (push 5; stagger) | stinger | 2.52 | 2.07 |
| S | backstepSlash | Backstep Slash | Sond_Combo3 x1.1, whole; a step back of 1.14 m through its hop (0.27-0.50) | 0-0.36 | 0.36-0.43 | - | 1.00 | 2.5 | 2.1 (from the press: 2.2 misses) | stagger (push 3) | c3 | 2.50 | 2.06 |

Costs: the stinger 6, Spin Slash 8, Power Slash 8, Rising Cut 6, Guard Crush 6, Backstep Slash 5 (Lachryma, spent on the press; from a
blow's recovery the paid cut's 5 with it, as the stinger). Every normal plays in every slot: a chain window for when it is not the last
(c4's added, read only there), a row time for its free cut when it is. The jobs: Quick Slash and Backhand the fast pokes, Body Blow the
quickest and shortest, Lunge Slash the reach, Heavy Chop the finisher that pays in time, Guard Break and Push Kick and Low Sweep the
ones that do more to a body and pay in power; Spin Slash clears round, Power Slash is the charge without the hold, Rising Cut launches,
Guard Crush opens a guard from range, Backstep Slash gets out (1.14 m back, most of it after the cut has begun: a slip jelly 1.0 to
2.2 m ahead is struck alike; the first try stepped back from 0.15 clip s and missed one 2.2 m ahead).

**A guard break** (`hit.guardBreak`, `tools/moveset.js`): the thing struck is asked `breakGuard(point, dir, by)` before the blow lands,
so that blow goes through. Strawman (on guard, the sparring circle's lectern) throws its sleeves wide and keeps them open 1.0 s of the sim clock (its windups' clock: real seconds less any hit-stop)
(`GUARD_OPEN`, `world/testroom/room.js`; the look `S.open(t)`, `vfx/strawman.js`): measured, Slash blocked, Guard Break 1.1 through,
Hop Slash 1.4 through; Guard Crush 2.8 through. Nothing else guards yet; on a slip jelly it is its stagger.

**Engine support** (`tools/moveset.js`, built once): a catalogue row's own `stats` where no `rule` names a row (the same shape as
moves.js's); a move's own `reach` past its measured tip; `ribbon: false`; `step: { v, at }` (a whole-body move's own step along the
facing, back when negative, a forward one cut short as the travel is so it never goes through what it is aimed at); `hit.guardBreak`.
The cutlass's RMB already played any special a slot holds (phase 2): nothing changed there.

### 7b. The row rule, measured

Dovina's rule: whatever the loadout holds, the string's power a real second stays within 15% of today's default string. Measured
headless in the combat wing's juggle pen: a slip jelly 1.9 m ahead, put back in place and made whole every frame (so every blow can land
and nothing bursts it), LMB every 0.1 real s, the pool held empty (the free grammar), hit-stops in; the power handed to
`creatures.strike` summed over two whole cycles, from the second opener to the fourth.

Today's default: **1.956 power a real second** (5.9 power, 3.017 s a cycle; 2.73 on its rows, hit-stops out).

| loadout | cycle s | power | power/s | vs today |
|---|---|---|---|---|
| c1, c2, c3, c4 (today's) and its six swaps | 3.017 | 5.90 | 1.956 | 0.0% |
| Quick Slash in slot 1 / 2 / 3 / 4 | 2.933 / 2.883 / 2.833 / 2.533 | 5.7 / 5.6 / 5.5 / 4.9 | 1.943 / 1.942 / 1.941 / 1.934 | -0.7 / -0.7 / -0.8 / -1.1% |
| Backhand in slot 1 / 2 / 3 / 4 | 2.983 / 2.917 / 2.867 / 2.583 | 5.8 / 5.7 / 5.6 / 5.0 | 1.944 / 1.954 / 1.953 / 1.935 | -0.6 / -0.1 / -0.2 / -1.1% |
| Lunge Slash in slot 1 / 2 / 3 / 4 | 3.100 / 3.050 / 3.000 / 2.717 | 6.1 / 6.0 / 5.9 / 5.3 | 1.968 / 1.967 / 1.967 / 1.951 | +0.6 / +0.6 / +0.6 / -0.3% |
| Heavy Chop in slot 1 / 2 / 3 / 4 | 3.550 / 3.500 / 3.467 / 3.150 | 7.1 / 7.0 / 6.9 / 6.3 | 2.000 / 2.000 / 1.990 / 2.000 | +2.2 / +2.2 / +1.7 / +2.2% |
| Guard Break in slot 1 / 2 / 3 / 4 | 3.008 / 2.958 / 2.917 / 2.600 | 5.8 / 5.7 / 5.6 / 5.0 | 1.928 / 1.927 / 1.920 / 1.923 | -1.4 / -1.5 / -1.8 / -1.7% |
| Push Kick in slot 1 / 2 / 3 / 4 | 3.192 / 3.142 / 3.100 / 2.817 | 6.15 / 6.05 / 5.95 / 5.35 | 1.927 / 1.926 / 1.919 / 1.899 | -1.5 / -1.5 / -1.9 / -2.9% |
| Low Sweep in slot 1 / 2 / 3 / 4 | 3.150 / 3.100 / 3.050 / 2.750 | 6.05 / 5.95 / 5.85 / 5.25 | 1.921 / 1.919 / 1.918 / 1.909 | -1.8 / -1.9 / -1.9 / -2.4% |
| Body Blow in slot 1 / 2 / 3 / 4 | 2.883 / 2.833 / 2.783 / 2.500 | 5.6 / 5.5 / 5.4 / 4.8 | 1.942 / 1.941 / 1.940 / 1.920 | -0.7 / -0.8 / -0.8 / -1.8% |
| the four slowest: Guard Break, Low Sweep, Push Kick, Body Blow | 2.658 | 4.80 | 1.806 | -7.7% |
| the four quickest: Heavy Chop, Lunge Slash, Quick Slash, Backhand | 2.983 | 5.90 | 1.978 | +1.1% |
| a mix: Quick Slash, Body Blow, Guard Break, Heavy Chop | 2.800 | 5.40 | 1.929 | -1.4% |

Each blow on its own is inside the band too (meas/s in 7a, -8.8% Guard Break to +6.7% Heavy Chop against today's blows' 1.94; on the
rows, -11.5% Push Kick to +9.8% Body Blow against 2.73), so any four, and any eight, stay inside it: a string's rate is its blows'
rates weighed by their times. The first run had Push Kick at -10.7% in the last slot (its foot's measured strike ran to 0.91 clip s, and
the free cut waited for it; typed to the extension, 0.40-0.62) and Guard Break, Low Sweep and Body Blow at -15% to -18% as blows; their
power went up 0.1 to 0.15.

The specials, from rest (RMB tapped, the slot the tap's; its own time from the press to the Courier free; a slip jelly 2.2 m ahead,
Backstep Slash's 1.4 m, the same at 1.0, 1.8 and 2.2):

| special | cost | power | own s | power/s | vs today's string |
|---|---|---|---|---|---|
| Spin Slash | 8 | 3.4 (0.85 x 4) | 1.900 | 1.789 | -8.5% |
| Power Slash | 8 | 3.0 | 1.450 | 2.069 | +5.8% |
| Rising Cut | 6 | 2.3 | 1.133 | 2.029 | +3.7% |
| Guard Crush | 6 | 2.8 | 1.350 | 2.074 | +6.0% |
| Backstep Slash | 5 | 2.5 | 1.217 | 2.055 | +5.1% |
| the stinger (today's) | 6 | 6.6 | 0.383 | 17.2 | +780% |

A special does a bigger single thing for its Lachryma (all its power in one go and what it does to a body), never more power a second:
moves.js's own rule ("a special is a burst that costs Lachryma, not a free raise"), as the Tidecutter's 7 in 2.63 s (2.66 on its row).
**The stinger is outside the band, and was before phase 3**: its lunge strikes a creature at 2.2 x its row's 3.0 (`cutlass.js`
`stingStep`), 6.6 in 0.38 s, where its row says 3.0 in 0.7 s (4.29 a second, +57% on paper). Left as it is (the default plays as it
did); Dovina's to rule (`docs/handoffs/dovina/2026-10-11-from-calissa-catalogue.md`).

The default plays today's string to the frame: phase 2's probe (`string.mjs`: free LMB every 6 frames, paid every 2, the held launcher's
air string, the pause branch, the stinger), every blow's begin, hit and cut on the same frame as phase 2's `string-after.json`.

**Measured again after the repair (2026-10-11).** The table above put one new move in a four-slot string. The verifiers' wider measure
(random loadouts of 4 to 8 slots, and one move in every slot) found whole-body blows walking through the jelly and round Strawman
(casebook NEW:travel-cut-to-the-peak). Repaired, by the same measure: the 30 loadouts of seed 7 are -6.2% to +3.1% against both a
pinned slip jelly and Strawman, and every normal alone in 4 and 8 slots (same on both):

| alone, 4 or 8 slots | c1 | c2 | c3 | c4 | Quick Slash | Backhand | Lunge Slash | Heavy Chop | Guard Break | Push Kick | Low Sweep | Body Blow |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| vs today | -0.5% | -0.3% | -0.2% | +0.6% | -4.1% | -3.6% | -0.2% | +6.7% | -8.8% | -7.4% | -8.0% | -4.8% |

### 7c. The sheets, and what was not checked

In Calissa's scratchpad (`p3/moves/`): `sheet-normals` and `sheet-specials` (each new move at its wind-up, strike, the strike's middle and
end, and its recovery, front and side, every other tool off), `sheet-guardbreak` (Strawman on guard: Slash blocked, the shove, the
sleeves thrown open, Hop Slash through), `sheet-dps` (7b as an image), `sheet-survey1` to `-3` (the candidates: swordA/B/C, swordAtk,
swordHeavy, swordDash, the melee hook, the suite's kicks and fists, Vane_SpinSweep). None are in the repo.

Not checked: nothing was watched at speed, only stills; a pinned jelly is not a fight (a knock or a launch sends a free one out of the
next blow's reach: Push Kick, Heavy Chop, Low Sweep and Rising Cut pay for that in play, more than the table says); Fist_Sweep was passed
over for Low Sweep (its body lies on the floor, and the worn tools would lie through it); the clapperjars and pots take the play's
`hit.power` and `dmg`, not measured; W + RMB and S + RMB were tried standing (the forward and back slots), not running; the paid cut into a new special once
(Spin Slash from c1's recovery: 5 + 8), not out of each new move; the feel is the owner's.

